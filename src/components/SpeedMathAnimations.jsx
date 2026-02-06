import React, { useState, useEffect } from 'react';

// Chinese Stick Method Animation
export function ChineseStickAnimation({ a, b, onComplete }) {
    const [step, setStep] = useState(0);
    const aDigits = String(a).split('').map(Number);
    const bDigits = String(b).split('').map(Number);

    useEffect(() => {
        if (step < 5) {
            const timer = setTimeout(() => setStep(s => s + 1), 1200);
            return () => clearTimeout(timer);
        } else if (onComplete) {
            setTimeout(onComplete, 500);
        }
    }, [step, onComplete]);

    return (
        <div className="relative w-64 h-64 mx-auto">
            <svg viewBox="0 0 200 200" className="w-full h-full">
                {/* First number lines (diagonal ↘) */}
                {aDigits.map((digit, di) => 
                    Array.from({ length: digit }).map((_, i) => (
                        <line
                            key={`a-${di}-${i}`}
                            x1={30 + di * 50}
                            y1={20 + i * 15}
                            x2={80 + di * 50}
                            y2={70 + i * 15}
                            stroke="#fbbf24"
                            strokeWidth="3"
                            strokeLinecap="round"
                            className={`transition-all duration-500 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}
                        />
                    ))
                )}
                
                {/* Second number lines (diagonal ↙) */}
                {bDigits.map((digit, di) => 
                    Array.from({ length: digit }).map((_, i) => (
                        <line
                            key={`b-${di}-${i}`}
                            x1={150 - di * 50}
                            y1={20 + i * 15}
                            x2={100 - di * 50}
                            y2={70 + i * 15}
                            stroke="#60a5fa"
                            strokeWidth="3"
                            strokeLinecap="round"
                            className={`transition-all duration-500 ${step >= 2 ? 'opacity-100' : 'opacity-0'}`}
                        />
                    ))
                )}

                {/* Intersection dots */}
                {step >= 3 && (
                    <g className="animate-pulse">
                        <circle cx="65" cy="45" r="5" fill="#10b981" />
                        <circle cx="90" cy="55" r="5" fill="#10b981" />
                        <circle cx="110" cy="45" r="5" fill="#10b981" />
                    </g>
                )}
            </svg>

            {/* Step labels */}
            <div className="absolute bottom-0 left-0 right-0 text-center">
                <p className="text-sm text-slate-400">
                    {step === 0 && 'Watch the lines...'}
                    {step === 1 && `Drawing ${a} (${aDigits.join(' and ')} lines)`}
                    {step === 2 && `Drawing ${b} (${bDigits.join(' and ')} lines)`}
                    {step === 3 && 'Count intersections!'}
                    {step === 4 && `Answer: ${a * b}`}
                </p>
            </div>
        </div>
    );
}

// Vedic Cross Animation
export function VedicCrossAnimation({ a, b, onComplete }) {
    const [step, setStep] = useState(0);
    const [aT, aO] = [Math.floor(a / 10), a % 10];
    const [bT, bO] = [Math.floor(b / 10), b % 10];

    useEffect(() => {
        if (step < 5) {
            const timer = setTimeout(() => setStep(s => s + 1), 1500);
            return () => clearTimeout(timer);
        } else if (onComplete) {
            setTimeout(onComplete, 500);
        }
    }, [step, onComplete]);

    const rightProduct = aO * bO;
    const crossProduct = (aT * bO) + (aO * bT);
    const leftProduct = aT * bT;

    return (
        <div className="text-center p-4">
            <div className="flex justify-center items-center gap-8 mb-6">
                <div className="text-4xl font-mono">
                    <span className={`${step >= 1 ? 'text-purple-400' : 'text-slate-600'}`}>{aT}</span>
                    <span className={`${step >= 2 ? 'text-cyan-400' : 'text-slate-600'}`}>{aO}</span>
                </div>
                <span className="text-2xl text-slate-500">×</span>
                <div className="text-4xl font-mono">
                    <span className={`${step >= 1 ? 'text-purple-400' : 'text-slate-600'}`}>{bT}</span>
                    <span className={`${step >= 2 ? 'text-cyan-400' : 'text-slate-600'}`}>{bO}</span>
                </div>
            </div>

            {/* Calculation steps */}
            <div className="space-y-2 text-lg font-mono">
                {step >= 2 && (
                    <div className="text-cyan-400 animate-fadeIn">
                        Right: {aO} × {bO} = {rightProduct}
                    </div>
                )}
                {step >= 3 && (
                    <div className="text-amber-400 animate-fadeIn">
                        Cross: ({aT}×{bO}) + ({aO}×{bT}) = {crossProduct}
                    </div>
                )}
                {step >= 4 && (
                    <div className="text-purple-400 animate-fadeIn">
                        Left: {aT} × {bT} = {leftProduct}
                    </div>
                )}
            </div>

            {step >= 5 && (
                <div className="mt-4 text-3xl font-black text-emerald-400">
                    = {a * b}
                </div>
            )}
        </div>
    );
}

// Butterfly Fractions Animation
export function ButterflyAnimation({ n1, d1, n2, d2, onComplete }) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (step < 5) {
            const timer = setTimeout(() => setStep(s => s + 1), 1200);
            return () => clearTimeout(timer);
        } else if (onComplete) {
            setTimeout(onComplete, 500);
        }
    }, [step, onComplete]);

    const wing1 = n1 * d2;
    const wing2 = n2 * d1;
    const answerNum = wing1 + wing2;
    const answerDen = d1 * d2;

    return (
        <div className="relative p-8">
            <div className="flex justify-center items-center gap-8">
                {/* First fraction */}
                <div className="text-center">
                    <div className={`text-3xl font-bold ${step >= 1 ? 'text-pink-400' : 'text-white'}`}>{n1}</div>
                    <div className="w-12 h-1 bg-slate-500 my-1"></div>
                    <div className={`text-3xl font-bold ${step >= 2 ? 'text-purple-400' : 'text-white'}`}>{d1}</div>
                </div>

                <span className="text-2xl text-slate-500">+</span>

                {/* Second fraction */}
                <div className="text-center">
                    <div className={`text-3xl font-bold ${step >= 1 ? 'text-pink-400' : 'text-white'}`}>{n2}</div>
                    <div className="w-12 h-1 bg-slate-500 my-1"></div>
                    <div className={`text-3xl font-bold ${step >= 2 ? 'text-purple-400' : 'text-white'}`}>{d2}</div>
                </div>
            </div>

            {/* Wing calculations */}
            {step >= 2 && (
                <div className="mt-6 space-y-2 text-center">
                    <div className="text-pink-400">
                        🦋 Wing 1: {n1} × {d2} = {wing1}
                    </div>
                    <div className="text-purple-400">
                        🦋 Wing 2: {n2} × {d1} = {wing2}
                    </div>
                </div>
            )}

            {step >= 3 && (
                <div className="mt-4 text-center text-amber-400">
                    Top: {wing1} + {wing2} = {answerNum}
                </div>
            )}

            {step >= 4 && (
                <div className="mt-2 text-center text-cyan-400">
                    Bottom: {d1} × {d2} = {answerDen}
                </div>
            )}

            {step >= 5 && (
                <div className="mt-6 text-center">
                    <span className="text-4xl font-black text-emerald-400">{answerNum}/{answerDen}</span>
                </div>
            )}
        </div>
    );
}

export default { ChineseStickAnimation, VedicCrossAnimation, ButterflyAnimation };
