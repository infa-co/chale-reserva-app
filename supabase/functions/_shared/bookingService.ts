// Server-side booking operations for one account. Every writer outside the browser goes
// through here so ownership, date rules and conflicts are checked the same way; the database
// constraints (no overlap, plan limits) remain the final word.
import { bookingErrorMessage, nightsBetween, staysOverlap, todayInSaoPaulo, validateDraft, type BookingDraft, type BookingStatus } from "./bookingRules.ts";

// deno-lint-ignore no-explicit-any
type Admin = any;

export interface PropertyRow { id: string; name: string; location: string | null; is_active: boolean; default_daily_rate: number | null }
export interface BookingRow {
  id: string; property_id: string | null; guest_name: string; phone: string; check_in: string; check_out: string;
  nights: number; total_value: number; payment_method: string; status: BookingStatus; notes: string | null;
}
export interface Conflict { source: 'ordomo' | 'external'; label: string; check_in: string; check_out: string }
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const BOOKING_COLUMNS = 'id, property_id, guest_name, phone, check_in, check_out, nights, total_value, payment_method, status, notes';

export async function listProperties(admin: Admin, userId: string): Promise<PropertyRow[]> {
  const { data, error } = await admin.from('properties')
    .select('id, name, location, is_active, default_daily_rate')
    .eq('user_id', userId).order('created_at', { ascending: true });
  if (error) throw new Error('Não foi possível ler os chalés');
  return data ?? [];
}

/** Ordomo bookings and imported platform reservations that occupy any of the nights. */
export async function findConflicts(admin: Admin, userId: string, propertyId: string, checkIn: string, checkOut: string, excludeBookingId?: string): Promise<Conflict[]> {
  const [own, external] = await Promise.all([
    admin.from('bookings').select('id, guest_name, check_in, check_out, status')
      .eq('user_id', userId).eq('property_id', propertyId).neq('status', 'cancelled')
      .lt('check_in', checkOut).gt('check_out', checkIn),
    admin.from('external_bookings').select('id, summary, platform_name, start_date, end_date, ical_syncs!inner(property_id)')
      .eq('user_id', userId).eq('ical_syncs.property_id', propertyId)
      .lt('start_date', checkOut).gt('end_date', checkIn),
  ]);
  if (own.error || external.error) throw new Error('Não foi possível verificar a disponibilidade');
  const conflicts: Conflict[] = [];
  // deno-lint-ignore no-explicit-any
  for (const b of (own.data ?? []) as any[]) {
    if (b.id !== excludeBookingId && staysOverlap(checkIn, checkOut, b.check_in, b.check_out)) {
      conflicts.push({ source: 'ordomo', label: b.guest_name, check_in: b.check_in, check_out: b.check_out });
    }
  }
  // deno-lint-ignore no-explicit-any
  for (const e of (external.data ?? []) as any[]) {
    if (staysOverlap(checkIn, checkOut, e.start_date, e.end_date)) {
      conflicts.push({ source: 'external', label: e.platform_name || 'Airbnb', check_in: e.start_date, check_out: e.end_date });
    }
  }
  return conflicts;
}

/** Checks a draft completely without saving it. */
export async function checkDraft(admin: Admin, userId: string, draft: Partial<BookingDraft>, excludeBookingId?: string): Promise<Result<BookingDraft>> {
  const problems = validateDraft(draft);
  if (problems.length > 0) return { ok: false, error: problems.join(' ') };
  const complete = draft as BookingDraft;
  const { data: property, error } = await admin.from('properties').select('id').eq('id', complete.property_id).eq('user_id', userId).maybeSingle();
  if (error || !property) return { ok: false, error: 'Esse chalé não existe na sua conta.' };
  if ((complete.status ?? 'confirmed') !== 'cancelled') {
    const conflicts = await findConflicts(admin, userId, complete.property_id, complete.check_in, complete.check_out, excludeBookingId);
    if (conflicts.length > 0) {
      const c = conflicts[0];
      const who = c.source === 'external' ? `reserva do ${c.label}` : `hóspede ${c.label}`;
      return { ok: false, error: `O chalé já está ocupado de ${c.check_in} a ${c.check_out} (${who}).` };
    }
  }
  return { ok: true, value: complete };
}

export async function createBooking(admin: Admin, userId: string, draft: Partial<BookingDraft>, createdVia: 'app' | 'whatsapp'): Promise<Result<BookingRow>> {
  const checked = await checkDraft(admin, userId, draft);
  if (!checked.ok) return checked;
  const d = checked.value;
  const { data, error } = await admin.from('bookings').insert({
    user_id: userId,
    property_id: d.property_id,
    guest_name: d.guest_name.trim(),
    phone: (d.phone ?? '').trim(),
    email: d.email?.trim() || null,
    city: d.city?.trim() || null,
    state: d.state?.trim() || null,
    booking_date: todayInSaoPaulo(),
    check_in: d.check_in,
    check_out: d.check_out,
    nights: nightsBetween(d.check_in, d.check_out),
    total_value: d.total_value ?? 0,
    payment_method: d.payment_method?.trim() || 'Não informado',
    status: d.status ?? 'confirmed',
    notes: d.notes?.trim() || null,
    created_via: createdVia,
  }).select(BOOKING_COLUMNS).single();
  if (error) return { ok: false, error: bookingErrorMessage(error) };
  return { ok: true, value: data };
}

export async function getBooking(admin: Admin, userId: string, bookingId: string): Promise<BookingRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(bookingId)) return null;
  const { data } = await admin.from('bookings').select(BOOKING_COLUMNS).eq('id', bookingId).eq('user_id', userId).maybeSingle();
  return data ?? null;
}

export type BookingChanges = Partial<Pick<BookingDraft, 'guest_name' | 'phone' | 'check_in' | 'check_out' | 'total_value' | 'payment_method' | 'status' | 'notes'>>;

/** The booking as it would be after the changes, validated and checked for conflicts. */
export async function checkUpdate(admin: Admin, userId: string, bookingId: string, changes: BookingChanges): Promise<Result<{ before: BookingRow; after: BookingDraft }>> {
  const before = await getBooking(admin, userId, bookingId);
  if (!before) return { ok: false, error: 'Não encontrei essa reserva na sua conta.' };
  if (!before.property_id) return { ok: false, error: 'Essa reserva ainda não tem chalé definido; ajuste-a pelo app.' };
  const after: Partial<BookingDraft> = {
    property_id: before.property_id,
    guest_name: changes.guest_name ?? before.guest_name,
    phone: changes.phone ?? before.phone,
    check_in: changes.check_in ?? before.check_in,
    check_out: changes.check_out ?? before.check_out,
    total_value: changes.total_value ?? Number(before.total_value),
    payment_method: changes.payment_method ?? before.payment_method,
    status: changes.status ?? before.status,
    notes: changes.notes ?? before.notes ?? undefined,
  };
  const checked = await checkDraft(admin, userId, after, bookingId);
  if (!checked.ok) return checked;
  return { ok: true, value: { before, after: checked.value } };
}

export async function updateBooking(admin: Admin, userId: string, bookingId: string, changes: BookingChanges): Promise<Result<BookingRow>> {
  const checked = await checkUpdate(admin, userId, bookingId, changes);
  if (!checked.ok) return checked;
  const a = checked.value.after;
  const { data, error } = await admin.from('bookings').update({
    guest_name: a.guest_name.trim(),
    phone: (a.phone ?? '').trim(),
    check_in: a.check_in,
    check_out: a.check_out,
    nights: nightsBetween(a.check_in, a.check_out),
    total_value: a.total_value ?? 0,
    payment_method: a.payment_method?.trim() || 'Não informado',
    status: a.status ?? 'confirmed',
    notes: a.notes?.trim() || null,
  }).eq('id', bookingId).eq('user_id', userId).select(BOOKING_COLUMNS).single();
  if (error) return { ok: false, error: bookingErrorMessage(error) };
  return { ok: true, value: data };
}

export async function cancelBooking(admin: Admin, userId: string, bookingId: string): Promise<Result<BookingRow>> {
  const before = await getBooking(admin, userId, bookingId);
  if (!before) return { ok: false, error: 'Não encontrei essa reserva na sua conta.' };
  const { data, error } = await admin.from('bookings').update({ status: 'cancelled' })
    .eq('id', bookingId).eq('user_id', userId).select(BOOKING_COLUMNS).single();
  if (error) return { ok: false, error: bookingErrorMessage(error) };
  return { ok: true, value: data };
}

export async function listBookings(admin: Admin, userId: string, filter: { from?: string; to?: string; propertyId?: string; search?: string; includeCancelled?: boolean }): Promise<BookingRow[]> {
  let query = admin.from('bookings').select(BOOKING_COLUMNS).eq('user_id', userId).eq('is_historical', false);
  if (filter.propertyId) query = query.eq('property_id', filter.propertyId);
  if (!filter.includeCancelled) query = query.neq('status', 'cancelled');
  // Stays that touch [from, to]: they start on or before `to` and end on or after `from`.
  if (filter.to) query = query.lte('check_in', filter.to);
  if (filter.from) query = query.gte('check_out', filter.from);
  if (filter.search) query = query.ilike('guest_name', `%${filter.search.replace(/[%_,()]/g, ' ').trim()}%`);
  const { data, error } = await query.order('check_in', { ascending: true }).limit(20);
  if (error) throw new Error('Não foi possível ler as reservas');
  return data ?? [];
}
