import React, { useRef, useEffect, useState } from 'react';
import { useRealtimeGame } from '../../hooks/useRealtimeGame';
import confetti from 'canvas-confetti';

const TABLE_WIDTH = 400;
const TABLE_HEIGHT = 600;
const PADDLE_RADIUS = 25;
const PUCK_RADIUS = 15;

const INITIAL_STATE = {
    status: 'MENU', // MENU, PLAYING, FINISHED
    mode: 'AI', // AI, PVP
    hostScore: 0,
    clientScore: 0,
    puck: { x: 200, y: 300, vx: 0, vy: 0 },
    pddl: { // Paddles
        '0': { x: 200, y: 550 }, // Host (Red, Bottom)
        '1': { x: 200, y: 50 }  // Client (Blue, Top)
    },
    timeLeft: 60,
    timestamp: 0
};

export default function AirHockey({ sessionId, onBack }) {
    const canvasRef = useRef(null);
    const gameId = 'airhockey_v2'; // New ID for RTDB version to avoid conflicts
    const { gameState, playerId, isHost, updateState } = useRealtimeGame(sessionId, gameId, INITIAL_STATE);

    const [localMode, setLocalMode] = useState('MENU'); // Local view state tracking

    // Local physics state for smooth predictive rendering
    const localState = useRef({
        puck: { x: 200, y: 300, vx: 0, vy: 0 },
        myPaddle: { x: 200, y: 550 },
        oppPaddle: { x: 200, y: 50 },
        lastUpdate: 0
    });

    // --- SYNC LOOP ---
    useEffect(() => {
        if (!gameState) return;

        // Sync local state with authoritative state (if meaningful diff or init)
        if (gameState.status === 'PLAYING') {
            // If PvP Client, sync Puck from Host
            if (gameState.mode === 'PVP' && !isHost) {
                localState.current.puck.x = gameState.puck.x;
                localState.current.puck.y = gameState.puck.y;
                // Sync opponent paddle (Host's is '0')
                localState.current.oppPaddle.x = gameState.pddl?.[0]?.x || 200;
                localState.current.oppPaddle.y = gameState.pddl?.[0]?.y || 550;
            }
            // If PvP Host, sync Opponent Paddle (Client's is '1')
            if (gameState.mode === 'PVP' && isHost) {
                localState.current.oppPaddle.x = gameState.pddl?.[1]?.x || 200;
                localState.current.oppPaddle.y = gameState.pddl?.[1]?.y || 50;
            }
        }
    }, [gameState, isHost]);


    // --- GAME LOOP ---
    useEffect(() => {
        if (gameState?.status !== 'PLAYING') return;

        let animationFrameId;
        const ctx = canvasRef.current?.getContext('2d');

        const loop = () => {
            updatePhysics();
            if (ctx) draw(ctx);
            animationFrameId = requestAnimationFrame(loop);
        };
        animationFrameId = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(animationFrameId);
    }, [gameState?.status, gameState?.mode, isHost]);

    // --- SFX ---
    const sfx = useRef({
        hit: new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3'), // Punch/Hit
        goal: new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3') // Success/Win
    });

    // --- PHYSICS ENGINE ---
    const updatePhysics = () => {
        const s = localState.current;
        const mode = gameState?.mode || 'AI';

        // 1. Move Puck
        const shouldCalcPhysics = (mode === 'AI') || (mode === 'PVP' && isHost);

        if (shouldCalcPhysics) {
            s.puck.x += s.puck.vx;
            s.puck.y += s.puck.vy;
            s.puck.vx *= 0.99; // Friction
            s.puck.vy *= 0.99;

            // Walls
            if (s.puck.x - PUCK_RADIUS < 0) { s.puck.x = PUCK_RADIUS; s.puck.vx *= -0.8; sfx.current.hit.play().catch(() => { }); }
            if (s.puck.x + PUCK_RADIUS > TABLE_WIDTH) { s.puck.x = TABLE_WIDTH - PUCK_RADIUS; s.puck.vx *= -0.8; sfx.current.hit.play().catch(() => { }); }

            // Goals / Top-Bottom Bounce
            const goalWidth = 120;
            const leftPost = (TABLE_WIDTH - goalWidth) / 2;
            const rightPost = (TABLE_WIDTH + goalWidth) / 2;

            if (s.puck.y - PUCK_RADIUS < 0) {
                if (s.puck.x > leftPost && s.puck.x < rightPost) {
                    // TOP GOAL (User Scores)
                    scorePoint(isHost ? 'host' : 'client');
                    resetPuck(s);
                    confetti({ particleCount: 30, spread: 60, origin: { y: 0.2 }, colors: ['#34d399'] });
                    sfx.current.goal.play().catch(() => { });
                } else {
                    s.puck.y = PUCK_RADIUS; s.puck.vy *= -0.8;
                    sfx.current.hit.play().catch(() => { });
                }
            }
            if (s.puck.y + PUCK_RADIUS > TABLE_HEIGHT) {
                if (s.puck.x > leftPost && s.puck.x < rightPost) {
                    // BOTTOM GOAL (Opp/AI Scores)
                    scorePoint(isHost ? 'client' : 'host');
                    resetPuck(s);
                    sfx.current.goal.play().catch(() => { });
                } else {
                    s.puck.y = TABLE_HEIGHT - PUCK_RADIUS; s.puck.vy *= -0.8;
                    sfx.current.hit.play().catch(() => { });
                }
            }

            // AI Movement (if AI mode)
            if (mode === 'AI') {
                // Improved AI Logic: Prevent getting stuck behind lines
                const reactionSpeed = 0.08;
                let targetX = s.puck.x;

                // If puck is behind AI (rare but possible), prioritize getting back to center
                // AI defends TOP half (0 to 300)
                if (s.puck.y < s.oppPaddle.y - 10) {
                    // Puck passed AI! Move to center to intercept possible rebound
                    targetX = TABLE_WIDTH / 2;
                }

                s.oppPaddle.x += (targetX - s.oppPaddle.x) * reactionSpeed;

                // AI defends top half
                // Defensive stance: Stay between puck and goal
                // Attack stance: Move to stroke
                let targetY = 50;

                if (s.puck.y < 300) {
                    // Puck in AI territory
                    targetY = s.puck.y * 0.8; // Move towards puck but stay slightly back (goalie) or aggressive?
                    // Let's make it aggressive but safe
                    targetY = Math.min(250, s.puck.y); // Don't cross center line (300)
                } else {
                    // Puck in player territory - return to base
                    targetY = 50;
                }

                s.oppPaddle.y += (targetY - s.oppPaddle.y) * reactionSpeed;
            }

            // Collisions
            checkCollision(s.puck, s.myPaddle); // Me vs Puck
            if (mode === 'AI') checkCollision(s.puck, s.oppPaddle); // AI vs Puck
            if (mode === 'PVP') checkCollision(s.puck, s.oppPaddle); // Opp vs Puck (Host calculates)

            // Sync Puck to Network (Throttled?)
            if (mode === 'PVP' && isHost) {
                if (Date.now() - s.lastUpdate > 40) { // ~25fps sync
                    const updates = {
                        puck: s.puck,
                        [`pddl/0`]: s.myPaddle
                    };
                    updateState(updates);
                    s.lastUpdate = Date.now();
                }
            }
        } else {
            // Client in PvP
            if (mode === 'PVP' && !isHost) {
                if (Date.now() - s.lastUpdate > 40) {
                    updateState({ [`pddl/1`]: s.myPaddle });
                    s.lastUpdate = Date.now();
                }
            }
        }
    };

    const checkCollision = (puck, paddle) => {
        const dx = puck.x - paddle.x;
        const dy = puck.y - paddle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < PADDLE_RADIUS + PUCK_RADIUS) {
            const angle = Math.atan2(dy, dx);
            const force = 15;
            puck.vx = Math.cos(angle) * force;
            puck.vy = Math.sin(angle) * force;

            // Unstick
            const overlap = (PADDLE_RADIUS + PUCK_RADIUS) - dist;
            puck.x += Math.cos(angle) * overlap;
            puck.y += Math.sin(angle) * overlap;
        }
    };

    const scorePoint = (scorer) => {
        if (!isHost && gameState.mode === 'PVP') return; // Only host updates score in PvP
        // In AI mode, anyone can update locally? No, use state

        const updates = {
            [scorer === 'host' ? 'hostScore' : 'clientScore']: (gameState[scorer === 'host' ? 'hostScore' : 'clientScore'] || 0) + 1
        };
        updateState(updates);
    };

    const resetPuck = (s) => {
        s.puck = { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT / 2, vx: 0, vy: 0 };
    };

    // --- INPUT HANDLERS ---
    const handleInput = (clientX, clientY) => {
        if (gameState?.status !== 'PLAYING') return;
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        // Scale for canvas resolution vs css size
        const scaleX = TABLE_WIDTH / rect.width;
        const scaleY = TABLE_HEIGHT / rect.height;

        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        const s = localState.current;

        // Constraint to bottom half
        s.myPaddle.x = Math.max(PADDLE_RADIUS, Math.min(TABLE_WIDTH - PADDLE_RADIUS, x));
        s.myPaddle.y = Math.max(TABLE_HEIGHT / 2 + PADDLE_RADIUS, Math.min(TABLE_HEIGHT - PADDLE_RADIUS, y));
    };

    // --- RENDER ---
    const draw = (ctx) => {
        const s = localState.current;
        const mode = gameState?.mode || 'AI';

        // Clear
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

        // Markings
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(0, TABLE_HEIGHT / 2); ctx.lineTo(TABLE_WIDTH, TABLE_HEIGHT / 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(TABLE_WIDTH / 2, TABLE_HEIGHT / 2, 60, 0, Math.PI * 2); ctx.stroke();

        // Goals
        ctx.fillStyle = '#0f172a';
        ctx.fillRect((TABLE_WIDTH - 120) / 2, 0, 120, 10);
        ctx.fillRect((TABLE_WIDTH - 120) / 2, TABLE_HEIGHT - 10, 120, 10);

        // Puck
        ctx.fillStyle = '#22d3ee'; ctx.shadowBlur = 15; ctx.shadowColor = '#22d3ee';
        ctx.beginPath(); ctx.arc(s.puck.x, s.puck.y, PUCK_RADIUS, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        // My Paddle (Host=Red, Client=Blue)
        // If AI mode, Player=Red, AI=Gray
        let myColor = isHost ? '#ef4444' : '#3b82f6';
        let oppColor = isHost ? '#3b82f6' : '#ef4444';
        if (mode === 'AI') { myColor = '#ef4444'; oppColor = '#94a3b8'; }

        ctx.fillStyle = myColor;
        ctx.beginPath(); ctx.arc(s.myPaddle.x, s.myPaddle.y, PADDLE_RADIUS, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

        // Opponent Paddle
        ctx.fillStyle = oppColor;
        ctx.beginPath(); ctx.arc(s.oppPaddle.x, s.oppPaddle.y, PADDLE_RADIUS, 0, Math.PI * 2); ctx.fill();
        ctx.stroke();
    };


    if (!gameState) return <div className="text-white p-4 font-mono animate-pulse">Connecting to Rink...</div>;

    const myScore = isHost ? gameState.hostScore : gameState.clientScore;
    const oppScore = isHost ? gameState.clientScore : gameState.hostScore;

    return (
        <div className="flex flex-col items-center h-full bg-slate-900 border-2 border-slate-700 rounded-xl overflow-hidden relative touch-none select-none">

            {/* Header */}
            <div className="w-full flex justify-between items-center p-3 bg-slate-800 border-b border-white/5 z-10">
                <button onClick={onBack} className="text-xs text-slate-400 hover:text-white">EXIT</button>
                <div className="flex gap-8 text-2xl font-black italic text-white shadow-black drop-shadow-lg">
                    <span className="text-emerald-400">{myScore}</span>
                    <span className="text-slate-600">-</span>
                    <span className="text-pink-400">{oppScore}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                    {gameState.mode === 'AI' ? 'CPU TRAINING' : 'LIVE MATCH'}
                </div>
            </div>

            {/* Menu Overlay */}
            {gameState.status === 'MENU' && (
                <div className="absolute inset-0 z-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-8 animate-in fade-in select-none">

                    <div className="text-center relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500 rounded-full blur-[80px] opacity-20"></div>
                        <h2 className="text-6xl font-black italic tracking-tighter mb-2 relative z-10">
                            <span className="text-white drop-shadow-md">AIR</span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">HOCKEY</span>
                        </h2>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.5em] relative z-10">Cyberpunk Physics Engine</div>
                    </div>

                    <div className="w-full max-w-[280px] space-y-4 relative z-10">
                        <button
                            onClick={() => updateState({ status: 'PLAYING', mode: 'AI' })}
                            className="w-full group relative overflow-hidden bg-slate-800 border-2 border-slate-700/50 hover:border-emerald-500 rounded-xl p-4 transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] text-left"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex flex-col">
                                    <span className="text-lg font-black text-white group-hover:text-emerald-400 uppercase italic">Training</span>
                                    <span className="text-[10px] font-bold text-slate-500">VS CPU</span>
                                </div>
                                <span className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">🤖</span>
                            </div>
                        </button>

                        <button
                            disabled={!isHost}
                            onClick={() => updateState({ status: 'PLAYING', mode: 'PVP' })}
                            className="w-full group relative overflow-hidden bg-slate-800 border-2 border-slate-700/50 hover:border-cyan-500 rounded-xl p-4 transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] text-left disabled:opacity-50 disabled:grayscale disabled:scale-100 disabled:cursor-not-allowed"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex flex-col">
                                    <span className="text-lg font-black text-white group-hover:text-cyan-400 uppercase italic">Versus</span>
                                    <span className="text-[10px] font-bold text-slate-500">1v1 ONLINE</span>
                                </div>
                                <span className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">⚔️</span>
                            </div>
                        </button>
                    </div>

                    <button onClick={onBack} className="text-xs font-bold text-slate-600 hover:text-white uppercase tracking-[0.2em] transition-colors py-2 px-6 hover:bg-white/5 rounded-full">
                        Exit Rink
                    </button>
                </div>
            )}

            {/* Canvas */}
            <div className="flex-1 w-full bg-[#1e293b] flex items-center justify-center overflow-hidden">
                <canvas
                    ref={canvasRef}
                    width={TABLE_WIDTH}
                    height={TABLE_HEIGHT}
                    className="max-w-full max-h-full aspect-[2/3] shadow-2xl border-x-8 border-slate-800"
                    onMouseMove={e => handleInput(e.clientX, e.clientY)}
                    onTouchMove={e => { e.preventDefault(); handleInput(e.touches[0].clientX, e.touches[0].clientY); }}
                    onTouchStart={e => { e.preventDefault(); handleInput(e.touches[0].clientX, e.touches[0].clientY); }}
                />
            </div>

        </div>
    );
}
