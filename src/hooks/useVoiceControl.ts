import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseVoiceControlProps {
    onCommand: (command: 'play' | 'pause' | 'stop' | 'scroll' | 'stop_scroll') => void;
    enabled: boolean;
}

export const useVoiceControl = ({ onCommand, enabled }: UseVoiceControlProps) => {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (!enabled) {
            stopListening();
            return;
        }

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true; // Listen continuously for commands
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'id-ID';

            recognitionRef.current.onresult = (event: any) => {
                const lastResult = event.results[event.results.length - 1];
                if (lastResult.isFinal) {
                    const transcript = lastResult[0].transcript.toLowerCase().trim();
                    console.log("Voice Command:", transcript);

                    if (transcript.includes('putar') || transcript.includes('baca') || transcript.includes('mulai')) {
                        onCommand('play');
                        toast({ title: "Perintah Suara", description: "Memutar audio..." });
                    } else if (transcript.includes('berhenti') || transcript.includes('stop') || transcript.includes('jeda')) {
                        onCommand('pause'); // or stop
                        toast({ title: "Perintah Suara", description: "Audio dihentikan." });
                    } else if (transcript.includes('turun') || transcript.includes('scroll')) {
                        onCommand('scroll');
                    }
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                if (event.error === 'no-speech') {
                    // Ignore no-speech errors (normal when silence)
                    return;
                }

                console.error("Speech Error:", event.error);
                if (event.error === 'not-allowed') {
                    setError("Izin mikrofon ditolak.");
                }
            };

            recognitionRef.current.onend = () => {
                // Restart if still enabled (hack for continuous)
                if (enabled) {
                    try {
                        recognitionRef.current.start();
                    } catch {
                        // ignore
                    }
                }
            };

            startListening();
        } else {
            setError("Browser tidak mendukung perintah suara.");
        }

        return () => {
            stopListening();
        };
    }, [enabled, onCommand, toast]);

    const startListening = () => {
        try {
            recognitionRef.current?.start();
            setIsListening(true);
        } catch {
            // ignore
        }
    };

    const stopListening = () => {
        try {
            recognitionRef.current?.stop();
            setIsListening(false);
        } catch {
            // ignore
        }
    };

    return { isListening, error };
};
