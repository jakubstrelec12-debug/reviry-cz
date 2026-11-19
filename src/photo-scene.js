import {RODS,RIGS} from './tackle.js?v=0.6.0';

export const PHOTO={src:'assets/vajgar-photograph.webp',author:'Wwery',title:'Pohled na Jindřichův Hradec přes rybník Vajgar',source:'https://commons.wikimedia.org/wiki/File:Pohled_na_Jind%C5%99ich%C5%AFv_Hradec_p%C5%99es_rybn%C3%ADk_Vajgar.jpg',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',waterStart:.575};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function photoCrop(iw,ih,w,h,yaw=0,pitch=0){
 const scale=Math.max(w/iw,h/ih)*1.055,sw=w/scale,sh=h/scale;
 return {sx:clamp((iw-sw)/2+yaw*iw*.4,0,iw-sw),sy:clamp((ih-sh)/2+pitch*ih*.3,0,ih-sh),sw,sh,scale};
}
export function waterPoint(w,h,waterTop,distance,angle=0){
 const near=h*.84,far=Math.max(waterTop+18,h*.60),depth=clamp(Math.log1p(distance)/Math.log(65),0,1);
 return {x:w*(.50+Math.sin(angle)*.65),y:near+(far-near)*depth};
}
function loadImage(path){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Fotografii Vajgaru se nepodařilo načíst.'));image.src=new URL('../'+path,import.meta.url).href;});}
function mix(a,b,t){return a+(b-a)*t;}
function point(a,b,c,t){const u=1-t;return {x:u*u*a.x+2*u*t*b.x+t*t*c.x,y:u*u*a.y+2*u*t*b.y+t*t*c.y};}

export class LakeScene{
 constructor(canvas,game){
  this.canvas=canvas;this.game=game;this.ctx=canvas.getContext('2d',{alpha:false});if(!this.ctx)throw new Error('Canvas 2D není dostupný.');
  this.clock=0;this.yaw=0;this.pitch=0;this.castYaw=0;this.pose=0;this.assetWarnings=[];this.photo=PHOTO;this.geoAccurate=false;this.ripples=[];this.feedThrow=null;this.metrics={engine:'photographic-2d',drawImages:0};
  try{this.high=localStorage.getItem('reviry-quality')!=='low';}catch{this.high=true;}
  this.background=document.createElement('canvas');this.bctx=this.background.getContext('2d');this.lastView='';this.bindLook();this.onResize=()=>this.resize();window.addEventListener('resize',this.onResize);
 }
 async init(){this.image=await loadImage(PHOTO.src);this.resize();this.render(0);return this;}
 resize(){this.width=innerWidth;this.height=innerHeight;this.ratio=Math.min(devicePixelRatio||1,this.high?1.75:1);for(const c of [this.canvas,this.background]){c.width=Math.round(this.width*this.ratio);c.height=Math.round(this.height*this.ratio);}this.ctx.setTransform(this.ratio,0,0,this.ratio,0,0);this.bctx.setTransform(this.ratio,0,0,this.ratio,0,0);this.lastView='';}
 setQuality(high){this.high=high;try{localStorage.setItem('reviry-quality',high?'high':'low');}catch{}this.resize();}
 bindLook(){let pointer=null,lastX=0,lastY=0;
  this.canvas.addEventListener('pointerdown',e=>{pointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;this.canvas.setPointerCapture(e.pointerId);});
  this.canvas.addEventListener('pointermove',e=>{if(pointer!==e.pointerId)return;this.yaw=clamp(this.yaw-(e.clientX-lastX)*.0005,-.12,.12);this.pitch=clamp(this.pitch-(e.clientY-lastY)*.0004,-.055,.055);lastX=e.clientX;lastY=e.clientY;});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])this.canvas.addEventListener(type,()=>pointer=null);
 }
 setCastDirection(){this.castYaw=this.yaw;}
 splash(){if(this.target)this.ripples.push({...this.target,time:this.clock});this.ripples=this.ripples.slice(-6);}
 scatterFeed(){if(this.target)this.feedThrow={time:this.clock,start:{x:this.width*.25,y:this.height},end:{...this.target}};}
 cachePhotograph(){
  const key=[this.yaw.toFixed(3),this.pitch.toFixed(3),this.width,this.height].join('/');if(key===this.lastView)return;
  this.crop=photoCrop(this.image.width,this.image.height,this.width,this.height,this.yaw,this.pitch);const p=this.crop;
  this.bctx.drawImage(this.image,p.sx,p.sy,p.sw,p.sh,0,0,this.width,this.height);
  this.waterTop=clamp((this.image.height*PHOTO.waterStart-p.sy)*p.scale,0,this.height);this.lastView=key;
 }
 ellipse(x,y,rx,ry,fill,stroke=null,width=1){const c=this.ctx;c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
 line(points,color,width=1){const c=this.ctx;c.beginPath();c.moveTo(points[0].x,points[0].y);for(const p of points.slice(1))c.lineTo(p.x,p.y);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();}
 water(){const c=this.ctx,w=this.width,h=this.height,r=this.ratio;c.drawImage(this.background,0,0,w,h);this.metrics.drawImages=1;
  const step=this.high?4:8;
  for(let y=Math.ceil(this.waterTop);y<h;y+=step){
   const size=Math.min(step,h-y),depth=(y-this.waterTop)/Math.max(1,h-this.waterTop),wave=Math.sin(y*.11+this.clock*1.1)+Math.sin(y*.057-this.clock*.7)*.35;
   c.drawImage(this.background,0,y*r,w*r,size*r,wave*depth*1.7,y,w,size);this.metrics.drawImages++;
  }
 }
 drawRipples(){const c=this.ctx,t=this.clock;
  this.ripples=this.ripples.filter(p=>t-p.time<5);
  for(const p of this.ripples){const age=t-p.time;for(let i=0;i<3;i++){const f=age-i*.24;if(f<0)continue;const radius=5+f*19;this.ellipse(p.x,p.y,radius,radius*.17,null,`rgba(231,242,228,${Math.max(0,.45-f*.09)})`,1);}}
  if(this.feedThrow){const p=this.feedThrow,f=clamp((t-p.time)/.95,0,1);for(let i=0;i<20;i++){const x=mix(p.start.x,p.end.x+Math.sin(i*2.4)*18,f),y=mix(p.start.y,p.end.y+Math.cos(i*2.4)*4,f)-Math.sin(Math.PI*f)*(this.height*.22+i%3*5);this.ellipse(x,y,1.4,1.2,'#cfb77d');}if(f>=1){this.feedThrow=null;this.splash();}}
 }
 drawFloat(target,flying){const c=this.ctx,g=this.game,scale=clamp(15/(g.distance||15),.6,1.8),bite=g.phase==='bite';
  c.save();c.translate(target.x,target.y+(flying?0:Math.sin(this.clock*1.6)*1.1+(bite?6+Math.sin(g.elapsed*6)*4:0)));c.scale(scale,scale);
  if(!flying){c.beginPath();c.rect(-35,-35,70,36);c.clip();}
  c.rotate(flying?.7:Math.sin(this.clock*1.6)*.04);const body=c.createLinearGradient(-4,0,4,0);body.addColorStop(0,'#746a3c');body.addColorStop(.4,'#e4d3a3');body.addColorStop(1,'#77643a');
  this.ellipse(0,-2,3.5,8,body);this.line([{x:0,y:-10},{x:0,y:-26}],'#e56c39',2);this.line([{x:0,y:-18},{x:0,y:-21}],'#fff1c4',2.3);this.line([{x:0,y:5},{x:0,y:14}],'#313d36',1);c.restore();
 }
 drawFish(){const g=this.game;if(g.phase!=='fight'||g.distance>8)return;
  const c=this.ctx,p=this.target,s=clamp(8/g.distance,.9,2.2)*(g.fish?.length||50)/60;
  c.save();c.translate(p.x,p.y);c.rotate(Math.sin(this.clock*1.7)*.2);c.scale(s,s*.42);c.globalAlpha=.55;
  const gradient=c.createLinearGradient(0,-8,0,8);gradient.addColorStop(0,'#293d30');gradient.addColorStop(.45,g.fish?.id==='bream'?'#b0afa0':'#a59057');gradient.addColorStop(1,'#5e7154');
  this.ellipse(0,0,22,8,gradient);c.fillStyle='#616e4b';c.beginPath();c.moveTo(-19,0);c.lineTo(-31+Math.sin(this.clock*9)*2,-9);c.lineTo(-28,0);c.lineTo(-31+Math.sin(this.clock*9)*2,9);c.closePath();c.fill();c.restore();
  this.ellipse(p.x,p.y,35+Math.sin(this.clock*4)*4,5,null,'rgba(223,236,222,.35)',1);
 }
 drawRig(){const c=this.ctx,g=this.game,w=this.width,h=this.height,method=g.loadout.method,floating=method==='float',fighting=g.phase==='fight',held=g.phase==='held',casting=g.phase==='casting',flying=g.phase==='flying';
  const hand=floating||fighting||held||casting||flying;const size=Math.min(w/950,h/460)*1.08;
  const base={x:w*.73,y:h*1.04},tip={x:w*(.47+this.pose*.14),y:h*(.53-this.pose*.39)};
  if(casting){tip.x+=w*g.castPower*.14;tip.y-=h*g.castPower*.15;}
  const bend=fighting?g.tension*48:method==='feeder'?7+(g.phase==='bite'?(8+Math.sin(g.elapsed*10)*6)*(g.biteStyle==='dropback'?-1:1):0):0;
  const control={x:mix(base.x,tip.x,.48)+bend*size,y:mix(base.y,tip.y,.45)-bend*.3*size};
  this.tip=tip;
  if(!floating&&!hand){const rest=point(base,control,tip,.42);const standGradient=c.createLinearGradient(rest.x-5,rest.y,rest.x+5,rest.y);standGradient.addColorStop(0,'#07120f');standGradient.addColorStop(.5,'#56615b');standGradient.addColorStop(1,'#101c16');this.line([{x:rest.x-15*size,y:h+30},{x:rest.x,y:rest.y+3},{x:rest.x+80*size,y:h+30}],standGradient,4*size);this.line([{x:rest.x-25*size,y:rest.y},{x:rest.x+27*size,y:rest.y}],'#1a2520',6*size);}
  const rodGradient=c.createLinearGradient(base.x,base.y,tip.x,tip.y);rodGradient.addColorStop(0,'#151c18');rodGradient.addColorStop(.45,'#263b33');rodGradient.addColorStop(.8,'#0d201b');rodGradient.addColorStop(1,method==='feeder'?'#e5a25c':'#303f34');
  for(let i=0;i<40;i++){const a=point(base,control,tip,i/40),b=point(base,control,tip,(i+1)/40);this.line([a,b],rodGradient,(6*(1-i/40)+.8)*size);}
  const gripEnd=point(base,control,tip,.37);this.line([base,gripEnd],'#15231c',13*size);this.line([base,gripEnd],'#85714a',9*size);
  for(let i=0;i<21;i++){const p=point(base,control,tip,i/21*.37);this.line([{x:p.x-4*size,y:p.y+2},{x:p.x+3*size,y:p.y-2}],'rgba(32,32,22,.4)',.75*size);}
  const guides=[];for(let i=0;i<7;i++){const f=.44+i*.083,p=point(base,control,tip,f);guides.push({x:p.x-4*size,y:p.y+5*size});this.ellipse(p.x-4*size,p.y+5*size,(5-i*.54)*size,(3.2-i*.3)*size,null,'#bcc5ba',.9*size);}
  const reel=point(base,control,tip,.28);c.save();c.translate(reel.x-18*size,reel.y+2*size);c.rotate(-.5);c.scale(size,size);
  const metal=c.createLinearGradient(-30,-20,15,20);metal.addColorStop(0,'#52665e');metal.addColorStop(.25,'#d1d8c6');metal.addColorStop(.4,'#52665e');metal.addColorStop(.65,'#b4bfa9');metal.addColorStop(1,'#20392e');
  this.ellipse(0,5,24,17,'#152c22', '#7a8b79',1);c.fillStyle=metal;c.fillRect(-26,-16,44,23);this.ellipse(-5,-16,22,9,metal,'#c9d0bc',1.3);this.ellipse(-5,7,23,8,metal);
  for(let y=-12;y<5;y+=2)this.line([{x:-25,y},{x:16,y}],'#9aa37d',.7);
  c.beginPath();c.ellipse(-5,-4,30,25,.1,Math.PI*.9,Math.PI*2.1);c.strokeStyle='#d1d6bd';c.lineWidth=1.6;c.stroke();
  const angle=g.reeling&&fighting?this.clock*10:1.2,arm={x:-24+Math.cos(angle)*20,y:19+Math.sin(angle)*17};this.line([{x:-24,y:10},arm],'#b6c1ac',3);this.ellipse(arm.x,arm.y,8,4,'#11261e');c.restore();
  const linePoints=[{x:reel.x-10*size,y:reel.y+2*size}];
  if(method==='ledger'&&!hand&&['waiting','bite'].includes(g.phase)){
   const lift=g.phase==='bite'?(g.biteStyle==='dropback'?1:-1)*(8+Math.sin(g.elapsed*9)*6):0,indicator={x:reel.x-34*size,y:reel.y+43*size+lift};
   linePoints.push(indicator);const glow=c.createLinearGradient(indicator.x-4,0,indicator.x+4,0);glow.addColorStop(0,'#6a7454');glow.addColorStop(.45,'#edefc0');glow.addColorStop(1,'#9cac73');this.ellipse(indicator.x,indicator.y,4*size,10*size,glow,'#303e2e',.8);
   this.line([{x:indicator.x,y:indicator.y+11*size},{x:indicator.x+3*size,y:h+15}],'rgba(170,182,157,.6)',.7);
  }
  linePoints.push(...guides,tip);
  let end=this.target;
  if(flying){const f=clamp(g.elapsed/1.1,0,1);end={x:mix(tip.x,this.target.x,f),y:mix(tip.y,this.target.y,f)-Math.sin(Math.PI*f)*h*.25};if(floating)this.drawFloat(end,true);else this.drawTerminal(end,size);}
  if(!['ready','casting','landed','escaped'].includes(g.phase)){
   this.line(linePoints,'rgba(219,228,203,.65)',.75*size);c.beginPath();c.moveTo(tip.x,tip.y);c.quadraticCurveTo(mix(tip.x,end.x,.5),mix(tip.y,end.y,.5)+(fighting?0:8),end.x,end.y);c.strokeStyle='rgba(220,230,208,.55)';c.lineWidth=.7*size;c.stroke();
  }
 }
 drawTerminal(p,size){const c=this.ctx,r=this.game.loadout.rig;
  if(RIGS[r].feeder){c.save();c.translate(p.x,p.y);c.rotate(this.clock*4);c.fillStyle='#8a7960';c.fillRect(-4*size,-7*size,8*size,14*size);for(let i=-3;i<=3;i+=2)this.line([{x:i*size,y:-7*size},{x:i*size,y:7*size}],'#bdc4a7',.6);for(const y of [-6,0,6])this.line([{x:-4*size,y:y*size},{x:4*size,y:y*size}],'#c6ceb0',.8);c.restore();}else this.ellipse(p.x,p.y,2*size,4*size,'#667363');
 }
 render(dt){if(!this.image)return;this.clock+=Math.max(0,dt);const g=this.game,targetPose=['held','fight'].includes(g.phase)?g.lifting?.9:.5:0;this.pose=mix(this.pose,targetPose,1-Math.exp(-Math.max(0,dt)*8));this.cachePhotograph();this.water();
  this.target=waterPoint(this.width,this.height,this.waterTop,g.distance||30,this.castYaw-this.yaw);
  this.drawRipples();this.drawFish();if(g.loadout.method==='float'&&['waiting','bite'].includes(g.phase))this.drawFloat(this.target,false);this.drawRig();
 }
 dispose(){window.removeEventListener('resize',this.onResize);}
}
