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
        if (action) {
            setVisible(true);
            setFading(false);

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

    // Get region or use provided coordinates
    let region = action.region ? REGION_MAP[action.region] : null;
    if (action.coordinates && action.coordinates.length === 4) {
        const [x1, y1, x2, y2] = action.coordinates;
        region = {
            x: (x1 / window.innerWidth) * 100,
            y: (y1 / window.innerHeight) * 100,
            width: ((x2 - x1) / window.innerWidth) * 100,
            height: ((y2 - y1) / window.innerHeight) * 100,
        };
    }

    if (!region) {
        // Default to center if no region specified
        region = REGION_MAP['center'];
    }

    const color = action.color || 'cyan';
    const tool = action.tool || 'highlight';

    const baseStyle = {
        position: 'absolute',
        left: `${region.x}%`,
        top: `${region.y}%`,
        width: `${region.width}%`,
        height: `${region.height}%`,
        pointerEvents: 'none',
        zIndex: 100,
        transition: 'opacity 0.5s ease-out',
        opacity: fading ? 0 : 1,
    };

    // Render different tools
    if (tool === 'highlight') {
        return (
            <div
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

// CSS for pulse animation - inject into document
const styleSheet = document.createElement('style');
styleSheet.textContent = `
@keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.02); opacity: 0.8; }
}
`;
document.head.appendChild(styleSheet);
