// Fictional fishing zones, not surveyed bathymetry of the photographed venue.
import {METHODS,RODS} from './tackle.js?v=0.25.0';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const WATER_SPOTS=[
 {id:'margin',name:'Pobřežní pás',distance:17,angle:-.28,activity:1.08,weights:{tench:1.65,crucian:1.5,roach:1.35,carp:.85,bream:.8,amur:1.15}},
 {id:'open',name:'Otevřená voda',distance:31,angle:0,activity:1,weights:{carp:1.15,bream:1.35,tench:.75}},
 {id:'edge',name:'Vzdálená hrana',distance:47,angle:.28,activity:.9,weights:{carp:1.5,amur:1.3,tench:.65,crucian:.7}}
];
export function castRange(loadout){const [min,span]=METHODS[loadout.method].cast;return {min,max:min+span*RODS[loadout.rod].length/3.6};}
export function normalizeAim(loadout,distance,angle){const range=castRange(loadout);return {distance:clamp(Number.isFinite(distance)?distance:31,range.min,range.max),angle:clamp(Number.isFinite(angle)?angle:0,-.6,.6)};}
export function aimPower(loadout,distance){const r=castRange(loadout);return clamp((distance-r.min)/(r.max-r.min),0,1);}
export function waterSpot(distance,angle=0){return WATER_SPOTS.reduce((best,spot)=>{const score=s=>Math.pow((distance-s.distance)/14,2)+Math.pow((angle-s.angle)/.5,2);return score(spot)<score(best)?spot:best;},WATER_SPOTS[0]);}
export function spotWeights(ids,weights,distance,angle){const spot=waterSpot(distance,angle);return weights.map((value,i)=>value*(spot.weights[ids[i]]||1));}
export function castLanding(loadout,power,angle,time,random){const range=castRange(loadout),p=clamp(power,0,1),spread=.5+p*p*3;return {distance:clamp(range.min+p*(range.max-range.min)+(random()-.5)*spread,range.min,range.max),angle:clamp(angle+(random()-.5)*(.012+p*p*.055)+Math.sin(time*.17)*p*p*.012,-.65,.65)};}
export function horizontalGap(a,b){return Math.hypot(a.distance-b.distance,(a.angle-b.angle)*(a.distance+b.distance)/2);}
