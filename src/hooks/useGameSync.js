import { useState, useEffect, useRef } from 'react';
import { db } from '../services/firebase';
import { doc, onSnapshot, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import throttle from 'lodash/throttle';

/**
 * useGameSync
 * A hook for optimized, throttled synchronization of game state.
 * 
 * @param {string} sessionId - The ID of the current session
 * @param {string} gameId - Unique identifier for the game instance (e.g. 'airhockey_v1')
 * @param {object} initialState - The starting state if creating a new game
 * @returns {object} { gameState, isHost, updateState }
 */
export function useGameSync(sessionId, gameId, initialState) {
    const [gameState, setGameState] = useState(null);
    const [isHost, setIsHost] = useState(false);
    const [playerId, setPlayerId] = useState(null);

    // Refs to avoid closure staleness in throttled functions
    const gameStateRef = useRef(initialState);
    const isHostRef = useRef(false);

    // Generate a semi-persistent player ID for this session loaded
    useEffect(() => {
        let pid = sessionStorage.getItem('ah_pid');
        if (!pid) {
            pid = Math.random().toString(36).substring(7);
            sessionStorage.setItem('ah_pid', pid);
        }
        setPlayerId(pid);
    }, []);

    useEffect(() => {
        if (!sessionId || !gameId || !playerId) return;

        const gameDocRef = doc(db, 'whiteboards', sessionId, 'games', gameId);

        // 1. Initialize / Join
        const initGame = async () => {
            try {
                const snap = await getDoc(gameDocRef);

                if (!snap.exists()) {
                    // No game exists? I am the HOST.
                    console.log("[GameSync] initializing as HOST");
                    await setDoc(gameDocRef, {
                        ...initialState,
                        hostId: playerId,
                        players: [playerId],
                        lastUpdated: Date.now()
                    });
                    setIsHost(true);
                    isHostRef.current = true;
                } else {
                    const data = snap.data();
                    // If I am the recorded host, resume as host.
                    if (data.hostId === playerId) {
                        console.log("[GameSync] Resuming as HOST");
                        setIsHost(true);
                        isHostRef.current = true;
                    } else {
                        console.log("[GameSync] Joining as PEER");
                        setIsHost(false);
                        isHostRef.current = false;

                        // Register as second player if needed (optional for simple air hockey)
                        if (!data.players.includes(playerId)) {
                            // strictly simplistic: just add to array. Real app might check max players.
                            updateDoc(gameDocRef, {
                                players: [...data.players, playerId]
                            }).catch(() => { });
                        }
                    }
                }
            } catch (e) {
                console.error("Error init game:", e);
            }
        };

        initGame();

        // 2. Subscribe to updates
        const unsubscribe = onSnapshot(gameDocRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();

                // If I am NOT the host, I should strictly listen to the state
                // If I AM the host, I might still want to listen for the OTHER player's inputs 
                // (but for this simple implementation, we might just merge states)

                setGameState(prev => {
                    // Basic merge: In a real game, would be more complex authoritative reconciliation.
                    // For Air Hockey:
                    // Host cares about Client's Paddle Position.
                    // Client cares about EVERYTHING (Puck + Host Paddle).
                    return data;
                });
                gameStateRef.current = data;
            }
        });

        return () => unsubscribe();
    }, [sessionId, gameId, playerId]);

    // 3. Throttled Updater
    // We use a ref to the throttle function so it persists across renders
    const throttledUpdate = useRef(
        throttle(async (newState) => {
            if (!sessionId || !gameId) return;
            const gameDocRef = doc(db, 'whiteboards', sessionId, 'games', gameId);
            try {
                // We barely modify the timestamp to force a remote trigger if data is same, 
                // but usually data is different.
                await updateDoc(gameDocRef, {
                    ...newState,
                    // eslint-disable-next-line react-hooks/purity
                    lastUpdated: Date.now()
                });
            } catch (e) {
                console.warn("Throttled update failed", e);
            }
        }, 100, { leading: true, trailing: true })
    ).current;

    const updateState = (newState) => {
        // Optimistic local update (optional, usually handled by game loop anyway)
        // setGameState(prev => ({...prev, ...newState})); 

        // Push to DB
        throttledUpdate(newState);
    };

    return { gameState, isHost, updateState, playerId };
}
