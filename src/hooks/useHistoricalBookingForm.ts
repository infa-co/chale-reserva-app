import { useState } from 'react';
import { differenceInDays, parseISO, subDays } from 'date-fns';

export const useHistoricalBookingForm = () => {
  const [formData, setFormData] = useState({
    guestName: '',
    phone: '',
    email: '',
    city: '',
    state: '',
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
      const checkIn = parseISO(formData.checkIn);
      const checkOut = parseISO(formData.checkOut);
      return Math.max(0, differenceInDays(checkOut, checkIn));
    }
    return 0;
  };

  const openWhatsApp = () => {
    if (formData.phone) {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      window.open(`https://wa.me/55${cleanPhone}`, '_blank');
    }
  };

  // For historical bookings, we allow dates up to today but not future dates
  const getMaxDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return {
    formData,
    handleInputChange,
    calculateNights,
    openWhatsApp,
    getMaxDate
  };
};