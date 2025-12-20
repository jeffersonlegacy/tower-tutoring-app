import React, { useState, useEffect } from "react";
import Whiteboard from "../features/session/Whiteboard";
import VideoChat from "../features/session/VideoChat";
import HomeworkTray from "../features/session/HomeworkTray";
import { useParams } from "react-router-dom";
import { useHomeworkUpload } from "../hooks/useHomeworkUpload";
import BrainBreak from "../features/games/BrainBreak";
import GeminiChat from "../features/chat/GeminiChat"; // We might need to embed this or use a simplified version
import Calculator from "../features/tools/Calculator"; // Same

export default function Session() {
    const { sessionId } = useParams();
    const [maintenanceMode, setMaintenanceMode] = useState({ enabled: false, message: '' });
    const { uploadFile, uploading } = useHomeworkUpload(sessionId);
    const [isDragging, setIsDragging] = useState(false);

    // Sidebar Mode: 'homework' | 'arcade' | 'ai' | 'tools'
    const [sidebarMode, setSidebarMode] = useState('homework');

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
            className="flex flex-col h-full overflow-hidden relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
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

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative">

                {/* Sidebar (Video + Homework) - Optimized for Mobile visibility */}
                <div className="flex-none order-1 w-full md:w-[300px] lg:w-[350px] border-b md:border-b-0 md:border-r border-slate-700 bg-black flex flex-col relative z-20 shrink-0 h-[50vh] md:h-full">

                    {/* Top: Video (Adaptive Height) */}
                    <div className="h-[180px] md:h-[250px] shrink-0 border-b border-slate-700 transition-all duration-300">
                        <VideoChat sessionId={sessionId} />
                    </div>

                    {/* Sidebar Tabs */}
                    <div className="flex items-center bg-slate-900 border-b border-slate-700 shrink-0">
                        <button
                            onClick={() => setSidebarMode('homework')}
                            className={`flex-1 p-2 text-xs font-bold uppercase tracking-wider transition-colors ${sidebarMode === 'homework' ? 'text-white bg-slate-800 border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Files
                        </button>
                        <button
                            onClick={() => setSidebarMode('arcade')}
                            className={`flex-1 p-2 text-xs font-bold uppercase tracking-wider transition-colors ${sidebarMode === 'arcade' ? 'text-white bg-slate-800 border-b-2 border-pink-500' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Arcade
                        </button>
                        {/* We can add AI/Tools tabs here later if verified */}
                    </div>

                    {/* Bottom: Sidebar Content (Fills remaining) */}
                    <div className="flex-1 overflow-hidden relative">
                        {sidebarMode === 'homework' && (
                            <HomeworkTray sessionId={sessionId} />
                        )}
                        {sidebarMode === 'arcade' && (
                            <BrainBreak sessionId={sessionId} onClose={() => setSidebarMode('homework')} />
                        )}
                    </div>

                </div>

                {/* Main Stage: Whiteboard (Right) */}
                <div className="flex-1 bg-slate-200 relative order-2 overflow-hidden h-full">
                    <Whiteboard sessionId={sessionId} />
                </div>

            </div>

        </div>
    );
}
