import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

const ROWS = 6;
const COLS = 7;

export default function Connect4({ sessionId }) {
    const [board, setBoard] = useState(Array(ROWS).fill(Array(COLS).fill(null)));
    const [turn, setTurn] = useState('red'); // 'red' or 'yellow'
    const [winner, setWinner] = useState(null);
    const [playerId, setPlayerId] = useState(null); // 'red' or 'yellow' for this client

    // Sound effects (simple synthesis or placeholders)
    // const playDrop = () => ...

    useEffect(() => {
        // Sync Game State
        const gameDoc = doc(db, 'whiteboards', sessionId, 'games', 'connect4');

        const unsubscribe = onSnapshot(gameDoc, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setBoard(JSON.parse(data.board));
                setTurn(data.turn);
                setWinner(data.winner);
            } else {
                // Initialize if not exists
                resetGame();
            }
        });

        // Determine Player ID locally (simple storage or random for now)
        // ideally, first joiner is Red, second is Yellow. 
        // For simplicity, we'll let users *pick* a side or just play hotseat for now to ensure reliability.
        // Or we can use a "Join" mechanism. 
        // Let's keep it simple: "Claim Red" / "Claim Yellow" buttons?
        // Or just open play (anyone can move). "Collaborative" means anyone helps valid moves.

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
        // Simple check algorithm
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

        // Deep copy board
        const newBoard = board.map(row => [...row]);

        // Find lowest empty row in col
        let rowIndex = -1;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (!newBoard[r][colIndex]) {
                rowIndex = r;
                break;
            }
        }

        if (rowIndex === -1) return; // Column full

        const currentPlayer = turn; // 'red' or 'yellow'
        newBoard[rowIndex][colIndex] = currentPlayer;

        // Check Win
        let newWinner = null;
        if (checkWin(newBoard, rowIndex, colIndex, currentPlayer)) {
            newWinner = currentPlayer;
        }

        // Optimistic Update
        setBoard(newBoard);
        setTurn(currentPlayer === 'red' ? 'yellow' : 'red');
        setWinner(newWinner);

        // Sync
        await updateDoc(doc(db, 'whiteboards', sessionId, 'games', 'connect4'), {
            board: JSON.stringify(newBoard),
            turn: currentPlayer === 'red' ? 'yellow' : 'red',
            winner: newWinner,
            lastMove: Date.now()
        });
    };

    return (
        <div className="flex flex-col items-center gap-4 p-4">
            {/* Header / Score */}
            <div className="flex items-center gap-8 text-white font-mono uppercase tracking-widest">
                <div className={`flex items-center gap-2 ${turn === 'red' ? 'animate-pulse text-pink-500' : 'opacity-50'}`}>
                    <div className="w-4 h-4 rounded-full bg-pink-500 shadow-[0_0_10px_#ec4899]"></div>
                    Red
                </div>
                <div className="text-xs text-slate-500">VS</div>
                <div className={`flex items-center gap-2 ${turn === 'yellow' ? 'animate-pulse text-cyan-400' : 'opacity-50'}`}>
                    <div className="w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>
                    Cyan
                </div>
            </div>

            {/* Board */}
            <div className="relative bg-slate-800/80 p-2 rounded-lg border border-slate-700 shadow-2xl backdrop-blur-md">
                <div className="grid grid-cols-7 gap-2">
                    {/* Clickable Columns Overlay (Optional, but here we just map cells) */}
                    {/* Better approach: Map columns for click targets */}
                    {board.map((row, r) => (
                        row.map((cell, c) => (
                            <div
                                key={`${r}-${c}`}
                                onClick={() => handleDrop(c)}
                                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-900 border border-slate-700 relative overflow-hidden cursor-pointer hover:bg-slate-800 transition-colors flex items-center justify-center group"
                            >
                                {/* Hover Indicator (Ghost Piece) */}
                                {!cell && !winner && (
                                    <div className={`w-full h-full rounded-full opacity-0 group-hover:opacity-20 transition-opacity ${turn === 'red' ? 'bg-pink-500' : 'bg-cyan-400'}`}></div>
                                )}

                                {/* Actual Piece */}
                                {cell && (
                                    <div className={`w-full h-full rounded-full shadow-inner animate-drop ${cell === 'red'
                                        ? 'bg-gradient-to-br from-pink-400 to-pink-600 shadow-[0_0_15px_#ec4899]'
                                        : 'bg-gradient-to-br from-cyan-300 to-cyan-500 shadow-[0_0_15px_#22d3ee]'
                                        }`}></div>
                                )}
                            </div>
                        ))
                    ))}
                </div>
            </div>

            {/* Status / Reset */}
            {winner ? (
                <div className="text-center animate-bounce">
                    <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500">
                        {winner.toUpperCase()} WINS!
                    </div>
                    <button
                        onClick={resetGame}
                        className="mt-2 px-4 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white transition-colors"
                    >
                        Play Again
                    </button>
                </div>
            ) : (
                <button
                    onClick={resetGame}
                    className="text-[10px] text-slate-600 hover:text-slate-400 hover:underline"
                >
                    Reset Board
                </button>
            )}
        </div>
    );
}
