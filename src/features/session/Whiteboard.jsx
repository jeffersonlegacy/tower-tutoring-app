// Whiteboard.jsx
import React, { useEffect } from "react";
import { Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";

export default function Whiteboard({ sessionId, onMount }) {
  // We use the onMount callback from Tldraw to pass the editor instance back to the parent
  return (
    <div className="w-full h-full border border-slate-600 bg-white">
      <Tldraw onMount={onMount} />
    </div>
  );
}
