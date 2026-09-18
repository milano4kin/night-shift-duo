"use strict";
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
function read(rel){try{return fs.readFileSync(path.join(root,rel),"utf8")}catch{return ""}}
const server=read("server.js"),client=read("public/client.js"),html=read("public/index.html"),css=read("public/style.css");
const finalReady=
  server.includes('const BUILD_VERSION = "8.9.9";') &&
  server.includes("/* DREAD SHIFT full restore 2026-09-13 server */") &&
  client.includes("/* DREAD SHIFT v8.9.9 client */") &&
  client.includes("function openCodes(") &&
  client.includes("function pushNotification(") &&
  html.includes('id="codesOverlay"') &&
  html.includes('id="notificationBell"') &&
  css.includes("DREAD SHIFT restore-all notification center") &&
  server.includes("/* DREAD SHIFT runtime revision 2026-09-18-deep1 */") &&
  client.includes("/* DREAD SHIFT runtime revision 2026-09-18-deep1 */");
if(finalReady){
  console.log("DREAD SHIFT runtime guard: final v8.9.9 runtime already applied; skipping mutation chain.");
  process.exit(0);
}
console.log("DREAD SHIFT runtime guard: source runtime needs patching.");
process.exit(1);
