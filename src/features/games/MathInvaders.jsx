import React, { useEffect, useRef, useState } from 'react';
import GameEndOverlay from './GameEndOverlay';

// --- MATH LOGIC ---
const DIFFICULTIES = {
    BEGINNER: 1,
    INTERMEDIATE: 2,
    EXPERT: 3
};

const generateProblem = (difficulty) => {
    let a, b, op, answer, decoys = [];

    // Safety checks
    const level = difficulty || DIFFICULTIES.BEGINNER;

    if (level === DIFFICULTIES.BEGINNER) {
        op = Math.random() > 0.5 ? '+' : '-';
        a = Math.floor(Math.random() * 20) + 1;
        b = Math.floor(Math.random() * 10) + 1;
        if (op === '-') {
            // Ensure positive result for beginner
            if (b > a) [a, b] = [b, a];
            answer = a - b;
        } else {
            answer = a + b;
        }
    } else {
        // Intermediate+ (Multiplication)
        op = 'x';
        const max = level === DIFFICULTIES.EXPERT ? 15 : 11;
        a = Math.floor(Math.random() * max) + 2;
        b = Math.floor(Math.random() * max) + 2;
        answer = a * b;
    }

    // Generate Decoys (plausible wrong answers)
    const potentialDecoys = [
        answer + 1, answer - 1, answer + 10, answer - 10,
        answer + 2, answer - 2, answer + 5,
        (op === 'x' ? (a + 1) * b : answer + 3),
        (op === 'x' ? a * (b - 1) : answer - 3)
    ];

    // Select unique decoys
    let attempts = 0;
    while (decoys.length < 5 && attempts < 50) { // Safety break
        const d = potentialDecoys[Math.floor(Math.random() * potentialDecoys.length)];
        if (d !== answer && d >= 0 && !decoys.includes(d)) {
            decoys.push(d);
        }
        // Fallback random if we run out of "smart" decoys
        if (decoys.length < 5 && Math.random() > 0.8) {
            let r = Math.floor(Math.random() * 50);
            if (r !== answer && !decoys.includes(r)) decoys.push(r);
        }
        attempts++;
    }

    // Fallback if loop failed
    while (decoys.length < 5) {
        decoys.push(answer + decoys.length + 1);
    }

    return {
        equation: `${a} ${op} ${b} = ?`,
        answer: answer,
        decoys: decoys
    };
};

export default function MathInvaders({ onBack }) {
    const canvasRef = useRef(null);
    // HUD State: Score, Timer, Equation
    const [hud, setHud] = useState({
        score: 0,
        timeLeft: 30,
        equation: "READY?",
        gameOver: false,
        menu: true,
        difficulty: 'BEGINNER' // Default UI state
    });
    const requestRef = useRef();

    // Game State Mutable Ref (60fps)
    const gameState = useRef({
        player: { x: 0, y: 0, w: 40, h: 40 },
        bullets: [],
        invaders: [],
        particles: [],
        texts: [], // [NEW] Floating texts
        lastFired: 0,
        problem: null,
        frame: 0,
        score: 0,
        timeLeft: 30, // seconds
        lastTimeCheck: Date.now(),
        level: 1, // 1=Beg, 2=Int, 3=Exp
        active: false, // Start inactive to prevent freeze
        combo: 0
    });

    // --- GAME ENGINE ---
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Handle Resize
        const resize = () => {
            if (!canvas || !canvas.parentElement) return;
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
            gameState.current.player.y = canvas.height - 80;
            gameState.current.player.x = canvas.width / 2;
        };
        window.addEventListener('resize', resize);
        resize();

        // Input Handling (Slide-to-Aim)
        const handleInput = (e) => {
            if (!gameState.current.active) return;
            const rect = canvas.getBoundingClientRect();

            // Fix "reading '0'" error: Ensure touches array exists and has items
            let clientX;
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
            } else if (e.clientX !== undefined) {
                clientX = e.clientX;
            } else {
                return; // Invalid event
            }

            const x = clientX - rect.left;

            // Smoother clamping
            gameState.current.player.x = Math.max(20, Math.min(canvas.width - 20, x));
        };

        canvas.addEventListener('mousemove', handleInput);
        canvas.addEventListener('touchmove', handleInput, { passive: false });


        // --- SPAWN LOGIC (SWARM ENTRANCE) ---
        const spawnInvaders = () => {
            const state = gameState.current;
            state.invaders = [];

            if (!state.problem) return; // Safety

            const cols = 5;
            const startX = (canvas.width - (cols * 60)) / 2;
            const targetIndex = Math.floor(Math.random() * cols);

            for (let i = 0; i < cols; i++) {
                const isTarget = i === targetIndex;
                const val = isTarget ? state.problem.answer : state.problem.decoys[i % state.problem.decoys.length];
                const bonus = Math.floor(Math.random() * 5) * 10 + 10;

                // Spiral/Swarm Start Positions
                const side = i % 2 === 0 ? -1 : 1;
                const spawnX = (canvas.width / 2) + (side * canvas.width);
                const spawnY = -200 - (i * 100);

                state.invaders.push({
                    x: spawnX,
                    y: spawnY,
                    targetX: startX + (i * 60), // Final Grid X
                    targetY: 100, // Final Grid Y
                    w: 40,
                    h: 40,
                    val: val,
                    isTarget: isTarget,
                    bonus: bonus,
                    hue: 280,
                    state: 'flying_in', // flying_in, hovering, divine
                    flyProgress: 0
                });
            }
        };

        // --- EXPLOSION SYSTEM ---
        const createExplosion = (x, y, color) => {
            // Screen Shake (Simple)
            if (canvasRef.current) {
                canvasRef.current.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
                setTimeout(() => {
                    if (canvasRef.current) canvasRef.current.style.transform = 'none';
                }, 50);
            }

            // Particles
            for (let i = 0; i < 25; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 5 + 2;
                gameState.current.particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1.0,
                    decay: Math.random() * 0.03 + 0.01,
                    color: color,
                    size: Math.random() * 3 + 1
                });
            }
        };

        const createFloatingText = (x, y, text, color) => {
            gameState.current.texts.push({
                x, y, text, color,
                vy: -2,
                life: 1.0
            });
        };

        const updateParticles = (ctx) => {
            const state = gameState.current;
            for (let i = state.particles.length - 1; i >= 0; i--) {
                const p = state.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= p.decay;

                if (p.life <= 0) {
                    state.particles.splice(i, 1);
                    continue;
                }

                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        };

        // --- LOOP ---
        const update = () => {
            if (!gameState.current.active) {
                // Keep loop running but minimal for menu bg if needed, or just pause
                // drawing background prevents trail artifacts
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                requestRef.current = requestAnimationFrame(update);
                return;
            }

            const state = gameState.current;
            const now = Date.now();

            // TIMER
            const dt = now - state.lastTimeCheck;
            if (dt >= 1000) {
                state.timeLeft -= 1;
                state.lastTimeCheck = now;
                setHud(h => ({ ...h, timeLeft: state.timeLeft }));
                if (state.timeLeft <= 0) {
                    state.active = false;
                    setHud(h => ({ ...h, gameOver: true, timeLeft: 0 }));

                    // Don't return here, let one last frame draw
                }
            }
            state.frame++;

            // 1. Clear
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

            // 2. Player
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

            // 3. Bullets
            if (now - state.lastFired > 200) {
                state.bullets.push({ x: px, y: py - 20 });
                state.lastFired = now;
            }
            ctx.shadowColor = '#f472b6';
            ctx.fillStyle = '#f472b6';
            for (let i = state.bullets.length - 1; i >= 0; i--) {
                const b = state.bullets[i];
                b.y -= 15;
                ctx.fillRect(b.x - 2, b.y, 4, 15);
                if (b.y < -20) state.bullets.splice(i, 1);
            }

            // 4. Invaders (Swarm Logic)
            // FIX: Spawn invaders when we have none
            if (state.invaders.length === 0) {
                // Generate problem if missing
                if (!state.problem) {
                    state.problem = generateProblem(state.level);
                    setHud(h => ({ ...h, equation: state.problem.equation }));
                }
                // Spawn invaders for current problem
                spawnInvaders();
            }

            state.invaders.forEach(inv => {
                if (inv.state === 'flying_in') {
                    // Cubic Ease-Out
                    inv.flyProgress += 0.02;
                    if (inv.flyProgress >= 1) {
                        inv.flyProgress = 1;
                        inv.state = 'hovering';
                    }
                    const t = inv.flyProgress;
                    const ease = 1 - Math.pow(1 - t, 3);

                    inv.x = inv.x + (inv.targetX - inv.x) * 0.1; // Simple lerp for smoothness
                    inv.y = inv.y + (inv.targetY - inv.y) * 0.1;

                    // Snap when close
                    if (Math.abs(inv.x - inv.targetX) < 1 && Math.abs(inv.y - inv.targetY) < 1) {
                        inv.state = 'hovering';
                        inv.x = inv.targetX;
                        inv.y = inv.targetY;
                    }

                } else {
                    // Hovering Bob
                    inv.y = inv.targetY + Math.sin(state.frame * 0.05) * 10;
                    inv.finalY = inv.y; // Ensure sync
                }

                // Draw Invader
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

            // Render Particles
            updateParticles(ctx);

            // 5. Collision Detection
            state.bullets.forEach((b, bIdx) => {
                state.invaders.forEach((inv, iIdx) => {
                    // Simple Box/Point Collision
                    if (b.x > inv.x - 25 && b.x < inv.x + 25 &&
                        b.y > inv.y - 25 && b.y < inv.y + 25) { // Use inv.y

                        // Collision!
                        state.bullets.splice(bIdx, 1);
                        createExplosion(inv.x, inv.y, inv.isTarget ? '#00ff00' : '#ff0000');

                        if (inv.isTarget) {
                            // CORRECT!
                            state.bullets = []; // Clear bullets
                            // Score: Base (50) + Combo (10*count) + Random Bonus (10-50)
                            const points = 50 + (state.combo * 10) + inv.bonus;
                            state.score += points;
                            state.combo++;

                            createFloatingText(inv.x, inv.y, `+${points}`, '#4ade80'); // Green

                            // Trigger Next Question
                            state.problem = generateProblem(state.level);
                            setHud(h => ({
                                ...h,
                                score: state.score,
                                equation: state.problem.equation
                            }));
                            // Refresh Invaders
                            spawnInvaders();
                        } else {
                            // WRONG!
                            state.combo = 0;
                            const penalty = 50;
                            state.score = Math.max(0, state.score - penalty);
                            setHud(h => ({ ...h, score: state.score }));

                            createFloatingText(inv.x, inv.y, `-${penalty}`, '#ef4444'); // Red

                            // Screen Shake
                            canvas.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
                            setTimeout(() => canvas.style.transform = 'none', 100);
                        }
                    }
                });
            });

            // 7. Floating Texts
            for (let i = state.texts.length - 1; i >= 0; i--) {
                const t = state.texts[i];
                t.y += t.vy;
                t.life -= 0.02;

                if (t.life <= 0) {
                    state.texts.splice(i, 1);
                    continue;
                }

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

    // --- HELPER: START GAME FROM MENU ---
    const startGame = () => {
        let diffLevel = DIFFICULTIES.BEGINNER;
        if (hud.difficulty === 'INTERMEDIATE') diffLevel = DIFFICULTIES.INTERMEDIATE;
        if (hud.difficulty === 'EXPERT') diffLevel = DIFFICULTIES.EXPERT;

        gameState.current.level = diffLevel;
        gameState.current.active = true;
        gameState.current.score = 0;
        gameState.current.timeLeft = 30;
        gameState.current.invaders = [];
        gameState.current.problem = generateProblem(diffLevel);
        gameState.current.lastTimeCheck = Date.now();

        // Explicitly call spawn logic logic via a reset flag or similar? 
        // Actually the game loop checks `if (!state.invaders... && !state.problem)`
        // But we just set state.problem. So loop needs to know to spawn.
        // Let's manually trigger spawn in the loop by clearing invaders (done above)
        // And relying on the loop's `if (invaders.length === 0)` block?
        // Wait, loop has `if (invaders.length === 0)` logic?
        // Ah, loop logic: `if (state.invaders.length === 0 && !state.problem)`.
        // We set state.problem. So invalid.
        // We need the loop to spawn if we have a problem but no invaders.
        // Let's rely on the fact that `spawnInvaders` was defined inside useEffect and not accessible here easily without ref logic.
        // Workaround: Set problem to null? No.
        // BETTER: Move spawnInvaders to a ref or just let loop handle "have problem, no invaders" -> spawn.
        // Let's look at loop: "if (state.invaders.length === 0 && !state.problem) { startLevel() }".
        // What if we have problem?
        // We need to add "if (state.invaders.length === 0 && state.problem) spawnInvaders()". 
        // BUT spawnInvaders is inside closure. 
        // To fix this cleanly: I will reset problem to null here, and let the loop generate it.

        gameState.current.problem = null; // Loop will see active=true, problem=null -> generate & spawn.

        setHud(h => ({ ...h, menu: false, timeLeft: 30, score: 0, gameOver: false, equation: "GET READY" }));
    };

    // --- RENDER ---
    return (
        <div className="w-full h-full relative bg-slate-900 overflow-hidden cursor-none touch-none">

            {/* MENU SCREEN */}
            {hud.menu && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-auto cursor-auto space-y-8 select-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-950 via-slate-950 to-black">

                    <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-500">
                        <span className="text-8xl leading-none mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">👾</span>
                        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-t from-purple-600 to-pink-400 tracking-tighter filter drop-shadow-[0_0_20px_rgba(147,51,234,0.5)] mb-2 italic transform -skew-x-6">
                            MATH INVADERS
                        </h1>
                    </div>

                    {/* DIFFICULTY SELECTOR */}
                    <div className="flex gap-4 mb-4 z-20">
                        {['BEGINNER', 'INTERMEDIATE', 'EXPERT'].map(d => (
                            <button
                                key={d}
                                onClick={() => setHud(h => ({ ...h, difficulty: d }))}
                                className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest border transition-all ${hud.difficulty === d ? 'bg-purple-600 border-purple-400 scale-110 shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white'}`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col gap-4 relative z-10 w-full max-w-xs">
                        <button
                            onClick={startGame}
                            className="w-full group relative overflow-hidden bg-purple-600 hover:bg-purple-500 text-white font-black text-xl rounded-xl py-6 shadow-[0_0_30px_rgba(147,51,234,0.3)] transition-all transform hover:scale-105 active:scale-95"
                        >
                            <span className="relative z-10 uppercase tracking-widest flex items-center justify-center gap-2">
                                <span>Start Mission</span>
                                <span className="text-2xl animate-pulse">🚀</span>
                            </span>
                        </button>

                        <button
                            onClick={onBack}
                            className="w-full py-4 text-xs font-bold text-slate-500 hover:text-white uppercase tracking-[0.2em] transition-colors hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10"
                        >
                            Abort Game
                        </button>
                    </div>
                </div>
            )}


            {/* HUD */}
            <div className="absolute top-0 w-full p-4 flex justify-between items-start pointer-events-none z-10">
                <div className="flex flex-col gap-1">
                    <div className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                        {hud.equation}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-mono text-cyan-400">SCORE: {hud.score}</div>
                    <div className={`text-xl font-bold font-mono mt-1 ${hud.timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        TIME: {hud.timeLeft}s
                    </div>
                </div>
            </div>

            {/* CANVAS LAYER */}
            <canvas ref={canvasRef} className="block w-full h-full" />

            {/* GAMEOVER OVERLAY */}
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

            {/* EXIT BUTTON (If not game over) */}
            {!hud.gameOver && !hud.menu && (
                <button
                    onClick={onBack}
                    className="absolute top-4 left-4 z-20 text-slate-500 hover:text-white pointer-events-auto"
                >
                    ESC
                </button>
            )}
        </div>
    );
}
