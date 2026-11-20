import {environmentAt} from './immersion.js?v=0.25.1';
import {tripConditions} from './trip.js?v=0.25.1';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export class LakeSound{
 constructor(Context){
  this.context=new Context();this.master=this.context.createGain();this.master.gain.value=.65;this.master.connect(this.context.destination);this.effects=this.context.createGain();this.effects.gain.value=1;this.effects.connect(this.master);this.tracks=new Map();this.clock=0;this.nextBird=5;this.lastRatchet=-Infinity;this.paused=false;this.samples={};this.sampleLoad=null;this.previewVoice=null;
  const length=Math.floor(this.context.sampleRate*3);this.noise=this.context.createBuffer(1,length,this.context.sampleRate);const data=this.noise.getChannelData(0);let brown=0;for(let i=0;i<length;i++){brown=(brown+(Math.random()*2-1)*.08)/1.035;data[i]=brown;}
  this.transients=this.context.createBuffer(1,length,this.context.sampleRate);const white=this.transients.getChannelData(0);for(let i=0;i<length;i++)white[i]=Math.random()*2-1;
  this.water=this.loop(920,.045);this.wind=this.loop(320,.025);this.wind.filter.Q.value=.5;
 }
 async loadSamples(fetcher=fetch){if(this.sampleLoad)return this.sampleLoad;this.sampleLoad=Promise.all(['reel','drag','splash'].map(async name=>{try{const response=await fetcher(new URL('../assets/audio/'+name+'.mp3?v=0.25.1.1',import.meta.url));if(!response.ok)throw Error('HTTP '+response.status);this.samples[name]=await this.context.decodeAudioData(await response.arrayBuffer());return null;}catch{return name;}})).then(failed=>{const missing=failed.filter(Boolean);if(missing.length)this.sampleLoad=null;return missing;});return this.sampleLoad;}
 playSample(name,{pan=0,volume=.65,loop=false,rate=1,preview=false,duration=null,delay=0}={}){
  const buffer=this.samples[name];if(!buffer||this.state!=='running'||(this.paused&&!preview))return null;
  const c=this.context,source=c.createBufferSource(),gain=c.createGain(),at=c.currentTime+delay;source.buffer=buffer;source.loop=loop;source.playbackRate.value=rate;source.connect(gain);this.pan(gain,pan,preview);gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(volume,at+.012);source.start(at);
  if(!loop){const length=Math.min(duration??buffer.duration/rate,buffer.duration/rate);gain.gain.setValueAtTime(volume,at+Math.max(.013,length-.045));gain.gain.exponentialRampToValueAtTime(.0001,at+length);source.stop(at+length+.01);}
  return {source,gain};
 }
 stopVoice(voice){if(!voice)return;this.target(voice.gain.gain,.0001,.015);try{voice.source.stop(this.context.currentTime+.08);}catch{}}
 updateLoop(track,name,active,pan,rate){track.voices??={};const voice=track.voices[name];if(!active){this.stopVoice(voice);delete track.voices[name];}else if(!voice){const next=this.playSample(name,{loop:true,pan,rate,volume:name==='reel'?1:.65});if(next)track.voices[name]=next;}else this.target(voice.source.playbackRate,rate,.12);}
 setVolume(value){const volume=Number.isFinite(value)?Math.max(0,Math.min(1,value)):1;this.target(this.master.gain,.65*volume,.06);}
 get state(){return this.context.state;}
 resume(){return this.context.resume();}suspend(){for(const track of this.tracks.values())for(const name of ['reel','drag'])this.updateLoop(track,name,false,0,1);this.stopVoice(this.previewVoice);this.previewVoice=null;return this.context.suspend();}
 target(param,value,time=.1){param.setTargetAtTime(value,this.context.currentTime,time);}
 loop(frequency,volume){const c=this.context,source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=this.noise;source.loop=true;filter.type='lowpass';filter.frequency.value=frequency;gain.gain.value=volume;source.connect(filter).connect(gain).connect(this.master);source.start();return {source,filter,gain};}
 pan(node,pan,ambient=false){const bus=ambient?this.master:this.effects;if(this.context.createStereoPanner){const p=this.context.createStereoPanner();p.pan.value=clamp(pan,-1,1);node.connect(p).connect(bus);}else node.connect(bus);}
 tone(frequency,duration,volume,pan=0,finish=null,type='sine',delay=0,ambient=false){if(this.state!=='running'||(this.paused&&!ambient))return;const c=this.context,at=c.currentTime+delay,osc=c.createOscillator(),gain=c.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,at);if(finish)osc.frequency.exponentialRampToValueAtTime(finish,at+duration);gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(volume,at+.009);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);osc.connect(gain);this.pan(gain,pan,ambient);osc.start(at);osc.stop(at+duration+.015);}
 rustle(duration,volume,frequency=1200,pan=0,delay=0,preview=false){if(this.state!=='running'||(this.paused&&!preview))return;const c=this.context,source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain(),at=c.currentTime+delay;source.buffer=this.transients;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.7;gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(volume,at+.015);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);source.connect(filter).connect(gain);this.pan(gain,pan,preview);source.start(at,Math.random());source.stop(at+duration+.02);}
 splash(distance=20,pan=0,preview=false,delay=0){return this.playSample('splash',{pan,preview,delay,volume:.7*clamp(25/Math.max(8,distance),.4,1.3)});}
 preview(name){this.stopVoice(this.previewVoice);this.previewVoice=name==='splash'?this.splash(20,0,true):this.playSample(name,{preview:true,duration:1.2,volume:name==='reel'?1:.65});}
 confirm(){this.tone(660,.16,.07,0,880,'sine',0,true);}
 alarm(index=0,drop=false){this.tone((drop?740:1120)+index*130,.11,.035,index===0?-.35:.35);}
 event(name,data,rod){if(this.paused)return;const pan=data?.rodIndex===1?.35:-.2;
  if(name==='cast')this.rustle(.28,.22,1650,pan);
  if(name==='retrieved')this.playSample('reel',{pan,duration:.65});
  if(name==='splash')this.splash(rod.distance||20,pan);
  if(name==='grab')this.rustle(.13,.11,480,pan);
  if(name==='hooked')this.rustle(.16,.16,1900,pan);
  if(name==='feed')this.splash(data?.target?.distance||rod.distance||20,data?.target?.angle||0,false,.95);
 }
 setPaused(value){this.paused=Boolean(value);if(this.paused)for(const track of this.tracks.values())for(const name of ['reel','drag'])this.updateLoop(track,name,false,0,1);this.target(this.effects.gain,this.paused?0:1,.07);}
 update(game,dt,presentation=null){
  this.setPaused(game.paused);if(this.state!=='running')return;
  this.clock=Number.isFinite(presentation?.clock)?presentation.clock:this.clock+Math.max(0,dt);const env=environmentAt(this.clock);this.target(this.wind.gain.gain,.012+env.gust*.035,.4);this.target(this.water.gain.gain,.035+Math.sin(this.clock*.44)*.008,.4);
  const rods=this.paused?[]:(game.enabledRods||[game]);rods.forEach((g,i)=>{
   const track=this.tracks.get(i)||{lastWake:-Infinity,voices:{}};
   const payout=g.phase==='fight'?Math.max(0,g.lineOutRate||0):0,pan=i===0?-.25:.25;
   const winding=g.reeling&&['fight','held'].includes(g.phase)&&!(payout>.12&&g.tension>.72);
   this.updateLoop(track,'reel',winding,pan,.9+.15*(1-clamp(g.tension||0,0,1)));
   this.updateLoop(track,'drag',payout>.06,pan,clamp(.8+payout*.15,.8,1.25));
   if(g.phase==='fight'&&g.distance<9&&payout>.2&&this.clock-track.lastWake>2){this.splash(Math.max(8,g.distance),i===0?-.1:.2);track.lastWake=this.clock;}
   this.tracks.set(i,track);
  });
  if(this.clock>=this.nextBird){const light=tripConditions(game.trip).light;if(light>.25){const pan=Math.sin(this.clock*.13)*.75;for(let i=0;i<3;i++)this.tone(2100+i*260,.10,.012,pan,3500-i*130,'sine',i*.18,true);}else{this.tone(3800,.06,.004,-.65,4050,'sine',0,true);this.tone(4000,.06,.004,.55,3700,'sine',.15,true);}this.nextBird=this.clock+12+Math.random()*21;}
 }
}
