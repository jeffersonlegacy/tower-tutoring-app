import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMastery } from '../../context/MasteryContext';
import { db } from '../../services/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import AvatarCanvas from '../profile/AvatarCanvas';

const GAMES = [
    {
        id: 'connect4',
        title: 'Connect 4',
        icon: '🔴',
        description: 'Classic strategy. 4 in a row wins.',
        tags: ['STRATEGY', 'LOGIC'],
        color: 'blue',
        route: '/game/connect4'
    },
    {
        id: 'battleship',
        title: 'Battleship',
        icon: '🚢',
        description: 'Naval warfare. Find and sink the fleet.',
        tags: ['COORDINATES', 'STRATEGY'],
        color: 'cyan',
        route: '/game/battleship'
    },
    {
        id: 'airhockey',
        title: 'Air Hockey',
        icon: '🏒',
        description: 'High speed reaction physics.',
        tags: ['PHYSICS', 'SPEED'],
        color: 'rose',
        route: '/game/air-hockey'
    },
    {
        id: 'checkers',
        title: 'Checkers',
        icon: '🛸',
        description: 'Classic capture strategy.',
        tags: ['LOGIC', 'STRATEGY'],
        color: 'emerald',
        route: '/game/checkers'
    },
    {
        id: 'swipefight',
        title: 'Swipe Fight',
        icon: '🥊',
        description: 'Fast-paced math combat.',
        tags: ['ACTION', 'MATH'],
        color: 'orange',
        route: '/game/swipe-fight'
    }
];

// Global Averages for comparison (Mock Data for MVP)
const GLOBAL_STATS = {
    battleship: { avgWins: 12, avgHighScore: 1500 },
    airhockey: { avgWins: 25, avgHighScore: 3200 },
    checkers: { avgWins: 8, avgHighScore: 800 },
    connect4: { avgWins: 15, avgHighScore: 2000 },
    swipefight: { avgWins: 10, avgHighScore: 1200 }
};

export default function BrainBreak({ onNavigate, onBack }) {
    const { studentProfile, updateGameStats } = useMastery();
    const navigate = useNavigate();

    // Live Leaderboard Logic
    const [leaderboard, setLeaderboard] = useState([]);
    const [activeGameId, setActiveGameId] = useState('airhockey'); // Default to hockey
    
    // Fetch top 5 for the ACTIVE game
    useEffect(() => {
        const q = query(
            collection(db, 'leaderboards', activeGameId, 'scores'),
            orderBy('highScore', 'desc'),
            limit(5)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLeaderboard(data);
        });

        return () => unsubscribe();
    }, [activeGameId]);

    const handleResetStats = () => {
        if (window.confirm("Are you sure you want to reset your leaderboard stats? This cannot be undone.")) {
            alert("Stats reset request sent to mainframe.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans p-6 pb-20 relative overflow-hidden">
             {/* Background Effects */}
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
             
             <div className="relative z-10 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                    <div className="flex gap-3">
                        <button 
                            onClick={onBack}
                            className="px-4 py-2 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 border border-white/10"
                        >
                            ← Dashboard
                        </button>
                        <button 
                            onClick={() => {
                                const lastSession = localStorage.getItem('last_tower_session') || 'demo';
                                navigate(`/session/${lastSession}`);
                            }}
                            className="px-4 py-2 bg-cyan-600/50 rounded-lg hover:bg-cyan-600 transition-colors flex items-center gap-2 border border-cyan-500/30"
                        >
                            🎯 Back to Session
                        </button>
                    </div>
                    
                    <div className="text-center md:text-right">
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 uppercase tracking-tighter">
                            BRAIN BREAK
                        </h1>
                        <p className="text-slate-500 font-mono text-xs tracking-widest uppercase">
                            TOWER GAMING LAB
                        </p>
                    </div>

                    {/* LIVE LEADERBOARD (Top 5 Agents) */}
                    <div className="bg-slate-900/80 border border-cyan-500/20 rounded-xl p-4 w-full md:w-80 shadow-lg shadow-cyan-500/10">
                        <div className="flex justify-between items-center mb-3">
                            <div className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">
                                TOP 5 AGENTS • {GAMES.find(g => g.id === activeGameId)?.title.toUpperCase()}
                            </div>
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        </div>
                        
                        <div className="space-y-2">
                            {leaderboard.length === 0 ? (
                                <div className="text-xs text-slate-500 text-center py-2">No agents data found. Be the first!</div>
                            ) : (
                                leaderboard.map((entry, idx) => (
                                    <div key={entry.id} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-mono font-bold w-4 text-right ${idx === 0 ? 'text-yellow-400' : 'text-slate-500'}`}>#{idx + 1}</span>
                                            {/* Tiny Avatar Preview */}
                                            {entry.avatarConfig && (
                                                <div className="w-4 h-4 rounded-full bg-slate-800 overflow-hidden border border-white/20">
                                                    <AvatarCanvas config={entry.avatarConfig} />
                                                </div>
                                            )}
                                            <span className={entry.towerTag === studentProfile.towerTag ? 'text-white font-bold' : 'text-slate-300'}>{entry.towerTag}</span>
                                        </div>
                                        <span className="font-mono text-cyan-400">{entry.highScore}</span>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <div className="mt-3 pt-2 border-t border-white/5 flex justify-between items-center">
                            <div className="text-[9px] text-slate-500">YOUR RANK</div>
                            <div className="text-[9px] text-slate-300">
                                {leaderboard.findIndex(e => e.towerTag === studentProfile.towerTag) !== -1 
                                    ? `#${leaderboard.findIndex(e => e.towerTag === studentProfile.towerTag) + 1} (${studentProfile.gameStats?.[activeGameId]?.highScore || 0})` 
                                    : 'UNRANKED'
                                }
                            </div>
                        </div>
                    </div>
                </div>

                {/* Game Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                    {GAMES.map(game => {
                        const stats = studentProfile.gameStats?.[game.id] || { wins: 0, losses: 0, highScore: 0 };
                        const global = GLOBAL_STATS[game.id] || { avgWins: '-', avgHighScore: '-' };

                        return (
                            <div 
                                key={game.id}
                                onClick={() => navigate(game.route)}
                                className={`group relative bg-slate-900 border rounded-3xl p-8 hover:-translate-y-2 hover:bg-slate-800 transition-all cursor-pointer overflow-hidden
                                    ${game.color === 'cyan' ? 'border-cyan-500/20 hover:border-cyan-500/50' : 
                                      game.color === 'rose' ? 'border-rose-500/20 hover:border-rose-500/50' :
                                      game.color === 'emerald' ? 'border-emerald-500/20 hover:border-emerald-500/50' :
                                      'border-pink-500/20 hover:border-pink-500/50'}
                                `}
                            >
                                {/* Glow Effect */}
                                <div className={`absolute -right-20 -bottom-20 w-64 h-64 rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity
                                    ${game.color === 'cyan' ? 'bg-cyan-500' : 
                                      game.color === 'rose' ? 'bg-rose-500' :
                                      game.color === 'emerald' ? 'bg-emerald-500' :
                                      'bg-pink-500'}
                                `}></div>

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="text-6xl group-hover:scale-110 transition-transform origin-left">{game.icon}</div>
                                        
                                        {/* Stat Badge */}
                                        <div className="bg-black/40 backdrop-blur-md rounded-lg p-2 text-right border border-white/5">
                                            <div className="text-[10px] text-slate-500 uppercase">Your High Score</div>
                                            <div className={`font-mono font-bold ${
                                                stats.highScore > global.avgHighScore ? 'text-green-400' : 'text-white'
                                            }`}>
                                                {stats.highScore}
                                            </div>
                                            {stats.highScore > 0 && stats.highScore > global.avgHighScore && (
                                                <div className="text-[8px] text-green-500 uppercase tracking-tighter">Top 10%</div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-3xl font-black mb-2">{game.title}</h3>
                                    <p className="text-slate-400 mb-8 flex-grow leading-relaxed">{game.description}</p>
                                    
                                    <div className="flex justify-between items-end">
                                        <div className="flex gap-2">
                                            {game.tags.map(tag => (
                                                <span key={tag} className={`text-[10px] font-bold px-3 py-1 rounded-full border border-white/10 bg-slate-950 uppercase tracking-wider
                                                    ${game.color === 'cyan' ? 'text-cyan-400' : 
                                                      game.color === 'rose' ? 'text-rose-400' :
                                                      game.color === 'emerald' ? 'text-emerald-400' :
                                                      'text-pink-400'}
                                                `}>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="text-xs font-bold text-slate-500 group-hover:text-white transition-colors uppercase tracking-widest">
                                            Play Now →
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
             </div>
        </div>
    );
}
