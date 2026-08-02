// ================= Туториал: экскурсия + интерактив =================
// Фаза 1 — «экскурсия»: листаемые подсказки по зонам интерфейса (Назад/Далее).
// Фаза 2 — по желанию: интерактивное обучение «за ручку» в живой партии.
// Оверлей не блокирует клики (pointer-events: none) — ведём подсветкой.

const Tutorial = (() => {
    let active = false;
    let phase = 'tour'; // 'tour' | 'offer' | 'play'
    let stepIdx = -1;
    let overlay = null, spot = null, bubble = null;

    // Экскурсия: только чтение, без действий игрока
    const TOUR = [
        { text: 'tour1', target: '#board-wrap',    screen: 'board' },
        { text: 'tour2', target: '#fox-token' },
        { text: 'tour3', target: '#fox-danger' },
        { text: 'tour4', target: () => document.querySelector('.cell-art.art-clue') },
        { text: 'tour5', target: '#clue-chips' },
        { text: 'tour6', target: '#suspects-grid', screen: 'suspects' },
        { text: 'tour7', target: '#roll-open-btn', screen: 'board' },
    ];

    // Интерактив: text — ключ i18n; target — селектор или функция → элемент;
    // advance: 'next' (кнопка) | 'event:имя' (ждём действие игрока)
    // Кубики в обучении «подкручены»: 1-й ход всегда «глаза», 2-й — «следы».
    const SCRIPT = [
        { text: 'tut2',           target: '#suspects-grid',    advance: 'event:revealed2', screen: 'suspects' },
        { text: 'tut3',           target: '#roll-open-btn',    advance: 'event:diceOpened', screen: 'board' },
        { text: 'tut_eyes',       target: '#target-picker',    advance: 'next', bubblePos: 'top' },
        { text: 'tut_roll',       target: '#roll-btn',         advance: 'event:rollResolved', bubblePos: 'top' },
        { text: 'tut_open_more',  target: '#suspects-grid',    advance: 'event:revealed2' },
        { text: 'tut_roll_again', target: '#roll-open-btn',    advance: 'event:diceOpened' },
        { text: 'tut_paws',       target: '#target-picker',    advance: 'next', bubblePos: 'top' },
        { text: 'tut_roll',       target: '#roll-btn',         advance: 'event:rollResolved', bubblePos: 'top' },
        { text: 'tut6',           target: '#fox-danger',       advance: 'next' },
        { text: 'tut7',           target: '#board-wrap',       advance: 'event:reachedClue' },
        { text: 'tut8',           target: '#check-clue-btn',   advance: 'event:cluePicked' },
        { text: 'tut_lens',       target: '#decoder-close-btn', advance: 'event:decoderClosed', bubblePos: 'top' },
        { text: 'tut9',           target: '#clue-chips',       advance: 'next' },
        { text: 'tut10',          target: '#suspects-grid',    advance: 'next', screen: 'suspects' },
        { text: 'tut11',          target: '#suspects-grid',    advance: 'next' },
        { text: 'tut12',          target: null,                advance: 'finish' },
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
                    <button class="btn btn-secondary" id="tut-prev"></button>
                    <button class="btn btn-primary" id="tut-next"></button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        spot = document.getElementById('tut-spot');
        bubble = document.getElementById('tut-bubble');
        overlay.querySelector('.tut-fox').innerHTML = logoImg(52);
        document.getElementById('tut-skip').addEventListener('click', () => {
            Sound.play('click');
            finish();
        });
        document.getElementById('tut-prev').addEventListener('click', () => {
            Sound.play('click');
            if (phase === 'tour' && stepIdx > 0) { stepIdx--; showStep(); }
        });
        document.getElementById('tut-next').addEventListener('click', () => {
            Sound.play('click');
            if (phase === 'tour') {
                stepIdx++;
                if (stepIdx >= TOUR.length) showOffer();
                else showStep();
            } else if (phase === 'offer') {
                startPlay();
            } else {
                const step = SCRIPT[stepIdx];
                if (!step) return;
                if (step.advance === 'finish') finish();
                else if (step.advance === 'next') next();
            }
        });
        window.addEventListener('resize', () => { if (active) placeSpot(); });
    }

    function currentStep() {
        return phase === 'tour' ? TOUR[stepIdx] : phase === 'play' ? SCRIPT[stepIdx] : null;
    }

    // Позиция пузыря: под целью, над целью или у края — но никогда поверх цели
    function placeBubble(r, step) {
        const bh = bubble.offsetHeight || 160;
        const gap = 16;
        const winH = window.innerHeight;
        if (step && step.bubblePos === 'top') {
            bubble.style.top = '10px';
            bubble.style.bottom = 'auto';
            return;
        }
        const below = winH - r.bottom - gap * 2;
        const above = r.top - gap * 2;
        if (bh <= below) {
            bubble.style.top = (r.bottom + gap) + 'px';
            bubble.style.bottom = 'auto';
        } else if (bh <= above) {
            bubble.style.top = 'auto';
            bubble.style.bottom = (winH - r.top + gap) + 'px';
        } else if (below >= above) {
            // не помещается нигде — прижимаем к краю с бОльшим местом
            bubble.style.top = 'auto';
            bubble.style.bottom = '10px';
        } else {
            bubble.style.top = '10px';
            bubble.style.bottom = 'auto';
        }
    }

    function placeSpot() {
        const step = currentStep();
        if (!step) { // offer: пузырь по центру, спот скрыт
            spot.style.display = 'none';
            bubble.style.top = 'auto';
            bubble.style.bottom = '34%';
            return;
        }
        const el = step.target
            ? (typeof step.target === 'function' ? step.target() : document.querySelector(step.target))
            : null;
        if (el && !el.classList.contains('hidden')) {
            const r = el.getBoundingClientRect();
            const pad = 6;
            spot.style.display = 'block';
            spot.style.left = (r.left - pad) + 'px';
            spot.style.top = (r.top - pad) + 'px';
            spot.style.width = (r.width + pad * 2) + 'px';
            spot.style.height = (r.height + pad * 2) + 'px';
            placeBubble(r, step);
        } else {
            spot.style.display = 'none';
            bubble.style.top = 'auto';
            bubble.style.bottom = '30%';
        }
    }

    // Смена текста и позиции — одновременно, под коротким fade
    function transitionBubble(render) {
        bubble.classList.add('switching');
        setTimeout(() => {
            render();
            placeSpot();
            bubble.classList.remove('switching');
        }, 130);
    }

    function setButtons({ skip, prev, next }) {
        document.getElementById('tut-skip').classList.toggle('hidden', !skip);
        document.getElementById('tut-prev').classList.toggle('hidden', !prev);
        document.getElementById('tut-next').classList.toggle('hidden', !next);
    }

    function showStep() {
        const step = currentStep();
        if (!step) { finish(); return; }
        if (step.screen) switchScreen(step.screen);
        transitionBubble(() => {
            document.getElementById('tut-text').textContent = t(step.text);
            document.getElementById('tut-skip').textContent = t('tut_skip');
            document.getElementById('tut-prev').textContent = t('tut_prev');
            const nextBtn = document.getElementById('tut-next');
            if (phase === 'tour') {
                nextBtn.textContent = t('tut_next');
                setButtons({ skip: true, prev: stepIdx > 0, next: true });
            } else {
                nextBtn.textContent = step.advance === 'finish' ? t('tut_finish') : t('tut_next');
                setButtons({ skip: true, prev: false, next: !step.advance.startsWith('event:') });
            }
        });
    }

    function showOffer() {
        phase = 'offer';
        switchScreen('board');
        transitionBubble(() => {
            document.getElementById('tut-text').textContent = t('tut_offer');
            document.getElementById('tut-skip').textContent = t('tut_offer_no');
            const nextBtn = document.getElementById('tut-next');
            nextBtn.textContent = t('tut_offer_yes');
            setButtons({ skip: true, prev: false, next: true });
        });
    }

    function startPlay() {
        phase = 'play';
        stepIdx = 0;
        riggedTurn = 0;
        showStep();
    }

    let repositionTimer = null;

    function start() {
        ensureDom();
        active = true;
        phase = 'tour';
        stepIdx = 0;
        riggedTurn = 0;
        overlay.classList.add('visible');
        showStep();
        // элементы-цели появляются/двигаются по ходу игры — держим прожектор на месте
        clearInterval(repositionTimer);
        repositionTimer = setInterval(placeSpot, 250);
    }

    function next() {
        if (!active || phase !== 'play') return;
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
        if (!active || phase !== 'play') return;
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
