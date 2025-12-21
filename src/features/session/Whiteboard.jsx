// Whiteboard.jsx
import React from "react";

export default function Whiteboard({ sessionId }) {
  // Fallback to generic Tldraw to ensure board visibility.
  // Specialized room creation via URL seems restricted/changed on tldraw.com.
  const boardUrl = `https://www.tldraw.com/`;

  return (
    <div className="w-full h-full bg-slate-100 flex flex-col relative overflow-hidden border border-slate-600">
      <iframe
        src={boardUrl}
        className="w-full h-full border-0"
        title="Collaborative Whiteboard"
        allow="clipboard-write; clipboard-read; camera; microphone"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
