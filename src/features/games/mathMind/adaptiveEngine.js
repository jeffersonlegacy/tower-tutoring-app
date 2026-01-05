/**
 * adaptiveEngine.js - AI-Powered Adaptive Learning Engine
 * 
 * Core algorithms for:
 * - Skill tree with prerequisites
 * - Difficulty adjustment based on ZPD (Zone of Proximal Development)
 * - Problem generation per skill/level
 * - Teaching content generation
 */

// ═══════════════════════════════════════════════════════════════
// SKILL TREE - Prerequisites and Connections
// ═══════════════════════════════════════════════════════════════

export const SKILLS = {
    addition: {
        id: 'addition',
        name: 'Addition',
        icon: '➕',
        prerequisites: [],
        description: 'Adding numbers together',
        levels: 4,
        teachingConnection: null
    },
    subtraction: {
        id: 'subtraction',
        name: 'Subtraction',
        icon: '➖',
        prerequisites: ['addition'],
        description: 'Taking numbers away',
        levels: 4,
        teachingConnection: 'addition' // "Subtraction is the opposite of addition!"
    },
    multiplication: {
        id: 'multiplication',
        name: 'Multiplication',
        icon: '✖️',
        prerequisites: ['addition'],
        description: 'Repeated addition',
        levels: 4,
        teachingConnection: 'addition' // "3 × 4 is the same as 3 + 3 + 3 + 3!"
    },
    division: {
        id: 'division',
        name: 'Division',
        icon: '➗',
        prerequisites: ['multiplication'],
        description: 'Splitting into equal groups',
        levels: 4,
        teachingConnection: 'multiplication' // "Division is the opposite of multiplication!"
    },
    order_ops: {
        id: 'order_ops',
        name: 'Order of Operations',
        icon: '📐',
        prerequisites: ['addition', 'subtraction', 'multiplication', 'division'],
        description: 'PEMDAS - which operation first?',
        levels: 3,
        teachingConnection: 'multiplication' // "Always multiply/divide before add/subtract!"
    }
};

export const SKILL_ORDER = ['addition', 'subtraction', 'multiplication', 'division', 'order_ops'];

// ═══════════════════════════════════════════════════════════════
// DIFFICULTY LEVELS
// ═══════════════════════════════════════════════════════════════

export const LEVELS = {
    1: { name: 'Intro', description: 'Single-digit, visual hints', color: 'emerald' },
    2: { name: 'Practice', description: 'Double-digit, no hints', color: 'blue' },
    3: { name: 'Challenge', description: 'Larger numbers, word problems', color: 'amber' },
    4: { name: 'Mastery', description: 'Mixed with other skills', color: 'purple' }
};

// ═══════════════════════════════════════════════════════════════
// ADAPTIVE ALGORITHM
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate next difficulty based on performance
 * Uses ZPD theory: keep student challenged but not frustrated
 */
export const calculateNextDifficulty = (skillStats, maxLevel = 4) => {
    const { correct, total, streak, level } = skillStats;
    const accuracy = total > 0 ? correct / total : 0;
    
    // Decision rules (based on research)
    if (accuracy > 0.85 && streak >= 3 && level < maxLevel) {
        return { action: 'INCREASE', newLevel: level + 1, reason: 'Great job! Ready for harder problems!' };
    }
    
    if ((accuracy < 0.6 && total >= 3) || streak < -2) { // streak < -2 means 3+ wrong in a row
        return { action: 'TEACH', newLevel: level, reason: 'Let me help you understand this better!' };
    }
    
    if (accuracy < 0.7 && level > 1) {
        return { action: 'DECREASE', newLevel: level - 1, reason: 'Let\'s practice a bit more at an easier level.' };
    }
    
    return { action: 'STAY', newLevel: level, reason: null };
};

/**
 * Check if a skill is unlocked based on prerequisites
 */
export const isSkillUnlocked = (skillId, userProgress) => {
    const skill = SKILLS[skillId];
    if (!skill) return false;
    if (skill.prerequisites.length === 0) return true;
    
    return skill.prerequisites.every(prereqId => {
        const prereqStats = userProgress.skills?.[prereqId];
        return prereqStats && prereqStats.level >= 2 && prereqStats.accuracy >= 0.7;
    });
};

// ═══════════════════════════════════════════════════════════════
// PROBLEM GENERATORS
// ═══════════════════════════════════════════════════════════════

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generators = {
    addition: {
        1: () => { // Intro: single digit
            const a = randomInt(1, 9), b = randomInt(1, 9);
            return { problem: `${a} + ${b}`, answer: a + b, visual: `${'●'.repeat(a)} + ${'●'.repeat(b)}` };
        },
        2: () => { // Practice: double digit
            const a = randomInt(10, 50), b = randomInt(5, 30);
            return { problem: `${a} + ${b}`, answer: a + b };
        },
        3: () => { // Challenge: larger + word problem
            const a = randomInt(50, 200), b = randomInt(25, 150);
            const contexts = [
                `You have ${a} coins and find ${b} more. How many total?`,
                `A store has ${a} apples and receives ${b} more. How many now?`
            ];
            return { problem: contexts[randomInt(0, 1)], answer: a + b, equation: `${a} + ${b}` };
        },
        4: () => { // Mastery: multi-addend
            const a = randomInt(10, 99), b = randomInt(10, 99), c = randomInt(10, 99);
            return { problem: `${a} + ${b} + ${c}`, answer: a + b + c };
        }
    },
    
    subtraction: {
        1: () => {
            const b = randomInt(1, 9), a = b + randomInt(1, 9);
            return { problem: `${a} - ${b}`, answer: a - b, visual: `${'●'.repeat(a)} - ${'●'.repeat(b)}` };
        },
        2: () => {
            const b = randomInt(5, 30), a = b + randomInt(10, 50);
            return { problem: `${a} - ${b}`, answer: a - b };
        },
        3: () => {
            const b = randomInt(25, 100), a = b + randomInt(50, 150);
            const contexts = [
                `You have ${a} points and lose ${b}. How many left?`,
                `A tank has ${a} gallons. After using ${b}, how many remain?`
            ];
            return { problem: contexts[randomInt(0, 1)], answer: a - b, equation: `${a} - ${b}` };
        },
        4: () => {
            const c = randomInt(10, 50), b = c + randomInt(10, 50), a = b + randomInt(20, 100);
            return { problem: `${a} - ${b} - ${c}`, answer: a - b - c };
        }
    },
    
    multiplication: {
        1: () => {
            const a = randomInt(2, 5), b = randomInt(2, 5);
            return { 
                problem: `${a} × ${b}`, 
                answer: a * b, 
                visual: `${a} groups of ${b} = ${'●'.repeat(b).split('').join(' ')} `.repeat(a).trim()
            };
        },
        2: () => {
            const a = randomInt(2, 10), b = randomInt(2, 10);
            return { problem: `${a} × ${b}`, answer: a * b };
        },
        3: () => {
            const a = randomInt(5, 12), b = randomInt(10, 25);
            const contexts = [
                `Each box has ${b} items. With ${a} boxes, how many items total?`,
                `If each row has ${b} seats and there are ${a} rows, how many seats?`
            ];
            return { problem: contexts[randomInt(0, 1)], answer: a * b, equation: `${a} × ${b}` };
        },
        4: () => {
            const a = randomInt(2, 6), b = randomInt(2, 6), c = randomInt(2, 5);
            return { problem: `${a} × ${b} × ${c}`, answer: a * b * c };
        }
    },
    
    division: {
        1: () => {
            const b = randomInt(2, 5), answer = randomInt(2, 5), a = b * answer;
            return { 
                problem: `${a} ÷ ${b}`, 
                answer,
                visual: `Split ${a} into ${b} equal groups`
            };
        },
        2: () => {
            const b = randomInt(2, 10), answer = randomInt(2, 10), a = b * answer;
            return { problem: `${a} ÷ ${b}`, answer };
        },
        3: () => {
            const b = randomInt(3, 12), answer = randomInt(5, 15), a = b * answer;
            const contexts = [
                `${a} cookies shared equally among ${b} friends. How many each?`,
                `${a} miles traveled in ${b} hours. What's the speed per hour?`
            ];
            return { problem: contexts[randomInt(0, 1)], answer, equation: `${a} ÷ ${b}` };
        },
        4: () => {
            const c = randomInt(2, 4), b = randomInt(2, 4), answer = randomInt(2, 5);
            const a = answer * b * c;
            return { problem: `${a} ÷ ${b} ÷ ${c}`, answer };
        }
    },
    
    order_ops: {
        1: () => {
            const a = randomInt(2, 8), b = randomInt(2, 5), c = randomInt(1, 5);
            return { 
                problem: `${a} + ${b} × ${c}`, 
                answer: a + (b * c),
                hint: 'Multiply first, then add!'
            };
        },
        2: () => {
            const a = randomInt(2, 10), b = randomInt(2, 8), c = randomInt(2, 8);
            const ops = [
                { p: `${a} × ${b} + ${c}`, ans: (a * b) + c },
                { p: `${a} + ${b} × ${c}`, ans: a + (b * c) },
                { p: `${a * b} ÷ ${a} - ${c}`, ans: b - c }
            ];
            const chosen = ops[randomInt(0, 2)];
            return { problem: chosen.p, answer: chosen.ans };
        },
        3: () => {
            const a = randomInt(2, 10), b = randomInt(2, 5), c = randomInt(2, 5), d = randomInt(1, 5);
            return { 
                problem: `${a} + ${b} × ${c} - ${d}`, 
                answer: a + (b * c) - d 
            };
        }
    }
};

/**
 * Generate a problem for a specific skill and level
 */
export const generateProblem = (skillId, level) => {
    const generator = generators[skillId]?.[level] || generators[skillId]?.[1];
    if (!generator) return null;
    
    const problem = generator();
    
    // Generate answer options (4 choices)
    const options = new Set([problem.answer]);
    const offsets = [1, -1, 2, -2, 5, -5, 10, -10];
    while (options.size < 4) {
        const offset = offsets[Math.floor(Math.random() * offsets.length)];
        const wrong = problem.answer + offset;
        if (wrong > 0) options.add(wrong);
    }
    
    return {
        ...problem,
        options: [...options].sort(() => Math.random() - 0.5),
        skillId,
        level
    };
};

// ═══════════════════════════════════════════════════════════════
// TEACHING CONTENT
// ═══════════════════════════════════════════════════════════════

export const TEACHING_CONTENT = {
    addition: {
        title: "Let's Learn Addition!",
        icon: '➕',
        steps: [
            { text: "Addition means combining groups together.", visual: '🔵🔵 + 🔵🔵🔵 = ?' },
            { text: "Count all the items: 2 + 3 = 5", visual: '🔵🔵🔵🔵🔵' },
            { text: "Think of it as 'putting together'!", visual: null }
        ],
        connection: null
    },
    subtraction: {
        title: "Let's Learn Subtraction!",
        icon: '➖',
        steps: [
            { text: "Subtraction means taking away.", visual: '🔵🔵🔵🔵🔵 - 🔵🔵 = ?' },
            { text: "Remove the items: 5 - 2 = 3", visual: '🔵🔵🔵' },
            { text: "It's the OPPOSITE of addition!", visual: null }
        ],
        connection: { skill: 'addition', message: "Remember how addition puts things together? Subtraction takes them apart!" }
    },
    multiplication: {
        title: "Let's Learn Multiplication!",
        icon: '✖️',
        steps: [
            { text: "Multiplication is REPEATED ADDITION.", visual: null },
            { text: "3 × 4 means: 4 + 4 + 4 (three 4s)", visual: '🔵🔵🔵🔵  🔵🔵🔵🔵  🔵🔵🔵🔵' },
            { text: "Count them all: 12!", visual: null }
        ],
        connection: { skill: 'addition', message: "It's just adding the same number multiple times!" }
    },
    division: {
        title: "Let's Learn Division!",
        icon: '➗',
        steps: [
            { text: "Division means splitting into EQUAL groups.", visual: null },
            { text: "12 ÷ 3 means: Split 12 into 3 equal groups", visual: '🔵🔵🔵🔵 | 🔵🔵🔵🔵 | 🔵🔵🔵🔵' },
            { text: "Each group has 4! Answer: 4", visual: null }
        ],
        connection: { skill: 'multiplication', message: "Division is the OPPOSITE of multiplication! If 3 × 4 = 12, then 12 ÷ 3 = 4" }
    },
    order_ops: {
        title: "Order of Operations!",
        icon: '📐',
        steps: [
            { text: "When you see multiple operations, do them in order:", visual: null },
            { text: "PEMDAS: Parentheses, Exponents, Multiply/Divide, Add/Subtract", visual: null },
            { text: "Example: 2 + 3 × 4 = 2 + 12 = 14 (multiply first!)", visual: null }
        ],
        connection: { skill: 'multiplication', message: "You already know how to multiply! Just remember to do it BEFORE adding." }
    }
};

/**
 * Get teaching content with prior knowledge connection
 */
export const getTeachingContent = (skillId, userProgress) => {
    const content = TEACHING_CONTENT[skillId];
    if (!content) return null;
    
    // Add personalized connection message if they've done the prerequisite
    if (content.connection) {
        const prereqStats = userProgress.skills?.[content.connection.skill];
        if (prereqStats && prereqStats.total > 5) {
            return {
                ...content,
                personalMessage: `You've already mastered ${SKILLS[content.connection.skill]?.name}! ${content.connection.message}`
            };
        }
    }
    
    return content;
};
