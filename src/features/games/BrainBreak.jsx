import React, { useState } from 'react';
import Connect4 from './Connect4';
import MathSprint from './MathSprint';

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

            {/* Content Container with Background Pattern */}
            <div className="flex-1 overflow-y-auto bg-logo-pattern">
                <div className="relative z-10 p-2 min-h-full">
                    {game === 'menu' && (
                        <div className="grid grid-cols-1 gap-3 p-2">
                            {/* Connect 4 */}
                            <button
                                onClick={() => setGame('connect4')}
                                className="group relative h-20 rounded-xl overflow-hidden border-2 border-white/20 hover:border-pink-400 transition-all bg-slate-800 shadow-lg hover:shadow-pink-500/20"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute inset-0 flex flex-row items-center justify-start px-4 gap-4">
                                    <div className="text-3xl filter drop-shadow-[0_0_8px_rgba(236,72,153,0.8)] group-hover:scale-110 transition-transform duration-300">🔴</div>
                                    <div className="flex flex-col items-start">
                                        <div className="font-black text-white text-base tracking-tighter drop-shadow-md group-hover:text-pink-300 transition-colors uppercase">NEON CONNECT</div>
                                        <div className="text-[10px] font-medium text-slate-300 bg-black/40 px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-widest">4-In-A-Row</div>
                                    </div>
                                </div>
                            </button>

                            {/* Math Sprint */}
                            <button
                                onClick={() => setGame('mathsprint')}
                                className="group relative h-20 rounded-xl overflow-hidden border-2 border-white/20 hover:border-cyan-400 transition-all bg-slate-800 shadow-lg hover:shadow-cyan-500/20"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute inset-0 flex flex-row items-center justify-start px-4 gap-4">
                                    <div className="text-3xl filter drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] group-hover:scale-110 transition-transform duration-300">⚡</div>
                                    <div className="flex flex-col items-start">
                                        <div className="font-black text-white text-base tracking-tighter drop-shadow-md group-hover:text-cyan-300 transition-colors uppercase">MATH SPRINT</div>
                                        <div className="text-[10px] font-medium text-slate-300 bg-black/40 px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-widest">Rapid Fire</div>
                                    </div>
                                </div>
                            </button>

                            {/* Air Hockey (Locked) */}
                            <button
                                className="group relative h-20 rounded-xl overflow-hidden border-2 border-white/5 transition-all bg-slate-900/50 opacity-40 cursor-not-allowed w-full"
                            >
                                <div className="absolute inset-0 flex flex-row items-center justify-start px-4 gap-4">
                                    <div className="text-3xl grayscale opacity-50">🏒</div>
                                    <div className="flex flex-col items-start leading-tight">
                                        <div className="font-bold text-slate-400 text-sm uppercase tracking-wider">AIR HOCKEY</div>
                                        <div className="text-[8px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-600 font-mono">ENCRYPTED // LOCKED</div>
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

                    {game === 'mathsprint' && (
                        <div className="animate-slide-up h-full">
                            <MathSprint sessionId={sessionId} onBack={() => setGame('menu')} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
