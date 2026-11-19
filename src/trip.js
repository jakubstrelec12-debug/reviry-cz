// Deliberately simplified game ecology, not measured activity or a fishing forecast.
export const DEFAULT_TRIP=Object.freeze({date:'2026-06-15',time:'07:00'});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function validTrip(v){
 if(!v||typeof v.date!=='string'||typeof v.time!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v.date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(v.time))return false;
 const d=new Date(v.date+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v.date&&Number(v.date.slice(0,4))>=1900&&Number(v.date.slice(0,4))<=2100;
}
export function tripConditions(value=DEFAULT_TRIP){
 const trip=validTrip(value)?value:DEFAULT_TRIP,d=new Date(trip.date+'T12:00:00Z'),day=(d-Date.UTC(d.getUTCFullYear(),0,0))/86400000;
 // Seasonal daylight approximation for southern Bohemia; no live weather input.
 const summer=(1+Math.cos((day-172)/365.25*Math.PI*2))/2,sunrise=8-3*summer,sunset=16+5*summer,hour=Number(trip.time.slice(0,2))+Number(trip.time.slice(3))/60;
 const light=clamp(Math.min((hour-sunrise+1)/2,(sunset+1-hour)/2),0,1),morning=Math.exp(-Math.pow((hour-(sunrise+1))/2,2)),evening=Math.exp(-Math.pow((hour-(sunset-1))/2,2)),edge=Math.max(morning,evening),night=light<.15;
 return {trip,summer,light,edge,morning,evening,night,label:night?'Noc':morning>.3?'Ráno':evening>.3?'Večer':'Den',season:['Zima','Jaro','Léto','Podzim'][Math.floor((d.getUTCMonth()+1)%12/3)],warmth:clamp(edge*.18,0,.18),darkness:(1-light)*.65};
}
function rawActivity(id,c){
 const thermal={carp:.28+c.summer*.72,tench:.18+c.summer*.82,bream:.50+c.summer*.50,amur:.12+c.summer*.88,crucian:.35+c.summer*.65,roach:.72+c.summer*.28}[id]??1;
 const diurnal=id==='tench'?.65+c.edge*.65+(c.night?.12:0):id==='amur'?.80+c.light*.3:id==='roach'?.78+c.light*.28:.78+c.edge*.42;
 return thermal*diurnal;
}
const baseline=tripConditions(DEFAULT_TRIP);
export function speciesActivity(id,trip){if(!trip)return 1;return clamp(rawActivity(id,tripConditions(trip))/rawActivity(id,baseline),.12,1.8);}
export function activityFor(ids,weights,trip){const sum=weights.reduce((a,b)=>a+b,0);return sum?weights.reduce((s,w,i)=>s+w*speciesActivity(ids[i],trip),0)/sum:1;}
export function tripSummary(trip=DEFAULT_TRIP){const c=tripConditions(trip),[y,m,d]=c.trip.date.split('-');return `${Number(d)}. ${Number(m)}. ${y} · ${c.trip.time} · ${c.label.toLowerCase()} · ${c.season.toLowerCase()}`;}
