import React from "react";
import { Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";

export default function Whiteboard({ sessionId }) {
  // For full real-time sync, integrate with Firestore in the future.
  return (
    <div className="w-full h-[400px] border border-slate-600 rounded mb-4 bg-white">
      <Tldraw />
    </div>
  );
}
