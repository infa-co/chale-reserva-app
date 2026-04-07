import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSpeechToText } from '@/hooks/useSpeechToText';

interface VoiceInputButtonProps {
  onResult: (text: string) => void;
  disabled?: boolean;
  fieldId?: string;
}

export const VoiceInputButton = ({ onResult, disabled, fieldId }: VoiceInputButtonProps) => {
  const { isListening, startListening, stopListening, isSupported } = useSpeechToText();

  if (!isSupported) return null;

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(onResult);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={`h-10 w-10 min-w-[40px] shrink-0 rounded-full transition-all duration-200 ${
        isListening
          ? 'border-destructive bg-destructive/10 shadow-[0_0_0_4px_hsl(var(--destructive)/0.15)] scale-110'
          : 'hover:bg-muted'
      }`}
      onClick={handleClick}
      disabled={disabled}
      aria-label={isListening ? 'Parar gravação' : 'Ditar por voz'}
      aria-controls={fieldId}
    >
      <Mic
        size={18}
        className={`transition-colors duration-200 ${
          isListening ? 'text-destructive animate-pulse' : 'text-muted-foreground'
        }`}
      />
      {isListening && (
        <span className="absolute inset-0 rounded-full animate-ping border-2 border-destructive/30 pointer-events-none" />
      )}
    </Button>
  );
};
