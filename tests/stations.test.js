import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadImage} from '@napi-rs/canvas';
import {VENUES} from '../src/venues.js';
import {STATIONS,stationFor,stationLayout} from '../src/stations.js';
import {restingLayout,waterPoint} from '../src/photo-scene.js';

test('each venue has independent scenery; unavailable originals never substitute another water',()=>{
 const sources=Object.values(VENUES).map(v=>v.photo.src);
 assert.equal(new Set(sources).size,sources.length);
 for(const v of Object.values(VENUES)){
  assert.ok(v.photo.verified||v.photo.synthetic,v.id);
  assert.deepEqual(v.station,stationFor(v.id));
  if(v.photo.fallback){assert.equal(v.photo.fallback.synthetic,true);assert.notEqual(v.photo.fallback.src,v.photo.src);}
 }
 assert.equal(VENUES.vlkovmala.photo.verified,false);
 assert.match(VENUES.luznice10c.photo.title,/Stupský/);
});

test('natural bank layers cover every viewport and support both tripods without moving cast targets onto land',async()=>{
 for(const station of Object.values(STATIONS)){
  const image=await loadImage(station.src);
  for(const [w,h] of [[390,650],[390,844],[844,390],[1366,768],[2048,768]]){
   const bank=stationLayout(w,h,image,station);
   assert.ok(bank.x<=0&&bank.x+bank.width>=w);
   assert.ok(bank.y+bank.height>=h-.01);
   assert.equal(bank.y+bank.height*station.edge,bank.shoreTop);
   for(let index=0;index<2;index++){
    const rest=restingLayout(w,h,{index,count:2,shoreTop:bank.shoreTop});
    assert.ok(rest.footY>bank.shoreTop&&rest.footY<h);
   }
   for(const distance of [3,20,54]){
    const p=waterPoint(w,h,h*.4,distance,0,bank.shoreTop);
    assert.ok(p.y>h*.4&&p.y<bank.shoreTop-10);
   }
  }
 }
});
