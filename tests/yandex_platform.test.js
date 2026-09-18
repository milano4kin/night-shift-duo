"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),read=f=>fs.readFileSync(path.join(root,f),"utf8");

test("Yandex backend patch provides passwordless guest sessions and rewarded server authority",()=>{
  const p=read("dread_shift_yandex_backend_patch.js");
  assert.match(p,/\/api\/yandex\/session/);
  assert.match(p,/getOrCreateYandexAccount/);
  assert.match(p,/platform:"yandex"/);
  assert.match(p,/Access-Control-Allow-Origin/);
  assert.match(p,/m\.type==="yandexRewarded"/);
  assert.match(p,/\+20 золота/);
  assert.match(p,/now-last<60000/);
});

test("Yandex bridge uses required SDK lifecycle integrations",()=>{
  const b=read("yandex/yandex_bridge.js");
  assert.match(b,/YaGames\.init\(\)/);
  assert.match(b,/ysdk\.getPlayer\(\)/);
  assert.match(b,/getUniqueID\(\)/);
  assert.match(b,/environment\?\.i18n\?\.lang/);
  assert.match(b,/LoadingAPI\?\.ready\(\)/);
  assert.match(b,/GameplayAPI\?\.start\(\)/);
  assert.match(b,/GameplayAPI\?\.stop\(\)/);
  assert.match(b,/game_api_pause/);
  assert.match(b,/game_api_resume/);
  assert.match(b,/showFullscreenAdv/);
  assert.match(b,/showRewardedVideo/);
  assert.match(b,/visibilitychange/);
  assert.match(b,/contextmenu/);
  assert.match(b,/player\.setData/);
});

test("Yandex archive builder validates publication constraints",()=>{
  const s=read("scripts/build_yandex.js"),pkg=JSON.parse(read("package.json"));
  assert.match(s,/100\*1024\*1024/);
  assert.match(s,/root index\.html missing/);
  assert.match(s,/Yandex archive filename is not allowed/);
  assert.match(s,/\/sdk\.js/);
  assert.match(s,/YANDEX_BACKEND_URL/);
  assert.match(s,/terser\.minify/);
  assert.match(s,/createZip/);
  assert.equal(pkg.scripts["build:yandex"],"npm run patch:runtime && node scripts/build_yandex.js");
  assert.equal(pkg.scripts["audit:yandex"],"node scripts/yandex_integration_audit.js");
  assert.match(pkg.scripts["patch:runtime"],/dread_shift_yandex_backend_patch\.js/);
});

test("Yandex release does not replace the normal web production build",()=>{
  const pkg=JSON.parse(read("package.json"));
  assert.equal(pkg.scripts["build:prod"],"npm run patch:runtime && node scripts/protect_client.js");
  assert.equal(pkg.scripts["start:prod"],"node db_bridge.js");
});
