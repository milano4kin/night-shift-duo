"use strict";
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),pub=path.join(root,"public");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("public/index.html"),client=read("public/client.js"),css=read("public/style.css"),server=read("server.js");
const failures=[],warnings=[];
const fail=(m)=>failures.push(m),warn=(m)=>warnings.push(m);

function allFiles(dir){
  const out=[];
  for(const name of fs.readdirSync(dir)){
    const full=path.join(dir,name),st=fs.statSync(full);
    if(st.isDirectory())out.push(...allFiles(full));else out.push(full);
  }
  return out;
}

// HTML id integrity.
const htmlIds=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
const seen=new Set();
for(const id of htmlIds){if(seen.has(id))fail("duplicate HTML id: "+id);seen.add(id);}

// IDs created dynamically in client markup count as valid definitions too.
const dynamicIds=[...client.matchAll(/\bid=\\?["']([^"'<>\\]+)\\?["']/g)].map(m=>m[1]);
const defined=new Set([...htmlIds,...dynamicIds]);
const refs=new Set();
for(const re of [
  /\$\(["']([^"']+)["']\)/g,
  /getElementById\(["']([^"']+)["']\)/g,
  /querySelector\(["']#([A-Za-z0-9_-]+)["']\)/g
]){
  for(const m of client.matchAll(re))refs.add(m[1]);
}
const missing=[...refs].filter(id=>!defined.has(id)).sort();
const harmlessOptional=new Set();
const hardMissing=missing.filter(id=>!harmlessOptional.has(id));
if(hardMissing.length)fail("literal DOM references without any HTML/dynamic id definition: "+hardMissing.join(", "));
for(const id of missing.filter(id=>harmlessOptional.has(id)))warn("dead optional DOM reference: "+id);

// Asset integrity for literal references.
const diskAssets=new Set(allFiles(path.join(pub,"assets")).map(f=>path.relative(pub,f).replaceAll(path.sep,"/")));
const assetRefs=new Set();
for(const source of [html,client,css]){
  for(const m of source.matchAll(/(?:^|["'(=\s])\/?(assets\/[A-Za-z0-9_.\/-]+\.(?:png|jpe?g|webp|svg|wav|mp3|ogg))/gi))assetRefs.add(m[1]);
}
const missingAssets=[...assetRefs].filter(a=>!diskAssets.has(a)).sort();
if(missingAssets.length)fail("missing literal assets: "+missingAssets.join(", "));

// Core restored UI and runtime.
for(const id of ["notificationBell","notificationCenter","openWhatsNewBtn","indexBookBtn","codesBtn","codesOverlay","lobbySideActions"]){
  if(!html.includes('id="'+id+'"'))fail("required lobby UI missing: "+id);
}
for(const marker of [
  "DREAD SHIFT v8.9.9 client",
  "function openCodes(",
  "function pushNotification(",
  "smoothPets=new Map()",
  "fetch(\`/api/auth/\${type}\`"
]){
  if(!client.includes(marker))fail("required client runtime marker missing: "+marker);
}
for(const marker of [
  'const BUILD_VERSION = "8.9.9";',
  'WELCOME:{display:"Welcome",silver:300,gold:25,crateTokens:1}',
  'TEST:{display:"TEST",silver:150,gold:10,crateTokens:0}',
  'room.phaseTimer=30;',
  'RUN_MILESTONE_REWARDS',
  'requestPath==="/api/auth/register"',
  'WS_MAX_PAYLOAD = 64 * 1024',
  'WS_MAX_MESSAGES_PER_SEC = 180'
]){
  if(!server.includes(marker))fail("required server runtime marker missing: "+marker);
}

// Security / trust boundaries.
if(!server.includes("Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(rotation)"))fail("build coordinates are not finite-checked");
if(!server.includes("if(!allowMessage())return;"))fail("WS per-connection rate limit not enforced");
if(!server.includes("maxPayload:WS_MAX_PAYLOAD"))fail("WS max payload not configured");
if(!server.includes('file!==publicRoot&&!file.startsWith(publicRoot+path.sep)')&&!server.includes('if(!file.startsWith(PUBLIC))'))fail("static root traversal guard missing");
if(!server.includes('if(bodyText.length>8192)'))fail("HTTP auth body limit missing");
if(!server.includes('typeof allowAuthAttempt==="function"&&!allowAuthAttempt(req)'))fail("HTTP auth bypasses auth rate limiter");
if(!server.includes("while(authAttemptBuckets.size>2048)"))fail("auth throttle map is not hard-capped");
if(!server.includes('if(m.type==="redeemCode")')||!server.includes('send(ws,"codeRedeemResult",result)'))fail("promo code websocket handler missing");
if(!server.includes("rewardMilestones:Array.isArray(x.rewardMilestones)"))fail("run history reward metadata is not preserved by normalization");
if(server.includes("spikeContactState.get(")&&!server.includes("const spikeContactState=new Map();"))fail("spike runtime references an undefined contact-state map");
if(/NSD_QA_ADMIN[^\n]+production/.test(server)===false)warn("could not prove QA admin is disabled in production");

// Known dangerous leftovers / regressions.
if(client.includes('confirm("Открыть ящик за 50 золота?")'))fail("native crate confirm regression returned");
if(client.includes("\\nconst v88A=()=>"))fail("malformed escaped v8.8 extension remains");
if(server.includes("room.phaseTimer=first?15:21;"))fail("old preparation timer survived final runtime");
if(server.includes("if(d>22){const step=Math.min(d,Math.min(185,55+d*.42)*dt)"))fail("old teleport-like pet dead-zone survived final runtime");

// Sanity: no unresolved conflict markers.
for(const [name,source] of [["server.js",server],["client.js",client],["index.html",html],["style.css",css]]){
  if(/^(<<<<<<<|=======|>>>>>>>)/m.test(source))fail("merge conflict marker in "+name);
}

// Report TODO/FIXME in live runtime, but do not fail automatically.
for(const [name,source] of [["server.js",server],["client.js",client]]){
  const hits=(source.match(/\b(?:TODO|FIXME|HACK|XXX)\b/gi)||[]).length;
  if(hits)warn(name+" contains "+hits+" TODO/FIXME/HACK markers");
}

console.log("[deep-static-audit] html ids:",htmlIds.length,"client refs:",refs.size,"literal assets:",assetRefs.size);
for(const w of warnings)console.warn("[deep-static-audit] WARN:",w);
if(failures.length){
  for(const f of failures)console.error("[deep-static-audit] FAIL:",f);
  process.exit(1);
}
console.log("[deep-static-audit] PASS");
