import { assertEquals, assertThrows } from 'https://deno.land/std@0.190.0/testing/asserts.ts';
import { calendarUrl, escapeHtml, ownedBookingRecipient, trustedOrigin } from './security.ts';
import { availabilityICS, calendarSignature, validCalendarSignature } from './calendarExport.ts';

Deno.test('payment return destinations reject unapproved origins', () => {
  assertEquals(trustedOrigin('https://attacker.example'), 'https://ordomo.com.br');
  assertEquals(trustedOrigin('https://ordomo.com.br'), 'https://ordomo.com.br');
});
Deno.test('calendar fetch rejects private hosts and credential tricks', () => {
  for (const url of ['http://www.airbnb.com/calendar/ical/1', 'https://127.0.0.1', 'https://169.254.169.254', 'https://www.airbnb.com.attacker.example', 'https://user:pass@www.airbnb.com/calendar/ical/1', 'https://www.airbnb.com:8443/calendar/ical/1']) assertThrows(() => calendarUrl(url));
  assertEquals(calendarUrl('https://www.airbnb.com/calendar/ical/1.ics').hostname, 'www.airbnb.com');
});
Deno.test('confirmation recipient comes only from an owned noncancelled booking', () => {
  const booking = { user_id: 'owner', guest_email: 'guest@example.com', status: 'confirmed' };
  assertEquals(ownedBookingRecipient(booking, 'owner'), 'guest@example.com');
  assertThrows(() => ownedBookingRecipient(booking, 'other'));
  assertThrows(() => ownedBookingRecipient({ ...booking, status: 'cancelled' }, 'owner'));
});
Deno.test('export links are bound to exactly one property', async () => {
  const token = await calendarSignature('property-one', 'test-secret');
  assertEquals(await validCalendarSignature('property-one', token, 'test-secret'), true);
  assertEquals(await validCalendarSignature('property-two', token, 'test-secret'), false);
  assertEquals(await validCalendarSignature('property-one', null, 'test-secret'), false);
});
Deno.test('calendar export contains availability without guest personal data', () => {
  const booking = { id: 'id', check_in: '2026-10-08', check_out: '2026-10-10', guest_name: 'PRIVATE_GUEST', notes: 'PRIVATE_NOTE' };
  const text = availabilityICS([booking]);
  assertEquals(text.includes('DTSTART;VALUE=DATE:20261008'), true);
  assertEquals(text.includes('DTEND;VALUE=DATE:20261010'), true);
  assertEquals(text.includes('PRIVATE_GUEST'), false);
  assertEquals(text.includes('PRIVATE_NOTE'), false);
});
Deno.test('email data cannot inject active markup', () => {
  assertEquals(escapeHtml('<a href="x">&\'</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
});