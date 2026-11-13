// Morning summary on WhatsApp: today's arrivals and departures and tomorrow's arrivals.
// Called every hour by pg_cron; it only sends during the 8 o'clock hour in São Paulo and at
// most once per account per day. Inside WhatsApp's 24-hour window it sends plain text with the
// names; outside it, WhatsApp only allows the pre-approved template (numbers only).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.119.0';
import { todayInSaoPaulo } from '../_shared/bookingRules.ts';
import { planAllows } from '../_shared/userAccess.ts';
import { sendTemplate, sendText, whatsappConfigured } from '../_shared/whatsappApi.ts';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const SEND_HOUR = 8;

function addDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceKey) return json({ error: 'Unauthorized' }, 401);
  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceKey, { auth: { persistSession: false } });

  const internal = req.headers.get('Authorization') === `Bearer ${serviceKey}`;
  let authorized = internal;
  const cronSecret = req.headers.get('x-cron-secret');
  if (!authorized && cronSecret && /^[a-f0-9]{64}$/.test(cronSecret)) {
    const { data: valid, error } = await admin.rpc('verify_cron_secret', { _name: 'whatsapp-summary', _secret: cronSecret });
    authorized = !error && valid === true;
  }
  if (!authorized) return json({ error: 'Unauthorized' }, 401);
  if (!whatsappConfigured()) return json({ skipped: 'not configured' });

  const now = new Date();
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false }).format(now));
  const body = await req.json().catch(() => ({}));
  // Only an internal caller may force a send outside the morning hour (used for testing).
  if (hour !== SEND_HOUR && !(internal && body?.force === true)) return json({ skipped: 'outside send hour' });

  const today = todayInSaoPaulo(now);
  const tomorrow = addDay(today);
  const template = Deno.env.get('WHATSAPP_SUMMARY_TEMPLATE');
  const templateLanguage = Deno.env.get('WHATSAPP_SUMMARY_TEMPLATE_LANG') ?? 'pt_BR';

  const { data: links, error } = await admin.from('whatsapp_links')
    .select('user_id, phone, last_inbound_at, last_summary_on')
    .not('phone', 'is', null).eq('daily_summary', true);
  if (error) return json({ error: 'Could not read links' }, 500);

  let sent = 0;
  for (const link of links ?? []) {
    if (link.last_summary_on === today) continue;
    try {
      const { data: plan } = await admin.rpc('effective_plan_for', { _user_id: link.user_id });
      if (plan === 'none' || !planAllows(typeof plan === 'string' ? plan : null, 'whatsapp')) continue;

      const { data: bookings } = await admin.from('bookings')
        .select('guest_name, check_in, check_out, property_id')
        .eq('user_id', link.user_id).eq('is_historical', false).neq('status', 'cancelled')
        .or(`check_in.eq.${today},check_out.eq.${today},check_in.eq.${tomorrow}`);
      const arrivals = (bookings ?? []).filter((b: { check_in: string }) => b.check_in === today);
      const departures = (bookings ?? []).filter((b: { check_out: string }) => b.check_out === today);
      const next = (bookings ?? []).filter((b: { check_in: string }) => b.check_in === tomorrow);

      let delivered = true;
      if (arrivals.length + departures.length + next.length > 0) {
        const insideWindow = link.last_inbound_at && Date.now() - Date.parse(link.last_inbound_at) < 23.5 * 3600000;
        if (insideWindow) {
          const names = (list: { guest_name: string }[]) => list.map((b) => b.guest_name).join(', ');
          const lines = ['Bom dia! Resumo de hoje no Ordomo:'];
          if (arrivals.length) lines.push(`- Chegam hoje: ${names(arrivals)}`);
          if (departures.length) lines.push(`- Saem hoje: ${names(departures)}`);
          if (next.length) lines.push(`- Chegam amanhã: ${names(next)}`);
          delivered = await sendText(link.phone, lines.join('\n'));
        } else if (template) {
          delivered = await sendTemplate(link.phone, template, templateLanguage, [String(arrivals.length), String(departures.length), String(next.length)]);
        } else {
          delivered = false; // no approved template configured: nothing can be sent today
        }
        if (delivered) sent++;
      }
      // Mark the day when there was nothing to say or the message went out.
      if (delivered) await admin.from('whatsapp_links').update({ last_summary_on: today }).eq('user_id', link.user_id);
    } catch {
      console.error('[WHATSAPP-SUMMARY] one account failed');
    }
  }
  return json({ sent });
});
