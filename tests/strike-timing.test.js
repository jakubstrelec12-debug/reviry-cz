import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Fishing} from '../src/fishing.js';
import {methodPreset} from '../src/tackle.js';
import {strikeWindow} from '../src/strike-timing.js';
import {biteMotion} from '../src/bite-motion.js';
const step=(g,t)=>{for(let i=0;i<Math.ceil(t/.05);i++)g.tick(.05);};
function at(method='float',style='pull',age=0){const g=new Fishing(()=>.2);g.setLoadout(methodPreset(method));if(method==='ledger')g.loadout.bait='worm';g.fish={id:'carp',power:.8,weight:3,length:52};g.phase='bite';g.biteStyle=style;g.biteWindow=strikeWindow(g.loadout,g.fish);g.elapsed=age;g.biteElapsed=age;g.distance=24;return g;}
function hold(g){if(g.loadout.method!=='float'){assert.ok(g.grab());g.slackToTake=0;}}
test('strike before any bite is a visible empty strike, never a catch',()=>{for(const method of ['float','ledger','feeder']){const g=at(method);g.phase='waiting';g.fish=null;assert.equal(g.strike(),false);assert.equal(g.phase,'escaped');assert.equal(g.result.strike.outcome,'empty');assert.match(g.result.reason,/prázdna/);assert.equal(g.lastStrikeAt,g.time);assert.equal(g.journal.length,0);}});
test('early, clean and late strikes follow the same visible bite timeline for every technique',()=>{
 for(const method of ['float','ledger','feeder']){
  const early=at(method);early.elapsed=early.biteElapsed=early.biteWindow.openAt-.3;assert.equal(biteMotion(early).stage,'touch');hold(early);assert.equal(early.strike(),false);assert.equal(early.result.strike.outcome,'early');assert.ok(Math.abs(early.result.strike.offset-.3)<1e-8);assert.match(early.result.reason,/0,3 s brzy/);
  const clean=at(method);clean.elapsed=clean.biteElapsed=clean.biteWindow.openAt+.8;assert.equal(biteMotion(clean).stage,'run');hold(clean);assert.ok(clean.strike());assert.equal(clean.phase,'fight');assert.equal(clean.hookQuality,1);
  const late=at(method);late.elapsed=late.biteElapsed=late.biteWindow.closeAt+.3;assert.equal(biteMotion(late).stage,'fading');hold(late);assert.equal(late.strike(),false);assert.equal(late.result.strike.outcome,'late');assert.match(late.result.reason,/0,3 s pozdě/);
 }
});
test('picking up the rod preserves the bite deadline instead of granting more time',()=>{const g=at('ledger');g.elapsed=g.biteElapsed=g.biteWindow.closeAt-.05;assert.ok(g.grab());assert.equal(g.elapsed,0);step(g,.2);assert.equal(g.strike(),false);assert.equal(g.result.strike.outcome,'late');});
test('dropback needs actual reeling to restore contact before striking',()=>{
 const loose=at('feeder','dropback');loose.elapsed=loose.biteElapsed=loose.biteWindow.openAt+.8;loose.grab();assert.ok(loose.slackToTake>0);assert.equal(loose.strike(),false);assert.equal(loose.result.strike.outcome,'slack');
 const g=at('feeder','dropback');g.elapsed=g.biteElapsed=g.biteWindow.openAt+.8;g.grab();const slack=g.slackToTake;step(g,.2);assert.equal(g.slackToTake,slack);g.reeling=true;step(g,slack+.05);g.reeling=false;assert.ok(g.strike());assert.equal(g.phase,'fight');
});
test('pause freezes both the bite deadline and taking up slack; neglected bite expires',()=>{const g=at('ledger','dropback');g.grab();g.reeling=true;g.paused=true;const before=JSON.stringify(g);step(g,10);assert.equal(JSON.stringify(g),before);g.paused=false;g.reeling=false;step(g,g.biteWindow.leaveAt+.1);assert.equal(g.phase,'escaped');assert.equal(g.result.strike.outcome,'missed');});
test('marginal hooks have less security and the landed catch stores strike quality',()=>{const g=at();g.elapsed=g.biteElapsed=g.biteWindow.openAt+.04;assert.ok(g.strike());assert.ok(g.hookQuality<.5);g.distance=3;g.stamina=.1;assert.ok(g.net());g.land();assert.equal(g.journal[0].strike.quality,g.hookQuality);});
test('lift bites rise and tilt; pulling bites submerge; weak touches remain small',()=>{const pull=at(),lift=at('float','dropback');for(const g of [pull,lift])g.elapsed=3;assert.ok(biteMotion(pull).floatSink>.3);assert.ok(biteMotion(lift).floatSink<-.1);assert.ok(biteMotion(lift).floatTilt>.4);const touch=at('float','pull',.25);assert.ok(Math.abs(biteMotion(touch).floatSink)<.03);});

test('lead and corn has no preliminary nibble and permits an immediate clean strike at the real take',()=>{
 const g=new Fishing(()=>.9);g.startCast();g.releaseCast();step(g,1.2);assert.equal(g.phase,'waiting');assert.equal(g.nextProbeAt,Infinity);g.biteIn=30;
 for(let i=0;i<590;i++){g.tick(.05);assert.equal(g.probe,null);}while(g.phase==='waiting')g.tick(.05);
 assert.equal(g.phase,'bite');assert.equal(g.biteProfile.kind,'direct');assert.equal(g.biteWindow.openAt,0);const motion=biteMotion(g);assert.equal(motion.stage,'run');assert.ok(Math.abs(motion.ledgerLift)>3);for(const value of Object.values(motion))if(typeof value==='number')assert.ok(Number.isFinite(value));
 g.grab();assert.ok(g.strike());assert.equal(g.hookQuality,1);
});
test('corn on a hair with lead is direct too, while corn at a feeder can retain a cautious take',async()=>{
 const {makeBiteProfile,allowsProbes}=await import('../src/bite-profile.js');
 const lead={...methodPreset('ledger'),rig:'hair',bait:'corn'};assert.equal(allowsProbes(lead),false);assert.equal(strikeWindow(lead,{id:'tench'}).openAt,0);
 const feeder={...lead,rig:'springHair'};assert.equal(allowsProbes(feeder),true);const profiles=[.05,.45,.9].map(v=>makeBiteProfile(feeder,()=>v));assert.deepEqual(profiles.map(p=>p.kind),['direct','gradual','cautious']);
 const windows=profiles.map(p=>strikeWindow(feeder,{id:'carp'},p));assert.equal(windows[0].openAt,0);assert.ok(windows[1].openAt>0);assert.notEqual(windows[1].closeAt,windows[2].closeAt);
});

test('two rods retain their own bite profiles and the active session uses the same movement as its rod',async()=>{
 const {FishingSession}=await import('../src/session.js');const s=new FishingSession(()=>.9);s.enableSecond();s.rods[1].loadout.rig='spring';
 for(const g of s.rods){g.startCast();g.releaseCast();step(g,1.2);g.biteIn=0;g.tick(.05);}
 assert.equal(s.rods[0].biteProfile.kind,'direct');assert.equal(s.rods[1].biteProfile.kind,'cautious');s.activeIndex=0;assert.deepEqual(biteMotion(s),biteMotion(s.rods[0]));s.activeIndex=1;assert.deepEqual(biteMotion(s),biteMotion(s.rods[1]));
});
