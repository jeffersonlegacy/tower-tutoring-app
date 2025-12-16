import React, { useState } from "react";
import SessionJoin from "./components/SessionJoin";
import Whiteboard from "./components/Whiteboard";
import VideoChat from "./components/VideoChat";
import Uploads from "./components/Uploads";

export default function App() {
  const [session, setSession] = useState(null); // sessionName, user info, etc.

  if (!session) {
    return <SessionJoin onJoin={setSession} />;
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="p-4 text-center text-2xl font-bold bg-slate-800 shadow">
        Tower Tutoring — Session: {session.sessionName}
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col w-1/4 bg-slate-900 border-r border-slate-700">
          <Uploads session={session} />
        </div>
        <div className="flex flex-1 flex-col">
          <Whiteboard session={session} />
        </div>
        <div className="flex w-[400px] min-w-[300px] max-w-[500px] bg-slate-900 border-l border-slate-700">
          <VideoChat session={session} />
        </div>
      </div>
    </div>
  );
}
