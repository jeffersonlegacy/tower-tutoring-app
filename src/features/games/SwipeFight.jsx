import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useMastery } from '../../context/MasteryContext';
import confetti from 'canvas-confetti';

// --- GAME LOGIC ENGINE ---
const generateProblem = (level) => {
    // Generate simple true/false equations
    // Level 1: 5 + 3 = 8 (True), 5 + 3 = 9 (False)
    const ops = level < 5 ? ['+'] : level < 10 ? ['+', '-'] : ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    
    let a = Math.floor(Math.random() * 10) + 1;
    let b = Math.floor(Math.random() * 10) + 1;
    let trueAns;

    if (op === '+') trueAns = a + b;
    if (op === '-') { 
        a = Math.max(a, b); // Avoid negatives for now 
        trueAns = a - b; 
    }
    if (op === '×') {
        a = Math.floor(Math.random() * 5) + 1; // Smaller numbers for multiply
        b = Math.floor(Math.random() * 5) + 1;
        trueAns = a * b;
    }

    const isTrue = Math.random() > 0.5;
    const displayedAns = isTrue ? trueAns : trueAns + (Math.floor(Math.random() * 3) + 1) * (Math.random() > 0.5 ? 1 : -1);

    return {
        id: Date.now(),
        text: `${a} ${op} ${b} = ${displayedAns}`,
        isTrue
    };
};

export default function SwipeFight() {
    const { logEvent } = useMastery();
    const [gameState, setGameState] = useState('menu'); // menu, playing, gameover
    const [deck, setDeck] = useState([]);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [combo, setCombo] = useState(0);
    
    // Framer Motion Drag
    const x = useMotionValue(0);
    // Rotate based on X drag
    const rotate = useTransform(x, [-200, 200], [-30, 30]);
    // Opacity for hints (Like/Dislike overlay)
    const opacityRight = useTransform(x, [50, 150], [0, 1]);
    const opacityLeft = useTransform(x, [-50, -150], [0, 1]);
    const bgSuccess = useTransform(x, [-10, 0, 10], ["rgba(239, 68, 68, 0)", "rgba(0,0,0,0)", "rgba(16, 185, 129, 0)"]);

    const startGame = () => {
        setScore(0);
        setLives(3);
        setCombo(0);
        setGameState('playing');
        // Preset deck
        const newDeck = Array(5).fill(0).map((_, i) => generateProblem(1));
        setDeck(newDeck);
    };

    const handleSwipe = (direction, card) => {
        // Right = True, Left = False
        const chosenTrue = direction === 'right';
        const isCorrect = chosenTrue === card.isTrue;

        if (isCorrect) {
            const newCombo = combo + 1;
            setCombo(newCombo);
            setScore(prev => prev + (10 * newCombo));
            
            // FX
            if (newCombo % 5 === 0) {
                confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.7 }
                });
            }
        } else {
            setLives(prev => prev - 1);
            setCombo(0);
            // Shake effect could go here
        }

        // Remove card & add new one
        setTimeout(() => {
            setDeck(prev => {
                const remains = prev.slice(1);
                remains.push(generateProblem(Math.floor(score / 50) + 1));
                return remains;
            });
            x.set(0); 
        }, 200);

        if (lives <= 1 && !isCorrect) {
            setGameState('gameover');
            logEvent('swipe_fight_score', { score });
        }
    };

    // Card Component
    const Card = ({ problem, index }) => (
        <motion.div
            style={{ 
                x: index === 0 ? x : 0, 
                rotate: index === 0 ? rotate : 0,
                scale: 1 - index * 0.05,
                zIndex: 10 - index,
                y: index * 15
            }}
            drag={index === 0 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(e, { offset, velocity }) => {
                const swipe = Math.abs(offset.x) * velocity.x;
                if (offset.x > 100) {
                    handleSwipe('right', problem);
                } else if (offset.x < -100) {
                    handleSwipe('left', problem);
                }
            }}
            className="absolute w-72 h-96 bg-slate-800 rounded-3xl shadow-2xl border border-white/10 flex flex-col items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        >
            {/* Swip HINTS */}
            {index === 0 && (
                <>
                    <motion.div style={{ opacity: opacityRight }} className="absolute top-8 right-8 border-4 border-emerald-500 text-emerald-500 rounded-lg px-4 py-2 font-black text-4xl uppercase -rotate-12 z-20">
                        TRUE
                    </motion.div>
                    <motion.div style={{ opacity: opacityLeft }} className="absolute top-8 left-8 border-4 border-red-500 text-red-500 rounded-lg px-4 py-2 font-black text-4xl uppercase rotate-12 z-20">
                        FALSE
                    </motion.div>
                </>
            )}

            {/* Content */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 pointer-events-none"></div>
            
            <div className="relative z-10 text-center">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 block">Is this correct?</span>
                <h2 className="text-5xl font-black text-white font-mono bg-slate-900/50 px-6 py-4 rounded-xl border border-white/5 shadow-inner">
                    {problem.text}
                </h2>
            </div>

            <div className="absolute bottom-8 flex gap-8 text-slate-400 text-sm font-bold uppercase tracking-widest">
                <span>← False</span>
                <span>True →</span>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white overflow-hidden relative">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 to-slate-950"></div>

            {gameState === 'menu' && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="text-center z-10 p-8"
                >
                    <div className="w-24 h-24 bg-gradient-to-tr from-orange-500 to-red-600 rounded-3xl mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(234,88,12,0.5)] mb-6 rotate-3">
                        <span className="text-5xl">🥊</span>
                    </div>
                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600 mb-2 tracking-tighter">
                        SWIPE FIGHT
                    </h1>
                    <p className="text-slate-400 tracking-widest uppercase mb-8 font-bold">The Tinder for Math</p>
                    
                    <button 
                        onClick={startGame}
                        className="bg-white text-slate-950 px-10 py-5 rounded-full font-black text-xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_white]"
                    >
                        Enter Arena
                    </button>
                </motion.div>
            )}

            {gameState === 'playing' && (
                <div className="relative z-10 w-full max-w-md flex flex-col items-center h-[600px]">
                    {/* HUD */}
                    <div className="w-full flex justify-between px-8 mb-8">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Score</span>
                            <span className="text-3xl font-black text-white">{score}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Lives</span>
                            <div className="flex gap-1">
                                {[...Array(3)].map((_, i) => (
                                    <span key={i} className={`text-2xl transition-all ${i < lives ? 'opacity-100 scale-100' : 'opacity-20 scale-50 grayscale'}`}>❤️</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Combo Meter */}
                    <div className="h-2 w-64 bg-slate-800 rounded-full mb-12 overflow-hidden border border-white/5">
                        <motion.div 
                            animate={{ width: `${Math.min(100, combo * 10)}%` }}
                            className="h-full bg-gradient-to-r from-orange-400 to-red-500"
                        />
                    </div>
                    {combo > 2 && (
                        <motion.div 
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="absolute top-32 text-orange-400 font-black italic text-xl drop-shadow-lg"
                        >
                            {combo}x COMBO! 🔥
                        </motion.div>
                    )}

                    {/* Card Stack */}
                    <div className="relative w-full h-[400px] flex justify-center items-center perspective-1000">
                        <AnimatePresence>
                            {deck.slice(0, 3).map((problem, index) => (
                                <Card key={problem.id} problem={problem} index={index} />
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {gameState === 'gameover' && (
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="text-center z-10 bg-slate-900/90 backdrop-blur-xl p-10 rounded-3xl border border-white/10 shadow-2xl"
                >
                    <h2 className="text-4xl font-black text-white mb-2">K.O!</h2>
                    <p className="text-slate-400 uppercase tracking-widest text-sm mb-6">Match Complete</p>
                    
                    <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 mb-8">
                        {score}
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => setGameState('menu')}
                            className="px-6 py-3 rounded-xl font-bold bg-slate-800 text-slate-300 hover:bg-slate-700"
                        >
                            Menu
                        </button>
                        <button 
                            onClick={startGame}
                            className="px-8 py-3 rounded-xl font-bold bg-orange-600 text-white hover:bg-orange-500 shadow-lg shadow-orange-600/20"
                        >
                            Replay
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
