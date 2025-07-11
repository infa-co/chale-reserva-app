
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Booking } from '@/types/booking';

interface MonthlyBookingsProps {
  bookings: Booking[];
  month: Date;
  title: string;
}

const MonthlyBookings = ({ bookings, month, title }: MonthlyBookingsProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'status-confirmed';
      case 'pending':
        return 'status-pending';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Aguardando';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma reserva este mês</p>
        ) : (
          bookings.slice(0, 3).map((booking) => (
            <div key={booking.id} className="flex items-center justify-between p-2 bg-sage-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sage-800 truncate">
                  {booking.guest_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(booking.check_in), 'dd/MM')} - {format(new Date(booking.check_out), 'dd/MM')}
                </p>
              </div>
              <div className={`status-badge ${getStatusColor(booking.status)}`}>
                {getStatusLabel(booking.status)}
              </div>
            </div>
          ))
        )}
        {bookings.length > 3 && (
          <Link 
            to="/reservas" 
            className="text-xs text-sage-600 hover:underline block text-center pt-2"
          >
            Ver todas ({bookings.length})
          </Link>
        )}
      </CardContent>
    </Card>
  );
};

export default MonthlyBookings;
