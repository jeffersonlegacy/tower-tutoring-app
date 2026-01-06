/**
 * useWhiteboardSync.js - FIXED for tldraw v3
 * 
 * ROOT CAUSE: editor.store.loadSnapshot() API changed in tldraw v3.
 * FIX: Use record-level operations (put/remove) instead of full snapshots.
 */
import { useEffect, useRef, useCallback } from 'react';
import { db } from '../services/firebase';
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// Unique ID per browser tab (prevents self-echo)
const INSTANCE_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function useWhiteboardSync(editor, sessionId) {
    const isApplyingRemote = useRef(false);
    const lastSyncedData = useRef(null);
    const syncTimeout = useRef(null);

    // Sync local changes to Firebase
    const pushToFirebase = useCallback(async () => {
        if (!editor || !sessionId || isApplyingRemote.current) return;

        try {
            // Get all records from the store
            const allRecords = editor.store.allRecords();

            // Convert to a plain object keyed by ID
            const recordsObj = {};
            for (const record of allRecords) {
                recordsObj[record.id] = record;
            }

            const dataStr = JSON.stringify(recordsObj);

            // Skip if nothing changed
            if (dataStr === lastSyncedData.current) return;

            lastSyncedData.current = dataStr;

            const docRef = doc(db, 'whiteboards', sessionId);
            await setDoc(docRef, {
                records: recordsObj,
                instanceId: INSTANCE_ID,
                updatedAt: serverTimestamp()
            });

            console.log('[Sync] Pushed', Object.keys(recordsObj).length, 'records to Firebase');
        } catch (err) {
            if (!err.message?.includes('offline')) {
                console.error('[Sync] Push error:', err);
            }
        }
    }, [editor, sessionId]);

    // Debounced sync
    const scheduleSync = useCallback(() => {
        clearTimeout(syncTimeout.current);
        syncTimeout.current = setTimeout(pushToFirebase, 150);
    }, [pushToFirebase]);

    useEffect(() => {
        if (!editor || !sessionId) return;

        console.log('[Sync] Starting | Session:', sessionId, '| Instance:', INSTANCE_ID);
        const docRef = doc(db, 'whiteboards', sessionId);

        // Load initial state
        const loadInitial = async () => {
            try {
                const snapshot = await getDoc(docRef);
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    if (data.records && typeof data.records === 'object') {
                        const recordsArray = Object.values(data.records);
                        if (recordsArray.length > 0) {
                            console.log('[Sync] Loading', recordsArray.length, 'records from Firebase');
                            isApplyingRemote.current = true;

                            try {
                                // TLDRAW V3 FIX: Use put() for each record
                                editor.store.put(recordsArray);
                                lastSyncedData.current = JSON.stringify(data.records);
                            } catch (e) {
                                console.warn('[Sync] Initial load error:', e.message);
                            }

                            isApplyingRemote.current = false;
                        }
                    }
                } else {
                    // Create initial document
                    console.log('[Sync] Creating new whiteboard');
                    const allRecords = editor.store.allRecords();
                    const recordsObj = {};
                    for (const record of allRecords) {
                        recordsObj[record.id] = record;
                    }
                    await setDoc(docRef, {
                        records: recordsObj,
                        instanceId: INSTANCE_ID,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                    lastSyncedData.current = JSON.stringify(recordsObj);
                }
            } catch (err) {
                if (!err.message?.includes('offline')) {
                    console.error('[Sync] Init error:', err);
                }
            }
        };

        loadInitial();

        // Listen to local changes
        const unlistenStore = editor.store.listen((entry) => {
            if (isApplyingRemote.current) return;

            // Check if there are actual shape changes
            const hasChanges =
                Object.keys(entry.changes.added || {}).length > 0 ||
                Object.keys(entry.changes.updated || {}).length > 0 ||
                Object.keys(entry.changes.removed || {}).length > 0;

            if (hasChanges) {
                scheduleSync();
            }
        });

        // Listen to remote changes
        const unsubscribeSnapshot = onSnapshot(docRef, (snapshot) => {
            if (!snapshot.exists()) return;

            const data = snapshot.data();

            // Skip our own updates
            if (data.instanceId === INSTANCE_ID) {
                return;
            }

            if (!data.records || typeof data.records !== 'object') return;

            const remoteDataStr = JSON.stringify(data.records);
            if (remoteDataStr === lastSyncedData.current) return;

            console.log('[Sync] Applying remote changes from:', data.instanceId);
            isApplyingRemote.current = true;
            lastSyncedData.current = remoteDataStr;

            try {
                const remoteRecords = Object.values(data.records);
                const localRecords = editor.store.allRecords();

                // Find records to add/update
                const localIds = new Set(localRecords.map(r => r.id));
                const remoteIds = new Set(Object.keys(data.records));

                // Records to add or update
                const toUpsert = remoteRecords.filter(r => {
                    const local = localRecords.find(l => l.id === r.id);
                    if (!local) return true; // new record
                    return JSON.stringify(local) !== JSON.stringify(r); // changed
                });

                // Records to remove (exist locally but not remotely)
                const toRemove = localRecords
                    .filter(r => !remoteIds.has(r.id))
                    .filter(r => r.typeName === 'shape') // Only remove shapes, not camera/page
                    .map(r => r.id);

                if (toUpsert.length > 0) {
                    editor.store.put(toUpsert);
                    console.log('[Sync] Added/updated', toUpsert.length, 'records');
                }

                if (toRemove.length > 0) {
                    editor.store.remove(toRemove);
                    console.log('[Sync] Removed', toRemove.length, 'records');
                }
            } catch (e) {
                console.warn('[Sync] Apply error:', e.message);
            }

            isApplyingRemote.current = false;
        }, (err) => {
            console.error('[Sync] Listener error:', err);
        });

        // Sync on blur
        const handleBlur = () => {
            clearTimeout(syncTimeout.current);
            pushToFirebase();
        };
        window.addEventListener('blur', handleBlur);

        return () => {
            console.log('[Sync] Cleanup');
            clearTimeout(syncTimeout.current);
            unlistenStore();
            unsubscribeSnapshot();
            window.removeEventListener('blur', handleBlur);
        };
    }, [editor, sessionId, scheduleSync, pushToFirebase]);
}
