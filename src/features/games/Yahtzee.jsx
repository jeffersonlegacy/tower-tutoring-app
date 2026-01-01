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
    const [viewingPlayerId, setViewingPlayerId] = useState(null);

    // --- CPU TURN LOGIC (MUST BE BEFORE ANY CONDITIONAL RETURNS) ---
    useEffect(() => {
        // Early exit if not ready - but hook is still called consistently
        if (!gameState || gameState.status !== 'PLAYING' || rolling) return;

        const players = Array.isArray(gameState.players)
            ? gameState.players
            : Object.values(gameState.players || {}).filter(p => !!p);

        const currentPlayerIndex = (gameState.turnIndex || 0) % (players.length || 1);
        const currentPlayer = players[currentPlayerIndex];

        if (!currentPlayer?.isBot) return;

        const botId = currentPlayer.id;
        const scores = gameState.scores || {};
        const botScores = scores[botId] || {};
        const dice = Array.isArray(gameState.dice) ? gameState.dice : Array(5).fill({ value: 1, held: false });

        const findBestCategory = (diceVals) => {
            let bestCat = null;
            let bestScore = -1;

            CATEGORIES.forEach(cat => {
                if (botScores[cat.id] !== undefined) return;
                const score = calculateScore(diceVals, cat.id);
                if (score > bestScore) {
                    bestScore = score;
                    bestCat = cat.id;
                }
            });

            if (bestCat === null) {
                for (const cat of CATEGORIES) {
                    if (botScores[cat.id] === undefined) {
                        bestCat = cat.id;
                        break;
                    }
                }
            }

            return bestCat;
        };

        const executeBotTurn = async () => {
            setRolling(true);
            await new Promise(r => setTimeout(r, 800));
            let newDice = dice.map(() => ({ value: rollDie(), held: false }));
            updateState({ dice: newDice, rollCount: 1 });
            setRolling(false);

            await new Promise(r => setTimeout(r, 1000));
            setRolling(true);
            await new Promise(r => setTimeout(r, 600));
            newDice = newDice.map(d => ({ ...d, held: d.value >= 4 || Math.random() > 0.5 }));
            newDice = newDice.map(d => d.held ? d : { ...d, value: rollDie() });
            updateState({ dice: newDice, rollCount: 2 });
            setRolling(false);

            await new Promise(r => setTimeout(r, 1000));
            setRolling(true);
            await new Promise(r => setTimeout(r, 600));
            newDice = newDice.map(d => d.held ? d : { ...d, value: rollDie() });
            updateState({ dice: newDice, rollCount: 3 });
            setRolling(false);

            await new Promise(r => setTimeout(r, 1000));
            const diceVals = newDice.map(d => d.value);
            const bestCat = findBestCategory(diceVals);

            if (bestCat) {
                const score = calculateScore(diceVals, bestCat);
                const newScores = { ...scores, [botId]: { ...botScores, [bestCat]: score } };

                let nextTurn = gameState.turnIndex + 1;
                let nextRound = gameState.round;
                let nextStatus = gameState.status;
                let winner = null;

                if (nextTurn >= players.length) {
                    nextTurn = 0;
                    nextRound++;
                }

                const MAX_ROUNDS = gameState.mode === 'BLITZ' ? 3 : 13;
                if (nextRound > MAX_ROUNDS) {
                    nextStatus = 'FINISHED';
                    let maxScore = -1;
                    players.forEach(p => {
                        const s = newScores[p.id] || {};
                        const total = Object.values(s).reduce((a, b) => a + b, 0);
                        if (total > maxScore) { maxScore = total; winner = p.id; }
                    });
                }

                updateState({
                    scores: newScores,
                    turnIndex: nextTurn,
                    round: nextRound,
                    status: nextStatus,
                    winner: winner,
                    rollCount: 0,
                    dice: Array(5).fill({ value: 1, held: false })
                });
            }
        };

        const timeout = setTimeout(executeBotTurn, 500);
        return () => clearTimeout(timeout);
    }, [gameState, rolling, updateState]);

    // --- LOADING GUARD (AFTER ALL HOOKS) ---
    if (!gameState) {
        return <div className="flex items-center justify-center h-full bg-slate-900 text-yellow-500 font-bold animate-pulse uppercase tracking-widest">Loading Game Tables...</div>;
    }

    // --- SAFE DATA HANDLING ---
    const playersList = (Array.isArray(gameState?.players)
        ? gameState.players
        : Object.values(gameState?.players || {}).filter(p => !!p)
    ).map(p => ({
        ...p,
        name: p.name || `Player ${String(p.id).slice(0, 4)}`
    }));

    const safeScores = (gameState?.scores && typeof gameState.scores === 'object') ? gameState.scores : {};
    const safeDice = Array.isArray(gameState?.dice) ? gameState.dice : Array(5).fill({ value: 1, held: false });

    const activePlayerIndex = (typeof gameState?.turnIndex === 'number')
        ? (gameState.turnIndex % (playersList.length || 1))
        : 0;

    const activePlayer = playersList[activePlayerIndex];
    const isMyTurn = activePlayer?.id === playerId && gameState?.status === 'PLAYING';
    const isBotTurn = activePlayer?.isBot && gameState?.status === 'PLAYING';

    const myPlayer = playersList.find(p => p.id === playerId);
    const targetPlayerId = viewingPlayerId || (myPlayer ? playerId : (activePlayer?.id || null));
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
                onExit={() => {
                    // Allow anyone to reset to Lobby to prevent stuck games
                    updateState({
                        status: 'LOBBY',
                        scores: {},
                        turnIndex: 0,
                        round: 1,
                        dice: Array(5).fill({ value: 1, held: false }),
                        rollCount: 0
                    });
                    onBack();
                }}
                isHost={isHost}
            />
        );
    }

    // --- LOBBY ---
    if (gameState?.status === 'LOBBY') {
        return (
            <div className="flex flex-col h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-950 via-slate-950 to-black p-6 select-none overflow-y-auto font-sans">

                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(234,179,8,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(234,179,8,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] opacity-30 pointer-events-none"></div>

                <div className="w-full max-w-md mx-auto relative z-10 animate-in zoom-in duration-500">
                    <div className="flex flex-col items-center mb-10 text-center">
                        <span className="text-8xl mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">🎲</span>
                        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500 tracking-tighter filter drop-shadow-[0_0_20px_rgba(234,179,8,0.5)] italic transform -skew-x-6">
                            YAHTZEE
                        </h1>
                        <p className="text-yellow-500 font-bold tracking-[0.5em] text-xs mt-2 uppercase animate-pulse">High Stakes Dice</p>
                    </div>

                    <div className="space-y-6">
                        {/* Mode Select */}
                        {isHost && (
                            <div className="bg-slate-900/80 backdrop-blur-md p-2 rounded-xl border border-yellow-500/30 flex gap-2">
                                {['BLITZ', 'CLASSIC'].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => updateState({ mode: m })}
                                        className={`flex-1 py-3 text-xs font-black rounded-lg transition-all uppercase tracking-wider ${gameState.mode === m
                                            ? 'bg-gradient-to-br from-yellow-500 to-orange-600 text-black shadow-lg shadow-orange-500/20'
                                            : 'text-slate-500 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        {m} <span className="block text-[8px] opacity-70 font-normal">{m === 'BLITZ' ? '3 Rounds' : '13 Rounds'}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Players List */}
                        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
                            <div className="bg-black/40 p-3 border-b border-white/5 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lobby ({playersList.length}/10)</span>
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    <span className="text-[10px] font-bold text-green-500 uppercase">Live</span>
                                </div>
                            </div>
                            <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
                                {playersList.map(p => (
                                    <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-inner
                                            ${p.id === playerId ? 'bg-yellow-500 text-black' : 'bg-slate-800 text-slate-400'}`}>
                                            {p.name[0]}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`font-bold text-sm ${p.id === playerId ? 'text-white' : 'text-slate-300'}`}>
                                                {p.name} {p.id === playerId ? '(You)' : ''}
                                            </span>
                                            <span className="text-[10px] text-slate-600 uppercase font-mono">{p.isBot ? 'CPU OPPONENT' : 'HUMAN PLAYER'}</span>
                                        </div>
                                        {p.isHost && <span className="ml-auto text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/30">HOST</span>}
                                    </div>
                                ))}
                                {playersList.length === 0 && <div className="text-center italic text-slate-600 py-8 text-sm">Waiting for players to join...</div>}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-4 pt-4">
                            {!myPlayer ? (
                                <button onClick={handleJoin} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all uppercase tracking-widest transform hover:scale-105">
                                    Join Lobby
                                </button>
                            ) : (
                                isHost ? (
                                    <div className="space-y-3">
                                        <button onClick={handleStart} className="w-full group relative overflow-hidden py-5 bg-gradient-to-r from-yellow-500 to-orange-600 text-black font-black text-xl rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all uppercase tracking-widest hover:scale-105 active:scale-95">
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>
                                            <div className="relative flex items-center justify-center gap-3">
                                                <span>Start Match</span>
                                                <span className="text-2xl group-hover:rotate-180 transition-transform duration-500">🎲</span>
                                            </div>
                                        </button>
                                        <button onClick={() => {
                                            const bots = ['Robo', 'Dicer', 'Chancey', 'SnakeEyes'];
                                            const name = bots[Math.floor(Math.random() * bots.length)] + ' ' + Math.floor(Math.random() * 99);
                                            updateState({ players: [...playersList, { id: `BOT_${Date.now()}`, name, isBot: true }] });
                                        }} className="w-full py-3 border border-white/10 hover:border-yellow-500/50 rounded-xl text-slate-400 text-xs font-bold uppercase hover:text-yellow-400 hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                                            <span>+ Add AI Opponent</span>
                                            <span>🤖</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-full py-4 bg-slate-900 border border-slate-800 rounded-xl text-center">
                                        <div className="flex items-center justify-center gap-3 mb-1">
                                            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></span>
                                            <span className="text-yellow-500 font-bold uppercase tracking-widest text-sm">Awaiting Host</span>
                                        </div>
                                        <span className="text-slate-600 text-xs">The match will begin shortly</span>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                    <button onClick={onBack} className="w-full mt-8 py-3 text-slate-500 hover:text-white font-bold text-xs uppercase tracking-[0.2em] transition-colors rounded-xl hover:bg-white/5">Exit Arcade</button>
                </div>
            </div>
        );
    }

    // --- GAMEPLAY SCORECARD RENDERER ---

    // Helpers for scorecard
    // CRITICAL FIX: safeScores is guaranteed object, but targetPlayerId might be null
    const pScores = (targetPlayerId && safeScores[targetPlayerId]) || {};
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
                    <button onClick={() => updateState({ status: 'LOBBY', scores: {}, turnIndex: 0, round: 1, dice: Array(5).fill({ value: 1, held: false }), rollCount: 0 })} className="text-red-400 hover:text-white font-bold text-xs uppercase">🔄</button>
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
