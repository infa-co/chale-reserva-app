import { describe, it, expect } from 'vitest';
import { parseDateOnly, formatDateBR, nightsBetween, stayPosition, toDateOnlyString } from './dates';

describe('booking dates', () => {
  it('keeps 08/10 to 10/10 as 2 nights without timezone shift', () => {
    expect(formatDateBR('2026-10-08')).toBe('08/10/2026');
    expect(formatDateBR('2026-10-10')).toBe('10/10/2026');
    expect(nightsBetween('2026-10-08', '2026-10-10')).toBe(2);
    expect(toDateOnlyString(parseDateOnly('2026-10-08'))).toBe('2026-10-08');
  });
  it('marks days 8, 9 and 10 on the calendar', () => {
    const pos = (d: number) => stayPosition(new Date(2026, 9, d), '2026-10-08', '2026-10-10');
    expect([pos(7), pos(8), pos(9), pos(10), pos(11)]).toEqual([null, 'checkin', 'night', 'checkout', null]);
  });
});
