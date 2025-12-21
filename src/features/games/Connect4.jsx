import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

const ROWS = 6;
const COLS = 7;

/**
 * CONNECT 4 - SEAMLESS EDITION
 * "Open Play" logic: No seats, no waiting. Anyone can drop a piece.
 * Synced via Firestore to the active Session ID.
 */
export default function Connect4({ sessionId }) {
    // State
    const [board, setBoard] = useState(Array(ROWS * COLS).fill(null));
    const [turn, setTurn] = useState('red');
    const [winner, setWinner] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // SFX
    const dropSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3'));
    const winSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3'));

    // DB Path: unique per session, v6 to ensure clean state
    const GAME_ID = 'connect4_v6_seamless';

    useEffect(() => {
        if (!sessionId) return;

        // Subscribe to the shared game state
        const gameDoc = doc(db, 'whiteboards', sessionId, 'games', GAME_ID);
        const unsubscribe = onSnapshot(gameDoc, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                if (data.board && Array.isArray(data.board)) {
                    setBoard(data.board);
                    setTurn(data.turn);
                    setWinner(data.winner);

                    // Play sound if a move just happened
                    if (data.lastMoveTime && Date.now() - data.lastMoveTime < 1000) {
                        dropSound.current.play().catch(() => { });
                    }
                    if (data.winner && !winner) { // Play win sound only once
                        winSound.current.play().catch(() => { });
                    }
                }
            } else {
                // If no game exists, create one silently
                resetGame();
            }
        });

        return () => unsubscribe();
    }, [sessionId]); // Removed 'winner' to fix lint, logic handled inside effect

    const resetGame = async () => {
        try {
            await setDoc(doc(db, 'whiteboards', sessionId, 'games', GAME_ID), {
                board: Array(ROWS * COLS).fill(null),
                turn: 'red',
                winner: null,
                lastMoveTime: Date.now()
            });
        } catch (e) {
            console.warn("Reset failed", e);
        }
    };

    const checkWin = (b, idx, player) => {
        const r = Math.floor(idx / COLS);
        const c = idx % COLS;
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

        for (const [dr, dc] of directions) {
            let count = 1;
            for (let i = 1; i < 4; i++) {
                const nr = r + dr * i;
                const nc = c + dc * i;
                if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || b[nr * COLS + nc] !== player) break;
                count++;
            }
            for (let i = 1; i < 4; i++) {
                const nr = r - dr * i;
                const nc = c - dc * i;
                if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || b[nr * COLS + nc] !== player) break;
                count++;
            }
            if (count >= 4) return true;
        }
        return false;
    };

    const handleDrop = async (colIndex) => {
        // Validation: Game over or currently processing a network request
        if (winner || isProcessing) return;

        setIsProcessing(true);
        const gameDocRef = doc(db, 'whiteboards', sessionId, 'games', GAME_ID);

        try {
            // 1. Calculate the move locally first
            let targetIdx = -1;
            const currentBoard = [...board];

            // Find lowest empty slot in column
            for (let r = ROWS - 1; r >= 0; r--) {
                const idx = r * COLS + colIndex;
                if (!currentBoard[idx]) {
                    targetIdx = idx;
                    break;
                }
            }

            if (targetIdx === -1) {
                setIsProcessing(false);
                return; // Column full
            }

            // 2. Apply move
            currentBoard[targetIdx] = turn;
            const nextTurn = turn === 'red' ? 'yellow' : 'red';

            // 3. Check Win
            let newWinner = null;
            if (checkWin(currentBoard, targetIdx, turn)) {
                newWinner = turn;
            } else if (currentBoard.filter(Boolean).length === 42) {
                newWinner = 'draw';
            }

            // 4. Atomic Update to Firestore
            // This is "Open Play" - we don't check whose turn it is strictly via auth.
            // Whoever clicks first gets the move.
            await updateDoc(gameDocRef, {
                board: currentBoard,
                turn: nextTurn,
                winner: newWinner,
                lastMoveTime: Date.now()
            });

        } catch (e) {
            console.error("Move failed:", e);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-2 p-2 select-none overflow-hidden h-full font-mono w-full max-w-sm mx-auto">

            {/* Status Header */}
            <div className="flex justify-between items-center w-full px-4 text-[10px] font-bold text-slate-400">
                <span>STATUS: {winner ? 'GAME OVER' : 'LIVE'}</span>
                <span>TURN: <span className={turn === 'red' ? 'text-pink-500' : 'text-yellow-400'}>{turn.toUpperCase()}</span></span>
            </div>

            {/* Turn Indicator */}
            <div className="flex items-center gap-4 bg-black/40 px-5 py-1.5 rounded-full border border-white/5 shadow-lg">
                <div className={`w-4 h-4 rounded-full bg-pink-500 transition-all duration-300 ${turn === 'red' ? 'scale-125 shadow-[0_0_10px_#ec4899] ring-2 ring-white/20' : 'opacity-20 blur-[1px]'}`} />
                <div className="w-px h-3 bg-white/10" />
                <div className={`w-4 h-4 rounded-full bg-yellow-400 transition-all duration-300 ${turn === 'yellow' ? 'scale-125 shadow-[0_0_10px_#facc15] ring-2 ring-white/20' : 'opacity-20 blur-[1px]'}`} />
            </div>

            {/* Drop Inputs */}
            <div className="grid grid-cols-7 gap-1 px-1 w-full max-w-[280px]">
                {[0, 1, 2, 3, 4, 5, 6].map(c => (
                    <button
                        key={c}
                        onClick={() => handleDrop(c)}
                        disabled={!!winner}
                        className={`w-full h-8 flex items-center justify-center rounded-t-lg transition-all ${!winner ? 'bg-blue-500/10 hover:bg-blue-500/50 text-blue-300 hover:text-white cursor-pointer' : 'opacity-0'}`}
                    >
                        <span className="text-[10px] opacity-50">▼</span>
                    </button>
                ))}
            </div>

            {/* The Grid */}
            <div className="bg-blue-700 p-2.5 rounded-xl shadow-2xl border-t-2 border-blue-400 w-full max-w-[280px] min-h-[240px] relative">
                <div className="grid grid-cols-7 gap-1.5">
                    {board.map((cell, i) => (
                        <div
                            key={i}
                            onClick={() => handleDrop(i % COLS)}
                            className={`aspect-square rounded-full border border-blue-800 flex items-center justify-center bg-slate-950/90 overflow-hidden relative shadow-inner ${!cell && !winner ? 'cursor-pointer hover:bg-white/5' : ''}`}
                        >
                            {cell && (
                                <div className={`w-[85%] h-[85%] rounded-full shadow-lg ${cell === 'red'
                                    ? 'bg-gradient-to-br from-pink-400 to-pink-600 shadow-[0_0_8px_#ec4899]'
                                    : 'bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-[0_0_8px_#facc15]'
                                    } animate-in zoom-in duration-200`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <button onClick={resetGame} className="mt-2 text-[8px] font-black text-slate-600 hover:text-white uppercase transition-colors">
                {winner ? 'NEW GAME' : 'RESET BOARD'}
            </button>

            {/* Winner Overlay */}
            {winner && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 p-4">
                    <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl flex flex-col items-center gap-4 shadow-2xl w-full max-w-[240px]">
                        <h2 className={`text-2xl font-black italic tracking-tighter ${winner === 'red' ? 'text-pink-500' : winner === 'yellow' ? 'text-yellow-400' : 'text-slate-400'}`}>
                            {winner === 'draw' ? 'STALEMATE' : `${winner.toUpperCase()} WINS`}
                        </h2>
                        <button onClick={resetGame} className="w-full py-3 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-400 hover:text-white transition-all transform hover:scale-105">PLAY AGAIN</button>
                    </div>
                </div>
            )}
        </div>
    );
}
