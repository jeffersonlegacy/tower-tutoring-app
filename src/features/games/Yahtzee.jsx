import React, { useState, useEffect, useRef } from 'react';
import { useRealtimeGame } from '../../hooks/useRealtimeGame';
import { CATEGORIES, calculateScore } from './yahtzeeLogic';
import GameEndOverlay from './GameEndOverlay';
import confetti from 'canvas-confetti';

// --- MODERN THEME (Yahtzee With Buddies Style) ---
const rollDie = () => Math.floor(Math.random() * 6) + 1;

// --- INITIAL STATE ---
const INITIAL_STATE = {
    status: 'LOBBY',
    mode: 'BLITZ',
    players: [],
    turnIndex: 0,
    round: 1,
    rollCount: 0,
    dice: Array(5).fill({ value: 1, held: false }),
    scores: {}
};

// --- 3D STYLE DICE COMPONENT ---
const DiceIcon = ({ value, locked, onClick, rolling, size = "md" }) => {
    const pips = {
        1: ['center'],
        2: ['top-left', 'bottom-right'],
        3: ['top-left', 'center', 'bottom-right'],
        4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
        5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
        6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right']
    };

    const posMap = {
        'top-left': 'top-[15%] left-[15%]',
        'top-right': 'top-[15%] right-[15%]',
        'middle-left': 'top-1/2 -translate-y-1/2 left-[15%]',
        'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'middle-right': 'top-1/2 -translate-y-1/2 right-[15%]',
        'bottom-left': 'bottom-[15%] left-[15%]',
        'bottom-right': 'bottom-[15%] right-[15%]'
    };

    const sizeClasses = size === 'sm' ? 'w-10 h-10' : 'w-14 h-14 sm:w-16 sm:h-16';
    const pipSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5 sm:w-3 sm:h-3';

    return (
        <button
            onClick={onClick}
            disabled={!onClick}
            className={`relative ${sizeClasses} rounded-xl transition-all duration-200 flex-shrink-0
                ${rolling ? 'animate-dice-roll' : ''}
                ${locked
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_0_20px_rgba(251,191,36,0.6)] scale-110 ring-2 ring-amber-300'
                    : 'bg-gradient-to-br from-white to-gray-200 shadow-lg hover:scale-105 hover:shadow-xl'
                }
            `}
            style={{
                boxShadow: locked
                    ? '0 4px 15px rgba(251,191,36,0.5), inset 0 2px 4px rgba(255,255,255,0.4)'
                    : '0 4px 10px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.8)'
            }}
        >
            {pips[value]?.map((pos, i) => (
                <div
                    key={i}
                    className={`absolute rounded-full ${posMap[pos]} ${pipSize} ${locked ? 'bg-white shadow-sm' : 'bg-slate-800'
                        }`}
                />
            ))}
        </button>
    );
};

// --- SCORE CATEGORY CARD ---
const ScoreCard = ({ category, score, potential, onClick, isAvailable }) => {
    const isLocked = score !== null;
    const isPotential = potential !== null;

    const categoryIcons = {
        'ones': '1️⃣', 'twos': '2️⃣', 'threes': '3️⃣',
        'fours': '4️⃣', 'fives': '5️⃣', 'sixes': '6️⃣',
        'threeOfKind': '🎯', 'fourOfKind': '🎯', 'fullHouse': '🏠',
        'smallStraight': '📊', 'largeStraight': '📈', 'yahtzee': '⭐', 'chance': '🎲'
    };

    return (
        <button
            onClick={onClick}
            disabled={!isPotential || isLocked}
            className={`w-full p-3 rounded-xl flex items-center justify-between transition-all duration-200 ${isLocked
                ? 'bg-slate-800/50 border border-slate-700'
                : isPotential
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/50 hover:border-cyan-400 hover:scale-[1.02] cursor-pointer shadow-lg'
                    : 'bg-slate-900/50 border border-slate-800'
                }`}
        >
            <div className="flex items-center gap-3">
                <span className="text-xl">{categoryIcons[category.id] || '🎲'}</span>
                <span className={`font-bold text-sm uppercase tracking-wide ${isLocked ? 'text-slate-500' : isPotential ? 'text-white' : 'text-slate-600'
                    }`}>
                    {category.label}
                </span>
            </div>
            <div className={`font-black text-lg ${isLocked
                ? 'text-white'
                : isPotential
                    ? 'text-cyan-400 animate-pulse'
                    : 'text-slate-700'
                }`}>
                {isLocked ? score : isPotential ? `+${potential}` : '-'}
            </div>
        </button>
    );
};

export default function Yahtzee({ sessionId, onBack }) {
    const gameId = 'yahtzee_multi_v1';
    const { gameState, playerId, isHost, updateState } = useRealtimeGame(sessionId, gameId, INITIAL_STATE);
    const [rolling, setRolling] = useState(false);
    const [viewingPlayerId, setViewingPlayerId] = useState(null);
    const [showScoreAnimation, setShowScoreAnimation] = useState(null);

    // --- CPU TURN LOGIC ---
    useEffect(() => {
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
            let best = { id: null, score: -1 };
            for (const cat of CATEGORIES) {
                if (botScores[cat.id] !== undefined) continue;
                const s = calculateScore(diceVals, cat.id);
                if (s > best.score) best = { id: cat.id, score: s };
            }
            if (best.id === null) {
                for (const cat of CATEGORIES) {
                    if (botScores[cat.id] === undefined) { best = { id: cat.id, score: 0 }; break; }
                }
            }
            return best;
        };

        const botTimer = setTimeout(() => {
            const rollCount = gameState.rollCount || 0;
            const diceVals = dice.map(d => d.value);

            if (rollCount < 3) {
                const newDice = dice.map(d => d.held ? d : { ...d, value: rollDie() });
                updateState({ dice: newDice, rollCount: rollCount + 1 });
            } else {
                const best = findBestCategory(diceVals);
                if (best.id) {
                    executeBotTurn(botId, best.id, best.score, players);
                }
            }
        }, 1200);

        return () => clearTimeout(botTimer);
    }, [gameState?.status, gameState?.turnIndex, gameState?.rollCount, rolling]);

    const executeBotTurn = (botId, catId, score, players) => {
        const safeScores = gameState.scores || {};
        const botScores = safeScores[botId] || {};
        const newScores = { ...safeScores, [botId]: { ...botScores, [catId]: score } };

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
            rollCount: 0,
            dice: Array(5).fill({ value: 1, held: false }),
            winner
        });
    };

    // Guard for loading
    if (!gameState) {
        return (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-900 via-slate-900 to-slate-950">
                <div className="text-white text-xl font-bold animate-pulse">Loading...</div>
            </div>
        );
    }

    // Safe data extraction
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
    const myPlayer = playersList.find(p => p.id === playerId);
    const targetPlayerId = viewingPlayerId || (myPlayer ? playerId : (activePlayer?.id || null));
    const targetPlayer = playersList.find(p => p.id === targetPlayerId);

    // --- ACTIONS ---
    const handleJoin = () => {
        // Check if already in the game
        const existingPlayer = playersList.find(p => p.id === playerId && !p.isBot);
        if (existingPlayer) return;

        const newPlayer = {
            id: playerId,
            name: `Player ${(playersList.filter(p => !p.isBot).length || 0) + 1}`,
            color: '#000',
            joinedAt: Date.now(),
            isBot: false,
            isHost: isHost
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

        const pScores = safeScores[playerId] || {};
        if (pScores[catId] !== undefined) return;

        const diceVals = safeDice.map(d => d.value);
        const score = calculateScore(diceVals, catId);

        // Animate score
        setShowScoreAnimation({ catId, score });
        setTimeout(() => setShowScoreAnimation(null), 1000);

        const newScores = { ...safeScores, [playerId]: { ...pScores, [catId]: score } };

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
            let maxScore = -1;
            playersList.forEach(p => {
                const s = newScores[p.id] || {};
                const total = Object.values(s).reduce((a, b) => a + b, 0);
                if (total > maxScore) { maxScore = total; winner = p.id; }
            });

            if (winner === playerId) {
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            }
        }

        updateState({
            scores: newScores,
            turnIndex: nextTurn,
            round: nextRound,
            status: nextStatus,
            rollCount: 0,
            dice: Array(5).fill({ value: 1, held: false }),
            winner
        });
    };

    // --- CSS ANIMATIONS ---
    const styles = `
        @keyframes dice-roll {
            0% { transform: rotate(0deg) scale(1); }
            25% { transform: rotate(15deg) scale(1.1); }
            50% { transform: rotate(-10deg) scale(0.95); }
            75% { transform: rotate(5deg) scale(1.05); }
            100% { transform: rotate(0deg) scale(1); }
        }
        @keyframes glow-pulse {
            0%, 100% { box-shadow: 0 0 20px rgba(6,182,212,0.5); }
            50% { box-shadow: 0 0 40px rgba(6,182,212,0.8); }
        }
        @keyframes score-pop {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.5); opacity: 1; }
            100% { transform: scale(1); opacity: 0; }
        }
        .animate-dice-roll { animation: dice-roll 0.5s ease-in-out; }
        .animate-glow-pulse { animation: glow-pulse 2s ease-in-out infinite; }
        .animate-score-pop { animation: score-pop 1s ease-out forwards; }
    `;

    // --- GAME OVER ---
    if (gameState.status === 'FINISHED') {
        const myScore = Object.values(safeScores[playerId] || {}).reduce((a, b) => a + b, 0);
        const isWinner = gameState.winner === playerId;

        return (
            <GameEndOverlay
                winner={isWinner}
                score={myScore}
                onRestart={() => updateState({ ...INITIAL_STATE })}
                onExit={onBack}
                isHost={isHost}
            />
        );
    }

    // --- LOBBY ---
    if (gameState.status === 'LOBBY') {
        return (
            <div className="flex flex-col items-center justify-center min-h-full p-6 bg-gradient-to-br from-purple-900 via-slate-900 to-slate-950 text-white">
                <style>{styles}</style>

                <div className="max-w-md w-full space-y-8">
                    {/* Title */}
                    <div className="text-center">
                        <div className="flex justify-center gap-2 mb-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="w-10 h-10 bg-gradient-to-br from-white to-gray-200 rounded-lg shadow-lg flex items-center justify-center transform hover:rotate-12 transition-transform">
                                    <span className="text-2xl">🎲</span>
                                </div>
                            ))}
                        </div>
                        <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
                            YAHTZEE
                        </h1>
                        <p className="text-white/50 text-sm mt-1 uppercase tracking-widest">Roll to Win!</p>
                    </div>

                    {/* Players */}
                    <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/10">
                        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">Players</h3>
                        <div className="space-y-2">
                            {playersList.map(p => (
                                <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl ${p.id === playerId ? 'bg-cyan-500/20 border border-cyan-500/30' : 'bg-slate-700/30'
                                    }`}>
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center font-bold text-white">
                                        {p.name[0]}
                                    </div>
                                    <div>
                                        <div className="font-bold">{p.name} {p.id === playerId ? '(You)' : ''}</div>
                                        <div className="text-xs text-white/50">{p.isBot ? '🤖 CPU' : '👤 Player'}</div>
                                    </div>
                                    {p.isHost && <span className="ml-auto text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">HOST</span>}
                                </div>
                            ))}
                            {playersList.length === 0 && (
                                <div className="text-center text-white/30 py-8">Waiting for players...</div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        {!myPlayer ? (
                            <button onClick={handleJoin} className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-black text-xl uppercase tracking-widest shadow-lg hover:scale-105 transition-transform">
                                Join Game
                            </button>
                        ) : isHost ? (
                            <>
                                <button onClick={handleStart} className="w-full py-5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl font-black text-xl text-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform animate-glow-pulse">
                                    🎲 Start Match
                                </button>
                                <button onClick={() => {
                                    const bots = ['Robo', 'Dicer', 'Chancey', 'SnakeEyes'];
                                    const name = bots[Math.floor(Math.random() * bots.length)] + ' ' + Math.floor(Math.random() * 99);
                                    updateState({ players: [...playersList, { id: `BOT_${Date.now()}`, name, isBot: true }] });
                                }} className="w-full py-3 border border-white/20 rounded-xl text-white/60 hover:text-white hover:border-white/40 transition-all">
                                    + Add AI Opponent 🤖
                                </button>
                            </>
                        ) : (
                            <div className="text-center py-4 text-white/50">
                                <div className="animate-pulse">Waiting for host to start...</div>
                            </div>
                        )}
                    </div>

                    <button onClick={onBack} className="w-full py-3 text-white/30 hover:text-white transition-colors text-sm">
                        Exit
                    </button>
                </div>
            </div>
        );
    }

    // --- GAMEPLAY ---
    const pScores = (targetPlayerId && safeScores[targetPlayerId]) || {};
    const diceVals = safeDice.map(d => d.value);
    const getPotential = (cid) => {
        if (!isMyTurn || gameState.rollCount === 0 || pScores[cid] !== undefined) return null;
        if (targetPlayerId !== playerId) return null;
        return calculateScore(diceVals, cid);
    };

    const totalScore = Object.values(pScores).reduce((a, b) => a + b, 0);
    const upperSum = CATEGORIES.slice(0, 6).reduce((acc, cat) => acc + (pScores[cat.id] || 0), 0);
    const bonus = upperSum >= 63 ? 35 : 0;

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-purple-900 via-slate-900 to-slate-950 text-white overflow-hidden">
            <style>{styles}</style>

            {/* Score Animation */}
            {showScoreAnimation && (
                <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                    <div className="text-6xl font-black text-cyan-400 animate-score-pop">
                        +{showScoreAnimation.score}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="shrink-0 p-4 flex items-center justify-between bg-slate-900/50 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-white/60 hover:text-white text-sm">← Exit</button>
                    <button onClick={() => updateState({ status: 'LOBBY', scores: {}, turnIndex: 0, round: 1, dice: Array(5).fill({ value: 1, held: false }), rollCount: 0 })}
                        className="text-red-400 hover:text-red-300">🔄</button>
                </div>
                <div className="text-center">
                    <div className="font-black text-lg bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">YAHTZEE</div>
                    <div className="text-xs text-white/50">Round {gameState.round}/{gameState.mode === 'BLITZ' ? 3 : 13}</div>
                </div>
                <div className="flex items-center gap-2">
                    {playersList.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setViewingPlayerId(p.id)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${targetPlayerId === p.id
                                ? 'bg-gradient-to-br from-cyan-400 to-purple-500 ring-2 ring-white'
                                : 'bg-slate-700 text-white/60'
                                } ${activePlayer?.id === p.id ? 'ring-2 ring-amber-400' : ''}`}
                        >
                            {p.name[0]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scorecard */}
            <div className="flex-1 overflow-y-auto p-4 pb-52">
                <div className="max-w-md mx-auto space-y-4">
                    {/* Player Score Header */}
                    <div className="bg-slate-800/50 rounded-2xl p-4 flex items-center justify-between border border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center font-black text-xl">
                                {targetPlayer?.name?.[0] || '?'}
                            </div>
                            <div>
                                <div className="font-bold">{targetPlayer?.name || 'Unknown'}</div>
                                <div className="text-xs text-white/50">
                                    {upperSum >= 63 ? `+${bonus} Bonus!` : `${63 - upperSum} pts to bonus`}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-black text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text">
                                {totalScore + bonus}
                            </div>
                            <div className="text-xs text-white/50">TOTAL</div>
                        </div>
                    </div>

                    {/* Upper Section */}
                    <div>
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 px-1">Upper Section</h3>
                        <div className="space-y-2">
                            {CATEGORIES.slice(0, 6).map(cat => (
                                <ScoreCard
                                    key={cat.id}
                                    category={cat}
                                    score={pScores[cat.id] !== undefined ? pScores[cat.id] : null}
                                    potential={getPotential(cat.id)}
                                    onClick={() => handleSelectScore(cat.id)}
                                    isAvailable={pScores[cat.id] === undefined}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Lower Section */}
                    <div>
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 px-1">Lower Section</h3>
                        <div className="space-y-2">
                            {CATEGORIES.slice(6).map(cat => (
                                <ScoreCard
                                    key={cat.id}
                                    category={cat}
                                    score={pScores[cat.id] !== undefined ? pScores[cat.id] : null}
                                    potential={getPotential(cat.id)}
                                    onClick={() => handleSelectScore(cat.id)}
                                    isAvailable={pScores[cat.id] === undefined}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Dice Roller (Fixed Bottom) */}
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent p-4 pt-8">
                <div className="max-w-md mx-auto space-y-4">
                    {/* Status */}
                    <div className="text-center text-sm font-bold">
                        {isMyTurn ? (
                            gameState.rollCount >= 3
                                ? <span className="text-amber-400 animate-pulse">Select a Score!</span>
                                : <span className="text-white/60">Rolls: {gameState.rollCount}/3</span>
                        ) : (
                            <span className="text-white/40">Waiting for {activePlayer?.name}...</span>
                        )}
                    </div>

                    {/* Dice */}
                    <div className="flex gap-2 sm:gap-3 justify-center">
                        {safeDice.map((d, i) => (
                            <DiceIcon
                                key={i}
                                value={d.value}
                                locked={d.held}
                                rolling={rolling && !d.held}
                                onClick={isMyTurn && gameState.rollCount > 0 && gameState.rollCount < 3 ? () => toggleHold(i) : null}
                            />
                        ))}
                    </div>

                    {/* Roll Button */}
                    <button
                        onClick={handleRoll}
                        disabled={!isMyTurn || gameState.rollCount >= 3 || rolling}
                        className={`w-full py-4 rounded-2xl font-black text-xl uppercase tracking-widest transition-all ${!isMyTurn || gameState.rollCount >= 3
                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                            }`}
                        style={isMyTurn && gameState.rollCount < 3 ? {
                            boxShadow: '0 0 30px rgba(6,182,212,0.4)'
                        } : {}}
                    >
                        {rolling ? '🎲 Rolling...' : gameState.rollCount === 0 ? '🎲 Roll Dice' : '🎲 Roll Again'}
                    </button>
                </div>
            </div>
        </div>
    );
}
