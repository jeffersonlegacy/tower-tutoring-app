import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMastery } from '../../context/MasteryContext';

// Mapping of Game Name to Route and Asset
const GAME_METADATA = {
    "EquationExplorer": {
        route: "/game/equation-explorer",
        description: "Master balancing equations in this puzzle adventure.",
        color: "from-purple-500 to-indigo-600",
        icon: "⚖️"
    },
    "SwipeFight": {
        route: "/game/swipe-fight",
        description: "Test your reflex math speed against the clock.",
        color: "from-orange-500 to-red-600",
        icon: "⚔️"
    },
    "Battleship": {
        route: "/game/battleship",
        description: "Hunt for ships using coordinate plane mastery.",
        color: "from-blue-500 to-cyan-600",
        icon: "🚢"
    },
    // Generic fallback for others
    "MathMind": {
        route: "/game/math-mind",
        description: "Pure arithmetic challenge.",
        color: "from-emerald-500 to-teal-600",
        icon: "🧠"
    }
};

export default function MathCamp() {
    const { curriculum, getNodeStatus, studentProfile, checkStreak } = useMastery();
    const navigate = useNavigate();

    // Check streak on mount
    React.useEffect(() => {
        checkStreak();
    }, [checkStreak]);

    // Progress Calculation
    const xpForNextLevel = studentProfile.level * 500;
    const progressPercent = Math.min(100, (studentProfile.xp / xpForNextLevel) * 100);

    // Filter nodes that have associated games
    const gameNodes = Object.values(curriculum.nodes).filter(node => node.associatedGame);

    const handlePlay = (gameName) => {
        const meta = GAME_METADATA[gameName] || GAME_METADATA["MathMind"];
        navigate(meta.route);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans pb-20">
            {/* HERO SECTION: The Campfire */}
            <div className="relative bg-gradient-to-b from-purple-900/50 to-slate-950 pt-8 pb-12 px-4 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                
                <header className="max-w-4xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* PROFILE CARD */}
                        <div className="flex items-center gap-4 bg-slate-900/80 p-4 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl w-full md:w-auto">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-3xl">
                                    🧑‍🚀
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold text-white">Cadet</h2>
                                    <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Lvl {studentProfile.level}</span>
                                </div>
                                <div className="mt-2 w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-1000"
                                        style={{ width: `${progressPercent}%` }}
                                    ></div>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                                    <span>{studentProfile.xp} XP</span>
                                    <span>{xpForNextLevel} XP</span>
                                </div>
                            </div>
                        </div>

                        {/* STREAK FLAME */}
                        <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/30 px-6 py-3 rounded-2xl">
                            <span className="text-4xl animate-pulse filter drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]">🔥</span>
                            <div className="flex flex-col">
                                <span className="text-2xl font-black text-orange-500 leading-none">{studentProfile.streak}</span>
                                <span className="text-[10px] text-orange-300 font-bold uppercase tracking-widest">Day Streak</span>
                            </div>
                        </div>

                        {/* CURRENCY */}
                        <div className="hidden md:flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 rounded-xl">
                            <span className="text-xl">🪙</span>
                            <span className="font-bold text-yellow-400">{studentProfile.currency}</span>
                        </div>
                    </div>
                </header>
            </div>

            {/* DAILY MISSIONS (Mock for now) */}
            <div className="max-w-4xl mx-auto px-4 -mt-6 relative z-20 mb-12">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="text-emerald-500">⚡</span> Daily Training
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { title: "Solve 10 Equations", reward: 50, done: false },
                            { title: "Play 1 Battleship", reward: 100, done: true },
                            { title: "Earn 200 XP", reward: 30, done: false }
                        ].map((mission, i) => (
                            <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${mission.done ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800 border-slate-700'}`}>
                                <div className="flex flex-col">
                                    <span className={`text-sm font-bold ${mission.done ? 'text-emerald-400 line-through opacity-70' : 'text-white'}`}>{mission.title}</span>
                                    <span className="text-[10px] text-yellow-500 font-mono">+{mission.reward} XP</span>
                                </div>
                                {mission.done ? <span className="text-emerald-500">✓</span> : <div className="w-4 h-4 rounded-full border-2 border-slate-600"></div>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* GAMES GRID */}
            <div className="max-w-6xl mx-auto px-4">
                <h3 className="text-2xl font-black text-center mb-8 bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">TRAINING MODULES</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gameNodes.map(node => {
                        const status = getNodeStatus(node.id);
                        const isLocked = status === 'locked';
                        const isCompleted = status === 'completed';
                        const meta = GAME_METADATA[node.associatedGame] || GAME_METADATA["MathMind"];

                        return (
                            <div key={node.id} className={`relative group ${isLocked ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                                <div className={`absolute -inset-0.5 bg-gradient-to-r ${meta.color} rounded-2xl blur opacity-20 group-hover:opacity-100 transition duration-500`}></div>
                                <div className="relative bg-slate-900 rounded-2xl p-6 h-full border border-white/10 flex flex-col hover:-translate-y-1 transition-transform duration-300">
                                    
                                    {/* Icon Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${meta.color} bg-opacity-10 flex items-center justify-center text-3xl shadow-inner`}>
                                            {meta.icon}
                                        </div>
                                        <div className="flex flex-col items-end">
                                            {isCompleted 
                                                ? <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">Mastered</div>
                                                : <div className="bg-slate-800 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Training</div>
                                            }
                                            {/* Mastery Stars (Mock) */}
                                            <div className="flex gap-0.5 mt-1 text-[10px] text-yellow-500/50">
                                                <span>★</span><span>★</span><span>★</span><span>☆</span><span>☆</span>
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold mb-1">{node.associatedGame}</h3>
                                    <p className="text-slate-400 text-sm mb-6 flex-grow leading-relaxed">{meta.description}</p>

                                    <div className="bg-slate-950/50 rounded-lg p-3 mb-6 flex items-center gap-3 border border-white/5">
                                        <span className="text-lg">📚</span>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase tracking-widest font-bold text-slate-500">Curriculum Link</span>
                                            <span className="text-xs font-medium text-cyan-400">{node.title}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handlePlay(node.associatedGame)}
                                        className={`w-full py-3.5 rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2
                                            ${isLocked ? 'bg-slate-800 text-slate-500 cursor-not-allowed' :
                                                `bg-gradient-to-r ${meta.color} text-white shadow-lg group-hover:shadow-purple-500/20 hover:brightness-110 active:scale-[0.98]`}
                                        `}
                                    >
                                        {isLocked ? (
                                            <><span>🔒</span> Locked</>
                                        ) : (
                                            <><span>▶</span> Play Now</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
