import React from 'react';

export default function VideoChat({ sessionId }) {
    // MIROTALK P2P INTEGRATION
    // Source: https://github.com/miroslavpejic85/mirotalk
    // Room ID: Derived from sessionId to ensure uniqueness
    // Parameters:
    // - name: Random user ID (or passed prop)
    // - video/audio: true (Auto-start)
    // - screen: false (Don't auto-share screen)
    // - notify: 0 (Disable welcome notification)

    const mirotalkBase = "https://p2p.mirotalk.com/join";
    const roomName = `${sessionId}_VIDEO_SECURE`;

    // Fix: Persist userName across re-renders to prevent iframe reload on tab switch
    const [userName] = React.useState(() => `User_${Math.floor(Math.random() * 1000)}`);

    const videoUrl = `${mirotalkBase}/${roomName}?name=${userName}&video=true&audio=true&screen=0&notify=0`;

    return (
        <div className="h-full w-full bg-slate-950 flex flex-col border-r border-slate-800 overflow-hidden font-mono relative">
            {/* Header / Status */}
            <div className="shrink-0 p-2 flex items-center justify-between border-b border-white/5 bg-slate-900">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse" />
                    <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                        MIROTALK P2P MESH
                    </span>
                </div>
                <div className="flex items-center gap-1 opacity-50">
                    <span className="text-[8px] uppercase tracking-wider text-slate-500">
                        {roomName}
                    </span>
                    {/* Fullscreen Toggle */}
                    <button
                        onClick={() => {
                            const el = document.getElementById('video-container');
                            if (!document.fullscreenElement) {
                                el.requestFullscreen().catch(err => console.log(err));
                            } else {
                                document.exitFullscreen();
                            }
                        }}
                        className="ml-2 text-slate-400 hover:text-white"
                        title="Toggle Fullscreen"
                    >
                        ⛶
                    </button>
                </div>
            </div>

            {/* Iframe Embed */}
            <div id="video-container" className="flex-1 w-full h-full bg-black relative group">
                <iframe
                    src={videoUrl}
                    className="w-full h-full border-0 absolute inset-0"
                    allow="camera; microphone; display-capture; autoplay; clipboard-write; clipboard-read; fullscreen"
                    title="MiroTalk Video"
                />

                {/* Exit Fullscreen Overlay Button (Visible only in FS) */}
                <button
                    className="hidden group-fullscreen:flex absolute top-4 right-4 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-full shadow-lg z-50 items-center gap-2 font-bold text-sm transition-transform hover:scale-105"
                    onClick={() => document.exitFullscreen()}
                >
                    ✕ Exit Full Screen
                </button>
            </div>
        </div>
    );
}

