import React, { useState } from 'react';
import { useMastery } from '../../context/MasteryContext';
import AvatarCanvas from './AvatarCanvas';
import AvatarEvolution from './AvatarEvolution'; // [NEW]

export default function ProfileDashboard() {
    const { studentProfile, setAvatarConfig } = useMastery();
    const [isEditing, setIsEditing] = useState(false);

    // Default Avatar Config
    const currentAvatar = studentProfile.avatarConfig || {
        type: 'default',
        skinColor: '#EDB98A',
        // ... defaults
    };

    const isSprite = currentAvatar.type === 'sprite' || currentAvatar.type === 'hero';

    if (isEditing) {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-inzoom-in-95 duration-300">
                <AvatarEvolution 
                    onClose={() => setIsEditing(false)} 
                    onSave={(cfg) => {
                        setAvatarConfig(cfg);
                        setIsEditing(false);
                    }}
                />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-6 space-y-8 overflow-y-auto font-sans relative">
            {/* Profile Header Card */}
            <div className="relative group mt-4">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center space-y-4">
                    
                    {/* AVATAR DISPLAY */}
                    <div className="relative w-40 h-40">
                        {isSprite ? (
                            <div className="w-full h-full rounded-2xl bg-slate-950 border-4 border-cyan-500/50 shadow-2xl overflow-hidden relative group/sprite">
                                <img 
                                    src={currentAvatar.src} 
                                    alt="Avatar" 
                                    className="w-full h-full object-cover"
                                    style={{ imageRendering: currentAvatar.type === 'sprite' ? 'pixelated' : 'auto' }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/sprite:opacity-100 transition-opacity flex items-end justify-center p-2">
                                    <span className="text-[9px] font-mono text-cyan-400">STAGE {currentAvatar.stage || 1}</span>
                                </div>
                            </div>
                        ) : (
                            <AvatarCanvas config={currentAvatar} size={160} className="rounded-full shadow-2xl border-4 border-white/5" />
                        )}

                        <button 
                            onClick={() => setIsEditing(true)}
                            className="absolute -bottom-2 -right-2 w-12 h-12 bg-white text-slate-900 hover:bg-cyan-400 hover:text-white rounded-full flex items-center justify-center shadow-lg border-4 border-slate-900 transition-all hover:scale-110 active:scale-90 z-10"
                            title="Evolve Identity"
                        >
                            <span className="text-xl">🧬</span>
                        </button>
                    </div>
                    
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">{window.location.pathname.split('/').pop() || 'Student'}</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                            <span>Identity Verified</span>
                            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                            <span>Level {studentProfile.level}</span>
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{studentProfile.pv} PV</span>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{studentProfile.level * 500} PV NEXT</span>
                        </div>
                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5 p-0.5">
                            <div 
                                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all duration-1000"
                                style={{ width: `${Math.min(100, (studentProfile.pv / (studentProfile.level * 500)) * 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center hover:bg-slate-900/60 transition">
                    <span className="text-3xl mb-2 filter drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]">🔥</span>
                    <span className="text-xl font-black text-white">{studentProfile.streak || 0}</span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Day Streak</span>
                </div>
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center hover:bg-slate-900/60 transition">
                    <span className="text-3xl mb-2 filter drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">🏆</span>
                    <span className="text-xl font-black text-white">{studentProfile.unlockedAchievements?.length || 0}</span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Badges</span>
                </div>
            </div>

            {/* Evolution Path (Replaces Recent Achievements) */}
            <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-6">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Evolution Path</h3>
                <div className="flex justify-between items-center relative">
                    {/* Connecting Line */}
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -z-10"></div>
                    
                    {[1, 2, 3, 4, 5].map((stage) => {
                        const isUnlocked = (currentAvatar.stage || 0) >= stage;
                        const isNext = (currentAvatar.stage || 0) + 1 === stage;
                        
                        return (
                            <div key={stage} className="relative group">
                                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10 
                                    ${isUnlocked ? 'bg-cyan-500 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 
                                      isNext ? 'bg-slate-900 border-cyan-500/50 animate-pulse' : 'bg-slate-900 border-slate-700'}`}>
                                    {isUnlocked ? <span className="text-xs">✓</span> : <span className="text-[10px] text-slate-500">{stage}</span>}
                                </div>
                                {isNext && (
                                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] text-cyan-400 font-mono whitespace-nowrap">
                                        LOCKED
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
