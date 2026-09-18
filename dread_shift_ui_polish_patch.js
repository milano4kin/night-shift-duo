"use strict";
const fs=require("node:fs"),path=require("node:path");
const F=r=>path.join(__dirname,r),R=r=>fs.readFileSync(F(r),"utf8"),W=(r,s)=>fs.writeFileSync(F(r),s,"utf8");
const marker="/* DREAD SHIFT lobby polish 2026-09-18 */";
let html=R("public/index.html"),client=R("public/client.js"),css=R("public/style.css");
let hd=false,cd=false,sd=false;
if(html.includes('placeholder="например milano4kin"')){html=html.replace('placeholder="например milano4kin"','placeholder="например: Player123"');hd=true;}

function eyeButton(target){
  return '<button class="password-toggle" data-password-target="'+target+'" type="button" title="Показать пароль" aria-label="Показать пароль" aria-pressed="false" onclick="const i=document.getElementById(\''+target+'\');if(i){i.type=i.type===\'password\'?\'text\':\'password\';this.textContent=i.type===\'password\'?\'👁\':\'🙈\';this.setAttribute(\'aria-pressed\',String(i.type===\'text\'));}">👁</button>';
}
for(const target of ["loginPassword","registerPassword"]){
  const re=new RegExp('<button class="password-toggle" data-password-target="'+target+'"[^>]*>[^<]*<\\/button>');
  if(!re.test(html))throw new Error("ui-polish: missing password toggle "+target);
  html=html.replace(re,eyeButton(target));hd=true;
}
const pwBind=/;?document\.querySelectorAll\("\[data-password-target\]"\)\.forEach\(btn=>btn\.addEventListener\("click",\(\)=>\{[\s\S]*?\}\)\);?/g;
if(pwBind.test(client)){client=client.replace(pwBind,"");cd=true;}

html=html.replace("ОБНОВЛЕНИЕ V8.0","DREAD SHIFT · UPDATE 8.9.9").replace("РЕВОЛЮЦИЯ ШТАБА","ПОСЛЕДНИЕ ИЗМЕНЕНИЯ");hd=true;

if(!client.includes("function openLobbySettings(){")){
  const a="function openPause(){";
  if(!client.includes(a))throw new Error("ui-polish: openPause anchor missing");
  client=client.replace(a,'function openLobbySettings(){pauseOpen=false;pauseOverlay.classList.add("visible","lobby-settings-open");$("pauseMainMenu").classList.add("hidden");$("pauseSettingsPanel").classList.remove("hidden");syncSettingsUi();}\n'+a);cd=true;
}
if(client.includes('$("quickSettingsBtn").onclick=()=>openPause();')){client=client.replace('$("quickSettingsBtn").onclick=()=>openPause();','$("quickSettingsBtn").onclick=()=>state?.started?openPause():openLobbySettings();');cd=true;}
const backOld='$("pauseBackBtn").onclick=()=>{$("pauseSettingsPanel").classList.add("hidden");$("pauseMainMenu").classList.remove("hidden");};';
if(client.includes(backOld)){client=client.replace(backOld,'$("pauseBackBtn").onclick=()=>{if(!state?.started){pauseOverlay.classList.remove("visible","lobby-settings-open");$("pauseSettingsPanel").classList.add("hidden");return;}$("pauseSettingsPanel").classList.add("hidden");$("pauseMainMenu").classList.remove("hidden");};');cd=true;}
if(client.includes('function closePause(){pauseOpen=false;pauseOverlay.classList.remove("visible");')){client=client.replace('function closePause(){pauseOpen=false;pauseOverlay.classList.remove("visible");','function closePause(){pauseOpen=false;pauseOverlay.classList.remove("visible","lobby-settings-open");');cd=true;}
const qOld='$("quickSettingsBtn")?.classList.toggle("hidden",!inRun);';
if(client.includes(qOld)){client=client.replace(qOld,'const lobbySettingsVisible=lobby.classList.contains("visible")&&!document.getElementById("authOverlay")?.classList.contains("visible")&&!state?.started;$("quickSettingsBtn")?.classList.toggle("hidden",!(inRun||lobbySettingsVisible));$("quickSettingsBtn")?.classList.toggle("lobby-settings",lobbySettingsVisible);');cd=true;}
if(!client.includes(marker)){client+="\n"+marker+"\n";cd=true;}

const cssBlock=`
/* DREAD SHIFT lobby polish 2026-09-18 */
.quick-settings-btn.lobby-settings{position:absolute!important;right:18px!important;top:66px!important;z-index:121!important;width:42px!important;height:42px!important;border-radius:12px!important;border:1px solid rgba(133,185,211,.24)!important;background:linear-gradient(180deg,rgba(18,29,36,.98),rgba(8,14,18,.98))!important;color:#edf7fb!important;font-size:19px!important;box-shadow:0 10px 28px rgba(0,0,0,.34)!important}
.quick-settings-btn.lobby-settings:hover{border-color:#79d6a0!important;background:#13231d!important}
.pause-overlay.lobby-settings-open{z-index:230!important;background:rgba(2,6,8,.76)!important;backdrop-filter:blur(8px)!important}
.pause-overlay.lobby-settings-open .pause-card{width:min(540px,94vw)!important;border-color:rgba(116,209,151,.22)!important}
.password-field{display:grid!important;grid-template-columns:minmax(0,1fr) 46px!important;gap:8px!important;align-items:stretch!important}
.password-field input{min-width:0!important;width:100%!important}
.password-toggle{width:46px!important;min-width:46px!important;padding:0!important;border-radius:10px!important;border:1px solid #314047!important;background:#10181c!important;color:#dbe7eb!important;font-size:16px!important;line-height:1!important;cursor:pointer!important;pointer-events:auto!important}
.password-toggle:hover{border-color:#6dcc91!important;background:#15221c!important}

.death-card{width:min(760px,94vw)!important;padding:30px 34px 32px!important;border-radius:26px!important;background:linear-gradient(180deg,rgba(19,17,20,.99),rgba(8,12,14,.99))!important;box-shadow:0 38px 120px rgba(0,0,0,.72)!important}
.death-stats{grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:10px!important;margin:20px 0 18px!important}
.death-stats>div{padding:13px 9px!important;border-radius:12px!important;background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.018))!important}
.death-reward-stat{position:relative!important;grid-column:1/-1!important;min-height:88px!important;display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:center!important;padding:18px 20px 16px 72px!important;border:1px solid rgba(239,199,83,.36)!important;border-radius:16px!important;background:radial-gradient(circle at 85% 20%,rgba(238,187,54,.12),transparent 38%),linear-gradient(135deg,rgba(62,47,17,.58),rgba(13,24,21,.84))!important;box-shadow:inset 0 0 36px rgba(239,199,83,.04)!important}
.death-reward-stat:before{content:"G";position:absolute;left:18px;top:50%;transform:translateY(-50%);width:38px;height:38px;display:grid;place-items:center;border-radius:50%;background:linear-gradient(145deg,#ffe58a,#aa7617);color:#2a1b02;font:1000 18px/1 system-ui;box-shadow:0 0 22px rgba(246,197,54,.22)}
.death-reward-stat:after{content:"НАГРАДА ЗА ЗАБЕГ";position:absolute;left:72px;top:14px;color:#d8bb61;font:950 8px/1 system-ui;letter-spacing:.14em}
.death-reward-stat b{margin-top:10px!important;color:#ffe486!important;font-size:22px!important;text-align:left!important;letter-spacing:.02em!important}
.death-reward-stat span{margin-top:4px!important;color:#9b9a85!important;font-size:10px!important;text-align:left!important}

.whats-new-overlay{background:radial-gradient(circle at 50% 18%,rgba(48,124,82,.22),transparent 44%),rgba(2,6,8,.86)!important;backdrop-filter:blur(8px)!important}
.whats-new-card{width:min(820px,94vw)!important;padding:30px!important;border-radius:26px!important;border:1px solid rgba(117,219,157,.22)!important;background:radial-gradient(circle at 8% 4%,rgba(91,218,139,.10),transparent 25%),linear-gradient(180deg,#111b1e,#080e11)!important;box-shadow:0 38px 120px rgba(0,0,0,.72)!important;overflow:hidden!important}
.whats-new-card>.tag{display:inline-flex!important;padding:6px 9px!important;border:1px solid rgba(117,219,157,.20)!important;border-radius:999px!important;background:rgba(63,146,94,.10)!important;color:#8de0aa!important;font-size:8px!important;letter-spacing:.13em!important}
.whats-new-card h2{margin:10px 0 6px!important;font-size:34px!important;line-height:1!important;letter-spacing:-.025em!important}
.whats-new-card h2:after{content:"Стабильный билд · новые системы · меньше помех во время боя";display:block;margin-top:9px;color:#829297;font:700 11px/1.45 system-ui;letter-spacing:0}
.whats-new-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;margin:22px 0!important}
.whats-new-grid article{position:relative!important;min-height:80px!important;padding:15px 16px!important;border-radius:15px!important;border:1px solid rgba(255,255,255,.07)!important;background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.014))!important;box-shadow:inset 0 1px rgba(255,255,255,.015)!important}
.whats-new-grid article:hover{border-color:rgba(112,216,152,.22)!important;background:rgba(53,111,75,.08)!important}
.whats-new-grid b{font-size:12px!important;color:#eaf2ef!important}
.whats-new-grid span{font-size:10px!important;color:#839297!important;line-height:1.5!important}
.whats-new-card>#whatsNewOkBtn{width:100%!important;margin-top:3px!important;padding:14px!important;border-radius:13px!important;background:linear-gradient(180deg,#dff5e7,#b9e6c9)!important;color:#07120c!important;box-shadow:0 8px 24px rgba(92,214,136,.10)!important}
@media(max-width:700px){.death-stats{grid-template-columns:repeat(2,minmax(0,1fr))!important}.death-reward-stat{padding-left:66px!important}.whats-new-grid{grid-template-columns:1fr!important}.whats-new-card{padding:22px!important}.whats-new-card h2{font-size:28px!important}}
`;
if(!css.includes(marker)){css+="\n"+cssBlock+"\n";sd=true;}

if(hd)W("public/index.html",html);
if(cd){new Function(client);W("public/client.js",client);}
if(sd)W("public/style.css",css);
const H=R("public/index.html"),C=R("public/client.js"),S=R("public/style.css");
const checks=[
  [H.includes("onclick=\"const i=document.getElementById('loginPassword')"),"login inline eye"],
  [H.includes("onclick=\"const i=document.getElementById('registerPassword')"),"register inline eye"],
  [!C.includes('document.querySelectorAll("[data-password-target]")'),"old eye binding removed"],
  [C.includes("function openLobbySettings(){")&&C.includes("lobbySettingsVisible"),"lobby settings"],
  [H.includes("DREAD SHIFT · UPDATE 8.9.9"),"What New heading"],
  [S.includes(".death-reward-stat:before")&&S.includes(".whats-new-overlay"),"visual polish"]
];
for(const [ok,label] of checks)if(!ok)throw new Error("ui-polish validation failed: "+label);
console.log("DREAD SHIFT lobby polish applied",{html:hd,client:cd,css:sd});
