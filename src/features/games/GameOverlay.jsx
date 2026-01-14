import { useEffect, useState } from 'react';

export default function GameOverlay({ children, title, onClose }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation on mount
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 200); // Wait for exit animation
    };

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center transition-all duration-300 ${isVisible ? 'bg-black/70 backdrop-blur-md' : 'bg-transparent'}`}
            onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
            {/* Ambient glow - Removed to prevent render artifacts "Cluster break" */}
            {/* <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-full blur-[200px] pointer-events-none" /> */}

            <div
                className={`
                    w-full h-full sm:w-[95vw] sm:h-[95vh] sm:max-w-6xl
                    bg-gradient-to-b from-slate-900 to-slate-950 
                    border border-white/10 sm:border-2 sm:border-slate-700 
                    sm:rounded-3xl shadow-2xl 
                    flex flex-col overflow-hidden relative
                    transition-all duration-300 ease-out
                    ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full sm:translate-y-8 opacity-0'}
                `}
            >
                {/* Shimmer effect on border */}
                <div className="absolute inset-0 rounded-3xl pointer-events-none overflow-hidden">
                    <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                </div>

                {/* Header */}
                <div className="h-16 shrink-0 bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 border-b border-white/10 flex items-center justify-between px-4 sm:px-6 relative">
                    {/* Accent line */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                            <span className="text-xl">🕹️</span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase">
                            {title}
                        </h2>
                    </div>

                    <button
                        onClick={handleClose}
                        className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 flex items-center justify-center transition-all group"
                    >
                        <svg className="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Game Container */}
                <div className="flex-1 overflow-hidden relative bg-slate-950">
                    {/* Grid pattern */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

                    <div className="relative z-10 w-full h-full">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

