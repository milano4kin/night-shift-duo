"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),read=f=>fs.readFileSync(path.join(root,f),"utf8");

test("v8.9.7 restores the exact seven permanent upgrade branches",()=>{
  const server=read("server.js"),client=read("public/client.js");
  for(const key of ["damage","reload","health","speed","magazine","gather","building"]){
    assert.match(server,new RegExp(`${key}:\\{name:`));
    assert.match(client,new RegExp(`${key}:\\{name:`));
  }
  assert.match(server,/damage:\{name:"Урон",prices:\[50,75,150,200,300\],bonuses:\[3,7,15,22,30\]/);
  assert.match(server,/reload:\{name:"Скорость перезарядки",prices:\[50,100,150,225,350\],bonuses:\[4,9,16,24,35\]/);
  assert.match(server,/health:\{name:"Максимальное здоровье",prices:\[50,100,175,250,350\],bonuses:\[10,20,35,50,75\]/);
  assert.match(server,/speed:\{name:"Скорость передвижения",prices:\[75,125,175,250,350\],bonuses:\[2,4,6,8,10\]/);
  assert.match(server,/magazine:\{name:"Размер магазина оружия",prices:\[75,125,175,250,350\],bonuses:\[5,10,15,22,30\]/);
  assert.match(server,/gather:\{name:"Добыча ресурсов",prices:\[50,100,150,225,325\],bonuses:\[5,12,20,30,45\]/);
  assert.match(server,/building:\{name:"Прочность построек",prices:\[75,125,200,275,400\],bonuses:\[5,12,20,30,45\]/);
  assert.match(server,/return lvl\?cfg\.bonuses\[lvl-1\]:0/);
});

test("all seven upgrades have authoritative gameplay effects and cost gold",()=>{
  const server=read("server.js"),client=read("public/client.js");
  for(const key of ["damage","reload","health","speed","magazine","gather","building"])
    assert.match(server,new RegExp(`metaUpgradeBonus\\(p,"${key}"\\)`));
  assert.match(server,/if\(target\.gold<price\)return false;\s*target\.gold-=price/);
  assert.match(client,/price-gold/);
  assert.match(client,/m\.gold<price/);
  assert.match(client,/upgrade-step/);
  assert.match(client,/текущий бонус/);
});

test("v8.9.7 remains after wall corners in the protected release chain",()=>{
  const pkg=require(path.join(root,"package.json")),protect=read("scripts/protect_client.js");
  assert.equal(pkg.version,"8.9.7");
  assert.match(pkg.scripts["patch:runtime"],/dread_shift_v8_9_6_patch\.js && node dread_shift_v8_9_7_patch\.js$/);
  assert.match(protect,/DREAD SHIFT v8\.9\.7 client/);
  assert.match(protect,/BUILD_VERSION = "8\.9\.7"/);
});
