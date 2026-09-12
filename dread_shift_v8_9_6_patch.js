"use strict";
const fs=require("node:fs"),path=require("node:path");
const F=r=>path.join(__dirname,r),R=r=>fs.readFileSync(F(r),"utf8"),W=(r,s)=>fs.writeFileSync(F(r),s,"utf8");
function must(value,message){if(!value)throw new Error("v8.9.6: "+message)}
function replaceOnce(source,from,to,label){must(source.includes(from),"target missing: "+label);return source.replace(from,to)}

function patchServer(){
  let s=R("server.js");if(s.includes("/* DREAD SHIFT v8.9.6 server */"))return false;
  s=replaceOnce(s,'const BUILD_VERSION = "8.9.5";','const BUILD_VERSION = "8.9.6";',"server version");
  s+='\n/* DREAD SHIFT v8.9.6 server */\n';W("server.js",s);return true;
}

function patchClient(){
  let s=R("public/client.js");if(s.includes("/* DREAD SHIFT v8.9.6 client */"))return false;
  s=replaceOnce(s,"function drawStructures(){",[
    "let wallCornerCacheKey=\"\",wallCornerCache=[];",
    "function getWallCornerJoints(){",
    "  const walls=state.structures.filter(st=>isWallBuild(st.type)&&(st.hp==null||st.hp>0));",
    "  const cacheKey=walls.map(st=>`${st.id}:${st.type}:${st.x}:${st.y}:${st.rotation||0}`).join(\"|\");",
    "  if(cacheKey===wallCornerCacheKey)return wallCornerCache;",
    "  wallCornerCacheKey=cacheKey;wallCornerCache=[];",
    "  for(let i=0;i<walls.length;i++){",
    "    const first=walls[i],firstEnds=wallEndpointsLocal(first.x,first.y,first.rotation||0);",
    "    for(let j=i+1;j<walls.length;j++){",
    "      const second=walls[j],secondEnds=wallEndpointsLocal(second.x,second.y,second.rotation||0);",
    "      const angleDot=Math.abs(Math.cos((first.rotation||0)-(second.rotation||0)));",
    "      if(angleDot>.985)continue;",
    "      let join=null,joinDistance=15;",
    "      for(const a of firstEnds)for(const b of secondEnds){",
    "        const gap=Math.hypot(a.x-b.x,a.y-b.y);",
    "        if(gap<joinDistance){joinDistance=gap;join={a,b};}",
    "      }",
    "      if(!join)continue;",
    "      const center={x:(join.a.x+join.b.x)/2,y:(join.a.y+join.b.y)/2};",
    "      wallCornerCache.push({center,d1:norm(first.x-center.x,first.y-center.y),d2:norm(second.x-center.x,second.y-center.y),gate:first.type===\"gate\"||second.type===\"gate\"});",
    "    }",
    "  }",
    "  return wallCornerCache;",
    "}",
    "function drawWallCornerJoints(){",
    "  for(const joint of getWallCornerJoints()){",
    "      if(!vis(joint.center.x,joint.center.y,80))continue;",
    "      const p1=sc(joint.center.x+joint.d1.x*22,joint.center.y+joint.d1.y*22),corner=sc(joint.center.x,joint.center.y),p2=sc(joint.center.x+joint.d2.x*22,joint.center.y+joint.d2.y*22);",
    "      ctx.save();ctx.lineCap=\"round\";ctx.lineJoin=\"round\";",
    "      ctx.strokeStyle=\"#1f282d\";ctx.lineWidth=23;ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(corner.x,corner.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();",
    "      ctx.strokeStyle=joint.gate?\"#6f654c\":\"#53626a\";ctx.lineWidth=17;ctx.stroke();",
    "      ctx.strokeStyle=joint.gate?\"#b09b68\":\"#85939a\";ctx.lineWidth=4;ctx.stroke();",
    "      ctx.fillStyle=\"#273238\";ctx.beginPath();ctx.arc(corner.x,corner.y,5,0,Math.PI*2);ctx.fill();ctx.restore();",
    "  }",
    "}",
    "function drawStructures(){",
    "  drawWallCornerJoints();"
  ].join("\n"),"automatic wall corner renderer");
  s+='\n/* DREAD SHIFT v8.9.6 client */\n';
  try{new Function(s)}catch(err){throw new Error("v8.9.6 client syntax: "+err.message)}
  W("public/client.js",s);return true;
}

function patchHtml(){let s=R("public/index.html");if(s.includes("<!-- DREAD SHIFT v8.9.6 -->"))return false;s=s.replaceAll("V8.9.5","V8.9.6").replaceAll("v8.9.5","v8.9.6");s+='\n<!-- DREAD SHIFT v8.9.6 -->\n';W("public/index.html",s);return true;}
const changed={server:patchServer(),client:patchClient(),html:patchHtml()};
const server=R("server.js"),client=R("public/client.js");
must(server.includes("/* DREAD SHIFT v8.9.6 server */"),"server marker missing");
must(client.includes("function drawWallCornerJoints()"),"wall corner renderer missing");
must(client.includes("angleDot>.985"),"straight joint guard missing");
console.log("DREAD SHIFT v8.9.6 wall corner patch applied:",changed);
