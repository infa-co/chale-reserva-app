import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExternalBookings } from '@/hooks/useExternalBookings';
import { formatDateBR, todayDateOnly } from '@/lib/dates';

// Reservations imported from Airbnb and other calendars only carry dates. From here the owner
// turns one into a full Ordomo booking (guest, phone, value) without a conflict with itself.
const ExternalBookingsList = memo(() => {
  const { externalBookings, loading } = useExternalBookings();

  const upcoming = useMemo(() => {
    const today = todayDateOnly();
    return externalBookings.filter((b) => b.end_date >= today).slice(0, 5);
  }, [externalBookings]);

  if (loading || upcoming.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Reservas de outras plataformas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {upcoming.map((booking) => (
          <div key={booking.id} className="flex items-center justify-between gap-2 p-2 bg-orange-50 rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sage-800 truncate">
                {booking.platform_name} · {booking.summary}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDateBR(booking.start_date, true)} - {formatDateBR(booking.end_date, true)}
              </p>
            </div>
            <Link
              to={`/nova-reserva?external=${booking.id}`}
              className="flex items-center gap-1 text-xs font-medium text-sage-700 border border-sage-300 rounded-md px-2 py-1.5 hover:bg-sage-50 whitespace-nowrap"
            >
              <UserPlus size={14} />
              Registrar hóspede
            </Link>
          </div>
        ))}
        <p className="text-xs text-muted-foreground pt-1">
          O calendário só traz as datas. Registre o hóspede para guardar nome, telefone e valor.
        </p>
      </CardContent>
    </Card>
  );
});

ExternalBookingsList.displayName = 'ExternalBookingsList';

export default ExternalBookingsList;
