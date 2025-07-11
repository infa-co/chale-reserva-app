import { useNavigate } from 'react-router-dom';
import { useBookings } from '@/contexts/BookingContext';
import { Booking } from '@/types/booking';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';

export const useDuplicateBooking = () => {
  const { addBooking } = useBookings();
  const navigate = useNavigate();

  const duplicateBooking = async (originalBooking: Booking) => {
    try {
      // Criar uma nova reserva com dados similares mas datas resetadas
      const newBookingData = {
        guest_name: originalBooking.guest_name,
        phone: originalBooking.phone,
        email: originalBooking.email,
        city: originalBooking.city,
        state: originalBooking.state,
        booking_date: format(new Date(), 'yyyy-MM-dd'),
        check_in: '', // Deixar vazio para o usuário preencher
        check_out: '', // Deixar vazio para o usuário preencher
        nights: originalBooking.nights,
        total_value: originalBooking.total_value,
        payment_method: originalBooking.payment_method,
        status: 'pending' as const, // Nova reserva sempre como pendente
        notes: originalBooking.notes ? `Duplicada de: ${originalBooking.guest_name}` : undefined
      };

      await addBooking(newBookingData);
      
      toast.success('Reserva duplicada com sucesso!', {
        description: 'Edite as datas da nova reserva'
      });

      // Navegar para a lista de reservas
      navigate('/reservas');
    } catch (error) {
      console.error('Erro ao duplicar reserva:', error);
      toast.error('Erro ao duplicar reserva');
    }
  };

  const duplicateWithSuggestedDates = async (originalBooking: Booking) => {
    try {
      // Sugerir datas uma semana após o check-out original
      const originalCheckOut = new Date(originalBooking.check_out);
      const suggestedCheckIn = format(addDays(originalCheckOut, 7), 'yyyy-MM-dd');
      const suggestedCheckOut = format(addDays(originalCheckOut, 7 + originalBooking.nights), 'yyyy-MM-dd');

      const newBookingData = {
        guest_name: originalBooking.guest_name,
        phone: originalBooking.phone,
        email: originalBooking.email,
        city: originalBooking.city,
        state: originalBooking.state,
        booking_date: format(new Date(), 'yyyy-MM-dd'),
        check_in: suggestedCheckIn,
        check_out: suggestedCheckOut,
        nights: originalBooking.nights,
        total_value: originalBooking.total_value,
        payment_method: originalBooking.payment_method,
        status: 'pending' as const,
        notes: originalBooking.notes ? `Duplicada de: ${originalBooking.guest_name}` : undefined
      };

      await addBooking(newBookingData);
      
      toast.success('Reserva duplicada com sucesso!', {
        description: 'Datas sugeridas aplicadas'
      });

      navigate('/reservas');
    } catch (error) {
      console.error('Erro ao duplicar reserva:', error);
      toast.error('Erro ao duplicar reserva');
    }
  };

  return {
    duplicateBooking,
    duplicateWithSuggestedDates
  };
};