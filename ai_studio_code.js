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

// Пример использования: Найти всех лис в очках
const withGlasses = suspects.filter(fox => fox.glasses);
console.log("Лисы в очках:", withGlasses.map(f => f.name));

// 1. Функция для выбора случайного вора
function pickSecretThief(allSuspects) {
  const randomIndex = Math.floor(Math.random() * allSuspects.length);
  return allSuspects[randomIndex];
}

// 2. Глобальная переменная, которую будет искать консоль и дешифратор
const secretThief = pickSecretThief(suspects);

// 3. Сообщение для проверки
console.log("Игра началась! Вор выбран. Попробуйте угадать его приметы через дешифратор.");