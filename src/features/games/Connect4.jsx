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
        <div className="flex flex-col items-center gap-6 p-4 select-none">

            {/* Player Assignment / Status */}
            {!localPlayerRole && !winner && (
                <div className="bg-slate-800 p-4 rounded-xl border border-white/10 shadow-xl flex flex-col items-center gap-3 animate-fade-in">
                    <p className="text-white text-xs font-bold tracking-widest uppercase opacity-70">Pick Your Color</p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setLocalPlayerRole('red')}
                            className="px-6 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-full font-bold text-sm shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all transform hover:scale-105"
                        >
                            PLAY RED
                        </button>
                        <button
                            onClick={() => setLocalPlayerRole('yellow')}
                            className="px-6 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-full font-bold text-sm shadow-[0_0_15px_rgba(250,204,21,0.4)] transition-all transform hover:scale-105"
                        >
                            PLAY YELLOW
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-500 italic">Play with someone in the same ID room</p>
                </div>
            )}

            {localPlayerRole && (
                <div className="flex flex-col items-center gap-2">
                    <div className={`px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border-2 ${localPlayerRole === 'red' ? 'text-pink-500 border-pink-500/30 bg-pink-500/10' : 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'}`}>
                        YOU ARE {localPlayerRole}
                    </div>
                </div>
            )}

            {/* Turn Indicator */}
            <div className="flex items-center gap-10">
                <div className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all duration-300 ${turn === 'red' ? 'bg-pink-500/20 scale-110 border border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]' : 'opacity-20 translate-y-2'}`}>
                    <div className="w-10 h-10 rounded-full bg-pink-500 shadow-[0_0_20px_#ec4899]"></div>
                    <span className="text-white font-black text-xs uppercase tracking-widest">RED</span>
                </div>

                <div className="h-0.5 w-12 bg-slate-700 rounded-full"></div>

                <div className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all duration-300 ${turn === 'yellow' ? 'bg-yellow-400/20 scale-110 border border-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.3)]' : 'opacity-20 translate-y-2'}`}>
                    <div className="w-10 h-10 rounded-full bg-yellow-400 shadow-[0_0_20px_#facc15]"></div>
                    <span className="text-white font-black text-xs uppercase tracking-widest">YELLOW</span>
                </div>
            </div>

            {/* Turn Message Overlay */}
            {localPlayerRole && !winner && (
                <div className="h-6">
                    {turn === localPlayerRole ? (
                        <div className="text-green-400 font-bold text-xs uppercase tracking-[0.2em] animate-pulse">It's Your Turn!</div>
                    ) : (
                        <div className="text-slate-500 text-xs uppercase tracking-widest">Waiting for opponent...</div>
                    )}
                </div>
            )}

            {/* High Contrast Board */}
            <div className="relative bg-blue-600 p-3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-blue-400 w-fit">
                {/* Back Plate */}
                <div className="absolute inset-0 bg-blue-800 rounded-xl -z-10 transform translate-y-2"></div>

                <div className="grid grid-cols-7 gap-1 md:gap-2">
                    {board.map((row, r) => (
                        row.map((cell, c) => (
                            <div
                                key={`${r}-${c}`}
                                onClick={() => handleDrop(c)}
                                className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-blue-700 relative overflow-hidden cursor-pointer flex items-center justify-center transition-all ${!cell && !winner && turn === localPlayerRole ? 'hover:bg-white/10' : ''}`}
                                style={{ backgroundColor: '#000835' }} // Dark inner hole
                            >
                                {/* Ghost Piece Preview */}
                                {!cell && !winner && turn === localPlayerRole && (
                                    <div className={`w-full h-full rounded-full opacity-0 hover:opacity-30 transition-opacity ${localPlayerRole === 'red' ? 'bg-pink-500' : 'bg-yellow-400'}`}></div>
                                )}

                                {/* Actual Piece */}
                                {cell && (
                                    <div className={`w-[85%] h-[85%] rounded-full shadow-2xl transform scale-100 transition-transform ${cell === 'red'
                                        ? 'bg-gradient-to-br from-pink-400 to-pink-600 shadow-[0_0_20px_#ec4899] border-2 border-pink-300'
                                        : 'bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-[0_0_20px_#facc15] border-2 border-yellow-200'
                                        }`}>
                                        <div className="absolute inset-0 rounded-full bg-white/10 border-b-4 border-black/20"></div>
                                    </div>
                                )}
                            </div>
                        ))
                    ))}
                </div>
            </div>

            {/* Final Outcome */}
            {winner && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-6 text-center">
                    <div className="flex flex-col items-center gap-4 max-w-sm">
                        <div className={`w-24 h-24 rounded-full shadow-[0_0_50px_currentColor] ${winner === 'red' ? 'text-pink-500 bg-pink-500' : 'text-yellow-400 bg-yellow-400'}`}></div>
                        <h2 className={`text-5xl font-black italic tracking-tighter uppercase drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)] ${winner === 'red' ? 'text-pink-500' : 'text-yellow-400'}`}>
                            {winner} Victory!
                        </h2>
                        <button
                            onClick={resetGame}
                            className="mt-4 px-10 py-3 bg-white text-slate-900 rounded-full font-black text-lg uppercase tracking-widest hover:bg-blue-400 hover:text-white transition-all transform hover:scale-110 shadow-2xl"
                        >
                            NEW GAME
                        </button>
                    </div>
                </div>
            )}

            {!winner && (
                <button
                    onClick={resetGame}
                    className="mt-4 px-4 py-1 text-[10px] font-bold text-slate-500 hover:text-white border border-slate-700 rounded-full uppercase tracking-widest transition-all"
                >
                    Reset Environment
                </button>
            )}
        </div>
    );
}
