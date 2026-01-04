import React, { useEffect, useRef, useState, useCallback } from 'react';
import GameEndOverlay from './GameEndOverlay';

const DIFFICULTIES = { BEGINNER: 1, INTERMEDIATE: 2, EXPERT: 3 };

const generateProblem = (level) => {
    let a, b, op, answer, decoys = [];
    const difficulty = level || DIFFICULTIES.BEGINNER;

    if (difficulty === DIFFICULTIES.BEGINNER) {
        op = Math.random() > 0.5 ? '+' : '-';
        a = Math.floor(Math.random() * 20) + 1;
        b = Math.floor(Math.random() * 10) + 1;
        if (op === '-' && b > a) [a, b] = [b, a];
        answer = op === '+' ? a + b : a - b;
    } else {
        op = 'x';
        const max = difficulty === DIFFICULTIES.EXPERT ? 15 : 11;
        a = Math.floor(Math.random() * max) + 2;
        b = Math.floor(Math.random() * max) + 2;
        answer = a * b;
    }

    const potentialDecoys = [
        answer + 1, answer - 1, answer + 10, answer - 10,
        answer + 2, answer - 2, answer + 5,
        op === 'x' ? (a + 1) * b : answer + 3,
        op === 'x' ? a * (b - 1) : answer - 3
    ];

    while (decoys.length < 5) {
        const d = potentialDecoys[Math.floor(Math.random() * potentialDecoys.length)];
        if (d !== answer && d >= 0 && !decoys.includes(d)) decoys.push(d);
        if (decoys.length < 5 && Math.random() > 0.8) {
            const r = Math.floor(Math.random() * 50);
            if (r !== answer && !decoys.includes(r)) decoys.push(r);
        }
    }

    return { equation: `${a} ${op} ${b} = ?`, answer, decoys };
};

export default function MathInvaders({ onBack }) {
    const canvasRef = useRef(null);
    const [hud, setHud] = useState({
        score: 0,
        streak: 0,
        timeLeft: 30,
        equation: "READY?",
        gameOver: false,
        menu: true,
        difficulty: 'BEGINNER'
    });
    const requestRef = useRef();

    const gameState = useRef({
        player: { x: 0, y: 0 },
        bullets: [],
        invaders: [],
        particles: [],
        texts: [],
        problem: null,
        frame: 0,
        score: 0,
        streak: 0,
        timeLeft: 30,
        lastTimeCheck: Date.now(),
        level: 1,
        active: false,
        alienSpawnTime: 0, // When current wave spawned
        alienLifetime: 4000, // ms before aliens leave (4 seconds)
        shooting: false // Manual shoot control
    });

    // SHOOT FUNCTION (called by button)
    const shoot = useCallback(() => {
        if (!gameState.current.active) return;
        const state = gameState.current;
        state.bullets.push({ x: state.player.x, y: state.player.y - 20 });
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            if (!canvas?.parentElement) return;
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
            gameState.current.player.y = canvas.height - 80;
            gameState.current.player.x = canvas.width / 2;
        };
        window.addEventListener('resize', resize);
        resize();

        const handleInput = (e) => {
            if (!gameState.current.active) return;
            const rect = canvas.getBoundingClientRect();
            let clientX = e.touches?.[0]?.clientX ?? e.clientX;
            if (clientX === undefined) return;
            gameState.current.player.x = Math.max(20, Math.min(canvas.width - 20, clientX - rect.left));
        };

        canvas.addEventListener('mousemove', handleInput);
        canvas.addEventListener('touchmove', handleInput, { passive: false });

        const spawnInvaders = () => {
            const state = gameState.current;
            state.invaders = [];
            if (!state.problem) return;

            const cols = 5;
            const startX = (canvas.width - cols * 60) / 2;
            const targetIndex = Math.floor(Math.random() * cols);

            for (let i = 0; i < cols; i++) {
                const isTarget = i === targetIndex;
                const val = isTarget ? state.problem.answer : state.problem.decoys[i % state.problem.decoys.length];
                const side = i % 2 === 0 ? -1 : 1;

                state.invaders.push({
                    x: (canvas.width / 2) + side * canvas.width,
                    y: -200 - i * 100,
                    targetX: startX + i * 60,
                    targetY: 100,
                    val,
                    isTarget,
                    state: 'flying_in',
                    flyProgress: 0,
                    hue: 280
                });
            }
            state.alienSpawnTime = Date.now();
        };

        const createExplosion = (x, y, color) => {
            if (canvasRef.current) {
                canvasRef.current.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
                setTimeout(() => canvasRef.current && (canvasRef.current.style.transform = 'none'), 50);
            }
            for (let i = 0; i < 25; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 5 + 2;
                gameState.current.particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1.0,
                    decay: Math.random() * 0.03 + 0.01,
                    color,
                    size: Math.random() * 3 + 1
                });
            }
        };

        const createFloatingText = (x, y, text, color) => {
            gameState.current.texts.push({ x, y, text, color, vy: -2, life: 1.0 });
        };

        const updateParticles = (ctx) => {
            const state = gameState.current;
            for (let i = state.particles.length - 1; i >= 0; i--) {
                const p = state.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= p.decay;
                if (p.life <= 0) { state.particles.splice(i, 1); continue; }
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        };

        const update = () => {
            if (!gameState.current.active) {
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                requestRef.current = requestAnimationFrame(update);
                return;
            }

            const state = gameState.current;
            const now = Date.now();

            // Timer
            const dt = now - state.lastTimeCheck;
            if (dt >= 1000) {
                state.timeLeft -= 1;
                state.lastTimeCheck = now;
                setHud(h => ({ ...h, timeLeft: state.timeLeft }));
                if (state.timeLeft <= 0) {
                    state.active = false;
                    setHud(h => ({ ...h, gameOver: true, timeLeft: 0 }));
                }
            }
            state.frame++;

            // Clear
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Grid
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)';
            ctx.lineWidth = 1;
            const timeOffset = (state.frame * 2) % 40;
            for (let y = timeOffset; y < canvas.height; y += 40) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // Player
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#06b6d4';
            ctx.fillStyle = '#06b6d4';
            const px = state.player.x;
            const py = state.player.y;
            ctx.beginPath();
            ctx.moveTo(px, py - 20);
            ctx.lineTo(px - 15, py + 15);
            ctx.lineTo(px, py + 5);
            ctx.lineTo(px + 15, py + 15);
            ctx.closePath();
            ctx.fill();

            // Bullets
            ctx.shadowColor = '#f472b6';
            ctx.fillStyle = '#f472b6';
            for (let i = state.bullets.length - 1; i >= 0; i--) {
                const b = state.bullets[i];
                b.y -= 15;
                ctx.fillRect(b.x - 2, b.y, 4, 15);
                if (b.y < -20) state.bullets.splice(i, 1);
            }

            // Spawn invaders if none
            if (state.invaders.length === 0) {
                if (!state.problem) {
                    state.problem = generateProblem(state.level);
                    setHud(h => ({ ...h, equation: state.problem.equation }));
                }
                spawnInvaders();
            }

            // Check if aliens should leave (timeout)
            const alienAge = now - state.alienSpawnTime;
            const allHovering = state.invaders.every(inv => inv.state === 'hovering');
            if (allHovering && alienAge > state.alienLifetime) {
                // Aliens leaving - PENALTY
                state.streak = 0;
                state.score = Math.max(0, state.score - 1);
                setHud(h => ({ ...h, score: state.score, streak: 0 }));
                createFloatingText(canvas.width / 2, 100, '-1 (TIMEOUT)', '#ef4444');

                // New wave
                state.problem = generateProblem(state.level);
                setHud(h => ({ ...h, equation: state.problem.equation }));
                spawnInvaders();
            }

            // Update invaders
            state.invaders.forEach(inv => {
                if (inv.state === 'flying_in') {
                    inv.flyProgress += 0.02;
                    if (inv.flyProgress >= 1) {
                        inv.flyProgress = 1;
                        inv.state = 'hovering';
                    }
                    inv.x += (inv.targetX - inv.x) * 0.1;
                    inv.y += (inv.targetY - inv.y) * 0.1;
                    if (Math.abs(inv.x - inv.targetX) < 1 && Math.abs(inv.y - inv.targetY) < 1) {
                        inv.state = 'hovering';
                        inv.x = inv.targetX;
                        inv.y = inv.targetY;
                    }
                } else {
                    inv.y = inv.targetY + Math.sin(state.frame * 0.05) * 10;
                }

                // Draw
                ctx.shadowBlur = 15;
                ctx.shadowColor = `hsl(${inv.hue}, 100%, 50%)`;
                ctx.strokeStyle = `hsl(${inv.hue}, 100%, 70%)`;
                ctx.lineWidth = 2;
                ctx.strokeRect(inv.x - 20, inv.y - 20, 40, 40);
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 20px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(inv.val, inv.x, inv.y);
            });

            updateParticles(ctx);

            // Collision
            state.bullets.forEach((b, bIdx) => {
                state.invaders.forEach((inv) => {
                    if (b.x > inv.x - 25 && b.x < inv.x + 25 && b.y > inv.y - 25 && b.y < inv.y + 25) {
                        state.bullets.splice(bIdx, 1);
                        createExplosion(inv.x, inv.y, inv.isTarget ? '#00ff00' : '#ff0000');

                        if (inv.isTarget) {
                            // CORRECT!
                            state.bullets = [];
                            state.streak++;
                            // Base 10 + streak bonus (5 per streak, capped at 50)
                            const streakBonus = Math.min(state.streak * 5, 50);
                            const points = 10 + streakBonus;
                            state.score += points;

                            createFloatingText(inv.x, inv.y, `+${points}`, '#4ade80');
                            if (state.streak > 1) {
                                createFloatingText(inv.x, inv.y + 25, `🔥 x${state.streak}`, '#fbbf24');
                            }

                            state.problem = generateProblem(state.level);
                            setHud(h => ({ ...h, score: state.score, streak: state.streak, equation: state.problem.equation }));
                            spawnInvaders();
                        } else {
                            // WRONG - only -1 penalty
                            state.streak = 0;
                            state.score = Math.max(0, state.score - 1);
                            setHud(h => ({ ...h, score: state.score, streak: 0 }));
                            createFloatingText(inv.x, inv.y, '-1', '#ef4444');
                            canvas.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
                            setTimeout(() => canvas.style.transform = 'none', 100);
                        }

                        // Remove hit invader
                        const idx = state.invaders.indexOf(inv);
                        if (idx > -1) state.invaders.splice(idx, 1);
                    }
                });
            });

            // Floating Texts
            for (let i = state.texts.length - 1; i >= 0; i--) {
                const t = state.texts[i];
                t.y += t.vy;
                t.life -= 0.02;
                if (t.life <= 0) { state.texts.splice(i, 1); continue; }
                ctx.globalAlpha = t.life;
                ctx.fillStyle = t.color;
                ctx.font = 'bold 24px monospace';
                ctx.shadowColor = 'black';
                ctx.shadowBlur = 4;
                ctx.fillText(t.text, t.x, t.y);
                ctx.globalAlpha = 1.0;
                ctx.shadowBlur = 0;
            }

            requestRef.current = requestAnimationFrame(update);
        };

        requestRef.current = requestAnimationFrame(update);
        return () => {
            cancelAnimationFrame(requestRef.current);
            window.removeEventListener('resize', resize);
            canvas.removeEventListener('mousemove', handleInput);
            canvas.removeEventListener('touchmove', handleInput);
        };
    }, []);

    const startGame = () => {
        let diffLevel = DIFFICULTIES.BEGINNER;
        if (hud.difficulty === 'INTERMEDIATE') diffLevel = DIFFICULTIES.INTERMEDIATE;
        if (hud.difficulty === 'EXPERT') diffLevel = DIFFICULTIES.EXPERT;

        gameState.current.level = diffLevel;
        gameState.current.active = true;
        gameState.current.score = 0;
        gameState.current.streak = 0;
        gameState.current.timeLeft = 30;
        gameState.current.invaders = [];
        gameState.current.bullets = [];
        gameState.current.problem = null;
        gameState.current.lastTimeCheck = Date.now();
        gameState.current.alienSpawnTime = Date.now();

        setHud(h => ({ ...h, menu: false, timeLeft: 30, score: 0, streak: 0, gameOver: false, equation: "GET READY" }));
    };

    return (
        <div className="w-full h-full relative bg-slate-900 overflow-hidden touch-none">

            {/* MENU */}
            {hud.menu && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 select-none bg-gradient-to-br from-purple-950 via-slate-950 to-black">
                    <span className="text-8xl mb-4 animate-bounce">👾</span>
                    <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-t from-purple-600 to-pink-400 tracking-tighter mb-2 italic">
                        MATH INVADERS
                    </h1>
                    <p className="text-purple-400 text-sm mb-6">Shoot the correct answer!</p>

                    <div className="flex gap-3 mb-6">
                        {['BEGINNER', 'INTERMEDIATE', 'EXPERT'].map(d => (
                            <button
                                key={d}
                                onClick={() => setHud(h => ({ ...h, difficulty: d }))}
                                className={`px-4 py-2 rounded-lg font-bold text-xs uppercase border transition-all ${hud.difficulty === d
                                        ? 'bg-purple-600 border-purple-400 scale-105'
                                        : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white'
                                    }`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={startGame}
                        className="w-full max-w-xs bg-purple-600 hover:bg-purple-500 text-white font-black text-xl rounded-xl py-5 mb-4 hover:scale-105 transition-all"
                    >
                        🚀 START MISSION
                    </button>

                    <button onClick={onBack} className="text-sm text-slate-500 hover:text-white">
                        Exit
                    </button>
                </div>
            )}

            {/* HUD */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none z-10">
                <div>
                    <div className="text-3xl md:text-4xl font-black text-white drop-shadow-lg">{hud.equation}</div>
                    {hud.streak > 0 && (
                        <div className="text-orange-400 font-bold text-sm mt-1 animate-pulse">
                            🔥 STREAK: x{hud.streak}
                        </div>
                    )}
                </div>
                <div className="text-right">
                    <div className="text-2xl font-mono text-cyan-400">SCORE: {hud.score}</div>
                    <div className={`text-xl font-bold font-mono ${hud.timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        TIME: {hud.timeLeft}s
                    </div>
                </div>
            </div>

            {/* CANVAS */}
            <canvas ref={canvasRef} className="block w-full h-full" />

            {/* SHOOT BUTTON - Only visible during gameplay */}
            {!hud.gameOver && !hud.menu && (
                <button
                    onMouseDown={shoot}
                    onTouchStart={(e) => { e.preventDefault(); shoot(); }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 border-4 border-white/30 shadow-[0_0_30px_rgba(236,72,153,0.5)] active:scale-90 transition-transform flex items-center justify-center"
                >
                    <span className="text-white font-black text-xs uppercase tracking-wider">FIRE</span>
                </button>
            )}

            {/* EXIT/RESET during game */}
            {!hud.gameOver && !hud.menu && (
                <div className="absolute top-16 left-4 z-20 flex gap-3">
                    <button onClick={onBack} className="text-slate-500 hover:text-white text-sm">ESC</button>
                    <button
                        onClick={() => {
                            gameState.current.active = false;
                            setHud(h => ({ ...h, menu: true, gameOver: false, score: 0, streak: 0, timeLeft: 30, equation: 'READY?' }));
                        }}
                        className="text-red-400 hover:text-white text-sm"
                    >
                        🔄
                    </button>
                </div>
            )}

            {/* GAME OVER */}
            {hud.gameOver && (
                <GameEndOverlay
                    winner={true}
                    title="MISSION COMPLETE"
                    icon="🚀"
                    score={hud.score}
                    onRestart={() => setHud(h => ({ ...h, menu: true, gameOver: false }))}
                    onExit={onBack}
                />
            )}
        </div>
    );
}
