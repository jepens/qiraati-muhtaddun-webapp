import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Camera, Mic, MicOff, Volume2, X, ChevronDown, ChevronUp, HandMetal } from 'lucide-react';

interface SmartReaderOverlayProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    isReady: boolean;
    isListening: boolean;
    isSpeaking?: boolean;
    isProcessing?: boolean;
    lastCommand?: string | null;
    error?: string | null;
    debugRefs?: { ratio: React.MutableRefObject<number>; speed: React.MutableRefObject<number> };
    onClose: () => void;
    onRetry?: () => void;
}

const SmartReaderOverlay: React.FC<SmartReaderOverlayProps> = ({
    videoRef,
    isReady,
    isListening,
    isSpeaking,
    isProcessing,
    lastCommand,
    error,
    debugRefs,
    onClose,
    onRetry
}) => {
    // Force re-render for debug info update
    const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
    const [showCommands, setShowCommands] = React.useState(false);

    React.useEffect(() => {
        if (!debugRefs) return;
        const interval = setInterval(() => forceUpdate(), 200); // 5fps debug (lower for perf)
        return () => clearInterval(interval);
    }, [debugRefs]);

    return (
        <Card className="
            fixed z-50 bg-background/95 backdrop-blur-md shadow-2xl border-primary/20
            bottom-3 right-3 w-52
            sm:bottom-4 sm:right-4 sm:w-56
            p-2.5 rounded-xl
        ">
            {/* ── Camera Preview ── */}
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black/10 mb-2">
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                    style={{ transform: 'scaleX(-1)' }}
                />
                {/* Loading Overlay */}
                {!isReady && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white gap-1.5">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-[10px] font-medium">Memuat AI...</span>
                    </div>
                )}
                {/* Processing Overlay */}
                {isProcessing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white backdrop-blur-sm z-10">
                        <Loader2 className="w-7 h-7 animate-spin mb-1" />
                        <span className="text-[10px] font-medium">Memproses...</span>
                    </div>
                )}
                {/* Error Overlay */}
                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/80 text-white p-2 text-center gap-1.5">
                        <span className="text-[10px] font-medium leading-tight">{error}</span>
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="text-[10px] underline hover:no-underline font-medium"
                            >
                                Coba Ulang
                            </button>
                        )}
                    </div>
                )}
                {/* Debug Overlay */}
                {isReady && debugRefs && debugRefs.ratio && (
                    <div className="absolute top-0 left-0 bg-black/60 text-white text-[9px] p-1 font-mono rounded-br-md">
                        R: {debugRefs.ratio.current.toFixed(2)} <br />
                        S: {debugRefs.speed.current.toFixed(0)}
                    </div>
                )}
            </div>

            {/* ── Status Bar ── */}
            <div className="space-y-1.5">
                {/* Camera + Voice Status */}
                <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                        <Camera className={`w-3 h-3 ${isReady ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                        <span className={isReady ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}>
                            {isReady ? "Kamera Siap" : "Memuat..."}
                        </span>
                    </span>

                    {/* Voice Status Badge */}
                    {isListening ? (
                        <Badge
                            variant="outline"
                            className={`text-[10px] h-5 px-1.5 gap-1 transition-all ${isSpeaking
                                    ? 'border-amber-500 text-amber-500 bg-amber-500/10'
                                    : 'border-emerald-500 text-emerald-500 bg-emerald-500/10'
                                }`}
                        >
                            {isSpeaking ? (
                                <>
                                    <Volume2 className="w-3 h-3 animate-pulse" /> Bicara
                                </>
                            ) : (
                                <>
                                    <Mic className="w-3 h-3" /> Siap
                                </>
                            )}
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 gap-1 border-muted-foreground/40 text-muted-foreground">
                            <MicOff className="w-3 h-3" /> Off
                        </Badge>
                    )}
                </div>

                {/* Speaking Waveform visualization */}
                {isListening && isSpeaking && (
                    <div className="flex items-end justify-center gap-[2px] h-3">
                        {[0.6, 1, 0.7, 0.9, 0.5, 0.8, 1, 0.6].map((height, i) => (
                            <div
                                key={i}
                                className="w-[3px] bg-emerald-500 rounded-full animate-pulse"
                                style={{
                                    height: `${height * 100}%`,
                                    animationDelay: `${i * 80}ms`,
                                    animationDuration: `${400 + i * 50}ms`,
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Active listening indicator (when listening but not speaking) */}
                {isListening && !isSpeaking && !isProcessing && (
                    <div className="flex items-center justify-center gap-1">
                        <div className="flex items-end gap-[2px] h-2">
                            {[0.3, 0.3, 0.3, 0.3, 0.3].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-[2px] bg-emerald-500/40 rounded-full"
                                    style={{ height: '30%' }}
                                />
                            ))}
                        </div>
                        <span className="text-[9px] text-muted-foreground">menunggu suara...</span>
                    </div>
                )}

                {/* Instruction text */}
                <p className="text-[10px] text-muted-foreground leading-tight">
                    {error
                        ? "Terjadi kesalahan sistem."
                        : (
                            <span className="flex items-center gap-1">
                                <HandMetal className="w-3 h-3 flex-shrink-0" />
                                Tundukkan kepala untuk scroll
                            </span>
                        )
                    }
                </p>

                {/* Last Command Feedback */}
                {lastCommand && (
                    <div className="px-2 py-1 bg-emerald-500/15 border border-emerald-500/40 rounded-md text-[10px] text-emerald-400 text-center font-medium animate-in fade-in duration-300">
                        ✓ {lastCommand}
                    </div>
                )}

                {/* Quick Commands Toggle */}
                <button
                    onClick={() => setShowCommands(!showCommands)}
                    className="w-full flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors py-0.5"
                >
                    {showCommands ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Perintah Suara
                </button>

                {/* Quick Commands Panel */}
                {showCommands && (
                    <div className="space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                        {[
                            { cmd: '"Putar"', desc: 'Play audio' },
                            { cmd: '"Berhenti"', desc: 'Stop audio' },
                            { cmd: '"Ayat 5"', desc: 'Ke ayat tertentu' },
                            { cmd: '"Selanjutnya"', desc: 'Surah berikutnya' },
                            { cmd: '"Tafsir"', desc: 'Buka tafsir' },
                            { cmd: '"Bookmark"', desc: 'Simpan ayat' },
                        ].map(({ cmd, desc }) => (
                            <div key={cmd} className="flex items-center justify-between text-[9px] px-1.5 py-0.5 rounded bg-muted/50">
                                <code className="text-emerald-400 font-medium">{cmd}</code>
                                <span className="text-muted-foreground">{desc}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="w-full mt-1 flex items-center justify-center gap-1.5 text-[10px] text-red-500 hover:text-red-400 hover:bg-red-500/10 font-medium py-1.5 rounded-md transition-colors"
                >
                    <X className="w-3 h-3" />
                    Matikan Smart Mode
                </button>
            </div>
        </Card>
    );
};

export default SmartReaderOverlay;
