/**
 * ScanningOverlay.jsx - "Analyzing" animation while AI processes
 * 
 * Shows a scanning effect instead of a boring spinner
 * Creates "joint attention" by highlighting analyzed area
 */
import React from 'react';

export default function ScanningOverlay({ isActive }) {
    if (!isActive) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
            {/* Scanning line effect */}
            <div
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80"
                style={{
                    animation: 'scanLine 2s ease-in-out infinite',
                }}
            />

            {/* Corner brackets */}
            <div className="absolute inset-4">
                {/* Top-left */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400 opacity-60" />
                {/* Top-right */}
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400 opacity-60" />
                {/* Bottom-left */}
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400 opacity-60" />
                {/* Bottom-right */}
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400 opacity-60" />
            </div>

            {/* Status text */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[10px] font-bold text-cyan-400 tracking-widest uppercase">
                    Analyzing Whiteboard
                </span>
            </div>

            {/* Subtle vignette */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    background: 'radial-gradient(circle at center, transparent 30%, rgba(6, 182, 212, 0.1) 100%)',
                }}
            />

            <style>{`
                @keyframes scanLine {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 0.8; }
                    90% { opacity: 0.8; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </div>
    );
}
