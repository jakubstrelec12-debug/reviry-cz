import {MISSIONS,MissionRun} from './missions.js?v=0.22.0';
import {normalizeAim} from './watercraft.js?v=0.22.0';
import {DEFAULT_TRIP,validTrip} from './trip.js?v=0.22.0';
import {VENUES} from './venues.js?v=0.22.0';
import {Fishing} from './fishing.js?v=0.22.0';
import {cleanLoadout,validateLoadout,createFeedStocks} from './tackle.js?v=0.22.0';
const LOCKED=['casting','flying','held','fight','landed'];
export class FishingSession{
 constructor(random=Math.random){
  this.rods=[new Fishing(random),new Fishing(random)];this.activeIndex=0;this.secondEnabled=false;this.onChange=()=>{};this.onEvent=()=>{};this._paused=false;this._journal=[];
  const stocks=createFeedStocks(),spots=[];
  this.rods.forEach((rod,index)=>{rod.feedStocks=stocks;rod.feedSpots=spots;rod.journal=this._journal;rod.onEvent=(event,data)=>{
   if(event==='landed'){if(this.mission){data.missionId=this.mission.definition.id;this.mission.record(data);}data.rodNumber=index+1;this.journal=rod.journal;}
   this.onEvent(event,{...data,rodIndex:index});this.onChange(this);
  };});
 }
 get missions(){return MISSIONS;}
 startMission(id){
  const d=MISSIONS.find(m=>m.id===id);if(!d||this.mission||this.enabledRods.some(r=>!['ready','escaped'].includes(r.phase)))return false;
  this.freeSnapshot={setup:this.exportSetup(),stocks:{...this.feedStocks},times:this.rods.map(r=>r.time),spots:structuredClone(this.feedSpots)};
  this.restoreSetup({venueId:d.venueId,trip:d.trip,loadouts:[d.loadout]});
  this.rods.forEach(r=>{r.phase='ready';r.fish=null;r.result=null;r.feedSpot=null;r.feedSpots.length=0;r.netDeployed=false;r.netProgress=0;r.reeling=false;r.lifting=false;});
  for(const key of Object.keys(this.feedStocks))this.feedStocks[key]=key===d.loadout.feed?d.grams:0;
  this.mission=new MissionRun(d);return true;
 }
 endMission(){if(!this.mission)return false;const snapshot=this.freeSnapshot;this.mission=null;this.freeSnapshot=null;this.restoreSetup(snapshot.setup);this.rods.forEach(r=>{r.time=snapshot.times[this.rods.indexOf(r)];r.phase='ready';r.fish=null;r.result=null;r.feedSpot=null;r.netDeployed=false;r.netProgress=0;r.reeling=false;r.lifting=false;r.steer=0;});Object.assign(this.feedStocks,snapshot.stocks);this.feedSpots.splice(0,this.feedSpots.length,...snapshot.spots);return true;}
 get trip(){return this.rods[0].trip;}
 setTrip(value){if(this.mission)return false;if(!validTrip(value)||this.enabledRods.some(r=>!['ready','escaped'].includes(r.phase)))return false;this.rods.forEach(r=>{r.trip={date:value.date,time:value.time};r.feedSpot=null;r.feedSpots.length=0;});this.onEvent('trip-selected',{trip:{...this.trip}});return true;}
 get venueId(){return this.rods[0].venueId;}
 setVenue(id){if(this.mission)return false;if(!Object.hasOwn(VENUES,id)||this.enabledRods.some(r=>!['ready','escaped'].includes(r.phase)))return false;this.rods.forEach(r=>{r.venueId=id;r.feedSpot=null;r.feedSpots.length=0;r.fish=null;r.result=null;r.distance=0;r.castReport=null;r.netDeployed=false;r.netProgress=0;r.steer=0;r.phase='ready';});this.onEvent('venue-selected',{venueId:id});return true;}
 get active(){return this.rods[this.activeIndex];}
 get enabledRods(){return this.rods.slice(0,this.secondEnabled?2:1);}
 get paused(){return this._paused;}set paused(value){this._paused=value;this.rods.forEach(r=>r.paused=value);}
 get journal(){return this._journal;}set journal(value){this._journal=value;this.rods.forEach(r=>r.journal=value);}
 select(index){if(index===this.activeIndex)return true;if(!Number.isInteger(index)||index<0||index>=this.enabledRods.length||LOCKED.includes(this.phase))return false;this.reeling=false;this.lifting=false;this.steer=0;this.activeIndex=index;this.onEvent('rod-selected',{rodIndex:index});return true;}
 enableSecond(){if(this.mission)return false;if(this.secondEnabled)return true;if(this.loadout.method==='float'||LOCKED.includes(this.phase))return false;this.rods[1].loadout={...this.loadout};this.secondEnabled=true;this.select(1);this.onEvent('rod-added',{rodIndex:1});return true;}
 foldSecond(){if(this.mission)return false;if(!this.secondEnabled)return true;if(LOCKED.includes(this.rods[1].phase)||LOCKED.includes(this.active.phase))return false;this.rods[1].retrieve();this.rods[1].phase='ready';this.activeIndex=0;this.secondEnabled=false;this.onEvent('rod-folded',{rodIndex:1});return true;}
 applyLoadouts(changes,{addSecond=false}={}){
  if(this.mission)return false;
  if(!Array.isArray(changes)||new Set(changes.map(c=>c.index)).size!==changes.length)return false;
  const dual=this.secondEnabled||addSecond,limit=dual?2:1;
  if(addSecond&&['casting','flying','held','fight','landed'].includes(this.phase))return false;
  if(changes.some(c=>!Number.isInteger(c.index)||c.index<0||c.index>=limit||validateLoadout(c.loadout).length||(dual&&c.loadout.method==='float')||!['ready','escaped','waiting','bite','held'].includes(this.rods[c.index].phase)))return false;
  if(dual&&this.rods.slice(0,2).some((r,i)=>(changes.find(c=>c.index===i)?.loadout||r.loadout).method==='float'))return false;
  for(const c of changes){const rod=this.rods[c.index];if(['waiting','bite','held'].includes(rod.phase))rod.retrieve();rod.setLoadout(c.loadout);}
  if(addSecond&&!this.secondEnabled){this.secondEnabled=true;this.onEvent('rod-added',{rodIndex:1});}return true;
 }
 setLoadout(value){if(this.mission)return false;if(this.secondEnabled&&value.method==='float')return false;return this.active.setLoadout(value);}
 advance(elapsed){if(!Number.isFinite(elapsed)||elapsed<=0)return;let remaining=Math.min(.25,elapsed);while(remaining>1e-8){const dt=Math.min(.05,remaining);this.tick(dt);remaining-=dt;}}
 tick(dt){if(this.paused||this.mission?.finished||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.05,dt);this.mission?.advance(dt);if(this.mission?.finished)return;for(const rod of this.enabledRods){rod.tick(dt);if(this.mission?.finished)break;}}
 exportSetup(){return {aims:this.enabledRods.map(r=>({distance:r.aimDistance,angle:r.aimAngle})),trip:{...this.trip},venueId:this.venueId,secondEnabled:this.secondEnabled,activeIndex:this.activeIndex,loadouts:this.enabledRods.map(r=>({...r.loadout}))};}
 restoreSetup(value){if(this.mission)return false;if(!value||!Array.isArray(value.loadouts))return false;if(value.trip!==undefined&&!validTrip(value.trip))return false;const list=value.loadouts;if(value.aims!==undefined&&(!Array.isArray(value.aims)||value.aims.length!==list.length||value.aims.some(a=>!a||!Number.isFinite(a.distance)||!Number.isFinite(a.angle))))return false;if(!list.length||list.length>2||list.some(v=>validateLoadout(v).length)||list.length===2&&list.some(v=>v.method==='float'))return false;list.forEach((v,i)=>{this.rods[i].loadout=cleanLoadout(v);const aim=normalizeAim(v,value.aims?.[i]?.distance??31,value.aims?.[i]?.angle??0);this.rods[i].aimDistance=aim.distance;this.rods[i].aimAngle=aim.angle;});this.rods.forEach(r=>r.trip={...(value.trip||DEFAULT_TRIP)});this.rods.forEach(r=>r.venueId=Object.hasOwn(VENUES,value.venueId)?value.venueId:'vajgar');this.secondEnabled=list.length===2;this.activeIndex=value.activeIndex===1&&this.secondEnabled?1:0;return true;}
}
for(const key of ['recommendedPower','aimDistance','aimAngle','castReport','area','encounterWeights','feedSpots','netDeployed','netAngle','netProgress','steer','fightAim','bankSurge','lineOutRate','lineInRate','phase','time','elapsed','castPower','distance','throwDistance','castAngle','loadout','feedStocks','feedSpot','feedBonus','drag','tension','stamina','reeling','lifting','biteStyle','biteProfile','probe','run','fishBearing','biteWindow','slackToTake','hookQuality','lastStrikeAt','lastStrike','biteIn','biteElapsed','fish','result'])Object.defineProperty(FishingSession.prototype,key,{get(){return this.active[key];},set(value){this.active[key]=value;}});
for(const name of ['setAim','startCast','releaseCast','grab','strike','net','lose','retrieve','feed','emit'])FishingSession.prototype[name]=function(...args){return this.active[name](...args);};
