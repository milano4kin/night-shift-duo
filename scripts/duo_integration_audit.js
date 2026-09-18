"use strict";
const path=require("node:path"),cp=require("node:child_process");
const {WebSocket}=require("ws");
const root=path.join(__dirname,".."),port=19193,base="http://127.0.0.1:"+port,wsUrl="ws://127.0.0.1:"+port,logs=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const child=cp.spawn(process.execPath,["db_bridge.js"],{cwd:root,env:{...process.env,PORT:String(port),DATABASE_URL:"",NODE_ENV:"test",NSD_QA_ADMIN:"0"},stdio:["ignore","pipe","pipe"]});
child.stdout.on("data",d=>logs.push(String(d)));child.stderr.on("data",d=>logs.push(String(d)));
function assert(v,m){if(!v)throw new Error(m);}
async function waitServer(){const end=Date.now()+10000;while(Date.now()<end){if(child.exitCode!==null)throw new Error("server exited\n"+logs.join(""));try{const r=await fetch(base+"/");if(r.ok)return}catch{}await sleep(100)}throw new Error("server timeout");}
async function post(route,body){const r=await fetch(base+route,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});return {status:r.status,body:await r.json().catch(()=>null)}}
class Probe{
  constructor(name){this.name=name;this.msg=[];this.ws=null;}
  async open(){this.ws=new WebSocket(wsUrl);await new Promise((ok,bad)=>{const t=setTimeout(()=>bad(new Error(this.name+" ws timeout")),5000);this.ws.once("open",()=>{clearTimeout(t);ok()});this.ws.once("error",bad)});this.ws.on("message",b=>{try{this.msg.push(JSON.parse(String(b)))}catch{}});return this}
  send(type,data={}){this.ws.send(JSON.stringify({type,...data}))}
  clear(){this.msg=[]}
  async wait(pred,label,ms=7000){const end=Date.now()+ms;while(Date.now()<end){const m=this.msg.find(pred);if(m)return m;await sleep(25)}throw new Error(this.name+" timeout "+label+" seen="+this.msg.map(x=>x.type).join(","))}
  type(type,ms=7000){return this.wait(m=>m.type===type,type,ms)}
  close(){try{this.ws.close()}catch{}}
}
(async()=>{
  try{
    await waitServer();
    const suffix=(Date.now().toString(36)+Math.random().toString(36).slice(2,7)).replace(/[^a-z0-9]/g,"").slice(-10);
    const a={username:("duoa_"+suffix).slice(0,24),password:"DuoPass_A987",displayName:"Host "+suffix.slice(-4)};
    const b={username:("duob_"+suffix).slice(0,24),password:"DuoPass_B987",displayName:"Guest "+suffix.slice(-4)};
    const ra=await post("/api/auth/register",a),rb=await post("/api/auth/register",b);
    assert(ra.status===200&&ra.body?.ok,"host register failed");
    assert(rb.status===200&&rb.body?.ok,"guest register failed");

    const host=await new Probe("host").open(),guest=await new Probe("guest").open();
    host.send("resumeSession",{token:ra.body.session.token});guest.send("resumeSession",{token:rb.body.session.token});
    await host.type("authSuccess");await guest.type("authSuccess");

    // Social request/accept must be server-authoritative and visible to both accounts.
    host.clear();guest.clear();host.send("accountFriendAdd",{username:b.username});
    await host.wait(m=>m.type==="notice"&&/Запрос в друзья отправлен|friend request/i.test(String(m.text||"")),"friend request sent");
    guest.send("accountFriendSync");
    const guestSocial=await guest.wait(m=>m.type==="metaState"&&m.meta?.account?.friendRequests?.incoming?.some(x=>x.username===a.username),"incoming friend request");
    assert(guestSocial.meta.account.friendRequests.incoming.some(x=>x.username===a.username),"guest missing incoming request");
    guest.clear();guest.send("accountFriendAccept",{username:a.username});
    await guest.wait(m=>m.type==="notice"&&/Запрос принят|accepted/i.test(String(m.text||"")),"friend request accepted");
    host.clear();host.send("accountFriendSync");
    const hostFriends=await host.wait(m=>m.type==="metaState"&&m.meta?.account?.friends?.some(x=>x.username===b.username),"host friend list");
    assert(hostFriends.meta.account.friends.some(x=>x.username===b.username),"host missing accepted friend");

    // Starter silver should be enough to buy and equip the cheapest cosmetic.
    host.clear();host.send("metaCosmeticBuy",{id:"wa"});
    const bought=await host.wait(m=>m.type==="metaState"&&m.meta?.cosmeticsOwned?.includes("wa"),"cosmetic buy");
    assert(bought.meta.cosmeticsOwned.includes("wa"),"cosmetic ownership missing after buy");
    host.clear();host.send("metaCosmeticEquip",{slot:"weapon",id:"wa"});
    const equipped=await host.wait(m=>m.type==="metaState"&&m.meta?.equippedCosmetics?.weapon==="wa","cosmetic equip");
    assert(equipped.meta.equippedCosmetics.weapon==="wa","cosmetic did not equip");

    host.send("createRoom",{mode:"duo",character:"starter"});
    const hj=await host.type("joined");
    assert(hj.mode==="duo"&&hj.isHost===true,"host room metadata wrong");
    guest.send("join",{room:hj.code,character:"starter"});
    const gj=await guest.type("joined");
    assert(gj.mode==="duo"&&gj.isHost===false,"guest room metadata wrong");
    assert(gj.code===hj.code,"guest joined a different room");
    const hostRoster=await host.wait(m=>m.type==="roster"&&m.players?.length===2,"2-player roster");
    const guestRoster=await guest.wait(m=>m.type==="roster"&&m.players?.length===2,"guest roster");
    assert(hostRoster.hostId===hj.playerId&&guestRoster.hostId===hj.playerId,"host identity changed");

    // Non-host must not be able to start or skip.
    guest.clear();guest.send("start");
    const startDenied=await guest.wait(m=>m.type==="notice"&&/создатель|creator/i.test(String(m.text||"")),"guest start denial");
    assert(!!startDenied,"guest could start duo");

    host.clear();guest.clear();host.send("start");
    const hs=await host.wait(m=>m.type==="snapshot"&&m.state?.started===true&&m.state?.playerCount===2,"host started snapshot",8000);
    const gs=await guest.wait(m=>m.type==="snapshot"&&m.state?.started===true&&m.state?.playerCount===2,"guest started snapshot",8000);
    assert(hs.state.phase==="day"&&gs.state.phase==="day","duo did not enter prep phase");

    guest.clear();guest.send("skipPrep");
    const skipDenied=await guest.wait(m=>m.type==="notice"&&/создателю|creator|host/i.test(String(m.text||"")),"guest skip denial");
    assert(!!skipDenied,"guest could skip prep");

    host.clear();guest.clear();host.send("skipPrep");
    await host.wait(m=>m.type==="snapshot"&&m.state?.phase==="night"&&m.state?.playerCount===2,"host night",8000);
    await guest.wait(m=>m.type==="snapshot"&&m.state?.phase==="night"&&m.state?.playerCount===2,"guest night",8000);

    // Guest reconnect must preserve slot and room.
    const guestId=gj.playerId;guest.close();await sleep(120);
    const guest2=await new Probe("guest-reconnect").open();
    guest2.send("resumeSession",{token:rb.body.session.token});
    await guest2.wait(m=>m.type==="authSuccess"&&m.reconnected===true,"guest reconnect auth",5000);
    const rec=await guest2.type("reconnected",5000);
    assert(rec.playerId===guestId&&rec.code===hj.code&&rec.started===true,"guest reconnect lost room/player");
    const rs=await guest2.wait(m=>m.type==="snapshot"&&m.state?.playerCount===2&&m.state?.started===true,"reconnect duo snapshot",5000);
    assert(rs.state.paused===false,"duo unexpectedly paused on disconnect");

    guest2.send("leaveToLobby");await guest2.type("returnedToLobby");
    host.send("leaveToLobby");await host.type("returnedToLobby");
    guest2.close();host.close();
    console.log("[duo-audit] PASS social/cosmetics/join/host-authority/start/skip/two-player/reconnect");
  }finally{try{child.kill("SIGTERM")}catch{}}
})().catch(err=>{console.error("[duo-audit] FAIL",err?.stack||err);console.error(logs.join(""));try{child.kill("SIGKILL")}catch{};process.exit(1)});
