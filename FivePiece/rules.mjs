// Direct port of the repaired FivePiece.py. Axis order and AI ties are significant.
export const SIZE = 19;
export const Stone = Object.freeze({ EMPTY: 0, BLACK: 1, WHITE: 2 });
export const Outcome = Object.freeze({ ONGOING: 'ongoing', BLACK_WIN: 'black', WHITE_WIN: 'white', DRAW: 'draw' });
export const MoveError = Object.freeze({
    INVALID_PLAYER: 'invalid-player', OUT_OF_BOUNDS: 'outside', OCCUPIED: 'occupied',
    OVERLINE: 'overline', DOUBLE_FOUR: 'double-four', DOUBLE_THREE: 'double-three',
});
const { EMPTY, BLACK, WHITE } = Stone;
const axes = [[0, 1], [-1, 1], [-1, 0], [-1, -1]];
const WIN = 1000000;

export const newBoard = () => Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
export function opponent(player) {
    if (player === EMPTY) throw new RangeError('An empty square has no opponent');
    return player === BLACK ? WHITE : BLACK;
}
const step = ([r, c], [dr, dc], n = 1) => [r + dr * n, c + dc * n];
const at = (board, [r, c]) => board[r]?.[c] ?? null;
const key = point => point.join(',');
const groupKey = points => points.map(key).sort().join(';');

export function runLength(board, point, player, axis) {
    let length = 1;
    for (const sign of [1, -1]) {
        let distance = sign;
        while (at(board, step(point, axis, distance)) === player) {
            length++;
            distance += sign;
        }
    }
    return length;
}

const wins = (length, player) => length === 5 || (player === WHITE && length > 5);
export function ifwin(board) {
    for (const [r, row] of board.entries()) {
        for (const [c, player] of row.entries()) {
            if (player === EMPTY) continue;
            const point = [r, c];
            if (axes.some(axis => at(board, step(point, axis, -1)) !== player &&
                wins(runLength(board, point, player, axis), player))) return player;
        }
    }
    return EMPTY;
}

function* windows(point, axis, size) {
    for (let start = 1 - size; start <= 0; start++) {
        yield Array.from({ length: size }, (_, i) => step(point, axis, start + i));
    }
}

export function fourGroups(board, point, player) {
    const groups = new Map();
    for (const axis of axes) {
        for (const line of windows(point, axis, 5)) {
            const cells = line.map(cell => at(board, cell));
            if (cells.filter(cell => cell === player).length !== 4 || !cells.includes(EMPTY)) continue;
            const gap = cells.indexOf(EMPTY);
            const end = line[gap];
            if (!wins(runLength(board, end, player, axis), player)) continue;
            const group = groupKey(line.filter((_, i) => i !== gap));
            if (!groups.has(group)) groups.set(group, new Set());
            groups.get(group).add(key(end));
        }
    }
    return groups;
}

export function liveThreeGroups(board, point, player) {
    const groups = new Set();
    for (const axis of axes) {
        for (const line of windows(point, axis, 4)) {
            const cells = line.map(cell => at(board, cell));
            if (cells.filter(cell => cell === player).length !== 3 || !cells.includes(EMPTY)) continue;
            const gap = cells.indexOf(EMPTY);
            const extension = line[gap];
            const ends = [step(line[0], axis, -1), step(line[3], axis)];
            if (ends.some(end => at(board, end) !== EMPTY)) continue;
            const [r, c] = extension;
            board[r][c] = player;
            try {
                if (!ends.every(end => wins(runLength(board, end, player, axis), player))) continue;
                if (axes.some(ray => wins(runLength(board, extension, player, ray), player))) continue;
                if (player === BLACK && blackMoveError(board, extension) !== null) continue;
                groups.add(groupKey(line.filter((_, i) => i !== gap)));
                if (player === BLACK && groups.size >= 2) return groups;
            } finally {
                board[r][c] = EMPTY;
            }
        }
    }
    return groups;
}

function blackMoveError(board, point) {
    const lengths = axes.map(axis => runLength(board, point, BLACK, axis));
    if (lengths.includes(5)) return null;
    if (Math.max(...lengths) > 5) return MoveError.OVERLINE;
    if (fourGroups(board, point, BLACK).size >= 2) return MoveError.DOUBLE_FOUR;
    if (liveThreeGroups(board, point, BLACK).size >= 2) return MoveError.DOUBLE_THREE;
    return null;
}

export function moveError(board, point, player) {
    if (player !== BLACK && player !== WHITE) return MoveError.INVALID_PLAYER;
    const cell = at(board, point);
    if (cell === null) return MoveError.OUT_OF_BOUNDS;
    if (cell !== EMPTY) return MoveError.OCCUPIED;
    if (player === WHITE) return null;
    const [r, c] = point;
    board[r][c] = player;
    try {
        return blackMoveError(board, point);
    } finally {
        board[r][c] = EMPTY;
    }
}

export function outcomeAfterMove(board, point, player) {
    if (axes.some(axis => wins(runLength(board, point, player, axis), player))) {
        return player === BLACK ? Outcome.BLACK_WIN : Outcome.WHITE_WIN;
    }
    return board.every(row => !row.includes(EMPTY)) ? Outcome.DRAW : Outcome.ONGOING;
}

export function tryMove(board, point, player) {
    const err = moveError(board, point, player);
    if (err !== null) return { outcome: null, err };
    const [r, c] = point;
    board[r][c] = player;
    return { outcome: outcomeAfterMove(board, point, player), err: null };
}

function threatScore(board, point, player) {
    const lengths = axes.map(axis => runLength(board, point, player, axis));
    if (lengths.some(length => wins(length, player))) return WIN;
    const fours = fourGroups(board, point, player);
    const threes = liveThreeGroups(board, point, player);
    if (fours.size >= 2 || [...fours.values()].some(ends => ends.size >= 2)) return 8000;
    if (fours.size && threes.size) return 7000;
    return 500 * (fours.size + threes.size) +
        lengths.reduce((sum, length) => sum + 2 ** Math.min(length, 4), 0);
}

export function basicScore(board, point, player) {
    const [r, c] = point;
    let attack;
    board[r][c] = player;
    try {
        attack = threatScore(board, point, player);
        if (attack === WIN) return attack;
    } finally {
        board[r][c] = EMPTY;
    }
    const other = opponent(player);
    if (moveError(board, point, other) !== null) return attack;
    board[r][c] = other;
    try {
        const defense = threatScore(board, point, other);
        return attack + (defense === WIN ? WIN / 2 : Math.floor(defense * 9 / 10));
    } finally {
        board[r][c] = EMPTY;
    }
}

function* legalPoints(board, player) {
    for (const [r, row] of board.entries()) {
        for (const [c, cell] of row.entries()) {
            if (cell === EMPTY && moveError(board, [r, c], player) === null) yield [r, c];
        }
    }
}

function minimax(board, point, player, depth) {
    const score = basicScore(board, point, player);
    if (depth <= 0 || score === WIN) return score;
    const [r, c] = point;
    board[r][c] = player;
    try {
        if (outcomeAfterMove(board, point, player) === Outcome.DRAW) return 0;
        const other = opponent(player);
        let reply = -Infinity;
        for (const candidate of legalPoints(board, other)) {
            reply = Math.max(reply, minimax(board, candidate, other, depth - 1));
        }
        return reply === WIN ? -WIN : score - (reply === -Infinity ? 0 : reply);
    } finally {
        board[r][c] = EMPTY;
    }
}

export function chooseMove(board, player, depth = 0) {
    let best = null;
    let bestScore = -Infinity;
    for (const point of legalPoints(board, player)) {
        const score = minimax(board, point, player, depth);
        if (score > bestScore) {
            best = point;
            bestScore = score;
        }
    }
    return best;
}

export function openingMove(board, player) {
    const center = Math.floor(board.length / 2);
    for (const r of [center - 1, center + 1]) {
        for (const c of [center - 1, center + 1]) {
            if (moveError(board, [r, c], player) === null) return [r, c];
        }
    }
    return null;
}
