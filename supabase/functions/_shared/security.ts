export const APP_ORIGIN = 'https://ordomo.com.br';
const origins = new Set([APP_ORIGIN, 'https://chale-reserva-app.lovable.app', 'https://id-preview--f6ff1bd1-b41e-4190-bb5c-012031170857.lovable.app', 'http://localhost:8080']);
export function trustedOrigin(origin: string | null): string {
  return origin && origins.has(origin) ? origin : APP_ORIGIN;
}
export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
}
// Never serialize request bodies, email addresses, provider responses, or errors.
export function safeLog(scope: string, step: string, _details?: unknown) {
  console.log(`[${scope}] ${step.replace(/[\r\n]/g, ' ')}`);
}
export function calendarUrl(value: unknown): URL {
  if (typeof value !== 'string') throw new Error('Link de calendário inválido');
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  const airbnb = /^www\.airbnb\.(com|com\.br|co\.uk|fr|de|es|it|pt|ca|com\.au)$/.test(host);
  const booking = host === 'admin.booking.com';
  const vrbo = host === 'www.vrbo.com' || host === 'www.homeaway.com';
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || !(airbnb || booking || vrbo)) {
    throw new Error('Use um link HTTPS de calendário do Airbnb, Booking.com ou Vrbo');
  }
  return url;
}
export async function fetchCalendar(value: unknown): Promise<string> {
  let url = calendarUrl(value);
  for (let hop = 0; hop < 4; hop++) {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
    if ([301,302,303,307,308].includes(response.status)) {
      const target = response.headers.get('location');
      await response.body?.cancel();
      if (!target) throw new Error('Redirecionamento inválido');
      url = calendarUrl(new URL(target, url).href);
      continue;
    }
    if (!response.ok) throw new Error('Não foi possível importar o calendário');
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Calendário vazio');
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value: chunk } = await reader.read();
      if (done) break;
      size += chunk.length;
      if (size > 2 * 1024 * 1024) { await reader.cancel(); throw new Error('Calendário muito grande'); }
      chunks.push(chunk);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const text = new TextDecoder().decode(bytes);
    if (!text.includes('BEGIN:VCALENDAR') || !text.includes('END:VCALENDAR')) throw new Error('Calendário inválido');
    return text;
  }
  throw new Error('Muitos redirecionamentos');
}
export function ownedBookingRecipient(booking: { user_id: string; guest_email?: string | null; status: string } | null, userId: string): string {
  if (!booking || booking.user_id !== userId || booking.status === 'cancelled') throw new Error('Reserva indisponível');
  const email = booking.guest_email?.trim().toLowerCase();
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('E-mail do hóspede inválido');
  return email;
}
export function formatBookingDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}