import {biteMotion,signalCaption} from './bite-motion.js?v=0.9.0';
import {Preparation} from './preparation.js?v=0.9.0';
import {METHODS,BAITS,FEEDS,setupSummary,validateLoadout} from './tackle.js?v=0.9.0';
import {showCatchPhoto,photoFor} from './fish-photos.js?v=0.9.0';
import {FishingSession as Fishing} from './session.js?v=0.9.0';
import {LakeScene} from './photo-scene.js?v=0.9.0';
const $=id=>document.getElementById(id);const game=new Fishing();let lake;let last=performance.now(),started=false,drawerOpen=false,audio=null,soundOn=false,toastTimer;
const setHidden=(id,hidden)=>$(id).classList.toggle('hidden',hidden);
function toast(message){$('toast').textContent=message;setHidden('toast',false);clearTimeout(toastTimer);toastTimer=setTimeout(()=>setHidden('toast',true),4000);}
function setPause(){game.paused=!started||drawerOpen||preparation.opened||document.hidden||game.phase==='landed';game.reeling=false;game.lifting=false;}
function loadJournal(){try{const raw=JSON.parse(localStorage.getItem('reviry-vajgar-journal')||'[]');if(Array.isArray(raw))game.journal=raw.filter(c=>c&&typeof c.name==='string'&&Number.isFinite(c.weight)&&Number.isFinite(c.length)&&typeof c.date==='string').slice(0,100);}catch{}}
function saveJournal(){try{localStorage.setItem('reviry-vajgar-journal',JSON.stringify(game.journal));}catch{toast('Deník se nepodařilo uložit. Může být plné úložiště prohlížeče.');}}
function renderJournal(){const container=$('catches');container.replaceChildren();if(!game.journal.length){const p=document.createElement('p');p.textContent='První stránka ještě čeká. Nahoď a přidej první úlovek.';container.append(p);return;}
 for(const fish of game.journal){const row=document.createElement('div');row.className='catch-row';const name=document.createElement('span');name.textContent=fish.name;const small=document.createElement('small');const date=new Date(fish.date);small.textContent=`${fish.weight.toLocaleString('cs-CZ')} kg · ${fish.length} cm · ${Number.isNaN(date.getTime())?'':date.toLocaleDateString('cs-CZ')}`;const photo=photoFor(fish);if(photo){const image=document.createElement('img');image.src=photo.src;image.alt=photo.name;image.loading='lazy';row.append(image);}const details=document.createElement('div');details.append(name,small);if(fish.loadout&&validateLoadout(fish.loadout).length===0){const gear=document.createElement('small');gear.textContent=setupSummary(fish.loadout);details.append(gear);}row.append(details);container.append(row);}}
function ensureAudio(){if(audio)return;const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;audio=new Audio();const buffer=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate);const channel=buffer.getChannelData(0);let last=0;for(let i=0;i<channel.length;i++){last=(last+(Math.random()*2-1)*.035)/1.025;channel[i]=last;}
 const noise=audio.createBufferSource();noise.buffer=buffer;noise.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=850;const gain=audio.createGain();gain.gain.value=.10;noise.connect(filter).connect(gain).connect(audio.destination);noise.start();}
async function toggleSound(){ensureAudio();if(!audio){toast('Zvuk není v tomto prohlížeči dostupný.');return;}soundOn=!soundOn;if(soundOn)await audio.resume();else await audio.suspend();$('sound').textContent=soundOn?'Zvuk zap.':'Zvuk vyp.';$('sound').setAttribute('aria-pressed',String(soundOn));}
function tickSound(){if(!audio||!soundOn||audio.state!=='running')return;const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(800,audio.currentTime);o.frequency.exponentialRampToValueAtTime(360,audio.currentTime+.04);g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.05);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.06);}
let lastTick=0;
const phaseText={ready:['POLOŽENÁ · MECHANICKÉ ČIHÁTKO','Klid před záběrem.','Podrž NAHODIT, zvol sílu a pusť.','NAHODIT','podrž a pusť'],casting:['NÁHOZ','Najdi správnou vzdálenost.','Uvolni tlačítko a nahoď.','PUSTIT','uvolni pro nához'],flying:['NÁHOZ','Nástraha míří na místo.','Sleduj dopad na hladinu.','LETÍ…',''],waiting:['NÁSTRAHA VE VODĚ','Teď jen ty a voda.','Sleduj čihátko pod prutem. Záběr chvíli potrvá.','ČEKÁM NA ZÁBĚR',''],bite:['ZÁBĚR · ČIHÁTKO SE HÝBE','Něco je na nástraze.','Vezmi prut do ruky. Pak přijde zásek.','VZÍT PRUT','klepni'],held:['PRUT V RUCE','Teď zasekni.','Zvedni špičku a napni vlasec.','ZASEKNOUT','klepni'],fight:['ZDOLÁVÁNÍ','Drž kontakt s rybou.','Při silném tahu povol brzdu a pusť navíjení.','NAVÍJET','drž tlačítko'],landed:['ÚLOVEK','Podařilo se.','Ryba je bezpečně v podběráku.','DALŠÍ NÁHOZ',''],escaped:['RYBA UNIKLA','Tak příště.','','ZKUSIT ZNOVU','podrž a pusť']};
const strikeLabels={empty:['NEPLATNÝ ZÁSEK','Zásek do prázdna.','Naprázdno'],early:['PŘEDČASNÝ ZÁSEK','Zasekl jsi příliš brzy.','Brzký zásek'],late:['POZDNÍ ZÁSEK','Zasekl jsi pozdě.','Pozdní zásek'],slack:['CHYBĚL KONTAKT','Vlasec byl povolený.','Bez kontaktu'],missed:['ZMEŠKANÝ ZÁBĚR','Ryba nástrahu pustila.','Zmeškaný záběr']};
let renderedPhase='',renderedDock='';
function saveSetup(){try{localStorage.setItem('reviry-session-setup',JSON.stringify(game.exportSetup()));}catch{}}
function updateRodDock(){
 const key=game.enabledRods.map(r=>r.phase+'/'+r.loadout.method+'/'+(r.result?.strike?.outcome||'')).join('|')+game.activeIndex;
 if(key===renderedDock)return;renderedDock=key;
 const labels={ready:'Připraven',casting:'Nához',flying:'Nához',waiting:'Ve vodě',bite:'ZÁBĚR!',held:'V ruce',fight:'Zdolávání',landed:'Úlovek',escaped:'Unikla'};
 const locked=['casting','flying','held','fight','landed'].includes(game.phase);
 $('rodDock').innerHTML=game.enabledRods.map((r,i)=>`<button type="button" data-rod="${i}" class="rod-tab ${i===game.activeIndex?'selected':''} ${r.phase==='bite'?'bite':''}" ${locked&&i!==game.activeIndex?'disabled':''} aria-pressed="${i===game.activeIndex}"><strong>PRUT ${i+1}</strong><span>${r.phase==='escaped'&&strikeLabels[r.result?.strike?.outcome]?strikeLabels[r.result.strike.outcome][2]:labels[r.phase]}</span></button>`).join('')+(game.secondEnabled?`<button id="foldRod" class="rod-extra" ${locked?'disabled':''}>Složit 2. prut</button>`:game.loadout.method!=='float'?`<button id="addRod" class="rod-extra" ${locked?'disabled':''}>+ Druhý prut</button>`:'');
}
$('signalToggle').onclick=()=>{const expanded=$('signalFocus').classList.toggle('expanded');$('signalToggle').setAttribute('aria-expanded',String(expanded));$('signalToggle').setAttribute('aria-label',expanded?'Skrýt optický detail':'Zvětšit signalizaci');};
$('rodDock').addEventListener('click',e=>{const button=e.target.closest('[data-rod]');if(button){if(!game.select(Number(button.dataset.rod)))toast('Nejprve dokonči práci s prutem v ruce.');}else if(e.target.closest('#addRod')){game.enableSecond();}else if(e.target.closest('#foldRod')){if(!game.foldSecond())toast('Druhý prut nejprve bezpečně stáhni.');}renderedPhase='';renderedDock='';saveSetup();});
function updateUI(){const p=game.phase,t=phaseText[p],method=METHODS[game.loadout.method],isFloat=game.loadout.method==='float';if(p!==renderedPhase){$('drag').value=String(Math.round(game.drag*100));$('dragValue').textContent=`${Math.round(game.drag*100)} %`;document.body.dataset.phase=p;$('eyebrow').textContent=p==='ready'?`${method.name.toUpperCase()} · ${method.indicator.toUpperCase()}`:p==='bite'?`ZÁBĚR · ${method.indicator.toUpperCase()}`:t[0];$('status').textContent=t[1];$('hint').textContent=p==='escaped'?game.result.reason:p==='waiting'?`Sleduj ${method.indicator}. Nástraha: ${BAITS[game.loadout.bait].name}.`:p==='bite'?(isFloat?'Splávek se potápí. Teď zasekni.':'Vezmi prut a potom zasekni.'):t[2];$('action').replaceChildren(document.createTextNode(p==='bite'&&isFloat?'ZASEKNOUT':t[3]));if(t[4]){const span=document.createElement('span');span.textContent=t[4];$('action').append(span);}$('action').disabled=['flying','waiting','landed'].includes(p);setHidden('fightPanel',p!=='fight');setHidden('lift',p!=='fight');setHidden('net',p!=='fight');setHidden('retrieve',!['waiting','bite','held'].includes(p));setHidden('castMeter',p!=='casting');renderedPhase=p;}
 updateRodDock();
 const showSignal=['waiting','bite'].includes(p)||(p==='held'&&game.loadout.method==='feeder'),motion=biteMotion(game,game.time);setHidden('signalFocus',!showSignal);
 $('signalTitle').textContent=`${isFloat?'Splávek':game.loadout.method==='feeder'?'Špička':'Čihátko'} · ${game.activeIndex+1}`;$('signalState').textContent=signalCaption(game);
 $('signalFocus').classList.toggle('bite',motion.stage==='run');$('signalFocus').classList.toggle('touch',motion.stage==='touch');$('signalFocus').classList.toggle('fading',motion.stage==='fading');
 lake?.setSignalVisible?.(showSignal&&$('signalFocus').classList.contains('expanded'));
 setHidden('earlyStrike',p!=='waiting');setHidden('takeUp',p!=='held'||game.slackToTake<=.02);
 $('takeUp').textContent=game.reeling?'Dobírám vlasec…':'Dobrat vlasec · podrž';
 if(['bite','held'].includes(p)){
  const loose=p==='held'&&game.slackToTake>.02;
  $('status').textContent=loose?'Nejprve dober vlasec.':motion.stage==='touch'?'Ryba nástrahu ochutnává.':motion.stage==='fading'?'Záběr slábne.':isFloat||p==='held'?'Teď zasekni.':'Vezmi prut a zasekni.';
  $('eyebrow').textContent=loose?'POVOLENÝ VLASEC':motion.stage==='touch'?'DOTYKY NÁSTRAHY':motion.stage==='fading'?'RYBA POUŠTÍ NÁSTRAHU':'SOUVISLÝ ZÁBĚR';
  $('hint').textContent=loose?'Krátce podrž DOBRAT VLASEC, potom zasekni.':motion.stage==='touch'?'Krátké ťuknutí ještě není jistý záběr.':signalCaption(game);
 }
 if(p==='escaped'&&strikeLabels[game.result?.strike?.outcome]){const label=strikeLabels[game.result.strike.outcome];$('eyebrow').textContent=label[0];$('status').textContent=label[1];}
 $('loadoutBadge').textContent=setupSummary(game.loadout);
 $('tackle').disabled=['fight','casting','flying','landed'].includes(p);
 const canFeed=p==='waiting'&&game.loadout.feed!=='none';setHidden('feed',!canFeed);
 $('feed').textContent=`ZAKRMIT ${game.loadout.feedPortion} g`;$('feed').disabled=game.loadout.feed==='none'||game.feedStocks[game.loadout.feed]<game.loadout.feedPortion;
 if(p==='casting')$('castFill').style.width=`${game.castPower*100}%`;
 if(p==='fight'){$('distance').textContent=`${game.distance.toFixed(1)} m`;$('stamina').textContent=`${Math.round((1-game.stamina)*100)} %`;$('tensionFill').style.left=`${Math.min(100,game.tension*100)}%`;$('tensionText').textContent=game.tension>.85?'Povol brzdu!':game.tension<.15?'Povolený vlasec':'V pořádku';$('tensionText').style.color=game.tension>.85?'#f4a18a':'#c4d7c7';$('net').disabled=game.distance>4||game.stamina>.22;$('lift').classList.toggle('active',game.lifting);if(game.distance<4&&game.stamina<=.22)$('hint').textContent='Ryba je u břehu a unavená. Teď ji podeber.';else $('hint').textContent=t[2];}
 if(p==='bite'&&game.loadout.method==='ledger'&&game.time-lastTick>.6){tickSound();lastTick=game.time;}
}
function actionDown(e){e.preventDefault();if(game.paused)return;const p=game.phase;if(['ready','escaped'].includes(p)){game.startCast();}else if(p==='bite'){if(game.loadout.method==='float')game.strike();else game.grab();}else if(p==='held'){game.strike();}else if(p==='fight'){game.reeling=true;}}
function actionUp(e){e.preventDefault();if(game.phase==='casting')game.releaseCast();game.reeling=false;}
$('action').addEventListener('pointerdown',e=>{if(e.button!==0)return;$('action').setPointerCapture(e.pointerId);actionDown(e);});$('action').addEventListener('pointerup',actionUp);$('action').addEventListener('pointercancel',e=>{if(game.phase==='casting'){game.phase='ready';game.emit('cast-cancel');}game.reeling=false;});$('action').addEventListener('lostpointercapture',()=>{game.reeling=false;});
$('action').addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key)&&!e.repeat)actionDown(e);});$('action').addEventListener('keyup',e=>{if([' ','Enter'].includes(e.key))actionUp(e);});
$('lift').addEventListener('pointerdown',e=>{e.preventDefault();if(game.paused)return;$('lift').setPointerCapture(e.pointerId);game.lifting=true;});for(const type of ['pointerup','pointercancel','lostpointercapture'])$('lift').addEventListener(type,()=>game.lifting=false);
$('lift').addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();game.lifting=true;}});$('lift').addEventListener('keyup',()=>game.lifting=false);
$('drag').addEventListener('input',e=>{game.drag=Number(e.target.value)/100;$('dragValue').textContent=`${e.target.value} %`;});$('earlyStrike').onclick=()=>{if(!game.paused)game.strike();};
$('takeUp').addEventListener('pointerdown',e=>{e.preventDefault();if(game.paused||game.phase!=='held')return;$('takeUp').setPointerCapture(e.pointerId);game.reeling=true;});for(const type of ['pointerup','pointercancel','lostpointercapture'])$('takeUp').addEventListener(type,()=>game.reeling=false);
$('takeUp').addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();if(!game.paused&&game.phase==='held')game.reeling=true;}});$('takeUp').addEventListener('keyup',()=>game.reeling=false);
$('net').onclick=()=>game.net();$('retrieve').onclick=()=>game.retrieve();
const preparation=new Preparation({game,onApply:loadout=>{
 if(['waiting','bite','held'].includes(game.phase))game.retrieve();
 if(!game.setLoadout(loadout)){toast('Sestavu teď nelze použít. Nejprve dokonči lov.');return;}
 try{localStorage.setItem('reviry-loadout',JSON.stringify(game.loadout));saveSetup();}catch{toast('Sestava funguje, ale nepodařilo se ji uložit pro příště.');}
 started=true;setHidden('intro',true);preparation.close();renderedPhase='';setPause();
 toast(`Sestava připravena: ${METHODS[game.loadout.method].name}. Nástraha: ${BAITS[game.loadout.bait].name}.`);setTimeout(()=>$('lookHint').style.opacity=0,6000);
},onClose:()=>{preparation.close();setPause();}});
function openPreparation(){if(['fight','casting','flying','landed'].includes(game.phase)){toast('Nejprve dokonči aktuální nához nebo zdolávání.');return;}preparation.open();setPause();}
$('start').onclick=openPreparation;$('tackle').onclick=openPreparation;
$('journalTackle').onclick=()=>{if(['fight','casting','flying','landed'].includes(game.phase)){toast('Nejprve dokonči aktuální lov.');return;}drawerOpen=false;setHidden('drawer',true);openPreparation();};
$('feed').onclick=()=>{if(game.paused)return;if(!game.feed())toast('Na tuto dávku už nemáš dost krmení.');};

$('menu').onclick=()=>{drawerOpen=true;renderJournal();setHidden('drawer',false);setPause();if(game.phase==='casting'){game.phase='ready';renderedPhase='';}};$('closeDrawer').onclick=()=>{drawerOpen=false;setHidden('drawer',true);setPause();};
$('release').onclick=()=>{setHidden('catchOverlay',true);game.phase='ready';game.result=null;renderedPhase='';setPause();};
$('sound').onclick=toggleSound;$('quality').onclick=()=>{lake.setQuality(!lake.high);$('quality').textContent=lake.high?'HD':'ECO';toast(lake.high?'Vyšší kvalita grafiky':'Úspornější vykreslování');};
function fatal(error){console.error(error);setHidden('loading',true);setHidden('fatal',false);$('fatalMessage').textContent='Fotografický revír se nepodařilo načíst. Obnov stránku a zkontroluj připojení. Detail: '+String(error?.message||error).slice(0,180);}
document.addEventListener('visibilitychange',()=>{if(game.phase==='casting'){game.phase='ready';renderedPhase='';}setPause();if(audio){if(document.hidden)audio.suspend();else if(soundOn)audio.resume();}});window.addEventListener('blur',()=>{game.reeling=false;game.lifting=false;});
game.onEvent=(event,data)=>{
 renderedPhase='';const index=data.rodIndex??game.activeIndex,rod=game.rods[index],prefix=game.secondEnabled?`Prut ${index+1}: `:'';
 if(['rod-selected','rod-added','rod-folded'].includes(event)){renderedDock='';saveSetup();return;}
 if(event==='cast'){lake?.setCastDirection(index);rod.castAngle=lake?.yaw||0;}
 if(event==='splash')lake?.splash(index);
 if(event==='feed'){lake?.scatterFeed(index);toast(`${prefix}Zakrmil jsi ${rod.loadout.feedPortion} g. Zbývá ${rod.feedStocks[rod.loadout.feed]} g.`);}
 if(event==='bite'){if(index!==game.activeIndex)toast(prefix+(rod.loadout.method==='float'?'Splávek! Zasekni.':rod.loadout.method==='feeder'?'Špička se ohýbá! Vezmi prut a zasekni.':'Čihátko! Vezmi prut a zasekni.'));navigator.vibrate?.([60,80,60]);}
 if(event==='hooked'){toast(prefix+(data.strike?.quality<.8?'Slabší zásek. Udržuj napnutý vlasec.':'Čistý zásek. Drž NAVÍJET a hlídej napětí.'));navigator.vibrate?.(80);}
 if(event==='escaped')toast(prefix+data.reason);
 if(event==='landed'){showCatchPhoto(data,$('fishIllustration'),$('fishPhotoCredit'));$('catchSetup').textContent=setupSummary(data.loadout)+(data.strike?' · Zásek: '+(data.strike.quality>=.8?'čistý kontakt':'slabší kontakt'):'');$('fishName').textContent=data.name;$('fishWeight').textContent=data.weight.toLocaleString('cs-CZ');$('fishLength').textContent=data.length;setHidden('catchOverlay',false);saveJournal();setPause();}
};
async function boot(){loadJournal();try{const session=JSON.parse(localStorage.getItem('reviry-session-setup')||'null');if(!game.restoreSetup(session)){const saved=JSON.parse(localStorage.getItem('reviry-loadout')||'null');if(saved&&validateLoadout(saved).length===0)game.setLoadout(saved);}}catch{}setPause();try{lake=await new LakeScene($('world'),game).init();lake.setSignalCanvas?.($('signalCanvas'));$('quality').textContent=lake.high?'HD':'ECO';$('geoCredit').textContent='Výhled tvoří skutečná fotografie Vajgaru od Wwery, doplněná o pohyb vody a vybavení. Prut a naviják vycházejí z fotografie JaredMcKenzie (CC0); splávek Geotek (CC BY-SA 3.0). Pozadí náčiní bylo odstraněno pomocí AI, grafika je ilustrační a nemusí odpovídat vybranému modelu. Jde o fotografický pohled s omezeným posunem kamery. Hloubky a chování ryb jsou herní model.';setHidden('loading',true);if(lake.assetWarnings.length)toast('Část grafických podkladů se nenačetla. Zkus obnovit stránku.');requestAnimationFrame(frame);}catch(error){fatal(error);}}
function frame(now){const dt=Math.min(.25,Math.max(0,(now-last)/1000));last=now;try{game.advance(dt);updateUI();document.documentElement.style.setProperty('--fishing-hud-height',`${window.innerHeight-$('fishingUI').getBoundingClientRect().top}px`);lake.setUiBounds?.({hudTop:$('fishingUI').getBoundingClientRect().top,headerBottom:Math.max(document.querySelector('header').getBoundingClientRect().bottom,$('rodDock').getBoundingClientRect().bottom)});if(!document.hidden)lake.render(game.paused?0:dt);}catch(error){fatal(error);return;}requestAnimationFrame(frame);}
// Diagnostics expose observable state only; normal play never depends on this interface.
window.reviry={getState:()=>({activeRod:game.activeIndex+1,rodCount:game.enabledRods.length,rods:game.enabledRods.map(r=>({phase:r.phase,loadout:{...r.loadout},distance:r.distance})),phase:game.phase,loadout:{...game.loadout},feedBonus:game.feedBonus,feedStocks:{...game.feedStocks},distance:game.distance,stamina:game.stamina,tension:game.tension,catches:game.journal.length,paused:game.paused,engine:lake?.metrics?.engine,assetWarnings:lake?.assetWarnings,drawImages:lake?.metrics?.drawImages}),version:'0.9.0'};
boot();
