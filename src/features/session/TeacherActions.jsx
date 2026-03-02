import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ExternalLink, GraduationCap, AlertTriangle, BookOpen, Lightbulb } from 'lucide-react';
import { getMindHive, parseAIResponse } from '../../services/MindHiveService';
import SpotTheTrap from '../games/SpotTheTrap';

export default function TeacherActions({ sessionId, onClose }) {
    const [activeTool, setActiveTool] = useState(null); // 'trap', 'context', 'exit_ticket'
    const [loading, setLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState(null);

    const triggerTeacherAction = async (actionType) => {
        if (actionType === 'trap') {
            setActiveTool('trap');
            return;
        }

        setLoading(true);
        setAiResponse(null);
        setActiveTool(actionType);

        let prompt = "";
        if (actionType === 'context') {
            prompt = "Generate a 'Real World Anchor' for the current math topic. Explain WHY this concept matters in a non-academic field (e.g. video games, space, cooking). Keep it short and exciting.";
        } else if (actionType === 'exit_ticket') {
            prompt = "Generate a single 'Exit Ticket' question to verify conceptual understanding of the last topic discussed. Do not ask for a calculation, ask for a concept check.";
        } else if (actionType === 'explain_why') {
            prompt = "Explain the 'WHY' behind the step we just did. Don't just say 'it's the rule', explain the logic/intuition.";
        }

        try {
            let fullText = "";
            await getMindHive().streamResponse(
                prompt,
                [], // No history needed for single shot commands usually, or pass context if available
                (chunk) => fullText += chunk
            );
            setAiResponse(fullText);
        } catch (e) {
            setAiResponse("Teacher module offline. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="absolute left-[64px] top-0 bottom-0 w-[400px] bg-slate-900/95 backdrop-blur-xl border-r border-white/10 z-20 flex flex-col animate-in slide-in-from-left duration-300 shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-slate-950/50 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black text-amber-500 uppercase tracking-widest flex items-center gap-3">
                        <GraduationCap size={24} />
                        Teacher Mode
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Pedagogy Engine v1.0</p>
                </div>
                <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">✕</button>
            </div>

            {/* Main Tools Grid */}
            <div className="p-6 grid grid-cols-1 gap-4 overflow-y-auto">
                
                {/* 1. SPOT THE TRAP (Game) */}
                <button 
                    onClick={() => triggerTeacherAction('trap')}
                    className="group bg-slate-800/50 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/50 p-4 rounded-xl text-left transition-all relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 to-amber-500/0 group-hover:from-amber-500/5 group-hover:to-transparent transition-all"></div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg group-hover:bg-amber-500 group-hover:text-slate-900 transition-colors">
                            <AlertTriangle size={20} />
                        </div>
                        <h3 className="font-bold text-slate-200 group-hover:text-white">Spot The Trap</h3>
                    </div>
                    <p className="text-xs text-slate-400 pl-[44px]">Present a "wrong" solution to test error analysis skills.</p>
                </button>

                {/* 2. REAL WORLD ANCHOR */}
                <button 
                    onClick={() => triggerTeacherAction('context')}
                    className="group bg-slate-800/50 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/50 p-4 rounded-xl text-left transition-all relative overflow-hidden"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg group-hover:bg-emerald-500 group-hover:text-slate-900 transition-colors">
                            <ExternalLink size={20} />
                        </div>
                        <h3 className="font-bold text-slate-200 group-hover:text-white">Real World Anchor</h3>
                    </div>
                    <p className="text-xs text-slate-400 pl-[44px]">"When will I use this?" - Generate immediate practical context.</p>
                </button>

                {/* 3. EXPLAIN WHY (Deep Dive) */}
                <button 
                    onClick={() => triggerTeacherAction('explain_why')}
                    className="group bg-slate-800/50 hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/50 p-4 rounded-xl text-left transition-all relative overflow-hidden"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg group-hover:bg-blue-500 group-hover:text-slate-900 transition-colors">
                            <Lightbulb size={20} />
                        </div>
                        <h3 className="font-bold text-slate-200 group-hover:text-white">Explain "Why"</h3>
                    </div>
                    <p className="text-xs text-slate-400 pl-[44px]">Deep dive into the logic/intuition behind the rule.</p>
                </button>

                 {/* 4. EXIT TICKET */}
                 <button 
                    onClick={() => triggerTeacherAction('exit_ticket')}
                    className="group bg-slate-800/50 hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/50 p-4 rounded-xl text-left transition-all relative overflow-hidden"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg group-hover:bg-purple-500 group-hover:text-slate-900 transition-colors">
                            <BookOpen size={20} />
                        </div>
                        <h3 className="font-bold text-slate-200 group-hover:text-white">Exit Ticket</h3>
                    </div>
                    <p className="text-xs text-slate-400 pl-[44px]">One-question conceptual check to verify mastery.</p>
                </button>
            </div>

            {/* Result Area */}
            <div className="flex-1 bg-slate-950/30 border-t border-white/5 p-6 overflow-y-auto font-serif">
                {loading && (
                    <div className="flex items-center justify-center h-full text-slate-500 gap-3">
                        <Brain className="animate-bounce" />
                        <span className="text-xs font-bold uppercase tracking-widest animate-pulse">Consulting Pedagogy Engine...</span>
                    </div>
                )}
                
                {!loading && aiResponse && (
                    <div className="prose prose-invert prose-sm">
                        <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-4">Teacher Insight</h4>
                        <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {aiResponse}
                        </div>
                    </div>
                )}

                {!loading && !aiResponse && !activeTool && (
                    <div className="flex items-center justify-center h-full text-slate-600 text-center px-8">
                        <p className="text-xs italic">Select a tool to activate the Pedagogy Engine.</p>
                    </div>
                )}
            </div>

            {/* OVERLAYS */}
            {activeTool === 'trap' && (
                <SpotTheTrap onClose={() => setActiveTool(null)} />
            )}
        </div>
    );
}
