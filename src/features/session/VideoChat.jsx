import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import { db } from '../../services/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

/**
 * ELITE VIDEO ENGINE v3.0
 * Features:
 * - PeerJS with Firebase Presence Signaling
 * - Mesh Networking with Deterministic Authority
 * - Auto-Reconnect & Heartbeat
 * - Bandwidth Constrained for Tldraw Performance
 */
export default function VideoChat({ sessionId }) {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState({}); // { peerId: { stream, userId } }
    const [status, setStatus] = useState('Initializing...');
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const peerRef = useRef(null);
    const localVideoRef = useRef(null);
    const peersRef = useRef({}); // Track active PeerJS call objects
    const presenceRef = useRef(null);

    const userId = useRef('User-' + Math.floor(Math.random() * 1000)).current;

    useEffect(() => {
        if (!sessionId) return;

        let active = true;

        const initMedia = async () => {
            try {
                // Optimization: Constraints for lower bandwidth to prioritize Whiteboard
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { max: 640 }, height: { max: 480 }, frameRate: { max: 15 } },
                    audio: { echoCancellation: true, noiseSuppression: true }
                });

                if (!active) return;
                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                    localVideoRef.current.muted = true;
                }
                initPeer(stream);
            } catch (err) {
                console.error("Media Access Failure:", err);
                setStatus('PERMISSIONS ERROR');
            }
        };

        const initPeer = (stream) => {
            // Using a resilient PeerJS config
            const peer = new Peer(undefined, {
                host: '0.peerjs.com',
                secure: true,
                port: 443,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ]
                }
            });

            peerRef.current = peer;

            peer.on('open', (id) => {
                if (!active) return;
                console.log('[RTC] Identity Confirmed:', id);
                setStatus('LIVE');

                // Presence with heartbeat
                presenceRef.current = id;
                const peerDoc = doc(db, 'whiteboards', sessionId, 'peers', id);
                setDoc(peerDoc, {
                    peerId: id,
                    userId,
                    active: true,
                    lastSeen: serverTimestamp()
                }).catch(console.error);
            });

            peer.on('call', (call) => {
                console.log('[RTC] Inbound Signal from:', call.peer);
                call.answer(stream);
                setupCall(call);
            });

            peer.on('disconnected', () => {
                setStatus('RECONNECTING...');
                peer.reconnect();
            });

            peer.on('error', (err) => {
                console.error('[RTC] Hardware/Network Failure:', err.type);
                if (err.type === 'peer-unavailable') {
                    // Handled by signal removal
                }
            });

            // Signal Discovery
            const unsubscribeSignaling = subscribeToPeers(peer, stream);
            return unsubscribeSignaling;
        };

        const setupCall = (call) => {
            if (peersRef.current[call.peer]) {
                peersRef.current[call.peer].close();
            }
            peersRef.current[call.peer] = call;

            call.on('stream', (remoteStream) => {
                setRemoteStreams(prev => ({ ...prev, [call.peer]: remoteStream }));
            });

            call.on('close', () => cleanupRemote(call.peer));
            call.on('error', () => cleanupRemote(call.peer));
        };

        const cleanupRemote = (id) => {
            delete peersRef.current[id];
            setRemoteStreams(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        };

        const subscribeToPeers = (peerInstance, myStream) => {
            const peersCol = collection(db, 'whiteboards', sessionId, 'peers');
            return onSnapshot(peersCol, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (!active) return;
                    const data = change.doc.data();
                    if (data.peerId === peerInstance.id) return;

                    if (change.type === 'added') {
                        // Authority Check: Higher ID calls Lower ID to avoid dual-call race
                        if (peerInstance.id > data.peerId) {
                            console.log(`[RTC] Calling Authority ${data.peerId}`);
                            const call = peerInstance.call(data.peerId, myStream);
                            if (call) setupCall(call);
                        }
                    } else if (change.type === 'removed') {
                        cleanupRemote(data.peerId);
                    }
                });
            });
        };

        initMedia();

        return () => {
            active = false;
            if (presenceRef.current) {
                deleteDoc(doc(db, 'whiteboards', sessionId, 'peers', presenceRef.current)).catch(() => { });
            }
            if (peerRef.current) peerRef.current.destroy();
            if (localStream) localStream.getTracks().forEach(t => t.stop());
            peersRef.current = {};
        };
    }, [sessionId]);

    const toggleAudio = () => {
        if (localStream) {
            const enabled = localStream.getAudioTracks()[0].enabled;
            localStream.getAudioTracks()[0].enabled = !enabled;
            setIsMuted(!enabled);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const enabled = localStream.getVideoTracks()[0].enabled;
            localStream.getVideoTracks()[0].enabled = !enabled;
            setIsVideoOff(!enabled);
        }
    };

    return (
        <div className="h-full w-full bg-slate-950 flex flex-col border-r border-slate-800 overflow-hidden font-mono">
            {/* HUD Header */}
            <div className="bg-slate-900/80 backdrop-blur-md border-b border-white/5 p-2 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${status === 'LIVE' ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-red-500 animate-pulse'}`} />
                    <span className="text-[10px] font-black tracking-tighter text-slate-300 uppercase underline decoration-cyan-500/30 font-mono">
                        COMMS: {status}
                    </span>
                </div>

                <div className="flex gap-1">
                    <button
                        onClick={toggleAudio}
                        className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-slate-800 border-white/10 text-slate-400 hover:text-white'}`}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? '🔇' : '🎤'}
                    </button>
                    <button
                        onClick={toggleVideo}
                        className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-slate-800 border-white/10 text-slate-400 hover:text-white'}`}
                        title={isVideoOff ? "Start Camera" : "Stop Camera"}
                    >
                        {isVideoOff ? '🚫' : '📹'}
                    </button>
                </div>
            </div>

            {/* Viewport Grid */}
            <div className="flex-1 p-2 overflow-y-auto overflow-x-hidden space-y-2">
                {/* Local View */}
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-white/5 group ring-1 ring-cyan-500/20">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover transform -scale-x-100 transition-opacity ${isVideoOff ? 'opacity-0' : 'opacity-70 group-hover:opacity-100'}`}
                    />
                    {isVideoOff && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                            <span className="text-xl grayscale opacity-20">📷</span>
                        </div>
                    )}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <div className="px-1.5 py-0.5 bg-cyan-500 text-black text-[8px] font-black uppercase tracking-tighter rounded">YOU</div>
                        {isMuted && <span className="bg-red-500/80 p-0.5 rounded text-[8px]">🔇</span>}
                    </div>
                </div>

                {/* Remote Participants */}
                {Object.entries(remoteStreams).map(([id, stream]) => (
                    <div key={id} className="relative aspect-video rounded-lg overflow-hidden bg-black border border-white/5 ring-1 ring-purple-500/20">
                        <RemoteVideo stream={stream} />
                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                            <div className="px-1.5 py-0.5 bg-purple-500 text-white text-[8px] font-black uppercase tracking-tighter rounded">PEER // {id.slice(0, 4)}</div>
                        </div>
                    </div>
                ))}

                {/* Idle Mode */}
                {Object.keys(remoteStreams).length === 0 && (
                    <div className="aspect-video rounded-lg border border-dashed border-slate-800 flex flex-col items-center justify-center bg-slate-900/10">
                        <div className="flex flex-col items-center gap-2 animate-pulse opacity-30">
                            <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-cyan-500 animate-spin" />
                            <span className="text-[8px] uppercase tracking-[0.3em] font-black">Waiting for student...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function RemoteVideo({ stream }) {
    const videoRef = useRef();
    useEffect(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
    }, [stream]);
    return <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />;
}

