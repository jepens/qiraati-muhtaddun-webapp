import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Bookmark, BookOpen, Copy, X, type LucideIcon } from 'lucide-react';
import type { PointerPosition } from '@/hooks/useHandGesture';

const TRAIL_MAX_LENGTH = 10;

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
    scrollVelocity?: number;
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

const findPopoverButton = (x: number, y: number): HTMLButtonElement | null => {
    const elements = document.elementsFromPoint(x, y);
    for (const el of elements) {
        // Look for buttons with data-popover-btn attribute
        if (el instanceof HTMLButtonElement && el.hasAttribute('data-popover-btn')) {
            return el;
        }
        // Also check if we hit an icon or span inside the button
        const btn = el.closest('button[data-popover-btn]');
        if (btn instanceof HTMLButtonElement) {
            return btn;
        }
    }
    return null;
};


const findInteractiveElement = (x: number, y: number): HTMLElement | null => {
    const elements = document.elementsFromPoint(x, y);
    for (const el of elements) {
        // 1. Explicitly marked interactive elements
        const explicit = el.closest('[data-hand-interactive="true"]');
        if (explicit instanceof HTMLElement) {
            return explicit;
        }

        // 2. Any interactive element inside a hand-controls container (e.g. Controls Bar)
        const controlsContainer = el.closest('[data-hand-controls="true"]');
        if (controlsContainer) {
            const interactive = el.closest('button, [role="button"], label, [role="switch"], [role="combobox"]');
            if (interactive instanceof HTMLElement) {
                return interactive;
            }
        }

        // 3. Buttons/options inside a Dialog, open Radix overlay, or portal (e.g. Select dropdown)
        const interactive = el.closest('button, [role="button"], [role="option"], [role="menuitem"]');
        if (interactive instanceof HTMLElement) {
            if (interactive.closest('[role="dialog"], [data-state="open"], .dialog-content, [role="listbox"]')) {
                return interactive;
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
    scrollVelocity = 0,
}: HandPointerProps) => {
    const [state, setState] = useState<PointerState>('idle');
    const [hoveredAyat, setHoveredAyat] = useState<AyatActionTarget | null>(null);
    const [popoverTarget, setPopoverTarget] = useState<AyatActionTarget | null>(null);
    const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
    const [hoveredButton, setHoveredButton] = useState<HTMLButtonElement | null>(null);
    const [hoveredInteractive, setHoveredInteractive] = useState<HTMLElement | null>(null);
    const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);

    const popoverTimerRef = useRef<number>();
    const lastHoveredRef = useRef<HTMLElement | null>(null);
    const trailRef = useRef<{ x: number; y: number }[]>([]);
    const wasPinchingRef = useRef(false);

    // Track hovered button to clean up styles
    const lastHoveredButtonRef = useRef<HTMLElement | null>(null);

    const closePopover = useCallback(() => {
        setPopoverTarget(null);
        setPopoverPos(null);
        setState('idle');
        setHoveredButton(null);
        setHoveredInteractive(null);
        if (popoverTimerRef.current) {
            clearTimeout(popoverTimerRef.current);
            popoverTimerRef.current = undefined;
        }
        if (lastHoveredButtonRef.current) {
            lastHoveredButtonRef.current.style.transform = '';
            lastHoveredButtonRef.current.style.background = '';
            lastHoveredButtonRef.current.style.outline = '';
            lastHoveredButtonRef.current = null;
        }
    }, []);

    // ─── Process pointer position (hover detection) ───
    useEffect(() => {
        if (!isActive || !pointer || isGrabbing) {
            // Reset everything when no pointer or grabbing
            if (state !== 'clicked') {
                setState('idle');
                setHoveredAyat(null);
                setHoveredInteractive(null);
            }
            // Remove old highlight
            if (lastHoveredRef.current) {
                lastHoveredRef.current.classList.remove('hand-pointer-highlight');
                lastHoveredRef.current = null;
            }
            if (lastHoveredButtonRef.current) {
                lastHoveredButtonRef.current.style.transform = '';
                lastHoveredButtonRef.current.style.background = '';
                lastHoveredButtonRef.current.style.outline = '';
                lastHoveredButtonRef.current = null;
            }
            return;
        }

        // ─── If Popover is OPEN (clicked state) ───
        if (state === 'clicked') {
            // Check if hovering over any popover button
            const btn = findPopoverButton(pointer.x, pointer.y);

            // Handle Popover Button Hover
            if (btn) {
                if (btn !== lastHoveredButtonRef.current) {
                    // Clear previous
                    if (lastHoveredButtonRef.current) {
                        lastHoveredButtonRef.current.style.transform = '';
                        lastHoveredButtonRef.current.style.background = '';
                    }
                    // Highlight new
                    btn.style.transform = 'scale(1.15)';
                    btn.style.background = 'rgba(255,255,255,0.15)';

                    lastHoveredButtonRef.current = btn;
                    setHoveredButton(btn);
                }
                return;
            } else {
                // Stick to "clicked" state but no button hovered
                if (lastHoveredButtonRef.current) {
                    lastHoveredButtonRef.current.style.transform = '';
                    lastHoveredButtonRef.current.style.background = '';
                    lastHoveredButtonRef.current = null;
                    setHoveredButton(null);
                }
            }
            return;
        }

        // ─── Normal State (Hovering Ayats OR Interactive Elements) ───

        // 1. Check for Generic Interactive Elements (e.g. Modal Close Button)
        const interactive = findInteractiveElement(pointer.x, pointer.y);

        if (interactive) {
            if (interactive !== lastHoveredButtonRef.current) {
                if (lastHoveredButtonRef.current) {
                    lastHoveredButtonRef.current.style.transform = '';
                    lastHoveredButtonRef.current.style.outline = '';
                }
                // Visual feedback for generic interactive
                interactive.style.transform = 'scale(1.05)';
                interactive.style.outline = '2px solid #22c55e';
                interactive.style.transition = 'all 0.2s';

                lastHoveredButtonRef.current = interactive;
                setHoveredInteractive(interactive);
            }

            // Clear ayat highlight if any
            if (lastHoveredRef.current) {
                lastHoveredRef.current.classList.remove('hand-pointer-highlight');
                lastHoveredRef.current = null;
                setHoveredAyat(null);
            }
            return;
        } else {
            // Clear interactive highlight
            if (lastHoveredButtonRef.current) {
                lastHoveredButtonRef.current.style.transform = '';
                lastHoveredButtonRef.current.style.outline = '';
                lastHoveredButtonRef.current = null;
                setHoveredInteractive(null);
            }
        }

        // 2. Find ayat element under pointer
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
    }, [pointer?.x, pointer?.y, isActive, isGrabbing, state]);

    // ─── Pinch → Click Handling ───
    useEffect(() => {
        const justPinched = isPinching && !wasPinchingRef.current;
        wasPinchingRef.current = isPinching;

        if (!justPinched || !pointer) return;

        // CASE 1: Pinch while hovering an Interactive Element (Generic)
        if (hoveredInteractive && state !== 'clicked') {
            hoveredInteractive.click();

            // Visual Click Feedback
            const originalTransform = hoveredInteractive.style.transform;
            hoveredInteractive.style.transform = 'scale(0.95)';
            setTimeout(() => {
                if (hoveredInteractive) hoveredInteractive.style.transform = originalTransform || 'scale(1.05)';
            }, 100);
            return;
        }

        // CASE 2: Pinch while hovering an Ayat (Open Menu)
        if (hoveredAyat && state === 'hovering') {
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

        // CASE 3: Pinch while Menu is Open (Click Button)
        else if (state === 'clicked' && hoveredButton) {
            // Trigger click
            hoveredButton.click();
            // Provide visual feedback
            hoveredButton.style.transform = 'scale(0.95)';
            setTimeout(() => {
                if (hoveredButton) hoveredButton.style.transform = 'scale(1.15)';
            }, 100);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPinching, hoveredButton, hoveredInteractive, state]);

    // ─── Cleanup ───
    useEffect(() => {
        return () => {
            if (popoverTimerRef.current) clearTimeout(popoverTimerRef.current);
            if (lastHoveredRef.current) {
                lastHoveredRef.current.classList.remove('hand-pointer-highlight');
            }
            if (lastHoveredButtonRef.current) {
                lastHoveredButtonRef.current.style.transform = '';
                lastHoveredButtonRef.current.style.outline = '';
                lastHoveredButtonRef.current.style.background = '';
            }
        };
    }, []);

    // ─── Trail update ───
    useEffect(() => {
        if (isGrabbing && pointer) {
            trailRef.current = [
                ...trailRef.current.slice(-(TRAIL_MAX_LENGTH - 1)),
                { x: pointer.x, y: pointer.y },
            ];
            setTrail([...trailRef.current]);
        } else if (trailRef.current.length > 0) {
            // Fade out: remove one point per render until empty
            trailRef.current = trailRef.current.slice(1);
            setTrail([...trailRef.current]);
            if (trailRef.current.length === 0) setTrail([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pointer?.x, pointer?.y, isGrabbing]);

    if (!isActive || !pointer) return null;

    // ─── Pointer visual ───
    const pointerSize = state === 'clicked'
        ? 20
        : (state === 'hovering' || hoveredInteractive) ? 16 : 12;

    return (
        <>
            {/* Scroll Trail */}
            {trail.map((pos, i) => {
                const progress = i / trail.length; // 0 = oldest, ~1 = newest
                const size = 4 + progress * 6;      // 4px → 10px
                const opacity = 0.08 + progress * 0.35; // 0.08 → 0.43
                return (
                    <div
                        key={`trail-${i}`}
                        style={{
                            position: 'fixed',
                            left: pos.x,
                            top: pos.y,
                            transform: 'translate(-50%, -50%)',
                            width: size,
                            height: size,
                            borderRadius: '50%',
                            backgroundColor: `rgba(251, 191, 36, ${opacity})`,
                            boxShadow: `0 0 ${4 + progress * 8}px rgba(251, 191, 36, ${opacity * 0.5})`,
                            pointerEvents: 'none',
                            zIndex: 9998,
                        }}
                    />
                );
            })}

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
                            state === 'clicked'
                                ? (hoveredButton ? '#facc15' : '#22c55e') // Yellow when hovering button
                                : (state === 'hovering' || hoveredInteractive) ? '#34d399' // Green when hovering generic interactive
                                    : '#8b5cf6',
                        boxShadow:
                            state === 'hovering' || hoveredButton || hoveredInteractive
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
                {state === 'clicked' && !hoveredButton && (
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

                {/* Scroll speed indicator (subtle size pulse) */}
                {isGrabbing && Math.abs(scrollVelocity) > 1 && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 24 + Math.min(Math.abs(scrollVelocity), 15),
                            height: 24 + Math.min(Math.abs(scrollVelocity), 15),
                            borderRadius: '50%',
                            border: '2px solid rgba(251, 191, 36, 0.4)',
                            animation: 'pulse-ring 1.5s ease-in-out infinite',
                            pointerEvents: 'none',
                        }}
                    />
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
            )
            }

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
                
                @keyframes pulse-ring {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
                    50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.2; }
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
        data-popover-btn="true"
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
    >
        <Icon size={18} color={color} />
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>{label}</span>
    </button>
);
