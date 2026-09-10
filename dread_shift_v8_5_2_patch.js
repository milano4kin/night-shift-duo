"use strict";

const fs=require("fs");
const path=require("path");
const file=rel=>path.join(__dirname,rel);
const read=rel=>fs.readFileSync(file(rel),"utf8");
const write=(rel,s)=>fs.writeFileSync(file(rel),s,"utf8");

function required(s,from,to,label){
  if(!s.includes(from))throw new Error(`v8.5.2 target missing: ${label}`);
  return s.replace(from,to);
}
function assertHas(s,needle,label){if(!s.includes(needle))throw new Error(`v8.5.2 verification failed: ${label}`);}

function patchServer(){
  let s=read("server.js");
  if(s.includes("/* DREAD SHIFT v8.5.2 server */"))return false;
  s=required(s,'const BUILD_VERSION = "8.5.1";','const BUILD_VERSION = "8.5.2";',"build version");
  s=required(s,
    'function cleanUsername(v){return String(v||"").trim().toLowerCase().replace(/[^a-z0-9_]/g,"").slice(0,24);}',
    'function cleanUsername(v){return String(v||"").trim().toLowerCase().replace(/[^a-z0-9_]/g,"").slice(0,24);}\nfunction isQaAdmin(p){return cleanUsername(p?.account?.username||p?.profile)==="cattencel";}',
    "account-scoped admin predicate"
  );
  s=required(s,
    '  if(!QA_ADMIN_ENABLED){\n    send(p?.ws,"notice",{text:"Админ-команды отключены в обычной сборке"});',
    '  if(!isQaAdmin(p)){\n    send(p?.ws,"notice",{text:"Админ-команды недоступны для этого аккаунта"});',
    "admin handler authorization"
  );
  s=required(s,
    'qaAdminEnabled:QA_ADMIN_ENABLED,buildVersion:BUILD_VERSION,',
    'qaAdminEnabled:isQaAdmin(p),buildVersion:BUILD_VERSION,',
    "private admin capability"
  );
  s=required(s,
    '      if(!QA_ADMIN_ENABLED)return send(ws,"notice",{text:"Админ-команды отключены в обычной сборке"});',
    '      if(!isQaAdmin(p))return send(ws,"notice",{text:"Админ-команды недоступны для этого аккаунта"});',
    "admin message authorization"
  );
  assertHas(s,'function isQaAdmin(p)',"admin predicate result");
  assertHas(s,'qaAdminEnabled:isQaAdmin(p)',"per-player capability result");
  s+='\n/* DREAD SHIFT v8.5.2 server */\n';
  write("server.js",s);return true;
}

function patchCss(){
  let s=read("public/style.css");
  if(s.includes("/* DREAD SHIFT v8.5.2 hotbar */"))return false;
  s+='\n/* DREAD SHIFT v8.5.2 hotbar */\n'+
    '.weapon-slot{width:124px!important;min-width:124px!important;height:88px!important;padding:5px 8px 6px!important;display:grid!important;grid-template-rows:31px 22px 9px 15px!important;align-content:center!important;justify-items:center!important;gap:1px!important;overflow:hidden!important}\n'+
    '.weapon-slot-img{grid-row:1!important;width:72px!important;height:30px!important;margin:0!important;object-fit:contain!important}\n'+
    '.weapon-slot .slot-name{grid-row:2!important;width:108px!important;max-width:108px!important;min-height:22px!important;margin:0!important;display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2!important;overflow:hidden!important;white-space:normal!important;text-overflow:ellipsis!important;line-height:11px!important;font-size:9px!important;text-align:center!important;overflow-wrap:normal!important;word-break:normal!important}\n'+
    '.weapon-slot-stars{grid-row:3!important;height:9px!important;line-height:9px!important;margin:0!important}.weapon-slot .weapon-ammo-label{grid-row:4!important;height:15px!important;min-height:15px!important;line-height:15px!important;margin:0!important}\n'+
    '@media(max-width:1099px){.weapon-slot{width:112px!important;min-width:112px!important}.weapon-slot .slot-name{width:98px!important;max-width:98px!important;font-size:8px!important}}\n';
  write("public/style.css",s);return true;
}

const changed={server:patchServer(),css:patchCss()};
console.log("DREAD SHIFT v8.5.2 applied:",JSON.stringify(changed));
