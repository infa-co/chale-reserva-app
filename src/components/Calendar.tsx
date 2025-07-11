
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useBookings } from '@/contexts/BookingContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarProps {
  currentMonth?: Date;
}

const Calendar = ({ currentMonth }: CalendarProps) => {
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
  
  // Filter bookings that have check-in in the current month
  const currentMonthBookings = bookings.filter(booking => {
    const checkIn = parseISO(booking.checkIn);
    return isWithinInterval(checkIn, { start: monthStart, end: monthEnd });
  });
  
  const getBookingsForDate = (date: Date) => {
    return currentMonthBookings.filter(booking => {
      const checkIn = parseISO(booking.checkIn);
      const checkOut = parseISO(booking.checkOut);
      return isSameDay(checkIn, date) || isSameDay(checkOut, date);
    });
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
          const hasCheckIn = dayBookings.some(booking => 
            isSameDay(parseISO(booking.checkIn), day)
          );
          const hasCheckOut = dayBookings.some(booking => 
            isSameDay(parseISO(booking.checkOut), day)
          );
          
          return (
            <div
              key={day.toISOString()}
              className={`calendar-day ${dayBookings.length > 0 ? 'calendar-day-with-booking' : ''}`}
            >
              {format(day, 'd')}
              {hasCheckIn && (
                <div className="calendar-indicator bg-success"></div>
              )}
              {hasCheckOut && (
                <div className="calendar-indicator bg-danger" style={{ right: '4px' }}></div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-success rounded-full"></div>
          <span>Check-in</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-danger rounded-full"></div>
          <span>Check-out</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
