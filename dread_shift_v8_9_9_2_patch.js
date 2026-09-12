"use strict";
const fs=require("node:fs"),path=require("node:path");
const F=r=>path.join(__dirname,r),R=r=>fs.readFileSync(F(r),"utf8"),W=(r,s)=>fs.writeFileSync(F(r),s,"utf8");
const marker="/* DREAD SHIFT v8.9.9.2 wall hud polish */";

function patchClient(){
  let s=R("public/client.js");
  if(s.includes(marker))return false;

  // The logical wall is 96 px long (WALL_HALF_LEN=48), but the sprite was drawn as 128 px.
  // That made snapped walls visually sink into each other even when their collision endpoints touched exactly.
  const oldSize='  wall:{w:128,h:50},';
  const newSize='  wall:{w:96,h:50},';
  if(!s.includes(oldSize))throw new Error("v8.9.9.2: wall sprite size anchor missing");
  s=s.replace(oldSize,newSize);

  // Keep build prices authoritative and visible for every tower/build slot.
  const hotbarAnchor='const price=b.querySelector(".slot-cost");if(price)price.textContent=v899BuildCostLabel(cost);';
  if(!s.includes(hotbarAnchor))throw new Error("v8.9.9.2: dynamic build price updater missing");

  s+='\n'+marker+'\n';
  new Function(s);
  W("public/client.js",s);
  return true;
}

function patchCss(){
  let s=R("public/style.css");
  if(s.includes("/* DREAD SHIFT v8.9.9.2 hud layout */"))return false;
  s+='\n/* DREAD SHIFT v8.9.9.2 hud layout */\n'+
    '.talent-dock,.talent-dock.collapsed{top:244px!important}\n'+
    '.slot.build{height:82px!important;min-height:82px!important;padding-bottom:7px!important}\n'+
    '.slot.build .slot-cost{display:block!important;visibility:visible!important;opacity:1!important;max-width:none!important;overflow:visible!important;text-overflow:clip!important;white-space:nowrap!important;font-size:9px!important;line-height:1.1!important;color:#d8c785!important;margin-top:2px!important}\n';
  W("public/style.css",s);
  return true;
}

const changed={client:patchClient(),css:patchCss()};
const client=R("public/client.js"),css=R("public/style.css"),html=R("public/index.html");
if(!client.includes('wall:{w:96,h:50}'))throw new Error("v8.9.9.2: wall visual footprint not aligned");
if(!client.includes('v899BuildCostLabel'))throw new Error("v8.9.9.2: tower price updater missing");
if(!css.includes('.talent-dock,.talent-dock.collapsed{top:244px!important}'))throw new Error("v8.9.9.2: talent dock spacing missing");
for(const type of ["cannon","tesla","cat_tower","frost_tower","flame_tower"])if(!html.includes(`data-build="${type}"`))throw new Error("v8.9.9.2: tower slot missing: "+type);
console.log("DREAD SHIFT v8.9.9.2 wall/HUD polish applied:",changed);
