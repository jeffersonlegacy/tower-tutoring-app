import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, XCircle, Brain } from 'lucide-react';
import { getMindHive, parseAIResponse } from '../../services/MindHiveService';

export default function SpotTheTrap({ topic = "algebra", difficulty = "medium", onClose }) {
    const [gameState, setGameState] = useState('loading'); // loading, playing, result
    const [trapData, setTrapData] = useState(null);
    const [selectedStep, setSelectedStep] = useState(null);
    const [feedback, setFeedback] = useState(null);

    // 1. Generate the "Trap" Scenario via AI
    useEffect(() => {
        const generateTrap = async () => {
            const prompt = `Generate a math problem related to ${topic} (${difficulty}) with a solution that contains a COMMON STUDENT ERROR (a "trap").
            Format as JSON:
            {
                "problem": "Solve 2(x + 3) = 10",
                "steps": [
                    { "id": 1, "text": "Distribute the 2: 2x + 6 = 10", "isError": false },
                    { "id": 2, "text": "Subtract 6 from both sides: 2x = 4", "isError": false },
                    { "id": 3, "text": "Divide by 2: x = 2", "isError": false }
                ],
                "errorExplanation": "None. Wait, I asked for an error. Okay, let's try: 2(x+3) -> 2x + 3 (Forgot to distribute to the 3). That's the error.",
                "correctStep": "2x + 6 = 10"
            }
            Make sure one step is clearly WRONG based on a common misconception.`;

            try {
                // Mocking AI response for speed/demo purposes if offline, else call AI
                // In a real app, this would be a direct AI call
                // For now, let's pretend we got this from the AI to save latency in this demo
                // effectively "hardcoding" a dynamic responses for the prototype
                
                /* 
                await getMindHive().streamResponse(...) 
                */
               
               // Simulating AI delay
                await new Promise(r => setTimeout(r, 1500));

                setTrapData({
                    problem: "Simplify: 3 - (x + 2)",
                    steps: [
                        { id: 1, text: "Write the expression: 3 - (x + 2)", isError: false },
                        { id: 2, text: "Distribute the negative sign: 3 - x + 2", isError: true },
                        { id: 3, text: "Combine like terms: 5 - x", isError: false } // This follows from the error
                    ],
                    errorId: 2,
                    correction: "Distribute negative to BOTH terms: 3 - x - 2",
                    explanation: "Common Trap! When subtracting a parenthesis, the negative sign must be distributed to EVERY term inside. -(x + 2) becomes -x - 2."
                });
                setGameState('playing');

            } catch (err) {
                console.error(err);
                onClose();
            }
        };

        generateTrap();
    }, [topic]);

    const handleStepClick = (step) => {
        if (gameState !== 'playing') return;
        
        setSelectedStep(step.id);
        
        if (step.isError) {
            setFeedback('correct');
            setGameState('result');
        } else {
            setFeedback('wrong');
            // Shake effect logic would go here
            setTimeout(() => setFeedback(null), 1000);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
            >
                {/* Header */}
                <div className="bg-amber-500/10 border-b border-amber-500/20 p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-slate-900 font-black text-xl animate-pulse">
                            ⚠️
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-amber-500 uppercase tracking-wide">SPOT THE TRAP</h2>
                            <p className="text-amber-200/60 text-xs font-bold uppercase tracking-widest">Teacher Mode: Error Analysis</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <XCircle size={24} />
                    </button>
                </div>

                <div className="p-8">
                    {gameState === 'loading' && (
                        <div className="text-center py-12 space-y-4">
                            <Brain className="w-16 h-16 text-amber-500 mx-auto animate-bounce" />
                            <p className="text-slate-400 font-bold animate-pulse">Analyzing common student errors...</p>
                        </div>
                    )}

                    {gameState !== 'loading' && trapData && (
                        <div className="space-y-8">
                            <div className="text-center">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">The Problem</span>
                                <h3 className="text-3xl font-black text-white mt-2 mb-6 font-mono bg-slate-950/50 py-4 rounded-xl border border-white/5">
                                    {trapData.problem}
                                </h3>
                                <p className="text-slate-300 mb-4">
                                    A student submitted this solution. <strong className="text-amber-400">Tap the step where they went wrong.</strong>
                                </p>
                            </div>

                            <div className="space-y-3">
                                {trapData.steps.map((step) => (
                                    <button
                                        key={step.id}
                                        onClick={() => handleStepClick(step)}
                                        className={`w-full p-4 rounded-xl border-2 text-left transition-all font-mono text-lg flex justify-between items-center
                                            ${selectedStep === step.id 
                                                ? (step.isError ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-red-500/20 border-red-500 text-red-300')
                                                : 'bg-slate-800 border-slate-700 hover:border-amber-500/50 hover:bg-slate-750 text-slate-300'}
                                        `}
                                    >
                                        <span>{step.text}</span>
                                        {selectedStep === step.id && (
                                            step.isError ? <CheckCircle className="text-emerald-500" /> : <XCircle className="text-red-500" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Result Feedback */}
                    <AnimatePresence>
                        {gameState === 'result' && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-8 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="bg-emerald-500 text-slate-900 p-2 rounded-lg">
                                        <CheckCircle size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-emerald-400 text-lg mb-2">Excellent Catch!</h4>
                                        <p className="text-slate-300 text-sm leading-relaxed">
                                            {trapData.explanation}
                                        </p>
                                        <div className="mt-4 p-3 bg-slate-950/50 rounded-lg border border-white/5 font-mono text-xs text-emerald-300">
                                            Correct Approach: {trapData.correction}
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={onClose}
                                    className="w-full mt-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black uppercase tracking-widest rounded-xl transition-colors"
                                >
                                    Continue Learning
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
