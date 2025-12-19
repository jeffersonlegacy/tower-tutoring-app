import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import { db } from '../../services/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';

export default function VideoChat({ sessionId }) {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState({}); // { peerId: stream }
    const [peers, setPeers] = useState({}); // { peerId: callObject }
    const [status, setStatus] = useState('Initializing...');

    // Stable Refs
    const peerRef = useRef(null);
    const localVideoRef = useRef(null);
    const peersRef = useRef({}); // keep track of active calls to prevent duplicates

    // Generate a random user ID for display if one isn't provided
    const userId = useRef('User-' + Math.floor(Math.random() * 1000)).current;

    useEffect(() => {
        if (!sessionId) return;
        setStatus('Accessing Media...');

        // 1. Get Local Stream
        const initMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                    localVideoRef.current.muted = true; // Always mute self
                }
                initPeer(stream);
            } catch (err) {
                console.error("Failed to access media:", err);
                setStatus('Camera Blocked / Error');
            }
        };

        const initPeer = (stream) => {
            setStatus('Connecting to Neural Net...');

            // 2. Initialize PeerJS (Public Cloud Broker)
            const peer = new Peer(undefined, {
                host: '0.peerjs.com',
                port: 443,
                path: '/'
            });

            peerRef.current = peer;

            peer.on('open', (id) => {
                console.log('My Peer ID:', id);
                setStatus('Connected to Mesh');

                // 3. Signaling: Write Presence to Firebase
                const peerDoc = doc(db, 'whiteboards', sessionId, 'peers', id);
                setDoc(peerDoc, { peerId: id, userId, joinedAt: Date.now() })
                    .catch(err => console.error("Signaling Error:", err));
            });

            peer.on('call', (call) => {
                console.log('Incoming call from:', call.peer);
                // Always answer incoming calls
                call.answer(stream);
                handleCallStream(call);
            });

            // 4. Connect to others via Signaling
            subscribeToPeers(peer, stream);
        };

        const handleCallStream = (call) => {
            // Prevent duplicate listeners
            if (peersRef.current[call.peer]) return;
            peersRef.current[call.peer] = call;

            call.on('stream', (remoteStream) => {
                addRemoteStream(call.peer, remoteStream);
            });
            call.on('close', () => {
                removeRemoteStream(call.peer);
            });
            call.on('error', (err) => {
                console.warn('Call error:', err);
                removeRemoteStream(call.peer);
            });
        };

        const removeRemoteStream = (id) => {
            if (peersRef.current[id]) {
                delete peersRef.current[id];
            }
            setRemoteStreams(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        };

        // Subscription to the room's peer list
        const subscribeToPeers = (peerInstance, myStream) => {
            const peersCol = collection(db, 'whiteboards', sessionId, 'peers');

            return onSnapshot(peersCol, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const data = change.doc.data();
                        if (data.peerId === peerInstance.id) return; // Skip self

                        // MESH LOGIC:
                        // To avoid double-calling (race condition), we compare Peer IDs.
                        // Only the "larger" string ID initiates the call.
                        // The "smaller" ID waits to receive the call.
                        if (peerInstance.id > data.peerId) {
                            console.log(`Initiating call to ${data.peerId} (I am authority)`);
                            const call = peerInstance.call(data.peerId, myStream);
                            if (call) {
                                handleCallStream(call);
                            }
                        } else {
                            console.log(`Waiting for call from ${data.peerId} (They are authority)`);
                        }
                    }
                    if (change.type === 'removed') {
                        const data = change.doc.data();
                        removeRemoteStream(data.peerId);
                    }
                });
            });
        };

        initMedia();

        return () => {
            // Cleanup state and local media
            if (peerRef.current) {
                peerRef.current.destroy();
                // Remove presence
                if (peerRef.current.id) {
                    deleteDoc(doc(db, 'whiteboards', sessionId, 'peers', peerRef.current.id))
                        .catch(e => console.warn("Cleanup error", e));
                }
            }
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            // Clear refs
            peersRef.current = {};
        };
    }, [sessionId]);

    const addRemoteStream = (id, stream) => {
        setRemoteStreams(prev => ({ ...prev, [id]: stream }));
    };

    return (
        <div className="h-full w-full bg-slate-950 relative flex flex-col border-r border-slate-800">
            {/* Header - SIMPLIFIED */}
            <div className="bg-slate-900 border-b border-white/5 p-2 flex items-center justify-between z-20 shadow-md">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${status === 'Connected to Mesh' ? 'bg-cyan-500 animate-pulse' : 'bg-yellow-500 animate-bounce'}`} />
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{status}</span>
                </div>
                {/* REMOVED CONFUSING ID DISPLAY - User knows their session ID from main header */}
            </div>

            {/* Video Grid */}
            <div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr h-full">

                    {/* Local User */}
                    <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)] group min-h-[200px]">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover transform -scale-x-100 opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[9px] text-cyan-400 font-mono border border-cyan-500/30">
                            YOU
                        </div>
                    </div>

                    {/* Remote Users */}
                    {Object.entries(remoteStreams).map(([id, stream]) => (
                        <RemoteVideo key={id} id={id} stream={stream} />
                    ))}

                    {/* Empty State / Searching */}
                    {Object.keys(remoteStreams).length === 0 && (
                        <div className="rounded-xl border border-dashed border-slate-800 flex items-center justify-center min-h-[200px]">
                            <div className="text-center space-y-2 opacity-50">
                                <span className="text-2xl animate-pulse">📡</span>
                                <p className="text-[10px] text-slate-500 font-mono uppercase">Scanning for signals...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Sub-component for remote video to handle ref lifecycle
function RemoteVideo({ id, stream }) {
    const ref = useRef();

    useEffect(() => {
        if (ref.current) ref.current.srcObject = stream;
    }, [stream]);

    return (
        <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)] group min-h-[200px]">
            <video
                ref={ref}
                autoPlay
                playsInline
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            />
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[9px] text-purple-400 font-mono border border-purple-500/30">
                PEER ({id.substr(0, 4)})
            </div>
        </div>
    );
}
