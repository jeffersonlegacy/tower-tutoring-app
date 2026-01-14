import React from 'react';
import { useMastery } from '../context/MasteryContext';
import { ACHIEVEMENTS } from '../features/games/mathMind/adaptiveEngine';

export default function AchievementToast() {
    const { notifications } = useMastery();

    if (!notifications || notifications.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
            {notifications.map(note => {
                if (note.type === 'achievement') {
                    const ach = ACHIEVEMENTS[note.data.id];
                    if (!ach) return null;
                    return (
                        <div key={note.id} className="bg-slate-900 border border-yellow-500/50 p-4 rounded-xl shadow-2xl flex items-center gap-4 animate-slide-up pointer-events-auto min-w-[300px]">
                            <div className="text-4xl animate-bounce">{ach.icon}</div>
                            <div>
                                <div className="text-xs font-bold text-yellow-500 uppercase tracking-widest">Achievement Unlocked!</div>
                                <div className="font-bold text-white text-lg">{ach.name}</div>
                                <div className="text-xs text-slate-400">{ach.desc}</div>
                            </div>
                        </div>
                    );
                }
                return null;
            })}
        </div>
    );
}
