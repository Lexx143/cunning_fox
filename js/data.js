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

// Тропа лиса: диагональ через всё поле небольшими зигзагами,
// из левого верхнего угла к норе в правом нижнем.
// Индексы 0–15 — шаги, последний элемент — нора.
const FOX_PATH = [
    { x: 0, y: 1 },  { x: 2, y: 2 },  { x: 1, y: 4 },  { x: 3, y: 5 },
    { x: 5, y: 4 },  { x: 6, y: 6 },  { x: 5, y: 8 },  { x: 6, y: 10 },
    { x: 8, y: 11 }, { x: 10, y: 10 }, { x: 11, y: 8 }, { x: 13, y: 9 },
    { x: 14, y: 11 }, { x: 12, y: 12 }, { x: 13, y: 14 }, { x: 15, y: 13 },
    { x: 15, y: 14 }, // нора
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
    { name: { ru: 'Эдит',      en: 'Edith' },     hat: false, glasses: true,  scarf: false, umbrella: false, monocle: true,  watch: false },
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
