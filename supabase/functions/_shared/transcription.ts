// Speech-to-text for WhatsApp voice notes. Claude does not take audio, so this calls a
// transcription service that speaks the common "/audio/transcriptions" multipart format.
// Configure TRANSCRIPTION_API_KEY (and optionally TRANSCRIPTION_API_URL / TRANSCRIPTION_MODEL);
// without a key, voice notes are answered with a request to type instead.

export function transcriptionConfigured(): boolean {
  return Boolean(Deno.env.get('TRANSCRIPTION_API_KEY'));
}

export async function transcribeAudio(bytes: Uint8Array, mimeType: string): Promise<string | null> {
  const key = Deno.env.get('TRANSCRIPTION_API_KEY');
  if (!key) return null;
  const url = Deno.env.get('TRANSCRIPTION_API_URL') ?? 'https://api.openai.com/v1/audio/transcriptions';
  const extension = mimeType.includes('mpeg') ? 'mp3' : mimeType.includes('mp4') ? 'm4a' : mimeType.includes('wav') ? 'wav' : 'ogg';
  const form = new FormData();
  form.append('file', new Blob([bytes.slice().buffer as ArrayBuffer], { type: mimeType || 'audio/ogg' }), `audio.${extension}`);
  form.append('model', Deno.env.get('TRANSCRIPTION_MODEL') ?? 'whisper-1');
  form.append('language', 'pt');
  form.append('response_format', 'json');
  const response = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: form, signal: AbortSignal.timeout(45000) });
  if (!response.ok) {
    console.error(`[TRANSCRIPTION] failed with status ${response.status}`);
    await response.body?.cancel();
    return null;
  }
  const data = await response.json() as { text?: string };
  const text = (data.text ?? '').trim();
  return text ? text.slice(0, 4000) : null;
}
