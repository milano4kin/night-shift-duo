"use strict";
const fs=require("node:fs"),path=require("node:path");
const file=path.join(__dirname,"public","client.js");
const marker="/* DREAD SHIFT v8.9.9.1 talent attention */";
let s=fs.readFileSync(file,"utf8");
if(!s.includes(marker)){
  const helperAnchor="function updateMetaAttention(){";
  if(!s.includes("function v899CanUpgradeTalent(p){")){
    if(!s.includes(helperAnchor))throw new Error("v8.9.9.1: updateMetaAttention anchor missing");
    s=s.replace(helperAnchor,'function v899CanUpgradeTalent(p){return !!p&&Number(p.skillPoints)>0&&Object.entries(talentDefs).some(([id,cfg])=>Number(p.skills?.[id]||0)<Number(cfg.max||0));}\n'+helperAnchor);
  }
  const oldToggle='talentDock.classList.toggle("attention",p.skillPoints>0);';
  const newToggle='talentDock.classList.toggle("attention",v899CanUpgradeTalent(p));';
  if(s.includes(oldToggle))s=s.replaceAll(oldToggle,newToggle);
  if(!s.includes(newToggle))throw new Error("v8.9.9.1: talent attention toggle missing");
  s+='\n'+marker+'\n';
  new Function(s);
  fs.writeFileSync(file,s,"utf8");
  console.log("DREAD SHIFT v8.9.9.1 talent attention patch applied");
}else console.log("DREAD SHIFT v8.9.9.1 talent attention patch already present");
