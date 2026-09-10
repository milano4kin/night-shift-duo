"use strict";
const fs=require("fs"),path=require("path");
const file=r=>path.join(__dirname,r),read=r=>fs.readFileSync(file(r),"utf8"),write=(r,s)=>fs.writeFileSync(file(r),s,"utf8");
function required(s,a,b,label){if(!s.includes(a))throw Error(`v8.6.3 target missing: ${label}`);return s.replace(a,b);}

function server(){let s=read("server.js");if(s.includes("/* DREAD SHIFT v8.6.3 server */"))return false;
  s=required(s,'const BUILD_VERSION = "8.6.2";','const BUILD_VERSION = "8.6.3";',"version");
  s=required(s,
`const speed=Math.min(245,90+d*.52),step=Math.min(d,speed*dt);`,
`const speed=Math.min(175,64+d*.37),step=Math.min(d,speed*dt);`,"pet follow speed divided by 1.4");
  s+='\n/* DREAD SHIFT v8.6.3 server */\n';write("server.js",s);return true;}

function client(){let s=read("public/client.js");if(s.includes("/* DREAD SHIFT v8.6.3 client */"))return false;
  s=required(s,
`  // Wide elbows create a readable rifle stance; the hands meet the grip well ahead of the face.
  ctx.strokeStyle=jacket;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(-2,-22);ctx.lineTo(14,-17);ctx.moveTo(0,12);ctx.lineTo(-3,22);ctx.lineTo(17,14);ctx.stroke();
  ctx.strokeStyle="#c99773";ctx.lineWidth=5.5;ctx.beginPath();ctx.moveTo(14,-17);ctx.lineTo(31,-8);ctx.moveTo(17,14);ctx.lineTo(34,7);ctx.stroke();
  ctx.fillStyle="#d5a77e";ctx.strokeStyle="#3b281f";ctx.lineWidth=1.5;for(const pt of [[31,-8],[34,7]]){ctx.beginPath();ctx.arc(pt[0],pt[1],3.7,0,Math.PI*2);ctx.fill();ctx.stroke();}`,
`  // Compact covered shoulders stay behind the head; no exposed forearms or hands overlap the face.
  ctx.fillStyle=jacket;ctx.strokeStyle="#0c1317";ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(-1,-15,8,6,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.ellipse(-1,15,8,6,0,0,Math.PI*2);ctx.fill();ctx.stroke();`,"remove hands from face");
  s+='\n/* DREAD SHIFT v8.6.3 client */\n';write("public/client.js",s);return true;}
console.log("DREAD SHIFT v8.6.3 applied:",JSON.stringify({server:server(),client:client()}));
