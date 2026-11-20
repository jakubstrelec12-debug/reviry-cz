// Behaviour is deliberately stochastic game simulation, not measured fish biology.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function probeLift(game){
 const p=game.probe;if(!p||game.phase!=='waiting')return 0;const t=game.time-p.at;
 if(t<0||t>p.duration)return 0;
 const pulse=(center,width)=>Math.exp(-Math.pow((t-center)/width,2));
 return -p.power*(pulse(.27,.11)+((p.taps??3)>1?.65*pulse(.78+p.seed*.3,.15):0)+((p.taps??3)>2?.35*pulse(1.45+p.seed*.25,.13):0));
}
export function alarmStep(game,state={offset:0,travel:0,last:-Infinity},offset=0){
 const inWater=['waiting','bite'].includes(game.phase),active=game.loadout.method==='ledger'&&game.loadout.indicator==='electronic'&&inWater;
 if(!active||game.paused)return {state:{offset,travel:0,last:game.time},pulse:false};
 const travel=state.travel+Math.min(5,Math.abs(offset-state.offset)),pulse=travel>.85&&game.time-state.last>.16;
 return {state:{offset,travel:pulse?0:travel,last:pulse?game.time:state.last},pulse};
}
export function nextRun(random,previous=null){
 const mode=previous?.mode==='surge'?'rest':'surge',a=clamp(random(),0,1),b=clamp(random(),0,1),c=clamp(random(),0,1);
 return {mode,age:0,duration:mode==='surge'?1.6+a*4.2:.9+a*3.3,power:mode==='surge'?.65+b*.75:0,direction:(c-.5)*.32};
}
export function runForce(run){if(!run||run.mode!=='surge')return 0;const f=clamp(run.age/run.duration,0,1);return Math.pow(Math.sin(Math.PI*f),1.4)*run.power;}
