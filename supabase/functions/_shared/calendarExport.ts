export async function calendarSignature(propertyId: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(`ordomo-calendar-v1:${propertyId}`)));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}
export async function validCalendarSignature(propertyId: string, token: string | null, secret: string): Promise<boolean> {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return false;
  const expected = await calendarSignature(propertyId, secret);
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  return difference === 0;
}
export function availabilityICS(bookings: { id: string; check_in: string; check_out: string }[]): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Ordomo//Availability//EN','CALSCALE:GREGORIAN', ...bookings.flatMap(b => [
    'BEGIN:VEVENT', `UID:ordomo-${b.id}@ordomo.app`, `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${b.check_in.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${b.check_out.replace(/-/g, '')}`,
    'SUMMARY:Reservado', 'STATUS:CONFIRMED','TRANSP:OPAQUE','END:VEVENT'
  ]),'END:VCALENDAR'].join('\r\n');
}