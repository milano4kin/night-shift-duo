"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..");

test("v8.5.1 movement patch stays isolated from connection and auth code",()=>{
  const patch=fs.readFileSync(path.join(root,"dread_shift_v8_5_1_patch.js"),"utf8");
  assert.doesNotMatch(patch,/new WebSocket|function connect\(|resumeSession|authRequired/);
  assert.match(patch,/sendMovementInputNow/);
  assert.match(patch,/camera\.x=tx;camera\.y=ty/);
});

test("movement and HUD patches remain enabled in canonical release order",()=>{
  const pkg=require(path.join(root,"package.json"));
  assert.equal(pkg.version,"8.9.5");
  assert.equal(pkg.scripts.start,"npm run patch:runtime && node db_bridge.js");
  assert.match(pkg.scripts["patch:runtime"],/restore:social.*dread_shift_v8_9_patch\.js.*dread_shift_v8_9_2_patch\.js.*dread_shift_v8_9_3_patch\.js.*dread_shift_v8_9_4_patch\.js.*dread_shift_v8_9_5_patch\.js/s);
});

test("notification bell stays in the top-right corner",()=>{
  const patch=fs.readFileSync(path.join(root,"dread_shift_v8_4_patch.js"),"utf8");
  assert.match(patch,/\.notification-bell\{top:14px!important;right:14px!important\}/);
  assert.match(patch,/\.notification-center\{top:68px!important;right:14px!important\}/);
});

test("v8.5.2 fixes every weapon label and restricts QA admin to cattencel",()=>{
  const patch=fs.readFileSync(path.join(root,"dread_shift_v8_5_2_patch.js"),"utf8");
  const pkg=require(path.join(root,"package.json"));
  assert.equal(pkg.version,"8.9.5");
  assert.match(patch,/\.weapon-slot \.slot-name/);
  assert.match(patch,/-webkit-line-clamp:2/);
  assert.match(patch,/===\"cattencel\"/);
  assert.match(patch,/qaAdminEnabled:isQaAdmin\(p\)/);
  assert.doesNotMatch(patch,/new WebSocket|function connect\(|resumeSession|authRequired/);
});

test("v8.5.3 charges silver for upgrades",()=>{
  const patch=fs.readFileSync(path.join(root,"dread_shift_v8_5_3_patch.js"),"utf8");
  assert.match(patch,/stripY=innerHeight-\(tiny\?158:164\)/);
  assert.match(patch,/Number\(m\.silver\|\|0\)<price/);
  assert.match(patch,/target\.silver-=price/);
});

test("v8.5.4 removes the duplicate weapon strip that overlaps context actions",()=>{
  const patch=fs.readFileSync(path.join(root,"dread_shift_v8_5_4_patch.js"),"utf8");
  assert.match(patch,/duplicate weapon strip/);
  assert.match(patch,/Compact ammo strip above the hotbar/);
});

test("v8.6 adds generator turret, armor, and natural arms without connection changes",()=>{
  const patch=fs.readFileSync(path.join(root,"dread_shift_v8_6_patch.js"),"utf8");
  assert.match(patch,/hp:3000/);
  assert.match(patch,/coreTurretShot/);
  assert.match(patch,/ARMOR_REDUCTION/);
  assert.match(patch,/armorLevel/);
  assert.match(patch,/Arms hold the weapon low and forward/);
  assert.doesNotMatch(patch,/new WebSocket|function connect\(|resumeSession|authRequired/);
});

test("v8.6.1 visibly separates elbows and moves the weapon ahead of the face",()=>{
  const patch=fs.readFileSync(path.join(root,"dread_shift_v8_6_1_patch.js"),"utf8");
  assert.match(patch,/lineTo\(-2,-22\)/);
  assert.match(patch,/lineTo\(-3,22\)/);
  assert.match(patch,/drawImage\(img,27-recoil/);
  assert.doesNotMatch(patch,/new WebSocket|function connect\(|resumeSession|authRequired/);
});

test("v8.6.2 balances generator levels and keeps armor only in workshop",()=>{
  const patch=fs.readFileSync(path.join(root,"dread_shift_v8_6_2_patch.js"),"utf8");
  assert.match(patch,/wood:100,stone:50, scrap:100/);
  assert.match(patch,/wood:200,stone:100,scrap:220/);
  assert.match(patch,/hp:4500/);
  assert.match(patch,/dual\?40:30/);
  assert.match(patch,/dist\(room\.core,z\)<330/);
  assert.match(patch,/remove armor shop card/);
});

test("v8.6.3 slows pets and removes exposed hands from the face",()=>{
  const patch=fs.readFileSync(path.join(root,"dread_shift_v8_6_3_patch.js"),"utf8");
  assert.match(patch,/Math\.min\(175,64\+d\*\.37\)/);
  assert.match(patch,/no exposed forearms or hands overlap the face/);
  assert.doesNotMatch(patch,/new WebSocket|function connect\(|resumeSession|authRequired/);
});

test("v8.7 updates visible version, gates lobby systems, and adds capped critical talents",()=>{
  const patch=fs.readFileSync(path.join(root,"dread_shift_v8_7_patch.js"),"utf8");
  assert.match(patch,/shop:lvl>=3,quests:lvl>=3/);
  assert.match(patch,/Math\.min\(\.15,\.05\+skillValue\(p,"crit_chance"\)\/100\)/);
  assert.match(patch,/critMult=1\.60\+skillValue\(p,"crit_damage"\)\/100/);
  assert.match(patch,/DREAD SHIFT v8\.7\.0/);
});

test("v8.7.1 outlines both barrels identically and makes spikes pass-through",()=>{
  const patch=fs.readFileSync(path.join(root,"dread_shift_v8_7_1_patch.js"),"utf8");
  assert.match(patch,/for\(const y of \[-11,3\]\)/);
  assert.match(patch,/if\(st\.type==="spikes"\)continue/);
  assert.match(patch,/DREAD SHIFT v8\.7\.1/);
});

test("v8.7.2 restores straight arms without detached hand sprites",()=>{
  const patch=fs.readFileSync(path.join(root,"dread_shift_v8_7_2_patch.js"),"utf8");
  assert.match(patch,/Two clean, straight arms point forward/);
  assert.match(patch,/remove detached hands sprite/);
  assert.match(patch,/lineTo\(30,-5\)/);
});
