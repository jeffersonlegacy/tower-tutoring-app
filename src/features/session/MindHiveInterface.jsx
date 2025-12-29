import React from 'react';
import GeminiChat from '../chat/GeminiChat';

export default function MindHiveInterface({ onHome }) {
    return (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col font-sans animate-fade-in">
            {/* Hero Header */}
            <div className="shrink-0 p-8 flex flex-col items-center justify-center border-b border-white/5 bg-gradient-to-b from-slate-900 to-slate-950">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)] mb-4 animate-pulse-slow">
                    <span className="text-4xl filter drop-shadow-lg">🐝</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
                    MIND HIVE <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">INTERFACE</span>
                </h1>
                <p className="text-slate-400 text-sm md:text-base uppercase tracking-widest font-medium">
                    Session Complete // Knowledge Synthesis Active
                </p>
            </div>

            {/* Main Content Areas */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

                {/* Left: Session Summary (Static Prompt for context) */}
                <div className="hidden md:flex flex-col w-1/3 border-r border-white/5 bg-slate-900/50 p-6 overflow-y-auto">
                    <div className="mb-6">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">System Status</h2>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></div>
                            <span className="text-sm text-slate-300">Swarm Connected</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_5px_#06b6d4]"></div>
                            <span className="text-sm text-slate-300">Knowledge Base Active</span>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4 mb-4">
                        <h3 className="text-lg font-bold text-white mb-2">Reflect & Review</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Use this interface to ask final questions, generate summaries, or explore topics covered in your session.
                            The Swarm has full context of your recent activities.
                        </p>
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/5">
                        <button
                            onClick={onHome}
                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 group"
                        >
                            <span>← Return to Dashboard</span>
                        </button>
                    </div>
                </div>

                {/* Right: Fullscreen Chat */}
                <div className="flex-1 relative bg-slate-950">
                    {/* Pattern Overlay */}
                    <div className="absolute inset-0 bg-dotted-spacing-4 bg-dotted-slate-800/[0.2] pointer-events-none"></div>

                    <div className="relative z-10 w-full h-full flex flex-col max-w-4xl mx-auto md:border-x border-white/5 shadow-2xl">
                        <GeminiChat mode="fullscreen" onHome={onHome} />
                    </div>
                </div>

            </div>
        </div>
    );
}
