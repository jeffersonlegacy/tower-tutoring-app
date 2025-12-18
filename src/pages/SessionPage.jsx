import React, { useState, useCallback, useEffect } from "react";
import Whiteboard from "../features/session/Whiteboard";

import VideoChat from "../features/session/VideoChat";
import { useParams } from "react-router-dom";

import GeminiChat from "../features/chat/GeminiChat";
import Calculator from "../features/tools/Calculator";
import { storage } from "../services/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Session() {
    const { sessionId } = useParams();
    const [editor, setEditor] = useState(null);
    const [maintenanceMode, setMaintenanceMode] = useState({ enabled: false, message: '' });

    const handleMount = useCallback((editorInstance) => {
        setEditor(editorInstance);
    }, []);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch('/api/config');
                const config = await response.json();
                if (config.maintenanceMode) {
                    setMaintenanceMode(config.maintenanceMode);
                }
            } catch (error) {
                console.error('Failed to fetch maintenance config:', error);
            }
        };

        fetchConfig();
    }, []);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Maintenance Mode Banner */}
            {maintenanceMode.enabled && (
                <div className="bg-red-600 text-white text-center p-3 font-bold z-50">
                    ⚠️ {maintenanceMode.message || 'Maintenance in progress. Some features may be unavailable.'}
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative">

                {/* Desktop: Sidebar for Video (Left) - Increased width for better visibility */}
                {/* Mobile: Video on Top (Fixed height) */}
                <div className="flex-none order-1 w-full md:w-[320px] lg:w-[400px] border-b md:border-b-0 md:border-r border-slate-700 bg-black flex flex-col relative z-20 shrink-0 h-[35vh] md:h-auto">
                    <VideoChat sessionId={sessionId} />
                </div>

                {/* Main Stage: Whiteboard (Right/Bottom) */}
                <div className="flex-1 bg-slate-200 relative order-2 overflow-hidden h-full">
                    <Whiteboard sessionId={sessionId} onMount={handleMount} />

                    {/* Upload Button Overlay - Floating on top-left of whiteboard */}
                    <div className="absolute top-4 left-4 z-20 pointer-events-auto">
                        <button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-lg font-bold flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 border border-indigo-400/30"
                            onClick={() => document.getElementById('homework-upload').click()}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            Upload Homework
                        </button>
                    </div>
                </div>

            </div>

            <input
                id="homework-upload"
                type="file"
                className="hidden"
                accept="image/png, image/jpeg, image/webp, image/heic, image/heif, application/pdf"
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (editor && file) {
                        try {
                            // 1. Upload to Firestore Storage
                            const storageRef = ref(storage, `sessions/${sessionId}/${Date.now()}_${file.name}`);
                            const snapshot = await uploadBytes(storageRef, file);
                            const downloadURL = await getDownloadURL(snapshot.ref);

                            // 2. Create Image Shape in Tldraw
                            const bounds = editor.getViewportPageBounds ? editor.getViewportPageBounds() : editor.viewportPageBounds;
                            const center = bounds ? bounds.center : { x: 0, y: 0 };

                            if (file.type.startsWith('image/')) {
                                const img = new Image();
                                img.onload = async () => {
                                    const w = img.width;
                                    const h = img.height;

                                    const assetId = `asset:${Date.now()}`;
                                    const asset = {
                                        id: assetId,
                                        typeName: 'asset',
                                        type: 'image',
                                        meta: {},
                                        props: {
                                            name: file.name,
                                            src: downloadURL,
                                            w: w,
                                            h: h,
                                            mimeType: file.type,
                                            isAnimated: false
                                        }
                                    };

                                    // Must create asset BEFORE shape
                                    editor.createAssets([asset]);

                                    editor.createShapes([
                                        {
                                            type: 'image',
                                            x: center.x - (w / 2),
                                            y: center.y - (h / 2),
                                            props: {
                                                assetId: assetId,
                                                w: w,
                                                h: h,
                                            },
                                        },
                                    ]);

                                    URL.revokeObjectURL(img.src);
                                };
                                img.src = URL.createObjectURL(file);
                            } else {
                                editor.putExternalContent({
                                    type: 'url',
                                    url: downloadURL,
                                    point: center,
                                });
                            }
                        } catch (error) {
                            console.error("Upload failed:", error);
                            alert("Failed to upload homework. Please try again.");
                        }
                        e.target.value = '';
                    }
                }}
            />

            {/* Floating Tools */}
            <GeminiChat />
            <Calculator />
        </div>
    );
}
