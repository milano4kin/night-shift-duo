"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),read=f=>fs.readFileSync(path.join(root,f),"utf8");

test("login placeholder is neutral",()=>{
  const html=read("public/index.html");
  assert.match(html,/placeholder="например: Player123"/);
  assert.doesNotMatch(html,/placeholder="например milano4kin"/);
});

test("password eye is self-contained and cannot double-toggle",()=>{
  const html=read("public/index.html"),client=read("public/client.js");
  assert.match(html,/data-password-target="loginPassword"[^>]*onclick=/);
  assert.match(html,/data-password-target="registerPassword"[^>]*onclick=/);
  assert.doesNotMatch(client,/document\.querySelectorAll\("\[data-password-target\]"\)/);
});

test("lobby gear opens the existing settings panel",()=>{
  const client=read("public/client.js"),css=read("public/style.css");
  assert.match(client,/function openLobbySettings\(\)/);
  assert.match(client,/quickSettingsBtn"\)\.onclick=.*openLobbySettings/);
  assert.match(client,/lobbySettingsVisible/);
  assert.match(css,/\.quick-settings-btn\.lobby-settings/);
  assert.match(css,/\.pause-overlay\.lobby-settings-open/);
});

test("death reward and What's New have final visual polish",()=>{
  const html=read("public/index.html"),client=read("public/client.js"),css=read("public/style.css");
  assert.match(html,/DREAD SHIFT · UPDATE 8\.9\.9/);
  assert.match(html,/ПОСЛЕДНИЕ ИЗМЕНЕНИЯ/);
  assert.match(client,/death-reward-stat/);
  assert.match(css,/\.death-reward-stat:before/);
  assert.match(css,/\.whats-new-overlay/);
  assert.match(css,/\.whats-new-card h2:after/);
});

test("polish patch is the last runtime UI layer",()=>{
  const pkg=JSON.parse(read("package.json")),cmd=pkg.scripts["patch:runtime"];
  const hud=cmd.indexOf("dread_shift_ui_hud_fix_patch.js"),polish=cmd.indexOf("dread_shift_ui_polish_patch.js");
  assert.ok(hud>=0&&polish>hud);
});
