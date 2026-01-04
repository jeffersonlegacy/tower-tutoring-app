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
    status: 'MENU',
    mode: 'AI',
    playerScore: 0, // Renamed: always the human player's score
    opponentScore: 0, // Renamed: AI or opponent's score
    winner: null,
    puck: { x: 200, y: 300, vx: 0, vy: 0 },
    paddles: {
        player: { x: 200, y: 550 }, // Bottom (human)
        opponent: { x: 200, y: 50 }  // Top (AI or opponent)
    },
    timestamp: 0
};

export default function AirHockey({ sessionId, onBack }) {
    const canvasRef = useRef(null);
    const gameId = 'airhockey_v3';
    const { gameState, playerId, isHost, updateState } = useRealtimeGame(sessionId, gameId, INITIAL_STATE);

    const [scoreFlash, setScoreFlash] = useState(null);
    const [screenShake, setScreenShake] = useState(false);

    const localState = useRef({
        puck: { x: 200, y: 300, vx: 0, vy: 0 },
        playerPaddle: { x: 200, y: 550 },
        opponentPaddle: { x: 200, y: 50 },
        sparks: [],
        trail: [],
        scoringCooldown: false,
        lastUpdate: 0
    });

    const sfx = useRef({
        hit: new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3'),
        goal: new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3')
    });

    // Initialize puck velocity when game starts
    useEffect(() => {
        if (gameState?.status !== 'PLAYING') return;

        const s = localState.current;
        if (s.puck.vx === 0 && s.puck.vy === 0) {
            resetPuck(s);
        }

        let animationFrameId;
        const ctx = canvasRef.current?.getContext('2d');

        const loop = () => {
            updatePhysics();
            if (ctx) draw(ctx);
            animationFrameId = requestAnimationFrame(loop);
        };
        animationFrameId = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(animationFrameId);
    }, [gameState?.status, gameState?.mode]);

    const updatePhysics = () => {
        const s = localState.current;
        const mode = gameState?.mode || 'AI';
        const isAI = mode === 'AI';

        // Only calculate physics if AI mode or if we're the host in PVP
        const shouldCalcPhysics = isAI || (mode === 'PVP' && isHost);
        if (!shouldCalcPhysics) return;

        // Move puck
        s.puck.x += s.puck.vx;
        s.puck.y += s.puck.vy;
        s.puck.vx *= 0.995;
        s.puck.vy *= 0.995;

        // Wall collisions (left/right)
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

        // Goal detection
        const goalWidth = 120;
        const leftPost = (TABLE_WIDTH - goalWidth) / 2;
        const rightPost = (TABLE_WIDTH + goalWidth) / 2;
        const inGoalX = s.puck.x > leftPost && s.puck.x < rightPost;

        // TOP WALL - opponent's goal (PLAYER SCORES)
        if (s.puck.y - PUCK_RADIUS < 0) {
            if (inGoalX && !s.scoringCooldown) {
                s.scoringCooldown = true;
                handleGoal('player');
                resetPuck(s);
                setTimeout(() => { localState.current.scoringCooldown = false; }, 1000);
            } else if (!inGoalX) {
                s.puck.y = PUCK_RADIUS;
                s.puck.vy *= -0.8;
                sfx.current.hit.play().catch(() => { });
                createSparks(s.puck.x, s.puck.y);
            }
        }

        // BOTTOM WALL - player's goal (OPPONENT SCORES)
        if (s.puck.y + PUCK_RADIUS > TABLE_HEIGHT) {
            if (inGoalX && !s.scoringCooldown) {
                s.scoringCooldown = true;
                handleGoal('opponent');
                resetPuck(s);
                setTimeout(() => { localState.current.scoringCooldown = false; }, 1000);
            } else if (!inGoalX) {
                s.puck.y = TABLE_HEIGHT - PUCK_RADIUS;
                s.puck.vy *= -0.8;
                sfx.current.hit.play().catch(() => { });
                createSparks(s.puck.x, s.puck.y);
            }
        }

        // Trail
        s.trail.push({ x: s.puck.x, y: s.puck.y });
        if (s.trail.length > 20) s.trail.shift();

        // AI Movement
        if (isAI) {
            updateAI(s);
        }

        // Paddle collisions
        checkCollision(s.puck, s.playerPaddle);
        checkCollision(s.puck, s.opponentPaddle);
    };

    const updateAI = (s) => {
        // Predictive AI
        const predictX = () => {
            if (s.puck.vy >= 0) return TABLE_WIDTH / 2;
            const frames = Math.abs((s.puck.y - 50) / s.puck.vy);
            let predX = s.puck.x + (s.puck.vx * frames);

            // Handle wall bounces
            let bounces = 10;
            while ((predX < 0 || predX > TABLE_WIDTH) && bounces > 0) {
                if (predX < 0) predX = -predX;
                if (predX > TABLE_WIDTH) predX = TABLE_WIDTH - (predX - TABLE_WIDTH);
                bounces--;
            }
            return Math.max(PADDLE_RADIUS, Math.min(TABLE_WIDTH - PADDLE_RADIUS, predX));
        };

        const targetX = predictX();
        const error = targetX - s.opponentPaddle.x;
        const maxSpeed = 10;
        const move = Math.max(-maxSpeed, Math.min(maxSpeed, error * 0.15));
        s.opponentPaddle.x += move;

        // Y-axis movement
        let targetY = 50;
        if (s.puck.y < 250 && s.puck.vy < 0) {
            targetY = Math.min(180, s.puck.y - 30);
        }
        s.opponentPaddle.y += (targetY - s.opponentPaddle.y) * 0.1;
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

            const minDist = PADDLE_RADIUS + PUCK_RADIUS + 2;
            puck.x = paddle.x + Math.cos(angle) * minDist;
            puck.y = paddle.y + Math.sin(angle) * minDist;

            sfx.current.hit.play().catch(() => { });
            createSparks(puck.x, puck.y);
        }
    };

    const handleGoal = (scorer) => {
        if (!gameState) return;

        const playerScore = gameState.playerScore || 0;
        const opponentScore = gameState.opponentScore || 0;

        const newPlayerScore = playerScore + (scorer === 'player' ? 1 : 0);
        const newOpponentScore = opponentScore + (scorer === 'opponent' ? 1 : 0);

        console.log(`[AIR HOCKEY] ${scorer} scored! Player: ${newPlayerScore}, Opponent: ${newOpponentScore}`);

        // Trigger effects
        setScoreFlash(scorer === 'player' ? 'player' : 'opponent');
        setTimeout(() => setScoreFlash(null), 800);
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 300);
        sfx.current.goal.play().catch(() => { });

        confetti({
            particleCount: scorer === 'player' ? 100 : 30,
            spread: scorer === 'player' ? 90 : 50,
            origin: { y: scorer === 'player' ? 0.1 : 0.9 },
            colors: scorer === 'player' ? ['#34d399', '#22d3ee', '#fbbf24'] : ['#ef4444', '#f97316']
        });

        const updates = {
            playerScore: newPlayerScore,
            opponentScore: newOpponentScore
        };

        if (newPlayerScore >= WIN_SCORE || newOpponentScore >= WIN_SCORE) {
            updates.status = 'FINISHED';
            updates.winner = newPlayerScore >= WIN_SCORE ? 'player' : 'opponent';
        }

        updateState(updates);
    };

    const resetPuck = (s) => {
        const speed = 12;
        const angle = (Math.random() * Math.PI / 2) + Math.PI / 4;
        const dir = Math.random() > 0.5 ? 1 : -1;
        s.puck = {
            x: TABLE_WIDTH / 2,
            y: TABLE_HEIGHT / 2,
            vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
            vy: Math.sin(angle) * speed * dir
        };
        s.trail = [];
    };

    const createSparks = (x, y) => {
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

    const handleInput = (clientX, clientY) => {
        if (gameState?.status !== 'PLAYING') return;
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = TABLE_WIDTH / rect.width;
        const scaleY = TABLE_HEIGHT / rect.height;
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        const s = localState.current;
        s.playerPaddle.x = Math.max(PADDLE_RADIUS, Math.min(TABLE_WIDTH - PADDLE_RADIUS, x));
        s.playerPaddle.y = Math.max(TABLE_HEIGHT / 2 + PADDLE_RADIUS, Math.min(TABLE_HEIGHT - PADDLE_RADIUS, y));
    };

    const draw = (ctx) => {
        const s = localState.current;

        // Background
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

        // Center line & circle
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, TABLE_HEIGHT / 2);
        ctx.lineTo(TABLE_WIDTH, TABLE_HEIGHT / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(TABLE_WIDTH / 2, TABLE_HEIGHT / 2, 60, 0, Math.PI * 2);
        ctx.stroke();

        // Goals
        ctx.fillStyle = '#0f172a';
        ctx.fillRect((TABLE_WIDTH - 120) / 2, 0, 120, 10);
        ctx.fillRect((TABLE_WIDTH - 120) / 2, TABLE_HEIGHT - 10, 120, 10);

        // Trail
        if (s.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(s.trail[0].x, s.trail[0].y);
            for (let i = 1; i < s.trail.length; i++) {
                ctx.lineTo(s.trail[i].x, s.trail[i].y);
            }
            const grad = ctx.createLinearGradient(s.trail[0].x, s.trail[0].y, s.puck.x, s.puck.y);
            grad.addColorStop(0, 'rgba(34, 211, 238, 0)');
            grad.addColorStop(1, 'rgba(34, 211, 238, 0.5)');
            ctx.strokeStyle = grad;
            ctx.lineWidth = PUCK_RADIUS;
            ctx.lineCap = 'round';
            ctx.stroke();
        }

        // Puck
        ctx.fillStyle = '#22d3ee';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#22d3ee';
        ctx.beginPath();
        ctx.arc(s.puck.x, s.puck.y, PUCK_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Sparks
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

        // Player paddle (bottom, green)
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(s.playerPaddle.x, s.playerPaddle.y, PADDLE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Opponent paddle (top, red/gray)
        ctx.fillStyle = gameState?.mode === 'AI' ? '#94a3b8' : '#ef4444';
        ctx.beginPath();
        ctx.arc(s.opponentPaddle.x, s.opponentPaddle.y, PADDLE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    };

    if (!gameState) {
        return <div className="text-white p-4 font-mono animate-pulse">Connecting...</div>;
    }

    const playerScore = gameState.playerScore || 0;
    const opponentScore = gameState.opponentScore || 0;

    return (
        <div className={`flex flex-col items-center h-full bg-slate-900 rounded-xl overflow-hidden relative touch-none select-none ${screenShake ? 'animate-pulse' : ''}`}>

            {/* Goal Flash */}
            {scoreFlash && (
                <div className={`absolute inset-0 z-50 pointer-events-none ${scoreFlash === 'player' ? 'bg-emerald-500/30' : 'bg-red-500/30'} animate-pulse`} />
            )}

            {/* SCOREBOARD - Much bigger and clearer */}
            <div className="w-full p-4 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 border-b border-white/10 z-10">
                <div className="flex justify-between items-center mb-2">
                    <button onClick={onBack} className="text-xs text-slate-400 hover:text-white uppercase">Exit</button>
                    <button onClick={() => updateState({ status: 'MENU', playerScore: 0, opponentScore: 0, winner: null })} className="text-xs text-red-400 hover:text-white">🔄 Reset</button>
                </div>

                {/* Big Score Display - Team Red (You) vs Team Yellow (Opponent) */}
                <div className="flex items-center justify-center gap-6">
                    <div className={`flex flex-col items-center transition-transform ${scoreFlash === 'player' ? 'scale-125' : ''}`}>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 shadow-[0_0_20px_#ec4899] flex items-center justify-center mb-1">
                            <span className="text-white text-xs font-black">YOU</span>
                        </div>
                        <span className="text-4xl font-black text-pink-400" style={{ textShadow: '0 0 30px rgba(236,72,153,0.6)' }}>
                            {playerScore}
                        </span>
                        <span className="text-xs text-pink-500 font-bold uppercase tracking-widest">TEAM RED</span>
                    </div>

                    <div className="flex flex-col items-center">
                        <span className="text-2xl text-slate-600 font-black">VS</span>
                        <span className="text-[10px] text-slate-700 font-bold">FIRST TO {WIN_SCORE}</span>
                    </div>

                    <div className={`flex flex-col items-center transition-transform ${scoreFlash === 'opponent' ? 'scale-125' : ''}`}>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-[0_0_20px_#facc15] flex items-center justify-center mb-1">
                            <span className="text-slate-900 text-[10px] font-black">{gameState.mode === 'AI' ? 'CPU' : 'OPP'}</span>
                        </div>
                        <span className="text-4xl font-black text-yellow-400" style={{ textShadow: '0 0 30px rgba(250,204,21,0.6)' }}>
                            {opponentScore}
                        </span>
                        <span className="text-xs text-yellow-500 font-bold uppercase tracking-widest">
                            {gameState.mode === 'AI' ? 'CPU' : 'TEAM YELLOW'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Game Over */}
            {gameState.status === 'FINISHED' && (
                <GameEndOverlay
                    winner={gameState.winner === 'player'}
                    score={`${playerScore} - ${opponentScore}`}
                    onRestart={() => updateState({ status: 'PLAYING', playerScore: 0, opponentScore: 0, winner: null })}
                    onExit={() => {
                        updateState({ status: 'MENU', playerScore: 0, opponentScore: 0 });
                        onBack();
                    }}
                    isHost={true}
                />
            )}

            {/* Menu */}
            {gameState.status === 'MENU' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 select-none bg-gradient-to-br from-emerald-950 via-slate-950 to-black">
                    <span className="text-8xl mb-4 animate-bounce">🏒</span>
                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-t from-emerald-400 to-teal-400 tracking-tighter mb-2 italic">
                        AIR HOCKEY
                    </h1>
                    <p className="text-emerald-500 font-mono text-sm tracking-widest mb-8 animate-pulse">FIRST TO {WIN_SCORE} WINS</p>

                    <div className="w-full max-w-xs space-y-4">
                        <button
                            onClick={() => updateState({ status: 'PLAYING', mode: 'AI', playerScore: 0, opponentScore: 0 })}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl rounded-xl py-5 hover:scale-105 transition-all shadow-lg"
                        >
                            🤖 SOLO vs CPU
                        </button>

                        <button
                            onClick={() => updateState({ status: 'PLAYING', mode: 'PVP', playerScore: 0, opponentScore: 0 })}
                            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold text-lg rounded-xl py-4 hover:scale-105 transition-all"
                        >
                            ⚔️ 1v1 Online
                        </button>
                    </div>

                    <button onClick={onBack} className="mt-8 text-sm text-slate-500 hover:text-white">Exit</button>
                </div>
            )}

            {/* Canvas */}
            <div className="flex-1 w-full bg-slate-800 flex items-center justify-center overflow-hidden">
                <canvas
                    ref={canvasRef}
                    width={TABLE_WIDTH}
                    height={TABLE_HEIGHT}
                    className="max-w-full max-h-full aspect-[2/3] shadow-2xl"
                    onMouseMove={e => handleInput(e.clientX, e.clientY)}
                    onTouchMove={e => {
                        e.preventDefault();
                        if (e.touches?.[0]) handleInput(e.touches[0].clientX, e.touches[0].clientY);
                    }}
                    onTouchStart={e => {
                        e.preventDefault();
                        if (e.touches?.[0]) handleInput(e.touches[0].clientX, e.touches[0].clientY);
                    }}
                />
            </div>
        </div>
    );
}
