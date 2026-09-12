"use strict";
const fs=require("node:fs"),path=require("node:path");
const F=r=>path.join(__dirname,r),R=r=>fs.readFileSync(F(r),"utf8"),W=(r,s)=>fs.writeFileSync(F(r),s,"utf8");
const marker="/* DREAD SHIFT v8.9.9.4 hotbar fit */";

let s=R("public/style.css");
if(!s.includes(marker)){
  s+='\n'+marker+'\n'+[
    '#hotbar.hotbar{align-items:stretch!important;gap:5px!important;padding:7px 8px!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:thin}',
    '#hotbar .slot{box-sizing:border-box!important;flex:0 0 70px!important;width:70px!important;min-width:70px!important;height:88px!important;min-height:88px!important;padding:5px 4px 6px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;gap:2px!important;overflow:hidden!important}',
    '#hotbar .slot-key{z-index:2!important;line-height:12px!important}',
    '#hotbar .slot-icon{font-size:22px!important;line-height:26px!important;min-height:26px!important;flex:0 0 26px!important}',
    '#hotbar .build-slot-img{display:block!important;width:38px!important;height:36px!important;min-height:36px!important;flex:0 0 36px!important;object-fit:contain!important;margin:0 auto!important}',
    '#hotbar .slot-name{width:100%!important;max-width:100%!important;min-height:20px!important;margin:0!important;display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2!important;overflow:hidden!important;white-space:normal!important;text-overflow:ellipsis!important;overflow-wrap:anywhere!important;word-break:normal!important;font-size:9px!important;line-height:10px!important;text-align:center!important}',
    '#hotbar .slot.build{height:88px!important;min-height:88px!important;padding:5px 4px 6px!important}',
    '#hotbar .slot.build .slot-name{width:100%!important;max-width:100%!important;min-height:20px!important}',
    '#hotbar .slot.build .slot-cost{display:block!important;visibility:visible!important;opacity:1!important;width:100%!important;max-width:100%!important;min-height:18px!important;overflow:hidden!important;text-overflow:clip!important;white-space:normal!important;font-size:8px!important;line-height:9px!important;text-align:center!important;color:#d8c785!important;margin-top:auto!important}',
    '#hotbar .weapon-slot{box-sizing:border-box!important;flex:0 0 112px!important;width:112px!important;min-width:112px!important;height:88px!important;min-height:88px!important;padding:5px 7px 6px!important;display:grid!important;grid-template-rows:29px 22px 9px 15px!important;align-content:center!important;justify-items:center!important;gap:1px!important;overflow:hidden!important}',
    '#hotbar .weapon-slot-img{grid-row:1!important;width:68px!important;height:28px!important;max-width:68px!important;margin:0!important;object-fit:contain!important}',
    '#hotbar .weapon-slot .slot-name{grid-row:2!important;width:98px!important;max-width:98px!important;min-height:22px!important;font-size:9px!important;line-height:11px!important;overflow:hidden!important;white-space:normal!important;text-align:center!important}',
    '#hotbar .weapon-slot-stars{grid-row:3!important;height:9px!important;line-height:9px!important;margin:0!important;overflow:hidden!important}',
    '#hotbar .weapon-slot .weapon-ammo-label{grid-row:4!important;height:15px!important;min-height:15px!important;line-height:15px!important;margin:0!important;white-space:nowrap!important}',
    '#hotbar .hotbar-sep{flex:0 0 1px!important;align-self:center!important}',
    '@media(max-width:980px){#hotbar .slot{flex-basis:64px!important;width:64px!important;min-width:64px!important}#hotbar .weapon-slot{flex-basis:104px!important;width:104px!important;min-width:104px!important}#hotbar .weapon-slot .slot-name{width:90px!important;max-width:90px!important;font-size:8px!important}#hotbar .slot-name{font-size:8px!important}#hotbar .slot.build .slot-cost{font-size:7px!important}}'
  ].join("\n")+'\n';
  W("public/style.css",s);
}
const out=R("public/style.css");
for(const needle of [marker,'#hotbar .weapon-slot{','-webkit-line-clamp:2!important','#hotbar .slot.build .slot-cost{','white-space:normal!important'])if(!out.includes(needle))throw new Error("v8.9.9.4: missing "+needle);
console.log("DREAD SHIFT v8.9.9.4 hotbar fit applied");
