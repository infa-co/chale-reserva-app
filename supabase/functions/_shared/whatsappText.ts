// Small pure helpers for the WhatsApp assistant (no Deno or network APIs).

/** Digits only, as WhatsApp reports senders (country code included, no "+"). */
export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

export function maskPhone(phone: string): string {
  const digits = normalizePhone(phone);
  return digits.length <= 4 ? digits : `${'•'.repeat(digits.length - 4)}${digits.slice(-4)}`;
}

/** 8-digit code the person sends from their own WhatsApp to prove the number is theirs. */
export function generateLinkCode(): string {
  const bytes = crypto.getRandomValues(new Uint32Array(1));
  return String(bytes[0] % 100_000_000).padStart(8, '0');
}

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Finds a link code in a message such as "Vincular Ordomo 4839 2105". */
export function extractLinkCode(text: string): string | null {
  const match = /(?<!\d)(\d{4})[\s-]?(\d{4})(?!\d)/.exec(text);
  return match ? match[1] + match[2] : null;
}

const strip = (text: string) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[.!,]/g, '').trim();

/** A plain "yes" to a pending confirmation. Anything longer goes to the assistant instead. */
export function isYes(text: string): boolean {
  return /^(sim|s|ok|okay|confirmo|confirmar|confirma|confirmado|pode|pode sim|pode confirmar|isso|isso mesmo|certo|correto|👍|✅)$/.test(strip(text));
}

export function isNo(text: string): boolean {
  return /^(nao|n|cancela|cancelar|cancele|deixa|deixa pra la|esquece|errado|nao confirmo|❌)$/.test(strip(text));
}

/** WhatsApp refuses text bodies above 4096 characters. */
export function splitMessage(text: string, limit = 3800): string[] {
  const parts: string[] = [];
  let rest = text.trim();
  while (rest.length > limit) {
    let cut = rest.lastIndexOf('\n', limit);
    if (cut < limit / 2) cut = rest.lastIndexOf(' ', limit);
    if (cut < limit / 2) cut = limit;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

/** Constant-time comparison of two hex strings. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Meta signs each webhook body with the app secret: "sha256=<hex hmac>". */
export async function validMetaSignature(rawBody: string, header: string | null, appSecret: string): Promise<boolean> {
  if (!header || !header.startsWith('sha256=')) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(appSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody)));
  const expected = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return safeEqual(expected, header.slice(7).toLowerCase());
}
