import { createClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { subscribeToBookingChanges } from './bookingRealtime';

describe('booking realtime subscriptions', () => {
  it('reproduces the SDK failure when an already subscribed channel is reused', () => {
    const client = createClient('https://example.supabase.co', 'test-key');
    const channel = client.realtime.channel('bookings-realtime');
    channel.state = 'joining';
    expect(() => client.realtime.channel('bookings-realtime').on('postgres_changes', {
      event: '*', schema: 'public', table: 'bookings',
    }, () => {})).toThrow('after `subscribe()`');
  });

  it('keeps concurrent consumers and remounts isolated during delayed cleanup', () => {
    const client = createClient('https://example.supabase.co', 'test-key');
    const originalChannel = client.realtime.channel.bind(client.realtime);
    vi.spyOn(client.realtime, 'channel').mockImplementation((topic, options) => {
      const channel = originalChannel(topic, options);
      vi.spyOn(channel, 'subscribe').mockImplementation(() => {
        channel.state = 'joining';
        return channel;
      });
      return channel;
    });
    const remove = vi.spyOn(client.realtime, 'removeChannel').mockResolvedValue('ok');
    const cleanupFirst = subscribeToBookingChanges(client.realtime, 'user-a', () => {});
    const cleanupSecond = subscribeToBookingChanges(client.realtime, 'user-a', () => {});
    const [first, second] = client.realtime.getChannels();
    expect(first).not.toBe(second);
    expect(first.topic).not.toBe(second.topic);
    expect(first.bindings.postgres_changes[0].filter.filter).toBe('user_id=eq.user-a');
    cleanupFirst();
    expect(remove).toHaveBeenCalledWith(first);
    const cleanupRemount = subscribeToBookingChanges(client.realtime, 'user-a', () => {});
    expect(client.realtime.getChannels()).toHaveLength(3);
    cleanupSecond();
    expect(remove).toHaveBeenLastCalledWith(second);
    cleanupRemount();
  });
});