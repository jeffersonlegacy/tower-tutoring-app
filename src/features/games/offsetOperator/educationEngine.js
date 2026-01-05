/**
 * educationEngine.js - Skill-Based Math Problem Generator
 * Features: Progressive skill tree, worked examples, hints, mastery tracking
 */

// ============ SKILL DEFINITIONS ============
export const SKILLS = {
    ADD_SINGLE: {
        id: 'add_single',
        name: 'Single-Digit Addition',
        icon: '➕',
        level: 1,
        description: 'Add numbers from 1-9',
        example: { problem: '5 + 3 = ?', answer: 8, steps: ['5 + 3 = 8'] }
    },
    ADD_DOUBLE: {
        id: 'add_double',
        name: 'Double-Digit Addition',
        icon: '➕',
        level: 2,
        description: 'Add larger numbers up to 99',
        example: {
            problem: '27 + 15 = ?',
            answer: 42,
            steps: ['Add ones: 7 + 5 = 12 (carry the 1)', 'Add tens: 2 + 1 + 1 = 4', 'Answer: 42']
        }
    },
    SUB_BASIC: {
        id: 'sub_basic',
        name: 'Subtraction',
        icon: '➖',
        level: 3,
        description: 'Subtract numbers',
        example: {
            problem: '25 - 8 = ?',
            answer: 17,
            steps: ['Start with 25', 'Take away 8', '25 - 8 = 17']
        }
    },
    FIND_MISSING: {
        id: 'find_missing',
        name: 'Find the Missing Number',
        icon: '❓',
        level: 4,
        description: 'Solve equations like 12 + ? = 20',
        example: {
            problem: '12 + ? = 20',
            answer: 8,
            steps: ['We need: 12 + ? = 20', 'Subtract 12 from both sides', '? = 20 - 12 = 8']
        }
    },
    MULT_TABLES: {
        id: 'mult_tables',
        name: 'Multiplication Tables',
        icon: '✖️',
        level: 5,
        description: 'Times tables up to 12',
        example: {
            problem: '7 × 8 = ?',
            answer: 56,
            steps: ['7 groups of 8', '7 × 8 = 56']
        }
    },
    DIV_BASIC: {
        id: 'div_basic',
        name: 'Division',
        icon: '➗',
        level: 6,
        description: 'Divide numbers evenly',
        example: {
            problem: '56 ÷ 8 = ?',
            answer: 7,
            steps: ['How many 8s fit in 56?', '8 × 7 = 56', 'So 56 ÷ 8 = 7']
        }
    },
    ORDER_OPS: {
        id: 'order_ops',
        name: 'Order of Operations',
        icon: '📐',
        level: 7,
        description: 'PEMDAS: Multiply/divide before add/subtract',
        example: {
            problem: '3 + 4 × 2 = ?',
            answer: 11,
            steps: ['Remember: Multiply first!', '4 × 2 = 8', 'Then add: 3 + 8 = 11']
        }
    },
    SOLVE_X: {
        id: 'solve_x',
        name: 'Solve for X',
        icon: '🔢',
        level: 8,
        description: 'Find the value of x',
        example: {
            problem: 'x + 7 = 15',
            answer: 8,
            steps: ['x + 7 = 15', 'Subtract 7 from both sides', 'x = 15 - 7 = 8']
        }
    }
};

// ============ PROBLEM GENERATORS ============
const generators = {
    add_single: () => {
        const a = Math.floor(Math.random() * 9) + 1;
        const b = Math.floor(Math.random() * 9) + 1;
        return { problem: `${a} + ${b}`, answer: a + b, steps: [`${a} + ${b} = ${a + b}`] };
    },

    add_double: () => {
        const a = Math.floor(Math.random() * 50) + 10;
        const b = Math.floor(Math.random() * 40) + 5;
        const answer = a + b;
        return {
            problem: `${a} + ${b}`,
            answer,
            steps: [
                `Add ones: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}`,
                `Add tens: ${Math.floor(a / 10)} + ${Math.floor(b / 10)} = ${Math.floor(a / 10) + Math.floor(b / 10)}`,
                `${a} + ${b} = ${answer}`
            ]
        };
    },

    sub_basic: () => {
        const answer = Math.floor(Math.random() * 30) + 5;
        const b = Math.floor(Math.random() * 15) + 3;
        const a = answer + b;
        return {
            problem: `${a} - ${b}`,
            answer,
            steps: [`Start with ${a}`, `Take away ${b}`, `${a} - ${b} = ${answer}`]
        };
    },

    find_missing: () => {
        const answer = Math.floor(Math.random() * 15) + 3;
        const a = Math.floor(Math.random() * 20) + 5;
        const total = a + answer;
        const isAddition = Math.random() > 0.5;

        if (isAddition) {
            return {
                problem: `${a} + ? = ${total}`,
                answer,
                steps: [`We need: ${a} + ? = ${total}`, `Subtract ${a} from ${total}`, `? = ${total} - ${a} = ${answer}`]
            };
        } else {
            return {
                problem: `? - ${a} = ${answer}`,
                answer: a + answer,
                steps: [`We need: ? - ${a} = ${answer}`, `Add ${a} to ${answer}`, `? = ${answer} + ${a} = ${a + answer}`]
            };
        }
    },

    mult_tables: () => {
        const a = Math.floor(Math.random() * 10) + 2;
        const b = Math.floor(Math.random() * 10) + 2;
        return {
            problem: `${a} × ${b}`,
            answer: a * b,
            steps: [`${a} groups of ${b}`, `${a} × ${b} = ${a * b}`]
        };
    },

    div_basic: () => {
        const b = Math.floor(Math.random() * 10) + 2;
        const answer = Math.floor(Math.random() * 10) + 2;
        const a = b * answer;
        return {
            problem: `${a} ÷ ${b}`,
            answer,
            steps: [`How many ${b}s fit in ${a}?`, `${b} × ${answer} = ${a}`, `So ${a} ÷ ${b} = ${answer}`]
        };
    },

    order_ops: () => {
        const a = Math.floor(Math.random() * 8) + 2;
        const b = Math.floor(Math.random() * 8) + 2;
        const c = Math.floor(Math.random() * 8) + 2;
        const ops = [
            { problem: `${a} + ${b} × ${c}`, answer: a + (b * c), steps: [`Multiply first: ${b} × ${c} = ${b * c}`, `Then add: ${a} + ${b * c} = ${a + (b * c)}`] },
            { problem: `${a} × ${b} + ${c}`, answer: (a * b) + c, steps: [`Multiply first: ${a} × ${b} = ${a * b}`, `Then add: ${a * b} + ${c} = ${(a * b) + c}`] },
            { problem: `${a * c} ÷ ${c} + ${b}`, answer: a + b, steps: [`Divide first: ${a * c} ÷ ${c} = ${a}`, `Then add: ${a} + ${b} = ${a + b}`] }
        ];
        return ops[Math.floor(Math.random() * ops.length)];
    },

    solve_x: () => {
        const answer = Math.floor(Math.random() * 15) + 2;
        const b = Math.floor(Math.random() * 10) + 2;
        const ops = [
            {
                problem: `x + ${b} = ${answer + b}`,
                answer,
                steps: [`x + ${b} = ${answer + b}`, `Subtract ${b} from both sides`, `x = ${answer + b} - ${b} = ${answer}`]
            },
            {
                problem: `x - ${b} = ${answer}`,
                answer: answer + b,
                steps: [`x - ${b} = ${answer}`, `Add ${b} to both sides`, `x = ${answer} + ${b} = ${answer + b}`]
            },
            {
                problem: `${b}x = ${b * answer}`,
                answer,
                steps: [`${b}x = ${b * answer}`, `Divide both sides by ${b}`, `x = ${b * answer} ÷ ${b} = ${answer}`]
            }
        ];
        return ops[Math.floor(Math.random() * ops.length)];
    }
};

// ============ GENERATE OPTIONS (with plausible wrong answers) ============
const generateOptions = (correctAnswer, skillId) => {
    const options = new Set([correctAnswer]);

    // Near misses
    [1, -1, 2, -2, 10, -10].forEach(offset => {
        const val = correctAnswer + offset;
        if (val > 0 && val !== correctAnswer) options.add(val);
    });

    // Common mistakes
    if (skillId === 'order_ops') {
        // Wrong order mistake
        options.add(correctAnswer + Math.floor(Math.random() * 5) - 2);
    }

    // Fill remaining with random plausible values
    while (options.size < 4) {
        const rand = correctAnswer + Math.floor(Math.random() * 20) - 10;
        if (rand > 0 && rand !== correctAnswer) options.add(rand);
    }

    return shuffle([...options].slice(0, 4));
};

const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

// ============ MAIN API ============
export const generateProblem = (skillId) => {
    const generator = generators[skillId];
    if (!generator) throw new Error(`Unknown skill: ${skillId}`);

    const { problem, answer, steps } = generator();
    const options = generateOptions(answer, skillId);

    return { problem: `${problem} = ?`, answer, steps, options };
};

export const getWorkedExample = (skillId) => {
    const skill = Object.values(SKILLS).find(s => s.id === skillId);
    return skill?.example || null;
};

// ============ HINT SYSTEM ============
export const getHint = (skillId, level, problem) => {
    const skill = Object.values(SKILLS).find(s => s.id === skillId);
    if (!skill) return null;

    switch (level) {
        case 1:
            return { type: 'concept', text: skill.description };
        case 2:
            return { type: 'step', text: problem.steps[0] };
        case 3:
            return { type: 'solution', text: problem.steps.join(' → '), answer: problem.answer };
        default:
            return null;
    }
};

// ============ MASTERY TRACKING ============
const STORAGE_KEY = 'equation_explorer_mastery';

export const getMastery = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
};

export const updateMastery = (skillId, isCorrect) => {
    const mastery = getMastery();

    if (!mastery[skillId]) {
        mastery[skillId] = { correct: 0, total: 0, streak: 0, mastered: false };
    }

    mastery[skillId].total++;
    if (isCorrect) {
        mastery[skillId].correct++;
        mastery[skillId].streak++;
    } else {
        mastery[skillId].streak = 0;
    }

    // Mastery check: 90%+ accuracy on 10+ problems
    const accuracy = mastery[skillId].correct / mastery[skillId].total;
    if (mastery[skillId].total >= 10 && accuracy >= 0.9) {
        mastery[skillId].mastered = true;
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mastery));
    } catch { }

    return mastery[skillId];
};

export const getSkillList = () => {
    const mastery = getMastery();
    return Object.values(SKILLS).map(skill => ({
        ...skill,
        mastery: mastery[skill.id] || { correct: 0, total: 0, streak: 0, mastered: false }
    }));
};

export const resetMastery = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch { }
};
