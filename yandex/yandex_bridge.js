"use strict";
(()=>{
  const BACKEND="__DREAD_BACKEND_URL__";
  const BUILD="8.9.9-yandex";
  let ysdk=null,player=null,platformPaused=false,adOpen=false,readySent=false,gameplayMarked=false,retryBypass=false,cloudTimer=null;
  const activeAudio=window.__DREAD_ACTIVE_AUDIO__=window.__DREAD_ACTIVE_AUDIO__||new Set();
  const nativeMediaPlay=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(...args){
    activeAudio.add(this);
    const cleanup=()=>activeAudio.delete(this);this.addEventListener("ended",cleanup,{once:true});
    if(window.__DREAD_PLATFORM_MUTED__)return Promise.resolve();
    return nativeMediaPlay.apply(this,args);
  };
  window.__DREAD_YANDEX__=true;
  window.DREAD_HTTP_BASE=BACKEND;
  window.DREAD_WS_URL=BACKEND.replace(/^http/i,"ws");
  const NativeWebSocket=window.WebSocket;
  window.WebSocket=class DreadYandexWebSocket extends NativeWebSocket{
    constructor(url,protocols){
      let target=String(url||"");
      try{const parsed=new URL(target,location.href);if((parsed.protocol==="ws:"||parsed.protocol==="wss:")&&parsed.host===location.host)target=window.DREAD_WS_URL;}catch{}
      if(protocols===undefined)super(target);else super(target,protocols);
    }
  };
  document.documentElement.classList.add("yandex-build");

  function mountBoot(){
    if(document.getElementById("yandexBoot"))return;
    const el=document.createElement("div");el.id="yandexBoot";
    el.innerHTML='<div class="yandex-boot-card"><b>DREAD SHIFT</b><span id="yandexBootText">Подключаем Яндекс Игры…</span><button id="yandexRetryBtn" type="button" class="hidden">ПОВТОРИТЬ</button></div>';
    document.body.appendChild(el);
    document.getElementById("yandexRetryBtn").onclick=()=>location.reload();
  }
  function bootText(text,error=false){
    mountBoot();const el=document.getElementById("yandexBootText"),btn=document.getElementById("yandexRetryBtn");
    if(el){el.textContent=text;el.classList.toggle("error",!!error);}
    if(btn)btn.classList.toggle("hidden",!error);
  }
  function hideBoot(){document.getElementById("yandexBoot")?.remove();}

  function setPlatformMute(muted){
    window.__DREAD_PLATFORM_MUTED__=!!muted;
    if(muted){
      for(const a of [...activeAudio]){try{a.pause();}catch{}}
      document.querySelectorAll("audio,video").forEach(a=>{try{a.pause();}catch{}});
    }
  }
  function gameplayShouldRun(){
    if(platformPaused||adOpen||document.hidden)return false;
    const lobby=document.getElementById("lobby"),death=document.getElementById("deathOverlay"),pause=document.getElementById("pauseOverlay"),auth=document.getElementById("authOverlay");
    return !!(lobby&&!lobby.classList.contains("visible")&&!(death?.classList.contains("visible"))&&!(pause?.classList.contains("visible"))&&!(auth?.classList.contains("visible")));
  }
  function syncGameplayMark(){
    const active=gameplayShouldRun();
    if(active===gameplayMarked)return;
    gameplayMarked=active;
    try{active?ysdk?.features?.GameplayAPI?.start():ysdk?.features?.GameplayAPI?.stop();}catch(e){console.warn("[Yandex] GameplayAPI",e);}
  }
  function platformPause(reason){
    if(platformPaused&&reason!=="ad")return;
    platformPaused=true;setPlatformMute(true);
    try{ysdk?.features?.GameplayAPI?.stop();}catch{}
    gameplayMarked=false;
    window.dispatchEvent(new CustomEvent("dread:yandex-pause",{detail:{reason}}));
  }
  function platformResume(reason){
    if(adOpen||document.hidden)return;
    platformPaused=false;setPlatformMute(false);
    window.dispatchEvent(new CustomEvent("dread:yandex-resume",{detail:{reason}}));
    setTimeout(syncGameplayMark,0);
  }

  async function createBackendSession(){
    bootText("Создаём профиль игрока…");
    player=await ysdk.getPlayer();
    const playerId=player.getUniqueID();
    if(!playerId)throw new Error("Yandex Player ID is unavailable");
    let displayName="Player";
    try{displayName=player.getName()||displayName;}catch{}
    const response=await fetch(BACKEND+"/api/yandex/session",{
      method:"POST",headers:{"Content-Type":"application/json"},cache:"no-store",
      body:JSON.stringify({playerId,displayName})
    });
    const payload=await response.json().catch(()=>({}));
    if(!response.ok||!payload.ok||!payload.session?.token)throw new Error(payload.message||"Backend session failed");
    localStorage.setItem("night_shift_duo_session_v1",payload.session.token);
    window.__DREAD_YANDEX_PLAYER__={id:playerId,name:displayName,starterGift:!!payload.starterGift};
    return payload;
  }

  function mapLanguage(){
    const code=String(ysdk?.environment?.i18n?.lang||"en").toLowerCase();
    const ruLike=new Set(["ru","be","kk","uk","uz"]);
    localStorage.setItem("nsd_language",ruLike.has(code)?"ru":"en");
    window.__DREAD_YANDEX_LANG__=code;
  }

  function loadGame(){
    return new Promise((resolve,reject)=>{
      const src=window.__DREAD_GAME_SRC__;
      if(!src)return reject(new Error("Game bundle path is missing"));
      const s=document.createElement("script");s.src=src;s.defer=false;
      s.onload=resolve;s.onerror=()=>reject(new Error("Game bundle failed to load"));
      document.body.appendChild(s);
    });
  }

  function setupReadyWatcher(){
    const end=Date.now()+20000;
    const timer=setInterval(()=>{
      const lobby=document.getElementById("lobby"),auth=document.getElementById("authOverlay");
      if(lobby?.classList.contains("visible")&&!auth?.classList.contains("visible")){
        clearInterval(timer);if(!readySent){readySent=true;try{ysdk.features.LoadingAPI?.ready();}catch{}hideBoot();}
      }else if(Date.now()>end){clearInterval(timer);bootText("Сервер игры не ответил. Проверь подключение и нажми «Повторить».",true);}
    },120);
  }

  function setupPlatformEvents(){
    try{ysdk.on("game_api_pause",()=>platformPause("platform"));ysdk.on("game_api_resume",()=>platformResume("platform"));}catch{}
    document.addEventListener("visibilitychange",()=>document.hidden?platformPause("hidden"):platformResume("visible"));
    window.addEventListener("blur",()=>platformPause("blur"));
    window.addEventListener("focus",()=>platformResume("focus"));
    document.addEventListener("contextmenu",e=>{if(e.target.closest("#game,canvas,.overlay,.lobby"))e.preventDefault();});
    setInterval(syncGameplayMark,250);
  }

  function showFullscreenThen(fn){
    if(!ysdk?.adv?.showFullscreenAdv){fn?.();return;}
    adOpen=true;platformPause("ad");
    try{
      ysdk.adv.showFullscreenAdv({callbacks:{
        onOpen:()=>{adOpen=true;platformPause("ad");},
        onClose:()=>{adOpen=false;platformPaused=false;setPlatformMute(false);window.dispatchEvent(new CustomEvent("dread:yandex-resume",{detail:{reason:"ad"}}));syncGameplayMark();fn?.();},
        onError:(e)=>{console.warn("[Yandex] fullscreen ad",e);adOpen=false;platformPaused=false;setPlatformMute(false);syncGameplayMark();fn?.();}
      }});
    }catch(e){console.warn("[Yandex] fullscreen ad",e);adOpen=false;platformPaused=false;setPlatformMute(false);fn?.();}
  }

  function installRetryAd(){
    document.addEventListener("click",e=>{
      const btn=e.target.closest("#retryRunBtn");if(!btn||retryBypass)return;
      e.preventDefault();e.stopImmediatePropagation();
      retryBypass=true;showFullscreenThen(()=>{setTimeout(()=>{btn.click();retryBypass=false;},0);});
    },true);
  }

  function installRewarded(){
    const btn=document.createElement("button");btn.id="yandexRewardBtn";btn.type="button";btn.className="yandex-reward-btn hidden";btn.innerHTML="🎬 <b>+20 G</b><span>за рекламу</span>";
    document.body.appendChild(btn);
    btn.addEventListener("click",()=>{
      if(adOpen||!ysdk?.adv?.showRewardedVideo)return;
      let rewarded=false;adOpen=true;platformPause("rewarded");
      try{
        ysdk.adv.showRewardedVideo({callbacks:{
          onOpen:()=>{adOpen=true;platformPause("rewarded");},
          onRewarded:()=>{rewarded=true;window.dispatchEvent(new Event("dread:yandex-rewarded"));},
          onClose:()=>{adOpen=false;platformPaused=false;setPlatformMute(false);syncGameplayMark();if(rewarded)btn.disabled=true;setTimeout(()=>btn.disabled=false,60000);},
          onError:(e)=>{console.warn("[Yandex] rewarded ad",e);adOpen=false;platformPaused=false;setPlatformMute(false);syncGameplayMark();}
        }});
      }catch(e){console.warn("[Yandex] rewarded ad",e);adOpen=false;platformPaused=false;setPlatformMute(false);}
    });
    setInterval(()=>{
      const lobby=document.getElementById("lobby"),auth=document.getElementById("authOverlay");
      btn.classList.toggle("hidden",!(lobby?.classList.contains("visible")&&!auth?.classList.contains("visible")));
    },300);
  }

  function installCloudTelemetry(){
    if(!player?.setData)return;
    const saveHeartbeat=async()=>{try{await player.setData({dreadShiftPlatform:{version:BUILD,lastSeen:Date.now()}},false);}catch(err){console.warn("[Yandex] cloud telemetry",err);}};
    saveHeartbeat();cloudTimer=setInterval(saveHeartbeat,120000);
  }

  async function init(){
    mountBoot();
    if(!/^https:\/\//i.test(BACKEND))throw new Error("YANDEX_BACKEND_URL must use https");
    if(typeof YaGames==="undefined")throw new Error("Yandex Games SDK was not loaded");
    bootText("Инициализируем платформу…");
    ysdk=await YaGames.init();window.ysdk=ysdk;
    mapLanguage();setupPlatformEvents();
    await createBackendSession();
    installCloudTelemetry();
    document.documentElement.classList.add("yandex-session-ready");
    bootText("Загружаем DREAD SHIFT…");
    await loadGame();
    setupReadyWatcher();installRetryAd();installRewarded();
  }
  init().catch(err=>{console.error("[Yandex bootstrap]",err);bootText("Не удалось запустить игру: "+(err?.message||err),true);});
})();