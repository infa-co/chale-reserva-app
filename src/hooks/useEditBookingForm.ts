
import { useState, useEffect } from 'react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { Booking } from '@/types/booking';

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

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  return {
    formData,
    handleInputChange,
    calculateNights,
    openWhatsApp,
    hasChanges
  };
};
