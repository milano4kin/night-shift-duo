"use strict";

const fs=require("fs");
const path=require("path");

function read(rel){return fs.readFileSync(path.join(__dirname,rel),"utf8");}
function write(rel,s){fs.writeFileSync(path.join(__dirname,rel),s,"utf8");}
function mustReplace(s,from,to,label){if(!s.includes(from))throw new Error(`v8.2 target missing: ${label}`);return s.replace(from,to);}

function patchServer(){
  let s=read("server.js");
  if(s.includes("/* DREAD SHIFT v8.2 server */"))return false;
  s=s.replace('const BUILD_VERSION = "8.1.0";','const BUILD_VERSION = "8.2.0";');
  const costs={
    'cost:{wood:18,stone:4,scrap:0}':'cost:{wood:8,stone:3,scrap:2}',
    'cost:{wood:22,stone:5,scrap:4}':'cost:{wood:15,stone:5,scrap:3}',
    'cost:{wood:12,stone:14,scrap:55}':'cost:{wood:20,stone:15,scrap:35}',
    'cost:{wood:14,stone:10,scrap:60}':'cost:{wood:35,stone:25,scrap:60}',
    'cost:{wood:20,stone:6,scrap:35}':'cost:{wood:15,stone:10,scrap:25}',
    'cost:{wood:14,stone:12,scrap:45}':'cost:{wood:15,stone:15,scrap:30}',
    'cost:{wood:18,stone:8,scrap:52}':'cost:{wood:20,stone:15,scrap:40}'
  };
  for(const [a,b] of Object.entries(costs))s=mustReplace(s,a,b,`structure cost ${a}`);

  s=mustReplace(s,'const STRUCTURE_MAX_LEVEL = 5;','const STRUCTURE_MAX_LEVEL = 5;\nconst STRUCTURE_MAX_LEVEL_BY_TYPE={wall:5,gate:5,cannon:5,tesla:5,cat_tower:3,frost_tower:5,flame_tower:5,spikes:3};\nconst STRUCTURE_LEVEL_HP=[0,1,1.25,1.55,1.90,2.35];\nconst STRUCTURE_LEVEL_POWER=[0,1,1.18,1.40,1.68,1.98];\nconst STRUCTURE_LEVEL_RANGE=[0,1,1,1.06,1.12,1.18];\nconst STRUCTURE_LEVEL_COOLDOWN=[0,1,.97,.93,.88,.82];\nfunction structureMaxLevel(type){return STRUCTURE_MAX_LEVEL_BY_TYPE[type]||STRUCTURE_MAX_LEVEL;}\nfunction structureRangeMultiplier(st){return STRUCTURE_LEVEL_RANGE[Math.max(1,Math.min(5,st?.level||1))]||1;}\nfunction structureCooldownMultiplier(st){return STRUCTURE_LEVEL_COOLDOWN[Math.max(1,Math.min(5,st?.level||1))]||1;}','tower level config');
  s=s.replace('if(nextLevel > STRUCTURE_MAX_LEVEL) return null;','if(nextLevel > structureMaxLevel(type)) return null;');
  s=s.replace('if(st.level >= STRUCTURE_MAX_LEVEL) return send(p.ws,"notice",{text:"Постройка уже максимального уровня"});','if(st.level >= structureMaxLevel(st.type)) return send(p.ws,"notice",{text:"Постройка уже максимального уровня"});');

  s=s.replace('  st.level += 1;\n  st.power = 1 + (st.level-1)*0.25;\n\n  const oldMax = st.maxHp;\n  st.maxHp = Math.round(st.maxHp * 1.32);','  const prevLevel=st.level;\n  st.level += 1;\n  st.power = STRUCTURE_LEVEL_POWER[st.level]||1;\n\n  const oldMax = st.maxHp;\n  const hpRatio=(STRUCTURE_LEVEL_HP[st.level]||1)/(STRUCTURE_LEVEL_HP[prevLevel]||1);\n  st.maxHp = Math.round(st.maxHp * hpRatio);');

  s=s.replace('let t=null,best=520;','let t=null,best=520*structureRangeMultiplier(s);');
  s=s.replace('s.cooldown=1.25;addEffect','s.cooldown=1.25*structureCooldownMultiplier(s);addEffect');
  s=s.replace('let t=null,best=400;','let t=null,best=400*structureRangeMultiplier(s);');
  s=s.replace('s.cooldown=1.08;','s.cooldown=1.08*structureCooldownMultiplier(s);');
  s=s.replace('let t=null,best=125;','let t=null,best=125*structureRangeMultiplier(s);');
  s=s.replace('s.cooldown=.56;','s.cooldown=.56*structureCooldownMultiplier(s);');
  s=s.replace('let t=null,best=430;','let t=null,best=430*structureRangeMultiplier(s);');
  s=s.replace('s.cooldown=.88;','s.cooldown=.88*structureCooldownMultiplier(s);');
  s=s.replace('const targets=room.zombies.filter(z=>dist(s,z)<185)','const targets=room.zombies.filter(z=>dist(s,z)<185*structureRangeMultiplier(s))');
  s=s.replace('s.cooldown=.72;','s.cooldown=.72*structureCooldownMultiplier(s);');
  s+='\n/* DREAD SHIFT v8.2 server */\n';
  write("server.js",s);return true;
}

function patchClient(){
  let s=read("public/client.js");
  if(s.includes("/* DREAD SHIFT v8.2 client */"))return false;
  const costs={
    'wall:{wood:18,stone:4,scrap:0}':'wall:{wood:8,stone:3,scrap:2}',
    'gate:{wood:22,stone:5,scrap:4}':'gate:{wood:15,stone:5,scrap:3}',
    'cannon:{wood:12,stone:14,scrap:55}':'cannon:{wood:20,stone:15,scrap:35}',
    'tesla:{wood:14,stone:10,scrap:60}':'tesla:{wood:35,stone:25,scrap:60}',
    'cat_tower:{wood:20,stone:6,scrap:35}':'cat_tower:{wood:15,stone:10,scrap:25}',
    'frost_tower:{wood:14,stone:12,scrap:45}':'frost_tower:{wood:15,stone:15,scrap:30}',
    'flame_tower:{wood:18,stone:8,scrap:52}':'flame_tower:{wood:20,stone:15,scrap:40}'
  };
  for(const [a,b] of Object.entries(costs))s=mustReplace(s,a,b,`client structure cost ${a}`);

  s=mustReplace(s,'$("skipRunTutorialBtn").onclick=()=>{if(confirm("Пропустить обучение? Награду +150 серебра получить будет нельзя."))send("skipRunTutorial");};','$("skipRunTutorialBtn").onclick=()=>send("skipRunTutorial");','remove tutorial browser confirm');

  s=mustReplace(s,'function structureUpgradeCost(st){','const STRUCTURE_MAX_LEVEL_UI={wall:5,gate:5,cannon:5,tesla:5,cat_tower:3,frost_tower:5,flame_tower:5,spikes:3};\nconst STRUCTURE_LEVEL_HP_UI=[0,1,1.25,1.55,1.90,2.35];\nconst STRUCTURE_LEVEL_POWER_UI=[0,1,1.18,1.40,1.68,1.98];\nconst STRUCTURE_TIER_NAMES=["","БАЗОВЫЙ","СЕРЕБРО","ЗОЛОТО","ИЗУМРУД","АЛМАЗ"];\nfunction structureMaxLevelUi(type){return STRUCTURE_MAX_LEVEL_UI[type]||5;}\nfunction structureUpgradeCost(st){','structure ui helpers');
  s=s.replace('const lvl=st.level||1; if(lvl>=5)return null;','const lvl=st.level||1; if(lvl>=structureMaxLevelUi(st.type))return null;');
  s=s.replace('const lvl=st.level||1,cost=structureUpgradeCost(st),p=myPlayer(),canUp=!!cost&&lvl<5&&p&&canAfford(p.inventory,cost),repairPlan=structureRepairPlan(st);','const lvl=st.level||1,maxLvl=structureMaxLevelUi(st.type),cost=structureUpgradeCost(st),p=myPlayer(),canUp=!!cost&&lvl<maxLvl&&p&&canAfford(p.inventory,cost),repairPlan=structureRepairPlan(st);');
  s=s.replace('$("structureMenuLevel").textContent=`${T("Уровень","Level")} ${lvl} / 5`;','$("structureMenuLevel").textContent=`${T("Уровень","Level")} ${lvl} / ${maxLvl}`;');
  s=s.replace('$("structureMenuSummary").innerHTML=stats.map(x=>`<div>${esc(x)}</div>`).join("");','const nextLvl=Math.min(maxLvl,lvl+1),nextHp=lvl<maxLvl?Math.round(st.maxHp*((STRUCTURE_LEVEL_HP_UI[nextLvl]||1)/(STRUCTURE_LEVEL_HP_UI[lvl]||1))):st.maxHp;\n  const currentPower=STRUCTURE_LEVEL_POWER_UI[lvl]||1,nextPower=STRUCTURE_LEVEL_POWER_UI[nextLvl]||currentPower;\n  const levels=Array.from({length:maxLvl},(_,i)=>`<i class="structure-level-dot ${i+1<=lvl?`active level-${i+1}`:""}">${i+1}</i>`).join("");\n  $("structureMenuSummary").innerHTML=`<div class="structure-tier-head"><b>${STRUCTURE_TIER_NAMES[lvl]||"LEVEL"} · ${T("УР.","LVL")} ${lvl}</b><span>${levels}</span></div><div class="structure-stat-grid"><article><small>${T("ПРОЧНОСТЬ","DURABILITY")}</small><strong>${Math.ceil(st.maxHp)} HP</strong>${lvl<maxLvl?`<em>→ ${nextHp} HP</em>`:"<em>MAX</em>"}</article>${["wall","gate"].includes(st.type)?"":`<article><small>${T("МОЩНОСТЬ","POWER")}</small><strong>×${currentPower.toFixed(2)}</strong>${lvl<maxLvl?`<em>→ ×${nextPower.toFixed(2)}</em>`:"<em>MAX</em>"}</article>`}</div><div class="structure-live-stats">${stats.map(x=>`<div>${esc(x)}</div>`).join("")}</div>${lvl<maxLvl&&cost?`<div class="structure-next-cost"><span>${T("Следующее улучшение","Next upgrade")}</span><b>${costText(cost)}</b></div>`:""}`;');
  s=s.replace('up.disabled=lvl>=5||!cost;','up.disabled=lvl>=maxLvl||!cost;');
  s=s.replace('up.textContent=lvl>=5?T("МАКСИМАЛЬНЫЙ УРОВЕНЬ","MAX LEVEL"):cost?','up.textContent=lvl>=maxLvl?T("МАКСИМАЛЬНЫЙ УРОВЕНЬ","MAX LEVEL"):cost?');

  s=mustReplace(s,'function drawStructureShape(st,x,y,alpha=1,ghostColor=null){\n  ctx.save();','function structureLevelFilter(level){return level>=5?"brightness(1.14) saturate(1.35) hue-rotate(155deg)":level===4?"brightness(1.08) saturate(1.3) hue-rotate(65deg)":level===3?"sepia(.72) saturate(1.65) brightness(1.08)":level===2?"grayscale(.72) brightness(1.32) contrast(.88)":"none";}\nfunction structureLevelGlow(level){return ["","#000000","#d9e4ec","#ffd75e","#66ef9a","#70e8ff"][Math.max(1,Math.min(5,level||1))];}\nfunction drawStructureShape(st,x,y,alpha=1,ghostColor=null){\n  ctx.save();\n  if(!ghostColor&&st?.level>1){ctx.filter=structureLevelFilter(st.level);ctx.shadowColor=structureLevelGlow(st.level);ctx.shadowBlur=8+st.level*2;}','tower visual tiers');

  s=s.replace('function toast(text){\n  notice.textContent=text;notice.classList.add("visible");','function toast(text){\n  notice.textContent=text;notice.classList.add("visible");\n  maybeStoreNotification(text);');
  s=s.replace('$("crateResult").innerHTML=`<div class="crate-reveal"><img src="${cfg.img}" alt=""><div><small>${cfg.rarity.toUpperCase()}</small><b>${T("Выпал","Dropped")}: ${cfg.name}!</b></div></div>`;','$("crateResult").innerHTML=`<div class="crate-reveal"><img src="${cfg.img}" alt=""><div><small>${cfg.rarity.toUpperCase()}</small><b>${T("Выпал","Dropped")}: ${cfg.name}!</b></div></div>`;\n  pushNotification(T(`🐾 Новый питомец: ${cfg.name}`,`🐾 New pet: ${cfg.name}`),"pet");');

  const extra=`\nfunction notificationEscape(v){return String(v||"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}\nlet uiNotifications=[];try{uiNotifications=JSON.parse(storageGet("dread_notifications")||"[]")||[]}catch{}\nlet notificationPanelOpen=false;\nfunction renderNotifications(){const list=document.getElementById("notificationList"),count=document.getElementById("notificationCount");if(!list||!count)return;const unread=uiNotifications.filter(n=>!n.read).length;count.textContent=unread>9?"9+":String(unread);count.classList.toggle("hidden",unread===0);list.innerHTML=uiNotifications.length?uiNotifications.map(n=>\`<article class="notification-item \\${n.read?"":"unread"}"><b>\\${notificationEscape(n.text)}</b><small>\\${new Date(n.time).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</small></article>\`).join(""):\`<div class="notification-empty">\\${T("Пока тихо. Важные события появятся здесь.","Nothing important yet.")}</div>\`;}\nfunction pushNotification(text,type="info"){text=String(text||"").trim();if(!text)return;const now=Date.now();if(uiNotifications[0]&&uiNotifications[0].text===text&&now-uiNotifications[0].time<2500)return;uiNotifications.unshift({text,type,time:now,read:false});uiNotifications=uiNotifications.slice(0,30);storageSet("dread_notifications",JSON.stringify(uiNotifications));renderNotifications();}\nfunction maybeStoreNotification(text){const x=String(text||"");if(/достижен|achievement|нов(ый|ого) питом|new pet|новый враг|new enemy|код .*активирован|code .*redeem|уровень аккаунта|account level|обучение завершено|tutorial completed|босс|boss loot|открыт новый|unlocked/i.test(x))pushNotification(x);}\nfunction syncNotificationUi(){const bell=document.getElementById("notificationBell"),auth=document.getElementById("authOverlay");if(bell)bell.classList.toggle("hidden",!!auth?.classList.contains("visible"));}\nfunction syncLobbyFocusMode(){const join=document.getElementById("joinCodePanel"),wait=document.getElementById("roomWaitPanel");document.body.classList.toggle("room-focus-mode",!!join&&!join.classList.contains("hidden")||!!wait&&!wait.classList.contains("hidden"));}\nsetTimeout(()=>{const bell=document.getElementById("notificationBell"),panel=document.getElementById("notificationCenter"),clear=document.getElementById("clearNotificationsBtn");bell?.addEventListener("click",()=>{notificationPanelOpen=!notificationPanelOpen;panel?.classList.toggle("visible",notificationPanelOpen);if(notificationPanelOpen){uiNotifications=uiNotifications.map(n=>({...n,read:true}));storageSet("dread_notifications",JSON.stringify(uiNotifications));renderNotifications();}});clear?.addEventListener("click",()=>{uiNotifications=[];storageSet("dread_notifications","[]");renderNotifications();});document.addEventListener("mousedown",e=>{if(notificationPanelOpen&&panel&&!panel.contains(e.target)&&e.target!==bell){notificationPanelOpen=false;panel.classList.remove("visible");}});const obs=new MutationObserver(()=>{syncLobbyFocusMode();syncNotificationUi();});[document.getElementById("joinCodePanel"),document.getElementById("roomWaitPanel"),document.getElementById("authOverlay")].filter(Boolean).forEach(el=>obs.observe(el,{attributes:true,attributeFilter:["class"]}));syncLobbyFocusMode();syncNotificationUi();renderNotifications();},0);\n`;
  const end=s.lastIndexOf('})();');if(end<0)throw new Error('v8.2 client IIFE end missing');s=s.slice(0,end)+extra+s.slice(end);
  s+='\n/* DREAD SHIFT v8.2 client */\n';
  write("public/client.js",s);return true;
}

function patchHtml(){
  let s=read("public/index.html");
  if(s.includes("notificationBell"))return false;
  const marker='  <button id="quickSettingsBtn"';
  if(!s.includes(marker))throw new Error('v8.2 html marker missing');
  const block=`  <button id="notificationBell" class="notification-bell hidden" type="button" aria-label="Уведомления">🔔<span id="notificationCount" class="hidden">0</span></button>\n  <aside id="notificationCenter" class="notification-center"><header><div><small>DREAD SHIFT</small><b>УВЕДОМЛЕНИЯ</b></div><button id="clearNotificationsBtn" type="button">Очистить</button></header><div id="notificationList" class="notification-list"></div></aside>\n\n`;
  s=s.replace(marker,block+marker);
  s=s.replaceAll('V8.1','V8.2').replaceAll('v8.1.0','v8.2.0');
  write("public/index.html",s);return true;
}

function patchCss(){
  let s=read("public/style.css");
  if(s.includes("/* DREAD SHIFT v8.2 UI */"))return false;
  s+=`\n/* DREAD SHIFT v8.2 UI */\n.run-tutorial-panel{top:96px!important;z-index:46!important}\n.structure-menu-panel{width:min(720px,94vw)!important;padding:24px!important}.structure-menu-status{gap:10px!important}.structure-tier-head{display:flex;justify-content:space-between;align-items:center;margin:14px 0 10px;padding:12px 14px;border:1px solid rgba(255,255,255,.09);border-radius:13px;background:#0b1216}.structure-tier-head>b{font-size:13px;letter-spacing:.08em}.structure-tier-head>span{display:flex;gap:7px}.structure-level-dot{display:grid;place-items:center;width:25px;height:25px;border-radius:50%;font-style:normal;font-size:10px;font-weight:900;color:#64727a;border:1px solid #2d3940;background:#0a0f12}.structure-level-dot.active{color:#07100b}.structure-level-dot.level-1{background:#87949b}.structure-level-dot.level-2{background:#dce5ea}.structure-level-dot.level-3{background:#e8c958}.structure-level-dot.level-4{background:#63d78e}.structure-level-dot.level-5{background:#6dddec}.structure-stat-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:10px}.structure-stat-grid article{padding:15px;border-radius:13px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,#10181c,#0a1013)}.structure-stat-grid small{display:block;color:#7f9097;font-size:10px;font-weight:900;letter-spacing:.1em}.structure-stat-grid strong{display:block;font-size:23px;margin:5px 0}.structure-stat-grid em{font-style:normal;color:#77d99b;font-weight:900}.structure-live-stats{display:grid;gap:6px;padding:12px;border-radius:12px;background:#080d10;border:1px solid rgba(255,255,255,.06);color:#aab7bc;font-size:12px}.structure-next-cost{display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding:11px 13px;border-radius:11px;background:#13221b;border:1px solid rgba(104,221,149,.24)}.structure-next-cost span{color:#94a79e}.structure-next-cost b{color:#eaf8ee}.structure-menu-actions{margin-top:14px!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:9px!important}.structure-menu-actions button{min-height:44px!important}.structure-menu-actions .primary{grid-column:1/-1!important}\n.notification-bell{position:absolute;right:18px;top:72px;z-index:235;width:46px;height:46px;border-radius:15px;border:1px solid rgba(255,255,255,.12);background:rgba(10,16,19,.94);color:#edf5f2;font-size:20px;display:grid;place-items:center;box-shadow:0 12px 34px rgba(0,0,0,.32)}.notification-bell:hover{transform:translateY(-1px);border-color:#74d89a}.notification-bell span{position:absolute;right:-4px;top:-5px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#e65d67;color:white;font-size:10px;font-weight:950;display:grid;place-items:center}.notification-center{position:absolute;right:18px;top:126px;z-index:234;width:min(370px,calc(100vw - 28px));max-height:480px;display:none;overflow:hidden;border-radius:17px;border:1px solid rgba(255,255,255,.11);background:rgba(8,13,16,.98);box-shadow:0 26px 80px rgba(0,0,0,.58);backdrop-filter:blur(12px)}.notification-center.visible{display:block}.notification-center header{display:flex;align-items:center;justify-content:space-between;padding:14px 15px;border-bottom:1px solid rgba(255,255,255,.07)}.notification-center header small{display:block;color:#6ed996;font-size:9px;font-weight:900;letter-spacing:.14em}.notification-center header b{font-size:13px}.notification-center header button{border:0;background:transparent;color:#7e8d93;font-size:11px}.notification-list{max-height:410px;overflow:auto;padding:8px}.notification-item{display:grid;grid-template-columns:1fr auto;gap:8px;padding:11px 12px;border-radius:11px;border:1px solid transparent;color:#dce5e1}.notification-item.unread{background:#102019;border-color:rgba(98,221,147,.17)}.notification-item b{font-size:12px;line-height:1.35}.notification-item small{font-size:9px;color:#728087}.notification-empty{padding:25px 16px;text-align:center;color:#76858b;font-size:12px}\nbody.room-focus-mode #lobby .lobby-panel>div.tag,body.room-focus-mode #lobby .lobby-panel>h1,body.room-focus-mode #lobby .lobby-panel>p,body.room-focus-mode #lobbyAccountCard,body.room-focus-mode .lobby-wallet,body.room-focus-mode #lobbyMetaNav,body.room-focus-mode #lobbySideActions,body.room-focus-mode #lobby .help{display:none!important}body.room-focus-mode #lobby .lobby-panel{width:min(700px,94vw)!important;min-height:0!important;padding:30px!important;border-color:rgba(101,221,148,.18)!important;background:radial-gradient(circle at 50% 0,rgba(50,110,78,.15),transparent 42%),linear-gradient(180deg,rgba(15,23,27,.99),rgba(7,11,14,.99))!important}body.room-focus-mode #lobbySetup>.section-kicker,body.room-focus-mode #lobbySetup>.class-grid,body.room-focus-mode #lobbySetup>.lobby-mode-grid{display:none!important}body.room-focus-mode #joinCodePanel{display:block!important;margin:0!important;padding:24px!important;border:1px solid rgba(101,221,148,.15);border-radius:16px;background:#0b1215}body.room-focus-mode #joinCodePanel:before{content:"DREAD SHIFT · JOIN ROOM";display:block;margin-bottom:14px;color:#76dda0;font-size:11px;font-weight:950;letter-spacing:.13em}body.room-focus-mode #roomWaitPanel{position:relative;margin:0!important;padding:24px!important;border:1px solid rgba(101,221,148,.13);border-radius:17px;background:#0a1114}body.room-focus-mode #roomWaitPanel:before{content:"DREAD SHIFT · READY ROOM";display:block;margin-bottom:16px;color:#76dda0;font-size:11px;font-weight:950;letter-spacing:.13em}body.room-focus-mode #languageSwitch{opacity:.45}\n@media(max-width:760px){.run-tutorial-panel{top:78px!important;min-width:280px!important}.notification-bell{right:10px;top:66px}.notification-center{right:10px;top:118px}.structure-stat-grid{grid-template-columns:1fr}.structure-menu-actions{grid-template-columns:1fr!important}}\n`;
  write("public/style.css",s);return true;
}

const changed={server:patchServer(),client:patchClient(),html:patchHtml(),css:patchCss()};
console.log("DREAD SHIFT v8.2 patch applied:",JSON.stringify(changed));
