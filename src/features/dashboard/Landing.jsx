import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const [session, setSession] = useState("");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-slate-950 font-sans selection:bg-cyan-500/30">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] animate-float"></div>
      </div>

      {/* Glass Card */}
      <div className="items-center justify-center p-10 rounded-3xl w-full max-w-md z-10 glass-panel border-t border-white/20 relative">

        {/* Logo Section */}
        <div className="mb-10 relative group cursor-default">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition duration-500"></div>
          <img
            src="/logo.png"
            alt="Jefferson Tutoring"
            className="w-40 h-40 mx-auto rounded-full relative z-10 border-2 border-white/10 shadow-2xl transform group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Typography */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold mb-2 tracking-tight text-white drop-shadow-lg">
            Jefferson
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Tutoring</span>
          </h1>
          <p className="text-slate-400 text-sm uppercase tracking-widest font-medium">Next-Gen Learning</p>
        </div>

        {/* Input Zone */}
        <div className="space-y-4">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl blur opacity-30 group-hover:opacity-75 transition duration-500"></div>
            <input
              className="relative w-full bg-slate-900/90 text-white px-5 py-4 rounded-xl border border-white/10 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 placeholder-slate-500 transition-all"
              type="text"
              placeholder="Enter Application Code..."
              value={session}
              onChange={e => setSession(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && session.trim()) navigate(`/session/${encodeURIComponent(session)}`);
              }}
            />
          </div>

          <button
            className="w-full relative overflow-hidden group bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transform hover:-translate-y-0.5"
            onClick={() => {
              if (session.trim()) navigate(`/session/${encodeURIComponent(session)}`);
            }}
          >
            <span className="relative z-10 tracking-wide uppercase text-sm">Initialize Session</span>
            <div className="absolute inset-0 h-full w-full scale-0 rounded-2xl transition-all duration-300 group-hover:scale-100 group-hover:bg-white/10"></div>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-slate-600 text-xs tracking-wider z-0">
        SYSTEM V2.0 // ONLINE
      </div>
    </div>
  );
}
