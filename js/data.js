// ================= Данные игры «Хитрый Лис» =================

const GRID_SIZE = 16;
const NUM_CLUES = 6;
const FOX_TRACK_LENGTH = 16; // позиция 16 — нора, лис сбежал

// Типы улик / примет (иконки рисуются в ui.js)
const CLUE_TYPES = [
    { key: 'hat',      label: 'Шляпа' },
    { key: 'glasses',  label: 'Очки' },
    { key: 'scarf',    label: 'Шарф' },
    { key: 'umbrella', label: 'Зонтик' },
    { key: 'monocle',  label: 'Монокль' },
    { key: 'watch',    label: 'Часы' },
];

// Зверьки-детективы на выбор
const ANIMALS = [
    { key: 'badger',   name: 'Барсук' },
    { key: 'otter',    name: 'Выдра' },
    { key: 'hedgehog', name: 'Ёжик' },
    { key: 'raccoon',  name: 'Енот' },
];

// Цвета фишек сыщиков (1–4 игрока)
const PLAYER_COLORS = [
    { name: 'Синий',      value: '#3b82c4' },
    { name: 'Красный',    value: '#d9534f' },
    { name: 'Зелёный',    value: '#4f9d5d' },
    { name: 'Фиолетовый', value: '#8e6bb8' },
];

// Стартовые клетки сыщиков (центр поля)
const START_POSITIONS = [
    { x: 7, y: 7 }, { x: 8, y: 7 }, { x: 7, y: 8 }, { x: 8, y: 8 },
];

// Тропа лиса через поле: извилистая дорожка в верхней части.
// Индексы 0–15 — шаги, последний элемент — нора.
const FOX_PATH = [
    { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 0 },
    { x: 4, y: 0 }, { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 7, y: 2 },
    { x: 8, y: 2 }, { x: 9, y: 1 }, { x: 10, y: 1 }, { x: 11, y: 0 },
    { x: 12, y: 0 }, { x: 13, y: 1 }, { x: 14, y: 1 }, { x: 15, y: 1 },
    { x: 15, y: 2 }, // нора
];

// Декор лужайки (типы рисуются в ui.js); взвешенный набор для случайного выбора
const DECOR_POOL = [
    'grass', 'grass', 'grass', 'bush', 'bush',
    'flower-pink', 'flower-pink', 'flower-white', 'flower-white', 'stone',
];

// Подозреваемые: имя + приметы
const SUSPECTS = [
    { name: 'Алиса',     hat: true,  glasses: false, scarf: true,  umbrella: false, monocle: false, watch: false },
    { name: 'Артур',     hat: false, glasses: true,  scarf: false, umbrella: false, monocle: false, watch: true  },
    { name: 'Беатрис',   hat: false, glasses: false, scarf: false, umbrella: true,  monocle: true,  watch: false },
    { name: 'Чарльз',    hat: true,  glasses: true,  scarf: false, umbrella: false, monocle: false, watch: true  },
    { name: 'Дейзи',     hat: false, glasses: false, scarf: true,  umbrella: true,  monocle: false, watch: false },
    { name: 'Эдит',      hat: false, glasses: true,  scarf: false, umbrella: false, monocle: true,  watch: false },
    { name: 'Фрэнк',     hat: true,  glasses: false, scarf: false, umbrella: false, monocle: false, watch: true  },
    { name: 'Гертруда',  hat: false, glasses: false, scarf: true,  umbrella: false, monocle: true,  watch: false },
    { name: 'Гарольд',   hat: false, glasses: false, scarf: false, umbrella: true,  monocle: false, watch: true  },
    { name: 'Ингрид',    hat: true,  glasses: false, scarf: false, umbrella: true,  monocle: false, watch: false },
    { name: 'Юстина',    hat: false, glasses: true,  scarf: true,  umbrella: false, monocle: false, watch: false },
    { name: 'Лео',       hat: false, glasses: false, scarf: false, umbrella: false, monocle: true,  watch: true  },
    { name: 'Мэри',      hat: true,  glasses: false, scarf: true,  umbrella: true,  monocle: false, watch: false },
    { name: 'Оливия',    hat: false, glasses: true,  scarf: true,  umbrella: false, monocle: false, watch: true  },
    { name: 'Пол',       hat: true,  glasses: false, scarf: false, umbrella: true,  monocle: true,  watch: false },
    { name: 'Себастьян', hat: false, glasses: true,  scarf: false, umbrella: true,  monocle: false, watch: true  },
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
