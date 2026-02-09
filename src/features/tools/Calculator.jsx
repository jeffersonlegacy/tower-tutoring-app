import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Calculator() {
    const [display, setDisplay] = useState('0');
    const [history, setHistory] = useState([]);
    const [mode, setMode] = useState('basic'); // 'basic' | 'scientific'
    const [isExpanded, setIsExpanded] = useState(false);
    const [lastResult, setLastResult] = useState(null);

    const handlePress = (val) => {
        if (val === 'C') {
            setDisplay('0');
            setLastResult(null);
        } else if (val === 'CE') {
            setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
        } else if (val === '=') {
            try {
                // Safe evaluation with expanded math support
                let expr = display
                    .replace(/×/g, '*')
                    .replace(/÷/g, '/')
                    .replace(/π/g, 'Math.PI')
                    .replace(/e(?![x])/g, 'Math.E')
                    .replace(/sin\(/g, 'Math.sin(')
                    .replace(/cos\(/g, 'Math.cos(')
                    .replace(/tan\(/g, 'Math.tan(')
                    .replace(/log\(/g, 'Math.log10(')
                    .replace(/ln\(/g, 'Math.log(')
                    .replace(/√\(/g, 'Math.sqrt(')
                    .replace(/\^/g, '**');
                
                if (/[^0-9+\-*/().Math\s^sincotaqrlgPIE]/.test(expr)) return;
                const safeEval = new Function('return ' + expr);
                const result = safeEval();
                const formattedResult = Number.isFinite(result) ? String(parseFloat(result.toPrecision(10))) : 'Error';
                
                setDisplay(formattedResult);
                setLastResult(formattedResult);
                
                // Add to history
                if (formattedResult !== 'Error') {
                    setHistory(prev => [{ eq: display, ans: formattedResult }, ...prev].slice(0, 5));
                }

            } catch {
                setDisplay('Error');
            }
        } else {
            // Auto-clear logic after result
            if (lastResult && !['+', '-', '×', '÷', '^'].includes(val)) {
                setDisplay(val);
                setLastResult(null);
            } else {
                setDisplay(prev => prev === '0' || prev === 'Error' ? val : prev + val);
                if (lastResult) setLastResult(null);
            }
        }
    };

    const basicButtons = [
        '(', ')', '%', '÷',
        '7', '8', '9', '×',
        '4', '5', '6', '-',
        '1', '2', '3', '+',
        '0', '.', '=', 'C'
    ];

    const scientificButtons = [
        'sin(', 'cos(', 'tan(', '^',
        'log(', 'ln(', '√(', 'π',
        '(', ')', '%', '÷',
        '7', '8', '9', '×',
        '4', '5', '6', '-',
        '1', '2', '3', '+',
        '0', '.', '=', 'C'
    ];

    const buttons = mode === 'scientific' ? scientificButtons : basicButtons;

    const getButtonStyle = (btn) => {
        const base = "relative overflow-hidden group font-black text-lg transition-all active:scale-95 border-b-4 active:border-b-0 active:translate-y-1 ";
        
        if (btn === '=') return base + "bg-blue-600 border-blue-800 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]";
        if (btn === 'C') return base + "bg-red-500 border-red-700 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]";
        if (['÷', '×', '-', '+', '%', '(', ')'].includes(btn)) return base + "bg-slate-700 border-slate-900 text-cyan-400";
        if (['sin(', 'cos(', 'tan(', 'log(', 'ln(', '√(', '^', 'π'].includes(btn)) return base + "bg-purple-600 border-purple-800 text-white";
        
        return base + "bg-slate-800 border-black text-slate-200 hover:bg-slate-700";
    };

    const CalculatorBody = ({ isFull = false }) => (
        <div className={`
            flex flex-col bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden relative
            ${isFull ? 'w-full max-w-md rounded-3xl' : 'w-full h-full rounded-2xl border-2 border-slate-600'}
        `}>
            {/* Glass Reflection */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

            {/* Header / Mode Toggle */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950/50 border-b border-white/5 z-10">
                <button
                    onClick={() => setMode(mode === 'basic' ? 'scientific' : 'basic')}
                    className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-widest flex items-center gap-2"
                >
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    {mode === 'scientific' ? 'SCIENTIFIC' : 'BASIC'}
                </button>
                <div className="flex gap-2">
                    { !isExpanded && (
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-wider"
                        >
                            ⤢ EXPAND
                        </button>
                    )}
                    { isExpanded && (
                         <button
                         onClick={() => setIsExpanded(false)}
                         className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-wider"
                     >
                         ✕ CLOSE
                     </button>
                    )}
                </div>
            </div>

            {/* Display Area */}
            <div className="relative p-6 bg-gradient-to-b from-emerald-900/20 to-emerald-900/5 z-10">
                {/* History Tape (Subtle) */}
                <div className="h-6 flex flex-col justify-end items-end overflow-hidden opacity-50 mb-1">
                    <AnimatePresence>
                        {history[0] && (
                            <motion.div 
                                key={history[0].eq}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="text-xs font-mono text-emerald-400/70"
                            >
                                {history[0].eq} = {history[0].ans}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Main Digits */}
                <div className="text-right">
                    <motion.div 
                        key={display}
                        initial={{ scale: 0.95, opacity: 0.8 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-4xl font-black font-mono text-emerald-400 tracking-tight drop-shadow-[0_0_10px_rgba(52,211,153,0.3)] overflow-x-auto scrollbar-hide"
                    >
                        {display}
                    </motion.div>
                </div>
                
                {/* Bottom line accent */}
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
            </div>

            {/* Keypad */}
            <div className={`grid gap-2 p-3 bg-slate-950/80 z-10 flex-1 ${mode === 'scientific' ? 'grid-cols-4' : 'grid-cols-4'}`}>
                {buttons.map((btn, idx) => (
                    <motion.button
                        layout
                        key={`${btn}-${idx}`}
                        onClick={() => handlePress(btn)}
                        className={`${getButtonStyle(btn)} rounded-xl h-14 flex items-center justify-center`}
                        whileTap={{ scale: 0.92 }}
                    >
                        {btn}
                        {/* Shimmer effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
                    </motion.button>
                ))}
            </div>
            
            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 1s infinite;
                }
            `}</style>
        </div>
    );

    // Overlay wrapper for expanded mode
    if (isExpanded) {
        return (
            <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                <CalculatorBody isFull={true} />
            </div>
        );
    }

    // Compact sidebar view
    return (
        <div className="w-full h-full">
            <CalculatorBody isFull={false} />
        </div>
    );
}
