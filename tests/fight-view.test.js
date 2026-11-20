import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas,Image as NativeImage} from '@napi-rs/canvas';
import {fileURLToPath} from 'node:url';
import {fightPoint,netGuidance} from '../src/fight-view.js';
import {LakeScene} from '../src/photo-scene.js';
import {Fishing} from '../src/fishing.js';

test('phone fight markers stay in the clear space between mission and controls',()=>{
 for(const [w,h,panel,mission] of [[390,650,410,180],[390,844,590,210],[393,650,400,190]]){
  const bounds={fightPanelTop:panel,missionBottom:mission};
  const net=fightPoint(w,h,h*.4,h*.75,2.8,0,bounds);
  for(const bearing of [-.4,0,.4])for(const d of [2.3,3.3,5,8,30]){
   const fish=fightPoint(w,h,h*.4,h*.75,d,bearing,bounds);
   assert.ok(fish.y>mission+14&&fish.y<panel-30);
   assert.ok(net.y+35<panel,'net label must remain above the controls');
   assert.equal(Math.sign(fish.x-net.x),Math.sign(bearing));
  }
  for(const d of [1.5,2.3,3.3])assert.ok(Math.abs(fightPoint(w,h,h*.4,h*.75,d,0,bounds).y-net.y)<12);
 }
});

test('net guidance follows the actual landing conditions and correct steering direction',()=>{
 const g={netDeployed:true,fishBearing:-.3,netAngle:0,distance:2.3,stamina:.1,tension:.5};
 assert.match(netGuidance(g),/vlevo.*vpravo/);
 assert.match(netGuidance({...g,fishBearing:.3}),/vpravo.*vlevo/);
 assert.match(netGuidance({...g,fishBearing:0,distance:5}),/Přitáhni/);
 assert.match(netGuidance({...g,fishBearing:0,tension:.1}),/povolený/);
 assert.match(netGuidance({...g,fishBearing:0}),/drž směr/);
});

test('fish marker moves with steering while the deployed net stays fixed; rendering does not advance the fight',async()=>{
 Object.assign(globalThis,{innerWidth:390,innerHeight:650,devicePixelRatio:1,window:{addEventListener(){},removeEventListener(){}},localStorage:{getItem:()=>null,setItem(){}},document:{createElement:()=>createCanvas(390,650)}});
 globalThis.Image=class extends NativeImage{set src(v){super.src=v.startsWith('file:')?fileURLToPath(v):v;}};
 const canvas=createCanvas(390,650);canvas.addEventListener=()=>{};
 const g=new Fishing(()=>.2);g.phase='fight';g.fish={id:'bream',length:40};g.distance=2.3;g.netDeployed=true;g.fishBearing=-.3;
 const scene=await new LakeScene(canvas,g).init();scene.setUiBounds({fightPanelTop:410,missionBottom:180});
 const before=JSON.stringify(g);scene.render(0);assert.equal(JSON.stringify(g),before);
 const net={...scene.metrics.netPosition},left={...scene.metrics.fishPosition};
 assert.ok(left.x<net.x&&net.y+35<410);
 g.fishBearing=.3;g.distance=5;scene.render(0);
 assert.deepEqual(scene.metrics.netPosition,net);assert.ok(scene.metrics.fishPosition.x>net.x);
 scene.dispose();
});

test('landscape fight stays to the right of the controls for either steering direction',()=>{
 const bounds={fightPanelTop:145,fightPanelRight:410};
 for(const angle of [-.6,-.3,0,.3,.6]){
  const fish=fightPoint(844,390,150,292,2.3,angle,bounds);
  assert.ok(fish.x>430&&fish.x<824);
 }
});
