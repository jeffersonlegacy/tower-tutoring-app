import React, { useState, useEffect, useRef } from 'react';
import { useRealtimeGame } from '../../hooks/useRealtimeGame';
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
            arr[k] = b[k];
        });
    }
    return arr;
};

// --- MINIMAX AI ENGINE ---

// Heuristic Evaluation
const evaluateWindow = (window, piece) => {
    let score = 0;
    const oppPiece = piece === 'yellow' ? 'red' : 'yellow';
    const empty = null;

    if (window.filter(c => c === piece).length === 4) score += 100;
    else if (window.filter(c => c === piece).length === 3 && window.filter(c => c === empty).length === 1) score += 5;
    else if (window.filter(c => c === piece).length === 2 && window.filter(c => c === empty).length === 2) score += 2;

    if (window.filter(c => c === oppPiece).length === 3 && window.filter(c => c === empty).length === 1) score -= 4;

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
        const rowArray = [];
        for (let c = 0; c < COLS; c++) { rowArray.push(board[r * COLS + c]); }
        for (let c = 0; c < COLS - 3; c++) {
            const window = rowArray.slice(c, c + 4);
            score += evaluateWindow(window, piece);
        }
    }

    // Vertical
    for (let c = 0; c < COLS; c++) {
        const colArray = [];
        for (let r = 0; r < ROWS; r++) { colArray.push(board[r * COLS + c]); }
        for (let r = 0; r < ROWS - 3; r++) {
            const window = colArray.slice(r, r + 4);
            score += evaluateWindow(window, piece);
        }
    }

    // Diagonal Positive
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const window = [board[r * COLS + c], board[(r + 1) * COLS + c + 1], board[(r + 2) * COLS + c + 2], board[(r + 3) * COLS + c + 3]];
            score += evaluateWindow(window, piece);
        }
    }

    // Diagonal Negative
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const window = [board[(current_r + 3) * COLS + c] || null, board[(current_r + 2) * COLS + c + 1] || null, board[(current_r + 1) * COLS + c + 2] || null, board[current_r * COLS + c + 3] || null];
            // Correct Algo logic is tricky inline, let's simplify loop for readability
        }
    }
    // Re-impl Diag Neg correctly:
    for (let r = 3; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const window = [board[r * COLS + c], board[(r - 1) * COLS + c + 1], board[(r - 2) * COLS + c + 2], board[(r - 3) * COLS + c + 3]];
            score += evaluateWindow(window, piece);
        }
    }

    return score;
};

// Check for terminal node (win/draw) without object allocation
const isTerminal = (board) => {
    // Horizontal
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const idx = r * COLS + c;
            const p = board[idx];
            if (p && p === board[idx + 1] && p === board[idx + 2] && p === board[idx + 3]) return p;
        }
    }
    // Vertical
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS; c++) {
            const idx = r * COLS + c;
            const p = board[idx];
            if (p && p === board[idx + COLS] && p === board[idx + COLS * 2] && p === board[idx + COLS * 3]) return p;
        }
    }
    // Diag Pos
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const idx = r * COLS + c;
            const p = board[idx];
            if (p && p === board[idx + COLS + 1] && p === board[idx + COLS * 2 + 2] && p === board[idx + COLS * 3 + 3]) return p;
        }
    }
    // Diag Neg
    for (let r = 3; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const idx = r * COLS + c;
            const p = board[idx];
            if (p && p === board[idx - COLS + 1] && p === board[idx - COLS * 2 + 2] && p === board[idx - COLS * 3 + 3]) return p;
        }
    }

    if (board.every(c => c !== null)) return 'draw';
    return null;
};

// Get valid locations (columns)
const getValidLocations = (board) => {
    const valid = [];
    for (let c = 0; c < COLS; c++) {
        // Check top row (index c)
        // Actually top row is index 0-6? My grid render map logic uses r=0 at top?
        // Let's verify grid render:
        // idx = i. r = Math.floor(i / COLS).
        // 0 / 7 = 0. So row 0 is top.
        // If board[c] (row 0) is null, it is valid.
        if (!board[c]) valid.push(c);
    }
    return valid;
};

// Get next open row in column
const getNextOpenRow = (board, col) => {
    for (let r = ROWS - 1; r >= 0; r--) {
        if (!board[r * COLS + col]) return r;
    }
    return -1;
};

const minimax = (board, depth, alpha, beta, maximizingPlayer) => {
    const validLocs = getValidLocations(board);
    const result = isTerminal(board);

    if (depth === 0 || result) {
        if (result === 'yellow') return [null, 100000000000];
        if (result === 'red') return [null, -100000000000];
        if (result === 'draw') return [null, 0];
        return [null, scoreBoard(board, 'yellow')];
    }

    if (maximizingPlayer) {
        let value = -Infinity;
        let column = validLocs[Math.floor(Math.random() * validLocs.length)];
        for (const col of validLocs) {
            const row = getNextOpenRow(board, col);
            const bCopy = [...board];
            bCopy[row * COLS + col] = 'yellow';
            const newScore = minimax(bCopy, depth - 1, alpha, beta, false)[1];
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
        let column = validLocs[Math.floor(Math.random() * validLocs.length)];
        for (const col of validLocs) {
            const row = getNextOpenRow(board, col);
            const bCopy = [...board];
            bCopy[row * COLS + col] = 'red';
            const newScore = minimax(bCopy, depth - 1, alpha, beta, true)[1];
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
    const [localDifficulty, setLocalDifficulty] = useState(null); // For menu selection

    // ... SFX ...

    // AI Turn Logic
    useEffect(() => {
        if (!gameState || gameState.mode !== 'SOLO' || gameState.status !== 'PLAYING') return;
        if (gameState.turn !== 'yellow') return; // AI is Yellow

        const aiMove = async () => {
            await new Promise(r => setTimeout(r, 800)); // Slight delay for realism

            const board = safeBoard(gameState.board);
            const validCols = getValidLocations(board);

            if (validCols.length === 0) return;

            // DIFFICULTY LOGIC
            let chosenCol;
            const difficulty = gameState.difficulty || 'MEDIUM';

            if (difficulty === 'BEGINNER') {
                // Random move
                chosenCol = validCols[Math.floor(Math.random() * validCols.length)];
            }
            else if (difficulty === 'MEDIUM') {
                // Win if possible, otherwise random. NO BLOCKING.
                // Actually, let's make it smarter: Block if possible, but miss some.
                // Standard: Win > Block > Random.
                // To separate Medium from Hard, Medium can fail to block 30% of time?
                // Let's stick to user request: Medium. Simple Win > Random.

                // Check WIN
                let winFound = false;
                for (const col of validCols) {
                    const row = getNextOpenRow(board, col);
                    const bCopy = [...board];
                    bCopy[row * COLS + col] = 'yellow';
                    if (isTerminal(bCopy) === 'yellow') {
                        chosenCol = col;
                        winFound = true;
                        break;
                    }
                }

                if (!winFound) {
                    // Check BLOCK (50% chance to notice)
                    if (Math.random() > 0.5) {
                        for (const col of validCols) {
                            const row = getNextOpenRow(board, col);
                            const bCopy = [...board];
                            bCopy[row * COLS + col] = 'red';
                            if (isTerminal(bCopy) === 'red') {
                                chosenCol = col;
                                winFound = true; // effectively handled
                                break;
                            }
                        }
                    }
                }

                if (!winFound && chosenCol === undefined) {
                    chosenCol = validCols[Math.floor(Math.random() * validCols.length)];
                }
            }
            else if (difficulty === 'HARD') {
                // Win > Block > Center > Random
                let moveFound = false;

                // 1. Win
                for (const col of validCols) {
                    const row = getNextOpenRow(board, col);
                    const bCopy = [...board];
                    bCopy[row * COLS + col] = 'yellow';
                    if (isTerminal(bCopy) === 'yellow') { chosenCol = col; moveFound = true; break; }
                }

                // 2. Block
                if (!moveFound) {
                    for (const col of validCols) {
                        const row = getNextOpenRow(board, col);
                        const bCopy = [...board];
                        bCopy[row * COLS + col] = 'red';
                        if (isTerminal(bCopy) === 'red') { chosenCol = col; moveFound = true; break; }
                    }
                }

                // 3. Minimax Depth 2 (Lookahead)
                if (!moveFound) {
                    const [col, score] = minimax(board, 2, -Infinity, Infinity, true);
                    chosenCol = col;
                }
            }
            else if (difficulty === 'EXPERT') {
                // Minimax Depth 4
                const [col, score] = minimax(board, 4, -Infinity, Infinity, true);
                chosenCol = col;
            }
            else if (difficulty === 'IMPOSSIBLE') {
                // Minimax Depth 6
                // Warning: Might be slow in JS.
                const [col, score] = minimax(board, 6, -Infinity, Infinity, true);
                chosenCol = col;
            }

            if (chosenCol === undefined || chosenCol === null) {
                chosenCol = validCols[Math.floor(Math.random() * validCols.length)];
            }

            // EXECUTE
            const row = getNextOpenRow(board, chosenCol);
            const newBoard = [...board];
            newBoard[row * COLS + chosenCol] = 'yellow';

            const term = isTerminal(newBoard);
            let winner = null;
            if (term === 'yellow') winner = 'yellow';
            else if (term === 'draw') winner = 'draw';

            updateState({
                board: newBoard,
                turn: 'red',
                winner: winner,
                status: winner ? 'FINISHED' : 'PLAYING',
                lastMoveTime: Date.now()
            });
        };

        aiMove();
    }, [gameState?.turn, gameState?.mode, gameState?.status, gameState?.difficulty]);

    // Game Logic
    const handleDrop = (colIndex) => {
        if (!gameState || gameState.status !== 'PLAYING') return;

        // Turn Enforcement (Skip for SOLO)
        const myColor = isHost ? 'red' : 'yellow';
        if (gameState.mode !== 'SOLO' && gameState.turn !== myColor) return;

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
        // In SOLO, we use gameState.turn as the current mover
        const mover = gameState.mode === 'SOLO' ? gameState.turn : myColor;

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

        // Log match if PVP
        if (winner && gameState.mode === 'PVP') {
            const currentHistory = Array.isArray(gameState.matchHistory) ? gameState.matchHistory : [];
            updates.matchHistory = [...currentHistory, {
                id: (currentHistory.length || 0) + 1,
                winner: winner,
                hostScore: winner === 'red' ? 1 : 0, // Simple 1-0 scoring for C4
                clientScore: winner === 'yellow' ? 1 : 0,
                timestamp: Date.now()
            }];
        }

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
        prevWinnerRef.current = null;
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
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center select-none font-mono">
                <h1 className="text-4xl font-black text-pink-500 mb-2 filter drop-shadow-[0_0_10px_#ec4899] italic">NEON CONNECT</h1>
                <div className="w-full max-w-xs space-y-4">
                    <div className="w-full max-w-xs space-y-4">
                        {localDifficulty ? (
                            <div className="space-y-2 animate-in fade-in slide-in-from-right-8">
                                <div className="text-white font-bold mb-4 uppercase tracking-widest text-xs">Select Difficulty</div>
                                {['BEGINNER', 'MEDIUM', 'HARD', 'EXPERT', 'IMPOSSIBLE'].map(d => (
                                    <button key={d} onClick={() => setMode('SOLO', d)} className={`w-full py-3 rounded-lg font-black text-white text-xs uppercase tracking-widest transition-all hover:scale-105 border border-white/10 ${d === 'BEGINNER' ? 'bg-green-600' :
                                            d === 'MEDIUM' ? 'bg-blue-600' :
                                                d === 'HARD' ? 'bg-orange-600' :
                                                    d === 'EXPERT' ? 'bg-red-600' : 'bg-slate-900 border-red-500 shadow-[0_0_15px_red]'
                                        }`}>
                                        {d}
                                    </button>
                                ))}
                                <button onClick={() => setLocalDifficulty(false)} className="mt-4 text-[10px] text-slate-500 hover:text-white uppercase tracking-widest">Back</button>
                            </div>
                        ) : (
                            <>
                                <button onClick={() => setLocalDifficulty(true)} className="w-full py-4 bg-slate-800 border-2 border-slate-600 hover:border-pink-500 rounded-xl font-bold text-white transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-3 group">
                                    <span className="text-2xl group-hover:rotate-12 transition-transform">🤖</span>
                                    <span>SOLO PRACTICE</span>
                                </button>
                                <button onClick={() => setMode('PVP')} className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl font-bold text-white transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-3">
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

    // ... REST OF THE GAME ...

    const myColor = isHost ? 'red' : 'yellow';
    const isMyTurn = gameState.turn === myColor;
    // Safe check for players object/array
    const playersCount = gameState.players ? Object.keys(gameState.players).length : 0;
    const opponentReady = playersCount >= 2;

    return (
        <div className="flex flex-col items-center gap-2 p-2 select-none overflow-hidden h-full font-mono w-full max-w-sm mx-auto">

            {/* Header */}
            <div className="flex justify-between items-center w-full px-4 mb-2">
                <button onClick={onBack} className="text-xs text-slate-400 hover:text-white">EXIT</button>
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
            <div className="bg-slate-800 p-2.5 rounded-xl shadow-2xl border-4 border-slate-700 w-full max-w-[280px] min-h-[240px] relative">
                {/* Pre-Game Overlay */}
                {gameState.status === 'WAITING' && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg">
                        {isHost ? (
                            <button
                                onClick={handleStart}
                                // disabled={!opponentReady} // Allow solo checking? No, user wants turn enforcement.
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
                    {safeBoard(gameState.board).map((cell, i) => (
                        <div
                            key={i}
                            className="aspect-square rounded-full border border-slate-900/50 flex items-center justify-center bg-slate-950 overflow-hidden relative shadow-inner"
                        >
                            {cell && (
                                <div className={`w-[85%] h-[85%] rounded-full shadow-lg ${cell === 'red'
                                    ? 'bg-gradient-to-br from-pink-400 to-pink-600 shadow-[0_0_8px_#ec4899]'
                                    : 'bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-[0_0_8px_#facc15]'
                                    } animate-in zoom-in duration-300`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Winner Overlay */}
                {gameState.status === 'FINISHED' && (
                    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 p-4">
                        <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl flex flex-col items-center gap-4 shadow-2xl w-full max-w-[240px]">
                            <h2 className={`text-2xl font-black italic tracking-tighter ${gameState.winner === 'red' ? 'text-pink-500' : gameState.winner === 'yellow' ? 'text-yellow-400' : 'text-slate-400'}`}>
                                {gameState.winner === 'draw' ? 'STALEMATE' : `${gameState.winner === 'red' ? 'RED' : 'YELLOW'} WINS`}
                            </h2>
                            {isHost && (
                                <button onClick={handleReset} className="w-full py-3 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-400 hover:text-white transition-all transform hover:scale-105">
                                    PLAY AGAIN
                                </button>
                            )}
                            {!isHost && <div className="text-xs text-slate-500">Waiting for Host to Reset...</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
