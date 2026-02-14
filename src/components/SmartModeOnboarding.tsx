import React, { useState, useEffect, useCallback } from 'react';
import {
    ScanFace, Camera, Hand, ArrowUpDown,
    ChevronRight, ChevronLeft, Check, X,
    Lightbulb, AlertTriangle, Loader2, Sparkles, MousePointer2
} from 'lucide-react';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import type { GestureType } from '@/providers/SmartReaderContextDefinition';

// ─── Types ───

interface SmartModeOnboardingProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onActivate: () => void;
    /** Which gesture mode this onboarding is for */
    gestureType?: GestureType;
}

type CameraStatus = 'idle' | 'checking' | 'granted' | 'denied';

const STORAGE_KEY_HEAD = 'smartmode-onboarding-skip-head';
const STORAGE_KEY_HAND = 'smartmode-onboarding-skip-hand';

// ─── Step Content ───

const TOTAL_STEPS = 3;

// ─── Component ───

const SmartModeOnboarding: React.FC<SmartModeOnboardingProps> = ({
    open,
    onOpenChange,
    onActivate,
    gestureType = 'head',
}) => {
    const [step, setStep] = useState(0);
    const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
    const [skipNextTime, setSkipNextTime] = useState(false);
    const isMobileDevice = gestureType === 'head';
    const STORAGE_KEY = gestureType === 'hand' ? STORAGE_KEY_HAND : STORAGE_KEY_HEAD;

    // ── Check camera permission without prompting ──
    const checkCameraPermission = useCallback(async () => {
        try {
            // navigator.permissions.query may not be supported in all browsers
            if (navigator.permissions?.query) {
                const result = await navigator.permissions.query({ name: 'camera' } as Parameters<typeof navigator.permissions.query>[0]);
                if (result.state === 'granted') {
                    setCameraStatus('granted');
                } else if (result.state === 'denied') {
                    setCameraStatus('denied');
                } else {
                    setCameraStatus('idle');
                }
            }
        } catch {
            // permissions.query not supported, stay idle
            setCameraStatus('idle');
        }
    }, []);

    // Reset state when drawer opens
    useEffect(() => {
        if (open) {
            setStep(0);
            setSkipNextTime(false);
            // Check camera permission status on open
            checkCameraPermission();
        }
    }, [open, checkCameraPermission]);

    // ── Request camera permission ──
    const requestCamera = useCallback(async () => {
        setCameraStatus('checking');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            });
            // Permission granted — stop stream immediately (we don't need it yet)
            stream.getTracks().forEach(track => track.stop());
            setCameraStatus('granted');
        } catch {
            setCameraStatus('denied');
        }
    }, []);

    // ── Activate handler ──
    const handleActivate = useCallback(() => {
        if (skipNextTime) {
            localStorage.setItem(STORAGE_KEY, 'true');
        }
        onOpenChange(false);
        // Small delay for drawer close animation
        setTimeout(() => {
            onActivate();
        }, 300);
    }, [skipNextTime, onActivate, onOpenChange, STORAGE_KEY]);

    const goNext = () => setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
    const goBack = () => setStep(s => Math.max(s - 1, 0));

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[90vh]">
                <DrawerHeader className="pb-1">
                    <DrawerTitle className="text-base flex items-center gap-2">
                        {isMobileDevice ? (
                            <ScanFace className="w-5 h-5 text-violet-500" />
                        ) : (
                            <Hand className="w-5 h-5 text-violet-500" />
                        )}
                        Smart Mode — {isMobileDevice ? 'Head Gesture' : 'Hand Gesture'}
                    </DrawerTitle>
                    <DrawerDescription className="text-xs">
                        {step === 0 && 'Fitur baca Al-Quran tanpa sentuh layar'}
                        {step === 1 && 'Panduan menggunakan Smart Mode'}
                        {step === 2 && 'Izinkan kamera dan mulai'}
                    </DrawerDescription>
                </DrawerHeader>

                <div className="px-4 pb-5 space-y-4">

                    {/* ── Step 1: Apa itu Smart Mode? ── */}
                    {step === 0 && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Hero */}
                            <div className="flex justify-center">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/20 flex items-center justify-center">
                                    <ScanFace className="w-10 h-10 text-violet-500" />
                                </div>
                            </div>

                            <p className="text-center text-sm text-muted-foreground leading-relaxed">
                                Smart Mode memungkinkan Anda membaca Al-Quran <strong className="text-foreground">tanpa menyentuh layar</strong>.
                                {' '}{isMobileDevice
                                    ? 'Cukup gerakkan kepala untuk scroll halaman.'
                                    : 'Gunakan tangan untuk mengontrol pointer, scroll, dan aksi lainnya.'
                                }
                            </p>

                            {/* Feature cards */}
                            <div className="grid gap-2">
                                {(isMobileDevice ? [
                                    { icon: Camera, title: 'Face Tracking', desc: 'Deteksi wajah melalui kamera depan secara real-time' },
                                    { icon: ArrowUpDown, title: 'Gesture Scroll', desc: 'Gerakkan kepala ke atas atau bawah untuk scroll halaman' },
                                    { icon: Hand, title: 'Hands-Free', desc: 'Baca Al-Quran sambil berwudhu, makan, atau beraktivitas lainnya' },
                                ] : [
                                    { icon: MousePointer2, title: 'Virtual Pointer', desc: 'Arahkan jari telunjuk sebagai pointer virtual' },
                                    { icon: Hand, title: 'Pinch Scroll', desc: 'Cubit ibu jari & telunjuk lalu geser untuk scroll' },
                                    { icon: Sparkles, title: 'Gesture Commands', desc: 'Telapak terbuka, tinju, jempol, peace — untuk kontrol' },
                                ]).map(({ icon: Icon, title, desc }) => (
                                    <div key={title} className="flex items-start gap-3 p-3 rounded-xl border border-border/30 bg-card">
                                        <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                                            <Icon className="w-4.5 h-4.5 text-violet-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground">{title}</p>
                                            <p className="text-[11px] text-muted-foreground leading-snug">{desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Cara Menggunakan ── */}
                    {step === 1 && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2.5">
                                {(isMobileDevice ? [
                                    {
                                        num: 1,
                                        icon: Camera,
                                        title: 'Izinkan Akses Kamera',
                                        desc: 'Smart Mode membutuhkan kamera depan untuk mendeteksi wajah Anda.',
                                        color: 'text-blue-500 bg-blue-500/10',
                                    },
                                    {
                                        num: 2,
                                        icon: ScanFace,
                                        title: 'Posisikan Wajah',
                                        desc: 'Hadapkan wajah ke kamera dengan jarak ±50 cm. Pastikan pencahayaan cukup.',
                                        color: 'text-violet-500 bg-violet-500/10',
                                    },
                                    {
                                        num: 3,
                                        icon: ArrowUpDown,
                                        title: 'Gerakkan Kepala',
                                        desc: 'Tundukkan kepala ke bawah untuk scroll turun, tengadah ke atas untuk scroll naik.',
                                        color: 'text-emerald-500 bg-emerald-500/10',
                                    },
                                ] : [
                                    {
                                        num: 1,
                                        icon: Camera,
                                        title: 'Izinkan Akses Kamera',
                                        desc: 'Smart Mode membutuhkan kamera untuk mendeteksi tangan Anda.',
                                        color: 'text-blue-500 bg-blue-500/10',
                                    },
                                    {
                                        num: 2,
                                        icon: MousePointer2,
                                        title: 'Pointer & Dwell Click',
                                        desc: 'Acungkan telunjuk untuk pointer. Tahan di atas ayat 1.5 detik untuk membuka aksi.',
                                        color: 'text-violet-500 bg-violet-500/10',
                                    },
                                    {
                                        num: 3,
                                        icon: Hand,
                                        title: 'Pinch & Gesture',
                                        desc: 'Cubit ibu jari + telunjuk untuk scroll. ✋ Stop audio, ✌️ Buka search + mic, 👍 Play/pause.',
                                        color: 'text-emerald-500 bg-emerald-500/10',
                                    },
                                ]).map(({ num, icon: Icon, title, desc, color }) => (
                                    <div key={num} className="flex items-start gap-3 p-3 rounded-xl border border-border/30 bg-card">
                                        <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center flex-shrink-0 relative`}>
                                            <Icon className="w-4.5 h-4.5" />
                                            <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
                                                {num}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground">{title}</p>
                                            <p className="text-[11px] text-muted-foreground leading-snug">{desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Tip box */}
                            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                                <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-medium text-amber-500">Tips</p>
                                    <p className="text-[11px] text-muted-foreground leading-snug">
                                        Gunakan di tempat yang cukup terang. Smart Mode bekerja lebih baik saat wajah terlihat jelas di kamera.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step 3: Camera Permission + Activate ── */}
                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Camera permission card */}
                            <div className="p-4 rounded-xl border border-border/30 bg-card space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cameraStatus === 'granted'
                                        ? 'bg-emerald-500/10 text-emerald-500'
                                        : cameraStatus === 'denied'
                                            ? 'bg-red-500/10 text-red-500'
                                            : 'bg-blue-500/10 text-blue-500'
                                        }`}>
                                        {cameraStatus === 'checking' ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : cameraStatus === 'granted' ? (
                                            <Check className="w-5 h-5" />
                                        ) : cameraStatus === 'denied' ? (
                                            <X className="w-5 h-5" />
                                        ) : (
                                            <Camera className="w-5 h-5" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-foreground">
                                            {cameraStatus === 'granted' ? 'Kamera Diizinkan ✅' :
                                                cameraStatus === 'denied' ? 'Kamera Ditolak' :
                                                    cameraStatus === 'checking' ? 'Meminta Izin...' :
                                                        'Izin Kamera Diperlukan'}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground leading-snug">
                                            {cameraStatus === 'granted'
                                                ? 'Kamera siap digunakan untuk Smart Mode.'
                                                : cameraStatus === 'denied'
                                                    ? 'Buka pengaturan browser untuk mengizinkan kamera.'
                                                    : 'Smart Mode membutuhkan kamera depan untuk face tracking.'}
                                        </p>
                                    </div>
                                </div>

                                {cameraStatus !== 'granted' && cameraStatus !== 'checking' && (
                                    <Button
                                        onClick={requestCamera}
                                        variant={cameraStatus === 'denied' ? 'outline' : 'default'}
                                        className={`w-full h-11 ${cameraStatus === 'denied' ? '' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                                    >
                                        <Camera className="w-4 h-4 mr-2" />
                                        {cameraStatus === 'denied' ? 'Coba Lagi' : 'Izinkan Kamera'}
                                    </Button>
                                )}

                                {/* Denied guidance */}
                                {cameraStatus === 'denied' && (
                                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/5 border border-red-500/20">
                                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-muted-foreground leading-snug">
                                            Jika tombol "Coba Lagi" tidak berhasil, buka <strong className="text-foreground">Pengaturan Browser → Situs ini → Kamera → Izinkan</strong>, lalu refresh halaman.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Don't show again checkbox */}
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={skipNextTime}
                                    onChange={(e) => setSkipNextTime(e.target.checked)}
                                    className="w-4 h-4 rounded border-border accent-violet-600"
                                />
                                <span className="text-xs text-muted-foreground">
                                    Jangan tampilkan lagi — langsung aktifkan saat klik
                                </span>
                            </label>

                            {/* Activate button */}
                            <Button
                                onClick={handleActivate}
                                disabled={cameraStatus !== 'granted'}
                                className="w-full h-12 bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20 text-sm font-medium rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Aktifkan Smart Mode
                            </Button>

                            {cameraStatus !== 'granted' && (
                                <p className="text-center text-[10px] text-muted-foreground/60">
                                    Izinkan kamera terlebih dahulu untuk mengaktifkan.
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── Navigation: Dot indicators + Buttons ── */}
                    <div className="flex items-center justify-between pt-2">
                        {/* Back button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={goBack}
                            disabled={step === 0}
                            className="text-xs h-9 px-3"
                        >
                            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                            Kembali
                        </Button>

                        {/* Dot indicators */}
                        <div className="flex gap-1.5">
                            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setStep(i)}
                                    className={`w-2 h-2 rounded-full transition-all duration-200 ${i === step
                                        ? 'bg-violet-500 w-5'
                                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                                        }`}
                                    aria-label={`Step ${i + 1}`}
                                />
                            ))}
                        </div>

                        {/* Next button */}
                        {step < TOTAL_STEPS - 1 ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={goNext}
                                className="text-xs h-9 px-3 text-violet-500 hover:text-violet-400"
                            >
                                Lanjut
                                <ChevronRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                        ) : (
                            // Invisible spacer to keep dots centered
                            <div className="w-[76px]" />
                        )}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
};

export default SmartModeOnboarding;
