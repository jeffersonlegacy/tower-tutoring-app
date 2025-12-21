import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import { doc, onSnapshot, setDoc, runTransaction } from 'firebase/firestore';

const ROWS = 6;
const COLS = 7;

/**
 * CONNECT 4 v4.1 - FLAWLESS SYNC
 * Refactored for flat-array efficiency and resilient click targets.
 */
export default function Connect4({ sessionId }) {
    // board is 1D array of 42 (6x7)
    const [board, setBoard] = useState(Array(ROWS * COLS).fill(null));
    const [turn, setTurn] = useState('red');
    const [winner, setWinner] = useState(null);
    const [localPlayerRole, setLocalPlayerRole] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const dropSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3'));
    const winSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3'));

    useEffect(() => {
        const gameDoc = doc(db, 'whiteboards', sessionId, 'games', 'connect4_v4');

        const unsubscribe = onSnapshot(gameDoc, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setBoard(data.board);
                setTurn(data.turn);
                setWinner(data.winner);

                // Play sound on move (lastUpdate changed)
                if (data.moveCount > 0) {
                    dropSound.current.play().catch(() => { });
                }
            } else {
                initGame();
            }
        });

        return () => unsubscribe();
    }, [sessionId]);

    const initGame = async () => {
        await setDoc(doc(db, 'whiteboards', sessionId, 'games', 'connect4_v4'), {
            board: Array(ROWS * COLS).fill(null),
            turn: 'red',
            winner: null,
            moveCount: 0,
            lastUpdated: Date.now()
        });
    };

    const checkWin = (b, idx, player) => {
        const r = Math.floor(idx / COLS);
        const c = idx % COLS;
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]]; // H, V, D1, D2

        for (const [dr, dc] of directions) {
            let count = 1;
            // Positive direction
            for (let i = 1; i < 4; i++) {
                const nr = r + dr * i;
                const nc = c + dc * i;
                if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || b[nr * COLS + nc] !== player) break;
                count++;
            }
            // Negative direction
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
        console.log(`[C4] Attempting drop in col ${colIndex} as ${turn} `);

        const gameDocRef = doc(db, 'whiteboards', sessionId, 'games', 'connect4_v4');

        try {
            await runTransaction(db, async (transaction) => {
                const gameSnap = await transaction.get(gameDocRef);
                const data = gameSnap.data();
                if (!data || data.winner || data.turn !== turn) return;

                const currentBoard = [...data.board];
                let targetIdx = -1;

                // Find bottom-most empty row in this column
                for (let r = ROWS - 1; r >= 0; r--) {
                    const idx = r * COLS + colIndex;
                    if (!currentBoard[idx]) {
                        targetIdx = idx;
                        break;
                    }
                }

                if (targetIdx === -1) {
                    console.warn("[C4] Column full");
                    return;
                }

                currentBoard[targetIdx] = turn;
                const nextTurn = turn === 'red' ? 'yellow' : 'red';
                const moveCount = (data.moveCount || 0) + 1;

                let newWinner = null;
                if (checkWin(currentBoard, targetIdx, turn)) {
                    newWinner = turn;
                    winSound.current.play().catch(() => { });
                } else if (moveCount >= ROWS * COLS) {
                    newWinner = 'draw';
                }

                transaction.update(gameDocRef, {
                    board: currentBoard,
                    turn: nextTurn,
                    winner: newWinner,
                    moveCount: moveCount,
                    lastUpdated: Date.now()
                });
            });
        } catch (e) {
            console.error("[C4] Drop Failed:", e);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-2 p-2 select-none overflow-hidden h-full font-mono">

            {/* Player Selection */}
            {!localPlayerRole && !winner && (
                <div className="bg-slate-800/90 border border-white/10 p-3 rounded-xl flex flex-col items-center gap-2 animate-in zoom-in w-full max-w-[200px]">
                    <span className="text-[9px] font-black text-cyan-400">CLAIM STATION</span>
                    <div className="flex gap-2 w-full">
                        <button onClick={() => setLocalPlayerRole('red')} className="flex-1 py-1.5 bg-pink-600 text-[10px] font-black rounded-lg">RED</button>
                        <button onClick={() => setLocalPlayerRole('yellow')} className="flex-1 py-1.5 bg-yellow-400 text-slate-900 text-[10px] font-black rounded-lg">YEL</button>
                    </div>
                </div>
            )}

            {localPlayerRole && (
                <div className={`px - 4 py - 1 rounded - full text - [9px] font - black border tracking - widest ${localPlayerRole === 'red' ? 'text-pink-500 border-pink-500/20' : 'text-yellow-400 border-yellow-400/20'} `}>
                    UNIT: {localPlayerRole.toUpperCase()} {turn === localPlayerRole && !winner ? '🛰️' : '⌛'}
                </div>
            )}

            {/* Turn HUD */}
            <div className="flex items-center gap-4 bg-black/40 px-5 py-1.5 rounded-full border border-white/5 shadow-lg">
                <div className={`w - 4 h - 4 rounded - full bg - pink - 500 transition - all ${turn === 'red' ? 'scale-125 shadow-[0_0_10px_#ec4899]' : 'opacity-10'} `} />
                <div className="w-px h-3 bg-white/10" />
                <div className={`w - 4 h - 4 rounded - full bg - yellow - 400 transition - all ${turn === 'yellow' ? 'scale-125 shadow-[0_0_10px_#facc15]' : 'opacity-10'} `} />
            </div>

            {/* Explicit Drop Inputs */}
            <div className="grid grid-cols-7 gap-1 px-1">
                {[0, 1, 2, 3, 4, 5, 6].map(c => (
                    <button
                        key={c}
                        onClick={() => handleDrop(c)}
                        disabled={winner || isProcessing || (localPlayerRole && turn !== localPlayerRole)}
                        className={`w - 8 h - 6 flex items - center justify - center rounded - t - lg transition - all ${turn === localPlayerRole && !winner ? 'bg-blue-600/30 hover:bg-blue-600 animate-bounce' : 'opacity-0'} `}
                        id={`drop - col - ${c} `}
                    >
                        <span className="text-[10px]">▼</span>
                    </button>
                ))}
            </div>

            {/* The Grid */}
            <div className="bg-blue-700 p-2 rounded-xl shadow-2xl border-t-2 border-blue-400">
                <div className="grid grid-cols-7 gap-1.5">
                    {board.map((cell, i) => (
                        <div
                            key={i}
                            onClick={() => handleDrop(i % COLS)}
                            className={`w - 8 h - 8 rounded - full border border - blue - 800 flex items - center justify - center bg - slate - 950 / 90 overflow - hidden ${!cell && !winner && turn === localPlayerRole ? 'cursor-pointer hover:bg-white/5' : ''} `}
                        >
                            {cell && (
                                <div className={`w - [85 %] h - [85 %] rounded - full shadow - lg ${cell === 'red'
                                    ? 'bg-gradient-to-br from-pink-400 to-pink-600 shadow-[0_0_8px_#ec4899]'
                                    : 'bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-[0_0_8px_#facc15]'
                                    } animate -in zoom -in duration - 200`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <button onClick={initGame} className="mt-2 text-[8px] font-black text-slate-600 hover:text-white uppercase">Reset Matrix</button>

            {/* Result Overlay */}
            {winner && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in rounded-3xl">
                    <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl flex flex-col items-center gap-4 shadow-2xl">
                        <h2 className={`text - 2xl font - black italic tracking - tighter ${winner === 'red' ? 'text-pink-500' : winner === 'yellow' ? 'text-yellow-400' : 'text-slate-400'} `}>
                            {winner === 'draw' ? 'STALEMATE' : `${winner.toUpperCase()} VICTORIOUS`}
                        </h2>
                        <button onClick={initGame} className="w-full py-2 bg-white text-black rounded-lg font-black text-xs uppercase tracking-widest hover:bg-blue-400 hover:text-white transition-all">REPLAY</button>
                    </div>
                </div>
            )}
        </div>
    );
}
