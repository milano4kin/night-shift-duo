"use strict";
/* DREAD SHIFT single audited restore patch 2026-09-18. */

/* ===== embedded lobby tools ===== */
(()=>{
"use strict";

const fs = require("fs");
const path = require("path");

function patchFile(file, replacements) {
  const target = path.join(__dirname, file);
  let source = fs.readFileSync(target, "utf8");
  const original = source;
  for (const [from, to] of replacements) {
    if (source.includes(from)) source = source.replace(from, to);
  }
  if (source !== original) fs.writeFileSync(target, source, "utf8");
  return source !== original;
}

function appendOnce(file, marker, text) {
  const target = path.join(__dirname, file);
  let source = fs.readFileSync(target, "utf8");
  if (source.includes(marker)) return false;
  source += `\n\n${text}\n`;
  fs.writeFileSync(target, source, "utf8");
  return true;
}

const htmlChanged = patchFile("public/index.html", [
  [
    '  <button id="quickSettingsBtn" class="quick-settings-btn hidden" type="button" title="Настройки" aria-label="Настройки">⚙</button>',
    `  <div id="lobbySideActions" class="lobby-side-actions" aria-label="Lobby tools">\n    <button id="indexBookBtn" class="lobby-tool-btn index-tool-btn" type="button" title="Индекс врагов и питомцев">\n      <span class="lobby-tool-icon">📖</span><b>INDEX</b><small>бестиарий</small>\n    </button>\n    <button id="codesBtn" class="lobby-tool-btn codes-tool-btn" type="button" title="Коды разработчика">\n      <span class="lobby-tool-icon">🎟</span><b>CODES</b><small>промокоды</small>\n    </button>\n  </div>\n\n  <button id="quickSettingsBtn" class="quick-settings-btn hidden" type="button" title="Настройки" aria-label="Настройки">⚙</button>`
  ],
  [
    '  <div id="indexOverlay" class="overlay index-overlay">',
    `  <div id="codesOverlay" class="overlay codes-overlay">\n    <section class="codes-panel">\n      <button id="closeCodesBtn" class="index-close" type="button" aria-label="Закрыть">×</button>\n      <div class="codes-head">\n        <div class="codes-ticket">🎟</div>\n        <div><div id="codesKicker" class="tag">КОДЫ РАЗРАБОТЧИКА</div><h2 id="codesTitle">CODES</h2></div>\n      </div>\n      <p id="codesDescription" class="codes-description">Введи промокод и забери награду. Каждый код можно активировать только один раз на аккаунт.</p>\n      <div class="codes-form">\n        <input id="developerCodeInput" maxlength="32" autocomplete="off" spellcheck="false" placeholder="Введите код">\n        <button id="redeemCodeBtn" class="primary" type="button">АКТИВИРОВАТЬ</button>\n      </div>\n      <div id="codesStatus" class="codes-status">Введи код разработчика и нажми «Активировать».</div>\n      <div class="codes-hint"><span>✦</span><div><b id="codesHintTitle">Где искать коды?</b><small id="codesHintText">Мы будем публиковать их в обновлениях, событиях и сообщениях разработчика.</small></div></div>\n    </section>\n  </div>\n\n  <div id="indexOverlay" class="overlay index-overlay">`
  ]
]);

const serverChanged = patchFile("server.js", [
  [
    '  p.crateTokens=Math.max(0,Number(p.crateTokens)||0);\n  p.titlesUnlocked=Array.isArray(p.titlesUnlocked)?[...new Set(["Новичок",...p.titlesUnlocked.map(String)])]:["Новичок"];',
    '  p.crateTokens=Math.max(0,Number(p.crateTokens)||0);\n  p.redeemedCodes=Array.isArray(p.redeemedCodes)?[...new Set(p.redeemedCodes.map(v=>String(v||"").trim().toUpperCase()).filter(Boolean))]:[];\n  p.titlesUnlocked=Array.isArray(p.titlesUnlocked)?[...new Set(["Новичок",...p.titlesUnlocked.map(String)])]:["Новичок"];'
  ],
  [
    '    titlesUnlocked:p.titlesUnlocked,selectedTitle:p.selectedTitle,\n    account:p.account?publicAccountSnapshot(p.account,p):null',
    '    titlesUnlocked:p.titlesUnlocked,selectedTitle:p.selectedTitle,redeemedCodes:[...(p.redeemedCodes||[])],\n    account:p.account?publicAccountSnapshot(p.account,p):null'
  ],
  [
    '    runHistory:[],crateTokens:0,titlesUnlocked:["Новичок"],selectedTitle:"Новичок"',
    '    runHistory:[],crateTokens:0,redeemedCodes:[],titlesUnlocked:["Новичок"],selectedTitle:"Новичок"'
  ],
  [
    '      base.crateTokens=Math.max(0,Number(saved.crateTokens)||0);\n      base.titlesUnlocked=Array.isArray(saved.titlesUnlocked)?saved.titlesUnlocked:["Новичок"];',
    '      base.crateTokens=Math.max(0,Number(saved.crateTokens)||0);\n      base.redeemedCodes=Array.isArray(saved.redeemedCodes)?saved.redeemedCodes:[];\n      base.titlesUnlocked=Array.isArray(saved.titlesUnlocked)?saved.titlesUnlocked:["Новичок"];'
  ],
  [
    '      crateTokens:p.crateTokens||0,titlesUnlocked:p.titlesUnlocked,selectedTitle:p.selectedTitle',
    '      crateTokens:p.crateTokens||0,redeemedCodes:p.redeemedCodes||[],titlesUnlocked:p.titlesUnlocked,selectedTitle:p.selectedTitle'
  ],
  [
    '    runHistory:normalizeHistory(prog.runHistory),crateTokens:prog.crateTokens||0,titlesUnlocked:prog.titlesUnlocked||["Новичок"],selectedTitle:prog.selectedTitle||"Новичок",',
    '    runHistory:normalizeHistory(prog.runHistory),crateTokens:prog.crateTokens||0,redeemedCodes:Array.isArray(prog.redeemedCodes)?[...prog.redeemedCodes]:[],titlesUnlocked:prog.titlesUnlocked||["Новичок"],selectedTitle:prog.selectedTitle||"Новичок",'
  ],
  [
    'function sendMeta(ws,p){send(ws,"metaState",{meta:metaSnapshot(p)});}\n\nfunction defaultProgress(){',
    `function sendMeta(ws,p){send(ws,"metaState",{meta:metaSnapshot(p)});}\n\nconst DEVELOPER_CODES={\n  WELCOME:{display:"Welcome",silver:500,gold:50,crateTokens:1},\n  TEST:{display:"TEST",silver:1000,gold:100,crateTokens:2}\n};\nfunction redeemDeveloperCode(p,rawCode){\n  ensureMeta(p);\n  const key=String(rawCode||"").trim().replace(/[^a-z0-9_-]/gi,"").slice(0,32).toUpperCase();\n  if(!key)return {ok:false,message:"Введите код"};\n  const cfg=DEVELOPER_CODES[key];\n  if(!cfg)return {ok:false,message:"Такого кода нет или он больше не действует"};\n  if((p.redeemedCodes||[]).includes(key))return {ok:false,message:"Этот код уже был активирован на вашем аккаунте"};\n  p.silver=(p.silver||0)+(cfg.silver||0);\n  p.gold=(p.gold||0)+(cfg.gold||0);\n  p.crateTokens=(p.crateTokens||0)+(cfg.crateTokens||0);\n  p.redeemedCodes.push(key);\n  saveProgress(p);\n  const rewards=[];\n  if(cfg.silver)rewards.push(\`+\${cfg.silver} серебра\`);\n  if(cfg.gold)rewards.push(\`+\${cfg.gold} золота\`);\n  if(cfg.crateTokens)rewards.push(\`+\${cfg.crateTokens} \${cfg.crateTokens===1?"жетон ящика":"жетона ящика"}\`);\n  return {ok:true,code:cfg.display,message:\`Код \${cfg.display} активирован! \${rewards.join(" · ")}\`,rewards:{silver:cfg.silver||0,gold:cfg.gold||0,crateTokens:cfg.crateTokens||0}};\n}\n\nfunction defaultProgress(){`
  ],
  [
    '    if(m.type==="getMeta"){\n      const profile=p?.profile||account.username;\n      const target=p||loadMetaTarget(profile,account);sendMeta(ws,target);return;\n    }\n    if(["metaShopBuy"',
    `    if(m.type==="getMeta"){\n      const profile=p?.profile||account.username;\n      const target=p||loadMetaTarget(profile,account);sendMeta(ws,target);return;\n    }\n    if(m.type==="redeemCode"){\n      const profile=p?.profile||account.username;\n      if(room?.started)return send(ws,"codeRedeemResult",{ok:false,message:"Коды можно активировать только в лобби"});\n      if(!p&&activeProfiles.has(profile))return send(ws,"codeRedeemResult",{ok:false,message:"Этот аккаунт сейчас используется в активном забеге"});\n      const target=p||loadMetaTarget(profile,account);\n      const result=redeemDeveloperCode(target,m.code);\n      send(ws,"codeRedeemResult",result);sendMeta(ws,target);return;\n    }\n    if(["metaShopBuy"`
  ]
]);

const clientChanged = patchFile("public/client.js", [
  [
    '$("quickSettingsBtn").onclick=()=>openPause();\n$("indexZombieTab").onclick=()=>setIndexTab("zombies");$("indexPetTab").onclick=()=>setIndexTab("pets");',
    `$("quickSettingsBtn").onclick=()=>openPause();\n$("indexBookBtn").onclick=()=>{indexOverlay.classList.add("visible");setIndexTab("zombies");send("getMeta");renderIndex();};\nfunction renderCodesLanguage(){\n  const set=(id,ru,en)=>{const el=$(id);if(el)el.textContent=T(ru,en);};\n  set("codesKicker","КОДЫ РАЗРАБОТЧИКА","DEVELOPER CODES");\n  set("codesDescription","Введи промокод и забери награду. Каждый код можно активировать только один раз на аккаунт.","Enter a promo code and claim the reward. Each code can only be redeemed once per account.");\n  set("redeemCodeBtn","АКТИВИРОВАТЬ","REDEEM");\n  set("codesHintTitle","Где искать коды?","Where can I find codes?");\n  set("codesHintText","Мы будем публиковать их в обновлениях, событиях и сообщениях разработчика.","We will publish them in updates, events and developer messages.");\n  const input=$("developerCodeInput");if(input)input.placeholder=T("Введите код","Enter code");\n  const indexSmall=$("indexBookBtn")?.querySelector("small");if(indexSmall)indexSmall.textContent=T("бестиарий","bestiary");\n  const codesSmall=$("codesBtn")?.querySelector("small");if(codesSmall)codesSmall.textContent=T("промокоды","promo codes");\n}\nfunction openCodes(){\n  const overlay=$("codesOverlay"),status=$("codesStatus"),input=$("developerCodeInput");if(!overlay)return;\n  renderCodesLanguage();\n  if(status){status.className="codes-status";status.textContent=T("Введи код разработчика и нажми «Активировать».","Enter a developer code and press Redeem.");}\n  overlay.classList.add("visible");setTimeout(()=>input?.focus(),40);\n}\nfunction closeCodes(){$("codesOverlay")?.classList.remove("visible");}\nfunction redeemCodeFromUi(){\n  const input=$("developerCodeInput"),status=$("codesStatus"),code=String(input?.value||"").trim();\n  if(!code){if(status){status.className="codes-status error";status.textContent=T("Сначала введи код.","Enter a code first.");}return;}\n  if(status){status.className="codes-status pending";status.textContent=T("Проверяем код…","Checking code…");}\n  send("redeemCode",{code});\n}\n$("codesBtn").onclick=openCodes;$("closeCodesBtn").onclick=closeCodes;$("redeemCodeBtn").onclick=redeemCodeFromUi;\n$("codesOverlay")?.addEventListener("mousedown",e=>{if(e.target===$("codesOverlay"))closeCodes();});\n$("developerCodeInput")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();redeemCodeFromUi();}});\n$("indexZombieTab").onclick=()=>setIndexTab("zombies");$("indexPetTab").onclick=()=>setIndexTab("pets");`
  ],
  [
    '    if(m.type==="metaState"){\n      metaState=m.meta;',
    `    if(m.type==="codeRedeemResult"){\n      const status=$("codesStatus");\n      if(status){status.className=\`codes-status \${m.ok?"success":"error"}\`;status.textContent=translateServerText(m.message||T("Не удалось активировать код","Could not redeem code"));}\n      if(m.ok){$("developerCodeInput").value="";playSfx("coin");}\n      return;\n    }\n    if(m.type==="metaState"){\n      metaState=m.meta;`
  ],
  [
    '  syncCatalogLanguage();\n  $("langRuBtn")?.classList.toggle("active",lang==="ru");$("langEnBtn")?.classList.toggle("active",lang==="en");\n  renderClassLocks();renderIndex();',
    '  syncCatalogLanguage();\n  $("langRuBtn")?.classList.toggle("active",lang==="ru");$("langEnBtn")?.classList.toggle("active",lang==="en");\n  renderClassLocks();renderIndex();renderCodesLanguage();'
  ],
  [
    '  $("languageSwitch")?.classList.toggle("hidden",!lobby.classList.contains("visible"));\n  const inRun=!!state?.started&&!lobby.classList.contains("visible");',
    '  $("languageSwitch")?.classList.toggle("hidden",!lobby.classList.contains("visible"));\n  const lobbyToolsVisible=lobby.classList.contains("visible")&&!$("authOverlay")?.classList.contains("visible")&&!state?.started;\n  $("lobbySideActions")?.classList.toggle("visible",!!lobbyToolsVisible);if(!lobbyToolsVisible)closeCodes();\n  const inRun=!!state?.started&&!lobby.classList.contains("visible");'
  ],
  [
    '  indexOverlay.classList.remove("visible");\n  petOverlay.classList.remove("visible");',
    '  indexOverlay.classList.remove("visible");\n  $("codesOverlay")?.classList.remove("visible");\n  petOverlay.classList.remove("visible");'
  ],
  [
    '        $("indexBookBtn")?.classList.remove("visible");\n        adminGameBtn.classList.toggle("hidden",!(state.qaAdminEnabled&&settings.adminVisible));',
    '        $("indexBookBtn")?.classList.remove("visible");$("codesOverlay")?.classList.remove("visible");\n        adminGameBtn.classList.toggle("hidden",!(state.qaAdminEnabled&&settings.adminVisible));'
  ]
]);

const cssChanged = appendOnce("public/style.css", "/* v8 lobby side tools + developer codes */", `/* v8 lobby side tools + developer codes */
.lobby-side-actions{position:absolute;left:max(18px,calc(50% - 760px));top:50%;transform:translateY(-50%);z-index:45;width:142px;display:none;gap:12px;pointer-events:none}
.lobby-side-actions.visible{display:grid}.lobby-tool-btn{pointer-events:auto;width:142px;min-height:126px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:4px;padding:16px 15px;border:1px solid rgba(255,255,255,.11);border-radius:18px;background:linear-gradient(145deg,rgba(16,26,30,.97),rgba(8,14,17,.97));color:#eef5f4;text-align:left;box-shadow:0 18px 46px rgba(0,0,0,.42);backdrop-filter:blur(10px);transition:transform .16s ease,border-color .16s ease,background .16s ease,box-shadow .16s ease}
.lobby-tool-btn:hover{transform:translateX(5px)!important;border-color:rgba(112,224,161,.50);background:linear-gradient(145deg,rgba(20,37,32,.98),rgba(10,18,20,.98));box-shadow:0 20px 54px rgba(0,0,0,.52),inset 0 0 28px rgba(112,224,161,.04)}.lobby-tool-btn:active{transform:translateX(2px)!important}.lobby-tool-icon{font-size:31px;line-height:1;margin-bottom:6px}.lobby-tool-btn b{font-size:17px;letter-spacing:.055em}.lobby-tool-btn small{font-size:10px;color:#8fa1a5;letter-spacing:.03em}.codes-tool-btn{border-color:rgba(238,194,100,.18)}.codes-tool-btn:hover{border-color:rgba(238,194,100,.55);box-shadow:0 20px 54px rgba(0,0,0,.52),inset 0 0 30px rgba(238,194,100,.05)}
.codes-overlay{z-index:86}.codes-panel{position:relative;width:min(560px,94vw);padding:28px;border:1px solid rgba(255,255,255,.12);border-radius:22px;background:linear-gradient(160deg,rgba(17,27,31,.99),rgba(8,13,16,.99));box-shadow:0 30px 100px rgba(0,0,0,.68)}.codes-head{display:flex;align-items:center;gap:15px;margin-bottom:14px}.codes-head h2{font-size:36px;line-height:1;margin:4px 0 0;letter-spacing:-.025em}.codes-ticket{width:58px;height:58px;display:grid;place-items:center;border:1px solid rgba(242,199,105,.25);border-radius:16px;background:linear-gradient(145deg,rgba(83,65,27,.55),rgba(37,28,15,.65));font-size:28px;box-shadow:inset 0 0 25px rgba(255,205,96,.06)}.codes-description{margin:0 0 18px;color:#a9b6ba;font-size:14px;line-height:1.55}.codes-form{display:grid;grid-template-columns:1fr 170px;gap:9px}.codes-form input{height:52px;font-size:16px;font-weight:800;letter-spacing:.035em}.codes-form .primary{height:52px}.codes-status{margin-top:12px;min-height:45px;display:flex;align-items:center;padding:10px 12px;border:1px solid rgba(255,255,255,.08);border-radius:11px;background:rgba(255,255,255,.025);color:#91a1a6;font-size:12px;line-height:1.45}.codes-status.pending{color:#e7cf8a;border-color:rgba(231,207,138,.20)}.codes-status.success{color:#8ce2aa;border-color:rgba(104,221,149,.28);background:rgba(47,126,77,.09)}.codes-status.error{color:#ee9094;border-color:rgba(238,109,116,.25);background:rgba(130,45,49,.08)}.codes-hint{display:flex;gap:11px;align-items:flex-start;margin-top:17px;padding-top:15px;border-top:1px solid rgba(255,255,255,.07)}.codes-hint>span{color:#e7c66d;font-size:18px}.codes-hint b{display:block;font-size:12px}.codes-hint small{display:block;margin-top:3px;color:#78878c;font-size:10px;line-height:1.45}
@media(max-width:1500px){.lobby-side-actions{left:12px;width:112px}.lobby-tool-btn{width:112px;min-height:102px;padding:12px}.lobby-tool-icon{font-size:25px}.lobby-tool-btn b{font-size:14px}}
@media(max-width:1280px){.lobby-side-actions{top:auto;bottom:14px;left:50%;transform:translateX(-50%);grid-template-columns:repeat(2,110px);width:auto;gap:8px}.lobby-tool-btn{width:110px;min-height:54px;padding:8px 11px;display:grid;grid-template-columns:28px 1fr;grid-template-rows:auto auto;column-gap:7px}.lobby-tool-icon{grid-row:1/3;font-size:20px;margin:0}.lobby-tool-btn b{font-size:12px}.lobby-tool-btn small{font-size:8px}.lobby-tool-btn:hover{transform:translateY(-3px)!important}}
@media(max-width:650px){.lobby-side-actions{bottom:8px}.codes-panel{padding:22px 18px}.codes-form{grid-template-columns:1fr}.codes-form .primary{width:100%}}
`);

const testChanged = patchFile("tests/desktop_patch.test.js", [
  ['  assert.doesNotMatch(html,/id="indexBookBtn"/);', '  assert.match(html,/id="indexBookBtn"/);']
]);

console.log(`Lobby tools patch: html=${htmlChanged?"updated":"unchanged"}, server=${serverChanged?"updated":"unchanged"}, client=${clientChanged?"updated":"unchanged"}, css=${cssChanged?"updated":"already patched"}, tests=${testChanged?"updated":"unchanged"}`);

})();

/* ===== embedded lobby visibility ===== */
(()=>{
"use strict";

const fs = require("fs");
const path = require("path");

const target = path.join(__dirname, "public", "client.js");
let source = fs.readFileSync(target, "utf8");
const original = source;

source = source.replace(
  'accountState=m.account||accountState;$("authOverlay")?.classList.remove("visible");syncAccountUi();send("getMeta");',
  'accountState=m.account||accountState;$("authOverlay")?.classList.remove("visible");$("lobbySideActions")?.classList.add("visible");syncAccountUi();send("getMeta");'
);

source = source.replace(
  '  lobby.classList.add("visible");\n  $("indexBookBtn")?.classList.add("visible");',
  '  lobby.classList.add("visible");\n  $("indexBookBtn")?.classList.add("visible");\n  $("lobbySideActions")?.classList.add("visible");'
);

source = source.replace(
  '$("indexBookBtn")?.classList.remove("visible");$("codesOverlay")?.classList.remove("visible");',
  '$("indexBookBtn")?.classList.remove("visible");$("codesOverlay")?.classList.remove("visible");$("lobbySideActions")?.classList.remove("visible");'
);

if (source !== original) {
  fs.writeFileSync(target, source, "utf8");
  console.log("Lobby visibility patch applied: INDEX and CODES show immediately after login.");
} else if (source.includes('$("lobbySideActions")?.classList.add("visible")')) {
  console.log("Lobby visibility patch already applied.");
} else {
  console.warn("Lobby visibility patch target was not found.");
}

})();

/* ===== embedded lobby layer ===== */
(()=>{
"use strict";
const fs=require("fs");
const path=require("path");
const file=path.join(__dirname,"public","style.css");
let css=fs.readFileSync(file,"utf8");
const before=css;
css=css.replace(/\.lobby-side-actions\{position:absolute;left:max\(18px,calc\(50% - 760px\)\);top:50%;transform:translateY\(-50%\);z-index:45;/,
  '.lobby-side-actions{position:absolute;left:max(18px,calc(50% - 760px));top:50%;transform:translateY(-50%);z-index:58;');
if(css===before && !css.includes('.lobby-side-actions{position:absolute;left:max(18px,calc(50% - 760px));top:50%;transform:translateY(-50%);z-index:58;')){
  css += '\n/* lobby side tools must sit above the lobby overlay (z-index 50) */\n.lobby-side-actions{z-index:58!important}\n';
}
if(css!==before) fs.writeFileSync(file,css,"utf8");
console.log("Lobby layer patch applied: side tools render above lobby overlay.");

})();

/* ===== embedded full restore ===== */
(()=>{
"use strict";
const fs=require("node:fs"),path=require("node:path");
const F=r=>path.join(__dirname,r),R=r=>fs.readFileSync(F(r),"utf8"),W=(r,s)=>fs.writeFileSync(F(r),s,"utf8");
function must(v,m){if(!v)throw new Error("restore-full: "+m)}
function once(s,a,b,label,required=true){
  if(s.includes(b))return s;
  if(!s.includes(a)){if(required)throw new Error("restore-full target missing: "+label);return s;}
  return s.replace(a,b);
}

function patchServer(){
  let s=R("server.js");
  if(s.includes("/* DREAD SHIFT full restore 2026-09-13 server */"))return false;

  // INDEX is a lobby tool, not progression content. Unknown entries stay hidden inside the index itself.
  s=once(s,"crates:best>=3,pets:best>=3,index:known};","crates:best>=3,pets:best>=3,index:true};","always-visible index",false);

  // Restore the requested 30-second build/preparation window.
  s=once(s,"  room.phaseTimer=first?15:21;","  room.phaseTimer=30;","30 second prep",false);

  // Promo rewards from the last requested economy. lobby_tools_patch creates the code system first.
  s=s.replace(/WELCOME:\{display:"Welcome",silver:\d+,gold:\d+,crateTokens:\d+\}/,'WELCOME:{display:"Welcome",silver:300,gold:25,crateTokens:1}');
  s=s.replace(/TEST:\{display:"TEST",silver:\d+,gold:\d+,crateTokens:\d+\}/,'TEST:{display:"TEST",silver:150,gold:10,crateTokens:0}');

  // Smooth server-side pet movement: remove the 22px dead-zone that made companions hop between snapshots.
  s=once(s,
    'else{const dx=targetX-p.petX,dy=targetY-p.petY,d=Math.hypot(dx,dy);if(d>22){const step=Math.min(d,Math.min(185,55+d*.42)*dt);p.petX+=dx/d*step;p.petY+=dy/d*step;}}',
    'else{const dx=targetX-p.petX,dy=targetY-p.petY,d=Math.hypot(dx,dy);if(d>.25){const speed=Math.min(245,90+d*.52),step=Math.min(d,speed*dt);p.petX+=dx/d*step;p.petY+=dy/d*step;}}',
    "continuous pet follow",false);

  // Cumulative end-of-run rewards. Each reached milestone is paid once per run.
  if(!s.includes("const RUN_MILESTONE_REWARDS=[")){
    const recordRe=/function recordRun\(p,room,result="gameover"\)\{[\s\S]*?\n\}/;
    must(recordRe.test(s),"recordRun function not found");
    s=s.replace(recordRe,[
      'const RUN_MILESTONE_REWARDS=[',
      '  {wave:5,silver:30,gold:5},{wave:10,silver:200,gold:20},{wave:15,silver:350,gold:20},',
      '  {wave:20,silver:500,gold:30},{wave:25,silver:700,gold:40},{wave:30,silver:950,gold:55},',
      '  {wave:35,silver:1250,gold:70},{wave:40,silver:1600,gold:90},{wave:45,silver:2100,gold:120},{wave:50,silver:3000,gold:175}',
      '];',
      'function grantRunMilestoneRewards(p,completedWaves){',
      '  completedWaves=Math.max(0,Math.min(50,Number(completedWaves)||0));',
      '  if(p.runMilestonePaid)return p.runMilestoneReward||{completedWaves,silver:0,gold:0,milestones:[]};',
      '  const milestones=RUN_MILESTONE_REWARDS.filter(r=>completedWaves>=r.wave);',
      '  const reward={completedWaves,silver:milestones.reduce((n,r)=>n+r.silver,0),gold:milestones.reduce((n,r)=>n+r.gold,0),milestones:milestones.map(r=>r.wave)};',
      '  p.silver=(p.silver||0)+reward.silver;p.gold=(p.gold||0)+reward.gold;',
      '  p.runMilestonePaid=true;p.runMilestoneReward=reward;',
      '  return reward;',
      '}',
      'function recordRun(p,room,result="gameover"){',
      '  ensureMeta(p);',
      '  let completedWaves=Math.max(0,Number(p.runStats?.waves)||0);',
      '  if(result==="victory")completedWaves=Math.max(completedWaves,Math.min(50,Number(room.wave)||0));',
      '  const earned=grantRunMilestoneRewards(p,completedWaves);',
      '  const row={date:new Date().toISOString(),wave:room.wave,completedWaves,kills:p.runStats?.kills||0,builds:p.runStats?.builds||0,damage:Math.round(p.runStats?.damage||0),classId:p.character,petId:p.equippedPet||null,weapon:favoriteWeapon(p),result,earnedSilver:earned.silver,earnedGold:earned.gold,rewardMilestones:earned.milestones};',
      '  p.runHistory=[row,...(p.runHistory||[])].slice(0,5);',
      '  checkAchievements(p,room);saveProgress(p);return row;',
      '}'
    ].join("\n"));
  }
  s=once(s,
    'p.runBonuses={damage:0,speed:0};p.runStats={kills:0,harvest:0,waves:0,builds:0,damage:0,coreDamage:0,weaponShots:{},minCoreRatio:1};p.petState=blankPetState();',
    'p.runBonuses={damage:0,speed:0};p.runStats={kills:0,harvest:0,waves:0,builds:0,damage:0,coreDamage:0,weaponShots:{},minCoreRatio:1};p.runMilestonePaid=false;p.runMilestoneReward=null;p.petState=blankPetState();',
    "run reward reset",false);

  // Pet crate duplicates are not new discoveries.
  s=once(s,
    '  const result=weightedPetRoll();target.petsOwned[result]=(target.petsOwned[result]||0)+1;\n  saveProgress(target);return {pet:result,reel:buildCrateReel(result),usedToken:useToken};',
    '  const result=weightedPetRoll(),previousCount=target.petsOwned[result]||0,isNew=previousCount<=0;target.petsOwned[result]=previousCount+1;\n  saveProgress(target);return {pet:result,reel:buildCrateReel(result),usedToken:useToken,isNew};',
    "crate duplicate flag",false);

  // Spikes are floor traps: zombies pass through, and each fresh entry consumes one contact of durability.
  const spikeHelper='function structureCooldownMultiplier(st){return STRUCTURE_LEVEL_COOLDOWN[Math.max(1,Math.min(5,st?.level||1))]||1;}';
  if(s.includes(spikeHelper)&&!s.includes("SPIKE_CONTACT_LIMIT_BY_LEVEL")){
    s=s.replace(spikeHelper,spikeHelper+'\nconst SPIKE_CONTACT_LIMIT_BY_LEVEL=[0,25,40,60];\nconst spikeContactState=new Map();\nfunction spikeContactLimit(st){return SPIKE_CONTACT_LIMIT_BY_LEVEL[Math.max(1,Math.min(3,Number(st?.level)||1))]||25;}');
  }
  const oldSpike=[
    '    if(s.type==="spikes"){',
    '      s.cooldown=Math.max(0,s.cooldown-dt);',
    '      if(s.jam<=0&&s.cooldown<=0){',
    '        let any=false;',
    '        for(const z of room.zombies){',
    '          if(dist(s,z)<s.r+z.r+9){const dealt=damageZombie(z,15*(s.power||1)*defensePetMult*comboDamageMultiplier(comboOwner),"melee");creditStructureHit(room,s,z,dealt);z.slow=.5;any=true;}',
    '        }',
    '        if(any)s.cooldown=.4;',
    '      }',
    '    }'
  ].join("\n");
  const newSpike=[
    '    if(s.type==="spikes"){',
    '      const previous=spikeContactState.get(s.id)||new Set(),inside=new Set(),contactLimit=spikeContactLimit(s);',
    '      for(const z of room.zombies){',
    '        if(z.hp<=0||dist(s,z)>=s.r+z.r+9)continue;',
    '        inside.add(z.id);if(previous.has(z.id))continue;',
    '        const dealt=damageZombie(z,18*(s.power||1)*defensePetMult*comboDamageMultiplier(comboOwner),"melee");',
    '        creditStructureHit(room,s,z,dealt);s.hp=Math.max(0,s.hp-(s.maxHp/Math.max(1,contactLimit)));if(s.hp<=0)break;',
    '      }',
    '      if(s.hp>0&&inside.size)spikeContactState.set(s.id,inside);else spikeContactState.delete(s.id);',
    '      if(spikeContactState.size>512)spikeContactState.clear();',
    '    }'
  ].join("\n");
  s=once(s,oldSpike,newSpike,"spike traversal",false);

  // Spawn ranged projectiles from the muzzle instead of the trigger/body.
  s=once(s,
    '      x:p.x+Math.cos(a)*29,y:p.y+Math.sin(a)*29,vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed,',
    '      x:p.x+Math.cos(a)*(({pistol:50,micro_uzi:54,ump:60,bubble_blaster:56}[p.weapon.type])||29),y:p.y+Math.sin(a)*(({pistol:50,micro_uzi:54,ump:60,bubble_blaster:56}[p.weapon.type])||29),vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed,',
    "server muzzle position",false);

  // Same-origin HTTP auth path: registration/login no longer depends exclusively on a healthy WebSocket.
  if(!s.includes('requestPath==="/api/auth/register"')){
    const marker='const server=http.createServer((req,res)=>{\n  let url=req.url.split("?")[0];';
    const replacement=[
      'const server=http.createServer((req,res)=>{',
      '  const requestPath=req.url.split("?")[0];',
      '  if(req.method==="POST"&&(requestPath==="/api/auth/register"||requestPath==="/api/auth/login")){',
      '    if(typeof allowAuthAttempt==="function"&&!allowAuthAttempt(req)){res.writeHead(429,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Retry-After":"30"});return res.end(JSON.stringify({ok:false,message:"Слишком много попыток. Подождите около 30 секунд."}));}',
      '    let bodyText="";req.setEncoding("utf8");',
      '    req.on("data",chunk=>{if(bodyText.length<=8192)bodyText+=chunk;});',
      '    req.on("end",()=>{',
      '      const json=(status,payload)=>{res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});res.end(JSON.stringify(payload));};',
      '      if(bodyText.length>8192)return json(413,{ok:false,message:"Слишком большой запрос"});',
      '      let body;try{body=JSON.parse(bodyText||"{}");}catch{return json(400,{ok:false,message:"Некорректный запрос"});}',
      '      try{',
      '        if(requestPath==="/api/auth/register"){',
      '          let result=registerAccount(body.username,body.password,body.displayName),recovered=false;',
      '          if(result.error){if(result.error==="Такой логин уже занят"){const existing=authenticateAccount(body.username,body.password);if(existing){result={account:existing,starterGift:false};recovered=true;}}if(result.error)return json(400,{ok:false,message:result.error});}',
      '          const account=result.account,session=issueAccountSession(account),target=loadMetaTarget(account.username,account);',
      '          return json(200,{ok:true,account:publicAccountSnapshot(account,target),session,starterGift:!!result.starterGift,recovered});',
      '        }',
      '        const account=authenticateAccount(body.username,body.password);if(!account)return json(401,{ok:false,message:"Неверный логин или пароль"});',
      '        const session=issueAccountSession(account),target=loadMetaTarget(account.username,account);return json(200,{ok:true,account:publicAccountSnapshot(account,target),session});',
      '      }catch(err){console.error("[AUTH HTTP]",err?.stack||err);return json(500,{ok:false,message:"Ошибка сервера авторизации. Попробуйте ещё раз."});}',
      '    });return;',
      '  }',
      '  let url=requestPath;'
    ].join("\n");
    s=once(s,marker,replacement,"HTTP auth route");
  }

  s+='\n/* DREAD SHIFT full restore 2026-09-13 server */\n';
  W("server.js",s);return true;
}

function patchClient(){
  let s=R("public/client.js");
  if(s.includes("/* DREAD SHIFT full restore 2026-09-13 client */"))return false;

  // Remove native browser confirmation before pet-case opening.
  s=s.replace('  if(!((metaState?.crateTokens||0)>0)&&!confirm("Открыть ящик за 50 золота?"))return;\n','');

  // Smooth companion rendering independently from player snapshot interpolation.
  s=once(s,'const smoothPlayers=new Map(),smoothZombies=new Map();','const smoothPlayers=new Map(),smoothZombies=new Map(),smoothPets=new Map();',"pet smoothing map",false);
  s=s.replaceAll('smoothPlayers.clear();smoothZombies.clear();','smoothPlayers.clear();smoothZombies.clear();smoothPets.clear();');
  s=once(s,
    '  const base=(p.id===myId&&localPred)?{...p,x:localPred.x,y:localPred.y}:smoothEntity(smoothPlayers,p);\n  const wp=petVisualWorldPos(base),s=sc(wp.x,wp.y),img=petImages[petId];',
    '  const base=(p.id===myId&&localPred)?{...p,x:localPred.x,y:localPred.y}:smoothEntity(smoothPlayers,p);\n  const rawWp=petVisualWorldPos(p),prediction=p.id===myId&&localPred?{x:localPred.x-p.x,y:localPred.y-p.y}:{x:0,y:0},desired={x:rawWp.x+prediction.x,y:rawWp.y+prediction.y};\n  let wp=smoothPets.get(p.id);if(!wp){wp={x:desired.x,y:desired.y};smoothPets.set(p.id,wp);}const petGap=Math.hypot(desired.x-wp.x,desired.y-wp.y);\n  if(petGap>650){wp.x=desired.x;wp.y=desired.y;}else{const follow=petGap>220?.28:petGap>90?.18:.11;wp.x+=(desired.x-wp.x)*follow;wp.y+=(desired.y-wp.y)*follow;}\n  const s=sc(wp.x,wp.y),img=petImages[petId];',
    "pet interpolation",false);

  // Generator action buttons stay in viewport and expose the current generator level.
  const coreRe=/function updateCoreActions\(\)\{[\s\S]*?\n\}/;
  if(coreRe.test(s)&&!s.includes('const safeY=Math.max(105,Math.min(innerHeight-158,pos.y+132));')){
    s=s.replace(coreRe,[
      'function updateCoreActions(){',
      '  const el=$("coreActions"),p=myPlayer();if(!el)return;',
      '  const near=!!(state?.started&&p&&state?.core&&Math.hypot(p.x-state.core.x,p.y-state.core.y)<RUN_SHOP_RADIUS);',
      '  el.classList.toggle("hidden",!near);if(!near)return;',
      '  const pos=sc(state.core.x,state.core.y),safeX=Math.max(118,Math.min(innerWidth-118,pos.x)),safeY=Math.max(105,Math.min(innerHeight-158,pos.y+132));',
      '  el.style.left=`${safeX}px`;el.style.top=`${safeY}px`;el.dataset.coreLevel=String(state.core.level||1);',
      '}'
    ].join("\n"));
  }

  // Muzzle flash follows the actual barrel.
  s=once(s,'    const muzzleDist=width*.88;','    const muzzleDist=18+width*.94;',"client muzzle flash",false);

  // Spike info mirrors the restored server behaviour.
  const oldSpikeUi='  if(st.type==="spikes"){\n    const damage=15*power*axolotlMult;\n    return [T(`Урон за срабатывание: ${damage.toFixed(1)}`,`Damage per trigger: ${damage.toFixed(1)}`),T(`Срабатывание: раз в 0.4 сек`,`Trigger: every 0.4 sec`),T(`Эффект: замедление`,`Effect: slow`)];\n  }';
  const newSpikeUi='  if(st.type==="spikes"){\n    const damage=18*power*axolotlMult,limit=[0,25,40,60][Math.max(1,Math.min(3,st.level||1))]||25;\n    const remaining=Math.max(0,Math.ceil(limit*((st.hp||0)/Math.max(1,st.maxHp||1))));\n    return [T(`Урон при входе: ${damage.toFixed(1)}`,`Entry damage: ${damage.toFixed(1)}`),T(`Контактов до поломки: ~${remaining} / ${limit}`,`Contacts before breaking: ~${remaining} / ${limit}`),T(`Зомби проходят сквозь шипы. Повторный вход считается новым контактом.`,`Zombies walk through the spikes. Re-entering counts as a new contact.`)];\n  }';
  s=once(s,oldSpikeUi,newSpikeUi,"spike UI",false);

  // Display cumulative run rewards on death/victory screen.
  const oldDeath='    $("deathStats").innerHTML=`<div><b>${fmt(stats.wave||wave)}</b><span>${T("волна","wave")}</span></div><div><b>${fmt(stats.kills)}</b><span>${T("убито","kills")}</span></div><div><b>${fmt(stats.damage)}</b><span>${T("урона","damage")}</span></div><div><b>${fmt(stats.builds)}</b><span>${T("построено","built")}</span></div><div class="death-weapon-stat"><b>${weaponNames[stats.weapon]||stats.weapon||"—"}</b><span>${T("любимое оружие","favorite weapon")}</span></div>`;';
  const newDeath='    $("deathStats").innerHTML=`<div><b>${fmt(stats.wave||wave)}</b><span>${T("волна","wave")}</span></div><div><b>${fmt(stats.kills)}</b><span>${T("убито","kills")}</span></div><div><b>${fmt(stats.damage)}</b><span>${T("урона","damage")}</span></div><div><b>${fmt(stats.builds)}</b><span>${T("построено","built")}</span></div><div class="death-weapon-stat"><b>${weaponNames[stats.weapon]||stats.weapon||"—"}</b><span>${T("любимое оружие","favorite weapon")}</span></div><div class="death-reward-stat"><b>+${fmt(stats.earnedSilver)} ◉ · +${fmt(stats.earnedGold)} G</b><span>${T(`награда за ${fmt(stats.completedWaves)} пройденных волн`,`reward for ${fmt(stats.completedWaves)} completed waves`)}</span></div>`;';
  s=once(s,oldDeath,newDeath,"death rewards UI",false);

  // HTTP-first auth, with the existing WebSocket channel retained as fallback.
  const oldSendAuth='function sendAuth(type,data={}){if(!connected){$("authStatus").textContent="Сервер ещё не подключён";return;}send(type,data);}';
  if(s.includes(oldSendAuth)){
    const auth=[
      'let authHttpBusy=false;',
      'async function performHttpAuth(type,data={}){',
      '  const statusEl=$("authStatus");if(authHttpBusy)return;authHttpBusy=true;',
      '  try{',
      '    if(statusEl)statusEl.textContent=type==="register"?T("Создаём аккаунт…","Creating account…"):T("Входим…","Signing in…");',
      '    const response=await fetch(`/api/auth/${type}`,{method:"POST",headers:{"Content-Type":"application/json"},cache:"no-store",body:JSON.stringify(data)});',
      '    let payload={};try{payload=await response.json();}catch{}',
      '    if(!response.ok||!payload.ok){const message=payload.message||T("Не удалось выполнить запрос","Request failed");if(statusEl)statusEl.textContent=message;toast(message);return;}',
      '    const token=payload.session?.token;if(token)storageSet(sessionKey,token);',
      '    if(payload.starterGift)toast(T("🎁 Стартовый подарок: +200 серебра и +1 жетон ящика","🎁 Starter gift: +200 silver and +1 crate token"));',
      '    if(ws&&ws.readyState===WebSocket.OPEN&&token)send("resumeSession",{token});else connect();',
      '  }catch(err){if(connected)send(type,data);else connect();}finally{authHttpBusy=false;}',
      '}',
      'function sendAuth(type,data={}){performHttpAuth(type,data);}'
    ].join("\n");
    s=s.replace(oldSendAuth,auth);
  }

  // Password eye buttons are bound after DOM load; safe for both login and registration forms.
  if(!s.includes("data-password-target"))s+='\n;document.querySelectorAll("[data-password-target]").forEach(btn=>btn.addEventListener("click",()=>{const input=$(btn.dataset.passwordTarget);if(!input)return;input.type=input.type==="password"?"text":"password";btn.textContent=input.type==="password"?"👁":"🙈";}));\n';

  s+='\n/* DREAD SHIFT full restore 2026-09-13 client */\n';
  try{new Function(s)}catch(e){throw new Error("restore-full client syntax: "+e.message)}
  W("public/client.js",s);return true;
}

function patchHtml(){
  let s=R("public/index.html");if(s.includes("<!-- DREAD SHIFT full restore 2026-09-13 -->"))return false;
  s=s.replace('<label>Пароль<input id="loginPassword" type="password" maxlength="72" autocomplete="current-password" placeholder="минимум 6 символов"></label>','<label>Пароль<div class="password-field"><input id="loginPassword" type="password" maxlength="72" autocomplete="current-password" placeholder="минимум 6 символов"><button class="password-toggle" data-password-target="loginPassword" type="button" title="Показать пароль">👁</button></div></label>');
  s=s.replace('<label>Пароль<input id="registerPassword" type="password" maxlength="72" autocomplete="new-password" placeholder="минимум 6 символов"></label>','<label>Пароль<div class="password-field"><input id="registerPassword" type="password" maxlength="72" autocomplete="new-password" placeholder="минимум 6 символов"><button class="password-toggle" data-password-target="registerPassword" type="button" title="Показать пароль">👁</button></div></label>');
  s=s.replaceAll("Night Shift Duo","Dread Shift").replaceAll("NIGHT SHIFT DUO","DREAD SHIFT");
  s+='\n<!-- DREAD SHIFT full restore 2026-09-13 -->\n';W("public/index.html",s);return true;
}
function patchCss(){
  let s=R("public/style.css");if(s.includes("/* DREAD SHIFT full restore 2026-09-13 styles */"))return false;
  s+='\n/* DREAD SHIFT full restore 2026-09-13 styles */\n.password-field{display:flex;align-items:center;gap:7px}.password-field input{flex:1;min-width:0}.password-toggle{flex:0 0 40px;height:38px;padding:0;display:grid;place-items:center}.core-actions{margin-top:0}.core-actions::before{content:"GENERATOR · LVL " attr(data-core-level);position:absolute;left:50%;top:-25px;transform:translateX(-50%);white-space:nowrap;padding:4px 8px;border-radius:8px;background:rgba(7,18,15,.88);border:1px solid rgba(90,220,143,.18);color:#9ee4b8;font-size:10px;font-weight:900}.death-reward-stat b{color:#f4d266!important}\n';
  W("public/style.css",s);return true;
}

const changed={server:patchServer(),client:patchClient(),html:patchHtml(),css:patchCss()};
const server=R("server.js"),client=R("public/client.js"),html=R("public/index.html"),css=R("public/style.css");
for(const [ok,label] of [
  [html.includes('id="lobbySideActions"')&&html.includes('id="codesOverlay"'),"INDEX/CODES UI"],
  [server.includes("const DEVELOPER_CODES=")&&server.includes('WELCOME:{display:"Welcome",silver:300,gold:25,crateTokens:1}')&&server.includes('TEST:{display:"TEST",silver:150,gold:10,crateTokens:0}'),"promo codes"],
  [server.includes('index:true'),"index unlock"],
  [server.includes('room.phaseTimer=30;'),"30s prep"],
  [server.includes('requestPath==="/api/auth/register"')&&client.includes('fetch(`/api/auth/${type}`'),"HTTP auth fallback"],
  [server.includes("RUN_MILESTONE_REWARDS")&&client.includes("death-reward-stat"),"run rewards"],
  [server.includes('if(d>.25){const speed=Math.min(245,90+d*.52)'),"smooth pet server"],
  [client.includes("smoothPets=new Map()"),"smooth pet client"],
  [!client.includes('confirm("Открыть ящик за 50 золота?")'),"crate confirm removed"],
  [html.includes('data-password-target="loginPassword"')&&html.includes('data-password-target="registerPassword"'),"password visibility"],
  [css.includes('.core-actions::before{content:"GENERATOR · LVL "'),"generator level label"]
])must(ok,label+" missing");
console.log("DREAD SHIFT full restore applied:",changed);

})();

/* ===== final top-lobby UI hardening ===== */
(()=>{
  const fs=require("node:fs"),path=require("node:path");
  const file=p=>path.join(__dirname,p),read=p=>fs.readFileSync(file(p),"utf8"),write=(p,s)=>fs.writeFileSync(file(p),s,"utf8");
  let html=read("public/index.html"),client=read("public/client.js"),css=read("public/style.css");
  if(!html.includes('id="notificationBell"')){
    const anchor='  <button id="quickSettingsBtn"';
    if(!html.includes(anchor))throw new Error("restore-all: quick settings anchor missing");
    const block='  <button id="notificationBell" class="notification-bell hidden" type="button" aria-label="Уведомления">🔔<span id="notificationCount" class="hidden">0</span></button>\\n  <aside id="notificationCenter" class="notification-center"><header><div><small>DREAD SHIFT</small><b>УВЕДОМЛЕНИЯ</b></div><button id="clearNotificationsBtn" type="button">Очистить</button></header><div id="notificationList" class="notification-list"></div></aside>\\n\\n';
    html=html.replace(anchor,block+anchor);write("public/index.html",html);
  }
  for(const id of ["notificationBell","notificationCenter","openWhatsNewBtn","indexBookBtn","codesBtn","codesOverlay","lobbySideActions"])if(!html.includes(`id="${id}"`))throw new Error(`restore-all: missing ${id}`);
  const notificationRuntime="function notificationEscape(v){return String(v||\"\").replace(/[&<>\\\\\"\\']/g,function(c){return {\"&\":\"&amp;\",\"<\":\"&lt;\",\">\":\"&gt;\",\"\\\\\\\"\":\"&quot;\",\"\\'\":\"&#39;\"}[c]||c;});}\\nvar uiNotifications=[];try{uiNotifications=JSON.parse(storageGet(\"dread_notifications\")||\"[]\")||[]}catch(e){}\\nvar notificationPanelOpen=false;\\nfunction renderNotifications(){var list=document.getElementById(\"notificationList\"),count=document.getElementById(\"notificationCount\");if(!list||!count)return;var unread=uiNotifications.filter(function(n){return !n.read}).length;count.textContent=unread>9?\"9+\":String(unread);count.classList.toggle(\"hidden\",unread===0);if(!uiNotifications.length){list.innerHTML=\"<div class=\\\"notification-empty\\\">Пока тихо. Важные события появятся здесь.</div>\";return;}list.innerHTML=uiNotifications.map(function(n){return \"<article class=\\\"notification-item \"+(n.read?\"\":\"unread\")+\"\\\"><b>\"+notificationEscape(n.text)+\"</b><small>\"+new Date(n.time).toLocaleTimeString([], {hour:\"2-digit\",minute:\"2-digit\"})+\"</small></article>\"}).join(\"\");}\\nfunction pushNotification(text,type){text=String(text||\"\").trim();if(!text)return;var now=Date.now();if(uiNotifications[0]&&uiNotifications[0].text===text&&now-uiNotifications[0].time<2500)return;uiNotifications.unshift({text:text,type:type||\"info\",time:now,read:false});uiNotifications=uiNotifications.slice(0,30);storageSet(\"dread_notifications\",JSON.stringify(uiNotifications));renderNotifications();}\\nfunction maybeStoreNotification(text){var x=String(text||\"\");if(/достижен|achievement|нов(ый|ого) питом|new pet|новый враг|new enemy|код .*активирован|code .*redeem|уровень аккаунта|account level|обучение завершено|tutorial completed|босс|boss loot|открыт новый|unlocked|запрос в друзья|friend request/i.test(x))pushNotification(x,\"event\");}\\nfunction syncNotificationUi(){var bell=document.getElementById(\"notificationBell\"),auth=document.getElementById(\"authOverlay\"),lobbyEl=document.getElementById(\"lobby\"),panel=document.getElementById(\"notificationCenter\"),whats=document.getElementById(\"openWhatsNewBtn\"),side=document.getElementById(\"lobbySideActions\");var show=!!(lobbyEl&&lobbyEl.classList.contains(\"visible\"))&&!(auth&&auth.classList.contains(\"visible\"))&&!(state&&state.started);if(bell)bell.classList.toggle(\"hidden\",!show);if(whats){whats.classList.toggle(\"hidden\",!show);whats.classList.add(\"restore-whats-new\");if(bell&&bell.parentElement&&whats.previousElementSibling!==bell)bell.after(whats);}if(side)side.classList.toggle(\"visible\",show);if(!show&&panel){panel.classList.remove(\"visible\");notificationPanelOpen=false;}}\\nsetTimeout(function(){var bell=document.getElementById(\"notificationBell\"),panel=document.getElementById(\"notificationCenter\"),clear=document.getElementById(\"clearNotificationsBtn\");if(bell)bell.addEventListener(\"click\",function(){notificationPanelOpen=!notificationPanelOpen;if(panel)panel.classList.toggle(\"visible\",notificationPanelOpen);if(notificationPanelOpen){uiNotifications=uiNotifications.map(function(n){n.read=true;return n});storageSet(\"dread_notifications\",JSON.stringify(uiNotifications));renderNotifications();}});if(clear)clear.addEventListener(\"click\",function(){uiNotifications=[];storageSet(\"dread_notifications\",\"[]\");renderNotifications();});syncNotificationUi();renderNotifications();},0);\\nsetInterval(syncNotificationUi,300);";
  if(!client.includes("function pushNotification(")){
    const end=client.lastIndexOf("})();");if(end<0)throw new Error("restore-all: client IIFE end missing");
    client=client.slice(0,end)+"\\n"+notificationRuntime+"\\n"+client.slice(end);
  }
  if(!client.includes("maybeStoreNotification(text);"))client=client.replace('function toast(text){\\n  notice.textContent=text;notice.classList.add("visible");','function toast(text){\\n  notice.textContent=text;notice.classList.add("visible");\\n  maybeStoreNotification(text);');
  if(client.includes('if(m.ok){$("developerCodeInput").value="";playSfx("coin");}')&&!client.includes('pushNotification(translateServerText(m.message'))client=client.replace('if(m.ok){$("developerCodeInput").value="";playSfx("coin");}','if(m.ok){$("developerCodeInput").value="";playSfx("coin");pushNotification(translateServerText(m.message||"Код активирован"),"code");}');
  client=client.replace('const gameRail=$("gameRail"),combatLogPanel=$("combatLogPanel");','const combatLogPanel=$("combatLogPanel");');
  client=client.replace('const inRun=!!state?.started&&!lobby.classList.contains("visible");gameRail?.classList.toggle("hidden",!inRun);combatLogPanel?.classList.toggle("hidden",!inRun);','const inRun=!!state?.started&&!lobby.classList.contains("visible");combatLogPanel?.classList.toggle("hidden",!inRun);');
  new Function(client);write("public/client.js",client);
  const cssMarker="/* DREAD SHIFT restore-all notification center */";
  if(!css.includes(cssMarker)){css+="\\n"+"/* DREAD SHIFT restore-all notification center */\\n.notification-bell{position:fixed;right:14px;top:14px;z-index:100;width:46px;height:46px;border-radius:15px;border:1px solid rgba(255,255,255,.12);background:rgba(10,16,19,.96);color:#edf5f2;font-size:20px;display:grid;place-items:center;box-shadow:0 12px 34px rgba(0,0,0,.38)}\\n.notification-bell span{position:absolute;right:-4px;top:-5px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#e65d67;color:white;font-size:10px;font-weight:950;display:grid;place-items:center}\\n.notification-center{position:fixed;right:14px;top:68px;z-index:99;width:min(370px,calc(100vw - 28px));max-height:480px;display:none;overflow:hidden;border-radius:17px;border:1px solid rgba(255,255,255,.11);background:rgba(8,13,16,.98);box-shadow:0 26px 80px rgba(0,0,0,.58);backdrop-filter:blur(12px)}\\n.notification-center.visible{display:block}.notification-center header{display:flex;align-items:center;justify-content:space-between;padding:14px 15px;border-bottom:1px solid rgba(255,255,255,.07)}.notification-center header small{display:block;color:#6ed996;font-size:9px;font-weight:900;letter-spacing:.14em}.notification-center header b{font-size:13px}.notification-center header button{border:0;background:transparent;color:#7e8d93;font-size:11px}.notification-list{max-height:410px;overflow:auto;padding:8px}.notification-item{display:grid;grid-template-columns:1fr auto;gap:8px;padding:11px 12px;border-radius:11px;color:#dce5e1}.notification-item.unread{background:#102019}.notification-item b{font-size:12px;line-height:1.35}.notification-item small{font-size:9px;color:#728087}.notification-empty{padding:25px 16px;text-align:center;color:#76858b;font-size:12px}\\n#openWhatsNewBtn.restore-whats-new{position:fixed!important;top:14px!important;right:66px!important;z-index:100!important;width:auto!important;min-height:42px!important;padding:0 12px!important;border-radius:12px!important;font-size:11px!important;white-space:nowrap!important}\\n.lobby-side-actions{z-index:98!important}\\n@media(max-width:760px){.notification-bell{top:10px;right:10px}.notification-center{top:62px;right:10px}#openWhatsNewBtn.restore-whats-new{top:10px!important;right:58px!important;min-height:40px!important;padding:0 9px!important}}"+"\\n";write("public/style.css",css);}
  let finalServer=read("server.js");
  if(!finalServer.includes('if(m.type==="redeemCode")')){
    const getMetaBlock='    if(m.type==="getMeta"){\n      const profile=p?.profile||account.username;\n      const target=p||loadMetaTarget(profile,account);sendMeta(ws,target);return;\n    }\n';
    if(!finalServer.includes(getMetaBlock))throw new Error("restore-all: getMeta handler anchor missing");
    const redeemHandler='    if(m.type==="redeemCode"){\n      const profile=p?.profile||account.username;\n      if(room?.started)return send(ws,"codeRedeemResult",{ok:false,message:"Коды можно активировать только в лобби"});\n      if(!p&&activeProfiles.has(profile))return send(ws,"codeRedeemResult",{ok:false,message:"Этот аккаунт сейчас используется в активном забеге"});\n      const target=p||loadMetaTarget(profile,account);\n      const result=redeemDeveloperCode(target,m.code);\n      send(ws,"codeRedeemResult",result);sendMeta(ws,target);return;\n    }\n';
    finalServer=finalServer.replace(getMetaBlock,getMetaBlock+redeemHandler);
    new Function(finalServer);
    write("server.js",finalServer);
  }
  const server=read("server.js"),finalClient=read("public/client.js"),finalCss=read("public/style.css"),finalHtml=read("public/index.html");
  const required=[
    [finalHtml.includes('id="notificationBell"')&&finalHtml.includes('id="notificationCenter"'),"notification HTML"],
    [finalHtml.includes('id="openWhatsNewBtn"'),"What\'s New"],
    [finalHtml.includes('id="indexBookBtn"')&&finalHtml.includes('id="codesBtn"'),"INDEX/CODES buttons"],
    [server.includes('WELCOME:{display:"Welcome",silver:300,gold:25,crateTokens:1}'),"Welcome code rewards"],
    [server.includes('TEST:{display:"TEST",silver:150,gold:10,crateTokens:0}'),"TEST code rewards"],
    [server.includes("room.phaseTimer=30;"),"30 second preparation"],
    [server.includes("RUN_MILESTONE_REWARDS"),"run milestone rewards"],
    [finalClient.includes("function openCodes("),"CODES client"],
    [finalClient.includes("function pushNotification("),"notification runtime"],
    [finalClient.includes("smoothPets=new Map()"),"smooth pets"],
    [finalCss.includes(cssMarker),"notification styles"]
  ];
  for(const [ok,label] of required)if(!ok)throw new Error("restore-all validation failed: "+label);
  console.log("DREAD SHIFT restore-all patch applied and validated.");
})();
