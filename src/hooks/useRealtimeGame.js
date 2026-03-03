import { useState, useEffect, useRef, useCallback } from 'react';
import { rtdb } from '../services/firebase';
import { ref, onValue, set, update, get, onDisconnect } from 'firebase/database';

const HEARTBEAT_MS = 5000;
const STALE_PLAYER_MS = 70 * 1000;
const ABANDONED_MATCH_MS = 2 * 60 * 1000;

function deriveLifecycle(status, fallback = 'lobby') {
    const normalized = typeof status === 'string' ? status.toUpperCase() : '';
    if (normalized === 'WAITING' || normalized === 'MENU' || normalized === 'LOBBY') return 'lobby';
    if (normalized === 'PLAYING' || normalized === 'ACTIVE') return 'active';
    if (normalized === 'FINISHED' || normalized === 'COMPLETED') return 'completed';
    if (normalized === 'ABANDONED') return 'abandoned';
    return fallback;
}

/**
 * useRealtimeGame - Multiplayer game state synchronization
 * Uses Firebase Realtime Database for low-latency sync
 */
export function useRealtimeGame(sessionId, gameId, initialState) {
    // Generate stable player ID per browser session
    const [playerId] = useState(() => {
        const storageKey = `tower_player_${gameId}`;
        let pid = sessionStorage.getItem(storageKey);
        if (!pid) {
            pid = `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
            sessionStorage.setItem(storageKey, pid);
        }
        return pid;
    });

    const [gameState, setGameState] = useState(null);
    const [isHost, setIsHost] = useState(false);
    const [isOffline, setIsOffline] = useState(!rtdb);
    const [connectionStatus, setConnectionStatus] = useState('connecting');

    const gameStateRef = useRef(null);
    const initialStateRef = useRef(initialState);
    const unsubscribeRef = useRef(null);
    const isOfflineRef = useRef(false);

    // Initialize and subscribe
    useEffect(() => {
        if (!sessionId || !gameId || !playerId || !rtdb) {
            // Offline fallback
            setIsOffline(true);
            isOfflineRef.current = true;
            setIsHost(true);
            setConnectionStatus('offline');
            const offlineState = {
                ...initialStateRef.current,
                players: { [playerId]: { id: playerId, role: 'host', lastSeen: Date.now() } },
                hostId: playerId,
                lifecycle: deriveLifecycle(initialStateRef.current?.status),
                revision: 1,
                lastUpdated: Date.now(),
                updatedBy: playerId,
            };
            setGameState(offlineState);
            gameStateRef.current = offlineState;
            return;
        }

        const gameRef = ref(rtdb, `sessions/${sessionId}/games/${gameId}`);
        const playerRef = ref(rtdb, `sessions/${sessionId}/games/${gameId}/players/${playerId}`);

        let mounted = true;

        const init = async () => {
            try {
                setConnectionStatus('connecting');

                // Check if game exists
                const snapshot = await get(gameRef);

                if (!mounted) return;

                if (!snapshot.exists()) {
                    // Create game as host
                    console.log('[RTDB] Creating game as HOST');
                    const hostState = {
                        ...initialStateRef.current,
                        hostId: playerId,
                        players: {
                            [playerId]: {
                                id: playerId,
                                role: 'host',
                                connectedAt: Date.now(),
                                lastSeen: Date.now(),
                            },
                        },
                        lifecycle: deriveLifecycle(initialStateRef.current?.status),
                        revision: 1,
                        createdAt: Date.now(),
                        lastUpdated: Date.now(),
                        updatedBy: playerId,
                    };
                    await set(gameRef, hostState);
                    setIsHost(true);
                    setGameState(hostState);
                    gameStateRef.current = hostState;
                } else {
                    // Join as client
                    const data = snapshot.val();
                    const amHost = data.hostId === playerId;
                    setIsHost(amHost);

                    if (!amHost) {
                        console.log('[RTDB] Joining as CLIENT');
                        // Register as player
                        await update(gameRef, {
                            [`players/${playerId}`]: {
                                id: playerId,
                                role: 'client',
                                connectedAt: Date.now(),
                                lastSeen: Date.now(),
                            },
                        });
                    }

                    setGameState(data);
                    gameStateRef.current = data;
                }

                // Set up disconnect cleanup
                onDisconnect(playerRef).remove();

                // Subscribe to changes
                unsubscribeRef.current = onValue(gameRef, (snap) => {
                    if (!mounted) return;
                    const data = snap.val();
                    if (data) {
                        const incomingUpdated = Number(data.lastUpdated || 0);
                        const localUpdated = Number(gameStateRef.current?.lastUpdated || 0);
                        if (localUpdated > 0 && incomingUpdated > 0 && incomingUpdated + 1500 < localUpdated) {
                            return;
                        }

                        setGameState(data);
                        gameStateRef.current = data;

                        // Update host status if it changed
                        setIsHost(data.hostId === playerId);

                        // Host failover: if host is missing, lexicographically first connected player becomes host
                        const players = data.players || {};
                        const playerIds = Object.keys(players);
                        const hostMissing = !data.hostId || !players[data.hostId];
                        if (hostMissing && playerIds.length > 0) {
                            const nextHost = [...playerIds].sort()[0];
                            if (nextHost === playerId) {
                                update(gameRef, {
                                    hostId: playerId,
                                    lastUpdated: Date.now(),
                                    updatedBy: 'host_failover',
                                }).catch((error) => {
                                    console.warn('[RTDB] Host failover update error:', error);
                                });
                            }
                        }
                    }
                }, (error) => {
                    console.error('[RTDB] Subscription error:', error);
                    setConnectionStatus('error');
                });

                setConnectionStatus('connected');
                setIsOffline(false);
                isOfflineRef.current = false;

            } catch (err) {
                console.error('[RTDB] Init error:', err);
                if (!mounted) return;

                // Fallback to offline mode
                setIsOffline(true);
                isOfflineRef.current = true;
                setIsHost(true);
                setConnectionStatus('offline');
                const fallbackState = {
                    ...initialStateRef.current,
                    players: { [playerId]: { id: playerId, role: 'host', lastSeen: Date.now() } },
                    hostId: playerId,
                    lifecycle: deriveLifecycle(initialStateRef.current?.status),
                    revision: 1,
                    lastUpdated: Date.now(),
                    updatedBy: playerId,
                };
                setGameState(fallbackState);
                gameStateRef.current = fallbackState;
            }
        };

        init();

        // Heartbeat to show presence
        const heartbeat = setInterval(() => {
            if (!isOfflineRef.current && rtdb) {
                update(ref(rtdb, `sessions/${sessionId}/games/${gameId}/players/${playerId}`), {
                    lastSeen: Date.now()
                }).catch(() => { });
            }
        }, HEARTBEAT_MS);

        // Stale user cleanup (runs every 30 seconds, host only)
        const staleCleanup = setInterval(async () => {
            if (isOfflineRef.current || !rtdb) return;

            // Only host cleans up stale users
            const currentState = gameStateRef.current;
            if (!currentState || currentState.hostId !== playerId) return;

            const players = currentState.players;
            if (!players || typeof players !== 'object') return;

            const now = Date.now();
            const staleIds = [];

            Object.entries(players).forEach(([pid, pdata]) => {
                // Don't remove bots or the current player
                if (pid === playerId) return;
                if (pdata?.isBot) return;

                const lastSeen = pdata?.lastSeen || 0;
                if (now - lastSeen > STALE_PLAYER_MS) {
                    staleIds.push(pid);
                }
            });

            // Remove stale players
            if (staleIds.length > 0) {
                console.log('[RTDB] Removing stale players:', staleIds);
                const updates = {};
                staleIds.forEach(pid => {
                    updates[`sessions/${sessionId}/games/${gameId}/players/${pid}`] = null;
                });
                update(ref(rtdb), updates).catch(err => console.warn('[RTDB] Stale cleanup error:', err));
            }

            // Match abandonment detection for active/waiting lobbies with no active opponents.
            const activePlayers = Object.values(players).filter(Boolean);
            const nonHostPlayers = activePlayers.filter((p) => p?.id !== playerId && !p?.isBot);
            const lifecycle = currentState.lifecycle || deriveLifecycle(currentState.status);
            const idleFor = now - Number(currentState.lastUpdated || currentState.createdAt || now);

            if (
                (lifecycle === 'active' || lifecycle === 'lobby') &&
                nonHostPlayers.length === 0 &&
                idleFor > ABANDONED_MATCH_MS
            ) {
                update(ref(rtdb, `sessions/${sessionId}/games/${gameId}`), {
                    lifecycle: 'abandoned',
                    abandonedAt: now,
                    lastUpdated: now,
                    updatedBy: 'abandonment_guard',
                    revision: Number(currentState.revision || 0) + 1,
                }).catch((err) => console.warn('[RTDB] Abandonment update error:', err));
            }
        }, 30000); // Check every 30 seconds

        return () => {
            mounted = false;
            clearInterval(heartbeat);
            clearInterval(staleCleanup);
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, [sessionId, gameId, playerId]);

    // Update function
    const updateState = useCallback((updates) => {
        if (!sessionId || !gameId) return;

        const currentState = gameStateRef.current || {};
        const nextLifecycle = updates?.lifecycle
            || deriveLifecycle(updates?.status, currentState.lifecycle || deriveLifecycle(currentState.status));

        const newUpdates = {
            ...updates,
            lifecycle: nextLifecycle,
            revision: Number(currentState.revision || 0) + 1,
            updatedBy: playerId,
            lastUpdated: Date.now(),
        };

        if (isOffline) {
            // Local update
            const newState = { ...currentState, ...newUpdates };

            // Handle path updates like 'players/abc'
            Object.keys(updates).forEach(key => {
                if (key.includes('/')) {
                    const [root, sub] = key.split('/');
                    if (newState[root] && typeof newState[root] === 'object') {
                        newState[root] = { ...newState[root], [sub]: updates[key] };
                    }
                    delete newState[key];
                }
            });

            setGameState(newState);
            gameStateRef.current = newState;
        } else {
            // Firebase update
            const gameRef = ref(rtdb, `sessions/${sessionId}/games/${gameId}`);
            update(gameRef, newUpdates).catch(err => {
                console.error('[RTDB] Update failed:', err);
            });
        }
    }, [sessionId, gameId, isOffline]);

    // Reset game (host only)
    const resetGame = useCallback(() => {
        if (!isHost) return;

        const currentState = gameStateRef.current || {};
        const now = Date.now();

        const resetState = {
            ...initialStateRef.current,
            hostId: playerId,
            players: currentState?.players || { [playerId]: { id: playerId, role: 'host', lastSeen: now } },
            lifecycle: 'lobby',
            revision: Number(currentState.revision || 0) + 1,
            updatedBy: playerId,
            lastUpdated: now,
        };

        if (isOffline) {
            setGameState(resetState);
            gameStateRef.current = resetState;
        } else {
            const gameRef = ref(rtdb, `sessions/${sessionId}/games/${gameId}`);
            set(gameRef, resetState).catch(console.error);
        }
    }, [isHost, isOffline, sessionId, gameId, playerId]);

    // Get player count
    const playerCount = gameState?.players ? Object.keys(gameState.players).length : 0;

    return {
        gameState,
        playerId,
        isHost,
        updateState,
        resetGame,
        isOffline,
        connectionStatus,
        playerCount
    };
}
