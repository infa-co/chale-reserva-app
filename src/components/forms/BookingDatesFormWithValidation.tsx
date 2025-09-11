import { CalendarIcon, AlertTriangle, CheckCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBookingValidation } from '@/hooks/useBookingValidation';
import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BookingDatesFormWithValidationProps {
  formData: {
    bookingDate: string;
    checkIn: string;
    checkOut: string;
  };
  onInputChange: (field: string, value: string) => void;
  nights: number;
  excludeBookingId?: string; // Para edição
}

export const BookingDatesFormWithValidation = ({ 
  formData, 
  onInputChange, 
  nights,
  excludeBookingId 
}: BookingDatesFormWithValidationProps) => {
  const currentYear = new Date().getFullYear();
  const currentDate = new Date().toISOString().split('T')[0];
  const { checkDateConflict } = useBookingValidation();
  const [validation, setValidation] = useState<any>(null);

  useEffect(() => {
    if (formData.checkIn && formData.checkOut) {
      const result = checkDateConflict(formData.checkIn, formData.checkOut, excludeBookingId);
      setValidation(result);
    } else {
      setValidation(null);
    }
  }, [formData.checkIn, formData.checkOut, excludeBookingId, checkDateConflict]);
  
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
          min={excludeBookingId ? undefined : currentDate}
          max={currentDate}
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
            className={`mt-1 ${validation?.hasConflict ? 'border-destructive' : ''}`}
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
            className={`mt-1 ${validation?.hasConflict ? 'border-destructive' : ''}`}
          />
        </div>
      </div>

      {/* Validação de datas */}
      {validation && (
        <Alert variant={validation.hasConflict ? "destructive" : "default"}>
          {validation.hasConflict ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4 text-success" />
          )}
          <AlertDescription>
            {validation.message}
            {validation.conflictingBookings && validation.conflictingBookings.length > 0 && (
              <div className="mt-2 space-y-1">
                {validation.conflictingBookings.map((booking: any) => (
                  <div key={booking.id} className="text-xs p-2 bg-destructive/10 rounded">
                    <strong>{booking.guest_name}</strong>: {format(parseISO(booking.check_in), 'dd/MM/yyyy', { locale: ptBR })} até {format(parseISO(booking.check_out), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                ))}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {formData.checkIn && formData.checkOut && !validation?.hasConflict && (
        <div className="bg-sage-50 p-3 rounded-lg">
          <p className="text-sm text-sage-700">
            <strong>{nights} noites</strong>
          </p>
        </div>
      )}
    </div>
  );
};