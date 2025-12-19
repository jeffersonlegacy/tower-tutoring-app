import React, { useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import GeminiChat from "../features/chat/GeminiChat";
import Calculator from "../features/tools/Calculator";
import BrainBreak from "../features/games/BrainBreak";

export default function SessionLayout() {
    const { sessionId } = useParams();
    const [showBrainBreak, setShowBrainBreak] = useState(false);

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-900 relative">
            {/* Animated Logo Background */}
            <div className="absolute inset-0 bg-logo-pattern animate-slide z-0"></div>

            {/* Global Header */}
            <header className="p-4 text-center text-xl font-bold bg-slate-800/90 backdrop-blur-md text-white shadow flex justify-between items-center z-10 border-b border-slate-700 shrink-0 w-full relative">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">📚</span>
                    <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Jefferson Tutoring</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-slate-700 rounded-full text-xs font-mono text-slate-300">
                        ID: {sessionId}
                    </span>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative w-full h-full z-10">
                <Outlet />
            </div>

            {/* Brain Break Modal */}
            {showBrainBreak && (
                <BrainBreak sessionId={sessionId} onClose={() => setShowBrainBreak(false)} />
            )}

            {/* Global Floating Tools (Toolbar) */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-[9999] items-end pointer-events-none">
                {/* Pointer events none on container so clicks pass through empty space, but auto on children */}

                {/* Brain Break Trigger */}
                <button
                    onClick={() => setShowBrainBreak(true)}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg hover:scale-110 transition-transform flex items-center justify-center border border-white/20 group pointer-events-auto"
                    title="Brain Break"
                >
                    <span className="text-xl group-hover:rotate-12 transition-transform">🕹️</span>
                </button>

                <div className="pointer-events-auto">
                    <GeminiChat />
                </div>
                <div className="pointer-events-auto">
                    <Calculator />
                </div>
            </div>
        </div>
    );
}
