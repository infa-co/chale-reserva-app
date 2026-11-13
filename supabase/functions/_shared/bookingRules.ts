// Booking rules shared by every server-side writer (today: the WhatsApp assistant).
// They mirror src/lib/bookingConflicts and src/lib/dates: stays are date-only, half-open
// [check_in, check_out), cancelled bookings never block. No Deno or network APIs here.

export const BOOKING_STATUSES = ['requested', 'pending', 'confirmed', 'checked_in', 'active', 'checked_out', 'completed', 'cancelled'] as const;
export type BookingStatus = typeof BOOKING_STATUSES[number];

export interface BookingDraft {
  property_id: string;
  guest_name: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  check_in: string;
  check_out: string;
  total_value?: number;
  payment_method?: string;
  status?: BookingStatus;
  notes?: string;
}

export function isDateOnly(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const [y1, m1, d1] = checkIn.split('-').map(Number);
  const [y2, m2, d2] = checkOut.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

export function staysOverlap(aIn: string, aOut: string, bIn: string, bOut: string): boolean {
  return aIn.slice(0, 10) < bOut.slice(0, 10) && bIn.slice(0, 10) < aOut.slice(0, 10);
}

/** Today's calendar date where the chalés are (never the server's UTC day). */
export function todayInSaoPaulo(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function formatDateBR(value: string): string {
  const [y, m, d] = value.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export function formatMoneyBR(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

/** Returns the reasons a draft cannot be saved (empty when it can). */
export function validateDraft(draft: Partial<BookingDraft>): string[] {
  const problems: string[] = [];
  if (!draft.property_id) problems.push('Falta escolher o chalé.');
  if (!draft.guest_name || !draft.guest_name.trim()) problems.push('Falta o nome do hóspede.');
  if (!isDateOnly(draft.check_in)) problems.push('Falta a data de check-in (ou ela é inválida).');
  if (!isDateOnly(draft.check_out)) problems.push('Falta a data de check-out (ou ela é inválida).');
  if (isDateOnly(draft.check_in) && isDateOnly(draft.check_out)) {
    const nights = nightsBetween(draft.check_in, draft.check_out);
    if (nights < 1) problems.push('O check-out precisa ser depois do check-in (mínimo 1 noite).');
    if (nights > 365) problems.push('A estadia não pode passar de 365 noites.');
  }
  if (draft.total_value !== undefined && (!Number.isFinite(draft.total_value) || draft.total_value < 0 || draft.total_value > 10_000_000)) {
    problems.push('O valor total é inválido.');
  }
  if (draft.status !== undefined && !BOOKING_STATUSES.includes(draft.status)) problems.push('Status inválido.');
  if ((draft.guest_name?.length ?? 0) > 200 || (draft.notes?.length ?? 0) > 2000) problems.push('Texto longo demais.');
  return problems;
}

/** Turns a database error into the sentence shown to the person. */
export function bookingErrorMessage(error: { code?: string; message?: string } | null | undefined): string {
  switch (error?.code) {
    case '23P01': return 'Esse chalé já está ocupado nessas noites.';
    case 'ORD00': return 'Sua assinatura do Ordomo não está ativa.';
    case 'ORD01':
    case 'ORD02':
    case 'ORD03': return error.message ?? 'Seu plano não permite essa ação.';
    case '23514': return 'As datas ou o status informados não são válidos.';
    default: return 'Não consegui salvar. Tente de novo em instantes.';
  }
}
