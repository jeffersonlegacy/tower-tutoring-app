import React from 'react';

/**
 * Loading Skeletons - Better UX than spinners
 */

export function CardSkeleton() {
    return (
        <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-6 animate-pulse">
            <div className="h-6 bg-slate-800 rounded w-1/3 mb-4" />
            <div className="space-y-3">
                <div className="h-4 bg-slate-800 rounded w-full" />
                <div className="h-4 bg-slate-800 rounded w-5/6" />
                <div className="h-4 bg-slate-800 rounded w-4/6" />
            </div>
        </div>
    );
}

export function NodeMapSkeleton() {
    return (
        <div className="w-screen h-screen bg-[#020617] flex items-center justify-center">
            <div className="text-center space-y-6 animate-pulse">
                <div className="w-20 h-20 bg-cyan-500/20 rounded-full mx-auto border-2 border-cyan-500/30 flex items-center justify-center">
                    <div className="w-16 h-16 bg-cyan-500/10 rounded-full animate-ping" />
                </div>
                <div className="space-y-2">
                    <div className="h-6 bg-slate-800 rounded w-48 mx-auto" />
                    <div className="h-4 bg-slate-800/50 rounded w-32 mx-auto" />
                </div>
            </div>
        </div>
    );
}

export function ListSkeleton({ count = 3 }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-slate-900/30 rounded-2xl animate-pulse">
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-800 rounded w-3/4" />
                        <div className="h-3 bg-slate-800/50 rounded w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}
