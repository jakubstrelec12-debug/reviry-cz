import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {makeBag,fitToBag,bagErrors,cleanBag} from '../src/bag.js';
import {DEFAULT_LOADOUT,REELS,BAITS,FEEDS,validateLoadout,methodPreset} from '../src/tackle.js';
import {FishingSession} from '../src/session.js';
import {Preparation} from '../src/preparation.js';
const prepare=(s,bag)=>{const v=fitToBag(DEFAULT_LOADOUT,bag);assert.ok(v);assert.ok(s.applyLoadouts([{index:0,loadout:v}],{bag}));return v;};

test('all ready bags produce valid tackle using exclusively packed items',()=>{
 for(const preset of ['mixed','carp','feeder','float']){
  const bag=makeBag(preset),v=fitToBag(DEFAULT_LOADOUT,bag);
  assert.ok(v,preset);assert.deepEqual(validateLoadout(v),[]);assert.deepEqual(bagErrors(v,bag),[]);
  for(const method of ['ledger','feeder','float']){const chosen=fitToBag(methodPreset(method),bag,{methodOnly:true});if(chosen){assert.equal(chosen.method,method);assert.deepEqual(bagErrors(chosen,bag),[]);}}
 }
});
test('packed equipment is enforced by the session, including baits, rigs, reels and legacy loadouts',()=>{
 const s=new FishingSession(),bag=makeBag('feeder'),v=prepare(s,bag);
 assert.equal(s.setLoadout({...v,bait:'boilie20'}),false);
 assert.equal(s.applyLoadouts([{index:0,loadout:{...v,reel:'bigpit'}}]),false);
 assert.equal(s.setLoadout({...v,rig:'running',method:'ledger',rod:'carp',weight:40}),false);
 assert.equal(s.setLoadout({...v,reel:'universal'}),true);
 const old={...DEFAULT_LOADOUT};delete old.reel;const legacy=new FishingSession();assert.ok(legacy.restoreSetup({loadouts:[old]}));assert.equal(legacy.loadout.reel,'universal');assert.equal(legacy.bag,null);
});
test('both rods consume one finite stock and reload preserves the remainder instead of refilling it',()=>{
 const s=new FishingSession(),bag=makeBag('feeder');bag.feeds={groundbait:250};const v=prepare(s,bag);assert.equal(v.feed,'groundbait');s.enableSecond();
 s.rods[0].depositFeed(20);s.rods[1].phase='waiting';assert.equal(s.rods[1].feed(),true);assert.equal(s.feedStocks.groundbait,80);assert.equal(s.rods[1].feed(),false);
 const restored=new FishingSession();assert.ok(restored.restoreSetup(JSON.parse(JSON.stringify(s.exportSetup()))));assert.equal(restored.feedStocks.groundbait,80);assert.equal(restored.rods[0].feedStocks,restored.rods[1].feedStocks);
 assert.equal(restored.feedStocks.micro,0);assert.equal(restored.rods[0].depositFeed(100),false);
});
test('repacking is transactional, blocked while fishing, and clears old feeding spots on a new trip',()=>{
 const s=new FishingSession(),bag=makeBag('carp'),v=prepare(s,bag);s.active.phase='waiting';const before=JSON.stringify(s.exportSetup());
 assert.equal(s.applyLoadouts([{index:0,loadout:v}],{bag:makeBag('mixed')}),false);assert.equal(JSON.stringify(s.exportSetup()),before);
 s.active.phase='ready';s.active.feedSpots.push({type:'grain',time:0,distance:20,angle:0,grams:200});assert.ok(s.applyLoadouts([{index:0,loadout:v}],{bag}));assert.equal(s.feedSpots.length,0);
 const invalid={...v,bait:'unknown'};const stock=s.feedStocks.grain;assert.equal(s.applyLoadouts([{index:0,loadout:invalid}],{bag}),false);assert.equal(s.feedStocks.grain,stock);
});
test('challenge inventory is independent and the original bag and remaining feed return afterwards',()=>{
 const s=new FishingSession(),bag=makeBag('feeder');prepare(s,bag);s.feedStocks.groundbait=375;const before=s.exportSetup();
 assert.ok(s.startMission('hejtman-corn'));assert.equal(s.bag,null);assert.equal(s.feedStocks.grain,300);
 assert.ok(s.endMission());assert.deepEqual(s.exportSetup(),before);assert.equal(s.feedStocks.groundbait,375);
});
test('damaged stored quantities and unsupported inventory cannot create free supplies',()=>{
 const bag=makeBag('mixed');bag.feeds={groundbait:Infinity,micro:-50,grain:1000000,breadCrumb:250};const clean=cleanBag(bag);assert.deepEqual(clean.feeds,{breadCrumb:250});
 const s=new FishingSession();prepare(s,makeBag('mixed'));const snapshot=s.exportSetup();snapshot.stocks.grain=99999;const restored=new FishingSession();assert.equal(restored.restoreSetup(snapshot),false);
 const empty=cleanBag({});assert.equal(fitToBag(DEFAULT_LOADOUT,empty),null);
});
function ui(){const dom=new JSDOM(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),{url:'https://bag.test'});globalThis.document=dom.window.document;const game=new FishingSession();const p=new Preparation({game,onApply:(v,c,o)=>{assert.ok(game.applyLoadouts(c,o));p.close();},onClose:()=>p.close()});return {dom,game,p,click:s=>document.querySelector(s).click()};}

test('bag UI stages packing, cancels without side effects, saves a named bag and loads its tackle',()=>{
 const {game,p,click,dom}=ui();p.open({pack:true});click('[data-bag-preset="feeder"]');const name=document.getElementById('bagName');name.value='Moje cejnová výprava';click('[data-save-bag]');assert.match(document.querySelector('.bag-notice').textContent,/uložené/);
 click('[data-bag-preset="carp"]');click('[data-saved-bag="0"]');assert.equal(p.bagDraft.name,'Moje cejnová výprava');assert.ok(p.bagDraft.baits.includes('wafter6'));click('#setupClose');assert.equal(game.bag,null);
 p.open({pack:true});click('[data-saved-bag="0"]');click('#setupApply');assert.equal(p.tab,'method');assert.equal(p.draft.method,'feeder');click('#setupApply');assert.equal(game.bag.name,'Moje cejnová výprava');assert.equal(game.loadout.method,'feeder');assert.equal(JSON.parse(dom.window.localStorage.getItem('reviry-bags')).length,1);
});
test('at the water the bait and feed selectors contain only packed items and stock cannot be edited',()=>{
 const {game,p,click}=ui();prepare(game,makeBag('feeder'));p.open();click('[data-tab="bait"]');const shown=[...document.querySelectorAll('[data-bait]')].map(e=>e.dataset.bait);assert.ok(shown.length<Object.keys(BAITS).length);assert.ok(shown.every(id=>game.bag.baits.includes(id)));assert.equal(document.querySelector('[data-bait="boilie20"]'),null);
 click('[data-tab="feed"]');assert.ok([...document.querySelectorAll('[data-feed]')].every(e=>e.dataset.feed==='none'||game.bag.feeds[e.dataset.feed]));
 click('[data-tab="bag"]');click('[data-bag-category="feeds"]');assert.equal(document.querySelector('[data-pack-feed]'),null);assert.equal(document.getElementById('bagName'),null);
});
test('diagram shortcuts open the actual hook control and new navijak selection changes the chosen reel',()=>{
 const {p,click}=ui();p.open();click('[data-tab="assembly"]');click('.rig-part-picks [data-rig-part="hook"]');assert.equal(document.querySelector('.assembly-details').open,true);
 click('[data-assembly="reel"]');click('[data-gear="reel"][data-value="feeder"]');assert.equal(p.draft.reel,'feeder');assert.ok(REELS.feeder.retrieve>REELS.compact.retrieve);
});

test('a new float trip stages folding the second rod and cancellation keeps both original rods',()=>{
 const {game,p,click}=ui();prepare(game,makeBag('mixed'));game.enableSecond();p.open();click('[data-tab="bag"]');click('[data-repack]');click('[data-bag-preset="float"]');assert.equal(game.secondEnabled,true);click('#setupClose');assert.equal(game.secondEnabled,true);
 p.open();click('[data-tab="bag"]');click('[data-repack]');click('[data-bag-preset="float"]');click('#setupApply');assert.equal(p.draft.method,'float');click('#setupApply');assert.equal(game.secondEnabled,false);assert.equal(game.loadout.method,'float');assert.equal(game.bag.name,'Plavaná s rodinou');
});

test('loading a saved two rod bag stages both loadouts and cancelling leaves one rod',()=>{
 const {game,p,click,dom}=ui();const bag=makeBag('feeder'),a=fitToBag(DEFAULT_LOADOUT,bag);const b={...a,reel:'universal',bait:'corn'};
 dom.window.localStorage.setItem('reviry-bags',JSON.stringify([{bag,loadouts:[a,b]}]));p.open({pack:true});click('[data-saved-bag="0"]');assert.equal(p.drafts.length,2);assert.equal(p.preparingSecond,true);assert.equal(game.secondEnabled,false);click('#setupClose');assert.equal(game.secondEnabled,false);
 p.open({pack:true});click('[data-saved-bag="0"]');click('#setupApply');click('#setupApply');assert.equal(game.secondEnabled,true);assert.equal(game.rods[1].loadout.bait,'corn');
});
