"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
test("v8.9 removes redundant boss team-loot toast",()=>{
  const server=read("server.js");
  assert.doesNotMatch(server,/send\(receiver\.ws,"notice",\{text:`🎁 Командная добыча с босса/);
  assert.match(server,/send\(receiver\.ws,'bossLoot'/);
});
test("v8.9 uses swept bullet collision for point-blank targets",()=>{
  const server=read("server.js");
  assert.match(server,/prevX:p\.x,prevY:p\.y/);
  assert.match(server,/pointSegmentDistance\(z\.x,z\.y,bulletFromX,bulletFromY,b\.x,b\.y\)/);
});
test("v8.9 shows claim and only-upgradeable talent attention",()=>{
  const client=read("public/client.js"),html=read("public/index.html"),css=read("public/style.css");
  assert.match(client,/updateMetaAttention/);assert.match(client,/questReady/);assert.match(client,/achievementReady/);
  assert.match(client,/showLevelUp/);assert.match(client,/function v899CanUpgradeTalent\(p\)/);
  assert.match(client,/Object\.entries\(talentDefs\).*cfg\.max/s);
  assert.match(client,/talentDock\.classList\.toggle\("attention",v899CanUpgradeTalent\(p\)\)/);
  assert.match(html,/wallSnapToggle/);assert.match(css,/\.attention::after/);
});
test("v8.9 doubles wall durability and tightens placement",()=>{
  const server=read("server.js"),client=read("public/client.js");
  assert.match(server,/wall:\s*\{[^\n]*hp:680/);assert.match(server,/const WALL_HALF_THICK=13/);
  assert.match(client,/wallSnapEnabled=true/);assert.match(client,/wallSnapEnabled\?state\.structures:\[\]/);assert.match(client,/const WALL_HALF_THICK=13/);
  assert.match(client,/e\.code==="KeyT"&&!e\.repeat&&isWallBuild\(selectedBuild\)/);assert.match(client,/bestD=64/);
  assert.doesNotMatch(read("public/style.css"),/#lobbyMetaNav \[data-lobby-pane\],\.talent-dock\{position:relative\}/);
});
test("canonical runtime restores cosmetics and friend requests before later patches and protection",()=>{
  const pkg=require(path.join(root,"package.json"));
  assert.match(pkg.scripts["patch:runtime"],/restore:social/);
  assert.match(pkg.scripts["restore:social"],/restore_social\.js/);
  assert.match(pkg.scripts["patch:runtime"],/dread_shift_v8_9_9_patch\.js && node dread_shift_v8_9_9_1_patch\.js$/);
  assert.equal(pkg.scripts["build:prod"],"npm run patch:runtime && node scripts/protect_client.js");
  const restore=read("scripts/restore_social.js");
  assert.match(restore,/dread_shift_v8_8_patch\.js.*dread_shift_v8_8_1_patch\.js.*dread_shift_v8_8_2_patch\.js/s);
  assert.match(read("dread_shift_v8_9_patch.js"),/V88_COS.*v882Social/);
});
