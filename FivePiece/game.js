import { SIZE, Stone, Outcome, MoveError, newBoard, boardCenter, opponent, moveError, tryMove, openingMove } from './rules.mjs';

const { BLACK, WHITE } = Stone;
const STORAGE_KEY = 'fivepiece.matches.v1';
const byId = id => document.getElementById(id);
const board = byId('board');
let gridRows = 0;
let gridCols = 0;
const form = byId('settings');
const selectedSide = () => Number(form.elements.side.value);
const humanName = byId('human-name');
const blackName = byId('black-name');
const whiteName = byId('white-name');
const filter = byId('filter');
const mode = () => new FormData(form).get('mode');
const colorName = player => player === BLACK ? '黑' : '白';
const winner = outcome => outcome === Outcome.BLACK_WIN ? BLACK : outcome === Outcome.WHITE_WIN ? WHITE : null;
const rejection = {
    [MoveError.OUT_OF_BOUNDS]: '超出棋盘范围',
    [MoveError.OCCUPIED]: '这里已有棋子',
    [MoveError.INVALID_PLAYER]: '执棋颜色无效',
    [MoveError.OVERLINE]: '黑棋禁手 · 长连',
    [MoveError.DOUBLE_FOUR]: '黑棋禁手 · 双四',
    [MoveError.DOUBLE_THREE]: '黑棋禁手 · 双三',
};
const spacing = 38;
const margin = 38;

let screen = 'menu';
let match = null;
let replay = null;
let cursor = null;
let message = '';
let records = loadRecords();
let watchTimer;
let watchAuto = false;
let search = null;

function loadRecords() {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
        return Array.isArray(stored) ? stored.filter(record =>
            record && typeof record.names?.[BLACK] === 'string' && typeof record.names?.[WHITE] === 'string' &&
            ['single', 'double'].includes(record.mode) && Array.isArray(record.moves)) : [];
    } catch {
        byId('storage-warning').hidden = false;
        return [];
    }
}

function storeResult(game) {
    records.unshift({
        mode: game.mode, names: game.names, human: game.human, outcome: game.outcome,
        rows: game.board.length, cols: game.board[0].length,
        moves: game.moves.slice(), time: new Date().toISOString(),
    });
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        byId('storage-warning').hidden = true;
    } catch {
        byId('storage-warning').hidden = false;
    }
    renderRecords();
}

function resultLabel(game) {
    const player = winner(game.outcome);
    if (player !== null) return `${game.names[player]}（${colorName(player)}）获胜`;
    if (game.searchFailed) return '电脑搜索失败';
    return game.outcome === Outcome.DRAW ? '和棋' : '电脑无合法落点';
}

function makeElement(tag, value, className) {
    const node = document.createElement(tag);
    node.textContent = value;
    if (className) node.className = className;
    return node;
}

function renderRecords() {
    const selected = records.filter(record => filter.value === 'all' || record.mode === filter.value);
    byId('history-empty').hidden = selected.length > 0;
    byId('history-list').replaceChildren(...selected.map(record => {
        const row = document.createElement('li');
        const info = document.createElement('div');
        const players = `黑 ${record.names[BLACK]} · 白 ${record.names[WHITE]}`;
        const kind = record.mode === 'single' ? `单人 · 玩家执${colorName(record.human)}` : '双人';
        const time = new Date(record.time).toLocaleString('zh-CN');
        info.append(makeElement('strong', resultLabel(record)),
            makeElement('p', `${players} · ${kind} · ${record.moves.length} 手 · ${time}`, 'record-meta'));
        const action = makeElement('button', '回放');
        action.type = 'button';
        action.onclick = () => {
            replay = { record, index: record.moves.length };
            cursor = null;
            showScreen('arena');
        };
        row.append(info, action);
        return row;
    }));

    renderScores();
    if (screen === 'setup') renderSetupRecords();
}

function pairKey(names) {
    return JSON.stringify([names[BLACK], names[WHITE]].sort());
}

function scoreRecord(scores, record) {
    const won = winner(record.outcome);
    for (const player of [BLACK, WHITE]) {
        const name = record.names[player];
        if (!scores.has(name)) scores.set(name, { wins: 0, draws: 0, losses: 0, points: 0 });
        const score = scores.get(name);
        if (won === player) { score.wins++; score.points += 3; }
        else if (won === null) { score.draws++; score.points++; }
        else score.losses++;
    }
}

function countsForScore(record) {
    return winner(record.outcome) !== null || record.outcome === Outcome.DRAW;
}

function renderScores() {
    const scoreMode = byId('score-mode').value;
    const pairs = new Map();
    for (const record of records) {
        if (record.mode !== scoreMode || !countsForScore(record)) continue;
        const key = pairKey(record.names);
        if (!pairs.has(key)) pairs.set(key, new Map());
        scoreRecord(pairs.get(key), record);
    }
    const selector = byId('score-pair');
    const previous = selector.value;
    selector.replaceChildren(...[...pairs.keys()].map(pairKey =>
        new Option(JSON.parse(pairKey).join(' 对 '), pairKey)));
    if (pairs.has(previous)) selector.value = previous;
    byId('score-pair-field').hidden = pairs.size === 0;
    const scores = pairs.get(selector.value) ?? new Map();
    renderScoreTable(scores, 'score-table', 'score-body');
    byId('score-empty').hidden = scores.size > 0;
}

function renderScoreTable(scores, tableId, bodyId) {
    const ranking = [...scores].sort(([a, x], [b, y]) =>
        y.points - x.points || y.wins - x.wins || a.localeCompare(b, 'zh-CN'));
    byId(tableId).hidden = ranking.length === 0;
    byId(bodyId).replaceChildren(...ranking.map(([name, score]) => {
        const row = document.createElement('tr');
        for (const value of [name, score.wins, score.draws, score.losses, score.points]) row.append(makeElement('td', value));
        return row;
    }));
}

function configuredNames(human) {
    if (human !== null) {
        return { [human]: humanName.value.trim() || '玩家', [opponent(human)]: '电脑' };
    }
    return { [BLACK]: blackName.value.trim() || '玩家一', [WHITE]: whiteName.value.trim() || '玩家二' };
}

function renderSetupRecords() {
    const kind = mode();
    const key = pairKey(configuredNames(kind === 'single' ? selectedSide() : null));
    const matching = records.filter(record => record.mode === kind && pairKey(record.names) === key);
    const scores = new Map();
    for (const record of matching) {
        if (countsForScore(record)) scoreRecord(scores, record);
    }
    renderScoreTable(scores, 'setup-score-table', 'setup-score-body');
    byId('setup-empty').hidden = matching.length > 0;
    byId('setup-recent').replaceChildren(...matching.slice(0, 3).map(record =>
        makeElement('li', `${resultLabel(record)} · ${record.moves.length} 手`)));
}

function syncSettings() {
    const single = mode() === 'single';
    const watching = mode() === 'watch';
    if (single) whiteName.setCustomValidity('');
    else humanName.setCustomValidity('');
    byId('side-field').hidden = !single;
    byId('human-name-field').hidden = !single;
    byId('names').hidden = single || watching;
    byId('human-depth-field').hidden = !single;
    byId('watch-depth-fields').hidden = !watching;
    byId('setup').querySelector('.setup-records').hidden = watching;
    syncBoardSize();
    renderSetupRecords();
}

function showScreen(next) {
    if (next !== 'arena' || replay) pauseWatch();
    screen = next;
    for (const id of ['menu', 'setup', 'arena', 'history']) byId(id).hidden = id !== screen;
    byId('resume').hidden = !match;
    render();
}

function openSetup(kind) {
    byId('mode').value = kind;
    byId('setup-title').textContent = kind === 'single' ? '人机对弈' : kind === 'watch' ? '观赏模式' : '双人对弈';
    whiteName.setCustomValidity('');
    syncSettings();
    showScreen('setup');
}

function leaveBoard() {
    const fromReplay = replay !== null;
    replay = null;
    cursor = null;
    showScreen(fromReplay ? 'history' : 'menu');
}

byId('single-mode').onclick = () => openSetup('single');
byId('double-mode').onclick = () => openSetup('double');
byId('history-button').onclick = () => showScreen('history');
byId('result-history').onclick = () => showScreen('history');
byId('rematch').onclick = () => openSetup(match.mode);
byId('watch-mode').onclick = () => openSetup('watch');
byId('resume').onclick = () => showScreen('arena');
byId('leave-board').onclick = leaveBoard;
document.querySelectorAll('[data-menu]').forEach(button => {
    button.onclick = () => showScreen('menu');
});
function syncBoardSize() {
    const custom = form.elements['board-size'].value === 'custom';
    byId('custom-size').hidden = !custom;
    byId('board-rows').disabled = !custom;
    byId('board-cols').disabled = !custom;
}

function configuredBoard() {
    if (form.elements['board-size'].value === 'standard') return newBoard();
    return newBoard(byId('board-rows').valueAsNumber, byId('board-cols').valueAsNumber);
}

form.elements['board-size'].forEach(input => input.addEventListener('change', syncBoardSize));
form.addEventListener('input', renderSetupRecords);
humanName.addEventListener('input', () => humanName.setCustomValidity(''));
for (const field of [blackName, whiteName]) {
    field.addEventListener('input', () => whiteName.setCustomValidity(''));
}
byId('swap').onclick = () => {
    [blackName.value, whiteName.value] = [whiteName.value, blackName.value];
    whiteName.setCustomValidity('');
    renderSetupRecords();
};

form.addEventListener('submit', event => {
    event.preventDefault();
    if (mode() === 'watch') { startWatch(); return; }
    const single = mode() === 'single';
    const human = single ? selectedSide() : null;
    const names = configuredNames(human);
    if (names[BLACK] === names[WHITE]) {
        const field = single ? humanName : whiteName;
        field.setCustomValidity(single ? '请选择与电脑不同的名字。' : '请输入不同的名字以区分两位棋手。');
        field.reportValidity();
        return;
    }
    if (match?.moves.length && match.mode !== 'watch' && match.outcome === Outcome.ONGOING && !match.stalled &&
        !window.confirm('结束当前未完成的对局，开始新局？')) return;
    cancelSearch();
    match = {
        depth: Number(form.elements['human-depth'].value),
        board: configuredBoard(), mode: single ? 'single' : 'double', human, names,
        player: BLACK, moves: [], outcome: Outcome.ONGOING, opening: true, busy: false, stalled: false,
    };
    replay = null;
    cursor = null;
    message = '';
    if (human === WHITE) {
        play(match, boardCenter(match.board.length, match.board[0].length), BLACK);
        match.player = WHITE;
    }
    showScreen('arena');
});

function pauseWatch() {
    clearTimeout(watchTimer);
    watchAuto = false;
    if (search?.game.mode === 'watch') cancelSearch();
}

function startWatch() {
    if (match?.moves.length && match.mode !== 'watch' && match.outcome === Outcome.ONGOING &&
        !match.stalled && !window.confirm('结束当前未完成的对局，开始观赏？')) return;
    pauseWatch();
    cancelSearch();
    match = {
        depths: { [BLACK]: Number(form.elements['black-depth'].value), [WHITE]: Number(form.elements['white-depth'].value) },
        board: configuredBoard(), mode: 'watch', names: { [BLACK]: '电脑一', [WHITE]: '电脑二' },
        player: BLACK, moves: [], outcome: Outcome.ONGOING, stalled: false,
    };
    replay = null;
    cursor = null;
    message = '';
    showScreen('arena');
}

function canAdvanceWatch() {
    return screen === 'arena' && !replay && match?.mode === 'watch' &&
        match.outcome === Outcome.ONGOING && !match.stalled;
}

function scheduleWatch() {
    clearTimeout(watchTimer);
    if (watchAuto && canAdvanceWatch()) {
        watchTimer = setTimeout(advanceWatch, 800 / Number(byId('watch-speed').value));
    }
}

function advanceWatch() {
    if (!canAdvanceWatch() || match.busy) return;
    const game = match;
    const point = game.moves.length === 0 ? boardCenter(game.board.length, game.board[0].length) :
        game.moves.length === 1 ? openingMove(game.board, game.player) : null;
    if (point !== null) finishWatchMove(game, point);
    else searchMove(game, game.player, game.depths[game.player], result => finishWatchMove(game, result));
}

function finishWatchMove(game, point) {
    game.stalled = point === null || play(game, point, game.player) !== null;
    if (canAdvanceWatch()) game.player = opponent(game.player);
    else pauseWatch();
    render();
    scheduleWatch();
}

function cancelSearch() {
    if (!search) return;
    search.worker.terminate();
    search.game.busy = false;
    search = null;
}

function searchMove(game, player, depth, finish) {
    const worker = new Worker(new URL('./search-worker.mjs', import.meta.url), { type: 'module' });
    search = { worker, game };
    game.busy = true;
    game.progress = 0;
    worker.onmessage = ({ data }) => {
        if (search?.worker !== worker) return;
        if (data.progress !== undefined) {
            game.progress = data.progress;
            renderThinking(game);
            return;
        }
        cancelSearch();
        finish(data.point);
    };
    worker.onerror = () => {
        if (search?.worker !== worker) return;
        cancelSearch();
        game.searchFailed = true;
        finish(null);
    };
    worker.postMessage({ board: game.board, player, depth });
    render();
}

function removeLastMove(game) {
    const [row, col, player] = game.moves.pop();
    game.board[row][col] = Stone.EMPTY;
    game.player = player;
    game.outcome = Outcome.ONGOING;
    game.stalled = false;
    game.searchFailed = false;
    message = '';
}

function undoCount(game) {
    if (!game || replay || game.mode === 'watch' || game.outcome !== Outcome.ONGOING ||
        game.busy || game.stalled) return 0;
    if (game.mode === 'double') return Math.min(game.moves.length, 1);
    const opening = game.human === WHITE ? 1 : 0;
    return game.moves.length >= opening + 2 ? 2 : 0;
}

byId('undo').onclick = () => {
    const count = undoCount(match);
    if (!count) return;
    for (let i = 0; i < count; i++) removeLastMove(match);
    if (match.mode === 'single') {
        match.opening = match.moves.length === (match.human === WHITE ? 1 : 0);
    }
    render();
};
byId('watch-previous').onclick = () => {
    if (replay || match?.mode !== 'watch' || !match.moves.length) return;
    pauseWatch();
    removeLastMove(match);
    render();
};
byId('watch-next').onclick = advanceWatch;
byId('watch-auto').onclick = () => {
    if (watchAuto) pauseWatch();
    else watchAuto = true;
    scheduleWatch();
    render();
};
byId('watch-speed').onchange = scheduleWatch;

function play(game, point, player) {
    const { outcome, err } = tryMove(game.board, point, player);
    if (err !== null) return err;
    game.moves.push([...point, player]);
    game.outcome = outcome;
    if (outcome !== Outcome.ONGOING && game.mode !== 'watch') storeResult(game);
    return null;
}

function computerReply(game) {
    const player = opponent(game.human);
    const opening = game.opening ? openingMove(game.board, player) : null;
    game.opening = false;
    const finish = point => {
        game.stalled = point === null || play(game, point, player) !== null;
        game.busy = false;
        if (game.stalled && !game.searchFailed) storeResult(game);
        render();
    };
    if (opening !== null) finish(opening);
    else searchMove(game, player, game.depth, finish);
}

function canPlay() {
    return screen === 'arena' && match && match.mode !== 'watch' && !replay && !match.busy && !match.stalled && match.outcome === Outcome.ONGOING;
}

function place(point) {
    if (!canPlay()) return;
    const game = match;
    const err = play(game, point, game.player);
    message = err === null ? '' : rejection[err];
    if (err === null && game.outcome === Outcome.ONGOING) {
        if (game.mode === 'double') game.player = opponent(game.player);
        else {
            game.busy = true;
            setTimeout(() => { if (match === game) computerReply(game); }, 35);
        }
    }
    render();
}

function vector(tag, attributes, label) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
    if (label !== undefined) node.textContent = label;
    return node;
}

function marker(row, col, radius, fill, stroke = 'none', width = 1) {
    return vector('circle', {
        cx: margin + col * spacing, cy: margin + row * spacing, r: radius,
        fill, stroke, 'stroke-width': width,
    });
}

function starIndices(size, center) {
    return Array.from({ length: size }, (_, index) => index)
        .filter(index => (index - center) % 6 === 0);
}

function columnLabel(index) {
    let label = '';
    for (let number = index + 1; number > 0; number = Math.floor((number - 1) / 26)) {
        label = String.fromCharCode(65 + (number - 1) % 26) + label;
    }
    return label;
}

function drawGrid(rows, cols) {
    if (rows === gridRows && cols === gridCols) return;
    gridRows = rows;
    gridCols = cols;
    const width = (cols - 1) * spacing + 2 * margin;
    const height = (rows - 1) * spacing + 2 * margin;
    board.setAttribute('viewBox', `0 0 ${width} ${height}`);
    board.style.setProperty('--board-ratio', width / height);
    board.setAttribute('aria-label', `${cols}×${rows} 棋盘，可用方向键定位、回车落子`);
    const grid = byId('board-grid');
    const lines = [];
    const labels = vector('g', {
        fill: '#664d30', 'font-family': 'system-ui, sans-serif', 'font-size': 14,
        'text-anchor': 'middle', 'dominant-baseline': 'central',
    });
    for (let r = 0; r < rows; r++) {
        const pos = margin + r * spacing;
        lines.push(`M${margin} ${pos}H${width - margin}`);
        labels.append(vector('text', { x: 18, y: pos }, String(r + 1)));
    }
    for (let c = 0; c < cols; c++) {
        const pos = margin + c * spacing;
        lines.push(`M${pos} ${margin}V${height - margin}`);
        labels.append(vector('text', { x: pos, y: 18 }, columnLabel(c)));
    }
    grid.replaceChildren(vector('path', {
        d: lines.join(' '), fill: 'none', stroke: '#92744c',
        'stroke-width': 1, 'vector-effect': 'non-scaling-stroke',
    }), labels);
    const [centerRow, centerCol] = boardCenter(rows, cols);
    for (const row of starIndices(rows, centerRow)) {
        for (const col of starIndices(cols, centerCol)) grid.append(marker(row, col, 3.5, '#745638'));
    }
}

let drawnMoves = [];
let showMoveNumbers = false;
let drawnMoveNumbers = false;
function renderBoard(moves) {
    if (showMoveNumbers !== drawnMoveNumbers || moves.length !== drawnMoves.length ||
        moves.some((move, i) => move !== drawnMoves[i])) {
        const stones = moves.map(([r, c, player]) => player === BLACK
            ? marker(r, c, 15.5, '#242424')
            : marker(r, c, 15.5, '#fffaf0', '#9e8464'));
        if (showMoveNumbers) {
            moves.forEach(([r, c, player], index) => {
                stones.push(vector('text', {
                    x: margin + c * spacing, y: margin + r * spacing,
                    fill: player === BLACK ? '#fff6e6' : '#282623',
                    'font-family': 'system-ui, sans-serif', 'font-size': 12, 'font-weight': 600,
                    'text-anchor': 'middle', 'dominant-baseline': 'central',
                    'pointer-events': 'none',
                }, String(index + 1)));
            });
        }
        if (moves.length) {
            const [r, c] = moves.at(-1);
            stones.push(marker(r, c, 17.5, 'none', '#a8231a', 3));
        }
        byId('board-stones').replaceChildren(...stones);
        drawnMoves = moves.slice();
        drawnMoveNumbers = showMoveNumbers;
    }
    const overlay = byId('board-cursor');
    overlay.replaceChildren();
    if (cursor && canPlay() && match.board[cursor[0]][cursor[1]] === Stone.EMPTY) {
        const err = moveError(match.board, cursor, match.player);
        overlay.append(marker(...cursor, 13, 'none', err ? '#a12727' : '#464646', 2));
    }
}

function renderThinking(game) {
    if (screen !== 'arena' || replay || match !== game || !game.busy) return;
    byId('thinking-progress').value = game.progress ?? 0;
    byId('thinking-percent').textContent = `${game.progress ?? 0}%`;
}

function render() {
    if (screen !== 'arena') return;
    const game = replay?.record ?? match;
    const moves = replay ? game.moves.slice(0, replay.index) : game?.moves ?? [];
    drawGrid(game.board?.length ?? game.rows ?? SIZE, game.board?.[0].length ?? game.cols ?? SIZE);
    renderBoard(moves);
    const activePlayer = !replay && game.outcome === Outcome.ONGOING && !game.stalled
        ? (game.busy && game.mode === 'single' ? opponent(game.player) : game.player)
        : null;
    const winningPlayer = replay ? null : winner(game.outcome);
    byId('matchup').replaceChildren(...[BLACK, WHITE].map(player => {
        const name = makeElement('span', '', 'match-player');
        if (player === winningPlayer) name.dataset.turn = '胜利 ↑';
        else if (player === activePlayer) name.dataset.turn = '轮到 ↑';
        const icon = makeElement('i', '', `stone ${player === BLACK ? 'black' : 'white'}`);
        icon.setAttribute('role', 'img');
        icon.setAttribute('aria-label', `${colorName(player)}棋`);
        name.append(icon, makeElement('span', game.names[player]));
        const usesMinimax = game.mode === 'watch' ? game.depths?.[player] > 0 :
            game.mode === 'single' && player !== game.human && game.depth > 0;
        if (usesMinimax) {
            const badge = makeElement('sup', 'M', 'minimax-badge');
            badge.title = '使用 Minimax';
            badge.setAttribute('aria-label', '使用 Minimax');
            name.append(badge);
        }
        return name;
    }));
    byId('move-count').textContent = `${moves.length} 手`;
    byId('replay').hidden = replay === null;
    const watching = !replay && game.mode === 'watch';
    const watchOngoing = canAdvanceWatch();
    byId('watch-controls').hidden = !watching;
    byId('watch-previous').disabled = game.moves.length === 0;
    byId('watch-next').hidden = !watchOngoing;
    byId('watch-auto').hidden = !watchOngoing;
    byId('watch-speed').parentElement.hidden = !watchOngoing;
    byId('undo').hidden = !!replay || watching || game.outcome !== Outcome.ONGOING || game.stalled;
    byId('undo').disabled = undoCount(game) === 0;
    byId('watch-next').disabled = watchAuto || !!game.busy;
    byId('watch-auto').textContent = watchAuto ? '暂停' : '自动播放';
    byId('watch-auto').setAttribute('aria-pressed', String(watchAuto));
    byId('leave-board').textContent = replay ? '← 战绩' : '← 主菜单';
    byId('result-actions').hidden = !!replay || !game || (game.outcome === Outcome.ONGOING && !game.stalled);
    byId('status').toggleAttribute('data-error', !!message && canPlay());
    byId('previous').disabled = !replay || replay.index === 0;
    byId('next').disabled = !replay || replay.index === game.moves.length;
    const status = byId('status');
    byId('thinking').hidden = !!replay || !game.busy;
    status.hidden = !replay && !!game.busy;
    renderThinking(game);
    if (activePlayer !== null) status.setAttribute('aria-label', `轮到 ${game.names[activePlayer]}`);
    else if (winningPlayer !== null) status.setAttribute('aria-label', resultLabel(game));
    else status.removeAttribute('aria-label');
    status.textContent = replay
        ? `第 ${replay.index} / ${game.moves.length} 手 · ${resultLabel(game)}`
        : !game ? '在对局设置中点击「开始对局」。'
        : winningPlayer !== null ? ''
        : game.outcome !== Outcome.ONGOING || game.stalled ? resultLabel(game)
        : game.busy ? '电脑正在思考…'
        : message;
}

const boardScroll = byId('board-scroll');
const zoomInput = byId('board-zoom');

function setBoardZoom(value, x, y) {
    const zoom = Math.max(Number(zoomInput.min), Math.min(Number(zoomInput.max), value));
    const viewport = boardScroll.getBoundingClientRect();
    const anchorX = x ?? (viewport.left + viewport.width / 2);
    const anchorY = y ?? (viewport.top + viewport.height / 2);
    const before = board.getBoundingClientRect();
    const fractionX = (anchorX - before.left) / before.width;
    const fractionY = (anchorY - before.top) / before.height;
    zoomInput.value = zoom;
    board.style.setProperty('--board-zoom', Number(zoomInput.value) / 100);
    byId('board-zoom-value').value = `${zoomInput.value}%`;
    const after = board.getBoundingClientRect();
    boardScroll.scrollLeft += after.left + fractionX * after.width - anchorX;
    boardScroll.scrollTop += after.top + fractionY * after.height - anchorY;
    cursor = null;
    render();
}

zoomInput.addEventListener('input', () => setBoardZoom(Number(zoomInput.value)));
boardScroll.addEventListener('wheel', event => {
    if (!(event.ctrlKey || event.metaKey) || event.deltaY === 0) return;
    event.preventDefault();
    setBoardZoom(Number(zoomInput.value) - Math.sign(event.deltaY) * 5, event.clientX, event.clientY);
}, { passive: false });

function eventPoint(event) {
    const rect = board.getBoundingClientRect();
    const toIndex = (value, size) => Math.max(0, Math.min(size - 1, Math.round((value - margin) / spacing)));
    return [
        toIndex((event.clientY - rect.top) * board.viewBox.baseVal.height / rect.height, gridRows),
        toIndex((event.clientX - rect.left) * board.viewBox.baseVal.width / rect.width, gridCols),
    ];
}

board.addEventListener('click', event => place(eventPoint(event)));
board.addEventListener('pointermove', event => { cursor = eventPoint(event); render(); });
board.addEventListener('pointerleave', () => { cursor = null; render(); });
board.addEventListener('keydown', event => {
    const directions = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        place(cursor ?? boardCenter(gridRows, gridCols));
    } else if (directions[event.key]) {
        event.preventDefault();
        const current = cursor ?? boardCenter(gridRows, gridCols);
        cursor = directions[event.key].map((offset, axis) => Math.max(0, Math.min((axis === 0 ? gridRows : gridCols) - 1, current[axis] + offset)));
        render();
    }
});

byId('move-numbers').onchange = event => {
    showMoveNumbers = event.currentTarget.checked;
    render();
};
byId('previous').onclick = () => { if (replay?.index > 0) { replay.index--; render(); } };
byId('next').onclick = () => { if (replay && replay.index < replay.record.moves.length) { replay.index++; render(); } };
async function toggleFullscreen() {
    try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
    } catch {
        // The board already fills the viewport when fullscreen is unavailable.
    }
}
byId('fullscreen').hidden = !document.fullscreenEnabled;
byId('fullscreen').onclick = toggleFullscreen;
document.addEventListener('keydown', event => {
    if (screen !== 'arena' || event.repeat) return;
    if (event.key.toLowerCase() === 'f' && document.fullscreenEnabled) toggleFullscreen();
    if (event.key === 'Escape' && !document.fullscreenElement) leaveBoard();
});
filter.onchange = renderRecords;
byId('score-pair').onchange = renderScores;
byId('score-mode').onchange = renderScores;
window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY || event.key === null) {
        records = loadRecords();
        renderRecords();
    }
});
window.render_game_to_text = () => JSON.stringify({
    coordinates: 'zero-based row, column; origin top left',
    screen, mode: match?.mode ?? null, names: match?.names, player: match?.player, human: match?.human,
    rows: gridRows, cols: gridCols, outcome: match?.outcome, moves: match?.moves ?? [], replay: replay?.index ?? null,
    status: byId('status').textContent, records: records.length, watchAuto, progress: match?.busy ? match.progress ?? 0 : null,
});
syncSettings();
renderRecords();
render();
