"use strict";

const fs=require("fs");
const path=require("path");
const L=lines=>lines.join("\n");

function requiredReplace(src,from,to,label){
  if(!src.includes(from))throw new Error(`DREAD SHIFT patch target missing: ${label}`);
  return src.replace(from,()=>to);
}
function requiredRegex(src,re,to,label){
  if(!re.test(src))throw new Error(`DREAD SHIFT patch target missing: ${label}`);
  return src.replace(re,()=>to);
}
function writeChanged(rel,source){fs.writeFileSync(path.join(__dirname,rel),source,"utf8");}

function patchServer(){
  const rel="server.js",file=path.join(__dirname,rel);let s=fs.readFileSync(file,"utf8");
  if(s.includes("/* DREAD SHIFT overhaul server v8.1 */"))return false;

  s=s.replace('const META_VERSION = 6;','const META_VERSION = 7;');
  s=s.replace('const BUILD_VERSION = "8.0.0";','const BUILD_VERSION = "8.1.0";');

  s=requiredRegex(s,/const META_UPGRADES = \{[\s\S]*?\n\};\n+(?=const CLASS_COSTS)/,L([
    'const META_UPGRADES = {',
    '  damage:{name:"Урон",max:5,prices:[50,75,150,200,300],values:[0,3,7,15,22,30],desc:"Увеличивает урон оружия. Бонус уровня заменяет предыдущий."},',
    '  reload:{name:"Скорость перезарядки",max:5,prices:[50,100,150,225,350],values:[0,4,9,16,24,35],desc:"Сокращает время перезарядки оружия. Бонус уровня заменяет предыдущий."},',
    '  max_hp:{name:"Максимальное здоровье",max:5,prices:[50,100,175,250,350],values:[0,10,20,35,50,75],desc:"Добавляет максимальное HP. Бонус уровня заменяет предыдущий."},',
    '  move_speed:{name:"Скорость передвижения",max:5,prices:[75,125,175,250,350],values:[0,2,4,6,8,10],desc:"Увеличивает скорость передвижения. Бонус уровня заменяет предыдущий."},',
    '  magazine:{name:"Размер магазина оружия",max:5,prices:[75,125,175,250,350],values:[0,5,10,15,22,30],desc:"Увеличивает вместимость магазина стрелкового оружия. Бонус уровня заменяет предыдущий."},',
    '  resources:{name:"Добыча ресурсов",max:5,prices:[50,100,150,225,325],values:[0,5,12,20,30,45],desc:"Увеличивает добычу дерева, камня и металла. Бонус уровня заменяет предыдущий."},',
    '  structures:{name:"Прочность построек",max:5,prices:[75,125,200,275,400],values:[0,5,12,20,30,45],desc:"Увеличивает HP стен, турелей и остальных построек. Бонус уровня заменяет предыдущий."}',
    '};',
    ''
  ]),'META_UPGRADES');

  s=requiredRegex(s,/function metaUpgradePrice\(key,level\)\{[\s\S]*?\n\}/,L([
    'function metaUpgradePrice(key,level){',
    '  const cfg=META_UPGRADES[key];if(!cfg)return Infinity;',
    '  return Number(cfg.prices?.[Math.max(0,Math.min(cfg.max-1,Number(level)||0))]??Infinity);',
    '}',
    'function metaUpgradeValue(p,key){',
    '  const cfg=META_UPGRADES[key];if(!cfg)return 0;',
    '  const level=Math.max(0,Math.min(cfg.max,Number(p?.metaUpgrades?.[key])||0));',
    '  return Number(cfg.values?.[level]||0);',
    '}'
  ]),'metaUpgradePrice');

  s=requiredReplace(s,L([
    'function lobbyUpgradeBuy(target,key){',
    '  ensureMeta(target);const cfg=META_UPGRADES[key];if(!cfg)return false;',
    '  const level=target.metaUpgrades[key]||0;if(level>=cfg.max)return false;',
    '  const price=metaUpgradePrice(key,level);if(target.silver<price)return false;',
    '  target.silver-=price;target.metaUpgrades[key]=level+1;saveProgress(target);return true;',
    '}'
  ]),L([
    'function lobbyUpgradeBuy(target,key){',
    '  ensureMeta(target);const cfg=META_UPGRADES[key];if(!cfg)return false;',
    '  const level=target.metaUpgrades[key]||0;if(level>=cfg.max)return false;',
    '  const price=metaUpgradePrice(key,level);if(target.gold<price)return false;',
    '  target.gold-=price;target.metaUpgrades[key]=level+1;saveProgress(target);return true;',
    '}'
  ]),'lobbyUpgradeBuy gold currency');

  s=requiredReplace(s,L([
    'function applyStats(p){',
    '  const cc=classCfg(p);',
    '  const runSpeed = 1 + ((p.runBonuses?.speed)||0)/100;',
    '  p.maxHp = Math.round(100*(cc.hpMult||1)) + skillValue(p,"survivor_hp") + (p.metaUpgrades?.armor||0)*5;',
    '  p.speed = 285*(cc.speedMult||1)*(1+skillValue(p,"survivor_speed")/100)*runSpeed;',
    '  p.hp=Math.min(p.hp ?? p.maxHp,p.maxHp);',
    '}'
  ]),L([
    'function applyStats(p){',
    '  const cc=classCfg(p);',
    '  const runSpeed = 1 + ((p.runBonuses?.speed)||0)/100;',
    '  const hpBonus=metaUpgradeValue(p,"max_hp"),moveBonus=metaUpgradeValue(p,"move_speed");',
    '  p.maxHp = Math.round(100*(cc.hpMult||1)) + skillValue(p,"survivor_hp") + hpBonus;',
    '  p.speed = 285*(cc.speedMult||1)*(1+skillValue(p,"survivor_speed")/100)*(1+moveBonus/100)*runSpeed;',
    '  p.hp=Math.min(p.hp ?? p.maxHp,p.maxHp);',
    '}'
  ]),'applyStats meta upgrades');

  s=requiredReplace(s,L([
    'function setWeapon(p,type,rarity="common"){',
    '  if(!WEAPONS[type])type="pistol";',
    '  p.weapon={type,rarity};',
    '  p.weaponAmmo=freshWeaponAmmo(type,p.bubbleAmmo??60,rarity);',
    '}'
  ]),L([
    'function applyMetaWeaponAmmo(p,refill=true){',
    '  if(!p?.weapon||!p?.weaponAmmo)return;',
    '  const w=weaponCfg(p.weapon.type);if(w.kind==="melee")return;',
    '  const magBonus=metaUpgradeValue(p,"magazine"),reloadCut=metaUpgradeValue(p,"reload");',
    '  const max=Math.max(1,Math.round((w.mag||1)*rarityAmmoBonus(p.weapon.rarity||"common")*(1+magBonus/100)));',
    '  p.weaponAmmo.max=max;',
    '  p.weaponAmmo.mag=refill?(w.bubble?Math.min(max,Math.max(0,p.bubbleAmmo??60)):max):Math.min(max,Math.max(0,p.weaponAmmo.mag||0));',
    '  p.weaponAmmo.reloadDuration=Math.max(.25,(w.reload||1)*rarityReloadBonus(p.weapon.rarity||"common")*(1-reloadCut/100));',
    '}',
    'function setWeapon(p,type,rarity="common"){',
    '  if(!WEAPONS[type])type="pistol";',
    '  p.weapon={type,rarity};',
    '  p.weaponAmmo=freshWeaponAmmo(type,p.bubbleAmmo??60,rarity);',
    '  applyMetaWeaponAmmo(p,true);',
    '}'
  ]),'weapon magazine/reload meta');

  s=requiredReplace(s,'const dmgMult=rarity.mult*(1+skillValue(p,"gun_damage")/100)*classMult*(1+((p.runBonuses?.damage)||0)/100)*petWeaponMult*comboDamageMultiplier(p)*equipmentDamageMultiplier(p.weaponLevel);','const dmgMult=rarity.mult*(1+skillValue(p,"gun_damage")/100)*(1+metaUpgradeValue(p,"damage")/100)*classMult*(1+((p.runBonuses?.damage)||0)/100)*petWeaponMult*comboDamageMultiplier(p)*equipmentDamageMultiplier(p.weaponLevel);','weapon damage meta');

  s=requiredReplace(s,'const gatherMult=1+skillValue(p,"gather")/100+(p.metaUpgrades?.gather||0)*.05;','const gatherMult=1+skillValue(p,"gather")/100+metaUpgradeValue(p,"resources")/100;','resource damage meta');
  s=requiredReplace(s,'const mult=1+skillValue(p,"gather")/100+(p.metaUpgrades?.gather||0)*.05;','const mult=1+skillValue(p,"gather")/100+metaUpgradeValue(p,"resources")/100;','resource yield meta');
  s=requiredReplace(s,'const hp=cfg.hp*(1+skillValue(p,"builder")/100);','const hp=cfg.hp*(1+skillValue(p,"builder")/100)*(1+metaUpgradeValue(p,"structures")/100);','structure hp meta');

  s=requiredReplace(s,L([
    '  const up=p.metaUpgrades||{};',
    '  const bp=up.backpack||0;',
    '  p.inventory={wood:24+bp*4,stone:10+bp*2,scrap:28+bp*6,medkits:(up.medkit||0),items:[]};'
  ]),'  p.inventory={wood:24,stone:10,scrap:28,medkits:0,items:[]};','remove legacy permanent upgrades');

  s=requiredReplace(s,'else{const dx=targetX-p.petX,dy=targetY-p.petY,d=Math.hypot(dx,dy);if(d>22){const step=Math.min(d,Math.min(185,55+d*.42)*dt);p.petX+=dx/d*step;p.petY+=dy/d*step;}}','else{const dx=targetX-p.petX,dy=targetY-p.petY,d=Math.hypot(dx,dy);if(d>.25){const speed=Math.min(245,90+d*.52),step=Math.min(d,speed*dt);p.petX+=dx/d*step;p.petY+=dy/d*step;}}','continuous pet following');

  s=requiredReplace(s,L([
    '  x=Math.round(x/4)*4; y=Math.round(y/4)*4;',
    '  rotation=((rotation%(Math.PI*2))+(Math.PI*2))%(Math.PI*2);'
  ]),L([
    '  rotation=((rotation%(Math.PI*2))+(Math.PI*2))%(Math.PI*2);',
    '  if(isWallType(type))rotation=Math.round(rotation/(Math.PI/2))*(Math.PI/2);',
    '  else{x=Math.round(x/4)*4;y=Math.round(y/4)*4;}'
  ]),'wall exact coordinates');

  s=requiredRegex(s,/function recordRun\(p,room,result="gameover"\)\{[\s\S]*?\n\}/,L([
    'const RUN_MILESTONE_REWARDS=[',
    '  {wave:5,silver:30,gold:5},{wave:10,silver:200,gold:20},{wave:15,silver:350,gold:20},',
    '  {wave:20,silver:500,gold:30},{wave:25,silver:700,gold:40},{wave:30,silver:950,gold:55},',
    '  {wave:35,silver:1250,gold:70},{wave:40,silver:1600,gold:90},{wave:45,silver:2100,gold:120},{wave:50,silver:3000,gold:175}',
    '];',
    'function grantRunMilestoneRewards(p,completedWaves){',
    '  completedWaves=Math.max(0,Math.min(50,Number(completedWaves)||0));',
    '  if(p.runMilestonePaid)return p.runMilestoneReward||{completedWaves,silver:0,gold:0,milestones:[]};',
    '  const milestones=RUN_MILESTONE_REWARDS.filter(r=>completedWaves>=r.wave);',
    '  const reward={completedWaves,silver:milestones.reduce((n,r)=>n+r.silver,0),gold:milestones.reduce((n,r)=>n+r.gold,0),milestones:milestones.map(r=>r.wave)};',
    '  p.silver=(p.silver||0)+reward.silver;p.gold=(p.gold||0)+reward.gold;',
    '  p.runMilestonePaid=true;p.runMilestoneReward=reward;',
    '  return reward;',
    '}',
    'function recordRun(p,room,result="gameover"){',
    '  ensureMeta(p);',
    '  let completedWaves=Math.max(0,Number(p.runStats?.waves)||0);',
    '  if(result==="victory")completedWaves=Math.max(completedWaves,Math.min(50,Number(room.wave)||0));',
    '  const earned=grantRunMilestoneRewards(p,completedWaves);',
    '  const row={date:new Date().toISOString(),wave:room.wave,completedWaves,kills:p.runStats?.kills||0,builds:p.runStats?.builds||0,damage:Math.round(p.runStats?.damage||0),classId:p.character,petId:p.equippedPet||null,weapon:favoriteWeapon(p),result,earnedSilver:earned.silver,earnedGold:earned.gold,rewardMilestones:earned.milestones};',
    '  p.runHistory=[row,...(p.runHistory||[])].slice(0,5);',
    '  checkAchievements(p,room);saveProgress(p);return row;',
    '}'
  ]),'run milestone rewards');

  s=requiredReplace(s,'p.runBonuses={damage:0,speed:0};p.runStats={kills:0,harvest:0,waves:0,builds:0,damage:0,coreDamage:0,weaponShots:{},minCoreRatio:1};p.petState=blankPetState();','p.runBonuses={damage:0,speed:0};p.runStats={kills:0,harvest:0,waves:0,builds:0,damage:0,coreDamage:0,weaponShots:{},minCoreRatio:1};p.runMilestonePaid=false;p.runMilestoneReward=null;p.petState=blankPetState();','reset run milestone state');
  s=requiredReplace(s,'p.account=accounts[cleanUsername(profile)]||null;\n  ensureMeta(p);','p.account=accounts[cleanUsername(profile)]||null;\n  p.runMilestonePaid=false;p.runMilestoneReward=null;\n  ensureMeta(p);','initial run milestone state');

  s=s.replaceAll("Night Shift Duo","DREAD SHIFT").replaceAll("NIGHT SHIFT DUO","DREAD SHIFT");
  s+='\n/* DREAD SHIFT overhaul server v8.1 */\n';
  writeChanged(rel,s);return true;
}

function patchClient(){
  const rel="public/client.js",file=path.join(__dirname,rel);let s=fs.readFileSync(file,"utf8");
  if(s.includes("/* DREAD SHIFT overhaul client v8.1 */"))return false;

  s=requiredRegex(s,/const metaUpgradeInfo=\{[\s\S]*?\n\};\n(?=const achievementInfo=)/,L([
    'const metaUpgradeInfo={',
    '  damage:{name:"Урон",max:5,prices:[50,75,150,200,300],values:[0,3,7,15,22,30],desc:"Урон всего оружия. Каждый уровень заменяет предыдущий бонус."},',
    '  reload:{name:"Скорость перезарядки",max:5,prices:[50,100,150,225,350],values:[0,4,9,16,24,35],desc:"Сокращает время перезарядки. Каждый уровень заменяет предыдущий бонус."},',
    '  max_hp:{name:"Максимальное здоровье",max:5,prices:[50,100,175,250,350],values:[0,10,20,35,50,75],desc:"Добавляет максимальное HP. Каждый уровень заменяет предыдущий бонус."},',
    '  move_speed:{name:"Скорость передвижения",max:5,prices:[75,125,175,250,350],values:[0,2,4,6,8,10],desc:"Увеличивает скорость передвижения. Каждый уровень заменяет предыдущий бонус."},',
    '  magazine:{name:"Размер магазина оружия",max:5,prices:[75,125,175,250,350],values:[0,5,10,15,22,30],desc:"Больше патронов в магазине стрелкового оружия."},',
    '  resources:{name:"Добыча ресурсов",max:5,prices:[50,100,150,225,325],values:[0,5,12,20,30,45],desc:"Больше дерева, камня и металла за добычу."},',
    '  structures:{name:"Прочность построек",max:5,prices:[75,125,200,275,400],values:[0,5,12,20,30,45],desc:"Больше HP у стен, турелей и других построек."}',
    '};',
    ''
  ]),'client metaUpgradeInfo');

  s=requiredRegex(s,/const metaUpgradeInfoEn=\{[\s\S]*?\};\n(?=const achievementInfoEn=)/,L([
    'const metaUpgradeInfoEn={',
    '  damage:{name:"Damage",desc:"Weapon damage. Each level replaces the previous bonus."},',
    '  reload:{name:"Reload Speed",desc:"Reduces reload time. Each level replaces the previous bonus."},',
    '  max_hp:{name:"Maximum Health",desc:"Adds maximum HP. Each level replaces the previous bonus."},',
    '  move_speed:{name:"Movement Speed",desc:"Increases movement speed. Each level replaces the previous bonus."},',
    '  magazine:{name:"Magazine Size",desc:"Adds ammo to ranged-weapon magazines."},',
    '  resources:{name:"Resource Yield",desc:"More wood, stone and scrap from gathering."},',
    '  structures:{name:"Structure Durability",desc:"More HP for walls, turrets and other structures."}',
    '};',
    ''
  ]),'client metaUpgradeInfoEn');

  s=requiredReplace(s,'function metaUpgradePrice(key,lvl){const c=metaUpgradeInfo[key];return c.base+c.step*lvl;}',L([
    'function metaUpgradePrice(key,lvl){const c=metaUpgradeInfo[key];return Number(c?.prices?.[Math.max(0,Math.min(4,Number(lvl)||0))]??Infinity);}',
    'function metaUpgradeBonusText(id,lvl){',
    '  const cfg=metaUpgradeInfo[id],v=Number(cfg?.values?.[Math.max(0,Math.min(5,Number(lvl)||0))]||0);',
    '  if(!lvl)return T("Нет бонуса","No bonus");',
    '  if(id==="reload")return `-${v}% ${T("времени перезарядки","reload time")}`;',
    '  if(id==="max_hp")return `+${v} HP`;',
    '  return `+${v}%`;',
    '}',
    'function metaUpgradeLevelText(id,lvl){const v=Number(metaUpgradeInfo[id]?.values?.[lvl]||0);return id==="reload"?`-${v}%`:id==="max_hp"?`+${v} HP`:`+${v}%`;}'
  ]),'client meta upgrade helpers');

  s=requiredRegex(s,/  \}else if\(lobbyMetaMode==="upgrades"\)\{[\s\S]*?  \}else if\(lobbyMetaMode==="crates"\)\{/,L([
    '  }else if(lobbyMetaMode==="upgrades"){',
    '    lobbyMetaContent.innerHTML=Object.entries(metaUpgradeInfo).map(([id,cfg])=>{',
    '      const lvl=Math.max(0,Math.min(5,Number(m.upgrades?.[id])||0)),max=lvl>=5,price=metaUpgradePrice(id,lvl),current=metaUpgradeBonusText(id,lvl);',
    '      const levels=Array.from({length:5},(_,n)=>n+1).map(i=>`<span class="meta-upgrade-level ${i<=lvl?"active":""} ${i===lvl+1?"next":""}"><b>${i}</b><small>${metaUpgradeLevelText(id,i)}</small></span>`).join("");',
    '      return `<article class="meta-card meta-upgrade-card"><div class="meta-upgrade-head"><div><b>${cfg.name}</b><small>${cfg.desc}</small></div><strong>${T("Текущий бонус","Current bonus")}: ${current}</strong></div><div class="meta-upgrade-levels">${levels}</div><div class="meta-card-row"><span>${T("Уровень","Level")} ${lvl}/5</span><button data-meta-upgrade="${id}" ${max||Number(m.gold||0)<price?"disabled":""}>${max?T("МАКСИМУМ","MAXIMUM"):`${T("УЛУЧШИТЬ","UPGRADE")} · ${price} ${T("золота","gold")}`}</button></div></article>`;',
    '    }).join("");',
    '  }else if(lobbyMetaMode==="crates"){'
  ]),'render permanent upgrades');

  s=requiredReplace(s,'const smoothPlayers=new Map(),smoothZombies=new Map();','const smoothPlayers=new Map(),smoothZombies=new Map(),smoothPets=new Map();','pet smoothing map');
  s=s.replaceAll('smoothPlayers.clear();smoothZombies.clear();','smoothPlayers.clear();smoothZombies.clear();smoothPets.clear();');

  s=requiredReplace(s,L([
    '  const base=(p.id===myId&&localPred)?{...p,x:localPred.x,y:localPred.y}:smoothEntity(smoothPlayers,p);',
    '  const wp=petVisualWorldPos(base),s=sc(wp.x,wp.y),img=petImages[petId];'
  ]),L([
    '  const base=(p.id===myId&&localPred)?{...p,x:localPred.x,y:localPred.y}:smoothEntity(smoothPlayers,p);',
    '  const rawWp=petVisualWorldPos(p),prediction=p.id===myId&&localPred?{x:localPred.x-p.x,y:localPred.y-p.y}:{x:0,y:0},desired={x:rawWp.x+prediction.x,y:rawWp.y+prediction.y};',
    '  let wp=smoothPets.get(p.id);if(!wp){wp={x:desired.x,y:desired.y};smoothPets.set(p.id,wp);}const petGap=Math.hypot(desired.x-wp.x,desired.y-wp.y);',
    '  if(petGap>650){wp.x=desired.x;wp.y=desired.y;}else{const follow=petGap>220?.28:petGap>90?.18:.11;wp.x+=(desired.x-wp.x)*follow;wp.y+=(desired.y-wp.y)*follow;}',
    '  const s=sc(wp.x,wp.y),img=petImages[petId];'
  ]),'client pet interpolation');

  s=requiredReplace(s,'let best=null,bestD=25;','let best=null,bestD=72;','wall snap radius');

  s=requiredReplace(s,'  if(!((metaState?.crateTokens||0)>0)&&!confirm("Открыть ящик за 50 золота?"))return;','  // No native browser confirmation: one click opens the crate immediately.','remove crate browser confirm');

  s=requiredReplace(s,L([
    'function updateCoreActions(){',
    '  const el=$("coreActions"),p=myPlayer();if(!el)return;',
    '  const near=!!(state?.started&&p&&state?.core&&Math.hypot(p.x-state.core.x,p.y-state.core.y)<RUN_SHOP_RADIUS);',
    '  el.classList.toggle("hidden",!near);if(!near)return;',
    '  const pos=sc(state.core.x,state.core.y);el.style.left=`${pos.x}px`;el.style.top=`${pos.y+92}px`;',
    '}'
  ]),L([
    'function updateCoreActions(){',
    '  const el=$("coreActions"),p=myPlayer();if(!el)return;',
    '  const near=!!(state?.started&&p&&state?.core&&Math.hypot(p.x-state.core.x,p.y-state.core.y)<RUN_SHOP_RADIUS);',
    '  el.classList.toggle("hidden",!near);if(!near)return;',
    '  const pos=sc(state.core.x,state.core.y);el.style.left=`${pos.x}px`;el.style.top=`${pos.y+132}px`;',
    '  el.dataset.coreLevel=String(state.core.level||1);',
    '}'
  ]),'generator level visibility');

  s=requiredReplace(s,'function multitoolMini(level){return `<div class="multitool-mini tool-level-${level}"><i></i><b></b></div>`;}',L([
    'function multitoolMini(level){return `<div class="multitool-mini tool-level-${level}"><i></i><b></b></div>`;}',
    'function multitoolStats(level,p){',
    '  level=Math.max(1,Math.min(5,Number(level)||1));',
    '  const skillLvl=Math.max(0,Number(p?.skills?.gather)||0),skillBonus=Number(talentDefs?.gather?.values?.[skillLvl]||0);',
    '  const metaLvl=Math.max(0,Number(metaState?.upgrades?.resources)||0),metaBonus=Number(metaUpgradeInfo.resources?.values?.[metaLvl]||0);',
    '  const gatherMult=1+(skillBonus+metaBonus)/100,damage=12*gatherMult*(1+(level-1)*.16),delay=.36/(1+(level-1)*.045);',
    '  const seconds=hp=>Math.ceil(hp/damage)*delay;',
    '  return {damage,delay,loot:(level-1)*8,tree:seconds(56),rock:seconds(72),scrap:seconds(48)};',
    '}',
    'function multitoolCompareHtml(level,next,p,maxed){',
    '  const a=multitoolStats(level,p),b=multitoolStats(next,p),f=n=>n.toFixed(2);',
    '  if(maxed)return `${T("Максимальный мультитул","Maximum multitool")} · ${T("урон по ресурсу","resource damage")} ${a.damage.toFixed(1)} · ${T("удар каждые","hit every")} ${f(a.delay)}${T("с","s")} · ${T("доп. добыча","bonus yield")} +${a.loot}%`;',
    '  return `<b>${T("Урон по ресурсу","Resource damage")}: ${a.damage.toFixed(1)} → ${b.damage.toFixed(1)}</b><br>${T("Задержка между ударами","Delay between hits")}: ${f(a.delay)}${T("с","s")} → ${f(b.delay)}${T("с","s")}<br>${T("Примерное время добычи","Approx. gathering time")}: ${T("дерево","wood")} ${f(a.tree)}→${f(b.tree)}${T("с","s")} · ${T("камень","stone")} ${f(a.rock)}→${f(b.rock)}${T("с","s")} · ${T("металл","scrap")} ${f(a.scrap)}→${f(b.scrap)}${T("с","s")}<br>${T("Дополнительная добыча","Bonus yield")}: +${a.loot}% → +${b.loot}%`;',
    '}'
  ]),'multitool stats helpers');

  s=requiredReplace(s,'  const gain=maxed?T("Максимальная мощность достигнута","Maximum power reached"):kind==="multitool"?T("Быстрее добыча, больше урон по ресурсам и дополнительный лут.","Faster gathering, more resource damage and bonus loot."):T("+16% урона и +4.5% скорострельности за уровень.","+16% damage and +4.5% fire rate per level.");','  const gain=kind==="multitool"?multitoolCompareHtml(level,next,p,maxed):(maxed?T("Максимальная мощность достигнута","Maximum power reached"):T("+16% урона и +4.5% скорострельности за уровень.","+16% damage and +4.5% fire rate per level."));','multitool upgrade description');

  s=requiredReplace(s,L([
    '  if(gameOver&&stats){',
    '    const fmt=n=>Number(n||0).toLocaleString(isEn()?"en-US":"ru-RU");',
    '    $("deathStats").innerHTML=`<div><b>${fmt(stats.wave||wave)}</b><span>${T("волна","wave")}</span></div><div><b>${fmt(stats.kills)}</b><span>${T("убито","kills")}</span></div><div><b>${fmt(stats.damage)}</b><span>${T("урона","damage")}</span></div><div><b>${fmt(stats.builds)}</b><span>${T("построено","built")}</span></div><div class="death-weapon-stat"><b>${weaponNames[stats.weapon]||stats.weapon||"—"}</b><span>${T("любимое оружие","favorite weapon")}</span></div>`;',
    '  }'
  ]),L([
    '  if(gameOver&&stats){',
    '    const fmt=n=>Number(n||0).toLocaleString(isEn()?"en-US":"ru-RU");',
    '    $("deathStats").innerHTML=`<div><b>${fmt(stats.wave||wave)}</b><span>${T("волна","wave")}</span></div><div><b>${fmt(stats.kills)}</b><span>${T("убито","kills")}</span></div><div><b>${fmt(stats.damage)}</b><span>${T("урона","damage")}</span></div><div><b>${fmt(stats.builds)}</b><span>${T("построено","built")}</span></div><div class="death-weapon-stat"><b>${weaponNames[stats.weapon]||stats.weapon||"—"}</b><span>${T("любимое оружие","favorite weapon")}</span></div><div class="death-reward-stat"><b>+${fmt(stats.earnedSilver)} ◉ · +${fmt(stats.earnedGold)} G</b><span>${T(`награда за ${fmt(stats.completedWaves)} пройденных волн`,`reward for ${fmt(stats.completedWaves)} completed waves`)}</span></div>`;',
    '  }'
  ]),'death run rewards');

  s=s.replaceAll("Night Shift Duo","DREAD SHIFT").replaceAll("NIGHT SHIFT DUO","DREAD SHIFT");
  s+='\n/* DREAD SHIFT overhaul client v8.1 */\n';
  writeChanged(rel,s);return true;
}

function patchIndex(){
  const rel="public/index.html",file=path.join(__dirname,rel);let s=fs.readFileSync(file,"utf8");
  if(s.includes("<!-- DREAD SHIFT overhaul v8.1 -->"))return false;
  s=s.replaceAll("Night Shift Duo","DREAD SHIFT").replaceAll("NIGHT SHIFT DUO","DREAD SHIFT").replaceAll("v8.0.0","v8.1.0").replaceAll("V8.0.0","V8.1.0").replaceAll("V8.0","V8.1");
  s+='\n<!-- DREAD SHIFT overhaul v8.1 -->\n';writeChanged(rel,s);return true;
}

function patchCss(){
  const rel="public/style.css",file=path.join(__dirname,rel);let s=fs.readFileSync(file,"utf8");
  if(s.includes("/* DREAD SHIFT overhaul styles v8.1 */"))return false;
  s+=L([
    '',
    '/* DREAD SHIFT overhaul styles v8.1 */',
    '.core-actions{margin-top:0}.core-actions::before{content:"GENERATOR · LVL " attr(data-core-level);position:absolute;left:50%;top:-25px;transform:translateX(-50%);white-space:nowrap;padding:4px 8px;border-radius:7px;background:rgba(5,12,10,.92);border:1px solid rgba(112,225,151,.22);color:#bfe5c9;font:900 9px/1 system-ui;letter-spacing:.08em}',
    '.meta-upgrade-card{gap:12px!important}.meta-upgrade-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.meta-upgrade-head>div{min-width:0}.meta-upgrade-head b{display:block;font-size:15px}.meta-upgrade-head small{display:block;margin-top:4px;color:#819096;line-height:1.4}.meta-upgrade-head strong{flex:0 0 auto;padding:6px 9px;border-radius:8px;background:rgba(97,219,143,.08);border:1px solid rgba(97,219,143,.18);color:#9ee4b8;font-size:10px;white-space:nowrap}',
    '.meta-upgrade-levels{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:10px 0 12px}.meta-upgrade-level{min-height:45px;display:grid;place-items:center;gap:1px;padding:6px 3px;border:1px solid rgba(255,255,255,.08);border-radius:9px;background:#0a1114;color:#65747a}.meta-upgrade-level b{font-size:11px}.meta-upgrade-level small{font-size:8px;color:inherit}.meta-upgrade-level.active{border-color:rgba(99,222,145,.5);background:rgba(43,114,72,.16);color:#9ce6b7}.meta-upgrade-level.next{border-color:rgba(231,198,109,.48);color:#e3ca81;box-shadow:inset 0 0 18px rgba(231,198,109,.05)}',
    '.equipment-gain{line-height:1.7}.equipment-gain b{color:#dff5e7}.death-reward-stat{grid-column:1/-1!important;border-color:rgba(230,194,92,.28)!important;background:linear-gradient(135deg,rgba(83,64,20,.18),rgba(18,30,24,.25))!important}.death-reward-stat b{color:#f2d477!important}',
    '@media(max-width:700px){.meta-upgrade-head{display:block}.meta-upgrade-head strong{display:inline-block;margin-top:8px}.meta-upgrade-levels{gap:3px}.meta-upgrade-level small{font-size:7px}}',
    ''
  ]);writeChanged(rel,s);return true;
}

const changed={server:patchServer(),client:patchClient(),html:patchIndex(),css:patchCss()};
const server=fs.readFileSync(path.join(__dirname,"server.js"),"utf8"),client=fs.readFileSync(path.join(__dirname,"public/client.js"),"utf8"),html=fs.readFileSync(path.join(__dirname,"public/index.html"),"utf8");
const checks=[
  [server.includes('damage:{name:"Урон",max:5'),"new server upgrades"],
  [server.includes('target.gold-=price'),"gold upgrade purchases"],
  [server.includes('RUN_MILESTONE_REWARDS'),"run rewards"],
  [server.includes('metaUpgradeValue(p,"structures")'),"structure durability"],
  [client.includes('best=null,bestD=72'),"wall snapping"],
  [client.includes('smoothPets=new Map()'),"pet smoothing"],
  [!client.includes('confirm("Открыть ящик за 50 золота?")'),"crate confirm removed"],
  [client.includes('meta-upgrade-level'),"five-level upgrade UI"],
  [client.includes('multitoolCompareHtml'),"multitool comparison"],
  [html.includes('DREAD SHIFT'),"brand rename"]
];
for(const [ok,name] of checks)if(!ok)throw new Error(`DREAD SHIFT self-check failed: ${name}`);
console.log(`DREAD SHIFT v8.1 overhaul applied: ${JSON.stringify(changed)}`);
