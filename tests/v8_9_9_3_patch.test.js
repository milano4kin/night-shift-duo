"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),read=f=>fs.readFileSync(path.join(root,f),"utf8");

test("all attacking towers expose their authoritative attack radius",()=>{
  const client=read("public/client.js");
  assert.match(client,/TOWER_ATTACK_RANGES=Object\.freeze\(\{cannon:520,tesla:400,cat_tower:125,frost_tower:430,flame_tower:185\}\)/);
  assert.match(client,/hovered&&activeTool==="multitool"\)drawTowerAttackRange\(s\.x,s\.y,st\.type/);
  assert.match(client,/towerAttackRange\(selectedBuild\)>0\)drawTowerAttackRange\(s\.x,s\.y,selectedBuild/);
  assert.doesNotMatch(client,/TOWER_ATTACK_RANGES[^\n]*(?:wall|gate|spikes):/);
});

test("connected wall upgrade is server-authoritative and atomic",()=>{
  const server=read("server.js");
  assert.match(server,/function connectedWallGroup\(room,seed\)/);
  assert.match(server,/Math\.hypot\(x\.x-y\.x,x\.y-y\.y\)<=15/);
  assert.match(server,/const group=connectedWallGroup\(room,seed\),targets=group\.filter\(st=>\(st\.level\|\|1\)<5\)/);
  assert.match(server,/if\(!hasCost\(p\.inventory,total\)\).*return send/s);
  assert.match(server,/pay\(p\.inventory,total\);p\.upgradeCd=\.25/);
  assert.match(server,/st\.level=\(st\.level\|\|1\)\+1;st\.power=1\+\(st\.level-1\)\*\.25/);
  assert.match(server,/if\(m\.type==="structureUpgradeAll"\)upgradeConnectedWalls\(room,p,m\.structureId\)/);
});

test("wall menu shows upgrade all with connected count and total cost",()=>{
  const client=read("public/client.js"),html=read("public/index.html");
  assert.match(html,/id="structureUpgradeAllBtn"/);
  assert.match(client,/function connectedWallGroupLocal\(seed\)/);
  assert.match(client,/function sumStructureUpgradeCosts\(items\)/);
  assert.match(client,/⬆ Улучшить всё \(\$\{upgradeable\.length\}\/\$\{group\.length\}\)/);
  assert.match(client,/send\("structureUpgradeAll",\{structureId:st\.id\}\)/);
});

test("tower range and wall group patch remains last in the runtime chain",()=>{
  const pkg=require(path.join(root,"package.json"));
  assert.match(pkg.scripts["patch:runtime"],/dread_shift_v8_9_9_2_patch\.js && node dread_shift_v8_9_9_3_patch\.js$/);
});
