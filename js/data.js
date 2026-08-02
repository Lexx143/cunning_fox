// ================= Данные игры «Детективная братва» =================

const GRID_SIZE = 16;
const NUM_CLUES = 6;
const FOX_TRACK_LENGTH = 16; // позиция 16 — нора, лис сбежал

// Типы улик / примет (подписи — через i18n: t('clue_' + key))
const CLUE_TYPES = [
    { key: 'hat' },
    { key: 'glasses' },
    { key: 'scarf' },
    { key: 'umbrella' },
    { key: 'monocle' },
    { key: 'watch' },
];

// Зверьки-детективы на выбор (имена — t('animal_' + key))
const ANIMALS = [
    { key: 'badger' },
    { key: 'otter' },
    { key: 'hedgehog' },
    { key: 'raccoon' },
];

// Цвета фишек сыщиков (1–4 игрока)
const PLAYER_COLORS = [
    { key: 'blue',   value: '#3b82c4' },
    { key: 'red',    value: '#d9534f' },
    { key: 'green',  value: '#4f9d5d' },
    { key: 'purple', value: '#8e6bb8' },
];

// Стартовые клетки сыщиков (центр поля)
const START_POSITIONS = [
    { x: 7, y: 7 }, { x: 8, y: 7 }, { x: 7, y: 8 }, { x: 8, y: 8 },
];

// Тропа лиса — опорные точки кривой, обведённой по тропе С АРТА ФОНА
// (board-bg): дробные клеточные координаты, сглаживаются Catmull-Rom.
// Число точек НЕ связано с шагами лиса: каждый шаг — 1/16 длины кривой.
// Последняя точка — нора (целая клетка, там рисуется арт норы).
const FOX_PATH = [
    { x: -0.11, y: 1.06 }, { x: 2.0, y: 1.69 },  { x: 1.38, y: 3.41 },
    { x: 1.14, y: 4.19 },  { x: 2.53, y: 4.73 }, { x: 4.19, y: 4.11 },
    { x: 5.34, y: 4.67 },  { x: 5.75, y: 6.14 }, { x: 5.28, y: 7.84 },
    { x: 5.28, y: 9.03 },  { x: 6.22, y: 10.28 }, { x: 8.53, y: 10.67 },
    { x: 9.7, y: 9.94 },   { x: 11.5, y: 7.84 }, { x: 12.62, y: 8.41 },
    { x: 13.72, y: 9.66 }, { x: 13.88, y: 10.91 }, { x: 12.86, y: 11.8 },
    { x: 12.47, y: 13.09 }, { x: 13.41, y: 13.95 }, { x: 15, y: 14 }, // нора
];

// Декор лужайки (типы — файлы decor-*.png); взвешенный набор для случайного выбора
const DECOR_POOL = [
    'grass', 'grass', 'grass', 'bush', 'bush',
    'flower-pink', 'flower-pink', 'flower-white', 'flower-white', 'stone',
];

// Подозреваемые: имя (ru/en) + приметы
const SUSPECTS = [
    { name: { ru: 'Алиса',     en: 'Alice' },     hat: true,  glasses: false, scarf: true,  umbrella: false, monocle: false, watch: false },
    { name: { ru: 'Артур',     en: 'Arthur' },    hat: false, glasses: true,  scarf: false, umbrella: false, monocle: false, watch: true  },
    { name: { ru: 'Беатрис',   en: 'Beatrice' },  hat: false, glasses: false, scarf: false, umbrella: true,  monocle: true,  watch: false },
    { name: { ru: 'Чарльз',    en: 'Charles' },   hat: true,  glasses: true,  scarf: false, umbrella: false, monocle: false, watch: true  },
    { name: { ru: 'Дейзи',     en: 'Daisy' },     hat: false, glasses: false, scarf: true,  umbrella: true,  monocle: false, watch: false },
    { name: { ru: 'Эдит',      en: 'Edith' },     hat: false, glasses: true,  scarf: false, umbrella: true,  monocle: false, watch: false },
    { name: { ru: 'Фрэнк',     en: 'Frank' },     hat: true,  glasses: false, scarf: false, umbrella: false, monocle: false, watch: true  },
    { name: { ru: 'Гертруда',  en: 'Gertrude' },  hat: false, glasses: false, scarf: true,  umbrella: false, monocle: true,  watch: false },
    { name: { ru: 'Гарольд',   en: 'Harold' },    hat: false, glasses: false, scarf: false, umbrella: true,  monocle: false, watch: true  },
    { name: { ru: 'Ингрид',    en: 'Ingrid' },    hat: true,  glasses: false, scarf: false, umbrella: true,  monocle: false, watch: false },
    { name: { ru: 'Юстина',    en: 'Justine' },   hat: false, glasses: true,  scarf: true,  umbrella: false, monocle: false, watch: false },
    { name: { ru: 'Лео',       en: 'Leo' },       hat: false, glasses: false, scarf: false, umbrella: false, monocle: true,  watch: true  },
    { name: { ru: 'Мэри',      en: 'Mary' },      hat: true,  glasses: false, scarf: true,  umbrella: true,  monocle: false, watch: false },
    { name: { ru: 'Оливия',    en: 'Olivia' },    hat: false, glasses: true,  scarf: true,  umbrella: false, monocle: false, watch: true  },
    { name: { ru: 'Пол',       en: 'Paul' },      hat: true,  glasses: false, scarf: false, umbrella: true,  monocle: true,  watch: false },
    { name: { ru: 'Себастьян', en: 'Sebastian' }, hat: false, glasses: true,  scarf: false, umbrella: true,  monocle: false, watch: true  },
];

// Грани кубика: 3 грани «глаза», 2 грани «1 след», 1 грань «2 следа»
const DICE_FACES = [
    { type: 'eyes',  icon: 'eye',  steps: 0 },
    { type: 'eyes',  icon: 'eye',  steps: 0 },
    { type: 'eyes',  icon: 'eye',  steps: 0 },
    { type: 'clues', icon: 'paw',  steps: 1 },
    { type: 'clues', icon: 'paw',  steps: 1 },
    { type: 'clues', icon: 'paw2', steps: 2 },
];
