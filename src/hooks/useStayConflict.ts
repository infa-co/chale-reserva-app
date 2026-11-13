import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { findStayConflicts, isValidStay, StayLike } from '@/lib/bookingConflicts';

export interface StayConflictState {
  checking: boolean;
  invalidDates: boolean;
  conflicts: StayLike[];
}

/** Checks the chosen chalé + dates against Ordomo bookings and imported Airbnb (iCal) bookings. */
export function useStayConflict(propertyId?: string | null, checkIn?: string, checkOut?: string, excludeId?: string, excludeExternalId?: string): StayConflictState {
  const [state, setState] = useState<StayConflictState>({ checking: false, invalidDates: false, conflicts: [] });

  useEffect(() => {
    if (!checkIn || !checkOut) {
      setState({ checking: false, invalidDates: false, conflicts: [] });
      return;
    }
    if (!isValidStay(checkIn, checkOut)) {
      setState({ checking: false, invalidDates: true, conflicts: [] });
      return;
    }
    if (!propertyId) {
      setState({ checking: false, invalidDates: false, conflicts: [] });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, checking: true, invalidDates: false }));
    (async () => {
      const [own, ext] = await Promise.all([
        supabase
          .from('bookings')
          .select('id, property_id, check_in, check_out, status, guest_name')
          .eq('property_id', propertyId)
          .lt('check_in', checkOut)
          .gt('check_out', checkIn),
        supabase
          .from('external_bookings')
          .select('id, summary, start_date, end_date, platform_name, ical_syncs!inner(property_id)')
          .eq('ical_syncs.property_id', propertyId)
          .lt('start_date', checkOut)
          .gt('end_date', checkIn),
      ]);
      const existing: StayLike[] = [
        ...((own.data as any[]) || []).map((b) => ({ ...b, source: 'ordomo' as const })),
        ...((ext.data as any[]) || []).filter((e) => e.id !== excludeExternalId).map((e) => ({
          id: e.id,
          property_id: propertyId,
          check_in: e.start_date,
          check_out: e.end_date,
          status: 'confirmed',
          guest_name: e.summary || e.platform_name || 'Airbnb',
          source: 'external' as const,
        })),
      ];
      if (!cancelled) {
        setState({ checking: false, invalidDates: false, conflicts: findStayConflicts({ propertyId, checkIn, checkOut, excludeId }, existing) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [propertyId, checkIn, checkOut, excludeId, excludeExternalId]);

  return state;
}
