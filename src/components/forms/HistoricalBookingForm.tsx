import { CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface HistoricalBookingFormProps {
  formData: {
    bookingDate: string;
    checkIn: string;
    checkOut: string;
  };
  onInputChange: (field: string, value: string) => void;
  nights: number;
  maxDate: string;
}

export const HistoricalBookingForm = ({ 
  formData, 
  onInputChange, 
  nights,
  maxDate 
}: HistoricalBookingFormProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="bookingDate" className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          Data da Reserva
        </Label>
        <Input
          id="bookingDate"
          type="date"
          value={formData.bookingDate}
          onChange={(e) => onInputChange('bookingDate', e.target.value)}
          max={maxDate}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="checkIn" className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Check-in
          </Label>
          <Input
            id="checkIn"
            type="date"
            value={formData.checkIn}
            onChange={(e) => onInputChange('checkIn', e.target.value)}
            max={maxDate}
            required
          />
        </div>

        <div>
          <Label htmlFor="checkOut" className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Check-out
          </Label>
          <Input
            id="checkOut"
            type="date"
            value={formData.checkOut}
            onChange={(e) => onInputChange('checkOut', e.target.value)}
            min={formData.checkIn}
            max={maxDate}
            required
          />
        </div>
      </div>

      {formData.checkIn && formData.checkOut && nights > 0 && (
        <div className="text-sm text-muted-foreground">
          Total de noites: {nights}
        </div>
      )}
    </div>
  );
};