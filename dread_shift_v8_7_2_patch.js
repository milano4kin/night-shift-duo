"use strict";
const fs=require("fs"),path=require("path");
const file=r=>path.join(__dirname,r),read=r=>fs.readFileSync(file(r),"utf8"),write=(r,s)=>fs.writeFileSync(file(r),s,"utf8");
function required(s,a,b,label){if(!s.includes(a))throw Error(`v8.7.2 target missing: ${label}`);return s.replace(a,b);}
function server(){let s=read("server.js");if(s.includes("/* DREAD SHIFT v8.7.2 server */"))return false;s=required(s,'const BUILD_VERSION = "8.7.1";','const BUILD_VERSION = "8.7.2";',"version");s+='\n/* DREAD SHIFT v8.7.2 server */\n';write("server.js",s);return true;}
function client(){let s=read("public/client.js");if(s.includes("/* DREAD SHIFT v8.7.2 client */"))return false;
  s=required(s,
`  // Compact covered shoulders stay behind the head; no exposed forearms or hands overlap the face.
  ctx.fillStyle=jacket;ctx.strokeStyle="#0c1317";ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(-1,-15,8,6,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.ellipse(-1,15,8,6,0,0,Math.PI*2);ctx.fill();ctx.stroke();`,
`  // Two clean, straight arms point forward; there are no detached fist shapes at their ends.
  ctx.lineCap="round";ctx.strokeStyle=jacket;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(15,-8);ctx.moveTo(0,11);ctx.lineTo(15,8);ctx.stroke();
  ctx.strokeStyle="#c99773";ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(14,-8);ctx.lineTo(30,-5);ctx.moveTo(14,8);ctx.lineTo(30,5);ctx.stroke();`,"straight arms");
  s=required(s,
`}else if(p.id!==myId||activeTool==="gun")drawHeldWeaponSprite(p,s,aim);
  else if(activeTool==="hands"&&handsImage.complete&&handsImage.naturalWidth){const ang=Math.atan2(aim.y,aim.x);ctx.save();ctx.translate(s.x+aim.x*25,s.y+aim.y*25);ctx.rotate(ang);if(Math.cos(ang)<0)ctx.scale(1,-1);ctx.drawImage(handsImage,-21,-14,42,28);ctx.restore();}`,
`}else if(p.id!==myId||activeTool==="gun")drawHeldWeaponSprite(p,s,aim);`,"remove detached hands sprite");
  s+='\n/* DREAD SHIFT v8.7.2 client */\n';write("public/client.js",s);return true;}
function html(){let s=read("public/index.html");if(s.includes("<!-- DREAD SHIFT v8.7.2 -->"))return false;s=s.replaceAll("v8.7.1","v8.7.2").replaceAll("V8.7.1","V8.7.2");s+='\n<!-- DREAD SHIFT v8.7.2 -->\n';write("public/index.html",s);return true;}
console.log("DREAD SHIFT v8.7.2 applied:",JSON.stringify({server:server(),client:client(),html:html()}));
