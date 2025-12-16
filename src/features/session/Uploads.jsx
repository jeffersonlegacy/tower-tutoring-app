import React, { useCallback, useEffect, useRef, useState } from "react";
import { db, storage } from "../../services/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";

export default function Uploads({ sessionId, onAddToBoard }) {
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
          <div key={idx} className="bg-slate-700 p-2 rounded w-40 flex flex-col items-center">
            <a
              href={u.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white text-sm truncate w-full text-center hover:text-sky-400 mb-1"
            >
              {u.name}
            </a>
            <button
              onClick={() => onAddToBoard(u.url)}
              className="mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded w-full"
            >
              Add to Board
            </button>
          </div>
        ))}
      </div>
    </div >
  );
}
