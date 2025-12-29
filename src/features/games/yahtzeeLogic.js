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

export const calculateScore = (diceValues, category) => {
    // Ensure diceValues is array of numbers
    // Sometimes dice is array of objects {value, held}
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
                if (cons >= 3) return 30; // Small straight is 4 in a row! Wait.
                // Standard Yahtzee: Small Straight is 4 dice. (e.g. 1-2-3-4).
                // My old logic said `cons >= 3`? 
                // index 0->1 (cons=1), 1->2 (cons=2), 2->3 (cons=3). 3 intervals = 4 numbers. Correct.
            }
            return 0;
        }
        case 'lg_straight': {
            const u = [...new Set(safeValues)].sort((a, b) => a - b);
            let cons = 0;
            for (let i = 0; i < u.length - 1; i++) {
                if (u[i + 1] === u[i] + 1) cons++; else cons = 0;
                if (cons >= 4) return 40; // 5 dice in row. 4 intervals. Correct.
            }
            return 0;
        }
        case 'yahtzee': return countValues.includes(5) ? 50 : 0;
        case 'chance': return sum;
        default: return 0;
    }
};
