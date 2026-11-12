import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  isEchoOfOwnBookings,
  parseICalEvents,
  withinSyncWindow,
} from '../../supabase/functions/_shared/ical.ts';
import { calendarUrl } from '../../supabase/functions/_shared/security.ts';
import { availabilityICS } from '../../supabase/functions/_shared/calendarExport.ts';
import { validateCalendarUrl } from '../hooks/useOptimizedICalSyncs';

// Shape of a real Airbnb export: CRLF lines, folded DESCRIPTION, reservation + blocked dates.
const AIRBNB_FEED = [
  'BEGIN:VCALENDAR',
  'PRODID;X-RICAL-TZSOURCE=TZINFO:-//Airbnb Inc//Hosting Calendar 0.8.8//EN',
  'CALSCALE:GREGORIAN',
  'VERSION:2.0',
  'BEGIN:VEVENT',
  'DTEND;VALUE=DATE:20261124',
  'DTSTART;VALUE=DATE:20261120',
  'UID:1418fb94e984-abc123@airbnb.com',
  'DESCRIPTION:Reservation URL: https://www.airbnb.com/hosting/reservations/de',
  ' tails/HMABCDEFGH\\nPhone Number (Last 4 Digits): 1234',
  'SUMMARY:Reserved',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'DTEND;VALUE=DATE:20261203',
  'DTSTART;VALUE=DATE:20261201',
  'UID:6fec1092d3fa-def456@airbnb.com',
  'SUMMARY:Airbnb (Not available)',
  'END:VEVENT',
  'END:VCALENDAR',
  '',
].join('\r\n');

describe('Airbnb iCal import', () => {
  it('reads reservations and blocked dates from an Airbnb feed', () => {
    const events = parseICalEvents(AIRBNB_FEED);
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      uid: '1418fb94e984-abc123@airbnb.com',
      summary: 'Reserved',
      startDate: '2026-11-20',
      endDate: '2026-11-24',
    });
    // Folded line is joined without losing or adding characters.
    expect(events[0].description).toContain('reservations/details/HMABCDEFGH');
    expect(events[1]).toMatchObject({ summary: 'Airbnb (Not available)', startDate: '2026-12-01', endDate: '2026-12-03' });
  });

  it('reads the sample calendars kept in the repository', () => {
    const a = parseICalEvents(readFileSync('teste.ics.ics', 'utf8'));
    expect(a).toEqual([{ uid: 'TEST-123@ordomo', summary: 'Reserva de Teste', startDate: '2025-09-10', endDate: '2025-09-12' }]);
    const b = parseICalEvents(readFileSync('testeAirbnbdia14.ics', 'utf8'));
    expect(b[0]).toMatchObject({ startDate: '2024-10-14', endDate: '2024-10-15', summary: 'Reserva Airbnb' });
  });

  it('keeps events without SUMMARY or DTEND and drops cancelled ones', () => {
    const feed = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT', 'UID:a', 'DTSTART;VALUE=DATE:20270105', 'END:VEVENT',
      'BEGIN:VEVENT', 'UID:b', 'DTSTART:20270110T150000Z', 'DTEND:20270112T110000Z', 'SUMMARY:CLOSED - Not available', 'END:VEVENT',
      'BEGIN:VEVENT', 'UID:c', 'DTSTART;VALUE=DATE:20270120', 'DTEND;VALUE=DATE:20270122', 'STATUS:CANCELLED', 'END:VEVENT',
      'BEGIN:VEVENT', 'UID:a', 'DTSTART;VALUE=DATE:20270201', 'DTEND;VALUE=DATE:20270203', 'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n');
    const events = parseICalEvents(feed);
    expect(events.map((e) => [e.uid, e.startDate, e.endDate])).toEqual([
      ['a', '2027-01-05', '2027-01-06'],
      ['b', '2027-01-10', '2027-01-12'],
      ['a#2027-02-01', '2027-02-01', '2027-02-03'],
    ]);
  });

  it('keeps the same time window the import always used', () => {
    const event = (startDate: string, endDate: string) => ({ uid: 'x', summary: '', startDate, endDate });
    expect(withinSyncWindow(event('2026-11-01', '2026-11-06'), '2026-11-12')).toBe(true); // ended 6 days ago
    expect(withinSyncWindow(event('2026-10-01', '2026-11-04'), '2026-11-12')).toBe(false); // ended 8 days ago
    expect(withinSyncWindow(event('2029-01-01', '2029-01-05'), '2026-11-12')).toBe(false);
  });

  it('does not re-import Ordomo bookings that Airbnb echoes back as blocked dates', () => {
    const own = [
      { check_in: '2026-12-01', check_out: '2026-12-03' },
      { check_in: '2026-12-03', check_out: '2026-12-06' },
    ];
    const block = (startDate: string, endDate: string, summary = 'Airbnb (Not available)') => ({ uid: 'u', summary, startDate, endDate });
    expect(isEchoOfOwnBookings(block('2026-12-01', '2026-12-03'), own)).toBe(true);
    // Airbnb merges back-to-back blocks into one.
    expect(isEchoOfOwnBookings(block('2026-12-01', '2026-12-06'), own)).toBe(true);
    // One extra night is a genuine external block.
    expect(isEchoOfOwnBookings(block('2026-12-01', '2026-12-07'), own)).toBe(false);
    // A real Airbnb reservation is always imported, even over an Ordomo booking.
    expect(isEchoOfOwnBookings(block('2026-12-01', '2026-12-03', 'Reserved'), own)).toBe(false);
    expect(isEchoOfOwnBookings(block('2026-12-01', '2026-12-03'), [])).toBe(false);
  });
});

describe('calendar links', () => {
  it('accepts the links the platforms actually hand out', () => {
    for (const url of [
      'https://www.airbnb.com/calendar/ical/123456.ics?s=abcdef',
      'https://www.airbnb.com.br/calendar/ical/123456.ics?s=abcdef',
      'https://www.airbnb.pt/calendar/ical/123456.ics?s=abcdef',
      'https://ical.booking.com/v1/export?t=abc',
      'https://www.vrbo.com/icalendar/abc.ics',
    ]) {
      expect(calendarUrl(url).href).toBe(url);
      expect(validateCalendarUrl(url)).toBeNull();
    }
  });

  it('still refuses anything that is not a known provider over HTTPS', () => {
    for (const url of [
      'http://www.airbnb.com/calendar/ical/1.ics',
      'https://127.0.0.1/x.ics',
      'https://169.254.169.254/latest',
      'https://www.airbnb.com.attacker.example/calendar/ical/1.ics',
      'https://airbnb.attacker.example/calendar/ical/1.ics',
      'https://user:pass@www.airbnb.com/calendar/ical/1.ics',
      'https://www.airbnb.com:8443/calendar/ical/1.ics',
      'https://calendar.google.com/calendar/ical/x/basic.ics',
    ]) {
      expect(() => calendarUrl(url)).toThrow();
    }
    expect(validateCalendarUrl('airbnb.com/calendar')).not.toBeNull();
    expect(validateCalendarUrl('https://example.com/a.ics')).not.toBeNull();
  });
});

describe('calendar export', () => {
  it('produces a feed that the importer itself can read back', () => {
    const ics = availabilityICS([{ id: 'b1', check_in: '2026-12-01', check_out: '2026-12-03' }]);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(parseICalEvents(ics)).toEqual([
      { uid: 'ordomo-b1@ordomo.app', summary: 'Reservado', startDate: '2026-12-01', endDate: '2026-12-03' },
    ]);
  });
});
