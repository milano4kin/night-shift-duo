"use strict";
const fs=require("fs"),path=require("path");
const target=path.join(__dirname,"public","client.js");
let s=fs.readFileSync(target,"utf8");
if(!s.includes("/* DREAD SHIFT v8.8.1 client */")){
  const start=s.indexOf("\\nconst v88A=()=>");
  const endToken="/* DREAD SHIFT v8.8 client */\\n";
  const end=start>=0?s.indexOf(endToken,start):-1;
  if(start>=0&&end>=0){
    const finish=end+endToken.length;
    let block=s.slice(start,finish);
    block=block.replaceAll("\\n","\n").replaceAll("\\`","`").replaceAll('\\"','"');
    s=s.slice(0,start)+block+s.slice(finish);
  }
  s=s.replace("/* DREAD SHIFT v8.8 client */","/* DREAD SHIFT v8.8 client */\n/* DREAD SHIFT v8.8.1 client */");
  try{new Function(s);}catch(err){throw new Error("v8.8.1 client syntax check failed: "+err.message);}
  fs.writeFileSync(target,s,"utf8");
}
console.log("DREAD SHIFT v8.8.1 client hotfix ready");
