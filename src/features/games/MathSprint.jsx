import React, { useState, useEffect, useRef } from 'react';

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
            setScore(s => s + 10);
            setFeedback('correct');
            setTimeout(() => setFeedback(null), 500);
            setQuestion(generateQuestion());
            setAnswer('');
        } else {
            setFeedback('incorrect');
            setAnswer(''); // Clear wrong answer to retry immediately
            setTimeout(() => setFeedback(null), 500);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white p-4 relative overflow-hidden">

            {/* Header / Back */}
            <div className="flex justify-between items-center mb-4">
                <button onClick={onBack} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">← ARCADE</button>
                <div className="text-xs font-mono font-bold text-cyan-400">MATH SPRINT: {difficulty.toUpperCase()}</div>
            </div>

            {/* CONFIG SCREEN */}
            {gameState === 'config' && (
                <div className="flex flex-col gap-6 max-w-sm mx-auto w-full mt-10">
                    <h1 className="text-3xl font-black text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                        SPEED MATH
                    </h1>

                    <div className="space-y-2">
                        <label className="text-xs text-slate-500 font-bold uppercase">Subject</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['add', 'sub', 'mult', 'div', 'mixed'].map(op => (
                                <button
                                    key={op}
                                    onClick={() => setSubject(op)}
                                    className={`p-3 rounded-lg border text-sm font-bold uppercase transition-all ${subject === op
                                        ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                                >
                                    {op === 'mult' ? 'multiply' : op}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-slate-500 font-bold uppercase">Difficulty</label>
                        <div className="grid grid-cols-4 gap-2">
                            {['easy', 'medium', 'hard', 'insane'].map(lvl => (
                                <button
                                    key={lvl}
                                    onClick={() => setDifficulty(lvl)}
                                    className={`p-2 rounded-lg border text-[10px] font-bold uppercase transition-all ${difficulty === lvl
                                        ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-500/20'
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                                >
                                    {lvl}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        disabled={!subject}
                        onClick={startGame}
                        className="mt-8 bg-gradient-to-r from-cyan-500 to-blue-600 p-4 rounded-xl font-black text-xl tracking-widest hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-cyan-500/20"
                    >
                        START RUN
                    </button>
                </div>
            )}

            {/* PLAYING SCREEN */}
            {gameState === 'playing' && question && (
                <div className="flex flex-col items-center justify-center flex-1 relative">
                    {/* Timer Bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
                        <div
                            className="h-full bg-cyan-400 transition-all duration-1000 ease-linear"
                            style={{ width: `${(timer / 60) * 100}%` }}
                        />
                    </div>

                    <div className="text-6xl font-black mb-8 font-mono">{timer}s</div>

                    <div className="text-xl text-slate-400 mb-2 font-bold tracking-widest">
                        SCORE: <span className="text-white">{score}</span>
                    </div>

                    <div className={`text-5xl font-bold mb-8 p-6 bg-slate-800/50 rounded-2xl border border-white/10 w-full text-center ${feedback === 'incorrect' ? 'animate-shake border-red-500' : ''}`}>
                        {question.text}
                    </div>

                    <form onSubmit={handleSubmit} className="w-full max-w-xs relative">
                        <input
                            ref={inputRef}
                            type="number"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            className="w-full bg-transparent border-b-4 border-slate-600 text-center text-4xl font-bold p-2 focus:outline-none focus:border-cyan-400 transition-colors"
                            placeholder="?"
                            autoFocus
                        />
                        {feedback === 'correct' && (
                            <div className="absolute right-0 top-2 text-green-400 text-2xl animate-fade-out">✨</div>
                        )}
                    </form>
                </div>
            )}

            {/* SUMMARY SCREEN */}
            {gameState === 'summary' && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6">
                    <div className="text-6xl mb-4">🏆</div>
                    <div className="flex flex-col items-center">
                        <h2 className="text-slate-400 text-lg uppercase tracking-widest font-bold">Time's Up!</h2>
                        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
                            {score}
                        </h1>
                        <p className="text-cyan-400 font-bold mt-2">POINTS</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full max-w-xs mt-8">
                        <button
                            onClick={startGame}
                            className="bg-slate-800 hover:bg-slate-700 border border-slate-600 p-3 rounded-lg font-bold"
                        >
                            Retry
                        </button>
                        <button
                            onClick={() => setGameState('config')}
                            className="bg-blue-600 hover:bg-blue-500 p-3 rounded-lg font-bold text-white shadow-lg"
                        >
                            New Setup
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
