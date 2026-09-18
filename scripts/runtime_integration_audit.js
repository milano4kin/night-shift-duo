"use strict";
const path=require("node:path"),cp=require("node:child_process");
const {WebSocket}=require("ws");
const root=path.join(__dirname,"..");
const port=19191;
const base="http://127.0.0.1:"+port;
const wsUrl="ws://127.0.0.1:"+port;
const logs=[];
const child=cp.spawn(process.execPath,["db_bridge.js"],{
  cwd:root,
  env:{...process.env,PORT:String(port),DATABASE_URL:"",NODE_ENV:"test",NSD_QA_ADMIN:"0"},
  stdio:["ignore","pipe","pipe"]
});
child.stdout.on("data",d=>logs.push(String(d)));
child.stderr.on("data",d=>logs.push(String(d)));

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitHttp(){
  const end=Date.now()+10000;
  while(Date.now()<end){
    if(child.exitCode!==null)throw new Error("server exited early\n"+logs.join(""));
    try{const r=await fetch(base+"/");if(r.ok)return;}catch{}
    await sleep(120);
  }
  throw new Error("server did not become healthy\n"+logs.join(""));
}
async function jsonPost(route,body,raw=false){
  const payload=raw?body:JSON.stringify(body);
  const r=await fetch(base+route,{method:"POST",headers:{"content-type":"application/json"},body:payload});
  let j=null;try{j=await r.json();}catch{}
  return {status:r.status,body:j,text:j?null:await r.text().catch(()=>null)};
}
class Probe{
  constructor(){this.messages=[];this.waiters=[];this.ws=null;}
  async open(){
    this.ws=new WebSocket(wsUrl);
    await new Promise((resolve,reject)=>{
      const to=setTimeout(()=>reject(new Error("WS open timeout")),5000);
      this.ws.once("open",()=>{clearTimeout(to);resolve();});
      this.ws.once("error",reject);
    });
    this.ws.on("message",buf=>{
      let m;try{m=JSON.parse(String(buf));}catch{return;}
      this.messages.push(m);
      for(const w of [...this.waiters]){
        if(w.pred(m)){this.waiters.splice(this.waiters.indexOf(w),1);clearTimeout(w.to);w.resolve(m);}
      }
    });
    return this;
  }
  send(type,data={}){this.ws.send(JSON.stringify({type,...data}));}
  wait(pred,label,ms=6000){
    const existing=this.messages.find(pred);if(existing)return Promise.resolve(existing);
    return new Promise((resolve,reject)=>{
      const w={pred,resolve,reject,to:null};
      w.to=setTimeout(()=>{const i=this.waiters.indexOf(w);if(i>=0)this.waiters.splice(i,1);reject(new Error("WS timeout waiting for "+label+"; seen: "+this.messages.map(x=>x.type).join(",")));},ms);
      this.waiters.push(w);
    });
  }
  type(type,ms=6000){return this.wait(m=>m.type===type,type,ms);}
  close(){try{this.ws.close();}catch{}}
}
function assert(cond,msg){if(!cond)throw new Error(msg);}
async function main(){
  await waitHttp();
  console.log("[runtime-audit] server healthy");

  let r=await fetch(base+"/");
  assert(r.status===200,"GET / expected 200, got "+r.status);
  const home=await r.text();
  assert(/Dread Shift/i.test(home),"homepage title/content missing");

  r=await fetch(base+"/package.json");
  assert(r.status===404||r.status===403,"static root exposed package.json: "+r.status);

  let x=await jsonPost("/api/auth/register","{bad json",true);
  assert(x.status===400,"invalid auth JSON expected 400, got "+x.status);

  x=await jsonPost("/api/auth/register",JSON.stringify({x:"a".repeat(9000)}),true);
  assert(x.status===413,"oversized auth body expected 413, got "+x.status);

  const suffix=(Date.now().toString(36)+Math.random().toString(36).slice(2,6)).replace(/[^a-z0-9]/g,"").slice(-12);
  const username=("audit_"+suffix).slice(0,24),password="AuditPass_98765",displayName="Audit "+suffix.slice(-5);
  x=await jsonPost("/api/auth/register",{username,password,displayName});
  assert(x.status===200&&x.body?.ok===true,"register failed: "+JSON.stringify(x));
  assert(x.body?.session?.token?.length>=32,"register did not issue a session");
  assert(x.body?.starterGift===true,"starter gift missing on first registration");
  const token=x.body.session.token;

  let bad=await jsonPost("/api/auth/login",{username,password:"wrong-password"});
  assert(bad.status===401,"wrong password expected 401, got "+bad.status);
  let login=await jsonPost("/api/auth/login",{username,password});
  assert(login.status===200&&login.body?.ok===true,"login failed");
  const logoutToken=login.body.session.token;

  // Session revocation must actually invalidate the exact browser session.
  const lo=await new Probe().open();
  lo.send("resumeSession",{token:logoutToken});
  await lo.type("authSuccess");
  lo.send("logout");
  await lo.type("loggedOut");
  lo.close();
  const revoked=await new Probe().open();
  revoked.send("resumeSession",{token:logoutToken});
  await revoked.type("sessionInvalid");
  revoked.close();

  // Main gameplay/session path.
  const p=await new Probe().open();
  p.send("resumeSession",{token});
  const auth=await p.type("authSuccess");
  assert(auth.account?.username===username,"resumeSession restored wrong account");
  assert(auth.account?.featureUnlocks?.index===true,"INDEX is not unlocked immediately");

  p.send("redeemCode",{code:"TEST"});
  const code1=await p.wait(m=>m.type==="codeRedeemResult"&&m.code==="TEST","first TEST code");
  assert(code1.ok===true,"TEST promo failed: "+JSON.stringify(code1));
  p.messages=[];
  p.send("redeemCode",{code:"TEST"});
  const code2=await p.type("codeRedeemResult");
  assert(code2.ok===false,"TEST promo could be redeemed twice");

  p.send("createRoom",{mode:"solo",character:"starter"});
  const joined=await p.type("joined");
  assert(joined.mode==="solo","solo room returned wrong mode");
  assert(joined.isHost===true,"solo creator is not host");
  assert(typeof joined.code==="string"&&joined.code.length>0,"room code missing");

  p.messages=[];
  p.send("start");
  const snap=await p.wait(m=>m.type==="snapshot"&&m.state?.started===true,"started snapshot",8000);
  assert(snap.state.phase==="day","run did not start in preparation/day phase");
  assert(Number(snap.state.phaseTimer)<=30.5&&Number(snap.state.phaseTimer)>24,"prep timer is not approximately 30 seconds: "+snap.state.phaseTimer);

  p.messages=[];
  p.send("redeemCode",{code:"WELCOME"});
  const duringRun=await p.type("codeRedeemResult");
  assert(duringRun.ok===false,"promo code can be redeemed during an active run");

  p.messages=[];
  p.send("skipPrep");
  const night=await p.wait(m=>m.type==="snapshot"&&m.state?.phase==="night","night after skipPrep",8000);
  assert(Number(night.state.wave)>=1,"skipPrep did not start a wave");

  p.close();
  await sleep(150);
  const alive=await fetch(base+"/");
  assert(alive.ok,"server died after gameplay socket closed");
  console.log("[runtime-audit] PASS auth/session/codes/solo/start/skip/reconnect basics");
}
main().then(()=>{
  try{child.kill("SIGTERM");}catch{}
  setTimeout(()=>process.exit(0),100).unref();
}).catch(err=>{
  console.error("[runtime-audit] FAIL",err&&err.stack||err);
  console.error(logs.join(""));
  try{child.kill("SIGKILL");}catch{}
  process.exit(1);
});
