"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),read=f=>fs.readFileSync(path.join(root,f),"utf8");

test("password reveal is self-contained in the button markup",()=>{
  const html=read("public/index.html"),client=read("public/client.js");
  assert.match(html,/data-password-target="loginPassword"[^>]*onclick=/);
  assert.match(html,/data-password-target="registerPassword"[^>]*onclick=/);
  assert.doesNotMatch(client,/document\.querySelectorAll\("\[data-password-target\]"\)/);
});

test("duplicate weapon strip is removed and the hotbar has final compact overrides",()=>{
  const client=read("public/client.js"),css=read("public/style.css");
  assert.doesNotMatch(client,/Compact ammo strip above the hotbar/);
  assert.doesNotMatch(client,/stripW=tiny\?210:250/);
  assert.match(css,/DREAD SHIFT UI HUD fix 2026-09-18/);
  assert.match(css,/#hotbar\.hotbar\{[\s\S]*?width:max-content!important[\s\S]*?max-width:calc\(100vw - 28px\)!important/);
  assert.match(css,/#hotbar \.weapon-slot\{[\s\S]*?width:108px!important[\s\S]*?height:76px!important/);
  assert.match(css,/#hotbar \.slot\{[\s\S]*?width:62px!important[\s\S]*?height:76px!important/);
});

test("generator shop and upgrades are preparation-only and close at night",()=>{
  const client=read("public/client.js");
  assert.match(client,/const prep=state\?\.started&&state\?\.phase==="day";/);
  assert.match(client,/el\.classList\.toggle\("hidden",!near\)/);
  assert.match(client,/state\?\.started&&state\?\.phase!=="day"/);
  assert.match(client,/runShopOverlay\?\.classList\.contains\("visible"\).*closeRunShop\(\)/s);
  assert.match(client,/runUpgradeOverlay\?\.classList\.contains\("visible"\).*closeRunUpgrade\(\)/s);
});

test("What's New is forcibly hidden for active runs",()=>{
  const client=read("public/client.js"),css=read("public/style.css");
  assert.match(client,/openWhatsNewBtn.*classList\.toggle\("ds-run-hidden",inRun\)/);
  assert.match(client,/if\(inRun\).*whatsNewOverlay.*classList\.remove\("visible"\)/);
  assert.match(css,/\.ds-run-hidden\{display:none!important\}/);
});

test("UI HUD patch runs after restore and before final lobby polish",()=>{
  const pkg=JSON.parse(read("package.json")),cmd=pkg.scripts["patch:runtime"];
  const restore=cmd.indexOf("dread_shift_restore_all_patch.js"),hud=cmd.indexOf("dread_shift_ui_hud_fix_patch.js"),polish=cmd.indexOf("dread_shift_ui_polish_patch.js");
  assert.ok(restore>=0&&hud>restore&&polish>hud);
});
