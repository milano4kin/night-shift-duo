"use strict";
const fs=require("node:fs"),path=require("node:path");
const F=r=>path.join(__dirname,r),R=r=>fs.readFileSync(F(r),"utf8"),W=(r,s)=>fs.writeFileSync(F(r),s,"utf8");
function must(v,m){if(!v)throw new Error("v8.9.8: "+m)}
function once(s,a,b,m){must(s.includes(a),"target missing: "+m);return s.replace(a,b)}

const OLD_VALUES={
  damage:'bonuses:[3,7,15,22,30]',
  reload:'bonuses:[4,9,16,24,35]',
  health:'bonuses:[10,20,35,50,75]',
  speed:'bonuses:[2,4,6,8,10]',
  magazine:'bonuses:[5,10,15,22,30]',
  gather:'bonuses:[5,12,20,30,45]',
  building:'bonuses:[5,12,20,30,45]'
};
const NEW_VALUES={
  damage:'bonuses:[3,7,15,35,100]',
  reload:'bonuses:[4,9,16,24,35]',
  health:'bonuses:[10,40,75,150,220]',
  speed:'bonuses:[4,7,13,19,30]',
  magazine:'bonuses:[10,20,35,50,75]',
  gather:'bonuses:[5,12,30,60,100]',
  building:'bonuses:[5,22,40,65,145]'
};
function replaceUpgradeValues(s,label){
  for(const key of Object.keys(OLD_VALUES)){
    if(key==="reload")continue;
    s=once(s,OLD_VALUES[key],NEW_VALUES[key],label+" "+key);
  }
  return s;
}

function patchServer(){
  let s=R("server.js");if(s.includes("/* DREAD SHIFT v8.9.8 server */"))return false;
  s=once(s,'const BUILD_VERSION = "8.9.7";','const BUILD_VERSION = "8.9.8";',"server version");
  s=replaceUpgradeValues(s,"server upgrade values");
  s+='\n/* DREAD SHIFT v8.9.8 server */\n';W("server.js",s);return true;
}

function patchClient(){
  let s=R("public/client.js");if(s.includes("/* DREAD SHIFT v8.9.8 client */"))return false;
  s=replaceUpgradeValues(s,"client upgrade values");
  const oldVars=',bonus=lvl?cfg.prefix+cfg.bonuses[lvl-1]+cfg.unit:T("нет бонуса","no bonus"),steps=';
  const newVars=',currentValue=lvl?cfg.bonuses[lvl-1]:0,nextValue=max?null:cfg.bonuses[lvl],fmtBonus=v=>v===0?"0"+cfg.unit:cfg.prefix+v+cfg.unit,currentBonus=fmtBonus(currentValue),nextBonus=max?"MAX":fmtBonus(nextValue),steps=';
  s=once(s,oldVars,newVars,"upgrade preview values");
  const oldUi='</div><b>${T("ур.","lvl")} ${lvl}/${cfg.max} · ${T("текущий бонус","current bonus")}: ${bonus}</b></div><div class="meta-card-actions">';
  const newUi='</div><div class="upgrade-next"><span>${T("Сейчас","Current")}: <b>${currentBonus}</b></span>${max?`<span class="upgrade-max">MAX</span>`:`<span class="upgrade-arrow">→</span><span>${T("Следующий","Next")}: <b>${nextBonus}</b></span>`}</div><b>${T("ур.","lvl")} ${lvl}/${cfg.max}</b></div><div class="meta-card-actions">';
  s=once(s,oldUi,newUi,"next-upgrade UI");
  s+='\n/* DREAD SHIFT v8.9.8 client */\n';
  try{new Function(s)}catch(e){throw new Error("v8.9.8 client syntax: "+e.message)}
  W("public/client.js",s);return true;
}

function patchCss(){
  let s=R("public/style.css");if(s.includes("/* DREAD SHIFT v8.9.8 upgrade preview */"))return false;
  s+='\n/* DREAD SHIFT v8.9.8 upgrade preview */\n.upgrade-next{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:8px 0;color:#aeb9bf;font-size:13px}.upgrade-next b{color:#fff;font-size:14px}.upgrade-arrow{color:#ffd765;font-weight:950;font-size:18px}.upgrade-max{color:#74e6a0;font-weight:950;letter-spacing:.08em}\n';
  W("public/style.css",s);return true;
}
function patchHtml(){
  let s=R("public/index.html");if(s.includes("<!-- DREAD SHIFT v8.9.8 -->"))return false;
  s=s.replaceAll("V8.9.7","V8.9.8").replaceAll("v8.9.7","v8.9.8");
  s+='\n<!-- DREAD SHIFT v8.9.8 -->\n';W("public/index.html",s);return true;
}
const changed={server:patchServer(),client:patchClient(),css:patchCss(),html:patchHtml()};
const server=R("server.js"),client=R("public/client.js");
must(server.includes('const BUILD_VERSION = "8.9.8";'),"version missing");
must(server.includes('damage:{name:"Урон",prices:[50,75,150,200,300],bonuses:[3,7,15,35,100]'),"damage tiers missing");
must(server.includes('building:{name:"Прочность построек",prices:[75,125,200,275,400],bonuses:[5,22,40,65,145]'),"building tiers missing");
must(client.includes('T("Следующий","Next")'),"next-tier preview missing");
console.log("DREAD SHIFT v8.9.8 upgrade balance/preview applied:",changed);
