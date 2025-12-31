import React, { useState, useEffect } from 'react';
import { db, storage } from '../../services/firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { useHomeworkUpload } from '../../hooks/useHomeworkUpload';
import { mindHive } from '../../services/MindHiveService';

export default function HomeworkTray({ sessionId }) {
    const [files, setFiles] = useState([]);
    const { uploadFile, uploading } = useHomeworkUpload(sessionId);

    useEffect(() => {
        if (!sessionId) return;

        // Listen to files subcollection
        const q = query(collection(db, 'whiteboards', sessionId, 'files'), orderBy('uploadedAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fileList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setFiles(fileList);
        });

        return () => unsubscribe();
    }, [sessionId]);

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await uploadFile(file);
        e.target.value = ''; // Reset input
    };

    const handleDelete = async (file) => {
        if (!window.confirm(`Delete ${file.name}?`)) return;
        try {
            await deleteDoc(doc(db, 'whiteboards', sessionId, 'files', file.id));
            const storageRef = ref(storage, file.path);
            await deleteObject(storageRef);
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    // AI Analysis Logic
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalyze = async (file) => {
        setAnalysisResult("");
        setIsAnalyzing(true);
        // Import service dynamically if not top-level, or assume it's available. 
        // We need 'mindHive' from services.
        // Since I can't easily add import to top file in this block, I'll rely on global availability or Fix import next.
        // Actually best to add import in a separate tool call if needed, but 'mindHive' is exported.
        // Wait, I need to add the import to the top of the file. 
        // I will do that in a separate replacement or assume previous imports.
        // Ah, looking at previous file content, mindHive wasn't imported. I need to import it.

        try {
            // using mindHive service

            let fullText = "";
            await mindHive.streamResponse(
                "Analyze this homework image. Identify the subject, the key problem, and provide a step-by-step solution guide. Do not give the direct answer immediately, but explain the method.",
                [], // No history needed
                (chunk) => {
                    fullText += chunk;
                    setAnalysisResult(fullText);
                },
                null,
                [file.url] // Pass image URL
            );
        } catch (err) {
            setAnalysisResult("Error analyzing document. Please try again.");
            console.error(err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 border-r border-slate-700">
            {/* Header */}
            <div className="p-3 bg-slate-800 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Homework Tray</span>
                <label className={`cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {uploading ? 'Uploading...' : 'Upload File'}
                    <input
                        type="file"
                        className="hidden"
                        onChange={handleUpload}
                        accept="image/*,application/pdf"
                    />
                </label>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
                {files.length === 0 && (
                    <div className="text-center py-8 opacity-30 text-slate-400">
                        <div className="text-2xl mb-2">📂</div>
                        <div className="text-[10px]">No files yet</div>
                    </div>
                )}

                {files.map(file => (
                    <div key={file.id} className="group relative bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-indigo-500/30 rounded p-2 flex items-center gap-3 transition-all">
                        {/* Icon */}
                        <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center shrink-0 border border-white/5">
                            {file.type.includes('image') ? (
                                <img src={file.url} className="w-full h-full object-cover rounded" alt="thumb" />
                            ) : (
                                <span className="text-xs">📄</span>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="text-xs text-slate-200 truncate font-medium">{file.name}</div>
                            <div className="text-[9px] text-slate-500">
                                {new Date(file.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>

                        {/* Actions Overlay */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800/90 rounded px-1 shadow-xl">
                            {/* AI Analyze Button (Images Only) */}
                            {file.type.includes('image') && (
                                <button
                                    onClick={() => handleAnalyze(file)}
                                    className="p-1 hover:text-cyan-400 text-slate-400"
                                    title="Analyze with AI"
                                >
                                    🧠
                                </button>
                            )}
                            <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 hover:text-indigo-400 text-slate-400"
                                title="Open"
                            >
                                ↗
                            </a>
                            <button
                                onClick={() => handleDelete(file)}
                                className="p-1 hover:text-red-400 text-slate-400"
                                title="Delete"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Analysis Modal */}
            {analysisResult && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-cyan-500/30 w-full max-w-lg max-h-[80vh] flex flex-col rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.2)] animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-950/50 rounded-t-xl">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🧠</span>
                                <h3 className="font-bold text-cyan-400 uppercase tracking-widest text-xs">AI Homework Analysis</h3>
                            </div>
                            <button onClick={() => setAnalysisResult(null)} className="text-slate-500 hover:text-white">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 text-sm text-slate-300 leading-relaxed font-mono">
                            {isAnalyzing ? (
                                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                    <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-cyan-500/80 animate-pulse text-xs uppercase tracking-widest">Scanning Document...</p>
                                </div>
                            ) : (
                                <div className="markdown-body">
                                    {analysisResult}
                                </div>
                            )}
                        </div>
                        <div className="p-3 border-t border-white/10 bg-slate-950/30 text-center">
                            <span className="text-[9px] text-slate-600 uppercase tracking-widest">Powered by Jefferson Intelligence Vision</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
