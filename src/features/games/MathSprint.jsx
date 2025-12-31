import React, { useState, useEffect, useRef } from 'react';
import GameEndOverlay from './GameEndOverlay';

export default function MathSprint({ sessionId, onBack }) {
    const [gameState, setGameState] = useState('config'); // config, playing, summary
    const [subject, setSubject] = useState(null); // 'add', 'sub', 'mult', 'div', 'mixed'
    const [difficulty, setDifficulty] = useState('medium'); // 'easy', 'medium', 'hard', 'insane'
    const [timer, setTimer] = useState(60);
    const [score, setScore] = useState(0);
    const [question, setQuestion] = useState(null);
    const [answer, setAnswer] = useState('');
    const [feedback, setFeedback] = useState(null); // 'correct', 'incorrect'
    const inputRef = useRef(null);

    const [streak, setStreak] = useState(0);
    const [questionKey, setQuestionKey] = useState(0);
    const [scoreAnimating, setScoreAnimating] = useState(false);
    const [floatingPoints, setFloatingPoints] = useState(null);
    const [lastPoints, setLastPoints] = useState(0);

    // Question Generator
    const generateQuestion = () => {
        let num1, num2, operation;
        const ops = subject === 'mixed' ? ['add', 'sub', 'mult', 'div'] : [subject];
        operation = ops[Math.floor(Math.random() * ops.length)];

        let range = 10;
        if (difficulty === 'medium') range = 20;
        if (difficulty === 'hard') range = 50;
        if (difficulty === 'insane') range = 100;

        num1 = Math.floor(Math.random() * range) + 1;
        num2 = Math.floor(Math.random() * range) + 1;

        if (operation === 'sub') {
            if (num1 < num2) [num1, num2] = [num2, num1]; // No negative answers for now
        }
        if (operation === 'mult') {
            num1 = Math.floor(Math.random() * (range / 2)) + 1;
            num2 = Math.floor(Math.random() * 12) + 1;
        }
        if (operation === 'div') {
            // Ensure clean division
            num2 = Math.floor(Math.random() * 12) + 1;
            num1 = num2 * (Math.floor(Math.random() * 10) + 1);
        }

        let qText = "";
        let correct = 0;

        switch (operation) {
            case 'add': qText = `${num1} + ${num2}`; correct = num1 + num2; break;
            case 'sub': qText = `${num1} - ${num2}`; correct = num1 - num2; break;
            case 'mult': qText = `${num1} × ${num2}`; correct = num1 * num2; break;
            case 'div': qText = `${num1} ÷ ${num2}`; correct = num1 / num2; break;
        }

        return { text: qText, answer: correct };
    };

    const startGame = () => {
        setScore(0);
        setStreak(0);
        setTimer(60);
        setGameState('playing');
        setQuestion(generateQuestion());
        setAnswer('');
    };

    // Timer Logic
    useEffect(() => {
        let interval;
        if (gameState === 'playing' && timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000);
        } else if (timer === 0 && gameState === 'playing') {
            setGameState('summary');
        }
        return () => clearInterval(interval);
    }, [gameState, timer]);

    // Focus input on new question
    useEffect(() => {
        if (gameState === 'playing' && inputRef.current) {
            inputRef.current.focus();
        }
    }, [gameState, question]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const userVal = parseInt(answer);
        if (userVal === question.answer) {
            const streakBonus = Math.floor(streak / 5) * 5;
            const points = 10 + streakBonus;
            setScore(s => s + points);
            setLastPoints(points);
            setStreak(s => s + 1);
            setFeedback('correct');
            setScoreAnimating(true);
            setFloatingPoints(`+${points}`);

            setTimeout(() => {
                setFeedback(null);
                setScoreAnimating(false);
                setFloatingPoints(null);
            }, 500);

            setQuestionKey(k => k + 1);
            setQuestion(generateQuestion());
            setAnswer('');
        } else {
            setStreak(0);
            setFeedback('incorrect');
            setAnswer('');
            setTimeout(() => setFeedback(null), 500);
        }
    };

    // --- VISUAL STYLES ---
    const speed = Math.min(2, 0.2 + (streak * 0.1)); // Speed cap

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white p-4 relative overflow-hidden">
            <style>{`
                @keyframes warp {
                    0% { background-position: 0 0; }
                    100% { background-position: 0 100%; }
                }
                @keyframes pulse-red {
                    0%, 100% { opacity: 0; }
                    50% { opacity: 0.6; }
                }
                @keyframes questionPop {
                    0% { transform: scale(0.5) rotateX(-30deg); opacity: 0; }
                    60% { transform: scale(1.1) rotateX(5deg); }
                    100% { transform: scale(1) rotateX(0deg); opacity: 1; }
                }
                @keyframes correctFlash {
                    0% { opacity: 0.6; }
                    100% { opacity: 0; }
                }
                @keyframes incorrectShake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                @keyframes scorePop {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.4); }
                    100% { transform: scale(1); }
                }
                @keyframes floatUp {
                    0% { transform: translateY(0); opacity: 1; }
                    100% { transform: translateY(-50px); opacity: 0; }
                }
                @keyframes timerPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                .speed-lines {
                    background-image: 
                        linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px);
                    background-size: 50px 50px;
                    transform: perspective(500px) rotateX(60deg);
                    animation: warp ${1 / speed}s linear infinite;
                    opacity: 0.3;
                }
                .urgency-overlay {
                    background: radial-gradient(circle, transparent 60%, rgba(220, 38, 38, 0.8));
                    animation: pulse-red 1s ease-in-out infinite;
                }
                .fire-text {
                    text-shadow: 0 0 10px #facc15, 0 0 20px #dc2626;
                }
                .question-pop {
                    animation: questionPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .correct-flash {
                    animation: correctFlash 0.3s ease-out forwards;
                }
                .incorrect-shake {
                    animation: incorrectShake 0.3s ease-out;
                }
                .score-pop {
                    animation: scorePop 0.3s ease-out;
                }
                .float-up {
                    animation: floatUp 0.6s ease-out forwards;
                }
                .timer-pulse {
                    animation: timerPulse 0.5s ease-in-out infinite;
                }
            `}</style>

            {/* Background Effects */}
            <div className={`absolute inset-0 pointer-events-none transition-all duration-1000 ${gameState === 'playing' ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-[-100%] speed-lines origin-bottom"></div>
            </div>

            {/* Urgency Vignette */}
            {timer <= 10 && gameState === 'playing' && (
                <div className="absolute inset-0 pointer-events-none z-10 urgency-overlay"></div>
            )}

            {/* Header / Back */}
            <div className="flex justify-between items-center mb-4 relative z-20">
                <button onClick={onBack} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">← ARCADE</button>
                <div className="text-xs font-mono font-bold text-cyan-400">MATH SPRINT: {difficulty.toUpperCase()}</div>
            </div>

            {/* CONFIG SCREEN */}
            {gameState === 'config' && (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center select-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950 via-slate-950 to-black relative overflow-hidden z-20">

                    <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] opacity-30 pointer-events-none"></div>

                    <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
                        <div className="mb-2">
                            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-600 tracking-tighter drop-shadow-[0_0_15px_rgba(6,182,212,0.5)] italic transform -skew-x-6">
                                MATH SPRINT
                            </h1>
                            <p className="text-cyan-500 font-mono font-bold tracking-[0.5em] text-xs uppercase mt-2">High Velocity Drills</p>
                        </div>

                        <div className="w-full bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/5 space-y-6 shadow-2xl">
                            <div className="space-y-3">
                                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block text-left">Training Module</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['add', 'sub', 'mult', 'div'].map(op => (
                                        <button
                                            key={op}
                                            onClick={() => setSubject(op)}
                                            className={`aspect-square rounded-xl border-2 flex items-center justify-center text-xl font-black transition-all ${subject === op
                                                ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] scale-110'
                                                : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'}`}
                                        >
                                            {op === 'add' ? '+' : op === 'sub' ? '-' : op === 'mult' ? '×' : '÷'}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setSubject('mixed')}
                                    className={`w-full py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all ${subject === 'mixed'
                                        ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg'
                                        : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'
                                        }`}
                                >
                                    ⚡ Mixed Operations ⚡
                                </button>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block text-left">Difficulty</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['easy', 'medium', 'hard', 'insane'].map(lvl => (
                                        <button
                                            key={lvl}
                                            onClick={() => setDifficulty(lvl)}
                                            className={`py-2 rounded-lg border text-[10px] font-bold uppercase transition-all ${difficulty === lvl
                                                ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                                                : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'}`}
                                        >
                                            {lvl}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            disabled={!subject}
                            onClick={startGame}
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 p-6 rounded-xl font-black text-xl italic tracking-widest hover:scale-105 transition-transform disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 shadow-[0_0_30px_rgba(6,182,212,0.4)] relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 transform skew-y-12"></div>
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                START RUN <span className="text-2xl animate-pulse">⏱</span>
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* PLAYING SCREEN */}
            {gameState === 'playing' && question && (
                <div className={`flex flex-col items-center justify-center flex-1 relative z-20 ${feedback === 'incorrect' ? 'incorrect-shake' : ''}`}>
                    {/* Correct Flash Overlay */}
                    {feedback === 'correct' && (
                        <div className="absolute inset-0 bg-emerald-500/20 correct-flash pointer-events-none z-30"></div>
                    )}

                    {/* Timer Bar */}
                    <div className="absolute top-0 left-0 right-0 h-2 bg-slate-800">
                        <div
                            className={`h-full transition-all duration-1000 ease-linear ${timer <= 10 ? 'bg-gradient-to-r from-red-600 to-orange-500 shadow-[0_0_15px_red]' : timer <= 30 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-gradient-to-r from-cyan-400 to-blue-500'}`}
                            style={{ width: `${(timer / 60) * 100}%` }}
                        />
                    </div>

                    <div className={`text-6xl font-black mb-2 font-mono ${timer <= 5 ? 'text-red-500 timer-pulse' : timer <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {timer}s
                    </div>

                    {/* Streak / Heat Bar */}
                    <div className="w-full max-w-xs mb-6">
                        <div className="flex justify-between text-xs font-bold mb-1">
                            <span className={`${streak >= 10 ? 'text-red-400 animate-pulse fire-text' : streak > 5 ? 'text-yellow-400 animate-pulse' : 'text-slate-400'}`}>
                                🔥 COMBO x{streak}
                            </span>
                            <span className="text-slate-400">HEAT</span>
                        </div>
                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                            <div
                                className={`h-full transition-all duration-300 ${streak > 10 ? 'bg-gradient-to-r from-red-500 to-orange-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]' : streak > 5 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-gradient-to-r from-green-500 to-emerald-400'}`}
                                style={{ width: `${Math.min(100, streak * 10)}%` }}
                            />
                        </div>
                    </div>

                    <div className="text-xl text-slate-400 mb-2 font-bold tracking-widest relative">
                        SCORE: <span className={`text-white ${scoreAnimating ? 'score-pop' : ''}`}>{score}</span>
                        {/* Floating Points */}
                        {floatingPoints && (
                            <span className="absolute -right-12 top-0 text-emerald-400 font-black text-xl float-up">
                                {floatingPoints}
                            </span>
                        )}
                    </div>

                    <div
                        key={questionKey}
                        className={`text-5xl font-bold mb-8 p-6 bg-slate-800/50 rounded-2xl border w-full text-center question-pop transition-all
                            ${feedback === 'incorrect' ? 'border-red-500 bg-red-500/10' : feedback === 'correct' ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10'}
                            ${streak >= 5 ? 'shadow-[0_0_20px_rgba(250,204,21,0.3)]' : ''}
                        `}
                    >
                        {question.text}
                    </div>

                    <form onSubmit={handleSubmit} className="w-full max-w-xs relative">
                        <input
                            ref={inputRef}
                            type="number"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            className={`w-full bg-transparent border-b-4 text-center text-4xl font-bold p-2 focus:outline-none transition-colors
                                ${feedback === 'incorrect' ? 'border-red-500' : feedback === 'correct' ? 'border-emerald-500' : 'border-slate-600 focus:border-cyan-400'}
                            `}
                            placeholder="?"
                            autoFocus
                        />
                    </form>
                </div>
            )}

            {/* SUMMARY SCREEN */}
            {gameState === 'summary' && (
                <GameEndOverlay
                    winner={true} // Always "positive" outcome for drills
                    title="TIME UP!"
                    icon="⏱"
                    score={score}
                    onRestart={startGame}
                    onExit={() => setGameState('config')}
                />
            )}
        </div>
    );
}
