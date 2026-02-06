import React, { useState, useEffect, Suspense, lazy } from 'react';
import { getMindHive } from '../../services/MindHiveService';
import { useMastery } from '../../context/MasteryContext';

const GeminiChat = lazy(() => import('../chat/GeminiChat'));

export default function MindHiveInterface({ onHome }) {
    const { sessionLogs } = useMastery();
    const [messages, setMessages] = useState([
        { role: 'model', text: 'Welcome to the Session Review. I have access to your session context. Shall we generate a report?' },
    ]);
    const [isReporting, setIsReporting] = useState(false);
    const [report, setReport] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [userNotes, setUserNotes] = useState(() => {
        return localStorage.getItem('ji_tutor_notes_temp') || "";
    });

    useEffect(() => {
        localStorage.setItem('ji_tutor_notes_temp', userNotes);
    }, [userNotes]);

    const handleGenerateReport = async () => {
        setIsGenerating(true);
        try {
            let fullReport = "";
            let context = messages.map(m => m.text).join('\n');
            if (userNotes) {
                context += `\n\nTUTOR NOTES: ${userNotes}`;
            }

            await getMindHive().streamResponse(
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
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col font-sans animate-in fade-in duration-500 overflow-y-auto">
            {/* Minimal Navigation Top Bar */}
            <nav className="shrink-0 p-4 md:p-6 flex items-center justify-between border-b border-white/5 bg-slate-900/40 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <span className="text-xl">🐝</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-white tracking-tight leading-none">MIND HIVE</h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Session Summary v4.0</p>
                    </div>
                </div>
                <button
                    onClick={onHome}
                    className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full text-xs font-bold uppercase tracking-widest transition-all border border-white/5 active:scale-95"
                >
                    Return Home
                </button>
            </nav>

            {/* Content Area */}
            <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-10 space-y-8 pb-20">
                
                {/* Hero Summary Card */}
                <section className="relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-3xl blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center gap-10">
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
                                Session <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Synchronized.</span>
                            </h2>
                            <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
                                Another step closer to mastery. I've tracked the cognitive load, emotional state, and learning velocity for this session.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full md:w-auto shrink-0">
                            {[
                                { label: 'Topics', val: '2', color: 'blue' },
                                { label: 'Wins', val: '4', color: 'emerald' },
                                { label: 'XP', val: '+250', color: 'amber' },
                                { label: 'State', val: 'Zen', color: 'cyan' }
                            ].map(s => (
                                <div key={s.label} className="bg-slate-950/50 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center w-28 md:w-32 hover:border-white/20 transition-all shadow-lg">
                                    <span className={`text-2xl font-black text-${s.color}-400 mb-1`}>{s.val}</span>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Interaction Column */}
                    <section className="space-y-6">
                        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-xl flex flex-col h-[500px]">
                            <div className="p-4 border-b border-white/5 bg-slate-900/20 flex items-center justify-between">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Final Consultation</h3>
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse delay-75"></div>
                                </div>
                            </div>
                            <div className="flex-1 relative">
                                <Suspense fallback={<div className="flex items-center justify-center h-full text-slate-500 text-xs">Loading Chat...</div>}>
                                    <GeminiChat
                                        mode="fullscreen"
                                        onHome={onHome}
                                        externalMessages={messages}
                                        setExternalMessages={setMessages}
                                    />
                                </Suspense>
                            </div>
                        </div>
                    </section>

                    {/* Report Column */}
                    <section className="space-y-6">
                        <div className="bg-gradient-to-br from-indigo-600/10 to-blue-600/10 backdrop-blur-xl border border-indigo-500/20 rounded-3xl p-8 shadow-xl">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                                    <span className="text-2xl">📊</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Parent Insight</h3>
                                    <p className="text-sm text-slate-400">Generate a high-fidelity summary of this session.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 block px-1">Tutor Insights (Optional)</label>
                                    <textarea
                                        value={userNotes}
                                        onChange={(e) => setUserNotes(e.target.value)}
                                        className="w-full h-32 bg-slate-950/80 p-4 rounded-2xl border border-white/5 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-700 resize-none shadow-inner"
                                        placeholder="Add specific notes about the student's breakthroughs or areas needing focus..."
                                    />
                                </div>

                                <button
                                    onClick={handleGenerateReport}
                                    disabled={isGenerating}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-900/40 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {isGenerating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Analyzing Session Context...</span>
                                        </>
                                    ) : (
                                        <span>Generate Professional Report</span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Recent Activity Mini-List (Aesthetic only for now) */}
                        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Live Knowledge Feed</h4>
                            <div className="space-y-3">
                                {sessionLogs.length > 0 ? (
                                    sessionLogs.slice(0, 5).map((log, i) => (
                                        <div key={i} className="flex items-center gap-3 px-3 py-2 bg-slate-950/30 rounded-xl border border-white/[0.02]">
                                            <span className="text-lg opacity-70">
                                                {log.type === 'pv_gain' ? '⭐' : 
                                                 log.type === 'mastery' ? '🏆' :
                                                 log.type === 'frustration_detected' ? '😤' :
                                                 log.type === 'session_start' ? '🚀' : '📝'}
                                            </span>
                                            <div className="flex-1">
                                                <p className="text-xs text-slate-300 font-medium">
                                                    {log.type === 'pv_gain' ? `Gained ${log.data.amount} PV` :
                                                     log.type === 'mastery' ? `Mastered ${log.data.nodeId}` :
                                                     log.type === 'frustration_detected' ? `Emotion: ${log.data.emotion}` :
                                                     log.type === 'session_start' ? `Session Started: ${log.data.mode}` :
                                                     'Activity Recorded'}
                                                </p>
                                                {log.data.reason && <p className="text-[9px] text-slate-500">{log.data.reason}</p>}
                                            </div>
                                            <span className="text-[10px] text-slate-600 font-bold whitespace-nowrap">
                                                {Math.floor((Date.now() - log.timestamp) / 60000)}m ago
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-slate-600 text-xs italic">
                                        No recent activity recorded.
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            {/* Report Result Overlay */}
            {report && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in zoom-in-95 duration-300">
                    <div className="bg-white text-slate-900 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[2rem] shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Session Review</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">ToweR Intelligence Engine • AI Synthesized</p>
                            </div>
                            <button 
                                onClick={() => setReport(null)} 
                                className="w-10 h-10 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center text-2xl font-black"
                            >×</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-10 font-serif text-slate-800 leading-relaxed">
                            <div className="prose prose-slate max-w-none prose-sm md:prose-base">
                                {report}
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-wrap justify-end gap-3">
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(report);
                                    alert("Report Card copied!");
                                }}
                                className="px-6 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                            >
                                Copy Text
                            </button>
                            <button onClick={() => window.print()} className="px-8 py-3 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95">
                                Print / Save PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
