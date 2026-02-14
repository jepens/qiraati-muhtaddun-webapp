import React from 'react';
import { Loader2, Camera, X, ChevronDown, ChevronUp, AlertTriangle, EyeOff } from 'lucide-react';

interface SmartReaderOverlayProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    isReady: boolean;
    isFaceLost?: boolean;
    isTooClose?: boolean;
    headPosition?: number;
    error?: string | null;
    debugRefs?: { ratio: React.MutableRefObject<number>; speed: React.MutableRefObject<number> };
    onClose: () => void;
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
            <ChevronUp className={`w-3.5 h-3.5 transition-colors duration-200 ${headPosition < -0.3 ? 'text-violet-400 animate-pulse' : 'text-muted-foreground/40'}`} />
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

/**
 * SmartReaderOverlay — Floating mini widget (bottom-right)
 * 
 * Gesture-only (no voice). Single container transitions between
 * collapsed-pill and expanded-card via CSS classes.
 * ONE <video> element always mounted — no canvas mirror.
 */
const SmartReaderOverlay: React.FC<SmartReaderOverlayProps> = ({
    videoRef,
    isReady,
    isFaceLost = false,
    isTooClose = false,
    headPosition = 0,
    error,
    debugRefs,
    onClose,
}) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

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

            {/* ── SINGLE Floating Widget container ── */}
            <div
                className={`
                    fixed z-50 right-4 transition-all duration-300 ease-out
                    bg-background/95 backdrop-blur-md shadow-2xl border border-primary/20
                    ${isExpanded
                        ? 'w-36 sm:w-40 rounded-xl p-2'
                        : 'w-auto rounded-full'
                    }
                `}
                style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
                onClick={!isExpanded ? () => setIsExpanded(true) : undefined}
                role={!isExpanded ? 'button' : undefined}
                tabIndex={!isExpanded ? 0 : undefined}
                title={!isExpanded ? 'Buka Smart Mode panel' : undefined}
            >
                {/* ── Camera Preview — ALWAYS mounted, resizes via CSS ── */}
                <div className={`
                    relative overflow-hidden bg-black transition-all duration-300
                    ${isExpanded
                        ? 'aspect-video rounded-lg mb-1.5 w-full'
                        : 'w-8 h-6 rounded m-2 mr-0 flex-shrink-0'
                    }
                `}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                    />
                    {/* Loading Overlay */}
                    {!isReady && !error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white gap-1 z-10">
                            <Loader2 className={`animate-spin ${isExpanded ? 'w-5 h-5' : 'w-3 h-3'}`} />
                            {isExpanded && <span className="text-[9px] font-medium">Memuat AI...</span>}
                        </div>
                    )}
                    {/* Error Overlay */}
                    {isExpanded && error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/80 text-white p-1.5 text-center gap-1 z-10">
                            <span className="text-[9px] font-medium leading-tight">{error}</span>
                        </div>
                    )}
                    {/* Face Lost Overlay */}
                    {isReady && isFaceLost && !error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/70 text-white gap-0.5 z-10">
                            <EyeOff className={isExpanded ? 'w-4 h-4' : 'w-3 h-3'} />
                            {isExpanded && <span className="text-[9px] font-medium">Wajah Hilang</span>}
                        </div>
                    )}
                    {/* Debug Overlay */}
                    {isExpanded && isReady && debugRefs && debugRefs.ratio && (
                        <div className="absolute top-0 left-0 bg-black/60 text-white text-[8px] p-0.5 font-mono rounded-br-md z-10">
                            Y: {debugRefs.ratio.current.toFixed(3)} <br />
                            S: {debugRefs.speed.current.toFixed(0)}
                        </div>
                    )}
                </div>

                {/* ── Collapsed: inline status next to video ── */}
                {!isExpanded && (
                    <div className="flex items-center gap-2 px-3 py-2.5">
                        <StatusDot isReady={isReady} isFaceLost={isFaceLost} />
                        <Camera className={`w-3 h-3 ${isReady ? (isFaceLost ? 'text-red-500' : 'text-emerald-500') : 'text-muted-foreground'}`} />
                    </div>
                )}

                {/* ── Expanded: status + controls ── */}
                {isExpanded && (
                    <div className="space-y-1">
                        {/* Face status */}
                        <div className="flex items-center justify-between text-[10px]">
                            <span className="flex items-center gap-1">
                                <Camera className={`w-2.5 h-2.5 ${isReady ? (isFaceLost ? 'text-red-500' : 'text-emerald-500') : 'text-muted-foreground'}`} />
                                <span className={
                                    isReady ? (isFaceLost ? 'text-red-500' : 'text-emerald-500') : 'text-muted-foreground'
                                }>
                                    {isReady ? (isFaceLost ? 'Hilang' : '✓ Aktif') : 'Memuat...'}
                                </span>
                            </span>
                        </div>

                        {/* Too Close Warning */}
                        {isReady && isTooClose && !isFaceLost && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/40 rounded-md">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-500 flex-shrink-0" />
                                <span className="text-[9px] text-amber-500 font-medium">Terlalu Dekat!</span>
                            </div>
                        )}

                        {/* Instruction */}
                        <p className="text-[9px] text-muted-foreground leading-tight text-center">
                            {error ? "Error" : !isReady ? "Memuat model AI..." : isFaceLost ? "Arahkan wajah ke kamera" : isTooClose ? "Jauhkan wajah" : "Tundukkan untuk scroll ↓"}
                        </p>

                        {/* ── Action Buttons ── */}
                        <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-border/20">
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
                    </div>
                )}
            </div>
        </>
    );
};

export default SmartReaderOverlay;
