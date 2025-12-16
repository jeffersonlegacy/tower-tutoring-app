import React, { useState } from 'react';

export default function Calculator() {
    const [display, setDisplay] = useState('0');
    const [isOpen, setIsOpen] = useState(false);

    const handlePress = (val) => {
        if (val === 'C') {
            setDisplay('0');
        } else if (val === '=') {
            try {
                // Safe evaluation limited to math chars
                if (/[^0-9+\-*/().]/.test(display)) return;
                // eslint-disable-next-line no-eval
                setDisplay(String(eval(display)));
            } catch {
                setDisplay('Error');
            }
        } else {
            setDisplay(prev => prev === '0' ? val : prev + val);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-6 bg-slate-700 text-white p-3 rounded-full shadow-lg hover:bg-slate-600 transition-transform z-40"
                title="Calculator"
            >
                🧮
            </button>
        );
    }

    const buttons = [
        '7', '8', '9', '/',
        '4', '5', '6', '*',
        '1', '2', '3', '-',
        '0', '.', '=', '+',
        'C'
    ];

    return (
        <div className="fixed bottom-24 right-6 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl overflow-hidden z-40">
            <div className="bg-slate-900 p-2 flex justify-between items-center">
                <span className="text-white font-bold text-sm">Calculator</span>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-4 bg-slate-200 text-right text-2xl font-mono text-slate-800 h-16 overflow-x-auto whitespace-nowrap">
                {display}
            </div>
            <div className="grid grid-cols-4 gap-1 p-2 bg-slate-700">
                {buttons.map(btn => (
                    <button
                        key={btn}
                        onClick={() => handlePress(btn)}
                        className={`p-3 font-bold rounded ${btn === '='
                                ? 'bg-blue-600 text-white'
                                : btn === 'C'
                                    ? 'col-span-4 bg-red-500 text-white mt-1'
                                    : 'bg-slate-600 text-white hover:bg-slate-500'
                            }`}
                    >
                        {btn}
                    </button>
                ))}
            </div>
        </div>
    );
}
