import React, { useState } from 'react';
import Connect4 from './Connect4';

export default function BrainBreak({ sessionId, onClose }) {
    const [game, setGame] = useState('menu'); // 'menu' | 'connect4' | 'airhockey'

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-2xl bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                            <span className="text-white text-xl">🕹️</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-wide">BRAIN BREAK</h2>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Neural Decompression Protocol</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-logo-pattern">

                    {game === 'menu' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => setGame('connect4')}
                                className="group relative h-40 rounded-xl overflow-hidden border border-white/10 hover:border-pink-500/50 transition-all bg-slate-800 hover:bg-slate-800/80"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                    <div className="text-4xl group-hover:scale-110 transition-transform duration-300">🔴</div>
                                    <div className="font-bold text-slate-200 group-hover:text-pink-400">NEON CONNECT</div>
                                </div>
                            </button>

                            <button
                                className="group relative h-40 rounded-xl overflow-hidden border border-white/10 transition-all bg-slate-800 opacity-50 cursor-not-allowed"
                            >
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                    <div className="text-4xl grayscale">🏒</div>
                                    <div className="font-bold text-slate-500">AIR HOCKEY</div>
                                    <div className="text-[10px] bg-slate-900 px-2 py-1 rounded border border-slate-700">LOCKED</div>
                                </div>
                            </button>
                        </div>
                    )}

                    {game === 'connect4' && (
                        <div className="animate-slide-up">
                            <div className="flex items-center gap-2 mb-4">
                                <button
                                    onClick={() => setGame('menu')}
                                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                                >
                                    ← Back to Arcade
                                </button>
                            </div>
                            <Connect4 sessionId={sessionId} />
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
