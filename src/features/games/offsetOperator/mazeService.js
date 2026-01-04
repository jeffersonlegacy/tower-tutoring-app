/**
 * mazeService.js — Procedural 10×10 Maze Generator
 * Uses modified Depth-First Search with guaranteed path to exit
 */

const CELL_TYPES = {
    WALL: 0,
    PATH: 1,
    START: 2,
    EXIT: 3,
    TRAP: 4,
    JUNCTION: 5
};

const DIRECTIONS = [
    { dx: 0, dy: -2, name: 'up' },
    { dx: 0, dy: 2, name: 'down' },
    { dx: -2, dy: 0, name: 'left' },
    { dx: 2, dy: 0, name: 'right' }
];

/**
 * Shuffle array in place (Fisher-Yates)
 */
const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

/**
 * Generate a 10×10 maze using DFS
 * @returns {{ grid: number[][], start: {x,y}, exit: {x,y}, traps: {x,y}[], junctions: {x,y,directions:string[]}[] }}
 */
export const generateMaze = (size = 10) => {
    // Initialize grid with walls
    const grid = Array(size).fill(null).map(() => Array(size).fill(CELL_TYPES.WALL));
    const visited = Array(size).fill(null).map(() => Array(size).fill(false));

    // Start position (top-left corner, adjusted for odd coords)
    const start = { x: 1, y: 1 };
    grid[start.y][start.x] = CELL_TYPES.START;
    visited[start.y][start.x] = true;

    // DFS stack
    const stack = [start];
    const deadEnds = [];

    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const neighbors = [];

        // Find unvisited neighbors (2 cells away to leave wall between)
        for (const dir of shuffle([...DIRECTIONS])) {
            const nx = current.x + dir.dx;
            const ny = current.y + dir.dy;

            if (nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && !visited[ny][nx]) {
                neighbors.push({ x: nx, y: ny, wallX: current.x + dir.dx / 2, wallY: current.y + dir.dy / 2 });
            }
        }

        if (neighbors.length > 0) {
            // Pick random neighbor
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];

            // Carve path (remove wall between current and next)
            grid[next.wallY][next.wallX] = CELL_TYPES.PATH;
            grid[next.y][next.x] = CELL_TYPES.PATH;
            visited[next.y][next.x] = true;

            stack.push({ x: next.x, y: next.y });
        } else {
            // Dead end - backtrack
            const deadEnd = stack.pop();
            if (stack.length > 0) {
                deadEnds.push(deadEnd);
            }
        }
    }

    // Place exit at bottom-right area
    const exit = { x: size - 2, y: size - 2 };
    grid[exit.y][exit.x] = CELL_TYPES.EXIT;

    // Find junctions (cells with 3+ path neighbors)
    const junctions = [];
    for (let y = 1; y < size - 1; y++) {
        for (let x = 1; x < size - 1; x++) {
            if (grid[y][x] === CELL_TYPES.PATH || grid[y][x] === CELL_TYPES.START) {
                const pathDirs = [];
                if (y > 0 && grid[y - 1][x] !== CELL_TYPES.WALL) pathDirs.push('up');
                if (y < size - 1 && grid[y + 1][x] !== CELL_TYPES.WALL) pathDirs.push('down');
                if (x > 0 && grid[y][x - 1] !== CELL_TYPES.WALL) pathDirs.push('left');
                if (x < size - 1 && grid[y][x + 1] !== CELL_TYPES.WALL) pathDirs.push('right');

                if (pathDirs.length >= 3) {
                    grid[y][x] = CELL_TYPES.JUNCTION;
                    junctions.push({ x, y, directions: pathDirs });
                }
            }
        }
    }

    // Place traps on some dead ends (3-5 traps)
    const trapCount = Math.min(Math.floor(Math.random() * 3) + 3, deadEnds.length);
    const traps = [];
    const shuffledDeadEnds = shuffle([...deadEnds]);

    for (let i = 0; i < trapCount; i++) {
        const trap = shuffledDeadEnds[i];
        // Don't place trap on start or exit
        if ((trap.x !== start.x || trap.y !== start.y) &&
            (trap.x !== exit.x || trap.y !== exit.y)) {
            grid[trap.y][trap.x] = CELL_TYPES.TRAP;
            traps.push(trap);
        }
    }

    return { grid, start, exit, traps, junctions, size };
};

/**
 * Get valid movement directions from a cell
 */
export const getValidMoves = (grid, x, y) => {
    const size = grid.length;
    const moves = [];

    if (y > 0 && grid[y - 1][x] !== CELL_TYPES.WALL) moves.push('up');
    if (y < size - 1 && grid[y + 1][x] !== CELL_TYPES.WALL) moves.push('down');
    if (x > 0 && grid[y][x - 1] !== CELL_TYPES.WALL) moves.push('left');
    if (x < size - 1 && grid[y][x + 1] !== CELL_TYPES.WALL) moves.push('right');

    return moves;
};

/**
 * Apply movement direction
 */
export const applyMove = (x, y, direction) => {
    switch (direction) {
        case 'up': return { x, y: y - 1 };
        case 'down': return { x, y: y + 1 };
        case 'left': return { x: x - 1, y };
        case 'right': return { x: x + 1, y };
        default: return { x, y };
    }
};

export { CELL_TYPES };
