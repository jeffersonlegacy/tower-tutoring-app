import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../../services/firebase';
import { doc, onSnapshot, setDoc, updateDoc, runTransaction } from 'firebase/firestore';

const ROWS = 6;
const COLS = 7;

export default function Connect4({ sessionId }) {
    const [board, setBoard] = useState(Array(ROWS).fill().map(() => Array(COLS).fill(null)));
    const [turn, setTurn] = useState('red');
    const [winner, setWinner] = useState(null);
    const [localPlayerRole, setLocalPlayerRole] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Audio Refs (Professional Touch)
    const dropSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3'));
    const winSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3'));

    useEffect(() => {
        const gameDoc = doc(db, 'whiteboards', sessionId, 'games', 'connect4');
        const unsubscribe = onSnapshot(gameDoc, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                const newBoard = JSON.parse(data.board);

                // Play sound if board changed and it's not the first load
                if (JSON.stringify(newBoard) !== JSON.stringify(board)) {
                    dropSound.current.play().catch(() => { });
                }

                setBoard(newBoard);
                setTurn(data.turn);
                setWinner(data.winner);
            } else {
                initGame();
            }
        });

        return () => unsubscribe();
    }, [sessionId]);

    const initGame = async () => {
        const emptyBoard = Array(ROWS).fill().map(() => Array(COLS).fill(null));
        await setDoc(doc(db, 'whiteboards', sessionId, 'games', 'connect4'), {
            board: JSON.stringify(emptyBoard),
            turn: 'red',
            winner: null,
            moveCount: 0,
            lastUpdated: Date.now()
        });
    };

    const checkWin = (currentBoard, r, c, player) => {
        const directions = [
            [[0, 1], [0, -1]], // Horizontal
            [[1, 0], [-1, 0]], // Vertical
            [[1, 1], [-1, -1]], // Diagonal \
            [[1, -1], [-1, 1]]  // Diagonal /
        ];

        for (const axis of directions) {
            let count = 1;
            for (const [dr, dc] of axis) {
                let nr = r + dr;
                let nc = c + dc;
                while (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && currentBoard[nr][nc] === player) {
                    count++;
                    nr += dr;
                    nc += dc;
                }
            }
            if (count >= 4) return true;
        }
        return false;
    };

    const handleDrop = async (colIndex) => {
        if (winner || isProcessing || (localPlayerRole && turn !== localPlayerRole)) return;

        setIsProcessing(true);
        const gameDocRef = doc(db, 'whiteboards', sessionId, 'games', 'connect4');

        try {
            await runTransaction(db, async (transaction) => {
                const gameSnap = await transaction.get(gameDocRef);
                if (!gameSnap.exists()) throw "Game doc missing";

                const data = gameSnap.data();
                if (data.winner) return; // Already someone won
                if (data.turn !== turn) return; // Turn mismatch

                const currentBoard = JSON.parse(data.board);
                let rowIndex = -1;
                for (let r = ROWS - 1; r >= 0; r--) {
                    if (!currentBoard[r][colIndex]) {
                        rowIndex = r;
                        break;
                    }
                }

                if (rowIndex === -1) return; // Column full

                currentBoard[rowIndex][colIndex] = turn;
                const nextTurn = turn === 'red' ? 'yellow' : 'red';
                const moveCount = (data.moveCount || 0) + 1;

                let newWinner = null;
                if (checkWin(currentBoard, rowIndex, colIndex, turn)) {
                    newWinner = turn;
                    winSound.current.play().catch(() => { });
                } else if (moveCount >= ROWS * COLS) {
                    newWinner = 'draw';
                }

                transaction.update(gameDocRef, {
                    board: JSON.stringify(currentBoard),
                    turn: nextTurn,
                    winner: newWinner,
                    moveCount: moveCount,
                    lastUpdated: Date.now()
                });
            });
        } catch (e) {
            console.error("Transaction failed: ", e);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-3 p-2 select-none overflow-hidden h-full">

            {/* Player Selection HUD */}
            {!localPlayerRole && !winner && (
                <div className="bg-slate-800/80 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-300 w-full max-w-[220px]">
                    <span className="text-[10px] font-black text-cyan-400 tracking-[0.2em] uppercase">Select Directive</span>
                    <div className="flex gap-2 w-full">
                        <button
                            onClick={() => setLocalPlayerRole('red')}
                            className="flex-1 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-black text-[10px] shadow-[0_0_15px_#ec489955] transition-all hover:scale-105"
                        >
                            RED
                        </button>
                        <button
                            onClick={() => setLocalPlayerRole('yellow')}
                            className="flex-1 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black text-[10px] shadow-[0_0_15px_#facc1555] transition-all hover:scale-105"
                        >
                            YEL
                        </button>
                    </div>
                </div>
            )}

            {localPlayerRole && (
                <div className="flex flex-col items-center gap-1 group">
                    <div className={`px-4 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border transition-all ${localPlayerRole === 'red' ? 'text-pink-500 border-pink-500/30 bg-pink-500/5' : 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5'}`}>
                        STATION: {localPlayerRole} {localPlayerRole === 'red' ? '🔴' : '🟡'}
                    </div>
                    {turn === localPlayerRole && !winner && (
                        <span className="text-[8px] text-green-400 animate-pulse font-bold uppercase tracking-widest">Awaiting Input...</span>
                    )}
                </div>
            )}

            {/* Elite Turn Indicator */}
            <div className="flex items-center gap-6 bg-black/40 px-6 py-2 rounded-2xl border border-white/5 shadow-inner">
                <div className={`flex flex-col items-center gap-1 transition-all duration-500 ${turn === 'red' ? 'scale-125 opacity-100' : 'opacity-10'}`}>
                    <div className="w-5 h-5 rounded-full bg-pink-500 shadow-[0_0_15px_#ec4899] ring-2 ring-white/10"></div>
                </div>

                <div className="h-4 w-[1px] bg-white/10"></div>

                <div className={`flex flex-col items-center gap-1 transition-all duration-500 ${turn === 'yellow' ? 'scale-125 opacity-100' : 'opacity-10'}`}>
                    <div className="w-5 h-5 rounded-full bg-yellow-400 shadow-[0_0_15px_#facc15] ring-2 ring-white/10"></div>
                </div>
            </div>

            {/* The Grid */}
            <div className="relative bg-blue-700 p-2 rounded-2xl shadow-[0_15px_35px_-15px_rgba(0,0,0,0.5)] border-t-2 border-blue-400 flex flex-col items-center">
                <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                    {board.map((row, r) => (
                        row.map((cell, c) => (
                            <div
                                key={`${r}-${c}`}
                                onClick={() => handleDrop(c)}
                                className={`w-8 h-8 md:w-9 md:h-9 rounded-full border border-blue-800 relative overflow-hidden cursor-pointer flex items-center justify-center transition-all bg-slate-950/80 shadow-inner ${!cell && !winner && turn === localPlayerRole ? 'hover:bg-white/5 active:scale-95' : ''}`}
                            >
                                {/* Ghost Hover */}
                                {!cell && !winner && turn === localPlayerRole && (
                                    <div className={`w-[85%] h-[85%] rounded-full opacity-0 hover:opacity-10 transition-opacity ${localPlayerRole === 'red' ? 'bg-pink-500' : 'bg-yellow-400'}`}></div>
                                )}

                                {/* Token Rendering */}
                                {cell && (
                                    <div className={`w-[85%] h-[85%] rounded-full shadow-lg animate-in zoom-in slide-in-from-top-4 duration-200 ${cell === 'red'
                                        ? 'bg-gradient-to-br from-pink-400 to-pink-600 shadow-[0_0_10px_#ec4899] border border-pink-300'
                                        : 'bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-[0_0_10px_#facc15] border border-yellow-100'
                                        }`}>
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/20 to-transparent"></div>
                                    </div>
                                )}
                            </div>
                        ))
                    ))}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-2 mt-auto">
                <button
                    onClick={initGame}
                    className="px-4 py-1.5 text-[8px] font-black text-slate-500 hover:text-white border border-white/5 hover:border-white/20 rounded-lg uppercase tracking-widest transition-all bg-white/5 active:scale-90"
                >
                    Clear Board
                </button>
            </div>

            {/* Victory / Draw Overlay */}
            {winner && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-500 rounded-3xl p-4">
                    <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl flex flex-col items-center gap-4 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        {winner === 'draw' ? (
                            <h2 className="text-2xl font-black text-slate-400 uppercase tracking-tighter">STALEMATE</h2>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <div className={`w-16 h-16 rounded-full shadow-[0_0_30px_#fff] ${winner === 'red' ? 'bg-pink-500' : 'bg-yellow-400'}`}></div>
                                <h2 className={`text-3xl font-black uppercase tracking-tighter italic ${winner === 'red' ? 'text-pink-500' : 'text-yellow-400'}`}>
                                    {winner} DOMINANCE
                                </h2>
                            </div>
                        )}
                        <button
                            onClick={initGame}
                            className="w-full py-3 bg-white text-black rounded-xl font-black text-sm uppercase tracking-widest hover:bg-blue-400 hover:text-white transition-all transform hover:scale-105 active:scale-95"
                        >
                            RE-INITIALIZE
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
