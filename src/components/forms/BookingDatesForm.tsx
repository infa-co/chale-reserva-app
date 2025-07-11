
import { CalendarIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface BookingDatesFormProps {
  formData: {
    bookingDate: string;
    checkIn: string;
    checkOut: string;
  };
  onInputChange: (field: string, value: string) => void;
  nights: number;
}

export const BookingDatesForm = ({ formData, onInputChange, nights }: BookingDatesFormProps) => {
  const currentYear = new Date().getFullYear();
  const currentDate = new Date().toISOString().split('T')[0];
  
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border space-y-4">
      <h3 className="font-semibold text-sage-800 flex items-center gap-2">
        <CalendarIcon size={18} />
        Datas e Período
      </h3>
      
      <div>
        <Label htmlFor="bookingDate">Data da Reserva</Label>
        <Input
          id="bookingDate"
          type="date"
          value={formData.bookingDate}
          onChange={(e) => onInputChange('bookingDate', e.target.value)}
          min={`${currentYear}-01-01`}
          max={`${currentYear + 2}-12-31`}
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="checkIn">Check-in *</Label>
          <Input
            id="checkIn"
            type="date"
            value={formData.checkIn}
            onChange={(e) => onInputChange('checkIn', e.target.value)}
            min={currentDate}
            max={`${currentYear + 2}-12-31`}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="checkOut">Check-out *</Label>
          <Input
            id="checkOut"
            type="date"
            value={formData.checkOut}
            onChange={(e) => onInputChange('checkOut', e.target.value)}
            min={formData.checkIn || currentDate}
            max={`${currentYear + 2}-12-31`}
            className="mt-1"
          />
        </div>
      </div>

      {formData.checkIn && formData.checkOut && (
        <div className="bg-sage-50 p-3 rounded-lg">
          <p className="text-sm text-sage-700">
            <strong>{nights} noites</strong>
          </p>
        </div>
      )}
    </div>
  );
};
