import {test} from 'node:test';import assert from 'node:assert/strict';
import {Fishing} from '../src/fishing.js';import {FishingSession} from '../src/session.js';import {DEFAULT_LOADOUT} from '../src/tackle.js';
import {WATER_SPOTS,spotWeights,aimPower,castLanding} from '../src/watercraft.js';import {aimAtPoint,waterPoint} from '../src/photo-scene.js';import {biteMotion} from '../src/bite-motion.js';import {makeBiteProfile} from '../src/bite-profile.js';import {strikeWindow} from '../src/strike-timing.js';
const step=(g,s)=>{for(let i=0;i<s*20;i++)g.tick(.05);};
test('aim is per rod; power controls range, hard casts scatter more, inverse projection keeps the selected water point',()=>{
 const session=new FishingSession(()=>.5);session.enableSecond();session.rods[0].setAim(20,-.25);session.rods[1].setAim(45,.3);assert.equal(session.rods[0].aimDistance,20);assert.equal(session.rods[1].aimDistance,45);
 const p=waterPoint(390,700,250,31,.25,520),aim=aimAtPoint(390,700,250,520,p.x,p.y);assert.ok(Math.abs(aim.distance-31)<1e-8);assert.ok(Math.abs(aim.angle-.25)<1e-8);assert.equal(aimAtPoint(390,700,250,520,20,200),null);
 const spread=power=>castLanding(DEFAULT_LOADOUT,power,0,0,()=>1).angle-castLanding(DEFAULT_LOADOUT,power,0,0,()=>0).angle;assert.ok(spread(1)>spread(.2)*3);
 const g=session.rods[0];g.startCast();g.castPower=aimPower(g.loadout,20);g.releaseCast();assert.equal(g.castReport.error,0);assert.equal(g.castAngle,-.25);
});
test('habitat changes species balance without creating fish excluded by bait or venue',()=>{
 const ids=['carp','tench','bream','roach'],base=[3,2,1,0];const near=spotWeights(ids,base,17,-.28),far=spotWeights(ids,base,47,.28);assert.ok(near[1]/near[0]>far[1]/far[0]);assert.equal(far[3],0);assert.equal(WATER_SPOTS.length,3);
});
test('feed stays in its water position, benefits either rod on the spot, and misses are weaker',()=>{
 const s=new FishingSession(()=>.5);s.enableSecond();for(const r of s.rods){r.loadout.feed='grain';r.phase='waiting';r.distance=31;r.castAngle=0;r.aimDistance=31;}
 assert.ok(s.rods[0].feed());s.rods[1].loadout.feed='none';assert.ok(s.rods[1].feedBonus>.5);s.rods[1].loadout.feed='grain';const matched=s.rods[1].feedBonus;s.rods[1].distance=47;assert.ok(s.rods[1].feedBonus<matched*.02);assert.equal(s.rods[0].feedSpots[0].distance,31);
 assert.ok(s.setAim(45,.28));s.rods[1].feed();assert.equal(s.rods[0].feedSpots.length,2);assert.equal(s.rods[0].feedStocks.grain,700);
 s.rods.forEach(r=>r.phase='ready');s.setVenue('vlkov');assert.equal(s.rods[0].feedSpots.length,0);
});
test('a paused take stops its visible travel and resumes, while lead with corn keeps its direct take',()=>{
 const g=new Fishing();g.loadout.rig='spring';g.fish={id:'carp'};g.phase='bite';g.biteStyle='pull';g.biteProfile=makeBiteProfile(g.loadout,()=>.9);g.biteWindow=strikeWindow(g.loadout,g.fish,g.biteProfile);g.biteProfile.pauseAt=g.biteWindow.openAt+.2;
 g.elapsed=g.biteProfile.pauseAt+.1;const a=biteMotion(g);g.elapsed+=.1;const b=biteMotion(g);assert.equal(a.stage,'pause');assert.equal(b.stage,'pause');assert.equal(a.ledgerLift,b.ledgerLift);g.elapsed+=g.biteProfile.pauseFor+.1;assert.equal(biteMotion(g).stage,'run');
 assert.equal(makeBiteProfile(DEFAULT_LOADOUT,()=>.9).pauseFor,0);
});
function atBank(random=()=>.9){const g=new Fishing(random);g.phase='fight';g.fish={id:'carp',name:'Kapr',power:.5,weight:2,length:40};g.distance=2.8;g.stamina=.1;g.tension=.4;g.drag=.45;g.slack=0;g.overload=0;g.run={mode:'rest',age:0,duration:10,power:0,direction:0};return g;}
test('net deployment is not a catch: steer to the basket and hold contact; pause freezes net progress',()=>{
 const g=atBank();g.fishBearing=.3;g.castAngle=.3;g.net();step(g,1);assert.equal(g.phase,'fight');assert.equal(g.netProgress,0);g.steer=-1;step(g,1.2);g.steer=0;g.fightAim=-.3;step(g,.5);g.paused=true;const snapshot=JSON.stringify(g);step(g,2);assert.equal(JSON.stringify(g),snapshot);g.paused=false;g.reeling=true;step(g,4);assert.equal(g.phase,'landed');assert.equal(g.journal.length,1);
});
test('a last bank surge can happen once, can force line out, and does not repeat forever',()=>{
 const g=atBank(()=>.1);g.distance=5.8;g.tick(.05);assert.equal(g.bankSurge,true);assert.equal(g.run.mode,'surge');const run=g.run;g.tick(.05);assert.equal(g.run,run);assert.ok(g.stamina>.1);
});

test('aims persist independently and old expeditions migrate within the actual rod range',()=>{
 const s=new FishingSession();s.enableSecond();s.rods[0].setAim(18,-.2);s.rods[1].setAim(46,.3);const saved=s.exportSetup(),other=new FishingSession();assert.ok(other.restoreSetup(saved));assert.deepEqual(other.exportSetup().aims,saved.aims);assert.equal(other.restoreSetup({...saved,aims:[{distance:NaN,angle:0}]}),false);
});

test('the catch records the fishing area before retrieval, not the bank where it was netted',()=>{const g=atBank();g.throwDistance=47;g.castAngle=.28;g.land();assert.equal(g.result.spotId,'edge');});
