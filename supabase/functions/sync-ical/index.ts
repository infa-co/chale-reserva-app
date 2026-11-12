import { fetchCalendar } from "../_shared/security.ts";
import { addDays, isEchoOfOwnBookings, parseICalEvents, withinSyncWindow } from "../_shared/ical.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function syncICalendar(supabase: any, syncId: string) {
  console.log(`Starting sync for sync_id: ${syncId}`);

  const { data: syncConfig, error: syncError } = await supabase
    .from('ical_syncs')
    .select('*')
    .eq('id', syncId)
    .single();

  if (syncError) {
    console.error('Error fetching sync config:', syncError.message);
    throw new Error('Sincronização não encontrada');
  }

  if (!syncConfig.is_active) {
    console.log('Sync is not active, skipping');
    return { success: true, synced_count: 0, skipped: true };
  }

  const icalText = await fetchCalendar(syncConfig.ical_url);

  const events = parseICalEvents(icalText);
  console.log(`Parsed ${events.length} events`);

  const today = new Date().toISOString().slice(0, 10);
  let relevantEvents = events.filter((event) => withinSyncWindow(event, today));

  // Blocks that only mirror this chalé's own Ordomo bookings (exported to the platform and
  // sent back in its feed) are not external bookings.
  if (syncConfig.property_id && relevantEvents.length > 0) {
    const { data: ownBookings, error: ownError } = await supabase
      .from('bookings')
      .select('check_in, check_out')
      .eq('property_id', syncConfig.property_id)
      .neq('status', 'cancelled')
      .gte('check_out', addDays(today, -8));
    if (ownError) {
      console.error('Error fetching own bookings:', ownError.message);
      throw new Error('Não foi possível comparar com as reservas do chalé');
    }
    relevantEvents = relevantEvents.filter((event) => !isEchoOfOwnBookings(event, ownBookings ?? []));
  }

  console.log(`Filtered to ${relevantEvents.length} relevant events`);

  const bookingsToUpsert = relevantEvents.map((event) => ({
    user_id: syncConfig.user_id,
    ical_sync_id: syncId,
    external_id: event.uid,
    summary: event.summary || 'Reserva via ' + syncConfig.platform_name,
    start_date: event.startDate,
    end_date: event.endDate,
    platform_name: syncConfig.platform_name,
    raw_ical_data: JSON.stringify(event),
  }));

  // Write the new state first and only then remove what left the feed, so a failed write
  // never leaves the chalé looking free.
  if (bookingsToUpsert.length > 0) {
    const { error: upsertError } = await supabase
      .from('external_bookings')
      .upsert(bookingsToUpsert, { onConflict: 'ical_sync_id,external_id' });

    if (upsertError) {
      console.error('Error saving bookings:', upsertError.message);
      throw new Error('Não foi possível salvar as reservas importadas');
    }
  }

  const { data: stored, error: storedError } = await supabase
    .from('external_bookings')
    .select('id, external_id')
    .eq('ical_sync_id', syncId);

  if (storedError) {
    console.error('Error reading stored bookings:', storedError.message);
    throw new Error('Não foi possível atualizar as reservas importadas');
  }

  const currentIds = new Set(bookingsToUpsert.map((b) => b.external_id));
  const staleIds = (stored ?? []).filter((row: any) => !currentIds.has(row.external_id)).map((row: any) => row.id);
  for (let i = 0; i < staleIds.length; i += 100) {
    const { error: deleteError } = await supabase
      .from('external_bookings')
      .delete()
      .in('id', staleIds.slice(i, i + 100));
    if (deleteError) {
      console.error('Error deleting stale bookings:', deleteError.message);
      throw new Error('Não foi possível remover reservas canceladas');
    }
  }

  const { error: updateError } = await supabase
    .from('ical_syncs')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('id', syncId);

  if (updateError) {
    console.error('Error updating sync time:', updateError.message);
    throw new Error('Não foi possível registrar a sincronização');
  }

  console.log(`Successfully synced ${bookingsToUpsert.length} bookings`);
  return { success: true, synced_count: bookingsToUpsert.length };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Authentication: verify caller owns the sync ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.slice(7);
    const internal = token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    let userId: string | undefined;
    if (!internal) {
      const auth = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
      const { data, error } = await auth.auth.getUser(token);
      if (error || !data.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      userId = data.user.id;
    }

    const { sync_id } = await req.json().catch(() => ({}));
    
    if (typeof sync_id !== 'string' || !/^[0-9a-f-]{36}$/i.test(sync_id)) {
      return new Response(
        JSON.stringify({ error: 'sync_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client for actual operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (!internal) {
      const { data: owned, error } = await supabase.from('ical_syncs').select('id').eq('id', sync_id).eq('user_id', userId).maybeSingle();
      if (error || !owned) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const result = await syncICalendar(supabase, sync_id);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error instanceof Error ? error.message : 'unknown');
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
