"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");

test("single restore keeps lobby bell, What's New, INDEX and CODES",()=>{
  const html=read("public/index.html"),client=read("public/client.js"),server=read("server.js"),css=read("public/style.css");
  for(const id of ["notificationBell","openWhatsNewBtn","lobbySideActions","indexBookBtn","codesBtn","codesOverlay"])assert.match(html,new RegExp('id="'+id+'"'));
  assert.match(client,/function pushNotification\\(/);\n  assert.match(html,/id="notificationCenter"/);
  assert.match(client,/function openCodes\(/);
  assert.match(css,/restore-whats-new/);
  assert.match(server,/const DEVELOPER_CODES=/);
  assert.match(server,/WELCOME:\{display:"Welcome",silver:300,gold:25,crateTokens:1\}/);
  assert.match(server,/TEST:\{display:"TEST",silver:150,gold:10,crateTokens:0\}/);
  assert.match(server,/index:true/);
});

test("single restore keeps reliability and gameplay regressions fixed",()=>{
  const server=read("server.js"),client=read("public/client.js"),html=read("public/index.html"),css=read("public/style.css");
  assert.match(server,/room\.phaseTimer=30;/);
  assert.match(server,/requestPath==="\/api\/auth\/register"/);
  assert.match(client,/fetch\(`\/api\/auth\/\$\{type\}`/);
  assert.match(server,/RUN_MILESTONE_REWARDS/);
  assert.match(client,/death-reward-stat/);
  assert.match(server,/if\(d>\.25\)\{const speed=Math\.min\(245,90\+d\*\.52\)/);
  assert.match(client,/smoothPets=new Map\(\)/);
  assert.doesNotMatch(client,/confirm\("Открыть ящик за 50 золота\?"\)/);
  assert.match(html,/data-password-target="loginPassword"/);
  assert.match(html,/data-password-target="registerPassword"/);
  assert.match(css,/GENERATOR · LVL/);
});

test("only the consolidated restore layer runs after v8.9.9.4",()=>{
  const pkg=JSON.parse(read("package.json")),cmd=pkg.scripts["patch:runtime"];
  assert.ok(cmd.lastIndexOf("dread_shift_restore_all_patch.js")>cmd.lastIndexOf("dread_shift_v8_9_9_4_patch.js"));
  assert.doesNotMatch(cmd,/lobby_tools_patch\.js|lobby_visibility_patch\.js|lobby_layer_patch\.js|dread_shift_restore_full_patch\.js/);
});
