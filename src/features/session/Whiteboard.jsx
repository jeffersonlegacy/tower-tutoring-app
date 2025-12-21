import React, { useRef, useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

export default function Whiteboard({ sessionId }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);

  // Store all strokes: { id, points: [{x, y}], color, size }
  const strokesRef = useRef({});
  // To debounce writes or handle local drawing immediately
  const userId = useRef('user_' + Math.random().toString(36).substr(2, 9)).current;

  useEffect(() => {
    if (!sessionId) return;

    // Resize observer to handle window resizing
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        // Save image data to restore after resize (optional, but good UX)
        // const ctx = canvas.getContext('2d');
        // const activeImage = ctx.getImageData(0,0, canvas.width, canvas.height);

        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;

        // Redraw all strokes after resize
        drawAllStrokes();
      }
    };

    window.addEventListener('resize', resizeCanvas);
    // Initial size
    setTimeout(resizeCanvas, 100);

    // SYNC: Listen for strokes
    const unsubscribe = onSnapshot(collection(db, 'whiteboards', sessionId, 'drawings'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        if (change.type === 'added' || change.type === 'modified') {
          strokesRef.current[change.doc.id] = data;
        } else if (change.type === 'removed') {
          delete strokesRef.current[change.doc.id];
        }
      });
      drawAllStrokes();
    });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      unsubscribe();
    };
  }, [sessionId]);

  const drawAllStrokes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    Object.values(strokesRef.current).forEach(stroke => {
      if (!stroke.points || stroke.points.length < 1) return;
      drawStroke(ctx, stroke.points, stroke.color, stroke.size);
    });
  };

  const drawStroke = (ctx, points, strokeColor, strokeSize) => {
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeSize;
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  };

  // --- Interaction Handlers ---

  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    // Handle both mouse and touch
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault(); // Prevent scrolling on touch
    setIsDrawing(true);
    const coords = getCoords(e);
    setCurrentStroke([coords]);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();

    const coords = getCoords(e);
    const newStroke = [...currentStroke, coords];
    setCurrentStroke(newStroke);

    // Feedback: Draw locally immediately
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;

    // Draw just the last segment to be fast
    if (currentStroke.length > 0) {
      const last = currentStroke[currentStroke.length - 1];
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const stopDrawing = async () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStroke.length > 1) {
      // Save to Firestore
      const strokeId = `${Date.now()}_${userId}`;
      const strokeData = {
        points: currentStroke,
        color,
        size: brushSize,
        userId,
        timestamp: Date.now()
      };

      // Optimistic update
      strokesRef.current[strokeId] = strokeData;
      drawAllStrokes();

      try {
        await setDoc(doc(db, 'whiteboards', sessionId, 'drawings', strokeId), strokeData);
      } catch (error) {
        console.error("Error saving stroke:", error);
      }
    }
  };

  const clearBoard = async () => {
    if (!window.confirm("Clear the entire board?")) return;

    // Clear local immediate
    strokesRef.current = {};
    drawAllStrokes();

    // Clear Firestore (Batch delete for efficiency)
    // Note: For very large boards, might need recursive delete, but batch limit is 500
    // We'll just delete the collection via individual deletes for simplicity or a cloud function (but we only have client SDK here)
    // Let's iterate the refs we know about.
    const batch = writeBatch(db);
    const strokes = await collection(db, 'whiteboards', sessionId, 'drawings');
    // Ideally we query, but leveraging our local subscribed cache is faster for "What needs deleting"
    // Actually, better to fetch IDs to be sure.
    // For MVP: JUST DELETE THE KNOWN STROKES
    // (A more robust way deletes the whole subcollection)

    // Wait, 'delete collection' from client is hard. 
    // We will just create a 'clear' event or delete known docs.
    // New approach: "Clear" just pushes a special 'clear' action? 
    // Or simpler: Just iterate local/known keys and delete them.

    // Let's just create a new 'version' of the whiteboard effectively clearing it?
    // No, let's delete docs.
    const knownIds = Object.keys(strokesRef.current);
    knownIds.forEach(id => {
      deleteDoc(doc(db, 'whiteboards', sessionId, 'drawings', id)).catch(e => console.error(e));
    });
  };

  return (
    <div className="w-full h-full bg-slate-50 relative overflow-hidden flex flex-col font-mono text-slate-800 select-none">

      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur border border-slate-200 shadow-xl rounded-full px-4 py-2 flex items-center gap-4 z-10 transition-all hover:bg-white">

        {/* Colors */}
        <div className="flex gap-1">
          {['#000000', '#EF4444', '#22C55E', '#3B82F6', '#F59E0B'].map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-slate-800 scale-110 ring-1 ring-slate-300' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-slate-200" />

        {/* Pens / Eraser */}
        <div className="flex gap-2">
          <button
            onClick={() => { setColor('#000000'); setBrushSize(3) }}
            className={`p-1 rounded hover:bg-slate-100 ${color !== '#FFFFFF' && brushSize === 3 ? 'text-blue-600 bg-blue-50' : 'text-slate-500'}`}
            title="Pen"
          >
            ✏️
          </button>
          <button
            onClick={() => { setColor('#000000'); setBrushSize(6) }}
            className={`p-1 rounded hover:bg-slate-100 ${color !== '#FFFFFF' && brushSize === 6 ? 'text-blue-600 bg-blue-50' : 'text-slate-500'}`}
            title="Marker"
          >
            🖊️
          </button>
          <button
            onClick={() => { setColor('#F8FAFC'); setBrushSize(20) }} // Use bg color for eraser
            className={`p-1 rounded hover:bg-slate-100 ${color === '#F8FAFC' ? 'text-blue-600 bg-blue-50' : 'text-slate-500'}`}
            title="Eraser"
          >
            🧹
          </button>
        </div>

        <div className="w-px h-6 bg-slate-200" />

        <button
          onClick={clearBoard}
          className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors uppercase tracking-wider"
        >
          Clear
        </button>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="w-full h-full cursor-crosshair touch-none"
      />

      <div className="absolute bottom-2 right-2 text-[10px] text-slate-400 font-mono pointer-events-none">
        SYNC ACTIVE • {Object.keys(strokesRef.current).length} OBJS
      </div>
    </div>
  );
}
