"use strict";
const fs=require("node:fs"),path=require("node:path");
const F=r=>path.join(__dirname,r),R=r=>fs.readFileSync(F(r),"utf8"),W=(r,s)=>fs.writeFileSync(F(r),s,"utf8");
function must(v,msg){if(!v)throw new Error("v8.9.4: "+msg)}
function rep(s,a,b,label){must(s.includes(a),"target missing: "+label);return s.replace(a,b)}

function patchServer(){
  let s=R("server.js");if(s.includes("/* DREAD SHIFT v8.9.4 server */"))return false;
  s=rep(s,'const BUILD_VERSION = "8.9.3";','const BUILD_VERSION = "8.9.4";',"server version");

  s=rep(s,'function pickupLoot(room,p){\n  let target=null,best=76;','function pickupLoot(room,p){\n  if(!p||p.downed)return false;\n  let target=null,best=76;',"downed loot guard");
  s=rep(s,'function buy(room,p,item){\n  item=String(item||"");','function buy(room,p,item){\n  if(!p||p.downed){if(p)send(p.ws,"notice",{text:"Недоступно, пока персонаж повален"});return false;}\n  item=String(item||"");',"downed shop guard");
  s=rep(s,'function upgradeRunEquipment(room,p,kind){\n  kind=kind==="multitool"?"multitool":"weapon";','function upgradeRunEquipment(room,p,kind){\n  if(!p||p.downed){if(p)send(p.ws,"notice",{text:"Недоступно, пока персонаж повален"});return false;}\n  kind=kind==="multitool"?"multitool":"weapon";',"downed equipment guard");
  s=rep(s,'function repairCore(room,p){\n  if(dist(p,room.core)>300)return send(p.ws,"notice",{text:"Подойдите к генератору"});','function repairCore(room,p){\n  if(!p||p.downed)return send(p?.ws,"notice",{text:"Недоступно, пока персонаж повален"});\n  if(dist(p,room.core)>300)return send(p.ws,"notice",{text:"Подойдите к генератору"});',"downed core repair guard");
  s=rep(s,'function upgradeCore(room,p){\n  if(dist(p,room.core)>300)return send(p.ws,"notice",{text:"Подойдите к генератору"});','function upgradeCore(room,p){\n  if(!p||p.downed)return send(p?.ws,"notice",{text:"Недоступно, пока персонаж повален"});\n  if(dist(p,room.core)>300)return send(p.ws,"notice",{text:"Подойдите к генератору"});',"downed core upgrade guard");

  const skipOld='function skipMetaCrateCooldown(target){\n  ensureMeta(target);\n  const key=target.profile||"player";\n  crateLocks.delete(key); // Skip means the reveal is finished: allow the next server-authoritative roll immediately.\n  return true;\n}';
  const skipNew='function skipMetaCrateCooldown(target){\n  ensureMeta(target);\n  // Animation skip never bypasses the authoritative opening cooldown.\n  return true;\n}';
  s=rep(s,skipOld,skipNew,"crate cooldown bypass");

  s=rep(s,'if(["input","reload","harvest","repairStructure","pickup","build","buy","skill","coreUpgrade","coreRepair","structureUpgrade","structureRepair","structureRemove","useMedkit"].includes(m.type))return;','if(["input","reload","harvest","repairStructure","pickup","build","buy","runEquipmentUpgrade","skill","coreUpgrade","coreRepair","structureUpgrade","structureRepair","structureRemove","useMedkit"].includes(m.type))return;',"pre-start equipment upgrade guard");

  const wssMarker='const wss=new WebSocketServer({server,maxPayload:WS_MAX_PAYLOAD,perMessageDeflate:false});';
  const reconnectHelpers=`const RECONNECT_GRACE_MS=15000;\nfunction reconnectSlotFor(profile){\n  const now=Date.now();\n  for(const r of rooms.values())for(const pl of r.players.values())if(pl.profile===profile&&Number(pl.reconnectUntil||0)>now)return {room:r,player:pl};\n  return null;\n}\n`;
  s=rep(s,wssMarker,reconnectHelpers+wssMarker,"reconnect helper");

  const resumeOld=`    if(m.type==="resumeSession"){\n      if(account)return;\n      const found=authenticateAccountSession(m.token);\n      if(!found)return send(ws,"sessionInvalid");\n      account=found.account;sessionHash=found.hash;const target=loadMetaTarget(account.username,account);\n      send(ws,"authSuccess",{account:publicAccountSnapshot(account,target),resumed:true});sendMeta(ws,target);return;\n    }`;
  const resumeNew=`    if(m.type==="resumeSession"){\n      if(account)return;\n      const found=authenticateAccountSession(m.token);\n      if(!found)return send(ws,"sessionInvalid");\n      account=found.account;sessionHash=found.hash;\n      const reconnect=reconnectSlotFor(account.username);\n      if(reconnect){\n        room=reconnect.room;p=reconnect.player;\n        if(p.reconnectTimer){clearTimeout(p.reconnectTimer);p.reconnectTimer=null;}\n        p.reconnectUntil=0;p.ws=ws;\n        if(room.mode==="solo"&&p.reconnectPausedSolo){room.paused=false;p.reconnectPausedSolo=false;}\n        send(ws,"authSuccess",{account:publicAccountSnapshot(account,p),resumed:true,reconnected:true});\n        send(ws,"reconnected",{playerId:p.id,slot:p.slot,code:room.code,isHost:p.id===room.hostId,mode:room.mode,started:!!room.started});\n        sendMeta(ws,p);sendTutorialState(p);\n        broadcast(room,"roster",{hostId:room.hostId,mode:room.mode,players:[...room.players.values()].map(safePlayer)});\n        return;\n      }\n      const target=loadMetaTarget(account.username,account);\n      send(ws,"authSuccess",{account:publicAccountSnapshot(account,target),resumed:true,reconnected:false});sendMeta(ws,target);return;\n    }`;
  s=rep(s,resumeOld,resumeNew,"session reconnect rebind");

  const closeOld=`  ws.on("close",()=>{\n    if(room&&p)detachPlayerFromRoom(room,p);\n  });`;
  const closeNew=`  ws.on("close",()=>{\n    if(!room||!p)return;\n    const oldRoom=room,oldPlayer=p,oldWs=ws;\n    oldPlayer.input={up:false,down:false,left:false,right:false,sprint:false,shoot:false,ax:0,ay:0};\n    oldPlayer.reconnectUntil=Date.now()+RECONNECT_GRACE_MS;\n    if(oldRoom.mode==="solo"&&oldRoom.started&&!oldRoom.paused){oldRoom.paused=true;oldPlayer.reconnectPausedSolo=true;}\n    if(oldPlayer.reconnectTimer)clearTimeout(oldPlayer.reconnectTimer);\n    oldPlayer.reconnectTimer=setTimeout(()=>{\n      oldPlayer.reconnectTimer=null;\n      if(oldPlayer.ws===oldWs&&Date.now()>=Number(oldPlayer.reconnectUntil||0)){oldPlayer.reconnectUntil=0;detachPlayerFromRoom(oldRoom,oldPlayer);}\n    },RECONNECT_GRACE_MS+250);\n  });`;
  s=rep(s,closeOld,closeNew,"reconnect grace on socket close");

  s+='\n/* DREAD SHIFT v8.9.4 server */\n';W("server.js",s);return true;
}

function patchClient(){
  let s=R("public/client.js");if(s.includes("/* DREAD SHIFT v8.9.4 client */"))return false;
  s=rep(s,'socket.onclose=()=>{if(generation!==connectionGeneration)return;connected=false;if(joined||state)resetClientToLobby();status.textContent=T("Соединение потеряно. Переподключаемся…","Connection lost. Reconnecting…");','socket.onclose=()=>{if(generation!==connectionGeneration)return;connected=false;stopGameInput();status.textContent=T("Соединение потеряно. Переподключаемся…","Connection lost. Reconnecting…");',"keep run state during reconnect");
  s=rep(s,'      accountState=m.account||accountState;$("authOverlay")?.classList.remove("visible");syncAccountUi();send("getMeta");','      if(m.resumed&&!m.reconnected&&(joined||state))resetClientToLobby();\n      accountState=m.account||accountState;$("authOverlay")?.classList.remove("visible");syncAccountUi();send("getMeta");',"reset stale state after server restart");
  const joined='    if(m.type==="joined")enterRoomWaiting(m);';
  const reconnected=`    if(m.type==="reconnected"){\n      joined=true;myId=m.playerId;isHost=!!m.isHost;roomMode=m.mode||roomMode;\n      if(m.started){lobby.classList.remove("visible");$("indexBookBtn")?.classList.remove("visible");status.textContent=T("Связь восстановлена. Возвращаемся в забег…","Connection restored. Returning to the run…");}\n      else enterRoomWaiting(m);\n      toast(T("Соединение восстановлено","Connection restored"));\n      return;\n    }`;
  s=rep(s,joined,joined+'\n'+reconnected,"reconnected client event");
  s+='\n/* DREAD SHIFT v8.9.4 client */\n';
  try{new Function(s)}catch(err){throw new Error("v8.9.4 client syntax: "+err.message)}W("public/client.js",s);return true;
}
function patchHtml(){let s=R("public/index.html");if(s.includes("<!-- DREAD SHIFT v8.9.4 -->"))return false;s=s.replaceAll("V8.9.3","V8.9.4").replaceAll("v8.9.3","v8.9.4");s+='\n<!-- DREAD SHIFT v8.9.4 -->\n';W("public/index.html",s);return true;}
function patchCss(){let s=R("public/style.css");if(s.includes("/* DREAD SHIFT v8.9.4 reconnect */"))return false;s+='\n/* DREAD SHIFT v8.9.4 reconnect */\n';W("public/style.css",s);return true;}
const changed={server:patchServer(),client:patchClient(),html:patchHtml(),css:patchCss()};
const sv=R("server.js"),cl=R("public/client.js");
must(sv.includes('const BUILD_VERSION = "8.9.4";'),"version missing");
must(sv.includes("RECONNECT_GRACE_MS=15000"),"server reconnect grace missing");
must(sv.includes("Animation skip never bypasses"),"crate cooldown fix missing");
must(cl.includes('m.type==="reconnected"'),"client reconnect event missing");
console.log("DREAD SHIFT v8.9.4 reconnect/gameplay patch applied:",changed);
