import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRealtimeGame } from '../../hooks/useRealtimeGame';
import GameEndOverlay from './GameEndOverlay';
import confetti from 'canvas-confetti';

const ROWS = 6;
const COLS = 7;

const createEmptyBoard = () => Array(ROWS * COLS).fill(null);

const INITIAL_STATE = {
    board: createEmptyBoard(),
    turn: 'red',
    winner: null,
    status: 'MENU',
    lastMoveTime: 0,
    lastMoveIndex: null, // Track last dropped piece for visual indicator
    mode: 'PVP',
    difficulty: 'MEDIUM',
    scores: { red: 0, yellow: 0 },
    winningCells: []
};

// Convert Firebase object to array (Firebase can convert arrays to objects)
const safeBoard = (b) => {
    if (!b) return createEmptyBoard();
    if (Array.isArray(b)) return b;
    const arr = createEmptyBoard();
    Object.keys(b).forEach(k => {
        const idx = parseInt(k);
        if (!isNaN(idx) && idx >= 0 && idx < arr.length) {
            arr[idx] = b[k];
        }
    });
    return arr;
};

// --- WIN DETECTION WITH CELL TRACKING ---
const checkWin = (board) => {
    const b = safeBoard(board);

    // Horizontal
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const idx = r * COLS + c;
            const p = b[idx];
            if (p && p === b[idx + 1] && p === b[idx + 2] && p === b[idx + 3]) {
                return { winner: p, cells: [idx, idx + 1, idx + 2, idx + 3] };
            }
        }
    }
    // Vertical
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS; c++) {
            const idx = r * COLS + c;
            const p = b[idx];
            if (p && p === b[idx + COLS] && p === b[idx + COLS * 2] && p === b[idx + COLS * 3]) {
                return { winner: p, cells: [idx, idx + COLS, idx + COLS * 2, idx + COLS * 3] };
            }
        }
    }
    // Diagonal ↘
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const idx = r * COLS + c;
            const p = b[idx];
            if (p && p === b[idx + COLS + 1] && p === b[idx + COLS * 2 + 2] && p === b[idx + COLS * 3 + 3]) {
                return { winner: p, cells: [idx, idx + COLS + 1, idx + COLS * 2 + 2, idx + COLS * 3 + 3] };
            }
        }
    }
    // Diagonal ↙
    for (let r = 3; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const idx = r * COLS + c;
            const p = b[idx];
            if (p && p === b[idx - COLS + 1] && p === b[idx - COLS * 2 + 2] && p === b[idx - COLS * 3 + 3]) {
                return { winner: p, cells: [idx, idx - COLS + 1, idx - COLS * 2 + 2, idx - COLS * 3 + 3] };
            }
        }
    }

    // Check draw
    if (b.every(cell => cell !== null)) {
        return { winner: 'draw', cells: [] };
    }

    return null;
};

// --- OPTIMIZED MINIMAX (reduced safeBoard calls) ---
const getValidCols = (board) => {
    const valid = [];
    for (let c = 0; c < COLS; c++) {
        if (board[c] === null) valid.push(c);
    }
    return valid;
};

const getDropRow = (board, col) => {
    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r * COLS + col] === null) return r;
    }
    return -1;
};

const evaluateWindow = (window, piece) => {
    const opp = piece === 'yellow' ? 'red' : 'yellow';
    const pCount = window.filter(c => c === piece).length;
    const eCount = window.filter(c => c === null).length;
    const oCount = window.filter(c => c === opp).length;

    if (pCount === 4) return 100;
    if (pCount === 3 && eCount === 1) return 5;
    if (pCount === 2 && eCount === 2) return 2;
    if (oCount === 3 && eCount === 1) return -4;
    return 0;
};

const scorePosition = (board, piece) => {
    let score = 0;

    // Center column preference
    for (let r = 0; r < ROWS; r++) {
        if (board[r * COLS + 3] === piece) score += 3;
    }

    // Horizontal
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const idx = r * COLS + c;
            score += evaluateWindow([board[idx], board[idx + 1], board[idx + 2], board[idx + 3]], piece);
        }
    }

    // Vertical
    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS - 3; r++) {
            const idx = r * COLS + c;
            score += evaluateWindow([board[idx], board[idx + COLS], board[idx + COLS * 2], board[idx + COLS * 3]], piece);
        }
    }

    // Diagonals
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const idx = r * COLS + c;
            score += evaluateWindow([board[idx], board[idx + COLS + 1], board[idx + COLS * 2 + 2], board[idx + COLS * 3 + 3]], piece);
        }
    }
    for (let r = 3; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const idx = r * COLS + c;
            score += evaluateWindow([board[idx], board[idx - COLS + 1], board[idx - COLS * 2 + 2], board[idx - COLS * 3 + 3]], piece);
        }
    }

    return score;
};

const minimax = (board, depth, alpha, beta, maximizing, moveCount) => {
    // Early termination for long games
    if (moveCount > 35 && depth > 3) depth = 3;

    const result = checkWin(board);
    if (result) {
        if (result.winner === 'yellow') return [null, 1000000 + depth];
        if (result.winner === 'red') return [null, -1000000 - depth];
        return [null, 0];
    }
    if (depth === 0) return [null, scorePosition(board, 'yellow')];

    const validCols = getValidCols(board);
    if (validCols.length === 0) return [null, 0];

    // Sort by center preference
    validCols.sort((a, b) => Math.abs(a - 3) - Math.abs(b - 3));

    if (maximizing) {
        let value = -Infinity, bestCol = validCols[0];
        for (const col of validCols) {
            const row = getDropRow(board, col);
            if (row === -1) continue;
            const idx = row * COLS + col;
            board[idx] = 'yellow';
            const [, newScore] = minimax(board, depth - 1, alpha, beta, false, moveCount + 1);
            board[idx] = null;
            if (newScore > value) { value = newScore; bestCol = col; }
            alpha = Math.max(alpha, value);
            if (alpha >= beta) break;
        }
        return [bestCol, value];
    } else {
        let value = Infinity, bestCol = validCols[0];
        for (const col of validCols) {
            const row = getDropRow(board, col);
            if (row === -1) continue;
            const idx = row * COLS + col;
            board[idx] = 'red';
            const [, newScore] = minimax(board, depth - 1, alpha, beta, true, moveCount + 1);
            board[idx] = null;
            if (newScore < value) { value = newScore; bestCol = col; }
            beta = Math.min(beta, value);
            if (alpha >= beta) break;
        }
        return [bestCol, value];
    }
};

export default function Connect4({ sessionId, onBack }) {
    const gameId = 'connect4_v4'; // Version bump for lastMoveIndex
    const { gameState, playerId, isHost, updateState } = useRealtimeGame(sessionId, gameId, INITIAL_STATE);
    const [localDifficulty, setLocalDifficulty] = useState(null);
    const [flashWin, setFlashWin] = useState(false);
    const [hoveredCol, setHoveredCol] = useState(null); // Column hover for preview
    const isMounted = useRef(true);
    const aiThinking = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // Win flash effect
    useEffect(() => {
        if (gameState?.winner && gameState.winner !== 'draw') {
            setFlashWin(true);
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } else {
            setFlashWin(false);
        }
    }, [gameState?.winner]);

    // AI Turn
    useEffect(() => {
        if (!gameState || gameState.mode !== 'SOLO' || gameState.status !== 'PLAYING') return;
        if (gameState.turn !== 'yellow' || aiThinking.current) return;

        aiThinking.current = true;

        const runAI = async () => {
            await new Promise(r => setTimeout(r, 500));
            if (!isMounted.current) return;

            const board = [...safeBoard(gameState.board)];
            const validCols = getValidCols(board);
            if (validCols.length === 0) { aiThinking.current = false; return; }

            const moveCount = board.filter(c => c !== null).length;
            const diff = gameState.difficulty || 'MEDIUM';
            const depthMap = { BEGINNER: 1, MEDIUM: 2, HARD: 3, EXPERT: 4, IMPOSSIBLE: 5 };
            const depth = depthMap[diff] || 2;

            let col;
            if (diff === 'BEGINNER') {
                col = validCols[Math.floor(Math.random() * validCols.length)];
            } else {
                [col] = minimax(board, depth, -Infinity, Infinity, true, moveCount);
            }

            if (col === null || !validCols.includes(col)) {
                col = [3, 2, 4, 1, 5, 0, 6].find(c => validCols.includes(c)) ?? validCols[0];
            }

            const row = getDropRow(board, col);
            if (row === -1) { aiThinking.current = false; return; }

            board[row * COLS + col] = 'yellow';
            const result = checkWin(board);

            const newScores = { ...gameState.scores };
            if (result?.winner === 'yellow') newScores.yellow++;

            updateState({
                board,
                turn: 'red',
                winner: result?.winner || null,
                winningCells: result?.cells || [],
                status: result ? 'FINISHED' : 'PLAYING',
                lastMoveTime: Date.now(),
                scores: newScores
            });

            aiThinking.current = false;
        };

        const timer = setTimeout(runAI, 100);
        return () => clearTimeout(timer);
    }, [gameState?.turn, gameState?.status, gameState?.mode, updateState]);

    const handleDrop = useCallback((col) => {
        if (!gameState || gameState.status !== 'PLAYING') return;

        const myColor = isHost ? 'red' : 'yellow';
        if (gameState.mode !== 'SOLO' && gameState.turn !== myColor) return;
        if (gameState.mode === 'SOLO' && gameState.turn !== 'red') return;

        const board = [...safeBoard(gameState.board)];
        const row = getDropRow(board, col);
        if (row === -1) return;

        const dropIndex = row * COLS + col;
        board[dropIndex] = gameState.turn;
        const result = checkWin(board);

        const newScores = { ...gameState.scores };
        if (result?.winner && result.winner !== 'draw') {
            newScores[result.winner]++;
        }

        updateState({
            board,
            turn: gameState.turn === 'red' ? 'yellow' : 'red',
            winner: result?.winner || null,
            winningCells: result?.cells || [],
            status: result ? 'FINISHED' : 'PLAYING',
            lastMoveTime: Date.now(),
            lastMoveIndex: dropIndex, // Track for visual pulse
            scores: newScores
        });
    }, [gameState, isHost, updateState]);

    const handleReset = useCallback(() => {
        updateState({
            board: createEmptyBoard(),
            turn: 'red',
            winner: null,
            winningCells: [],
            status: gameState.mode === 'SOLO' ? 'PLAYING' : 'WAITING',
            lastMoveTime: 0
        });
    }, [gameState?.mode, updateState]);

    const handleStart = useCallback(() => {
        updateState({ status: 'PLAYING' });
    }, [updateState]);

    const setMode = useCallback((mode, diff = 'MEDIUM') => {
        updateState({
            status: mode === 'SOLO' ? 'PLAYING' : 'WAITING',
            mode,
            turn: 'red',
            difficulty: diff,
            scores: { red: 0, yellow: 0 },
            board: createEmptyBoard(),
            winner: null,
            winningCells: []
        });
        setLocalDifficulty(null);
    }, [updateState]);

    const winningCells = useMemo(() =>
        new Set(gameState?.winningCells || []),
        [gameState?.winningCells]
    );

    if (!gameState) {
        return <div className="text-white p-4 font-mono animate-pulse">Connecting...</div>;
    }

    const scores = gameState.scores || { red: 0, yellow: 0 };
    const myColor = isHost ? 'red' : 'yellow';
    const isMyTurn = gameState.turn === myColor;
    const playersCount = gameState.players ? Object.keys(gameState.players).length : 0;
    const opponentReady = playersCount >= 2;

    // MENU
    if (gameState.status === 'MENU') {
        const diffs = ['BEGINNER', 'MEDIUM', 'HARD', 'EXPERT', 'IMPOSSIBLE'];
        const diffColors = {
            BEGINNER: 'bg-green-600', MEDIUM: 'bg-blue-600',
            HARD: 'bg-orange-600', EXPERT: 'bg-red-600', IMPOSSIBLE: 'bg-purple-900 border-2 border-red-500'
        };

        return (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 select-none bg-gradient-to-br from-pink-950 via-slate-950 to-black">
                <span className="text-8xl mb-4 animate-bounce">🔴</span>
                <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-t from-pink-600 to-red-400 tracking-tighter mb-2 italic">
                    NEON CONNECT
                </h1>
                <p className="text-pink-400 font-mono text-sm tracking-widest mb-8 animate-pulse">4-IN-A-ROW</p>

                <div className="w-full max-w-xs space-y-3">
                    {localDifficulty ? (
                        <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-white/10">
                            <div className="text-white font-bold text-xs text-center tracking-widest mb-3">AI LEVEL</div>
                            {diffs.map(d => (
                                <button
                                    key={d}
                                    onClick={() => setMode('SOLO', d)}
                                    className={`w-full py-2.5 rounded-lg font-bold text-white text-xs tracking-wide hover:scale-105 transition-all ${diffColors[d]}`}
                                >
                                    {d}
                                </button>
                            ))}
                            <button onClick={() => setLocalDifficulty(false)} className="w-full mt-2 text-xs text-slate-500 hover:text-white">← Back</button>
                        </div>
                    ) : (
                        <>
                            <button onClick={() => setLocalDifficulty(true)} className="w-full py-4 bg-slate-800 border-2 border-slate-600 hover:border-pink-500 rounded-xl font-bold text-white flex items-center justify-center gap-3 hover:scale-105 transition-all">
                                <span className="text-2xl">🤖</span> SOLO PRACTICE
                            </button>
                            <button onClick={() => setMode('PVP')} className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl font-bold text-white flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-lg">
                                <span className="text-2xl">⚔️</span> VS PLAYER
                            </button>
                        </>
                    )}
                </div>
                <button onClick={onBack} className="mt-8 text-xs text-slate-500 hover:text-white">EXIT</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-3 p-4 select-none h-full font-mono w-full max-w-lg mx-auto">
            <style>{`
                @keyframes dropIn {
                    0% { transform: translateY(var(--drop-start)); opacity: 0; }
                    20% { opacity: 1; }
                    60% { transform: translateY(0); }
                    80% { transform: translateY(-8%); }
                    100% { transform: translateY(0); }
                }
                @keyframes winnerGlow {
                    0%, 100% { 
                        transform: scale(1.1); 
                        box-shadow: 0 0 20px 8px currentColor;
                        filter: brightness(1.3);
                    }
                    50% { 
                        transform: scale(1.25); 
                        box-shadow: 0 0 40px 15px currentColor;
                        filter: brightness(1.6);
                    }
                }
                @keyframes winnerBounce {
                    0%, 100% { transform: scale(1.15) translateY(0); }
                    50% { transform: scale(1.2) translateY(-10%); }
                }
                .animate-drop { animation: dropIn 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
                .winning-cell-red {
                    animation: winnerGlow 0.8s ease-in-out infinite, winnerBounce 0.8s ease-in-out infinite;
                    color: #ec4899;
                    z-index: 20;
                }
                .winning-cell-yellow {
                    animation: winnerGlow 0.8s ease-in-out infinite, winnerBounce 0.8s ease-in-out infinite;
                    color: #facc15;
                    z-index: 20;
                }
                .winning-cell-ring {
                    position: absolute;
                    inset: -8px;
                    border-radius: 999px;
                    border: 4px solid white;
                    animation: winnerGlow 0.8s ease-in-out infinite;
                }
                .non-winning-piece {
                    opacity: 0.3;
                    filter: grayscale(0.5);
                }
            `}</style>

            {/* Header */}
            <div className="flex justify-between items-center w-full">
                <div className="flex gap-3">
                    <button onClick={onBack} className="text-xs text-slate-400 hover:text-white">EXIT</button>
                    <button onClick={() => updateState({ status: 'MENU', board: createEmptyBoard(), winner: null, winningCells: [], scores: { red: 0, yellow: 0 } })} className="text-xs text-red-400 hover:text-white">MENU</button>
                </div>
                <div className="text-[10px] font-bold text-slate-400">
                    {gameState.status === 'WAITING' ? 'WAITING' : gameState.status === 'FINISHED' ? 'GAME OVER' : 'LIVE'}
                </div>
            </div>

            {/* SCOREBOARD - Team Red vs Team Yellow */}
            <div className="flex items-center gap-4 bg-black/50 px-4 py-3 rounded-xl border border-white/10 w-full max-w-md justify-center">
                <div className={`flex flex-col items-center transition-all ${gameState.turn === 'red' ? 'scale-110' : 'opacity-60'}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 shadow-[0_0_15px_#ec4899] ring-2 ring-white/20 mb-1 flex items-center justify-center">
                        {isHost && <span className="text-white text-xs font-black">YOU</span>}
                    </div>
                    <span className="text-pink-400 font-bold text-xs">TEAM RED</span>
                    <span className="text-white text-3xl font-black">{scores.red}</span>
                </div>

                <div className="text-slate-600 text-xl font-bold">VS</div>

                <div className={`flex flex-col items-center transition-all ${gameState.turn === 'yellow' ? 'scale-110' : 'opacity-60'}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-[0_0_15px_#facc15] ring-2 ring-white/20 mb-1 flex items-center justify-center">
                        {!isHost && <span className="text-slate-900 text-xs font-black">YOU</span>}
                    </div>
                    <span className="text-yellow-400 font-bold text-xs">TEAM YELLOW</span>
                    <span className="text-white text-3xl font-black">{scores.yellow}</span>
                </div>
            </div>

            {/* Turn Indicator */}
            <div className="text-sm font-bold">
                {gameState.status === 'WAITING' ? (
                    <span className="text-slate-400">
                        {isHost
                            ? (opponentReady ? "TEAM YELLOW READY - START!" : "WAITING FOR TEAM YELLOW...")
                            : "WAITING FOR TEAM RED TO START..."}
                    </span>
                ) : gameState.status === 'FINISHED' ? (
                    <span className={gameState.winner === 'red' ? 'text-pink-400' : 'text-yellow-400'}>
                        {gameState.winner === 'draw' ? 'DRAW!' : `TEAM ${gameState.winner?.toUpperCase()} WINS!`}
                    </span>
                ) : (
                    isMyTurn
                        ? <span className="text-green-400 animate-pulse">YOUR TURN</span>
                        : <span className="text-slate-500">{gameState.mode === 'SOLO' ? 'CPU THINKING...' : 'OPPONENT...'}</span>
                )}
            </div>

            {/* Drop Buttons with hover preview */}
            {gameState.status === 'PLAYING' && (
                <div className="grid grid-cols-7 gap-1.5 w-full max-w-md">
                    {[0, 1, 2, 3, 4, 5, 6].map(c => (
                        <button
                            key={c}
                            onClick={() => handleDrop(c)}
                            onMouseEnter={() => setHoveredCol(c)}
                            onMouseLeave={() => setHoveredCol(null)}
                            disabled={!isMyTurn && gameState.mode !== 'SOLO'}
                            className={`h-10 flex items-center justify-center rounded-t-lg transition-all ${isMyTurn || gameState.mode === 'SOLO'
                                ? `bg-white/10 hover:bg-white/30 text-white cursor-pointer ${hoveredCol === c ? 'scale-110 bg-white/25' : ''}`
                                : 'opacity-30 pointer-events-none'
                                }`}
                        >
                            <span className={`text-lg transition-transform ${hoveredCol === c ? 'animate-bounce' : ''}`}>▼</span>
                        </button>
                    ))}
                </div>
            )}

            {/* THE BOARD */}
            <div className="bg-slate-800 p-3 rounded-2xl shadow-2xl border-4 border-slate-700 w-full max-w-md relative">
                {/* Waiting Overlay */}
                {gameState.status === 'WAITING' && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 rounded-xl backdrop-blur-sm">
                        {isHost ? (
                            <button
                                onClick={handleStart}
                                disabled={!opponentReady}
                                className={`px-8 py-4 rounded-xl font-bold text-white text-lg transition-all ${opponentReady ? 'bg-green-600 hover:bg-green-500 hover:scale-105' : 'bg-slate-700 opacity-50 cursor-not-allowed'}`}
                            >
                                START MATCH
                            </button>
                        ) : (
                            <div className="text-yellow-400 font-bold text-lg animate-pulse">READY</div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-7 grid-rows-6 gap-2">
                    {safeBoard(gameState.board).map((cell, i) => {
                        const isWinning = winningCells.has(i);
                        const row = Math.floor(i / COLS);
                        const col = i % COLS;
                        const dropStart = `-${(row + 1) * 100}%`;
                        const isFinished = gameState.status === 'FINISHED';
                        const hasWinningCells = winningCells.size > 0;
                        const isLastMove = gameState.lastMoveIndex === i && !isFinished;

                        // Calculate if this cell should show ghost preview
                        const currentBoard = safeBoard(gameState.board);
                        const previewRow = hoveredCol !== null && col === hoveredCol ? getDropRow(currentBoard, hoveredCol) : -1;
                        const showGhost = !cell && previewRow === row && hoveredCol === col && (isMyTurn || gameState.mode === 'SOLO');
                        const myColor = isHost ? 'red' : 'yellow';

                        // Determine styling based on win state
                        let pieceClass = 'animate-drop ';
                        if (cell === 'red') {
                            pieceClass += 'bg-gradient-to-br from-pink-400 to-pink-600 ';
                            if (isWinning && isFinished) {
                                pieceClass += 'winning-cell-red shadow-[0_0_30px_#ec4899] ';
                            } else if (isFinished && hasWinningCells) {
                                pieceClass += 'non-winning-piece ';
                            } else {
                                pieceClass += 'shadow-[0_0_12px_#ec4899] ';
                            }
                        } else if (cell === 'yellow') {
                            pieceClass += 'bg-gradient-to-br from-yellow-300 to-yellow-500 ';
                            if (isWinning && isFinished) {
                                pieceClass += 'winning-cell-yellow shadow-[0_0_30px_#facc15] ';
                            } else if (isFinished && hasWinningCells) {
                                pieceClass += 'non-winning-piece ';
                            } else {
                                pieceClass += 'shadow-[0_0_12px_#facc15] ';
                            }
                        }

                        return (
                            <div
                                key={i}
                                className={`aspect-square rounded-full border-2 border-slate-900/50 flex items-center justify-center bg-slate-950 shadow-inner relative ${isWinning && isFinished ? 'z-10' : ''} ${showGhost ? 'bg-slate-900' : ''}`}
                            >
                                {/* Ghost preview piece */}
                                {showGhost && (
                                    <div className={`w-[85%] h-[85%] rounded-full opacity-40 ${myColor === 'red' ? 'bg-gradient-to-br from-pink-400 to-pink-600' : 'bg-gradient-to-br from-yellow-300 to-yellow-500'}`} />
                                )}

                                {cell && (
                                    <div
                                        style={{ '--drop-start': dropStart }}
                                        className={`w-[85%] h-[85%] rounded-full shadow-lg ${pieceClass}`}
                                    >
                                        {/* Last move pulse indicator */}
                                        {isLastMove && (
                                            <div className="absolute inset-[-4px] rounded-full border-2 border-white/60 animate-pulse" />
                                        )}
                                        {/* Winning ring indicator */}
                                        {isWinning && isFinished && (
                                            <div className="absolute inset-[-6px] rounded-full border-4 border-white animate-ping opacity-75" />
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Game End Overlay */}
                {gameState.status === 'FINISHED' && (
                    <GameEndOverlay
                        winner={gameState.winner === 'draw' ? null : (gameState.winner === 'red' && isHost) || (gameState.winner === 'yellow' && !isHost)}
                        isDraw={gameState.winner === 'draw'}
                        score={`RED ${scores.red} - ${scores.yellow} YELLOW`}
                        onRestart={() => isHost && handleReset()}
                        onExit={() => {
                            updateState({ status: 'MENU', board: createEmptyBoard(), winner: null, winningCells: [], scores: { red: 0, yellow: 0 } });
                        }}
                        isHost={isHost}
                    />
                )}
            </div>
        </div>
    );
}
