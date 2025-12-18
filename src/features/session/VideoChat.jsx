import React, { useEffect, useState } from 'react';

// Restoring Self-Hosted Galene on Fly.io
export default function VideoChat() {
    const [galeneUrl, setGaleneUrl] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                // Priority: Hardcoded Production (Most reliable) -> Edge Config -> Env Var
                // We prioritize the known working Fly.io URL to avoid config drift.
                const HARDCODED_URL = "https://jeffersonlegacy.fly.dev/group/main-room/";

                let url = HARDCODED_URL;

                // Enforce HTTPS
                if (!url.includes('localhost') && url.startsWith('http:')) {
                    url = url.replace('http:', 'https:');
                }

                // Params:
                // username=Guest: Pre-fills username
                // autojoin=both: Skips the login screen if password is empty (which it is for this room)
                const finalUrl = `${url}?username=Guest&autojoin=both`;

                console.log("VideoChat: Connecting to Self-Hosted Galene:", finalUrl);
                setGaleneUrl(finalUrl);
            } catch (error) {
                console.error("Config error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    if (loading) {
        return (
            <div className="h-full w-full bg-slate-900 flex items-center justify-center text-white">
                Loading video server...
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-slate-900 relative flex flex-col items-center justify-center overflow-hidden">
            {/* Fallback Link */}
            <div className="absolute top-0 left-0 w-full bg-slate-800/80 text-slate-300 text-[10px] p-1 text-center z-50">
                Self-Hosted Server | <a href={galeneUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Open in new tab</a>
            </div>

            <iframe
                src={galeneUrl}
                className="w-full h-full border-none"
                allow="camera; microphone; display-capture; autoplay; clipboard-write"
                title="Tower Tutoring Video"
            />
        </div>
    );
}
