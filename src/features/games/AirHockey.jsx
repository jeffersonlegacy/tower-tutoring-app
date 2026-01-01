import React, { useRef, useEffect, useState } from 'react';
import { useRealtimeGame } from '../../hooks/useRealtimeGame';
import confetti from 'canvas-confetti';
import GameEndOverlay from './GameEndOverlay';

const TABLE_WIDTH = 400;
const TABLE_HEIGHT = 600;
const PADDLE_RADIUS = 25;
const PUCK_RADIUS = 15;
const WIN_SCORE = 7;

const INITIAL_STATE = {
    status: 'MENU', // MENU, PLAYING, FINISHED
    mode: 'AI', // AI, PVP
    hostScore: 0,
    clientScore: 0,
    winner: null, // 'host' or 'client'
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
    const [scoreFlash, setScoreFlash] = useState(null); // 'me' | 'opp' | null
    const [screenShake, setScreenShake] = useState(false);

    // Local physics state for smooth predictive rendering
    const localState = useRef({
        puck: { x: 200, y: 300, vx: 0, vy: 0 },
        myPaddle: { x: 200, y: 550 },
        oppPaddle: { x: 200, y: 50 },
        lastUpdate: 0,
        sparks: [],
        trail: [],
        goalExplosion: null,
        scoringCooldown: false // Prevents double-scoring
    });

    // --- SYNC LOOP ---
    useEffect(() => {
        if (!gameState) return;

        // Sync local state with authoritative state (if meaningful diff or init)
        if (gameState.status === 'PLAYING') {
            // If PvP Client, sync Puck from Host
            if (gameState.mode === 'PVP' && !isHost) {
                localState.current.puck.x = gameState.puck?.x || 200;
                localState.current.puck.y = gameState.puck?.y || 300;
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
            if (s.puck.x - PUCK_RADIUS < 0) {
                s.puck.x = PUCK_RADIUS;
                s.puck.vx *= -0.8;
                sfx.current.hit.play().catch(() => { });
                createSparks(s.puck.x, s.puck.y);
            }
            if (s.puck.x + PUCK_RADIUS > TABLE_WIDTH) {
                s.puck.x = TABLE_WIDTH - PUCK_RADIUS;
                s.puck.vx *= -0.8;
                sfx.current.hit.play().catch(() => { });
                createSparks(s.puck.x, s.puck.y);
            }

            // Goals / Top-Bottom Bounce
            const goalWidth = 120;
            const leftPost = (TABLE_WIDTH - goalWidth) / 2;
            const rightPost = (TABLE_WIDTH + goalWidth) / 2;

            if (s.puck.y - PUCK_RADIUS < 0) {
                if (s.puck.x > leftPost && s.puck.x < rightPost) {
                    // TOP GOAL (User Scores) - only if not on cooldown
                    if (!s.scoringCooldown) {
                        s.scoringCooldown = true;
                        scorePoint(isHost ? 'host' : 'client');
                        triggerGoalEffect('me', s.puck.x, PUCK_RADIUS);
                        resetPuck(s);
                        // Reset cooldown after delay
                        setTimeout(() => { localState.current.scoringCooldown = false; }, 1000);
                    }
                } else {
                    s.puck.y = PUCK_RADIUS; s.puck.vy *= -0.8;
                    sfx.current.hit.play().catch(() => { });
                    createSparks(s.puck.x, s.puck.y);
                }
            }
            if (s.puck.y + PUCK_RADIUS > TABLE_HEIGHT) {
                if (s.puck.x > leftPost && s.puck.x < rightPost) {
                    // BOTTOM GOAL (Opp/AI Scores) - only if not on cooldown
                    if (!s.scoringCooldown) {
                        s.scoringCooldown = true;
                        scorePoint(isHost ? 'client' : 'host');
                        triggerGoalEffect('opp', s.puck.x, TABLE_HEIGHT - PUCK_RADIUS);
                        resetPuck(s);
                        // Reset cooldown after delay
                        setTimeout(() => { localState.current.scoringCooldown = false; }, 1000);
                    }
                } else {
                    s.puck.y = TABLE_HEIGHT - PUCK_RADIUS; s.puck.vy *= -0.8;
                    sfx.current.hit.play().catch(() => { });
                    createSparks(s.puck.x, s.puck.y);
                }
            }

            // Trail Logic
            if (!s.trail) s.trail = [];
            // Push current pos
            s.trail.push({ x: s.puck.x, y: s.puck.y, age: 0 });
            // Limit trail length
            if (s.trail.length > 20) s.trail.shift();


            // AI Movement (if AI mode) - PREDICTIVE PID CONTROLLER
            if (mode === 'AI') {
                // prediction logic
                const predictX = (puck) => {
                    // If puck moving away (dy > 0 since AI is at y=50), return null (idle)
                    if (puck.vy >= 0) return TABLE_WIDTH / 2;

                    // Determine frames until puck reaches AI Y plane (approx y=50)
                    const targetY = 50;
                    const distY = puck.y - targetY;
                    if (distY <= 0) return puck.x;

                    const frames = Math.abs(distY / puck.vy);

                    // Predict X based on frames + bounces
                    let predX = puck.x + (puck.vx * frames);

                    // Handle Wall Bounces (Simple Mirroring)
                    // If predX is out of bounds, reflect it
                    while (predX < 0 || predX > TABLE_WIDTH) {
                        if (predX < 0) predX = -predX;
                        if (predX > TABLE_WIDTH) predX = TABLE_WIDTH - (predX - TABLE_WIDTH);
                    }

                    return predX;
                };

                let targetX = predictX(s.puck);

                // Add some human error/noise based on difficulty (optional, kept perfect for "Supercharge")
                // Clamp targetX to table width
                targetX = Math.max(PADDLE_RADIUS, Math.min(TABLE_WIDTH - PADDLE_RADIUS, targetX));

                // PID Controller State (stored in s.aiPID if exists, else init)
                if (!s.aiPID) s.aiPID = { errSum: 0, lastErr: 0 };

                const Kp = 0.15; // Proportional
                const Ki = 0.001; // Integral
                const Kd = 0.8;  // Derivative

                const error = targetX - s.oppPaddle.x;
                s.aiPID.errSum += error;
                const dErr = error - s.aiPID.lastErr;

                const output = (Kp * error) + (Ki * s.aiPID.errSum) + (Kd * dErr);
                s.aiPID.lastErr = error;

                // Apply velocity limit for realism
                const maxSpeed = 12;
                const move = Math.max(-maxSpeed, Math.min(maxSpeed, output));

                s.oppPaddle.x += move;

                // Y-Axis Logic (Attack/Defend)
                // If puck is close, strike! Else stay home.
                let targetY = 50;
                if (s.puck.y < 250 && s.puck.vy < 0) {
                    // Aggressive intercept
                    targetY = Math.min(200, s.puck.y - 40);
                }

                s.oppPaddle.y += (targetY - s.oppPaddle.y) * 0.1;

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

            // Set velocity away from paddle
            puck.vx = Math.cos(angle) * force;
            puck.vy = Math.sin(angle) * force;

            // Stronger unstick - push puck completely outside paddle radius with buffer
            const minDist = PADDLE_RADIUS + PUCK_RADIUS + 2; // +2 buffer
            const overlap = minDist - dist;
            if (overlap > 0) {
                puck.x = paddle.x + Math.cos(angle) * minDist;
                puck.y = paddle.y + Math.sin(angle) * minDist;
            }

            // Ensure minimum velocity to prevent sticking
            const speed = Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy);
            if (speed < 10) {
                const boost = 12 / speed;
                puck.vx *= boost;
                puck.vy *= boost;
            }
        }
    };

    const scorePoint = (scorer) => {
        if (!isHost && gameState?.mode === 'PVP') return; // Only host updates score in PvP
        if (!gameState) return; // Safety check

        const currentHostScore = gameState.hostScore || 0;
        const currentClientScore = gameState.clientScore || 0;
        const newHostScore = currentHostScore + (scorer === 'host' ? 1 : 0);
        const newClientScore = currentClientScore + (scorer === 'client' ? 1 : 0);

        console.log(`[AIR HOCKEY] Score: ${scorer} scored! ${currentHostScore} -> ${newHostScore} (host), ${currentClientScore} -> ${newClientScore} (client)`);

        const updates = {
            hostScore: newHostScore,
            clientScore: newClientScore
        };

        if (newHostScore >= WIN_SCORE || newClientScore >= WIN_SCORE) {
            updates.status = 'FINISHED';
            updates.winner = newHostScore >= WIN_SCORE ? 'host' : 'client';

            // Log Match
            if (gameState.mode === 'PVP') {
                const currentHistory = Array.isArray(gameState.matchHistory) ? gameState.matchHistory : [];
                updates.matchHistory = [...currentHistory, {
                    id: (currentHistory.length || 0) + 1,
                    winner: updates.winner,
                    hostScore: newHostScore,
                    clientScore: newClientScore,
                    timestamp: Date.now()
                }];
            }
        }

        updateState(updates);
    };

    const resetPuck = (s) => {
        s.puck = { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT / 2, vx: 0, vy: 0 };
        s.trail = [];
    };

    const createSparks = (x, y) => {
        if (!localState.current.sparks) localState.current.sparks = [];
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            localState.current.sparks.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0
            });
        }
    };

    const triggerGoalEffect = (who, x, y) => {
        // Screen shake
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 300);

        // Score flash
        setScoreFlash(who);
        setTimeout(() => setScoreFlash(null), 800);

        // Play sound
        sfx.current.goal.play().catch(() => { });

        // Confetti burst
        const isMyGoal = who === 'me';
        confetti({
            particleCount: isMyGoal ? 100 : 30,
            spread: isMyGoal ? 90 : 50,
            origin: { x: x / TABLE_WIDTH, y: isMyGoal ? 0.1 : 0.9 },
            colors: isMyGoal ? ['#34d399', '#22d3ee', '#fbbf24'] : ['#ef4444', '#f97316']
        });

        // Create goal explosion sparks
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            localState.current.sparks.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.5,
                color: isMyGoal ? '#34d399' : '#ef4444'
            });
        }
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


        // --- DRAW TRAIL ---
        if (s.trail && s.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(s.trail[0].x, s.trail[0].y);
            for (let i = 1; i < s.trail.length; i++) {
                // Smooth Quadratic Bezier? Or simple line.
                // Simple line for performance
                ctx.lineTo(s.trail[i].x, s.trail[i].y);
            }

            // Trail Gradient
            const grad = ctx.createLinearGradient(s.trail[0].x, s.trail[0].y, s.puck.x, s.puck.y);
            grad.addColorStop(0, 'rgba(34, 211, 238, 0)');
            grad.addColorStop(1, 'rgba(34, 211, 238, 0.5)');

            ctx.strokeStyle = grad;
            ctx.lineWidth = PUCK_RADIUS;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();

            // Age trails
            s.trail.forEach(t => t.age++);
        }

        // Puck
        ctx.fillStyle = '#22d3ee'; ctx.shadowBlur = 15; ctx.shadowColor = '#22d3ee';
        ctx.beginPath(); ctx.arc(s.puck.x, s.puck.y, PUCK_RADIUS, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        // --- DRAW SPARKS ---
        if (s.sparks) {
            for (let i = s.sparks.length - 1; i >= 0; i--) {
                const sp = s.sparks[i];
                sp.x += sp.vx;
                sp.y += sp.vy;
                sp.life -= 0.05;
                if (sp.life <= 0) {
                    s.sparks.splice(i, 1);
                    continue;
                }
                ctx.fillStyle = `rgba(255, 255, 255, ${sp.life})`;
                ctx.beginPath();
                ctx.arc(sp.x, sp.y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

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
        <div className={`flex flex-col items-center h-full bg-slate-900 border-2 border-slate-700 rounded-xl overflow-hidden relative touch-none select-none transition-transform ${screenShake ? 'animate-shake' : ''}`}
            style={screenShake ? { animation: 'shake 0.3s ease-in-out' } : {}}
        >
            {/* Goal Flash Overlay */}
            {scoreFlash && (
                <div className={`absolute inset-0 z-50 pointer-events-none ${scoreFlash === 'me' ? 'bg-emerald-500/30' : 'bg-red-500/30'} animate-pulse`} />
            )}

            {/* Header - Enhanced Scoreboard */}
            <div className="w-full flex justify-between items-center p-3 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 border-b border-white/10 z-10">
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            updateState({ status: 'MENU', hostScore: 0, clientScore: 0 });
                            onBack();
                        }}
                        className="text-xs text-slate-400 hover:text-white font-bold uppercase tracking-wider"
                    >
                        EXIT
                    </button>
                    <button
                        onClick={() => updateState({ status: 'MENU', hostScore: 0, clientScore: 0, winner: null })}
                        className="text-xs text-red-400 hover:text-white font-bold"
                    >
                        🔄
                    </button>
                </div>

                {/* Scoreboard */}
                <div className="flex items-center gap-4">
                    <div className={`flex flex-col items-center transition-all duration-300 ${scoreFlash === 'me' ? 'scale-125' : ''}`}>
                        <span className={`text-3xl font-black text-emerald-400 ${scoreFlash === 'me' ? 'animate-bounce text-emerald-300' : ''}`}
                            style={{ textShadow: '0 0 20px rgba(52,211,153,0.5)' }}
                        >
                            {myScore}
                        </span>
                        <span className="text-[8px] text-emerald-600 font-bold uppercase">YOU</span>
                    </div>

                    <div className="flex flex-col items-center">
                        <span className="text-slate-600 text-xl font-bold">VS</span>
                        <span className="text-[8px] text-slate-700 font-bold">FIRST TO {WIN_SCORE}</span>
                    </div>

                    <div className={`flex flex-col items-center transition-all duration-300 ${scoreFlash === 'opp' ? 'scale-125' : ''}`}>
                        <span className={`text-3xl font-black text-pink-400 ${scoreFlash === 'opp' ? 'animate-bounce text-pink-300' : ''}`}
                            style={{ textShadow: '0 0 20px rgba(236,72,153,0.5)' }}
                        >
                            {oppScore}
                        </span>
                        <span className="text-[8px] text-pink-600 font-bold uppercase">{gameState.mode === 'AI' ? 'CPU' : 'OPP'}</span>
                    </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                    {gameState.mode === 'AI' ? '🤖 CPU' : '⚡ LIVE'}
                </div>
            </div>

            {/* Game Over Overlay */}
            {gameState.status === 'FINISHED' && (
                <GameEndOverlay
                    winner={isHost ? gameState.winner === 'host' : gameState.winner === 'client'}
                    score={`${gameState.hostScore} - ${gameState.clientScore}`}
                    onRestart={() => updateState({ status: 'PLAYING', hostScore: 0, clientScore: 0, winner: null })}
                    onExit={() => {
                        updateState({ status: 'MENU', hostScore: 0, clientScore: 0 });
                        onBack();
                    }}
                    isHost={isHost || gameState.mode === 'AI'}
                />
            )}

            {/* Menu Overlay */}
            {gameState.status === 'MENU' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-auto cursor-auto space-y-8 select-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-950 via-slate-950 to-black">

                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] opacity-30 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-500">
                        <span className="text-8xl leading-none mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">🏒</span>
                        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-t from-emerald-400 to-teal-400 tracking-tighter filter drop-shadow-[0_0_20px_rgba(16,185,129,0.5)] mb-2 italic transform -skew-x-6">
                            AIR HOCKEY
                        </h1>
                        <p className="text-emerald-500 font-mono font-bold tracking-[0.5em] text-sm animate-pulse uppercase">Zero Friction Physics</p>
                    </div>

                    <div className="w-full max-w-xs space-y-4 relative z-10">
                        <button
                            onClick={() => updateState({ status: 'PLAYING', mode: 'AI' })}
                            className="w-full group relative overflow-hidden bg-slate-900 border border-white/10 hover:border-emerald-500 rounded-xl p-6 transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] text-left"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex flex-col">
                                    <span className="text-xl font-black text-white group-hover:text-emerald-400 uppercase italic tracking-wider">Training</span>
                                    <span className="text-[10px] font-bold text-slate-500 tracking-widest">VS CPU</span>
                                </div>
                                <span className="text-3xl opacity-50 group-hover:opacity-100 transition-opacity">🤖</span>
                            </div>
                        </button>

                        <button
                            disabled={!isHost}
                            onClick={() => updateState({ status: 'PLAYING', mode: 'PVP' })}
                            className="w-full group relative overflow-hidden bg-slate-900 border border-white/10 hover:border-cyan-500 rounded-xl p-6 transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] text-left disabled:opacity-50 disabled:grayscale disabled:scale-100 disabled:cursor-not-allowed"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex flex-col">
                                    <span className="text-xl font-black text-white group-hover:text-cyan-400 uppercase italic tracking-wider">Versus</span>
                                    <span className="text-[10px] font-bold text-slate-500 tracking-widest">1v1 ONLINE</span>
                                </div>
                                <span className="text-3xl opacity-50 group-hover:opacity-100 transition-opacity">⚔️</span>
                            </div>
                        </button>
                    </div>

                    <button onClick={onBack} className="mt-8 text-xs font-bold text-slate-500 hover:text-white uppercase tracking-[0.2em] transition-colors hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 py-3 px-8">
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
                    onTouchMove={e => {
                        e.preventDefault();
                        if (e.touches && e.touches.length > 0) {
                            handleInput(e.touches[0].clientX, e.touches[0].clientY);
                        }
                    }}
                    onTouchStart={e => {
                        e.preventDefault();
                        if (e.touches && e.touches.length > 0) {
                            handleInput(e.touches[0].clientX, e.touches[0].clientY);
                        }
                    }}
                />
            </div>

        </div>
    );
}
