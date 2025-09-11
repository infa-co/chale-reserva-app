
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
      <div className="grid grid-cols-2 gap-4">
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
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-sage-600" />
            Reservas Este Mês
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-3xl font-bold text-sage-800 leading-tight">{stats.monthlyBookings}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-sage-600" />
            Receita Este Mês
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xl font-bold text-sage-800 leading-tight break-words">
            {formatCurrency(stats.monthlyRevenue)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Percent className="h-4 w-4 text-sage-600" />
            Taxa de Ocupação
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-3xl font-bold text-sage-800 leading-tight">
            {formatPercentage(stats.occupancyRate)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-sage-600" />
            Diária Média
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xl font-bold text-sage-800 leading-tight break-words">
            {formatCurrency(stats.averageDailyRate)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyStatsCard;
