"use strict";
const fs=require("node:fs"),path=require("node:path");
const file=r=>path.join(__dirname,r),read=r=>fs.readFileSync(file(r),"utf8"),write=(r,s)=>fs.writeFileSync(file(r),s,"utf8");
const marker="/* DREAD SHIFT Yandex backend 2026-09-18 */";
let s=read("server.js");
if(s.includes(marker)){console.log("Yandex backend patch already applied.");process.exit(0);}

const authAnchor="function authenticateAccount(username,password){";
if(!s.includes(authAnchor))throw new Error("yandex-backend: authenticateAccount anchor missing");
const helpers=[
'function normalizeYandexPlayerId(value){const id=String(value||"").trim();return id.length>=6&&id.length<=180?id:"";}',
'function yandexAccountKey(playerId){return "yx_"+crypto.createHash("sha256").update(String(playerId)).digest("hex").slice(0,20);}',
'function yandexDisplayName(value,playerId){let base=cleanDisplayName(value)||"Player";if(base.length<2)base="Player";if(!accountNameTaken(base))return base;const suffix=crypto.createHash("sha256").update(String(playerId)).digest("hex").slice(0,4);return cleanDisplayName(("Player "+suffix).slice(0,18));}',
'function getOrCreateYandexAccount(playerId,displayName){',
'  playerId=normalizeYandexPlayerId(playerId);if(!playerId)return {error:"Некорректный Yandex Player ID"};',
'  const username=yandexAccountKey(playerId),idHash=crypto.createHash("sha256").update(playerId).digest("hex");',
'  let account=accounts[username],starterGift=false;',
'  if(!account){',
'    const salt=crypto.randomBytes(16).toString("hex"),disabledPassword=crypto.randomBytes(32).toString("base64url");',
'    account=normalizeAccount({username,displayName:yandexDisplayName(displayName,playerId),salt,passwordHash:hashPassword(disabledPassword,salt),createdAt:new Date().toISOString(),renameAvailableAt:0,onboarding:defaultOnboarding(),accountLevel:1,accountXp:0,accountNextXp:100,tutorial:{active:false,step:0,kills:0},platform:"yandex",platformIdHash:idHash});',
'    accounts[username]=account;saveAccounts();',
'    const prog=loadProgress(username);prog.profile=username;prog.silver=Math.max(0,Number(prog.silver)||0)+200;prog.crateTokens=Math.max(0,Number(prog.crateTokens)||0)+1;saveProgress(prog);starterGift=true;',
'  }else{normalizeAccount(account);account.platform="yandex";account.platformIdHash=idHash;if(displayName&&!account.displayName){account.displayName=yandexDisplayName(displayName,playerId);}saveAccounts();}',
'  return {account,starterGift};',
'}',
''
].join("\n");
s=s.replace(authAnchor,helpers+authAnchor);

const reqAnchor='  const requestPath=req.url.split("?")[0];';
if(!s.includes(reqAnchor))throw new Error("yandex-backend: requestPath anchor missing");
const route=[
reqAnchor,
'  const yandexCors={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"POST, OPTIONS"};',
'  if(requestPath==="/api/yandex/session"&&req.method==="OPTIONS"){res.writeHead(204,yandexCors);res.end();return;}',
'  if(requestPath==="/api/yandex/session"&&req.method==="POST"){',
'    let bodyText="";req.setEncoding("utf8");',
'    req.on("data",chunk=>{if(bodyText.length<=8192)bodyText+=chunk;});',
'    req.on("end",()=>{',
'      const json=(status,payload)=>{res.writeHead(status,yandexCors);res.end(JSON.stringify(payload));};',
'      if(bodyText.length>8192)return json(413,{ok:false,message:"Request too large"});',
'      let body;try{body=JSON.parse(bodyText||"{}");}catch{return json(400,{ok:false,message:"Bad JSON"});}',
'      try{const result=getOrCreateYandexAccount(body.playerId,body.displayName);if(result.error)return json(400,{ok:false,message:result.error});const account=result.account,session=issueAccountSession(account),target=loadMetaTarget(account.username,account);return json(200,{ok:true,account:publicAccountSnapshot(account,target),session,starterGift:!!result.starterGift});}catch(err){console.error("[YANDEX AUTH]",err?.stack||err);return json(500,{ok:false,message:"Yandex session error"});}',
'    });return;',
'  }'
].join("\n");
s=s.replace(reqAnchor,route);

const snapshotOld='return {username:account.username,displayName:account.displayName,createdAt:account.createdAt,renameAvailableAt:account.renameAvailableAt,accountLevel:account.accountLevel,accountXp:account.accountXp,accountNextXp:account.accountNextXp,onboarding:{...account.onboarding},tutorial:{...account.tutorial},featureUnlocks:featureUnlocksFor(account,prog||loadProgress(account.username))};';
if(s.includes(snapshotOld)){
  s=s.replace(snapshotOld,'return {username:account.username,displayName:account.displayName,platform:account.platform||"web",createdAt:account.createdAt,renameAvailableAt:account.renameAvailableAt,accountLevel:account.accountLevel,accountXp:account.accountXp,accountNextXp:account.accountNextXp,onboarding:{...account.onboarding},tutorial:{...account.tutorial},featureUnlocks:featureUnlocksFor(account,prog||loadProgress(account.username))};');
}

const metaAnchor='    if(m.type==="getMeta"){';
if(!s.includes(metaAnchor))throw new Error("yandex-backend: getMeta anchor missing");
const reward=[
'    if(m.type==="yandexRewarded"){',
'      if(account.platform!=="yandex")return send(ws,"notice",{text:"Rewarded ads are available only in Yandex Games"});',
'      const now=Date.now(),last=Math.max(0,Number(account.yandexRewardAt)||0);',
'      if(now-last<60000)return send(ws,"notice",{text:"Бонус за рекламу уже получен. Попробуйте позже."});',
'      const target=p||loadMetaTarget(account.username,account);target.gold=Math.max(0,Number(target.gold)||0)+20;account.yandexRewardAt=now;saveProgress(target);saveAccounts();sendMeta(ws,target);send(ws,"notice",{text:"🎬 +20 золота за просмотр рекламы"});return;',
'    }',
''
].join("\n");
s=s.replace(metaAnchor,reward+metaAnchor);

for(const needle of ['/api/yandex/session','getOrCreateYandexAccount','m.type==="yandexRewarded"','platform:account.platform||"web"'])if(!s.includes(needle))throw new Error("yandex-backend verification failed: "+needle);
s+="\n"+marker+"\n";
new Function(s);
write("server.js",s);
console.log("DREAD SHIFT Yandex backend patch applied.");
