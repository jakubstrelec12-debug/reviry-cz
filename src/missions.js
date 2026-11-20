import {DEFAULT_LOADOUT,methodPreset} from './tackle.js?v=0.22.0';
const ledger=(bait,feed,rig='running')=>({...DEFAULT_LOADOUT,bait,feed,rig,feedPortion:150});
export const MISSIONS=[
 {id:'hejtman-corn',name:'Kapr pod Chlumem',venueId:'hejtman',speciesId:'carp',minLength:55,count:1,seconds:1200,grams:300,trip:{date:'2026-06-15',time:'06:00'},loadout:ledger('corn','grain')},
 {id:'stankov-carp',name:'Staňkovský kapr',venueId:'stankov',speciesId:'carp',minLength:65,count:1,seconds:1200,grams:150,trip:{date:'2026-08-20',time:'19:00'},loadout:ledger('boilie','boilieCrumb','hair')},
 {id:'jarosov-tench',name:'Lín u břehu',venueId:'jarosov',speciesId:'tench',minLength:35,count:1,seconds:1200,grams:300,trip:{date:'2026-06-10',time:'07:00'},loadout:{...methodPreset('float'),bait:'worm',feed:'groundbait',feedPortion:150}},
 {id:'vlkov-feeder',name:'Feeder na pískovně',venueId:'vlkov',speciesId:'carp',minLength:50,count:1,seconds:1200,grams:300,trip:{date:'2026-07-12',time:'07:00'},loadout:{...methodPreset('feeder'),bait:'corn',feed:'sweetMix',feedPortion:150}},
];
export class MissionRun{
 constructor(definition){this.definition=definition;this.elapsed=0;this.caught=0;this.attempts=0;this.status='running';this.seen=new Set();}
 get remaining(){return Math.max(0,this.definition.seconds-this.elapsed);}
 get finished(){return this.status!=='running';}
 advance(dt){if(this.finished||!Number.isFinite(dt)||dt<=0)return;this.elapsed=Math.min(this.definition.seconds,this.elapsed+dt);if(this.remaining<=1e-8)this.status='failed';}
 record(fish){if(this.finished||this.seen.has(fish.id))return false;this.seen.add(fish.id);this.attempts++;const d=this.definition;if(fish.venueId!==d.venueId||fish.speciesId!==d.speciesId||fish.length<d.minLength||(d.minWeight&&fish.weight<d.minWeight))return false;this.caught++;if(this.caught>=d.count)this.status='succeeded';return true;}
}
