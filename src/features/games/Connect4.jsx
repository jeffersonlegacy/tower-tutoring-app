import React, { useState, useEffect, useRef } from 'react';
import { insertCoin, onPlayerJoin, myPlayer, isHost, setState, getState, Joystick } from 'playroomkit';

const ROWS = 6;
const COLS = 7;

/**
 * CONNECT 4 - PLAYROOM EDITION
 * Zero-config multiplayer with automatic lobbies.
 */
export default function Connect4() {
    const [board, setBoard] = useState(Array(ROWS * COLS).fill(null));
    const [turn, setTurn] = useState('red'); // 'red' or 'yellow'
    const [winner, setWinner] = useState(null);
    const [players, setPlayers] = useState([]);
    const [me, setMe] = useState(null);
    const dropSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3'));
    const winSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3'));

    useEffect(() => {
        startPlayroom();
    }, []);

    const startPlayroom = async () => {
        try {
            await insertCoin({
                streamMode: true, // Optimizes for rapid updates
                gameId: "connect4_playroom",
                skipLobby: false // Show the invite UI
            });

            onPlayerJoin((state) => {
                // Playroom adds players automatically
                const p = state.getProfile();
                console.log("Player Joined:", p);

                // Assign colors based on join order (Host=Red, P2=Yellow)
                // We re-fetch players list to ensure correct order
                updatePlayersList();
            });

            // Sync Game State Loop
            // In a real app we'd use 'onStateChange' if available, but for now we poll or hook into events
            // Playroom's setState triggers updates everywhere.
            // We'll set up a listener for state changes.
        } catch (e) {
            console.error("Playroom Init Failed:", e);
        }
    };

    // Helper to get current players
    const updatePlayersList = () => {
        // Playroom doesn't expose a simple "getPlayers" list directly in the hook style without subscription
        // but let's assume standard behavior for now.
        // We actually rely on the 'state' to drive the UI.
        const p = myPlayer();
        setMe(p);
    };

    // Reacting to state changes (Polling fallback or event hook)
    // Ideally Playroom has a hook, but here we'll use a simple interval/subscription pattern 
    // or rely on component re-renders if we were using their React SDK components.
    // For vanilla JS SDK in React, we need to subscribe.

    // NOTE: Playroom doesn't have a direct "subscribe" to global state in the basic docs snippet.
    // We typically use 'onPlayerJoin' to trigger re-checks, and 'setState' propagates.
    // We will use a standard tick to check for state updates for simplicity in this V1.
    useEffect(() => {
        const interval = setInterval(() => {
            const currentBoard = getState('board');
            const currentTurn = getState('turn');
            const currentWinner = getState('winner');

            if (currentBoard) {
                // Simple deep comparison check to avoid spamming re-renders
                setBoard(prev => JSON.stringify(prev) !== JSON.stringify(currentBoard) ? currentBoard : prev);
            }
            if (currentTurn) setTurn(currentTurn);
            if (currentWinner !== undefined) setWinner(currentWinner);
        }, 100);

        return () => clearInterval(interval);
    }, []);

    const checkWin = (b, idx, player) => {
        const r = Math.floor(idx / COLS);
        const c = idx % COLS;
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

        for (const [dr, dc] of directions) {
            let count = 1;
            for (let i = 1; i < 4; i++) {
                const nr = r + dr * i;
                const nc = c + dc * i;
                if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || b[nr * COLS + nc] !== player) break;
                count++;
            }
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

    const handleDrop = (colIndex) => {
        if (winner) return;

        // Determine my color
        const amIHost = isHost();
        const myColor = amIHost ? 'red' : 'yellow';

        // Turn Validation
        if (turn !== myColor) {
            console.log("Not your turn!");
            return;
        }

        // Logic
        let targetIdx = -1;
        const currentBoard = getState('board') || Array(ROWS * COLS).fill(null);

        for (let r = ROWS - 1; r >= 0; r--) {
            const idx = r * COLS + colIndex;
            if (!currentBoard[idx]) {
                targetIdx = idx;
                break;
            }
        }

        if (targetIdx === -1) return; // Column full

        // Update State
        const newBoard = [...currentBoard];
        newBoard[targetIdx] = myColor;

        const nextTurn = turn === 'red' ? 'yellow' : 'red';
        let newWinner = null;

        if (checkWin(newBoard, targetIdx, myColor)) {
            newWinner = myColor;
            winSound.current.play().catch(() => { });
        } else if (newBoard.filter(Boolean).length >= 42) {
            newWinner = 'draw';
        } else {
            dropSound.current.play().catch(() => { });
        }

        // Broadcast to Playroom
        setState('board', newBoard);
        setState('turn', nextTurn);
        if (newWinner) setState('winner', newWinner);
    };

    const resetGame = () => {
        setState('board', Array(ROWS * COLS).fill(null));
        setState('turn', 'red');
        setState('winner', null);
    };

    // Determine visual state for UI
    const amIHost = isHost();
    const myRole = amIHost ? 'red' : 'yellow';

    return (
        <div className="flex flex-col items-center gap-2 p-2 select-none overflow-hidden h-full font-mono w-full max-w-sm mx-auto">

            {/* Playroom HUD */}
            <div className="flex justify-between w-full px-4 text-[10px] font-bold text-slate-400">
                <span>YOU: {myRole.toUpperCase()}</span>
                <span>TURN: {turn.toUpperCase()}</span>
            </div>

            {/* Turn HUD */}
            <div className="flex items-center gap-4 bg-black/40 px-5 py-1.5 rounded-full border border-white/5 shadow-lg">
                <div className={`w-4 h-4 rounded-full bg-pink-500 transition-all duration-300 ${turn === 'red' ? 'scale-125 shadow-[0_0_10px_#ec4899] ring-2 ring-white/20' : 'opacity-20 blur-[1px]'}`} />
                <div className="w-px h-3 bg-white/10" />
                <div className={`w-4 h-4 rounded-full bg-yellow-400 transition-all duration-300 ${turn === 'yellow' ? 'scale-125 shadow-[0_0_10px_#facc15] ring-2 ring-white/20' : 'opacity-20 blur-[1px]'}`} />
            </div>

            {/* Explicit Drop Inputs */}
            <div className="grid grid-cols-7 gap-1 px-1 w-full max-w-[280px]">
                {[0, 1, 2, 3, 4, 5, 6].map(c => (
                    <button
                        key={c}
                        onClick={() => handleDrop(c)}
                        disabled={winner || turn !== myRole}
                        className={`w-full h-8 flex items-center justify-center rounded-t-lg transition-all ${turn === myRole && !winner ? 'bg-blue-500/20 hover:bg-blue-500 text-blue-300 hover:text-white animate-pulse' : 'opacity-0 cursor-default'}`}
                    >
                        <span className="text-[10px]">▼</span>
                    </button>
                ))}
            </div>

            {/* The Grid */}
            <div className="bg-blue-700 p-2.5 rounded-xl shadow-2xl border-t-2 border-blue-400 w-full max-w-[280px] min-h-[240px] relative">
                <div className="grid grid-cols-7 gap-1.5">
                    {board.map((cell, i) => (
                        <div
                            key={i}
                            onClick={() => handleDrop(i % COLS)}
                            className={`aspect-square rounded-full border border-blue-800 flex items-center justify-center bg-slate-950/90 overflow-hidden relative shadow-inner ${!cell && !winner && turn === myRole ? 'cursor-pointer hover:bg-white/5' : ''}`}
                        >
                            {cell && (
                                <div className={`w-[85%] h-[85%] rounded-full shadow-lg ${cell === 'red'
                                    ? 'bg-gradient-to-br from-pink-400 to-pink-600 shadow-[0_0_8px_#ec4899]'
                                    : 'bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-[0_0_8px_#facc15]'
                                    } animate-in zoom-in duration-200`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {winner && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 p-4">
                    <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl flex flex-col items-center gap-4 shadow-2xl w-full max-w-[240px]">
                        <h2 className={`text-2xl font-black italic tracking-tighter ${winner === 'red' ? 'text-pink-500' : winner === 'yellow' ? 'text-yellow-400' : 'text-slate-400'}`}>
                            {winner === 'draw' ? 'STALEMATE' : `${winner.toUpperCase()} WINS`}
                        </h2>
                        <button onClick={resetGame} className="w-full py-3 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-400 hover:text-white transition-all transform hover:scale-105">REPLAY</button>
                    </div>
                </div>
            )}
        </div>
    );
}
