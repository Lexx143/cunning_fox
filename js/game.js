// ================= Состояние и логика игры =================

const state = {
    phase: 'idle', // idle | revealing | rolling | moving | gameover
    players: [],   // {name, color, animal, pos:{x,y}}
    current: 0,
    fox: 0,
    clues: [],     // улики на поле [{x,y,kind:'berry'|'mushroom'}]
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

// выбор зверьков на экране настройки: индекс ANIMALS для каждого игрока
let setupAnimals = [0, 1, 2, 3];

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
        nameRow.innerHTML = `<span class="dot" style="background:${PLAYER_COLORS[i].value}"></span>`;
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.maxLength = 14;
        inp.placeholder = `Сыщик ${i + 1}`;
        inp.value = prev[i] || '';
        nameRow.appendChild(inp);
        row.appendChild(nameRow);

        const picker = document.createElement('div');
        picker.className = 'animal-picker';
        ANIMALS.forEach((animal, ai) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'animal-btn';
            btn.title = animal.name;
            btn.innerHTML = detectiveImg(animal.key);
            btn.addEventListener('click', () => {
                const takenByOther = setupAnimals.slice(0, count).some((a, pi) => pi !== i && a === ai);
                if (takenByOther) return;
                setupAnimals[i] = ai;
                refreshAnimalPickers(count);
            });
            picker.appendChild(btn);
        });
        row.appendChild(picker);
        wrap.appendChild(row);
    }
    refreshAnimalPickers(count);
}

function refreshAnimalPickers(count) {
    const rows = $('player-names').querySelectorAll('.player-setup-row');
    rows.forEach((row, i) => {
        row.querySelectorAll('.animal-btn').forEach((btn, ai) => {
            btn.classList.toggle('selected', setupAnimals[i] === ai);
            const takenByOther = setupAnimals.slice(0, count).some((a, pi) => pi !== i && a === ai);
            btn.classList.toggle('taken', takenByOther);
        });
    });
}

function startGame() {
    const count = getSelectedPlayerCount();
    const names = [...$('player-names').querySelectorAll('input')]
        .map((inp, i) => inp.value.trim() || ANIMALS[setupAnimals[i]].name);

    SUSPECTS.forEach(s => { s.isRevealed = false; s.isReleased = false; });
    state.thiefIndex = Math.floor(Math.random() * SUSPECTS.length);
    state.secretThief = SUSPECTS[state.thiefIndex];

    state.players = names.map((name, i) => ({
        name,
        color: PLAYER_COLORS[i].value,
        animal: ANIMALS[setupAnimals[i]].key,
        pos: { ...START_POSITIONS[i] },
    }));
    state.current = 0;
    state.fox = 0;
    state.checked = {};
    state.steps = 0;
    state.turnId++;

    // Раскладываем улики (ягодки и грибочки): не в центре, не на тропе лиса, без повторов
    state.clues = [];
    while (state.clues.length < NUM_CLUES) {
        const rx = Math.floor(Math.random() * GRID_SIZE);
        const ry = Math.floor(Math.random() * GRID_SIZE);
        if (isCellBlocked(rx, ry)) continue;
        if (state.clues.some(c => c.x === rx && c.y === ry)) continue;
        state.clues.push({ x: rx, y: ry, kind: state.clues.length % 2 === 0 ? 'berry' : 'mushroom' });
    }

    // Декор лужайки: кустики, цветочки, травка, камушки
    state.decor = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (isCellBlocked(x, y)) continue;
            if (state.clues.some(c => c.x === x && c.y === y)) continue;
            if (Math.random() < 0.12) {
                state.decor.push({ x, y, t: DECOR_POOL[Math.floor(Math.random() * DECOR_POOL.length)] });
            }
        }
    }

    buildBoard();
    buildPawns();
    buildSuspectCards();
    updateDangerBadge();
    updateClueChips();
    renderPlayersStrip();

    state.phase = 'revealing';
    state.revealContext = 'initial';
    state.pendingReveals = 2;
    setStatus('Лис стащил пирог и удирает к норе! Откройте 2 карты подозреваемых.');
    updateAllSuspectCards();
    updateActionButtons();
    updateReachable();
    closeModal();
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
        ? `Ход: ${pl.name}. Бросайте кубики!`
        : 'Ваш ход. Бросайте кубики!');
    renderPlayersStrip();
    positionPawns();
    updateActionButtons();
    updateReachable();
    updateAllSuspectCards();
}

function nextPlayer() {
    beginTurn((state.current + 1) % state.players.length);
}

function endTurnManually() {
    if (state.phase !== 'moving') return;
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

    if (state.pendingReveals > 0) {
        setStatus(`Осталось открыть карт: ${state.pendingReveals}`);
        return;
    }

    setStatus('Карты открыты!', 'good');
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
    state.rollsLeft = 3;
    state.target = null;
    state.dice = [null, null, null];
    state.locked = [false, false, false];
    state.rollingAnim = false;

    const hiddenCount = SUSPECTS.filter(s => !s.isRevealed).length;
    if (hiddenCount === 0 && state.lastTarget === 'eyes') state.lastTarget = 'clues';
    state.uiTarget = state.lastTarget;

    const eyesBtn = document.querySelector('.target-btn[data-target="eyes"]');
    eyesBtn.disabled = hiddenCount === 0;
    eyesBtn.title = hiddenCount === 0 ? 'Все карты уже открыты' : '';

    updateTargetPickerUI();
    for (let i = 0; i < 3; i++) {
        const el = $('die-' + i);
        el.innerHTML = '<span class="die-q">?</span>';
        el.classList.remove('locked', 'rolling');
    }
    $('rolls-left').textContent = state.rollsLeft;
    const hint = $('dice-hint');
    hint.textContent = 'Нужно 3 одинаковых символа цели!';
    hint.className = 'dice-hint';
    $('roll-btn').disabled = false;
    $('roll-btn').textContent = 'Бросить!';
    openModal('modal-dice');
}

function updateTargetPickerUI() {
    document.querySelectorAll('.target-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.target === state.uiTarget);
        btn.classList.toggle('locked-choice', state.target !== null);
    });
}

function selectTarget(t) {
    if (state.target !== null) return; // после первого броска цель зафиксирована
    state.uiTarget = t;
    updateTargetPickerUI();
}

function rollDice() {
    if (state.phase !== 'rolling' || state.rollsLeft <= 0 || state.rollingAnim) return;

    if (state.target === null) {
        state.target = state.uiTarget;
        state.lastTarget = state.uiTarget;
        updateTargetPickerUI();
    }

    state.rollsLeft--;
    $('rolls-left').textContent = state.rollsLeft;
    state.rollingAnim = true;
    $('roll-btn').disabled = true;

    // Анимация тряски незалоченных кубиков
    for (let i = 0; i < 3; i++) {
        if (!state.locked[i]) $('die-' + i).classList.add('rolling');
    }

    setTimeout(() => {
        for (let i = 0; i < 3; i++) {
            $('die-' + i).classList.remove('rolling');
            if (!state.locked[i]) {
                const face = DICE_FACES[Math.floor(Math.random() * DICE_FACES.length)];
                state.dice[i] = { ...face };
                if (face.type === state.target) state.locked[i] = true;
            }
        }
        updateDiceUI();
        state.rollingAnim = false;
        resolveRoll();
    }, 480);
}

function resolveRoll() {
    const matching = state.dice.filter(d => d && d.type === state.target).length;
    const hint = $('dice-hint');
    const token = state.turnId;

    if (matching === 3) {
        if (state.target === 'eyes') {
            hint.textContent = 'Успех! Вы можете открыть карты подозреваемых.';
            hint.className = 'dice-hint st-good';
            setTimeout(() => {
                if (token !== state.turnId || state.phase === 'gameover') return;
                closeModal();
                const hiddenCount = SUSPECTS.filter(s => !s.isRevealed).length;
                state.phase = 'revealing';
                state.revealContext = 'turn';
                state.pendingReveals = Math.min(2, hiddenCount);
                setStatus(state.pendingReveals === 1
                    ? 'Откройте 1 закрытую карту.'
                    : 'Откройте 2 закрытые карты.');
                updateAllSuspectCards();
                updateActionButtons();
            }, 900);
        } else {
            const steps = state.dice.reduce((sum, d) => sum + d.steps, 0);
            hint.textContent = `Успех! Шагов сыщика: ${steps}.`;
            hint.className = 'dice-hint st-good';
            setTimeout(() => {
                if (token !== state.turnId || state.phase === 'gameover') return;
                closeModal();
                state.phase = 'moving';
                state.steps = steps;
                setStatus(`Идите по подсвеченным клеткам. Шагов: ${steps}.`);
                updateActionButtons();
                updateReachable();
            }, 900);
        }
    } else if (state.rollsLeft === 0) {
        hint.textContent = 'Провал! Лис делает 3 шага к норе…';
        hint.className = 'dice-hint st-bad';
        setTimeout(() => {
            if (token !== state.turnId || state.phase === 'gameover') return;
            closeModal();
            setStatus('Провал броска! Лис убегает на 3 шага.', 'bad');
            moveFox(3);
            if (state.phase !== 'gameover') {
                setTimeout(() => {
                    if (token !== state.turnId || state.phase === 'gameover') return;
                    nextPlayer();
                }, 900);
            }
        }, 1100);
    } else {
        hint.textContent = `Совпадений: ${matching} из 3. Бросайте ещё!`;
        hint.className = 'dice-hint st-warn';
        $('roll-btn').disabled = false;
        $('roll-btn').textContent = 'Перебросить';
    }
}

// ================= Перемещение по полю =================

function playerOnClue() {
    const p = activePlayer();
    return p && state.clues.some(c => c.x === p.pos.x && c.y === p.pos.y);
}

function onCellClick(x, y) {
    if (state.phase !== 'moving' || state.steps <= 0) return;
    const p = activePlayer();
    const dx = Math.abs(x - p.pos.x);
    const dy = Math.abs(y - p.pos.y);
    if (dx > 1 || dy > 1 || (dx === 0 && dy === 0)) return;

    p.pos = { x, y };
    state.steps--;
    positionPawns();
    updateReachable();
    updateActionButtons();

    const onClue = playerOnClue();
    const cluesRemain = Object.keys(state.checked).length < CLUE_TYPES.length;

    if (onClue && cluesRemain) {
        setStatus(state.steps > 0
            ? 'Вы нашли улику! Проверьте её или идите дальше.'
            : 'Вы нашли улику! Проверьте её или завершите ход.', 'good');
    } else if (state.steps === 0) {
        setStatus('Шаги закончились.');
        const token = state.turnId;
        setTimeout(() => {
            if (state.phase !== 'moving' || token !== state.turnId) return;
            nextPlayer();
        }, 800);
    } else {
        setStatus(`Шагов осталось: ${state.steps}.`);
    }
}

// ================= Дешифратор =================

function openDecoderModal() {
    if (state.phase !== 'moving' || !playerOnClue()) return;
    const grid = $('decoder-clues');
    grid.innerHTML = '';
    CLUE_TYPES.forEach(ct => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'clue-option';
        btn.innerHTML = `<span class="clue-icon">${itemImg(ct.key, 46)}</span>${ct.label}`;
        if (ct.key in state.checked) {
            btn.disabled = true;
            btn.classList.add(state.checked[ct.key] ? 'checked-yes' : 'checked-no');
        } else {
            btn.addEventListener('click', () => checkClue(ct, btn));
        }
        grid.appendChild(btn);
    });
    $('decoder-sub').textContent = 'Выберите примету для проверки:';
    $('decoder-result').textContent = '';
    $('decoder-close-btn').textContent = 'Закрыть';
    openModal('modal-decoder');
}

function checkClue(ct, btn) {
    const hasIt = !!state.secretThief[ct.key];
    state.checked[ct.key] = hasIt;

    // Улика на поле потрачена
    const p = activePlayer();
    const idx = state.clues.findIndex(c => c.x === p.pos.x && c.y === p.pos.y);
    if (idx !== -1) state.clues.splice(idx, 1);

    const result = $('decoder-result');
    if (hasIt) {
        result.innerHTML = `${itemImg(ct.key, 24)} У вора ЕСТЬ: ${ct.label.toLowerCase()}`;
        result.className = 'decoder-result res-yes';
    } else {
        result.innerHTML = `${itemImg(ct.key, 24)} У вора НЕТ: ${ct.label.toLowerCase()}`;
        result.className = 'decoder-result res-no';
    }
    $('decoder-sub').textContent = 'Улика расшифрована!';

    // Блокируем дальнейший выбор — одна находка = одна проверка
    $('decoder-clues').querySelectorAll('.clue-option').forEach(b => {
        b.disabled = true;
        if (b === btn) b.classList.add(hasIt ? 'checked-yes' : 'checked-no');
    });
    $('decoder-close-btn').textContent = 'Готово';

    updateClueChips();
    updateBoardCells();
    updateAllSuspectCards();
    updateActionButtons();
}

function closeDecoderModal() {
    closeModal();
    if (state.phase !== 'moving') return;
    if (state.steps === 0) {
        const token = state.turnId;
        setStatus('Шаги закончились.');
        setTimeout(() => {
            if (state.phase !== 'moving' || token !== state.turnId) return;
            nextPlayer();
        }, 700);
    } else {
        setStatus(`Шагов осталось: ${state.steps}.`);
    }
}

// ================= Досье, обвинение, освобождение =================

function openDossier(i) {
    if (state.phase === 'gameover') return;
    const s = SUSPECTS[i];

    const attrs = CLUE_TYPES.filter(ct => s[ct.key])
        .map(ct => `<span class="dossier-attr">${itemImg(ct.key, 20)} ${ct.label}</span>`)
        .join('') || '<span class="dossier-attr">Нет примет</span>';

    // Сравнение примет с уликами — задача юных сыщиков, подсказок не даём
    const note = s.isReleased
        ? '<p class="dossier-note">Этот лис уже отпущен на свободу.</p>'
        : '';

    $('dossier-content').innerHTML = `
        <div class="dossier-portrait">${suspectImg(i)}</div>
        <div class="dossier-name">${s.name}</div>
        <div class="dossier-attrs">${attrs}</div>
        ${note}`;

    const actions = $('dossier-actions');
    actions.innerHTML = '';
    if (!s.isReleased) {
        const accuseBtn = document.createElement('button');
        accuseBtn.className = 'btn btn-danger';
        accuseBtn.textContent = 'Обвинить!';
        accuseBtn.addEventListener('click', () => confirmAccuse(i));
        actions.appendChild(accuseBtn);

        const releaseBtn = document.createElement('button');
        releaseBtn.className = 'btn btn-secondary';
        releaseBtn.textContent = 'Отпустить';
        releaseBtn.addEventListener('click', () => releaseSuspect(i));
        actions.appendChild(releaseBtn);
    }
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn';
    closeBtn.textContent = 'Закрыть';
    closeBtn.addEventListener('click', closeModal);
    actions.appendChild(closeBtn);

    openModal('modal-dossier');
}

function releaseSuspect(i) {
    SUSPECTS[i].isReleased = true;
    updateSuspectCard(i);
    closeModal();
}

function confirmAccuse(i) {
    const s = SUSPECTS[i];
    $('confirm-title').textContent = `Обвинить: ${s.name}?`;
    $('confirm-text').textContent = 'Если вы ошибётесь, лис убежит на 5 шагов к норе!';
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
    $('confirm-title').textContent = 'Мимо!';
    $('confirm-text').textContent = `${SUSPECTS[i].name} — не вор. Лис убегает на 5 шагов!`;
    $('confirm-no-btn').classList.add('hidden');
    const yes = $('confirm-yes-btn');
    yes.textContent = 'Понятно';
    yes.onclick = () => {
        yes.textContent = 'Да';
        $('confirm-no-btn').classList.remove('hidden');
        closeModal();
        setStatus(`Ложное обвинение! ${SUSPECTS[i].name} отпущен, лис бежит.`, 'bad');
        moveFox(5);
    };
}

// ================= Лис и конец игры =================

function moveFox(n) {
    state.fox = Math.min(FOX_TRACK_LENGTH, state.fox + n);
    positionFoxToken();
    updateDangerBadge();
    if (state.fox >= FOX_TRACK_LENGTH) endGame(false);
}

function endGame(isWin) {
    state.phase = 'gameover';
    state.turnId++;
    const thief = state.secretThief;
    const content = $('endgame-content');
    if (isWin) {
        content.innerHTML = `
            <div class="endgame-art">${pieImg(120)}</div>
            <div class="endgame-title win">Дело раскрыто!</div>
            <p class="modal-sub">Пирог возвращён! Вор пойман с поличным:</p>
            <div class="endgame-thief">${suspectImg(state.thiefIndex)}
                <div class="dossier-name">${thief.name}</div>
            </div>`;
        setStatus(`Победа! Вор — ${thief.name}!`, 'good');
    } else {
        content.innerHTML = `
            <div class="endgame-art">${burrowImg(120)}</div>
            <div class="endgame-title lose">Лис сбежал!</div>
            <p class="modal-sub">Лис скрылся в норе вместе с пирогом. Вором был:</p>
            <div class="endgame-thief">${suspectImg(state.thiefIndex)}
                <div class="dossier-name">${thief.name}</div>
            </div>`;
        setStatus(`Лис скрылся в норе. Вором был ${thief.name}.`, 'bad');
    }
    updateActionButtons();
    updateReachable();
    updateAllSuspectCards();
    openModal('modal-endgame');
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
    $('roll-open-btn').innerHTML = diceIconImg(20) + ' Бросить кубики';
    $('check-clue-btn').innerHTML = magnifierImg(20) + ' Проверить улику';
    $('steps-icon').innerHTML = pawIcon(18);

    buildClueChips();
    updateDangerBadge();

    // Выбор числа игроков
    const picker = $('player-count-picker');
    picker.querySelector('[data-count="1"]').classList.add('selected');
    picker.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            picker.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            renderPlayerSetupRows(Number(btn.dataset.count));
        });
    });

    $('start-game-btn').addEventListener('click', startGame);
    $('setup-cancel-btn').addEventListener('click', closeModal);
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
    $('check-clue-btn').addEventListener('click', openDecoderModal);
    $('end-turn-btn').addEventListener('click', endTurnManually);
    $('decoder-close-btn').addEventListener('click', closeDecoderModal);

    // Клик по подложке закрывает только «отпускаемые» модалки
    $('modal-overlay').addEventListener('click', (e) => {
        if (e.target !== $('modal-overlay')) return;
        const modal = currentModal();
        if (!modal || modal.dataset.dismiss !== 'true') return;
        if (modal.id === 'modal-decoder') closeDecoderModal();
        else closeModal();
    });

    // Пересчёт позиций фишек при любом изменении размеров доски
    window.addEventListener('resize', () => requestAnimationFrame(positionPawns));
    new ResizeObserver(() => positionPawns()).observe($('board-grid'));
    // страховка: некоторые окружения не шлют resize при смене вьюпорта
    let lastBoardW = 0;
    setInterval(() => {
        const w = $('board-grid').clientWidth;
        if (w !== lastBoardW) {
            lastBoardW = w;
            positionPawns();
        }
    }, 500);

    openSetupModal(false);
});
