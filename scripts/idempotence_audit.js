"use strict";
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto"),cp=require("node:child_process");
const root=path.join(__dirname,"..");
const files=["server.js","public/client.js","public/index.html","public/style.css","db_bridge.js","package.json"];
const hash=p=>crypto.createHash("sha256").update(fs.readFileSync(path.join(root,p))).digest("hex");
const before=Object.fromEntries(files.map(p=>[p,{hash:hash(p),size:fs.statSync(path.join(root,p)).size}]));
const result=cp.spawnSync(process.platform==="win32"?"npm.cmd":"npm",["run","patch:runtime"],{cwd:root,encoding:"utf8",timeout:120000,env:{...process.env,NODE_ENV:"test"}});
process.stdout.write(result.stdout||"");process.stderr.write(result.stderr||"");
if(result.error)throw result.error;
if(result.status!==0)throw new Error("second patch:runtime failed with exit "+result.status);
const after=Object.fromEntries(files.map(p=>[p,{hash:hash(p),size:fs.statSync(path.join(root,p)).size}]));
const changed=files.filter(p=>before[p].hash!==after[p].hash);
if(changed.length){
  for(const p of changed)console.error("[idempotence] changed",p,before[p],after[p]);
  throw new Error("patch:runtime is not idempotent: "+changed.join(", "));
}
console.log("[idempotence] PASS: second runtime patch produced byte-identical audited files");
