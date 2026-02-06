import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate, useParams } from 'react-router-dom'; // REMOVED to prevent Router nesting crash
import { useMastery } from '../../context/MasteryContext';

// Problem generators for each method
const PROBLEM_GENERATORS = {
    speed_mult_chinese: () => {
        const a = Math.floor(Math.random() * 30) + 11; // 11-40
        const b = Math.floor(Math.random() * 30) + 11;
        return { a, b, answer: a * b, operation: '×' };
    },
    speed_mult_vedic: () => {
        const a = Math.floor(Math.random() * 40) + 21; // 21-60
        const b = Math.floor(Math.random() * 40) + 21;
        return { a, b, answer: a * b, operation: '×' };
    },
    speed_mult_nikhilam: () => {
        // Numbers close to 100
        const a = Math.floor(Math.random() * 15) + 90; // 90-104
        const b = Math.floor(Math.random() * 15) + 90;
        return { a, b, answer: a * b, operation: '×' };
    },
    speed_add_left: () => {
        const a = Math.floor(Math.random() * 500) + 100; // 100-599
        const b = Math.floor(Math.random() * 500) + 100;
        return { a, b, answer: a + b, operation: '+' };
    },
    speed_sub_austrian: () => {
        const a = Math.floor(Math.random() * 500) + 200; // 200-699
        const b = Math.floor(Math.random() * 199) + 100; // 100-298
        return { a, b, answer: a - b, operation: '−' };
    },
    speed_fractions: () => {
        const n1 = Math.floor(Math.random() * 8) + 1; // 1-8
        const d1 = Math.floor(Math.random() * 6) + 2; // 2-7
        const n2 = Math.floor(Math.random() * 8) + 1;
        const d2 = Math.floor(Math.random() * 6) + 2;
        const answerNum = n1 * d2 + n2 * d1;
        const answerDen = d1 * d2;
        return { 
            a: `${n1}/${d1}`, 
            b: `${n2}/${d2}`, 
            answer: `${answerNum}/${answerDen}`,
            answerNum,
            answerDen,
            operation: '+',
            isFraction: true 
        };
    }
};

const METHOD_INFO = {
    speed_mult_chinese: { title: 'Chinese Stick', icon: '🀄', color: 'from-red-500 to-orange-500' },
    speed_mult_vedic: { title: 'Vedic Cross', icon: '🕉️', color: 'from-orange-500 to-amber-500' },
    speed_mult_nikhilam: { title: 'Nikhilam', icon: '💯', color: 'from-purple-500 to-pink-500' },
    speed_add_left: { title: 'Left-to-Right', icon: '⬅️', color: 'from-blue-500 to-cyan-500' },
    speed_sub_austrian: { title: 'Austrian', icon: '🇦🇹', color: 'from-red-600 to-red-400' },
    speed_fractions: { title: 'Butterfly', icon: '🦋', color: 'from-pink-500 to-purple-500' }
};

export default function SpeedMathPractice({ methodId, onBack }) {
    // const { methodId } = useParams(); // Handled by prop now
    // const navigate = useNavigate(); // replaced by onBack prop
    const { awardXP } = useMastery();
    
    const [timeLeft, setTimeLeft] = useState(60);
    const [isActive, setIsActive] = useState(false);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [problem, setProblem] = useState(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [results, setResults] = useState(null);
    const [problemCount, setProblemCount] = useState(0);

    const method = METHOD_INFO[methodId] || METHOD_INFO.speed_mult_chinese;
    const generator = PROBLEM_GENERATORS[methodId] || PROBLEM_GENERATORS.speed_mult_chinese;

    const generateProblem = useCallback(() => {
        setProblem(generator());
        setUserAnswer('');
        setFeedback(null);
    }, [generator]);

    // Timer
    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            const xpEarned = score * 5 + streak * 2;
            awardXP?.(xpEarned);
            setResults({ score, streak, xp: xpEarned, problems: problemCount });
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, score, streak, awardXP, problemCount]);

    const startDrill = () => {
        setTimeLeft(60);
        setScore(0);
        setStreak(0);
        setProblemCount(0);
        setResults(null);
        setIsActive(true);
        generateProblem();
    };

    const checkAnswer = () => {
        if (!problem || !userAnswer.trim()) return;
        
        let isCorrect = false;
        if (problem.isFraction) {
            // Parse fraction answer
            const parts = userAnswer.split('/');
            if (parts.length === 2) {
                const [num, den] = parts.map(Number);
                // Check if equivalent fraction
                isCorrect = num * problem.answerDen === problem.answerNum * den;
            }
        } else {
            isCorrect = parseInt(userAnswer) === problem.answer;
        }

        setProblemCount(c => c + 1);
        
        if (isCorrect) {
            setScore(s => s + 10 + streak);
            setStreak(s => s + 1);
            setFeedback({ correct: true, message: streak >= 3 ? `🔥 ${streak + 1}x Streak!` : '✓ Correct!' });
            setTimeout(() => generateProblem(), 500);
        } else {
            setStreak(0);
            setFeedback({ 
                correct: false, 
                message: `✗ Answer: ${problem.isFraction ? problem.answer : problem.answer.toLocaleString()}`
            });
            setTimeout(() => generateProblem(), 1500);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') checkAnswer();
    };

    // Results screen
    if (results) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center">
                    <div className="text-6xl mb-4">🏆</div>
                    <h2 className="text-3xl font-black text-white mb-2">Drill Complete!</h2>
                    <p className="text-slate-400 mb-6">{method.title} Method</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-800 rounded-xl p-4">
                            <div className="text-3xl font-black text-cyan-400">{results.score}</div>
                            <div className="text-xs text-slate-500 uppercase">Score</div>
                        </div>
                        <div className="bg-slate-800 rounded-xl p-4">
                            <div className="text-3xl font-black text-orange-400">{results.streak}</div>
                            <div className="text-xs text-slate-500 uppercase">Best Streak</div>
                        </div>
                        <div className="bg-slate-800 rounded-xl p-4">
                            <div className="text-3xl font-black text-emerald-400">{results.problems}</div>
                            <div className="text-xs text-slate-500 uppercase">Problems</div>
                        </div>
                        <div className="bg-slate-800 rounded-xl p-4">
                            <div className="text-3xl font-black text-yellow-400">+{results.xp}</div>
                            <div className="text-xs text-slate-500 uppercase">XP Earned</div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={onBack} className="flex-1 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700">
                            Back
                        </button>
                        <button onClick={startDrill} className={`flex-1 py-3 bg-gradient-to-r ${method.color} text-white font-bold rounded-xl hover:brightness-110`}>
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
            {/* Header */}
            <div className={`bg-gradient-to-r ${method.color} py-6 px-4`}>
                <div className="max-w-2xl mx-auto flex justify-between items-center">
                    <button onClick={onBack} className="text-white/80 hover:text-white">
                        ← Back
                    </button>
                    <h1 className="text-xl font-black flex items-center gap-2">
                        <span>{method.icon}</span>
                        {method.title} Practice
                    </h1>
                    <div className="w-16"></div>
                </div>
            </div>

            {/* Main Area */}
            <div className="max-w-2xl mx-auto px-4 py-8">
                {!isActive ? (
                    // Start Screen
                    <div className="text-center py-16">
                        <div className="text-8xl mb-6">{method.icon}</div>
                        <h2 className="text-3xl font-black mb-4">Ready to Practice?</h2>
                        <p className="text-slate-400 mb-8">Solve as many problems as you can in 60 seconds!</p>
                        <button 
                            onClick={startDrill}
                            className={`px-12 py-4 bg-gradient-to-r ${method.color} text-white text-xl font-black rounded-2xl hover:brightness-110 transition-all active:scale-95`}
                        >
                            START DRILL
                        </button>
                    </div>
                ) : (
                    // Active Drill
                    <div className="space-y-6">
                        {/* Stats Bar */}
                        <div className="flex justify-between items-center bg-slate-900 rounded-2xl p-4 border border-white/10">
                            <div className="text-center">
                                <div className="text-2xl font-black text-cyan-400">{score}</div>
                                <div className="text-[10px] text-slate-500 uppercase">Score</div>
                            </div>
                            <div className="text-center">
                                <div className={`text-4xl font-black ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                    {timeLeft}
                                </div>
                                <div className="text-[10px] text-slate-500 uppercase">Seconds</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-black text-orange-400">{streak}🔥</div>
                                <div className="text-[10px] text-slate-500 uppercase">Streak</div>
                            </div>
                        </div>

                        {/* Problem Display */}
                        {problem && (
                            <div className="bg-slate-900 rounded-3xl p-8 border border-white/10 text-center">
                                <div className="text-5xl font-black mb-6">
                                    {problem.a} {problem.operation} {problem.b}
                                </div>
                                
                                <input
                                    type="text"
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={problem.isFraction ? "e.g. 23/20" : "Your answer"}
                                    autoFocus
                                    className="w-full max-w-xs mx-auto px-6 py-4 bg-slate-800 border-2 border-slate-700 rounded-xl text-center text-2xl font-bold focus:border-cyan-500 focus:outline-none"
                                />

                                {feedback && (
                                    <div className={`mt-4 text-xl font-bold ${feedback.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {feedback.message}
                                    </div>
                                )}

                                <button 
                                    onClick={checkAnswer}
                                    className={`mt-6 px-8 py-3 bg-gradient-to-r ${method.color} text-white font-bold rounded-xl hover:brightness-110`}
                                >
                                    Submit
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
