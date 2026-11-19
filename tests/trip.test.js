import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {DEFAULT_TRIP,validTrip,tripConditions,speciesActivity} from '../src/trip.js';
import {FishingSession} from '../src/session.js';
import {Fishing} from '../src/fishing.js';
import {venueChances} from '../src/venues.js';
import {DEFAULT_LOADOUT,chooseBait} from '../src/tackle.js';
import {TripPlanner} from '../src/trip-planner.js';

test('trip dates reject malformed days and times and daylight follows season',()=>{
 for(const value of [{date:'2026-02-30',time:'07:00'},{date:'2026-01-01',time:'24:00'},{date:'2026-01-01',time:'7:00'},{date:'2200-01-01',time:'07:00'},null])assert.equal(validTrip(value),false);
 assert.ok(validTrip({date:'2024-02-29',time:'23:59'}));
 assert.ok(tripConditions({date:'2026-06-15',time:'06:00'}).light>tripConditions({date:'2026-12-15',time:'06:00'}).light);
 assert.equal(tripConditions({date:'2026-06-15',time:'23:00'}).label,'Noc');
 assert.equal(tripConditions({date:'2026-12-15',time:'12:00'}).season,'Zima');
});
test('trip changes actual bite delay and weighted species while respecting bait gates',()=>{
 const warm={...DEFAULT_TRIP},cold={date:'2026-01-15',time:'12:00'};
 const wait=trip=>{const g=new Fishing(()=>.3);g.trip=trip;g.startCast();g.releaseCast();for(let i=0;i<24;i++)g.tick(.05);assert.equal(g.phase,'waiting');return g.biteIn;};
 assert.ok(wait(cold)>wait(warm)*2);
 const a=venueChances(DEFAULT_LOADOUT,'jarosov',0,warm),b=venueChances(DEFAULT_LOADOUT,'jarosov',0,cold);assert.notDeepEqual(a,b);assert.ok(b[5]>a[5]);
 assert.ok(speciesActivity('tench',{date:'2026-06-15',time:'19:00'})>speciesActivity('tench',{date:'2026-06-15',time:'12:00'}));
 for(const trip of [warm,cold,{date:'2026-10-01',time:'23:00'}])assert.deepEqual(venueChances(chooseBait(DEFAULT_LOADOUT,'boilie20'),'jarosov',0,trip),[1,0,0,0,0,0]);
 const pick=trip=>{const g=new Fishing(()=>.9);g.venueId='jarosov';g.trip=trip;g.phase='waiting';g.biteIn=0;g.tick(.05);return g.fish.id;};assert.notEqual(pick(warm),pick(cold));
});
test('trip belongs to both rods, cannot change live casts, persists and snapshots catches',()=>{
 const s=new FishingSession();s.enableSecond();s.rods.forEach(r=>r.feedSpot={type:'grain'});const trip={date:'2026-09-12',time:'18:30'};assert.ok(s.setTrip(trip));trip.time='01:00';assert.ok(s.rods.every(r=>r.trip.time==='18:30'&&r.feedSpot===null));
 s.rods[0].phase='waiting';const saved=s.exportSetup();assert.equal(s.setTrip(DEFAULT_TRIP),false);assert.deepEqual(s.exportSetup(),saved);s.rods[0].phase='ready';
 const restored=new FishingSession();assert.ok(restored.restoreSetup(saved));assert.deepEqual(restored.rods.map(r=>r.trip),s.rods.map(r=>r.trip));assert.equal(restored.restoreSetup({...saved,trip:{date:'invalid',time:'01:00'}}),false);
 s.active.phase='fight';s.active.fish={id:'carp',name:'Kapr',weight:3,length:50};s.active.distance=3;s.active.stamina=.1;assert.ok(s.net());assert.equal(s.journal[0].trip.time,'18:30');s.active.trip.time='07:00';assert.equal(s.journal[0].trip.time,'18:30');
 const old={...saved};delete old.trip;assert.ok(restored.restoreSetup(old));assert.deepEqual(restored.trip,DEFAULT_TRIP);
});
test('trip planner previews drafts, cancels safely, validates and blocks changes during fishing',()=>{
 const dom=new JSDOM(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'));globalThis.document=dom.window.document;const $=id=>document.getElementById(id);const game=new FishingSession();let applied=0;const p=new TripPlanner({game,onApply:()=>applied++,onToggle:()=>{}});p.open();
 $('tripDate').value='2026-01-15';$('tripTime').value='23:00';$('tripTime').dispatchEvent(new dom.window.Event('input'));assert.match($('tripPreview').textContent,/noc/);$('tripClose').click();assert.deepEqual(game.trip,DEFAULT_TRIP);
 p.open();$('tripDate').value='';p.render();assert.equal($('tripApply').disabled,true);$('tripDate').value='2026-01-15';document.querySelector('[data-trip-time="23:00"]').click();$('tripApply').click();assert.equal(applied,1);assert.equal(game.trip.time,'23:00');assert.equal(game.trip.date,'2026-01-15');assert.equal(p.opened,false);
 game.phase='waiting';p.open();assert.equal($('tripApply').disabled,true);assert.match($('tripHelp').textContent,/stáhni oba pruty/);$('tripApply').click();assert.equal(applied,1);
});
