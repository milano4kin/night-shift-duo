"use strict";

const fs=require("fs");
const path=require("path");
const file=rel=>path.join(__dirname,rel);
const read=rel=>fs.readFileSync(file(rel),"utf8");
const write=(rel,s)=>fs.writeFileSync(file(rel),s,"utf8");

function required(s,from,to,label){
  if(!s.includes(from))throw new Error(`v8.5.3 target missing: ${label}`);
  return s.replace(from,to);
}
function assertHas(s,needle,label){if(!s.includes(needle))throw new Error(`v8.5.3 verification failed: ${label}`);}

function patchServer(){
  let s=read("server.js");
  if(s.includes("/* DREAD SHIFT v8.5.3 server */"))return false;
  s=required(s,'const BUILD_VERSION = "8.5.2";','const BUILD_VERSION = "8.5.3";',"build version");
  s=required(s,
    '  const price=metaUpgradePrice(key,level);if(target.gold<price)return false;\n  target.gold-=price;target.metaUpgrades[key]=level+1;saveProgress(target);return true;',
    '  const price=metaUpgradePrice(key,level);if(target.silver<price)return false;\n  target.silver-=price;target.metaUpgrades[key]=level+1;saveProgress(target);return true;',
    "silver upgrade payment"
  );
  assertHas(s,'if(target.silver<price)return false;',"silver balance check result");
  assertHas(s,'target.silver-=price;target.metaUpgrades[key]=level+1',"silver debit result");
  s+='\n/* DREAD SHIFT v8.5.3 server */\n';
  write("server.js",s);return true;
}

function patchClient(){
  let s=read("public/client.js");
  if(s.includes("/* DREAD SHIFT v8.5.3 client */"))return false;
  s=required(s,
    '${max||Number(m.gold||0)<price?"disabled":""}>${max?T("МАКСИМУМ","MAXIMUM"):`${T("УЛУЧШИТЬ","UPGRADE")} · ${price} ${T("золота","gold")}`}',
    '${max||Number(m.silver||0)<price?"disabled":""}>${max?T("МАКСИМУМ","MAXIMUM"):`${T("УЛУЧШИТЬ","UPGRADE")} · ${price} ${T("серебра","silver")}`}',
    "silver upgrade UI"
  );
  s=required(s,
    'const stripW=tiny?210:250,stripX=(innerWidth-stripW)/2,stripY=innerHeight-134;',
    'const stripW=tiny?210:250,stripX=(innerWidth-stripW)/2,stripY=innerHeight-(tiny?158:164);',
    "ammo strip clearance"
  );
  assertHas(s,'Number(m.silver||0)<price',"silver button state result");
  assertHas(s,'T("серебра","silver")',"silver price label result");
  assertHas(s,'stripY=innerHeight-(tiny?158:164)',"ammo strip result");
  s+='\n/* DREAD SHIFT v8.5.3 client */\n';
  write("public/client.js",s);return true;
}

const changed={server:patchServer(),client:patchClient()};
console.log("DREAD SHIFT v8.5.3 applied:",JSON.stringify(changed));
