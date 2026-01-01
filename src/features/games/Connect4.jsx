import React, { useState, useEffect, useRef } from 'react';
import { useRealtimeGame } from '../../hooks/useRealtimeGame';
import GameEndOverlay from './GameEndOverlay';
import confetti from 'canvas-confetti';

const ROWS = 6;
const COLS = 7;

const INITIAL_STATE = {
    board: Array(ROWS * COLS).fill(null),
    turn: 'red', // red (Host) starts
    winner: null,
    status: 'MENU', // MENU, WAITING, PLAYING, FINISHED
    lastMoveTime: 0,
    mode: 'PVP', // PVP, SOLO
    difficulty: 'MEDIUM' // BEGINNER, MEDIUM, HARD, EXPERT, IMPOSSIBLE
};

const safeBoard = (b) => {
    if (Array.isArray(b)) return b;
    const arr = Array(ROWS * COLS).fill(null);
    if (b && typeof b === 'object') {
        Object.keys(b).forEach(k => {
            const idx = parseInt(k);
            if (!isNaN(idx) && idx >= 0 && idx < arr.length) {
                arr[idx] = b[k];
            }
        });
    }
    return arr;
};

// --- MINIMAX AI ENGINE (OPTIMIZED) ---
// Note: Board is now passed as Reference and MUTATED to avoid GC overhead.
// We must Undo moves.

// Heuristic Evaluation (Same logic, slightly cleaner)
const evaluateWindow = (window, piece) => {
    let score = 0;
    const oppPiece = piece === 'yellow' ? 'red' : 'yellow';
    const empty = null;

    const countPiece = window.filter(c => c === piece).length;
    const countEmpty = window.filter(c => c === empty).length;
    const countOpp = window.filter(c => c === oppPiece).length;

    if (countPiece === 4) score += 100;
    else if (countPiece === 3 && countEmpty === 1) score += 5;
    else if (countPiece === 2 && countEmpty === 2) score += 2;

    if (countOpp === 3 && countEmpty === 1) score -= 4; // Block slightly

    return score;
};

const scoreBoard = (board, piece) => {
    let score = 0;

    // Center Column Preference
    const centerArray = [];
    for (let r = 0; r < ROWS; r++) {
        centerArray.push(board[r * COLS + Math.floor(COLS / 2)]);
    }
    const centerCount = centerArray.filter(c => c === piece).length;
    score += centerCount * 3;

    // Horizontal
    for (let r = 0; r < ROWS; r++) {
        const rowStart = r * COLS;
        for (let c = 0; c < COLS - 3; c++) {
            const window = [board[rowStart + c], board[rowStart + c + 1], board[rowStart + c + 2], board[rowStart + c + 3]];
            score += evaluateWindow(window, piece);
        }
    }

    // Vertical
    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS - 3; r++) {
            const window = [board[r * COLS + c], board[(r + 1) * COLS + c], board[(r + 2) * COLS + c], board[(r + 3) * COLS + c]];
            score += evaluateWindow(window, piece);
        }
    }

    // Diag Positive
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const window = [board[r * COLS + c], board[(r + 1) * COLS + c + 1], board[(r + 2) * COLS + c + 2], board[(r + 3) * COLS + c + 3]];
            score += evaluateWindow(window, piece);
        }
    }

    // Diag Negative
    for (let r = 3; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const window = [board[r * COLS + c], board[(r - 1) * COLS + c + 1], board[(r - 2) * COLS + c + 2], board[(r - 3) * COLS + c + 3]];
            score += evaluateWindow(window, piece);
        }
    }

    return score;
};

const isTerminal = (board) => {
    const b = safeBoard(board);
    // Optimized check (inlined logic for speed)
    // Horizontal
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const idx = r * COLS + c;
            const p = b[idx];
            if (p && p === b[idx + 1] && p === b[idx + 2] && p === b[idx + 3]) return p;
        }
    }
    // Vertical
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS; c++) {
            const idx = r * COLS + c;
            const p = b[idx];
            if (p && p === b[idx + COLS] && p === b[idx + COLS * 2] && p === b[idx + COLS * 3]) return p;
        }
    }
    // Diag Pos
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const idx = r * COLS + c;
            const p = b[idx];
            if (p && p === b[idx + COLS + 1] && p === b[idx + COLS * 2 + 2] && p === b[idx + COLS * 3 + 3]) return p;
        }
    }
    // Diag Neg
    for (let r = 3; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const idx = r * COLS + c;
            const p = b[idx];
            if (p && p === b[idx - COLS + 1] && p === b[idx - COLS * 2 + 2] && p === b[idx - COLS * 3 + 3]) return p;
        }
    }

    // Check full
    let isFull = true;
    for (let i = 0; i < b.length; i++) {
        if (b[i] === null) { isFull = false; break; }
    }
    if (isFull) return 'draw';

    return null;
};

const getValidLocations = (board) => {
    const b = safeBoard(board);
    const valid = [];
    for (let c = 0; c < COLS; c++) {
        // Row 0 is top
        if (b[c] === null) valid.push(c);
    }
    return valid;
};

const getNextOpenRow = (board, col) => {
    if (col === null || col === undefined) return -1;
    const b = safeBoard(board);
    for (let r = ROWS - 1; r >= 0; r--) {
        if (b[r * COLS + col] === null) return r;
    }
    return -1;
};

// MUTABLE MINIMAX
const minimax = (board, depth, alpha, beta, maximizingPlayer) => {
    const b = safeBoard(board);
    const result = isTerminal(b);
    if (result) {
        if (result === 'yellow') return [null, 1000000];
        if (result === 'red') return [null, -1000000];
        if (result === 'draw') return [null, 0];
    }
    if (depth === 0) {
        return [null, scoreBoard(b, 'yellow')];
    }

    const validLocs = getValidLocations(b);
    if (validLocs.length === 0) return [null, 0];

    validLocs.sort((a, b) => Math.abs(a - 3) - Math.abs(b - 3));

    if (maximizingPlayer) {
        let value = -Infinity;
        let column = validLocs[0];
        for (const col of validLocs) {
            const row = getNextOpenRow(b, col);
            if (row === -1) continue;
            const idx = row * COLS + col;

            b[idx] = 'yellow';
            const res = minimax(b, depth - 1, alpha, beta, false);
            const newScore = res ? res[1] : 0;
            b[idx] = null;

            if (newScore > value) {
                value = newScore;
                column = col;
            }
            alpha = Math.max(alpha, value);
            if (alpha >= beta) break;
        }
        return [column, value];
    } else {
        let value = Infinity;
        let column = validLocs[0];
        for (const col of validLocs) {
            const row = getNextOpenRow(b, col);
            if (row === -1) continue;
            const idx = row * COLS + col;

            b[idx] = 'red';
            const res = minimax(b, depth - 1, alpha, beta, true);
            const newScore = res ? res[1] : 0;
            b[idx] = null;

            if (newScore < value) {
                value = newScore;
                column = col;
            }
            beta = Math.min(beta, value);
            if (alpha >= beta) break;
        }
        return [column, value];
    }
};

export default function Connect4({ sessionId, onBack }) {
    const gameId = 'connect4_v2';
    const { gameState, playerId, isHost, updateState } = useRealtimeGame(sessionId, gameId, INITIAL_STATE);
    const [localDifficulty, setLocalDifficulty] = useState(null);

    // Mount tracking - MUST BE BEFORE ANY CONDITIONAL RETURNS
    const isMounted = useRef(true);
    const boardShakeRef = useRef('');

    // Mount effect
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // Shake effect - MUST BE BEFORE ANY CONDITIONAL RETURNS
    useEffect(() => {
        if (gameState?.lastMoveTime > 0) {
            boardShakeRef.current = 'animate-shake';
            const t = setTimeout(() => {
                boardShakeRef.current = '';
            }, 300);
            return () => clearTimeout(t);
        }
    }, [gameState?.lastMoveTime]);

    // AI Turn Logic - MUST BE BEFORE ANY CONDITIONAL RETURNS
    useEffect(() => {
        if (!gameState || gameState.mode !== 'SOLO' || gameState.status !== 'PLAYING') return;
        if (gameState.turn !== 'yellow') return;

        const aiMove = async () => {
            await new Promise(r => setTimeout(r, 600));

            const board = [...safeBoard(gameState.board)];
            const validCols = getValidLocations(board);

            if (validCols.length === 0) return;

            let chosenCol;
            const difficulty = gameState.difficulty || 'MEDIUM';

            if (difficulty === 'BEGINNER') {
                chosenCol = validCols[Math.floor(Math.random() * validCols.length)];
            } else if (difficulty === 'MEDIUM') {
                chosenCol = minimax(board, 2, -Infinity, Infinity, true)[0];
            } else if (difficulty === 'HARD') {
                chosenCol = minimax(board, 4, -Infinity, Infinity, true)[0];
            } else {
                chosenCol = minimax(board, 6, -Infinity, Infinity, true)[0];
            }

            if (chosenCol === undefined || chosenCol === null) {
                chosenCol = validCols[0];
            }

            if (chosenCol === undefined || chosenCol === null) return;

            const realBoard = [...safeBoard(gameState.board)];
            const row = getNextOpenRow(realBoard, chosenCol);
            if (row === -1) return;

            realBoard[row * COLS + chosenCol] = 'yellow';

            const term = isTerminal(realBoard);
            let winner = null;
            if (term === 'yellow') winner = 'yellow';
            else if (term === 'draw') winner = 'draw';
            else if (term === 'red') winner = 'red';

            updateState({
                board: realBoard,
                turn: 'red',
                winner: winner,
                status: winner ? 'FINISHED' : 'PLAYING',
                lastMoveTime: Date.now()
            });
        };

        const moveTimer = setTimeout(aiMove, 100);
        return () => clearTimeout(moveTimer);
    }, [gameState, updateState]);

    // --- LOADING GUARD (AFTER ALL HOOKS) ---
    if (!gameState) return <div className="text-white p-4 font-mono animate-pulse">Connecting to Matrix...</div>;

    // Game Logic
    const handleDrop = (colIndex) => {
        if (!gameState || gameState.status !== 'PLAYING') return;

        // Turn Enforcement (Skip for SOLO)
        const myColor = isHost ? 'red' : 'yellow';
        if (gameState.mode !== 'SOLO' && gameState.turn !== myColor) return;
        if (gameState.mode === 'SOLO' && gameState.turn !== 'red') return; // Humans only play Red in solo

        // Find available row
        const currentBoard = [...safeBoard(gameState.board)];
        let targetIdx = -1;

        for (let r = ROWS - 1; r >= 0; r--) {
            const idx = r * COLS + colIndex;
            if (!currentBoard[idx]) {
                targetIdx = idx;
                break;
            }
        }

        if (targetIdx === -1) return; // Column full

        // Apply Move
        const mover = gameState.turn; // 'red' or 'yellow'

        currentBoard[targetIdx] = mover;
        const nextTurn = mover === 'red' ? 'yellow' : 'red';

        // Check Win
        const term = isTerminal(currentBoard);
        let winner = null;
        if (term === 'red' || term === 'yellow') winner = term;
        else if (term === 'draw') winner = 'draw';

        const updates = {
            board: currentBoard,
            turn: nextTurn,
            winner: winner,
            status: winner ? 'FINISHED' : 'PLAYING',
            lastMoveTime: Date.now()
        };

        updateState(updates);
    };



    const handleReset = () => {
        updateState({
            board: Array(ROWS * COLS).fill(null),
            turn: 'red',
            winner: null,
            status: gameState.mode === 'SOLO' ? 'PLAYING' : 'WAITING',
            lastMoveTime: 0
        });
    };

    // START PVP MATCH
    const handleStart = () => {
        updateState({ status: 'PLAYING' });
    };

    // SELECT MODE
    const setMode = (mode, diff = 'MEDIUM') => {
        if (mode === 'SOLO') {
            updateState({ status: 'PLAYING', mode: 'SOLO', turn: 'red', difficulty: diff });
        } else {
            updateState({ status: 'WAITING', mode: 'PVP', turn: 'red' });
        }
        setLocalDifficulty(null);
    };


    // --- RENDER ---
    if (!gameState) return <div className="text-white p-4 font-mono animate-pulse">Connecting to Matrix...</div>;

    // MENU SCREEN
    if (gameState.status === 'MENU') {
        const diffs = ['BEGINNER', 'MEDIUM', 'HARD', 'EXPERT', 'IMPOSSIBLE'];
        return (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-auto cursor-auto space-y-8 select-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-950 via-slate-950 to-black">

                <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-500">
                    <span className="text-8xl leading-none mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">🔴</span>
                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-t from-pink-600 to-red-400 tracking-tighter filter drop-shadow-[0_0_20px_rgba(236,72,153,0.5)] mb-2 italic transform -skew-x-6">
                        NEON CONNECT
                    </h1>
                    <p className="text-pink-400 font-mono font-bold tracking-[0.5em] text-sm animate-pulse uppercase">Tactical Linkage</p>
                </div>

                <div className="w-full max-w-xs space-y-4 relative z-10">
                    <div className="w-full max-w-xs space-y-4">
                        {localDifficulty ? (
                            <div className="space-y-2 animate-in fade-in slide-in-from-right-8 bg-slate-900/50 p-6 rounded-xl border border-white/5 backdrop-blur-md">
                                <div className="text-white font-bold mb-4 uppercase tracking-widest text-xs text-center">Select AI Level</div>
                                {diffs.map(d => (
                                    <button key={d} onClick={() => setMode('SOLO', d)} className={`w-full py-3 rounded-lg font-black text-white text-xs uppercase tracking-widest transition-all hover:scale-105 border border-white/10 ${d === 'BEGINNER' ? 'bg-green-600 shadow-[0_0_10px_rgba(22,163,74,0.4)]' :
                                        d === 'MEDIUM' ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]' :
                                            d === 'HARD' ? 'bg-orange-600 shadow-[0_0_10px_rgba(234,88,12,0.4)]' :
                                                d === 'EXPERT' ? 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.4)]' : 'bg-slate-900 border-red-500 shadow-[0_0_15px_red]'
                                        }`}>
                                        {d}
                                    </button>
                                ))}
                                <button onClick={() => setLocalDifficulty(false)} className="w-full mt-4 text-[10px] text-slate-500 hover:text-white uppercase tracking-widest border-t border-white/10 pt-2">Back</button>
                            </div>
                        ) : (
                            <>
                                <button onClick={() => setLocalDifficulty(true)} className="w-full py-4 bg-slate-800 border-2 border-slate-600 hover:border-pink-500 rounded-xl font-bold text-white transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-3 group">
                                    <span className="text-2xl group-hover:rotate-12 transition-transform">🤖</span>
                                    <span>SOLO PRACTICE</span>
                                </button>
                                <button onClick={() => setMode('PVP')} className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl font-bold text-white transition-all hover:scale-105 shadow-[0_0_20px_rgba(219,39,119,0.4)] flex items-center justify-center gap-3">
                                    <span className="text-2xl">⚔️</span>
                                    <span>VS PLAYER</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <button onClick={onBack} className="mt-8 text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest">EXIT ARCADE</button>
            </div>
        );
    }

    // ... REST OF THE GAME (Winning Indicies / Render) ...

    const myColor = isHost ? 'red' : 'yellow';
    const isMyTurn = gameState.turn === myColor;
    const playersCount = gameState.players ? Object.keys(gameState.players).length : 0;
    const opponentReady = playersCount >= 2;

    const getWinningIndices = (board) => {
        const b = safeBoard(board);
        const indices = [];
        const pieces = ['red', 'yellow'];
        for (const p of pieces) {
            // Horizontal
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS - 3; c++) {
                    const idx = r * COLS + c;
                    if (b[idx] === p && b[idx + 1] === p && b[idx + 2] === p && b[idx + 3] === p) {
                        indices.push(idx, idx + 1, idx + 2, idx + 3);
                    }
                }
            }
            // Vertical
            for (let r = 0; r < ROWS - 3; r++) {
                for (let c = 0; c < COLS; c++) {
                    const idx = r * COLS + c;
                    if (b[idx] === p && b[idx + COLS] === p && b[idx + COLS * 2] === p && b[idx + COLS * 3] === p) {
                        indices.push(idx, idx + COLS, idx + COLS * 2, idx + COLS * 3);
                    }
                }
            }
            // Diag Pos
            for (let r = 0; r < ROWS - 3; r++) {
                for (let c = 0; c < COLS - 3; c++) {
                    const idx = r * COLS + c;
                    if (b[idx] === p && b[idx + COLS + 1] === p && b[idx + COLS * 2 + 2] === p && b[idx + COLS * 3 + 3] === p) {
                        indices.push(idx, idx + COLS + 1, idx + COLS * 2 + 2, idx + COLS * 3 + 3);
                    }
                }
            }
            // Diag Neg
            for (let r = 3; r < ROWS; r++) {
                for (let c = 0; c < COLS - 3; c++) {
                    const idx = r * COLS + c;
                    if (b[idx] === p && b[idx - COLS + 1] === p && b[idx - COLS * 2 + 2] === p && b[idx - COLS * 3 + 3] === p) {
                        indices.push(idx, idx - COLS + 1, idx - COLS * 2 + 2, idx - COLS * 3 + 3);
                    }
                }
            }
        }
        return [...new Set(indices)];
    };

    const winningIndices = gameState ? getWinningIndices(gameState.board) : [];

    return (
        <div className="flex flex-col items-center gap-2 p-2 select-none overflow-hidden h-full font-mono w-full max-w-sm mx-auto">
            <style>{`
                @keyframes dropIn {
                    0% { transform: translateY(var(--drop-start)); opacity: 0; }
                    20% { opacity: 1; }
                    60% { transform: translateY(0); }
                    80% { transform: translateY(-10%); }
                    100% { transform: translateY(0); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-2px) rotate(-1deg); }
                    75% { transform: translateX(2px) rotate(1deg); }
                }
                .animate-drop {
                    animation: dropIn 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out;
                }
            `}</style>


            {/* Header */}
            <div className="flex justify-between items-center w-full px-4 mb-2">
                <div className="flex gap-2">
                    <button onClick={onBack} className="text-xs text-slate-400 hover:text-white">EXIT</button>
                    <button onClick={() => updateState({ status: 'MENU', board: Array(ROWS * COLS).fill(null), winner: null })} className="text-xs text-red-400 hover:text-white">🔄</button>
                </div>
                <div className="text-[10px] font-bold text-slate-400">
                    {gameState.status === 'WAITING' ? 'WAITING FOR PLAYERS' :
                        gameState.status === 'FINISHED' ? 'GAME OVER' : 'MATCH LIVE'}
                </div>
            </div>

            {/* Turn Indicator */}
            <div className="flex items-center gap-4 bg-black/40 px-5 py-2 rounded-full border border-white/5 shadow-lg mb-2">
                <div className={`flex flex-col items-center transition-all duration-300 ${gameState.turn === 'red' ? 'opacity-100 scale-110' : 'opacity-40'}`}>
                    <div className="w-4 h-4 rounded-full bg-pink-500 shadow-[0_0_10px_#ec4899] ring-2 ring-white/10 mb-1" />
                    <span className="text-[8px] text-pink-500 font-bold">P1 (RED)</span>
                </div>

                <div className="w-px h-6 bg-white/10" />

                <div className={`flex flex-col items-center transition-all duration-300 ${gameState.turn === 'yellow' ? 'opacity-100 scale-110' : 'opacity-40'}`}>
                    <div className="w-4 h-4 rounded-full bg-yellow-400 shadow-[0_0_10px_#facc15] ring-2 ring-white/10 mb-1" />
                    <span className="text-[8px] text-yellow-400 font-bold">P2 (YEL)</span>
                </div>
            </div>

            <div className="text-xs font-bold mb-2 animate-pulse">
                {gameState.status === 'WAITING' ? (
                    isHost ? (opponentReady ? "OPPONENT DETECTED. START WHEN READY." : "WAITING FOR OPPONENT...") : "WAITING FOR HOST TO START..."
                ) : gameState.status === 'FINISHED' ? (
                    "MATCH CONCLUDED"
                ) : (
                    isMyTurn ? <span className="text-green-400">YOUR TURN</span> : <span className="text-slate-500">OPPONENT THINKING...</span>
                )}
            </div>

            {/* Drop Inputs */}
            {gameState.status === 'PLAYING' && (
                <div className="grid grid-cols-7 gap-1 px-1 w-full max-w-[280px]">
                    {[0, 1, 2, 3, 4, 5, 6].map(c => (
                        <button
                            key={c}
                            onClick={() => handleDrop(c)}
                            disabled={!isMyTurn}
                            className={`w-full h-6 flex items-center justify-center rounded-t-lg transition-all ${isMyTurn ? 'bg-white/10 hover:bg-white/20 text-white cursor-pointer' : 'opacity-0 pointer-events-none'}`}
                        >
                            <span className="text-[8px]">▼</span>
                        </button>
                    ))}
                </div>
            )}

            {/* The Grid */}
            <div className={`bg-slate-800 p-2.5 rounded-xl shadow-2xl border-4 border-slate-700 w-full max-w-[280px] min-h-[240px] relative ${boardShakeRef.current} transition-transform`}>
                {/* Pre-Game Overlay */}
                {gameState.status === 'WAITING' && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg">
                        {isHost ? (
                            <button
                                onClick={handleStart}
                                className={`px-6 py-3 rounded font-bold text-white shadow-lg transition-all ${opponentReady ? 'bg-green-600 hover:scale-105' : 'bg-slate-600 opacity-50 cursor-not-allowed'}`}
                            >
                                START MATCH
                            </button>
                        ) : (
                            <div className="text-yellow-400 font-bold animate-pulse">READY</div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-7 gap-1.5">
                    {safeBoard(gameState.board).map((cell, i) => {
                        const isWinningPiece = winningIndices.includes(i);
                        const row = Math.floor(i / COLS);
                        const dropStart = `-${(row + 1) * 120}%`;

                        return (
                            <div
                                key={i}
                                className="aspect-square rounded-full border border-slate-900/50 flex items-center justify-center bg-slate-950 relative shadow-inner"
                            >
                                {cell && (
                                    <div
                                        style={{ '--drop-start': dropStart }}
                                        className={`w-[85%] h-[85%] rounded-full shadow-lg ${cell === 'red'
                                            ? 'bg-gradient-to-br from-pink-400 to-pink-600 shadow-[0_0_8px_#ec4899]'
                                            : 'bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-[0_0_8px_#facc15]'
                                            } animate-drop ${isWinningPiece ? 'ring-4 ring-white animate-pulse brightness-125 z-10' : ''}`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Standard Game End Overlay */}
                {gameState.status === 'FINISHED' && (
                    <GameEndOverlay
                        winner={gameState.winner === 'draw' ? null : (gameState.winner === 'red' && isHost) || (gameState.winner === 'yellow' && !isHost)}
                        isDraw={gameState.winner === 'draw'}
                        score={gameState.winner === 'draw' ? 'DRAW' : (gameState.winner === 'red' ? 'RED WINS' : 'YELLOW WINS')}
                        onRestart={() => isHost && handleReset()}
                        onExit={() => {
                            updateState({ status: 'MENU', board: Array(ROWS * COLS).fill(null), winner: null });
                            onBack(); // Optional: Return to arcade menu
                        }}
                        isHost={isHost}
                    />
                )}
            </div>
        </div>
    );
}
