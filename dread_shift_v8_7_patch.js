"use strict";
const fs=require("fs"),path=require("path");
const file=r=>path.join(__dirname,r),read=r=>fs.readFileSync(file(r),"utf8"),write=(r,s)=>fs.writeFileSync(file(r),s,"utf8");
function required(s,a,b,label){if(!s.includes(a))throw Error(`v8.7 target missing: ${label}`);return s.replace(a,b);}

function server(){let s=read("server.js");if(s.includes("/* DREAD SHIFT v8.7 server */"))return false;
  s=required(s,'const BUILD_VERSION = "8.6.3";','const BUILD_VERSION = "8.7.0";',"version");
  s=required(s,
`  return {shop:true,quests:true,profile:true,upgrades:lvl>=2||best>=1,achievements:lvl>=2||best>=1,history:lvl>=2||best>=1,crates:best>=3,pets:best>=3,index:known};`,
`  return {shop:lvl>=3,quests:lvl>=3,profile:true,upgrades:lvl>=3,achievements:lvl>=2||best>=1,history:lvl>=2||best>=1,crates:best>=3,pets:best>=3,index:known};`,"level 3 lobby gates");
  s=required(s,
`  gun_rate: {
    name:"Быстрые руки", max:5,
    values:[0,4,8,12,16,20],
    desc:"Скорострельность, %"
  },`,
`  gun_rate: {
    name:"Быстрые руки", max:5,
    values:[0,4,8,12,16,20],
    desc:"Скорострельность, %"
  },
  crit_chance: {
    name:"Точный расчёт", max:5,
    values:[0,2,4,6,8,10],
    desc:"Шанс критического выстрела сверх базовых 5%, максимум 15%"
  },
  crit_damage: {
    name:"Убойный патрон", max:4,
    values:[0,10,20,30,40],
    desc:"Критический урон сверх базовых 160%"
  },`,"critical skills");
  s=required(s,
`skills:{survivor_hp:0,survivor_speed:0,gun_damage:0,gun_rate:0,gather:0,builder:0,medic:0}`,
`skills:{survivor_hp:0,survivor_speed:0,gun_damage:0,gun_rate:0,crit_chance:0,crit_damage:0,gather:0,builder:0,medic:0}`,"default critical skills");
  s=required(s,
`  const critChance=rarityName==="epic"?.18:rarityName==="legendary"?.25:0;
  const critMult=1.55;`,
`  const critChance=Math.min(.15,.05+skillValue(p,"crit_chance")/100);
  const critMult=1.60+skillValue(p,"crit_damage")/100;`,"critical formula");
  s=required(s,
`      p.runStats.damage=(p.runStats.damage||0)+dealt;z.lastHit=p.id;z.slow=Math.max(z.slow,.12);`,
`      p.runStats.damage=(p.runStats.damage||0)+dealt;z.lastHit=p.id;z.slow=Math.max(z.slow,.12);if(crit)addEffect(room,{type:"critHit",x:z.x,y:z.y,r:24,life:.38,maxLife:.38});`,"melee critical feedback");
  s=required(s,
`r:w.bubble?9:4,life:w.range/w.speed,damage:w.damage*dmgMult*(crit?critMult:1),owner:p.id,`,
`r:w.bubble?9:4,life:w.range/w.speed,damage:w.damage*dmgMult*(crit?critMult:1),owner:p.id,crit,`,"ranged critical marker");
  s=required(s,
`      const dealt=damageZombie(z,b.damage,"ranged");z.lastHit=b.owner;b.hitIds.push(z.id);`,
`      const dealt=damageZombie(z,b.damage,"ranged");z.lastHit=b.owner;b.hitIds.push(z.id);if(b.crit)addEffect(room,{type:"critHit",x:z.x,y:z.y,r:24,life:.38,maxLife:.38});`,"ranged critical feedback");
  s=required(s,
`      const features=featureUnlocksFor(account,target);
      if((m.type==="metaUpgradeBuy"&&!features.upgrades)`,
`      const features=featureUnlocksFor(account,target);
      if(["metaShopBuy","metaQuestClaim","metaUpgradeBuy"].includes(m.type)&&!features[m.type==="metaShopBuy"?"shop":m.type==="metaQuestClaim"?"quests":"upgrades"]){send(ws,"notice",{text:"Магазин, квесты и улучшения открываются на 3 уровне аккаунта"});sendMeta(ws,target);return;}
      if((m.type==="metaUpgradeBuy"&&!features.upgrades)`,"server level gate");
  s+='\n/* DREAD SHIFT v8.7 server */\n';write("server.js",s);return true;}

function client(){let s=read("public/client.js");if(s.includes("/* DREAD SHIFT v8.7 client */"))return false;
  s=required(s,
`function featureUnlocked(mode){const f=accountState?.featureUnlocks||metaState?.account?.featureUnlocks||{};return mode==="shop"||mode==="quests"||mode==="profile"?true:!!f[mode];}`,
`function featureUnlocked(mode){const f=accountState?.featureUnlocks||metaState?.account?.featureUnlocks||{};return mode==="profile"?true:!!f[mode];}`,"client respects level gates");
  s=required(s,
`function featureLockText(mode){return ({upgrades:"🔒 Улучшения откроются после первой пройденной волны / 2 уровня аккаунта",`,
`function featureLockText(mode){return ({shop:"🔒 Магазин откроется на 3 уровне аккаунта",quests:"🔒 Квесты откроются на 3 уровне аккаунта",upgrades:"🔒 Улучшения откроются на 3 уровне аккаунта",`,"level gate text");
  s=required(s,
`  gun_rate:{
    name:"Быстрые руки",max:5,values:[0,4,8,12,16,20],kind:"percent",
    desc:"Увеличивает скорострельность и темп атак."
  },`,
`  gun_rate:{
    name:"Быстрые руки",max:5,values:[0,4,8,12,16,20],kind:"percent",
    desc:"Увеличивает скорострельность и темп атак."
  },
  crit_chance:{
    name:"Точный расчёт",max:5,values:[0,2,4,6,8,10],kind:"percent",
    desc:"Повышает шанс критического выстрела. Базовый шанс 5%, максимум 15%."
  },
  crit_damage:{
    name:"Убойный патрон",max:4,values:[0,10,20,30,40],kind:"percent",
    desc:"Повышает множитель критического урона. Базовый крит наносит 160%."
  },`,"client critical talents");
  s=required(s,
`if(key==="gun_rate")return \`${'${T("Темп","Rate")}'} +${'${value}'}%\`;`,
`if(key==="gun_rate")return \`${'${T("Темп","Rate")}'} +${'${value}'}%\`;
  if(key==="crit_chance")return \`${'${T("Шанс крита","Crit chance")}'} ${'${5+value}'}%\`;
  if(key==="crit_damage")return \`${'${T("Крит. урон","Crit damage")}'} ${'${160+value}'}%\`;`,"critical talent values");
  s=required(s,
`survivor_speed:{name:"Endurance",desc:"Increases movement speed."},gun_damage:{name:"Gunsmith",desc:"Increases damage of all weapons."},gun_rate:{name:"Quick Hands",desc:"Increases fire rate and attack speed."},gather:`,
`survivor_speed:{name:"Endurance",desc:"Increases movement speed."},gun_damage:{name:"Gunsmith",desc:"Increases damage of all weapons."},gun_rate:{name:"Quick Hands",desc:"Increases fire rate and attack speed."},crit_chance:{name:"Critical Chance",desc:"Raises critical chance from 5% up to 15%."},crit_damage:{name:"Critical Damage",desc:"Raises critical damage above the base 160%."},gather:`,"critical English copy");
  s=required(s,
`    if(e.type==="coreTurretShot"){`,
`    if(e.type==="critHit"){ctx.textAlign="center";ctx.font="950 13px system-ui";ctx.fillStyle=\`rgba(255,218,92,${'${fade}'})\`;ctx.fillText(T("КРИТ!","CRIT!"),s.x,s.y-20-(1-fade)*12);}
    if(e.type==="coreTurretShot"){`,"critical hit visual");
  s+='\n/* DREAD SHIFT v8.7 client */\n';write("public/client.js",s);return true;}

function html(){let s=read("public/index.html");if(s.includes("<!-- DREAD SHIFT v8.7 -->"))return false;
  s=s.replaceAll("DREAD SHIFT • V8.5.1.0","DREAD SHIFT • V8.7.0").replaceAll("DREAD SHIFT • V8.5.1","DREAD SHIFT • V8.7.0").replaceAll("DREAD SHIFT v8.5.1","DREAD SHIFT v8.7.0").replaceAll("ОБНОВЛЕНИЕ V8.5.1","ОБНОВЛЕНИЕ V8.7.0");
  s+='\n<!-- DREAD SHIFT v8.7 -->\n';write("public/index.html",s);return true;}
console.log("DREAD SHIFT v8.7 applied:",JSON.stringify({server:server(),client:client(),html:html()}));
