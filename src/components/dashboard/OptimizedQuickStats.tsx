import { memo, useMemo } from 'react';
import { Bed, TrendingUp, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Booking } from '@/types/booking';
import { useMonthlyStats } from '@/hooks/useMonthlyStats';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OptimizedQuickStatsProps {
  bookings: Booking[];
  allBookings: Booking[];
  selectedMonth?: Date;
}

const OptimizedQuickStats = memo(({ 
  bookings, 
  allBookings, 
  selectedMonth = new Date() 
}: OptimizedQuickStatsProps) => {
  const {
    totalBookings,
    confirmedBookings,
    pendingBookings,
    historicalBookings,
    monthlyRevenue
  } = useMonthlyStats(allBookings, bookings, selectedMonth);

  const monthLabel = useMemo(() => {
    const isCurrentMonth = selectedMonth.getMonth() === new Date().getMonth() && 
                          selectedMonth.getFullYear() === new Date().getFullYear();
    return isCurrentMonth ? 'Este Mês' : format(selectedMonth, 'MMM yyyy', { locale: ptBR });
  }, [selectedMonth]);

  const formattedRevenue = useMemo(() => 
    monthlyRevenue.toLocaleString('pt-BR'),
    [monthlyRevenue]
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bed className="h-4 w-4 text-sage-600" />
            Reservas - {monthLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-sage-800">{totalBookings}</div>
          <p className="text-xs text-muted-foreground">
            {confirmedBookings} confirmadas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-sage-600" />
            Receita - {monthLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-sage-800">
            R$ {formattedRevenue}
          </div>
          <p className="text-xs text-muted-foreground">
            {pendingBookings} pendentes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <History className="h-4 w-4 text-sage-600" />
            Histórico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-sage-800">{historicalBookings}</div>
          <p className="text-xs text-muted-foreground">
            histórico - {monthLabel}
          </p>
        </CardContent>
      </Card>
    </div>
  );
});

OptimizedQuickStats.displayName = 'OptimizedQuickStats';

export default OptimizedQuickStats;