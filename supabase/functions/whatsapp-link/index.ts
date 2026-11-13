// Links the owner's own WhatsApp number to their Ordomo account.
// The app asks for a code here; the person sends that code from their WhatsApp to the Ordomo
// number, and the webhook ties the sending number to the account. No number is typed by hand,
// so nobody can link a phone they do not hold.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.119.0';
import { planAllows } from '../_shared/userAccess.ts';
import { generateLinkCode, maskPhone, sha256Hex } from '../_shared/whatsappText.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const CODE_MINUTES = 15;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) return json({ error: 'Não autorizado' }, 401);
    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } });
    const { data: userData, error: userError } = await admin.auth.getUser(authorization.slice(7));
    if (userError || !userData.user) return json({ error: 'Não autorizado' }, 401);
    const userId = userData.user.id;

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const action = typeof body.action === 'string' ? body.action : 'status';

    // The assistant only answers when the number and its Meta credentials are configured.
    const number = (Deno.env.get('WHATSAPP_DISPLAY_NUMBER') ?? '').replace(/\D/g, '');
    const configured = Boolean(number && Deno.env.get('WHATSAPP_ACCESS_TOKEN') && Deno.env.get('WHATSAPP_PHONE_NUMBER_ID'));

    const { data: plan } = await admin.rpc('effective_plan_for', { _user_id: userId });
    const allowed = planAllows(typeof plan === 'string' ? plan : null, 'whatsapp');

    const status = async () => {
      const { data: link } = await admin.from('whatsapp_links').select('phone, linked_at, daily_summary').eq('user_id', userId).maybeSingle();
      return {
        configured,
        allowed,
        number: configured ? number : null,
        linked: Boolean(link?.phone),
        phone: link?.phone ? maskPhone(link.phone) : null,
        daily_summary: link?.daily_summary ?? true,
      };
    };

    if (action === 'status') return json(await status());

    if (action === 'start') {
      if (!configured) return json({ error: 'O WhatsApp do Ordomo ainda não está disponível.' }, 503);
      if (!allowed) return json({ error: 'O WhatsApp do Ordomo faz parte dos planos Pro e Premium.' }, 403);
      const code = generateLinkCode();
      const expiresAt = new Date(Date.now() + CODE_MINUTES * 60000).toISOString();
      const { error } = await admin.from('whatsapp_links').upsert(
        { user_id: userId, link_code_hash: await sha256Hex(code), link_code_expires_at: expiresAt },
        { onConflict: 'user_id' },
      );
      if (error) return json({ error: 'Não foi possível gerar o código.' }, 500);
      return json({ ...(await status()), code, expires_at: expiresAt });
    }

    if (action === 'unlink') {
      const { error } = await admin.from('whatsapp_links')
        .update({ phone: null, linked_at: null, link_code_hash: null, link_code_expires_at: null, last_inbound_at: null })
        .eq('user_id', userId);
      if (error) return json({ error: 'Não foi possível desvincular.' }, 500);
      await admin.from('whatsapp_conversations').delete().eq('user_id', userId);
      return json(await status());
    }

    if (action === 'set_summary') {
      const { error } = await admin.from('whatsapp_links').update({ daily_summary: body.enabled === true }).eq('user_id', userId);
      if (error) return json({ error: 'Não foi possível salvar.' }, 500);
      return json(await status());
    }

    return json({ error: 'Ação inválida' }, 400);
  } catch {
    return json({ error: 'Serviço indisponível' }, 500);
  }
});
