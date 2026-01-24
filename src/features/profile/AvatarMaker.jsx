import React, { useState } from 'react';
import AvatarCanvas from './AvatarCanvas';
import { useMastery } from '../../context/MasteryContext';

const OPTIONS = {
    skin: ['#EDB98A', '#F1C27D', '#FFDBAC', '#E0AC69', '#8D5524'],
    hair: ['#4A312C', '#2C1B18', '#7B5E57', '#DEBC99', '#B8977E', '#6A4E42'],
    clothes: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1'],
    background: ['#1E293B', '#0F172A', '#111827', '#1E1B4B', '#020617'],
    top: [
        { id: 'shortHair', label: 'Short Hair', xp: 0 },
        { id: 'longHair', label: 'Long Hair', xp: 50 },
        { id: 'bald', label: 'Bald', xp: 0 }
    ],
    eyes: [
        { id: 'default', label: 'Default', xp: 0 },
        { id: 'happy', label: 'Happy', xp: 100 },
        { id: 'wink', label: 'Wink', xp: 200 }
    ],
    mouth: [
        { id: 'smile', label: 'Smile', xp: 0 },
        { id: 'default', label: 'Serious', xp: 0 }
    ],
    accessories: [
        { id: 'none', label: 'None', xp: 0 },
        { id: 'glasses', label: 'Glasses', xp: 300 },
        { id: 'crown', label: 'Crown', xp: 1000 }
    ]
};

export default function AvatarMaker({ onSave, initialConfig }) {
    const { studentProfile } = useMastery();
    const [config, setConfig] = useState(initialConfig || studentProfile.avatarConfig || {
        skinColor: OPTIONS.skin[0],
        hairColor: OPTIONS.hair[0],
        clotheColor: OPTIONS.clothes[0],
        circleColor: OPTIONS.background[0],
        topType: 'shortHair',
        eyeType: 'default',
        mouthType: 'smile',
        accessoriesType: 'none'
    });

    const update = (key, val) => setConfig(prev => ({ ...prev, [key]: val }));

    const isLocked = (item) => (item.xp || 0) > (studentProfile.xp || 0);

    return (
        <div className="flex flex-col md:flex-row gap-8 p-6 bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl">
            {/* Preview Section */}
            <div className="flex flex-col items-center gap-6 shrink-0">
                <div className="p-4 bg-slate-950/50 rounded-full border-4 border-white/5 shadow-2xl relative group">
                    <AvatarCanvas config={config} size={240} />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/10 to-transparent pointer-events-none" />
                </div>
                <div className="text-center">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Identity Matrix</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Status: Level {studentProfile.level} Architect</p>
                </div>
                <button
                    onClick={() => onSave?.(config)}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-blue-900/40 transition-all active:scale-95"
                >
                    Update Identity
                </button>
            </div>

            {/* Customization Section */}
            <div className="flex-1 space-y-8 overflow-y-auto max-h-[600px] pr-4 custom-scrollbar">
                
                {/* Colors */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-l-2 border-blue-500 pl-2">Pigment Control</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-[10px] text-slate-400 mb-2 uppercase font-bold">Skin Tone</p>
                            <div className="flex flex-wrap gap-2">
                                {OPTIONS.skin.map(c => (
                                    <button 
                                        key={c} 
                                        onClick={() => update('skinColor', c)} 
                                        style={{ backgroundColor: c }}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${config.skinColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                    />
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 mb-2 uppercase font-bold">Background</p>
                            <div className="flex flex-wrap gap-2">
                                {OPTIONS.background.map(c => (
                                    <button 
                                        key={c} 
                                        onClick={() => update('circleColor', c)} 
                                        style={{ backgroundColor: c }}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${config.circleColor === c ? 'border-white scale-110 shadow-lg' : 'border-black/50 hover:scale-105'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body Parts */}
                <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-l-2 border-indigo-500 pl-2">Module Selection</h4>
                    
                    <div className="space-y-2">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Headpiece</p>
                        <div className="flex flex-wrap gap-2">
                            {OPTIONS.top.map(t => {
                                const locked = isLocked(t);
                                return (
                                    <button
                                        key={t.id}
                                        disabled={locked}
                                        onClick={() => update('topType', t.id)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-2 border-2 ${config.topType === t.id ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800/50 border-white/5 text-slate-400 hover:text-slate-200'} ${locked ? 'opacity-50 cursor-not-allowed contrast-75 grayscale' : ''}`}
                                    >
                                        {locked && <span className="text-xs">🔒</span>}
                                        {t.label}
                                        {locked && <span className="text-[8px] opacity-70">({t.xp} XP)</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Vision Matrix (Eyes)</p>
                        <div className="flex flex-wrap gap-2">
                            {OPTIONS.eyes.map(t => {
                                const locked = isLocked(t);
                                return (
                                    <button
                                        key={t.id}
                                        disabled={locked}
                                        onClick={() => update('eyeType', t.id)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-2 border-2 ${config.eyeType === t.id ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800/50 border-white/5 text-slate-400 hover:text-slate-200'} ${locked ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                    >
                                        {locked && <span className="text-xs">🔒</span>}
                                        {t.label}
                                        {locked && <span className="text-[8px] opacity-70">({t.xp} XP)</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Unlockable Fragments (Accessories)</p>
                        <div className="flex flex-wrap gap-2">
                            {OPTIONS.accessories.map(t => {
                                const locked = isLocked(t);
                                return (
                                    <button
                                        key={t.id}
                                        disabled={locked}
                                        onClick={() => update('accessoriesType', t.id)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-2 border-2 ${config.accessoriesType === t.id ? 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-800/50 border-white/5 text-slate-400 hover:text-slate-200'} ${locked ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                    >
                                        {locked && <span>👑</span>}
                                        {t.label}
                                        {locked && <span className="text-[8px] opacity-70">({t.xp} XP)</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
