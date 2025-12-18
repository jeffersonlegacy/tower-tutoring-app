import React, { useEffect, useState } from 'react';

export default function VideoChat() {
    const [galeneUrl, setGaleneUrl] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch('/api/config');
                const config = await response.json();

                // Priority: Edge Config -> Env Var -> Hardcoded Production -> Localhost
                let url = config.galeneServerUrl ||
                    import.meta.env.VITE_GALENE_URL ||
                    "https://jeffersonlegacy.fly.dev/group/main-room/"; // Hardcoded Production Fallback

                // Enforce HTTPS in production
                if (!url.includes('localhost') && url.startsWith('http:')) {
                    url = url.replace('http:', 'https:');
                }

                // Append auto-login params
                const finalUrl = `${url}${url.includes('?') ? '&' : '?'}username=Student&autojoin=both`;
                console.log("VideoChat: Using URL:", finalUrl);
                setGaleneUrl(finalUrl);
            } catch (error) {
                console.error('Failed to fetch Edge Config:', error);

                // Fallback Logic on Error
                let fallbackUrl = import.meta.env.VITE_GALENE_URL || "https://jeffersonlegacy.fly.dev/group/main-room/";

                if (!fallbackUrl.includes('localhost') && fallbackUrl.startsWith('http:')) {
                    fallbackUrl = fallbackUrl.replace('http:', 'https:');
                }
                const finalFallback = `${fallbackUrl}${fallbackUrl.includes('?') ? '&' : '?'}username=Student&autojoin=both`;
                console.log("VideoChat: Using Fallback URL:", finalFallback);
                setGaleneUrl(finalFallback);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    if (loading) {
        return (
            <div className="h-full w-full bg-slate-900 flex items-center justify-center text-white">
                Loading video...
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-slate-900 relative flex flex-col items-center justify-center overflow-hidden">
            {/* Certificate Warning / Helper */}
            <div className="absolute top-0 left-0 w-full bg-yellow-600/20 text-yellow-200 text-xs p-1 text-center border-b border-yellow-600/40 z-50">
                If video doesn't load, <a href={galeneUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-white">open this link</a> and accept the security certificate.
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
