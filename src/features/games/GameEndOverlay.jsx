import React from 'react';
import confetti from 'canvas-confetti';

export default function GameEndOverlay({
    winner, // boolean (isWinner) or string (winnerName/Id) - Logic handles truthiness
    isDraw = false,
    score,
    onRestart,
    onExit,
    title, // [NEW] Custom title override
    icon // [NEW] Custom icon override
}) {
    // Trigger confetti on mount if winner
    React.useEffect(() => {
        if (winner && !isDraw) {
            const duration = 3000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 50 };

            const randomInRange = (min, max) => Math.random() * (max - min) + min;

            const interval = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);

            return () => clearInterval(interval);
        }
    }, [winner, isDraw]);

    return (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center animate-in fade-in duration-500 p-4 overflow-y-auto">
            {/* Visual Icon - smaller on mobile */}
            <div className="text-6xl sm:text-[120px] mb-2 sm:mb-4 animate-bounce">
                {icon || (isDraw ? '🤝' : (winner ? '👑' : '😢'))}
            </div>

            {/* Title - responsive sizing */}
            <h1 className={`text-4xl sm:text-6xl font-black italic tracking-tighter mb-2 bg-clip-text text-transparent text-center ${isDraw ? 'bg-gradient-to-r from-slate-400 to-white' :
                (winner ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-200' : 'bg-gradient-to-r from-blue-400 to-indigo-500')
                } filter drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]`}>
                {title || (isDraw ? 'DRAW GAME' : (winner ? 'VICTORY!' : 'DEFEAT'))}
            </h1>

            {/* Score Display (Optional) - compact on mobile */}
            {score !== undefined && (
                <div className="text-lg sm:text-2xl font-mono text-white mb-4 sm:mb-8 bg-white/10 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full border border-white/10">
                    SCORE: <span className="text-cyan-400 font-bold">{score}</span>
                </div>
            )}

            {/* Actions - Stack on mobile, row on desktop */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-8 w-full max-w-xs sm:max-w-sm">
                <button
                    onClick={onRestart}
                    className="w-full py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-lg sm:text-xl rounded-xl shadow-[0_4px_0_rgb(107,33,168)] active:shadow-none active:translate-y-[4px] transition-all uppercase tracking-wider sm:tracking-widest border-2 border-purple-400"
                >
                    Play Again
                </button>
                <button
                    onClick={onExit}
                    className="w-full py-3 sm:py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold text-lg sm:text-xl rounded-xl border-2 border-slate-700 hover:border-slate-500 transition-colors uppercase tracking-wider sm:tracking-widest"
                >
                    Exit
                </button>
            </div>
        </div>
    );
}
