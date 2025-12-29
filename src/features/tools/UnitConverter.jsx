import React, { useState } from 'react';

const CONVERSION_RATES = {
    length: {
        units: ['m', 'cm', 'in', 'ft', 'yd', 'mi', 'km'],
        labels: { m: 'Meters', cm: 'Centimeters', in: 'Inches', ft: 'Feet', yd: 'Yards', mi: 'Miles', km: 'Kilometers' },
        rates: { // Base is meters
            m: 1, cm: 0.01, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.34, km: 1000
        }
    },
    weight: {
        units: ['g', 'kg', 'oz', 'lb'],
        labels: { g: 'Grams', kg: 'Kilograms', oz: 'Ounces', lb: 'Pounds' },
        rates: { // Base is grams
            g: 1, kg: 1000, oz: 28.3495, lb: 453.592
        }
    },
    volume: { // Liquid
        units: ['ml', 'l', 'cup', 'pt', 'qt', 'gal'],
        labels: { ml: 'Milliliters', l: 'Liters', cup: 'Cups', pt: 'Pints', qt: 'Quarts', gal: 'Gallons' },
        rates: { // Base is ml
            ml: 1, l: 1000, cup: 236.588, pt: 473.176, qt: 946.353, gal: 3785.41
        }
    },
    temperature: {
        units: ['c', 'f', 'k'],
        labels: { c: 'Celsius', f: 'Fahrenheit', k: 'Kelvin' }
        // Special logic required
    }
};

export default function UnitConverter() {
    const [category, setCategory] = useState('length');
    const [amount, setAmount] = useState(1);
    const [fromUnit, setFromUnit] = useState(CONVERSION_RATES.length.units[2]); // in
    const [toUnit, setToUnit] = useState(CONVERSION_RATES.length.units[1]);     // cm

    const handleCategoryChange = (newCat) => {
        setCategory(newCat);
        setFromUnit(CONVERSION_RATES[newCat].units[0]);
        setToUnit(CONVERSION_RATES[newCat].units[1]);
    };

    const convert = () => {
        const val = parseFloat(amount);
        if (isNaN(val)) return '---';

        if (category === 'temperature') {
            if (fromUnit === toUnit) return val;
            let c = val;
            if (fromUnit === 'f') c = (val - 32) * 5 / 9;
            if (fromUnit === 'k') c = val - 273.15;

            if (toUnit === 'c') return c;
            if (toUnit === 'f') return (c * 9 / 5) + 32;
            if (toUnit === 'k') return c + 273.15;
            return val;
        }

        const rates = CONVERSION_RATES[category].rates;
        const base = val * rates[fromUnit];
        const result = base / rates[toUnit];

        // Pretty print decimals
        return Number.isInteger(result) ? result : parseFloat(result.toFixed(4));
    };

    return (
        <div className="flex flex-col gap-4 p-4 bg-slate-900 rounded-xl border border-white/5">
            {/* Category Selector */}
            <div className="flex bg-slate-800 rounded-lg p-1">
                {['length', 'weight', 'volume', 'temperature'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => handleCategoryChange(cat)}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${category === cat ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        {cat.slice(0, 4)}
                    </button>
                ))}
            </div>

            {/* Input Row */}
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-20 bg-slate-800 border border-slate-700 text-white p-2 rounded-lg font-mono text-center focus:outline-none focus:border-cyan-500"
                />
                <select
                    value={fromUnit}
                    onChange={(e) => setFromUnit(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 text-white p-2 rounded-lg text-xs"
                >
                    {CONVERSION_RATES[category].units.map(u => (
                        <option key={u} value={u}>{CONVERSION_RATES[category].labels[u]}</option>
                    ))}
                </select>
            </div>

            {/* Arrow */}
            <div className="flex justify-center text-slate-500">
                ↓
            </div>

            {/* Output Row */}
            <div className="flex items-center gap-2">
                <div className="w-20 bg-slate-950 border border-slate-800 text-cyan-400 p-2 rounded-lg font-mono text-center overflow-hidden">
                    {convert()}
                </div>
                <select
                    value={toUnit}
                    onChange={(e) => setToUnit(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 text-white p-2 rounded-lg text-xs"
                >
                    {CONVERSION_RATES[category].units.map(u => (
                        <option key={u} value={u}>{CONVERSION_RATES[category].labels[u]}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
