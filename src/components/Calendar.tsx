
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useBookings } from '@/contexts/BookingContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { bookings } = useBookings();
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      const checkIn = parseISO(booking.checkIn);
      const checkOut = parseISO(booking.checkOut);
      return isSameDay(checkIn, date) || isSameDay(checkOut, date);
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-sage-800">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>
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
