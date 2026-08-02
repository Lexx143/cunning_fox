// ================= Состояние и логика игры =================

const state = {
    phase: 'idle', // idle | revealing | rolling | moving | gameover
    players: [],   // {name, color, animal, pos:{x,y}}
    current: 0,
    fox: 0,
    clues: [],     // грибы-улики [{x,y,clueKey}] — примета закреплена при старте
    decor: [],     // декор лужайки [{x,y,t}]
    checked: {},   // key приметы -> есть ли она у вора (boolean)
    secretThief: null,
    thiefIndex: -1,
    pendingReveals: 0,
    revealContext: 'initial', // initial | turn
    rollsLeft: 3,
    target: null,      // зафиксированная цель после первого броска
    uiTarget: 'eyes',  // выбранная в попапе цель
    lastTarget: 'eyes',
    dice: [null, null, null],
    locked: [false, false, false],
    steps: 0,
    rollingAnim: false,
    turnId: 0, // защита от устаревших setTimeout
};

// выбор на экране настройки: индексы ANIMALS и PLAYER_COLORS для каждого игрока
let setupAnimals = [0, 1, 2, 3];
let setupColors = [0, 1, 2, 3];

const IS_NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

// ================= Сохранение партии =================

function saveGame() {
    if (state.phase === 'idle' || state.phase === 'gameover') {
        localStorage.removeItem('dg_save');
        return;
    }
    const s = state;
    const data = {
        v: 1,
        state: {
            phase: s.phase, players: s.players, current: s.current, fox: s.fox,
            clues: s.clues, decor: s.decor, checked: s.checked, thiefIndex: s.thiefIndex,
            pendingReveals: s.pendingReveals, revealContext: s.revealContext,
            steps: s.steps, lastTarget: s.lastTarget,
        },
        suspects: SUSPECTS.map(sp => ({ r: !!sp.isRevealed, f: !!sp.isReleased })),
    };
    try { localStorage.setItem('dg_save', JSON.stringify(data)); } catch (e) { /* нет места — не критично */ }
}

function loadSavedGame() {
    try {
        const raw = localStorage.getItem('dg_save');
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (data.v !== 1 || !data.state || !data.state.players || !data.state.players.length) return null;
        return data;
    } catch (e) { return null; }
}

function restoreGame(data) {
    data.suspects.forEach((f, i) => {
        SUSPECTS[i].isRevealed = f.r;
        SUSPECTS[i].isReleased = f.f;
    });
    Object.assign(state, data.state);
    state.secretThief = SUSPECTS[state.thiefIndex];
    state.target = null;
    state.dice = [null, null, null];
    state.locked = [false, false, false];
    state.turnId++;

    buildBoard();
    buildPawns();
    buildSuspectCards();
    updateDangerBadge();
    buildClueChips();
    renderPlayersStrip();
    updateActionButtons();
    updateReachable();
    closeModal();
    fitScreens();

    if (state.phase === 'revealing') {
        setStatus(t('status_reveal_left', { n: state.pendingReveals }));
        switchScreen('suspects');
        updateAllSuspectCards();
    } else if (state.phase === 'moving') {
        setStatus(t('status_steps_left', { n: state.steps }));
        switchScreen('board');
    } else {
        state.phase = 'rolling';
        const pl = activePlayer();
        setStatus(state.players.length > 1
            ? t('status_turn_multi', { name: pl.name })
            : t('status_turn_solo'));
    }

    // обучение не было завершено (например, страницу перезагрузили) — начнём заново
    if (!Tutorial.isDone()) Tutorial.start();
}

// ================= Новая игра =================

function openSetupModal(cancelable) {
    $('setup-cancel-btn').classList.toggle('hidden', !cancelable);
    renderPlayerSetupRows(getSelectedPlayerCount());
    openModal('modal-setup');
}

function getSelectedPlayerCount() {
    const sel = document.querySelector('#player-count-picker button.selected');
    return sel ? Number(sel.dataset.count) : 1;
}

function renderPlayerSetupRows(count) {
    const wrap = $('player-names');
    const prev = [...wrap.querySelectorAll('input')].map(inp => inp.value);
    wrap.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const row = document.createElement('div');
        row.className = 'player-setup-row';

        const nameRow = document.createElement('div');
        nameRow.className = 'player-name-row';
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.maxLength = 14;
        inp.placeholder = t('default_name', { n: i + 1 });
        inp.value = prev[i] || '';
        nameRow.appendChild(inp);
        row.appendChild(nameRow);

        // зверёк — можно выбирать любого, хоть одинаковых
        const picker = document.createElement('div');
        picker.className = 'animal-picker';
        ANIMALS.forEach((animal, ai) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'animal-btn';
            btn.title = animalName(animal.key);
            btn.innerHTML = detectiveImg(animal.key);
            btn.addEventListener('click', () => {
                Sound.play('click');
                setupAnimals[i] = ai;
                refreshSetupPickers(count);
            });
            picker.appendChild(btn);
        });
        row.appendChild(picker);

        // цвет — уникален между игроками
        const colors = document.createElement('div');
        colors.className = 'color-picker';
        PLAYER_COLORS.forEach((c, ci) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'color-btn';
            btn.style.background = c.value;
            btn.addEventListener('click', () => {
                const takenBy = setupColors.slice(0, count).findIndex((cc, pi) => pi !== i && cc === ci);
                if (takenBy !== -1) {
                    // обмен цветами с другим игроком
                    setupColors[takenBy] = setupColors[i];
                }
                setupColors[i] = ci;
                Sound.play('click');
                refreshSetupPickers(count);
            });
            colors.appendChild(btn);
        });
        row.appendChild(colors);

        wrap.appendChild(row);
    }
    refreshSetupPickers(count);
}

function refreshSetupPickers(count) {
    const rows = $('player-names').querySelectorAll('.player-setup-row');
    rows.forEach((row, i) => {
        const color = PLAYER_COLORS[setupColors[i]].value;
        row.querySelectorAll('.animal-btn').forEach((btn, ai) => {
            const sel = setupAnimals[i] === ai;
            btn.classList.toggle('selected', sel);
            // выбранный зверёк окрашивается в цвет фишки игрока
            btn.style.borderColor = sel ? color : '';
            btn.style.background = sel ? `linear-gradient(${color}29, ${color}29), #fffdf7` : '';
        });
        row.querySelectorAll('.color-btn').forEach((btn, ci) => {
            btn.classList.toggle('selected', setupColors[i] === ci);
        });
    });
}

function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function startGame() {
    const count = getSelectedPlayerCount();
    const names = [...$('player-names').querySelectorAll('input')]
        .map((inp, i) => inp.value.trim() || animalName(ANIMALS[setupAnimals[i]].key));

    SUSPECTS.forEach(s => { s.isRevealed = false; s.isReleased = false; });
    state.thiefIndex = Math.floor(Math.random() * SUSPECTS.length);
    state.secretThief = SUSPECTS[state.thiefIndex];

    state.players = names.map((name, i) => ({
        name,
        color: PLAYER_COLORS[setupColors[i]].value,
        animal: ANIMALS[setupAnimals[i]].key,
        pos: { ...START_POSITIONS[i] },
    }));
    state.current = 0;
    state.fox = 0;
    state.checked = {};
    state.steps = 0;
    state.turnId++;

    // Грибы-улики: каждый закреплён за конкретной приметой
    const clueKeys = shuffleArray(CLUE_TYPES.map(ct => ct.key));
    state.clues = [];
    // в обучении первый гриб кладём в трёх шагах от старта — до него точно хватит ходов
    if (!Tutorial.isDone()) {
        state.clues.push({ x: 4, y: 6, clueKey: clueKeys[0] });
    }
    while (state.clues.length < NUM_CLUES) {
        const rx = Math.floor(Math.random() * GRID_SIZE);
        const ry = Math.floor(Math.random() * GRID_SIZE);
        if (isCellBlocked(rx, ry)) continue;
        if (state.clues.some(c => c.x === rx && c.y === ry)) continue;
        state.clues.push({ x: rx, y: ry, clueKey: clueKeys[state.clues.length] });
    }

    // Декор лужайки — фоновый, неяркий
    state.decor = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (isCellBlocked(x, y)) continue;
            if (state.clues.some(c => c.x === x && c.y === y)) continue;
            if (Math.random() < 0.1) {
                state.decor.push({ x, y, t: DECOR_POOL[Math.floor(Math.random() * DECOR_POOL.length)] });
            }
        }
    }

    buildBoard();
    buildPawns();
    buildSuspectCards();
    updateDangerBadge();
    buildClueChips();
    renderPlayersStrip();

    state.phase = 'revealing';
    state.revealContext = 'initial';
    state.pendingReveals = 2;
    setStatus(t('status_start'));
    updateAllSuspectCards();
    updateActionButtons();
    updateReachable();
    closeModal();
    fitScreens();
    switchScreen('suspects');
    Sound.play('cardDeal');
    saveGame();

    if (!Tutorial.isDone()) Tutorial.start();
}

function isCentralArea(x, y) {
    return x >= 6 && x <= 9 && y >= 6 && y <= 9;
}

// Клетки, где нельзя размещать улики и декор: центр, тропа лиса, нора
function isCellBlocked(x, y) {
    return isCentralArea(x, y) || isFoxPathCell(x, y);
}

// ================= Ходы и фазы =================

function activePlayer() {
    return state.players[state.current];
}

function beginTurn(index) {
    if (state.phase === 'gameover') return;
    state.current = index;
    state.phase = 'rolling';
    state.steps = 0;
    state.turnId++;
    const pl = activePlayer();
    setStatus(state.players.length > 1
        ? t('status_turn_multi', { name: pl.name })
        : t('status_turn_solo'));
    renderPlayersStrip();
    switchScreen('board');
    positionPawns();
    updateActionButtons();
    updateReachable();
    updateAllSuspectCards();
    saveGame();
}

function nextPlayer() {
    beginTurn((state.current + 1) % state.players.length);
}

function endTurnManually() {
    if (state.phase !== 'moving') return;
    Sound.play('click');
    nextPlayer();
}

// ================= Открытие карт =================

function onSuspectClick(i) {
    const s = SUSPECTS[i];
    if (state.phase === 'revealing' && !s.isRevealed && state.pendingReveals > 0) {
        revealSuspect(i);
    } else if (s.isRevealed) {
        openDossier(i);
    }
}

function revealSuspect(i) {
    SUSPECTS[i].isRevealed = true;
    state.pendingReveals--;
    updateAllSuspectCards();
    Sound.play('cardFlip');

    if (state.pendingReveals > 0) {
        setStatus(t('status_reveal_left', { n: state.pendingReveals }));
        saveGame();
        return;
    }

    setStatus(t('status_cards_open'), 'good');
    Tutorial.notify('revealed2');
    const token = state.turnId;
    setTimeout(() => {
        if (state.phase !== 'revealing' || token !== state.turnId) return;
        if (state.revealContext === 'initial') {
            beginTurn(0);
        } else {
            nextPlayer();
        }
    }, 900);
}

// ================= Кубики =================

function openDiceModal() {
    if (state.phase !== 'rolling') return;
    Sound.play('click');
    state.rollsLeft = 3;
    state.target = null;
    state.dice = [null, null, null];
    state.locked = [false, false, false];
    state.rollingAnim = false;

    const hiddenCount = SUSPECTS.filter(s => !s.isRevealed).length;
    if (hiddenCount === 0 && state.lastTarget === 'eyes') state.lastTarget = 'clues';
    state.uiTarget = state.lastTarget;
    if (Tutorial.active) state.uiTarget = Tutorial.riggedTarget();

    const eyesBtn = document.querySelector('.target-btn[data-target="eyes"]');
    eyesBtn.disabled = hiddenCount === 0;
    eyesBtn.title = hiddenCount === 0 ? t('eyes_disabled') : '';

    updateTargetPickerUI();
    for (let i = 0; i < 3; i++) {
        const el = $('die-' + i);
        el.innerHTML = '<span class="die-q">?</span>';
        el.classList.remove('locked', 'rolling');
    }
    $('rolls-left').textContent = state.rollsLeft;
    const hint = $('dice-hint');
    hint.textContent = t('dice_hint_start');
    hint.className = 'dice-hint';
    $('roll-btn').disabled = false;
    $('roll-btn').textContent = t('btn_roll');
    openModal('modal-dice');
    Tutorial.notify('diceOpened');
}

function updateTargetPickerUI() {
    document.querySelectorAll('.target-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.target === state.uiTarget);
        btn.classList.toggle('locked-choice', state.target !== null);
    });
}

function selectTarget(tg) {
    if (state.target !== null) return; // после первого броска цель зафиксирована
    Sound.play('click');
    state.uiTarget = tg;
    updateTargetPickerUI();
}

function rollDice() {
    if (state.phase !== 'rolling' || state.rollsLeft <= 0 || state.rollingAnim) return;
    // защита от нетерпеливого двойного тапа: пауза после предыдущего броска
    if (Date.now() - (state.lastRollDoneAt || 0) < 600) return;

    if (state.target === null) {
        // в обучении цель хода задана сценарием: сначала «глаза», потом «следы»
        if (Tutorial.active) state.uiTarget = Tutorial.riggedTarget();
        state.target = state.uiTarget;
        state.lastTarget = state.uiTarget;
        updateTargetPickerUI();
    }

    state.rollsLeft--;
    $('rolls-left').textContent = state.rollsLeft;
    state.rollingAnim = true;
    $('roll-btn').disabled = true;
    Sound.play('diceShake');

    // Анимация тряски незалоченных кубиков
    for (let i = 0; i < 3; i++) {
        if (!state.locked[i]) $('die-' + i).classList.add('rolling');
    }

    setTimeout(() => {
        for (let i = 0; i < 3; i++) {
            $('die-' + i).classList.remove('rolling');
            if (!state.locked[i]) {
                let face;
                if (Tutorial.active) {
                    // в обучении бросок всегда удачный: глаза либо следы (2+1+1 = 4 шага)
                    face = state.target === 'eyes' ? DICE_FACES[0] : (i === 0 ? DICE_FACES[5] : DICE_FACES[3]);
                } else {
                    face = DICE_FACES[Math.floor(Math.random() * DICE_FACES.length)];
                }
                state.dice[i] = { ...face };
                if (face.type === state.target) state.locked[i] = true;
            }
        }
        Sound.play('diceThrow');
        updateDiceUI();
        state.rollingAnim = false;
        state.lastRollDoneAt = Date.now();
        resolveRoll();
    }, 480);
}

function resolveRoll() {
    const matching = state.dice.filter(d => d && d.type === state.target).length;
    const hint = $('dice-hint');
    const token = state.turnId;

    if (matching === 3) {
        Sound.play('success');
        if (Tutorial.active) Tutorial.consumeRig();
        Tutorial.notify('rollResolved');
        if (state.target === 'eyes') {
            hint.textContent = t('dice_success_eyes');
            hint.className = 'dice-hint st-good';
            setTimeout(() => {
                if (token !== state.turnId || state.phase === 'gameover') return;
                closeModal();
                const hiddenCount = SUSPECTS.filter(s => !s.isRevealed).length;
                state.phase = 'revealing';
                state.revealContext = 'turn';
                state.pendingReveals = Math.min(2, hiddenCount);
                setStatus(state.pendingReveals === 1 ? t('status_open_1') : t('status_open_2'));
                switchScreen('suspects');
                updateAllSuspectCards();
                updateActionButtons();
                saveGame();
            }, 900);
        } else {
            const steps = state.dice.reduce((sum, d) => sum + d.steps, 0);
            hint.textContent = t('dice_success_steps', { n: steps });
            hint.className = 'dice-hint st-good';
            setTimeout(() => {
                if (token !== state.turnId || state.phase === 'gameover') return;
                closeModal();
                state.phase = 'moving';
                state.steps = steps;
                setStatus(t('status_move', { n: steps }));
                switchScreen('board');
                updateActionButtons();
                updateReachable();
                saveGame();
            }, 900);
        }
    } else if (state.rollsLeft === 0) {
        Sound.play('fail');
        Tutorial.notify('rollResolved');
        hint.textContent = t('dice_fail');
        hint.className = 'dice-hint st-bad';
        setTimeout(() => {
            if (token !== state.turnId || state.phase === 'gameover') return;
            closeModal();
            setStatus(t('status_fail'), 'bad');
            moveFox(3);
            if (state.phase !== 'gameover') {
                setTimeout(() => {
                    if (token !== state.turnId || state.phase === 'gameover') return;
                    nextPlayer();
                }, 900);
            }
        }, 1100);
    } else {
        hint.textContent = t('dice_matches', { n: matching });
        hint.className = 'dice-hint st-warn';
        $('roll-btn').disabled = false;
        $('roll-btn').textContent = t('btn_reroll');
    }
}

// ================= Перемещение по полю =================

function playerOnClue() {
    const p = activePlayer();
    return p && state.clues.some(c => c.x === p.pos.x && c.y === p.pos.y);
}

// Тап по «декоративному» месту: пусть нарисованное отзывается — подпрыгивает
function pokeCell(x, y) {
    let target = null;
    const foxPos = FOX_PATH[Math.min(state.fox, FOX_PATH.length - 1)];
    if (foxPos.x === x && foxPos.y === y) target = $('fox-token')?.querySelector('img');
    if (!target) {
        const pi = state.players.findIndex(p => p.pos.x === x && p.pos.y === y);
        if (pi !== -1) target = $('pawn-' + pi)?.querySelector('img');
    }
    if (!target) target = cellAt(x, y)?.querySelector('.cell-art img');
    if (!target) return;
    target.classList.remove('poke');
    void target.offsetWidth;
    target.classList.add('poke');
    Sound.play('click');
}

function onCellClick(x, y) {
    if (state.phase !== 'moving' || state.steps <= 0) { pokeCell(x, y); return; }
    const p = activePlayer();
    const dist = Math.max(Math.abs(x - p.pos.x), Math.abs(y - p.pos.y));
    if (dist === 0) { pokeCell(x, y); return; }
    if (dist > state.steps) {
        // клетка вне зоны ходьбы: покачаем её, чтобы было видно «сюда нельзя»
        const cell = cellAt(x, y);
        cell.classList.remove('shake-no');
        void cell.offsetWidth;
        cell.classList.add('shake-no');
        setStatus(t('status_too_far', { n: state.steps }));
        return;
    }

    p.pos = { x, y };
    state.steps -= dist;
    Sound.play('step');
    positionPawns();
    updateReachable();
    updateActionButtons();
    saveGame();

    const onClue = playerOnClue();

    if (onClue) {
        Sound.play('clue');
        setStatus(state.steps > 0 ? t('status_clue_found_move') : t('status_clue_found_end'), 'good');
        Tutorial.notify('reachedClue');
    } else if (state.steps === 0) {
        setStatus(t('status_no_steps'));
        const token = state.turnId;
        setTimeout(() => {
            if (state.phase !== 'moving' || token !== state.turnId) return;
            nextPlayer();
        }, 800);
    } else {
        setStatus(t('status_steps_left', { n: state.steps }));
    }
}

// ================= Гриб-улика и дешифратор =================

function pickMushroom() {
    if (state.phase !== 'moving') return;
    const p = activePlayer();
    const idx = state.clues.findIndex(c => c.x === p.pos.x && c.y === p.pos.y);
    if (idx === -1) return;

    const clue = state.clues[idx];
    const hasIt = !!state.secretThief[clue.clueKey];
    state.checked[clue.clueKey] = hasIt;
    state.clues.splice(idx, 1);

    // Сцена «лупа наводится на улику»: предмет в центре, лупа подъезжает,
    // в линзе с задержкой появляется вердикт
    const label = t('clue_' + clue.clueKey);
    $('lens-item').src = ASSET_DIR + 'item-' + clue.clueKey + '.webp';
    $('lens-verdict-item').src = ASSET_DIR + 'item-' + clue.clueKey + '.webp';
    const verdict = $('lens-verdict');
    verdict.className = 'lens-verdict ' + (hasIt ? 'show-yes' : 'show-no');
    verdict.querySelector('span').textContent = hasIt ? '✓' : '✗';
    verdict.querySelector('span').style.color = hasIt ? '#2f6b3b' : '#a33630';
    const txt = $('lens-text');
    txt.textContent = hasIt ? t('decoder_has', { label }) : t('decoder_hasnt', { label });
    txt.className = 'decoder-result delayed ' + (hasIt ? 'res-yes' : 'res-no');
    // перезапуск CSS-анимаций сцены
    const mag = $('lens-magnifier');
    [mag, verdict, txt].forEach(el => { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; });

    openModal('modal-decoder');
    Sound.play('clue');
    const token = state.turnId;
    setTimeout(() => {
        if (token !== state.turnId) return;
        Sound.play(hasIt ? 'success' : 'cardFlip');
    }, 1200);

    updateClueChips();
    updateBoardCells();
    updateActionButtons();
    saveGame();
    Tutorial.notify('cluePicked');
}

function closeDecoderModal() {
    Sound.play('click');
    closeModal();
    Tutorial.notify('decoderClosed');
    if (state.phase !== 'moving') return;
    if (state.steps === 0) {
        const token = state.turnId;
        setStatus(t('status_no_steps'));
        setTimeout(() => {
            if (state.phase !== 'moving' || token !== state.turnId) return;
            nextPlayer();
        }, 700);
    } else {
        setStatus(t('status_steps_left', { n: state.steps }));
    }
}

// ================= Досье, обвинение, освобождение =================

function openDossier(i) {
    if (state.phase === 'gameover') return;
    const s = SUSPECTS[i];
    Sound.play('cardFlip');

    const attrs = CLUE_TYPES.filter(ct => s[ct.key])
        .map(ct => `<span class="dossier-attr">${itemImg(ct.key, 20)} ${t('clue_' + ct.key)}</span>`)
        .join('') || `<span class="dossier-attr">${t('no_attrs_full')}</span>`;

    // Сравнение примет с уликами — задача юных сыщиков, подсказок не даём
    const note = s.isReleased
        ? `<p class="dossier-note">${t('dossier_released')}</p>`
        : '';

    $('dossier-content').innerHTML = `
        <div class="dossier-portrait">${suspectImg(i)}</div>
        <div class="dossier-name">${suspectName(s)}</div>
        <div class="dossier-attrs">${attrs}</div>
        ${note}`;

    const actions = $('dossier-actions');
    actions.innerHTML = '';
    if (!s.isReleased) {
        const accuseBtn = document.createElement('button');
        accuseBtn.className = 'btn btn-danger';
        accuseBtn.textContent = t('btn_accuse');
        accuseBtn.addEventListener('click', () => confirmAccuse(i));
        actions.appendChild(accuseBtn);

        const releaseBtn = document.createElement('button');
        releaseBtn.className = 'btn btn-secondary';
        releaseBtn.textContent = t('btn_release');
        releaseBtn.addEventListener('click', () => releaseSuspect(i));
        actions.appendChild(releaseBtn);
    }
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn';
    closeBtn.textContent = t('btn_close');
    closeBtn.addEventListener('click', () => { Sound.play('click'); closeModal(); });
    actions.appendChild(closeBtn);

    openModal('modal-dossier');
}

function releaseSuspect(i) {
    SUSPECTS[i].isReleased = true;
    updateSuspectCard(i);
    Sound.play('cardDeal');
    closeModal();
    saveGame();
}

function confirmAccuse(i) {
    const s = SUSPECTS[i];
    Sound.play('click');
    $('confirm-title').textContent = t('confirm_accuse_title', { name: suspectName(s) });
    $('confirm-text').textContent = t('confirm_accuse_text');
    $('confirm-yes-btn').onclick = () => resolveAccuse(i);
    $('confirm-no-btn').onclick = () => openDossier(i);
    openModal('modal-confirm');
}

function resolveAccuse(i) {
    if (i === state.thiefIndex) {
        endGame(true);
        return;
    }
    // Мимо: подозреваемый доказал невиновность, лис получает фору
    SUSPECTS[i].isReleased = true;
    updateSuspectCard(i);
    Sound.play('wrong');
    $('confirm-title').textContent = t('miss_title');
    $('confirm-text').textContent = t('miss_text', { name: suspectName(SUSPECTS[i]) });
    $('confirm-no-btn').classList.add('hidden');
    const yes = $('confirm-yes-btn');
    yes.textContent = t('btn_ok');
    yes.onclick = () => {
        yes.textContent = t('btn_yes');
        $('confirm-no-btn').classList.remove('hidden');
        closeModal();
        setStatus(t('status_false_accuse', { name: suspectName(SUSPECTS[i]) }), 'bad');
        moveFox(5);
        saveGame();
    };
}

// ================= Лис и конец игры =================

function moveFox(n) {
    const from = state.fox;
    state.fox = Math.min(FOX_TRACK_LENGTH, state.fox + n);
    Sound.play('foxRun');
    positionFoxToken(null, from);
    updateDangerBadge();
    if (state.fox >= FOX_TRACK_LENGTH) endGame(false);
    else saveGame();
}

function endGame(isWin) {
    state.phase = 'gameover';
    state.turnId++;
    const thief = state.secretThief;
    const content = $('endgame-content');
    if (isWin) {
        Sound.play('win');
        content.innerHTML = `
            <div class="endgame-art">${pieImg(120)}</div>
            <div class="endgame-title win">${t('win_title')}</div>
            <p class="modal-sub">${t('win_sub')}</p>
            <div class="endgame-thief">${suspectImg(state.thiefIndex)}
                <div class="dossier-name">${suspectName(thief)}</div>
            </div>`;
        setStatus(t('status_win', { name: suspectName(thief) }), 'good');
    } else {
        Sound.play('lose');
        content.innerHTML = `
            <div class="endgame-art">${burrowImg(120)}</div>
            <div class="endgame-title lose">${t('lose_title')}</div>
            <p class="modal-sub">${t('lose_sub')}</p>
            <div class="endgame-thief">${suspectImg(state.thiefIndex)}
                <div class="dossier-name">${suspectName(thief)}</div>
            </div>`;
        setStatus(t('status_lose', { name: suspectName(thief) }), 'bad');
    }
    updateActionButtons();
    updateReachable();
    updateAllSuspectCards();
    openModal('modal-endgame');
    saveGame(); // очистит сохранение
}

// ================= Настройки и правила =================

function openSettings() {
    Sound.play('click');
    $('set-music-toggle').checked = Sound.musicOn;
    $('set-sfx-toggle').checked = Sound.sfxOn;
    document.querySelectorAll('.lang-btn').forEach(b => {
        b.classList.toggle('selected', b.dataset.lang === LANG);
    });
    $('donate-row').classList.toggle('hidden', !IS_NATIVE);
    openModal('modal-settings');
}

function switchLang(lang) {
    if (lang === LANG) return;
    LANG = lang;
    localStorage.setItem('dg_lang', lang);
    applyStaticTexts();
    buildClueChips();
    if (state.players.length) {
        buildSuspectCards();
        renderPlayersStrip();
    }
    document.querySelectorAll('.lang-btn').forEach(b => {
        b.classList.toggle('selected', b.dataset.lang === LANG);
    });
}

// --- Правила (карусель) ---
const RULE_SLIDES = [1, 2, 3, 4, 5, 6].map(n => ({
    img: () => `<img src="${ASSET_DIR}rules-${n}.webp" alt="">`,
    tKey: `rule${n}_t`,
    key: `rule${n}`,
}));
let ruleIdx = 0;

function openRules() {
    Sound.play('click');
    ruleIdx = 0;
    renderRuleSlide();
    openModal('modal-rules');
}

function renderRuleSlide() {
    const s = RULE_SLIDES[ruleIdx];
    $('rules-slide').innerHTML = `
        <div class="rules-art">${s.img()}</div>
        <div class="rules-slide-title">${t(s.tKey)}</div>
        <p class="rules-text">${t(s.key)}</p>`;
    $('rules-dots').innerHTML = RULE_SLIDES
        .map((_, i) => `<span class="dot-nav${i === ruleIdx ? ' on' : ''}"></span>`).join('');
    $('rules-prev').disabled = ruleIdx === 0;
    $('rules-next').textContent = ruleIdx === RULE_SLIDES.length - 1 ? t('btn_close') : '→';
}

// ================= Донат (Google Play Billing через cordova-plugin-purchase) =================

function initDonation() {
    if (!IS_NATIVE || !window.CdvPurchase) return;
    try {
        const { store, ProductType, Platform } = window.CdvPurchase;
        store.register([{ id: 'donate_5', type: ProductType.CONSUMABLE, platform: Platform.GOOGLE_PLAY }]);
        store.when().approved(tr => { tr.finish(); alert(t('donate_thanks')); });
        store.initialize([Platform.GOOGLE_PLAY]);
        $('donate-btn').addEventListener('click', () => {
            const offer = store.get('donate_5', Platform.GOOGLE_PLAY)?.getOffer();
            if (offer) offer.order();
        });
    } catch (e) { /* биллинг недоступен — кнопка просто неактивна */ }
}

// ================= Экран загрузки =================

function preloadAssets(onDone) {
    const files = [];
    SUSPECT_IMGS.forEach(f => files.push(ASSET_DIR + f));
    ANIMALS.forEach(a => files.push(ASSET_DIR + 'detective-' + a.key + '.webp'));
    CLUE_TYPES.forEach(ct => files.push(ASSET_DIR + 'item-' + ct.key + '.webp'));
    ['fox-thief', 'burrow', 'pie', 'logo', 'icon-eye', 'icon-paw', 'icon-paw-double',
     'icon-dice', 'icon-magnifier', 'clue-mushroom',
     'decor-bush', 'decor-flower-pink', 'decor-flower-white', 'decor-grass', 'decor-stone']
        .forEach(n => files.push(ASSET_DIR + n + '.webp'));
    ['tex-grass', 'tex-page-bg', 'tile-mystery'].forEach(n => files.push(ASSET_RAW + n + '.webp'));
    files.push(ASSET_RAW + 'board-bg.webp?v=2'); // версия синхронно с css/styles.css

    let loaded = 0;
    let finished = false;
    const bar = $('loading-bar-fill');
    const finish = () => {
        if (finished) return; // страховочный таймер не должен вызвать onDone повторно
        finished = true;
        $('loading-screen').classList.add('hidden');
        onDone();
    };
    const tick = () => {
        loaded++;
        if (bar) bar.style.width = Math.round(loaded / files.length * 100) + '%';
        if (loaded >= files.length) finish();
    };
    files.forEach(src => {
        const img = new Image();
        img.onload = tick;
        img.onerror = tick;
        img.src = src;
    });
    setTimeout(finish, 8000); // страховка от зависания загрузки
}

// ================= Постановочные сцены для скриншотов стора =================

function setupScreenshotScene(kind) {
    const params = new URLSearchParams(location.search);
    const lang = params.get('lang');
    if (lang && I18N[lang]) { LANG = lang; applyStaticTexts(); }
    localStorage.setItem('dg_tut_done', '1');
    localStorage.removeItem('dg_save');

    renderPlayerSetupRows(getSelectedPlayerCount()); // иначе startGame не найдёт игроков
    startGame();
    Tutorial.finish();
    closeModal();

    // открываем несколько карт для живости
    [0, 3, 7, 12].forEach(i => { SUSPECTS[i].isRevealed = true; });

    if (kind === 'suspects') {
        updateAllSuspectCards();
        switchScreen('suspects');
    } else if (kind === 'dice') {
        state.phase = 'rolling';
        openDiceModal();
        state.target = 'clues';
        state.dice = [DICE_FACES[3], DICE_FACES[0], DICE_FACES[5]].map(f => ({ ...f }));
        state.locked = [true, false, true];
        updateDiceUI();
    } else if (kind === 'decoder') {
        state.phase = 'moving';
        state.steps = 2;
        const c = state.clues[0];
        activePlayer().pos = { x: c.x, y: c.y };
        positionPawns();
        pickMushroom();
    } else { // board
        state.phase = 'moving';
        state.steps = 3;
        state.fox = 4;
        activePlayer().pos = { x: 6, y: 6 };
        positionFoxToken();
        updateDangerBadge();
        positionPawns();
        updateActionButtons();
        updateReachable();
        setStatus(t('status_move', { n: 3 }));
        switchScreen('board');
    }
    updateAllSuspectCards();
}

// ================= Инициализация =================

document.addEventListener('DOMContentLoaded', () => {
    // Иконки в статичной разметке
    $('title-icon').innerHTML = logoImg(40);
    $('fox-danger-icon').innerHTML = foxThiefImg(30);
    $('dice-modal-icon').innerHTML = diceIconImg(26);
    $('decoder-modal-icon').innerHTML = magnifierImg(28);
    $('setup-modal-icon').innerHTML = pieImg(32);
    $('target-eye-icon').innerHTML = eyeIcon(30);
    $('target-paw-icon').innerHTML = pawIcon(26);
    $('steps-icon').innerHTML = pawIcon(18);
    $('loading-logo').innerHTML = logoImg(96);
    $('tab-board-ico').innerHTML = pawIcon(26);
    $('tab-suspects-ico').innerHTML = logoImg(26);

    applyStaticTexts();
    Sound.preload();
    document.addEventListener('pointerdown', () => Sound.unlock(), { once: true });

    // Выбор числа игроков
    const picker = $('player-count-picker');
    picker.querySelector('[data-count="1"]').classList.add('selected');
    picker.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            Sound.play('click');
            picker.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            renderPlayerSetupRows(Number(btn.dataset.count));
        });
    });

    $('start-game-btn').addEventListener('click', () => {
        // посреди партии — предупреждаем, что прогресс пропадёт
        if (state.players.length > 0 && state.phase !== 'gameover') {
            Sound.play('click');
            $('confirm-title').textContent = t('confirm_new_title');
            $('confirm-text').textContent = t('confirm_new_text');
            $('confirm-yes-btn').onclick = () => startGame();
            $('confirm-no-btn').onclick = () => openSetupModal(true);
            openModal('modal-confirm');
            return;
        }
        startGame();
    });
    $('setup-cancel-btn').addEventListener('click', () => { Sound.play('click'); closeModal(); });
    $('new-game-btn').addEventListener('click', () => openSetupModal(state.players.length > 0));
    $('endgame-new-btn').addEventListener('click', () => openSetupModal(false));

    // Кубики
    $('roll-open-btn').addEventListener('click', openDiceModal);
    $('roll-btn').addEventListener('click', rollDice);
    document.querySelectorAll('.target-btn').forEach(btn => {
        btn.addEventListener('click', () => selectTarget(btn.dataset.target));
    });

    // Поле (делегирование кликов)
    $('board-grid').addEventListener('click', (e) => {
        const cell = e.target.closest('.board-cell');
        if (cell) onCellClick(Number(cell.dataset.x), Number(cell.dataset.y));
    });

    // Панель действий
    $('check-clue-btn').addEventListener('click', pickMushroom);
    $('end-turn-btn').addEventListener('click', endTurnManually);
    $('decoder-close-btn').addEventListener('click', closeDecoderModal);

    // Настройки и правила
    $('settings-btn').addEventListener('click', openSettings);
    $('rules-btn').addEventListener('click', openRules);
    $('settings-close-btn').addEventListener('click', () => { Sound.play('click'); closeModal(); });
    $('set-music-toggle').addEventListener('change', e => Sound.setMusic(e.target.checked));
    $('set-sfx-toggle').addEventListener('change', e => Sound.setSfx(e.target.checked));
    document.querySelectorAll('.lang-btn').forEach(b => {
        b.addEventListener('click', () => { Sound.play('click'); switchLang(b.dataset.lang); });
    });
    $('settings-rules-btn').addEventListener('click', openRules);
    $('settings-tutorial-btn').addEventListener('click', () => {
        Sound.play('click');
        localStorage.removeItem('dg_tut_done');
        closeModal();
        openSetupModal(false);
    });
    $('rules-prev').addEventListener('click', () => {
        Sound.play('click');
        if (ruleIdx > 0) { ruleIdx--; renderRuleSlide(); }
    });
    $('rules-next').addEventListener('click', () => {
        Sound.play('click');
        if (ruleIdx < RULE_SLIDES.length - 1) { ruleIdx++; renderRuleSlide(); }
        else closeModal();
    });

    // Продолжение партии
    $('resume-yes-btn').addEventListener('click', () => {
        Sound.play('click');
        const data = loadSavedGame();
        if (data) restoreGame(data);
        else openSetupModal(false);
    });
    $('resume-no-btn').addEventListener('click', () => {
        Sound.play('click');
        localStorage.removeItem('dg_save');
        openSetupModal(false);
    });

    // Клик по подложке закрывает только «отпускаемые» модалки
    $('modal-overlay').addEventListener('click', (e) => {
        if (e.target !== $('modal-overlay')) return;
        const modal = currentModal();
        if (!modal || modal.dataset.dismiss !== 'true') return;
        if (modal.id === 'modal-decoder') closeDecoderModal();
        else closeModal();
    });

    // Вкладки «Поле» / «Подозреваемые»
    $('tab-board').addEventListener('click', () => { Sound.play('click'); switchScreen('board'); });
    $('tab-suspects').addEventListener('click', () => { Sound.play('click'); switchScreen('suspects'); });

    // Пересчёт позиций фишек при любом изменении размеров доски
    window.addEventListener('resize', () => requestAnimationFrame(() => { fitScreens(); positionPawns(); }));
    new ResizeObserver(() => positionPawns()).observe($('board-grid'));
    // после загрузки шрифта высота шапки меняется — пересчитываем компоновку
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => { fitScreens(); positionPawns(); });
    }
    // страховка: некоторые окружения не шлют resize при смене вьюпорта
    let lastFitSig = '';
    setInterval(() => {
        const sig = $('board-grid').clientWidth + 'x' + $('app-header').offsetHeight + 'x' + window.innerWidth + 'x' + window.innerHeight;
        if (sig !== lastFitSig) {
            lastFitSig = sig;
            fitScreens();
            positionPawns();
        }
    }, 500);

    initDonation();
    fitScreens();

    preloadAssets(() => {
        fitScreens();
        // служебный режим для скриншотов стора: ?shot=board|suspects|dice|decoder&lang=ru|en
        const shot = new URLSearchParams(location.search).get('shot');
        if (shot) { setupScreenshotScene(shot); return; }
        const saved = loadSavedGame();
        if (saved) openModal('modal-resume');
        else openSetupModal(false);
    });
});
