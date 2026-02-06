import React from 'react';

export default function VideoChat({ sessionId, onTogglePiP, isFloating }) {
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

    const videoUrl = `${mirotalkBase}/${roomName}?name=${userName}&video=true&audio=true&screen=0&notify=0&chat=0`;

    // Neutralize iframe on unmount to prevent memory leaks/zombie audio
    React.useEffect(() => {
        return () => {
            const iframe = document.querySelector(`iframe[src*="${roomName}"]`);
            if (iframe) iframe.src = 'about:blank';
        };
    }, [roomName]);

    return (
        <div className="h-full w-full bg-black flex flex-col overflow-hidden relative group font-sans">
            {/* Minimal overlay status - Fades out on hover/activity */}
            <div className={`absolute top-2 left-2 z-10 flex items-center gap-2 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10 ${isFloating ? 'opacity-0 group-hover:opacity-100 transition-opacity' : 'opacity-50 hover:opacity-100 transition-opacity'} pointer-events-none`}>
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
                <span className="text-[10px] font-medium text-white/80 tracking-wide">
                    LIVE
                </span>
            </div>

            {/* Controls Overlay (Top Right) */}
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                
                {/* PiP / Float Toggle */}
                <button
                    onClick={onTogglePiP}
                    className="p-1.5 text-white/50 hover:text-white bg-black/20 hover:bg-black/60 rounded-lg backdrop-blur-sm transition-all"
                    title={isFloating ? "Dock Video" : "Float Video"}
                >
                    {isFloating ? (
                        /* Dock Icon */
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="12" x2="12" y1="3" y2="21"/></svg>
                    ) : (
                        /* Float Icon */
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="8" x="14" y="14" rx="1"/><path d="M14 14 L20 20"/><path d="M4 20h6"/><path d="M20 10v0"/></svg>
                    )}
                </button>

                {/* Fullscreen Toggle */}
                <button
                    onClick={() => {
                        const el = document.getElementById('video-wrapper');
                        if (!document.fullscreenElement) {
                            el?.requestFullscreen().catch(e => console.error(e));
                        } else {
                            document.exitFullscreen();
                        }
                    }}
                    className="p-1.5 text-white/50 hover:text-white bg-black/20 hover:bg-black/60 rounded-lg backdrop-blur-sm transition-all"
                    title="Toggle Fullscreen"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                        <path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                    </svg>
                </button>
            </div>

            {/* Iframe Embed */}
            <div id="video-wrapper" className="flex-1 w-full h-full bg-black relative">
                <iframe
                    src={videoUrl}
                    className="w-full h-full border-0 absolute inset-0 block"
                    allow="camera; microphone; display-capture; autoplay; clipboard-write; clipboard-read; fullscreen"
                    title="Live Session"
                />
            </div>
        </div>
    );
}

