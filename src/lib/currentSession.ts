import type { Session, SupabaseClient } from '@supabase/supabase-js';

export async function currentSession(auth: SupabaseClient['auth']): Promise<Session | null> {
  const { data, error } = await auth.getSession();
  if (error) throw new Error('Não foi possível recuperar sua sessão. Tente novamente.');
  if (!data.session) return null;
  if (data.session.expires_at && data.session.expires_at <= Math.floor(Date.now() / 1000) + 60) {
    const refreshed = await auth.refreshSession();
    if (refreshed.error) throw new Error('Não foi possível renovar sua sessão. Tente novamente.');
    return refreshed.data.session;
  }
  return data.session;
}