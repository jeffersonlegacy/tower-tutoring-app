import { useEffect, useRef } from 'react';
import { db } from '../services/firebase';
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from 'firebase/firestore';

export function useWhiteboardSync(editor, sessionId) {
    const isRemoteUpdate = useRef(false);
    const lastSerialized = useRef(null);

    useEffect(() => {
        if (!editor || !sessionId) {
            // Wait for editor and sessionId to be ready.
            return;
        }

        console.log("Whiteboard Sync Starting for session:", sessionId);
        const docRef = doc(db, 'whiteboards', sessionId);

        const initLoad = async () => {
            try {
                // console.log("WhiteboardSync: Fetching initial state...");
                const snapshot = await getDoc(docRef);
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    if (data.records) {
                        // console.log("WhiteboardSync: Found remote records. Loading...");
                        isRemoteUpdate.current = true;
                        editor.store.loadSnapshot({
                            document: { id: 'td-document', records: data.records },
                            schema: editor.store.schema.serialize()
                        });
                        lastSerialized.current = JSON.stringify(data.records);
                        isRemoteUpdate.current = false;
                    }
                } else {
                    console.log("WhiteboardSync: No existing doc. Creating new one.");
                    const records = editor.store.serialize();
                    await setDoc(docRef, { records });
                    lastSerialized.current = JSON.stringify(records);
                }
            } catch (err) {
                // Suppress widely reported "Client is offline" error in dev/test
                if (err.message && err.message.includes("offline")) {
                    console.warn("WhiteboardSync: Client is offline. Waiting for connection...");
                } else {
                    console.error("WhiteboardSync: Init Load Error:", err);
                }
            }
        };

        initLoad();

        let timeout;
        const unlisten = editor.store.listen((entry) => {
            // LOG EVERYTHING for debugging
            // console.log("Store event source:", entry.source);

            if (isRemoteUpdate.current) return;
            // Many versions of tldraw use 'user' but let's be more permissive if we are sure it's us
            // or at least log what it is.
            if (entry.source !== 'user') return;

            clearTimeout(timeout);
            timeout = setTimeout(async () => {
                const records = editor.store.serialize();
                const serialized = JSON.stringify(records);

                if (serialized === lastSerialized.current) return;

                lastSerialized.current = serialized;
                try {
                    // console.log("WhiteboardSync: Syncing local changes to Firestore...");
                    await updateDoc(docRef, { records });
                } catch (err) {
                    console.error("WhiteboardSync: Update Error:", err);
                }
            }, 500);
        });

        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (isRemoteUpdate.current) return;

            if (!snapshot.exists()) {
                console.warn("WhiteboardSync: Doc disappeared!");
                return;
            }

            const data = snapshot.data();
            if (data && data.records) {
                const serialized = JSON.stringify(data.records);
                if (serialized === lastSerialized.current) return;

                console.log("WhiteboardSync: Received remote update. Loading snapshot...");
                lastSerialized.current = serialized;
                isRemoteUpdate.current = true;
                editor.store.loadSnapshot({
                    document: { id: 'td-document', records: data.records },
                    schema: editor.store.schema.serialize()
                });
                isRemoteUpdate.current = false;
            }
        }, (err) => {
            console.error("WhiteboardSync: onSnapshot Error:", err);
        });

        return () => {
            console.log("Whiteboard Sync Cleanup");
            clearTimeout(timeout);
            unlisten();
            unsubscribe();
        };
    }, [editor, sessionId]);
}
