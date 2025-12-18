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

            {/* Main Content Area: Vertical Stack (Video Top, Whiteboard Bottom) */}
            <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative">

                {/* Uploads Drawer/Sidebar (Desktop: Left, Mobile: Bottom/Collapsible could be better but let's stick to visible for now or stack) */}
                {/* Uploads Drawer/Sidebar REPLACED by Upload Button */}
                <div className="w-full md:w-auto bg-slate-800 border-r border-slate-700 p-2 order-3 md:order-1 flex flex-col gap-2">
                    <button
                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded text-sm font-bold"
                        onClick={() => document.getElementById('homework-upload').click()}
                    >
                        Upload Homework
                    </button>
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
                                    const center = editor.viewportPageBounds.center;

                                    if (file.type.startsWith('image/')) {
                                        editor.createShapes([
                                            {
                                                type: 'image',
                                                x: center.x - 100,
                                                y: center.y - 100,
                                                props: {
                                                    src: downloadURL,
                                                    w: 200,
                                                    h: 200,
                                                },
                                            },
                                        ]);
                                    } else {
                                        // For PDF or other files, we can just put a link or an embed if supported
                                        // Tldraw handles files better via putExternalContent if they are local,
                                        // but for sync we need URLs.
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
                                e.target.value = ''; // Reset
                            }
                        }}
                    />
                </div>

                {/* Center Stage */}
                <div className="flex-1 flex flex-col h-full relative order-1 md:order-2">
                    {/* Video Chat Container - Top */}
                    <div className="h-1/3 min-h-[250px] w-full border-b border-slate-700 bg-black relative">
                        <VideoChat sessionId={sessionId} />
                    </div>

                    {/* Whiteboard Container - Bottom */}
                    <div className="flex-1 w-full bg-slate-200 relative">
                        <Whiteboard sessionId={sessionId} onMount={handleMount} />
                    </div>
                </div>
            </div>

            {/* Floating Tools */}
            <GeminiChat />
            <Calculator />
        </div>
    );
}
