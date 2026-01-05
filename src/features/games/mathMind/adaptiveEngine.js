/**
 * adaptiveEngine.js - Math Skills Camp v4
 * 
 * MAJOR IMPROVEMENTS:
 * - ALL skills unlocked by default (no artificial gates)
 * - Diagnostic placement test
 * - Immediate corrective feedback with explanations
 * - Step-by-step problem breakdown
 * - Professional branding (less emoji, more substance)
 * - Smarter teaching triggers
 */

// ═══════════════════════════════════════════════════════════════
// SKILL TREE - All Skills Unlocked (Self-Placement)
// ═══════════════════════════════════════════════════════════════

export const SKILLS = {
    // === ELEMENTARY ===
    addition: {
        id: 'addition', name: 'Addition', icon: '+', color: 'emerald',
        category: 'Elementary', prerequisites: [], levels: 5,
        description: 'Combine numbers together',
        hint: 'Think about joining groups'
    },
    subtraction: {
        id: 'subtraction', name: 'Subtraction', icon: '−', color: 'blue',
        category: 'Elementary', prerequisites: [], levels: 5,
        description: 'Take away from a number',
        hint: 'Count backwards or think about the difference'
    },
    multiplication: {
        id: 'multiplication', name: 'Multiplication', icon: '×', color: 'amber',
        category: 'Elementary', prerequisites: [], levels: 5,
        description: 'Repeated addition',
        hint: 'Groups of items'
    },
    division: {
        id: 'division', name: 'Division', icon: '÷', color: 'purple',
        category: 'Elementary', prerequisites: [], levels: 5,
        description: 'Split into equal parts',
        hint: 'How many groups can you make?'
    },

    // === MIDDLE SCHOOL ===
    fractions: {
        id: 'fractions', name: 'Fractions', icon: '½', color: 'orange',
        category: 'Middle School', prerequisites: [], levels: 5,
        description: 'Parts of a whole',
        hint: 'Think about slices of a pizza'
    },
    decimals: {
        id: 'decimals', name: 'Decimals', icon: '.', color: 'teal',
        category: 'Middle School', prerequisites: [], levels: 5,
        description: 'Numbers between whole numbers',
        hint: 'Like money: dollars and cents'
    },
    percentages: {
        id: 'percentages', name: 'Percentages', icon: '%', color: 'pink',
        category: 'Middle School', prerequisites: [], levels: 5,
        description: 'Parts per hundred',
        hint: 'Percent means "out of 100"'
    },
    order_ops: {
        id: 'order_ops', name: 'Order of Operations', icon: '( )', color: 'rose',
        category: 'Middle School', prerequisites: [], levels: 4,
        description: 'PEMDAS - which operation first?',
        hint: 'Parentheses, Exponents, Multiply/Divide, Add/Subtract'
    },

    // === HIGH SCHOOL ===
    exponents: {
        id: 'exponents', name: 'Exponents', icon: 'xⁿ', color: 'indigo',
        category: 'High School', prerequisites: [], levels: 5,
        description: 'Powers and repeated multiplication',
        hint: '2³ means 2 × 2 × 2'
    },
    roots: {
        id: 'roots', name: 'Square Roots', icon: '√', color: 'violet',
        category: 'High School', prerequisites: [], levels: 5,
        description: 'Finding the root of a number',
        hint: 'What times itself equals this?'
    },
    algebra: {
        id: 'algebra', name: 'Algebra', icon: 'x', color: 'cyan',
        category: 'High School', prerequisites: [], levels: 5,
        description: 'Solving for unknowns',
        hint: 'Undo operations to isolate x'
    },
    equations: {
        id: 'equations', name: 'Linear Equations', icon: '=', color: 'sky',
        category: 'High School', prerequisites: [], levels: 5,
        description: 'Equations with one variable',
        hint: 'Keep both sides balanced'
    },

    // === COLLEGE PREP ===
    quadratics: {
        id: 'quadratics', name: 'Quadratics', icon: 'x²', color: 'fuchsia',
        category: 'College Prep', prerequisites: [], levels: 4,
        description: 'Equations with x²',
        hint: 'Factor or use the quadratic formula'
    },
    trig: {
        id: 'trig', name: 'Trigonometry', icon: 'θ', color: 'lime',
        category: 'College Prep', prerequisites: [], levels: 4,
        description: 'Angles and triangles',
        hint: 'SOH-CAH-TOA for right triangles'
    },
    logarithms: {
        id: 'logarithms', name: 'Logarithms', icon: 'log', color: 'red',
        category: 'College Prep', prerequisites: [], levels: 4,
        description: 'Inverse of exponentials',
        hint: 'log asks: what power gives this?'
    }
};

export const SKILL_ORDER = [
    'addition', 'subtraction', 'multiplication', 'division',
    'fractions', 'decimals', 'percentages', 'order_ops',
    'exponents', 'roots', 'algebra', 'equations',
    'quadratics', 'trig', 'logarithms'
];

export const CATEGORIES = {
    'Elementary': { color: 'emerald', icon: '1-4', order: 1, grades: 'Grades 1-4' },
    'Middle School': { color: 'amber', icon: '5-8', order: 2, grades: 'Grades 5-8' },
    'High School': { color: 'purple', icon: '9-12', order: 3, grades: 'Grades 9-12' },
    'College Prep': { color: 'rose', icon: 'AP', order: 4, grades: 'AP / College' }
};

export const LEVELS = {
    1: { name: 'Foundations', description: 'Core concepts', color: 'slate', xpRequired: 0 },
    2: { name: 'Developing', description: 'Building skills', color: 'blue', xpRequired: 50 },
    3: { name: 'Proficient', description: 'Solid understanding', color: 'emerald', xpRequired: 150 },
    4: { name: 'Advanced', description: 'Complex problems', color: 'purple', xpRequired: 300 },
    5: { name: 'Mastery', description: 'Expert level', color: 'amber', xpRequired: 500 }
};

// ═══════════════════════════════════════════════════════════════
// ACHIEVEMENTS (Professional, not childish)
// ═══════════════════════════════════════════════════════════════

export const ACHIEVEMENTS = {
    first_problem: { id: 'first_problem', name: 'Getting Started', icon: '✓', desc: 'Complete your first problem' },
    streak_5: { id: 'streak_5', name: 'Consistent', icon: '5', desc: '5 correct answers in a row' },
    streak_10: { id: 'streak_10', name: 'Focused', icon: '10', desc: '10 correct answers in a row' },
    streak_25: { id: 'streak_25', name: 'Determined', icon: '25', desc: '25 correct answers in a row' },
    level_up: { id: 'level_up', name: 'Progress', icon: '↑', desc: 'Reach level 2 in any skill' },
    master: { id: 'master', name: 'Expert', icon: '★', desc: 'Reach level 5 in any skill' },
    explorer: { id: 'explorer', name: 'Explorer', icon: '◈', desc: 'Try 5 different skills' },
    speed: { id: 'speed', name: 'Quick Thinker', icon: '⚡', desc: '10 problems solved in under 5 seconds each' },
    accuracy: { id: 'accuracy', name: 'Precision', icon: '◎', desc: '20 problems with 90%+ accuracy' },
    college: { id: 'college', name: 'College Ready', icon: '🎓', desc: 'Complete a college prep skill' }
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const round = (n, d = 2) => Math.round(n * Math.pow(10, d)) / Math.pow(10, d);

const PERFECT_SQUARES = { 4: 2, 9: 3, 16: 4, 25: 5, 36: 6, 49: 7, 64: 8, 81: 9, 100: 10, 121: 11, 144: 12 };
const TRIG = { sin: { 0: 0, 30: 0.5, 45: 0.707, 60: 0.866, 90: 1 }, cos: { 0: 1, 30: 0.866, 45: 0.707, 60: 0.5, 90: 0 } };

// ═══════════════════════════════════════════════════════════════
// PROBLEM GENERATORS WITH STEP-BY-STEP EXPLANATIONS
// ═══════════════════════════════════════════════════════════════

const createProblem = (problem, answer, options = {}) => ({
    problem,
    answer,
    xpReward: options.xp || 10,
    explanation: options.explanation || null,
    steps: options.steps || null,
    hint: options.hint || null,
    type: options.type || 'multiple_choice'
});

const generators = {
    addition: {
        1: () => {
            const a = randomInt(1, 9), b = randomInt(1, 9);
            return createProblem(`${a} + ${b}`, a + b, {
                xp: 5,
                steps: [`Start with ${a}`, `Count up ${b} more`, `${a} + ${b} = ${a + b}`],
                explanation: `When we add ${a} and ${b}, we combine them to get ${a + b}.`
            });
        },
        2: () => {
            const a = randomInt(10, 50), b = randomInt(10, 40);
            return createProblem(`${a} + ${b}`, a + b, {
                xp: 8,
                steps: [`Add ones: ${a % 10} + ${b % 10} = ${(a + b) % 10}`, `Add tens: ${Math.floor(a / 10)} + ${Math.floor(b / 10)} = ${Math.floor((a + b) / 10)}`, `Combine: ${a + b}`],
                explanation: `Break it into place values: ones and tens.`
            });
        },
        3: () => {
            const a = randomInt(50, 200), b = randomInt(50, 150);
            return createProblem(`${a} + ${b}`, a + b, { xp: 12, explanation: `Add from right to left. Carry when needed.` });
        },
        4: () => {
            const a = randomInt(100, 500), b = randomInt(100, 400);
            return createProblem(`${a} + ${b}`, a + b, { xp: 15 });
        },
        5: () => {
            const a = randomInt(200, 999), b = randomInt(200, 999), c = randomInt(50, 200);
            return createProblem(`${a} + ${b} + ${c}`, a + b + c, { xp: 20 });
        }
    },

    subtraction: {
        1: () => {
            const b = randomInt(1, 8), a = b + randomInt(1, 8);
            return createProblem(`${a} − ${b}`, a - b, {
                xp: 5,
                steps: [`Start at ${a}`, `Count back ${b}`, `${a} − ${b} = ${a - b}`],
                explanation: `Subtraction means taking away. Start at ${a} and remove ${b}.`
            });
        },
        2: () => {
            const b = randomInt(10, 40), a = b + randomInt(20, 50);
            return createProblem(`${a} − ${b}`, a - b, { xp: 8 });
        },
        3: () => {
            const b = randomInt(30, 80), a = b + randomInt(50, 150);
            return createProblem(`${a} − ${b}`, a - b, { xp: 12, explanation: `When borrowing, take 1 from the next column.` });
        },
        4: () => { const b = randomInt(100, 300), a = b + randomInt(100, 400); return createProblem(`${a} − ${b}`, a - b, { xp: 15 }); },
        5: () => { const c = randomInt(20, 50), b = randomInt(50, 150), a = b + c + randomInt(100, 200); return createProblem(`${a} − ${b} − ${c}`, a - b - c, { xp: 20 }); }
    },

    multiplication: {
        1: () => {
            const a = randomInt(2, 5), b = randomInt(2, 5);
            return createProblem(`${a} × ${b}`, a * b, {
                xp: 5,
                steps: [`${a} × ${b} means ${a} groups of ${b}`, `${Array(a).fill(b).join(' + ')} = ${a * b}`],
                explanation: `Multiplication is repeated addition: ${a} groups of ${b}.`
            });
        },
        2: () => { const a = randomInt(3, 9), b = randomInt(3, 9); return createProblem(`${a} × ${b}`, a * b, { xp: 8 }); },
        3: () => { const a = randomInt(6, 12), b = randomInt(6, 12); return createProblem(`${a} × ${b}`, a * b, { xp: 12 }); },
        4: () => { const a = randomInt(10, 20), b = randomInt(3, 9); return createProblem(`${a} × ${b}`, a * b, { xp: 15 }); },
        5: () => { const a = randomInt(12, 25), b = randomInt(12, 20); return createProblem(`${a} × ${b}`, a * b, { xp: 20 }); }
    },

    division: {
        1: () => {
            const b = randomInt(2, 5), ans = randomInt(2, 5), a = b * ans;
            return createProblem(`${a} ÷ ${b}`, ans, {
                xp: 5,
                steps: [`How many groups of ${b} fit into ${a}?`, `${b} × ${ans} = ${a}`, `So ${a} ÷ ${b} = ${ans}`],
                explanation: `Division asks: how many ${b}s are in ${a}?`
            });
        },
        2: () => { const b = randomInt(2, 9), ans = randomInt(3, 10), a = b * ans; return createProblem(`${a} ÷ ${b}`, ans, { xp: 8 }); },
        3: () => { const b = randomInt(5, 12), ans = randomInt(5, 12), a = b * ans; return createProblem(`${a} ÷ ${b}`, ans, { xp: 12 }); },
        4: () => { const b = randomInt(6, 15), ans = randomInt(6, 15), a = b * ans; return createProblem(`${a} ÷ ${b}`, ans, { xp: 15 }); },
        5: () => { const b = randomInt(10, 20), ans = randomInt(10, 20), a = b * ans; return createProblem(`${a} ÷ ${b}`, ans, { xp: 20 }); }
    },

    fractions: {
        1: () => {
            const d = randomChoice([2, 4, 5]), a = randomInt(1, d - 1), b = randomInt(1, d - a);
            const ans = round((a + b) / d, 2);
            return createProblem(`${a}/${d} + ${b}/${d}`, ans, {
                xp: 8,
                steps: [`Same denominator: just add numerators`, `${a} + ${b} = ${a + b}`, `Answer: ${a + b}/${d}`],
                explanation: `When denominators match, add the numerators.`
            });
        },
        2: () => {
            const f = randomInt(2, 4), n = randomInt(1, 3) * f, d = randomInt(2, 5) * f;
            const gcd = (a, b) => b ? gcd(b, a % b) : a;
            const g = gcd(n, d);
            return createProblem(`Simplify ${n}/${d}`, `${n / g}/${d / g}`, { xp: 10, explanation: `Divide both by their GCD.`, type: 'text' });
        },
        3: () => {
            const a = randomInt(1, 4), b = randomInt(2, 5), c = randomInt(1, 4), d = randomInt(2, 5);
            const ans = round((a * c) / (b * d), 3);
            return createProblem(`${a}/${b} × ${c}/${d}`, ans, { xp: 12, explanation: `Multiply straight across: numerator × numerator, denominator × denominator.` });
        },
        4: () => {
            const a = randomInt(1, 3), b = randomChoice([2, 3, 4]), c = randomInt(1, 3), d = randomChoice([4, 5, 6]);
            const ans = round((a / b) + (c / d), 3);
            return createProblem(`${a}/${b} + ${c}/${d}`, ans, { xp: 15, explanation: `Find common denominator first.` });
        },
        5: () => {
            const a = randomInt(1, 4), b = randomInt(2, 5), c = randomInt(1, 4), d = randomInt(2, 5);
            const ans = round((a * d) / (b * c), 3);
            return createProblem(`${a}/${b} ÷ ${c}/${d}`, ans, { xp: 18, explanation: `Flip the second fraction and multiply.` });
        }
    },

    decimals: {
        1: () => { const a = randomInt(1, 9) / 10, b = randomInt(1, 9) / 10; return createProblem(`${a} + ${b}`, round(a + b), { xp: 8 }); },
        2: () => { const a = randomInt(10, 50) / 10, b = randomInt(10, 30) / 10; return createProblem(`${a} + ${b}`, round(a + b), { xp: 10 }); },
        3: () => { const a = randomInt(10, 30) / 10, b = randomInt(2, 9) / 10; return createProblem(`${a} × ${b}`, round(a * b), { xp: 12 }); },
        4: () => { const a = randomInt(50, 99) / 100, b = randomInt(10, 50) / 100; return createProblem(`${a} + ${b}`, round(a + b), { xp: 15 }); },
        5: () => { const a = randomInt(10, 50) / 10, b = randomInt(2, 5); return createProblem(`${a} ÷ ${b}`, round(a / b), { xp: 18 }); }
    },

    percentages: {
        1: () => {
            const p = randomChoice([10, 20, 25, 50]), n = randomChoice([20, 40, 80, 100]);
            return createProblem(`${p}% of ${n}`, (p / 100) * n, {
                xp: 8,
                steps: [`${p}% = ${p}/100 = ${p / 100}`, `${p / 100} × ${n} = ${(p / 100) * n}`],
                explanation: `Percent means "per hundred." Convert to decimal and multiply.`
            });
        },
        2: () => { const p = randomChoice([10, 15, 20, 30]), n = randomInt(50, 200); return createProblem(`${p}% of ${n}`, round((p / 100) * n), { xp: 12 }); },
        3: () => { const n = randomInt(1, 4), d = randomChoice([4, 5, 8, 10]); return createProblem(`Convert ${n}/${d} to %`, (n / d) * 100, { xp: 12 }); },
        4: () => { const o = randomChoice([50, 80, 100, 200]), p = randomChoice([10, 20, 25]); return createProblem(`${o} + ${p}%`, o * (1 + p / 100), { xp: 15 }); },
        5: () => { const ans = randomInt(80, 200), p = randomChoice([10, 20, 25]); const o = round(ans / (1 + p / 100)); return createProblem(`After +${p}%: ${ans}. Original?`, o, { xp: 20 }); }
    },

    order_ops: {
        1: () => {
            const a = randomInt(2, 8), b = randomInt(2, 5), c = randomInt(1, 5);
            return createProblem(`${a} + ${b} × ${c}`, a + (b * c), {
                xp: 10,
                steps: [`Multiply first: ${b} × ${c} = ${b * c}`, `Then add: ${a} + ${b * c} = ${a + b * c}`],
                explanation: `PEMDAS: Multiply/Divide before Add/Subtract.`
            });
        },
        2: () => { const a = randomInt(2, 8), b = randomInt(2, 6), c = randomInt(2, 8); return createProblem(`${a} × ${b} + ${c}`, (a * b) + c, { xp: 12 }); },
        3: () => { const a = randomInt(2, 6), b = randomInt(2, 5), c = randomInt(2, 5), d = randomInt(1, 5); return createProblem(`${a} + ${b} × ${c} − ${d}`, a + (b * c) - d, { xp: 15 }); },
        4: () => { const a = randomInt(2, 6), b = randomInt(2, 6), c = randomInt(2, 6); return createProblem(`(${a} + ${b}) × ${c}`, (a + b) * c, { xp: 18, explanation: `Parentheses first!` }); }
    },

    exponents: {
        1: () => { const b = randomInt(2, 5); return createProblem(`${b}²`, b * b, { xp: 8, explanation: `${b}² = ${b} × ${b}` }); },
        2: () => { const b = randomInt(2, 4); return createProblem(`${b}³`, b * b * b, { xp: 10, explanation: `${b}³ = ${b} × ${b} × ${b}` }); },
        3: () => { const b = randomInt(2, 4), e = randomInt(3, 4); return createProblem(`${b}^${e}`, Math.pow(b, e), { xp: 12 }); },
        4: () => { const b = randomInt(2, 3), e1 = randomInt(2, 3), e2 = randomInt(2, 3); return createProblem(`(${b}^${e1})^${e2} = ${b}^?`, e1 * e2, { xp: 15, explanation: `Power rule: multiply exponents.` }); },
        5: () => { const b = randomInt(2, 5), e1 = randomInt(2, 4), e2 = randomInt(2, 4); return createProblem(`${b}^${e1} × ${b}^${e2} = ${b}^?`, e1 + e2, { xp: 18, explanation: `Product rule: add exponents.` }); }
    },

    roots: {
        1: () => { const sq = randomChoice([4, 9, 16, 25]); return createProblem(`√${sq}`, PERFECT_SQUARES[sq], { xp: 8, explanation: `What times itself = ${sq}?` }); },
        2: () => { const sq = randomChoice([36, 49, 64, 81]); return createProblem(`√${sq}`, PERFECT_SQUARES[sq], { xp: 10 }); },
        3: () => { const sq = randomChoice([100, 121, 144]); return createProblem(`√${sq}`, PERFECT_SQUARES[sq], { xp: 12 }); },
        4: () => { const a = randomChoice([4, 9]), b = randomChoice([4, 9]); return createProblem(`√${a} × √${b}`, PERFECT_SQUARES[a] * PERFECT_SQUARES[b], { xp: 15 }); },
        5: () => { const n = randomChoice([8, 18, 50]); const s = { 8: '2√2', 18: '3√2', 50: '5√2' }; return createProblem(`Simplify √${n}`, s[n], { xp: 20, type: 'text' }); }
    },

    algebra: {
        1: () => { const a = randomInt(2, 10), x = randomInt(2, 10); return createProblem(`x + ${a} = ${x + a}`, x, { xp: 10, steps: [`Subtract ${a} from both sides`, `x = ${x + a} − ${a}`, `x = ${x}`], explanation: `Undo addition by subtracting.` }); },
        2: () => { const a = randomInt(2, 8), x = randomInt(2, 10); return createProblem(`${a}x = ${a * x}`, x, { xp: 12, explanation: `Divide both sides by ${a}.` }); },
        3: () => { const a = randomInt(2, 6), b = randomInt(1, 10), x = randomInt(2, 8); return createProblem(`${a}x + ${b} = ${a * x + b}`, x, { xp: 15 }); },
        4: () => { const a = randomInt(2, 6), b = randomInt(1, 10), x = randomInt(3, 10); return createProblem(`${a}x − ${b} = ${a * x - b}`, x, { xp: 18 }); },
        5: () => { const a = randomInt(3, 8), c = randomInt(1, a - 1), x = randomInt(2, 8), b = randomInt(1, 10); const d = a * x + b - c * x; return createProblem(`${a}x + ${b} = ${c}x + ${d}`, x, { xp: 22 }); }
    },

    equations: {
        1: () => { const a = randomInt(2, 5), x = randomInt(2, 10), b = randomInt(1, 10); return createProblem(`${a}x + ${b} = ${a * x + b}`, x, { xp: 12 }); },
        2: () => { const a = randomInt(2, 8), x = randomInt(2, 10); return createProblem(`x/${a} = ${x}`, a * x, { xp: 12 }); },
        3: () => { const b = randomInt(2, 5), c = randomInt(2, 8), a = randomInt(1, 10); const x = b * c - a; return createProblem(`(x + ${a})/${b} = ${c}`, x, { xp: 18 }); },
        4: () => { const a = randomInt(2, 5), b = randomInt(2, 5), y = randomInt(1, 5), x = randomInt(2, 8); const c = a * x + b * y; return createProblem(`${a}x + ${b}(${y}) = ${c}`, x, { xp: 20 }); },
        5: () => { const x = randomInt(3, 10), y = randomInt(1, x - 1); return createProblem(`x+y=${x + y}, x−y=${x - y}. x=?`, x, { xp: 25 }); }
    },

    quadratics: {
        1: () => { const r = randomInt(2, 6); return createProblem(`x² = ${r * r}`, r, { xp: 15, explanation: `Take the square root.` }); },
        2: () => { const r1 = randomInt(1, 5), r2 = randomInt(1, 5); const b = r1 + r2, c = r1 * r2; return createProblem(`x² + ${b}x + ${c} = 0. x = ?`, -r1, { xp: 18, explanation: `Factor: (x+${r1})(x+${r2})=0` }); },
        3: () => { const h = randomInt(1, 5), k = randomInt(1, 10); return createProblem(`y = (x−${h})² + ${k}`, h, { xp: 20, explanation: `Vertex form: vertex at (${h}, ${k})` }); },
        4: () => { const a = 1, b = randomInt(2, 8), c = randomInt(1, 4); return createProblem(`x²+${b}x+${c}=0, b²−4ac=?`, b * b - 4 * a * c, { xp: 22 }); }
    },

    trig: {
        1: () => { const a = randomChoice([30, 45, 60]); return createProblem(`sin(${a}°)`, TRIG.sin[a], { xp: 15, explanation: `Memorize: sin(30)=0.5, sin(45)=√2/2, sin(60)=√3/2` }); },
        2: () => { const a = randomChoice([30, 45, 60]); return createProblem(`cos(${a}°)`, TRIG.cos[a], { xp: 15 }); },
        3: () => { const a = randomChoice([30, 45, 60]); const t = round(TRIG.sin[a] / TRIG.cos[a], 3); return createProblem(`tan(${a}°)`, t, { xp: 18 }); },
        4: () => createProblem(`sin²θ + cos²θ = ?`, 1, { xp: 20, explanation: `Pythagorean identity!` })
    },

    logarithms: {
        1: () => { const n = randomChoice([10, 100, 1000]); return createProblem(`log₁₀(${n})`, Math.log10(n), { xp: 15, explanation: `10 to what power = ${n}?` }); },
        2: () => { const e = randomInt(2, 6); return createProblem(`log₂(${Math.pow(2, e)})`, e, { xp: 18 }); },
        3: () => { const b = randomInt(2, 5), n = randomInt(2, 4); return createProblem(`log₍${b}₎(${Math.pow(b, n)})`, n, { xp: 20 }); },
        4: () => { const a = randomInt(2, 5), b = randomInt(2, 5); return createProblem(`log(${a}) + log(${b}) = log(?)`, a * b, { xp: 22, explanation: `Product rule: log(ab) = log(a) + log(b)` }); }
    }
};

// ═══════════════════════════════════════════════════════════════
// GENERATE PROBLEM
// ═══════════════════════════════════════════════════════════════

export const generateProblem = (skillId, level) => {
    const skill = SKILLS[skillId];
    const maxLevel = skill?.levels || 5;
    const lvl = Math.min(level, maxLevel);

    const generator = generators[skillId]?.[lvl] || generators[skillId]?.[1];
    if (!generator) return null;

    const problem = generator();
    const answer = typeof problem.answer === 'number' ? problem.answer : 0;

    // Generate distractor options
    const options = new Set([problem.answer]);
    const offsets = [1, -1, 2, -2, 5, -5, 10, -10];

    while (options.size < 4) {
        const offset = offsets[Math.floor(Math.random() * offsets.length)];
        let wrong = answer + offset;
        if (typeof problem.answer === 'string') wrong = round(answer + offset);
        if (wrong > 0 || skillId === 'algebra' || skillId === 'quadratics') options.add(wrong);
    }

    return {
        ...problem,
        options: [...options].sort(() => Math.random() - 0.5),
        skillId,
        level: lvl,
        timestamp: Date.now()
    };
};

// ═══════════════════════════════════════════════════════════════
// ALL SKILLS UNLOCKED
// ═══════════════════════════════════════════════════════════════

export const isSkillUnlocked = () => true; // All skills available

export const calculateNextDifficulty = (skillStats, recentHistory = [], maxLevel = 5) => {
    const { correct, total, streak, level, xp = 0 } = skillStats;
    const accuracy = total > 0 ? correct / total : 0;
    const xpNeeded = LEVELS[level + 1]?.xpRequired || Infinity;

    // Level up conditions
    if (accuracy >= 0.85 && streak >= 5 && xp >= xpNeeded && level < maxLevel) {
        return { action: 'LEVEL_UP', newLevel: level + 1, reason: 'Level Up!', celebration: true };
    }

    // TRIGGER TEACHING MORE AGGRESSIVELY
    // After just 2 wrong in a row, or 40% accuracy
    if (streak <= -2 || (accuracy < 0.4 && total >= 3)) {
        return { action: 'TEACH', newLevel: level, reason: 'Let me explain this concept.' };
    }

    if (accuracy < 0.6 && level > 1) {
        return { action: 'LEVEL_DOWN', newLevel: level - 1, reason: 'Let\'s reinforce the basics.' };
    }

    return { action: 'CONTINUE', newLevel: level, reason: null };
};

export const detectStrugglePatterns = (history) => {
    if (!history || history.length < 3) return [];
    const wrong = history.filter(p => !p.correct);
    if (wrong.length < 2) return [];

    const bySkill = {};
    wrong.forEach(p => bySkill[p.skillId] = (bySkill[p.skillId] || 0) + 1);
    const weakest = Object.entries(bySkill).sort((a, b) => b[1] - a[1])[0];

    if (weakest && weakest[1] >= 2) {
        const skill = SKILLS[weakest[0]];
        return [{ type: weakest[0], message: `Focus on ${skill?.name}`, tip: skill?.hint }];
    }
    return [];
};

export const calculateLearningVelocity = (history) => {
    if (!history || history.length < 5) return 0;
    const half = Math.floor(history.length / 2);
    const first = history.slice(0, half).filter(p => p.correct).length / half;
    const second = history.slice(half).filter(p => p.correct).length / (history.length - half);
    return second - first;
};

// ═══════════════════════════════════════════════════════════════
// TEACHING CONTENT (More detailed, educational)
// ═══════════════════════════════════════════════════════════════

export const TEACHING_CONTENT = {
    addition: {
        title: "Understanding Addition", icon: '+', steps: [
            { text: "Addition combines amounts together.", visual: '●● + ●●● = ●●●●●' },
            { text: "Line up numbers by place value.", visual: '23\n+15\n---' },
            { text: "Add from right to left. Carry when needed.", visual: '28\n+14\n---\n42' }
        ]
    },
    subtraction: {
        title: "Understanding Subtraction", icon: '−', steps: [
            { text: "Subtraction finds the difference.", visual: '●●●●● − ●● = ●●●' },
            { text: "Borrow when the top digit is smaller.", visual: '32 → 2¹12' }
        ]
    },
    multiplication: {
        title: "Understanding Multiplication", icon: '×', steps: [
            { text: "Multiplication is repeated addition.", visual: '3 × 4 = 4 + 4 + 4 = 12' },
            { text: "Think in groups.", visual: '●●●● ●●●● ●●●● = 12' }
        ]
    },
    division: {
        title: "Understanding Division", icon: '÷', steps: [
            { text: "Division splits into equal groups.", visual: '12 ÷ 3 = how many 3s in 12?' },
            { text: "Use multiplication facts backwards.", visual: '3 × 4 = 12 → 12 ÷ 3 = 4' }
        ]
    },
    fractions: {
        title: "Understanding Fractions", icon: '½', steps: [
            { text: "A fraction shows part of a whole.", visual: '½ = 1 out of 2 equal parts' },
            { text: "Top = parts you have. Bottom = total parts.", visual: '3/4 = 3 shaded, 4 total' }
        ]
    },
    decimals: {
        title: "Understanding Decimals", icon: '.', steps: [
            { text: "Decimals are another way to write fractions.", visual: '0.5 = ½ = 50%' },
            { text: "Each place is 10× smaller.", visual: '1.23 = 1 + 2/10 + 3/100' }
        ]
    },
    percentages: {
        title: "Understanding Percentages", icon: '%', steps: [
            { text: "Percent means 'per 100'.", visual: '25% = 25/100 = 0.25' },
            { text: "To find X% of Y: multiply.", visual: '20% of 50 = 0.20 × 50 = 10' }
        ]
    },
    order_ops: {
        title: "Order of Operations", icon: '( )', steps: [
            { text: "PEMDAS: Parentheses, Exponents, Multiply/Divide, Add/Subtract", visual: 'P → E → MD → AS' },
            { text: "Work left to right within each level.", visual: '2 + 3 × 4 = 2 + 12 = 14' }
        ]
    },
    exponents: {
        title: "Understanding Exponents", icon: 'xⁿ', steps: [
            { text: "The exponent tells how many times to multiply.", visual: '2³ = 2 × 2 × 2 = 8' }
        ]
    },
    roots: {
        title: "Understanding Square Roots", icon: '√', steps: [
            { text: "√ asks: what number times itself equals this?", visual: '√16 = 4 because 4×4=16' }
        ]
    },
    algebra: {
        title: "Introduction to Algebra", icon: 'x', steps: [
            { text: "Variables represent unknown numbers.", visual: 'x + 3 = 7 → x = 4' },
            { text: "Undo operations to solve.", visual: 'x + 3 = 7 → x = 7 - 3' }
        ]
    },
    equations: {
        title: "Solving Equations", icon: '=', steps: [
            { text: "Keep both sides balanced.", visual: '2x + 1 = 7 → 2x = 6 → x = 3' }
        ]
    },
    quadratics: {
        title: "Quadratic Equations", icon: 'x²', steps: [
            { text: "Standard form: ax² + bx + c = 0", visual: 'x² + 5x + 6 = 0' },
            { text: "Factor or use the quadratic formula.", visual: '(x+2)(x+3) = 0' }
        ]
    },
    trig: {
        title: "Introduction to Trigonometry", icon: 'θ', steps: [
            { text: "SOH CAH TOA for right triangles", visual: 'sin = O/H, cos = A/H, tan = O/A' }
        ]
    },
    logarithms: {
        title: "Understanding Logarithms", icon: 'log', steps: [
            { text: "log is the inverse of exponents.", visual: 'log₂(8) = 3 because 2³ = 8' }
        ]
    }
};

export const getTeachingContent = (skillId, profile, patterns = []) => {
    const content = TEACHING_CONTENT[skillId];
    if (!content) return { title: 'Learning', icon: '?', steps: [{ text: 'Let\'s practice!' }] };
    return { ...content, personalAdvice: patterns.map(p => p.tip).filter(Boolean) };
};

export const generateSessionSummary = (history, profile) => {
    if (!history?.length) return null;
    const correct = history.filter(p => p.correct).length;
    const total = history.length;
    const acc = Math.round((correct / total) * 100);
    return {
        problemsSolved: total,
        correct,
        accuracy: acc,
        xpEarned: history.filter(p => p.correct).reduce((a, p) => a + (p.xpReward || 10), 0),
        avgTime: Math.round(history.reduce((a, p) => a + (p.timeSpent || 0), 0) / total),
        patterns: detectStrugglePatterns(history),
        encouragement: acc >= 85 ? 'Excellent work!' : acc >= 70 ? 'Good progress!' : acc >= 50 ? 'Keep practicing!' : 'Every mistake is a learning opportunity.'
    };
};
