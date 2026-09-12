"use strict";
const fs=require("fs"),path=require("path"),crypto=require("crypto");
const {minify}=require("terser");
const ROOT=path.join(__dirname,".."),PUBLIC=path.join(ROOT,"public"),ASSETS=path.join(PUBLIC,"assets"),CLIENT=path.join(PUBLIC,"client.js"),INDEX=path.join(PUBLIC,"index.html"),SERVER=path.join(ROOT,"server.js");
function must(cond,msg){if(!cond)throw new Error(`[protect-client] ${msg}`)}
(async()=>{
  must(fs.existsSync(CLIENT),"public/client.js missing before production build");
  const source=fs.readFileSync(CLIENT,"utf8");
  must(source.includes("DREAD SHIFT v8.9 client"),"v8.9 client marker missing; release runtime is incomplete");
  const result=await minify(source,{ecma:2022,compress:{passes:3,drop_debugger:true},mangle:{toplevel:true},format:{comments:false,semicolons:true},sourceMap:false});
  must(result&&result.code&&result.code.length>1000,"terser returned an empty bundle");
  new Function(result.code);
  fs.mkdirSync(ASSETS,{recursive:true});
  for(const name of fs.readdirSync(ASSETS))if(/^game\.[a-f0-9]{12}\.min\.js(?:\.map)?$/i.test(name))fs.rmSync(path.join(ASSETS,name),{force:true});
  const hash=crypto.createHash("sha256").update(result.code).digest("hex").slice(0,12),fileName=`game.${hash}.min.js`,rel=`assets/${fileName}`,out=path.join(PUBLIC,rel);
  fs.writeFileSync(out,result.code,"utf8");
  let html=fs.readFileSync(INDEX,"utf8");
  const scriptRe=/<script\s+src=["'](?:client\.js|assets\/game\.[a-f0-9]{12}\.min\.js)["']\s*><\/script>/i;
  must(scriptRe.test(html),"index.html client script tag not found");
  html=html.replace(scriptRe,`<script src="${rel}"></script>`);
  fs.writeFileSync(INDEX,html,"utf8");
  fs.rmSync(CLIENT,{force:true});
  let server=fs.readFileSync(SERVER,"utf8");
  if(!server.includes("/* PROD_CLIENT_GUARD */")){
    const requestPathMarker='  const requestPath=req.url.split("?")[0];';
    const urlMarker='  let url=req.url.split("?")[0];';
    must(server.includes(requestPathMarker)||server.includes(urlMarker),"server static request marker not found");
    if(server.includes(requestPathMarker))server=server.replace(requestPathMarker,requestPathMarker+'\n  /* PROD_CLIENT_GUARD */\n  if(requestPath==="/client.js"||requestPath.startsWith("/src/")||requestPath.endsWith(".map")){res.writeHead(404,{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});return res.end("Not found");}');
    else server=server.replace(urlMarker,urlMarker+'\n  /* PROD_CLIENT_GUARD */\n  if(url==="/client.js"||url.startsWith("/src/")||url.endsWith(".map")){res.writeHead(404,{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});return res.end("Not found");}');
    fs.writeFileSync(SERVER,server,"utf8");
  }
  must(!fs.existsSync(CLIENT),"readable client.js still exists in public");
  must(!fs.existsSync(out+".map"),"source map must not be emitted");
  console.log(`[protect-client] protected ${source.length} bytes -> ${result.code.length} bytes (${rel}); readable client removed`);
})().catch(err=>{console.error(err&&err.stack?err.stack:err);process.exit(1)});
