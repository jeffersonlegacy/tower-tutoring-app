// Standard Yahtzee Categories
export const CATEGORIES = [
    { id: 'ones', label: 'Ones', desc: 'Sum 1s' },
    { id: 'twos', label: 'Twos', desc: 'Sum 2s' },
    { id: 'threes', label: 'Threes', desc: 'Sum 3s' },
    { id: 'fours', label: 'Fours', desc: 'Sum 4s' },
    { id: 'fives', label: 'Fives', desc: 'Sum 5s' },
    { id: 'sixes', label: 'Sixes', desc: 'Sum 6s' },
    { id: 'three_kind', label: '3 of Kind', desc: 'Sum All' },
    { id: 'four_kind', label: '4 of Kind', desc: 'Sum All' },
    { id: 'full_house', label: 'Full House', desc: '25 Pts' },
    { id: 'sm_straight', label: 'Sm Str.', desc: '30 Pts' },
    { id: 'lg_straight', label: 'Lg Str.', desc: '40 Pts' },
    { id: 'yahtzee', label: 'YAHTZEE', desc: '50 Pts' },
    { id: 'chance', label: 'Chance', desc: 'Sum All' },
];

// MINIZEE Mode Categories (3 dice with values 1-3)
export const MINIZEE_CATEGORIES = [
    { id: 'sequence', label: 'Sequence', desc: '1-2-3 = 10 pts', icon: '📈' },
    { id: 'three_kind_mini', label: '3 of Kind', desc: 'Sum all dice', icon: '🎯' },
    { id: 'sum_choice', label: 'Number Sum', desc: 'Pick 1, 2, or 3', icon: '🔢' },
];

// Roll a Minizee die (1-3 only)
export const rollMinizeeDie = () => Math.floor(Math.random() * 3) + 1;

// Roll a standard die (1-6)
export const rollStandardDie = () => Math.floor(Math.random() * 6) + 1;

// Calculate Minizee score
export const calculateMinizeeScore = (diceValues, category, chosenNumber = null) => {
    const safeValues = diceValues.map(d => typeof d === 'number' ? d : d.value);
    const counts = {};
    let sum = 0;
    safeValues.forEach(v => { counts[v] = (counts[v] || 0) + 1; sum += v; });

    switch (category) {
        case 'sequence':
            // Must have exactly 1, 2, 3
            return (counts[1] >= 1 && counts[2] >= 1 && counts[3] >= 1) ? 10 : 0;
        case 'three_kind_mini':
            // All three dice same value
            return Object.values(counts).some(c => c >= 3) ? sum : 0;
        case 'sum_choice':
            // Sum of chosen number (1, 2, or 3)
            if (chosenNumber && [1, 2, 3].includes(chosenNumber)) {
                return (counts[chosenNumber] || 0) * chosenNumber;
            }
            return 0;
        case 'pass':
            return 0;
        default:
            return 0;
    }
};

// Standard Yahtzee scoring
export const calculateScore = (diceValues, category) => {
    const safeValues = diceValues.map(d => typeof d === 'number' ? d : d.value);

    const counts = {};
    let sum = 0;
    safeValues.forEach(v => { counts[v] = (counts[v] || 0) + 1; sum += v; });
    const countValues = Object.values(counts);

    switch (category) {
        case 'ones': return (counts[1] || 0) * 1;
        case 'twos': return (counts[2] || 0) * 2;
        case 'threes': return (counts[3] || 0) * 3;
        case 'fours': return (counts[4] || 0) * 4;
        case 'fives': return (counts[5] || 0) * 5;
        case 'sixes': return (counts[6] || 0) * 6;
        case 'three_kind': return countValues.some(c => c >= 3) ? sum : 0;
        case 'four_kind': return countValues.some(c => c >= 4) ? sum : 0;
        case 'full_house': return (countValues.includes(3) && countValues.includes(2)) || countValues.includes(5) ? 25 : 0;
        case 'sm_straight': {
            const u = [...new Set(safeValues)].sort((a, b) => a - b);
            let cons = 0;
            for (let i = 0; i < u.length - 1; i++) {
                if (u[i + 1] === u[i] + 1) cons++; else cons = 0;
                if (cons >= 3) return 30;
            }
            return 0;
        }
        case 'lg_straight': {
            const u = [...new Set(safeValues)].sort((a, b) => a - b);
            let cons = 0;
            for (let i = 0; i < u.length - 1; i++) {
                if (u[i + 1] === u[i] + 1) cons++; else cons = 0;
                if (cons >= 4) return 40;
            }
            return 0;
        }
        case 'yahtzee': return countValues.includes(5) ? 50 : 0;
        case 'chance': return sum;
        default: return 0;
    }
};
