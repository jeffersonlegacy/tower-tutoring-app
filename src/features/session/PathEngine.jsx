import React, { useState, useEffect, useRef } from 'react';
import { useMastery } from '../../context/MasteryContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

/**
 * PathEngine: The heart of the new learning experience.
 * Supports 3 Modes:
 * 1. Visualize (Show Me First)
 * 2. Guide (Walk With Me)
 * 3. Train (Let Me Try)
 */
export default function PathEngine({ node, mode, onComplete, onBack }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [confidence, setConfidence] = useState(null); // 0: Clueless, 1: Help, 2: Got it
    const [isDraggableActive, setIsDraggableActive] = useState(false);
    const [controlPos, setControlPos] = useState({ x: 0, y: 0 });
    
    // Safety check for null node
    if (!node) return null;
    
    // Lesson steps would typically come from CurriculumData node content
    // For now, we'll mock a set of steps if not present
    const steps = node.content?.steps || [
        { title: "Introduction", text: `Let's look at ${node.title}.`, visual: null },
        { title: "Step 1", text: "First, identify the components of the problem.", visual: null },
        { title: "Step 2", text: "Apply the first rule of this concept.", visual: null },
        { title: "Final Check", text: "Combine the results for the final answer.", visual: null }
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    // DRAGGABLE CONTROL LOGIC
    const dragRef = useRef(null);
    const handleDragStart = (e) => {
        setIsDraggableActive(true);
    };

    const handleDrag = (e) => {
        if (!isDraggableActive) return;
        // Simple drag logic (absolute positioning)
        setControlPos({
            x: e.clientX - 100, // Adjust offset
            y: e.clientY - 50
        });
    };

    const handleDragEnd = () => {
        setIsDraggableActive(false);
    };

    return (
        <div className="h-full w-full bg-slate-950 flex flex-col overflow-hidden relative" onMouseMove={handleDrag} onMouseUp={handleDragEnd}>
            
            {/* TOP HEADER: CONCEPT & CONFIDENCE */}
            <div className="p-4 bg-slate-900 border-b border-white/5 flex items-center justify-between z-20">
                <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                        <span className="text-cyan-400">{node.icon}</span> {node.title}
                    </h2>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                        Mode: {mode.replace('_', ' ')} // Step {currentStep + 1} of {steps.length}
                    </p>
                </div>
                
                {/* Confidence Icons (I Already Know This) */}
                <div className="flex items-center gap-2 bg-slate-800/50 p-1.5 rounded-xl border border-white/5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase mr-2 ml-1">Confidence Scale</span>
                    <button 
                        onClick={() => setConfidence(0)}
                        className={`p-2 rounded-lg transition-all ${confidence === 0 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' : 'text-slate-600 hover:text-slate-400'}`}
                        title="I'm a bit lost"
                    >
                        <HelpCircle size={18} />
                    </button>
                    <button 
                        onClick={() => setConfidence(1)}
                        className={`p-2 rounded-lg transition-all ${confidence === 1 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'text-slate-600 hover:text-slate-400'}`}
                        title="I need a little help"
                    >
                        <AlertCircle size={18} />
                    </button>
                    <button 
                        onClick={() => {
                            setConfidence(2);
                            // If they "Know This", maybe skip to "Let Me Try"?
                            if (mode !== 'train') handleNext();
                        }}
                        className={`p-2 rounded-lg transition-all ${confidence === 2 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'text-slate-600 hover:text-slate-400'}`}
                        title="I already know this!"
                    >
                        <CheckCircle2 size={18} />
                    </button>
                </div>
            </div>

            {/* MAIN INTERACTION AREA */}
            <div className="flex-1 overflow-hidden relative flex">
                
                {/* MODE 2: WALK WITH ME (Dual Whiteboard) */}
                {mode === 'guide' ? (
                    <div className="flex-1 flex gap-2 p-2 h-full">
                        {/* TEACHER BOARD (Left) */}
                        <div className="flex-1 rounded-2xl bg-white border-4 border-slate-700 relative overflow-hidden flex flex-col shadow-2xl">
                             <div className="absolute top-2 left-2 z-10 bg-slate-900/10 backdrop-blur-sm text-[10px] font-black text-slate-950 px-2 py-1 rounded border border-slate-900/10">
                                TEACHER MODEL
                             </div>
                             {/* The Teacherboard content will be dynamic based on currentStep */}
                             <div className="flex-1 flex items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/pinstripe-light.png')]">
                                <motion.div 
                                    key={currentStep}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-3xl font-bold text-slate-800 text-center"
                                >
                                    {steps[currentStep].text}
                                </motion.div>
                             </div>
                        </div>

                        {/* STUDENT BOARD (Right) */}
                        <div className="flex-1 rounded-2xl bg-white border-4 border-cyan-500/50 relative overflow-hidden flex flex-col shadow-2xl">
                             <div className="absolute top-2 left-2 z-10 bg-cyan-500/10 backdrop-blur-sm text-[10px] font-black text-cyan-900 px-2 py-1 rounded border border-cyan-500/20">
                                YOUR WORKSPACE
                             </div>
                             <div className="flex-1">
                                {/* TLDraw Canvas for Student Handwriting */}
                                <Tldraw hideUi />
                             </div>
                        </div>
                    </div>
                ) : (
                    /* MODES 1 & 3: VISUALIZE or LET ME TRY (Single Focus) */
                    <div className="flex-1 p-8 flex flex-col items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div 
                                key={currentStep}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="max-w-3xl w-full bg-slate-900 border border-white/5 rounded-3xl p-12 shadow-2xl text-center"
                            >
                                <div className="text-cyan-400 font-mono text-xs uppercase tracking-[0.4em] mb-4">
                                    {steps[currentStep].title}
                                </div>
                                <h3 className="text-4xl font-black text-white mb-8 leading-tight">
                                    {steps[currentStep].text}
                                </h3>
                                
                                {mode === 'train' && (
                                    <div className="mt-8 p-6 bg-slate-800/50 rounded-2xl border border-white/10">
                                        <p className="text-slate-400 italic mb-4">Select the correct logic path:</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button onClick={handleNext} className="p-4 bg-slate-800 hover:bg-cyan-600 rounded-xl font-bold transition-all">Option A</button>
                                            <button onClick={handleNext} className="p-4 bg-slate-800 hover:bg-cyan-600 rounded-xl font-bold transition-all">Option B</button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* MOVABLE NAVIGATION CONTROLS (THE FLOATY BAR) */}
            <div 
                ref={dragRef}
                onMouseDown={handleDragStart}
                style={{ 
                    position: 'absolute', 
                    bottom: controlPos.y ? 'auto' : '2.5rem',
                    left: controlPos.x ? `${controlPos.x}px` : '50%',
                    top: controlPos.y ? `${controlPos.y}px` : 'auto',
                    transform: controlPos.x ? 'none' : 'translateX(-50%)',
                    zIndex: 100
                }}
                className={`flex items-center gap-6 bg-slate-900/80 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-grab ${isDraggableActive ? 'cursor-grabbing opacity-80' : ''}`}
            >
                <button 
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className="p-3 text-slate-400 hover:text-white disabled:opacity-20 flex flex-col items-center transition-all active:scale-90"
                >
                    <ChevronLeft size={32} />
                    <span className="text-[9px] font-black uppercase tracking-widest mt-1">Back</span>
                </button>

                <div className="w-[2px] h-8 bg-white/5"></div>

                <div className="flex flex-col items-center px-4">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest animate-pulse">
                        {currentStep === steps.length - 1 ? "FINISH" : "NEXT STEP"}
                    </span>
                    <div className="flex gap-1 mt-1">
                        {steps.map((_, i) => (
                            <div key={i} className={`h-1 rounded-full transition-all ${i === currentStep ? 'w-4 bg-cyan-500' : 'w-1 bg-slate-800'}`}></div>
                        ))}
                    </div>
                </div>

                <div className="w-[2px] h-8 bg-white/5"></div>

                <button 
                    onClick={handleNext}
                    className="p-3 text-cyan-400 hover:text-white flex flex-col items-center transition-all active:scale-95 animate-in slide-in-from-right"
                >
                    <ChevronRight size={32} strokeWidth={3} />
                    <span className="text-[9px] font-black uppercase tracking-widest mt-1">Forward</span>
                </button>
            </div>

            {/* HELP BUTTON (Lower Right) */}
            {!isDraggableActive && (
                <button 
                    onClick={onBack}
                    className="absolute bottom-8 right-8 p-4 bg-slate-900 border border-white/5 rounded-full text-slate-500 hover:text-white hover:bg-rose-500/20 transition-all z-10"
                >
                    <span className="text-xs font-black uppercase tracking-widest">Exit Session</span>
                </button>
            )}

        </div>
    );
}
