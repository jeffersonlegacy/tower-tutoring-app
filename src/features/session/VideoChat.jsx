import { useCallback, useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import {
  Camera,
  CameraOff,
  Maximize2,
  Minimize2,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  RefreshCw,
  Users,
  Video,
} from 'lucide-react';

function AttachedTrack({ track, muted = false, className = 'h-full w-full' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !track) return undefined;

    const mediaElement = track.attach();
    mediaElement.classList.add('h-full', 'w-full', 'object-cover');

    if (mediaElement instanceof HTMLVideoElement) {
      mediaElement.autoplay = true;
      mediaElement.playsInline = true;
      mediaElement.muted = muted;
    }

    if (mediaElement instanceof HTMLAudioElement) {
      mediaElement.autoplay = true;
      mediaElement.muted = muted;
    }

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(mediaElement);

    return () => {
      try {
        track.detach(mediaElement);
        mediaElement.remove();
      } catch {
        // cleanup safe
      }
    };
  }, [muted, track]);

  return <div ref={containerRef} className={`relative overflow-hidden ${className}`} />;
}

function AttachedAudioTrack({ track }) {
  useEffect(() => {
    if (!track) return undefined;
    const audioElement = track.attach();

    if (audioElement instanceof HTMLAudioElement) {
      audioElement.autoplay = true;
      audioElement.muted = false;
      audioElement.hidden = true;
      document.body.appendChild(audioElement);
    }

    return () => {
      try {
        track.detach(audioElement);
        audioElement.remove();
      } catch {
        // cleanup safe
      }
    };
  }, [track]);

  return null;
}

export default function VideoChat({ sessionId, onTogglePiP, isFloating }) {
  const roomRef = useRef(null);
  const wrapperRef = useRef(null);

  const [bootState, setBootState] = useState('initializing'); // initializing | ready | connected | error | devMode
  const [tokenInfo, setTokenInfo] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteVideoTracks, setRemoteVideoTracks] = useState([]);
  const [remoteAudioTracks, setRemoteAudioTracks] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch token
  const loadToken = useCallback(async () => {
    if (!sessionId) return;
    setBootState('initializing');
    setErrorMessage('');
    try {
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          displayName: localStorage.getItem('last_tower_tag') || 'Learner',
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Video bootstrap failed');
      }

      setTokenInfo(payload.data);
      setBootState('ready');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to initialize video session');
      setBootState('error');
      setConnectionStatus('error');
    }
  }, [sessionId]);

  useEffect(() => {
    loadToken();
  }, [loadToken]);

  // Connect to LiveKit Room
  useEffect(() => {
    if (!tokenInfo || !tokenInfo.token || !tokenInfo.livekitUrl) {
      return undefined;
    }

    let disposed = false;
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });
    roomRef.current = room;

    const syncTracks = () => {
      if (disposed) return;

      // Local camera track
      let localCamera = null;
      room.localParticipant.videoTrackPublications.forEach((publication) => {
        if (publication.track && !publication.isMuted && publication.source === Track.Source.Camera) {
          localCamera = publication.track;
        }
      });
      setLocalVideoTrack(localCamera);

      // Remote video & audio tracks
      const vTracks = [];
      const aTracks = [];
      room.remoteParticipants.forEach((participant) => {
        participant.videoTrackPublications.forEach((publication, publicationSid) => {
          if (publication.track && !publication.isMuted && publication.isSubscribed) {
            vTracks.push({
              key: `${participant.identity}-${publicationSid}-video`,
              participantIdentity: participant.name || participant.identity,
              track: publication.track,
            });
          }
        });

        participant.audioTrackPublications.forEach((publication, publicationSid) => {
          if (publication.track && publication.isSubscribed) {
            aTracks.push({
              key: `${participant.identity}-${publicationSid}-audio`,
              participantIdentity: participant.name || participant.identity,
              track: publication.track,
            });
          }
        });
      });

      setRemoteVideoTracks(vTracks);
      setRemoteAudioTracks(aTracks);
    };

    const handleConnected = async () => {
      if (disposed) return;
      setConnectionStatus('connected');
      setBootState('connected');

      // Auto start media devices
      try {
        await Promise.allSettled([
          room.localParticipant.setCameraEnabled(true),
          room.localParticipant.setMicrophoneEnabled(true),
        ]);
        if (!disposed) {
          setCameraEnabled(room.localParticipant.isCameraEnabled);
          setMicEnabled(room.localParticipant.isMicrophoneEnabled);
          syncTracks();
        }
      } catch {
        // Device permission errors will be handled gracefully
      }
    };

    const handleDisconnected = () => {
      if (disposed) return;
      setConnectionStatus('disconnected');
      setCameraEnabled(false);
      setMicEnabled(false);
      setLocalVideoTrack(null);
      setRemoteVideoTracks([]);
      setRemoteAudioTracks([]);
    };

    const handleReconnecting = () => {
      if (disposed) return;
      setConnectionStatus('reconnecting');
    };

    room.on(RoomEvent.Connected, handleConnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);
    room.on(RoomEvent.Reconnecting, handleReconnecting);
    room.on(RoomEvent.Reconnected, handleConnected);
    room.on(RoomEvent.ParticipantConnected, syncTracks);
    room.on(RoomEvent.ParticipantDisconnected, syncTracks);
    room.on(RoomEvent.TrackSubscribed, syncTracks);
    room.on(RoomEvent.TrackUnsubscribed, syncTracks);
    room.on(RoomEvent.TrackMuted, syncTracks);
    room.on(RoomEvent.TrackUnmuted, syncTracks);
    room.on(RoomEvent.LocalTrackPublished, syncTracks);
    room.on(RoomEvent.LocalTrackUnpublished, syncTracks);

    setConnectionStatus('connecting');
    room.connect(tokenInfo.livekitUrl, tokenInfo.token).catch((err) => {
      if (disposed) return;
      setErrorMessage(err.message || 'Connection failed');
      setConnectionStatus('error');
      setBootState('error');
    });

    return () => {
      disposed = true;
      room.off(RoomEvent.Connected, handleConnected);
      room.off(RoomEvent.Disconnected, handleDisconnected);
      room.off(RoomEvent.Reconnecting, handleReconnecting);
      room.off(RoomEvent.Reconnected, handleConnected);
      room.off(RoomEvent.ParticipantConnected, syncTracks);
      room.off(RoomEvent.ParticipantDisconnected, syncTracks);
      room.off(RoomEvent.TrackSubscribed, syncTracks);
      room.off(RoomEvent.TrackUnsubscribed, syncTracks);
      room.off(RoomEvent.TrackMuted, syncTracks);
      room.off(RoomEvent.TrackUnmuted, syncTracks);
      room.off(RoomEvent.LocalTrackPublished, syncTracks);
      room.off(RoomEvent.LocalTrackUnpublished, syncTracks);
      room.disconnect();
      roomRef.current = null;
    };
  }, [tokenInfo]);

  // Controls
  const toggleCamera = async () => {
    const room = roomRef.current;
    if (!room) return;
    try {
      const next = !cameraEnabled;
      await room.localParticipant.setCameraEnabled(next);
      setCameraEnabled(room.localParticipant.isCameraEnabled);
    } catch (err) {
      setErrorMessage(`Camera error: ${err.message}`);
    }
  };

  const toggleMic = async () => {
    const room = roomRef.current;
    if (!room) return;
    try {
      const next = !micEnabled;
      await room.localParticipant.setMicrophoneEnabled(next);
      setMicEnabled(room.localParticipant.isMicrophoneEnabled);
    } catch (err) {
      setErrorMessage(`Mic error: ${err.message}`);
    }
  };

  const cycleCamera = async () => {
    const room = roomRef.current;
    if (!room || typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      if (videoDevices.length > 1) {
        const activeTrack = room.localParticipant.getTrackPublication(Track.Source.Camera)?.track;
        const currentId = activeTrack?.mediaStreamTrack?.getSettings()?.deviceId;
        const currentIndex = videoDevices.findIndex((d) => d.deviceId === currentId);
        const nextDevice = videoDevices[(currentIndex + 1) % videoDevices.length];
        await room.switchActiveDevice('videoinput', nextDevice.deviceId);
      }
    } catch {
      // cycling not supported
    }
  };

  const toggleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const leaveRoom = () => {
    roomRef.current?.disconnect();
    setConnectionStatus('disconnected');
  };

  const reconnect = () => {
    loadToken();
  };

  const primaryRemote = remoteVideoTracks[0] || null;

  return (
    <div
      ref={wrapperRef}
      data-testid="livekit-video-container"
      className="relative flex h-full w-full flex-col overflow-hidden bg-[#030914] text-white font-sans"
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_35%),linear-gradient(180deg,rgba(4,13,26,0.3),rgba(2,6,15,0.8))]" />

      {/* Mount remote audio tracks invisibly */}
      {remoteAudioTracks.map((aTrack) => (
        <AttachedAudioTrack key={aTrack.key} track={aTrack.track} />
      ))}

      {/* Top Header / Status bar */}
      <div className="relative z-20 flex shrink-0 items-center justify-between border-b border-white/10 bg-slate-950/70 px-3 py-2 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div
            className={`h-2.5 w-2.5 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]'
                : connectionStatus === 'connecting'
                ? 'animate-pulse bg-cyan-400'
                : 'bg-amber-400'
            }`}
          />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">
            {connectionStatus === 'connected' ? 'LIVE' : connectionStatus.toUpperCase()}
          </span>
          <span className="text-[10px] text-slate-400">|</span>
          <span className="truncate text-xs font-semibold text-slate-200">
            {tokenInfo?.roomName || `Room ${sessionId}`}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {onTogglePiP && (
            <button
              onClick={onTogglePiP}
              className="rounded-lg p-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
              title={isFloating ? 'Dock video' : 'Float video (PiP)'}
            >
              {isFloating ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}
          <button
            onClick={toggleFullscreen}
            className="rounded-lg p-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Video Stage Area */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black">
        {bootState === 'error' ? (
          <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
            <p className="text-xs font-semibold text-rose-300">{errorMessage || 'Unable to connect'}</p>
            <button
              onClick={reconnect}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-rose-200 transition hover:bg-rose-400/20"
            >
              <RefreshCw size={11} /> Retry
            </button>
          </div>
        ) : primaryRemote ? (
          // Primary remote view
          <div className="relative h-full w-full">
            <AttachedTrack track={primaryRemote.track} className="h-full w-full" />
            <div className="absolute bottom-2 left-2 z-10 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              {primaryRemote.participantIdentity}
            </div>
          </div>
        ) : (
          // Waiting placeholder
          <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
              <Users size={24} className="text-cyan-300" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500" />
              </span>
            </div>
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-white">
              Tutoring Stage Active
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              {cameraEnabled ? 'Camera on. Waiting for partner...' : 'Turn on camera or microphone below to connect.'}
            </p>
          </div>
        )}

        {/* Local Self-View PiP */}
        {localVideoTrack && (
          <div className="absolute bottom-2 right-2 z-20 h-20 w-28 overflow-hidden rounded-xl border border-white/20 bg-slate-900 shadow-xl transition-all sm:h-24 sm:w-32">
            <AttachedTrack track={localVideoTrack} muted className="h-full w-full" />
            <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[8px] font-bold text-white backdrop-blur-sm">
              You {micEnabled ? '' : '(Muted)'}
            </div>
          </div>
        )}
      </div>

      {/* Control Strip */}
      <div className="relative z-20 flex shrink-0 items-center justify-around border-t border-white/10 bg-slate-950/80 px-2 py-2 backdrop-blur-xl">
        {/* Mic Toggle */}
        <button
          onClick={toggleMic}
          className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all ${
            micEnabled
              ? 'border-white/10 bg-white/10 text-white hover:bg-white/20'
              : 'border-red-500/30 bg-red-500/20 text-red-300 hover:bg-red-500/30'
          }`}
          title={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          {micEnabled ? <Mic size={14} /> : <MicOff size={14} />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={toggleCamera}
          className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all ${
            cameraEnabled
              ? 'border-cyan-400/40 bg-cyan-400/20 text-cyan-200 hover:bg-cyan-400/30'
              : 'border-red-500/30 bg-red-500/20 text-red-300 hover:bg-red-500/30'
          }`}
          title={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
        >
          {cameraEnabled ? <Camera size={14} /> : <CameraOff size={14} />}
        </button>

        {/* Flip Camera */}
        <button
          onClick={cycleCamera}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-all hover:bg-white/10 hover:text-white"
          title="Switch camera"
        >
          <RefreshCw size={13} />
        </button>

        {/* Leave / Reconnect */}
        {connectionStatus === 'connected' ? (
          <button
            onClick={leaveRoom}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/40 bg-red-500/20 text-red-300 transition-all hover:bg-red-500/30"
            title="Leave video room"
          >
            <PhoneOff size={14} />
          </button>
        ) : (
          <button
            onClick={reconnect}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 transition-all hover:bg-emerald-500/30"
            title="Rejoin video room"
          >
            <Phone size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
