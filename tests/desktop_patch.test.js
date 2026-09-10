"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const game = require("../server");

const root = path.join(__dirname, "..");

test("pet abilities use the authoritative follower position", () => {
  assert.deepEqual(game.petWorldPos({ slot: 1, x: 500, y: 400, petX: 351, petY: 472 }), { x: 351, y: 472 });
  assert.deepEqual(game.petWorldPos({ slot: 2, x: 500, y: 400 }), { x: 604, y: 472 });
});

test("desktop HUD exposes telemetry and top-right settings controls", () => {
  const html = fs.readFileSync(path.join(root, "public", "index.html"), "utf8");
  assert.match(html, /id="quickSettingsBtn"/);
  assert.match(html, /id="performanceHud"/);
  assert.match(html, /id="settingPerformanceHud"/);
});

test("spawn courtyard pattern is stable in world coordinates", () => {
  const client = fs.readFileSync(path.join(root, "public", "client.js"), "utf8");
  assert.match(client, /worldHash\(wx,wy,7\)/);
  assert.doesNotMatch(client, /worldHash\(Math\.round\(x\),Math\.round\(y\),7\)/);
});

test("account login supports persistent revocable browser sessions", () => {
  const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
  const client = fs.readFileSync(path.join(root, "public", "client.js"), "utf8");
  assert.match(server, /SESSION_TTL_MS = 5 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(server, /m\.type==="resumeSession"/);
  assert.match(server, /revokeAccountSession\(account,sessionHash\)/);
  assert.match(client, /storageGet\(sessionKey\)/);
  assert.match(client, /storageRemove\(sessionKey\)/);
});

test("floor changes immediately after every fifth cleared wave", () => {
  assert.equal(game.floorStageForRoom({wave:5,phase:"night"}),0);
  assert.equal(game.floorStageForRoom({wave:5,phase:"day"}),1);
  assert.equal(game.floorStageForRoom({wave:10,phase:"day"}),2);
  assert.equal(game.floorStageForRoom({wave:50,phase:"victory"}),9);
});

test("generator exposes shop and five-level equipment workshop", () => {
  const html = fs.readFileSync(path.join(root, "public", "index.html"), "utf8");
  const client = fs.readFileSync(path.join(root, "public", "client.js"), "utf8");
  const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
  const css = fs.readFileSync(path.join(root, "public", "style.css"), "utf8");
  assert.match(html, /data-core-action="shop"/);
  assert.match(html, /data-core-action="upgrade"/);
  assert.match(html, /data-upgrade-tab="multitool"/);
  assert.match(client, /multitoolMini\(next\)/);
  assert.match(css, /tool-level-5/);
  assert.match(server, /EQUIPMENT_MAX_LEVEL=5/);
  assert.match(server, /m\.type==="runEquipmentUpgrade"/);
});

test("equipment upgrades charge resources and stop at level five", () => {
  const room={core:{x:100,y:100}};
  const p={ws:{readyState:-1},x:100,y:100,weapon:{type:"pistol"},inventory:{wood:999,stone:999,scrap:999},weaponLevel:1,multitoolLevel:1};
  assert.equal(game.upgradeRunEquipment(room,p,"multitool"),true);
  assert.equal(p.multitoolLevel,2);
  assert.deepEqual(p.inventory,{wood:983,stone:987,scrap:957});
  p.multitoolLevel=5;
  assert.equal(game.upgradeRunEquipment(room,p,"multitool"),false);
  assert.equal(p.multitoolLevel,5);
});

test("talents replace the in-game Index rail and the site has a custom icon", () => {
  const html=fs.readFileSync(path.join(root,"public","index.html"),"utf8");
  const css=fs.readFileSync(path.join(root,"public","style.css"),"utf8");
  assert.doesNotMatch(html,/id="indexBookBtn"/);
  assert.doesNotMatch(html,/id="railIndexBtn"/);
  assert.match(html,/rel="icon"[^>]+night-shift-duo-icon\.png/);
  assert.match(css,/Talents now occupy the former left-side Index slot/);
  assert.ok(fs.statSync(path.join(root,"public","assets","night-shift-duo-icon.png")).size>10000);
});
