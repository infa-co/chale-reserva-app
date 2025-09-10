import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBookings } from '@/contexts/BookingContext';
import { toast } from 'sonner';
import { useEditBookingForm } from '@/hooks/useEditBookingForm';
import { useBookingValidation } from '@/hooks/useBookingValidation';
import { GuestInfoForm } from '@/components/forms/GuestInfoForm';
import { BookingDatesFormWithValidation } from '@/components/forms/BookingDatesFormWithValidation';
import { PaymentForm } from '@/components/forms/PaymentForm';
import { NotesForm } from '@/components/forms/NotesForm';

const EditBooking = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { updateBooking, getBookingById } = useBookings();
  const booking = id ? getBookingById(id) : undefined;
  
  const { 
    formData, 
    handleInputChange, 
    calculateNights, 
    openWhatsApp,
    hasChanges,
    isLoading,
    setIsLoading,
    updateOriginalData
  } = useEditBookingForm(booking);
  const { checkDateConflict, validateBookingData } = useBookingValidation();

  if (!booking) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-xl font-bold text-sage-800 mb-4">Reserva não encontrada</h1>
        <Button onClick={() => navigate('/reservas')} variant="outline">
          Voltar para lista
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasChanges) {
      toast.info('Nenhuma alteração foi feita');
      return;
    }

    setIsLoading(true);
    
    try {
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

      // Verificar conflitos de data (excluindo a própria reserva)
      const dateConflict = checkDateConflict(formData.checkIn, formData.checkOut, booking.id);
      if (dateConflict?.hasConflict) {
        toast.error(dateConflict.message);
        return;
      }

      const nights = calculateNights();
      
      // Garantir que o status enviado respeita as restrições do banco
      const allowedStatuses = new Set(['requested','pending','confirmed','checked_in','active','checked_out','completed','cancelled']);
      const safeStatus = allowedStatuses.has(formData.status) ? formData.status : 'confirmed';
      
      await updateBooking(booking.id, {
        guest_name: formData.guestName,
        phone: formData.phone,
        email: formData.email || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        booking_date: formData.bookingDate,
        check_in: formData.checkIn,
        check_out: formData.checkOut,
        nights,
        total_value: parseFloat(formData.totalValue),
        payment_method: formData.paymentMethod,
        status: safeStatus as any,
        notes: formData.notes || undefined
      });

      // Update original data to reflect the saved state
      updateOriginalData();
      
      toast.success('Reserva atualizada com sucesso!');
      navigate(`/reserva/${booking.id}`);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Erro ao atualizar reserva');
    } finally {
      setIsLoading(false);
    }
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
        <h1 className="text-xl font-bold text-sage-800">Editar Reserva</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <GuestInfoForm
          formData={{
            guestName: formData.guestName,
            phone: formData.phone,
            email: formData.email,
            city: formData.city,
            state: formData.state
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
          excludeBookingId={booking.id}
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
            disabled={!hasChanges || isLoading}
          >
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditBooking;