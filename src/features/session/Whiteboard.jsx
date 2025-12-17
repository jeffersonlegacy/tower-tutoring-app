// Whiteboard.jsx
import React, { useState } from "react";
import { Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { useWhiteboardSync } from "../../hooks/useWhiteboardSync";

export default function Whiteboard({ sessionId, onMount }) {
  const [editor, setEditor] = useState(null);

  // Sync with Firestore
  useWhiteboardSync(editor, sessionId);

  const handleMount = (instance) => {
    setEditor(instance);
    if (onMount) onMount(instance);
  };

  return (
    <div className="w-full h-full border border-slate-600 bg-white">
      <Tldraw onMount={handleMount} />
    </div>
  );
}
