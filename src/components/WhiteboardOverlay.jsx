/**
 * WhiteboardOverlay.jsx - Visual feedback layer for AI attention guidance
 * 
 * Renders highlights, arrows, and circles on the whiteboard
 * based on AI response coordinates/regions
 */
import React, { useState, useEffect, useCallback } from 'react';

// Region to approximate coordinates mapping
const REGION_MAP = {
    'top-left': { x: 10, y: 10, width: 30, height: 25 },
    'top-center': { x: 35, y: 10, width: 30, height: 25 },
    'top-right': { x: 65, y: 10, width: 30, height: 25 },
    'center-left': { x: 10, y: 35, width: 30, height: 30 },
    'center': { x: 35, y: 35, width: 30, height: 30 },
    'center-right': { x: 65, y: 35, width: 30, height: 30 },
    'bottom-left': { x: 10, y: 65, width: 30, height: 30 },
    'bottom-center': { x: 35, y: 65, width: 30, height: 30 },
    'bottom-right': { x: 65, y: 65, width: 30, height: 30 },
};

export default function WhiteboardOverlay({ action, onComplete }) {
    const [visible, setVisible] = useState(false);
    const [fading, setFading] = useState(false);

    useEffect(() => {
        // CSS for pulse animation - inject once
        const id = 'whiteboard-overlay-styles';
        if (!document.getElementById(id)) {
            const styleSheet = document.createElement('style');
            styleSheet.id = id;
            styleSheet.textContent = `
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.02); opacity: 0.8; }
                }
            `;
            document.head.appendChild(styleSheet);
        }

        if (action) {
            setVisible(true);
            setFading(false);
            
            // For THINKING state, don't auto-fade. It clears manually.
            if (action.type === 'THINKING') return;

            // Start fade after 3 seconds
            const fadeTimer = setTimeout(() => setFading(true), 3000);

            // Remove after 4 seconds
            const removeTimer = setTimeout(() => {
                setVisible(false);
                setFading(false);
                onComplete?.();
            }, 4000);

            return () => {
                clearTimeout(fadeTimer);
                clearTimeout(removeTimer);
            };
        }
    }, [action, onComplete]);

    if (!visible || !action) return null;

    // "THINKING" State - Subtle AI Presence
    if (action.type === 'THINKING') {
        return (
            <div className="absolute inset-0 pointer-events-none z-[40] flex items-center justify-center">
                <div className="relative">
                    {/* Pulsing Core */}
                    <div className="w-16 h-16 rounded-full bg-cyan-500/20 animate-ping absolute inset-0"></div>
                    <div className="w-16 h-16 rounded-full bg-cyan-500/10 animate-pulse absolute inset-0 delay-75"></div>
                    
                    {/* Center Icon */}
                    <div className="w-16 h-16 rounded-full bg-slate-900/50 backdrop-blur-md border border-cyan-500/30 flex items-center justify-center relative shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                        <span className="text-2xl animate-pulse">✨</span>
                    </div>

                    {/* Orbiting Particles */}
                    <div className="absolute inset-0 animate-spin-slow">
                        <div className="absolute -top-2 left-1/2 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]"></div>
                    </div>
                </div>
                
                {/* Floating Text */}
                <div className="absolute mt-24 text-cyan-400 font-bold text-xs tracking-[0.2em] uppercase animate-pulse text-shadow-glow">
                    ANALYZING
                </div>
            </div>
        );
    }


    if (action.coordinates && action.coordinates.length === 4) {
        const [x1, y1, x2, y2] = action.coordinates;
        const calcRegion = {
            x: (x1 / window.innerWidth) * 100,
            y: (y1 / window.innerHeight) * 100,
            width: ((x2 - x1) / window.innerWidth) * 100,
            height: ((y2 - y1) / window.innerHeight) * 100,
        };
        region = calcRegion;
    }

    // Default to center if no region specified
    if (!region) {
        console.warn('[Overlay] No valid region found, defaulting to center');
        region = REGION_MAP['center'];
    }

    console.log('[Overlay] Rendering at:', region);

    const color = action.color || 'cyan';
    const tool = action.tool || 'highlight';

    const baseStyle = {
        position: 'absolute',
        left: `${region.x}%`,
        top: `${region.y}%`,
        width: `${region.width}%`,
        height: `${region.height}%`,
        pointerEvents: 'none',
        zIndex: 9999, // Ensure it's on top of standard Tldraw UI
        transition: 'opacity 0.5s ease-out',
        opacity: fading ? 0 : 1,
    };

    // Render different tools
    if (tool === 'highlight') {
        return (
            <div
                data-testid="whiteboard-overlay"
                className="ai-overlay-container"
                style={{
                    ...baseStyle,
                    background: `radial-gradient(ellipse at center, ${color}33 0%, transparent 70%)`,
                    border: `2px solid ${color}`,
                    borderRadius: '12px',
                    boxShadow: `0 0 30px ${color}66, inset 0 0 20px ${color}22`,
                    animation: 'pulse 1.5s ease-in-out infinite',
                }}
            />
        );
    }

    if (tool === 'circle') {
        return (
            <div
                style={{
                    ...baseStyle,
                    border: `3px solid ${color}`,
                    borderRadius: '50%',
                    boxShadow: `0 0 20px ${color}`,
                }}
            />
        );
    }

    if (tool === 'arrow') {
        return (
            <div
                style={{
                    ...baseStyle,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <svg
                    viewBox="0 0 100 100"
                    style={{
                        width: '100%',
                        height: '100%',
                        filter: `drop-shadow(0 0 10px ${color})`,
                    }}
                >
                    <path
                        d="M20 50 L70 50 L60 35 M70 50 L60 65"
                        stroke={color}
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        );
    }

    if (tool === 'text_label' && action.description) {
        return (
            <div
                style={{
                    ...baseStyle,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    paddingTop: '8px',
                }}
            >
                <span
                    style={{
                        background: `${color}dd`,
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: `0 0 20px ${color}`,
                    }}
                >
                    {action.description}
                </span>
            </div>
        );
    }

    // Default highlight fallback
    return (
        <div
            style={{
                ...baseStyle,
                background: `${color}22`,
                border: `2px dashed ${color}`,
                borderRadius: '8px',
            }}
        />
    );
}
