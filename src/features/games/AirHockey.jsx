import React, { useRef, useEffect, useState } from 'react';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const PADDLE_RADIUS = 25;
const PUCK_RADIUS = 15;
const FRICTION = 0.99;

export default function AirHockey({ onBack }) {
    const canvasRef = useRef(null);
    const [score, setScore] = useState({ player: 0, ai: 0 });
    const [gameState, setGameState] = useState('menu'); // menu, playing
    
    // Game State Refs (avoid re-renders during loop)
    const state = useRef({
        puck: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, vx: 0, vy: 0 },
        player: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 50 },
        ai: { x: CANVAS_WIDTH / 2, y: 50, speed: 3 }
    });
    
    const requestRef = useRef();

    useEffect(() => {
        if (gameState !== 'playing') return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        const update = () => {
             // 1. AI Movement (Simple tracking)
             const puck = state.current.puck;
             const ai = state.current.ai;
             
             // AI only moves if puck is in its half (top half)
             const targetX = puck.x;
             const dx = targetX - ai.x;
             
             // Move towards puck
             if (Math.abs(dx) > ai.speed) {
                 ai.x += dx > 0 ? ai.speed : -ai.speed;
             }
             
             // Keep AI in bounds
             ai.x = Math.max(PADDLE_RADIUS, Math.min(CANVAS_WIDTH - PADDLE_RADIUS, ai.x));
             // AI tends to stay in defensive line a bit
             if (puck.y < CANVAS_HEIGHT / 2) {
                 // Attack mode if close
                 if (puck.y < 150) ai.y += (puck.y - ai.y) * 0.05;
                 else ai.y += (50 - ai.y) * 0.05; // Return to defense
             }

            // 2. Physics & Friction
            puck.x += puck.vx;
            puck.y += puck.vy;
            puck.vx *= FRICTION;
            puck.vy *= FRICTION;

            // 3. Wall Collisions
            if (puck.x - PUCK_RADIUS < 0) { puck.x = PUCK_RADIUS; puck.vx *= -1; }
            if (puck.x + PUCK_RADIUS > CANVAS_WIDTH) { puck.x = CANVAS_WIDTH - PUCK_RADIUS; puck.vx *= -1; }
            
            // Goal Collisions (Top and Bottom walls mostly bounce, except hole)
            if (puck.y - PUCK_RADIUS < 0) {
                 if (puck.x > 120 && puck.x < 280) { // Goal width approx
                     // Player Scored!
                     setScore(s => ({ ...s, player: s.player + 1 }));
                     resetPuck(CANVAS_HEIGHT / 2 + 50); // Reset closer to loser
                 } else {
                     puck.y = PUCK_RADIUS; puck.vy *= -1;
                 }
            }
            if (puck.y + PUCK_RADIUS > CANVAS_HEIGHT) {
                if (puck.x > 120 && puck.x < 280) {
                    // AI Scored!
                    setScore(s => ({ ...s, ai: s.ai + 1 }));
                    resetPuck(CANVAS_HEIGHT / 2 - 50);
                } else {
                    puck.y = CANVAS_HEIGHT - PUCK_RADIUS; puck.vy *= -1;
                }
            }

            // 4. Paddle Collisions
            checkCollision(state.current.player);
            checkCollision(state.current.ai);

            // 5. Render
            draw(ctx);
            requestRef.current = requestAnimationFrame(update);
        };

        const resetPuck = (yStart) => {
            state.current.puck = { x: CANVAS_WIDTH / 2, y: yStart, vx: 0, vy: 0 };
            state.current.time = 0; // Reset any timers if needed
        };

        const checkCollision = (paddle) => {
            const p = state.current.puck;
            const dx = p.x - paddle.x;
            const dy = p.y - paddle.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < PADDLE_RADIUS + PUCK_RADIUS) {
                // Collision detected!
                const angle = Math.atan2(dy, dx);
                const speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
                
                // Push puck out
                const overlap = (PADDLE_RADIUS + PUCK_RADIUS) - dist;
                p.x += Math.cos(angle) * overlap;
                p.y += Math.sin(angle) * overlap;
                
                // Reflect velocity (add a bit of punch)
                 // Simple elastic collision approx for infinite mass paddle
                 p.vx = Math.cos(angle) * (speed + 2) + Math.cos(angle) * 5; 
                 p.vy = Math.sin(angle) * (speed + 2) + Math.sin(angle) * 5;
                 
                 // Limit max speed
                 const maxSpeed = 15;
                 const newSpeed = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
                 if (newSpeed > maxSpeed) {
                     p.vx = (p.vx / newSpeed) * maxSpeed;
                     p.vy = (p.vy / newSpeed) * maxSpeed;
                 }
            }
        };

        const draw = (ctx) => {
            // Clear
            ctx.fillStyle = '#0f172a'; // Slate 900
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            
            // Decorative lines
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, CANVAS_HEIGHT/2);
            ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT/2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 50, 0, Math.PI*2);
            ctx.stroke();

            // Goal Areas
            ctx.fillStyle = '#0ea5e9'; // Cyan 500
            ctx.fillRect(120, 0, 160, 5); // Player goal target
            ctx.fillStyle = '#f43f5e'; // Rose 500
            ctx.fillRect(120, CANVAS_HEIGHT-5, 160, 5); // AI goal target

            // Player Paddle
            ctx.beginPath();
            ctx.arc(state.current.player.x, state.current.player.y, PADDLE_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = '#0ea5e9';
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#bae6fd';
            ctx.stroke();

            // AI Paddle
            ctx.beginPath();
            ctx.arc(state.current.ai.x, state.current.ai.y, PADDLE_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = '#f43f5e';
            ctx.fill();
            ctx.strokeStyle = '#fecdd3';
            ctx.stroke();

            // Puck
            ctx.beginPath();
            ctx.arc(state.current.puck.x, state.current.puck.y, PUCK_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 10;
        };

        requestRef.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(requestRef.current);
    }, [gameState]);

    const handleMouseMove = (e) => {
        if (gameState !== 'playing') return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Constrain player to bottom half
        state.current.player.x = Math.max(PADDLE_RADIUS, Math.min(CANVAS_WIDTH - PADDLE_RADIUS, x));
        state.current.player.y = Math.max(CANVAS_HEIGHT/2 + PADDLE_RADIUS, Math.min(CANVAS_HEIGHT - PADDLE_RADIUS, y));
    };
    
    const handleTouchMove = (e) => {
        if (gameState !== 'playing') return;
        // e.preventDefault();
        const rect = canvasRef.current.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        state.current.player.x = Math.max(PADDLE_RADIUS, Math.min(CANVAS_WIDTH - PADDLE_RADIUS, x));
        state.current.player.y = Math.max(CANVAS_HEIGHT/2 + PADDLE_RADIUS, Math.min(CANVAS_HEIGHT - PADDLE_RADIUS, y));
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
             {gameState === 'menu' && (
                <div className="text-center z-10">
                    <h1 className="text-4xl font-black text-white italic mb-2 tracking-tighter">NEON HOCKEY</h1>
                    <p className="text-cyan-400 mb-8 font-mono">VS AI OPPONENT</p>
                    <button 
                        onClick={() => setGameState('playing')}
                        className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-full text-xl shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all transform hover:scale-105"
                    >
                        START MATCH
                    </button>
                    <div className="mt-8">
                         <button onClick={onBack} className="text-slate-500 hover:text-white">Exit</button>
                    </div>
                </div>
            )}
            
            <div className={`relative ${gameState === 'menu' ? 'hidden' : 'block'}`}>
                 <div className="flex justify-between items-center mb-4 text-white font-mono font-bold text-2xl w-[400px]">
                     <div className="text-rose-500">CPU: {score.ai}</div>
                     <button onClick={onBack} className="text-xs text-slate-500 hover:text-white uppercase tracking-widest">Quit</button>
                     <div className="text-cyan-500">YOU: {score.player}</div>
                 </div>
                 
                 <canvas
                     ref={canvasRef}
                     width={CANVAS_WIDTH}
                     height={CANVAS_HEIGHT}
                     onMouseMove={handleMouseMove}
                     onTouchMove={handleTouchMove}
                     className="bg-slate-900 rounded-2xl border-4 border-slate-700 shadow-2xl touch-none cursor-none"
                 />
                 
                 <p className="text-center text-slate-600 text-xs mt-4">Use mouse or finger to control the blue paddle</p>
            </div>
        </div>
    );
}
