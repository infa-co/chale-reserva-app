
import { useState } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { openWhatsApp as openWhatsAppUtil } from '@/lib/whatsapp';

export const useBookingForm = (initialPropertyId?: string) => {
  const [formData, setFormData] = useState({
    guestName: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    birthDate: '',
    cpf: '',
    bookingDate: new Date().toLocaleDateString('sv-SE'), // formato YYYY-MM-DD na timezone local
    checkIn: '',
    checkOut: '',
    totalValue: '',
    paymentMethod: '',
    status: 'confirmed' as const,
    notes: '',
    propertyId: initialPropertyId || ''
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
      openWhatsAppUtil({ phone: formData.phone });
    }
  };

  return {
    formData,
    handleInputChange,
    calculateNights,
    openWhatsApp
  };
};
