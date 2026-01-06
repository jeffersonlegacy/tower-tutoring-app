import React, { useState, Suspense, lazy } from 'react';
import { createPortal } from 'react-dom';
import GameOverlay from './GameOverlay';
import GameErrorBoundary from './GameErrorBoundary';

// Lazy load games for code splitting
const Connect4 = lazy(() => import('./Connect4'));
const SwipeFight = lazy(() => import('./SwipeFight'));
const Battleship = lazy(() => import('./Battleship'));
const EquationExplorer = lazy(() => import('./EquationExplorer'));

const GameLoader = () => (
    <div className="flex items-center justify-center h-full bg-slate-900">
        <div className="text-center">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-cyan-400 font-mono text-sm">Loading game...</p>
        </div>
    </div>
);

export default function BrainBreak({ sessionId, onClose }) {
    const [game, setGame] = useState('menu');

    const closeGame = () => setGame('menu');

    return (
        <div className="w-full h-full bg-slate-900 border-t border-slate-700 flex flex-col relative overflow-hidden">

            {/* Header */}
            <div className="p-2 border-b border-white/5 flex items-center justify-between bg-slate-800/50 sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                        <span className="text-white text-sm">🕹️</span>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white tracking-wide">BRAIN BREAK</h2>
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

            {/* Content Container (Menu) */}
            <div className="flex-1 overflow-y-auto bg-logo-pattern">
                <div className="relative z-10 p-2 min-h-full">
                    <div className="grid grid-cols-1 gap-3 p-2">

                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 italic tracking-tighter filter drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                                    BRAIN BREAK
                                </h1>
                                <p className="text-cyan-500 font-mono text-xs tracking-[0.3em] font-bold uppercase mt-1 animate-pulse">
                                    Tower Gaming Lab
                                </p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        {/* GAME: Equation Explorer (Educational Math) */}
                        <button
                            onClick={() => setGame('offsetoperator')}
                            className="group relative h-24 rounded-xl overflow-hidden border-2 border-white/20 hover:border-cyan-500 transition-all bg-slate-900 shadow-xl"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-black opacity-80 group-hover:opacity-60 transition-opacity"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-transparent"></div>

                            <div className="absolute inset-0 flex flex-row items-center justify-start px-4 gap-4 z-10">
                                <div className="p-3 bg-black/50 rounded-lg border border-purple-500/50 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                                    <span className="text-3xl">🏰</span>
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 text-xl uppercase tracking-tighter filter drop-shadow">EQUATION EXPLORER</span>
                                    <span className="text-[10px] font-bold text-white/80 bg-purple-600/50 px-2 py-0.5 rounded-full border border-purple-400/30">LEARN MATH</span>
                                </div>
                            </div>
                        </button>

                        {/* GAME: Battleship */}
                        <button
                            onClick={() => setGame('battleship')}
                            className="group relative h-24 rounded-xl overflow-hidden border-2 border-white/20 hover:border-cyan-500 transition-all bg-slate-900 shadow-xl"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-900 via-slate-900 to-black opacity-80 group-hover:opacity-60 transition-opacity"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-transparent"></div>

                            <div className="absolute inset-0 flex flex-row items-center justify-start px-4 gap-4 z-10">
                                <div className="p-3 bg-black/50 rounded-lg border border-cyan-500/50 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                                    <span className="text-3xl">🚢</span>
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 text-xl uppercase tracking-tighter filter drop-shadow">BATTLESHIP</span>
                                    <span className="text-[10px] font-bold text-white/80 bg-cyan-600/50 px-2 py-0.5 rounded-full border border-cyan-400/30">NAVAL STRATEGY</span>
                                </div>
                            </div>
                        </button>

                        {/* GAME: Swipe Fight */}
                        <button
                            onClick={() => setGame('swipefight')}
                            className="group relative h-24 rounded-xl overflow-hidden border-2 border-white/20 hover:border-teal-500 transition-all bg-slate-900 shadow-xl"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-slate-900 to-black opacity-80 group-hover:opacity-60 transition-opacity"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-transparent"></div>

                            <div className="absolute inset-0 flex flex-row items-center justify-start px-4 gap-4 z-10">
                                <div className="p-3 bg-black/50 rounded-lg border border-teal-500/50 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(45,212,191,0.5)]">
                                    <span className="text-3xl">⚡</span>
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 text-xl uppercase tracking-tighter filter drop-shadow">SWIPE FIGHT</span>
                                    <span className="text-[10px] font-bold text-white/80 bg-teal-600/50 px-2 py-0.5 rounded-full border border-teal-400/30">SPEED MATH</span>
                                </div>
                            </div>
                        </button>

                        {/* GAME: Neon Connect (Connect 4) */}
                        <button
                            onClick={() => setGame('connect4')}
                            className="group relative h-24 rounded-xl overflow-hidden border-2 border-white/20 hover:border-pink-500 transition-all bg-slate-900 shadow-xl"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-900 via-slate-900 to-black opacity-80 group-hover:opacity-60 transition-opacity"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-transparent"></div>

                            <div className="absolute inset-0 flex flex-row items-center justify-start px-4 gap-4 z-10">
                                <div className="p-3 bg-black/50 rounded-lg border border-pink-500/50 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(236,72,153,0.5)]">
                                    <span className="text-3xl">🔴</span>
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-red-400 text-xl uppercase tracking-tighter filter drop-shadow">NEON CONNECT</span>
                                    <span className="text-[10px] font-bold text-white/80 bg-pink-600/50 px-2 py-0.5 rounded-full border border-pink-400/30">4-IN-A-ROW</span>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* OVERLAY PORTAL */}
            {game !== 'menu' && createPortal(
                <GameOverlay
                    title={
                        game === 'connect4' ? 'Neon Connect' :
                            game === 'swipefight' ? 'Swipe Fight' :
                                game === 'battleship' ? 'Naval Command' :
                                    game === 'offsetoperator' ? 'Equation Explorer' :
                                        'Arcade'
                    }
                    onClose={closeGame}
                >
                    <Suspense fallback={<GameLoader />}>
                        {game === 'connect4' && <GameErrorBoundary onBack={closeGame}><Connect4 sessionId={sessionId} onBack={closeGame} /></GameErrorBoundary>}
                        {game === 'swipefight' && <GameErrorBoundary onBack={closeGame}><SwipeFight sessionId={sessionId} onBack={closeGame} /></GameErrorBoundary>}
                        {game === 'battleship' && <GameErrorBoundary onBack={closeGame}><Battleship sessionId={sessionId} onBack={closeGame} /></GameErrorBoundary>}
                        {game === 'offsetoperator' && <GameErrorBoundary onBack={closeGame}><EquationExplorer onBack={closeGame} /></GameErrorBoundary>}
                    </Suspense>
                </GameOverlay>,
                document.body
            )}
        </div>
    );
}
