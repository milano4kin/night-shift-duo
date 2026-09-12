"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),read=f=>fs.readFileSync(path.join(root,f),"utf8");

test("v8.9.8 uses the requested permanent upgrade values",()=>{
  const server=read("server.js"),client=read("public/client.js");
  const expected={
    damage:[3,7,15,35,100],reload:[4,9,16,24,35],health:[10,40,75,150,220],speed:[4,7,13,19,30],magazine:[10,20,35,50,75],gather:[5,12,30,60,100],building:[5,22,40,65,145]
  };
  for(const [key,values] of Object.entries(expected)){
    const valuesText=values.join(",");
    assert.match(server,new RegExp(`${key}:\\{name:[^\\n]+bonuses:\\[${valuesText}\\]`));
    assert.match(client,new RegExp(`${key}:\\{name:[^\\n]+bonuses:\\[${valuesText}\\]`));
  }
});

test("upgrade cards show current bonus and the exact next tier",()=>{
  const client=read("public/client.js"),css=read("public/style.css");
  assert.match(client,/currentValue=lvl\?cfg\.bonuses\[lvl-1\]:0/);
  assert.match(client,/nextValue=max\?null:cfg\.bonuses\[lvl\]/);
  assert.match(client,/T\("Сейчас","Current"\)/);
  assert.match(client,/T\("Следующий","Next"\)/);
  assert.match(client,/currentBonus/);
  assert.match(client,/nextBonus/);
  assert.match(css,/\.upgrade-next/);
  assert.match(css,/\.upgrade-arrow/);
  assert.doesNotThrow(()=>new Function(client));
});

test("v8.9.9 is the protected production release",()=>{
  const pkg=require(path.join(root,"package.json")),lock=require(path.join(root,"package-lock.json")),protect=read("scripts/protect_client.js");
  assert.equal(pkg.version,"8.9.9");
  assert.equal(lock.version,"8.9.9");
  assert.equal(lock.packages[""].version,"8.9.9");
  assert.match(pkg.scripts["patch:runtime"],/dread_shift_v8_9_7_patch\.js && node dread_shift_v8_9_8_patch\.js && node dread_shift_v8_9_9_patch\.js && node dread_shift_v8_9_9_1_patch\.js && node dread_shift_v8_9_9_2_patch\.js && node dread_shift_v8_9_9_3_patch\.js$/);
  assert.match(protect,/DREAD SHIFT v8\.9\.9 client/);
  assert.match(protect,/BUILD_VERSION = "8\.9\.9"/);
});
