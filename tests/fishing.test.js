import {test} from 'node:test';import assert from 'node:assert/strict';import {Fishing} from '../src/fishing.js';
function step(g,seconds){for(let i=0;i<seconds*20;i++)g.tick(.05);}
function hooked(random=()=>.1){const g=new Fishing(random);assert.equal(g.startCast(),true);step(g,.5);assert.equal(g.releaseCast(),true);step(g,2);assert.equal(g.phase,'waiting');for(let i=0;i<500&&g.phase==='waiting';i++)g.tick(.05);assert.equal(g.phase,'bite');assert.equal(g.grab(),true);g.reeling=true;step(g,g.slackToTake+.05);g.reeling=false;while(g.biteElapsed<g.biteWindow.openAt+.7)g.tick(.05);assert.equal(g.strike(),true);return g;}
test('full cast / bite / strike / fight / net / journal cycle',()=>{const g=hooked();g.reeling=true;g.drag=.48;step(g,80);assert.equal(g.phase,'fight');assert.ok(g.distance<=4);assert.ok(g.stamina<=.22);assert.equal(g.net(),true);assert.equal(g.phase,'landed');assert.equal(g.journal.length,1);assert.ok(g.result.weight>0);assert.equal(g.net(),false);assert.equal(g.journal.length,1);});
test('strong carp is landable with controlled brake, release on surge',()=>{let seq=[.9,.01,.99],i=0;const g=hooked(()=>seq[i++%seq.length]);for(let tick=0;tick<5000&&g.phase==='fight';tick++){g.drag=g.tension>.8?.25:.55;g.reeling=g.tension<.78;g.lifting=false;g.tick(.05);if(g.distance<=4&&g.stamina<=.22)g.net();}assert.equal(g.phase,'landed');});
test('missed bite and late strike both lose the fish',()=>{let g=new Fishing(()=>0);g.startCast();g.releaseCast();step(g,22);assert.equal(g.phase,'escaped');g=new Fishing(()=>0);g.startCast();g.releaseCast();step(g,9);g.grab();step(g,7);assert.equal(g.phase,'escaped');});
test('pause freezes every fishing timer',()=>{const g=hooked();g.paused=true;const before=JSON.stringify(g);step(g,100);assert.equal(JSON.stringify(g),before);});
test('cannot land fish at distance or without exhausting it',()=>{const g=hooked();assert.equal(g.net(),false);g.distance=3;assert.equal(g.net(),false);g.stamina=.1;assert.equal(g.net(),true);});
test('maximum brake and continuous lifting can break the line',()=>{let n=0;const seq=[.1,0,.99];const g=hooked(()=>seq[n++%seq.length]);g.drag=.95;g.reeling=true;g.lifting=true;step(g,100);assert.equal(g.phase,'escaped');assert.match(g.result.reason,/praskl/);});
test('arbitrary delta spikes do not skip an entire fight',()=>{const g=hooked();const before=g.stamina;g.tick(99999);assert.ok(g.stamina>before-.01);});
test('casting only available outside an active catch',()=>{const g=hooked();assert.equal(g.startCast(),false);assert.equal(g.grab(),false);assert.equal(g.strike(),false);});

test('lower frame rates advance real fishing time using bounded simulation substeps',()=>{
 const slow=new Fishing(()=>.1),fast=new Fishing(()=>.1);for(const g of [slow,fast]){g.startCast();g.releaseCast();}
 for(let i=0;i<20;i++)slow.advance(.2);for(let i=0;i<80;i++)fast.tick(.05);
 assert.ok(Math.abs(slow.time-fast.time)<1e-8);assert.equal(slow.phase,fast.phase);assert.ok(Math.abs(slow.elapsed-fast.elapsed)<1e-8);
 const before=slow.time;slow.advance(120);assert.ok(slow.time-before<=.250000001);slow.paused=true;const frozen=JSON.stringify(slow);slow.advance(.2);assert.equal(JSON.stringify(slow),frozen);
});
