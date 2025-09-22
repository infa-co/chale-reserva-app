import { useState, useMemo } from 'react';
import { usePlanRestrictions } from '@/hooks/usePlanRestrictions';
import { useOptimizedBookings } from '@/hooks/useOptimizedBookings';
import { toast } from 'sonner';
import { Plus, History, Calendar, DollarSign, ChevronDown, ChevronRight } from 'lucide-react';
import { useHistoricalBookings } from '@/hooks/useHistoricalBookings';
import { useHistoricalBookingForm } from '@/hooks/useHistoricalBookingForm';
import { useBookingValidation } from '@/hooks/useBookingValidation';
import { useBookings } from '@/contexts/BookingContext';
import { useOptimizedProperties } from '@/hooks/useOptimizedProperties';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { GuestInfoForm } from '@/components/forms/GuestInfoForm';
import { HistoricalBookingForm } from '@/components/forms/HistoricalBookingForm';
import { PaymentForm } from '@/components/forms/PaymentForm';
import { NotesForm } from '@/components/forms/NotesForm';
import BookingExportDialog from '@/components/BookingExportDialog';
import { format, parseISO, getYear, getMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Booking } from '@/types/booking';

interface BookingWithType extends Booking {
  type: 'historical' | 'confirmed';
}

interface MonthGroup {
  year: number;
  month: number;
  monthName: string;
  bookings: BookingWithType[];
  totalRevenue: number;
  totalBookings: number;
}

const HistoricalBookings = () => {
  const { historicalBookings, loading, addHistoricalBooking } = useHistoricalBookings();
  const { bookings } = useBookings();
  const { properties } = useOptimizedProperties();
  const { checkBookingLimit, getBillingPeriod, limits } = usePlanRestrictions();
  const { bookings: optimizedBookings } = useOptimizedBookings();
  const { formData, handleInputChange, calculateNights, getMaxDate } = useHistoricalBookingForm();
  const { validateBookingData } = useBookingValidation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
  
  // Calcular reservas no período de faturamento
  const { start: billingStart, end: billingEnd } = getBillingPeriod();
  const bookingsThisMonth = optimizedBookings.filter(booking => {
    const dateStr = booking.booking_date || booking.created_at?.slice(0, 10);
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= billingStart && d < billingEnd;
  }).length;

  const canCreateBooking = checkBookingLimit(bookingsThisMonth);

  const handleNewBookingClick = () => {
    if (!canCreateBooking) {
      toast.error(`Você atingiu o limite de ${limits.maxBookingsPerMonth} reservas no período de faturamento. Faça upgrade do seu plano!`);
      return;
    }
    setIsDialogOpen(true);
  };

  // Organize bookings by month and year
  const organizedBookings = useMemo(() => {
    // Combine historical bookings and confirmed current bookings
    const allBookings: BookingWithType[] = [
      ...historicalBookings.map(booking => ({ ...booking, type: 'historical' as const })),
      ...bookings
        .filter(booking => booking.status === 'confirmed')
        .map(booking => ({ ...booking, type: 'confirmed' as const }))
    ];

    // Group by year and month
    const groups: { [key: string]: MonthGroup } = {};

    allBookings.forEach(booking => {
      const checkInDate = parseISO(booking.check_in);
      const year = getYear(checkInDate);
      const month = getMonth(checkInDate); // 0-indexed
      const key = `${year}-${month}`;

      if (!groups[key]) {
        groups[key] = {
          year,
          month,
          monthName: format(checkInDate, 'MMMM yyyy', { locale: ptBR }),
          bookings: [],
          totalRevenue: 0,
          totalBookings: 0
        };
      }

      groups[key].bookings.push(booking);
      groups[key].totalRevenue += Number(booking.total_value);
      groups[key].totalBookings += 1;
    });

    // Sort by year and month (newest first)
    return Object.values(groups).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [historicalBookings, bookings]);

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => 
      prev.includes(monthKey) 
        ? prev.filter(key => key !== monthKey)
        : [...prev, monthKey]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateBookingData({
      guestName: formData.guestName,
      phone: formData.phone,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      totalValue: formData.totalValue
    });

    if (!validation.isValid) {
      validation.errors.forEach(error => console.error(error));
      return;
    }

    const nights = calculateNights();
    
    await addHistoricalBooking({
      guest_name: formData.guestName,
      phone: formData.phone,
      email: formData.email,
      city: formData.city,
      state: formData.state,
      birth_date: formData.birthDate || undefined,
      cpf: formData.cpf || undefined,
      booking_date: formData.bookingDate,
      check_in: formData.checkIn,
      check_out: formData.checkOut,
      nights,
      total_value: parseFloat(formData.totalValue),
      payment_method: formData.paymentMethod,
      status: 'completed' as const,
      notes: formData.notes
    });

    setIsDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="text-center">Carregando histórico...</div>
      </div>
    );
  }

  const totalRevenue = organizedBookings.reduce((sum, month) => sum + month.totalRevenue, 0);
  const totalBookingsCount = organizedBookings.reduce((sum, month) => sum + month.totalBookings, 0);

  return (
    <div className="p-2 sm:p-4 space-y-4 sm:space-y-6 pb-32">
      {/* Header - Mobile Responsive */}
      <div className="space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <History className="h-5 w-5 sm:h-6 sm:w-6" />
            Histórico de Reservas
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie reservas passadas e registre hóspedes anteriores
          </p>
        </div>
        
        {/* Mobile: Stack buttons vertically, Desktop: Horizontal */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 sm:justify-end">
          <BookingExportDialog 
            activeBookings={bookings}
            historicalBookings={historicalBookings}
            totalCount={bookings.length + historicalBookings.length}
            properties={properties}
          />
          
          <Button 
            className={`w-full sm:w-auto ${!canCreateBooking ? 'opacity-75 cursor-not-allowed' : ''}`}
            onClick={handleNewBookingClick}
            disabled={!canCreateBooking}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Registrar Reserva Passada</span>
            <span className="sm:hidden">Nova Reserva</span>
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="mx-2 w-[calc(100vw-1rem)] sm:mx-auto sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Registrar Reserva Histórica</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <GuestInfoForm 
                formData={formData}
                onInputChange={handleInputChange}
                onOpenWhatsApp={() => {}}
              />
              
              <HistoricalBookingForm
                formData={formData}
                onInputChange={handleInputChange}
                nights={calculateNights()}
                maxDate={getMaxDate()}
              />
              
              <PaymentForm
                formData={{
                  ...formData,
                  status: 'completed' as const
                }}
                onInputChange={handleInputChange}
              />
              
              <NotesForm
                notes={formData.notes}
                onInputChange={handleInputChange}
              />

              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 order-2 sm:order-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 order-1 sm:order-2">
                  Registrar Reserva
                </Button>
              </div>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <History className="h-4 w-4 text-sage-600" />
              Total de Reservas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sage-800">{totalBookingsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-sage-600" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sage-800">
              R$ {totalRevenue.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-sage-600" />
              Noites Hospedadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sage-800">
              {organizedBookings.reduce((sum, month) => 
                sum + month.bookings.reduce((monthSum, booking) => monthSum + booking.nights, 0), 0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Organized Bookings */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Reservas por Mês</h2>
        
        {organizedBookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma reserva encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Comece registrando suas reservas passadas ou confirme novas reservas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {organizedBookings.map((monthGroup) => {
              const monthKey = `${monthGroup.year}-${monthGroup.month}`;
              const isExpanded = expandedMonths.includes(monthKey);
              
              return (
                <Card key={monthKey} className="overflow-hidden">
                  <Collapsible>
                    <CollapsibleTrigger 
                      onClick={() => toggleMonth(monthKey)}
                      className="w-full"
                    >
                      <CardHeader className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div className="text-left">
                              <CardTitle className="text-lg capitalize">
                                {monthGroup.monthName}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {monthGroup.totalBookings} reserva{monthGroup.totalBookings !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-lg text-sage-600">
                              R$ {monthGroup.totalRevenue.toLocaleString('pt-BR')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Receita do mês
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {monthGroup.bookings
                            .sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime())
                            .map((booking) => (
                            <div 
                              key={booking.id} 
                              className={`p-4 rounded-lg border-l-4 ${
                                booking.type === 'historical' 
                                  ? 'border-l-amber-500 bg-amber-50/50' 
                                  : 'border-l-green-500 bg-green-50/50'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 space-y-2 sm:space-y-0">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-base">{booking.guest_name}</h3>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      booking.type === 'historical' 
                                        ? 'bg-amber-100 text-amber-700' 
                                        : 'bg-green-100 text-green-700'
                                    }`}>
                                      {booking.type === 'historical' ? 'Histórica' : 'Confirmada'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{booking.phone}</p>
                                  {booking.city && booking.state && (
                                    <p className="text-sm text-muted-foreground">
                                      {booking.city}, {booking.state}
                                    </p>
                                  )}
                                </div>
                                <div className="sm:text-right">
                                  <div className="font-semibold text-base text-sage-600">
                                    R$ {Number(booking.total_value).toLocaleString('pt-BR')}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {booking.nights} noite{booking.nights !== 1 ? 's' : ''}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Check-in:</span>
                                  <div className="font-medium">
                                    {format(new Date(booking.check_in), 'dd/MM/yyyy', { locale: ptBR })}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Check-out:</span>
                                  <div className="font-medium">
                                    {format(new Date(booking.check_out), 'dd/MM/yyyy', { locale: ptBR })}
                                  </div>
                                </div>
                              </div>

                              {booking.notes && (
                                <div className="mt-3 p-3 bg-muted rounded-md">
                                  <p className="text-sm">{booking.notes}</p>
                                </div>
                              )}

                              {booking.type === 'historical' && booking.historical_registration_date && (
                                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                  <History className="h-3 w-3" />
                                  Registrada em{' '}
                                  {format(new Date(booking.historical_registration_date), 'dd/MM/yyyy', { locale: ptBR })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoricalBookings;