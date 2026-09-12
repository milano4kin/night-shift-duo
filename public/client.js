/* DREAD SHIFT v8.9 client */
// legacy QA markers exact:
// 950 27px system-ui
// 950 15px system-ui
// Current progress
// Дерево","Wood"
// Камень","Stone"
// Металл","Scrap"
// const talentOpen=innerWidth>900
(()=>{
"use strict";
function storageGet(key){try{return window.localStorage?.getItem(key)??null}catch{return null}}
function storageSet(key,value){try{window.localStorage?.setItem(key,String(value));return true}catch{return false}}
function storageRemove(key){try{window.localStorage?.removeItem(key);return true}catch{return false}}
let lang=storageGet("nsd_language")==="en"?"en":"ru";
const isEn=()=>lang==="en";
const T=(ru,en)=>isEn()?en:ru;
const STATIC_EN={
  "Двойной рубеж":"Double Frontier",
  "Выберите класс, подготовьте аккаунт в лобби, затем создайте комнату, запустите SOLO или присоединитесь по коду.":"Choose a class, prepare your account in the lobby, then create a room, start SOLO, or join by code.",
  "серебро":"silver","золото":"gold","Магазин":"Shop","всё за серебро":"everything for silver","Квесты":"Quests","зарабатывай серебро":"earn silver",
  "Улучшения":"Upgrades","постоянная прокачка":"permanent progression","Ящики":"Crates","питомцы за золото":"pets for gold","Питомцы":"Pets","инвентарь и индекс":"inventory & index",
  "Достижения":"Achievements","титулы и награды":"titles & rewards","История":"History","последние 5 забегов":"last 5 runs","Имя персонажа":"Character name",
  "Стартовый":"Starter","Базовый класс без бонусов":"Basic class with no bonuses","БЕСПЛАТНО":"FREE","Стрелок":"Shooter","HK UMP со старта · +30% урон стрельбой":"Starts with HK UMP · +30% ranged damage",
  "Нож-бабочка · +50% HP · +15% скорость · +28% мили":"Butterfly Knife · +50% HP · +15% speed · +28% melee","Пламенный дракон":"Flame Dragon","Огненное мачете · +40% HP · усиленный огонь":"Fire Machete · +40% HP · enhanced fire",
  "Bubble Gun · 60 пузырей · полная перезарядка 3 мин":"Bubble Gun · 60 bubbles · full recharge 3 min","Создать одиночный забег":"Create a solo run","СОЗДАТЬ ЛОББИ":"CREATE LOBBY","Комната на 2 игроков":"2-player room",
  "ПО КОДУ":"JOIN CODE","Присоединиться к другу":"Join a friend","Код комнаты":"Room code","Присоединиться":"Join","Назад":"Back","КООПЕРАТИВНОЕ ЛОББИ":"CO-OP LOBBY","Ожидание игроков…":"Waiting for players…",
  "Начать игру":"Start game","Вернуться к выбору классов":"Return to class selection","Игра не начнётся сама. Забег стартует только после нажатия «Начать игру» создателем комнаты.":"The game will not start automatically. The run starts only when the room creator presses Start game.",
  "АРХИВ УГРОЗ":"THREAT ARCHIVE","ИНДЕКС":"INDEX","Зомби":"Zombies","Характеристики указаны на первой волне появления. Дальше враги становятся сильнее.":"Stats are shown for the first wave where an enemy appears. Enemies get stronger later.",
  "ВАША СМЕНА ВРЕМЕННО ЗАКОНЧЕНА":"YOUR SHIFT IS TEMPORARILY OVER","ВЫ ПОГИБЛИ":"YOU DIED","Ждать напарника":"Wait for teammate","Ещё раз":"Retry",
  "НОВАЯ ЗАПИСЬ В ИНДЕКСЕ":"NEW INDEX ENTRY","ОТКРЫТ НОВЫЙ ТИП ЗОМБИ":"NEW ZOMBIE TYPE DISCOVERED","ЦЕНТР ПОДГОТОВКИ":"PREPARATION CENTER",
  "QA BUILD":"QA BUILD","Админ-меню":"Admin menu","Только для тестов. Перед релизом удалить.":"For testing only. Remove before release.","Оружие":"Weapons","Питомцы":"Pets",
  "ТАЛАНТЫ":"TALENTS","Мультитул":"Multitool","Аптечка":"Medkit","Стена":"Wall","Ворота":"Gate","Пушка":"Cannon","Электро":"Tesla","Кошка":"Cat","Ледяная":"Frost","Огненная":"Flame","Шипы":"Spikes",
  "PET COLLECTION":"PET COLLECTION","ПИТОМЦЫ":"PETS","Инвентарь 0/1":"Inventory 0/1","Инвентарь 1/1":"Inventory 1/1",
  "Пауза":"Pause","Продолжить":"Continue","Настройки":"Settings","Выйти в лобби":"Exit to lobby","НАСТРОЙКИ":"SETTINGS","Звук и управление":"Audio & controls","Включить звук":"Enable sound","Громкость эффектов":"SFX volume","Громкость окружения":"Ambient volume","Шаги персонажа":"Footsteps","Показывать админ-кнопку":"Show admin button",
  "ПРЕМИАЛЬНЫЙ ЯЩИК":"PREMIUM CRATE","Рулетка питомцев":"Pet roulette","Нажми «Открыть», чтобы запустить барабан.":"Press Open to spin the reel.","Открыть за 50 золота":"Open for 50 gold","Пропустить анимацию":"Skip animation",
  "ПОЛЕВОЙ МАГАЗИН":"FIELD SHOP","Оружие и аптечки":"Weapons & medkits","Магазин работает только рядом с базой. Покупки действуют в текущем забеге.":"The shop works only near the base. Purchases last for the current run.",
  "Купить":"Buy","Улучшить":"Upgrade","Максимум":"Maximum","Получено":"Claimed","В процессе":"In progress","Забрать":"Claim","Забрать награду":"Claim reward","НЕ ВЫПОЛНЕНО":"NOT COMPLETED","ПОЛУЧЕНО":"CLAIMED",
  "Количество":"Amount","Снять":"Unequip","Экипировать":"Equip","ПУСТО":"EMPTY","Индекс питомцев":"Pet index","Инвентарь":"Inventory",
  "+1 жетон ящика":"+1 crate token","+100 дерева":"+100 wood","+100 золота":"+100 gold","+100 камня":"+100 stone","+100 серебра":"+100 silver","+250 металла":"+250 scrap",
  "0 очков":"0 points","Игра":"Game","бестиарий":"bestiary","Открыто 0/8":"Discovered 0/8","● подключение":"● connecting",
  "Пистолет":"Pistol","Старый пистолет":"Old Pistol","Нож-бабочка":"Butterfly Knife","Огненное мачете":"Fire Machete",
  "Инвентарь пуст, пока питомец реально не выпадет из ящика. Одновременно можно экипировать только одного.":"The inventory stays empty until a pet actually drops from a crate. Only one pet can be equipped at a time.",
  "Напарник ещё может поднять тебя.":"Your teammate can still revive you.","Зелёный чубрик оказался убедительнее.":"The green brute made a convincing argument.",
  "не начнётся сама":"will not start automatically",". Забег стартует только после нажатия «Начать игру» создателем комнаты.":". The run starts only when the room creator presses Start game.",
  "WASD — движение · SHIFT — бег · 1 — оружие · 2 — мультитул · 3 — аптечка · R — перезарядка · ЛКМ — действие · постройки выбираются снизу · колесо — поворот · ПКМ — отмена строительства.":"WASD — move · SHIFT — sprint · 1 — weapon · 2 — multitool · 3 — medkit · R — reload · LMB — action · choose structures below · mouse wheel — rotate · RMB — cancel building.",
  "50 золота · COMMON 50% · UNCOMMON 28% · RARE 12% · EPIC 6% · LEGENDARY 3% · SECRET 1%":"50 gold · COMMON 50% · UNCOMMON 28% · RARE 12% · EPIC 6% · LEGENDARY 3% · SECRET 1%",
  "10д · 12к · 40м":"10w · 12s · 40scr","12д · 8к · 44м":"12w · 8s · 44scr","18д · 4к · 22м":"18w · 4s · 22scr","12д · 10к · 32м":"12w · 10s · 32scr","16д · 6к · 36м":"16w · 6s · 36scr","15д · 2к · 8м":"15w · 2s · 8scr","18д · 4к":"18w · 4s","22д · 5к · 4м":"22w · 5s · 4scr"
};
const STATIC_RU=Object.fromEntries(Object.entries(STATIC_EN).map(([ru,en])=>[en,ru]));
function translateUiText(text){
  if(!text)return text;
  if(!isEn())return STATIC_RU[text]||text;
  if(STATIC_EN[text])return STATIC_EN[text];
  let x=text;
  const reps=[
    [/^(\d+) золота$/, '$1 gold'],[/^(\d+) серебра$/, '$1 silver'],[/^🔒 (\d+) золота$/, '🔒 $1 gold'],[/^✓ ОТКРЫТ$/, '✓ UNLOCKED'],
    [/^ур\. (\d+)\/(\d+)$/, 'lvl $1/$2'],[/^ур\. (\d+)$/, 'lvl $1'],[/^В запасе: (\d+) · АВТО при следующем старте$/, 'In stock: $1 · AUTO next start'],
    [/^Волна (\d+)$/, 'Wave $1'],[/^(\d+) убийств$/, '$1 kills'],[/^(\d+) урона · (\d+) построек$/, '$1 damage · $2 built'],
    [/^Экипировано (0\/1|1\/1)(.*)$/, 'Equipped $1$2'],[/^Количество: (\d+)$/, 'Amount: $1'],
    [/^Открыто (\d+)\/(\d+)$/, 'Discovered $1/$2'],[/^Баланс: (\d+) золота · жетоны: (\d+) · (.*)$/, 'Balance: $1 gold · tokens: $2 · $3'],
  ];
  for(const [re,r] of reps)if(re.test(x))return x.replace(re,r);
  return x;
}
function translateDom(root=document.body){
  if(!root)return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  for(const n of nodes){
    const par=n.parentElement;if(!par||par.closest('script,style,input,textarea'))continue;
    const raw=n.nodeValue,trim=raw.trim();if(!trim)continue;
    const next=translateUiText(trim);if(next!==trim)n.nodeValue=raw.replace(trim,next);
  }
}
function translateServerText(text){
  if(!text)return text;
  let x=String(text);
  const debut=x.match(/^Новый враг: ([a-z_]+)$/i);if(debut)return `${T("Новый враг","New enemy")}: ${zombieNames[debut[1]]||debut[1]}`;
  if(!isEn())return x;
  const exact={
    "Не хватает ресурсов":"Not enough resources","Магазин работает у генератора":"The shop works near the generator","Админ-команда применена":"Admin command applied",
    "Действие недоступно: проверь валюту или условия":"Action unavailable: check currency or requirements","Этот профиль сейчас используется в активном забеге":"This profile is currently used in an active run",
    "Нужно 50 золотых монет или золотой жетон ящика":"You need 50 gold or a golden crate token","Новый SOLO-забег начался":"New SOLO run started",
    "В кооперативе мир не ставится на паузу":"The world cannot be paused in co-op","Игру запускает создатель комнаты":"Only the room creator can start the game",
    "Для кооперативного лобби нужен второй игрок. Для игры одному выберите SOLO.":"A co-op lobby needs a second player. Choose SOLO to play alone.",
    "Скип подготовки доступен только создателю комнаты":"Only the room creator can skip preparation","Сначала добейте текущую волну":"Finish the current wave first",
    "В слоте 3 нет аптечек":"There are no medkits in slot 3","Здоровье уже полное":"Health is already full","Не хватает ресурсов для ремонта мультитулом":"Not enough resources for multitool repair",
    "Подойдите к генератору":"Move closer to the generator","База уже полностью отремонтирована":"The base is already fully repaired","Для ремонта нужно 8 дерева, 6 камня, 12 металла":"Repair requires 8 wood, 6 stone and 12 scrap",
    "Генератор отремонтирован на 260 HP":"Generator repaired by 260 HP","База уже максимального уровня":"The base is already at maximum level",
    "Админ-команды отключены в обычной сборке":"Admin commands are disabled in the normal build","🎟 Найден золотой жетон ящика: следующий кейс можно открыть бесплатно":"🎟 Golden crate token found: your next crate can be opened for free",
    "60 пузырей израсходованы. Bubble Gun восстановится через 3 минуты.":"All 60 bubbles are spent. Bubble Gun will recharge in 3 minutes.","60 пузырей израсходованы. Bubble Gun вернётся через 3 минуты.":"All 60 bubbles are spent. Bubble Gun will return in 3 minutes.",
    "🫧 Королевская перезарядка завершена: 60 пузырей готовы.":"🫧 Royal recharge complete: 60 bubbles are ready.",
    "Добывайте ресурсы и укрепляйте генератор":"Gather resources and reinforce the generator","Рассвет — добыча, магазин и строительство":"Dawn — gathering, shop and building",
    "Вы уже находитесь в комнате":"You are already in a room","В этой комнате уже идёт забег":"A run is already in progress in this room","Это одиночная комната":"This is a solo room",
    "В комнате уже два игрока":"The room already has two players","Этот профиль уже используется в другой комнате":"This profile is already used in another room",
    "Введите код комнаты":"Enter the room code","Комната с таким кодом не найдена":"No room was found with that code","К этой комнате нельзя присоединиться":"You cannot join this room",
    "Неизвестная постройка":"Unknown structure","Слишком далеко":"Too far away","Край карты":"Map boundary","Слишком близко к базе":"Too close to the base","Стены пересекаются":"Walls overlap","Место занято":"Space occupied","Сначала уберите ресурс":"Remove the resource first","Здесь стоит игрок":"A player is standing here","Здесь находится зомби":"A zombie is here",
    "Постройка не найдена":"Structure not found","Подойдите ближе к постройке":"Move closer to the structure","Постройка уже максимального уровня":"Structure is already at maximum level"
  };
  if(exact[x])return exact[x];
  const rules=[
    [/^Волна очищена: \+(\d+) металла(?: · \+(\d+) золота)?(.*)$/,(_,scr,gold,rest)=>`Wave cleared: +${scr} scrap${gold?` · +${gold} gold`:''}${rest.replace(/дерева/g,'wood').replace(/камня/g,'stone')}`],
    [/^Квест выполнен: (.+)\. Награду можно забрать в лобби\.$/,(_,q)=>`Quest completed: ${translateQuestRaw(q)}. Claim the reward in the lobby.`],
    [/^Все квесты закрыты\. Новый набор будет доступен через 30 минут\.$/,()=>`All quests completed. A new set will be available in 30 minutes.`],
    [/^Класс открыт: (.+)$/,(_,v)=>`Class unlocked: ${translateClassRaw(v)}`],
    [/^Ящик ещё закрыт: ([\d.]+)с$/,(_,v)=>`Crate cooldown: ${v}s`],
    [/^Уровень (\d+)! Получено очко навыка\.$/,(_,v)=>`Level ${v}! Skill point earned.`],
    [/^(.+) улучшена до уровня (\d+)$/,(_,a,b)=>`${translateStructureRaw(a)} upgraded to level ${b}`],
    [/^Аптечка добавлена в слот 3\. Всего: (\d+)$/,(_,v)=>`Medkit added to slot 3. Total: ${v}`],
    [/^🏆 Достижение выполнено: (.+)\. Забери титул и (\d+) золота в лобби\.$/,(_,a,g)=>`🏆 Achievement completed: ${translateAchievementRaw(a)}. Claim the title and ${g} gold in the lobby.`],
    [/^🏆 Награда получена: (.+) · \+(\d+) золота · титул «(.+)»$/,(_,a,g,t)=>`🏆 Reward claimed: ${translateAchievementRaw(a)} · +${g} gold · title “${displayTitle(t)}”`],
    [/^Подготовка автоматически активирована: (.+)$/,(_,v)=>`Preparation automatically activated: ${v.replace(/аптечка/g,"medkit").replace(/металла/g,"scrap").replace(/набор снабжения/g,"supply pack").replace(/урона/g,"damage").replace(/скорости/g,"speed")}`],
    [/^Риск на следующую волну: (.+)$/,(_,v)=>`Risk for the next wave: ${modifierNameFromRaw(v)}`],[/^РИСК ПРИНЯТ: (.+)$/,(_,v)=>`RISK ACCEPTED: ${modifierNameFromRaw(v)}`],
    [/^Новый враг: (.+)$/,(_,v)=>`New enemy: ${zombieNames[Object.keys(zombieNamesEn).find(k=>catalogRu.zombieNames[k]===v)]||v}`],
    [/^Ночь (\d+)(.*)$/,(_,n,r)=>`Night ${n}${r}`],[/^Волна (\d+): Мини-босс — (.+?)( · .*)?$/,(_,n,b,r)=>`Wave ${n}: Mini-boss — ${translateBossRaw(b)}${r||""}`],[/^Волна (\d+): (.+?)( · .*)?$/,(_,n,b,r)=>`Wave ${n}: ${translateBossRaw(b)}${r||""}`],
    [/^Добыто: \+(\d+) (дерева|камня|металла)$/,(_,n,k)=>`Gathered: +${n} ${{"дерева":"wood","камня":"stone","металла":"scrap"}[k]}`],
    [/^Лут босса: (.+)$/,(_,v)=>`Boss loot: ${translateLootRaw(v)}`],[/^Босс-кэш: \+(\d+) металла$/,(_,n)=>`Boss cache: +${n} scrap`],[/^🎁 Босс-кэш открыт: \+(\d+) металла$/,(_,n)=>`🎁 Boss cache opened: +${n} scrap`],
    [/^Аптечка: \+(\d+) HP · осталось (\d+)$/,(_,h,n)=>`Medkit: +${h} HP · ${n} left`],[/^База улучшена до уровня (\d+)$/,(_,n)=>`Base upgraded to level ${n}`],
    [/^Для улучшения нужно: (\d+) дерева, (\d+) камня, (\d+) металла$/,(_,w,st,sc)=>`Upgrade requires: ${w} wood, ${st} stone, ${sc} scrap`],
    [/^Нужно: (\d+) дерева, (\d+) камня, (\d+) металла$/,(_,w,st,sc)=>`Required: ${w} wood, ${st} stone, ${sc} scrap`],
    [/^Подготовка пропущена — начинается волна (\d+)$/,(_,n)=>`Preparation skipped — wave ${n} begins`],[/^Голос за риск: (\d+)\/(\d+)$/,(_,a,b)=>`Risk votes: ${a}/${b}`],
    [/^Все согласились: (.+)$/,(_,v)=>`Everyone agreed: ${modifierNameFromRaw(v)}`],[/^(.+): (ФАЗА|ФИНАЛ)(.*)$/,(_,b,phase,rest)=>`${translateBossRaw(b)}: ${phase==="ФИНАЛ"?"FINAL":"PHASE"}${rest.replace(/ПРИЗЫВ/g," — SUMMON").replace(/ЯРОСТЬ/g," RAGE").replace(/БЕШЕНСТВО/g," — FRENZY").replace(/ЧУМНОЙ РИТУАЛ/g," — PLAGUE RITUAL").replace(/ОСАДНЫЙ РЕЖИМ/g," — SIEGE MODE").replace(/ТЁМНЫЕ КОПИИ/g," — SHADOW COPIES").replace(/КОРОЛЕВСКАЯ ОРДА/g," — ROYAL HORDE").replace(/ЭЛИТНАЯ СВИТА/g," — ELITE RETINUE").replace(/КОРОЛЕВСКАЯ ЯРОСТЬ/g," — ROYAL RAGE")}`]
  ];
  for(const [re,fn] of rules)if(re.test(x))return x.replace(re,fn);
  return x;
}

function modifierNameFromRaw(v){const map={"КРОВАВАЯ НОЧЬ":"BLOOD NIGHT","КИСЛОТНЫЙ ДОЖДЬ":"ACID RAIN","ПОЛНОЛУНИЕ":"FULL MOON","ЧЁРНАЯ НОЧЬ":"BLACK NIGHT"};return isEn()?(map[String(v)]||String(v)):String(v);}
function translateBossRaw(v){const map={"Каменный Громила":"Stone Brute","Мясник":"Butcher","Чумная Матка":"Plague Mother","Железный Колосс":"Iron Colossus","Повелитель Тьмы":"Lord of Shadows","Король Заражения":"Infection King","Ядовитый громила":"Toxic Brute","Лавовый зверь":"Lava Beast","Теневой охотник":"Shadow Stalker","Вестник пустоты":"Void Harbinger","БОСС":"BOSS"};return isEn()?(map[String(v)]||String(v)):String(v);}
function translateAchievementRaw(v){const map={"Ночной охотник":"Night Hunter","Убийца титанов":"Titan Slayer","Инженер":"Engineer","Зелёная катастрофа":"Green Catastrophe","Идеальная оборона":"Perfect Defense","Сталь против чудовища":"Steel Against the Beast"};return isEn()?(map[String(v)]||String(v)):String(v);}
function translateClassRaw(v){const map={"Стартовый":"Starter","Стрелок":"Shooter","Пламенный дракон":"Flame Dragon"};return isEn()?(map[String(v)]||String(v)):String(v);}
function translateStructureRaw(v){const map={"Стена":"Wall","Ворота":"Gate","Пушка":"Cannon","Электро-башня":"Tesla Tower","Кошка-башня":"Cat Tower","Ледяная башня":"Frost Tower","Огненная башня":"Flame Tower","Шипы":"Spikes"};return isEn()?(map[String(v)]||String(v)):String(v);}
function translateQuestRaw(v){const map={"Охота на заражённых":"Infected Hunt","Зачистка квартала":"Block Cleanup","Ночная мясорубка":"Night Grinder","Без права на проход":"No Passage","Снабжение убежища":"Shelter Supplies","Полные склады":"Full Warehouses","Экспедиция за припасами":"Supply Expedition","Запас на чёрный день":"Rainy-Day Stockpile","Первая вахта":"First Watch","Ночная вахта":"Night Watch","До самого рассвета":"Until Dawn","Несгибаемая смена":"Unbreakable Shift","Быстрая оборона":"Quick Defense","Архитектор обороны":"Defense Architect","Крепость за ночь":"Fortress Overnight","Инженерный марафон":"Engineering Marathon"};return isEn()?(map[String(v)]||String(v)):String(v);}
function translateLootRaw(v){if(!isEn())return String(v);let x=String(v);const map={"Обычное":"Common","Необычное":"Uncommon","Редкое":"Rare","Эпическое":"Epic","Легендарное":"Legendary","Старый пистолет":"Old Pistol","Нож-бабочка":"Butterfly Knife","Огненное мачете":"Fire Machete","Пистолет с мыльными пузырями":"Bubble Gun"};for(const [a,b] of Object.entries(map))x=x.replaceAll(a,b);return x;}
function bossLootKindName(kind){
  const ru={scrap:"Металл",wood:"Дерево",stone:"Камень",gold:"Золото",crateToken:"Жетон ящика"};
  const en={scrap:"Scrap",wood:"Wood",stone:"Stone",gold:"Gold",crateToken:"Crate token"};
  return (isEn()?en:ru)[kind]||kind;
}
function bossLootRarityName(r){
  const ru={common:"Обычный",uncommon:"Необычный",rare:"Редкий",epic:"Эпический",legendary:"Легендарный"};
  const en={common:"Common",uncommon:"Uncommon",rare:"Rare",epic:"Epic",legendary:"Legendary"};
  return (isEn()?en:ru)[r]||r;
}
function bossLootIcon(kind){
  return ({scrap:"⚙",wood:"🪵",stone:"🪨",gold:"🪙",crateToken:"🎟"})[kind]||"✦";
}
function comboRankText(tier){
  const ru=["","РАЗОГРЕВ","БУЙСТВО","НЕОСТАНОВИМ","БЕЗУМИЕ","БОГ СМЕРТИ"];
  const en=["","HEATING UP","RAMPAGE","UNSTOPPABLE","MADNESS","DEATH GOD"];
  return (isEn()?en:ru)[Math.max(0,Math.min(5,Number(tier)||0))]||"";
}
function comboAccent(tier){return ["#b6c2c7","#8ee9a7","#69c7ff","#c98cff","#ff9d63","#ffd45e"][Math.max(0,Math.min(5,Number(tier)||0))]||"#fff";}
function showComboFlash(m){
  comboFlash={count:Number(m.count)||0,tier:Number(m.tier)||0,until:performance.now()+1900};
  screenShakeUntil=Math.max(screenShakeUntil,performance.now()+170);
  screenShakePower=Math.max(screenShakePower,2.6+(Number(m.tier)||0)*.55);
  playSfx("coin",.65);
  pushCombatLog(`${T("Серия","Streak")} x${Number(m.count)||0} · ${comboRankText(m.tier)}`,"event");
}
function showBossLoot(m){
  if(!bossLootPanel||!bossLootItems)return;
  const bossName=isEn()?(zombieNamesEn[m.bossType]||String(m.bossName||"Boss")):String(m.bossName||"Босс");
  bossLootTitle.textContent=T("Добыча с босса","Boss loot");
  bossLootSubtitle.textContent=bossName;
  const items=Array.isArray(m.items)?m.items:[];
  bossLootItems.innerHTML=items.map(it=>`<div class="boss-loot-card rarity-${it.rarity||'common'}"><div class="boss-loot-icon">${bossLootIcon(it.kind)}</div><div class="boss-loot-name">${bossLootKindName(it.kind)}</div><div class="boss-loot-amount">x${Number(it.amount)||0}</div><div class="boss-loot-rarity">${bossLootRarityName(it.rarity||'common')}</div></div>`).join('');
  bossLootFoot.textContent=T("Добыча уже добавлена в инвентарь","Loot has already been added to your inventory");
  bossLootPanel.classList.add("visible");
  clearTimeout(bossLootHideTimer);
  bossLootHideTimer=setTimeout(()=>bossLootPanel.classList.remove("visible"),6500);
}

const $=id=>document.getElementById(id);
const canvas=$("game"),ctx=canvas.getContext("2d");
const lobby=$("lobby"),status=$("status"),roster=$("roster");
const notice=$("notice"),contextActions=$("contextActions");
const tooltip=$("buildTooltip"),talentDock=$("talentDock");
const deathOverlay=$("deathOverlay"),indexOverlay=$("indexOverlay"),unlockBanner=$("unlockBanner");
const petOverlay=$("petOverlay"),pauseOverlay=$("pauseOverlay"),crateOverlay=$("crateOverlay"),lobbyMetaOverlay=$("lobbyMetaOverlay"),runShopOverlay=$("runShopOverlay"),runUpgradeOverlay=$("runUpgradeOverlay"),exitConfirmOverlay=$("exitConfirmOverlay"),structureMenuOverlay=$("structureMenuOverlay");
const lobbyMetaContent=$("lobbyMetaContent"),lobbyMetaTitle=$("lobbyMetaTitle");
const adminGameBtn=$("adminGameBtn"),adminGamePanel=$("adminGamePanel");
const gameRail=$("gameRail"),combatLogPanel=$("combatLogPanel");
const bossLootPanel=$("bossLootPanel"),bossLootTitle=$("bossLootTitle"),bossLootSubtitle=$("bossLootSubtitle"),bossLootItems=$("bossLootItems"),bossLootFoot=$("bossLootFoot");

let ws,myId=null,state=null,connected=false,joined=false,character="starter",noticeTimer,isHost=false,roomMode=null,accountState=null,guideStep=0;
let selectedBuild=null,buildRotation=0,wallSnapEnabled=true,lastHarvest=0,activeTool="gun",pendingClassUnlock=null,selectedStructureId=null,structureInfoExpanded=false,structureDeleteArmed=false;
let lobbyMetaMode="shop",pauseOpen=false,activeCrateAnimation=null,lastMoveFootstep=0,lastPhaseSeen="",metaState=null,lastReloading=false;
let crateSpinLocked=false,crateCurrentResult=null,crateRevealTimer=null,serverPaused=false,runShopRenderSig="",pendingRunBuy=null,runUpgradeRenderSig="",pendingRunUpgrade=null,runUpgradeTab="weapon";
let bossLootHideTimer=null;
let lastFloorStageSeen=-1,lastSnapshotWave=-1,lastLoggedEventText="";
let combatLog=[];
let comboFlash=null;
const buildOrder=["wall","gate","cannon","tesla","cat_tower","frost_tower","flame_tower","spikes"];
let buildLabel={wall:"Стена",gate:"Ворота",cannon:"Пушка",tesla:"Электро-башня",cat_tower:"Кошка-башня",frost_tower:"Ледяная башня",flame_tower:"Огненная башня",spikes:"Шипы"};
const buildLabelEn={wall:"Wall",gate:"Gate",cannon:"Cannon",tesla:"Tesla Tower",cat_tower:"Cat Tower",frost_tower:"Frost Tower",flame_tower:"Flame Tower",spikes:"Spikes"};
const buildCosts={
  wall:{wood:18,stone:4,scrap:0},gate:{wood:22,stone:5,scrap:4},
  cannon:{wood:12,stone:14,scrap:55},tesla:{wood:14,stone:10,scrap:60},cat_tower:{wood:20,stone:6,scrap:35},
  frost_tower:{wood:14,stone:12,scrap:45},flame_tower:{wood:18,stone:8,scrap:52},spikes:{wood:16,stone:2,scrap:10}
};
function currentBuildCost(type){return state?.nextBuildCosts?.[type]||buildCosts[type]||{wood:0,stone:0,scrap:0};}
function currentBuildCount(type){return Number(state?.structureCounts?.[type]||0);}
function currentBuildLimit(type){const v=Number(state?.structureLimits?.[type]);return Number.isFinite(v)&&v>0?v:Infinity;}
let buildDescriptions={
  wall:"Прочная защита от зомби.",gate:"Секция обороны для прохода.",
  cannon:"Тяжёлая пушка. Стреляет ядрами, которые пробивают несколько врагов насквозь.",
  tesla:"Бьёт молнией и перекидывает разряд между несколькими врагами.",
  cat_tower:"Башня с котом. Когда враг подходит близко, бьёт его быстрой кошачьей лапкой.",
  frost_tower:"Стреляет ледяными зарядами и надолго замедляет врагов.",
  flame_tower:"Поливает ближайшую группу врагов огнём и поджигает их.",
  spikes:"Наносят урон и замедляют."
};
const buildDescriptionsEn={wall:"Solid protection against zombies.",gate:"Defensive passage section.",cannon:"Heavy cannonballs pierce through several enemies.",tesla:"Lightning chains between several enemies.",cat_tower:"A cat tower swats enemies that get too close.",frost_tower:"Fires ice shots that heavily slow enemies.",flame_tower:"Burns groups of nearby enemies and ignites them.",spikes:"Damage and slow enemies."};
let rarityLabel={common:"Обычное",uncommon:"Необычное",rare:"Редкое",epic:"Эпическое",legendary:"Легендарное"};
const rarityLabelEn={common:"Common",uncommon:"Uncommon",rare:"Rare",epic:"Epic",legendary:"Legendary"};
const rarityStroke={common:"#a7b0b4",uncommon:"#74ce8d",rare:"#66a9ff",epic:"#bd7bff",legendary:"#efc45e"};
let weaponNames={pistol:"Старый пистолет",micro_uzi:"IMI Micro Uzi",ump:"HK UMP",butterfly:"Нож-бабочка",fire_machete:"Огненное мачете",bubble_blaster:"Пистолет с мыльными пузырями"};
const weaponNamesEn={pistol:"Old Pistol",micro_uzi:"IMI Micro Uzi",ump:"HK UMP",butterfly:"Butterfly Knife",fire_machete:"Fire Machete",bubble_blaster:"Bubble Gun"};
const weaponPower={pistol:1,micro_uzi:1,ump:2,butterfly:3,fire_machete:4,bubble_blaster:5};
const weaponStars={pistol:1,micro_uzi:1,ump:2,butterfly:3,fire_machete:4,bubble_blaster:5};
const classStars={starter:1,shooter:2,cqc:3,flame:4,soap:5};
const meleeWeapons=new Set(["butterfly","fire_machete"]);

let classNames={starter:"Стартовый",shooter:"Стрелок",cqc:"Master Quarter Combat",flame:"Пламенный дракон",soap:"Soap King"};
const classNamesEn={starter:"Starter",shooter:"Shooter",cqc:"Master Quarter Combat",flame:"Flame Dragon",soap:"Soap King"};
const classColors={
  starter:"#72c78e",shooter:"#63a7ca",cqc:"#d2af63",flame:"#e47445",soap:"#86d9f3"
};
let zombieNames={orc:"Орк",runner:"Шустрик",armored:"Броневик",spitter:"Кислотник",bomber:"Бомбер",shaman:"Шаман",titan:"Титан",leaper:"Прыгун",shieldbearer:"Щитоносец",splitter:"Мутант",hunter:"Охотник",sapper:"Подрывник",necromancer:"Некромант",frost:"Ледяной",parasite:"Паразит",teleporter:"Телепортер",abyssal:"Бездонный",mini_toxic_brute:"Ядовитый громила",mini_lava_beast:"Лавовый зверь",mini_shadow_stalker:"Теневой охотник",mini_void_harbinger:"Вестник пустоты",boss_stone:"Каменный Громила",boss_butcher:"Мясник",boss_plague:"Чумная Матка",boss_colossus:"Железный Колосс",boss_shadow:"Повелитель Тьмы",boss_king:"Король Заражения"};
const zombieNamesEn={orc:"Orc",runner:"Runner",armored:"Armored",spitter:"Spitter",bomber:"Bomber",shaman:"Shaman",titan:"Titan",leaper:"Leaper",shieldbearer:"Shieldbearer",splitter:"Splitter",hunter:"Hunter",sapper:"Sapper",necromancer:"Necromancer",frost:"Frostborn",parasite:"Parasite",teleporter:"Teleporter",abyssal:"Abyssal",mini_toxic_brute:"Toxic Brute",mini_lava_beast:"Lava Beast",mini_shadow_stalker:"Shadow Stalker",mini_void_harbinger:"Void Harbinger",boss_stone:"Stone Brute",boss_butcher:"Butcher",boss_plague:"Plague Mother",boss_colossus:"Iron Colossus",boss_shadow:"Lord of Shadows",boss_king:"Infection King"};



const weaponImagePaths={
  pistol:"assets/weapons/pistol.png",
  micro_uzi:"assets/weapons/micro_uzi.png",
  ump:"assets/weapons/ump.png",
  butterfly:"assets/weapons/butterfly.png",
  fire_machete:"assets/weapons/fire_machete.png",
  bubble_blaster:"assets/weapons/bubble_blaster.png"
};
const weaponImages={};
for(const [key,src] of Object.entries(weaponImagePaths)){
  const img=new Image();
  img.src=src;
  weaponImages[key]=img;
}
const structureImagePaths={
  wall:"assets/structures/wall.png",
  gate:"assets/structures/gate.png",
  cannon:"assets/structures/cannon.png",
  tesla:"assets/structures/tesla.png",
  cat_tower:"assets/structures/cat_tower.png",
  frost_tower:"assets/structures/frost_tower.png",
  flame_tower:"assets/structures/flame_tower.png",
  spikes:"assets/structures/spikes.png"
};
const structureImages={};
for(const [key,src] of Object.entries(structureImagePaths)){
  const img=new Image();
  img.src=src;
  structureImages[key]=img;
}
const structureSpriteSize={
  wall:{w:128,h:50},
  gate:{w:150,h:90},
  cannon:{w:88,h:88},
  tesla:{w:88,h:88},
  cat_tower:{w:96,h:96},
  frost_tower:{w:96,h:96},
  flame_tower:{w:96,h:96},
  spikes:{w:88,h:88}
};
const handsImage=new Image();
handsImage.src="assets/structures/hands.png";
const resourceImagePaths={tree:"assets/resources/tree.png",rock:"assets/resources/rock.png",scrap:"assets/resources/scrap.png",bossCache:"assets/resources/boss_cache.png"};
const resourceImages={};
for(const [key,src] of Object.entries(resourceImagePaths)){const img=new Image();img.src=src;resourceImages[key]=img;}
const heldWeaponWidth={
  pistol:62,micro_uzi:68,ump:82,butterfly:82,fire_machete:92,bubble_blaster:76
};

const weaponIcons={
  pistol:"🔫",
  micro_uzi:"🔫",
  ump:"🔫",
  butterfly:"🦋🔪",
  fire_machete:"🔥🗡️",
  bubble_blaster:"🫧🔫"
};
const petInfo={
  panda:{name:"Panda",rarity:"common",chance:50,img:"assets/pets/panda.png",desc:"Когда здоровье игрока опускается ниже 35%, Panda восстанавливает 30% от максимального здоровья. Лечение может сработать один раз в 40 секунд. Каждые 15 секунд Panda атакует бамбуком до трёх ближайших врагов.",stats:["Лечение: 30% от максимального HP · перезарядка 40 сек","Бамбук: до 3 целей · перезарядка 15 сек"]},
  cat:{name:"Uiai Cat",rarity:"uncommon",chance:28,img:"assets/pets/cat.png",desc:"Когда здоровье игрока опускается ниже 65%, Uiai Cat восстанавливает 20% от максимального здоровья. Также кошка добивает до двух ближайших обычных врагов, если у них осталось меньше 12% здоровья.",stats:["Лечение: 20% от максимального HP · перезарядка 30 сек","Добивание врагов ниже 12% HP · перезарядка 12 сек"]},
  red_dragon:{name:"Red Dragon",rarity:"rare",chance:12,img:"assets/pets/red_dragon.png",desc:"Red Dragon раз в 10 секунд выдыхает огонь в ближайшего обычного врага и снимает до 30% его текущего здоровья. На боссов эта атака не действует. Пока дракон экипирован, Огненное мачете наносит на 20% больше урона.",stats:["Огненная атака: до 30% текущего HP цели · перезарядка 10 сек","Огненное мачете: +20% урона"]},
  axolotl:{name:"Pink Axolotl",rarity:"epic",chance:6,img:"assets/pets/axolotl.png",desc:"Pink Axolotl усиливает оборонительные постройки команды: турели и шипы наносят на 35% больше урона. Когда здоровье владельца опускается ниже 80%, аксолотль восстанавливает 18% от максимального здоровья.",stats:["Турели и шипы: +35% урона","Лечение: 18% от максимального HP · перезарядка 20 сек"]},
  duck:{name:"Ducktive",rarity:"legendary",chance:3,img:"assets/pets/duck.png",desc:"Ducktive раз в 30 секунд стреляет в ближайшего обычного врага и снимает 45% его текущего здоровья, но этим выстрелом не может добить цель. Когда здоровье игрока ниже 75%, Ducktive восстанавливает 20% от максимального здоровья раз в 60 секунд.",stats:["Пистолет: снимает 45% текущего HP, не добивает · перезарядка 30 сек","Лечение: 20% от максимального HP · перезарядка 60 сек"]},
  amethyst_fury:{name:"Amethyst Fury",rarity:"secret",chance:1,img:"assets/pets/amethyst_fury.png",desc:"Amethyst Fury усиливает урон любого оружия на 35%, автоматически ремонтирует повреждённую базу раз в 30 секунд и каждые 10 секунд атакует ближайшего врага аметистовым лучом. Против босса используется отдельная ослабленная версия луча.",stats:["Любое оружие: +35% урона","Ремонт базы: 7% от максимального HP · перезарядка 30 сек","Аметистовый луч · перезарядка 10 сек"]}
};
const petRarityChanceText="COMMON 50% · UNCOMMON 28% · RARE 12% · EPIC 6% · LEGENDARY 3% · SECRET 1%";
const classUnlockCosts={starter:0,shooter:150,cqc:350,flame:700,soap:1200};
const weaponAmmoUi={pistol:{mag:12,reload:1.35},micro_uzi:{mag:30,reload:1.75},ump:{mag:25,reload:2.05},butterfly:{mag:-1,reload:0},fire_machete:{mag:-1,reload:0},bubble_blaster:{mag:12,reload:2.40}};
const RUN_SHOP_RADIUS=360;
const runShopInfo={
  micro_uzi:{cost:{wood:10,stone:0,scrap:70},waveHint:"4–5"},
  ump:{cost:{wood:18,stone:8,scrap:118},waveHint:"~9"},
  butterfly:{cost:{wood:18,stone:22,scrap:175},waveHint:"14–16"},
  fire_machete:{cost:{wood:28,stone:36,scrap:285},waveHint:"20–23"},
  bubble_blaster:{cost:{wood:50,stone:58,scrap:520},waveHint:"30+"},
  heal:{cost:{wood:0,stone:0,scrap:28}}
};

const metaShopInfo={
  prep_medkit:{name:"Экстренная аптечка",cost:18,desc:"Автоматически добавит +1 аптечку при старте следующего забега."},
  prep_scrap:{name:"Контейнер металла",cost:20,desc:"Автоматически добавит +45 металла при старте следующего забега."},
  prep_supply:{name:"Набор снабжения",cost:30,desc:"Автоматически добавит +18 дерева, +12 камня и +25 металла при старте следующего забега."},
  prep_damage:{name:"Боевой стимулятор",cost:44,desc:"Автоматически даст +10% урона на весь следующий забег."},
  prep_speed:{name:"Лёгкие ботинки",cost:36,desc:"Автоматически даст +7% скорости на весь следующий забег."}
};
const metaUpgradeInfo={
  backpack:{name:"Рюкзак снабжения",max:5,base:35,step:24,desc:"Каждый уровень добавляет стартовые дерево, камень и металл."},
  armor:{name:"Бронепластины",max:5,base:45,step:30,desc:"+5 максимального HP за уровень."},
  gather:{name:"Полевой инструмент",max:5,base:40,step:28,desc:"+5% эффективности добычи за уровень."},
  medkit:{name:"Медицинская полка",max:3,base:60,step:45,desc:"+1 стартовая аптечка за уровень."}
};
const achievementInfo={
  survive10:{name:"Ночной охотник",desc:"Пережить 10 волн",gold:45,title:"Ночной охотник"},
  bossHunter:{name:"Убийца титанов",desc:"Убить 3 боссов",gold:55,title:"Убийца титанов"},
  builder50:{name:"Инженер",desc:"Построить 50 объектов за всё время",gold:35,title:"Инженер"},
  orc1000:{name:"Зелёная катастрофа",desc:"Убить 1000 орков",gold:100,title:"Истребитель орков"},
  base80:{name:"Идеальная оборона",desc:"Пройти 5 волн, не опустив базу ниже 80% HP",gold:50,title:"Хранитель базы"},
  meleeBoss:{name:"Сталь против чудовища",desc:"Победить босса, нанося ему урон только ближним оружием",gold:70,title:"Мясник боссов"}
};
const petInfoEn={
  panda:{desc:"When the player's health drops below 35%, Panda restores 30% of maximum HP. The heal can trigger once every 40 seconds. Every 15 seconds Panda throws bamboo at up to three nearby enemies.",stats:["Heal: 30% max HP · 40 sec cooldown","Bamboo: up to 3 targets · 15 sec cooldown"]},
  cat:{desc:"When the player's health drops below 65%, Uiai Cat restores 20% of maximum HP. It can also execute up to two nearby normal enemies when they fall below 12% health.",stats:["Heal: 20% max HP · 30 sec cooldown","Executes enemies below 12% HP · 12 sec cooldown"]},
  red_dragon:{desc:"Every 10 seconds Red Dragon breathes fire at the nearest normal enemy and removes up to 30% of its current health. This attack does not affect bosses. While equipped, Fire Machete deals 20% more damage.",stats:["Fire attack: up to 30% current HP · 10 sec cooldown","Fire Machete: +20% damage"]},
  axolotl:{desc:"Pink Axolotl empowers the team's defenses: turrets and spikes deal 35% more damage. When the owner's health drops below 80%, it restores 18% of maximum HP.",stats:["Turrets and spikes: +35% damage","Heal: 18% max HP · 20 sec cooldown"]},
  duck:{desc:"Every 30 seconds Ducktive shoots the nearest normal enemy for 45% of its current health, but the shot cannot finish the target. Below 75% player health, Ducktive restores 20% of maximum HP once every 60 seconds.",stats:["Shot: removes 45% current HP, cannot execute · 30 sec cooldown","Heal: 20% max HP · 60 sec cooldown"]},
  amethyst_fury:{desc:"Amethyst Fury increases all weapon damage by 35%, repairs a damaged base every 30 seconds, and attacks the nearest enemy with an amethyst beam every 10 seconds. Bosses receive a weaker beam.",stats:["All weapons: +35% damage","Base repair: 7% max HP · 30 sec cooldown","Amethyst beam · 10 sec cooldown"]}
};
const metaShopInfoEn={
  prep_medkit:{name:"Emergency Medkit",desc:"Automatically adds +1 medkit at the start of the next run."},
  prep_scrap:{name:"Scrap Container",desc:"Automatically adds +45 scrap at the start of the next run."},
  prep_supply:{name:"Supply Pack",desc:"Automatically adds +18 wood, +12 stone and +25 scrap at the start of the next run."},
  prep_damage:{name:"Combat Stim",desc:"Automatically grants +10% damage for the entire next run."},
  prep_speed:{name:"Light Boots",desc:"Automatically grants +7% movement speed for the entire next run."}
};
const metaUpgradeInfoEn={backpack:{name:"Supply Backpack",desc:"Each level adds starting wood, stone and scrap."},armor:{name:"Armor Plates",desc:"+5 maximum HP per level."},gather:{name:"Field Tool",desc:"+5% gathering efficiency per level."},medkit:{name:"Medical Shelf",desc:"+1 starting medkit per level."}};
const achievementInfoEn={
  survive10:{name:"Night Hunter",desc:"Survive 10 waves",title:"Night Hunter"},bossHunter:{name:"Titan Slayer",desc:"Kill 3 bosses",title:"Titan Slayer"},builder50:{name:"Engineer",desc:"Build 50 structures in total",title:"Engineer"},orc1000:{name:"Green Catastrophe",desc:"Kill 1000 orcs",title:"Orc Exterminator"},base80:{name:"Perfect Defense",desc:"Clear 5 waves without the base dropping below 80% HP",title:"Base Guardian"},meleeBoss:{name:"Steel Against the Beast",desc:"Defeat a boss using melee damage only",title:"Boss Butcher"}
};
const questInfoEn={
  kills_25:{title:"Infected Hunt",desc:"Kill 25 zombies"},kills_45:{title:"Block Cleanup",desc:"Kill 45 zombies"},kills_70:{title:"Night Grinder",desc:"Kill 70 zombies"},kills_100:{title:"No Passage",desc:"Kill 100 zombies"},
  harvest_90:{title:"Shelter Supplies",desc:"Gather 90 resources"},harvest_140:{title:"Full Warehouses",desc:"Gather 140 resources"},harvest_200:{title:"Supply Expedition",desc:"Gather 200 resources"},harvest_280:{title:"Rainy-Day Stockpile",desc:"Gather 280 resources"},
  waves_2:{title:"First Watch",desc:"Survive 2 waves"},waves_4:{title:"Night Watch",desc:"Survive 4 waves"},waves_6:{title:"Until Dawn",desc:"Survive 6 waves"},waves_8:{title:"Unbreakable Shift",desc:"Survive 8 waves"},
  builds_5:{title:"Quick Defense",desc:"Build 5 structures"},builds_9:{title:"Defense Architect",desc:"Build 9 structures"},builds_14:{title:"Fortress Overnight",desc:"Build 14 structures"},builds_20:{title:"Engineering Marathon",desc:"Build 20 structures"}
};
const titleEn={"Новичок":"Rookie","Ночной охотник":"Night Hunter","Убийца титанов":"Titan Slayer","Инженер":"Engineer","Истребитель орков":"Orc Exterminator","Хранитель базы":"Base Guardian","Мясник боссов":"Boss Butcher"};
const titleRu=Object.fromEntries(Object.entries(titleEn).map(([ru,en])=>[en,ru]));
function displayTitle(raw){const v=String(raw||"Новичок");return isEn()?(titleEn[v]||v):(titleRu[v]||v);}
function localizedQuest(q){if(!isEn())return {title:q.title,desc:q.desc};const x=questInfoEn[q.id];if(x)return x;const n=q.target||0;return {title:"Field Assignment",desc:q.stat==="kills"?`Kill ${n} zombies`:q.stat==="harvest"?`Gather ${n} resources`:q.stat==="waves"?`Survive ${n} waves`:q.stat==="builds"?`Build ${n} structures`:String(q.desc||"")};}
const talentDefsEn={
  survivor_hp:{name:"Vitality",desc:"Increases maximum health."},survivor_speed:{name:"Endurance",desc:"Increases movement speed."},gun_damage:{name:"Gunsmith",desc:"Increases damage of all weapons."},gun_rate:{name:"Quick Hands",desc:"Increases fire rate and attack speed."},gather:{name:"Gatherer",desc:"Breaks resources faster and increases yield."},builder:{name:"Builder",desc:"New structures gain more durability."},medic:{name:"Field Medic",desc:"Revives a downed teammate faster."}
};

const catalogRu={
  buildLabel:{...buildLabel},buildDescriptions:{...buildDescriptions},rarityLabel:{...rarityLabel},weaponNames:{...weaponNames},classNames:{...classNames},zombieNames:{...zombieNames},
  pet:Object.fromEntries(Object.entries(petInfo).map(([k,v])=>[k,{desc:v.desc,stats:[...v.stats]}])),
  shop:Object.fromEntries(Object.entries(metaShopInfo).map(([k,v])=>[k,{name:v.name,desc:v.desc}])),
  upgrades:Object.fromEntries(Object.entries(metaUpgradeInfo).map(([k,v])=>[k,{name:v.name,desc:v.desc}])),
  achievements:Object.fromEntries(Object.entries(achievementInfo).map(([k,v])=>[k,{name:v.name,desc:v.desc,title:v.title}]))
};
function syncCatalogLanguage(){
  buildLabel={...(isEn()?buildLabelEn:catalogRu.buildLabel)};
  buildDescriptions={...(isEn()?buildDescriptionsEn:catalogRu.buildDescriptions)};
  rarityLabel={...(isEn()?rarityLabelEn:catalogRu.rarityLabel)};
  weaponNames={...(isEn()?weaponNamesEn:catalogRu.weaponNames)};
  classNames={...(isEn()?classNamesEn:catalogRu.classNames)};
  zombieNames={...(isEn()?zombieNamesEn:catalogRu.zombieNames)};
  for(const [id,cfg] of Object.entries(petInfo)){const src=isEn()?petInfoEn[id]:catalogRu.pet[id];cfg.desc=src.desc;cfg.stats=[...src.stats];}
  for(const [id,cfg] of Object.entries(metaShopInfo)){const src=isEn()?metaShopInfoEn[id]:catalogRu.shop[id];cfg.name=src.name;cfg.desc=src.desc;}
  for(const [id,cfg] of Object.entries(metaUpgradeInfo)){const src=isEn()?metaUpgradeInfoEn[id]:catalogRu.upgrades[id];cfg.name=src.name;cfg.desc=src.desc;}
  for(const [id,cfg] of Object.entries(achievementInfo)){const src=isEn()?achievementInfoEn[id]:catalogRu.achievements[id];cfg.name=src.name;cfg.desc=src.desc;cfg.title=src.title;}
}
syncCatalogLanguage();

const petImages={};
for(const [id,cfg] of Object.entries(petInfo)){
  const img=new Image();img.src=cfg.img;petImages[id]=img;
}
const bambooImg=new Image();bambooImg.src="assets/pets/bamboo.png";
const weaponAngleAdjust={};

const deathMemes={
  orc:[
    "Вас сожрал зелёный чубрик XD!!",
    "Зелёный чубрик посмотрел на вас и выбрал насилие.",
    "ОРК оформил вам бесплатный билет обратно в меню 💀",
    "ОРК сказал «сюда иди» — и вы зачем-то пошли.",
    "Вы проиграли спор существу, которое буквально зелёное.",
    "Чубрик оказался сильнее ваших планов на эту ночь."
  ],
  runner:[
    "Шустрик устроил speedrun вашей жизни. Новый рекорд: очень быстро.",
    "Красный мелкий засранец оказался быстрее реакции XD",
    "Шустрик: 1. Вы: 0. Клавиатура пока жива.",
    "Вы моргнули. Шустрик уже оформил килл.",
    "Маленький красный таракан победил эволюцию.",
    "Шустрик убежал дальше. Вы — уже нет."
  ],
  armored:[
    "Броневик перепутал вас со стеной и пошёл насквозь.",
    "Вы пытались спорить с холодильником на ногах. Зря.",
    "Броневик выдал вам принудительное техническое обслуживание.",
    "Броневик проверил вашу броню. Брони не обнаружено.",
    "Тяжёлая промышленность снова победила человека."
  ],
  spitter:[
    "Кислотник плюнул. Самое обидное поражение смены.",
    "Вас заплевали до меню классов. Буквально.",
    "Кислотник сказал «тьфу» — и этого хватило.",
    "Вы умерли от плевка. Об этом лучше никому не рассказывать.",
    "Кислотник попал ровно туда, где было ваше достоинство."
  ],
  bomber:[
    "Бомбер сказал «щас будет громко» 💥",
    "Вы слишком долго смотрели на мигающего толстяка XD",
    "Бомбер успешно доказал существование радиуса взрыва.",
    "Красивый был взрыв. Жаль, вы были внутри.",
    "Бомбер: «держи подарок». Подарок оказался последним."
  ],
  shaman:[
    "Шаман наколдовал вам экран смерти.",
    "Вы попали под древнее заклинание «иди в меню».",
    "Шаман провёл ритуал. Жертвой почему-то были вы.",
    "Магия существует. К сожалению, вы это проверили лично."
  ],
  titan:[
    "Титан вдавил вас в текстуру. Разработчик осуждает.",
    "Титан применил аргумент весом примерно в одну тонну.",
    "Титан сделал шаг. Под шагом оказались вы.",
    "Физика победила. Титан помог."
  ],
  leaper:["Прыгун решил, что лестница ему не нужна.","Прыгун сократил дистанцию быстрее, чем вы успели сказать «ой»."],
  shieldbearer:["Щитоносец доказал, что стрелять только спереди — плохой план.","Вы проиграли зомби, который принёс на драку дверь."],
  splitter:["Мутант распался. Ваш план — тоже.","Вы убили одного, а проблема почему-то стала больше."],
  hunter:["Охотник выбрал самой слабой целью именно вас. Неловко.","Охотник нашёл вас даже без миникарты."],
  sapper:["Подрывник внёс вас в смету на демонтаж.","Осадный заряд оказался убедительнее брони."],
  necromancer:["Некромант поднял всех, кроме вашего настроения.","Некромант отправил вас туда, откуда сам обычно возвращает зомби."],
  frost:["Ледяной замедлил вас до состояния скриншота.","Замёрзли. Потом умерли. Очень атмосферно."],
  parasite:["Паразит нашёл новую постройку. Ею оказались вы.","Мелкий паразит сделал большую проблему."],
  teleporter:["Телепортер появился там, где его вообще не ждали.","Телепорт — легально разрешённый скример."],
  abyssal:["Бездонный адаптировался к вашему плану быстрее вас.","Бездонный: «этот урон я уже видел». Экран смерти: «я тоже»."],
  boss_stone:["Каменный Громила оформил вам геологическую экспертизу.","Камень летел красиво. Финал — не очень."],
  boss_butcher:["Мясник наконец нашёл ингредиент для следующей смены.","Рывок Мясника оказался быстрее вашего отхода."],
  boss_plague:["Чумная Матка добавила вас в семейное древо заражённых.","Вы пережили детей Матки. Матку — нет."],
  boss_colossus:["Железный Колосс наступил на ваш стратегический план.","Колосс временно отключил турели. Вас — навсегда."],
  boss_shadow:["Повелитель Тьмы выключил свет и вашу смену.","Настоящий босс был за спиной. Конечно же."],
  boss_king:["Король Заражения официально завершил вашу кампанию.","До 50-й волны дошли. Через Короля — пока нет."],
  boss:[
    "БОСС объяснил, почему его зовут боссом.",
    "Начальник смены лично подписал ваше увольнение 💀",
    "Вы дошли до босса. Босс дошёл до вас быстрее.",
    "БОСС нажал кнопку «завершить забег»."
  ],
  core:[
    "Генератор сказал: «ребят, я всё».",
    "База закончилась раньше вашего оптимизма.",
    "Зомби оформили капитальный ремонт генератора. Без генератора.",
    "Генератор больше не генерирует. Вообще ничего."
  ],
  unknown:[
    "Что-то очень убедительное отправило вас в меню XD.",
    "Причина смерти засекречена. Результат — нет.",
    "Игра сказала «не сегодня»."
  ]
};

const deathMemesEn={
  orc:["The Orc won the argument. You are back in the menu.","A green brute ended your shift."],runner:["The Runner speedran your health bar.","You blinked. The Runner did not."],armored:["You challenged a walking refrigerator. It won."],spitter:["The Spitter sent you back to class selection with one very rude shot."],bomber:["The Bomber said it would be loud. It was."],shaman:["The Shaman cast Return to Menu."],titan:["The Titan won with approximately one ton of persuasion."],leaper:["The Leaper closed the gap before you could say run."],shieldbearer:["Shooting the shield from the front was not the winning plan."],splitter:["You killed one problem and got two smaller ones."],hunter:["The Hunter found the weakest target. Unfortunately, it was you."],sapper:["The Sapper added you to the demolition budget."],necromancer:["The Necromancer raised everyone except your chances."],frost:["Frozen, slowed, eliminated. Very atmospheric."],parasite:["A small parasite created a large problem."],teleporter:["The Teleporter appeared exactly where you did not want it."],abyssal:["The Abyssal adapted faster than your strategy."],boss_stone:["The Stone Brute completed a geological inspection on you."],boss_butcher:["The Butcher found the final ingredient."],boss_plague:["The Plague Mother expanded the family tree."],boss_colossus:["The Iron Colossus stepped on the strategy."],boss_shadow:["The Lord of Shadows turned off the lights and your shift."],boss_king:["The Infection King ended the campaign personally."],boss:["The boss explained why it is called a boss."],core:["The generator said: that is all.","The base ran out before your optimism did."],unknown:["Something extremely convincing sent you back to the menu."]
};

const zombieIndexData=[
  {id:"orc",name:"ОРК",stars:1,wave:1,hp:"64",dmg:"11",speed:"73",desc:"Базовый заражённый. Средние здоровье, скорость и урон.",special:"Без способностей."},
  {id:"runner",name:"ШУСТРИК",stars:2,wave:2,hp:"39",dmg:"7",speed:"115",desc:"Маленький быстрый враг.",special:"Быстро сокращает дистанцию, но имеет мало HP."},
  {id:"armored",name:"БРОНЕВИК",stars:3,wave:4,hp:"189",dmg:"20",speed:"51",desc:"Медленный тяжёлый зомби в броне.",special:"Получает меньше урона от пуль и больше от ближнего боя."},
  {id:"spitter",name:"КИСЛОТНИК",stars:3,wave:5,hp:"106",dmg:"12",speed:"62",desc:"Держит дистанцию.",special:"Плюёт кислотой по игрокам и обороне."},
  {id:"bomber",name:"БОМБЕР",stars:4,wave:6,hp:"143",dmg:"10",speed:"61",desc:"Взрывоопасный осадный враг.",special:"Готовит взрыв рядом с базой; смерть до детонации отменяет взрыв."},
  {id:"shaman",name:"ШАМАН",stars:4,wave:8,hp:"130",dmg:"10",speed:"59",desc:"Поддержка орды.",special:"Усиливает скорость и урон ближайших заражённых."},
  {id:"leaper",name:"ПРЫГУН",stars:3,wave:9,hp:"122",dmg:"16",speed:"91",desc:"Рывковый мобильный враг.",special:"Периодически совершает короткий прыжок к цели."},
  {id:"titan",name:"ТИТАН",stars:5,wave:10,hp:"900",dmg:"38",speed:"47",desc:"Редкий осадный монстр.",special:"Ломает постройки ударом по площади и отключает турели."},
  {id:"shieldbearer",name:"ЩИТОНОСЕЦ",stars:4,wave:11,hp:"286",dmg:"21",speed:"62",desc:"Тяжёлый защитник орды.",special:"Щит сильно снижает пулевой урон."},
  {id:"splitter",name:"МУТАНТ",stars:4,wave:13,hp:"219",dmg:"19",speed:"71",desc:"Нестабильная мутация.",special:"После смерти распадается на двух маленьких Шустриков."},
  {id:"hunter",name:"ОХОТНИК",stars:4,wave:16,hp:"202",dmg:"26",speed:"106",desc:"Ищет слабую цель.",special:"Старается преследовать игрока с самым низким процентом HP."},
  {id:"sapper",name:"ПОДРЫВНИК",stars:4,wave:18,hp:"262",dmg:"32",speed:"71",desc:"Осадный специалист.",special:"Бросает заряды в базу и постройки с дистанции."},
  {id:"necromancer",name:"НЕКРОМАНТ",stars:5,wave:22,hp:"333",dmg:"19",speed:"58",desc:"Опасная поддержка поздних волн.",special:"Периодически призывает ослабленных Орков."},
  {id:"frost",name:"ЛЕДЯНОЙ",stars:5,wave:26,hp:"435",dmg:"27",speed:"68",desc:"Замораживающий мутант.",special:"Удары замедляют игроков и временно отключают турели."},
  {id:"parasite",name:"ПАРАЗИТ",stars:5,wave:32,hp:"274",dmg:"19",speed:"110",desc:"Маленький враг построек.",special:"Цепляется к обороне, повреждает и временно глушит её."},
  {id:"teleporter",name:"ТЕЛЕПОРТЕР",stars:5,wave:38,hp:"487",dmg:"38",speed:"81",desc:"Мобильная поздняя мутация.",special:"Совершает короткие телепорты, но не телепортируется сквозь стены."},
  {id:"abyssal",name:"БЕЗДОННЫЙ",stars:5,wave:45,hp:"1500+",dmg:"58",speed:"66",desc:"Тяжёлый адаптивный заражённый.",special:"Получает сопротивление к типу урона, которым его постоянно атакуют."},
  {id:"boss_stone",name:"КАМЕННЫЙ ГРОМИЛА",stars:5,wave:5,hp:"2250+",dmg:"43+",speed:"50",desc:"Первый босс.",special:"Призывает Шустриков, бросает камни, в ярости ускоряется."},
  {id:"boss_butcher",name:"МЯСНИК",stars:5,wave:10,hp:"3750+",dmg:"59+",speed:"69",desc:"Босс ближнего боя.",special:"Рывки к слабому игроку и ярость во второй фазе."},
  {id:"boss_plague",name:"ЧУМНАЯ МАТКА",stars:5,wave:20,hp:"7100+",dmg:"60+",speed:"52",desc:"Босс-призыватель.",special:"Создаёт заражённых и кислотные атаки, вызывает Некромантов."},
  {id:"boss_colossus",name:"ЖЕЛЕЗНЫЙ КОЛОСС",stars:5,wave:30,hp:"11300+",dmg:"93+",speed:"44",desc:"Осадный босс.",special:"Сопротивляется пулям, глушит турели и бьёт по площади."},
  {id:"boss_shadow",name:"ПОВЕЛИТЕЛЬ ТЬМЫ",stars:5,wave:40,hp:"15300+",dmg:"108+",speed:"84",desc:"Мобильный магический босс.",special:"Телепортируется к слабой цели и вызывает Телепортеров."},
  {id:"boss_king",name:"КОРОЛЬ ЗАРАЖЕНИЯ",stars:5,wave:50,hp:"21700+",dmg:"140+",speed:"75",desc:"Финальный босс первой кампании.",special:"Несколько фаз, призыв армии, элитные подкрепления и ярость."}
];
const zombieIndexEn={
  orc:["Basic infected with balanced health, speed and damage.","No special ability."],runner:["Small and very fast enemy.","Closes distance quickly, but has low HP."],armored:["Slow heavy zombie in armor.","Takes reduced bullet damage and increased melee damage."],spitter:["Keeps its distance.","Spits acid at players and defenses."],bomber:["Explosive siege enemy.","Prepares an explosion near the base; killing it before detonation cancels the blast."],shaman:["Horde support unit.","Boosts movement speed and damage of nearby infected."],leaper:["Mobile burst enemy.","Periodically performs a short leap toward its target."],titan:["Rare siege monster.","Smashes structures in an area and temporarily disables turrets."],shieldbearer:["Heavy horde protector.","Its shield greatly reduces bullet damage."],splitter:["Unstable mutation.","Splits into two small Runners when killed."],hunter:["Seeks weak targets.","Tries to chase the player with the lowest percentage of HP."],sapper:["Siege specialist.","Throws charges at the base and structures from range."],necromancer:["Dangerous late-wave support unit.","Periodically summons weakened Orcs."],frost:["Freezing mutant.","Hits slow players and temporarily disable turrets."],parasite:["Small structure hunter.","Latches onto defenses, damages and temporarily jams them."],teleporter:["Mobile late-game mutation.","Performs short teleports but cannot teleport through walls."],abyssal:["Heavy adaptive infected.","Develops resistance to the damage type used against it repeatedly."],boss_stone:["The first boss.","Summons Runners, throws rocks and speeds up in rage."],boss_butcher:["Melee boss.","Charges weak players and enters rage in its second phase."],boss_plague:["Summoner boss.","Creates infected, uses acid attacks and summons Necromancers."],boss_colossus:["Siege boss.","Resists bullets, jams turrets and uses area slams."],boss_shadow:["Mobile magical boss.","Teleports to weak targets and summons Teleporters."],boss_king:["Final boss of the first campaign.","Multiple phases, army summons, elite reinforcements and rage."]
};

const mouse={x:0,y:0,down:false,wx:0,wy:0},keys=new Set(),camera={x:0,y:0};
const smoothPlayers=new Map(),smoothZombies=new Map();
let localPred=null,lastFrameTime=performance.now();
let fpsSampleStart=performance.now(),fpsFrames=0,currentFps=0,currentPing=null;
const browserProfileId=(()=>{
  let v=storageGet("night_shift_duo_profile_v1");
  if(!v){
    v="p_"+Math.random().toString(36).slice(2,10)+"_"+Date.now().toString(36);
    storageSet("night_shift_duo_profile_v1",v);
  }
  return v;
})();
let lastTalentSig="",lastContextSig="",lastAffordSig="",lastUiUpdate=0;
let hoverStructureId=null;
let talentCollapsed=true;
let deathScreenHiddenWhileDown=false;
let unlockTimer=null;
let gameOverActive=false;

let nearCorePreviously=false;
let baseHintUntil=0;

const settingsKey="night_shift_duo_settings_v502";
const sessionKey="night_shift_duo_session_v1";
let settings={audioEnabled:true,sfxVolume:34,ambientVolume:18,footsteps:true,adminVisible:true,performanceHud:true};
try{settings={...settings,...JSON.parse(storageGet(settingsKey)||"null")};}catch{}
function saveSettings(){storageSet(settingsKey,JSON.stringify(settings))}
const sfxPaths={
  gun:"assets/sfx/gunshot.wav",uzi:"assets/sfx/uzi.wav",ump:"assets/sfx/ump.wav",smg:"assets/sfx/smg.wav",
  bubble:"assets/sfx/bubble.wav",swing:"assets/sfx/swing.wav",harvest:"assets/sfx/harvest.wav",build:"assets/sfx/build.wav",
  step:"assets/sfx/step.wav",zombie:"assets/sfx/hit.wav",heal:"assets/sfx/heal.wav",day:"assets/sfx/day.wav",night:"assets/sfx/night.wav",
  ui:"assets/sfx/ui.wav",coin:"assets/sfx/coin.wav",crate:"assets/sfx/crate.wav",reload:"assets/sfx/reload.wav",
  bossSlam:"assets/sfx/boss_slam.wav",bossRock:"assets/sfx/boss_rock.wav",bamboo:"assets/sfx/bamboo.wav",laser:"assets/sfx/laser.wav"
};
const sfxBase={};
for(const [k,src] of Object.entries(sfxPaths)){const a=new Audio(src);a.preload="auto";sfxBase[k]=a;}
function playSfx(kind,ambient=false){
  if(!settings.audioEnabled)return;
  const base=sfxBase[kind];if(!base)return;
  const a=base.cloneNode();
  let volume=Math.max(0,Math.min(1,(ambient?settings.ambientVolume:settings.sfxVolume)/100));
  // Tiny natural variations stop footsteps and automatic fire from sounding like the exact same sample pasted repeatedly.
  if(kind==="step"){a.playbackRate=.92+Math.random()*.16;volume*=.72+Math.random()*.16;}
  else if(["gun","uzi","ump"].includes(kind)){a.playbackRate=.97+Math.random()*.06;volume*=.94+Math.random()*.06;}
  a.volume=Math.max(0,Math.min(1,volume));
  a.play().catch(()=>{});
}
function ambientCue(phase){playSfx(phase==="night"?"night":"day",true);}
function gameplayUiBlocked(){return lobby.classList.contains("visible")||deathOverlay.classList.contains("visible")||indexOverlay.classList.contains("visible")||petOverlay.classList.contains("visible")||crateOverlay.classList.contains("visible")||pauseOverlay.classList.contains("visible")||lobbyMetaOverlay.classList.contains("visible")||runShopOverlay.classList.contains("visible")||runUpgradeOverlay.classList.contains("visible")||exitConfirmOverlay.classList.contains("visible")||structureMenuOverlay.classList.contains("visible");}

storageRemove("night_shift_duo_bestiary_v1")
let discoveredEnemies={};

let lastSnapshotAt=performance.now();
let previousOwnHp=null,previousCoreHp=null;
let toolSwingStart=-9999;
let toolSwingTargetId=null;
let lastLocalShotFx=-9999;
let muzzleFlashUntil=0;
const resourceShake=new Map();
const harvestParticles=[];
const damageFloats=[];
const previousZombieHp=new Map();
const zombieHitFlashUntil=new Map();
const movementDust=[];
let renderShakeX=0,renderShakeY=0,screenShakeUntil=0,screenShakePower=0,lastDustSpawn=0;
const seenEffectSfx=new Set();
function trackWorldSfx(nextState){
  const effects=nextState?.effects||[];
  const alive=new Set();
  for(const e of effects){
    if(!e||e.id==null)continue;
    alive.add(e.id);
    if(seenEffectSfx.has(e.id))continue;
    seenEffectSfx.add(e.id);
    if(["slam","bossPulse","cursedBurst"].includes(e.type)){playSfx("bossSlam");screenShakeUntil=Math.max(screenShakeUntil,performance.now()+260);screenShakePower=Math.max(screenShakePower,e.type==="slam"?8:5);}
    if(["bossRock","sapperCharge"].includes(e.type))playSfx("bossRock");
    if(["explosion","bossRockImpact","cannonImpact"].includes(e.type)){screenShakeUntil=Math.max(screenShakeUntil,performance.now()+180);screenShakePower=Math.max(screenShakePower,e.type==="explosion"?6:3.5);}
    if(e.type==="bamboo")playSfx("bamboo");
    if(["amethystBeam","amethystRepair","legendaryChain"].includes(e.type))playSfx("laser");
    if(e.type==="dragonFire")playSfx("bossRock");
    if(e.type==="duckShot")playSfx("gun");
    if(e.type==="catPounce")playSfx("swing");
  }
  // Keep the set bounded; all entity/effect ids are unique and old ids are never reused.
  if(seenEffectSfx.size>5000){
    const keep=[...seenEffectSfx].slice(-1800);
    seenEffectSfx.clear();for(const id of keep)seenEffectSfx.add(id);
  }
}

const weaponRateMs={pistol:290,micro_uzi:75,ump:135,butterfly:340,fire_machete:560,bubble_blaster:160};

function fit(){
  const dpr=Math.min(1.5,devicePixelRatio||1);
  canvas.width=Math.floor(innerWidth*dpr);canvas.height=Math.floor(innerHeight*dpr);
  canvas.style.width=innerWidth+"px";canvas.style.height=innerHeight+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
addEventListener("resize",fit);fit();

function send(type,data={}){if(ws&&ws.readyState===1)ws.send(JSON.stringify({type,...data}))}
function toast(text){
  notice.textContent=text;notice.classList.add("visible");
  clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>notice.classList.remove("visible"),1800);
}
function showLevelUp(m){
  const gained=Math.max(1,Number(m.levelsGained)||1);
  notice.textContent=T(`⬆ УРОВЕНЬ ${m.level}! +${gained} очко навыка`,`⬆ LEVEL ${m.level}! +${gained} skill point`);
  notice.classList.add("visible","level-up");
  clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>notice.classList.remove("visible","level-up"),3800);
  talentDock?.classList.add("attention");playSfx("coin");
}
function updateMetaAttention(){
  const quests=metaState?.quests||[],ach=metaState?.achievements||{};
  const questReady=quests.some(q=>!q.claimed&&Number(q.progress)>=Number(q.target));
  const achievementReady=Object.values(ach).some(v=>Number(v)===1);
  document.querySelector('#lobbyMetaNav [data-lobby-pane="quests"]')?.classList.toggle("attention",questReady);
  document.querySelector('#lobbyMetaNav [data-lobby-pane="achievements"]')?.classList.toggle("attention",achievementReady);
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
const floorThemes=[
  {name:"Двор убежища",nameEn:"Shelter Yard",base:"#101716",grid:"rgba(100,130,112,.07)",accentA:"#294238",accentB:"#2e3b38",hud:"#8ddda6",pattern:"yard"},
  {name:"Каменный двор",nameEn:"Stone Courtyard",base:"#16181c",grid:"rgba(150,156,173,.10)",accentA:"#323943",accentB:"#232930",hud:"#c7d2da",pattern:"stone"},
  {name:"Токсичный сектор",nameEn:"Toxic Sector",base:"#101913",grid:"rgba(115,170,92,.09)",accentA:"#20422a",accentB:"#16261b",hud:"#93e27d",pattern:"toxic"},
  {name:"Ледяной наст",nameEn:"Frozen Floor",base:"#111a20",grid:"rgba(158,219,255,.10)",accentA:"#264253",accentB:"#15252f",hud:"#aee5ff",pattern:"frost"},
  {name:"Лавовые трещины",nameEn:"Lava Cracks",base:"#1c1310",grid:"rgba(255,142,86,.10)",accentA:"#5d2718",accentB:"#2b1612",hud:"#ffaf7d",pattern:"lava"},
  {name:"Рунический круг",nameEn:"Runic Ring",base:"#14111d",grid:"rgba(155,120,255,.09)",accentA:"#362658",accentB:"#1d1830",hud:"#c9a8ff",pattern:"arcane"},
  {name:"Теневой разлом",nameEn:"Shadow Rift",base:"#0e1016",grid:"rgba(114,123,167,.08)",accentA:"#212536",accentB:"#161923",hud:"#b5bde9",pattern:"shadow"},
  {name:"Костяная пустошь",nameEn:"Bone Wasteland",base:"#191816",grid:"rgba(201,190,155,.08)",accentA:"#4b473c",accentB:"#27251f",hud:"#e2d6ab",pattern:"bones"},
  {name:"Бездна пустоты",nameEn:"Void Grid",base:"#0b0d13",grid:"rgba(82,143,255,.11)",accentA:"#172339",accentB:"#0f1524",hud:"#89b6ff",pattern:"void"},
  {name:"Трон заражения",nameEn:"Infection Throne",base:"#18120f",grid:"rgba(228,186,87,.12)",accentA:"#5c4520",accentB:"#2d2216",hud:"#f0d179",pattern:"throne"}
];
function floorStageForWave(w){
  const wave=Math.max(0,Math.min(50,Number(w)||0));
  return Math.max(0,Math.min(floorThemes.length-1,Math.floor(Math.max(0,wave-1)/5)));
}
function currentFloorTheme(){return floorThemes[state?.floorStage??floorStageForWave(state?.wave||0)]||floorThemes[0]}
function currentFloorName(){const f=currentFloorTheme();return isEn()?f.nameEn:f.name}
function announceFloorTransition(){
  if(!state)return;
  const stage=state?.floorStage??floorStageForWave(state.wave||0);
  if(lastFloorStageSeen<0){lastFloorStageSeen=stage;return;}
  if(stage!==lastFloorStageSeen){
    lastFloorStageSeen=stage;
    const name=isEn()?floorThemes[stage].nameEn:floorThemes[stage].name;
    toast(T(`Новый пол: ${name}`,`New floor: ${name}`));
  }
}
function floorThemeLighting(){
  const pattern=currentFloorTheme().pattern;
  if(pattern==="yard")return {day:"rgba(72,116,94,.05)",night:"rgba(45,86,73,.11)",vignette:"rgba(8,18,14,.06)"};
  if(pattern==="stone")return {day:"rgba(126,136,153,.06)",night:"rgba(80,90,118,.10)",vignette:"rgba(12,14,22,.08)"};
  if(pattern==="forge")return {day:"rgba(175,100,42,.08)",night:"rgba(255,130,54,.14)",vignette:"rgba(34,16,8,.11)"};
  if(pattern==="toxic")return {day:"rgba(87,145,58,.07)",night:"rgba(122,191,64,.13)",vignette:"rgba(12,28,10,.10)"};
  if(pattern==="frost")return {day:"rgba(108,186,225,.07)",night:"rgba(142,218,255,.12)",vignette:"rgba(8,22,30,.10)"};
  if(pattern==="lava")return {day:"rgba(190,84,44,.08)",night:"rgba(255,103,38,.14)",vignette:"rgba(34,14,8,.12)"};
  if(pattern==="arcane")return {day:"rgba(126,86,205,.07)",night:"rgba(166,119,255,.12)",vignette:"rgba(16,10,28,.11)"};
  if(pattern==="shadow")return {day:"rgba(82,88,136,.05)",night:"rgba(122,112,190,.10)",vignette:"rgba(8,8,18,.16)"};
  if(pattern==="bones")return {day:"rgba(165,146,92,.07)",night:"rgba(208,189,132,.11)",vignette:"rgba(20,18,12,.12)"};
  if(pattern==="void")return {day:"rgba(68,114,225,.07)",night:"rgba(74,154,255,.13)",vignette:"rgba(6,10,24,.16)"};
  return {day:"rgba(184,146,62,.07)",night:"rgba(255,204,102,.13)",vignette:"rgba(20,16,8,.13)"};
}
function getFloorDecor(){
  return [];
}
function drawFloorProp(kind,sx,sy,pulse=0){
  ctx.save();ctx.translate(sx,sy);
  if(kind==="bush"){
    ctx.fillStyle="#30503f";ctx.beginPath();ctx.arc(-10,4,12,0,Math.PI*2);ctx.arc(5,-1,14,0,Math.PI*2);ctx.arc(16,5,10,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#49624e";ctx.fillRect(-3,10,6,12);
  }else if(kind==="pillar"){
    ctx.fillStyle="#5f676f";ctx.fillRect(-12,-16,24,40);ctx.fillStyle="#7f8991";ctx.fillRect(-15,-20,30,7);ctx.fillRect(-15,19,30,7);
  }else if(kind==="crate"){
    ctx.fillStyle="#6f5436";ctx.fillRect(-18,-14,36,28);ctx.strokeStyle="#cfa867";ctx.lineWidth=2;ctx.strokeRect(-18,-14,36,28);ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(18,0);ctx.stroke();
  }else if(kind==="brazier"){
    ctx.fillStyle="#6c5946";ctx.fillRect(-12,2,24,14);ctx.strokeStyle="#23282b";ctx.strokeRect(-12,2,24,14);ctx.fillStyle=`rgba(255,180,80,${.75+.2*pulse})`;ctx.beginPath();ctx.arc(0,-2,9,0,Math.PI*2);ctx.fill();
  }else if(kind==="barrel"){
    ctx.fillStyle="#4b6d2b";ctx.fillRect(-14,-18,28,36);ctx.strokeStyle="#c6f08f";ctx.strokeRect(-14,-18,28,36);ctx.fillStyle=`rgba(170,255,120,${.30+.18*pulse})`;ctx.beginPath();ctx.arc(0,-4,6,0,Math.PI*2);ctx.fill();
  }else if(kind==="crystal"){
    ctx.fillStyle="#7dd8ff";ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(13,-4);ctx.lineTo(7,20);ctx.lineTo(-7,20);ctx.lineTo(-13,-4);ctx.closePath();ctx.fill();ctx.strokeStyle="#dbf7ff";ctx.stroke();
  }else if(kind==="lava"){
    ctx.fillStyle="#332019";ctx.beginPath();ctx.ellipse(0,8,24,14,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=`rgba(255,128,72,${.55+.18*pulse})`;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-18,4);ctx.lineTo(-6,12);ctx.lineTo(6,2);ctx.lineTo(18,11);ctx.stroke();
  }else if(kind==="obelisk"){
    ctx.fillStyle="#352b52";ctx.beginPath();ctx.moveTo(0,-24);ctx.lineTo(14,-2);ctx.lineTo(10,24);ctx.lineTo(-10,24);ctx.lineTo(-14,-2);ctx.closePath();ctx.fill();ctx.strokeStyle="#c5a7ff";ctx.stroke();
  }else if(kind==="bones"){
    ctx.fillStyle="#d8cc9c";ctx.fillRect(-18,-4,36,8);ctx.fillRect(-4,-18,8,36);for(const [x,y] of [[-18,0],[18,0],[0,-18],[0,18]]){ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fill();}
  }else if(kind==="void"){
    ctx.strokeStyle="#77a8ff";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(18,-8);ctx.lineTo(18,8);ctx.lineTo(0,20);ctx.lineTo(-18,8);ctx.lineTo(-18,-8);ctx.closePath();ctx.stroke();ctx.fillStyle=`rgba(95,145,255,${.24+.12*pulse})`;ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.fill();
  }else if(kind==="banner"){
    ctx.fillStyle="#705322";ctx.fillRect(-3,-24,6,48);ctx.fillStyle="#e6c36b";ctx.fillRect(3,-22,22,16);ctx.strokeStyle="#987436";ctx.strokeRect(3,-22,22,16);
  }else if(kind==="throne"){
    ctx.fillStyle="#5a431d";ctx.fillRect(-18,-8,36,28);ctx.fillStyle="#d6b15f";ctx.fillRect(-12,-24,24,18);ctx.strokeStyle="#f3d27a";ctx.lineWidth=2;ctx.strokeRect(-18,-8,36,28);ctx.strokeRect(-12,-24,24,18);
  }else if(kind==="cart"){
    ctx.fillStyle="#6e5536";ctx.fillRect(-20,-10,40,20);ctx.fillStyle="#8e959c";for(const x of [-14,14]){ctx.beginPath();ctx.arc(x,14,7,0,Math.PI*2);ctx.fill();}
  }else if(kind==="sigil"){
    ctx.strokeStyle="#c69cff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(15,9);ctx.lineTo(-15,9);ctx.closePath();ctx.stroke();
  }else if(kind==="totem"){
    ctx.fillStyle="#544332";ctx.fillRect(-8,-22,16,44);ctx.fillStyle="#8dd9bf";ctx.beginPath();ctx.arc(0,-14,7,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill();
  }else if(kind==="altar"){
    ctx.fillStyle="#454d62";ctx.fillRect(-18,-12,36,24);ctx.strokeStyle="#f0d179";ctx.lineWidth=2;ctx.strokeRect(-18,-12,36,24);ctx.beginPath();ctx.arc(0,0,8+2*pulse,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
}
function drawFloorDecor(){
  const items=getFloorDecor(),tm=performance.now()*0.0035;
  for(let i=0;i<items.length;i++){
    const d=items[i];
    if(!vis(d.x,d.y,80))continue;
    const s=sc(d.x,d.y),pulse=.5+.5*Math.sin(tm+i*.8);
    shadow(s.x,s.y+18,26,9,.12+.03*pulse);
    drawFloorProp(d.kind,s.x,s.y,pulse);
  }
}
function drawFloorAtmosphere(){
  const light=floorThemeLighting();
  ctx.save();
  ctx.fillStyle=state.phase==="night"?light.night:light.day;
  ctx.fillRect(0,0,innerWidth,innerHeight);
  const vg=ctx.createRadialGradient(innerWidth/2,innerHeight/2,80,innerWidth/2,innerHeight/2,Math.max(innerWidth,innerHeight)*.85);
  vg.addColorStop(0,'rgba(0,0,0,0)');
  vg.addColorStop(1,light.vignette);
  ctx.fillStyle=vg;ctx.fillRect(0,0,innerWidth,innerHeight);
  const theme=currentFloorTheme().pattern,now=performance.now()*0.001;
  for(let i=0;i<14;i++){
    const x=(i*141+now*24*(i%2?1:-1))% (innerWidth+120)-60;
    const y=(i*97+now*18*(i%3?1:-1))% (innerHeight+120)-60;
    if(theme==="forge"||theme==="lava"){
      ctx.fillStyle=`rgba(255,${theme==="lava"?130:180},80,${theme==="lava"?.16:.12})`;ctx.beginPath();ctx.arc(x,y,2+(i%3),0,Math.PI*2);ctx.fill();
    }else if(theme==="toxic"){
      ctx.strokeStyle='rgba(164,255,122,.12)';ctx.beginPath();ctx.arc(x,y,4+(i%4),0,Math.PI*2);ctx.stroke();
    }else if(theme==="frost"){
      ctx.strokeStyle='rgba(210,248,255,.16)';ctx.beginPath();ctx.moveTo(x-4,y);ctx.lineTo(x+4,y);ctx.moveTo(x,y-4);ctx.lineTo(x,y+4);ctx.stroke();
    }else if(theme==="arcane"||theme==="void"){
      ctx.fillStyle=`rgba(${theme==="void"?'118,170,255':'205,155,255'},.14)`;
      ctx.fillRect(x,y,3,3);
    }else if(theme==="shadow"){
      ctx.fillStyle='rgba(124,111,196,.08)';ctx.beginPath();ctx.arc(x,y,8+(i%4),0,Math.PI*2);ctx.fill();
    }else if(theme==="bones"||theme==="throne"){
      ctx.fillStyle=`rgba(${theme==="throne"?'255,214,125':'220,210,170'},.10)`;ctx.beginPath();ctx.arc(x,y,2+(i%3),0,Math.PI*2);ctx.fill();
    }
  }
  ctx.restore();
}
function drawThemeZombieFX(z,screen,t,specialPulse){
  const theme=currentFloorTheme().pattern;
  ctx.save();
  if(theme==="yard"){
    ctx.strokeStyle=`rgba(118,170,132,${.10+.06*specialPulse})`;ctx.beginPath();ctx.arc(0,z.r*1.08,z.r*.55,0,Math.PI*2);ctx.stroke();
  }else if(theme==="stone"){
    ctx.strokeStyle=`rgba(198,210,228,${.12+.06*specialPulse})`;ctx.setLineDash([4,5]);ctx.beginPath();ctx.arc(0,0,z.r+6+specialPulse*3,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  }else if(theme==="forge"){
    ctx.fillStyle=`rgba(255,186,104,${.18+.08*specialPulse})`;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(-8+i*8,-z.r-4-i*2,2+i*.8,0,Math.PI*2);ctx.fill();}
  }else if(theme==="toxic"){
    ctx.strokeStyle=`rgba(154,255,130,${.18+.08*specialPulse})`;ctx.beginPath();ctx.arc(0,-z.r*.2,z.r*.42+specialPulse*4,0,Math.PI*2);ctx.stroke();
  }else if(theme==="frost"){
    ctx.strokeStyle=`rgba(205,246,255,${.18+.08*specialPulse})`;for(let i=0;i<3;i++){const a=t*1.2+i*Math.PI*2/3;ctx.beginPath();ctx.moveTo(Math.cos(a)*(z.r+3),Math.sin(a)*(z.r+3));ctx.lineTo(Math.cos(a)*(z.r+11),Math.sin(a)*(z.r+11));ctx.stroke();}
  }else if(theme==="lava"){
    ctx.strokeStyle=`rgba(255,126,74,${.18+.08*specialPulse})`;ctx.beginPath();ctx.arc(0,0,z.r+8+specialPulse*4,.4,Math.PI-.4);ctx.stroke();
  }else if(theme==="arcane"){
    ctx.strokeStyle=`rgba(210,164,255,${.18+.08*specialPulse})`;ctx.beginPath();ctx.arc(0,0,z.r+7,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(0,-z.r-12);ctx.lineTo(8,-z.r-4);ctx.lineTo(-8,-z.r-4);ctx.closePath();ctx.stroke();
  }else if(theme==="shadow"){
    ctx.fillStyle=`rgba(116,102,188,${.10+.06*specialPulse})`;ctx.beginPath();ctx.arc(-z.r*.6,0,8,0,Math.PI*2);ctx.arc(z.r*.6,6,6,0,Math.PI*2);ctx.fill();
  }else if(theme==="bones"){
    ctx.strokeStyle=`rgba(226,216,178,${.18+.08*specialPulse})`;ctx.beginPath();ctx.moveTo(-8,z.r+6);ctx.lineTo(8,z.r+6);ctx.moveTo(0,z.r-2);ctx.lineTo(0,z.r+14);ctx.stroke();
  }else if(theme==="void"){
    ctx.strokeStyle=`rgba(112,172,255,${.20+.08*specialPulse})`;ctx.beginPath();ctx.moveTo(0,-z.r-10);ctx.lineTo(8,-z.r-2);ctx.lineTo(0,z.r+10);ctx.lineTo(-8,-z.r-2);ctx.closePath();ctx.stroke();
  }else if(theme==="throne"){
    ctx.strokeStyle=`rgba(255,220,122,${.20+.08*specialPulse})`;ctx.beginPath();ctx.arc(0,0,z.r+9+specialPulse*2,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
}

function drawZombieFloorAffixFX(z,t,specialPulse){
  if(!z.floorAffix)return;
  if(z.floorAffix==="toxic"){
    ctx.strokeStyle=`rgba(145,255,116,${.18+.10*specialPulse})`;ctx.beginPath();ctx.arc(0,z.r*.58,z.r*.72,0,Math.PI*2);ctx.stroke();
  }else if(z.floorAffix==="frost"){
    ctx.strokeStyle=`rgba(204,245,255,${.18+.10*specialPulse})`;for(let i=0;i<4;i++){const a=t*1.2+i*Math.PI/2;ctx.beginPath();ctx.moveTo(Math.cos(a)*(z.r+2),Math.sin(a)*(z.r+2));ctx.lineTo(Math.cos(a)*(z.r+10),Math.sin(a)*(z.r+10));ctx.stroke();}
  }else if(z.floorAffix==="lava"){
    ctx.fillStyle=`rgba(255,135,72,${.18+.10*specialPulse})`;ctx.beginPath();ctx.arc(0,0,z.r+6+specialPulse*2,0,Math.PI*2);ctx.fill();
  }else if(z.floorAffix==="arcane"){
    ctx.strokeStyle=`rgba(209,162,255,${.18+.10*specialPulse})`;ctx.beginPath();ctx.arc(0,0,z.r+8+specialPulse*2,0,Math.PI*2);ctx.stroke();
  }else if(z.floorAffix==="royal"){
    ctx.strokeStyle=`rgba(255,219,116,${.22+.10*specialPulse})`;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,z.r+10+specialPulse*2,0,Math.PI*2);ctx.stroke();
  }
}

function pushCombatLog(text,tone="system"){
  const clean=String(text||"").trim();if(!clean)return;
  // Keep the combat log readable: recurring dawn/wave notices replace their old copy instead of spamming the panel.
  const duplicateIndex=combatLog.findIndex(x=>x.text===clean);
  if(duplicateIndex>=0)combatLog.splice(duplicateIndex,1);
  combatLog.push({text:clean,tone});if(combatLog.length>5)combatLog.shift();
  if(combatLogPanel){combatLogPanel.innerHTML=combatLog.map(x=>`<div class="log-${x.tone}">${esc(x.text)}</div>`).join("");combatLogPanel.scrollTop=combatLogPanel.scrollHeight;}
}
function clearCombatLog(){combatLog=[];lastLoggedEventText="";if(combatLogPanel)combatLogPanel.innerHTML="";}

function myPlayer(){return state?.players?.find(p=>p.id===myId)}
function norm(x,y){const l=Math.hypot(x,y)||1;return{x:x/l,y:y/l}}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function sc(x,y){return{x:x-camera.x+renderShakeX,y:y-camera.y+renderShakeY}}
function vis(x,y,p=130){return x>camera.x-p&&y>camera.y-p&&x<camera.x+innerWidth+p&&y<camera.y+innerHeight+p}
function bar(x,y,w,h,r,c){ctx.fillStyle="rgba(0,0,0,.62)";ctx.fillRect(x,y,w,h);ctx.fillStyle=c;ctx.fillRect(x,y,w*clamp(r,0,1),h)}
function rr(x,y,w,h,r=16){const rad=Math.max(0,Math.min(Math.abs(Number(r)||0),Math.abs(w)/2,Math.abs(h)/2));ctx.beginPath();ctx.moveTo(x+rad,y);ctx.lineTo(x+w-rad,y);ctx.quadraticCurveTo(x+w,y,x+w,y+rad);ctx.lineTo(x+w,y+h-rad);ctx.quadraticCurveTo(x+w,y+h,x+w-rad,y+h);ctx.lineTo(x+rad,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-rad);ctx.lineTo(x,y+rad);ctx.quadraticCurveTo(x,y,x+rad,y);ctx.closePath();}
function hudPanel(x,y,w,h,{fill='rgba(6,10,13,.86)',stroke='rgba(164,198,255,.12)',glow='rgba(0,0,0,.22)'}={}){ctx.save();ctx.shadowColor=glow;ctx.shadowBlur=18;ctx.fillStyle=fill;rr(x,y,w,h,16);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=stroke;ctx.lineWidth=1.4;rr(x+.5,y+.5,w-1,h-1,16);ctx.stroke();ctx.restore();}
function hudBar(x,y,w,h,value,fill,bg='rgba(0,0,0,.55)'){ctx.fillStyle=bg;rr(x,y,w,h,999);ctx.fill();ctx.fillStyle=fill;const ww=Math.max(0,Math.min(1,value))*w;if(ww>0){rr(x,y,ww,h,999);ctx.fill();}}
function drawHudAvatar(x,y,size,p,accent='#ffb774'){ctx.save();ctx.fillStyle='rgba(11,15,18,.95)';ctx.beginPath();ctx.arc(x,y,size/2,0,Math.PI*2);ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='rgba(255,196,128,.32)';ctx.stroke();ctx.fillStyle='#d8aa83';ctx.beginPath();ctx.arc(x,y-size*.12,size*.19,0,Math.PI*2);ctx.fill();ctx.fillStyle='#5b3a2a';ctx.beginPath();ctx.arc(x,y-size*.18,size*.2,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle='#2a3238';ctx.fillRect(x-size*.24,y+size*.02,size*.48,size*.24);ctx.restore();const lvl=(p.level||1);ctx.fillStyle='rgba(7,11,14,.98)';ctx.beginPath();ctx.arc(x-size*.42,y+size*.42,size*.18,0,Math.PI*2);ctx.fill();ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#f1f5f7';ctx.font='900 11px system-ui';ctx.textAlign='center';ctx.fillText(String(lvl),x-size*.42,y+size*.46);ctx.textAlign='left';}
function shadow(x,y,rx,ry,a=.25){ctx.fillStyle=`rgba(0,0,0,${a})`;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
function costText(c){return `🪵 ${c.wood||0}  🪨 ${c.stone||0}  ⚙ ${c.scrap||0}`}

function isTypingInUi(el=document.activeElement){
  return !!el && (
    el.tagName==="INPUT" ||
    el.tagName==="TEXTAREA" ||
    el.tagName==="SELECT" ||
    el.isContentEditable
  );
}

function stopGameInput(){
  keys.clear();
  mouse.down=false;
  if(joined)send("input",{up:false,down:false,left:false,right:false,shoot:false,ax:0,ay:0});
}

function nearestResource(p,max=82){
  if(!state||!p)return null;
  let best=null,bd=max;
  for(const n of state.resources){
    const d=Math.hypot(n.x-p.x,n.y-p.y);
    if(d<bd){bd=d;best=n}
  }
  return best;
}

function triggerHarvestFx(node){
  if(!node)return;
  playSfx("harvest");
  const now=performance.now();
  toolSwingStart=now;
  toolSwingTargetId=node.id;
  resourceShake.set(node.id,{start:now,until:now+210});

  const particleType=node.type;
  for(let i=0;i<7;i++){
    const a=Math.random()*Math.PI*2;
    const sp=35+Math.random()*85;
    harvestParticles.push({
      x:node.x+(Math.random()-.5)*16,
      y:node.y+(Math.random()-.5)*14,
      vx:Math.cos(a)*sp,
      vy:Math.sin(a)*sp-25,
      born:now,
      life:260+Math.random()*240,
      type:particleType,
      size:2+Math.random()*3
    });
  }
  if(harvestParticles.length>100)harvestParticles.splice(0,harvestParticles.length-100);
}

function trackDamageFx(nextState){
  const now=performance.now();
  const own=(nextState.players||[]).find(pp=>pp.id===myId);
  if(own){
    if(Number.isFinite(previousOwnHp) && own.hp<previousOwnHp){playSfx("zombie");screenShakeUntil=Math.max(screenShakeUntil,now+120);screenShakePower=Math.max(screenShakePower,2.8);}
    previousOwnHp=own.hp;
  }
  if(nextState.core){
    if(Number.isFinite(previousCoreHp) && nextState.core.hp<previousCoreHp)playSfx("zombie");
    previousCoreHp=nextState.core.hp;
  }
  const alive=new Set();
  for(const z of nextState.zombies||[]){
    alive.add(z.id);
    const prev=previousZombieHp.get(z.id);
    if(Number.isFinite(prev) && z.hp<prev){
      const dmg=Math.max(1,Math.round(prev-z.hp));
      zombieHitFlashUntil.set(z.id,now+105);
      damageFloats.push({
        x:z.x+(Math.random()-.5)*18,
        y:z.y-z.r-8,
        text:String(dmg),
        born:now,
        life:620
      });
    }
    previousZombieHp.set(z.id,z.hp);
  }
  for(const id of [...previousZombieHp.keys()]){
    if(!alive.has(id)){previousZombieHp.delete(id);zombieHitFlashUntil.delete(id);}
  }
  if(damageFloats.length>80)damageFloats.splice(0,damageFloats.length-80);
}


function syncDiscoveries(serverSet){
  if(!serverSet||typeof serverSet!=="object")return;
  const next={};
  for(const [k,v] of Object.entries(serverSet))if(v)next[k]=true;
  const before=JSON.stringify(discoveredEnemies);
  const after=JSON.stringify(next);
  discoveredEnemies=next;
  if(before!==after)renderIndex();
}

function filledStars(n){return "★".repeat(Math.max(0,Number(n)||0))}

function memeDeath(cause){
  const source=isEn()?deathMemesEn:deathMemes;const list=source[cause]||source.unknown;
  return list[Math.floor(Math.random()*list.length)];
}

function showDeathScreen(cause="unknown",gameOver=false,wave=0,stats=null){
  stopGameInput();gameOverActive=!!gameOver;selectedBuild=null;adminGamePanel.classList.remove("visible");deathScreenHiddenWhileDown=false;
  const baseDestroyed=cause==="core";
  $("deathTitle").textContent=gameOver?(baseDestroyed?T("БАЗА РАЗНЕСЕНА","BASE DESTROYED"):T("ЗАБЕГ ОКОНЧЕН","RUN OVER")):T("ВЫ ПОГИБЛИ","YOU DIED");
  $("deathMessage").textContent=memeDeath(cause);
  if(cause==="victory"){$("deathTitle").textContent=T("ПОБЕДА!","VICTORY!");$("deathMessage").textContent=T("Все 50 волн пройдены. Генератор выстоял!","All 50 waves cleared. The generator survived!");}
  $("deathSub").textContent=gameOver?T(`Вы дошли до волны ${wave}. Следующий забег снова начнётся с уровня 1.`,`You reached wave ${wave}. The next run starts again from level 1.`):T("Напарник ещё может поднять тебя. Или можно вернуться к выбору классов.","Your teammate can still revive you, or you can return to class selection.");
  $("waitReviveBtn").style.display=gameOver?"none":"block";
  $("retryRunBtn").classList.toggle("hidden",!(gameOver&&roomMode==="solo"));
  $("deathStats").classList.toggle("hidden",!gameOver||!stats);
  if(gameOver&&stats){
    const fmt=n=>Number(n||0).toLocaleString(isEn()?"en-US":"ru-RU");
    $("deathStats").innerHTML=`<div><b>${fmt(stats.wave||wave)}</b><span>${T("волна","wave")}</span></div><div><b>${fmt(stats.kills)}</b><span>${T("убито","kills")}</span></div><div><b>${fmt(stats.damage)}</b><span>${T("урона","damage")}</span></div><div><b>${fmt(stats.builds)}</b><span>${T("построено","built")}</span></div><div class="death-weapon-stat"><b>${weaponNames[stats.weapon]||stats.weapon||"—"}</b><span>${T("любимое оружие","favorite weapon")}</span></div>`;
  }
  $("deathActions").classList.toggle("gameover",gameOver);deathOverlay.classList.add("visible");
}

function hideDeathScreen(){
  deathOverlay.classList.remove("visible");
  deathScreenHiddenWhileDown=false;
  gameOverActive=false;
}

function resetClientToLobby(){
  stopGameInput();
  joined=false;isHost=false;roomMode=null;
  myId=null;state=null;localPred=null;lastFloorStageSeen=-1;lastSnapshotWave=-1;clearCombatLog();
  selectedBuild=null;activeTool="gun";selectedStructureId=null;structureInfoExpanded=false;structureDeleteArmed=false;pendingRunBuy=null;runShopRenderSig="";pendingRunUpgrade=null;runUpgradeRenderSig="";
  nearCorePreviously=false;baseHintUntil=0;
  smoothPlayers.clear();smoothZombies.clear();
  previousZombieHp.clear();zombieHitFlashUntil.clear();movementDust.length=0;
  deathOverlay.classList.remove("visible");
  indexOverlay.classList.remove("visible");
  petOverlay.classList.remove("visible");
  crateOverlay.classList.remove("visible");
  pauseOverlay.classList.remove("visible");
  gameOverActive=false;pauseOpen=false;
  adminGamePanel.classList.remove("visible");adminGameBtn.classList.add("hidden");lobbyMetaOverlay.classList.remove("visible");runShopOverlay.classList.remove("visible");runUpgradeOverlay.classList.remove("visible");exitConfirmOverlay.classList.remove("visible");structureMenuOverlay.classList.remove("visible");$("languageSwitch")?.classList.remove("hidden");

  $("lobbySetup").classList.remove("hidden");
  $("roomWaitPanel").classList.add("hidden");
  $("joinCodePanel").classList.add("hidden");
  $("roomCodeCard").classList.remove("hidden");
  $("startBtn").classList.add("hidden");
  $("roomInput").value="";
  roster.innerHTML="";
  status.textContent=T("Ожидание…","Waiting…");
  lobby.classList.add("visible");
  $("indexBookBtn")?.classList.add("visible");
  updateWeaponHotbar(null);
  updateMedkitHotbar(null);
}

function showEnemyUnlock(enemy){
  discoveredEnemies[enemy]=true;
  renderIndex();
  const name=zombieNames[enemy]||enemy;
  $("unlockTitle").textContent=T("ОТКРЫТ НОВЫЙ ТИП ЗОМБИ","NEW ZOMBIE TYPE DISCOVERED");
  $("unlockName").textContent=name.toUpperCase();
  $("unlockPortrait").className=`unlock-portrait unlock-${enemy}`;
  unlockBanner.classList.add("visible");
  clearTimeout(unlockTimer);
  unlockTimer=setTimeout(()=>unlockBanner.classList.remove("visible"),3600);
}

function renderIndex(){
  const unlocked=zombieIndexData.filter(z=>!!discoveredEnemies[z.id]).length;
  const ownedSource=metaState?.petsOwned||myPlayer()?.petsOwned||{};
  const discoveredPets=Object.keys(petInfo).filter(id=>(ownedSource?.[id]||0)>0).length;
  $("indexProgress").textContent=T(`Зомби открыто ${unlocked}/${zombieIndexData.length} · питомцев открыто ${discoveredPets}/${Object.keys(petInfo).length}`,`Zombies discovered ${unlocked}/${zombieIndexData.length} · pets discovered ${discoveredPets}/${Object.keys(petInfo).length}`);
  $("indexGrid").innerHTML=zombieIndexData.map(z=>{
    const known=!!discoveredEnemies[z.id];
    if(!known)return `<article class="zombie-index-card locked"><div class="zi-top"><div><div class="zi-stars">?</div><h3>${T("НЕИЗВЕСТНО","UNKNOWN")}</h3></div><span class="zi-wave">${T("запись закрыта","entry locked")}</span></div><div class="zi-art"><div class="zi-zombie unknown"></div></div><div class="locked-copy">${T("Встретьте этого врага в забеге, чтобы открыть запись.","Encounter this enemy during a run to unlock its entry.")}</div></article>`;
    const txt=isEn()?zombieIndexEn[z.id]:[z.desc,z.special];
    return `<article class="zombie-index-card"><div class="zi-top"><div><div class="zi-stars">${filledStars(z.stars)}</div><h3>${(zombieNames[z.id]||z.name).toUpperCase()}</h3></div><span class="zi-wave">${T("с волны","from wave")} ${z.wave}</span></div><div class="zi-art"><div class="zi-zombie ${z.id}"></div></div><div class="zi-stats"><div class="zi-stat"><b>${z.hp}</b><span>HP</span></div><div class="zi-stat"><b>${z.dmg}</b><span>${T("УРОН","DAMAGE")}</span></div><div class="zi-stat"><b>${z.speed}</b><span>${T("СКОРОСТЬ","SPEED")}</span></div></div><p class="zi-desc">${txt?.[0]||z.desc}</p><div class="zi-special">${txt?.[1]||z.special}</div></article>`;
  }).join("");
  $("indexPetGrid").innerHTML=Object.entries(petInfo).map(([id,cfg])=>{
    const known=(ownedSource?.[id]||0)>0;
    if(!known)return `<article class="pet-index-card pet-index-locked"><div class="pet-mystery-art">?</div><div class="rarity rarity-${cfg.rarity}">${cfg.rarity.toUpperCase()}</div><h3>${T("НЕИЗВЕСТНО","UNKNOWN")}</h3><p>${T("Выбей питомца из ящика, чтобы открыть его запись, внешний вид и способности.","Get this pet from a crate to reveal its entry, appearance and abilities.")}</p></article>`;
    return `<article class="pet-index-card"><img src="${cfg.img}" alt=""><div class="rarity rarity-${cfg.rarity}">${cfg.rarity.toUpperCase()}</div><h3>${cfg.name}</h3><p>${cfg.desc}</p>${cfg.stats.map(x=>`<small>• ${x}</small><br>`).join("")}</article>`;
  }).join("");
}

function setIndexTab(tab){
  const pets=tab==="pets";
  $("indexZombieTab").classList.toggle("active",!pets);$("indexPetTab").classList.toggle("active",pets);
  $("indexGrid").classList.toggle("hidden",pets);$("indexPetGrid").classList.toggle("hidden",!pets);
}

function updateWeaponHotbar(p){
  const img=$("weaponSlotImg"),name=$("weaponSlotName"),stars=$("weaponSlotStars"),ammo=$("weaponAmmoLabel"),slot=$("weaponHotbarSlot");
  if(!img||!name||!stars||!ammo||!slot)return;
  const type=p?.weapon?.type||"pistol",weaponName=weaponNames[type]||T("Оружие","Weapon");
  const upgradeLevel=Math.max(1,Math.min(5,Number(p?.weaponLevel)||1));
  img.src=weaponImagePaths[type]||weaponImagePaths.pistol;name.textContent=`${weaponName} · ${T("ур.","lvl")} ${upgradeLevel}`;stars.textContent=filledStars(Math.max(weaponStars[type]||1,upgradeLevel));
  const a=p?.weaponAmmo,melee=meleeWeapons.has(type);
  ammo.textContent=melee?T("∞ БЕЗ ПЕРЕЗАРЯДКИ","∞ NO RELOAD"):(a?.reloading?`${T("ПЕРЕЗАРЯДКА","RELOADING")} ${Math.max(0,a.reloadTimer||0).toFixed(1)}${T("с","s")}`:`${a?.mag??weaponAmmoUi[type]?.mag??0} / ${a?.max??weaponAmmoUi[type]?.mag??0}`);
  ammo.classList.toggle("reloading",!!a?.reloading);slot.dataset.weapon=type;slot.title=melee?`1 — ${weaponName} · ${T("ближний бой","melee")}`:`1 — ${weaponName} · R ${T("перезарядка","reload")} ${weaponAmmoUi[type]?.reload||0}${T("с","s")}`;
}

function updateMedkitHotbar(p){
  const count=p?.inventory?.medkits||0;
  $("medkitCount").textContent=`×${count}`;
  $("medkitHotbarSlot").classList.toggle("empty",count<=0);
  $("medkitHotbarSlot").title=count>0?T(`3 — использовать аптечку (${count})`,`3 — use medkit (${count})`):T("3 — аптечек нет","3 — no medkits");
}

function enterRoomWaiting(m){
  joined=true;
  myId=m.playerId;
  isHost=!!m.isHost;
  roomMode=m.mode||"duo";

  $("lobbySetup").classList.add("hidden");
  $("roomWaitPanel").classList.remove("hidden");
  $("roomCodeDisplay").textContent=m.code;
  $("roomModeLabel").textContent=roomMode==="solo"?"SOLO LOBBY":T("КООПЕРАТИВНОЕ ЛОББИ","CO-OP LOBBY");
  $("roomCodeCard").classList.toggle("hidden",roomMode==="solo");
  $("startBtn").classList.toggle("hidden",!isHost);

  if(roomMode==="solo"){
    status.textContent=T("SOLO готов. Нажмите «Начать игру» — до этого мир не запустится.","SOLO is ready. Press Start game — the world will not run before that.");
  }else if(isHost){
    status.textContent=T("Комната создана. Передайте код другу и дождитесь второго игрока.","Room created. Send the code to your friend and wait for player two.");
  }else{
    status.textContent=T("Вы присоединились. Ожидаем, когда создатель нажмёт «Начать игру».","You joined. Waiting for the host to press Start game.");
  }
  $("indexBookBtn")?.classList.add("visible");
  send("getMeta");
}

function connect(){
  const proto=location.protocol==="https:"?"wss":"ws";
  ws=new WebSocket(`${proto}://${location.host}`);
  ws.onopen=()=>{connected=true;status.textContent=T("Сервер подключён.","Server connected.");$("connectionBadge").textContent=T("● онлайн","● online");$("connectionBadge").className="connection-badge online";const a=$("authStatus"),token=storageGet(sessionKey);if(a)a.textContent=token?"Восстанавливаем вход…":"Сервер подключён. Войдите или зарегистрируйтесь.";if(token)send("resumeSession",{token});send("clientPing",{sentAt:Date.now()});};
  ws.onclose=()=>{connected=false;lobby.classList.add("visible");status.textContent=T("Соединение потеряно. Обновите страницу.","Connection lost. Refresh the page.");$("connectionBadge").textContent=T("● офлайн","● offline");$("connectionBadge").className="connection-badge offline";if($("authStatus"))$("authStatus").textContent="Сервер недоступен. Попробуйте обновить страницу.";};
  ws.onmessage=e=>{
    const m=JSON.parse(e.data);
    if(m.type==="clientPong"){currentPing=Math.max(0,Date.now()-(Number(m.sentAt)||Date.now()));return;}
    if(m.type==="authSuccess"){
      if(m.session?.token)storageSet(sessionKey,m.session.token);
      accountState=m.account||accountState;$("authOverlay")?.classList.remove("visible");syncAccountUi();send("getMeta");
      if(m.starterGift)toast("🎁 Стартовый подарок: +200 серебра и +1 жетон ящика");
      setTimeout(()=>{if(accountState&&!accountState.onboarding?.whatsNewSeen)openWhatsNew();else if(accountState&&!accountState.onboarding?.lobbyTourDone)startLobbyGuide();},250);
      return;
    }
    if(m.type==="authError"||m.type==="accountError"){if($("authStatus"))$("authStatus").textContent=m.message||"Ошибка";toast(m.message||"Ошибка");return;}
    if(m.type==="authRequired"){accountState=null;$("authOverlay")?.classList.add("visible");if($("authStatus"))$("authStatus").textContent=m.message||"Войдите в аккаунт";return;}
    if(m.type==="accountState"){accountState=m.account||accountState;syncAccountUi();renderFeatureLocks();return;}
    if(m.type==="sessionInvalid"){storageRemove(sessionKey);if($("authStatus"))$("authStatus").textContent="Сессия истекла. Войдите снова.";return;}
    if(m.type==="loggedOut"){storageRemove(sessionKey);accountState=null;metaState=null;$("authOverlay")?.classList.add("visible");syncAccountUi();return;}
    if(m.type==="tutorialState"){renderRunTutorial(m.tutorial);return;}
    if(m.type==="error")toast(translateServerText(m.message));
    if(m.type==="joined")enterRoomWaiting(m);
    if(m.type==="roster"){
      if(Number.isFinite(m.hostId))isHost=m.hostId===myId;
      if(m.mode)roomMode=m.mode;
      $("startBtn").classList.toggle("hidden",!isHost);
      renderRoster(m.players,m.hostId);
      if(roomMode==="duo"&&isHost){
        status.textContent=m.players.length>=2
          ?T("Оба игрока готовы. Игра начнётся только после нажатия «Начать игру».","Both players are ready. The game starts only after the host presses Start game.")
          :T("Комната создана. Ждём второго игрока.","Room created. Waiting for player two.");
      }
    }
    if(m.type==="snapshot"){
      lastSnapshotAt=performance.now();
      trackDamageFx(m.state);
      trackWorldSfx(m.state);
      state=m.state;
      if(state?.eventText&&state.eventText!==lastLoggedEventText){lastLoggedEventText=state.eventText;pushCombatLog(translateServerText(state.eventText),"event");}
      if(state?.wave!==lastSnapshotWave||state?.floorStage!==lastFloorStageSeen){
        lastSnapshotWave=state?.wave??-1;
        announceFloorTransition();
      }
      const mp=state.players.find(p=>p.id===myId);
      if(mp){
        if(!localPred)localPred={x:mp.x,y:mp.y};
        const err=Math.hypot(localPred.x-mp.x,localPred.y-mp.y);
        const correction=err>140?1:.18;
        localPred.x+=(mp.x-localPred.x)*correction;
        localPred.y+=(mp.y-localPred.y)*correction;
      }
      if(state.started){
        lobby.classList.remove("visible");
        $("indexBookBtn")?.classList.remove("visible");
        adminGameBtn.classList.toggle("hidden",!(state.qaAdminEnabled&&settings.adminVisible));
        if(isTypingInUi(document.activeElement))document.activeElement.blur();
      }
      const current=myPlayer();
      if(current?.weaponAmmo?.reloading&&!lastReloading)playSfx("reload");
      lastReloading=!!current?.weaponAmmo?.reloading;
      updateWeaponHotbar(current);
      updateMedkitHotbar(current);
      syncSettingsUi();
      if(current)syncDiscoveries(current.discoveredEnemies);
      if(current && !current.downed && !gameOverActive && deathOverlay.classList.contains("visible"))hideDeathScreen();
      updateUnifiedUI();
      if(runShopOverlay.classList.contains("visible")){const rp=myPlayer();if(!rp||!state?.core||Math.hypot(rp.x-state.core.x,rp.y-state.core.y)>RUN_SHOP_RADIUS)closeRunShop();else renderRunShop();}
      if(runUpgradeOverlay.classList.contains("visible")){const rp=myPlayer();if(!rp||!state?.core||Math.hypot(rp.x-state.core.x,rp.y-state.core.y)>RUN_SHOP_RADIUS)closeRunUpgrade();else renderRunUpgrade();}
      if(structureMenuOverlay.classList.contains("visible")){const st=selectedStructure(),rp=myPlayer();if(!st||!rp||localDistanceToStructure(rp.x,rp.y,st)>180)closeStructureMenu();else renderStructureMenu();}
    }
    if(m.type==="metaState"){
      metaState=m.meta;if(m.meta?.account)accountState=m.meta.account;syncAccountUi();renderFeatureLocks();renderMetaWallet();renderClassLocks();updateMetaAttention();
      if(pendingClassUnlock&&classIsUnlocked(pendingClassUnlock)){
        character=pendingClassUnlock;document.querySelectorAll(".character").forEach(x=>x.classList.toggle("selected",x.dataset.char===character));toast(T(`Класс открыт: ${classNames[character]}`,`Class unlocked: ${classNames[character]}`));pendingClassUnlock=null;
      }
      if(lobbyMetaOverlay.classList.contains("visible"))renderLobbyMeta();if(petOverlay.classList.contains("visible"))renderPets();if(indexOverlay.classList.contains("visible"))renderIndex();
    }
    if(m.type==="notice"){const line=translateServerText(m.text);toast(line);pushCombatLog(line,"notice");}
    if(m.type==="levelUp")showLevelUp(m);
    if(m.type==="bossLoot"){showBossLoot(m);pushCombatLog(T(`Добыча с босса: ${m.bossName||"Босс"}`,`Boss loot: ${zombieNamesEn[m.bossType]||m.bossName||"Boss"}`),"loot");}
    if(m.type==="combo")showComboFlash(m);
    if(m.type==="buyResult"){
      if(!pendingRunBuy || !m.requestId || pendingRunBuy.requestId===m.requestId){
        pendingRunBuy=null;runShopRenderSig="";
        if(m.ok){activeTool="gun";selectedBuild=null;playSfx("coin");updateUnifiedUI(true);}
        if(runShopOverlay.classList.contains("visible"))renderRunShop(true);
      }
    }
    if(m.type==="equipmentUpgradeResult"){
      if(!pendingRunUpgrade||!m.requestId||pendingRunUpgrade.requestId===m.requestId){pendingRunUpgrade=null;runUpgradeRenderSig="";if(m.ok)playSfx("coin");if(runUpgradeOverlay.classList.contains("visible"))renderRunUpgrade(true);updateUnifiedUI(true);}
    }
    if(m.type==="playerDied")showDeathScreen(m.cause||"unknown",false,state?.wave||0);
    if(m.type==="revived"){hideDeathScreen();toast(T("Напарник поднял тебя. Снова в бой!","Your teammate revived you. Back to the fight!"));}
    if(m.type==="enemyUnlocked")showEnemyUnlock(m.enemy);
    if(m.type==="gameOver")showDeathScreen(m.cause||m.reason||"unknown",true,m.wave||0,m.stats||null);
    if(m.type==="pauseState")serverPaused=!!m.paused;
    if(m.type==="runRestarted"){hideDeathScreen();serverPaused=false;toast(T("Новый SOLO-забег начался","New SOLO run started"));}
    if(m.type==="crateOpened")showCrateSpin(m);
    if(m.type==="crateCooldown")toast(T(`Ящик ещё закрыт: ${m.remaining||1}с`,`Crate cooldown: ${m.remaining||1}s`));
    if(m.type==="returnedToLobby")resetClientToLobby();
  };
}

// ===== v8 ACCOUNT / ONBOARDING =====
const GUIDE_STEPS=[
  {target:"#lobbyAccountCard",title:"Твой профиль",text:"Здесь имя персонажа, уровень аккаунта и постоянный прогресс."},
  {target:"#lobbyMetaNav [data-lobby-pane='shop']",title:"Магазин",text:"Покупай подготовку за серебро. Она активируется в следующем забеге."},
  {target:".class-grid",title:"Классы",text:"Выбери класс перед стартом. Стартовый класс уже выбран автоматически."},
  {target:"#soloBtn",title:"SOLO",text:"Быстрый одиночный забег. Для игры вдвоём создай лобби и передай код."},
  {target:"#createLobbyBtn",title:"DUO",text:"Создаёт комнату на двух игроков. Игра начнётся только после кнопки «Начать игру»."},
  {target:"#lobbyMetaNav",title:"Штаб развивается",text:"Часть разделов откроется постепенно: после первых волн и повышения уровня аккаунта."}
];
function sendAuth(type,data={}){if(!connected){$("authStatus").textContent="Сервер ещё не подключён";return;}send(type,data);}
function switchAuthTab(mode){const reg=mode==="register";$("authLoginTab").classList.toggle("active",!reg);$("authRegisterTab").classList.toggle("active",reg);$("loginForm").classList.toggle("hidden",reg);$("registerForm").classList.toggle("hidden",!reg);$("authStatus").textContent=connected?"Введите данные":"Подключение к серверу…";}
$("authLoginTab").onclick=()=>switchAuthTab("login");$("authRegisterTab").onclick=()=>switchAuthTab("register");
$("loginForm").addEventListener("submit",e=>{e.preventDefault();sendAuth("login",{username:$("loginUsername").value,password:$("loginPassword").value});$("authStatus").textContent="Вход…";});
$("registerForm").addEventListener("submit",e=>{e.preventDefault();sendAuth("register",{username:$("registerUsername").value,displayName:$("registerDisplayName").value,password:$("registerPassword").value});$("authStatus").textContent="Создаём аккаунт…";});
function syncAccountUi(){
  const a=accountState;if(!a)return;
  $("accountUsername").textContent=`@${a.username}`;$("accountDisplayName").textContent=a.displayName;$("accountLevelLabel").textContent=`Уровень аккаунта ${a.accountLevel||1}`;
  const xp=Math.max(0,a.accountXp||0),next=Math.max(1,a.accountNextXp||100);$("accountXpLabel").textContent=`${xp} / ${next} XP`;$("accountXpFill").style.width=`${Math.min(100,xp/next*100)}%`;
  $("profileName").textContent=a.displayName;$("profileLogin").textContent=`@${a.username}`;$("renameInput").value=a.displayName;
  const left=Math.max(0,(a.renameAvailableAt||0)-Date.now());$("renameBtn").disabled=left>0;$("renameHint").textContent=left>0?`Следующая смена имени через ${Math.ceil(left/86400000)} дн.`:"Имя можно изменить сейчас. После смены — перерыв 7 дней.";
  renderProfileStats();
}
function renderProfileStats(){if(!accountState)return;const m=metaState||{};const life=m.lifetime||{};$("profileStats").innerHTML=`<div><b>${accountState.accountLevel||1}</b><span>уровень аккаунта</span></div><div><b>${m.bestWave||0}</b><span>лучшая волна</span></div><div><b>${life.kills||0}</b><span>убийств</span></div><div><b>${life.bossKills||0}</b><span>боссов</span></div><div><b>${(m.runHistory||[]).length}</b><span>забегов в истории</span></div>`;}
function featureUnlocked(mode){const f=accountState?.featureUnlocks||metaState?.account?.featureUnlocks||{};return mode==="shop"||mode==="quests"||mode==="profile"?true:!!f[mode];}
function featureLockText(mode){return ({upgrades:"🔒 Улучшения откроются после первой пройденной волны / 2 уровня аккаунта",achievements:"🔒 Достижения откроются после первой пройденной волны",history:"🔒 История откроется после первого забега",crates:"🔒 Ящики откроются после 3-й волны",pets:"🔒 Питомцы откроются после 3-й волны",index:"🔒 INDEX откроется после встречи с первым новым врагом"})[mode]||"🔒 Пока закрыто";}
function renderFeatureLocks(){document.querySelectorAll("#lobbyMetaNav [data-lobby-pane]").forEach(b=>{const mode=b.dataset.lobbyPane,open=featureUnlocked(mode);b.classList.toggle("feature-locked",!open);b.dataset.locked=open?"":"1";if(!open)b.title=featureLockText(mode);});const idx=$("indexBookBtn");if(idx){const open=featureUnlocked("index");idx.classList.toggle("feature-locked",!open);}}
function openProfile(){syncAccountUi();$("profileOverlay").classList.add("visible");}
$("openProfileBtn").onclick=openProfile;$("closeProfileBtn").onclick=()=>$("profileOverlay").classList.remove("visible");
$("renameBtn").onclick=()=>send("renameAccount",{displayName:$("renameInput").value});
$("logoutBtn").onclick=()=>{if(joined){toast("Сначала выйдите из комнаты");return;}send("logout");};
function openWhatsNew(){$("whatsNewOverlay").classList.add("visible");}
function closeWhatsNew(){const first=!accountState?.onboarding?.whatsNewSeen;$("whatsNewOverlay").classList.remove("visible");if(first)send("ackWhatsNew");setTimeout(()=>{if(accountState&&!accountState.onboarding?.lobbyTourDone)startLobbyGuide();},120);}
$("openWhatsNewBtn").onclick=openWhatsNew;$("closeWhatsNewBtn").onclick=closeWhatsNew;$("whatsNewOkBtn").onclick=closeWhatsNew;
function clearGuideHighlight(){document.querySelectorAll(".guide-highlight").forEach(x=>x.classList.remove("guide-highlight"));}
function renderGuide(){clearGuideHighlight();const st=GUIDE_STEPS[guideStep];if(!st){finishGuide();return;}$("guideStepLabel").textContent=`ШАГ ${guideStep+1} / ${GUIDE_STEPS.length}`;$("guideTitle").textContent=st.title;$("guideText").textContent=st.text;const target=document.querySelector(st.target);target?.classList.add("guide-highlight");$("nextGuideBtn").textContent=guideStep===GUIDE_STEPS.length-1?"Готово":"Дальше";}
function startLobbyGuide(){guideStep=0;$("guideOverlay").classList.add("visible");renderGuide();}
function finishGuide(){clearGuideHighlight();$("guideOverlay").classList.remove("visible");if(!accountState?.onboarding?.lobbyTourDone)send("completeLobbyTour");}
$("startGuideBtn").onclick=startLobbyGuide;$("nextGuideBtn").onclick=()=>{guideStep++;renderGuide();};$("skipGuideBtn").onclick=finishGuide;
function renderRunTutorial(t){const panel=$("runTutorialPanel");if(!t||!t.active){panel.classList.add("hidden");return;}panel.classList.remove("hidden");const steps=["Убей 3 зомби","Добудь любой ресурс","Поставь любую постройку","Улучши постройку мультитулом","Переживи первую волну"];$("runTutorialTitle").textContent=steps[t.step]||"Обучение";$("runTutorialProgress").textContent=t.step===0?`${Math.min(3,t.kills||0)} / 3`:`ШАГ ${Math.min(5,(t.step||0)+1)} / 5`;}
$("skipRunTutorialBtn").onclick=()=>{if(confirm("Пропустить обучение? Награду +150 серебра получить будет нельзя."))send("skipRunTutorial");};

connect();

function classIsUnlocked(id){return id==="starter"||!!metaState?.unlockedClasses?.[id]}
function renderClassLocks(){
  document.querySelectorAll(".character").forEach(b=>{
    const id=b.dataset.char,locked=!classIsUnlocked(id),price=metaState?.classCosts?.[id]??classUnlockCosts[id]??0;
    b.classList.toggle("locked",locked);const label=b.querySelector(`[data-class-price="${id}"]`);
    if(label)label.textContent=id==="starter"?T("БЕСПЛАТНО","FREE"):locked?T(`🔒 ${price} золота`,`🔒 ${price} gold`):T("✓ ОТКРЫТ","✓ UNLOCKED");
    b.title=locked?T(`Нажмите, чтобы открыть класс за ${price} золота`,`Click to unlock this class for ${price} gold`):T("Класс открыт","Class unlocked");
  });
}
function applyLanguage(next=lang){
  lang=next==="en"?"en":"ru";storageSet("nsd_language",lang);document.documentElement.lang=lang;
  syncCatalogLanguage();
  $("langRuBtn")?.classList.toggle("active",lang==="ru");$("langEnBtn")?.classList.toggle("active",lang==="en");
  renderClassLocks();renderIndex();
  const p=myPlayer();if(p){updateWeaponHotbar(p);updateMedkitHotbar(p);updateUnifiedUI(true);}
  if(lobbyMetaOverlay.classList.contains("visible"))renderLobbyMeta();
  if(petOverlay.classList.contains("visible"))renderPets();
  if(crateOverlay.classList.contains("visible")&&!crateSpinLocked)renderCratePreview();
  if(runShopOverlay.classList.contains("visible"))renderRunShop();
  if(joined&&state)renderRoster(state.players,state.hostId);
  if(joined)$("roomModeLabel").textContent=roomMode==="solo"?"SOLO LOBBY":T("КООПЕРАТИВНОЕ ЛОББИ","CO-OP LOBBY");
  translateDom(document.body);
}

document.querySelectorAll(".character").forEach(b=>b.onclick=()=>{
  if(joined)return;const id=b.dataset.char;
  if(!classIsUnlocked(id)){
    const price=metaState?.classCosts?.[id]??classUnlockCosts[id]??0;
    if((metaState?.gold||0)<price){toast(T(`Для открытия класса нужно ${price} золота`,`You need ${price} gold to unlock this class`));return;}
    if(!confirm(`Открыть класс «${classNames[id]}» за ${price} золота?`))return;pendingClassUnlock=id;send("metaUnlockClass",{classId:id});playSfx("coin");return;
  }
  document.querySelectorAll(".character").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");character=id;
});
$("langRuBtn").onclick=()=>applyLanguage("ru");$("langEnBtn").onclick=()=>applyLanguage("en");
applyLanguage(lang);

function joinPayload(){return {character};}
$("soloBtn").onclick=()=>send("createRoom",{...joinPayload(),mode:"solo"});
$("createLobbyBtn").onclick=()=>send("createRoom",{...joinPayload(),mode:"duo"});
$("showJoinBtn").onclick=()=>{$("joinCodePanel").classList.remove("hidden");$("roomInput").focus();};
$("cancelJoinBtn").onclick=()=>$("joinCodePanel").classList.add("hidden");
$("joinBtn").onclick=()=>send("join",{...joinPayload(),room:$("roomInput").value});
$("startBtn").onclick=()=>send("start");
$("leaveRoomBtn").onclick=()=>send("leaveToLobby");
$("medkitHotbarSlot").onclick=()=>{if(state?.started){send("useMedkit");playSfx("heal");}};

$("lobbyMetaNav").addEventListener("click",e=>{
  const b=e.target.closest("[data-lobby-pane]");if(!b)return;
  const pane=b.dataset.lobbyPane;
  if(!featureUnlocked(pane)){toast(featureLockText(pane));return;}
  if(pane==="crates"){
    lobbyMetaOverlay.classList.remove("visible");
    crateOverlay.classList.add("visible");
    renderCratePreview();
    playSfx("ui");
    return;
  }
  if(pane==="pets"){
    lobbyMetaOverlay.classList.remove("visible");
    petOverlay.classList.add("visible");
    renderPets("inventory");
    playSfx("ui");
    return;
  }
  openLobbyMeta(pane);
});
$("closeLobbyMetaBtn").onclick=()=>lobbyMetaOverlay.classList.remove("visible");
lobbyMetaOverlay.addEventListener("mousedown",e=>{if(e.target===lobbyMetaOverlay)lobbyMetaOverlay.classList.remove("visible");});
lobbyMetaContent.addEventListener("click",e=>{
  const sb=e.target.closest("[data-meta-shop]");if(sb)send("metaShopBuy",{item:sb.dataset.metaShop});
  const ub=e.target.closest("[data-meta-upgrade]");if(ub)send("metaUpgradeBuy",{key:ub.dataset.metaUpgrade});
  const qb=e.target.closest("[data-meta-quest]");if(qb)send("metaQuestClaim",{id:qb.dataset.metaQuest});
  const tb=e.target.closest("[data-meta-title]");if(tb)send("metaSelectTitle",{title:tb.dataset.metaTitle});
  const ab=e.target.closest("[data-meta-achievement]");if(ab&&!ab.disabled)send("metaAchievementClaim",{id:ab.dataset.metaAchievement});
  if(e.target.closest("#openLobbyCrateBtn")){lobbyMetaOverlay.classList.remove("visible");crateOverlay.classList.add("visible");renderCratePreview();}
  if(e.target.closest("#openLobbyPetsBtn")){lobbyMetaOverlay.classList.remove("visible");petOverlay.classList.add("visible");renderPets("inventory");}
  if(e.target.closest("#openLobbyPetIndexBtn")){lobbyMetaOverlay.classList.remove("visible");indexOverlay.classList.add("visible");setIndexTab("pets");renderIndex();}
});
$("closePetBtn").onclick=()=>petOverlay.classList.remove("visible");
petOverlay.addEventListener("mousedown",e=>{if(e.target===petOverlay)petOverlay.classList.remove("visible");});
$("petInventoryTab").onclick=()=>renderPets();
$("petList").addEventListener("click",e=>{const eq=e.target.closest("[data-equip-pet]");if(eq)send("metaEquipPet",{petId:eq.dataset.equipPet});if(e.target.closest("[data-unequip-pet]"))send("metaEquipPet",{petId:null});});
$("spinCrateBtn").onclick=()=>{
  if(crateSpinLocked)return;
  crateCurrentResult=null;clearTimeout(crateRevealTimer);crateRevealTimer=null;clearTimeout(activeCrateAnimation);activeCrateAnimation=null;
  if(!((metaState?.crateTokens||0)>0)&&!confirm("Открыть ящик за 50 золота?"))return;
  crateSpinLocked=true;$("spinCrateBtn").disabled=true;$("skipCrateBtn").classList.add("hidden");playSfx("crate");
  send("metaCrateOpen");
  setTimeout(()=>{if(!crateCurrentResult){crateSpinLocked=false;renderCratePreview();}},1800);
};
$("skipCrateBtn").onclick=()=>{
  if(!crateCurrentResult)return;
  const result=crateCurrentResult,cfg=petInfo[result],reel=$("crateReel");
  clearTimeout(crateRevealTimer);crateRevealTimer=null;clearTimeout(activeCrateAnimation);activeCrateAnimation=null;
  reel.style.transition="none";finishCrateReveal();
  crateSpinLocked=false;crateCurrentResult=null;
  send("metaCrateSkip");
  $("spinCrateBtn").disabled=(((metaState?.gold||0)<50)&&!((metaState?.crateTokens||0)>0));
  $("spinCrateBtn").textContent=(metaState?.crateTokens||0)>0?T("Открыть за жетон","Open with token"):T("Открыть за 50 золота","Open for 50 gold");
  $("skipCrateBtn").classList.add("hidden");
  $("crateResult").innerHTML=`<div class="crate-reveal"><img src="${cfg.img}" alt=""><div><small>${cfg.rarity.toUpperCase()}</small><b>${T("Выпал","Dropped")}: ${cfg.name}!</b></div></div>`;
};
$("closeCrateBtn").onclick=()=>crateOverlay.classList.remove("visible");crateOverlay.addEventListener("mousedown",e=>{if(e.target===crateOverlay)crateOverlay.classList.remove("visible");});
$("closeRunShopBtn").onclick=closeRunShop;runShopOverlay.addEventListener("mousedown",e=>{if(e.target===runShopOverlay)closeRunShop();});
$("runShopContent").addEventListener("click",e=>{
  const b=e.target.closest("[data-run-buy]");if(!b||b.disabled||pendingRunBuy)return;
  const item=b.dataset.runBuy,requestId=`buy_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  pendingRunBuy={item,requestId};runShopRenderSig="";renderRunShop(true);send("buy",{item,requestId});
  setTimeout(()=>{if(pendingRunBuy?.requestId===requestId){pendingRunBuy=null;runShopRenderSig="";if(runShopOverlay.classList.contains("visible"))renderRunShop(true);toast(T("Магазин не ответил — попробуйте ещё раз","Shop did not respond — try again"));}},1800);
});
$("closeRunUpgradeBtn").onclick=closeRunUpgrade;runUpgradeOverlay.addEventListener("mousedown",e=>{if(e.target===runUpgradeOverlay)closeRunUpgrade();});
runUpgradeOverlay.addEventListener("click",e=>{
  const tab=e.target.closest("[data-upgrade-tab]");if(tab){runUpgradeTab=tab.dataset.upgradeTab;runUpgradeRenderSig="";renderRunUpgrade(true);return;}
  const b=e.target.closest("[data-run-upgrade]");if(!b||b.disabled||pendingRunUpgrade)return;
  const kind=b.dataset.runUpgrade,requestId=`upgrade_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  pendingRunUpgrade={kind,requestId};runUpgradeRenderSig="";renderRunUpgrade(true);send("runEquipmentUpgrade",{kind,requestId});
  setTimeout(()=>{if(pendingRunUpgrade?.requestId===requestId){pendingRunUpgrade=null;runUpgradeRenderSig="";if(runUpgradeOverlay.classList.contains("visible"))renderRunUpgrade(true);toast(T("Мастерская не ответила — попробуйте ещё раз","Workshop did not respond — try again"));}},1800);
});
$("coreActions").addEventListener("click",e=>{const b=e.target.closest("[data-core-action]");if(!b)return;if(b.dataset.coreAction==="shop")openRunShop();if(b.dataset.coreAction==="upgrade")openRunUpgrade();});
$("closeStructureMenuBtn").onclick=closeStructureMenu;
structureMenuOverlay.addEventListener("mousedown",e=>{if(e.target===structureMenuOverlay)closeStructureMenu();});
$("structureRepairBtn").onclick=()=>{const st=selectedStructure();if(!st||st.hp>=st.maxHp)return;send("structureRepair",{structureId:st.id});structureDeleteArmed=false;setTimeout(()=>renderStructureMenu(),80);};
$("structureUpgradeBtn").onclick=()=>{const st=selectedStructure();if(!st)return;send("structureUpgrade",{structureId:st.id});structureDeleteArmed=false;setTimeout(()=>renderStructureMenu(),80);};
$("structureInfoBtn").onclick=()=>{structureInfoExpanded=!structureInfoExpanded;structureDeleteArmed=false;renderStructureMenu();};
$("structureRemoveBtn").onclick=()=>{const st=selectedStructure();if(!st)return;if(!structureDeleteArmed){structureDeleteArmed=true;renderStructureMenu();return;}send("structureRemove",{structureId:st.id});closeStructureMenu();};

adminGameBtn.onclick=()=>adminGamePanel.classList.toggle("visible");$("closeAdminGameBtn").onclick=()=>adminGamePanel.classList.remove("visible");
adminGamePanel.addEventListener("click",e=>{const ar=e.target.closest("[data-admin-resource]");if(ar)send("admin",{op:"resource",kind:ar.dataset.adminResource,amount:Number(ar.dataset.adminAmount)||0});const aw=e.target.closest("[data-admin-weapon]");if(aw)send("admin",{op:"weapon",weapon:aw.dataset.adminWeapon});const ap=e.target.closest("[data-admin-pet]");if(ap)send("admin",{op:"pet",pet:ap.dataset.adminPet});const at=e.target.closest("[data-admin-token]");if(at)send("admin",{op:"token",amount:1});});

function showExitRunConfirm(){
  if(!state?.started||gameOverActive){send("leaveToLobby");return;}
  $("exitConfirmTag").textContent=T("НЕЗАВЕРШЁННЫЙ ЗАБЕГ","UNFINISHED RUN");
  $("exitConfirmTitle").textContent=T("Выйти из текущего боя?","Leave the current run?");
  $("exitConfirmText").textContent=T(
    "Если выйти сейчас, этот бой не попадёт в историю игр, а итоговая награда за незавершённый забег не будет выдана.",
    "If you leave now, this run will not be added to your match history and no end-of-run reward will be granted for the unfinished run."
  );
  $("cancelExitRunBtn").textContent=T("Остаться","Stay");
  $("confirmExitRunBtn").textContent=T("Выйти без награды","Leave without reward");
  exitConfirmOverlay.classList.add("visible");stopGameInput();
}
function closeExitRunConfirm(){exitConfirmOverlay.classList.remove("visible");}
$("cancelExitRunBtn").onclick=()=>closeExitRunConfirm();
$("confirmExitRunBtn").onclick=()=>{closeExitRunConfirm();pauseOverlay.classList.remove("visible");pauseOpen=false;send("leaveToLobby");};
exitConfirmOverlay.addEventListener("mousedown",e=>{if(e.target===exitConfirmOverlay)closeExitRunConfirm();});

$("pauseContinueBtn").onclick=closePause;$("retryRunBtn").onclick=()=>{hideDeathScreen();send("restartRun");};$("pauseSettingsBtn").onclick=()=>{$("pauseMainMenu").classList.add("hidden");$("pauseSettingsPanel").classList.remove("hidden");syncSettingsUi();};$("pauseBackBtn").onclick=()=>{$("pauseSettingsPanel").classList.add("hidden");$("pauseMainMenu").classList.remove("hidden");};$("pauseExitBtn").onclick=showExitRunConfirm;
$("settingAudioEnabled").onchange=e=>{settings.audioEnabled=e.target.checked;saveSettings();};$("settingSfxVolume").oninput=e=>{settings.sfxVolume=Number(e.target.value)||0;saveSettings();};$("settingAmbientVolume").oninput=e=>{settings.ambientVolume=Number(e.target.value)||0;saveSettings();};$("settingFootsteps").onchange=e=>{settings.footsteps=e.target.checked;saveSettings();};$("settingAdminVisible").onchange=e=>{settings.adminVisible=e.target.checked;saveSettings();syncSettingsUi();};
$("settingPerformanceHud").onchange=e=>{settings.performanceHud=e.target.checked;saveSettings();};
syncSettingsUi();
renderClassLocks();

renderIndex();
setInterval(()=>{
  const el=$("questCooldownLive");
  if(!el)return;
  const left=Math.max(0,(metaState?.questCooldownUntil||0)-Date.now());
  el.textContent=formatTimeLeft(left);
  if(left<=0&&lobbyMetaMode==="quests"&&lobbyMetaOverlay.classList.contains("visible"))send("getMeta");
},1000);
setInterval(()=>{if(ws?.readyState===1)send("clientPing",{sentAt:Date.now()});},2500);
// Pet loadout is intentionally lobby-only. It cannot be changed during an active run.
$("quickSettingsBtn").onclick=()=>openPause();
$("indexZombieTab").onclick=()=>setIndexTab("zombies");$("indexPetTab").onclick=()=>setIndexTab("pets");
$("closeIndexBtn").onclick=()=>indexOverlay.classList.remove("visible");
indexOverlay.addEventListener("mousedown",e=>{if(e.target===indexOverlay)indexOverlay.classList.remove("visible")});

$("waitReviveBtn").onclick=()=>{
  deathOverlay.classList.remove("visible");
  deathScreenHiddenWhileDown=true;
  toast(T("Ждём, пока напарник поднимет тебя…","Waiting for your teammate to revive you…"));
};
$("returnClassesBtn").onclick=()=>{
  if(state?.started&&!gameOverActive)showExitRunConfirm();
  else send("leaveToLobby");
};

$("talentHeader").onclick=()=>{
  talentCollapsed=!talentCollapsed;
  $("talentDock").classList.toggle("collapsed",talentCollapsed);
};


function renderMetaWallet(){
  const m=metaState||{silver:0,gold:0};
  $("lobbySilver").textContent=m.silver||0;$("lobbyGold").textContent=m.gold||0;$("metaSilver").textContent=m.silver||0;$("metaGold").textContent=m.gold||0;
}
function metaUpgradePrice(key,lvl){const c=metaUpgradeInfo[key];return c.base+c.step*lvl;}
function formatTimeLeft(ms){
  const total=Math.max(0,Math.ceil(ms/1000)),m=Math.floor(total/60),s=total%60;
  return `${m}:${String(s).padStart(2,"0")}`;
}
const coreRepairCost={wood:8,stone:6,scrap:12};

function achievementProgress(id,m,status=0){
  const life=m?.lifetime||{};
  if(id==="survive10")return {value:Math.min(10,m?.bestWave||0),target:10,label:T("лучшие волны","best wave")};
  if(id==="bossHunter")return {value:Math.min(3,life.bossKills||0),target:3,label:T("боссы","bosses")};
  if(id==="builder50")return {value:Math.min(50,life.builds||0),target:50,label:T("постройки","structures")};
  if(id==="orc1000")return {value:Math.min(1000,life.orcKills||0),target:1000,label:T("орки","orcs")};
  if(id==="base80")return {value:Math.min(5,life.base80Best||0),target:5,label:T("волны с базой ≥80%","waves with base ≥80%")};
  if(id==="meleeBoss")return {value:status>=1?1:0,target:1,label:T("босс только мили","melee-only boss")};
  return {value:status>=1?1:0,target:1,label:T("прогресс","progress")};
}
function openLobbyMeta(mode){lobbyMetaMode=mode;lobbyMetaOverlay.classList.add("visible");renderLobbyMeta();playSfx("ui");send("getMeta");}
function renderLobbyMeta(){
  const m=metaState||{silver:0,gold:0,quests:[],upgrades:{},prepItems:{},petsOwned:{},equippedPet:null};renderMetaWallet();
  const title={shop:T("Магазин","Shop"),quests:T("Квесты","Quests"),upgrades:T("Улучшения","Upgrades"),crates:T("Ящики","Crates"),pets:T("Питомцы","Pets"),achievements:T("Достижения","Achievements"),history:T("История забегов","Run history")}[lobbyMetaMode]||T("Центр подготовки","Preparation center");lobbyMetaTitle.textContent=title;
  if(lobbyMetaMode==="shop"){
    lobbyMetaContent.innerHTML=`<div class="meta-auto-hint"><b>${T("Как использовать?","How does it work?")}</b><span>${T("Все предметы магазина подготовки применяются автоматически, когда ты нажимаешь «Начать игру». Никакую отдельную кнопку искать не нужно.","All preparation-shop items activate automatically when you press Start game. No separate use button is required.")}</span></div>`+Object.entries(metaShopInfo).map(([id,cfg])=>`<article class="meta-card"><div class="meta-card-row"><div><h3>${cfg.name}</h3><p>${cfg.desc}</p><small class="prep-stock">${T(`В запасе: ${m.prepItems?.[id]||0} · АВТО при следующем старте`,`In stock: ${m.prepItems?.[id]||0} · AUTO next start`)}</small></div><div class="meta-card-actions"><span class="price-silver">${cfg.cost} ${T("серебра","silver")}</span><button data-meta-shop="${id}" ${m.silver<cfg.cost?"disabled":""}>${T("Купить","Buy")}</button></div></div></article>`).join("");
  }else if(lobbyMetaMode==="quests"){
    const cooldown=Math.max(0,(m.questCooldownUntil||0)-Date.now());
    if(cooldown>0){
      lobbyMetaContent.innerHTML=`<div class="quest-cooldown-card"><b>${T("КВЕСТЫ НА ПЕРЕЗАРЯДКЕ","QUESTS ON COOLDOWN")}</b><span>${T("Ты закрыл весь набор. Новые задания откроются через","You completed the full set. New assignments unlock in")} <strong id="questCooldownLive">${formatTimeLeft(cooldown)}</strong>.</span><small>${T("Общий КД запускается только после того, как забраны награды за все задания.","The shared cooldown starts only after every quest reward has been claimed.")}</small></div>`+
        (m.quests||[]).map(q=>{const lq=localizedQuest(q);return `<article class="meta-card quest-claimed"><div class="meta-card-row"><div><h3>✓ ${lq.title}</h3><p>${lq.desc}</p></div><span class="price-silver">${T("получено","claimed")} +${q.reward}</span></div></article>`}).join("");
    }else{
      lobbyMetaContent.innerHTML=`<div class="meta-auto-hint"><b>${T("Новый набор заданий","New quest set")}</b><span>${T("В каждом цикле цели меняются. Когда заберёшь награды за ВСЕ квесты, запустится общий КД 30 минут.","Goals change every cycle. After you claim rewards from ALL quests, a shared 30-minute cooldown begins.")}</span></div>`+
        (m.quests||[]).map(q=>{const lq=localizedQuest(q),ready=(q.progress||0)>=q.target,claimed=!!q.claimed;return `<article class="meta-card ${claimed?"quest-claimed":""}"><div class="meta-card-row"><div><h3>${claimed?"✓ ":""}${lq.title}</h3><p>${lq.desc}</p></div><span class="price-silver">${claimed?T("ПОЛУЧЕНО","CLAIMED"):"+"+q.reward+" "+T("серебра","silver")}</span></div><div class="meta-progress"><span style="width:${claimed?100:Math.min(100,(q.progress||0)/q.target*100)}%"></span></div><div class="meta-card-row"><b>${claimed?q.target:(q.progress||0)}/${q.target}</b><button data-meta-quest="${q.id}" ${ready&&!claimed?"":"disabled"}>${claimed?T("Получено","Claimed"):ready?T("Забрать","Claim"):T("В процессе","In progress")}</button></div></article>`}).join("");
    }
  }else if(lobbyMetaMode==="upgrades"){
    lobbyMetaContent.innerHTML=Object.entries(metaUpgradeInfo).map(([id,cfg])=>{const lvl=m.upgrades?.[id]||0,max=lvl>=cfg.max,price=metaUpgradePrice(id,lvl);return `<article class="meta-card"><div class="meta-card-row"><div><h3>${cfg.name}</h3><p>${cfg.desc}</p><b>${T("ур.","lvl")} ${lvl}/${cfg.max}</b></div><div class="meta-card-actions"><span class="price-silver">${max?"MAX":price+" "+T("серебра","silver")}</span><button data-meta-upgrade="${id}" ${max||m.silver<price?"disabled":""}>${max?T("Максимум","Maximum"):T("Улучшить","Upgrade")}</button></div></div></article>`}).join("");
  }else if(lobbyMetaMode==="crates"){
    lobbyMetaContent.innerHTML=`<article class="meta-card"><div class="meta-card-row"><div><h3>${T("Питомцевый ящик","Pet crate")}</h3><p>${T("Цена: 50 золотых. Содержимое скрыто до выпадения питомца. Шанс рассчитывается сервером настоящим взвешенным RNG.","Price: 50 gold. Contents stay hidden until a pet drops. The server uses a real weighted RNG roll.")}</p></div><div class="meta-card-actions"><span class="price-gold">50 ${T("золота","gold")}</span><button id="openLobbyCrateBtn" ${(m.gold<50&&!(m.crateTokens>0))?"disabled":""}>${T("Открыть рулетку","Open roulette")}</button></div></div><small>${petRarityChanceText}</small></article>`;
  }else if(lobbyMetaMode==="pets"){
    const owned=Object.values(m.petsOwned||{}).reduce((a,b)=>a+(Number(b)||0),0),equipped=m.equippedPet?petInfo[m.equippedPet]?.name:T("нет","none");
    lobbyMetaContent.innerHTML=`<article class="meta-card"><div class="meta-card-row"><div><h3>${T("Инвентарь питомцев","Pet inventory")} · ${m.equippedPet?"1/1":"0/1"}</h3><p>${owned?T(`В коллекции: ${owned}. Экипирован: ${equipped}`,`In collection: ${owned}. Equipped: ${equipped}`):T("ПУСТО — питомец появится здесь только после выпадения из ящика.","EMPTY — a pet appears here only after it actually drops from a crate.")}</p></div><div class="meta-card-actions"><button id="openLobbyPetsBtn">${T("Инвентарь","Inventory")}</button><button id="openLobbyPetIndexBtn">${T("Индекс питомцев","Pet index")}</button></div></div></article>`;
  }else if(lobbyMetaMode==="achievements"){
    const ach=m.achievements||{},titles=m.titlesUnlocked||["Новичок"],selectedRaw=m.selectedTitle||"Новичок";
    lobbyMetaContent.innerHTML=`<article class="meta-card"><h3>${T("Текущий титул","Current title")}: ${displayTitle(selectedRaw)}</h3><p>${T("Титул показывается над именем в забеге.","The title is shown above your name during a run.")}</p><div class="title-picker">${titles.map(t=>`<button data-meta-title="${esc(t)}" ${t===selectedRaw?"disabled":""}>${esc(displayTitle(t))}</button>`).join("")}</div></article>`+
      Object.entries(achievementInfo).map(([id,a])=>{const status=Number(ach[id]||0),ready=status===1,claimed=status>=2,pr=achievementProgress(id,m,status),pct=Math.min(100,pr.target?pr.value/pr.target*100:0);return `<article class="meta-card ${claimed?"achievement-done":ready?"achievement-ready":""}"><div class="meta-card-row"><div><h3>${claimed?"🏆":ready?"🎁":"🔒"} ${a.name}</h3><p>${a.desc}</p><small>${T("Награда","Reward")}: ${a.gold} ${T("золота","gold")} + ${T("титул","title")} «${a.title}»</small><span class="achievement-progress-label">${T("Текущий прогресс","Current progress")}: ${claimed?pr.target:pr.value}/${pr.target} · ${pr.label}</span><div class="achievement-progress-track"><span style="width:${claimed?100:pct}%"></span></div></div><div class="meta-card-actions">${ready?`<button class="achievement-claim-btn" data-meta-achievement="${id}">${T("Забрать награду","Claim reward")}</button>`:`<span class="price-gold">${claimed?T("ПОЛУЧЕНО","CLAIMED"):T("НЕ ВЫПОЛНЕНО","NOT COMPLETED")}</span>`}</div></div></article>`}).join("");
  }else if(lobbyMetaMode==="history"){
    const hist=m.runHistory||[];lobbyMetaContent.innerHTML=hist.length?hist.map((r,i)=>`<article class="meta-card"><div class="meta-card-row"><div><h3>#${i+1} · ${T("Волна","Wave")} ${r.wave}</h3><p>${classNames[r.classId]||r.classId} · ${r.petId?(petInfo[r.petId]?.name||r.petId):T("без питомца","no pet")} · ${weaponNames[r.weapon]||r.weapon}</p></div><div class="run-history-summary"><b>${r.kills} ${T("убийств","kills")}</b><small>${r.damage} ${T("урона","damage")} · ${r.builds} ${T("построек","built")}</small></div></div></article>`).join(""):`<div class="meta-empty"><b>${T("ИСТОРИЯ ПУСТА","NO RUN HISTORY")}</b><span>${T("Заверши первый забег — здесь появятся последние 5 игр.","Finish your first run and the latest 5 games will appear here.")}</span></div>`;
  }
}

function renderPets(){
  const m=metaState||{silver:0,gold:0,petsOwned:{},equippedPet:null};
  $("petCoins").textContent=T(`Серебро: ${m.silver||0} · Золото: ${m.gold||0}`,`Silver: ${m.silver||0} · Gold: ${m.gold||0}`);
  $("petEquipCount").textContent=T(`Экипировано ${m.equippedPet?"1/1":"0/1"}${m.equippedPet?` · ${petInfo[m.equippedPet]?.name||m.equippedPet}`:""}`,`Equipped ${m.equippedPet?"1/1":"0/1"}${m.equippedPet?` · ${petInfo[m.equippedPet]?.name||m.equippedPet}`:""}`);
  $("petInventoryTab").textContent=`${T("Инвентарь","Inventory")} ${m.equippedPet?"1/1":"0/1"}`;renderPetInventory();
}
function renderPetInventory(){
  const m=metaState||{petsOwned:{},equippedPet:null},owned=Object.entries(petInfo).filter(([id])=>(m.petsOwned?.[id]||0)>0);
  if(!owned.length){$("petList").innerHTML=`<div class="meta-empty" style="grid-column:1/-1"><b>${T("ПУСТО","EMPTY")}</b><span>${T("Питомцев пока нет. Открой ящик в лобби — после выпадения питомец появится здесь. Экипировать можно максимум 1/1.","You do not own any pets yet. Open a crate in the lobby — dropped pets appear here. Maximum equipped: 1/1.")}</span></div>`;return;}
  $("petList").innerHTML=owned.map(([id,cfg])=>{const count=m.petsOwned[id],eq=m.equippedPet===id;return `<article class="pet-card"><div class="pet-top"><img class="pet-thumb" src="${cfg.img}" alt=""><div><div class="rarity rarity-${cfg.rarity}">${cfg.rarity.toUpperCase()}</div><h3>${cfg.name}</h3><div class="pet-count">${T("Количество","Amount")}: ${count}</div></div></div><p>${cfg.desc}</p><div class="pet-stats">${cfg.stats.map(x=>`<span>• ${x}</span>`).join("")}</div><div class="pet-actions-row">${eq?`<button class="pet-eq" data-unequip-pet="1">${T("Снять","Unequip")}</button>`:`<button data-equip-pet="${id}">${T("Экипировать","Equip")}</button>`}</div></article>`}).join("");
}

function renderCratePreview(){
  const m=metaState||{gold:0,crateTokens:0};
  $("crateResult").textContent=T(`Баланс: ${m.gold||0} золота · жетоны: ${m.crateTokens||0} · ${petRarityChanceText}`,`Balance: ${m.gold||0} gold · tokens: ${m.crateTokens||0} · ${petRarityChanceText}`);
  $("spinCrateBtn").disabled=crateSpinLocked||(((m.gold||0)<50)&&!(m.crateTokens>0));
  $("spinCrateBtn").textContent=(m.crateTokens||0)>0?T("Открыть за жетон","Open with token"):T("Открыть за 50 золота","Open for 50 gold");
  $("skipCrateBtn").classList.add("hidden");
  const owned=m.petsOwned||{};
  $("crateReel").innerHTML=Object.entries(petInfo).map(([id,cfg])=>(owned[id]||0)>0?`<div class="crate-card ${cfg.rarity}"><img src="${cfg.img}" alt=""><b>${cfg.name}</b><small>${cfg.rarity.toUpperCase()}</small></div>`:`<div class="crate-card ${cfg.rarity} crate-mystery"><div class="crate-question">?</div><b>${cfg.rarity.toUpperCase()}</b><small>${T("Скрыто","Hidden")}</small></div>`).join("");
  $("crateReel").style.transition="none";$("crateReel").style.transform="translateX(0)";
}
function finishCrateReveal(){
  if(!crateCurrentResult)return;
  clearTimeout(crateRevealTimer);crateRevealTimer=null;
  const cfg=petInfo[crateCurrentResult];
  $("crateResult").innerHTML=`<div class="crate-reveal"><img src="${cfg.img}" alt=""><div><small>${cfg.rarity.toUpperCase()}</small><b>${T("Выпал","Dropped")}: ${cfg.name}!</b></div></div>`;
  $("skipCrateBtn").classList.add("hidden");playSfx("coin");send("getMeta");renderIndex();
}
function showCrateSpin(payload){
  const knownBefore={...(metaState?.petsOwned||{})};
  if(payload.meta){metaState=payload.meta;renderMetaWallet();}
  crateOverlay.classList.add("visible");crateSpinLocked=true;crateCurrentResult=payload.pet;
  $("spinCrateBtn").disabled=true;$("skipCrateBtn").classList.remove("hidden");
  const reel=$("crateReel");
  reel.innerHTML=(payload.reel||[]).map(id=>{const cfg=petInfo[id]||petInfo.panda,known=(knownBefore[id]||0)>0;return known?`<div class="crate-card ${cfg.rarity}"><img src="${cfg.img}" alt=""><b>${cfg.name}</b><small>${cfg.rarity.toUpperCase()}</small></div>`:`<div class="crate-card ${cfg.rarity} crate-mystery"><div class="crate-question">?</div><b>${cfg.rarity.toUpperCase()}</b><small>?</small></div>`;}).join("");
  reel.style.transition="none";reel.style.transform="translateX(0px)";$("crateResult").textContent=`${T("Барабан крутится...","Reel spinning...")} · ${petRarityChanceText}`;
  const cardW=138,stopIndex=24,center=(reel.parentElement?.clientWidth||840)/2,stop=Math.max(0,stopIndex*cardW+64-center);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{reel.style.transition="transform 5s cubic-bezier(.10,.78,.08,1)";reel.style.transform=`translateX(-${stop}px)`;}));
  clearTimeout(crateRevealTimer);crateRevealTimer=setTimeout(finishCrateReveal,5200);
  clearTimeout(activeCrateAnimation);activeCrateAnimation=setTimeout(()=>{
    const finalPet=crateCurrentResult;crateSpinLocked=false;renderCratePreview();
    if(finalPet){const cfg=petInfo[finalPet];$("crateResult").innerHTML=`<div class="crate-reveal"><img src="${cfg.img}" alt=""><div><small>${cfg.rarity.toUpperCase()}</small><b>${T("Выпал","Dropped")}: ${cfg.name}!</b></div></div>`;}
    crateCurrentResult=null;
  },5700);
}
function openPause(){
  if(!state?.started)return;pauseOpen=true;pauseOverlay.classList.add("visible");$("pauseMainMenu").classList.remove("hidden");$("pauseSettingsPanel").classList.add("hidden");stopGameInput();
  const solo=roomMode==="solo";$("pauseModeNote").textContent=solo?T("SOLO поставлен на паузу: зомби, пули и таймеры остановлены.","SOLO is paused: zombies, bullets and timers are frozen."):T("КООП продолжает идти: меню не останавливает игру для второго игрока.","CO-OP keeps running: this menu does not pause the world for the other player.");
  if(solo)send("setPaused",{paused:true});
}
function closePause(){pauseOpen=false;pauseOverlay.classList.remove("visible");if(roomMode==="solo"&&state?.started)send("setPaused",{paused:false});}
function syncSettingsUi(){
  $("settingAudioEnabled").checked=!!settings.audioEnabled;$("settingSfxVolume").value=settings.sfxVolume;$("settingAmbientVolume").value=settings.ambientVolume;$("settingFootsteps").checked=!!settings.footsteps;
  $("settingPerformanceHud").checked=!!settings.performanceHud;
  const adminAllowed=!!state?.qaAdminEnabled;$("settingAdminVisible").checked=adminAllowed&&!!settings.adminVisible;$("settingAdminVisible").disabled=!adminAllowed;$("settingAdminVisible").closest("label")?.classList.toggle("hidden",!adminAllowed);
  adminGameBtn.classList.toggle("hidden",!(adminAllowed&&settings.adminVisible&&state?.started));if(!(adminAllowed&&settings.adminVisible))adminGamePanel.classList.remove("visible");
}

function renderRoster(ps,hostId=null){
  roster.innerHTML=ps.map(p=>`<div class="player-card"><span>${p.id===hostId?"👑":"•"} ${p.slot===1?"🟢":"🔵"} ${esc(p.name)} — ${classNames[p.character]||T("Стартовый","Starter")}</span><b>${T("ур.","lvl")} ${p.level}</b></div>`).join("");
}

const talentDefs={
  survivor_hp:{
    name:"Живучесть",max:5,values:[0,20,45,75,110,150],kind:"hp",
    desc:"Увеличивает максимальное здоровье."
  },
  survivor_speed:{
    name:"Выносливость",max:5,values:[0,4,8,12,16,20],kind:"speed",
    desc:"Повышает скорость передвижения."
  },
  gun_damage:{
    name:"Оружейник",max:8,values:[0,5,10,15,20,25,30,35,40],kind:"percent",
    desc:"Повышает урон всего оружия."
  },
  gun_rate:{
    name:"Быстрые руки",max:5,values:[0,4,8,12,16,20],kind:"percent",
    desc:"Увеличивает скорострельность и темп атак."
  },
  gather:{
    name:"Добытчик",max:10,values:[0,8,16,24,32,40,50,60,70,80,90],kind:"percent",
    desc:"Быстрее ломает ресурсы и получает больше добычи."
  },
  builder:{
    name:"Строитель",max:6,values:[0,10,20,30,40,50,60],kind:"percent",
    desc:"Новые постройки получают больше прочности."
  },
  medic:{
    name:"Полевой медик",max:4,values:[0,20,40,65,90],kind:"percent",
    desc:"Быстрее поднимает погибшего напарника."
  }
};

function classBaseHp(p){
  const lvl=p.skills?.survivor_hp||0;
  const invested=talentDefs.survivor_hp.values[lvl]||0;
  return Math.max(1,(p.maxHp||({starter:115,shooter:108,cqc:150,flame:140,soap:100}[p.character]||100))-invested);
}
function classBaseSpeed(p){
  return 285*({starter:1,shooter:1.02,cqc:1.15,flame:1.12,soap:1.08}[p.character]||1);
}
function talentValueText(p,key,level){
  const t=talentDefs[key],value=t.values[level]||0;
  if(key==="survivor_hp")return `HP ${classBaseHp(p)+value}`;
  if(key==="survivor_speed")return `${T("Скорость","Speed")} ${Math.round(classBaseSpeed(p)*(1+value/100))}`;
  if(key==="gun_damage")return `${T("Урон","Damage")} +${value}%`;
  if(key==="gun_rate")return `${T("Темп","Rate")} +${value}%`;
  if(key==="gather")return `${T("Добыча","Gathering")} +${value}%`;
  if(key==="builder")return `${T("Прочность","Durability")} +${value}%`;
  if(key==="medic")return `${T("Поднятие","Revive")} +${value}%`;
  return String(value);
}



function structureUpgradeCost(st){
  const cfg=buildCosts[st.type]; if(!cfg)return null;
  const lvl=st.level||1; if(lvl>=5)return null;
  const f=.62+lvl*.58;
  return {wood:Math.max(1,Math.ceil((cfg.wood||0)*f)),stone:Math.max(0,Math.ceil((cfg.stone||0)*f)),scrap:Math.max(0,Math.ceil((cfg.scrap||0)*f))};
}

function nearestStructure(p,max=145){
  let best=null,bd=max;
  for(const st of state.structures){
    const d=Math.hypot(st.x-p.x,st.y-p.y);
    if(d<bd){bd=d;best=st}
  }
  return best;
}
function nearestDamagedStructureForRepair(p,max=88){
  let best=null,bd=max;
  for(const st of state.structures||[]){
    if((st.hp??0)>=(st.maxHp??0))continue;
    const d=localDistanceToStructure(p.x,p.y,st);
    if(d<bd){bd=d;best=st;}
  }
  return best;
}

function canAfford(inv,c){
  return (inv.wood||0)>=(c.wood||0) && (inv.stone||0)>=(c.stone||0) && (inv.scrap||0)>=(c.scrap||0);
}
function missingCost(inv,c){return {wood:Math.max(0,(c?.wood||0)-(inv?.wood||0)),stone:Math.max(0,(c?.stone||0)-(inv?.stone||0)),scrap:Math.max(0,(c?.scrap||0)-(inv?.scrap||0))};}
function missingCostText(inv,c){
  const m=missingCost(inv,c),parts=[];
  if(m.wood)parts.push(T(`${m.wood} дерева`,`${m.wood} wood`));
  if(m.stone)parts.push(T(`${m.stone} камня`,`${m.stone} stone`));
  if(m.scrap)parts.push(T(`${m.scrap} металла`,`${m.scrap} scrap`));
  return parts.join(", ");
}
function structureRepairPlan(st){
  if(!st||st.hp>=st.maxHp)return null;const cfg=buildCosts[st.type];if(!cfg)return null;
  const missing=Math.max(0,st.maxHp-st.hp),chunk=Math.max(24,st.maxHp*.30),amount=Math.min(missing,chunk),fraction=Math.max(.18,amount/chunk),factor=.12*fraction*(state?.nightModifier?.repair||1);
  const cost={wood:0,stone:0,scrap:0};for(const k of ["wood","stone","scrap"]){const base=cfg[k]||0;cost[k]=base>0?Math.max(1,Math.ceil(base*factor)):0;}
  return {amount,cost};
}

function runShopItemName(id){return id==="heal"?T("Аптечка","Medkit"):(weaponNames[id]||id);}
function renderRunShop(force=false){
  const p=myPlayer();if(!p)return;
  const coreNear=state?.core&&Math.hypot(p.x-state.core.x,p.y-state.core.y)<RUN_SHOP_RADIUS;
  if(!coreNear){closeRunShop();return;}
  const sig=JSON.stringify([lang,p.weapon?.type,p.inventory?.wood||0,p.inventory?.stone||0,p.inventory?.scrap||0,p.inventory?.medkits||0,pendingRunBuy?.item||""]);
  if(!force&&sig===runShopRenderSig)return;
  runShopRenderSig=sig;
  $("runShopTag").textContent=T("ПОЛЕВОЙ МАГАЗИН","FIELD SHOP");
  $("runShopTitle").textContent=T("Оружие и аптечки","Weapons & medkits");
  $("runShopNote").textContent=T("Магазин работает только рядом с базой. Покупки действуют в текущем забеге.","The shop works only near the base. Purchases last for the current run.");
  $("runShopContent").innerHTML=Object.entries(runShopInfo).map(([id,cfg])=>{
    const current=id!=="heal"&&p.weapon?.type===id;
    const affordable=canAfford(p.inventory,cfg.cost);
    const pending=pendingRunBuy?.item===id;
    const image=id==="heal"?`<div class="run-shop-icon">🩹</div>`:`<img src="${weaponImagePaths[id]}" alt="">`;
    const waveHint=cfg.waveHint?T(` · ориентир: волна ${cfg.waveHint}`,` · target: wave ${cfg.waveHint}`):"";
    const desc=id==="heal"?T("Добавляет одну аптечку в слот 3.","Adds one medkit to slot 3."):T(`Оружие для текущего забега${waveHint}. Покупка сразу экипирует его.`,`Weapon for the current run${waveHint}. Buying it equips it immediately.`);
    const label=pending?T("ПОКУПКА…","BUYING…"):current?T("ТЕКУЩЕЕ","EQUIPPED"):T("Купить","Buy");
    return `<article class="run-shop-card">${image}<div><h3>${runShopItemName(id)}</h3><p>${desc}</p></div><div class="run-shop-bottom"><span class="run-shop-cost">${costText(cfg.cost)}</span><button data-run-buy="${id}" ${(!affordable||current||!!pendingRunBuy)?"disabled":""}>${label}</button></div></article>`;
  }).join("");
}
function openRunShop(){
  const p=myPlayer();if(!p||!state?.core||Math.hypot(p.x-state.core.x,p.y-state.core.y)>=RUN_SHOP_RADIUS){toast(T("Магазин работает у генератора","The shop works near the generator"));return;}
  runShopRenderSig="";renderRunShop(true);runShopOverlay.classList.add("visible");stopGameInput();playSfx("ui");
}
function closeRunShop(){runShopOverlay.classList.remove("visible");pendingRunBuy=null;runShopRenderSig="";}

function multitoolName(level){return ["",T("Старый мультитул","Old multitool"),T("Железный мультитул","Iron multitool"),T("Золотой мультитул","Golden multitool"),T("Изумрудный мультитул","Emerald multitool"),T("Алмазный мультитул","Diamond multitool")][level]||T("Мультитул","Multitool");}
const multitoolUpgradeCosts={2:{wood:16,stone:12,scrap:42},3:{wood:28,stone:24,scrap:88},4:{wood:44,stone:40,scrap:155},5:{wood:68,stone:64,scrap:260}};
const weaponUpgradeCosts={2:{wood:12,stone:8,scrap:45},3:{wood:22,stone:18,scrap:90},4:{wood:36,stone:32,scrap:165},5:{wood:56,stone:52,scrap:285}};
function multitoolMini(level){return `<div class="multitool-mini tool-level-${level}"><i></i><b></b></div>`;}
function renderRunUpgrade(force=false){
  const p=myPlayer();if(!p)return;const near=state?.core&&Math.hypot(p.x-state.core.x,p.y-state.core.y)<RUN_SHOP_RADIUS;if(!near){closeRunUpgrade();return;}
  const kind=runUpgradeTab==="multitool"?"multitool":"weapon",level=Math.max(1,Math.min(5,Number(kind==="multitool"?p.multitoolLevel:p.weaponLevel)||1)),next=Math.min(5,level+1),cost=(kind==="multitool"?multitoolUpgradeCosts:weaponUpgradeCosts)[next];
  const sig=JSON.stringify([lang,kind,level,p.weapon?.type,p.inventory?.wood,p.inventory?.stone,p.inventory?.scrap,pendingRunUpgrade?.kind]);if(!force&&sig===runUpgradeRenderSig)return;runUpgradeRenderSig=sig;
  document.querySelectorAll("[data-upgrade-tab]").forEach(b=>b.classList.toggle("active",b.dataset.upgradeTab===kind));
  $("runUpgradeTag").textContent=T("МАСТЕРСКАЯ ГЕНЕРАТОРА","GENERATOR WORKSHOP");$("runUpgradeTitle").textContent=T("Улучшение снаряжения","Equipment upgrades");
  const maxed=level>=5,affordable=!maxed&&canAfford(p.inventory,cost),pending=pendingRunUpgrade?.kind===kind;
  const oldName=kind==="multitool"?multitoolName(level):`${weaponNames[p.weapon.type]||T("Оружие","Weapon")} · ${T("ур.","lvl")} ${level}`;
  const nextName=kind==="multitool"?multitoolName(next):`${weaponNames[p.weapon.type]||T("Оружие","Weapon")} · ${T("ур.","lvl")} ${next}`;
  const oldVisual=kind==="multitool"?multitoolMini(level):`<img src="${weaponImagePaths[p.weapon.type]||weaponImagePaths.pistol}" alt="">`,nextVisual=kind==="multitool"?multitoolMini(next):`<img src="${weaponImagePaths[p.weapon.type]||weaponImagePaths.pistol}" alt="">`;
  const gain=maxed?T("Максимальная мощность достигнута","Maximum power reached"):kind==="multitool"?T("Быстрее добыча, больше урон по ресурсам и дополнительный лут.","Faster gathering, more resource damage and bonus loot."):T("+16% урона и +4.5% скорострельности за уровень.","+16% damage and +4.5% fire rate per level.");
  $("runUpgradeContent").innerHTML=`<div class="equipment-compare"><article>${oldVisual}<small>${T("Сейчас","Current")}</small><b>${oldName}</b></article><span class="upgrade-arrow">→</span><article class="next">${nextVisual}<small>${maxed?"MAX":T("После улучшения","After upgrade")}</small><b>${nextName}</b></article></div><p class="equipment-gain">${gain}</p><button class="equipment-upgrade-button" data-run-upgrade="${kind}" ${maxed||!affordable||pendingRunUpgrade?"disabled":""}>${pending?T("УЛУЧШАЕМ…","UPGRADING…"):maxed?"MAX":`${T("УЛУЧШИТЬ","UPGRADE")} · ${costText(cost)}`}</button>`;
}
function openRunUpgrade(){const p=myPlayer();if(!p||!state?.core||Math.hypot(p.x-state.core.x,p.y-state.core.y)>=RUN_SHOP_RADIUS){toast(T("Мастерская работает у генератора","The workshop works near the generator"));return;}runUpgradeRenderSig="";renderRunUpgrade(true);runUpgradeOverlay.classList.add("visible");stopGameInput();playSfx("ui");}
function closeRunUpgrade(){runUpgradeOverlay.classList.remove("visible");pendingRunUpgrade=null;runUpgradeRenderSig="";}

function hoveredStructureAtCursor(p,maxPlayerDistance=165){
  if(!state||!p||activeTool!=="multitool"||selectedBuild)return null;
  const wx=mouse.x+camera.x,wy=mouse.y+camera.y;
  let best=null,bestCursor=18;
  for(const st of state.structures||[]){
    if(localDistanceToStructure(p.x,p.y,st)>maxPlayerDistance)continue;
    const cursorDist=localDistanceToStructure(wx,wy,st);
    if(cursorDist<=bestCursor){bestCursor=cursorDist;best=st;}
  }
  return best;
}
function selectedStructure(){return state?.structures?.find(st=>st.id===selectedStructureId)||null;}
function structureStats(st){
  if(!st)return [];
  const power=st.power||1;
  const axolotlMult=state?.players?.some(pp=>pp.equippedPet==="axolotl")?1.35:1;
  const towerMult=(state?.core?.turret||1)*power*axolotlMult;
  if(st.type==="cannon")return [T(`Урон ядра: ${(34*towerMult).toFixed(1)}`,`Cannonball damage: ${(34*towerMult).toFixed(1)}`),T("Пробитие: до 5 врагов","Pierce: up to 5 enemies"),T("Темп: 1 выстрел / 1.25 сек · дальность 520","Rate: 1 shot / 1.25 sec · range 520")];
  if(st.type==="tesla")return [T(`Урон первого разряда: ${(18*towerMult).toFixed(1)}`,`First zap damage: ${(18*towerMult).toFixed(1)}`),T("Цепь: до 4 врагов","Chain: up to 4 enemies"),T("Темп: 1 разряд / 0.72 сек · дальность 400","Rate: 1 zap / 0.72 sec · range 400")];
  if(st.type==="cat_tower")return [T(`Урон лапки: ${(28*towerMult).toFixed(1)}`,`Paw damage: ${(28*towerMult).toFixed(1)}`),T("Атака только вблизи · дальность 125","Close-range attack · range 125"),T("Темп: 1 удар / 0.56 сек","Rate: 1 swat / 0.56 sec")];
  if(st.type==="frost_tower")return [T(`Урон льдом: ${(13*towerMult).toFixed(1)}`,`Ice damage: ${(13*towerMult).toFixed(1)}`),T("Замедление: 1.55 сек","Slow: 1.55 sec"),T("Темп: 1 выстрел / 0.88 сек · дальность 430","Rate: 1 shot / 0.88 sec · range 430")];
  if(st.type==="flame_tower")return [T(`Урон струи: ${(8.5*towerMult).toFixed(1)}`,`Flame hit: ${(8.5*towerMult).toFixed(1)}`),T("Поджигает до 6 врагов рядом","Ignites up to 6 nearby enemies"),T("Радиус: 185 · импульс каждые 0.42 сек","Radius: 185 · pulse every 0.42 sec")];
  if(st.type==="spikes"){
    const damage=15*power*axolotlMult;
    return [T(`Урон за срабатывание: ${damage.toFixed(1)}`,`Damage per trigger: ${damage.toFixed(1)}`),T(`Срабатывание: раз в 0.4 сек`,`Trigger: every 0.4 sec`),T(`Эффект: замедление`,`Effect: slow`)];
  }
  if(st.type==="gate")return [T("Пропускает игроков, блокирует зомби","Lets players through, blocks zombies")];
  return [T("Прочная секция обороны","Solid defensive section")];
}

function renderStructureMenu(){
  const st=selectedStructure();
  if(!st){closeStructureMenu();return;}
  const lvl=st.level||1,cost=structureUpgradeCost(st),p=myPlayer(),canUp=!!cost&&lvl<5&&p&&canAfford(p.inventory,cost),repairPlan=structureRepairPlan(st);
  $("structureMenuTag").textContent=T("МУЛЬТИТУЛ · ПОСТРОЙКА","MULTITOOL · STRUCTURE");
  $("structureMenuTitle").textContent=buildLabel[st.type]||st.type;
  $("structureMenuHp").textContent=`${Math.ceil(st.hp)} / ${Math.ceil(st.maxHp)} HP`;
  $("structureMenuLevel").textContent=`${T("Уровень","Level")} ${lvl} / 5`;
  const stats=structureStats(st);
  $("structureMenuSummary").innerHTML=stats.map(x=>`<div>${esc(x)}</div>`).join("");
  const repair=$("structureRepairBtn");
  repair.classList.toggle("hidden",!repairPlan);
  if(repairPlan){const missing=p&&!canAfford(p.inventory,repairPlan.cost)?missingCostText(p.inventory,repairPlan.cost):"";repair.disabled=false;repair.textContent=T(`🔧 Отремонтировать +${Math.ceil(repairPlan.amount)} HP · ${costText(repairPlan.cost)}${missing?` · не хватает: ${missing}`:""}`,`🔧 Repair +${Math.ceil(repairPlan.amount)} HP · ${costText(repairPlan.cost)}${missing?` · missing: ${missing}`:""}`);}
  const up=$("structureUpgradeBtn");
  up.disabled=lvl>=5||!cost;
  const upMissing=cost&&p&&!canAfford(p.inventory,cost)?missingCostText(p.inventory,cost):"";
  up.textContent=lvl>=5?T("МАКСИМАЛЬНЫЙ УРОВЕНЬ","MAX LEVEL"):cost?T(`Улучшить → ур. ${lvl+1} · ${costText(cost)}${upMissing?` · не хватает: ${upMissing}`:""}`,`Upgrade → lvl ${lvl+1} · ${costText(cost)}${upMissing?` · missing: ${upMissing}`:""}`):T("Улучшить","Upgrade");
  $("structureInfoBody").classList.toggle("hidden",!structureInfoExpanded);
  $("structureInfoBtn").classList.toggle("active",structureInfoExpanded);
  $("structureInfoBody").innerHTML=`<b>${esc(buildLabel[st.type]||st.type)}</b><p>${esc(buildDescriptions[st.type]||"")}</p><p>${stats.map(esc).join(" · ")}</p><p>${T("Удаление не возвращает ресурсы.","Removing a structure does not refund resources.")}</p>`;
  $("structureRemoveBtn").textContent=structureDeleteArmed?T("Точно удалить?","Remove for sure?"):T("Удалить","Remove");
}

function openStructureMenu(st){
  if(!st)return;
  selectedStructureId=st.id;structureInfoExpanded=false;structureDeleteArmed=false;mouse.down=false;
  renderStructureMenu();structureMenuOverlay.classList.add("visible");stopGameInput();playSfx("ui");
}
function closeStructureMenu(){selectedStructureId=null;structureInfoExpanded=false;structureDeleteArmed=false;structureMenuOverlay.classList.remove("visible");}

function updateUnifiedUI(force=false){
  const p=myPlayer();if(!p)return;
  updateWeaponHotbar(p);
  updateMedkitHotbar(p);
  const now=performance.now();
  if(!force && now-lastUiUpdate<90)return;
  lastUiUpdate=now;

  const talentSig=JSON.stringify([p.skillPoints,p.level,p.skills]);
  if(force || talentSig!==lastTalentSig){
    lastTalentSig=talentSig;
    $("talentPoints").textContent=T(`${p.skillPoints} очк.`,`${p.skillPoints} pts`);
    $("talentLevel").textContent=`${T("ур.","lvl")} ${p.level}`;
    $("talentList").innerHTML=Object.entries(talentDefs).map(([k,t])=>{
      const lvl=p.skills[k]||0;
      const maxed=lvl>=t.max;
      const current=talentValueText(p,k,lvl);
      const next=maxed?current:talentValueText(p,k,lvl+1);

      return `<div class="talent-mini">
        <div class="talent-title-row">
          <b>${isEn()?(talentDefsEn[k]?.name||t.name):t.name}</b>
          <span class="talent-rank">${T("ур.","lvl")} ${lvl}/${t.max}</span>
        </div>
        <small>${isEn()?(talentDefsEn[k]?.desc||t.desc):t.desc}</small>
        <div class="talent-change ${maxed?"maxed":""}">
          <span>${current}</span>
          <b>${maxed?"MAX":"→"}</b>
          <span>${maxed?"":next}</span>
        </div>
        <button data-skill="${k}" ${p.skillPoints<=0||maxed?"disabled":""}>
          ${maxed?T("Максимум","Maximum"):T(`Улучшить до ур. ${lvl+1}`,`Upgrade to lvl ${lvl+1}`)}
        </button>
      </div>`;
    }).join("");
    talentDock.classList.toggle("attention",p.skillPoints>0);
  }

  const wallMode=isWallBuild(selectedBuild);
  $("wallBuildHud")?.classList.toggle("hidden",!wallMode);
  const snapToggle=$("wallSnapToggle");
  if(snapToggle){snapToggle.setAttribute("aria-pressed",String(wallSnapEnabled));snapToggle.classList.toggle("active",wallSnapEnabled);const label=snapToggle.querySelector("strong");if(label)label.textContent=wallSnapEnabled?T("Магнит: ВКЛ","Snap: ON"):T("Магнит: ВЫКЛ","Snap: OFF");}

  document.querySelectorAll(".slot.tool").forEach(b=>b.classList.toggle("selected",!selectedBuild&&b.dataset.tool===activeTool));
  document.querySelectorAll(".slot.build").forEach(b=>b.classList.toggle("selected",b.dataset.build===selectedBuild));

  const affordSig=JSON.stringify([p.inventory.wood,p.inventory.stone,p.inventory.scrap,state?.nextBuildCosts,state?.structureCounts,state?.structureLimits]);
  if(force || affordSig!==lastAffordSig){
    lastAffordSig=affordSig;
    document.querySelectorAll(".slot.build").forEach(b=>{
      const type=b.dataset.build,cost=currentBuildCost(type),count=currentBuildCount(type),limit=currentBuildLimit(type);
      b.classList.toggle("unaffordable",!canAfford(p.inventory,cost)||count>=limit);
      let badge=b.querySelector(".slot-limit");
      if(Number.isFinite(limit)){
        if(!badge){badge=document.createElement("span");badge.className="slot-limit";b.appendChild(badge);}
        badge.textContent=`${count}/${limit}`;
        badge.classList.toggle("full",count>=limit);
      }else if(badge)badge.remove();
    });
  }

  const buttons=[];
  const showSkip=state.phase==="day"&&isHost;
  if(showSkip){
    buttons.push(`<button class="skip-wave" data-context-action="skipPrep">⏩ ${T(`Начать волну ${state.wave+1} сейчас · пропустить`,`Start wave ${state.wave+1} now · skip`)} <span class="skip-live-time">${Math.max(0,state.phaseTimer).toFixed(1)}</span>${T("с подготовки","s prep")}</button>`);
  }
  if(state.phase==="day"&&state.modifierOffer){
    const o=state.modifierOffer,accepted=!!o.accepted;
    buttons.push(`<button class="risk-vote ${accepted?"accepted":""}" data-context-action="voteModifier" ${accepted?"disabled":""}>${accepted?T("✓ РИСК ПРИНЯТ","✓ RISK ACCEPTED"):T("⚠ ПРИНЯТЬ РИСК","⚠ ACCEPT RISK")}: ${modifierDisplayName(o)} · ${T("награды","rewards")} ×${Number(o.reward||1).toFixed(2)} · ${o.votes||0}/${o.needed||1}</button>`);
  }
  const coreDist=Math.hypot(p.x-state.core.x,p.y-state.core.y);
  const nearCore=coreDist<RUN_SHOP_RADIUS;
  const coreDamaged=state.core.hp<state.core.maxHp;
  if(nearCore){
    if(coreDamaged){
      const repairOk=canAfford(p.inventory,coreRepairCost);
      buttons.push(`<button class="repair" data-context-action="coreRepair" ${repairOk?"":"disabled"}>🔧 ${T("Ремонт базы","Repair base")} +260 HP · ${costText(coreRepairCost)}</button>`);
    }
    if(state.core.level<5 && state.nextCoreCost){
      const cost=state.nextCoreCost;
      const ok=canAfford(p.inventory,cost);
      buttons.push(`<button class="upgrade" data-context-action="coreUpgrade" ${ok?"":"disabled"}>⬆ ${T("База ур.","Base lvl")} ${state.core.level} → ${state.core.level+1} · ${costText(cost)}</button>`);
    }
  }

  // IMPORTANT: do not include the live timer or exact base HP in the signature.
  // Otherwise the whole button DOM gets destroyed/recreated under the mouse and appears to blink.
  const contextSig=JSON.stringify([
    state.phase,state.wave,isHost,state.modifierOffer?.id||"",state.modifierOffer?.votes||0,state.modifierOffer?.accepted||false,nearCore,coreDamaged,state.core.level,state.core.maxHp,
    p.inventory.wood,p.inventory.stone,p.inventory.scrap
  ]);
  if(force || contextSig!==lastContextSig){
    lastContextSig=contextSig;
    contextActions.innerHTML=buttons.join("");
  }
  const liveSkip=contextActions.querySelector(".skip-live-time");
  if(liveSkip)liveSkip.textContent=Math.max(0,state.phaseTimer).toFixed(1);
}
contextActions.addEventListener("click",e=>{
  const b=e.target.closest("[data-context-action]");
  if(!b||b.disabled)return;
  const action=b.dataset.contextAction;
  if(action==="skipPrep")send("skipPrep");
  if(action==="runShop")openRunShop();
  if(action==="voteModifier")send("voteModifier",{accept:!state?.modifierOffer?.voted});
  if(action==="coreRepair")send("coreRepair");
  if(action==="coreUpgrade")send("coreUpgrade");
});

function updateCoreActions(){
  const el=$("coreActions"),p=myPlayer();if(!el)return;
  const near=!!(state?.started&&p&&state?.core&&Math.hypot(p.x-state.core.x,p.y-state.core.y)<RUN_SHOP_RADIUS);
  el.classList.toggle("hidden",!near);if(!near)return;
  const pos=sc(state.core.x,state.core.y);el.style.left=`${pos.x}px`;el.style.top=`${pos.y+92}px`;
}

$("talentList").addEventListener("click",e=>{
  const b=e.target.closest("[data-skill]");
  if(b&&!b.disabled)send("skill",{skill:b.dataset.skill});
});
$("wallSnapToggle").onclick=()=>{wallSnapEnabled=!wallSnapEnabled;updateUnifiedUI(true);playSfx("ui");};

function selectTool(tool){
  const same=!selectedBuild&&activeTool===tool;
  activeTool=same?"hands":tool;
  selectedBuild=null;
  if(structureMenuOverlay.classList.contains("visible"))closeStructureMenu();
  updateUnifiedUI(true);
}
document.querySelectorAll(".slot.tool").forEach(b=>b.onclick=()=>selectTool(b.dataset.tool));

document.querySelectorAll(".slot.build").forEach(b=>{
  b.onclick=()=>{
    const type=b.dataset.build,limit=currentBuildLimit(type),count=currentBuildCount(type);
    if(count>=limit){toast(T(`Лимит: ${buildLabel[type]} ${count}/${limit}`,`Limit: ${buildLabel[type]} ${count}/${limit}`));return;}
    selectedBuild = selectedBuild===type ? null : type;
    if(selectedBuild&&!isWallBuild(selectedBuild))buildRotation=0;
    if(selectedBuild) mouse.down=false;
    updateUnifiedUI(true);
  };
  b.addEventListener("mouseenter",e=>{
    const type=b.dataset.build,c=currentBuildCost(type);
    const p=myPlayer();
    const affordable=p?canAfford(p.inventory,c):false;
    tooltip.innerHTML=`<b>${buildLabel[type]}</b><span>${buildDescriptions[type]}</span>`+
      `<div class="price-line ${affordable?"can-afford":"cannot-afford"}">${costText(c)} ${affordable?"✓":T(`— не хватает: ${missingCostText(p.inventory,c)}`,`— missing: ${missingCostText(p.inventory,c)}`)}</div>`+
      `<div class="price-line">${Number.isFinite(currentBuildLimit(type))?T(`Лимит на поле: ${currentBuildCount(type)}/${currentBuildLimit(type)}`,`Field limit: ${currentBuildCount(type)}/${currentBuildLimit(type)}`):""}</div>`+
      `<div class="price-line">${T("Следующая постройка этого типа может стоить дороже.","The next structure of this type may cost more.")}</div>`+
      `<div class="price-line">${T("После установки: до 5 уровней улучшения.","After placement: up to 5 upgrade levels.")}</div>`;
    tooltip.classList.add("visible");
  });
  b.addEventListener("mousemove",e=>{
    tooltip.style.left=Math.min(innerWidth-220,e.clientX+14)+"px";
    tooltip.style.top=Math.max(10,e.clientY-105)+"px";
  });
  b.addEventListener("mouseleave",()=>tooltip.classList.remove("visible"));
});

function handleEscapeKey(e){
  if(e.code!=="Escape"&&e.key!=="Escape")return false;
  e.preventDefault();
  if(isTypingInUi(e.target)&&typeof e.target.blur==="function")e.target.blur();
  if(structureMenuOverlay.classList.contains("visible"))closeStructureMenu();
  else if(crateOverlay.classList.contains("visible"))crateOverlay.classList.remove("visible");
  else if(petOverlay.classList.contains("visible"))petOverlay.classList.remove("visible");
  else if(lobbyMetaOverlay.classList.contains("visible"))lobbyMetaOverlay.classList.remove("visible");
  else if(indexOverlay.classList.contains("visible"))indexOverlay.classList.remove("visible");
  else if(exitConfirmOverlay.classList.contains("visible"))closeExitRunConfirm();
  else if(runUpgradeOverlay.classList.contains("visible"))closeRunUpgrade();
  else if(runShopOverlay.classList.contains("visible"))closeRunShop();
  else if(adminGamePanel.classList.contains("visible"))adminGamePanel.classList.remove("visible");
  else if(pauseOverlay.classList.contains("visible"))closePause();
  else if(state?.started)openPause();
  else {selectedBuild=null;updateUnifiedUI(true);}
  return true;
}
addEventListener("keydown",e=>{
  if(handleEscapeKey(e))return;
  // Never steal W/A/S/D, digits, etc. while the user is typing a nickname/room code.
  if(isTypingInUi(e.target))return;

  keys.add(e.code);
  if(["KeyW","KeyA","KeyS","KeyD","ShiftLeft","ShiftRight"].includes(e.code))e.preventDefault();
  if(e.code==="Digit1")selectTool("gun");
  if(e.code==="Digit2")selectTool("multitool");
  if(e.code==="Digit3"&&state?.started){ send("useMedkit"); playSfx("heal"); }
  if(e.code==="KeyR"&&state?.started&&activeTool==="gun"&&!meleeWeapons.has(myPlayer()?.weapon?.type))send("reload");
});
addEventListener("keyup",e=>{
  if(isTypingInUi(e.target))return;
  keys.delete(e.code);
});
document.addEventListener("focusin",e=>{
  if(isTypingInUi(e.target))stopGameInput();
});
addEventListener("blur",stopGameInput);

canvas.addEventListener("mousemove",e=>{mouse.x=e.clientX;mouse.y=e.clientY});
canvas.addEventListener("mousedown",e=>{
  if(e.button===2){selectedBuild=null;updateUnifiedUI();e.preventDefault();return;}
  if(e.button!==0)return;

  if(selectedBuild){
    const p=myPlayer();if(!p)return;
    const limit=currentBuildLimit(selectedBuild),count=currentBuildCount(selectedBuild);
    if(count>=limit){toast(T(`Лимит: ${buildLabel[selectedBuild]} ${count}/${limit}`,`Limit: ${buildLabel[selectedBuild]} ${count}/${limit}`));selectedBuild=null;updateUnifiedUI(true);return;}
    const g=getBuildGhost(p);
    if(!canAfford(p.inventory,currentBuildCost(selectedBuild))){const miss=missingCostText(p.inventory,currentBuildCost(selectedBuild));toast(T(`Не хватает: ${miss}`,`Missing: ${miss}`));return;}
    if(!localPlacementOkay(p,g)){toast(T("Здесь нельзя поставить","Cannot place here"));return;}
    send("build",{structure:selectedBuild,x:g.x,y:g.y,rotation:isWallBuild(selectedBuild)?buildRotation:0});
    playSfx("build");
    return;
  }
  if(activeTool==="multitool"){
    const p=myPlayer(),target=hoveredStructureAtCursor(p);
    if(target){openStructureMenu(target);return;}
  }
  mouse.down=true;
});
canvas.addEventListener("contextmenu",e=>e.preventDefault());
addEventListener("mouseup",e=>{if(e.button===0)mouse.down=false});
canvas.addEventListener("wheel",e=>{
  if(!state||!selectedBuild)return;
  e.preventDefault();
  if(!isWallBuild(selectedBuild)){e.preventDefault();return;}
  const step=Math.PI/2;
  buildRotation += Math.sign(e.deltaY)*step;
},{passive:false});

setInterval(()=>{
  if(!joined||!state)return;
  const p=myPlayer();if(!p)return;

  // Lobby/form fields own the keyboard completely.
  if(isTypingInUi() || gameplayUiBlocked()){
    return;
  }

  mouse.wx=mouse.x+camera.x;mouse.wy=mouse.y+camera.y;
  const aimBase=(localPred&&p.id===myId)?localPred:p;
  const aimScreen=sc(aimBase.x,aimBase.y);
  const a=norm(mouse.x-aimScreen.x,mouse.y-aimScreen.y);

  const firing = mouse.down && !selectedBuild && activeTool==="gun" && !p.weaponAmmo?.reloading && (meleeWeapons.has(p.weapon.type)||(p.weaponAmmo?.mag??1)>0);
  send("input",{
    up:keys.has("KeyW"),down:keys.has("KeyS"),left:keys.has("KeyA"),right:keys.has("KeyD"),sprint:keys.has("ShiftLeft")||keys.has("ShiftRight"),
    shoot:firing,ax:a.x,ay:a.y
  });

  const now=performance.now();

  if(firing){
    const baseRate=weaponRateMs[p.weapon.type]||250;
    const fireRateMult=1+(p.skills?.gun_rate||0)*.08;
    const visualRate=baseRate/fireRateMult;
    if(now-lastLocalShotFx>=visualRate*.92){
      lastLocalShotFx=now;
      if(meleeWeapons.has(p.weapon.type)){
        toolSwingStart=now;
        playSfx("swing");
      }else{
        muzzleFlashUntil=now+48;
        playSfx(p.weapon.type==="bubble_blaster"?"bubble":p.weapon.type==="micro_uzi"?"uzi":p.weapon.type==="ump"?"ump":"gun");
      }
    }
  }

  if(mouse.down && !selectedBuild && activeTool==="multitool"){
    if(now-lastHarvest>240){
      const target=nearestResource(p,82);
      if(target){send("harvest");triggerHarvestFx(target);lastHarvest=now;}
    }
  }
  const moving=keys.has("KeyW")||keys.has("KeyA")||keys.has("KeyS")||keys.has("KeyD");
  if(moving && settings.footsteps && now-lastMoveFootstep>((keys.has("ShiftLeft")||keys.has("ShiftRight"))?180:260)){
    lastMoveFootstep=now;
    playSfx("step");
  }
},1000/24);

function smoothEntity(map,e){
  let s=map.get(e.id);
  if(!s){s={x:e.x,y:e.y};map.set(e.id,s)}
  s.x+=(e.x-s.x)*.32;s.y+=(e.y-s.y)*.32;
  return s;
}
function localPlayerBlockerAt(p,x,y){
  if(!state)return null;
  if(state.core?.hp>0 && Math.hypot(x-state.core.x,y-state.core.y)<p.r+state.core.r+2)return {kind:"circle",ref:state.core};
  for(const st of state.structures||[]){
    if(st.hp<=0)continue;
    if(st.type==="wall"){
      const [a,b]=wallEndpointsLocal(st.x,st.y,st.rotation||0);
      if(pointSegmentDistanceLocal(x,y,a.x,a.y,b.x,b.y)<p.r+WALL_HALF_THICK+2)return {kind:"wall",ref:st};
      continue;
    }
    if(["cannon","tesla","cat_tower","frost_tower","flame_tower"].includes(st.type)){
      if(Math.hypot(x-st.x,y-st.y)<p.r+(st.r||28)+2)return {kind:"circle",ref:st};
    }
    // gates are player-passable by design
  }
  return null;
}
function localPlayerBlockedAt(p,x,y){return !!localPlayerBlockerAt(p,x,y);}
function localSlideVector(p,blocker,vx,vy,x,y){
  if(!blocker)return {x:vx,y:vy};
  if(blocker.kind==="circle"){
    const ref=blocker.ref,rx=x-ref.x,ry=y-ref.y,len=Math.hypot(rx,ry)||1,nx=rx/len,ny=ry/len,dot=vx*nx+vy*ny;
    return dot<0?{x:vx-dot*nx,y:vy-dot*ny}:{x:vx,y:vy};
  }
  if(blocker.kind==="wall"){
    const a=blocker.ref.rotation||0,tx=Math.cos(a),ty=Math.sin(a),dot=vx*tx+vy*ty;
    return {x:tx*dot,y:ty*dot};
  }
  return {x:0,y:0};
}
function updateLocalPrediction(dt){
  const p=myPlayer();if(!p)return;if(!localPred)localPred={x:p.x,y:p.y};if(p.downed||state.paused||gameplayUiBlocked())return;
  let dx=(keys.has("KeyD")?1:0)-(keys.has("KeyA")?1:0),dy=(keys.has("KeyS")?1:0)-(keys.has("KeyW")?1:0);
  if(dx||dy){
    const sprinting=(keys.has("ShiftLeft")||keys.has("ShiftRight"))&&(p.stamina??100)>.5;const n=norm(dx,dy),speed=(p.speed||300)*((p.slowMoveTimer||0)>0?.62:1)*(sprinting?1.42:1)*((p.comboTimer||0)>0?1+([0,.03,.05,.08,.10,.12][p.comboTier||0]||0):1);
    const mx=n.x*speed*Math.min(.05,Math.max(0,dt||0)),my=n.y*speed*Math.min(.05,Math.max(0,dt||0));
    const steps=Math.max(1,Math.ceil(Math.hypot(mx,my)/6)),sx=mx/steps,sy=my/steps;
    for(let i=0;i<steps;i++){
      const tx=clamp(localPred.x+sx,p.r,state.world.w-p.r),ty=clamp(localPred.y+sy,p.r,state.world.h-p.r);
      const blocker=localPlayerBlockerAt(p,tx,ty);
      if(!blocker){localPred.x=tx;localPred.y=ty;continue;}
      const slide=localSlideVector(p,blocker,sx,sy,localPred.x,localPred.y);
      const sx2=clamp(localPred.x+slide.x,p.r,state.world.w-p.r),sy2=clamp(localPred.y+slide.y,p.r,state.world.h-p.r);
      if(Math.hypot(slide.x,slide.y)>.0001&&!localPlayerBlockedAt(p,sx2,sy2)){localPred.x=sx2;localPred.y=sy2;continue;}
      const nx=clamp(localPred.x+sx,p.r,state.world.w-p.r);if(!localPlayerBlockedAt(p,nx,localPred.y))localPred.x=nx;
      const ny=clamp(localPred.y+sy,p.r,state.world.h-p.r);if(!localPlayerBlockedAt(p,localPred.x,ny))localPred.y=ny;
    }
    const now=performance.now();
    if(now-lastDustSpawn>(sprinting?52:86)){
      lastDustSpawn=now;
      movementDust.push({x:localPred.x-n.x*14+(Math.random()-.5)*10,y:localPred.y-n.y*14+(Math.random()-.5)*8,born:now,life:sprinting?360:280,size:sprinting?7:5});
      if(movementDust.length>48)movementDust.shift();
    }
  }
}
function updateCamera(){
  const p=myPlayer();if(!p)return;
  const target=(localPred&&p.id===myId)?localPred:smoothEntity(smoothPlayers,p);
  const tx=clamp(target.x-innerWidth/2,0,Math.max(0,state.world.w-innerWidth));
  const ty=clamp(target.y-innerHeight/2,0,Math.max(0,state.world.h-innerHeight));
  camera.x+=(tx-camera.x)*.18;camera.y+=(ty-camera.y)*.18;
  mouse.wx=mouse.x+camera.x;mouse.wy=mouse.y+camera.y;
}
const WALL_HALF_LEN=48;
const WALL_HALF_THICK=13;
function isWallBuild(type){return type==="wall"||type==="gate"}

function wallEndpointsLocal(x,y,rotation){
  const dx=Math.cos(rotation)*WALL_HALF_LEN,dy=Math.sin(rotation)*WALL_HALF_LEN;
  return [{x:x-dx,y:y-dy},{x:x+dx,y:y+dy}];
}
function pointSegmentDistanceLocal(px,py,ax,ay,bx,by){
  const abx=bx-ax,aby=by-ay,den=abx*abx+aby*aby||1;
  const t=clamp(((px-ax)*abx+(py-ay)*aby)/den,0,1);
  return Math.hypot(px-(ax+abx*t),py-(ay+aby*t));
}
function segSegDistanceLocal(a,b,c,d){
  const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
  const onSeg=(p,q,r)=>Math.abs(cross(p,q,r))<1e-7&&r.x>=Math.min(p.x,q.x)-1e-7&&r.x<=Math.max(p.x,q.x)+1e-7&&r.y>=Math.min(p.y,q.y)-1e-7&&r.y<=Math.max(p.y,q.y)+1e-7;
  const o1=cross(a,b,c),o2=cross(a,b,d),o3=cross(c,d,a),o4=cross(c,d,b);
  const intersects=((o1>0&&o2<0)||(o1<0&&o2>0))&&((o3>0&&o4<0)||(o3<0&&o4>0))
    ||onSeg(a,b,c)||onSeg(a,b,d)||onSeg(c,d,a)||onSeg(c,d,b);
  if(intersects)return 0;
  return Math.min(
    pointSegmentDistanceLocal(a.x,a.y,c.x,c.y,d.x,d.y),
    pointSegmentDistanceLocal(b.x,b.y,c.x,c.y,d.x,d.y),
    pointSegmentDistanceLocal(c.x,c.y,a.x,a.y,b.x,b.y),
    pointSegmentDistanceLocal(d.x,d.y,a.x,a.y,b.x,b.y)
  );
}
function localDistanceToStructure(px,py,st){
  if(isWallBuild(st.type)){
    const [a,b]=wallEndpointsLocal(st.x,st.y,st.rotation||0);
    return Math.max(0,pointSegmentDistanceLocal(px,py,a.x,a.y,b.x,b.y)-WALL_HALF_THICK);
  }
  return Math.max(0,Math.hypot(px-st.x,py-st.y)-(st.r||30));
}

function getBuildGhost(p){
  let dx=mouse.wx-p.x,dy=mouse.wy-p.y;
  const d=Math.hypot(dx,dy);
  if(d>140){const n=norm(dx,dy);dx=n.x*140;dy=n.y*140}
  let x=p.x+dx,y=p.y+dy;

  if(isWallBuild(selectedBuild)){
    // Clean square-base building: walls rotate by 90 degrees and magnetically join endpoints.
    buildRotation=Math.round(buildRotation/(Math.PI/2))*(Math.PI/2);

    const raw={x,y};
    let best=null,bestD=25;
    const dir={x:Math.cos(buildRotation),y:Math.sin(buildRotation)};

    for(const st of wallSnapEnabled?state.structures:[]){
      if(!isWallBuild(st.type))continue;
      for(const ep of wallEndpointsLocal(st.x,st.y,st.rotation||0)){
        const candidates=[
          {x:ep.x+dir.x*WALL_HALF_LEN,y:ep.y+dir.y*WALL_HALF_LEN},
          {x:ep.x-dir.x*WALL_HALF_LEN,y:ep.y-dir.y*WALL_HALF_LEN}
        ];
        for(const cand of candidates){
          const cd=Math.hypot(cand.x-raw.x,cand.y-raw.y);
          if(cd<bestD){bestD=cd;best=cand}
        }
      }
    }
    if(best){x=best.x;y=best.y}
    else{x=Math.round(x/16)*16;y=Math.round(y/16)*16}
  }

  return{x,y};
}
function localStructureRadius(type){
  if(isWallBuild(type))return WALL_HALF_THICK;
  return {cannon:30,tesla:28,cat_tower:29,frost_tower:29,flame_tower:30,spikes:31}[type]||30;
}
function localWallConnectionAllowed(x,y,rotation,st){
  if(!isWallBuild(st.type))return false;
  const mine=wallEndpointsLocal(x,y,rotation),other=wallEndpointsLocal(st.x,st.y,st.rotation||0);
  let endpointGap=Infinity;
  for(const a of mine)for(const b of other)endpointGap=Math.min(endpointGap,Math.hypot(a.x-b.x,a.y-b.y));
  return endpointGap<=13&&Math.hypot(x-st.x,y-st.y)>45;
}
function localPlacementOkay(p,g){
  if(!selectedBuild)return false;
  if(Math.hypot(g.x-p.x,g.y-p.y)>148)return false;
  const core=state.core;

  if(isWallBuild(selectedBuild)){
    const [a,b]=wallEndpointsLocal(g.x,g.y,buildRotation);
    for(const ep of [a,b]){
      if(ep.x<50||ep.y<50||ep.x>state.world.w-50||ep.y>state.world.h-50)return false;
    }
    if(pointSegmentDistanceLocal(core.x,core.y,a.x,a.y,b.x,b.y)<core.r+28)return false;

    for(const st of state.structures){
      if(isWallBuild(st.type)){
        if(localWallConnectionAllowed(g.x,g.y,buildRotation,st))continue;
        const [c,d]=wallEndpointsLocal(st.x,st.y,st.rotation||0);
        if(segSegDistanceLocal(a,b,c,d)<WALL_HALF_THICK*2+5)return false;
      }else if(pointSegmentDistanceLocal(st.x,st.y,a.x,a.y,b.x,b.y)<(st.r||30)+WALL_HALF_THICK+6)return false;
    }
    for(const n of state.resources)if(pointSegmentDistanceLocal(n.x,n.y,a.x,a.y,b.x,b.y)<n.r+WALL_HALF_THICK+6)return false;
    for(const other of state.players)if(pointSegmentDistanceLocal(other.x,other.y,a.x,a.y,b.x,b.y)<other.r+WALL_HALF_THICK+5)return false;
    for(const z of state.zombies)if(pointSegmentDistanceLocal(z.x,z.y,a.x,a.y,b.x,b.y)<z.r+WALL_HALF_THICK+4)return false;
    return true;
  }

  if(g.x<60||g.y<60||g.x>state.world.w-60||g.y>state.world.h-60)return false;
  const myR=localStructureRadius(selectedBuild);
  if(Math.hypot(g.x-core.x,g.y-core.y)<core.r+myR+34)return false;
  for(const st of state.structures){
    if(isWallBuild(st.type)){
      if(localDistanceToStructure(g.x,g.y,st)<myR+6)return false;
    }else if(Math.hypot(g.x-st.x,g.y-st.y)<myR+localStructureRadius(st.type)+7)return false;
  }
  for(const n of state.resources)if(Math.hypot(g.x-n.x,g.y-n.y)<myR+n.r+8)return false;
  for(const other of state.players)if(Math.hypot(g.x-other.x,g.y-other.y)<myR+other.r+10)return false;
  for(const z of state.zombies)if(Math.hypot(g.x-z.x,g.y-z.y)<myR+z.r+8)return false;
  return true;
}

function updateInteractionHint(){
  const p=myPlayer(),hint=$("interactionHint");if(!p||selectedBuild){hoverStructureId=null;hint.classList.remove("visible");return}
  if(activeTool==="multitool"){
    const st=hoveredStructureAtCursor(p);
    hoverStructureId=st?.id||null;
    if(st){
      const stats=structureStats(st);
      hint.textContent=`${buildLabel[st.type]} · ${T("ур.","lvl")} ${st.level||1} · ${Math.ceil(st.hp)}/${Math.ceil(st.maxHp)} HP${stats[0]?` · ${stats[0]}`:""} · ${T("ЛКМ — открыть меню","LMB — open menu")}`;
      hint.classList.add("visible");return;
    }
    const best=nearestResource(p,82);
    if(best){const names=isEn()?{tree:"wood",rock:"stone",scrapPile:"scrap"}:{tree:"дерево",rock:"камень",scrapPile:"металл"};hint.textContent=`${T("ЛКМ — добывать","LMB — gather")} ${names[best.type]}`;hint.classList.add("visible");return;}
  }else hoverStructureId=null;
  let nearLoot=null,nearLootDist=190;
  for(const l of state.loot||[]){const d=Math.hypot(p.x-l.x,p.y-l.y);if(d<nearLootDist&&(l.kind==="cache"||l.kind==="crateToken")){nearLoot=l;nearLootDist=d;}}
  if(nearLoot){
    if(nearLoot.kind==="cache")hint.textContent=T("🎁 БОСС-КЭШ · командная награда · подойди, чтобы забрать","🎁 BOSS CACHE · team reward · move closer to collect");
    else hint.textContent=T("🎟 Золотой жетон ящика · подойди, чтобы забрать","🎟 Golden crate token · move closer to collect");
    hint.classList.add("visible");return;
  }
  const coreDist=Math.hypot(p.x-state.core.x,p.y-state.core.y),nearCore=coreDist<285,now=performance.now();if(nearCore&&!nearCorePreviously)baseHintUntil=now+5000;nearCorePreviously=nearCore;
  if(nearCore&&now<baseHintUntil){hint.textContent=T(`База ур. ${state.core.level} · ремонт, магазин и улучшения доступны ниже`,`Base lvl ${state.core.level} · repair, shop and upgrades are available below`);hint.classList.add("visible");return;}
  hint.classList.remove("visible");
}

function worldHash(x,y,salt=0){
  const v=Math.sin(x*12.9898+y*78.233+salt*37.719)*43758.5453123;
  return v-Math.floor(v);
}
function drawBaseCourtyard(){
  const core=state?.core;if(!core)return;
  const s=sc(core.x,core.y),w=720,h=520,left=s.x-w/2,top=s.y-h/2,tile=52;
  if(left>innerWidth+120||top>innerHeight+120||left+w<-120||top+h<-120)return;
  ctx.save();
  const grad=ctx.createRadialGradient(s.x,s.y,50,s.x,s.y,390);
  grad.addColorStop(0,'rgba(45,62,58,.80)');grad.addColorStop(.55,'rgba(28,39,40,.72)');grad.addColorStop(1,'rgba(17,24,27,.20)');
  ctx.fillStyle=grad;rr(left,top,w,h,34);ctx.fill();
  ctx.save();rr(left,top,w,h,34);ctx.clip();
  const worldLeft=core.x-w/2,worldTop=core.y-h/2;
  for(let wx=worldLeft;wx<worldLeft+w;wx+=tile){for(let wy=worldTop;wy<worldTop+h;wy+=tile){
    const x=wx-camera.x,y=wy-camera.y,n=worldHash(wx,wy,7);
    ctx.fillStyle=n>.52?'rgba(87,99,101,.15)':'rgba(27,34,37,.24)';ctx.fillRect(x+1,y+1,tile-2,tile-2);
    ctx.strokeStyle='rgba(180,194,198,.055)';ctx.strokeRect(x+.5,y+.5,tile-1,tile-1);
    if(n>.83){ctx.strokeStyle='rgba(10,15,17,.20)';ctx.beginPath();ctx.moveTo(x+12,y+17);ctx.lineTo(x+25,y+28);ctx.lineTo(x+37,y+21);ctx.stroke();}
  }}
  ctx.restore();
  ctx.strokeStyle='rgba(135,152,155,.36)';ctx.lineWidth=8;rr(left+2,top+2,w-4,h-4,32);ctx.stroke();
  ctx.strokeStyle='rgba(16,22,24,.80)';ctx.lineWidth=3;rr(left+8,top+8,w-16,h-16,27);ctx.stroke();
  const corners=[[left+38,top+38],[left+w-38,top+38],[left+38,top+h-38],[left+w-38,top+h-38]];
  for(let i=0;i<corners.length;i++)drawWorldTorch(corners[i][0],corners[i][1],.92,i);
  // subtle generator lane markings
  ctx.strokeStyle='rgba(101,223,143,.13)';ctx.lineWidth=2;ctx.setLineDash([10,12]);ctx.beginPath();ctx.arc(s.x,s.y,145,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  ctx.restore();
}
function drawWorldTorch(x,y,scale=1,seed=0){
  const pulse=.5+.5*Math.sin(performance.now()*.006+seed*1.8);
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  const g=ctx.createRadialGradient(0,-15,3,0,-15,64);g.addColorStop(0,`rgba(255,177,68,${.24+.10*pulse})`);g.addColorStop(1,'rgba(255,112,36,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,-15,64,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#47372b';ctx.fillRect(-7,-2,14,28);ctx.strokeStyle='#1d1a17';ctx.lineWidth=3;ctx.strokeRect(-7,-2,14,28);
  ctx.fillStyle='#7b5a36';ctx.fillRect(-11,-7,22,9);
  ctx.fillStyle=`rgba(255,111,31,${.88+.10*pulse})`;ctx.beginPath();ctx.moveTo(0,-30);ctx.quadraticCurveTo(13,-18,3,-7);ctx.quadraticCurveTo(-9,-14,0,-30);ctx.fill();
  ctx.fillStyle='#ffd46a';ctx.beginPath();ctx.moveTo(1,-25);ctx.quadraticCurveTo(7,-17,1,-11);ctx.quadraticCurveTo(-4,-16,1,-25);ctx.fill();ctx.restore();
}
function ambientPropKind(pattern,n){
  const sets={
    yard:['bush','crate','cart','pillar'],stone:['pillar','crate','brazier','bones'],forge:['brazier','barrel','crate','pillar'],
    toxic:['barrel','bush','bones','pillar'],frost:['crystal','pillar','bones','crate'],lava:['lava','bones','brazier','banner'],
    arcane:['obelisk','sigil','pillar','crystal'],shadow:['obelisk','bones','banner','sigil'],bones:['bones','pillar','banner','crate'],
    void:['void','obelisk','sigil','bones'],throne:['banner','throne','brazier','pillar']
  };
  const list=sets[pattern]||sets.stone;return list[Math.min(list.length-1,Math.floor(n*list.length))];
}
function drawAmbientWorldProps(){
  // Functional harvest nodes remain; non-interactive map clutter is intentionally hidden.
}
function drawMovementDust(){
  const now=performance.now();
  for(let i=movementDust.length-1;i>=0;i--){
    const d=movementDust[i],age=now-d.born;if(age>=d.life){movementDust.splice(i,1);continue;}
    const t=age/d.life,s=sc(d.x,d.y);ctx.fillStyle=`rgba(171,160,141,${(1-t)*.18})`;ctx.beginPath();ctx.arc(s.x,s.y-t*10,d.size*(.65+t*.9),0,Math.PI*2);ctx.fill();
  }
}
function drawTowerFoundation(st,s,now){
  if(isWallBuild(st.type)||st.type==='spikes')return;
  const pulse=.5+.5*Math.sin(now*.004+st.id);
  const aura={cannon:'rgba(203,159,96,.14)',tesla:'rgba(91,196,255,.18)',cat_tower:'rgba(239,177,125,.12)',frost_tower:'rgba(137,229,255,.17)',flame_tower:'rgba(255,103,38,.18)'}[st.type]||'rgba(255,255,255,.08)';
  ctx.fillStyle='rgba(20,27,30,.86)';ctx.beginPath();ctx.arc(s.x,s.y,st.r+10,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(124,140,147,.34)';ctx.lineWidth=3;ctx.stroke();
  ctx.strokeStyle=aura;ctx.lineWidth=4+pulse*2;ctx.beginPath();ctx.arc(s.x,s.y,st.r+15+pulse*3,0,Math.PI*2);ctx.stroke();
  if(st.type==='tesla'){ctx.strokeStyle=`rgba(163,232,255,${.20+.18*pulse})`;ctx.lineWidth=2;for(let i=0;i<3;i++){const a=now*.002+i*Math.PI*2/3;ctx.beginPath();ctx.arc(s.x+Math.cos(a)*(st.r+14),s.y+Math.sin(a)*(st.r+14),3,0,Math.PI*2);ctx.stroke();}}
  if(st.type==='flame_tower'){const g=ctx.createRadialGradient(s.x,s.y,5,s.x,s.y,st.r+42);g.addColorStop(0,`rgba(255,102,35,${.12+.08*pulse})`);g.addColorStop(1,'rgba(255,102,35,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(s.x,s.y,st.r+42,0,Math.PI*2);ctx.fill();}
  if(st.type==='frost_tower'){ctx.strokeStyle=`rgba(199,246,255,${.18+.10*pulse})`;ctx.lineWidth=1.5;for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.beginPath();ctx.moveTo(s.x+Math.cos(a)*(st.r+6),s.y+Math.sin(a)*(st.r+6));ctx.lineTo(s.x+Math.cos(a)*(st.r+19),s.y+Math.sin(a)*(st.r+19));ctx.stroke();}}
}

function drawGround(){
  const theme=currentFloorTheme(),pattern=theme.pattern;
  ctx.fillStyle=theme.base;ctx.fillRect(0,0,innerWidth,innerHeight);
  const tile=64,startX=Math.floor(camera.x/tile)*tile,startY=Math.floor(camera.y/tile)*tile;
  for(let gx=startX;gx<camera.x+innerWidth+tile;gx+=tile){for(let gy=startY;gy<camera.y+innerHeight+tile;gy+=tile){
    const sx=gx-camera.x,sy=gy-camera.y,n=Math.abs(Math.sin(gx*.0161+gy*.0217)*43758.5453)%1;
    ctx.fillStyle=n>.68?"rgba(255,255,255,.018)":n<.2?"rgba(0,0,0,.085)":"rgba(255,255,255,.006)";ctx.fillRect(sx+1,sy+1,tile-2,tile-2);
    ctx.strokeStyle="rgba(194,206,214,.032)";ctx.lineWidth=1;ctx.strokeRect(sx+.5,sy+.5,tile-1,tile-1);
    if(n>.82){ctx.fillStyle="rgba(0,0,0,.12)";ctx.beginPath();ctx.arc(sx+18+(n*23)%28,sy+20+(n*41)%25,4+n*5,0,Math.PI*2);ctx.fill();}
  }}
  const step=pattern==="lava"?205:pattern==="frost"?245:pattern==="toxic"?260:pattern==="void"||pattern==="arcane"?290:360;
  ctx.save();ctx.lineCap="round";
  for(let gx=Math.floor(camera.x/step)*step;gx<camera.x+innerWidth+step;gx+=step){for(let gy=Math.floor(camera.y/step)*step;gy<camera.y+innerHeight+step;gy+=step){
    const sx=gx-camera.x,sy=gy-camera.y,n=Math.abs(Math.sin(gx*.0073+gy*.0091));
    if(pattern==="lava"){
      const glow=ctx.createRadialGradient(sx+80,sy+70,4,sx+80,sy+70,78);glow.addColorStop(0,`rgba(255,86,24,${.15+.09*n})`);glow.addColorStop(1,"rgba(255,70,15,0)");ctx.fillStyle=glow;ctx.beginPath();ctx.arc(sx+80,sy+70,78,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=`rgba(255,93,34,${.40+.18*n})`;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(sx+18,sy+35);ctx.lineTo(sx+48,sy+61);ctx.lineTo(sx+76,sy+43);ctx.lineTo(sx+109,sy+80);ctx.lineTo(sx+145,sy+61);ctx.stroke();
      ctx.strokeStyle=`rgba(255,202,89,${.20+.17*n})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(sx+48,sy+61);ctx.lineTo(sx+67,sy+92);ctx.lineTo(sx+103,sy+108);ctx.stroke();
    }else if(pattern==="frost"){
      ctx.strokeStyle=`rgba(181,235,255,${.13+.08*n})`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx+38,sy+30);ctx.lineTo(sx+73,sy+60);ctx.lineTo(sx+119,sy+42);ctx.moveTo(sx+73,sy+60);ctx.lineTo(sx+62,sy+108);ctx.stroke();
    }else if(pattern==="toxic"){
      ctx.fillStyle=`rgba(102,171,66,${.08+.07*n})`;ctx.beginPath();ctx.ellipse(sx+83,sy+71,34+15*n,20+9*n,.2,0,Math.PI*2);ctx.fill();ctx.strokeStyle="rgba(171,255,132,.15)";ctx.stroke();
    }else if(pattern==="arcane"||pattern==="void"){
      ctx.strokeStyle=pattern==="void"?`rgba(99,156,255,${.12+.08*n})`:`rgba(193,136,255,${.12+.08*n})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx+88,sy+76,26+7*n,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(sx+88,sy+38);ctx.lineTo(sx+120,sy+76);ctx.lineTo(sx+88,sy+114);ctx.lineTo(sx+56,sy+76);ctx.closePath();ctx.stroke();
    }else if(pattern==="bones"){
      ctx.fillStyle="rgba(222,210,170,.09)";ctx.fillRect(sx+61,sy+72,58,8);ctx.fillRect(sx+87,sy+49,8,54);
    }
  }}ctx.restore();
}

function drawResources(){
  const now=performance.now();
  const p=myPlayer();
  const currentTarget=(p&&activeTool==="multitool"&&!selectedBuild)?nearestResource(p,82):null;

  for(const n of state.resources){
    if(!vis(n.x,n.y))continue;

    let ox=0,oy=0;
    const fx=resourceShake.get(n.id);
    if(fx){
      if(now<fx.until){
        const remaining=(fx.until-now)/Math.max(1,fx.until-fx.start);
        ox=Math.sin(now*.22)*5.5*remaining;
        oy=Math.cos(now*.18)*2.2*remaining;
      }else{
        resourceShake.delete(n.id);
      }
    }

    const s=sc(n.x+ox,n.y+oy);
    shadow(s.x,s.y+15,n.r*.8,n.r*.35);

    if(currentTarget&&currentTarget.id===n.id){
      ctx.strokeStyle="#e6cf78";ctx.lineWidth=2;ctx.setLineDash([5,4]);
      ctx.beginPath();ctx.arc(s.x,s.y,n.r+9,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    }

    if(n.type==="tree"){
      const img=resourceImages.tree;
      if(img?.complete&&img.naturalWidth)ctx.drawImage(img,s.x-46,s.y-53,92,92);
      else{ctx.fillStyle="#5a3f2b";ctx.fillRect(s.x-6,s.y-5,12,34);ctx.fillStyle="#244b35";ctx.beginPath();ctx.arc(s.x,s.y-17,27,0,Math.PI*2);ctx.fill();}
    }else if(n.type==="rock"){
      const img=resourceImages.rock;
      if(img?.complete&&img.naturalWidth)ctx.drawImage(img,s.x-40,s.y-40,80,80);
      else{ctx.fillStyle="#657078";ctx.beginPath();ctx.moveTo(s.x-25,s.y+14);ctx.lineTo(s.x-18,s.y-16);ctx.lineTo(s.x+4,s.y-27);ctx.lineTo(s.x+26,s.y-4);ctx.lineTo(s.x+19,s.y+18);ctx.closePath();ctx.fill();ctx.strokeStyle="#8d989e";ctx.stroke();}
    }else{
      const img=resourceImages.scrap;
      if(img?.complete&&img.naturalWidth)ctx.drawImage(img,s.x-40,s.y-40,80,80);
      else{ctx.fillStyle="#515a5e";ctx.fillRect(s.x-22,s.y-14,44,28);ctx.strokeStyle="#9b8748";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(s.x-18,s.y+9);ctx.lineTo(s.x+17,s.y-8);ctx.stroke();}
    }

    if((currentTarget&&currentTarget.id===n.id) || resourceShake.has(n.id)){
      bar(s.x-27,s.y-n.r-17,54,5,n.hp/n.maxHp,"#e0c66d");
    }
  }
}

function drawCore(){
  const core=state.core,s=sc(core.x,core.y);if(!vis(core.x,core.y,220))return;
  const pulse=.5+.5*Math.sin(performance.now()*.004);
  shadow(s.x,s.y+31,76,27,.38);
  const glow=ctx.createRadialGradient(s.x,s.y,10,s.x,s.y,core.light*.55);
  glow.addColorStop(0,`rgba(85,255,136,${.27+.08*pulse})`);glow.addColorStop(.42,"rgba(72,222,125,.11)");glow.addColorStop(1,"rgba(72,222,125,0)");
  ctx.fillStyle=glow;ctx.beginPath();ctx.arc(s.x,s.y,core.light*.55,0,Math.PI*2);ctx.fill();

  // Fully circular generator silhouette: concentric armored rings, no square/cog collision illusion.
  ctx.fillStyle="#111916";ctx.strokeStyle="#060a08";ctx.lineWidth=7;ctx.beginPath();ctx.arc(s.x,s.y,core.r+5,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.strokeStyle="#52635b";ctx.lineWidth=12;ctx.beginPath();ctx.arc(s.x,s.y,core.r-9,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle="#24332d";ctx.lineWidth=7;ctx.beginPath();ctx.arc(s.x,s.y,core.r-22,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4,rrr=core.r-12;
    ctx.fillStyle=i%2?"#34443d":"#41534b";ctx.beginPath();ctx.arc(s.x+Math.cos(a)*rrr,s.y+Math.sin(a)*rrr,7,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle="#14251e";ctx.strokeStyle="#6a8075";ctx.lineWidth=3;ctx.beginPath();ctx.arc(s.x,s.y,39,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle=`rgba(65,239,118,${.76+.16*pulse})`;ctx.beginPath();ctx.arc(s.x,s.y,26,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=`rgba(135,255,170,${.50+.22*pulse})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(s.x,s.y,33+2.5*pulse,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle="#d9ffe3";ctx.beginPath();ctx.arc(s.x-8,s.y-8,6,0,Math.PI*2);ctx.fill();

  bar(s.x-78,s.y-105,156,9,core.hp/core.maxHp,"#66e68c");
  const p=myPlayer(),near=p&&Math.hypot(p.x-core.x,p.y-core.y)<340;ctx.textAlign="center";
  if(near){ctx.fillStyle="rgba(6,10,12,.91)";rr(s.x-99,s.y-139,198,25,10);ctx.fill();ctx.strokeStyle="rgba(106,232,145,.26)";rr(s.x-98.5,s.y-138.5,197,24,10);ctx.stroke();ctx.fillStyle="#e8f8ec";ctx.font="900 12px system-ui";ctx.fillText(`${T("ГЕНЕРАТОР","GENERATOR")} ${Math.ceil(core.hp)} / ${core.maxHp}`,s.x,s.y-122);}
  ctx.fillStyle="#bfe5c9";ctx.font="900 11px system-ui";ctx.fillText(`${T("УР.","LVL")} ${core.level}`,s.x,s.y+100);
}

function drawStructureShape(st,x,y,alpha=1,ghostColor=null){
  ctx.save();
  ctx.globalAlpha=alpha;
  ctx.translate(x,y);
  const drawRotation=isWallBuild(st.type)?(st.rotation||0):0;
  ctx.rotate(drawRotation);

  const img=structureImages[st.type];
  const size=structureSpriteSize[st.type];
  const canUseImage=!!(img&&img.complete&&img.naturalWidth&&size);

  if(canUseImage){
    const drawAlpha=ghostColor?Math.max(.36,alpha*.58):alpha;
    ctx.globalAlpha=drawAlpha;
    ctx.drawImage(img,-size.w/2,-size.h/2,size.w,size.h);
    ctx.globalAlpha=alpha;
    if(ghostColor){
      ctx.strokeStyle=ghostColor;
      ctx.lineWidth=3;
      if(st.type==="wall"||st.type==="gate")ctx.strokeRect(-size.w*.42,-size.h*.17,size.w*.84,size.h*.34);
      else {ctx.beginPath();ctx.arc(0,0,Math.max(25,(st.r||30)+6),0,Math.PI*2);ctx.stroke();}
    }
  }else{
    if(st.type==="wall"||st.type==="gate"){
      const halfH=st.type==="gate"?9:8;
      const gateOpen=!ghostColor&&st.type==="gate"&&state?.players?.some(p=>Math.hypot(p.x-st.x,p.y-st.y)<72);
      ctx.fillStyle=ghostColor?ghostColor:(st.type==="gate"?"#6f654c":"#53626a");ctx.globalAlpha=ghostColor?alpha*.32:alpha;
      if(gateOpen){ctx.fillRect(-48,-halfH,34,halfH*2);ctx.fillRect(14,-halfH,34,halfH*2);}else ctx.fillRect(-48,-halfH,96,halfH*2);
      ctx.globalAlpha=alpha;ctx.strokeStyle=ghostColor||"#1f282d";ctx.lineWidth=3;
      if(gateOpen){ctx.strokeRect(-48,-halfH,34,halfH*2);ctx.strokeRect(14,-halfH,34,halfH*2);}else ctx.strokeRect(-48,-halfH,96,halfH*2);
      if(!ghostColor){ctx.fillStyle=st.type==="gate"?"#b09b68":"#85939a";for(let q=-36;q<=36;q+=24){if(!gateOpen||Math.abs(q)>15)ctx.fillRect(q-3,-halfH+2,6,halfH*2-4);}ctx.fillStyle="#273238";ctx.beginPath();ctx.arc(-48,0,5,0,Math.PI*2);ctx.arc(48,0,5,0,Math.PI*2);ctx.fill();}
    }
    if(st.type==="cannon"){ctx.fillStyle=ghostColor||"#48545a";ctx.beginPath();ctx.arc(0,0,27,0,Math.PI*2);ctx.fill();ctx.fillStyle=ghostColor||"#b9c0c2";ctx.fillRect(1,-7,43,14);if(!ghostColor){ctx.fillStyle="#242a2d";ctx.beginPath();ctx.arc(43,0,8,0,Math.PI*2);ctx.fill();ctx.fillStyle="#707a7e";ctx.beginPath();ctx.arc(-10,17,10,0,Math.PI*2);ctx.arc(10,17,10,0,Math.PI*2);ctx.fill();}}
    if(st.type==="tesla"){ctx.fillStyle=ghostColor||"#35444c";ctx.beginPath();ctx.arc(0,0,25,0,Math.PI*2);ctx.fill();ctx.strokeStyle=ghostColor||"#9edcff";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-10,11);ctx.lineTo(-2,-2);ctx.lineTo(-9,-8);ctx.lineTo(4,-22);ctx.lineTo(1,-8);ctx.lineTo(11,-4);ctx.lineTo(4,10);ctx.stroke();if(!ghostColor){ctx.strokeStyle="#d8f5ff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-9,12,0,Math.PI*2);ctx.stroke();}}
    if(st.type==="cat_tower"){ctx.fillStyle=ghostColor||"#534a45";ctx.beginPath();ctx.arc(0,0,27,0,Math.PI*2);ctx.fill();if(!ghostColor){ctx.save();ctx.rotate(-drawRotation);ctx.font="25px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("🐱",0,0);ctx.restore();}ctx.fillStyle=ghostColor||"#d8b58e";ctx.beginPath();ctx.arc(25,0,7,0,Math.PI*2);ctx.fill();}
    if(st.type==="frost_tower"){ctx.fillStyle=ghostColor||"#3d5660";ctx.beginPath();ctx.arc(0,0,26,0,Math.PI*2);ctx.fill();ctx.strokeStyle=ghostColor||"#b9efff";ctx.lineWidth=3;for(let i=0;i<6;i++){ctx.rotate(Math.PI/3);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(23,0);ctx.stroke();ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(18,-5);ctx.moveTo(13,0);ctx.lineTo(18,5);ctx.stroke();}}
    if(st.type==="flame_tower"){ctx.fillStyle=ghostColor||"#554139";ctx.beginPath();ctx.arc(0,0,27,0,Math.PI*2);ctx.fill();ctx.fillStyle=ghostColor||"#9ba6aa";ctx.fillRect(0,-6,34,12);if(!ghostColor){ctx.save();ctx.rotate(-drawRotation);ctx.font="23px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("🔥",-6,0);ctx.restore();}}
    if(st.type==="spikes"){ctx.strokeStyle=ghostColor||"#a5afb3";ctx.lineWidth=3;for(let i=0;i<10;i++){ctx.rotate(Math.PI/5);ctx.beginPath();ctx.moveTo(4,0);ctx.lineTo(30,0);ctx.stroke();}}
  }
  if(!ghostColor&&Number.isFinite(st.hp)&&Number.isFinite(st.maxHp)){
    const ratio=st.hp/Math.max(1,st.maxHp);
    if(ratio<.65){ctx.strokeStyle=ratio<.30?"rgba(255,136,111,.85)":"rgba(38,29,27,.75)";ctx.lineWidth=2;for(let i=0;i<(ratio<.30?5:3);i++){const sx=-20+i*9,sy=-12+(i%2)*9;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+7,sy+5);ctx.lineTo(sx+2,sy+12);ctx.stroke();}}
    if(st.jam>0){ctx.strokeStyle="rgba(126,181,255,.8)";ctx.setLineDash([3,3]);ctx.beginPath();ctx.arc(0,0,Math.min(35,st.r||30),0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  }
  ctx.restore();
}
function drawStructures(){
  const now=performance.now();
  for(const st of state.structures){
    if(!vis(st.x,st.y))continue;
    const s=sc(st.x,st.y);drawTowerFoundation(st,s,now);shadow(s.x,s.y+17,st.r*.85,st.r*.3);drawStructureShape(st,s.x,s.y,1);
    const ratio=st.hp/Math.max(1,st.maxHp),hovered=st.id===hoverStructureId;
    if(ratio<.30){const puff=(now*.03+st.id*17)%28;ctx.fillStyle="rgba(94,104,106,.22)";ctx.beginPath();ctx.arc(s.x+8,s.y-18-puff*.4,7+puff*.18,0,Math.PI*2);ctx.fill();}
    if(hovered){ctx.strokeStyle="#8ce6ab";ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.arc(s.x,s.y,st.r+10,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
    if(hovered&&activeTool==="multitool"){
      const stats=structureStats(st),line1=`${buildLabel[st.type]} · ${T("ур.","lvl")} ${st.level||1}`,line2=`HP ${Math.ceil(st.hp)} / ${Math.ceil(st.maxHp)}`,line3=stats[0]||T("ЛКМ — открыть меню","LMB — open menu");
      const tipW=230,tipH=66,tipX=clamp(mouse.x+18,8,innerWidth-tipW-8),tipY=clamp(mouse.y-82,8,innerHeight-tipH-8);
      ctx.fillStyle="rgba(5,10,12,.97)";rr(tipX,tipY,tipW,tipH,11);ctx.fill();
      ctx.strokeStyle="rgba(116,216,154,.58)";rr(tipX+.5,tipY+.5,tipW-1,tipH-1,11);ctx.stroke();
      ctx.textAlign="left";ctx.fillStyle="#dff5e7";ctx.font="950 13px system-ui";ctx.fillText(line1,tipX+10,tipY+18);
      ctx.fillStyle="#aebdb6";ctx.font="800 11px system-ui";ctx.fillText(line2,tipX+10,tipY+37);
      ctx.fillStyle="#d8c77b";ctx.font="800 10px system-ui";ctx.fillText(line3,tipX+10,tipY+54);
    }
    // Keep the world clean: HP/level only appears when damaged or when inspecting the building.
    if(ratio<.985||hovered){bar(s.x-30,s.y+st.r+7,60,5,ratio,ratio<.3?"#e17070":ratio<.6?"#d9bc6f":"#c8d2d6");}
    if(hovered){ctx.textAlign="center";ctx.fillStyle="#d6e1e4";ctx.font="10px system-ui";ctx.fillText(`${T("ур.","lvl")} ${st.level||1}`,s.x,s.y+st.r+23);}
  }
}

function drawBuildPreview(){
  const p=myPlayer();if(!p||p.downed||!selectedBuild)return;
  const g=getBuildGhost(p),s=sc(g.x,g.y),ok=localPlacementOkay(p,g);
  const color=ok?"#6de39a":"#ef6f74";
  const fake={type:selectedBuild,rotation:buildRotation};
  const pp0=sc(p.x,p.y);
  ctx.save();ctx.strokeStyle="rgba(126,225,163,.18)";ctx.lineWidth=1;ctx.beginPath();ctx.arc(pp0.x,pp0.y,140,0,Math.PI*2);ctx.stroke();ctx.restore();
  ctx.save();
  ctx.setLineDash([7,6]);
  ctx.strokeStyle=color;ctx.lineWidth=2;
  const pp=sc(p.x,p.y);ctx.beginPath();ctx.moveTo(pp.x,pp.y);ctx.lineTo(s.x,s.y);ctx.stroke();
  ctx.restore();
  drawStructureShape(fake,s.x,s.y,.85,color);
  ctx.fillStyle="rgba(5,9,11,.85)";ctx.fillRect(s.x-82,s.y-62,164,24);
  ctx.fillStyle=color;ctx.font="700 12px system-ui";ctx.textAlign="center";
  const p2=myPlayer(),aff=p2?canAfford(p2.inventory,buildCosts[selectedBuild]):false;
  ctx.fillText(`${buildLabel[selectedBuild]} • ${ok&&aff?T("ЛКМ поставить","LMB place"):!aff?T("не хватает ресурсов","not enough resources"):T("нельзя поставить","cannot place")}`,s.x,s.y-46);
}

function drawLoot(){
  const p=myPlayer(),now=performance.now();
  for(const l of state.loot){
    if(!vis(l.x,l.y,120))continue;
    const s=sc(l.x,l.y),pulse=.5+.5*Math.sin(now*.006+l.id);
    shadow(s.x,s.y+18,l.kind==="cache"?30:20,l.kind==="cache"?11:8);
    if(l.kind==="weapon"){
      ctx.strokeStyle=rarityStroke[l.weapon.rarity];ctx.lineWidth=3;ctx.fillStyle="#222b30";
      ctx.fillRect(s.x-24,s.y-12,48,24);ctx.strokeRect(s.x-24,s.y-12,48,24);
      ctx.fillStyle=rarityStroke[l.weapon.rarity];ctx.fillRect(s.x-12,s.y-3,34,6);
    }else if(l.kind==="crateToken"){
      ctx.fillStyle="#d6aa38";ctx.beginPath();ctx.arc(s.x,s.y,17,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#fff0a1";ctx.lineWidth=3;ctx.stroke();ctx.fillStyle="#5a4310";ctx.font="900 13px system-ui";ctx.textAlign="center";ctx.fillText("🎟",s.x,s.y+5);
    }else if(l.kind==="cache"){
      const img=resourceImages.bossCache;
      const beam=ctx.createLinearGradient(s.x,s.y-125,s.x,s.y+10);
      beam.addColorStop(0,"rgba(255,224,106,0)");beam.addColorStop(.55,`rgba(255,214,82,${.13+.08*pulse})`);beam.addColorStop(1,"rgba(255,191,52,0)");
      ctx.fillStyle=beam;ctx.fillRect(s.x-30,s.y-128,60,140);
      ctx.strokeStyle=`rgba(255,221,111,${.40+.28*pulse})`;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(s.x,s.y,38+3*pulse,0,Math.PI*2);ctx.stroke();
      if(img?.complete&&img.naturalWidth)ctx.drawImage(img,s.x-38,s.y-38,76,76);
      else{ctx.fillStyle="#806b3d";ctx.fillRect(s.x-25,s.y-18,50,36);ctx.strokeStyle="#e0be65";ctx.strokeRect(s.x-25,s.y-18,50,36);}
      const near=p&&Math.hypot(p.x-l.x,p.y-l.y)<190;
      const w=188,h=near?48:36,x=s.x-w/2,y=s.y-89;
      ctx.fillStyle="rgba(5,9,11,.94)";ctx.fillRect(x,y,w,h);ctx.strokeStyle="rgba(239,196,84,.68)";ctx.strokeRect(x+.5,y+.5,w-1,h-1);
      ctx.textAlign="center";ctx.font="950 11px system-ui";ctx.fillStyle="#ffe59a";ctx.fillText(T("🎁 БОСС-КЭШ","🎁 BOSS CACHE"),s.x,y+15);
      ctx.font="850 10px system-ui";ctx.fillStyle="#d9e1e4";ctx.fillText(T("⚙ 🪵 🪨 · командная награда","⚙ 🪵 🪨 · team reward"),s.x,y+29);
      if(near){ctx.font="800 9px system-ui";ctx.fillStyle="#9ee4b7";ctx.fillText(T("Подойди ближе — забирается автоматически","Move closer — collected automatically"),s.x,y+42);}
    }
  }
}

function zombieAttackReset(type){
  return {runner:.62,spitter:1.65,bomber:1.0,shaman:1.0,titan:2.05,sapper:2.4,parasite:.9,boss_stone:.70,boss_butcher:.70,boss_plague:.70,boss_colossus:.70,boss_shadow:.70,boss_king:.70}[type]||.9;
}
function drawZombie(z){
  const sm=smoothEntity(smoothZombies,z),screen=sc(sm.x,sm.y);if(!vis(sm.x,sm.y))return;
  const t=Number.isFinite(state?.elapsed)?state.elapsed:performance.now()/1000;
  const boss=String(z.type||"").startsWith("boss_");
  const miniBoss=String(z.type||"").startsWith("mini_");
  const fast=z.type==="runner"||z.type==="hunter"||z.type==="leaper"||z.type==="mini_shadow_stalker";
  const phase=t*(fast?13:boss?5.2:miniBoss?6.2:7.5)+z.id*.73;
  const walk=Math.sin(phase),walk2=Math.cos(phase),bob=Math.abs(Math.sin(phase))*(fast?4.2:2.4);
  const reset=zombieAttackReset(z.type),sinceAttack=Math.max(0,reset-(z.attackCd||0));
  const attack=(z.attackCd||0)>0&&sinceAttack<.24?Math.sin((sinceAttack/.24)*Math.PI):0;
  const specialPulse=.5+.5*Math.sin(t*5+z.id);
  const body={orc:"#536b58",runner:"#a44843",armored:"#59636a",spitter:"#477b5a",bomber:"#81613e",shaman:"#66528d",titan:"#474c50",leaper:"#8e7041",shieldbearer:"#526c78",splitter:"#7b5b73",hunter:"#74464d",sapper:"#7c633e",necromancer:"#4f446d",frost:"#5a8897",parasite:"#5c7851",teleporter:"#634f89",abyssal:"#252a32",mini_toxic_brute:"#4e7a46",mini_lava_beast:"#8f4f2a",mini_shadow_stalker:"#4f3a6f",mini_void_harbinger:"#32475f",boss_stone:"#746858",boss_butcher:"#7e3b42",boss_plague:"#51704b",boss_colossus:"#454b50",boss_shadow:"#493a6e",boss_king:"#6d293d"}[z.type]||"#546b58";
  let sx=screen.x,sy=screen.y-bob;
  shadow(sx,screen.y+16,z.r*.8,z.r*.32);

  ctx.save();ctx.translate(sx,sy);
  let lean=0,scaleX=1,scaleY=1;
  if(z.type==="runner")lean=.12+.07*walk;
  if(z.type==="hunter")lean=.09+.05*walk;
  if(z.type==="leaper"){scaleX=1+.10*Math.max(0,-walk);scaleY=1-.12*Math.max(0,-walk)+.08*Math.max(0,walk);}
  if(z.type==="titan"||z.type==="boss_colossus"){scaleY=1+.025*walk2;scaleX=1-.018*walk2;}
  if(z.type==="teleporter"||z.type==="boss_shadow")ctx.globalAlpha=.78+.18*Math.sin(t*7+z.id);
  ctx.rotate(lean);ctx.scale(scaleX,scaleY);

  // Legs: every ground enemy visibly walks instead of sliding.
  ctx.strokeStyle="#26312c";ctx.lineWidth=Math.max(5,z.r*.22);ctx.lineCap="round";
  const legSwing=walk*(fast?9:6);
  ctx.beginPath();ctx.moveTo(-z.r*.28,z.r*.48);ctx.lineTo(-z.r*.34+legSwing,z.r*1.03);ctx.stroke();
  ctx.beginPath();ctx.moveTo(z.r*.28,z.r*.48);ctx.lineTo(z.r*.34-legSwing,z.r*1.03);ctx.stroke();

  // Body and head: thick cartoon outline keeps every enemy readable on busy floors.
  ctx.fillStyle=body;ctx.strokeStyle="#121817";ctx.lineWidth=Math.max(3,z.r*.11);ctx.beginPath();ctx.arc(0,-4,z.r*.62,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle=body;rr(-z.r*.55,-1,z.r*1.1,z.r*.88,Math.max(6,z.r*.22));ctx.fill();ctx.strokeStyle="#121817";ctx.lineWidth=Math.max(3,z.r*.10);ctx.stroke();
  const armSwing=walk2*(fast?10:6),attackReach=attack*(z.r*.65+12);
  ctx.strokeStyle="#29362e";ctx.lineWidth=Math.max(6,z.r*.20);
  ctx.beginPath();ctx.moveTo(-z.r*.48,z.r*.16);ctx.lineTo(-z.r*.78-armSwing*.25-attackReach,z.r*.55+armSwing);ctx.stroke();
  ctx.beginPath();ctx.moveTo(z.r*.48,z.r*.16);ctx.lineTo(z.r*.78+armSwing*.25+attackReach,z.r*.55-armSwing);ctx.stroke();

  // Common facial animation: eyes blink every few seconds.
  const blink=Math.sin(t*1.7+z.id*.31)>.985;
  if(!blink){ctx.fillStyle=z.type==="runner"?"#ffe3a1":boss?"#ffd5d9":"#caff9e";ctx.beginPath();ctx.arc(-z.r*.2,-7,3,0,Math.PI*2);ctx.arc(z.r*.2,-7,3,0,Math.PI*2);ctx.fill();}
  ctx.strokeStyle="rgba(20,25,24,.72)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-z.r*.24,z.r*.13);ctx.quadraticCurveTo(0,z.r*.25,z.r*.24,z.r*.13);ctx.stroke();
  if((boss||miniBoss)&&z.r>35){ctx.fillStyle="rgba(238,229,205,.82)";for(const xx of [-8,0,8])ctx.fillRect(xx-2,z.r*.12,4,5);}

  // Per-enemy visible animations / props.
  if(z.type==="orc"){
    ctx.fillStyle="#405446";ctx.fillRect(-z.r*.34,z.r*.14,z.r*.68,5+specialPulse*3);
  }
  if(z.type==="runner"){
    ctx.strokeStyle="rgba(255,218,142,.42)";ctx.lineWidth=2;for(let i=0;i<2;i++){ctx.beginPath();ctx.moveTo(-z.r-10-i*8,8+i*5);ctx.lineTo(-z.r-23-i*8,8+i*5);ctx.stroke();}
  }
  if(z.type==="armored"||z.type==="boss_colossus"){
    ctx.fillStyle="#8b969c";ctx.fillRect(-z.r*.52,-7,z.r*1.04,12);ctx.strokeStyle="#333b40";ctx.lineWidth=3;ctx.strokeRect(-z.r*.52,-7,z.r*1.04,12);
    ctx.fillStyle=`rgba(195,210,216,${.25+.18*specialPulse})`;ctx.fillRect(-z.r*.7,-2,8,z.r*.55);ctx.fillRect(z.r*.7-8,-2,8,z.r*.55);
  }
  if(z.type==="shieldbearer"){
    const shieldBob=walk*3;ctx.fillStyle="#9baab0";ctx.fillRect(z.r*.32+attackReach*.25,-z.r*.58+shieldBob,11,z.r*1.55);ctx.strokeStyle="#d5e0e3";ctx.strokeRect(z.r*.32+attackReach*.25,-z.r*.58+shieldBob,11,z.r*1.55);
  }
  if(z.type==="spitter"||z.type==="boss_plague"){
    const rr=7+specialPulse*4;ctx.fillStyle=`rgba(134,255,159,${.38+.30*specialPulse})`;ctx.beginPath();ctx.arc(0,z.r*.34,rr,0,Math.PI*2);ctx.fill();
    if(z.type==="spitter"){ctx.strokeStyle="rgba(129,255,157,.6)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-1);ctx.lineTo(8+specialPulse*7,-5);ctx.stroke();}
  }
  if(z.type==="bomber"||z.type==="sapper"){
    ctx.fillStyle="#a87945";ctx.beginPath();ctx.arc(0,7,z.r*.5,0,Math.PI*2);ctx.fill();
    const fuseX=8+Math.sin(t*16+z.id)*3,fuseY=2-Math.abs(Math.cos(t*16+z.id))*5;ctx.fillStyle="#ffb44a";ctx.beginPath();ctx.arc(fuseX,fuseY,3+specialPulse*2,0,Math.PI*2);ctx.fill();
    if(z.type==="sapper"){ctx.strokeStyle=`rgba(255,173,74,${.35+.4*specialPulse})`;ctx.beginPath();ctx.arc(0,7,z.r*.66+specialPulse*4,0,Math.PI*2);ctx.stroke();}
  }
  if(z.type==="shaman"){
    ctx.strokeStyle="#b6a2d8";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(z.r*.55,-2);ctx.lineTo(z.r*.85,-z.r*.85);ctx.stroke();
    const ox=z.r*.85+Math.cos(t*4+z.id)*5,oy=-z.r*.85+Math.sin(t*4+z.id)*5;ctx.fillStyle="rgba(196,137,255,.75)";ctx.beginPath();ctx.arc(ox,oy,5+specialPulse*2,0,Math.PI*2);ctx.fill();
  }
  if(z.type==="titan"||boss||miniBoss){ctx.fillStyle="rgba(24,30,33,.45)";ctx.fillRect(-z.r*.7,2,z.r*1.4,z.r*.68);}
  if(z.type==="titan"&&attack>.1){ctx.strokeStyle=`rgba(230,196,116,${attack*.55})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,z.r*.85,20+attack*55,0,Math.PI*2);ctx.stroke();}
  if(z.type==="leaper"){
    ctx.strokeStyle="#d5b572";ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,z.r*.35,z.r*.65+Math.max(0,walk)*4,.2,Math.PI-.2);ctx.stroke();
  }
  if(z.type==="splitter"){
    const wob=Math.sin(t*8+z.id)*4;ctx.fillStyle="#9a708f";ctx.beginPath();ctx.arc(-z.r*.28+wob,-z.r*.28,z.r*.27,0,Math.PI*2);ctx.arc(z.r*.28-wob,-z.r*.22,z.r*.25,0,Math.PI*2);ctx.fill();
  }
  if(z.type==="hunter"){
    ctx.strokeStyle="#d0a2a5";ctx.lineWidth=2;for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*z.r*.7,z.r*.42);ctx.lineTo(side*(z.r+12),z.r*.30+walk*4);ctx.lineTo(side*(z.r+17),z.r*.38+walk*4);ctx.stroke();}
  }
  if(z.type==="necromancer"){
    ctx.strokeStyle="#9c86c6";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-z.r*.62,z.r*.4);ctx.lineTo(-z.r*.88,-z.r*.88);ctx.stroke();
    ctx.strokeStyle=`rgba(185,142,255,${.35+.35*specialPulse})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(-z.r*.88,-z.r*.92,7+specialPulse*3,0,Math.PI*2);ctx.stroke();
  }
  if(z.type==="frost"){
    ctx.strokeStyle="#a7efff";ctx.lineWidth=2.4;for(let i=0;i<4;i++){const a=i*Math.PI/2+t*.7;ctx.beginPath();ctx.moveTo(Math.cos(a)*z.r*.55,Math.sin(a)*z.r*.55);ctx.lineTo(Math.cos(a)*(z.r+7+specialPulse*4),Math.sin(a)*(z.r+7+specialPulse*4));ctx.stroke();}
  }
  if(z.type==="parasite"){
    ctx.strokeStyle="#8eaa79";ctx.lineWidth=2;for(let i=0;i<3;i++){const yy=-2+i*8;ctx.beginPath();ctx.moveTo(-z.r*.45,yy);ctx.lineTo(-z.r-7-Math.sin(phase+i)*5,yy+walk*3);ctx.stroke();ctx.beginPath();ctx.moveTo(z.r*.45,yy);ctx.lineTo(z.r+7+Math.sin(phase+i)*5,yy-walk*3);ctx.stroke();}
  }
  if(z.type==="teleporter"||z.type==="boss_shadow"){
    ctx.strokeStyle=`rgba(187,120,255,${.35+.25*specialPulse})`;ctx.lineWidth=2;for(let k=0;k<2;k++){ctx.beginPath();ctx.arc(0,0,z.r+7+k*7+Math.sin(t*6+k+z.id)*3,0,Math.PI*2);ctx.stroke();}
  }
  if(z.type==="abyssal"){
    ctx.strokeStyle="rgba(115,93,190,.65)";ctx.lineWidth=3;for(let i=0;i<4;i++){const a=i*Math.PI/2+t*.9;ctx.beginPath();ctx.moveTo(Math.cos(a)*z.r*.45,Math.sin(a)*z.r*.45);ctx.quadraticCurveTo(Math.cos(a+.5)*(z.r+10),Math.sin(a+.5)*(z.r+10),Math.cos(a)*(z.r+18+specialPulse*8),Math.sin(a)*(z.r+18+specialPulse*8));ctx.stroke();}
  }
  if(z.type==="mini_toxic_brute"){
    ctx.fillStyle=`rgba(148,255,118,${.20+.12*specialPulse})`;ctx.beginPath();ctx.arc(0,z.r*.25,z.r*.36,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="#c6ff9f";ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,z.r*.25,z.r*.56,0,Math.PI*2);ctx.stroke();
  }
  if(z.type==="mini_lava_beast"){
    ctx.fillStyle=`rgba(255,148,72,${.24+.12*specialPulse})`;ctx.beginPath();ctx.arc(0,0,z.r*.9,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="#ffd07a";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-z.r*.4,-z.r*.7);ctx.lineTo(-z.r*.1,-z.r-10);ctx.lineTo(z.r*.1,-z.r*.74);ctx.lineTo(z.r*.4,-z.r-10);ctx.lineTo(z.r*.55,-z.r*.62);ctx.stroke();
  }
  if(z.type==="mini_shadow_stalker"){
    ctx.strokeStyle=`rgba(188,131,255,${.30+.18*specialPulse})`;ctx.lineWidth=2;for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*z.r*.25,4);ctx.lineTo(side*(z.r*.82+attackReach*.22),z.r*.74);ctx.stroke();ctx.beginPath();ctx.moveTo(side*z.r*.15,-4);ctx.lineTo(side*(z.r*.78+attackReach*.18),z.r*.34);ctx.stroke();}
  }
  if(z.type==="mini_void_harbinger"){
    ctx.strokeStyle=`rgba(132,188,255,${.30+.18*specialPulse})`;ctx.lineWidth=2.5;for(let i=0;i<4;i++){const a=i*Math.PI/2+t*1.1;ctx.beginPath();ctx.moveTo(Math.cos(a)*(z.r*.6),Math.sin(a)*(z.r*.6));ctx.lineTo(Math.cos(a)*(z.r+11),Math.sin(a)*(z.r+11));ctx.stroke();}
    ctx.fillStyle=`rgba(130,176,255,${.18+.12*specialPulse})`;ctx.beginPath();ctx.arc(0,0,8+specialPulse*2,0,Math.PI*2);ctx.fill();
  }
  if(z.type==="boss_stone"){
    ctx.fillStyle="#96856b";ctx.beginPath();ctx.arc(-z.r*.72,-2,z.r*.28,0,Math.PI*2);ctx.arc(z.r*.72,-2,z.r*.28,0,Math.PI*2);ctx.fill();
  }
  if(z.type==="boss_butcher"){
    ctx.strokeStyle="#bfc6c8";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(z.r*.5,-4);ctx.lineTo(z.r*1.18+attackReach,-z.r*.45);ctx.stroke();ctx.fillStyle="#8e343b";ctx.fillRect(z.r*.98+attackReach,-z.r*.62,14,22);
  }
  if(z.type==="boss_plague"){
    for(let i=0;i<3;i++){const a=t*1.4+i*Math.PI*2/3;ctx.fillStyle="rgba(116,221,120,.35)";ctx.beginPath();ctx.arc(Math.cos(a)*(z.r+10),Math.sin(a)*(z.r+10),7,0,Math.PI*2);ctx.fill();}
  }
  if(z.type==="boss_colossus"){
    ctx.strokeStyle="#aab3b7";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-z.r*.75,z.r*.25);ctx.lineTo(-z.r*1.05,z.r*.55+walk*4);ctx.stroke();ctx.beginPath();ctx.moveTo(z.r*.75,z.r*.25);ctx.lineTo(z.r*1.05,z.r*.55-walk*4);ctx.stroke();
  }
  if(z.type==="boss_shadow"){
    ctx.fillStyle=`rgba(115,70,170,${.12+.12*specialPulse})`;ctx.beginPath();ctx.moveTo(-z.r*.75,z.r*.3);ctx.lineTo(0,z.r*1.4+specialPulse*8);ctx.lineTo(z.r*.75,z.r*.3);ctx.closePath();ctx.fill();
  }
  if(z.type==="boss_king"){
    ctx.fillStyle="#e5c35c";ctx.beginPath();ctx.moveTo(-12,-z.r*.78);ctx.lineTo(-7,-z.r-13);ctx.lineTo(0,-z.r*.88);ctx.lineTo(7,-z.r-13);ctx.lineTo(12,-z.r*.78);ctx.closePath();ctx.fill();
    ctx.strokeStyle=`rgba(224,70,93,${.25+.3*specialPulse})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,z.r+10+specialPulse*6,0,Math.PI*2);ctx.stroke();
  }
  if(z.commander){ctx.strokeStyle="rgba(242,189,82,.45)";ctx.beginPath();ctx.arc(0,0,z.r+14+specialPulse*3,0,Math.PI*2);ctx.stroke();}
  drawThemeZombieFX(z,{x:0,y:0},t,specialPulse);
  drawZombieFloorAffixFX(z,t,specialPulse);
  if(performance.now()<(zombieHitFlashUntil.get(z.id)||0)){ctx.fillStyle="rgba(255,255,255,.28)";ctx.beginPath();ctx.arc(0,-2,z.r*.72,0,Math.PI*2);ctx.fill();}
  if(z.burnTime>0){ctx.fillStyle="rgba(255,112,37,.75)";ctx.beginPath();ctx.arc(-6,-z.r*.55,6,0,Math.PI*2);ctx.arc(7,-z.r*.68+Math.sin(t*15+z.id)*3,5,0,Math.PI*2);ctx.fill();}
  ctx.restore();

  if(boss){ctx.strokeStyle="#f3a4ac";ctx.lineWidth=3;ctx.beginPath();ctx.arc(screen.x,screen.y,z.r+7,0,Math.PI*2);ctx.stroke();ctx.fillStyle="rgba(4,8,10,.82)";ctx.fillRect(screen.x-90,screen.y-z.r-36,180,18);ctx.fillStyle="#f2d7da";ctx.font="900 10px system-ui";ctx.textAlign="center";ctx.fillText(zombieNames[z.type]||T("БОСС","BOSS"),screen.x,screen.y-z.r-23);}
  if(miniBoss){ctx.strokeStyle="#f1cf72";ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(screen.x,screen.y,z.r+5,0,Math.PI*2);ctx.stroke();ctx.fillStyle="rgba(4,8,10,.78)";ctx.fillRect(screen.x-76,screen.y-z.r-32,152,16);ctx.fillStyle="#ffe6a1";ctx.font="800 9px system-ui";ctx.textAlign="center";ctx.fillText(zombieNames[z.type]||T("МИНИ-БОСС","MINI-BOSS"),screen.x,screen.y-z.r-20);}
  if((z.eliteMods||[]).length){const icons={furious:"🔥",shielded:"🛡",regen:"♻",swift:"⚡",commander:"👑",cursed:"☠"};ctx.font="12px system-ui";ctx.textAlign="center";ctx.fillStyle="#fff";ctx.fillText(z.eliteMods.map(x=>icons[x]||"◆").join(""),screen.x,screen.y-z.r-(boss?44:miniBoss?30:20));}
  if(z.floorAffix){const affIcons={toxic:"☣",frost:"❄",lava:"🔥",arcane:"✦",royal:"👑"};ctx.font="12px system-ui";ctx.textAlign="center";ctx.fillStyle="#fff4cc";ctx.fillText(affIcons[z.floorAffix]||"◆",screen.x,screen.y-z.r-(boss?58:miniBoss?44:34));}
  if(z.hp<z.maxHp||boss||miniBoss)bar(screen.x-z.r,screen.y-z.r-13,z.r*2,5,z.hp/z.maxHp,boss?"#e2737d":miniBoss?"#f0c86d":"#d86a72");
}

function drawHeldWeaponSprite(p,s,aim){
  const type=p.weapon?.type||"pistol";
  const img=weaponImages[type];
  const angle0=Math.atan2(aim.y,aim.x);
  const now=performance.now();

  let swing=0;
  if(meleeWeapons.has(type)&&p.id===myId){
    const elapsed=now-toolSwingStart;
    if(elapsed>=0&&elapsed<340){
      const t=elapsed/340;
      swing=-.88+Math.sin(Math.min(1,t)*Math.PI)*1.42;
    }
  }

  const angle=angle0+swing+(weaponAngleAdjust[type]||0);
  const width=heldWeaponWidth[type]||66;
  const ratio=(img&&img.naturalWidth)?img.naturalHeight/img.naturalWidth:.42;
  const height=Math.max(17,width*ratio);
  const recoil=(!meleeWeapons.has(type)&&p.id===myId&&now<muzzleFlashUntil)?3:0;

  ctx.save();
  ctx.translate(s.x,s.y);
  ctx.rotate(angle);
  if(Math.cos(angle)<0)ctx.scale(1,-1);

  if(img&&img.complete&&img.naturalWidth){
    ctx.drawImage(img,18-recoil,-height*.48,width,height);
  }else{
    ctx.strokeStyle=rarityStroke[p.weapon.rarity]||"#d5dde0";
    ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(18+width*.72,0);ctx.stroke();
  }
  ctx.restore();

  if(!meleeWeapons.has(type)&&p.id===myId&&now<muzzleFlashUntil){
    const muzzleDist=width*.88;
    const mx=s.x+Math.cos(angle0)*muzzleDist,my=s.y+Math.sin(angle0)*muzzleDist;
    ctx.fillStyle="rgba(255,232,154,.9)";ctx.beginPath();ctx.arc(mx,my,5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="rgba(255,197,92,.28)";ctx.beginPath();ctx.arc(mx,my,11,0,Math.PI*2);ctx.fill();
  }
}


function petCooldownText(p){
  const ps=p.petState||{},r=v=>v>0?`${Math.ceil(v)}${T("с","s")}`:T("ГОТОВО","READY");
  if(p.equippedPet==="panda")return `${T("Бамбук","Bamboo")} ${r(ps.attackCd||0)} · ${T("Лечение","Heal")} ${r(ps.healCd||0)}`;
  if(p.equippedPet==="cat")return `${T("Добивание","Execute")} ${r(ps.attackCd||0)} · ${T("Лечение","Heal")} ${r(ps.healCd||0)}`;
  if(p.equippedPet==="red_dragon")return `${T("Огонь","Fire")} ${r(ps.attackCd||0)}`;
  if(p.equippedPet==="axolotl")return `${T("Лечение","Heal")} ${r(ps.healCd||0)} · ${T("оборона усилена","defense boosted")}`;
  if(p.equippedPet==="duck")return `${T("Выстрел","Shot")} ${r(ps.attackCd||0)} · ${T("Лечение","Heal")} ${r(ps.healCd||0)}`;
  if(p.equippedPet==="amethyst_fury")return `${T("Луч","Beam")} ${r(ps.attackCd||0)} · ${T("Ремонт","Repair")} ${r(ps.utilityCd||0)}`;
  return "";
}

function petVisualWorldPos(p){
  const side=p.slot===1?-1:1;
  return {x:Number.isFinite(p.petX)?p.petX:p.x+side*82,y:Number.isFinite(p.petY)?p.petY:p.y+66};
}
function drawPetCompanion(p){
  const petId=p.equippedPet;if(!petId)return;
  const base=(p.id===myId&&localPred)?{...p,x:localPred.x,y:localPred.y}:smoothEntity(smoothPlayers,p);
  const wp=petVisualWorldPos(base),s=sc(wp.x,wp.y),img=petImages[petId];
  const enemyNear=state.zombies?.some(z=>Math.hypot(z.x-p.x,z.y-p.y)<380),panic=p.hp/p.maxHp<.30;
  const mood=panic?"!":enemyNear?"⚔":"•",pace=enemyNear?.010:.006,bob=Math.sin(performance.now()*pace+p.id)*(panic?7:4);
  const px=s.x,py=s.y-8+bob;
  ctx.save();ctx.globalAlpha=.90;shadow(px,py+43,21,8,.10);
  if(img&&img.complete&&img.naturalWidth)ctx.drawImage(img,px-27,py,54,54);else{ctx.fillStyle="#eef4f6";ctx.beginPath();ctx.arc(px,py+23,14,0,Math.PI*2);ctx.fill();}ctx.restore();
  const name=petInfo[petId]?.name||petId,cd=petCooldownText(p);
  ctx.textAlign="center";ctx.font="900 10px system-ui";
  const labelY=py-50;
  ctx.fillStyle="#edf5f6";ctx.fillText(`${name}  ${mood}`,px,labelY+12);ctx.font="8px system-ui";ctx.fillStyle="#9fd7b0";ctx.fillText(cd,px,labelY+25);
}

function drawPlayer(p){
  const sm=(p.id===myId&&localPred)?localPred:smoothEntity(smoothPlayers,p),s=sc(sm.x,sm.y);
  const aim=p.id===myId?norm(mouse.x-s.x,mouse.y-s.y):(p.dir||{x:1,y:0}),angle=Math.atan2(aim.y,aim.x);
  shadow(s.x,s.y+20,20,7,.27);
  if(p.downed){
    ctx.save();ctx.translate(s.x,s.y);ctx.rotate(angle+.25);ctx.fillStyle=p.slot===1?"#57cf84":"#5da2ef";ctx.globalAlpha=.66;rr(-22,-10,44,20,9);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle="#d2aa83";ctx.beginPath();ctx.arc(10,0,9,0,Math.PI*2);ctx.fill();ctx.restore();
    bar(s.x-36,s.y-34,72,6,p.revive/2.5,"#ead46f");return;
  }
  const jacket=classColors[p.character]||(p.slot===1?"#55cc83":"#5c9fed");
  const accent={starter:"#8de6a9",shooter:"#8dd8ff",cqc:"#e5c06d",flame:"#ff8350",soap:"#94e8ff"}[p.character]||jacket;
  const hair={starter:"#5a3927",shooter:"#433224",cqc:"#2d2a27",flame:"#6b2c1e",soap:"#5b3b2d"}[p.character]||"#493326";
  if(p.id===myId){ctx.strokeStyle=`${accent}58`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(s.x,s.y+2,25,0,Math.PI*2);ctx.stroke();}

  ctx.save();ctx.translate(s.x,s.y);ctx.rotate(angle);ctx.lineCap="round";ctx.lineJoin="round";
  // Legs and boots sit behind the torso, giving a readable human silhouette from above.
  ctx.strokeStyle="#263038";ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-8,-6);ctx.lineTo(-20,-8);ctx.moveTo(-8,6);ctx.lineTo(-20,8);ctx.stroke();
  ctx.strokeStyle="#0b1014";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-18,-8);ctx.lineTo(-25,-8);ctx.moveTo(-18,8);ctx.lineTo(-25,8);ctx.stroke();

  // Small backpack.
  ctx.fillStyle="#26343a";ctx.strokeStyle="#0b1115";ctx.lineWidth=2.5;rr(-16,-13,15,26,6);ctx.fill();ctx.stroke();
  ctx.fillStyle="#3d4c53";rr(-13,-9,3,18,2);ctx.fill();

  // Torso / shoulders.
  ctx.fillStyle=jacket;ctx.strokeStyle="#0c1317";ctx.lineWidth=3;rr(-7,-14,27,28,11);ctx.fill();ctx.stroke();
  ctx.fillStyle=accent;rr(5,-11,5,22,3);ctx.fill();

  // Sleeved upper arms, then skin forearms angled naturally toward the weapon.
  ctx.strokeStyle=jacket;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(4,-12);ctx.lineTo(14,-10);ctx.moveTo(4,12);ctx.lineTo(14,10);ctx.stroke();
  ctx.strokeStyle="#c99773";ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(13,-9);ctx.lineTo(22,-4);ctx.moveTo(13,9);ctx.lineTo(22,4);ctx.stroke();
  ctx.fillStyle="#d5a77e";ctx.strokeStyle="#3b281f";ctx.lineWidth=1.5;
  for(const yy of [-4,4]){ctx.beginPath();ctx.arc(22,yy,4.2,0,Math.PI*2);ctx.fill();ctx.stroke();}

  // Head is forward of the shoulders instead of sitting inside the gun sprite.
  ctx.fillStyle="#d7aa84";ctx.strokeStyle="#261a15";ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(10,0,10.5,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle=hair;ctx.beginPath();ctx.arc(8.5,0,10.7,Math.PI*.58,Math.PI*1.42);ctx.lineTo(9,0);ctx.closePath();ctx.fill();
  ctx.fillStyle="rgba(255,255,255,.20)";ctx.beginPath();ctx.arc(15,-4,2,0,Math.PI*2);ctx.fill();
  if(p.character==="flame"){ctx.fillStyle="#ff713a";ctx.beginPath();ctx.moveTo(-2,-17);ctx.lineTo(5,-23);ctx.lineTo(7,-15);ctx.fill();}
  if(p.character==="soap"){ctx.strokeStyle="#a9efff";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(-2,-16,4,0,Math.PI*2);ctx.stroke();}
  ctx.restore();

  if(p.id===myId&&activeTool==="multitool"){
    const now=performance.now(),elapsed=now-toolSwingStart;let swingOffset=0;
    if(elapsed>=0&&elapsed<250){const tt=elapsed/250;if(tt<.62)swingOffset=-.82+(tt/.62)*1.18;else swingOffset=.36-((tt-.62)/.38)*.36;}
    const baseAngle=Math.atan2(aim.y,aim.x)+swingOffset,toolColors=[null,"#aeb7bc","#b9c0c5","#f1c84b","#44d98b","#66e5ff"],toolLevel=Math.max(1,Math.min(5,Number(p.multitoolLevel)||1));ctx.save();ctx.translate(s.x,s.y);ctx.rotate(baseAngle);ctx.strokeStyle=toolLevel===1?"#9a7746":"#55636b";ctx.lineWidth=6;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(42,0);ctx.stroke();ctx.shadowColor=toolColors[toolLevel];ctx.shadowBlur=toolLevel>=3?8:2;ctx.strokeStyle=toolColors[toolLevel];ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(35,-10);ctx.lineTo(46,8);ctx.stroke();ctx.restore();
  }else if(p.id!==myId||activeTool==="gun")drawHeldWeaponSprite(p,s,aim);
  else if(activeTool==="hands"&&handsImage.complete&&handsImage.naturalWidth){const ang=Math.atan2(aim.y,aim.x);ctx.save();ctx.translate(s.x+aim.x*25,s.y+aim.y*25);ctx.rotate(ang);if(Math.cos(ang)<0)ctx.scale(1,-1);ctx.drawImage(handsImage,-21,-14,42,28);ctx.restore();}

  if((p.poisonTime||0)>0){ctx.fillStyle="rgba(145,255,116,.95)";ctx.beginPath();ctx.arc(s.x-19,s.y-17,4.5,0,Math.PI*2);ctx.fill();}
  if((p.burnTime||0)>0){ctx.fillStyle="rgba(255,130,70,.98)";ctx.beginPath();ctx.arc(s.x+19,s.y-17,4.5,0,Math.PI*2);ctx.fill();}
  bar(s.x-30,s.y+42,60,6,p.hp/p.maxHp,p.slot===1?"#58d489":"#63a9ff");
  ctx.textAlign="center";ctx.fillStyle="#d7bd70";ctx.font="800 9px system-ui";ctx.fillText(displayTitle(p.selectedTitle||"Новичок"),s.x,s.y-43);ctx.fillStyle="#edf4f5";ctx.font="900 11px system-ui";ctx.fillText(p.name,s.x,s.y-31);
}
function drawBullets(){
  const age=Math.min(.085,Math.max(0,(performance.now()-lastSnapshotAt)/1000));
  const now=performance.now();

  for(const b of state.bullets){
    if(b.kind==="meleeFx")continue;

    const vx=b.vx||0,vy=b.vy||0;
    const px=b.x+vx*age;
    const py=b.y+vy*age;
    if(!vis(px,py,35))continue;

    const s=sc(px,py);
    const n=norm(vx,vy);
    const speed=Math.hypot(vx,vy);

    if(b.kind==="cannon"){
      ctx.strokeStyle="rgba(170,178,181,.42)";ctx.lineWidth=6;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(s.x-n.x*26,s.y-n.y*26);ctx.lineTo(s.x,s.y);ctx.stroke();ctx.fillStyle="#252a2d";ctx.beginPath();ctx.arc(s.x,s.y,Math.max(7,b.r),0,Math.PI*2);ctx.fill();ctx.strokeStyle="#9ca6aa";ctx.lineWidth=2;ctx.stroke();continue;
    }
    if(b.kind==="frostTower"){
      ctx.strokeStyle="rgba(167,235,255,.58)";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(s.x-n.x*20,s.y-n.y*20);ctx.lineTo(s.x,s.y);ctx.stroke();ctx.fillStyle="#d3f6ff";ctx.beginPath();ctx.arc(s.x,s.y,Math.max(5,b.r),0,Math.PI*2);ctx.fill();continue;
    }

    if(b.kind==="bubble"){
      const wobble=Math.sin(now*.012+b.id)*2.2;
      ctx.fillStyle="rgba(183,231,255,.20)";
      ctx.strokeStyle="rgba(224,250,255,.92)";
      ctx.lineWidth=1.6;
      ctx.beginPath();ctx.arc(s.x,s.y+wobble,Math.max(7,b.r),0,Math.PI*2);ctx.fill();ctx.stroke();

      ctx.fillStyle="rgba(255,255,255,.8)";
      ctx.beginPath();ctx.arc(s.x-3,s.y+wobble-3,2.3,0,Math.PI*2);ctx.fill();
      continue;
    }

    const tail=Math.min(b.rarity==="legendary"?34:22,7+speed*.012);
    const tracer={common:"rgba(246,239,189,.38)",uncommon:"rgba(125,224,156,.45)",rare:"rgba(100,174,255,.55)",epic:"rgba(197,127,255,.60)",legendary:"rgba(255,211,91,.78)"}[b.rarity]||"rgba(246,239,189,.38)";
    ctx.strokeStyle=tracer;
    ctx.lineWidth=Math.max(b.rarity==="legendary"?2.5:1.4,b.r*.65);
    ctx.lineCap="round";
    ctx.beginPath();
    ctx.moveTo(s.x-n.x*tail,s.y-n.y*tail);
    ctx.lineTo(s.x,s.y);
    ctx.stroke();

    ctx.fillStyle={common:"#fff4bd",uncommon:"#adf6bf",rare:"#a8d2ff",epic:"#e2b8ff",legendary:"#ffe37c"}[b.rarity]||"#fff4bd";
    ctx.beginPath();ctx.arc(s.x,s.y,Math.max(2,b.r+(b.rarity==="legendary"?1.5:0)),0,Math.PI*2);ctx.fill();
  }
}

function drawHarvestParticles(){
  const now=performance.now();

  for(let i=harvestParticles.length-1;i>=0;i--){
    const p=harvestParticles[i];
    const age=now-p.born;
    if(age>=p.life){harvestParticles.splice(i,1);continue}

    const t=age/1000;
    const fade=1-age/p.life;
    const x=p.x+p.vx*t;
    const y=p.y+p.vy*t+110*t*t;
    if(!vis(x,y,30))continue;

    const s=sc(x,y);
    ctx.globalAlpha=fade;
    ctx.fillStyle=p.type==="tree"?"#9b6b3f":p.type==="rock"?"#9aa2a6":"#c3a758";
    ctx.fillRect(s.x,s.y,p.size,p.size);
  }
  ctx.globalAlpha=1;
}

function drawDamageFloats(){
  const now=performance.now();
  for(let i=damageFloats.length-1;i>=0;i--){
    const f=damageFloats[i];
    const age=now-f.born;
    if(age>=f.life){damageFloats.splice(i,1);continue}

    const t=age/f.life;
    const s=sc(f.x,f.y-28*t);
    ctx.globalAlpha=1-t;
    ctx.textAlign="center";
    ctx.font="800 14px system-ui";
    ctx.fillStyle="#f3e6a4";
    ctx.fillText(f.text,s.x,s.y);
  }
  ctx.globalAlpha=1;
}

function drawWorldEffects(){
  if(!state.effects)return;
  for(const e of state.effects){
    const s=sc(e.x,e.y);
    const fade=clamp((e.life||.3)/.45,0,1);
    if(e.type==="acid"){
      const b=sc(e.x2,e.y2);ctx.strokeStyle=`rgba(113,235,125,${Math.max(.25,fade)})`;ctx.lineWidth=5;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      ctx.strokeStyle=`rgba(205,255,183,${fade*.7})`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
    if(e.type==="explosion"){
      ctx.fillStyle=`rgba(255,113,52,${fade*.25})`;ctx.beginPath();ctx.arc(s.x,s.y,e.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle=`rgba(255,174,82,${fade*.75})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(s.x,s.y,e.r*.75,0,Math.PI*2);ctx.stroke();
    }
    if(e.type==="petHeal"){
      ctx.strokeStyle=`rgba(126,241,167,${fade})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(s.x,s.y,e.r*(1+(1-fade)*.28),0,Math.PI*2);ctx.stroke();
      ctx.fillStyle=`rgba(126,241,167,${fade*.10})`;ctx.beginPath();ctx.arc(s.x,s.y,e.r*.75,0,Math.PI*2);ctx.fill();
    }
    if(e.type==="bamboo"){
      const target=sc(e.x2,e.y2),dx=target.x-s.x,dy=target.y-s.y,angle=Math.atan2(dy,dx);
      ctx.save();ctx.translate(s.x,s.y);ctx.rotate(angle+Math.PI/2);ctx.globalAlpha=Math.min(1,fade*1.8);
      if(bambooImg.complete&&bambooImg.naturalWidth)ctx.drawImage(bambooImg,-7,-34,14,68);
      else{ctx.strokeStyle="#79b34d";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,30);ctx.lineTo(0,-30);ctx.stroke();}
      ctx.restore();ctx.globalAlpha=1;
    }
    if(e.type==="bambooImpact"){
      ctx.strokeStyle=`rgba(153,220,91,${fade})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(s.x,s.y,(e.r||34)*(1-fade*.25),0,Math.PI*2);ctx.stroke();
    }
    if(e.type==="claw"){
      ctx.strokeStyle=`rgba(235,244,250,${fade})`;ctx.lineWidth=3;for(let k=-1;k<=1;k++){ctx.beginPath();ctx.moveTo(s.x-10+k*7,s.y-13);ctx.lineTo(s.x+5+k*7,s.y+13);ctx.stroke();}
    }
    if(e.type==="catPounce"){
      const b=sc(e.x2,e.y2),total=Math.max(.01,e.maxLife||.30),pr=clamp(1-(e.life||0)/total,0,1),px=s.x+(b.x-s.x)*pr,py=s.y+(b.y-s.y)*pr;
      ctx.strokeStyle=`rgba(235,244,250,${fade*.55})`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(px,py);ctx.stroke();
      ctx.fillStyle=`rgba(255,255,255,${fade})`;ctx.beginPath();ctx.arc(px,py,5,0,Math.PI*2);ctx.fill();
    }
    if(e.type==="dragonFire"){
      const b=sc(e.x2,e.y2);ctx.strokeStyle=`rgba(255,96,38,${fade})`;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.strokeStyle=`rgba(255,205,83,${fade*.75})`;ctx.lineWidth=2;ctx.stroke();
    }
    if(e.type==="duckShot"){
      const b=sc(e.x2,e.y2);ctx.strokeStyle=`rgba(255,226,92,${fade})`;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
    if(e.type==="amethystBeam"){
      const b=sc(e.x2,e.y2);ctx.strokeStyle=`rgba(204,91,255,${fade})`;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.strokeStyle=`rgba(255,222,255,${fade*.8})`;ctx.lineWidth=1.5;ctx.stroke();
    }
    if(e.type==="amethystRepair"){
      ctx.strokeStyle=`rgba(206,96,255,${fade})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(s.x,s.y,24*(1+(1-fade)*.2),0,Math.PI*2);ctx.stroke();
      if(Number.isFinite(e.x2)){const b=sc(e.x2,e.y2);ctx.strokeStyle=`rgba(206,96,255,${fade*.65})`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
    }
    if(e.type==="towerLightning"){const b=sc(e.x2,e.y2),dx=b.x-s.x,dy=b.y-s.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;ctx.strokeStyle=`rgba(154,225,255,${fade})`;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(s.x,s.y);for(let j=1;j<6;j++){const t=j/6,off=(j%2?1:-1)*6;ctx.lineTo(s.x+dx*t+nx*off,s.y+dy*t+ny*off);}ctx.lineTo(b.x,b.y);ctx.stroke();ctx.strokeStyle=`rgba(240,252,255,${fade*.8})`;ctx.lineWidth=1.5;ctx.stroke();}
    if(e.type==="towerCatPaw"){const b=sc(e.x2,e.y2),total=Math.max(.01,e.maxLife||.24),pr=clamp(1-(e.life||0)/total,0,1),px=s.x+(b.x-s.x)*pr,py=s.y+(b.y-s.y)*pr;ctx.fillStyle=`rgba(222,184,145,${fade})`;ctx.beginPath();ctx.arc(px,py,9,0,Math.PI*2);ctx.fill();for(let j=-1;j<=1;j++){ctx.beginPath();ctx.arc(px+j*7,py-9,4,0,Math.PI*2);ctx.fill();}}
    if(e.type==="towerFlame"){const b=sc(e.x2,e.y2);ctx.strokeStyle=`rgba(255,105,42,${fade})`;ctx.lineWidth=11;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.strokeStyle=`rgba(255,219,92,${fade*.75})`;ctx.lineWidth=4;ctx.stroke();}
    if(e.type==="towerFrostHit"){ctx.strokeStyle=`rgba(185,240,255,${fade})`;ctx.lineWidth=2.5;for(let j=0;j<6;j++){const a=j*Math.PI/3;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x+Math.cos(a)*(e.r||38),s.y+Math.sin(a)*(e.r||38));ctx.stroke();}}
    if(e.type==="cannonImpact"||e.type==="cannonMuzzle"){ctx.strokeStyle=`rgba(202,190,166,${fade})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(s.x,s.y,(e.r||24)*(1+(1-fade)*.35),0,Math.PI*2);ctx.stroke();}
    if(e.type==="legendaryChain"){const b=sc(e.x2,e.y2);ctx.strokeStyle=`rgba(255,217,102,${fade})`;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
    if(e.type==="repairSpark"){ctx.fillStyle=`rgba(116,224,165,${fade})`;for(let i=0;i<6;i++){const a=i*Math.PI/3+performance.now()*.01;ctx.fillRect(s.x+Math.cos(a)*18,s.y+Math.sin(a)*18,3,3);}}
    if(e.type==="leap"){ctx.strokeStyle=`rgba(238,198,112,${fade})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(s.x,s.y,e.r,0,Math.PI*2);ctx.stroke();}
    if(e.type==="sapperCharge"){const b=sc(e.x2,e.y2);ctx.strokeStyle=`rgba(255,142,62,${fade})`;ctx.lineWidth=4;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);}
    if(e.type==="necro"){ctx.strokeStyle=`rgba(165,116,225,${fade})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(s.x,s.y,e.r*(1+(1-fade)*.35),0,Math.PI*2);ctx.stroke();}
    if(e.type==="shadowBlink"){ctx.fillStyle=`rgba(137,82,219,${fade*.2})`;ctx.beginPath();ctx.arc(s.x,s.y,e.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle=`rgba(198,137,255,${fade})`;ctx.stroke();}
    if(e.type==="frostHit"){ctx.strokeStyle=`rgba(160,235,255,${fade})`;ctx.lineWidth=3;for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x+Math.cos(a)*e.r,s.y+Math.sin(a)*e.r);ctx.stroke();}}
    if(e.type==="cursedBurst"){ctx.strokeStyle=`rgba(158,70,186,${fade})`;ctx.lineWidth=5;ctx.beginPath();ctx.arc(s.x,s.y,e.r*(1+(1-fade)*.25),0,Math.PI*2);ctx.stroke();}
    if(e.type==="bossPulse"){ctx.strokeStyle=`rgba(240,195,125,${fade})`;ctx.lineWidth=5;ctx.beginPath();ctx.arc(s.x,s.y,e.r*(1+(1-fade)*.25),0,Math.PI*2);ctx.stroke();}
    if(e.type==="bossDash"){ctx.fillStyle=`rgba(236,85,91,${fade*.18})`;ctx.beginPath();ctx.arc(s.x,s.y,e.r,0,Math.PI*2);ctx.fill();}
    if(e.type==="bossRock"){ctx.save();ctx.fillStyle="#8b7a67";ctx.shadowColor="rgba(236,172,94,.65)";ctx.shadowBlur=8;ctx.beginPath();ctx.arc(s.x,s.y,11,0,Math.PI*2);ctx.fill();ctx.restore();}
    if(e.type==="bossRockImpact"){ctx.strokeStyle=`rgba(222,164,96,${fade})`;ctx.lineWidth=5;ctx.beginPath();ctx.arc(s.x,s.y,e.r*(1+(1-fade)*.35),0,Math.PI*2);ctx.stroke();}
    if(e.type==="slam"){
      ctx.strokeStyle=`rgba(214,224,226,${fade*.7})`;ctx.lineWidth=5;ctx.beginPath();ctx.arc(s.x,s.y,e.r,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=`rgba(214,224,226,${fade*.25})`;ctx.lineWidth=12;ctx.beginPath();ctx.arc(s.x,s.y,e.r*.62,0,Math.PI*2);ctx.stroke();
    }
  }
}

function drawNight(){
  if(state.phase!=="night")return;
  const p=myPlayer();if(!p)return;

  // A light night tint only. Never erase the already-rendered scene.
  ctx.save();
  ctx.globalCompositeOperation="source-over";
  ctx.fillStyle="rgba(3,10,16,.14)";
  ctx.fillRect(0,0,innerWidth,innerHeight);

  // Soft moonlight around the local player.
  const playerPos=(p.id===myId&&localPred)?localPred:smoothEntity(smoothPlayers,p);
  const s=sc(playerPos.x,playerPos.y);
  const pg=ctx.createRadialGradient(s.x,s.y,20,s.x,s.y,520);
  pg.addColorStop(0,"rgba(120,175,160,.13)");
  pg.addColorStop(.38,"rgba(95,145,135,.07)");
  pg.addColorStop(1,"rgba(95,145,135,0)");
  ctx.fillStyle=pg;
  ctx.beginPath();ctx.arc(s.x,s.y,520,0,Math.PI*2);ctx.fill();

  // The upgraded base emits a visible, soft green light.
  const core=state.core,q=sc(core.x,core.y);
  const lightMult=state.nightModifier?.light||1;
  const baseLight=Math.max(260,Math.max(420,core.light*1.15)*lightMult);
  const cg=ctx.createRadialGradient(q.x,q.y,18,q.x,q.y,baseLight);
  cg.addColorStop(0,"rgba(111,224,155,.20)");
  cg.addColorStop(.45,"rgba(95,190,135,.09)");
  cg.addColorStop(1,"rgba(95,190,135,0)");
  ctx.fillStyle=cg;
  ctx.beginPath();ctx.arc(q.x,q.y,baseLight,0,Math.PI*2);ctx.fill();

  // Accepted night events visibly change the whole world, not just the HUD text.
  const mod=state.nightModifier?.id;
  if(mod==="blood"){
    ctx.fillStyle="rgba(115,12,18,.13)";ctx.fillRect(0,0,innerWidth,innerHeight);
    const vg=ctx.createRadialGradient(innerWidth/2,innerHeight/2,80,innerWidth/2,innerHeight/2,Math.max(innerWidth,innerHeight)*.72);
    vg.addColorStop(0,"rgba(100,0,0,0)");vg.addColorStop(1,"rgba(110,0,8,.18)");ctx.fillStyle=vg;ctx.fillRect(0,0,innerWidth,innerHeight);
  }else if(mod==="acid"){
    ctx.fillStyle="rgba(90,112,24,.10)";ctx.fillRect(0,0,innerWidth,innerHeight);
    ctx.strokeStyle="rgba(177,213,71,.16)";ctx.lineWidth=1;
    const t=performance.now()*.18;
    for(let i=0;i<38;i++){const x=(i*97+t)%innerWidth,y=(i*61+t*1.7)%innerHeight;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-8,y+28);ctx.stroke();}
  }else if(mod==="fullmoon"){
    ctx.fillStyle="rgba(125,155,205,.10)";ctx.fillRect(0,0,innerWidth,innerHeight);
    const mg=ctx.createRadialGradient(innerWidth*.78,innerHeight*.16,10,innerWidth*.78,innerHeight*.16,360);
    mg.addColorStop(0,"rgba(205,224,255,.18)");mg.addColorStop(1,"rgba(160,190,230,0)");ctx.fillStyle=mg;ctx.fillRect(0,0,innerWidth,innerHeight);
  }else if(mod==="blackout"){
    ctx.fillStyle="rgba(0,0,8,.28)";ctx.fillRect(0,0,innerWidth,innerHeight);
    const bg=ctx.createRadialGradient(s.x,s.y,60,s.x,s.y,360);
    bg.addColorStop(0,"rgba(75,105,120,.05)");bg.addColorStop(1,"rgba(0,0,0,.18)");ctx.fillStyle=bg;ctx.fillRect(0,0,innerWidth,innerHeight);
  }
  ctx.restore();
}
function drawMiniMap(x=innerWidth-256,y=16,w=220,h=170){
  hudPanel(x,y,w,h,{fill:'rgba(5,10,13,.92)',stroke:'rgba(185,211,255,.16)'});
  const mapPad=10,mx=x+mapPad,my=y+mapPad,mw=w-mapPad*2,mh=h-mapPad*2;
  ctx.fillStyle='rgba(12,18,22,.96)';rr(mx,my,mw,mh,14);ctx.fill();
  const sx=mw/state.world.w,sy=mh/state.world.h;
  for(const st of state.structures||[]){
    if(st.type==='wall'||st.type==='gate'){
      const ww=st.type==='gate'?8:6;
      const px=mx+st.x*sx,py=my+st.y*sy;
      ctx.save();ctx.translate(px,py);ctx.rotate(st.rotation||0);ctx.fillStyle=st.type==='gate'?'#ad7c52':'#728092';ctx.fillRect(-24*sx,-ww/2,48*sx,ww);ctx.restore();
    }
  }
  ctx.fillStyle='rgba(253,182,79,.85)';
  for(const r of state.resources||[]){ctx.fillRect(mx+r.x*sx-1.5,my+r.y*sy-1.5,3,3)}
  if(state.core){ctx.fillStyle='#63e08f';ctx.beginPath();ctx.arc(mx+state.core.x*sx,my+state.core.y*sy,5,0,Math.PI*2);ctx.fill();}
  for(const p of state.players||[]){ctx.fillStyle=p.slot===1?'#59d88f':'#66a8ff';ctx.beginPath();ctx.arc(mx+p.x*sx,my+p.y*sy,4,0,Math.PI*2);ctx.fill();}
  for(let i=0;i<(state.zombies||[]).length&&i<90;i++){const z=state.zombies[i],boss=String(z.type||'').startsWith('boss_'),mini=String(z.type||'').startsWith('mini_');ctx.fillStyle=boss?'#ff5557':mini?'#ffad57':'#d84d50';const d=boss?6:mini?5:2.5;ctx.fillRect(mx+z.x*sx-d/2,my+z.y*sy-d/2,d,d);}
  const globalMajor=state.majorEnemy;if(globalMajor&&!(state.zombies||[]).some(z=>z.id===globalMajor.id)){const boss=String(globalMajor.type||'').startsWith('boss_'),d=boss?7:6;ctx.fillStyle=boss?'#ff5557':'#ffad57';ctx.fillRect(mx+globalMajor.x*sx-d/2,my+globalMajor.y*sy-d/2,d,d);ctx.strokeStyle='rgba(255,255,255,.65)';ctx.strokeRect(mx+globalMajor.x*sx-d/2-1,my+globalMajor.y*sy-d/2-1,d+2,d+2);}
  ctx.textAlign='center';ctx.font='900 15px system-ui';ctx.fillStyle='#fff';ctx.fillText('N',x+w/2,y+11);ctx.fillText('S',x+w/2,y+h-6);ctx.fillText('W',x+8,y+h/2+5);ctx.fillText('E',x+w-8,y+h/2+5);ctx.textAlign='left';
}

function fitCanvasText(text,maxWidth,startSize=13,minSize=9,weight="700"){
  let size=startSize;
  while(size>minSize){
    ctx.font=`${weight} ${size}px system-ui`;
    if(ctx.measureText(text).width<=maxWidth)break;
    size--;
  }
  return size;
}

function modifierDisplayName(mod){
  if(!mod)return "";
  const en={blood:"BLOOD NIGHT",acid:"ACID RAIN",fullmoon:"FULL MOON",blackout:"BLACK NIGHT"};
  return isEn()?(en[mod.id]||translateServerText(mod.name||"")):(mod.name||"");
}
function drawHUD(){
  const p=myPlayer();if(!p)return;
  ctx.textAlign='left';
  const floorTheme=currentFloorTheme(),tiny=innerWidth<1100,compact=innerWidth<1500;
  const leftX=14,topY=12,cardW=tiny?240:compact?266:290,cardH=tiny?62:70,cardGap=9;
  const players=(state.players||[]).slice().sort((a,b)=>(a.slot||99)-(b.slot||99)).slice(0,2);
  players.forEach((pl,i)=>{
    const y=topY+i*(cardH+cardGap);hudPanel(leftX,y,cardW,cardH,{fill:'rgba(7,11,16,.91)',stroke:'rgba(105,157,222,.25)'});
    const av=tiny?42:48;drawHudAvatar(leftX+(tiny?32:38),y+cardH/2,av,pl,pl.slot===1?'#f0b356':'#8dc3ff');
    const bx=leftX+(tiny?60:72),bw=cardW-(tiny?72:94);
    ctx.fillStyle='#f4f6f8';ctx.font=`900 ${tiny?14:17}px system-ui`;ctx.save();ctx.beginPath();ctx.rect(bx,y,bw,24);ctx.clip();ctx.fillText(pl.name||`${T('Игрок','Player')} ${i+1}`,bx,y+(tiny?18:21));ctx.restore();
    hudBar(bx,y+(tiny?25:27),bw,13,(pl.hp||0)/Math.max(1,pl.maxHp||100),'#e34b55');
    hudBar(bx,y+(tiny?43:47),bw,10,(pl.stamina!=null?pl.stamina:pl.xp||0)/Math.max(1,(pl.staminaMax||pl.nextXp||100)),'#3497e9');
    ctx.fillStyle='#fff';ctx.font=`850 ${tiny?10:11}px system-ui`;ctx.textAlign='right';ctx.fillText(`${Math.ceil(pl.hp||0)}/${pl.maxHp||100}`,bx+bw-5,y+(tiny?36:38));ctx.textAlign='left';
  });

  if((p.comboCount||0)>=2){
    const cy=topY+2*(cardH+cardGap)+2,ch=tiny?54:60,tier=Math.max(0,p.comboTier||0),accent=comboAccent(tier);
    hudPanel(leftX,cy,cardW,ch,{fill:'rgba(10,12,17,.92)',stroke:accent+'66'});
    ctx.fillStyle=accent;ctx.font=`950 ${tiny?21:25}px system-ui`;ctx.fillText(`x${p.comboCount} COMBO`,leftX+12,cy+(tiny?23:27));
    const rank=comboRankText(tier);ctx.textAlign='right';ctx.font=`900 ${tiny?10:12}px system-ui`;ctx.fillText(rank||T('СЕРИЯ УБИЙСТВ','KILL STREAK'),leftX+cardW-12,cy+(tiny?20:23));ctx.textAlign='left';
    if(tier>0){ctx.fillStyle='#bfc9cd';ctx.font=`800 ${tiny?9:10}px system-ui`;ctx.fillText(`${T('Урон','Damage')} +${[0,5,10,16,22,30][tier]}% · ${T('Скорость','Speed')} +${[0,3,5,8,10,12][tier]}%`,leftX+12,cy+(tiny?38:43));}
    hudBar(leftX+12,cy+ch-9,cardW-24,5,Math.min(1,(p.comboTimer||0)/4.6),accent);
  }

  const rightW=tiny?206:compact?224:244,rightX=innerWidth-rightW-14,floorY=12;
  const centerLeft=leftX+cardW+20,centerRight=rightX-18,centerAvail=Math.max(300,centerRight-centerLeft);
  const waveW=Math.min(compact?520:560,centerAvail),waveX=centerLeft+(centerAvail-waveW)/2,waveY=10;
  hudPanel(waveX,waveY,waveW,78,{fill:'rgba(8,10,15,.93)',stroke:'rgba(255,107,107,.23)'});
  const total=Math.max(1,state.waveTotal||state.zombiesRemaining||1),remain=Math.max(0,state.zombiesRemaining||0);
  const progress=state.phase==='night'?1-remain/total:1-Math.max(0,state.phaseTimer||0)/(state.wave===0?15:21);
  ctx.fillStyle='#f7f8fa';ctx.font=`950 ${tiny?20:24}px system-ui`;ctx.textAlign='center';ctx.fillText(`${T('Волна','Wave')} ${state.wave}/50`,waveX+waveW/2,waveY+27);
  ctx.fillStyle='#ff7478';ctx.font=`950 ${tiny?24:28}px system-ui`;ctx.fillText('☠',waveX+27,waveY+47);
  hudBar(waveX+52,waveY+34,waveW-104,14,progress,'#d94c56');
  ctx.fillStyle='#e9eef0';ctx.font=`850 ${tiny?11:13}px system-ui`;
  const subtitle=state.phase==='night'?`${T('Зомби осталось','Zombies left')}: ${remain}`:`${T('Следующая волна через','Next wave in')}: ${Math.ceil(Math.max(0,state.phaseTimer||0))}${T('с','s')}`;
  ctx.fillText(subtitle,waveX+waveW/2,waveY+62);ctx.textAlign='left';

  const major=state.majorEnemy||(state.zombies||[]).find(z=>String(z.type||'').startsWith('boss_'))||(state.zombies||[]).find(z=>String(z.type||'').startsWith('mini_'));
  if(major){
    const bw=Math.min(waveW,520),bx=waveX+(waveW-bw)/2,by=96;hudPanel(bx,by,bw,54,{fill:'rgba(47,9,12,.95)',stroke:'rgba(255,91,69,.34)'});
    ctx.fillStyle='#ffd9cf';ctx.font=`950 ${tiny?11:13}px system-ui`;ctx.textAlign='center';ctx.fillText(zombieNames[major.type]||major.type,bx+bw/2,by+18);
    hudBar(bx+24,by+27,bw-48,12,major.hp/Math.max(1,major.maxHp),'#e24749');ctx.fillStyle='#fff0eb';ctx.font='900 10px system-ui';ctx.fillText(`${Math.ceil(major.hp)} / ${Math.ceil(major.maxHp)} HP`,bx+bw/2,by+47);ctx.textAlign='left';
  }else if(state.eventText){
    ctx.fillStyle='#ffb878';ctx.font=`900 ${fitCanvasText(translateServerText(state.eventText),waveW,15,10,'900')}px system-ui`;ctx.textAlign='center';ctx.fillText(translateServerText(state.eventText),waveX+waveW/2,waveY+104);ctx.textAlign='left';
  }

  const floorH=58;hudPanel(rightX,floorY,rightW,floorH,{fill:'rgba(7,11,17,.93)',stroke:'rgba(255,174,97,.23)'});
  ctx.fillStyle=floorTheme.hud;ctx.font=`950 ${tiny?15:17}px system-ui`;ctx.fillText(`${T('Этаж','Floor')} ${Math.max(1,Math.min(10,(Number(state.floorStage)||0)+1))}/10`,rightX+12,floorY+22);
  ctx.fillStyle='#f2bd6b';ctx.font=`850 ${fitCanvasText(currentFloorName(),rightW-68,tiny?11:12,9,'850')}px system-ui`;ctx.fillText(currentFloorName(),rightX+12,floorY+43);
  ctx.fillStyle=floorTheme.accentA;rr(rightX+rightW-52,floorY+9,42,40,10);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.18)';rr(rightX+rightW-51.5,floorY+9.5,41,39,10);ctx.stroke();
  if(floorTheme.pattern==='lava'){ctx.strokeStyle='rgba(255,132,66,.72)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(rightX+rightW-45,floorY+21);ctx.lineTo(rightX+rightW-36,floorY+36);ctx.lineTo(rightX+rightW-25,floorY+18);ctx.lineTo(rightX+rightW-17,floorY+39);ctx.stroke();}
  else if(floorTheme.pattern==='frost'){ctx.strokeStyle='rgba(190,240,255,.70)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(rightX+rightW-31,floorY+15);ctx.lineTo(rightX+rightW-31,floorY+43);ctx.moveTo(rightX+rightW-45,floorY+29);ctx.lineTo(rightX+rightW-17,floorY+29);ctx.stroke();}
  else {ctx.fillStyle=floorTheme.hud;ctx.beginPath();ctx.arc(rightX+rightW-31,floorY+29,8,0,Math.PI*2);ctx.fill();}

  const mapY=floorY+floorH+8,mapH=tiny?136:compact?150:168;drawMiniMap(rightX,mapY,rightW,mapH);
  const objY=mapY+mapH+8,objH=tiny?98:106;hudPanel(rightX,objY,rightW,objH,{fill:'rgba(7,11,17,.92)',stroke:'rgba(182,208,255,.14)'});
  ctx.fillStyle='#eef3f5';ctx.font=`950 ${tiny?12:13}px system-ui`;ctx.fillText(T('Задачи','Objectives'),rightX+12,objY+19);
  ctx.font=`850 ${tiny?10:12}px system-ui`;ctx.fillStyle='#aee9b6';ctx.fillText(`☑ ${T('Защищайте генератор','Protect the generator')}`,rightX+12,objY+42);
  ctx.fillStyle=state.phase==='victory'?'#aee9b6':'#d9e1e4';ctx.fillText(`${state.phase==='victory'?'☑':'☐'} ${T('Выживите 50 волн','Survive 50 waves')}`,rightX+12,objY+62);

  ctx.fillStyle=state.flawless?'#f0c877':'#9ba7b4';ctx.font='800 10px system-ui';ctx.fillText(state.phase==='night'?(state.flawless?T('◆ Чистая оборона: бонус активен','◆ Flawless defense: bonus active'):T('◇ Бонус обороны потерян','◇ Defense bonus lost')):T('◆ Новый этаж: ремонт построек 25%','◆ New floor: repair structures 25%'),rightX+12,objY+84);

  const res=[['🪵',T('Дерево','Wood'),p.inventory.wood||0,'#ba7a4b'],['🪨',T('Камень','Stone'),p.inventory.stone||0,'#b9c2c8'],['⚙',T('Металл','Scrap'),p.inventory.scrap||0,'#d1d8db'],['◉',T('Серебро','Silver'),p.silver||0,'#dce7ec'],['🪙',T('Золото','Gold'),p.gold||0,'#ffc85c'],['🎟',T('Жетон','Token'),p.crateTokens||0,'#d596ff']];
  const rpH=tiny?166:178,rpY=Math.max(objY+objH+10,innerHeight-rpH-14);hudPanel(rightX,rpY,rightW,rpH,{fill:'rgba(7,11,17,.93)',stroke:'rgba(182,208,255,.14)'});
  const rowH=(rpH-16)/6;res.forEach((it,idx)=>{const yy=rpY+8+idx*rowH;ctx.fillStyle='rgba(255,255,255,.045)';rr(rightX+8,yy,rightW-16,rowH-3,8);ctx.fill();ctx.fillStyle=it[3];ctx.font=`900 ${tiny?12:14}px system-ui`;ctx.fillText(it[0],rightX+14,yy+rowH*.62);ctx.fillStyle='#dfe7ea';ctx.font=`850 ${tiny?9:11}px system-ui`;ctx.fillText(it[1],rightX+36,yy+rowH*.62);ctx.textAlign='right';ctx.fillStyle='#fff';ctx.font=`950 ${tiny?11:13}px system-ui`;ctx.fillText((Number(it[2])||0).toLocaleString('ru-RU'),rightX+rightW-13,yy+rowH*.62);ctx.textAlign='left';});

  // Compact ammo strip above the hotbar; the weapon slot already contains the detailed weapon info.
  const melee=meleeWeapons.has(p.weapon.type),ammo=p.weaponAmmo||{},ammoText=melee?T('БЛИЖНИЙ БОЙ','MELEE'):(ammo.reloading?`${T('ПЕРЕЗАРЯДКА','RELOADING')} ${Math.max(0,ammo.reloadTimer||0).toFixed(1)}${T('с','s')}`:`${ammo.mag||0} / ${ammo.max||0}`);
  const stripW=tiny?210:250,stripX=(innerWidth-stripW)/2,stripY=innerHeight-134;hudPanel(stripX,stripY,stripW,30,{fill:'rgba(7,11,16,.90)',stroke:'rgba(121,182,255,.16)'});ctx.textAlign='center';ctx.fillStyle=ammo.reloading?'#f0cb70':'#91d8ff';ctx.font='900 12px system-ui';ctx.fillText(`${weaponNames[p.weapon.type]||T('Оружие','Weapon')} · ${ammoText}`,stripX+stripW/2,stripY+20);ctx.textAlign='left';

  if(comboFlash && performance.now()>=comboFlash.until)comboFlash=null;
}

function frame(now){
  requestAnimationFrame(frame);
  fpsFrames++;if(now-fpsSampleStart>=500){currentFps=Math.round(fpsFrames*1000/(now-fpsSampleStart));fpsFrames=0;fpsSampleStart=now;$("fpsValue").textContent=`FPS ${currentFps}`;$("pingValue").textContent=`PING ${currentPing==null?"--":currentPing+" ms"}`;}
  $("languageSwitch")?.classList.toggle("hidden",!lobby.classList.contains("visible"));
  const inRun=!!state?.started&&!lobby.classList.contains("visible");gameRail?.classList.toggle("hidden",!inRun);combatLogPanel?.classList.toggle("hidden",!inRun);$("quickSettingsBtn")?.classList.toggle("hidden",!inRun);$("performanceHud")?.classList.toggle("hidden",!inRun||!settings.performanceHud);
  const dt=Math.min(.05,((now||performance.now())-lastFrameTime)/1000);
  lastFrameTime=now||performance.now();
  ctx.clearRect(0,0,innerWidth,innerHeight);
  if(!state)return;
  updateLocalPrediction(dt);
  updateCamera();
  updateCoreActions();
  const shakeNow=performance.now();
  if(shakeNow<screenShakeUntil){const rem=clamp((screenShakeUntil-shakeNow)/260,0,1);renderShakeX=(Math.random()*2-1)*screenShakePower*rem;renderShakeY=(Math.random()*2-1)*screenShakePower*rem;}
  else{renderShakeX=0;renderShakeY=0;screenShakePower=0;}
  updateUnifiedUI();
  updateInteractionHint();
  if(state.phase!==lastPhaseSeen){
    if(lastPhaseSeen){ambientCue(state.phase);}
    lastPhaseSeen=state.phase;
  }
  drawGround();
  drawBaseCourtyard();
  drawAmbientWorldProps();
  drawFloorDecor();
  drawResources();
  drawMovementDust();
  drawHarvestParticles();
  drawCore();
  drawStructures();
  drawLoot();
  for(const z of state.zombies)drawZombie(z);
  drawWorldEffects();
  drawBullets();
  drawDamageFloats();
  for(const p of state.players)drawPlayer(p);
  for(const p of state.players)drawPetCompanion(p);
  drawBuildPreview();
  drawNight();
  drawFloorAtmosphere();
  drawHUD();
}
frame();
})(); 
