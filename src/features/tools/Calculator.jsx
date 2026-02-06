import { useState } from 'react';

export default function Calculator() {
    const [display, setDisplay] = useState('0');
    const [mode, setMode] = useState('basic'); // 'basic' | 'scientific'
    const [isExpanded, setIsExpanded] = useState(false);

    const handlePress = (val) => {
        if (val === 'C') {
            setDisplay('0');
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
                setDisplay(Number.isFinite(result) ? String(parseFloat(result.toPrecision(10))) : 'Error');
            } catch {
                setDisplay('Error');
            }
        } else {
            setDisplay(prev => prev === '0' || prev === 'Error' ? val : prev + val);
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
        if (btn === '=') return 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/50';
        if (btn === 'C') return 'bg-red-500 hover:bg-red-400 text-white shadow-red-900/50';
        if (['÷', '×', '-', '+', '%', '(', ')'].includes(btn)) return 'bg-slate-300 hover:bg-white text-slate-900';
        if (['sin(', 'cos(', 'tan(', 'log(', 'ln(', '√(', '^', 'π'].includes(btn)) return 'bg-purple-500 hover:bg-purple-400 text-white shadow-purple-900/50';
        return 'bg-white hover:bg-slate-100 text-slate-900';
    };

    // Overlay wrapper for expanded mode
    if (isExpanded) {
        return (
            <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-800 rounded-3xl shadow-2xl border border-white/10 w-full max-w-md overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <h2 className="text-white font-bold text-sm uppercase tracking-widest">
                            {mode === 'scientific' ? '🧪 Scientific' : '🔢 Basic'} Calculator
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setMode(mode === 'basic' ? 'scientific' : 'basic')}
                                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg uppercase"
                            >
                                {mode === 'basic' ? '→ Scientific' : '→ Basic'}
                            </button>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg"
                            >
                                ✕ Close
                            </button>
                        </div>
                    </div>

                    {/* Display */}
                    <div className="p-4 bg-emerald-100 text-right text-3xl font-mono text-slate-900 h-20 flex items-center justify-end overflow-x-auto border-b-4 border-slate-600">
                        <span className="whitespace-nowrap">{display}</span>
                    </div>

                    {/* Keypad */}
                    <div className={`grid gap-2 p-3 bg-slate-700 ${mode === 'scientific' ? 'grid-cols-4' : 'grid-cols-4'}`}>
                        {buttons.map((btn, idx) => (
                            <button
                                key={idx}
                                onClick={() => handlePress(btn)}
                                className={`py-4 flex items-center justify-center text-lg font-bold rounded-xl shadow-sm transition-all active:scale-95 ${getButtonStyle(btn)}`}
                            >
                                {btn}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Compact sidebar view
    return (
        <div className="w-full h-full flex flex-col bg-slate-800 border-2 border-slate-600 rounded-3xl overflow-hidden shadow-2xl">
            {/* Mode toggle + expand */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-white/10">
                <button
                    onClick={() => setMode(mode === 'basic' ? 'scientific' : 'basic')}
                    className="text-[10px] font-bold text-purple-400 hover:text-purple-300 uppercase tracking-wider"
                >
                    {mode === 'basic' ? 'Basic' : 'Scientific'}
                </button>
                <button
                    onClick={() => setIsExpanded(true)}
                    className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider flex items-center gap-1"
                >
                    <span>⤢</span> Expand
                </button>
            </div>

            {/* Display */}
            <div className="shrink-0 p-3 bg-emerald-100 text-right text-2xl font-mono text-slate-900 h-16 flex items-center justify-end overflow-hidden border-b-4 border-slate-600 shadow-inner">
                {display}
            </div>

            {/* Keypad */}
            <div className="flex-1 grid grid-cols-4 gap-1 p-1.5 bg-slate-700">
                {basicButtons.map((btn, idx) => (
                    <button
                        key={idx}
                        onClick={() => handlePress(btn)}
                        className={`w-full h-full flex items-center justify-center text-sm font-bold rounded-lg shadow-sm transition-all active:scale-95 ${getButtonStyle(btn)}`}
                    >
                        {btn}
                    </button>
                ))}
            </div>
        </div>
    );
}
