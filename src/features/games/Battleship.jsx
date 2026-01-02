import React, { useState, useEffect, useRef } from 'react';
import { useRealtimeGame } from '../../hooks/useRealtimeGame';
import GameEndOverlay from './GameEndOverlay';
import confetti from 'canvas-confetti';

// Game Constants
const BOARD_SIZE = 10;
const SHIPS = [
    { name: 'Carrier', size: 5, id: 'c', icon: '🚢' },
    { name: 'Battleship', size: 4, id: 'b', icon: '⛴️' },
    { name: 'Cruiser', size: 3, id: 'r', icon: '🛥️' },
    { name: 'Submarine', size: 3, id: 's', icon: '🤿' },
    { name: 'Destroyer', size: 2, id: 'd', icon: '🚤' }
];

const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

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
    matchHistory: [],
    lastSunk: null // Track last sunk ship for animation
};

export default function Battleship({ sessionId, onBack }) {
    const gameId = 'battleship_v2';
    const { gameState, playerId, isHost, updateState } = useRealtimeGame(sessionId, gameId, INITIAL_STATE);

    // Local State for Setup
    const [myShips, setMyShips] = useState([]);
    const [placingShip, setPlacingShip] = useState(null);
    const [orientation, setOrientation] = useState('H');
    const [hoverCell, setHoverCell] = useState(null); // { r, c } for preview
    const [selectedShip, setSelectedShip] = useState(null); // For moving placed ships
    const [sunkToast, setSunkToast] = useState(null); // Toast message for sunk ships
    const [isDragging, setIsDragging] = useState(false); // Track if dragging a ship
    const gridRef = useRef(null); // Ref for grid to calculate drop position

    // Derived IDs
    const myPlayerIndex = isHost ? '0' : '1';
    const oppPlayerIndex = isHost ? '1' : '0';

    // AI Memory
    const aiMemory = useRef({
        mode: 'HUNT',
        targets: [],
        lastHit: null
    });

    // Track previously sunk ships to detect new sinks
    const prevSunkRef = useRef(new Set());

    // --- AI LOGIC ---
    useEffect(() => {
        if (gameState?.mode === 'VS_CPU' && gameState.phase === 'PLAYING' && gameState.turn === 1 && isHost) {
            const timer = setTimeout(() => {
                const board = gameState.boards['0'];
                const { mode, targets } = aiMemory.current;

                let targetIdx = -1;

                if (mode === 'TARGET' && targets.length > 0) {
                    while (targets.length > 0) {
                        const candidate = targets.pop();
                        if (board[candidate] === 0) {
                            targetIdx = candidate;
                            break;
                        }
                    }
                    if (targetIdx === -1) {
                        aiMemory.current.mode = 'HUNT';
                    }
                }

                if (targetIdx === -1) {
                    const validMoves = [];
                    board.forEach((cell, i) => {
                        if (cell === 0) {
                            const r = Math.floor(i / BOARD_SIZE);
                            const c = i % BOARD_SIZE;
                            if ((r + c) % 2 === 0) validMoves.push(i);
                        }
                    });

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

                    const myShipsArr = gameState.ships['0'];
                    const isHit = myShipsArr.some(s => isOverlapping(s, r, c));

                    if (isHit) {
                        aiMemory.current.mode = 'TARGET';
                        const neighbors = [
                            { r: r - 1, c }, { r: r + 1, c },
                            { r, c: c - 1 }, { r, c: c + 1 }
                        ];
                        neighbors.sort(() => Math.random() - 0.5);
                        neighbors.forEach(n => {
                            if (n.r >= 0 && n.r < BOARD_SIZE && n.c >= 0 && n.c < BOARD_SIZE) {
                                const idx = n.r * BOARD_SIZE + n.c;
                                if (board[idx] === 0) {
                                    aiMemory.current.targets.push(idx);
                                }
                            }
                        });
                    }

                    handleFire(r, c, 0);
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [gameState?.phase, gameState?.turn, gameState?.mode, isHost, gameState?.boards]);

    // Detect newly sunk ships for toast
    useEffect(() => {
        if (!gameState?.ships) return;
        const oppShips = gameState.ships[oppPlayerIndex] || [];
        const currentSunk = new Set();
        oppShips.forEach(s => {
            if (s.hits >= s.size) currentSunk.add(s.id);
        });

        // Find newly sunk
        currentSunk.forEach(id => {
            if (!prevSunkRef.current.has(id)) {
                const ship = SHIPS.find(sh => sh.id === id);
                if (ship) {
                    setSunkToast(`${ship.icon} ${ship.name} SUNK!`);
                    confetti({ particleCount: 80, spread: 60, origin: { y: 0.4 }, colors: ['#ef4444', '#f97316', '#000'] });
                    setTimeout(() => setSunkToast(null), 2500);
                }
            }
        });
        prevSunkRef.current = currentSunk;
    }, [gameState?.ships]);

    const setupAI = () => {
        let aiShips = [];
        SHIPS.forEach(ship => {
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 100) {
                const r = Math.floor(Math.random() * BOARD_SIZE);
                const c = Math.floor(Math.random() * BOARD_SIZE);
                const orient = Math.random() > 0.5 ? 'H' : 'V';
                if (canPlaceShip(aiShips, ship, r, c, orient)) {
                    aiShips.push({ ...ship, r, c, orient, hits: 0 });
                    placed = true;
                }
                attempts++;
            }
        });
        return aiShips;
    };

    // --- GAME LOGIC ---
    const canPlaceShip = (currentShips, ship, r, c, orient) => {
        if (orient === 'H') {
            if (c + ship.size > BOARD_SIZE) return false;
            for (let i = 0; i < ship.size; i++) {
                if (currentShips.some(s => s.id !== ship.id && isOverlapping(s, r, c + i))) return false;
            }
        } else {
            if (r + ship.size > BOARD_SIZE) return false;
            for (let i = 0; i < ship.size; i++) {
                if (currentShips.some(s => s.id !== ship.id && isOverlapping(s, r + i, c))) return false;
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

    const getShipCells = (ship) => {
        const cells = [];
        for (let i = 0; i < ship.size; i++) {
            if (ship.orient === 'H') {
                cells.push({ r: ship.r, c: ship.c + i });
            } else {
                cells.push({ r: ship.r + i, c: ship.c });
            }
        }
        return cells;
    };

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

        const updates = {
            [`boards/${targetPlayerIndex}`]: newBoard,
            [`ships/${targetPlayerIndex}`]: newOppShips,
            turn: gameState.turn === 0 ? 1 : 0
        };

        if (allSunk) {
            updates.phase = 'GAMEOVER';
            updates.winner = gameState.turn;
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

        if (gameState.phase === 'SETUP') {
            if (gameState.ready[myPlayerIndex]) return;

            // Check if clicking on existing ship to SELECT it
            const clickedShip = myShips.find(s => isOverlapping(s, r, c));
            if (clickedShip && !placingShip) {
                // TAP TO SELECT: show Move/Remove/Rotate buttons
                setSelectedShip(clickedShip);
                return;
            }

            if (placingShip) {
                if (canPlaceShip(myShips, placingShip, r, c, orientation)) {
                    const newShip = { ...placingShip, r, c, orient: orientation, hits: 0 };
                    const newShips = [...myShips.filter(s => s.id !== placingShip.id), newShip];
                    setMyShips(newShips);
                    setPlacingShip(null);
                    setSelectedShip(null);
                }
            }
            return;
        }

        if (gameState.phase === 'PLAYING') {
            const isMyTurn = (gameState.turn === 0 && isHost) || (gameState.turn === 1 && !isHost);
            if (!isMyTurn) return;
            if (gameState.mode === 'VS_CPU' && !isHost) return;
            handleFire(r, c, oppPlayerIndex);
        }
    };

    // Handle drag start from ship button OR from placed ship on grid
    const handleDragStart = (ship, e) => {
        setPlacingShip(ship);
        // Use ship's current orientation if it has one (i.e., it's being moved)
        if (ship.orient) {
            setOrientation(ship.orient);
        }
        setIsDragging(true);
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', ship.id);
        }
    };

    // Handle drag end
    const handleDragEnd = () => {
        setIsDragging(false);
    };

    // Handle drop on grid cell
    const handleDrop = (r, c, e) => {
        e.preventDefault();
        if (placingShip) {
            // Use the ship's orientation if it has one (being moved), otherwise use current orientation
            const useOrient = placingShip.orient || orientation;
            if (canPlaceShip(myShips, placingShip, r, c, useOrient)) {
                const newShip = { ...placingShip, r, c, orient: useOrient, hits: 0 };
                const newShips = [...myShips.filter(s => s.id !== placingShip.id), newShip];
                setMyShips(newShips);
                setPlacingShip(null);
            }
        }
        setIsDragging(false);
    };

    // Handle drag over (needed to allow drop)
    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleRemoveShip = (ship) => {
        setMyShips(myShips.filter(s => s.id !== ship.id));
        setSelectedShip(null);
    };

    const handleMoveShip = (ship) => {
        setPlacingShip(ship);
        setSelectedShip(null);
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
            updates.phase = 'PLAYING';
        } else {
            if (gameState.ready[oppPlayerIndex]) {
                updates.phase = 'PLAYING';
            }
        }

        updateState(updates);
    };

    const handleReset = () => {
        updateState({ ...INITIAL_STATE, phase: 'MENU' });
        setMyShips([]);
        setPlacingShip(null);
        setSelectedShip(null);
        aiMemory.current = { mode: 'HUNT', targets: [], lastHit: null };
        prevSunkRef.current = new Set();
    };

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

    // --- CSS ANIMATIONS ---
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
        @keyframes smoke {
            0% { opacity: 0.8; transform: translateY(0) scale(1); }
            100% { opacity: 0; transform: translateY(-20px) scale(1.5); }
        }
        @keyframes sinkGlow {
            0%, 100% { box-shadow: 0 0 10px rgba(0,0,0,0.8), inset 0 0 15px rgba(239,68,68,0.5); }
            50% { box-shadow: 0 0 20px rgba(0,0,0,1), inset 0 0 25px rgba(239,68,68,0.8); }
        }
        @keyframes sunkPulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 0.8; }
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
        .animate-explosion { animation: explosion 0.4s ease-out forwards; }
        .animate-ripple::after {
            content: '';
            position: absolute;
            inset: 0;
            border: 2px solid rgba(255,255,255,0.5);
            border-radius: 50%;
            animation: ripple 0.6s ease-out forwards;
        }
        .sunk-cell {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d1f1f 50%, #1a1a1a 100%);
            animation: sinkGlow 2s ease-in-out infinite, sunkPulse 3s ease-in-out infinite;
        }
        .smoke-particle {
            position: absolute;
            width: 8px;
            height: 8px;
            background: radial-gradient(circle, rgba(80,80,80,0.8), transparent);
            border-radius: 50%;
            animation: smoke 2s ease-out infinite;
        }
        .preview-valid { background: rgba(34, 197, 94, 0.4) !important; border: 2px solid rgba(34, 197, 94, 0.8) !important; }
        .preview-invalid { background: rgba(239, 68, 68, 0.4) !important; border: 2px solid rgba(239, 68, 68, 0.8) !important; }
        .ship-selected { animation: pulse 1s ease-in-out infinite; box-shadow: 0 0 15px rgba(250, 204, 21, 0.8); }
    `;

    // Get preview cells for placing ship
    const getPreviewCells = () => {
        if (!placingShip || !hoverCell || gameState.phase !== 'SETUP') return { cells: [], valid: false };
        const cells = [];
        const isValid = canPlaceShip(myShips, placingShip, hoverCell.r, hoverCell.c, orientation);

        for (let i = 0; i < placingShip.size; i++) {
            if (orientation === 'H') {
                cells.push({ r: hoverCell.r, c: hoverCell.c + i });
            } else {
                cells.push({ r: hoverCell.r + i, c: hoverCell.c });
            }
        }
        return { cells, valid: isValid };
    };

    const previewData = getPreviewCells();

    // Ship Tracker Component
    const ShipTracker = ({ ships, isEnemy }) => {
        const trackShips = SHIPS.map(baseShip => {
            const actualShip = ships?.find(s => s.id === baseShip.id);
            const hits = actualShip?.hits || 0;
            const isSunk = hits >= baseShip.size;
            return { ...baseShip, hits, isSunk, placed: !!actualShip };
        });

        return (
            <div className={`p-3 rounded-lg ${isEnemy ? 'bg-red-950/30 border border-red-500/20' : 'bg-cyan-950/30 border border-cyan-500/20'}`}>
                <div className={`text-xs font-bold mb-2 ${isEnemy ? 'text-red-400' : 'text-cyan-400'}`}>
                    {isEnemy ? '🎯 ENEMY FLEET' : '⚓ YOUR FLEET'}
                </div>
                <div className="space-y-1">
                    {trackShips.map(ship => (
                        <div key={ship.id} className={`flex items-center gap-2 text-xs ${ship.isSunk ? 'opacity-50' : ''}`}>
                            <span>{ship.icon}</span>
                            <span className={`flex-1 ${ship.isSunk ? 'line-through text-red-400' : 'text-white'}`}>
                                {ship.name}
                            </span>
                            <div className="flex gap-0.5">
                                {Array(ship.size).fill(0).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-3 h-3 rounded-sm ${i < ship.hits
                                            ? 'bg-red-500'
                                            : ship.placed || isEnemy
                                                ? 'bg-cyan-600'
                                                : 'bg-slate-700'
                                            }`}
                                    />
                                ))}
                            </div>
                            {ship.isSunk && <span className="text-red-400 text-[10px] font-bold">SUNK</span>}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // --- GRID RENDER ---
    const renderGrid = (board, ships, isSelf) => {
        const safeBoard = board || Array(100).fill(0);
        const targetShips = isSelf ? ships : (gameState.ships?.[oppPlayerIndex] || []);

        return (
            <div className="relative">
                {/* Column Labels */}
                <div className="flex ml-6 mb-1">
                    {COLS.map(col => (
                        <div key={col} className="flex-1 text-center text-[10px] text-cyan-500 font-mono">{col}</div>
                    ))}
                </div>

                <div className="flex">
                    {/* Row Labels */}
                    <div className="flex flex-col w-6">
                        {Array(10).fill(0).map((_, i) => (
                            <div key={i} className="flex-1 flex items-center justify-center text-[10px] text-cyan-500 font-mono">
                                {i + 1}
                            </div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-10 gap-px bg-slate-700 border border-slate-600 flex-1 aspect-square shadow-2xl relative overflow-hidden">
                        {!isSelf && gameState.phase === 'PLAYING' && <div className="radar-sweep" />}

                        {Array(100).fill(0).map((_, i) => {
                            const r = Math.floor(i / BOARD_SIZE);
                            const c = i % BOARD_SIZE;
                            const cellState = safeBoard[i];

                            let shipHere = false;
                            let myShipObj = null;
                            if (isSelf && ships) {
                                myShipObj = ships.find(s => isOverlapping(s, r, c));
                                shipHere = !!myShipObj;
                            }

                            const foundShip = targetShips?.find(s => isOverlapping(s, r, c));
                            const sunkShip = foundShip && foundShip.hits >= foundShip.size;

                            // Preview logic
                            const isPreview = previewData.cells.some(pc => pc.r === r && pc.c === c);
                            const isSelected = selectedShip && isOverlapping(selectedShip, r, c);

                            let bgClass = 'bg-slate-900';
                            let content = null;
                            let extraClass = '';

                            if (isPreview && isSelf && gameState.phase === 'SETUP') {
                                extraClass = previewData.valid ? 'preview-valid' : 'preview-invalid';
                            } else if (cellState === 'HIT') {
                                if (sunkShip) {
                                    bgClass = 'sunk-cell';
                                    content = (
                                        <>
                                            <span className="absolute inset-0 flex items-center justify-center text-lg">💀</span>
                                            <div className="smoke-particle" style={{ left: '20%', animationDelay: '0s' }} />
                                            <div className="smoke-particle" style={{ left: '50%', animationDelay: '0.5s' }} />
                                            <div className="smoke-particle" style={{ left: '80%', animationDelay: '1s' }} />
                                        </>
                                    );
                                } else {
                                    bgClass = 'bg-red-500/80 animate-explosion';
                                    content = <span className="absolute inset-0 flex items-center justify-center text-xs">💥</span>;
                                }
                            } else if (cellState === 'MISS') {
                                bgClass = 'bg-slate-800 animate-ripple';
                                content = <span className="absolute inset-0 flex items-center justify-center text-xs text-white/20">●</span>;
                            } else if (shipHere) {
                                if (sunkShip) {
                                    bgClass = 'sunk-cell';
                                } else {
                                    bgClass = 'bg-cyan-600 border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.5)] z-10';
                                }
                                if (isSelected) {
                                    extraClass = 'ship-selected';
                                }
                            }

                            return (
                                <div
                                    key={i}
                                    draggable={shipHere && isSelf && gameState.phase === 'SETUP'}
                                    onDragStart={(e) => shipHere && isSelf && gameState.phase === 'SETUP' && handleDragStart(myShipObj, e)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => handleCellClick(r, c)}
                                    onMouseEnter={() => isSelf && gameState.phase === 'SETUP' && setHoverCell({ r, c })}
                                    onMouseLeave={() => setHoverCell(null)}
                                    onDrop={(e) => isSelf && gameState.phase === 'SETUP' && handleDrop(r, c, e)}
                                    onDragOver={handleDragOver}
                                    className={`relative w-full h-full cursor-pointer hover:bg-white/10 transition-all ${bgClass} ${extraClass} ${shipHere && isSelf && gameState.phase === 'SETUP' ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                >
                                    {content}
                                    {/* Drag/rotate hint */}
                                    {shipHere && isSelf && gameState.phase === 'SETUP' && (
                                        <span className="absolute bottom-0 right-0 text-[8px] text-cyan-300/50">↻</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Coordinate Display */}
                {hoverCell && isSelf && gameState.phase === 'SETUP' && (
                    <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-mono text-cyan-400">
                        {COLS[hoverCell.c]}-{hoverCell.r + 1}
                    </div>
                )}
            </div>
        );
    };

    const isMyTurn = (gameState.turn === 0 && isHost) || (gameState.turn === 1 && !isHost);

    // MENU SCREEN
    if (gameState.phase === 'MENU') {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center select-none font-mono bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950 via-slate-950 to-black relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] opacity-30 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="mb-10 relative">
                        <div className="absolute -inset-4 bg-blue-500/20 blur-xl rounded-full"></div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-600 tracking-[0.1em] sm:tracking-[0.15em] md:tracking-[0.2em] relative z-10 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                            BATTLESHIP
                        </h1>
                        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent mt-2"></div>
                        <p className="text-[10px] sm:text-xs font-bold text-cyan-500/80 tracking-[0.2em] sm:tracking-[0.5em] mt-2 uppercase">Naval Warfare Simulator</p>
                    </div>

                    <div className="w-full max-w-sm space-y-4">
                        <button
                            onClick={() => selectMode('VS_CPU')}
                            className="w-full group relative overflow-hidden bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 rounded-none p-6 transition-all hover:bg-cyan-950/30"
                            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-cyan-900/40 border border-cyan-500/50 text-2xl group-hover:scale-110 transition-transform">🤖</div>
                                <div className="flex flex-col text-left">
                                    <span className="text-xl font-bold text-cyan-100 group-hover:text-white uppercase tracking-wider">Tactical Sim</span>
                                    <span className="text-[10px] text-cyan-500 font-mono">VS AI COMMANDER</span>
                                </div>
                                <span className="ml-auto text-cyan-500 opacity-50 group-hover:translate-x-1 transition-transform">&gt;&gt;&gt;</span>
                            </div>
                        </button>

                        <button
                            onClick={() => selectMode('PVP')}
                            className="w-full group relative overflow-hidden bg-slate-900 border border-blue-500/30 hover:border-blue-400 rounded-none p-6 transition-all hover:bg-blue-950/30"
                            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-900/40 border border-blue-500/50 text-2xl group-hover:scale-110 transition-transform">⚔️</div>
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

    // GAME RENDER
    return (
        <div className="flex flex-col h-full text-white p-4 overflow-y-auto relative">
            <style>{visualStyles}</style>

            {/* Sunk Toast */}
            {sunkToast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-lg shadow-2xl font-bold text-lg animate-bounce">
                    {sunkToast}
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-4 relative z-10 gap-2">
                <button onClick={onBack} className="text-xs sm:text-sm text-slate-400 hover:text-white flex-shrink-0">← BACK</button>
                <div className="text-center flex-1 min-w-0">
                    <h2 className="text-lg sm:text-2xl font-black text-white tracking-wider sm:tracking-widest uppercase filter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] truncate">BATTLESHIP</h2>
                    <p className={`text-[10px] sm:text-xs font-mono font-bold truncate ${gameState.phase === 'PLAYING' ? (isMyTurn ? 'text-green-400' : 'text-red-400') : 'text-slate-400'}`}>
                        {gameState.phase === 'SETUP' ? 'DEPLOY SHIPS' :
                            gameState.phase === 'GAMEOVER' ? (String(gameState.winner) === myPlayerIndex ? <span className="text-yellow-400 animate-pulse">👑 VICTORY</span> : <span className="text-red-500">💀 DEFEAT</span>) :
                                (isMyTurn ? 'YOUR TURN' : (gameState.mode === 'VS_CPU' ? <span className="animate-pulse text-red-400">CPU...</span> : 'ENEMY TURN'))}
                    </p>
                </div>
                <button onClick={handleReset} className="text-[10px] sm:text-xs bg-red-500/10 text-red-400 px-2 sm:px-3 py-1 rounded hover:bg-red-500/20 flex-shrink-0">🔄</button>
            </div>

            {/* Game Area */}
            <div className="flex flex-col lg:flex-row gap-4 items-start justify-center flex-1 relative z-10">

                {/* YOUR FLEET */}
                <div className="flex-1 w-full max-w-md">
                    <div className="bg-slate-800/50 p-2 rounded-t-lg border-b border-white/5 flex justify-between items-center">
                        <span className="font-bold text-cyan-400 flex items-center gap-2">YOUR FLEET</span>
                        {gameState.phase === 'SETUP' && (
                            <span className="text-[10px] text-cyan-500/60">Tap placed ship to rotate</span>
                        )}
                    </div>

                    {renderGrid(gameState.boards?.[myPlayerIndex], (gameState.phase === 'SETUP' ? myShips : gameState.ships?.[myPlayerIndex]), true)}

                    {/* Ship Tracker - Your Fleet */}
                    <div className="mt-3">
                        <ShipTracker ships={gameState.phase === 'SETUP' ? myShips : gameState.ships?.[myPlayerIndex]} isEnemy={false} />
                    </div>

                    {/* Setup Controls */}
                    {gameState.phase === 'SETUP' && !gameState.ready[myPlayerIndex] && (
                        <div className="mt-4 space-y-3">
                            {/* Ship Selection - Drag to place */}
                            <div className="text-[10px] text-slate-400 text-center">Drag ships to grid or tap to select, then tap grid to place</div>
                            <div className="grid grid-cols-2 gap-2">
                                {SHIPS.map(ship => {
                                    const placed = myShips.some(s => s.name === ship.name);
                                    const isPlacing = placingShip?.name === ship.name;
                                    return (
                                        <button
                                            key={ship.name}
                                            draggable={!placed}
                                            onDragStart={(e) => !placed && handleDragStart(ship, e)}
                                            onDragEnd={handleDragEnd}
                                            onClick={() => !placed && setPlacingShip(isPlacing ? null : ship)}
                                            className={`p-2 text-xs font-bold rounded border transition-all flex items-center gap-2 ${placed ? 'bg-green-900/20 border-green-500/30 text-green-500 cursor-default' :
                                                isPlacing ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500 scale-105 cursor-grab' :
                                                    'bg-slate-800 border-slate-700 hover:border-white/30 cursor-grab'
                                                }`}
                                        >
                                            <span>{ship.icon}</span>
                                            <span>{ship.name} ({ship.size})</span>
                                            {placed && <span className="ml-auto">✓</span>}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Selected Ship Actions */}
                            {selectedShip && (
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 flex flex-col sm:flex-row items-center gap-2">
                                    <span className="text-yellow-400 text-sm font-bold">
                                        {SHIPS.find(s => s.id === selectedShip.id)?.icon} {selectedShip.name}
                                    </span>
                                    <div className="flex gap-2 flex-wrap justify-center">
                                        <button onClick={() => {
                                            const newOrient = selectedShip.orient === 'H' ? 'V' : 'H';
                                            if (canPlaceShip(myShips, selectedShip, selectedShip.r, selectedShip.c, newOrient)) {
                                                const rotatedShip = { ...selectedShip, orient: newOrient };
                                                setMyShips(myShips.map(s => s.id === selectedShip.id ? rotatedShip : s));
                                                setSelectedShip(rotatedShip);
                                            }
                                        }} className="px-3 py-1 text-xs bg-cyan-600 rounded hover:bg-cyan-500">
                                            ↻ Rotate
                                        </button>
                                        <button onClick={() => handleMoveShip(selectedShip)} className="px-3 py-1 text-xs bg-blue-600 rounded hover:bg-blue-500">
                                            ✋ Move
                                        </button>
                                        <button onClick={() => handleRemoveShip(selectedShip)} className="px-3 py-1 text-xs bg-red-600 rounded hover:bg-red-500">
                                            🗑️ Remove
                                        </button>
                                        <button onClick={() => setSelectedShip(null)} className="px-3 py-1 text-xs bg-slate-600 rounded hover:bg-slate-500">
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Instructions */}
                            {!selectedShip && (
                                <div className="text-[10px] text-slate-500 text-center">
                                    Tap placed ship to edit • Drag to position
                                </div>
                            )}

                            {/* Confirm Button */}
                            <button
                                disabled={myShips.length < 5}
                                onClick={handleReady}
                                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 font-bold rounded shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-cyan-500/25 transition-all"
                            >
                                ✅ CONFIRM DEPLOYMENT ({myShips.length}/5 Ships)
                            </button>
                        </div>
                    )}

                    {gameState.phase === 'SETUP' && gameState.ready[myPlayerIndex] && (
                        <div className="mt-4 text-center p-4 bg-slate-800/50 rounded animate-pulse text-cyan-400 border border-cyan-500/30">
                            WAITING FOR OPPONENT...
                        </div>
                    )}
                </div>

                {/* ENEMY FLEET */}
                <div className={`flex-1 w-full max-w-md transition-opacity duration-500 ${gameState.phase === 'SETUP' ? 'opacity-30 blur-sm pointer-events-none' : 'opacity-100'}`}>
                    <div className="bg-slate-800/50 p-2 rounded-t-lg border-b border-white/5 flex justify-between">
                        <span className="font-bold text-red-400">ENEMY WATERS</span>
                        <span className="text-xs text-slate-500 animate-pulse">RADAR ONLINE</span>
                    </div>

                    {renderGrid(gameState.boards?.[oppPlayerIndex], [], false)}

                    {/* Ship Tracker - Enemy Fleet */}
                    <div className="mt-3">
                        <ShipTracker ships={gameState.ships?.[oppPlayerIndex]} isEnemy={true} />
                    </div>
                </div>

                {/* Game Over Overlay */}
                {gameState.phase === 'GAMEOVER' && (
                    <GameEndOverlay
                        winner={String(gameState.winner) === myPlayerIndex}
                        score={String(gameState.winner) === myPlayerIndex ? 'VICTORY' : 'DEFEAT'}
                        onRestart={() => isHost && handleReset()}
                        onExit={() => { handleReset(); onBack(); }}
                        isHost={isHost}
                    />
                )}
            </div>
        </div>
    );
}
