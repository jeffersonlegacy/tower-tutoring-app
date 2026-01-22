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
    let targetId = session.trim();
    if (!targetId) {
      targetId = `demo_tower_${Math.floor(Math.random() * 1000)}`;
    }

    // Persist
    localStorage.setItem('last_tower_session', targetId);
    navigate(`/session/${encodeURIComponent(targetId)}`);
  };

  const resumeSession = () => {
    if (lastSessionId) navigate(`/session/${encodeURIComponent(lastSessionId)}`);
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
      <main className="flex-1 flex flex-col items-center justify-start md:justify-center relative z-10 p-6 pt-[max(2rem,env(safe-area-inset-top))] sm:pt-32 md:pt-0 pb-12 w-full max-w-7xl mx-auto">

        {/* Branding */}
        <div className="text-center mb-8 md:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">

          {/* THE CIRCUIT TOWER EMBLEM */}
          <div className="mb-8 md:mb-10 relative inline-block group cursor-pointer" onClick={() => navigate(`/session/demo_${Math.floor(Math.random() * 1000)}`)}>
            {/* Outer Pulse Ring */}
            <div className="absolute -inset-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000 animate-pulse-slow"></div>

            {/* Rotating Circuit Ring */}
            <div className="absolute -inset-1 rounded-full border-2 border-cyan-500/30 border-t-transparent border-l-transparent animate-spin-slow pointer-events-none"></div>
            <div className="absolute -inset-1 rounded-full border-2 border-blue-500/20 border-b-transparent border-r-transparent animate-reverse-spin pointer-events-none"></div>

            {/* Main Emblem Container */}
            <div className="w-48 h-48 md:w-80 md:h-80 relative z-10 rounded-full border-4 border-cyan-900/50 shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden bg-black transition-transform duration-700 ease-out group-hover:scale-105 group-hover:shadow-[0_0_80px_rgba(6,182,212,0.3)]">

              {/* Emblem Overlay */}
              <img
                src={towerEmblem} // Using Tower Emblem as the main logo
                alt="Tower Tutoring Emblem"
                className="relative z-10 w-full h-full object-contain p-0 opacity-100 transform transition-transform duration-700 group-hover:scale-110"
              />

              {/* Glass Sheen Overlay (Subtle) */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20"></div>
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter text-white mb-4 drop-shadow-2xl px-2">
            TOWER
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 pb-4 filter drop-shadow-[0_0_15px_rgba(6,182,212,0.5)] leading-tight">
              TUTORING
            </span>
          </h1>

          <p className="text-slate-400 text-sm md:text-base font-medium tracking-[0.2em] uppercase mb-6">
            There’s Always Another Level
          </p>

          {/* Acronym Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-white/10 backdrop-blur-md shadow-lg hover:border-cyan-500/30 transition-colors cursor-default mb-8">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
            <p className="text-[10px] md:text-xs text-cyan-200/80 font-mono tracking-wider">
              <span className="font-bold text-cyan-400">T</span>utoring <span className="font-bold text-cyan-400">O</span>ptimized <span className="font-bold text-cyan-400">W</span>ith <span className="font-bold text-cyan-400">E</span>lite <span className="font-bold text-cyan-400">R</span>esources
            </p>
          </div>

          {/* RESUME BUTTON (If exists) */}
          {lastSessionId && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-700 mb-6">
              <button
                onClick={resumeSession}
                className="group flex items-center gap-3 px-6 py-3 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full border border-cyan-500/30 hover:border-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]"
              >
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Resume Active Session</span>
                  <span className="text-sm font-mono text-cyan-300">ID: {lastSessionId}</span>
                </div>
                <span className="ml-2 text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          )}

        </div>

        {/* Access Terminal */}
        <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-white/10 p-1 rounded-2xl shadow-2xl mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <div className="bg-slate-950/80 rounded-xl p-6 border border-white/5 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Session Access Code</label>
              <input
                className="w-full bg-slate-900 text-white px-4 py-3 rounded-lg border border-slate-700/50 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 placeholder-slate-600 font-mono text-sm transition-all"
                type="text"
                placeholder="ENTER CODE OR START DEMO..."
                value={session}
                onChange={e => setSession(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleStart() }}
              />
            </div>
            <button
              onClick={handleStart}
              className="w-full group relative overflow-hidden bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-lg transition-all shadow-lg hover:shadow-cyan-500/25 active:scale-[0.98]"
            >
              <span className="relative z-10 tracking-widest uppercase text-xs flex items-center justify-center gap-2">
                {session.trim() ? 'Initialize Uplink' : 'Launch Session'}
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          <FeatureCard
            imageSrc={jiLogo}
            title="Jefferson Intelligence"
            description="Elite AI tutoring powered by advanced neural networks. Personalized guidance 24/7."
            color="cyan"
          />
          <FeatureCard
            icon="⚡"
            title="Brain Break"
            description="Competitive multiplayer games designed to sharpen reflexes and intellect simultaneously."
            color="purple"
          />
          <FeatureCard
            icon="🔬"
            title="The Lab"
            description="Collaborative workspace with real-time whiteboards and precision tools."
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
