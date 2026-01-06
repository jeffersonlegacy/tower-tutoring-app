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
    const { curriculum, getNodeStatus } = useMastery();
    const navigate = useNavigate();

    // Filter nodes that have associated games
    const gameNodes = Object.values(curriculum.nodes).filter(node => node.associatedGame);

    const handlePlay = (gameName) => {
        const meta = GAME_METADATA[gameName] || GAME_METADATA["MathMind"];
        // In a real app we'd navigate to the specific game route.
        // For now, assuming game routes exist or we use a modal.
        // If routes don't exist in App.jsx yet, we might need to add them.
        navigate(meta.route);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
            <header className="mb-12 text-center max-w-2xl mx-auto relative z-10">
                <div className="text-purple-500 font-bold tracking-widest uppercase mb-2 text-sm">Jefferson Intelligence v4.0</div>
                <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 mb-4 drop-shadow-lg">
                    MATH CAMP
                </h1>
                <p className="text-slate-400 text-lg">Prove your mastery through play.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {gameNodes.map(node => {
                    const status = getNodeStatus(node.id);
                    const isLocked = status === 'locked';
                    const isCompleted = status === 'completed';
                    const meta = GAME_METADATA[node.associatedGame] || GAME_METADATA["MathMind"];

                    return (
                        <div key={node.id} className={`relative group ${isLocked ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                            <div className={`absolute -inset-0.5 bg-gradient-to-r ${meta.color} rounded-2xl blur opacity-20 group-hover:opacity-100 transition duration-500`}></div>
                            <div className="relative bg-slate-900 rounded-2xl p-6 h-full border border-white/10 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="text-4xl">{meta.icon}</div>
                                    {isCompleted && <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Mastered</div>}
                                </div>

                                <h3 className="text-2xl font-bold mb-2">{node.associatedGame}</h3>
                                <p className="text-slate-400 text-sm mb-6 flex-grow">{meta.description}</p>

                                <div className="bg-slate-800/50 rounded-lg p-3 mb-6 text-xs text-slate-500">
                                    <div className="uppercase tracking-widest font-bold mb-1">Unlocks With</div>
                                    <div className="text-white">{node.title}</div>
                                </div>

                                <button
                                    onClick={() => handlePlay(node.associatedGame)}
                                    className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider transition-all
                                        ${isLocked ? 'bg-slate-800 text-slate-500 cursor-not-allowed' :
                                            `bg-gradient-to-r ${meta.color} text-white shadow-lg group-hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98]`}
                                    `}
                                >
                                    {isLocked ? 'Locked' : 'Play Now'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
