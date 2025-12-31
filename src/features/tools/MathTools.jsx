import { useState } from 'react';
import Calculator from './Calculator';
import UnitConverter from './UnitConverter';

export default function MathTools() {
    const [tool, setTool] = useState('calculator'); // 'calculator' | 'converter'

    return (
        <div className="flex flex-col h-full bg-slate-900">
            {/* Tool Selector */}
            <div className="flex gap-2 p-4 pb-2">
                <button
                    onClick={() => setTool('calculator')}
                    className={`flex-1 py-2 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border ${tool === 'calculator'
                        ? 'bg-slate-800 border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-900/20'
                        : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400'
                        }`}
                >
                    Calculator
                </button>
                <button
                    onClick={() => setTool('converter')}
                    className={`flex-1 py-2 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border ${tool === 'converter'
                        ? 'bg-slate-800 border-purple-500 text-purple-400 shadow-lg shadow-purple-900/20'
                        : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400'
                        }`}
                >
                    Converter
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative p-2">
                {tool === 'calculator' && (
                    <div className="h-full flex flex-col">
                        <Calculator />
                    </div>
                )}

                {tool === 'converter' && (
                    <div className="h-full overflow-y-auto p-2 flex flex-col gap-4">
                        <div className="text-center mb-2">
                            <span className="text-4xl">⚖️</span>
                            <h3 className="text-slate-400 text-xs uppercase tracking-widest mt-2 font-bold">Unit Converter</h3>
                        </div>
                        <UnitConverter />
                    </div>
                )}
            </div>
        </div>
    );
}
