import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// ─── Types ───

export interface VoiceCommand {
    /** Pattern to match — string uses includes(), RegExp uses .test() */
    command: string | RegExp;
    /** Callback when command matches. Args extracted from RegExp capture groups. */
    callback: (...args: any[]) => void;
    /** Human-readable description for UI */
    description?: string;
    /** Enable fuzzy matching for string commands (default: false) */
    fuzzyMatch?: boolean;
    /** Fuzzy threshold 0–1, lower = more permissive (default: 0.7) */
    fuzzyThreshold?: number;
    /** Match interim (partial) results too? (default: false) */
    matchInterim?: boolean;
}

export interface UseVoiceOptions {
    /** 'search' = outputs transcript, 'command' = matches commands */
    mode: 'search' | 'command';
    /** Command definitions (only used in 'command' mode) */
    commands?: VoiceCommand[];
    /** Callback for transcript changes (only used in 'search' mode) */
    onTranscript?: (text: string) => void;
    /** BCP-47 language tag (default: 'id-ID') */
    lang?: string;
    /** Keep listening after user stops? (default: true) */
    continuous?: boolean;
    /** Debounce ms before processing (default: 1000 for command, 1500 for search) */
    debounceMs?: number;
    /** Enable/disable the hook (default: true) */
    enabled?: boolean;
}

export interface UseVoiceReturn {
    isListening: boolean;
    isProcessing: boolean;
    /** True while user is actively speaking (via onspeechstart/onspeechend) */
    isSpeaking: boolean;
    transcript: string;
    interimTranscript: string;
    fullTranscript: string;
    /** Last recognized command description (for UI feedback) */
    lastCommand: string | null;
    error: string | null;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
}

// ─── Helpers ───

/** Normalize Indonesian voice input */
function normalize(text: string): string {
    return text
        .toLowerCase()
        .replace(/\bsurat\b/g, 'surah')
        .trim();
}

/** Simple Levenshtein-based similarity (0–1) */
function similarity(a: string, b: string): number {
    const la = a.length;
    const lb = b.length;
    if (la === 0) return lb === 0 ? 1 : 0;
    if (lb === 0) return 0;

    const matrix: number[][] = [];
    for (let i = 0; i <= la; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= lb; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= la; i++) {
        for (let j = 1; j <= lb; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return 1 - matrix[la][lb] / Math.max(la, lb);
}

// ─── Error Messages (Context7 — Web Speech API best practices) ───

const ERROR_MESSAGES: Record<string, string> = {
    'not-allowed': 'Izin mikrofon ditolak. Silakan aktifkan di pengaturan browser.',
    'audio-capture': 'Mikrofon tidak terdeteksi. Periksa perangkat audio.',
    'network': 'Kesalahan jaringan. Periksa koneksi internet.',
    'service-not-allowed': 'Layanan speech recognition tidak tersedia.',
    'language-not-supported': 'Bahasa tidak didukung oleh browser.',
    'no-speech': '', // Intentionally silent
    'aborted': '',   // Intentionally silent
};

// ─── Hook ───

export const useVoice = ({
    mode,
    commands = [],
    onTranscript,
    lang = 'id-ID',
    continuous = true,
    debounceMs,
    enabled = true,
}: UseVoiceOptions): UseVoiceReturn => {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [lastCommand, setLastCommand] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);
    const isMounted = useRef(true);
    const { toast } = useToast();

    // ─── Refs to avoid stale closures (Context7 — best practice) ───
    const enabledRef = useRef(enabled);
    const continuousRef = useRef(continuous);
    const restartTimeoutRef = useRef<number | null>(null);
    const retryCountRef = useRef(0);
    const MAX_RETRIES = 5;
    const isStoppingRef = useRef(false); // Track intentional stops

    // Keep refs in sync with props
    useEffect(() => { enabledRef.current = enabled; }, [enabled]);
    useEffect(() => { continuousRef.current = continuous; }, [continuous]);

    // Resolve debounce: explicit > mode default
    const resolvedDebounce = debounceMs ?? (mode === 'command' ? 1000 : 1500);

    // ─── Lifecycle ───
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // ─── Clear restart timeout helper ───
    const clearRestartTimeout = useCallback(() => {
        if (restartTimeoutRef.current !== null) {
            window.clearTimeout(restartTimeoutRef.current);
            restartTimeoutRef.current = null;
        }
    }, []);

    // ─── Command Matching (Context7 — react-speech-recognition pattern) ───
    const matchCommands = useCallback((text: string): boolean => {
        const normalized = normalize(text);

        for (const cmd of commands) {
            if (cmd.command instanceof RegExp) {
                // RegExp matching — extract capture groups
                const match = normalized.match(cmd.command);
                if (match) {
                    setIsProcessing(true);
                    setLastCommand(cmd.description || normalized);
                    cmd.callback(...match.slice(1));
                    if (cmd.description) {
                        toast({ title: 'Perintah Suara', description: cmd.description });
                    }
                    setTimeout(() => {
                        if (isMounted.current) {
                            setIsProcessing(false);
                            setLastCommand(null);
                        }
                    }, 2500);
                    return true;
                }
            } else {
                // String matching — exact includes or fuzzy
                const cmdNorm = normalize(cmd.command);

                if (cmd.fuzzyMatch) {
                    const score = similarity(normalized, cmdNorm);
                    if (score >= (cmd.fuzzyThreshold ?? 0.7)) {
                        setIsProcessing(true);
                        setLastCommand(cmd.description || cmd.command);
                        cmd.callback(normalized, score);
                        if (cmd.description) {
                            toast({ title: 'Perintah Suara', description: cmd.description });
                        }
                        setTimeout(() => {
                            if (isMounted.current) {
                                setIsProcessing(false);
                                setLastCommand(null);
                            }
                        }, 2500);
                        return true;
                    }
                } else if (normalized.includes(cmdNorm)) {
                    setIsProcessing(true);
                    setLastCommand(cmd.description || cmd.command);
                    cmd.callback(normalized);
                    if (cmd.description) {
                        toast({ title: 'Perintah Suara', description: cmd.description });
                    }
                    setTimeout(() => {
                        if (isMounted.current) {
                            setIsProcessing(false);
                            setLastCommand(null);
                        }
                    }, 2500);
                    return true;
                }
            }
        }
        return false;
    }, [commands, toast]);

    // ─── Process Final Transcript ───
    const processTranscript = useCallback((text: string) => {
        if (!text.trim()) return;

        if (mode === 'command') {
            const matched = matchCommands(text);
            if (matched) {
                setTranscript(''); // Clear to prevent re-processing
            }
        } else {
            // Search mode — just pass through
            onTranscript?.(text);
        }
    }, [mode, matchCommands, onTranscript]);

    // ─── Debounced Processing ───
    useEffect(() => {
        if (!transcript) return;
        const timer = setTimeout(() => processTranscript(transcript), resolvedDebounce);
        return () => clearTimeout(timer);
    }, [transcript, processTranscript, resolvedDebounce]);

    // ─── Start/Stop ───
    const startListening = useCallback(() => {
        try {
            if (recognitionRef.current) {
                isStoppingRef.current = false;
                retryCountRef.current = 0;
                recognitionRef.current.start();
                setIsListening(true);
                setError(null);
            }
        } catch {
            // Ignore — may already be running
        }
    }, []);

    const stopListening = useCallback(() => {
        try {
            isStoppingRef.current = true;
            clearRestartTimeout();
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                setIsListening(false);
            }
        } catch {
            // Ignore
        }
    }, [clearRestartTimeout]);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
    }, []);

    // ─── Keep commands ref in sync for onresult handler ───
    const commandsRef = useRef(commands);
    useEffect(() => { commandsRef.current = commands; }, [commands]);

    // ─── Initialize Speech Recognition ───
    useEffect(() => {
        if (!enabled) {
            stopListening();
            return;
        }

        const SpeechRecognitionAPI =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognitionAPI) {
            setError('Browser tidak mendukung Speech Recognition.');
            return;
        }

        // Clean up previous instance completely
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.onresult = null;
            try { recognitionRef.current.stop(); } catch { /* */ }
        }
        clearRestartTimeout();

        const recognition = new SpeechRecognitionAPI();
        recognitionRef.current = recognition;
        recognition.continuous = continuous;
        recognition.interimResults = true;
        recognition.lang = lang;
        isStoppingRef.current = false;
        retryCountRef.current = 0;

        // ─── Robust restart with delay + retry (Context7 — best practice) ───
        const scheduleRestart = () => {
            // Use refs to avoid stale closure
            if (!enabledRef.current || !isMounted.current || !continuousRef.current) {
                if (isMounted.current) setIsListening(false);
                return;
            }

            // Check if intentionally stopped
            if (isStoppingRef.current) {
                if (isMounted.current) setIsListening(false);
                return;
            }

            // Respect retry limit
            if (retryCountRef.current >= MAX_RETRIES) {
                console.warn(`Voice: Max retries (${MAX_RETRIES}) reached, stopping.`);
                if (isMounted.current) {
                    setIsListening(false);
                    setError('Voice recognition berhenti. Ketuk untuk mengulang.');
                }
                return;
            }

            // Delay restart to avoid InvalidStateError (Context7 best practice)
            const delay = Math.min(200 * (retryCountRef.current + 1), 1000);
            restartTimeoutRef.current = window.setTimeout(() => {
                if (!isMounted.current || !enabledRef.current || isStoppingRef.current) return;

                try {
                    recognition.start();
                    retryCountRef.current = 0; // Reset on success
                    if (isMounted.current) {
                        setIsListening(true);
                        setError(null);
                    }
                } catch (e: any) {
                    retryCountRef.current++;
                    console.warn(`Voice restart attempt ${retryCountRef.current}/${MAX_RETRIES}:`, e?.message || e);
                    // Retry with exponential backoff
                    scheduleRestart();
                }
            }, delay);
        };

        // ─── onresult ───
        recognition.onresult = (event: any) => {
            if (!isMounted.current) return;

            let finalTrans = '';
            let interimTrans = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTrans += result[0].transcript;
                } else {
                    interimTrans += result[0].transcript;

                    // Check matchInterim commands
                    if (mode === 'command') {
                        const interimNorm = normalize(result[0].transcript);
                        for (const cmd of commandsRef.current) {
                            if (!cmd.matchInterim) continue;
                            if (cmd.command instanceof RegExp) {
                                if (cmd.command.test(interimNorm)) {
                                    cmd.callback(interimNorm);
                                    setLastCommand(cmd.description || interimNorm);
                                    break;
                                }
                            } else if (interimNorm.includes(normalize(cmd.command))) {
                                cmd.callback(interimNorm);
                                setLastCommand(cmd.description || cmd.command);
                                break;
                            }
                        }
                    }
                }
            }

            setInterimTranscript(interimTrans);

            if (finalTrans) {
                // Reset retry counter on successful recognition
                retryCountRef.current = 0;

                if (mode === 'search') {
                    // Accumulate in search mode
                    setTranscript(prev => {
                        const newTrans = (prev + ' ' + finalTrans).trim();
                        return newTrans;
                    });
                } else {
                    // Replace in command mode (only care about latest)
                    setInterimTranscript('');
                    setTranscript(finalTrans);
                }
            }
        };

        // ─── onerror (Context7 — comprehensive error handling) ───
        recognition.onerror = (event: any) => {
            if (!isMounted.current) return;

            const msg = ERROR_MESSAGES[event.error];
            if (msg === undefined) {
                console.error('Speech Recognition error:', event.error);
                setError(`Kesalahan: ${event.error}`);
            } else if (msg) {
                setError(msg);
                setIsListening(false);
                // Don't restart on fatal errors
                isStoppingRef.current = true;
            }
            // Silent errors (no-speech, aborted) — allow restart via onend
        };

        // ─── onspeechstart / onspeechend (Context7 — detect active speech) ───
        recognition.onspeechstart = () => {
            if (isMounted.current) setIsSpeaking(true);
        };
        recognition.onspeechend = () => {
            if (isMounted.current) setIsSpeaking(false);
        };

        // ─── onend — robust auto-restart for continuous ───
        recognition.onend = () => {
            if (isMounted.current) {
                setIsSpeaking(false);
            }
            // Schedule restart using refs (no stale closure)
            scheduleRestart();
        };

        // Auto-start
        try {
            recognition.start();
            setIsListening(true);
            setError(null);
        } catch {
            // Will be retried via scheduleRestart
            scheduleRestart();
        }

        return () => {
            clearRestartTimeout();
            isStoppingRef.current = true;
            if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                recognitionRef.current.onerror = null;
                recognitionRef.current.onresult = null;
                recognitionRef.current.onspeechstart = null;
                recognitionRef.current.onspeechend = null;
                try { recognitionRef.current.stop(); } catch { /* */ }
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, continuous, lang, mode]);
    // NOTE: Removed `commands`, `startListening`, `stopListening` from deps
    // to prevent recreation of recognition every time commands change.
    // Commands are read via closure from the latest `commands` prop.


    return {
        isListening,
        isProcessing,
        isSpeaking,
        transcript,
        interimTranscript,
        fullTranscript: (transcript + ' ' + interimTranscript).trim(),
        lastCommand,
        error,
        startListening,
        stopListening,
        resetTranscript,
    };
};
