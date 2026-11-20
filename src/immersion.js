// Presentation state follows controls and actual line travel; never changes fishing RNG.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const approach=(a,b,dt,speed)=>a+(b-a)*(1-Math.exp(-Math.max(0,dt)*speed));
export function environmentAt(clock){return {gust:clamp(.48+Math.sin(clock*.21)*.29+Math.sin(clock*.071+2)*.18,.05,1),sway:Math.sin(clock*.7)*.6+Math.sin(clock*1.13)*.2};}
export class RodPresentation{
 constructor(){this.phase=null;this.grip=0;this.reach=0;this.crank=2.2;this.spool=0;this.rotor=0;this.lineOut=0;this.pump=0;this.bend=0;this.bendVelocity=0;}
 update(g,dt){
  const hand=g.loadout.method==='float'||['held','fight','casting','flying'].includes(g.phase),target=hand?1:0;
  if(this.phase===null){this.grip=target;this.pump=g.lifting?1:0;}
  this.phase=g.phase;this.grip=approach(this.grip,target,dt,9);this.pump=approach(this.pump,g.lifting?1:0,dt,7);
  this.lineOut=g.phase==='fight'?Math.max(0,g.lineOutRate||0):0;
  const winding=g.reeling&&['fight','held'].includes(g.phase),stall=this.lineOut>.12&&g.tension>.72;
  const rate=winding&&!stall?(1.25-clamp(g.tension||0,0,1)*.55):0;
  this.reach=approach(this.reach,winding?1:0,dt,10);this.crank+=rate*Math.PI*2*Math.max(0,dt);this.rotor+=rate*Math.PI*2*4.8*Math.max(0,dt);this.spool+=this.lineOut*18*Math.max(0,dt);
  // Damped blank response: loading lags the pull and settles after release.
  // Small head shakes follow the active run without consuming gameplay randomness.
  const run=g.run,shake=g.phase==='fight'&&run?.mode==='surge'?Math.sin(run.age*18)*.035*Math.sin(Math.min(1,run.age/run.duration)*Math.PI):0;
  const load=g.phase==='fight'?clamp((g.tension||0)+shake,0,1.2):0;
  let remaining=Math.min(.25,Math.max(0,dt));
  while(remaining>0){const step=Math.min(1/120,remaining);this.bendVelocity+=((load-this.bend)*196-this.bendVelocity*18)*step;this.bend+=this.bendVelocity*step;remaining-=step;}
  return this;
 }
 get pickup(){return this.grip<.012?0:this.grip>.995?1:this.grip;}
}
export function releaseGesture(g){if(g.phase!=='flying')return 0;const t=Math.max(0,g.elapsed);return (-.55*Math.exp(-t*12)+.32*Math.sin(Math.min(1,t/.42)*Math.PI)*Math.exp(-t*2))*(.4+.6*g.castPower);}
