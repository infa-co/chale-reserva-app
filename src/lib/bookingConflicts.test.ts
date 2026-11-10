import { describe, it, expect } from 'vitest';
import { findStayConflicts, isValidStay } from './bookingConflicts';

const P = 'chale-1';
const first = { id: 'a', property_id: P, check_in: '2026-10-10', check_out: '2026-10-12', status: 'confirmed', guest_name: 'Bruna' };
const check = (ci: string, co: string, list = [first]) => findStayConflicts({ propertyId: P, checkIn: ci, checkOut: co }, list).length;

describe('stay conflicts', () => {
  it('blocks 11–13 when 10–12 exists', () => expect(check('2026-10-11', '2026-10-13')).toBe(1));
  it('allows 12–14 (check-out day = next check-in)', () => expect(check('2026-10-12', '2026-10-14')).toBe(0));
  it('allows 11–13 after the first is cancelled', () => expect(check('2026-10-11', '2026-10-13', [{ ...first, status: 'cancelled' }])).toBe(0));
  it('ignores other chalés', () => expect(check('2026-10-11', '2026-10-13', [{ ...first, property_id: 'x' }])).toBe(0));
  it('requires at least 1 night', () => {
    expect(isValidStay('2026-10-10', '2026-10-10')).toBe(false);
    expect(isValidStay('2026-10-10', '2026-10-11')).toBe(true);
  });
});
