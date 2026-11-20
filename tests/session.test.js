import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FishingSession} from '../src/session.js';
import {DEFAULT_LOADOUT,methodPreset} from '../src/tackle.js';
function step(s,seconds){for(let i=0;i<seconds*20;i++)s.advance(.05);}
function cast(s){assert.ok(s.startCast());assert.ok(s.releaseCast());step(s,1.2);}

test('two independent rods keep their casts and bait while player switches',()=>{
 const s=new FishingSession(()=>.1),events=[];s.onEvent=(event,data)=>events.push([event,data.rodIndex]);
 s.setLoadout({...DEFAULT_LOADOUT,rig:'spring',feed:'groundbait'});cast(s);assert.equal(s.rods[0].phase,'waiting');assert.ok(s.enableSecond());
 s.setLoadout({...methodPreset('feeder'),bait:'worm'});cast(s);assert.equal(s.rods[0].phase,'waiting');assert.equal(s.rods[1].phase,'waiting');assert.equal(s.rods[0].loadout.bait,'corn');assert.equal(s.rods[1].loadout.bait,'worm');
 assert.equal(s.feedStocks.groundbait,960);assert.equal(s.rods[0].feedStocks,s.rods[1].feedStocks);
 s.select(0);for(let i=0;i<2000&&!s.rods.every(r=>r.phase==='bite');i++)step(s,.05);assert.equal(s.rods[0].phase,'bite');assert.equal(s.rods[1].phase,'bite');assert.ok(events.some(([e,i])=>e==='bite'&&i===1));
 s.grab();s.reeling=true;while(s.slackToTake>.02)s.advance(.05);s.reeling=false;while(s.biteElapsed<s.biteWindow.openAt+.5)step(s,.05);assert.ok(s.strike());assert.equal(s.select(1),false);assert.equal(s.foldSecond(),false);
 s.paused=true;const clocks=s.rods.map(r=>r.time);step(s,100);assert.deepEqual(s.rods.map(r=>r.time),clocks);
});
test('float cannot add a second rod, nor replace a rod in a two-rod session',()=>{
 const s=new FishingSession();s.setLoadout(methodPreset('float'));assert.equal(s.enableSecond(),false);s.setLoadout(DEFAULT_LOADOUT);assert.ok(s.enableSecond());assert.equal(s.setLoadout(methodPreset('float')),false);assert.ok(s.foldSecond());assert.ok(s.setLoadout(methodPreset('float')));
});
test('shared journal retains catches from either rod and active setup restores safely',()=>{
 const s=new FishingSession(()=>.1);s.enableSecond();s.setLoadout(methodPreset('feeder'));
 for(const i of [1,0]){s.select(i);const r=s.active;r.phase='fight';r.fish={id:'carp',name:'Kapr obecný',weight:3,length:50};r.distance=3;r.stamina=.1;r.land();assert.equal(s.journal[0].rodNumber,i+1);r.phase='ready';}
 assert.equal(s.journal.length,2);assert.equal(s.rods[0].journal,s.rods[1].journal);
 const saved=s.exportSetup(),restored=new FishingSession();assert.ok(restored.restoreSetup(saved));assert.equal(restored.enabledRods.length,2);assert.equal(restored.rods[1].loadout.method,'feeder');assert.equal(restored.rods[0].phase,'ready');
 assert.equal(restored.restoreSetup({loadouts:[DEFAULT_LOADOUT,methodPreset('float')]}),false);
});

test('editing two loadouts is validated before changing either rod and leaves unchanged casts alone',()=>{
 const s=new FishingSession(()=>.1);cast(s);s.enableSecond();
 const before=s.rods.map(r=>({...r.loadout}));
 assert.equal(s.applyLoadouts([{index:0,loadout:{...DEFAULT_LOADOUT,rig:'spring',feed:'groundbait'}},{index:1,loadout:{...DEFAULT_LOADOUT,bait:'invalid'}}]),false);
 assert.deepEqual(s.rods.map(r=>r.loadout),before);assert.equal(s.rods[0].phase,'waiting');
 assert.ok(s.applyLoadouts([{index:1,loadout:{...DEFAULT_LOADOUT,rig:'spring',feed:'groundbait'}}]));
 assert.equal(s.rods[0].phase,'waiting');assert.equal(s.rods[0].loadout.rig,'running');assert.equal(s.rods[1].loadout.rig,'spring');
 assert.equal(s.applyLoadouts([{index:0,loadout:methodPreset('float')}]),false);
});
