import { parseDateOnly, todayDateOnly, toDateOnlyString } from '@/lib/dates';
import { useState } from 'react';
import { differenceInDays, parseISO, subDays } from 'date-fns';
import { openWhatsApp as openWhatsAppUtil } from '@/lib/whatsapp';

export const useHistoricalBookingForm = () => {
  const [formData, setFormData] = useState({
    guestName: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    birthDate: '',
    cpf: '',
    bookingDate: '',
    checkIn: '',
    checkOut: '',
    totalValue: '',
    paymentMethod: '',
    notes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateNights = () => {
    if (formData.checkIn && formData.checkOut) {
      const checkIn = parseDateOnly(formData.checkIn);
      const checkOut = parseDateOnly(formData.checkOut);
      return Math.max(0, differenceInDays(checkOut, checkIn));
    }
    return 0;
  };

  const openWhatsApp = () => {
    if (formData.phone) {
      openWhatsAppUtil({ phone: formData.phone });
    }
  };

  // For historical bookings, we allow dates up to today but not future dates
  const getMaxDate = () => {
    return todayDateOnly();
  };

  return {
    formData,
    handleInputChange,
    calculateNights,
    openWhatsApp,
    getMaxDate
  };
};