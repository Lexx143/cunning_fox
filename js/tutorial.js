// ================= Интерактивный туториал =================
// Затемнение с «прожектором» на нужном элементе + реплики лиса.
// Оверлей не блокирует клики (pointer-events: none) — ведём подсветкой.

const Tutorial = (() => {
    let active = false;
    let stepIdx = -1;
    let overlay = null, spot = null, bubble = null;

    // Сценарий: text — ключ i18n; target — селектор или функция → элемент;
    // advance: 'next' (кнопка) | 'event:имя' (ждём событие игры)
    // Кубики в обучении «подкручены»: 1-й ход всегда «глаза», 2-й — «следы».
    const SCRIPT = [
        { text: 'tut1',           target: '#board-wrap',     advance: 'next', screen: 'board' },
        { text: 'tut2',           target: '#suspects-grid',  advance: 'event:revealed2', screen: 'suspects' },
        { text: 'tut3',           target: '#roll-open-btn',  advance: 'event:diceOpened' },
        { text: 'tut_eyes',       target: '#target-picker',  advance: 'next' },
        { text: 'tut_roll',       target: '#roll-btn',       advance: 'event:rollResolved' },
        { text: 'tut_open_more',  target: '#suspects-grid',  advance: 'event:revealed2' },
        { text: 'tut_roll_again', target: '#roll-open-btn',  advance: 'event:diceOpened' },
        { text: 'tut_paws',       target: '#target-picker',  advance: 'next' },
        { text: 'tut_roll',       target: '#roll-btn',       advance: 'event:rollResolved' },
        { text: 'tut6',           target: '#fox-danger',     advance: 'next' },
        { text: 'tut7',           target: '#board-wrap',     advance: 'event:reachedClue' },
        { text: 'tut8',           target: '#check-clue-btn', advance: 'event:cluePicked' },
        { text: 'tut_lens',       target: '#lens-scene',     advance: 'event:decoderClosed' },
        { text: 'tut9',           target: '#clue-chips',     advance: 'next' },
        { text: 'tut10',          target: '#suspects-grid',  advance: 'next', screen: 'suspects' },
        { text: 'tut11',          target: '#suspects-grid',  advance: 'next' },
        { text: 'tut12',          target: null,              advance: 'finish' },
    ];

    // «Подкрутка» кубиков: какой цели гарантируем успех в текущем ходе обучения
    let riggedTurn = 0;
    function riggedTarget() { return riggedTurn === 0 ? 'eyes' : 'clues'; }
    function consumeRig() { riggedTurn++; }

    function ensureDom() {
        if (overlay) return;
        overlay = document.createElement('div');
        overlay.id = 'tut-overlay';
        overlay.innerHTML = `
            <div id="tut-spot"></div>
            <div id="tut-bubble">
                <span class="tut-fox"></span>
                <p id="tut-text"></p>
                <div class="tut-actions">
                    <button class="btn btn-secondary" id="tut-skip"></button>
                    <button class="btn btn-primary" id="tut-next"></button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        spot = document.getElementById('tut-spot');
        bubble = document.getElementById('tut-bubble');
        overlay.querySelector('.tut-fox').innerHTML = logoImg(52);
        document.getElementById('tut-skip').addEventListener('click', finish);
        document.getElementById('tut-next').addEventListener('click', () => {
            Sound.play('click');
            const step = SCRIPT[stepIdx];
            if (!step) return;
            if (step.advance === 'finish') finish();
            else if (step.advance === 'next') next();
        });
        window.addEventListener('resize', () => { if (active) placeSpot(); });
    }

    function placeSpot() {
        const step = SCRIPT[stepIdx];
        if (!step) return;
        const el = step.target
            ? (typeof step.target === 'function' ? step.target() : document.querySelector(step.target))
            : null;
        if (el && !el.classList.contains('hidden')) {
            const r = el.getBoundingClientRect();
            const pad = 10;
            spot.style.display = 'block';
            spot.style.left = (r.left - pad) + 'px';
            spot.style.top = (r.top - pad) + 'px';
            spot.style.width = (r.width + pad * 2) + 'px';
            spot.style.height = (r.height + pad * 2) + 'px';
            // пузырь — снизу или сверху от цели
            const below = r.bottom + 20;
            const bubbleH = bubble.offsetHeight || 160;
            if (below + bubbleH < window.innerHeight - 20) {
                bubble.style.top = below + 'px';
                bubble.style.bottom = 'auto';
            } else {
                bubble.style.top = 'auto';
                bubble.style.bottom = (window.innerHeight - r.top + 20) + 'px';
            }
        } else {
            spot.style.display = 'none';
            bubble.style.top = 'auto';
            bubble.style.bottom = '30%';
        }
    }

    function showStep() {
        const step = SCRIPT[stepIdx];
        if (!step) { finish(); return; }
        if (step.screen) switchScreen(step.screen);
        document.getElementById('tut-text').textContent = t(step.text);
        document.getElementById('tut-skip').textContent = t('tut_skip');
        const nextBtn = document.getElementById('tut-next');
        nextBtn.textContent = step.advance === 'finish' ? t('tut_finish') : t('tut_next');
        nextBtn.classList.toggle('hidden', step.advance.startsWith('event:'));
        requestAnimationFrame(placeSpot);
    }

    let repositionTimer = null;

    function start() {
        ensureDom();
        active = true;
        stepIdx = 0;
        riggedTurn = 0;
        overlay.classList.add('visible');
        showStep();
        // элементы-цели появляются/двигаются по ходу игры — держим прожектор на месте
        clearInterval(repositionTimer);
        repositionTimer = setInterval(placeSpot, 350);
    }

    function next() {
        if (!active) return;
        stepIdx++;
        if (stepIdx >= SCRIPT.length) { finish(); return; }
        showStep();
    }

    function finish() {
        active = false;
        clearInterval(repositionTimer);
        localStorage.setItem('dg_tut_done', '1');
        if (overlay) overlay.classList.remove('visible');
    }

    // события из игры; если игрок «проскочил» текстовый шаг действием —
    // догоняем до соответствующего событию шага
    function notify(event) {
        if (!active) return;
        for (let k = stepIdx; k < Math.min(stepIdx + 2, SCRIPT.length); k++) {
            if (SCRIPT[k].advance === 'event:' + event) {
                stepIdx = k;
                setTimeout(next, 700);
                break;
            }
        }
        // подсветка могла сместиться (модалки, ход игры)
        requestAnimationFrame(placeSpot);
    }

    function isDone() {
        return localStorage.getItem('dg_tut_done') === '1';
    }

    return { start, notify, finish, isDone, riggedTarget, consumeRig, get active() { return active; } };
})();
