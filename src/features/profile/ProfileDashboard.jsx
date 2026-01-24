import React, { useState } from 'react';
import { useMastery } from '../../context/MasteryContext';
import AvatarCanvas from './AvatarCanvas';
import AvatarMaker from './AvatarMaker';

export default function ProfileDashboard() {
    const { studentProfile, setAvatarConfig } = useMastery();
    const [isEditing, setIsEditing] = useState(false);

    // Default Avatar Config if none set
    const currentAvatar = studentProfile.avatarConfig || {
        skinColor: '#EDB98A',
        hairColor: '#4A312C',
        clotheColor: '#3B82F6',
        circleColor: '#1E293B',
        topType: 'shortHair',
        eyeType: 'default',
        mouthType: 'smile',
        accessoriesType: 'none'
    };

    if (isEditing) {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-full max-w-4xl relative">
                    <button 
                        onClick={() => setIsEditing(false)}
                        className="absolute -top-12 right-0 text-white/50 hover:text-white flex items-center gap-2 group"
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest">Close Matrix</span>
                        <span className="text-2xl group-hover:rotate-90 transition-transform">×</span>
                    </button>
                    <AvatarMaker 
                        initialConfig={currentAvatar}
                        onSave={(cfg) => {
                            setAvatarConfig(cfg);
                            setIsEditing(false);
                        }} 
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-6 space-y-8 overflow-y-auto font-sans">
            {/* Profile Header Card */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                        <AvatarCanvas config={currentAvatar} size={160} className="shadow-2xl border-4 border-white/5" />
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900 transition-transform hover:scale-110 active:scale-90"
                        >
                            <span className="text-lg">⚙️</span>
                        </button>
                    </div>
                    
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Student Peer</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Identity Verified // Level {studentProfile.level}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{studentProfile.xp} XP</span>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{studentProfile.level * 500} XP NEXT</span>
                        </div>
                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5 p-0.5">
                            <div 
                                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                                style={{ width: `${(studentProfile.xp / (studentProfile.level * 500)) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                    <span className="text-2xl mb-1">🔥</span>
                    <span className="text-xl font-black text-white">{studentProfile.streak || 0}</span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Day Streak</span>
                </div>
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                    <span className="text-2xl mb-1">🏆</span>
                    <span className="text-xl font-black text-white">{studentProfile.unlockedAchievements?.length || 0}</span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Badges</span>
                </div>
            </div>

            {/* Achievements List */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Recent Achievements</h3>
                <div className="space-y-2">
                    {studentProfile.unlockedAchievements?.length > 0 ? (
                        studentProfile.unlockedAchievements.slice(0, 3).map(id => (
                            <div key={id} className="flex items-center gap-3 p-3 bg-slate-950/30 border border-white/5 rounded-xl">
                                <span className="text-lg">⭐</span>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-white uppercase tracking-wide">{id.replace('_', ' ')}</p>
                                    <p className="text-[9px] text-slate-500">+50 XP Bonus</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-[10px] text-slate-600 italic text-center py-4">Solve problems to unlock trophies...</p>
                    )}
                </div>
            </div>
        </div>
    );
}
