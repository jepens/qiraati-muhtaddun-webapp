import { useEffect, useRef, useState, useCallback, type RefObject } from 'react';
import { GestureRecognizer, FilesetResolver, DrawingUtils, type NormalizedLandmark } from '@mediapipe/tasks-vision';

// ─── Types ───
export type HandGestureName =
    | 'None'
    | 'Open_Palm'
    | 'Closed_Fist'
    | 'Thumb_Up'
    | 'Victory'
    | 'Pointing_Up'
    | 'Thumb_Down'
    | 'ILoveYou';

export interface PointerPosition {
    x: number; // pixel position on viewport
    y: number;
    rawX: number; // normalized 0-1
    rawY: number;
}

export interface UseHandGestureProps {
    enabled: boolean;
    onGesture?: (gesture: HandGestureName) => void;
    onScroll?: (deltaY: number) => void;
    onPinchClick?: () => void;
    containerRef?: RefObject<HTMLElement | null>;
}

export interface UseHandGestureReturn {
    videoRef: RefObject<HTMLVideoElement>;
    canvasRef: RefObject<HTMLCanvasElement>;
    isReady: boolean;
    error: string | null;
    gesture: HandGestureName;
    pointer: PointerPosition | null;
    isPinching: boolean;
    isGrabbing: boolean;
    isHandDetected: boolean;
    scrollVelocity?: number;
}

// ─── EMA Smoothing ───
class EMA {
    private value: number;
    private alpha: number;

    constructor(alpha = 0.3, initial = 0) {
        this.alpha = alpha;
        this.value = initial;
    }

    update(raw: number): number {
        this.value = this.alpha * raw + (1 - this.alpha) * this.value;
        return this.value;
    }

    reset(v = 0) { this.value = v; }
    get current() { return this.value; }
}

// ─── Constants ───
const CONFIG = {
    // Camera
    VIDEO_WIDTH: 640,
    VIDEO_HEIGHT: 480,
    TARGET_FPS_INTERVAL: 50, // ~20fps

    // Pointer smoothing
    POINTER_EMA_ALPHA: 0.3,

    // Pinch detection (now used for click)
    PINCH_THRESHOLD: 0.04,        // Reduced: fingers must be closer to pinch (was 0.06)
    PINCH_RELEASE_THRESHOLD: 0.06, // Reduced: tighter release zone (was 0.08)
    PINCH_CLICK_COOLDOWN: 600, // ms between pinch clicks


    // Gesture cooldown (ms)
    GESTURE_COOLDOWNS: {
        Open_Palm: 1500,
        Thumb_Up: 1200,  // Lower than Victory for snappy toggle
        Victory: 2000,
    } as Record<string, number>,

    // Per-gesture sensitivity config
    // Thumb_Up scores lower confidence in MediaPipe's model vs Victory,
    // so it needs a lower threshold and shorter hold to feel equally responsive.
    GESTURE_SENSITIVITY: {
        Thumb_Up: { confidence: 0.65, holdMs: 120 },
        Victory: { confidence: 0.80, holdMs: 200 },
        Open_Palm: { confidence: 0.80, holdMs: 200 },
        _default: { confidence: 0.80, holdMs: 200 },
    } as Record<string, { confidence: number; holdMs: number }>,

    // Hand lost timeout
    HAND_LOST_TIMEOUT_MS: 500,

    // Drawing
    LANDMARK_COLOR: '#00FF00',
    CONNECTOR_COLOR: '#00CC00',
    LANDMARK_RADIUS: 3,
    CONNECTOR_LINE_WIDTH: 2,

    // ─── AUTO-SCROLL DOWN (Grab = scroll down slowly) ───
    GRAB_SCROLL_SPEED: 15.0,        // px per frame (~180px/sec at 60fps)
} as const;

export const useHandGesture = ({
    enabled,
    onGesture,
    onScroll,
    onPinchClick,
    containerRef,
}: UseHandGestureProps): UseHandGestureReturn => {
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [gesture, setGesture] = useState<HandGestureName>('None');
    const [pointer, setPointer] = useState<PointerPosition | null>(null);
    const [isPinching, setIsPinching] = useState(false);
    const [isGrabbing, setIsGrabbing] = useState(false);
    const [isHandDetected, setIsHandDetected] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const recognizerRef = useRef<GestureRecognizer | null>(null);
    const drawingUtilsRef = useRef<DrawingUtils | null>(null);
    const requestRef = useRef<number>();
    const lastVideoTimeRef = useRef<number>(-1);
    const lastDetectTimeRef = useRef<number>(0);
    const streamRef = useRef<MediaStream | null>(null);

    // Stable refs for callbacks
    const onGestureRef = useRef(onGesture);
    const onScrollRef = useRef(onScroll);
    const onPinchClickRef = useRef(onPinchClick);
    const enabledRef = useRef(enabled);
    const containerRefInternal = useRef(containerRef);

    useEffect(() => { onGestureRef.current = onGesture; }, [onGesture]);
    useEffect(() => { onScrollRef.current = onScroll; }, [onScroll]);
    useEffect(() => { onPinchClickRef.current = onPinchClick; }, [onPinchClick]);
    useEffect(() => { enabledRef.current = enabled; }, [enabled]);
    useEffect(() => { containerRefInternal.current = containerRef; }, [containerRef]);

    // Smoothing
    const pointerEmaX = useRef(new EMA(CONFIG.POINTER_EMA_ALPHA));
    const pointerEmaY = useRef(new EMA(CONFIG.POINTER_EMA_ALPHA));

    // Auto-scroll state
    const isGrabbingRef = useRef(false);
    const autoScrollAnimRef = useRef<number | null>(null); // rAF ID for auto-scroll
    const [scrollVelocity, setScrollVelocity] = useState(0);

    // Pinch click state
    const isPinchingRef = useRef(false);
    const lastPinchClickTimeRef = useRef(0);

    // Gesture cooldown & Debounce
    const lastGestureTimeRef = useRef<Map<string, number>>(new Map());
    const gestureHoldStartRef = useRef<number>(0);
    const lastRawGestureRef = useRef<HandGestureName>('None');

    // Hand lost tracking
    const lastHandSeenRef = useRef<number>(performance.now());
    const handLostTimerRef = useRef<number | null>(null);

    // ─── Initialize GestureRecognizer ───
    const initializeRecognizer = useCallback(async () => {
        try {
            const vision = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
            );

            let recognizer: GestureRecognizer | null = null;

            const options = {
                baseOptions: {
                    modelAssetPath:
                        'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
                    delegate: 'GPU' as const,
                },
                runningMode: 'VIDEO' as const,
                numHands: 1,
                minHandDetectionConfidence: 0.75, // Increased base detection confidence
                minHandPresenceConfidence: 0.7,
                minTrackingConfidence: 0.6,
            };

            // Try GPU first, fallback to CPU
            try {
                recognizer = await GestureRecognizer.createFromOptions(vision, options);
            } catch (gpuErr) {
                console.warn('[HandGesture] GPU delegate failed, falling back to CPU:', gpuErr);
                recognizer = await GestureRecognizer.createFromOptions(vision, {
                    ...options,
                    baseOptions: { ...options.baseOptions, delegate: 'CPU' },
                });
            }

            recognizerRef.current = recognizer;

            // Initialize DrawingUtils for hand landmark visualization
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    drawingUtilsRef.current = new DrawingUtils(ctx);
                }
            }

            setIsReady(true);
            console.log('[HandGesture] GestureRecognizer ready');
        } catch (err: any) {
            console.error('[HandGesture] Init error:', err);
            setError('Gagal memuat model gesture: ' + err.message);
        }
    }, []);

    // ─── Check gesture cooldown ───
    const isGestureOnCooldown = useCallback((gestureName: string): boolean => {
        const cooldown = CONFIG.GESTURE_COOLDOWNS[gestureName];
        if (!cooldown) return false;
        const lastTime = lastGestureTimeRef.current.get(gestureName) || 0;
        return performance.now() - lastTime < cooldown;
    }, []);

    // ─── Pinch detection → CLICK ───
    const detectPinch = useCallback((landmarks: { x: number; y: number; z: number }[]) => {
        const thumb = landmarks[4];
        const index = landmarks[8];

        const dx = thumb.x - index.x;
        const dy = thumb.y - index.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const wasPinching = isPinchingRef.current;
        const threshold = wasPinching
            ? CONFIG.PINCH_RELEASE_THRESHOLD
            : CONFIG.PINCH_THRESHOLD;

        const nowPinching = distance < threshold;

        if (nowPinching && !wasPinching) {
            // Pinch START → fire click if cooldown passed
            isPinchingRef.current = true;
            setIsPinching(true);

            const now = performance.now();
            if (now - lastPinchClickTimeRef.current > CONFIG.PINCH_CLICK_COOLDOWN) {
                lastPinchClickTimeRef.current = now;
                onPinchClickRef.current?.();
                // Haptic feedback
                if (navigator.vibrate) navigator.vibrate(30);
            }
        } else if (!nowPinching && wasPinching) {
            // Pinch END
            isPinchingRef.current = false;
            setIsPinching(false);
        }
    }, []);

    // ─── Auto-Scroll Down (Closed_Fist = scroll down slowly) ───
    const startAutoScroll = useCallback(() => {
        // Cancel any existing animation
        if (autoScrollAnimRef.current) {
            cancelAnimationFrame(autoScrollAnimRef.current);
        }

        const speed = CONFIG.GRAB_SCROLL_SPEED;

        const tick = () => {
            if (!isGrabbingRef.current) {
                // Grab ended, stop scrolling
                autoScrollAnimRef.current = null;
                setScrollVelocity(0);
                return;
            }

            // Scroll down at constant speed
            if (containerRefInternal.current?.current) {
                containerRefInternal.current.current.scrollTop += speed;
            }
            onScrollRef.current?.(speed);
            setScrollVelocity(speed);

            autoScrollAnimRef.current = requestAnimationFrame(tick);
        };

        autoScrollAnimRef.current = requestAnimationFrame(tick);
    }, []);

    const stopAutoScroll = useCallback(() => {
        if (autoScrollAnimRef.current) {
            cancelAnimationFrame(autoScrollAnimRef.current);
            autoScrollAnimRef.current = null;
        }
        setScrollVelocity(0);
    }, []);

    // ─── Draw hand landmarks on canvas ───
    const drawHandLandmarks = useCallback((landmarks: NormalizedLandmark[]) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const drawingUtils = drawingUtilsRef.current;
        if (!canvas || !video || !drawingUtils) return;

        // Match canvas size to video display size
        const displayWidth = video.videoWidth || CONFIG.VIDEO_WIDTH;
        const displayHeight = video.videoHeight || CONFIG.VIDEO_HEIGHT;
        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear previous frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw connectors (skeleton lines)
        drawingUtils.drawConnectors(
            landmarks,
            GestureRecognizer.HAND_CONNECTIONS,
            { color: CONFIG.CONNECTOR_COLOR, lineWidth: CONFIG.CONNECTOR_LINE_WIDTH }
        );

        // Draw landmarks (dots)
        drawingUtils.drawLandmarks(
            landmarks,
            {
                color: CONFIG.LANDMARK_COLOR,
                lineWidth: 1,
                radius: CONFIG.LANDMARK_RADIUS,
            }
        );

        // Draw yellow pointer at index finger tip (landmark #8)
        const indexTip = landmarks[8];
        if (indexTip) {
            const x = indexTip.x * canvas.width;
            const y = indexTip.y * canvas.height;
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, 2 * Math.PI);
            ctx.fillStyle = '#facc15';
            ctx.fill();
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }, []);

    // ─── Main detection loop ───
    const predictWebcam = useCallback(() => {
        if (!recognizerRef.current || !videoRef.current || !enabledRef.current) return;

        const video = videoRef.current;
        const now = performance.now();

        // Frame rate throttling
        if (now - lastDetectTimeRef.current < CONFIG.TARGET_FPS_INTERVAL) {
            requestRef.current = requestAnimationFrame(predictWebcam);
            return;
        }

        // Skip if same frame
        if (video.currentTime === lastVideoTimeRef.current) {
            requestRef.current = requestAnimationFrame(predictWebcam);
            return;
        }

        lastVideoTimeRef.current = video.currentTime;
        lastDetectTimeRef.current = now;

        try {
            const result = recognizerRef.current.recognizeForVideo(video, now);

            if (result.landmarks.length > 0) {
                // Hand detected
                lastHandSeenRef.current = now;
                if (handLostTimerRef.current !== null) {
                    clearTimeout(handLostTimerRef.current);
                    handLostTimerRef.current = null;
                }
                setIsHandDetected(true);

                const landmarks = result.landmarks[0];

                // ── Draw hand landmarks on canvas ──
                drawHandLandmarks(landmarks as NormalizedLandmark[]);

                // ── Update pointer (index finger tip = landmark 8) ──
                const indexTip = landmarks[8];
                const mirroredX = 1 - indexTip.x;
                const smoothX = pointerEmaX.current.update(mirroredX);
                const smoothY = pointerEmaY.current.update(indexTip.y);

                setPointer({
                    x: smoothX * window.innerWidth,
                    y: smoothY * window.innerHeight,
                    rawX: mirroredX,
                    rawY: indexTip.y,
                });

                // ── Process gesture ──
                if (result.gestures.length > 0) {
                    const topGesture = result.gestures[0][0];
                    const rawGestureName = topGesture.categoryName as HandGestureName;
                    const confidence = topGesture.score;

                    // ─── DEBOUNCE / HOLD LOGIC (per-gesture sensitivity) ───
                    const gestureSens = CONFIG.GESTURE_SENSITIVITY[rawGestureName]
                        || CONFIG.GESTURE_SENSITIVITY._default;
                    const minConfidence = gestureSens.confidence;
                    const holdRequired = gestureSens.holdMs;

                    // Only process result if confidence meets per-gesture threshold
                    if (confidence >= minConfidence) {
                        // If gesture changed from last frame's raw gesture
                        if (rawGestureName !== lastRawGestureRef.current) {
                            lastRawGestureRef.current = rawGestureName;
                            gestureHoldStartRef.current = now;
                        }
                    } else {
                        // Low confidence -> treat as "None" or reset hold
                        if (lastRawGestureRef.current !== 'None') {
                            lastRawGestureRef.current = 'None';
                            gestureHoldStartRef.current = now;
                        }
                    }

                    // Check if held long enough (using per-gesture hold duration)
                    const holdDuration = now - gestureHoldStartRef.current;
                    const isStableGesture = holdDuration >= holdRequired;

                    const activeGesture = isStableGesture ? lastRawGestureRef.current : 'None';
                    // ─────────────────────────────

                    // Handle Closed_Fist (grab) → auto-scroll down
                    if (activeGesture === 'Closed_Fist') {
                        if (!isGrabbingRef.current) {
                            // Grab START — begin auto-scrolling down
                            isGrabbingRef.current = true;
                            setIsGrabbing(true);
                            setGesture('Closed_Fist');
                            startAutoScroll();
                        }
                        // No per-frame processing needed — auto-scroll runs in its own rAF loop
                    } else {
                        // End grab → stop auto-scroll
                        if (isGrabbingRef.current) {
                            isGrabbingRef.current = false;
                            stopAutoScroll();
                            setIsGrabbing(false);
                        }

                        // Detect pinch (for click)
                        detectPinch(landmarks);

                        // Process other gestures (only when not pinching)
                        if (
                            !isPinchingRef.current &&
                            activeGesture !== 'None' &&
                            !isGestureOnCooldown(activeGesture)
                        ) {
                            const recognized: HandGestureName[] = [
                                'Open_Palm', 'Thumb_Up', 'Victory'
                            ];
                            if (recognized.includes(activeGesture)) {
                                setGesture(activeGesture);
                                lastGestureTimeRef.current.set(activeGesture, now);
                                onGestureRef.current?.(activeGesture);
                            }
                        } else if (activeGesture === 'None') {
                            setGesture('None');
                        }
                    }
                }
            } else {
                // No hand detected — clear canvas
                const canvas = canvasRef.current;
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                }

                setPointer(null);

                // End grab if active (stop auto-scroll)
                if (isGrabbingRef.current) {
                    isGrabbingRef.current = false;
                    stopAutoScroll();
                    setIsGrabbing(false);
                }

                if (handLostTimerRef.current === null) {
                    handLostTimerRef.current = window.setTimeout(() => {
                        setIsHandDetected(false);
                        setGesture('None');
                        setIsPinching(false);
                        isPinchingRef.current = false;
                        handLostTimerRef.current = null;
                        lastRawGestureRef.current = 'None';
                    }, CONFIG.HAND_LOST_TIMEOUT_MS);
                }
            }
        } catch (err) {
            console.warn('[HandGesture] Frame error:', err);
        }

        if (enabledRef.current) {
            requestRef.current = requestAnimationFrame(predictWebcam);
        }
    }, [detectPinch, startAutoScroll, stopAutoScroll, drawHandLandmarks, isGestureOnCooldown]);

    // ─── Start Camera ───
    const startCamera = useCallback(async () => {
        if (!videoRef.current) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: CONFIG.VIDEO_WIDTH,
                    height: CONFIG.VIDEO_HEIGHT,
                    facingMode: 'user',
                },
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadeddata = () => {
                    predictWebcam();
                };
                streamRef.current = stream;
            }
        } catch (err: any) {
            console.error('[HandGesture] Camera error:', err);
            setError('Gagal mengakses kamera: ' + err.message);
        }
    }, [predictWebcam]);

    // ─── Initialize on mount ───
    useEffect(() => {
        initializeRecognizer();
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (recognizerRef.current) {
                recognizerRef.current.close();
                recognizerRef.current = null;
            }
            if (handLostTimerRef.current !== null) {
                clearTimeout(handLostTimerRef.current);
            }
        };
    }, [initializeRecognizer]);

    // ─── Start/Stop camera based on enabled + isReady ───
    useEffect(() => {
        if (isReady && enabled) {
            // Reset state on enable
            setGesture('None');
            setPointer(null);
            setIsPinching(false);
            setIsGrabbing(false);
            setIsHandDetected(false);
            isPinchingRef.current = false;
            isGrabbingRef.current = false;
            stopAutoScroll();
            setScrollVelocity(0);
            pointerEmaX.current.reset(0.5);
            pointerEmaY.current.reset(0.5);
            lastGestureTimeRef.current.clear();
            lastRawGestureRef.current = 'None';
            gestureHoldStartRef.current = 0;

            // Re-init DrawingUtils if needed
            if (!drawingUtilsRef.current && canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) drawingUtilsRef.current = new DrawingUtils(ctx);
            }

            startCamera();
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
            if (handLostTimerRef.current !== null) {
                clearTimeout(handLostTimerRef.current);
                handLostTimerRef.current = null;
            }
            // Clear canvas
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReady, enabled]);

    return {
        videoRef,
        canvasRef,
        isReady,
        error,
        gesture,
        pointer,
        isPinching,
        isGrabbing,
        isHandDetected,
        scrollVelocity, // Expose for UI trail feedback
    };
};

