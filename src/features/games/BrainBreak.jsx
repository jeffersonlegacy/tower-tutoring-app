import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Connect4 from './Connect4';
import MathSprint from './MathSprint';
import AirHockey from './AirHockey';
import SwipeFight from './SwipeFight';
import Yahtzee from './Yahtzee';
import Battleship from './Battleship';
import MathInvaders from './MathInvaders';
import GameOverlay from './GameOverlay';
import GlobalLeaderboard from './GlobalLeaderboard';

export default function BrainBreak({ sessionId, onClose }) {
    const [game, setGame] = useState('menu'); // 'menu' | ... games

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

                        {/* Leaderboard Button */}
                        <button
                            onClick={() => setGame('leaderboard')}
                            className="bg-slate-800 border border-slate-700 p-3 rounded-xl flex items-center gap-3 hover:bg-slate-700 transition-colors shadow-sm group"
                        >
                            <span className="text-2xl group-hover:scale-110 transition-transform">🏆</span>
                            <div className="flex flex-col items-start">
                                <span className="font-bold text-white text-sm uppercase tracking-wide">Leaderboard</span>
                                <span className="text-[10px] text-slate-400">View Session Stats</span>
                            </div>
                        </button>

                        <div className="w-full h-px bg-slate-700/50 my-1"></div>

                        {/* GAME: Math Invaders (FEATURED) */}
                        <button
                            onClick={() => setGame('mathinvaders')}
                            className="group relative h-24 rounded-xl overflow-hidden border-2 border-white/20 hover:border-purple-500 transition-all bg-slate-900 shadow-xl"
                        >
                            {/* <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/26tn33aiTi1jbp6xm/giphy.gif')] bg-cover opacity-20 group-hover:opacity-40 transition-opacity mix-blend-screen"></div> */}
                            {/* Using gradient instead of external GIF for reliability */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-slate-900 to-black opacity-80 group-hover:opacity-60 transition-opacity"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-transparent"></div>

                            <div className="absolute inset-0 flex flex-row items-center justify-start px-4 gap-4 z-10">
                                <div className="p-3 bg-black/50 rounded-lg border border-purple-500/50 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                                    <span className="text-3xl">👾</span>
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 text-xl uppercase tracking-tighter filter drop-shadow">MATH INVADERS</span>
                                    <span className="text-[10px] font-bold text-white/80 bg-purple-600/50 px-2 py-0.5 rounded-full border border-purple-400/30">NEON ARCADE</span>
                                </div>
                            </div>
                        </button>

                        {/* GAME: Battleship */}
                        <button
                            onClick={() => setGame('battleship')}
                            className="group relative h-24 rounded-xl overflow-hidden border-2 border-white/20 hover:border-blue-500 transition-all bg-slate-900 shadow-xl"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-900 to-black opacity-80 group-hover:opacity-60 transition-opacity"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent"></div>

                            <div className="absolute inset-0 flex flex-row items-center justify-start px-4 gap-4 z-10">
                                <div className="p-3 bg-black/50 rounded-lg border border-blue-500/50 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                                    <span className="text-3xl">🚢</span>
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 text-xl uppercase tracking-tighter filter drop-shadow">BATTLESHIP</span>
                                    <span className="text-[10px] font-bold text-white/80 bg-blue-600/50 px-2 py-0.5 rounded-full border border-blue-400/30">NAVAL STRATEGY</span>
                                </div>
                            </div>
                        </button>

                        {/* GAME: Swipe Fight */}
                        <button
                            onClick={() => setGame('swipefight')}
                            className="group relative h-24 rounded-xl overflow-hidden border-2 border-white/20 hover:border-cyan-500 transition-all bg-slate-900 shadow-xl"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-900 via-slate-900 to-black opacity-80 group-hover:opacity-60 transition-opacity"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-transparent"></div>

                            <div className="absolute inset-0 flex flex-row items-center justify-start px-4 gap-4 z-10">
                                <div className="p-3 bg-black/50 rounded-lg border border-cyan-500/50 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                                    <span className="text-3xl">⚡</span>
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 text-xl uppercase tracking-tighter filter drop-shadow">SWIPE FIGHT</span>
                                    <span className="text-[10px] font-bold text-white/80 bg-cyan-600/50 px-2 py-0.5 rounded-full border border-cyan-400/30">SPEED MATH</span>
                                </div>
                            </div>
                        </button>

                        {/* GAME: Yahtzee */}
                        <button
                            onClick={() => setGame('yahtzee')}
                            className="group relative h-24 rounded-xl overflow-hidden border-2 border-white/20 hover:border-yellow-500 transition-all bg-slate-900 shadow-xl"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-slate-900 to-black opacity-80 group-hover:opacity-60 transition-opacity"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/20 to-transparent"></div>

                            <div className="absolute inset-0 flex flex-row items-center justify-start px-4 gap-4 z-10">
                                <div className="p-3 bg-black/50 rounded-lg border border-yellow-500/50 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                                    <span className="text-3xl">🎲</span>
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-yellow-400 text-xl uppercase tracking-tighter filter drop-shadow">YAHTZEE</span>
                                    <span className="text-[10px] font-bold text-white/80 bg-purple-600/50 px-2 py-0.5 rounded-full border border-purple-400/30">CLASSIC DICE</span>
                                </div>
                            </div>
                        </button>

                        {/* GAME: Air Hockey */}
                        <button
                            onClick={() => setGame('airhockey')}
                            className="group relative h-24 rounded-xl overflow-hidden border-2 border-white/20 hover:border-emerald-500 transition-all bg-slate-900 shadow-xl"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-slate-900 to-black opacity-80 group-hover:opacity-60 transition-opacity"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-transparent"></div>

                            <div className="absolute inset-0 flex flex-row items-center justify-start px-4 gap-4 z-10">
                                <div className="p-3 bg-black/50 rounded-lg border border-emerald-500/50 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(52,211,153,0.5)]">
                                    <span className="text-3xl">🏒</span>
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 text-xl uppercase tracking-tighter filter drop-shadow">AIR HOCKEY</span>
                                    <span className="text-[10px] font-bold text-white/80 bg-emerald-600/50 px-2 py-0.5 rounded-full border border-emerald-400/30">PHYSICS ARENA</span>
                                </div>
                            </div>
                        </button>

                        {/* GAME: Connect 4 */}
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

            {/* OVERLAY PORTAL - Renders outside the sidebar */}
            {game !== 'menu' && createPortal(
                <GameOverlay
                    title={
                        game === 'leaderboard' ? 'Session Stats' :
                            game === 'connect4' ? 'Neon Connect 4' :
                                game === 'swipefight' ? 'Swipe Fight' :
                                    game === 'airhockey' ? 'Air Hockey Rush' :
                                        game === 'yahtzee' ? 'Yahtzee' :
                                            game === 'battleship' ? 'Naval Command' :
                                                game === 'mathinvaders' ? 'Math Invaders' :
                                                    'Arcade'
                    }
                    onClose={closeGame}
                >
                    {game === 'leaderboard' && <GlobalLeaderboard sessionId={sessionId} />}
                    {game === 'connect4' && <Connect4 sessionId={sessionId} onBack={closeGame} />}
                    {game === 'mathsprint' && <MathSprint sessionId={sessionId} onBack={closeGame} />}
                    {game === 'airhockey' && <AirHockey sessionId={sessionId} onBack={closeGame} />}
                    {game === 'swipefight' && <SwipeFight sessionId={sessionId} onBack={closeGame} />}
                    {game === 'yahtzee' && <Yahtzee sessionId={sessionId} onBack={closeGame} />}
                    {game === 'battleship' && <Battleship sessionId={sessionId} onBack={closeGame} />}
                    {game === 'mathinvaders' && <MathInvaders sessionId={sessionId} onBack={closeGame} />}
                </GameOverlay>,
                document.body
            )}
        </div>
    );
}
