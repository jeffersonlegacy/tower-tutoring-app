import { useEditor, useValue, DefaultColorStyle } from '@tldraw/tldraw';
import { useDraggable } from '../hooks/useDraggable';

// Minimal color palette for tutoring
const COLORS = [
    { id: 'black', hex: '#1d1d1d', label: 'Black' },
    { id: 'blue', hex: '#4263eb', label: 'Blue' },
    { id: 'red', hex: '#e03131', label: 'Red' },
    { id: 'green', hex: '#099268', label: 'Green' },
    { id: 'orange', hex: '#f76707', label: 'Orange' },
    { id: 'violet', hex: '#ae3ec9', label: 'Violet' },
];

/**
 * SimplifiedToolbar - Minimal TLDraw toolbar for tutoring sessions
 * Only shows: Pencil, Eraser, Color Picker
 * Draggable on all devices
 */
export function SimplifiedToolbar() {
    const editor = useEditor();
    
    // Get current tool and color from editor state
    const currentTool = useValue('current tool', () => editor.getCurrentToolId(), [editor]);
    const currentColor = useValue('color', () => editor.getStyleForNextShape(DefaultColorStyle), [editor]);
    
    // Draggable positioning
    const { dragHandlers, style } = useDraggable({ 
        x: 20, 
        y: window.innerHeight / 2 - 100 
    });

    const setTool = (toolId) => {
        editor.setCurrentTool(toolId);
    };

    const setColor = (colorId) => {
        editor.setStyleForNextShapes(DefaultColorStyle, colorId);
        // Also update selected shapes if any
        editor.setStyleForSelectedShapes(DefaultColorStyle, colorId);
    };

    return (
        <div 
            {...dragHandlers}
            style={style}
            className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl flex flex-col gap-2 select-none z-[1000]"
        >
            {/* Drag Handle */}
            <div className="w-full h-1.5 bg-slate-700 rounded-full cursor-move mb-1 hover:bg-slate-600 transition" />
            
            {/* TOOLS */}
            <div className="flex flex-col gap-1.5">
                {/* Pencil/Draw */}
                <button
                    onClick={() => setTool('draw')}
                    className={`p-3 rounded-xl transition-all ${
                        currentTool === 'draw' 
                            ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' 
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                    title="Pencil"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </button>

                {/* Eraser */}
                <button
                    onClick={() => setTool('eraser')}
                    className={`p-3 rounded-xl transition-all ${
                        currentTool === 'eraser' 
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' 
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                    title="Eraser"
                >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.01 4.01 0 01-5.66 0L2.81 17c-.78-.78-.78-2.05 0-2.83l10.6-10.6c.79-.78 2.05-.78 2.83 0zM4.22 15.58l3.54 3.53c.78.78 2.05.78 2.83 0l2.12-2.12-6.36-6.36-2.12 2.12c-.78.78-.78 2.05 0 2.83z"/>
                    </svg>
                </button>

                {/* Select/Hand */}
                <button
                    onClick={() => setTool('select')}
                    className={`p-3 rounded-xl transition-all ${
                        currentTool === 'select' 
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                    title="Select/Move"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                </button>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-white/10 my-1" />

            {/* COLOR PICKER */}
            <div className="grid grid-cols-3 gap-1.5">
                {COLORS.map(color => (
                    <button
                        key={color.id}
                        onClick={() => setColor(color.id)}
                        className={`w-8 h-8 rounded-lg transition-all ${
                            currentColor === color.id 
                                ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' 
                                : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.label}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * TLDraw components override to hide default UI and use simplified toolbar
 */
export const simplifiedComponents = {
    // Hide default panels we don't need
    Toolbar: null,        // Hide main toolbar (we use SimplifiedToolbar)
    StylePanel: null,     // Hide style panel (colors in our toolbar)
    ActionsMenu: null,    // Hide actions menu
    MainMenu: null,       // Hide main menu
    PageMenu: null,       // Hide page menu
    NavigationPanel: null, // Hide navigation
    ZoomMenu: null,       // Hide zoom menu
    Minimap: null,        // Hide minimap
    DebugMenu: null,      // Hide debug menu
    DebugPanel: null,     // Hide debug panel
    HelpMenu: null,       // Hide help
    KeyboardShortcutsDialog: null, // Hide shortcuts dialog
    QuickActions: null,   // Hide quick actions
    
    // Keep only what we need
    ContextMenu: null,    // Can enable if needed for copy/paste
};
