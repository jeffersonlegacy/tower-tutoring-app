import React, { useState, useEffect, useRef } from 'react';
import { useRealtimeGame } from '../../hooks/useRealtimeGame';
import { CATEGORIES, calculateScore } from './yahtzeeLogic';
import GameEndOverlay from './GameEndOverlay';
import confetti from 'canvas-confetti';

// --- VISUAL ASSETS & THEME ---
const THEME = {
    bg: 'bg-[#fefce8]', // Light yellow paper
    text: 'text-slate-900',
    headerBg: 'bg-[#dc2626]', // Red header
    headerText: 'text-white',
    gridLines: 'border-slate-300',
    accent: 'text-[#dc2626]',
    inputBg: 'bg-white',
    highlight: 'bg-yellow-200'
};

const rollDie = () => Math.floor(Math.random() * 6) + 1;

// --- INITIAL STATE ---
const INITIAL_STATE = {
    status: 'LOBBY', // LOBBY, PLAYING, FINISHED
    mode: 'BLITZ',   // BLITZ (3 Rnds), CLASSIC (13 Rnds)
    players: [],
    turnIndex: 0,
    round: 1,
    rollCount: 0,
    dice: Array(5).fill({ value: 1, held: false }),
    scores: {}
};

// --- DICE ICONS ---
const DiceIcon = ({ value, locked, onClick, size = "md" }) => {
    const pips = {
        1: ['center'],
        2: ['top-left', 'bottom-right'],
        3: ['top-left', 'center', 'bottom-right'],
        4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
        5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
        6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right']
    };

    // Pip Positions
    const posMap = {
        'top-left': 'top-2 left-2',
        'top-right': 'top-2 right-2',
        'middle-left': 'top-1/2 -translate-y-1/2 left-2',
        'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'middle-right': 'top-1/2 -translate-y-1/2 right-2',
        'bottom-left': 'bottom-2 left-2',
        'bottom-right': 'bottom-2 right-2'
    };

    const sizeClasses = size === 'sm' ? 'w-8 h-8 rounded-md' : 'w-14 h-14 rounded-xl shadow-lg';
    const pipSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-3 h-3';

    return (
        <button
            onClick={onClick}
            disabled={!onClick}
            className={`relative ${sizeClasses} transition-all duration-200 flex-shrink-0
            ${locked
                    ? 'bg-red-500 ring-2 ring-red-600 scale-95'
                    : 'bg-white ring-1 ring-slate-300 hover:scale-105'}
            `}
        >
            {pips[value]?.map((pos, i) => (
                <div key={i} className={`absolute rounded-full ${locked ? 'bg-white' : 'bg-black'} ${posMap[pos]} ${pipSize}`} />
            ))}
        </button>
    );
};

export default function Yahtzee({ sessionId, onBack }) {
    const gameId = 'yahtzee_multi_v1';
    const { gameState, playerId, isHost, updateState } = useRealtimeGame(sessionId, gameId, INITIAL_STATE);
    const [rolling, setRolling] = useState(false);
    const [viewingPlayerId, setViewingPlayerId] = useState(null); // To view opponent scorecards

    // --- SAFE DATA HANDLING (CRASH FIX) ---
    const playersList = Array.isArray(gameState?.players)
        ? gameState.players
        : Object.values(gameState?.players || {}).filter(p => !!p);

    const safeScores = gameState?.scores || {};
    const safeDice = Array.isArray(gameState?.dice) ? gameState.dice : Array(5).fill({ value: 1, held: false });

    // Current Active Player Logic
    const activePlayerIndex = (gameState?.turnIndex) % (playersList.length || 1);
    const activePlayer = playersList[activePlayerIndex];
    const isMyTurn = activePlayer?.id === playerId && gameState?.status === 'PLAYING';

    const myPlayer = playersList.find(p => p.id === playerId);

    // Who we are looking at (default to self, or active player if spectating)
    const targetPlayerId = viewingPlayerId || (playersList.find(p => p.id === playerId) ? playerId : activePlayer?.id);
    const targetPlayer = playersList.find(p => p.id === targetPlayerId);

    // --- ACTIONS ---

    const handleJoin = () => {
        if (playersList.find(p => p.id === playerId)) return; // Already joined
        const newPlayer = {
            id: playerId,
            name: `Player ${(playersList.length || 0) + 1}`,
            color: '#000',
            joinedAt: Date.now()
        };
        updateState({ players: [...playersList, newPlayer] });
    };

    const handleStart = () => {
        updateState({
            status: 'PLAYING',
            turnIndex: 0,
            round: 1,
            rollCount: 0,
            dice: Array(5).fill({ value: 6, held: false }),
            scores: {}
        });
    };

    const handleRoll = () => {
        if (!isMyTurn || gameState.rollCount >= 3 || rolling) return;
        setRolling(true);

        // Animation delay
        setTimeout(() => {
            const newDice = safeDice.map(d => d.held ? d : { ...d, value: rollDie() });
            updateState({
                dice: newDice,
                rollCount: (gameState.rollCount || 0) + 1
            });
            setRolling(false);
        }, 600);
    };

    const toggleHold = (index) => {
        if (!isMyTurn || gameState.rollCount === 0) return;
        const newDice = [...safeDice];
        newDice[index] = { ...newDice[index], held: !newDice[index].held };
        updateState({ dice: newDice });
    };

    const handleSelectScore = (catId) => {
        if (!isMyTurn) return;

        // Double check not already filled
        const pScores = safeScores[playerId] || {};
        if (pScores[catId] !== undefined) return;

        const diceVals = safeDice.map(d => d.value);
        const score = calculateScore(diceVals, catId);

        // Commit Score
        const newScores = { ...safeScores, [playerId]: { ...pScores, [catId]: score } };

        // Next Turn Calculation
        let nextTurn = gameState.turnIndex + 1;
        let nextRound = gameState.round;
        let nextStatus = gameState.status;
        let winner = null;

        if (nextTurn >= playersList.length) {
            nextTurn = 0;
            nextRound++;
        }

        const MAX_ROUNDS = gameState.mode === 'BLITZ' ? 3 : 13;
        if (nextRound > MAX_ROUNDS) {
            nextStatus = 'FINISHED';
            // Calculate Winner
            let maxScore = -1;
            playersList.forEach(p => {
                const s = newScores[p.id] || {};
                const total = Object.values(s).reduce((a, b) => a + b, 0);
                if (total > maxScore) { maxScore = total; winner = p.id; }
            });
        }

        const updatePayload = {
            scores: newScores,
            turnIndex: nextTurn,
            round: nextRound,
            status: nextStatus,
            winner: winner,
            rollCount: 0,
            dice: Array(5).fill({ value: 1, held: false })
        };

        if (score >= 50 && catId === 'yahtzee') {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#ffd700', '#ff0000'] });
        }

        updateState(updatePayload);
    };

    // --- GAME OVER ---
    if (gameState?.status === 'FINISHED') {
        const myTotal = Object.values(safeScores[playerId] || {}).reduce((a, b) => a + b, 0);
        const isWinner = gameState.winner === playerId;
        return (
            <GameEndOverlay
                winner={isWinner}
                score={myTotal}
                onRestart={() => isHost && handleStart()}
                onExit={onBack}
                isHost={isHost}
            />
        );
    }

    // --- LOBBY ---
    if (gameState?.status === 'LOBBY') {
        return (
            <div className="flex flex-col h-full bg-[#fefce8] items-center justify-center p-6 text-slate-800 font-sans">
                <div className="w-full max-w-md bg-white shadow-xl rounded-sm overflow-hidden border border-slate-300">
                    <div className="bg-[#dc2626] p-6 text-center">
                        <h1 className="text-4xl font-black text-white tracking-tighter italic drop-shadow-md">YAHTZEE</h1>
                        <p className="text-red-100 font-bold tracking-widest text-xs mt-1 uppercase">Classic Dice Game</p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Mode Select */}
                        {isHost && (
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                {['BLITZ', 'CLASSIC'].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => updateState({ mode: m })}
                                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${gameState.mode === m ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        {m} ({m === 'BLITZ' ? '3 Rnds' : '13 Rnds'})
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Players */}
                        <div className="space-y-2">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Players ({playersList.length}/10)</div>
                            {playersList.map(p => (
                                <div key={p.id} className="flex items-center gap-3 p-2 border-b border-slate-100">
                                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600">{p.name[0]}</div>
                                    <span className="font-bold text-slate-700">{p.name} {p.id === playerId ? '(You)' : ''}</span>
                                    {p.isBot && <span className="text-[10px] bg-slate-200 px-2 rounded-full text-slate-500">BOT</span>}
                                </div>
                            ))}
                            {playersList.length === 0 && <div className="text-center italic text-slate-400 py-4">Waiting for players...</div>}
                        </div>

                        {/* Actions */}
                        {!myPlayer ? (
                            <button onClick={handleJoin} className="w-full py-4 bg-green-600 text-white font-black text-xl rounded shadow-lg hover:bg-green-500 hover:-translate-y-1 transition-all uppercase tracking-widest">
                                Join Game
                            </button>
                        ) : (
                            isHost ? (
                                <div className="space-y-3">
                                    <button onClick={handleStart} className="w-full py-4 bg-[#dc2626] text-white font-black text-xl rounded shadow-lg hover:bg-red-500 hover:-translate-y-1 transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                                        <span>Start Game</span>
                                        <span className="text-2xl">🎲</span>
                                    </button>
                                    <button onClick={() => {
                                        const bots = ['Robo', 'Dicer', 'Chancey'];
                                        const name = bots[Math.floor(Math.random() * bots.length)] + ' ' + Math.floor(Math.random() * 99);
                                        updateState({ players: [...playersList, { id: `BOT_${Date.now()}`, name, isBot: true }] });
                                    }} className="w-full py-2 text-slate-400 text-xs font-bold uppercase hover:text-red-500 transition-colors">
                                        + Add Bot
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center text-slate-500 font-bold animate-pulse">Waiting for Host...</div>
                            )
                        )}
                    </div>
                    <button onClick={onBack} className="w-full py-3 text-slate-400 font-bold text-xs uppercase hover:bg-slate-50">Exit</button>
                </div>
            </div>
        );
    }

    // --- GAMEPLAY SCORECARD RENDERER ---

    // Helpers for scorecard
    const pScores = safeScores[targetPlayerId] || {};
    const getScore = (cid) => pScores[cid] !== undefined ? pScores[cid] : null;

    // Calculate Potentials (only for me)
    const diceVals = safeDice.map(d => d.value);
    const getPotential = (cid) => {
        if (!isMyTurn || gameState.rollCount === 0 || pScores[cid] !== undefined) return null;
        if (targetPlayerId !== playerId) return null;
        return calculateScore(diceVals, cid);
    };

    const UpperSection = CATEGORIES.slice(0, 6);
    const LowerSection = CATEGORIES.slice(6);

    const upperSum = UpperSection.reduce((acc, cat) => acc + (pScores[cat.id] || 0), 0);
    const bonus = upperSum >= 63 ? 35 : 0;
    const lowerSum = LowerSection.reduce((acc, cat) => acc + (pScores[cat.id] || 0), 0);
    const totalScore = upperSum + bonus + lowerSum;


    // --- RENDER ---
    return (
        <div className="flex flex-col h-full bg-[#fefce8] text-slate-900 overflow-hidden font-sans">

            {/* Header / Nav */}
            <div className={`shrink-0 h-14 ${THEME.headerBg} flex items-center justify-between px-4 shadow-md z-10`}>
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-white/80 hover:text-white font-bold text-xs uppercase">Exit</button>
                    <div className="flex flex-col">
                        <span className="text-white font-black italic tracking-tighter text-lg leading-none">YAHTZEE</span>
                        <span className="text-white/60 text-[10px] uppercase font-bold tracking-widest">
                            Rnd {gameState.round}/{gameState.mode === 'BLITZ' ? 3 : 13}
                        </span>
                    </div>
                </div>

                {/* Player Toggle (Mobile style) */}
                <div className="flex gap-1 bg-black/20 p-1 rounded-lg">
                    {playersList.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setViewingPlayerId(p.id)}
                            className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs transition-all border-2
                            ${targetPlayerId === p.id
                                    ? 'bg-white text-red-600 border-white'
                                    : `bg-transparent text-white/70 border-transparent hover:bg-white/10`
                                }
                            ${activePlayer?.id === p.id ? 'ring-2 ring-yellow-400' : ''}
                            `}
                        >
                            {p.name[0]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scorecard Area */}
            <div className="flex-1 overflow-y-auto p-4 pb-40 custom-scrollbar">
                <div className="max-w-md mx-auto bg-white shadow-xl rounded-sm overflow-hidden border border-slate-300">

                    {/* Player Name Header */}
                    <div className="bg-slate-100 p-2 border-b border-slate-300 flex justify-between items-center">
                        <span className="font-bold text-slate-700 uppercase tracking-tight">{targetPlayer?.name || 'Unknown'}</span>
                        <span className="font-black text-2xl text-red-600">{totalScore}</span>
                    </div>

                    <div className="flex divide-x divide-slate-300">
                        {/* LEFT COLUMN: UPPER SECTION */}
                        <div className="flex-1">
                            <div className="bg-red-600 text-white text-[10px] font-bold uppercase p-1 text-center tracking-widest">Upper Section</div>
                            {UpperSection.map((cat, i) => {
                                const score = getScore(cat.id);
                                const potential = getPotential(cat.id);
                                return (
                                    <ScoreRow
                                        key={cat.id}
                                        label={cat.label}
                                        score={score}
                                        potential={potential}
                                        onClick={() => handleSelectScore(cat.id)}
                                        icon={i + 1} // 1-6 icons
                                        bg={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}
                                    />
                                );
                            })}

                            {/* Subtotal & Bonus */}
                            <div className="border-t-2 border-slate-800 bg-slate-100 p-1 flex justify-between items-center text-xs font-bold border-b border-slate-300">
                                <span>Subtotal</span>
                                <span>{upperSum}</span>
                            </div>
                            <div className="bg-slate-100 p-1 flex justify-between items-center text-xs border-b border-slate-300">
                                <span className="text-slate-500 uppercase text-[10px]">Bonus (63+)</span>
                                <span className={`${bonus > 0 ? 'text-green-600 font-bold' : 'text-slate-400'}`}>{bonus}</span>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: LOWER SECTION */}
                        <div className="flex-1">
                            <div className="bg-red-600 text-white text-[10px] font-bold uppercase p-1 text-center tracking-widest">Lower Section</div>
                            {LowerSection.map((cat, i) => {
                                const score = getScore(cat.id);
                                const potential = getPotential(cat.id);
                                return (
                                    <ScoreRow
                                        key={cat.id}
                                        label={cat.label}
                                        score={score}
                                        potential={potential}
                                        onClick={() => handleSelectScore(cat.id)}
                                        bg={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* DICE ROLLER (Fixed Bottom) */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#334155] p-4 rounded-t-3xl shadow-2xl border-t border-white/10 z-20">
                <div className="max-w-md mx-auto flex flex-col items-center gap-4">

                    {/* Status Text */}
                    <div className="text-white/80 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        {isMyTurn
                            ? (gameState.rollCount >= 3 ? <span className="text-yellow-400 animate-pulse">Select a Score!</span> : <span>Rolls Left: <span className="text-white">{3 - gameState.rollCount}</span></span>)
                            : <span className="text-slate-400">Waiting for {activePlayer?.name}...</span>
                        }
                    </div>

                    {/* Dice Row */}
                    <div className="flex gap-2 justify-center">
                        {safeDice.map((d, i) => (
                            <DiceIcon
                                key={i}
                                value={d.value}
                                locked={d.held}
                                onClick={isMyTurn && gameState.rollCount > 0 && gameState.rollCount < 3 ? () => toggleHold(i) : null}
                            />
                        ))}
                    </div>

                    {/* Roll Button */}
                    <button
                        onClick={handleRoll}
                        disabled={!isMyTurn || gameState.rollCount >= 3 || rolling}
                        className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-lg shadow-lg transition-all
                        ${!isMyTurn || gameState.rollCount >= 3
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:scale-[1.02] active:scale-[0.98] ring-4 ring-offset-2 ring-offset-slate-800 ring-red-500/50'
                            }
                        `}
                    >
                        {rolling ? 'Rolling...' : gameState.rollCount === 0 ? 'Roll Dice' : 'Roll Again'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- SUBCOMPONENTS ---

function ScoreRow({ label, score, potential, onClick, bg, icon }) {
    const isLocked = score !== null;
    const isPotential = potential !== null;

    return (
        <button
            onClick={onClick}
            disabled={!isPotential || isLocked}
            className={`w-full flex items-stretch h-10 border-b border-slate-200 transition-colors ${bg}
            ${isPotential && !isLocked ? 'hover:bg-yellow-100 cursor-pointer' : ''}
            `}
        >
            {/* Label */}
            <div className="w-[60%] flex items-center pl-2 border-r border-slate-200">
                {icon && <span className="text-[10px] font-bold text-slate-400 w-4">{icon}</span>}
                <span className="text-[10px] font-bold text-slate-700 uppercase leading-none text-left">{label}</span>
            </div>

            {/* Value */}
            <div className="flex-1 flex items-center justify-center font-mono text-sm">
                {isLocked ? (
                    <span className="font-bold text-black">{score}</span>
                ) : isPotential ? (
                    <span className="font-bold text-red-500 animate-pulse">{potential}</span>
                ) : (
                    <span className="text-slate-200">-</span>
                )}
            </div>
        </button>
    );
}
