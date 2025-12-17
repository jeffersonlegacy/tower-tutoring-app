import React, { useState, useCallback } from "react";
import Whiteboard from "../features/session/Whiteboard";

import VideoChat from "../features/session/VideoChat";
import { useParams } from "react-router-dom";

import GeminiChat from "../features/chat/GeminiChat";
import Calculator from "../features/tools/Calculator";

export default function Session() {
    const { sessionId } = useParams();
    const [editor, setEditor] = useState(null);

    const handleMount = useCallback((editorInstance) => {
        setEditor(editorInstance);
    }, []);



    return (
        <div className="flex flex-col h-full overflow-hidden">
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
                        onChange={(e) => {
                            if (editor && e.target.files?.[0]) {
                                editor.putExternalContent({
                                    type: 'files',
                                    files: [e.target.files[0]],
                                    point: editor.viewportPageBounds.center,
                                    ignoreParent: false
                                });
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
