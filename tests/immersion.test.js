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
 const s=new LakeSound(FakeContext),g=new Fishing();assert.deepEqual(s.context.started,['ambient','ambient']);g.paused=true;s.update(g,.1);const quiet=s.context.started.length;s.alarm();s.event('cast',{},g);assert.equal(s.context.started.length,quiet);assert.equal(s.effects.gain.value,0);assert.ok(s.master.gain.value>0);s.confirm();assert.equal(s.context.started.at(-1),'tone');
 g.paused=false;s.update(g,.1);s.alarm();assert.equal(s.context.started.at(-1),'tone');const count=s.context.started.length;g.phase='fight';g.reeling=true;g.tension=.4;g.lineOutRate=0;s.update(g,.1);assert.ok(s.context.started.length>count);
 g.reeling=false;g.lineOutRate=1;const drag=s.context.started.length;s.update(g,.2);assert.ok(s.context.started.length>drag);
 await s.suspend();const stopped=s.context.started.length;s.update(g,10);assert.equal(s.context.started.length,stopped);await s.resume();s.update(g,.2);assert.equal(s.context.started.filter(x=>x==='ambient').length,2);
});
test('blank flex lags load, responds to head shakes and settles without advancing on paused frames',()=>{
 const g=new Fishing(),p=new RodPresentation();g.phase='fight';g.tension=.8;p.update(g,.05);assert.ok(p.bend>0&&p.bend<.8);
 for(let i=0;i<60;i++)p.update(g,1/60);assert.ok(Math.abs(p.bend-.8)<.001);
 const stopped=JSON.stringify(p);p.update(g,0);assert.equal(JSON.stringify(p),stopped);
 g.phase='escaped';p.update(g,.05);assert.ok(p.bend>0&&p.bend<.8);for(let i=0;i<100;i++)p.update(g,1/60);assert.ok(Math.abs(p.bend)<.001);
 const slow=new RodPresentation(),fast=new RodPresentation();g.phase='fight';for(let i=0;i<30;i++)slow.update(g,1/30);for(let i=0;i<120;i++)fast.update(g,1/120);assert.ok(Math.abs(slow.bend-fast.bend)<.001);
});
test('master volume clamps to a safe range and persists when effects pause',()=>{
 const s=new LakeSound(FakeContext);s.setVolume(.4);assert.ok(Math.abs(s.master.gain.value-.26)<1e-9);s.setPaused(true);assert.ok(Math.abs(s.master.gain.value-.26)<1e-9);s.setVolume(-1);assert.equal(s.master.gain.value,0);s.setVolume(2);assert.equal(s.master.gain.value,.65);
});
test('audition plays all three effects through menu pause, while ordinary game effects stay muted',()=>{
 const s=new LakeSound(FakeContext);s.setPaused(true);
 for(const name of ['reel','drag','splash']){const before=s.context.started.length;s.preview(name);assert.ok(s.context.started.length>before,name);}
 const before=s.context.started.length;s.reelClick();s.dragClick();s.splash();assert.equal(s.context.started.length,before);
});
test('reel and drag cues follow controls and actual payout independently on both rods',()=>{
 const s=new LakeSound(FakeContext),a=new Fishing(),b=new Fishing(),reel=[],drag=[],splash=[];
 s.reelClick=pan=>reel.push(pan);s.dragClick=pan=>drag.push(pan);s.splash=(distance,pan)=>splash.push({distance,pan});
 a.phase=b.phase='fight';a.reeling=true;a.lineOutRate=0;b.reeling=false;b.lineOutRate=1;b.distance=20;
 s.update({paused:false,enabledRods:[a,b],trip:a.trip},.1);assert.equal(reel.length,1);assert.equal(drag.length,1);assert.ok(reel[0]<0);assert.ok(drag[0]>0);
 a.reeling=false;b.lineOutRate=0;s.update({paused:false,enabledRods:[a,b],trip:a.trip},.2);assert.equal(reel.length,1);assert.equal(drag.length,1);
 s.event('splash',{rodIndex:1},b);assert.equal(splash.length,1);assert.equal(splash[0].distance,20);assert.ok(splash[0].pan>0);
 const before=reel.length;s.event('retrieved',{rodIndex:0},a);assert.equal(reel.length,before+7);
});
