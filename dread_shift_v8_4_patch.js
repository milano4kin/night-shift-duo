"use strict";

const fs=require("fs");
const path=require("path");
const file=rel=>path.join(__dirname,rel);
const read=rel=>fs.readFileSync(file(rel),"utf8");
const write=(rel,s)=>fs.writeFileSync(file(rel),s,"utf8");

function required(s,from,to,label){
  if(!s.includes(from))throw new Error(`v8.4 target missing: ${label}`);
  return s.replace(from,to);
}
function optional(s,from,to){return s.includes(from)?s.replace(from,to):s;}
function assertHas(s,needle,label){if(!s.includes(needle))throw new Error(`v8.4 verification failed: ${label}`);}

function patchServer(){
  let s=read("server.js");
  if(s.includes("/* DREAD SHIFT v8.4 server */"))return false;

  s=required(s,'const BUILD_VERSION = "8.3.0";','const BUILD_VERSION = "8.4.0";',"build version");

  // Every preparation window lasts 30 seconds. The player can still skip it manually.
  s=required(s,'  room.phaseTimer=first?15:21;','  room.phaseTimer=30;',"30 second preparation");

  // The snapshot stream was reduced too aggressively in the old smoothing patch.
  // Backpressure still drops stale snapshots, so 18 Hz stays safe while making 50-100 ms connections much more responsive.
  s=required(s,'const SNAPSHOT_HZ = 12;','const SNAPSHOT_HZ = 18;',"snapshot rate");

  // Updated developer-code economy. Codes remain one-time per account.
  s=required(s,
    '  WELCOME:{display:"Welcome",silver:500,gold:50,crateTokens:1},\n  TEST:{display:"TEST",silver:1000,gold:100,crateTokens:2}',
    '  WELCOME:{display:"Welcome",silver:300,gold:25,crateTokens:1},\n  TEST:{display:"TEST",silver:150,gold:10,crateTokens:0}',
    "developer code rewards"
  );
  s=optional(s,
    'if(cfg.crateTokens)rewards.push(`+${cfg.crateTokens} ${cfg.crateTokens===1?"жетон ящика":"жетона ящика"}`);',
    'if(cfg.crateTokens)rewards.push(`+${cfg.crateTokens} ${cfg.crateTokens===1?"купон на ящик питомца":"купона на ящик питомца"}`);'
  );

  // Tell the client whether the pet was actually new. Duplicates must not create a "new pet" notification.
  s=required(s,
    '  const result=weightedPetRoll();target.petsOwned[result]=(target.petsOwned[result]||0)+1;\n  saveProgress(target);return {pet:result,reel:buildCrateReel(result),usedToken:useToken};',
    '  const result=weightedPetRoll(),previousCount=target.petsOwned[result]||0,isNew=previousCount<=0;target.petsOwned[result]=previousCount+1;\n  saveProgress(target);return {pet:result,reel:buildCrateReel(result),usedToken:useToken,isNew};',
    "crate duplicate detection"
  );
  s=required(s,
    'if(ok)send(ws,"crateOpened",{pet:result.pet,reel:result.reel,usedToken:result.usedToken,meta:metaSnapshot(target)});',
    'if(ok)send(ws,"crateOpened",{pet:result.pet,reel:result.reel,usedToken:result.usedToken,isNew:!!result.isNew,meta:metaSnapshot(target)});',
    "crate isNew payload"
  );

  assertHas(s,'room.phaseTimer=30;',"preparation timer");
  assertHas(s,'const SNAPSHOT_HZ = 18;',"snapshot rate result");
  assertHas(s,'WELCOME:{display:"Welcome",silver:300,gold:25,crateTokens:1}',"welcome reward result");
  assertHas(s,'TEST:{display:"TEST",silver:150,gold:10,crateTokens:0}',"test reward result");
  assertHas(s,'isNew=previousCount<=0',"pet duplicate result");
  s+='\n/* DREAD SHIFT v8.4 server */\n';
  write("server.js",s);return true;
}

function patchClient(){
  let s=read("public/client.js");
  if(s.includes("/* DREAD SHIFT v8.4 client */"))return false;

  // Explain the 10-floor campaign directly in the HUD: each floor is a block of five waves.
  const oldFloor="ctx.fillStyle=floorTheme.hud;ctx.font=`950 ${tiny?15:17}px system-ui`;ctx.fillText(`${T('Этаж','Floor')} ${Math.max(1,Math.min(10,(Number(state.floorStage)||0)+1))}/10`,rightX+12,floorY+22);";
  const newFloor="const floorNumber=Math.max(1,Math.min(10,(Number(state.floorStage)||0)+1)),floorWaveStart=(floorNumber-1)*5+1,floorWaveEnd=floorNumber*5;\n  ctx.fillStyle=floorTheme.hud;ctx.font=`950 ${tiny?13:15}px system-ui`;ctx.fillText(`${T('Этаж','Floor')} ${floorNumber}/10 · ${T('волны','waves')} ${floorWaveStart}–${floorWaveEnd}`,rightX+12,floorY+22);";
  s=required(s,oldFloor,newFloor,"floor range HUD");

  // The old anti-teleport correction was deliberately very weak and created an "ice skating" tail.
  // Keep prediction, but reconcile much faster on normal ping and settle immediately once the player stops.
  const oldReconcile=[
    '        const hardSnap=err>900;',
    '        let correction=hardSnap?1:(moving?.055:.10);',
    '        if(!hardSnap&&err>360)correction=Math.min(.24,correction*2.4);',
    '        else if(!hardSnap&&err>160)correction=Math.min(.16,correction*1.6);',
    '        if(!hardSnap&&netDelay>220)correction*=.78;',
    '        else if(!hardSnap&&netDelay>120)correction*=.88;',
    '        let step=err*correction;',
    '        if(!hardSnap)step=Math.min(step,moving?46:60);',
    '        if(err>.001){const nx=(mp.x-localPred.x)/err,ny=(mp.y-localPred.y)/err;localPred.x+=nx*step;localPred.y+=ny*step;}'
  ].join('\n');
  const newReconcile=[
    '        const hardSnap=err>520;',
    '        let correction=1;',
    '        if(!hardSnap){',
    '          if(netDelay<=100)correction=moving?.32:.72;',
    '          else if(netDelay<=180)correction=moving?.20:.48;',
    '          else if(netDelay<=300)correction=moving?.11:.30;',
    '          else correction=moving?.07:.20;',
    '          if(err>220)correction=Math.max(correction,.40);',
    '          else if(err>100)correction=Math.max(correction,.28);',
    '          // Kill the final drift after releasing movement keys instead of easing for several snapshots.',
    '          if(!moving&&netDelay<=110&&err<24)correction=1;',
    '        }',
    '        let step=err*correction;',
    '        if(!hardSnap){const cap=netDelay<=100?(moving?72:112):netDelay<=180?(moving?58:92):(moving?44:72);step=Math.min(step,cap);}',
    '        if(err>.001){const nx=(mp.x-localPred.x)/err,ny=(mp.y-localPred.y)/err;localPred.x+=nx*step;localPred.y+=ny*step;}'
  ].join('\n');
  s=required(s,oldReconcile,newReconcile,"player reconciliation");

  // Track whether a crate result is actually a first-time discovery.
  s=required(s,
    'let crateSpinLocked=false,crateCurrentResult=null,crateRevealTimer=null,serverPaused=false,runShopRenderSig="",pendingRunBuy=null,runUpgradeRenderSig="",pendingRunUpgrade=null,runUpgradeTab="weapon";',
    'let crateSpinLocked=false,crateCurrentResult=null,crateCurrentIsNew=false,crateRevealTimer=null,serverPaused=false,runShopRenderSig="",pendingRunBuy=null,runUpgradeRenderSig="",pendingRunUpgrade=null,runUpgradeTab="weapon";',
    "crate new-state variable"
  );
  s=required(s,
    'function showCrateSpin(payload){\n  const knownBefore={...(metaState?.petsOwned||{})};',
    'function showCrateSpin(payload){\n  const knownBefore={...(metaState?.petsOwned||{})};\n  crateCurrentIsNew=payload?.isNew===true||((knownBefore[payload?.pet]||0)<=0);',
    "crate new-state capture"
  );
  s=required(s,
    '  pushNotification(T("🐾 Новый питомец: "+cfg.name,"🐾 New pet: "+cfg.name),"pet");',
    '  if(crateCurrentIsNew)pushNotification(T("🐾 Новый питомец: "+cfg.name,"🐾 New pet: "+cfg.name),"pet");\n  crateCurrentIsNew=false;',
    "duplicate pet notification suppression"
  );

  // Notification bell belongs to the lobby only.
  s=required(s,
    'function syncNotificationUi(){var bell=document.getElementById("notificationBell"),auth=document.getElementById("authOverlay");if(bell)bell.classList.toggle("hidden",!!(auth&&auth.classList.contains("visible")));}',
    'function syncNotificationUi(){var bell=document.getElementById("notificationBell"),auth=document.getElementById("authOverlay"),lobbyEl=document.getElementById("lobby"),panel=document.getElementById("notificationCenter");var show=!!(lobbyEl&&lobbyEl.classList.contains("visible"))&&!(auth&&auth.classList.contains("visible"))&&!(state&&state.started);if(bell)bell.classList.toggle("hidden",!show);if(!show&&panel){panel.classList.remove("visible");notificationPanelOpen=false;}}',
    "lobby-only notification bell"
  );
  s=required(s,
    '      if(state.started){\n        lobby.classList.remove("visible");',
    '      if(state.started){\n        lobby.classList.remove("visible");syncNotificationUi();',
    "hide bell on run start"
  );
  s=required(s,
    '  status.textContent=T("Ожидание…","Waiting…");\n  lobby.classList.add("visible");',
    '  status.textContent=T("Ожидание…","Waiting…");\n  lobby.classList.add("visible");syncNotificationUi();',
    "restore bell in lobby"
  );

  assertHas(s,"floorWaveStart=(floorNumber-1)*5+1","floor HUD result");
  assertHas(s,"if(netDelay<=100)correction=moving?.32:.72","movement result");
  assertHas(s,"crateCurrentIsNew","crate duplicate result");
  assertHas(s,"!(state&&state.started)","bell visibility result");
  s+='\n/* DREAD SHIFT v8.4 client */\n';
  write("public/client.js",s);return true;
}

function patchHtml(){
  let s=read("public/index.html");
  if(s.includes("<!-- DREAD SHIFT v8.4 html -->"))return false;
  s=s.replaceAll("V8.3","V8.4").replaceAll("v8.3.0","v8.4.0").replaceAll("V8.2","V8.4").replaceAll("v8.2.0","v8.4.0");
  s+='\n<!-- DREAD SHIFT v8.4 html -->\n';
  write("public/index.html",s);return true;
}

function patchCss(){
  let s=read("public/style.css");
  if(s.includes("/* DREAD SHIFT v8.4 UI */"))return false;
  s+='\n/* DREAD SHIFT v8.4 UI */\n'+
    '/* Lobby-only bell: close enough to the language switch to feel related, but with a clear gap. */\n'+
    '.notification-bell{top:14px!important;right:14px!important}.notification-center{top:68px!important;right:14px!important}\n'+
    '@media(max-width:760px){.notification-bell{top:10px!important;right:10px!important}.notification-center{top:62px!important;right:10px!important}}\n';
  write("public/style.css",s);return true;
}

const changed={server:patchServer(),client:patchClient(),html:patchHtml(),css:patchCss()};
console.log("DREAD SHIFT v8.4 patch applied:",JSON.stringify(changed));
