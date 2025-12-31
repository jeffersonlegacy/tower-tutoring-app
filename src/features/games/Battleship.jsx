import React, { useState, useEffect } from 'react';
import { useRealtimeGame } from '../../hooks/useRealtimeGame';
import GameEndOverlay from './GameEndOverlay';

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
    // AI Memory for "Hunt & Target" Strategy
    const aiMemory = React.useRef({
        mode: 'HUNT', // 'HUNT' or 'TARGET'
        targets: [],  // Stack of coordinates to fire at (Stack usually LIFO, but queue might be better for parity)
        lastHit: null // Coordinate of last hit to determine neighbors
    });

    useEffect(() => {
        if (gameState?.mode === 'VS_CPU' && gameState.phase === 'PLAYING' && gameState.turn === 1 && isHost) {
            // CPU TURN
            const timer = setTimeout(() => {
                const board = gameState.boards['0'];
                const { mode, targets } = aiMemory.current;

                let targetIdx = -1;

                // 1. TARGET MODE: Fire at enqueued targets
                if (mode === 'TARGET' && targets.length > 0) {
                    // Pop a target
                    while (targets.length > 0) {
                        const candidate = targets.pop();
                        // Validation: Check if already shot
                        if (board[candidate] === 0) {
                            targetIdx = candidate;
                            break;
                        }
                    }
                    // If ran out of targets, revert to HUNT
                    if (targetIdx === -1) {
                        aiMemory.current.mode = 'HUNT';
                    }
                }

                // 2. HUNT MODE: Checkerboard Parity Search (Most efficient)
                if (targetIdx === -1) {
                    const validMoves = [];
                    board.forEach((cell, i) => {
                        if (cell === 0) {
                            const r = Math.floor(i / BOARD_SIZE);
                            const c = i % BOARD_SIZE;
                            // Parity: (r + c) is even (or odd). Covers every 2nd square.
                            // Enough to hit smallest ship (Destroyer size 2)
                            if ((r + c) % 2 === 0) validMoves.push(i);
                        }
                    });

                    // If parity moves exhausted (rare endgame), take any open spot
                    if (validMoves.length === 0) {
                        board.forEach((cell, i) => { if (cell === 0) validMoves.push(i); });
                    }

                    if (validMoves.length > 0) {
                        targetIdx = validMoves[Math.floor(Math.random() * validMoves.length)];
                    }
                }

                if (targetIdx !== -1) {
                    const r = Math.floor(targetIdx / BOARD_SIZE);
                    const c = targetIdx % BOARD_SIZE;

                    // PRE-CALC UPDATE for Memory (Since we don't have the result yet, we hook handleFire logic?)
                    // Actually, handleFire needs to return result or we assume based on next render.
                    // But 'handleFire' is async-ish state update.
                    // Better approach: Calculate result locally to update memory *immediately* for next turn

                    // Cheating peek to update memory
                    const myShips = gameState.ships['0'];
                    const isHit = myShips.some(s => isOverlapping(s, r, c));

                    if (isHit) {
                        aiMemory.current.mode = 'TARGET';
                        // Add neighbors to stack: Up, Down, Left, Right
                        const neighbors = [
                            { r: r - 1, c }, { r: r + 1, c },
                            { r, c: c - 1 }, { r, c: c + 1 }
                        ];

                        // Shuffle neighbors for randomness so it doesn't always look same way
                        neighbors.sort(() => Math.random() - 0.5);

                        neighbors.forEach(n => {
                            if (n.r >= 0 && n.r < BOARD_SIZE && n.c >= 0 && n.c < BOARD_SIZE) {
                                const idx = n.r * BOARD_SIZE + n.c;
                                if (board[idx] === 0) { // Only add if not shot
                                    aiMemory.current.targets.push(idx);
                                }
                            }
                        });
                    }

                    // Fire!
                    handleFire(r, c, 0); // CPU fires at P1 (0)
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [gameState?.phase, gameState?.turn, gameState?.mode, isHost, gameState?.boards]);

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

    // --- ANIMATIONS & STYLES ---
    const visualStyles = `
        @keyframes radar {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 0.5; }
            90% { opacity: 0.5; }
            100% { top: 100%; opacity: 0; }
        }
        @keyframes explosion {
            0% { transform: scale(0.5); opacity: 1; filter: brightness(2); }
            50% { transform: scale(1.5); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; filter: brightness(1); }
        }
        @keyframes ripple {
            0% { transform: scale(0); opacity: 0.8; border-width: 4px; }
            100% { transform: scale(2); opacity: 0; border-width: 0px; }
        }
        @keyframes scanline {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
        }
        @keyframes sink {
            0%, 100% { transform: scale(1) rotate(0deg); filter: grayscale(0) brightness(1); }
            25% { transform: scale(0.9) rotate(-5deg); filter: grayscale(0.5) brightness(0.5) sepia(1) hue-rotate(-50deg) saturate(3); }
            50% { transform: scale(0.95) rotate(5deg); }
            75% { transform: scale(0.9) rotate(-5deg); }
        }
        .radar-sweep {
            position: absolute;
            left: 0; right: 0;
            height: 10px;
            background: linear-gradient(to bottom, transparent, rgba(6,182,212,0.6), transparent);
            box-shadow: 0 0 15px rgba(6,182,212,0.8);
            animation: radar 3s linear infinite;
            pointer-events: none;
            z-index: 20;
        }
        .animate-explosion {
            animation: explosion 0.4s ease-out forwards;
        }
        .animate-ripple::after {
            content: '';
            position: absolute;
            inset: 0;
            border: 2px solid rgba(255,255,255,0.5);
            border-radius: 50%;
            animation: ripple 0.6s ease-out forwards;
        }
        .animate-sink {
            animation: sink 2s ease-in-out infinite;
            opacity: 0.6;
            transition: opacity 1s;
        }
        .scanlines {
            background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2));
            background-size: 100% 4px;
            pointer-events: none;
        }
        .crt-flicker {
            animation: flicker 0.15s infinite;
        }
    `;

    // --- GAME RENDER ---

    const renderGrid = (board, ships, isSelf) => {
        // Merge ships into a visual grid for display
        // If isSelf, show ships. If enemy, only show hits/misses (unless game over?)
        const safeBoard = board || Array(100).fill(0); // Defensive init against RTDB null pruning

        return (
            <div className="grid grid-cols-10 gap-px bg-slate-700 border border-slate-600 w-full max-w-[400px] aspect-square shadow-2xl relative overflow-hidden group">
                {/* Radar Sweep for Enemy Grid */}
                {!isSelf && gameState.phase === 'PLAYING' && (
                    <div className="radar-sweep" />
                )}

                {Array(100).fill(0).map((_, i) => {
                    const r = Math.floor(i / BOARD_SIZE);
                    const c = i % BOARD_SIZE;

                    const cellState = safeBoard[i]; // 'HIT', 'MISS', or 0
                    let shipHere = false;
                    let myShipObj = null;

                    if (isSelf && ships) {
                        myShipObj = ships.find(s => isOverlapping(s, r, c));
                        shipHere = !!myShipObj;
                    }

                    // Enemy Sinking Logic
                    // We don't have direct access to 'enemy ships' array in render loop easily unless we pass it.
                    // But 'ships' arg is passed as empty [] for enemy grid in current call `renderGrid(gameState.boards?.[oppPlayerIndex], [], false)`.
                    // We need to pass the enemy ships to know if they are sunk?
                    // Actually, 'ships' arg for enemy is empty. We need to pass it? 
                    // Wait, `renderGrid` call on line 507 passes `[]`. 
                    // Let's modify the call site (lines 461 and 507) to pass the ships if possible, 
                    // OR we just use `gameState.ships[oppPlayerIndex]` if `!isSelf`.

                    let sunkShip = false;
                    const targetShips = isSelf ? ships : (gameState.ships?.[oppPlayerIndex] || []);
                    const foundShip = targetShips?.find(s => isOverlapping(s, r, c));

                    if (foundShip && foundShip.hits >= foundShip.size) {
                        sunkShip = true; // This ship is fully sunk
                    }

                    // For SETUP phase: show preview of placing ship
                    // Simplified: just click to place

                    let bgClass = 'bg-slate-900';
                    let content = null;

                    if (cellState === 'HIT') {
                        bgClass = sunkShip ? 'bg-red-900/50 animate-sink' : 'bg-red-500/80 animate-explosion';
                        content = <span className="absolute inset-0 flex items-center justify-center text-xs">💥</span>;
                    }
                    else if (cellState === 'MISS') {
                        bgClass = 'bg-slate-800 animate-ripple';
                        content = <span className="absolute inset-0 flex items-center justify-center text-xs text-white/20">●</span>;
                    }
                    else if (shipHere) {
                        // My Ships
                        bgClass = sunkShip ? 'bg-red-900/50 grayscale opacity-50 border border-red-900' : 'bg-cyan-600 border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.5)] z-10';
                    }

                    return (
                        <div
                            key={i}
                            onClick={() => handleCellClick(r, c)}
                            className={`relative w-full h-full cursor-pointer hover:bg-white/10 transition-colors ${bgClass}`}
                        >
                            {content}
                        </div>
                    );
                })}
            </div>
        );
    };

    const isMyTurn = (gameState.turn === 0 && isHost) || (gameState.turn === 1 && !isHost);

    return (
        <div className="flex flex-col h-full text-white p-4 overflow-y-auto relative">
            <style>{visualStyles}</style>

            {/* CRT Overlay */}
            <div className="absolute inset-0 pointer-events-none z-50 scanlines opacity-10"></div>

            {/* Header */}
            <div className="flex justify-between items-center mb-6 relative z-10">
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
            <div className="flex flex-col md:flex-row gap-8 items-start justify-center flex-1 relative z-10">

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

                {/* Game Over Overlay */}
                {gameState.phase === 'GAMEOVER' && (
                    <GameEndOverlay
                        winner={String(gameState.winner) === myPlayerIndex}
                        score={String(gameState.winner) === myPlayerIndex ? 'VICTORY' : 'DEFEAT'}
                        onRestart={() => isHost && handleReset()}
                        onExit={() => {
                            handleReset(); // Ensure state is clean
                            onBack();
                        }}
                        isHost={isHost}
                    />
                )}
            </div>
        </div>
    );
}
