import React, { useState } from 'react';
import { useMastery } from '../../context/MasteryContext';

// Speed Math Method Tutorials (Migrated from SpeedMathDojo)
const METHOD_TUTORIALS = {
    speed_mult_chinese: {
        title: "Chinese Stick Method",
        origin: "🇨🇳 China",
        intro: "Instead of memorizing times tables, this method turns multiplication into counting! You draw lines for each digit and count where they cross. It's like a visual calculator using only pencil and paper.",
        vocabulary: [
            { term: "Digit", meaning: "A single number (0-9). In 23, the digits are 2 and 3." },
            { term: "Intersection", meaning: "Where two lines cross each other." }
        ],
        steps: [
            "Draw diagonal lines for each digit of the first number (going ↘)",
            "Draw crossing diagonal lines for each digit of the second number (going ↙)",
            "Count intersection points in each diagonal zone (right to left)",
            "Add carries from right to left like normal addition"
        ],
        example: {
            problem: "23 × 12",
            visual: "Draw 2 lines, then 3 lines below. Cross with 1 line, then 2 lines. Count crossings: 6 | 7 | 2",
            answer: "276"
        },
        tip: "Works best for 2-3 digit numbers. Great for visual learners!"
    },
    speed_mult_vedic: {
        title: "Vedic Vertically & Crosswise",
        origin: "🕉️ India (Urdhva Tiryagbhyam)",
        intro: "This 3,000-year-old technique from India lets you multiply any two numbers in your head! The secret? You work with small pieces at a time using a criss-cross pattern.",
        vocabulary: [
            { term: "Cross-multiply", meaning: "Multiply diagonally, like an X. For 32×21: multiply 3×1 and 2×2, then add." },
            { term: "Carry", meaning: "When a column adds up to 10+, the tens digit moves left." }
        ],
        steps: [
            "Write both numbers vertically aligned",
            "Multiply the rightmost digits (ones × ones)",
            "Cross-multiply middle digits and add (tens×ones + ones×tens)",
            "Multiply the leftmost digits (tens × tens)",
            "Combine results, carrying when needed"
        ],
        example: {
            problem: "32 × 21",
            visual: "Right: 2×1=2 | Middle: (3×1)+(2×2)=7 | Left: 3×2=6 → 672",
            answer: "672"
        },
        tip: "With practice, this becomes instant mental math!"
    },
    speed_mult_lattice: {
        title: "Lattice Multiplication",
        origin: "🔲 Venice/Arab World",
        intro: "Think of a tic-tac-toe grid, but for multiplication! Each box holds one small multiplication, and you just add along the diagonals. Even huge numbers become easy!",
        vocabulary: [
            { term: "Lattice", meaning: "A grid with boxes, like graph paper." },
            { term: "Diagonal", meaning: "A slanted line going corner to corner." }
        ],
        steps: [
            "Draw a grid: columns = first number's digits, rows = second number's digits",
            "Draw diagonals through each box (top-right to bottom-left)",
            "Fill each box: multiply row digit × column digit, tens above line, ones below",
            "Add along each diagonal from right to left",
            "Read the answer around the outside edge"
        ],
        example: {
            problem: "34 × 25",
            visual: "2×2 grid with diagonals → Add diagonals: 0|8|5|0 → 850",
            answer: "850"
        },
        tip: "Perfect for large number multiplication – no carrying until the end!"
    },
    speed_mult_nikhilam: {
        title: "Nikhilam (Near Base)",
        origin: "🕉️ India (Vedic Sutra)",
        intro: "When numbers are close to 10, 100, or 1000, this trick is MAGIC! Instead of multiplying big numbers, you work with how far they are from the base. 97×94? That's just 3 and 6 away from 100!",
        vocabulary: [
            { term: "Base", meaning: "A round number like 10, 100, or 1000 that your numbers are close to." },
            { term: "Deficit", meaning: "How much less than the base. 97 has a deficit of 3 from 100." },
            { term: "Surplus", meaning: "How much more than the base. 105 has a surplus of 5 from 100." }
        ],
        steps: [
            "Choose a base (10, 100, 1000) that both numbers are close to",
            "Find each number's deficit (or surplus) from the base",
            "Cross-subtract: take either number minus the other's deficit",
            "Multiply the deficits together for the right part",
            "Combine: left part | right part (pad zeros if needed)"
        ],
        example: {
            problem: "97 × 94 (base 100)",
            visual: "97→-3, 94→-6 | Left: 97-6=91 | Right: 3×6=18 → 91|18",
            answer: "9118"
        },
        tip: "Ultra fast for numbers like 98×96, 107×104, 995×997!"
    },
    speed_add_left: {
        title: "Left-to-Right Addition",
        origin: "🌏 Asia",
        intro: "Normally we add from right to left. But your brain actually prefers BIG numbers first! This method starts with hundreds, then tens, then ones – the way you naturally think about numbers.",
        vocabulary: [
            { term: "Place value", meaning: "What a digit is worth based on position. In 456: 4=400, 5=50, 6=6." }
        ],
        steps: [
            "Start from the leftmost (largest) digit, not the right",
            "Add the hundreds first: 400+300=700",
            "Add the tens: 50+70=120, adjust hundreds if needed",
            "Add the ones: 6+8=14, adjust tens if needed"
        ],
        example: {
            problem: "456 + 378",
            visual: "Hundreds: 700 → Tens: +120=820 → Ones: +14=834",
            answer: "834"
        },
        tip: "Builds number sense by working with big values first! Great for mental math."
    },
    speed_sub_austrian: {
        title: "Austrian Subtraction",
        origin: "🇦🇹 Europe",
        intro: "Hate borrowing? This method eliminates it completely! Instead of taking away from the top number, you ADD to the bottom number. Same answer, zero headaches.",
        vocabulary: [
            { term: "Minuend", meaning: "The top number you're subtracting FROM (like 423 in 423-178)." },
            { term: "Subtrahend", meaning: "The bottom number you're taking away (like 178 in 423-178)." }
        ],
        steps: [
            "When the top digit is smaller, add 10 to it mentally",
            "Instead of 'borrowing 1' from the left, add 1 to the NEXT bottom digit",
            "Continue normally across all columns",
            "The answer is the same – but no crossing out needed!"
        ],
        example: {
            problem: "423 - 178",
            visual: "3<8: make it 13-8=5, add 1 to 7→8. 2<8: make it 12-8=4, add 1 to 1→2. 4-2=2 → 245",
            answer: "245"
        },
        tip: "Never borrow again – just balance by adding to the subtrahend!"
    },
    speed_fractions: {
        title: "Butterfly Method",
        origin: "🦋 Modern Teaching",
        intro: "Adding fractions with different bottom numbers is tricky... unless you draw a butterfly! The wings show you exactly what to multiply, and the body holds your answer.",
        vocabulary: [
            { term: "Numerator", meaning: "The TOP number of a fraction. In ¾, it's 3." },
            { term: "Denominator", meaning: "The BOTTOM number of a fraction. In ¾, it's 4." },
            { term: "Unlike fractions", meaning: "Fractions with different denominators, like ¾ and ⅖." }
        ],
        steps: [
            "Draw 'butterfly wings' connecting each numerator to the opposite denominator",
            "Multiply along each wing: (3×5) and (2×4)",
            "Add or subtract the wing products for your new numerator: 15+8=23",
            "Multiply the denominators for your new denominator: 4×5=20"
        ],
        example: {
            problem: "3/4 + 2/5",
            visual: "Wings: 3×5=15, 2×4=8 → Top: 15+8=23 | Bottom: 4×5=20",
            answer: "23/20 (or 1 3/20)"
        },
        tip: "Works perfectly for adding or subtracting unlike fractions!"
    }
};

export default function HyperbolicChamber({ onBack }) {
    const [selectedMethod, setSelectedMethod] = useState(null);

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            
            <button 
                onClick={onBack}
                className="relative z-10 mb-8 px-4 py-2 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 border border-white/10"
            >
                ← Return to Dashboard
            </button>

            <div className="relative z-10 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        HYPERBOLIC CHAMBER
                    </h1>
                    <p className="text-xl text-indigo-200 max-w-2xl mx-auto">
                        A collection of powerful mental algorithms from around the world.
                        <br/>Master numbers like the ancients.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                    {Object.entries(METHOD_TUTORIALS).map(([id, method]) => (
                        <div 
                            key={id}
                            onClick={() => setSelectedMethod(id)}
                            className="group relative bg-slate-900/40 border border-white/5 rounded-3xl p-8 hover:-translate-y-2 hover:bg-slate-900/60 transition-all cursor-pointer backdrop-blur-md overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            
                            <div className="relative z-10">
                                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left">
                                    {id.includes('chinese') ? '🇨🇳' : 
                                     id.includes('vedic') ? '🕉️' : 
                                     id.includes('austrian') ? '🇦🇹' : 
                                     id.includes('japanese') ? '🇯🇵' : 
                                     id.includes('fractions') ? '🦋' : '📜'}
                                </div>
                                <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-indigo-300 transition-colors">{method.title}</h3>
                                <p className="text-slate-400 text-sm mb-4 line-clamp-3 leading-relaxed">{method.intro}</p>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-full">
                                    {method.origin}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* DETAILED MODAL */}
            {selectedMethod && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl" onClick={() => setSelectedMethod(null)}>
                    <div className="bg-slate-900 border border-indigo-500/30 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md p-8 border-b border-indigo-500/10 flex justify-between items-start z-10">
                            <div>
                                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-2">
                                    {METHOD_TUTORIALS[selectedMethod].title}
                                </h2>
                                <div className="text-indigo-300 font-mono text-sm uppercase tracking-widest">
                                    {METHOD_TUTORIALS[selectedMethod].origin}
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedMethod(null)}
                                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 space-y-8">
                            {/* Intro */}
                            <p className="text-xl text-slate-300 leading-relaxed max-w-3xl">
                                {METHOD_TUTORIALS[selectedMethod].intro}
                            </p>

                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Left Column: Steps */}
                                <div>
                                    <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <span>📝</span> The Algorithm
                                    </h3>
                                    <div className="space-y-4">
                                        {METHOD_TUTORIALS[selectedMethod].steps.map((step, i) => (
                                            <div key={i} className="flex gap-4 p-4 bg-slate-800/50 rounded-xl border border-white/5">
                                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                                                    {i + 1}
                                                </div>
                                                <p className="text-slate-300 text-sm leading-relaxed">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right Column: Example & Tips */}
                                <div className="space-y-6">
                                    {/* Interactive Visualizer Placeholder */}
                                    <div className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-2 opacity-20 text-6xl group-hover:opacity-40 transition-opacity">🧮</div>
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Live Example</h3>
                                        
                                        <div className="text-center py-4">
                                            <div className="text-4xl font-black text-white mb-2 tracking-widest">
                                                {METHOD_TUTORIALS[selectedMethod].example.problem}
                                            </div>
                                            <div className="text-indigo-400 font-mono text-sm mb-4">
                                                {METHOD_TUTORIALS[selectedMethod].example.visual}
                                            </div>
                                            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                                                = {METHOD_TUTORIALS[selectedMethod].example.answer}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Vocabulary */}
                                    <div className="bg-indigo-900/20 rounded-2xl p-6 border border-indigo-500/20">
                                        <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-3">Lexicon</h3>
                                        <ul className="space-y-2">
                                            {METHOD_TUTORIALS[selectedMethod].vocabulary.map((v, i) => (
                                                <li key={i} className="text-sm text-indigo-200">
                                                    <span className="font-bold text-white">{v.term}:</span> {v.meaning}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Tip */}
                                    <div className="flex gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-sm text-yellow-200/90">
                                        <span className="text-xl">💡</span>
                                        <p>{METHOD_TUTORIALS[selectedMethod].tip}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="p-8 border-t border-white/5 bg-slate-900/50 sticky bottom-0">
                            <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/20">
                                Practice This Method
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
