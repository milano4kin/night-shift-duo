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

test("movement and HUD patches remain enabled in release order",()=>{
  const pkg=require(path.join(root,"package.json"));
  assert.equal(pkg.version,"8.6.0");
  assert.match(pkg.scripts.start,/dread_shift_v8_5_4_patch\.js && node dread_shift_v8_6_patch\.js && node db_bridge\.js$/);
});

test("notification bell stays in the top-right corner",()=>{
  const patch=fs.readFileSync(path.join(root,"dread_shift_v8_4_patch.js"),"utf8");
  assert.match(patch,/\.notification-bell\{top:14px!important;right:14px!important\}/);
  assert.match(patch,/\.notification-center\{top:68px!important;right:14px!important\}/);
});

test("v8.5.2 fixes every weapon label and restricts QA admin to cattencel",()=>{
  const patch=fs.readFileSync(path.join(root,"dread_shift_v8_5_2_patch.js"),"utf8");
  const pkg=require(path.join(root,"package.json"));
  assert.equal(pkg.version,"8.6.0");
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
