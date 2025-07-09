
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface NotesFormProps {
  notes: string;
  onInputChange: (field: string, value: string) => void;
}

export const NotesForm = ({ notes, onInputChange }: NotesFormProps) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border space-y-4">
      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => onInputChange('notes', e.target.value)}
          placeholder="Observações adicionais sobre a reserva..."
          className="mt-1 min-h-[80px]"
        />
      </div>
    </div>
  );
};
