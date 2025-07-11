
import { useState } from 'react';
import Calendar from '@/components/Calendar';
import { Badge } from '@/components/ui/badge';

interface CalendarWithFiltersProps {
  currentMonth: Date;
}

const CalendarWithFilters = ({ currentMonth }: CalendarWithFiltersProps) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');

  const filters = [
    { value: 'all', label: 'Todas', color: 'bg-gray-100 text-gray-800' },
    { value: 'confirmed', label: 'Confirmadas', color: 'bg-green-100 text-green-800' },
    { value: 'pending', label: 'Aguardando', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'cancelled', label: 'Canceladas', color: 'bg-red-100 text-red-800' }
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-center">
        {filters.map((filter) => (
          <Badge
            key={filter.value}
            className={`cursor-pointer transition-all ${
              statusFilter === filter.value
                ? filter.color + ' ring-2 ring-sage-400'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setStatusFilter(filter.value)}
          >
            {filter.label}
          </Badge>
        ))}
      </div>
      <Calendar currentMonth={currentMonth} statusFilter={statusFilter} />
    </div>
  );
};

export default CalendarWithFilters;
