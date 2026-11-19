// Game balance values, not measured fish populations or tackle safety ratings.
export const METHODS = {
 ledger:{name:'Položená',subtitle:'Čihátko · nástraha na dně',indicator:'mechanické čihátko',description:'Prut položíš do stojanu. Při pohybu čihátka ho vezmeš do ruky a samostatně zasekneš.',rigs:['running','hair'],rods:['carp','carp-heavy'],weights:[20,40,60],cast:[14,40]},
 feeder:{name:'Feeder',subtitle:'Citlivá špička · krmítko',indicator:'špička prutu',description:'Nástraha leží u krmítka. Záběr poznáš podle chvění a ohybu barevné špičky; prut zvedneš a zasekneš.',rigs:['cage','method'],rods:['feeder-light','feeder-heavy'],weights:[20,30,45,60],cast:[12,33]},
 float:{name:'Plavaná',subtitle:'Splávek · nastavitelná hloubka',indicator:'splávek',description:'Prut držíš v ruce a sleduješ anténku splávku. Při ponoření zasekneš přímo, bez braní prutu ze stojanu.',rigs:['fixed','sliding'],rods:['match','bolo'],weights:[2,3,5],cast:[7,19]},
};
export const RODS={
 carp:{name:'Kaprový 3,60 m · 2,75 lb',length:3.6,maxWeight:60,power:1},
 'carp-heavy':{name:'Kaprový 3,60 m · 3,00 lb',length:3.6,maxWeight:80,power:1.08},
 'feeder-light':{name:'Feeder 3,30 m · do 60 g',length:3.3,maxWeight:60,power:.91},
 'feeder-heavy':{name:'Feeder 3,60 m · do 90 g',length:3.6,maxWeight:90,power:1},
 match:{name:'Match 3,90 m · 5–20 g',length:3.9,maxWeight:20,power:.82},
 bolo:{name:'Bolo 5,00 m · 3–15 g',length:5,maxWeight:15,power:.78},
};
export const RIGS={
 running:{name:'Průběžné olovo',detail:'Kmenový vlasec → průběžné olovo → obratlík → návazec → háček',baits:['corn','worm','maggots','bread']},
 hair:{name:'Vlasová montáž',detail:'Kmenový vlasec → olovo → obratlík → návazec → háček s vlasovým přívěsem',baits:['corn','boilie','pellet']},
 cage:{name:'Průběžné klecové krmítko',detail:'Kmenový vlasec → klecové krmítko → obratlík → návazec → háček',baits:['corn','worm','maggots','bread']},
 method:{name:'Průběžný method feeder',detail:'Kmenový vlasec → ploché krmítko → krátký návazec → háček s přívěsem',baits:['corn','boilie','pellet']},
 fixed:{name:'Pevný splávek',detail:'Kmenový vlasec → pevný splávek → broky → návazec → háček',baits:['corn','worm','maggots','bread']},
 sliding:{name:'Průběžný splávek',detail:'Zarážka → splávek → broky → obratlík → návazec → háček',baits:['corn','worm','maggots','bread']},
};
export const BAITS={
 corn:{name:'Kukuřice',detail:'Zrnko na háček nebo vlasový přívěs',weights:[1.7,1.2,.9]},
 worm:{name:'Žížala',detail:'Živá nástraha přímo na háček',weights:[.8,2,1.1]},
 maggots:{name:'Bílí červi',detail:'Drobná nástraha pro jemnější sestavy',weights:[.65,1,2.2]},
 bread:{name:'Pečivo',detail:'Menší kousek na háčku',weights:[.85,.8,1.8]},
 boilie:{name:'Boilies 15 mm',detail:'Jedna kulička na vlasovém přívěsu; háček č. 6–10',weights:[3,.45,.25]},
 pellet:{name:'Peleta 8 mm',detail:'Na vlasový přívěs',weights:[2.2,.8,.75]},
};
export const FEEDS={
 none:{name:'Bez krmení',detail:'Pouze nástraha; nic se nespotřebovává',weights:[1,1,1]},
 grain:{name:'Partikl s kukuřicí',detail:'Zakrmování místa při položené nebo plavané',weights:[1.6,1.25,.8]},
 groundbait:{name:'Jemná vnadicí směs',detail:'Do krmítka i pro zakrmení ze břehu',weights:[1.05,1.1,1.7]},
 micro:{name:'Mikropelety 2 mm',detail:'Do krmítka i k vytvoření krmného místa',weights:[1.8,1.1,.7]},
};
export const DEFAULT_LOADOUT=Object.freeze({method:'ledger',rod:'carp',rig:'running',line:.25,hook:8,leader:40,weight:40,bait:'corn',feed:'none',feedPortion:150,depth:2});
export function methodPreset(method,current=DEFAULT_LOADOUT){
 const m=METHODS[method];if(!m)throw new Error('Neznámý způsob lovu.');
 const rig=m.rigs[0];
 return {...DEFAULT_LOADOUT,...current,method,rod:m.rods[0],rig,weight:m.weights[1],leader:method==='feeder'?20:40,line:method==='float'?.20:.25,feed:method==='feeder'?'groundbait':current.feed,bait:RIGS[rig].baits.includes(current.bait)?current.bait:'corn'};
}
export function validateLoadout(value){
 if(!value||typeof value!=='object')return ['Chybí sestava.'];
 const v=value,m=METHODS[v.method],errors=[];if(!m)return ['Vyber způsob lovu.'];
 if(!m.rods.includes(v.rod))errors.push('Tento prut nepatří ke zvolené technice.');
 if(!m.rigs.includes(v.rig))errors.push('Montáž neodpovídá technice.');
 if(![.16,.20,.25,.30,.35].includes(v.line))errors.push('Vyber průměr vlasce.');
 if(![6,8,10,12,14].includes(v.hook))errors.push('Vyber velikost háčku.');
 if(![10,20,40,60].includes(v.leader))errors.push('Vyber délku návazce.');
 if(!m.weights.includes(v.weight))errors.push('Zátěž neodpovídá technice.');
 if(!RIGS[v.rig]?.baits.includes(v.bait))errors.push('Nástraha neodpovídá montáži.');
 if(v.rig==='method'&&v.leader>20)errors.push('Method montáž potřebuje krátký návazec 10 nebo 20 cm.');
 if(v.bait==='boilie'&&v.hook>10)errors.push('Pro 15mm boilies zvol háček č. 6, 8 nebo 10.');
 if(!Object.hasOwn(FEEDS,v.feed))errors.push('Vyber krmení.');
 if(v.method==='feeder'&&v.feed==='grain')errors.push('Pro krmítko vyber vnadicí směs nebo mikropelety.');
 if(![50,150,300].includes(v.feedPortion))errors.push('Vyber dávku zakrmení.');
 if(!Number.isFinite(v.depth)||v.depth<.5||v.depth>3||Math.round(v.depth*4)!==v.depth*4)errors.push('Hloubka musí být 0,50–3,00 m po 25 cm.');
 return errors;
}
export function cleanLoadout(value){const result={};for(const key of Object.keys(DEFAULT_LOADOUT))result[key]=value[key];return result;}
export function feedInfluence(loadout,spot,time,distance,angle=0){
 if(!spot||loadout.feed==='none'||spot.type!==loadout.feed)return 0;
 const age=Math.max(0,time-spot.time),distanceMatch=Math.exp(-Math.pow((distance-spot.distance)/7,2)),angleMatch=Math.exp(-Math.pow((angle-spot.angle)/.18,2));
 return Math.max(0,1-age/240)*distanceMatch*angleMatch*Math.min(1,spot.grams/250);
}
export function speciesWeights(loadout,feedBonus=0){
 const bait=BAITS[loadout.bait],feed=FEEDS[loadout.feed];
 return bait.weights.map((w,i)=>w*(1+(feed.weights[i]-1)*feedBonus)*(loadout.method==='float'?[.7,1.1,1.3][i]:1)*(loadout.hook>=12&&i===0?.65:1));
}
export function biteDelay(loadout,random,feedBonus=0){
 const depthFit=loadout.method==='float'?1+Math.abs(loadout.depth-2)*.45:1;
 return (7+random*12)*depthFit/(1+feedBonus*.7);
}
export function setupSummary(v){return `${METHODS[v.method].name} · ${RIGS[v.rig].name} · ${BAITS[v.bait].name}`;}
