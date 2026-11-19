import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas,Image as NativeImage} from '@napi-rs/canvas';
import {fileURLToPath} from 'node:url';
import {VENUES,STOCK_SOURCES,getVenue,venueWeights,venueChances} from '../src/venues.js';
import {Fishing} from '../src/fishing.js';
import {FishingSession} from '../src/session.js';
import {BAITS,DEFAULT_LOADOUT,chooseBait} from '../src/tackle.js';
import {FISH_PHOTOS} from '../src/fish-photos.js';
import {LakeScene} from '../src/photo-scene.js';

test('venue evidence preserves source dates, group scope and photo uncertainty',()=>{
 assert.equal(VENUES.jarosov.playable.length,6);assert.equal(VENUES.vlkov.playable.length,5);
 assert.equal(VENUES.jarosov.photo.verified,true);assert.equal(VENUES.jarosov.photo.external,true);assert.match(VENUES.jarosov.photo.fallback.note,/Není to fotografie/);
 assert.match(STOCK_SOURCES.vlkov2019.scope,/celý revír/);assert.equal(STOCK_SOURCES.vlkov2019.date,'2019');
 for(const v of Object.values(VENUES))for(const id of v.playable)assert.ok(FISH_PHOTOS[id]);
 for(const v of [VENUES.jarosov,VENUES.vlkov]){assert.ok(v.sources.length>=2);for(const id of v.sources)assert.match(STOCK_SOURCES[id].url,/^https:\/\//);}
 assert.equal(getVenue('injected').id,'vajgar');assert.match(FISH_PHOTOS.crucian.changes,/nikoli potvrzení/);
});
test('actual bite selection uses only that venue and preserves the bait gates for every bait',()=>{
 for(const id of Object.keys(VENUES)){
  const observed=new Set();
  for(const bait of Object.keys(BAITS))for(let i=0;i<101;i++){
   const random=()=>i/101,g=new Fishing(random);g.venueId=id;g.loadout=chooseBait(DEFAULT_LOADOUT,bait);g.phase='waiting';g.biteIn=0;g.tick(.05);
   assert.ok(VENUES[id].playable.includes(g.fish.id));assert.ok(Number.isFinite(g.fish.weight)&&g.fish.weight>0);assert.ok(g.fish.length>5);observed.add(g.fish.id);
   if(bait==='boilie20')assert.equal(g.fish.id,'carp');
  }
  assert.deepEqual([...observed].sort(),[...VENUES[id].playable].sort());
  const weights=venueWeights(DEFAULT_LOADOUT,id),chances=venueChances(DEFAULT_LOADOUT,id);assert.equal(weights.length,VENUES[id].playable.length);assert.ok(Math.abs(chances.reduce((a,b)=>a+b,0)-1)<1e-9);
 }
});
test('travel is shared by both rods, blocked while either is fishing, and retains inventory and catch origin',()=>{
 const s=new FishingSession(()=>.2);s.enableSecond();s.feedStocks.grain=655;assert.ok(s.setVenue('jarosov'));assert.ok(s.rods.every(r=>r.venueId==='jarosov'));
 s.rods[0].phase='waiting';assert.equal(s.setVenue('vlkov'),false);assert.equal(s.venueId,'jarosov');s.rods[0].phase='ready';
 s.active.feedSpot={type:'grain',grams:100,time:0,distance:5,angle:0};assert.ok(s.setVenue('vlkov'));assert.equal(s.active.feedSpot,null);assert.equal(s.feedStocks.grain,655);
 const saved=s.exportSetup(),restored=new FishingSession();assert.ok(restored.restoreSetup(saved));assert.equal(restored.venueId,'vlkov');assert.ok(restored.rods.every(r=>r.venueId==='vlkov'));
 assert.ok(restored.restoreSetup({...saved,venueId:'unknown'}));assert.equal(restored.venueId,'vajgar');assert.equal(s.setVenue('unknown'),false);
 s.active.phase='fight';s.active.fish={id:'amur',name:'Amur bílý',weight:3,length:60};s.active.distance=3;s.active.stamina=.1;s.net();assert.equal(s.journal[0].venueId,'vlkov');
});
test('local scenery switches atomically, uses its own waterline and stays within source crop',async()=>{
 globalThis.innerWidth=844;globalThis.innerHeight=390;globalThis.devicePixelRatio=1;globalThis.window={addEventListener(){},removeEventListener(){}};globalThis.localStorage={getItem:()=>null,setItem(){}};globalThis.document={createElement:()=>createCanvas(844,390)};
 globalThis.Image=class extends NativeImage{set src(v){if(v.startsWith('https:')){queueMicrotask(()=>this.onerror(new Error('External image unavailable in offline test')));return;}super.src=v.startsWith('file:')?fileURLToPath(v):v;}get src(){return super.src;}};
 const canvas=createCanvas(844,390);canvas.addEventListener=()=>{};const g=new Fishing(()=>.2),scene=await new LakeScene(canvas,g).init();
 const images=[];
 for(const id of Object.keys(VENUES)){
  await scene.setVenue(id);g.venueId=id;g.phase='waiting';g.distance=30;scene.render(0);const c=scene.crop;
  assert.equal(scene.photo.src,id==='jarosov'?VENUES.jarosov.photo.fallback.src:VENUES[id].photo.src);if(id==='jarosov')assert.equal(scene.photo.verified,false);assert.ok(c.sx>=0&&c.sy>=0&&c.sx+c.sw<=scene.image.width+.01&&c.sy+c.sh<=scene.image.height+.01);
  assert.ok(scene.target.y>scene.waterTop&&scene.target.y<scene.shoreTop);images.push(canvas.toBuffer('image/png'));
 }
 assert.notDeepEqual(images[0],images[1]);assert.notDeepEqual(images[1],images[2]);scene.dispose();
});

test('wide portrait view exposes more source pixels without stretching the actual shore photograph',async()=>{
 globalThis.innerWidth=390;globalThis.innerHeight=650;globalThis.devicePixelRatio=1;globalThis.window={addEventListener(){},removeEventListener(){}};globalThis.localStorage={getItem:()=>null,setItem(){}};globalThis.document={createElement:()=>createCanvas(390,650)};
 globalThis.Image=class extends NativeImage{set src(v){super.src=v.startsWith('file:')?fileURLToPath(v):v;}get src(){return super.src;}};
 const canvas=createCanvas(390,650);canvas.addEventListener=()=>{};const scene=await new LakeScene(canvas,new Fishing()).init();
 scene.setWideView(false);const normal=scene.crop.sw;scene.setWideView(true);assert.ok(scene.crop.sw>normal*1.5);assert.ok(Math.abs(scene.crop.sw-scene.image.width)<1);
 assert.ok(scene.waterTop>100&&scene.waterTop<scene.shoreTop);assert.equal(scene.crop.scale,390/scene.image.width);const clock=scene.clock;scene.setWideView(false);assert.equal(scene.clock,clock);scene.dispose();
});
