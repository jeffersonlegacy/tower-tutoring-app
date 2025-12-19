import React, { useState, useEffect } from "react";
import Whiteboard from "../features/session/Whiteboard";
import VideoChat from "../features/session/VideoChat";
import HomeworkTray from "../features/session/HomeworkTray";
import { useParams } from "react-router-dom";
import { useHomeworkUpload } from "../hooks/useHomeworkUpload";

export default function Session() {
    const { sessionId } = useParams();
    const [maintenanceMode, setMaintenanceMode] = useState({ enabled: false, message: '' });
    const { uploadFile, uploading } = useHomeworkUpload(sessionId);
    const [isDragging, setIsDragging] = useState(false);

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

                {/* Sidebar (Video + Homework) - Slightly reduced width to unsqueeze whiteboard */}
                <div className="flex-none order-1 w-full md:w-[300px] lg:w-[350px] border-b md:border-b-0 md:border-r border-slate-700 bg-black flex flex-col relative z-20 shrink-0 h-[45vh] md:h-full">

                    {/* Top: Video (Fixed relative height or pixel height) */}
                    <div className="h-[250px] shrink-0 border-b border-slate-700">
                        <VideoChat sessionId={sessionId} />
                    </div>

                    {/* Bottom: Homework Tray (Fills remaining) */}
                    <div className="flex-1 overflow-hidden">
                        <HomeworkTray sessionId={sessionId} />
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
