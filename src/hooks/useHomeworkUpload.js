import { useState } from 'react';
import { storage, db } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { publishEvent } from '../services/eventBus';
import { trackError } from '../services/telemetry';

export function useHomeworkUpload(sessionId) {
    const [uploading, setUploading] = useState(false);

    const uploadFile = async (file) => {
        if (!sessionId || !file) return;

        setUploading(true);
        try {
            // 1. Storage
            const storageRef = ref(storage, `sessions/${sessionId}/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            // 2. Firestore
            await addDoc(collection(db, 'whiteboards', sessionId, 'files'), {
                name: file.name,
                url: downloadURL,
                type: file.type,
                path: storageRef.fullPath,
                uploadedAt: Date.now()
            });

            // 3. INTELLIGENT AWARENESS (Notify AI Brain)
            // Dispatch event for ChatGPTChat to pick up immediately
            publishEvent('ai-vision-upload', {
                source: 'homework',
                imageUrl: downloadURL,
                context: 'User uploaded homework file.',
            });

            return true;
        } catch (error) {
            trackError('homework.upload', error, { sessionId, fileName: file?.name });
            publishEvent('ui-toast', {
                level: 'error',
                message: `Upload failed: ${error.message}`,
                durationMs: 4000,
            });
            return false;
        } finally {
            setUploading(false);
        }
    };

    return { uploadFile, uploading };
}
