import { memo, useState, useCallback, useEffect } from 'react';
import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { useWhiteboardSync } from '../../hooks/useWhiteboardSync';
import { setWhiteboardEditor, captureWhiteboard } from '../../utils/WhiteboardCapture';
import WhiteboardOverlay from '../../components/WhiteboardOverlay';
import { SimplifiedToolbar, simplifiedComponents } from '../../components/SimplifiedToolbar';
import { useHomeworkUpload } from '../../hooks/useHomeworkUpload';
import { useWhiteboardActions } from '../../hooks/useWhiteboardActions';
import { useLiveObservation } from '../../hooks/useLiveObservation';
import { useDraggable } from '../../hooks/useDraggable';

// V5.0: Smart Image Compression (Phase 18.5)
const MAX_IMAGE_SIZE = 1024 * 1024; // 1MB
const COMPRESSION_QUALITY = 0.7;

async function compressImage(file) {
    if (file.size <= MAX_IMAGE_SIZE) return file;
    
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxDim = 1600;
                let { width, height } = img;
                
                if (width > maxDim || height > maxDim) {
                    const ratio = Math.min(maxDim / width, maxDim / height);
                    width *= ratio;
                    height *= ratio;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                }, 'image/jpeg', COMPRESSION_QUALITY);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

const Whiteboard = memo(({ sessionId }) => {
  const [editor, setEditor] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [aiAction, setAiAction] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUploadToast, setShowUploadToast] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]); // V5.0: Multi-page queue

  // Hook for uploading to homework tray
  const { uploadFile } = useHomeworkUpload(sessionId);

  // Hook for AI drawing actions
  const { executeAction } = useWhiteboardActions();

  // Initialize sync when editor is ready
  const { isOnline } = useWhiteboardSync(editor, sessionId);

  // Initialize Live Tutor Observation (Auto-Scan)
  useLiveObservation(editor, isLiveMode);

  // Listen for AI whiteboard actions (from GeminiChat)
  useEffect(() => {
    const handleAIAction = (e) => {
      const action = e.detail;
      
      // Check if this is a persistent DRAW action
      if (action && (action.type?.startsWith('DRAW') || action.type === 'CLEAR')) {
        executeAction(editor, action);
      } else {
        // Fallback to ephemeral overlay
        setAiAction(action);
      }
    };

    const handleThinkingStart = () => {
        // Trigger a subtle 'thinking' state in the overlay
        setAiAction({ type: 'THINKING' });
    };

    const handleThinkingStop = () => {
        // Clear only if the current action is thinking
        setAiAction(prev => prev?.type === 'THINKING' ? null : prev);
    };

    window.addEventListener('ai-whiteboard-action', handleAIAction);
    window.addEventListener('ai-thinking-start', handleThinkingStart);
    window.addEventListener('ai-thinking-stop', handleThinkingStop);

    const handleStaple = (e) => {
        const { url, name } = e.detail;
        executeAction(editor, { type: 'STAPLE_IMAGE', url, name });
    };
    window.addEventListener('whiteboard-staple-image', handleStaple);

    return () => {
        window.removeEventListener('ai-whiteboard-action', handleAIAction);
        window.removeEventListener('ai-thinking-start', handleThinkingStart);
        window.removeEventListener('ai-thinking-stop', handleThinkingStop);
        window.removeEventListener('whiteboard-staple-image', handleStaple);
    };
  }, [editor, executeAction]);

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
        
        // ZERO-FRICTION INGESTION (Phase 17.3)
        // Convert file to base64 and send directly to AI for instant analysis
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          const base64 = readerEvent.target.result;
          window.dispatchEvent(new CustomEvent('ai-vision-upload', {
            detail: {
              image: base64,
              isAuto: false,
              context: "User just snapped a photo of their homework. Analyze and guide them."
            }
          }));
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Snap upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setIsProcessing(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleScanBoard = async () => {
    setIsProcessing(true);
    try {
        const imageData = await captureWhiteboard();
        if (imageData) {
            // Dispatch event for GeminiChat to pick up
            window.dispatchEvent(new CustomEvent('ai-vision-upload', { detail: imageData }));
        } else {
            alert("Canvas is empty! Draw something first.");
        }
    } catch (error) {
        console.error('Scan failed:', error);
    } finally {
        setIsProcessing(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setEditor(null);
      setIsReady(false);
    };
  }, []);

    const { 
        position: actionsPos, 
        dragHandlers: actionsHandlers, 
        style: actionsStyle 
    } = useDraggable({ x: 20, y: window.innerHeight - 100 });

    const { 
        position: livePos, 
        dragHandlers: liveHandlers, 
        style: liveStyle 
    } = useDraggable({ x: window.innerWidth - 180, y: 100 });


  return (
    <div className="w-full h-full bg-slate-900 relative overflow-hidden flex flex-col">
      {/* AI Visual Overlay */}
      <WhiteboardOverlay
        action={aiAction}
        editor={editor}
        onComplete={() => setAiAction(null)}
      />

      {/* Loading indicator while editor initializes */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-50">
          <div className="text-slate-400 text-sm animate-pulse">Loading whiteboard...</div>
        </div>
      )}

      {/* Offline Warning Banner */}
      {!isOnline && (
        <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-[10px] font-bold py-1 text-center z-[100] animate-pulse uppercase tracking-widest">
            ⚠️ OFFLINE MODE - Changes will sync when reconnected
        </div>
      )}

      {/* Tldraw Editor with Simplified UI */}
      <div className={`w-full h-full tldraw__editor transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'}`}>
        <Tldraw
          onMount={handleMount}
          components={simplifiedComponents}
          autoFocus
        >
          <SimplifiedToolbar />
        </Tldraw>
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

      {/* Action Buttons (Snap & Scan) - DRAGGABLE */}
      <div 
        {...actionsHandlers}
        style={actionsStyle}
        className="flex flex-col sm:flex-row gap-3 p-2 rounded-2xl hover:bg-black/20 transition-colors"
      >
        {/* SNAP HOMEWORK (Camera) */}
        <label className={`
            flex items-center gap-2 px-4 py-3 min-h-[48px] rounded-full font-bold shadow-lg transition-all cursor-pointer border border-white/10 select-none
            ${isProcessing ? 'bg-slate-800 text-slate-500 scale-95' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 hover:shadow-emerald-500/30 active:scale-95'}
          `}>
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleSnap} disabled={isProcessing} />
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm uppercase tracking-wide">Processing...</span>
            </>
          ) : (
            <>
              <span className="text-xl">📸</span>
              <span className="text-sm uppercase tracking-wide hidden sm:inline">Camera</span>
              <span className="text-sm uppercase tracking-wide sm:hidden">Cam</span>
            </>
          )}
        </label>

        {/* SCAN BOARD (Digital) */}
        <button 
            onClick={handleScanBoard}
            disabled={isProcessing}
            className={`
            flex items-center gap-2 px-4 py-3 min-h-[48px] rounded-full font-bold shadow-lg transition-all cursor-pointer border border-white/10 select-none
            ${isProcessing ? 'bg-slate-800 text-slate-500 scale-95' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-105 hover:shadow-blue-500/30 active:scale-95'}
          `}>
            {isProcessing ? (
                <span className="text-sm uppercase tracking-wide">Scanning...</span>
            ) : (
                <>
                <span className="text-xl">🧠</span>
                <span className="text-sm uppercase tracking-wide hidden sm:inline">AI Scan</span>
                <span className="text-sm uppercase tracking-wide sm:hidden">Scan</span>
                </>
            )}
        </button>
      </div>

      {/* Live Tutor Toggle - DRAGGABLE */}
      <div 
        {...liveHandlers}
        style={liveStyle}
      >
        <button
            onClick={() => setIsLiveMode(!isLiveMode)}
            className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all border border-white/10 shadow-lg flex items-center gap-2 select-none ${
                isLiveMode ? 'bg-red-600/90 text-white animate-pulse' : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'
            }`}
        >
            <span className={`w-2 h-2 rounded-full ${isLiveMode ? 'bg-white' : 'bg-slate-500'}`}></span>
            {isLiveMode ? 'LIVE TUTOR ACTIVE' : 'LIVE TUTOR OFF'}
        </button>
      </div>

      {/* Status Banner */}
      <div className="hidden md:flex absolute bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-sm border-t border-white/5 px-3 py-1.5 justify-between items-center z-20 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-purple-400 tracking-tighter">SYNC: FIREBASE REALTIME</span>
          <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor] transition-colors ${
              isOnline 
              ? 'bg-green-500 shadow-green-500 animate-pulse' 
              : 'bg-red-500 shadow-red-500'
          }`}></div>
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
