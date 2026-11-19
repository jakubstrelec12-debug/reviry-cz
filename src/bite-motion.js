import {probeLift} from './encounter.js?v=0.14.0';
import {strikeWindow,biteAge} from './strike-timing.js?v=0.14.0';
// A single pose drives the tackle, optical detail and short movement caption.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function biteMotion(game,clock=0){
 const nibble=probeLift(game);if(nibble)return {stage:'touch',progress:0,floatSink:-nibble*.006,floatTilt:nibble*.009,ledgerLift:nibble,feederFlex:-nibble*1.1};
 if(!['bite','held'].includes(game.phase)||(game.phase==='held'&&!game.fish))return {stage:'idle',progress:0,floatSink:Math.sin(clock*1.6)*.009,floatTilt:Math.sin(clock*1.6)*.025,ledgerLift:0,feederFlex:0};
 const t=Math.max(0,biteAge(game)),window=game.biteWindow||strikeWindow(game.loadout,game.fish),touch=t<window.openAt,fade=clamp((t-window.closeAt)/(window.leaveAt-window.closeAt),0,1),progress=clamp((t-window.openAt)/1.35,0,1)*(1-fade),twitch=Math.sin(t*8)*Math.sin(clamp(t/window.touchEnd,0,1)*Math.PI),drop=game.biteStyle==='dropback';
 return {stage:fade>0?'fading':touch?'touch':'run',progress,floatSink:t<window.touchEnd?twitch*.025:(drop?-.15:.38)*progress,floatTilt:t<window.touchEnd?twitch*.07:(drop?.60:.13)*progress,ledgerLift:t<window.touchEnd?-twitch*2.5:(drop?1:-1)*(progress*28+Math.sin(t*3)*progress*2),feederFlex:t<window.touchEnd?twitch*2:(drop?-1:1)*(progress*27+Math.sin(t*4)*progress*3)};
}
export function signalCaption(game){
 const pose=biteMotion(game,game.time),method=game.loadout.method,drop=game.biteStyle==='dropback',indicator=game.loadout.indicator||'bobbin',name=indicator==='bobbin'?'Čihátko':'Swinger';
 if(pose.stage==='idle')return method==='float'?'Klidná hladina':method==='feeder'?'Špička v klidu':indicator==='electronic'?'Hlásič v klidu · swinger bez pohybu':`${name} v klidu`;
 if(pose.stage==='fading')return 'Záběr slábne';
 if(pose.stage==='touch')return 'Jemné ťuknutí';
 return method==='float'?(drop?'Přizvednutí · zasekni':'Potápí se · zasekni'):method==='feeder'?(drop?'Špička povoluje':'Špička se ohýbá'):(indicator==='electronic'?`Hlásič bliká · ${drop?'padák':'jízda'}`:`${name} ${drop?'klesá':'stoupá'}`);
}
