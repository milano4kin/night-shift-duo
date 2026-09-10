"use strict";

const fs=require("fs");
const path=require("path");
const file=rel=>path.join(__dirname,rel);
const read=rel=>fs.readFileSync(file(rel),"utf8");
const write=(rel,s)=>fs.writeFileSync(file(rel),s,"utf8");
function must(s,from,to,label){if(!s.includes(from))throw new Error(`v8.5-fixed target missing: ${label}`);return s.replace(from,to);}
function mustRx(s,re,to,label){if(!re.test(s))throw new Error(`v8.5-fixed target missing: ${label}`);return s.replace(re,to);}
function assertHas(s,n,label){if(!s.includes(n))throw new Error(`v8.5-fixed verification failed: ${label}`);}

function patchServer(){
  let s=read("server.js");
  if(s.includes("/* DREAD SHIFT v8.5 fixed server */"))return false;
  s=must(s,'const BUILD_VERSION = "8.4.0";','const BUILD_VERSION = "8.5.0";',"build version");
  s=must(s,'const SNAPSHOT_HZ = 18;','const SNAPSHOT_HZ = 20;',"snapshot rate");
  if(!s.includes('moveVx:Number(p.moveVx)||0')){
    s=must(s,
      'id:p.id,slot:p.slot,name:p.name,character:p.character,x:p.x,y:p.y,r:p.r,speed:p.speed,dir:p.dir,',
      'id:p.id,slot:p.slot,name:p.name,character:p.character,x:p.x,y:p.y,r:p.r,speed:p.speed,dir:p.dir,moveVx:Number(p.moveVx)||0,moveVy:Number(p.moveVy)||0,',
      "velocity snapshot");
  }
  s=must(s,
    '    if(p.burnTime<=0)p.burnDps=0;\n    if(p.downed)continue;',
    '    if(p.burnTime<=0)p.burnDps=0;\n    if(p.downed){p.moveVx=0;p.moveVy=0;continue;}',
    "downed velocity");
  s=must(s,
    '    p.sprinting=wantsSprint&&p.stamina>0;\n    movePlayerWithCollision(room,p,dx,dy,dt);',
    '    p.sprinting=wantsSprint&&p.stamina>0;\n    const moveStartX=p.x,moveStartY=p.y;\n    movePlayerWithCollision(room,p,dx,dy,dt);\n    const moveDt=Math.max(.0001,dt);p.moveVx=(p.x-moveStartX)/moveDt;p.moveVy=(p.y-moveStartY)/moveDt;',
    "actual movement velocity");
  assertHas(s,'const SNAPSHOT_HZ = 20;',"20Hz snapshots");
  assertHas(s,'p.moveVx=(p.x-moveStartX)/moveDt',"movement velocity result");
  s+='\n/* DREAD SHIFT v8.5 fixed server */\n';write("server.js",s);return true;
}

function patchClient(){
  let s=read("public/client.js");
  if(s.includes("/* DREAD SHIFT v8.5 fixed client */"))return false;

  if(!s.includes('lastMoveKeyChangeAt=0')){
    s=must(s,
      'let fpsSampleStart=performance.now(),fpsFrames=0,currentFps=0,currentPing=null,pingJitter=0,lastPingSample=null;',
      'let fpsSampleStart=performance.now(),fpsFrames=0,currentFps=0,currentPing=null,pingJitter=0,lastPingSample=null,lastMoveKeyChangeAt=0;',
      "movement transition state");
  }

  // Send start/stop changes immediately, while keeping a 30 Hz held-input stream.
  if(!s.includes('function sendMovementInputNow()')){
    s=must(s,'addEventListener("keydown",e=>{',[
      'function sendMovementInputNow(){',
      '  if(!joined||!state?.started||isTypingInUi()||gameplayUiBlocked())return;',
      '  const p=myPlayer();if(!p)return;',
      '  const aimBase=localPred||p,aimScreen=sc(aimBase.x,aimBase.y),a=norm(mouse.x-aimScreen.x,mouse.y-aimScreen.y);',
      '  const firing=mouse.down&&!selectedBuild&&activeTool==="gun"&&!p.weaponAmmo?.reloading&&(meleeWeapons.has(p.weapon.type)||(p.weaponAmmo?.mag??1)>0);',
      '  send("input",{up:keys.has("KeyW"),down:keys.has("KeyS"),left:keys.has("KeyA"),right:keys.has("KeyD"),sprint:keys.has("ShiftLeft")||keys.has("ShiftRight"),shoot:firing,ax:a.x,ay:a.y});',
      '}',
      'addEventListener("keydown",e=>{'
    ].join('\n'),"movement helper");
    s=must(s,
      '  keys.add(e.code);\n  if(["KeyW","KeyA","KeyS","KeyD","ShiftLeft","ShiftRight"].includes(e.code))e.preventDefault();',
      '  keys.add(e.code);\n  if(["KeyW","KeyA","KeyS","KeyD","ShiftLeft","ShiftRight"].includes(e.code)){e.preventDefault();if(!e.repeat){lastMoveKeyChangeAt=performance.now();sendMovementInputNow();}}',
      "immediate keydown");
    s=must(s,
      'addEventListener("keyup",e=>{\n  if(isTypingInUi(e.target))return;\n  keys.delete(e.code);\n});',
      'addEventListener("keyup",e=>{\n  if(isTypingInUi(e.target))return;\n  const movementKey=["KeyW","KeyA","KeyS","KeyD","ShiftLeft","ShiftRight"].includes(e.code);\n  keys.delete(e.code);\n  if(movementKey){lastMoveKeyChangeAt=performance.now();sendMovementInputNow();}\n});',
      "immediate keyup");
  }
  s=must(s,'},1000/24);\n\nfunction smoothEntity','},1000/30);\n\nfunction smoothEntity',"30Hz input loop");

  // Remote players: velocity-aware, frame-rate-independent smoothing.
  const smoothRx=/function smoothEntity\(map,e\)\{[\s\S]*?\n\}/;
  s=mustRx(s,smoothRx,[
    'function smoothEntity(map,e){',
    '  const now=performance.now(),isPlayer=map===smoothPlayers;',
    '  let v=map.get(e.id);',
    '  if(!v){v={x:e.x,y:e.y,lastAt:now};map.set(e.id,v);return v;}',
    '  const dt=Math.min(.05,Math.max(0,(now-(v.lastAt||now))/1000));v.lastAt=now;',
    '  const lead=isPlayer?Math.min(.10,Math.max(0,((currentPing||0)+(pingJitter||0)*.25)/2000)):0;',
    '  const tx=e.x+(isPlayer?(Number(e.moveVx)||0)*lead:0),ty=e.y+(isPlayer?(Number(e.moveVy)||0)*lead:0);',
    '  const d=Math.hypot(tx-v.x,ty-v.y);if(d>360){v.x=tx;v.y=ty;return v;}',
    '  const alpha=1-Math.exp(-(isPlayer?24:18)*dt);v.x+=(tx-v.x)*alpha;v.y+=(ty-v.y)*alpha;',
    '  return v;',
    '}'
  ].join('\n'),"smoothEntity");

  // Local player: preserve immediate client prediction. Reconcile only real divergence and never
  // drag the picture toward an old server snapshot on every packet.
  const reconcileRx=/      const mp=state\.players\.find\(p=>p\.id===myId\);\n      if\(mp\)\{[\s\S]*?\n      \}\n      if\(state\.started\)\{/;
  const reconcile=[
    '      const mp=state.players.find(p=>p.id===myId);',
    '      if(mp){',
    '        if(!localPred)localPred={x:mp.x,y:mp.y};',
    '        const moving=keys.has("KeyW")||keys.has("KeyA")||keys.has("KeyS")||keys.has("KeyD");',
    '        const rtt=Math.min(600,Math.max(0,(currentPing||0)+(pingJitter||0)));',
    '        const oneWay=Math.min(.16,Math.max(0,((currentPing||0)+(pingJitter||0)*.25)/2000));',
    '        const sx=mp.x+(Number(mp.moveVx)||0)*oneWay,sy=mp.y+(Number(mp.moveVy)||0)*oneWay;',
    '        const ex=sx-localPred.x,ey=sy-localPred.y,err=Math.hypot(ex,ey);',
    '        const raw=Math.hypot(mp.x-localPred.x,mp.y-localPred.y);',
    '        if(raw>620){localPred.x=mp.x;localPred.y=mp.y;}',
    '        else if(moving){',
    '          const expectedLead=Math.hypot(Number(mp.moveVx)||0,Number(mp.moveVy)||0)*oneWay;',
    '          const dead=Math.max(24,Math.min(72,22+expectedLead*.9));',
    '          if(err>dead){const step=Math.min(10,(err-dead)*.10);if(step>0){localPred.x+=ex/err*step;localPred.y+=ey/err*step;}}',
    '        }else{',
    '          const grace=Math.min(320,90+rtt*1.25);',
    '          if(performance.now()-lastMoveKeyChangeAt>=grace){',
    '            const dx=mp.x-localPred.x,dy=mp.y-localPred.y,d=Math.hypot(dx,dy);',
    '            if(d<5){localPred.x=mp.x;localPred.y=mp.y;}',
    '            else if(d>0){const step=Math.min(34,d*.38);localPred.x+=dx/d*step;localPred.y+=dy/d*step;}',
    '          }',
    '        }',
    '      }',
    '      if(state.started){'
  ].join('\n');
  s=mustRx(s,reconcileRx,reconcile,"snapshot reconciliation block");

  // Camera follows predicted local position directly: no camera tail = no visual ice skating.
  const cameraRx=/function updateCamera\(\)\{[\s\S]*?\n\}/;
  s=mustRx(s,cameraRx,[
    'function updateCamera(){',
    '  const p=myPlayer();if(!p)return;',
    '  const target=(localPred&&p.id===myId)?localPred:smoothEntity(smoothPlayers,p);',
    '  camera.x=clamp(target.x-innerWidth/2,0,Math.max(0,state.world.w-innerWidth));',
    '  camera.y=clamp(target.y-innerHeight/2,0,Math.max(0,state.world.h-innerHeight));',
    '  mouse.wx=mouse.x+camera.x;mouse.wy=mouse.y+camera.y;',
    '}'
  ].join('\n'),"direct camera");

  // The old bare circle was the in-run level. Make it explicit.
  const avatarRx=/function drawHudAvatar\(x,y,size,p,accent='#ffb774'\)\{[^\n]+\}/;
  s=mustRx(s,avatarRx,
    "function drawHudAvatar(x,y,size,p,accent='#ffb774'){ctx.save();ctx.fillStyle='rgba(11,15,18,.95)';ctx.beginPath();ctx.arc(x,y,size/2,0,Math.PI*2);ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='rgba(255,196,128,.32)';ctx.stroke();ctx.fillStyle='#d8aa83';ctx.beginPath();ctx.arc(x,y-size*.12,size*.19,0,Math.PI*2);ctx.fill();ctx.fillStyle='#5b3a2a';ctx.beginPath();ctx.arc(x,y-size*.18,size*.2,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle='#2a3238';ctx.fillRect(x-size*.24,y+size*.02,size*.48,size*.24);ctx.restore();const lvl=Math.max(1,Number(p.level)||1),label=T(`УР ${lvl}`,`LV ${lvl}`);ctx.font='900 8px system-ui';const bw=Math.max(31,ctx.measureText(label).width+10),bh=16,bx=x-size*.43,by=y+size*.27;ctx.fillStyle='rgba(7,11,14,.98)';rr(bx-bw/2,by,bw,bh,8);ctx.fill();ctx.strokeStyle=accent;ctx.lineWidth=1.5;rr(bx-bw/2+.5,by+.5,bw-1,bh-1,8);ctx.stroke();ctx.fillStyle='#f1f5f7';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,bx,by+bh/2+.5);ctx.textBaseline='alphabetic';ctx.textAlign='left';}",
    "level badge");

  assertHas(s,'},1000/30);',"30Hz input result");
  assertHas(s,'function sendMovementInputNow()',"immediate input result");
  assertHas(s,'const expectedLead=',"reconciliation result");
  assertHas(s,'camera.x=clamp(target.x-innerWidth/2',"camera result");
  assertHas(s,'label=T(`УР ${lvl}`,`LV ${lvl}`)',"level label result");
  s+='\n/* DREAD SHIFT v8.5 fixed client */\n';write("public/client.js",s);return true;
}

function patchHtml(){let s=read("public/index.html");if(s.includes("<!-- DREAD SHIFT v8.5 fixed -->"))return false;s=s.replaceAll("V8.4","V8.5").replaceAll("v8.4.0","v8.5.0");s+='\n<!-- DREAD SHIFT v8.5 fixed -->\n';write("public/index.html",s);return true;}

const changed={server:patchServer(),client:patchClient(),html:patchHtml()};
console.log("DREAD SHIFT v8.5 FIXED applied:",JSON.stringify(changed));