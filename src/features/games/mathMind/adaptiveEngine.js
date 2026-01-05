/**
 * adaptiveEngine.js - Advanced AI-Powered Learning Engine v2
 * 
 * ENHANCED FEATURES:
 * - Spaced repetition with forgetting curve
 * - Pattern detection (what types of problems they struggle with)
 * - Learning velocity tracking
 * - Multi-tier hint system
 * - Predictive difficulty adjustment
 * - Session analytics
 */

// ═══════════════════════════════════════════════════════════════
// SKILL TREE - Enhanced with Sub-skills and Patterns
// ═══════════════════════════════════════════════════════════════

export const SKILLS = {
    addition: {
        id: 'addition',
        name: 'Addition',
        icon: '➕',
        color: 'emerald',
        prerequisites: [],
        description: 'Adding numbers together',
        levels: 5,
        subSkills: ['single_digit', 'double_digit', 'carrying', 'multi_addend'],
        teachingConnection: null
    },
    subtraction: {
        id: 'subtraction',
        name: 'Subtraction',
        icon: '➖',
        color: 'blue',
        prerequisites: ['addition'],
        description: 'Taking numbers away',
        levels: 5,
        subSkills: ['basic', 'borrowing', 'multi_step'],
        teachingConnection: 'addition'
    },
    multiplication: {
        id: 'multiplication',
        name: 'Multiplication',
        icon: '✖️',
        color: 'amber',
        prerequisites: ['addition'],
        description: 'Repeated addition',
        levels: 5,
        subSkills: ['times_tables', 'two_digit', 'multi_digit'],
        teachingConnection: 'addition'
    },
    division: {
        id: 'division',
        name: 'Division',
        icon: '➗',
        color: 'purple',
        prerequisites: ['multiplication'],
        description: 'Splitting into equal groups',
        levels: 5,
        subSkills: ['basic_division', 'remainders', 'long_division'],
        teachingConnection: 'multiplication'
    },
    order_ops: {
        id: 'order_ops',
        name: 'Order of Ops',
        icon: '📐',
        color: 'rose',
        prerequisites: ['addition', 'subtraction', 'multiplication', 'division'],
        description: 'PEMDAS - which operation first?',
        levels: 4,
        subSkills: ['two_ops', 'three_ops', 'parentheses'],
        teachingConnection: 'multiplication'
    }
};

export const SKILL_ORDER = ['addition', 'subtraction', 'multiplication', 'division', 'order_ops'];

export const LEVELS = {
    1: { name: 'Beginner', description: 'Single-digit with hints', color: 'emerald', xpRequired: 0 },
    2: { name: 'Learner', description: 'Double-digit basics', color: 'blue', xpRequired: 50 },
    3: { name: 'Skilled', description: 'Larger numbers', color: 'amber', xpRequired: 150 },
    4: { name: 'Expert', description: 'Word problems', color: 'orange', xpRequired: 300 },
    5: { name: 'Master', description: 'Mixed challenges', color: 'purple', xpRequired: 500 }
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
    all_skills: { id: 'all_skills', name: 'Well Rounded', icon: '🎯', desc: 'Try all 5 skills' },
    speed_demon: { id: 'speed_demon', name: 'Speed Demon', icon: '⚡', desc: 'Solve 10 problems under 5 seconds each' },
    perfectionist: { id: 'perfectionist', name: 'Perfectionist', icon: '💎', desc: '20 problems with 100% accuracy' },
    comeback: { id: 'comeback', name: 'Comeback Kid', icon: '🦸', desc: 'Recover from 3 wrong to 5 correct' }
};

// ═══════════════════════════════════════════════════════════════
// SPACED REPETITION ALGORITHM
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate when a skill should be reviewed based on spaced repetition
 * Uses a simplified Leitner system combined with forgetting curve
 */
export const calculateReviewPriority = (skillStats, allSkills) => {
    const now = Date.now();
    const priorities = [];

    Object.entries(allSkills).forEach(([skillId, stats]) => {
        if (!stats || stats.total === 0) return;

        const lastPracticed = stats.lastPracticed || now;
        const hoursSince = (now - lastPracticed) / (1000 * 60 * 60);
        const accuracy = stats.accuracy || 0;

        // Forgetting curve: lower accuracy = faster forgetting
        const forgettingRate = 1 - accuracy; // 0.3 accuracy = 0.7 forgetting rate
        const reviewUrgency = hoursSince * forgettingRate;

        // Weak skills need more attention
        const weaknessBonus = accuracy < 0.6 ? 2 : accuracy < 0.8 ? 1.2 : 1;

        priorities.push({
            skillId,
            priority: reviewUrgency * weaknessBonus,
            reason: accuracy < 0.6 ? 'Needs practice' : hoursSince > 24 ? 'Time for review' : null
        });
    });

    return priorities.sort((a, b) => b.priority - a.priority);
};

/**
 * Detect patterns in user's mistakes
 */
export const detectStrugglePatterns = (problemHistory) => {
    if (!problemHistory || problemHistory.length < 5) return [];

    const patterns = [];
    const wrongProblems = problemHistory.filter(p => !p.correct);

    // Check for carrying/borrowing issues
    const carryingIssues = wrongProblems.filter(p =>
        p.skillId === 'addition' && p.problem?.includes('+') &&
        p.answer > 10 && (p.userAnswer % 10 === p.answer % 10)
    );
    if (carryingIssues.length >= 2) {
        patterns.push({ type: 'carrying', message: "You might be forgetting to carry!", tip: "When digits add up to 10+, carry the 1 to the next column" });
    }

    // Check for times table weaknesses
    const multWrong = wrongProblems.filter(p => p.skillId === 'multiplication');
    const factorCounts = {};
    multWrong.forEach(p => {
        const nums = p.problem?.match(/\d+/g);
        if (nums) nums.forEach(n => factorCounts[n] = (factorCounts[n] || 0) + 1);
    });
    const weakFactor = Object.entries(factorCounts).find(([, count]) => count >= 3);
    if (weakFactor) {
        patterns.push({ type: 'times_table', message: `Practice your ${weakFactor[0]}x times table!`, tip: `Try saying: ${weakFactor[0]}, ${weakFactor[0] * 2}, ${weakFactor[0] * 3}...` });
    }

    // Check for order of operations issues
    const oopWrong = wrongProblems.filter(p => p.skillId === 'order_ops');
    if (oopWrong.length >= 2) {
        patterns.push({ type: 'order_ops', message: "Remember PEMDAS!", tip: "Multiply and divide BEFORE adding and subtracting" });
    }

    return patterns;
};

// ═══════════════════════════════════════════════════════════════
// ADVANCED ADAPTIVE ALGORITHM
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate learning velocity (how fast the student is improving)
 */
export const calculateLearningVelocity = (recentHistory) => {
    if (!recentHistory || recentHistory.length < 5) return 0;

    const recent = recentHistory.slice(-20);
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));

    const firstAccuracy = firstHalf.filter(p => p.correct).length / firstHalf.length;
    const secondAccuracy = secondHalf.filter(p => p.correct).length / secondHalf.length;

    return secondAccuracy - firstAccuracy; // Positive = improving, negative = declining
};

/**
 * Calculate next difficulty with advanced factors
 */
export const calculateNextDifficulty = (skillStats, recentHistory = [], maxLevel = 5) => {
    const { correct, total, streak, level, xp = 0 } = skillStats;
    const accuracy = total > 0 ? correct / total : 0;
    const velocity = calculateLearningVelocity(recentHistory);
    const levelInfo = LEVELS[level] || LEVELS[1];
    const nextLevelInfo = LEVELS[level + 1];

    // XP-based progression
    const xpForNextLevel = nextLevelInfo?.xpRequired || Infinity;

    // Decision tree with multiple factors
    if (accuracy >= 0.9 && streak >= 5 && xp >= xpForNextLevel && level < maxLevel) {
        return {
            action: 'LEVEL_UP',
            newLevel: level + 1,
            reason: '🎉 Amazing! You\'ve mastered this level!',
            celebration: true
        };
    }

    if (accuracy > 0.85 && streak >= 3 && velocity > 0.1) {
        return { action: 'HARDER_PROBLEMS', newLevel: level, reason: 'You\'re on a roll! Let\'s try something harder!' };
    }

    if ((accuracy < 0.5 && total >= 5) || streak <= -4) {
        return {
            action: 'TEACH',
            newLevel: level,
            reason: 'Let me help you understand this better!',
            patterns: detectStrugglePatterns(recentHistory)
        };
    }

    if (accuracy < 0.65 && level > 1 && velocity < -0.1) {
        return { action: 'LEVEL_DOWN', newLevel: level - 1, reason: 'Let\'s strengthen your foundation first.' };
    }

    if (streak >= 3) {
        return { action: 'ENCOURAGE', newLevel: level, reason: `${streak} in a row! Keep going!` };
    }

    return { action: 'CONTINUE', newLevel: level, reason: null };
};

/**
 * Check if skill is unlocked
 */
export const isSkillUnlocked = (skillId, userProgress) => {
    const skill = SKILLS[skillId];
    if (!skill) return false;
    if (skill.prerequisites.length === 0) return true;

    return skill.prerequisites.every(prereqId => {
        const prereqStats = userProgress.skills?.[prereqId];
        return prereqStats && prereqStats.level >= 2;
    });
};

// ═══════════════════════════════════════════════════════════════
// ENHANCED PROBLEM GENERATORS
// ═══════════════════════════════════════════════════════════════

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateHints = (problem, answer, skillId) => {
    const hints = [];

    switch (skillId) {
        case 'addition':
            hints.push({ level: 1, text: 'Start by adding the ones place.' });
            hints.push({ level: 2, text: `The ones place gives you ${answer % 10}.` });
            hints.push({ level: 3, text: `The answer is ${answer}. Here's why...` });
            break;
        case 'subtraction':
            hints.push({ level: 1, text: 'Think: how many do you take away?' });
            hints.push({ level: 2, text: 'Count backwards from the bigger number.' });
            hints.push({ level: 3, text: `The answer is ${answer}.` });
            break;
        case 'multiplication':
            hints.push({ level: 1, text: 'Multiplication is repeated addition!' });
            const nums = problem.match(/\d+/g);
            if (nums && nums.length >= 2) {
                hints.push({ level: 2, text: `Think: ${nums[0]} groups of ${nums[1]}` });
            }
            hints.push({ level: 3, text: `The answer is ${answer}.` });
            break;
        case 'division':
            hints.push({ level: 1, text: 'Division means splitting into equal groups.' });
            hints.push({ level: 2, text: 'Think: what times the divisor equals the dividend?' });
            hints.push({ level: 3, text: `The answer is ${answer}.` });
            break;
        case 'order_ops':
            hints.push({ level: 1, text: 'Remember PEMDAS: Multiply/Divide before Add/Subtract!' });
            hints.push({ level: 2, text: 'Find the multiplication or division first.' });
            hints.push({ level: 3, text: `The answer is ${answer}.` });
            break;
    }

    return hints;
};

const generators = {
    addition: {
        1: () => { // Beginner
            const a = randomInt(1, 9), b = randomInt(1, 9);
            return {
                problem: `${a} + ${b}`,
                answer: a + b,
                visual: `${'●'.repeat(a)} + ${'●'.repeat(b)}`,
                difficulty: 'beginner',
                xpReward: 5
            };
        },
        2: () => { // Learner
            const a = randomInt(10, 30), b = randomInt(5, 20);
            return { problem: `${a} + ${b}`, answer: a + b, xpReward: 8 };
        },
        3: () => { // Skilled (carrying)
            const a = randomInt(25, 75), b = randomInt(15, 50);
            return {
                problem: `${a} + ${b}`,
                answer: a + b,
                subSkill: 'carrying',
                xpReward: 12
            };
        },
        4: () => { // Expert (word problem)
            const a = randomInt(50, 200), b = randomInt(25, 150);
            const templates = [
                `A store has ${a} items. ${b} more arrive. Total?`,
                `You saved $${a} and earned $${b} more. How much now?`,
                `${a} students + ${b} new students = ?`
            ];
            return {
                problem: templates[randomInt(0, 2)],
                equation: `${a} + ${b}`,
                answer: a + b,
                xpReward: 15
            };
        },
        5: () => { // Master (multi-addend)
            const a = randomInt(20, 99), b = randomInt(20, 99), c = randomInt(20, 99);
            return { problem: `${a} + ${b} + ${c}`, answer: a + b + c, xpReward: 20 };
        }
    },

    subtraction: {
        1: () => {
            const b = randomInt(1, 8), a = b + randomInt(1, 8);
            return {
                problem: `${a} - ${b}`,
                answer: a - b,
                visual: `${'●'.repeat(a)} take away ${b}`,
                xpReward: 5
            };
        },
        2: () => {
            const b = randomInt(5, 25), a = b + randomInt(10, 40);
            return { problem: `${a} - ${b}`, answer: a - b, xpReward: 8 };
        },
        3: () => { // Borrowing
            const b = randomInt(15, 45), a = b + randomInt(20, 60);
            return { problem: `${a} - ${b}`, answer: a - b, subSkill: 'borrowing', xpReward: 12 };
        },
        4: () => {
            const b = randomInt(30, 100), a = b + randomInt(50, 200);
            const templates = [
                `You had ${a} coins and spent ${b}. How many left?`,
                `A tank holds ${a} gallons. After using ${b}, how much remains?`
            ];
            return { problem: templates[randomInt(0, 1)], equation: `${a} - ${b}`, answer: a - b, xpReward: 15 };
        },
        5: () => {
            const c = randomInt(10, 30), b = c + randomInt(15, 40), a = b + randomInt(30, 80);
            return { problem: `${a} - ${b} - ${c}`, answer: a - b - c, xpReward: 20 };
        }
    },

    multiplication: {
        1: () => {
            const a = randomInt(2, 5), b = randomInt(2, 5);
            return {
                problem: `${a} × ${b}`,
                answer: a * b,
                visual: `${a} groups of ${b}`,
                xpReward: 5
            };
        },
        2: () => {
            const a = randomInt(3, 9), b = randomInt(3, 9);
            return { problem: `${a} × ${b}`, answer: a * b, xpReward: 8 };
        },
        3: () => {
            const a = randomInt(6, 12), b = randomInt(6, 12);
            return { problem: `${a} × ${b}`, answer: a * b, xpReward: 12 };
        },
        4: () => {
            const a = randomInt(5, 12), b = randomInt(10, 25);
            const templates = [
                `${a} boxes with ${b} items each. How many total?`,
                `${a} rows of ${b} seats. How many seats?`
            ];
            return { problem: templates[randomInt(0, 1)], equation: `${a} × ${b}`, answer: a * b, xpReward: 15 };
        },
        5: () => {
            const a = randomInt(3, 7), b = randomInt(3, 7), c = randomInt(2, 5);
            return { problem: `${a} × ${b} × ${c}`, answer: a * b * c, xpReward: 20 };
        }
    },

    division: {
        1: () => {
            const b = randomInt(2, 5), answer = randomInt(2, 5), a = b * answer;
            return {
                problem: `${a} ÷ ${b}`,
                answer,
                visual: `Split ${a} into ${b} equal groups`,
                xpReward: 5
            };
        },
        2: () => {
            const b = randomInt(2, 9), answer = randomInt(2, 9), a = b * answer;
            return { problem: `${a} ÷ ${b}`, answer, xpReward: 8 };
        },
        3: () => {
            const b = randomInt(4, 12), answer = randomInt(5, 12), a = b * answer;
            return { problem: `${a} ÷ ${b}`, answer, xpReward: 12 };
        },
        4: () => {
            const b = randomInt(5, 12), answer = randomInt(6, 15), a = b * answer;
            const templates = [
                `${a} cookies shared among ${b} friends. How many each?`,
                `${a} miles in ${b} hours. What's the speed?`
            ];
            return { problem: templates[randomInt(0, 1)], equation: `${a} ÷ ${b}`, answer, xpReward: 15 };
        },
        5: () => {
            const c = randomInt(2, 4), b = randomInt(2, 4), answer = randomInt(3, 8), a = answer * b * c;
            return { problem: `${a} ÷ ${b} ÷ ${c}`, answer, xpReward: 20 };
        }
    },

    order_ops: {
        1: () => {
            const a = randomInt(2, 8), b = randomInt(2, 5), c = randomInt(1, 5);
            return {
                problem: `${a} + ${b} × ${c}`,
                answer: a + (b * c),
                hint: 'Multiply first!',
                xpReward: 8
            };
        },
        2: () => {
            const a = randomInt(3, 10), b = randomInt(2, 6), c = randomInt(2, 8);
            const templates = [
                { p: `${a} × ${b} + ${c}`, ans: (a * b) + c },
                { p: `${a} + ${b} × ${c}`, ans: a + (b * c) },
                { p: `${a * b} ÷ ${a} - ${c}`, ans: b - c }
            ];
            const t = templates[randomInt(0, 2)];
            return { problem: t.p, answer: t.ans, xpReward: 12 };
        },
        3: () => {
            const a = randomInt(2, 8), b = randomInt(2, 5), c = randomInt(2, 5), d = randomInt(1, 5);
            return { problem: `${a} + ${b} × ${c} - ${d}`, answer: a + (b * c) - d, xpReward: 15 };
        },
        4: () => {
            const a = randomInt(2, 6), b = randomInt(2, 6), c = randomInt(2, 6);
            return { problem: `(${a} + ${b}) × ${c}`, answer: (a + b) * c, xpReward: 20 };
        }
    }
};

/**
 * Generate a problem with full metadata
 */
export const generateProblem = (skillId, level, recentHistory = []) => {
    const generator = generators[skillId]?.[level] || generators[skillId]?.[1];
    if (!generator) return null;

    const problem = generator();
    const hints = generateHints(problem.problem, problem.answer, skillId);

    // Generate smart answer options
    const options = new Set([problem.answer]);
    const offsets = [1, -1, 2, -2, 5, -5, 10, -10, 11, -11];

    // Add common mistake answers
    if (skillId === 'order_ops') {
        // Wrong answer if they do operations left-to-right
        const nums = problem.problem.match(/\d+/g)?.map(Number);
        if (nums && nums.length >= 3) {
            options.add(eval(nums.join('+'))); // Common mistake
        }
    }

    while (options.size < 4) {
        const offset = offsets[Math.floor(Math.random() * offsets.length)];
        const wrong = problem.answer + offset;
        if (wrong > 0 && wrong !== problem.answer) options.add(wrong);
    }

    return {
        ...problem,
        options: [...options].sort(() => Math.random() - 0.5),
        hints,
        skillId,
        level,
        timestamp: Date.now()
    };
};

// ═══════════════════════════════════════════════════════════════
// TEACHING CONTENT (Enhanced)
// ═══════════════════════════════════════════════════════════════

export const TEACHING_CONTENT = {
    addition: {
        title: "Let's Master Addition!",
        icon: '➕',
        mascot: '🤖',
        steps: [
            { text: "Addition means combining groups together.", visual: '🔵🔵 + 🔵🔵🔵', animation: 'merge' },
            { text: "Count all the items: 2 + 3 = 5", visual: '🔵🔵🔵🔵🔵', animation: 'count' },
            { text: "For bigger numbers, add from right to left!", visual: '23 + 45', animation: 'columns' },
            { text: "When digits add to 10+, carry the 1!", visual: '18 + 7 = 25', animation: 'carry' }
        ],
        connection: null,
        practiceNow: { problem: '7 + 8', answer: 15 }
    },
    subtraction: {
        title: "Subtraction Made Easy!",
        icon: '➖',
        mascot: '🤖',
        steps: [
            { text: "Subtraction means taking away.", visual: '🔵🔵🔵🔵🔵 - 🔵🔵', animation: 'remove' },
            { text: "Remove the items: 5 - 2 = 3", visual: '🔵🔵🔵', animation: 'count' },
            { text: "It's the OPPOSITE of addition!", visual: '5 + 2 = 7 ↔ 7 - 2 = 5', animation: 'flip' },
            { text: "When you can't subtract, borrow from the left!", visual: '42 - 7', animation: 'borrow' }
        ],
        connection: { skill: 'addition', message: "If you know addition, subtraction is just the reverse!" }
    },
    multiplication: {
        title: "Multiplication Power!",
        icon: '✖️',
        mascot: '🤖',
        steps: [
            { text: "Multiplication is REPEATED ADDITION.", visual: null, animation: 'pop' },
            { text: "3 × 4 means: 4 + 4 + 4", visual: '🔵🔵🔵🔵  🔵🔵🔵🔵  🔵🔵🔵🔵', animation: 'groups' },
            { text: "Count them all: 12!", visual: '= 12', animation: 'sum' },
            { text: "Tip: 7 × 8 = 56 (5, 6, 7, 8 → 56!)", visual: '7 × 8 = 56', animation: 'trick' }
        ],
        connection: { skill: 'addition', message: "It's just adding the same number multiple times!" }
    },
    division: {
        title: "Division Decoded!",
        icon: '➗',
        mascot: '🤖',
        steps: [
            { text: "Division splits into EQUAL groups.", visual: null, animation: 'pop' },
            { text: "12 ÷ 3 = Split 12 into 3 groups", visual: '🔵🔵🔵🔵 | 🔵🔵🔵🔵 | 🔵🔵🔵🔵', animation: 'split' },
            { text: "Each group has 4! Answer: 4", visual: '= 4', animation: 'count' },
            { text: "Think backwards: 3 × ? = 12", visual: '3 × 4 = 12 → 12 ÷ 3 = 4', animation: 'reverse' }
        ],
        connection: { skill: 'multiplication', message: "If 3 × 4 = 12, then 12 ÷ 3 = 4!" }
    },
    order_ops: {
        title: "PEMDAS Power!",
        icon: '📐',
        mascot: '🤖',
        steps: [
            { text: "Order matters! Follow PEMDAS:", visual: null, animation: 'pop' },
            { text: "P-Parentheses, E-Exponents, M-Multiply, D-Divide, A-Add, S-Subtract", visual: '🔵→🟡→🟢', animation: 'sequence' },
            { text: "2 + 3 × 4 = 2 + 12 = 14", visual: '(multiply first!)', animation: 'highlight' },
            { text: "NOT 2 + 3 = 5, then × 4 = 20 ❌", visual: 'Common mistake!', animation: 'shake' }
        ],
        connection: { skill: 'multiplication', message: "You already know how to multiply - just remember to do it FIRST!" }
    }
};

export const getTeachingContent = (skillId, userProgress, patterns = []) => {
    const content = TEACHING_CONTENT[skillId];
    if (!content) return null;

    // Add pattern-specific advice
    const advice = patterns.map(p => p.tip).filter(Boolean);

    return {
        ...content,
        personalAdvice: advice,
        personalMessage: content.connection?.skill
            ? `You've practiced ${SKILLS[content.connection.skill]?.name}! ${content.connection.message}`
            : null
    };
};

// ═══════════════════════════════════════════════════════════════
// SESSION ANALYTICS
// ═══════════════════════════════════════════════════════════════

export const generateSessionSummary = (sessionHistory, profile) => {
    if (!sessionHistory || sessionHistory.length === 0) return null;

    const correct = sessionHistory.filter(p => p.correct).length;
    const total = sessionHistory.length;
    const accuracy = Math.round((correct / total) * 100);

    const avgTime = Math.round(sessionHistory.reduce((a, p) => a + (p.timeSpent || 0), 0) / total);
    const xpEarned = sessionHistory.filter(p => p.correct).reduce((a, p) => a + (p.xpReward || 5), 0);

    const skillBreakdown = {};
    sessionHistory.forEach(p => {
        if (!skillBreakdown[p.skillId]) {
            skillBreakdown[p.skillId] = { correct: 0, total: 0 };
        }
        skillBreakdown[p.skillId].total++;
        if (p.correct) skillBreakdown[p.skillId].correct++;
    });

    const bestSkill = Object.entries(skillBreakdown)
        .map(([id, s]) => ({ id, accuracy: s.correct / s.total }))
        .sort((a, b) => b.accuracy - a.accuracy)[0];

    const patterns = detectStrugglePatterns(sessionHistory);

    return {
        problemsSolved: total,
        correct,
        accuracy,
        avgTime,
        xpEarned,
        skillBreakdown,
        bestSkill: bestSkill?.id,
        patterns,
        encouragement: accuracy >= 90 ? "🌟 Outstanding work!" :
            accuracy >= 75 ? "💪 Great progress!" :
                accuracy >= 60 ? "👍 Keep practicing!" :
                    "🌱 Every mistake is a learning opportunity!"
    };
};
