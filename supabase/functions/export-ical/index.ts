import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Booking {
  id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  status: string;
  notes?: string;
}

const formatDate = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

const generateICS = (bookings: Booking[]): string => {
  const now = new Date();
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ordomo//Ordomo Booking System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Ordomo Bookings',
    'X-WR-CALDESC:Blocked dates from Ordomo booking system',
  ];

  bookings.forEach(booking => {
    const checkIn = new Date(booking.check_in + 'T00:00:00Z');
    const checkOut = new Date(booking.check_out + 'T00:00:00Z');
    
    lines.push(
      'BEGIN:VEVENT',
      `UID:ordomo-${booking.id}@ordomo.app`,
      `DTSTART;VALUE=DATE:${booking.check_in.replace(/-/g, '')}`,
      `DTEND;VALUE=DATE:${booking.check_out.replace(/-/g, '')}`,
      `DTSTAMP:${formatDate(now)}`,
      `SUMMARY:Reservado - ${booking.guest_name}`,
      `DESCRIPTION:Reserva confirmada pelo Ordomo${booking.notes ? '\\n\\nNotas: ' + booking.notes.replace(/\n/g, '\\n') : ''}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const propertyId = url.searchParams.get('property_id');

    if (!propertyId) {
      return new Response(
        JSON.stringify({ error: 'property_id parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Exporting iCal for property: ${propertyId}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch confirmed bookings for the property
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, guest_name, check_in, check_out, status, notes')
      .eq('property_id', propertyId)
      .in('status', ['confirmed', 'checked_in', 'active'])
      .gte('check_out', new Date().toISOString().split('T')[0]) // Only future or current bookings
      .order('check_in', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch bookings' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Found ${bookings?.length || 0} confirmed bookings for export`);

    const icsContent = generateICS(bookings || []);

    return new Response(icsContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="ordomo-property-${propertyId}.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});