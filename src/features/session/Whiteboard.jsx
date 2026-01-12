import { memo, useState, useCallback, useEffect } from 'react';
import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { useWhiteboardSync } from '../../hooks/useWhiteboardSync';
import { setWhiteboardEditor } from '../../utils/WhiteboardCapture';
import WhiteboardOverlay from '../../components/WhiteboardOverlay';
import { useHomeworkUpload } from '../../hooks/useHomeworkUpload';

const Whiteboard = memo(({ sessionId }) => {
  const [editor, setEditor] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [aiAction, setAiAction] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUploadToast, setShowUploadToast] = useState(false);

  // Hook for uploading to homework tray
  const { uploadFile } = useHomeworkUpload(sessionId);

  // Initialize sync when editor is ready
  useWhiteboardSync(editor, sessionId);

  // Listen for AI whiteboard actions (from GeminiChat)
  useEffect(() => {
    const handleAIAction = (e) => {
      setAiAction(e.detail);
    };

    window.addEventListener('ai-whiteboard-action', handleAIAction);
    return () => window.removeEventListener('ai-whiteboard-action', handleAIAction);
  }, []);

  const handleMount = useCallback((editorInstance) => {
    console.log('[Whiteboard] Editor mounted for session:', sessionId);
    setEditor(editorInstance);
    setWhiteboardEditor(editorInstance);
    setTimeout(() => setIsReady(true), 100);
  }, [sessionId]);

  const handleSnap = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      // Upload directly to homework tray (Firebase)
      const success = await uploadFile(file);

      if (success) {
        // Show toast notification
        setShowUploadToast(true);
        setTimeout(() => setShowUploadToast(false), 4000);
      }
    } catch (err) {
      console.error('Snap upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setIsProcessing(false);
      e.target.value = ''; // Reset input
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setEditor(null);
      setIsReady(false);
    };
  }, []);

  return (
    <div className="w-full h-full bg-slate-900 relative overflow-hidden flex flex-col">
      {/* AI Visual Overlay */}
      <WhiteboardOverlay
        action={aiAction}
        onComplete={() => setAiAction(null)}
      />

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

      {/* Upload Success Toast */}
      {showUploadToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 border border-emerald-400/30">
            <span className="text-xl">✅</span>
            <div>
              <div className="font-bold text-sm">Photo Uploaded!</div>
              <div className="text-xs text-emerald-100">Tap ← Menu → Upload to view</div>
            </div>
          </div>
        </div>
      )}

      {/* Snap-to-Solve Button (Bottom-right on mobile to avoid tldraw toolbar at bottom-left and nav toggle at top-right) */}
      <div className="absolute bottom-20 right-4 sm:bottom-4 sm:left-4 sm:right-auto z-50">
        <label className={`
            flex items-center gap-2 px-4 py-3 min-h-[48px] rounded-full font-bold shadow-lg transition-all cursor-pointer border border-white/10
            ${isProcessing ? 'bg-slate-800 text-slate-500 scale-95' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 hover:shadow-emerald-500/30 active:scale-95'}
          `}>
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleSnap} disabled={isProcessing} />
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm uppercase tracking-wide">Scanning...</span>
            </>
          ) : (
            <>
              <span className="text-2xl">📸</span>
              <span className="text-sm uppercase tracking-wide hidden sm:inline">Snap Homework</span>
              <span className="text-sm uppercase tracking-wide sm:hidden">Snap</span>
            </>
          )}
        </label>
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
