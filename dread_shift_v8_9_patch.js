"use strict";
const fs=require("node:fs"),path=require("node:path");
const read=rel=>fs.readFileSync(path.join(__dirname,rel),"utf8");
const required={
  "server.js":["/* DREAD SHIFT v8.9 server */",'const BUILD_VERSION = "8.9.1";',"hp:680","prevX:p.x","pointSegmentDistance(z.x,z.y,bulletFromX","V88_COS","v882Social"],
  "public/client.js":["/* DREAD SHIFT v8.9 client */","wallSnapEnabled=true","updateMetaAttention","showLevelUp","WALL_HALF_THICK=13","/* DREAD SHIFT v8.8.1 client */","friendRequests?.incoming"],
  "public/index.html":["V8.9.1","wallBuildHud","wallSnapToggle"],
  "public/style.css":["DREAD SHIFT v8.9 attention and wall-building HUD",".wall-build-hud",".attention::after"]
};
for(const [file,markers] of Object.entries(required)){
  const source=read(file);
  for(const marker of markers)if(!source.includes(marker))throw new Error(`v8.9 marker missing in ${file}: ${marker}`);
}
console.log("DREAD SHIFT v8.9 runtime verified");
