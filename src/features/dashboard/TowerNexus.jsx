import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMastery } from '../../context/MasteryContext';
import { motion, AnimatePresence } from 'framer-motion';
import AvatarCanvas from '../profile/AvatarCanvas';

// --- STYLING CONSTANTS ---
const GLASS_CARD = "bg-slate-900/60 backdrop-blur-2xl border border-white/10 shadow-2xl hover:border-cyan-500/30 transition-all duration-500 overflow-hidden group";
const NEON_TEXT = "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500";
const GLOW_SHADOW = "shadow-[0_0_20px_rgba(6,182,212,0.2)]";

/**
 * TowerNexus - The central hub for MathTelligence
 * Simplified and vision-aligned "Nuke & Restart" version.
 */
export default function TowerNexus() {
    const { studentProfile, cognitiveState, getRecommendedSession } = useMastery();
    const navigate = useNavigate();
    const [rec, setRec] = useState(null);

    useEffect(() => {
        setRec(getRecommendedSession());
    }, [getRecommendedSession]);

    // Game stats mock or from profile
    const gamesCount = 5; 
    
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 overflow-x-hidden relative pb-20">
            
            {/* --- ADAPTIVE BACKGROUND --- */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.1)_0%,transparent_70%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px]" />
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[100px]" />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 flex flex-col gap-10">
                
                {/* --- TOP BAR: IDENTITY & STATS --- */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl font-black tracking-tighter uppercase italic text-white">MATH<span className={NEON_TEXT}>NEXUS</span></span>
                            <div className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-[9px] font-mono text-cyan-400 animate-pulse">SYSTEM_ACTIVE</div>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em]">Integrated Intelligence Environment</p>
                    </div>

                    <div className="flex items-center gap-6 bg-slate-900/40 backdrop-blur-md border border-white/5 p-2 pr-6 rounded-2xl">
                        <div 
                            onClick={() => navigate('/session/hub')}
                            className="w-14 h-14 rounded-xl bg-slate-950 border-2 border-cyan-500/30 overflow-hidden cursor-pointer hover:border-cyan-400 transition-all shadow-lg flex items-center justify-center p-1"
                        >
                            {studentProfile.avatarConfig?.src ? (
                                <img 
                                    src={studentProfile.avatarConfig.src} 
                                    className="w-full h-full object-cover rounded-lg" 
                                    style={{ imageRendering: studentProfile.avatarConfig.type === 'sprite' ? 'pixelated' : 'auto' }}
                                    alt="Avatar"
                                />
                            ) : (
                                <AvatarCanvas config={studentProfile.avatarConfig} size={48} />
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-white uppercase tracking-tight">{studentProfile.towerTag || 'AGENT_X'}</span>
                                <span className="text-[9px] font-mono text-cyan-500">LVL {studentProfile.level}</span>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{studentProfile.pv} PV</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{studentProfile.streak}D STREAK</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* --- CORE SECTIONS GRID --- */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    
                    {/* LEFT COLUMN: HERO ACTION (7/12) */}
                    <div className="md:col-span-8 flex flex-col gap-6">
                        
                        {/* THE RED BUTTON: JOIN LIVE */}
                        <section 
                            className={`${GLASS_CARD} rounded-[2rem] p-8 md:p-12 relative flex flex-col justify-end min-h-[400px] border-red-500/20 hover:border-red-500/40 transition-all duration-700 cursor-pointer`}
                            onClick={() => {
                                const lastSession = localStorage.getItem('last_tower_session') || `tower_${Math.floor(Math.random()*1000)}`;
                                navigate(`/session/${lastSession}`);
                            }}
                        >
                            {/* Visual Flare */}
                            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-red-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            <div className="absolute top-12 right-12 text-8xl md:text-9xl opacity-10 group-hover:opacity-20 transition-all duration-700 group-hover:scale-120 group-hover:rotate-12 select-none">🚀</div>
                            
                            <div className="relative space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-4 h-4 rounded-full bg-red-600 animate-ping" />
                                    <span className="text-xs font-mono text-red-500 tracking-[0.3em] font-bold uppercase">Ready for Deployment</span>
                                </div>
                                
                                <h2 className="text-5xl md:text-7xl font-black italic text-white leading-none">
                                    JOIN LIVE<br/>
                                    <span className="text-red-500">SESSION</span>
                                </h2>
                                
                                <p className="text-lg text-slate-400 max-w-lg">
                                    Your AI-enhanced visual workspace is active. Enter now to continue your {rec?.node?.title || 'learning'} path.
                                </p>

                                <div className="inline-flex items-center gap-4 px-6 py-3 bg-red-600 text-white rounded-xl font-black tracking-widest uppercase text-sm shadow-[0_0_30px_rgba(220,38,38,0.3)] group-hover:shadow-[0_0_50px_rgba(220,38,38,0.5)] transition-all">
                                    Launch Interface
                                    <span className="group-hover:translate-x-2 transition-transform">→</span>
                                </div>
                            </div>
                        </section>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* CURRICULUM PATH */}
                            <section 
                                onClick={() => navigate('/curriculum')}
                                className={`${GLASS_CARD} rounded-3xl p-6 flex flex-col justify-between h-48 cursor-pointer hover:bg-slate-900/60`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-2xl">🗺️</div>
                                    <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">Navigation</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1 uppercase tracking-tight">Curriculum Map</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Visual Sector Progress & Mastery</p>
                                </div>
                            </section>

                            {/* ASSESSMENT CENTER */}
                            <section 
                                onClick={() => navigate('/assessment')}
                                className={`${GLASS_CARD} rounded-3xl p-6 flex flex-col justify-between h-48 cursor-pointer hover:bg-slate-900/60`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-2xl">🧠</div>
                                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">Diagnostic</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1 uppercase tracking-tight">Neuro Diagnostics</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Analyze Cognitive Velocity</p>
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: ARCADE & SOCIAL (4/12) */}
                    <div className="md:col-span-4 flex flex-col gap-6">
                        
                        {/* ARCADE BLOCK */}
                        <section 
                            onClick={() => navigate('/arcade')}
                            className={`${GLASS_CARD} rounded-[2rem] p-8 flex-1 flex flex-col justify-between border-purple-500/20 hover:border-purple-500/40 relative group cursor-pointer h-full`}
                        >
                            <div className="absolute top-0 right-0 p-8 text-7xl opacity-10 group-hover:opacity-30 transition-all duration-700 group-hover:scale-110 group-hover:-rotate-6 select-none">🕹️</div>
                            
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                                    <span className="text-xs font-mono text-purple-400 font-bold uppercase tracking-widest">Brain Break</span>
                                </div>
                                <h2 className="text-4xl font-black text-white italic leading-tight">THE<br/><span className="text-purple-500 uppercase not-italic">Arcade</span></h2>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                                        <span>Game Queue</span>
                                        <span className="text-purple-400">{gamesCount} ACTIVE</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {['HOCKEY', 'BATTLESHIP', 'CONNECT4', 'CHECKERS', 'SWIPE'].map(g => (
                                            <span key={g} className="px-2 py-1 rounded bg-slate-950/80 border border-white/5 text-[8px] font-mono text-slate-400">{g}</span>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="w-full py-4 bg-purple-600 text-white rounded-xl font-black tracking-widest uppercase text-xs text-center shadow-lg group-hover:bg-purple-500 transition-colors">
                                    Enter Arcade
                                </div>
                            </div>
                        </section>

                        {/* SPEED CLINIC */}
                        <section 
                            onClick={() => navigate('/speed-math/practice/basics')}
                            className={`${GLASS_CARD} rounded-3xl p-6 flex items-center gap-4 cursor-pointer hover:bg-slate-900/60`}
                        >
                            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-2xl">⚡</div>
                            <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-tight">Speed Clinic</h4>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Rapid Arithmetic Drills</p>
                            </div>
                        </section>

                        {/* PARENTAL PORTAL (Optional/Quiet link) */}
                        <section 
                            onClick={() => navigate('/parent-dashboard')}
                            className={`${GLASS_CARD} rounded-3xl p-6 flex items-center gap-4 cursor-pointer hover:bg-slate-900/60 transition-all text-slate-600 hover:text-slate-400`}
                        >
                            <div className="w-12 h-12 rounded-xl bg-slate-800/10 flex items-center justify-center text-xl">🛡️</div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest">Oversight Command</h4>
                                <p className="text-[8px] font-bold uppercase tracking-[0.2em] mt-0.5 opacity-50">Parental Audit Access</p>
                            </div>
                        </section>

                    </div>
                </div>

                {/* --- SECTORS FOOTER --- */}
                <section className="bg-slate-900/20 rounded-3xl p-8 border border-white/5 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Neural Sectors</h3>
                        <span className="text-[10px] font-mono text-cyan-500/50">SYSTEM_OPTIMIZED // BIOMETRICS_LOCKED</span>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { id: 'foundations', name: 'Foundations', icon: '🧱', color: 'blue' },
                            { id: 'algebra', name: 'Algebra', icon: '📐', color: 'purple' },
                            { id: 'geometry', name: 'Geometry', icon: '📏', color: 'emerald' },
                            { id: 'logic', name: 'Logic', icon: '🧩', color: 'cyan' }
                        ].map(sector => (
                            <div 
                                key={sector.id}
                                onClick={() => navigate(`/curriculum?focus=${sector.id}`)}
                                className="p-4 rounded-xl bg-slate-950/40 border border-white/5 hover:border-cyan-500/20 transition-all cursor-pointer group flex items-center gap-3"
                            >
                                <span className="text-lg group-hover:scale-110 transition-transform">{sector.icon}</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">{sector.name}</span>
                            </div>
                        ))}
                    </div>
                </section>

            </main>

            {/* --- BOTTOM MOBILE HUD (Sticky on mobile, hidden on desktop maybe but good for quick nav) --- */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-50 transition-all duration-300">
                <button onClick={() => navigate('/arcade')} className="p-3 hover:bg-white/5 rounded-xl transition-colors">🕹️ Arcade</button>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <button onClick={() => navigate('/curriculum')} className="p-3 hover:bg-white/5 rounded-xl transition-colors">🗺️ Curriculum</button>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <button onClick={() => navigate('/session/hub')} className="p-3 hover:bg-white/5 rounded-xl transition-colors">👤 Profile</button>
            </nav>
        </div>
    );
}
