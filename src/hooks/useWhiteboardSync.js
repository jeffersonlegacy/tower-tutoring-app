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

            // Find Added / Updated (Filter out ephemeral records to save bandwidth/CPU)
            const SYNC_EXCLUDES = ['instance', 'camera', 'pointer', 'instance_presence'];
            
            for (const record of currentRecords) {
                if (SYNC_EXCLUDES.includes(record.typeName)) continue;

                const lastKnown = lastServerState.current[record.id];
                // Simple equality check
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
        const unsubscribeSnapshot = onSnapshot(docRef, { includeMetadataChanges: true }, (snapshot) => {
            // 1. Strict Local Filter: If these are our own pending writes, IGNORE.
            // This stops the "fighting" where the server echoes back our own movement 50ms later.
            if (snapshot.metadata.hasPendingWrites) {
                return;
            }

            if (!snapshot.exists()) return;

            const data = snapshot.data();
            
            // Backup check: Instance ID (in case metadata fails or mixed updates)
            if (data.instanceId === INSTANCE_ID && !isFirstLoad.current) return;
            if (!data.records || typeof data.records !== 'object') return;

            // SAFETY: Prevent accidental wipes
            const remoteRecords = Object.values(data.records);
            const localRecords = editor.store.allRecords();
            if (remoteRecords.length === 0 && localRecords.length > 5 && !isFirstLoad.current) {
                console.warn('[Sync] Ignoring suspicious empty update');
                return;
            }

            isApplyingRemote.current = true;
            isFirstLoad.current = false;

            try {
                lastServerState.current = { ...data.records };
                const remoteMap = new Map(Object.entries(data.records));

                // 2. Anti-Jitter: IDENTIFY PROTECTED SHAPES
                // Don't let the server move shapes the user is currently holding/selecting.
                const selectedIds = new Set(editor.getSelectedShapeIds());

                // UPSERT (Add/Update)
                const toUpsert = [];
                for (const r of remoteRecords) {
                    // Skip if user is holding this shape
                    if (selectedIds.has(r.id)) continue;

                    const local = editor.store.get(r.id);
                    if (!local || JSON.stringify(local) !== JSON.stringify(r)) {
                        toUpsert.push(r);
                    }
                }

                // REMOVE (Exist locally but not remotely)
                const toRemove = localRecords
                    .filter(l => {
                        const isPermanentType = l.typeName === 'shape' || l.typeName === 'asset' || l.typeName === 'binding';
                        // Don't delete if user has it selected (unlikely but safe)
                        if (selectedIds.has(l.id)) return false;
                        
                        return isPermanentType && !remoteMap.has(l.id);
                    })
                    .map(l => l.id);

                // Apply changes
                editor.store.mergeRemoteChanges(() => {
                    if (toUpsert.length > 0) editor.store.put(toUpsert);
                    if (toRemove.length > 0) editor.store.remove(toRemove);
                });

            } catch (e) {
                console.warn('[Sync] Apply error:', e);
            } finally {
                setTimeout(() => {
                    isApplyingRemote.current = false;
                }, 50);
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
