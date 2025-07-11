import { useBookings } from '@/contexts/BookingContext';
import { parseISO, isWithinInterval, isBefore, isAfter } from 'date-fns';

export const useBookingValidation = () => {
  const { bookings } = useBookings();

  const checkDateConflict = (
    checkIn: string, 
    checkOut: string, 
    excludeBookingId?: string
  ) => {
    if (!checkIn || !checkOut) return null;

    const newCheckIn = parseISO(checkIn);
    const newCheckOut = parseISO(checkOut);

    // Verificar se a data de saída é posterior à entrada
    if (!isBefore(newCheckIn, newCheckOut)) {
      return {
        hasConflict: true,
        type: 'invalid_dates',
        message: 'Data de saída deve ser posterior à data de entrada'
      };
    }

    const conflicts = bookings.filter(booking => {
      // Excluir a própria reserva se estiver editando
      if (excludeBookingId && booking.id === excludeBookingId) {
        return false;
      }

      // Apenas verificar reservas confirmadas e pendentes
      if (booking.status === 'cancelled') {
        return false;
      }

      const existingCheckIn = parseISO(booking.check_in);
      const existingCheckOut = parseISO(booking.check_out);

      // Verificar sobreposição de datas
      const hasOverlap = (
        // Nova reserva começa durante período existente
        isWithinInterval(newCheckIn, { start: existingCheckIn, end: existingCheckOut }) ||
        // Nova reserva termina durante período existente
        isWithinInterval(newCheckOut, { start: existingCheckIn, end: existingCheckOut }) ||
        // Nova reserva engloba período existente
        (isBefore(newCheckIn, existingCheckIn) && isAfter(newCheckOut, existingCheckOut))
      );

      return hasOverlap;
    });

    if (conflicts.length > 0) {
      return {
        hasConflict: true,
        type: 'date_overlap',
        message: `Conflito com ${conflicts.length} reserva(s) existente(s)`,
        conflictingBookings: conflicts
      };
    }

    return {
      hasConflict: false,
      type: null,
      message: 'Datas disponíveis'
    };
  };

  const validateBookingData = (data: {
    guestName: string;
    phone: string;
    checkIn: string;
    checkOut: string;
    totalValue: string;
  }) => {
    const errors: string[] = [];

    if (!data.guestName.trim()) {
      errors.push('Nome do hóspede é obrigatório');
    }

    if (!data.phone.trim()) {
      errors.push('Telefone é obrigatório');
    }

    if (!data.checkIn) {
      errors.push('Data de check-in é obrigatória');
    }

    if (!data.checkOut) {
      errors.push('Data de check-out é obrigatória');
    }

    if (!data.totalValue || parseFloat(data.totalValue) <= 0) {
      errors.push('Valor total deve ser maior que zero');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  return {
    checkDateConflict,
    validateBookingData
  };
};