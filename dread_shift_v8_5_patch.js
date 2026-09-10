"use strict";

const fs=require("fs");
const path=require("path");
const file=rel=>path.join(__dirname,rel);
const read=rel=>fs.readFileSync(file(rel),"utf8");
const write=(rel,s)=>fs.writeFileSync(file(rel),s,"utf8");

function required(s,from,to,label){
  if(!s.includes(from))throw new Error(`v8.5 target missing: ${label}`);
  return s.replace(from,to);
}
function assertHas(s,needle,label){if(!s.includes(needle))throw new Error(`v8.5 verification failed: ${label}`);}

function patchServer(){
  let s=read("server.js");
  if(s.includes("/* DREAD SHIFT v8.5 server */"))return false;

  s=required(s,'const BUILD_VERSION = "8.4.0";','const BUILD_VERSION = "8.5.0";',"build version");
  s=required(s,'const SNAPSHOT_HZ = 18;','const SNAPSHOT_HZ = 20;',"snapshot rate");

  // Give clients the ACTUAL post-collision movement velocity. Remote players can then be
  // rendered smoothly between snapshots without extrapolating through walls.
  s=required(s,
    '    id:p.id,slot:p.slot,name:p.name,character:p.character,x:p.x,y:p.y,r:p.r,speed:p.speed,dir:p.dir,',
    '    id:p.id,slot:p.slot,name:p.name,character:p.character,x:p.x,y:p.y,r:p.r,speed:p.speed,dir:p.dir,moveVx:Number(p.moveVx)||0,moveVy:Number(p.moveVy)||0,',
    "player movement velocity snapshot"
  );

  s=required(s,
    '    if(p.burnTime<=0)p.burnDps=0;\n    if(p.downed)continue;',
    '    if(p.burnTime<=0)p.burnDps=0;\n    if(p.downed){p.moveVx=0;p.moveVy=0;continue;}',
    "clear velocity while downed"
  );

  s=required(s,
    '    p.sprinting=wantsSprint&&p.stamina>0;\n    movePlayerWithCollision(room,p,dx,dy,dt);',
    '    p.sprinting=wantsSprint&&p.stamina>0;\n    const moveStartX=p.x,moveStartY=p.y;\n    movePlayerWithCollision(room,p,dx,dy,dt);\n    const moveDt=Math.max(.0001,dt);p.moveVx=(p.x-moveStartX)/moveDt;p.moveVy=(p.y-moveStartY)/moveDt;',
    "authoritative movement velocity"
  );

  assertHas(s,'const SNAPSHOT_HZ = 20;',"20 Hz snapshots");
  assertHas(s,'moveVx:Number(p.moveVx)||0',"velocity in safePlayer");
  assertHas(s,'p.moveVx=(p.x-moveStartX)/moveDt',"actual velocity calculation");
  s+='\n/* DREAD SHIFT v8.5 server */\n';
  write("server.js",s);return true;
}

function patchClient(){
  let s=read("public/client.js");
  if(s.includes("/* DREAD SHIFT v8.5 client */"))return false;

  // Keep track of the last movement transition so key-up never produces a visible slide while
  // the server is still receiving the final input packet.
  s=required(s,
    'let fpsSampleStart=performance.now(),fpsFrames=0,currentFps=0,currentPing=null,pingJitter=0,lastPingSample=null;',
    'let fpsSampleStart=performance.now(),fpsFrames=0,currentFps=0,currentPing=null,pingJitter=0,lastPingSample=null,lastMoveKeyChangeAt=0;',
    "movement transition timestamp"
  );

  // Replace frame-rate-dependent target easing with velocity-aware interpolation for remote players.
  const oldSmooth=[
    'function smoothEntity(map,e){',
    '  let s=map.get(e.id);',
    '  if(!s){s={x:e.x,y:e.y};map.set(e.id,s)}',
    '  s.x+=(e.x-s.x)*.32;s.y+=(e.y-s.y)*.32;',
    '  return s;',
    '}'
  ].join('\n');
  const newSmooth=[
    'function smoothEntity(map,e){',
    '  const now=performance.now(),isPlayer=map===smoothPlayers;',
    '  let s=map.get(e.id);',
    '  if(!s){s={x:e.x,y:e.y,lastAt:now};map.set(e.id,s);return s;}',
    '  const dt=Math.min(.05,Math.max(0,(now-(s.lastAt||now))/1000));s.lastAt=now;',
    '  // A snapshot is roughly one network leg old when it arrives. For another player,',
    '  // project only by that measured one-way delay using the actual velocity supplied by the server.',
    '  const lead=isPlayer?Math.min(.12,Math.max(0,((currentPing||0)+(pingJitter||0)*.35)/2000)):0;',
    '  const tx=e.x+(isPlayer?(Number(e.moveVx)||0)*lead:0),ty=e.y+(isPlayer?(Number(e.moveVy)||0)*lead:0);',
    '  const dist=Math.hypot(tx-s.x,ty-s.y);',
    '  if(dist>420){s.x=tx;s.y=ty;return s;}',
    '  if(dt>0){const response=isPlayer?26:18,alpha=1-Math.exp(-response*dt);s.x+=(tx-s.x)*alpha;s.y+=(ty-s.y)*alpha;}',
    '  return s;',
    '}'
  ].join('\n');
  s=required(s,oldSmooth,newSmooth,"remote player interpolation");

  // Immediate movement packets on key transitions. The 30 Hz stream below remains for held keys,
  // aim and shooting, but starting/stopping no longer waits for the next interval tick.
  const keydownMarker='addEventListener("keydown",e=>{';
  const movementHelper=[
    'function sendMovementInputNow(){',
    '  if(!joined||!state?.started||isTypingInUi()||gameplayUiBlocked())return;',
    '  const p=myPlayer();if(!p)return;',
    '  const aimBase=localPred||p,aimScreen=sc(aimBase.x,aimBase.y),a=norm(mouse.x-aimScreen.x,mouse.y-aimScreen.y);',
    '  const firing=mouse.down&&!selectedBuild&&activeTool==="gun"&&!p.weaponAmmo?.reloading&&(meleeWeapons.has(p.weapon.type)||(p.weaponAmmo?.mag??1)>0);',
    '  send("input",{up:keys.has("KeyW"),down:keys.has("KeyS"),left:keys.has("KeyA"),right:keys.has("KeyD"),sprint:keys.has("ShiftLeft")||keys.has("ShiftRight"),shoot:firing,ax:a.x,ay:a.y});',
    '}',
    keydownMarker
  ].join('\n');
  s=required(s,keydownMarker,movementHelper,"immediate movement helper");

  s=required(s,
    '  keys.add(e.code);\n  if(["KeyW","KeyA","KeyS","KeyD","ShiftLeft","ShiftRight"].includes(e.code))e.preventDefault();',
    '  keys.add(e.code);\n  if(["KeyW","KeyA","KeyS","KeyD","ShiftLeft","ShiftRight"].includes(e.code)){e.preventDefault();if(!e.repeat){lastMoveKeyChangeAt=performance.now();sendMovementInputNow();}}',
    "keydown immediate input"
  );
  s=required(s,
    'addEventListener("keyup",e=>{\n  if(isTypingInUi(e.target))return;\n  keys.delete(e.code);\n});',
    'addEventListener("keyup",e=>{\n  if(isTypingInUi(e.target))return;\n  const movementKey=["KeyW","KeyA","KeyS","KeyD","ShiftLeft","ShiftRight"].includes(e.code);\n  keys.delete(e.code);\n  if(movementKey){lastMoveKeyChangeAt=performance.now();sendMovementInputNow();}\n});',
    "keyup immediate input"
  );

  // Held input now matches the 30 Hz simulation tick more closely.
  s=required(s,'},1000/24);','},1000/30);',"30 Hz input stream");

  // Old v8.4 reconciliation continuously pulled the local player toward an already stale snapshot.
  // New reconciliation compares against a server position projected to the current moment, leaves a
  // prediction dead-zone while moving, and settles only after the key-up packet has had time to arrive.
  const oldReconcile=[
    '        const err=Math.hypot(localPred.x-mp.x,localPred.y-mp.y);',
    '        const moving=keys.has("KeyW")||keys.has("KeyA")||keys.has("KeyS")||keys.has("KeyD");',
    '        const netDelay=Math.min(600,Math.max(0,(currentPing||0)+(pingJitter||0)));',
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
  const newReconcile=[
    '        const moving=keys.has("KeyW")||keys.has("KeyA")||keys.has("KeyS")||keys.has("KeyD");',
    '        const netDelay=Math.min(600,Math.max(0,(currentPing||0)+(pingJitter||0)));',
    '        const oneWay=Math.min(.18,Math.max(0,((currentPing||0)+(pingJitter||0)*.35)/2000));',
    '        const serverNowX=mp.x+(Number(mp.moveVx)||0)*oneWay,serverNowY=mp.y+(Number(mp.moveVy)||0)*oneWay;',
    '        const ex=serverNowX-localPred.x,ey=serverNowY-localPred.y,err=Math.hypot(ex,ey);',
    '        const rawErr=Math.hypot(localPred.x-mp.x,localPred.y-mp.y);',
    '        if(rawErr>650){localPred.x=mp.x;localPred.y=mp.y;}',
    '        else if(moving){',
    '          // Normal prediction is intentionally a little ahead of the authoritative server.',
    '          // Do not fight that expected lead; only correct meaningful divergence.',
    '          const serverSpeed=Math.hypot(Number(mp.moveVx)||0,Number(mp.moveVy)||0);',
    '          const deadZone=Math.max(18,Math.min(58,16+serverSpeed*oneWay*.75));',
    '          if(err>deadZone){const step=Math.min(16,(err-deadZone)*.18);if(step>0){localPred.x+=ex/err*step;localPred.y+=ey/err*step;}}',
    '        }else{',
    '          // Hold the local image still just after key-up. This removes the visible "ice" tail.',
    '          const stopGrace=Math.min(280,70+netDelay*1.15);',
    '          if(performance.now()-lastMoveKeyChangeAt>=stopGrace){',
    '            const sx=mp.x-localPred.x,sy=mp.y-localPred.y,se=Math.hypot(sx,sy);',
    '            if(se<7){localPred.x=mp.x;localPred.y=mp.y;}',
    '            else if(se>0){const step=Math.min(48,se*.55);localPred.x+=sx/se*step;localPred.y+=sy/se*step;}',
    '          }',
    '        }'
  ].join('\n');
  s=required(s,oldReconcile,newReconcile,"non-sliding local reconciliation");

  // Top-down camera follows the predicted local player directly. The old 0.18 chase was a second,
  // independent source of apparent inertia even after the player had already stopped.
  const oldCamera=[
    'function updateCamera(){',
    '  const p=myPlayer();if(!p)return;',
    '  const target=(localPred&&p.id===myId)?localPred:smoothEntity(smoothPlayers,p);',
    '  const tx=clamp(target.x-innerWidth/2,0,Math.max(0,state.world.w-innerWidth));',
    '  const ty=clamp(target.y-innerHeight/2,0,Math.max(0,state.world.h-innerHeight));',
    '  camera.x+=(tx-camera.x)*.18;camera.y+=(ty-camera.y)*.18;',
    '  mouse.wx=mouse.x+camera.x;mouse.wy=mouse.y+camera.y;',
    '}'
  ].join('\n');
  const newCamera=[
    'function updateCamera(){',
    '  const p=myPlayer();if(!p)return;',
    '  const target=(localPred&&p.id===myId)?localPred:smoothEntity(smoothPlayers,p);',
    '  const tx=clamp(target.x-innerWidth/2,0,Math.max(0,state.world.w-innerWidth));',
    '  const ty=clamp(target.y-innerHeight/2,0,Math.max(0,state.world.h-innerHeight));',
    '  camera.x=tx;camera.y=ty;',
    '  mouse.wx=mouse.x+camera.x;mouse.wy=mouse.y+camera.y;',
    '}'
  ].join('\n');
  s=required(s,oldCamera,newCamera,"direct local camera");

  // The tiny bare number on the portrait is the in-run character level. Label it explicitly.
  const oldAvatar="function drawHudAvatar(x,y,size,p,accent='#ffb774'){ctx.save();ctx.fillStyle='rgba(11,15,18,.95)';ctx.beginPath();ctx.arc(x,y,size/2,0,Math.PI*2);ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='rgba(255,196,128,.32)';ctx.stroke();ctx.fillStyle='#d8aa83';ctx.beginPath();ctx.arc(x,y-size*.12,size*.19,0,Math.PI*2);ctx.fill();ctx.fillStyle='#5b3a2a';ctx.beginPath();ctx.arc(x,y-size*.18,size*.2,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle='#2a3238';ctx.fillRect(x-size*.24,y+size*.02,size*.48,size*.24);ctx.restore();const lvl=(p.level||1);ctx.fillStyle='rgba(7,11,14,.98)';ctx.beginPath();ctx.arc(x-size*.42,y+size*.42,size*.18,0,Math.PI*2);ctx.fill();ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#f1f5f7';ctx.font='900 11px system-ui';ctx.textAlign='center';ctx.fillText(String(lvl),x-size*.42,y+size*.46);ctx.textAlign='left';}";
  const newAvatar="function drawHudAvatar(x,y,size,p,accent='#ffb774'){ctx.save();ctx.fillStyle='rgba(11,15,18,.95)';ctx.beginPath();ctx.arc(x,y,size/2,0,Math.PI*2);ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='rgba(255,196,128,.32)';ctx.stroke();ctx.fillStyle='#d8aa83';ctx.beginPath();ctx.arc(x,y-size*.12,size*.19,0,Math.PI*2);ctx.fill();ctx.fillStyle='#5b3a2a';ctx.beginPath();ctx.arc(x,y-size*.18,size*.2,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle='#2a3238';ctx.fillRect(x-size*.24,y+size*.02,size*.48,size*.24);ctx.restore();const lvl=Math.max(1,Number(p.level)||1),label=T(`УР ${lvl}`,`LV ${lvl}`);ctx.font='900 8px system-ui';const bw=Math.max(31,ctx.measureText(label).width+10),bh=16,bx=x-size*.43,by=y+size*.27;ctx.fillStyle='rgba(7,11,14,.98)';rr(bx-bw/2,by,bw,bh,8);ctx.fill();ctx.strokeStyle=accent;ctx.lineWidth=1.5;rr(bx-bw/2+.5,by+.5,bw-1,bh-1,8);ctx.stroke();ctx.fillStyle='#f1f5f7';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,bx,by+bh/2+.5);ctx.textBaseline='alphabetic';ctx.textAlign='left';}";
  s=required(s,oldAvatar,newAvatar,"clear in-run level badge");

  assertHas(s,'},1000/30);',"30 Hz input result");
  assertHas(s,'function sendMovementInputNow()',"immediate movement packets");
  assertHas(s,'serverNowX=mp.x+(Number(mp.moveVx)||0)*oneWay',"projected reconciliation");
  assertHas(s,'camera.x=tx;camera.y=ty;',"camera no-drift");
  assertHas(s,'label=T(`УР ${lvl}`,`LV ${lvl}`)',"level label");
  s+='\n/* DREAD SHIFT v8.5 client */\n';
  write("public/client.js",s);return true;
}

function patchHtml(){
  let s=read("public/index.html");
  if(s.includes("<!-- DREAD SHIFT v8.5 html -->"))return false;
  s=s.replaceAll("V8.4","V8.5").replaceAll("v8.4.0","v8.5.0");
  s+='\n<!-- DREAD SHIFT v8.5 html -->\n';
  write("public/index.html",s);return true;
}

const changed={server:patchServer(),client:patchClient(),html:patchHtml()};
console.log("DREAD SHIFT v8.5 movement patch applied:",JSON.stringify(changed));
