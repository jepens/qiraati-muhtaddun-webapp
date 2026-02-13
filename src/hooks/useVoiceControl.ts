import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// Update interface to accept arguments
interface UseVoiceControlProps {
    onCommand?: (command: 'play' | 'pause' | 'stop' | 'scroll' | 'stop_scroll' | 'play_ayat' | 'open_surah' | 'open_surah_ayat', args?: any) => void;
    enabled?: boolean;
    continuous?: boolean;
}

export const useVoiceControl = ({ onCommand, enabled = true, continuous = true }: UseVoiceControlProps) => {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
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

    const processCommand = useCallback((rawTranscript: string) => {
        if (!onCommand || !rawTranscript.trim()) return;

        const transcript = normalizeTranscript(rawTranscript);
        console.log("Processing Command (Debounced):", transcript);

        // 1. Play specific ayat: "baca ayat 5", "putar ayat 10", "ayat 5"
        const ayatMatch = transcript.match(/(?:baca|putar|mulai)?\s*ayat\s+(\d+)/);

        // 2. Open specific surah with ayat: "buka surah al-fatihah ayat 1", "surah yasin ayat 5", "buka yasin ayat 5"
        const surahAyatMatch = transcript.match(/(?:buka|putar|baca)?\s*(?:surah)?\s+(.+?)\s+ayat\s+(\d+)/);

        // 3. Open specific surah: "buka surah al-mulk", "surah waqiah", "buka yasin"
        const surahMatch = transcript.match(/(?:buka|putar|baca)?\s*(?:surah)\s+(.+)/);
        // Fallback: if starts with "buka" or "baca" and has text following
        const openMatch = transcript.match(/^(?:buka|baca|cari)\s+(?!ayat)(.+)/);

        let commandFound = false;

        if (surahAyatMatch) {
            commandFound = true;
            const surahName = surahAyatMatch[1].trim();
            const ayatNum = parseInt(surahAyatMatch[2]);
            if (surahName && surahName !== 'surah') {
                setIsProcessing(true);
                onCommand('open_surah_ayat', { surah: surahName, ayat: ayatNum });
                toast({ title: "Perintah Suara", description: `Membuka Surah ${surahName} ayat ${ayatNum}...` });
            }
        } else if (surahMatch) {
            const surahName = surahMatch[1].trim();
            if (!surahName.includes('ayat')) {
                commandFound = true;
                setIsProcessing(true);
                onCommand('open_surah', { surah: surahName });
                toast({ title: "Perintah Suara", description: `Membuka Surah ${surahName}...` });
            }
        } else if (openMatch) {
            const surahName = openMatch[1].replace('surah', '').trim();
            if (surahName && !surahName.includes('ayat')) {
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

        // IMPORTANT: Clear transcript to prevent loop
        if (commandFound) {
            setTranscript(''); // Clear immediately to stop re-processing
            console.log("Command executed, clearing transcript.");
            setTimeout(() => {
                if (isMounted.current) setIsProcessing(false);
            }, 2000);
        }
    }, [onCommand, toast]);

    // DEBOUNCE LOGIC
    // Watch for changes in `transcript`. If it changes, wait 1s.
    // If no new changes, execute `processCommand`.
    useEffect(() => {
        if (!transcript) return;

        const timer = setTimeout(() => {
            processCommand(transcript);
        }, 1000);

        return () => clearTimeout(timer);
    }, [transcript, processCommand]);

    const startListening = useCallback(() => {
        try {
            if (recognitionRef.current) {
                recognitionRef.current.start();
                setIsListening(true);
                setError(null);
            }
        } catch {
            // ignore
        }
    }, []);

    const stopListening = useCallback(() => {
        try {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                setIsListening(false);
            }
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        if (!enabled) {
            stopListening();
            return;
        }

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = continuous;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'id-ID';

            recognitionRef.current.onresult = (event: any) => {
                if (!isMounted.current) return;

                const lastResult = event.results[event.results.length - 1];

                const fullTranscript = Array.from(event.results)
                    .map((result: any) => result[0].transcript)
                    .join(' ');

                if (!lastResult.isFinal) {
                    setInterimTranscript(fullTranscript);
                    return;
                }

                if (lastResult.isFinal) {
                    setInterimTranscript('');
                    setTranscript(fullTranscript);
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
                if (enabled && isMounted.current && continuous) {
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
                recognitionRef.current.onend = null;
                recognitionRef.current.stop();
            }
        };
    }, [enabled, continuous, startListening, stopListening]);

    return { isListening, isProcessing, transcript, interimTranscript, error };
};
