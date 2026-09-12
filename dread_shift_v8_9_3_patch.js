"use strict";
const fs=require("node:fs"),path=require("node:path");
const F=r=>path.join(__dirname,r),R=r=>fs.readFileSync(F(r),"utf8"),W=(r,s)=>fs.writeFileSync(F(r),s,"utf8");
function must(v,msg){if(!v)throw new Error("v8.9.3: "+msg)}
function replaceOnce(s,from,to,label){must(s.includes(from),"target missing: "+label);return s.replace(from,to)}

function patchServer(){
  let s=R("server.js");if(s.includes("/* DREAD SHIFT v8.9.3 server */"))return false;
  s=replaceOnce(s,'const BUILD_VERSION = "8.9.2";','const BUILD_VERSION = "8.9.3";',"server version");

  const metaStart='    if(["metaShopBuy","metaUpgradeBuy","metaQuestClaim","metaCrateOpen","metaCrateSkip","metaEquipPet","metaUnlockClass","metaSelectTitle","metaAchievementClaim"].includes(m.type)){\n      const profile=p?.profile||account.username;';
  const metaFixed='    if(["metaShopBuy","metaUpgradeBuy","metaQuestClaim","metaCrateOpen","metaCrateSkip","metaEquipPet","metaUnlockClass","metaSelectTitle","metaAchievementClaim"].includes(m.type)){\n      if(room?.started){send(ws,"notice",{text:"Эта функция доступна только в лобби между забегами"});if(p)sendMeta(ws,p);return;}\n      const profile=p?.profile||account.username;';
  s=replaceOnce(s,metaStart,metaFixed,"lobby-only meta economy guard");

  const wssMarker='const wss=new WebSocketServer({server,maxPayload:WS_MAX_PAYLOAD,perMessageDeflate:false});';
  const authGuard=`const AUTH_ATTEMPT_WINDOW_MS=30000;\nconst AUTH_ATTEMPT_LIMIT=12;\nconst authAttemptBuckets=new Map();\nfunction allowAuthAttempt(req){\n  const forwarded=String(req?.headers?.["x-forwarded-for"]||"").split(",")[0].trim();\n  const key=forwarded||String(req?.socket?.remoteAddress||"unknown");\n  const now=Date.now();let b=authAttemptBuckets.get(key);\n  if(!b||now-b.startedAt>=AUTH_ATTEMPT_WINDOW_MS)b={startedAt:now,count:0};\n  b.count++;authAttemptBuckets.set(key,b);\n  if(authAttemptBuckets.size>2048){for(const [k,v] of authAttemptBuckets)if(now-v.startedAt>=AUTH_ATTEMPT_WINDOW_MS)authAttemptBuckets.delete(k);}\n  return b.count<=AUTH_ATTEMPT_LIMIT;\n}\n`;
  s=replaceOnce(s,wssMarker,authGuard+wssMarker,"auth throttle helper");
  s=replaceOnce(s,'wss.on("connection",ws=>{','wss.on("connection",(ws,req)=>{',"connection request context");
  s=replaceOnce(s,'    if(m.type==="register"){\n      if(account)return send(ws,"authError",{message:"Вы уже вошли"});','    if(m.type==="register"){\n      if(!allowAuthAttempt(req))return send(ws,"authError",{message:"Слишком много попыток. Подождите около 30 секунд."});\n      if(account)return send(ws,"authError",{message:"Вы уже вошли"});',"register rate limit");
  s=replaceOnce(s,'    if(m.type==="login"){\n      if(account)return send(ws,"authError",{message:"Вы уже вошли"});','    if(m.type==="login"){\n      if(!allowAuthAttempt(req))return send(ws,"authError",{message:"Слишком много попыток входа. Подождите около 30 секунд."});\n      if(account)return send(ws,"authError",{message:"Вы уже вошли"});',"login rate limit");

  const staticStart='  if(url==="/")url="/index.html";';
  const staticEnd='  fs.readFile(file,(err,data)=>{';
  const a=s.indexOf(staticStart),b=a>=0?s.indexOf(staticEnd,a):-1;must(a>=0&&b>a,"static file handler bounds missing");
  const hardStatic=`  if(url==="/")url="/index.html";\n  try{url=decodeURIComponent(url)}catch{res.writeHead(400,{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});return res.end("Bad request");}\n  const publicRoot=path.resolve(PUBLIC),file=path.resolve(publicRoot,"."+url);\n  if(file!==publicRoot&&!file.startsWith(publicRoot+path.sep)){res.writeHead(403,{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});return res.end("Forbidden");}\n`;
  s=s.slice(0,a)+hardStatic+s.slice(b);
  s=replaceOnce(s,'    res.writeHead(200,{"Content-Type":types[ext]||"application/octet-stream"});','    const immutable=/^\\/assets\\/game\\.[a-f0-9]{12}\\.min\\.js$/i.test(url);\n    const cacheControl=immutable?"public, max-age=31536000, immutable":ext===".html"?"no-cache":"public, max-age=3600";\n    res.writeHead(200,{"Content-Type":types[ext]||"application/octet-stream","Cache-Control":cacheControl,"X-Content-Type-Options":"nosniff","Referrer-Policy":"same-origin"});',"static response headers");

  s=replaceOnce(s,'    players:[...room.players.values()].map(safePlayer),','    players:[...room.players.values()].map(pl=>{const o=safePlayer(pl);if(pl.id!==p.id){delete o.silver;delete o.gold;delete o.crateTokens;delete o.petsOwned;delete o.discoveredEnemies;delete o.bestWave;delete o.runStats;delete o.skills;delete o.skillPoints;}return o;}),',"viewer-safe player snapshots");

  const stopOld='function stopRuntime(){\n  if(simTimer){clearInterval(simTimer);simTimer=null;}\n  if(snapshotTimer){clearInterval(snapshotTimer);snapshotTimer=null;}\n  if(server.listening)server.close();\n}';
  const stopNew='function stopRuntime(){\n  // Flush every active player before timers/socket shutdown so deploys do not lose the latest run progress.\n  for(const room of rooms.values())for(const p of room.players.values())saveProgress(p);\n  saveAccounts();\n  if(simTimer){clearInterval(simTimer);simTimer=null;}\n  if(snapshotTimer){clearInterval(snapshotTimer);snapshotTimer=null;}\n  if(server.listening)server.close();\n}';
  s=replaceOnce(s,stopOld,stopNew,"graceful player save flush");
  s+='\n/* DREAD SHIFT v8.9.3 server */\n';
  W("server.js",s);return true;
}

function patchClient(){
  let s=R("public/client.js");if(s.includes("/* DREAD SHIFT v8.9.3 client */"))return false;
  const start=s.indexOf("function connect(){");const message=s.indexOf('  ws.onmessage=e=>{',start);must(start>=0&&message>start,"connect block missing");
  const prefix=`let reconnectTimer=null,reconnectAttempt=0,connectionGeneration=0;\nfunction scheduleReconnect(){\n  clearTimeout(reconnectTimer);\n  const delay=Math.min(8000,700*Math.pow(1.7,reconnectAttempt++));\n  reconnectTimer=setTimeout(()=>{if(!connected)connect()},delay);\n}\nfunction connect(){\n  const generation=++connectionGeneration;\n  const proto=location.protocol==="https:"?"wss":"ws";\n  const socket=new WebSocket(\`${'${proto}'}://${'${location.host}'}\`);ws=socket;\n  socket.onopen=()=>{if(generation!==connectionGeneration)return;connected=true;reconnectAttempt=0;clearTimeout(reconnectTimer);status.textContent=T("Сервер подключён.","Server connected.");$("connectionBadge").textContent=T("● онлайн","● online");$("connectionBadge").className="connection-badge online";const a=$("authStatus"),token=storageGet(sessionKey);if(a)a.textContent=token?T("Восстанавливаем вход…","Restoring session…"):T("Сервер подключён. Войдите или зарегистрируйтесь.","Server connected. Sign in or register.");if(token)send("resumeSession",{token});send("clientPing",{sentAt:Date.now()});};\n  socket.onclose=()=>{if(generation!==connectionGeneration)return;connected=false;if(joined||state)resetClientToLobby();status.textContent=T("Соединение потеряно. Переподключаемся…","Connection lost. Reconnecting…");$("connectionBadge").textContent=T("● переподключение","● reconnecting");$("connectionBadge").className="connection-badge offline";if($("authStatus"))$("authStatus").textContent=T("Связь потеряна. Переподключаемся автоматически…","Connection lost. Reconnecting automatically…");scheduleReconnect();};\n  socket.onerror=()=>{};\n  socket.onmessage=e=>{`;
  s=s.slice(0,start)+prefix+s.slice(message+'  ws.onmessage=e=>{'.length);
  s=replaceOnce(s,'    const m=JSON.parse(e.data);','    let m;try{m=JSON.parse(e.data)}catch{return;}',"safe websocket JSON parsing");
  s=replaceOnce(s,'    if(m.type==="sessionInvalid"){storageRemove(sessionKey);if($("authStatus"))$("authStatus").textContent="Сессия истекла. Войдите снова.";return;}','    if(m.type==="sessionInvalid"){storageRemove(sessionKey);accountState=null;metaState=null;$("authOverlay")?.classList.add("visible");if($("authStatus"))$("authStatus").textContent=T("Сессия истекла. Войдите снова.","Session expired. Sign in again.");syncAccountUi();return;}',"expired session UI recovery");
  s+='\n/* DREAD SHIFT v8.9.3 client */\n';
  try{new Function(s)}catch(err){throw new Error("v8.9.3 client syntax: "+err.message)}
  W("public/client.js",s);return true;
}

function patchHtml(){let s=R("public/index.html");if(s.includes("<!-- DREAD SHIFT v8.9.3 -->"))return false;s=s.replaceAll("V8.9.2","V8.9.3").replaceAll("v8.9.2","v8.9.3");s+='\n<!-- DREAD SHIFT v8.9.3 -->\n';W("public/index.html",s);return true;}
function patchCss(){let s=R("public/style.css");if(s.includes("/* DREAD SHIFT v8.9.3 audit */"))return false;s+='\n/* DREAD SHIFT v8.9.3 audit */\n';W("public/style.css",s);return true;}

function patchDbBridge(){
  let s=R("db_bridge.js").replace(/\r\n/g,"\n");if(s.includes("/* DREAD SHIFT v8.9.3 db */"))return false;
  s=replaceOnce(s,'  let syncingAll = false;','  let syncPromise = null;',"db sync state");
  const oldSync=`  async function syncAll() {\n    if (syncingAll) return;\n    syncingAll = true;\n    try {\n      for (const name of listSaveFiles()) await persistFile(name);\n    } finally {\n      syncingAll = false;\n    }\n  }`;
  const newSync=`  function syncAll() {\n    if (syncPromise) return syncPromise;\n    syncPromise = (async () => {\n      try {\n        for (const name of listSaveFiles()) await persistFile(name);\n      } finally {\n        syncPromise = null;\n      }\n    })();\n    return syncPromise;\n  }`;
  s=replaceOnce(s,oldSync,newSync,"awaitable db sync");
  s=replaceOnce(s,'    try { await syncAll(); } catch (err) { console.error("[DB] final sync failed:", err.message); }\n    try { game.stopRuntime(); } catch {}','    // Stop simulation first: stopRuntime flushes active in-memory players to JSON. Then persist that exact state to Postgres.\n    try { game.stopRuntime(); } catch {}\n    try { await syncAll(); } catch (err) { console.error("[DB] final sync failed:", err.message); }',"shutdown ordering");
  const fileModeOld=`async function startWithFileSaves() {\n  console.warn("[DB] DATABASE_URL is not set. Using local JSON saves only.");\n  const game = require("./server");\n  game.startRuntime();\n}`;
  const fileModeNew=`async function startWithFileSaves() {\n  console.warn("[DB] DATABASE_URL is not set. Using local JSON saves only.");\n  const game = require("./server");\n  game.startRuntime();\n  let closing=false;\n  const close=signal=>{if(closing)return;closing=true;console.log(\`[DB] ${'${signal}'}: flushing local player saves...\`);try{game.stopRuntime()}catch{};process.exit(0)};\n  process.once("SIGTERM",()=>close("SIGTERM"));\n  process.once("SIGINT",()=>close("SIGINT"));\n}`;
  s=replaceOnce(s,fileModeOld,fileModeNew,"local save graceful shutdown");
  s+='\n/* DREAD SHIFT v8.9.3 db */\n';W("db_bridge.js",s);return true;
}

const changed={server:patchServer(),client:patchClient(),html:patchHtml(),css:patchCss(),db:patchDbBridge()};
const server=R("server.js"),client=R("public/client.js"),db=R("db_bridge.js");
must(server.includes('const BUILD_VERSION = "8.9.3";'),"server version not applied");
must(server.includes("Эта функция доступна только в лобби между забегами"),"meta guard missing");
must(client.includes("scheduleReconnect"),"reconnect recovery missing");
must(db.includes("syncPromise"),"db sync fix missing");
console.log("DREAD SHIFT v8.9.3 audit patch applied:",changed);
