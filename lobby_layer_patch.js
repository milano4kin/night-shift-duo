"use strict";
const fs=require("fs");
const path=require("path");
const file=path.join(__dirname,"public","style.css");
let css=fs.readFileSync(file,"utf8");
const before=css;
css=css.replace(/\.lobby-side-actions\{position:absolute;left:max\(18px,calc\(50% - 760px\)\);top:50%;transform:translateY\(-50%\);z-index:45;/,
  '.lobby-side-actions{position:absolute;left:max(18px,calc(50% - 760px));top:50%;transform:translateY(-50%);z-index:58;');
if(css===before && !css.includes('.lobby-side-actions{position:absolute;left:max(18px,calc(50% - 760px));top:50%;transform:translateY(-50%);z-index:58;')){
  css += '\n/* lobby side tools must sit above the lobby overlay (z-index 50) */\n.lobby-side-actions{z-index:58!important}\n';
}
if(css!==before) fs.writeFileSync(file,css,"utf8");
console.log("Lobby layer patch applied: side tools render above lobby overlay.");
