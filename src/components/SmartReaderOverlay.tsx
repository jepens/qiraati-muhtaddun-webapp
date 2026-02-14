import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2, Camera, Mic, MicOff, Volume2, X, ChevronDown, ChevronUp, HandMetal, AlertTriangle, EyeOff } from 'lucide-react';

interface SmartReaderOverlayProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    isReady: boolean;
    isListening: boolean;
    isSpeaking?: boolean;
    isProcessing?: boolean;
    isFaceLost?: boolean;
    isTooClose?: boolean;
    headPosition?: number;
    lastCommand?: string | null;
    error?: string | null;
    debugRefs?: { ratio: React.MutableRefObject<number>; speed: React.MutableRefObject<number> };
    onClose: () => void;
    onRetry?: () => void;
    isMicMuted?: boolean;
    onToggleMic?: () => void;
    surahName?: string;
}

// ─── Vertical Scroll Indicator Bar ───
const ScrollIndicatorBar: React.FC<{
    headPosition: number;
    isFaceLost: boolean;
    isTooClose: boolean;
    isReady: boolean;
}> = ({ headPosition, isFaceLost, isReady, isTooClose }) => {
    if (!isReady) return null;

    const getIndicatorColor = () => {
        if (isFaceLost) return 'bg-red-500';
        if (isTooClose) return 'bg-amber-500';
        if (Math.abs(headPosition) < 0.3) return 'bg-emerald-500';
        if (headPosition > 0) return 'bg-sky-500';
        return 'bg-violet-500';
    };

    const getGlowColor = () => {
        if (isFaceLost) return 'shadow-red-500/50';
        if (isTooClose) return 'shadow-amber-500/50';
        if (Math.abs(headPosition) < 0.3) return 'shadow-emerald-500/40';
        if (headPosition > 0) return 'shadow-sky-500/40';
        return 'shadow-violet-500/40';
    };

    const indicatorPercent = Math.max(0, Math.min(100, ((headPosition + 1) / 2) * 100));

    return (
        <div className="fixed right-1.5 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-1 sm:right-2.5">
            <ChevronUp className={`w-3.5 h-3.5 transition-colors duration-200 ${headPosition < -0.3 ? 'text-violet-400 animate-pulse' : 'text-muted-foreground/40'
                }`} />
            <div className="relative w-1.5 h-[45vh] rounded-full bg-muted/30 backdrop-blur-sm border border-border/20 overflow-visible">
                <div className="absolute left-0 right-0 bg-emerald-500/10 border-y border-emerald-500/20" style={{ top: '35%', height: '30%' }} />
                <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-emerald-500/40" />
                <div
                    className={`absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full transition-all duration-150 ease-out shadow-lg ${getIndicatorColor()} ${getGlowColor()}`}
                    style={{ top: `calc(${indicatorPercent}% - 7px)` }}
                >
                    <div className="absolute inset-[2px] rounded-full bg-white/30" />
                </div>
                {Math.abs(headPosition) > 0.3 && (
                    <div
                        className={`absolute left-0 right-0 transition-all duration-150 ${headPosition > 0 ? 'bg-sky-500/20' : 'bg-violet-500/20'}`}
                        style={{
                            top: headPosition > 0 ? '50%' : `${indicatorPercent}%`,
                            height: headPosition > 0 ? `${indicatorPercent - 50}%` : `${50 - indicatorPercent}%`,
                        }}
                    />
                )}
            </div>
            <ChevronDown className={`w-3.5 h-3.5 transition-colors duration-200 ${headPosition > 0.3 ? 'text-sky-400 animate-pulse' : 'text-muted-foreground/40'}`} />
        </div>
    );
};

// ─── Status Dot ───
const StatusDot: React.FC<{ isReady: boolean; isFaceLost: boolean }> = ({ isReady, isFaceLost }) => (
    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isReady ? (isFaceLost ? 'bg-red-500 animate-pulse' : 'bg-emerald-500') : 'bg-muted-foreground animate-pulse'}`} />
);

// ─── Canvas Mirror ───
// Mirrors the always-mounted video onto a canvas.
// The video element must NOT use sr-only (which clips it) but instead
// is positioned offscreen so browser still provides video frames.
const CanvasMirror: React.FC<{
    videoRef: React.RefObject<HTMLVideoElement>;
    className?: string;
}> = ({ videoRef, className }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        let animId = 0;
        let lastDraw = 0;
        const FPS = 1000 / 15; // ~15fps

        const draw = (time: number) => {
            animId = requestAnimationFrame(draw);
            if (time - lastDraw < FPS) return;
            lastDraw = time;

            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Size canvas to match actual displayed size (devicePixelRatio-aware)
            const rect = canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = Math.round(rect.width * dpr);
            const h = Math.round(rect.height * dpr);

            if (w === 0 || h === 0) return; // Container not visible yet

            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }

            // Mirror horizontally (selfie mode)
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(video, -w, 0, w, h);
            ctx.restore();
        };

        animId = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animId);
    }, [videoRef]);

    return <canvas ref={canvasRef} className={className} />;
};

const SmartReaderOverlay: React.FC<SmartReaderOverlayProps> = ({
    videoRef,
    isReady,
    isListening,
    isSpeaking,
    isProcessing,
    isFaceLost = false,
    isTooClose = false,
    headPosition = 0,
    lastCommand,
    error,
    debugRefs,
    onClose,
    onRetry,
    isMicMuted = false,
    onToggleMic,
}) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
    const [showCommands, setShowCommands] = React.useState(false);

    React.useEffect(() => {
        if (!debugRefs) return;
        const interval = setInterval(() => forceUpdate(), 200);
        return () => clearInterval(interval);
    }, [debugRefs]);

    return (
        <>
            {/* ── Vertical Scroll Indicator Bar ── */}
            <ScrollIndicatorBar
                headPosition={headPosition}
                isFaceLost={isFaceLost}
                isTooClose={isTooClose}
                isReady={isReady}
            />

            {/* ── Always-Mounted Video (offscreen, NOT sr-only) ──
                 Positioned offscreen so the browser still renders frames.
                 sr-only uses clip:rect(0,0,0,0) which can prevent frame decoding on mobile.
                 Instead we use fixed positioning off the left edge. */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="fixed -left-[9999px] w-[1px] h-[1px]"
                style={{ transform: 'scaleX(-1)' }}
            />

            {/* ── Floating Widget (bottom-right) ── */}
            <div
                className="fixed z-50 right-4"
                style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
            >
                {isExpanded ? (
                    /* ── Expanded Card ── */
                    <div className="w-36 sm:w-40 bg-background/95 backdrop-blur-md shadow-2xl border border-primary/20 rounded-xl p-2 animate-in fade-in zoom-in-95 duration-200">
                        {/* Camera Preview via Canvas */}
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-black mb-1.5">
                            <CanvasMirror videoRef={videoRef} className="w-full h-full" />
                            {/* Loading Overlay */}
                            {!isReady && !error && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white gap-1 z-10">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span className="text-[9px] font-medium">Memuat AI...</span>
                                </div>
                            )}
                            {/* Processing Overlay */}
                            {isProcessing && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white backdrop-blur-sm z-10">
                                    <Loader2 className="w-5 h-5 animate-spin mb-1" />
                                    <span className="text-[9px] font-medium">Memproses...</span>
                                </div>
                            )}
                            {/* Error Overlay */}
                            {error && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/80 text-white p-1.5 text-center gap-1 z-10">
                                    <span className="text-[9px] font-medium leading-tight">{error}</span>
                                    {onRetry && (
                                        <button onClick={onRetry} className="text-[9px] underline hover:no-underline font-medium">Coba Ulang</button>
                                    )}
                                </div>
                            )}
                            {/* Face Lost Overlay */}
                            {isReady && isFaceLost && !error && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/70 text-white gap-0.5 z-10">
                                    <EyeOff className="w-4 h-4" />
                                    <span className="text-[9px] font-medium">Wajah Hilang</span>
                                </div>
                            )}
                            {/* Debug Overlay */}
                            {isReady && debugRefs && debugRefs.ratio && (
                                <div className="absolute top-0 left-0 bg-black/60 text-white text-[8px] p-0.5 font-mono rounded-br-md z-10">
                                    Y: {debugRefs.ratio.current.toFixed(3)} <br />
                                    S: {debugRefs.speed.current.toFixed(0)}
                                </div>
                            )}
                        </div>

                        {/* ── Compact Status ── */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="flex items-center gap-1">
                                    {isMicMuted ? (
                                        <MicOff className="w-2.5 h-2.5 text-red-500" />
                                    ) : (
                                        <Camera className={`w-2.5 h-2.5 ${isReady ? (isFaceLost ? 'text-red-500' : 'text-emerald-500') : 'text-muted-foreground'}`} />
                                    )}
                                    <span className={
                                        isMicMuted ? 'text-red-500 font-medium' :
                                            isReady ? (isFaceLost ? 'text-red-500' : 'text-emerald-500') : 'text-muted-foreground'
                                    }>
                                        {isMicMuted ? 'Mic Mati' : isReady ? (isFaceLost ? 'Hilang' : '✓') : '...'}
                                    </span>
                                </span>
                                {!isMicMuted && isListening ? (
                                    <Badge variant="outline" className={`text-[9px] h-4 px-1 gap-0.5 transition-all ${isSpeaking ? 'border-amber-500 text-amber-500 bg-amber-500/10' : 'border-emerald-500 text-emerald-500 bg-emerald-500/10'}`}>
                                        {isSpeaking ? (<><Volume2 className="w-2.5 h-2.5 animate-pulse" /> Bicara</>) : (<><Mic className="w-2.5 h-2.5" /> Siap</>)}
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-[9px] h-4 px-1 gap-0.5 border-muted-foreground/40 text-muted-foreground">
                                        <MicOff className="w-2.5 h-2.5" /> {isMicMuted ? 'Muted' : 'Off'}
                                    </Badge>
                                )}
                            </div>
                            {isReady && isTooClose && !isFaceLost && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/40 rounded-md">
                                    <AlertTriangle className="w-2.5 h-2.5 text-amber-500 flex-shrink-0" />
                                    <span className="text-[9px] text-amber-500 font-medium">Terlalu Dekat!</span>
                                </div>
                            )}
                            {!isMicMuted && isListening && isSpeaking && (
                                <div className="flex items-end justify-center gap-[2px] h-2.5">
                                    {[0.6, 1, 0.7, 0.9, 0.5, 0.8].map((height, i) => (
                                        <div key={i} className="w-[2px] bg-emerald-500 rounded-full animate-pulse"
                                            style={{ height: `${height * 100}%`, animationDelay: `${i * 80}ms`, animationDuration: `${400 + i * 50}ms` }}
                                        />
                                    ))}
                                </div>
                            )}
                            <p className="text-[9px] text-muted-foreground leading-tight text-center">
                                {error ? "Error" : !isReady ? "Memuat model AI..." : isFaceLost ? "Arahkan wajah ke kamera" : isTooClose ? "Jauhkan wajah dari kamera" : "Tundukkan untuk scroll"}
                            </p>
                            {lastCommand && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-md">
                                    <span className="text-[9px] text-emerald-400 font-medium truncate">✓ {lastCommand}</span>
                                </div>
                            )}
                        </div>

                        {/* ── Action Buttons ── */}
                        <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-border/20">
                            <button onClick={onToggleMic}
                                className={`min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center transition-all ${isMicMuted ? 'bg-red-500/20 text-red-500 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40'}`}
                                title={isMicMuted ? 'Aktifkan Mic' : 'Matikan Mic'}
                            >
                                {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => setIsExpanded(false)}
                                className="min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
                                title="Kecilkan"
                            >
                                <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={onClose}
                                className="min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center bg-red-500/20 text-red-500 border border-red-500/40 hover:bg-red-500/30 transition-colors"
                                title="Tutup Smart Mode"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <button onClick={() => setShowCommands(!showCommands)}
                            className="w-full flex items-center justify-center gap-0.5 text-[8px] text-muted-foreground/70 hover:text-muted-foreground mt-1 transition-colors"
                        >
                            {showCommands ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                            <HandMetal className="w-2.5 h-2.5" /> Perintah
                        </button>
                        {showCommands && (
                            <div className="space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                                {[
                                    { cmd: '"Putar"', desc: 'Play' },
                                    { cmd: '"Berhenti"', desc: 'Stop' },
                                    { cmd: '"Ayat 5"', desc: 'Ke ayat' },
                                    { cmd: '"Selanjutnya"', desc: 'Next' },
                                    { cmd: '"Tafsir"', desc: 'Tafsir' },
                                    { cmd: '"Bookmark"', desc: 'Simpan' },
                                ].map(({ cmd, desc }) => (
                                    <div key={cmd} className="flex items-center justify-between text-[8px] px-1 py-0.5 rounded bg-muted/50">
                                        <code className="text-emerald-400 font-medium">{cmd}</code>
                                        <span className="text-muted-foreground">{desc}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* ── Collapsed Pill ── */
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="
                            flex items-center gap-2 px-3 py-2.5
                            bg-background/95 backdrop-blur-md shadow-xl
                            border border-primary/20 rounded-full
                            min-h-[44px] min-w-[44px]
                            hover:shadow-2xl hover:border-primary/40
                            transition-all duration-200
                            animate-in fade-in zoom-in-95 duration-200
                        "
                        title="Buka Smart Mode panel"
                    >
                        {/* Mini Camera Thumbnail via Canvas */}
                        <div className="relative w-8 h-6 rounded overflow-hidden bg-black flex-shrink-0">
                            <CanvasMirror videoRef={videoRef} className="w-full h-full" />
                            {!isReady && !error && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                    <Loader2 className="w-3 h-3 text-white animate-spin" />
                                </div>
                            )}
                        </div>

                        {/* Status Dots */}
                        <div className="flex items-center gap-1.5">
                            <StatusDot isReady={isReady} isFaceLost={isFaceLost} />
                            {isMicMuted ? (
                                <MicOff className="w-3 h-3 text-red-500" />
                            ) : isListening ? (
                                <Mic className={`w-3 h-3 ${isSpeaking ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`} />
                            ) : (
                                <MicOff className="w-3 h-3 text-muted-foreground" />
                            )}
                        </div>
                        {lastCommand && (
                            <span className="text-[9px] text-emerald-400 font-medium max-w-[60px] truncate">✓ {lastCommand}</span>
                        )}
                    </button>
                )}
            </div>
        </>
    );
};

export default SmartReaderOverlay;
