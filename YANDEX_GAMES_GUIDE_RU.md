# DREAD SHIFT — публикация в Яндекс Играх

Проверено по актуальной документации Яндекс Игр на 2026-09-18.

## Что сделано в проекте

В репозитории есть отдельная сборка Яндекс Игр. Обычная web/Render-версия игры не заменяется.

Команда:

```bash
npm run build:yandex
```

Она:
- применяет канонический runtime DREAD SHIFT;
- подключает Yandex Games SDK через `/sdk.js`;
- включает автоматическое определение языка через `ysdk.environment.i18n.lang`;
- использует гостевой профиль Яндекс без обязательной сторонней регистрации;
- создаёт сессию игрового backend по Yandex Player ID;
- подключает внешний backend только по HTTPS/WSS;
- интегрирует `LoadingAPI.ready()`;
- размечает активный gameplay через `GameplayAPI.start()/stop()`;
- обрабатывает `game_api_pause/game_api_resume`;
- выключает звук и управление при потере фокуса/рекламе;
- добавляет fullscreen-рекламу после поражения перед повторным забегом;
- добавляет rewarded-рекламу в лобби: +20 золота;
- сохраняет служебный snapshot прогресса через Player Data;
- отключает системное контекстное меню в игровой области;
- минифицирует игровой клиент;
- проверяет лимит распакованного архива 100 MB;
- проверяет наличие единственного корневого `index.html`;
- проверяет, что имена файлов не содержат пробелов и кириллицы;
- создаёт ZIP `dist/dread-shift-yandex.zip`.

Первая версия для каталога специально ориентирована на **Desktop + SOLO**. Кнопки создания/подключения к DUO скрыты только в Yandex-сборке. В обычной версии DREAD SHIFT DUO остаётся.

## Почему SOLO в первом релизе

Яндекс рекомендует хранить игру на своих серверах как архив. Для сложной серверной архитектуры, особенно multiplayer, документация предлагает согласовывать iframe-интеграцию с поддержкой.

DREAD SHIFT всё равно использует внешний backend для серверной симуляции и сохранений, но практически все клиентские данные/ассеты находятся внутри архива. Для первого прохождения модерации оставляем только SOLO и добавляем backend как разрешённый CSP-host.

После первого релиза DUO можно вернуть отдельным обновлением либо согласовать iframe/сложный multiplayer с поддержкой Яндекс Игр.

---

# 1. Что требуется от игры по правилам Яндекс Игр

## SDK

Yandex Games SDK обязателен для публикации.

В архивной версии используется:

```html
<script src="/sdk.js"></script>
```

SDK инициализируется через:

```js
const ysdk = await YaGames.init();
```

## Game Ready

`ysdk.features.LoadingAPI.ready()` вызывается только после:
- загрузки SDK;
- получения Yandex Player;
- получения серверной игровой сессии;
- загрузки игрового клиента;
- открытия рабочего лобби.

Не вызывай `ready()` раньше этого момента.

## Gameplay markup

Когда игрок реально находится в забеге:
- `GameplayAPI.start()`.

Когда игра остановлена:
- лобби;
- настройки;
- пауза;
- поражение;
- реклама;
- скрытая вкладка;

используется:
- `GameplayAPI.stop()`.

## Авторизация

Для Yandex-сборки нельзя заставлять человека регистрироваться в нашем старом окне логин/пароль.

В этой сборке:
- старое окно авторизации скрыто;
- `ysdk.getPlayer()` создаёт Player даже для гостя;
- `player.getUniqueID()` используется как постоянный идентификатор;
- backend автоматически создаёт внутренний профиль;
- пользователь сразу попадает в игру.

Старые логин/пароль остаются только в обычной web-версии.

## Сохранения

Прогресс Yandex-игрока хранится на нашем backend по Yandex Player ID.

Дополнительно через `player.setData()` записывается небольшой служебный heartbeat платформы (версия Yandex-сборки и время последнего запуска). Основным источником игрового прогресса остаётся server-side save, потому что DREAD SHIFT имеет серверную экономику и боевую логику. Это также избегает конфликта двух независимых источников истины для серебра, золота, питомцев и апгрейдов.

## Язык

При старте читается:

```js
ysdk.environment.i18n.lang
```

Сейчас сборка поддерживает:
- русский;
- английский.

Для кодов `ru, be, kk, uk, uz` автоматически выбирается русский.
Для остальных — английский.

В Draft указывай только те языки, которые реально поддерживает игра: **Russian и English**.

## Потеря фокуса

При:
- смене вкладки;
- сворачивании окна;
- потере focus;
- системной паузе Яндекс;
- рекламе;

игра:
- блокирует ввод;
- останавливает SOLO на сервере;
- глушит новые звуки;
- ставит текущие HTML audio/video на паузу;
- отправляет Gameplay Stop.

После возврата SOLO автоматически продолжается, если пользователь сам не открыл меню паузы.

## Реклама

В Yandex-сборке есть два формата.

### Fullscreen

Показывается только после поражения, когда игрок сам нажимает «Ещё раз».

Сначала реклама, потом новый забег.

Она не вызывается посреди боя.

### Rewarded

В лобби появляется отдельная кнопка:

```text
🎬 +20 G
за рекламу
```

Золото начисляется только после `onRewarded`.

На backend есть дополнительный cooldown, чтобы один клиент не мог бесконечно отправлять reward-команды.

## Context menu

Правый клик в игровой области не открывает стандартное браузерное меню.

Это одна из частых причин отклонения игр на модерации.

## Размер и структура архива

Автоматически проверяется:
- распакованный размер <= 100 MB;
- `index.html` находится в корне;
- имена файлов/папок без пробелов;
- имена файлов/папок без кириллицы.

---

# 2. Backend перед сборкой

Yandex-архив не может подключаться к `localhost`.

Тебе нужен публичный HTTPS backend, например Render:

```text
https://YOUR-SERVICE.onrender.com
```

Важно:
- только `https://`;
- без пути после домена;
- WebSocket автоматически будет использовать `wss://`.

Проверка:

```text
https://YOUR-SERVICE.onrender.com/
```

должна открывать игру или отдавать HTTP 200.

Backend должен быть обновлён до версии main, содержащей:
- `/api/yandex/session`;
- Yandex guest profiles;
- rewarded reward handler.

---

# 3. Как собрать ZIP

## PowerShell

Из папки проекта:

```powershell
git switch main
git pull
npm install

$env:YANDEX_BACKEND_URL="https://YOUR-SERVICE.onrender.com"
npm run build:yandex
```

## CMD

```bat
git switch main
git pull
npm install

set YANDEX_BACKEND_URL=https://YOUR-SERVICE.onrender.com
npm run build:yandex
```

После успешной сборки появится:

```text
dist/dread-shift-yandex.zip
```

И распакованная версия:

```text
dist/yandex/
```

Перед загрузкой не перепаковывай папку так, чтобы внутри ZIP появилась лишняя папка `yandex/`.

В созданном скриптом архиве `index.html` уже находится прямо в корне.

---

# 4. Создание игры в Developer Console

1. Открой Yandex Games Developer Console.
2. Создай профиль разработчика, если ещё нет.
3. Заверши оформление договора/монетизации, которое предложит Console/YAN.
4. Нажми **Add app / Добавить приложение**.
5. Создай новый Draft.

Для отправки на модерацию договор должен быть подписан.

---

# 5. Поля Draft

## Version

Для первого релиза можно указать:

```text
0.1.0
```

или:

```text
8.9.9-yandex-1
```

## Archive

Загрузи:

```text
dread-shift-yandex.zip
```

## Supported platforms

Для первой версии выбирай:

**Desktop / Компьютеры**

Не отмечай mobile/tablet, пока мы отдельно не сделаем полноценное touch-управление.

Это важно: Яндекс проверяет игру именно на тех платформах, которые ты объявил.

## Orientation

Для текущего интерфейса используй landscape/горизонтальную ориентацию, если Console просит выбрать.

## Languages

Укажи:
- Russian;
- English.

Не указывай языки, которых нет в интерфейсе.

---

# 6. CSP / Allowed hosts

Поскольку сервер DREAD SHIFT внешний:

1. Открой вкладку **CSP / Allowed hosts**.
2. Добавь hostname своего backend.

Если адрес:

```text
https://night-shift-example.onrender.com
```

в поле host нужно писать только:

```text
night-shift-example.onrender.com
```

Не указывай:
- `https://`;
- путь;
- порт;
- IP-адрес.

В причине можно написать:

```text
Game backend for persistent player saves, authoritative SOLO simulation and WebSocket connection.
```

Яндекс разрешает HTTPS и WSS для разрешённых hosts.

---

# 7. Монетизация

Если цель — заработать, включи рекламу в Console/YAN.

В коде уже используются:
- fullscreen/interstitial;
- rewarded video.

Стартовая реклама Яндекс может показываться автоматически платформой — она не считается нашей собственной рекламной интеграцией.

Не добавляй самостоятельно:
- AdSense;
- сторонние баннеры;
- ссылки на оплату;
- внешние микротранзакции.

Если позже добавим покупки, они должны идти через Yandex Games Purchases SDK.

---

# 8. Как тестировать до модерации

После загрузки ZIP нажми:

**Open draft with debug panel**

или открой draft с debug mode.

Проверь по очереди.

## SDK

Не должно быть ошибки про отсутствующий SDK.

## I18N

Debug Panel должен показывать, что SDK language/i18n используется.

Проверь RU и EN.

## Game Ready

Индикатор Game Ready должен срабатывать один раз после открытия рабочего лобби, а не сразу на белом/загрузочном экране.

## Gameplay

Индикатор gameplay:
- OFF в лобби;
- ON после начала SOLO;
- OFF при ESC/настройках;
- OFF при поражении;
- OFF во время рекламы;
- снова ON после закрытия рекламы и возврата в бой.

## Sound

Запусти стрельбу/звуки и:
- перейди на другую вкладку;
- сверни браузер.

Звук должен прекратиться максимум примерно за 2 секунды.

## Context menu

Нажми правой кнопкой на:
- игровом поле;
- UI во время игры.

Стандартное браузерное context menu не должно мешать игре.

## Save

1. Получи серебро/золото.
2. Пройди несколько волн.
3. Закрой Draft.
4. Открой снова.

Прогресс должен восстановиться с нашего backend по постоянному Yandex Player ID. `player.setData()` используется дополнительно как признак платформенного запуска, но не дублирует игровую экономику.

## Rewarded ad

В лобби:
1. нажми `🎬 +20 G`;
2. дождись окончания рекламы;
3. проверь +20 gold.

Если рекламу закрыть без reward callback — награда не должна начисляться.

## Fullscreen ad

1. проиграй забег;
2. нажми «Ещё раз»;
3. реклама должна появиться в логической паузе;
4. после закрытия должен начаться новый забег.

## Network failure

Если backend недоступен, вместо сломанного интерфейса должен появиться экран ошибки с кнопкой повторной загрузки.

---

# 9. Перед Submit for moderation

Пройти вручную:

- [ ] игра открывается без старого окна логин/пароль;
- [ ] SOLO можно начать сразу как гостю;
- [ ] прогресс сохраняется;
- [ ] RU/EN автоматически выбираются через SDK;
- [ ] Game Ready корректный;
- [ ] Gameplay Start/Stop корректны;
- [ ] звук пропадает при потере focus;
- [ ] реклама останавливает звук/игру;
- [ ] fullscreen не выскакивает посреди боя;
- [ ] rewarded награда выдаётся только после просмотра;
- [ ] browser context menu не мешает;
- [ ] нет красных JS errors в Console;
- [ ] нет битых картинок;
- [ ] UI нормально выглядит при разных размерах desktop-окна;
- [ ] backend host добавлен в CSP;
- [ ] архив меньше 100 MB распакованным;
- [ ] `index.html` в корне;
- [ ] нет кириллицы/пробелов в filenames;
- [ ] в Draft указаны только Desktop + RU/EN;
- [ ] монетизация включена.

---

# 10. Отправка на модерацию

Когда Debug Panel чистый:

1. сохрани Draft;
2. проверь Description/Promotion для RU и EN;
3. загрузи иконку/обложки/скриншоты;
4. убедись, что жанр и описание реально соответствуют gameplay;
5. нажми **Submit for moderation**.

По документации Яндекс обычно рассматривает игру примерно **3–5 рабочих дней**.

Если отклонят — это не конец. В Console и на почту приходит конкретный пункт требований. Исправляем только указанные нарушения, загружаем новый ZIP и повторно отправляем.

---

# 11. Что вводить в описание CSP

Пример:

```text
This host is used only as the DREAD SHIFT game backend for player progress,
authoritative SOLO simulation and secure WebSocket communication.
All graphics, audio, UI and game assets are stored inside the Yandex Games archive.
```

---

# 12. Официальная документация

- Requirements: https://yandex.com/dev/games/doc/en/concepts/requirements
- Quick start: https://yandex.com/dev/games/doc/en/concepts/quick-start
- Upload: https://yandex.com/dev/games/doc/en/console/add-new-game
- Draft fields: https://yandex.com/dev/games/doc/en/console/add-new-game/draft
- Moderation: https://yandex.com/dev/games/doc/en/concepts/moderation
- Testing: https://yandex.com/dev/games/doc/en/console/test-game
- Debug Panel: https://yandex.com/dev/games/doc/en/console/debug-panel
- SDK: https://yandex.com/dev/games/doc/en/sdk
- SDK connection: https://yandex.com/dev/games/doc/en/sdk/sdk-about
- Game Ready / Gameplay: https://yandex.com/dev/games/doc/en/sdk/sdk-game-events
- Pause/Resume events: https://yandex.com/dev/games/doc/en/sdk/sdk-events
- Player Data: https://yandex.com/dev/games/doc/en/sdk/sdk-player
- Advertising: https://yandex.com/dev/games/doc/en/sdk/sdk-adv
- Ad placement requirements: https://yandex.com/dev/games/doc/en/requirements/4/4
- Authorization requirement: https://yandex.com/dev/games/doc/en/requirements/1/2
- Automatic language: https://yandex.com/dev/games/doc/en/requirements/2/14
- Focus/sound requirement: https://yandex.com/dev/games/doc/en/requirements/1/3
- Monetization: https://yandex.com/dev/games/doc/en/services/about-monetization
