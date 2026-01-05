/**
 * adaptiveEngine.js - Advanced AI Learning Engine v3
 * 
 * EXPANDED SKILL TREE: Elementary → College Level
 * - Basic arithmetic (add, sub, mult, div)
 * - Middle school (fractions, decimals, percentages, order of ops)
 * - High school (exponents, roots, algebra, equations)
 * - College prep (quadratics, polynomials, trig basics, logarithms)
 */

// ═══════════════════════════════════════════════════════════════
// EXPANDED SKILL TREE - Elementary to College
// ═══════════════════════════════════════════════════════════════

export const SKILLS = {
    // === ELEMENTARY ===
    addition: {
        id: 'addition', name: 'Addition', icon: '➕', color: 'emerald',
        category: 'Elementary', prerequisites: [], levels: 5,
        description: 'Adding numbers together'
    },
    subtraction: {
        id: 'subtraction', name: 'Subtraction', icon: '➖', color: 'blue',
        category: 'Elementary', prerequisites: ['addition'], levels: 5,
        description: 'Taking numbers away'
    },
    multiplication: {
        id: 'multiplication', name: 'Multiplication', icon: '✖️', color: 'amber',
        category: 'Elementary', prerequisites: ['addition'], levels: 5,
        description: 'Repeated addition'
    },
    division: {
        id: 'division', name: 'Division', icon: '➗', color: 'purple',
        category: 'Elementary', prerequisites: ['multiplication'], levels: 5,
        description: 'Splitting into equal groups'
    },

    // === MIDDLE SCHOOL ===
    fractions: {
        id: 'fractions', name: 'Fractions', icon: '½', color: 'orange',
        category: 'Middle School', prerequisites: ['division'], levels: 5,
        description: 'Parts of a whole'
    },
    decimals: {
        id: 'decimals', name: 'Decimals', icon: '0.5', color: 'teal',
        category: 'Middle School', prerequisites: ['division'], levels: 5,
        description: 'Numbers with decimal points'
    },
    percentages: {
        id: 'percentages', name: 'Percentages', icon: '%', color: 'pink',
        category: 'Middle School', prerequisites: ['fractions', 'decimals'], levels: 5,
        description: 'Out of 100'
    },
    order_ops: {
        id: 'order_ops', name: 'Order of Ops', icon: '📐', color: 'rose',
        category: 'Middle School', prerequisites: ['addition', 'subtraction', 'multiplication', 'division'], levels: 4,
        description: 'PEMDAS - which operation first?'
    },

    // === HIGH SCHOOL ===
    exponents: {
        id: 'exponents', name: 'Exponents', icon: 'x²', color: 'indigo',
        category: 'High School', prerequisites: ['multiplication'], levels: 5,
        description: 'Powers and repeated multiplication'
    },
    roots: {
        id: 'roots', name: 'Square Roots', icon: '√', color: 'violet',
        category: 'High School', prerequisites: ['exponents'], levels: 5,
        description: 'Finding the root of a number'
    },
    algebra: {
        id: 'algebra', name: 'Basic Algebra', icon: 'x', color: 'cyan',
        category: 'High School', prerequisites: ['order_ops'], levels: 5,
        description: 'Solving for unknown variables'
    },
    equations: {
        id: 'equations', name: 'Linear Equations', icon: '=', color: 'sky',
        category: 'High School', prerequisites: ['algebra'], levels: 5,
        description: 'Solving equations with one variable'
    },

    // === COLLEGE PREP ===
    quadratics: {
        id: 'quadratics', name: 'Quadratics', icon: 'x²', color: 'fuchsia',
        category: 'College Prep', prerequisites: ['equations', 'exponents'], levels: 4,
        description: 'Quadratic equations and parabolas'
    },
    trig: {
        id: 'trig', name: 'Trigonometry', icon: '∠', color: 'lime',
        category: 'College Prep', prerequisites: ['algebra'], levels: 4,
        description: 'Sin, cos, tan and triangles'
    },
    logarithms: {
        id: 'logarithms', name: 'Logarithms', icon: 'log', color: 'red',
        category: 'College Prep', prerequisites: ['exponents'], levels: 4,
        description: 'Inverse of exponents'
    }
};

export const SKILL_ORDER = [
    // Elementary
    'addition', 'subtraction', 'multiplication', 'division',
    // Middle School
    'fractions', 'decimals', 'percentages', 'order_ops',
    // High School
    'exponents', 'roots', 'algebra', 'equations',
    // College Prep
    'quadratics', 'trig', 'logarithms'
];

export const CATEGORIES = {
    'Elementary': { color: 'emerald', icon: '🌱', order: 1 },
    'Middle School': { color: 'amber', icon: '📚', order: 2 },
    'High School': { color: 'purple', icon: '🎓', order: 3 },
    'College Prep': { color: 'rose', icon: '🚀', order: 4 }
};

export const LEVELS = {
    1: { name: 'Beginner', description: 'Basic problems', color: 'emerald', xpRequired: 0 },
    2: { name: 'Learner', description: 'Building skills', color: 'blue', xpRequired: 50 },
    3: { name: 'Skilled', description: 'Getting harder', color: 'amber', xpRequired: 150 },
    4: { name: 'Expert', description: 'Complex problems', color: 'orange', xpRequired: 300 },
    5: { name: 'Master', description: 'Full mastery', color: 'purple', xpRequired: 500 }
};

// ═══════════════════════════════════════════════════════════════
// ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════════

export const ACHIEVEMENTS = {
    first_problem: { id: 'first_problem', name: 'First Steps', icon: '👣', desc: 'Solve your first problem' },
    streak_5: { id: 'streak_5', name: 'On Fire', icon: '🔥', desc: '5 correct in a row' },
    streak_10: { id: 'streak_10', name: 'Blazing', icon: '🌟', desc: '10 correct in a row' },
    streak_25: { id: 'streak_25', name: 'Unstoppable', icon: '💫', desc: '25 correct in a row' },
    level_up: { id: 'level_up', name: 'Level Up', icon: '⬆️', desc: 'Reach level 2 in any skill' },
    master: { id: 'master', name: 'Mastery', icon: '👑', desc: 'Reach level 5 in any skill' },
    algebra_intro: { id: 'algebra_intro', name: 'Algebra Unlocked', icon: '🔓', desc: 'Start learning algebra' },
    college_bound: { id: 'college_bound', name: 'College Bound', icon: '🎓', desc: 'Try a college prep skill' },
    speed_demon: { id: 'speed_demon', name: 'Speed Demon', icon: '⚡', desc: '10 problems under 5 seconds each' },
    well_rounded: { id: 'well_rounded', name: 'Well Rounded', icon: '🎯', desc: 'Try 10 different skills' }
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const round = (n, decimals = 2) => Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals);

// Perfect squares for square root problems
const PERFECT_SQUARES = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225];
const SQRT_MAP = { 4: 2, 9: 3, 16: 4, 25: 5, 36: 6, 49: 7, 64: 8, 81: 9, 100: 10, 121: 11, 144: 12, 169: 13, 196: 14, 225: 15 };

// Trig values
const TRIG_ANGLES = [0, 30, 45, 60, 90];
const SIN_VALUES = { 0: 0, 30: 0.5, 45: 0.707, 60: 0.866, 90: 1 };
const COS_VALUES = { 0: 1, 30: 0.866, 45: 0.707, 60: 0.5, 90: 0 };
const TAN_VALUES = { 0: 0, 30: 0.577, 45: 1, 60: 1.732, 90: 'undefined' };

// ═══════════════════════════════════════════════════════════════
// PROBLEM GENERATORS
// ═══════════════════════════════════════════════════════════════

const generators = {
    // === ELEMENTARY ===
    addition: {
        1: () => { const a = randomInt(1, 9), b = randomInt(1, 9); return { problem: `${a} + ${b}`, answer: a + b, xpReward: 5 }; },
        2: () => { const a = randomInt(10, 50), b = randomInt(5, 30); return { problem: `${a} + ${b}`, answer: a + b, xpReward: 8 }; },
        3: () => { const a = randomInt(50, 200), b = randomInt(25, 150); return { problem: `${a} + ${b}`, answer: a + b, xpReward: 12 }; },
        4: () => { const a = randomInt(100, 500), b = randomInt(100, 500); return { problem: `${a} + ${b}`, answer: a + b, xpReward: 15 }; },
        5: () => { const a = randomInt(100, 999), b = randomInt(100, 999), c = randomInt(10, 99); return { problem: `${a} + ${b} + ${c}`, answer: a + b + c, xpReward: 20 }; }
    },

    subtraction: {
        1: () => { const b = randomInt(1, 8), a = b + randomInt(1, 8); return { problem: `${a} - ${b}`, answer: a - b, xpReward: 5 }; },
        2: () => { const b = randomInt(10, 40), a = b + randomInt(20, 60); return { problem: `${a} - ${b}`, answer: a - b, xpReward: 8 }; },
        3: () => { const b = randomInt(50, 150), a = b + randomInt(50, 200); return { problem: `${a} - ${b}`, answer: a - b, xpReward: 12 }; },
        4: () => { const b = randomInt(100, 400), a = b + randomInt(100, 500); return { problem: `${a} - ${b}`, answer: a - b, xpReward: 15 }; },
        5: () => { const c = randomInt(10, 50), b = randomInt(50, 150), a = b + c + randomInt(100, 300); return { problem: `${a} - ${b} - ${c}`, answer: a - b - c, xpReward: 20 }; }
    },

    multiplication: {
        1: () => { const a = randomInt(2, 5), b = randomInt(2, 5); return { problem: `${a} × ${b}`, answer: a * b, xpReward: 5 }; },
        2: () => { const a = randomInt(3, 9), b = randomInt(3, 9); return { problem: `${a} × ${b}`, answer: a * b, xpReward: 8 }; },
        3: () => { const a = randomInt(6, 12), b = randomInt(6, 12); return { problem: `${a} × ${b}`, answer: a * b, xpReward: 12 }; },
        4: () => { const a = randomInt(10, 25), b = randomInt(3, 9); return { problem: `${a} × ${b}`, answer: a * b, xpReward: 15 }; },
        5: () => { const a = randomInt(12, 25), b = randomInt(12, 25); return { problem: `${a} × ${b}`, answer: a * b, xpReward: 20 }; }
    },

    division: {
        1: () => { const b = randomInt(2, 5), ans = randomInt(2, 5), a = b * ans; return { problem: `${a} ÷ ${b}`, answer: ans, xpReward: 5 }; },
        2: () => { const b = randomInt(2, 9), ans = randomInt(3, 10), a = b * ans; return { problem: `${a} ÷ ${b}`, answer: ans, xpReward: 8 }; },
        3: () => { const b = randomInt(5, 12), ans = randomInt(5, 12), a = b * ans; return { problem: `${a} ÷ ${b}`, answer: ans, xpReward: 12 }; },
        4: () => { const b = randomInt(6, 15), ans = randomInt(6, 20), a = b * ans; return { problem: `${a} ÷ ${b}`, answer: ans, xpReward: 15 }; },
        5: () => { const b = randomInt(10, 20), ans = randomInt(10, 25), a = b * ans; return { problem: `${a} ÷ ${b}`, answer: ans, xpReward: 20 }; }
    },

    // === MIDDLE SCHOOL ===
    fractions: {
        1: () => { // Simple addition with same denominator
            const d = randomChoice([2, 4, 5, 10]), a = randomInt(1, d - 1), b = randomInt(1, d - a);
            return { problem: `${a}/${d} + ${b}/${d}`, answer: `${a + b}/${d}`, answerNum: (a + b) / d, xpReward: 8 };
        },
        2: () => { // Simplify a fraction
            const factor = randomInt(2, 5), num = randomInt(1, 4) * factor, den = randomInt(2, 6) * factor;
            const gcd = (a, b) => b ? gcd(b, a % b) : a;
            const g = gcd(num, den);
            return { problem: `Simplify: ${num}/${den}`, answer: `${num / g}/${den / g}`, answerNum: num / den, xpReward: 10 };
        },
        3: () => { // Multiply fractions
            const a = randomInt(1, 5), b = randomInt(2, 6), c = randomInt(1, 5), d = randomInt(2, 6);
            return { problem: `${a}/${b} × ${c}/${d}`, answer: `${a * c}/${b * d}`, answerNum: (a * c) / (b * d), xpReward: 12 };
        },
        4: () => { // Add with different denominators
            const d1 = randomChoice([2, 3, 4]), d2 = randomChoice([4, 5, 6]);
            const a = randomInt(1, d1 - 1), b = randomInt(1, d2 - 1);
            const lcd = d1 * d2;
            const ans = (a * d2 + b * d1) / lcd;
            return { problem: `${a}/${d1} + ${b}/${d2}`, answer: round(ans, 3), answerNum: ans, xpReward: 15 };
        },
        5: () => { // Divide fractions
            const a = randomInt(1, 4), b = randomInt(2, 5), c = randomInt(1, 4), d = randomInt(2, 5);
            return { problem: `${a}/${b} ÷ ${c}/${d}`, answer: `${a * d}/${b * c}`, answerNum: (a * d) / (b * c), xpReward: 18 };
        }
    },

    decimals: {
        1: () => { const a = randomInt(1, 9) / 10, b = randomInt(1, 9) / 10; return { problem: `${a} + ${b}`, answer: round(a + b), xpReward: 8 }; },
        2: () => { const a = randomInt(10, 99) / 10, b = randomInt(10, 99) / 10; return { problem: `${a} + ${b}`, answer: round(a + b), xpReward: 10 }; },
        3: () => { const a = randomInt(10, 50) / 10, b = randomInt(2, 9) / 10; return { problem: `${a} × ${b}`, answer: round(a * b), xpReward: 12 }; },
        4: () => { const a = randomInt(10, 99) / 10, b = randomInt(1, 9) / 10; return { problem: `${a} - ${b}`, answer: round(a - b), xpReward: 15 }; },
        5: () => { const a = randomInt(10, 99) / 100, b = randomInt(10, 99) / 100; return { problem: `${a} + ${b}`, answer: round(a + b), xpReward: 18 }; }
    },

    percentages: {
        1: () => { // What is X% of Y (easy)
            const p = randomChoice([10, 20, 25, 50]), n = randomChoice([20, 40, 50, 100]);
            return { problem: `${p}% of ${n}?`, answer: (p / 100) * n, xpReward: 8 };
        },
        2: () => {
            const p = randomChoice([10, 15, 20, 25, 30]), n = randomInt(50, 200);
            return { problem: `${p}% of ${n}?`, answer: (p / 100) * n, xpReward: 10 };
        },
        3: () => { // Convert to percentage
            const num = randomInt(1, 4), den = randomChoice([4, 5, 8, 10]);
            return { problem: `Convert ${num}/${den} to %`, answer: (num / den) * 100, xpReward: 12 };
        },
        4: () => { // Percentage increase
            const orig = randomChoice([50, 80, 100, 200]), p = randomChoice([10, 20, 25, 50]);
            return { problem: `${orig} increased by ${p}% = ?`, answer: orig * (1 + p / 100), xpReward: 15 };
        },
        5: () => { // Find original (reverse)
            const ans = randomInt(50, 200), p = randomChoice([10, 20, 25]);
            const orig = ans / (1 + p / 100);
            return { problem: `After ${p}% increase, result is ${ans}. Original?`, answer: round(orig), xpReward: 20 };
        }
    },

    order_ops: {
        1: () => { const a = randomInt(2, 8), b = randomInt(2, 5), c = randomInt(1, 5); return { problem: `${a} + ${b} × ${c}`, answer: a + (b * c), xpReward: 8 }; },
        2: () => { const a = randomInt(2, 8), b = randomInt(2, 6), c = randomInt(2, 5); return { problem: `${a} × ${b} + ${c}`, answer: (a * b) + c, xpReward: 10 }; },
        3: () => { const a = randomInt(2, 8), b = randomInt(2, 5), c = randomInt(2, 5), d = randomInt(1, 5); return { problem: `${a} + ${b} × ${c} - ${d}`, answer: a + (b * c) - d, xpReward: 15 }; },
        4: () => { const a = randomInt(2, 6), b = randomInt(2, 6), c = randomInt(2, 6); return { problem: `(${a} + ${b}) × ${c}`, answer: (a + b) * c, xpReward: 18 }; }
    },

    // === HIGH SCHOOL ===
    exponents: {
        1: () => { const b = randomInt(2, 5), e = 2; return { problem: `${b}²`, answer: Math.pow(b, e), xpReward: 8 }; },
        2: () => { const b = randomInt(2, 5), e = 3; return { problem: `${b}³`, answer: Math.pow(b, e), xpReward: 10 }; },
        3: () => { const b = randomInt(2, 4), e = randomInt(3, 4); return { problem: `${b}^${e}`, answer: Math.pow(b, e), xpReward: 12 }; },
        4: () => { // Power of power
            const b = randomInt(2, 3), e1 = randomInt(2, 3), e2 = randomInt(2, 3);
            return { problem: `(${b}^${e1})^${e2} = ${b}^?`, answer: e1 * e2, xpReward: 15 };
        },
        5: () => { // Multiply same base
            const b = randomInt(2, 5), e1 = randomInt(2, 4), e2 = randomInt(2, 4);
            return { problem: `${b}^${e1} × ${b}^${e2} = ${b}^?`, answer: e1 + e2, xpReward: 18 };
        }
    },

    roots: {
        1: () => { const sq = randomChoice([4, 9, 16, 25]); return { problem: `√${sq}`, answer: SQRT_MAP[sq], xpReward: 8 }; },
        2: () => { const sq = randomChoice([36, 49, 64, 81]); return { problem: `√${sq}`, answer: SQRT_MAP[sq], xpReward: 10 }; },
        3: () => { const sq = randomChoice([100, 121, 144]); return { problem: `√${sq}`, answer: SQRT_MAP[sq], xpReward: 12 }; },
        4: () => { // √a × √b
            const a = randomChoice([4, 9, 16]), b = randomChoice([4, 9]);
            return { problem: `√${a} × √${b}`, answer: SQRT_MAP[a] * SQRT_MAP[b], xpReward: 15 };
        },
        5: () => { // Simplify √n (not perfect)
            const inner = randomChoice([8, 12, 18, 20, 50]);
            const simplified = { 8: '2√2', 12: '2√3', 18: '3√2', 20: '2√5', 50: '5√2' };
            return { problem: `Simplify √${inner}`, answer: simplified[inner], answerText: simplified[inner], xpReward: 20 };
        }
    },

    algebra: {
        1: () => { // x + a = b
            const a = randomInt(2, 10), b = randomInt(a + 1, 20);
            return { problem: `x + ${a} = ${b}`, answer: b - a, xpReward: 10 };
        },
        2: () => { // ax = b
            const a = randomInt(2, 8), ans = randomInt(2, 10), b = a * ans;
            return { problem: `${a}x = ${b}`, answer: ans, xpReward: 12 };
        },
        3: () => { // ax + b = c
            const a = randomInt(2, 6), ans = randomInt(2, 8), b = randomInt(1, 10), c = a * ans + b;
            return { problem: `${a}x + ${b} = ${c}`, answer: ans, xpReward: 15 };
        },
        4: () => { // ax - b = c
            const a = randomInt(2, 6), ans = randomInt(3, 10), b = randomInt(1, 10), c = a * ans - b;
            return { problem: `${a}x - ${b} = ${c}`, answer: ans, xpReward: 18 };
        },
        5: () => { // ax + b = cx + d
            const a = randomInt(3, 8), c = randomInt(1, a - 1), ans = randomInt(2, 8), b = randomInt(1, 10);
            const d = a * ans + b - c * ans;
            return { problem: `${a}x + ${b} = ${c}x + ${d}`, answer: ans, xpReward: 22 };
        }
    },

    equations: {
        1: () => { // 2x + 3 = 11
            const a = randomInt(2, 5), ans = randomInt(2, 10), b = randomInt(1, 10);
            return { problem: `${a}x + ${b} = ${a * ans + b}`, answer: ans, xpReward: 12 };
        },
        2: () => { // x/a = b
            const a = randomInt(2, 8), b = randomInt(2, 10);
            return { problem: `x ÷ ${a} = ${b}`, answer: a * b, xpReward: 12 };
        },
        3: () => { // (x + a)/b = c
            const b = randomInt(2, 5), c = randomInt(2, 8), a = randomInt(1, 10);
            const ans = b * c - a;
            return { problem: `(x + ${a}) ÷ ${b} = ${c}`, answer: ans, xpReward: 18 };
        },
        4: () => { // ax + by = c, solve for x when y given
            const a = randomInt(2, 5), b = randomInt(2, 5), y = randomInt(1, 5), x = randomInt(2, 8);
            const c = a * x + b * y;
            return { problem: `${a}x + ${b}(${y}) = ${c}, find x`, answer: x, xpReward: 20 };
        },
        5: () => { // System preview: x + y = a, x - y = b
            const x = randomInt(2, 10), y = randomInt(1, x - 1);
            return { problem: `x + y = ${x + y} and x - y = ${x - y}. Find x.`, answer: x, xpReward: 25 };
        }
    },

    // === COLLEGE PREP ===
    quadratics: {
        1: () => { // Factor x² + bx + c (simple)
            const r1 = randomInt(1, 5), r2 = randomInt(1, 5);
            const b = r1 + r2, c = r1 * r2;
            return { problem: `x² + ${b}x + ${c} = 0. Find smaller x.`, answer: -r1, xpReward: 18 };
        },
        2: () => { // Perfect square
            const a = randomInt(2, 6);
            return { problem: `x² = ${a * a}. Find positive x.`, answer: a, xpReward: 15 };
        },
        3: () => { // Vertex form
            const h = randomInt(1, 5), k = randomInt(1, 10);
            return { problem: `y = (x - ${h})² + ${k}. What is the vertex x?`, answer: h, xpReward: 20 };
        },
        4: () => { // Discriminant
            const a = 1, b = randomInt(2, 8), c = randomInt(1, 5);
            const disc = b * b - 4 * a * c;
            return { problem: `x² + ${b}x + ${c} = 0. What is b² - 4ac?`, answer: disc, xpReward: 22 };
        }
    },

    trig: {
        1: () => { // Sin values
            const angle = randomChoice([30, 45, 60]);
            return { problem: `sin(${angle}°) = ?`, answer: SIN_VALUES[angle], xpReward: 15 };
        },
        2: () => { // Cos values
            const angle = randomChoice([30, 45, 60]);
            return { problem: `cos(${angle}°) = ?`, answer: COS_VALUES[angle], xpReward: 15 };
        },
        3: () => { // Tan values
            const angle = randomChoice([30, 45, 60]);
            return { problem: `tan(${angle}°) = ?`, answer: TAN_VALUES[angle], xpReward: 18 };
        },
        4: () => { // Identity
            return { problem: `sin²θ + cos²θ = ?`, answer: 1, xpReward: 20 };
        }
    },

    logarithms: {
        1: () => { // log base 10
            const n = randomChoice([10, 100, 1000]);
            const ans = Math.log10(n);
            return { problem: `log₁₀(${n}) = ?`, answer: ans, xpReward: 15 };
        },
        2: () => { // log base 2
            const exp = randomInt(2, 6), n = Math.pow(2, exp);
            return { problem: `log₂(${n}) = ?`, answer: exp, xpReward: 18 };
        },
        3: () => { // log base b of b^n
            const b = randomInt(2, 5), n = randomInt(2, 4);
            return { problem: `log₍${b}₎(${Math.pow(b, n)}) = ?`, answer: n, xpReward: 20 };
        },
        4: () => { // Product rule
            const a = randomInt(2, 4), b = randomInt(2, 4);
            return { problem: `log(${a}) + log(${b}) = log(?)`, answer: a * b, xpReward: 22 };
        }
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

    // Generate answer options
    const answer = typeof problem.answer === 'number' ? problem.answer : problem.answerNum || 0;
    const options = new Set([problem.answer]);
    const offsets = [1, -1, 2, -2, 5, -5, 10, -10];

    while (options.size < 4) {
        const offset = offsets[Math.floor(Math.random() * offsets.length)];
        let wrong = answer + offset;
        if (typeof problem.answer === 'string' && problem.answerNum) {
            wrong = round(problem.answerNum + offset);
        }
        if (wrong > 0 || skillId === 'algebra') options.add(wrong);
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
// UNLOCKING & DIFFICULTY
// ═══════════════════════════════════════════════════════════════

export const isSkillUnlocked = (skillId, userProgress) => {
    const skill = SKILLS[skillId];
    if (!skill) return false;
    if (!skill.prerequisites || skill.prerequisites.length === 0) return true;

    return skill.prerequisites.every(prereqId => {
        const prereqStats = userProgress.skills?.[prereqId];
        return prereqStats && prereqStats.level >= 2;
    });
};

export const calculateNextDifficulty = (skillStats, recentHistory = [], maxLevel = 5) => {
    const { correct, total, streak, level, xp = 0 } = skillStats;
    const accuracy = total > 0 ? correct / total : 0;
    const nextLevelInfo = LEVELS[level + 1];
    const xpForNextLevel = nextLevelInfo?.xpRequired || Infinity;

    if (accuracy >= 0.9 && streak >= 5 && xp >= xpForNextLevel && level < maxLevel) {
        return { action: 'LEVEL_UP', newLevel: level + 1, reason: '🎉 Level Up!', celebration: true };
    }
    if ((accuracy < 0.5 && total >= 5) || streak <= -4) {
        return { action: 'TEACH', newLevel: level, reason: 'Let me help you!' };
    }
    if (accuracy < 0.65 && level > 1) {
        return { action: 'LEVEL_DOWN', newLevel: level - 1, reason: 'Let\'s reinforce basics.' };
    }
    return { action: 'CONTINUE', newLevel: level, reason: null };
};

export const detectStrugglePatterns = (problemHistory) => {
    if (!problemHistory || problemHistory.length < 5) return [];
    const patterns = [];
    const wrong = problemHistory.filter(p => !p.correct);

    // Group by skill
    const bySkill = {};
    wrong.forEach(p => {
        bySkill[p.skillId] = (bySkill[p.skillId] || 0) + 1;
    });

    const weakest = Object.entries(bySkill).sort((a, b) => b[1] - a[1])[0];
    if (weakest && weakest[1] >= 3) {
        patterns.push({
            type: weakest[0],
            message: `Focus on ${SKILLS[weakest[0]]?.name}!`,
            tip: `You\'ve struggled with ${weakest[1]} ${SKILLS[weakest[0]]?.name} problems recently.`
        });
    }

    return patterns;
};

export const calculateLearningVelocity = (recentHistory) => {
    if (!recentHistory || recentHistory.length < 5) return 0;
    const recent = recentHistory.slice(-20);
    const half = Math.floor(recent.length / 2);
    const first = recent.slice(0, half).filter(p => p.correct).length / half;
    const second = recent.slice(half).filter(p => p.correct).length / (recent.length - half);
    return second - first;
};

// ═══════════════════════════════════════════════════════════════
// TEACHING CONTENT
// ═══════════════════════════════════════════════════════════════

export const TEACHING_CONTENT = {
    addition: { title: "Addition", icon: '➕', steps: [{ text: "Addition combines numbers together.", visual: '2 + 3 = 5' }] },
    subtraction: { title: "Subtraction", icon: '➖', steps: [{ text: "Subtraction takes away.", visual: '5 - 2 = 3' }] },
    multiplication: { title: "Multiplication", icon: '✖️', steps: [{ text: "Multiplication is repeated addition.", visual: '3 × 4 = 12' }] },
    division: { title: "Division", icon: '➗', steps: [{ text: "Division splits into equal groups.", visual: '12 ÷ 3 = 4' }] },
    fractions: { title: "Fractions", icon: '½', steps: [{ text: "Fractions are parts of a whole.", visual: '1/2 = half' }] },
    decimals: { title: "Decimals", icon: '0.5', steps: [{ text: "Decimals are another way to write fractions.", visual: '0.5 = 1/2' }] },
    percentages: { title: "Percentages", icon: '%', steps: [{ text: "Percent means 'out of 100'.", visual: '50% = 50/100 = 0.5' }] },
    order_ops: { title: "PEMDAS", icon: '📐', steps: [{ text: "Order: Parentheses, Exponents, Multiply/Divide, Add/Subtract.", visual: '2 + 3 × 4 = 14' }] },
    exponents: { title: "Exponents", icon: 'x²', steps: [{ text: "An exponent shows how many times to multiply.", visual: '2³ = 2×2×2 = 8' }] },
    roots: { title: "Square Roots", icon: '√', steps: [{ text: "√ finds what number times itself gives you the answer.", visual: '√16 = 4 because 4×4=16' }] },
    algebra: { title: "Algebra", icon: 'x', steps: [{ text: "Solve for the unknown variable.", visual: 'x + 3 = 7 → x = 4' }] },
    equations: { title: "Equations", icon: '=', steps: [{ text: "Both sides must be equal. Undo operations to solve.", visual: '2x + 1 = 7 → x = 3' }] },
    quadratics: { title: "Quadratics", icon: 'x²', steps: [{ text: "Equations with x². Factor or use the formula.", visual: 'x² + 5x + 6 = (x+2)(x+3)' }] },
    trig: { title: "Trigonometry", icon: '∠', steps: [{ text: "SOH-CAH-TOA for right triangles.", visual: 'sin = opposite/hypotenuse' }] },
    logarithms: { title: "Logarithms", icon: 'log', steps: [{ text: "Logs answer: what power gives this number?", visual: 'log₂(8) = 3 because 2³=8' }] }
};

export const getTeachingContent = (skillId, userProgress, patterns = []) => {
    return TEACHING_CONTENT[skillId] || { title: 'Learning', icon: '📚', steps: [{ text: 'Practice makes perfect!' }] };
};

export const generateSessionSummary = (sessionHistory, profile) => {
    if (!sessionHistory?.length) return null;
    const correct = sessionHistory.filter(p => p.correct).length;
    const total = sessionHistory.length;
    return {
        problemsSolved: total,
        correct,
        accuracy: Math.round((correct / total) * 100),
        xpEarned: sessionHistory.filter(p => p.correct).reduce((a, p) => a + (p.xpReward || 5), 0),
        avgTime: Math.round(sessionHistory.reduce((a, p) => a + (p.timeSpent || 0), 0) / total),
        patterns: detectStrugglePatterns(sessionHistory),
        encouragement: correct / total >= 0.8 ? "🌟 Excellent!" : correct / total >= 0.6 ? "👍 Good job!" : "💪 Keep practicing!"
    };
};
