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
 globalThis.document=document;let frame,now=performance.now();
 class LakeStub{constructor(){this.high=true;this.assetWarnings=[];this.geoAccurate=true;this.yaw=0;this.renderer={info:{render:{calls:0,triangles:0}}};}async init(){return this;}render(){}setCastDirection(){}splash(){}scatterFeed(){}}
 const code=fs.readFileSync(new URL('../src/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
 new Function('biteMotion','signalCaption','Preparation','METHODS','BAITS','FEEDS','setupSummary','validateLoadout','showCatchPhoto','photoFor','Fishing','LakeScene','window','document','localStorage','navigator','requestAnimationFrame','setTimeout','clearTimeout',code)(biteMotion,signalCaption,Preparation,tackle.METHODS,tackle.BAITS,tackle.FEEDS,tackle.setupSummary,tackle.validateLoadout,showCatchPhoto,photoFor,class extends Fishing{constructor(){super(()=>.1);}},LakeStub,dom.window,document,dom.window.localStorage,dom.window.navigator,callback=>{frame=callback;},()=>0,()=>{});
 await new Promise(setImmediate);
 const $=id=>document.getElementById(id),tick=()=>{now+=50;frame(now);},state=()=>dom.window.reviry.getState();
 assert.equal($('fatal').classList.contains('hidden'),true);assert.equal(state().paused,true);
 $('start').click();document.querySelector('[data-method="float"]').click();$('setupApply').click();tick();
 assert.equal(state().loadout.method,'float');assert.equal(state().paused,false);
 $('action').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:' ',bubbles:true}));for(let i=0;i<10;i++)tick();$('action').dispatchEvent(new dom.window.KeyboardEvent('keyup',{key:' ',bubbles:true}));
 for(let i=0;i<1000&&state().phase!=='bite';i++)tick();assert.equal(state().phase,'bite');assert.match($('action').textContent,/ZASEKNOUT/);assert.equal($('signalFocus').classList.contains('hidden'),false);assert.match($('signalTitle').textContent,/Splávek/);
 for(let i=0;i<50;i++)tick();
 $('action').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:' ',bubbles:true}));$('action').dispatchEvent(new dom.window.KeyboardEvent('keyup',{key:' ',bubbles:true}));assert.equal(state().phase,'fight');
 for(let i=0;i<6000&&state().phase==='fight';i++){
  $('drag').value=state().tension>.8?'20':'50';$('drag').dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  $('action').dispatchEvent(new dom.window.KeyboardEvent(state().tension<.78?'keydown':'keyup',{key:' ',bubbles:true}));tick();if(!$('net').disabled)$('net').click();
 }
 assert.equal(state().phase,'landed');assert.equal(state().catches,1);assert.equal(state().paused,true);assert.equal($('catchOverlay').classList.contains('hidden'),false);
 assert.match($('fishIllustration').getAttribute('src'),/assets\/fish\/.*\.webp$/);assert.match($('fishPhotoCredit').textContent,/Ilustrační fotografie druhu/);assert.match($('catchSetup').textContent,/Plavaná/);
 const journal=JSON.parse(dom.window.localStorage.getItem('reviry-vajgar-journal'));assert.equal(journal.length,1);assert.equal(journal[0].loadout.method,'float');assert.equal(JSON.parse(dom.window.localStorage.getItem('reviry-loadout')).method,'float');
 $('release').click();tick();assert.equal(state().phase,'ready');assert.equal(state().paused,false);
 $('menu').click();assert.equal(state().paused,true);assert.ok($('catches').querySelector('img'));$('closeDrawer').click();assert.equal(state().paused,false);
 // A false strike is reachable through normal UI, without a hidden game mutation.
 $('action').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:' ',bubbles:true}));$('action').dispatchEvent(new dom.window.KeyboardEvent('keyup',{key:' ',bubbles:true}));for(let i=0;i<30;i++)tick();assert.equal(state().phase,'waiting');assert.equal($('earlyStrike').classList.contains('hidden'),false);$('earlyStrike').click();tick();assert.equal(state().phase,'escaped');assert.match($('hint').textContent,/prázdna/);
 // Pick up a real dropback, hold the reeling control, then strike on the run.
 $('tackle').click();document.querySelector('[data-method="ledger"]').click();$('setupApply').click();tick();$('action').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:' ',bubbles:true}));$('action').dispatchEvent(new dom.window.KeyboardEvent('keyup',{key:' ',bubbles:true}));for(let i=0;i<1000&&state().phase!=='bite';i++)tick();assert.equal(state().phase,'bite');$('action').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:' ',bubbles:true}));$('action').dispatchEvent(new dom.window.KeyboardEvent('keyup',{key:' ',bubbles:true}));tick();assert.equal(state().phase,'held');assert.equal($('takeUp').classList.contains('hidden'),false);$('takeUp').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:' ',bubbles:true}));for(let i=0;i<20;i++)tick();$('takeUp').dispatchEvent(new dom.window.KeyboardEvent('keyup',{key:' ',bubbles:true}));for(let i=0;i<100&&$('status').textContent!=='Teď zasekni.';i++)tick();$('action').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:' ',bubbles:true}));$('action').dispatchEvent(new dom.window.KeyboardEvent('keyup',{key:' ',bubbles:true}));tick();assert.equal(state().phase,'fight');assert.equal($('fatal').classList.contains('hidden'),true);
});
