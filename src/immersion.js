// Presentation state follows controls and actual line travel; never changes fishing RNG.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const approach=(a,b,dt,speed)=>a+(b-a)*(1-Math.exp(-Math.max(0,dt)*speed));
export function environmentAt(clock){return {gust:clamp(.48+Math.sin(clock*.21)*.29+Math.sin(clock*.071+2)*.18,.05,1),sway:Math.sin(clock*.7)*.6+Math.sin(clock*1.13)*.2};}
export class RodPresentation{
 constructor(){this.phase=null;this.grip=0;this.reach=0;this.crank=2.2;this.spool=0;this.rotor=0;this.lineOut=0;this.pump=0;this.bend=0;this.bendVelocity=0;this.castSwing=0;this.yaw=0;this.pull=0;}
 update(g,dt){
  const hand=g.loadout.method==='float'||['held','fight','casting','flying'].includes(g.phase),target=hand?1:0;
  if(this.phase===null){this.grip=target;this.pump=g.lifting?1:0;this.castSwing=castGesture(g);}
  this.phase=g.phase;this.grip=approach(this.grip,target,dt,5.5);this.pump=approach(this.pump,g.lifting?1:0,dt,g.lifting?4.8:7);
  this.castSwing=approach(this.castSwing,castGesture(g),dt,g.phase==='flying'?22:12);
  this.yaw=approach(this.yaw,g.phase==='fight'?clamp((g.fishBearing||0)-(g.castAngle||0),-.24,.24):0,dt,3.2);
  this.pull=approach(this.pull,g.phase==='fight'?clamp((g.lineOutRate||0)*.035,0,.12):0,dt,6);
  this.lineOut=g.phase==='fight'?Math.max(0,g.lineOutRate||0):0;
  const winding=g.reeling&&['fight','held'].includes(g.phase),stall=this.lineOut>.12&&g.tension>.72;
  const rate=winding&&!stall?(1.25-clamp(g.tension||0,0,1)*.55):0;
  this.reach=approach(this.reach,winding?1:0,dt,10);this.crank+=rate*Math.PI*2*Math.max(0,dt);this.rotor+=rate*Math.PI*2*4.8*Math.max(0,dt);this.spool+=this.lineOut*18*Math.max(0,dt);
  // Damped blank response: loading lags the pull and settles after release.
  // Small head shakes follow the active run without consuming gameplay randomness.
  const run=g.run,shake=g.phase==='fight'&&run?.mode==='surge'?Math.sin(run.age*18)*.035*Math.sin(Math.min(1,run.age/run.duration)*Math.PI):0;
  const load=g.phase==='fight'?clamp((g.tension||0)+shake,0,1.2):g.phase==='casting'?g.castPower*.22:g.phase==='flying'?.22*g.castPower*Math.exp(-g.elapsed*15)-.08*g.castPower*Math.sin(Math.min(1,g.elapsed/.32)*Math.PI):0;
  let remaining=Math.min(.25,Math.max(0,dt));
  while(remaining>0){const step=Math.min(1/120,remaining);this.bendVelocity+=((load-this.bend)*196-this.bendVelocity*18)*step;this.bend+=this.bendVelocity*step;remaining-=step;}
  return this;
 }
 get pickup(){const u=this.grip<.012?0:this.grip>.995?1:this.grip;return u*u*(3-2*u);}
}
export function castGesture(g){
 const power=clamp(g.castPower||0,0,1),back=power===0?0:-.55*power;
 if(g.phase==='casting')return back;
 if(g.phase!=='flying')return 0;
 const t=Math.max(0,g.elapsed);return back*Math.exp(-t*12)+.38*power*Math.sin(Math.min(1,t/.46)*Math.PI)*Math.exp(-t*1.6);
}
export function releaseGesture(g){return g.phase==='flying'?castGesture(g):0;}
export function handResponse(g,m,width,height,clock=0){
 const u=g.loadout.method==='float'?1:(m?.pickup??1),pump=m?.pump||0,pull=m?.pull||0;
 const breath=Math.sin(clock*1.15)*.002*(1-pump*.6);
 return {angle:(m?.castSwing??castGesture(g))+breath+(m?.yaw||0)*.48-pull*.35,
  x:(m?.yaw||0)*width*.13-pull*width*.07,
  y:-Math.sin(u*Math.PI)*height*.035-pump*height*.045+pull*height*.035};
}
