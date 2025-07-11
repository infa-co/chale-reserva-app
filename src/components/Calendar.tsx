
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
  
  const activeDate = currentMonth || internalCurrentDate;
  
  useEffect(() => {
    if (currentMonth) {
      setInternalCurrentDate(currentMonth);
    }
  }, [currentMonth]);
  
  const monthStart = startOfMonth(activeDate);
  const monthEnd = endOfMonth(activeDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const currentMonthBookings = bookings.filter(booking => {
    const checkIn = parseISO(booking.check_in);
    const checkOut = parseISO(booking.check_out);
    
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
            
            const hasBookings = dayBookings.length > 0;
            
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
                  transition-colors duration-200 rounded-sm
                  ${hasBookings ? 'bg-sage-200/80 hover:bg-sage-300' : 'hover:bg-sage-100'}
                  ${borderClasses}
                  cursor-default
                `}
              >
                <span className="relative z-10 font-medium text-sage-800">
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
      
      <div className="mt-6 space-y-4">
        <div className="text-sm font-medium text-sage-800 text-center border-b border-sage-200 pb-2">
          Legenda do Calendário
        </div>
        
        {/* Status das Reservas */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-sage-700 uppercase tracking-wide">Status das Reservas</h4>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-success rounded-full"></div>
              <span className="text-muted-foreground">Confirmadas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-warning rounded-full"></div>
              <span className="text-muted-foreground">Aguardando</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-danger rounded-full"></div>
              <span className="text-muted-foreground">Canceladas</span>
            </div>
          </div>
        </div>
        
        {/* Tipos de Eventos */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-sage-700 uppercase tracking-wide">Tipos de Eventos</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-4 border-l-4 border-success bg-sage-200/60 rounded-sm"></div>
              <span className="text-muted-foreground">Check-in</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-4 border-r-4 border-success bg-sage-200/60 rounded-sm"></div>
              <span className="text-muted-foreground">Check-out</span>
            </div>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-sage-100">
          Passe o mouse sobre os dias para ver detalhes das reservas
        </div>
      </div>
    </div>
  );
};

export default Calendar;
