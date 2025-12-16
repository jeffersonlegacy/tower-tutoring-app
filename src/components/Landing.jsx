import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const [session, setSession] = useState("");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700">
      <div className="w-full max-w-sm text-center">
        <img src="/logo.png" alt="Jefferson Tutoring" className="w-32 h-32 mx-auto mb-4 rounded-full shadow-lg shadow-blue-500/50" />
        <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Jefferson Tutoring</h1>
        <input
          className="w-full px-4 py-3 bg-slate-700 text-white border-2 border-slate-600 rounded-lg mb-4 focus:outline-none"
          type="text"
          placeholder="Enter Session Name"
          value={session}
          onChange={e => setSession(e.target.value)}
        />
        <button
          className="w-full bg-sky-600 hover:bg-sky-700 font-bold py-3 px-4 rounded-lg"
          onClick={() => {
            if (session.trim()) navigate(`/session/${encodeURIComponent(session)}`);
          }}
        >Join Workspace</button>
      </div>
    </div>
  );
}
