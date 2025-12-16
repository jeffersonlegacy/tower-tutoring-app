import React, { useCallback, useEffect, useRef, useState } from "react";
import { db, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";

export default function Uploads({ sessionId }) {
  const [uploads, setUploads] = useState([]);
  const fileInputRef = useRef();

  useEffect(() => {
    const q = query(collection(db, "sessions", sessionId, "uploads"), orderBy("created", "desc"));
    const unsub = onSnapshot(q, snap => {
      setUploads(snap.docs.map(doc => doc.data()));
    });
    return unsub;
  }, [sessionId]);

  const onUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const storageRef = ref(storage, `sessions/${sessionId}/${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    await addDoc(collection(db, "sessions", sessionId, "uploads"), {
      url,
      name: file.name,
      created: Date.now(),
    });
    e.target.value = "";
  }, [sessionId]);

  return (
    <div className="bg-slate-800 p-4 rounded-lg">
      <div className="flex items-center mb-2">
        <span className="font-bold flex-1 text-white">Uploads</span>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={onUpload}
        />
        <button
          className="bg-sky-500 text-white px-3 py-1 rounded ml-2"
          onClick={() => fileInputRef.current.click()}
        >Upload</button>
      </div>
      <div className="flex flex-wrap gap-4">
        {uploads.map((u, idx) => (
          <a
            key={idx}
            href={u.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-slate-700 text-white px-4 py-2 rounded"
          >
            {u.name}
          </a>
        ))}
      </div>
    </div>
  );
}
