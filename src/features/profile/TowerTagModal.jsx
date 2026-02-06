import React, { useState } from 'react';
import { useMastery } from '../../context/MasteryContext';

export default function TowerTagModal() {
    const { studentProfile, setTowerTag } = useMastery();
    const [input, setInput] = useState('');
    const [error, setError] = useState('');

    // If tag is already set, don't show modal
    if (studentProfile.towerTag) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const tag = input.trim();
        
        if (tag.length < 3) {
            setError('Tag must be at least 3 characters.');
            return;
        }
        if (tag.length > 15) {
            setError('Tag must be under 15 characters.');
            return;
        }
        
        setTowerTag(tag);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="w-full max-w-md bg-slate-900 border border-cyan-500/50 rounded-2xl p-8 shadow-[0_0_50px_rgba(6,182,212,0.2)] text-center relative overflow-hidden">
                
                {/* Decorative BG */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>

                <div className="relative z-10">
                    <div className="w-16 h-16 bg-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-cyan-500/30">
                        <span className="text-3xl">🆔</span>
                    </div>

                    <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Identify Yourself</h2>
                    <p className="text-slate-400 text-sm mb-8">Enter your unique Agent Name (TowerTag) to track your stats on the global network.</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <input 
                                type="text" 
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    setError('');
                                }}
                                placeholder="E.g. NeonRider99"
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-center text-white font-mono text-lg focus:outline-none focus:border-cyan-500 transition-colors uppercase placeholder:text-slate-700"
                                autoFocus
                            />
                            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                        </div>

                        <button 
                            type="submit"
                            disabled={!input.trim()}
                            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl uppercase tracking-widest transition-all shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Initialize Profile
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
