"use strict";
const fs=require("node:fs"),path=require("node:path");
const F=r=>path.join(__dirname,r),R=r=>fs.readFileSync(F(r),"utf8"),W=(r,s)=>fs.writeFileSync(F(r),s,"utf8");
function must(v,m){if(!v)throw new Error("v8.9.9: "+m)}
function once(s,a,b,m){must(s.includes(a),"target missing: "+m);return s.replace(a,b)}

function patchServer(){
  let s=R("server.js");if(s.includes("/* DREAD SHIFT v8.9.9 server */"))return false;
  s=once(s,'const BUILD_VERSION = "8.9.8";','const BUILD_VERSION = "8.9.9";',"server version");

  s=once(s,
    '  a.createdAt=String(a.createdAt||new Date().toISOString());',
    '  a.createdAt=String(a.createdAt||new Date().toISOString());\n  a.lastSeenAt=String(a.lastSeenAt||a.createdAt||new Date().toISOString());',
    "last seen normalization"
  );

  const friendCardOld=`function v882FriendCard(u){\n  const a=accounts[u];if(!a)return null;v88Account(a);\n  return {username:a.username,displayName:a.displayName,avatar:v88Avatar(a.avatar),accountLevel:a.accountLevel||1};\n}`;
  const friendCardNew=`function v882FriendCard(u){\n  const a=accounts[u];if(!a)return null;v88Account(a);\n  return {username:a.username,displayName:a.displayName,avatar:v88Avatar(a.avatar),accountLevel:a.accountLevel||1,online:v899IsOnline(a.username),lastSeenAt:a.lastSeenAt||a.createdAt||null};\n}`;
  s=once(s,friendCardOld,friendCardNew,"friend presence payload");

  const requestBlock=`  o.friendRequests={\n    incoming:a.friendRequestsIncoming.map(v882FriendCard).filter(Boolean),\n    outgoing:a.friendRequestsOutgoing.map(v882FriendCard).filter(Boolean)\n  };`;
  s=once(s,requestBlock,requestBlock+'\n  o.friends=(a.friends||[]).map(v882FriendCard).filter(Boolean);',"friend list presence payload");

  const wssMarker='const wss=new WebSocketServer({server,maxPayload:WS_MAX_PAYLOAD,perMessageDeflate:false});';
  const presenceHelpers=`const v899InviteCooldown=new Map();\nfunction v899OnlineSockets(username){\n  const u=cleanUsername(username),out=[];\n  if(typeof wss===\"undefined\")return out;\n  for(const client of wss.clients||[])if(client&&client.readyState===client.OPEN&&client.v899Username===u)out.push(client);\n  return out;\n}\nfunction v899IsOnline(username){return v899OnlineSockets(username).length>0;}\n`;
  s=once(s,wssMarker,wssMarker+'\n'+presenceHelpers,"presence helpers");

  const authLine='    if(!account)return send(ws,"authRequired",{message:"Сначала зарегистрируйтесь или войдите"});';
  const inviteHandler=`    if(!account)return send(ws,"authRequired",{message:"Сначала зарегистрируйтесь или войдите"});\n    ws.v899Username=account.username;\n    if(m.type===\"accountLobbyInvite\"){\n      if(!room||!p||room.started||room.mode!==\"duo\")return send(ws,\"notice\",{text:\"Приглашать друзей можно только из созданного DUO-лобби\"});\n      if(p.id!==room.hostId)return send(ws,\"notice\",{text:\"Приглашения отправляет создатель лобби\"});\n      const u=cleanUsername(m.username);v882Social(account);\n      if(!u||u===account.username||!account.friends.includes(u))return send(ws,\"notice\",{text:\"Приглашать можно только игроков из списка друзей\"});\n      const targets=v899OnlineSockets(u);\n      if(!targets.length)return send(ws,\"notice\",{text:\"Друг сейчас не в сети\"});\n      const key=account.username+\"->\"+u,last=v899InviteCooldown.get(key)||0,now=Date.now();\n      if(now-last<8000)return send(ws,\"notice\",{text:\"Подождите немного перед повторным приглашением\"});\n      v899InviteCooldown.set(key,now);if(v899InviteCooldown.size>500)for(const [k,t] of v899InviteCooldown)if(now-t>60000)v899InviteCooldown.delete(k);\n      const from={username:account.username,displayName:account.displayName,avatar:v88Avatar(account.avatar),accountLevel:account.accountLevel||1};\n      for(const target of targets)send(target,\"lobbyInvite\",{from,code:room.code,sentAt:now});\n      send(ws,\"notice\",{text:\"✉ Приглашение отправлено\"});\n      return;\n    }`;
  s=once(s,authLine,inviteHandler,"lobby invite handler");

  const closeAnchor='  ws.on("close",()=>{\n    if(!room||!p)return;';
  const closeWithSeen='  ws.on("close",()=>{\n    if(account){account.lastSeenAt=new Date().toISOString();saveAccounts();}\n    if(!room||!p)return;';
  s=once(s,closeAnchor,closeWithSeen,"last seen on disconnect");

  // Permanent lobby upgrades now use silver again. Tier prices and bonuses stay untouched.
  s=once(s,
    '  const price=metaUpgradePrice(key,level);if(target.gold<price)return false;\n  target.gold-=price;target.metaUpgrades[key]=level+1;saveProgress(target);return true;',
    '  const price=metaUpgradePrice(key,level);if(target.silver<price)return false;\n  target.silver-=price;target.metaUpgrades[key]=level+1;saveProgress(target);return true;',
    "silver permanent upgrades"
  );

  s+='\n/* DREAD SHIFT v8.9.9 server */\n';W("server.js",s);return true;
}

function patchClient(){
  let s=R("public/client.js");if(s.includes("/* DREAD SHIFT v8.9.9 client */"))return false;

  const socialCardRe=/function v882FriendCard\(x,actions\)\{[\s\S]*?\n\}/;
  must(socialCardRe.test(s),"friend card renderer missing");
  s=s.replace(socialCardRe,`function v882FriendCard(x,actions){\n  const online=!!x.online,status=online?T(\"В сети\",\"Online\"):T(\"Не в сети\",\"Offline\"),seen=online?\"\":\" · \"+v899LastSeenText(x.lastSeenAt);\n  return '<article class=\"v882-social-card\">'+v88Av(x)+'<div class=\"v882-social-main\"><b>'+v882Esc(x.displayName||x.username||\"Player\")+'</b><small>@'+v882Esc(x.username||\"-\")+' · LVL '+Number(x.accountLevel||1)+'</small><span class=\"v899-presence '+(online?'online':'offline')+'\"><i></i>'+status+seen+'</span></div><div class=\"v882-social-actions\">'+actions+'</div></article>';\n}`);

  // Room waiting is intentionally minimal: hide account/meta shop clutter while preserving room controls.
  s=once(s,
    '  roomMode=m.mode||"duo";\n\n  $("lobbySetup").classList.add("hidden");',
    '  roomMode=m.mode||"duo";\n  document.querySelector(".lobby-panel")?.classList.add("room-active");\n  v899RenderInviteFriends();\n\n  $("lobbySetup").classList.add("hidden");',
    "minimal room waiting UI"
  );
  s=once(s,
    '  joined=false;isHost=false;roomMode=null;\n  myId=null;state=null;localPred=null;',
    '  joined=false;isHost=false;roomMode=null;\n  document.querySelector(".lobby-panel")?.classList.remove("room-active");\n  myId=null;state=null;localPred=null;',
    "restore full lobby UI"
  );

  // Incoming lobby invitation behaves like an actionable letter and also enters the notification center.
  s=once(s,
    '    if(m.type==="joined")enterRoomWaiting(m);',
    '    if(m.type==="lobbyInvite"){v899ShowLobbyInvite(m);return;}\n    if(m.type==="joined")enterRoomWaiting(m);',
    "lobby invite client message"
  );

  // Restore visible costs on every build slot, including all tower types and dynamic repeat-build prices.
  s=once(s,
    '      b.classList.toggle("unaffordable",!canAfford(p.inventory,cost)||count>=limit);\n      let badge=b.querySelector(".slot-limit");',
    '      b.classList.toggle("unaffordable",!canAfford(p.inventory,cost)||count>=limit);\n      const price=b.querySelector(".slot-cost");if(price)price.textContent=v899BuildCostLabel(cost);\n      let badge=b.querySelector(".slot-limit");',
    "visible build slot prices"
  );

  // v8.9.7 temporarily moved these upgrades to gold. Return the exact same prices to silver.
  s=once(s,
    '<span class="price-gold">${max?"MAX":price+" "+T("золота","gold")}</span><button data-meta-upgrade="${id}" ${max||m.gold<price?"disabled":""}>',
    '<span class="price-silver">${max?"MAX":price+" "+T("серебра","silver")}</span><button data-meta-upgrade="${id}" ${max||m.silver<price?"disabled":""}>',
    "silver upgrade UI"
  );

  const insertAt=s.lastIndexOf("})();");must(insertAt>=0,"client IIFE end missing");
  const hasLegacyPush=/function\s+pushNotification\s*\(|(?:const|let|var)\s+pushNotification\s*=/.test(s);
  const alias=hasLegacyPush?"":`\nfunction pushNotification(text,type=\"info\"){v899PushNotification(text,type);}\n`;
  const ext=`\n// ===== DREAD SHIFT v8.9.9 lobby/social polish =====\nfunction v899BuildCostLabel(c){\n  const parts=[];if(c?.wood)parts.push((c.wood||0)+T(\"д\",\"w\"));if(c?.stone)parts.push((c.stone||0)+T(\"к\",\"s\"));if(c?.scrap)parts.push((c.scrap||0)+T(\"м\",\"scr\"));return parts.join(\" · \")||\"0\";\n}\nfunction v899LastSeenText(value){\n  const t=new Date(value||0).getTime();if(!t)return T(\"давно\",\"a while ago\");const d=Math.max(0,Date.now()-t);\n  if(d<60000)return T(\"был(а) недавно\",\"seen just now\");if(d<3600000)return T(\"был(а) \"+Math.floor(d/60000)+\" мин. назад\",\"seen \"+Math.floor(d/60000)+\" min ago\");if(d<86400000)return T(\"был(а) \"+Math.floor(d/3600000)+\" ч. назад\",\"seen \"+Math.floor(d/3600000)+\" h ago\");\n  return T(\"был(а) \"+new Date(t).toLocaleString(\"ru-RU\",{day:\"2-digit\",month:\"2-digit\",hour:\"2-digit\",minute:\"2-digit\"}),\"seen \"+new Date(t).toLocaleString(\"en-GB\",{day:\"2-digit\",month:\"2-digit\",hour:\"2-digit\",minute:\"2-digit\"}));\n}\nconst v899Notifications=[];let v899Unread=0,v899CurrentInvite=null;\nfunction v899EnsureTopActions(){\n  let wrap=document.getElementById(\"v899TopActions\");if(!wrap){wrap=document.createElement(\"div\");wrap.id=\"v899TopActions\";wrap.className=\"v899-top-actions\";document.body.append(wrap);}\n  let bell=document.getElementById(\"notificationBell\");if(!bell){bell=document.createElement(\"button\");bell.id=\"notificationBell\";bell.className=\"v899-bell\";bell.type=\"button\";bell.innerHTML='🔔<span id=\"notificationBadge\" class=\"v899-badge hidden\">0</span>';wrap.append(bell);}\n  const whats=document.getElementById(\"openWhatsNewBtn\");if(whats&&whats.parentElement!==wrap){whats.classList.add(\"v899-whats\");wrap.append(whats);}\n  let center=document.getElementById(\"notificationCenter\");if(!center){center=document.createElement(\"section\");center.id=\"notificationCenter\";center.className=\"v899-notification-center hidden\";center.innerHTML='<header><b>'+T(\"Уведомления\",\"Notifications\")+'</b><button type=\"button\" data-v899-clear>×</button></header><div id=\"v899NotificationList\"></div>';document.body.append(center);}\n  if(!bell.dataset.v899Bound){bell.dataset.v899Bound=\"1\";bell.addEventListener(\"click\",()=>{center.classList.toggle(\"hidden\");if(!center.classList.contains(\"hidden\")){v899Unread=0;v899RenderNotifications();}});}\n  if(!center.dataset.v899Bound){center.dataset.v899Bound=\"1\";center.addEventListener(\"click\",e=>{if(e.target.closest(\"[data-v899-clear]\")){v899Notifications.length=0;v899Unread=0;v899RenderNotifications();return;}const b=e.target.closest(\"[data-v899-join]\");if(b){v899AcceptInvite(b.dataset.v899Join);center.classList.add(\"hidden\");}});}\n  return {wrap,bell,center};\n}\nfunction v899RenderNotifications(){\n  const {bell}=v899EnsureTopActions(),badge=document.getElementById(\"notificationBadge\"),list=document.getElementById(\"v899NotificationList\");if(badge){badge.textContent=String(v899Unread);badge.classList.toggle(\"hidden\",v899Unread<=0);}\n  if(list)list.innerHTML=v899Notifications.length?v899Notifications.slice().reverse().map(n=>'<article class=\"v899-note '+v882Esc(n.type||\"info\")+'\"><span>'+v882Esc(n.text)+'</span>'+(n.roomCode?'<button type=\"button\" data-v899-join=\"'+v882Esc(n.roomCode)+'\">'+T(\"Зайти\",\"Join\")+'</button>':'')+'<small>'+new Date(n.at).toLocaleTimeString(isEn()?\"en-GB\":\"ru-RU\",{hour:\"2-digit\",minute:\"2-digit\"})+'</small></article>').join(\"\"):'<p class=\"v899-empty\">'+T(\"Пока пусто\",\"Nothing here yet\")+'</p>';\n}\nfunction v899PushNotification(text,type=\"info\",extra={}){v899Notifications.push({text:String(text||\"\"),type,roomCode:extra.roomCode||\"\",at:Date.now()});if(v899Notifications.length>30)v899Notifications.shift();v899Unread++;v899RenderNotifications();}\n${alias}\nfunction v899SyncTopActions(){const ui=v899EnsureTopActions(),auth=document.getElementById(\"authOverlay\"),show=!!(lobby?.classList.contains(\"visible\"))&&!(auth?.classList.contains(\"visible\"))&&!state?.started;ui.wrap.classList.toggle(\"hidden\",!show);if(!show)ui.center.classList.add(\"hidden\");}\nfunction v899Perks(level){level=Number(level)||1;return {hp:(level>=2?5:0)+(level>=6?5:0)+(level>=10?10:0),speed:(level>=4?2:0)+(level>=8?2:0)+(level>=10?2:0)}}\nconst v899RenderProfileStats=renderProfileStats;\nrenderProfileStats=function(){\n  v899RenderProfileStats();if(!accountState)return;const level=accountState.accountLevel||1,perk=v899Perks(level),stats=document.getElementById(\"profileStats\");if(!stats)return;\n  let box=document.getElementById(\"profileLevelPerks\");if(!box){box=document.createElement(\"section\");box.id=\"profileLevelPerks\";box.className=\"v899-profile-perks\";stats.after(box);}\n  box.innerHTML='<b>'+T(\"Бонусы уровня аккаунта\",\"Account level perks\")+' · LVL '+level+'</b><strong>+'+perk.hp+' HP · +'+perk.speed+'% '+T(\"скорости\",\"speed\")+'</strong><small>LVL 2 +5 HP · LVL 4 +2% SPEED · LVL 6 +5 HP · LVL 8 +2% SPEED · LVL 10 +10 HP/+2% SPEED</small>';\n};\nconst v899RenderLobbyMeta=renderLobbyMeta;\nrenderLobbyMeta=function(){v899RenderLobbyMeta();if(lobbyMetaMode===\"upgrades\")lobbyMetaContent.querySelector(\".v88-level\")?.remove();};\nfunction v899InviteRoot(){\n  const panel=document.getElementById(\"roomWaitPanel\");if(!panel)return null;let root=document.getElementById(\"v899InviteFriends\");if(!root){root=document.createElement(\"section\");root.id=\"v899InviteFriends\";root.className=\"v899-invite-friends hidden\";const start=document.getElementById(\"startBtn\");(start?.parentElement||panel).insertBefore(root,start||null);}return root;\n}\nfunction v899RenderInviteFriends(){\n  const root=v899InviteRoot();if(!root)return;const available=joined&&roomMode===\"duo\"&&isHost&&!state?.started;root.classList.toggle(\"hidden\",!available);if(!available)return;\n  const friends=v88A()?.friends||[];root.innerHTML='<div class=\"v899-invite-head\"><div><b>✉ '+T(\"Пригласить друга\",\"Invite a friend\")+'</b><small>'+T(\"Друг получит приглашение в это лобби\",\"Your friend will receive a lobby invitation\")+'</small></div><button type=\"button\" data-v899-sync>↻</button></div><div class=\"v899-invite-list\">'+(friends.length?friends.map(f=>'<article><span class=\"v899-dot '+(f.online?'online':'offline')+'\"></span><div><b>'+v882Esc(f.displayName||f.username)+'</b><small>@'+v882Esc(f.username)+' · '+(f.online?T(\"в сети\",\"online\"):v899LastSeenText(f.lastSeenAt))+'</small></div><button type=\"button\" data-v899-invite=\"'+v882Esc(f.username)+'\" '+(f.online?'':'disabled')+'>'+T(\"Пригласить\",\"Invite\")+'</button></article>').join(\"\"):'<p>'+T(\"Добавь друзей, чтобы приглашать их сюда.\",\"Add friends to invite them here.\")+'</p>')+'</div>';\n  if(!root.dataset.v899Bound){root.dataset.v899Bound=\"1\";root.addEventListener(\"click\",e=>{const inv=e.target.closest(\"[data-v899-invite]\");if(inv&&!inv.disabled){send(\"accountLobbyInvite\",{username:inv.dataset.v899Invite});return;}if(e.target.closest(\"[data-v899-sync]\"))send(\"accountFriendSync\");});}\n}\nfunction v899AcceptInvite(code){if(joined){toast(T(\"Сначала выйдите из текущего лобби\",\"Leave your current lobby first\"));return;}v899CurrentInvite=null;document.getElementById(\"v899LobbyInvite\")?.remove();send(\"join\",{...joinPayload(),room:code});}\nfunction v899ShowLobbyInvite(m){\n  const from=m?.from||{},code=String(m?.code||\"\").trim();if(!code)return;v899CurrentInvite={...m,code};v899PushNotification(T(\"✉ Приглашение в лобби от \"+(from.displayName||from.username||\"друга\"),\"✉ Lobby invite from \"+(from.displayName||from.username||\"a friend\")),\"invite\",{roomCode:code});\n  document.getElementById(\"v899LobbyInvite\")?.remove();const card=document.createElement(\"section\");card.id=\"v899LobbyInvite\";card.className=\"v899-lobby-invite\";card.innerHTML='<span>✉</span><div><small>'+T(\"ПРИГЛАШЕНИЕ В ЛОББИ\",\"LOBBY INVITATION\")+'</small><b>'+v882Esc(from.displayName||from.username||T(\"Друг\",\"Friend\"))+'</b><em>'+T(\"Код комнаты\",\"Room code\")+': '+v882Esc(code)+'</em></div><button type=\"button\" data-v899-accept>'+T(\"Зайти\",\"Join\")+'</button><button type=\"button\" data-v899-decline>×</button>';document.body.append(card);\n  card.addEventListener(\"click\",e=>{if(e.target.closest(\"[data-v899-accept]\"))v899AcceptInvite(code);if(e.target.closest(\"[data-v899-decline]\")){v899CurrentInvite=null;card.remove();}});\n  setTimeout(()=>{if(card.isConnected)card.remove();},30000);\n}\nv899EnsureTopActions();v899SyncTopActions();renderProfileStats();setInterval(()=>{v899SyncTopActions();if(document.querySelector(\".lobby-panel.room-active\")){v899RenderInviteFriends();send(\"accountFriendSync\");}},5000);\n`;
  s=s.slice(0,insertAt)+ext+s.slice(insertAt);
  s+='\n/* DREAD SHIFT v8.9.9 client */\n';
  try{new Function(s)}catch(e){throw new Error("v8.9.9 client syntax: "+e.message)}W("public/client.js",s);return true;
}

function patchHtml(){
  let s=R("public/index.html");if(s.includes("<!-- DREAD SHIFT v8.9.9 -->"))return false;
  s=s.replaceAll("V8.9.8","V8.9.9").replaceAll("v8.9.8","v8.9.9");
  s=s.replace(/<title>[\s\S]*?<\/title>/i,'<title>Dread Shift v8.9.9</title>');
  s=s.replaceAll("NIGHT SHIFT DUO • V8.0","DREAD SHIFT • V8.9.9").replaceAll("NIGHT SHIFT DUO • V8.9.9","DREAD SHIFT • V8.9.9");
  s+='\n<!-- DREAD SHIFT v8.9.9 -->\n';W("public/index.html",s);return true;
}
function patchCss(){
  let s=R("public/style.css");if(s.includes("/* DREAD SHIFT v8.9.9 lobby social */"))return false;
  s+='\n/* DREAD SHIFT v8.9.9 lobby social */\n'+
  '.lobby-panel.room-active #lobbyAccountCard,.lobby-panel.room-active .lobby-wallet,.lobby-panel.room-active #lobbyMetaNav{display:none!important}\n'+
  '.v899-top-actions{position:fixed;right:18px;top:16px;z-index:330;display:flex;align-items:center;gap:8px}.v899-top-actions.hidden{display:none!important}.v899-top-actions button{min-height:38px;border:1px solid #33434a;background:#10181c;color:#e9f0f2;border-radius:10px;padding:0 12px;font-weight:850}.v899-bell{position:relative!important;font-size:17px}.v899-badge{position:absolute;right:-5px;top:-6px;min-width:18px;height:18px;padding:0 4px;border-radius:999px;background:#ef4d57;color:#fff;font:900 10px/18px system-ui}.v899-badge.hidden{display:none}.v899-whats{position:static!important;margin:0!important}\n'+
  '.v899-notification-center{position:fixed;right:18px;top:64px;width:min(390px,calc(100vw - 36px));max-height:520px;overflow:auto;z-index:329;background:#091014;border:1px solid #304048;border-radius:14px;box-shadow:0 20px 60px #0009;padding:10px}.v899-notification-center.hidden{display:none}.v899-notification-center header{display:flex;justify-content:space-between;align-items:center;padding:6px 8px 10px}.v899-notification-center header button{border:0;background:transparent;color:#9aa8ae;font-size:20px}.v899-note{display:grid;grid-template-columns:1fr auto;gap:5px 10px;padding:10px;border-radius:10px;background:#10191e;margin:6px 0}.v899-note span{grid-column:1/-1;font-weight:750}.v899-note small{color:#7f9098}.v899-note button{border:1px solid #45645a;background:#18382c;color:#aef0c8;border-radius:8px;padding:5px 10px}.v899-empty{color:#7f8d93;text-align:center;padding:18px}\n'+
  '.v899-presence{display:block;margin-top:4px;font-size:11px;color:#8d9aa0}.v899-presence i,.v899-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;background:#68747a}.v899-presence.online{color:#7ee6a5}.v899-presence.online i,.v899-dot.online{background:#55e68b;box-shadow:0 0 9px #55e68b88}.v899-dot.offline{background:#667177}\n'+
  '.v899-profile-perks{margin:14px 0;padding:14px;border:1px solid #334149;border-radius:12px;background:#0c1418;display:grid;gap:6px}.v899-profile-perks b{font-size:15px}.v899-profile-perks strong{font-size:14px;color:#e7edf0}.v899-profile-perks small{color:#85949a;line-height:1.5}\n'+
  '.v899-invite-friends{margin:12px 0;padding:12px;border:1px solid #304139;border-radius:12px;background:#0b1512}.v899-invite-friends.hidden{display:none}.v899-invite-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.v899-invite-head div{display:grid;gap:3px}.v899-invite-head small{color:#8b9b94}.v899-invite-list{display:grid;gap:7px;margin-top:10px}.v899-invite-list article{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px;background:#101c18;border-radius:10px;padding:8px}.v899-invite-list article div{display:grid}.v899-invite-list small{color:#82938b}.v899-invite-list button{border:1px solid #3e6653;background:#173626;color:#9fe6bb;border-radius:8px;padding:7px 10px}.v899-invite-list button:disabled{opacity:.35}\n'+
  '.v899-lobby-invite{position:fixed;right:22px;bottom:22px;z-index:360;width:min(440px,calc(100vw - 44px));display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:12px;background:#0b1519;border:1px solid #3c6655;border-radius:14px;padding:14px;box-shadow:0 18px 70px #000b}.v899-lobby-invite>span{font-size:26px}.v899-lobby-invite div{display:grid;gap:2px}.v899-lobby-invite small{color:#75d99b;font-weight:900}.v899-lobby-invite em{color:#89989f;font-style:normal;font-size:11px}.v899-lobby-invite button{border:1px solid #416653;background:#173629;color:#a7ebc1;border-radius:8px;padding:8px 12px}.v899-lobby-invite [data-v899-decline]{background:transparent;border-color:#4a3a3d;color:#c9a3a8}\n'+
  '@media(max-width:760px){.v899-top-actions{right:10px;top:10px}.v899-notification-center{right:10px;top:58px;width:calc(100vw - 20px)}.v899-lobby-invite{right:10px;bottom:10px;width:calc(100vw - 20px)}}\n';
  W("public/style.css",s);return true;
}

const changed={server:patchServer(),client:patchClient(),html:patchHtml(),css:patchCss()};
const server=R("server.js"),client=R("public/client.js"),html=R("public/index.html");
must(server.includes('const BUILD_VERSION = "8.9.9";'),"server version missing");
must(server.includes('target.silver-=price'),"silver upgrades missing");
must(server.includes('m.type==="accountLobbyInvite"'),"lobby invite server missing");
must(client.includes('v899ShowLobbyInvite'),"invite client missing");
must(client.includes('v899BuildCostLabel'),"tower cost labels missing");
must(client.includes('profileLevelPerks'),"profile level perks missing");
must(html.includes('<title>Dread Shift v8.9.9</title>'),"browser title version missing");
console.log("DREAD SHIFT v8.9.9 lobby/social patch applied:",changed);
