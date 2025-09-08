
import { useState, useEffect, useCallback } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { Booking } from '@/types/booking';
import { openWhatsApp as openWhatsAppUtil } from '@/lib/whatsapp';

export const useEditBookingForm = (booking?: Booking) => {
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
    status: 'confirmed' as Booking['status'],
    notes: ''
  });

  const [originalData, setOriginalData] = useState(formData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (booking) {
      const initialData = {
        guestName: booking.guest_name,
        phone: booking.phone,
        email: booking.email || '',
        city: booking.city || '',
        state: booking.state || '',
        bookingDate: booking.booking_date,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        totalValue: booking.total_value.toString(),
        paymentMethod: booking.payment_method,
        status: booking.status,
        notes: booking.notes || ''
      };
      setFormData(initialData);
      setOriginalData(initialData);
    }
  }, [booking]);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const calculateNights = useCallback(() => {
    if (formData.checkIn && formData.checkOut) {
      const checkIn = parseISO(formData.checkIn);
      const checkOut = parseISO(formData.checkOut);
      return Math.max(0, differenceInDays(checkOut, checkIn));
    }
    return 0;
  }, [formData.checkIn, formData.checkOut]);

  const openWhatsApp = useCallback(() => {
    if (formData.phone) {
      openWhatsAppUtil({ phone: formData.phone });
    }
  }, [formData.phone]);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  const resetForm = useCallback(() => {
    if (booking) {
      const resetData = {
        guestName: booking.guest_name,
        phone: booking.phone,
        email: booking.email || '',
        city: booking.city || '',
        state: booking.state || '',
        bookingDate: booking.booking_date,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        totalValue: booking.total_value.toString(),
        paymentMethod: booking.payment_method,
        status: booking.status,
        notes: booking.notes || ''
      };
      setFormData(resetData);
      setOriginalData(resetData);
    }
  }, [booking]);

  const updateOriginalData = useCallback(() => {
    setOriginalData(formData);
  }, [formData]);

  return {
    formData,
    handleInputChange,
    calculateNights,
    openWhatsApp,
    hasChanges,
    isLoading,
    setIsLoading,
    resetForm,
    updateOriginalData
  };
};
