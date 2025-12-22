import React from 'react';

export default function Whiteboard({ sessionId }) {
  // We use the cracker0dks/whiteboard engine for professional features (undo/redo, images, cursors)
  // We point to a hosted instance (cloud13.de is a demo instance).
  // In production, you would point this to your own hosted instance of cracker0dks/whiteboard.

  const whiteboardBaseUrl = "https://cloud13.de/testwhiteboard/";
  const whiteboardUrl = `${whiteboardBaseUrl}?whiteboardid=${encodeURIComponent(sessionId)}&username=User_${Math.floor(Math.random() * 9000) + 1000}`;

  return (
    <div className="w-full h-full bg-slate-900 relative overflow-hidden flex flex-col">
      {/* 
        CRACKER0DKS WHITEBOARD INTEGRATION
        - Source: https://github.com/cracker0dks/whiteboard
      */}
      <iframe
        src={whiteboardUrl}
        className="flex-1 w-full h-full border-none bg-white"
        title="Collaborative Whiteboard"
        allow="camera; microphone; clipboard-read; clipboard-write; display-capture"
      />

      {/* Contextual Banner for Pro Engine */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-sm border-t border-white/5 px-3 py-1.5 flex justify-between items-center z-20">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-blue-400 tracking-tighter">ENGINE: CRACKER0DKS v2.0</span>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_#3b82f6] animate-pulse"></div>
        </div>
        <div className="flex items-center gap-2 text-[8px] text-slate-500 font-bold uppercase tracking-widest">
          ID: {sessionId}
        </div>
      </div>
    </div>
  );
}
