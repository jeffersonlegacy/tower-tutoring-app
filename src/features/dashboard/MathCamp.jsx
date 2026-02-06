import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMastery } from '../../context/MasteryContext';
import AchievementToast from '../../components/AchievementToast';
import AvatarCanvas from '../profile/AvatarCanvas';
import AssessmentCenter from './AssessmentCenter';
import HyperbolicChamber from './HyperbolicChamber';
import TowerTagModal from '../profile/TowerTagModal';

export default function MathCamp({ onNavigate }) {
    const { studentProfile, assessmentState } = useMastery();
    const navigate = useNavigate();
    const [view, setView] = useState('dashboard'); // dashboard, hyperbolic, arcade

    const handleNavigate = (route) => {
        if (onNavigate) {
            onNavigate(route);
        } else {
            navigate(route);
        }
    };

    // 1. ASSESSMENT PHASE
    if (!assessmentState || assessmentState.status !== 'completed') {
        return (
            <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col items-center justify-center p-4">
                <AchievementToast />
                <div className="max-w-4xl w-full">
                    <AssessmentCenter />
                </div>
            </div>
        );
    }

    // 2. HYPERBOLIC CHAMBER
    if (view === 'hyperbolic') {
        return <HyperbolicChamber onBack={() => setView('dashboard')} />;
    }

    // 3. BRAIN BREAK (ARCADE)
    if (view === 'arcade') {
        // Use lazy import inside component or just dynamic import to avoid circular dependency issues if any
        const BrainBreak = React.lazy(() => import('../games/BrainBreak'));
        return (
            <React.Suspense fallback={<div className="p-8 text-center text-cyan-400">Loading Arcade...</div>}>
                <BrainBreak onBack={() => setView('dashboard')} onNavigate={handleNavigate} />
            </React.Suspense>
        );
    }

    // 3. MAIN DASHBOARD (The Three Paths)
    const recommendedPath = assessmentState.path || 'visual';

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans pb-20">
            <AchievementToast />
            <TowerTagModal />
            
            {/* HERO HERO */}
            <div className="relative bg-gradient-to-b from-indigo-900/50 to-slate-950 pt-8 pb-12 px-4">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                
                <header className="max-w-4xl mx-auto relative z-10">
                    <h1 className="text-3xl md:text-5xl font-black text-center mb-8 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent px-4">
                        MATHTELLIGENCE
                    </h1>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900/80 p-6 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl">
                        {/* Profile Info */}
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-cyan-500/30 flex items-center justify-center overflow-hidden">
                                {studentProfile.avatarConfig ? (
                                    <AvatarCanvas config={studentProfile.avatarConfig} size={80} />
                                ) : (
                                    <span className="text-4xl">🧑‍🚀</span>
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold uppercase tracking-tight">Student</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="bg-purple-600/20 text-purple-300 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Lvl {studentProfile.level}
                                    </span>
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                        {assessmentState.score} Assessment Score
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500 mt-2">
                                    {studentProfile.pv} PV Total
                                </div>
                            </div>
                        </div>

                        {/* Current Path Badge */}
                        <div className="text-right">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Recommended Path</div>
                            <div className={`text-2xl font-black uppercase tracking-wide
                                ${recommendedPath === 'visual' ? 'text-pink-400' : 
                                  recommendedPath === 'analytical' ? 'text-cyan-400' : 'text-yellow-400'}
                            `}>
                                {recommendedPath} LEARNER
                            </div>
                        </div>
                    </div>
                </header>
            </div>

            {/* THE THREE PATHS */}
            <div className="max-w-6xl mx-auto px-4 mt-8">
                <h3 className="text-xl font-bold text-center text-slate-400 uppercase tracking-widest mb-8">Choose Your Journey</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* PATH 1: VISUAL (Equation Explorer) */}
                    <div 
                        onClick={() => handleNavigate('/game/equation-explorer')}
                        className={`group relative bg-slate-900 rounded-3xl p-8 border hover:-translate-y-2 transition-all cursor-pointer overflow-hidden
                            ${recommendedPath === 'visual' ? 'border-pink-500 ring-2 ring-pink-500/20 shadow-[0_0_50px_rgba(236,72,153,0.2)]' : 'border-white/10 opacity-60 hover:opacity-100'}
                        `}
                    >
                        <div className="absolute -right-10 -bottom-10 text-9xl opacity-10 group-hover:opacity-20 transition-opacity">👁️</div>
                        <div className="text-4xl mb-4 text-pink-400">📐</div>
                        <h3 className="text-2xl font-bold text-white mb-2">Visual Path</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            See the math. Use geometry, graphs, and balance scales to understand equations without just memorizing rules.
                        </p>
                        <span className="text-xs font-bold text-pink-400 uppercase tracking-wider group-hover:underline">Enter Path →</span>
                    </div>

                    {/* PATH 2: ANALYTICAL (Checkers/Logic) */}
                    <div 
                        onClick={() => handleNavigate('/game/checkers')}
                        className={`group relative bg-slate-900 rounded-3xl p-8 border hover:-translate-y-2 transition-all cursor-pointer overflow-hidden
                            ${recommendedPath === 'analytical' ? 'border-cyan-500 ring-2 ring-cyan-500/20 shadow-[0_0_50px_rgba(6,182,212,0.2)]' : 'border-white/10 opacity-60 hover:opacity-100'}
                        `}
                    >
                        <div className="absolute -right-10 -bottom-10 text-9xl opacity-10 group-hover:opacity-20 transition-opacity">🧠</div>
                        <div className="text-4xl mb-4 text-cyan-400">♟️</div>
                        <h3 className="text-2xl font-bold text-white mb-2">Analytical Path</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            Deep work. Master logic, strategy, and complex problem solving. Think several moves ahead.
                        </p>
                        <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider group-hover:underline">Enter Path →</span>
                    </div>

                    {/* PATH 3: SPEED (Speed Math) */}
                    <div 
                        onClick={() => handleNavigate('/speed-math')}
                        className={`group relative bg-slate-900 rounded-3xl p-8 border hover:-translate-y-2 transition-all cursor-pointer overflow-hidden
                            ${recommendedPath === 'speed' ? 'border-yellow-500 ring-2 ring-yellow-500/20 shadow-[0_0_50px_rgba(234,179,8,0.2)]' : 'border-white/10 opacity-60 hover:opacity-100'}
                        `}
                    >
                        <div className="absolute -right-10 -bottom-10 text-9xl opacity-10 group-hover:opacity-20 transition-opacity">⚡</div>
                        <div className="text-4xl mb-4 text-yellow-400">🏎️</div>
                        <h3 className="text-2xl font-bold text-white mb-2">Speed Path</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            High velocity. Learn mental math tricks from around the world to calculate faster than a machine.
                        </p>
                        <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider group-hover:underline">Enter Path →</span>
                    </div>
                </div>

                {/* HYPERBOLIC CHAMBER BUTTON */}
                {/* HYPERBOLIC CHAMBER BUTTON */}
                {/* HYPERBOLIC CHAMBER & ARCADE BUTTONS */}
                <div className="mt-12 text-center mb-16 flex flex-col md:flex-row items-center justify-center gap-6">
                    <button 
                        onClick={() => setView('hyperbolic')}
                        className="group relative inline-flex items-center justify-center px-8 py-4 bg-slate-900 border border-indigo-500/50 rounded-2xl overflow-hidden hover:border-indigo-400 transition-colors"
                    >
                        <div className="absolute inset-0 bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors"></div>
                        <span className="relative z-10 flex items-center gap-3 font-black text-indigo-300 uppercase tracking-widest text-sm group-hover:text-white transition-colors">
                            <span className="text-2xl">🌌</span> Hyperbolic Chamber
                        </span>
                    </button>
                    
                    <button 
                        onClick={() => setView('arcade')}
                        className="group relative inline-flex items-center justify-center px-8 py-4 bg-slate-900 border border-cyan-500/50 rounded-2xl overflow-hidden hover:border-cyan-400 transition-colors"
                    >
                        <div className="absolute inset-0 bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors"></div>
                        <span className="relative z-10 flex items-center gap-3 font-black text-cyan-400 uppercase tracking-widest text-sm group-hover:text-white transition-colors">
                            <span className="text-2xl">🕹️</span> Brain Break Arcade
                        </span>
                    </button>
                </div>

                <div className="text-center text-[10px] text-slate-600 font-mono mb-8">
                    CAUTION: CONTAINS NON-EUCLIDEAN CONCEPTS & HIGH VELOCITY SIMULATIONS
                </div>

            </div>
        </div>
    );
}
