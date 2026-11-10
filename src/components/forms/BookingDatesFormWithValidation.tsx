import { parseDateOnly, todayDateOnly, toDateOnlyString } from '@/lib/dates';
import { CalendarIcon, AlertTriangle, CheckCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { StayConflictState } from '@/hooks/useStayConflict';
import { conflictMessage } from '@/lib/bookingConflicts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { VoiceInputButton } from './VoiceInputButton';
import { parseDateFromSpeech } from '@/lib/voiceParsers';
import { toast } from 'sonner';

interface BookingDatesFormWithValidationProps {
  formData: {
    bookingDate: string;
    checkIn: string;
    checkOut: string;
  };
  onInputChange: (field: string, value: string) => void;
  nights: number;
  excludeBookingId?: string; // Para edição
  conflict: StayConflictState;
}

export const BookingDatesFormWithValidation = ({ 
  formData, 
  onInputChange, 
  nights,
  excludeBookingId,
  conflict
}: BookingDatesFormWithValidationProps) => {
  const currentYear = new Date().getFullYear();
  const currentDate = todayDateOnly();
  const hasConflict = conflict.invalidDates || conflict.conflicts.length > 0;

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
          readOnly
          className="mt-1 bg-muted cursor-default"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="checkIn">Check-in *</Label>
          <div className="flex items-center gap-1.5 mt-1">
            <Input
              id="checkIn"
              type="date"
              value={formData.checkIn}
              onChange={(e) => onInputChange('checkIn', e.target.value)}
              min={currentDate}
              max={`${currentYear + 2}-12-31`}
              className={`min-w-0 ${validation?.hasConflict ? 'border-destructive' : ''}`}
            />
            <VoiceInputButton
              fieldId="checkIn"
              onResult={(text) => {
                const parsed = parseDateFromSpeech(text);
                if (parsed) {
                  onInputChange('checkIn', parsed);
                  toast.success(`Check-in: ${format(parseISO(parsed), 'dd/MM/yyyy')}`);
                } else {
                  toast.info(`Não entendi a data: "${text}". Tente "15 de março".`);
                }
              }}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="checkOut">Check-out *</Label>
          <div className="flex items-center gap-1.5 mt-1">
            <Input
              id="checkOut"
              type="date"
              value={formData.checkOut}
              onChange={(e) => onInputChange('checkOut', e.target.value)}
              min={formData.checkIn ? toDateOnlyString(new Date(parseDateOnly(formData.checkIn).getTime() + 86400000)) : currentDate}
              max={`${currentYear + 2}-12-31`}
              className={`min-w-0 ${validation?.hasConflict ? 'border-destructive' : ''}`}
            />
            <VoiceInputButton
              fieldId="checkOut"
              onResult={(text) => {
                const parsed = parseDateFromSpeech(text);
                if (parsed) {
                  onInputChange('checkOut', parsed);
                  toast.success(`Check-out: ${format(parseISO(parsed), 'dd/MM/yyyy')}`);
                } else {
                  toast.info(`Não entendi a data: "${text}". Tente "18 de março".`);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Validação de datas */}
      {hasConflict && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="space-y-1">
            {conflict.invalidDates && <p>O check-out precisa ser depois do check-in (mínimo 1 noite).</p>}
            {conflict.conflicts.map((c) => (
              <p key={`${c.source}-${c.id}`}>{conflictMessage(c)}</p>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {formData.checkIn && formData.checkOut && !hasConflict && !conflict.checking && (
        <div className="bg-sage-50 p-3 rounded-lg">
          <p className="text-sm text-sage-700">
            <strong>{nights} noites</strong>
          </p>
        </div>
      )}
    </div>
  );
};