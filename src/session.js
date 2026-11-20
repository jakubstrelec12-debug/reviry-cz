import {DEFAULT_TRIP,validTrip} from './trip.js?v=0.17.0';
import {VENUES} from './venues.js?v=0.17.0';
import {Fishing} from './fishing.js?v=0.17.0';
import {cleanLoadout,validateLoadout,createFeedStocks} from './tackle.js?v=0.17.0';
const LOCKED=['casting','flying','held','fight','landed'];
export class FishingSession{
 constructor(random=Math.random){
  this.rods=[new Fishing(random),new Fishing(random)];this.activeIndex=0;this.secondEnabled=false;this.onChange=()=>{};this.onEvent=()=>{};this._paused=false;this._journal=[];
  const stocks=createFeedStocks();
  this.rods.forEach((rod,index)=>{rod.feedStocks=stocks;rod.journal=this._journal;rod.onEvent=(event,data)=>{
   if(event==='landed'){data.rodNumber=index+1;this.journal=rod.journal;}
   this.onEvent(event,{...data,rodIndex:index});this.onChange(this);
  };});
 }
 get trip(){return this.rods[0].trip;}
 setTrip(value){if(!validTrip(value)||this.enabledRods.some(r=>!['ready','escaped'].includes(r.phase)))return false;this.rods.forEach(r=>{r.trip={date:value.date,time:value.time};r.feedSpot=null;});this.onEvent('trip-selected',{trip:{...this.trip}});return true;}
 get venueId(){return this.rods[0].venueId;}
 setVenue(id){if(!Object.hasOwn(VENUES,id)||this.enabledRods.some(r=>!['ready','escaped'].includes(r.phase)))return false;this.rods.forEach(r=>{r.venueId=id;r.feedSpot=null;r.fish=null;r.result=null;r.distance=0;r.phase='ready';});this.onEvent('venue-selected',{venueId:id});return true;}
 get active(){return this.rods[this.activeIndex];}
 get enabledRods(){return this.rods.slice(0,this.secondEnabled?2:1);}
 get paused(){return this._paused;}set paused(value){this._paused=value;this.rods.forEach(r=>r.paused=value);}
 get journal(){return this._journal;}set journal(value){this._journal=value;this.rods.forEach(r=>r.journal=value);}
 select(index){if(index===this.activeIndex)return true;if(!Number.isInteger(index)||index<0||index>=this.enabledRods.length||LOCKED.includes(this.phase))return false;this.reeling=false;this.lifting=false;this.activeIndex=index;this.onEvent('rod-selected',{rodIndex:index});return true;}
 enableSecond(){if(this.secondEnabled)return true;if(this.loadout.method==='float'||LOCKED.includes(this.phase))return false;this.rods[1].loadout={...this.loadout};this.secondEnabled=true;this.select(1);this.onEvent('rod-added',{rodIndex:1});return true;}
 foldSecond(){if(!this.secondEnabled)return true;if(LOCKED.includes(this.rods[1].phase)||LOCKED.includes(this.active.phase))return false;this.rods[1].retrieve();this.rods[1].phase='ready';this.activeIndex=0;this.secondEnabled=false;this.onEvent('rod-folded',{rodIndex:1});return true;}
 applyLoadouts(changes,{addSecond=false}={}){
  if(!Array.isArray(changes)||new Set(changes.map(c=>c.index)).size!==changes.length)return false;
  const dual=this.secondEnabled||addSecond,limit=dual?2:1;
  if(addSecond&&['casting','flying','held','fight','landed'].includes(this.phase))return false;
  if(changes.some(c=>!Number.isInteger(c.index)||c.index<0||c.index>=limit||validateLoadout(c.loadout).length||(dual&&c.loadout.method==='float')||!['ready','escaped','waiting','bite','held'].includes(this.rods[c.index].phase)))return false;
  if(dual&&this.rods.slice(0,2).some((r,i)=>(changes.find(c=>c.index===i)?.loadout||r.loadout).method==='float'))return false;
  for(const c of changes){const rod=this.rods[c.index];if(['waiting','bite','held'].includes(rod.phase))rod.retrieve();rod.setLoadout(c.loadout);}
  if(addSecond&&!this.secondEnabled){this.secondEnabled=true;this.onEvent('rod-added',{rodIndex:1});}return true;
 }
 setLoadout(value){if(this.secondEnabled&&value.method==='float')return false;return this.active.setLoadout(value);}
 advance(elapsed){for(const rod of this.enabledRods)rod.advance(elapsed);}
 tick(dt){for(const rod of this.enabledRods)rod.tick(dt);}
 exportSetup(){return {trip:{...this.trip},venueId:this.venueId,secondEnabled:this.secondEnabled,activeIndex:this.activeIndex,loadouts:this.enabledRods.map(r=>({...r.loadout}))};}
 restoreSetup(value){if(!value||!Array.isArray(value.loadouts))return false;if(value.trip!==undefined&&!validTrip(value.trip))return false;const list=value.loadouts;if(!list.length||list.length>2||list.some(v=>validateLoadout(v).length)||list.length===2&&list.some(v=>v.method==='float'))return false;list.forEach((v,i)=>this.rods[i].loadout=cleanLoadout(v));this.rods.forEach(r=>r.trip={...(value.trip||DEFAULT_TRIP)});this.rods.forEach(r=>r.venueId=Object.hasOwn(VENUES,value.venueId)?value.venueId:'vajgar');this.secondEnabled=list.length===2;this.activeIndex=value.activeIndex===1&&this.secondEnabled?1:0;return true;}
}
for(const key of ['lineOutRate','lineInRate','phase','time','elapsed','castPower','distance','throwDistance','castAngle','loadout','feedStocks','feedSpot','feedBonus','drag','tension','stamina','reeling','lifting','biteStyle','probe','run','fishBearing','biteWindow','slackToTake','hookQuality','lastStrikeAt','lastStrike','biteIn','biteElapsed','fish','result'])Object.defineProperty(FishingSession.prototype,key,{get(){return this.active[key];},set(value){this.active[key]=value;}});
for(const name of ['startCast','releaseCast','grab','strike','net','lose','retrieve','feed','emit'])FishingSession.prototype[name]=function(...args){return this.active[name](...args);};
