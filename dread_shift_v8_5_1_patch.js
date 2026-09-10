"use strict";

const fs=require("fs");
const path=require("path");
const file=rel=>path.join(__dirname,rel);
const read=rel=>fs.readFileSync(file(rel),"utf8");
const write=(rel,s)=>fs.writeFileSync(file(rel),s,"utf8");

function required(s,from,to,label){
  if(!s.includes(from))throw new Error(`v8.5.1 target missing: ${label}`);
  return s.replace(from,to);
}
function assertHas(s,needle,label){if(!s.includes(needle))throw new Error(`v8.5.1 verification failed: ${label}`);}

function patchServer(){
  let s=read("server.js");
  if(s.includes("/* DREAD SHIFT v8.5.1 server */"))return false;
  s=required(s,'const BUILD_VERSION = "8.4.0";','const BUILD_VERSION = "8.5.1";',"build version");
  s=required(s,
    'id:p.id,slot:p.slot,name:p.name,character:p.character,x:p.x,y:p.y,r:p.r,speed:p.speed,dir:p.dir,',
    'id:p.id,slot:p.slot,name:p.name,character:p.character,x:p.x,y:p.y,r:p.r,speed:p.speed,dir:p.dir,moveVx:Number(p.moveVx)||0,moveVy:Number(p.moveVy)||0,',
    "authoritative velocity snapshot"
  );
  s=required(s,
    '    p.sprinting=wantsSprint&&p.stamina>0;\n    movePlayerWithCollision(room,p,dx,dy,dt);',
    '    p.sprinting=wantsSprint&&p.stamina>0;\n    const moveStartX=p.x,moveStartY=p.y;\n    movePlayerWithCollision(room,p,dx,dy,dt);\n    const moveDt=Math.max(.0001,dt);p.moveVx=(p.x-moveStartX)/moveDt;p.moveVy=(p.y-moveStartY)/moveDt;',
    "actual post-collision velocity"
  );
  assertHas(s,'const SNAPSHOT_HZ = 18;',"stable snapshot cadence retained");
  assertHas(s,'p.moveVx=(p.x-moveStartX)/moveDt',"velocity result");
  s+='\n/* DREAD SHIFT v8.5.1 server */\n';
  write("server.js",s);return true;
}

function patchClient(){
  let s=read("public/client.js");
  if(s.includes("/* DREAD SHIFT v8.5.1 client */"))return false;
  s=required(s,
    'let fpsSampleStart=performance.now(),fpsFrames=0,currentFps=0,currentPing=null,pingJitter=0,lastPingSample=null;',
    'let fpsSampleStart=performance.now(),fpsFrames=0,currentFps=0,currentPing=null,pingJitter=0,lastPingSample=null,lastMoveInputAt=0;',
    "movement transition timestamp"
  );
  s=required(s,'\naddEventListener("keydown",e=>{',[
    '',
    'function sendMovementInputNow(){',
    '  if(!joined||!state?.started||isTypingInUi()||gameplayUiBlocked())return;',
    '  const p=myPlayer();if(!p)return;',
    '  mouse.wx=mouse.x+camera.x;mouse.wy=mouse.y+camera.y;',
    '  const aimBase=localPred||p,aimScreen=sc(aimBase.x,aimBase.y),a=norm(mouse.x-aimScreen.x,mouse.y-aimScreen.y);',
    '  const firing=mouse.down&&!selectedBuild&&activeTool==="gun"&&!p.weaponAmmo?.reloading&&(meleeWeapons.has(p.weapon.type)||(p.weaponAmmo?.mag??1)>0);',
    '  send("input",{up:keys.has("KeyW"),down:keys.has("KeyS"),left:keys.has("KeyA"),right:keys.has("KeyD"),sprint:keys.has("ShiftLeft")||keys.has("ShiftRight"),shoot:firing,ax:a.x,ay:a.y});',
    '}',
    'addEventListener("keydown",e=>{'
  ].join('\n'),"immediate movement sender");
  s=required(s,
    '  keys.add(e.code);\n  if(["KeyW","KeyA","KeyS","KeyD","ShiftLeft","ShiftRight"].includes(e.code))e.preventDefault();',
    '  keys.add(e.code);\n  if(["KeyW","KeyA","KeyS","KeyD","ShiftLeft","ShiftRight"].includes(e.code)){e.preventDefault();if(!e.repeat){lastMoveInputAt=performance.now();sendMovementInputNow();}}',
    "immediate keydown"
  );
  s=required(s,
    'addEventListener("keyup",e=>{\n  if(isTypingInUi(e.target))return;\n  keys.delete(e.code);\n});',
    'addEventListener("keyup",e=>{\n  if(isTypingInUi(e.target))return;\n  const movementKey=["KeyW","KeyA","KeyS","KeyD","ShiftLeft","ShiftRight"].includes(e.code);\n  keys.delete(e.code);\n  if(movementKey){lastMoveInputAt=performance.now();sendMovementInputNow();}\n});',
    "immediate keyup"
  );
  s=required(s,'},1000/24);\n\nfunction smoothEntity','},1000/30);\n\nfunction smoothEntity',"30 Hz held input");
  s=required(s,[
    'function smoothEntity(map,e){',
    '  let s=map.get(e.id);',
    '  if(!s){s={x:e.x,y:e.y};map.set(e.id,s)}',
    '  s.x+=(e.x-s.x)*.32;s.y+=(e.y-s.y)*.32;',
    '  return s;',
    '}'
  ].join('\n'),[
    'function smoothEntity(map,e){',
    '  const now=performance.now(),player=map===smoothPlayers;',
    '  let s=map.get(e.id);',
    '  if(!s){s={x:e.x,y:e.y,at:now};map.set(e.id,s);return s;}',
    '  const dt=Math.min(.05,Math.max(0,(now-(s.at||now))/1000));s.at=now;',
    '  const lead=player?Math.min(.085,Math.max(0,((currentPing||0)+(pingJitter||0)*.25)/2000)):0;',
    '  const tx=e.x+(player?(Number(e.moveVx)||0)*lead:0),ty=e.y+(player?(Number(e.moveVy)||0)*lead:0);',
    '  const distance=Math.hypot(tx-s.x,ty-s.y);',
    '  if(distance>420){s.x=tx;s.y=ty;return s;}',
    '  const alpha=1-Math.exp(-(player?22:18)*dt);s.x+=(tx-s.x)*alpha;s.y+=(ty-s.y)*alpha;',
    '  return s;',
    '}'
  ].join('\n'),"frame-rate independent remote interpolation");

  const oldReconcile=[
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
    '        const hardSnap=err>640;',
    '        if(hardSnap){localPred.x=mp.x;localPred.y=mp.y;}',
    '        else if(!moving&&performance.now()-lastMoveInputAt>Math.min(300,80+netDelay)){',
    '          const step=err<4?err:Math.min(28,Math.max(0,err-2)*.28);',
    '          if(err>.001){localPred.x+=(mp.x-localPred.x)/err*step;localPred.y+=(mp.y-localPred.y)/err*step;}',
    '        }else if(moving&&err>96){',
    '          const step=Math.min(8,(err-96)*.08);',
    '          if(err>.001){localPred.x+=(mp.x-localPred.x)/err*step;localPred.y+=(mp.y-localPred.y)/err*step;}',
    '        }'
  ].join('\n');
  s=required(s,oldReconcile,newReconcile,"rare local reconciliation");
  s=required(s,
    '  camera.x+=(tx-camera.x)*.18;camera.y+=(ty-camera.y)*.18;',
    '  camera.x=tx;camera.y=ty;',
    "camera follows local prediction"
  );
  const oldAvatar=/function drawHudAvatar\(x,y,size,p,accent='#ffb774'\)\{[^\n]+\}/;
  if(!oldAvatar.test(s))throw new Error("v8.5.1 target missing: level badge");
  s=s.replace(oldAvatar,"function drawHudAvatar(x,y,size,p,accent='#ffb774'){ctx.save();ctx.fillStyle='rgba(11,15,18,.95)';ctx.beginPath();ctx.arc(x,y,size/2,0,Math.PI*2);ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='rgba(255,196,128,.32)';ctx.stroke();ctx.fillStyle='#d8aa83';ctx.beginPath();ctx.arc(x,y-size*.12,size*.19,0,Math.PI*2);ctx.fill();ctx.fillStyle='#5b3a2a';ctx.beginPath();ctx.arc(x,y-size*.18,size*.2,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle='#2a3238';ctx.fillRect(x-size*.24,y+size*.02,size*.48,size*.24);ctx.restore();const lvl=Math.max(1,Number(p.level)||1),label=T(`УР ${lvl}`,`LV ${lvl}`);ctx.font='900 8px system-ui';const bw=Math.max(31,ctx.measureText(label).width+10),bh=16,bx=x-size*.43,by=y+size*.27;ctx.fillStyle='rgba(7,11,14,.98)';rr(bx-bw/2,by,bw,bh,8);ctx.fill();ctx.strokeStyle=accent;ctx.lineWidth=1.5;rr(bx-bw/2+.5,by+.5,bw-1,bh-1,8);ctx.stroke();ctx.fillStyle='#f1f5f7';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,bx,by+bh/2+.5);ctx.textBaseline='alphabetic';ctx.textAlign='left';}");
  assertHas(s,'function sendMovementInputNow()',"movement sender result");
  assertHas(s,'},1000/30);',"input cadence result");
  assertHas(s,'camera.x=tx;camera.y=ty;',"camera result");
  assertHas(s,'label=T(`УР ${lvl}`,`LV ${lvl}`)',"level label result");
  s+='\n/* DREAD SHIFT v8.5.1 client */\n';
  write("public/client.js",s);return true;
}

function patchHtml(){
  let s=read("public/index.html");
  if(s.includes("<!-- DREAD SHIFT v8.5.1 -->"))return false;
  s=s.replaceAll("V8.4","V8.5.1").replaceAll("v8.4.0","v8.5.1");
  s+='\n<!-- DREAD SHIFT v8.5.1 -->\n';write("public/index.html",s);return true;
}

const changed={server:patchServer(),client:patchClient(),html:patchHtml()};
console.log("DREAD SHIFT v8.5.1 applied:",JSON.stringify(changed));
