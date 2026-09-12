"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");

test("v8.9.3 blocks persistent lobby economy actions during active runs",()=>{
  const server=read("server.js");
  assert.match(server,/\/\* DREAD SHIFT v8\.9\.3 server \*\//);
  assert.match(server,/room\?\.started.*Эта функция доступна только в лобби между забегами/s);
  assert.match(server,/metaShopBuy.*metaUpgradeBuy.*metaCrateOpen.*metaAchievementClaim/s);
});

test("v8.9.3 recovers websocket disconnects without leaving a stale room UI",()=>{
  const client=read("public/client.js");
  assert.match(client,/function scheduleReconnect\(\)/);
  assert.match(client,/connectionGeneration/);
  assert.match(client,/socket\.onclose=.*stopGameInput\(\)/s);
  assert.match(client,/socket\.onerror=\(\)=>\{\}/);
  assert.match(client,/sessionInvalid.*authOverlay/s);
});

test("v8.9.3 hardens auth, static paths and teammate snapshot privacy",()=>{
  const server=read("server.js");
  assert.match(server,/AUTH_ATTEMPT_WINDOW_MS=30000/);
  assert.match(server,/wss\.on\("connection",\(ws,req\)=>/);
  assert.match(server,/path\.resolve\(publicRoot,"\."\+url\)/);
  assert.match(server,/X-Content-Type-Options/);
  assert.match(server,/delete o\.silver.*delete o\.gold.*delete o\.crateTokens/s);
});

test("v8.9.3 flushes active players before database shutdown and waits for an in-flight sync",()=>{
  const server=read("server.js"),db=read("db_bridge.js");
  assert.match(server,/function stopRuntime\(\).*saveProgress\(p\).*saveAccounts\(\)/s);
  assert.match(db,/let syncPromise = null/);
  assert.match(db,/if \(syncPromise\) return syncPromise/);
  assert.match(db,/game\.stopRuntime\(\).*await syncAll\(\)/s);
});

test("release scripts use one canonical runtime patch chain and protection requires the audited client",()=>{
  const pkg=require(path.join(root,"package.json")),protect=read("scripts/protect_client.js");
  assert.equal(pkg.version,"8.9.9");
  assert.equal(pkg.scripts.start,"npm run patch:runtime && node db_bridge.js");
  assert.equal(pkg.scripts["build:prod"],"npm run patch:runtime && node scripts/protect_client.js");
  assert.match(pkg.scripts["patch:runtime"],/dread_shift_v8_9_2_patch\.js && node dread_shift_v8_9_3_patch\.js && node dread_shift_v8_9_4_patch\.js && node dread_shift_v8_9_5_patch\.js && node dread_shift_v8_9_6_patch\.js && node dread_shift_v8_9_7_patch\.js && node dread_shift_v8_9_8_patch\.js && node dread_shift_v8_9_9_patch\.js && node dread_shift_v8_9_9_1_patch\.js && node dread_shift_v8_9_9_2_patch\.js$/);
  assert.match(protect,/DREAD SHIFT v8\.9\.9 client/);
  assert.match(protect,/scheduleReconnect/);
});
