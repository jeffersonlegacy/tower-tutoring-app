import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useRealtimeGame } from '../../hooks/useRealtimeGame';

// --- 1. ENHANCED MATH ENGINE (Now with Tags) ---
const generateProblem = (difficulty) => {
    let num1, num2, operation, answer, isCorrect, displayedAnswer, tag;
    const coinFlip = Math.random() > 0.5;
    isCorrect = coinFlip;

    // Helper to add variance
    const getOffset = (ans) => {
        const o = Math.floor(Math.random() * 5) + 1;
        return Math.random() > 0.5 ? ans + o : ans - o;
    };

    switch (difficulty) {
        case 'BEGINNER':
            num1 = Math.floor(Math.random() * 10) + 1;
            num2 = Math.floor(Math.random() * 10) + 1;
            operation = '+';
            answer = num1 + num2;
            tag = 'ADDITION';
            break;
        case 'MEDIUM':
            const ops = ['+', '-', '*'];
            operation = ops[Math.floor(Math.random() * ops.length)];
            if (operation === '*') {
                num1 = Math.floor(Math.random() * 12);
                num2 = Math.floor(Math.random() * 12);
                answer = num1 * num2;
                tag = 'MULTIPLICATION';
            } else if (operation === '-') {
                num1 = Math.floor(Math.random() * 50) + 20;
                num2 = Math.floor(Math.random() * 20);
                answer = num1 - num2;
                tag = 'SUBTRACTION';
            } else {
                num1 = Math.floor(Math.random() * 50);
                num2 = Math.floor(Math.random() * 50);
                answer = num1 + num2;
                tag = 'ADDITION';
            }
            break;
        case 'HARD':
        case 'EXPERT': // simplified for brevity, similar logic to before
            const modes = ['*', '/', '+', '-'];
            operation = modes[Math.floor(Math.random() * modes.length)];
            num1 = Math.floor(Math.random() * 20) + 5;
            num2 = Math.floor(Math.random() * 20) + 5;
            if (operation === '/') {
                answer = Math.floor(Math.random() * 12) + 2;
                num2 = Math.floor(Math.random() * 10) + 2;
                num1 = answer * num2;
                tag = 'DIVISION';
            } else {
                tag = operation === '*' ? 'MULTIPLICATION' : operation === '+' ? 'ADDITION' : 'SUBTRACTION';
                answer = operation === '*' ? num1 * num2 : operation === '+' ? num1 + num2 : num1 - num2;
            }
            break;
        default:
            num1 = 1; num2 = 1; operation = '+'; answer = 2; tag = 'ADDITION';
    }

    displayedAnswer = isCorrect ? answer : getOffset(answer);
    if (!isCorrect && displayedAnswer === answer) displayedAnswer += 1;

    let problemText;
    if (operation === '²') problemText = `${num1}² = ${displayedAnswer}`;
    else if (operation === '√') problemText = `√${num1} = ${displayedAnswer}`;
    else if (operation === '% of') problemText = `${num1}% of ${num2} = ${displayedAnswer}`;
    else problemText = `${num1} ${operation} ${num2} = ${displayedAnswer}`;

    return {
        text: problemText,
        isCorrect,
        tag, // Used for AI Analysis
        raw: { num1, num2, operation, answer }
    };
};

// --- 2. ANALYTICS ENGINE (The "AI" Insight) ---
const generateSessionReport = (logs) => {
    if (!logs || logs.length === 0) return null;

    const total = logs.length;
    const correct = logs.filter(l => l.correct).length;
    const accuracy = Math.round((correct / total) * 100);

    // Average Reaction Time (only for correct answers to filter panic swipes)
    const correctLogs = logs.filter(l => l.correct);
    const avgSpeed = correctLogs.length > 0
        ? Math.round(correctLogs.reduce((acc, curr) => acc + curr.ms, 0) / correctLogs.length)
        : 0;

    // Group by Tag (Operation)
    const tagStats = {};
    logs.forEach(l => {
        if (!tagStats[l.tag]) tagStats[l.tag] = { total: 0, correct: 0, ms: 0 };
        tagStats[l.tag].total++;
        if (l.correct) {
            tagStats[l.tag].correct++;
            tagStats[l.tag].ms += l.ms;
        }
    });

    // Find Strengths/Weaknesses
    let bestTag = null, worstTag = null;
    let bestRate = -1, worstRate = 101;

    Object.keys(tagStats).forEach(tag => {
        const s = tagStats[tag];
        const rate = (s.correct / s.total);
        if (s.total >= 2) { // Need sample size
            if (rate > bestRate) { bestRate = rate; bestTag = tag; }
            if (rate < worstRate) { worstRate = rate; worstTag = tag; }
        }
    });

    // Generate Insight String
    let insight = "Good warm up!";
    if (accuracy > 90) insight = "Your accuracy is elite. Try increasing speed next time.";
    else if (avgSpeed < 800) insight = "Lightning fast reflexes, but work on accuracy.";
    else if (worstTag) insight = `You're strong, but ${worstTag} is slowing you down.`;

    return {
        accuracy,
        avgSpeed,
        bestTag,
        worstTag,
        insight,
        totalProblems: total
    };
};

// --- 3. STYLES ---
const visualStyles = `
  @keyframes cardEnter {
    0% { transform: scale(0.8) rotateY(-90deg); opacity: 0; }
    100% { transform: scale(1) rotateY(0deg); opacity: 1; }
  }
  @keyframes cardExitRight {
    0% { transform: translateX(0) rotate(0deg); opacity: 1; }
    100% { transform: translateX(150%) rotate(30deg); opacity: 0; }
  }
  @keyframes cardExitLeft {
    0% { transform: translateX(0) rotate(0deg); opacity: 1; }
    100% { transform: translateX(-150%) rotate(-30deg); opacity: 0; }
  }
  @keyframes correctPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
    50% { box-shadow: 0 0 40px 20px rgba(34, 197, 94, 0.3); }
  }
  @keyframes incorrectShake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
    20%, 40%, 60%, 80% { transform: translateX(8px); }
  }
  @keyframes scorePop {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1); }
  }
  @keyframes floatUp {
    0% { transform: translateY(0); opacity: 1; }
    100% { transform: translateY(-60px); opacity: 0; }
  }
  @keyframes streakGlow {
    0%, 100% { filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.8)); }
    50% { filter: drop-shadow(0 0 25px rgba(255, 215, 0, 1)); }
  }
  @keyframes urgencyPulse {
    0%, 100% { transform: scale(1); color: #ef4444; }
    50% { transform: scale(1.1); color: #fca5a5; }
  }
  @keyframes speedLines {
    0% { background-position: 0% 50%; }
    100% { background-position: 100% 50%; }
  }
  .card-enter { animation: cardEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .card-exit-right { animation: cardExitRight 0.3s ease-out forwards; }
  .card-exit-left { animation: cardExitLeft 0.3s ease-out forwards; }
  .correct-pulse { animation: correctPulse 0.5s ease-out; }
  .incorrect-shake { animation: incorrectShake 0.4s ease-out; }
  .score-pop { animation: scorePop 0.3s ease-out; }
  .float-up { animation: floatUp 0.8s ease-out forwards; }
  .streak-glow { animation: streakGlow 1s ease-in-out infinite; }
  .urgency-pulse { animation: urgencyPulse 0.5s ease-in-out infinite; }
  .speed-lines {
    background: repeating-linear-gradient(
      90deg,
      transparent,
      transparent 10px,
      rgba(6, 182, 212, 0.03) 10px,
      rgba(6, 182, 212, 0.03) 12px
    );
    background-size: 200% 100%;
    animation: speedLines 0.5s linear infinite;
  }
  .streak-rainbow {
    background: linear-gradient(135deg, #f472b6, #c084fc, #60a5fa, #34d399, #facc15, #f472b6);
    background-size: 400% 400%;
    animation: gradientShift 2s ease infinite;
  }
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;

export default function SwipeFight({ sessionId, onBack }) {
    // --- SYNCED STATE ---
    const INITIAL_STATE = {
        status: 'waiting', // waiting, playing, finished
        mode: 'PVP', // PVP, SOLO
        deadline: 0,
        hostScore: 0,
        clientScore: 0,
        hostId: null,
        clientId: null,
        matchHistory: [],
        settings: {
            grade: 'MEDIUM',
            duration: 60
        }
    };

    const { gameState, isHost, updateState, playerId } = useRealtimeGame(
        sessionId,
        'swipefight_logic_v3', // New Logic
        INITIAL_STATE
    );

    const status = gameState?.status || 'waiting';
    const settings = gameState?.settings || INITIAL_STATE.settings;
    const opponentScore = isHost ? (gameState?.clientScore || 0) : (gameState?.hostScore || 0);

    // --- LOCAL PLAYING STATE ---
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [currentProblem, setCurrentProblem] = useState(null);
    const [streak, setStreak] = useState(0);
    const [multiplier, setMultiplier] = useState(1); // NEW: Flow State
    const [feedback, setFeedback] = useState(null);
    const [cardKey, setCardKey] = useState(0);
    const [exitDirection, setExitDirection] = useState(null);
    const [floatingPoints, setFloatingPoints] = useState(null);
    const [scoreAnimating, setScoreAnimating] = useState(false);
    const [isInputLocked, setIsInputLocked] = useState(false);

    // Telemetry Refs
    const sessionLog = useRef([]);
    const questionStartTime = useRef(0);
    const [report, setReport] = useState(null); // Post-game

    // --- DRAG STATE ---
    const [dragX, setDragX] = useState(0);
    const isDragging = useRef(false);
    const startX = useRef(0);

    // --- LOCAL SETTINGS UI ---
    const [localGrade, setLocalGrade] = useState('MEDIUM');
    const [localDuration, setLocalDuration] = useState(60);

    useEffect(() => {
        if (settings) {
            setLocalGrade(settings.grade);
            setLocalDuration(settings.duration);
        }
    }, [settings?.grade, settings?.duration]);

    // --- GAME LOOP & TIMER ---
    useEffect(() => {
        if (status === 'playing') {
            if (!currentProblem) {
                resetGame();
                nextProblem();
            }

            const interval = setInterval(() => {
                const now = Date.now();
                const remaining = Math.ceil((gameState.deadline - now) / 1000);
                setTimeLeft(Math.max(0, remaining));

                if (remaining <= 0 && isHost) {
                    endGame();
                }
            }, 500);

            // Bot (Solo)
            const botInterval = setInterval(() => {
                if (isHost && (gameState.mode === 'SOLO' || !gameState.clientId)) {
                    if (Math.random() > 0.4) {
                        const cScore = gameState.clientScore || 0;
                        updateState({ clientScore: cScore + (100 + Math.floor(Math.random() * 50)) });
                    }
                }
            }, 2000);

            return () => {
                clearInterval(interval);
                clearInterval(botInterval);
            };
        } else {
            if (status === 'waiting') {
                setTimeLeft(localDuration);
                sessionLog.current = [];
            }
        }
    }, [status, gameState?.deadline, isHost]);

    // --- SCORE SYNC ---
    useEffect(() => {
        if (status === 'playing') {
            if (isHost) updateState({ hostScore: score });
            else if (gameState?.mode !== 'SOLO') updateState({ clientScore: score });
        }
    }, [score, status, isHost, gameState?.mode]);


    // --- GAMEPLAY ACTIONS ---
    const resetGame = () => {
        setScore(0);
        setStreak(0);
        setMultiplier(1);
        sessionLog.current = [];
        setReport(null);
        setDragX(0);
    };

    const nextProblem = useCallback(() => {
        const p = generateProblem(localGrade);
        setCurrentProblem(p);
        questionStartTime.current = Date.now();
        setIsInputLocked(false);
        setExitDirection(null);
        setDragX(0);
    }, [localGrade]);


    const endGame = () => {
        const analytics = generateSessionReport(sessionLog.current);
        const hScore = gameState.hostScore || 0;
        const cScore = gameState.clientScore || 0;
        let winner = hScore > cScore ? 'host' : cScore > hScore ? 'client' : 'draw';

        // This only fires on host, but report is local? 
        // Sync to state to end game for everyone
        updateState({
            status: 'finished',
            matchHistory: [...(gameState.matchHistory || []), {
                id: Date.now(),
                hostScore: hScore,
                clientScore: cScore,
                winner
            }]
        });
    };

    // If game finishes remotely, generate local report
    useEffect(() => {
        if (status === 'finished' && !report && sessionLog.current.length > 0) {
            const analytics = generateSessionReport(sessionLog.current);
            setReport(analytics);
        }
    }, [status, report]);


    const handleAnswer = (swipedRight) => {
        if (isInputLocked) return;
        setIsInputLocked(true);

        const now = Date.now();
        const reactionTime = now - questionStartTime.current;
        const isCorrectChoice = (swipedRight && currentProblem.isCorrect) || (!swipedRight && !currentProblem.isCorrect);

        // LOG
        sessionLog.current.push({
            ms: reactionTime,
            correct: isCorrectChoice,
            tag: currentProblem.tag,
            timestamp: now
        });

        setExitDirection(swipedRight ? 'right' : 'left');

        if (isCorrectChoice) {
            // SCORING: 100 base, + speed bonus, * multiplier
            const speedBonus = Math.max(0, 100 - Math.floor(reactionTime / 20));
            const points = Math.floor((100 + speedBonus) * multiplier);

            setScore(p => p + points);
            setStreak(s => s + 1);
            setFeedback('correct');
            setFloatingPoints(`+${points}`);
            setScoreAnimating(true);

            // Flow: Increase multi every 3
            if ((streak + 1) % 3 === 0) setMultiplier(m => Math.min(m + 0.5, 4));

            confetti({
                particleCount: 30 + (streak * 2),
                spread: 70,
                origin: { y: 0.6 },
                colors: streak >= 3 ? ['#ffd700', '#ff6b6b'] : undefined
            });

        } else {
            setScore(p => Math.max(0, p - 200));
            setStreak(0);
            setMultiplier(1);
            setFeedback('incorrect');
            setFloatingPoints('-200');
            setScoreAnimating(true);
        }

        setTimeout(() => {
            setFeedback(null);
            setFloatingPoints(null);
            setScoreAnimating(false);
            setCardKey(k => k + 1);
            nextProblem();
        }, 300);
    };

    const handleStart = (mode = 'PVP') => {
        const duration = localDuration || 60;
        const deadline = Date.now() + (duration * 1000);

        updateState({
            status: 'playing',
            mode,
            deadline,
            hostScore: 0,
            clientScore: 0,
            settings: { grade: localGrade, duration }
        });
        resetGame();
    };


    // --- SAFE INPUT HANDLERS (Fixes the crash) ---
    // Helper to safely get X coordinate from Mouse OR Touch events
    const getClientX = (e) => {
        // Check for touch first
        if (e.touches && e.touches.length > 0) {
            return e.touches[0].clientX;
        }
        // Fallback to mouse
        if (e.clientX !== undefined) {
            return e.clientX;
        }
        return 0; // Fallback safety
    };

    const handlePointerDown = (e) => {
        if (isInputLocked) return;
        isDragging.current = true; // Start drag
        startX.current = getClientX(e);
    };

    const handlePointerMove = (e) => {
        if (!isDragging.current || isInputLocked) return;

        const currentX = getClientX(e);
        setDragX(currentX - startX.current);
    };

    const handlePointerUp = () => {
        if (!isDragging.current) return;
        isDragging.current = false;

        // Threshold for swipe action
        if (dragX > 100) handleAnswer(true);       // Swiped Right
        else if (dragX < -100) handleAnswer(false); // Swiped Left

        setDragX(0); // Reset card position
    };

    const cardTransform = {
        transform: `translateX(${dragX}px) rotate(${dragX * 0.05}deg)`,
        transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        cursor: isDragging.current ? 'grabbing' : 'grab'
    };

    if (!gameState) return <div className="text-white p-10 text-center animate-pulse">CONNECTING...</div>;

    return (
        <div
            className={`flex flex-col h-full bg-slate-900 relative overflow-hidden select-none ${feedback === 'incorrect' ? 'incorrect-shake' : ''}`}
            // ATTACH ALL HANDLERS (Start, Move, End)
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}

            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
        >
            <style>{visualStyles}</style>

            {/* SHARED BACKGROUNDS */}
            <div className="absolute inset-0 speed-lines pointer-events-none z-0 opacity-20"></div>

            {/* 1. LOBBY */}
            {status === 'waiting' && (
                <div className="absolute inset-0 z-30 bg-slate-900/95 backdrop-blur-sm p-6 overflow-y-auto">
                    <div className="text-center mb-10 mt-10">
                        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 italic tracking-tighter">SWIPE FIGHT</h1>
                        <p className="text-cyan-500 font-bold tracking-[0.5em] text-xs">MATH WITH MOMENTUM</p>
                    </div>

                    <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
                        <div className="bg-slate-800/50 p-6 rounded-3xl border border-white/5">
                            <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">Config</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-500 font-bold block mb-2">DIFFICULTY</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['BEGINNER', 'MEDIUM', 'HARD', 'EXPERT'].map(g => (
                                            <button
                                                key={g}
                                                onClick={() => {
                                                    setLocalGrade(g);
                                                    if (isHost) updateState({ settings: { ...settings, grade: g } });
                                                }}
                                                className={`p-3 rounded-lg text-xs font-bold border ${localGrade === g ? 'bg-cyan-500 text-white border-cyan-400' : 'bg-slate-900 text-slate-400 border-slate-700'}`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-bold block mb-2">DURATION</label>
                                    <div className="flex gap-2">
                                        {[30, 60, 90].map(d => (
                                            <button
                                                key={d}
                                                onClick={() => {
                                                    setLocalDuration(d);
                                                    if (isHost) updateState({ settings: { ...settings, duration: d } });
                                                }}
                                                className={`flex-1 p-3 rounded-lg text-xs font-bold border ${localDuration === d ? 'bg-purple-500 text-white border-purple-400' : 'bg-slate-900 text-slate-400 border-slate-700'}`}
                                            >
                                                {d}s
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 justify-center">
                            {isHost ? (
                                <>
                                    <button onClick={() => handleStart('PVP')} className="p-6 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl font-black text-2xl italic text-white shadow-lg hover:scale-105 transition-transform">START PVP MATCH</button>
                                    <button onClick={() => handleStart('SOLO')} className="p-4 bg-slate-800 border border-slate-700 rounded-2xl font-bold text-slate-300 hover:text-white hover:border-emerald-500 transition-colors">SOLO PRACTICE</button>
                                </>
                            ) : (
                                <div className="p-8 bg-slate-800/50 rounded-2xl text-center animate-pulse border border-cyan-500/30">
                                    <div className="text-cyan-400 font-bold mb-2">WAITING FOR HOST</div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mt-20 text-center">
                        <button onClick={onBack} className="text-slate-500 text-xs font-bold hover:text-white uppercase tracking-widest">Exit to Arcade</button>
                    </div>
                </div>
            )}

            {/* 2. SUMMARY / COACH REPORT */}
            {status === 'finished' && (
                <div className="absolute inset-0 z-40 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in zoom-in-95 overflow-y-auto">
                    <h2 className="text-5xl font-black italic mb-6 drop-shadow-2xl">
                        {score > opponentScore ? <span className="text-emerald-400">VICTORY</span> : score < opponentScore ? <span className="text-rose-500">DEFEAT</span> : "DRAW"}
                    </h2>

                    {report ? (
                        <div className="bg-slate-800 border-2 border-slate-700 p-6 rounded-3xl max-w-md w-full mb-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl">📋</div>
                            <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2">Coach's Analysis</div>
                            <p className="text-xl font-medium text-slate-200 mb-6 italic">"{report.insight}"</p>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                                    <div className="text-slate-500 text-[10px] uppercase font-bold">Avg Reaction</div>
                                    <div className="text-2xl font-mono font-bold text-white">{report.avgSpeed}ms</div>
                                    <div className="text-[10px] text-emerald-500 mt-1">Target: &lt;1000ms</div>
                                </div>
                                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                                    <div className="text-slate-500 text-[10px] uppercase font-bold">Accuracy</div>
                                    <div className={`text-2xl font-mono font-bold ${report.accuracy > 90 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                        {report.accuracy}%
                                    </div>
                                    <div className="text-[10px] text-emerald-500 mt-1">Target: 95%</div>
                                </div>
                            </div>

                            {report.worstTag && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-3">
                                    <div className="text-2xl">⚠️</div>
                                    <div className="text-sm text-rose-300">
                                        <strong>Weak Point:</strong> {report.worstTag} <br />
                                        <span className="opacity-70">Focus on this next round.</span>
                                    </div>
                                </div>
                            )}

                            {report.bestTag && (
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-3 mt-2">
                                    <div className="text-2xl">⚡</div>
                                    <div className="text-sm text-emerald-300">
                                        <strong>Superpower:</strong> {report.bestTag} <br />
                                        <span className="opacity-70">You're crushing this!</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-slate-500 animate-pulse mb-8">Analyzing Performance...</div>
                    )}

                    <div className="flex gap-4">
                        {isHost && (
                            <button onClick={() => updateState({ status: 'waiting', hostScore: 0, clientScore: 0 })} className="px-8 py-4 bg-white text-slate-900 font-black rounded-full hover:scale-105 transition-transform">
                                PLAY AGAIN
                            </button>
                        )}
                        <button onClick={onBack} className="px-8 py-4 bg-slate-800 text-white font-bold rounded-full hover:bg-slate-700 transition-colors">
                            EXIT
                        </button>
                    </div>
                </div>
            )}


            {/* 3. GAMEPLAY HUD & CARD */}
            <div className={`flex flex-col h-full relative z-10 transition-opacity duration-500 ${status === 'playing' ? 'opacity-100' : 'opacity-20 pointer-events-none blur-sm'}`}>
                {/* HUD */}
                <div className="flex justify-between items-start p-4 bg-gradient-to-b from-slate-900/90 to-transparent">
                    <div>
                        <div className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Score</div>
                        <div className={`text-4xl font-mono font-black text-white ${scoreAnimating ? 'score-pop' : ''}`}>{score}</div>
                        {floatingPoints && <div className={`text-lg font-black float-up absolute ${floatingPoints.includes('+') ? 'text-emerald-400' : 'text-red-400'}`}>{floatingPoints}</div>}
                    </div>

                    {/* Flow Multiplier */}
                    {multiplier > 1 && (
                        <div className="flex flex-col items-center animate-pulse">
                            <div className="text-[10px] text-yellow-500 font-black uppercase tracking-widest">Flow</div>
                            <div className="text-3xl font-black italic text-yellow-400 drop-shadow-lg">x{multiplier}</div>
                        </div>
                    )}

                    <div className="text-center">
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Time</div>
                        <div className={`text-3xl font-mono font-black ${timeLeft <= 10 ? 'text-red-500 animate-pulse urgency-pulse' : 'text-cyan-400'}`}>
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-[10px] text-pink-500 font-black uppercase tracking-widest">Enemy</div>
                        <div className="text-4xl font-mono font-black text-slate-500">{opponentScore}</div>
                    </div>
                </div>

                {/* CARD AREA */}
                <div className="flex-1 flex items-center justify-center p-6 relative perspectives-1000">
                    {/* Feedback Overlays */}
                    {feedback === 'correct' && <div className="absolute inset-0 bg-emerald-500/20 z-0 animate-pulse rounded-3xl"></div>}
                    {feedback === 'incorrect' && <div className="absolute inset-0 bg-red-500/20 z-0 animate-pulse rounded-3xl"></div>}

                    {/* Drag Indicators */}
                    <div className={`absolute left-10 text-9xl font-black text-pink-500 opacity-0 transition-opacity ${dragX < -50 ? 'opacity-50' : ''}`}>✖</div>
                    <div className={`absolute right-10 text-9xl font-black text-emerald-500 opacity-0 transition-opacity ${dragX > 50 ? 'opacity-50' : ''}`}>✔</div>

                    {currentProblem && (
                        <div
                            key={cardKey}
                            style={exitDirection ? {} : cardTransform}
                            className={`
                                w-full max-w-sm aspect-[3/4] bg-slate-800 rounded-[3rem] border-4 shadow-2xl flex flex-col items-center justify-center relative touch-none
                                ${streak >= 3 ? 'streak-rainbow p-1' : 'border-slate-700'}
                                ${exitDirection === 'right' ? 'card-exit-right' : exitDirection === 'left' ? 'card-exit-left' : 'card-enter'}
                            `}
                        >
                            <div className="bg-slate-800 w-full h-full rounded-[2.8rem] flex flex-col items-center justify-center p-6 relative overflow-hidden">
                                <div className="absolute inset-0 bg-white/5 opacity-50 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none"></div>
                                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8 bg-slate-900 px-4 py-2 rounded-full">Is this true?</div>
                                <div className="text-6xl font-black text-white text-center leading-tight drop-shadow-xl z-10 break-words">
                                    {currentProblem.text}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* CONTROLS */}
                <div className="p-6 grid grid-cols-2 gap-4 max-w-lg mx-auto w-full">
                    <button onClick={() => handleAnswer(false)} disabled={isInputLocked} className="h-24 rounded-2xl bg-pink-500/10 border border-pink-500/50 hover:bg-pink-500 hover:text-white text-pink-500 font-bold transition-all active:scale-95 disabled:opacity-50">FALSE</button>
                    <button onClick={() => handleAnswer(true)} disabled={isInputLocked} className="h-24 rounded-2xl bg-emerald-500/10 border border-emerald-500/50 hover:bg-emerald-500 hover:text-white text-emerald-500 font-bold transition-all active:scale-95 disabled:opacity-50">TRUE</button>
                </div>

            </div>
        </div>
    );
}
