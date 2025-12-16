import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export default function VideoChat({ sessionId }) {
    const [myPeerId, setMyPeerId] = useState(null);
    const [remotePeerId, setRemotePeerId] = useState(null);
    const [status, setStatus] = useState("Initializing...");
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerInstance = useRef(null);

    useEffect(() => {
        let unsubscribe;

        const initVideo = async () => {
            try {
                // 1. Get Local Stream
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                    localVideoRef.current.muted = true; // Mute local video to prevent feedback
                }

                // 2. Initialize PeerJS
                const peer = new Peer();
                peerInstance.current = peer;

                peer.on('open', async (id) => {
                    setMyPeerId(id);
                    setStatus("Check connectivity...");

                    // 3. Signaling via Firestore
                    const sessionRef = doc(db, 'sessions', sessionId);
                    const sessionSnap = await getDoc(sessionRef);

                    if (!sessionSnap.exists() || !sessionSnap.data().hostId) {
                        // I am the Host
                        await setDoc(sessionRef, { hostId: id }, { merge: true });
                        setStatus("Waiting for student...");
                    } else {
                        // I am the Guest, connect to Host
                        const hostId = sessionSnap.data().hostId;
                        if (hostId !== id) {
                            setStatus("Connecting to tutor...");
                            connectToPeer(peer, hostId, stream);
                        }
                    }
                });

                // 4. Handle Incoming Calls (Host Logic)
                peer.on('call', (call) => {
                    setStatus("Connected!");
                    call.answer(stream); // Answer with my stream
                    call.on('stream', (userVideoStream) => {
                        if (remoteVideoRef.current) {
                            remoteVideoRef.current.srcObject = userVideoStream;
                        }
                    });
                });

                // 5. Cleanup on unmount
                return () => {
                    if (peer) peer.destroy();
                    if (stream) stream.getTracks().forEach(track => track.stop());
                };

            } catch (err) {
                console.error("Video Chat Error:", err);
                setStatus("Error accessing camera/mic");
            }
        };

        initVideo();
    }, [sessionId]);

    const connectToPeer = (peer, remoteId, localStream) => {
        const call = peer.call(remoteId, localStream);
        call.on('stream', (userVideoStream) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = userVideoStream;
            }
            setStatus("Connected!");
        });
        call.on('error', (err) => {
            console.error("Call error:", err);
            setStatus("Call connection failed");
        });
    };

    return (
        <div className="h-full w-full bg-black relative flex items-center justify-center overflow-hidden group">
            {/* Status Overlay */}
            <div className="absolute top-2 left-2 z-20 bg-black/50 px-2 py-1 rounded text-white text-xs pointer-events-none">
                {status}
            </div>

            {/* Remote Video (Main) */}
            <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
            />

            {/* Local Video (PIP - Bottom Right) */}
            <div className="absolute bottom-4 right-4 w-32 h-24 bg-slate-800 border-2 border-slate-600 rounded-lg overflow-hidden shadow-lg z-10 hover:w-48 hover:h-36 transition-all">
                <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover transform scale-x-[-1]" // Mirror local video
                />
            </div>

            {/* Fallback if no remote video */}
            {!remoteVideoRef.current?.srcObject && (
                <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
                    <span className="text-slate-500 text-sm">Waiting for video...</span>
                </div>
            )}
        </div>
    );
}
