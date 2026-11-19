import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas,Image as NativeImage} from '@napi-rs/canvas';
import {fileURLToPath} from 'node:url';
import {LakeScene,photoCrop,waterPoint,PHOTO} from '../src/photo-scene.js';
import {Fishing,SPECIES} from '../src/fishing.js';
import {DEFAULT_LOADOUT,methodPreset,chooseBait,catchWeight,baitChances,validateLoadout} from '../src/tackle.js';

test('photo framing stays within source pixels and targets stay in water across phone orientations',()=>{
 for(const [w,h] of [[390,844],[844,390],[1280,720]])for(const yaw of [-.12,0,.12])for(const pitch of [-.055,0,.055]){
  const p=photoCrop(2400,1316,w,h,yaw,pitch);assert.ok(p.sx>=0&&p.sy>=0&&p.sx+p.sw<=2400+.001&&p.sy+p.sh<=1316+.001);
  const top=Math.max(0,Math.min(h,(1316*PHOTO.waterStart-p.sy)*p.scale));
  for(const distance of [2.2,7,30,54]){const target=waterPoint(w,h,top,distance,yaw);assert.ok(target.y>top&&target.y<h);assert.ok(target.x>0&&target.x<w);}
 }
});
test('photographic renderer executes every phase and technique without a GPU',async()=>{
 globalThis.innerWidth=844;globalThis.innerHeight=390;globalThis.devicePixelRatio=1;globalThis.window={addEventListener(){},removeEventListener(){}};globalThis.localStorage={getItem:()=>null,setItem(){}};
 globalThis.document={createElement:()=>createCanvas(844,390)};
 globalThis.Image=class extends NativeImage{set src(v){super.src=v.startsWith('file:')?fileURLToPath(v):v;}get src(){return super.src;}};
 const canvas=createCanvas(844,390);canvas.addEventListener=()=>{};
 const g=new Fishing(()=>.2),scene=await new LakeScene(canvas,g).init();
 for(const method of ['ledger','feeder','float']){g.loadout=methodPreset(method);g.fish={id:'carp',length:60};g.distance=3;g.tension=.7;
  for(const phase of ['ready','casting','flying','waiting','bite','held','fight','landed','escaped']){g.phase=phase;g.elapsed=.45;g.castPower=.6;scene.render(.05);if(phase==='waiting'){scene.splash();scene.scatterFeed();scene.render(.05);}}
 }
 assert.equal(scene.metrics.engine,'photographic-2d');assert.ok(scene.metrics.drawImages>10);
 const pixels=scene.ctx.getImageData(10,10,300,100).data;assert.ok(pixels.some((v,i)=>i%4!==3&&v>50));
 const before=scene.clock;scene.render(0);assert.equal(scene.clock,before);scene.setQuality(false);scene.render(.05);assert.equal(scene.ratio,1);scene.dispose();
});
test('boilies are always selectable for bottom fishing and automatically choose the hair rig',()=>{
 for(const rig of ['running','spring','hair','springHair'])for(const bait of ['boilie','boilie20']){
  const v=chooseBait({...DEFAULT_LOADOUT,rig,hook:14},bait);assert.deepEqual(validateLoadout(v),[]);assert.ok(['hair','springHair'].includes(v.rig));assert.ok(v.hook<=(bait==='boilie20'?8:10));
  if(rig.startsWith('spring'))assert.equal(v.rig,'springHair');
 }
});
test('bait gate is applied to actual catches: 20 mm boilies never select tench or bream',()=>{
 for(let i=0;i<=100;i++){
  const g=new Fishing(()=>i/100);g.setLoadout(chooseBait(DEFAULT_LOADOUT,'boilie20'));g.phase='waiting';g.biteIn=0;g.tick(.05);assert.equal(g.fish.id,'carp');assert.ok(g.fish.weight>=4);
 }
 const carp=SPECIES[0],corn={...DEFAULT_LOADOUT},boilie=chooseBait(DEFAULT_LOADOUT,'boilie20');
 const sample=v=>Array.from({length:101},(_,i)=>catchWeight(carp,v,i/100)).reduce((a,b)=>a+b,0)/101;assert.ok(sample(boilie)>sample(corn)+1);
 assert.deepEqual(baitChances(boilie),[1,0,0]);assert.ok(baitChances({...DEFAULT_LOADOUT,bait:'maggots'})[2]>.7);
});
test('spring feeder on ledger consumes feed while preserving the mechanical-indicator method',()=>{
 const g=new Fishing(()=>.1);g.setLoadout({...DEFAULT_LOADOUT,rig:'spring',feed:'groundbait'});g.startCast();g.releaseCast();for(let i=0;i<25;i++)g.tick(.05);assert.equal(g.phase,'waiting');assert.equal(g.feedStocks.groundbait,980);assert.equal(g.loadout.method,'ledger');
});
