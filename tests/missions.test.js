import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MISSIONS} from '../src/missions.js';
import {MissionRun} from '../src/missions.js';
import {FishingSession} from '../src/session.js';
import {validateLoadout} from '../src/tackle.js';
import {VENUES} from '../src/venues.js';
import {loadImage} from '@napi-rs/canvas';
const fish=(d,extra={})=>({id:1,speciesId:d.speciesId,venueId:d.venueId,length:d.minLength,weight:4,...extra});
test('all scenarios use compatible equipment, documented species and finite stock',()=>{
 for(const d of MISSIONS){assert.deepEqual(validateLoadout(d.loadout),[]);assert.ok(VENUES[d.venueId].playable.includes(d.speciesId));assert.equal(d.seconds,1200);assert.ok(d.grams>=d.loadout.feedPortion);}
});
test('objectives require the right venue, species and size; duplicate catches cannot count twice',()=>{
 const d={...MISSIONS[0],count:2},r=new MissionRun(d);
 assert.equal(r.record(fish(d,{venueId:'vajgar'})),false);
 assert.equal(r.record(fish(d,{id:2,speciesId:'tench'})),false);
 assert.equal(r.record(fish(d,{id:3,length:d.minLength-1})),false);
 assert.equal(r.record(fish(d,{id:4})),true);assert.equal(r.record(fish(d,{id:4})),false);assert.equal(r.status,'running');
 r.record(fish(d,{id:5}));assert.equal(r.status,'succeeded');r.advance(2000);assert.equal(r.elapsed,0);
 const weighted=new MissionRun({...d,count:1,minWeight:5});assert.equal(weighted.record(fish(d)),false);
});
test('deadline excludes a late landed fish, including a fish still being fought',()=>{
 const r=new MissionRun(MISSIONS[0]);r.advance(1200);assert.equal(r.status,'failed');assert.equal(r.record(fish(MISSIONS[0])),false);
 const s=new FishingSession();s.startMission(MISSIONS[0].id);s.mission.elapsed=1199.98;s.phase='fight';s.tick(.05);assert.equal(s.mission.status,'failed');assert.equal(s.phase,'fight');
});
test('session clock counts once, pauses in menus, locks equipment and restores free fishing inventory',()=>{
 const s=new FishingSession();s.enableSecond();s.setVenue('vlkov');s.feedStocks.grain=655;const setup=s.exportSetup();
 assert.ok(s.startMission(MISSIONS[0].id));assert.equal(s.enabledRods.length,1);assert.equal(s.feedStocks.grain,300);assert.equal(s.feedStocks.groundbait,0);
 assert.equal(s.setVenue('vajgar'),false);assert.equal(s.setTrip({date:'2026-01-01',time:'12:00'}),false);assert.equal(s.enableSecond(),false);assert.equal(s.setLoadout(setup.loadouts[0]),false);assert.equal(s.applyLoadouts([]),false);
 s.advance(.2);assert.ok(Math.abs(s.mission.elapsed-.2)<1e-9);s.paused=true;s.advance(.25);assert.ok(Math.abs(s.mission.elapsed-.2)<1e-9);s.paused=false;
 s.phase='waiting';assert.ok(s.feed());assert.ok(s.feed());assert.equal(s.feed(),false);assert.equal(s.feedStocks.grain,0);
 assert.ok(s.endMission());assert.deepEqual(s.exportSetup(),setup);assert.equal(s.feedStocks.grain,655);assert.equal(s.mission,null);
});
test('landed catches resolve objectives, are labelled in journal and retain the normal catch event',()=>{
 const s=new FishingSession();s.startMission(MISSIONS[0].id);let emitted=false;s.onEvent=event=>{if(event==='landed')emitted=true;};
 s.phase='fight';s.fish={id:'carp',name:'Kapr obecný',length:55,weight:3};s.active.land();
 assert.equal(s.mission.status,'succeeded');assert.equal(s.journal[0].missionId,MISSIONS[0].id);assert.equal(emitted,true);
});
test('new venues have local decodable photographs and operator-specific evidence',async()=>{
 for(const id of ['hejtman','stankov']){const v=VENUES[id],image=await loadImage(v.photo.src);assert.ok(image.width>=1000);assert.ok(v.sources.includes(id));assert.equal(v.photo.verified,true);}
});
