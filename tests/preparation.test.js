import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {Fishing} from '../src/fishing.js';
import {Preparation} from '../src/preparation.js';
import {showCatchPhoto} from '../src/fish-photos.js';

function bench(){const dom=new JSDOM(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),{url:'https://example.test'});globalThis.document=dom.window.document;const game=new Fishing();let applied=null;const p=new Preparation({game,onApply:v=>applied=v,onClose:()=>p.close()});p.open();return {dom,game,p,get applied(){return applied;}};}
const el=id=>document.getElementById(id);
function click(selector){document.querySelector(selector).click();}
function choose(name,value,dom){const input=document.querySelector(`[name="${name}"]`);input.value=String(value);input.dispatchEvent(new dom.window.Event('change',{bubbles:true}));}

test('preparation lets player choose techniques, assembly, hook bait and feeding before applying',()=>{
 const b=bench();click('[data-method="feeder"]');assert.equal(b.p.draft.method,'feeder');click('[data-tab="assembly"]');choose('rig','method',b.dom);choose('leader',10,b.dom);choose('line',.20,b.dom);
 click('[data-tab="bait"]');click('[data-bait="pellet"]');click('[data-tab="feed"]');choose('feed','micro',b.dom);choose('feedPortion',300,b.dom);
 assert.ok(el('rigPreview').textContent.includes('Peleta'));assert.ok(el('setupSummary').textContent.includes('Feeder'));
 el('setupApply').click();assert.equal(b.applied.rig,'method');assert.equal(b.applied.line,.20);assert.equal(b.applied.bait,'pellet');assert.equal(b.applied.feed,'micro');assert.equal(b.applied.feedPortion,300);
 assert.equal(b.game.loadout.method,'ledger','draft does not change an active setup by itself');
});
test('invalid combinations display a reason and block apply until repaired',()=>{
 const b=bench();click('[data-tab="assembly"]');choose('rig','hair',b.dom);click('[data-tab="bait"]');click('[data-bait="boilie"]');click('[data-tab="assembly"]');choose('hook',14,b.dom);
 assert.equal(el('setupApply').disabled,true);assert.match(el('setupErrors').textContent,/háček/);el('setupApply').click();assert.equal(b.applied,null);
 click('[data-tab="assembly"]');choose('hook',8,b.dom);assert.equal(el('setupApply').disabled,false);el('setupApply').click();assert.equal(b.applied.bait,'boilie');
});
test('float depth is adjustable and closing discards unapplied changes',()=>{
 const b=bench();click('[data-method="float"]');click('[data-tab="assembly"]');choose('depth',1.25,b.dom);assert.equal(b.p.draft.depth,1.25);assert.match(el('setupForm').textContent,/1.25 m/);el('setupClose').click();assert.equal(b.p.opened,false);assert.equal(b.game.loadout.method,'ledger');b.p.open();assert.equal(b.p.draft.method,'ledger');
});
test('catch photo maps actual species, exposes attribution, and handles failures without a fake model',()=>{
 bench();showCatchPhoto({name:'Lín obecný'},el('fishIllustration'),el('fishPhotoCredit'));assert.ok(el('fishIllustration').getAttribute('src').endsWith('/assets/fish/tench.webp'));assert.match(el('fishPhotoCredit').textContent,/Dezidor/);assert.equal(el('fishPhotoCredit').querySelectorAll('a').length,2);
 el('fishIllustration').dispatchEvent(new document.defaultView.Event('error'));assert.equal(el('fishIllustration').hasAttribute('src'),false);assert.match(el('fishPhotoCredit').textContent,/nepodařilo/);
});

test('bottom feeder shortcut is visible and boilies are reachable without hunting for a hidden compatible rig',()=>{
 const b=bench();click('[data-quick-feeder]');assert.equal(b.p.draft.method,'ledger');assert.equal(b.p.draft.rig,'spring');assert.equal(b.p.draft.feed,'groundbait');click('[data-tab="bait"]');
 assert.ok(document.querySelector('[data-bait="boilie20"]'));click('[data-bait="boilie20"]');assert.equal(b.p.draft.rig,'springHair');assert.match(el('rigPreview').textContent,/Boilies 20 mm/);assert.match(el('setupForm').textContent,/100 %/);assert.equal(el('setupApply').disabled,false);el('setupApply').click();assert.equal(b.applied.bait,'boilie20');
});

test('switching rod drafts preserves independent choices and closing without apply discards both',async()=>{
 const {FishingSession}=await import('../src/session.js');const dom=new JSDOM(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),{url:'https://example.test'});globalThis.document=dom.window.document;
 const game=new FishingSession();game.enableSecond();const p=new Preparation({game,onApply:()=>{},onClose:()=>p.close()});p.open();
 click('[data-setup-rod="0"]');click('[data-tab="bait"]');click('[data-bait="boilie"]');assert.equal(p.draft.rig,'hair');
 click('[data-setup-rod="1"]');assert.equal(p.draft.bait,'corn');click('[data-tab="assembly"]');choose('rig','spring',dom);
 click('[data-setup-rod="0"]');assert.equal(p.draft.bait,'boilie');assert.equal(p.draft.rig,'hair');
 click('[data-setup-rod="1"]');assert.equal(p.draft.rig,'spring');assert.equal(p.draft.bait,'corn');
 el('setupClose').click();assert.equal(game.rods[0].loadout.bait,'corn');assert.equal(game.rods[1].loadout.rig,'running');p.open();assert.equal(p.draft.rig,'running');
});
