import React, { useState } from 'react';
import GeminiChat from '../chat/GeminiChat';
import { mindHive } from '../../services/MindHiveService';

export default function MindHiveInterface({ onHome }) {
    const [messages, setMessages] = useState([
        { role: 'model', text: 'Welcome to the Session Review. I have access to your session context. Shall we generate a report?' },
    ]);
    const [isReporting, setIsReporting] = useState(false);
    const [report, setReport] = useState(null);

    // NEW LOGIC
    const [showInput, setShowInput] = useState(false);

    const startReporting = () => {
        setIsReporting(true); // Reusing this as "Modal Open" state might be confusing if it meant "Loading".
        // Let's separate "isModalOpen" and "isLoading".
        // Actually, in the JSX I wrote: `isReporting && !report` shows input.
        // `handleGenerateReport` sets `report` which hides input and shows report.
        // So `isReporting` needs to stay true until close.
    };

    // Changing the function name in the button to `startReporting` in next step if needed, or just modifying `handleGenerateReport` to BE the submit handler.

    // Let's make `handleGenerateReport` the ACTUAL generator, and `toggleReport` the opener.

    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateReport = async (userNotes) => {
        setIsGenerating(true);
        try {
            let fullReport = "";
            let context = messages.map(m => m.text).join('\n');
            if (userNotes) {
                context += `\n\nTUTOR NOTES: ${userNotes}`;
            }

            await mindHive.streamResponse(
                "Generate a professional Tutoring Session Report for a parent based on the following context/notes. \n\nStructure:\n1. Topics Covered\n2. Student Strengths/Wins\n3. Areas for Improvement\n4. Recommended Homework\n\nTone: Professional, encouraging, precise. Use Markdown.",
                [{ role: 'user', text: context }],
                (chunk) => {
                    fullReport += chunk;
                    setReport(fullReport);
                }
            );
        } catch (err) {
            console.error(err);
            alert("Failed to generate report.");
            setIsReporting(false); // Close modal on error
        } finally {
            setIsGenerating(false);
        }
    };
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
                        <p className="text-slate-400 text-sm leading-relaxed mb-4">
                            Use this interface to ask final questions, generate summaries, or explore topics covered in your session.
                            The Swarm has full context of your recent activities.
                        </p>

                        {/* NEW: Session Report Button */}
                        <button
                            onClick={() => setIsReporting(true)}
                            disabled={isReporting || isGenerating}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {isGenerating ? 'Compiling...' : '📄 Generate Parent Report'}
                        </button>
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
                        <GeminiChat
                            mode="fullscreen"
                            onHome={onHome}
                            externalMessages={messages}
                            setExternalMessages={setMessages}
                        />
                    </div>
                </div>

                {/* Report Input Modal */}
                {isReporting && !report && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                        <div className="bg-slate-900 border border-white/10 w-full max-w-lg flex flex-col rounded-xl shadow-2xl p-6 space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">📝</span>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Session Recap</h3>
                                    <p className="text-xs text-slate-400">Since you didn't use chat, briefly list topics & wins. The AI will write the full report.</p>
                                </div>
                            </div>
                            <textarea
                                className="w-full h-32 bg-slate-950 p-4 rounded-lg border border-white/10 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                placeholder="e.g. Covered quadratic formula. Student did great with factoring but needs practice with negative signs. Assigned page 42 for homework."
                                autoFocus
                            />
                            <button
                                onClick={(e) => {
                                    const notes = e.currentTarget.previousSibling.value;
                                    handleGenerateReport(notes);
                                }}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors"
                            >
                                Generate Professional Report
                            </button>
                            <button onClick={() => setIsReporting(false)} className="text-xs text-slate-500 hover:text-white mx-auto block">Cancel</button>
                        </div>
                    </div>
                )}

                {/* Report Result Modal */}
                {report && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                        <div className="bg-white text-slate-900 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden">
                            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Session Report Card</h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Jefferson Intelligence System</p>
                                </div>
                                <button onClick={() => { setReport(null); setIsReporting(false); }} className="text-slate-400 hover:text-red-500 text-2xl">×</button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 font-serif leading-relaxed text-slate-700">
                                <div className="markdown-body prose prose-slate max-w-none">
                                    {report}
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                                <button onClick={() => { setReport(null); setIsReporting(false); }} className="px-4 py-2 text-slate-600 font-bold text-sm uppercase">Close</button>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(report);
                                        alert("Report copied to clipboard! Ready to paste into email.");
                                    }}
                                    className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-bold text-sm uppercase rounded transition-colors"
                                >
                                    Copy Text
                                </button>
                                <button onClick={() => window.print()} className="px-6 py-2 bg-slate-900 text-white font-bold text-sm uppercase rounded shadow hover:bg-black">Print / Save PDF</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
