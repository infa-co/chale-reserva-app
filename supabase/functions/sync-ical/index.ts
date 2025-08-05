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
  // Handle both DATE and DATETIME formats
  if (dateStr.includes('T')) {
    // DATETIME format: 20241225T140000Z
    const cleanDate = dateStr.replace(/[TZ]/g, '');
    const year = parseInt(cleanDate.substring(0, 4));
    const month = parseInt(cleanDate.substring(4, 6)) - 1;
    const day = parseInt(cleanDate.substring(6, 8));
    const hour = parseInt(cleanDate.substring(8, 10)) || 0;
    const minute = parseInt(cleanDate.substring(10, 12)) || 0;
    return new Date(year, month, day, hour, minute);
  } else {
    // DATE format: 20241225
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
  let currentProperty = '';
  let currentValue = '';
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Handle line continuations (lines starting with space or tab)
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
      
      // Handle property parameters (e.g., DTSTART;VALUE=DATE:20241225)
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
    // Get sync configuration
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
    
    // Fetch iCal data
    const response = await fetch(syncConfig.ical_url);
    if (!response.ok) {
      throw new Error(`Failed to fetch iCal: ${response.statusText}`);
    }
    
    const icalText = await response.text();
    console.log(`Fetched iCal data, length: ${icalText.length}`);
    
    // Parse iCal events
    const events = parseICalData(icalText);
    console.log(`Parsed ${events.length} events`);
    
    // Filter events for next 2 years
    const now = new Date();
    const twoYearsFromNow = new Date();
    twoYearsFromNow.setFullYear(now.getFullYear() + 2);
    
    // Log raw iCal sample for debugging
    console.log(`Raw iCal sample (first 500 chars): ${icalText.substring(0, 500)}`);
    
    // Log parsed events details
    events.forEach((event, index) => {
      const startDate = parseICalDate(event.dtstart);
      const endDate = parseICalDate(event.dtend);
      console.log(`Event ${index + 1}: ${event.summary} | Start: ${event.dtstart} (parsed: ${startDate.toISOString()}) | End: ${event.dtend} (parsed: ${endDate.toISOString()})`);
    });
    
    const relevantEvents = events.filter(event => {
      const startDate = parseICalDate(event.dtstart);
      const isRelevant = startDate >= now && startDate <= twoYearsFromNow;
      if (!isRelevant) {
        console.log(`Filtering out event "${event.summary}": start date ${startDate.toISOString()} is outside range (now: ${now.toISOString()}, limit: ${twoYearsFromNow.toISOString()})`);
      }
      return isRelevant;
    });
    
    console.log(`Filtered to ${relevantEvents.length} relevant events`);
    
    // Delete existing external bookings for this sync
    const { error: deleteError } = await supabase
      .from('external_bookings')
      .delete()
      .eq('ical_sync_id', syncId);

    if (deleteError) {
      console.error('Error deleting existing bookings:', deleteError);
      throw deleteError;
    }

    // Insert new external bookings
    const bookingsToInsert = relevantEvents.map(event => {
      const startDate = parseICalDate(event.dtstart);
      const endDate = parseICalDate(event.dtend);
      
      // For all-day events, adjust end date to be inclusive
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

    // Update last sync time
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { sync_id } = await req.json();
    
    if (!sync_id) {
      return new Response(
        JSON.stringify({ error: 'sync_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const result = await syncICalendar(supabase, sync_id);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});