import React, { useState, useEffect } from 'react';
import { useRealtimeGame } from '../../hooks/useRealtimeGame';

// Game Constants
const BOARD_SIZE = 10;
const SHIPS = [
    { name: 'Carrier', size: 5, id: 'c' },
    { name: 'Battleship', size: 4, id: 'b' },
    { name: 'Cruiser', size: 3, id: 'r' },
    { name: 'Submarine', size: 3, id: 's' },
    { name: 'Destroyer', size: 2, id: 'd' }
];

const INITIAL_STATE = {
    phase: 'MENU', // MENU, SETUP, PLAYING, GAMEOVER
    mode: 'PVP', // PVP, VS_CPU
    turn: 0, // 0 = host/player, 1 = client/cpu
    boards: {
        '0': Array(100).fill(0), // P1 Board
        '1': Array(100).fill(0)  // P2/CPU Board
    },
    ships: {
        '0': [],
        '1': []
    },
    ready: { '0': false, '1': false },
    winner: null,
    matchHistory: []
};

export default function Battleship({ sessionId, onBack }) {
    const gameId = 'battleship_v1';
    const { gameState, playerId, isHost, updateState } = useRealtimeGame(sessionId, gameId, INITIAL_STATE);

    // Local State for Setup
    const [myShips, setMyShips] = useState([]);
    const [placingShip, setPlacingShip] = useState(null); // { name, size, id }
    const [orientation, setOrientation] = useState('H'); // H or V

    // Derived IDs
    const myPlayerIndex = isHost ? '0' : '1';
    const oppPlayerIndex = isHost ? '1' : '0';

    // --- AI LOGIC (VS CPU) ---
    useEffect(() => {
        if (gameState?.mode === 'VS_CPU' && gameState.phase === 'PLAYING' && gameState.turn === 1 && isHost) {
            // CPU TURN
            const timer = setTimeout(() => {
                const board = gameState.boards['0'];
                // Simple AI: Random valid shot
                let validShots = [];
                board.forEach((cell, i) => { if (cell === 0) validShots.push(i); });

                if (validShots.length > 0) {
                    const targetIdx = validShots[Math.floor(Math.random() * validShots.length)];
                    const r = Math.floor(targetIdx / BOARD_SIZE);
                    const c = targetIdx % BOARD_SIZE;
                    // Fire!
                    handleFire(r, c, 0); // CPU fires at P1 (0)
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [gameState?.phase, gameState?.turn, gameState?.mode, isHost]);

    const setupAI = () => {
        let aiShips = [];
        SHIPS.forEach(ship => {
            let placed = false;
            while (!placed) {
                const r = Math.floor(Math.random() * BOARD_SIZE);
                const c = Math.floor(Math.random() * BOARD_SIZE);
                const orient = Math.random() > 0.5 ? 'H' : 'V';
                if (canPlaceShip(aiShips, ship, r, c, orient)) {
                    aiShips.push({ ...ship, r, c, orient, hits: 0 });
                    placed = true;
                }
            }
        });
        return aiShips;
    };

    // --- GAME LOGIC ---

    const getCell = (board, r, c) => board[r * BOARD_SIZE + c];

    const canPlaceShip = (currentShips, ship, r, c, orient) => {
        if (orient === 'H') {
            if (c + ship.size > BOARD_SIZE) return false;
            for (let i = 0; i < ship.size; i++) {
                if (currentShips.some(s => isOverlapping(s, r, c + i))) return false;
            }
        } else {
            if (r + ship.size > BOARD_SIZE) return false;
            for (let i = 0; i < ship.size; i++) {
                if (currentShips.some(s => isOverlapping(s, r + i, c))) return false;
            }
        }
        return true;
    };

    const isOverlapping = (existingShip, r, c) => {
        const { r: sr, c: sc, size, orient } = existingShip;
        if (orient === 'H') {
            return r === sr && c >= sc && c < sc + size;
        } else {
            return c === sc && r >= sr && r < sr + size;
        }
    };

    // Refactored Fire Logic to reuse for AI
    const handleFire = (r, c, targetPlayerIndex) => {
        const targetBoard = gameState?.boards?.[targetPlayerIndex] || Array(100).fill(0);
        const targetIndex = r * BOARD_SIZE + c;
        if (targetBoard[targetIndex] !== 0) return;

        const oppShips = gameState?.ships?.[targetPlayerIndex] || [];
        let hitShip = null;
        let hitResult = 'MISS';

        oppShips.forEach(s => {
            if (isOverlapping(s, r, c)) {
                hitResult = 'HIT';
                hitShip = s;
            }
        });

        const newBoard = [...targetBoard];
        newBoard[targetIndex] = hitResult;

        let newOppShips = [...oppShips];
        if (hitResult === 'HIT') {
            newOppShips = newOppShips.map(s => {
                if (s.id === hitShip.id) return { ...s, hits: s.hits + 1 };
                return s;
            });
        }

        const allSunk = newOppShips.length > 0 && newOppShips.every(s => s.hits >= s.size);
        const nextTurn = targetPlayerIndex === 0 ? 0 : 1; // If CPU (1) fires at 0, turn goes to 0? No.
        // Current turn is logic.
        // If I fired (turn 0), next is 1. If AI fired (turn 1), next is 0.

        const updates = {
            [`boards/${targetPlayerIndex}`]: newBoard,
            [`ships/${targetPlayerIndex}`]: newOppShips,
            turn: gameState.turn === 0 ? 1 : 0
        };

        if (allSunk) {
            updates.phase = 'GAMEOVER';
            updates.winner = gameState.turn; // The one who fired wins

            // Log Match
            if (gameState.mode === 'PVP' || gameState.mode === 'VS_CPU') {
                updates.matchHistory = [...(gameState.matchHistory || []), {
                    id: (gameState.matchHistory?.length || 0) + 1,
                    mode: gameState.mode,
                    winner: updates.winner === 0 ? 'host' : 'client',
                    timestamp: Date.now()
                }];
            }
        }

        updateState(updates);
    };


    // --- EVENT HANDLERS ---

    const handleCellClick = (r, c) => {
        if (!gameState) return;

        // SETUP PHASE
        if (gameState.phase === 'SETUP') {
            if (gameState.ready[myPlayerIndex]) return;

            if (placingShip) {
                if (canPlaceShip(myShips, placingShip, r, c, orientation)) {
                    const newShip = { ...placingShip, r, c, orient: orientation, hits: 0 };
                    const newShips = [...myShips, newShip];
                    setMyShips(newShips);
                    setPlacingShip(null);
                }
            }
            return;
        }

        // PLAYING PHASE
        if (gameState.phase === 'PLAYING') {
            const isMyTurn = (gameState.turn === 0 && isHost) || (gameState.turn === 1 && !isHost);
            if (!isMyTurn) return;
            if (gameState.mode === 'VS_CPU' && !isHost) return; // Only host plays vs CPU

            handleFire(r, c, oppPlayerIndex);
        }
    };

    const handleReady = () => {
        const aiShips = gameState.mode === 'VS_CPU' ? setupAI() : [];

        const updates = {
            [`ships/${myPlayerIndex}`]: myShips,
            [`ready/${myPlayerIndex}`]: true
        };

        if (gameState.mode === 'VS_CPU') {
            updates['ships/1'] = aiShips;
            updates['ready/1'] = true;
            // Auto start if VS CPU
            updates.phase = 'PLAYING';
        } else {
            // PVP Logic
            if (gameState.ready[oppPlayerIndex]) {
                updates.phase = 'PLAYING';
            }
        }

        updateState(updates);
    };

    const handleReset = () => {
        updateState({ ...INITIAL_STATE, phase: 'MENU' });
        setMyShips([]);
    };

    // --- MENU ACTIONS ---
    const selectMode = (mode) => {
        updateState({
            phase: 'SETUP',
            mode: mode,
            turn: 0,
            boards: INITIAL_STATE.boards,
            ships: INITIAL_STATE.ships,
            ready: INITIAL_STATE.ready,
            winner: null
        });
        setMyShips([]);
    };

    // --- RENDER ---
    if (!gameState) return <div className="text-white p-10 font-mono animate-pulse">Connecting to Naval Command...</div>;

    // MENU SCREEN
    if (gameState.phase === 'MENU') {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center select-none font-mono bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950 via-slate-950 to-black relative overflow-hidden">

                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] opacity-30 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="mb-10 relative">
                        <div className="absolute -inset-4 bg-blue-500/20 blur-xl rounded-full"></div>
                        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-600 tracking-[0.2em] relative z-10 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                            BATTLESHIP
                        </h1>
                        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent mt-2"></div>
                        <p className="text-xs font-bold text-cyan-500/80 tracking-[0.5em] mt-2 uppercase">Naval Warfare Simulator</p>
                    </div>

                    <div className="w-full max-w-sm space-y-4">
                        <button
                            onClick={() => selectMode('VS_CPU')}
                            className="w-full group relative overflow-hidden bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 rounded-none p-6 transition-all hover:bg-cyan-950/30 clip-path-polygon"
                            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-cyan-900/40 border border-cyan-500/50 text-2xl group-hover:scale-110 transition-transform">
                                    🤖
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="text-xl font-bold text-cyan-100 group-hover:text-white uppercase tracking-wider">Tactical Sim</span>
                                    <span className="text-[10px] text-cyan-500 font-mono">VS AI COMMANDER</span>
                                </div>
                                <span className="ml-auto text-cyan-500 opacity-50 group-hover:translate-x-1 transition-transform">&gt;&gt;&gt;</span>
                            </div>
                        </button>

                        <button
                            onClick={() => selectMode('PVP')}
                            className="w-full group relative overflow-hidden bg-slate-900 border border-blue-500/30 hover:border-blue-400 rounded-none p-6 transition-all hover:bg-blue-950/30 clip-path-polygon"
                            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-900/40 border border-blue-500/50 text-2xl group-hover:scale-110 transition-transform">
                                    ⚔️
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="text-xl font-bold text-blue-100 group-hover:text-white uppercase tracking-wider">Live Combat</span>
                                    <span className="text-[10px] text-blue-500 font-mono">VS HUMAN ADMIRAL</span>
                                </div>
                                <span className="ml-auto text-blue-500 opacity-50 group-hover:translate-x-1 transition-transform">&gt;&gt;&gt;</span>
                            </div>
                        </button>
                    </div>

                    <button onClick={onBack} className="mt-12 text-xs font-mono text-cyan-700 hover:text-cyan-400 uppercase tracking-widest border border-transparent hover:border-cyan-900 px-4 py-2 transition-all">
                        [ ABORT MISSION ]
                    </button>
                </div>
            </div>
        );
    }

    // ... GAME RENDER ...

    const renderGrid = (board, ships, isSelf) => {
        // Merge ships into a visual grid for display
        // If isSelf, show ships. If enemy, only show hits/misses (unless game over?)
        const safeBoard = board || Array(100).fill(0); // Defensive init against RTDB null pruning

        return (
            <div className="grid grid-cols-10 gap-px bg-slate-700 border border-slate-600 w-full max-w-[400px] aspect-square shadow-2xl relative">
                {Array(100).fill(0).map((_, i) => {
                    const r = Math.floor(i / BOARD_SIZE);
                    const c = i % BOARD_SIZE;

                    const cellState = safeBoard[i]; // 'HIT', 'MISS', or 0
                    let shipHere = false;

                    if (isSelf) {
                        shipHere = (ships || myShips).some(s => isOverlapping(s, r, c));
                    }

                    // For SETUP phase: show preview of placing ship
                    // Simplified: just click to place

                    let bgClass = 'bg-slate-900';
                    if (cellState === 'HIT') bgClass = 'bg-red-500/80 animate-pulse';
                    else if (cellState === 'MISS') bgClass = 'bg-slate-800'; // Miss
                    else if (shipHere) bgClass = 'bg-cyan-600 border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.5)] z-10'; // Ship

                    return (
                        <div
                            key={i}
                            onClick={() => handleCellClick(r, c)}
                            className={`relative w-full h-full cursor-pointer hover:bg-white/10 transition-colors ${bgClass}`}
                        >
                            {cellState === 'HIT' && <span className="absolute inset-0 flex items-center justify-center text-xs">💥</span>}
                            {cellState === 'MISS' && <span className="absolute inset-0 flex items-center justify-center text-xs text-white/20">●</span>}
                        </div>
                    );
                })}
            </div>
        );
    };

    const isMyTurn = (gameState.turn === 0 && isHost) || (gameState.turn === 1 && !isHost);

    return (
        <div className="flex flex-col h-full text-white p-4 overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <button onClick={onBack} className="text-sm text-slate-400 hover:text-white">← BACK</button>
                <div className="text-center">
                    <h2 className="text-2xl font-black text-white tracking-widest uppercase filter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">BATTLESHIP</h2>
                    <p className={`text-xs font-mono font-bold ${gameState.phase === 'PLAYING' ? (isMyTurn ? 'text-green-400' : 'text-red-400') : 'text-slate-400'
                        }`}>
                        {gameState.phase === 'SETUP' ? 'DEPLOYMENT PHASE' :
                            gameState.phase === 'GAMEOVER' ? (String(gameState.winner) === myPlayerIndex ? <span className="text-yellow-400 animate-pulse">👑 VICTORY 👑</span> : <span className="text-red-500">💀 DEFEAT 💀</span>) :
                                (isMyTurn ? 'YOUR TURN - FIRE AT WILL' : (gameState.mode === 'VS_CPU' ? <span className="animate-pulse text-red-400">CPU TARGETING...</span> : 'ENEMY TURN - BRACE FOR IMPACT'))}
                    </p>
                </div>
                <button onClick={handleReset} className="text-xs bg-red-500/10 text-red-400 px-3 py-1 rounded hover:bg-red-500/20">RESET GRID</button>
            </div>

            {/* Game Area */}
            <div className="flex flex-col md:flex-row gap-8 items-start justify-center flex-1">

                {/* YOUR FLEET (Left) */}
                <div className="flex-1 w-full max-w-md">
                    <div className="bg-slate-800/50 p-2 rounded-t-lg border-b border-white/5 flex justify-between items-center">
                        <span className="font-bold text-cyan-400 flex items-center gap-2">
                            YOUR FLEET {isHost ? '(P1)' : '(P2)'}
                        </span>
                        {gameState.phase === 'SETUP' && (
                            <button onClick={() => setOrientation(o => o === 'H' ? 'V' : 'H')} className="text-xs bg-slate-700 px-2 rounded hover:bg-slate-600 transition-colors">
                                ROTATE: {orientation === 'H' ? 'HORIZ' : 'VERT'}
                            </button>
                        )}
                    </div>
                    {renderGrid(gameState.boards?.[myPlayerIndex], (gameState.phase === 'SETUP' ? myShips : gameState.ships?.[myPlayerIndex]), true)}

                    {/* Setup Controls */}
                    {gameState.phase === 'SETUP' && !gameState.ready[myPlayerIndex] && (
                        <div className="mt-4 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-bottom-4">
                            {SHIPS.map(ship => {
                                const placed = myShips.some(s => s.name === ship.name);
                                return (
                                    <button
                                        key={ship.name}
                                        disabled={placed}
                                        onClick={() => setPlacingShip(ship)}
                                        className={`p-2 text-xs font-bold rounded border transition-all ${placed ? 'bg-green-900/20 border-green-500/30 text-green-500 opacity-50' :
                                            placingShip?.name === ship.name ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500 scale-105' :
                                                'bg-slate-800 border-slate-700 hover:border-white/30'
                                            }`}
                                    >
                                        {ship.name} ({ship.size}) {placed && '✓'}
                                    </button>
                                );
                            })}
                            <button
                                disabled={myShips.length < 5}
                                onClick={handleReady}
                                className="col-span-2 py-3 mt-2 bg-gradient-to-r from-cyan-600 to-blue-600 font-bold rounded shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-cyan-500/25 transition-all"
                            >
                                CONFIRM DEPLOYMENT
                            </button>
                            <div className="col-span-2 text-[10px] text-slate-500 text-center mt-1">
                                Place all 5 ships to enable confirmation.
                            </div>
                        </div>
                    )}
                    {gameState.phase === 'SETUP' && gameState.ready[myPlayerIndex] && (
                        <div className="mt-4 text-center p-4 bg-slate-800/50 rounded animate-pulse text-cyan-400 border border-cyan-500/30">
                            WAITING FOR OPPONENT...
                        </div>
                    )}
                </div>

                {/* ENEMY FLEET (Right) - Only in Playing Phase */}
                <div className={`flex-1 w-full max-w-md transition-opacity duration-500 ${gameState.phase === 'SETUP' ? 'opacity-50 blur-sm pointer-events-none' : 'opacity-100'}`}>
                    <div className="bg-slate-800/50 p-2 rounded-t-lg border-b border-white/5 flex justify-between">
                        <span className="font-bold text-red-400">ENEMY WATERS</span>
                        <span className="text-xs text-slate-500 animate-pulse">RADAR ONLINE</span>
                    </div>
                    {renderGrid(gameState.boards?.[oppPlayerIndex], [], false)}

                    <div className="mt-4 p-4 bg-black/30 rounded text-xs font-mono text-slate-400 h-32 overflow-y-auto border border-white/5">
                        <div className="mb-2 text-white border-b border-white/10 pb-1">COMBAT LOG</div>
                        {isMyTurn && gameState.phase === 'PLAYING' && <div className="text-green-400">&gt; COMMANDER: AWAITING COORDINATES</div>}
                        {!isMyTurn && gameState.phase === 'PLAYING' && <div className="text-red-400">&gt; WARNING: INCOMING BARRAGE DETECTED</div>}
                        {gameState.phase === 'GAMEOVER' && <div className="text-yellow-400">&gt; WAR ENDED. {String(gameState.winner) === myPlayerIndex ? 'WE ARE VICTORIOUS.' : 'FLEET DESTROYED.'}</div>}
                    </div>
                </div>

            </div>
        </div>
    );
}
