/**
 * Connect4.jsx - COMPLETE REWRITE
 * Clean architecture: Pure functions for game logic, simple React for UI
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRealtimeGame } from '../../hooks/useRealtimeGame';
import GameEndOverlay from './GameEndOverlay';
import confetti from 'canvas-confetti';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const ROWS = 6;
const COLS = 7;
const CELL_COUNT = ROWS * COLS;

const PLAYER = { RED: 'red', YELLOW: 'yellow' };
const STATUS = { MENU: 'MENU', WAITING: 'WAITING', PLAYING: 'PLAYING', FINISHED: 'FINISHED' };
const MODE = { SOLO: 'SOLO', PVP: 'PVP' };
const DIFFICULTY = { BEGINNER: 1, MEDIUM: 2, HARD: 3, EXPERT: 4, IMPOSSIBLE: 5 };

const INITIAL_STATE = {
    board: null,
    turn: PLAYER.RED,
    winner: null,
    winningCells: [],
    status: STATUS.MENU,
    mode: MODE.PVP,
    difficulty: 'MEDIUM',
    scores: { red: 0, yellow: 0 },
    lastMove: null
};

// ═══════════════════════════════════════════════════════════════
// PURE GAME LOGIC (no React, no side effects)
// ═══════════════════════════════════════════════════════════════

/** Create empty board */
const createBoard = () => Array(CELL_COUNT).fill(null);

/** Firebase sometimes converts arrays to objects - normalize */
const normalizeBoard = (b) => {
    if (!b) return createBoard();
    if (Array.isArray(b) && b.length === CELL_COUNT) return b;
    const arr = createBoard();
    if (typeof b === 'object') {
        Object.entries(b).forEach(([k, v]) => {
            const idx = parseInt(k);
            if (!isNaN(idx) && idx >= 0 && idx < CELL_COUNT) arr[idx] = v;
        });
    }
    return arr;
};

/** Get the row where a piece would land in a column (-1 if full) */
const getDropRow = (board, col) => {
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row * COLS + col] === null) return row;
    }
    return -1;
};

/** Get all columns that aren't full */
const getValidColumns = (board) => {
    const valid = [];
    for (let col = 0; col < COLS; col++) {
        if (board[col] === null) valid.push(col);
    }
    return valid;
};

/** Check if board is valid (no floating pieces) */
const isBoardValid = (board) => {
    for (let col = 0; col < COLS; col++) {
        let foundEmpty = false;
        for (let row = ROWS - 1; row >= 0; row--) {
            const cell = board[row * COLS + col];
            if (cell === null) foundEmpty = true;
            else if (foundEmpty) return false;
        }
    }
    return true;
};

/** Check for winner - returns { winner, cells } or null */
const checkWinner = (board) => {
    const check4 = (indices) => {
        const p = board[indices[0]];
        return p && indices.every(i => board[i] === p) ? { winner: p, cells: indices } : null;
    };

    // Horizontal
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c <= COLS - 4; c++) {
            const i = r * COLS + c;
            const result = check4([i, i + 1, i + 2, i + 3]);
            if (result) return result;
        }
    }
    // Vertical
    for (let r = 0; r <= ROWS - 4; r++) {
        for (let c = 0; c < COLS; c++) {
            const i = r * COLS + c;
            const result = check4([i, i + COLS, i + COLS * 2, i + COLS * 3]);
            if (result) return result;
        }
    }
    // Diagonal ↘
    for (let r = 0; r <= ROWS - 4; r++) {
        for (let c = 0; c <= COLS - 4; c++) {
            const i = r * COLS + c;
            const step = COLS + 1;
            const result = check4([i, i + step, i + step * 2, i + step * 3]);
            if (result) return result;
        }
    }
    // Diagonal ↙
    for (let r = 3; r < ROWS; r++) {
        for (let c = 0; c <= COLS - 4; c++) {
            const i = r * COLS + c;
            const step = -COLS + 1;
            const result = check4([i, i + step, i + step * 2, i + step * 3]);
            if (result) return result;
        }
    }
    // Draw
    if (board.every(c => c !== null)) return { winner: 'draw', cells: [] };
    return null;
};

/** Drop a piece and return new board (immutable) */
const dropPiece = (board, col, player) => {
    const row = getDropRow(board, col);
    if (row === -1) return null;
    const newBoard = [...board];
    newBoard[row * COLS + col] = player;
    return { board: newBoard, index: row * COLS + col };
};


// ═══════════════════════════════════════════════════════════════
// AI LOGIC (Optimized Minimax with Alpha-Beta)
// ═══════════════════════════════════════════════════════════════

/** Evaluate a window of 4 cells efficiently */
const evaluateWindow = (c1, c2, c3, c4, player) => {
    let score = 0;
    const opp = player === PLAYER.YELLOW ? PLAYER.RED : PLAYER.YELLOW;
    
    let own = 0;
    let empty = 0;
    let enemy = 0;

    if (c1 === player) own++; else if (c1 === null) empty++; else enemy++;
    if (c2 === player) own++; else if (c2 === null) empty++; else enemy++;
    if (c3 === player) own++; else if (c3 === null) empty++; else enemy++;
    if (c4 === player) own++; else if (c4 === null) empty++; else enemy++;

    if (own === 4) return 100;
    if (own === 3 && empty === 1) return 5;
    if (own === 2 && empty === 2) return 2;
    // Heavily penalize letting opponent get 3 (blocking)
    if (enemy === 3 && empty === 1) return -80; 
    
    return 0;
};

/** Optimized board evaluator - no allocations */
const evaluateBoard = (board, player) => {
    let score = 0;

    // Center column preference (multiply by 3)
    let centerCount = 0;
    for (let r = 0; r < ROWS; r++) {
        if (board[r * COLS + 3] === player) centerCount++;
    }
    score += centerCount * 3;

    // Horizontal
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c <= COLS - 4; c++) {
            const i = r * COLS + c;
            score += evaluateWindow(board[i], board[i+1], board[i+2], board[i+3], player);
        }
    }

    // Vertical
    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r <= ROWS - 4; r++) {
            const i = r * COLS + c;
            score += evaluateWindow(board[i], board[i+COLS], board[i+COLS*2], board[i+COLS*3], player);
        }
    }

    // Diagonal 1 (\)
    for (let r = 0; r <= ROWS - 4; r++) {
        for (let c = 0; c <= COLS - 4; c++) {
            const i = r * COLS + c;
            const s = COLS + 1;
            score += evaluateWindow(board[i], board[i+s], board[i+s*2], board[i+s*3], player);
        }
    }

    // Diagonal 2 (/)
    for (let r = 0; r <= ROWS - 4; r++) {
        for (let c = 3; c < COLS; c++) {
            const i = r * COLS + c;
            const s = COLS - 1;
            score += evaluateWindow(board[i], board[i+s], board[i+s*2], board[i+s*3], player);
        }
    }

    return score;
};

/** 
 * Minimax with backtracking (mutating board) to avoid GC thrashing 
 * Returns [column, score]
 */
const minimax = (board, depth, alpha, beta, maximizing) => {
    // Check terminal states
    const winner = checkWinner(board);
    if (winner) {
        if (winner.winner === PLAYER.YELLOW) return [null, 100000 + depth];
        if (winner.winner === PLAYER.RED) return [null, -100000 - depth];
        return [null, 0]; // Draw
    }
    if (depth === 0) return [null, evaluateBoard(board, PLAYER.YELLOW)];

    // Get valid locations
    const validCols = [];
    for (let c = 0; c < COLS; c++) {
        if (board[c] === null) validCols.push(c);
    }
    
    // Shuffle columns for randomness in ties, then sort by center proximity
    validCols.sort((a, b) => Math.abs(a - 3) - Math.abs(b - 3));

    if (validCols.length === 0) return [null, 0];

    if (maximizing) {
        let maxEval = -Infinity;
        let bestCol = validCols[Math.floor(Math.random() * validCols.length)];

        for (const col of validCols) {
            // Make move (mutate)
            const row = getDropRow(board, col);
            board[row * COLS + col] = PLAYER.YELLOW;

            const [, evalScore] = minimax(board, depth - 1, alpha, beta, false);

            // Undo move (backtrack)
            board[row * COLS + col] = null;

            if (evalScore > maxEval) {
                maxEval = evalScore;
                bestCol = col;
            }
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return [bestCol, maxEval];
    } else {
        let minEval = Infinity;
        let bestCol = validCols[Math.floor(Math.random() * validCols.length)];

        for (const col of validCols) {
            // Make move (mutate)
            const row = getDropRow(board, col);
            board[row * COLS + col] = PLAYER.RED;

            const [, evalScore] = minimax(board, depth - 1, alpha, beta, true);

            // Undo move (backtrack)
            board[row * COLS + col] = null;

            if (evalScore < minEval) {
                minEval = evalScore;
                bestCol = col;
            }
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return [bestCol, minEval];
    }
};

const getAIMove = (board, difficulty) => {
    try {
        const depth = DIFFICULTY[difficulty] || 2;
        // Clone board once for the simulation to avoid mutating state directly
        const simBoard = [...board]; 
        
        // Use optimized random fallback if empty
        if (simBoard.every(c => c === null)) return 3; // Start center

        const [col] = minimax(simBoard, depth, -Infinity, Infinity, true);
        
        // Fallback safety
        if (col === null) {
            const valid = getValidColumns(board);
            return valid[Math.floor(Math.random() * valid.length)];
        }
        return col;
    } catch (err) {
        console.error("AI Error:", err);
        // Emergency fallback
        const valid = getValidColumns(board);
        return valid.length > 0 ? valid[0] : null;
    }
};

// ═══════════════════════════════════════════════════════════════
// REACT COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function Connect4({ sessionId, onBack }) {
    const gameId = 'connect4_v6';
    const { gameState, playerId, isHost, updateState } = useRealtimeGame(sessionId, gameId, INITIAL_STATE);

    const [hoveredCol, setHoveredCol] = useState(null);
    const [showDiffMenu, setShowDiffMenu] = useState(false);
    const aiTimer = useRef(null);
    const mounted = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            if (aiTimer.current) clearTimeout(aiTimer.current);
        };
    }, []);

    // Derive state safely
    const board = useMemo(() => normalizeBoard(gameState?.board), [gameState?.board]);
    const myColor = isHost ? PLAYER.RED : PLAYER.YELLOW;
    const isMyTurn = gameState?.turn === myColor;
    const winningSet = useMemo(() => new Set(gameState?.winningCells || []), [gameState?.winningCells]);

    // Auto-reset corrupted board
    useEffect(() => {
        if (gameState?.status === STATUS.PLAYING && !isBoardValid(board)) {
            console.warn('[Connect4] Invalid board state - resetting');
            updateState({ ...INITIAL_STATE, status: STATUS.MENU });
        }
    }, [board, gameState?.status, updateState]);

    // AI turn
    useEffect(() => {
        if (!gameState || gameState.mode !== MODE.SOLO || gameState.status !== STATUS.PLAYING) return;
        if (gameState.turn !== PLAYER.YELLOW) return;

        aiTimer.current = setTimeout(() => {
            if (!mounted.current) return;

            const col = getAIMove(board, gameState.difficulty);
            if (col === null) return;

            const drop = dropPiece(board, col, PLAYER.YELLOW);
            if (!drop) return;

            const result = checkWinner(drop.board);
            const scores = { ...gameState.scores };
            if (result?.winner === PLAYER.YELLOW) scores.yellow++;

            updateState({
                board: drop.board,
                turn: PLAYER.RED,
                winner: result?.winner || null,
                winningCells: result?.cells || [],
                status: result ? STATUS.FINISHED : STATUS.PLAYING,
                lastMove: drop.index
            });
        }, 600);

        return () => clearTimeout(aiTimer.current);
    }, [gameState?.turn, gameState?.status, gameState?.mode, board, updateState]);

    // Win celebration
    useEffect(() => {
        if (gameState?.winner && gameState.winner !== 'draw') {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
    }, [gameState?.winner]);

    // Handlers
    const handleDrop = useCallback((col) => {
        if (!gameState || gameState.status !== STATUS.PLAYING) return;
        if (gameState.mode === MODE.PVP && !isMyTurn) return;
        if (gameState.mode === MODE.SOLO && gameState.turn !== PLAYER.RED) return;

        const drop = dropPiece(board, col, gameState.turn);
        if (!drop) return;

        const result = checkWinner(drop.board);
        const nextTurn = gameState.turn === PLAYER.RED ? PLAYER.YELLOW : PLAYER.RED;
        const scores = { ...gameState.scores };
        if (result?.winner === PLAYER.RED) scores.red++;
        if (result?.winner === PLAYER.YELLOW) scores.yellow++;

        updateState({
            board: drop.board,
            turn: nextTurn,
            winner: result?.winner || null,
            winningCells: result?.cells || [],
            status: result ? STATUS.FINISHED : STATUS.PLAYING,
            lastMove: drop.index
        });
    }, [gameState, board, isMyTurn, updateState]);

    const startGame = useCallback((mode, diff = 'MEDIUM') => {
        updateState({
            board: createBoard(),
            turn: PLAYER.RED,
            winner: null,
            winningCells: [],
            status: mode === MODE.SOLO ? STATUS.PLAYING : STATUS.WAITING,
            mode,
            difficulty: diff,
            scores: { red: 0, yellow: 0 },
            lastMove: null
        });
        setShowDiffMenu(false);
    }, [updateState]);

    const handleRematch = useCallback(() => {
        updateState({
            board: createBoard(),
            turn: PLAYER.RED,
            winner: null,
            winningCells: [],
            status: STATUS.PLAYING,
            lastMove: null
        });
    }, [updateState]);

    // Loading
    if (!gameState) {
        return <div className="flex items-center justify-center h-full text-white animate-pulse">Connecting...</div>;
    }

    const scores = gameState.scores || { red: 0, yellow: 0 };

    // ═══════════════════════════════════════════════════════════════
    // RENDER: MENU
    // ═══════════════════════════════════════════════════════════════
    if (gameState.status === STATUS.MENU) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-b from-slate-900 to-black">
                <div className="text-7xl mb-4 animate-bounce">🔴</div>
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-red-500 mb-2">
                    NEON CONNECT
                </h1>
                <p className="text-slate-500 text-sm mb-8">4-IN-A-ROW</p>

                <div className="w-full max-w-xs space-y-3">
                    {showDiffMenu ? (
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 space-y-2">
                            <div className="text-xs text-center text-slate-400 mb-3">SELECT AI LEVEL</div>
                            {Object.keys(DIFFICULTY).map(d => (
                                <button
                                    key={d}
                                    onClick={() => startGame(MODE.SOLO, d)}
                                    className={`w-full py-2.5 rounded-lg font-bold text-white text-sm hover:scale-[1.02] transition ${d === 'BEGINNER' ? 'bg-green-600' :
                                            d === 'MEDIUM' ? 'bg-blue-600' :
                                                d === 'HARD' ? 'bg-orange-600' :
                                                    d === 'EXPERT' ? 'bg-red-600' :
                                                        'bg-purple-900 border border-red-500'
                                        }`}
                                >
                                    {d}
                                </button>
                            ))}
                            <button onClick={() => setShowDiffMenu(false)} className="w-full text-sm text-slate-500 hover:text-white pt-2">
                                ← Back
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => setShowDiffMenu(true)}
                                className="w-full py-4 bg-slate-800 border border-slate-600 hover:border-pink-500 rounded-xl font-bold text-white"
                            >
                                🤖 VS COMPUTER
                            </button>
                            <button
                                onClick={() => startGame(MODE.PVP)}
                                className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl font-bold text-white shadow-lg"
                            >
                                ⚔️ VS PLAYER
                            </button>
                        </>
                    )}
                </div>
                <button onClick={onBack} className="mt-6 text-sm text-slate-600 hover:text-white">EXIT</button>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // RENDER: WAITING FOR OPPONENT
    // ═══════════════════════════════════════════════════════════════
    if (gameState.status === STATUS.WAITING) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="text-5xl mb-4 animate-pulse">⏳</div>
                <h2 className="text-xl font-bold text-white mb-2">Waiting for opponent...</h2>
                <p className="text-slate-500 text-sm mb-4">Share this session ID with a friend</p>
                {isHost && (
                    <button
                        onClick={() => updateState({ status: STATUS.PLAYING })}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-500"
                    >
                        Start Anyway
                    </button>
                )}
                <button onClick={() => updateState({ status: STATUS.MENU })} className="mt-4 text-sm text-slate-500 hover:text-white">
                    ← Back to Menu
                </button>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // RENDER: GAME FINISHED
    // ═══════════════════════════════════════════════════════════════
    if (gameState.status === STATUS.FINISHED) {
        const isWinner = gameState.winner === myColor;
        const isDraw = gameState.winner === 'draw';
        return (
            <GameEndOverlay
                winner={isWinner}
                score={isDraw ? null : (isWinner ? scores[myColor] : scores[myColor === PLAYER.RED ? PLAYER.YELLOW : PLAYER.RED])}
                title={isDraw ? 'DRAW!' : (isWinner ? 'YOU WIN!' : 'YOU LOSE')}
                onRestart={handleRematch}
                onExit={onBack}
            />
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // RENDER: GAMEPLAY
    // ═══════════════════════════════════════════════════════════════
    const previewRow = hoveredCol !== null ? getDropRow(board, hoveredCol) : -1;
    const canPlay = gameState.mode === MODE.SOLO ? gameState.turn === PLAYER.RED : isMyTurn;

    return (
        <div className="flex flex-col items-center h-full p-4 max-w-lg mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between w-full mb-4">
                <button onClick={onBack} className="text-xs text-slate-500 hover:text-white">EXIT</button>
                <button onClick={() => updateState({ status: STATUS.MENU })} className="text-xs text-pink-400 hover:text-pink-300">MENU</button>
            </div>

            {/* Scoreboard */}
            <div className="flex items-center justify-center gap-6 mb-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700 w-full">
                <div className={`text-center transition ${gameState.turn === PLAYER.RED ? 'scale-110' : 'opacity-50'}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 mx-auto mb-1 shadow-lg" />
                    <div className="text-xs text-slate-400">TEAM RED</div>
                    <div className="text-2xl font-black text-white">{scores.red}</div>
                </div>
                <div className="text-slate-600 font-bold">VS</div>
                <div className={`text-center transition ${gameState.turn === PLAYER.YELLOW ? 'scale-110' : 'opacity-50'}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 mx-auto mb-1 shadow-lg" />
                    <div className="text-xs text-slate-400">TEAM YELLOW</div>
                    <div className="text-2xl font-black text-white">{scores.yellow}</div>
                </div>
            </div>

            {/* Turn indicator */}
            <div className="text-center mb-3 text-sm font-bold">
                {gameState.mode === MODE.SOLO && gameState.turn === PLAYER.YELLOW ? (
                    <span className="text-yellow-400 animate-pulse">CPU THINKING...</span>
                ) : canPlay ? (
                    <span className="text-emerald-400">YOUR TURN</span>
                ) : (
                    <span className="text-slate-500">OPPONENT'S TURN</span>
                )}
            </div>

            {/* Drop buttons */}
            <div className="grid grid-cols-7 gap-1 mb-1">
                {Array(COLS).fill(0).map((_, col) => (
                    <button
                        key={col}
                        onClick={() => handleDrop(col)}
                        onMouseEnter={() => setHoveredCol(col)}
                        onMouseLeave={() => setHoveredCol(null)}
                        disabled={!canPlay || getDropRow(board, col) === -1}
                        className={`w-10 h-12 rounded-b-lg flex items-center justify-center text-white text-sm font-bold transition-all touch-manipulation ${canPlay && getDropRow(board, col) !== -1
                                ? 'bg-slate-700 hover:bg-slate-600 active:bg-slate-500'
                                : 'bg-slate-800/30 text-slate-600 cursor-not-allowed'
                            } ${hoveredCol === col ? 'bg-slate-600 scale-110' : ''}`}
                    >
                        ▼
                    </button>
                ))}
            </div>

            {/* Board */}
            <div className="grid grid-cols-7 gap-1 p-3 bg-slate-800 rounded-xl border-2 border-slate-700 shadow-xl">
                {board.map((cell, i) => {
                    const row = Math.floor(i / COLS);
                    const col = i % COLS;
                    const isWinning = winningSet.has(i);
                    const isLastMove = gameState.lastMove === i;
                    const showPreview = !cell && previewRow === row && hoveredCol === col && canPlay;

                    return (
                        <div
                            key={i}
                            className={`w-10 h-10 rounded-full border-2 border-slate-900/50 flex items-center justify-center bg-slate-950/80 ${isWinning ? 'ring-2 ring-white' : ''
                                }`}
                        >
                            {cell && (
                                <div className={`w-[85%] h-[85%] rounded-full transition-all animate-drop-bounce ${cell === PLAYER.RED
                                        ? 'bg-gradient-to-br from-pink-400 to-pink-600 shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.3),_inset_2px_2px_4px_rgba(255,255,255,0.3)]'
                                        : 'bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.3),_inset_2px_2px_4px_rgba(255,255,255,0.3)]'
                                    } ${isWinning ? 'animate-pulse scale-110 ring-4 ring-white/50' : ''} ${isLastMove ? 'ring-2 ring-white/50' : ''}`} />
                            )}
                            {showPreview && (
                                <div className={`w-[85%] h-[85%] rounded-full opacity-30 ${myColor === PLAYER.RED
                                        ? 'bg-gradient-to-br from-pink-400 to-pink-600'
                                        : 'bg-gradient-to-br from-yellow-300 to-yellow-500'
                                    }`} />
                            )}
                            {/* Plastic Highlight Overlay */}
                            <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),_inset_0_-2px_4px_rgba(0,0,0,0.3)] pointer-events-none" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
