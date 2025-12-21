// Whiteboard.jsx
import React from "react";

export default function Whiteboard({ sessionId }) {
  // Using Tldraw for robust, auto-syncing rooms.
  // Format: tldraw.com/r/{unique_room_id}
  // We sanitize the sessionId to ensure valid URL characters, though usually unnecessary for UUIDs.
  const roomName = `JeffersonTutoring_${sessionId || 'Lobby'}`.replace(/[^a-zA-Z0-9-_]/g, '');
  const boardUrl = `https://www.tldraw.com/r/${roomName}?minimal=1&viewport=0,0,1920,1080&fit_to_content=1`;

  return (
    <div className="w-full h-full bg-slate-100 flex flex-col relative overflow-hidden border border-slate-600">
      <iframe
        src={boardUrl}
        className="w-full h-full border-0"
        title="Collaborative Whiteboard"
        allow="clipboard-write; clipboard-read; camera; microphone" // Added permissions just in case tldraw needs them
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
