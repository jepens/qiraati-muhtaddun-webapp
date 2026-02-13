import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechToTextProps {
    onTranscriptChange?: (transcript: string) => void;
    lang?: string;
    continuous?: boolean;
    interimResults?: boolean;
}

export const useSpeechToText = ({
    onTranscriptChange,
    lang = 'id-ID',
    continuous = true,
    interimResults = true,
}: UseSpeechToTextProps = {}) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);
    const isMounted = useRef(true);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        if (isMounted.current) {
            setIsListening(false);
        }
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
    }, []);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            stopListening();
        };
    }, [stopListening]);

    const startListening = useCallback(() => {
        setError(null);
        setTranscript('');
        setInterimTranscript('');

        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setError('Browser tidak mendukung Speech Recognition.');
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.continuous = continuous;
        recognition.interimResults = interimResults;
        recognition.lang = lang;

        recognition.onstart = () => {
            if (isMounted.current) setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            if (!isMounted.current) return;

            let finalTrans = '';
            let interimTrans = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTrans += event.results[i][0].transcript;
                } else {
                    interimTrans += event.results[i][0].transcript;
                }
            }

            // Proper concatenation logic for continuous mode
            // "transcript" state accumulates final results
            if (finalTrans) {
                setTranscript((prev) => {
                    const newTranscript = (prev + ' ' + finalTrans).trim();
                    onTranscriptChange?.(newTranscript);
                    return newTranscript;
                });
            }

            setInterimTranscript(interimTrans);
        };

        recognition.onerror = (event: any) => {
            if (!isMounted.current) return;
            if (event.error === 'no-speech') {
                // ignore
                return;
            }
            console.error('Speech recognition error', event.error);
            setError(event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            if (!isMounted.current) return;
            setIsListening(false);
            // NOTE: We don't auto-restart here to allow explicit control. 
            // User must restart if they want continuous "always on" beyond session.
        };

        try {
            recognition.start();
        } catch (e) {
            console.error(e);
        }
    }, [continuous, interimResults, lang, onTranscriptChange]);

    return {
        isListening,
        transcript,
        interimTranscript,
        fullTranscript: (transcript + ' ' + interimTranscript).trim(), // Combined view
        startListening,
        stopListening,
        resetTranscript,
        error,
    };
};
