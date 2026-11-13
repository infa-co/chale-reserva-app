// Receives messages sent to the Ordomo WhatsApp number (Meta Cloud API webhook).
// Flow: verify Meta's signature -> de-duplicate -> find the account linked to the sender ->
// check the plan -> either execute a pending confirmation or hand the message to the assistant.
import Anthropic from 'npm:@anthropic-ai/sdk@^1.8.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.119.0';
import { executePending, runAssistant, type HistoryTurn, type PendingAction, type UserContent } from '../_shared/assistant.ts';
import { todayInSaoPaulo } from '../_shared/bookingRules.ts';
import { listProperties } from '../_shared/bookingService.ts';
import { transcribeAudio, transcriptionConfigured } from '../_shared/transcription.ts';
import { planAllows, resolveUserAccess } from '../_shared/userAccess.ts';
import { downloadMedia, sendButtons, sendText, toBase64, whatsappConfigured } from '../_shared/whatsappApi.ts';
import { extractLinkCode, isNo, isYes, normalizePhone, safeEqual, sha256Hex, validMetaSignature } from '../_shared/whatsappText.ts';

// deno-lint-ignore no-explicit-any
type Admin = any;
// deno-lint-ignore no-explicit-any
type WaMessage = any;

const HISTORY_TURNS = 16;
const HISTORY_IDLE_MINUTES = 120;
const MESSAGES_PER_HOUR = 60;
const PLAN_REFRESH_HOURS = 6;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const HELP = 'Sou o assistente do Ordomo. Para usar, abra o app em Configurações > WhatsApp do Ordomo, toque em "Vincular meu WhatsApp" e envie aqui a mensagem com o código.';

function log(step: string) {
  console.log(`[WHATSAPP] ${step}`);
}

/** First message from an unknown number: it may carry the link code shown in the app. */
async function tryLink(admin: Admin, phone: string, text: string, messageId: string): Promise<void> {
  const since = new Date(Date.now() - 3600000).toISOString();
  const { count: failures } = await admin.from('whatsapp_events').select('wa_message_id', { count: 'exact', head: true })
    .eq('phone', phone).eq('kind', 'link_fail').gte('received_at', since);
  if ((failures ?? 0) >= 5) return; // too many wrong codes: stay silent

  const code = extractLinkCode(text);
  if (code) {
    const { data: row } = await admin.from('whatsapp_links').select('user_id, link_code_expires_at')
      .eq('link_code_hash', await sha256Hex(code)).maybeSingle();
    if (row && row.link_code_expires_at && Date.parse(row.link_code_expires_at) > Date.now()) {
      // A number belongs to one account at a time.
      await admin.from('whatsapp_links').update({ phone: null, linked_at: null }).eq('phone', phone);
      const now = new Date().toISOString();
      const { error } = await admin.from('whatsapp_links')
        .update({ phone, linked_at: now, last_inbound_at: now, link_code_hash: null, link_code_expires_at: null })
        .eq('user_id', row.user_id);
      if (!error) {
        await admin.from('whatsapp_conversations').delete().eq('user_id', row.user_id);
        log('number linked');
        await sendText(phone, 'Pronto, seu WhatsApp está vinculado ao Ordomo.\n\nAgora é só me mandar as reservas por texto, foto ou áudio. Exemplos:\n- "Reserva para João Silva, 20 a 23 de dezembro, R$ 900 no Pix"\n- "O chalé está livre no réveillon?"\n- "Quem chega amanhã?"\n\nEu sempre mostro um resumo e só salvo depois do seu "sim".');
        return;
      }
    }
    await admin.from('whatsapp_events').update({ kind: 'link_fail' }).eq('wa_message_id', messageId);
    await sendText(phone, 'Esse código não é válido ou já expirou. Gere um novo no app, em Configurações > WhatsApp do Ordomo.');
    return;
  }

  // Unknown number without a code: explain once in a while, never in a loop.
  const { count: recent } = await admin.from('whatsapp_events').select('wa_message_id', { count: 'exact', head: true })
    .eq('phone', phone).gte('received_at', since);
  if ((recent ?? 0) <= 2) await sendText(phone, HELP);
}

/** The plan this account has right now, refreshing it from Stripe when the stored one is old. */
async function currentPlan(admin: Admin, userId: string): Promise<string | null> {
  const { data: access } = await admin.from('user_access').select('plan_checked_at').eq('user_id', userId).maybeSingle();
  const checkedAt = access?.plan_checked_at ? Date.parse(access.plan_checked_at) : 0;
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (stripeKey && Date.now() - checkedAt > PLAN_REFRESH_HOURS * 3600000) {
    try {
      const { data } = await admin.auth.admin.getUserById(userId);
      if (data?.user) await resolveUserAccess(admin, { id: data.user.id, email: data.user.email, created_at: data.user.created_at }, stripeKey);
    } catch {
      log('plan refresh failed; using stored plan');
    }
  }
  const { data: plan } = await admin.rpc('effective_plan_for', { _user_id: userId });
  return typeof plan === 'string' ? plan : null;
}

/** Turns one WhatsApp message into what the assistant reads, plus the line kept in history. */
async function readMessage(message: WaMessage): Promise<{ content: UserContent; historyText: string; plainText?: string } | { reply: string }> {
  switch (message.type) {
    case 'text': {
      const text = String(message.text?.body ?? '').trim().slice(0, 6000);
      if (!text) return { reply: 'Não recebi nenhum texto. Pode mandar de novo?' };
      return { content: [{ type: 'text', text }], historyText: text, plainText: text };
    }
    case 'interactive': {
      const reply = message.interactive?.button_reply ?? message.interactive?.list_reply;
      const text = reply?.id === 'confirm' ? 'sim' : reply?.id === 'cancel' ? 'não' : String(reply?.title ?? '').trim();
      if (!text) return { reply: 'Não entendi a resposta. Pode escrever?' };
      return { content: [{ type: 'text', text }], historyText: text, plainText: text };
    }
    case 'button': {
      const text = String(message.button?.text ?? '').trim();
      if (!text) return { reply: 'Não entendi a resposta. Pode escrever?' };
      return { content: [{ type: 'text', text }], historyText: text, plainText: text };
    }
    case 'image': {
      const media = await downloadMedia(String(message.image?.id ?? ''));
      if (!media || !IMAGE_TYPES.includes(media.mimeType)) return { reply: 'Não consegui abrir essa imagem. Tente enviar de novo como foto (JPG ou PNG).' };
      const caption = String(message.image?.caption ?? '').trim().slice(0, 2000);
      return {
        content: [
          { type: 'image', source: { type: 'base64', media_type: media.mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif', data: toBase64(media.bytes) } },
          { type: 'text', text: caption || 'O dono enviou esta imagem sem legenda. Veja o que ela contém e ajude com a reserva correspondente.' },
        ],
        historyText: caption ? `[imagem enviada] ${caption}` : '[imagem enviada]',
      };
    }
    case 'audio': {
      if (!transcriptionConfigured()) return { reply: 'Ainda não consigo ouvir áudios por aqui. Pode mandar por texto?' };
      const media = await downloadMedia(String(message.audio?.id ?? ''));
      const transcript = media ? await transcribeAudio(media.bytes, media.mimeType) : null;
      if (!transcript) return { reply: 'Não consegui entender o áudio. Pode repetir ou mandar por texto?' };
      return { content: [{ type: 'text', text: `[Áudio transcrito automaticamente]\n${transcript}` }], historyText: `[áudio] ${transcript}`, plainText: transcript };
    }
    default:
      return { reply: 'Por enquanto entendo texto, foto e áudio. Pode mandar de um desses jeitos?' };
  }
}

async function handleMessage(admin: Admin, message: WaMessage): Promise<void> {
  const phone = normalizePhone(String(message.from ?? ''));
  const messageId = String(message.id ?? '');
  if (!phone || !messageId) return;

  // Meta retries deliveries; the primary key makes each message count once.
  const { error: duplicate } = await admin.from('whatsapp_events').insert({ wa_message_id: messageId, phone });
  if (duplicate) return;

  const { data: link } = await admin.from('whatsapp_links').select('user_id').eq('phone', phone).maybeSingle();
  if (!link) {
    await tryLink(admin, phone, message.type === 'text' ? String(message.text?.body ?? '') : '', messageId);
    return;
  }
  const userId: string = link.user_id;
  await admin.from('whatsapp_links').update({ last_inbound_at: new Date().toISOString() }).eq('user_id', userId);

  const plan = await currentPlan(admin, userId);
  if (plan === 'none' || plan === null) {
    await sendText(phone, 'Sua assinatura do Ordomo não está ativa. Abra o app para regularizar e voltar a usar o WhatsApp.');
    return;
  }
  if (!planAllows(plan, 'whatsapp')) {
    await sendText(phone, 'O WhatsApp do Ordomo faz parte dos planos Pro e Premium. Você pode mudar de plano no app, em Configurações.');
    return;
  }

  const { count: lastHour } = await admin.from('whatsapp_events').select('wa_message_id', { count: 'exact', head: true })
    .eq('phone', phone).gte('received_at', new Date(Date.now() - 3600000).toISOString());
  if ((lastHour ?? 0) > MESSAGES_PER_HOUR) {
    if (lastHour === MESSAGES_PER_HOUR + 1) await sendText(phone, 'Recebi muitas mensagens em pouco tempo. Aguarde alguns minutos e tente de novo.');
    return;
  }

  const read = await readMessage(message);
  if ('reply' in read) {
    await sendText(phone, read.reply);
    return;
  }

  const { data: conversation } = await admin.from('whatsapp_conversations').select('history, pending_action, updated_at').eq('user_id', userId).maybeSingle();
  const fresh = conversation?.updated_at && Date.now() - Date.parse(conversation.updated_at) < HISTORY_IDLE_MINUTES * 60000;
  let history: HistoryTurn[] = fresh && Array.isArray(conversation.history) ? conversation.history : [];
  let pending: PendingAction | null = fresh ? conversation.pending_action ?? null : null;
  if (pending && Date.parse(pending.expires_at) < Date.now()) pending = null;

  const save = async (turns: HistoryTurn[], nextPending: PendingAction | null) => {
    let trimmed = turns.slice(-HISTORY_TURNS);
    while (trimmed.length > 0 && trimmed[0].role !== 'user') trimmed = trimmed.slice(1);
    await admin.from('whatsapp_conversations').upsert(
      { user_id: userId, history: trimmed, pending_action: nextPending, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
  };

  // A pending proposal is settled here, by code: "sim" executes it, "não" drops it.
  if (pending && read.plainText) {
    if (isYes(read.plainText)) {
      const outcome = await executePending(admin, userId, pending);
      await save([...history, { role: 'user', text: read.historyText }, { role: 'assistant', text: outcome }], null);
      await sendText(phone, outcome);
      return;
    }
    if (isNo(read.plainText)) {
      const outcome = 'Certo, não salvei nada.';
      await save([...history, { role: 'user', text: read.historyText }, { role: 'assistant', text: outcome }], null);
      await sendText(phone, outcome);
      return;
    }
    // Anything else (a correction, a new request) replaces the proposal.
    history = [...history, { role: 'assistant', text: '(A proposta anterior não foi confirmada e foi descartada.)' }];
    pending = null;
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    log('ANTHROPIC_API_KEY missing');
    await sendText(phone, 'O assistente está temporariamente indisponível. Tente de novo mais tarde.');
    return;
  }

  const properties = await listProperties(admin, userId);
  const now = new Date();
  let result;
  try {
    result = await runAssistant({
      client: new Anthropic({ apiKey }),
      admin, userId, properties,
      today: todayInSaoPaulo(now),
      weekday: new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long' }).format(now),
      history, content: read.content,
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) log('assistant rate limited');
    else if (error instanceof Anthropic.AuthenticationError) log('assistant credentials rejected');
    else if (error instanceof Anthropic.APIError) log(`assistant API error ${error.status}`);
    else log('assistant failed');
    await sendText(phone, 'Tive um problema para processar sua mensagem. Pode tentar de novo em instantes?');
    return;
  }

  if (result.proposal) {
    const body = [result.text, result.proposal.summary].filter(Boolean).join('\n\n');
    await save([...history, { role: 'user', text: read.historyText }, { role: 'assistant', text: body }], result.proposal);
    const sent = body.length <= 1024 && await sendButtons(phone, body, [{ id: 'confirm', title: 'Confirmar' }, { id: 'cancel', title: 'Não salvar' }]);
    if (!sent) await sendText(phone, `${body}\n\nResponda "sim" para confirmar ou "não" para descartar.`);
    return;
  }

  await save([...history, { role: 'user', text: read.historyText }, { role: 'assistant', text: result.text }], null);
  await sendText(phone, result.text);
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Meta's one-time verification of the webhook URL.
  if (req.method === 'GET') {
    const expected = Deno.env.get('WHATSAPP_VERIFY_TOKEN') ?? '';
    const given = url.searchParams.get('hub.verify_token') ?? '';
    if (expected && url.searchParams.get('hub.mode') === 'subscribe' && safeEqual(expected, given)) {
      return new Response(url.searchParams.get('hub.challenge') ?? '', { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const appSecret = Deno.env.get('WHATSAPP_APP_SECRET');
  if (!appSecret || !whatsappConfigured()) return new Response('Not configured', { status: 503 });

  const raw = await req.text();
  if (!(await validMetaSignature(raw, req.headers.get('x-hub-signature-256'), appSecret))) {
    return new Response('Invalid signature', { status: 401 });
  }

  let payload: WaMessage;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } });
  const ownNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  const messages: WaMessage[] = [];
  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      const value = change?.value;
      if (change?.field !== 'messages' || value?.metadata?.phone_number_id !== ownNumberId) continue;
      for (const message of value?.messages ?? []) messages.push(message);
    }
  }

  const work = (async () => {
    for (const message of messages) {
      try {
        await handleMessage(admin, message);
      } catch {
        log('message handling failed');
      }
    }
  })();

  // Answer Meta right away and keep working in the background when the runtime allows it.
  // deno-lint-ignore no-explicit-any
  const runtime = (globalThis as any).EdgeRuntime;
  if (runtime?.waitUntil) runtime.waitUntil(work);
  else await work;

  return new Response('OK', { status: 200 });
});
