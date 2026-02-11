import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface UseFaceScrollProps {
    onScroll: (speed: number) => void;
    enabled: boolean;
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

    const initializeFaceLandmarker = async () => {
        try {
            const filesetResolver = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
            );

            faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                    delegate: "GPU"
                },
                outputFaceBlendshapes: true,
                outputFacialTransformationMatrixes: true,
                runningMode: "VIDEO",
                numFaces: 1
            });

            setIsReady(true);
        } catch (err: any) {
            console.error(err);
            setError("Gagal memuat model AI: " + err.message);
        }
    };

    const predictWebcam = useCallback(() => {
        const video = videoRef.current;
        const faceLandmarker = faceLandmarkerRef.current;

        if (!video || !faceLandmarker) return;

        // Ensure video is playing and has valid dimensions
        if (video.paused || video.ended || video.videoWidth === 0 || video.videoHeight === 0) {
            requestRef.current = requestAnimationFrame(predictWebcam);
            return;
        }

        if (video.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = video.currentTime;
            const startTimeMs = performance.now();

            const results = faceLandmarker.detectForVideo(video, startTimeMs);

            if (results.facialTransformationMatrixes && results.facialTransformationMatrixes.length > 0) {
                // Geometry-based Pitch Detection
                const landmarks = results.faceLandmarks[0];
                const nose = landmarks[1];
                const chin = landmarks[152];
                const forehead = landmarks[10];

                const yNoseChin = Math.abs(chin.y - nose.y);
                const yNoseForehead = Math.abs(nose.y - forehead.y);

                const ratio = yNoseChin / yNoseForehead;
                debugRatioRef.current = ratio;

                let speed = 0;

                // Calibration Data:
                // Neutral: ~0.77
                // Down: ~0.47
                // Up: ~1.07

                // Thresholds:
                const DOWN_THRESHOLD = 0.60; // Triggers when ratio < 0.60
                const UP_THRESHOLD = 0.95;   // Triggers when ratio > 0.95

                if (ratio < DOWN_THRESHOLD) {
                    // Looking DOWN -> Scroll Down (Positive speed)
                    // The lower the ratio, the faster
                    const intensity = (DOWN_THRESHOLD - ratio) * 2; // e.g. (0.60 - 0.47) * 2 = 0.26
                    speed = 2 + (intensity * 15); // Base speed 2 + ~4 = 6
                } else if (ratio > UP_THRESHOLD) {
                    // Looking UP -> Scroll Up (Negative speed)
                    // The higher the ratio, the faster
                    const intensity = (ratio - UP_THRESHOLD) * 2; // e.g. (1.07 - 0.95) * 2 = 0.24
                    speed = -(2 + (intensity * 15)); // Base speed -2 + ~4 = -6
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
    }, [enabled, onScroll]);

    const startCamera = useCallback(async () => {
        if (!videoRef.current) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 640,
                    height: 480,
                    facingMode: "user"
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

// Add refs for debug info at the top of the hook (inside)
// const debugRatioRef = useRef<number>(0);
// const debugSpeedRef = useRef<number>(0);
