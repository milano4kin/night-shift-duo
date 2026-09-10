"use strict";

const fs=require("fs");
const path=require("path");
const file=rel=>path.join(__dirname,rel);
const read=rel=>fs.readFileSync(file(rel),"utf8");
const write=(rel,s)=>fs.writeFileSync(file(rel),s,"utf8");
function required(s,from,to,label){if(!s.includes(from))throw new Error(`v8.6.1 target missing: ${label}`);return s.replace(from,to);}

function patchServer(){let s=read("server.js");if(s.includes("/* DREAD SHIFT v8.6.1 server */"))return false;s=required(s,'const BUILD_VERSION = "8.6.0";','const BUILD_VERSION = "8.6.1";',"build version");s+='\n/* DREAD SHIFT v8.6.1 server */\n';write("server.js",s);return true;}
function patchClient(){
  let s=read("public/client.js");if(s.includes("/* DREAD SHIFT v8.6.1 client */"))return false;
  s=required(s,
`  // Arms hold the weapon low and forward instead of folding both hands across the face.
  ctx.strokeStyle=jacket;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(2,-12);ctx.lineTo(13,-13);ctx.lineTo(23,-8);ctx.moveTo(2,12);ctx.lineTo(11,14);ctx.lineTo(20,9);ctx.stroke();
  ctx.strokeStyle="#c99773";ctx.lineWidth=5.5;ctx.beginPath();ctx.moveTo(22,-8);ctx.lineTo(31,-5);ctx.moveTo(19,9);ctx.lineTo(28,5);ctx.stroke();
  ctx.fillStyle="#d5a77e";ctx.strokeStyle="#3b281f";ctx.lineWidth=1.5;for(const pt of [[31,-5],[28,5]]){ctx.beginPath();ctx.arc(pt[0],pt[1],3.8,0,Math.PI*2);ctx.fill();ctx.stroke();}`,
`  // Wide elbows create a readable rifle stance; the hands meet the grip well ahead of the face.
  ctx.strokeStyle=jacket;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(-2,-22);ctx.lineTo(14,-17);ctx.moveTo(0,12);ctx.lineTo(-3,22);ctx.lineTo(17,14);ctx.stroke();
  ctx.strokeStyle="#c99773";ctx.lineWidth=5.5;ctx.beginPath();ctx.moveTo(14,-17);ctx.lineTo(31,-8);ctx.moveTo(17,14);ctx.lineTo(34,7);ctx.stroke();
  ctx.fillStyle="#d5a77e";ctx.strokeStyle="#3b281f";ctx.lineWidth=1.5;for(const pt of [[31,-8],[34,7]]){ctx.beginPath();ctx.arc(pt[0],pt[1],3.7,0,Math.PI*2);ctx.fill();ctx.stroke();}`,
  "wide natural arm stance");
  s=required(s,`ctx.beginPath();ctx.arc(10,0,10.5,0,Math.PI*2);ctx.fill();ctx.stroke();`,`ctx.beginPath();ctx.arc(5,0,10.5,0,Math.PI*2);ctx.fill();ctx.stroke();`,"head moved behind hands");
  s=required(s,`ctx.beginPath();ctx.arc(8.5,0,10.7,Math.PI*.58,Math.PI*1.42);ctx.lineTo(9,0);ctx.closePath();ctx.fill();`,`ctx.beginPath();ctx.arc(3.5,0,10.7,Math.PI*.58,Math.PI*1.42);ctx.lineTo(4,0);ctx.closePath();ctx.fill();`,"hair follows head");
  s=required(s,`ctx.beginPath();ctx.arc(15,-4,2,0,Math.PI*2);ctx.fill();`,`ctx.beginPath();ctx.arc(10,-4,2,0,Math.PI*2);ctx.fill();`,"face highlight follows head");
  s=required(s,`ctx.drawImage(img,18-recoil,-height*.48,width,height);`,`ctx.drawImage(img,27-recoil,-height*.48,width,height);`,"weapon ahead of face");
  s=required(s,`ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(18+width*.72,0);ctx.stroke();`,`ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(27,0);ctx.lineTo(27+width*.72,0);ctx.stroke();`,"fallback weapon ahead");
  s=required(s,`const muzzleDist=18+width*.94;`,`const muzzleDist=27+width*.94;`,"muzzle follows weapon");
  s+='\n/* DREAD SHIFT v8.6.1 client */\n';write("public/client.js",s);return true;
}
console.log("DREAD SHIFT v8.6.1 applied:",JSON.stringify({server:patchServer(),client:patchClient()}));
