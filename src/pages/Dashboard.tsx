
import { memo, useState, useMemo, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useBookings } from '@/contexts/BookingContext';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import OptimizedQuickStats from '@/components/dashboard/OptimizedQuickStats';
import CalendarNavigation from '@/components/dashboard/CalendarNavigation';
import CalendarWithFilters from '@/components/dashboard/CalendarWithFilters';
import MonthlyBookings from '@/components/dashboard/MonthlyBookings';
import { usePlanRestrictions } from '@/hooks/usePlanRestrictions';
import { PlanUpgradePrompt } from '@/components/PlanUpgradePrompt';
import { PlanLimitationsDisplay } from '@/components/PlanLimitationsDisplay';
import { FeatureRestriction } from '@/components/FeatureRestriction';

const Dashboard = memo(() => {
  const { bookings, allBookings, loading } = useBookings();
  const [currentDate, setCurrentDate] = useState(new Date());
  const { checkBookingLimit, getBillingPeriod, currentPlan, limits } = usePlanRestrictions();

  const currentMonthBookings = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    return bookings.filter(booking => {
      const checkIn = new Date(booking.check_in);
      const checkOut = new Date(booking.check_out);
      return checkIn <= monthEnd && checkOut >= monthStart;
    });
  }, [bookings, currentDate]);

  // Verificar limite de reservas feitas no período de faturamento
  const currentMonthBookingCount = useMemo(() => {
    const { start: billingStart, end: billingEnd } = getBillingPeriod();
    return bookings.filter((booking) => {
      const dateStr = booking.booking_date || booking.created_at?.slice(0, 10);
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= billingStart && d < billingEnd;
    }).length;
  }, [bookings, getBillingPeriod]);

  const canCreateNewBooking = checkBookingLimit(currentMonthBookingCount);
  const isNearLimit = limits.maxBookingsPerMonth && currentMonthBookingCount >= limits.maxBookingsPerMonth * 0.8;

  const previousMonth = useCallback(() => {
    setCurrentDate(subMonths(currentDate, 1));
  }, [currentDate]);

  const nextMonthNav = useCallback(() => {
    setCurrentDate(addMonths(currentDate, 1));
  }, [currentDate]);

  const monthTitle = useMemo(() => 
    format(currentDate, 'MMMM yyyy', { locale: ptBR }),
    [currentDate]
  );

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
      <div className="p-3 md:p-4 space-y-4 md:space-y-6 pb-32">
        <DashboardHeader />
        
        {/* Aviso de limite próximo */}
        {isNearLimit && canCreateNewBooking && (
          <PlanUpgradePrompt 
            feature="mais reservas"
            description={`Você já tem ${currentMonthBookingCount} de ${limits.maxBookingsPerMonth} reservas no período de faturamento`}
            compact
          />
        )}
        
        {/* Bloqueio por limite excedido */}
        {!canCreateNewBooking && (
          <PlanUpgradePrompt 
            feature="reservas ilimitadas"
            description={`Limite de ${limits.maxBookingsPerMonth} reservas/mês atingido`}
          />
        )}
        
        <PlanLimitationsDisplay />
        
        <OptimizedQuickStats bookings={bookings} allBookings={allBookings} selectedMonth={currentDate} />

        <CalendarNavigation 
          currentDate={currentDate}
          onPreviousMonth={previousMonth}
          onNextMonth={nextMonthNav}
        />

        <CalendarWithFilters currentMonth={currentDate} />

        <MonthlyBookings 
          bookings={currentMonthBookings}
          month={currentDate}
          title={monthTitle}
        />

        {/* Botão de nova reserva - condicional */}
        {canCreateNewBooking ? (
          <Link
            to="/nova-reserva"
            className="fixed bottom-24 md:bottom-28 right-3 md:right-4 bg-sage-600 text-white p-3 md:p-4 rounded-full shadow-lg hover:bg-sage-700 transition-colors z-40 touch-manipulation"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <Plus size={20} className="md:hidden" />
            <Plus size={24} className="hidden md:block" />
          </Link>
        ) : (
          <div 
            className="fixed bottom-24 md:bottom-28 right-3 md:right-4 bg-gray-400 text-white p-3 md:p-4 rounded-full shadow-lg cursor-not-allowed z-40 touch-manipulation opacity-50"
            style={{ minHeight: '44px', minWidth: '44px' }}
            title="Limite de reservas atingido"
          >
            <Plus size={20} className="md:hidden" />
            <Plus size={24} className="hidden md:block" />
          </div>
        )}
      </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
