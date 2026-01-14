/**
 * CheckersLogic.js
 * Pure functional core for Checkers
 */

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
export const PLAYER = { RED: 1, WHITE: 2 };
export const PIECE = { RED: 1, WHITE: 2, RED_KING: 3, WHITE_KING: 4 };
export const BOARD_SIZE = 8;
const EMPTY = 0;

// Directions for movement: [rowDiff, colDiff]
const MOVES = {
    [PIECE.RED]: [[1, -1], [1, 1]], // Red moves DOWN (positive row)
    [PIECE.WHITE]: [[-1, -1], [-1, 1]], // White moves UP (negative row)
    [PIECE.RED_KING]: [[1, -1], [1, 1], [-1, -1], [-1, 1]],
    [PIECE.WHITE_KING]: [[1, -1], [1, 1], [-1, -1], [-1, 1]]
};

// ═══════════════════════════════════════════════════════════════
// BOARD HELPERS
// ═══════════════════════════════════════════════════════════════

export const createBoard = () => {
    const board = Array(64).fill(EMPTY);
    // Setup Red (Player) on top (indices 0-23) - Wait, standard checkers:
    // Usually Player starts at bottom (Index 40-63) moving UP? 
    // Let's stick to: Red (1) at top (0-2), moving DOWN. White (2) at bottom (5-7), moving UP.
    // Red = 1 (Computer/P2), White = 2 (Player/P1). 
    // Actually, usually Player is "Red" and moves UP. Let's flip standard logic to match UI usually.
    // Let's say: 
    // RED (1) = Top (Computer), moves DOWN (+row)
    // WHITE (2) = Bottom (Player), moves UP (-row)
    
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if ((r + c) % 2 === 1) { // Dark squares only
                const idx = r * BOARD_SIZE + c;
                if (r < 3) board[idx] = PIECE.RED;
                else if (r > 4) board[idx] = PIECE.WHITE;
            }
        }
    }
    return board;
};

export const getPieceOwner = (piece) => {
    if (piece === PIECE.RED || piece === PIECE.RED_KING) return PLAYER.RED;
    if (piece === PIECE.WHITE || piece === PIECE.WHITE_KING) return PLAYER.WHITE;
    return null;
};

export const isKing = (piece) => piece === PIECE.RED_KING || piece === PIECE.WHITE_KING;

const isValidPos = (r, c) => r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;

// ═══════════════════════════════════════════════════════════════
// MOVE LOGIC
// ═══════════════════════════════════════════════════════════════

/**
 * Returns list of valid moves for a player.
 * A move object: { from, to, isJump, jumpDest, jumpPieceIdx }
 * IF forced jumps exist, ONLY returns jumps.
 */
export const getValidMoves = (board, player) => {
    let moves = [];
    let jumps = [];

    for (let i = 0; i < 64; i++) {
        const piece = board[i];
        if (piece === EMPTY || getPieceOwner(piece) !== player) continue;

        const r = Math.floor(i / BOARD_SIZE);
        const c = i % BOARD_SIZE;
        const possibleDirs = MOVES[piece];

        for (const [dr, dc] of possibleDirs) {
            // Check Simple Move
            const nr = r + dr, nc = c + dc;
            if (isValidPos(nr, nc)) {
                const nIdx = nr * BOARD_SIZE + nc;
                if (board[nIdx] === EMPTY) {
                    moves.push({ from: i, to: nIdx, isJump: false });
                }
            }

            // Check Jump
            const jr = r + 2 * dr, jc = c + 2 * dc; // Landing spot
            const mr = r + dr, mc = c + dc; // Middle spot (piece to capture)
            
            if (isValidPos(jr, jc)) {
                const jIdx = jr * BOARD_SIZE + jc;
                const mIdx = mr * BOARD_SIZE + mc;
                const midPiece = board[mIdx];
                
                if (board[jIdx] === EMPTY && midPiece !== EMPTY && getPieceOwner(midPiece) !== player) {
                    jumps.push({ from: i, to: jIdx, isJump: true, capturedIdx: mIdx, capturedPiece: midPiece });
                }
            }
        }
    }

    // Force Jump Rule: If any jump is available, you MUST take it (unless we want to relax this for kids?)
    // Relaxed rule for kids: Jumps are optional? No, standard checkers is better for logic.
    // Let's implement STANDARD rules: Forced Jumps.
    return jumps.length > 0 ? jumps : moves;
};

export const makeMove = (board, move) => {
    const newBoard = [...board];
    const piece = newBoard[move.from];
    newBoard[move.from] = EMPTY;
    newBoard[move.to] = piece;

    // Handle Capture
    if (move.isJump) {
        newBoard[move.capturedIdx] = EMPTY;
    }

    // Handle King Promotion
    const r = Math.floor(move.to / BOARD_SIZE);
    if (piece === PIECE.WHITE && r === 0) newBoard[move.to] = PIECE.WHITE_KING;
    else if (piece === PIECE.RED && r === 7) newBoard[move.to] = PIECE.RED_KING;

    return newBoard;
};

// ═══════════════════════════════════════════════════════════════
// AI LOGIC (MINIMAX)
// ═══════════════════════════════════════════════════════════════

const evaluateBoard = (board) => {
    let score = 0;
    for (let i = 0; i < 64; i++) {
        const p = board[i];
        if (p === EMPTY) continue;
        
        // Material
        let val = 0;
        if (p === PIECE.RED) val = 10;
        if (p === PIECE.WHITE) val = -10;
        if (p === PIECE.RED_KING) val = 30; // Kings worth more
        if (p === PIECE.WHITE_KING) val = -30;

        // Positioning (Bonus for being central or advanced)
        // Light positional code here...
        
        score += val;
    }
    return score;
};

export const getAIMove = (board, difficulty = 2) => {
    // Red (1) is Maximizing (Positive Score)
    const [bestScore, bestMove] = minimax(board, difficulty, -Infinity, Infinity, true);
    return bestMove;
};

// Returns [score, move]
const minimax = (board, depth, alpha, beta, maximizing) => {
    if (depth === 0) return [evaluateBoard(board), null];

    const player = maximizing ? PLAYER.RED : PLAYER.WHITE;
    const validMoves = getValidMoves(board, player);

    // Terminal State (No moves = Loss)
    if (validMoves.length === 0) {
        return maximizing ? [-1000, null] : [1000, null];
    }

    let bestMove = validMoves[0];

    if (maximizing) {
        let maxEval = -Infinity;
        for (const move of validMoves) {
            const nextBoard = makeMove(board, move);
            const [evalScore] = minimax(nextBoard, depth - 1, alpha, beta, false);
            
            // Should add a Multi-Jump logic here? (Standard checkers allows double jumps)
            // For simplicity in V1, we turn passes automatically, or we recurse for double jumps?
            // "Easy to use" -> Let's stick to single moves per turn initially for AI simplicity, 
            // OR fully implement multi-jump recursion. 
            // Multi-jump is complex to standard Minimax properly without "Turn extension".
            // Let's implement Turn Extension Check: If isJump, check if the SAME piece can jump again.
            // If so, continue turn. 
            // For MVP/Kids -> Single jumps are "easier to start". 
            // Let's stick to Single Turn for strict AI MVP to avoid infinite recursion bugs.
            
            if (evalScore > maxEval) {
                maxEval = evalScore;
                bestMove = move;
            }
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return [maxEval, bestMove];
    } else {
        let minEval = Infinity;
        for (const move of validMoves) {
            const nextBoard = makeMove(board, move);
            const [evalScore] = minimax(nextBoard, depth - 1, alpha, beta, true);
            if (evalScore < minEval) {
                minEval = evalScore;
                bestMove = move;
            }
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return [minEval, bestMove];
    }
};
