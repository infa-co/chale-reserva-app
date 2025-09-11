
import { useState, useEffect } from 'react';
import { useBookings } from '@/contexts/BookingContext';
import { differenceInDays, parseISO, isToday, isTomorrow, isPast } from 'date-fns';
import { Booking } from '@/types/booking';

export interface Notification {
  id: string;
  type: 'checkin_today' | 'checkin_tomorrow' | 'checkout_today' | 'checkout_overdue' | 'payment_pending' | 'confirmation_needed' | 'birthday';
  title: string;
  message: string;
  booking: Booking;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionRequired: boolean;
}

export const useNotifications = () => {
  const { bookings } = useBookings();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const generateNotifications = () => {
      const newNotifications: Notification[] = [];

      bookings.forEach(booking => {
        const checkInDate = parseISO(booking.check_in);
        const checkOutDate = parseISO(booking.check_out);
        const today = new Date();

        // Check-in hoje
        if (isToday(checkInDate) && booking.status === 'confirmed') {
          newNotifications.push({
            id: `checkin-${booking.id}`,
            type: 'checkin_today',
            title: 'Check-in Hoje',
            message: `${booking.guest_name} tem check-in hoje`,
            booking,
            priority: 'high',
            actionRequired: true
          });
        }

        // Check-in amanhã
        if (isTomorrow(checkInDate) && booking.status === 'confirmed') {
          newNotifications.push({
            id: `checkin-tomorrow-${booking.id}`,
            type: 'checkin_tomorrow',
            title: 'Check-in Amanhã',
            message: `${booking.guest_name} tem check-in amanhã`,
            booking,
            priority: 'medium',
            actionRequired: false
          });
        }

        // Check-out hoje
        if (isToday(checkOutDate) && booking.status === 'confirmed') {
          newNotifications.push({
            id: `checkout-${booking.id}`,
            type: 'checkout_today',
            title: 'Check-out Hoje',
            message: `${booking.guest_name} tem check-out hoje`,
            booking,
            priority: 'high',
            actionRequired: true
          });
        }

        // Check-out em atraso
        if (isPast(checkOutDate) && booking.status === 'confirmed') {
          const daysOverdue = differenceInDays(today, checkOutDate);
          newNotifications.push({
            id: `overdue-${booking.id}`,
            type: 'checkout_overdue',
            title: 'Check-out em Atraso',
            message: `${booking.guest_name} está ${daysOverdue} dias em atraso`,
            booking,
            priority: 'urgent',
            actionRequired: true
          });
        }

        // Pagamento pendente
        if (booking.status === 'pending') {
          const daysUntilCheckin = differenceInDays(checkInDate, today);
          if (daysUntilCheckin <= 7) {
            newNotifications.push({
              id: `payment-${booking.id}`,
              type: 'payment_pending',
              title: 'Pagamento Pendente',
              message: `${booking.guest_name} - check-in em ${daysUntilCheckin} dias`,
              booking,
              priority: daysUntilCheckin <= 3 ? 'urgent' : 'high',
              actionRequired: true
            });
          }
        }

        // Aniversário do hóspede
        if (booking.birth_date && (booking.status === 'confirmed' || booking.status === 'checked_in' || booking.status === 'active')) {
          const birthDate = parseISO(booking.birth_date);
          const todayMonth = today.getMonth();
          const todayDay = today.getDate();
          const birthMonth = birthDate.getMonth();
          const birthDay = birthDate.getDate();
          
          if (todayMonth === birthMonth && todayDay === birthDay) {
            // Verificar se a reserva está ativa ou futura
            const isCurrentOrFuture = !isPast(checkOutDate);
            if (isCurrentOrFuture) {
              newNotifications.push({
                id: `birthday-${booking.id}`,
                type: 'birthday',
                title: '🎉 Aniversário do Hóspede',
                message: `${booking.guest_name} faz aniversário hoje!`,
                booking,
                priority: 'medium',
                actionRequired: true
              });
            }
          }
        }
      });

      // Ordenar por prioridade
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      newNotifications.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

      setNotifications(newNotifications);
    };

    generateNotifications();
  }, [bookings]);

  const getNotificationsByPriority = (priority: Notification['priority']) => {
    return notifications.filter(n => n.priority === priority);
  };

  const getActionRequiredNotifications = () => {
    return notifications.filter(n => n.actionRequired);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return {
    notifications,
    getNotificationsByPriority,
    getActionRequiredNotifications,
    dismissNotification,
    totalCount: notifications.length,
    urgentCount: notifications.filter(n => n.priority === 'urgent').length
  };
};
