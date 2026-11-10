// Booking dates are pure calendar dates ('YYYY-MM-DD'). Never use new Date('YYYY-MM-DD')
// or toISOString() on them: both shift through UTC and move the day in America/Sao_Paulo.

export function parseDateOnly(value: string | null | undefined): Date {
  if (!value) return new Date(NaN);
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function toDateOnlyString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayDateOnly(): string {
  return toDateOnlyString(new Date());
}

export function formatDateBR(value: string | Date | null | undefined, short = false): string {
  if (!value) return '';
  const date = typeof value === 'string' ? parseDateOnly(value) : value;
  if (isNaN(date.getTime())) return '';
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return short ? `${d}/${m}` : `${d}/${m}/${date.getFullYear()}`;
}

/** Nights between check-in and check-out. */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = parseDateOnly(checkIn).getTime();
  const b = parseDateOnly(checkOut).getTime();
  return Math.round((b - a) / 86400000);
}

/** Position of a day inside a stay: check-in, occupied night, check-out or none. */
export function stayPosition(day: Date, checkIn: string, checkOut: string): 'checkin' | 'night' | 'checkout' | null {
  const s = toDateOnlyString(day);
  const ci = checkIn.slice(0, 10);
  const co = checkOut.slice(0, 10);
  if (s === ci) return 'checkin';
  if (s === co) return 'checkout';
  if (s > ci && s < co) return 'night';
  return null;
}
