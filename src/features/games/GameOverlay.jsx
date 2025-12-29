import React from 'react';

export default function GameOverlay({ children, title, onClose }) {
    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
            <div className="w-full max-w-5xl h-full max-h-[90vh] bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">

                {/* Header */}
                <div className="h-16 shrink-0 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🕹️</span>
                        <h2 className="text-xl font-black text-white tracking-wide uppercase italic">{title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-slate-700 hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center transition-all"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Game Container */}
                <div className="flex-1 overflow-hidden relative bg-slate-950">
                    {children}
                </div>
            </div>
        </div>
    );
}
