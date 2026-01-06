/**
 * Jefferson Intelligence Curriculum Data
 * Initial Focus: Algebra I
 */

export const CURRICULUM_DATA = {
    track: "Mathematics",
    level: "Algebra I",
    rootNodeId: "alg_intro_variables",
    nodes: {
        "alg_intro_variables": {
            id: "alg_intro_variables",
            title: "Variables & Expressions",
            description: "Understanding letters as numbers and basic substitution.",
            prerequisites: [],
            nextSteps: ["alg_eq_one_step"],
            estimatedMinutes: 15,
            icon: "🔤"
        },
        "alg_eq_one_step": {
            id: "alg_eq_one_step",
            title: "One-Step Equations",
            description: "Solving for x using inverse operations (add/sub/mul/div).",
            prerequisites: ["alg_intro_variables"],
            nextSteps: ["alg_eq_two_step"],
            estimatedMinutes: 20,
            icon: "1️⃣",
            associatedGame: "EquationExplorer",
            gameWinCondition: 3 // Win 3 rounds
        },
        "alg_eq_two_step": {
            id: "alg_eq_two_step",
            title: "Two-Step Equations",
            description: "Isolating the variable using two operations.",
            prerequisites: ["alg_eq_one_step"],
            nextSteps: ["alg_eq_complex", "alg_inequalities"],
            estimatedMinutes: 25,
            icon: "2️⃣",
            associatedGame: "SwipeFight", // Fast reflex math
            gameWinCondition: 500 // Score 500 pts
        },
        "alg_systems_intro": {
            id: "alg_systems_intro",
            title: "Systems of Equations",
            description: "Solving for two variables by graphing or substitution.",
            prerequisites: ["alg_linear_intercept"],
            nextSteps: [],
            estimatedMinutes: 45,
            icon: "🔗",
            associatedGame: "Battleship", // Coordinate logic
            gameWinCondition: 1 // Win 1 game
        }
    }
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
