import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMastery } from '../../context/MasteryContext';

export default function SkillTree() {
    const { curriculum, getNodeStatus } = useMastery();
    const navigate = useNavigate();

    // Group nodes for simpler display if needed, but for MVP just a list
    const nodes = Object.values(curriculum.nodes);

    const handleNodeClick = (nodeId) => {
        const status = getNodeStatus(nodeId);
        if (status !== 'locked') {
            navigate(`/session/${nodeId}`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
            <header className="mb-12 text-center max-w-2xl mx-auto">
                <div className="text-cyan-500 font-bold tracking-widest uppercase mb-2 text-sm">Jefferson Intelligence v4.0</div>
                <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-4">
                    {curriculum.track}: {curriculum.level}
                </h1>
                <p className="text-slate-400 text-lg">Your personalized learning path to mastery.</p>
            </header>

            <div className="max-w-4xl mx-auto space-y-8 relative">
                {/* Vertical Line Connector (Visual only, simplified) */}
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-slate-800 -translate-x-1/2 rounded z-0"></div>

                {nodes.map((node, index) => {
                    const status = getNodeStatus(node.id);
                    const isLocked = status === 'locked';
                    const isCompleted = status === 'completed';

                    return (
                        <div
                            key={node.id}
                            className={`relative z-10 flex items-center justify-center transition-all duration-500 ${isLocked ? 'opacity-50 grayscale' : 'opacity-100'}`}
                        >
                            <button
                                onClick={() => handleNodeClick(node.id)}
                                disabled={isLocked}
                                className={`
                                    group relative w-full max-w-lg bg-slate-900/80 backdrop-blur-xl border-2 rounded-2xl p-6 text-left transition-all duration-300
                                    ${isCompleted ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]' :
                                        isLocked ? 'border-slate-800 cursor-not-allowed' :
                                            'border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.2)] hover:scale-105 hover:border-cyan-400'}
                                `}
                            >
                                <div className="flex items-start gap-5">
                                    <div className={`
                                        w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner
                                        ${isCompleted ? 'bg-emerald-500/20 text-emerald-400' :
                                            isLocked ? 'bg-slate-800 text-slate-600' :
                                                'bg-cyan-500/20 text-cyan-400 animate-pulse'}
                                    `}>
                                        {isCompleted ? '✓' : node.icon || '📚'}
                                    </div>

                                    <div>
                                        <h3 className={`text-xl font-bold mb-1 ${isLocked ? 'text-slate-500' : 'text-white'}`}>
                                            {node.title}
                                        </h3>
                                        <p className="text-slate-400 text-sm">{node.description}</p>

                                        {!isLocked && (
                                            <div className="mt-3 flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
                                                <span className={isCompleted ? 'text-emerald-400' : 'text-cyan-400'}>
                                                    {isCompleted ? 'Mastered' : 'Ready to Start'}
                                                </span>
                                                <span className="text-slate-600">•</span>
                                                <span className="text-slate-500">{node.estimatedMinutes} min</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Status Indicator Dot */}
                                <div className={`absolute top-1/2 -right-3 w-6 h-6 rounded-full border-4 border-slate-950 transform -translate-y-1/2
                                    ${isCompleted ? 'bg-emerald-500' : isLocked ? 'bg-slate-800' : 'bg-cyan-500'}
                                `}></div>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
