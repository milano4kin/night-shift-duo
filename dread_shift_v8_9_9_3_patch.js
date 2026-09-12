"use strict";
const fs=require("node:fs"),path=require("node:path");
const F=r=>path.join(__dirname,r),R=r=>fs.readFileSync(F(r),"utf8"),W=(r,s)=>fs.writeFileSync(F(r),s,"utf8");
const clientMarker="/* DREAD SHIFT v8.9.9.3 tower range/wall group */";
const serverMarker="/* DREAD SHIFT v8.9.9.3 connected wall upgrades */";

function once(s,from,to,label){if(!s.includes(from))throw new Error(`v8.9.9.3: ${label} anchor missing`);return s.replace(from,to);}

function patchClient(){
  let s=R("public/client.js");
  if(s.includes(clientMarker))return false;

  const statsAnchor="function structureStats(st){";
  const helper=`const TOWER_ATTACK_RANGES=Object.freeze({cannon:520,tesla:400,cat_tower:125,frost_tower:430,flame_tower:185});\nfunction towerAttackRange(type){return Number(TOWER_ATTACK_RANGES[type]||0);}\nfunction drawTowerAttackRange(sx,sy,type,color=\"#8ce6ab\",preview=false){\n  const range=towerAttackRange(type);if(!range)return;\n  ctx.save();\n  ctx.fillStyle=preview?\"rgba(109,227,154,.045)\":\"rgba(112,205,255,.045)\";\n  ctx.strokeStyle=color;ctx.globalAlpha=preview?.62:.72;ctx.lineWidth=2;ctx.setLineDash([10,8]);\n  ctx.beginPath();ctx.arc(sx,sy,range,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;\n  ctx.fillStyle=\"rgba(5,10,12,.90)\";rr(sx-48,sy-range-25,96,20,8);ctx.fill();\n  ctx.fillStyle=color;ctx.font=\"850 10px system-ui\";ctx.textAlign=\"center\";ctx.fillText(T(\`Радиус ${range}\`,\`Range ${range}\`),sx,sy-range-11);ctx.textAlign=\"left\";\n  ctx.restore();\n}\nfunction wallSectionsConnectedLocal(a,b){\n  if(!a||!b||!isWallBuild(a.type)||!isWallBuild(b.type))return false;\n  const ae=wallEndpointsLocal(a.x,a.y,a.rotation||0),be=wallEndpointsLocal(b.x,b.y,b.rotation||0);\n  for(const x of ae)for(const y of be)if(Math.hypot(x.x-y.x,x.y-y.y)<=15)return true;\n  return false;\n}\nfunction connectedWallGroupLocal(seed){\n  if(!seed||!isWallBuild(seed.type))return [];\n  const walls=(state?.structures||[]).filter(x=>isWallBuild(x.type)&&(x.hp==null||x.hp>0)),seen=new Set([seed.id]),queue=[seed],out=[];\n  while(queue.length){const cur=queue.shift();out.push(cur);for(const other of walls){if(seen.has(other.id)||!wallSectionsConnectedLocal(cur,other))continue;seen.add(other.id);queue.push(other);}}\n  return out;\n}\nfunction sumStructureUpgradeCosts(items){\n  const total={wood:0,stone:0,scrap:0};\n  for(const st of items){const c=structureUpgradeCost(st);if(!c)continue;for(const k of [\"wood\",\"stone\",\"scrap\"])total[k]+=c[k]||0;}\n  return total;\n}\n\n`;
  s=once(s,statsAnchor,helper+statsAnchor,"structure stats");

  s=once(s,
    '    if(hovered&&activeTool==="multitool"){',
    '    if(hovered&&activeTool==="multitool")drawTowerAttackRange(s.x,s.y,st.type,"#8ce6ab",false);\n    if(hovered&&activeTool==="multitool"){',
    "hover range");

  s=once(s,
    '  drawStructureShape(fake,s.x,s.y,.85,color);',
    '  if(towerAttackRange(selectedBuild)>0)drawTowerAttackRange(s.x,s.y,selectedBuild,color,true);\n  drawStructureShape(fake,s.x,s.y,.85,color);',
    "placement range");

  const upText='  up.textContent=lvl>=5?T("МАКСИМАЛЬНЫЙ УРОВЕНЬ","MAX LEVEL"):cost?T(`Улучшить → ур. ${lvl+1} · ${costText(cost)}${upMissing?` · не хватает: ${upMissing}`:""}`,`Upgrade → lvl ${lvl+1} · ${costText(cost)}${upMissing?` · missing: ${upMissing}`:""}`):T("Улучшить","Upgrade");';
  const upAll=`${upText}\n  const upAll=$("structureUpgradeAllBtn");\n  if(upAll){\n    const group=isWallBuild(st.type)?connectedWallGroupLocal(st):[],upgradeable=group.filter(x=>(x.level||1)<5),total=sumStructureUpgradeCosts(upgradeable);\n    const show=group.length>1&&upgradeable.length>0,missing=show&&p&&!canAfford(p.inventory,total)?missingCostText(p.inventory,total):\"\";\n    upAll.classList.toggle(\"hidden\",!show);upAll.disabled=!show||!p||!canAfford(p.inventory,total);\n    upAll.textContent=show?T(`⬆ Улучшить всё (${upgradeable.length}/${group.length}) · ${costText(total)}${missing?` · не хватает: ${missing}`:\"\"}`,`⬆ Upgrade all (${upgradeable.length}/${group.length}) · ${costText(total)}${missing?` · missing: ${missing}`:\"\"}`):T(\"Улучшить всё\",\"Upgrade all\");\n  }`;
  s=once(s,upText,upAll,"upgrade all menu");

  const clickAnchor='$("structureUpgradeBtn").onclick=()=>{const st=selectedStructure();if(!st)return;send("structureUpgrade",{structureId:st.id});structureDeleteArmed=false;setTimeout(()=>renderStructureMenu(),80);};';
  s=once(s,clickAnchor,clickAnchor+'\n$("structureUpgradeAllBtn").onclick=()=>{const st=selectedStructure();if(!st||!isWallBuild(st.type))return;send("structureUpgradeAll",{structureId:st.id});structureDeleteArmed=false;setTimeout(()=>renderStructureMenu(),100);};',"upgrade all click");

  s+='\n'+clientMarker+'\n';
  new Function(s);W("public/client.js",s);return true;
}

function patchHtml(){
  let s=R("public/index.html");
  if(s.includes('id="structureUpgradeAllBtn"'))return false;
  s=once(s,'<button id="structureUpgradeBtn" class="primary" type="button">Улучшить</button>','<button id="structureUpgradeBtn" class="primary" type="button">Улучшить</button>\n          <button id="structureUpgradeAllBtn" class="primary hidden" type="button">Улучшить всё</button>',"structure upgrade button");
  W("public/index.html",s);return true;
}

function patchServer(){
  let s=R("server.js");
  if(s.includes(serverMarker))return false;

  const repairAnchor="function repairSpecificStructure(room,p,structureId){";
  const groupFn=`function serverStructureUpgradeCost(st){\n  const cfg=STRUCTURES[st?.type]?.cost;if(!cfg)return null;const lvl=st.level||1;if(lvl>=5)return null;const f=.62+lvl*.58;\n  return {wood:Math.max(1,Math.ceil((cfg.wood||0)*f)),stone:Math.max(0,Math.ceil((cfg.stone||0)*f)),scrap:Math.max(0,Math.ceil((cfg.scrap||0)*f))};\n}\nfunction serverWallSectionsConnected(a,b){\n  if(!a||!b||!isWallType(a.type)||!isWallType(b.type))return false;const ae=wallEndpoints(a.x,a.y,a.rotation||0),be=wallEndpoints(b.x,b.y,b.rotation||0);\n  for(const x of ae)for(const y of be)if(Math.hypot(x.x-y.x,x.y-y.y)<=15)return true;return false;\n}\nfunction connectedWallGroup(room,seed){\n  if(!seed||!isWallType(seed.type))return [];const walls=room.structures.filter(x=>isWallType(x.type)&&x.hp>0),seen=new Set([seed.id]),queue=[seed],out=[];\n  while(queue.length){const cur=queue.shift();out.push(cur);for(const other of walls){if(seen.has(other.id)||!serverWallSectionsConnected(cur,other))continue;seen.add(other.id);queue.push(other);}}return out;\n}\nfunction upgradeConnectedWalls(room,p,structureId){\n  if(p.downed||p.upgradeCd>0)return;const seed=room.structures.find(x=>x.id===Number(structureId));\n  if(!seed||!isWallType(seed.type))return send(p.ws,\"notice\",{text:\"Выберите соединённую стену или ворота\"});\n  if(distanceToStructurePoint(p.x,p.y,seed)>180)return send(p.ws,\"notice\",{text:\"Подойдите ближе к постройке\"});\n  const group=connectedWallGroup(room,seed),targets=group.filter(st=>(st.level||1)<5);\n  if(group.length<2)return send(p.ws,\"notice\",{text:\"Эта секция не соединена с другими стенами\"});\n  if(!targets.length)return send(p.ws,\"notice\",{text:\"Все соединённые стены уже максимального уровня\"});\n  const total={wood:0,stone:0,scrap:0};for(const st of targets){const c=serverStructureUpgradeCost(st);for(const k of [\"wood\",\"stone\",\"scrap\"])total[k]+=c?.[k]||0;}\n  if(!hasCost(p.inventory,total)){const m=missingCost(p.inventory,total),parts=[];if(m.wood)parts.push(m.wood+\" дерева\");if(m.stone)parts.push(m.stone+\" камня\");if(m.scrap)parts.push(m.scrap+\" металла\");return send(p.ws,\"notice\",{text:\"Для улучшения всех стен не хватает: \"+parts.join(\", \")});}\n  pay(p.inventory,total);p.upgradeCd=.25;let xp=0;\n  for(const st of targets){st.level=(st.level||1)+1;st.power=1+(st.level-1)*.25;const oldMax=st.maxHp;st.maxHp=Math.round(st.maxHp*1.32);st.hp=Math.min(st.maxHp,st.hp+Math.round((st.maxHp-oldMax)+oldMax*.22));xp+=9+st.level*2;}\n  tutorialEvent(p,\"upgrade\");addXp(p,xp);send(p.ws,\"notice\",{text:`Улучшено соединённых стен: ${targets.length}/${group.length} · ${total.wood} дерева, ${total.stone} камня, ${total.scrap} металла`});\n}\n\n`;
  s=once(s,repairAnchor,groupFn+repairAnchor,"repair function");
  s=once(s,'"structureUpgrade","structureRepair"','"structureUpgrade","structureUpgradeAll","structureRepair"',"pre-start action guard");
  const handler='    if(m.type==="structureUpgrade")upgradeStructure(room,p,m.structureId);';
  s=once(s,handler,handler+'\n    if(m.type==="structureUpgradeAll")upgradeConnectedWalls(room,p,m.structureId);',"message handler");
  s+='\n'+serverMarker+'\n';
  new Function(s);W("server.js",s);return true;
}

const changed={client:patchClient(),html:patchHtml(),server:patchServer()};
const c=R("public/client.js"),h=R("public/index.html"),sv=R("server.js");
for(const [k,v] of Object.entries({cannon:520,tesla:400,cat_tower:125,frost_tower:430,flame_tower:185}))if(!c.includes(`${k}:${v}`))throw new Error("v8.9.9.3: tower range missing "+k);
if(!h.includes('id="structureUpgradeAllBtn"'))throw new Error("v8.9.9.3: upgrade-all button missing");
if(!sv.includes('if(m.type==="structureUpgradeAll")'))throw new Error("v8.9.9.3: server upgrade-all handler missing");
console.log("DREAD SHIFT v8.9.9.3 tower range/wall group applied:",changed);
