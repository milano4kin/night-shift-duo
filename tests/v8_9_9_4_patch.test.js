"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),read=f=>fs.readFileSync(path.join(root,f),"utf8");

test("hotbar keeps weapon, names and prices inside their slots",()=>{
  const css=read("public/style.css");
  assert.match(css,/DREAD SHIFT v8\.9\.9\.4 hotbar fit/);
  assert.match(css,/#hotbar \.weapon-slot\{[^}]*width:112px!important[^}]*height:88px!important[^}]*overflow:hidden!important/);
  assert.match(css,/#hotbar \.weapon-slot \.slot-name\{[^}]*width:98px!important[^}]*white-space:normal!important[^}]*text-align:center!important/);
  assert.match(css,/#hotbar \.slot-name\{[^}]*-webkit-line-clamp:2!important[^}]*overflow:hidden!important/);
  assert.match(css,/#hotbar \.slot\.build \.slot-cost\{[^}]*overflow:hidden!important/);
  assert.match(css,/#hotbar \.slot\.build \.slot-cost\{[^}]*white-space:normal!important/);
  assert.match(css,/#hotbar \.build-slot-img\{[^}]*width:38px!important[^}]*height:36px!important/);
});

test("hotbar fit is the final runtime patch",()=>{
  const pkg=require(path.join(root,"package.json"));
  assert.match(pkg.scripts["patch:runtime"],/dread_shift_v8_9_9_3_patch\.js && node dread_shift_v8_9_9_4_patch\.js$/);
});
