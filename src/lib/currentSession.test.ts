import { describe, expect, it, vi } from 'vitest';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { currentSession } from './currentSession';

function authWith(expiresAt: number, refreshFails = false) {
  const session = { access_token: 'old-test-token', expires_at: expiresAt } as Session;
  const fresh = { access_token: 'new-test-token', expires_at: expiresAt + 3600 } as Session;
  const auth = {
    getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }),
    refreshSession: vi.fn().mockResolvedValue({ data: { session: fresh }, error: refreshFails ? new Error('unavailable') : null }),
  };
  return { auth: auth as unknown as SupabaseClient['auth'], refresh: auth.refreshSession, fresh, session };
}

describe('current access session', () => {
  it('renews an expired token before using it for the access check', async () => {
    const { auth, fresh, refresh } = authWith(Math.floor(Date.now() / 1000) - 1);
    expect(await currentSession(auth)).toBe(fresh);
    expect(refresh).toHaveBeenCalledOnce();
  });
  it('does not invoke a refresh for a valid token', async () => {
    const { auth, session, refresh } = authWith(Math.floor(Date.now() / 1000) + 3600);
    expect(await currentSession(auth)).toBe(session);
    expect(refresh).not.toHaveBeenCalled();
  });
  it('reports failed renewal instead of returning the expired token', async () => {
    const { auth } = authWith(Math.floor(Date.now() / 1000) - 1, true);
    await expect(currentSession(auth)).rejects.toThrow('renovar sua sessão');
  });
});