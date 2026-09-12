"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),read=f=>fs.readFileSync(path.join(root,f),"utf8");

test("snapped wall visual length matches its logical 96px footprint",()=>{
  const client=read("public/client.js");
  assert.match(client,/const WALL_HALF_LEN=48/);
  assert.match(client,/wall:\{w:96,h:50\}/);
  assert.doesNotMatch(client,/wall:\{w:128,h:50\}/);
});

test("talent dock sits below the kill streak HUD",()=>{
  const css=read("public/style.css");
  assert.match(css,/\.talent-dock,\.talent-dock\.collapsed\{top:244px!important\}/);
});

test("tower prices stay visible and dynamically refreshed",()=>{
  const client=read("public/client.js"),css=read("public/style.css"),html=read("public/index.html");
  assert.match(client,/v899BuildCostLabel/);
  assert.match(client,/const price=b\.querySelector\("\.slot-cost"\);if\(price\)price\.textContent=v899BuildCostLabel\(cost\)/);
  assert.match(css,/\.slot\.build \.slot-cost\{display:block!important;visibility:visible!important;opacity:1!important/);
  for(const type of ["cannon","tesla","cat_tower","frost_tower","flame_tower"]){
    assert.match(html,new RegExp(`data-build="${type}"[\\s\\S]*?slot-cost`));
  }
});

test("wall HUD polish remains before tower range and wall group patch",()=>{
  const pkg=require(path.join(root,"package.json"));
  assert.match(pkg.scripts["patch:runtime"],/dread_shift_v8_9_9_1_patch\.js && node dread_shift_v8_9_9_2_patch\.js && node dread_shift_v8_9_9_3_patch\.js/);
});
