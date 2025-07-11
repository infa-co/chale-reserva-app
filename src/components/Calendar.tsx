
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useBookings } from '@/contexts/BookingContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarProps {
  currentMonth?: Date;
  statusFilter?: 'all' | 'confirmed' | 'pending' | 'cancelled';
}

const Calendar = ({ currentMonth, statusFilter = 'all' }: CalendarProps) => {
  const [internalCurrentDate, setInternalCurrentDate] = useState(new Date());
  const { bookings } = useBookings();
  
  // Use external currentMonth if provided, otherwise use internal state
  const activeDate = currentMonth || internalCurrentDate;
  
  // Sync internal state when external currentMonth changes
  useEffect(() => {
    if (currentMonth) {
      setInternalCurrentDate(currentMonth);
    }
  }, [currentMonth]);
  
  const monthStart = startOfMonth(activeDate);
  const monthEnd = endOfMonth(activeDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Filter bookings that have check-in in the current month and match status filter
  const currentMonthBookings = bookings.filter(booking => {
    const checkIn = parseISO(booking.checkIn);
    const isInCurrentMonth = isWithinInterval(checkIn, { start: monthStart, end: monthEnd });
    
    if (!isInCurrentMonth) return false;
    
    if (statusFilter === 'all') return true;
    return booking.status === statusFilter;
  });
  
  const getBookingsForDate = (date: Date) => {
    return currentMonthBookings.filter(booking => {
      const checkIn = parseISO(booking.checkIn);
      const checkOut = parseISO(booking.checkOut);
      return isSameDay(checkIn, date) || isSameDay(checkOut, date);
    });
  };

  const getStatusColor = (status: string, isCheckOut = false) => {
    const colors = {
      confirmed: isCheckOut ? 'bg-success' : 'bg-success',
      pending: isCheckOut ? 'bg-warning' : 'bg-warning',
      cancelled: isCheckOut ? 'bg-danger' : 'bg-danger'
    };
    return colors[status as keyof typeof colors] || 'bg-sage-500';
  };

  const previousMonth = () => {
    if (!currentMonth) {
      setInternalCurrentDate(new Date(activeDate.getFullYear(), activeDate.getMonth() - 1));
    }
  };

  const nextMonth = () => {
    if (!currentMonth) {
      setInternalCurrentDate(new Date(activeDate.getFullYear(), activeDate.getMonth() + 1));
    }
  };

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
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const dayBookings = getBookingsForDate(day);
          const checkInBookings = dayBookings.filter(booking => 
            isSameDay(parseISO(booking.checkIn), day)
          );
          const checkOutBookings = dayBookings.filter(booking => 
            isSameDay(parseISO(booking.checkOut), day)
          );
          
          return (
            <div
              key={day.toISOString()}
              className={`calendar-day ${dayBookings.length > 0 ? 'calendar-day-with-booking' : ''}`}
            >
              {format(day, 'd')}
              {checkInBookings.map((booking, index) => (
                <div 
                  key={`checkin-${booking.id}`}
                  className={`calendar-indicator ${getStatusColor(booking.status)}`}
                  style={{ left: `${4 + index * 6}px` }}
                ></div>
              ))}
              {checkOutBookings.map((booking, index) => (
                <div 
                  key={`checkout-${booking.id}`}
                  className={`calendar-indicator ${getStatusColor(booking.status, true)}`}
                  style={{ right: `${4 + index * 6}px` }}
                ></div>
              ))}
            </div>
          );
        })}
      </div>
      
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-success rounded-full"></div>
          <span>Confirmadas</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-warning rounded-full"></div>
          <span>Aguardando</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-danger rounded-full"></div>
          <span>Canceladas</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
