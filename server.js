const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 8091;
const BUILD_VERSION = "8.0.0";
const QA_ADMIN_ENABLED = process.env.NSD_QA_ADMIN === "1" && process.env.NODE_ENV !== "production";
const WS_MAX_PAYLOAD = 64 * 1024;
const WS_MAX_MESSAGES_PER_SEC = 180;
const PUBLIC = path.join(__dirname, "public");
const SAVE_DIR = path.join(__dirname, "saves");
if (!fs.existsSync(SAVE_DIR)) fs.mkdirSync(SAVE_DIR, { recursive: true });


// v8 account layer. It intentionally uses only Node built-ins so Render/VPS deploys
// do not need another dependency. For public production use, move this store to SQL.
const ACCOUNTS_FILE = path.join(SAVE_DIR, "accounts.json");
const RENAME_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_TTL_MS = 5 * 24 * 60 * 60 * 1000;
const MAX_SESSIONS_PER_ACCOUNT = 5;
let accounts = Object.create(null);
function loadAccounts(){
  try{const raw=JSON.parse(fs.readFileSync(ACCOUNTS_FILE,"utf8"));if(raw&&typeof raw==="object")accounts=raw;}catch{}
}
function saveAccounts(){
  try{const tmp=ACCOUNTS_FILE+".tmp";fs.writeFileSync(tmp,JSON.stringify(accounts,null,2),"utf8");fs.renameSync(tmp,ACCOUNTS_FILE);}catch(err){console.error("saveAccounts failed:",err.message);}
}
loadAccounts();
function cleanUsername(v){return String(v||"").trim().toLowerCase().replace(/[^a-z0-9_]/g,"").slice(0,24);}
function cleanDisplayName(v){return String(v||"").trim().replace(/[<>\\/{}\[\]]/g,"").replace(/\s+/g," ").slice(0,18);}
function validUsername(v){return /^[a-z0-9_]{3,24}$/.test(v);}
function validPassword(v){return typeof v==="string"&&v.length>=6&&v.length<=72;}
function hashPassword(password,salt){return crypto.scryptSync(String(password),salt,64).toString("hex");}
function hashSessionToken(token){return crypto.createHash("sha256").update(String(token||"")).digest("hex");}
function accountNameTaken(name,exceptUser=null){const n=String(name||"").toLocaleLowerCase("ru");return Object.values(accounts).some(a=>a.username!==exceptUser&&String(a.displayName||"").toLocaleLowerCase("ru")===n);}
function defaultOnboarding(){return {lobbyTourDone:false,runTutorialDone:false,whatsNewSeen:false};}
function normalizeAccount(a){
  if(!a)return null;
  a.username=cleanUsername(a.username);a.displayName=cleanDisplayName(a.displayName)||a.username;
  a.renameAvailableAt=Math.max(0,Number(a.renameAvailableAt)||0);
  a.createdAt=String(a.createdAt||new Date().toISOString());
  a.onboarding={...defaultOnboarding(),...(a.onboarding||{})};
  a.accountLevel=Math.max(1,Number(a.accountLevel)||1);a.accountXp=Math.max(0,Number(a.accountXp)||0);a.accountNextXp=Math.max(100,Number(a.accountNextXp)||100);
  a.tutorial={active:!!a.tutorial?.active,step:Math.max(0,Number(a.tutorial?.step)||0),kills:Math.max(0,Number(a.tutorial?.kills)||0)};
  const now=Date.now();a.sessions=(Array.isArray(a.sessions)?a.sessions:[]).filter(s=>s&&/^[a-f0-9]{64}$/.test(String(s.hash||""))&&Number(s.expiresAt)>now).map(s=>({...s,expiresAt:Math.min(Number(s.expiresAt),now+SESSION_TTL_MS)})).slice(-MAX_SESSIONS_PER_ACCOUNT);
  return a;
}
for(const k of Object.keys(accounts))normalizeAccount(accounts[k]);
function registerAccount(username,password,displayName){
  username=cleanUsername(username);displayName=cleanDisplayName(displayName);
  if(!validUsername(username))return {error:"Логин: 3–24 символа, только a-z, цифры и _"};
  if(!validPassword(password))return {error:"Пароль должен быть от 6 до 72 символов"};
  if(displayName.length<2)return {error:"Имя персонажа должно быть минимум 2 символа"};
  if(accounts[username])return {error:"Такой логин уже занят"};
  if(accountNameTaken(displayName))return {error:"Такое имя персонажа уже занято"};
  const salt=crypto.randomBytes(16).toString("hex");
  const a=normalizeAccount({username,displayName,salt,passwordHash:hashPassword(password,salt),createdAt:new Date().toISOString(),renameAvailableAt:0,onboarding:defaultOnboarding(),accountLevel:1,accountXp:0,accountNextXp:100,tutorial:{active:false,step:0,kills:0}});
  accounts[username]=a;saveAccounts();
  // Starter gift lives in the normal profile save, so it follows the player to VPS/DB migration.
  const prog=loadProgress(username);prog.profile=username;prog.silver=Math.max(prog.silver,0)+200;prog.crateTokens=(prog.crateTokens||0)+1;saveProgress(prog);
  return {account:a,starterGift:true};
}
function authenticateAccount(username,password){
  username=cleanUsername(username);const a=normalizeAccount(accounts[username]);
  if(!a||!validPassword(password))return null;
  let got;try{got=Buffer.from(hashPassword(password,a.salt),"hex");}catch{return null;}
  const want=Buffer.from(String(a.passwordHash||""),"hex");
  if(got.length!==want.length||!crypto.timingSafeEqual(got,want))return null;
  return a;
}
function issueAccountSession(account){
  const token=crypto.randomBytes(32).toString("base64url"),hash=hashSessionToken(token),expiresAt=Date.now()+SESSION_TTL_MS;
  account.sessions=[...(account.sessions||[]),{hash,expiresAt}].slice(-MAX_SESSIONS_PER_ACCOUNT);saveAccounts();
  return {token,expiresAt};
}
function authenticateAccountSession(token){
  if(typeof token!=="string"||token.length<32||token.length>128)return null;
  const hash=hashSessionToken(token),now=Date.now();
  for(const account of Object.values(accounts)){
    normalizeAccount(account);const session=account.sessions.find(s=>s.hash===hash&&s.expiresAt>now);
    if(session)return {account,hash};
  }
  return null;
}
function revokeAccountSession(account,sessionHash){
  if(!account||!sessionHash)return;
  account.sessions=(account.sessions||[]).filter(s=>s.hash!==sessionHash);saveAccounts();
}
function featureUnlocksFor(account,prog){
  const best=Math.max(0,Number(prog?.bestWave)||0),known=Object.values(prog?.discoveredEnemies||{}).some(Boolean),lvl=Math.max(1,Number(account?.accountLevel)||1);
  return {shop:true,quests:true,profile:true,upgrades:lvl>=2||best>=1,achievements:lvl>=2||best>=1,history:lvl>=2||best>=1,crates:best>=3,pets:best>=3,index:known};
}
function publicAccountSnapshot(account,prog=null){
  account=normalizeAccount(account);if(!account)return null;
  return {username:account.username,displayName:account.displayName,createdAt:account.createdAt,renameAvailableAt:account.renameAvailableAt,accountLevel:account.accountLevel,accountXp:account.accountXp,accountNextXp:account.accountNextXp,onboarding:{...account.onboarding},tutorial:{...account.tutorial},featureUnlocks:featureUnlocksFor(account,prog||loadProgress(account.username))};
}
function grantAccountXp(p,amount){
  const a=p?.account;if(!a||amount<=0)return;
  a.accountXp+=amount;let leveled=false;
  while(a.accountXp>=a.accountNextXp){a.accountXp-=a.accountNextXp;a.accountLevel++;a.accountNextXp=Math.round(a.accountNextXp*1.28+35);leveled=true;}
  if(leveled)send(p.ws,"notice",{text:`Уровень аккаунта ${a.accountLevel}! Открываются новые возможности штаба.`});
  if(leveled)saveAccounts();
}
function tutorialStateFor(a){return a?{active:!!a.tutorial?.active,step:a.tutorial?.step||0,kills:a.tutorial?.kills||0,done:!!a.onboarding?.runTutorialDone}:null;}
function sendTutorialState(p){if(p?.account)send(p.ws,"tutorialState",{tutorial:tutorialStateFor(p.account)});}
function tutorialEvent(p,event){
  const a=p?.account;if(!a||a.onboarding.runTutorialDone||!a.tutorial?.active)return;
  const t=a.tutorial;
  if(t.step===0&&event==="kill"){t.kills++;if(t.kills>=3)t.step=1;}
  else if(t.step===1&&event==="harvest")t.step=2;
  else if(t.step===2&&event==="build")t.step=3;
  else if(t.step===3&&event==="upgrade")t.step=4;
  else if(t.step===4&&event==="wave"){
    t.active=false;t.step=5;a.onboarding.runTutorialDone=true;p.silver=(p.silver||0)+150;saveProgress(p);send(p.ws,"notice",{text:"🎓 Обучение завершено! +150 серебра"});
  }
  saveAccounts();sendTutorialState(p);
}

const WORLD = { w: 6400, h: 4800, cx: 3200, cy: 2400 };
const SIM_HZ = 30;
const SNAPSHOT_HZ = 15;
const VIEW_RADIUS = 1550;
const RUN_SHOP_RADIUS = 360;
let nextEntityId = 1;
let nextPlayerId = 1;

const RARITIES = {
  common:    { label: "Обычное", mult: 1.00 },
  uncommon:  { label: "Необычное", mult: 1.13 },
  rare:      { label: "Редкое", mult: 1.30 },
  epic:      { label: "Эпическое", mult: 1.53 },
  legendary: { label: "Легендарное", mult: 1.85 }
};

const WEAPONS = {
  pistol: {
    name:"Старый пистолет", kind:"ranged",
    damage:21, rate:.29, speed:930, pellets:1, spread:.022, range:900,
    mag:12, reload:1.35, ammoLabel:"патроны", power:0
  },

  micro_uzi: {
    name:"IMI Micro Uzi", kind:"ranged",
    damage:16, rate:.075, speed:1030, pellets:1, spread:.065, range:760,
    mag:30, reload:1.75, ammoLabel:"патроны", power:1
  },

  ump: {
    name:"HK UMP", kind:"ranged",
    damage:29, rate:.135, speed:1080, pellets:1, spread:.035, range:940,
    mag:25, reload:2.05, ammoLabel:"патроны", power:2
  },

  butterfly: {
    name:"Нож-бабочка", kind:"melee",
    damage:92, rate:.34, range:84, arc:1.18,
    mag:0, reload:0, ammoLabel:"∞", power:3
  },

  fire_machete: {
    name:"Огненное мачете", kind:"melee",
    damage:138, rate:.56, range:105, arc:1.32, burn:28,
    mag:0, reload:0, ammoLabel:"∞", power:4
  },

  bubble_blaster: {
    name:"Пистолет с мыльными пузырями", kind:"ranged",
    damage:88, rate:.16, speed:760, pellets:1, spread:.018, range:1120,
    mag:12, reload:2.40, ammoLabel:"пузыри", bubble:true, power:5
  }
};

const SHOP = {
  // Tuned around a normal no-cheese run: Uzi ~waves 4-5, UMP ~wave 9,
  // then the stronger weapons arrive progressively later.
  micro_uzi:     { wood:10, stone:0,  scrap:70  },
  ump:           { wood:18, stone:8,  scrap:118 },
  butterfly:     { wood:18, stone:22, scrap:175 },
  fire_machete:  { wood:28, stone:36, scrap:285 },
  bubble_blaster:{ wood:50, stone:58, scrap:520 },
  heal:          { wood:0,  stone:0,  scrap:28  }
};

const META_VERSION = 6;
const CRATE_COST_GOLD = 50;
const PET_WEIGHTS = [
  ["panda",50],
  ["cat",28],
  ["red_dragon",12],
  ["axolotl",6],
  ["duck",3],
  ["amethyst_fury",1]
];
const PETS = {
  panda:{ id:"panda", name:"Panda", rarity:"common" },
  cat:{ id:"cat", name:"Uiai Cat", rarity:"uncommon" },
  red_dragon:{ id:"red_dragon", name:"Red Dragon", rarity:"rare" },
  axolotl:{ id:"axolotl", name:"Pink Axolotl", rarity:"epic" },
  duck:{ id:"duck", name:"Ducktive", rarity:"legendary" },
  amethyst_fury:{ id:"amethyst_fury", name:"Amethyst Fury", rarity:"secret" }
};

const BOSS_BY_WAVE = {
  5:"boss_stone",
  10:"boss_butcher",
  20:"boss_plague",
  30:"boss_colossus",
  40:"boss_shadow",
  50:"boss_king"
};
const BOSS_GOLD_REWARDS = {5:30,10:50,20:100,30:150,40:200,50:300};
const MINI_BOSS_BY_WAVE = {
  15:"mini_toxic_brute",
  25:"mini_lava_beast",
  35:"mini_shadow_stalker",
  45:"mini_void_harbinger"
};
const BOSS_NAMES = {
  boss_stone:"Каменный Громила",
  boss_butcher:"Мясник",
  boss_plague:"Чумная Матка",
  boss_colossus:"Железный Колосс",
  boss_shadow:"Повелитель Тьмы",
  boss_king:"Король Заражения"
};
const MINI_BOSS_NAMES = {
  mini_toxic_brute:"Ядовитый громила",
  mini_lava_beast:"Лавовый зверь",
  mini_shadow_stalker:"Теневой охотник",
  mini_void_harbinger:"Вестник пустоты"
};
const ZOMBIE_DEBUT = {
  runner:2,armored:4,spitter:5,bomber:6,shaman:8,titan:10,
  leaper:9,shieldbearer:11,splitter:13,hunter:16,sapper:18,
  necromancer:22,frost:26,parasite:32,teleporter:38,abyssal:45
};
const ELITE_MODS = ["furious","shielded","regen","swift","commander","cursed"];
const NIGHT_MODIFIERS = {
  blood:{id:"blood",name:"КРОВАВАЯ НОЧЬ",reward:1.20,elite:1.25,runnerSpeed:1.28,repair:1.0,light:1.0},
  acid:{id:"acid",name:"КИСЛОТНЫЙ ДОЖДЬ",reward:1.25,elite:1.15,runnerSpeed:1.0,repair:1.5,light:1.0},
  fullmoon:{id:"fullmoon",name:"ПОЛНОЛУНИЕ",reward:1.50,elite:2.0,runnerSpeed:1.0,repair:1.0,light:1.0},
  blackout:{id:"blackout",name:"ЧЁРНАЯ НОЧЬ",reward:1.35,elite:1.35,runnerSpeed:1.0,repair:1.0,light:.62}
};
const ACHIEVEMENTS = {
  survive10:{name:"Ночной охотник",desc:"Пережить 10 волн",gold:45,title:"Ночной охотник"},
  bossHunter:{name:"Убийца титанов",desc:"Убить 3 боссов",gold:55,title:"Убийца титанов"},
  builder50:{name:"Инженер",desc:"Построить 50 объектов за всё время",gold:35,title:"Инженер"},
  orc1000:{name:"Зелёная катастрофа",desc:"Убить 1000 орков",gold:100,title:"Истребитель орков"},
  base80:{name:"Идеальная оборона",desc:"Пройти 5 волн, не опустив базу ниже 80% HP",gold:50,title:"Хранитель базы"},
  meleeBoss:{name:"Сталь против чудовища",desc:"Победить босса, нанося ему урон только ближним оружием",gold:70,title:"Мясник боссов"}
};
const crateLocks = new Map();
const QUEST_COOLDOWN_MS = 30 * 60 * 1000;
const QUEST_VARIANTS = {
  kills:[
    {id:"kills_25",title:"Охота на заражённых",desc:"Убей 25 зомби",stat:"kills",target:25,reward:30},
    {id:"kills_45",title:"Зачистка квартала",desc:"Убей 45 зомби",stat:"kills",target:45,reward:48},
    {id:"kills_70",title:"Ночная мясорубка",desc:"Убей 70 зомби",stat:"kills",target:70,reward:68},
    {id:"kills_100",title:"Без права на проход",desc:"Убей 100 зомби",stat:"kills",target:100,reward:92}
  ],
  harvest:[
    {id:"harvest_90",title:"Снабжение убежища",desc:"Добудь 90 ресурсов",stat:"harvest",target:90,reward:24},
    {id:"harvest_140",title:"Полные склады",desc:"Добудь 140 ресурсов",stat:"harvest",target:140,reward:34},
    {id:"harvest_200",title:"Экспедиция за припасами",desc:"Добудь 200 ресурсов",stat:"harvest",target:200,reward:46},
    {id:"harvest_280",title:"Запас на чёрный день",desc:"Добудь 280 ресурсов",stat:"harvest",target:280,reward:62}
  ],
  waves:[
    {id:"waves_2",title:"Первая вахта",desc:"Переживи 2 волны",stat:"waves",target:2,reward:28},
    {id:"waves_4",title:"Ночная вахта",desc:"Переживи 4 волны",stat:"waves",target:4,reward:46},
    {id:"waves_6",title:"До самого рассвета",desc:"Переживи 6 волн",stat:"waves",target:6,reward:64},
    {id:"waves_8",title:"Несгибаемая смена",desc:"Переживи 8 волн",stat:"waves",target:8,reward:84}
  ],
  builds:[
    {id:"builds_5",title:"Быстрая оборона",desc:"Построй 5 объектов",stat:"builds",target:5,reward:24},
    {id:"builds_9",title:"Архитектор обороны",desc:"Построй 9 объектов",stat:"builds",target:9,reward:36},
    {id:"builds_14",title:"Крепость за ночь",desc:"Построй 14 объектов",stat:"builds",target:14,reward:52},
    {id:"builds_20",title:"Инженерный марафон",desc:"Построй 20 объектов",stat:"builds",target:20,reward:70}
  ]
};
const QUEST_TEMPLATE_BY_ID = Object.fromEntries(Object.values(QUEST_VARIANTS).flat().map(q=>[q.id,q]));
const META_SHOP = {
  prep_medkit:{name:"Экстренная аптечка",price:18,kind:"prep",desc:"+1 аптечка в начале следующего забега"},
  prep_scrap:{name:"Контейнер металла",price:20,kind:"prep",desc:"+45 металла в начале следующего забега"},
  prep_supply:{name:"Набор снабжения",price:30,kind:"prep",desc:"+18 дерева, +12 камня, +25 металла"},
  prep_damage:{name:"Боевой стимулятор",price:44,kind:"prep",desc:"+10% урона на следующий забег"},
  prep_speed:{name:"Лёгкие ботинки",price:36,kind:"prep",desc:"+7% скорости на следующий забег"}
};
const META_UPGRADES = {
  backpack:{name:"Рюкзак снабжения",max:5,base:35,step:24,desc:"Больше стартовых ресурсов"},
  armor:{name:"Бронепластины",max:5,base:45,step:30,desc:"+5 максимального HP за уровень"},
  gather:{name:"Полевой инструмент",max:5,base:40,step:28,desc:"+5% эффективности добычи за уровень"},
  medkit:{name:"Медицинская полка",max:3,base:60,step:45,desc:"+1 стартовая аптечка за уровень"}
};


const CLASS_COSTS = { starter:0, shooter:150, cqc:350, flame:700, soap:1200 };
function defaultUnlockedClasses(){ return {starter:true,shooter:false,cqc:false,flame:false,soap:false}; }
function normalizeUnlockedClasses(obj){
  const out=defaultUnlockedClasses();
  for(const k of Object.keys(out)) if(k!=="starter") out[k]=!!obj?.[k];
  out.starter=true;
  return out;
}
function normalizeAchievements(obj){
  const out={};
  for(const k of Object.keys(ACHIEVEMENTS)){
    const v=obj?.[k];
    // Migration: old boolean true means the reward was already paid in v5.0.1.
    out[k]=v===true?2:Math.max(0,Math.min(2,Number(v)||0));
  }
  return out;
}
function normalizeLifetime(obj){return {kills:Math.max(0,Number(obj?.kills)||0),orcKills:Math.max(0,Number(obj?.orcKills)||0),bossKills:Math.max(0,Number(obj?.bossKills)||0),builds:Math.max(0,Number(obj?.builds)||0),base80Best:Math.max(0,Number(obj?.base80Best)||0)};}
function normalizeHistory(arr){return (Array.isArray(arr)?arr:[]).slice(0,5).map(x=>({date:String(x.date||""),wave:Math.max(0,Number(x.wave)||0),kills:Math.max(0,Number(x.kills)||0),builds:Math.max(0,Number(x.builds)||0),damage:Math.max(0,Math.round(Number(x.damage)||0)),classId:String(x.classId||"starter"),petId:x.petId||null,weapon:String(x.weapon||"pistol"),result:String(x.result||"gameover")}));}

const CLASSES = {
  starter: {
    name:"Стартовый", stars:1,
    hpMult:1.00, speedMult:1.00,
    startWeapon:"pistol"
  },
  shooter: {
    name:"Стрелок", stars:2,
    hpMult:1.08, speedMult:1.02,
    rangedDamage:1.30,
    startWeapon:"ump"
  },
  cqc: {
    name:"Master Quarter Combat", stars:3,
    hpMult:1.50, speedMult:1.15,
    meleeDamage:1.28,
    startWeapon:"butterfly"
  },
  flame: {
    name:"Пламенный дракон", stars:4,
    hpMult:1.40, speedMult:1.12,
    meleeDamage:1.16, fireDamage:1.50,
    startWeapon:"fire_machete"
  },
  soap: {
    name:"Soap King", stars:5,
    hpMult:1.00, speedMult:1.08,
    bubbleDamage:1.15,
    startWeapon:"bubble_blaster",
    bubbleAmmo:60, bubbleRecharge:180
  }
};

function weaponCfg(type){ return WEAPONS[type]||WEAPONS.pistol; }
function rarityAmmoBonus(rarity){return {common:1,uncommon:1.10,rare:1.25,epic:1.18,legendary:1.32}[rarity]||1;}
function rarityReloadBonus(rarity){return {common:1,uncommon:.92,rare:.90,epic:.84,legendary:.76}[rarity]||1;}
function freshWeaponAmmo(type,bubbleRemaining=60,rarity="common"){
  const w=weaponCfg(type);
  if(w.kind==="melee")return {mag:-1,max:-1,reloading:false,reloadTimer:0,reloadDuration:0,ammoLabel:"∞"};
  const max=Math.max(1,Math.round((w.mag||1)*rarityAmmoBonus(rarity)));
  const dur=Math.max(.35,(w.reload||1)*rarityReloadBonus(rarity));
  return {mag:type==="bubble_blaster"?Math.min(max,Math.max(0,bubbleRemaining)):max,max,reloading:false,reloadTimer:0,reloadDuration:dur,ammoLabel:w.ammoLabel||"патроны"};
}
function setWeapon(p,type,rarity="common"){
  if(!WEAPONS[type])type="pistol";
  p.weapon={type,rarity};
  p.weaponAmmo=freshWeaponAmmo(type,p.bubbleAmmo??60,rarity);
}
function startReload(p){
  if(!p||p.downed)return false;
  const w=weaponCfg(p.weapon?.type);
  if(w.kind==="melee")return false;
  p.weaponAmmo=p.weaponAmmo||freshWeaponAmmo(p.weapon?.type,p.bubbleAmmo??60,p.weapon?.rarity||"common");
  const a=p.weaponAmmo;
  if(a.reloading||a.mag>=a.max)return false;
  if(w.bubble&&(p.bubbleAmmo||0)<=0)return false;
  a.reloading=true;a.reloadTimer=a.reloadDuration||w.reload||1;
  return true;
}
function finishReload(p){
  if(!p?.weaponAmmo)return;
  const w=weaponCfg(p.weapon?.type);
  if(w.kind==="melee")return;
  p.weaponAmmo.reloading=false;p.weaponAmmo.reloadTimer=0;
  p.weaponAmmo.mag=w.bubble?Math.min(p.weaponAmmo.max,Math.max(0,p.bubbleAmmo||0)):p.weaponAmmo.max;
}

function classCfg(p){
  return CLASSES[p.character] || CLASSES.starter;
}

function applyClassLoadout(p){
  const cc=classCfg(p);
  p.bubbleAmmo=cc.bubbleAmmo||60;
  p.bubbleAmmoMax=60;
  p.bubbleRecharge=0;
  p.bubbleAutoReturn=false;
  setWeapon(p,cc.startWeapon,"common");
}

function classDamageMultiplier(p,w){
  const cc=classCfg(p);
  let m=cc.allDamage||1;
  if(w.kind==="ranged")m*=cc.rangedDamage||1;
  if(w.kind==="melee")m*=cc.meleeDamage||1;
  if(w.bubble)m*=cc.bubbleDamage||1;
  return m;
}


const STRUCTURES = {
  wall:        { name:"Стена",           cost:{wood:18,stone:4,scrap:0},   hp:340, r:50, halfW:48, halfH:8 },
  gate:        { name:"Ворота",          cost:{wood:22,stone:5,scrap:4},   hp:295, r:50, halfW:48, halfH:9 },
  cannon:      { name:"Пушка",           cost:{wood:12,stone:14,scrap:55}, hp:210, r:30, halfW:30, halfH:30 },
  tesla:       { name:"Электро-башня",   cost:{wood:14,stone:10,scrap:60}, hp:175, r:28, halfW:28, halfH:28 },
  cat_tower:   { name:"Кошка-башня",     cost:{wood:20,stone:6,scrap:35},  hp:190, r:29, halfW:29, halfH:29 },
  frost_tower: { name:"Ледяная башня",   cost:{wood:14,stone:12,scrap:45}, hp:180, r:29, halfW:29, halfH:29 },
  flame_tower: { name:"Огненная башня",  cost:{wood:18,stone:8,scrap:52},  hp:195, r:30, halfW:30, halfH:30 },
  spikes:      { name:"Шипы",            cost:{wood:16,stone:2,scrap:10},  hp:140, r:31, halfW:31, halfH:31 }
};
const TOWER_TYPES = new Set(["cannon","tesla","cat_tower","frost_tower","flame_tower"]);
function isTowerType(type){ return TOWER_TYPES.has(type); }


const STRUCTURE_LIMITS = Object.freeze({
  wall:40, gate:8,
  cannon:3, tesla:2, cat_tower:2, frost_tower:2, flame_tower:2,
  spikes:10
});
function structureBuildLimit(type){ return Number.isFinite(STRUCTURE_LIMITS[type])?STRUCTURE_LIMITS[type]:Infinity; }
function activeStructureCount(room,type){
  return room.structures.reduce((n,s)=>n+(s.hp>0&&s.type===type?1:0),0);
}
function structureBuildCost(room,type){
  const cfg=STRUCTURES[type];if(!cfg)return null;
  const bought=Math.max(0,Number(room.structurePurchaseCounts?.[type])||0);
  let factor=1;
  // Every new active defense of the same family is an increasingly serious investment.
  if(isTowerType(type))factor=1+bought*.42;
  else if(type==="spikes")factor=1+bought*.10;
  const out={wood:0,stone:0,scrap:0};
  for(const k of ["wood","stone","scrap"])out[k]=Math.max(0,Math.ceil((cfg.cost[k]||0)*factor));
  return out;
}
function nextBuildEconomy(room){
  const costs={},counts={};
  for(const type of Object.keys(STRUCTURES)){
    costs[type]=structureBuildCost(room,type);
    counts[type]=activeStructureCount(room,type);
  }
  return {costs,counts,limits:STRUCTURE_LIMITS};
}


const STRUCTURE_MAX_LEVEL = 5;

function structureUpgradeCost(type, currentLevel){
  const cfg = STRUCTURES[type];
  if(!cfg) return null;
  const nextLevel = currentLevel + 1;
  if(nextLevel > STRUCTURE_MAX_LEVEL) return null;
  const factor = 0.62 + currentLevel * 0.58;
  return {
    wood: Math.max(1, Math.ceil((cfg.cost.wood||0) * factor)),
    stone: Math.max(0, Math.ceil((cfg.cost.stone||0) * factor)),
    scrap: Math.max(0, Math.ceil((cfg.cost.scrap||0) * factor))
  };
}

const SKILLS = {
  survivor_hp: {
    name:"Живучесть", max:5,
    values:[0,20,45,75,110,150],
    desc:"Максимальное здоровье"
  },
  survivor_speed: {
    name:"Выносливость", max:5,
    values:[0,4,8,12,16,20],
    desc:"Скорость передвижения, %"
  },
  gun_damage: {
    name:"Оружейник", max:8,
    values:[0,5,10,15,20,25,30,35,40],
    desc:"Урон оружием, %"
  },
  gun_rate: {
    name:"Быстрые руки", max:5,
    values:[0,4,8,12,16,20],
    desc:"Скорострельность, %"
  },
  gather: {
    name:"Добытчик", max:10,
    values:[0,8,16,24,32,40,50,60,70,80,90],
    desc:"Эффективность добычи, %"
  },
  builder: {
    name:"Строитель", max:6,
    values:[0,10,20,30,40,50,60],
    desc:"Прочность новых построек, %"
  },
  medic: {
    name:"Полевой медик", max:4,
    values:[0,20,40,65,90],
    desc:"Скорость поднятия напарника, %"
  }
};

function skillValue(p,key,levelOverride=null){
  const cfg=SKILLS[key];
  if(!cfg)return 0;
  const lvl=levelOverride===null?(p.skills[key]||0):levelOverride;
  const idx=Math.max(0,Math.min(cfg.max,lvl));
  return Number(cfg.values[idx]||0);
}

const CORE_UPGRADES = [
  null,
  { level:2, cost:{wood:80, stone:55, scrap:70},  hp:1500, heal:1.2, turret:1.10, light:330 },
  { level:3, cost:{wood:130,stone:95, scrap:120}, hp:1900, heal:2.0, turret:1.22, light:410 },
  { level:4, cost:{wood:190,stone:145,scrap:190}, hp:2400, heal:3.0, turret:1.38, light:500 },
  { level:5, cost:{wood:270,stone:210,scrap:290}, hp:3100, heal:4.2, turret:1.58, light:610 }
];

const rooms = new Map();
const activeProfiles = new Set();

function id(){ return nextEntityId++; }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function safeAxis(value){const n=Number(value);return Number.isFinite(n)?clamp(n,-1,1):0;}
function dist(a,b){ return Math.hypot(a.x-b.x,a.y-b.y); }
function norm(x,y){ const l=Math.hypot(x,y)||1; return {x:x/l,y:y/l}; }
function rand(a,b){ return a+Math.random()*(b-a); }
function sample(a){ return a[Math.floor(Math.random()*a.length)]; }
function sanitizeRoom(s){ return String(s||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,8); }
function sanitizeProfile(s){ return String(s||"player").replace(/[^a-zA-Z0-9а-яА-ЯёЁ_-]/g,"_").slice(0,32) || "player"; }
function send(ws,type,data={}){ if(ws && ws.readyState===ws.OPEN) ws.send(JSON.stringify({type,...data})); }
function broadcast(room,type,data={}){ const m=JSON.stringify({type,...data}); for(const p of room.players.values()) if(p.ws.readyState===p.ws.OPEN) p.ws.send(m); }
function hasCost(inv,c){ return ["wood","stone","scrap"].every(k => (inv[k]||0) >= (c[k]||0)); }
function pay(inv,c){ for(const k of ["wood","stone","scrap"]) inv[k] -= (c[k]||0); }
function missingCost(inv,c){
  const out={wood:0,stone:0,scrap:0};
  for(const k of ["wood","stone","scrap"])out[k]=Math.max(0,(c[k]||0)-(inv[k]||0));
  return out;
}
function missingCostText(inv,c,prefix="Не хватает"){
  const miss=missingCost(inv,c),parts=[];
  if(miss.wood)parts.push(`${miss.wood} дерева`);
  if(miss.stone)parts.push(`${miss.stone} камня`);
  if(miss.scrap)parts.push(`${miss.scrap} металла`);
  return parts.length?`${prefix}: ${parts.join(", ")}`:`${prefix} ресурсов`;
}

function blankPetState(){ return {healCd:0,attackCd:0,utilityCd:0}; }
function emptyPetsOwned(){ return {panda:0,cat:0,red_dragon:0,axolotl:0,duck:0,amethyst_fury:0}; }
function normalizePetsOwned(obj){
  const out=emptyPetsOwned();
  for(const k of Object.keys(out))out[k]=Math.max(0,Number(obj?.[k])||0);
  return out;
}
function defaultMetaQuests(){
  return Object.values(QUEST_VARIANTS).map(group=>({...sample(group),progress:0,claimed:false}));
}
function normalizeMetaQuests(arr){
  if(!Array.isArray(arr)||!arr.length)return defaultMetaQuests();
  const valid=[];
  const usedStats=new Set();
  for(const q of arr){
    const tpl=QUEST_TEMPLATE_BY_ID[String(q?.id||"")];
    if(!tpl||usedStats.has(tpl.stat))continue;
    usedStats.add(tpl.stat);
    valid.push({...tpl,progress:Math.max(0,Math.min(tpl.target,Number(q?.progress)||0)),claimed:!!q?.claimed});
  }
  if(valid.length!==Object.keys(QUEST_VARIANTS).length)return defaultMetaQuests();
  return valid;
}
function refreshQuestCycleIfNeeded(p,now=Date.now()){
  p.metaQuestCooldownUntil=Math.max(0,Number(p.metaQuestCooldownUntil)||0);
  if(p.metaQuestCooldownUntil>0&&now>=p.metaQuestCooldownUntil){
    p.metaQuestCooldownUntil=0;
    p.metaQuests=defaultMetaQuests();
    return true;
  }
  return false;
}
function normalizeMetaUpgrades(obj){
  const out={};
  for(const [k,cfg] of Object.entries(META_UPGRADES))out[k]=Math.max(0,Math.min(cfg.max,Number(obj?.[k])||0));
  return out;
}
function normalizePrep(obj){
  const out={};
  for(const k of Object.keys(META_SHOP))out[k]=Math.max(0,Number(obj?.[k])||0);
  return out;
}
function ensureMeta(p){
  p.silver=Math.max(0,Number(p.silver ?? p.coins)||0);
  p.gold=Math.max(0,Number(p.gold)||0);
  p.petsOwned=normalizePetsOwned(p.petsOwned);
  p.metaQuests=normalizeMetaQuests(p.metaQuests);
  p.metaQuestCooldownUntil=Math.max(0,Number(p.metaQuestCooldownUntil)||0);
  refreshQuestCycleIfNeeded(p);
  p.metaUpgrades=normalizeMetaUpgrades(p.metaUpgrades);
  p.prepItems=normalizePrep(p.prepItems);
  p.unlockedClasses=normalizeUnlockedClasses(p.unlockedClasses);
  p.achievements=normalizeAchievements(p.achievements);
  p.lifetime=normalizeLifetime(p.lifetime);
  p.runHistory=normalizeHistory(p.runHistory);
  p.crateTokens=Math.max(0,Number(p.crateTokens)||0);
  p.titlesUnlocked=Array.isArray(p.titlesUnlocked)?[...new Set(["Новичок",...p.titlesUnlocked.map(String)])]:["Новичок"];
  p.selectedTitle=p.titlesUnlocked.includes(p.selectedTitle)?p.selectedTitle:"Новичок";
  if(p.equippedPet && (!PETS[p.equippedPet] || (p.petsOwned[p.equippedPet]||0)<=0))p.equippedPet=null;
}
function weightedPetRoll(){
  const r=Math.random()*100;let acc=0;
  for(const [id,w] of PET_WEIGHTS){acc+=w;if(r<acc)return id;}
  return "panda";
}
function buildCrateReel(result){
  const reel=[];
  for(let i=0;i<30;i++)reel.push(weightedPetRoll());
  reel[24]=result;
  return reel;
}
const COMBO_WINDOW=4.6;
function comboTierFor(count){
  const c=Math.max(0,Number(count)||0);
  if(c>=50)return 5;
  if(c>=30)return 4;
  if(c>=20)return 3;
  if(c>=10)return 2;
  if(c>=5)return 1;
  return 0;
}
function comboLabelForTier(tier){
  return ["","РАЗОГРЕВ","БУЙСТВО","НЕОСТАНОВИМ","БЕЗУМИЕ","БОГ СМЕРТИ"][Math.max(0,Math.min(5,Number(tier)||0))]||"";
}
function comboDamageMultiplier(p){
  return [1,1.05,1.10,1.16,1.22,1.30][comboTierFor(p?.comboCount||0)]||1;
}
function comboMoveMultiplier(p){
  return [1,1.03,1.05,1.08,1.10,1.12][comboTierFor(p?.comboCount||0)]||1;
}
function registerKillCombo(p,z){
  if(!p)return;
  const before=Math.max(0,p.comboCount||0),beforeTier=comboTierFor(before);
  const weight=isBossType(z?.type)?5:isMiniBossType(z?.type)?3:1;
  p.comboCount=before+weight;
  p.comboTimer=isBossType(z?.type)?7.0:isMiniBossType(z?.type)?5.8:COMBO_WINDOW;
  p.comboBest=Math.max(p.comboBest||0,p.comboCount);
  p.comboTier=comboTierFor(p.comboCount);
  if(p.comboTier>beforeTier){
    send(p.ws,"combo",{count:p.comboCount,tier:p.comboTier,label:comboLabelForTier(p.comboTier),timer:p.comboTimer});
  }
}
function tickPlayerCombo(p,dt){
  if(!p)return;
  if(p.downed){p.comboCount=0;p.comboTimer=0;p.comboTier=0;return;}
  if((p.comboCount||0)<=0)return;
  p.comboTimer=Math.max(0,(p.comboTimer||0)-dt);
  if(p.comboTimer<=0){p.comboCount=0;p.comboTier=0;}
}

function bumpMetaQuest(p,stat,amount=1){
  ensureMeta(p);
  if((p.metaQuestCooldownUntil||0)>Date.now())return;
  for(const q of p.metaQuests){
    if(q.stat===stat&&!q.claimed)q.progress=Math.min(q.target,(q.progress||0)+amount);
  }
}

// v4.3.1 HOTFIX:
// Some gameplay code still called the old run-stat helper `bumpStat`.
// Keep one compatibility wrapper so kills/harvest/waves/builds update both
// temporary run statistics and the persistent lobby quest counters.
function bumpStat(p,stat,amount=1){
  if(!p)return;
  p.runStats=p.runStats||{kills:0,harvest:0,waves:0,builds:0};
  p.runStats[stat]=(p.runStats[stat]||0)+amount;
  if(stat==="kills")grantAccountXp(p,Math.max(1,Math.round(amount)));
  if(stat==="waves"){grantAccountXp(p,25*Math.max(1,Math.round(amount)));tutorialEvent(p,"wave");}
  p.lifetime=p.lifetime||normalizeLifetime({});
  if(stat==="builds")p.lifetime.builds=(p.lifetime.builds||0)+amount;

  const before=(p.metaQuests||[]).find(q=>q.stat===stat&&!q.claimed)?.progress||0;
  bumpMetaQuest(p,stat,amount);
  const quest=(p.metaQuests||[]).find(q=>q.stat===stat&&!q.claimed);

  // Persist immediately when a quest becomes claimable so a disconnect/crash
  // cannot erase the completion. Other partial progress is saved on normal
  // room leave, wave completion and server-side profile saves.
  if(quest && before<quest.target && quest.progress>=quest.target){
    saveProgress(p);
    send(p.ws,"notice",{text:`Квест выполнен: ${quest.title}. Награду можно забрать в лобби.`});
  }
}
function unlockAchievement(p,key){
  ensureMeta(p);const cfg=ACHIEVEMENTS[key];
  if(!cfg||(p.achievements[key]||0)>=1)return false;
  p.achievements[key]=1;
  send(p.ws,"notice",{text:`🏆 Достижение выполнено: ${cfg.name}. Забери титул и ${cfg.gold} золота в лобби.`});
  saveProgress(p);return true;
}
function claimAchievement(p,key){
  ensureMeta(p);const cfg=ACHIEVEMENTS[key];
  if(!cfg||p.achievements[key]!==1)return false;
  p.achievements[key]=2;
  p.gold+=cfg.gold;
  if(cfg.title&&!p.titlesUnlocked.includes(cfg.title))p.titlesUnlocked.push(cfg.title);
  send(p.ws,"notice",{text:`🏆 Награда получена: ${cfg.name} · +${cfg.gold} золота · титул «${cfg.title}»`});
  saveProgress(p);return true;
}
function checkAchievements(p,room=null){
  ensureMeta(p);
  if((p.bestWave||0)>=10)unlockAchievement(p,"survive10");
  if((p.lifetime?.bossKills||0)>=3)unlockAchievement(p,"bossHunter");
  if((p.lifetime?.builds||0)>=50)unlockAchievement(p,"builder50");
  if((p.lifetime?.orcKills||0)>=1000)unlockAchievement(p,"orc1000");
  if((p.lifetime?.base80Best||0)>=5)unlockAchievement(p,"base80");
}
function favoriteWeapon(p){
  const shots=p.runStats?.weaponShots||{};let best="pistol",n=-1;
  for(const [k,v] of Object.entries(shots))if(v>n){n=v;best=k;}return best;
}
function recordRun(p,room,result="gameover"){
  ensureMeta(p);
  const row={date:new Date().toISOString(),wave:room.wave,kills:p.runStats?.kills||0,builds:p.runStats?.builds||0,damage:Math.round(p.runStats?.damage||0),classId:p.character,petId:p.equippedPet||null,weapon:favoriteWeapon(p),result};
  p.runHistory=[row,...(p.runHistory||[])].slice(0,5);
  checkAchievements(p,room);saveProgress(p);return row;
}
function petWorldPos(p){
  const side=p.slot===1?-1:1;
  return {x:Number.isFinite(p.petX)?p.petX:p.x+side*104,y:Number.isFinite(p.petY)?p.petY:p.y+72};
}
const EQUIPMENT_MAX_LEVEL=5;
const MULTITOOL_NAMES=["","Старый мультитул","Железный мультитул","Золотой мультитул","Изумрудный мультитул","Алмазный мультитул"];
const MULTITOOL_UPGRADE_COSTS={2:{wood:16,stone:12,scrap:42},3:{wood:28,stone:24,scrap:88},4:{wood:44,stone:40,scrap:155},5:{wood:68,stone:64,scrap:260}};
const WEAPON_UPGRADE_COSTS={2:{wood:12,stone:8,scrap:45},3:{wood:22,stone:18,scrap:90},4:{wood:36,stone:32,scrap:165},5:{wood:56,stone:52,scrap:285}};
function equipmentDamageMultiplier(level){return 1+Math.max(0,Math.min(4,(Number(level)||1)-1))*.16;}
function equipmentRateMultiplier(level){return 1+Math.max(0,Math.min(4,(Number(level)||1)-1))*.045;}
function metaUpgradePrice(key,level){
  const cfg=META_UPGRADES[key];if(!cfg)return Infinity;
  return cfg.base+cfg.step*level;
}
function metaSnapshot(p){
  ensureMeta(p);
  return {
    silver:p.silver,gold:p.gold,petsOwned:p.petsOwned,equippedPet:p.equippedPet,
    quests:p.metaQuests,questCooldownUntil:p.metaQuestCooldownUntil||0,upgrades:p.metaUpgrades,prepItems:p.prepItems,bestWave:p.bestWave||0,
    unlockedClasses:p.unlockedClasses,classCosts:CLASS_COSTS,
    achievements:p.achievements,lifetime:p.lifetime,runHistory:p.runHistory,crateTokens:p.crateTokens||0,
    titlesUnlocked:p.titlesUnlocked,selectedTitle:p.selectedTitle,
    account:p.account?publicAccountSnapshot(p.account,p):null
  };
}
function sendMeta(ws,p){send(ws,"metaState",{meta:metaSnapshot(p)});}

function defaultProgress(){
  return {
    xp:0,level:1,nextXp:100,skillPoints:0,
    skills:{survivor_hp:0,survivor_speed:0,gun_damage:0,gun_rate:0,gather:0,builder:0,medic:0},
    unlocks:{pistol:true},discoveredEnemies:{},bestWave:0,
    silver:0,gold:0,petsOwned:emptyPetsOwned(),equippedPet:null,
    metaQuests:defaultMetaQuests(),metaQuestCooldownUntil:0,metaUpgrades:normalizeMetaUpgrades({}),prepItems:normalizePrep({}),
    unlockedClasses:defaultUnlockedClasses(),achievements:normalizeAchievements({}),lifetime:normalizeLifetime({}),
    runHistory:[],crateTokens:0,titlesUnlocked:["Новичок"],selectedTitle:"Новичок"
  };
}
function profilePath(profile){ return path.join(SAVE_DIR,sanitizeProfile(profile)+".json"); }
function loadProgress(profile){
  const base=defaultProgress();
  try{
    const saved=JSON.parse(fs.readFileSync(profilePath(profile),"utf8"));
    base.bestWave=Math.max(0,Number(saved.bestWave)||0);
    if(saved.discoveredEnemies&&typeof saved.discoveredEnemies==="object")base.discoveredEnemies={...saved.discoveredEnemies};
    base.silver=Math.max(0,Number(saved.silver ?? saved.coins)||0);
    // Trust v4.3+ lobby-meta saves. META_VERSION may increase for UI/name migrations.
    if(Number(saved.metaVersion)>=3){
      base.gold=Math.max(0,Number(saved.gold)||0);
      base.petsOwned=normalizePetsOwned(saved.petsOwned);
      base.equippedPet=saved.equippedPet||null;
      base.metaQuests=normalizeMetaQuests(saved.metaQuests);
      base.metaQuestCooldownUntil=Math.max(0,Number(saved.metaQuestCooldownUntil)||0);
      base.metaUpgrades=normalizeMetaUpgrades(saved.metaUpgrades);
      base.prepItems=normalizePrep(saved.prepItems);
      base.unlockedClasses=normalizeUnlockedClasses(saved.unlockedClasses);
      base.achievements=normalizeAchievements(saved.achievements);
      base.lifetime=normalizeLifetime(saved.lifetime);
      base.runHistory=normalizeHistory(saved.runHistory);
      base.crateTokens=Math.max(0,Number(saved.crateTokens)||0);
      base.titlesUnlocked=Array.isArray(saved.titlesUnlocked)?saved.titlesUnlocked:["Новичок"];
      base.selectedTitle=String(saved.selectedTitle||"Новичок");
    }
  }catch{}
  ensureMeta(base);
  return base;
}
function saveProgress(p){
  if(!p||!p.profile)return;
  ensureMeta(p);
  try{
    const file=profilePath(p.profile),tmp=file+".tmp";
    fs.writeFileSync(tmp,JSON.stringify({
      metaVersion:META_VERSION,bestWave:Math.max(0,p.bestWave||0),
      discoveredEnemies:{...(p.discoveredEnemies||{})},silver:p.silver,gold:p.gold,
      petsOwned:p.petsOwned,equippedPet:p.equippedPet||null,
      metaQuests:p.metaQuests,metaQuestCooldownUntil:p.metaQuestCooldownUntil||0,metaUpgrades:p.metaUpgrades,prepItems:p.prepItems,
      unlockedClasses:p.unlockedClasses,achievements:p.achievements,lifetime:p.lifetime,runHistory:p.runHistory,
      crateTokens:p.crateTokens||0,titlesUnlocked:p.titlesUnlocked,selectedTitle:p.selectedTitle
    },null,2),"utf8");
    fs.renameSync(tmp,file);
    if(p.account)saveAccounts();
  }catch(err){console.error("saveProgress failed:",err.message);}
}
function loadMetaTarget(profile,account=null){
  const t=loadProgress(profile);t.profile=sanitizeProfile(profile);t.account=account||accounts[cleanUsername(profile)]||null;ensureMeta(t);saveProgress(t);return t;
}

function resetRunProgress(p){
  const fresh=defaultProgress();ensureMeta(p);
  p.xp=0;p.level=1;p.nextXp=fresh.nextXp;p.skillPoints=0;p.skills={...fresh.skills};p.unlocks={...fresh.unlocks};
  p.discoveredEnemies=p.discoveredEnemies||{};p.score=0;
  const up=p.metaUpgrades||{};
  const bp=up.backpack||0;
  p.inventory={wood:24+bp*4,stone:10+bp*2,scrap:28+bp*6,medkits:(up.medkit||0),items:[]};
  p.downed=false;p.revive=0;p.lastDeathCause=null;p.shootCd=0;p.harvestCd=0;p.buildCd=0;p.upgradeCd=0;p.weaponLevel=1;p.multitoolLevel=1;
  p.runBonuses={damage:0,speed:0};p.runStats={kills:0,harvest:0,waves:0,builds:0,damage:0,coreDamage:0,weaponShots:{},minCoreRatio:1};p.petState=blankPetState();p.petX=p.x+(p.slot===1?-104:104);p.petY=p.y+72;p.slowMoveTimer=0;p.stamina=p.staminaMax=100;p.sprintRegenDelay=0;p.sprinting=false;p.poisonTime=0;p.poisonDps=0;p.burnTime=0;p.burnDps=0;p.comboCount=0;p.comboTimer=0;p.comboBest=0;p.comboTier=0;
  // Consume one copy of each purchased preparation item per run.
  // These are AUTO-ACTIVATED on the next run; the player never has to find a hidden use button.
  const activatedPrep=[];
  if((p.prepItems.prep_medkit||0)>0){p.prepItems.prep_medkit--;p.inventory.medkits++;activatedPrep.push("+1 аптечка");}
  if((p.prepItems.prep_scrap||0)>0){p.prepItems.prep_scrap--;p.inventory.scrap+=45;activatedPrep.push("+45 металла");}
  if((p.prepItems.prep_supply||0)>0){p.prepItems.prep_supply--;p.inventory.wood+=18;p.inventory.stone+=12;p.inventory.scrap+=25;activatedPrep.push("набор снабжения");}
  if((p.prepItems.prep_damage||0)>0){p.prepItems.prep_damage--;p.runBonuses.damage+=10;activatedPrep.push("+10% урона");}
  if((p.prepItems.prep_speed||0)>0){p.prepItems.prep_speed--;p.runBonuses.speed+=7;activatedPrep.push("+7% скорости");}
  applyStats(p);applyClassLoadout(p);p.hp=p.maxHp;
  if(p.account&&!p.account.onboarding.runTutorialDone){p.account.tutorial={active:true,step:0,kills:0};saveAccounts();sendTutorialState(p);}
  saveProgress(p);
  if(activatedPrep.length)send(p.ws,"notice",{text:`Подготовка автоматически активирована: ${activatedPrep.join(" · ")}`});
}

function applyStats(p){
  const cc=classCfg(p);
  const runSpeed = 1 + ((p.runBonuses?.speed)||0)/100;
  p.maxHp = Math.round(100*(cc.hpMult||1)) + skillValue(p,"survivor_hp") + (p.metaUpgrades?.armor||0)*5;
  p.speed = 285*(cc.speedMult||1)*(1+skillValue(p,"survivor_speed")/100)*runSpeed;
  p.hp=Math.min(p.hp ?? p.maxHp,p.maxHp);
}
function addXp(p,amount){
  p.xp += amount;
  let leveled=false;
  while(p.xp>=p.nextXp){
    p.xp -= p.nextXp;
    p.level++;
    p.skillPoints++;
    p.nextXp = Math.round(p.nextXp*1.22+20);
    leveled=true;
  }
  if(leveled){
    applyStats(p);
    p.hp=p.maxHp;
    send(p.ws,"notice",{text:`Уровень ${p.level}! Получено очко навыка.`});
  }
}

function makePlayer(ws,name,profile,slot,character){
  const prog=loadProgress(profile);
  const desiredClass=CLASSES[character]?character:"starter";
  const classId=desiredClass==="starter"||prog.unlockedClasses?.[desiredClass]?desiredClass:"starter";
  const p={
    id:nextPlayerId++,ws,slot,name:String(name||`Игрок ${slot}`).slice(0,18),
    profile:sanitizeProfile(profile||name||`player${slot}`),
    character:classId,
    x:WORLD.cx+(slot===1?-150:150),y:WORLD.cy,r:21,
    hp:100,maxHp:100,downed:false,revive:0,speed:285,stamina:100,staminaMax:100,sprintRegenDelay:0,sprinting:false,lastDeathCause:null,
    weapon:{type:"pistol",rarity:"common"},weaponAmmo:freshWeaponAmmo("pistol"),
    inventory:{wood:24,stone:10,scrap:28,medkits:0,items:[]},
    shootCd:0,harvestCd:0,buildCd:0,upgradeCd:0,weaponLevel:1,multitoolLevel:1,
    bubbleAmmo:60,bubbleAmmoMax:60,bubbleRecharge:0,bubbleAutoReturn:false,
    input:{up:false,down:false,left:false,right:false,sprint:false,shoot:false,ax:1,ay:0},
    dir:{x:1,y:0},score:0,
    xp:prog.xp,level:prog.level,nextXp:prog.nextXp,skillPoints:prog.skillPoints,
    skills:prog.skills,unlocks:prog.unlocks,discoveredEnemies:prog.discoveredEnemies||{},bestWave:prog.bestWave,
    silver:prog.silver||0,gold:prog.gold||0,petsOwned:normalizePetsOwned(prog.petsOwned),equippedPet:prog.equippedPet||null,
    metaQuests:normalizeMetaQuests(prog.metaQuests),metaQuestCooldownUntil:prog.metaQuestCooldownUntil||0,metaUpgrades:normalizeMetaUpgrades(prog.metaUpgrades),prepItems:normalizePrep(prog.prepItems),
    unlockedClasses:normalizeUnlockedClasses(prog.unlockedClasses),achievements:normalizeAchievements(prog.achievements),lifetime:normalizeLifetime(prog.lifetime),
    runHistory:normalizeHistory(prog.runHistory),crateTokens:prog.crateTokens||0,titlesUnlocked:prog.titlesUnlocked||["Новичок"],selectedTitle:prog.selectedTitle||"Новичок",
    runBonuses:{damage:0,speed:0},runStats:{kills:0,harvest:0,waves:0,builds:0,damage:0,coreDamage:0,weaponShots:{},minCoreRatio:1},petState:blankPetState(),slowMoveTimer:0,
    poisonTime:0,poisonDps:0,burnTime:0,burnDps:0,comboCount:0,comboTimer:0,comboBest:0,comboTier:0
  };
  p.account=accounts[cleanUsername(profile)]||null;
  ensureMeta(p);
  applyStats(p);
  applyClassLoadout(p);
  p.hp=p.maxHp;
  return p;
}

function makeRoom(code,mode="duo"){
  const room={
    code,mode,hostId:null,started:false,paused:false,wave:0,phase:"lobby",phaseTimer:0,elapsed:0,
    players:new Map(),zombies:[],bullets:[],effects:[],structures:[],resources:[],loot:[],spawnQueue:[],structurePurchaseCounts:{},
    core:{id:id(),x:WORLD.cx,y:WORLD.cy,r:74,level:1,hp:1200,maxHp:1200,heal:0.5,turret:1,light:260},
    spawnLeft:0,spawnTimer:0,waveTotal:0,eventText:"",eventTimer:0,nightModifier:null,modifierOffer:null,acceptedModifier:null,modifierVotes:new Set(),runCoreDamage:0,bossSpawned:false
  };
  generateResources(room);
  return room;
}
function generateResources(room){
  const types=["tree","rock","scrapPile"];
  for(let i=0;i<220;i++){
    let x,y;
    do{
      x=rand(120,WORLD.w-120); y=rand(120,WORLD.h-120);
    }while(Math.hypot(x-WORLD.cx,y-WORLD.cy)<470);
    const type=sample(types);
    const cfg={
      tree:{hp:56,r:31,respawn:26},
      rock:{hp:72,r:29,respawn:34},
      scrapPile:{hp:48,r:25,respawn:30}
    }[type];
    room.resources.push({id:id(),type,x,y,r:cfg.r,hp:cfg.hp,maxHp:cfg.hp,alive:true,respawn:0});
  }
}

function rollRarity(boss=false){
  const r=Math.random();
  if(boss){
    if(r<.09)return "legendary";
    if(r<.36)return "epic";
    if(r<.80)return "rare";
    return "uncommon";
  }
  if(r<.02)return "legendary";
  if(r<.10)return "epic";
  if(r<.29)return "rare";
  if(r<.60)return "uncommon";
  return "common";
}

function startDay(room,first=false){
  const flawless=!first && room.wave>0 && room.waveCoreDamageStart!=null && (room.runCoreDamage||0)===room.waveCoreDamageStart;
  room.phase="day";
  room.waveTotal=0;
  room.phaseTimer=first?15:21;
  room.eventText=first?"Добывайте ресурсы и укрепляйте генератор":"Рассвет — добыча, магазин и строительство";
  room.eventTimer=3;
  room.core.hp=Math.min(room.core.maxHp,room.core.hp+110);
  for(const p of room.players.values()){
    if(!p.downed)p.hp=Math.min(p.maxHp,p.hp+40);

    if(!first && room.wave>0){
      if(flawless){
        const bonus=6+floorStageForWave(room.wave)*2;
        p.inventory.scrap+=bonus;p.inventory.wood+=3;p.inventory.stone+=3;
        send(p.ws,"notice",{text:`Чистая оборона! +${bonus} металла, +3 дерева, +3 камня`});
      }
      const scrapReward=8+Math.floor(room.wave*1.75);
      const woodReward=room.wave%3===0?4:0;
      const stoneReward=room.wave%4===0?3:0;
      p.inventory.scrap+=scrapReward;
      p.inventory.wood+=woodReward;
      p.inventory.stone+=stoneReward;
      bumpStat(p,"waves",1);
      const rewardMult=room.nightModifier?.reward||1;
      const goldReward=BOSS_GOLD_REWARDS[room.wave]||0;
      const bonusScrap=Math.round(scrapReward*rewardMult);
      p.inventory.scrap+=Math.max(0,bonusScrap-scrapReward);
      if(goldReward>0)p.gold+=goldReward;
      if((p.runStats?.minCoreRatio??1)>=.80)p.lifetime.base80Best=Math.max(p.lifetime.base80Best||0,Math.min(5,room.wave));
      const goldText=goldReward>0?` · +${goldReward} золота`:"";
      send(p.ws,"notice",{text:`Волна очищена: +${bonusScrap} металла${goldText}${woodReward?`, +${woodReward} дерева`:""}${stoneReward?`, +${stoneReward} камня`:""}`});
    }

    p.bestWave=Math.max(p.bestWave,room.wave);
    checkAchievements(p,room);
    saveProgress(p);
    sendMeta(p.ws,p);
  }
  room.nightModifier=null;
  prepareNightModifierOffer(room,first);
}

function zombieCountForWave(room){
  const players=Math.max(1,room.players.size);
  const w=Math.max(1,room.wave);

  const base=players===1?5:8;
  const linear=(w-1)*(players===1?3:4);
  const late=Math.floor(Math.pow(Math.max(0,w-3),1.15)*(players===1?.48:.72));
  return Math.max(base,base+linear+late);
}

function spawnDelayForWave(room){
  const players=Math.max(1,room.players.size);
  const w=Math.max(1,room.wave);
  const early=players===1?.82:.70;
  return Math.max(players===1?.32:.26,early-(w-1)*.035);
}

function weightedPick(entries){
  const total=entries.reduce((a,x)=>a+x[1],0);
  let r=Math.random()*total;
  for(const [type,w] of entries){
    r-=w;
    if(r<=0)return type;
  }
  return entries[0][0];
}

function isBossType(type){return String(type||"").startsWith("boss_");}
function isMiniBossType(type){return String(type||"").startsWith("mini_");}
function isMajorEnemyType(type){return isBossType(type)||isMiniBossType(type);}
function bossForWave(w){return BOSS_BY_WAVE[w]||null;}
function miniBossForWave(w){return MINI_BOSS_BY_WAVE[w]||null;}
function chooseNightModifier(w){
  if(w<3)return null;
  const r=Math.random();
  if(r<.32)return NIGHT_MODIFIERS.blood;
  if(r<.54)return NIGHT_MODIFIERS.acid;
  if(r<.82)return NIGHT_MODIFIERS.fullmoon;
  return NIGHT_MODIFIERS.blackout;
}
function prepareNightModifierOffer(room,first=false){
  room.modifierVotes=new Set();
  room.acceptedModifier=null;
  room.modifierOffer=null;
  const nextWave=room.wave+1;
  if(first||nextWave<3||Math.random()>.58)return;
  room.modifierOffer=chooseNightModifier(nextWave);
  if(room.modifierOffer){
    room.eventText=`Риск на следующую волну: ${room.modifierOffer.name}`;
    room.eventTimer=3.2;
  }
}
function updateModifierAcceptance(room){
  if(!room.modifierOffer)return false;
  const needed=Math.max(1,room.players.size),votes=room.modifierVotes?.size||0;
  if(votes>=needed){
    room.acceptedModifier=room.modifierOffer;
    room.eventText=`РИСК ПРИНЯТ: ${room.modifierOffer.name}`;
    room.eventTimer=2.8;
    return true;
  }
  room.acceptedModifier=null;
  return false;
}
function pickWaveEnemy(room,counts){
  const w=room.wave;
  const entries=[["orc",100]];
  const push=(type,weight,cap=Infinity)=>{if(w>=(ZOMBIE_DEBUT[type]||999)&&((counts[type]||0)<cap))entries.push([type,weight]);};

  push("runner",18+Math.min(8,w),Infinity);
  push("armored",13,Math.max(1,Math.floor(w/3)));
  push("spitter",9,Math.max(1,Math.floor(w/4)));
  push("bomber",8,Math.max(1,Math.floor(w/4)));
  push("shaman",6,Math.max(1,Math.floor(w/6)));
  push("titan",2.5,1+Math.floor(Math.max(0,w-10)/8));

  push("leaper",8,Math.max(1,Math.floor(w/5)));
  push("shieldbearer",7,Math.max(1,Math.floor(w/5)));
  push("splitter",6.2,Math.max(1,Math.floor(w/6)));
  push("hunter",5.5,Math.max(1,Math.floor(w/6)));
  push("sapper",4.8,Math.max(1,Math.floor(w/7)));
  push("necromancer",3.6,Math.max(1,Math.floor(w/8)));
  push("frost",3.3,Math.max(1,Math.floor(w/8)));
  push("parasite",2.8,Math.max(1,Math.floor(w/9)));
  push("teleporter",2.4,Math.max(1,Math.floor(w/10)));
  push("abyssal",1.7,Math.max(1,Math.floor(w/12)));

  return weightedPick(entries);
}
function waveIntro(w){
  const debut=Object.entries(ZOMBIE_DEBUT).find(([,wave])=>wave===w)?.[0];
  return debut?`Новый враг: ${debut}`:"";
}
function floorStageForWave(w){
  return Math.max(0,Math.min(9,Math.floor(Math.max(0,(Number(w)||0)-1)/5)));
}
function floorStageForRoom(room){
  const wave=Math.max(0,Number(room?.wave)||0);
  const completedWave=room?.phase==="day"?wave:Math.max(0,wave-1);
  return Math.max(0,Math.min(9,Math.floor(completedWave/5)));
}
function floorMutationForWave(w){
  const stage=floorStageForWave(w);
  if(stage===2)return "toxic";
  if(stage===3)return "frost";
  if(stage===4)return "lava";
  if(stage===5)return "arcane";
  if(stage>=9)return "royal";
  return null;
}
function floorMutationName(mut){
  return ({toxic:"Ядовитые",frost:"Ледяные",lava:"Лавовые",arcane:"Рунические",royal:"Королевская свита"})[mut]||"";
}
function applyFloorMutation(room,z,forced=null){
  if(!z||isBossType(z.type))return z;
  const mut=forced||floorMutationForWave(room.wave);
  if(!mut)return z;
  if(!forced){
    const chance={toxic:.34,frost:.36,lava:.34,arcane:.30,royal:.62}[mut]||0;
    if(Math.random()>chance)return z;
  }
  if(z.floorAffix===mut)return z;
  z.floorAffix=mut;
  if(mut==="toxic"){
    z.maxHp*=1.08;z.hp=z.maxHp;z.dmg*=1.05;
  }else if(mut==="frost"){
    z.maxHp*=1.10;z.hp=z.maxHp;z.speed*=.97;
  }else if(mut==="lava"){
    z.maxHp*=1.12;z.hp=z.maxHp;z.dmg*=1.10;
  }else if(mut==="arcane"){
    z.maxHp*=1.14;z.hp=z.maxHp;z.dmg*=1.08;z.commander=true;z.specialCd=Math.min(z.specialCd||99,1.8);
  }else if(mut==="royal"){
    z.maxHp*=1.22;z.hp=z.maxHp;z.dmg*=1.18;z.speed*=1.08;z.commander=true;z.regenPerSec=Math.max(z.regenPerSec||0,z.maxHp*.008);z.eliteRangedMult=(z.eliteRangedMult||1)*.82;z.xp=Math.round(z.xp*1.35);
  }
  return z;
}
function spawnRoyalEscort(room){
  if(room.wave!==50)return;
  const lineup=["shieldbearer","hunter","armored","frost","sapper","teleporter"];
  for(let i=0;i<lineup.length;i++){
    const ang=(Math.PI*2/lineup.length)*i+rand(-.12,.12),radius=rand(720,840);
    spawnZombie(room,lineup[i],{x:clamp(WORLD.cx+Math.cos(ang)*radius,60,WORLD.w-60),y:clamp(WORLD.cy+Math.sin(ang)*radius,60,WORLD.h-60)},"royal");
  }
  room.eventText="Волна 50: Королевская свита вышла на охоту";
  room.eventTimer=Math.max(room.eventTimer,4.2);
}
function inflictPoison(p,duration,dps){
  if(!p||p.downed)return;
  p.poisonTime=Math.max(p.poisonTime||0,duration||0);
  p.poisonDps=Math.max(p.poisonDps||0,dps||0);
}
function inflictBurn(p,duration,dps){
  if(!p||p.downed)return;
  p.burnTime=Math.max(p.burnTime||0,duration||0);
  p.burnDps=Math.max(p.burnDps||0,dps||0);
}
function applyFloorMutationHit(room,z,target){
  const mut=z?.floorAffix;if(!mut||!target)return;
  const targetIsPlayer=!!target.ws;
  if(mut==="toxic"){
    if(target===room.core)damageCore(room,3+room.wave*.18);
    else if(targetIsPlayer){inflictPoison(target,4.2,2.2+room.wave*.08);addEffect(room,{type:"acid",x:z.x,y:z.y,x2:target.x,y2:target.y,life:.24});}
    else{target.hp-=4+room.wave*.18;if(isTowerType(target.type))target.jam=Math.max(target.jam||0,.45);}
  }
  if(mut==="frost"){
    if(targetIsPlayer){target.slowMoveTimer=Math.max(target.slowMoveTimer||0,3.3);addEffect(room,{type:"frostHit",x:target.x,y:target.y,r:48,life:.24});}
    else if(target!==room.core&&isTowerType(target.type))target.stun=Math.max(target.stun||0,1.15);
  }
  if(mut==="lava"){
    if(target===room.core)damageCore(room,4+room.wave*.22);
    else if(targetIsPlayer){inflictBurn(target,3.8,2.8+room.wave*.10);addEffect(room,{type:"towerFlame",x:z.x,y:z.y,x2:target.x,y2:target.y,life:.22,maxLife:.22});}
    else target.hp-=6+room.wave*.24;
  }
  if(mut==="arcane"){
    if(targetIsPlayer){target.slowMoveTimer=Math.max(target.slowMoveTimer||0,1.0);addEffect(room,{type:"amethystBeam",x:z.x,y:z.y,x2:target.x,y2:target.y,life:.22,maxLife:.22});}
    else if(target!==room.core&&isTowerType(target.type))target.jam=Math.max(target.jam||0,.6);
  }
  if(mut==="royal"){
    if(targetIsPlayer)target.slowMoveTimer=Math.max(target.slowMoveTimer||0,1.3);
    else if(target!==room.core&&isTowerType(target.type))target.jam=Math.max(target.jam||0,.8);
  }
}
function startWave(room){
  room.wave++;
  room.waveCoreDamageStart=room.runCoreDamage||0;
  if(room.wave>1 && room.wave%5===1){
    for(const st of room.structures)if(st.hp>0)st.hp=Math.min(st.maxHp,st.hp+st.maxHp*.25);
    for(const p of room.players.values())send(p.ws,"notice",{text:"Новый этаж: ремонтный импульс восстановил 25% прочности построек"});
    addEffect(room,{type:"amethystRepair",x:room.core.x,y:room.core.y,x2:room.core.x,y2:room.core.y,r:300,life:1.2,maxLife:1.2});
  }
  room.phase="night";
  room.phaseTimer=Math.max(78,94-room.wave*.45);
  room.nightModifier=room.acceptedModifier||null;
  room.modifierOffer=null;
  room.acceptedModifier=null;
  if(room.modifierVotes)room.modifierVotes.clear();
  room.bossSpawned=false;

  let total=zombieCountForWave(room);
  const bossType=bossForWave(room.wave);
  const miniBossType=miniBossForWave(room.wave);
  if(bossType)total=Math.max(4,total-3);
  else if(miniBossType)total=Math.max(6,total-2);

  const counts={};
  room.spawnQueue=[];
  for(let i=0;i<total;i++){
    const type=pickWaveEnemy(room,counts);
    counts[type]=(counts[type]||0)+1;
    room.spawnQueue.push(type);
  }

  const debutType=Object.entries(ZOMBIE_DEBUT).find(([,wave])=>wave===room.wave)?.[0];
  if(debutType&&!room.spawnQueue.includes(debutType)&&room.spawnQueue.length){
    const idx=Math.max(0,room.spawnQueue.findIndex(t=>t==="orc"));
    room.spawnQueue[idx]=debutType;
  }
  for(let i=room.spawnQueue.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [room.spawnQueue[i],room.spawnQueue[j]]=[room.spawnQueue[j],room.spawnQueue[i]];
  }

  room.spawnLeft=room.spawnQueue.length;
  room.waveSpawnTotal=room.spawnLeft + (bossType?1:0) + (miniBossType?1:0) + (room.wave===50?6:0);
  room.spawnTimer=.25;
  const mod=room.nightModifier?.name?` · ${room.nightModifier.name}`:"";
  const floorMut=floorMutationForWave(room.wave);
  const floorTag=floorMut&&floorMut!=="royal"?` · ${floorMutationName(floorMut)} заражённые`:"";
  if(bossType)room.eventText=`Волна ${room.wave}: ${BOSS_NAMES[bossType]}${mod}${floorTag}`;
  else if(miniBossType)room.eventText=`Волна ${room.wave}: Мини-босс — ${MINI_BOSS_NAMES[miniBossType]}${mod}${floorTag}`;
  else room.eventText=`Ночь ${room.wave}${mod}${floorTag}`;
  room.eventTimer=4.0;
  if(bossType){spawnZombie(room,bossType);room.bossSpawned=true;}
  else if(miniBossType)spawnZombie(room,miniBossType);
  if(room.wave===50)spawnRoyalEscort(room);
  room.waveTotal=Math.max(1,room.spawnQueue.length+room.zombies.length);
}

function discoverEnemy(room,type){
  for(const p of room.players.values()){
    p.discoveredEnemies=p.discoveredEnemies||{};
    if(p.discoveredEnemies[type])continue;
    p.discoveredEnemies[type]=true;
    saveProgress(p);
    send(p.ws,"enemyUnlocked",{enemy:type,wave:room.wave});
    sendMeta(p.ws,p);
  }
}

function applyElite(room,z){
  if(isBossType(z.type)||isMiniBossType(z.type)||room.wave<6)return;
  const baseChance=Math.min(.28,.03+Math.max(0,room.wave-6)*.006);
  const chance=baseChance*(room.nightModifier?.elite||1);
  if(Math.random()>chance)return;
  const mods=[sample(ELITE_MODS)];
  if(room.wave>=30&&Math.random()<.10){
    const second=sample(ELITE_MODS.filter(x=>x!==mods[0]));mods.push(second);
  }
  z.eliteMods=mods;
  for(const mod of mods){
    if(mod==="furious"){z.dmg*=1.28;z.speed*=1.10;}
    if(mod==="shielded")z.eliteRangedMult=(z.eliteRangedMult||1)*.62;
    if(mod==="regen")z.regenPerSec=Math.max(z.regenPerSec||0,z.maxHp*.014);
    if(mod==="swift")z.speed*=1.30;
    if(mod==="commander")z.commander=true;
    if(mod==="cursed")z.cursed=true;
  }
  z.maxHp*=1.18;z.hp=z.maxHp;z.xp=Math.round(z.xp*1.65);
}
function spawnZombie(room,forced=null,spawnPos=null,mutationOverride=null){
  const type=forced||"orc";
  const a=rand(0,Math.PI*2);
  const radius=isBossType(type)?rand(1080,1320):rand(620,860);
  let x=spawnPos?.x??clamp(WORLD.cx+Math.cos(a)*radius,60,WORLD.w-60);
  let y=spawnPos?.y??clamp(WORLD.cy+Math.sin(a)*radius,60,WORLD.h-60);
  const w=room.wave;
  discoverEnemy(room,type);

  const cfg={
    orc:{hp:58+w*6,speed:72+w*1.2,r:22,dmg:11+w*.40,xp:15},
    runner:{hp:32+w*3.5,speed:112+w*1.5,r:16,dmg:6+w*.25,xp:16},
    armored:{hp:145+w*11,speed:48+w*.7,r:30,dmg:18+w*.55,xp:34},
    spitter:{hp:76+w*6,speed:58+w*.7,r:22,dmg:10+w*.35,xp:28},
    bomber:{hp:95+w*8,speed:57+w*.65,r:27,dmg:8+w*.25,xp:26},
    shaman:{hp:82+w*6,speed:55+w*.55,r:23,dmg:8+w*.30,xp:34},
    titan:{hp:520+w*38,speed:42+w*.45,r:45,dmg:30+w*.80,xp:95},

    leaper:{hp:72+w*5.5,speed:82+w*1.0,r:19,dmg:13+w*.35,xp:25},
    shieldbearer:{hp:165+w*10,speed:54+w*.55,r:29,dmg:16+w*.45,xp:38},
    splitter:{hp:115+w*8,speed:62+w*.7,r:27,dmg:14+w*.40,xp:36},
    hunter:{hp:90+w*7,speed:92+w*.9,r:21,dmg:18+w*.48,xp:42},
    sapper:{hp:118+w*8,speed:60+w*.6,r:25,dmg:22+w*.55,xp:46},
    necromancer:{hp:135+w*9,speed:48+w*.45,r:25,dmg:11+w*.35,xp:56},
    frost:{hp:175+w*10,speed:55+w*.5,r:28,dmg:15+w*.45,xp:52},
    parasite:{hp:82+w*6,speed:84+w*.8,r:17,dmg:9+w*.3,xp:48},
    teleporter:{hp:145+w*9,speed:60+w*.55,r:24,dmg:19+w*.5,xp:62},
    abyssal:{hp:420+w*24,speed:48+w*.4,r:35,dmg:26+w*.7,xp:100},

    mini_toxic_brute:{hp:920+w*75,speed:56+w*.45,r:42,dmg:24+w*.65,xp:190},
    mini_lava_beast:{hp:1320+w*86,speed:60+w*.40,r:46,dmg:29+w*.75,xp:245},
    mini_shadow_stalker:{hp:1600+w*96,speed:74+w*.55,r:40,dmg:31+w*.78,xp:310},
    mini_void_harbinger:{hp:2280+w*108,speed:64+w*.46,r:48,dmg:36+w*.84,xp:390},

    boss_stone:{hp:1650+w*120,speed:48+w*.45,r:62,dmg:38+w*1.0,xp:360},
    boss_butcher:{hp:2400+w*135,speed:64+w*.5,r:58,dmg:48+w*1.1,xp:480},
    boss_plague:{hp:4100+w*150,speed:45+w*.35,r:70,dmg:42+w*.9,xp:650},
    boss_colossus:{hp:6200+w*170,speed:36+w*.28,r:78,dmg:58+w*1.15,xp:820},
    boss_shadow:{hp:7900+w*185,speed:68+w*.4,r:65,dmg:62+w*1.15,xp:1050},
    boss_king:{hp:11200+w*210,speed:56+w*.38,r:82,dmg:75+w*1.3,xp:1500}
  }[type]||null;
  if(!cfg)return null;

  if(type==="runner"&&room.nightModifier?.runnerSpeed)cfg.speed*=room.nightModifier.runnerSpeed;
  if(type==="mini_shadow_stalker")cfg.speed*=1.06;
  const z={
    id:id(),type,x,y,r:cfg.r,hp:cfg.hp,maxHp:cfg.hp,speed:cfg.speed,dmg:cfg.dmg,xp:cfg.xp,
    attackCd:rand(0,.35),specialCd:rand(.5,2),slow:0,lastHit:0,burnTime:0,burnDps:0,burnOwner:0,
    fuse:0,slamCd:0,eliteMods:[],regenPerSec:0,adaptKind:null,adaptHits:0,phaseFlags:{},teleportFlash:0,nonMeleeDamage:false,burnSourceKind:null,
    floorAffix:null
  };
  room.zombies.push(z);applyElite(room,z);applyFloorMutation(room,z,mutationOverride);return z;
}
function damageZombie(z,amount,sourceKind="ranged"){
  let mult=1;
  if((isBossType(z.type)||isMiniBossType(z.type))&&sourceKind!=="melee")z.nonMeleeDamage=true;
  if(z.type==="armored"){if(sourceKind==="ranged")mult*=.70;if(sourceKind==="melee")mult*=1.20;}
  if(z.type==="titan"&&sourceKind==="ranged")mult*=.86;
  if(z.type==="shieldbearer"&&sourceKind==="ranged")mult*=.48;
  if(z.type==="boss_colossus"&&sourceKind==="ranged")mult*=.72;
  if(z.eliteRangedMult&&sourceKind==="ranged")mult*=z.eliteRangedMult;
  if(z.type==="abyssal"){
    if(z.adaptKind===sourceKind){z.adaptHits=(z.adaptHits||0)+1;if(z.adaptHits>=3)mult*=.68;}
    else{z.adaptKind=sourceKind;z.adaptHits=1;}
  }
  const dealt=Math.max(0,amount*mult);z.hp-=dealt;return dealt;
}

function damageCore(room,amount){
  amount=Math.max(0,Number(amount)||0);if(amount<=0)return;
  room.core.hp-=amount;room.runCoreDamage=(room.runCoreDamage||0)+amount;
  const ratio=Math.max(0,room.core.hp/Math.max(1,room.core.maxHp));
  for(const p of room.players.values()){
    p.runStats=p.runStats||{};p.runStats.coreDamage=(p.runStats.coreDamage||0)+amount;p.runStats.minCoreRatio=Math.min(p.runStats.minCoreRatio??1,ratio);
  }
}
function damageTarget(room,target,amount,cause="unknown"){
  if(target===room.core){damageCore(room,amount);return;}
  for(const p of room.players.values())if(p===target){damagePlayer(p,amount,cause);return;}
  target.hp-=amount;
}

function addEffect(room,e){
  room.effects.push({id:id(),...e});
  if(room.effects.length>80)room.effects.splice(0,room.effects.length-80);
}


function shoot(room,p){
  if(p.downed||p.shootCd>0)return;
  const w=WEAPONS[p.weapon.type];if(!w)return;
  const melee=w.kind==="melee";
  if(!melee){
    p.weaponAmmo=p.weaponAmmo||freshWeaponAmmo(p.weapon.type,p.bubbleAmmo??60,p.weapon?.rarity||"common");
    if(p.weaponAmmo.reloading)return;
    if(p.weaponAmmo.mag<=0){startReload(p);return;}
  }
  if(w.bubble&&(p.bubbleAmmo||0)<=0){
    if((p.bubbleRecharge||0)<=0){p.bubbleRecharge=180;p.bubbleAutoReturn=true;setWeapon(p,"pistol","common");send(p.ws,"notice",{text:"60 пузырей израсходованы. Bubble Gun восстановится через 3 минуты."});}
    return;
  }

  const rarityName=p.weapon.rarity||"common",rarity=RARITIES[rarityName]||RARITIES.common;
  const rateMult=(1+skillValue(p,"gun_rate")/100)*equipmentRateMultiplier(p.weaponLevel);
  const classMult=classDamageMultiplier(p,w);
  let petWeaponMult=1;
  if(p.equippedPet==="amethyst_fury")petWeaponMult*=1.35;
  if(p.equippedPet==="red_dragon"&&p.weapon.type==="fire_machete")petWeaponMult*=1.20;
  const dmgMult=rarity.mult*(1+skillValue(p,"gun_damage")/100)*classMult*(1+((p.runBonuses?.damage)||0)/100)*petWeaponMult*comboDamageMultiplier(p)*equipmentDamageMultiplier(p.weaponLevel);
  p.shootCd=w.rate/rateMult;
  p.runStats=p.runStats||{weaponShots:{}};p.runStats.weaponShots=p.runStats.weaponShots||{};p.runStats.weaponShots[p.weapon.type]=(p.runStats.weaponShots[p.weapon.type]||0)+1;
  if(!melee)p.weaponAmmo.mag=Math.max(0,p.weaponAmmo.mag-1);
  const aim=norm(p.input.ax,p.input.ay);

  const critChance=rarityName==="epic"?.18:rarityName==="legendary"?.25:0;
  const critMult=1.55;
  if(melee){
    const facing=Math.atan2(aim.y,aim.x);let hitCount=0;
    for(const z of room.zombies){
      const dx=z.x-p.x,dy=z.y-p.y,d=Math.hypot(dx,dy);if(d>w.range+z.r)continue;
      const a=Math.atan2(dy,dx),diff=Math.atan2(Math.sin(a-facing),Math.cos(a-facing));if(Math.abs(diff)>w.arc/2)continue;
      const crit=Math.random()<critChance,raw=w.damage*dmgMult*(crit?critMult:1),dealt=damageZombie(z,raw,"melee");
      p.runStats.damage=(p.runStats.damage||0)+dealt;z.lastHit=p.id;z.slow=Math.max(z.slow,.12);
      if(w.burn){const fireMult=p.character==="flame"?(classCfg(p).fireDamage||1):1;z.burnTime=p.character==="flame"?3.5:2.8;z.burnDps=w.burn*dmgMult*fireMult;z.burnOwner=p.id;z.burnSourceKind="melee";}
      hitCount++;if(hitCount>=3)break;
    }
    room.bullets.push({id:id(),kind:"meleeFx",weapon:p.weapon.type,rarity:rarityName,x:p.x,y:p.y,vx:aim.x,vy:aim.y,r:0,life:.16,damage:0,owner:p.id});
    return;
  }

  const baseA=Math.atan2(aim.y,aim.x);
  for(let i=0;i<w.pellets;i++){
    const a=baseA+rand(-w.spread,w.spread),crit=Math.random()<critChance;
    room.bullets.push({
      id:id(),kind:w.bubble?"bubble":"bullet",weapon:p.weapon.type,rarity:rarityName,
      x:p.x+Math.cos(a)*29,y:p.y+Math.sin(a)*29,vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed,
      r:w.bubble?9:4,life:w.range/w.speed,damage:w.damage*dmgMult*(crit?critMult:1),owner:p.id,
      pierce:rarityName==="legendary"?2:(rarityName==="rare"||rarityName==="epic"?1:0),chain:rarityName==="legendary"?.30:0,hitIds:[]
    });
  }
  if(w.bubble){
    p.bubbleAmmo=Math.max(0,(p.bubbleAmmo||0)-1);
    if(p.bubbleAmmo<=0){p.bubbleRecharge=180;p.bubbleAutoReturn=true;setWeapon(p,"pistol","common");send(p.ws,"notice",{text:"60 пузырей израсходованы. Bubble Gun вернётся через 3 минуты."});}
    else if(p.weaponAmmo.mag<=0)startReload(p);
  }else if(p.weaponAmmo.mag<=0)startReload(p);
  if(room.bullets.length>520)room.bullets.splice(0,room.bullets.length-520);
}

function damagePlayer(p,a,cause="unknown"){
  if(p.downed)return;
  p.hp-=a;
  if(p.hp<=0){
    p.hp=0;
    p.downed=true;
    p.revive=0;
    p.lastDeathCause=cause||"unknown";
    p.input={up:false,down:false,left:false,right:false,sprint:false,shoot:false,ax:0,ay:0};
    send(p.ws,"playerDied",{cause:p.lastDeathCause});
  }
}
function nearestTarget(room,z){
  const siege=["titan","sapper","parasite","boss_colossus"].includes(z.type);
  if(z.type==="hunter"){
    const alive=[...room.players.values()].filter(p=>!p.downed);
    if(alive.length)return alive.sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp))[0];
  }
  if(siege){
    let target=room.core,best=Math.hypot(z.x-room.core.x,z.y-room.core.y)-room.core.r;
    for(const st of room.structures){const d=distanceToStructurePoint(z.x,z.y,st);if(d<best){best=d;target=st;}}
    return target;
  }
  let target=room.core,best=Math.hypot(z.x-room.core.x,z.y-room.core.y)-room.core.r;
  for(const p of room.players.values()){
    if(p.downed)continue;const d=Math.hypot(z.x-p.x,z.y-p.y)-p.r;
    if(d<best*.92){best=d;target=p;}
  }
  let block=null,bd=Infinity;
  for(const st of room.structures){const d=distanceToStructurePoint(z.x,z.y,st);if(d<bd&&d<82){bd=d;block=st;}}
  return block||target;
}

function zombieTargetDistance(z,target,room){
  if(target===room.core)return Math.max(0,Math.hypot(z.x-target.x,z.y-target.y)-z.r-target.r);
  for(const p of room.players.values()){
    if(p===target)return Math.max(0,Math.hypot(z.x-p.x,z.y-p.y)-z.r-p.r);
  }
  return Math.max(0,distanceToStructurePoint(z.x,z.y,target)-z.r);
}

function harvest(room,p){
  if(p.downed||p.harvestCd>0)return;
  let target=null,best=82;
  for(const n of room.resources){
    if(!n.alive)continue;
    const d=dist(p,n);
    if(d<best){best=d;target=n;}
  }
  if(!target)return;
  const toolLevel=Math.max(1,Math.min(EQUIPMENT_MAX_LEVEL,Number(p.multitoolLevel)||1));
  p.harvestCd=.36/equipmentRateMultiplier(toolLevel);
  const classGather=1;
  const gatherMult=1+skillValue(p,"gather")/100+(p.metaUpgrades?.gather||0)*.05;
  const power=12*classGather*gatherMult*equipmentDamageMultiplier(toolLevel);
  target.hp-=power;
  if(target.hp<=0){
    target.alive=false;
    target.respawn=target.type==="tree"?26:target.type==="rock"?34:30;
    const mult=1+skillValue(p,"gather")/100+(p.metaUpgrades?.gather||0)*.05;
    const amount=Math.round(rand(7,12)*mult*(1+(toolLevel-1)*.08));
    if(target.type==="tree")p.inventory.wood+=amount;
    if(target.type==="rock")p.inventory.stone+=amount;
    if(target.type==="scrapPile")p.inventory.scrap+=amount;
    bumpStat(p,"harvest",amount);
    tutorialEvent(p,"harvest");
    addXp(p,10);
    send(p.ws,"notice",{text:`Добыто: +${amount} ${target.type==="tree"?"дерева":target.type==="rock"?"камня":"металла"}`});
  }
}

function buildBossLootBundle(room,z){
  const wave=Math.max(1,room.wave||1);
  const floorStage=Math.max(1,Math.ceil(wave/5));
  // Bosses are a nice bonus, not an economy skip. Most progression still comes
  // from surviving waves, gathering, and choosing what to spend on.
  const scrap=Math.round(12+wave*1.6);
  const wood=3+floorStage*2;
  const stone=2+floorStage*2;
  const gold=0;
  const crateToken=(wave>=25&&Math.random()<0.12)?1:0;
  const items=[];
  if(scrap>0)items.push({kind:"scrap",amount:scrap,rarity:"rare"});
  if(wood>0)items.push({kind:"wood",amount:wood,rarity:"uncommon"});
  if(stone>0)items.push({kind:"stone",amount:stone,rarity:"common"});
  if(crateToken>0)items.push({kind:"crateToken",amount:crateToken,rarity:"legendary"});
  return {scrap,wood,stone,gold,crateToken,items};
}
function spawnBossLoot(room,z){
  // Bosses drop one readable bundle cache instead of scattered unclear rewards.
  const bundle=buildBossLootBundle(room,z);
  room.loot.push({
    id:id(),kind:"cache",x:z.x+35,y:z.y-18,r:28,life:100,
    amount:bundle.scrap,bundle,
    bossType:z.type,bossName:BOSS_NAMES[z.type]||"Босс"
  });
}
function pickupLoot(room,p){
  let target=null,best=76;
  for(const l of room.loot){
    const d=dist(p,l);
    if(d<best){best=d;target=l;}
  }
  if(!target)return false;
  if(target.kind==="weapon"){
    if(target.weapon.type==="bubble_blaster"){
      p.bubbleAmmo=60;p.bubbleAmmoMax=60;p.bubbleRecharge=0;p.bubbleAutoReturn=false;
    }
    setWeapon(p,target.weapon.type,target.weapon.rarity);
    p.unlocks[target.weapon.type]=true;
    send(p.ws,"notice",{text:`Лут босса: ${RARITIES[target.weapon.rarity].label} ${WEAPONS[target.weapon.type].name}`});
  }else if(target.kind==="crateToken"){
    p.crateTokens=(p.crateTokens||0)+1;saveProgress(p);send(p.ws,"notice",{text:"🎟 Найден золотой жетон ящика: следующий кейс можно открыть бесплатно"});
  }else{
    const bundle=target.bundle||{scrap:target.amount||50,wood:0,stone:0,gold:0,crateToken:0,items:[{kind:"scrap",amount:target.amount||50,rarity:"rare"}]};
    const recipients=[...room.players.values()];
    const parts=[];
    if(bundle.scrap>0)parts.push(`+${bundle.scrap} металла`);
    if(bundle.wood>0)parts.push(`+${bundle.wood} дерева`);
    if(bundle.stone>0)parts.push(`+${bundle.stone} камня`);
    if(bundle.crateToken>0)parts.push(`+${bundle.crateToken} жетон ящика`);
    // Boss cache is a team reward: whichever teammate reaches it first collects
    // it for everyone currently in the room.
    for(const receiver of recipients){
      if(bundle.scrap>0)receiver.inventory.scrap+=bundle.scrap;
      if(bundle.wood>0)receiver.inventory.wood+=bundle.wood;
      if(bundle.stone>0)receiver.inventory.stone+=bundle.stone;
      if(bundle.crateToken>0)receiver.crateTokens=(receiver.crateTokens||0)+bundle.crateToken;
      if(bundle.crateToken>0)saveProgress(receiver);
      send(receiver.ws,'bossLoot',{bossName:target.bossName||"Босс",bossType:target.bossType||"boss",items:bundle.items||[]});
      send(receiver.ws,"notice",{text:`🎁 Командная добыча с босса: ${parts.join(', ')}`});
    }
  }
  room.loot=room.loot.filter(x=>x.id!==target.id);
  return true;
}

const WALL_HALF_LEN=48;
const WALL_HALF_THICK=8;

function isWallType(type){return type==="wall"||type==="gate"}

function wallEndpoints(x,y,rotation){
  const dx=Math.cos(rotation)*WALL_HALF_LEN;
  const dy=Math.sin(rotation)*WALL_HALF_LEN;
  return [{x:x-dx,y:y-dy},{x:x+dx,y:y+dy}];
}

function pointSegmentDistance(px,py,ax,ay,bx,by){
  const abx=bx-ax,aby=by-ay;
  const den=abx*abx+aby*aby||1;
  const t=Math.max(0,Math.min(1,((px-ax)*abx+(py-ay)*aby)/den));
  const qx=ax+abx*t,qy=ay+aby*t;
  return Math.hypot(px-qx,py-qy);
}

function segSegDistance(a,b,c,d){
  const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
  const onSeg=(p,q,r)=>Math.abs(cross(p,q,r))<1e-7&&r.x>=Math.min(p.x,q.x)-1e-7&&r.x<=Math.max(p.x,q.x)+1e-7&&r.y>=Math.min(p.y,q.y)-1e-7&&r.y<=Math.max(p.y,q.y)+1e-7;
  const o1=cross(a,b,c),o2=cross(a,b,d),o3=cross(c,d,a),o4=cross(c,d,b);
  const intersects=((o1>0&&o2<0)||(o1<0&&o2>0))&&((o3>0&&o4<0)||(o3<0&&o4>0))
    ||onSeg(a,b,c)||onSeg(a,b,d)||onSeg(c,d,a)||onSeg(c,d,b);
  if(intersects)return 0;
  return Math.min(
    pointSegmentDistance(a.x,a.y,c.x,c.y,d.x,d.y),
    pointSegmentDistance(b.x,b.y,c.x,c.y,d.x,d.y),
    pointSegmentDistance(c.x,c.y,a.x,a.y,b.x,b.y),
    pointSegmentDistance(d.x,d.y,a.x,a.y,b.x,b.y)
  );
}

function structureCollisionRadius(type){
  if(isWallType(type))return WALL_HALF_THICK;
  return STRUCTURES[type]?.r||30;
}

function distanceToStructurePoint(px,py,st){
  if(isWallType(st.type)){
    const [a,b]=wallEndpoints(st.x,st.y,st.rotation||0);
    return Math.max(0,pointSegmentDistance(px,py,a.x,a.y,b.x,b.y)-WALL_HALF_THICK);
  }
  return Math.max(0,Math.hypot(px-st.x,py-st.y)-(st.r||30));
}
function entityBlockedByWallsAt(room,entity,x,y,{gatesSolid=true,towersSolid=false}={}){
  if(room.core?.hp>0 && Math.hypot(x-room.core.x,y-room.core.y)<entity.r+room.core.r+2)return room.core;
  for(const st of room.structures){
    if(st.hp<=0)continue;
    if(st.type==="wall" || (gatesSolid&&st.type==="gate")){
      const [a,b]=wallEndpoints(st.x,st.y,st.rotation||0);
      if(pointSegmentDistance(x,y,a.x,a.y,b.x,b.y)<entity.r+WALL_HALF_THICK+2)return st;
      continue;
    }
    if(towersSolid&&isTowerType(st.type)){
      if(Math.hypot(x-st.x,y-st.y)<entity.r+(st.r||28)+2)return st;
    }
  }
  return null;
}
function playerBlockedAt(room,p,x,y){
  // Gates auto-open for players, but towers are solid obstacles.
  return entityBlockedByWallsAt(room,p,x,y,{gatesSolid:false,towersSolid:true});
}
function collisionSlideVector(room,entity,blocker,vx,vy){
  if(!blocker)return {x:vx,y:vy};
  if(blocker===room.core || (blocker.type&&isTowerType(blocker.type))){
    const rx=entity.x-blocker.x,ry=entity.y-blocker.y,len=Math.hypot(rx,ry)||1;
    const nx=rx/len,ny=ry/len,dot=vx*nx+vy*ny;
    if(dot<0)return {x:vx-dot*nx,y:vy-dot*ny};
    return {x:vx,y:vy};
  }
  if(blocker.type==="wall"||blocker.type==="gate"){
    const tx=Math.cos(blocker.rotation||0),ty=Math.sin(blocker.rotation||0),dot=vx*tx+vy*ty;
    return {x:tx*dot,y:ty*dot};
  }
  return {x:0,y:0};
}
function moveCircleWithWallCollision(room,entity,dx,dy,{gatesSolid=true,towersSolid=false,maxStep=7}={}){
  const distance=Math.hypot(dx,dy);
  if(distance<=0)return null;
  const steps=Math.max(1,Math.ceil(distance/maxStep));
  const sx=dx/steps,sy=dy/steps;
  let blocker=null;
  for(let i=0;i<steps;i++){
    const tx=clamp(entity.x+sx,entity.r,WORLD.w-entity.r);
    const ty=clamp(entity.y+sy,entity.r,WORLD.h-entity.r);
    const hit=entityBlockedByWallsAt(room,entity,tx,ty,{gatesSolid,towersSolid});
    if(!hit){entity.x=tx;entity.y=ty;continue;}
    blocker=blocker||hit;

    // Project the blocked movement onto the obstacle tangent. This is what makes
    // the player "glide" around the round generator/towers instead of snagging.
    const slide=collisionSlideVector(room,entity,hit,sx,sy);
    let moved=false;
    if(Math.hypot(slide.x,slide.y)>.0001){
      const sx2=clamp(entity.x+slide.x,entity.r,WORLD.w-entity.r);
      const sy2=clamp(entity.y+slide.y,entity.r,WORLD.h-entity.r);
      if(!entityBlockedByWallsAt(room,entity,sx2,sy2,{gatesSolid,towersSolid})){
        entity.x=sx2;entity.y=sy2;moved=true;
      }
    }
    if(moved)continue;

    // Fallback for corners/compound obstacles.
    const nx=clamp(entity.x+sx,entity.r,WORLD.w-entity.r);
    if(!entityBlockedByWallsAt(room,entity,nx,entity.y,{gatesSolid,towersSolid})){entity.x=nx;moved=true;}
    const ny=clamp(entity.y+sy,entity.r,WORLD.h-entity.r);
    if(!entityBlockedByWallsAt(room,entity,entity.x,ny,{gatesSolid,towersSolid})){entity.y=ny;moved=true;}
  }
  return blocker;
}
function movePlayerWithCollision(room,p,dx,dy,dt){
  if(!dx&&!dy)return;
  const sprintMult=p.sprinting?1.42:1;
  const n=norm(dx,dy),speed=p.speed*(p.slowMoveTimer>0?.62:1)*sprintMult*comboMoveMultiplier(p);
  moveCircleWithWallCollision(room,p,n.x*speed*dt,n.y*speed*dt,{gatesSolid:false,towersSolid:true,maxStep:6});
}
function moveZombieWithCollision(room,z,dx,dy){
  // All normal ground zombies collide with both walls and gates. Special movement
  // (teleports/leaps) has its own explicit validation before changing position.
  return moveCircleWithWallCollision(room,z,dx,dy,{gatesSolid:true,towersSolid:true,maxStep:Math.max(4,Math.min(7,z.r*.35))});
}

function wallConnectionAllowed(x,y,rotation,st){
  if(!isWallType(st.type))return false;
  const mine=wallEndpoints(x,y,rotation),other=wallEndpoints(st.x,st.y,st.rotation||0);
  let endpointGap=Infinity;
  for(const a of mine)for(const b of other)endpointGap=Math.min(endpointGap,Math.hypot(a.x-b.x,a.y-b.y));
  if(endpointGap>13)return false;

  // Endpoints may touch, but long overlapping segments are still invalid.
  const centerGap=Math.hypot(x-st.x,y-st.y);
  return centerGap>45;
}

function placementValid(room,p,type,x,y,rotation=0){
  const cfg=STRUCTURES[type];
  if(!cfg)return {ok:false,msg:"Неизвестная постройка"};
  if(Math.hypot(x-p.x,y-p.y)>148)return {ok:false,msg:"Слишком далеко"};

  if(isWallType(type)){
    const [a,b]=wallEndpoints(x,y,rotation);
    for(const e of [a,b]){
      if(e.x<50||e.y<50||e.x>WORLD.w-50||e.y>WORLD.h-50)return {ok:false,msg:"Край карты"};
    }
    if(pointSegmentDistance(room.core.x,room.core.y,a.x,a.y,b.x,b.y)<room.core.r+28)return {ok:false,msg:"Слишком близко к базе"};

    for(const st of room.structures){
      if(isWallType(st.type)){
        if(wallConnectionAllowed(x,y,rotation,st))continue;
        const mine=wallEndpoints(x,y,rotation),other=wallEndpoints(st.x,st.y,st.rotation||0);
        if(segSegDistance(mine[0],mine[1],other[0],other[1])<WALL_HALF_THICK*2+5)return {ok:false,msg:"Стены пересекаются"};
      }else{
        if(pointSegmentDistance(st.x,st.y,a.x,a.y,b.x,b.y)<(st.r||30)+WALL_HALF_THICK+6)return {ok:false,msg:"Место занято"};
      }
    }

    for(const node of room.resources){
      if(node.alive&&pointSegmentDistance(node.x,node.y,a.x,a.y,b.x,b.y)<node.r+WALL_HALF_THICK+6)return {ok:false,msg:"Сначала уберите ресурс"};
    }
    for(const other of room.players.values()){
      if(pointSegmentDistance(other.x,other.y,a.x,a.y,b.x,b.y)<other.r+WALL_HALF_THICK+5)return {ok:false,msg:"Здесь стоит игрок"};
    }
    for(const z of room.zombies){
      if(pointSegmentDistance(z.x,z.y,a.x,a.y,b.x,b.y)<z.r+WALL_HALF_THICK+4)return {ok:false,msg:"Здесь находится зомби"};
    }
    return {ok:true};
  }

  if(x<60||y<60||x>WORLD.w-60||y>WORLD.h-60)return {ok:false,msg:"Край карты"};
  const myR=structureCollisionRadius(type);
  if(Math.hypot(x-room.core.x,y-room.core.y)<room.core.r+myR+34)return {ok:false,msg:"Слишком близко к базе"};

  for(const st of room.structures){
    if(isWallType(st.type)){
      if(distanceToStructurePoint(x,y,st)<myR+6)return {ok:false,msg:"Место занято"};
    }else if(Math.hypot(x-st.x,y-st.y)<myR+structureCollisionRadius(st.type)+7){
      return {ok:false,msg:"Место занято"};
    }
  }
  for(const node of room.resources){
    if(node.alive&&Math.hypot(x-node.x,y-node.y)<myR+node.r+8)return {ok:false,msg:"Сначала уберите ресурс"};
  }
  for(const other of room.players.values()){
    if(Math.hypot(x-other.x,y-other.y)<myR+other.r+10)return {ok:false,msg:"Здесь стоит игрок"};
  }
  for(const z of room.zombies){
    if(Math.hypot(x-z.x,y-z.y)<myR+z.r+8)return {ok:false,msg:"Здесь находится зомби"};
  }
  return {ok:true};
}

function build(room,p,m){
  const type=m.structure,cfg=STRUCTURES[type];
  if(!cfg||p.downed||p.buildCd>0)return;
  const limit=structureBuildLimit(type),activeCount=activeStructureCount(room,type);
  if(activeCount>=limit)return send(p.ws,"notice",{text:`Лимит: ${cfg.name} ${activeCount}/${limit}`});
  const buildCost=structureBuildCost(room,type);
  if(!hasCost(p.inventory,buildCost))return send(p.ws,"notice",{text:missingCostText(p.inventory,buildCost)});
  let x=Number(m.x),y=Number(m.y),rotation=Number(m.rotation)||0;
  if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(rotation))return;
  x=Math.round(x/4)*4; y=Math.round(y/4)*4;
  rotation=((rotation%(Math.PI*2))+(Math.PI*2))%(Math.PI*2);
  const valid=placementValid(room,p,type,x,y,rotation);
  if(!valid.ok)return send(p.ws,"notice",{text:valid.msg});
  p.buildCd=.16;
  pay(p.inventory,buildCost);
  room.structurePurchaseCounts=room.structurePurchaseCounts||{};
  room.structurePurchaseCounts[type]=(room.structurePurchaseCounts[type]||0)+1;
  const hp=cfg.hp*(1+skillValue(p,"builder")/100);
  room.structures.push({id:id(),type,x,y,r:cfg.r,hp,maxHp:hp,rotation,cooldown:0,level:1,power:1,ownerId:p.id});
  bumpStat(p,"builds",1);
  tutorialEvent(p,"build");
  addXp(p,5);
}


function upgradeStructure(room,p,structureId){
  if(p.upgradeCd>0)return;
  const st = room.structures.find(x=>x.id===Number(structureId));
  if(!st) return send(p.ws,"notice",{text:"Постройка не найдена"});
  if(distanceToStructurePoint(p.x,p.y,st)>165) return send(p.ws,"notice",{text:"Подойдите ближе к постройке"});
  st.level = st.level || 1;
  if(st.level >= STRUCTURE_MAX_LEVEL) return send(p.ws,"notice",{text:"Постройка уже максимального уровня"});
  const cost = structureUpgradeCost(st.type, st.level);
  if(!cost) return;
  if(!hasCost(p.inventory,cost)){
    return send(p.ws,"notice",{text:missingCostText(p.inventory,cost,"Для улучшения не хватает")});
  }
  pay(p.inventory,cost);
  p.upgradeCd=.25;

  st.level += 1;
  st.power = 1 + (st.level-1)*0.25;

  const oldMax = st.maxHp;
  st.maxHp = Math.round(st.maxHp * 1.32);
  st.hp = Math.min(st.maxHp, st.hp + Math.round((st.maxHp-oldMax) + oldMax*0.22));

  send(p.ws,"notice",{text:`${STRUCTURES[st.type].name} улучшена до уровня ${st.level}`});
  tutorialEvent(p,"upgrade");
  addXp(p, 9 + st.level*2);
}

function buy(room,p,item){
  item=String(item||"");
  if(dist(p,room.core)>RUN_SHOP_RADIUS){send(p.ws,"notice",{text:"Магазин работает только рядом с генератором"});return false;}
  const cost=SHOP[item];
  if(!cost){send(p.ws,"notice",{text:"Такого товара нет в полевом магазине"});return false;}
  if(!hasCost(p.inventory,cost)){
    send(p.ws,"notice",{text:missingCostText(p.inventory,cost)});
    return false;
  }
  pay(p.inventory,cost);
  if(item==="heal"){
    p.inventory.medkits=(p.inventory.medkits||0)+1;
    send(p.ws,"notice",{text:`Аптечка куплена и добавлена в слот 3. Всего: ${p.inventory.medkits}`});
    return true;
  }
  if(item==="bubble_blaster"){
    p.bubbleAmmo=60;p.bubbleAmmoMax=60;p.bubbleRecharge=0;p.bubbleAutoReturn=false;
  }else p.bubbleAutoReturn=false;
  setWeapon(p,item,"common");
  p.weaponLevel=1;
  p.unlocks[item]=true;
  send(p.ws,"notice",{text:`Куплено: ${WEAPONS[item].name}. Оружие сразу экипировано`});
  return true;
}

function upgradeRunEquipment(room,p,kind){
  kind=kind==="multitool"?"multitool":"weapon";
  if(dist(p,room.core)>RUN_SHOP_RADIUS){send(p.ws,"notice",{text:"Улучшения доступны только рядом с генератором"});return false;}
  const field=kind==="multitool"?"multitoolLevel":"weaponLevel";
  const current=Math.max(1,Math.min(EQUIPMENT_MAX_LEVEL,Number(p[field])||1));
  if(current>=EQUIPMENT_MAX_LEVEL){send(p.ws,"notice",{text:"Уже достигнут максимальный уровень"});return false;}
  const next=current+1,cost=(kind==="multitool"?MULTITOOL_UPGRADE_COSTS:WEAPON_UPGRADE_COSTS)[next];
  if(!hasCost(p.inventory,cost)){send(p.ws,"notice",{text:missingCostText(p.inventory,cost)});return false;}
  pay(p.inventory,cost);p[field]=next;
  const label=kind==="multitool"?MULTITOOL_NAMES[next]:`${WEAPONS[p.weapon?.type]?.name||"Оружие"} ур. ${next}`;
  send(p.ws,"notice",{text:`Улучшено: ${label}`});
  return true;
}

function removeStructure(room,p,structureId){
  if(p.downed||p.upgradeCd>0)return false;
  const idNum=Number(structureId);
  const idx=room.structures.findIndex(x=>x.id===idNum);
  if(idx<0){send(p.ws,"notice",{text:"Постройка не найдена"});return false;}
  const st=room.structures[idx];
  if(distanceToStructurePoint(p.x,p.y,st)>165){send(p.ws,"notice",{text:"Подойдите ближе к постройке"});return false;}
  room.structures.splice(idx,1);
  p.upgradeCd=.25;
  send(p.ws,"notice",{text:`${STRUCTURES[st.type]?.name||"Постройка"} удалена`});
  return true;
}

function lobbyShopBuy(target,item){
  ensureMeta(target);const cfg=META_SHOP[item];if(!cfg)return false;
  if(target.silver<cfg.price)return false;
  target.silver-=cfg.price;target.prepItems[item]=(target.prepItems[item]||0)+1;saveProgress(target);return true;
}
function lobbyUpgradeBuy(target,key){
  ensureMeta(target);const cfg=META_UPGRADES[key];if(!cfg)return false;
  const level=target.metaUpgrades[key]||0;if(level>=cfg.max)return false;
  const price=metaUpgradePrice(key,level);if(target.silver<price)return false;
  target.silver-=price;target.metaUpgrades[key]=level+1;saveProgress(target);return true;
}
function claimMetaQuest(target,id){
  ensureMeta(target);
  if((target.metaQuestCooldownUntil||0)>Date.now())return false;
  const q=target.metaQuests.find(x=>x.id===id);
  if(!q||q.claimed||q.progress<q.target)return false;
  target.silver+=q.reward;q.claimed=true;
  const allClaimed=target.metaQuests.length>0&&target.metaQuests.every(x=>x.claimed);
  if(allClaimed){
    target.metaQuestCooldownUntil=Date.now()+QUEST_COOLDOWN_MS;
    send(target.ws,"notice",{text:"Все квесты закрыты. Новый набор будет доступен через 30 минут."});
  }
  saveProgress(target);return true;
}
function openMetaCrate(target){
  ensureMeta(target);
  const key=target.profile||"player",now=Date.now(),lockedUntil=crateLocks.get(key)||0;
  if(now<lockedUntil)return {error:"cooldown",remaining:Math.ceil((lockedUntil-now)/100)/10};
  const useToken=(target.crateTokens||0)>0;
  if(!useToken&&target.gold<CRATE_COST_GOLD)return {error:"gold"};
  if(useToken)target.crateTokens--;else target.gold-=CRATE_COST_GOLD;
  crateLocks.set(key,now+5600);
  const result=weightedPetRoll();target.petsOwned[result]=(target.petsOwned[result]||0)+1;
  saveProgress(target);return {pet:result,reel:buildCrateReel(result),usedToken:useToken};
}
function skipMetaCrateCooldown(target){
  ensureMeta(target);
  const key=target.profile||"player";
  crateLocks.delete(key); // Skip means the reveal is finished: allow the next server-authoritative roll immediately.
  return true;
}
function equipMetaPet(target,petId){
  ensureMeta(target);
  if(!petId){target.equippedPet=null;saveProgress(target);return true;}
  if(!PETS[petId]||(target.petsOwned[petId]||0)<=0)return false;
  target.equippedPet=petId;saveProgress(target);return true;
}
function selectMetaTitle(target,title){
  ensureMeta(target);title=String(title||"Новичок");if(!target.titlesUnlocked.includes(title))return false;
  target.selectedTitle=title;saveProgress(target);return true;
}
function unlockMetaClass(target,classId){
  ensureMeta(target);
  if(!CLASSES[classId]||classId==="starter")return false;
  if(target.unlockedClasses[classId])return true;
  const price=CLASS_COSTS[classId]||0;
  if(target.gold<price)return false;
  target.gold-=price;target.unlockedClasses[classId]=true;saveProgress(target);return true;
}
function handleAdmin(room,p,m){
  if(!QA_ADMIN_ENABLED){
    send(p?.ws,"notice",{text:"Админ-команды отключены в обычной сборке"});
    return false;
  }
  if(!m||typeof m!=="object")return false;
  const op=String(m.op||"");
  if(op==="resource"){
    const kind=String(m.kind||""),amount=Math.max(0,Number(m.amount)||0);
    if(["wood","stone","scrap"].includes(kind))p.inventory[kind]+=amount;
    if(kind==="silver")p.silver+=amount;
    if(kind==="gold")p.gold+=amount;
  }
  if(op==="weapon"){
    const type=String(m.weapon||"");if(WEAPONS[type]){if(type==="bubble_blaster"){p.bubbleAmmo=60;p.bubbleRecharge=0;p.bubbleAutoReturn=false;}setWeapon(p,type,"common");p.unlocks[type]=true;}
  }
  if(op==="pet"){
    const petId=String(m.pet||"");if(PETS[petId])p.petsOwned[petId]=(p.petsOwned[petId]||0)+1;
  }
  if(op==="token")p.crateTokens=(p.crateTokens||0)+Math.max(1,Number(m.amount)||1);
  saveProgress(p);send(p.ws,"notice",{text:"Админ-команда применена"});sendMeta(p.ws,p);return true;
}
function useMedkit(p){
  if(!p || p.downed)return;
  const count=p.inventory.medkits||0;
  if(count<=0)return send(p.ws,"notice",{text:"В слоте 3 нет аптечек"});
  if(p.hp>=p.maxHp)return send(p.ws,"notice",{text:"Здоровье уже полное"});

  p.inventory.medkits=count-1;
  const heal=70;
  p.hp=Math.min(p.maxHp,p.hp+heal);
  send(p.ws,"notice",{text:`Аптечка: +${heal} HP · осталось ${p.inventory.medkits}`});
}

function structureRepairPlan(st,repairMult=1){
  if(!st||!Number.isFinite(st.hp)||!Number.isFinite(st.maxHp)||st.hp>=st.maxHp)return null;
  const cfg=STRUCTURES[st.type];if(!cfg)return null;
  const missing=Math.max(0,st.maxHp-st.hp);
  const chunk=Math.max(24,st.maxHp*.30);
  const amount=Math.min(missing,chunk);
  const fraction=Math.max(.18,amount/chunk);
  const factor=.12*fraction*Math.max(1,repairMult||1);
  const cost={wood:0,stone:0,scrap:0};
  for(const k of ["wood","stone","scrap"]){
    const base=cfg.cost[k]||0;
    cost[k]=base>0?Math.max(1,Math.ceil(base*factor)):0;
  }
  return {amount,cost};
}
function repairSpecificStructure(room,p,structureId){
  if(p.downed||p.harvestCd>0)return false;
  const st=room.structures.find(x=>x.id===Number(structureId));
  if(!st){send(p.ws,"notice",{text:"Постройка не найдена"});return false;}
  if(distanceToStructurePoint(p.x,p.y,st)>165){send(p.ws,"notice",{text:"Подойдите ближе к постройке"});return false;}
  if(st.hp>=st.maxHp){send(p.ws,"notice",{text:"Постройка не повреждена"});return false;}
  const plan=structureRepairPlan(st,room.nightModifier?.repair||1);if(!plan)return false;
  if(!hasCost(p.inventory,plan.cost)){send(p.ws,"notice",{text:missingCostText(p.inventory,plan.cost,"Для ремонта не хватает")});return false;}
  pay(p.inventory,plan.cost);p.harvestCd=.24;
  const before=st.hp;st.hp=Math.min(st.maxHp,st.hp+plan.amount);
  addEffect(room,{type:"repairSpark",x:st.x,y:st.y,r:32,life:.28});
  send(p.ws,"notice",{text:`${STRUCTURES[st.type]?.name||"Постройка"} отремонтирована на ${Math.ceil(st.hp-before)} HP`});
  return true;
}

function repairStructureWithTool(room,p){
  if(p.downed||p.harvestCd>0)return false;
  let target=null,best=88;
  for(const st of room.structures){
    if(st.hp>=st.maxHp)continue;
    const d=distanceToStructurePoint(p.x,p.y,st);
    if(d<best){best=d;target=st;}
  }
  if(!target)return false;
  const repairMult=room.nightModifier?.repair||1;
  const baseCost=target.type==="wall"||target.type==="gate"?{wood:1,stone:0,scrap:0}:{wood:0,stone:0,scrap:1};
  const cost={wood:Math.ceil(baseCost.wood*repairMult),stone:0,scrap:Math.ceil(baseCost.scrap*repairMult)};
  if(!hasCost(p.inventory,cost))return send(p.ws,"notice",{text:missingCostText(p.inventory,cost,"Для ремонта мультитулом не хватает")});
  pay(p.inventory,cost);p.harvestCd=.24;
  const amount=18+skillValue(p,"builder")*.18;
  target.hp=Math.min(target.maxHp,target.hp+amount);
  addEffect(room,{type:"repairSpark",x:target.x,y:target.y,r:28,life:.22});
  return true;
}

function spendSkill(p,key){
  const s=SKILLS[key];
  if(!s||p.skillPoints<=0||(p.skills[key]||0)>=s.max)return;
  p.skillPoints--;
  p.skills[key]=(p.skills[key]||0)+1;
  applyStats(p);
  send(p.ws,"progress",{skillPoints:p.skillPoints,skills:p.skills});
}
function repairCore(room,p){
  if(dist(p,room.core)>300)return send(p.ws,"notice",{text:"Подойдите к генератору"});
  const missing=room.core.maxHp-room.core.hp;
  if(missing<=0)return send(p.ws,"notice",{text:"База уже полностью отремонтирована"});
  const cost={wood:8,stone:6,scrap:12};
  if(!hasCost(p.inventory,cost))return send(p.ws,"notice",{text:missingCostText(p.inventory,cost,"Для ремонта базы не хватает")});
  pay(p.inventory,cost);
  room.core.hp=Math.min(room.core.maxHp,room.core.hp+260);
  send(p.ws,"notice",{text:"Генератор отремонтирован на 260 HP"});
}
function upgradeCore(room,p){
  if(dist(p,room.core)>300)return send(p.ws,"notice",{text:"Подойдите к генератору"});
  if(room.core.level>=5)return send(p.ws,"notice",{text:"База уже максимального уровня"});
  const next=CORE_UPGRADES[room.core.level];
  if(!next)return;
  if(!hasCost(p.inventory,next.cost))return send(p.ws,"notice",{text:missingCostText(p.inventory,next.cost,"Для улучшения базы не хватает")});
  pay(p.inventory,next.cost);
  const ratio=room.core.hp/room.core.maxHp;
  room.core.level=next.level;
  room.core.maxHp=next.hp;
  room.core.hp=Math.max(room.core.hp,Math.round(next.hp*Math.max(.65,ratio)));
  room.core.heal=next.heal;
  room.core.turret=next.turret;
  room.core.light=next.light;
  room.eventText=`База улучшена до уровня ${next.level}`;
  room.eventTimer=3;
}

function targetPlayer(room,z,mode="nearest"){
  const alive=[...room.players.values()].filter(p=>!p.downed);if(!alive.length)return null;
  if(mode==="weak")return alive.sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp))[0];
  return alive.sort((a,b)=>dist(z,a)-dist(z,b))[0];
}
function rageOnce(z,speed=1.25,dmg=1.25){if(z.phaseFlags.rage)return;z.phaseFlags.rage=true;z.speed*=speed;z.dmg*=dmg;}
function bossPhase(room,z,text){room.eventText=`${BOSS_NAMES[z.type]||"БОСС"}: ${text}`;room.eventTimer=2.4;}
function miniBossPhase(room,z,text){room.eventText=`${MINI_BOSS_NAMES[z.type]||"МИНИ-БОСС"}: ${text}`;room.eventTimer=2.2;}
function miniBossLogic(room,z,dt){
  if(!isMiniBossType(z.type))return;
  const ratio=z.hp/Math.max(1,z.maxHp);
  if(z.type==="mini_toxic_brute"){
    if(ratio<=.58&&!z.phaseFlags.spawn){z.phaseFlags.spawn=true;miniBossPhase(room,z,"ПРИЗЫВ КИСЛОТНИКОВ");for(let i=0;i<2;i++)spawnZombie(room,"spitter",{x:z.x+rand(-70,70),y:z.y+rand(-70,70)},"toxic");}
    if(z.specialCd<=0){const r=150;for(const p of room.players.values())if(!p.downed&&dist(z,p)<r){damagePlayer(p,12+room.wave*.32,"mini_toxic_brute");inflictPoison(p,4.6,2.5+room.wave*.07);}for(const st of room.structures)if(dist(z,st)<r)st.hp-=13+room.wave*.30;if(dist(z,room.core)<r+room.core.r)damageCore(room,16+room.wave*.40);addEffect(room,{type:"acid",x:z.x-r*.6,y:z.y-r*.4,x2:z.x+r*.6,y2:z.y+r*.4,life:.34});z.specialCd=4.8;}
  }
  if(z.type==="mini_lava_beast"){
    if(ratio<=.50&&!z.phaseFlags.rage){miniBossPhase(room,z,"ПЛАМЕННАЯ ЯРОСТЬ");rageOnce(z,1.12,1.15);}
    if(z.specialCd<=0){const r=165;for(const p of room.players.values())if(!p.downed&&dist(z,p)<r){damagePlayer(p,14+room.wave*.36,"mini_lava_beast");inflictBurn(p,4.0,3.1+room.wave*.08);}for(const st of room.structures)if(dist(z,st)<r)st.hp-=18+room.wave*.38;if(dist(z,room.core)<r+room.core.r)damageCore(room,20+room.wave*.45);addEffect(room,{type:"explosion",x:z.x,y:z.y,r,life:.30});z.specialCd=4.4;}
  }
  if(z.type==="mini_shadow_stalker"){
    if(ratio<=.52&&!z.phaseFlags.pack){z.phaseFlags.pack=true;miniBossPhase(room,z,"ЗОВ ТЕНИ");for(let i=0;i<2;i++)spawnZombie(room,Math.random()<.5?"hunter":"teleporter",{x:z.x+rand(-85,85),y:z.y+rand(-85,85)});}
    if(z.specialCd<=0){const t=targetPlayer(room,z,"weak");if(t){const ang=Math.atan2(t.y-z.y,t.x-z.x),tx=clamp(t.x-Math.cos(ang)*88,60,WORLD.w-60),ty=clamp(t.y-Math.sin(ang)*88,60,WORLD.h-60);let blocked=false;for(const st of room.structures){if(isWallType(st.type)){const [a,b]=wallEndpoints(st.x,st.y,st.rotation||0);if(pointSegmentDistance(tx,ty,a.x,a.y,b.x,b.y)<z.r+WALL_HALF_THICK+5){blocked=true;break;}}else if(Math.hypot(tx-st.x,ty-st.y)<z.r+(st.r||28)+5){blocked=true;break;}}if(!blocked){z.x=tx;z.y=ty;addEffect(room,{type:"shadowBlink",x:z.x,y:z.y,r:86,life:.35});if(dist(z,t)<145)damagePlayer(t,18+room.wave*.42,"mini_shadow_stalker");}z.specialCd=4.1;}}
  }
  if(z.type==="mini_void_harbinger"){
    if(ratio<=.46&&!z.phaseFlags.pulse){z.phaseFlags.pulse=true;miniBossPhase(room,z,"ИМПУЛЬС ПУСТОТЫ");for(const p of room.players.values())if(!p.downed&&dist(z,p)<175){damagePlayer(p,16+room.wave*.40,"mini_void_harbinger");p.slowMoveTimer=Math.max(p.slowMoveTimer||0,1.5);}for(const st of room.structures)if(dist(z,st)<175&&isTowerType(st.type))st.jam=Math.max(st.jam||0,1.2);addEffect(room,{type:"cursedBurst",x:z.x,y:z.y,r:175,life:.40});}
    if(z.specialCd<=0){const t=targetPlayer(room,z,"nearest");if(t){damagePlayer(t,15+room.wave*.38,"mini_void_harbinger");t.slowMoveTimer=Math.max(t.slowMoveTimer||0,1.1);addEffect(room,{type:"amethystBeam",x:z.x,y:z.y,x2:t.x,y2:t.y,life:.30,maxLife:.30});for(const ally of room.zombies)if(ally.id!==z.id&&ally.hp>0&&dist(z,ally)<210)ally.attackCd=Math.max(0,(ally.attackCd||0)-.08);z.specialCd=4.3;}}
  }
}
function bossLogic(room,z,dt){
  if(!isBossType(z.type))return;
  const ratio=z.hp/Math.max(1,z.maxHp);
  if(z.type==="boss_stone"){
    if(ratio<=.70&&!z.phaseFlags.summon70){z.phaseFlags.summon70=true;bossPhase(room,z,"ФАЗА 2 — ПРИЗЫВ");for(let i=0;i<4;i++)spawnZombie(room,"runner",{x:z.x+rand(-80,80),y:z.y+rand(-80,80)});addEffect(room,{type:"bossPulse",x:z.x,y:z.y,r:100,life:.5});}
    if(ratio<=.40&&z.specialCd<=0){const t=targetPlayer(room,z,"nearest");if(t){addEffect(room,{type:"bossRock",projectile:true,x:z.x,y:z.y,x2:t.x,y2:t.y,speed:560,damage:24+room.wave*.7,impactRadius:48,cause:"boss_stone",life:1.8,maxLife:1.8});z.specialCd=3.0;}}
    if(ratio<=.15&&!z.phaseFlags.rage){bossPhase(room,z,"ФИНАЛЬНАЯ ЯРОСТЬ");rageOnce(z,1.28,1.25);}
  }
  if(z.type==="boss_butcher"){
    if(ratio<=.50&&!z.phaseFlags.rage){bossPhase(room,z,"ФАЗА 2 — БЕШЕНСТВО");rageOnce(z,1.24,1.22);}
    if(z.specialCd<=0){const t=targetPlayer(room,z,"weak");if(t){const n=norm(t.x-z.x,t.y-z.y);moveZombieWithCollision(room,z,n.x*110,n.y*110);addEffect(room,{type:"bossDash",x:z.x,y:z.y,r:95,life:.3});if(dist(z,t)<125)damagePlayer(t,32+room.wave*.7,"boss_butcher");z.specialCd=2.8;}}
  }
  if(z.type==="boss_plague"){
    if(z.specialCd<=0){for(let i=0;i<2;i++)spawnZombie(room,Math.random()<.55?"runner":"spitter",{x:z.x+rand(-100,100),y:z.y+rand(-100,100)});const t=targetPlayer(room,z,"nearest");if(t){damagePlayer(t,20+room.wave*.55,"boss_plague");addEffect(room,{type:"acid",x:z.x,y:z.y,x2:t.x,y2:t.y,life:.32});}z.specialCd=4.8;}
    if(ratio<=.40&&!z.phaseFlags.necro){z.phaseFlags.necro=true;bossPhase(room,z,"ФАЗА 2 — ЧУМНОЙ РИТУАЛ");spawnZombie(room,"necromancer",{x:z.x+90,y:z.y});spawnZombie(room,"necromancer",{x:z.x-90,y:z.y});}
  }
  if(z.type==="boss_colossus"){
    if(ratio<=.50&&!z.phaseFlags.rage){bossPhase(room,z,"ФАЗА 2 — ОСАДНЫЙ РЕЖИМ");rageOnce(z,1.18,1.18);}
    if(z.specialCd<=0){
      for(const st of room.structures){if(dist(z,st)<165){st.hp-=42+room.wave*.6;if(isTowerType(st.type))st.stun=Math.max(st.stun||0,3);}}
      for(const p of room.players.values())if(!p.downed&&dist(z,p)<165)damagePlayer(p,27+room.wave*.5,"boss_colossus");
      addEffect(room,{type:"slam",x:z.x,y:z.y,r:170,life:.5});z.specialCd=4.1;
    }
  }
  if(z.type==="boss_shadow"){
    if(z.specialCd<=0){const t=targetPlayer(room,z,"weak");if(t){
      let tx=z.x,ty=z.y,found=false;
      for(let tries=0;tries<10&&!found;tries++){const a=rand(0,Math.PI*2),cx=clamp(t.x+Math.cos(a)*170,80,WORLD.w-80),cy=clamp(t.y+Math.sin(a)*170,80,WORLD.h-80);if(!entityBlockedByWallsAt(room,z,cx,cy,{gatesSolid:true,towersSolid:true})){tx=cx;ty=cy;found=true;}}
      if(found){z.x=tx;z.y=ty;addEffect(room,{type:"shadowBlink",x:z.x,y:z.y,r:95,life:.45});if(dist(z,t)<220)damagePlayer(t,22+room.wave*.45,"boss_shadow");}
      z.specialCd=4.0;
    }}
    if(ratio<=.30&&!z.phaseFlags.clones){z.phaseFlags.clones=true;bossPhase(room,z,"ФАЗА 2 — ТЁМНЫЕ КОПИИ");for(let i=0;i<3;i++)spawnZombie(room,"teleporter",{x:z.x+rand(-110,110),y:z.y+rand(-110,110)});}
  }
  if(z.type==="boss_king"){
    if(ratio<=.70&&!z.phaseFlags.summon70){z.phaseFlags.summon70=true;bossPhase(room,z,"ФАЗА 2 — КОРОЛЕВСКАЯ ОРДА");for(let i=0;i<6;i++)spawnZombie(room,sample(["runner","shieldbearer","hunter"]),{x:z.x+rand(-120,120),y:z.y+rand(-120,120)});}
    if(ratio<=.40&&!z.phaseFlags.elite40){z.phaseFlags.elite40=true;bossPhase(room,z,"ФАЗА 3 — ЭЛИТНАЯ СВИТА");for(let i=0;i<3;i++){const e=spawnZombie(room,sample(["armored","frost","sapper"]),{x:z.x+rand(-120,120),y:z.y+rand(-120,120)});if(e&&!e.eliteMods.length){e.eliteMods=["furious"];e.dmg*=1.28;e.speed*=1.1;}}}
    if(ratio<=.15&&!z.phaseFlags.rage){bossPhase(room,z,"ФИНАЛ — КОРОЛЕВСКАЯ ЯРОСТЬ");rageOnce(z,1.35,1.35);}
    if(z.specialCd<=0){const t=targetPlayer(room,z,"weak");if(t){addEffect(room,{type:"bossRock",projectile:true,x:z.x,y:z.y,x2:t.x,y2:t.y,speed:650,damage:30+room.wave*.55,impactRadius:56,cause:"boss_king",life:1.8,maxLife:1.8});}if(Math.random()<.55)spawnZombie(room,"runner",{x:z.x+rand(-90,90),y:z.y+rand(-90,90)});z.specialCd=2.7;}
  }
}

function turretShotDamage(room,structure){
  const defensePetMult=[...room.players.values()].some(pp=>pp.equippedPet==="axolotl")?1.35:1;
  return 19*(room.core?.turret||1)*(structure?.power||1)*defensePetMult;
}
function structureOwner(room,structure){
  return room.players.get(structure?.ownerId)||room.players.get(room.hostId)||[...room.players.values()][0]||null;
}
function creditStructureHit(room,structure,z,dealt){
  const owner=structureOwner(room,structure);
  if(owner){
    z.lastHit=owner.id;
    owner.runStats=owner.runStats||{};
    owner.runStats.damage=(owner.runStats.damage||0)+Math.max(0,Number(dealt)||0);
    return owner.id;
  }
  return 0;
}

function updateRoom(room,dt){
  if(!room.started||room.paused)return;
  room.elapsed+=dt;
  room.eventTimer=Math.max(0,room.eventTimer-dt);

  if(room.phase==="day"){
    room.phaseTimer-=dt;
    if(room.phaseTimer<=0)startWave(room);
  }else if(room.phase==="night"){
    room.phaseTimer-=dt;
    if(room.spawnLeft>0){
      room.spawnTimer-=dt;
      if(room.spawnTimer<=0){
        const type=room.spawnQueue.shift()||"orc";
        spawnZombie(room,type);
        room.spawnLeft=room.spawnQueue.length;
        room.spawnTimer=spawnDelayForWave(room);
      }
    }
    if(room.spawnLeft<=0&&room.zombies.length===0&&room.core.hp>0&&[...room.players.values()].some(p=>!p.downed)){
      startDay(room);
      if(room.wave>=50){
        room.started=false;room.paused=false;room.phase="victory";
        for(const p of room.players.values()){
          p.input={up:false,down:false,left:false,right:false,sprint:false,shoot:false,ax:0,ay:0};
          send(p.ws,"gameOver",{wave:room.wave,reason:"victory",cause:"victory",stats:recordRun(p,room,"victory")});
        }
        return;
      }
    }
  }

  for(const n of room.resources){
    if(!n.alive){
      n.respawn-=dt;
      if(n.respawn<=0){n.alive=true;n.hp=n.maxHp;}
    }
  }

  for(const p of room.players.values()){
    p.shootCd=Math.max(0,p.shootCd-dt);
    p.harvestCd=Math.max(0,p.harvestCd-dt);
    if(p.weaponAmmo?.reloading){
      p.weaponAmmo.reloadTimer=Math.max(0,p.weaponAmmo.reloadTimer-dt);
      if(p.weaponAmmo.reloadTimer<=0)finishReload(p);
    }
    p.petState=p.petState||blankPetState();
    p.petState.healCd=Math.max(0,(p.petState.healCd||0)-dt);
    p.petState.attackCd=Math.max(0,(p.petState.attackCd||0)-dt);
    p.petState.utilityCd=Math.max(0,(p.petState.utilityCd||0)-dt);
    if(p.equippedPet){
      const side=p.slot===1?-1:1,targetX=p.x+side*82,targetY=p.y+66;
      if(!Number.isFinite(p.petX)||!Number.isFinite(p.petY)||Math.hypot(p.petX-p.x,p.petY-p.y)>520){p.petX=targetX;p.petY=targetY;}
      else{const dx=targetX-p.petX,dy=targetY-p.petY,d=Math.hypot(dx,dy);if(d>22){const step=Math.min(d,Math.min(185,55+d*.42)*dt);p.petX+=dx/d*step;p.petY+=dy/d*step;}}
    }

    if(p.bubbleRecharge>0){
      p.bubbleRecharge=Math.max(0,p.bubbleRecharge-dt);
      if(p.bubbleRecharge<=0){
        p.bubbleAmmo=p.bubbleAmmoMax||60;
        if(p.bubbleAutoReturn){
          setWeapon(p,"bubble_blaster","common");
          p.bubbleAutoReturn=false;
          send(p.ws,"notice",{text:"🫧 Королевская перезарядка завершена: 60 пузырей готовы."});
        }
      }
    }
    p.buildCd=Math.max(0,p.buildCd-dt);
    p.upgradeCd=Math.max(0,p.upgradeCd-dt);
    p.slowMoveTimer=Math.max(0,(p.slowMoveTimer||0)-dt);
    tickPlayerCombo(p,dt);
    p.poisonTime=Math.max(0,(p.poisonTime||0)-dt);
    p.burnTime=Math.max(0,(p.burnTime||0)-dt);
    if(!p.downed){
      if(p.poisonTime>0&&p.poisonDps>0)damagePlayer(p,p.poisonDps*dt,"toxic");
      if(p.burnTime>0&&p.burnDps>0)damagePlayer(p,p.burnDps*dt,"lava");
    }
    if(p.poisonTime<=0)p.poisonDps=0;
    if(p.burnTime<=0)p.burnDps=0;
    if(p.downed)continue;

    let dx=(p.input.right?1:0)-(p.input.left?1:0);
    let dy=(p.input.down?1:0)-(p.input.up?1:0);
    const moving=!!(dx||dy);
    const wantsSprint=!!p.input.sprint&&moving&&p.stamina>0.25;
    if(wantsSprint){
      p.stamina=Math.max(0,p.stamina-15.4*dt); // ~6.5 s from full to empty
      p.sprintRegenDelay=.9;
    }else{
      p.sprintRegenDelay=Math.max(0,(p.sprintRegenDelay||0)-dt);
      if(p.sprintRegenDelay<=0)p.stamina=Math.min(p.staminaMax||100,(p.stamina||0)+18*dt);
    }
    p.sprinting=wantsSprint&&p.stamina>0;
    movePlayerWithCollision(room,p,dx,dy,dt);
    p.dir=norm(p.input.ax,p.input.ay);
    if(p.input.shoot)shoot(room,p);

    if(dist(p,room.core)<room.core.light*.58){
      p.hp=Math.min(p.maxHp,p.hp+room.core.heal*dt);
    }

    // Boss loot is picked up automatically to keep controls simple.
    pickupLoot(room,p);
  }

  const ps=[...room.players.values()];
  for(const down of ps){
    if(!down.downed)continue;
    const helper=ps.find(p=>!p.downed&&p.id!==down.id&&dist(p,down)<76);
    if(helper){
      const mult=1+skillValue(helper,"medic")/100+(helper.character==="cqc"?.10:0);
      down.revive+=dt*mult;
      if(down.revive>=2.5){
        down.downed=false;
        down.hp=Math.max(55,down.maxHp*.5);
        down.revive=0;
        down.lastDeathCause=null;
        send(down.ws,"revived");
      }
    }else down.revive=Math.max(0,down.revive-dt*1.2);
  }

  for(const p of ps){
    if(p.downed||!p.equippedPet)continue;
    p.petState=p.petState||blankPetState();
    const petPos=petWorldPos(p);
    if(p.equippedPet==="panda"){
      if(p.petState.healCd<=0&&p.hp/p.maxHp<=.35){const heal=Math.round(p.maxHp*.30);p.hp=Math.min(p.maxHp,p.hp+heal);p.petState.healCd=40;send(p.ws,"notice",{text:`🐼 Panda: +${heal} HP`});addEffect(room,{type:"petHeal",x:petPos.x,y:petPos.y,r:52,life:.35});}
      if(p.petState.attackCd<=0){
        const ts=room.zombies.filter(z=>z.hp>0&&Math.hypot(z.x-petPos.x,z.y-petPos.y)<440).sort((a,b)=>Math.hypot(a.x-petPos.x,a.y-petPos.y)-Math.hypot(b.x-petPos.x,b.y-petPos.y)).slice(0,3);
        if(ts.length){
          for(const z of ts){
            addEffect(room,{type:"bamboo",projectile:true,owner:p.id,targetId:z.id,x:petPos.x,y:petPos.y,x2:z.x,y2:z.y,speed:720,damage:45+room.wave*1.5,life:1.35,maxLife:1.35});
          }
          p.petState.attackCd=15;
        }
      }
    }
    if(p.equippedPet==="cat"){
      if(p.petState.healCd<=0&&p.hp/p.maxHp<=.65){const heal=Math.round(p.maxHp*.20);p.hp=Math.min(p.maxHp,p.hp+heal);p.petState.healCd=30;send(p.ws,"notice",{text:`🐱 Uiai Cat: +${heal} HP`});addEffect(room,{type:"petHeal",x:petPos.x,y:petPos.y,r:48,life:.35});}
      if(p.petState.attackCd<=0){const ts=room.zombies.filter(z=>!isMajorEnemyType(z.type)&&Math.hypot(z.x-petPos.x,z.y-petPos.y)<330&&z.hp/z.maxHp<=.12).sort((a,b)=>a.hp-b.hp).slice(0,2);if(ts.length){for(const z of ts){z.lastHit=p.id;addEffect(room,{type:"catPounce",x:petPos.x,y:petPos.y,x2:z.x,y2:z.y,r:34,life:.30,maxLife:.30});z.hp=0;}p.petState.attackCd=12;}}
    }
    if(p.equippedPet==="red_dragon"&&p.petState.attackCd<=0){
      const z=room.zombies.filter(z=>!isMajorEnemyType(z.type)&&Math.hypot(z.x-petPos.x,z.y-petPos.y)<500).sort((a,b)=>Math.hypot(a.x-petPos.x,a.y-petPos.y)-Math.hypot(b.x-petPos.x,b.y-petPos.y))[0];
      if(z){const raw=Math.min(220,Math.max(24,z.hp*.30)),dmg=damageZombie(z,raw,"fire");p.runStats.damage=(p.runStats.damage||0)+dmg;z.lastHit=p.id;z.burnTime=Math.max(z.burnTime,3);z.burnDps=Math.max(z.burnDps,10);z.burnOwner=p.id;z.burnSourceKind="pet";addEffect(room,{type:"dragonFire",x:petPos.x,y:petPos.y,x2:z.x,y2:z.y,life:.48,maxLife:.48});p.petState.attackCd=10;}
    }
    if(p.equippedPet==="axolotl"&&p.petState.healCd<=0&&p.hp/p.maxHp<=.80){const heal=Math.round(p.maxHp*.18);p.hp=Math.min(p.maxHp,p.hp+heal);p.petState.healCd=20;send(p.ws,"notice",{text:`🌸 Pink Axolotl: +${heal} HP`});addEffect(room,{type:"petHeal",x:petPos.x,y:petPos.y,r:54,life:.4});}
    if(p.equippedPet==="duck"){
      if(p.petState.attackCd<=0){const z=room.zombies.filter(z=>!isMajorEnemyType(z.type)&&Math.hypot(z.x-petPos.x,z.y-petPos.y)<540).sort((a,b)=>Math.hypot(a.x-petPos.x,a.y-petPos.y)-Math.hypot(b.x-petPos.x,b.y-petPos.y))[0];if(z){const dmg=Math.max(0,Math.min(z.hp-1,z.hp*.45));z.hp-=dmg;p.runStats.damage=(p.runStats.damage||0)+dmg;z.lastHit=p.id;addEffect(room,{type:"duckShot",x:petPos.x,y:petPos.y,x2:z.x,y2:z.y,life:.32,maxLife:.32});p.petState.attackCd=30;}}
      if(p.petState.healCd<=0&&p.hp/p.maxHp<=.75){const heal=Math.round(p.maxHp*.20);p.hp=Math.min(p.maxHp,p.hp+heal);p.petState.healCd=60;send(p.ws,"notice",{text:`🐥 Ducktive: +${heal} HP`});addEffect(room,{type:"petHeal",x:petPos.x,y:petPos.y,r:54,life:.4});}
    }
    if(p.equippedPet==="amethyst_fury"){
      if(p.petState.utilityCd<=0&&room.core.hp<room.core.maxHp){const heal=Math.max(60,Math.round(room.core.maxHp*.07));room.core.hp=Math.min(room.core.maxHp,room.core.hp+heal);p.petState.utilityCd=30;addEffect(room,{type:"amethystRepair",x:petPos.x,y:petPos.y,x2:room.core.x,y2:room.core.y,r:82,life:.55,maxLife:.55});}
      if(p.petState.attackCd<=0){const z=room.zombies.filter(z=>Math.hypot(z.x-petPos.x,z.y-petPos.y)<620).sort((a,b)=>Math.hypot(a.x-petPos.x,a.y-petPos.y)-Math.hypot(b.x-petPos.x,b.y-petPos.y))[0];if(z){const raw=isMajorEnemyType(z.type)?176:Math.min(420,110+room.wave*10),dmg=damageZombie(z,raw,"ranged");p.runStats.damage=(p.runStats.damage||0)+dmg;z.lastHit=p.id;addEffect(room,{type:"amethystBeam",x:petPos.x,y:petPos.y,x2:z.x,y2:z.y,life:.44,maxLife:.44});p.petState.attackCd=10;}}
    }
  }

  for(let i=room.bullets.length-1;i>=0;i--){
    const b=room.bullets[i];b.life-=dt;
    if(b.kind==="meleeFx"){if(b.life<=0)room.bullets.splice(i,1);continue;}
    b.x+=b.vx*dt;b.y+=b.vy*dt;b.hitIds=b.hitIds||[];
    let remove=false;
    for(const z of room.zombies){
      if(b.hitIds.includes(z.id))continue;
      if(Math.hypot(z.x-b.x,z.y-b.y)>=z.r+b.r)continue;
      const dealt=damageZombie(z,b.damage,"ranged");z.lastHit=b.owner;b.hitIds.push(z.id);
      const owner=[...room.players.values()].find(pp=>pp.id===b.owner);if(owner)owner.runStats.damage=(owner.runStats.damage||0)+dealt;
      if(b.kind==="frostTower"){z.slow=Math.max(z.slow,b.slowTime||1.4);addEffect(room,{type:"towerFrostHit",x:z.x,y:z.y,r:38,life:.24});}
      if(b.kind==="cannon")addEffect(room,{type:"cannonImpact",x:z.x,y:z.y,r:28,life:.18});
      if(b.kind==="bubble"){
        const soap=owner?.character==="soap",splashRadius=soap?135:115,splashMult=soap?.52:.42;
        for(const other of room.zombies){
          if(other.id===z.id)continue;const d=Math.hypot(other.x-z.x,other.y-z.y);
          if(d<splashRadius){const sd=damageZombie(other,b.damage*splashMult,"ranged");if(owner)owner.runStats.damage=(owner.runStats.damage||0)+sd;other.lastHit=b.owner;other.slow=Math.max(other.slow,.42);}
        }
        z.slow=Math.max(z.slow,.65);
      }
      if(b.chain&&Math.random()<b.chain){
        const chainTarget=room.zombies.filter(o=>o.id!==z.id&&!b.hitIds.includes(o.id)&&dist(o,z)<145).sort((a,c)=>dist(a,z)-dist(c,z))[0];
        if(chainTarget){const cd=damageZombie(chainTarget,b.damage*.48,"ranged");if(owner)owner.runStats.damage=(owner.runStats.damage||0)+cd;chainTarget.lastHit=b.owner;addEffect(room,{type:"legendaryChain",x:z.x,y:z.y,x2:chainTarget.x,y2:chainTarget.y,life:.18});}
      }
      if((b.pierce||0)>0){b.pierce--;b.damage*=.82;}else remove=true;
      break;
    }
    if(remove||b.life<=0)room.bullets.splice(i,1);
  }

  const defensePetMult=[...room.players.values()].some(pp=>pp.equippedPet==="axolotl")?1.35:1;
  for(const s of room.structures){
    s.jam=Math.max(0,(s.jam||0)-dt);
    if(isTowerType(s.type)){
      s.cooldown=Math.max(0,s.cooldown-dt);
      s.stun=Math.max(0,(s.stun||0)-dt);
    }
    const comboOwner=structureOwner(room,s);
    const towerMult=(room.core?.turret||1)*(s.power||1)*defensePetMult*comboDamageMultiplier(comboOwner);
    if(s.type==="cannon"&&s.stun<=0&&s.jam<=0&&s.cooldown<=0){
      let t=null,best=520;
      for(const z of room.zombies){const d=dist(s,z);if(d<best){best=d;t=z;}}
      if(t){const n=norm(t.x-s.x,t.y-s.y),owner=structureOwner(room,s);room.bullets.push({id:id(),kind:"cannon",x:s.x+n.x*31,y:s.y+n.y*31,vx:n.x*650,vy:n.y*650,r:7,life:1.05,damage:34*towerMult,owner:owner?.id||0,pierce:4});s.cooldown=1.25;addEffect(room,{type:"cannonMuzzle",x:s.x+n.x*34,y:s.y+n.y*34,r:22,life:.16});}
    }
    if(s.type==="tesla"&&s.stun<=0&&s.jam<=0&&s.cooldown<=0){
      let first=null,best=400;
      for(const z of room.zombies){const d=dist(s,z);if(d<best){best=d;first=z;}}
      if(first){let from={x:s.x,y:s.y},cur=first,dmg=18*towerMult;const hit=new Set();for(let chain=0;chain<4&&cur;chain++){const dealt=damageZombie(cur,dmg,"ranged");creditStructureHit(room,s,cur,dealt);cur.slow=Math.max(cur.slow,.16);addEffect(room,{type:"towerLightning",x:from.x,y:from.y,x2:cur.x,y2:cur.y,life:.20,maxLife:.20});hit.add(cur.id);from=cur;dmg*=.72;cur=room.zombies.filter(z=>!hit.has(z.id)&&dist(z,from)<155).sort((a,b)=>dist(a,from)-dist(b,from))[0]||null;}s.cooldown=.72;}
    }
    if(s.type==="cat_tower"&&s.stun<=0&&s.jam<=0&&s.cooldown<=0){
      let t=null,best=125;for(const z of room.zombies){const d=dist(s,z);if(d<best){best=d;t=z;}}
      if(t){const dealt=damageZombie(t,28*towerMult,"melee");creditStructureHit(room,s,t,dealt);addEffect(room,{type:"towerCatPaw",x:s.x,y:s.y,x2:t.x,y2:t.y,life:.24,maxLife:.24});s.cooldown=.56;}
    }
    if(s.type==="frost_tower"&&s.stun<=0&&s.jam<=0&&s.cooldown<=0){
      let t=null,best=430;for(const z of room.zombies){const d=dist(s,z);if(d<best){best=d;t=z;}}
      if(t){const n=norm(t.x-s.x,t.y-s.y),owner=structureOwner(room,s);room.bullets.push({id:id(),kind:"frostTower",x:s.x+n.x*27,y:s.y+n.y*27,vx:n.x*560,vy:n.y*560,r:5,life:1.05,damage:13*towerMult,owner:owner?.id||0,slowTime:1.55});s.cooldown=.88;}
    }
    if(s.type==="flame_tower"&&s.stun<=0&&s.jam<=0&&s.cooldown<=0){
      const targets=room.zombies.filter(z=>dist(s,z)<185).sort((a,b)=>dist(s,a)-dist(s,b)).slice(0,6);
      if(targets.length){const owner=structureOwner(room,s);for(const z of targets){const dealt=damageZombie(z,8.5*towerMult,"fire");creditStructureHit(room,s,z,dealt);z.burnTime=Math.max(z.burnTime,2.4);z.burnDps=Math.max(z.burnDps,3.5*towerMult);z.burnOwner=owner?.id||0;z.burnSourceKind="tower";}const t=targets[0],n=norm(t.x-s.x,t.y-s.y);addEffect(room,{type:"towerFlame",x:s.x+n.x*24,y:s.y+n.y*24,x2:t.x,y2:t.y,r:185,life:.26,maxLife:.26});s.cooldown=.42;}
    }
    if(s.type==="spikes"){
      s.cooldown=Math.max(0,s.cooldown-dt);
      if(s.jam<=0&&s.cooldown<=0){
        let any=false;
        for(const z of room.zombies){
          if(dist(s,z)<s.r+z.r+9){const dealt=damageZombie(z,15*(s.power||1)*defensePetMult*comboDamageMultiplier(comboOwner),"melee");creditStructureHit(room,s,z,dealt);z.slow=.5;any=true;}
        }
        if(any)s.cooldown=.4;
      }
    }
  }

  for(let i=room.zombies.length-1;i>=0;i--){
    const z=room.zombies[i];
    z.specialCd=Math.max(0,(z.specialCd||0)-dt);z.slow=Math.max(0,z.slow-dt);
    if(z.regenPerSec>0&&z.hp>0&&z.hp<z.maxHp)z.hp=Math.min(z.maxHp,z.hp+z.regenPerSec*dt);
    if(z.burnTime>0){z.burnTime-=dt;const bd=damageZombie(z,z.burnDps*dt,z.burnSourceKind==="melee"?"melee":"pet");const owner=[...room.players.values()].find(pp=>pp.id===z.burnOwner);if(owner)owner.runStats.damage=(owner.runStats.damage||0)+bd;if(z.burnOwner)z.lastHit=z.burnOwner;}

    if(z.hp<=0){
      const killer=[...room.players.values()].find(p=>p.id===z.lastHit);
      for(const p of room.players.values())addXp(p,z.xp);
      if(killer){
        killer.score++;bumpStat(killer,"kills",1);tutorialEvent(killer,"kill");registerKillCombo(killer,z);killer.lifetime.kills=(killer.lifetime.kills||0)+1;
        if(z.type==="orc")killer.lifetime.orcKills=(killer.lifetime.orcKills||0)+1;
        if(isBossType(z.type)){killer.lifetime.bossKills=(killer.lifetime.bossKills||0)+1;if(!z.nonMeleeDamage)unlockAchievement(killer,"meleeBoss");}
        const bonus=isBossType(z.type)?35:z.type==="titan"?10:Math.round(rand(1,4));killer.inventory.scrap+=bonus;checkAchievements(killer,room);
      }
      if(z.type==="splitter"){
        for(let k=0;k<2;k++){const ch=spawnZombie(room,"runner",{x:z.x+(k?24:-24),y:z.y+rand(-18,18)});if(ch){ch.maxHp*=.46;ch.hp=ch.maxHp;ch.dmg*=.72;ch.r=13;ch.xp=8;ch.eliteMods=[];}}
      }
      if(z.floorAffix==="toxic"){
        for(const p of room.players.values())if(!p.downed&&dist(z,p)<92)inflictPoison(p,3.2,1.6+room.wave*.05);
        addEffect(room,{type:"acid",x:z.x-22,y:z.y-18,x2:z.x+22,y2:z.y+18,life:.28});
      }
      if(z.floorAffix==="lava"){
        for(const p of room.players.values())if(!p.downed&&dist(z,p)<84)inflictBurn(p,2.8,2.1+room.wave*.05);
        addEffect(room,{type:"explosion",x:z.x,y:z.y,r:72,life:.24});
      }
      if(z.cursed){for(const p of room.players.values())if(!p.downed&&dist(z,p)<120)damagePlayer(p,18+room.wave*.25,"cursed");addEffect(room,{type:"cursedBurst",x:z.x,y:z.y,r:120,life:.42});}
      if(isBossType(z.type))spawnBossLoot(room,z);
      room.zombies.splice(i,1);continue;
    }

    z.attackCd=Math.max(0,z.attackCd-dt);
    miniBossLogic(room,z,dt);
    bossLogic(room,z,dt);

    let auraSpeed=1,auraDmg=1;
    if(z.type!=="shaman"){
      for(const sh of room.zombies){
        if(sh.id===z.id||sh.hp<=0)continue;
        if(sh.type==="shaman"&&dist(z,sh)<255){auraSpeed*=1.18;auraDmg*=1.18;break;}
        if(sh.commander&&dist(z,sh)<245){auraSpeed*=1.12;auraDmg*=1.14;break;}
        if(sh.floorAffix==="arcane"&&dist(z,sh)<220){auraSpeed*=1.06;auraDmg*=1.08;break;}
        if(sh.floorAffix==="royal"&&dist(z,sh)<255){auraSpeed*=1.08;auraDmg*=1.10;break;}
      }
    }

    const target=nearestTarget(room,z);if(!target)continue;
    if(z.floorAffix==="arcane"&&z.specialCd<=0){
      const tp=targetPlayer(room,z,"nearest");
      if(tp&&!tp.downed&&dist(z,tp)<340){
        damagePlayer(tp,7+room.wave*.30,"arcane");
        tp.slowMoveTimer=Math.max(tp.slowMoveTimer||0,.9);
        addEffect(room,{type:"amethystBeam",x:z.x,y:z.y,x2:tp.x,y2:tp.y,life:.28,maxLife:.28});
        for(const ally of room.zombies)if(ally.id!==z.id&&ally.hp>0&&dist(z,ally)<175)ally.attackCd=Math.max(0,(ally.attackCd||0)-.12);
        z.specialCd=4.2;
      }
    }
    let d=zombieTargetDistance(z,target,room);const touchRange=4;

    if(z.type==="spitter"&&d<390&&d>touchRange+35){if(z.attackCd<=0){z.attackCd=1.65;damageTarget(room,target,z.dmg*.85*auraDmg,"spitter");applyFloorMutationHit(room,z,target);addEffect(room,{type:"acid",x:z.x,y:z.y,x2:target.x,y2:target.y,life:.28});}continue;}

    if(z.type==="bomber"){
      if(d<touchRange+24){z.fuse=(z.fuse||0)+dt;if(z.fuse>=1.75){const boomR=155;if(dist(z,room.core)<boomR+room.core.r)damageCore(room,88+room.wave*3);for(const p of room.players.values())if(!p.downed&&dist(z,p)<boomR)damagePlayer(p,28+room.wave*.8,"bomber");for(const st of room.structures)if(dist(z,st)<boomR)st.hp-=90+room.wave*3;addEffect(room,{type:"explosion",x:z.x,y:z.y,r:boomR,life:.42});z.hp=0;z.lastHit=0;}continue;}else z.fuse=Math.max(0,(z.fuse||0)-dt*1.4);
    }

    if(z.type==="leaper"&&z.specialCd<=0&&d>100&&d<340){
      const n=norm(target.x-z.x,target.y-z.y),tx=z.x+n.x*105,ty=z.y+n.y*105;
      let blocked=false;
      for(const st of room.structures){
        if(!isWallType(st.type))continue;
        const [wa,wb]=wallEndpoints(st.x,st.y,st.rotation||0),ma={x:z.x,y:z.y},mb={x:tx,y:ty};
        if(segSegDistance(ma,mb,wa,wb)<z.r+WALL_HALF_THICK+2){blocked=true;break;}
      }
      if(!blocked&&!entityBlockedByWallsAt(room,z,tx,ty,{gatesSolid:true,towersSolid:true})){z.x=tx;z.y=ty;addEffect(room,{type:"leap",x:z.x,y:z.y,r:50,life:.25});}
      z.specialCd=4.0;d=zombieTargetDistance(z,target,room);
    }

    if(z.type==="sapper"&&d<275&&d>20){if(z.attackCd<=0){z.attackCd=2.4;damageTarget(room,target,32+room.wave*.65,"sapper");applyFloorMutationHit(room,z,target);addEffect(room,{type:"sapperCharge",x:z.x,y:z.y,x2:target.x,y2:target.y,life:.42});}continue;}

    if(z.type==="necromancer"&&z.specialCd<=0&&room.zombies.length<150){const ch=spawnZombie(room,"orc",{x:z.x+rand(-65,65),y:z.y+rand(-65,65)});if(ch){ch.maxHp*=.55;ch.hp=ch.maxHp;ch.xp=7;ch.eliteMods=[];addEffect(room,{type:"necro",x:z.x,y:z.y,r:85,life:.5});}z.specialCd=11.5;}

    if(z.type==="teleporter"&&z.specialCd<=0&&d>230){const n=norm(target.x-z.x,target.y-z.y),tx=z.x+n.x*105,ty=z.y+n.y*105;const blocked=!!entityBlockedByWallsAt(room,z,tx,ty,{gatesSolid:true,towersSolid:true});if(!blocked){z.x=tx;z.y=ty;addEffect(room,{type:"shadowBlink",x:z.x,y:z.y,r:65,life:.28});}z.specialCd=6.4;}

    if(z.type==="parasite"&&d<=touchRange+10){if(z.attackCd<=0){z.attackCd=.9;damageTarget(room,target,z.dmg*.6,"parasite");applyFloorMutationHit(room,z,target);if(target!==room.core)target.jam=Math.max(target.jam||0,2.5);}continue;}

    if(z.type==="titan"&&d<touchRange+18){if(z.attackCd<=0){z.attackCd=2.05;damageTarget(room,target,z.dmg*auraDmg,z.type);applyFloorMutationHit(room,z,target);for(const st of room.structures){if(dist(z,st)<120){st.hp-=z.dmg*.45;if(isTowerType(st.type))st.stun=Math.max(st.stun||0,1.8);}}for(const p of room.players.values())if(!p.downed&&dist(z,p)<112)damagePlayer(p,15+room.wave*.35,"titan");addEffect(room,{type:"slam",x:z.x,y:z.y,r:122,life:.38});}continue;}

    if(d<=touchRange){
      if(z.attackCd<=0){
        z.attackCd=z.type==="runner"?.62:isBossType(z.type)?.70:.9;damageTarget(room,target,z.dmg*auraDmg,z.type);applyFloorMutationHit(room,z,target);
        if(z.type==="frost"){
          for(const p of room.players.values())if(p===target)p.slowMoveTimer=Math.max(p.slowMoveTimer||0,2.5);
          if(target!==room.core&&isTowerType(target.type))target.stun=Math.max(target.stun||0,2.3);
          addEffect(room,{type:"frostHit",x:z.x,y:z.y,r:55,life:.28});
        }
      }
    }else{
      const n=norm(target.x-z.x,target.y-z.y),slow=z.slow>0?.60:1;
      moveZombieWithCollision(room,z,n.x*z.speed*slow*auraSpeed*dt,n.y*z.speed*slow*auraSpeed*dt);
    }
  }

  for(let i=room.effects.length-1;i>=0;i--){
    const e=room.effects[i];
    if(e.type==="bamboo"&&e.projectile){
      const target=room.zombies.find(z=>z.id===e.targetId&&z.hp>0);
      if(!target){room.effects.splice(i,1);continue;}
      e.x2=target.x;e.y2=target.y;
      const dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy),step=(e.speed||720)*dt;
      if(d<=step+target.r+6){
        const owner=[...room.players.values()].find(pp=>pp.id===e.owner);
        const dealt=damageZombie(target,e.damage||0,"pet");
        if(owner){owner.runStats.damage=(owner.runStats.damage||0)+dealt;target.lastHit=owner.id;}
        addEffect(room,{type:"bambooImpact",x:target.x,y:target.y,r:34,life:.22});
        room.effects.splice(i,1);continue;
      }
      const n=norm(dx,dy);e.x+=n.x*step;e.y+=n.y*step;
    }
    if(e.type==="bossRock"&&e.projectile){
      const dx=e.x2-e.x,dy=e.y2-e.y,d=Math.hypot(dx,dy),step=(e.speed||560)*dt;
      if(d<=step+5){
        const ix=e.x2,iy=e.y2,impact=Math.max(24,e.impactRadius||48);
        for(const pp of room.players.values()){
          if(!pp.downed&&Math.hypot(pp.x-ix,pp.y-iy)<=impact+pp.r)damagePlayer(pp,e.damage||0,e.cause||"boss_stone");
        }
        addEffect(room,{type:"bossRockImpact",x:ix,y:iy,r:impact,life:.32,maxLife:.32});
        room.effects.splice(i,1);continue;
      }
      const n=norm(dx,dy);e.x+=n.x*step;e.y+=n.y*step;
    }
    e.life-=dt;
    if(e.life<=0)room.effects.splice(i,1);
  }

  room.structures=room.structures.filter(s=>s.hp>0);
  for(let i=room.loot.length-1;i>=0;i--){
    room.loot[i].life-=dt;
    if(room.loot[i].life<=0)room.loot.splice(i,1);
  }

  if(room.core.hp<=0||(ps.length&&ps.every(p=>p.downed))){
    room.started=false;room.paused=false;room.phase="gameover";
    const reason=room.core.hp<=0?"core":"team";
    for(const p of room.players.values()){
      p.input={up:false,down:false,left:false,right:false,sprint:false,shoot:false,ax:0,ay:0};
      p.bestWave=Math.max(p.bestWave,room.wave);
      const cause=reason==="team"?(p.lastDeathCause||"unknown"):"core";
      const stats=recordRun(p,room,reason);
      send(p.ws,"gameOver",{wave:room.wave,reason,cause,stats});
    }
  }
}

function safePlayer(p){
  return {
    id:p.id,slot:p.slot,name:p.name,character:p.character,x:p.x,y:p.y,r:p.r,speed:p.speed,dir:p.dir,
    hp:p.hp,maxHp:p.maxHp,downed:p.downed,revive:p.revive,lastDeathCause:p.lastDeathCause,weapon:p.weapon,
    weaponAmmo:p.weaponAmmo?{...p.weaponAmmo}:freshWeaponAmmo(p.weapon?.type||"pistol",p.bubbleAmmo??60,p.weapon?.rarity||"common"),petState:p.petState?{...p.petState}:blankPetState(),
    inventory:p.inventory,score:p.score,xp:p.xp,level:p.level,nextXp:p.nextXp,
    skillPoints:p.skillPoints,skills:p.skills,discoveredEnemies:p.discoveredEnemies||{},bestWave:p.bestWave,
    bubbleAmmo:p.bubbleAmmo,bubbleAmmoMax:p.bubbleAmmoMax,bubbleRecharge:p.bubbleRecharge,
    silver:p.silver||0,gold:p.gold||0,petsOwned:normalizePetsOwned(p.petsOwned),equippedPet:p.equippedPet||null,
    runBonuses:p.runBonuses||{damage:0,speed:0},selectedTitle:p.selectedTitle||"Новичок",runStats:p.runStats||{},
    slowMoveTimer:p.slowMoveTimer||0,crateTokens:p.crateTokens||0,
    poisonTime:p.poisonTime||0,burnTime:p.burnTime||0,weaponLevel:p.weaponLevel||1,multitoolLevel:p.multitoolLevel||1,
    comboCount:p.comboCount||0,comboTimer:p.comboTimer||0,comboBest:p.comboBest||0,comboTier:comboTierFor(p.comboCount||0),
    stamina:Number.isFinite(p.stamina)?p.stamina:100,staminaMax:p.staminaMax||100,sprinting:!!p.sprinting,
    petX:Number.isFinite(p.petX)?p.petX:null,petY:Number.isFinite(p.petY)?p.petY:null
  };
}
function serializeFor(room,p){
  const near=o=>Math.abs(o.x-p.x)<VIEW_RADIUS&&Math.abs(o.y-p.y)<VIEW_RADIUS;
  const major=room.zombies.find(z=>isBossType(z.type))||room.zombies.find(z=>isMiniBossType(z.type))||null;

  const breakdown={};
  for(const z of room.zombies)breakdown[z.type]=(breakdown[z.type]||0)+1;
  for(const type of room.spawnQueue)breakdown[type]=(breakdown[type]||0)+1;

  return {
    code:room.code,mode:room.mode,hostId:room.hostId,world:WORLD,started:room.started,paused:room.paused,wave:room.wave,phase:room.phase,elapsed:room.elapsed,qaAdminEnabled:QA_ADMIN_ENABLED,buildVersion:BUILD_VERSION,
    floorStage:floorStageForRoom(room),flawless:room.phase==="night" && room.waveCoreDamageStart!=null && (room.runCoreDamage||0)===room.waveCoreDamageStart,
    phaseTimer:room.phaseTimer,core:room.core,
    nightModifier:room.nightModifier?{id:room.nightModifier.id,name:room.nightModifier.name,reward:room.nightModifier.reward,repair:room.nightModifier.repair,light:room.nightModifier.light}:null,
    modifierOffer:room.modifierOffer?{id:room.modifierOffer.id,name:room.modifierOffer.name,reward:room.modifierOffer.reward,votes:room.modifierVotes?.size||0,needed:Math.max(1,room.players.size),voted:!!room.modifierVotes?.has(p.id),accepted:!!room.acceptedModifier}:null,
    eventText:room.eventTimer>0?room.eventText:"",
    majorEnemy:major?{id:major.id,type:major.type,x:major.x,y:major.y,r:major.r,hp:major.hp,maxHp:major.maxHp,floorAffix:major.floorAffix||null}:null,
    playerCount:room.players.size,
    waveTotal:room.waveTotal||0,
    zombiesRemaining:room.zombies.length+room.spawnQueue.length,
    zombieBreakdown:breakdown,
    structureMaxLevel:STRUCTURE_MAX_LEVEL,
    nextCoreCost:room.core.level<5?CORE_UPGRADES[room.core.level]?.cost:null,
    nextBuildCosts:nextBuildEconomy(room).costs,
    structureCounts:nextBuildEconomy(room).counts,
    structureLimits:nextBuildEconomy(room).limits,
    players:[...room.players.values()].map(safePlayer),
    zombies:room.zombies.filter(near),
    bullets:room.bullets.filter(near),
    effects:room.effects.filter(e=>{
      const ex=Number.isFinite(e.x)?e.x:e.x2;
      const ey=Number.isFinite(e.y)?e.y:e.y2;
      return Math.abs(ex-p.x)<VIEW_RADIUS&&Math.abs(ey-p.y)<VIEW_RADIUS;
    }),
    structures:room.structures.filter(near),
    resources:room.resources.filter(o=>o.alive&&near(o)),
    loot:room.loot.filter(near)
  };
}

const server=http.createServer((req,res)=>{
  let url=req.url.split("?")[0];
  if(url==="/")url="/index.html";
  const file=path.join(PUBLIC,path.normalize(url).replace(/^(\.\.[\/\\])+/, ""));
  if(!file.startsWith(PUBLIC)){res.writeHead(403);return res.end("Forbidden");}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);return res.end("Not found");}
    const ext=path.extname(file);
    const types={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"application/javascript; charset=utf-8",".png":"image/png",".wav":"audio/wav",".gif":"image/gif"};
    res.writeHead(200,{"Content-Type":types[ext]||"application/octet-stream"});
    res.end(data);
  });
});

function detachPlayerFromRoom(room,p){
  if(!room||!p)return;
  saveProgress(p);
  activeProfiles.delete(p.profile);
  room.players.delete(p.id);
  if(room.modifierVotes)room.modifierVotes.delete(p.id);
  updateModifierAcceptance(room);
  if(room.hostId===p.id){
    room.hostId=room.players.size?[...room.players.values()][0].id:null;
  }
  broadcast(room,"roster",{hostId:room.hostId,mode:room.mode,players:[...room.players.values()].map(safePlayer)});
  if(room.players.size===0){
    rooms.delete(room.code);
  }
}

function randomRoomCode(){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for(let tries=0;tries<100;tries++){
    let code="";
    for(let i=0;i<6;i++)code+=chars[Math.floor(Math.random()*chars.length)];
    if(!rooms.has(code))return code;
  }
  return String(Date.now()).slice(-8);
}

const wss=new WebSocketServer({server,maxPayload:WS_MAX_PAYLOAD,perMessageDeflate:false});
wss.on("error",err=>console.error("WebSocket server error:",err?.message||err));
wss.on("connection",ws=>{
  let room=null,p=null,account=null,sessionHash=null;
  let msgWindowStart=Date.now(),msgCount=0;
  function allowMessage(){
    const now=Date.now();
    if(now-msgWindowStart>=1000){msgWindowStart=now;msgCount=0;}
    msgCount++;
    if(msgCount<=WS_MAX_MESSAGES_PER_SEC)return true;
    try{ws.close(1008,"Too many messages");}catch{}
    return false;
  }

  function attachPlayer(targetRoom,m){
    if(p)return send(ws,"error",{message:"Вы уже находитесь в комнате"});
    if(targetRoom.started)return send(ws,"error",{message:"В этой комнате уже идёт забег"});
    if(targetRoom.mode==="solo"&&targetRoom.players.size>0)return send(ws,"error",{message:"Это одиночная комната"});
    if(targetRoom.players.size>=2)return send(ws,"error",{message:"В комнате уже два игрока"});

    if(!account)return send(ws,"authRequired",{message:"Сначала войдите в аккаунт"});
    const profileKey=account.username;
    if(activeProfiles.has(profileKey)){
      return send(ws,"error",{message:"Этот аккаунт уже используется в другой комнате"});
    }

    const used=new Set([...targetRoom.players.values()].map(x=>x.slot));
    const slot=used.has(1)?2:1;
    p=makePlayer(ws,account.displayName,profileKey,slot,m.character);
    p.account=account;
    activeProfiles.add(p.profile);

    room=targetRoom;
    room.players.set(p.id,p);
    if(!room.hostId)room.hostId=p.id;

    send(ws,"joined",{
      playerId:p.id,slot,code:room.code,
      isHost:p.id===room.hostId,
      mode:room.mode
    });
    broadcast(room,"roster",{
      hostId:room.hostId,
      mode:room.mode,
      players:[...room.players.values()].map(safePlayer)
    });
    sendMeta(ws,p);sendTutorialState(p);
  }

  ws.on("message",raw=>{
    if(!allowMessage())return;
    let m;
    try{m=JSON.parse(String(raw));}catch{return;}
    if(!m||typeof m!=="object"||Array.isArray(m))return;
    m.type=String(m.type||"").slice(0,48);
    if(m.type==="clientPing"){send(ws,"clientPong",{sentAt:Number(m.sentAt)||Date.now()});return;}

    if(m.type==="register"){
      if(account)return send(ws,"authError",{message:"Вы уже вошли"});
      const result=registerAccount(m.username,m.password,m.displayName);
      if(result.error)return send(ws,"authError",{message:result.error});
      account=result.account;const session=issueAccountSession(account);sessionHash=hashSessionToken(session.token);
      const target=loadMetaTarget(account.username,account);
      send(ws,"authSuccess",{account:publicAccountSnapshot(account,target),starterGift:!!result.starterGift,session});sendMeta(ws,target);return;
    }
    if(m.type==="login"){
      if(account)return send(ws,"authError",{message:"Вы уже вошли"});
      const found=authenticateAccount(m.username,m.password);
      if(!found)return send(ws,"authError",{message:"Неверный логин или пароль"});
      account=found;const session=issueAccountSession(account);sessionHash=hashSessionToken(session.token);const target=loadMetaTarget(account.username,account);
      send(ws,"authSuccess",{account:publicAccountSnapshot(account,target),session});sendMeta(ws,target);return;
    }
    if(m.type==="resumeSession"){
      if(account)return;
      const found=authenticateAccountSession(m.token);
      if(!found)return send(ws,"sessionInvalid");
      account=found.account;sessionHash=found.hash;const target=loadMetaTarget(account.username,account);
      send(ws,"authSuccess",{account:publicAccountSnapshot(account,target),resumed:true});sendMeta(ws,target);return;
    }
    if(m.type==="logout"){
      if(p||room)return send(ws,"notice",{text:"Сначала выйдите из комнаты"});
      revokeAccountSession(account,sessionHash);account=null;sessionHash=null;send(ws,"loggedOut");return;
    }
    if(!account)return send(ws,"authRequired",{message:"Сначала зарегистрируйтесь или войдите"});
    if(m.type==="renameAccount"){
      const next=cleanDisplayName(m.displayName);
      if(next.length<2)return send(ws,"accountError",{message:"Имя слишком короткое"});
      if(Date.now()<(account.renameAvailableAt||0))return send(ws,"accountError",{message:"Имя пока нельзя менять повторно"});
      if(accountNameTaken(next,account.username))return send(ws,"accountError",{message:"Такое имя уже занято"});
      account.displayName=next;account.renameAvailableAt=Date.now()+RENAME_COOLDOWN_MS;saveAccounts();
      send(ws,"accountState",{account:publicAccountSnapshot(account,loadProgress(account.username))});return;
    }
    if(m.type==="completeLobbyTour"){account.onboarding.lobbyTourDone=true;saveAccounts();send(ws,"accountState",{account:publicAccountSnapshot(account,loadProgress(account.username))});return;}
    if(m.type==="ackWhatsNew"){account.onboarding.whatsNewSeen=true;saveAccounts();send(ws,"accountState",{account:publicAccountSnapshot(account,loadProgress(account.username))});return;}
    if(m.type==="skipRunTutorial"){account.onboarding.runTutorialDone=true;account.tutorial={active:false,step:5,kills:0};saveAccounts();send(ws,"accountState",{account:publicAccountSnapshot(account,loadProgress(account.username))});if(p)sendTutorialState(p);return;}

    if(m.type==="getMeta"){
      const profile=p?.profile||account.username;
      const target=p||loadMetaTarget(profile,account);sendMeta(ws,target);return;
    }
    if(["metaShopBuy","metaUpgradeBuy","metaQuestClaim","metaCrateOpen","metaCrateSkip","metaEquipPet","metaUnlockClass","metaSelectTitle","metaAchievementClaim"].includes(m.type)){
      const profile=p?.profile||account.username;
      if(!p&&activeProfiles.has(profile))return send(ws,"notice",{text:"Этот аккаунт сейчас используется в активном забеге"});
      const target=p||loadMetaTarget(profile,account);let ok=false;
      const features=featureUnlocksFor(account,target);
      if((m.type==="metaUpgradeBuy"&&!features.upgrades)||(["metaCrateOpen","metaCrateSkip"].includes(m.type)&&!features.crates)||(m.type==="metaEquipPet"&&!features.pets)||(m.type==="metaAchievementClaim"&&!features.achievements)){send(ws,"notice",{text:"Эта функция штаба ещё не открыта"});sendMeta(ws,target);return;}
      if(m.type==="metaShopBuy")ok=lobbyShopBuy(target,String(m.item||""));
      if(m.type==="metaUpgradeBuy")ok=lobbyUpgradeBuy(target,String(m.key||""));
      if(m.type==="metaQuestClaim")ok=claimMetaQuest(target,String(m.id||""));
      if(m.type==="metaEquipPet"){
        if(p&&room?.started){send(ws,"notice",{text:"Питомца можно менять только в лобби между забегами"});sendMeta(ws,target);return;}
        ok=equipMetaPet(target,m.petId||null);
      }
      if(m.type==="metaUnlockClass")ok=unlockMetaClass(target,String(m.classId||""));
      if(m.type==="metaSelectTitle")ok=selectMetaTitle(target,String(m.title||""));
      if(m.type==="metaAchievementClaim")ok=claimAchievement(target,String(m.id||""));
      if(m.type==="metaCrateSkip")ok=skipMetaCrateCooldown(target);
      if(m.type==="metaCrateOpen"){
        const result=openMetaCrate(target);
        ok=!!result&&!result.error;
        if(ok)send(ws,"crateOpened",{pet:result.pet,reel:result.reel,usedToken:result.usedToken,meta:metaSnapshot(target)});
        else if(result?.error==="cooldown")send(ws,"crateCooldown",{remaining:result.remaining});
        else send(ws,"notice",{text:"Нужно 50 золотых монет или золотой жетон ящика"});
      }
      if(!ok&&m.type!=="metaCrateOpen")send(ws,"notice",{text:"Действие недоступно: проверь валюту или условия"});
      sendMeta(ws,target);return;
    }

    if(m.type==="createRoom"){
      if(p)return send(ws,"error",{message:"Вы уже находитесь в комнате"});
      const mode=m.mode==="solo"?"solo":"duo";
      const code=randomRoomCode();
      const created=makeRoom(code,mode);
      rooms.set(code,created);
      attachPlayer(created,m);
      return;
    }

    if(m.type==="join"){
      if(p)return send(ws,"error",{message:"Вы уже находитесь в комнате"});
      const code=sanitizeRoom(m.room);
      if(!code)return send(ws,"error",{message:"Введите код комнаты"});
      const target=rooms.get(code);
      if(!target)return send(ws,"error",{message:"Комната с таким кодом не найдена"});
      if(target.mode==="solo")return send(ws,"error",{message:"К этой комнате нельзя присоединиться"});
      attachPlayer(target,m);
      return;
    }

    if(!room||!p)return;

    if(m.type==="leaveToLobby"){
      const oldRoom=room,oldPlayer=p;
      detachPlayerFromRoom(oldRoom,oldPlayer);
      room=null;p=null;
      send(ws,"returnedToLobby");
      return;
    }

    if(m.type==="start"){
      if(room.started)return;
      if(p.id!==room.hostId)return send(ws,"notice",{text:"Игру запускает создатель комнаты"});
      if(room.mode==="duo"&&room.players.size<2)return send(ws,"notice",{text:"Для кооперативного лобби нужен второй игрок. Для игры одному выберите SOLO."});

      room.started=true;room.paused=false;room.nightModifier=null;room.modifierOffer=null;room.acceptedModifier=null;room.modifierVotes=new Set();
      room.wave=0;room.zombies=[];room.bullets=[];room.effects=[];room.spawnQueue=[];room.structures=[];room.loot=[];room.runCoreDamage=0;
      room.core={id:room.core.id,x:WORLD.cx,y:WORLD.cy,r:74,level:1,hp:1200,maxHp:1200,heal:.5,turret:1,light:260};

      for(const x of room.players.values()){
        resetRunProgress(x);
        x.x=WORLD.cx+(x.slot===1?-150:150);
        x.y=WORLD.cy;
      }
      startDay(room,true);
      return;
    }

    if(m.type==="restartRun"){
      if(room.mode!=="solo"||room.started)return;
      room.started=true;room.paused=false;room.nightModifier=null;room.modifierOffer=null;room.acceptedModifier=null;room.modifierVotes=new Set();room.wave=0;room.zombies=[];room.bullets=[];room.effects=[];room.spawnQueue=[];room.structures=[];room.loot=[];room.runCoreDamage=0;
      room.core={id:room.core.id,x:WORLD.cx,y:WORLD.cy,r:74,level:1,hp:1200,maxHp:1200,heal:.5,turret:1,light:260};
      resetRunProgress(p);p.x=WORLD.cx-150;p.y=WORLD.cy;startDay(room,true);send(ws,"runRestarted");return;
    }

    if(m.type==="setPaused"){
      if(room.mode!=="solo")return send(ws,"notice",{text:"В кооперативе мир не ставится на паузу"});
      if(p.id!==room.hostId)return;
      room.paused=!!m.paused;
      p.input={up:false,down:false,left:false,right:false,sprint:false,shoot:false,ax:0,ay:0};
      send(ws,"pauseState",{paused:room.paused});
      return;
    }

    if(m.type==="voteModifier"){
      if(!room.started||room.phase!=="day"||!room.modifierOffer)return;
      room.modifierVotes=room.modifierVotes||new Set();
      if(m.accept===false)room.modifierVotes.delete(p.id);else room.modifierVotes.add(p.id);
      const accepted=updateModifierAcceptance(room);
      broadcast(room,"notice",{text:accepted?`Все согласились: ${room.modifierOffer.name}`:`Голос за риск: ${room.modifierVotes.size}/${Math.max(1,room.players.size)}`});
      return;
    }

    if(m.type==="skipPrep"){
      if(!room.started)return;
      if(p.id!==room.hostId)return send(ws,"notice",{text:"Скип подготовки доступен только создателю комнаты"});
      if(room.phase!=="day")return send(ws,"notice",{text:"Сначала добейте текущую волну"});
      room.phaseTimer=0;
      startWave(room);
      broadcast(room,"notice",{text:`Подготовка пропущена — начинается волна ${room.wave}`});
      return;
    }

    if(!room.started){
      // Absolutely no gameplay actions before the host presses START.
      if(["input","reload","harvest","repairStructure","pickup","build","buy","skill","coreUpgrade","coreRepair","structureUpgrade","structureRepair","structureRemove","useMedkit"].includes(m.type))return;
    }

    if(m.type==="reload"){startReload(p);return;}
    if(m.type==="input"){
      p.input={
        up:!!m.up,down:!!m.down,left:!!m.left,right:!!m.right,sprint:!!m.sprint,shoot:!!m.shoot,
        ax:safeAxis(m.ax),ay:safeAxis(m.ay)
      };
    }
    if(m.type==="harvest")harvest(room,p);
    if(m.type==="repairStructure")repairStructureWithTool(room,p);
    if(m.type==="pickup")pickupLoot(room,p);
    if(m.type==="build")build(room,p,m);
    if(m.type==="buy"){
      const item=String(m.item||"");
      const requestId=String(m.requestId||"").slice(0,64);
      const ok=buy(room,p,item);
      send(p.ws,"buyResult",{requestId,item,ok});
    }
    if(m.type==="runEquipmentUpgrade"){
      const kind=m.kind==="multitool"?"multitool":"weapon";
      const requestId=String(m.requestId||"").slice(0,64);
      const ok=upgradeRunEquipment(room,p,kind);
      send(p.ws,"equipmentUpgradeResult",{requestId,kind,ok});
    }
    if(m.type==="admin"){
      if(!QA_ADMIN_ENABLED)return send(ws,"notice",{text:"Админ-команды отключены в обычной сборке"});
      handleAdmin(room,p,m);return;
    }
    if(m.type==="skill")spendSkill(p,m.skill);
    if(m.type==="coreUpgrade")upgradeCore(room,p);
    if(m.type==="coreRepair")repairCore(room,p);
    if(m.type==="structureUpgrade")upgradeStructure(room,p,m.structureId);
    if(m.type==="structureRepair")repairSpecificStructure(room,p,m.structureId);
    if(m.type==="structureRemove")removeStructure(room,p,m.structureId);
    if(m.type==="useMedkit")useMedkit(p);
  });

  ws.on("close",()=>{
    if(room&&p)detachPlayerFromRoom(room,p);
  });
});

let simTimer=null,snapshotTimer=null,last=Date.now();
function startRuntime(){
  if(simTimer||server.listening)return;
  last=Date.now();
  simTimer=setInterval(()=>{
    const now=Date.now();
    const dt=Math.min(.05,(now-last)/1000);
    last=now;
    for(const room of rooms.values())updateRoom(room,dt);
  },1000/SIM_HZ);
  snapshotTimer=setInterval(()=>{
    for(const room of rooms.values()){
      for(const p of room.players.values())send(p.ws,"snapshot",{state:serializeFor(room,p)});
    }
  },1000/SNAPSHOT_HZ);
  server.listen(PORT,()=>console.log(`Night Shift Duo v${BUILD_VERSION}: http://localhost:${PORT}`));
}
function stopRuntime(){
  if(simTimer){clearInterval(simTimer);simTimer=null;}
  if(snapshotTimer){clearInterval(snapshotTimer);snapshotTimer=null;}
  if(server.listening)server.close();
}
server.on("error",err=>{
  if(err && err.code==="EADDRINUSE")console.error(`Port ${PORT} is already in use. Close the old Night Shift Duo server and try again.`);
  else console.error(err);
  if(require.main===module)process.exit(1);
});

module.exports={
  floorStageForWave,floorStageForRoom,floorMutationForWave,damageCore,BUILD_VERSION,WORLD,WEAPONS,SHOP,STRUCTURES,PETS,BOSS_BY_WAVE,MINI_BOSS_BY_WAVE,BOSS_GOLD_REWARDS,ZOMBIE_DEBUT,NIGHT_MODIFIERS,CLASS_COSTS,RUN_SHOP_RADIUS,
  makeRoom,makePlayer,startDay,startWave,spawnZombie,spawnBossLoot,updateRoom,serializeFor,turretShotDamage,safeAxis,
  movePlayerWithCollision,moveZombieWithCollision,entityBlockedByWallsAt,structureBuildCost,structureBuildLimit,activeStructureCount,buildBossLootBundle,comboTierFor,comboDamageMultiplier,comboMoveMultiplier,registerKillCombo,tickPlayerCombo,
  openMetaCrate,skipMetaCrateCooldown,weightedPetRoll,buildCrateReel,loadProgress,saveProgress,petWorldPos,damageZombie,
  resetRunProgress,startReload,finishReload,lobbyShopBuy,lobbyUpgradeBuy,claimMetaQuest,equipMetaPet,unlockMetaClass,selectMetaTitle,
  buy,upgradeRunEquipment,build,upgradeStructure,removeStructure,repairSpecificStructure,repairStructureWithTool,recordRun,unlockAchievement,claimAchievement,updateModifierAcceptance,bossLogic,miniBossLogic,
  QUEST_COOLDOWN_MS,QUEST_VARIANTS,refreshQuestCycleIfNeeded,
  startRuntime,stopRuntime,server,wss
};
if(require.main===module)startRuntime();
