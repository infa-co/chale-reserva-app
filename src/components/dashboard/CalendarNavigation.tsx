
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarNavigationProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

const CalendarNavigation = ({ currentDate, onPreviousMonth, onNextMonth }: CalendarNavigationProps) => {
  return (
    <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border">
      <button
        onClick={onPreviousMonth}
        className="p-2 hover:bg-sage-50 rounded-lg transition-colors"
      >
        <ChevronLeft size={20} />
      </button>
      <h2 className="text-lg font-semibold text-sage-800">
        {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
      </h2>
      <button
        onClick={onNextMonth}
        className="p-2 hover:bg-sage-50 rounded-lg transition-colors"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default CalendarNavigation;
