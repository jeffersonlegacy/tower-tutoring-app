import React from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';

export default function VideoChat({ sessionId }) {
    // Using public Jitsi Meet server for immediate access (no token required)
    // In production, you would use a backend to generate tokens for 8x8.vc

    return (
        <div className="h-full w-full bg-black">
            <JitsiMeeting
                domain="meet.jit.si"
                roomName={`JeffersonTutoring_${sessionId}`} // Unique room prefix
                configOverwrite={{
                    startWithAudioMuted: true,
                    disableThirdPartyRequests: true,
                    prejoinPageEnabled: false,
                }}
                interfaceConfigOverwrite={{
                    tileViewEnabled: true,
                }}
                spinner={() => (
                    <div className="flex items-center justify-center h-full text-white">Loading Video...</div>
                )}
                getIFrameRef={(iframeRef) => {
                    iframeRef.style.height = '100%';
                }}
            />
        </div>
    );
}
