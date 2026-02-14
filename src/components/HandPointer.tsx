import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Bookmark, BookOpen, Copy, X, type LucideIcon } from 'lucide-react';
import type { PointerPosition } from '@/hooks/useHandGesture';

// ─── Types ───
export interface AyatActionTarget {
    ayatNumber: number;
    surahNumber: number;
    element: HTMLElement;
}

interface HandPointerProps {
    pointer: PointerPosition | null;
    isPinching: boolean;
    isGrabbing: boolean;
    isActive: boolean;
    popoverTimeout?: number;     // ms, default 3000
    onAyatPlay?: (ayatNumber: number) => void;
    onAyatBookmark?: (ayatNumber: number) => void;
    onAyatTafsir?: (ayatNumber: number) => void;
    onAyatCopy?: (ayatNumber: number) => void;
}

type PointerState = 'idle' | 'hovering' | 'clicked';

// ─── Helpers ───
const findAyatElement = (x: number, y: number): AyatActionTarget | null => {
    const elements = document.elementsFromPoint(x, y);
    for (const el of elements) {
        const ayatEl = el.closest('[data-ayat-number]') as HTMLElement | null;
        if (ayatEl) {
            const ayatNumber = parseInt(ayatEl.dataset.ayatNumber || '0', 10);
            const surahNumber = parseInt(ayatEl.dataset.surahNumber || '0', 10);
            if (ayatNumber > 0) {
                return { ayatNumber, surahNumber, element: ayatEl };
            }
        }
    }
    return null;
};

export const HandPointer = ({
    pointer,
    isPinching,
    isGrabbing,
    isActive,
    popoverTimeout = 3000,
    onAyatPlay,
    onAyatBookmark,
    onAyatTafsir,
    onAyatCopy,
}: HandPointerProps) => {
    const [state, setState] = useState<PointerState>('idle');
    const [hoveredAyat, setHoveredAyat] = useState<AyatActionTarget | null>(null);
    const [popoverTarget, setPopoverTarget] = useState<AyatActionTarget | null>(null);
    const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);

    const popoverTimerRef = useRef<number>();
    const lastHoveredRef = useRef<HTMLElement | null>(null);
    const wasPinchingRef = useRef(false);

    const closePopover = useCallback(() => {
        setPopoverTarget(null);
        setPopoverPos(null);
        setState('idle');
        if (popoverTimerRef.current) {
            clearTimeout(popoverTimerRef.current);
            popoverTimerRef.current = undefined;
        }
    }, []);

    // ─── Process pointer position (hover detection) ───
    useEffect(() => {
        if (!isActive || !pointer || isGrabbing) {
            // Reset everything when no pointer or grabbing
            if (state !== 'clicked') {
                setState('idle');
                setHoveredAyat(null);
            }
            // Remove old highlight
            if (lastHoveredRef.current) {
                lastHoveredRef.current.classList.remove('hand-pointer-highlight');
                lastHoveredRef.current = null;
            }
            return;
        }

        // Don't process pointer movement while popover is showing
        if (state === 'clicked') return;

        // Find ayat element under pointer
        const target = findAyatElement(pointer.x, pointer.y);

        // ── Update highlight ──
        if (target) {
            if (lastHoveredRef.current !== target.element) {
                if (lastHoveredRef.current) {
                    lastHoveredRef.current.classList.remove('hand-pointer-highlight');
                }
                target.element.classList.add('hand-pointer-highlight');
                lastHoveredRef.current = target.element;
            }
            setHoveredAyat(target);
            setState('hovering');
        } else {
            if (lastHoveredRef.current) {
                lastHoveredRef.current.classList.remove('hand-pointer-highlight');
                lastHoveredRef.current = null;
            }
            setHoveredAyat(null);
            setState('idle');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pointer?.x, pointer?.y, isActive, isGrabbing]);

    // ─── Pinch → instant click on hovered ayat ───
    useEffect(() => {
        const justPinched = isPinching && !wasPinchingRef.current;
        wasPinchingRef.current = isPinching;

        if (justPinched && hoveredAyat && state === 'hovering' && pointer) {
            // Pinch detected while hovering → click!
            setState('clicked');
            setPopoverTarget(hoveredAyat);
            setPopoverPos({ x: pointer.x, y: pointer.y });

            // Remove highlight
            if (lastHoveredRef.current) {
                lastHoveredRef.current.classList.remove('hand-pointer-highlight');
            }

            // Auto-dismiss popover
            popoverTimerRef.current = window.setTimeout(() => {
                closePopover();
            }, popoverTimeout);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPinching]);

    // ─── Cleanup ───
    useEffect(() => {
        return () => {
            if (popoverTimerRef.current) clearTimeout(popoverTimerRef.current);
            if (lastHoveredRef.current) {
                lastHoveredRef.current.classList.remove('hand-pointer-highlight');
            }
        };
    }, []);

    if (!isActive || !pointer) return null;

    // ─── Pointer visual ───
    const pointerSize = state === 'clicked' ? 20 : state === 'hovering' ? 16 : 12;

    return (
        <>
            {/* Pointer cursor */}
            <div
                className="hand-pointer-cursor"
                style={{
                    position: 'fixed',
                    left: pointer.x,
                    top: pointer.y,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 9999,
                    pointerEvents: 'none',
                    transition: 'width 0.15s, height 0.15s',
                }}
            >
                {/* Main dot */}
                <div
                    style={{
                        width: pointerSize,
                        height: pointerSize,
                        borderRadius: '50%',
                        backgroundColor:
                            state === 'clicked' ? '#22c55e'
                                : state === 'hovering' ? '#34d399'
                                    : '#8b5cf6',
                        boxShadow:
                            state === 'hovering'
                                ? '0 0 12px rgba(139, 92, 246, 0.6)'
                                : '0 0 6px rgba(139, 92, 246, 0.4)',
                        opacity: isGrabbing ? 0.3 : isPinching ? 0.6 : 0.85,
                        transition: 'background-color 0.2s, box-shadow 0.2s, opacity 0.2s',
                    }}
                />

                {/* Pinch indicator ring */}
                {isPinching && state !== 'clicked' && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            border: '2px solid #a78bfa',
                            animation: 'pointer-flash 0.3s ease-out forwards',
                        }}
                    />
                )}

                {/* Click flash animation */}
                {state === 'clicked' && (
                    <div
                        className="hand-pointer-flash"
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            border: '2px solid #22c55e',
                            animation: 'pointer-flash 0.4s ease-out forwards',
                        }}
                    />
                )}

                {/* Grab mode indicator */}
                {isGrabbing && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: 20,
                            pointerEvents: 'none',
                        }}
                    >
                        ✊
                    </div>
                )}
            </div>

            {/* Action Popover */}
            {popoverTarget && popoverPos && (
                <div
                    className="hand-pointer-popover"
                    style={{
                        position: 'fixed',
                        left: Math.min(popoverPos.x, window.innerWidth - 220),
                        top: Math.max(popoverPos.y - 80, 10),
                        zIndex: 10000,
                        pointerEvents: 'auto',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            gap: 4,
                            padding: '8px 10px',
                            borderRadius: 12,
                            background: 'rgba(15, 15, 20, 0.92)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        }}
                    >
                        <PopoverButton
                            Icon={Play}
                            label="Play"
                            color="#22c55e"
                            onClick={() => {
                                onAyatPlay?.(popoverTarget.ayatNumber);
                                closePopover();
                            }}
                        />
                        <PopoverButton
                            Icon={Bookmark}
                            label="Bookmark"
                            color="#f59e0b"
                            onClick={() => {
                                onAyatBookmark?.(popoverTarget.ayatNumber);
                                closePopover();
                            }}
                        />
                        <PopoverButton
                            Icon={BookOpen}
                            label="Tafsir"
                            color="#3b82f6"
                            onClick={() => {
                                onAyatTafsir?.(popoverTarget.ayatNumber);
                                closePopover();
                            }}
                        />
                        <PopoverButton
                            Icon={Copy}
                            label="Copy"
                            color="#a78bfa"
                            onClick={() => {
                                onAyatCopy?.(popoverTarget.ayatNumber);
                                closePopover();
                            }}
                        />
                        <PopoverButton
                            Icon={X}
                            label="Close"
                            color="#6b7280"
                            onClick={closePopover}
                        />
                    </div>
                    <div
                        style={{
                            textAlign: 'center',
                            fontSize: 11,
                            color: 'rgba(255,255,255,0.5)',
                            marginTop: 4,
                        }}
                    >
                        Ayat {popoverTarget.ayatNumber}
                    </div>
                </div>
            )}

            {/* Global CSS for pointer effects */}
            <style>{`
                .hand-pointer-highlight {
                    outline: 2px solid rgba(139, 92, 246, 0.5) !important;
                    outline-offset: 2px;
                    background: rgba(139, 92, 246, 0.06) !important;
                    border-radius: 8px;
                    transition: outline 0.15s ease, background 0.15s ease;
                }

                @keyframes pointer-flash {
                    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
                }

                .hand-pointer-popover button:hover {
                    transform: scale(1.1);
                }
            `}</style>
        </>
    );
};

// ─── Popover Button ───
const PopoverButton = ({
    Icon,
    label,
    color,
    onClick,
}: {
    Icon: LucideIcon;
    label: string;
    color: string;
    onClick: () => void;
}) => (
    <button
        onClick={onClick}
        title={label}
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            padding: '6px 10px',
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            transition: 'background 0.15s, transform 0.15s',
            color: '#e5e7eb',
        }}
        onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
        }}
        onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
        }}
    >
        <Icon size={18} color={color} />
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>{label}</span>
    </button>
);
