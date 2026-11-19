import {BAITS} from './tackle.js?v=0.14.1';
// Gameplay model: deliberately readable timing, not measured biological data.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function strikeWindow(loadout,fish={}){
 const method=loadout.method,hair=['hair','springHair','method'].includes(loadout.rig),largeBait=BAITS[loadout.bait]?.hairOnly===true;
 const cautious=fish?.id==='tench'?.30:fish?.id==='bream'?-.12:0;
 const touchEnd=(method==='float'?.70:method==='feeder'?.90:1.15)+cautious+(largeBait?.22:0);
 const openAt=touchEnd+.5+(hair?.15:0),closeAt=openAt+(method==='float'?3:method==='feeder'?3.8:4.8)+(hair?.5:0);
 return {touchEnd,openAt,closeAt,leaveAt:closeAt+.85};
}
export function biteAge(game){return game.phase==='held'?game.biteElapsed||0:game.elapsed||0;}
export function assessStrike(game){
 if(game.phase==='waiting'||!game.fish)return {outcome:'empty',offset:0,quality:0};
 const window=game.biteWindow||strikeWindow(game.loadout,game.fish),age=biteAge(game);
 if(age<window.openAt)return {outcome:'early',offset:window.openAt-age,quality:0,age};
 if(age>window.closeAt)return {outcome:'late',offset:age-window.closeAt,quality:0,age};
 if(game.slackToTake>.02)return {outcome:'slack',offset:game.slackToTake,quality:0,age};
 const quality=clamp(Math.min((age-window.openAt)/.6,(window.closeAt-age)/.7),.25,1);
 return {outcome:'hooked',offset:0,quality,age};
}
const seconds=value=>Math.max(.1,Math.round(value*10)/10).toLocaleString('cs-CZ',{minimumFractionDigits:1,maximumFractionDigits:1});
export function strikeReason(result){
 if(result.outcome==='early')return `Zásek o ${seconds(result.offset)} s brzy. Ryba nástrahu ještě jen ochutnávala.`;
 if(result.outcome==='late')return `Zásek o ${seconds(result.offset)} s pozdě. Ryba už nástrahu pouštěla.`;
 if(result.outcome==='slack')return 'Zásek do povoleného vlasce. U padavého záběru nejprve krátce naviň a obnov kontakt.';
 return 'Zásek do prázdna. Na nástraze ještě nebyl záběr. Nahoď znovu.';
}
