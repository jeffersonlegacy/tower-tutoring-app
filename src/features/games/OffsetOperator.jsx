import React, { useEffect, useRef, useState, useCallback } from 'react';
import GameEndOverlay from './GameEndOverlay';
import { generateMaze, getValidMoves, applyMove, CELL_TYPES } from './offsetOperator/mazeService';
import { generateEquationSet, validateAnswer, formatOffset, DIFFICULTIES } from './offsetOperator/equationEngine';

// --- CONSTANTS ---
const CELL_SIZE = 40;
const COLORS = {
    bg: '#0f172a',
    wall: '#1e293b',
    path: '#334155',
    pathGlow: 'rgba(6, 182, 212, 0.2)',
    player: '#06b6d4',
    playerGlow: 'rgba(6, 182, 212, 0.6)',
    start: '#22c55e',
    exit: '#eab308',
    exitGlow: 'rgba(234, 179, 8, 0.5)',
    trap: '#ec4899',
    trapGlow: 'rgba(236, 72, 153, 0.5)',
    junction: '#8b5cf6',
    junctionGlow: 'rgba(139, 92, 246, 0.4)'
};

// Movement phases
const PHASE = {
    WALKING: 'walking',      // Free movement until junction
    CHALLENGE: 'challenge',  // Solving equation at junction
    STUNNED: 'stunned'       // Brief pause after wrong answer
};

export default function OffsetOperator({ onBack }) {
    const canvasRef = useRef(null);
    const requestRef = useRef();

    // UI State
    const [hud, setHud] = useState({
        score: 0,
        timeLeft: 90,
        equation: '',
        offsets: {},
        options: [],
        variableX: null,
        streak: 0,
        gameOver: false,
        victory: false,
        menu: true,
        difficulty: 'BEGINNER',
        phase: PHASE.WALKING,
        moveHint: 'Use arrow keys or swipe to move'
    });

    // Game State (mutable ref for 60fps)
    const gameState = useRef({
        maze: null,
        player: { x: 1, y: 1 },
        playerPixel: { x: 0, y: 0 }, // Smooth animation position
        active: false,
        level: DIFFICULTIES.BEGINNER,
        score: 0,
        streak: 0,
        timeLeft: 90,
        lastTimeCheck: Date.now(),
        currentEquation: null,
        phase: PHASE.WALKING,
        stunEndTime: 0,
        wallCloseProgress: 0,
        particles: [],
        frame: 0,
        pendingDirection: null // Direction to move after solving
    });

    // --- INITIALIZE LEVEL ---
    const initLevel = useCallback(() => {
        const state = gameState.current;
        state.maze = generateMaze(10);
        state.player = { ...state.maze.start };
        state.playerPixel = {
            x: state.player.x * CELL_SIZE + CELL_SIZE / 2,
            y: state.player.y * CELL_SIZE + CELL_SIZE / 2
        };
        state.wallCloseProgress = 0;
        state.phase = PHASE.WALKING;
        state.currentEquation = null;

        setHud(h => ({
            ...h,
            phase: PHASE.WALKING,
            equation: '',
            offsets: {},
            options: [],
            moveHint: 'Use arrow keys or swipe to move'
        }));
    }, []);

    // --- CHECK IF AT JUNCTION (3+ paths) ---
    const isJunction = useCallback((x, y) => {
        const state = gameState.current;
        if (!state.maze) return false;
        const moves = getValidMoves(state.maze.grid, x, y);
        return moves.length >= 3;
    }, []);

    // --- TRY TO MOVE PLAYER ---
    const tryMove = useCallback((direction) => {
        const state = gameState.current;
        if (!state.active || state.phase !== PHASE.WALKING) return;

        const moves = getValidMoves(state.maze.grid, state.player.x, state.player.y);

        if (!moves.includes(direction)) {
            // Can't go that way - subtle feedback
            if (canvasRef.current) {
                canvasRef.current.style.transform = `translate(${Math.random() * 4 - 2}px, 0)`;
                setTimeout(() => {
                    if (canvasRef.current) canvasRef.current.style.transform = 'none';
                }, 50);
            }
            return;
        }

        const newPos = applyMove(state.player.x, state.player.y, direction);
        const cellType = state.maze.grid[newPos.y][newPos.x];

        // Check for trap BEFORE moving
        if (cellType === CELL_TYPES.TRAP) {
            // Move to trap then penalize
            state.player = newPos;
            state.streak = 0;
            state.score = Math.max(0, state.score - 100);
            state.timeLeft = Math.max(0, state.timeLeft - 5);
            createParticles(newPos.x * CELL_SIZE + CELL_SIZE / 2, newPos.y * CELL_SIZE + CELL_SIZE / 2, COLORS.trap, 25);

            // Stun briefly
            state.phase = PHASE.STUNNED;
            state.stunEndTime = Date.now() + 1000;

            setHud(h => ({
                ...h,
                score: state.score,
                streak: 0,
                timeLeft: state.timeLeft,
                phase: PHASE.STUNNED,
                moveHint: '⚠️ TRAP! -100 pts'
            }));
            return;
        }

        // Check for exit
        if (cellType === CELL_TYPES.EXIT) {
            state.player = newPos;
            state.active = false;
            const bonus = state.timeLeft * 10;
            state.score += bonus + (state.streak * 50);
            setHud(h => ({ ...h, victory: true, gameOver: true, score: state.score }));
            return;
        }

        // Check if entering a junction - trigger challenge
        const nextMoves = getValidMoves(state.maze.grid, newPos.x, newPos.y);
        if (nextMoves.length >= 3) {
            // At a junction! Don't move yet - show challenge
            state.pendingDirection = null; // Clear - they need to solve first
            state.phase = PHASE.CHALLENGE;
            state.currentEquation = generateEquationSet(nextMoves, state.level);

            // Move to junction first
            state.player = newPos;
            state.score += 10; // Small reward for reaching junction

            setHud(h => ({
                ...h,
                phase: PHASE.CHALLENGE,
                equation: state.currentEquation.equation,
                offsets: state.currentEquation.offsets,
                options: state.currentEquation.options,
                variableX: state.currentEquation.variableX,
                score: state.score,
                moveHint: '🧠 Solve to choose direction!'
            }));
        } else {
            // Normal move on corridor
            state.player = newPos;
            state.score += 5;
            createParticles(newPos.x * CELL_SIZE + CELL_SIZE / 2, newPos.y * CELL_SIZE + CELL_SIZE / 2, COLORS.player, 5);
            setHud(h => ({ ...h, score: state.score }));
        }
    }, []);

    // --- HANDLE ANSWER AT JUNCTION ---
    const handleAnswer = useCallback((answer) => {
        const state = gameState.current;
        if (!state.active || state.phase !== PHASE.CHALLENGE || !state.currentEquation) return;

        const { correct, targetDirection } = validateAnswer(answer, state.currentEquation.offsets);

        if (correct && targetDirection) {
            // Move in the solved direction
            const newPos = applyMove(state.player.x, state.player.y, targetDirection);
            state.player = newPos;
            state.streak++;
            const points = 50 + (state.streak * 15);
            state.score += points;

            createParticles(
                newPos.x * CELL_SIZE + CELL_SIZE / 2,
                newPos.y * CELL_SIZE + CELL_SIZE / 2,
                '#4ade80', 15
            );

            // Check what we landed on
            const cellType = state.maze.grid[newPos.y][newPos.x];
            if (cellType === CELL_TYPES.EXIT) {
                state.active = false;
                const bonus = state.timeLeft * 10;
                state.score += bonus;
                setHud(h => ({ ...h, victory: true, gameOver: true, score: state.score }));
                return;
            }
            if (cellType === CELL_TYPES.TRAP) {
                state.streak = 0;
                state.score = Math.max(0, state.score - 100);
                state.phase = PHASE.STUNNED;
                state.stunEndTime = Date.now() + 1000;
                setHud(h => ({
                    ...h,
                    score: state.score,
                    streak: 0,
                    phase: PHASE.STUNNED,
                    moveHint: '⚠️ TRAP!'
                }));
                return;
            }

            // Back to walking
            state.phase = PHASE.WALKING;
            state.currentEquation = null;
            setHud(h => ({
                ...h,
                phase: PHASE.WALKING,
                score: state.score,
                streak: state.streak,
                equation: '',
                offsets: {},
                options: [],
                moveHint: `✓ Correct! +${points} pts`
            }));

            // Clear hint after delay
            setTimeout(() => {
                setHud(h => ({ ...h, moveHint: 'Use arrow keys or swipe to move' }));
            }, 1500);
        } else {
            // Wrong answer - time penalty, stay at junction
            state.streak = 0;
            state.score = Math.max(0, state.score - 25);
            state.timeLeft = Math.max(0, state.timeLeft - 3);

            if (canvasRef.current) {
                canvasRef.current.style.transform = `translate(${Math.random() * 8 - 4}px, ${Math.random() * 8 - 4}px)`;
                setTimeout(() => {
                    if (canvasRef.current) canvasRef.current.style.transform = 'none';
                }, 100);
            }

            setHud(h => ({
                ...h,
                score: state.score,
                streak: 0,
                timeLeft: state.timeLeft,
                moveHint: '✗ Wrong! Try again (-3s)'
            }));
        }
    }, []);

    // --- PARTICLE SYSTEM ---
    const createParticles = (x, y, color, count) => {
        const state = gameState.current;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            state.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: Math.random() * 0.03 + 0.02,
                color,
                size: Math.random() * 4 + 2
            });
        }
    };

    // --- KEYBOARD CONTROLS ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            const state = gameState.current;
            if (!state.active) return;

            if (state.phase === PHASE.WALKING) {
                switch (e.key) {
                    case 'ArrowUp': case 'w': case 'W':
                        e.preventDefault();
                        tryMove('up');
                        break;
                    case 'ArrowDown': case 's': case 'S':
                        e.preventDefault();
                        tryMove('down');
                        break;
                    case 'ArrowLeft': case 'a': case 'A':
                        e.preventDefault();
                        tryMove('left');
                        break;
                    case 'ArrowRight': case 'd': case 'D':
                        e.preventDefault();
                        tryMove('right');
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [tryMove]);

    // --- TOUCH/SWIPE CONTROLS ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let touchStart = null;

        const handleTouchStart = (e) => {
            touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        };

        const handleTouchEnd = (e) => {
            if (!touchStart) return;
            const state = gameState.current;
            if (!state.active || state.phase !== PHASE.WALKING) return;

            const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
            const dx = touchEnd.x - touchStart.x;
            const dy = touchEnd.y - touchStart.y;
            const threshold = 30;

            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
                tryMove(dx > 0 ? 'right' : 'left');
            } else if (Math.abs(dy) > threshold) {
                tryMove(dy > 0 ? 'down' : 'up');
            }
            touchStart = null;
        };

        canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchend', handleTouchEnd);
        };
    }, [tryMove]);

    // --- GAME LOOP ---
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            if (!canvas?.parentElement) return;
            canvas.width = Math.min(canvas.parentElement.clientWidth, 440);
            canvas.height = Math.min(canvas.parentElement.clientHeight, 440);
        };
        window.addEventListener('resize', resize);
        resize();

        const update = () => {
            const state = gameState.current;
            const now = Date.now();

            // Handle stun recovery
            if (state.phase === PHASE.STUNNED && now >= state.stunEndTime) {
                state.phase = PHASE.WALKING;
                setHud(h => ({
                    ...h,
                    phase: PHASE.WALKING,
                    moveHint: 'Use arrow keys or swipe to move'
                }));
            }

            // Timer (only when active and not stunned)
            if (state.active && state.phase !== PHASE.STUNNED) {
                const dt = now - state.lastTimeCheck;
                if (dt >= 1000) {
                    state.timeLeft -= 1;
                    state.lastTimeCheck = now;
                    state.wallCloseProgress = Math.min(1, state.wallCloseProgress + 0.015);

                    setHud(h => ({ ...h, timeLeft: state.timeLeft }));

                    if (state.timeLeft <= 0) {
                        state.active = false;
                        setHud(h => ({ ...h, gameOver: true, victory: false }));
                    }
                }
            }
            state.frame++;

            // Smooth player position interpolation
            if (state.maze) {
                const targetX = state.player.x * CELL_SIZE + CELL_SIZE / 2;
                const targetY = state.player.y * CELL_SIZE + CELL_SIZE / 2;
                state.playerPixel.x += (targetX - state.playerPixel.x) * 0.2;
                state.playerPixel.y += (targetY - state.playerPixel.y) * 0.2;
            }

            // Clear
            ctx.fillStyle = COLORS.bg;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw maze
            if (state.maze) {
                const offsetX = (canvas.width - state.maze.size * CELL_SIZE) / 2;
                const offsetY = (canvas.height - state.maze.size * CELL_SIZE) / 2;

                // Grid cells
                for (let y = 0; y < state.maze.size; y++) {
                    for (let x = 0; x < state.maze.size; x++) {
                        const cell = state.maze.grid[y][x];
                        const px = offsetX + x * CELL_SIZE;
                        const py = offsetY + y * CELL_SIZE;

                        // Closing walls darkness
                        const distFromCenter = Math.max(
                            Math.abs(x - state.maze.size / 2),
                            Math.abs(y - state.maze.size / 2)
                        ) / (state.maze.size / 2);
                        const closingDarkness = distFromCenter * state.wallCloseProgress * 0.6;
                        ctx.globalAlpha = 1 - closingDarkness;

                        switch (cell) {
                            case CELL_TYPES.WALL:
                                ctx.fillStyle = COLORS.wall;
                                ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                                break;
                            case CELL_TYPES.PATH:
                                ctx.fillStyle = COLORS.path;
                                ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                                break;
                            case CELL_TYPES.START:
                                ctx.fillStyle = COLORS.start;
                                ctx.shadowColor = COLORS.start;
                                ctx.shadowBlur = 8;
                                ctx.fillRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
                                ctx.shadowBlur = 0;
                                break;
                            case CELL_TYPES.EXIT:
                                ctx.fillStyle = COLORS.exit;
                                ctx.shadowColor = COLORS.exitGlow;
                                ctx.shadowBlur = 15 + Math.sin(state.frame * 0.1) * 5;
                                ctx.fillRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
                                ctx.shadowBlur = 0;
                                ctx.fillStyle = '#000';
                                ctx.font = 'bold 18px sans-serif';
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'middle';
                                ctx.fillText('★', px + CELL_SIZE / 2, py + CELL_SIZE / 2);
                                break;
                            case CELL_TYPES.TRAP:
                                ctx.fillStyle = COLORS.path;
                                ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                                ctx.fillStyle = COLORS.trap;
                                ctx.shadowColor = COLORS.trapGlow;
                                ctx.shadowBlur = 6;
                                ctx.beginPath();
                                ctx.moveTo(px + CELL_SIZE / 2, py + 6);
                                ctx.lineTo(px + CELL_SIZE - 8, py + CELL_SIZE - 6);
                                ctx.lineTo(px + 8, py + CELL_SIZE - 6);
                                ctx.closePath();
                                ctx.fill();
                                ctx.shadowBlur = 0;
                                break;
                            case CELL_TYPES.JUNCTION:
                                ctx.fillStyle = COLORS.path;
                                ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                                // Pulsing junction indicator
                                const pulse = 0.5 + Math.sin(state.frame * 0.08) * 0.3;
                                ctx.strokeStyle = `rgba(139, 92, 246, ${pulse})`;
                                ctx.shadowColor = COLORS.junctionGlow;
                                ctx.shadowBlur = 8;
                                ctx.lineWidth = 3;
                                ctx.strokeRect(px + 4, py + 4, CELL_SIZE - 8, CELL_SIZE - 8);
                                ctx.shadowBlur = 0;
                                // Question mark for unsolved junctions
                                if (state.phase !== PHASE.CHALLENGE ||
                                    state.player.x !== x || state.player.y !== y) {
                                    ctx.fillStyle = 'rgba(139, 92, 246, 0.6)';
                                    ctx.font = 'bold 16px sans-serif';
                                    ctx.textAlign = 'center';
                                    ctx.textBaseline = 'middle';
                                    ctx.fillText('?', px + CELL_SIZE / 2, py + CELL_SIZE / 2);
                                }
                                break;
                            default:
                                ctx.fillStyle = COLORS.path;
                                ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                        }
                        ctx.globalAlpha = 1;
                    }
                }

                // Draw direction arrows when at junction in challenge mode
                if (state.phase === PHASE.CHALLENGE && state.currentEquation) {
                    const moves = getValidMoves(state.maze.grid, state.player.x, state.player.y);
                    moves.forEach(dir => {
                        const offset = state.currentEquation.offsets[dir];
                        if (!offset) return;

                        const pos = applyMove(state.player.x, state.player.y, dir);
                        const signX = offsetX + pos.x * CELL_SIZE + CELL_SIZE / 2;
                        const signY = offsetY + pos.y * CELL_SIZE + CELL_SIZE / 2;

                        // Direction arrow
                        ctx.fillStyle = 'rgba(139, 92, 246, 0.9)';
                        ctx.font = 'bold 20px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        const arrow = dir === 'up' ? '↑' : dir === 'down' ? '↓' : dir === 'left' ? '←' : '→';
                        ctx.fillText(arrow, signX, signY - 8);

                        // Offset label
                        ctx.font = 'bold 12px monospace';
                        ctx.fillStyle = '#fff';
                        ctx.fillText(formatOffset(offset), signX, signY + 10);
                    });
                }

                // Draw player (smooth animated position)
                const playerPx = offsetX + state.playerPixel.x;
                const playerPy = offsetY + state.playerPixel.y;

                // Glow effect
                ctx.shadowColor = state.phase === PHASE.STUNNED ? COLORS.trap : COLORS.playerGlow;
                ctx.shadowBlur = 20;
                ctx.fillStyle = state.phase === PHASE.STUNNED ? COLORS.trap : COLORS.player;
                ctx.beginPath();
                ctx.arc(playerPx, playerPy, 14, 0, Math.PI * 2);
                ctx.fill();

                // Inner bright core
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(playerPx, playerPy, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            // Particles
            for (let i = state.particles.length - 1; i >= 0; i--) {
                const p = state.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= p.decay;

                if (p.life <= 0) {
                    state.particles.splice(i, 1);
                    continue;
                }

                const offsetX = (canvas.width - (state.maze?.size || 10) * CELL_SIZE) / 2;
                const offsetY = (canvas.height - (state.maze?.size || 10) * CELL_SIZE) / 2;

                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(offsetX + p.x, offsetY + p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            requestRef.current = requestAnimationFrame(update);
        };

        requestRef.current = requestAnimationFrame(update);
        return () => {
            cancelAnimationFrame(requestRef.current);
            window.removeEventListener('resize', resize);
        };
    }, []);

    // --- START GAME ---
    const startGame = () => {
        let level = DIFFICULTIES.BEGINNER;
        if (hud.difficulty === 'INTERMEDIATE') level = DIFFICULTIES.INTERMEDIATE;
        if (hud.difficulty === 'EXPERT') level = DIFFICULTIES.EXPERT;

        const state = gameState.current;
        state.level = level;
        state.active = true;
        state.score = 0;
        state.streak = 0;
        state.timeLeft = 90;
        state.lastTimeCheck = Date.now();
        state.particles = [];
        state.phase = PHASE.WALKING;

        initLevel();

        setHud(h => ({
            ...h,
            menu: false,
            gameOver: false,
            victory: false,
            score: 0,
            streak: 0,
            timeLeft: 90,
            phase: PHASE.WALKING
        }));
    };

    // --- RENDER ---
    return (
        <div className="w-full h-full relative bg-slate-900 overflow-hidden flex flex-col">

            {/* MENU SCREEN */}
            {hud.menu && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-auto space-y-6 select-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950 via-slate-950 to-black">

                    <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-500">
                        <span className="text-7xl leading-none mb-4 animate-pulse drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]">🤖</span>
                        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-t from-cyan-600 to-teal-300 tracking-tighter filter drop-shadow-[0_0_25px_rgba(6,182,212,0.5)] mb-1 italic transform -skew-x-3">
                            OFFSET OPERATOR
                        </h1>
                        <p className="text-cyan-400/60 text-sm tracking-widest uppercase">Math Maze</p>
                    </div>

                    {/* HOW TO PLAY */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 max-w-xs text-center">
                        <p className="text-slate-400 text-xs mb-2">🎮 <span className="text-white">Arrow keys</span> or <span className="text-white">swipe</span> to walk</p>
                        <p className="text-slate-400 text-xs">🧠 At <span className="text-purple-400">junctions</span>: solve equation + offset to choose direction</p>
                    </div>

                    {/* DIFFICULTY SELECTOR */}
                    <div className="flex gap-3 z-20">
                        {['BEGINNER', 'INTERMEDIATE', 'EXPERT'].map(d => (
                            <button
                                key={d}
                                onClick={() => setHud(h => ({ ...h, difficulty: d }))}
                                className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest border transition-all ${hud.difficulty === d
                                        ? 'bg-cyan-600 border-cyan-400 scale-110 shadow-lg shadow-cyan-500/30'
                                        : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white'
                                    }`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3 relative z-10 w-full max-w-xs px-4">
                        <button
                            onClick={startGame}
                            className="w-full group relative overflow-hidden bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xl rounded-xl py-5 shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all transform hover:scale-105 active:scale-95"
                        >
                            <span className="relative z-10 uppercase tracking-widest flex items-center justify-center gap-2">
                                <span>Enter Maze</span>
                                <span className="text-2xl">🔐</span>
                            </span>
                        </button>

                        <button
                            onClick={onBack}
                            className="w-full py-3 text-xs font-bold text-slate-500 hover:text-white uppercase tracking-[0.2em] transition-colors hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10"
                        >
                            Exit
                        </button>
                    </div>
                </div>
            )}

            {/* HUD - Walking Phase */}
            {!hud.menu && !hud.gameOver && (
                <div className="flex justify-between items-start p-3 bg-slate-900/90 backdrop-blur-sm z-10 border-b border-slate-800">
                    <div className="flex flex-col">
                        <div className="text-xs text-slate-500 uppercase tracking-wide">Score</div>
                        <div className="text-2xl font-mono font-bold text-cyan-400">{hud.score}</div>
                        {hud.streak > 1 && (
                            <div className="text-xs text-yellow-400 font-bold">🔥 {hud.streak}x</div>
                        )}
                    </div>
                    <div className="text-center flex-1">
                        <div className={`text-sm font-bold px-3 py-1 rounded-full inline-block ${hud.phase === PHASE.CHALLENGE
                                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                                : hud.phase === PHASE.STUNNED
                                    ? 'bg-red-600/30 text-red-300 border border-red-500/50 animate-pulse'
                                    : 'bg-slate-800 text-slate-400'
                            }`}>
                            {hud.moveHint}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-slate-500 uppercase tracking-wide">Time</div>
                        <div className={`text-2xl font-mono font-bold ${hud.timeLeft <= 20 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                            {hud.timeLeft}s
                        </div>
                    </div>
                </div>
            )}

            {/* CANVAS */}
            <div className="flex-1 flex items-center justify-center p-2 relative">
                <canvas ref={canvasRef} className="block max-w-full max-h-full rounded-lg" />

                {/* Mobile D-Pad overlay (bottom corners) */}
                {!hud.menu && !hud.gameOver && hud.phase === PHASE.WALKING && (
                    <div className="absolute bottom-6 left-4 right-4 flex justify-between pointer-events-none md:hidden pb-safe">
                        {/* Left D-pad */}
                        <div className="grid grid-cols-3 gap-2 pointer-events-auto bg-slate-900/50 p-2 rounded-2xl backdrop-blur-sm mx-auto">
                            <div></div>
                            <button onClick={() => tryMove('up')} className="w-14 h-14 bg-slate-800/90 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 transition-all">↑</button>
                            <div></div>
                            <button onClick={() => tryMove('left')} className="w-14 h-14 bg-slate-800/90 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 transition-all">←</button>
                            <div></div>
                            <button onClick={() => tryMove('right')} className="w-14 h-14 bg-slate-800/90 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 transition-all">→</button>
                            <div></div>
                            <button onClick={() => tryMove('down')} className="w-14 h-14 bg-slate-800/90 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 transition-all">↓</button>
                            <div></div>
                        </div>
                    </div>
                )}
            </div>

            {/* CHALLENGE PANEL - Only at junctions */}
            {!hud.menu && !hud.gameOver && hud.phase === PHASE.CHALLENGE && (
                <div className="bg-purple-900/40 backdrop-blur-sm border-t border-purple-500/30 p-4 animate-in slide-in-from-bottom duration-300">
                    {/* Equation */}
                    <div className="text-center mb-3">
                        <div className="text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                            {hud.equation}
                        </div>
                        {hud.variableX && (
                            <div className="text-sm text-purple-300 font-mono mt-1">x = {hud.variableX}</div>
                        )}
                    </div>

                    {/* Direction hints */}
                    <div className="flex justify-center gap-3 mb-3 text-xs">
                        {Object.entries(hud.offsets).map(([dir, offset]) => (
                            <div key={dir} className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded">
                                <span className="text-purple-400">{dir === 'up' ? '↑' : dir === 'down' ? '↓' : dir === 'left' ? '←' : '→'}</span>
                                <span className="font-mono font-bold text-white">{formatOffset(offset)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Answer buttons */}
                    <div className="grid grid-cols-3 gap-2">
                        {hud.options.map((opt, i) => (
                            <button
                                key={i}
                                onClick={() => handleAnswer(opt)}
                                className="py-3 bg-slate-800 hover:bg-purple-600 text-white font-black text-xl rounded-xl border-2 border-slate-700 hover:border-purple-400 transition-all transform hover:scale-105 active:scale-95"
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* GAME OVER */}
            {hud.gameOver && (
                <GameEndOverlay
                    winner={hud.victory}
                    title={hud.victory ? "MAZE ESCAPED!" : "TIME'S UP!"}
                    icon={hud.victory ? "🏆" : "⏰"}
                    score={hud.score}
                    onRestart={() => setHud(h => ({ ...h, menu: true, gameOver: false }))}
                    onExit={onBack}
                />
            )}

            {/* BACK BUTTON */}
            {!hud.menu && !hud.gameOver && (
                <button
                    onClick={onBack}
                    className="absolute top-3 left-3 z-20 text-slate-600 hover:text-white text-xs bg-slate-800/50 px-2 py-1 rounded"
                >
                    ESC
                </button>
            )}
        </div>
    );
}
