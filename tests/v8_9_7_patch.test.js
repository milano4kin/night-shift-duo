"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),read=f=>fs.readFileSync(path.join(root,f),"utf8");

test("v8.9.7 restores the exact seven permanent upgrade branches",()=>{
  const server=read("server.js"),client=read("public/client.js");
  for(const key of ["damage","reload","health","speed","magazine","gather","building"]){
    assert.match(server,new RegExp(`${key}:\\{name:`));
    assert.match(client,new RegExp(`${key}:\\{name:`));
  }
  assert.match(server,/damage:\{name:"Урон",prices:\[50,75,150,200,300\],bonuses:/);
  assert.match(server,/reload:\{name:"Скорость перезарядки",prices:\[50,100,150,225,350\],bonuses:/);
  assert.match(server,/health:\{name:"Максимальное здоровье",prices:\[50,100,175,250,350\],bonuses:/);
  assert.match(server,/speed:\{name:"Скорость передвижения",prices:\[75,125,175,250,350\],bonuses:/);
  assert.match(server,/magazine:\{name:"Размер магазина оружия",prices:\[75,125,175,250,350\],bonuses:/);
  assert.match(server,/gather:\{name:"Добыча ресурсов",prices:\[50,100,150,225,325\],bonuses:/);
  assert.match(server,/building:\{name:"Прочность построек",prices:\[75,125,200,275,400\],bonuses:/);
  assert.match(server,/return lvl\?cfg\.bonuses\[lvl-1\]:0/);
});

test("all seven upgrades have authoritative gameplay effects and use silver in the current runtime",()=>{
  const server=read("server.js"),client=read("public/client.js");
  for(const key of ["damage","reload","health","speed","magazine","gather","building"])
    assert.match(server,new RegExp(`metaUpgradeBonus\\(p,"${key}"\\)`));
  assert.match(server,/if\(target\.silver<price\)return false;\s*target\.silver-=price/);
  assert.match(client,/price-silver/);
  assert.match(client,/m\.silver<price/);
  assert.match(client,/upgrade-step/);
});

test("v8.9.7 remains before the current v8.9.9 release",()=>{
  const pkg=require(path.join(root,"package.json"));
  assert.equal(pkg.version,"8.9.9");
  assert.match(pkg.scripts["patch:runtime"],/dread_shift_v8_9_6_patch\.js && node dread_shift_v8_9_7_patch\.js/);
});
