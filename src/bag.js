import {METHODS,RODS,REELS,RIGS,BAITS,FEEDS,INDICATORS,LINE_DIAMETERS,DEFAULT_LOADOUT,validateLoadout,cleanLoadout,feedAllowed} from './tackle.js?v=0.25.0';
export const BAG_CATALOG={rods:Object.keys(RODS),reels:Object.keys(REELS),rigs:Object.keys(RIGS),lines:[...new Set([...LINE_DIAMETERS,.16,.20,.25,.30,.35])],hooks:[6,8,10,12,14],leaders:[10,20,40,60],weights:[2,3,5,20,30,40,45,60],indicators:Object.keys(INDICATORS),baits:Object.keys(BAITS)};
const map={rod:'rods',reel:'reels',rig:'rigs',line:'lines',hook:'hooks',leader:'leaders',weight:'weights',indicator:'indicators',bait:'baits'};
export function cleanBag(value){
 if(!value||typeof value!=='object')return null;
 const bag={name:typeof value.name==='string'?value.name.trim().slice(0,40)||'Moje taška':'Moje taška',feeds:{}};
 for(const [key,known] of Object.entries(BAG_CATALOG))bag[key]=known.filter(id=>Array.isArray(value[key])&&value[key].includes(id));
 for(const id of Object.keys(FEEDS))if(id!=='none'){const n=value.feeds?.[id];if(Number.isInteger(n)&&n>0&&n<=5000&&n%50===0)bag.feeds[id]=n;}
 return bag;
}
export function bagErrors(v,bag){
 if(!bag)return [];if(!v||typeof v!=='object')return ['loadout'];
 const missing=[];for(const [field,section] of Object.entries(map)){
  if(field==='indicator'&&v.method!=='ledger')continue;
  if(!bag[section]?.includes(v[field]??DEFAULT_LOADOUT[field]))missing.push(field);
 }
 if(v.feed!=='none'&&!bag.feeds?.[v.feed])missing.push('feed');
 return missing;
}
export function includeLoadout(bag,v){
 for(const [field,section] of Object.entries(map)){const id=v[field]??DEFAULT_LOADOUT[field];if(!bag[section].includes(id))bag[section].push(id);}
 if(v.feed!=='none'&&!bag.feeds[v.feed])bag.feeds[v.feed]=1000;
 return bag;
}
export function makeBag(preset='mixed',loadouts=[]){
 const bag={name:({mixed:'Všestranná výprava',carp:'Kapr na položenou',feeder:'Feeder na cejny',float:'Plavaná s rodinou'})[preset]||'Moje taška',rods:preset==='carp'?['carp','carp-heavy']:preset==='feeder'?['feeder-light','feeder-heavy']:preset==='float'?['match','bolo']:['carp','feeder-light','match'],reels:['universal',...(preset==='carp'?['bigpit']:[])],rigs:preset==='carp'?METHODS.ledger.rigs:preset==='feeder'?METHODS.feeder.rigs:preset==='float'?METHODS.float.rigs:Object.keys(RIGS),lines:BAG_CATALOG.lines,hooks:BAG_CATALOG.hooks,leaders:BAG_CATALOG.leaders,weights:BAG_CATALOG.weights,indicators:Object.keys(INDICATORS),baits:preset==='carp'?['corn','boilie','boilie20','tiger','popup14','halibut14']:preset==='feeder'?['corn','worm','maggots','casters','wafter6','wafter8','softPellet6']:preset==='float'?['corn','worm','maggots','bread','wheat']:['corn','worm','maggots','bread','boilie','boilie20','pellet'],feeds:preset==='carp'?{grain:2000,boilieCrumb:1000}:preset==='feeder'?{groundbait:1000,micro:1000,breadCrumb:500}:preset==='float'?{grain:500,breadCrumb:500}:{grain:1000,groundbait:1000,micro:500}};
 const result=cleanBag(bag);for(const v of loadouts)includeLoadout(result,v);return cleanBag(result);
}
export function fitToBag(value,bag,{dual=false,methodOnly=false}={}){
 if(!bag)return cleanLoadout(value);
 const methods=methodOnly?[value.method]:[value.method,...Object.keys(METHODS).filter(id=>id!==value.method)];
 for(const method of methods){if(dual&&method==='float')continue;const m=METHODS[method],rods=m.rods.filter(id=>bag.rods.includes(id)),rigs=m.rigs.filter(id=>bag.rigs.includes(id));
  const choose=(items,current)=>items.includes(current)?current:items[0];
  for(const rig of [value.rig,...rigs.filter(id=>id!==value.rig)].filter(id=>rigs.includes(id))){
   const baits=RIGS[rig].baits.filter(id=>bag.baits.includes(id));
   for(const bait of [value.bait,...baits.filter(id=>id!==value.bait)].filter(id=>baits.includes(id))){
    for(const hook of [value.hook,...bag.hooks.filter(n=>n!==value.hook)].filter(n=>bag.hooks.includes(n))){
     const v={...DEFAULT_LOADOUT,...value,method,rod:choose(rods,value.rod),reel:choose(bag.reels,value.reel),rig,bait,hook,line:choose(bag.lines,value.line),leader:choose(bag.leaders.filter(n=>rig!=='method'||n<=20),value.leader),weight:choose(m.weights.filter(n=>bag.weights.includes(n)),value.weight),indicator:choose(bag.indicators,value.indicator)};
     const feeds=Object.keys(bag.feeds).filter(id=>feedAllowed(v,id));v.feed=value.feed==='none'&&!RIGS[rig].feeder?'none':choose(feeds,value.feed)||'none';
     if(!validateLoadout(v).length&&!bagErrors(v,bag).length)return v;
    }
   }
  }
 }
 return null;
}
export function bagCount(bag){return Object.keys(BAG_CATALOG).reduce((n,k)=>n+(bag[k]?.length||0),0)+Object.keys(bag.feeds||{}).length;}
export function bagWeight(bag){return Object.values(bag.feeds||{}).reduce((a,b)=>a+b,0);}
