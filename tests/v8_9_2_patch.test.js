"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");

test("v8.9.2 keeps only build resources in the run HUD and enlarges the panel",()=>{
  const p=read("dread_shift_v8_9_2_patch.js");
  assert.match(p,/const res=\[\['🪵'.*'Дерево'.*\['🪨'.*'Камень'.*\['⚙'.*'Металл'/s);
  assert.match(p,/rpW=Math\.min\(360,Math\.round\(rightW\*1\.45\)\)/);
  assert.match(p,/rowH=\(rpH-16\)\/3/);
  assert.match(p,/run HUD still contains silver/);
});

test("v8.9.2 renders dedicated character skins instead of relying on the old filter",()=>{
  const p=read("dread_shift_v8_9_2_patch.js");
  for(const id of ["cf","cr","cb","cw"])assert.match(p,new RegExp('"'+id+'"'));
  assert.match(p,/V892_SKIN_PALETTES/);
  assert.match(p,/v892PaintSkin/);
  assert.match(p,/v892SkinForPlayer/);
  assert.match(p,/v892-skin-preview/);
  assert.match(p,/v88Cos=function/);
});

test("v8.9.2 remains in the canonical release chain before client protection",()=>{
  const pkg=require(path.join(root,"package.json"));
  assert.equal(pkg.version,"8.9.9");
  assert.match(pkg.scripts["patch:runtime"],/dread_shift_v8_9_patch\.js && node dread_shift_v8_9_2_patch\.js/);
  assert.equal(pkg.scripts["build:prod"],"npm run patch:runtime && node scripts/protect_client.js");
});
