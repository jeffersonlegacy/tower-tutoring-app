import React, { useMemo } from 'react';
import { useMastery } from '../../context/MasteryContext';

export default function ParentDashboard() {
    const { progress, sessionLogs, curriculum } = useMastery();

    // Derived Metrics
    const stats = useMemo(() => {
        const mastered = Object.values(progress).filter(p => p.status === 'completed').length;
        const total = Object.keys(curriculum.nodes).length;
        const frustrationEvents = sessionLogs.filter(l => l.type === 'frustration_detected');
        const recentLogs = sessionLogs.slice(0, 10);
        return { mastered, total, frustrationEvents, recentLogs };
    }, [progress, sessionLogs, curriculum]);

    // Heatmap Logic
    const frustrationMap = useMemo(() => {
        const map = {};
        stats.frustrationEvents.forEach(evt => {
            const date = new Date(evt.timestamp).toLocaleDateString();
            map[date] = (map[date] || 0) + 1;
        });
        return map;
    }, [stats.frustrationEvents]);

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans">
            {/* Header */}
            <header className="bg-slate-900 border-b border-white/10 p-6">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            GUARDIAN VIEW
                        </h1>
                        <p className="text-slate-400 text-sm">Jefferson Intelligence v4.0</p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold">{stats.mastered} / {stats.total}</div>
                        <div className="text-xs uppercase tracking-widest text-slate-500">Skills Mastered</div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* WEEKLY DIGEST */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-white/5">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="text-xl">📰</span> Weekly Digest
                    </h2>
                    <div className="space-y-4">
                        <div className="bg-slate-800/50 p-4 rounded-xl">
                            <h3 className="text-cyan-400 font-bold mb-2 text-sm uppercase tracking-wide">AI Summary</h3>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                Depending on recent activity, the student has been focusing on
                                <strong> {stats.mastered > 0 ? Object.values(curriculum.nodes).find(n => progress[n.id]?.status === 'completed')?.title || 'Algebra Basics' : 'getting started'}</strong>.
                                {stats.frustrationEvents.length > 0
                                    ? " There were some moments of frustration detected, particularly with complex problem solving."
                                    : " Learning velocity appears steady with high engagement."
                                }
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                                <div className="text-2xl font-bold text-emerald-400">{stats.mastered}</div>
                                <div className="text-xs text-slate-400">New Skills</div>
                            </div>
                            <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                                <div className="text-2xl font-bold text-blue-400">
                                    {Math.round((stats.mastered / stats.total) * 100)}%
                                </div>
                                <div className="text-xs text-slate-400">Curriculum Complete</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* EMOTIONAL HEATMAP */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-white/5">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="text-xl">🧠</span> Emotional Calibration
                    </h2>

                    {stats.frustrationEvents.length === 0 ? (
                        <div className="h-40 flex flex-col items-center justify-center text-slate-500">
                            <span className="text-4xl mb-2">✨</span>
                            <p>No frustration detected this week!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {Object.entries(frustrationMap).map(([date, count]) => (
                                <div key={date} className="flex items-center gap-4">
                                    <div className="w-24 text-sm text-slate-400">{date}</div>
                                    <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-rose-500 h-full rounded-full"
                                            style={{ width: `${Math.min(100, count * 20)}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-xs font-bold text-rose-400">{count} Events</div>
                                </div>
                            ))}
                            <div className="mt-4 p-3 bg-rose-500/10 rounded-lg text-xs text-rose-300 border border-rose-500/20">
                                <strong>Insight:</strong> High cognitive load detected during evening sessions.
                            </div>
                        </div>
                    )}
                </div>

                {/* RECENT ACTIVITY TIMELINE */}
                <div className="md:col-span-2 bg-slate-900 rounded-2xl p-6 border border-white/5">
                    <h2 className="text-lg font-bold mb-6">Activity Timeline</h2>
                    <div className="relative border-l-2 border-slate-800 ml-3 space-y-8">
                        {stats.recentLogs.length === 0 && <div className="pl-6 text-slate-500">No recent activity logged.</div>}

                        {stats.recentLogs.map((log) => (
                            <div key={log.id} className="relative pl-8">
                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 
                                    ${log.type === 'mastery' ? 'bg-emerald-500 border-slate-900' :
                                        log.type === 'frustration_detected' ? 'bg-rose-500 border-slate-900' :
                                            'bg-slate-600 border-slate-900'}`
                                }></div>

                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-1">
                                    <span className={`text-xs font-bold uppercase tracking-wider 
                                        ${log.type === 'mastery' ? 'text-emerald-400' :
                                            log.type === 'frustration_detected' ? 'text-rose-400' : 'text-slate-400'}`
                                    }>
                                        {log.type.replace('_', ' ')}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </span>
                                </div>

                                <p className="text-slate-300 text-sm">
                                    {log.type === 'mastery' && `Mastered Node: ${curriculum.nodes[log.metadata.nodeId]?.title}`}
                                    {log.type === 'frustration_detected' && `Emotion: ${log.metadata.emotion} - "${log.metadata.context}"`}
                                    {log.type === 'session_start' && `Session started in ${log.metadata.mode} mode`}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

            </main>
        </div>
    );
}
