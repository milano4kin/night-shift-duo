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
