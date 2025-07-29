
import { useState } from 'react';
import { differenceInDays, parseISO } from 'date-fns';

export const useBookingForm = () => {
  const [formData, setFormData] = useState({
    guestName: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    bookingDate: new Date().toLocaleDateString('sv-SE'), // formato YYYY-MM-DD na timezone local
    checkIn: '',
    checkOut: '',
    totalValue: '',
    paymentMethod: '',
    status: 'confirmed' as const,
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

  return {
    formData,
    handleInputChange,
    calculateNights,
    openWhatsApp
  };
};
