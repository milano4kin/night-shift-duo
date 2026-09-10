"use strict";

const fs = require("fs");
const path = require("path");

const copyPairs = [
  [
    "Создай аккаунт — прогресс, питомцы, золото и статистика будут привязаны к нему.",
    "Создай аккаунт один раз — прогресс, питомцы, золото и статистика будут сохраняться автоматически.",
    "Create an account — progress, pets, gold and stats will be tied to it.",
    "Create an account once — your progress, pets, gold and stats will be saved automatically."
  ],
  [
    "Выберите класс, подготовьте снаряжение и отправляйтесь на смену. Новые системы штаба открываются постепенно.",
    "Выбери класс, подготовь снаряжение и начни забег. Новые возможности штаба открываются по мере прогресса.",
    "Choose a class, prepare your gear and start your shift. New HQ systems unlock gradually.",
    "Choose a class, prepare your gear and start a run. New HQ features unlock as you progress."
  ],
  ["всё за серебро","оружие и полезные предметы","everything for silver","weapons and useful items"],
  ["зарабатывай серебро","выполняй задания — получай серебро","earn silver","complete tasks — earn silver"],
  ["постоянная прокачка","усиления между забегами","permanent progression","upgrades between runs"],
  ["питомцы за золото","открывай ящики — находи питомцев","pets for gold","open crates — find pets"],
  ["инвентарь и индекс","коллекция и выбранный питомец","inventory & index","collection and equipped pet"],
  ["титулы и награды","цели, награды и прогресс","titles & rewards","goals, rewards and progress"],
  ["последние 5 забегов","результаты последних 5 забегов","last 5 runs","results from your last 5 runs"],
  ["Создать одиночный забег","Играть одному","Create a solo run","Play solo"],
  ["Комната на 2 игроков","Создать комнату для друга","2-player room","Create a room for a friend"],
  ["Присоединиться к другу","Ввести код комнаты","Join a friend","Enter a room code"],
  [
    "Игра не начнётся сама. Забег стартует только после нажатия «Начать игру» создателем комнаты.",
    "Забег начнёт только создатель комнаты. Когда оба готовы — нажми «Начать игру».",
    "The game will not start automatically. The run starts only when the room creator presses Start game.",
    "Only the room creator can start the run. When everyone is ready, press Start game."
  ],
  [
    "Характеристики указаны на первой волне появления. Дальше враги становятся сильнее.",
    "Показаны базовые характеристики при первом появлении врага. На поздних волнах он становится сильнее.",
    "Stats are shown for the first wave where an enemy appears. Enemies get stronger later.",
    "These are the enemy's base stats on first appearance. It becomes stronger on later waves."
  ],
  [
    "WASD — движение · SHIFT — бег · 1 — оружие · 2 — мультитул · 3 — аптечка · R — перезарядка · ЛКМ — действие · постройки выбираются снизу · колесо — поворот стен/ворот · ПКМ — отмена строительства.",
    "WASD — движение · Shift — бег · 1 — оружие · 2 — мультитул · 3 — аптечка · R — перезарядка · ЛКМ — действие · колесо — повернуть постройку · ПКМ — отменить строительство.",
    "WASD — move · SHIFT — sprint · 1 — weapon · 2 — multitool · 3 — medkit · R — reload · LMB — action · choose structures below · mouse wheel — rotate · RMB — cancel building.",
    "WASD — move · Shift — sprint · 1 — weapon · 2 — multitool · 3 — medkit · R — reload · LMB — action · wheel — rotate building · RMB — cancel building."
  ]
];

function polishFile(file, includeEnglish) {
  const target = path.join(__dirname, file);
  let source = fs.readFileSync(target, "utf8");
  const original = source;
  for (const [ruFrom, ruTo, enFrom, enTo] of copyPairs) {
    source = source.split(ruFrom).join(ruTo);
    if (includeEnglish) source = source.split(enFrom).join(enTo);
  }
  if (file === "public/index.html") {
    source = source.replace(
      "Прогресс аккаунта сохраняется на сервере в базе данных.",
      "Прогресс сохраняется автоматически. Можно закрыть игру и продолжить позже с этого аккаунта."
    );
  }
  if (source !== original) fs.writeFileSync(target, source, "utf8");
  return source !== original;
}

function polishTypography() {
  const target = path.join(__dirname, "public", "style.css");
  let css = fs.readFileSync(target, "utf8");
  const marker = "/* v8 readable typography polish */";
  if (css.includes(marker)) return false;
  css += `\n\n${marker}\nhtml,body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;font-kerning:normal}\nbutton,input{letter-spacing:.005em}\n.hero p,.auth-brand p,.help,.start-warning,.auth-note{line-height:1.58}\n.lobby-meta-nav button b,.lobby-mode b,.section-kicker,.tag{letter-spacing:.035em}\n.lobby-meta-nav button small,.lobby-mode span,.character small{line-height:1.38}\n.auth-card h1,.hero h1,.index-title h2{letter-spacing:-.035em}\n@media(max-width:1100px){.help{font-size:12px;line-height:1.5}}\n`;
  fs.writeFileSync(target, css, "utf8");
  return true;
}

const htmlChanged = polishFile("public/index.html", false);
const clientChanged = polishFile("public/client.js", true);
const cssChanged = polishTypography();
console.log(`Copy polish patch: html=${htmlChanged ? "updated" : "unchanged"}, client=${clientChanged ? "updated" : "unchanged"}, css=${cssChanged ? "updated" : "already patched"}`);
