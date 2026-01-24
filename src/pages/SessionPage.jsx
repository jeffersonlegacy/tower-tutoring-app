import { useState, useEffect, Suspense, lazy } from "react";
import { useParams } from "react-router-dom";
import { useHomeworkUpload } from "../hooks/useHomeworkUpload";
import HomeworkTray from "../features/session/HomeworkTray";
import MindHiveInterface from "../features/session/MindHiveInterface";

// Lazy load heavy components
const Whiteboard = lazy(() => import("../features/session/Whiteboard"));
const VideoChat = lazy(() => import("../features/session/VideoChat"));
const BrainBreak = lazy(() => import("../features/games/BrainBreak"));
const GeminiChat = lazy(() => import("../features/chat/GeminiChat"));
const MathTools = lazy(() => import("../features/tools/MathTools"));
const MathMind = lazy(() => import("../features/games/MathMind"));
const ProfileDashboard = lazy(() => import("../features/profile/ProfileDashboard"));

const ComponentLoader = () => (
    <div className="flex items-center justify-center h-full bg-slate-900/50">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
);

export default function Session() {
    const { sessionId } = useParams();
    const [maintenanceMode, setMaintenanceMode] = useState({ enabled: false, message: '' });
    const { uploadFile } = useHomeworkUpload(sessionId);
    const [isDragging, setIsDragging] = useState(false);
    const [sessionEnded, setSessionEnded] = useState(false);
    
    // Video Float State (Phase 14.2)
    const [isVideoFloating, setIsVideoFloating] = useState(false);

    // Sidebar Mode: 'homework' | 'mathcamp' | 'ai' | 'arcade' | 'tools' | 'profile'
    const [sidebarMode, setSidebarMode] = useState('homework');

    // Main Tab Mode (Mobile Only): 'board' | 'sidebar'
    const [mainTab, setMainTab] = useState('sidebar');

    useEffect(() => {
        const fetchConfig = async () => {
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
            {/* We render this ONCE and toggle its visibility/positioning via CSS to prevent iframe reloads */}
            <div 
                className={`fixed z-[60] transition-all duration-500 ease-in-out bg-black border-2 border-slate-700/50 shadow-2xl overflow-hidden rounded-2xl
                    ${isVideoFloating 
                        ? 'top-4 right-4 w-[280px] h-[200px] opacity-100' 
                        : 'hidden md:block md:static md:w-full md:h-[320px] md:opacity-100 md:rounded-none md:border-0 md:border-b md:border-slate-700'
                    }`}
            >
                <Suspense fallback={<ComponentLoader />}>
                    <VideoChat 
                        sessionId={sessionId} 
                        onTogglePiP={() => setIsVideoFloating(!isVideoFloating)} 
                        isFloating={isVideoFloating}
                    />
                </Suspense>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative">

                {/* Sidebar (Video + Tools) */}
                <div className={`flex-none w-full md:w-[300px] lg:w-[350px] border-b md:border-b-0 md:border-r border-slate-700 bg-black flex flex-col relative z-20 shrink-0 h-full ${mainTab === 'sidebar' ? 'flex' : 'hidden md:flex'}`}>

                    {/* TOP VIDEO AREA (MOVED TO GLOBAL STITCHING) */}
                    {/* Note: In V4.0, the video is rendered globally above to ensure persistence. 
                        We keep this space as a placeholder if needed or let the global div occupy this slot. */}

                    {/* Sidebar Tabs (Local) */}
                    <div className="flex items-center bg-slate-900 border-b border-slate-700 shrink-0">
                        <button
                            onClick={() => setSidebarMode('homework')}
                            className={`flex-1 p-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${sidebarMode === 'homework' ? 'text-white bg-slate-800 border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Upload
                        </button>
                        <button
                            onClick={() => setSidebarMode('ai')}
                            className={`flex-1 p-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${sidebarMode === 'ai' ? 'text-white bg-slate-800 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            AI Tutor
                        </button>
                        <button
                            onClick={() => setSidebarMode('mathcamp')}
                            className={`flex-1 p-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${sidebarMode === 'mathcamp' ? 'text-white bg-slate-800 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Math Camp
                        </button>
                        <button
                            onClick={() => setSidebarMode('arcade')}
                            className={`flex-1 p-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${sidebarMode === 'arcade' ? 'text-white bg-slate-800 border-b-2 border-pink-500' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Games
                        </button>
                        <button
                            onClick={() => setSidebarMode('tools')}
                            className={`flex-1 p-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${sidebarMode === 'tools' ? 'text-white bg-slate-800 border-b-2 border-orange-500' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Tools
                        </button>
                        <button
                            onClick={() => setSidebarMode('profile')}
                            className={`flex-1 p-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${sidebarMode === 'profile' ? 'text-white bg-slate-800 border-b-2 border-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Profile
                        </button>
                    </div>

                    {/* End Session Button */}
                    <div className="p-2 border-b border-slate-700 bg-slate-900 flex justify-center">
                        <button
                            onClick={() => setSessionEnded(true)}
                            className="w-full py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/50 rounded text-xs font-bold uppercase tracking-widest transition-all"
                        >
                            End Session
                        </button>
                    </div>

                    {/* Bottom: Sidebar Content */}
                    <div className="flex-1 overflow-hidden relative bg-slate-900/20">
                        {sidebarMode === 'homework' && (
                            <HomeworkTray sessionId={sessionId} />
                        )}
                        <Suspense fallback={<ComponentLoader />}>
                            {sidebarMode === 'ai' && (
                                <GeminiChat sessionId={sessionId} mode="fullscreen" />
                            )}
                            {sidebarMode === 'mathcamp' && (
                                <MathMind onBack={() => setSidebarMode('homework')} />
                            )}
                            {sidebarMode === 'arcade' && (
                                <BrainBreak sessionId={sessionId} onClose={() => setSidebarMode('homework')} />
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
