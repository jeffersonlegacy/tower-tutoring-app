import { useState, useEffect, useRef, Suspense, lazy } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { 
    Upload, 
    Bot, 
    Calculator, 
    Gamepad2, 
    UserCircle, 
    Tent, 
    LogOut,
    Menu,
    X,
    Video
} from "lucide-react";
import { useHomeworkUpload } from "../hooks/useHomeworkUpload";
import { useMastery } from "../context/MasteryContext";
import HomeworkTray from "../features/session/HomeworkTray";
import MindHiveInterface from "../features/session/MindHiveInterface";

// Lazy load heavy components
const Whiteboard = lazy(() => import("../features/session/Whiteboard"));
const VideoChat = lazy(() => import("../features/session/VideoChat"));
const BrainBreak = lazy(() => import("../features/games/BrainBreak"));
const GeminiChat = lazy(() => import("../features/chat/GeminiChat"));
const MathTools = lazy(() => import("../features/tools/MathTools"));
const SessionMathCampOverlay = lazy(() => import("../features/session/SessionMathCampOverlay"));
const PathEngine = lazy(() => import("../features/session/PathEngine"));

const ProfileDashboard = lazy(() => import("../features/profile/ProfileDashboard"));

const ComponentLoader = () => (
    <div className="flex items-center justify-center h-full bg-slate-900/50">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
);

export default function Session() {
    const { sessionId } = useParams();
    // [NEW] Read Adaptive Mode
    const [searchParams] = useSearchParams();
    const sessionMode = searchParams.get('mode') || 'standard'; // 'visualize', 'train', 'guide'

    const [maintenanceMode, setMaintenanceMode] = useState({ enabled: false, message: '' });
    const { uploadFile } = useHomeworkUpload(sessionId);
    const { curriculum } = useMastery();
    const [isDragging, setIsDragging] = useState(false);
    const [sessionEnded, setSessionEnded] = useState(false);

    // [NEW] Path Mode Resolution
    const isPathMode = ['visualize', 'guide', 'train'].includes(sessionMode);
    const activeNode = (curriculum?.nodes && sessionId) 
        ? (curriculum.nodes[sessionId] || curriculum.nodes[curriculum.rootNodeId]) 
        : (curriculum?.nodes ? curriculum.nodes[curriculum.rootNodeId] : null);
    
    // Video Float State (Phase 14.2)
    const [isVideoFloating, setIsVideoFloating] = useState(false);

    // Sidebar Mode - Auto-open AI if in 'guide' or 'visualize' mode
    const [sidebarMode, setSidebarMode] = useState(() => {
        if (['visualize', 'guide'].includes(sessionMode)) return 'ai';
        return 'homework';
    });

    // Main Tab Mode (Mobile Only): 'board' | 'sidebar'
    const [mainTab, setMainTab] = useState('sidebar');

    useEffect(() => {
        // [NEW] Announce Mode Start
        if (sessionMode !== 'standard') {
            console.log(`[ToweR Nexus] Session started in ${sessionMode.toUpperCase()} mode.`);
            // In a real app, we'd trigger a specific AI greeting here
        }
    }, [sessionMode]);

    useEffect(() => {
        const fetchConfig = async () => {
            // ... (keep existing config fetch logic)
            // In local dev (Vite), /api/config is not routed to a function, so we skip it.
            // This prevents "SyntaxError: Unexpected token 'i'" from fetching JS source.
            if (import.meta.env.DEV) {
                console.log("Dev Mode: Skipping /api/config fetch (using defaults)");
                return;
            }

            try {
                const response = await fetch('/api/config');
                // Ensure we got a valid JSON response before parsing
                const contentType = response.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    throw new Error(`Invalid content-type: ${contentType}`);
                }

                const config = await response.json();
                if (config.maintenanceMode) {
                    setMaintenanceMode(config.maintenanceMode);
                }
            } catch (error) {
                console.warn('Config Fetch Skipped:', error.message);
            }
        };

        fetchConfig();
    }, []);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            await uploadFile(files[0]);
        }
    };

    // Drag Logic (Video Widget)
    const [position, setPosition] = useState({ x: 20, y: 80 }); // Initial position
    const [isDraggingVideo, setIsDraggingVideo] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    const handleDragStart = (e) => {
        // Only trigger if floating
        if (!isVideoFloating) return;
        
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        
        // Calculate offset from top-left of the element
        const rect = e.currentTarget.getBoundingClientRect();
        dragOffset.current = {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
        setIsDraggingVideo(true);
    };

    const handleDragMove = (e) => {
        if (!isDraggingVideo) return;
        
        const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
        const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
        
        // Prevent default only if necessary (e.g. scrolling on mobile)
        // e.preventDefault(); 
        
        setPosition({
            x: clientX - dragOffset.current.x,
            y: clientY - dragOffset.current.y
        });
    };

    const handleDragEnd = () => setIsDraggingVideo(false);

    useEffect(() => {
        if (isDraggingVideo) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchmove', handleDragMove, { passive: false });
            window.addEventListener('touchend', handleDragEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDraggingVideo]);

    return (
        <div
            className="flex flex-col h-full overflow-hidden relative bg-slate-900"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* End Session Interface Overlay */}
            {sessionEnded && (
                <MindHiveInterface onHome={() => window.location.href = '/'} />
            )}

            {/* [NEW] Path Engine Overlay (Full Screen Experience) */}
            {isPathMode && (
                <div className="absolute inset-0 z-[10] bg-slate-950">
                    <Suspense fallback={<ComponentLoader />}>
                        <PathEngine 
                            node={activeNode} 
                            mode={sessionMode} 
                            onComplete={() => setSessionEnded(true)}
                            onBack={() => window.history.back()}
                        />
                    </Suspense>
                </div>
            )}

            {/* Mobile Tab Switcher */}
            <div className={`md:hidden flex items-center bg-[#0f172a] border-b border-white/5 shrink-0 z-30 ${mainTab === 'board' ? 'hidden' : 'flex'}`}>
                <button
                    onClick={() => setMainTab('board')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${mainTab === 'board' ? 'text-cyan-400 bg-slate-900 border-b-2 border-cyan-500' : 'text-slate-500'}`}
                >
                    Board
                </button>
                <button
                    onClick={() => {
                        setMainTab('sidebar');
                        setSidebarMode('ai');
                    }}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${mainTab === 'sidebar' && sidebarMode === 'ai' ? 'text-indigo-400 bg-slate-900 border-b-2 border-indigo-500' : 'text-slate-500'}`}
                >
                    AI Tutor
                </button>
                <button
                    onClick={() => {
                        setMainTab('sidebar');
                        // Stay on current sidebar mode if it's not AI, or default to homework
                        if (sidebarMode === 'ai') setSidebarMode('homework');
                    }}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${mainTab === 'sidebar' && sidebarMode !== 'ai' ? 'text-purple-400 bg-slate-900 border-b-2 border-purple-500' : 'text-slate-500'}`}
                >
                    Backpack
                </button>
                <button
                    onClick={() => setIsVideoFloating(prev => !prev)}
                    className={`flex-none px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${isVideoFloating ? 'text-emerald-400 bg-slate-900 border-b-2 border-emerald-500' : 'text-slate-500'}`}
                >
                    <Video size={16} />
                </button>
            </div>

            {/* Floating Mobile Toggle for full-screen board */}
            {mainTab === 'board' && (
                <button
                    onClick={() => setMainTab('sidebar')}
                    className="md:hidden absolute top-4 right-4 z-40 bg-slate-900/90 text-white px-4 py-2 rounded-full backdrop-blur-md border border-white/20 shadow-2xl flex items-center gap-2 active:scale-95 animate-in slide-in-from-top-2"
                >
                   <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse delay-75"></div>
                   </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Menu</span>
                </button>
            )}

            {/* Drag Overlay */}
            {isDragging && (
                <div className="absolute inset-0 bg-indigo-500/20 z-50 flex items-center justify-center backdrop-blur-sm pointer-events-none border-4 border-indigo-500 border-dashed m-4 rounded-xl">
                    <div className="text-white text-2xl font-bold bg-slate-900/80 px-8 py-4 rounded-xl shadow-2xl animate-bounce">
                        📂 Drop file to Upload to Tray
                    </div>
                </div>
            )}

            {/* Maintenance Mode Banner */}
            {maintenanceMode.enabled && (
                <div className="bg-red-600 text-white text-center p-3 font-bold z-50">
                    ⚠️ {maintenanceMode.message || 'Maintenance in progress. Some features may be unavailable.'}
                </div>
            )}

            {/* GLOBAL STAPLE VIDEO (Phase 17.1) */}
            {/* Draggable & Floating */}
            <div 
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                style={isVideoFloating ? { 
                    position: 'fixed', 
                    left: `${position.x}px`, 
                    top: `${position.y}px`,
                    width: window.innerWidth < 768 ? '160px' : '320px',
                    height: window.innerWidth < 768 ? '120px' : '240px',
                    zIndex: 100,
                    cursor: isDraggingVideo ? 'grabbing' : 'grab',
                    touchAction: 'none'
                } : {}}
                className={`transition-all duration-200 ease-out bg-black border-2 border-slate-700/50 shadow-2xl overflow-hidden rounded-2xl
                    ${isVideoFloating 
                        ? 'opacity-100 ring-2 ring-cyan-500/50' 
                        : 'hidden md:flex md:justify-center md:items-center md:static md:w-full md:h-[320px] md:opacity-100 md:rounded-none md:border-0 md:border-b md:border-slate-700 z-[60]'
                    }`}
            >
                <div className={`absolute top-0 left-0 right-0 h-6 bg-white/5 z-10 ${isVideoFloating ? 'block' : 'hidden'}`} title="Drag to move" />
                
                {/* Inner Constraint for Banner Mode */}
                <div className="w-full h-full">
                    <Suspense fallback={<ComponentLoader />}>
                        <VideoChat 
                            sessionId={sessionId} 
                            onTogglePiP={() => setIsVideoFloating(!isVideoFloating)} 
                            isFloating={isVideoFloating}
                        />
                    </Suspense>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative">

                {/* Sidebar (Command Rail + Panel) */}
                <div className={`flex-none w-full md:w-[350px] lg:w-[400px] border-b md:border-b-0 md:border-r border-slate-700 bg-black flex relative z-20 shrink-0 h-full ${mainTab === 'sidebar' ? 'flex' : 'hidden md:flex'}`}>

                    {/* 1. COMMAND RAIL (Left Slim Bar) */}
                    <div className="w-[64px] bg-slate-950 border-r border-white/5 flex flex-col items-center py-4 gap-4 shrink-0 z-30">
                        {/* Top Tools */}
                        <div className="flex flex-col gap-4">
                            <RailButton 
                                icon={<Upload size={20} />} 
                                active={sidebarMode === 'homework'} 
                                onClick={() => setSidebarMode('homework')} 
                                label="Upload"
                            />
                            <RailButton 
                                icon={<Bot size={20} />} 
                                active={sidebarMode === 'ai'} 
                                onClick={() => setSidebarMode('ai')} 
                                label="AI Tutor"
                            />
                            <RailButton 
                                icon={<Calculator size={20} />} 
                                active={sidebarMode === 'tools'} 
                                onClick={() => setSidebarMode('tools')} 
                                label="Tools"
                            />
                            
                            <div className="w-8 h-[1px] bg-white/10 mx-auto"></div>

                            {/* VIDEO TOGGLE */}
                            <RailButton 
                                icon={<Video size={20} />} 
                                active={isVideoFloating} 
                                onClick={() => setIsVideoFloating(prev => !prev)} 
                                label={isVideoFloating ? "Dock Cam" : "Float Cam"}
                                color={isVideoFloating ? "emerald" : "cyan"}
                            />
                        </div>

                        {/* Spacer */}
                        <div className="flex-1"></div>

                        {/* Bottom Tools */}
                        <div className="flex flex-col gap-4">
                            <div className="w-8 h-[1px] bg-white/10 mx-auto"></div>
                            
                            <RailButton 
                                icon={
                                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" stroke="none">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4 1.79 4 4-1.79 4-4 4-4-1.79-4-4-1.79-4-4-4zm0 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                                    </svg>
                                } 
                                active={sidebarMode === 'mathcamp'} 
                                onClick={() => setSidebarMode('mathcamp')} 
                                label="Math Nexus"
                                color="emerald"
                            />
                            <RailButton 
                                icon={<Gamepad2 size={20} />} 
                                active={sidebarMode === 'arcade'} 
                                onClick={() => setSidebarMode('arcade')} 
                                label="Arcade"
                                color="pink"
                            />
                            <RailButton 
                                icon={<UserCircle size={20} />} 
                                active={sidebarMode === 'profile'} 
                                onClick={() => setSidebarMode('profile')} 
                                label="Profile"
                                color="blue"
                            />
                            
                            <div className="w-8 h-[1px] bg-white/10 mx-auto"></div>

                            <button 
                                onClick={() => setSessionEnded(true)}
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                                title="End Session"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>

                    {/* 2. CONTENT PANEL (Right Drawer) */}
                    <div className="flex-1 bg-slate-900/50 backdrop-blur relative overflow-hidden flex flex-col">
                        {/* Header for Panel */}
                        <div className="h-[52px] border-b border-white/5 flex items-center px-4 bg-slate-900/80 sticky top-0 z-10">
                            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                {sidebarMode === 'homework' && <><Upload size={16}/> Uploads</>}
                                {sidebarMode === 'ai' && <><Bot size={16}/> AI Tutor</>}
                                {sidebarMode === 'mathcamp' && <><span className="text-xl">☯</span> Math Nexus</>}
                                {sidebarMode === 'tools' && <><Calculator size={16}/> Toolkit</>}
                                {sidebarMode === 'arcade' && <><Gamepad2 size={16}/> Arcade</>}
                                {sidebarMode === 'profile' && <><UserCircle size={16}/> Profile</>}
                            </h2>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto relative">
                             {sidebarMode === 'homework' && (
                                <HomeworkTray sessionId={sessionId} />
                            )}
                            <Suspense fallback={<ComponentLoader />}>
                                {sidebarMode === 'ai' && (
                                    <GeminiChat sessionId={sessionId} mode="fullscreen" sessionMode={sessionMode} />
                                )}

                                {sidebarMode === 'mathcamp' && (
                                    <SessionMathCampOverlay onClose={() => setSidebarMode('homework')} />
                                )}

                                {sidebarMode === 'tools' && (
                                    <MathTools />
                                )}
                                {sidebarMode === 'profile' && (
                                    <ProfileDashboard />
                                )}
                            </Suspense>
                        </div>
                    </div>
                </div>

                {/* [MOVED] BrainBreak Overlay (Full Screen) */}
                {sidebarMode === 'arcade' && (
                    <div className="absolute inset-0 z-50 bg-slate-950">
                        <Suspense fallback={<ComponentLoader />}>
                            <BrainBreak sessionId={sessionId} onBack={() => setSidebarMode('homework')} />
                        </Suspense>
                    </div>
                )}

                {/* Main Stage: Whiteboard (Right/Bottom) */}
                <div className={`flex-1 bg-slate-200 relative overflow-hidden h-full ${mainTab === 'board' ? 'block' : 'hidden md:block'}`}>
                    <Suspense fallback={<ComponentLoader />}>
                        <Whiteboard sessionId={sessionId} />
                    </Suspense>
                </div>

            </div>

        </div>
    );
}

// Helper Component for Rail Buttons
function RailButton({ icon, active, onClick, label, color = 'cyan' }) {
    const activeColors = {
        cyan: 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-500',
        pink: 'bg-pink-500/20 text-pink-400 border-l-2 border-pink-500',
        blue: 'bg-blue-500/20 text-blue-400 border-l-2 border-blue-500', 
        emerald: 'bg-emerald-500/20 text-emerald-400 border-l-2 border-emerald-500'
    };

    return (
        <button
            onClick={onClick}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all group relative
                ${active 
                    ? activeColors[color] || activeColors.cyan
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
        >
            {icon}
            
            {/* Tooltip */}
            <div className="absolute left-14 bg-slate-800 text-white text-[10px] font-bold uppercase px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl border border-white/10">
                {label}
            </div>
        </button>
    );
}
