import React, { useState, useCallback } from "react";
import Whiteboard from "../features/session/Whiteboard";
import Uploads from "../features/session/Uploads";
import VideoChat from "../features/session/VideoChat";
import { useParams } from "react-router-dom";
import { AssetRecordType } from "@tldraw/tldraw";
import GeminiChat from "../features/chat/GeminiChat";
import Calculator from "../features/tools/Calculator";

export default function Session() {
    const { sessionId } = useParams();
    const [editor, setEditor] = useState(null);

    const handleMount = useCallback((editorInstance) => {
        setEditor(editorInstance);
    }, []);

    const handleAddToBoard = useCallback((url) => {
        if (!editor) return;

        const assetId = AssetRecordType.createId();
        const imageWidth = 500;
        const imageHeight = 500;

        editor.createAssets([
            {
                id: assetId,
                type: 'image',
                typeName: 'asset',
                props: {
                    name: 'uploaded-image',
                    src: url,
                    w: imageWidth,
                    h: imageHeight,
                    mimeType: 'image/png', // simplistic assumption for now
                    isAnimated: false,
                },
                meta: {},
            },
        ]);

        editor.createShapes([
            {
                type: 'image',
                x: 100,
                y: 100,
                props: {
                    assetId,
                    w: imageWidth,
                    h: imageHeight,
                },
            },
        ]);
    }, [editor]);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Main Content Area: Vertical Stack (Video Top, Whiteboard Bottom) */}
            <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative">

                {/* Uploads Drawer/Sidebar (Desktop: Left, Mobile: Bottom/Collapsible could be better but let's stick to visible for now or stack) */}
                <div className="w-full md:w-64 bg-slate-800 border-r border-slate-700 overflow-y-auto p-2 order-3 md:order-1">
                    <Uploads sessionId={sessionId} onAddToBoard={handleAddToBoard} />
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
