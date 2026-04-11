const suspects = [
  {
    name: "Алиса",
    hat: true,
    glasses: false,
    scarf: true,
    umbrella: false,
    monocle: false,
    watch: false
  },
  {
    name: "Артур",
    hat: false,
    glasses: true,
    scarf: false,
    umbrella: false,
    monocle: false,
    watch: true
  },
  {
    name: "Беатрис",
    hat: false,
    glasses: false,
    scarf: false,
    umbrella: true,
    monocle: true,
    watch: false
  },
  {
    name: "Чарльз",
    hat: true,
    glasses: true,
    scarf: false,
    umbrella: false,
    monocle: false,
    watch: true
  },
  {
    name: "Дейзи",
    hat: false,
    glasses: false,
    scarf: true,
    umbrella: true,
    monocle: false,
    watch: false
  },
  {
    name: "Эдит",
    hat: false,
    glasses: true,
    scarf: false,
    umbrella: false,
    monocle: true,
    watch: false
  },
  {
    name: "Фрэнк",
    hat: true,
    glasses: false,
    scarf: false,
    umbrella: false,
    monocle: false,
    watch: true
  },
  {
    name: "Гертруда",
    hat: false,
    glasses: false,
    scarf: true,
    umbrella: false,
    monocle: true,
    watch: false
  },
  {
    name: "Гарольд",
    hat: false,
    glasses: false,
    scarf: false,
    umbrella: true,
    monocle: false,
    watch: true
  },
  {
    name: "Ингрид",
    hat: true,
    glasses: false,
    scarf: false,
    umbrella: true,
    monocle: false,
    watch: false
  },
  {
    name: "Юстина",
    hat: false,
    glasses: true,
    scarf: true,
    umbrella: false,
    monocle: false,
    watch: false
  },
  {
    name: "Лео",
    hat: false,
    glasses: false,
    scarf: false,
    umbrella: false,
    monocle: true,
    watch: true
  },
  {
    name: "Мэри",
    hat: true,
    glasses: false,
    scarf: true,
    umbrella: true,
    monocle: false,
    watch: false
  },
  {
    name: "Оливия",
    hat: false,
    glasses: true,
    scarf: true,
    umbrella: false,
    monocle: false,
    watch: true
  },
  {
    name: "Пол",
    hat: true,
    glasses: false,
    scarf: false,
    umbrella: true,
    monocle: true,
    watch: false
  },
  {
    name: "Себастьян",
    hat: false,
    glasses: true,
    scarf: false,
    umbrella: true,
    monocle: false,
    watch: true
  }
];

// Функция для выбора случайного вора и скрытия/открытия лис
let secretThief = null;

function startNewGameLogic() {
  // Скрываем всех подозреваемых
  suspects.forEach(fox => {
    fox.isRevealed = false;
    fox.isReleased = false;
  });

  // Выбираем нового вора
  const randomIndex = Math.floor(Math.random() * suspects.length);
  secretThief = suspects[randomIndex];

  console.log("Новая игра началась! Вор выбран. Попробуйте вычислить его!");
}

// Запускаем инициализацию при первой загрузке скрипта
startNewGameLogic();