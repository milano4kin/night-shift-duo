"use strict";
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const bridge=read("yandex/yandex_bridge.js");
const build=read("scripts/build_yandex.js");
const html=read("public/index.html");
const client=read("public/client.js");
const guide=read("YANDEX_GAMES_GUIDE_RU.md");
const failures=[];
const fail=m=>failures.push(m);
const need=(src,needle,label)=>{if(!src.includes(needle))fail(label)};

need(bridge,"YaGames.init()","SDK init missing");
need(bridge,"environment?.i18n?.lang","SDK language detection missing");
need(bridge,"LoadingAPI?.ready()","LoadingAPI.ready missing");
need(bridge,"GameplayAPI?.start()","GameplayAPI.start missing");
need(bridge,"GameplayAPI?.stop()","GameplayAPI.stop missing");
need(bridge,'ysdk.on("game_api_pause"',"game_api_pause handler missing");
need(bridge,'ysdk.on("game_api_resume"',"game_api_resume handler missing");
need(bridge,"visibilitychange","visibility pause missing");
need(bridge,'querySelectorAll("audio,video")',"media pause missing");
need(bridge,"showFullscreenAdv","fullscreen ads missing");
need(bridge,"showRewardedVideo","rewarded ads missing");
need(bridge,"onRewarded:","reward callback missing");
need(bridge,'closest("#retryRunBtn")',"fullscreen logical break target missing");
need(bridge,'contextmenu',"context-menu suppression missing");
need(bridge,'ysdk.getPlayer()',"guest/player bootstrap missing");
need(bridge,'getUniqueID()',"player identity missing");
need(bridge,'player.setData',"Yandex cloud data call missing");
need(bridge,'await createBackendSession();\n    installCloudTelemetry();',"cloud save starts before Player initialization");
if(/setInterval\([^)]*showFullscreenAdv/s.test(bridge))fail("fullscreen ad must not be timer-driven during gameplay");

need(build,'<script src="/sdk.js"></script>',"official /sdk.js include missing");
need(build,"100*1024*1024","100 MB archive limit missing");
need(build,"root index.html missing","root index validation missing");
need(build,"Yandex archive filename is not allowed","filename validation missing");
need(build,"YANDEX_BACKEND_URL","backend injection missing");
need(build,'html.yandex-build #authOverlay{display:none!important}',"third-party auth is not hidden in Yandex build");
need(build,'#createLobbyBtn',"DUO create-lobby control is not hidden in first Yandex release");
need(build,'#showJoinBtn',"DUO join control is not hidden in first Yandex release");
need(build,"terser.minify","Yandex client minification missing");

if(/<a\s+[^>]*href=["']https?:\/\//i.test(html))fail("external HTTP link exists in game HTML");
if(/window\.open\s*\(/.test(client))fail("external window.open call exists in game client");
if(/location\.(?:href|assign|replace)\s*=?.*https?:\/\//.test(client))fail("external redirect exists in game client");

for(const phrase of [
  "Desktop / Компьютеры",
  "Russian",
  "English",
  "CSP / Allowed hosts",
  "Open draft with debug panel",
  "Game Ready",
  "Rewarded ad",
  "Submit for moderation",
  "3–5"
]) if(!guide.includes(phrase))fail("guide missing publication item: "+phrase);

if(failures.length){
  for(const f of failures)console.error("[yandex-preflight] FAIL:",f);
  process.exit(1);
}
console.log("[yandex-preflight] PASS: SDK, lifecycle, ads, guest start, archive, links and guide checks");
