"use strict";
const fs=require("fs"),path=require("path");
const file=r=>path.join(__dirname,r),read=r=>fs.readFileSync(file(r),"utf8"),write=(r,s)=>fs.writeFileSync(file(r),s,"utf8");
function required(s,a,b,label){if(!s.includes(a))throw Error(`v8.6.2 target missing: ${label}`);return s.replace(a,b);}

function server(){let s=read("server.js");if(s.includes("/* DREAD SHIFT v8.6.2 server */"))return false;
  s=required(s,'const BUILD_VERSION = "8.6.1";','const BUILD_VERSION = "8.6.2";',"version");
  s=required(s,`  armor:         { wood:12, stone:18, scrap:55  },\n`,"","remove armor from shop");
  s=required(s,
`  { level:2, cost:{wood:80, stone:55, scrap:70},  hp:3000, heal:1.2, turret:1.10, light:330 },
  { level:3, cost:{wood:130,stone:95, scrap:120}, hp:3800, heal:2.0, turret:1.22, light:410 },`,
`  { level:2, cost:{wood:100,stone:50, scrap:100}, hp:3000, heal:1.2, turret:1.00, light:330 },
  { level:3, cost:{wood:200,stone:100,scrap:220}, hp:4500, heal:2.0, turret:1.00, light:410 },`,"level 2 and 3 balance");
  s=required(s,
`const ARMOR_UPGRADE_COSTS={2:{wood:20,stone:28,scrap:72},3:{wood:34,stone:46,scrap:125},4:{wood:52,stone:70,scrap:205},5:{wood:78,stone:105,scrap:330}};`,
`const ARMOR_UPGRADE_COSTS={1:{wood:12,stone:18,scrap:55},2:{wood:20,stone:28,scrap:72},3:{wood:34,stone:46,scrap:125},4:{wood:52,stone:70,scrap:205},5:{wood:78,stone:105,scrap:330}};`,"armor purchase cost in workshop");
  s=required(s,
`  if(item==="armor"){
    if((p.armorLevel||0)>0){p.inventory.wood+=cost.wood||0;p.inventory.stone+=cost.stone||0;p.inventory.scrap+=cost.scrap||0;send(p.ws,"notice",{text:"Броня уже куплена — улучшайте её в мастерской"});return false;}
    p.armorLevel=1;send(p.ws,"notice",{text:"Куплена лёгкая броня: защита 10%. Улучшения доступны в мастерской"});return true;
  }
`,"","remove armor purchase handler");
  s=required(s,
`  if(kind==="armor"&&!(p.armorLevel>0)){send(p.ws,"notice",{text:"Сначала купите броню в магазине генератора"});return false;}
  const field=kind==="armor"?"armorLevel":kind==="multitool"?"multitoolLevel":"weaponLevel";
  const current=Math.max(1,Math.min(EQUIPMENT_MAX_LEVEL,Number(p[field])||1));`,
`  const field=kind==="armor"?"armorLevel":kind==="multitool"?"multitoolLevel":"weaponLevel";
  const current=kind==="armor"?Math.max(0,Math.min(EQUIPMENT_MAX_LEVEL,Number(p[field])||0)):Math.max(1,Math.min(EQUIPMENT_MAX_LEVEL,Number(p[field])||1));`,"armor starts in workshop");
  s=required(s,
`      const raw=72+room.wave*2.2+(room.core.level-2)*14;
      const dealt=damageZombie(target,raw*(room.core.turret||1),"ranged");
      target.lastHit=owner?.id||0;if(owner)owner.runStats.damage=(owner.runStats.damage||0)+dealt;
      room.core.turretAngle=Math.atan2(target.y-room.core.y,target.x-room.core.x);
      room.core.turretCd=Math.max(.38,.82-(room.core.level-2)*.08);
      addEffect(room,{type:"coreTurretShot",x:room.core.x,y:room.core.y,x2:target.x,y2:target.y,life:.16,maxLife:.16});`,
`      const dual=room.core.level>=3,raw=dual?40:30,angle=Math.atan2(target.y-room.core.y,target.x-room.core.x);
      const dealt=damageZombie(target,raw,"ranged");
      target.lastHit=owner?.id||0;if(owner)owner.runStats.damage=(owner.runStats.damage||0)+dealt;
      room.core.turretAngle=angle;room.core.turretBarrel=dual?((room.core.turretBarrel||0)^1):0;
      room.core.turretCd=dual?.34:.86;
      const side=dual?(room.core.turretBarrel?8:-8):0,ox=-Math.sin(angle)*side,oy=Math.cos(angle)*side;
      addEffect(room,{type:"coreTurretShot",x:room.core.x+ox,y:room.core.y+oy,x2:target.x,y2:target.y,life:.16,maxLife:.16});`,"balanced alternating turret");
  s=required(s,`z=>z.hp>0&&dist(room.core,z)<620`,`z=>z.hp>0&&dist(room.core,z)<330`,"one-square turret range");
  s=required(s,`  buy,upgradeRunEquipment,build,`,`  buy,upgradeCore,upgradeRunEquipment,build,`,"export core upgrade for verification");
  s+='\n/* DREAD SHIFT v8.6.2 server */\n';write("server.js",s);return true;}

function client(){let s=read("public/client.js");if(s.includes("/* DREAD SHIFT v8.6.2 client */"))return false;
  s=required(s,`  armor:{cost:{wood:12,stone:18,scrap:55}},\n`,"","remove armor shop card");
  s=required(s,
`const armorUpgradeCosts={2:{wood:20,stone:28,scrap:72},3:{wood:34,stone:46,scrap:125},4:{wood:52,stone:70,scrap:205},5:{wood:78,stone:105,scrap:330}};`,
`const armorUpgradeCosts={1:{wood:12,stone:18,scrap:55},2:{wood:20,stone:28,scrap:72},3:{wood:34,stone:46,scrap:125},4:{wood:52,stone:70,scrap:205},5:{wood:78,stone:105,scrap:330}};`,"client armor first level");
  s=required(s,
`  const unavailable=kind==="armor"&&level===0;
  $("runUpgradeContent").innerHTML=`,
`  const unavailable=false;
  $("runUpgradeContent").innerHTML=`,"armor purchasable in upgrade");
  s=required(s,
`const gain=kind==="armor"?(level===0?T("Сначала купите броню в магазине генератора.","Buy armor in the generator shop first.")`,
`const gain=kind==="armor"?(level===0?T("Купить лёгкую броню: защита от любого урона 10%.","Buy light armor: 10% damage reduction.")`,"armor upgrade copy");
  s=required(s,
`  if(core.level>=2){const a=Number(core.turretAngle)||0;ctx.save();ctx.translate(s.x,s.y);ctx.rotate(a);ctx.fillStyle="#1c2928";ctx.strokeStyle="#83c9ad";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,17,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle="#718b84";rr(4,-5,35,10,4);ctx.fill();ctx.strokeStyle="#b9e8d3";ctx.stroke();ctx.restore();}`,
`  if(core.level>=2){const a=Number(core.turretAngle)||0,dual=core.level>=3;ctx.save();ctx.translate(s.x,s.y);ctx.rotate(a);ctx.fillStyle="#1c2928";ctx.strokeStyle="#83c9ad";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,dual?20:17,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle="#718b84";if(dual){rr(3,-11,37,8,4);ctx.fill();rr(3,3,37,8,4);ctx.fill();}else{rr(4,-5,35,10,4);ctx.fill();}ctx.strokeStyle="#b9e8d3";ctx.stroke();ctx.restore();}`,"double-barrel visual");
  s+='\n/* DREAD SHIFT v8.6.2 client */\n';write("public/client.js",s);return true;}
console.log("DREAD SHIFT v8.6.2 applied:",JSON.stringify({server:server(),client:client()}));
