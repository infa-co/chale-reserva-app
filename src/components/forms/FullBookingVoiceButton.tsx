import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { parseFullBookingFromSpeech, getFilledFieldsSummary } from '@/lib/voiceBookingParser';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

interface FullBookingVoiceButtonProps {
  onFieldsUpdate: (field: string, value: string) => void;
  disabled?: boolean;
}

export const FullBookingVoiceButton = ({ onFieldsUpdate, disabled }: FullBookingVoiceButtonProps) => {
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechToText();

  if (!isSupported) return null;

  const handleResult = (text: string) => {
    const parsed = parseFullBookingFromSpeech(text);
    const filled = getFilledFieldsSummary(parsed);

    if (filled.length === 0) {
      toast.info(
        `Não consegui extrair dados de: "${text}". Tente: "Reserva para João, telefone 11999999999, check-in 15 de março, check-out 18 de março, valor 500, pix"`,
        { duration: 6000 }
      );
      return;
    }

    // Apply all parsed fields
    if (parsed.guestName) onFieldsUpdate('guestName', parsed.guestName);
    if (parsed.phone) onFieldsUpdate('phone', parsed.phone);
    if (parsed.email) onFieldsUpdate('email', parsed.email);
    if (parsed.checkIn) onFieldsUpdate('checkIn', parsed.checkIn);
    if (parsed.checkOut) onFieldsUpdate('checkOut', parsed.checkOut);
    if (parsed.totalValue) onFieldsUpdate('totalValue', parsed.totalValue);
    if (parsed.paymentMethod) onFieldsUpdate('paymentMethod', parsed.paymentMethod);
    if (parsed.notes) onFieldsUpdate('notes', parsed.notes);

    // Build success message
    let summary = `✅ Preenchido: ${filled.join(', ')}`;
    if (parsed.checkIn) {
      try {
        summary += ` | Check-in: ${format(parseISO(parsed.checkIn), 'dd/MM/yyyy')}`;
      } catch {}
    }
    toast.success(summary, { duration: 4000 });
  };

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening({ onResult: handleResult });
    }
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant={isListening ? 'destructive' : 'outline'}
        size="sm"
        className={`gap-2 transition-all duration-200 ${
          isListening 
            ? 'shadow-[0_0_0_4px_hsl(var(--destructive)/0.15)] scale-105' 
            : 'hover:bg-muted'
        }`}
        onClick={handleClick}
        disabled={disabled}
      >
        {isListening ? (
          <>
            <MicOff size={16} className="animate-pulse" />
            Parar
          </>
        ) : (
          <>
            <Mic size={16} />
            Ditar reserva
          </>
        )}
      </Button>

      {isListening && (
        <div className="absolute top-full mt-2 left-0 right-0 z-50 min-w-[240px]">
          <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-xs text-muted-foreground space-y-1 animate-in fade-in-0 zoom-in-95 duration-150">
            {transcript ? (
              <p className="italic">"{transcript}"</p>
            ) : (
              <p className="text-center">🎤 Fale a reserva completa...</p>
            )}
            <p className="text-[10px] text-muted-foreground/60">
              Ex: "Reserva para João, telefone 11999..., check-in 15 de março, check-out 18, valor 500, pix"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
