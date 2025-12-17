import { useEffect, useRef } from 'react';
import { db } from '../services/firebase';
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from 'firebase/firestore';

export function useWhiteboardSync(editor, sessionId) {
    const isRemoteUpdate = useRef(false);
    const lastSerialized = useRef(null);

    useEffect(() => {
        if (!editor || !sessionId) return;

        console.log("Whiteboard Sync Initialized for session:", sessionId);
        const docRef = doc(db, 'whiteboards', sessionId);

        // Initial Load
        const initLoad = async () => {
            try {
                const snapshot = await getDoc(docRef);
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    if (data.records) {
                        console.log("Loading remote snapshot...");
                        isRemoteUpdate.current = true;
                        editor.store.loadSnapshot({
                            document: { id: 'td-document', records: data.records },
                            schema: editor.store.schema.serialize()
                        });
                        lastSerialized.current = JSON.stringify(data.records);
                        isRemoteUpdate.current = false;
                    }
                } else {
                    console.log("Initializing new whiteboard document...");
                    const initialRecords = editor.store.serialize();
                    await setDoc(docRef, { records: initialRecords });
                    lastSerialized.current = JSON.stringify(initialRecords);
                }
            } catch (err) {
                console.error("Init Load Error:", err);
            }
        };

        initLoad();

        // Local -> Remote Sync (throttle-like via debounced update)
        let timeout;
        const unlisten = editor.store.listen((entry) => {
            if (entry.source !== 'user' || isRemoteUpdate.current) return;

            clearTimeout(timeout);
            timeout = setTimeout(async () => {
                const records = editor.store.serialize();
                const serialized = JSON.stringify(records);

                if (serialized === lastSerialized.current) return;

                console.log("Syncing local changes to Firebase...");
                lastSerialized.current = serialized;
                try {
                    await updateDoc(docRef, { records });
                } catch (err) {
                    console.error("Local -> Remote Sync Error:", err);
                }
            }, 500); // 500ms debounce
        });

        // Remote -> Local Sync
        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (isRemoteUpdate.current) return;

            const data = snapshot.data();
            if (data && data.records) {
                const serialized = JSON.stringify(data.records);
                if (serialized === lastSerialized.current) return;

                console.log("Merging remote changes...");
                lastSerialized.current = serialized;
                isRemoteUpdate.current = true;

                // Use loadSnapshot for now as it's the safest way to ensure state match
                // without complex tldraw merge conflict handling.
                editor.store.loadSnapshot({
                    document: { id: 'td-document', records: data.records },
                    schema: editor.store.schema.serialize()
                });

                isRemoteUpdate.current = false;
            }
        }, (err) => {
            console.error("Remote -> Local Sync Error:", err);
        });

        return () => {
            clearTimeout(timeout);
            unlisten();
            unsubscribe();
        };
    }, [editor, sessionId]);
}
