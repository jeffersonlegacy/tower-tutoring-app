import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import { db } from '../../services/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export default function VideoChat() {
    let rawUrl = import.meta.env.VITE_GALENE_URL || "https://localhost:8443/group/main-room/";
    if (!rawUrl.includes('localhost') && rawUrl.startsWith('http:')) {
        rawUrl = rawUrl.replace('http:', 'https:');
    }
    const galeneUrl = `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}username=Student&autojoin=both`;

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
