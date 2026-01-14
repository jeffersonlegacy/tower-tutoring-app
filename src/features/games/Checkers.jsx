import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMastery } from '../../context/MasteryContext';
import { 
    createBoard, getValidMoves, makeMove, getAIMove, 
    PLAYER, PIECE, BOARD_SIZE, getPieceOwner 
} from './checkers/CheckersLogic';
import confetti from 'canvas-confetti';

const STATUS = { MENU: 'MENU', PLAYING: 'PLAYING', GAME_OVER: 'GAME_OVER' };

export default function Checkers({ onBack }) {
    const { awardXP } = useMastery();
    const [board, setBoard] = useState(createBoard());
    const [turn, setTurn] = useState(PLAYER.WHITE); // Player (White) starts? Standard is Red usually starts, but let's say Player (White) goes first? Actually Standard: BLACK(Red) moves first.
    // Let's stick to: PLAYER starts (WHITE) for ease, or follow logic.
    // In Logic: RED = 1 (Top), WHITE = 2 (Bottom). Usually Bottom moves first.
    
    const [status, setStatus] = useState(STATUS.MENU);
    const [selectedIdx, setSelectedIdx] = useState(null);
    const [validMoves, setValidMoves] = useState([]);
    const [winner, setWinner] = useState(null);
    const [difficulty, setDifficulty] = useState(2); // Depth
    const [mustJumpPiece, setMustJumpPiece] = useState(null); // Track double-jump requirement

    // ═══════════════════════════════════════════════════════════════
    // GAME LOOP
    // ═══════════════════════════════════════════════════════════════

    // Calculate valid moves for current turn
    const currentMoves = useMemo(() => {
        if (status !== STATUS.PLAYING) return [];
        return getValidMoves(board, turn, mustJumpPiece);
    }, [board, turn, status, mustJumpPiece]);

    // Check Win Condition
    useEffect(() => {
        if (status === STATUS.PLAYING && currentMoves.length === 0) {
            // No moves = LOSE.
            const winner = turn === PLAYER.WHITE ? PLAYER.RED : PLAYER.WHITE;
            setWinner(winner);
            setStatus(STATUS.GAME_OVER);
            
            if (winner === PLAYER.WHITE) {
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                awardXP(50, 'Checkers Victory');
            }
        }
    }, [currentMoves, status, turn, awardXP]);

    // AI Turn (Red)
    useEffect(() => {
        if (status === STATUS.PLAYING && turn === PLAYER.RED) {
            const timer = setTimeout(() => {
                // If mustJumpPiece is set (from previous AI interval), we only look for that
                const moves = getValidMoves(board, PLAYER.RED, mustJumpPiece);

                // Simple AI Pick (Use minimax if no chain forced, else just grab the chain move)
                // If forced chain, minimax might not be needed (only one valid path typically), 
                // but checking depth is fine.
                let selectedMove = null;

                if (mustJumpPiece !== null) {
                   // If forced chain, just take the first/best one (simple for now)
                   // Or run minimax on reduced set?
                   // ValidMoves returns ONLY the chain jumps. 
                   // Let's just pick the best immediate jump to keep it fast.
                   selectedMove = moves[0]; // TODO: Evaluate if multiple jump paths exist?
                } else {
                    selectedMove = getAIMove(board, difficulty);
                }
                
                if (selectedMove) {
                    const nextBoard = makeMove(board, selectedMove);
                    setBoard(nextBoard);
                    
                    // DOUBLE JUMP CHECK FOR AI
                    if (selectedMove.isJump) {
                         const chainedJumps = getValidMoves(nextBoard, PLAYER.RED, selectedMove.to);
                         if (chainedJumps.length > 0) {
                             setMustJumpPiece(selectedMove.to);
                             // Do NOT change turn. Effect will run again because 'board' changed (or we force a tick)
                             // Wait, dependency array has 'board', so setBoard triggers re-run. 
                             // We stay as PLAYER.RED.
                             return; 
                         }
                    }

                    // End Turn
                    setMustJumpPiece(null);
                    setTurn(PLAYER.WHITE);
                } else {
                    // Start of game or no moves? If no moves, game over effect catches it.
                }
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [turn, status, board, difficulty, mustJumpPiece]);

    // ═══════════════════════════════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════════════════════════════

    const handleTileClick = (idx) => {
        if (status !== STATUS.PLAYING || turn !== PLAYER.WHITE) return; // Player only touches White (2)

        const piece = board[idx];
        const isMyPiece = getPieceOwner(piece) === PLAYER.WHITE;

        // SELECTION LOGIC
        if (isMyPiece) {
            // If we are in a double-jump chain, ONLY the active piece is clickable
            if (mustJumpPiece !== null && idx !== mustJumpPiece) return;

            // Determine valid moves for this piece
            // If mustJumpPiece is set, getValidMoves will return ONLY jumps for this piece
            const movesForPiece = currentMoves.filter(m => m.from === idx);
            
            if (movesForPiece.length > 0) {
                setSelectedIdx(idx);
                setValidMoves(movesForPiece);
            }
            return;
        }

        // MOVE EXECUTION
        if (selectedIdx !== null) {
            const move = validMoves.find(m => m.to === idx);
            if (move) {
                const nextBoard = makeMove(board, move);
                setBoard(nextBoard);
                setSelectedIdx(null);
                setValidMoves([]);

                // CHECK FOR DOUBLE JUMP
                if (move.isJump) {
                    // Check if SAME piece at NEW location (move.to) has more JUMPS
                    const chainedJumps = getValidMoves(nextBoard, turn, move.to);
                    if (chainedJumps.length > 0) {
                        // FORCE DOUBLE JUMP
                        setMustJumpPiece(move.to);
                        setSelectedIdx(move.to); // Auto-select for convenience
                        setValidMoves(chainedJumps);
                        // Turn NO change
                        return;
                    }
                }
                
                // Turn ENDS
                setMustJumpPiece(null);
                setTurn(PLAYER.RED);
            } else {
                // Deselect if clicking invalid empty (only if not forced)
                if (mustJumpPiece === null) {
                    setSelectedIdx(null);
                    setValidMoves([]);
                }
            }
        }
    };

    const startGame = (diff) => {
        setBoard(createBoard());
        setTurn(PLAYER.WHITE); // Player goes first
        setWinner(null);
        setStatus(STATUS.PLAYING);
        setDifficulty(diff);
        setMustJumpPiece(null);
        setSelectedIdx(null);
        setValidMoves([]);
    };

    // ═══════════════════════════════════════════════════════════════
    // RENDER HELPERS
    // ═══════════════════════════════════════════════════════════════

    const getTileColor = (i) => {
        const r = Math.floor(i / BOARD_SIZE);
        const c = i % BOARD_SIZE;
        return (r + c) % 2 === 1 ? 'bg-slate-800' : 'bg-slate-200';
    };

    const getPieceRender = (p) => {
        if (p === 0) return null;
        const isKing = p >= 3;
        const color = (p === 1 || p === 3) ? 'bg-rose-500 shadow-rose-500/50' : 'bg-slate-100 shadow-white/50';
        const ring = (p === 1 || p === 3) ? 'ring-rose-900' : 'ring-slate-300';
        
        return (
            <div className={`w-[80%] h-[80%] rounded-full shadow-lg ${color} ring-4 ${ring} flex items-center justify-center transform transition-all`}>
                <div className={`w-[70%] h-[70%] rounded-full border-2 ${p === 1 || p === 3 ? 'border-rose-900/30' : 'border-slate-400/30'}`} />
                {isKing && <span className="absolute text-2xl">👑</span>}
            </div>
        );
    };

    // ═══════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════

    if (status === STATUS.MENU) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-slate-950 text-white p-6 animate-fade-in">
                <div className="text-6xl mb-4">🛸</div>
                <h1 className="text-4xl font-black gradient-text mb-2">NEON CHECKERS</h1>
                <p className="text-slate-500 mb-8">Strategic Space Battle</p>

                <div className="space-y-3 w-full max-w-xs">
                    <button onClick={() => startGame(1)} className="w-full py-3 rounded-xl bg-emerald-600 font-bold hover:scale-105 transition">EASY</button>
                    <button onClick={() => startGame(3)} className="w-full py-3 rounded-xl bg-blue-600 font-bold hover:scale-105 transition">MEDIUM</button>
                    <button onClick={() => startGame(5)} className="w-full py-3 rounded-xl bg-purple-600 font-bold hover:scale-105 transition">HARD</button>
                </div>
                <button onClick={onBack} className="mt-8 text-slate-500 hover:text-white">← Exit</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-white/5">
                <button onClick={() => setStatus(STATUS.MENU)} className="text-slate-500 hover:text-white">← Menu</button>
                <div className="font-bold text-lg">
                    {turn === PLAYER.WHITE ? <span className="text-emerald-400">YOUR TURN</span> : <span className="text-rose-400">CPU THINKING...</span>}
                </div>
                <div className="w-8"></div>
            </div>

            {/* Board */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="aspect-square w-full max-w-md grid grid-cols-8 border-4 border-slate-700 rounded-lg overflow-hidden shadow-2xl bg-black">
                    {board.map((piece, i) => {
                        const isSelected = selectedIdx === i;
                        const isTarget = validMoves.some(m => m.to === i);
                        const isLastMove = false; // TODO: Add tracking

                        return (
                            <div 
                                key={i}
                                onClick={() => handleTileClick(i)}
                                className={`relative flex items-center justify-center ${getTileColor(i)} ${isTarget ? 'cursor-pointer ring-inset ring-4 ring-emerald-500/50' : ''}`}
                            >
                                {isTarget && <div className="absolute w-4 h-4 rounded-full bg-emerald-500 animate-pulse" />}
                                {getPieceRender(piece)}
                                {isSelected && <div className="absolute inset-0 bg-white/20 ring-inset ring-2 ring-white" />}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Overlay */}
            {status === STATUS.GAME_OVER && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-fade-in p-6 text-center">
                    <div className="text-6xl mb-4">{winner === PLAYER.WHITE ? '🏆' : '💀'}</div>
                    <h2 className="text-3xl font-black text-white mb-2">{winner === PLAYER.WHITE ? 'VICTORY' : 'DEFEAT'}</h2>
                    <p className="text-slate-400 mb-6">{winner === PLAYER.WHITE ? '+50 XP Earned!' : 'The AI outsmarted you.'}</p>
                    <button onClick={() => setStatus(STATUS.MENU)} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition">Play Again</button>
                </div>
            )}
        </div>
    );
}
