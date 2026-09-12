"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),read=file=>fs.readFileSync(path.join(root,file),"utf8");

test("game UI prevents accidental selection and internal dragging while editable fields remain selectable",()=>{
  const client=read("public/client.js"),css=read("public/style.css");
  assert.match(client,/function selectionAllowedTarget\(target\)/);
  assert.match(client,/input, textarea, \[contenteditable\]:not\(\[contenteditable="false"\]\)/);
  assert.match(client,/addEventListener\("selectstart".*preventDefault/s);
  assert.match(client,/addEventListener\("dragstart".*preventDefault/s);
  assert.match(css,/html,body,#app,#app \*\{[^}]*user-select:none/);
  assert.match(css,/input,textarea,\[contenteditable\]:not\(\[contenteditable="false"\]\)\{[^}]*user-select:text!important/);
  assert.match(css,/canvas,#game\{[^}]*user-drag:none/);
  assert.match(client,/id="v88Avatar" type="file"/);
  assert.match(client,/v88Avatar.*addEventListener\("change"/s);
});

test("runtime restores low-jitter local prediction and remote interpolation",()=>{
  const server=read("server.js"),client=read("public/client.js");
  assert.match(server,/const SNAPSHOT_HZ = 18/);
  assert.match(server,/moveVx:Number\(p\.moveVx\)\|\|0,moveVy:Number\(p\.moveVy\)\|\|0/);
  assert.match(server,/p\.moveVx=\(p\.x-moveStartX\)\/moveDt/);
  assert.match(server,/bufferedAmount\|\|0\)>128\*1024/);
  assert.match(client,/function sendMovementInputNow\(\)/);
  assert.match(client,/lastMoveInputAt=performance\.now\(\);sendMovementInputNow\(\)/);
  assert.match(client,/},1000\/30\);\s*function smoothEntity/);
  assert.match(client,/Math\.exp\(-\(player\?22:18\)\*dt\)/);
  assert.match(client,/const hardSnap=err>640/);
  assert.match(client,/camera\.x=tx;camera\.y=ty/);
  assert.doesNotMatch(client,/const correction=err>140\?1:\.18/);
});

test("v8.9.5 movement recovery remains before the current protected runtime",()=>{
  const pkg=require(path.join(root,"package.json")),protect=read("scripts/protect_client.js");
  assert.equal(pkg.version,"8.9.6");
  assert.match(pkg.scripts["patch:runtime"],/dread_shift_v8_9_4_patch\.js && node dread_shift_v8_9_5_patch\.js && node dread_shift_v8_9_6_patch\.js$/);
  assert.match(protect,/DREAD SHIFT v8\.9\.6 client/);
  assert.match(protect,/BUILD_VERSION = "8\.9\.6"/);
});
