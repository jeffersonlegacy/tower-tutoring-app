import { useState, useEffect, useRef } from 'react';
import { rtdb } from '../services/firebase';
import { ref, onValue, set, update, get } from 'firebase/database';


/**
 * useRealtimeGame
 * Synchronizes game state using Firebase Realtime Database (faster than Firestore).
 * 
 * @param {string} sessionId - Current session ID
 * @param {string} gameId - Unique Game ID
 * @param {object} initialState - Initial state if creating new
 */
export function useRealtimeGame(sessionId, gameId, initialState) {
    const [gameState, setGameState] = useState(() => !rtdb ? initialState : null);
    const [playerId] = useState(() => {
        let pid = sessionStorage.getItem('battleship_pid');
        if (!pid) {
            pid = Math.random().toString(36).substring(2, 9);
            sessionStorage.setItem('battleship_pid', pid);
        }
        return pid;
    });

    const [isHost, setIsHost] = useState(() => !rtdb);
    const [isOffline, setIsOffline] = useState(() => !rtdb);

    // Refs
    const gameStateRef = useRef(initialState);
    const initialStateRef = useRef(initialState); // Stable ref for initial state

    // 2. Subscribe (Enhanced with Timeout)
    useEffect(() => {
        if (!sessionId || !gameId || !playerId) return;

        const gameRef = ref(rtdb, `sessions/${sessionId}/games/${gameId}`);
        let unsubscribe = () => { };
        let connectionTimeout;

        // Function to start offline mode
        const goOffline = () => {
            console.warn("[RTDB] Connection timed out or failed. Switching to OFFLINE mode.");
            setIsOffline(true);
            setIsHost(true); // You are always host in offline mode
            setGameState({
                ...initialStateRef.current,
                players: { [playerId]: { id: playerId, role: 'host' } },
                mode: 'SOLO' // Force solo mode usually, but keep flexible
            });
        };

        // Race Connection vs Timeout
        const connect = async () => {
            try {
                // Set a timeout to failover if Firebase hangs (common in restricted networks/bad config)
                const timeoutPromise = new Promise((_, reject) =>
                    connectionTimeout = setTimeout(() => reject(new Error("Timeout")), 3000)
                );

                // Initial fetch race
                await Promise.race([get(gameRef), timeoutPromise]);
                clearTimeout(connectionTimeout);

                console.log("[RTDB] Connected successfully.");

                // standard init logic...
                const snapshot = await get(gameRef);
                if (!snapshot.exists()) {
                    console.log("[RTDB] Initializing as HOST");
                    const startState = {
                        ...initialStateRef.current,
                        hostId: playerId,
                        players: { [playerId]: { id: playerId, role: 'host' } },
                        lastUpdated: Date.now()
                    };
                    set(gameRef, startState);
                    setIsHost(true);
                } else {
                    const data = snapshot.val();
                    if (data.hostId === playerId) {
                        setIsHost(true);
                    } else {
                        console.log("[RTDB] Joining as CLIENT");
                        update(gameRef, {
                            [`players/${playerId}`]: { id: playerId, role: 'client' }
                        });
                    }
                }

                // Subscribe
                unsubscribe = onValue(gameRef, (snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        setGameState(data);
                        gameStateRef.current = data;
                    }
                });

            } catch (err) {
                console.error("[RTDB] Connection Error:", err);
                goOffline();
            }
        };

        connect();

        return () => {
            clearTimeout(connectionTimeout);
            unsubscribe();
        };
    }, [sessionId, gameId, playerId]); // Removed initialState dependency

    // 3. Update Function (Dual Mode)
    const updateState = (updates) => {
        if (!sessionId || !gameId) return;

        if (isOffline) {
            // Local State Update
            const newState = {
                ...gameStateRef.current, // Use ref for latest state
                ...gameState,            // Merge current state
                ...updates,
                lastUpdated: Date.now()
            };

            // Allow deep updates (simple simulation of Firebase path updates like 'players/id')
            // For now, simple object merge is usually enough for local, 
            // but complex path updates might need lodash set. 
            // We'll stick to shallow merge + specific sub-objects for now as used in games.

            // Check for specific path updates used in games (e.g. 'board/5')
            // This simple mock doesn't handle 'board/5': 'X' syntax passed to update() typically.
            // We need to handle that if games use it.
            // ...Refactoring games to send full objects is safer, or we parse keys here.

            // Basic key handling for slash paths (e.g., 'players/abc')
            Object.keys(updates).forEach(key => {
                if (key.includes('/')) {
                    const parts = key.split('/');
                    const root = parts[0];
                    const sub = parts[1];
                    if (newState[root] && typeof newState[root] === 'object') {
                        newState[root] = { ...newState[root], [sub]: updates[key] };
                    }
                    delete newState[key]; // remove the slash key from root
                }
            });

            setGameState(newState);
            gameStateRef.current = newState;
        } else {
            // Online Update
            const gameRef = ref(rtdb, `sessions/${sessionId}/games/${gameId}`);
            update(gameRef, {
                ...updates,
                lastUpdated: Date.now()
            });
        }
    };

    return { gameState, playerId, isHost, updateState, isOffline };
}
