"use strict";
const fs=require("node:fs"),path=require("node:path"),{spawnSync}=require("node:child_process");
const root=path.join(__dirname,".."),server=fs.readFileSync(path.join(root,"server.js"),"utf8"),client=fs.readFileSync(path.join(root,"public","client.js"),"utf8");
if(server.includes("/* DREAD SHIFT v8.8.2 server */")&&client.includes("/* DREAD SHIFT v8.8.2 client */")){
  console.log("DREAD SHIFT social runtime already present");
  process.exit(0);
}
for(const script of ["dread_shift_v8_8_patch.js","dread_shift_v8_8_1_patch.js","dread_shift_v8_8_2_patch.js"]){
  const result=spawnSync(process.execPath,[script],{cwd:root,stdio:"inherit"});
  if(result.status!==0)process.exit(result.status||1);
}
