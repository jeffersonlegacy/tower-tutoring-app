import React, { useEffect, useState } from 'react';
import { rtdb } from '../../services/firebase';
import { ref, onValue } from 'firebase/database';

export default function GlobalLeaderboard({ sessionId }) {
    const [stats, setStats] = useState({
        airhockey: [],
        swipefight: [],
        yahtzee: [],
        connect4: [],
        battleship: []
    });

    useEffect(() => {
        if (!sessionId || !rtdb) return;

        const gamesRef = ref(rtdb, `sessions/${sessionId}/games`);
        const unsub = onValue(gamesRef, (snapshot) => {
            const data = snapshot.val() || {};

            setStats({
                airhockey: data.airhockey_v2?.matchHistory || [],
                swipefight: data.swipefight_rt_v1?.matchHistory || [],
                yahtzee: data.yahtzee_multi_v1?.matchHistory || [],
                connect4: data.connect4_v2?.matchHistory || [],
                battleship: data.battleship_v1?.matchHistory || [] // Battleship needs match logging added too?
            });
        });

        return () => unsub();
    }, [sessionId]);

    const renderMatchItem = (match, gameType) => {
        // Multi-player format (Yahtzee)
        if (gameType === 'yahtzee') {
            return (
                <div key={match.id} className="bg-slate-900/50 rounded-lg p-3 flex flex-col gap-1 border border-white/5">
                    <div className="flex justify-between items-center border-b border-white/5 pb-1 mb-1">
                        <span className="text-slate-500 text-[10px] font-mono">#{match.id} • {match.mode}</span>
                        <span className="text-yellow-400 text-[10px] font-bold">🏆 {match.winnerName || 'Unknown'}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {match.scores?.slice(0, 3).map((s, i) => (
                            <span key={i} className="text-xs font-mono text-slate-300">
                                {s.name}: <span className="text-white font-bold">{s.total}</span>
                            </span>
                        ))}
                        {(match.scores?.length > 3) && <span className="text-[10px] text-slate-500">+{match.scores.length - 3} more</span>}
                    </div>
                </div>
            );
        }

        // Standard Host vs Client format
        return (
            <div key={match.id} className="bg-slate-900/50 rounded-lg p-3 flex justify-between items-center border border-white/5">
                <span className="text-slate-500 text-xs font-mono">#{match.id}</span>
                <div className="flex gap-4 font-mono font-bold text-sm">
                    <span className={match.winner === 'host' ? 'text-emerald-400' : 'text-slate-600'}>
                        H: {match.hostScore}
                    </span>
                    <span className="text-slate-700">|</span>
                    <span className={match.winner === 'client' ? 'text-pink-400' : 'text-slate-600'}>
                        C: {match.clientScore}
                    </span>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${match.winner === 'host' ? 'bg-emerald-500/10 text-emerald-400' :
                    match.winner === 'client' ? 'bg-pink-500/10 text-pink-400' :
                        'bg-slate-500/10 text-slate-400'
                    }`}>
                    {match.winner === 'host' ? 'HOST' : match.winner === 'client' ? 'CLIENT' : 'DRAW'}
                </span>
            </div>
        );
    };

    const renderGameSection = (title, icon, history, colorClass, gameType) => (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden flex flex-col h-full shadow-lg">
            <div className={`p-4 border-b border-slate-700 flex items-center gap-3 bg-gradient-to-r ${colorClass} to-slate-900`}>
                <span className="text-2xl filter drop-shadow-md">{icon}</span>
                <h3 className="font-black text-white italic tracking-tighter uppercase">{title}</h3>
                <span className="ml-auto text-xs font-bold bg-black/30 px-2 py-1 rounded text-white/50">{history.length} Matches</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar bg-slate-900/50">
                {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 opacity-50 min-h-[150px]">
                        <span className="text-4xl grayscale inset-0">∅</span>
                        <span className="text-xs uppercase font-bold tracking-widest">No Matches Yet</span>
                    </div>
                ) : (
                    [...history].reverse().map((match) => renderMatchItem(match, gameType))
                )}
            </div>
        </div>
    );

    return (
        <div className="w-full h-full p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-20">
            {renderGameSection("Air Hockey", "🏒", stats.airhockey, "from-emerald-600", 'standard')}
            {renderGameSection("Swipe Fight", "⚡", stats.swipefight || [], "from-cyan-600", 'standard')}
            {renderGameSection("Yahtzee", "🎲", stats.yahtzee || [], "from-purple-600", 'yahtzee')}
            {renderGameSection("Connect 4", "🔴", stats.connect4 || [], "from-pink-600", 'standard')}
            {renderGameSection("Battleship", "🚢", stats.battleship || [], "from-blue-600", 'standard')}
        </div>
    );
}
