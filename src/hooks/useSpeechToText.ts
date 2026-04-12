import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface StartListeningOptions {
  onResult: (text: string) => void;
  onInterim?: (text: string) => void;
}

export const useSpeechToText = (language = 'pt-BR') => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const SpeechRecognition = typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

  const isSupported = !!SpeechRecognition;

  const startListening = useCallback((optionsOrCallback: StartListeningOptions | ((text: string) => void)) => {
    if (!SpeechRecognition) return;

    const options: StartListeningOptions = typeof optionsOrCallback === 'function'
      ? { onResult: optionsOrCallback }
      : optionsOrCallback;

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (interim) {
        setTranscript(interim);
        options.onInterim?.(interim);
      }

      if (final) {
        setTranscript('');
        options.onResult(final.trim());
        // Stop after getting a final result for single-input use
        recognition.stop();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      setTranscript('');
      if (event.error === 'not-allowed') {
        toast.error('Permissão de microfone negada. Habilite nas configurações do navegador.');
      } else if (event.error !== 'aborted') {
        toast.error('Não foi possível reconhecer o áudio. Tente novamente.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setTranscript('');
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setTranscript('');
  }, [SpeechRecognition, language]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setTranscript('');
  }, []);

  return { isListening, transcript, startListening, stopListening, isSupported };
};
