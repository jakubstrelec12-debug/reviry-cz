import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RodPresentation,environmentAt,releaseGesture} from '../src/immersion.js';
import {Fishing} from '../src/fishing.js';
import {LakeSound} from '../src/soundscape.js';
const step=(g,t)=>{for(let i=0;i<t*20;i++)g.tick(.05);};
test('pickup approaches the hand pose, winding follows the button, and zero-time optical draws cannot advance it',()=>{
 const g=new Fishing(()=>.2),p=new RodPresentation();p.update(g,0);assert.equal(p.pickup,0);g.phase='held';p.update(g,.05);const pickup=p.pickup;assert.ok(pickup>0&&pickup<1);p.update(g,.05);assert.ok(p.pickup>pickup);
 g.reeling=true;const first=p.crank;p.update(g,.2);assert.ok(p.crank>first);assert.ok(p.reach>0);const before=JSON.stringify(p);p.update(g,0);assert.equal(JSON.stringify(p),before);
 g.reeling=false;const stopped=p.crank,reach=p.reach;p.update(g,.2);assert.equal(p.crank,stopped);assert.ok(p.reach<reach);
 const idle=new RodPresentation();g.phase='waiting';idle.update(g,.2);assert.equal(idle.pickup,0);assert.notEqual(p.pickup,idle.pickup);
});
test('the spool pays out from actual distance change, while a loaded reel can stall the winding gesture',()=>{
 const g=new Fishing(()=>.99);g.phase='fight';g.fish={id:'carp',weight:7.8,power:.85};g.distance=20;g.drag=.08;g.overload=0;g.slack=0;g.hookQuality=1;g.run={mode:'surge',age:2,duration:5,power:1.3,direction:.08};
 const before=g.distance;g.tick(.05);assert.ok(g.distance>before);assert.ok(Math.abs(g.lineOutRate-(g.distance-before)/.05)<1e-8);
 const p=new RodPresentation();p.update(g,.1);assert.ok(p.spool>0);g.tension=.9;g.reeling=true;const crank=p.crank;p.update(g,.1);assert.equal(p.crank,crank);
 g.run={mode:'rest',age:0,duration:3,power:0,direction:0};g.stamina=.1;g.drag=.5;g.reeling=true;step(g,.1);assert.equal(g.lineOutRate,0);assert.ok(g.lineInRate>0);
});
test('cast release follows through then settles, and wind is bounded and repeatable without game RNG',()=>{
 const g=new Fishing();g.phase='flying';g.castPower=1;g.elapsed=0;const back=releaseGesture(g);g.elapsed=.18;assert.ok(releaseGesture(g)>back);g.elapsed=2;assert.ok(Math.abs(releaseGesture(g))<.01);
 for(let t=0;t<200;t++){const a=environmentAt(t*.3);assert.deepEqual(a,environmentAt(t*.3));assert.ok(a.gust>=.05&&a.gust<=1);assert.ok(Math.abs(a.sway)<=.81);}
});
class Param{constructor(){this.value=0;}setValueAtTime(v){this.value=v;}setTargetAtTime(v){this.value=v;}exponentialRampToValueAtTime(v){this.value=v;}}
class Node{constructor(ctx,type){this.ctx=ctx;this.kind=type;this.gain=new Param();this.frequency=new Param();this.pan=new Param();this.Q=new Param();}connect(){return this;}start(){this.ctx.started.push(this.kind==='buffer'&&this.loop?'ambient':this.kind);}stop(){}}
class FakeContext{constructor(){this.currentTime=0;this.sampleRate=2000;this.state='running';this.destination={};this.started=[];}createGain(){return new Node(this,'gain');}createBiquadFilter(){return new Node(this,'filter');}createBufferSource(){return new Node(this,'buffer');}createOscillator(){return new Node(this,'tone');}createStereoPanner(){return new Node(this,'pan');}createBuffer(ch,n){return {getChannelData:()=>new Float32Array(n)};}resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}}
test('soundscape pauses foreground sound, follows control and line movement, and resumes without duplicate ambient loops',async()=>{
 const s=new LakeSound(FakeContext),g=new Fishing();assert.deepEqual(s.context.started,['ambient','ambient']);g.paused=true;s.update(g,.1);const quiet=s.context.started.length;s.alarm();s.event('cast',{},g);assert.equal(s.context.started.length,quiet);assert.equal(s.master.gain.value,0);
 g.paused=false;s.update(g,.1);s.alarm();assert.equal(s.context.started.at(-1),'tone');const count=s.context.started.length;g.phase='fight';g.reeling=true;g.tension=.4;g.lineOutRate=0;s.update(g,.1);assert.ok(s.context.started.length>count);
 g.reeling=false;g.lineOutRate=1;const drag=s.context.started.length;s.update(g,.2);assert.ok(s.context.started.length>drag);
 await s.suspend();const stopped=s.context.started.length;s.update(g,10);assert.equal(s.context.started.length,stopped);await s.resume();s.update(g,.2);assert.equal(s.context.started.filter(x=>x==='ambient').length,2);
});
