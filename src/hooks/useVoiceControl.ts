import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

// Update interface to accept arguments
interface UseVoiceControlProps {
    onCommand: (command: 'play' | 'pause' | 'stop' | 'scroll' | 'stop_scroll' | 'play_ayat' | 'open_surah' | 'open_surah_ayat', args?: any) => void;
    enabled: boolean;
}

export const useVoiceControl = ({ onCommand, enabled }: UseVoiceControlProps) => {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);
    const isMounted = useRef(true);
    const { toast } = useToast();

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Helper to normalize input
    const normalizeTranscript = (text: string): string => {
        return text.toLowerCase()
            .replace(/\bsurat\b/g, 'surah') // Normalize 'surat' to 'surah'
            .trim();
    };

    useEffect(() => {
        if (!enabled) {
            stopListening();
            return;
        }

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'id-ID';

            recognitionRef.current.onresult = (event: any) => {
                if (!isMounted.current) return;

                const lastResult = event.results[event.results.length - 1];
                if (lastResult.isFinal) {
                    const rawTranscript = lastResult[0].transcript;
                    const transcript = normalizeTranscript(rawTranscript);
                    console.log("Voice Command:", transcript);

                    // 1. Play specific ayat: "baca ayat 5", "putar ayat 10", "ayat 5"
                    const ayatMatch = transcript.match(/(?:baca|putar|mulai)?\s*ayat\s+(\d+)/);

                    // 2. Open specific surah with ayat: "buka surah al-fatihah ayat 1", "surah yasin ayat 5"
                    const surahAyatMatch = transcript.match(/(?:buka|putar|baca)?\s*surah\s+(.+?)\s+ayat\s+(\d+)/);

                    // 3. Open specific surah: "buka surah al-mulk", "surah waqiah"
                    const surahMatch = transcript.match(/(?:buka|putar|baca)?\s*surah\s+(.+)/);

                    let commandFound = false;

                    if (surahAyatMatch) {
                        commandFound = true;
                        const surahName = surahAyatMatch[1].trim();
                        const ayatNum = parseInt(surahAyatMatch[2]);
                        setIsProcessing(true);
                        onCommand('open_surah_ayat', { surah: surahName, ayat: ayatNum });
                        toast({ title: "Perintah Suara", description: `Membuka Surah ${surahName} ayat ${ayatNum}...` });
                    } else if (surahMatch) {
                        const surahName = surahMatch[1].trim();
                        // Filter out if "ayat" is mistakenly captured in surah name (though regex above handles priority)
                        if (!surahName.includes('ayat')) {
                            commandFound = true;
                            setIsProcessing(true);
                            onCommand('open_surah', { surah: surahName });
                            toast({ title: "Perintah Suara", description: `Membuka Surah ${surahName}...` });
                        }
                    } else if (ayatMatch) {
                        commandFound = true;
                        const ayatNum = parseInt(ayatMatch[1]);
                        setIsProcessing(true);
                        onCommand('play_ayat', { ayat: ayatNum });
                        toast({ title: "Perintah Suara", description: `Memutar ayat ${ayatNum}...` });
                    } else if (transcript.includes('putar') || transcript.includes('baca') || transcript.includes('mulai')) {
                        commandFound = true;
                        setIsProcessing(true);
                        onCommand('play');
                        toast({ title: "Perintah Suara", description: "Memutar audio..." });
                    } else if (transcript.includes('berhenti') || transcript.includes('stop') || transcript.includes('jeda')) {
                        commandFound = true;
                        setIsProcessing(true);
                        onCommand('pause');
                        toast({ title: "Perintah Suara", description: "Audio dihentikan." });
                    } else if (transcript.includes('turun') || transcript.includes('scroll')) {
                        commandFound = true;
                        onCommand('scroll');
                    }

                    if (commandFound) {
                        setTimeout(() => {
                            if (isMounted.current) setIsProcessing(false);
                        }, 2000);
                    }
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                if (!isMounted.current) return;
                if (event.error === 'no-speech' || event.error === 'aborted') return;

                console.error("Speech Error:", event.error);
                if (event.error === 'not-allowed') {
                    setError("Izin mikrofon ditolak.");
                }
            };

            recognitionRef.current.onend = () => {
                if (enabled && isMounted.current) {
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
            if (recognitionRef.current) {
                recognitionRef.current.onend = null; // Prevent restart on cleanup
                recognitionRef.current.stop();
            }
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

    return { isListening, isProcessing, error };
};
