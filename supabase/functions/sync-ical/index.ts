import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ICalEvent {
  uid: string;
  summary: string;
  dtstart: string;
  dtend: string;
  description?: string;
}

function parseICalDate(dateStr: string): Date {
  if (dateStr.includes('T')) {
    const cleanDate = dateStr.replace(/[TZ]/g, '');
    const year = parseInt(cleanDate.substring(0, 4));
    const month = parseInt(cleanDate.substring(4, 6)) - 1;
    const day = parseInt(cleanDate.substring(6, 8));
    const hour = parseInt(cleanDate.substring(8, 10)) || 0;
    const minute = parseInt(cleanDate.substring(10, 12)) || 0;
    return new Date(year, month, day, hour, minute);
  } else {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month, day);
  }
}

function parseICalData(icalText: string): ICalEvent[] {
  const events: ICalEvent[] = [];
  const lines = icalText.split(/\r?\n/);
  
  let currentEvent: Partial<ICalEvent> | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    while (i + 1 < lines.length && /^[ \t]/.test(lines[i + 1])) {
      i++;
      line += lines[i].trim();
    }
    
    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (line === 'END:VEVENT' && currentEvent) {
      if (currentEvent.uid && currentEvent.summary && currentEvent.dtstart && currentEvent.dtend) {
        events.push(currentEvent as ICalEvent);
      }
      currentEvent = null;
    } else if (currentEvent && line.includes(':')) {
      const colonIndex = line.indexOf(':');
      const property = line.substring(0, colonIndex);
      const value = line.substring(colonIndex + 1);
      const propertyName = property.split(';')[0];
      
      switch (propertyName) {
        case 'UID':
          currentEvent.uid = value;
          break;
        case 'SUMMARY':
          currentEvent.summary = value;
          break;
        case 'DTSTART':
          currentEvent.dtstart = value;
          break;
        case 'DTEND':
          currentEvent.dtend = value;
          break;
        case 'DESCRIPTION':
          currentEvent.description = value;
          break;
      }
    }
  }
  
  return events;
}

async function syncICalendar(supabase: any, syncId: string) {
  console.log(`Starting sync for sync_id: ${syncId}`);
  
  try {
    const { data: syncConfig, error: syncError } = await supabase
      .from('ical_syncs')
      .select('*')
      .eq('id', syncId)
      .single();

    if (syncError) {
      console.error('Error fetching sync config:', syncError);
      throw syncError;
    }

    if (!syncConfig.is_active) {
      console.log('Sync is not active, skipping');
      return;
    }

    console.log(`Fetching iCal from: ${syncConfig.ical_url}`);
    
    const response = await fetch(syncConfig.ical_url);
    if (!response.ok) {
      throw new Error(`Failed to fetch iCal: ${response.statusText}`);
    }
    
    const icalText = await response.text();
    console.log(`Fetched iCal data, length: ${icalText.length}`);
    
    const events = parseICalData(icalText);
    console.log(`Parsed ${events.length} events`);
    
    const now = new Date();
    const twoYearsFromNow = new Date();
    twoYearsFromNow.setFullYear(now.getFullYear() + 2);
    
    const relevantEvents = events.filter(event => {
      const startDate = parseICalDate(event.dtstart);
      const endDate = parseICalDate(event.dtend);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      return (
        (endDate >= now && startDate <= twoYearsFromNow) ||
        (endDate >= sevenDaysAgo && endDate < now)
      );
    });
    
    console.log(`Filtered to ${relevantEvents.length} relevant events`);
    
    const { error: deleteError } = await supabase
      .from('external_bookings')
      .delete()
      .eq('ical_sync_id', syncId);

    if (deleteError) {
      console.error('Error deleting existing bookings:', deleteError);
      throw deleteError;
    }

    const bookingsToInsert = relevantEvents.map(event => {
      const startDate = parseICalDate(event.dtstart);
      const endDate = parseICalDate(event.dtend);
      
      if (!event.dtstart.includes('T')) {
        endDate.setDate(endDate.getDate() - 1);
      }
      
      return {
        user_id: syncConfig.user_id,
        ical_sync_id: syncId,
        external_id: event.uid,
        summary: event.summary || 'Reserva via ' + syncConfig.platform_name,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        platform_name: syncConfig.platform_name,
        raw_ical_data: JSON.stringify(event)
      };
    });

    if (bookingsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('external_bookings')
        .insert(bookingsToInsert);

      if (insertError) {
        console.error('Error inserting bookings:', insertError);
        throw insertError;
      }
    }

    const { error: updateError } = await supabase
      .from('ical_syncs')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', syncId);

    if (updateError) {
      console.error('Error updating sync time:', updateError);
      throw updateError;
    }

    console.log(`Successfully synced ${bookingsToInsert.length} bookings`);
    return { success: true, synced_count: bookingsToInsert.length };

  } catch (error) {
    console.error('Sync error:', error);
    throw error;
  }
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

    // Create an authenticated client to verify the user
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;

    const { sync_id } = await req.json();
    
    if (!sync_id) {
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

    // Verify ownership: caller must own the sync configuration
    const { data: syncOwnership, error: ownershipError } = await supabase
      .from('ical_syncs')
      .select('id')
      .eq('id', sync_id)
      .eq('user_id', userId)
      .single();

    if (ownershipError || !syncOwnership) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: you do not own this sync configuration' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await syncICalendar(supabase, sync_id);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
