import React, { useEffect, useRef, useState } from 'react';

// --- MATH LOGIC ---
const DIFFICULTIES = {
    BEGINNER: 1,
    INTERMEDIATE: 2,
    EXPERT: 3
};

const generateProblem = (difficulty) => {
    let a, b, op, answer, decoys = [];

    if (difficulty === DIFFICULTIES.BEGINNER) {
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
        a = Math.floor(Math.random() * 11) + 2;
        b = Math.floor(Math.random() * 11) + 2;
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
    while (decoys.length < 5) { // We need decent pool
        const d = potentialDecoys[Math.floor(Math.random() * potentialDecoys.length)];
        if (d !== answer && d >= 0 && !decoys.includes(d)) {
            decoys.push(d);
        }
        // Fallback random if we run out of "smart" decoys
        if (decoys.length < 5 && Math.random() > 0.8) {
            let r = Math.floor(Math.random() * 50);
            if (r !== answer && !decoys.includes(r)) decoys.push(r);
        }
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
        menu: true // Start in Menu
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
        level: 1,
        active: true,
        combo: 0
    });

    // --- GAME ENGINE ---
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Handle Resize
        const resize = () => {
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
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const x = clientX - rect.left;

            // Smoother clamping
            gameState.current.player.x = Math.max(20, Math.min(canvas.width - 20, x));
        };

        canvas.addEventListener('mousemove', handleInput);
        canvas.addEventListener('touchmove', handleInput, { passive: false });

        // --- INIT LEVEL ---
        const startLevel = () => {
            // ensure menu off
            setHud(h => ({ ...h, menu: false, timeLeft: 30, score: 0, gameOver: false }));

            const state = gameState.current;
            state.active = true;
            state.score = 0;
            state.timeLeft = 30; // Reset time
            state.texts = []; // Clear texts
            state.problem = generateProblem(state.level === 1 ? DIFFICULTIES.BEGINNER : DIFFICULTIES.INTERMEDIATE);

            // HUD update handled above or here redundant but safe
            setHud(prev => ({ ...prev, equation: state.problem.equation, menu: false, timeLeft: 30, score: 0 }));

            spawnInvaders();
            state.lastTimeCheck = Date.now(); // Reset timer delta
        };

        const spawnInvaders = () => {
            const state = gameState.current;
            state.invaders = [];

            const cols = 5;
            const startX = (canvas.width - (cols * 60)) / 2; // Center grid

            // Always ensure one Correct Answer
            const targetIndex = Math.floor(Math.random() * cols);

            for (let i = 0; i < cols; i++) {
                const isTarget = i === targetIndex;
                const val = isTarget ? state.problem.answer : state.problem.decoys[i % state.problem.decoys.length];

                // Randomized Bonus for correct answer (10-50 pts extra)
                const bonus = Math.floor(Math.random() * 5) * 10 + 10;

                state.invaders.push({
                    x: startX + (i * 60),
                    y: -100, // Drop in
                    targetY: 100, // Final grid Y
                    w: 40,
                    h: 40,
                    val: val,
                    isTarget: isTarget,
                    bonus: bonus,
                    // FIX: Uniform color (Cyberpunk Purple) so player MUST do math
                    hue: 280
                });
            }
        };

        // --- EXPLOSION ---
        const createExplosion = (x, y, color) => {
            for (let i = 0; i < 15; i++) {
                gameState.current.particles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 10,
                    life: 1.0,
                    color: color
                });
            }
        };

        // --- FLOATING TEXT ---
        const createFloatingText = (x, y, text, color) => {
            gameState.current.texts.push({
                x, y, text, color,
                life: 1.0,
                vy: -2 // Float up
            });
        };

        // --- LOOP ---
        const update = () => {
            if (!gameState.current.active) return;

            const state = gameState.current;
            const now = Date.now();

            // TIMER LOGIC
            const dt = now - state.lastTimeCheck;
            if (dt >= 1000) {
                state.timeLeft -= 1;
                state.lastTimeCheck = now;
                setHud(h => ({ ...h, timeLeft: state.timeLeft }));

                if (state.timeLeft <= 0) {
                    state.active = false;
                    setHud(h => ({ ...h, gameOver: true, timeLeft: 0 }));
                    return; // Stop update
                }
            }

            state.frame++;

            // 1. Clear
            ctx.fillStyle = '#0f172a'; // Slate-900
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Grid Background Effect
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)';
            ctx.lineWidth = 1;
            const timeOffset = (state.frame * 2) % 40;
            for (let y = timeOffset; y < canvas.height; y += 40) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // 2. Player (Ship)
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#06b6d4'; // Cyan glow
            ctx.fillStyle = '#06b6d4';

            const px = state.player.x;
            const py = state.player.y;

            // Draw Triangle Ship
            ctx.beginPath();
            ctx.moveTo(px, py - 20);
            ctx.lineTo(px - 15, py + 15);
            ctx.lineTo(px, py + 5); // Engine notch
            ctx.lineTo(px + 15, py + 15);
            ctx.closePath();
            ctx.fill();

            // 3. Bullets (Auto Fire)
            if (now - state.lastFired > 200) { // Fire rate
                state.bullets.push({ x: px, y: py - 20 });
                state.lastFired = now;
            }

            ctx.shadowColor = '#f472b6'; // Pink bullets
            ctx.fillStyle = '#f472b6';

            // Update & Draw Bullets
            for (let i = state.bullets.length - 1; i >= 0; i--) {
                const b = state.bullets[i];
                b.y -= 15; // Speed
                ctx.fillRect(b.x - 2, b.y, 4, 15);

                if (b.y < -20) state.bullets.splice(i, 1);
            }

            // 4. Invaders
            if (state.invaders.length === 0 && state.problem) {
                // Should not happen unless level transition, handled elsewhere?
            } else if (!state.problem) {
                startLevel();
            }

            // Move Invaders
            state.invaders.forEach(inv => {
                // Ease to targetY
                if (inv.y < inv.targetY) inv.y += 5;

                // Bobbing motion
                inv.finalY = inv.targetY + Math.sin(state.frame * 0.05) * 10;

                // Draw
                ctx.shadowBlur = 15;
                ctx.shadowColor = `hsl(${inv.hue}, 100%, 50%)`;
                ctx.strokeStyle = `hsl(${inv.hue}, 100%, 70%)`;
                ctx.lineWidth = 2;
                ctx.strokeRect(inv.x - 20, inv.finalY - 20, 40, 40);

                // Text
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 20px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(inv.val, inv.x, inv.finalY);
            });

            // 5. Collision Detection
            state.bullets.forEach((b, bIdx) => {
                state.invaders.forEach((inv, iIdx) => {
                    // Simple Box/Point Collision
                    if (b.x > inv.x - 25 && b.x < inv.x + 25 &&
                        b.y > inv.finalY - 25 && b.y < inv.finalY + 25) {

                        // Collision!
                        state.bullets.splice(bIdx, 1);
                        createExplosion(inv.x, inv.finalY, inv.isTarget ? '#00ff00' : '#ff0000');

                        if (inv.isTarget) {
                            // CORRECT!
                            state.bullets = []; // Clear bullets
                            // Score: Base (50) + Combo (10*count) + Random Bonus (10-50)
                            const points = 50 + (state.combo * 10) + inv.bonus;
                            state.score += points;
                            state.combo++;

                            createFloatingText(inv.x, inv.finalY, `+${points}`, '#4ade80'); // Green

                            // Trigger Next Question
                            state.problem = generateProblem(state.level === 1 ? DIFFICULTIES.BEGINNER : DIFFICULTIES.INTERMEDIATE);
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

                            createFloatingText(inv.x, inv.finalY, `-${penalty}`, '#ef4444'); // Red

                            // Screen Shake
                            canvas.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
                            setTimeout(() => canvas.style.transform = 'none', 100);
                        }
                    }
                });
            });

            // 6. Particles
            for (let i = state.particles.length - 1; i >= 0; i--) {
                const p = state.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.05;
                p.vy += 0.5; // Gravity

                if (p.life <= 0) {
                    state.particles.splice(i, 1);
                    continue;
                }

                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, 3, 3);
                ctx.globalAlpha = 1.0;
            }

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

    // --- RENDER ---
    return (
        <div className="w-full h-full relative bg-slate-900 overflow-hidden cursor-none touch-none">

            {/* MENU SCREEN */}
            {hud.menu && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-auto cursor-auto space-y-8 select-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-950 via-slate-950 to-black">

                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(147,51,234,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(147,51,234,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] opacity-30 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-500">
                        <span className="text-8xl leading-none mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">👾</span>
                        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-t from-purple-600 to-pink-400 tracking-tighter filter drop-shadow-[0_0_20px_rgba(147,51,234,0.5)] mb-2 italic transform -skew-x-6">
                            MATH INVADERS
                        </h1>
                        <p className="text-pink-400 font-mono font-bold tracking-[0.5em] text-sm animate-pulse uppercase">Defender of the Grid</p>
                    </div>

                    <div className="flex flex-col gap-4 relative z-10 w-full max-w-xs">
                        <button
                            onClick={() => {
                                gameState.current.problem = null;
                                gameState.current.score = 0;
                                gameState.current.timeLeft = 30;
                                gameState.current.active = true;
                                gameState.current.invaders = [];
                                setHud(h => ({ ...h, menu: false, timeLeft: 30, score: 0 }));
                            }}
                            className="w-full group relative overflow-hidden bg-purple-600 hover:bg-purple-500 text-white font-black text-xl rounded-xl py-6 shadow-[0_0_30px_rgba(147,51,234,0.3)] transition-all transform hover:scale-105 active:scale-95"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 transform skew-y-12"></div>
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

                    <div className="absolute bottom-8 text-[10px] text-purple-500/50 font-mono tracking-widest uppercase">
                        High Score: {localStorage.getItem('math_invaders_hs') || 0}
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
                    {/* Time Display */}
                    <div className={`text-xl font-bold font-mono mt-1 ${hud.timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        TIME: {hud.timeLeft}s
                    </div>
                </div>
            </div>

            {/* CANVAS LAYER */}
            <canvas ref={canvasRef} className="block w-full h-full" />

            {/* GAMEOVER OVERLAY */}
            {hud.gameOver && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 pointer-events-auto cursor-auto">
                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-600 mb-4 animate-bounce">
                        TIME'S UP!
                    </h1>
                    <div className="text-2xl font-mono text-white mb-8">FINAL SCORE: {hud.score}</div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => {
                                gameState.current.invaders = [];
                                gameState.current.problem = null;
                                setHud(h => ({ ...h, menu: true, timeLeft: 30, score: 0, gameOver: false }));
                            }}
                            className="px-8 py-4 bg-purple-600 text-white font-bold rounded hover:scale-105 transition-transform uppercase tracking-widest shadow-lg"
                        >
                            Restart Mission
                        </button>
                        <button
                            onClick={onBack}
                            className="px-8 py-4 bg-white text-black font-bold rounded hover:scale-105 transition-transform uppercase tracking-widest"
                        >
                            Return to Base
                        </button>
                    </div>
                    <div className="mt-4 text-slate-500 text-sm">Mission Complete</div>
                </div>
            )}

            {/* EXIT BUTTON (If not game over) */}
            {!hud.gameOver && (
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
