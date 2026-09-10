"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..");

test("v8.5.1 movement patch stays isolated from connection and auth code",()=>{
  const patch=fs.readFileSync(path.join(root,"dread_shift_v8_5_1_patch.js"),"utf8");
  assert.doesNotMatch(patch,/new WebSocket|function connect\(|resumeSession|authRequired/);
  assert.match(patch,/sendMovementInputNow/);
  assert.match(patch,/camera\.x=tx;camera\.y=ty/);
});

test("v8.5.1 is enabled after stable v8.4",()=>{
  const pkg=require(path.join(root,"package.json"));
  assert.equal(pkg.version,"8.5.1");
  assert.match(pkg.scripts.start,/dread_shift_v8_4_patch\.js && node dread_shift_v8_5_1_patch\.js && node db_bridge\.js$/);
});
