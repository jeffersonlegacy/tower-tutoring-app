import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

const ROWS = 6;
const COLS = 7;

export default function Connect4({ sessionId }) {
    const [board, setBoard] = useState(Array(ROWS).fill(Array(COLS).fill(null)));
    const [turn, setTurn] = useState('red'); // 'red' or 'yellow'
    const [winner, setWinner] = useState(null);
    const [localPlayerRole, setLocalPlayerRole] = useState(null); // 'red', 'yellow', or null (spectator/deciding)

    useEffect(() => {
        // Sync Game State
        const gameDoc = doc(db, 'whiteboards', sessionId, 'games', 'connect4');

        const unsubscribe = onSnapshot(gameDoc, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setBoard(JSON.parse(data.board));
                setTurn(data.turn);
                setWinner(data.winner);

                // If local role is not set, we can try to infer or let them pick
                // For a robust two-player experience, we'll let them "Claim" a side below.
            } else {
                resetGame();
            }
        });

        return () => unsubscribe();
    }, [sessionId]);

    const resetGame = async () => {
        const emptyBoard = Array(ROWS).fill(Array(COLS).fill(null));
        await setDoc(doc(db, 'whiteboards', sessionId, 'games', 'connect4'), {
            board: JSON.stringify(emptyBoard),
            turn: 'red',
            winner: null,
            lastMove: Date.now()
        });
    };

    const checkWin = (board, r, c, player) => {
        const directions = [
            [[0, 1], [0, -1]], // Horizontal
            [[1, 0], [-1, 0]], // Vertical
            [[1, 1], [-1, -1]], // Diagonal 1
            [[1, -1], [-1, 1]]  // Diagonal 2
        ];

        for (const axis of directions) {
            let count = 1;
            for (const [dr, dc] of axis) {
                let nr = r + dr;
                let nc = c + dc;
                while (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === player) {
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
        if (winner) return;

        // Multiplayer Rule: ONLY the player whose turn it is can move
        // If they haven't claimed a role, they can't move (unless they play hotseat)
        if (localPlayerRole && turn !== localPlayerRole) return;

        const newBoard = board.map(row => [...row]);
        let rowIndex = -1;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (!newBoard[r][colIndex]) {
                rowIndex = r;
                break;
            }
        }

        if (rowIndex === -1) return;

        const currentPlayer = turn;
        newBoard[rowIndex][colIndex] = currentPlayer;

        let newWinner = null;
        if (checkWin(newBoard, rowIndex, colIndex, currentPlayer)) {
            newWinner = currentPlayer;
        }

        await updateDoc(doc(db, 'whiteboards', sessionId, 'games', 'connect4'), {
            board: JSON.stringify(newBoard),
            turn: currentPlayer === 'red' ? 'yellow' : 'red',
            winner: newWinner,
            lastMove: Date.now()
        });
    };

    return (
        <div className="flex flex-col items-center gap-3 p-2 select-none overflow-x-hidden">

            {/* Player Assignment / Status */}
            {!localPlayerRole && !winner && (
                <div className="bg-slate-800 p-3 rounded-xl border border-white/10 shadow-xl flex flex-col items-center gap-2 animate-fade-in w-full max-w-[200px]">
                    <p className="text-white text-[9px] font-bold tracking-widest uppercase opacity-70">Pick Your Color</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setLocalPlayerRole('red')}
                            className="px-4 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-full font-bold text-[10px] shadow-[0_0_10px_rgba(236,72,153,0.3)] transition-all"
                        >
                            RED
                        </button>
                        <button
                            onClick={() => setLocalPlayerRole('yellow')}
                            className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-full font-bold text-[10px] shadow-[0_0_10px_rgba(250,204,21,0.3)] transition-all"
                        >
                            YELLOW
                        </button>
                    </div>
                </div>
            )}

            {localPlayerRole && (
                <div className="flex flex-col items-center gap-1">
                    <div className={`px-3 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase border ${localPlayerRole === 'red' ? 'text-pink-500 border-pink-500/30 bg-pink-500/5' : 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5'}`}>
                        YOU: {localPlayerRole}
                    </div>
                </div>
            )}

            {/* Compact Turn Indicator */}
            <div className="flex items-center gap-6 bg-black/20 px-4 py-2 rounded-2xl border border-white/5">
                <div className={`flex flex-col items-center gap-1 transition-all duration-300 ${turn === 'red' ? 'scale-110 opacity-100' : 'opacity-20'}`}>
                    <div className="w-6 h-6 rounded-full bg-pink-500 shadow-[0_0_10px_#ec4899]"></div>
                    <span className="text-white font-black text-[8px] uppercase tracking-tighter">RED</span>
                </div>

                <div className="h-4 w-px bg-slate-700"></div>

                <div className={`flex flex-col items-center gap-1 transition-all duration-300 ${turn === 'yellow' ? 'scale-110 opacity-100' : 'opacity-20'}`}>
                    <div className="w-6 h-6 rounded-full bg-yellow-400 shadow-[0_0_10px_#facc15]"></div>
                    <span className="text-white font-black text-[8px] uppercase tracking-tighter">YELLOW</span>
                </div>
            </div>

            {/* Turn Message */}
            {localPlayerRole && !winner && (
                <div className="h-4">
                    {turn === localPlayerRole ? (
                        <div className="text-green-400 font-bold text-[9px] uppercase tracking-widest animate-pulse">Your Turn</div>
                    ) : (
                        <div className="text-slate-500 text-[9px] uppercase tracking-widest">Waiting...</div>
                    )}
                </div>
            )}

            {/* Micro Board */}
            <div className="relative bg-blue-600 p-1.5 rounded-xl shadow-xl border-2 border-blue-400 w-fit shrink-0">
                <div className="grid grid-cols-7 gap-1">
                    {board.map((row, r) => (
                        row.map((cell, c) => (
                            <div
                                key={`${r}-${c}`}
                                onClick={() => handleDrop(c)}
                                className={`w-8 h-8 rounded-full border border-blue-700 relative overflow-hidden cursor-pointer flex items-center justify-center transition-all ${!cell && !winner && turn === localPlayerRole ? 'hover:bg-white/5' : ''}`}
                                style={{ backgroundColor: '#000835' }}
                            >
                                {!cell && !winner && turn === localPlayerRole && (
                                    <div className={`w-full h-full rounded-full opacity-0 hover:opacity-20 transition-opacity ${localPlayerRole === 'red' ? 'bg-pink-500' : 'bg-yellow-400'}`}></div>
                                )}

                                {cell && (
                                    <div className={`w-[80%] h-[80%] rounded-full shadow-lg transition-transform ${cell === 'red'
                                        ? 'bg-gradient-to-br from-pink-400 to-pink-600 shadow-[0_0_10px_#ec4899]'
                                        : 'bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-[0_0_10px_#facc15]'
                                        }`}>
                                    </div>
                                )}
                            </div>
                        ))
                    ))}
                </div>
            </div>

            {!winner && (
                <button
                    onClick={resetGame}
                    className="mt-1 px-3 py-0.5 text-[8px] font-bold text-slate-600 hover:text-white border border-slate-800 rounded-full uppercase tracking-widest transition-all"
                >
                    Reset
                </button>
            )}

            {/* Minimal Overlay */}
            {winner && (
                <div className="absolute inset-x-0 bottom-4 z-[100] flex flex-col items-center animate-fade-in p-4">
                    <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col items-center gap-3 shadow-2xl">
                        <h2 className={`text-xl font-black uppercase tracking-tighter ${winner === 'red' ? 'text-pink-500' : 'text-yellow-400'}`}>
                            {winner} Wins!
                        </h2>
                        <button
                            onClick={resetGame}
                            className="px-6 py-2 bg-white text-slate-900 rounded-full font-black text-sm uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all transform hover:scale-105"
                        >
                            REPLAY
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
