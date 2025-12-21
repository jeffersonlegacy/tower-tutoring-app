import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import { db } from '../../services/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

/**
 * ELITE VIDEO ENGINE v4.0 (Stabilized)
 * Features:
 * - PeerJS with Firebase Presence Signaling
 * - Mesh Networking with Deterministic Authority
 * - Auto-Reconnect & Heartbeat
 * - HARD RESET Capability for troubleshooting
 * - Visual Diagnostics Panel
 */
export default function VideoChat({ sessionId }) {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState({}); // { peerId: { stream, userId } }
    const [status, setStatus] = useState('Initializing...');
    const [lastError, setLastError] = useState(null);
    const [myPeerId, setMyPeerId] = useState(null);

    // Media State
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [showDebug, setShowDebug] = useState(false);

    const peerRef = useRef(null);
    const localVideoRef = useRef(null);
    const peersRef = useRef({}); // Track active PeerJS call objects
    const presenceRef = useRef(null);
    const streamsRef = useRef({}); // Ref mirror for state to avoid closure staleness

    // Unique user ID for this session instance
    const userId = useRef('User-' + Math.floor(Math.random() * 10000)).current;

    useEffect(() => {
        if (!sessionId) return;
        let mounted = true;

        const startEngine = async () => {
            try {
                // 1. Get Media
                setStatus('REQUESTING CAMERA...');
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { max: 640 }, height: { max: 480 }, frameRate: { max: 15 } },
                    audio: { echoCancellation: true, noiseSuppression: true }
                });

                if (!mounted) return;

                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                    localVideoRef.current.muted = true; // Prevent local echo
                }

                // 2. Initialize Peer
                initPeer(stream);

            } catch (err) {
                console.error("Media Access Failure:", err);
                setStatus('CAMERA BLOCKED');
                setLastError(err.message);
            }
        };

        const initPeer = (stream) => {
            setStatus('CONNECTING TO CLOUD...');

            const peer = new Peer(undefined, {
                host: '0.peerjs.com',
                secure: true,
                port: 443,
                debug: 1, // Errors only
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ]
                }
            });

            peerRef.current = peer;

            peer.on('open', (id) => {
                if (!mounted) return;
                console.log('[RTC] Identity Confirmed:', id);
                setStatus('ONLINE');
                setMyPeerId(id);
                setLastError(null);

                // Publish Presence
                presenceRef.current = id;
                const peerDoc = doc(db, 'whiteboards', sessionId, 'peers', id);
                setDoc(peerDoc, {
                    peerId: id,
                    userId,
                    active: true,
                    lastSeen: serverTimestamp(),
                    userAgent: navigator.userAgent
                }).catch(e => setLastError("Signaling Write Error: " + e.message));
            });

            peer.on('call', (call) => {
                console.log('[RTC] Inbound Call:', call.peer);
                call.answer(stream);
                setupCall(call);
            });

            peer.on('disconnected', () => {
                setStatus('...RECONNECTING');
                // Smart Backoff: Wait 2s before trying, increases change of success
                setTimeout(() => {
                    if (mounted && peer && !peer.destroyed) {
                        console.log('[RTC] Attempting Reconnect...');
                        peer.reconnect();
                    }
                }, 2000);
            });

            peer.on('error', (err) => {
                // Suppress noisy network errors if they are just transient
                if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error') {
                    // Only log if persistent or critical
                    // We rely on 'disconnected' event to trigger reconnect
                    console.warn('[RTC] Network Glitch (Auto-Recovering):', err.message);
                } else {
                    console.error('[RTC] Error:', err);
                    if (err.type !== 'peer-unavailable') {
                        setLastError(`${err.type}: ${err.message}`);
                    }
                }
            });

            // Start Signaling Listener
            subscribeToPeers(peer, stream);
        };

        const subscribeToPeers = (peerInstance, myStream) => {
            const peersCol = collection(db, 'whiteboards', sessionId, 'peers');
            return onSnapshot(peersCol, (snapshot) => {
                if (!mounted) return;

                snapshot.docChanges().forEach((change) => {
                    const data = change.doc.data();
                    if (!data) return;

                    if (data.peerId === peerInstance.id) return; // Ignore self

                    if (change.type === 'added') {
                        console.log(`[RTC] Peer Discovered: ${data.peerId} (Active: ${data.active})`);
                        // Deterministic Mesh: Higher ID calls Lower ID
                        if (peerInstance.id > data.peerId) {
                            console.log(`[RTC] Initiating Call -> ${data.peerId}`);
                            const call = peerInstance.call(data.peerId, myStream);
                            if (call) setupCall(call);
                        } else {
                            console.log(`[RTC] Waiting for call from higher ID: ${data.peerId}`);
                        }
                    } else if (change.type === 'removed') {
                        console.log(`[RTC] Peer Lost: ${data.peerId}`);
                        cleanupRemote(data.peerId);
                    }
                });
            }, (error) => {
                console.error("Signaling Read Error:", error);
                setLastError("Signaling Read Error: " + error.code);
            });
        };

        startEngine();

        // Cleanup
        return () => {
            mounted = false;
            // 1. Remove presence to tell others to stop calling
            if (presenceRef.current) {
                deleteDoc(doc(db, 'whiteboards', sessionId, 'peers', presenceRef.current)).catch(() => { });
            }
            // 2. Destroy peer connection
            if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
            }
            // 3. Stop local media
            if (localStream) {
                localStream.getTracks().forEach(t => t.stop());
            }
            // 4. Clear refs
            peersRef.current = {};
            setRemoteStreams({});
        };
    }, [sessionId]); // Only re-run if Session ID changes

    /* --- Logic --- */

    const setupCall = (call) => {
        // Prevent duplicate handling
        const existingCall = peersRef.current[call.peer];
        if (existingCall) {
            console.warn(`[RTC] Replacing existing call with ${call.peer}`);
            existingCall.close();
        }

        peersRef.current[call.peer] = call;

        call.on('stream', (remoteStream) => {
            console.log(`[RTC] Stream Received from ${call.peer}`);
            setRemoteStreams(prev => ({ ...prev, [call.peer]: remoteStream }));
        });

        call.on('close', () => cleanupRemote(call.peer));
        call.on('error', (e) => {
            console.error(`[RTC] Call Error with ${call.peer}:`, e);
            cleanupRemote(call.peer);
        });
    };

    const cleanupRemote = (id) => {
        if (peersRef.current[id]) {
            peersRef.current[id].close();
            delete peersRef.current[id];
        }
        setRemoteStreams(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    /* --- Actions --- */

    // HARD RESET: Fully intentional reload of the component state
    const forceReset = () => {
        if (window.confirm("Restart Video Engine? This will briefly cut connection.")) {
            window.location.reload(); // Simple, brutal, effective for "Executive" troubleshooting
            // Alternatively we could unmount/remount, but reload clears browser WebRTC cache issues too.
        }
    };

    const toggleAudio = () => {
        if (localStream) {
            const track = localStream.getAudioTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setIsMuted(!track.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const track = localStream.getVideoTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setIsVideoOff(!track.enabled);
            }
        }
    };

    /* --- Render --- */
    return (
        <div className="h-full w-full bg-slate-950 flex flex-col border-r border-slate-800 overflow-hidden font-mono relative">

            {/* Status Bar */}
            <div className={`shrink-0 p-2 flex items-center justify-between border-b transition-colors ${status === 'ONLINE' ? 'bg-slate-900 border-white/5' : 'bg-red-900/20 border-red-500/30'}`}>
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowDebug(!showDebug)}>
                    <div className={`w-2 h-2 rounded-full ${status === 'ONLINE' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 animate-pulse'}`} />
                    <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                        {status}
                    </span>
                </div>

                <div className="flex gap-1">
                    <button onClick={forceReset} className="px-2 py-0.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 rounded text-[8px] font-bold uppercase transition-all" title="Restart Video Engine">
                        ⚡ RST
                    </button>
                    <button onClick={toggleAudio} className={`w-6 h-6 rounded flex items-center justify-center border transition-all ${isMuted ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-slate-800 border-white/10 text-slate-400'}`}>
                        {isMuted ? '🔇' : '🎤'}
                    </button>
                    <button onClick={toggleVideo} className={`w-6 h-6 rounded flex items-center justify-center border transition-all ${isVideoOff ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-slate-800 border-white/10 text-slate-400'}`}>
                        {isVideoOff ? '🚫' : '📹'}
                    </button>
                </div>
            </div>

            {/* Diagnostics Panel (Collapsible) */}
            {showDebug && (
                <div className="bg-black/50 p-2 text-[8px] font-mono text-slate-500 border-b border-white/5 animate-in slide-in-from-top-2">
                    <p>ID: <span className="text-slate-300 select-all">{myPeerId || '...'}</span></p>
                    <p>PEERS: {Object.keys(remoteStreams).length} connected</p>
                    {lastError && <p className="text-red-400 font-bold mt-1">ERR: {lastError}</p>}
                </div>
            )}

            {/* Video Grid */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">

                {/* Local User */}
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-white/10 group">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover transform -scale-x-100 ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
                    />
                    {isVideoOff && <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-20">📷</div>}
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 backdrop-blur rounded text-[8px] font-bold text-white uppercase tracking-wider">
                        YOU {isMuted && <span className="text-red-400 ml-1">MUTED</span>}
                    </div>
                </div>

                {/* Remote Users */}
                {Object.entries(remoteStreams).map(([peerId, stream]) => (
                    <RemoteVideo key={peerId} peerId={peerId} stream={stream} />
                ))}

                {Object.keys(remoteStreams).length === 0 && status === 'ONLINE' && (
                    <div className="text-center py-8 opacity-30">
                        <div className="text-2xl mb-2">📡</div>
                        <div className="text-[8px] uppercase tracking-widest">Waiting for Peers...</div>
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

