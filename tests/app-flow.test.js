import {netGuidance} from '../src/fight-view.js';
import {LakeSound} from '../src/soundscape.js';
import {alarmStep} from '../src/encounter.js';
import {TripPlanner} from '../src/trip-planner.js';
import {VENUES,STOCK_SOURCES,SPECIES_NAMES,getVenue} from '../src/venues.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {FishingSession as Fishing} from '../src/session.js';
import {Preparation} from '../src/preparation.js';
import * as tackle from '../src/tackle.js';
import {biteMotion,signalCaption} from '../src/bite-motion.js';
import {showCatchPhoto,photoFor} from '../src/fish-photos.js';

// Real DOM handlers and game model; renderer is tested separately with native Canvas 2D.
test('app flow: prepare float tackle, cast, strike, land, show real photo, store journal and persist setup',async()=>{
 const dom=new JSDOM(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),{url:'https://example.test',pretendToBeVisual:true}),document=dom.window.document;
 dom.window.localStorage.setItem('reviry-guide','on');globalThis.document=document;let frame,now=performance.now();
 class LakeStub{constructor(){this.high=true;this.assetWarnings=[];this.geoAccurate=true;this.yaw=0;this.renderer={info:{render:{calls:0,triangles:0}}};}async init(){return this;}render(){}setCastDirection(){}splash(){}scatterFeed(){}}
 const code=fs.readFileSync(new URL('../src/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
 new Function('netGuidance','LakeSound','alarmStep','TripPlanner','VENUES','STOCK_SOURCES','SPECIES_NAMES','getVenue','biteMotion','signalCaption','Preparation','METHODS','BAITS','FEEDS','setupSummary','validateLoadout','showCatchPhoto','photoFor','Fishing','LakeScene','window','document','localStorage','navigator','requestAnimationFrame','setTimeout','clearTimeout',code)(netGuidance,LakeSound,alarmStep,TripPlanner,VENUES,STOCK_SOURCES,SPECIES_NAMES,getVenue,biteMotion,signalCaption,Preparation,tackle.METHODS,tackle.BAITS,tackle.FEEDS,tackle.setupSummary,tackle.validateLoadout,showCatchPhoto,photoFor,class extends Fishing{constructor(){super(()=>.1);}},LakeStub,dom.window,document,dom.window.localStorage,dom.window.navigator,callback=>{frame=callback;},()=>0,()=>{});
 await new Promise(setImmediate);
 const $=id=>document.getElementById(id),tick=()=>{now+=50;frame(now);},state=()=>dom.window.reviry.getState();
 assert.equal($('fatal').classList.contains('hidden'),true);assert.equal(state().paused,true);
 $('waters').click();assert.equal($('venuesOverlay').classList.contains('hidden'),false);document.querySelector('[data-venue="jarosov"]').click();tick();
 assert.equal(state().venueId,'jarosov');assert.equal($('venuePhotoNotice').classList.contains('hidden'),true);assert.match($('venueEvidence').textContent,/2022/);
 $('start').click();$('setupTrip').click();assert.equal($('tripOverlay').classList.contains('hidden'),false);$('tripTime').value='12:00';$('tripTime').dispatchEvent(new dom.window.Event('input'));$('tripApply').click();assert.equal(state().trip.time,'12:00');assert.equal(state().paused,true);assert.equal(JSON.parse(dom.window.localStorage.getItem('reviry-session-setup')).trip.time,'12:00');document.querySelector('[data-method="float"]').click();$('setupApply').click();tick();
 assert.equal(state().loadout.method,'float');assert.equal(state().paused,false);document.querySelector('[data-distance="17"]').click();tick();assert.match($('aimLabel').textContent,/17.0 m/);assert.match($('targetSummary').textContent,/17 m/);
 $('action').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:' ',bubbles:true}));for(let i=0;i<10;i++)tick();$('action').dispatchEvent(new dom.window.KeyboardEvent('keyup',{key:' ',bubbles:true}));
 for(let i=0;i<1000&&state().phase!=='bite';i++)tick();assert.equal(state().phase,'bite');assert.match($('action').textContent,/ZASEKNOUT/);assert.equal($('signalFocus').classList.contains('hidden'),false);assert.match($('signalTitle').textContent,/Splávek/);
 for(let i=0;i<50;i++)tick();
 $('action').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:' ',bubbles:true}));$('action').dispatchEvent(new dom.window.KeyboardEvent('keyup',{key:' ',bubbles:true}));assert.equal(state().phase,'fight');
 const initialDrag=Number($('drag').value);$('dragDown').click();assert.equal(Number($('drag').value),initialDrag-5);$('dragUp').click();assert.equal(Number($('drag').value),initialDrag);
 for(let i=0;i<25;i++)$('dragDown').click();assert.equal($('drag').value,'8');assert.equal($('dragDown').disabled,true);for(let i=0;i<25;i++)$('dragUp').click();assert.equal($('drag').value,'95');assert.equal($('dragUp').disabled,true);
 $('volume').value='35';$('volume').dispatchEvent(new dom.window.Event('input'));assert.equal(dom.window.localStorage.getItem('reviry-volume'),'0.35');assert.equal($('volumeValue').textContent,'35 %');
 for(let i=0;i<6000&&state().phase==='fight';i++){
  for(const id of ['steerLeft','steerRight'])$(id).dispatchEvent(new dom.window.KeyboardEvent('keyup',{key:' ',bubbles:true}));
  const correction=-state().fishBearing;if(Math.abs(correction)>.02)$(correction>0?'steerRight':'steerLeft').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:' ',bubbles:true}));
  $('drag').value=state().tension>.8?'20':'50';$('drag').dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  $('action').dispatchEvent(new dom.window.KeyboardEvent(state().tension<.78?'keydown':'keyup',{key:' ',bubbles:true}));tick();if(!$('net').disabled)$('net').click();
 }
 assert.equal(state().phase,'landed');assert.equal(state().catches,1);assert.equal(state().paused,true);assert.equal($('catchOverlay').classList.contains('hidden'),false);
 assert.match($('fishIllustration').getAttribute('src'),/assets\/fish\/.*\.webp$/);assert.match($('fishPhotoCredit').textContent,/Ilustrační fotografie druhu/);assert.match($('catchSetup').textContent,/Plavaná/);
 const journal=JSON.parse(dom.window.localStorage.getItem('reviry-vajgar-journal'));assert.equal(journal.length,1);assert.equal(journal[0].loadout.method,'float');assert.equal(journal[0].venueId,'jarosov');assert.equal(journal[0].trip.time,'12:00');assert.equal(JSON.parse(dom.window.localStorage.getItem('reviry-loadout')).method,'float');
 $('release').click();tick();assert.equal(state().phase,'ready');assert.equal(state().paused,false);
 // Default immersive controls can be toggled without replacing a cast.
 $('guideMode').click();assert.equal(document.body.classList.contains('immersive'),true);
 $('action').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:' ',bubbles:true}));$('action').dispatchEvent(new dom.window.KeyboardEvent('keyup',{key:' ',bubbles:true}));for(let i=0;i<30;i++)tick();
 assert.equal(state().phase,'waiting');assert.equal($('action').disabled,false);assert.notEqual(dom.window.getComputedStyle($('action')).display,'none');assert.equal($('action').textContent,'ZASEKNOUT');assert.equal($('status').textContent,'');assert.equal($('earlyStrike').classList.contains('hidden'),true);
 $('guideMode').click();assert.equal(state().phase,'waiting');assert.equal(dom.window.localStorage.getItem('reviry-guide'),'on');$('retrieve').click();tick();

 $('menu').click();assert.equal(state().paused,true);assert.ok($('catches').querySelector('img'));$('closeDrawer').click();assert.equal(state().paused,false);
 // A false strike is reachable through normal UI, without a hidden game mutation.
 $('action').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:' ',bubbles:true}));$('action').dispatchEvent(new dom.window.KeyboardEvent('keyup',{key:' ',bubbles:true}));for(let i=0;i<30;i++)tick();assert.equal(state().phase,'waiting');assert.equal($('earlyStrike').classList.contains('hidden'),false);$('earlyStrike').click();tick();assert.equal(state().phase,'escaped');assert.match($('hint').textContent,/prázdna/);assert.equal($('status').textContent,'Zásek do prázdna.');assert.match($('rodDock').textContent,/Naprázdno/);
 // Pick up a real dropback, hold the reeling control, then strike on the run.
 $('tackle').click();document.querySelector('[data-method="ledger"]').click();$('setupApply').click();tick();$('action').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:' ',bubbles:true}));$('action').dispatchEvent(new dom.window.KeyboardEvent('keyup',{key:' ',bubbles:true}));for(let i=0;i<1000&&state().phase!=='bite';i++)tick();assert.equal(state().phase,'bite');$('action').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:' ',bubbles:true}));$('action').dispatchEvent(new dom.window.KeyboardEvent('keyup',{key:' ',bubbles:true}));tick();assert.equal(state().phase,'held');assert.equal($('takeUp').classList.contains('hidden'),false);$('takeUp').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:' ',bubbles:true}));for(let i=0;i<20;i++)tick();$('takeUp').dispatchEvent(new dom.window.KeyboardEvent('keyup',{key:' ',bubbles:true}));for(let i=0;i<100&&$('status').textContent!=='Teď zasekni.';i++)tick();$('action').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:' ',bubbles:true}));$('action').dispatchEvent(new dom.window.KeyboardEvent('keyup',{key:' ',bubbles:true}));tick();assert.equal(state().phase,'fight');assert.equal($('fatal').classList.contains('hidden'),true);
});

test('two-rod UI keeps both live indicators and lets an inactive bite be picked up and landed',async()=>{
 const dom=new JSDOM(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),{url:'https://example.test',pretendToBeVisual:true}),document=dom.window.document;
 dom.window.localStorage.setItem('reviry-guide','on');globalThis.document=document;let frame,now=performance.now(),views=[];
 class LakeStub{constructor(){this.high=true;this.assetWarnings=[];this.yaw=0;}async init(){return this;}render(){}setCastDirection(){}splash(){}scatterFeed(){}setSignalViews(value){views=value;}}
 const code=fs.readFileSync(new URL('../src/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
 new Function('netGuidance','LakeSound','alarmStep','TripPlanner','VENUES','STOCK_SOURCES','SPECIES_NAMES','getVenue','biteMotion','signalCaption','Preparation','METHODS','BAITS','FEEDS','setupSummary','validateLoadout','showCatchPhoto','photoFor','Fishing','LakeScene','window','document','localStorage','navigator','requestAnimationFrame','setTimeout','clearTimeout',code)(netGuidance,LakeSound,alarmStep,TripPlanner,VENUES,STOCK_SOURCES,SPECIES_NAMES,getVenue,biteMotion,signalCaption,Preparation,tackle.METHODS,tackle.BAITS,tackle.FEEDS,tackle.setupSummary,tackle.validateLoadout,showCatchPhoto,photoFor,class extends Fishing{constructor(){super(()=>.1);}},LakeStub,dom.window,document,dom.window.localStorage,dom.window.navigator,callback=>{frame=callback;},()=>0,()=>{});
 await new Promise(setImmediate);
 const $=id=>document.getElementById(id),state=()=>dom.window.reviry.getState(),tick=()=>{now+=50;frame(now);},press=(id,type)=>$(id).dispatchEvent(new dom.window.KeyboardEvent(type,{key:' ',bubbles:true})),action=()=>{press('action','keydown');press('action','keyup');},cast=()=>{action();for(let i=0;i<25;i++)tick();};
 $('start').click();$('setupApply').click();tick();cast();$('tackle').click();$('setupAddSecond').click();assert.equal(state().rodCount,1,'adding in preparation is staged until apply');
 assert.equal($('setupRodPicker').classList.contains('hidden'),false);assert.match($('setupApply').textContent,/OBOU PRUTŮ/);
 document.querySelector('[data-setup-rod="0"]').click();assert.match($('setupSummary').textContent,/Kukuřice/);
 document.querySelector('[data-setup-rod="1"]').click();document.querySelector('[data-tab="bait"]').click();document.querySelector('[data-bait="boilie"]').click();
 document.querySelector('[data-setup-rod="0"]').click();assert.match($('setupSummary').textContent,/Kukuřice/);
 document.querySelector('[data-setup-rod="1"]').click();assert.match($('setupSummary').textContent,/Boilies/);$('setupApply').click();tick();
 assert.equal(state().rods[0].loadout.bait,'corn');assert.equal(state().rods[0].loadout.rig,'running');assert.equal(state().rods[0].phase,'waiting');
 assert.equal(state().rods[1].loadout.bait,'boilie');assert.equal(state().rods[1].loadout.rig,'hair');cast();
 assert.deepEqual(state().rods.map(r=>r.phase),['waiting','waiting']);assert.equal(views.length,2);assert.deepEqual(views.map(v=>v.index),[0,1]);
 assert.equal($('rodSignals').classList.contains('hidden'),false);assert.equal($('rodSignals').querySelectorAll('canvas').length,2);assert.equal($('signalFocus').classList.contains('hidden'),true);
 for(let i=0;i<1000&&state().rods[0].phase!=='bite';i++)tick();
 assert.equal(state().activeRod,2);const first=document.querySelector('[data-signal-rod="0"]');assert.match(first.getAttribute('aria-label'),/Vzít prut 1/);assert.equal(first.disabled,false);first.click();tick();
 assert.equal(state().activeRod,1);assert.equal(state().phase,'held');assert.match($('action').textContent,/ZASEKNOUT/);assert.equal(document.querySelector('[data-signal-rod="1"]').disabled,true);
 if(!$('takeUp').classList.contains('hidden')){press('takeUp','keydown');for(let i=0;i<20;i++)tick();press('takeUp','keyup');}
 for(let i=0;i<100&&$('status').textContent!=='Teď zasekni.';i++)tick();action();tick();assert.equal(state().phase,'fight');
 const initialDrag=Number($('drag').value);$('dragDown').click();assert.equal(Number($('drag').value),initialDrag-5);$('dragUp').click();assert.equal(Number($('drag').value),initialDrag);
 for(let i=0;i<25;i++)$('dragDown').click();assert.equal($('drag').value,'8');assert.equal($('dragDown').disabled,true);for(let i=0;i<25;i++)$('dragUp').click();assert.equal($('drag').value,'95');assert.equal($('dragUp').disabled,true);
 $('volume').value='35';$('volume').dispatchEvent(new dom.window.Event('input'));assert.equal(dom.window.localStorage.getItem('reviry-volume'),'0.35');assert.equal($('volumeValue').textContent,'35 %');
 for(let i=0;i<6000&&state().phase==='fight';i++){
  for(const id of ['steerLeft','steerRight'])$(id).dispatchEvent(new dom.window.KeyboardEvent('keyup',{key:' ',bubbles:true}));
  const correction=-state().fishBearing;if(Math.abs(correction)>.02)$(correction>0?'steerRight':'steerLeft').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:' ',bubbles:true}));
  $('drag').value=state().tension>.8?'20':'50';$('drag').dispatchEvent(new dom.window.Event('input',{bubbles:true}));press('action',state().tension<.78?'keydown':'keyup');tick();if(!$('net').disabled)$('net').click();
 }
 assert.equal(state().phase,'landed');assert.equal(state().catches,1);$('release').click();tick();
 document.querySelector('[data-signal-rod="1"]').click();tick();assert.equal(state().activeRod,2);assert.equal($('fatal').classList.contains('hidden'),true);assert.equal(views.length,2);
});

test('scenario UI launches fixed gear, pauses timer, records success, retries and restores free fishing',async()=>{
 const dom=new JSDOM(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),{url:'https://example.test',pretendToBeVisual:true}),document=dom.window.document;
 globalThis.document=document;let frame,now=performance.now(),model;
 class LakeStub{constructor(){this.high=true;this.assetWarnings=[];}async init(){return this;}async setVenue(id){this.venueId=id;this.photo=VENUES[id].photo;}render(){}setCastDirection(){}splash(){}scatterFeed(){}}
 const code=fs.readFileSync(new URL('../src/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
 new Function('netGuidance','LakeSound','alarmStep','TripPlanner','VENUES','STOCK_SOURCES','SPECIES_NAMES','getVenue','biteMotion','signalCaption','Preparation','METHODS','BAITS','FEEDS','setupSummary','validateLoadout','showCatchPhoto','photoFor','Fishing','LakeScene','window','document','localStorage','navigator','requestAnimationFrame','setTimeout','clearTimeout',code)(netGuidance,LakeSound,alarmStep,TripPlanner,VENUES,STOCK_SOURCES,SPECIES_NAMES,getVenue,biteMotion,signalCaption,Preparation,tackle.METHODS,tackle.BAITS,tackle.FEEDS,tackle.setupSummary,tackle.validateLoadout,showCatchPhoto,photoFor,class extends Fishing{constructor(){super(()=>.1);model=this;}},LakeStub,dom.window,document,dom.window.localStorage,dom.window.navigator,callback=>{frame=callback;},()=>0,()=>{});
 await new Promise(setImmediate);const $=id=>document.getElementById(id),tick=()=>{now+=50;frame(now);};
 $('welcomeMissions').click();assert.equal(document.querySelectorAll('[data-mission]').length,model.missions.length);document.querySelector('[data-mission="hejtman-corn"]').click();await new Promise(setImmediate);tick();
 assert.equal(model.venueId,'hejtman');assert.equal(model.mission.status,'running');assert.equal(model.paused,false);assert.equal($('tackle').disabled,true);assert.equal(model.feedStocks.grain,300);assert.equal($('missionHud').classList.contains('hidden'),false);
 const before=model.mission.elapsed;$('missionManage').click();for(let i=0;i<10;i++)tick();assert.equal(model.mission.elapsed,before);$('missionsClose').click();tick();assert.ok(model.mission.elapsed>before);
 $('waters').click();assert.equal($('venuesOverlay').classList.contains('hidden'),true);
 model.phase='fight';model.fish={id:'carp',name:'Kapr obecný',length:60,weight:3};model.active.land();tick();assert.equal(model.mission.status,'succeeded');assert.equal($('catchOverlay').classList.contains('hidden'),false);assert.equal($('missionResult').classList.contains('hidden'),true);
 $('release').click();tick();assert.equal($('missionResult').classList.contains('hidden'),false);assert.match($('missionResultTitle').textContent,/splněn/);assert.ok(JSON.parse(dom.window.localStorage.getItem('reviry-mission-records'))['hejtman-corn']);assert.equal(dom.window.localStorage.getItem('reviry-session-setup'),null);
 $('missionRetry').click();await new Promise(setImmediate);tick();assert.equal(model.mission.status,'running');assert.equal(model.feedStocks.grain,300);assert.ok(model.mission.elapsed<1);
 $('missionManage').click();$('missionAbandon').click();await new Promise(setImmediate);tick();assert.equal(model.mission,null);assert.equal(model.venueId,'vajgar');assert.equal($('intro').classList.contains('hidden'),false);assert.equal($('fatal').classList.contains('hidden'),true);
});
