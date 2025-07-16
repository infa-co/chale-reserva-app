
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PropertyStats } from '@/types/property';
import { CalendarDays, TrendingUp, Percent, DollarSign } from 'lucide-react';

interface PropertyStatsCardProps {
  stats: PropertyStats;
  loading: boolean;
}

const PropertyStatsCard = ({ stats, loading }: PropertyStatsCardProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-sage-600" />
            Reservas Este Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-sage-800">{stats.monthlyBookings}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalBookings} total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-sage-600" />
            Receita Este Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-sage-800">
            {formatCurrency(stats.monthlyRevenue)}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(stats.totalRevenue)} total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Percent className="h-4 w-4 text-sage-600" />
            Taxa de Ocupação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-sage-800">
            {formatPercentage(stats.occupancyRate)}
          </div>
          <p className="text-xs text-muted-foreground">
            Este mês
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-sage-600" />
            Diária Média
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-sage-800">
            {formatCurrency(stats.averageDailyRate)}
          </div>
          <p className="text-xs text-muted-foreground">
            Histórico
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyStatsCard;
