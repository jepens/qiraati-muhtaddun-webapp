import { useEffect, useRef, useState, useCallback, type RefObject, type MutableRefObject } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface UseFaceScrollProps {
    onScroll: (speed: number) => void;
    enabled: boolean;
}

interface UseFaceScrollReturn {
    videoRef: RefObject<HTMLVideoElement>;
    isReady: boolean;
    error: string | null;
    isFaceLost: boolean;
    isTooClose: boolean;
    /** Normalized head position: -1 (full up) to +1 (full down), 0 = neutral/deadzone */
    headPosition: number;
    debugRefs: {
        ratio: MutableRefObject<number>;
        speed: MutableRefObject<number>;
    };
}

// ─── Mobile Detection ───
const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || ('ontouchstart' in window && window.innerWidth < 768);
};

// ─── EMA Smoothing Helper ───
class EMASmooth {
    private value: number;
    private alpha: number;

    constructor(alpha = 0.15, initialValue = 0.5) {
        this.alpha = alpha;
        this.value = initialValue;
    }

    update(raw: number): number {
        this.value = this.alpha * raw + (1 - this.alpha) * this.value;
        return this.value;
    }

    reset(value = 0.5) {
        this.value = value;
    }

    get current() { return this.value; }
}

// ─── Configuration Constants ───
const CONFIG = {
    CALIBRATION_COUNT: 20,
    DEADZONE: 0.06,                    // Normalized Y threshold (docs: 0.05–0.1)
    SENSITIVITY_MOBILE: 35,
    SENSITIVITY_DESKTOP: 50,
    EMA_ALPHA_MOBILE: 0.12,            // Smoother on mobile (docs: 0.1–0.2)
    EMA_ALPHA_DESKTOP: 0.18,
    FACE_LOST_TIMEOUT_MS: 1000,        // Auto-stop after 1s without face
    Z_TOO_CLOSE_THRESHOLD: -0.06,      // Z-depth threshold for "too close" warning
    BASE_SCROLL_SPEED: 1.5,            // Minimum speed when outside deadzone
    MAX_SCROLL_SPEED: 25,              // Cap max scroll speed
} as const;

export const useFaceScroll = ({ onScroll, enabled }: UseFaceScrollProps): UseFaceScrollReturn => {
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isFaceLost, setIsFaceLost] = useState(false);
    const [isTooClose, setIsTooClose] = useState(false);
    const [headPosition, setHeadPosition] = useState(0);

    const videoRef = useRef<HTMLVideoElement>(null);
    const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
    const requestRef = useRef<number>();
    const lastVideoTimeRef = useRef<number>(-1);
    const streamRef = useRef<MediaStream | null>(null);
    const debugRatioRef = useRef<number>(0);
    const debugSpeedRef = useRef<number>(0);

    // ─── Refs for mutable values (prevents stale closures & re-creation cascade) ───
    const onScrollRef = useRef(onScroll);
    const enabledRef = useRef(enabled);

    // Keep refs in sync with props
    useEffect(() => { onScrollRef.current = onScroll; }, [onScroll]);
    useEffect(() => { enabledRef.current = enabled; }, [enabled]);

    // ─── Mobile Optimization Refs ───
    const isMobile = useRef(isMobileDevice());
    const smoother = useRef(new EMASmooth(
        isMobile.current ? CONFIG.EMA_ALPHA_MOBILE : CONFIG.EMA_ALPHA_DESKTOP,
        0.5
    ));
    const lastDetectTimeRef = useRef<number>(0);

    // ─── Nose-Tip Y Calibration ───
    const calibrationSamples = useRef<number[]>([]);
    const yRefRef = useRef<number | null>(null);       // Neutral Y position
    const isCalibrated = useRef(false);

    // ─── Face-Lost Tracking ───
    const lastFaceSeenRef = useRef<number>(performance.now());
    const faceLostTimerRef = useRef<number | null>(null);

    // ─── Frame Rate Control ───
    // Mobile: ~12fps, Desktop: ~20fps for face detection
    const targetInterval = isMobile.current ? 83 : 50;

    const initializeFaceLandmarker = useCallback(async () => {
        try {
            const filesetResolver = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
            );

            // Try GPU first, fallback to CPU on mobile
            let landmarker: FaceLandmarker | null = null;
            try {
                landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                        delegate: "GPU"
                    },
                    outputFaceBlendshapes: false,
                    outputFacialTransformationMatrixes: false, // Not needed for nose-tip Y
                    runningMode: "VIDEO",
                    numFaces: 1
                });
            } catch (gpuErr) {
                console.warn('GPU delegate failed, falling back to CPU:', gpuErr);
                landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                        delegate: "CPU"
                    },
                    outputFaceBlendshapes: false,
                    outputFacialTransformationMatrixes: false,
                    runningMode: "VIDEO",
                    numFaces: 1
                });
            }

            faceLandmarkerRef.current = landmarker;
            setIsReady(true);
            // Reset calibration for new session
            calibrationSamples.current = [];
            isCalibrated.current = false;
            yRefRef.current = null;
        } catch (err: any) {
            console.error(err);
            setError("Gagal memuat model AI: " + err.message);
        }
    }, []);

    // ─── Auto-Calibration ───
    // Collects first N samples of nose-tip Y to determine neutral position
    const calibrate = useCallback((currentY: number) => {
        if (isCalibrated.current) return;

        calibrationSamples.current.push(currentY);

        if (calibrationSamples.current.length >= CONFIG.CALIBRATION_COUNT) {
            // Calculate median as neutral (more robust than mean)
            const sorted = [...calibrationSamples.current].sort((a, b) => a - b);
            const median = sorted[Math.floor(sorted.length / 2)];
            yRefRef.current = median;
            isCalibrated.current = true;
            smoother.current.reset(median);
            console.log(`[FaceScroll] Calibrated: yRef=${median.toFixed(4)}, deadzone=±${CONFIG.DEADZONE}`);
        }
    }, []);

    // ─── Face-Lost Handler ───
    const handleFaceLost = useCallback(() => {
        if (faceLostTimerRef.current !== null) return; // Already running

        faceLostTimerRef.current = window.setTimeout(() => {
            setIsFaceLost(true);
            setHeadPosition(0);
            debugSpeedRef.current = 0;
            console.log('[FaceScroll] Face lost — auto-stop scroll');
        }, CONFIG.FACE_LOST_TIMEOUT_MS);
    }, []);

    const handleFaceFound = useCallback(() => {
        if (faceLostTimerRef.current !== null) {
            clearTimeout(faceLostTimerRef.current);
            faceLostTimerRef.current = null;
        }
        setIsFaceLost(false);
        lastFaceSeenRef.current = performance.now();
    }, []);

    // ─── Detection Loop (STABLE — no mutable deps) ───
    // Reads `enabledRef` and `onScrollRef` from refs to avoid re-creation
    const predictWebcam = useCallback(() => {
        const video = videoRef.current;
        const faceLandmarker = faceLandmarkerRef.current;

        if (!video || !faceLandmarker) return;

        // Ensure video is playing and has valid dimensions
        if (video.paused || video.ended || video.videoWidth === 0 || video.videoHeight === 0) {
            requestRef.current = requestAnimationFrame(predictWebcam);
            return;
        }

        // ─── Frame Rate Throttle ───
        const now = performance.now();
        if (now - lastDetectTimeRef.current < targetInterval) {
            if (enabledRef.current) requestRef.current = requestAnimationFrame(predictWebcam);
            return;
        }

        if (video.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = video.currentTime;
            lastDetectTimeRef.current = now;

            const results = faceLandmarker.detectForVideo(video, now);

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                // ─── Face Found ───
                handleFaceFound();

                const landmarks = results.faceLandmarks[0];
                const noseTip = landmarks[4]; // Landmark ID 4 — Nose Tip (per docs)
                const currentY = noseTip.y;

                // ─── Z-Depth "Too Close" Check ───
                const zDepth = noseTip.z;
                setIsTooClose(zDepth < CONFIG.Z_TOO_CLOSE_THRESHOLD);

                // ─── Auto-calibrate with first N frames ───
                calibrate(currentY);

                if (!isCalibrated.current || yRefRef.current === null) {
                    // Still calibrating — skip scroll
                    if (enabledRef.current) requestRef.current = requestAnimationFrame(predictWebcam);
                    return;
                }

                // ─── EMA Smoothing ───
                const smoothedY = smoother.current.update(currentY);
                const deltaY = smoothedY - yRefRef.current;

                debugRatioRef.current = smoothedY;

                // ─── Deadzone & Velocity Calculation ───
                let speed = 0;
                let normalizedPosition = 0; // For UI indicator

                if (Math.abs(deltaY) > CONFIG.DEADZONE) {
                    const direction = deltaY > 0 ? 1 : -1; // +1 = down, -1 = up
                    const intensity = Math.abs(deltaY) - CONFIG.DEADZONE;
                    const sensitivity = isMobile.current ? CONFIG.SENSITIVITY_MOBILE : CONFIG.SENSITIVITY_DESKTOP;

                    speed = direction * Math.min(
                        CONFIG.BASE_SCROLL_SPEED + (intensity * sensitivity),
                        CONFIG.MAX_SCROLL_SPEED
                    );

                    // Normalized position for UI bar: map deltaY to -1..+1 range
                    // Max useful deltaY is about 0.25, so scale accordingly
                    normalizedPosition = Math.max(-1, Math.min(1, deltaY / 0.20));
                } else {
                    // In deadzone — position is proportional but scaled smaller
                    normalizedPosition = (deltaY / CONFIG.DEADZONE) * 0.3;
                }

                debugSpeedRef.current = speed;
                setHeadPosition(normalizedPosition);

                if (speed !== 0) {
                    onScrollRef.current(speed);
                }
            } else {
                // ─── No Face Detected ───
                handleFaceLost();
            }
        }

        if (enabledRef.current) {
            requestRef.current = requestAnimationFrame(predictWebcam);
        }
    }, [calibrate, targetInterval, handleFaceFound, handleFaceLost]); // ← NO onScroll, NO enabled

    // ─── Start Camera (STABLE — no predictWebcam dep) ───
    const startCamera = useCallback(async () => {
        if (!videoRef.current) return;

        try {
            const mobile = isMobile.current;
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: mobile ? 320 : 640,
                    height: mobile ? 240 : 480,
                    facingMode: "user",
                    ...(mobile ? { frameRate: { ideal: 15, max: 20 } } : {})
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Use onloadeddata (assignment) instead of addEventListener to prevent stacking
                videoRef.current.onloadeddata = () => {
                    predictWebcam();
                };
                streamRef.current = stream;
            }
        } catch (err: any) {
            console.error(err);
            setError("Gagal mengakses kamera: " + err.message);
        }
    }, [predictWebcam]);

    // ─── Initialize FaceLandmarker on mount ───
    useEffect(() => {
        initializeFaceLandmarker();
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (faceLandmarkerRef.current) {
                faceLandmarkerRef.current.close();
                faceLandmarkerRef.current = null;
            }
            if (faceLostTimerRef.current !== null) {
                clearTimeout(faceLostTimerRef.current);
            }
        }
    }, [initializeFaceLandmarker]);

    // ─── Start/Stop camera based on enabled + isReady ───
    // Dependencies: only isReady and enabled (both primitive values).
    // startCamera and predictWebcam are now stable — no need to include them.
    useEffect(() => {
        if (isReady && enabled) {
            // Reset calibration on re-enable
            calibrationSamples.current = [];
            isCalibrated.current = false;
            yRefRef.current = null;
            smoother.current.reset(0.5);
            setIsFaceLost(false);
            setIsTooClose(false);
            setHeadPosition(0);
            startCamera();
            // Don't start rAF here — startCamera's onloadeddata will start it
        } else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.onloadeddata = null;
                videoRef.current.srcObject = null;
            }
            if (faceLostTimerRef.current !== null) {
                clearTimeout(faceLostTimerRef.current);
                faceLostTimerRef.current = null;
            }
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReady, enabled]);

    return {
        videoRef,
        isReady,
        error,
        isFaceLost,
        isTooClose,
        headPosition,
        debugRefs: { ratio: debugRatioRef, speed: debugSpeedRef },
    };
};
