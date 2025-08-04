import { useState } from 'react';
import { Plus, History, Calendar, DollarSign } from 'lucide-react';
import { useHistoricalBookings } from '@/hooks/useHistoricalBookings';
import { useHistoricalBookingForm } from '@/hooks/useHistoricalBookingForm';
import { useBookingValidation } from '@/hooks/useBookingValidation';
import { useBookings } from '@/contexts/BookingContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GuestInfoForm } from '@/components/forms/GuestInfoForm';
import { HistoricalBookingForm } from '@/components/forms/HistoricalBookingForm';
import { PaymentForm } from '@/components/forms/PaymentForm';
import { NotesForm } from '@/components/forms/NotesForm';
import BookingExportDialog from '@/components/BookingExportDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const HistoricalBookings = () => {
  const { historicalBookings, loading, addHistoricalBooking } = useHistoricalBookings();
  const { bookings } = useBookings();
  const { formData, handleInputChange, calculateNights, getMaxDate } = useHistoricalBookingForm();
  const { validateBookingData } = useBookingValidation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const totalRevenue = historicalBookings.reduce((sum, booking) => sum + Number(booking.total_value), 0);

  return (
    <div className="p-4 space-y-6 pb-32">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6" />
            Histórico de Reservas
          </h1>
          <p className="text-muted-foreground">
            Gerencie reservas passadas e registre hóspedes anteriores
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <BookingExportDialog 
            activeBookings={bookings}
            historicalBookings={historicalBookings}
            totalCount={bookings.length + historicalBookings.length}
          />
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Reserva Passada
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Reserva Histórica</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
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

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
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
            <div className="text-2xl font-bold text-sage-800">{historicalBookings.length}</div>
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
              {historicalBookings.reduce((sum, booking) => sum + booking.nights, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historical Bookings List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Reservas Registradas</h2>
        
        {historicalBookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma reserva histórica encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Comece registrando suas reservas passadas para ter um histórico completo.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {historicalBookings.map((booking) => (
              <Card key={booking.id} className="border-l-4 border-l-amber-500">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{booking.guest_name}</h3>
                      <p className="text-sm text-muted-foreground">{booking.phone}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg text-sage-600">
                        R$ {Number(booking.total_value).toLocaleString('pt-BR')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {booking.nights} noite{booking.nights !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
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

                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <History className="h-3 w-3" />
                    Reserva histórica registrada em{' '}
                    {booking.historical_registration_date && 
                      format(new Date(booking.historical_registration_date), 'dd/MM/yyyy', { locale: ptBR })
                    }
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoricalBookings;