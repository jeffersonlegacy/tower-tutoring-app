import React, { useState } from 'react';

export default function Calculator() {
    const [display, setDisplay] = useState('0');

    const handlePress = (val) => {
        if (val === 'C') {
            setDisplay('0');
        } else if (val === '=') {
            try {
                // Safe evaluation limited to math chars
                if (/[^0-9+\-*/().]/.test(display)) return;
                // eslint-disable-next-line
                // Safe alternative to eval
                const safeEval = new Function('return ' + display);
                setDisplay(String(safeEval()));
            } catch {
                setDisplay('Error');
            }
        } else {
            setDisplay(prev => prev === '0' || prev === 'Error' ? val : prev + val);
        }
    };

    const buttons = [
        '(', ')', '%', '/',
        '7', '8', '9', '*',
        '4', '5', '6', '-',
        '1', '2', '3', '+',
        '0', '.', '=', 'C'
    ];

    return (
        <div className="w-full h-full flex flex-col bg-slate-800 border-2 border-slate-600 rounded-3xl overflow-hidden shadow-2xl">
            {/* Display - Shrinks if needed, but tries to stay ample */}
            <div className="shrink-0 p-4 bg-emerald-100 text-right text-4xl sm:text-5xl font-mono text-slate-900 h-24 sm:h-32 flex items-center justify-end overflow-hidden border-b-4 border-slate-600 shadow-inner">
                {display}
            </div>

            {/* Keypad - Expands to fill remaining height */}
            <div className="flex-1 grid grid-cols-4 gap-2 p-2 bg-slate-700">
                {buttons.map(btn => (
                    <button
                        key={btn}
                        onClick={() => handlePress(btn)}
                        className={`w-full h-full flex items-center justify-center text-xl sm:text-2xl font-bold rounded-xl shadow-sm transition-all active:scale-95 active:shadow-inner ${btn === '=' ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/50' :
                            btn === 'C' ? 'bg-red-500 hover:bg-red-400 text-white shadow-red-900/50' :
                                ['/', '*', '-', '+', '%', '(', ')'].includes(btn) ? 'bg-slate-300 hover:bg-white text-slate-900' :
                                    'bg-white hover:bg-slate-100 text-slate-900'
                            }`}
                    >
                        {btn}
                    </button>
                ))}
            </div>
        </div>
    );
}
