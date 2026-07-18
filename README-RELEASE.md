# «Детективная братва» — чеклист релиза в Google Play

## Структура проекта

- `index.html`, `css/`, `js/`, `assets/` — исходники игры (веб).
- `tools/build-www.sh` — сборка чистой папки `www/` (только webp, 3.8 МБ) для Capacitor и деплоя.
- `android/` — нативный Android-проект Capacitor (иконки и сплэши уже сгенерированы).
- `privacy.html` — политика конфиденциальности (RU+EN), выложена на https://ktgas.kz/privacy.html.

## Что нужно установить один раз

1. **Android Studio** (или Command line tools): https://developer.android.com/studio
2. **Java 17** (сейчас на Mac стоит Java 11 — для сборки нужна 17):
   ```bash
   brew install openjdk@17
   sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
   ```
3. Аккаунт **Google Play Console** ($25 разово): https://play.google.com/console

## Сборка и запуск на устройстве

```bash
cd ~/coding/projects/"Cunning Fox"
npm run sync            # пересобрать www/ и синхронизировать в android/
npx cap open android    # открыть в Android Studio → Run на устройстве/эмуляторе
```

## Подпись и сборка релизного AAB

1. Создать keystore (ОДИН раз, файл берегите — без него нельзя обновлять приложение):
   ```bash
   keytool -genkey -v -keystore ~/detective-gang.keystore -alias detectivegang \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
2. В `android/` создать `keystore.properties`:
   ```
   storeFile=/Users/lexx/detective-gang.keystore
   storePassword=...
   keyAlias=detectivegang
   keyPassword=...
   ```
   и подключить подпись в `android/app/build.gradle` (signingConfigs release) — стандартный блок из
   https://developer.android.com/studio/publish/app-signing#gradle-sign
3. Собрать:
   ```bash
   cd android && ./gradlew bundleRelease
   # → android/app/build/outputs/bundle/release/app-release.aab
   ```

## Play Console — по шагам

1. Создать приложение: название «Детективная братва / Detective Gang», язык по умолчанию — русский, тип — игра, бесплатное.
2. Залить `app-release.aab` в «Тестирование → Внутреннее тестирование», проверить на своём устройстве.
3. **Донат**: «Монетизация → Продукты → Товары в приложении» → создать товар с ID `donate_5`
   (тип: потребляемый), цена $4.99. ID должен совпадать с кодом (js/game.js, initDonation).
4. **Страница приложения**: описание RU+EN, иконка 512×512 (`resources/icon-only.png` уменьшить),
   feature graphic 1024×500 (промпт в промпт-паке), 4+ скриншота с телефона и планшета.
5. **Анкеты**: возрастной рейтинг (без насилия → 3+), «Программа для всей семьи» (целевая аудитория —
   дети; в игре нет рекламы и сбора данных — анкета пройдёт легко), Data safety: «данные не собираются».
6. Privacy policy URL: `https://ktgas.kz/privacy.html`.
7. Отправить на проверку (первая проверка занимает до недели).

## Что уже сделано в коде

- Полный офлайн, все ассеты внутри APK (~6 МБ итоговый размер).
- Донат $5 через `cordova-plugin-purchase` (продукт `donate_5`), кнопка видна только в приложении.
- RU/EN автоопределение + переключатель, сохранение партии, туториал, правила, звук.
- Иконки и сплэши сгенерированы (`npx @capacitor/assets generate --android` из `resources/`).

## Обновление версии

В `android/app/build.gradle`: `versionCode` +1 и `versionName` — при каждой загрузке в Play Console.
