// Thin client for the WhatsApp Business Cloud API (Meta Graph API).
import { splitMessage } from './whatsappText.ts';

const graphBase = () => `https://graph.facebook.com/${Deno.env.get('WHATSAPP_GRAPH_VERSION') ?? 'v21.0'}`;
const token = () => Deno.env.get('WHATSAPP_ACCESS_TOKEN') ?? '';

export function whatsappConfigured(): boolean {
  return Boolean(Deno.env.get('WHATSAPP_ACCESS_TOKEN') && Deno.env.get('WHATSAPP_PHONE_NUMBER_ID'));
}

async function post(payload: Record<string, unknown>): Promise<boolean> {
  const response = await fetch(`${graphBase()}/${Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) console.error(`[WHATSAPP] send failed with status ${response.status}`);
  await response.body?.cancel();
  return response.ok;
}

export async function sendText(to: string, text: string): Promise<boolean> {
  let ok = true;
  for (const part of splitMessage(text)) {
    ok = (await post({ to, type: 'text', text: { body: part, preview_url: false } })) && ok;
  }
  return ok;
}

/** Up to 3 quick-reply buttons (title limit: 20 characters). */
export function sendButtons(to: string, body: string, buttons: { id: string; title: string }[]): Promise<boolean> {
  return post({
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: body.slice(0, 1024) },
      action: { buttons: buttons.slice(0, 3).map((b) => ({ type: 'reply', reply: { id: b.id, title: b.title.slice(0, 20) } })) },
    },
  });
}

/** Pre-approved template: the only kind of message allowed outside the 24-hour window. */
export function sendTemplate(to: string, name: string, language: string, bodyParams: string[]): Promise<boolean> {
  return post({
    to,
    type: 'template',
    template: {
      name,
      language: { code: language },
      components: [{ type: 'body', parameters: bodyParams.map((text) => ({ type: 'text', text })) }],
    },
  });
}

const MAX_MEDIA_BYTES = 8 * 1024 * 1024;

/** Downloads a media attachment the person sent (two steps: resolve the URL, then fetch it). */
export async function downloadMedia(mediaId: string): Promise<{ bytes: Uint8Array; mimeType: string } | null> {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(mediaId)) return null;
  const meta = await fetch(`${graphBase()}/${mediaId}`, { headers: { Authorization: `Bearer ${token()}` }, signal: AbortSignal.timeout(15000) });
  if (!meta.ok) { await meta.body?.cancel(); return null; }
  const info = await meta.json() as { url?: string; mime_type?: string; file_size?: number };
  if (!info.url || (info.file_size ?? 0) > MAX_MEDIA_BYTES) return null;
  const url = new URL(info.url);
  // The token is only ever sent to Meta's own media hosts.
  if (url.protocol !== 'https:' || !/(^|\.)(facebook\.com|fbcdn\.net|fbsbx\.com|whatsapp\.net)$/.test(url.hostname)) return null;
  const file = await fetch(url, { headers: { Authorization: `Bearer ${token()}` }, signal: AbortSignal.timeout(30000) });
  if (!file.ok) { await file.body?.cancel(); return null; }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length > MAX_MEDIA_BYTES) return null;
  return { bytes, mimeType: (info.mime_type ?? file.headers.get('content-type') ?? '').split(';')[0].trim() };
}

export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}
