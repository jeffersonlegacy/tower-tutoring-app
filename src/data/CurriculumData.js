/**
 * Jefferson Intelligence Curriculum Data
 * Phase 19: Expanded to cover California Standards, SAT/ACT, and Advanced Methods
 */

export const CURRICULUM_TRACKS = {
    number_ops: { id: 'number_ops', title: 'Number Operations', icon: '🔢', color: 'from-emerald-500 to-teal-600' },
    algebra: { id: 'algebra', title: 'Algebra', icon: '🔤', color: 'from-purple-500 to-indigo-600' },
    geometry: { id: 'geometry', title: 'Geometry', icon: '📐', color: 'from-blue-500 to-cyan-600' },
    test_prep: { id: 'test_prep', title: 'Test Prep', icon: '📝', color: 'from-orange-500 to-red-600' },
    speed_math: { id: 'speed_math', title: 'Speed Math Dojo', icon: '⚡', color: 'from-yellow-500 to-amber-600' }
};

export const DIAGNOSTIC_QUESTIONS_LIST = [
    { id: 'num_diag_1', text: '125 + 89 = ?', answer: 214, level: 1, type: 'basic', options: [204, 214, 194, 216] },
    { id: 'num_diag_2', text: 'If a pizza has 8 slices and you eat 3, what fraction is left?', answer: '5/8', level: 2, type: 'fractions', options: ['3/8', '5/8', '1/2', '5/3'] },
    { id: 'alg_diag_1', text: 'Solve for x: 3x - 12 = 18', answer: 10, level: 3, type: 'algebra', options: [2, 10, 6, 8] },
    { id: 'alg_diag_2', text: 'Slope of line through (1,2) and (3,6)?', answer: 2, level: 4, type: 'algebra', options: [2, 4, 0.5, 3] },
    { id: 'geo_diag_1', text: 'Area of triangle with base 10 and height 5?', answer: 25, level: 3, type: 'geometry', options: [50, 25, 15, 100] },
    { id: 'geo_diag_2', text: 'Sum of angles in a triangle?', answer: 180, level: 2, type: 'geometry', options: [90, 180, 360, 270] },
];

export const CURRICULUM_DATA = {
    track: "Mathematics",
    level: "K-12 + Test Prep",
    rootNodeId: "num_addition_basic",
    nodes: {
        "num_addition_basic": {
            id: "num_addition_basic",
            title: "Basic Addition",
            description: "Single and double digit addition with carrying.",
            track: "number_ops",
            grade: "K-2",
            prerequisites: [],
            nextSteps: ["num_subtraction_basic"],
            estimatedMinutes: 15,
            icon: "➕",
            content: {
                steps: [
                    { title: "The Concept", text: "Addition is the process of calculating the total of two or more numbers." },
                    { title: "Place Value", text: "Always align numbers by their place value: Ones, Tens, Hundreds." },
                    { title: "The Carry", text: "If the ones column adds up to 10 or more, 'carry' the ten to the next column." },
                    { title: "Final Sum", text: "Add the remaining columns including any carried values." }
                ]
            }
        },
        "num_subtraction_basic": {
            id: "num_subtraction_basic",
            title: "Basic Subtraction",
            description: "Borrowing, regrouping, and mental strategies.",
            track: "number_ops",
            grade: "K-2",
            prerequisites: ["num_addition_basic"],
            nextSteps: ["num_multiplication_facts"],
            estimatedMinutes: 15,
            icon: "➖",
            associatedGame: "MathMind"
        },
        "num_multiplication_facts": {
            id: "num_multiplication_facts",
            title: "Multiplication Facts",
            description: "Times tables 1-12 and mental multiplication.",
            track: "number_ops",
            grade: "3-4",
            prerequisites: ["num_subtraction_basic"],
            nextSteps: ["num_division_facts", "speed_mult_vedic"],
            estimatedMinutes: 20,
            icon: "✖️",

        },
        "num_division_facts": {
            id: "num_division_facts",
            title: "Division Facts",
            description: "Division as inverse of multiplication.",
            track: "number_ops",
            grade: "3-4",
            prerequisites: ["num_multiplication_facts"],
            nextSteps: ["num_fractions_intro"],
            estimatedMinutes: 20,
            icon: "➗",
            associatedGame: "MathMind"
        },
        "num_fractions_intro": {
            id: "num_fractions_intro",
            title: "Introduction to Fractions",
            description: "Parts of a whole, equivalent fractions, comparing.",
            track: "number_ops",
            grade: "3-4",
            prerequisites: ["num_division_facts"],
            nextSteps: ["num_fractions_ops", "speed_fractions"],
            estimatedMinutes: 25,
            icon: "½",
            content: {
                steps: [
                    { title: "Numerator", text: "The top number tells us how many parts we HAVE." },
                    { title: "Denominator", text: "The bottom number tells us how many parts make a WHOLE." },
                    { title: "Visualizing", text: "Think of a circle cut into equal slices. 1/4 means one slice of a four-slice pizza." }
                ]
            }
        },
        "num_fractions_ops": {
            id: "num_fractions_ops",
            title: "Fraction Operations",
            description: "Adding, subtracting, multiplying, and dividing fractions.",
            track: "number_ops",
            grade: "4-5",
            prerequisites: ["num_fractions_intro"],
            nextSteps: ["num_decimals"],
            estimatedMinutes: 30,
            icon: "🍕"
        },
        "num_decimals": {
            id: "num_decimals",
            title: "Decimals",
            description: "Place value, conversion, and decimal operations.",
            track: "number_ops",
            grade: "4-5",
            prerequisites: ["num_fractions_ops"],
            nextSteps: ["num_percentages"],
            estimatedMinutes: 25,
            icon: "🔢"
        },
        "num_percentages": {
            id: "num_percentages",
            title: "Percentages",
            description: "Percent of a number, fraction/decimal equivalence.",
            track: "number_ops",
            grade: "5-6",
            prerequisites: ["num_decimals"],
            nextSteps: ["alg_expressions"],
            estimatedMinutes: 25,
            icon: "%"
        },

        // ==========================================
        // TRACK 2: ALGEBRA (Middle → High)
        // ==========================================
        "alg_expressions": {
            id: "alg_expressions",
            title: "Algebraic Expressions",
            description: "Variables, simplifying, combining like terms.",
            track: "algebra",
            grade: "6-7",
            prerequisites: ["num_percentages"],
            nextSteps: ["alg_one_step_eq"],
            estimatedMinutes: 20,
            icon: "🔤"
        },
        "alg_one_step_eq": {
            id: "alg_one_step_eq",
            title: "One-Step Equations",
            description: "Solving for x using inverse operations.",
            track: "algebra",
            grade: "6-7",
            prerequisites: ["alg_expressions"],
            nextSteps: ["alg_two_step_eq"],
            estimatedMinutes: 20,
            icon: "1️⃣",
            associatedGame: "EquationExplorer",
            content: {
                steps: [
                    { title: "Isolation", text: "The goal is to get the variable (x) all by itself on one side." },
                    { title: "The Inverse", text: "Use the opposite operation. If you see addition, use subtraction." },
                    { title: "Balance", text: "Whatever you do to one side of the equation, you MUST do to the other." }
                ]
            }
        },
        "alg_two_step_eq": {
            id: "alg_two_step_eq",
            title: "Two-Step Equations",
            description: "Isolating the variable using two operations.",
            track: "algebra",
            grade: "7-8",
            prerequisites: ["alg_one_step_eq"],
            nextSteps: ["alg_multi_step_eq"],
            estimatedMinutes: 25,
            icon: "2️⃣",

        },
        "alg_multi_step_eq": {
            id: "alg_multi_step_eq",
            title: "Multi-Step Equations",
            description: "Distributive property, variables on both sides.",
            track: "algebra",
            grade: "8-9",
            prerequisites: ["alg_two_step_eq"],
            nextSteps: ["alg_inequalities", "alg_linear_graphs"],
            estimatedMinutes: 30,
            icon: "🔢"
        },
        "alg_inequalities": {
            id: "alg_inequalities",
            title: "Inequalities",
            description: "Graphing and solving linear inequalities.",
            track: "algebra",
            grade: "8-9",
            prerequisites: ["alg_multi_step_eq"],
            nextSteps: ["alg_systems"],
            estimatedMinutes: 25,
            icon: "≤"
        },
        "alg_linear_graphs": {
            id: "alg_linear_graphs",
            title: "Linear Graphs",
            description: "Slope, y-intercept, graphing lines.",
            track: "algebra",
            grade: "8-9",
            prerequisites: ["alg_multi_step_eq"],
            nextSteps: ["alg_systems"],
            estimatedMinutes: 30,
            icon: "📈"
        },
        "alg_systems": {
            id: "alg_systems",
            title: "Systems of Equations",
            description: "Graphing, substitution, elimination methods.",
            track: "algebra",
            grade: "9-10",
            prerequisites: ["alg_inequalities", "alg_linear_graphs"],
            nextSteps: ["alg_quadratics"],
            estimatedMinutes: 40,
            icon: "🔗",

        },
        "alg_quadratics": {
            id: "alg_quadratics",
            title: "Quadratic Equations",
            description: "Factoring, completing the square, quadratic formula.",
            track: "algebra",
            grade: "9-10",
            prerequisites: ["alg_systems"],
            nextSteps: ["alg_polynomials"],
            estimatedMinutes: 45,
            icon: "x²"
        },
        "alg_polynomials": {
            id: "alg_polynomials",
            title: "Polynomials",
            description: "Operations, factoring, long division.",
            track: "algebra",
            grade: "10-11",
            prerequisites: ["alg_quadratics"],
            nextSteps: [],
            estimatedMinutes: 45,
            icon: "📊"
        },

        // ==========================================
        // TRACK 3: GEOMETRY
        // ==========================================
        "geo_shapes_2d": {
            id: "geo_shapes_2d",
            title: "2D Shapes",
            description: "Properties and classification of polygons.",
            track: "geometry",
            grade: "3-5",
            prerequisites: [],
            nextSteps: ["geo_perimeter_area"],
            estimatedMinutes: 20,
            icon: "🔷"
        },
        "geo_perimeter_area": {
            id: "geo_perimeter_area",
            title: "Perimeter & Area",
            description: "Calculating for rectangles, triangles, circles.",
            track: "geometry",
            grade: "4-6",
            prerequisites: ["geo_shapes_2d"],
            nextSteps: ["geo_volume"],
            estimatedMinutes: 25,
            icon: "📏"
        },
        "geo_volume": {
            id: "geo_volume",
            title: "Volume",
            description: "3D shapes: prisms, cylinders, spheres.",
            track: "geometry",
            grade: "5-7",
            prerequisites: ["geo_perimeter_area"],
            nextSteps: ["geo_angles"],
            estimatedMinutes: 25,
            icon: "📦"
        },
        "geo_angles": {
            id: "geo_angles",
            title: "Angles",
            description: "Types, measurement, complementary, supplementary.",
            track: "geometry",
            grade: "6-8",
            prerequisites: ["geo_volume"],
            nextSteps: ["geo_triangles"],
            estimatedMinutes: 25,
            icon: "📐"
        },
        "geo_triangles": {
            id: "geo_triangles",
            title: "Triangle Properties",
            description: "Pythagorean theorem, similarity, congruence.",
            track: "geometry",
            grade: "8-10",
            prerequisites: ["geo_angles"],
            nextSteps: ["geo_circles", "geo_coordinate"],
            estimatedMinutes: 35,
            icon: "🔺"
        },
        "geo_circles": {
            id: "geo_circles",
            title: "Circle Geometry",
            description: "Circumference, area, arc length, sectors.",
            track: "geometry",
            grade: "9-10",
            prerequisites: ["geo_triangles"],
            nextSteps: [],
            estimatedMinutes: 30,
            icon: "⭕"
        },
        "geo_coordinate": {
            id: "geo_coordinate",
            title: "Coordinate Geometry",
            description: "Distance formula, midpoint, slope.",
            track: "geometry",
            grade: "8-10",
            prerequisites: ["geo_triangles"],
            nextSteps: [],
            estimatedMinutes: 30,
            icon: "📍",

        },

        // ==========================================
        // TRACK 4: TEST PREP (SAT/ACT/CAASPP)
        // ==========================================
        "test_word_problems": {
            id: "test_word_problems",
            title: "Word Problem Strategies",
            description: "Translating words to equations, key phrases.",
            track: "test_prep",
            grade: "All",
            prerequisites: [],
            nextSteps: ["test_data_analysis"],
            estimatedMinutes: 30,
            icon: "📖"
        },
        "test_data_analysis": {
            id: "test_data_analysis",
            title: "Data Analysis",
            description: "Charts, graphs, mean, median, mode.",
            track: "test_prep",
            grade: "SAT",
            prerequisites: ["test_word_problems"],
            nextSteps: ["test_sat_algebra"],
            estimatedMinutes: 35,
            icon: "📊"
        },
        "test_sat_algebra": {
            id: "test_sat_algebra",
            title: "SAT Heart of Algebra",
            description: "Linear equations, systems, inequalities.",
            track: "test_prep",
            grade: "SAT",
            prerequisites: ["test_data_analysis"],
            nextSteps: ["test_sat_advanced"],
            estimatedMinutes: 40,
            icon: "🎓"
        },
        "test_sat_advanced": {
            id: "test_sat_advanced",
            title: "Passport to Advanced Math",
            description: "Quadratics, polynomials, exponentials.",
            track: "test_prep",
            grade: "SAT",
            prerequisites: ["test_sat_algebra"],
            nextSteps: [],
            estimatedMinutes: 45,
            icon: "🚀"
        },
        "test_act_strategies": {
            id: "test_act_strategies",
            title: "ACT Math Strategies",
            description: "Timing, elimination, backsolving techniques.",
            track: "test_prep",
            grade: "ACT",
            prerequisites: [],
            nextSteps: [],
            estimatedMinutes: 30,
            icon: "⏱️"
        },

        // ==========================================
        // TRACK 5: SPEED MATH DOJO (Advanced Methods)
        // ==========================================
        "speed_add_left": {
            id: "speed_add_left",
            title: "Left-to-Right Addition",
            description: "Asian method: Add from highest place value first.",
            track: "speed_math",
            method: "addition",
            origin: "Asia",
            prerequisites: [],
            nextSteps: ["speed_add_vedic"],
            estimatedMinutes: 15,
            icon: "⚡"
        },
        "speed_add_vedic": {
            id: "speed_add_vedic",
            title: "Vedic Complement",
            description: "Use 10's complement for numbers near 100.",
            track: "speed_math",
            method: "addition",
            origin: "India",
            prerequisites: ["speed_add_left"],
            nextSteps: [],
            estimatedMinutes: 20,
            icon: "🕉️"
        },
        "speed_sub_austrian": {
            id: "speed_sub_austrian",
            title: "Austrian Subtraction",
            description: "No borrowing method - add to the subtrahend.",
            track: "speed_math",
            method: "subtraction",
            origin: "Europe",
            prerequisites: [],
            nextSteps: ["speed_sub_complement"],
            estimatedMinutes: 15,
            icon: "🇦🇹"
        },
        "speed_sub_complement": {
            id: "speed_sub_complement",
            title: "Japanese Complement",
            description: "10's complement for lightning-fast mental math.",
            track: "speed_math",
            method: "subtraction",
            origin: "Japan",
            prerequisites: ["speed_sub_austrian"],
            nextSteps: [],
            estimatedMinutes: 20,
            icon: "🇯🇵"
        },
        "speed_mult_chinese": {
            id: "speed_mult_chinese",
            title: "Chinese Stick Method",
            description: "Visual line intersection counting for multiplication.",
            track: "speed_math",
            method: "multiplication",
            origin: "China",
            prerequisites: [],
            nextSteps: ["speed_mult_vedic"],
            estimatedMinutes: 25,
            icon: "🇨🇳"
        },
        "speed_mult_vedic": {
            id: "speed_mult_vedic",
            title: "Vedic Vertically & Crosswise",
            description: "Mental math for 2-digit × 2-digit instantly.",
            track: "speed_math",
            method: "multiplication",
            origin: "India",
            prerequisites: ["speed_mult_chinese"],
            nextSteps: ["speed_mult_lattice", "speed_mult_nikhilam"],
            estimatedMinutes: 30,
            icon: "🕉️"
        },
        "speed_mult_lattice": {
            id: "speed_mult_lattice",
            title: "Lattice Multiplication",
            description: "Grid-based visual method for large numbers.",
            track: "speed_math",
            method: "multiplication",
            origin: "Venice/Arab",
            prerequisites: ["speed_mult_vedic"],
            nextSteps: [],
            estimatedMinutes: 25,
            icon: "🔲"
        },
        "speed_mult_nikhilam": {
            id: "speed_mult_nikhilam",
            title: "Nikhilam (Near Base)",
            description: "For numbers near 10, 100, 1000 - multiply in seconds.",
            track: "speed_math",
            method: "multiplication",
            origin: "India",
            prerequisites: ["speed_mult_vedic"],
            nextSteps: [],
            estimatedMinutes: 20,
            icon: "💯"
        },
        "speed_mult_trachtenberg": {
            id: "speed_mult_trachtenberg",
            title: "Trachtenberg System",
            description: "Speed mental multiplication without tables.",
            track: "speed_math",
            method: "multiplication",
            origin: "Europe",
            prerequisites: [],
            nextSteps: [],
            estimatedMinutes: 35,
            icon: "🧠"
        },
        "speed_div_short": {
            id: "speed_div_short",
            title: "Short Division",
            description: "Efficient written division (Bus Stop method).",
            track: "speed_math",
            method: "division",
            origin: "UK",
            prerequisites: [],
            nextSteps: ["speed_div_vedic"],
            estimatedMinutes: 20,
            icon: "🚌"
        },
        "speed_div_vedic": {
            id: "speed_div_vedic",
            title: "Vedic Division (Paravartya)",
            description: "Transpose and apply - division made elegant.",
            track: "speed_math",
            method: "division",
            origin: "India",
            prerequisites: ["speed_div_short"],
            nextSteps: [],
            estimatedMinutes: 25,
            icon: "🕉️"
        },
        "speed_fractions": {
            id: "speed_fractions",
            title: "Butterfly Method",
            description: "Visual fraction addition and comparison.",
            track: "speed_math",
            method: "fractions",
            origin: "Modern",
            prerequisites: [],
            nextSteps: ["speed_fractions_cross"],
            estimatedMinutes: 15,
            icon: "🦋"
        },
        "speed_fractions_cross": {
            id: "speed_fractions_cross",
            title: "Cross-Multiplication",
            description: "Quick comparison and solving for unknowns.",
            track: "speed_math",
            method: "fractions",
            origin: "Universal",
            prerequisites: ["speed_fractions"],
            nextSteps: [],
            estimatedMinutes: 15,
            icon: "✖️"
        }
    }
};

export const getNodesByTrack = (trackId) => {
    return Object.values(CURRICULUM_DATA.nodes).filter(node => node.track === trackId);
};

export const getNextUnlockedNodes = (completedIds) => {
    const nextNodes = [];
    Object.values(CURRICULUM_DATA.nodes).forEach(node => {
        if (!completedIds.includes(node.id)) {
            const allPrereqsMet = node.prerequisites.every(id => completedIds.includes(id));
            if (allPrereqsMet) {
                nextNodes.push(node);
            }
        }
    });
    return nextNodes;
};
