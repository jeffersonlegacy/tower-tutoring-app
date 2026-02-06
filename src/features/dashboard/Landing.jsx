import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FeatureCard from "./components/FeatureCard";
import towerVideo from "../../assets/TowerIntroVid.mp4";
import towerEmblem from "../../assets/tower_emblem.jpg";
import jiLogo from "../../assets/ji_logo.jpg";

export default function Landing() {
  const [session, setSession] = useState("");
  const navigate = useNavigate();

  // Resume Logic
  const [lastSessionId, setLastSessionId] = useState(null);
  useEffect(() => {
    const stored = localStorage.getItem('last_tower_session');
    if (stored) setLastSessionId(stored);
  }, []);

  const handleStart = () => {
    let targetId = session.trim().toLowerCase();
    if (!targetId) {
      targetId = `demo_tower_${Math.floor(Math.random() * 1000)}`;
    }

    // Persist
    // Navigate directly to the LIVE SESSION (Video/Whiteboard) as requested
    navigate(`/session/${targetId}`);
  };

  const resumeSession = () => {
    if (lastSessionId) navigate(`/session/${lastSessionId}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-cyan-500/30 overflow-x-hidden relative flex flex-col">

      {/* --- BACKGROUND LAYERS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Dynamic Video Background - MOVED HERE */}
        <video
          autoPlay
          loop
          muted
          playsInline
          ref={el => el && el.play()}
          className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen"
        >
          <source src={towerVideo} type="video/mp4" />
        </video>

        {/* Grid Floor Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        {/* Glow Orbs */}
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]"></div>
      </div>

      {/* --- HERO SECTION --- */}
      <main className="flex-1 flex flex-col items-center justify-start relative z-10 p-6 pt-36 md:pt-48 pb-20 w-full max-w-7xl mx-auto">

        {/* Branding */}
        <div className="text-center mb-8 md:mb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">

          {/* THE JEFFERSON EMBLEM */}
          <div className="mb-8 md:mb-10 relative inline-block group cursor-pointer" onClick={() => navigate(`/session/demo_${Math.floor(Math.random() * 1000)}`)}>
            {/* Outer Pulse Ring */}
            <div className="absolute -inset-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000 animate-pulse-slow"></div>

            {/* Main Emblem Container */}
            <div className="w-48 h-48 md:w-64 md:h-64 relative z-10 rounded-full border-4 border-cyan-900/50 shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden bg-slate-900 flex items-center justify-center transition-transform duration-700 ease-out group-hover:scale-105 group-hover:shadow-[0_0_80px_rgba(6,182,212,0.3)]">
              
              {/* Jefferson Logo */}
              <img 
                src={jiLogo} 
                alt="ToweR Tutoring" 
                className="w-full h-full object-contain p-4 bg-slate-950 opacity-90 hover:opacity-100 transition-opacity duration-500"
              />

              {/* Glass Sheen Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20"></div>
            </div>
            
            {/* TECH BADGE - ABSOLUTE */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-cyan-500/50 px-3 py-1 rounded text-[10px] font-mono text-cyan-400 tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.4)] whitespace-nowrap z-30">
              NEXT-GEN AI ENGINE
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter text-white mb-6 drop-shadow-2xl px-4">
            TOWER
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 pb-4 filter drop-shadow-[0_0_20px_rgba(6,182,212,0.3)] leading-tight mt-2">
              TUTORING
            </span>
          </h1>

          <div className="flex flex-col items-center gap-4 mb-10">
            <p className="text-emerald-400 text-xs md:text-sm font-mono tracking-[0.2em] uppercase bg-emerald-950/30 border border-emerald-500/20 px-4 py-2 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              ★ THE WORLD'S FIRST TRUE AI TUTOR
            </p>
            <p className="text-slate-400 text-sm md:text-lg font-medium tracking-[0.1em] max-w-2xl leading-relaxed">
              Experience the only education system that <span className="text-cyan-300">adapts instantly</span> to how your child learns.
            </p>
          </div>

          {/* Acronym Badge */}
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-slate-900/80 border border-white/10 backdrop-blur-md shadow-lg hover:border-cyan-500/30 transition-colors cursor-default mb-8">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
            <p className="text-[10px] md:text-xs text-cyan-200/80 font-mono tracking-wider">
               SYSTEM STATUS: <span className="text-emerald-400 font-bold">ONLINE</span> // LATENCY: <span className="text-emerald-400">OPTIMIZED</span>
            </p>
          </div>

          {/* RESUME BUTTON (If exists) */}
          {lastSessionId && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-700 mb-6">
              <button
                onClick={resumeSession}
                className="group flex items-center gap-3 px-6 py-3 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full border border-cyan-500/30 hover:border-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]"
              >
                <div className="relative">
                  <span className="w-3 h-3 rounded-full bg-green-500 absolute animate-ping opacity-75"></span>
                  <span className="w-3 h-3 rounded-full bg-green-500 relative block"></span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Resume Session</span>
                  <span className="text-sm font-mono text-cyan-300">ID: {lastSessionId}</span>
                </div>
                <span className="ml-2 text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          )}

        </div>

        {/* Access Terminal */}
        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-cyan-500/20 p-1 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.1)] mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 group hover:border-cyan-500/40 transition-colors">
          <div className="bg-slate-950/90 rounded-xl p-8 border border-white/5 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                 <label className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest pl-1">ENTER YOUR UNIQUE TOWERTAG</label>
                 <span className="text-[9px] font-mono text-slate-600">V4.1</span>
              </div>
              <input
                className="w-full bg-slate-900 text-cyan-100 px-6 py-4 rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-700 font-mono text-lg tracking-wider text-center transition-all shadow-inner"
                type="text"
                placeholder="TOWERTAG"
                value={session}
                onChange={e => setSession(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleStart() }}
              />
            </div>
            <button
              onClick={handleStart}
              className="w-full group/btn relative overflow-hidden bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-5 rounded-lg transition-all shadow-[0_4px_20px_rgba(6,182,212,0.2)] hover:shadow-[0_4px_30px_rgba(6,182,212,0.4)] active:scale-[0.98]"
            >
              <span className="relative z-10 tracking-[0.2em] uppercase text-xs flex items-center justify-center gap-3 font-mono">
                {session.trim() ? '>>> START SESSION' : '>>> LAUNCH DEMO'}
                <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 px-4">
          <FeatureCard
            imageSrc={jiLogo}
            title="ADAPTIVE AI LOGIC"
            description="The first system that learns how you learn, expanding to meet your child's needs."
            color="cyan"
          />
          <FeatureCard
            icon="⚡"
            title="HIGH-SPEED TRAINING"
            description="Competitive challenges designed to build focus and rapid problem-solving skills."
            color="purple"
          />
          <FeatureCard
            icon="🔬"
            title="INTERACTIVE LAB"
            description="A cutting-edge visual workspace where creativity meets logic."
            color="emerald"
          />
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center border-t border-white/5 bg-slate-950/50 backdrop-blur-sm">
        <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em] font-medium">
          Tower Tutoring System v2.0 // <span className="text-emerald-500">Online</span>
        </p>
      </footer>
    </div>
  );
}
