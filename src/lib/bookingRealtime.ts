import type { RealtimeClient, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Each mounted consumer owns its channel, including during asynchronous cleanup.
export function subscribeToBookingChanges(
  realtime: RealtimeClient,
  userId: string,
  onChange: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void,
) {
  const channel = realtime
    .channel(`bookings-realtime:${userId}:${crypto.randomUUID()}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'bookings',
      filter: `user_id=eq.${userId}`,
    }, onChange)
    .subscribe();

  return () => { void realtime.removeChannel(channel); };
}