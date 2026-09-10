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
