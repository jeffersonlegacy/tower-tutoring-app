import React, { useState } from 'react';
import Connect4 from './Connect4';

export default function BrainBreak({ sessionId, onClose }) {
    const [game, setGame] = useState('menu'); // 'menu' | 'connect4' | 'airhockey'

    return (
        <div className="w-full h-full bg-slate-900 border-t border-slate-700 flex flex-col relative overflow-hidden">

            {/* Header */}
            <div className="p-2 border-b border-white/5 flex items-center justify-between bg-slate-800/50 sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                        <span className="text-white text-sm">🕹️</span>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white tracking-wide">ARCADE</h2>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                        title="Close Arcade"
                    >
                        ×
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-2 bg-logo-pattern">

                {game === 'menu' && (
                    <div className="grid grid-cols-1 gap-2">
                        <button
                            onClick={() => setGame('connect4')}
                            className="group relative h-24 rounded-xl overflow-hidden border border-white/10 hover:border-pink-500/50 transition-all bg-slate-800 hover:bg-slate-800/80 w-full"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute inset-0 flex flex-row items-center justify-start px-4 gap-4">
                                <div className="text-2xl group-hover:scale-110 transition-transform duration-300">🔴</div>
                                <div className="flex flex-col items-start gap-1">
                                    <div className="font-bold text-slate-200 group-hover:text-pink-400 text-sm">NEON CONNECT</div>
                                    <div className="text-[10px] text-slate-500">Classic 4-in-a-row</div>
                                </div>
                            </div>
                        </button>

                        <button
                            className="group relative h-24 rounded-xl overflow-hidden border border-white/10 transition-all bg-slate-800 opacity-50 cursor-not-allowed w-full"
                        >
                            <div className="absolute inset-0 flex flex-row items-center justify-start px-4 gap-4">
                                <div className="text-2xl grayscale">🏒</div>
                                <div className="flex flex-col items-start gap-1">
                                    <div className="font-bold text-slate-500 text-sm">AIR HOCKEY</div>
                                    <div className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">LOCKED</div>
                                </div>
                            </div>
                        </button>
                    </div>
                )}

                {game === 'connect4' && (
                    <div className="animate-slide-up h-full flex flex-col">
                        <button
                            onClick={() => setGame('menu')}
                            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 mb-2 px-2 shrink-0"
                        >
                            ← Back to Menu
                        </button>
                        <div className="flex-1 overflow-y-auto min-h-0 bg-slate-950/50 rounded-xl border border-white/5">
                            <Connect4 sessionId={sessionId} />
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
