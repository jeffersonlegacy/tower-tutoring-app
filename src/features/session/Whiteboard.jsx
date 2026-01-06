/**
 * Whiteboard.jsx - Real-time collaborative whiteboard
 * 
 * Uses Tldraw with Firebase sync for multi-participant drawing.
 * NO local persistence - Firebase is the single source of truth.
 */
import { memo, useState, useCallback, useEffect } from 'react';
import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { useWhiteboardSync } from '../../hooks/useWhiteboardSync';
import { setWhiteboardEditor } from '../../utils/WhiteboardCapture';

const Whiteboard = memo(({ sessionId }) => {
  const [editor, setEditor] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize sync when editor is ready
  useWhiteboardSync(editor, sessionId);

  const handleMount = useCallback((editorInstance) => {
    console.log('[Whiteboard] Editor mounted for session:', sessionId);
    setEditor(editorInstance);

    // Expose editor to WhiteboardCapture utility for AI vision
    setWhiteboardEditor(editorInstance);

    // Small delay to ensure editor is fully initialized
    setTimeout(() => setIsReady(true), 100);
  }, [sessionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[Whiteboard] Unmounting');
      setEditor(null);
      setIsReady(false);
    };
  }, []);

  return (
    <div className="w-full h-full bg-slate-900 relative overflow-hidden flex flex-col">
      {/* Loading indicator while editor initializes */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-50">
          <div className="text-slate-400 text-sm animate-pulse">Loading whiteboard...</div>
        </div>
      )}

      {/* Tldraw Editor */}
      <div className={`w-full h-full tldraw__editor transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'}`}>
        <Tldraw
          onMount={handleMount}
          hideUi={false}
          autoFocus
        />
      </div>

      {/* Status Banner */}
      <div className="hidden md:flex absolute bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-sm border-t border-white/5 px-3 py-1.5 justify-between items-center z-20 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-purple-400 tracking-tighter">SYNC: FIREBASE REALTIME</span>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e] animate-pulse"></div>
        </div>
        <div className="flex items-center gap-2 text-[8px] text-slate-500 font-bold uppercase tracking-widest">
          SESSION: {sessionId}
        </div>
      </div>
    </div>
  );
});

Whiteboard.displayName = 'Whiteboard';

export default Whiteboard;
