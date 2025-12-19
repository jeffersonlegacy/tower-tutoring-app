// Whiteboard.jsx
import React from "react";

export default function Whiteboard({ sessionId }) {
  // Generate a unique board URL for this session
  // Using 'JeffersonTutoring_' prefix to keep it branded, plus the session ID for uniqueness.
  const boardUrl = `https://wbo.ophir.dev/boards/JeffersonTutoring_${sessionId || 'Lobby'}`;

  return (
    <div className="w-full h-full bg-slate-100 flex flex-col relative overflow-hidden border border-slate-600">
      {/* Header / Info overlay can go here if needed */}
      <iframe
        src={boardUrl}
        className="w-full h-full border-0"
        title="Collaborative Whiteboard"
        allow="clipboard-write"
      />
    </div>
  );
}
