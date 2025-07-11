
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBookings } from '@/contexts/BookingContext';
import { toast } from 'sonner';
import { useBookingForm } from '@/hooks/useBookingForm';
import { GuestInfoForm } from '@/components/forms/GuestInfoForm';
import { BookingDatesForm } from '@/components/forms/BookingDatesForm';
import { PaymentForm } from '@/components/forms/PaymentForm';
import { NotesForm } from '@/components/forms/NotesForm';

const NewBooking = () => {
  const navigate = useNavigate();
  const { addBooking } = useBookings();
  const { formData, handleInputChange, calculateNights, openWhatsApp } = useBookingForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.guestName || !formData.phone || !formData.checkIn || !formData.checkOut || !formData.totalValue) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const nights = calculateNights();
    if (nights <= 0) {
      toast.error('Data de saída deve ser posterior à data de entrada');
      return;
    }

    await addBooking({
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
      status: formData.status,
      notes: formData.notes || undefined
    });

    navigate('/');
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

        <BookingDatesForm
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
