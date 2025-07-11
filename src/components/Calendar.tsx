
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useBookings } from '@/contexts/BookingContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  
  // Filter bookings that overlap with the current month and match status filter
  const currentMonthBookings = bookings.filter(booking => {
    const checkIn = parseISO(booking.check_in);
    const checkOut = parseISO(booking.check_out);
    
    // Include bookings that overlap with the current month
    const hasOverlap = checkIn <= monthEnd && checkOut >= monthStart;
    
    if (!hasOverlap) return false;
    
    if (statusFilter === 'all') return true;
    return booking.status === statusFilter;
  });
  
  const getBookingsForDate = (date: Date) => {
    return currentMonthBookings.filter(booking => {
      const checkIn = parseISO(booking.check_in);
      const checkOut = parseISO(booking.check_out);
      return isSameDay(checkIn, date) || isSameDay(checkOut, date);
    });
  };

  const getStatusBorderClass = (status: string, type: 'checkin' | 'checkout') => {
    const baseClass = type === 'checkin' ? 'border-l-4' : 'border-r-4';
    const colors = {
      confirmed: 'border-success',
      pending: 'border-warning',
      cancelled: 'border-danger'
    };
    return `${baseClass} ${colors[status as keyof typeof colors] || 'border-sage-500'}`;
  };

  const formatTooltipContent = (bookings: any[], type: 'checkin' | 'checkout') => {
    return bookings.map(booking => 
      `${booking.guest_name} - ${type === 'checkin' ? 'Check-in' : 'Check-out'} (${booking.status})`
    ).join('\n');
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
      
      <TooltipProvider>
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const dayBookings = getBookingsForDate(day);
            const checkInBookings = dayBookings.filter(booking => 
              isSameDay(parseISO(booking.check_in), day)
            );
            const checkOutBookings = dayBookings.filter(booking => 
              isSameDay(parseISO(booking.check_out), day)
            );
            
            const hasBothTypes = checkInBookings.length > 0 && checkOutBookings.length > 0;
            const hasBookings = dayBookings.length > 0;
            
            // Determine border classes
            let borderClasses = '';
            if (checkInBookings.length > 0) {
              borderClasses += ` ${getStatusBorderClass(checkInBookings[0].status, 'checkin')}`;
            }
            if (checkOutBookings.length > 0) {
              borderClasses += ` ${getStatusBorderClass(checkOutBookings[0].status, 'checkout')}`;
            }
            
            const dayElement = (
              <div
                className={`
                  h-9 w-9 flex items-center justify-center text-sm relative
                  transition-colors duration-200
                  ${hasBookings ? 'bg-accent/30 hover:bg-accent/50' : 'hover:bg-accent/20'}
                  ${borderClasses}
                  cursor-default
                `}
              >
                <span className="relative z-10 font-medium">
                  {format(day, 'd')}
                </span>
              </div>
            );
            
            if (hasBookings) {
              const tooltipContent = [
                ...checkInBookings.map(booking => 
                  `✓ ${booking.guest_name} - Check-in (${booking.status === 'confirmed' ? 'Confirmada' : booking.status === 'pending' ? 'Aguardando' : 'Cancelada'})`
                ),
                ...checkOutBookings.map(booking => 
                  `✗ ${booking.guest_name} - Check-out (${booking.status === 'confirmed' ? 'Confirmada' : booking.status === 'pending' ? 'Aguardando' : 'Cancelada'})`
                )
              ].join('\n');
              
              return (
                <Tooltip key={day.toISOString()}>
                  <TooltipTrigger asChild>
                    {dayElement}
                  </TooltipTrigger>
                  <TooltipContent side="top" className="whitespace-pre-line max-w-xs">
                    {tooltipContent}
                  </TooltipContent>
                </Tooltip>
              );
            }
            
            return (
              <div key={day.toISOString()}>
                {dayElement}
              </div>
            );
          })}
        </div>
      </TooltipProvider>
      
      <div className="mt-4 space-y-3">
        <div className="text-xs text-muted-foreground text-center font-medium">
          Legenda
        </div>
        
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
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
        
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 border-l-4 border-success bg-accent/20 rounded-sm"></div>
            <span>Check-in</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 border-r-4 border-success bg-accent/20 rounded-sm"></div>
            <span>Check-out</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
