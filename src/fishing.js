import {strikeWindow,assessStrike,strikeReason} from './strike-timing.js?v=0.10.0';
import {DEFAULT_LOADOUT, METHODS, RODS, RIGS, catchWeight, validateLoadout, cleanLoadout, feedInfluence, speciesWeights, biteDelay,createFeedStocks} from './tackle.js?v=0.10.0';
export const SPECIES = [
  {id:'carp',name:'Kapr obecný', min:1.4, max:7.8, power:0.85, color:0xb79b5d},
  {id:'tench',name:'Lín obecný', min:0.45, max:2.3, power:0.6, color:0x6d7841},
  {id:'bream',name:'Cejn velký', min:0.5, max:2.8, power:0.5, color:0xa9b5a1},
];
export class Fishing {
  constructor(random = Math.random) {
    this.loadout={...DEFAULT_LOADOUT};this.feedSpot=null;this.feedStocks=createFeedStocks();this.castAngle=0;this.random=random; this.phase='ready'; this.time=0;this.castPower=0;this.distance=0;
    this.drag=0.48;this.tension=0.25;this.stamina=1;this.reeling=false;this.lifting=false;
    this.elapsed=0;this.biteIn=0;this.biteElapsed=0;this.fish=null;this.result=null;
    this.biteWindow=null;this.slackToTake=0;this.hookQuality=1;this.lastStrike=null;this.lastStrikeAt=-Infinity;this.journal=[]; this.onChange=()=>{};this.onEvent=()=>{};this.paused=false;
  }
  emit(name, data={}) {this.onEvent(name,data);this.onChange(this);}
  setLoadout(value){
    if(!['ready','escaped'].includes(this.phase))return false;
    if(validateLoadout(value).length)return false;
    this.loadout=cleanLoadout(value);this.emit('loadout');return true;
  }
  get feedBonus(){return feedInfluence(this.loadout,this.feedSpot,this.time,this.distance,this.castAngle);}
  depositFeed(grams){
    const type=this.loadout.feed;if(type==='none'||!Number.isFinite(this.feedStocks[type])||this.feedStocks[type]<grams)return false;
    this.feedStocks[type]-=grams;
    const previous=this.feedSpot,near=previous&&previous.type===type&&Math.abs(previous.distance-this.distance)<7&&Math.abs(previous.angle-this.castAngle)<.18;
    this.feedSpot={type,time:this.time,distance:this.distance,angle:this.castAngle,grams:Math.min(500,grams+(near?previous.grams*Math.max(0,1-(this.time-previous.time)/240):0))};return true;
  }
  feed(){
    if(this.phase!=='waiting'||!this.depositFeed(this.loadout.feedPortion))return false;
    this.biteIn=this.elapsed+Math.max(.5,(this.biteIn-this.elapsed)/(1+this.feedBonus*.7));this.emit('feed');return true;
  }
  startCast(){if(!['ready','escaped','landed'].includes(this.phase))return false;
    this.phase='casting';this.castPower=0;this.result=null;this.fish=null;this.biteWindow=null;this.biteElapsed=0;this.slackToTake=0;this.hookQuality=1;this.lastStrike=null;this.emit('cast-start');return true;}
  releaseCast(){if(this.phase!=='casting')return false;
    const range=METHODS[this.loadout.method].cast;this.distance=range[0]+this.castPower*range[1]*(RODS[this.loadout.rod].length/3.6);this.throwDistance=this.distance;this.phase='flying';this.elapsed=0;
    this.reeling=false;this.lifting=false;this.emit('cast');return true;}
  grab(){if(this.phase!=='bite')return false;this.phase='held';this.elapsed=0;this.slackToTake=this.biteStyle==='dropback'?.45+Math.min(40,this.distance)*.006:0;this.emit('grab');return true;}
  strike(){if(this.paused||!['waiting','held'].includes(this.phase)&&!(this.loadout.method==='float'&&this.phase==='bite'))return false;
    const result=assessStrike(this);this.lastStrike={...result};this.lastStrikeAt=this.time;
    if(result.outcome!=='hooked'){this.lose(strikeReason(result),{strike:result});return false;}
    this.hookQuality=result.quality;this.phase='fight';this.stamina=1;this.tension=0.38;this.elapsed=0;this.slack=0;this.overload=0;this.reeling=false;
    this.emit('hooked',{strike:result});return true;}
  net(){if(this.phase!=='fight'||this.distance>4||this.stamina>0.22)return false;
    this.phase='landed';this.result={...this.fish,speciesId:this.fish.id,loadout:{...this.loadout},strike:this.lastStrike?{...this.lastStrike}:null,date:new Date().toISOString(),id:Date.now()};
    this.journal.unshift(this.result);this.journal=this.journal.slice(0,100);this.reeling=false;this.lifting=false;
    this.emit('landed',this.result);return true;}
  lose(reason,detail={}){this.phase='escaped';this.reeling=false;this.lifting=false;this.result={reason,...detail};this.emit('escaped',{reason,...detail});}
  retrieve(){if(!['waiting','bite','held'].includes(this.phase))return;this.phase='ready';this.reeling=false;this.lifting=false;this.emit('retrieved');}
  advance(elapsed){
    if(!Number.isFinite(elapsed)||elapsed<=0)return;
    let remaining=Math.min(.25,elapsed);
    while(remaining>1e-8){const step=Math.min(.05,remaining);this.tick(step);remaining-=step;}
  }
  tick(dt){if(this.paused)return;dt=Math.min(Math.max(dt,0),0.05);this.time+=dt;this.elapsed+=dt;
    if(this.phase==='casting')this.castPower=Math.min(1,this.castPower+dt/1.7);
    if(this.phase==='flying'&&this.elapsed>1.1){this.phase='waiting';if(RIGS[this.loadout.rig].feeder)this.depositFeed(20);this.biteIn=biteDelay(this.loadout,this.random(),this.feedBonus);this.elapsed=0;this.emit('splash');}
    if(this.phase==='waiting'&&this.elapsed>=this.biteIn){
      const weights=speciesWeights(this.loadout,this.feedBonus);let pick=Math.max(0,Math.min(1-Number.EPSILON,this.random()))*weights.reduce((a,b)=>a+b,0),index=0;while(index<weights.length-1&&pick>=weights[index])pick-=weights[index++];const species=SPECIES[index];
      const weight=catchWeight(species,this.loadout,this.random(),this.feedBonus);
      this.fish={...species,weight,length:Math.round(22+Math.pow(weight,0.44)*23)};
      this.biteStyle=Math.round(weight*100)%3===0?'dropback':'pull';this.biteWindow=strikeWindow(this.loadout,this.fish);this.phase='bite';this.elapsed=0;this.biteElapsed=0;this.emit('bite');
    }
    if(['bite','held'].includes(this.phase)){
      this.biteElapsed=this.phase==='bite'?this.elapsed:this.biteElapsed+dt;
      if(this.phase==='held'&&this.reeling)this.slackToTake=Math.max(0,this.slackToTake-dt);
      const window=this.biteWindow||strikeWindow(this.loadout,this.fish);
      if(this.biteElapsed>window.leaveAt)this.lose('Zásek přišel pozdě. Ryba pustila nástrahu.',{strike:{outcome:'missed',age:this.biteElapsed,offset:this.biteElapsed-window.closeAt,quality:0}});
    }
    if(this.phase==='fight'){
      const strength=this.fish.power*(0.7+this.fish.weight/12);
      const surge=(0.45+Math.max(0,Math.sin(this.elapsed*1.35)+Math.sin(this.elapsed*3.1)*0.25))*(0.28+this.stamina*0.72)*strength;
      const lineStrength=Math.pow(this.loadout.line/.25,.85);const target=(0.08+this.drag*surge*0.95+(this.reeling?0.16:0)+(this.lifting?0.2:0))/lineStrength;
      this.tension+=(target-this.tension)*Math.min(1,dt*2.4);
      this.distance=Math.max(2.2,this.distance+(surge*(1-this.drag)*2.3-(this.reeling?1.9*(0.35+this.drag)*RODS[this.loadout.rod].power:0)-(this.lifting?0.25:0))*dt);
      this.stamina=Math.max(0,this.stamina-dt*(0.014+this.drag*0.018+(this.reeling?0.012:0)+(this.lifting?0.012:0)));
      this.overload=this.tension>0.94?this.overload+dt:Math.max(0,this.overload-dt*2);
      this.slack=this.tension<0.13?this.slack+dt:0;
      if(this.overload>1.15)this.lose('Vlasec praskl. Při výpadu povol brzdu a přestaň navíjet.');
      else if(this.slack>3+this.hookQuality*2)this.lose('Vlasec zůstal povolený a ryba se vyháčkovala.');
      else if(this.distance>85)this.lose('Ryba vytáhla příliš mnoho vlasce a unikla.');
    }
  }
}
