// ================= Рендеринг и работа с DOM =================

const $ = (id) => document.getElementById(id);

// ======================================================================
//  ИЛЛЮСТРАЦИИ (assets/cut — с вырезанным фоном, assets/ — полотна)
// ======================================================================

const ASSET_DIR = 'assets/cut/';
const ASSET_RAW = 'assets/';

const SUSPECT_IMGS = [
    'suspect-01-alisa.png', 'suspect-02-artur.png', 'suspect-03-beatris.png', 'suspect-04-charlz.png',
    'suspect-05-deizi.png', 'suspect-06-edit.png', 'suspect-07-frank.png', 'suspect-08-gertruda.png',
    'suspect-09-garold.png', 'suspect-10-ingrid.png', 'suspect-11-yustina.png', 'suspect-12-leo.png',
    'suspect-13-meri.png', 'suspect-14-olivia.png', 'suspect-15-pol.png', 'suspect-16-sebastyan.png',
];

function assetImg(file, size, cls = '') {
    return `<img${cls ? ` class="${cls}"` : ''} src="${ASSET_DIR}${file}" width="${size}" height="${size}" alt="">`;
}

function suspectImg(i) {
    return `<img class="portrait-img" src="${ASSET_DIR}${SUSPECT_IMGS[i]}" alt="${SUSPECTS[i].name}">`;
}

function detectiveImg(key) {
    return `<img class="detective-img" src="${ASSET_DIR}detective-${key}.png" alt="">`;
}

// Голова детектива, вырезанная из полноростовой иллюстрации (CSS-кроп)
function detectiveHeadImg(key) {
    return `<span class="head-crop"><img src="${ASSET_DIR}detective-${key}.png" alt=""></span>`;
}

function itemImg(key, size) {
    return `<img class="item-img" width="${size}" height="${size}" src="${ASSET_DIR}item-${key}.png" alt="">`;
}

// Сюжетные объекты и иконки
function foxThiefImg(size) { return assetImg('fox-thief.png', size); }
function burrowImg(size)   { return assetImg('burrow.png', size); }
function pieImg(size)      { return assetImg('pie.png', size); }
function logoImg(size)     { return assetImg('logo.png', size); }
function eyeIcon(size)     { return assetImg('icon-eye.png', size); }
function pawIcon(size)     { return assetImg('icon-paw.png', size); }
function diceIconImg(size) { return assetImg('icon-dice.png', size); }
function magnifierImg(size){ return assetImg('icon-magnifier.png', size); }

function decorImg(type, size) {
    return assetImg('decor-' + type + '.png', size);
}

function clueMarkerImg(kind, size) {
    return assetImg(kind === 'mushroom' ? 'clue-mushroom.png' : 'clue-berries.png', size);
}

// Иконка грани кубика
function diceFaceIcon(icon) {
    if (icon === 'eye') return eyeIcon(34);
    if (icon === 'paw') return pawIcon(30);
    return assetImg('icon-paw-double.png', 44);
}

// ======================================================================
//  РЕНДЕРИНГ
// ======================================================================

// ---------- Индикатор опасности (лис на тропе к норе) ----------
function updateDangerBadge() {
    const badge = $('fox-danger');
    const remaining = FOX_TRACK_LENGTH - state.fox;
    $('danger-count').textContent = remaining;
    badge.classList.remove('level-safe', 'level-warn', 'level-danger');
    badge.classList.add(remaining > 8 ? 'level-safe' : remaining > 3 ? 'level-warn' : 'level-danger');
}

// ---------- Чипы улик ----------
function buildClueChips() {
    const wrap = $('clue-chips');
    wrap.innerHTML = '';
    CLUE_TYPES.forEach(ct => {
        const chip = document.createElement('span');
        chip.className = 'clue-chip';
        chip.id = 'chip-' + ct.key;
        chip.title = ct.label + ': не проверено';
        chip.innerHTML = `${itemImg(ct.key, 18)}<span class="chip-mark">·</span>`;
        wrap.appendChild(chip);
    });
}

function updateClueChips() {
    CLUE_TYPES.forEach(ct => {
        const chip = $('chip-' + ct.key);
        chip.classList.remove('chip-yes', 'chip-no');
        const mark = chip.querySelector('.chip-mark');
        if (!(ct.key in state.checked)) {
            mark.textContent = '·';
            chip.title = ct.label + ': не проверено';
        } else if (state.checked[ct.key]) {
            chip.classList.add('chip-yes');
            mark.textContent = '✓';
            chip.title = ct.label + ': есть у вора';
        } else {
            chip.classList.add('chip-no');
            mark.textContent = '✗';
            chip.title = ct.label + ': нет у вора';
        }
    });
}

// ---------- Игровое поле ----------
function isFoxPathCell(x, y) {
    return FOX_PATH.some(p => p.x === x && p.y === y);
}

function buildBoard() {
    const board = $('board-grid');
    board.innerHTML = '';
    const burrow = FOX_PATH[FOX_PATH.length - 1];
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.className = 'board-cell';
            // лёгкая шахматка травы
            if ((x + y) % 2 === 1) cell.classList.add('grass-b');
            if (isCentralArea(x, y)) cell.classList.add('cell-clearing');
            if (isFoxPathCell(x, y)) cell.classList.add('cell-path');
            if (x === burrow.x && y === burrow.y) cell.classList.add('cell-burrow');
            cell.dataset.x = x;
            cell.dataset.y = y;
            board.appendChild(cell);
        }
    }
    updateBoardCells();
}

function cellAt(x, y) {
    return $('board-grid').children[y * GRID_SIZE + x];
}

function updateBoardCells() {
    const burrow = FOX_PATH[FOX_PATH.length - 1];
    for (const cell of $('board-grid').children) {
        const x = Number(cell.dataset.x);
        const y = Number(cell.dataset.y);
        if (x === burrow.x && y === burrow.y) {
            cell.innerHTML = `<span class="cell-art art-burrow">${burrowImg(40)}</span>`;
            continue;
        }
        const clue = state.clues.find(c => c.x === x && c.y === y);
        if (clue) {
            cell.innerHTML = `<span class="cell-art art-clue">${clueMarkerImg(clue.kind, 32)}</span>`;
            continue;
        }
        const decor = state.decor.find(d => d.x === x && d.y === y);
        cell.innerHTML = decor ? `<span class="cell-art art-decor">${decorImg(decor.t, 28)}</span>` : '';
    }
}

function updateReachable() {
    for (const cell of $('board-grid').children) cell.classList.remove('reachable');
    if (state.phase !== 'moving' || state.steps <= 0) return;
    const p = state.players[state.current].pos;
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = p.x + dx, ny = p.y + dy;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                cellAt(nx, ny).classList.add('reachable');
            }
        }
    }
}

// ---------- Фишки сыщиков и лис на поле ----------
function buildPawns() {
    const layer = $('pawn-layer');
    layer.innerHTML = '';
    state.players.forEach((pl, i) => {
        const pawn = document.createElement('div');
        pawn.className = 'pawn';
        pawn.id = 'pawn-' + i;
        pawn.style.borderColor = pl.color;
        pawn.innerHTML = detectiveHeadImg(pl.animal);
        layer.appendChild(pawn);
    });
    const fox = document.createElement('div');
    fox.className = 'fox-token';
    fox.id = 'fox-token';
    fox.innerHTML = `<img src="${ASSET_DIR}fox-thief.png" alt="">`;
    layer.appendChild(fox);
    positionPawns();
}

function positionPawns() {
    if (!state.players.length) return;
    const boardW = $('board-grid').clientWidth;
    const cell = boardW / GRID_SIZE;
    const size = cell * 0.84;

    // группируем по клеткам, чтобы разводить фишки на одной клетке
    const groups = {};
    state.players.forEach((pl, i) => {
        const key = pl.pos.x + ',' + pl.pos.y;
        (groups[key] = groups[key] || []).push(i);
    });

    state.players.forEach((pl, i) => {
        const pawn = $('pawn-' + i);
        if (!pawn) return;
        pawn.style.width = size + 'px';
        pawn.style.height = size + 'px';
        const mates = groups[pl.pos.x + ',' + pl.pos.y];
        let ox = 0, oy = 0;
        if (mates.length > 1) {
            const slot = mates.indexOf(i);
            const offs = [[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]];
            ox = offs[slot][0] * cell;
            oy = offs[slot][1] * cell;
        }
        const cx = pl.pos.x * cell + cell / 2 + ox - size / 2;
        const cy = pl.pos.y * cell + cell / 2 + oy - size / 2;
        pawn.style.transform = `translate(${cx}px, ${cy}px)`;
        pawn.classList.toggle('active-pawn', i === state.current && state.players.length > 1);
    });

    positionFoxToken(cell);
}

function positionFoxToken(cellSize) {
    const fox = $('fox-token');
    if (!fox) return;
    const cell = cellSize || $('board-grid').clientWidth / GRID_SIZE;
    const size = cell * 1.35;
    const pos = FOX_PATH[Math.min(state.fox, FOX_PATH.length - 1)];
    fox.style.width = size + 'px';
    fox.style.height = size + 'px';
    const cx = pos.x * cell + cell / 2 - size / 2;
    const cy = pos.y * cell + cell / 2 - size / 2;
    fox.style.transform = `translate(${cx}px, ${cy}px)`;
    fox.classList.toggle('in-burrow', state.fox >= FOX_TRACK_LENGTH);

    // пройденные клетки тропы затемняем
    FOX_PATH.forEach((p, idx) => {
        const cellEl = cellAt(p.x, p.y);
        if (cellEl) cellEl.classList.toggle('path-passed', idx < state.fox);
    });
}

// ---------- Карты подозреваемых ----------
function buildSuspectCards() {
    const edges = [$('edge-top'), $('edge-right'), $('edge-bottom'), $('edge-left')];
    edges.forEach(e => e.innerHTML = '');

    SUSPECTS.forEach((s, i) => {
        const card = document.createElement('div');
        card.className = 'fox-card';
        card.id = 'card-' + i;
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-face card-back"></div>
                <div class="card-face card-front">
                    ${suspectImg(i)}
                    <span class="card-name">${s.name}</span>
                    <span class="card-attrs">${suspectAttrIcons(s, 14)}</span>
                    <span class="stamp hidden"></span>
                </div>
            </div>`;
        card.addEventListener('click', () => onSuspectClick(i));
        edges[Math.floor(i / 4)].appendChild(card);
    });
    updateAllSuspectCards();
}

function suspectAttrIcons(s, size) {
    const icons = CLUE_TYPES.filter(ct => s[ct.key]).map(ct => itemImg(ct.key, size)).join('');
    return icons || '<span class="no-attrs">без примет</span>';
}

function updateSuspectCard(i) {
    const s = SUSPECTS[i];
    const card = $('card-' + i);
    if (!card) return;
    card.classList.toggle('revealed', !!s.isRevealed);
    card.classList.toggle('pulse', state.phase === 'revealing' && !s.isRevealed && state.pendingReveals > 0);
    card.classList.toggle('released', !!s.isReleased);

    // Сопоставлять приметы с уликами игрок должен сам — никаких авто-подсказок
    const stamp = card.querySelector('.stamp');
    if (s.isReleased) {
        stamp.className = 'stamp stamp-released';
        stamp.textContent = 'СВОБОДЕН';
    } else {
        stamp.className = 'stamp hidden';
    }
}

function updateAllSuspectCards() {
    SUSPECTS.forEach((_, i) => updateSuspectCard(i));
}

// ---------- Панель игроков и статус ----------
function renderPlayersStrip() {
    const strip = $('players-strip');
    strip.innerHTML = '';
    if (state.players.length < 2) return;
    state.players.forEach((pl, i) => {
        const chip = document.createElement('span');
        chip.className = 'player-chip' + (i === state.current ? ' active' : '');
        chip.innerHTML = `<span class="chip-avatar" style="border-color:${pl.color}">${detectiveHeadImg(pl.animal)}</span>${pl.name}`;
        strip.appendChild(chip);
    });
}

function setStatus(text, tone) {
    const el = $('status-text');
    el.textContent = text;
    el.className = 'status' + (tone ? ' st-' + tone : '');
    // перезапуск анимации появления
    void el.offsetWidth;
    el.classList.add('flash');
}

function updateActionButtons() {
    const rollBtn = $('roll-open-btn');
    const checkBtn = $('check-clue-btn');
    const endBtn = $('end-turn-btn');
    const stepsBadge = $('steps-badge');

    rollBtn.classList.toggle('hidden', state.phase !== 'rolling');
    endBtn.classList.toggle('hidden', state.phase !== 'moving');
    stepsBadge.classList.toggle('hidden', state.phase !== 'moving');
    $('steps-left').textContent = state.steps;

    const onClue = state.phase === 'moving' && playerOnClue();
    const cluesRemain = Object.keys(state.checked).length < CLUE_TYPES.length;
    checkBtn.classList.toggle('hidden', !(onClue && cluesRemain));
}

// ---------- Кубики ----------
function updateDiceUI() {
    for (let i = 0; i < 3; i++) {
        const el = $('die-' + i);
        if (state.dice[i]) el.innerHTML = diceFaceIcon(state.dice[i].icon);
        el.classList.toggle('locked', state.locked[i]);
    }
}

// ---------- Модальные окна ----------
function openModal(id) {
    $('modal-overlay').classList.remove('hidden');
    for (const m of $('modal-overlay').querySelectorAll('.modal')) {
        m.classList.toggle('hidden', m.id !== id);
    }
}

function closeModal() {
    $('modal-overlay').classList.add('hidden');
}

function currentModal() {
    return $('modal-overlay').querySelector('.modal:not(.hidden)');
}
