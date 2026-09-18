"use strict";
const path=require("node:path"),cp=require("node:child_process");
const {WebSocket}=require("ws");
const root=path.join(__dirname,".."),port=19192,base="http://127.0.0.1:"+port,wsUrl="ws://127.0.0.1:"+port;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function assert(v,m){if(!v)throw new Error(m);}
let child=null,logs=[];
async function start(){
  logs=[];
  child=cp.spawn(process.execPath,["db_bridge.js"],{cwd:root,env:{...process.env,PORT:String(port),DATABASE_URL:"",NODE_ENV:"test",NSD_QA_ADMIN:"0"},stdio:["ignore","pipe","pipe"]});
  child.stdout.on("data",d=>logs.push(String(d)));child.stderr.on("data",d=>logs.push(String(d)));
  const end=Date.now()+10000;
  while(Date.now()<end){if(child.exitCode!==null)throw new Error("server exited\n"+logs.join(""));try{const r=await fetch(base+"/");if(r.ok)return;}catch{}await sleep(100);}
  throw new Error("server start timeout\n"+logs.join(""));
}
async function stop(){
  if(!child||child.exitCode!==null)return;
  child.kill("SIGTERM");
  const end=Date.now()+7000;while(Date.now()<end&&child.exitCode===null)await sleep(80);
  if(child.exitCode===null)child.kill("SIGKILL");
  await sleep(120);
}
async function post(route,body){
  const r=await fetch(base+route,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
  const j=await r.json().catch(()=>null);return {status:r.status,body:j};
}
class Probe{
  constructor(){this.msg=[];this.ws=null;}
  async open(){this.ws=new WebSocket(wsUrl);await new Promise((ok,bad)=>{const t=setTimeout(()=>bad(new Error("ws timeout")),5000);this.ws.once("open",()=>{clearTimeout(t);ok();});this.ws.once("error",bad)});this.ws.on("message",b=>{try{this.msg.push(JSON.parse(String(b)))}catch{}});return this;}
  send(type,data={}){this.ws.send(JSON.stringify({type,...data}));}
  async wait(pred,label,ms=6000){const end=Date.now()+ms;while(Date.now()<end){const m=this.msg.find(pred);if(m)return m;await sleep(25);}throw new Error("timeout "+label+" seen="+this.msg.map(x=>x.type).join(","));}
  close(){try{this.ws.close()}catch{}}
}
(async()=>{
  const suffix=(Date.now().toString(36)+Math.random().toString(36).slice(2,7)).replace(/[^a-z0-9]/g,"").slice(-12);
  const username=("persist_"+suffix).slice(0,24),password="Persist_98765",displayName="Persist "+suffix.slice(-4);
  try{
    await start();
    const reg=await post("/api/auth/register",{username,password,displayName});
    assert(reg.status===200&&reg.body?.ok,"register failed "+JSON.stringify(reg));
    const token=reg.body.session.token;
    const p=await new Probe().open();p.send("resumeSession",{token});await p.wait(m=>m.type==="authSuccess","auth");
    p.send("redeemCode",{code:"TEST"});
    const first=await p.wait(m=>m.type==="codeRedeemResult","redeem");
    assert(first.ok===true,"first TEST redeem failed");
    const meta1=await p.wait(m=>m.type==="metaState"&&Array.isArray(m.meta?.redeemedCodes)&&m.meta.redeemedCodes.includes("TEST"),"meta after redeem");
    const silver=Number(meta1.meta.silver),gold=Number(meta1.meta.gold);
    assert(silver>=150&&gold>=10,"promo balances did not update");
    p.close();
    await stop();

    await start();
    const login=await post("/api/auth/login",{username,password});
    assert(login.status===200&&login.body?.ok,"login after restart failed "+JSON.stringify(login));
    const q=await new Probe().open();q.send("resumeSession",{token:login.body.session.token});await q.wait(m=>m.type==="authSuccess","restart auth");
    q.send("getMeta");
    const meta2=await q.wait(m=>m.type==="metaState"&&Array.isArray(m.meta?.redeemedCodes),"restart meta");
    assert(meta2.meta.redeemedCodes.includes("TEST"),"redeemed code was lost after restart");
    assert(Number(meta2.meta.silver)===silver&&Number(meta2.meta.gold)===gold,"currency changed across clean restart");
    q.msg=[];q.send("redeemCode",{code:"TEST"});
    const again=await q.wait(m=>m.type==="codeRedeemResult","duplicate redeem after restart");
    assert(again.ok===false,"TEST code became redeemable after restart");
    q.close();
    console.log("[persistence-audit] PASS account/session/meta/promo survive clean restart");
  }finally{await stop();}
})().catch(err=>{console.error("[persistence-audit] FAIL",err?.stack||err);console.error(logs.join(""));process.exit(1);});
