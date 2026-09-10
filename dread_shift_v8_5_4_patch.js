"use strict";

const fs=require("fs");
const path=require("path");
const file=rel=>path.join(__dirname,rel);
const read=rel=>fs.readFileSync(file(rel),"utf8");
const write=(rel,s)=>fs.writeFileSync(file(rel),s,"utf8");

function required(s,from,to,label){
  if(!s.includes(from))throw new Error(`v8.5.4 target missing: ${label}`);
  return s.replace(from,to);
}

function patchServer(){
  let s=read("server.js");
  if(s.includes("/* DREAD SHIFT v8.5.4 server */"))return false;
  s=required(s,'const BUILD_VERSION = "8.5.3";','const BUILD_VERSION = "8.5.4";',"build version");
  s+='\n/* DREAD SHIFT v8.5.4 server */\n';write("server.js",s);return true;
}

function patchClient(){
  let s=read("public/client.js");
  if(s.includes("/* DREAD SHIFT v8.5.4 client */"))return false;
  const duplicate=[
    '  // Compact ammo strip above the hotbar; the weapon slot already contains the detailed weapon info.',
    '  const melee=meleeWeapons.has(p.weapon.type),ammo=p.weaponAmmo||{},ammoText=melee?T(\'БЛИЖНИЙ БОЙ\',\'MELEE\'):(ammo.reloading?`${T(\'ПЕРЕЗАРЯДКА\',\'RELOADING\')} ${Math.max(0,ammo.reloadTimer||0).toFixed(1)}${T(\'с\',\'s\')}`:`${ammo.mag||0} / ${ammo.max||0}`);',
    "  const stripW=tiny?210:250,stripX=(innerWidth-stripW)/2,stripY=innerHeight-(tiny?158:164);hudPanel(stripX,stripY,stripW,30,{fill:'rgba(7,11,16,.90)',stroke:'rgba(121,182,255,.16)'});ctx.textAlign='center';ctx.fillStyle=ammo.reloading?'#f0cb70':'#91d8ff';ctx.font='900 12px system-ui';ctx.fillText(`${weaponNames[p.weapon.type]||T('Оружие','Weapon')} · ${ammoText}`,stripX+stripW/2,stripY+20);ctx.textAlign='left';",
    ''
  ].join('\n');
  s=required(s,duplicate,'',"duplicate weapon strip");
  s+='\n/* DREAD SHIFT v8.5.4 client */\n';write("public/client.js",s);return true;
}

const changed={server:patchServer(),client:patchClient()};
console.log("DREAD SHIFT v8.5.4 applied:",JSON.stringify(changed));
