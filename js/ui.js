// ================= Рендеринг и работа с DOM =================

const $ = (id) => document.getElementById(id);

// ======================================================================
//  ИЛЛЮСТРАЦИИ (assets/cut — с вырезанным фоном, assets/ — полотна)
// ======================================================================

const ASSET_DIR = 'assets/cut/';
const ASSET_RAW = 'assets/';

const SUSPECT_IMGS = [
    'suspect-01-alisa.webp', 'suspect-02-artur.webp', 'suspect-03-beatris.webp', 'suspect-04-charlz.webp',
    'suspect-05-deizi.webp', 'suspect-06-edit.webp', 'suspect-07-frank.webp', 'suspect-08-gertruda.webp',
    'suspect-09-garold.webp', 'suspect-10-ingrid.webp', 'suspect-11-yustina.webp', 'suspect-12-leo.webp',
    'suspect-13-meri.webp', 'suspect-14-olivia.webp', 'suspect-15-pol.webp', 'suspect-16-sebastyan.webp',
];

function assetImg(file, size, cls = '') {
    return `<img${cls ? ` class="${cls}"` : ''} src="${ASSET_DIR}${file}" width="${size}" height="${size}" alt="">`;
}

function suspectImg(i) {
    return `<img class="portrait-img" src="${ASSET_DIR}${SUSPECT_IMGS[i]}" alt="${suspectName(SUSPECTS[i])}">`;
}

function detectiveImg(key) {
    return `<img class="detective-img" src="${ASSET_DIR}detective-${key}.webp" alt="">`;
}

// Голова детектива, вырезанная из полноростовой иллюстрации (CSS-кроп)
function detectiveHeadImg(key) {
    return `<span class="head-crop"><img src="${ASSET_DIR}detective-${key}.webp" alt=""></span>`;
}

function itemImg(key, size) {
    return `<img class="item-img" width="${size}" height="${size}" src="${ASSET_DIR}item-${key}.webp" alt="">`;
}

// Сюжетные объекты и иконки
function foxThiefImg(size) { return assetImg('fox-thief.webp', size); }
function burrowImg(size)   { return assetImg('burrow.webp', size); }
function pieImg(size)      { return assetImg('pie.webp', size); }
function logoImg(size)     { return assetImg('logo.webp', size); }
function eyeIcon(size)     { return assetImg('icon-eye.webp', size); }
function pawIcon(size)     { return assetImg('icon-paw.webp', size); }
function diceIconImg(size) { return assetImg('icon-dice.webp', size); }
function magnifierImg(size){ return assetImg('icon-magnifier.webp', size); }
function mushroomImg(size) { return assetImg('clue-mushroom.webp', size); }

function decorImg(type, size) {
    return assetImg('decor-' + type + '.webp', size);
}

// Иконка грани кубика
function diceFaceIcon(icon) {
    if (icon === 'eye') return eyeIcon(34);
    if (icon === 'paw') return pawIcon(30);
    return assetImg('icon-paw-double.webp', 44);
}

// ======================================================================
//  СТАТИЧНЫЕ ТЕКСТЫ (i18n)
// ======================================================================

function applyStaticTexts() {
    document.title = t('app_title');
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });
    $('roll-open-btn').innerHTML = diceIconImg(20) + ' ' + t('btn_roll_open');
    $('check-clue-btn').innerHTML = mushroomImg(20) + ' ' + t('btn_check_clue');
    document.querySelector('.target-btn[data-target="eyes"] .target-name').textContent = t('target_eyes');
    document.querySelector('.target-btn[data-target="eyes"] small').textContent = t('target_eyes_sub');
    document.querySelector('.target-btn[data-target="clues"] .target-name').textContent = t('target_paws');
    document.querySelector('.target-btn[data-target="clues"] small').textContent = t('target_paws_sub');
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
        chip.innerHTML = `${itemImg(ct.key, 18)}<span class="chip-mark">·</span>`;
        chip.addEventListener('click', () => showChipTip(chip, ct.key));
        wrap.appendChild(chip);
    });
    updateClueChips();
}

// Тап по чипу улики: подпрыгивание + всплывающая подпись, что это значит
let chipTipTimer = null;

function showChipTip(chip, key) {
    const label = t('clue_' + key);
    const text = !(key in state.checked)
        ? t('chip_unknown', { label })
        : state.checked[key] ? t('chip_yes', { label }) : t('chip_no', { label });

    let tip = $('chip-tip');
    if (!tip) {
        tip = document.createElement('div');
        tip.id = 'chip-tip';
        document.body.appendChild(tip);
    }
    tip.textContent = text;
    tip.classList.add('visible');
    const r = chip.getBoundingClientRect();
    const w = tip.offsetWidth;
    tip.style.left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 8)) + 'px';
    tip.style.top = (r.bottom + 8) + 'px';

    const img = chip.querySelector('img');
    if (img) {
        img.classList.remove('poke');
        void img.offsetWidth;
        img.classList.add('poke');
    }
    Sound.play('click');
    clearTimeout(chipTipTimer);
    chipTipTimer = setTimeout(() => tip.classList.remove('visible'), 2200);
}

function updateClueChips() {
    CLUE_TYPES.forEach(ct => {
        const chip = $('chip-' + ct.key);
        if (!chip) return;
        chip.classList.remove('chip-yes', 'chip-no');
        const mark = chip.querySelector('.chip-mark');
        const label = t('clue_' + ct.key);
        if (!(ct.key in state.checked)) {
            mark.textContent = '·';
            chip.title = t('chip_unknown', { label });
        } else if (state.checked[ct.key]) {
            chip.classList.add('chip-yes');
            mark.textContent = '✓';
            chip.title = t('chip_yes', { label });
        } else {
            chip.classList.add('chip-no');
            mark.textContent = '✗';
            chip.title = t('chip_no', { label });
        }
    });
}

// ---------- Игровое поле ----------
function isFoxPathCell(x, y) {
    return FOX_PATH.some(p => Math.round(p.x) === x && Math.round(p.y) === y);
}

function buildBoard() {
    const board = $('board-grid');
    board.innerHTML = '';
    const burrow = FOX_PATH[FOX_PATH.length - 1];
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.className = 'board-cell';
            if (x === burrow.x && y === burrow.y) cell.classList.add('cell-burrow');
            cell.dataset.x = x;
            cell.dataset.y = y;
            board.appendChild(cell);
        }
    }
    buildTrailSVG();
    updateBoardCells();
}

function cellAt(x, y) {
    return $('board-grid').children[y * GRID_SIZE + x];
}

// ---------- Плавная тропа лиса (Catmull-Rom → Bezier) ----------

function trailPoints() {
    // центры клеток тропы в координатах viewBox 0..100
    return FOX_PATH.map(p => [
        (p.x + 0.5) / GRID_SIZE * 100,
        (p.y + 0.5) / GRID_SIZE * 100,
    ]);
}

function trailPathD() {
    const pts = trailPoints();
    let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(pts.length - 1, i + 2)];
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        d += ` C ${c1[0].toFixed(2)} ${c1[1].toFixed(2)}, ${c2[0].toFixed(2)} ${c2[1].toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
    }
    return d;
}

function buildTrailSVG() {
    // сама тропа нарисована в арте фона; SVG остаётся только для
    // тёмного следа «пройденного» участка за лисом
    const old = $('trail-svg');
    if (old) old.remove();
    const d = trailPathD();
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.id = 'trail-svg';
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.innerHTML = `
        <path id="trail-passed" d="${d}" fill="none" stroke="rgba(80,55,30,0.28)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
    `;
    const wrap = $('board-wrap');
    wrap.insertBefore(svg, $('pawn-layer'));
    updateTrailProgress();
}

function updateTrailProgress() {
    const passed = $('trail-passed');
    if (!passed) return;
    const total = passed.getTotalLength();
    const frac = Math.min(1, state.fox / FOX_TRACK_LENGTH);
    passed.setAttribute('stroke-dasharray', `${total * frac} ${total}`);
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
            cell.innerHTML = `<span class="cell-art art-clue">${mushroomImg(32)}</span>`;
            continue;
        }
        const decor = state.decor.find(d => d.x === x && d.y === y);
        cell.innerHTML = decor ? `<span class="cell-art art-decor">${decorImg(decor.t, 26)}</span>` : '';
    }
}

function updateReachable() {
    for (const cell of $('board-grid').children) cell.classList.remove('reachable');
    if (state.phase !== 'moving' || state.steps <= 0) return;
    // доступна сразу вся область ходьбы: клетки на расстоянии Чебышёва 1..steps
    const p = state.players[state.current].pos;
    const n = state.steps;
    for (let dy = -n; dy <= n; dy++) {
        for (let dx = -n; dx <= n; dx++) {
            const d = Math.max(Math.abs(dx), Math.abs(dy));
            if (d === 0 || d > n) continue;
            const nx = p.x + dx, ny = p.y + dy;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                cellAt(nx, ny).classList.add('reachable');
            }
        }
    }
}

// ---------- Фигурки сыщиков и лис на поле ----------
function buildPawns() {
    const layer = $('pawn-layer');
    layer.innerHTML = '';
    state.players.forEach((pl, i) => {
        const pawn = document.createElement('div');
        pawn.className = 'pawn-figure';
        pawn.id = 'pawn-' + i;
        pawn.innerHTML = `
            <span class="pawn-base" style="background:${pl.color}"></span>
            <img src="${ASSET_DIR}detective-${pl.animal}.webp" alt="">`;
        layer.appendChild(pawn);
    });
    const fox = document.createElement('div');
    fox.className = 'fox-token';
    fox.id = 'fox-token';
    fox.innerHTML = `<img src="${ASSET_DIR}fox-thief.webp" alt="">`;
    layer.appendChild(fox);
    // первичная расстановка — мгновенно, без анимации «разлёта из угла»
    layer.classList.add('no-anim');
    positionPawns();
    requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.remove('no-anim')));
}

function positionPawns() {
    if (!state.players.length) return;
    const boardW = $('board-grid').clientWidth;
    const cell = boardW / GRID_SIZE;
    const size = cell * 1.7; // высота фигурки

    // группируем по клеткам, чтобы разводить фигурки на одной клетке
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
            const offs = [[-0.22, -0.1], [0.22, -0.1], [-0.22, 0.14], [0.22, 0.14]];
            ox = offs[slot][0] * cell;
            oy = offs[slot][1] * cell;
        }
        // якорь: ноги фигурки чуть ниже центра клетки
        const cx = pl.pos.x * cell + cell / 2 + ox - size / 2;
        const cy = pl.pos.y * cell + cell * 0.72 + oy - size;
        pawn.style.transform = `translate(${cx}px, ${cy}px)`;
        pawn.style.zIndex = 10 + pl.pos.y;
        pawn.classList.toggle('active-pawn', i === state.current && state.players.length > 1);
    });

    positionFoxToken(cell);
}

// Лис ходит строго по кривой тропы: и стоит на ней, и перемещается вдоль неё
function positionFoxToken(cellSize, animateFromIdx = null) {
    const fox = $('fox-token');
    if (!fox) return;
    const boardW = $('board-grid').clientWidth;
    const cell = cellSize || boardW / GRID_SIZE;
    const size = cell * 1.6;
    fox.style.width = size + 'px';
    fox.style.height = size + 'px';
    fox.classList.toggle('in-burrow', state.fox >= FOX_TRACK_LENGTH);

    const path = $('trail-passed');
    if (!path) return;
    const total = path.getTotalLength();
    // каждый шаг лиса — 1/16 длины кривой (опорных точек может быть сколько угодно)
    const fracOf = idx => Math.min(1, idx / FOX_TRACK_LENGTH);
    const place = (frac) => {
        const pt = path.getPointAtLength(total * frac); // координаты viewBox 0..100
        const px = pt.x / 100 * boardW;
        const py = pt.y / 100 * boardW;
        fox.style.transform = `translate(${px - size / 2}px, ${py + cell * 0.25 - size}px)`;
        fox.style.zIndex = 9 + Math.round(py / cell);
    };

    if (animateFromIdx === null || animateFromIdx === state.fox) {
        place(fracOf(state.fox));
        updateTrailProgress();
        return;
    }

    // бег вдоль тропы: JS-анимация по длине кривой, тропа темнеет следом
    const f0 = fracOf(animateFromIdx);
    const f1 = fracOf(state.fox);
    fox.classList.add('trail-anim');
    const dur = 550 + 320 * Math.abs(state.fox - animateFromIdx); // дольше — если бежит дальше
    const t0 = performance.now();
    (function tick(now) {
        const t = Math.min(1, ((now || performance.now()) - t0) / dur);
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const f = f0 + (f1 - f0) * e;
        place(f);
        path.setAttribute('stroke-dasharray', `${total * f} ${total}`);
        if (t < 1) requestAnimationFrame(tick);
        else { fox.classList.remove('trail-anim'); updateTrailProgress(); }
    })();
}

// ---------- Экраны «Поле» / «Подозреваемые» ----------
let activeTab = 'board';

// На широких ландшафтных экранах (ноутбук/планшет боком) показываем оба экрана рядом
function isSplitLayout() {
    return window.innerWidth >= 1150 && window.innerWidth > window.innerHeight;
}

function applyLayoutMode() {
    const split = isSplitLayout();
    document.querySelector('.screens').classList.toggle('split', split);
    document.querySelector('.screen-tabs').classList.toggle('hidden', split);
    if (split) {
        $('screen-board').classList.remove('hidden');
        $('screen-suspects').classList.remove('hidden');
    } else {
        $('screen-board').classList.toggle('hidden', activeTab !== 'board');
        $('screen-suspects').classList.toggle('hidden', activeTab !== 'suspects');
    }
}

function switchScreen(name) {
    activeTab = name;
    $('tab-board').classList.toggle('selected', name === 'board');
    $('tab-suspects').classList.toggle('selected', name === 'suspects');
    if (name === 'suspects') $('tab-suspects').classList.remove('attention');
    applyLayoutMode();
    if (name === 'board' || isSplitLayout()) requestAnimationFrame(positionPawns);
}

function currentScreen() {
    return activeTab;
}

// бейдж на вкладке: сколько карт ещё закрыто
function updateSuspectsBadge() {
    const hidden = SUSPECTS.filter(s => !s.isRevealed).length;
    const badge = $('tab-suspects-badge');
    badge.textContent = hidden;
    badge.classList.toggle('hidden', hidden === 0 || !state.players.length);
}

// вписываем экраны в высоту вьюпорта — без прокрутки страницы
function fitScreens() {
    applyLayoutMode();
    const top = $('app-header').offsetHeight;
    const tabsH = isSplitLayout() ? 0 : $('screen-tabs').offsetHeight;
    const avail = Math.max(300, window.innerHeight - top - tabsH - 22);
    const sg = $('suspects-grid');
    const gap = 10;

    if (isSplitLayout()) {
        // ноутбук: поле и сетка подозреваемых рядом, обе по высоте avail
        const maxW = window.innerWidth * 0.97;
        let H = Math.min(avail, 780);
        // суммарная ширина: поле (H) + сетка (~0.74·H) + зазоры
        if (H * 1.74 + 3 * gap + 30 > maxW) {
            H = Math.floor((maxW - 3 * gap - 30) / 1.74);
        }
        $('board-wrap').style.width = H + 'px';
        sg.style.height = H + 'px';
        const cellH = (H - 3 * gap) / 4;
        sg.style.width = Math.round(cellH * 0.74 * 4 + 3 * gap) + 'px';
    } else {
        const bw = Math.max(280, Math.min(window.innerWidth * 0.94, avail, 780));
        $('board-wrap').style.width = bw + 'px';
        const gridH = avail - 6;
        sg.style.height = gridH + 'px';
        // ширина сетки — из пропорции карточки (~0.74), чтобы карты не расплывались
        const cellH = (gridH - 3 * gap) / 4;
        sg.style.width = Math.min(cellH * 0.74 * 4 + 3 * gap, window.innerWidth * 0.96) + 'px';
    }
}

// ---------- Карты подозреваемых ----------
function buildSuspectCards() {
    const grid = $('suspects-grid');
    grid.innerHTML = '';

    SUSPECTS.forEach((s, i) => {
        const card = document.createElement('div');
        card.className = 'fox-card';
        card.id = 'card-' + i;
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-face card-back"></div>
                <div class="card-face card-front">
                    ${suspectImg(i)}
                    <span class="card-name">${suspectName(s)}</span>
                    <span class="card-attrs">${suspectAttrIcons(s, 14)}</span>
                    <span class="stamp hidden"></span>
                </div>
            </div>`;
        card.addEventListener('click', () => onSuspectClick(i));
        grid.appendChild(card);
    });
    updateAllSuspectCards();
    updateSuspectsBadge();
}

function suspectAttrIcons(s, size) {
    const icons = CLUE_TYPES.filter(ct => s[ct.key]).map(ct => itemImg(ct.key, size)).join('');
    return icons || `<span class="no-attrs">${t('no_attrs_full')}</span>`;
}

function updateSuspectCard(i) {
    const s = SUSPECTS[i];
    const card = $('card-' + i);
    if (!card) return;
    card.classList.toggle('revealed', !!s.isRevealed);
    card.classList.toggle('pulse', state.phase === 'revealing' && !s.isRevealed && state.pendingReveals > 0);
    card.classList.toggle('released', !!s.isReleased);
    updateSuspectsBadge();

    // Сопоставлять приметы с уликами игрок должен сам — никаких авто-подсказок
    const stamp = card.querySelector('.stamp');
    if (s.isReleased) {
        stamp.className = 'stamp stamp-released';
        stamp.textContent = t('stamp_released');
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
    checkBtn.classList.toggle('hidden', !onClue);
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
