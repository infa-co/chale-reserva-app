
import { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useBookings } from '@/contexts/BookingContext';
import { useExternalBookings } from '@/hooks/useExternalBookings';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarProps {
  currentMonth?: Date;
  statusFilter?: 'all' | 'confirmed' | 'pending' | 'cancelled';
}

const Calendar = memo(({ currentMonth, statusFilter = 'all' }: CalendarProps) => {
  const [internalCurrentDate, setInternalCurrentDate] = useState(new Date());
  const { bookings } = useBookings();
  const { externalBookings } = useExternalBookings();
  
  const activeDate = currentMonth || internalCurrentDate;
  
  useEffect(() => {
    if (currentMonth) {
      setInternalCurrentDate(currentMonth);
    }
  }, [currentMonth]);
  
  // Memoize date calculations
  const dateInfo = useMemo(() => {
    const monthStart = startOfMonth(activeDate);
    const monthEnd = endOfMonth(activeDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    return { monthStart, monthEnd, calendarStart, calendarEnd, days };
  }, [activeDate]);

  // Memoize filtered bookings
  const currentMonthBookings = useMemo(() => {
    return bookings.filter(booking => {
      const checkIn = parseISO(booking.check_in);
      const checkOut = parseISO(booking.check_out);
      
      const hasOverlap = checkIn <= dateInfo.monthEnd && checkOut >= dateInfo.monthStart;
      
      if (!hasOverlap) return false;
      
      if (statusFilter === 'all') return true;
      return booking.status === statusFilter;
    });
  }, [bookings, dateInfo.monthStart, dateInfo.monthEnd, statusFilter]);

  // Memoize filtered external bookings
  const currentMonthExternalBookings = useMemo(() => {
    return externalBookings.filter(booking => {
      const startDate = new Date(booking.start_date);
      const endDate = new Date(booking.end_date);
      
      return startDate <= dateInfo.monthEnd && endDate >= dateInfo.monthStart;
    });
  }, [externalBookings, dateInfo.monthStart, dateInfo.monthEnd]);
  
  const getBookingsForDate = useCallback((date: Date) => {
    return currentMonthBookings.filter(booking => {
      const checkIn = parseISO(booking.check_in);
      const checkOut = parseISO(booking.check_out);
      return isSameDay(checkIn, date) || isSameDay(checkOut, date);
    });
  }, [currentMonthBookings]);

  const getExternalBookingsForDate = useCallback((date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return currentMonthExternalBookings.filter(booking => {
      return dateStr >= booking.start_date && dateStr <= booking.end_date;
    });
  }, [currentMonthExternalBookings]);

  const getStatusBorderClass = useCallback((status: string, type: 'checkin' | 'checkout') => {
    const baseClass = type === 'checkin' ? 'border-l-4' : 'border-r-4';
    const colors = {
      confirmed: 'border-success',
      pending: 'border-warning',
      cancelled: 'border-danger'
    };
    return `${baseClass} ${colors[status as keyof typeof colors] || 'border-sage-500'}`;
  }, []);

  const previousMonth = useCallback(() => {
    setInternalCurrentDate(new Date(activeDate.getFullYear(), activeDate.getMonth() - 1));
  }, [activeDate]);

  const nextMonth = useCallback(() => {
    setInternalCurrentDate(new Date(activeDate.getFullYear(), activeDate.getMonth() + 1));
  }, [activeDate]);

  // Memoize week days calculation
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - date.getDay() + i + 1); // Começar na segunda-feira
      return format(date, 'EEE', { locale: ptBR }).slice(0, 3);
    });
  }, []);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-sage-800">
          {format(activeDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        {!currentMonth && (
          <div className="flex gap-2">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-sage-50 rounded-lg transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-sage-50 rounded-lg transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {dateInfo.days.map(day => {
          const dayBookings = getBookingsForDate(day);
          const dayExternalBookings = getExternalBookingsForDate(day);
          const checkInBookings = dayBookings.filter(booking => 
            isSameDay(parseISO(booking.check_in), day)
          );
          const checkOutBookings = dayBookings.filter(booking => 
            isSameDay(parseISO(booking.check_out), day)
          );
          
          const hasBookings = dayBookings.length > 0;
          const hasExternalBookings = dayExternalBookings.length > 0;
          const isCurrentMonth = day >= dateInfo.monthStart && day <= dateInfo.monthEnd;
          
          let borderClasses = '';
          let backgroundClass = '';
          
          if (hasExternalBookings) {
            backgroundClass = 'bg-orange-100 hover:bg-orange-200';
          } else if (hasBookings) {
            backgroundClass = 'bg-sage-200/80 hover:bg-sage-300';
          } else {
            backgroundClass = 'hover:bg-sage-100';
          }
          
          if (checkInBookings.length > 0) {
            borderClasses += ` ${getStatusBorderClass(checkInBookings[0].status, 'checkin')}`;
          }
          if (checkOutBookings.length > 0) {
            borderClasses += ` ${getStatusBorderClass(checkOutBookings[0].status, 'checkout')}`;
          }
          
          return (
            <div
              key={day.toISOString()}
              className={`
                h-9 w-9 flex items-center justify-center text-sm relative
                transition-colors duration-200 rounded-sm
                ${backgroundClass}
                ${borderClasses}
                ${!isCurrentMonth ? 'text-gray-400' : 'text-sage-800'}
                cursor-default
              `}
            >
              <span className="relative z-10 font-medium">
                {format(day, 'd')}
              </span>
              {hasExternalBookings && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full transform translate-x-1 -translate-y-1" />
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 space-y-4">
        <div className="text-sm font-medium text-sage-800 text-center border-b border-sage-200 pb-2">
          Legenda do Calendário
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status das Reservas */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-sage-700 uppercase tracking-wide text-center">Status das Reservas</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 justify-center">
                <div className="w-4 h-4 bg-success rounded-full flex-shrink-0"></div>
                <span className="text-sm text-muted-foreground">Confirmadas</span>
              </div>
              <div className="flex items-center gap-3 justify-center">
                <div className="w-4 h-4 bg-warning rounded-full flex-shrink-0"></div>
                <span className="text-sm text-muted-foreground">Aguardando</span>
              </div>
              <div className="flex items-center gap-3 justify-center">
                <div className="w-4 h-4 bg-danger rounded-full flex-shrink-0"></div>
                <span className="text-sm text-muted-foreground">Canceladas</span>
              </div>
            </div>
          </div>
          
          {/* Tipos de Eventos */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-sage-700 uppercase tracking-wide text-center">Tipos de Eventos</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 justify-center">
                <div className="w-8 h-5 border-l-4 border-success bg-sage-200/60 rounded-sm flex-shrink-0"></div>
                <span className="text-sm text-muted-foreground">Check-in</span>
              </div>
              <div className="flex items-center gap-3 justify-center">
                <div className="w-8 h-5 border-r-4 border-success bg-sage-200/60 rounded-sm flex-shrink-0"></div>
                <span className="text-sm text-muted-foreground">Check-out</span>
              </div>
              <div className="flex items-center gap-3 justify-center">
                <div className="w-8 h-5 bg-orange-100 rounded-sm flex-shrink-0 relative">
                  <div className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full transform translate-x-1 -translate-y-1" />
                </div>
                <span className="text-sm text-muted-foreground">Reservas Externas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

Calendar.displayName = 'Calendar';

export default Calendar;
