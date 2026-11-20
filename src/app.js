import {LakeSound} from './soundscape.js?v=0.22.0';
import {alarmStep} from './encounter.js?v=0.22.0';
import {TripPlanner} from './trip-planner.js?v=0.22.0';
import {VENUES,STOCK_SOURCES,SPECIES_NAMES,getVenue} from './venues.js?v=0.22.0';
import {biteMotion,signalCaption} from './bite-motion.js?v=0.22.0';
import {Preparation} from './preparation.js?v=0.22.0';
import {METHODS,BAITS,FEEDS,setupSummary,validateLoadout} from './tackle.js?v=0.22.0';
import {showCatchPhoto,photoFor} from './fish-photos.js?v=0.22.0';
import {FishingSession as Fishing} from './session.js?v=0.22.0';
import {LakeScene} from './photo-scene.js?v=0.22.5';
const $=id=>document.getElementById(id);
// Preserve a tappable water area on portrait phones; spots remain expandable on demand.
if(window.matchMedia('(max-width:650px) and (orientation:portrait)').matches) $('targetPanel').open=false;const game=new Fishing();let lake;let last=performance.now(),started=false,drawerOpen=false,audio=null,soundOn=false,toastTimer,venueOpen=false,venueLoading=false;
let missionsOpen=false,missionLoading=false,freeStarted=false,missionRecorded=false;
let missionRecords={};try{missionRecords=JSON.parse(localStorage.getItem("reviry-mission-records")||"{}");if(!missionRecords||typeof missionRecords!=="object")missionRecords={};}catch{}
let volume=1;try{const saved=localStorage.getItem('reviry-volume');if(saved!==null&&Number.isFinite(Number(saved)))volume=Math.max(0,Math.min(1,Number(saved)));}catch{}
$('volume').value=String(Math.round(volume*100));$('volumeValue').textContent=`${Math.round(volume*100)} %`;
$('volume').addEventListener('input',e=>{volume=Number(e.target.value)/100;audio?.setVolume?.(volume);$('volumeValue').textContent=`${e.target.value} %`;try{localStorage.setItem('reviry-volume',String(volume));}catch{}});
let guideOn=false;try{guideOn=localStorage.getItem('reviry-guide')==='on';}catch{}
function refreshGuide(){document.body.classList.toggle('immersive',!guideOn);$('guideMode').textContent=guideOn?'Průvodce: zap.':'Průvodce: vyp.';$('guideMode').setAttribute('aria-pressed',String(guideOn));}
$('guideMode').onclick=()=>{guideOn=!guideOn;try{localStorage.setItem('reviry-guide',guideOn?'on':'off');}catch{}refreshGuide();renderedPhase='';renderedDock='';};refreshGuide();
const caption=rod=>guideOn?signalCaption(rod):signalCaption(rod).replace(/ · zasekni/g,'');
const setHidden=(id,hidden)=>$(id).classList.toggle('hidden',hidden);
function toast(message){$('toast').textContent=message;setHidden('toast',false);clearTimeout(toastTimer);toastTimer=setTimeout(()=>setHidden('toast',true),4000);}
function setPause(){game.paused=!!game.mission?.finished||missionsOpen||missionLoading||!started||drawerOpen||venueOpen||tripPlanner.opened||preparation.opened||document.hidden||game.phase==='landed';game.reeling=false;game.lifting=false;game.steer=0;audio?.setPaused?.(game.paused);}
function loadJournal(){try{const raw=JSON.parse(localStorage.getItem('reviry-vajgar-journal')||'[]');if(Array.isArray(raw))game.journal=raw.filter(c=>c&&typeof c.name==='string'&&Number.isFinite(c.weight)&&Number.isFinite(c.length)&&typeof c.date==='string').slice(0,100);}catch{}}
function saveJournal(){try{localStorage.setItem('reviry-vajgar-journal',JSON.stringify(game.journal));}catch{toast('Deník se nepodařilo uložit. Může být plné úložiště prohlížeče.');}}
function venueDetails(v){return `<p>${v.evidence}</p><p><strong>Ve hře:</strong> ${v.playable.map(id=>SPECIES_NAMES[id]).join(', ')}.</p><p><strong>Další údaje ve zdrojích:</strong> ${v.reported.join(', ')}.</p><p>${v.photo.note} Autor: <a href="${v.photo.source}" target="_blank" rel="noopener">${v.photo.author}</a>, <a href="${v.photo.licenseUrl}" target="_blank" rel="noopener">${v.photo.license}</a>. ${v.photo.external?'Externí originál se načítá od vydavatele, není zahrnutý do souborů hry.':'Zmenšení a WebP.'} Ořez, animace a rozšíření hladiny, společné AI popředí.</p><ul>${v.sources.map(id=>{const s=STOCK_SOURCES[id];return `<li><a href="${s.url}" target="_blank" rel="noopener">${s.title}</a><br>${s.scope}</li>`;}).join('')}</ul>`;}
function updateVenue(){
 const v=getVenue(game.venueId),p=lake?.venueId===game.venueId?lake.photo:v.photo;document.title=`REVÍRY · ${v.name}`;$('locationName').textContent=v.short;$('locationRegion').textContent=v.region.toUpperCase();$('world').setAttribute('aria-label',`Revír ${v.name} · ${p.note}`);
 $('sceneNote').replaceChildren(document.createTextNode(`${v.short} / ${p.verified?'FOTOGRAFICKÝ REVÍR':'ILUSTRAČNÍ PROSTŘEDÍ'} `));const version=document.createElement('span');version.textContent='0.22.0';$('sceneNote').append(version);
 $('welcomeTitle').textContent=v.intro;$('venueEvidence').innerHTML=venueDetails({...v,photo:p});$('venuePhotoNotice').textContent=p.externalUnavailable?'Fotografie Jarošova se nenačetla · dočasně ILUSTRAČNÍ MATĚJOVEC':'ILUSTRAČNÍ MATĚJOVEC · fotografie cílové nádrže zatím chybí';setHidden('venuePhotoNotice',p.verified);document.body.classList.toggle('illustrative-venue',!p.verified);
 $('photoCredit').innerHTML=`${p.verified?'':'<b>ILUSTRAČNÍ MATĚJOVEC · </b>'}<a href="${p.source}" target="_blank" rel="noopener">Foto: ${p.author}</a> · <a href="${p.licenseUrl}" target="_blank" rel="noopener">${p.license}</a><span> · ořez / rozšířená hladina / AI náčiní a popředí</span>`;updateTrip();
}
function renderVenues(){
 const blocked=game.enabledRods.some(r=>!['ready','escaped'].includes(r.phase));$('venuesHelp').textContent=blocked?'Před změnou revíru nejprve stáhni oba pruty a dokonči zdolávání.':'Vyber vodu. Sestava i zásoby zůstávají, zakrmené místo se při přesunu opustí.';
 $('venuesCards').innerHTML=Object.values(VENUES).map(v=>`<article class="venue-card ${v.id===game.venueId?'selected':''}"><img src="${v.photo.src}" alt="${v.photo.note}"><div class="venue-card-body"><span class="eyebrow">${v.photo.verified?'FOTOGRAFIE LOKALITY':'ILUSTRAČNÍ FOTO JINÉHO RYBNÍKA'}</span><h3>${v.name}</h3><small>${v.kind}</small><p>${v.playable.map(id=>SPECIES_NAMES[id]).join(' · ')}</p><details><summary>Osádka, ověření a podklady</summary>${venueDetails(v)}</details><button class="action" data-venue="${v.id}" ${blocked||venueLoading?'disabled':''}>${v.id===game.venueId?'ZŮSTAT U TÉTO VODY':'CHYTAT ZDE'}</button></div></article>`).join('');
}
function openVenues(){if(game.mission){toast('Revír je pro tento úkol pevně daný.');return;}venueOpen=true;renderVenues();setHidden('venuesOverlay',false);setPause();$('venuesClose').focus();}
function closeVenues(){if(venueLoading)return;venueOpen=false;setHidden('venuesOverlay',true);setPause();}
$('waters').onclick=openVenues;$('welcomeWaters').onclick=openVenues;$('venuesClose').onclick=closeVenues;
$('venuesOverlay').addEventListener('keydown',e=>{if(e.key==='Escape')closeVenues();});
$('venuesCards').addEventListener('click',async e=>{
 const b=e.target.closest('[data-venue]');if(!b||b.disabled||venueLoading)return;const id=b.dataset.venue;
 if(!Object.hasOwn(VENUES,id)||game.enabledRods.some(r=>!['ready','escaped'].includes(r.phase)))return;
 venueLoading=true;renderVenues();try{if(lake?.setVenue)await lake.setVenue(id);if(!game.setVenue(id))throw Error('Nejprve stáhni pruty.');updateVenue();updateTrip();$('wideView').textContent=lake?.wideView?'Širší záběr: zap.':'Širší záběr: vyp.';$('wideView').setAttribute('aria-pressed',String(lake?.wideView));renderedPhase='';renderedDock='';saveSetup();venueLoading=false;closeVenues();toast(`Revír: ${getVenue(id).name}.`);}catch(error){venueLoading=false;renderVenues();toast('Revír se nepodařilo načíst. '+error.message);}
});
function renderJournal(){const container=$('catches');container.replaceChildren();if(!game.journal.length){const p=document.createElement('p');p.textContent='První stránka ještě čeká. Nahoď a přidej první úlovek.';container.append(p);return;}
 for(const fish of game.journal){const row=document.createElement('div');row.className='catch-row';const name=document.createElement('span');name.textContent=fish.name+(fish.missionId?' · Úkol: '+(game.missions.find(m=>m.id===fish.missionId)?.name||fish.missionId):'');const small=document.createElement('small');const date=new Date(fish.date);small.textContent=`${fish.weight.toLocaleString('cs-CZ')} kg · ${fish.length} cm · ${Number.isNaN(date.getTime())?'':date.toLocaleDateString('cs-CZ')}`;const photo=photoFor(fish);if(photo){const image=document.createElement('img');image.src=photo.src;image.alt=photo.name;image.loading='lazy';row.append(image);}const details=document.createElement('div');details.append(name,small);if(fish.loadout&&validateLoadout(fish.loadout).length===0){const gear=document.createElement('small');gear.textContent=(fish.venueId?getVenue(fish.venueId).name+' · ':'')+setupSummary(fish.loadout)+(fish.trip?' · Výprava '+fish.trip.date+' '+fish.trip.time:'');details.append(gear);}row.append(details);container.append(row);}}
function ensureAudio(){if(audio)return;const Context=window.AudioContext||window.webkitAudioContext;if(Context){audio=new LakeSound(Context);audio.setVolume(volume);audio.setPaused(game.paused);}}
async function toggleSound(){try{ensureAudio();if(!audio){toast('Zvuk není v tomto prohlížeči dostupný.');return;}const enable=!soundOn;let missing=[];if(enable){await audio.resume();missing=await audio.loadSamples();}else await audio.suspend();soundOn=enable&&audio.state==='running';if(soundOn){audio.confirm?.();toast(missing.length?'Některé nahrávky se nenačetly. Vypni a znovu zapni zvuk pro opakování.':'Zvuk zapnutý · nahrávky náčiní připravené.');}else if(enable)toast('Prohlížeč zvuk nepovolil. Zkus hru otevřít přímo v Safari.');$('sound').textContent=soundOn?'Zvuk zap.':'Zvuk vyp.';$('sound').setAttribute('aria-pressed',String(soundOn));}catch{soundOn=false;$('sound').textContent='Zvuk vyp.';$('sound').setAttribute('aria-pressed','false');toast('Zvuk se nepodařilo spustit. Zkus na tlačítko klepnout znovu. Hra může pokračovat bez zvuku.');}}

let previewUntil=0;
for(const [id,name] of [['testReel','reel'],['testDrag','drag'],['testSplash','splash']])$(id).onclick=async()=>{if(performance.now()<previewUntil)return;previewUntil=performance.now()+1300;if(!soundOn)await toggleSound();if(soundOn)audio.preview(name);};
function tickSound(index=0,drop=false){if(audio&&soundOn)audio.alarm(index,drop);}

const alarmStates=new Map();
const phaseText={ready:['POLOŽENÁ · MECHANICKÉ ČIHÁTKO','Klid před záběrem.','Podrž NAHODIT, zvol sílu a pusť.','NAHODIT','podrž a pusť'],casting:['NÁHOZ','Najdi správnou vzdálenost.','Uvolni tlačítko a nahoď.','PUSTIT','uvolni pro nához'],flying:['NÁHOZ','Nástraha míří na místo.','Sleduj dopad na hladinu.','LETÍ…',''],waiting:['NÁSTRAHA VE VODĚ','Teď jen ty a voda.','Sleduj čihátko pod prutem. Záběr chvíli potrvá.','ČEKÁM NA ZÁBĚR',''],bite:['ZÁBĚR · ČIHÁTKO SE HÝBE','Něco je na nástraze.','Vezmi prut do ruky. Pak přijde zásek.','VZÍT PRUT','klepni'],held:['PRUT V RUCE','Teď zasekni.','Zvedni špičku a napni vlasec.','ZASEKNOUT','klepni'],fight:['ZDOLÁVÁNÍ','Drž kontakt s rybou.','Při silném tahu povol brzdu a pusť navíjení.','NAVÍJET','drž tlačítko'],landed:['ÚLOVEK','Podařilo se.','Ryba je bezpečně v podběráku.','DALŠÍ NÁHOZ',''],escaped:['RYBA UNIKLA','Tak příště.','','ZKUSIT ZNOVU','podrž a pusť']};
const strikeLabels={empty:['NEPLATNÝ ZÁSEK','Zásek do prázdna.','Naprázdno'],early:['PŘEDČASNÝ ZÁSEK','Zasekl jsi příliš brzy.','Brzký zásek'],late:['POZDNÍ ZÁSEK','Zasekl jsi pozdě.','Pozdní zásek'],slack:['CHYBĚL KONTAKT','Vlasec byl povolený.','Bez kontaktu'],missed:['ZMEŠKANÝ ZÁBĚR','Ryba nástrahu pustila.','Zmeškaný záběr']};
let renderedPhase='',renderedDock='';
function saveSetup(){if(game.mission)return;try{localStorage.setItem('reviry-session-setup',JSON.stringify(game.exportSetup()));}catch{}}
function updateRodDock(){
 const key=game.enabledRods.map(r=>r.phase+'/'+r.loadout.method+'/'+(r.result?.strike?.outcome||'')).join('|')+game.activeIndex;
 if(key===renderedDock)return;renderedDock=key;
 const labels={ready:'Připraven',casting:'Nához',flying:'Nához',waiting:'Ve vodě',bite:guideOn?'ZÁBĚR!':'Ve vodě',held:'V ruce',fight:'Zdolávání',landed:'Úlovek',escaped:'Unikla'};
 const locked=!!game.mission||['casting','flying','held','fight','landed'].includes(game.phase);
 $('rodDock').innerHTML=game.enabledRods.map((r,i)=>`<button type="button" data-rod="${i}" class="rod-tab ${i===game.activeIndex?'selected':''} ${r.phase==='bite'&&guideOn?'bite':''}" ${locked&&i!==game.activeIndex?'disabled':''} aria-pressed="${i===game.activeIndex}"><strong>PRUT ${i+1}</strong><span>${r.phase==='escaped'&&strikeLabels[r.result?.strike?.outcome]?strikeLabels[r.result.strike.outcome][2]:labels[r.phase]}</span></button>`).join('')+(game.secondEnabled?`<button id="foldRod" class="rod-extra" ${locked?'disabled':''}>Složit 2. prut</button>`:game.loadout.method!=='float'?`<button id="addRod" class="rod-extra" ${locked?'disabled':''}>+ Druhý prut</button>`:'');
}
let monitorCount=0;
function updateRodSignals(){
 const dual=game.secondEnabled;document.body.classList.toggle('two-rods',dual);setHidden('rodSignals',!dual);
 if(!dual){if(monitorCount){$('rodSignals').replaceChildren();lake?.setSignalViews?.([]);monitorCount=0;}return;}
 if(monitorCount!==2){
  $('rodSignals').innerHTML=game.enabledRods.map((r,i)=>`<button class="rod-monitor" data-signal-rod="${i}" type="button" aria-label="Sledovat prut ${i+1}"><strong>PRUT ${i+1}</strong><canvas width="240" height="180" aria-label="Živá signalizace prutu ${i+1}"></canvas><span class="monitor-state"></span><b class="monitor-action"></b></button>`).join('');
  monitorCount=2;lake?.setSignalViews?.([...$('rodSignals').querySelectorAll('canvas')].map((canvas,index)=>({index,canvas})));
 }
 const locked=['casting','flying','held','fight','landed'].includes(game.phase);
 [...$('rodSignals').children].forEach((card,i)=>{
  const rod=game.rods[i],motion=biteMotion(rod,rod.time),active=i===game.activeIndex,inWater=['waiting','bite','held'].includes(rod.phase);
  card.classList.toggle('selected',active);card.classList.toggle('bite',guideOn&&rod.phase==='bite');card.classList.toggle('empty',!inWater);card.disabled=locked&&!active;card.setAttribute('aria-pressed',String(active));
  const action=guideOn&&rod.phase==='bite'?`Vzít prut ${i+1}`:active?'Vybraný prut':`Sledovat prut ${i+1}`;
  card.setAttribute('aria-label',`${action} · ${inWater?caption(rod):rod.phase==='ready'?'Připraven k náhozu':rod.phase==='escaped'?'Zmeškaný záběr':rod.phase==='fight'?'Zdolávání':'Nához'}`);
  card.querySelector('.monitor-state').textContent=inWater?caption(rod):rod.phase==='ready'?'Připraven k náhozu':rod.phase==='escaped'?'Zmeškaný záběr':rod.phase==='fight'?'Zdolávání':'Nához';
  card.querySelector('.monitor-action').textContent=card.disabled?'Druhý prut je v ruce':action;
 });
}
$('rodSignals').addEventListener('click',e=>{
 const card=e.target.closest('[data-signal-rod]');if(!card||game.paused)return;
 if(!game.select(Number(card.dataset.signalRod))){toast('Nejprve dokonči práci s prutem v ruce.');return;}
 if(game.phase==='bite'&&guideOn)game.grab();renderedPhase='';renderedDock='';saveSetup();
});
$('signalToggle').onclick=()=>{const expanded=$('signalFocus').classList.toggle('expanded');$('signalToggle').setAttribute('aria-expanded',String(expanded));$('signalToggle').setAttribute('aria-label',expanded?'Skrýt optický detail':'Zvětšit signalizaci');};
$('rodDock').addEventListener('click',e=>{const button=e.target.closest('[data-rod]');if(button){if(!game.select(Number(button.dataset.rod)))toast('Nejprve dokonči práci s prutem v ruce.');}else if(e.target.closest('#addRod')){game.enableSecond();}else if(e.target.closest('#foldRod')){if(!game.foldSecond())toast('Druhý prut nejprve bezpečně stáhni.');}renderedPhase='';renderedDock='';saveSetup();});
function updateUI(){updateMission();const p=game.phase,t=phaseText[p],method=METHODS[game.loadout.method],isFloat=game.loadout.method==='float';const indicator=game.loadout.indicator||'bobbin',signalName=isFloat?'Splávek':game.loadout.method==='feeder'?'Špička':indicator==='electronic'?'Elektronický hlásič + swinger':indicator==='swinger'?'Swinger':'Čihátko';if(p!==renderedPhase){$('drag').value=String(Math.round(game.drag*100));$('dragValue').textContent=`${Math.round(game.drag*100)} %`;document.body.dataset.phase=p;$('targetPanel').open=['ready','escaped'].includes(p);$('eyebrow').textContent=p==='ready'?`${method.name.toUpperCase()} · ${signalName.toUpperCase()}`:p==='bite'?`ZÁBĚR · ${signalName.toUpperCase()}`:t[0];$('status').textContent=t[1];$('hint').textContent=p==='escaped'?game.result.reason:p==='waiting'?`Sleduj ${signalName.toLowerCase()}. Nástraha: ${BAITS[game.loadout.bait].name}.`:p==='bite'?(isFloat?'Splávek se potápí. Teď zasekni.':'Vezmi prut a potom zasekni.'):t[2];$('action').replaceChildren(document.createTextNode(p==='bite'&&isFloat?'ZASEKNOUT':t[3]));if(t[4]){const span=document.createElement('span');span.textContent=t[4];$('action').append(span);}$('action').disabled=['flying','waiting','landed'].includes(p);setHidden('fightPanel',p!=='fight');setHidden('lift',p!=='fight');setHidden('net',p!=='fight');setHidden('retrieve',!['waiting','bite','held'].includes(p));setHidden('castMeter',p!=='casting');renderedPhase=p;}
 updateRodDock();updateRodSignals();
 const showSignal=['waiting','bite'].includes(p)||(p==='held'&&game.loadout.method==='feeder'),motion=biteMotion(game,game.time);setHidden('signalFocus',!showSignal||game.secondEnabled);
 $('signalTitle').textContent=`${signalName} · ${game.activeIndex+1}`;$('signalState').textContent=caption(game);
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
 setHidden('targetPanel',!['ready','escaped','waiting','casting'].includes(p));
 $('targetSummary').textContent=`Místo · ${Math.round(game.aimDistance)} m`;
 $('aimLabel').textContent=`Cíl ${game.aimDistance.toFixed(1)} m · doporučená síla ${Math.round(game.recommendedPower*100)} %`;
 $('castTarget').textContent=`Značka cíle: ${Math.round(game.recommendedPower*100)} %`;$('aimMarker').style.left=`${game.recommendedPower*100}%`;
 $('castResult').textContent=game.castReport?`Dopad ${game.castReport.distance.toFixed(1)} m · odchylka ${game.castReport.error.toFixed(1)} m · ${game.area.name}`:'';
 if(p==='waiting')$('aimLabel').textContent+=` · účinek krmení u nástrahy ${Math.round(game.feedBonus*100)} %`;
 $('loadoutBadge').textContent=setupSummary(game.loadout);
 $('tackle').disabled=!!game.mission||['fight','casting','flying','landed'].includes(p);
 const canFeed=p==='waiting'&&game.loadout.feed!=='none';setHidden('feed',!canFeed);
 $('feed').textContent=`ZAKRMIT ${game.loadout.feedPortion} g`;$('feed').disabled=game.loadout.feed==='none'||game.feedStocks[game.loadout.feed]<game.loadout.feedPortion;
 if(p==='casting')$('castFill').style.width=`${game.castPower*100}%`;
 if(p==='fight'){$('dragDown').disabled=game.drag<=.08;$('dragUp').disabled=game.drag>=.95;$('distance').textContent=`${game.distance.toFixed(1)} m`;$('stamina').textContent=`${Math.round((1-game.stamina)*100)} %`;$('tensionFill').style.left=`${Math.min(100,game.tension*100)}%`;$('tensionText').textContent=game.tension>.85?'Povol brzdu!':game.tension<.15?'Povolený vlasec':'V pořádku';$('tensionText').style.color=game.tension>.85?'#f4a18a':'#c4d7c7';$('net').disabled=game.netDeployed||game.distance>5||game.stamina>.35;$('net').classList.toggle('net-ready',!$('net').disabled);$('net').textContent=game.netDeployed?'Podběrák ve vodě':$('net').disabled?'Podběrák':'VLOŽIT PODBĚRÁK';$('netState').textContent=game.netDeployed?(game.netProgress>0?'Ryba je nad košem — udrž ji v něm.':'Veď rybu k podběráku uprostřed, udrž napnutý vlasec.'):'Směr ryby ovládáš podržením šipek.';$('netProgress').value=game.netProgress;setHidden('netProgress',!game.netDeployed);$('lift').classList.toggle('active',game.lifting);if(game.distance<4&&game.stamina<=.22)$('hint').textContent='Ryba je u břehu a unavená. Teď ji podeber.';else $('hint').textContent=t[2];}
 game.enabledRods.forEach((r,index)=>{const lift=biteMotion(r,r.time).ledgerLift,next=alarmStep(r,alarmStates.get(index),lift);alarmStates.set(index,next.state);if(next.pulse)tickSound(index,lift>0);});

 if(!guideOn){
  setHidden('earlyStrike',true);
  if(['waiting','bite'].includes(p)){$('status').textContent='';$('hint').textContent='';$('eyebrow').textContent='';$('action').disabled=false;$('action').textContent=isFloat?'ZASEKNOUT':'VZÍT PRUT';}
  if(p==='held'){$('eyebrow').textContent='PRUT V RUCE';$('status').textContent='Prut v ruce.';$('hint').textContent=game.slackToTake>.02?'Vlasec je povolený.':'';}
  if(p==='fight'){$('status').textContent='';$('hint').textContent='';}
 }

}
function actionDown(e){e.preventDefault();if(game.paused&&!document.hidden)setPause();if(game.paused)return;const p=game.phase;if(['ready','escaped'].includes(p)){game.startCast();}else if(p==='waiting'&&!guideOn){if(game.loadout.method==='float')game.strike();else game.grab();}else if(p==='bite'){if(game.loadout.method==='float')game.strike();else game.grab();}else if(p==='held'){game.strike();}else if(p==='fight'){game.reeling=true;}}
function actionUp(e){e.preventDefault();if(game.phase==='casting')game.releaseCast();game.reeling=false;}
// Safari can treat two quick taps on a changing action button as a page zoom.
// The action is fully driven by pointerdown/pointerup, so suppress touch click synthesis on this button only.
$('action').addEventListener('touchend',e=>{if(e.cancelable)e.preventDefault();},{passive:false});
$('action').addEventListener('pointerdown',e=>{if(e.button!==0)return;$('action').setPointerCapture(e.pointerId);actionDown(e);});$('action').addEventListener('pointerup',actionUp);$('action').addEventListener('pointercancel',e=>{if(game.phase==='casting'){game.phase='ready';game.emit('cast-cancel');}game.reeling=false;});$('action').addEventListener('lostpointercapture',()=>{game.reeling=false;});
$('action').addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key)&&!e.repeat)actionDown(e);});$('action').addEventListener('keyup',e=>{if([' ','Enter'].includes(e.key))actionUp(e);});
$('lift').addEventListener('pointerdown',e=>{e.preventDefault();if(game.paused)return;$('lift').setPointerCapture(e.pointerId);game.lifting=true;});for(const type of ['pointerup','pointercancel','lostpointercapture'])$('lift').addEventListener(type,()=>game.lifting=false);
$('lift').addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();game.lifting=true;}});$('lift').addEventListener('keyup',()=>game.lifting=false);
function adjustDrag(value){if(game.paused||game.phase!=='fight')return;const percent=Math.max(8,Math.min(95,Math.round(value)));game.drag=percent/100;$('drag').value=String(percent);$('dragValue').textContent=`${percent} %`;$('dragDown').disabled=percent<=8;$('dragUp').disabled=percent>=95;}
$('drag').addEventListener('input',e=>adjustDrag(Number(e.target.value)));
$('dragDown').onclick=()=>adjustDrag(game.drag*100-5);$('dragUp').onclick=()=>adjustDrag(game.drag*100+5);$('earlyStrike').onclick=()=>{if(!game.paused)game.strike();};
$('takeUp').addEventListener('pointerdown',e=>{e.preventDefault();if(game.paused||game.phase!=='held')return;$('takeUp').setPointerCapture(e.pointerId);game.reeling=true;});for(const type of ['pointerup','pointercancel','lostpointercapture'])$('takeUp').addEventListener(type,()=>game.reeling=false);
$('takeUp').addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();if(!game.paused&&game.phase==='held')game.reeling=true;}});$('takeUp').addEventListener('keyup',()=>game.reeling=false);
for(const button of document.querySelectorAll('[data-distance]'))button.onclick=()=>game.setAim(Number(button.dataset.distance),Number(button.dataset.angle));
for(const [id,direction] of [['steerLeft',-1],['steerRight',1]]){const b=$(id),begin=e=>{e.preventDefault();if(!game.paused&&game.phase==='fight'){game.steer=direction;if(e.pointerId!==undefined)b.setPointerCapture(e.pointerId);}},end=()=>{if(game.steer===direction)game.steer=0;};b.addEventListener('pointerdown',begin);for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,end);b.addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key))begin(e);});b.addEventListener('keyup',end);}
$('net').onclick=()=>game.net();$('retrieve').onclick=()=>game.retrieve();
function updateTrip(){const v=game.trip,date=v?`${Number(v.date.slice(8))}. ${Number(v.date.slice(5,7))}. ${v.date.slice(0,4)} · ${v.time}`:'Letní ráno';for(const id of ['setupTrip','welcomeTrip','journalTrip'])$(id).textContent=`Výprava: ${date} · změnit`;$('welcomeTitle').textContent=({vajgar:'Na Vajgaru.',jarosov:'U vody v Jarošově.',vlkov:'Na pískovně.'})[game.venueId]||getVenue(game.venueId).intro;}
const tripPlanner=new TripPlanner({game,onApply:()=>{saveSetup();updateTrip();if(preparation.opened)preparation.render();renderedPhase='';toast('Datum a čas výpravy nastaveny. Aktivita ryb a světlo se změnily.');},onToggle:()=>setPause()});
for(const id of ['setupTrip','welcomeTrip','journalTrip'])$(id).onclick=()=>{if(game.mission){toast('Datum a čas jsou součástí zadání úkolu.');return;}tripPlanner.open();};
const preparation=new Preparation({game,onApply:(loadout,changes,options={})=>{
 if(!game.applyLoadouts(changes||[{index:game.activeIndex,loadout}],{addSecond:options.addSecond})){toast('Sestavu teď nelze použít. Nejprve dokonči lov.');return;}if(Number.isInteger(options.activeIndex))game.select(options.activeIndex);
 try{localStorage.setItem('reviry-loadout',JSON.stringify(game.loadout));saveSetup();}catch{toast('Sestava funguje, ale nepodařilo se ji uložit pro příště.');}
 started=true;setHidden('intro',true);preparation.close();renderedPhase='';setPause();
 toast(game.secondEnabled?'Sestavy obou prutů jsou připravené. Každý má vlastní montáž a nástrahu.':`Sestava připravena: ${METHODS[game.loadout.method].name}. Nástraha: ${BAITS[game.loadout.bait].name}.`);setTimeout(()=>$('lookHint').style.opacity=0,6000);
},onClose:()=>{preparation.close();setPause();}});
function openPreparation(){if(game.mission){toast('Úkol má předem danou montáž i nástrahu. Podrobnosti najdeš pod tlačítkem Úkol.');return;}if(['fight','casting','flying','landed'].includes(game.phase)){toast('Nejprve dokonči aktuální nához nebo zdolávání.');return;}preparation.open();setPause();}
$('start').onclick=openPreparation;$('tackle').onclick=openPreparation;
$('journalTackle').onclick=()=>{if(['fight','casting','flying','landed'].includes(game.phase)){toast('Nejprve dokonči aktuální lov.');return;}drawerOpen=false;setHidden('drawer',true);openPreparation();};
$('feed').onclick=()=>{if(game.paused)return;if(!game.feed())toast('Na tuto dávku už nemáš dost krmení.');};

$('menu').onclick=()=>{drawerOpen=true;renderJournal();setHidden('drawer',false);setPause();if(game.phase==='casting'){game.phase='ready';renderedPhase='';}};$('closeDrawer').onclick=()=>{drawerOpen=false;setHidden('drawer',true);setPause();};
$('release').onclick=()=>{setHidden('catchOverlay',true);game.phase='ready';game.result=null;renderedPhase='';setPause();updateMission();};
$('wideView').onclick=()=>{lake?.setWideView?.(!lake.wideView);$('wideView').textContent=lake.wideView?'Širší záběr: zap.':'Širší záběr: vyp.';$('wideView').setAttribute('aria-pressed',String(lake.wideView));toast('Změna šířky záběru se projeví při hraní na výšku.');};$('sound').onclick=toggleSound;$('quality').onclick=()=>{lake.setQuality(!lake.high);$('quality').textContent=lake.high?'HD':'ECO';toast(lake.high?'Vyšší kvalita grafiky':'Úspornější vykreslování');};
function fatal(error){console.error(error);setHidden('loading',true);setHidden('fatal',false);$('fatalMessage').textContent='Fotografický revír se nepodařilo načíst. Obnov stránku a zkontroluj připojení. Detail: '+String(error?.message||error).slice(0,180);}
window.addEventListener('pageshow',()=>{last=performance.now();setPause();});window.addEventListener('focus',()=>{last=performance.now();setPause();});
document.addEventListener('visibilitychange',()=>{if(game.phase==='casting'){game.phase='ready';renderedPhase='';}setPause();if(audio){if(document.hidden)audio.suspend();else if(soundOn)audio.resume();}});window.addEventListener('blur',()=>{game.reeling=false;game.lifting=false;game.steer=0;});
game.onEvent=(event,data)=>{
 renderedPhase='';const index=data.rodIndex??game.activeIndex,rod=game.rods[index],prefix=game.secondEnabled?`Prut ${index+1}: `:'';
 if(audio&&soundOn)audio.event(event,data,rod);
 if(['rod-selected','rod-added','rod-folded','aim'].includes(event)){renderedDock='';saveSetup();return;}
 if(event==='cast')lake?.setCastDirection(index);
 if(event==='splash')lake?.splash(index);
 if(event==='feed'){lake?.scatterFeed(index,data.target);toast(`${prefix}Zakrmil jsi ${rod.loadout.feedPortion} g. Zbývá ${rod.feedStocks[rod.loadout.feed]} g.`);}
 if(event==='bite'&&guideOn){if(index!==game.activeIndex)toast(prefix+(rod.loadout.method==='float'?'Splávek! Zasekni.':rod.loadout.method==='feeder'?'Špička se ohýbá! Vezmi prut a zasekni.':'Čihátko! Vezmi prut a zasekni.'));navigator.vibrate?.([60,80,60]);}
 if(event==='hooked'&&guideOn){toast(prefix+(data.strike?.quality<.8?'Slabší zásek. Udržuj napnutý vlasec.':'Čistý zásek. Drž NAVÍJET a hlídej napětí.'));navigator.vibrate?.(80);}
 if(event==='escaped')toast(prefix+data.reason);
 if(event==='landed'){$('catchVenueTitle').textContent='ÚLOVEK · '+getVenue(data.venueId).short;showCatchPhoto(data,$('fishIllustration'),$('fishPhotoCredit'));$('catchSetup').textContent=getVenue(data.venueId).name+' · '+setupSummary(data.loadout)+(data.trip?' · Výprava '+data.trip.date+' '+data.trip.time:'')+(data.strike?' · Zásek: '+(data.strike.quality>=.8?'čistý kontakt':'slabší kontakt'):'');$('fishName').textContent=data.name;$('fishWeight').textContent=data.weight.toLocaleString('cs-CZ');$('fishLength').textContent=data.length;setHidden('catchOverlay',false);saveJournal();setPause();}
};
const missionGoal=d=>`${SPECIES_NAMES[d.speciesId]} · alespoň ${d.minLength} cm${d.minWeight?` a ${d.minWeight} kg`:''} · ${d.count} ks`;
const clockText=seconds=>{const n=Math.ceil(Math.max(0,seconds));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;};
function renderMissions(){
 const active=game.mission,blocked=!!active||game.enabledRods.some(r=>!['ready','escaped'].includes(r.phase));
 $('missionsHelp').textContent=active?`Probíhá: ${active.definition.name}. Otevřením této nabídky je čas pozastaven. Pro jinou výzvu nejprve ukonči stávající úkol.`:blocked?'Nejprve stáhni pruty a dokonči lov. Potom můžeš zahájit úkol.':'20 minut aktivního lovu. Do limitu musíš rybu podebrat. Menu, karta úlovku a opuštění aplikace čas pozastaví. Každý pokus začíná s novými zásobami; rozpracovaný pokus se po obnovení stránky neobnovuje.';
 setHidden('missionAbandon',!active);$('missionAbandon').disabled=missionLoading;
 $('missionCards').innerHTML=game.missions.map(d=>{const v=getVenue(d.venueId),record=missionRecords[d.id];return `<article class="venue-card ${record?.completed>0?'mission-card-completed':''}"><img src="${v.photo.src}" alt="${v.photo.note}"><div class="venue-card-body">${record?.completed>0?`<div class="mission-completed-badge" aria-label="Úkol splněn">✓ SPLNĚNO · ${record.completed}×</div>`:''}<span class="eyebrow">${v.short} · ${clockText(d.seconds)}</span><h3>${d.name}</h3><p><strong>${missionGoal(d)}</strong></p><p>${setupSummary(d.loadout)}</p><p>1 prut · ${d.grams} g krmení: ${FEEDS[d.loadout.feed].name}.<br>Dávka ze břehu ${d.loadout.feedPortion} g${['feeder'].includes(d.loadout.method)?' · každé naplnění krmítka 20 g ze stejných zásob':''}. Nástraha k opakovanému nastražení.</p><small>Pevná sestava · ${d.trip.date} · ${d.trip.time}${record?` · Splněno, nejlepší čas ${clockText(record.best)}`:''}</small><button class="action" data-mission="${d.id}" ${blocked||missionLoading?'disabled':''}>${record?.completed>0?'HRÁT ZNOVU':'SPUSTIT ÚKOL'}</button></div></article>`;}).join('');
}
function openMissions(){if(missionLoading)return;drawerOpen=false;setHidden('drawer',true);missionsOpen=true;renderMissions();setHidden('missionsOverlay',false);setPause();$('missionsClose').focus();}
function closeMissions(){if(missionLoading)return;missionsOpen=false;setHidden('missionsOverlay',true);setPause();}
async function beginMission(id){if(missionLoading)return;const d=game.missions.find(x=>x.id===id);if(!d||game.mission||game.enabledRods.some(r=>!['ready','escaped'].includes(r.phase)))return;
 missionLoading=true;setPause();renderMissions();try{await lake.setVenue?.(d.venueId);freeStarted=started;if(!game.startMission(id))throw Error('Nejprve dokonči volný lov.');missionRecorded=false;started=true;setHidden('intro',true);setHidden('missionResult',true);updateVenue();renderedPhase='';renderedDock='';missionLoading=false;closeMissions();toast('Úkol začal. Sestava je připravená, zásoby krmení jsou omezené.');}catch(error){missionLoading=false;renderMissions();setPause();toast('Úkol se nepodařilo spustit. '+error.message);}}
async function leaveMission(){if(missionLoading||!game.mission)return false;missionLoading=true;setPause();try{await lake.setVenue?.(game.freeSnapshot.setup.venueId);game.endMission();started=freeStarted;setHidden('intro',started);setHidden('catchOverlay',true);setHidden('missionResult',true);updateVenue();renderedPhase='';renderedDock='';missionLoading=false;closeMissions();updateMission();return true;}catch(error){missionLoading=false;setPause();toast('Návrat se nepodařil. '+error.message);return false;}}
function updateMission(){const run=game.mission;setHidden('missionHud',!run);if(!run)return;const d=run.definition;
 $('missionObjective').textContent=`${missionGoal(d)} · ${run.caught}/${d.count}`;$('missionTimer').textContent=clockText(run.remaining);$('missionSupply').textContent=`Krmení: ${game.feedStocks[d.loadout.feed]} g · ${FEEDS[d.loadout.feed].name}`;
 if(!run.finished)return;
 if(!missionRecorded){missionRecorded=true;if(run.status==='succeeded'){const prev=missionRecords[d.id];missionRecords[d.id]={best:Math.min(prev?.best??Infinity,run.elapsed),completed:(prev?.completed||0)+1};try{localStorage.setItem('reviry-mission-records',JSON.stringify(missionRecords));}catch{}}setPause();}
 if(game.phase==='landed')return;
 $('missionResult').classList.toggle('mission-success',run.status==='succeeded');$('missionResultTitle').textContent=run.status==='succeeded'?'✓ Úkol splněn!':'Čas vypršel.';$('missionResultText').textContent=`${d.name} · ${missionGoal(d)}. Splněno ${run.caught}/${d.count}, podebráno celkem ${run.attempts} ryb. Čas ${clockText(run.elapsed)}. ${run.status==='succeeded'?'Úlovek je zapsaný v deníku.':'Ryba musí být v podběráku ještě před koncem limitu.'}`;setHidden('missionResult',false);
}
$('welcomeMissions').onclick=openMissions;$('journalMissions').onclick=openMissions;$('missionManage').onclick=openMissions;$('missionsClose').onclick=closeMissions;
$('missionsOverlay').addEventListener('keydown',e=>{if(e.key==='Escape')closeMissions();});
$('missionCards').addEventListener('click',e=>{const b=e.target.closest('[data-mission]');if(b&&!b.disabled)beginMission(b.dataset.mission);});
$('missionAbandon').onclick=leaveMission;$('missionFree').onclick=leaveMission;
$('missionOther').onclick=async()=>{if(await leaveMission())openMissions();};
$('missionRetry').onclick=async()=>{const id=game.mission?.definition.id;if(id&&await leaveMission()){openMissions();await beginMission(id);}};
async function boot(){loadJournal();try{const session=JSON.parse(localStorage.getItem('reviry-session-setup')||'null');if(!game.restoreSetup(session)){const saved=JSON.parse(localStorage.getItem('reviry-loadout')||'null');if(saved&&validateLoadout(saved).length===0)game.setLoadout(saved);}}catch{}updateVenue();updateTrip();setPause();try{lake=await new LakeScene($('world'),game).init();lake.onAim=aim=>{if(game.setAim(aim.distance,aim.angle))toast(`Cíl pro prut ${game.activeIndex+1}: ${game.aimDistance.toFixed(1)} m.`);};lake.setSignalCanvas?.($('signalCanvas'));updateVenue();$('wideView').textContent=lake.wideView?'Širší záběr: zap.':'Širší záběr: vyp.';$('wideView').setAttribute('aria-pressed',String(lake.wideView));$('quality').textContent=lake.high?'HD':'ECO';$('geoCredit').textContent='Původ prostředí a zdroje osádky vybraného revíru jsou uvedeny níže. Fotografie je doplněna o pohyb vody a vybavení. Hlavní prut s navijákem, trojnožka a varianta v ruce jsou vytvořené pomocí AI. Splávek je upravená fotografie Geotek (CC BY-SA 3.0). Grafika je ilustrační a nemusí odpovídat vybranému modelu. Odložený prut s navijákem a trojnožkou tvoří společný syntetický fotorealistický podklad; popředí stanoviště je také vytvořené pomocí AI. Pohyblivá levá ruka, prázdný stojan, čihátko a trávy v popředí jsou také ilustrační AI podklady. Naviják, brzda a dopad do vody používají nahrávky. Okolní zvuky jsou zatím syntetické. Jde o fotografický pohled s omezeným posunem kamery. Hloubky a chování ryb jsou herní model.';setHidden('loading',true);if(lake.assetWarnings.length)toast('Část grafických podkladů se nenačetla. Zkus obnovit stránku.');requestAnimationFrame(frame);}catch(error){fatal(error);}}
function frame(now){const dt=Math.min(.25,Math.max(0,(now-last)/1000));last=now;try{game.advance(dt);updateUI();document.documentElement.style.setProperty('--station-note-top',`${$('rodDock').getBoundingClientRect().bottom+16}px`);const missionBanner=$('missionHud');const missionBottom=!missionBanner.classList.contains('hidden')?missionBanner.getBoundingClientRect().bottom+10:$('rodDock').getBoundingClientRect().bottom+16;document.documentElement.style.setProperty('--mission-fight-top',`${missionBottom}px`);document.documentElement.style.setProperty('--fishing-hud-height',`${window.innerHeight-$('fishingUI').getBoundingClientRect().top}px`);lake.setUiBounds?.({hudTop:$('fishingUI').getBoundingClientRect().top,headerBottom:Math.max(document.querySelector('header').getBoundingClientRect().bottom,$('rodDock').getBoundingClientRect().bottom)});if(!document.hidden)lake.render(dt,{paused:game.paused});if(audio&&soundOn)audio.update(game,dt,{clock:lake.clock,rods:lake.motionByRod});}catch(error){fatal(error);return;}requestAnimationFrame(frame);}
// Diagnostics expose observable state only; normal play never depends on this interface.
window.reviry={getState:()=>({venueId:game.venueId,activeRod:game.activeIndex+1,rodCount:game.enabledRods.length,rods:game.enabledRods.map(r=>({phase:r.phase,loadout:{...r.loadout},distance:r.distance})),aimDistance:game.aimDistance,aimAngle:game.aimAngle,fishBearing:game.fishBearing,steer:game.steer,fightAim:game.fightAim,netDeployed:game.netDeployed,netProgress:game.netProgress,phase:game.phase,loadout:{...game.loadout},trip:{...game.trip},feedBonus:game.feedBonus,feedStocks:{...game.feedStocks},distance:game.distance,stamina:game.stamina,tension:game.tension,mission:game.mission?{id:game.mission.definition.id,status:game.mission.status,remaining:game.mission.remaining,caught:game.mission.caught}:null,catches:game.journal.length,paused:game.paused,engine:lake?.metrics?.engine,assetWarnings:lake?.assetWarnings,drawImages:lake?.metrics?.drawImages}),version:'0.22.5'};
boot();
