// ================= Локализация RU / EN =================

const I18N = {
    ru: {
        app_title: 'Детективная братва',
        loading: 'Загрузка…',
        danger_label: 'До норы:',
        tab_board: 'Поле',
        tab_suspects: 'Подозреваемые',

        // Приметы
        clue_hat: 'Шляпа', clue_glasses: 'Очки', clue_scarf: 'Шарф',
        clue_umbrella: 'Зонтик', clue_monocle: 'Монокль', clue_watch: 'Часы',
        chip_unknown: '{label}: не проверено',
        chip_yes: '{label}: есть у вора',
        chip_no: '{label}: нет у вора',

        // Зверьки
        animal_badger: 'Барсук', animal_otter: 'Выдра',
        animal_hedgehog: 'Ёжик', animal_raccoon: 'Енот',

        // Настройка игры
        setup_title: 'Новое дело',
        setup_sub: 'Лис-воришка стащил пирог! Сколько сыщиков ведёт расследование?',
        default_name: 'Сыщик {n}',
        btn_start: 'Начать расследование',
        btn_cancel: 'Отмена',

        // Статусы
        status_start: 'Лис стащил пирог и удирает к норе! Откройте 2 карты подозреваемых.',
        status_reveal_left: 'Осталось открыть карт: {n}',
        status_cards_open: 'Карты открыты!',
        status_turn_multi: 'Ход: {name}. Бросайте кубики!',
        status_turn_solo: 'Ваш ход. Бросайте кубики!',
        status_open_1: 'Откройте 1 закрытую карту.',
        status_open_2: 'Откройте 2 закрытые карты.',
        status_move: 'Идите по подсвеченным клеткам. Шагов: {n}.',
        status_fail: 'Провал броска! Лис убегает на 3 шага.',
        status_clue_found_move: 'Вы нашли грибок с уликой! Сорвите его или идите дальше.',
        status_clue_found_end: 'Вы нашли грибок с уликой! Сорвите его или завершите ход.',
        status_no_steps: 'Шаги закончились.',
        status_too_far: 'Туда не дотянуться! Шагов осталось: {n}.',
        status_steps_left: 'Шагов осталось: {n}.',
        status_false_accuse: 'Ложное обвинение! {name} отпущен, лис бежит.',
        status_win: 'Победа! Вор — {name}!',
        status_lose: 'Лис скрылся в норе. Вором был {name}.',

        // Кубики
        dice_title: 'Бросок кубиков',
        target_eyes: 'Глаза', target_eyes_sub: 'открыть 2 карты',
        target_paws: 'Следы', target_paws_sub: 'ходить по полю',
        eyes_disabled: 'Все карты уже открыты',
        dice_hint_start: 'Нужно 3 одинаковых символа цели!',
        dice_success_eyes: 'Успех! Вы можете открыть карты подозреваемых.',
        dice_success_steps: 'Успех! Шагов сыщика: {n}.',
        dice_fail: 'Провал! Лис делает 3 шага к норе…',
        dice_matches: 'Совпадений: {n} из 3. Бросайте ещё!',
        rolls_label: 'Броски:',
        btn_roll: 'Бросить!',
        btn_reroll: 'Перебросить',
        btn_roll_open: 'Бросить кубики',

        // Найден грибок
        clue_found_title: 'Грибок с уликой!',
        clue_found_text: 'Под грибком спрятана улика.',

        // Дешифратор
        decoder_title: 'Дешифратор улик',
        decoder_sub: 'Под грибком спрятана улика…',
        decoder_has: 'У вора ЕСТЬ: {label}',
        decoder_hasnt: 'У вора НЕТ: {label}',
        btn_check_clue: 'Сорвать грибок',
        btn_end_turn: 'Завершить ход',
        btn_ok: 'Понятно',

        // Досье
        no_attrs_full: 'Нет примет',
        dossier_released: 'Этот подозреваемый уже отпущен на свободу.',
        btn_accuse: 'Обвинить!',
        btn_release: 'Отпустить',
        btn_close: 'Закрыть',
        stamp_released: 'НЕ ВОР',

        // Обвинение
        confirm_accuse_title: 'Обвинить: {name}?',
        confirm_accuse_text: 'Если вы ошибётесь, лис убежит на 5 шагов к норе!',
        confirm_new_title: 'Начать новое дело?',
        confirm_new_text: 'Текущее расследование будет потеряно.',
        miss_title: 'Мимо!',
        miss_text: '{name} — не вор. Лис убегает на 5 шагов!',
        btn_yes: 'Да',

        // Конец игры
        win_title: 'Дело раскрыто!',
        win_sub: 'Пирог возвращён! Вор пойман с поличным:',
        lose_title: 'Лис сбежал!',
        lose_sub: 'Лис скрылся в норе вместе с пирогом. Вором был:',
        btn_new_game: 'Новое дело',

        // Настройки
        settings_title: 'Настройки',
        set_music: 'Музыка',
        set_sfx: 'Звуки',
        set_lang: 'Язык',
        set_rules: 'Как играть',
        set_tutorial: 'Пройти обучение заново',
        set_donate: 'Поддержать разработчика',
        donate_thanks: 'Спасибо за поддержку!',

        // Продолжение партии
        resume_title: 'Продолжить партию?',
        resume_text: 'У вас есть незаконченное расследование.',
        btn_resume: 'Продолжить',
        btn_new: 'Новая игра',

        // Правила (слайды)
        rules_title: 'Как играть',
        rule1_t: 'Кража!', rule1: 'Хитрый лис стащил пирог и убегает к своей норе. Один из 16 лисов — вор. Найдите его раньше, чем он спрячется!',
        rule2_t: 'Кубики', rule2: 'В свой ход выберите цель и бросайте кубики (до 3 раз). Соберите три «глаза» — откроете 2 карты. Три «следа» — пойдёте по полю. Не собрали — лис убегает на 3 шага!',
        rule3_t: 'Грибочки-улики', rule3: 'Ходите по подсвеченным клеткам и собирайте красные грибочки — под каждым спрятана одна улика.',
        rule4_t: 'Дешифратор', rule4: 'Дешифратор скажет, есть ли эта вещь у вора. Подсказки-значки сверху экрана запоминают все проверенные улики.',
        rule5_t: 'Сравнивайте!', rule5: 'Смотрите на приметы открытых лисов и сравнивайте с уликами. Если приметы не сходятся — этот лис не вор, его можно отпустить.',
        rule6_t: 'Поймайте вора!', rule6: 'Уверены? Обвиняйте! Угадали — победа и пирог спасён. Ошиблись — лис убежит на 5 шагов. Не дайте ему добраться до норы!',

        // Туториал — обзорная экскурсия по интерфейсу
        tour1: 'Это лесная поляна. По ней ходят сыщики и собирают улики.',
        tour2: 'Вот лис-воришка. Его тропинка ведёт через поляну к норе. Добежит — пирог пропал!',
        tour3: 'Этот значок показывает, сколько шагов лису осталось до норы.',
        tour4: 'Красные грибочки на поляне — под каждым спрятана улика.',
        tour5: 'Проверенные улики запоминаются здесь: ✓ — есть у вора, ✗ — нет.',
        tour6: 'А это 16 подозреваемых лисов. Один из них — вор!',
        tour7: 'А здесь — подсказки и кнопки хода. Как откроешь первые карты, тут появится кнопка броска кубиков.',
        tut_offer: 'Хочешь пройти обучение прямо в игре? Я всё покажу шаг за шагом!',
        tut_offer_yes: 'Да, веди!',
        tut_offer_no: 'Я разберусь',
        tut_prev: 'Назад',

        // Туториал — интерактив
        tut_skip: 'Пропустить',
        tut_next: 'Далее',
        tut_finish: 'В игру!',
        tut1: 'Привет, сыщик! Лис-воришка стащил пирог и удирает вон по той тропинке к норе. Поможешь его поймать?',
        tut2: 'Вор — один из 16 лисов. Для начала открой любые 2 карты — просто нажми на них.',
        tut3: 'Отлично! Теперь твой ход. Нажми «Бросить кубики».',
        tut_eyes: 'Сейчас цель хода — «глаза»: они открывают карты подозреваемых. Жми «Бросить!»',
        tut_open_more: 'Ура, три глаза! Теперь открой ещё 2 карты подозреваемых.',
        tut_roll_again: 'Отлично! Снова жми «Бросить кубики».',
        tut_paws: 'Теперь цель — «следы»: они дают шаги по полю. Жми «Бросить!»',
        tut4: 'Выбери цель: «глаза» — открыть ещё карты, «следы» — ходить по полю. Кубики можно бросать до 3 раз, совпавшие сохраняются.',
        tut5: 'Собери 3 одинаковых символа! Если не получится — лис убежит на 3 шага. Бросай!',
        tut6: 'Смотри на панель: здесь видно, сколько лису осталось до норы. Не давай ему уйти!',
        tut7: 'Теперь шагай по подсвеченным клеткам к красному грибочку — под ним спрятана улика.',
        tut8: 'Ты нашёл грибок! Жми «Сорвать грибок» — дешифратор раскроет улику.',
        tut_lens: 'Лупа-дешифратор показывает, есть ли эта вещь у вора. Жми «Понятно», когда рассмотришь.',
        tut9: 'Улика запомнилась в значках сверху: ✓ — эта вещь есть у вора, ✗ — нет.',
        tut10: 'Сравнивай улики с приметами открытых лисов. Не сходится? Нажми на лиса и отпусти его.',
        tut11: 'Когда вычислишь вора — нажми на его карту и обвиняй! Но осторожно: за ошибку лис убежит на 5 шагов.',
        tut12: 'Удачи, сыщик! Собери улики, вычисли вора и спаси пирог!',
    },

    en: {
        app_title: 'Detective Gang',
        loading: 'Loading…',
        danger_label: 'To the den:',
        tab_board: 'Board',
        tab_suspects: 'Suspects',

        clue_hat: 'Hat', clue_glasses: 'Glasses', clue_scarf: 'Scarf',
        clue_umbrella: 'Umbrella', clue_monocle: 'Monocle', clue_watch: 'Watch',
        chip_unknown: '{label}: not checked',
        chip_yes: '{label}: the thief has it',
        chip_no: '{label}: the thief does not have it',

        animal_badger: 'Badger', animal_otter: 'Otter',
        animal_hedgehog: 'Hedgehog', animal_raccoon: 'Raccoon',

        setup_title: 'New Case',
        setup_sub: 'A sneaky fox stole the pie! How many detectives are on the case?',
        default_name: 'Detective {n}',
        btn_start: 'Start the investigation',
        btn_cancel: 'Cancel',

        status_start: 'The fox stole the pie and is running to its den! Flip 2 suspect cards.',
        status_reveal_left: 'Cards left to flip: {n}',
        status_cards_open: 'Cards revealed!',
        status_turn_multi: "{name}'s turn. Roll the dice!",
        status_turn_solo: 'Your turn. Roll the dice!',
        status_open_1: 'Flip 1 face-down card.',
        status_open_2: 'Flip 2 face-down cards.',
        status_move: 'Walk on the highlighted tiles. Steps: {n}.',
        status_fail: 'Failed roll! The fox runs 3 steps.',
        status_clue_found_move: 'You found a clue mushroom! Pick it or keep walking.',
        status_clue_found_end: 'You found a clue mushroom! Pick it or end your turn.',
        status_no_steps: 'No steps left.',
        status_too_far: 'Too far to reach! Steps left: {n}.',
        status_steps_left: 'Steps left: {n}.',
        status_false_accuse: 'False accusation! {name} is released, the fox runs.',
        status_win: 'Victory! The thief was {name}!',
        status_lose: 'The fox escaped. The thief was {name}.',

        dice_title: 'Dice Roll',
        target_eyes: 'Eyes', target_eyes_sub: 'flip 2 cards',
        target_paws: 'Paws', target_paws_sub: 'walk the board',
        eyes_disabled: 'All cards are already revealed',
        dice_hint_start: 'You need 3 matching target symbols!',
        dice_success_eyes: 'Success! You may flip suspect cards.',
        dice_success_steps: 'Success! Detective steps: {n}.',
        dice_fail: 'Fail! The fox makes 3 steps to the den…',
        dice_matches: 'Matches: {n} of 3. Roll again!',
        rolls_label: 'Rolls:',
        btn_roll: 'Roll!',
        btn_reroll: 'Re-roll',
        btn_roll_open: 'Roll the dice',

        clue_found_title: 'A Clue Mushroom!',
        clue_found_text: 'A clue is hidden under it.',

        decoder_title: 'Clue Decoder',
        decoder_sub: 'A clue is hidden under the mushroom…',
        decoder_has: 'The thief HAS: {label}',
        decoder_hasnt: 'The thief has NO: {label}',
        btn_check_clue: 'Pick the mushroom',
        btn_end_turn: 'End turn',
        btn_ok: 'Got it',

        no_attrs_full: 'No traits',
        dossier_released: 'This fox has already been released.',
        btn_accuse: 'Accuse!',
        btn_release: 'Release',
        btn_close: 'Close',
        stamp_released: 'CLEARED',

        confirm_accuse_title: 'Accuse {name}?',
        confirm_accuse_text: 'If you are wrong, the fox will run 5 steps to the den!',
        confirm_new_title: 'Start a new case?',
        confirm_new_text: 'Your current investigation will be lost.',
        miss_title: 'Wrong!',
        miss_text: '{name} is not the thief. The fox runs 5 steps!',
        btn_yes: 'Yes',

        win_title: 'Case Closed!',
        win_sub: 'The pie is saved! The thief is caught red-handed:',
        lose_title: 'The Fox Escaped!',
        lose_sub: 'The fox vanished into the den with the pie. The thief was:',
        btn_new_game: 'New Case',

        settings_title: 'Settings',
        set_music: 'Music',
        set_sfx: 'Sounds',
        set_lang: 'Language',
        set_rules: 'How to play',
        set_tutorial: 'Replay tutorial',
        set_donate: 'Support the developer',
        donate_thanks: 'Thank you for your support!',

        resume_title: 'Continue the game?',
        resume_text: 'You have an unfinished investigation.',
        btn_resume: 'Continue',
        btn_new: 'New game',

        rules_title: 'How to Play',
        rule1_t: 'The Theft!', rule1: 'A sly fox stole the pie and is running to its den. One of the 16 foxes is the thief. Find them before they hide!',
        rule2_t: 'The Dice', rule2: 'On your turn pick a target and roll the dice (up to 3 times). Three “eyes” — flip 2 cards. Three “paws” — walk the board. Fail — the fox runs 3 steps!',
        rule3_t: 'Clue Mushrooms', rule3: 'Walk on highlighted tiles and collect red mushrooms — each one hides a single clue.',
        rule4_t: 'The Decoder', rule4: 'The decoder tells you whether the thief has that item. The badges at the top remember every clue you checked.',
        rule5_t: 'Compare!', rule5: 'Look at the traits of revealed foxes and compare them with the clues. If they do not match — that fox is innocent and can be released.',
        rule6_t: 'Catch the Thief!', rule6: 'Sure about it? Accuse! Right — you win and save the pie. Wrong — the fox runs 5 steps. Do not let it reach the den!',

        tour1: 'This is the forest meadow. Detectives walk here and gather clues.',
        tour2: 'Here is the fox thief. Its path runs across the meadow to the den. If it gets there — the pie is gone!',
        tour3: 'This badge shows how many steps the fox has left to the den.',
        tour4: 'Red mushrooms on the meadow — each one hides a clue.',
        tour5: 'Checked clues are remembered here: ✓ — the thief has it, ✗ — does not.',
        tour6: 'And these are the 16 fox suspects. One of them is the thief!',
        tour7: 'And here are the hints and turn buttons. Once you flip the first cards, the dice roll button will appear right here.',
        tut_offer: 'Want a guided tutorial right in the game? I will show everything step by step!',
        tut_offer_yes: 'Yes, lead the way!',
        tut_offer_no: 'I will figure it out',
        tut_prev: 'Back',

        tut_skip: 'Skip',
        tut_next: 'Next',
        tut_finish: 'Play!',
        tut1: 'Hi, detective! A masked fox stole the pie and is sneaking down that path to its den. Will you help catch it?',
        tut2: 'The thief is one of 16 foxes. First, flip any 2 cards — just tap them.',
        tut3: 'Great! Now it is your turn. Tap “Roll the dice”.',
        tut_eyes: 'The current target is “eyes” — they flip suspect cards. Tap “Roll!”',
        tut_open_more: 'Hooray, three eyes! Now flip 2 more suspect cards.',
        tut_roll_again: 'Great! Tap “Roll the dice” again.',
        tut_paws: 'Now the target is “paws” — they give you steps on the board. Tap “Roll!”',
        tut4: 'Pick a target: “eyes” — flip more cards, “paws” — walk the board. You may roll up to 3 times, matches are kept.',
        tut5: 'Collect 3 matching symbols! If you fail, the fox runs 3 steps. Roll!',
        tut6: 'Watch this badge: it shows how far the fox is from the den. Do not let it get away!',
        tut7: 'Now walk on the highlighted tiles to the red mushroom — a clue is hidden under it.',
        tut8: 'You found a mushroom! Tap “Pick the mushroom” — the decoder will reveal the clue.',
        tut_lens: 'The decoder lens shows whether the thief has this item. Tap “Got it” when you are done.',
        tut9: 'The clue is saved in the badges above: ✓ — the thief has this item, ✗ — does not.',
        tut10: 'Compare clues with the traits of revealed foxes. No match? Tap the fox and release it.',
        tut11: 'When you know the thief — tap their card and accuse! Careful: a mistake lets the fox run 5 steps.',
        tut12: 'Good luck, detective! Gather clues, find the thief and save the pie!',
    },
};

function detectLang() {
    // ?lang=ru|en в адресе — явный выбор (полезно для ссылок и тестов)
    const q = new URLSearchParams(location.search).get('lang');
    if (q && I18N[q]) return q;
    const saved = localStorage.getItem('dg_lang');
    if (saved && I18N[saved]) return saved;
    return (navigator.language || '').toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

let LANG = detectLang();

function t(key, vars) {
    let s = (I18N[LANG] && I18N[LANG][key]) ?? I18N.ru[key] ?? key;
    if (vars) for (const k in vars) s = s.replaceAll('{' + k + '}', vars[k]);
    return s;
}

function suspectName(s) {
    return s.name[LANG] || s.name.ru;
}

function animalName(key) {
    return t('animal_' + key);
}
