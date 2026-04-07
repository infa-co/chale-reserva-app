import { Mic, MicOff } from 'lucide-react';
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
      className={`h-10 w-10 shrink-0 ${isListening ? 'border-red-400 bg-red-50' : ''}`}
      onClick={handleClick}
      disabled={disabled}
      aria-label={isListening ? 'Parar gravação' : 'Ditar por voz'}
      aria-controls={fieldId}
    >
      {isListening ? (
        <Mic size={18} className="text-red-500 animate-pulse" />
      ) : (
        <Mic size={18} className="text-muted-foreground" />
      )}
    </Button>
  );
};
