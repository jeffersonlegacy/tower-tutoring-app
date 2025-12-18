import React from 'react';

// Executive Decision: Use Jitsi Meet for guaranteed stability and zero "Not Authorized" errors.
export default function VideoChat({ sessionId }) {
    // Sanitize room name to be Jitsi-friendly
    const roomName = `TowerTutoring_${sessionId || 'MainRoom'}`;
    const jitsiUrl = `https://meet.jit.si/${roomName}`;

    return (
        <div className="h-full w-full bg-slate-900 relative flex flex-col items-center justify-center overflow-hidden">
            <iframe
                src={jitsiUrl}
                className="w-full h-full border-none"
                allow="camera; microphone; display-capture; autoplay; clipboard-write; screenshare"
                title="Tower Tutoring Video"
            />
        </div>
    );
}
