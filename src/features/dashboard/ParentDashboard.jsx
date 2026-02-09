import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMastery } from '../../context/MasteryContext';
import { LineChart, Activity, Brain, Clock, Award, ShieldAlert, Zap } from 'lucide-react';

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

    // Animation variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-cyan-500/30">
            {/* Header */}
            <header className="bg-slate-900/50 backdrop-blur-md border-b border-white/5 p-6 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                                <ShieldAlert size={24} className="text-white" />
                            </div>
                            <h1 className="text-3xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent tracking-tight">
                                GUARDIAN COMMAND
                            </h1>
                        </div>
                        <p className="text-slate-400 text-xs uppercase tracking-widest font-bold pl-1">
                            ToweR Intelligence v4.0 // <span className="text-emerald-400">ONLINE</span>
                        </p>
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="text-right bg-slate-800/30 border border-white/5 p-4 rounded-xl min-w-[140px] backdrop-blur-sm">
                            <div className="text-3xl font-black text-emerald-400 font-mono leading-none mb-1">
                                {Math.round((stats.mastered / stats.total) * 100)}%
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Curriculum Verified</div>
                        </div>
                    </div>
                </div>
            </header>

            <motion.main 
                variants={container}
                initial="hidden"
                animate="show"
                className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
                {/* 1. WEEKLY DIGEST CARD */}
                <motion.div variants={item} className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-3 text-slate-200">
                            <Activity className="text-cyan-400" /> Neural Pulse
                        </h2>

                        <div className="bg-slate-950/50 p-5 rounded-2xl border border-white/5 mb-6 shadow-inner">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">AI Assessment</span>
                                <Brain size={16} className="text-slate-500" />
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed font-light">
                                <span className="text-emerald-400 font-bold">Status: Optimal.</span> The student has been focusing on 
                                <strong className="text-white"> {stats.mastered > 0 ? Object.values(curriculum.nodes).find(n => progress[n.id]?.status === 'completed')?.title || 'Algebra Basics' : 'foundational skills'}</strong>.
                                {stats.frustrationEvents.length > 0
                                    ? <span className="block mt-2 text-rose-300 border-l-2 border-rose-500 pl-3 italic">"Frustration spiked during complex problem solving."</span>
                                    : <span className="block mt-2 text-slate-400 border-l-2 border-emerald-500 pl-3 italic">"Learning velocity is steady. High engagement detected."</span>
                                }
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                                <div className="text-3xl font-black text-emerald-400 mb-1">{stats.mastered}</div>
                                <div className="text-[10px] font-bold text-emerald-200/50 uppercase tracking-wider">Skills Mastered</div>
                            </div>
                            <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                                <div className="text-3xl font-black text-blue-400 mb-1">{stats.total}</div>
                                <div className="text-[10px] font-bold text-blue-200/50 uppercase tracking-wider">Total Nodes</div>
                            </div>
                        </div>
                    </div>

                    {/* Emotional Calibration */}
                    <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-6">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-3 text-slate-200">
                            <Zap className="text-rose-400" /> Stress Vectors
                        </h2>

                        {stats.frustrationEvents.length === 0 ? (
                            <div className="h-32 flex flex-col items-center justify-center text-slate-500 bg-slate-950/30 rounded-2xl border border-white/5 border-dashed">
                                <span className="text-4xl mb-3 opacity-50">✨</span>
                                <p className="text-xs uppercase tracking-widest font-bold">No anomalies detected</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {Object.entries(frustrationMap).map(([date, count]) => (
                                    <div key={date} className="group">
                                        <div className="flex justify-between items-center mb-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                            <span>{date}</span>
                                            <span>{count} Flags</span>
                                        </div>
                                        <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, count * 20)}%` }}
                                                className="h-full bg-gradient-to-r from-rose-500 to-orange-500 relative"
                                            >
                                                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                            </motion.div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* 2. MAIN TIMELINE (Takes 2 cols) */}
                <motion.div variants={item} className="lg:col-span-2">
                    <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 h-full min-h-[500px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <Clock size={200} />
                        </div>

                        <h2 className="text-lg font-bold mb-8 flex items-center gap-3 text-slate-200 relative z-10">
                            <Clock className="text-purple-400" /> Temporal Log
                        </h2>

                        <div className="relative border-l-2 border-slate-800 ml-3 space-y-8 z-10">
                            {stats.recentLogs.length === 0 && (
                                <div className="pl-8 py-12 text-slate-500 italic">
                                    Awaiting telemetry data...
                                </div>
                            )}

                            {stats.recentLogs.map((log, index) => (
                                <motion.div 
                                    key={log.id} 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="relative pl-8 group"
                                >
                                    {/* Timeline Node */}
                                    <div className={`absolute -left-[9px] top-2 w-4 h-4 rounded-full border-4 border-slate-900 transition-transform group-hover:scale-125
                                        ${log.type === 'mastery' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' :
                                            log.type === 'frustration_detected' ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' :
                                                'bg-slate-600'}`
                                    }></div>

                                    {/* Content Card */}
                                    <div className="bg-slate-950/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors backdrop-blur-sm">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                                            <span className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded-md w-fit
                                                ${log.type === 'mastery' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    log.type === 'frustration_detected' ? 'bg-rose-500/10 text-rose-400' : 
                                                    'bg-slate-700/30 text-slate-400'}`
                                            }>
                                                {log.type.replace(/_/g, ' ')}
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-500">
                                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.timestamp).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <p className="text-slate-300 text-sm font-medium">
                                            {log.type === 'mastery' && (
                                                <span className="flex items-center gap-2">
                                                    <Award size={16} className="text-emerald-500" />
                                                    Mastered Node: <span className="text-white">{curriculum.nodes[log.metadata.nodeId]?.title}</span>
                                                </span>
                                            )}
                                            {log.type === 'frustration_detected' && (
                                                <span>
                                                    Detected emotion <span className="text-rose-400 font-bold">{log.metadata.emotion}</span> during "{log.metadata.context}"
                                                </span>
                                            )}
                                            {log.type === 'session_start' && `Session initiated in ${log.metadata.mode} mode`}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </motion.main>
        </div>
    );
}

const styles = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;
