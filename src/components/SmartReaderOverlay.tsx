import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Camera, Mic } from 'lucide-react';

interface SmartReaderOverlayProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    isReady: boolean;
    isListening: boolean;
    isProcessing?: boolean;
    lastCommand?: string | null;
    error?: string | null;
    debugRefs?: { ratio: React.MutableRefObject<number>; speed: React.MutableRefObject<number> };
    onClose: () => void;
}

const SmartReaderOverlay: React.FC<SmartReaderOverlayProps> = ({
    videoRef,
    isReady,
    isListening,
    isProcessing,
    lastCommand,
    error,
    debugRefs,
    onClose
}) => {
    // Force re-render for debug info update
    const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
    React.useEffect(() => {
        if (!debugRefs) return;
        const interval = setInterval(() => forceUpdate(), 100); // 10fps debug view
        return () => clearInterval(interval);
    }, [debugRefs]);

    return (
        <Card className="fixed bottom-4 right-4 w-48 p-2 z-50 bg-background/95 backdrop-blur shadow-xl border-primary/20">
            <div className="relative aspect-video rounded-md overflow-hidden bg-black/10 mb-2">
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover mirror-x"
                    autoPlay
                    playsInline
                    muted
                    style={{ transform: 'scaleX(-1)' }} // Mirror effect
                />
                {!isReady && !error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                )}
                {isProcessing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white backdrop-blur-sm z-10">
                        <Loader2 className="w-8 h-8 animate-spin mb-1" />
                        <span className="text-[10px] font-medium">Memproses...</span>
                    </div>
                )}
                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-500/80 text-white p-2 text-center text-xs font-medium">
                        {error}
                    </div>
                )}
                {/* Debug Overlay */}
                {isReady && debugRefs && debugRefs.ratio && (
                    <div className="absolute top-0 left-0 bg-black/60 text-white text-[10px] p-1 font-mono">
                        R: {debugRefs.ratio.current.toFixed(2)} <br />
                        S: {debugRefs.speed.current.toFixed(0)}
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1">
                        <Camera className="w-3 h-3 text-primary" />
                        {isReady ? "Siap" : "Memuat..."}
                    </span>
                    {isListening && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 gap-1 border-green-500 text-green-500">
                            <Mic className="w-3 h-3" /> On
                        </Badge>
                    )}
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                    {error ? "Terjadi kesalahan sistem." : 'Tundukkan kepala untuk scroll. Ucapkan "Putar".'}
                </p>
                {lastCommand && (
                    <div className="mt-1 px-2 py-1 bg-green-500/15 border border-green-500/40 rounded text-[10px] text-green-400 text-center font-medium animate-in fade-in duration-300">
                        ✓ {lastCommand}
                    </div>
                )}
                <button
                    onClick={onClose}
                    className="w-full mt-1 text-[10px] text-red-500 hover:text-red-600 font-medium py-1"
                >
                    Matikan Smart Mode
                </button>
            </div>
        </Card>
    );
};

export default SmartReaderOverlay;
