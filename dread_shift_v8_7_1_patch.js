"use strict";
const fs=require("fs"),path=require("path");
const file=r=>path.join(__dirname,r),read=r=>fs.readFileSync(file(r),"utf8"),write=(r,s)=>fs.writeFileSync(file(r),s,"utf8");
function required(s,a,b,label){if(!s.includes(a))throw Error(`v8.7.1 target missing: ${label}`);return s.replace(a,b);}

function server(){let s=read("server.js");if(s.includes("/* DREAD SHIFT v8.7.1 server */"))return false;
  s=required(s,'const BUILD_VERSION = "8.7.0";','const BUILD_VERSION = "8.7.1";',"version");
  s=required(s,
`    for(const st of room.structures){const d=distanceToStructurePoint(z.x,z.y,st);if(d<best){best=d;target=st;}}`,
`    for(const st of room.structures){if(st.type==="spikes")continue;const d=distanceToStructurePoint(z.x,z.y,st);if(d<best){best=d;target=st;}}`,"siege enemies ignore spikes as targets");
  s=required(s,
`  for(const st of room.structures){const d=distanceToStructurePoint(z.x,z.y,st);if(d<bd&&d<82){bd=d;block=st;}}`,
`  for(const st of room.structures){if(st.type==="spikes")continue;const d=distanceToStructurePoint(z.x,z.y,st);if(d<bd&&d<82){bd=d;block=st;}}`,"normal enemies ignore spikes as blockers");
  s+='\n/* DREAD SHIFT v8.7.1 server */\n';write("server.js",s);return true;}

function client(){let s=read("public/client.js");if(s.includes("/* DREAD SHIFT v8.7.1 client */"))return false;
  s=required(s,
`ctx.fillStyle="#718b84";if(dual){rr(3,-11,37,8,4);ctx.fill();rr(3,3,37,8,4);ctx.fill();}else{rr(4,-5,35,10,4);ctx.fill();}ctx.strokeStyle="#b9e8d3";ctx.stroke();`,
`ctx.fillStyle="#718b84";ctx.strokeStyle="#b9e8d3";if(dual){for(const y of [-11,3]){rr(3,y,37,8,4);ctx.fill();ctx.stroke();}}else{rr(4,-5,35,10,4);ctx.fill();ctx.stroke();}`,"identical barrel fill and outline");
  s+='\n/* DREAD SHIFT v8.7.1 client */\n';write("public/client.js",s);return true;}

function html(){let s=read("public/index.html");if(s.includes("<!-- DREAD SHIFT v8.7.1 -->"))return false;s=s.replaceAll("v8.7.0","v8.7.1").replaceAll("V8.7.0","V8.7.1");s+='\n<!-- DREAD SHIFT v8.7.1 -->\n';write("public/index.html",s);return true;}
console.log("DREAD SHIFT v8.7.1 applied:",JSON.stringify({server:server(),client:client(),html:html()}));
