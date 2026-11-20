import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {BAITS,FEEDS,METHODS,RIGS,methodPreset,chooseBait,validateLoadout,feedAllowed,feedInfluence,catchWeight,baitChances} from '../src/tackle.js';
import {Fishing} from '../src/fishing.js';
import {FishingSession} from '../src/session.js';
import {Preparation} from '../src/preparation.js';

test('all catalogue hookbaits have a selectable, valid presentation; tiny and large baits adjust hooks',()=>{
 assert.ok(Object.keys(BAITS).length>=39);
 for(const [id,bait] of Object.entries(BAITS)){
  let choices=0;for(const method of Object.keys(METHODS)){const v=chooseBait(methodPreset(method),id);if(METHODS[method].rigs.some(r=>RIGS[r].baits.includes(id))){assert.deepEqual(validateLoadout(v),[],method+'/'+id);choices++;}}
  assert.ok(choices>0,id);assert.ok(bait.weights.some(x=>x>0));
 }
 assert.equal(chooseBait(methodPreset('float'),'pinkies').hook,12);assert.deepEqual(validateLoadout(chooseBait({...methodPreset('feeder'),leader:60},'wafter6')),[]);assert.ok(chooseBait(methodPreset('ledger'),'popup14').hook<=8);
 const floatBaits=new Set(METHODS.float.rigs.flatMap(r=>RIGS[r].baits));assert.ok(floatBaits.has('bloodworm'));assert.ok(floatBaits.has('pea'));assert.equal(floatBaits.has('popup14'),false);
});
test('all catalogue feed stocks are real, shared and consumed safely by an allowed feeder',()=>{
 assert.ok(Object.keys(FEEDS).length-1>=19);const session=new FishingSession();session.enableSecond();
 for(const id of Object.keys(FEEDS).filter(x=>x!=='none')){assert.equal(session.feedStocks[id],1000);assert.equal(session.rods[0].feedStocks,session.rods[1].feedStocks);const v={...methodPreset('feeder'),feed:id};if(!feedAllowed(v,id))continue;assert.deepEqual(validateLoadout(v),[]);const g=new Fishing(()=>.2);g.setLoadout(v);g.startCast();g.releaseCast();for(let i=0;i<25;i++)g.tick(.05);assert.equal(g.feedStocks[id],980,id);g.feedStocks[id]=0;assert.equal(g.feed(),false);assert.equal(g.feedStocks[id],0);}
 assert.equal(feedAllowed({...methodPreset('feeder')},'hemp'),false);assert.equal(feedAllowed({...methodPreset('ledger')},'hemp'),true);
});
test('baits change species and size; long-lasting mixes persist and favour larger catches',()=>{
 const float=methodPreset('float'),pink=chooseBait(float,'pinkies'),pea=chooseBait(float,'pea');assert.ok(baitChances(pink)[2]>baitChances(pea)[2]);
 const v={...methodPreset('ledger'),feed:'boilieCrumb'},spot={type:'boilieCrumb',time:0,distance:20,angle:0,grams:300};assert.ok(feedInfluence(v,spot,300,20,0)>0);assert.equal(feedInfluence({...v,feed:'breadCrumb'},{...spot,type:'breadCrumb'},300,20,0),0);
 const carp={id:'carp',min:1.4,max:7.8},avg=bonus=>Array.from({length:101},(_,i)=>catchWeight(carp,v,i/100,bonus)).reduce((a,b)=>a+b,0)/101;assert.ok(avg(1)>avg(0)+.2);
});
test('bait family filters and groundbait cards apply actual catalogue IDs through the UI',()=>{
 const dom=new JSDOM(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),{url:'https://example.test'});globalThis.document=dom.window.document;const game=new Fishing();let applied;const p=new Preparation({game,onApply:v=>applied=v,onClose:()=>p.close()});p.open();const click=s=>document.querySelector(s).click();
 click('[data-tab="bait"]');assert.equal(document.querySelectorAll('[data-bait]').length,Object.keys(BAITS).length);click('[data-bait-family="balanced"]');assert.equal(document.querySelectorAll('[data-bait]').length,Object.values(BAITS).filter(b=>b.family==='balanced').length);click('[data-bait="wafter6"]');assert.ok(RIGS[p.draft.rig].hair);assert.ok(p.draft.hook>=10);click('[data-tab="feed"]');click('[data-feed="methodMix"]');document.getElementById('setupApply').click();assert.equal(applied.feed,'methodMix');assert.equal(applied.bait,'wafter6');assert.deepEqual(validateLoadout(applied),[]);
 p.open();click('[data-method="float"]');click('[data-tab="bait"]');assert.ok(document.querySelector('[data-bait="wheat"]'));assert.equal(document.querySelector('[data-bait="popup14"]'),null);
});
