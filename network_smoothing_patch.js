"use strict";

const fs = require("fs");
const path = require("path");

function patchFile(file, replacements) {
  const target = path.join(__dirname, file);
  let source = fs.readFileSync(target, "utf8");
  let changed = false;

  for (const [from, to] of replacements) {
    if (source.includes(from)) {
      source = source.replace(from, to);
      changed = true;
    }
  }

  if (changed) fs.writeFileSync(target, source, "utf8");
  return changed;
}

const serverChanged = patchFile("server.js", [
  [
    "const SNAPSHOT_HZ = 15;",
    "const SNAPSHOT_HZ = 12;"
  ],
  [
    "const VIEW_RADIUS = 1550;",
    "const VIEW_RADIUS = 1450;"
  ],
  [
    '      for(const p of room.players.values())send(p.ws,"snapshot",{state:serializeFor(room,p)});',
    '      for(const p of room.players.values()){\n        // Never queue stale world snapshots behind a slow connection. Fresh state is more useful than old state.\n        if((p.ws.bufferedAmount||0)>128*1024)continue;\n        send(p.ws,"snapshot",{state:serializeFor(room,p)});\n      }'
  ]
]);

const clientChanged = patchFile("public/client.js", [
  [
    "let fpsSampleStart=performance.now(),fpsFrames=0,currentFps=0,currentPing=null;",
    "let fpsSampleStart=performance.now(),fpsFrames=0,currentFps=0,currentPing=null,pingJitter=0,lastPingSample=null;"
  ],
  [
    '    if(m.type==="clientPong"){currentPing=Math.max(0,Date.now()-(Number(m.sentAt)||Date.now()));return;}',
    '    if(m.type==="clientPong"){const sample=Math.max(0,Date.now()-(Number(m.sentAt)||Date.now()));if(lastPingSample!=null)pingJitter=pingJitter*.8+Math.abs(sample-lastPingSample)*.2;currentPing=currentPing==null?sample:Math.round(currentPing*.8+sample*.2);lastPingSample=sample;return;}'
  ],
  [
    '        const err=Math.hypot(localPred.x-mp.x,localPred.y-mp.y);\n        const correction=err>140?1:.18;\n        localPred.x+=(mp.x-localPred.x)*correction;\n        localPred.y+=(mp.y-localPred.y)*correction;',
    '        const err=Math.hypot(localPred.x-mp.x,localPred.y-mp.y);\n        // High latency means the authoritative position is naturally older than the predicted one.\n        // Correct gradually so normal ping spikes do not yank the player across the screen.\n        const moving=keys.has("KeyW")||keys.has("KeyA")||keys.has("KeyS")||keys.has("KeyD");\n        const netDelay=Math.min(600,Math.max(0,(currentPing||0)+(pingJitter||0)));\n        const hardSnap=err>900;\n        let correction=hardSnap?1:(moving?.055:.10);\n        if(!hardSnap&&err>360)correction=Math.min(.24,correction*2.4);\n        else if(!hardSnap&&err>160)correction=Math.min(.16,correction*1.6);\n        if(!hardSnap&&netDelay>220)correction*=.78;\n        else if(!hardSnap&&netDelay>120)correction*=.88;\n        let step=err*correction;\n        if(!hardSnap)step=Math.min(step,moving?46:60);\n        if(err>.001){const nx=(mp.x-localPred.x)/err,ny=(mp.y-localPred.y)/err;localPred.x+=nx*step;localPred.y+=ny*step;}'
  ]
]);

console.log(`Network smoothing patch: server=${serverChanged ? "updated" : "already patched"}, client=${clientChanged ? "updated" : "already patched"}`);
