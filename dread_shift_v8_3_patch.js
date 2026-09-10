"use strict";

const fs = require("fs");
const path = require("path");
const file = rel => path.join(__dirname, rel);
const read = rel => fs.readFileSync(file(rel), "utf8");
const write = (rel, source) => fs.writeFileSync(file(rel), source, "utf8");

function replaceRequired(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`v8.3 target missing: ${label}`);
  return source.replace(from, to);
}
function replaceOptional(source, from, to) {
  return source.includes(from) ? source.replace(from, to) : source;
}
function assertHas(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`v8.3 verification failed: ${label}`);
}

function patchServer() {
  let s = read("server.js");
  if (s.includes("/* DREAD SHIFT v8.3 server */")) return false;

  s = replaceRequired(s, 'const BUILD_VERSION = "8.2.0";', 'const BUILD_VERSION = "8.3.0";', "build version");

  // Spikes are floor traps, not walls: zombies already do not collide with them.
  // Count a hit only when a zombie ENTERS the trap, so standing on it is not 30 contacts/second.
  const spikeHelpersMarker = 'function structureCooldownMultiplier(st){return STRUCTURE_LEVEL_COOLDOWN[Math.max(1,Math.min(5,st?.level||1))]||1;}';
  const spikeHelpers = spikeHelpersMarker + '\n' +
    'const SPIKE_CONTACT_LIMIT_BY_LEVEL=[0,25,40,60];\n' +
    'const spikeContactState=new Map();\n' +
    'function spikeContactLimit(st){return SPIKE_CONTACT_LIMIT_BY_LEVEL[Math.max(1,Math.min(3,Number(st?.level)||1))]||25;}';
  s = replaceRequired(s, spikeHelpersMarker, spikeHelpers, "spike contact helpers");

  const oldSpikeLogic = [
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
  ].join('\n');
  const newSpikeLogic = [
    '    if(s.type==="spikes"){',
    '      const previous=spikeContactState.get(s.id)||new Set();',
    '      const inside=new Set();',
    '      const contactLimit=spikeContactLimit(s);',
    '      for(const z of room.zombies){',
    '        if(z.hp<=0||dist(s,z)>=s.r+z.r+9)continue;',
    '        inside.add(z.id);',
    '        if(previous.has(z.id))continue;',
    '        const dealt=damageZombie(z,18*(s.power||1)*defensePetMult*comboDamageMultiplier(comboOwner),"melee");',
    '        creditStructureHit(room,s,z,dealt);',
    '        // One fresh touch consumes 1/contactLimit of the trap durability.',
    '        s.hp=Math.max(0,s.hp-(s.maxHp/Math.max(1,contactLimit)));',
    '        if(s.hp<=0)break;',
    '      }',
    '      if(s.hp>0&&inside.size)spikeContactState.set(s.id,inside);else spikeContactState.delete(s.id);',
    '      if(spikeContactState.size>512)spikeContactState.clear();',
    '    }'
  ].join('\n');
  s = replaceRequired(s, oldSpikeLogic, newSpikeLogic, "spike touch gameplay");

  // Spawn bullets in front of the hands/weapon body. Client muzzle flash is corrected separately.
  s = replaceRequired(
    s,
    '      x:p.x+Math.cos(a)*29,y:p.y+Math.sin(a)*29,vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed,',
    '      x:p.x+Math.cos(a)*(({pistol:50,micro_uzi:54,ump:60,bubble_blaster:56}[p.weapon.type])||29),y:p.y+Math.sin(a)*(({pistol:50,micro_uzi:54,ump:60,bubble_blaster:56}[p.weapon.type])||29),vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed,',
    "server bullet muzzle"
  );

  // Same-origin HTTPS auth endpoint. This keeps account creation usable even when WSS is flaky.
  const httpMarker = 'const server=http.createServer((req,res)=>{\n  let url=req.url.split("?")[0];';
  const httpReplacement = [
    'const server=http.createServer((req,res)=>{',
    '  const requestPath=req.url.split("?")[0];',
    '  if(req.method==="POST"&&(requestPath==="/api/auth/register"||requestPath==="/api/auth/login")){',
    '    let bodyText="";',
    '    req.setEncoding("utf8");',
    '    req.on("data",chunk=>{if(bodyText.length<=8192)bodyText+=chunk;});',
    '    req.on("end",()=>{',
    '      const json=(status,payload)=>{res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});res.end(JSON.stringify(payload));};',
    '      if(bodyText.length>8192)return json(413,{ok:false,message:"Слишком большой запрос"});',
    '      let body;try{body=JSON.parse(bodyText||"{}");}catch{return json(400,{ok:false,message:"Некорректный запрос"});}',
    '      try{',
    '        if(requestPath==="/api/auth/register"){',
    '          let result=registerAccount(body.username,body.password,body.displayName);',
    '          let recovered=false;',
    '          if(result.error){',
    '            // If the first response was lost after account creation, retrying with the same password should recover instead of trapping the user.',
    '            if(result.error==="Такой логин уже занят"){const existing=authenticateAccount(body.username,body.password);if(existing){result={account:existing,starterGift:false};recovered=true;}}',
    '            if(result.error)return json(400,{ok:false,message:result.error});',
    '          }',
    '          const account=result.account,session=issueAccountSession(account),target=loadMetaTarget(account.username,account);',
    '          return json(200,{ok:true,account:publicAccountSnapshot(account,target),session,starterGift:!!result.starterGift,recovered});',
    '        }',
    '        const account=authenticateAccount(body.username,body.password);',
    '        if(!account)return json(401,{ok:false,message:"Неверный логин или пароль"});',
    '        const session=issueAccountSession(account),target=loadMetaTarget(account.username,account);',
    '        return json(200,{ok:true,account:publicAccountSnapshot(account,target),session});',
    '      }catch(err){console.error("[AUTH HTTP]",err?.stack||err);return json(500,{ok:false,message:"Ошибка сервера авторизации. Попробуйте ещё раз."});}',
    '    });',
    '    return;',
    '  }',
    '  let url=requestPath;'
  ].join('\n');
  s = replaceRequired(s, httpMarker, httpReplacement, "HTTP auth endpoint");

  s = replaceRequired(
    s,
    'wss.on("connection",ws=>{\n  let room=null,p=null,account=null,sessionHash=null;',
    'wss.on("connection",ws=>{\n  ws.on("error",err=>console.warn("[WS] client connection error:",err?.message||err));\n  let room=null,p=null,account=null,sessionHash=null;',
    "WebSocket client error guard"
  );

  assertHas(s, 'requestPath==="/api/auth/register"', "register HTTP route");
  assertHas(s, 'SPIKE_CONTACT_LIMIT_BY_LEVEL=[0,25,40,60]', "spike contact durability");
  assertHas(s, '(({pistol:50,micro_uzi:54,ump:60,bubble_blaster:56}', "muzzle spawn offsets");
  s += '\n/* DREAD SHIFT v8.3 server */\n';
  write("server.js", s);
  return true;
}

function patchClient() {
  let s = read("public/client.js");
  if (s.includes("/* DREAD SHIFT v8.3 client */")) return false;

  // Flash was width*.88 from the player center, while the sprite begins at x=18.
  // That placed the flash around the trigger/body on the pistol.
  s = replaceRequired(s, '    const muzzleDist=width*.88;', '    const muzzleDist=18+width*.94;', "client pistol muzzle flash");

  const oldSpikeStats = [
    '  if(st.type==="spikes"){',
    '    const damage=15*power*axolotlMult;',
    '    return [T(`Урон за срабатывание: ${damage.toFixed(1)}`,`Damage per trigger: ${damage.toFixed(1)}`),T(`Срабатывание: раз в 0.4 сек`,`Trigger: every 0.4 sec`),T(`Эффект: замедление`,`Effect: slow`)];',
    '  }'
  ].join('\n');
  const newSpikeStats = [
    '  if(st.type==="spikes"){',
    '    const damage=18*power*axolotlMult,limit=[0,25,40,60][Math.max(1,Math.min(3,st.level||1))]||25;',
    '    const remaining=Math.max(0,Math.ceil(limit*((st.hp||0)/Math.max(1,st.maxHp||1))));',
    '    return [T(`Урон при входе: ${damage.toFixed(1)}`,`Entry damage: ${damage.toFixed(1)}`),T(`Контактов до поломки: ~${remaining} / ${limit}`,`Contacts before breaking: ~${remaining} / ${limit}`),T(`Зомби проходят сквозь шипы. Повторный вход считается новым контактом.`,`Zombies walk through the spikes. Re-entering counts as a new contact.`)];',
    '  }'
  ].join('\n');
  s = replaceRequired(s, oldSpikeStats, newSpikeStats, "spike UI description");
  s = replaceOptional(s, 'spikes:"Damage and slow enemies."', 'spikes:"Zombies can cross freely. Each new contact deals damage and wears the trap down."');

  // Keep generator buttons away from the bottom hotbar and inside the viewport.
  const oldCoreActions = [
    'function updateCoreActions(){',
    '  const el=$("coreActions"),p=myPlayer();if(!el)return;',
    '  const near=!!(state?.started&&p&&state?.core&&Math.hypot(p.x-state.core.x,p.y-state.core.y)<RUN_SHOP_RADIUS);',
    '  el.classList.toggle("hidden",!near);if(!near)return;',
    '  const pos=sc(state.core.x,state.core.y);el.style.left=`${pos.x}px`;el.style.top=`${pos.y+132}px`;',
    '  el.dataset.coreLevel=String(state.core.level||1);',
    '}'
  ].join('\n');
  const newCoreActions = [
    'function updateCoreActions(){',
    '  const el=$("coreActions"),p=myPlayer();if(!el)return;',
    '  const near=!!(state?.started&&p&&state?.core&&Math.hypot(p.x-state.core.x,p.y-state.core.y)<RUN_SHOP_RADIUS);',
    '  el.classList.toggle("hidden",!near);if(!near)return;',
    '  const pos=sc(state.core.x,state.core.y);',
    '  const safeX=Math.max(118,Math.min(innerWidth-118,pos.x));',
    '  const safeY=Math.max(105,Math.min(innerHeight-158,pos.y+132));',
    '  el.style.left=`${safeX}px`;el.style.top=`${safeY}px`;',
    '  el.dataset.coreLevel=String(state.core.level||1);',
    '}'
  ].join('\n');
  s = replaceRequired(s, oldCoreActions, newCoreActions, "generator button viewport clamp");

  // Automatic WebSocket reconnect instead of permanently telling the user to refresh.
  const connectMarker = 'function connect(){\n  const proto=location.protocol==="https:"?"wss":"ws";';
  const connectReplacement = [
    'let reconnectTimer=null,reconnectAttempt=0;',
    'function scheduleReconnect(){',
    '  clearTimeout(reconnectTimer);',
    '  const delay=Math.min(5000,600*Math.pow(2,Math.min(3,reconnectAttempt++)));',
    '  reconnectTimer=setTimeout(()=>connect(),delay);',
    '}',
    'function connect(){',
    '  if(ws&&(ws.readyState===WebSocket.OPEN||ws.readyState===WebSocket.CONNECTING))return;',
    '  const proto=location.protocol==="https:"?"wss":"ws";'
  ].join('\n');
  s = replaceRequired(s, connectMarker, connectReplacement, "reconnect bootstrap");
  s = replaceRequired(s, '  ws.onopen=()=>{connected=true;', '  ws.onopen=()=>{reconnectAttempt=0;clearTimeout(reconnectTimer);connected=true;', "reconnect reset");

  const oldClose = '  ws.onclose=()=>{connected=false;lobby.classList.add("visible");status.textContent=T("Соединение потеряно. Обновите страницу.","Connection lost. Refresh the page.");$("connectionBadge").textContent=T("● офлайн","● offline");$("connectionBadge").className="connection-badge offline";if($("authStatus"))$("authStatus").textContent="Сервер недоступен. Попробуйте обновить страницу.";};';
  const newClose = '  ws.onclose=()=>{connected=false;lobby.classList.add("visible");status.textContent=T("Соединение потеряно. Переподключаемся…","Connection lost. Reconnecting…");$("connectionBadge").textContent=T("● переподключение","● reconnecting");$("connectionBadge").className="connection-badge offline";if($("authStatus"))$("authStatus").textContent=T("Игровое соединение потеряно. Переподключаемся автоматически…","Game connection lost. Reconnecting automatically…");scheduleReconnect();};';
  s = replaceRequired(s, oldClose, newClose, "WebSocket reconnect on close");

  const oldSendAuth = 'function sendAuth(type,data={}){if(!connected){$("authStatus").textContent="Сервер ещё не подключён";return;}send(type,data);}';
  const newSendAuth = [
    'let authHttpBusy=false;',
    'async function performHttpAuth(type,data={}){',
    '  const statusEl=$("authStatus");',
    '  if(authHttpBusy){if(statusEl)statusEl.textContent=T("Запрос уже выполняется…","Request already in progress…");return;}',
    '  authHttpBusy=true;',
    '  try{',
    '    if(statusEl)statusEl.textContent=type==="register"?T("Создаём аккаунт…","Creating account…"):T("Входим…","Signing in…");',
    '    const response=await fetch(`/api/auth/${type}`,{method:"POST",headers:{"Content-Type":"application/json"},cache:"no-store",body:JSON.stringify(data)});',
    '    let payload={};try{payload=await response.json();}catch{}',
    '    if(!response.ok||!payload.ok){const message=payload.message||T("Не удалось выполнить запрос","Request failed");if(statusEl)statusEl.textContent=message;toast(message);return;}',
    '    const token=payload.session?.token;',
    '    if(token)storageSet(sessionKey,token);',
    '    if(payload.starterGift)toast(T("🎁 Стартовый подарок: +200 серебра и +1 жетон ящика","🎁 Starter gift: +200 silver and +1 crate token"));',
    '    if(statusEl)statusEl.textContent=type==="register"?T("Аккаунт создан. Подключаем игру…","Account created. Connecting game…"):T("Вход выполнен. Подключаем игру…","Signed in. Connecting game…");',
    '    if(ws&&ws.readyState===WebSocket.OPEN&&token)send("resumeSession",{token});else connect();',
    '  }catch(err){',
    '    // Old WebSocket auth remains as a fallback if the HTTPS request itself is blocked.',
    '    if(connected){send(type,data);if(statusEl)statusEl.textContent=T("Проверяем через игровой канал…","Trying the game channel…");}',
    '    else{if(statusEl)statusEl.textContent=T("Не удалось связаться с сервером. Переподключаемся…","Could not reach the server. Reconnecting…");connect();}',
    '  }finally{authHttpBusy=false;}',
    '}',
    'function sendAuth(type,data={}){performHttpAuth(type,data);}'
  ].join('\n');
  s = replaceRequired(s, oldSendAuth, newSendAuth, "HTTP-first account auth");

  assertHas(s, 'fetch(`/api/auth/${type}`', "HTTP auth client");
  assertHas(s, 'scheduleReconnect()', "client reconnect");
  assertHas(s, 'const muzzleDist=18+width*.94;', "muzzle flash position");
  assertHas(s, 'Contacts before breaking', "spike durability UI");
  s += '\n/* DREAD SHIFT v8.3 client */\n';
  write("public/client.js", s);
  return true;
}

function patchHtml() {
  let s = read("public/index.html");
  s = s.replaceAll("V8.2", "V8.3").replaceAll("v8.2.0", "v8.3.0");
  write("public/index.html", s);
  return true;
}

function patchCss() {
  let s = read("public/style.css");
  if (s.includes("/* DREAD SHIFT v8.3 UI */")) return false;
  s += [
    '',
    '/* DREAD SHIFT v8.3 UI */',
    '/* Leave the language switch its own corner; notifications sit underneath it. */',
    '.notification-bell{top:132px!important;right:18px!important}',
    '.notification-center{top:188px!important;right:18px!important}',
    '@media(max-width:760px){.notification-bell{top:118px!important;right:10px!important}.notification-center{top:172px!important;right:10px!important}}',
    ''
  ].join('\n');
  write("public/style.css", s);
  return true;
}

const changed = {server:patchServer(), client:patchClient(), html:patchHtml(), css:patchCss()};
console.log("DREAD SHIFT v8.3 patch applied:", JSON.stringify(changed));
