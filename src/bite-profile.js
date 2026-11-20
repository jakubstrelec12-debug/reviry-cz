import {RIGS} from './tackle.js?v=0.24.0';
// Gameplay profiles for readable differences between tackle, not a biological rule.
const clamp=v=>Math.max(0,Math.min(1,v));
export function directCorn(loadout){return loadout.method==='ledger'&&loadout.bait==='corn'&&!RIGS[loadout.rig]?.feeder;}
export function allowsProbes(loadout){return !directCorn(loadout);}
export function makeBiteProfile(loadout,random=Math.random){
 const choice=clamp(random()),variation=clamp(random()),direct=directCorn(loadout)||choice<.22;
 return {kind:direct?'direct':choice<.65?'gradual':'cautious',tempo:.75+variation*.65,amplitude:.8+variation*.4,windowScale:.85+variation*.3,pauseAt:!directCorn(loadout)&&choice>.5?1+variation:Infinity,pauseFor:!directCorn(loadout)&&choice>.5?.35+variation*.65:0};
}
