"use strict";
const fs=require("node:fs"),path=require("node:path");
const F=r=>path.join(__dirname,r),R=r=>fs.readFileSync(F(r),"utf8"),W=(r,s)=>fs.writeFileSync(F(r),s,"utf8");
function must(v,m){if(!v)throw new Error("v8.9.7: "+m)}
function once(s,a,b,m){must(s.includes(a),"target missing: "+m);return s.replace(a,b)}

function patchServer(){
  let s=R("server.js");if(s.includes("/* DREAD SHIFT v8.9.7 server */"))return false;
  s=once(s,'const BUILD_VERSION = "8.9.6";','const BUILD_VERSION = "8.9.7";',"version");
  s=once(s,`const META_UPGRADES = {
  backpack:{name:"Рюкзак снабжения",max:5,base:35,step:24,desc:"Больше стартовых ресурсов"},
  armor:{name:"Бронепластины",max:5,base:45,step:30,desc:"+5 максимального HP за уровень"},
  gather:{name:"Полевой инструмент",max:5,base:40,step:28,desc:"+5% эффективности добычи за уровень"},
  medkit:{name:"Медицинская полка",max:3,base:60,step:45,desc:"+1 стартовая аптечка за уровень"}
};`,`const META_UPGRADES = {
  damage:{name:"Урон",prices:[50,75,150,200,300],bonuses:[3,7,15,22,30]},
  reload:{name:"Скорость перезарядки",prices:[50,100,150,225,350],bonuses:[4,9,16,24,35]},
  health:{name:"Максимальное здоровье",prices:[50,100,175,250,350],bonuses:[10,20,35,50,75]},
  speed:{name:"Скорость передвижения",prices:[75,125,175,250,350],bonuses:[2,4,6,8,10]},
  magazine:{name:"Размер магазина оружия",prices:[75,125,175,250,350],bonuses:[5,10,15,22,30]},
  gather:{name:"Добыча ресурсов",prices:[50,100,150,225,325],bonuses:[5,12,20,30,45]},
  building:{name:"Прочность построек",prices:[75,125,200,275,400],bonuses:[5,12,20,30,45]}
};
for(const cfg of Object.values(META_UPGRADES))cfg.max=cfg.bonuses.length;
function metaUpgradeBonus(p,key){const cfg=META_UPGRADES[key],lvl=Math.max(0,Math.min(cfg?.max||0,Number(p?.metaUpgrades?.[key])||0));return lvl?cfg.bonuses[lvl-1]:0;}`,"seven upgrade branches");
  s=once(s,"  return cfg.base+cfg.step*level;","  return cfg.prices[level]??Infinity;","tier prices");
  s=once(s,"function freshWeaponAmmo(type,bubbleRemaining=60,rarity=\"common\"){","function freshWeaponAmmo(type,bubbleRemaining=60,rarity=\"common\",p=null){","ammo signature");
  s=once(s,"  const max=Math.max(1,Math.round((w.mag||1)*rarityAmmoBonus(rarity)));\n  const dur=Math.max(.35,(w.reload||1)*rarityReloadBonus(rarity));","  const max=Math.max(1,Math.round((w.mag||1)*rarityAmmoBonus(rarity)*(1+metaUpgradeBonus(p,\"magazine\")/100)));\n  const dur=Math.max(.35,(w.reload||1)*rarityReloadBonus(rarity)*(1-metaUpgradeBonus(p,\"reload\")/100));","ammo bonuses");
  s=s.replaceAll("freshWeaponAmmo(type,p.bubbleAmmo??60,rarity);","freshWeaponAmmo(type,p.bubbleAmmo??60,rarity,p);");
  s=s.replaceAll("freshWeaponAmmo(p.weapon?.type,p.bubbleAmmo??60,p.weapon?.rarity||\"common\");","freshWeaponAmmo(p.weapon?.type,p.bubbleAmmo??60,p.weapon?.rarity||\"common\",p);");
  s=s.replaceAll("freshWeaponAmmo(p.weapon.type,p.bubbleAmmo??60,p.weapon?.rarity||\"common\");","freshWeaponAmmo(p.weapon.type,p.bubbleAmmo??60,p.weapon?.rarity||\"common\",p);");
  s=s.replaceAll("freshWeaponAmmo(p.weapon?.type||\"pistol\",p.bubbleAmmo??60,p.weapon?.rarity||\"common\")","freshWeaponAmmo(p.weapon?.type||\"pistol\",p.bubbleAmmo??60,p.weapon?.rarity||\"common\",p)");
  s=once(s,"  const bp=up.backpack||0;\n  p.inventory={wood:24+bp*4,stone:10+bp*2,scrap:28+bp*6,medkits:(up.medkit||0),items:[]};","  p.inventory={wood:24,stone:10,scrap:28,medkits:0,items:[]};","remove obsolete upgrades");
  s=once(s,'  p.maxHp = Math.round(100*(cc.hpMult||1)) + skillValue(p,"survivor_hp") + (p.metaUpgrades?.armor||0)*5;','  p.maxHp = Math.round(100*(cc.hpMult||1)) + skillValue(p,"survivor_hp") + metaUpgradeBonus(p,"health");',"health bonus");
  s=once(s,'  p.speed = 285*(cc.speedMult||1)*(1+skillValue(p,"survivor_speed")/100)*runSpeed;','  p.speed = 285*(cc.speedMult||1)*(1+skillValue(p,"survivor_speed")/100)*(1+metaUpgradeBonus(p,"speed")/100)*runSpeed;',"speed bonus");
  s=once(s,'  const gatherMult=1+skillValue(p,"gather")/100+(p.metaUpgrades?.gather||0)*.05;','  const gatherMult=1+skillValue(p,"gather")/100+metaUpgradeBonus(p,"gather")/100;',"gather bonus 1");
  s=once(s,'    const mult=1+skillValue(p,"gather")/100+(p.metaUpgrades?.gather||0)*.05;','    const mult=1+skillValue(p,"gather")/100+metaUpgradeBonus(p,"gather")/100;',"gather bonus 2");
  s=once(s,'  const dmgMult=rarity.mult*(1+skillValue(p,"gun_damage")/100)*classMult','  const dmgMult=rarity.mult*(1+skillValue(p,"gun_damage")/100)*(1+metaUpgradeBonus(p,"damage")/100)*classMult',"damage bonus");
  s=once(s,'  const hp=cfg.hp*(1+skillValue(p,"builder")/100);','  const hp=cfg.hp*(1+skillValue(p,"builder")/100)*(1+metaUpgradeBonus(p,"building")/100);',"building bonus");
  s=once(s,"  const price=metaUpgradePrice(key,level);if(target.silver<price)return false;\n  target.silver-=price;target.metaUpgrades[key]=level+1;saveProgress(target);return true;","  const price=metaUpgradePrice(key,level);if(target.gold<price)return false;\n  target.gold-=price;target.metaUpgrades[key]=level+1;saveProgress(target);return true;","gold purchases");
  s+='\n/* DREAD SHIFT v8.9.7 server */\n';W("server.js",s);return true;
}

function patchClient(){
  let s=R("public/client.js");if(s.includes("/* DREAD SHIFT v8.9.7 client */"))return false;
  s=once(s,`const metaUpgradeInfo={
  backpack:{name:"Рюкзак снабжения",max:5,base:35,step:24,desc:"Каждый уровень добавляет стартовые дерево, камень и металл."},
  armor:{name:"Бронепластины",max:5,base:45,step:30,desc:"+5 максимального HP за уровень."},
  gather:{name:"Полевой инструмент",max:5,base:40,step:28,desc:"+5% эффективности добычи за уровень."},
  medkit:{name:"Медицинская полка",max:3,base:60,step:45,desc:"+1 стартовая аптечка за уровень."}
};`,`const metaUpgradeInfo={
  damage:{name:"Урон",prices:[50,75,150,200,300],bonuses:[3,7,15,22,30],unit:"%",prefix:"+",desc:"Увеличивает весь наносимый урон."},
  reload:{name:"Скорость перезарядки",prices:[50,100,150,225,350],bonuses:[4,9,16,24,35],unit:"%",prefix:"−",desc:"Уменьшает время перезарядки оружия."},
  health:{name:"Максимальное здоровье",prices:[50,100,175,250,350],bonuses:[10,20,35,50,75],unit:" HP",prefix:"+",desc:"Увеличивает максимальный запас здоровья."},
  speed:{name:"Скорость передвижения",prices:[75,125,175,250,350],bonuses:[2,4,6,8,10],unit:"%",prefix:"+",desc:"Увеличивает скорость передвижения."},
  magazine:{name:"Размер магазина оружия",prices:[75,125,175,250,350],bonuses:[5,10,15,22,30],unit:"%",prefix:"+",desc:"Увеличивает количество патронов в магазине."},
  gather:{name:"Добыча ресурсов",prices:[50,100,150,225,325],bonuses:[5,12,20,30,45],unit:"%",prefix:"+",desc:"Увеличивает добычу дерева, камня и металла."},
  building:{name:"Прочность построек",prices:[75,125,200,275,400],bonuses:[5,12,20,30,45],unit:"%",prefix:"+",desc:"Увеличивает HP стен, турелей и других построек."}
};
for(const cfg of Object.values(metaUpgradeInfo))cfg.max=cfg.bonuses.length;`,"client upgrade catalog");
  s=once(s,'const metaUpgradeInfoEn={backpack:{name:"Supply Backpack",desc:"Each level adds starting wood, stone and scrap."},armor:{name:"Armor Plates",desc:"+5 maximum HP per level."},gather:{name:"Field Tool",desc:"+5% gathering efficiency per level."},medkit:{name:"Medical Shelf",desc:"+1 starting medkit per level."}};',`const metaUpgradeInfoEn={damage:{name:"Damage",desc:"Increases all damage dealt."},reload:{name:"Reload Speed",desc:"Reduces weapon reload time."},health:{name:"Maximum Health",desc:"Increases maximum health."},speed:{name:"Movement Speed",desc:"Increases movement speed."},magazine:{name:"Magazine Size",desc:"Increases rounds per magazine."},gather:{name:"Resource Gathering",desc:"Increases wood, stone and scrap gathered."},building:{name:"Structure Durability",desc:"Increases HP of walls, towers and other structures."}};`,"English catalog");
  s=once(s,"function metaUpgradePrice(key,lvl){const c=metaUpgradeInfo[key];return c.base+c.step*lvl;}","function metaUpgradePrice(key,lvl){return metaUpgradeInfo[key]?.prices?.[lvl]??Infinity;}","client tier prices");
  const oldRender='    lobbyMetaContent.innerHTML=Object.entries(metaUpgradeInfo).map(([id,cfg])=>{const lvl=m.upgrades?.[id]||0,max=lvl>=cfg.max,price=metaUpgradePrice(id,lvl);return `<article class="meta-card"><div class="meta-card-row"><div><h3>${cfg.name}</h3><p>${cfg.desc}</p><b>${T("ур.","lvl")} ${lvl}/${cfg.max}</b></div><div class="meta-card-actions"><span class="price-silver">${max?"MAX":price+" "+T("серебра","silver")}</span><button data-meta-upgrade="${id}" ${max||m.silver<price?"disabled":""}>${max?T("Максимум","Maximum"):T("Улучшить","Upgrade")}</button></div></div></article>`}).join("");';
  const newRender='    lobbyMetaContent.innerHTML=Object.entries(metaUpgradeInfo).map(([id,cfg])=>{const lvl=m.upgrades?.[id]||0,max=lvl>=cfg.max,price=metaUpgradePrice(id,lvl),bonus=lvl?cfg.prefix+cfg.bonuses[lvl-1]+cfg.unit:T("нет бонуса","no bonus"),steps=cfg.bonuses.map((v,i)=>`<span class="upgrade-step ${i<lvl?"active":""}" title="${cfg.prefix}${v}${cfg.unit}">${i<lvl?"◆":"◇"}</span>`).join("");return `<article class="meta-card upgrade-card"><div class="meta-card-row"><div><h3>${cfg.name}</h3><p>${cfg.desc}</p><div class="upgrade-levels">${steps}</div><b>${T("ур.","lvl")} ${lvl}/${cfg.max} · ${T("текущий бонус","current bonus")}: ${bonus}</b></div><div class="meta-card-actions"><span class="price-gold">${max?"MAX":price+" "+T("золота","gold")}</span><button data-meta-upgrade="${id}" ${max||m.gold<price?"disabled":""}>${max?T("Максимум","Maximum"):T("Улучшить","Upgrade")}</button></div></div></article>`}).join("");';
  s=once(s,oldRender,newRender,"upgrade cards");
  s+='\n/* DREAD SHIFT v8.9.7 client */\n';try{new Function(s)}catch(e){throw new Error("v8.9.7 client syntax: "+e.message)}W("public/client.js",s);return true;
}

function patchCss(){let s=R("public/style.css");if(s.includes("/* DREAD SHIFT v8.9.7 upgrades */"))return false;s+='\n/* DREAD SHIFT v8.9.7 upgrades */\n.upgrade-levels{display:flex;gap:7px;margin:10px 0 8px}.upgrade-step{color:#617078;font-size:19px;line-height:1}.upgrade-step.active{color:#ffd765;text-shadow:0 0 10px rgba(255,202,71,.45)}.upgrade-card .price-gold{color:#f4d266;font-weight:900;white-space:nowrap}\n';W("public/style.css",s);return true;}
function patchHtml(){let s=R("public/index.html");if(s.includes("<!-- DREAD SHIFT v8.9.7 -->"))return false;s=s.replaceAll("V8.9.6","V8.9.7").replaceAll("v8.9.6","v8.9.7");s+='\n<!-- DREAD SHIFT v8.9.7 -->\n';W("public/index.html",s);return true;}
const changed={server:patchServer(),client:patchClient(),css:patchCss(),html:patchHtml()};
const server=R("server.js"),client=R("public/client.js");must(server.includes('const BUILD_VERSION = "8.9.7";'),"version missing");must(server.includes('target.gold-=price'),"gold purchase missing");must(client.includes('damage:{name:"Урон"'),"upgrade UI missing");console.log("DREAD SHIFT v8.9.7 lobby upgrades restored:",changed);
