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

    // Sidebar Mode: 'homework' | 'mathcamp' | 'ai' | 'arcade' | 'tools'
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

            {/* Mobile Tab Switcher (Visible only on small screens) */}
            {/* Hiding this when on 'board' to give full screen real estate, accessible via a small floating toggle instead */}
            <div className={`md:hidden flex items-center bg-slate-800 border-b border-slate-700 shrink-0 z-30 ${mainTab === 'board' ? 'hidden' : 'flex'}`}>
                <button
                    onClick={() => setMainTab('board')}
                    className={`flex-1 p-3 text-sm font-bold uppercase tracking-widest transition-all ${mainTab === 'board' ? 'text-blue-400 bg-slate-900 border-b-2 border-blue-500' : 'text-slate-500'}`}
                >
                    Whiteboard
                </button>
                <button
                    onClick={() => setMainTab('sidebar')}
                    className={`flex-1 p-3 text-sm font-bold uppercase tracking-widest transition-all ${mainTab === 'sidebar' ? 'text-purple-400 bg-slate-900 border-b-2 border-purple-500' : 'text-slate-500'}`}
                >
                    Backpack
                </button>
            </div>

            {/* Floating Mobile Toggle for full-screen board - More prominent */}
            {mainTab === 'board' && (
                <button
                    onClick={() => setMainTab('sidebar')}
                    className="md:hidden absolute top-4 right-4 z-40 bg-slate-900/90 text-white px-3 py-2 rounded-full backdrop-blur-md border border-white/20 shadow-lg flex items-center gap-2 active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    <span className="text-xs font-bold uppercase tracking-wide">Menu</span>
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

            {/* GLOBAL VIDEO OVERLAY (Phase 14.2) */}
            {isVideoFloating && (
                <div className="absolute top-4 right-4 z-[60] w-[280px] h-[200px] rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/50 bg-black animate-in fade-in zoom-in-95 duration-300">
                     <Suspense fallback={<ComponentLoader />}>
                        <VideoChat 
                            sessionId={sessionId} 
                            onTogglePiP={() => setIsVideoFloating(false)} 
                            isFloating={true}
                        />
                    </Suspense>
                    {/* Handlers for dragging could go here later */}
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative">

                {/* Sidebar (Video + Tools) */}
                <div className={`flex-none w-full md:w-[300px] lg:w-[350px] border-b md:border-b-0 md:border-r border-slate-700 bg-black flex flex-col relative z-20 shrink-0 h-full ${mainTab === 'sidebar' ? 'flex' : 'hidden md:flex'}`}>

                    {/* Top: Video (Adaptive Height) - DOCKED MODE */}
                    {!isVideoFloating && (
                        <div className="h-[220px] md:h-[320px] shrink-0 border-b border-slate-700 bg-slate-900/50">
                            <Suspense fallback={<ComponentLoader />}>
                                <VideoChat 
                                    sessionId={sessionId} 
                                    onTogglePiP={() => setIsVideoFloating(true)} 
                                    isFloating={false}
                                />
                            </Suspense>
                        </div>
                    )}

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
