import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.119.0';
import { planAllows } from '../_shared/planFeatures.ts';
import { calendarSignature, validCalendarSignature, availabilityICS } from '../_shared/calendarExport.ts';
const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Cache-Control': 'no-store' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { headers });
  try {
    const url = new URL(req.url);
    const propertyId = url.searchParams.get('property_id');
    if (!propertyId || !/^[0-9a-f-]{36}$/i.test(propertyId)) return json({ error: 'Chalé inválido' }, 400);
    const secret = Deno.env.get('ICAL_EXPORT_SIGNING_SECRET');
    if (!secret) return json({ error: 'Exportação indisponível' }, 503);
    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const isSigned = await validCalendarSignature(propertyId, url.searchParams.get('token'), secret);
    if (!isSigned || req.method === 'POST') {
      const authorization = req.headers.get('Authorization');
      if (!authorization?.startsWith('Bearer ')) return json({ error: 'Não autorizado' }, 401);
      const { data, error } = await admin.auth.getUser(authorization.slice(7));
      if (error || !data.user) return json({ error: 'Não autorizado' }, 401);
      const { data: property, error: propertyError } = await admin.from('properties').select('id').eq('id', propertyId).eq('user_id', data.user.id).maybeSingle();
      if (propertyError || !property) return json({ error: 'Chalé indisponível' }, 403);
      if (req.method === 'POST') {
        const { data: plan } = await admin.rpc('effective_plan_for', { _user_id: data.user.id });
        if (!planAllows(typeof plan === 'string' ? plan : null, 'icalExport')) return json({ error: 'A exportação de calendário faz parte dos planos Pro e Premium' }, 403);
        const token = await calendarSignature(propertyId, secret);
        const link = new URL(`${Deno.env.get('SUPABASE_URL')}/functions/v1/export-ical`);
        link.searchParams.set('property_id', propertyId);
        link.searchParams.set('token', token);
        return json({ url: link.href });
      }
    }
    if (req.method !== 'GET') return json({ error: 'Método não permitido' }, 405);
    const bookings: { id: string; check_in: string; check_out: string }[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await admin.from('bookings').select('id,check_in,check_out').eq('property_id', propertyId).in('status', ['confirmed','checked_in','active']).order('id').range(offset, offset + 999);
      if (error) return json({ error: 'Não foi possível exportar' }, 500);
      bookings.push(...(data ?? []));
      if ((data?.length ?? 0) < 1000) break;
    }
    return new Response(availabilityICS(bookings), { headers: { ...headers, 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'attachment; filename="ordomo.ics"' } });
  } catch {
    return json({ error: 'Exportação indisponível' }, 500);
  }
});
