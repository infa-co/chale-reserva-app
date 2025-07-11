
import { Bed, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Booking } from '@/types/booking';

interface QuickStatsProps {
  bookings: Booking[];
}

const QuickStats = ({ bookings }: QuickStatsProps) => {
  const confirmedBookings = bookings.filter(booking => booking.status === 'confirmed');
  const pendingBookings = bookings.filter(booking => booking.status === 'pending');
  const totalRevenue = confirmedBookings.reduce((sum, booking) => sum + Number(booking.total_value), 0);

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bed className="h-4 w-4 text-sage-600" />
            Total de Reservas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-sage-800">{bookings.length}</div>
          <p className="text-xs text-muted-foreground">
            {confirmedBookings.length} confirmadas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-sage-600" />
            Receita Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-sage-800">
            R$ {totalRevenue.toLocaleString('pt-BR')}
          </div>
          <p className="text-xs text-muted-foreground">
            {pendingBookings.length} pendentes
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickStats;
