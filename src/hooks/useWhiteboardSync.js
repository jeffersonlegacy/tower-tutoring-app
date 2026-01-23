/**
 * useWhiteboardSync.js - Real-time Tldraw sync via Firestore
 * 
 * STRATEGY: 
 * - Use 'updateDoc' with dot notation (e.g. "records.shape:123") for granular updates.
 * - This prevents User A from overwriting User B's changes in other parts of the map.
 * - Uses deleteField() to remove records.
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { db } from '../services/firebase';
import { doc, onSnapshot, setDoc, updateDoc, getDoc, serverTimestamp, deleteField } from 'firebase/firestore';

// Unique ID per browser tab (prevents self-echo)
const INSTANCE_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function useWhiteboardSync(editor, sessionId) {
    const isApplyingRemote = useRef(false);
    // Stores the last known SERVER state of records (keys only or hash) to calc local diffs
    const lastServerState = useRef({}); 
    const syncTimeout = useRef(null);
    const isFirstLoad = useRef(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Online/Offline listeners
    useEffect(() => {
        const setOnline = () => setIsOnline(true);
        const setOffline = () => setIsOnline(false);
        window.addEventListener('online', setOnline);
        window.addEventListener('offline', setOffline);
        return () => {
            window.removeEventListener('online', setOnline);
            window.removeEventListener('offline', setOffline);
        };
    }, []);

    // 1. PUSH: Calculate diff and send granular updates
    const pushToFirebase = useCallback(async () => {
        if (!editor || !sessionId || isApplyingRemote.current) return;

        try {
            const currentRecords = editor.store.allRecords();
            const currentMap = new Map(currentRecords.map(r => [r.id, r]));
            const updates = {};
            let hasChanges = false;

            // Find Added / Updated
            for (const record of currentRecords) {
                const lastKnown = lastServerState.current[record.id];
                // Simple equality check (JSON stringify is fast enough for individual records)
                if (!lastKnown || JSON.stringify(lastKnown) !== JSON.stringify(record)) {
                    updates[`records.${record.id}`] = record;
                    hasChanges = true;
                }
            }

            // Find Removed
            const previousIds = Object.keys(lastServerState.current);
            for (const id of previousIds) {
                if (!currentMap.has(id)) {
                    updates[`records.${id}`] = deleteField();
                    hasChanges = true;
                }
            }

            if (!hasChanges) return;

            // Optimistically update our "last known server state"
            // (If the write fails, we might be out of sync, but the next snapshot will fix us)
            currentRecords.forEach(r => {
                lastServerState.current[r.id] = r;
            });
            previousIds.forEach(id => {
                if (!currentMap.has(id)) {
                    delete lastServerState.current[id];
                }
            });

            const docRef = doc(db, 'whiteboards', sessionId);
            
            // Add metadata
            updates.instanceId = INSTANCE_ID;
            updates.updatedAt = serverTimestamp();

            await updateDoc(docRef, updates);
            // console.log('[Sync] Pushed granular updates:', Object.keys(updates).length);

        } catch (err) {
            // If document doesn't exist, we must create it (fallback)
            if (err.code === 'not-found') {
                console.warn('[Sync] Doc not found, creating fresh...');
                const allRecords = editor.store.allRecords();
                const recordsObj = {};
                allRecords.forEach(r => recordsObj[r.id] = r);
                
                await setDoc(doc(db, 'whiteboards', sessionId), {
                    records: recordsObj,
                    instanceId: INSTANCE_ID,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                
                // Update local tracking
                allRecords.forEach(r => lastServerState.current[r.id] = r);
            } else if (!err.message?.includes('offline')) {
                console.error('[Sync] Push error:', err);
            }
        }
    }, [editor, sessionId]);

    // Debounced sync
    const scheduleSync = useCallback(() => {
        clearTimeout(syncTimeout.current);
        syncTimeout.current = setTimeout(pushToFirebase, 100); // 100ms debounce
    }, [pushToFirebase]);

    useEffect(() => {
        if (!editor || !sessionId) return;

        console.log('[Sync] Starting | Session:', sessionId);
        const docRef = doc(db, 'whiteboards', sessionId);

        // 2. LISTEN: Receive remote updates
        const unsubscribeSnapshot = onSnapshot(docRef, (snapshot) => {
            if (!snapshot.exists()) {
                // If doc deleted, maybe clear board? For now do nothing.
                return;
            }

            const data = snapshot.data();

            // Skip if this update originated from us
            if (data.instanceId === INSTANCE_ID && !isFirstLoad.current) {
                return;
            }

            if (!data.records || typeof data.records !== 'object') return;

            isApplyingRemote.current = true;
            isFirstLoad.current = false;

            try {
                // Update our truth source
                lastServerState.current = { ...data.records };

                const remoteRecords = Object.values(data.records);
                const localRecords = editor.store.allRecords();
                
                // Diffing for the store
                const remoteMap = new Map(Object.entries(data.records));
                
                // UPSERT (Add/Update)
                const toUpsert = [];
                for (const r of remoteRecords) {
                    const local = editor.store.get(r.id);
                    // Only update if different
                    if (!local || JSON.stringify(local) !== JSON.stringify(r)) {
                        toUpsert.push(r);
                    }
                }

                // REMOVE (Exist locally but not remotely)
                // Only remove if it's a shape/asset that was actually deleted remotely
                // We rely on the fact that 'data.records' is the source of truth
                const toRemove = localRecords
                    .filter(l => !remoteMap.has(l.id) && (l.typeName === 'shape' || l.typeName === 'asset'))
                    .map(l => l.id);

                if (toUpsert.length > 0) {
                    editor.store.put(toUpsert);
                }
                if (toRemove.length > 0) {
                    editor.store.remove(toRemove);
                }
                
                // console.log(`[Sync] Applied: +${toUpsert.length} -${toRemove.length}`);

            } catch (e) {
                console.warn('[Sync] Apply error:', e);
            } finally {
                // Short timeout to ensure store events settle before we allow pushing again
                const timer = setTimeout(() => {
                    isApplyingRemote.current = false;
                }, 50);
                return () => clearTimeout(timer); // cleanup in case of fast updates
            }
        });

        // 3. LISTEN TO LOCAL: Detect user changes
        const unlistenStore = editor.store.listen((entry) => {
            if (isApplyingRemote.current) return;

            const hasChanges =
                Object.keys(entry.changes.added || {}).length > 0 ||
                Object.keys(entry.changes.updated || {}).length > 0 ||
                Object.keys(entry.changes.removed || {}).length > 0;

            if (hasChanges) {
                scheduleSync();
            }
        });

        // Force push on blur
        const handleBlur = () => {
             pushToFirebase();
        };
        window.addEventListener('blur', handleBlur);
        window.addEventListener('beforeunload', handleBlur);

        return () => {
            clearTimeout(syncTimeout.current);
            unlistenStore();
            unsubscribeSnapshot();
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('beforeunload', handleBlur);
        };
    }, [editor, sessionId, scheduleSync, pushToFirebase]);

    return { isOnline };
}
