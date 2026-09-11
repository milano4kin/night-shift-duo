"use strict";
const fs=require("fs"),path=require("path");
const file=rel=>path.join(__dirname,rel);
const read=rel=>fs.readFileSync(file(rel),"utf8");
const write=(rel,s)=>fs.writeFileSync(file(rel),s,"utf8");
function must(cond,msg){if(!cond)throw new Error("v8.8.2: "+msg)}
function replaceOnce(s,from,to,label){
  must(s.includes(from),"target missing: "+label);
  return s.replace(from,to);
}
function patchServer(){
  let s=read("server.js");
  if(s.includes("/* DREAD SHIFT v8.8.2 server */"))return false;
  s=replaceOnce(s,'const BUILD_VERSION = "8.8.0";','const BUILD_VERSION = "8.8.2";',"build version");
  s=replaceOnce(
    s,
    '["accountSetAvatar","accountFriendAdd","accountFriendRemove","metaCosmeticBuy","metaCosmeticEquip"]',
    '["accountSetAvatar","accountFriendAdd","accountFriendAccept","accountFriendDecline","accountFriendCancel","accountFriendSync","accountFriendRemove","metaCosmeticBuy","metaCosmeticEquip"]',
    "social message list"
  );
  const socialRe=/      if\(m\.type==="accountFriendAdd"\)\{[\s\S]*?(?=      if\(m\.type==="metaCosmeticBuy"\))/;
  must(socialRe.test(s),"old friend handlers not found");
  const block=`      if(m.type==="accountFriendSync"){v882Social(account);}
      if(m.type==="accountFriendAdd"){
        const u=cleanUsername(m.username),f=accounts[u];v882Social(account);
        if(!f||u===account.username){send(ws,"notice",{text:"Игрок не найден"});return;}
        v882Social(f);
        if(account.friends.includes(u)){send(ws,"notice",{text:"Этот игрок уже у тебя в друзьях"});return;}
        if(account.friends.length>=100){send(ws,"notice",{text:"У тебя максимум 100 друзей"});return;}
        if(f.friends.length>=100){send(ws,"notice",{text:"У этого игрока список друзей заполнен"});return;}
        if(account.friendRequestsIncoming.includes(u)){send(ws,"notice",{text:"У тебя уже есть входящий запрос от этого игрока"});return;}
        if(account.friendRequestsOutgoing.includes(u)){send(ws,"notice",{text:"Запрос уже отправлен"});return;}
        if(account.friendRequestsOutgoing.length>=40){send(ws,"notice",{text:"Слишком много исходящих запросов"});return;}
        if(f.friendRequestsIncoming.length>=40){send(ws,"notice",{text:"У игрока слишком много входящих запросов"});return;}
        account.friendRequestsOutgoing.push(u);f.friendRequestsIncoming.push(account.username);saveAccounts();
        send(ws,"notice",{text:"Запрос в друзья отправлен"});
      }
      if(m.type==="accountFriendAccept"){
        const u=cleanUsername(m.username),f=accounts[u];v882Social(account);
        if(!f||!account.friendRequestsIncoming.includes(u)){send(ws,"notice",{text:"Запрос уже недоступен"});return;}
        v882Social(f);
        if(account.friends.length>=100||f.friends.length>=100){send(ws,"notice",{text:"Список друзей заполнен"});return;}
        v882DropRequest(account,f,u);
        if(!account.friends.includes(u))account.friends.push(u);
        if(!f.friends.includes(account.username))f.friends.push(account.username);
        saveAccounts();send(ws,"notice",{text:"Запрос принят"});
      }
      if(m.type==="accountFriendDecline"){
        const u=cleanUsername(m.username),f=accounts[u];v882Social(account);
        if(f){v882Social(f);v882DropRequest(account,f,u)}else account.friendRequestsIncoming=account.friendRequestsIncoming.filter(x=>x!==u);
        saveAccounts();send(ws,"notice",{text:"Запрос отклонён"});
      }
      if(m.type==="accountFriendCancel"){
        const u=cleanUsername(m.username),f=accounts[u];v882Social(account);
        account.friendRequestsOutgoing=account.friendRequestsOutgoing.filter(x=>x!==u);
        if(f){v882Social(f);f.friendRequestsIncoming=f.friendRequestsIncoming.filter(x=>x!==account.username)}
        saveAccounts();send(ws,"notice",{text:"Запрос отменён"});
      }
      if(m.type==="accountFriendRemove"){
        const u=cleanUsername(m.username),f=accounts[u];v882Social(account);
        account.friends=account.friends.filter(x=>x!==u);
        if(f){v882Social(f);f.friends=f.friends.filter(x=>x!==account.username)}
        saveAccounts();send(ws,"notice",{text:"Игрок удалён из друзей"});
      }
`;
  s=s.replace(socialRe,block);
  s+=`
function v882Social(a){
  if(!a)return a;
  v88Account(a);
  const clean=list=>[...new Set((Array.isArray(list)?list:[]).map(x=>cleanUsername(x)).filter(u=>u&&u!==a.username&&accounts[u]&&!a.friends.includes(u)))].slice(0,40);
  a.friendRequestsIncoming=clean(a.friendRequestsIncoming);
  a.friendRequestsOutgoing=clean(a.friendRequestsOutgoing);
  return a;
}
function v882DropRequest(a,f,u){
  a.friendRequestsIncoming=a.friendRequestsIncoming.filter(x=>x!==u);
  a.friendRequestsOutgoing=a.friendRequestsOutgoing.filter(x=>x!==u);
  f.friendRequestsIncoming=f.friendRequestsIncoming.filter(x=>x!==a.username);
  f.friendRequestsOutgoing=f.friendRequestsOutgoing.filter(x=>x!==a.username);
}
function v882FriendCard(u){
  const a=accounts[u];if(!a)return null;v88Account(a);
  return {username:a.username,displayName:a.displayName,avatar:v88Avatar(a.avatar),accountLevel:a.accountLevel||1};
}
const _v882PublicAccountSnapshot=publicAccountSnapshot;
publicAccountSnapshot=function(a,p=null){
  const o=_v882PublicAccountSnapshot(a,p);if(!o)return o;v882Social(a);
  o.friendRequests={
    incoming:a.friendRequestsIncoming.map(v882FriendCard).filter(Boolean),
    outgoing:a.friendRequestsOutgoing.map(v882FriendCard).filter(Boolean)
  };
  return o;
};
/* DREAD SHIFT v8.8.2 server */
`;
  must(s.includes("accountFriendAccept"),"accept handler missing");
  must(s.includes("friendRequestsIncoming"),"request storage missing");
  write("server.js",s);return true;
}
function patchClient(){
  let s=read("public/client.js");
  if(s.includes("/* DREAD SHIFT v8.8.2 client */"))return false;
  const insertAt=s.lastIndexOf("})();");
  must(insertAt>=0,"client IIFE end missing");
  const c=`
const v882Esc=v=>String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
function v882FriendCard(x,actions){
  return '<article class="v882-social-card">'+v88Av(x)+'<div class="v882-social-main"><b>'+v882Esc(x.displayName||x.username||"Player")+'</b><small>@'+v882Esc(x.username||"-")+' · LVL '+Number(x.accountLevel||1)+'</small></div><div class="v882-social-actions">'+actions+'</div></article>';
}
function v882UpdateFriendBadge(){
  const incoming=v88A()?.friendRequests?.incoming||[],btn=v88Nav?.querySelector('[data-lobby-pane="friends"]');
  if(!btn)return;let badge=btn.querySelector(".v882-friend-badge");
  if(!badge){badge=document.createElement("span");badge.className="v882-friend-badge";btn.append(badge)}
  badge.textContent=String(incoming.length);badge.classList.toggle("hidden",!incoming.length);
}
let v882LastIncoming=null;
function v882MaybeNotify(){
  const n=(v88A()?.friendRequests?.incoming||[]).length;
  if(v882LastIncoming!==null&&n>v882LastIncoming)pushNotification(T("👥 Новый запрос в друзья","👥 New friend request"),"friend");
  v882LastIncoming=n;
}
v88Friends=function(){
  const a=v88A(),req=a.friendRequests||{},incoming=req.incoming||[],outgoing=req.outgoing||[],friends=a.friends||[];
  const incomingHtml=incoming.map(x=>v882FriendCard(x,'<button class="v882-accept" data-v882-accept="'+v882Esc(x.username)+'">'+T("Принять","Accept")+'</button><button class="v882-decline" data-v882-decline="'+v882Esc(x.username)+'">'+T("Отклонить","Decline")+'</button>')).join("");
  const outgoingHtml=outgoing.map(x=>v882FriendCard(x,'<button data-v882-cancel="'+v882Esc(x.username)+'">'+T("Отменить","Cancel")+'</button>')).join("");
  const friendsHtml=friends.map(x=>v882FriendCard(x,'<button class="v882-remove" data-v88-rm="'+v882Esc(x.username)+'" title="'+T("Удалить из друзей","Remove friend")+'">×</button>')).join("");
  lobbyMetaContent.innerHTML='<section class="v88-profile">'+v88Av(a)+'<div><b>'+v882Esc(a.displayName||a.username||"Player")+'</b><small>@'+v882Esc(a.username||"-")+' · LVL '+Number(a.accountLevel||1)+'</small><div class="v882-profile-actions"><label>'+T("Загрузить аватар","Upload avatar")+'<input id="v88Avatar" type="file" accept="image/png,image/jpeg,image/webp" hidden></label><button data-v88-reset>'+T("Сбросить","Reset")+'</button><button data-v882-refresh>↻ '+T("Обновить","Refresh")+'</button></div></div></section>'+
  '<section class="v882-request-box"><div class="v882-section-title"><div><b>'+T("Добавить друга","Add friend")+'</b><small>'+T("Отправь запрос — друг появится только после принятия.","Send a request — friendship starts after acceptance.")+'</small></div></div><div class="v88-add"><input id="v88Friend" maxlength="24" autocomplete="off" placeholder="'+T("Логин игрока","Player username")+'"><button data-v88-add>'+T("Отправить запрос","Send request")+'</button></div></section>'+
  '<div class="v882-section-title"><b>'+T("Входящие запросы","Incoming requests")+'</b><span>'+incoming.length+'</span></div>'+(incomingHtml||'<p class="v882-empty">'+T("Новых запросов нет","No new requests")+'</p>')+
  '<div class="v882-section-title"><b>'+T("Исходящие запросы","Sent requests")+'</b><span>'+outgoing.length+'</span></div>'+(outgoingHtml||'<p class="v882-empty">'+T("Нет ожидающих запросов","No pending requests")+'</p>')+
  '<div class="v882-section-title"><b>'+T("Друзья","Friends")+'</b><span>'+friends.length+'/100</span></div>'+(friendsHtml||'<p class="v882-empty">'+T("Друзей пока нет","No friends yet")+'</p>');
  v882UpdateFriendBadge();v882MaybeNotify();
};
const v882RenderLobbyMeta=renderLobbyMeta;
renderLobbyMeta=function(){v882RenderLobbyMeta();v882UpdateFriendBadge();v882MaybeNotify()};
lobbyMetaContent.addEventListener("click",e=>{
  let b=e.target.closest("[data-v882-accept]");if(b){send("accountFriendAccept",{username:b.dataset.v882Accept});return}
  b=e.target.closest("[data-v882-decline]");if(b){send("accountFriendDecline",{username:b.dataset.v882Decline});return}
  b=e.target.closest("[data-v882-cancel]");if(b){send("accountFriendCancel",{username:b.dataset.v882Cancel});return}
  if(e.target.closest("[data-v882-refresh]"))send("accountFriendSync");
});
v88Nav?.addEventListener("click",e=>{if(e.target.closest('[data-lobby-pane="friends"]'))setTimeout(()=>send("accountFriendSync"),80)});
setInterval(()=>{if(accountState?.username&&!state?.started&&document.getElementById("lobby")?.classList.contains("visible"))send("accountFriendSync")},10000);
const v882WhatsNew=document.getElementById("openWhatsNewBtn"),v882Bell=document.getElementById("notificationBell");
if(v882WhatsNew&&v882Bell?.parentElement){v882WhatsNew.classList.add("v88-whats","v882-whats");v882Bell.after(v882WhatsNew)}
const v882SyncNotificationUi=syncNotificationUi;
syncNotificationUi=function(){v882SyncNotificationUi();const b=document.getElementById("notificationBell"),w=document.getElementById("openWhatsNewBtn");if(w)w.classList.toggle("hidden",!b||b.classList.contains("hidden"))};
syncNotificationUi();
/* DREAD SHIFT v8.8.2 client */
`;
  s=s.slice(0,insertAt)+c+s.slice(insertAt);
  try{new Function(s)}catch(err){throw new Error("v8.8.2 client syntax: "+err.message)}
  write("public/client.js",s);return true;
}
function patchHtml(){
  let s=read("public/index.html");if(s.includes("<!-- DREAD SHIFT v8.8.2 -->"))return false;
  s=s.replaceAll("v8.8.0","v8.8.2").replaceAll("V8.8.0","V8.8.2");
  s+="\n<!-- DREAD SHIFT v8.8.2 -->\n";write("public/index.html",s);return true;
}
function patchCss(){
  let s=read("public/style.css");if(s.includes("/* DREAD SHIFT v8.8.2 styles */"))return false;
  s+=`
/* DREAD SHIFT v8.8.2 styles */
.v882-section-title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:14px 0 7px}.v882-section-title span{min-width:26px;height:22px;padding:0 7px;border-radius:999px;background:#162328;border:1px solid #2d4249;display:grid;place-items:center;font-size:11px;font-weight:900}.v882-section-title small{display:block;color:#81908b;margin-top:3px}.v882-request-box{border:1px solid #263a40;background:linear-gradient(135deg,#0d171a,#0a1114);border-radius:14px;padding:12px;margin:12px 0}.v882-social-card{display:grid;grid-template-columns:52px minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid #26363b;background:#0b1215;border-radius:12px;padding:9px;margin-bottom:7px}.v882-social-main{min-width:0}.v882-social-main b,.v882-social-main small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.v882-social-main small,.v882-empty{color:#81908b}.v882-social-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.v882-social-actions button{min-width:74px}.v882-accept{border-color:#2f7a52!important;background:#123322!important}.v882-decline,.v882-remove{border-color:#6c3434!important}.v882-profile-actions{display:flex;gap:6px;flex-wrap:wrap}.v882-friend-badge{margin-left:auto;min-width:20px;height:20px;border-radius:999px;background:#d94747;color:white;display:inline-grid;place-items:center;font-size:10px;font-weight:950}.v882-friend-badge.hidden{display:none!important}#openWhatsNewBtn.v882-whats{position:fixed!important;top:14px!important;right:66px!important;z-index:95!important;width:auto!important;min-height:42px!important;padding:0 12px!important;border-radius:12px!important;font-size:11px!important;white-space:nowrap!important}.notification-center #openWhatsNewBtn.v882-whats{position:fixed!important;width:auto!important;margin:0!important}@media(max-width:760px){#openWhatsNewBtn.v882-whats{top:10px!important;right:58px!important;min-height:40px!important;padding:0 9px!important}.v882-social-card{grid-template-columns:44px minmax(0,1fr)}.v882-social-card .v88-av{width:44px;height:44px}.v882-social-actions{grid-column:1/-1;justify-content:stretch}.v882-social-actions button{flex:1}}
`;
  write("public/style.css",s);return true;
}
const changed={server:patchServer(),client:patchClient(),html:patchHtml(),css:patchCss()};
console.log("DREAD SHIFT v8.8.2 social patch applied:",changed);
