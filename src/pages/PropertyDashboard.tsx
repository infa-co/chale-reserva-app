
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProperties } from '@/hooks/useProperties';
import { usePropertyStats } from '@/hooks/usePropertyStats';
import { useBookings } from '@/contexts/BookingContext';
import PropertyStatsCard from '@/components/properties/PropertyStatsCard';
import MonthlyBookings from '@/components/dashboard/MonthlyBookings';
import CalendarNavigation from '@/components/dashboard/CalendarNavigation';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PropertyDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const { getPropertyById, loading: propertiesLoading } = useProperties();
  const [currentDate, setCurrentDate] = useState(new Date());
  const { stats, loading: statsLoading } = usePropertyStats(id, currentDate);
  const { bookings } = useBookings();

  const property = id ? getPropertyById(id) : undefined;

  // Navegação de mês
  const previousMonth = useCallback(() => {
    setCurrentDate(prev => subMonths(prev, 1));
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentDate(prev => addMonths(prev, 1));
  }, []);

  // Filtrar reservas desta propriedade no mês selecionado
  const currentMonthBookings = useMemo(() => {
    return bookings.filter(booking => {
      if (booking.property_id !== id) return false;
      const bookingDate = new Date(booking.booking_date);
      return bookingDate >= startOfMonth(currentDate) && bookingDate <= endOfMonth(currentDate);
    });
  }, [bookings, id, currentDate]);

  if (propertiesLoading) {
    return (
      <div className="p-4">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Propriedade não encontrada</h1>
          <Link to="/meus-chales">
            <Button variant="outline">Voltar para Meus Chalés</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-32">
      {/* Header com breadcrumb */}
      <div className="space-y-4">
        <Link to="/meus-chales">
          <Button variant="ghost" className="p-0 h-auto text-sage-600 hover:text-sage-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Meus Chalés
          </Button>
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sage-100 rounded-lg">
            <Home className="h-6 w-6 text-sage-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-sage-800">{property.name}</h1>
            <p className="text-muted-foreground">{property.location}</p>
          </div>
        </div>
      </div>

      {/* Informações da propriedade */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações da Propriedade</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Capacidade</p>
            <p className="font-medium">{property.capacity} hóspedes</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valor Padrão</p>
            <p className="font-medium">
              {property.default_daily_rate 
                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.default_daily_rate)
                : 'Não definido'
              }
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className={`font-medium ${property.is_active ? 'text-green-600' : 'text-red-600'}`}>
              {property.is_active ? 'Ativo' : 'Inativo'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Criado em</p>
            <p className="font-medium">
              {format(new Date(property.created_at), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Observações fixas */}
      {property.fixed_notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Observações Fixas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sage-700">{property.fixed_notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Navegação de mês */}
      <CalendarNavigation
        currentDate={currentDate}
        onPreviousMonth={previousMonth}
        onNextMonth={nextMonth}
      />

      {/* Estatísticas */}
      {stats && (
        <div>
          <h2 className="text-lg font-semibold text-sage-800 mb-4">
            Estatísticas - {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <PropertyStatsCard stats={stats} loading={statsLoading} />
        </div>
      )}

      {/* Reservas do mês */}
      <MonthlyBookings 
        bookings={currentMonthBookings}
        month={currentDate}
        title={`Reservas - ${format(currentDate, 'MMMM yyyy', { locale: ptBR })}`}
      />
    </div>
  );
};

export default PropertyDashboard;
