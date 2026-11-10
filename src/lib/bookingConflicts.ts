import { formatDateBR } from './dates';

// Stays are half-open intervals [check_in, check_out): check-out day may be the next check-in day.
export interface StayLike {
  id?: string;
  property_id?: string | null;
  check_in: string;
  check_out: string;
  status?: string | null;
  guest_name: string;
  source?: 'ordomo' | 'external';
}

export const CANCELLED_STATUSES = ['cancelled', 'cancelada'];

export function staysOverlap(aIn: string, aOut: string, bIn: string, bOut: string): boolean {
  return aIn.slice(0, 10) < bOut.slice(0, 10) && bIn.slice(0, 10) < aOut.slice(0, 10);
}

export function isValidStay(checkIn: string, checkOut: string): boolean {
  return !!checkIn && !!checkOut && checkOut.slice(0, 10) > checkIn.slice(0, 10);
}

export function findStayConflicts(
  stay: { propertyId: string; checkIn: string; checkOut: string; excludeId?: string },
  existing: StayLike[]
): StayLike[] {
  return existing.filter(
    (b) =>
      b.property_id === stay.propertyId &&
      b.id !== stay.excludeId &&
      !CANCELLED_STATUSES.includes(b.status ?? '') &&
      staysOverlap(stay.checkIn, stay.checkOut, b.check_in, b.check_out)
  );
}

export function conflictMessage(c: StayLike): string {
  const who = c.source === 'external' ? `${c.guest_name}, Airbnb` : `hóspede ${c.guest_name}`;
  return `Esse chalé já está ocupado de ${formatDateBR(c.check_in, true)} a ${formatDateBR(c.check_out, true)} (${who})`;
}
