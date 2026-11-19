// Game balance values, not measured fish populations or tackle safety ratings.
export const METHODS = {
 ledger:{name:'Položená',subtitle:'Volitelná signalizace · olovo nebo krmítko',indicator:'mechanické čihátko',description:'Vybereš olovo nebo pružinové krmítko. Prut položíš do stojanu. Podle zvolené signalizace poznáš záběr, vezmeš ho do ruky a samostatně zasekneš.',rigs:['running','spring','hair','springHair'],rods:['carp','carp-heavy'],weights:[20,40,60],cast:[14,40]},
 feeder:{name:'Feeder',subtitle:'Citlivá špička · krmítko',indicator:'špička prutu',description:'Nástraha leží u krmítka. Záběr poznáš podle chvění a ohybu barevné špičky; prut zvedneš a zasekneš.',rigs:['cage','method'],rods:['feeder-light','feeder-heavy'],weights:[20,30,45,60],cast:[12,33]},
 float:{name:'Plavaná',subtitle:'Splávek · nastavitelná hloubka',indicator:'splávek',description:'Prut držíš v ruce a sleduješ anténku splávku. Při souvislém ponoření nebo přizvednutí zasekneš přímo, bez braní prutu ze stojanu.',rigs:['fixed','sliding'],rods:['match','bolo'],weights:[2,3,5],cast:[7,19]},
};
export const INDICATORS={
 bobbin:{name:'Mechanické čihátko',detail:'Zavěšené pod vlascem. Stoupá při jízdě a klesá při padáku.'},
 swinger:{name:'Swinger',detail:'Indikátor na pevném raménku. Ukazuje tah i povolení vlasce.'},
 electronic:{name:'Elektronický hlásič + swinger',detail:'Světelná a zvuková signalizace pohybu vlasce. Swinger ukazuje i padák. Pro pípání zapni zvuk hry.'},
};
export function indicatorName(v){return v.method==='ledger'?(INDICATORS[v.indicator||'bobbin']||INDICATORS.bobbin).name:METHODS[v.method].indicator;}
export const RODS={
 carp:{brand:'Mivardi',model:'Spotter',source:'https://www.rybina.cz/rybarske-pruty/kaprove-pruty/%28p%29-mivardi/',name:'Mivardi Spotter · 3,60 m · 2,75 lb',length:3.6,maxWeight:60,power:1},
 'carp-heavy':{brand:'Mivardi',model:'Vector MK2 FC',source:'https://www.mivardi.cz/prut-vector-mk2-fc-360h',name:'Mivardi Vector MK2 FC · 3,60 m · 3 lb',length:3.6,maxWeight:80,power:1.08},
 'feeder-light':{brand:'Mivardi',model:'Symphony Feeder 360M',source:'https://www.mivardi.cz/symphony-feeder-360m-25-75-g',name:'Mivardi Symphony 360M · 3,60 m · 25–75 g',length:3.6,maxWeight:75,power:.91},
 'feeder-heavy':{brand:'Mivardi',model:'Symphony Feeder 360H',source:'https://www.mivardi.cz/symphony-feeder-360h-40-90-g',name:'Mivardi Symphony 360H · 3,60 m · 40–90 g',length:3.6,maxWeight:90,power:1},
 match:{brand:'Mivardi',model:'Easy Match II 390',source:'https://www.mivardi.cz/easy-match-ii-390',name:'Mivardi Easy Match II · 3,90 m · 5–20 g',length:3.9,maxWeight:20,power:.82},
 bolo:{brand:'Mivardi',model:'Phenomena TMX Bolo 500',source:'https://www.mivardi.cz/prut-phenomena-tmx-bolo-500',name:'Mivardi Phenomena TMX · 5,00 m · 10–20 g',length:5,maxWeight:20,power:.78},
};
export const RIGS={
 running:{name:'Průběžné olovo',detail:'Kmenový vlasec → průběžné olovo → obratlík → návazec → háček',baits:['corn','worm','maggots','bread']},
 spring:{name:'Krmítko na položenou',feeder:true,detail:'Vlasec → průběžné pružinové krmítko → obratlík → návazec → háček',baits:['corn','worm','maggots','bread']},
 springHair:{name:'Krmítko + vlasový přívěs',feeder:true,hair:true,detail:'Vlasec → pružinové krmítko → obratlík → návazec → háček s vlasovým přívěsem',baits:['corn','boilie','boilie20','pellet']},
 hair:{hair:true,name:'Vlasová montáž',detail:'Kmenový vlasec → olovo → obratlík → návazec → háček s vlasovým přívěsem',baits:['corn','boilie','boilie20','pellet']},
 cage:{feeder:true,name:'Průběžné klecové krmítko',detail:'Kmenový vlasec → klecové krmítko → obratlík → návazec → háček',baits:['corn','worm','maggots','bread']},
 method:{feeder:true,hair:true,name:'Průběžný method feeder',detail:'Kmenový vlasec → ploché krmítko → krátký návazec → háček s přívěsem',baits:['corn','boilie','boilie20','pellet']},
 fixed:{name:'Pevný splávek',detail:'Kmenový vlasec → pevný splávek → broky → návazec → háček',baits:['corn','worm','maggots','bread']},
 sliding:{name:'Průběžný splávek',detail:'Zarážka → splávek → broky → obratlík → návazec → háček',baits:['corn','worm','maggots','bread']},
};
export const BAITS={
 corn:{name:'Kukuřice',detail:'Zrnko na háček nebo vlasový přívěs',weights:[3,1.4,1.2],sizeBias:1.4},
 worm:{name:'Žížala',detail:'Živá nástraha přímo na háček',weights:[.7,3,1.5],sizeBias:1.7},
 maggots:{name:'Bílí červi',detail:'Drobná nástraha pro jemnější sestavy',weights:[.2,1.1,4],sizeBias:2.2},
 bread:{name:'Pečivo',detail:'Menší kousek na háčku',weights:[.7,.5,3.5],sizeBias:1.8},
 boilie:{brand:'Nikl',model:'Ready boilie Kill Krill',source:'https://www.nikl.cz/nikl-ready-boilie-kill-krill_z39082/',name:'Boilies 15 mm · Nikl Kill Krill',detail:'Jedna kulička na vlasovém přívěsu; háček č. 6–10',weights:[12,.18,.07],sizeBias:.85,minWeights:{carp:2.5}},
 boilie20:{brand:'Nikl',model:'Ready boilie Kill Krill',source:'https://www.nikl.cz/nikl-ready-boilie-kill-krill_z39082/',name:'Boilies 20 mm · Nikl Kill Krill',detail:'Větší kulička na vlasovém přívěsu; háček č. 6 nebo 8. V této hře cílí na větší kapry.',weights:[25,0,0],sizeBias:.75,minWeights:{carp:4}},
 pellet:{brand:'Mivardi',model:'Rapid SweetCorn',source:'https://www.mivardi.cz/rapid-pelety-sweetcorn',name:'Peleta 8 mm · Mivardi Rapid SweetCorn',detail:'Na vlasový přívěs',weights:[6,.8,.5],sizeBias:1,minWeights:{carp:1.8}},
};
export const FEEDS={
 none:{name:'Bez krmení',detail:'Pouze nástraha; nic se nespotřebovává',weights:[1,1,1]},
 grain:{name:'Partikl s kukuřicí',detail:'Zakrmování místa při položené nebo plavané',weights:[1.6,1.25,.8]},
 groundbait:{brand:'Sonubaits',model:'Supercrush Green',source:'https://www.sonubaits.com/en/products/groundbait/sp-10474',name:'Sonubaits Supercrush Green',detail:'Do krmítka i pro zakrmení ze břehu',weights:[1.05,1.1,1.7]},
 micro:{name:'Mikropelety 2 mm',detail:'Do krmítka i k vytvoření krmného místa',weights:[1.8,1.1,.7]},
};
// Expanded catalogue. Product names are factual; response values are game balance.
Object.assign(BAITS,{
 casters:{name:'Kukly červů (casters)',detail:'Dvě kukly na jemný háček',family:'natural',sample:'maggots',weights:[.6,2.1,2.6],sizeBias:1.8,maxHook:14,speed:1.08},
 pinkies:{name:'Pinkies · drobní červi',detail:'Jemná nástraha pro cejna a lína',family:'natural',sample:'maggots',weights:[.15,1.2,4.5],sizeBias:2.5,minHook:12,speed:1.15},
 bloodworm:{name:'Patentky',detail:'Drobné larvy na jemný háček',family:'natural',sample:'worm',weights:[.1,1.8,5],sizeBias:2.7,minHook:12,speed:1.12},
 wheat:{name:'Vařená pšenice',detail:'Drobné zrno pro jemný lov',family:'natural',sample:'corn',weights:[.6,1.2,3.2],sizeBias:2.1,minHook:10},
 pea:{name:'Vařený hrách',detail:'Větší zrno na háček',family:'natural',sample:'corn',weights:[2,2.2,1],sizeBias:1.2,maxHook:12},
 dough:{name:'Medové těsto',detail:'Měkká kulička na háčku',family:'natural',sample:'bread',weights:[2,1.8,1.8],sizeBias:1.5,speed:1.05},
 potato:{name:'Vařená brambora',detail:'Menší kostka na větší háček',family:'natural',sample:'bread',weights:[3,1.7,.4],sizeBias:1,maxHook:10,speed:.88},
 luncheon:{name:'Lančmít · kostka',detail:'Masová nástraha na větším háčku',family:'natural',sample:'bread',weights:[2.5,2.8,.7],sizeBias:1.1,maxHook:10},
 cheese:{name:'Sýr · malá kostka',detail:'Výrazná měkká nástraha',family:'natural',sample:'bread',weights:[1.4,2.4,.8],sizeBias:1.2,maxHook:12,speed:.95},
 tiger:{name:'Tygří ořech · Mivardi',brand:'Mivardi',model:'Nakládaný tygří ořech',source:'https://www.mivardi.cz/tygri-orech',detail:'Tvrdá nástraha na vlasový přívěs',family:'natural',sample:'pellet',hairOnly:true,weights:[14,.12,.03],sizeBias:.9,minWeights:{carp:2.3},maxHook:8,speed:.88},
 boilie10:{name:'Mini boilies 10 mm',detail:'Malá potápivá kulička na přívěsu',family:'boilie',sample:'boilie',hairOnly:true,weights:[7,.8,.6],sizeBias:1.1,maxHook:12,speed:1.08},
 popup10:{name:'Pop-up 10 mm · Nikl Scopex & Squid',brand:'Nikl',source:'https://www.nikl.cz/nikl-plovouci-boilies-scopex-squid_z39299/',detail:'Plovoucí kulička na vyváženém přívěsu',family:'balanced',sample:'boilie',hairOnly:true,weights:[10,.4,.2],sizeBias:1,minWeights:{carp:1.8},maxHook:10},
 popup14:{name:'Pop-up 14 mm · Nikl Scopex & Squid',brand:'Nikl',source:'https://www.nikl.cz/nikl-plovouci-boilies-scopex-squid_z39299/',detail:'Větší plovoucí kulička nad dnem',family:'balanced',sample:'boilie',hairOnly:true,weights:[16,.08,.03],sizeBias:.85,minWeights:{carp:2.8},maxHook:8,speed:.94},
 wafter6:{name:'Wafter 6 mm · Sonubaits Banoffee',brand:'Sonubaits',source:'https://www.sonubaits.com/es/products/hookbaits/sp-10353',detail:'Jemně vyvážená nástraha na přívěsu',family:'balanced',sample:'pellet',hairOnly:true,weights:[4,1.4,2],sizeBias:1.5,minHook:10,maxHook:14,speed:1.16},
 wafter8:{name:'Wafter 8 mm · Sonubaits Krill & Squid',brand:'Sonubaits',source:'https://www.sonubaits.com/es/products/hookbaits/sp-10353',detail:'Vyvážený soudek pro method feeder',family:'balanced',sample:'pellet',hairOnly:true,weights:[7,1.1,1.1],sizeBias:1.2,maxHook:12,speed:1.12},
 wafter10:{name:'Wafter 10 mm · Sonubaits Pineapple & Coconut',brand:'Sonubaits',source:'https://www.sonubaits.com/es/products/hookbaits/sp-10353',detail:'Větší vyvážený soudek na přívěsu',family:'balanced',sample:'pellet',hairOnly:true,weights:[10,.4,.4],sizeBias:1,minWeights:{carp:1.7},maxHook:10,speed:1.04},
 halibut14:{name:'Halibut peleta 14 mm',detail:'Větší masová peleta na přívěsu',family:'pellet',sample:'pellet',hairOnly:true,weights:[12,.35,.1],sizeBias:.9,minWeights:{carp:2.5},maxHook:8,speed:.92},
 softPellet6:{name:'Měkká peleta 6 mm',detail:'Měkká peleta přímo na háček',family:'pellet',sample:'pellet',weights:[3,1.6,2],sizeBias:1.5,maxHook:14,speed:1.1},
});
for(const [id,b] of Object.entries(BAITS)){
 b.family||=id.startsWith('boilie')?'boilie':id==='pellet'?'pellet':'natural';b.sample||=id;
 if(['boilie','boilie20','pellet'].includes(id))b.hairOnly=true;
 if(id==='boilie')b.maxHook=10;if(id==='boilie20')b.maxHook=8;
 for(const [rigId,r] of Object.entries(RIGS))if(!r.baits.includes(id)&&((b.hairOnly&&r.hair)||(!b.hairOnly&&!r.hair)))r.baits.push(id);
}
Object.assign(FEEDS,{
 hemp:{name:'Vařené konopí',detail:'Drobný partikl pro lína a cejna',family:'particle',feederSafe:false,weights:[.9,1.9,1.4],duration:360},
 wheatFeed:{name:'Vařená pšenice · krmení',detail:'Drobná zrna do krmného místa',family:'particle',feederSafe:false,weights:[.8,1.3,1.9],duration:300},
 breadCrumb:{name:'Strouhanka a pečivo',detail:'Lehký zákal s rychlým rozpadem',family:'mix',feederSafe:true,weights:[1,1.1,2.2],duration:140},
 methodMix:{name:'Method mix · Mivardi Rapid Champion',brand:'Mivardi',source:'https://www.mivardi.cz/method-mix-rapid-champion',detail:'Hrubší směs s drceným boilies a peletami',family:'mix',feederSafe:true,weights:[2.1,.9,.7],duration:360,sizeBoost:.35},
 fishmeal:{name:'Rybí moučka a pelety',detail:'Masová směs pro krmítko a zakrmení',family:'mix',feederSafe:true,weights:[2,1.3,.6],duration:320,sizeBoost:.3},
 sweetMix:{name:'Sladká kukuřičná směs',detail:'Sladká směs pro kapra a lína',family:'mix',feederSafe:true,weights:[1.7,1.6,.8],duration:250,sizeBoost:.15},
 crushedTiger:{name:'Drcený tygří ořech · Mivardi',brand:'Mivardi',source:'https://www.mivardi.cz/tygri-orech-drceny-1kg',detail:'Hrubší složka místa pro větší kapry',family:'mix',feederSafe:true,weights:[2.5,.5,.3],duration:480,sizeBoost:.45},
 boilieCrumb:{name:'Drcené boilies',detail:'Hrubé kousky pro dlouhodobější krmné místo',family:'mix',feederSafe:true,weights:[2.3,.5,.3],duration:480,sizeBoost:.5},
});
FEEDS.grain.feederSafe=false;FEEDS.grain.family='particle';
for(const [id,f] of Object.entries(FEEDS)){if(id!=='none'){f.family||=id==='micro'?'pellet':'mix';f.duration||=240;f.feederSafe??=true;}}
export const BAIT_FAMILIES={all:'Vše',natural:'Přírodní',boilie:'Potápivé boilies',balanced:'Pop-up a wafters',pellet:'Pelety'};
export function feedAllowed(loadout,id){return Object.hasOwn(FEEDS,id)&&(!RIGS[loadout.rig]?.feeder||FEEDS[id].feederSafe!==false);}
export function createFeedStocks(){return Object.fromEntries(Object.keys(FEEDS).filter(id=>id!=='none').map(id=>[id,1000]));}
export const DEFAULT_LOADOUT=Object.freeze({method:'ledger',indicator:'bobbin',rod:'carp',rig:'running',line:.255,hook:8,leader:40,weight:40,bait:'corn',feed:'none',feedPortion:150,depth:2});
export function methodPreset(method,current=DEFAULT_LOADOUT){
 const m=METHODS[method];if(!m)throw new Error('Neznámý způsob lovu.');
 const rig=m.rigs[0];
 return {...DEFAULT_LOADOUT,...current,method,rod:m.rods[0],rig,weight:m.weights[1],leader:method==='feeder'?20:40,line:method==='float'?.205:.255,feed:method==='feeder'?'groundbait':current.feed,bait:RIGS[rig].baits.includes(current.bait)?current.bait:'corn'};
}
export function validateLoadout(value){
 if(!value||typeof value!=='object')return ['Chybí sestava.'];
 const v=value,m=METHODS[v.method],errors=[];if(!m)return ['Vyber způsob lovu.'];
 if(v.indicator!==undefined&&!Object.hasOwn(INDICATORS,v.indicator))errors.push('Vyber signalizaci záběru.');
 if(!m.rods.includes(v.rod))errors.push('Tento prut nepatří ke zvolené technice.');
 if(!m.rigs.includes(v.rig))errors.push('Montáž neodpovídá technice.');
 if(![.16,.20,.25,.30,.35,...LINE_DIAMETERS].includes(v.line))errors.push('Vyber průměr vlasce.');
 if(![6,8,10,12,14].includes(v.hook))errors.push('Vyber velikost háčku.');
 if(![10,20,40,60].includes(v.leader))errors.push('Vyber délku návazce.');
 if(!m.weights.includes(v.weight))errors.push('Zátěž neodpovídá technice.');
 if(!RIGS[v.rig]?.baits.includes(v.bait))errors.push('Nástraha neodpovídá montáži.');
 if(v.rig==='method'&&v.leader>20)errors.push('Method montáž potřebuje krátký návazec 10 nebo 20 cm.');
 const bait=BAITS[v.bait];if(bait?.maxHook&&v.hook>bait.maxHook)errors.push(`Pro tuto nástrahu zvol větší háček (č. ${bait.maxHook} nebo nižší).`);if(bait?.minHook&&v.hook<bait.minHook)errors.push(`Pro jemnou nástrahu zvol menší háček (č. ${bait.minHook} nebo vyšší).`);
 if(!Object.hasOwn(FEEDS,v.feed))errors.push('Vyber krmení.');
 if(Object.hasOwn(FEEDS,v.feed)&&!feedAllowed(v,v.feed))errors.push('Pro krmítko vyber vnadicí směs nebo mikropelety.');
 if(![50,150,300].includes(v.feedPortion))errors.push('Vyber dávku zakrmení.');
 if(!Number.isFinite(v.depth)||v.depth<.5||v.depth>3||Math.round(v.depth*4)!==v.depth*4)errors.push('Hloubka musí být 0,50–3,00 m po 25 cm.');
 return errors;
}
export function cleanLoadout(value){const result={};for(const key of Object.keys(DEFAULT_LOADOUT))result[key]=value[key]??DEFAULT_LOADOUT[key];return result;}
export function feedInfluence(loadout,spot,time,distance,angle=0){
 if(!spot||loadout.feed==='none'||spot.type!==loadout.feed)return 0;
 const age=Math.max(0,time-spot.time),distanceMatch=Math.exp(-Math.pow((distance-spot.distance)/7,2)),angleMatch=Math.exp(-Math.pow((angle-spot.angle)/.18,2));
 return Math.max(0,1-age/(FEEDS[loadout.feed].duration||240))*distanceMatch*angleMatch*Math.min(1,spot.grams/250);
}
export function speciesWeights(loadout,feedBonus=0){
 const bait=BAITS[loadout.bait],feed=FEEDS[loadout.feed];
 return bait.weights.map((w,i)=>w*(1+(feed.weights[i]-1)*feedBonus)*(loadout.method==='float'?[.7,1.1,1.3][i]:1)*(loadout.hook>=12&&i===0?.65:1));
}
export function biteDelay(loadout,random,feedBonus=0){
 const depthFit=loadout.method==='float'?1+Math.abs(loadout.depth-2)*.45:1;
 return (7+random*12)*depthFit/((1+feedBonus*.7)*(BAITS[loadout.bait].speed||1));
}
export function setupSummary(v){return `${METHODS[v.method].name} · ${RIGS[v.rig].name} · ${BAITS[v.bait].name}${v.method==='ledger'?' · '+indicatorName(v):''}`;}

export function chooseBait(value,bait){
 const result={...value,bait},method=METHODS[value.method];if(!Object.hasOwn(BAITS,bait)||!method)return result;
 if(!RIGS[result.rig]?.baits.includes(bait)){
  const choices=method.rigs.filter(id=>RIGS[id].baits.includes(bait));
  result.rig=choices.find(id=>Boolean(RIGS[id].feeder)===Boolean(RIGS[value.rig]?.feeder))||choices[0]||value.rig;
 }
 if(!feedAllowed(result,result.feed))result.feed='groundbait';if(result.rig==='method')result.leader=Math.min(20,result.leader);
 if(BAITS[bait].maxHook)result.hook=Math.min(result.hook,BAITS[bait].maxHook);if(BAITS[bait].minHook)result.hook=Math.max(result.hook,BAITS[bait].minHook);
 return result;
}
export function catchWeight(species,loadout,random,feedBonus=0){
 const bait=BAITS[loadout.bait],minimum=Math.min(species.max,bait.minWeights?.[species.id]||species.min);
 return Math.round((minimum+Math.pow(Math.max(0,Math.min(1,random)),(bait.sizeBias||1)/(1+feedBonus*(FEEDS[loadout.feed].sizeBoost||0)))*(species.max-minimum))*100)/100;
}
export function baitChances(loadout,feedBonus=0){const weights=speciesWeights(loadout,feedBonus),total=weights.reduce((a,b)=>a+b,0);return weights.map(w=>w/total);}

export const LINE_DIAMETERS=[.165,.185,.205,.225,.255,.285,.305];
export const LINE_PRODUCT={brand:'Mivardi',model:'Carp & Feeder',length:200,source:'https://www.mivardi.com/carp-a-feeder-200-m'};
export function lineName(value){return LINE_DIAMETERS.includes(value)?`Mivardi Carp & Feeder · ${value.toFixed(3)} mm`:`Vlastní monofil · ${value.toFixed(2)} mm`;}
