
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBookings } from '@/contexts/BookingContext';
import { toast } from 'sonner';
import { useBookingForm } from '@/hooks/useBookingForm';
import { useBookingValidation } from '@/hooks/useBookingValidation';
import { usePlanRestrictions } from '@/hooks/usePlanRestrictions';
import { GuestInfoForm } from '@/components/forms/GuestInfoForm';
import { BookingDatesFormWithValidation } from '@/components/forms/BookingDatesFormWithValidation';
import { PaymentForm } from '@/components/forms/PaymentForm';
import { NotesForm } from '@/components/forms/NotesForm';
import { PropertySelector } from '@/components/forms/PropertySelector';
import { PlanUpgradePrompt } from '@/components/PlanUpgradePrompt';

const NewBooking = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const propertyIdFromUrl = searchParams.get('property_id');
  
  const { addBooking, bookings } = useBookings();
  const { formData, handleInputChange, calculateNights, openWhatsApp } = useBookingForm(propertyIdFromUrl || undefined);
  const { checkDateConflict, validateBookingData } = useBookingValidation();
  const { checkBookingLimit, limits } = usePlanRestrictions();

  // Verificar limite de reservas do mês atual
  const currentMonthBookingCount = bookings.filter(booking => {
    const checkIn = new Date(booking.check_in);
    const now = new Date();
    return checkIn.getMonth() === now.getMonth() && checkIn.getFullYear() === now.getFullYear();
  }).length;

  const canCreateBooking = checkBookingLimit(currentMonthBookingCount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar limite de reservas
    if (!canCreateBooking) {
      toast.error(`Limite de ${limits.maxBookingsPerMonth} reservas/mês atingido`);
      return;
    }
    
    // Validar property_id
    if (!formData.propertyId) {
      toast.error('Selecione uma propriedade');
      return;
    }

    // Validar dados básicos
    const validation = validateBookingData({
      guestName: formData.guestName,
      phone: formData.phone,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      totalValue: formData.totalValue
    });

    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    // Verificar conflitos de data
    const dateConflict = checkDateConflict(formData.checkIn, formData.checkOut);
    if (dateConflict?.hasConflict) {
      toast.error(dateConflict.message);
      return;
    }

    const nights = calculateNights();

    await addBooking({
      property_id: formData.propertyId,
      guest_name: formData.guestName,
      phone: formData.phone,
      email: formData.email || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      birth_date: formData.birthDate || undefined,
      cpf: formData.cpf || undefined,
      booking_date: formData.bookingDate,
      check_in: formData.checkIn,
      check_out: formData.checkOut,
      nights,
      total_value: parseFloat(formData.totalValue),
      payment_method: formData.paymentMethod,
      status: formData.status,
      notes: formData.notes || undefined
    });

    navigate('/dashboard');
  };

  return (
    <div className="p-4">
      <header className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="p-2"
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-xl font-bold text-sage-800">Nova Reserva</h1>
      </header>

      {/* Prompt de upgrade se limite atingido */}
      {!canCreateBooking && (
        <div className="mb-6">
          <PlanUpgradePrompt 
            feature="mais reservas"
            description={`Você atingiu o limite de ${limits.maxBookingsPerMonth} reservas este mês`}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6"
            style={{ opacity: canCreateBooking ? 1 : 0.6, pointerEvents: canCreateBooking ? 'auto' : 'none' }}>
        <PropertySelector
          value={formData.propertyId}
          onChange={(value) => handleInputChange('propertyId', value)}
          required={true}
          autoSelectIfOne={true}
        />

        <GuestInfoForm
          formData={{
            guestName: formData.guestName,
            phone: formData.phone,
            email: formData.email,
            city: formData.city,
            state: formData.state,
            birthDate: formData.birthDate,
            cpf: formData.cpf
          }}
          onInputChange={handleInputChange}
          onOpenWhatsApp={openWhatsApp}
        />

        <BookingDatesFormWithValidation
          formData={{
            bookingDate: formData.bookingDate,
            checkIn: formData.checkIn,
            checkOut: formData.checkOut
          }}
          onInputChange={handleInputChange}
          nights={calculateNights()}
        />

        <PaymentForm
          formData={{
            totalValue: formData.totalValue,
            paymentMethod: formData.paymentMethod,
            status: formData.status
          }}
          onInputChange={handleInputChange}
        />

        <NotesForm
          notes={formData.notes}
          onInputChange={handleInputChange}
        />

        <div className="flex gap-3 pb-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate(-1)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-sage-600 hover:bg-sage-700"
          >
            Salvar Reserva
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewBooking;
