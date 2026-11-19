import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Fishing} from '../src/fishing.js';
import {methodPreset} from '../src/tackle.js';
import {strikeWindow} from '../src/strike-timing.js';
import {biteMotion} from '../src/bite-motion.js';
const step=(g,t)=>{for(let i=0;i<Math.ceil(t/.05);i++)g.tick(.05);};
function at(method='float',style='pull',age=0){const g=new Fishing(()=>.2);g.setLoadout(methodPreset(method));g.fish={id:'carp',power:.8,weight:3,length:52};g.phase='bite';g.biteStyle=style;g.biteWindow=strikeWindow(g.loadout,g.fish);g.elapsed=age;g.biteElapsed=age;g.distance=24;return g;}
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
test('marginal hooks have less security and the landed catch stores strike quality',()=>{const g=at();g.elapsed=g.biteElapsed=g.biteWindow.openAt+.04;assert.ok(g.strike());assert.ok(g.hookQuality<.5);g.distance=3;g.stamina=.1;assert.ok(g.net());assert.equal(g.journal[0].strike.quality,g.hookQuality);});
test('lift bites rise and tilt; pulling bites submerge; weak touches remain small',()=>{const pull=at(),lift=at('float','dropback');for(const g of [pull,lift])g.elapsed=3;assert.ok(biteMotion(pull).floatSink>.3);assert.ok(biteMotion(lift).floatSink<-.1);assert.ok(biteMotion(lift).floatTilt>.4);const touch=at('float','pull',.25);assert.ok(Math.abs(biteMotion(touch).floatSink)<.03);});
