"use strict";
const fs=require("node:fs"),path=require("node:path");
const F=r=>path.join(__dirname,r),R=r=>fs.readFileSync(F(r),"utf8"),W=(r,s)=>fs.writeFileSync(F(r),s,"utf8");
function must(value,message){if(!value)throw new Error("v8.9.5: "+message)}
function replaceOnce(source,from,to,label){must(source.includes(from),"target missing: "+label);return source.replace(from,to)}

function patchServer(){
  let s=R("server.js");if(s.includes("/* DREAD SHIFT v8.9.5 server */"))return false;
  s=replaceOnce(s,'const BUILD_VERSION = "8.9.4";','const BUILD_VERSION = "8.9.5";',"server version");
  s=replaceOnce(s,"const SNAPSHOT_HZ = 15;","const SNAPSHOT_HZ = 18;","snapshot cadence");
  s=replaceOnce(s,
    "id:p.id,slot:p.slot,name:p.name,character:p.character,x:p.x,y:p.y,r:p.r,speed:p.speed,dir:p.dir,",
    "id:p.id,slot:p.slot,name:p.name,character:p.character,x:p.x,y:p.y,r:p.r,speed:p.speed,dir:p.dir,moveVx:Number(p.moveVx)||0,moveVy:Number(p.moveVy)||0,",
    "authoritative velocity snapshot"
  );
  s=replaceOnce(s,
    "    p.sprinting=wantsSprint&&p.stamina>0;\n    movePlayerWithCollision(room,p,dx,dy,dt);",
    "    p.sprinting=wantsSprint&&p.stamina>0;\n    const moveStartX=p.x,moveStartY=p.y;\n    movePlayerWithCollision(room,p,dx,dy,dt);\n    const moveDt=Math.max(.0001,dt);p.moveVx=(p.x-moveStartX)/moveDt;p.moveVy=(p.y-moveStartY)/moveDt;",
    "post-collision velocity"
  );
  s=replaceOnce(s,
    '      for(const p of room.players.values())send(p.ws,"snapshot",{state:serializeFor(room,p)});',
    '      for(const p of room.players.values()){\n        // Drop stale world frames instead of queueing visible rubber-banding behind a slow socket.\n        if((p.ws.bufferedAmount||0)>128*1024)continue;\n        send(p.ws,"snapshot",{state:serializeFor(room,p)});\n      }',
    "snapshot backpressure"
  );
  s+='\n/* DREAD SHIFT v8.9.5 server */\n';W("server.js",s);return true;
}

function patchClient(){
  let s=R("public/client.js");if(s.includes("/* DREAD SHIFT v8.9.5 client */"))return false;
  s=replaceOnce(s,
    "let fpsSampleStart=performance.now(),fpsFrames=0,currentFps=0,currentPing=null;",
    "let fpsSampleStart=performance.now(),fpsFrames=0,currentFps=0,currentPing=null,pingJitter=0,lastPingSample=null,lastMoveInputAt=0;",
    "movement network state"
  );
  s=replaceOnce(s,
    '    if(m.type==="clientPong"){currentPing=Math.max(0,Date.now()-(Number(m.sentAt)||Date.now()));return;}',
    '    if(m.type==="clientPong"){const sample=Math.max(0,Date.now()-(Number(m.sentAt)||Date.now()));if(lastPingSample!=null)pingJitter=pingJitter*.8+Math.abs(sample-lastPingSample)*.2;currentPing=currentPing==null?sample:Math.round(currentPing*.8+sample*.2);lastPingSample=sample;return;}',
    "smoothed ping"
  );
  s=replaceOnce(s,
    "function stopGameInput(){",
    [
      "function selectionAllowedTarget(target){",
      "  return !!target?.closest?.('input, textarea, [contenteditable]:not([contenteditable=\"false\"])');",
      "}",
      'document.addEventListener("selectstart",e=>{if(!selectionAllowedTarget(e.target))e.preventDefault();});',
      'document.addEventListener("dragstart",e=>{if(!selectionAllowedTarget(e.target))e.preventDefault();});',
      "",
      "function stopGameInput(){"
    ].join("\n"),
    "selection and drag guard"
  );
  s=replaceOnce(s,"\naddEventListener(\"keydown\",e=>{",[
    "",
    "function sendMovementInputNow(){",
    "  if(!joined||!state?.started||isTypingInUi()||gameplayUiBlocked())return;",
    "  const p=myPlayer();if(!p)return;",
    "  mouse.wx=mouse.x+camera.x;mouse.wy=mouse.y+camera.y;",
    '  const aimBase=localPred||p,aimScreen=sc(aimBase.x,aimBase.y),a=norm(mouse.x-aimScreen.x,mouse.y-aimScreen.y);',
    '  const firing=mouse.down&&!selectedBuild&&activeTool==="gun"&&!p.weaponAmmo?.reloading&&(meleeWeapons.has(p.weapon.type)||(p.weaponAmmo?.mag??1)>0);',
    '  send("input",{up:keys.has("KeyW"),down:keys.has("KeyS"),left:keys.has("KeyA"),right:keys.has("KeyD"),sprint:keys.has("ShiftLeft")||keys.has("ShiftRight"),shoot:firing,ax:a.x,ay:a.y});',
    "}",
    'addEventListener("keydown",e=>{'
  ].join("\n"),"immediate movement sender");
  s=replaceOnce(s,
    '  keys.add(e.code);\n  if(["KeyW","KeyA","KeyS","KeyD","ShiftLeft","ShiftRight"].includes(e.code))e.preventDefault();',
    '  keys.add(e.code);\n  if(["KeyW","KeyA","KeyS","KeyD","ShiftLeft","ShiftRight"].includes(e.code)){e.preventDefault();if(!e.repeat){lastMoveInputAt=performance.now();sendMovementInputNow();}}',
    "immediate keydown"
  );
  s=replaceOnce(s,
    'addEventListener("keyup",e=>{\n  if(isTypingInUi(e.target))return;\n  keys.delete(e.code);\n});',
    'addEventListener("keyup",e=>{\n  if(isTypingInUi(e.target))return;\n  const movementKey=["KeyW","KeyA","KeyS","KeyD","ShiftLeft","ShiftRight"].includes(e.code);\n  keys.delete(e.code);\n  if(movementKey){lastMoveInputAt=performance.now();sendMovementInputNow();}\n});',
    "immediate keyup"
  );
  s=replaceOnce(s,"},1000/24);\n\nfunction smoothEntity","},1000/30);\n\nfunction smoothEntity","input cadence");
  s=replaceOnce(s,[
    "function smoothEntity(map,e){",
    "  let s=map.get(e.id);",
    "  if(!s){s={x:e.x,y:e.y};map.set(e.id,s)}",
    "  s.x+=(e.x-s.x)*.32;s.y+=(e.y-s.y)*.32;",
    "  return s;",
    "}"
  ].join("\n"),[
    "function smoothEntity(map,e){",
    "  const now=performance.now(),player=map===smoothPlayers;",
    "  let s=map.get(e.id);",
    "  if(!s){s={x:e.x,y:e.y,at:now};map.set(e.id,s);return s;}",
    "  const dt=Math.min(.05,Math.max(0,(now-(s.at||now))/1000));s.at=now;",
    "  const lead=player?Math.min(.085,Math.max(0,((currentPing||0)+(pingJitter||0)*.25)/2000)):0;",
    "  const tx=e.x+(player?(Number(e.moveVx)||0)*lead:0),ty=e.y+(player?(Number(e.moveVy)||0)*lead:0);",
    "  const distance=Math.hypot(tx-s.x,ty-s.y);",
    "  if(distance>420){s.x=tx;s.y=ty;return s;}",
    "  const alpha=1-Math.exp(-(player?22:18)*dt);s.x+=(tx-s.x)*alpha;s.y+=(ty-s.y)*alpha;",
    "  return s;",
    "}"
  ].join("\n"),"frame-rate independent interpolation");
  s=replaceOnce(s,[
    "        const correction=err>140?1:.18;",
    "        localPred.x+=(mp.x-localPred.x)*correction;",
    "        localPred.y+=(mp.y-localPred.y)*correction;"
  ].join("\n"),[
    '        const moving=keys.has("KeyW")||keys.has("KeyA")||keys.has("KeyS")||keys.has("KeyD");',
    "        const netDelay=Math.min(600,Math.max(0,(currentPing||0)+(pingJitter||0)));",
    "        const hardSnap=err>640;",
    "        if(hardSnap){localPred.x=mp.x;localPred.y=mp.y;}",
    "        else if(!moving&&performance.now()-lastMoveInputAt>Math.min(300,80+netDelay)){",
    "          const step=err<4?err:Math.min(28,Math.max(0,err-2)*.28);",
    "          if(err>.001){localPred.x+=(mp.x-localPred.x)/err*step;localPred.y+=(mp.y-localPred.y)/err*step;}",
    "        }else if(moving&&err>96){",
    "          const step=Math.min(8,(err-96)*.08);",
    "          if(err>.001){localPred.x+=(mp.x-localPred.x)/err*step;localPred.y+=(mp.y-localPred.y)/err*step;}",
    "        }"
  ].join("\n"),"non-jarring local reconciliation");
  s=replaceOnce(s,
    "  camera.x+=(tx-camera.x)*.18;camera.y+=(ty-camera.y)*.18;",
    "  camera.x=tx;camera.y=ty;",
    "camera follows local prediction"
  );
  s+='\n/* DREAD SHIFT v8.9.5 client */\n';
  try{new Function(s)}catch(err){throw new Error("v8.9.5 client syntax: "+err.message)}
  W("public/client.js",s);return true;
}

function patchHtml(){let s=R("public/index.html");if(s.includes("<!-- DREAD SHIFT v8.9.5 -->"))return false;s=s.replaceAll("V8.9.4","V8.9.5").replaceAll("v8.9.4","v8.9.5");s+='\n<!-- DREAD SHIFT v8.9.5 -->\n';W("public/index.html",s);return true;}
function patchCss(){
  let s=R("public/style.css");if(s.includes("/* DREAD SHIFT v8.9.5 interaction guard */"))return false;
  s+='\n/* DREAD SHIFT v8.9.5 interaction guard */\nhtml,body,#app,#app *{-webkit-user-select:none;user-select:none}\ncanvas,#game{-webkit-user-drag:none;user-drag:none}\ninput,textarea,[contenteditable]:not([contenteditable="false"]){-webkit-user-select:text!important;user-select:text!important;-webkit-user-drag:auto}\n';
  W("public/style.css",s);return true;
}
const changed={server:patchServer(),client:patchClient(),html:patchHtml(),css:patchCss()};
const server=R("server.js"),client=R("public/client.js"),css=R("public/style.css");
must(server.includes('const BUILD_VERSION = "8.9.5";'),"server version missing");
must(server.includes("moveVx:Number(p.moveVx)||0"),"movement velocity missing");
must(client.includes('document.addEventListener("selectstart"'),"selection guard missing");
must(client.includes("sendMovementInputNow"),"movement sender missing");
must(css.includes('[contenteditable]:not([contenteditable="false"])'),"editable selection exception missing");
console.log("DREAD SHIFT v8.9.5 interaction/movement patch applied:",changed);
