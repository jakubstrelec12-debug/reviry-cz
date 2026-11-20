import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Fishing} from '../src/fishing.js';
import {biteMotion} from '../src/bite-motion.js';
import {probeLift,alarmStep,nextRun,runForce} from '../src/encounter.js';
import {DEFAULT_LOADOUT,biteDelay} from '../src/tackle.js';
function step(g,t){for(let i=0;i<Math.ceil(t/.05);i++)g.tick(.05);}
function cast(){const g=new Fishing(()=>.1);g.loadout.rig='spring';g.startCast();g.releaseCast();step(g,1.2);return g;}
test('uncommitted nibble moves the actual indicator, settles and does not create a fish',()=>{
 const g=cast(),deadline=g.biteIn;for(let i=0;i<400&&!g.probe;i++)g.tick(.05);assert.ok(g.probe);step(g,.25);
 const before=JSON.stringify(g);assert.ok(Math.abs(probeLift(g))>1);assert.equal(biteMotion(g).stage,'touch');assert.equal(JSON.stringify(g),before);
 assert.equal(g.phase,'waiting');assert.equal(g.fish,null);step(g,2.5);assert.equal(g.probe,null);assert.equal(g.phase,'waiting');assert.equal(g.fish,null);assert.equal(g.biteIn,deadline);
});
test('taking a resting rod is possible but a strike at a nibble remains empty',()=>{
 const g=cast();assert.ok(g.grab());assert.equal(g.phase,'held');assert.equal(g.fish,null);step(g,12);assert.equal(g.phase,'held');assert.equal(g.strike(),false);assert.equal(g.result.strike.outcome,'empty');assert.equal(g.journal.length,0);
 const probe=cast();for(let i=0;i<400&&!probe.probe;i++)probe.tick(.05);step(probe,.25);assert.ok(probe.grab());assert.equal(probe.probe,null);assert.equal(probe.strike(),false);assert.equal(probe.result.strike.outcome,'empty');
});
test('electronic sound follows movement, remains silent at rest, and mechanical gear never beeps',()=>{
 const g=cast();g.loadout.indicator='electronic';let state,pulses=0;
 for(let i=0;i<60;i++){step(g,.05);const r=alarmStep(g,state,biteMotion(g).ledgerLift);state=r.state;pulses+=Number(r.pulse);}assert.equal(pulses,0);
 for(let i=0;i<150;i++){step(g,.05);const r=alarmStep(g,state,biteMotion(g).ledgerLift);state=r.state;pulses+=Number(r.pulse);}assert.ok(pulses>=1);
 g.loadout.indicator='bobbin';assert.equal(alarmStep(g,state,20).pulse,false);g.loadout.indicator='electronic';g.paused=true;assert.equal(alarmStep(g,state,20).pulse,false);
});
test('waiting has a broad distribution while feeds and activity can still affect it',()=>{
 assert.ok(biteDelay(DEFAULT_LOADOUT,.95)>biteDelay(DEFAULT_LOADOUT,.05)*4);assert.ok(biteDelay(DEFAULT_LOADOUT,.8,1)<biteDelay(DEFAULT_LOADOUT,.8,0));
});
test('fish alternate distinct random runs and rests, and pause freezes their trajectory',()=>{
 let i=0;const rng=()=>[.1,.6,.8,.9,.2,.3][i++%6];const a=nextRun(rng),b=nextRun(rng,a),c=nextRun(rng,b);assert.equal(a.mode,'surge');assert.equal(b.mode,'rest');assert.equal(c.mode,'surge');assert.notEqual(a.duration,b.duration);assert.equal(runForce(b),0);assert.equal(runForce({...a,age:0}),0);assert.ok(runForce({...a,age:a.duration*.5})>.5);
 const g=new Fishing(rng);g.phase='fight';g.fish={id:'carp',power:.85,weight:4};g.distance=25;g.overload=0;g.slack=0;g.hookQuality=1;g.drag=.4;g.reeling=true;
 const bearings=[];for(let t=0;t<200;t++){g.tick(.05);bearings.push(g.fishBearing);}assert.ok(Math.max(...bearings)-Math.min(...bearings)>.01);assert.equal(g.phase,'fight');
 g.paused=true;const frozen=JSON.stringify(g);step(g,10);assert.equal(JSON.stringify(g),frozen);
});
