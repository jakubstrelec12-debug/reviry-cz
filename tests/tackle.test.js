import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Fishing} from '../src/fishing.js';
import {METHODS,RIGS,DEFAULT_LOADOUT,methodPreset,validateLoadout,speciesWeights,feedInfluence,biteDelay} from '../src/tackle.js';
import {FISH_PHOTOS,photoFor} from '../src/fish-photos.js';
import fs from 'node:fs';
function step(g,seconds){for(let i=0;i<seconds*20;i++)g.tick(.05);}
function bite(method='ledger',loadout={}){const g=new Fishing(()=>.1);assert.ok(g.setLoadout({...methodPreset(method),...loadout}));g.startCast();step(g,.6);g.releaseCast();for(let i=0;i<1500&&g.phase!=='bite';i++)g.tick(.05);assert.equal(g.phase,'bite');return g;}

test('all technique presets and every offered rig have a playable compatible bait',()=>{
 assert.deepEqual(validateLoadout(DEFAULT_LOADOUT),[]);
 for(const method of Object.keys(METHODS)){
  const v=methodPreset(method);assert.deepEqual(validateLoadout(v),[]);
  for(const rig of METHODS[method].rigs)for(const bait of RIGS[rig].baits){const variant={...v,rig,bait,leader:rig==='method'?20:v.leader};assert.deepEqual(validateLoadout(variant),[]);}
 }
});
test('invalid saved values, incompatible rigs and terminal presentations are rejected',()=>{
 for(const v of [null,{}, {...DEFAULT_LOADOUT,method:'fly'}, {...DEFAULT_LOADOUT,rig:'fixed'},{...DEFAULT_LOADOUT,line:NaN},{...DEFAULT_LOADOUT,bait:'boilie'}, {...methodPreset('feeder'),rig:'method',leader:60}, {...DEFAULT_LOADOUT,rig:'hair',bait:'boilie',hook:14}])assert.ok(validateLoadout(v).length);
});
test('float has a direct strike and each technique completes the full catch cycle',()=>{
 for(const method of Object.keys(METHODS)){
  const g=bite(method);if(method!=='float'){assert.equal(g.strike(),false);assert.equal(g.grab(),true);}assert.equal(g.strike(),true);
  for(let i=0;i<6000&&g.phase==='fight';i++){g.drag=g.tension>.8?.2:.5;g.reeling=g.tension<.78;g.tick(.05);if(g.distance<=4&&g.stamina<=.22)g.net();}
  assert.equal(g.phase,'landed',method);assert.equal(g.result.loadout.method,method);assert.ok(photoFor(g.result));
 }
});
test('active fish cannot be replaced by changing the setup; catch stores a snapshot',()=>{
 const g=bite();g.grab();g.strike();assert.equal(g.setLoadout(methodPreset('float')),false);g.distance=3;g.stamina=.1;g.net();const old=g.result.loadout.bait;g.loadout.bait='worm';assert.equal(g.result.loadout.bait,old);
});
test('the selected bait changes species selection rather than merely a label',()=>{
 const corn=speciesWeights(DEFAULT_LOADOUT),worm=speciesWeights({...DEFAULT_LOADOUT,bait:'worm'}),boilie=speciesWeights({...DEFAULT_LOADOUT,rig:'hair',bait:'boilie'});
 assert.ok(worm[1]/worm[0]>corn[1]/corn[0]);assert.ok(boilie[0]/boilie[2]>corn[0]/corn[2]);
});
test('feed consumes inventory, strengthens the actual spot and decays by time, distance and direction',()=>{
 const g=new Fishing(()=>.5);g.setLoadout({...DEFAULT_LOADOUT,feed:'grain'});assert.equal(g.feed(),false);g.startCast();g.releaseCast();step(g,2);const wait=g.biteIn;
 assert.ok(g.feed());assert.equal(g.feedStocks.grain,850);assert.ok(g.feedBonus>0);assert.ok(g.biteIn<wait);const spot=g.feedSpot,here=g.feedBonus;
 assert.ok(feedInfluence(g.loadout,spot,g.time,g.distance+20,0)<here*.01);
 assert.ok(feedInfluence(g.loadout,spot,g.time,g.distance,1)<here*.01);
 assert.equal(feedInfluence(g.loadout,spot,g.time+241,g.distance,0),0);
 g.feedStocks.grain=0;assert.equal(g.feed(),false);assert.equal(g.feedStocks.grain,0);
});
test('feeder deposits 20 g at splash and never creates negative inventory',()=>{
 const g=new Fishing(()=>.1);g.setLoadout(methodPreset('feeder'));g.startCast();g.releaseCast();step(g,2);assert.equal(g.feedStocks.groundbait,980);assert.equal(g.feedSpot.grams,20);
 g.retrieve();g.feedStocks.groundbait=10;g.startCast();g.releaseCast();step(g,2);assert.equal(g.feedStocks.groundbait,10);
});
test('line diameter affects fight tension and depth affects float bite delay',()=>{
 const thin=bite('ledger',{line:.16}),thick=bite('ledger',{line:.35});for(const g of [thin,thick]){g.grab();g.strike();g.reeling=true;step(g,1);}assert.ok(thin.tension>thick.tension);
 const v=methodPreset('float');assert.ok(biteDelay({...v,depth:.5},.5)>biteDelay({...v,depth:2},.5));
});
test('pause freezes feed ageing along with fishing timers',()=>{const g=new Fishing();g.setLoadout({...DEFAULT_LOADOUT,feed:'grain'});g.phase='waiting';g.distance=25;g.feed();g.paused=true;const snapshot=JSON.stringify(g);step(g,300);assert.equal(JSON.stringify(g),snapshot);});
test('all photo records use local decodable WebP files with species-specific attribution',()=>{
 for(const photo of Object.values(FISH_PHOTOS)){const b=fs.readFileSync(new URL('../'+photo.src,import.meta.url));assert.equal(b.toString('ascii',8,12),'WEBP');assert.ok(b.length>10000);assert.ok(photo.author&&photo.source.startsWith('https://commons.wikimedia.org/')&&photo.license);}
 assert.equal(photoFor({name:'Kapr obecný'}),FISH_PHOTOS.carp);
 assert.equal(photoFor({name:'Neznámá ryba'}),undefined);
});
