"use strict";
const game=require("../server.js");
function assert(v,m){if(!v)throw new Error(m);}
function finiteTree(value,path="root",seen=new Set()){
  if(value==null||typeof value==="string"||typeof value==="boolean")return;
  if(typeof value==="number"){if(!Number.isFinite(value))throw new Error("non-finite number at "+path+": "+value);return;}
  if(typeof value!=="object"||seen.has(value))return;seen.add(value);
  if(Array.isArray(value)){for(let i=0;i<value.length;i++)finiteTree(value[i],path+"["+i+"]",seen);return;}
  for(const [k,v] of Object.entries(value)){if(k==="ws"||k==="reconnectTimer"||typeof v==="function")continue;finiteTree(v,path+"."+k,seen);}
}
const ws={readyState:1,send(){}};
const room=game.makeRoom("STRESS","solo");
const p=game.makePlayer(ws,"Stress","stress_audit",1,"starter");
room.players.set(p.id,p);room.hostId=p.id;
game.resetRunProgress(p);
p.x=game.WORLD.cx-150;p.y=game.WORLD.cy;p.maxHp=1e9;p.hp=1e9;
p.inventory={wood:1e7,stone:1e7,scrap:1e7,medkits:50};
room.core.maxHp=1e9;room.core.hp=1e9;

// Add representative structures to make tower/spike/wall updates execute during the wave stress.
let off=-360;
for(const [type,cfg] of Object.entries(game.STRUCTURES)){
  room.structures.push({id:100000+room.structures.length,type,x:game.WORLD.cx+off,y:game.WORLD.cy+260,r:cfg.r,hp:cfg.hp,maxHp:cfg.hp,rotation:0,cooldown:0,level:1,power:1,ownerId:p.id});
  off+=105;
}

room.started=true;game.startDay(room,true);
let totalSnapshots=0,totalSpawned=0;
for(let targetWave=1;targetWave<=50;targetWave++){
  if(room.phase!=="day"){
    room.phase="day";room.zombies=[];room.spawnQueue=[];room.spawnLeft=0;
  }
  game.startWave(room);
  assert(room.wave===targetWave,"wave sequence mismatch "+room.wave+" vs "+targetWave);
  const expectedBoss=game.BOSS_BY_WAVE[targetWave]||null;
  if(expectedBoss)assert(room.zombies.some(z=>z.type===expectedBoss),"boss missing on wave "+targetWave+": "+expectedBoss);

  const maxTicks=Math.max(150,(room.waveSpawnTotal||0)*5+80);
  let cleared=false;
  for(let tick=0;tick<maxTicks;tick++){
    room.spawnTimer=0;
    for(const z of room.zombies)z.hp=0;
    const before=room.zombies.length;
    game.updateRoom(room,.05);
    totalSpawned+=Math.max(0,room.zombies.length-before);
    for(const z of room.zombies)z.hp=0;
    assert(room.zombies.length<240,"zombie collection exploded on wave "+targetWave);
    assert(room.effects.length<1600,"effect collection exploded on wave "+targetWave);
    assert(room.bullets.length<1600,"bullet collection exploded on wave "+targetWave);
    finiteTree({core:room.core,zombies:room.zombies,bullets:room.bullets,effects:room.effects,structures:room.structures});
    if(tick%10===0&&room.started){
      const snap=game.serializeFor(room,p);finiteTree(snap);totalSnapshots++;
      assert(snap.wave===room.wave,"serialized wave mismatch");
      assert(snap.playerCount===1,"serialized player count mismatch");
    }
    if(room.phase==="day"||room.phase==="victory"){cleared=true;break;}
  }
  assert(cleared,"wave "+targetWave+" did not resolve within accelerated stress budget");
  if(targetWave<50)assert(room.started===true,"run stopped before wave 50");
}
assert(room.phase==="victory"&&room.started===false,"wave 50 did not end in victory");
finiteTree(game.serializeFor(room,p));
console.log("[simulation-stress] PASS 50 waves; snapshots="+totalSnapshots+" spawned-observations="+totalSpawned);
