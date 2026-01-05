/**
 * adaptiveEngine.js - Math Skills Camp v5
 * 
 * CALIFORNIA COMMON CORE STATE STANDARDS (CA CCSS-M) INTEGRATED
 * 
 * Each skill mapped to specific CA standards:
 * - K-8: Domain codes (OA, NBT, NF, RP, EE, G, SP)
 * - High School: Conceptual categories (HSA, HSF, HSN, HSG)
 * 
 * Standard format: [Grade].[Domain].[Cluster].[Standard]
 * Example: 3.OA.A.1 = Grade 3, Operations & Algebraic Thinking, Cluster A, Standard 1
 */

// ═══════════════════════════════════════════════════════════════
// CA COMMON CORE DOMAINS
// ═══════════════════════════════════════════════════════════════

export const CA_DOMAINS = {
    // K-5 Domains
    'CC': 'Counting & Cardinality',
    'OA': 'Operations & Algebraic Thinking',
    'NBT': 'Number & Operations in Base Ten',
    'NF': 'Number & Operations—Fractions',
    'MD': 'Measurement & Data',
    'G': 'Geometry',
    
    // 6-8 Domains
    'RP': 'Ratios & Proportional Relationships',
    'NS': 'The Number System',
    'EE': 'Expressions & Equations',
    'F': 'Functions',
    'SP': 'Statistics & Probability',
    
    // High School Conceptual Categories
    'HSN': 'Number & Quantity',
    'HSA': 'Algebra',
    'HSF': 'Functions',
    'HSG': 'Geometry',
    'HSS': 'Statistics & Probability'
};

// ═══════════════════════════════════════════════════════════════
// SKILL TREE WITH CA COMMON CORE STANDARDS
// ═══════════════════════════════════════════════════════════════

export const SKILLS = {
    // ═══════════════════════════════════════════════════════════
    // ELEMENTARY (Grades K-4)
    // ═══════════════════════════════════════════════════════════
    addition: {
        id: 'addition',
        name: 'Addition',
        icon: '+',
        color: 'emerald',
        category: 'Elementary',
        gradeRange: 'K-4',
        prerequisites: [],
        levels: 5,
        description: 'Add whole numbers fluently',
        
        // CA Common Core Standards by Level
        standards: {
            1: ['K.OA.A.1', 'K.OA.A.2'], // Add within 10
            2: ['1.OA.C.6', '1.NBT.C.4'], // Add within 20, two-digit + one-digit
            3: ['2.OA.B.2', '2.NBT.B.5'], // Add within 100 fluently
            4: ['3.NBT.A.2', '4.NBT.B.4'], // Add within 1000, multi-digit
            5: ['4.NBT.B.4', '5.NBT.B.5'] // Fluently add multi-digit
        },
        standardDescriptions: {
            'K.OA.A.1': 'Represent addition with objects, fingers, drawings',
            'K.OA.A.2': 'Add within 10 using objects or drawings',
            '1.OA.C.6': 'Add within 20 demonstrating fluency',
            '1.NBT.C.4': 'Add a two-digit and one-digit number',
            '2.OA.B.2': 'Fluently add within 20 using mental strategies',
            '2.NBT.B.5': 'Fluently add within 100',
            '3.NBT.A.2': 'Add within 1000 using strategies',
            '4.NBT.B.4': 'Fluently add multi-digit whole numbers'
        }
    },

    subtraction: {
        id: 'subtraction',
        name: 'Subtraction',
        icon: '−',
        color: 'blue',
        category: 'Elementary',
        gradeRange: 'K-4',
        prerequisites: [],
        levels: 5,
        description: 'Subtract whole numbers fluently',
        
        standards: {
            1: ['K.OA.A.1', 'K.OA.A.2'], // Subtract within 10
            2: ['1.OA.C.6', '1.NBT.C.6'], // Subtract within 20
            3: ['2.OA.B.2', '2.NBT.B.5'], // Subtract within 100
            4: ['3.NBT.A.2', '4.NBT.B.4'], // Subtract within 1000
            5: ['4.NBT.B.4', '5.NBT.B.5'] // Multi-digit subtraction
        },
        standardDescriptions: {
            'K.OA.A.1': 'Represent subtraction with objects, fingers, drawings',
            '1.OA.C.6': 'Subtract within 20 demonstrating fluency',
            '2.NBT.B.5': 'Fluently subtract within 100',
            '3.NBT.A.2': 'Subtract within 1000 using strategies',
            '4.NBT.B.4': 'Fluently subtract multi-digit whole numbers'
        }
    },

    multiplication: {
        id: 'multiplication',
        name: 'Multiplication',
        icon: '×',
        color: 'amber',
        category: 'Elementary',
        gradeRange: '3-5',
        prerequisites: [],
        levels: 5,
        description: 'Multiply whole numbers fluently',
        
        standards: {
            1: ['3.OA.A.1', '3.OA.A.3'], // Interpret as equal groups, within 100
            2: ['3.OA.C.7'], // Fluently multiply within 100
            3: ['4.NBT.B.5'], // Multiply up to 4-digit by 1-digit
            4: ['4.NBT.B.5', '5.NBT.B.5'], // 2-digit by 2-digit
            5: ['5.NBT.B.5'] // Multi-digit multiplication
        },
        standardDescriptions: {
            '3.OA.A.1': 'Interpret multiplication as equal groups',
            '3.OA.A.3': 'Use multiplication to solve word problems',
            '3.OA.C.7': 'Fluently multiply within 100',
            '4.NBT.B.5': 'Multiply using strategies based on place value',
            '5.NBT.B.5': 'Fluently multiply multi-digit whole numbers'
        }
    },

    division: {
        id: 'division',
        name: 'Division',
        icon: '÷',
        color: 'purple',
        category: 'Elementary',
        gradeRange: '3-5',
        prerequisites: [],
        levels: 5,
        description: 'Divide whole numbers fluently',
        
        standards: {
            1: ['3.OA.A.2', '3.OA.A.3'], // Interpret as sharing, within 100
            2: ['3.OA.C.7'], // Fluently divide within 100
            3: ['4.NBT.B.6'], // 4-digit by 1-digit
            4: ['5.NBT.B.6'], // 4-digit by 2-digit
            5: ['6.NS.B.2'] // Multi-digit division
        },
        standardDescriptions: {
            '3.OA.A.2': 'Interpret division as partitioning into equal shares',
            '3.OA.C.7': 'Fluently divide within 100',
            '4.NBT.B.6': 'Find quotients using place value strategies',
            '5.NBT.B.6': 'Find quotients of whole numbers',
            '6.NS.B.2': 'Fluently divide multi-digit numbers'
        }
    },

    // ═══════════════════════════════════════════════════════════
    // MIDDLE SCHOOL (Grades 5-8)
    // ═══════════════════════════════════════════════════════════
    fractions: {
        id: 'fractions',
        name: 'Fractions',
        icon: '½',
        color: 'orange',
        category: 'Middle School',
        gradeRange: '3-6',
        prerequisites: [],
        levels: 5,
        description: 'Operate with fractions fluently',
        
        standards: {
            1: ['3.NF.A.1', '3.NF.A.2'], // Understand fractions as numbers
            2: ['4.NF.A.1', '4.NF.B.3'], // Equivalent fractions, add/subtract like denominators
            3: ['5.NF.A.1', '5.NF.B.4'], // Add/subtract unlike denominators, multiply
            4: ['5.NF.B.7', '6.NS.A.1'], // Divide fractions
            5: ['6.NS.A.1', '7.NS.A.2'] // Apply operations fluently
        },
        standardDescriptions: {
            '3.NF.A.1': 'Understand fraction 1/b as one part when partitioned into b equal parts',
            '3.NF.A.2': 'Understand fractions as numbers on a number line',
            '4.NF.A.1': 'Explain equivalent fractions using visual models',
            '4.NF.B.3': 'Add and subtract fractions with like denominators',
            '5.NF.A.1': 'Add and subtract fractions with unlike denominators',
            '5.NF.B.4': 'Multiply fractions',
            '5.NF.B.7': 'Divide unit fractions',
            '6.NS.A.1': 'Interpret and compute quotients of fractions'
        }
    },

    decimals: {
        id: 'decimals',
        name: 'Decimals',
        icon: '.',
        color: 'teal',
        category: 'Middle School',
        gradeRange: '4-6',
        prerequisites: [],
        levels: 5,
        description: 'Operate with decimal numbers',
        
        standards: {
            1: ['4.NF.C.6', '4.NF.C.7'], // Decimal notation for fractions, compare
            2: ['5.NBT.A.3', '5.NBT.B.7'], // Read/write decimals, add/subtract
            3: ['5.NBT.B.7', '6.NS.B.3'], // Multiply decimals
            4: ['6.NS.B.3'], // Divide decimals fluently
            5: ['7.NS.A.2', '7.NS.A.3'] // Apply all operations
        },
        standardDescriptions: {
            '4.NF.C.6': 'Use decimal notation for fractions with denominator 10 or 100',
            '5.NBT.A.3': 'Read, write, compare decimals to thousandths',
            '5.NBT.B.7': 'Add, subtract, multiply, divide decimals to hundredths',
            '6.NS.B.3': 'Fluently add, subtract, multiply, divide decimals'
        }
    },

    percentages: {
        id: 'percentages',
        name: 'Percentages',
        icon: '%',
        color: 'pink',
        category: 'Middle School',
        gradeRange: '6-7',
        prerequisites: [],
        levels: 5,
        description: 'Solve percent problems',
        
        standards: {
            1: ['6.RP.A.3c'], // Find percent of a quantity
            2: ['6.RP.A.3c', '7.RP.A.2'], // Percent as rate per 100
            3: ['7.RP.A.3'], // Percent increase/decrease
            4: ['7.RP.A.3'], // Multi-step percent problems
            5: ['7.RP.A.3'] // Complex percent applications
        },
        standardDescriptions: {
            '6.RP.A.3c': 'Find a percent of a quantity as a rate per 100',
            '7.RP.A.2': 'Recognize and represent proportional relationships',
            '7.RP.A.3': 'Use percent to solve problems including percent increase/decrease'
        }
    },

    order_ops: {
        id: 'order_ops',
        name: 'Order of Operations',
        icon: '( )',
        color: 'rose',
        category: 'Middle School',
        gradeRange: '5-6',
        prerequisites: [],
        levels: 4,
        description: 'Apply order of operations (PEMDAS)',
        
        standards: {
            1: ['5.OA.A.1'], // Grouping symbols
            2: ['5.OA.A.1', '6.EE.A.1'], // Evaluate expressions
            3: ['6.EE.A.2c'], // Evaluate at specific values
            4: ['6.EE.A.2c', '7.EE.A.1'] // Complex expressions
        },
        standardDescriptions: {
            '5.OA.A.1': 'Use parentheses, brackets, braces in numerical expressions',
            '6.EE.A.1': 'Write and evaluate numerical expressions with exponents',
            '6.EE.A.2c': 'Evaluate expressions at specific values of variables'
        }
    },

    // ═══════════════════════════════════════════════════════════
    // HIGH SCHOOL (Grades 8-12, HSA/HSF/HSN Standards)
    // ═══════════════════════════════════════════════════════════
    exponents: {
        id: 'exponents',
        name: 'Exponents',
        icon: 'xⁿ',
        color: 'indigo',
        category: 'High School',
        gradeRange: '6-9',
        prerequisites: [],
        levels: 5,
        description: 'Apply properties of exponents',
        
        standards: {
            1: ['6.EE.A.1'], // Evaluate expressions with exponents
            2: ['8.EE.A.1'], // Properties of integer exponents
            3: ['8.EE.A.1', 'HSN.RN.A.1'], // Rational exponents
            4: ['HSN.RN.A.2'], // Rewrite expressions with radicals and exponents
            5: ['HSA.SSE.B.3c'] // Properties in exponential functions
        },
        standardDescriptions: {
            '6.EE.A.1': 'Write and evaluate numerical expressions involving exponents',
            '8.EE.A.1': 'Know and apply properties of integer exponents',
            'HSN.RN.A.1': 'Explain how the definition of rational exponents follows from properties',
            'HSN.RN.A.2': 'Rewrite expressions involving radicals and rational exponents',
            'HSA.SSE.B.3c': 'Use properties of exponents to transform expressions'
        }
    },

    roots: {
        id: 'roots',
        name: 'Square Roots',
        icon: '√',
        color: 'violet',
        category: 'High School',
        gradeRange: '8-10',
        prerequisites: [],
        levels: 5,
        description: 'Simplify and compute square roots',
        
        standards: {
            1: ['8.EE.A.2'], // Square roots of perfect squares
            2: ['8.EE.A.2', '8.NS.A.2'], // Approximate irrational square roots
            3: ['HSN.RN.A.2'], // Simplify radical expressions
            4: ['HSN.RN.A.2', 'HSA.REI.B.4'], // Operations with radicals
            5: ['HSA.REI.B.4b'] // Complete the square, quadratic formula
        },
        standardDescriptions: {
            '8.EE.A.2': 'Evaluate square roots of small perfect squares and cube roots',
            '8.NS.A.2': 'Use rational approximations of irrational numbers',
            'HSN.RN.A.2': 'Rewrite expressions involving radicals',
            'HSA.REI.B.4': 'Solve quadratic equations using square roots'
        }
    },

    algebra: {
        id: 'algebra',
        name: 'Algebra',
        icon: 'x',
        color: 'cyan',
        category: 'High School',
        gradeRange: '6-8',
        prerequisites: [],
        levels: 5,
        description: 'Solve algebraic equations',
        
        standards: {
            1: ['6.EE.B.5', '6.EE.B.7'], // Solve x + p = q, px = q
            2: ['7.EE.B.4a'], // Solve px + q = r
            3: ['8.EE.C.7a'], // Solve linear equations
            4: ['8.EE.C.7b'], // Multi-step linear equations
            5: ['HSA.REI.B.3'] // Solve equations with coefficients
        },
        standardDescriptions: {
            '6.EE.B.5': 'Understand solving as finding values that make equations true',
            '6.EE.B.7': 'Solve real-world problems by writing equations x + p = q',
            '7.EE.B.4a': 'Solve problems leading to equations px + q = r',
            '8.EE.C.7a': 'Give examples of linear equations with one, none, or infinite solutions',
            '8.EE.C.7b': 'Solve linear equations with rational coefficients',
            'HSA.REI.B.3': 'Solve linear equations and inequalities in one variable'
        }
    },

    equations: {
        id: 'equations',
        name: 'Linear Equations',
        icon: '=',
        color: 'sky',
        category: 'High School',
        gradeRange: '8-9',
        prerequisites: [],
        levels: 5,
        description: 'Solve and graph linear equations',
        
        standards: {
            1: ['8.EE.C.7b'], // Multi-step equations
            2: ['HSA.CED.A.1'], // Create equations in one variable
            3: ['HSA.CED.A.2'], // Create equations in two variables
            4: ['HSA.REI.C.6'], // Solve systems approximately
            5: ['HSA.REI.C.6', 'HSA.REI.D.12'] // Systems and inequalities
        },
        standardDescriptions: {
            '8.EE.C.7b': 'Solve linear equations with rational coefficients',
            'HSA.CED.A.1': 'Create equations and inequalities in one variable',
            'HSA.CED.A.2': 'Create equations in two or more variables',
            'HSA.REI.C.6': 'Solve systems of linear equations exactly and approximately',
            'HSA.REI.D.12': 'Graph the solutions to a linear inequality'
        }
    },

    // ═══════════════════════════════════════════════════════════
    // COLLEGE PREP (Grades 9-12, Advanced HSA/HSF Standards)
    // ═══════════════════════════════════════════════════════════
    quadratics: {
        id: 'quadratics',
        name: 'Quadratics',
        icon: 'x²',
        color: 'fuchsia',
        category: 'College Prep',
        gradeRange: '9-11',
        prerequisites: [],
        levels: 4,
        description: 'Solve quadratic equations',
        
        standards: {
            1: ['HSA.REI.B.4a'], // Complete the square
            2: ['HSA.REI.B.4b'], // Quadratic formula
            3: ['HSA.SSE.B.3a'], // Factor quadratics
            4: ['HSF.IF.C.8a'] // Use completing the square to reveal vertex
        },
        standardDescriptions: {
            'HSA.REI.B.4a': 'Use method of completing the square to derive quadratic formula',
            'HSA.REI.B.4b': 'Solve quadratic equations by inspection, square roots, completing square, quadratic formula',
            'HSA.SSE.B.3a': 'Factor a quadratic expression to reveal zeros',
            'HSF.IF.C.8a': 'Use completing the square to reveal maximum/minimum value'
        }
    },

    trig: {
        id: 'trig',
        name: 'Trigonometry',
        icon: 'θ',
        color: 'lime',
        category: 'College Prep',
        gradeRange: '9-12',
        prerequisites: [],
        levels: 4,
        description: 'Apply trigonometric ratios',
        
        standards: {
            1: ['HSG.SRT.C.6'], // Understand trig ratios as side ratios
            2: ['HSG.SRT.C.7'], // Relationship between sine and cosine
            3: ['HSG.SRT.C.8'], // Use trig to solve right triangles
            4: ['HSF.TF.A.3'] // Special angles and unit circle
        },
        standardDescriptions: {
            'HSG.SRT.C.6': 'Understand that sine and cosine are side ratios in right triangles',
            'HSG.SRT.C.7': 'Explain and use the relationship sin(A) = cos(90-A)',
            'HSG.SRT.C.8': 'Use trigonometric ratios to solve right triangles',
            'HSF.TF.A.3': 'Use special triangles to determine values of sine, cosine, tangent'
        }
    },

    logarithms: {
        id: 'logarithms',
        name: 'Logarithms',
        icon: 'log',
        color: 'red',
        category: 'College Prep',
        gradeRange: '10-12',
        prerequisites: [],
        levels: 4,
        description: 'Evaluate and apply logarithms',
        
        standards: {
            1: ['HSF.LE.A.4'], // Express logarithmic relationship
            2: ['HSF.BF.B.5'], // Understand inverse relationship
            3: ['HSA.SSE.B.3c'], // Properties of logarithms
            4: ['HSF.LE.A.4'] // Solve exponential equations using logs
        },
        standardDescriptions: {
            'HSF.LE.A.4': 'For exponential models, express as a logarithm the solution to ab^ct = d',
            'HSF.BF.B.5': 'Understand the inverse relationship between exponents and logarithms',
            'HSA.SSE.B.3c': 'Use properties of exponents (and logarithms) to transform expressions'
        }
    }
};

// ═══════════════════════════════════════════════════════════════
// EXPORTS & CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const SKILL_ORDER = [
    'addition', 'subtraction', 'multiplication', 'division',
    'fractions', 'decimals', 'percentages', 'order_ops',
    'exponents', 'roots', 'algebra', 'equations',
    'quadratics', 'trig', 'logarithms'
];

export const CATEGORIES = {
    'Elementary': { color: 'emerald', icon: 'K-4', order: 1, grades: 'Grades K-4', domain: 'OA, NBT' },
    'Middle School': { color: 'amber', icon: '5-8', order: 2, grades: 'Grades 5-8', domain: 'NF, RP, EE' },
    'High School': { color: 'purple', icon: '9-12', order: 3, grades: 'Grades 8-10', domain: 'HSA, HSN' },
    'College Prep': { color: 'rose', icon: 'AP', order: 4, grades: 'Grades 9-12+', domain: 'HSF, HSG' }
};

export const LEVELS = {
    1: { name: 'Foundations', description: 'Core concepts', color: 'slate', xpRequired: 0 },
    2: { name: 'Developing', description: 'Building skills', color: 'blue', xpRequired: 50 },
    3: { name: 'Proficient', description: 'Solid understanding', color: 'emerald', xpRequired: 150 },
    4: { name: 'Advanced', description: 'Complex problems', color: 'purple', xpRequired: 300 },
    5: { name: 'Mastery', description: 'Expert level', color: 'amber', xpRequired: 500 }
};

export const ACHIEVEMENTS = {
    first_problem: { id: 'first_problem', name: 'Getting Started', icon: '✓', desc: 'Complete your first problem' },
    streak_5: { id: 'streak_5', name: 'Consistent', icon: '5', desc: '5 correct in a row' },
    streak_10: { id: 'streak_10', name: 'Focused', icon: '10', desc: '10 correct in a row' },
    level_up: { id: 'level_up', name: 'Progress', icon: '↑', desc: 'Reach level 2 in any skill' },
    master: { id: 'master', name: 'Expert', icon: '★', desc: 'Reach level 5 in any skill' },
    explorer: { id: 'explorer', name: 'Explorer', icon: '◈', desc: 'Try 5 different skills' },
    standard_met: { id: 'standard_met', name: 'Standard Met', icon: '◎', desc: 'Meet a CA Common Core standard' }
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const round = (n, d = 2) => Math.round(n * Math.pow(10, d)) / Math.pow(10, d);

const PERFECT_SQUARES = { 4: 2, 9: 3, 16: 4, 25: 5, 36: 6, 49: 7, 64: 8, 81: 9, 100: 10, 121: 11, 144: 12 };
const TRIG = { sin: { 0: 0, 30: 0.5, 45: 0.707, 60: 0.866, 90: 1 }, cos: { 0: 1, 30: 0.866, 45: 0.707, 60: 0.5, 90: 0 } };

// Get current standard being practiced
export const getCurrentStandard = (skillId, level) => {
    const skill = SKILLS[skillId];
    if (!skill?.standards?.[level]) return null;
    const codes = skill.standards[level];
    return {
        codes,
        descriptions: codes.map(c => skill.standardDescriptions?.[c] || c)
    };
};

// ═══════════════════════════════════════════════════════════════
// PROBLEM GENERATORS (With Standard References)
// ═══════════════════════════════════════════════════════════════

const createProblem = (problem, answer, options = {}) => ({
    problem,
    answer,
    xpReward: options.xp || 10,
    explanation: options.explanation || null,
    steps: options.steps || null,
    hint: options.hint || null,
    standard: options.standard || null // CA CCSS code
});

const generators = {
    addition: {
        1: () => { const a = randomInt(1, 9), b = randomInt(1, 9); return createProblem(`${a} + ${b}`, a + b, { xp: 5, standard: 'K.OA.A.2', steps: [`${a} + ${b} = ${a + b}`], explanation: 'Add within 10' }); },
        2: () => { const a = randomInt(10, 50), b = randomInt(5, 30); return createProblem(`${a} + ${b}`, a + b, { xp: 8, standard: '1.NBT.C.4' }); },
        3: () => { const a = randomInt(50, 200), b = randomInt(25, 150); return createProblem(`${a} + ${b}`, a + b, { xp: 12, standard: '2.NBT.B.5' }); },
        4: () => { const a = randomInt(100, 500), b = randomInt(100, 400); return createProblem(`${a} + ${b}`, a + b, { xp: 15, standard: '3.NBT.A.2' }); },
        5: () => { const a = randomInt(500, 2000), b = randomInt(500, 2000); return createProblem(`${a} + ${b}`, a + b, { xp: 20, standard: '4.NBT.B.4' }); }
    },

    subtraction: {
        1: () => { const b = randomInt(1, 8), a = b + randomInt(1, 8); return createProblem(`${a} − ${b}`, a - b, { xp: 5, standard: 'K.OA.A.2' }); },
        2: () => { const b = randomInt(10, 30), a = b + randomInt(10, 50); return createProblem(`${a} − ${b}`, a - b, { xp: 8, standard: '1.OA.C.6' }); },
        3: () => { const b = randomInt(30, 80), a = b + randomInt(50, 120); return createProblem(`${a} − ${b}`, a - b, { xp: 12, standard: '2.NBT.B.5' }); },
        4: () => { const b = randomInt(100, 400), a = b + randomInt(100, 500); return createProblem(`${a} − ${b}`, a - b, { xp: 15, standard: '3.NBT.A.2' }); },
        5: () => { const b = randomInt(500, 1500), a = b + randomInt(500, 2000); return createProblem(`${a} − ${b}`, a - b, { xp: 20, standard: '4.NBT.B.4' }); }
    },

    multiplication: {
        1: () => { const a = randomInt(2, 5), b = randomInt(2, 5); return createProblem(`${a} × ${b}`, a * b, { xp: 5, standard: '3.OA.A.1', steps: [`${a} groups of ${b} = ${a * b}`] }); },
        2: () => { const a = randomInt(3, 9), b = randomInt(3, 9); return createProblem(`${a} × ${b}`, a * b, { xp: 8, standard: '3.OA.C.7' }); },
        3: () => { const a = randomInt(6, 12), b = randomInt(6, 12); return createProblem(`${a} × ${b}`, a * b, { xp: 12, standard: '4.NBT.B.5' }); },
        4: () => { const a = randomInt(12, 25), b = randomInt(3, 9); return createProblem(`${a} × ${b}`, a * b, { xp: 15, standard: '4.NBT.B.5' }); },
        5: () => { const a = randomInt(12, 25), b = randomInt(12, 25); return createProblem(`${a} × ${b}`, a * b, { xp: 20, standard: '5.NBT.B.5' }); }
    },

    division: {
        1: () => { const b = randomInt(2, 5), ans = randomInt(2, 5), a = b * ans; return createProblem(`${a} ÷ ${b}`, ans, { xp: 5, standard: '3.OA.A.2' }); },
        2: () => { const b = randomInt(2, 9), ans = randomInt(3, 10), a = b * ans; return createProblem(`${a} ÷ ${b}`, ans, { xp: 8, standard: '3.OA.C.7' }); },
        3: () => { const b = randomInt(5, 12), ans = randomInt(5, 15), a = b * ans; return createProblem(`${a} ÷ ${b}`, ans, { xp: 12, standard: '4.NBT.B.6' }); },
        4: () => { const b = randomInt(6, 15), ans = randomInt(10, 25), a = b * ans; return createProblem(`${a} ÷ ${b}`, ans, { xp: 15, standard: '5.NBT.B.6' }); },
        5: () => { const b = randomInt(10, 25), ans = randomInt(15, 40), a = b * ans; return createProblem(`${a} ÷ ${b}`, ans, { xp: 20, standard: '6.NS.B.2' }); }
    },

    fractions: {
        1: () => { const d = randomChoice([2, 4]), a = randomInt(1, d-1), b = randomInt(1, d-a); return createProblem(`${a}/${d} + ${b}/${d}`, round((a+b)/d, 2), { xp: 8, standard: '3.NF.A.1' }); },
        2: () => { const f = randomInt(2, 3), n = f * randomInt(1, 3), d = f * randomInt(2, 4); const g = (a, b) => b ? g(b, a % b) : a; const gcd = g(n, d); return createProblem(`Simplify ${n}/${d}`, `${n/gcd}/${d/gcd}`, { xp: 10, standard: '4.NF.A.1', type: 'text' }); },
        3: () => { const a = randomInt(1, 4), b = randomInt(2, 5), c = randomInt(1, 4), d = randomInt(2, 5); return createProblem(`${a}/${b} × ${c}/${d}`, round((a*c)/(b*d), 3), { xp: 12, standard: '5.NF.B.4' }); },
        4: () => { const a = randomInt(1, 3), b = randomChoice([2, 3, 4]), c = randomInt(1, 3), d = randomChoice([4, 5, 6]); return createProblem(`${a}/${b} + ${c}/${d}`, round(a/b + c/d, 3), { xp: 15, standard: '5.NF.A.1' }); },
        5: () => { const a = randomInt(1, 4), b = randomInt(2, 5), c = randomInt(1, 4), d = randomInt(2, 5); return createProblem(`${a}/${b} ÷ ${c}/${d}`, round((a*d)/(b*c), 3), { xp: 18, standard: '6.NS.A.1' }); }
    },

    decimals: {
        1: () => { const a = randomInt(1, 9) / 10, b = randomInt(1, 9) / 10; return createProblem(`${a} + ${b}`, round(a + b), { xp: 8, standard: '4.NF.C.6' }); },
        2: () => { const a = randomInt(10, 50) / 10, b = randomInt(10, 30) / 10; return createProblem(`${a} + ${b}`, round(a + b), { xp: 10, standard: '5.NBT.B.7' }); },
        3: () => { const a = randomInt(10, 30) / 10, b = randomInt(2, 9) / 10; return createProblem(`${a} × ${b}`, round(a * b), { xp: 12, standard: '5.NBT.B.7' }); },
        4: () => { const a = randomInt(50, 99) / 10, b = randomInt(2, 5); return createProblem(`${a} ÷ ${b}`, round(a / b), { xp: 15, standard: '6.NS.B.3' }); },
        5: () => { const a = randomInt(100, 999) / 100, b = randomInt(10, 99) / 100; return createProblem(`${a} + ${b}`, round(a + b, 3), { xp: 18, standard: '6.NS.B.3' }); }
    },

    percentages: {
        1: () => { const p = randomChoice([10, 25, 50]), n = randomChoice([20, 40, 80, 100]); return createProblem(`${p}% of ${n}`, (p / 100) * n, { xp: 8, standard: '6.RP.A.3c' }); },
        2: () => { const p = randomChoice([10, 15, 20, 25]), n = randomInt(50, 200); return createProblem(`${p}% of ${n}`, round((p / 100) * n), { xp: 12, standard: '6.RP.A.3c' }); },
        3: () => { const o = randomChoice([50, 80, 100]), p = randomChoice([10, 20, 25]); return createProblem(`${o} + ${p}%`, o * (1 + p/100), { xp: 15, standard: '7.RP.A.3' }); },
        4: () => { const o = randomChoice([80, 100, 200]), p = randomChoice([10, 20, 25]); return createProblem(`${o} − ${p}%`, o * (1 - p/100), { xp: 15, standard: '7.RP.A.3' }); },
        5: () => { const ans = randomInt(100, 200), p = randomChoice([10, 20, 25]); const o = round(ans / (1 + p/100)); return createProblem(`After +${p}%: ${ans}. Original?`, o, { xp: 20, standard: '7.RP.A.3' }); }
    },

    order_ops: {
        1: () => { const a = randomInt(2, 8), b = randomInt(2, 5), c = randomInt(1, 5); return createProblem(`${a} + ${b} × ${c}`, a + (b * c), { xp: 10, standard: '5.OA.A.1' }); },
        2: () => { const a = randomInt(2, 8), b = randomInt(2, 6), c = randomInt(2, 8); return createProblem(`${a} × ${b} + ${c}`, (a * b) + c, { xp: 12, standard: '5.OA.A.1' }); },
        3: () => { const a = randomInt(2, 6), b = randomInt(2, 5), c = randomInt(2, 5), d = randomInt(1, 5); return createProblem(`${a} + ${b} × ${c} − ${d}`, a + (b * c) - d, { xp: 15, standard: '6.EE.A.1' }); },
        4: () => { const a = randomInt(2, 6), b = randomInt(2, 6), c = randomInt(2, 6); return createProblem(`(${a} + ${b}) × ${c}`, (a + b) * c, { xp: 18, standard: '6.EE.A.2c' }); }
    },

    exponents: {
        1: () => { const b = randomInt(2, 5); return createProblem(`${b}²`, b * b, { xp: 8, standard: '6.EE.A.1' }); },
        2: () => { const b = randomInt(2, 4); return createProblem(`${b}³`, b * b * b, { xp: 10, standard: '6.EE.A.1' }); },
        3: () => { const b = randomInt(2, 4), e = randomInt(3, 4); return createProblem(`${b}^${e}`, Math.pow(b, e), { xp: 12, standard: '8.EE.A.1' }); },
        4: () => { const b = randomInt(2, 3), e1 = randomInt(2, 3), e2 = randomInt(2, 3); return createProblem(`(${b}^${e1})^${e2} = ${b}^?`, e1 * e2, { xp: 15, standard: '8.EE.A.1' }); },
        5: () => { const b = randomInt(2, 5), e1 = randomInt(2, 4), e2 = randomInt(2, 4); return createProblem(`${b}^${e1} × ${b}^${e2} = ${b}^?`, e1 + e2, { xp: 18, standard: 'HSN.RN.A.1' }); }
    },

    roots: {
        1: () => { const sq = randomChoice([4, 9, 16, 25]); return createProblem(`√${sq}`, PERFECT_SQUARES[sq], { xp: 8, standard: '8.EE.A.2' }); },
        2: () => { const sq = randomChoice([36, 49, 64, 81]); return createProblem(`√${sq}`, PERFECT_SQUARES[sq], { xp: 10, standard: '8.EE.A.2' }); },
        3: () => { const sq = randomChoice([100, 121, 144]); return createProblem(`√${sq}`, PERFECT_SQUARES[sq], { xp: 12, standard: '8.EE.A.2' }); },
        4: () => { const a = randomChoice([4, 9]), b = randomChoice([4, 9]); return createProblem(`√${a} × √${b}`, PERFECT_SQUARES[a] * PERFECT_SQUARES[b], { xp: 15, standard: 'HSN.RN.A.2' }); },
        5: () => { const n = randomChoice([8, 18, 50]); const s = { 8: '2√2', 18: '3√2', 50: '5√2' }; return createProblem(`Simplify √${n}`, s[n], { xp: 20, standard: 'HSN.RN.A.2', type: 'text' }); }
    },

    algebra: {
        1: () => { const a = randomInt(2, 10), x = randomInt(2, 10); return createProblem(`x + ${a} = ${x + a}`, x, { xp: 10, standard: '6.EE.B.7', steps: [`Subtract ${a}`, `x = ${x}`] }); },
        2: () => { const a = randomInt(2, 8), x = randomInt(2, 10); return createProblem(`${a}x = ${a * x}`, x, { xp: 12, standard: '6.EE.B.7' }); },
        3: () => { const a = randomInt(2, 6), b = randomInt(1, 10), x = randomInt(2, 8); return createProblem(`${a}x + ${b} = ${a * x + b}`, x, { xp: 15, standard: '7.EE.B.4a' }); },
        4: () => { const a = randomInt(2, 6), b = randomInt(1, 10), x = randomInt(3, 10); return createProblem(`${a}x − ${b} = ${a * x - b}`, x, { xp: 18, standard: '8.EE.C.7b' }); },
        5: () => { const a = randomInt(3, 8), c = randomInt(1, a-1), x = randomInt(2, 8), b = randomInt(1, 10); const d = a*x + b - c*x; return createProblem(`${a}x + ${b} = ${c}x + ${d}`, x, { xp: 22, standard: 'HSA.REI.B.3' }); }
    },

    equations: {
        1: () => { const a = randomInt(2, 5), x = randomInt(2, 10), b = randomInt(1, 10); return createProblem(`${a}x + ${b} = ${a*x+b}`, x, { xp: 12, standard: '8.EE.C.7b' }); },
        2: () => { const a = randomInt(2, 8), x = randomInt(2, 10); return createProblem(`x/${a} = ${x}`, a * x, { xp: 12, standard: 'HSA.CED.A.1' }); },
        3: () => { const b = randomInt(2, 5), c = randomInt(2, 8), a = randomInt(1, 10); const x = b * c - a; return createProblem(`(x + ${a})/${b} = ${c}`, x, { xp: 18, standard: 'HSA.CED.A.1' }); },
        4: () => { const a = randomInt(2, 5), b = randomInt(2, 5), y = randomInt(1, 5), x = randomInt(2, 8); const c = a*x + b*y; return createProblem(`${a}x + ${b}(${y}) = ${c}`, x, { xp: 20, standard: 'HSA.CED.A.2' }); },
        5: () => { const x = randomInt(3, 10), y = randomInt(1, x-1); return createProblem(`x+y=${x+y}, x−y=${x-y}. x=?`, x, { xp: 25, standard: 'HSA.REI.C.6' }); }
    },

    quadratics: {
        1: () => { const r = randomInt(2, 6); return createProblem(`x² = ${r * r}`, r, { xp: 15, standard: 'HSA.REI.B.4b' }); },
        2: () => { const r1 = randomInt(1, 5), r2 = randomInt(1, 5); const b = r1 + r2, c = r1 * r2; return createProblem(`x² + ${b}x + ${c} = 0`, -r1, { xp: 18, standard: 'HSA.SSE.B.3a' }); },
        3: () => { const h = randomInt(1, 5), k = randomInt(1, 10); return createProblem(`y = (x−${h})² + ${k}. Vertex x?`, h, { xp: 20, standard: 'HSF.IF.C.8a' }); },
        4: () => { const b = randomInt(2, 8), c = randomInt(1, 4); return createProblem(`x²+${b}x+${c}=0, b²−4ac=?`, b*b - 4*c, { xp: 22, standard: 'HSA.REI.B.4a' }); }
    },

    trig: {
        1: () => { const a = randomChoice([30, 45, 60]); return createProblem(`sin(${a}°)`, TRIG.sin[a], { xp: 15, standard: 'HSG.SRT.C.6' }); },
        2: () => { const a = randomChoice([30, 45, 60]); return createProblem(`cos(${a}°)`, TRIG.cos[a], { xp: 15, standard: 'HSG.SRT.C.6' }); },
        3: () => { const a = randomChoice([30, 45, 60]); const t = round(TRIG.sin[a] / TRIG.cos[a], 3); return createProblem(`tan(${a}°)`, t, { xp: 18, standard: 'HSG.SRT.C.8' }); },
        4: () => createProblem(`sin²θ + cos²θ = ?`, 1, { xp: 20, standard: 'HSF.TF.A.3' })
    },

    logarithms: {
        1: () => { const n = randomChoice([10, 100, 1000]); return createProblem(`log₁₀(${n})`, Math.log10(n), { xp: 15, standard: 'HSF.LE.A.4' }); },
        2: () => { const e = randomInt(2, 6); return createProblem(`log₂(${Math.pow(2, e)})`, e, { xp: 18, standard: 'HSF.BF.B.5' }); },
        3: () => { const b = randomInt(2, 5), n = randomInt(2, 4); return createProblem(`log₍${b}₎(${Math.pow(b, n)})`, n, { xp: 20, standard: 'HSF.LE.A.4' }); },
        4: () => { const a = randomInt(2, 5), b = randomInt(2, 5); return createProblem(`log(${a}) + log(${b}) = log(?)`, a * b, { xp: 22, standard: 'HSA.SSE.B.3c' }); }
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

    const options = new Set([problem.answer]);
    const offsets = [1, -1, 2, -2, 5, -5, 10, -10];

    while (options.size < 4) {
        const offset = offsets[Math.floor(Math.random() * offsets.length)];
        let wrong = answer + offset;
        if (wrong > 0 || ['algebra', 'quadratics'].includes(skillId)) options.add(wrong);
    }

    // Include the CA standard being practiced
    const currentStandards = skill.standards?.[lvl] || [];

    return {
        ...problem,
        options: [...options].sort(() => Math.random() - 0.5),
        skillId,
        level: lvl,
        standards: currentStandards,
        timestamp: Date.now()
    };
};

// ═══════════════════════════════════════════════════════════════
// CORE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export const isSkillUnlocked = () => true;

export const calculateNextDifficulty = (skillStats, recentHistory = [], maxLevel = 5) => {
    const { correct, total, streak, level, xp = 0 } = skillStats;
    const accuracy = total > 0 ? correct / total : 0;
    const xpNeeded = LEVELS[level + 1]?.xpRequired || Infinity;

    if (accuracy >= 0.85 && streak >= 5 && xp >= xpNeeded && level < maxLevel) {
        return { action: 'LEVEL_UP', newLevel: level + 1, reason: 'Level Up!', celebration: true };
    }
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
        return [{ type: weakest[0], message: `Focus on ${skill?.name}`, tip: skill?.description }];
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
// TEACHING CONTENT (With Standard References)
// ═══════════════════════════════════════════════════════════════

export const TEACHING_CONTENT = {
    addition: { title: "Addition", icon: '+', domain: 'OA/NBT', steps: [{ text: "Addition combines numbers together.", visual: '●● + ●●● = ●●●●●' }, { text: "Line up by place value. Add right to left.", visual: '23\n+15\n---\n38' }] },
    subtraction: { title: "Subtraction", icon: '−', domain: 'OA/NBT', steps: [{ text: "Subtraction finds the difference.", visual: '●●●●● − ●● = ●●●' }, { text: "Borrow from the left when needed.", visual: '32 → 2¹12' }] },
    multiplication: { title: "Multiplication", icon: '×', domain: 'OA/NBT', steps: [{ text: "Multiplication is repeated addition.", visual: '3 × 4 = 4 + 4 + 4 = 12' }] },
    division: { title: "Division", icon: '÷', domain: 'OA/NBT', steps: [{ text: "Division splits into equal groups.", visual: '12 ÷ 3 = how many 3s in 12?' }] },
    fractions: { title: "Fractions", icon: '½', domain: 'NF', steps: [{ text: "A fraction shows part of a whole.", visual: '½ = 1 out of 2' }, { text: "Top = parts you have. Bottom = total parts." }] },
    decimals: { title: "Decimals", icon: '.', domain: 'NBT/NS', steps: [{ text: "Decimals are fractions with denominator 10, 100...", visual: '0.5 = 5/10' }] },
    percentages: { title: "Percentages", icon: '%', domain: 'RP', steps: [{ text: "Percent means per 100.", visual: '25% = 25/100 = 0.25' }] },
    order_ops: { title: "Order of Operations", icon: '( )', domain: 'OA/EE', steps: [{ text: "PEMDAS: Parentheses, Exponents, Multiply/Divide, Add/Subtract", visual: '2 + 3 × 4 = 14' }] },
    exponents: { title: "Exponents", icon: 'xⁿ', domain: 'EE', steps: [{ text: "Exponent tells how many times to multiply.", visual: '2³ = 2 × 2 × 2 = 8' }] },
    roots: { title: "Square Roots", icon: '√', domain: 'NS/HSN', steps: [{ text: "√ finds what times itself equals the number.", visual: '√16 = 4 (because 4×4=16)' }] },
    algebra: { title: "Algebra", icon: 'x', domain: 'EE', steps: [{ text: "Solve for the unknown by undoing operations.", visual: 'x + 3 = 7 → x = 4' }] },
    equations: { title: "Linear Equations", icon: '=', domain: 'HSA', steps: [{ text: "Keep both sides balanced.", visual: '2x + 1 = 7 → 2x = 6 → x = 3' }] },
    quadratics: { title: "Quadratics", icon: 'x²', domain: 'HSA', steps: [{ text: "ax² + bx + c = 0. Factor or use the formula.", visual: 'x² + 5x + 6 = (x+2)(x+3)' }] },
    trig: { title: "Trigonometry", icon: 'θ', domain: 'HSG/HSF', steps: [{ text: "SOH CAH TOA for right triangles.", visual: 'sin = O/H, cos = A/H, tan = O/A' }] },
    logarithms: { title: "Logarithms", icon: 'log', domain: 'HSF', steps: [{ text: "log is the inverse of exponents.", visual: 'log₂(8) = 3 because 2³ = 8' }] }
};

export const getTeachingContent = (skillId, profile, patterns = []) => {
    const content = TEACHING_CONTENT[skillId];
    const skill = SKILLS[skillId];
    if (!content) return { title: 'Learning', icon: '?', steps: [{ text: 'Practice!' }] };
    return { 
        ...content, 
        personalAdvice: patterns.map(p => p.tip).filter(Boolean),
        gradeRange: skill?.gradeRange,
        currentStandards: skill?.standards?.[1] || []
    };
};

export const generateSessionSummary = (history, profile) => {
    if (!history?.length) return null;
    const correct = history.filter(p => p.correct).length;
    const total = history.length;
    const acc = Math.round((correct / total) * 100);

    // Collect all standards practiced
    const standardsCovered = [...new Set(history.flatMap(p => p.standards || []))];

    return {
        problemsSolved: total,
        correct,
        accuracy: acc,
        xpEarned: history.filter(p => p.correct).reduce((a, p) => a + (p.xpReward || 10), 0),
        avgTime: Math.round(history.reduce((a, p) => a + (p.timeSpent || 0), 0) / total),
        patterns: detectStrugglePatterns(history),
        standardsCovered,
        encouragement: acc >= 85 ? 'Excellent work!' : acc >= 70 ? 'Good progress!' : acc >= 50 ? 'Keep practicing!' : 'Every mistake helps you learn.'
    };
};
