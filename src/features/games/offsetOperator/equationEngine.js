/**
 * equationEngine.js — Dynamic Equation Generator
 * Generates base equations + directional offsets with integer-only answers
 */

const DIFFICULTIES = {
    BEGINNER: 1,      // +/- only
    INTERMEDIATE: 2,  // × and ÷
    EXPERT: 3         // Variable x offset
};

/**
 * Generate a base equation based on difficulty
 * @param {number} level - Difficulty level (1-3)
 * @returns {{ equation: string, answer: number }}
 */
const generateBaseEquation = (level) => {
    let a, b, op, answer;

    if (level === DIFFICULTIES.BEGINNER) {
        op = Math.random() > 0.5 ? '+' : '-';
        a = Math.floor(Math.random() * 15) + 5;  // 5-19
        b = Math.floor(Math.random() * 10) + 1;  // 1-10

        if (op === '-' && b > a) [a, b] = [b, a]; // Ensure positive
        answer = op === '+' ? a + b : a - b;
    } else if (level === DIFFICULTIES.INTERMEDIATE) {
        op = Math.random() > 0.5 ? '×' : '÷';

        if (op === '×') {
            a = Math.floor(Math.random() * 10) + 2;  // 2-11
            b = Math.floor(Math.random() * 10) + 2;  // 2-11
            answer = a * b;
        } else {
            // Ensure clean division
            b = Math.floor(Math.random() * 8) + 2;   // 2-9
            answer = Math.floor(Math.random() * 10) + 2;  // 2-11
            a = b * answer;  // Reverse engineer for clean division
        }
    } else {
        // Expert: Mix of operations
        const ops = ['+', '-', '×'];
        op = ops[Math.floor(Math.random() * ops.length)];

        if (op === '×') {
            a = Math.floor(Math.random() * 12) + 3;
            b = Math.floor(Math.random() * 12) + 3;
            answer = a * b;
        } else {
            a = Math.floor(Math.random() * 30) + 10;
            b = Math.floor(Math.random() * 15) + 5;
            if (op === '-' && b > a) [a, b] = [b, a];
            answer = op === '+' ? a + b : a - b;
        }
    }

    return { equation: `${a} ${op} ${b} = ?`, answer };
};

/**
 * Generate offset rules for available directions
 * @param {string[]} directions - Available movement directions
 * @param {number} level - Difficulty level
 * @param {number} baseAnswer - The base equation answer
 * @returns {{ offsets: Object, options: number[] }}
 */
const generateOffsets = (directions, level, baseAnswer) => {
    const offsets = {};
    const usedResults = new Set();
    usedResults.add(baseAnswer); // Prevent offset that equals base

    // Variable x for expert mode (changes each step)
    const variableX = Math.floor(Math.random() * 5) + 1;

    directions.forEach(dir => {
        let offset, result;
        let attempts = 0;

        do {
            if (level === DIFFICULTIES.BEGINNER) {
                // Simple +/- 1-5
                const sign = Math.random() > 0.5 ? 1 : -1;
                offset = { op: sign > 0 ? '+' : '-', value: Math.floor(Math.random() * 5) + 1 };
                result = sign > 0 ? baseAnswer + offset.value : baseAnswer - offset.value;
            } else if (level === DIFFICULTIES.INTERMEDIATE) {
                // Multipliers ×2, ÷2, +/- larger values
                const opType = Math.random();
                if (opType < 0.3 && baseAnswer % 2 === 0) {
                    offset = { op: '÷', value: 2 };
                    result = baseAnswer / 2;
                } else if (opType < 0.6) {
                    offset = { op: '×', value: 2 };
                    result = baseAnswer * 2;
                } else {
                    const sign = Math.random() > 0.5 ? 1 : -1;
                    offset = { op: sign > 0 ? '+' : '-', value: Math.floor(Math.random() * 10) + 1 };
                    result = sign > 0 ? baseAnswer + offset.value : baseAnswer - offset.value;
                }
            } else {
                // Expert: Variable x
                const ops = ['+', '-', '×'];
                const op = ops[Math.floor(Math.random() * ops.length)];
                offset = { op, value: variableX, isVariable: true };

                if (op === '+') result = baseAnswer + variableX;
                else if (op === '-') result = baseAnswer - variableX;
                else result = baseAnswer * variableX;
            }

            attempts++;
        } while ((usedResults.has(result) || result < 0 || !Number.isInteger(result)) && attempts < 20);

        usedResults.add(result);
        offsets[dir] = { ...offset, result };
    });

    // Generate answer options (all offset results + some decoys)
    const correctAnswers = Object.values(offsets).map(o => o.result);
    const decoys = generateDecoys(correctAnswers, baseAnswer);
    const options = shuffle([...new Set([...correctAnswers, ...decoys])]).slice(0, 6);

    return { offsets, options, variableX: level === DIFFICULTIES.EXPERT ? variableX : null };
};

/**
 * Generate plausible wrong answers
 */
const generateDecoys = (correctAnswers, baseAnswer) => {
    const decoys = [];
    const allCorrect = new Set(correctAnswers);

    // Near-misses
    correctAnswers.forEach(ans => {
        [ans + 1, ans - 1, ans + 2, ans - 2, ans + 5, ans - 5, ans * 2, Math.floor(ans / 2)]
            .filter(d => d >= 0 && Number.isInteger(d) && !allCorrect.has(d))
            .forEach(d => decoys.push(d));
    });

    // Base answer variations
    [baseAnswer + 1, baseAnswer - 1, baseAnswer * 2].forEach(d => {
        if (d >= 0 && !allCorrect.has(d)) decoys.push(d);
    });

    return [...new Set(decoys)];
};

/**
 * Shuffle array
 */
const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

/**
 * Generate complete equation set for a junction
 * @param {string[]} directions - Available directions
 * @param {number} level - Difficulty (1-3)
 * @returns {{ equation, baseAnswer, offsets, options, variableX }}
 */
export const generateEquationSet = (directions, level = DIFFICULTIES.BEGINNER) => {
    const { equation, answer: baseAnswer } = generateBaseEquation(level);
    const { offsets, options, variableX } = generateOffsets(directions, level, baseAnswer);

    return { equation, baseAnswer, offsets, options, variableX };
};

/**
 * Validate player answer for a direction
 * @returns {{ correct: boolean, targetDirection: string|null }}
 */
export const validateAnswer = (selectedAnswer, offsets) => {
    for (const [dir, data] of Object.entries(offsets)) {
        if (data.result === selectedAnswer) {
            return { correct: true, targetDirection: dir };
        }
    }
    return { correct: false, targetDirection: null };
};

/**
 * Format offset for display
 */
export const formatOffset = (offset) => {
    if (offset.isVariable) {
        return `${offset.op}x`;
    }
    return `${offset.op}${offset.value}`;
};

export { DIFFICULTIES };
