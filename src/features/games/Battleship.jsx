import React, { useState, useEffect } from 'react';

const GRID_SIZE = 8;

export default function Battleship({ onBack }) {
    // 0: Empty, 1: Ship, 2: Miss, 3: Hit
    const [grid, setGrid] = useState(Array(GRID_SIZE * GRID_SIZE).fill(0));
    const [gameState, setGameState] = useState('playing'); // playing, won, lost
    const [score, setScore] = useState(0);
    const [shots, setShots] = useState(0);

    // Initialize Ships (Simple Logic: Randomly place 5 ships of size 1 for now to keep it lightweight)
    useEffect(() => {
        const newGrid = Array(GRID_SIZE * GRID_SIZE).fill(0);
        let shipsPlaced = 0;
        while (shipsPlaced < 5) {
            const idx = Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE));
            if (newGrid[idx] === 0) {
                newGrid[idx] = 1;
                shipsPlaced++;
            }
        }
        setGrid(newGrid);
    }, []);

    const handleCellClick = (index) => {
        if (gameState !== 'playing' || grid[index] >= 2) return;

        const newGrid = [...grid];
        let hit = false;

        if (newGrid[index] === 1) {
            newGrid[index] = 3; // Hit
            hit = true;
            setScore(s => s + 100);
        } else {
            newGrid[index] = 2; // Miss
        }

        setGrid(newGrid);
        setShots(s => s + 1);

        // Check Win
        const remainingShips = newGrid.filter(c => c === 1).length;
        if (remainingShips === 0) {
            setGameState('won');
        } else if (shots >= 15) { // Hard limit for pressure
             setGameState('lost');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans p-4 flex flex-col items-center">
            <div className="w-full max-w-2xl">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={onBack} className="text-cyan-400 hover:text-white">← Exit Arcade</button>
                    <div className="text-xl font-bold text-center">
                        <span className="text-cyan-400">COORDINATE</span> DEFENSE
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-slate-500">SCORE</div>
                        <div className="font-mono text-xl">{score}</div>
                    </div>
                </div>

                <div className="relative bg-slate-800 rounded-xl p-4 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                    
                    {/* Grid Overlay for Coordinate Lines */}
                    <div className="absolute inset-4 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]"></div>

                    <div className="grid grid-cols-8 gap-1 relative z-10">
                        {grid.map((cell, i) => {
                            // Coordinate Labels logic could go here
                            const getCellContent = () => {
                                if (cell === 3) return '💥';
                                if (cell === 2) return '•';
                                return '';
                            };
                            
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleCellClick(i)}
                                    className={`aspect-square rounded-md border flex items-center justify-center text-2xl transition-all
                                        ${cell === 0 || cell === 1 ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 hover:border-cyan-500/50' : ''}
                                        ${cell === 2 ? 'bg-slate-800 border-slate-700 text-slate-500' : ''}
                                        ${cell === 3 ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[inset_0_0_10px_rgba(239,68,68,0.5)]' : ''}
                                    `}
                                >
                                    {getCellContent()}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-6 flex justify-between items-center bg-slate-800/50 p-4 rounded-xl border border-white/5">
                    <div>
                        <span className="text-xs text-slate-400 uppercase tracking-widest">Shots Left</span>
                        <div className="text-2xl font-black text-cyan-400">{Math.max(0, 15 - shots)}</div>
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 uppercase tracking-widest leading-none block text-right">Target</span>
                        <div className="text-xs text-slate-500 text-right mt-1">Find all hidden vessels</div>
                    </div>
                </div>

                {gameState !== 'playing' && (
                     <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                        <div className="bg-slate-900 border border-cyan-500 p-8 rounded-2xl text-center max-w-sm w-full shadow-2xl">
                            <div className="text-6xl mb-4">{gameState === 'won' ? '🏆' : '💀'}</div>
                            <h2 className="text-3xl font-black text-white mb-2 uppercase">{gameState === 'won' ? 'Victory' : 'Defeat'}</h2>
                            <p className="text-slate-400 mb-6">
                                {gameState === 'won' ? `Coordinate mastery achieved. Score: ${score}` : 'Systems overwhelmed. Try again.'}
                            </p>
                            <div className="flex flex-col gap-3">
                                <button onClick={() => {
                                    setGrid(Array(GRID_SIZE * GRID_SIZE).fill(0));
                                    setScore(0);
                                    setShots(0);
                                    setGameState('playing');
                                    // Re-init ships
                                    const newGrid = Array(GRID_SIZE * GRID_SIZE).fill(0);
                                    let shipsPlaced = 0;
                                    while (shipsPlaced < 5) {
                                        const idx = Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE));
                                        if (newGrid[idx] === 0) {
                                            newGrid[idx] = 1;
                                            shipsPlaced++;
                                        }
                                    }
                                    setGrid(newGrid);
                                }} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl uppercase tracking-widest">
                                    Replay Mission
                                </button>
                                <button onClick={onBack} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl uppercase tracking-widest">
                                    Return to Base
                                </button>
                            </div>
                        </div>
                     </div>
                )}
            </div>
        </div>
    );
}
