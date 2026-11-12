// Pure iCal helpers shared by the calendar import. No Deno or network APIs here so the
// same code runs under the edge runtime and under the project's unit tests.

export interface ICalEvent {
  uid: string;
  summary: string;
  /** First occupied night, 'YYYY-MM-DD'. */
  startDate: string;
  /** Check-out day (exclusive), 'YYYY-MM-DD'. */
  endDate: string;
  description?: string;
}

export interface OwnStay {
  check_in: string;
  check_out: string;
}

/** Adds days to a date-only string without going through the local timezone. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** RFC 5545 unfolding: a line that starts with a space or tab continues the previous one. */
export function unfoldICal(text: string): string[] {
  const lines: string[] = [];
  for (const raw of text.replace(/^﻿/, '').split(/\r\n|\n|\r/)) {
    if (/^[ \t]/.test(raw) && lines.length > 0) lines[lines.length - 1] += raw.slice(1);
    else lines.push(raw);
  }
  return lines;
}

function unescapeText(value: string): string {
  return value
    .replace(/\\n/gi, ' ')
    .replace(/\\([,;\\])/g, '$1')
    .trim();
}

/** Splits "NAME;PARAM=x:value" at the first colon that is not inside a quoted parameter. */
function splitProperty(line: string): { name: string; value: string } | null {
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') quoted = !quoted;
    else if (c === ':' && !quoted) {
      return { name: line.slice(0, i).split(';')[0].trim().toUpperCase(), value: line.slice(i + 1) };
    }
  }
  return null;
}

/** Accepts DATE (20250910) and DATE-TIME (20250910T140000Z) values; returns the calendar day. */
export function icalDateOnly(value: string | undefined): string | null {
  const match = /^(\d{4})(\d{2})(\d{2})(?:T\d{6}Z?)?$/.exec((value ?? '').trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const month = Number(m);
  const day = Number(d);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${y}-${m}-${d}`;
}

export function parseICalEvents(icalText: string): ICalEvent[] {
  const events: ICalEvent[] = [];
  const seen = new Set<string>();
  let current: Record<string, string> | null = null;

  for (const line of unfoldICal(icalText)) {
    const trimmed = line.trim();
    const upper = trimmed.toUpperCase();
    if (upper === 'BEGIN:VEVENT') {
      current = {};
      continue;
    }
    if (upper === 'END:VEVENT') {
      const event = current;
      current = null;
      if (!event) continue;
      if ((event.STATUS ?? '').trim().toUpperCase() === 'CANCELLED') continue;
      const startDate = icalDateOnly(event.DTSTART);
      if (!startDate) continue;
      let endDate = icalDateOnly(event.DTEND);
      // A missing or same-day DTEND means a one-night block (RFC 5545 default for DATE values).
      if (!endDate || endDate <= startDate) endDate = addDays(startDate, 1);
      const summary = unescapeText(event.SUMMARY ?? '');
      let uid = (event.UID ?? '').trim() || `${startDate}_${endDate}_${summary}`;
      // The import stores one row per UID; keep repeated UIDs apart instead of losing them.
      if (seen.has(uid)) uid = `${uid}#${startDate}`;
      if (seen.has(uid)) continue;
      seen.add(uid);
      const description = event.DESCRIPTION ? unescapeText(event.DESCRIPTION) : undefined;
      events.push({ uid, summary, startDate, endDate, ...(description ? { description } : {}) });
      continue;
    }
    if (!current) continue;
    const property = splitProperty(trimmed);
    if (!property) continue;
    if (['UID', 'SUMMARY', 'DTSTART', 'DTEND', 'DESCRIPTION', 'STATUS'].includes(property.name)) {
      current[property.name] = property.value;
    }
  }
  return events;
}

/** Same window the import always used: finished up to 7 days ago, starting within 2 years. */
export function withinSyncWindow(event: ICalEvent, today: string): boolean {
  return event.endDate >= addDays(today, -7) && event.startDate <= addDays(today, 730);
}

/** Airbnb marks real reservations as "Reserved"; everything else is a plain date block. */
export function isReservationSummary(summary: string): boolean {
  return /^reserv/i.test(summary.trim());
}

/**
 * A date block whose every night is already an Ordomo booking of the same chalé is just the
 * platform echoing the calendar Ordomo exported to it. Importing it would mark the chalé's own
 * bookings as conflicts, so it is skipped. Real reservations are never skipped.
 */
export function isEchoOfOwnBookings(event: ICalEvent, own: OwnStay[]): boolean {
  if (isReservationSummary(event.summary) || own.length === 0) return false;
  let night = event.startDate;
  for (let guard = 0; night < event.endDate; guard++) {
    if (guard > 400) return false;
    const current = night;
    if (!own.some((b) => b.check_in.slice(0, 10) <= current && current < b.check_out.slice(0, 10))) return false;
    night = addDays(night, 1);
  }
  return true;
}
