import {DEFAULT_LOADOUT,methodPreset} from './tackle.js?v=0.24.2';
const ledger=(bait,feed,rig='running')=>({...DEFAULT_LOADOUT,bait,feed,rig,feedPortion:150});
export const MISSIONS=[
 {id:'hejtman-corn',name:'Kapr pod Chlumem',venueId:'hejtman',speciesId:'carp',minLength:55,count:1,seconds:1200,grams:300,trip:{date:'2026-06-15',time:'06:00'},loadout:ledger('corn','grain')},
 {id:'stankov-carp',name:'Staňkovský kapr',venueId:'stankov',speciesId:'carp',minLength:65,count:1,seconds:1200,grams:150,trip:{date:'2026-08-20',time:'19:00'},loadout:ledger('boilie','boilieCrumb','hair')},
 {id:'jarosov-tench',name:'Lín u břehu',venueId:'jarosov',speciesId:'tench',minLength:35,count:1,seconds:1200,grams:300,trip:{date:'2026-06-10',time:'07:00'},loadout:{...methodPreset('float'),bait:'worm',feed:'groundbait',feedPortion:150}},
 {id:'vlkov-feeder',name:'Feeder na pískovně',venueId:'vlkov',speciesId:'carp',minLength:50,count:1,seconds:1200,grams:300,trip:{date:'2026-07-12',time:'07:00'},loadout:{...methodPreset('feeder'),bait:'corn',feed:'sweetMix',feedPortion:150}},
 {id:'lipno-cejn',name:"Lipenský cejn",venueId:'lipno',speciesId:'bream',minLength:36,count:1,seconds:1200,grams:150,trip:{date:'2026-07-10',time:'06:30'},loadout:{...methodPreset('feeder'),bait:'maggots',feed:'groundbait',feedPortion:150,hook:12}},
 {id:'orlik-kapr',name:"Kapr z hlubiny",venueId:'orlik',speciesId:'carp',minLength:65,count:1,seconds:1500,grams:150,trip:{date:'2026-09-08',time:'17:30'},loadout:{...ledger('boilie20','boilieCrumb','hair'),hook:8}},
 {id:'hnevkovice-carp',name:"Kapr u Purkarce",venueId:'hnevkovice',speciesId:'carp',minLength:54,count:1,seconds:1200,grams:300,trip:{date:'2026-08-07',time:'07:00'},loadout:{...methodPreset('feeder'),bait:'corn',feed:'sweetMix',feedPortion:150,hook:12}},
 {id:'jordan-cejn',name:"Ranní cejn z Jordánu",venueId:'jordan',speciesId:'bream',minLength:33,count:1,seconds:900,grams:150,trip:{date:'2026-06-24',time:'06:00'},loadout:{...methodPreset('float'),bait:'maggots',feed:'breadCrumb',feedPortion:150,hook:12}},
 {id:'nezarka-lin',name:"Lín na Nežárce",venueId:'nezarka3',speciesId:'tench',minLength:32,count:1,seconds:1200,grams:150,trip:{date:'2026-06-21',time:'07:30'},loadout:{...methodPreset('float'),bait:'worm',feed:'hemp',feedPortion:150,hook:12}},
 {id:'luznice-a-plotice',name:"Jemná plavaná na Lužnici",venueId:'luznice10a',speciesId:'roach',minLength:20,count:2,seconds:1200,grams:150,trip:{date:'2026-05-16',time:'08:30'},loadout:{...methodPreset('float'),bait:'maggots',feed:'groundbait',feedPortion:150,hook:12}},
 {id:'luznice-b-kapr',name:"Kapr na pískovně Tušť",venueId:'luznice10b',speciesId:'carp',minLength:56,count:1,seconds:1200,grams:300,trip:{date:'2026-07-20',time:'18:00'},loadout:ledger('corn','grain','running')},
 {id:'luznice-c-cejn',name:"Cejn na Lužnici 10 C",venueId:'luznice10c',speciesId:'bream',minLength:35,count:1,seconds:900,grams:150,trip:{date:'2026-08-11',time:'06:30'},loadout:{...methodPreset('feeder'),bait:'maggots',feed:'groundbait',feedPortion:150,hook:12}},
 {id:'zadni-kapr',name:"Kapr na Zadních Koutech",venueId:'zadnikouty',speciesId:'carp',minLength:54,count:1,seconds:1200,grams:150,trip:{date:'2026-06-12',time:'19:00'},loadout:ledger('corn','grain','running')},
 {id:'vlkov-mala-lin',name:"Lín ve Vlkovské malé",venueId:'vlkovmala',speciesId:'tench',minLength:31,count:1,seconds:1200,grams:150,trip:{date:'2026-07-02',time:'06:00'},loadout:{...methodPreset('float'),bait:'worm',feed:'groundbait',feedPortion:150,hook:12}},
];
export class MissionRun{
 constructor(definition){this.definition=definition;this.elapsed=0;this.caught=0;this.attempts=0;this.status='running';this.seen=new Set();}
 get remaining(){return Math.max(0,this.definition.seconds-this.elapsed);}
 get finished(){return this.status!=='running';}
 advance(dt){if(this.finished||!Number.isFinite(dt)||dt<=0)return;this.elapsed=Math.min(this.definition.seconds,this.elapsed+dt);if(this.remaining<=1e-8)this.status='failed';}
 record(fish){if(this.finished||this.seen.has(fish.id))return false;this.seen.add(fish.id);this.attempts++;const d=this.definition;if(fish.venueId!==d.venueId||fish.speciesId!==d.speciesId||fish.length<d.minLength||(d.minWeight&&fish.weight<d.minWeight))return false;this.caught++;if(this.caught>=d.count)this.status='succeeded';return true;}
}
