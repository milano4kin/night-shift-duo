"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..");
test("v8.8 patch covers requested systems",()=>{
  const p=fs.readFileSync(path.join(root,"dread_shift_v8_8_patch.js"),"utf8");
  for(const re of [/V88_COS/,/accountFriendAdd/,/accountSetAvatar/,/v88Date/,/v88Perks/,/settings\.autoSkip/,/p\.weapon\?\.type!==b\.w\.type/,/closeRunShop\(\)/,/v88-whats/])assert.match(p,re);
});
test("v8.8.2 uses friend requests instead of instant friendship",()=>{
  const p=fs.readFileSync(path.join(root,"dread_shift_v8_8_2_patch.js"),"utf8");
  for(const re of [/accountFriendAccept/,/accountFriendDecline/,/accountFriendCancel/,/friendRequestsIncoming/,/friendRequestsOutgoing/,/Запрос в друзья отправлен/,/Входящие запросы/,/Исходящие запросы/])assert.match(p,re);
  assert.match(p,/v882Bell\.after\(v882WhatsNew\)/);
  assert.match(p,/openWhatsNewBtn\.v882-whats/);
});
