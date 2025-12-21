import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

const ROWS = 6;
const COLS = 7;

/**
 * CONNECT 4 v4.2 - RESILIENT RENDER
 * Fixed corrupted state issues and improved visibility.
 */
export default function Connect4({ sessionId }) {
    // Initialize with a valid empty board to prevent flash of null
    const [board, setBoard] = useState(Array(ROWS * COLS).fill(null));
    const [turn, setTurn] = useState('red');
    const [winner, setWinner] = useState(null);
    const [localPlayerRole, setLocalPlayerRole] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);

    const dropSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3'));
    const winSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3'));

    // DB Versioning to purge bad data
    const GAME_ID = 'connect4_v5';

    useEffect(() => {
        if (!sessionId) return;

        try {
            const gameDoc = doc(db, 'whiteboards', sessionId, 'games', GAME_ID);

            const unsubscribe = onSnapshot(gameDoc, (snap) => {
                if (snap.exists()) {
                    const data = snap.data();

                    // Defensive: Ensure board is actually an array of correct length
                    if (Array.isArray(data.board) && data.board.length === ROWS * COLS) {
                        setBoard(data.board);
                        setTurn(data.turn);
                        setWinner(data.winner);

                        // SFX
                        if (data.moveCount > 0 && Math.abs(Date.now() - (data.lastUpdated || 0)) < 2000) {
                            dropSound.current.play().catch(() => { });
                        }
                    } else {
                        console.warn("[C4] Corrupt board detected, auto-fixing...");
                        initGame();
                    }
                } else {
                    initGame();
                }
            }, (err) => {
                console.error("Snapshot error:", err);
                setError("Sync Error");
            });

            return () => unsubscribe();
        } catch (err) {
            console.error("Setup error:", err);
            setError("Setup Failed");
        }
    }, [sessionId]);

    const initGame = async () => {
        try {
            await setDoc(doc(db, 'whiteboards', sessionId, 'games', GAME_ID), {
                board: Array(ROWS * COLS).fill(null),
                turn: 'red',
                winner: null,
                moveCount: 0,
                lastUpdated: Date.now()
            });
        } catch (e) {
            console.error("Init failed:", e);
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
        if (winner || isProcessing || (localPlayerRole && turn !== localPlayerRole)) return;

        setIsProcessing(true);
        const gameDocRef = doc(db, 'whiteboards', sessionId, 'games', GAME_ID);

        try {
            let targetIdx = -1;
            // Find lowest empty slot
            for (let r = ROWS - 1; r >= 0; r--) {
                const idx = r * COLS + colIndex;
                if (!board[idx]) {
                    targetIdx = idx;
                    break;
                }
            }

            if (targetIdx === -1) {
                setIsProcessing(false);
                return;
            }

            const newBoard = [...board];
            newBoard[targetIdx] = turn;
            const nextTurn = turn === 'red' ? 'yellow' : 'red';
            const moveCount = (newBoard.filter(Boolean).length);

            let newWinner = null;
            if (checkWin(newBoard, targetIdx, turn)) {
                newWinner = turn;
                winSound.current.play().catch(() => { });
            } else if (moveCount >= ROWS * COLS) {
                newWinner = 'draw';
            }

            await updateDoc(gameDocRef, {
                board: newBoard,
                turn: nextTurn,
                winner: newWinner,
                moveCount: moveCount,
                lastUpdated: Date.now()
            });

        } catch (e) {
            console.error("[C4] Drop Failed:", e);
            alert("Connection error - move not saved.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (error) return <div className="p-4 text-red-500 font-bold bg-slate-900 rounded-xl">Error: {error}</div>;

    return (
        <div className="flex flex-col items-center gap-2 p-2 select-none overflow-hidden h-full font-mono w-full max-w-sm mx-auto">

            {/* Player Selection */}
            {!localPlayerRole && !winner && (
                <div className="bg-slate-800/90 border border-white/10 p-3 rounded-xl flex flex-col items-center gap-2 animate-in zoom-in w-full shadow-2xl z-10">
                    <span className="text-[10px] font-black text-cyan-400">CLAIM STATION</span>
                    <div className="flex gap-2 w-full">
                        <button onClick={() => setLocalPlayerRole('red')} className="flex-1 py-2 bg-pink-600 hover:bg-pink-500 text-white text-[10px] font-black rounded-lg transition-colors">RED</button>
                        <button onClick={() => setLocalPlayerRole('yellow')} className="flex-1 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-900 text-[10px] font-black rounded-lg transition-colors">YEL</button>
                    </div>
                </div>
            )}

            {localPlayerRole && (
                <div className={`px-4 py-1 rounded-full text-[9px] font-black border tracking-widest ${localPlayerRole === 'red' ? 'text-pink-500 border-pink-500/20' : 'text-yellow-400 border-yellow-400/20'}`}>
                    UNIT: {localPlayerRole.toUpperCase()} {turn === localPlayerRole && !winner ? '🛰️' : '⌛'}
                </div>
            )}

            {/* Turn HUD */}
            <div className="flex items-center gap-4 bg-black/40 px-5 py-1.5 rounded-full border border-white/5 shadow-lg">
                <div className={`w-4 h-4 rounded-full bg-pink-500 transition-all duration-300 ${turn === 'red' ? 'scale-125 shadow-[0_0_10px_#ec4899] ring-2 ring-white/20' : 'opacity-20 blur-[1px]'}`} />
                <div className="w-px h-3 bg-white/10" />
                <div className={`w-4 h-4 rounded-full bg-yellow-400 transition-all duration-300 ${turn === 'yellow' ? 'scale-125 shadow-[0_0_10px_#facc15] ring-2 ring-white/20' : 'opacity-20 blur-[1px]'}`} />
            </div>

            {/* Explicit Drop Inputs */}
            <div className="grid grid-cols-7 gap-1 px-1 w-full max-w-[280px]">
                {[0, 1, 2, 3, 4, 5, 6].map(c => (
                    <button
                        key={c}
                        onClick={() => handleDrop(c)}
                        disabled={winner || isProcessing || (localPlayerRole && turn !== localPlayerRole)}
                        className={`w-full h-8 flex items-center justify-center rounded-t-lg transition-all ${turn === localPlayerRole && !winner ? 'bg-blue-500/20 hover:bg-blue-500 text-blue-300 hover:text-white animate-pulse' : 'opacity-0 cursor-default'}`}
                        id={`drop-col-${c}`}
                    >
                        <span className="text-[10px]">▼</span>
                    </button>
                ))}
            </div>

            {/* The Grid - Explicitly Sized */}
            <div className="bg-blue-700 p-2.5 rounded-xl shadow-2xl border-t-2 border-blue-400 w-full max-w-[280px] min-h-[240px] relative">
                {/* Fallback if board is broken */}
                {!board || board.length !== 42 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">Initializing Matrix...</div>
                ) : (
                    <div className="grid grid-cols-7 gap-1.5">
                        {board.map((cell, i) => (
                            <div
                                key={i}
                                onClick={() => handleDrop(i % COLS)}
                                className={`aspect-square rounded-full border border-blue-800 flex items-center justify-center bg-slate-950/90 overflow-hidden relative shadow-inner ${!cell && !winner && turn === localPlayerRole ? 'cursor-pointer hover:bg-white/5' : ''}`}
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
                )}
            </div>

            <button onClick={initGame} className="mt-2 text-[8px] font-black text-slate-600 hover:text-white uppercase transition-colors">Reset Matrix</button>

            {/* Result Overlay */}
            {winner && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 p-4">
                    <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl flex flex-col items-center gap-4 shadow-2xl w-full max-w-[240px]">
                        <h2 className={`text-2xl font-black italic tracking-tighter ${winner === 'red' ? 'text-pink-500' : winner === 'yellow' ? 'text-yellow-400' : 'text-slate-400'}`}>
                            {winner === 'draw' ? 'STALEMATE' : `${winner.toUpperCase()} WINS`}
                        </h2>
                        <button onClick={initGame} className="w-full py-3 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-400 hover:text-white transition-all transform hover:scale-105">REPLAY</button>
                    </div>
                </div>
            )}
        </div>
    );
}
