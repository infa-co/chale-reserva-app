import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

export const useSpeechToText = (language = 'pt-BR') => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const SpeechRecognition = typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

  const isSupported = !!SpeechRecognition;

  const startListening = useCallback((onResult: (text: string) => void) => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript;
      onResult(text);
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast.error('Permissão de microfone negada. Habilite nas configurações do navegador.');
      } else if (event.error !== 'aborted') {
        toast.error('Não foi possível reconhecer o áudio. Tente novamente.');
      }
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [SpeechRecognition, language]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, startListening, stopListening, isSupported };
};
