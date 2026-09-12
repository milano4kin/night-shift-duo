"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");

test("full restore keeps lobby INDEX and CODES",()=>{
  const html=read("public/index.html"),client=read("public/client.js"),server=read("server.js");
  assert.match(html,/id="lobbySideActions"/);
  assert.match(html,/id="codesOverlay"/);
  assert.match(client,/function openCodes\(/);
  assert.match(server,/const DEVELOPER_CODES=/);
  assert.match(server,/WELCOME:\{display:"Welcome",silver:300,gold:25,crateTokens:1\}/);
  assert.match(server,/TEST:\{display:"TEST",silver:150,gold:10,crateTokens:0\}/);
  assert.match(server,/index:true/);
});

test("full restore keeps reliability and gameplay regressions fixed",()=>{
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

test("restore patch is last in runtime chain",()=>{
  const pkg=JSON.parse(read("package.json"));
  const cmd=pkg.scripts["patch:runtime"];
  assert.match(cmd,/lobby_tools_patch\.js/);
  assert.match(cmd,/lobby_visibility_patch\.js/);
  assert.match(cmd,/lobby_layer_patch\.js/);
  assert.ok(cmd.lastIndexOf("dread_shift_restore_full_patch.js")>cmd.lastIndexOf("dread_shift_v8_9_9_4_patch.js"));
});
