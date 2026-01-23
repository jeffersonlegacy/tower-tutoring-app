import { useState } from 'react';
import { storage, db } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';

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
            // Dispatch event for GeminiChat to pick up immediately
            const aiEvent = new CustomEvent('ai-vision-upload', {
                detail: {
                    imageUrl: downloadURL,
                    isAuto: false, // This is a manual user upload, so AI should acknowledge it
                    context: "User uploaded a file/homework."
                }
            });
            window.dispatchEvent(aiEvent);

            return true;
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed: " + error.message);
            return false;
        } finally {
            setUploading(false);
        }
    };

    return { uploadFile, uploading };
}
