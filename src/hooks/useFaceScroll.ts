import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface UseFaceScrollProps {
    onScroll: (speed: number) => void;
    enabled: boolean;
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

    constructor(alpha = 0.3, initialValue = 0.77) {
        this.alpha = alpha;
        this.value = initialValue;
    }

    update(raw: number): number {
        this.value = this.alpha * raw + (1 - this.alpha) * this.value;
        return this.value;
    }

    reset(value = 0.77) {
        this.value = value;
    }

    get current() { return this.value; }
}

export const useFaceScroll = ({ onScroll, enabled }: UseFaceScrollProps) => {
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
    const requestRef = useRef<number>();
    const lastVideoTimeRef = useRef<number>(-1);
    const streamRef = useRef<MediaStream | null>(null);
    const debugRatioRef = useRef<number>(0);
    const debugSpeedRef = useRef<number>(0);

    // ─── Mobile Optimization Refs ───
    const isMobile = useRef(isMobileDevice());
    const smoother = useRef(new EMASmooth(isMobile.current ? 0.2 : 0.35));
    const lastDetectTimeRef = useRef<number>(0);
    const calibrationSamples = useRef<number[]>([]);
    const neutralRatioRef = useRef<number>(0.77); // Default neutral
    const isCalibrated = useRef(false);

    // Adaptive thresholds based on calibration
    const thresholdsRef = useRef({
        down: 0.60,
        up: 0.95,
    });

    // ─── Frame Rate Control ───
    // Mobile: ~12fps max for face detection, Desktop: ~20fps
    const targetInterval = isMobile.current ? 83 : 50; // ms between frames

    const initializeFaceLandmarker = async () => {
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
                    outputFaceBlendshapes: false, // Disable unused features — saves perf
                    outputFacialTransformationMatrixes: true,
                    runningMode: "VIDEO",
                    numFaces: 1
                });
            } catch (gpuErr) {
                console.warn('GPU delegate failed, falling back to CPU:', gpuErr);
                // CPU fallback for mobile devices without WebGPU
                landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                        delegate: "CPU"
                    },
                    outputFaceBlendshapes: false,
                    outputFacialTransformationMatrixes: true,
                    runningMode: "VIDEO",
                    numFaces: 1
                });
            }

            faceLandmarkerRef.current = landmarker;
            setIsReady(true);
            // Reset calibration for new session
            calibrationSamples.current = [];
            isCalibrated.current = false;
        } catch (err: any) {
            console.error(err);
            setError("Gagal memuat model AI: " + err.message);
        }
    };

    // ─── Auto-Calibration ───
    // Collects first N samples to determine user's neutral head position
    const CALIBRATION_COUNT = 20;

    const calibrate = useCallback((ratio: number) => {
        if (isCalibrated.current) return;

        calibrationSamples.current.push(ratio);

        if (calibrationSamples.current.length >= CALIBRATION_COUNT) {
            // Calculate median as neutral (more robust than mean)
            const sorted = [...calibrationSamples.current].sort((a, b) => a - b);
            const median = sorted[Math.floor(sorted.length / 2)];
            neutralRatioRef.current = median;

            // Set thresholds relative to neutral
            // Mobile needs wider dead-zone because of hand shake
            const downOffset = isMobile.current ? 0.22 : 0.17;
            const upOffset = isMobile.current ? 0.22 : 0.18;
            thresholdsRef.current = {
                down: median - downOffset,
                up: median + upOffset,
            };

            isCalibrated.current = true;
            smoother.current.reset(median);
            console.log(`Face scroll calibrated: neutral=${median.toFixed(3)}, down<${thresholdsRef.current.down.toFixed(3)}, up>${thresholdsRef.current.up.toFixed(3)}`);
        }
    }, []);

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
            if (enabled) requestRef.current = requestAnimationFrame(predictWebcam);
            return;
        }

        if (video.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = video.currentTime;
            lastDetectTimeRef.current = now;

            const results = faceLandmarker.detectForVideo(video, now);

            if (results.facialTransformationMatrixes && results.facialTransformationMatrixes.length > 0) {
                // Geometry-based Pitch Detection
                const landmarks = results.faceLandmarks[0];
                const nose = landmarks[1];
                const chin = landmarks[152];
                const forehead = landmarks[10];

                const yNoseChin = Math.abs(chin.y - nose.y);
                const yNoseForehead = Math.abs(nose.y - forehead.y);

                const rawRatio = yNoseChin / yNoseForehead;

                // ─── Auto-calibrate with first N frames ───
                calibrate(rawRatio);

                // ─── EMA Smoothing ───
                const ratio = smoother.current.update(rawRatio);
                debugRatioRef.current = ratio;

                let speed = 0;
                const { down: DOWN_TH, up: UP_TH } = thresholdsRef.current;

                if (ratio < DOWN_TH) {
                    // Looking DOWN -> Scroll Down (Positive speed)
                    const intensity = (DOWN_TH - ratio) * 2;
                    speed = 2 + (intensity * (isMobile.current ? 10 : 15));
                } else if (ratio > UP_TH) {
                    // Looking UP -> Scroll Up (Negative speed)
                    const intensity = (ratio - UP_TH) * 2;
                    speed = -(2 + (intensity * (isMobile.current ? 10 : 15)));
                }

                debugSpeedRef.current = speed;

                if (speed !== 0) {
                    onScroll(speed);
                }
            }
        }

        if (enabled) {
            requestRef.current = requestAnimationFrame(predictWebcam);
        }
    }, [enabled, onScroll, calibrate, targetInterval]);

    const startCamera = useCallback(async () => {
        if (!videoRef.current) return;

        try {
            // ─── Adaptive Camera Resolution ───
            const mobile = isMobile.current;
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: mobile ? 320 : 640,
                    height: mobile ? 240 : 480,
                    facingMode: "user",
                    // Lower framerate on mobile for battery
                    ...(mobile ? { frameRate: { ideal: 15, max: 20 } } : {})
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.addEventListener('loadeddata', predictWebcam);
                streamRef.current = stream;
            }
        } catch (err: any) {
            console.error(err);
            setError("Gagal mengakses kamera: " + err.message);
        }
    }, [predictWebcam]);

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
        }
    }, []);

    useEffect(() => {
        if (isReady && enabled) {
            // Reset calibration on re-enable
            calibrationSamples.current = [];
            isCalibrated.current = false;
            smoother.current.reset(0.77);
            startCamera();
            requestRef.current = requestAnimationFrame(predictWebcam);
        } else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }
    }, [isReady, enabled, predictWebcam, startCamera]);

    return { videoRef, isReady, error, debugRefs: { ratio: debugRatioRef, speed: debugSpeedRef } };
};
