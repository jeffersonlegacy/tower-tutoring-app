import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { mindHive } from '../../services/MindHiveService';
import { useRealtimeGame } from '../../hooks/useRealtimeGame';

// --- MATH ENGINE ---
const generateProblem = (difficulty) => {
    let num1, num2, operation, answer, isCorrect, displayedAnswer;
    const coinFlip = Math.random() > 0.5;
    isCorrect = coinFlip;

    switch (difficulty) {
        case 'BEGINNER': // K-2 equivalent
            num1 = Math.floor(Math.random() * 10) + 1;
            num2 = Math.floor(Math.random() * 10) + 1;
            operation = '+';
            answer = num1 + num2;
            break;
        case 'MEDIUM': // 3-5 equivalent
            const ops = ['+', '-', '*'];
            operation = ops[Math.floor(Math.random() * ops.length)];
            if (operation === '*') {
                num1 = Math.floor(Math.random() * 12);
                num2 = Math.floor(Math.random() * 12);
                answer = num1 * num2;
            } else if (operation === '-') {
                num1 = Math.floor(Math.random() * 50) + 20;
                num2 = Math.floor(Math.random() * 20);
                answer = num1 - num2;
            } else {
                num1 = Math.floor(Math.random() * 50);
                num2 = Math.floor(Math.random() * 50);
                answer = num1 + num2;
            }
            break;
        case 'HARD': // 6-8 equivalent
            const modes = ['*', '/', '+', '-'];
            operation = modes[Math.floor(Math.random() * modes.length)];
            if (operation === '/') {
                num2 = Math.floor(Math.random() * 11) + 2;
                answer = Math.floor(Math.random() * 12) + 1;
                num1 = num2 * answer;
            } else if (operation === '*') {
                num1 = Math.floor(Math.random() * 15) + 3;
                num2 = Math.floor(Math.random() * 15) + 2;
                answer = num1 * num2;
            } else {
                num1 = Math.floor(Math.random() * 100);
                num2 = Math.floor(Math.random() * 100);
                answer = operation === '+' ? num1 + num2 : num1 - num2;
            }
            break;
        case 'EXPERT': // HS equivalent
            const types = ['sq', 'root', '%', '*'];
            const type = types[Math.floor(Math.random() * types.length)];

            if (type === 'sq') {
                num1 = Math.floor(Math.random() * 20) + 2;
                operation = '²';
                answer = num1 * num1;
                num2 = null;
            } else if (type === 'root') {
                answer = Math.floor(Math.random() * 15) + 2;
                num1 = answer * answer;
                operation = '√';
                num2 = null;
            } else if (type === '%') {
                const percs = [10, 20, 25, 50];
                num1 = percs[Math.floor(Math.random() * percs.length)];
                num2 = Math.floor(Math.random() * 20) * 10;
                operation = '% of';
                answer = (num1 / 100) * num2;
            } else {
                num1 = Math.floor(Math.random() * 20) + 5;
                num2 = Math.floor(Math.random() * 20) + 5;
                operation = '*';
                answer = num1 * num2;
            }
            break;
        default:
            num1 = 1; num2 = 1; operation = '+'; answer = 2;
    }

    if (isCorrect) {
        displayedAnswer = answer;
    } else {
        const offset = Math.floor(Math.random() * 5) + 1;
        displayedAnswer = Math.random() > 0.5 ? answer + offset : answer - offset;
        if (displayedAnswer === answer) displayedAnswer += 1;
    }

    let problemText;
    if (operation === '²') problemText = `${num1}² = ${displayedAnswer}`;
    else if (operation === '√') problemText = `√${num1} = ${displayedAnswer}`;
    else if (operation === '% of') problemText = `${num1}% of ${num2} = ${displayedAnswer}`;
    else problemText = `${num1} ${operation} ${num2} = ${displayedAnswer}`;

    return {
        text: problemText,
        isCorrect: isCorrect,
        raw: { num1, num2, operation, answer, displayedAnswer }
    };
};


export default function SwipeFight({ sessionId, onBack }) { // Renamed component
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [currentProblem, setCurrentProblem] = useState(null);

    // Settings (Local State for UI, Synced via gameState)
    const [localGradeSettings, setLocalGradeSettings] = useState('MEDIUM');
    const [localDurationSettings, setLocalDurationSettings] = useState(60);

    // Question Timer (Bonus)
    const [qTime, setQTime] = useState(100);
    const qTimerRef = useRef(null);

    // Analytics
    const [history, setHistory] = useState([]);

    // --- SYNC STATE ---
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
        'swipefight_rt_v1', // Migrated to RTDB
        INITIAL_STATE
    );

    // --- SWIPE MECHANICS HOOKS ---
    const [dragX, setDragX] = useState(0);
    const isDragging = useRef(false);
    const startX = useRef(0);

    // --- INITIALIZATION ---
    useEffect(() => {
        if (isHost && gameState && !gameState.hostId) {
            updateState({ hostId: playerId });
        }
        if (!isHost && gameState && gameState.hostId && !gameState.clientId && playerId) {
            updateState({ clientId: playerId });
        }
    }, [isHost, gameState, playerId]);

    // Keep Local Settings Screen in sync with Remote if Client
    useEffect(() => {
        if (gameState?.settings) {
            setLocalGradeSettings(gameState.settings.grade);
            setLocalDurationSettings(gameState.settings.duration);
        }
    }, [gameState?.settings]);

    // --- GAME LOOP & TIMER ---
    useEffect(() => {
        if (gameState?.status === 'playing') {
            const interval = setInterval(() => {
                const remaining = Math.max(0, Math.ceil((gameState.deadline - Date.now()) / 1000));
                setTimeLeft(remaining);

                if (remaining <= 0) {
                    // Game Over Logic executed by HOST
                    if (isHost && gameState.status === 'playing') {
                        const hScore = gameState.hostScore || 0;
                        const cScore = gameState.clientScore || 0;
                        let winner = 'draw';
                        if (hScore > cScore) winner = 'host';
                        if (cScore > hScore) winner = 'client';

                        const newMatch = {
                            id: (gameState.matchHistory?.length || 0) + 1,
                            hostScore: hScore,
                            clientScore: cScore,
                            winner: winner,
                            timestamp: Date.now()
                        };

                        const currentHistory = Array.isArray(gameState.matchHistory) ? gameState.matchHistory : [];
                        updateState({
                            status: 'finished',
                            matchHistory: [...currentHistory, newMatch]
                        });
                    }
                }
            }, 500);



            // Bot Logic (Solo Mode)
            const botInterval = setInterval(() => {
                if (isHost && (gameState.mode === 'SOLO' || !gameState.clientId)) {
                    // Simulate Bot Score (Grade adjusted?)
                    // approx 100-150 pts every 2-4 seconds
                    const points = 100 + Math.floor(Math.random() * 50);
                    const currentBotScore = gameState.clientScore || 0;

                    // Difficulty scaling based on Grade?
                    // For now, consistent pressure.
                    if (Math.random() > 0.3) {
                        updateState({ clientScore: currentBotScore + points });
                    }
                }
            }, 2000);

            // Start problems if not already
            if (!currentProblem) nextProblem();

            return () => {
                clearInterval(interval);
                clearInterval(botInterval);
            };
        } else if (gameState?.status === 'waiting') {
            setTimeLeft(localDurationSettings);
            setScore(0);
            setCurrentProblem(null);
            setHistory([]);
        }
    }, [gameState?.status, gameState?.deadline, gameState?.mode, isHost, gameState?.hostScore, gameState?.clientScore, localDurationSettings, gameState?.clientId]);

    // --- SCORE SYNC ---
    useEffect(() => {
        if (gameState?.status === 'playing') {
            if (isHost) updateState({ hostScore: score });
            else if (gameState?.mode !== 'SOLO') updateState({ clientScore: score }); // Don't overwrite bot score if client
        }
    }, [score, isHost, gameState?.status, gameState?.mode]);


    const handleStart = (mode = 'PVP') => {
        const duration = localDurationSettings || 60;
        const deadline = Date.now() + (duration * 1000);

        // Sync Latest Settings and Start
        updateState({
            status: 'playing',
            mode: mode,
            deadline: deadline,
            hostScore: 0,
            clientScore: 0,
            settings: {
                grade: localGradeSettings,
                duration: localDurationSettings
            }
        });
        setScore(0);
        setHistory([]);
        nextProblem();
    };

    const nextProblem = () => {
        const p = generateProblem(localGradeSettings); // Use the synced grade
        setCurrentProblem(p);

        // Reset Question Timer
        if (qTimerRef.current) clearInterval(qTimerRef.current);
        setQTime(100);
        qTimerRef.current = setInterval(() => {
            setQTime(prev => {
                if (prev <= 0) return 0;
                return prev - 2;
            });
        }, 50);
    };

    const handleAnswer = (swipedRight) => {
        // Right = True/Check, Left = False/X
        const isCorrectChoice = (swipedRight && currentProblem.isCorrect) || (!swipedRight && !currentProblem.isCorrect);

        const record = { ...currentProblem, userChoice: swipedRight, correct: isCorrectChoice, timeBonus: qTime };
        setHistory(prev => [...prev, record]);

        if (isCorrectChoice) {
            const points = 100 + Math.floor(qTime / 2);
            setScore(prev => prev + points);

            confetti({
                particleCount: 30,
                spread: 50,
                origin: { y: 0.6 },
                colors: ['#22d3ee', '#f472b6', '#34d399']
            });
        } else {
            setScore(prev => Math.max(0, prev - 200));
        }

        nextProblem();
    };

    // --- SETTINGS CONTROLS (HOST ONLY) ---
    const updateSetting = (key, value) => {
        // Optimistic local update
        if (key === 'grade') setLocalGradeSettings(value);
        if (key === 'duration') setLocalDurationSettings(value);

        if (isHost) {
            updateState({
                settings: {
                    ...gameState.settings,
                    [key]: value
                }
            });
        }
    };

    // --- CLEANUP ---
    useEffect(() => {
        return () => {
            if (qTimerRef.current) clearInterval(qTimerRef.current);
        };
    }, []);


    // --- SWIPE LOGIC ---
    const handlePointerDown = (e) => {
        isDragging.current = true;
        startX.current = e.clientX || e.touches?.[0].clientX;
    };

    const handlePointerMove = (e) => {
        if (!isDragging.current) return;
        const currentX = e.clientX || e.touches?.[0].clientX;
        const diff = currentX - startX.current;
        setDragX(diff);
    };

    const handlePointerUp = () => {
        if (!isDragging.current) return;
        isDragging.current = false;

        const threshold = 100;
        if (dragX > threshold) {
            handleAnswer(true);
        } else if (dragX < -threshold) {
            handleAnswer(false);
        }

        setDragX(0);
    };

    const cardStyle = {
        transform: `translateX(${dragX}px) rotate(${dragX * 0.05}deg)`,
        transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        cursor: isDragging.current ? 'grabbing' : 'grab'
    };


    // --- RENDERS ---
    const opponentScore = isHost ? (gameState?.clientScore || 0) : (gameState?.hostScore || 0);

    // LOADING
    if (!gameState) return <div className="text-white p-4 font-mono animate-pulse text-center mt-20">CONNECTING...</div>;

    // WAITING / LOBBY SCREEN
    if (gameState?.status === 'waiting') {
        const difficultyColors = { 'K-2': 'text-emerald-400', '3-5': 'text-cyan-400', '6-8': 'text-blue-400', 'HS': 'text-purple-400' };

        return (
            <div className="flex flex-col h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-6 select-none overflow-y-auto">

                {/* Header */}
                <div className="flex flex-col items-center mb-8 relative">
                    <span className="text-[120px] absolute opacity-5 font-black text-cyan-500 blur-xl top-1/2 -translate-y-1/2 transform -rotate-6 pointer-events-none">FIGHT</span>
                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 italic tracking-tighter filter drop-shadow-[0_0_10px_rgba(6,182,212,0.5)] z-10">
                        SWIPE FIGHT
                    </h1>
                    <p className="text-cyan-500 font-bold uppercase tracking-[0.5em] text-xs mt-2 z-10">Math Arena Championship</p>
                </div>

                <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">

                    {/* SETTINGS CARD */}
                    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="text-xl">⚙️</span> Match Config
                        </h3>

                        {/* Grade Selection */}
                        <div className="mb-6 space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Difficulty Tier</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['BEGINNER', 'MEDIUM', 'HARD', 'EXPERT'].map(g => (
                                    <button
                                        key={g}
                                        onClick={() => updateSetting('grade', g)}
                                        className={`p-3 rounded-xl font-black border-2 transition-all relative overflow-hidden ${localGradeSettings === g
                                            ? `bg-slate-800 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-[1.02]`
                                            : 'bg-slate-950 border-slate-800 text-slate-600 hover:border-slate-700'
                                            }`}
                                    >
                                        {localGradeSettings === g && <div className="absolute inset-0 bg-cyan-400/10 animate-pulse"></div>}
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Duration Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Round Time</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[30, 60, 90].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => updateSetting('duration', d)}
                                        className={`p-3 rounded-xl font-black border-2 transition-all ${localDurationSettings === d
                                            ? 'bg-slate-800 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)] scale-[1.02]'
                                            : 'bg-slate-950 border-slate-800 text-slate-600 hover:border-slate-700'
                                            }`}
                                    >
                                        {d}s
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ACTION CARD */}
                    <div className="flex flex-col justify-center items-center gap-6 p-6">
                        {isHost ? (
                            <>
                                <button
                                    onClick={handleStart}
                                    className="w-full py-8 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl relative overflow-hidden group shadow-[0_0_30px_rgba(8,145,178,0.4)] hover:shadow-[0_0_50px_rgba(8,145,178,0.6)] transition-all transform hover:scale-105"
                                >
                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 transform skew-y-12"></div>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <span className="text-3xl font-black text-white italic tracking-tighter uppercase drop-shadow-md">VS PLAYER</span>
                                        <span className="text-xs font-bold text-cyan-200 uppercase tracking-widest mt-1 opacity-80">Matchmaking</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => handleStart('SOLO')}
                                    className="w-full py-4 bg-slate-800 border-2 border-slate-700 hover:border-emerald-500 rounded-2xl relative overflow-hidden group shadow-lg transition-all transform hover:scale-105"
                                >
                                    <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <span className="text-xl font-black text-white italic tracking-tighter uppercase">SOLO PRACTICE</span>
                                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">Vs Bot</span>
                                    </div>
                                </button>
                            </>
                        ) : (
                            <div className="w-full py-8 bg-slate-900 border-2 border-slate-800 rounded-2xl flex flex-col items-center justify-center animate-pulse gap-4">
                                <div className="w-12 h-12 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin"></div>
                                <div className="text-center">
                                    <span className="text-cyan-500 font-bold uppercase tracking-widest text-sm block">Awaiting Host</span>
                                    <span className="text-slate-600 text-xs mt-1">Configure & Start Match</span>
                                </div>
                            </div>
                        )}

                        <div className="w-full grid grid-cols-2 gap-4 opacity-80">
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 text-center">
                                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Your Rating</div>
                                <div className="text-2xl font-black text-white">0</div>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 text-center">
                                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Win Streak</div>
                                <div className="text-2xl font-black text-emerald-400">0</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-8 text-center pb-4">
                    <button onClick={onBack} className="text-xs font-bold text-slate-600 hover:text-white uppercase tracking-[0.2em] transition-colors py-2 px-6 rounded-full hover:bg-white/5">
                        Exit Arena
                    </button>
                </div>
            </div >
        );
    }

    // GAME OVER SCREEN
    if (gameState?.status === 'finished') {
        const iWon = score > opponentScore;
        const resultText = score > opponentScore ? "VICTORY" : score < opponentScore ? "DEFEAT" : "DRAW";
        const resultColor = score > opponentScore ? "text-emerald-400" : score < opponentScore ? "text-pink-500" : "text-slate-200";

        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-in zoom-in-95">
                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">MATCH COMPLETE</div>
                <h2 className={`text-6xl font-black mb-8 ${resultColor} drop-shadow-2xl`}>{resultText}</h2>

                <div className="grid grid-cols-2 gap-12 mb-12 bg-slate-800/50 p-8 rounded-3xl border border-white/5">
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-500 uppercase font-black tracking-widest mb-2">You</span>
                        <span className="text-6xl font-black text-white">{score}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-500 uppercase font-black tracking-widest mb-2">Opponent</span>
                        <span className="text-6xl font-black text-slate-400">{opponentScore}</span>
                    </div>
                </div>

                {isHost && (
                    <button
                        onClick={handleStart} // Currently restarts with same settings.
                        className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
                    >
                        <span>Rematch</span>
                        <span className="text-xl">↻</span>
                    </button>
                )}

                <button onClick={onBack} className="mt-8 text-xs font-bold text-slate-600 hover:text-white uppercase tracking-widest">
                    Return to Lobby
                </button>
            </div>
        );
    }

    // PLAYING RENDER
    return (
        <div className="flex flex-col h-full bg-slate-900 relative overflow-hidden select-none"
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
        >
            {/* Top Bar HUD */}
            <div className="flex justify-between items-start p-4 bg-slate-800/80 backdrop-blur-md border-b border-white/5 z-20">
                <div className="flex flex-col items-start min-w-[100px]">
                    <span className="text-[10px] uppercase text-emerald-500 tracking-widest font-black">You</span>
                    <span className="text-4xl font-mono text-white font-black drop-shadow-lg">{score}</span>
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase text-slate-500 tracking-widest font-bold mb-1">Time</span>
                    <span className={`text-3xl font-mono font-black ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </span>
                </div>

                <div className="flex flex-col items-end min-w-[100px]">
                    <span className="text-[10px] uppercase text-pink-500 tracking-widest font-black">Opponent</span>
                    <span className="text-4xl font-mono text-slate-400 font-bold">{opponentScore}</span>
                </div>
            </div>

            {/* Question Timer Bar */}
            <div className="w-full h-1 bg-slate-800 relative z-20">
                <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                    style={{ width: `${qTime}%` }}
                ></div>
            </div>

            {/* CARD ZONE */}
            <div className="flex-1 flex items-center justify-center p-6 relative">
                {/* Swipe Indicators */}
                <div className={`absolute left-0 top-0 bottom-0 w-1/2 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${dragX < -50 ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="bg-pink-500/10 w-64 h-64 rounded-full flex items-center justify-center blur-3xl"></div>
                    <span className="absolute text-pink-500 font-black text-9xl transform -rotate-12 opacity-80">FALSE</span>
                </div>
                <div className={`absolute right-0 top-0 bottom-0 w-1/2 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${dragX > 50 ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="bg-emerald-500/10 w-64 h-64 rounded-full flex items-center justify-center blur-3xl"></div>
                    <span className="absolute text-emerald-500 font-black text-9xl transform rotate-12 opacity-80">TRUE</span>
                </div>

                {/* Card */}
                {currentProblem && (
                    <div
                        className="w-full max-w-sm aspect-[3/4] bg-slate-800 rounded-[3rem] border-4 border-slate-700 shadow-2xl flex flex-col items-center justify-center relative touch-none select-none hover:cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform duration-200"
                        style={cardStyle}
                        onMouseDown={handlePointerDown}
                        onTouchStart={handlePointerDown}
                    >
                        <div className="absolute inset-0 bg-logo-pattern opacity-5 pointer-events-none rounded-[3rem]"></div>
                        <div className="relative z-10 text-center pointer-events-none px-6">
                            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-8 bg-slate-900/50 px-4 py-1 rounded-full inline-block">Is this true?</div>
                            <div className="text-5xl sm:text-6xl font-black text-white tracking-tight break-words leading-tight drop-shadow-2xl">
                                {currentProblem.text}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="p-6 grid grid-cols-2 gap-6 pb-8 max-w-lg mx-auto w-full z-20">
                <button
                    onClick={() => handleAnswer(false)}
                    className="h-24 rounded-3xl bg-pink-500/10 border-2 border-pink-500/30 hover:bg-pink-500 hover:border-pink-500 text-pink-500 hover:text-white transition-all flex flex-col items-center justify-center group active:scale-95"
                >
                    <span className="text-4xl transform group-hover:scale-110 transition-transform mb-1">✖</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">False / Left</span>
                </button>
                <button
                    onClick={() => handleAnswer(true)}
                    className="h-24 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 hover:bg-emerald-500 hover:border-emerald-500 text-emerald-500 hover:text-white transition-all flex flex-col items-center justify-center group active:scale-95"
                >
                    <span className="text-4xl transform group-hover:scale-110 transition-transform mb-1">✔</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">True / Right</span>
                </button>
            </div>
        </div>
    );
}
