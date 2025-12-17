import { useEffect, useRef } from 'react';
import { db } from '../services/firebase';
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from 'firebase/firestore';

export function useWhiteboardSync(editor, sessionId) {
    const isRemoteUpdate = useRef(false);

    useEffect(() => {
        if (!editor || !sessionId) return;

        const docRef = doc(db, 'whiteboards', sessionId);

        // Initial Load
        const initLoad = async () => {
            const snapshot = await getDoc(docRef);
            if (snapshot.exists()) {
                const data = snapshot.data();
                if (data.records) {
                    isRemoteUpdate.current = true;
                    editor.store.loadSnapshot({
                        document: { id: 'td-document', records: data.records },
                        schema: editor.store.schema.serialize()
                    });
                    isRemoteUpdate.current = false;
                }
            } else {
                await setDoc(docRef, { records: editor.store.serialize() });
            }
        };

        initLoad();

        // Local -> Remote Sync
        const unlisten = editor.store.listen((entry) => {
            if (entry.source === 'user' && !isRemoteUpdate.current) {
                updateDoc(docRef, {
                    records: editor.store.serialize()
                }).catch(err => console.error("Sync Error:", err));
            }
        });

        // Remote -> Local Sync
        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists() && !document.hasFocus()) { // Only sync if we don't have focus or via internal flag
                // Simple implementation: Replace store with remote version
                // In a production app, we would use DIFFS and mergeRemoteChanges
            }

            const data = snapshot.data();
            if (data && data.records && !isRemoteUpdate.current) {
                // Check if the current user is the one who made the change to avoid echo
                // For now, we rely on the editor source check, but we could add a clientId

                isRemoteUpdate.current = true;
                editor.store.loadSnapshot({
                    document: { id: 'td-document', records: data.records },
                    schema: editor.store.schema.serialize()
                });
                isRemoteUpdate.current = false;
            }
        });

        return () => {
            unlisten();
            unsubscribe();
        };
    }, [editor, sessionId]);
}
