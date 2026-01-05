import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRealtimeGame } from '../../hooks/useRealtimeGame';
import {
    CATEGORIES,
    MINIZEE_CATEGORIES,
    calculateScore,
    calculateMinizeeScore,
    rollMinizeeDie,
    rollStandardDie
} from './yahtzeeLogic';
import GameEndOverlay from './GameEndOverlay';
import confetti from 'canvas-confetti';

// --- INITIAL STATE ---
const INITIAL_STATE = {
    status: 'LOBBY',       // LOBBY, PLAYING, FINISHED
    mode: null,            // MINIZEE or CLASSIC
    players: [],
    turnIndex: 0,
    rollCount: 0,
    dice: [],
    scores: {},
    lastMove: null         // { playerId, category, score, timestamp } for animations
};

// --- 3D DICE ---
const DiceIcon = ({ value, locked, onClick, rolling, size = "md", maxValue = 6 }) => {
    // Minizee dice only show 1-3 pips
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

    const sizeClasses = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-16 h-16' : 'w-12 h-12';
    const pipSize = size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-3 h-3' : 'w-2 h-2';
    const isMinizee = maxValue === 3;

    return (
        <button
            onClick={onClick}
            disabled={!onClick}
            className={`relative ${sizeClasses} rounded-xl transition-all duration-200 flex-shrink-0
                ${rolling ? 'animate-spin' : ''}
                ${locked
                    ? `${isMinizee ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_0_15px_rgba(52,211,153,0.6)]' : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_0_15px_rgba(251,191,36,0.6)]'} scale-110 ring-2 ring-white/50`
                    : 'bg-gradient-to-br from-white to-gray-200 shadow-lg hover:scale-105'
                }`}
        >
            {pips[value]?.map((pos, i) => (
                <div key={i} className={`absolute rounded-full ${posMap[pos]} ${pipSize} ${locked ? 'bg-white' : 'bg-slate-800'}`} />
            ))}
        </button>
    );
};

// --- COMPACT SCORE ROW ---
const ScoreRow = ({ label, icon, myScore, oppScore, potential, onClick, isMyTurn, highlight }) => (
    <div className={`grid grid-cols-[1fr_auto_1fr] gap-2 items-center py-1.5 px-2 rounded-lg transition-all ${highlight ? 'bg-cyan-500/20 animate-pulse' : ''}`}>
        {/* My Score */}
        <div className={`text-right font-bold ${myScore !== null ? 'text-white' : 'text-slate-600'}`}>
            {myScore !== null ? myScore : '-'}
        </div>

        {/* Category */}
        <button
            onClick={onClick}
            disabled={!potential || myScore !== null}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all min-w-[100px] justify-center ${potential && myScore === null && isMyTurn
                    ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 border border-cyan-400/50 hover:border-cyan-400 text-white cursor-pointer'
                    : myScore !== null
                        ? 'bg-slate-800/50 text-slate-500'
                        : 'bg-slate-900/50 text-slate-600'
                }`}
        >
            <span>{icon}</span>
            <span className="truncate">{label}</span>
            {potential && myScore === null && isMyTurn && (
                <span className="text-cyan-400 font-black ml-1">+{potential}</span>
            )}
        </button>

        {/* Opponent Score */}
        <div className={`font-bold ${oppScore !== null ? 'text-white' : 'text-slate-600'}`}>
            {oppScore !== null ? oppScore : '-'}
        </div>
    </div>
);

export default function Yahtzee({ sessionId, onBack }) {
    const gameId = 'yahtzee_v2_modes';
    const { gameState, playerId, isHost, updateState } = useRealtimeGame(sessionId, gameId, INITIAL_STATE);
    const [rolling, setRolling] = useState(false);
    const [showScorePop, setShowScorePop] = useState(null);
    const lastMoveRef = useRef(null);

    // --- CPU TURN LOGIC ---
    useEffect(() => {
        if (!gameState || gameState.status !== 'PLAYING' || rolling) return;

        const players = Array.isArray(gameState.players) ? gameState.players : Object.values(gameState.players || {}).filter(p => !!p);
        const currentPlayer = players[(gameState.turnIndex || 0) % players.length];

        if (!currentPlayer?.isBot) return;

        const botId = currentPlayer.id;
        const scores = gameState.scores?.[botId] || {};
        const dice = gameState.dice || [];
        const isMinizee = gameState.mode === 'MINIZEE';
        const cats = isMinizee ? MINIZEE_CATEGORIES : CATEGORIES;

        // Simple bot: roll 3 times, pick best available category
        const timeout = setTimeout(() => {
            if (gameState.rollCount < 3) {
                // Roll
                const rollFn = isMinizee ? rollMinizeeDie : rollStandardDie;
                const diceCount = isMinizee ? 3 : 5;
                const newDice = (dice.length ? dice : Array(diceCount).fill({ value: 1, held: false }))
                    .map(d => d.held ? d : { ...d, value: rollFn() });
                updateState({ dice: newDice, rollCount: (gameState.rollCount || 0) + 1 });
            } else {
                // Pick best category
                const diceVals = dice.map(d => d.value);
                let best = { id: null, score: -1 };

                for (const cat of cats) {
                    if (scores[cat.id] !== undefined) continue;
                    const s = isMinizee
                        ? calculateMinizeeScore(diceVals, cat.id, cat.id === 'sum_choice' ? Math.max(...diceVals) : null)
                        : calculateScore(diceVals, cat.id);
                    if (s > best.score) best = { id: cat.id, score: s };
                }

                if (!best.id) {
                    // All filled or pass
                    const unfilled = cats.find(c => scores[c.id] === undefined);
                    best = { id: unfilled?.id || 'pass', score: 0 };
                }

                const newScores = { ...gameState.scores, [botId]: { ...scores, [best.id]: best.score } };
                const nextTurn = (gameState.turnIndex + 1) % players.length;

                // Check win condition
                const botScoreCount = Object.keys(newScores[botId] || {}).length;
                const totalCats = isMinizee ? 3 : 13;
                const allPlayersFinished = players.every(p => Object.keys(newScores[p.id] || {}).length >= totalCats);

                updateState({
                    scores: newScores,
                    turnIndex: nextTurn,
                    rollCount: 0,
                    dice: Array(isMinizee ? 3 : 5).fill({ value: 1, held: false }),
                    status: allPlayersFinished ? 'FINISHED' : 'PLAYING',
                    lastMove: { playerId: botId, category: best.id, score: best.score, timestamp: Date.now() }
                });
            }
        }, 1000);

        return () => clearTimeout(timeout);
    }, [gameState, rolling, updateState]);

    // --- Last move highlight ---
    useEffect(() => {
        if (gameState?.lastMove && gameState.lastMove.timestamp !== lastMoveRef.current) {
            lastMoveRef.current = gameState.lastMove.timestamp;
            if (gameState.lastMove.playerId !== playerId) {
                setShowScorePop(gameState.lastMove);
                setTimeout(() => setShowScorePop(null), 1500);
            }
        }
    }, [gameState?.lastMove, playerId]);

    // --- LOADING ---
    if (!gameState) {
        return (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-900 via-slate-900 to-slate-950">
                <div className="text-white text-xl animate-pulse">Loading...</div>
            </div>
        );
    }

    // --- DATA ---
    const playersList = (Array.isArray(gameState.players) ? gameState.players : Object.values(gameState.players || {}).filter(p => !!p))
        .filter(p => p?.id && typeof p.id === 'string' && p.id.length > 0);

    const isMinizee = gameState.mode === 'MINIZEE';
    const diceCount = isMinizee ? 3 : 5;
    const categories = isMinizee ? MINIZEE_CATEGORIES : CATEGORIES;
    const safeDice = Array.isArray(gameState.dice) && gameState.dice.length === diceCount
        ? gameState.dice
        : Array(diceCount).fill({ value: 1, held: false });
    const safeScores = gameState.scores || {};

    const activePlayerIndex = (gameState.turnIndex || 0) % (playersList.length || 1);
    const activePlayer = playersList[activePlayerIndex];
    const isMyTurn = activePlayer?.id === playerId && gameState.status === 'PLAYING';
    const myPlayer = playersList.find(p => p.id === playerId);
    const opponent = playersList.find(p => p.id !== playerId) || null;

    // --- HANDLERS ---
    const handleJoin = () => {
        if (playersList.find(p => p.id === playerId)) return;
        updateState({
            players: [...playersList, {
                id: playerId,
                name: `P${playersList.filter(p => !p.isBot).length + 1}`,
                isBot: false,
                isHost
            }]
        });
    };

    const handleAddBot = () => {
        const names = ['Bot-X', 'Dice-O', 'Rolly'];
        updateState({
            players: [...playersList, {
                id: `BOT_${Date.now()}`,
                name: names[playersList.length % names.length],
                isBot: true
            }]
        });
    };

    const handleStart = (mode) => {
        const dc = mode === 'MINIZEE' ? 3 : 5;
        updateState({
            status: 'PLAYING',
            mode,
            turnIndex: 0,
            rollCount: 0,
            dice: Array(dc).fill({ value: 1, held: false }),
            scores: {},
            lastMove: null
        });
    };

    const handleRoll = () => {
        if (!isMyTurn || gameState.rollCount >= 3 || rolling) return;
        setRolling(true);

        setTimeout(() => {
            const rollFn = isMinizee ? rollMinizeeDie : rollStandardDie;
            const newDice = safeDice.map(d => d.held ? d : { ...d, value: rollFn() });
            updateState({ dice: newDice, rollCount: gameState.rollCount + 1 });
            setRolling(false);
        }, 400);
    };

    const toggleHold = (index) => {
        if (!isMyTurn || gameState.rollCount === 0 || gameState.rollCount >= 3) return;
        const newDice = [...safeDice];
        newDice[index] = { ...newDice[index], held: !newDice[index].held };
        updateState({ dice: newDice });
    };

    const handleSelectScore = (catId, chosenNumber = null) => {
        if (!isMyTurn || gameState.rollCount === 0) return;

        const myScores = safeScores[playerId] || {};
        if (myScores[catId] !== undefined) return;

        const diceVals = safeDice.map(d => d.value);
        const score = isMinizee
            ? calculateMinizeeScore(diceVals, catId, chosenNumber)
            : calculateScore(diceVals, catId);

        const newScores = { ...safeScores, [playerId]: { ...myScores, [catId]: score } };
        const nextTurn = (gameState.turnIndex + 1) % playersList.length;

        // Check if game finished
        const myScoreCount = Object.keys(newScores[playerId] || {}).length;
        const totalCats = isMinizee ? 3 : 13;
        const allPlayersFinished = playersList.every(p => Object.keys(newScores[p.id] || {}).length >= totalCats);

        // Celebrate
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });

        updateState({
            scores: newScores,
            turnIndex: nextTurn,
            rollCount: 0,
            dice: Array(diceCount).fill({ value: 1, held: false }),
            status: allPlayersFinished ? 'FINISHED' : 'PLAYING',
            lastMove: { playerId, category: catId, score, timestamp: Date.now() }
        });
    };

    const handlePass = () => {
        if (!isMyTurn) return;
        const myScores = safeScores[playerId] || {};
        const unfilled = categories.find(c => myScores[c.id] === undefined);
        if (unfilled) handleSelectScore(unfilled.id);
    };

    // --- CALCULATE TOTALS ---
    const getTotal = (pId) => Object.values(safeScores[pId] || {}).reduce((a, b) => a + b, 0);

    // --- DETERMINE WINNER ---
    const getWinner = () => {
        if (gameState.status !== 'FINISHED') return null;
        let best = { id: null, score: -1 };
        playersList.forEach(p => {
            const t = getTotal(p.id);
            if (t > best.score) best = { id: p.id, score: t };
        });
        return best.id;
    };

    // --- STYLES ---
    const styles = `
        @keyframes slideUp { 0% { transform: translateY(20px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        .slide-up { animation: slideUp 0.3s ease-out; }
    `;

    // ============ LOBBY ============
    if (gameState.status === 'LOBBY') {
        return (
            <div className="flex flex-col h-full bg-gradient-to-br from-purple-900 via-slate-900 to-slate-950 text-white">
                <style>{styles}</style>

                {/* Header */}
                <div className="p-4 flex items-center justify-between bg-slate-900/50 border-b border-white/10">
                    <button onClick={onBack} className="text-white/50 hover:text-white text-sm">← Exit</button>
                    <h1 className="text-xl font-black bg-gradient-to-r from-amber-400 to-pink-400 bg-clip-text text-transparent">YAHTZEE</h1>
                    <div></div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 slide-up">
                    <div className="text-6xl">🎲</div>

                    {/* Players */}
                    <div className="bg-slate-800/50 rounded-xl p-4 w-full max-w-xs border border-white/10">
                        <div className="text-xs text-white/50 uppercase tracking-widest mb-2">Players</div>
                        <div className="space-y-2">
                            {playersList.map(p => (
                                <div key={p.id} className={`flex items-center gap-2 p-2 rounded-lg ${p.id === playerId ? 'bg-cyan-500/20 border border-cyan-500/30' : 'bg-slate-700/30'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${p.isBot ? 'bg-slate-600' : 'bg-gradient-to-br from-cyan-400 to-purple-500'}`}>
                                        {p.isBot ? '🤖' : p.name?.[0] || '?'}
                                    </div>
                                    <span className="font-bold text-sm">{p.name} {p.id === playerId ? '(You)' : ''}</span>
                                </div>
                            ))}
                            {playersList.length === 0 && <div className="text-white/30 text-center py-4">Waiting for players...</div>}
                        </div>
                    </div>

                    {/* Actions */}
                    {!myPlayer ? (
                        <button onClick={handleJoin} className="w-full max-w-xs py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-black text-lg">
                            Join Game
                        </button>
                    ) : isHost ? (
                        <div className="w-full max-w-xs space-y-3">
                            <div className="text-xs text-white/50 uppercase tracking-widest text-center">Choose Mode</div>

                            <button
                                onClick={() => handleStart('MINIZEE')}
                                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-black text-lg hover:scale-[1.02] transition-transform"
                            >
                                ⚡ MINIZEE
                                <div className="text-xs font-normal opacity-80">3 dice • 3 categories • Fast!</div>
                            </button>

                            <button
                                onClick={() => handleStart('CLASSIC')}
                                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-black text-lg hover:scale-[1.02] transition-transform"
                            >
                                🏆 CLASSIC
                                <div className="text-xs font-normal opacity-80">5 dice • 13 categories</div>
                            </button>

                            <button onClick={handleAddBot} className="w-full py-3 border border-white/20 rounded-xl text-white/60 hover:text-white">
                                + Add Bot 🤖
                            </button>
                        </div>
                    ) : (
                        <div className="text-white/50 animate-pulse">Waiting for host...</div>
                    )}
                </div>
            </div>
        );
    }

    // ============ GAME END ============
    if (gameState.status === 'FINISHED') {
        const winner = getWinner();
        const isWinner = winner === playerId;
        return (
            <GameEndOverlay
                winner={isWinner}
                score={getTotal(playerId)}
                onRestart={() => updateState({ ...INITIAL_STATE, players: playersList })}
                onExit={onBack}
                title={isWinner ? 'YOU WIN!' : 'GAME OVER'}
            />
        );
    }

    // ============ GAMEPLAY ============
    const myScores = safeScores[playerId] || {};
    const oppScores = opponent ? (safeScores[opponent.id] || {}) : {};
    const diceVals = safeDice.map(d => d.value);

    const getPotential = (catId) => {
        if (!isMyTurn || gameState.rollCount === 0 || myScores[catId] !== undefined) return null;
        return isMinizee
            ? calculateMinizeeScore(diceVals, catId, catId === 'sum_choice' ? Math.max(...diceVals) : null)
            : calculateScore(diceVals, catId);
    };

    const categoryIcons = {
        'ones': '1️⃣', 'twos': '2️⃣', 'threes': '3️⃣', 'fours': '4️⃣', 'fives': '5️⃣', 'sixes': '6️⃣',
        'three_kind': '🎯', 'four_kind': '🎯', 'full_house': '🏠', 'sm_straight': '📊',
        'lg_straight': '📈', 'yahtzee': '⭐', 'chance': '🎲',
        'sequence': '📈', 'three_kind_mini': '🎯', 'sum_choice': '🔢'
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-purple-900 via-slate-900 to-slate-950 text-white overflow-hidden">
            <style>{styles}</style>

            {/* Opponent score pop */}
            {showScorePop && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-pink-500 text-white px-4 py-2 rounded-full font-bold animate-bounce">
                    {opponent?.name}: +{showScorePop.score}
                </div>
            )}

            {/* Header - Compact */}
            <div className="shrink-0 p-2 flex items-center justify-between bg-slate-900/80 border-b border-white/10">
                <button onClick={onBack} className="text-white/50 hover:text-white text-xs">←</button>
                <div className="text-center">
                    <div className="font-black text-sm bg-gradient-to-r from-amber-400 to-pink-400 bg-clip-text text-transparent">
                        {isMinizee ? '⚡ MINIZEE' : '🏆 CLASSIC'}
                    </div>
                </div>
                <div className={`text-xs px-2 py-1 rounded ${isMyTurn ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                    {isMyTurn ? 'YOUR TURN' : 'WAITING...'}
                </div>
            </div>

            {/* Split Scoreboard Header */}
            <div className="grid grid-cols-3 gap-2 px-2 py-2 bg-slate-900/50 text-xs font-bold">
                <div className="text-right text-cyan-400">{myPlayer?.name || 'You'}: {getTotal(playerId)}</div>
                <div className="text-center text-white/50">VS</div>
                <div className="text-pink-400">{opponent?.name || 'Opponent'}: {opponent ? getTotal(opponent.id) : 0}</div>
            </div>

            {/* Scorecard - Scrollable */}
            <div className="flex-1 overflow-y-auto px-2 py-1">
                <div className="space-y-0.5">
                    {categories.map(cat => (
                        <ScoreRow
                            key={cat.id}
                            label={cat.label}
                            icon={categoryIcons[cat.id] || '🎲'}
                            myScore={myScores[cat.id] !== undefined ? myScores[cat.id] : null}
                            oppScore={opponent && oppScores[cat.id] !== undefined ? oppScores[cat.id] : null}
                            potential={getPotential(cat.id)}
                            onClick={() => handleSelectScore(cat.id)}
                            isMyTurn={isMyTurn}
                            highlight={gameState.lastMove?.category === cat.id && gameState.lastMove?.playerId !== playerId}
                        />
                    ))}

                    {/* Pass option */}
                    {isMyTurn && gameState.rollCount > 0 && (
                        <button
                            onClick={handlePass}
                            className="w-full py-2 mt-2 border border-slate-700 rounded-lg text-slate-500 hover:text-white hover:border-white/30 text-sm"
                        >
                            Pass (Score 0)
                        </button>
                    )}
                </div>
            </div>

            {/* Dice Section - Fixed Bottom */}
            <div className="shrink-0 bg-slate-900/90 border-t border-white/10 p-3">
                {/* Status */}
                <div className="text-center text-xs mb-2 font-bold">
                    {isMyTurn ? (
                        gameState.rollCount >= 3
                            ? <span className="text-amber-400 animate-pulse">Select a score!</span>
                            : <span className="text-white/60">Rolls: {gameState.rollCount}/3</span>
                    ) : (
                        <span className="text-white/40">Waiting for {activePlayer?.name}...</span>
                    )}
                </div>

                {/* Dice */}
                <div className="flex gap-3 justify-center mb-3">
                    {safeDice.map((d, i) => (
                        <DiceIcon
                            key={i}
                            value={d.value}
                            locked={d.held}
                            rolling={rolling && !d.held}
                            size={isMinizee ? 'lg' : 'md'}
                            maxValue={isMinizee ? 3 : 6}
                            onClick={isMyTurn && gameState.rollCount > 0 && gameState.rollCount < 3 ? () => toggleHold(i) : null}
                        />
                    ))}
                </div>

                {/* Roll Button */}
                <button
                    onClick={handleRoll}
                    disabled={!isMyTurn || gameState.rollCount >= 3 || rolling}
                    className={`w-full py-3 rounded-xl font-black text-lg uppercase tracking-wide transition-all ${!isMyTurn || gameState.rollCount >= 3
                            ? 'bg-slate-700 text-slate-500'
                            : 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:scale-[1.01] active:scale-[0.99] shadow-lg'
                        }`}
                >
                    {rolling ? '🎲 Rolling...' : gameState.rollCount === 0 ? '🎲 ROLL' : '🎲 ROLL AGAIN'}
                </button>
            </div>
        </div>
    );
}
