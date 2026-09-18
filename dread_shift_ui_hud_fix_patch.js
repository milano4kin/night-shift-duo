"use strict";
const fs=require("node:fs"),path=require("node:path");
const F=r=>path.join(__dirname,r),R=r=>fs.readFileSync(F(r),"utf8"),W=(r,s)=>fs.writeFileSync(F(r),s,"utf8");
const marker="/* DREAD SHIFT UI HUD fix 2026-09-18 */";

let html=R("public/index.html"),client=R("public/client.js"),css=R("public/style.css");
let htmlChanged=false,clientChanged=false,cssChanged=false;

// Keep the password reveal buttons available even if this patch is applied to an older base checkout.
if(!html.includes('data-password-target="loginPassword"')){
  const old='<label>Пароль<input id="loginPassword" type="password" maxlength="72" autocomplete="current-password" placeholder="минимум 6 символов"></label>';
  const next='<label>Пароль<div class="password-field"><input id="loginPassword" type="password" maxlength="72" autocomplete="current-password" placeholder="минимум 6 символов"><button class="password-toggle" data-password-target="loginPassword" type="button" title="Показать пароль" aria-label="Показать пароль">👁</button></div></label>';
  if(!html.includes(old))throw new Error("ui-hud-fix: login password anchor missing");
  html=html.replace(old,next);htmlChanged=true;
}
if(!html.includes('data-password-target="registerPassword"')){
  const old='<label>Пароль<input id="registerPassword" type="password" maxlength="72" autocomplete="new-password" placeholder="минимум 6 символов"></label>';
  const next='<label>Пароль<div class="password-field"><input id="registerPassword" type="password" maxlength="72" autocomplete="new-password" placeholder="минимум 6 символов"><button class="password-toggle" data-password-target="registerPassword" type="button" title="Показать пароль" aria-label="Показать пароль">👁</button></div></label>';
  if(!html.includes(old))throw new Error("ui-hud-fix: register password anchor missing");
  html=html.replace(old,next);htmlChanged=true;
}

// The restore listener runs outside the main IIFE. It cannot use the IIFE-local $ helper.
// Use the DOM API directly so the eye button really changes input.type.
if(client.includes('const input=$(btn.dataset.passwordTarget);')){
  client=client.replaceAll('const input=$(btn.dataset.passwordTarget);','const input=document.getElementById(btn.dataset.passwordTarget);');
  clientChanged=true;
}

// The weapon slot already contains weapon name + ammo. Remove the duplicate canvas strip
// that sat immediately behind/above the hotbar and made the pistol panel look obstructed.
const ammoStart=client.indexOf("  // Compact ammo strip above the hotbar; the weapon slot already contains the detailed weapon info.");
if(ammoStart>=0){
  const ammoEnd=client.indexOf("  if(comboFlash && performance.now()>=comboFlash.until)comboFlash=null;",ammoStart);
  if(ammoEnd<0)throw new Error("ui-hud-fix: duplicate ammo strip end anchor missing");
  client=client.slice(0,ammoStart)+client.slice(ammoEnd);
  clientChanged=true;
}

// Generator SHOP/UPGRADE are preparation-only UI. At night they disappear and any open
// workshop overlay is immediately closed so enemies behind the generator stay visible.
const coreStart=client.indexOf("function updateCoreActions(){");
if(coreStart<0)throw new Error("ui-hud-fix: updateCoreActions missing");
const coreEnd=client.indexOf('\n}\n\n$("talentList")',coreStart);
if(coreEnd<0)throw new Error("ui-hud-fix: updateCoreActions end anchor missing");
const coreFn=[
  'function updateCoreActions(){',
  '  const el=$("coreActions"),p=myPlayer();if(!el)return;',
  '  const prep=state?.started&&state?.phase==="day";',
  '  const near=!!(prep&&p&&state?.core&&Math.hypot(p.x-state.core.x,p.y-state.core.y)<RUN_SHOP_RADIUS);',
  '  el.classList.toggle("hidden",!near);',
  '  if(!near){',
  '    if(state?.started&&state?.phase!=="day"){',
  '      if(runShopOverlay?.classList.contains("visible"))closeRunShop();',
  '      if(runUpgradeOverlay?.classList.contains("visible"))closeRunUpgrade();',
  '    }',
  '    return;',
  '  }',
  '  const pos=sc(state.core.x,state.core.y),safeX=Math.max(116,Math.min(innerWidth-116,pos.x)),safeY=Math.max(96,Math.min(innerHeight-136,pos.y+104));',
  '  el.style.left=`${safeX}px`;el.style.top=`${safeY}px`;el.dataset.coreLevel=String(state.core.level||1);',
  '}'
].join("\n");
client=client.slice(0,coreStart)+coreFn+client.slice(coreEnd+2);
clientChanged=true;

// "What's New" belongs to the lobby. Force-hide it every rendered frame during a run,
// independent of older notification wrappers that may move/re-show that button.
const inRunAnchor='const inRun=!!state?.started&&!lobby.classList.contains("visible");';
if(!client.includes('classList.toggle("ds-run-hidden",inRun)')){
  const i=client.indexOf(inRunAnchor);
  if(i<0)throw new Error("ui-hud-fix: inRun frame anchor missing");
  client=client.slice(0,i)+inRunAnchor+'$("openWhatsNewBtn")?.classList.toggle("ds-run-hidden",inRun);if(inRun)$("whatsNewOverlay")?.classList.remove("visible");'+client.slice(i+inRunAnchor.length);
  clientChanged=true;
}

if(!client.includes(marker)){client+="\n"+marker+"\n";clientChanged=true;}

const cssBlock=`
${marker}
.ds-run-hidden{display:none!important}

/* Cleaner compact combat hotbar: no clipped first slot and no oversized cards. */
#hotbar.hotbar{
  left:50%!important;bottom:12px!important;transform:translateX(-50%)!important;
  width:max-content!important;max-width:calc(100vw - 28px)!important;
  box-sizing:border-box!important;padding:6px 7px!important;gap:4px!important;
  overflow-x:auto!important;overflow-y:hidden!important;scroll-padding-inline:7px!important;
  border:1px solid rgba(151,184,198,.18)!important;border-radius:15px!important;
  background:linear-gradient(180deg,rgba(8,15,19,.94),rgba(5,10,13,.96))!important;
  box-shadow:0 12px 34px rgba(0,0,0,.46),inset 0 1px rgba(255,255,255,.025)!important;
  backdrop-filter:blur(8px)!important;
}
#hotbar.hotbar::-webkit-scrollbar{height:4px}
#hotbar.hotbar::-webkit-scrollbar-thumb{background:rgba(132,166,181,.32);border-radius:999px}
#hotbar .slot{
  box-sizing:border-box!important;flex:0 0 62px!important;width:62px!important;min-width:62px!important;
  height:76px!important;min-height:76px!important;padding:5px 4px!important;gap:1px!important;
  border:1px solid #31404a!important;border-radius:9px!important;
  background:linear-gradient(180deg,#121c22,#0b1216)!important;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.018)!important;
  overflow:hidden!important;
}
#hotbar .slot:hover{transform:translateY(-1px)!important;border-color:#657e8c!important;background:linear-gradient(180deg,#17252c,#0d161b)!important}
#hotbar .slot.selected{border-color:#62c9ff!important;box-shadow:0 0 0 1px rgba(98,201,255,.28),inset 0 0 16px rgba(56,160,214,.09)!important}
#hotbar .slot-key{left:5px!important;top:4px!important;font-size:9px!important;line-height:11px!important;color:#bac7cd!important}
#hotbar .slot-icon{font-size:20px!important;line-height:24px!important;min-height:24px!important;flex:0 0 24px!important;margin-top:3px!important}
#hotbar .slot-name{
  width:100%!important;max-width:100%!important;min-height:18px!important;margin:0!important;
  display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2!important;
  overflow:hidden!important;white-space:normal!important;overflow-wrap:anywhere!important;
  font-size:8px!important;line-height:9px!important;text-align:center!important;color:#b7c3c8!important;
}
#hotbar .slot.build{height:76px!important;min-height:76px!important;padding:4px 3px 5px!important}
#hotbar .build-slot-img{width:31px!important;height:29px!important;min-height:29px!important;flex:0 0 29px!important;margin:1px auto 0!important;object-fit:contain!important}
#hotbar .slot.build .slot-name{min-height:17px!important;font-size:8px!important;line-height:9px!important}
#hotbar .slot.build .slot-cost{
  display:block!important;width:100%!important;min-height:16px!important;margin-top:auto!important;
  overflow:hidden!important;white-space:normal!important;font-size:7px!important;line-height:8px!important;
  text-align:center!important;color:#cdbf83!important;
}
#hotbar .weapon-slot{
  box-sizing:border-box!important;flex:0 0 108px!important;width:108px!important;min-width:108px!important;
  height:76px!important;min-height:76px!important;padding:4px 6px 5px!important;
  display:grid!important;grid-template-rows:24px 18px 8px 14px!important;align-content:center!important;
  justify-items:center!important;gap:1px!important;overflow:hidden!important;
}
#hotbar .weapon-slot-img{grid-row:1!important;width:58px!important;height:24px!important;max-width:58px!important;margin:0!important;object-fit:contain!important}
#hotbar .weapon-slot .slot-name{grid-row:2!important;width:94px!important;max-width:94px!important;min-height:18px!important;font-size:8px!important;line-height:9px!important}
#hotbar .weapon-slot-stars{grid-row:3!important;height:8px!important;line-height:8px!important;margin:0!important;font-size:8px!important}
#hotbar .weapon-slot .weapon-ammo-label{grid-row:4!important;height:14px!important;min-height:14px!important;line-height:14px!important;margin:0!important;font-size:11px!important;white-space:nowrap!important}
#hotbar .medkit-count{font-size:9px!important}
#hotbar .hotbar-sep{flex:0 0 1px!important;width:1px!important;height:46px!important;margin:0 1px!important;align-self:center!important;background:rgba(255,255,255,.10)!important}

/* The generator controls are intentionally small and only exist during preparation. */
.core-actions{gap:6px!important;filter:drop-shadow(0 6px 14px rgba(0,0,0,.48))!important}
.core-actions button{min-width:88px!important;padding:8px 12px!important;font-size:10px!important;border-radius:9px!important}

.password-toggle{pointer-events:auto!important;cursor:pointer!important;user-select:none!important}

@media(max-width:900px){
  #hotbar.hotbar{max-width:calc(100vw - 16px)!important;padding:5px!important;gap:3px!important}
  #hotbar .slot{flex-basis:56px!important;width:56px!important;min-width:56px!important}
  #hotbar .weapon-slot{flex-basis:96px!important;width:96px!important;min-width:96px!important}
  #hotbar .weapon-slot .slot-name{width:84px!important;max-width:84px!important;font-size:7px!important}
  #hotbar .slot.build .slot-cost{font-size:6.5px!important}
}
`;
if(!css.includes(marker)){css+="\n"+cssBlock+"\n";cssChanged=true;}

if(htmlChanged)W("public/index.html",html);
if(clientChanged){new Function(client);W("public/client.js",client);}
if(cssChanged)W("public/style.css",css);

const finalHtml=R("public/index.html"),finalClient=R("public/client.js"),finalCss=R("public/style.css");
const checks=[
  [finalHtml.includes('data-password-target="loginPassword"')&&finalHtml.includes('data-password-target="registerPassword"'),"password eye HTML"],
  [finalHtml.includes('data-password-target="loginPassword"')&&finalHtml.includes('data-password-target="registerPassword"'),"password eye controls"],
  [!finalClient.includes('const input=$(btn.dataset.passwordTarget);'),"broken password helper removed"],
  [!finalClient.includes("// Compact ammo strip above the hotbar;"),"duplicate weapon strip removed"],
  [finalClient.includes('const prep=state?.started&&state?.phase==="day";'),"generator day-only visibility"],
  [finalClient.includes('classList.toggle("ds-run-hidden",inRun)'),"What's New in-run hiding"],
  [finalCss.includes(marker)&&finalCss.includes("#hotbar .weapon-slot{"),"compact hotbar CSS"]
];
for(const [ok,label] of checks)if(!ok)throw new Error("ui-hud-fix validation failed: "+label);
console.log("DREAD SHIFT UI/HUD fix applied:",{htmlChanged,clientChanged,cssChanged});
