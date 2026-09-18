"use strict";
const path=require("node:path"),cp=require("node:child_process");
const {WebSocket}=require("ws");
const root=path.join(__dirname,".."),port=19194,base="http://127.0.0.1:"+port,wsUrl="ws://127.0.0.1:"+port;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let child=null,logs=[];
function assert(v,m){if(!v)throw new Error(m);}
async function start(){child=cp.spawn(process.execPath,["db_bridge.js"],{cwd:root,env:{...process.env,PORT:String(port),DATABASE_URL:"",NODE_ENV:"test",NSD_QA_ADMIN:"0"},stdio:["ignore","pipe","pipe"]});child.stdout.on("data",d=>logs.push(String(d)));child.stderr.on("data",d=>logs.push(String(d)));const end=Date.now()+10000;while(Date.now()<end){if(child.exitCode!==null)throw new Error("server exited\n"+logs.join(""));try{const r=await fetch(base+"/");if(r.ok)return;}catch{}await sleep(100);}throw new Error("server timeout");}
async function post(body){const r=await fetch(base+"/api/yandex/session",{method:"POST",headers:{"content-type":"application/json","origin":"https://yandex.com"},body:JSON.stringify(body)});return {status:r.status,cors:r.headers.get("access-control-allow-origin"),body:await r.json().catch(()=>null)};}
class Probe{constructor(){this.msg=[];}async open(){this.ws=new WebSocket(wsUrl);await new Promise((ok,bad)=>{const t=setTimeout(()=>bad(new Error("ws timeout")),5000);this.ws.once("open",()=>{clearTimeout(t);ok()});this.ws.once("error",bad)});this.ws.on("message",b=>{try{this.msg.push(JSON.parse(String(b)))}catch{}});return this;}send(type,data={}){this.ws.send(JSON.stringify({type,...data}));}clear(){this.msg=[];}async wait(pred,label,ms=6000){const end=Date.now()+ms;while(Date.now()<end){const x=this.msg.find(pred);if(x)return x;await sleep(25);}throw new Error("timeout "+label+" seen="+this.msg.map(x=>x.type).join(","));}close(){try{this.ws.close()}catch{}}}
(async()=>{
  try{
    await start();
    const opt=await fetch(base+"/api/yandex/session",{method:"OPTIONS",headers:{origin:"https://yandex.com"}});
    assert(opt.status===204,"OPTIONS expected 204");
    assert(opt.headers.get("access-control-allow-origin")==="*","Yandex CORS missing");
    const id="yandex-audit-"+Date.now();
    const a=await post({playerId:id,displayName:"Yandex Audit"});
    assert(a.status===200&&a.body?.ok&&a.body?.session?.token,"Yandex session creation failed "+JSON.stringify(a));
    assert(a.cors==="*","Yandex POST CORS missing");
    assert(a.body.account?.platform==="yandex","account platform not marked yandex");
    const b=await post({playerId:id,displayName:"Different Name"});
    assert(b.status===200&&b.body?.account?.username===a.body.account.username,"same Yandex ID did not map to same account");
    assert(b.body?.starterGift===false,"starter gift repeated for same Yandex player");

    const p=await new Probe().open();p.send("resumeSession",{token:a.body.session.token});
    const auth=await p.wait(m=>m.type==="authSuccess","auth");
    assert(auth.account?.platform==="yandex","WS auth lost Yandex platform");
    p.send("getMeta");const before=await p.wait(m=>m.type==="metaState","meta before");
    const gold0=Number(before.meta?.gold)||0;
    p.clear();p.send("yandexRewarded");
    const after=await p.wait(m=>m.type==="metaState"&&Number(m.meta?.gold)>=gold0+20,"rewarded meta");
    assert(Number(after.meta.gold)===gold0+20,"rewarded amount must be exactly 20 gold");
    p.clear();p.send("yandexRewarded");
    const cooldown=await p.wait(m=>m.type==="notice"&&/уже получен|позже/i.test(String(m.text||"")),"reward cooldown");
    assert(cooldown,"second reward was not throttled");
    p.close();
    console.log("[yandex-audit] PASS guest session, persistence identity, CORS and rewarded throttle");
  }finally{try{child?.kill("SIGTERM")}catch{}}
})().catch(e=>{console.error("[yandex-audit] FAIL",e.stack||e);console.error(logs.join(""));try{child?.kill("SIGKILL")}catch{}process.exit(1);});
