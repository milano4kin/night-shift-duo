"use strict";
const fs=require("node:fs"),path=require("node:path");
const file=rel=>path.join(__dirname,rel),read=rel=>fs.readFileSync(file(rel),"utf8"),write=(rel,s)=>fs.writeFileSync(file(rel),s,"utf8");
function must(cond,msg){if(!cond)throw new Error("v8.9.2: "+msg)}
function patchServer(){
  let s=read("server.js");if(s.includes("/* DREAD SHIFT v8.9.2 server */"))return false;
  must(s.includes('const BUILD_VERSION = "8.9.1";'),"server version marker missing");
  s=s.replace('const BUILD_VERSION = "8.9.1";','const BUILD_VERSION = "8.9.2";');
  s+='\n/* DREAD SHIFT v8.9.2 server */\n';write("server.js",s);return true;
}
function patchClient(){
  let s=read("public/client.js");if(s.includes("/* DREAD SHIFT v8.9.2 client */"))return false;
  const oldHud=`  const res=[['🪵',T('Дерево','Wood'),p.inventory.wood||0,'#ba7a4b'],['🪨',T('Камень','Stone'),p.inventory.stone||0,'#b9c2c8'],['⚙',T('Металл','Scrap'),p.inventory.scrap||0,'#d1d8db'],['◉',T('Серебро','Silver'),p.silver||0,'#dce7ec'],['🪙',T('Золото','Gold'),p.gold||0,'#ffc85c'],['🎟',T('Жетон','Token'),p.crateTokens||0,'#d596ff']];
  const rpH=tiny?166:178,rpY=Math.max(objY+objH+10,innerHeight-rpH-14);hudPanel(rightX,rpY,rightW,rpH,{fill:'rgba(7,11,17,.93)',stroke:'rgba(182,208,255,.14)'});
  const rowH=(rpH-16)/6;res.forEach((it,idx)=>{const yy=rpY+8+idx*rowH;ctx.fillStyle='rgba(255,255,255,.045)';rr(rightX+8,yy,rightW-16,rowH-3,8);ctx.fill();ctx.fillStyle=it[3];ctx.font=\`900 \${tiny?12:14}px system-ui\`;ctx.fillText(it[0],rightX+14,yy+rowH*.62);ctx.fillStyle='#dfe7ea';ctx.font=\`850 \${tiny?9:11}px system-ui\`;ctx.fillText(it[1],rightX+36,yy+rowH*.62);ctx.textAlign='right';ctx.fillStyle='#fff';ctx.font=\`950 \${tiny?11:13}px system-ui\`;ctx.fillText((Number(it[2])||0).toLocaleString('ru-RU'),rightX+rightW-13,yy+rowH*.62);ctx.textAlign='left';});`;
  const newHud=`  // Run HUD only shows build resources. Meta currencies stay in the lobby/shop where they belong.
  const res=[['🪵',T('Дерево','Wood'),p.inventory.wood||0,'#ba7a4b'],['🪨',T('Камень','Stone'),p.inventory.stone||0,'#d6dde1'],['⚙',T('Металл','Scrap'),p.inventory.scrap||0,'#cfd9df']];
  const rpW=Math.min(360,Math.round(rightW*1.45)),rpX=innerWidth-rpW-14,rpH=tiny?126:140,rpY=Math.max(objY+objH+10,innerHeight-rpH-14);
  hudPanel(rpX,rpY,rpW,rpH,{fill:'rgba(7,11,17,.95)',stroke:'rgba(182,208,255,.19)'});
  const rowH=(rpH-16)/3;res.forEach((it,idx)=>{const yy=rpY+8+idx*rowH;ctx.fillStyle='rgba(255,255,255,.055)';rr(rpX+8,yy,rpW-16,rowH-4,10);ctx.fill();ctx.fillStyle=it[3];ctx.font=\`950 \${tiny?17:20}px system-ui\`;ctx.fillText(it[0],rpX+15,yy+rowH*.64);ctx.fillStyle='#e7eef0';ctx.font=\`900 \${tiny?13:15}px system-ui\`;ctx.fillText(it[1],rpX+(tiny?48:54),yy+rowH*.64);ctx.textAlign='right';ctx.fillStyle='#fff';ctx.font=\`950 \${tiny?16:18}px system-ui\`;ctx.fillText((Number(it[2])||0).toLocaleString('ru-RU'),rpX+rpW-15,yy+rowH*.64);ctx.textAlign='left';});`;
  must(s.includes(oldHud),"resource HUD block changed unexpectedly");s=s.replace(oldHud,newHud);
  const insertAt=s.lastIndexOf("})();");must(insertAt>=0,"client IIFE end missing");
  const ext=`
const V892_CHARACTER_SKINS=new Set(["cf","cr","cb","cw"]);
const V892_SKIN_PALETTES={
  cf:{body:"#526431",body2:"#3d4c27",armor:"#8d9184",pack:"#704d31",strap:"#a2774c",helmet:"#596735",glove:"#252b28",boot:"#30302d",accent:"#b69b6a",glow:"#7fa96f"},
  cr:{body:"#df5a20",body2:"#a43c19",armor:"#555f64",pack:"#8d3e28",strap:"#302b28",helmet:"#f2aa20",glove:"#252b2d",boot:"#303235",accent:"#f2eee0",glow:"#ffbd55"},
  cb:{body:"#15191c",body2:"#090c0f",armor:"#2c353a",pack:"#20282c",strap:"#101518",helmet:"#101417",glove:"#171c1f",boot:"#191e21",accent:"#2ce3df",glow:"#27e4df"},
  cw:{body:"#1b1522",body2:"#0c0910",armor:"#454047",pack:"#21182b",strap:"#15101b",helmet:"#15101c",glove:"#1b1520",boot:"#201924",accent:"#a64cff",glow:"#9d4cff"}
};
function v892RR(g,x,y,w,h,r){r=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function v892PaintSkin(g,id){
  const c=V892_SKIN_PALETTES[id];if(!c)return;
  g.save();g.lineCap="round";g.lineJoin="round";
  if(id==="cw"){
    const aura=g.createRadialGradient(-5,0,5,-5,0,48);aura.addColorStop(0,"rgba(163,76,255,.22)");aura.addColorStop(1,"rgba(163,76,255,0)");g.fillStyle=aura;g.beginPath();g.arc(-5,0,48,0,Math.PI*2);g.fill();
    g.fillStyle="#21182b";g.strokeStyle="#7e38c8";g.lineWidth=1.3;g.beginPath();g.moveTo(-8,-17);g.lineTo(-34,-28);g.lineTo(-27,-15);g.lineTo(-46,-8);g.lineTo(-29,0);g.lineTo(-48,11);g.lineTo(-25,14);g.lineTo(-35,28);g.lineTo(-7,18);g.closePath();g.fill();g.stroke();
  }
  g.strokeStyle=c.boot;g.lineWidth=9;g.beginPath();g.moveTo(-8,-7);g.lineTo(-25,-9);g.moveTo(-8,7);g.lineTo(-25,9);g.stroke();
  g.strokeStyle="#090d10";g.lineWidth=4;g.beginPath();g.moveTo(-22,-9);g.lineTo(-29,-9);g.moveTo(-22,9);g.lineTo(-29,9);g.stroke();
  if(id!=="cw"){g.fillStyle=c.pack;g.strokeStyle="#0b1114";g.lineWidth=2;v892RR(g,-19,-15,18,30,6);g.fill();g.stroke();g.fillStyle=c.strap;v892RR(g,-15,-10,3,20,2);g.fill();}
  g.fillStyle=c.body;g.strokeStyle="#090e11";g.lineWidth=2.5;v892RR(g,-8,-16,31,32,11);g.fill();g.stroke();
  g.fillStyle=c.armor;g.beginPath();g.arc(1,-15,7,0,Math.PI*2);g.arc(1,15,7,0,Math.PI*2);g.fill();
  g.strokeStyle=c.body;g.lineWidth=9;g.beginPath();g.moveTo(3,-13);g.lineTo(17,-8);g.moveTo(3,13);g.lineTo(17,8);g.stroke();
  g.strokeStyle=c.glove;g.lineWidth=6;g.beginPath();g.moveTo(16,-8);g.lineTo(24,-4);g.moveTo(16,8);g.lineTo(24,4);g.stroke();
  if(id==="cr"){
    g.strokeStyle=c.accent;g.lineWidth=2.3;g.beginPath();g.moveTo(-2,-13);g.lineTo(17,-8);g.moveTo(-2,13);g.lineTo(17,8);g.stroke();
    g.fillStyle="#a63e23";v892RR(g,-18,-12,13,24,3);g.fill();g.strokeStyle="#d8d3c2";g.lineWidth=2;g.beginPath();g.moveTo(-13,-5);g.lineTo(-7,-5);g.stroke();
  }
  if(id==="cb"){
    g.strokeStyle=c.accent;g.lineWidth=2;g.beginPath();g.moveTo(-4,-12);g.lineTo(3,-12);g.moveTo(-4,12);g.lineTo(3,12);g.stroke();
  }
  g.fillStyle=c.helmet;g.strokeStyle="#080c0f";g.lineWidth=2.2;g.beginPath();g.arc(12,0,11.5,0,Math.PI*2);g.fill();g.stroke();
  if(id==="cf"){
    g.strokeStyle="#2a351e";g.lineWidth=2;g.beginPath();g.arc(11,0,8.5,Math.PI*.55,Math.PI*1.45);g.stroke();g.fillStyle="#6b7541";g.beginPath();g.moveTo(20,-5);g.lineTo(26,0);g.lineTo(20,5);g.closePath();g.fill();
    g.fillStyle="#a07a50";v892RR(g,-8,-4,5,8,2);g.fill();
  }else if(id==="cr"){
    g.fillStyle="#f4b72d";g.beginPath();g.arc(12,0,9.5,0,Math.PI*2);g.fill();g.strokeStyle="#8e6817";g.lineWidth=2;g.stroke();g.fillStyle="#f4f0d3";v892RR(g,18,-4,7,8,2);g.fill();
  }else if(id==="cb"){
    g.fillStyle="#070b0e";g.beginPath();g.arc(13,0,8.2,0,Math.PI*2);g.fill();g.strokeStyle=c.accent;g.lineWidth=2.2;g.beginPath();g.moveTo(15,-5);g.lineTo(21,0);g.lineTo(15,5);g.stroke();
    g.shadowColor=c.glow;g.shadowBlur=7;g.strokeStyle=c.accent;g.beginPath();g.moveTo(-13,-10);g.lineTo(-8,-10);g.stroke();g.shadowBlur=0;
  }else if(id==="cw"){
    g.fillStyle="#0c0910";g.beginPath();g.arc(13,0,8.5,0,Math.PI*2);g.fill();g.strokeStyle=c.accent;g.lineWidth=2.3;g.shadowColor=c.glow;g.shadowBlur=8;g.beginPath();g.moveTo(13,-6);g.lineTo(20,0);g.lineTo(13,6);g.moveTo(17,-4);g.lineTo(17,4);g.stroke();g.shadowBlur=0;
    g.strokeStyle="rgba(164,76,255,.72)";g.lineWidth=1.5;for(const sy of [-1,1]){g.beginPath();g.moveTo(-18,sy*13);g.bezierCurveTo(-28,sy*20,-34,sy*7,-42,sy*17);g.stroke();}
  }
  g.restore();
}
function v892SkinForPlayer(p){return p?.cosmetics?.character||(p?.id===myId?metaState?.equippedCosmetics?.character:null)||null}
const v892PreviousDrawPlayer=drawPlayer;
drawPlayer=function(p){
  const skin=v892SkinForPlayer(p);if(!V892_CHARACTER_SKINS.has(skin)){v892PreviousDrawPlayer(p);return;}
  const sm=(p.id===myId&&localPred)?localPred:smoothEntity(smoothPlayers,p),s=sc(sm.x,sm.y),aim=p.id===myId?norm(mouse.x-s.x,mouse.y-s.y):(p.dir||{x:1,y:0}),angle=Math.atan2(aim.y,aim.x),pal=V892_SKIN_PALETTES[skin];
  shadow(s.x,s.y+20,22,8,.29);
  if(p.id===myId){ctx.strokeStyle=pal.glow+"66";ctx.lineWidth=2;ctx.beginPath();ctx.arc(s.x,s.y+2,27,0,Math.PI*2);ctx.stroke();}
  ctx.save();ctx.translate(s.x,s.y);ctx.rotate(angle);if(p.downed)ctx.globalAlpha=.55;v892PaintSkin(ctx,skin);ctx.restore();
  if(p.downed){bar(s.x-36,s.y-34,72,6,p.revive/2.5,"#ead46f");return;}
  if(p.id===myId&&activeTool==="multitool"){
    const now=performance.now(),elapsed=now-toolSwingStart;let swingOffset=0;if(elapsed>=0&&elapsed<250){const tt=elapsed/250;if(tt<.62)swingOffset=-.82+(tt/.62)*1.18;else swingOffset=.36-((tt-.62)/.38)*.36;}
    const baseAngle=Math.atan2(aim.y,aim.x)+swingOffset,toolColors=[null,"#aeb7bc","#b9c0c5","#f1c84b","#44d98b","#66e5ff"],toolLevel=Math.max(1,Math.min(5,Number(p.multitoolLevel)||1));ctx.save();ctx.translate(s.x,s.y);ctx.rotate(baseAngle);ctx.strokeStyle=toolLevel===1?"#9a7746":"#55636b";ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(42,0);ctx.stroke();ctx.shadowColor=toolColors[toolLevel];ctx.shadowBlur=toolLevel>=3?8:2;ctx.strokeStyle=toolColors[toolLevel];ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(35,-10);ctx.lineTo(46,8);ctx.stroke();ctx.restore();
  }else if(p.id!==myId||activeTool==="gun")drawHeldWeaponSprite(p,s,aim);
  else if(activeTool==="hands"&&handsImage.complete&&handsImage.naturalWidth){const ang=Math.atan2(aim.y,aim.x);ctx.save();ctx.translate(s.x+aim.x*25,s.y+aim.y*25);ctx.rotate(ang);if(Math.cos(ang)<0)ctx.scale(1,-1);ctx.drawImage(handsImage,-21,-14,42,28);ctx.restore();}
  if((p.poisonTime||0)>0){ctx.fillStyle="rgba(145,255,116,.95)";ctx.beginPath();ctx.arc(s.x-19,s.y-17,4.5,0,Math.PI*2);ctx.fill();}
  if((p.burnTime||0)>0){ctx.fillStyle="rgba(255,130,70,.98)";ctx.beginPath();ctx.arc(s.x+19,s.y-17,4.5,0,Math.PI*2);ctx.fill();}
  bar(s.x-30,s.y+42,60,6,p.hp/p.maxHp,p.slot===1?"#58d489":"#63a9ff");ctx.textAlign="center";ctx.fillStyle="#d7bd70";ctx.font="800 9px system-ui";ctx.fillText(displayTitle(p.selectedTitle||"Новичок"),s.x,s.y-43);ctx.fillStyle="#edf4f5";ctx.font="900 11px system-ui";ctx.fillText(p.name,s.x,s.y-31);
};
function v892RenderSkinCards(){
  for(const c of lobbyMetaContent.querySelectorAll("canvas[data-v892-skin]")){const g=c.getContext("2d"),id=c.dataset.v892Skin,pal=V892_SKIN_PALETTES[id];g.clearRect(0,0,c.width,c.height);const bg=g.createLinearGradient(0,0,0,c.height);bg.addColorStop(0,"#132126");bg.addColorStop(1,"#081014");g.fillStyle=bg;g.fillRect(0,0,c.width,c.height);g.strokeStyle="rgba(116,150,153,.12)";g.lineWidth=1;for(let x=0;x<c.width;x+=32){g.beginPath();g.moveTo(x,0);g.lineTo(x,c.height);g.stroke()}for(let y=0;y<c.height;y+=32){g.beginPath();g.moveTo(0,y);g.lineTo(c.width,y);g.stroke()}g.save();g.translate(c.width*.50,c.height*.56);g.rotate(-.22);g.scale(2.35,2.35);v892PaintSkin(g,id);g.restore();if(id==="cw"){g.strokeStyle="rgba(165,78,255,.55)";g.lineWidth=2;g.strokeRect(1,1,c.width-2,c.height-2)}else if(id==="cb"){g.strokeStyle="rgba(44,227,223,.32)";g.lineWidth=2;g.strokeRect(1,1,c.width-2,c.height-2)}}
}
v88Cos=function(){
  const m=metaState||{},own=new Set(m.cosmeticsOwned||[]),eq=m.equippedCosmetics||{},catalog=Object.values(v88C());
  const card=(x,slot)=>{const preview=V892_CHARACTER_SKINS.has(x.id)?'<canvas class="v892-skin-preview" data-v892-skin="'+x.id+'" width="240" height="168"></canvas>':'<div class="v892-weapon-preview">✦</div>';const action=own.has(x.id)?'<button data-v88-e="'+x.id+'" data-slot="'+slot+'" '+(eq[slot]===x.id?'disabled':'')+'>'+(eq[slot]===x.id?T("ЭКИПИРОВАНО","EQUIPPED"):T("ЭКИПИРОВАТЬ","EQUIP"))+'</button>':'<button data-v88-b="'+x.id+'">'+T("КУПИТЬ","BUY")+'</button>';return '<article class="v88-card v892-card '+x.rarity+'">'+preview+'<div class="v892-card-head"><b>'+x.name+'</b><span class="v892-rarity '+x.rarity+'">'+String(x.rarity).toUpperCase()+'</span></div><small>'+(x.currency==="gold"?"G":"◉")+' '+x.price+'</small>'+action+'</article>'};
  lobbyMetaContent.innerHTML='<p>'+T("Скины не влияют на характеристики.","Skins do not affect stats.")+'</p><h3>'+T("ОРУЖИЕ","WEAPONS")+'</h3><div class="v88-grid">'+catalog.filter(x=>x.slot==="weapon").map(x=>card(x,"weapon")).join("")+'</div><button data-v88-clear="weapon">'+T("Снять скин оружия","Remove weapon skin")+'</button><h3>'+T("ПЕРСОНАЖ","CHARACTER")+'</h3><div class="v88-grid v892-character-grid">'+catalog.filter(x=>x.slot==="character").map(x=>card(x,"character")).join("")+'</div><button data-v88-clear="character">'+T("Снять скин персонажа","Remove character skin")+'</button>';
  requestAnimationFrame(v892RenderSkinCards);
};
/* DREAD SHIFT v8.9.2 client */
`;
  s=s.slice(0,insertAt)+ext+s.slice(insertAt);try{new Function(s)}catch(err){throw new Error("v8.9.2 client syntax: "+err.message)}write("public/client.js",s);return true;
}
function patchHtml(){let s=read("public/index.html");if(s.includes("<!-- DREAD SHIFT v8.9.2 -->"))return false;s=s.replaceAll("V8.9.1","V8.9.2").replaceAll("v8.9.1","v8.9.2");s+='\n<!-- DREAD SHIFT v8.9.2 -->\n';write("public/index.html",s);return true;}
function patchCss(){let s=read("public/style.css");if(s.includes("/* DREAD SHIFT v8.9.2 cosmetics */"))return false;s+=`\n/* DREAD SHIFT v8.9.2 cosmetics */\n.v892-card{overflow:hidden;position:relative}.v892-skin-preview{display:block;width:100%;height:auto;aspect-ratio:10/7;object-fit:cover;border-radius:9px;border:1px solid rgba(125,155,160,.18);margin-bottom:8px;background:#0b1418}.v892-weapon-preview{height:74px;display:grid;place-items:center;font-size:30px;border-radius:9px;background:linear-gradient(145deg,#10191d,#0b1114);margin-bottom:8px}.v892-card-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.v892-rarity{font-size:9px;font-weight:950;border:1px solid currentColor;border-radius:999px;padding:3px 7px}.v892-rarity.common{color:#91b5a4}.v892-rarity.uncommon{color:#65d28c}.v892-rarity.rare{color:#57bbef}.v892-rarity.epic{color:#b966f4}.v892-character-grid{grid-template-columns:repeat(auto-fit,minmax(190px,1fr))!important}.v892-card button{width:100%}@media(max-width:760px){.v892-character-grid{grid-template-columns:1fr!important}}\n`;write("public/style.css",s);return true;}
const changed={server:patchServer(),client:patchClient(),html:patchHtml(),css:patchCss()};
const cl=read("public/client.js");must(!cl.includes("T('Серебро','Silver'),p.silver"),"run HUD still contains silver");must(cl.includes("V892_CHARACTER_SKINS"),"skin renderer missing");console.log("DREAD SHIFT v8.9.2 patch applied:",changed);
