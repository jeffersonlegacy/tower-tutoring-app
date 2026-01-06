import { memo, useState, useCallback } from 'react';
import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { useWhiteboardSync } from '../../hooks/useWhiteboardSync';

const Whiteboard = memo(({ sessionId }) => {
  // We need a way to pass the editor instance to the sync hook
  const [editor, setEditor] = useState(null);

  // Initialize Sync when editor is ready
  useWhiteboardSync(editor, sessionId);

  const handleMount = useCallback((editorInstance) => {
    setEditor(editorInstance);
  }, []);

  return (
    <div className="w-full h-full bg-slate-900 relative overflow-hidden flex flex-col">
      <div className="w-full h-full tldraw__editor">
        <Tldraw
          onMount={handleMount}
          hideUi={false}
          autoFocus
        />
      </div>

      {/* Contextual Banner */}
      <div className="hidden md:flex absolute bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-sm border-t border-white/5 px-3 py-1.5 justify-between items-center z-20 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-purple-400 tracking-tighter">ENGINE: TLDRAWSYNC v1.0</span>
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_5px_#a855f7] animate-pulse"></div>
        </div>
        <div className="flex items-center gap-2 text-[8px] text-slate-500 font-bold uppercase tracking-widest">
          ID: {sessionId}
        </div>
      </div>
    </div>
  );
});

export default Whiteboard;
