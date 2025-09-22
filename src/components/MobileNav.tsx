
import { Home, Plus, Calendar, Users, Building, History } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { usePlanRestrictions } from '@/hooks/usePlanRestrictions';
import { useOptimizedBookings } from '@/hooks/useOptimizedBookings';
import { toast } from 'sonner';

const MobileNav = () => {
  const location = useLocation();
  const { checkBookingLimit, getBillingPeriod, limits } = usePlanRestrictions();
  const { bookings } = useOptimizedBookings();

  // Calcular reservas no período de faturamento
  const { start: billingStart, end: billingEnd } = getBillingPeriod();
  const bookingsThisMonth = bookings.filter(booking => {
    const dateStr = booking.booking_date || booking.created_at?.slice(0, 10);
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= billingStart && d < billingEnd;
  }).length;

  const canCreateBooking = checkBookingLimit(bookingsThisMonth);

  const handleNewBookingClick = (e: React.MouseEvent) => {
    if (!canCreateBooking) {
      e.preventDefault();
      toast.error(`Você atingiu o limite de ${limits.maxBookingsPerMonth} reservas no período de faturamento. Faça upgrade do seu plano!`);
    }
  };

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Início' },
    { href: '/reservas', icon: Calendar, label: 'Reservas' },
    { href: '/nova-reserva', icon: Plus, label: 'Nova', isButton: true },
    { href: '/historico-reservas', icon: History, label: 'Histórico' },
    { href: '/meus-chales', icon: Building, label: 'Chalés' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 sm:px-4 py-2 z-50">
      <div className="flex justify-around items-center max-w-sm sm:max-w-md lg:max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const IconComponent = item.icon;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={item.isButton ? handleNewBookingClick : undefined}
              className={`flex flex-col items-center p-1.5 sm:p-2 rounded-lg transition-colors touch-manipulation ${
                item.isButton
                  ? canCreateBooking
                    ? 'bg-sage-600 text-white min-h-[44px] min-w-[44px]'
                    : 'bg-gray-400 text-white min-h-[44px] min-w-[44px] cursor-not-allowed opacity-75'
                  : isActive
                  ? 'text-sage-600'
                  : 'text-gray-600'
              }`}
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <IconComponent 
                size={item.isButton ? 18 : 16} 
                className={`${item.isButton ? 'text-white' : ''} sm:w-5 sm:h-5`} 
              />
              <span className={`text-xs mt-0.5 sm:mt-1 ${item.isButton ? 'text-white' : ''} leading-tight text-center`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
