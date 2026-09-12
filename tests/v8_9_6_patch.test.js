"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),cp=require("node:child_process");
const root=path.join(__dirname,"..");

test("v8.9.6 renders a seamless joint only for connected angled walls",()=>{
  cp.execFileSync(process.execPath,["dread_shift_v8_9_6_patch.js"],{cwd:root,stdio:"pipe"});
  const client=fs.readFileSync(path.join(root,"public/client.js"),"utf8");
  assert.match(client,/function drawWallCornerJoints\(\)/);
  assert.match(client,/function getWallCornerJoints\(\)/);
  assert.match(client,/if\(cacheKey===wallCornerCacheKey\)return wallCornerCache/);
  assert.match(client,/joinDistance=15/);
  assert.match(client,/angleDot>\.985\)continue/);
  assert.match(client,/ctx\.lineJoin="round"/);
  assert.match(client,/drawWallCornerJoints\(\);\s*const now=performance\.now\(\)/);
  assert.doesNotThrow(()=>new Function(client));
});

test("v8.9.6 wall corners remain before the current production patch",()=>{
  const pkg=require(path.join(root,"package.json"));
  assert.equal(pkg.version,"8.9.7");
  assert.match(pkg.scripts["patch:runtime"],/dread_shift_v8_9_5_patch\.js && node dread_shift_v8_9_6_patch\.js && node dread_shift_v8_9_7_patch\.js$/);
});
