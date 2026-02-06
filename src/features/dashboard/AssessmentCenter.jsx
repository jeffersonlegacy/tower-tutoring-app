import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMastery } from '../../context/MasteryContext';
import { DIAGNOSTIC_QUESTIONS_LIST } from '../../data/CurriculumData';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

export default function AssessmentCenter() {
    const { updateAssessment } = useMastery();
    const [gameState, setGameState] = useState('intro'); // intro, playing, complete
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [strikes, setStrikes] = useState(0);
    const [timeLeft, setTimeLeft] = useState(20);
    const [failures, setFailures] = useState([]); // Track failed categories
    
    // Performance Metrics for Path Determination
    const [stats, setStats] = useState({
        totalTime: 0,
        correctCount: 0,
        levelReached: 1
    });

    const timerRef = useRef(null);

    // Initialize Questions
    const [questionList, setQuestionList] = useState([]);
    useEffect(() => {
        setQuestionList([...DIAGNOSTIC_QUESTIONS_LIST].sort((a,b) => a.level - b.level));
    }, []);

    // Timer Logic
    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (gameState === 'playing' && timeLeft === 0) {
            handleStrike("Time's up!");
        }
        return () => clearTimeout(timerRef.current);
    }, [timeLeft, gameState]);

    const startGame = () => {
        setGameState('playing');
        setCurrentQuestionIndex(0);
        setScore(0);
        setStrikes(0);
        setTimeLeft(15);
        setStats({ totalTime: 0, correctCount: 0, levelReached: 1 });
    };

    const handleStrike = (reason) => {
        const newStrikes = strikes + 1;
        setStrikes(newStrikes);
        
        // Visual shake effect could go here
        
        if (newStrikes >= 3) {
            endAssessment();
        } else {
            nextQuestion();
        }
    };

    const handleAnswer = (val) => {
        const currentQ = questionList[currentQuestionIndex];
        const isCorrect = val == currentQ.answer;

        if (isCorrect) {
            const timeTaken = 20 - timeLeft;
            setScore(prev => prev + (currentQ.level * 20));
            setStats(prev => ({
                totalTime: prev.totalTime + timeTaken,
                correctCount: prev.correctCount + 1,
                levelReached: Math.max(prev.levelReached, currentQ.level)
            }));
            nextQuestion();
        } else {
            setFailures(prev => [...prev, currentQ.type]);
            handleStrike("Wrong answer");
        }
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < questionList.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setTimeLeft(15);
        } else {
            endAssessment(); // Ran out of questions
        }
    };

    const endAssessment = () => {
        setGameState('complete');
        
        // Detailed Rationale Calculation
        let path = 'visualize'; // Default
        let startNode = 'num_addition_basic';

        if (failures.includes('fractions')) {
            startNode = 'num_fractions_intro';
            path = 'visualize';
        } else if (failures.includes('algebra')) {
            startNode = 'alg_one_step_eq';
            path = 'guide';
        } else if (score > 100) {
            path = 'train';
            startNode = 'num_multiplication_facts';
        }

        const result = {
            score,
            path,
            startNode,
            failures: [...new Set(failures)],
            stats
        };

        updateAssessment(result);
        if (score > 0) confetti({ particleCount: 150, spread: 80 });
    };

    if (gameState === 'intro') {
        return (
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-2xl">
                <div className="text-6xl mb-4">🩺</div>
                <h2 className="text-3xl font-black text-white mb-2">ASSESSMENT CENTER</h2>
                <p className="text-slate-400 mb-6">
                    Let's calibrate your learning path. Answer as many questions as you can.
                    <br/><span className="text-rose-400 font-bold">3 strikes or timeouts and you're out!</span>
                </p>
                <button 
                    onClick={startGame}
                    className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-black text-xl hover:scale-105 transition-transform"
                >
                    START DIAGNOSTIC
                </button>
            </div>
        );
    }

    if (gameState === 'complete') {
        // MasteryContext handles the actual persistence, this is just a quick summary before redirect/refresh does its thing
        // Ideally MathCamp/Dashboard will see 'completed' status and show the Path UI immediately.
        return null; 
    }

    const currentQ = questionList[currentQuestionIndex];
    if (!currentQ) return null;

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-2xl relative overflow-hidden">
            {/* Strikes */}
            <div className="absolute top-4 right-4 flex gap-1">
                {[...Array(3)].map((_, i) => (
                    <span key={i} className={`text-xl ${i < strikes ? 'text-rose-500' : 'text-slate-700'}`}>
                        {i < strikes ? '❌' : '⚪'}
                    </span>
                ))}
            </div>

            {/* Timer Bar */}
            <div className="absolute top-0 left-0 h-1 bg-slate-800 w-full">
                <div 
                    className={`h-full transition-all duration-1000 ease-linear ${timeLeft < 5 ? 'bg-rose-500' : 'bg-cyan-500'}`}
                    style={{ width: `${(timeLeft / 15) * 100}%` }}
                />
            </div>

            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 mt-4">
                Level {currentQ.level} Question
            </div>
            
            <div className="text-4xl font-black text-white mb-8">
                {currentQ.text}
            </div>

            <div className="grid grid-cols-2 gap-4">
                {currentQ.options.map((opt, i) => (
                    <button
                        key={i}
                        onClick={() => handleAnswer(opt)}
                        className="py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-black text-2xl transition-all active:scale-95"
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
}
