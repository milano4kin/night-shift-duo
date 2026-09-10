"use strict";

const fs=require("fs");
const path=require("path");
const file=rel=>path.join(__dirname,rel);
const read=rel=>fs.readFileSync(file(rel),"utf8");
const write=(rel,s)=>fs.writeFileSync(file(rel),s,"utf8");

function required(s,from,to,label){
  if(!s.includes(from))throw new Error(`v8.6 target missing: ${label}`);
  return s.replace(from,to);
}

function patchServer(){
  let s=read("server.js");
  if(s.includes("/* DREAD SHIFT v8.6 server */"))return false;
  s=required(s,'const BUILD_VERSION = "8.5.4";','const BUILD_VERSION = "8.6.0";',"build version");
  s=required(s,
`  micro_uzi:     { wood:10, stone:0,  scrap:70  },`,
`  armor:         { wood:12, stone:18, scrap:55  },
  micro_uzi:     { wood:10, stone:0,  scrap:70  },`,"armor shop item");
  s=required(s,
`  { level:2, cost:{wood:80, stone:55, scrap:70},  hp:1500, heal:1.2, turret:1.10, light:330 },
  { level:3, cost:{wood:130,stone:95, scrap:120}, hp:1900, heal:2.0, turret:1.22, light:410 },
  { level:4, cost:{wood:190,stone:145,scrap:190}, hp:2400, heal:3.0, turret:1.38, light:500 },
  { level:5, cost:{wood:270,stone:210,scrap:290}, hp:3100, heal:4.2, turret:1.58, light:610 }`,
`  { level:2, cost:{wood:80, stone:55, scrap:70},  hp:3000, heal:1.2, turret:1.10, light:330 },
  { level:3, cost:{wood:130,stone:95, scrap:120}, hp:3800, heal:2.0, turret:1.22, light:410 },
  { level:4, cost:{wood:190,stone:145,scrap:190}, hp:4800, heal:3.0, turret:1.38, light:500 },
  { level:5, cost:{wood:270,stone:210,scrap:290}, hp:6000, heal:4.2, turret:1.58, light:610 }`,"core hp progression");
  s=required(s,
`const WEAPON_UPGRADE_COSTS={2:{wood:12,stone:8,scrap:45},3:{wood:22,stone:18,scrap:90},4:{wood:36,stone:32,scrap:165},5:{wood:56,stone:52,scrap:285}};`,
`const WEAPON_UPGRADE_COSTS={2:{wood:12,stone:8,scrap:45},3:{wood:22,stone:18,scrap:90},4:{wood:36,stone:32,scrap:165},5:{wood:56,stone:52,scrap:285}};
const ARMOR_UPGRADE_COSTS={2:{wood:20,stone:28,scrap:72},3:{wood:34,stone:46,scrap:125},4:{wood:52,stone:70,scrap:205},5:{wood:78,stone:105,scrap:330}};
const ARMOR_REDUCTION=[0,.10,.18,.26,.34,.42];
function armorReduction(level){return ARMOR_REDUCTION[Math.max(0,Math.min(5,Number(level)||0))]||0;}`,"armor progression");
  s=required(s,
`    shootCd:0,harvestCd:0,buildCd:0,upgradeCd:0,weaponLevel:1,multitoolLevel:1,`,
`    shootCd:0,harvestCd:0,buildCd:0,upgradeCd:0,weaponLevel:1,multitoolLevel:1,armorLevel:0,`,"player armor state");
  s=required(s,
`    core:{id:id(),x:WORLD.cx,y:WORLD.cy,r:74,level:1,hp:1200,maxHp:1200,heal:0.5,turret:1,light:260},`,
`    core:{id:id(),x:WORLD.cx,y:WORLD.cy,r:74,level:1,hp:1200,maxHp:1200,heal:0.5,turret:1,light:260,turretCd:0,turretAngle:0},`,"initial core turret");
  s=s.replaceAll(`room.core={id:room.core.id,x:WORLD.cx,y:WORLD.cy,r:74,level:1,hp:1200,maxHp:1200,heal:.5,turret:1,light:260};`,`room.core={id:room.core.id,x:WORLD.cx,y:WORLD.cy,r:74,level:1,hp:1200,maxHp:1200,heal:.5,turret:1,light:260,turretCd:0,turretAngle:0};`);
  s=required(s,
`function damagePlayer(p,a,cause="unknown"){
  if(p.downed)return;
  p.hp-=a;`,
`function damagePlayer(p,a,cause="unknown"){
  if(p.downed)return;
  a=Math.max(0,Number(a)||0)*(1-armorReduction(p.armorLevel));
  p.hp-=a;`,"armor damage reduction");
  s=required(s,
`  pay(p.inventory,cost);
  if(item==="heal"){`,
`  pay(p.inventory,cost);
  if(item==="armor"){
    if((p.armorLevel||0)>0){p.inventory.wood+=cost.wood||0;p.inventory.stone+=cost.stone||0;p.inventory.scrap+=cost.scrap||0;send(p.ws,"notice",{text:"Броня уже куплена — улучшайте её в мастерской"});return false;}
    p.armorLevel=1;send(p.ws,"notice",{text:"Куплена лёгкая броня: защита 10%. Улучшения доступны в мастерской"});return true;
  }
  if(item==="heal"){`,"buy armor");
  s=required(s,
`function upgradeRunEquipment(room,p,kind){
  kind=kind==="multitool"?"multitool":"weapon";
  if(dist(p,room.core)>RUN_SHOP_RADIUS){send(p.ws,"notice",{text:"Улучшения доступны только рядом с генератором"});return false;}
  const field=kind==="multitool"?"multitoolLevel":"weaponLevel";
  const current=Math.max(1,Math.min(EQUIPMENT_MAX_LEVEL,Number(p[field])||1));`,
`function upgradeRunEquipment(room,p,kind){
  kind=kind==="armor"?"armor":kind==="multitool"?"multitool":"weapon";
  if(dist(p,room.core)>RUN_SHOP_RADIUS){send(p.ws,"notice",{text:"Улучшения доступны только рядом с генератором"});return false;}
  if(kind==="armor"&&!(p.armorLevel>0)){send(p.ws,"notice",{text:"Сначала купите броню в магазине генератора"});return false;}
  const field=kind==="armor"?"armorLevel":kind==="multitool"?"multitoolLevel":"weaponLevel";
  const current=Math.max(1,Math.min(EQUIPMENT_MAX_LEVEL,Number(p[field])||1));`,"armor upgrade kind");
  s=required(s,
`  const next=current+1,cost=(kind==="multitool"?MULTITOOL_UPGRADE_COSTS:WEAPON_UPGRADE_COSTS)[next];`,
`  const next=current+1,cost=(kind==="armor"?ARMOR_UPGRADE_COSTS:kind==="multitool"?MULTITOOL_UPGRADE_COSTS:WEAPON_UPGRADE_COSTS)[next];`,"armor upgrade cost");
  s=required(s,
`  const label=kind==="multitool"?MULTITOOL_NAMES[next]:\`${'${WEAPONS[p.weapon?.type]?.name||"Оружие"}'} ур. ${'${next}'}\`;`,
`  const label=kind==="armor"?\`Броня ур. ${'${next}'} · защита ${'${Math.round(armorReduction(next)*100)}'}%\`:kind==="multitool"?MULTITOOL_NAMES[next]:\`${'${WEAPONS[p.weapon?.type]?.name||"Оружие"}'} ур. ${'${next}'}\`;`,"armor upgrade label");
  s=required(s,
`  }

  for(const n of room.resources){
    if(!n.alive){`,
`  }

  room.core.turretCd=Math.max(0,(room.core.turretCd||0)-dt);
  if(room.core.level>=2&&room.core.turretCd<=0&&room.zombies.length){
    const target=room.zombies.filter(z=>z.hp>0&&dist(room.core,z)<620).sort((a,b)=>dist(room.core,a)-dist(room.core,b))[0];
    if(target){
      const owner=room.players.get(room.hostId)||[...room.players.values()][0]||null;
      const raw=72+room.wave*2.2+(room.core.level-2)*14;
      const dealt=damageZombie(target,raw*(room.core.turret||1),"ranged");
      target.lastHit=owner?.id||0;if(owner)owner.runStats.damage=(owner.runStats.damage||0)+dealt;
      room.core.turretAngle=Math.atan2(target.y-room.core.y,target.x-room.core.x);
      room.core.turretCd=Math.max(.38,.82-(room.core.level-2)*.08);
      addEffect(room,{type:"coreTurretShot",x:room.core.x,y:room.core.y,x2:target.x,y2:target.y,life:.16,maxLife:.16});
    }
  }

  for(const n of room.resources){
    if(!n.alive){`,"core turret combat");
  s=required(s,
`    poisonTime:p.poisonTime||0,burnTime:p.burnTime||0,weaponLevel:p.weaponLevel||1,multitoolLevel:p.multitoolLevel||1,`,
`    poisonTime:p.poisonTime||0,burnTime:p.burnTime||0,weaponLevel:p.weaponLevel||1,multitoolLevel:p.multitoolLevel||1,armorLevel:p.armorLevel||0,armorReduction:armorReduction(p.armorLevel),`,"serialize armor");
  s=required(s,
`      const kind=m.kind==="multitool"?"multitool":"weapon";`,
`      const kind=m.kind==="armor"?"armor":m.kind==="multitool"?"multitool":"weapon";`,"armor message routing");
  s+='\n/* DREAD SHIFT v8.6 server */\n';write("server.js",s);return true;
}

function patchClient(){
  let s=read("public/client.js");
  if(s.includes("/* DREAD SHIFT v8.6 client */"))return false;
  s=required(s,
`const runShopInfo={
  micro_uzi:`,
`const runShopInfo={
  armor:{cost:{wood:12,stone:18,scrap:55}},
  micro_uzi:`,"client armor shop item");
  s=required(s,
`  heal:{cost:{wood:0,stone:0,scrap:28}}
};`,
`  heal:{cost:{wood:0,stone:0,scrap:28}}
};
const armorUpgradeCosts={2:{wood:20,stone:28,scrap:72},3:{wood:34,stone:46,scrap:125},4:{wood:52,stone:70,scrap:205},5:{wood:78,stone:105,scrap:330}};
const armorProtection=[0,10,18,26,34,42];`,"client armor progression");
  s=required(s,
`function runShopItemName(id){return id==="heal"?T("Аптечка","Medkit"):(weaponNames[id]||id);}`,
`function runShopItemName(id){return id==="armor"?T("Броня выжившего","Survivor armor"):id==="heal"?T("Аптечка","Medkit"):(weaponNames[id]||id);}`,"armor name");
  s=required(s,
`  const sig=JSON.stringify([lang,p.weapon?.type,p.inventory?.wood||0,p.inventory?.stone||0,p.inventory?.scrap||0,p.inventory?.medkits||0,pendingRunBuy?.item||""]);`,
`  const sig=JSON.stringify([lang,p.weapon?.type,p.armorLevel||0,p.inventory?.wood||0,p.inventory?.stone||0,p.inventory?.scrap||0,p.inventory?.medkits||0,pendingRunBuy?.item||""]);`,"shop armor signature");
  s=required(s,
`    const current=id!=="heal"&&p.weapon?.type===id;`,
`    const current=id==="armor"?(p.armorLevel||0)>0:id!=="heal"&&p.weapon?.type===id;`,"armor purchased state");
  s=required(s,
`    const image=id==="heal"?\`<div class="run-shop-icon">🩹</div>\`:\`<img src="${'${weaponImagePaths[id]}'}" alt="">\`;`,
`    const image=id==="armor"?\`<div class="run-shop-icon">🛡️</div>\`:id==="heal"?\`<div class="run-shop-icon">🩹</div>\`:\`<img src="${'${weaponImagePaths[id]}'}" alt="">\`;`,"armor shop visual");
  s=required(s,
`    const desc=id==="heal"?T("Добавляет одну аптечку в слот 3.","Adds one medkit to slot 3."):T(\`Оружие для текущего забега${'${waveHint}'}. Покупка сразу экипирует его.\`,\`Weapon for the current run${'${waveHint}'}. Buying it equips it immediately.\`);`,
`    const desc=id==="armor"?T("Снижает входящий урон на 10%. После покупки броню можно улучшать в мастерской.","Reduces incoming damage by 10%. Upgrade it in the workshop after purchase."):id==="heal"?T("Добавляет одну аптечку в слот 3.","Adds one medkit to slot 3."):T(\`Оружие для текущего забега${'${waveHint}'}. Покупка сразу экипирует его.\`,\`Weapon for the current run${'${waveHint}'}. Buying it equips it immediately.\`);`,"armor shop description");
  s=required(s,
`  const kind=runUpgradeTab==="multitool"?"multitool":"weapon",level=Math.max(1,Math.min(5,Number(kind==="multitool"?p.multitoolLevel:p.weaponLevel)||1)),next=Math.min(5,level+1),cost=(kind==="multitool"?multitoolUpgradeCosts:weaponUpgradeCosts)[next];`,
`  const kind=runUpgradeTab==="armor"?"armor":runUpgradeTab==="multitool"?"multitool":"weapon",level=kind==="armor"?Math.max(0,Math.min(5,Number(p.armorLevel)||0)):Math.max(1,Math.min(5,Number(kind==="multitool"?p.multitoolLevel:p.weaponLevel)||1)),next=Math.min(5,level+1),cost=(kind==="armor"?armorUpgradeCosts:kind==="multitool"?multitoolUpgradeCosts:weaponUpgradeCosts)[next];`,"armor workshop state");
  s=required(s,
`  const oldName=kind==="multitool"?multitoolName(level):\`${'${weaponNames[p.weapon.type]||T("Оружие","Weapon")}'} · ${'${T("ур.","lvl")}'} ${'${level}'}\`;
  const nextName=kind==="multitool"?multitoolName(next):\`${'${weaponNames[p.weapon.type]||T("Оружие","Weapon")}'} · ${'${T("ур.","lvl")}'} ${'${next}'}\`;
  const oldVisual=kind==="multitool"?multitoolMini(level):\`<img src="${'${weaponImagePaths[p.weapon.type]||weaponImagePaths.pistol}'}" alt="">\`,nextVisual=kind==="multitool"?multitoolMini(next):\`<img src="${'${weaponImagePaths[p.weapon.type]||weaponImagePaths.pistol}'}" alt="">\`;
  const gain=kind==="multitool"?multitoolCompareHtml(level,next,p,maxed):(maxed?T("Максимальная мощность достигнута","Maximum power reached"):T("+16% урона и +4.5% скорострельности за уровень.","+16% damage and +4.5% fire rate per level."));`,
`  const oldName=kind==="armor"?(level?\`${'${T("Броня","Armor")}'} · ${'${T("ур.","lvl")}'} ${'${level}'}\`:T("Броня не куплена","Armor not purchased")):kind==="multitool"?multitoolName(level):\`${'${weaponNames[p.weapon.type]||T("Оружие","Weapon")}'} · ${'${T("ур.","lvl")}'} ${'${level}'}\`;
  const nextName=kind==="armor"?\`${'${T("Броня","Armor")}'} · ${'${T("ур.","lvl")}'} ${'${next}'}\`:kind==="multitool"?multitoolName(next):\`${'${weaponNames[p.weapon.type]||T("Оружие","Weapon")}'} · ${'${T("ур.","lvl")}'} ${'${next}'}\`;
  const armorIcon=lvl=>\`<div class="run-shop-icon armor-preview" style="filter:brightness(${'${1+lvl*.1}'})">🛡️</div>\`,oldVisual=kind==="armor"?armorIcon(level):kind==="multitool"?multitoolMini(level):\`<img src="${'${weaponImagePaths[p.weapon.type]||weaponImagePaths.pistol}'}" alt="">\`,nextVisual=kind==="armor"?armorIcon(next):kind==="multitool"?multitoolMini(next):\`<img src="${'${weaponImagePaths[p.weapon.type]||weaponImagePaths.pistol}'}" alt="">\`;
  const gain=kind==="armor"?(level===0?T("Сначала купите броню в магазине генератора.","Buy armor in the generator shop first."):maxed?T(\`Максимальная защита: ${'${armorProtection[level]}'}%\`,\`Maximum protection: ${'${armorProtection[level]}'}%\`):T(\`Защита от любого урона: ${'${armorProtection[level]}'}% → ${'${armorProtection[next]}'}%\`,\`Damage reduction: ${'${armorProtection[level]}'}% → ${'${armorProtection[next]}'}%\`)):kind==="multitool"?multitoolCompareHtml(level,next,p,maxed):(maxed?T("Максимальная мощность достигнута","Maximum power reached"):T("+16% урона и +4.5% скорострельности за уровень.","+16% damage and +4.5% fire rate per level."));`,"armor workshop content");
  s=required(s,
`  $("runUpgradeContent").innerHTML=\`<div class="equipment-compare">`,
`  const unavailable=kind==="armor"&&level===0;
  $("runUpgradeContent").innerHTML=\`<div class="equipment-compare">`,"armor unavailable state");
  s=required(s,
`${'${maxed||!affordable||pendingRunUpgrade?"disabled":""}'}`,`${'${maxed||unavailable||!affordable||pendingRunUpgrade?"disabled":""}'}`,"disable unowned armor upgrade");
  s=required(s,
`  // Fully circular generator silhouette: concentric armored rings, no square/cog collision illusion.`,
`  // Upgraded levels add visible armor bands and a center-mounted automatic turret.
  if(core.level>=2){ctx.strokeStyle=core.level>=4?"#86a8a0":"#668079";ctx.lineWidth=5+core.level;ctx.setLineDash([18,8]);ctx.beginPath();ctx.arc(s.x,s.y,core.r+11,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  // Fully circular generator silhouette: concentric armored rings, no square/cog collision illusion.`,"core upgraded skin");
  s=required(s,
`  ctx.fillStyle="#d9ffe3";ctx.beginPath();ctx.arc(s.x-8,s.y-8,6,0,Math.PI*2);ctx.fill();`,
`  ctx.fillStyle="#d9ffe3";ctx.beginPath();ctx.arc(s.x-8,s.y-8,6,0,Math.PI*2);ctx.fill();
  if(core.level>=2){const a=Number(core.turretAngle)||0;ctx.save();ctx.translate(s.x,s.y);ctx.rotate(a);ctx.fillStyle="#1c2928";ctx.strokeStyle="#83c9ad";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,17,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle="#718b84";rr(4,-5,35,10,4);ctx.fill();ctx.strokeStyle="#b9e8d3";ctx.stroke();ctx.restore();}`,"core turret skin");
  s=required(s,
`  // Sleeved upper arms, then skin forearms angled naturally toward the weapon.
  ctx.strokeStyle=jacket;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(4,-12);ctx.lineTo(14,-10);ctx.moveTo(4,12);ctx.lineTo(14,10);ctx.stroke();
  ctx.strokeStyle="#c99773";ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(13,-9);ctx.lineTo(22,-4);ctx.moveTo(13,9);ctx.lineTo(22,4);ctx.stroke();
  ctx.fillStyle="#d5a77e";ctx.strokeStyle="#3b281f";ctx.lineWidth=1.5;
  for(const yy of [-4,4]){ctx.beginPath();ctx.arc(22,yy,4.2,0,Math.PI*2);ctx.fill();ctx.stroke();}`,
`  // Arms hold the weapon low and forward instead of folding both hands across the face.
  ctx.strokeStyle=jacket;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(2,-12);ctx.lineTo(13,-13);ctx.lineTo(23,-8);ctx.moveTo(2,12);ctx.lineTo(11,14);ctx.lineTo(20,9);ctx.stroke();
  ctx.strokeStyle="#c99773";ctx.lineWidth=5.5;ctx.beginPath();ctx.moveTo(22,-8);ctx.lineTo(31,-5);ctx.moveTo(19,9);ctx.lineTo(28,5);ctx.stroke();
  ctx.fillStyle="#d5a77e";ctx.strokeStyle="#3b281f";ctx.lineWidth=1.5;for(const pt of [[31,-5],[28,5]]){ctx.beginPath();ctx.arc(pt[0],pt[1],3.8,0,Math.PI*2);ctx.fill();ctx.stroke();}`,"natural arm pose");
  s=required(s,
`  // Head is forward of the shoulders instead of sitting inside the gun sprite.`,
`  if((p.armorLevel||0)>0){const al=Math.min(5,p.armorLevel);ctx.fillStyle=al>=4?"#799b98":"#546b69";ctx.strokeStyle="#182426";ctx.lineWidth=2;rr(-5,-17,10,8,3);ctx.fill();ctx.stroke();rr(-5,9,10,8,3);ctx.fill();ctx.stroke();ctx.strokeStyle=al>=3?"#9ad1c2":"#718e87";ctx.lineWidth=2+al*.35;ctx.beginPath();ctx.moveTo(-1,-10);ctx.lineTo(13,-10);ctx.moveTo(-1,10);ctx.lineTo(13,10);ctx.stroke();}

  // Head is forward of the shoulders instead of sitting inside the gun sprite.`,"player armor skin");
  s=required(s,
`    if(e.type==="acid"){`,
`    if(e.type==="coreTurretShot"){const b=sc(e.x2,e.y2);ctx.strokeStyle=\`rgba(137,255,194,${'${fade}'})\`;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.fillStyle=\`rgba(235,255,241,${'${fade}'})\`;ctx.beginPath();ctx.arc(b.x,b.y,5,0,Math.PI*2);ctx.fill();}
    if(e.type==="acid"){`,"core turret shot effect");
  s+='\n/* DREAD SHIFT v8.6 client */\n';write("public/client.js",s);return true;
}

function patchHtml(){
  let s=read("public/index.html");if(s.includes("<!-- DREAD SHIFT v8.6 -->"))return false;
  s=required(s,`        <button data-upgrade-tab="multitool" type="button">МУЛЬТИТУЛ</button>`,`        <button data-upgrade-tab="multitool" type="button">МУЛЬТИТУЛ</button>\n        <button data-upgrade-tab="armor" type="button">БРОНЯ</button>`,"armor workshop tab");
  s+='\n<!-- DREAD SHIFT v8.6 -->\n';write("public/index.html",s);return true;
}

console.log("DREAD SHIFT v8.6 applied:",JSON.stringify({server:patchServer(),client:patchClient(),html:patchHtml()}));
