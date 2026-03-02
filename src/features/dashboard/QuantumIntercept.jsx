import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ShieldAlert, Cpu, CheckCircle2, ChevronRight } from 'lucide-react';
import { useMastery } from '../../context/MasteryContext';

/**
 * QUANTUM INTERCEPT
 * A high-energy, immersive pop-quiz overlay that appears during Nexus navigation.
 */
export default function QuantumIntercept({ trackId, onComplete }) {
    const { recordGateCheck } = useMastery();
    const [step, setStep] = useState('intercept'); // intercept, quiz, result
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    // Haptic feedback helper
    const triggerHaptic = (pattern = 10) => {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    };
    
    // Mock Questions (In production, these would be filtered by trackId)
    const questions = [
        {
            text: "If you see a pattern growing by 3 each time, what kind of function is likely at play?",
            options: ["Linear", "Exponential", "Quadratic", "Periodic"],
            correct: 0,
            feedback: "Correct! Linear change implies a constant rate of addition."
        },
        {
            text: "Which of these best represents 'Sense-Making' in math?",
            options: [
                "Memorizing the formula exactly",
                "Speed-solving 100 problems",
                "Visualizing why the steps work",
                "Using a calculator for everything"
            ],
            correct: 2,
            feedback: "Sense-making is all about the 'Why', not just the 'How'!"
        }
    ];

    const currentQuestion = questions[currentQuestionIndex];

    const handleAnswer = (optionIndex) => {
        const isCorrect = optionIndex === currentQuestion.correct;
        const newAnswers = [...answers, isCorrect];
        setAnswers(newAnswers);
        
        // Haptic feedback
        triggerHaptic(isCorrect ? [10, 50, 10] : 50);

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            const score = newAnswers.filter(a => a).length / questions.length;
            recordGateCheck(trackId, score);
            setStep('result');
        }
    };

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, info) => {
                    if (info.offset.y > 150) {
                        triggerHaptic(20);
                        onComplete();
                    }
                }}
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 overflow-hidden touch-pan-y"
            >
                {/* Background Glitch Elements */}
                <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/50 animate-glitch-line" />
                    <div className="absolute bottom-1/4 right-0 w-1 h-full bg-purple-500/50 animate-glitch-line-v" />
                </div>

                {/* --- PHASE 1: THE INTERCEPT --- */}
                {step === 'intercept' && (
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center space-y-8 max-w-lg"
                    >
                        <div className="relative inline-block">
                             <motion.div 
                                animate={{ rotate: [0, 90, 180, 270, 360] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                                className="w-24 h-24 border-2 border-cyan-500/30 rounded-full flex items-center justify-center"
                             >
                                <Zap className="text-cyan-400 w-12 h-12 animate-pulse" />
                             </motion.div>
                             <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 animate-pulse" />
                        </div>
                        
                        <div className="space-y-2">
                            <h2 className="text-2xl md:text-4xl font-black text-white tracking-[0.2em] italic uppercase">
                                Quantum <span className="text-cyan-400">Intercept</span>
                            </h2>
                            <p className="text-slate-400 font-mono text-[10px] md:text-xs uppercase tracking-widest">
                                Analyzing Neural Path: Sector {trackId?.toUpperCase()} ...
                            </p>
                        </div>

                        <button 
                            onClick={() => {
                                triggerHaptic(10);
                                setStep('quiz');
                            }}
                            className="group relative px-6 md:px-8 py-4 md:py-5 bg-white text-black font-black uppercase tracking-widest overflow-hidden transition-all hover:bg-cyan-400 min-h-[56px] text-sm md:text-base"
                        >
                            <span className="relative z-10">Initialize Sync</span>
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-black/10 transition-transform duration-300" />
                        </button>
                    </motion.div>
                )}

                {/* --- PHASE 2: THE QUIZ --- */}
                {step === 'quiz' && (
                    <motion.div 
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="w-full max-w-2xl bg-slate-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-md relative"
                    >
                        {/* Progress Bar */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 md:h-2 bg-white/5 overflow-hidden rounded-t-3xl">
                             <motion.div 
                                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                                initial={{ width: "0%" }}
                                animate={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                             />
                        </div>

                        <div className="flex justify-between items-center mb-8">
                            <div className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                                <Cpu size={14} /> Question {currentQuestionIndex + 1}/{questions.length}
                            </div>
                        </div>

                        <h3 className="text-lg md:text-2xl font-bold text-white mb-6 md:mb-10 leading-snug">
                            {currentQuestion.text}
                        </h3>

                        <div className="grid grid-cols-1 gap-3 md:gap-4">
                            {currentQuestion.options.map((option, idx) => (
                                <motion.button
                                    key={idx}
                                    onClick={() => handleAnswer(idx)}
                                    whileTap={{ scale: 0.97 }}
                                    className="group flex items-center justify-between p-4 md:p-5 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 hover:border-cyan-500/50 active:bg-cyan-500/20 transition-all text-slate-300 hover:text-white min-h-[56px]"
                                >
                                    <span className="text-base md:text-lg font-medium pr-2">{option}</span>
                                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 flex-shrink-0" />
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* --- PHASE 3: RESULT --- */}
                {step === 'result' && (
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center space-y-8 py-10"
                    >
                        <CheckCircle2 className="w-24 h-24 text-emerald-500 mx-auto" />
                        <div className="space-y-2">
                            <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter uppercase">Mastery Logged</h2>
                            <p className="text-slate-400 max-w-xs mx-auto text-xs md:text-sm">
                                Your conceptual vector for <span className="text-cyan-400">{trackId.replace('_', ' ')}</span> has been updated.
                            </p>
                        </div>
                        
                        <div className="flex justify-center gap-2">
                            {answers.map((a, i) => (
                                <div key={i} className={`w-3 h-3 rounded-full ${a ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            ))}
                        </div>

                        <button 
                            onClick={() => {
                                triggerHaptic([10, 50, 10]);
                                onComplete();
                            }}
                            className="px-8 md:px-12 py-4 md:py-5 bg-cyan-500 text-black font-black uppercase tracking-widest hover:bg-white active:scale-95 transition-all min-h-[56px] text-sm md:text-base"
                        >
                            Return To Nexus
                        </button>
                    </motion.div>
                )}

            </motion.div>
        </AnimatePresence>
    );
}
