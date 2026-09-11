"use strict";
const fs=require("fs"),path=require("path");
const clientPath=path.join(__dirname,"public","client.js"),fragmentPath=path.join(__dirname,"v88_client_extension.jsfrag");
let s=fs.readFileSync(clientPath,"utf8");
if(!s.includes("/* DREAD SHIFT v8.8.1 client */")){
  const malformedStart=s.indexOf("\\nconst v88A=()=>");
  const malformedEndToken="/* DREAD SHIFT v8.8 client */\\n";
  if(malformedStart>=0){
    const malformedEnd=s.indexOf(malformedEndToken,malformedStart);
    if(malformedEnd<0)throw new Error("v8.8.1 malformed v8.8 client block end not found");
    s=s.slice(0,malformedStart)+s.slice(malformedEnd+malformedEndToken.length);
  }
  if(s.includes("const v88A=()=>"))throw new Error("v8.8.1 duplicate v8.8 client extension detected");
  const insertAt=s.lastIndexOf("})();");
  if(insertAt<0)throw new Error("v8.8.1 client IIFE end not found");
  const fragment=fs.readFileSync(fragmentPath,"utf8").trim();
  s=s.slice(0,insertAt)+"\n"+fragment+"\n/* DREAD SHIFT v8.8 client */\n/* DREAD SHIFT v8.8.1 client */\n"+s.slice(insertAt);
  try{new Function(s);}catch(err){throw new Error("v8.8.1 client syntax check failed: "+err.message);}
  fs.writeFileSync(clientPath,s,"utf8");
}
console.log("DREAD SHIFT v8.8.1 client repair ready");
