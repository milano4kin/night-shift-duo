"use strict";
const fs=require("node:fs"),path=require("node:path");
const F=r=>path.join(__dirname,r),R=r=>fs.readFileSync(F(r),"utf8"),W=(r,s)=>fs.writeFileSync(F(r),s,"utf8");
function must(v,m){if(!v)throw new Error("restore-full: "+m)}
function once(s,a,b,label,required=true){
  if(s.includes(b))return s;
  if(!s.includes(a)){if(required)throw new Error("restore-full target missing: "+label);return s;}
  return s.replace(a,b);
}

function patchServer(){
  let s=R("server.js");
  if(s.includes("/* DREAD SHIFT full restore 2026-09-13 server */"))return false;

  // INDEX is a lobby tool, not progression content. Unknown entries stay hidden inside the index itself.
  s=once(s,"crates:best>=3,pets:best>=3,index:known};","crates:best>=3,pets:best>=3,index:true};","always-visible index",false);

  // Restore the requested 30-second build/preparation window.
  s=once(s,"  room.phaseTimer=first?15:21;","  room.phaseTimer=30;","30 second prep",false);

  // Promo rewards from the last requested economy. lobby_tools_patch creates the code system first.
  s=s.replace(/WELCOME:\{display:"Welcome",silver:\d+,gold:\d+,crateTokens:\d+\}/,'WELCOME:{display:"Welcome",silver:300,gold:25,crateTokens:1}');
  s=s.replace(/TEST:\{display:"TEST",silver:\d+,gold:\d+,crateTokens:\d+\}/,'TEST:{display:"TEST",silver:150,gold:10,crateTokens:0}');

  // Smooth server-side pet movement: remove the 22px dead-zone that made companions hop between snapshots.
  s=once(s,
    'else{const dx=targetX-p.petX,dy=targetY-p.petY,d=Math.hypot(dx,dy);if(d>22){const step=Math.min(d,Math.min(185,55+d*.42)*dt);p.petX+=dx/d*step;p.petY+=dy/d*step;}}',
    'else{const dx=targetX-p.petX,dy=targetY-p.petY,d=Math.hypot(dx,dy);if(d>.25){const speed=Math.min(245,90+d*.52),step=Math.min(d,speed*dt);p.petX+=dx/d*step;p.petY+=dy/d*step;}}',
    "continuous pet follow",false);

  // Cumulative end-of-run rewards. Each reached milestone is paid once per run.
  if(!s.includes("const RUN_MILESTONE_REWARDS=[")){
    const recordRe=/function recordRun\(p,room,result="gameover"\)\{[\s\S]*?\n\}/;
    must(recordRe.test(s),"recordRun function not found");
    s=s.replace(recordRe,[
      'const RUN_MILESTONE_REWARDS=[',
      '  {wave:5,silver:30,gold:5},{wave:10,silver:200,gold:20},{wave:15,silver:350,gold:20},',
      '  {wave:20,silver:500,gold:30},{wave:25,silver:700,gold:40},{wave:30,silver:950,gold:55},',
      '  {wave:35,silver:1250,gold:70},{wave:40,silver:1600,gold:90},{wave:45,silver:2100,gold:120},{wave:50,silver:3000,gold:175}',
      '];',
      'function grantRunMilestoneRewards(p,completedWaves){',
      '  completedWaves=Math.max(0,Math.min(50,Number(completedWaves)||0));',
      '  if(p.runMilestonePaid)return p.runMilestoneReward||{completedWaves,silver:0,gold:0,milestones:[]};',
      '  const milestones=RUN_MILESTONE_REWARDS.filter(r=>completedWaves>=r.wave);',
      '  const reward={completedWaves,silver:milestones.reduce((n,r)=>n+r.silver,0),gold:milestones.reduce((n,r)=>n+r.gold,0),milestones:milestones.map(r=>r.wave)};',
      '  p.silver=(p.silver||0)+reward.silver;p.gold=(p.gold||0)+reward.gold;',
      '  p.runMilestonePaid=true;p.runMilestoneReward=reward;',
      '  return reward;',
      '}',
      'function recordRun(p,room,result="gameover"){',
      '  ensureMeta(p);',
      '  let completedWaves=Math.max(0,Number(p.runStats?.waves)||0);',
      '  if(result==="victory")completedWaves=Math.max(completedWaves,Math.min(50,Number(room.wave)||0));',
      '  const earned=grantRunMilestoneRewards(p,completedWaves);',
      '  const row={date:new Date().toISOString(),wave:room.wave,completedWaves,kills:p.runStats?.kills||0,builds:p.runStats?.builds||0,damage:Math.round(p.runStats?.damage||0),classId:p.character,petId:p.equippedPet||null,weapon:favoriteWeapon(p),result,earnedSilver:earned.silver,earnedGold:earned.gold,rewardMilestones:earned.milestones};',
      '  p.runHistory=[row,...(p.runHistory||[])].slice(0,5);',
      '  checkAchievements(p,room);saveProgress(p);return row;',
      '}'
    ].join("\n"));
  }
  s=once(s,
    'p.runBonuses={damage:0,speed:0};p.runStats={kills:0,harvest:0,waves:0,builds:0,damage:0,coreDamage:0,weaponShots:{},minCoreRatio:1};p.petState=blankPetState();',
    'p.runBonuses={damage:0,speed:0};p.runStats={kills:0,harvest:0,waves:0,builds:0,damage:0,coreDamage:0,weaponShots:{},minCoreRatio:1};p.runMilestonePaid=false;p.runMilestoneReward=null;p.petState=blankPetState();',
    "run reward reset",false);

  // Pet crate duplicates are not new discoveries.
  s=once(s,
    '  const result=weightedPetRoll();target.petsOwned[result]=(target.petsOwned[result]||0)+1;\n  saveProgress(target);return {pet:result,reel:buildCrateReel(result),usedToken:useToken};',
    '  const result=weightedPetRoll(),previousCount=target.petsOwned[result]||0,isNew=previousCount<=0;target.petsOwned[result]=previousCount+1;\n  saveProgress(target);return {pet:result,reel:buildCrateReel(result),usedToken:useToken,isNew};',
    "crate duplicate flag",false);

  // Spikes are floor traps: zombies pass through, and each fresh entry consumes one contact of durability.
  const spikeHelper='function structureCooldownMultiplier(st){return STRUCTURE_LEVEL_COOLDOWN[Math.max(1,Math.min(5,st?.level||1))]||1;}';
  if(s.includes(spikeHelper)&&!s.includes("SPIKE_CONTACT_LIMIT_BY_LEVEL")){
    s=s.replace(spikeHelper,spikeHelper+'\nconst SPIKE_CONTACT_LIMIT_BY_LEVEL=[0,25,40,60];\nconst spikeContactState=new Map();\nfunction spikeContactLimit(st){return SPIKE_CONTACT_LIMIT_BY_LEVEL[Math.max(1,Math.min(3,Number(st?.level)||1))]||25;}');
  }
  const oldSpike=[
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
  ].join("\n");
  const newSpike=[
    '    if(s.type==="spikes"){',
    '      const previous=spikeContactState.get(s.id)||new Set(),inside=new Set(),contactLimit=spikeContactLimit(s);',
    '      for(const z of room.zombies){',
    '        if(z.hp<=0||dist(s,z)>=s.r+z.r+9)continue;',
    '        inside.add(z.id);if(previous.has(z.id))continue;',
    '        const dealt=damageZombie(z,18*(s.power||1)*defensePetMult*comboDamageMultiplier(comboOwner),"melee");',
    '        creditStructureHit(room,s,z,dealt);s.hp=Math.max(0,s.hp-(s.maxHp/Math.max(1,contactLimit)));if(s.hp<=0)break;',
    '      }',
    '      if(s.hp>0&&inside.size)spikeContactState.set(s.id,inside);else spikeContactState.delete(s.id);',
    '      if(spikeContactState.size>512)spikeContactState.clear();',
    '    }'
  ].join("\n");
  s=once(s,oldSpike,newSpike,"spike traversal",false);

  // Spawn ranged projectiles from the muzzle instead of the trigger/body.
  s=once(s,
    '      x:p.x+Math.cos(a)*29,y:p.y+Math.sin(a)*29,vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed,',
    '      x:p.x+Math.cos(a)*(({pistol:50,micro_uzi:54,ump:60,bubble_blaster:56}[p.weapon.type])||29),y:p.y+Math.sin(a)*(({pistol:50,micro_uzi:54,ump:60,bubble_blaster:56}[p.weapon.type])||29),vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed,',
    "server muzzle position",false);

  // Same-origin HTTP auth path: registration/login no longer depends exclusively on a healthy WebSocket.
  if(!s.includes('requestPath==="/api/auth/register"')){
    const marker='const server=http.createServer((req,res)=>{\n  let url=req.url.split("?")[0];';
    const replacement=[
      'const server=http.createServer((req,res)=>{',
      '  const requestPath=req.url.split("?")[0];',
      '  if(req.method==="POST"&&(requestPath==="/api/auth/register"||requestPath==="/api/auth/login")){',
      '    let bodyText="";req.setEncoding("utf8");',
      '    req.on("data",chunk=>{if(bodyText.length<=8192)bodyText+=chunk;});',
      '    req.on("end",()=>{',
      '      const json=(status,payload)=>{res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});res.end(JSON.stringify(payload));};',
      '      if(bodyText.length>8192)return json(413,{ok:false,message:"Слишком большой запрос"});',
      '      let body;try{body=JSON.parse(bodyText||"{}");}catch{return json(400,{ok:false,message:"Некорректный запрос"});}',
      '      try{',
      '        if(requestPath==="/api/auth/register"){',
      '          let result=registerAccount(body.username,body.password,body.displayName),recovered=false;',
      '          if(result.error){if(result.error==="Такой логин уже занят"){const existing=authenticateAccount(body.username,body.password);if(existing){result={account:existing,starterGift:false};recovered=true;}}if(result.error)return json(400,{ok:false,message:result.error});}',
      '          const account=result.account,session=issueAccountSession(account),target=loadMetaTarget(account.username,account);',
      '          return json(200,{ok:true,account:publicAccountSnapshot(account,target),session,starterGift:!!result.starterGift,recovered});',
      '        }',
      '        const account=authenticateAccount(body.username,body.password);if(!account)return json(401,{ok:false,message:"Неверный логин или пароль"});',
      '        const session=issueAccountSession(account),target=loadMetaTarget(account.username,account);return json(200,{ok:true,account:publicAccountSnapshot(account,target),session});',
      '      }catch(err){console.error("[AUTH HTTP]",err?.stack||err);return json(500,{ok:false,message:"Ошибка сервера авторизации. Попробуйте ещё раз."});}',
      '    });return;',
      '  }',
      '  let url=requestPath;'
    ].join("\n");
    s=once(s,marker,replacement,"HTTP auth route");
  }

  s+='\n/* DREAD SHIFT full restore 2026-09-13 server */\n';
  W("server.js",s);return true;
}

function patchClient(){
  let s=R("public/client.js");
  if(s.includes("/* DREAD SHIFT full restore 2026-09-13 client */"))return false;

  // Remove native browser confirmation before pet-case opening.
  s=s.replace('  if(!((metaState?.crateTokens||0)>0)&&!confirm("Открыть ящик за 50 золота?"))return;\n','');

  // Smooth companion rendering independently from player snapshot interpolation.
  s=once(s,'const smoothPlayers=new Map(),smoothZombies=new Map();','const smoothPlayers=new Map(),smoothZombies=new Map(),smoothPets=new Map();',"pet smoothing map",false);
  s=s.replaceAll('smoothPlayers.clear();smoothZombies.clear();','smoothPlayers.clear();smoothZombies.clear();smoothPets.clear();');
  s=once(s,
    '  const base=(p.id===myId&&localPred)?{...p,x:localPred.x,y:localPred.y}:smoothEntity(smoothPlayers,p);\n  const wp=petVisualWorldPos(base),s=sc(wp.x,wp.y),img=petImages[petId];',
    '  const base=(p.id===myId&&localPred)?{...p,x:localPred.x,y:localPred.y}:smoothEntity(smoothPlayers,p);\n  const rawWp=petVisualWorldPos(p),prediction=p.id===myId&&localPred?{x:localPred.x-p.x,y:localPred.y-p.y}:{x:0,y:0},desired={x:rawWp.x+prediction.x,y:rawWp.y+prediction.y};\n  let wp=smoothPets.get(p.id);if(!wp){wp={x:desired.x,y:desired.y};smoothPets.set(p.id,wp);}const petGap=Math.hypot(desired.x-wp.x,desired.y-wp.y);\n  if(petGap>650){wp.x=desired.x;wp.y=desired.y;}else{const follow=petGap>220?.28:petGap>90?.18:.11;wp.x+=(desired.x-wp.x)*follow;wp.y+=(desired.y-wp.y)*follow;}\n  const s=sc(wp.x,wp.y),img=petImages[petId];',
    "pet interpolation",false);

  // Generator action buttons stay in viewport and expose the current generator level.
  const coreRe=/function updateCoreActions\(\)\{[\s\S]*?\n\}/;
  if(coreRe.test(s)&&!s.includes('const safeY=Math.max(105,Math.min(innerHeight-158,pos.y+132));')){
    s=s.replace(coreRe,[
      'function updateCoreActions(){',
      '  const el=$("coreActions"),p=myPlayer();if(!el)return;',
      '  const near=!!(state?.started&&p&&state?.core&&Math.hypot(p.x-state.core.x,p.y-state.core.y)<RUN_SHOP_RADIUS);',
      '  el.classList.toggle("hidden",!near);if(!near)return;',
      '  const pos=sc(state.core.x,state.core.y),safeX=Math.max(118,Math.min(innerWidth-118,pos.x)),safeY=Math.max(105,Math.min(innerHeight-158,pos.y+132));',
      '  el.style.left=`${safeX}px`;el.style.top=`${safeY}px`;el.dataset.coreLevel=String(state.core.level||1);',
      '}'
    ].join("\n"));
  }

  // Muzzle flash follows the actual barrel.
  s=once(s,'    const muzzleDist=width*.88;','    const muzzleDist=18+width*.94;',"client muzzle flash",false);

  // Spike info mirrors the restored server behaviour.
  const oldSpikeUi='  if(st.type==="spikes"){\n    const damage=15*power*axolotlMult;\n    return [T(`Урон за срабатывание: ${damage.toFixed(1)}`,`Damage per trigger: ${damage.toFixed(1)}`),T(`Срабатывание: раз в 0.4 сек`,`Trigger: every 0.4 sec`),T(`Эффект: замедление`,`Effect: slow`)];\n  }';
  const newSpikeUi='  if(st.type==="spikes"){\n    const damage=18*power*axolotlMult,limit=[0,25,40,60][Math.max(1,Math.min(3,st.level||1))]||25;\n    const remaining=Math.max(0,Math.ceil(limit*((st.hp||0)/Math.max(1,st.maxHp||1))));\n    return [T(`Урон при входе: ${damage.toFixed(1)}`,`Entry damage: ${damage.toFixed(1)}`),T(`Контактов до поломки: ~${remaining} / ${limit}`,`Contacts before breaking: ~${remaining} / ${limit}`),T(`Зомби проходят сквозь шипы. Повторный вход считается новым контактом.`,`Zombies walk through the spikes. Re-entering counts as a new contact.`)];\n  }';
  s=once(s,oldSpikeUi,newSpikeUi,"spike UI",false);

  // Display cumulative run rewards on death/victory screen.
  const oldDeath='    $("deathStats").innerHTML=`<div><b>${fmt(stats.wave||wave)}</b><span>${T("волна","wave")}</span></div><div><b>${fmt(stats.kills)}</b><span>${T("убито","kills")}</span></div><div><b>${fmt(stats.damage)}</b><span>${T("урона","damage")}</span></div><div><b>${fmt(stats.builds)}</b><span>${T("построено","built")}</span></div><div class="death-weapon-stat"><b>${weaponNames[stats.weapon]||stats.weapon||"—"}</b><span>${T("любимое оружие","favorite weapon")}</span></div>`;';
  const newDeath='    $("deathStats").innerHTML=`<div><b>${fmt(stats.wave||wave)}</b><span>${T("волна","wave")}</span></div><div><b>${fmt(stats.kills)}</b><span>${T("убито","kills")}</span></div><div><b>${fmt(stats.damage)}</b><span>${T("урона","damage")}</span></div><div><b>${fmt(stats.builds)}</b><span>${T("построено","built")}</span></div><div class="death-weapon-stat"><b>${weaponNames[stats.weapon]||stats.weapon||"—"}</b><span>${T("любимое оружие","favorite weapon")}</span></div><div class="death-reward-stat"><b>+${fmt(stats.earnedSilver)} ◉ · +${fmt(stats.earnedGold)} G</b><span>${T(`награда за ${fmt(stats.completedWaves)} пройденных волн`,`reward for ${fmt(stats.completedWaves)} completed waves`)}</span></div>`;';
  s=once(s,oldDeath,newDeath,"death rewards UI",false);

  // HTTP-first auth, with the existing WebSocket channel retained as fallback.
  const oldSendAuth='function sendAuth(type,data={}){if(!connected){$("authStatus").textContent="Сервер ещё не подключён";return;}send(type,data);}';
  if(s.includes(oldSendAuth)){
    const auth=[
      'let authHttpBusy=false;',
      'async function performHttpAuth(type,data={}){',
      '  const statusEl=$("authStatus");if(authHttpBusy)return;authHttpBusy=true;',
      '  try{',
      '    if(statusEl)statusEl.textContent=type==="register"?T("Создаём аккаунт…","Creating account…"):T("Входим…","Signing in…");',
      '    const response=await fetch(`/api/auth/${type}`,{method:"POST",headers:{"Content-Type":"application/json"},cache:"no-store",body:JSON.stringify(data)});',
      '    let payload={};try{payload=await response.json();}catch{}',
      '    if(!response.ok||!payload.ok){const message=payload.message||T("Не удалось выполнить запрос","Request failed");if(statusEl)statusEl.textContent=message;toast(message);return;}',
      '    const token=payload.session?.token;if(token)storageSet(sessionKey,token);',
      '    if(payload.starterGift)toast(T("🎁 Стартовый подарок: +200 серебра и +1 жетон ящика","🎁 Starter gift: +200 silver and +1 crate token"));',
      '    if(ws&&ws.readyState===WebSocket.OPEN&&token)send("resumeSession",{token});else connect();',
      '  }catch(err){if(connected)send(type,data);else connect();}finally{authHttpBusy=false;}',
      '}',
      'function sendAuth(type,data={}){performHttpAuth(type,data);}'
    ].join("\n");
    s=s.replace(oldSendAuth,auth);
  }

  // Password eye buttons are bound after DOM load; safe for both login and registration forms.
  if(!s.includes("data-password-target"))s+='\n;document.querySelectorAll("[data-password-target]").forEach(btn=>btn.addEventListener("click",()=>{const input=$(btn.dataset.passwordTarget);if(!input)return;input.type=input.type==="password"?"text":"password";btn.textContent=input.type==="password"?"👁":"🙈";}));\n';

  s+='\n/* DREAD SHIFT full restore 2026-09-13 client */\n';
  try{new Function(s)}catch(e){throw new Error("restore-full client syntax: "+e.message)}
  W("public/client.js",s);return true;
}

function patchHtml(){
  let s=R("public/index.html");if(s.includes("<!-- DREAD SHIFT full restore 2026-09-13 -->"))return false;
  s=s.replace('<label>Пароль<input id="loginPassword" type="password" maxlength="72" autocomplete="current-password" placeholder="минимум 6 символов"></label>','<label>Пароль<div class="password-field"><input id="loginPassword" type="password" maxlength="72" autocomplete="current-password" placeholder="минимум 6 символов"><button class="password-toggle" data-password-target="loginPassword" type="button" title="Показать пароль">👁</button></div></label>');
  s=s.replace('<label>Пароль<input id="registerPassword" type="password" maxlength="72" autocomplete="new-password" placeholder="минимум 6 символов"></label>','<label>Пароль<div class="password-field"><input id="registerPassword" type="password" maxlength="72" autocomplete="new-password" placeholder="минимум 6 символов"><button class="password-toggle" data-password-target="registerPassword" type="button" title="Показать пароль">👁</button></div></label>');
  s=s.replaceAll("Night Shift Duo","Dread Shift").replaceAll("NIGHT SHIFT DUO","DREAD SHIFT");
  s+='\n<!-- DREAD SHIFT full restore 2026-09-13 -->\n';W("public/index.html",s);return true;
}
function patchCss(){
  let s=R("public/style.css");if(s.includes("/* DREAD SHIFT full restore 2026-09-13 styles */"))return false;
  s+='\n/* DREAD SHIFT full restore 2026-09-13 styles */\n.password-field{display:flex;align-items:center;gap:7px}.password-field input{flex:1;min-width:0}.password-toggle{flex:0 0 40px;height:38px;padding:0;display:grid;place-items:center}.core-actions{margin-top:0}.core-actions::before{content:"GENERATOR · LVL " attr(data-core-level);position:absolute;left:50%;top:-25px;transform:translateX(-50%);white-space:nowrap;padding:4px 8px;border-radius:8px;background:rgba(7,18,15,.88);border:1px solid rgba(90,220,143,.18);color:#9ee4b8;font-size:10px;font-weight:900}.death-reward-stat b{color:#f4d266!important}\n';
  W("public/style.css",s);return true;
}

const changed={server:patchServer(),client:patchClient(),html:patchHtml(),css:patchCss()};
const server=R("server.js"),client=R("public/client.js"),html=R("public/index.html"),css=R("public/style.css");
for(const [ok,label] of [
  [html.includes('id="lobbySideActions"')&&html.includes('id="codesOverlay"'),"INDEX/CODES UI"],
  [server.includes("const DEVELOPER_CODES=")&&server.includes('WELCOME:{display:"Welcome",silver:300,gold:25,crateTokens:1}')&&server.includes('TEST:{display:"TEST",silver:150,gold:10,crateTokens:0}'),"promo codes"],
  [server.includes('index:true'),"index unlock"],
  [server.includes('room.phaseTimer=30;'),"30s prep"],
  [server.includes('requestPath==="/api/auth/register"')&&client.includes('fetch(`/api/auth/${type}`'),"HTTP auth fallback"],
  [server.includes("RUN_MILESTONE_REWARDS")&&client.includes("death-reward-stat"),"run rewards"],
  [server.includes('if(d>.25){const speed=Math.min(245,90+d*.52)'),"smooth pet server"],
  [client.includes("smoothPets=new Map()"),"smooth pet client"],
  [!client.includes('confirm("Открыть ящик за 50 золота?")'),"crate confirm removed"],
  [html.includes('data-password-target="loginPassword"')&&html.includes('data-password-target="registerPassword"'),"password visibility"],
  [css.includes('.core-actions::before{content:"GENERATOR · LVL "'),"generator level label"]
])must(ok,label+" missing");
console.log("DREAD SHIFT full restore applied:",changed);
