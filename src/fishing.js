import {normalizeAim,aimPower,castLanding,waterSpot,spotWeights,horizontalGap} from './watercraft.js?v=0.25.1';
import {allowsProbes,makeBiteProfile} from './bite-profile.js?v=0.25.1';
import {nextRun,runForce} from './encounter.js?v=0.25.1';
import {DEFAULT_TRIP,activityFor} from './trip.js?v=0.25.1';
import {getVenue,EXTRA_SPECIES,venueWeights} from './venues.js?v=0.25.1';
import {strikeWindow,assessStrike,strikeReason} from './strike-timing.js?v=0.25.1';
import {DEFAULT_LOADOUT, METHODS, RODS, REELS, RIGS, catchWeight, validateLoadout, cleanLoadout, feedInfluence, speciesWeights, biteDelay,createFeedStocks} from './tackle.js?v=0.25.1';
export const SPECIES = [
  {id:'carp',name:'Kapr obecný', min:1.4, max:7.8, power:0.85, color:0xb79b5d},
  {id:'tench',name:'Lín obecný', min:0.45, max:2.3, power:0.6, color:0x6d7841},
  {id:'bream',name:'Cejn velký', min:0.5, max:2.8, power:0.5, color:0xa9b5a1},
];
export class Fishing {
  constructor(random = Math.random) {
    this.trip={...DEFAULT_TRIP};this.venueId='vajgar';this.loadout={...DEFAULT_LOADOUT};this.feedSpot=null;this.feedStocks=createFeedStocks();this.aimDistance=31;this.aimAngle=0;this.castReport=null;this.feedSpots=[];this.netDeployed=false;this.netAngle=0;this.netProgress=0;this.steer=0;this.fightAim=0;this.bankSurge=false;this.castAngle=0;this.random=random; this.phase='ready'; this.time=0;this.castPower=0;this.distance=0;
    this.drag=0.48;this.tension=0.25;this.stamina=1;this.reeling=false;this.lifting=false;
    this.lineOutRate=0;this.lineInRate=0;this.elapsed=0;this.biteIn=0;this.biteElapsed=0;this.fish=null;this.result=null;
    this.probe=null;this.nextProbeAt=Infinity;this.run=null;this.fishBearing=0;this.biteWindow=null;this.biteProfile=null;this.slackToTake=0;this.hookQuality=1;this.lastStrike=null;this.lastStrikeAt=-Infinity;this.journal=[]; this.onChange=()=>{};this.onEvent=()=>{};this.paused=false;
  }
  emit(name, data={}) {this.onEvent(name,data);this.onChange(this);}
  setLoadout(value){
    if(!['ready','escaped'].includes(this.phase))return false;
    if(validateLoadout(value).length)return false;
    this.loadout=cleanLoadout(value);const aim=normalizeAim(this.loadout,this.aimDistance,this.aimAngle);this.aimDistance=aim.distance;this.aimAngle=aim.angle;this.emit('loadout');return true;
  }
  setAim(distance,angle){if(this.paused||!['ready','escaped','waiting'].includes(this.phase))return false;const aim=normalizeAim(this.loadout,distance,angle);this.aimDistance=aim.distance;this.aimAngle=aim.angle;this.emit('aim');return true;}
  get recommendedPower(){return aimPower(this.loadout,this.aimDistance);}
  get area(){return waterSpot(this.distance||this.aimDistance,this.distance?this.castAngle:this.aimAngle);}
  get encounterWeights(){const ids=getVenue(this.venueId).playable,spot=this.attractingSpot,loadout=spot?{...this.loadout,feed:spot.type}:this.loadout;return spotWeights(ids,venueWeights(loadout,this.venueId,this.feedBonus,this.trip),this.distance,this.castAngle);}
  get attractingSpot(){const spots=this.feedSpots.length?this.feedSpots:[this.feedSpot];let best=null,value=0;for(const spot of spots){if(!spot)continue;const bonus=feedInfluence({...this.loadout,feed:spot.type},spot,this.time,this.distance,this.castAngle);if(bonus>value){value=bonus;best=spot;}}return best;}
  get feedBonus(){const spot=this.attractingSpot;return spot?feedInfluence({...this.loadout,feed:spot.type},spot,this.time,this.distance,this.castAngle):0;}
  depositFeed(grams,target={distance:this.distance,angle:this.castAngle}){
    const type=this.loadout.feed;if(type==='none'||!Number.isFinite(this.feedStocks[type])||this.feedStocks[type]<grams)return false;
    this.feedStocks[type]-=grams;
    const previous=this.feedSpots.find(p=>p.type===type&&horizontalGap(p,target)<3.5),now={type,time:this.time,distance:target.distance,angle:target.angle,grams:Math.min(500,grams+(previous?previous.grams*Math.max(0,1-(this.time-previous.time)/240):0))};
    if(previous)Object.assign(previous,now);else this.feedSpots.push(now);if(this.feedSpots.length>16)this.feedSpots.splice(0,this.feedSpots.length-16);this.feedSpot=previous||now;return true;
  }
  feed(){
    if(this.phase!=='waiting')return false;const target={distance:this.aimDistance+(this.random()-.5)*2,angle:this.aimAngle+(this.random()-.5)*.035};if(!this.depositFeed(this.loadout.feedPortion,target))return false;
    this.biteIn=this.elapsed+Math.max(.5,(this.biteIn-this.elapsed)/(1+this.feedBonus*.7));this.emit('feed',{target:{distance:this.feedSpot.distance,angle:this.feedSpot.angle}});return true;
  }
  startCast(){if(!['ready','escaped','landed'].includes(this.phase))return false;
    this.probe=null;this.run=null;this.netDeployed=false;this.netProgress=0;this.steer=0;this.fightAim=0;this.bankSurge=false;this.lineOutRate=0;this.lineInRate=0;this.phase='casting';this.castPower=0;this.result=null;this.fish=null;this.biteWindow=null;this.biteProfile=null;this.biteElapsed=0;this.slackToTake=0;this.hookQuality=1;this.lastStrike=null;this.emit('cast-start');return true;}
  releaseCast(){if(this.phase!=='casting')return false;
    const landing=castLanding(this.loadout,this.castPower,this.aimAngle,this.time,this.random);this.distance=landing.distance;this.castAngle=landing.angle;this.castReport={distance:this.distance,angle:this.castAngle,error:horizontalGap(landing,{distance:this.aimDistance,angle:this.aimAngle})};this.throwDistance=this.distance;this.phase='flying';this.elapsed=0;
    this.reeling=false;this.lifting=false;this.emit('cast');return true;}
  grab(){if(!['bite','waiting'].includes(this.phase)||this.loadout.method==='float')return false;const biting=this.phase==='bite';this.probe=null;this.phase='held';this.elapsed=0;this.slackToTake=biting&&this.biteStyle==='dropback'?.45+Math.min(40,this.distance)*.006:0;this.emit('grab');return true;}
  strike(){if(this.paused||!['waiting','held'].includes(this.phase)&&!(this.loadout.method==='float'&&this.phase==='bite'))return false;
    const result=assessStrike(this);this.lastStrike={...result};this.lastStrikeAt=this.time;
    if(result.outcome!=='hooked'){this.lose(strikeReason(result),{strike:result});return false;}
    this.run=null;this.fishBearing=this.castAngle;this.hookQuality=result.quality;this.phase='fight';this.stamina=1;this.tension=0.38;this.elapsed=0;this.slack=0;this.overload=0;this.reeling=false;
    this.emit('hooked',{strike:result});return true;}
  net(){if(this.paused||this.phase!=='fight'||this.distance>5||this.stamina>.35)return false;this.netDeployed=true;return true;}
  land(){if(this.phase!=='fight')return false;
    this.phase='landed';this.steer=0;this.result={...this.fish,speciesId:this.fish.id,venueId:this.venueId,loadout:{...this.loadout},trip:{...this.trip},spotId:waterSpot(this.throwDistance||this.distance,this.castAngle).id,cast:this.castReport?{...this.castReport}:null,strike:this.lastStrike?{...this.lastStrike}:null,date:new Date().toISOString(),id:Date.now()};
    this.journal.unshift(this.result);this.journal=this.journal.slice(0,100);this.reeling=false;this.lifting=false;
    this.emit('landed',this.result);return true;}
  lose(reason,detail={}){this.phase='escaped';this.reeling=false;this.lifting=false;this.steer=0;this.netDeployed=false;this.netProgress=0;this.result={reason,...detail};this.emit('escaped',{reason,...detail});}
  retrieve(){if(!['waiting','bite','held'].includes(this.phase))return;this.probe=null;this.phase='ready';this.reeling=false;this.lifting=false;this.emit('retrieved');}
  advance(elapsed){
    if(!Number.isFinite(elapsed)||elapsed<=0)return;
    let remaining=Math.min(.25,elapsed);
    while(remaining>1e-8){const step=Math.min(.05,remaining);this.tick(step);remaining-=step;}
  }
  tick(dt){if(this.paused)return;dt=Math.min(Math.max(dt,0),0.05);this.time+=dt;this.elapsed+=dt;
    if(this.phase==='casting')this.castPower=Math.min(1,this.castPower+dt/1.7);
    if(this.phase==='flying'&&this.elapsed>1.1){this.phase='waiting';if(RIGS[this.loadout.rig].feeder)this.depositFeed(20);this.biteIn=biteDelay(this.loadout,this.random(),this.feedBonus)/activityFor(getVenue(this.venueId).playable,this.encounterWeights,this.trip)/this.area.activity;this.elapsed=0;this.probe=null;this.nextProbeAt=allowsProbes(this.loadout)?this.time+3+this.random()*9:Infinity;this.emit('splash');}
    if(this.phase==='waiting'&&allowsProbes(this.loadout)&&this.time>=this.nextProbeAt&&this.elapsed<this.biteIn-3){
      this.probe={at:this.time,duration:2.3,taps:1+Math.floor(this.random()*3),seed:this.random(),power:1.8+this.random()*2.8};this.nextProbeAt=this.time+7+this.random()*22;
    }
    if(this.probe&&this.time-this.probe.at>this.probe.duration)this.probe=null;
    if(this.phase==='waiting'&&this.elapsed>=this.biteIn){
      const pool=getVenue(this.venueId).playable.map(id=>[...SPECIES,...EXTRA_SPECIES].find(s=>s.id===id));const weights=this.encounterWeights;let pick=Math.max(0,Math.min(1-Number.EPSILON,this.random()))*weights.reduce((a,b)=>a+b,0),index=0;while(index<weights.length-1&&pick>=weights[index])pick-=weights[index++];const species=pool[index];
      const weight=catchWeight(species,this.loadout,this.random(),this.feedBonus);
      this.fish={...species,weight,length:Math.round((species.lengthBase||22)+Math.pow(weight,0.44)*(species.lengthFactor||23))};
      this.probe=null;this.biteStyle=this.random()<.32?'dropback':'pull';this.biteProfile=makeBiteProfile(this.loadout,this.random);this.biteWindow=strikeWindow(this.loadout,this.fish,this.biteProfile);this.phase='bite';this.elapsed=0;this.biteElapsed=0;this.emit('bite');
    }
    if(['bite','held'].includes(this.phase)&&this.fish){
      this.biteElapsed=this.phase==='bite'?this.elapsed:this.biteElapsed+dt;
      if(this.phase==='held'&&this.reeling)this.slackToTake=Math.max(0,this.slackToTake-dt);
      const window=this.biteWindow||strikeWindow(this.loadout,this.fish,this.biteProfile);
      if(this.biteElapsed>window.leaveAt)this.lose('Zásek přišel pozdě. Ryba pustila nástrahu.',{strike:{outcome:'missed',age:this.biteElapsed,offset:this.biteElapsed-window.closeAt,quality:0}});
    }
    if(this.phase==='fight'){
      const strength=this.fish.power*(0.7+this.fish.weight/12);
      if(!this.run||this.run.age>=this.run.duration)this.run=nextRun(this.random,this.run);
      this.run.age+=dt;const effort=runForce(this.run),surge=(.34+effort)*(0.28+this.stamina*.72)*strength;
      if(this.distance<6&&!this.bankSurge){this.bankSurge=true;if(this.random()<.6){this.run={mode:'surge',age:0,duration:2.6,power:1.2,direction:(this.random()-.5)*.35};this.stamina=Math.min(1,this.stamina+.12);this.emit('bank-surge');}}
      this.fightAim=Math.max(-.65,Math.min(.65,this.fightAim+this.steer*dt*.28));
      const direction=this.castAngle+this.fightAim+this.run.direction*(this.run.mode==='surge'?1:.35);this.fishBearing+=(direction-this.fishBearing)*dt*.65;
      const previousDistance=this.distance;
      const lineStrength=Math.pow(this.loadout.line/.25,.85);const target=(0.08+this.drag*surge*0.95+(this.reeling?0.16:0)+(this.lifting?0.2:0))/lineStrength;
      this.tension+=(target-this.tension)*Math.min(1,dt*2.4);
      this.distance=Math.max(2.2,this.distance+(surge*(1-this.drag)*2.3-(this.reeling?1.9*(0.35+this.drag)*RODS[this.loadout.rod].power*(REELS[this.loadout.reel||'universal']?.retrieve||1):0)-(this.lifting?0.25:0))*dt);
      this.lineOutRate=dt>0?Math.max(0,(this.distance-previousDistance)/dt):0;this.lineInRate=dt>0?Math.max(0,(previousDistance-this.distance)/dt):0;
      this.stamina=Math.max(0,this.stamina-dt*(.002+this.tension*.008+effort*.006+(this.reeling?.012:0)+(this.lifting?.010:0)));
      this.overload=this.tension>0.94?this.overload+dt:Math.max(0,this.overload-dt*2);
      this.slack=this.tension<0.13?this.slack+dt:0;
      if(this.overload>1.15)this.lose('Vlasec praskl. Při výpadu povol brzdu a přestaň navíjet.');
      else if(this.slack>3+this.hookQuality*2)this.lose('Vlasec zůstal povolený a ryba se vyháčkovala.');
      else if(this.distance>85)this.lose('Ryba vytáhla příliš mnoho vlasce a unikla.');
      if(this.phase==='fight'&&this.netDeployed){const inside=this.distance<=3.3&&this.stamina<=.22&&Math.abs(this.fishBearing-this.netAngle)<.1&&this.tension>=.15&&this.tension<=.85&&this.lineOutRate<.35;this.netProgress=inside?this.netProgress+dt:Math.max(0,this.netProgress-dt*2);if(this.netProgress>=.8)this.land();}
    }
  }
}
