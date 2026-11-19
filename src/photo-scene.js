import {getVenue} from './venues.js?v=0.12.0';
import {biteMotion} from './bite-motion.js?v=0.12.0';
import {RODS,RIGS} from './tackle.js?v=0.12.0';

export const PHOTO=getVenue('vajgar').photo;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function photoCrop(iw,ih,w,h,yaw=0,pitch=0){
 const scale=Math.max(w/iw,h/ih),sw=w/scale,sh=h/scale;
 return {sx:clamp((iw-sw)/2+yaw*iw*.4,0,iw-sw),sy:clamp((ih-sh)/2+pitch*ih*.3,0,ih-sh),sw,sh,scale};
}
export function waterPoint(w,h,waterTop,distance,angle=0,waterBottom=null){
 const near=waterBottom===null?h*.84:waterBottom-14,far=waterBottom===null?Math.max(waterTop+18,h*.60):Math.min(near-12,waterTop+18),depth=clamp(Math.log1p(distance)/Math.log(65),0,1);
 return {x:w*(.50+Math.sin(angle)*.65),y:near+(far-near)*depth};
}
export function gearLayout(w,h,{hudTop=h*.82,headerBottom=90,index=0,count=1,pose=0,waterTop=h*.56}={}){
 const top=Math.min(headerBottom+12,h*.35),bottom=Math.max(top+55,Math.min(hudTop,h-30));
 const dual=count>1,portrait=h>w;
 // The butt and bank stick continue behind the controls and out of frame.
 // Keep the reel visible, while aiming the resting tip towards the water.
 const base={x:w*(dual?(index===0?.32:.80):.77),y:bottom+Math.min(55,(bottom-top)*.18)};
 const tip={x:w*(dual?(index===0?.17:.57):.38),y:clamp(Math.min(waterTop+24,bottom-95)-pose*h*.20,top+32,bottom-50)};
 const size=clamp(Math.min(w/(dual?750:520),h/480),portrait?.64:.65,1.05);
 return {base,tip,size,hudTop,headerBottom};
}
export function heldLayout(w,h,pose=0,cast=0){return {scale:Math.min(w*1.2,h*.70)/1536,angle:pose*.24-cast*.55,base:{x:w*.94,y:h*(h>w?.88:.97)-pose*20}};}
// A single photographed-style assembly keeps the reel, blank and support in one perspective.
// Feet stay on the pier, independent of changes in the controls above them.
export function restingLayout(w,h,{index=0,count=1,shoreTop=h*.75}={}){
 const portrait=h>w,dual=count>1,height=Math.min(h*(portrait?.70:.64),w*(dual?.92:1.2)),width=height*2/3;
 const footY=Math.max(shoreTop+18,h*.94),y=footY-height*.96;
 const right=dual?(index===0?w*.55:w*.99):w*.98;
 return {x:right-width,y,width,height,footY,at:(u,v)=>({x:right-width+u*width,y:y+v*height})};
}
function loadImage(path){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Fotografii Vajgaru se nepodařilo načíst.'));image.src=new URL('../'+path,import.meta.url).href;});}
function mix(a,b,t){return a+(b-a)*t;}
function point(a,b,c,t){const u=1-t;return {x:u*u*a.x+2*u*t*b.x+t*t*c.x,y:u*u*a.y+2*u*t*b.y+t*t*c.y};}

export class LakeScene{
 constructor(canvas,game){
  this.canvas=canvas;this.game=game;this.ctx=canvas.getContext('2d',{alpha:false});if(!this.ctx)throw new Error('Canvas 2D není dostupný.');
  this.clock=0;this.yaw=0;this.pitch=0;this.castYaw=0;this.pose=0;this.assetWarnings=[];this.photo=getVenue(game.venueId).photo;this.geoAccurate=false;this.ripples=[];this.feedThrow=null;this.poseByRod=[0,0];this.inset={};this.signalCanvas=null;this.signalVisible=true;this.signals=[];this.metrics={engine:'photographic-2d',drawImages:0};
  try{this.high=localStorage.getItem('reviry-quality')!=='low';}catch{this.high=true;}
  this.background=document.createElement('canvas');this.bctx=this.background.getContext('2d');this.lastView='';this.bindLook();this.onResize=()=>this.resize();window.addEventListener('resize',this.onResize);
 }
 async init(){this.image=await loadImage(this.photo.src);this.equipment={};await Promise.all([['rod','assets/equipment/rod-hand.webp'],['float','assets/equipment/waggler.webp'],['deck','assets/equipment/fishing-deck.webp'],['resting','assets/equipment/resting-feeder.webp'],['held','assets/equipment/held-feeder.webp']].map(async([key,path])=>{try{this.equipment[key]=await loadImage(path);}catch{this.assetWarnings.push(path);}}));this.resize();this.render(0);return this;}
 async setVenue(id){const photo=getVenue(id).photo,image=await loadImage(photo.src);this.photo=photo;this.image=image;this.yaw=0;this.pitch=0;this.ripples=[];this.feedThrow=null;this.lastView='';this.render(0);}
 resize(){this.width=innerWidth;this.height=innerHeight;this.ratio=Math.min(devicePixelRatio||1,this.high?1.75:1);for(const c of [this.canvas,this.background]){c.width=Math.round(this.width*this.ratio);c.height=Math.round(this.height*this.ratio);}this.ctx.setTransform(this.ratio,0,0,this.ratio,0,0);this.bctx.setTransform(this.ratio,0,0,this.ratio,0,0);this.lastView='';}
 setQuality(high){this.high=high;try{localStorage.setItem('reviry-quality',high?'high':'low');}catch{}this.resize();}
 bindLook(){let pointer=null,lastX=0,lastY=0;
  this.canvas.addEventListener('pointerdown',e=>{pointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;this.canvas.setPointerCapture(e.pointerId);});
  this.canvas.addEventListener('pointermove',e=>{if(pointer!==e.pointerId)return;this.yaw=clamp(this.yaw-(e.clientX-lastX)*.0005,-.12,.12);this.pitch=clamp(this.pitch-(e.clientY-lastY)*.0004,-.055,.055);lastX=e.clientX;lastY=e.clientY;});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])this.canvas.addEventListener(type,()=>pointer=null);
 }
 setUiBounds(bounds){this.inset=bounds;}
 setSignalCanvas(canvas){this.signalCanvas=canvas;}
 setSignalViews(views){this.signalViews=views;}
 setSignalVisible(visible){this.signalVisible=visible;}
 setCastDirection(){this.castYaw=this.yaw;}
 splash(index){const target=this.targets?.[index]||this.target;if(target)this.ripples.push({...target,time:this.clock});this.ripples=this.ripples.slice(-6);}
 scatterFeed(index){const target=this.targets?.[index]||this.target;if(target)this.feedThrow={time:this.clock,start:{x:this.width*.25,y:this.height},end:{...target}};}
 cachePhotograph(){
  const key=[this.yaw.toFixed(3),this.pitch.toFixed(3),this.width,this.height,this.photo.src].join('/');if(key===this.lastView)return;
  if(this.equipment.deck){const d=this.equipment.deck;this.deckCrop=photoCrop(d.width,d.height,this.width,this.height,this.yaw*.25,this.pitch*.25);this.shoreTop=clamp((d.height*.739-this.deckCrop.sy)*this.deckCrop.scale,0,this.height);}else this.shoreTop=this.height;
  // Frame the actual visible photograph above the pier, not the hidden area below it.
  const viewHeight=this.equipment.deck?this.height*.82:this.height,photoY=this.equipment.deck?this.shoreTop+8-viewHeight:0;
  const [rx,ry,rw,rh]=this.photo.crop||[0,0,1,1];this.crop=photoCrop(this.image.width*rw,this.image.height*rh,this.width,viewHeight,this.yaw,this.pitch);const p=this.crop;p.sx+=this.image.width*rx;p.sy+=this.image.height*ry;
  this.bctx.fillStyle='#1c2927';this.bctx.fillRect(0,0,this.width,this.height);this.bctx.drawImage(this.image,p.sx,p.sy,p.sw,p.sh,0,photoY,this.width,viewHeight);
  this.waterTop=clamp((this.image.height*this.photo.waterStart-p.sy)*p.scale+photoY,0,this.height);this.lastView=key;
 }
 ellipse(x,y,rx,ry,fill,stroke=null,width=1){const c=this.ctx;c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
 line(points,color,width=1){const c=this.ctx;c.beginPath();c.moveTo(points[0].x,points[0].y);for(const p of points.slice(1))c.lineTo(p.x,p.y);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();}
 water(){const c=this.ctx,w=this.width,h=this.height,r=this.ratio;c.drawImage(this.background,0,0,w,h);this.metrics.drawImages=1;
  const step=this.high?4:8;
  for(let y=Math.ceil(this.waterTop);y<Math.min(h,this.shoreTop);y+=step){
   const size=Math.min(step,this.shoreTop-y),depth=(y-this.waterTop)/Math.max(1,h-this.waterTop),wave=Math.sin(y*.11+this.clock*1.1)+Math.sin(y*.057-this.clock*.7)*.35;
   c.drawImage(this.background,0,y*r,w*r,size*r,wave*depth*1.7,y,w,size);this.metrics.drawImages++;
  }
 }
 drawRipples(){const c=this.ctx,t=this.clock;
  this.ripples=this.ripples.filter(p=>t-p.time<5);
  for(const p of this.ripples){const age=t-p.time;for(let i=0;i<3;i++){const f=age-i*.24;if(f<0)continue;const radius=5+f*19;this.ellipse(p.x,p.y,radius,radius*.17,null,`rgba(231,242,228,${Math.max(0,.45-f*.09)})`,1);}}
  if(this.feedThrow){const p=this.feedThrow,f=clamp((t-p.time)/.95,0,1);for(let i=0;i<20;i++){const x=mix(p.start.x,p.end.x+Math.sin(i*2.4)*18,f),y=mix(p.start.y,p.end.y+Math.cos(i*2.4)*4,f)-Math.sin(Math.PI*f)*(this.height*.22+i%3*5);this.ellipse(x,y,1.4,1.2,'#cfb77d');}if(f>=1){this.feedThrow=null;this.splash();}}
 }
 drawFloat(target,flying){
  const c=this.ctx,g=this.game,image=this.equipment?.float;if(!image)return;
  const height=clamp(23/Math.sqrt(Math.max(3,g.distance||20)),3.7,9)*10,width=height*image.width/image.height;
  const motion=biteMotion(g,this.clock),sink=motion.floatSink*height;
  const angle=flying?.65:motion.floatTilt;
  this.signals[this.drawIndex]={x:target.x,y:target.y,anchor:{...target},kind:'float'};
  c.save();c.translate(target.x,target.y);
  if(!flying){
   c.save();c.beginPath();c.rect(-width,-height,width*2,height);c.clip();c.translate(0,sink);c.rotate(angle);c.drawImage(image,-width/2,-height*.24,width,height);c.restore();
   // Light transmission below the real waterline, using the very same sprite.
   c.save();c.beginPath();c.rect(-width,0,width*2,height);c.clip();c.globalAlpha=.10;c.translate(0,sink);c.rotate(angle);c.drawImage(image,-width/2,-height*.24,width,height);c.restore();
  }else{c.rotate(angle);c.drawImage(image,-width/2,-height*.24,width,height);}
  c.restore();this.metrics.drawImages++;
 }
 drawPhotoHeld(){
  const image=this.equipment?.held;if(!image)return false;
  const c=this.ctx,g=this.game,cast=g.phase==='casting'?g.castPower:0,{scale,angle,base}=heldLayout(this.width,this.height,this.pose,cast);
  const transform=(u,v)=>{const x=(u-.83)*image.width*scale,y=(v-.88)*image.height*scale;return {x:base.x+x*Math.cos(angle)-y*Math.sin(angle),y:base.y+x*Math.sin(angle)+y*Math.cos(angle)};};
  const flex=(g.phase==='held'&&g.loadout.method==='feeder'?biteMotion(g,this.clock).feederFlex:0)+(g.phase==='fight'?g.tension*24:0),shift=v=>Math.pow(Math.max(0,1-v/.42),2)*flex;
  const rawTip=transform(.049,.039),tip={x:rawTip.x+shift(.039)*Math.cos(angle),y:rawTip.y+shift(.039)*Math.sin(angle)};this.tip=tip;
  c.save();c.translate(base.x,base.y);c.rotate(angle);c.filter='saturate(0.76) brightness(0.88)';
  const cut=Math.round(image.height*.42),x=-.83*image.width*scale,y=-.88*image.height*scale;
  if(Math.abs(flex)<.01)c.drawImage(image,x,y,image.width*scale,image.height*scale);
  else{c.drawImage(image,0,cut,image.width,image.height-cut,x,y+cut*scale,image.width*scale,(image.height-cut)*scale);for(let sy=0;sy<cut;sy+=3){const sh=Math.min(3,cut-sy);c.drawImage(image,0,sy,image.width,sh,x+shift(sy/image.height),y+sy*scale,image.width*scale,sh*scale+.2);}}
  c.restore();
  if(!['ready','casting','landed','escaped'].includes(g.phase)){
   let end=this.target;if(g.phase==='flying'){const f=clamp(g.elapsed/1.1,0,1);end={x:mix(tip.x,end.x,f),y:mix(tip.y,end.y,f)-Math.sin(Math.PI*f)*this.height*.20};if(g.loadout.method==='float')this.drawFloat(end,true);else this.drawTerminal(end,scale*3);}
   c.beginPath();c.moveTo(tip.x,tip.y);c.quadraticCurveTo(mix(tip.x,end.x,.5),mix(tip.y,end.y,.5)+5,end.x,end.y);c.strokeStyle='rgba(215,229,215,.34)';c.lineWidth=.55;c.stroke();
  }
  if(g.loadout.method==='feeder'&&g.phase==='held')this.signals[this.drawIndex]={...tip,anchor:rawTip,kind:'feeder'};
  this.metrics.heldPhoto=true;this.metrics.drawImages+=Math.abs(flex)<.01?1:1+Math.ceil(cut/3);return true;
 }
 drawPhotoResting(){
  const image=this.equipment?.resting;if(!image)return false;
  const c=this.ctx,g=this.game,{x,y,width,height,at,footY}=restingLayout(this.width,this.height,{index:this.drawIndex,count:this.drawCount,shoreTop:this.shoreTop});
  const feeder=g.loadout.method==='feeder',flex=feeder?biteMotion(g,this.clock).feederFlex:0;
  // Only the fine upper section bends. The support and reel never move with the bite.
  const shift=v=>Math.pow(Math.max(0,1-v/.42),2)*flex;
  const rawTip=at(.049,.039),tip={x:rawTip.x+shift(.039),y:rawTip.y};this.tip=tip;
  c.save();c.filter='saturate(0.76) brightness(0.88)';
  // Contact shadows under each foot tie the support to the wood rather than to the viewport.
  for(const [u,v] of [[.225,.947],[.501,.909],[.783,.947]]){const p=at(u,v);this.ellipse(p.x,p.y+2,width*.044,height*.006,'rgba(9,17,16,.23)');}
  const cut=Math.round(image.height*.42);if(Math.abs(flex)<.01){c.drawImage(image,x,y,width,height);}else{c.drawImage(image,0,cut,image.width,image.height-cut,x,y+height*cut/image.height,width,height*(1-cut/image.height));
  for(let sy=0;sy<cut;sy+=3){const sh=Math.min(3,cut-sy),v=sy/image.height;c.drawImage(image,0,sy,image.width,sh,x+shift(v),y+height*v,width,height*sh/image.height+.2);}}
  c.restore();this.metrics.restingPhoto=true;this.metrics.drawImages+=Math.abs(flex)<.01?1:1+Math.ceil(cut/3);
  const guides=[[.096,.079],[.139,.117],[.178,.157],[.231,.214],[.305,.295],[.407,.413]].map(([u,v])=>{const p=at(u,v);return {x:p.x+shift(v),y:p.y};});
  const reel=at(.65,.762),points=[reel];
  if(!feeder&&['waiting','bite'].includes(g.phase)){
   const origin=at(.43,.80),limit=this.height>this.width?(this.inset.hudTop??this.height*.82)-26:Infinity;
   const anchor={x:origin.x,y:Math.min(origin.y,limit)},motion=biteMotion(g,this.clock).ledgerLift;
   const indicator={x:anchor.x,y:anchor.y+motion};
   this.signals[this.drawIndex]={...indicator,anchor,kind:'ledger'};
   points.push(indicator);const grad=c.createLinearGradient(indicator.x-3,0,indicator.x+3,0);grad.addColorStop(0,'#4e5941');grad.addColorStop(.45,'#c6cca0');grad.addColorStop(1,'#7f8d60');
   this.ellipse(indicator.x,indicator.y,3.5,7,grad,'#28332b',.6);
   const tether=at(.50,.91);this.line([{x:indicator.x,y:indicator.y+7},tether],'rgba(100,115,94,.6)',.55);
  }
  if(feeder)this.signals[this.drawIndex]={...tip,anchor:rawTip,kind:'feeder'};
  if(!['ready','landed','escaped'].includes(g.phase)){
   points.push(...guides.reverse(),tip);this.line(points,'rgba(208,221,208,.34)',.55);
   const end=this.target;c.beginPath();c.moveTo(tip.x,tip.y);c.quadraticCurveTo(mix(tip.x,end.x,.5),mix(tip.y,end.y,.5)+5,end.x,end.y);c.strokeStyle='rgba(217,229,216,.32)';c.lineWidth=.55;c.stroke();
  }
  return true;
 }
 drawFish(){const g=this.game;if(g.phase!=='fight'||g.distance>8)return;
  const c=this.ctx,p=this.target,s=clamp(8/g.distance,.9,2.2)*(g.fish?.length||50)/60;
  c.save();c.translate(p.x,p.y);c.rotate(Math.sin(this.clock*1.7)*.2);c.scale(s,s*.42);c.globalAlpha=.55;
  const gradient=c.createLinearGradient(0,-8,0,8);gradient.addColorStop(0,'#293d30');gradient.addColorStop(.45,g.fish?.id==='bream'?'#b0afa0':'#a59057');gradient.addColorStop(1,'#5e7154');
  this.ellipse(0,0,22,8,gradient);c.fillStyle='#616e4b';c.beginPath();c.moveTo(-19,0);c.lineTo(-31+Math.sin(this.clock*9)*2,-9);c.lineTo(-28,0);c.lineTo(-31+Math.sin(this.clock*9)*2,9);c.closePath();c.fill();c.restore();
  this.ellipse(p.x,p.y,35+Math.sin(this.clock*4)*4,5,null,'rgba(223,236,222,.35)',1);
 }
 drawRig(){const c=this.ctx,g=this.game,w=this.width,h=this.height,method=g.loadout.method,floating=method==='float',fighting=g.phase==='fight',held=g.phase==='held',casting=g.phase==='casting',flying=g.phase==='flying';
  const hand=floating||fighting||held||casting||flying||g.time-g.lastStrikeAt<.55;if(hand&&this.drawPhotoHeld())return;if(!hand&&this.drawPhotoResting())return;const layout=gearLayout(w,h,{...this.inset,index:this.drawIndex,count:this.drawCount,pose:this.pose,waterTop:this.waterTop});const {base,size}=layout;let tip={...layout.tip};
  if(casting){tip.x+=w*g.castPower*.14;tip.y-=h*g.castPower*.15;}
  const bend=fighting?g.tension*48:method==='feeder'?7+(g.phase==='bite'?(8+Math.sin(g.elapsed*10)*6)*(g.biteStyle==='dropback'?-1:1):0):0;
  const control={x:mix(base.x,tip.x,.48)+bend*size,y:mix(base.y,tip.y,.45)-bend*.3*size};
  const rawTip={...tip},dx=tip.x-base.x,dy=tip.y-base.y,length=Math.hypot(dx,dy),normal={x:-dy/length,y:dx/length};
  const signal=method==='feeder'?biteMotion(g,this.clock).feederFlex*size:0;
  const sample=t=>{const p=point(base,control,rawTip,t),flex=Math.pow(Math.max(0,(t-.70)/.30),2)*signal;return {x:p.x+normal.x*flex,y:p.y+normal.y*flex};};
  tip=sample(1);this.tip=tip;if(method==='feeder')this.signals[this.drawIndex]={...tip,anchor:{...rawTip},kind:'feeder'};
  if(!floating&&!hand){
   const rest=sample(.66),foot={x:rest.x+12*size,y:h+35};
   // One slender bank stick, planted below the photograph's foreground edge.
   this.line([foot,{x:rest.x,y:rest.y+4*size}],'#101a19',4*size);
   this.line([{x:foot.x-1,y:foot.y},{x:rest.x-1,y:rest.y+5*size}],'#65716a',1*size);
   this.line([{x:rest.x-9*size,y:rest.y-3*size},{x:rest.x-5*size,y:rest.y+4*size},{x:rest.x+5*size,y:rest.y+4*size},{x:rest.x+9*size,y:rest.y-3*size}],'#172522',4*size);
  }
  const rodGradient=c.createLinearGradient(base.x,base.y,tip.x,tip.y);rodGradient.addColorStop(0,'#151c18');rodGradient.addColorStop(.45,'#263b33');rodGradient.addColorStop(.8,'#0d201b');rodGradient.addColorStop(1,method==='feeder'?'#e5a25c':'#303f34');
  for(let i=0;i<40;i++){const a=sample(i/40),b=sample((i+1)/40);this.line([a,b],'rgba(228,235,216,.16)',(5*(1-i/40)+1)*size);this.line([a,b],method==='feeder'&&i>=32?(i%3===0?'#fff2ce':'#e99745'):rodGradient,(4*(1-i/40)+.7)*size);}
  const gripEnd=sample(.42),gripPhoto=this.equipment?.rod;
  if(gripPhoto){const dx=gripEnd.x-base.x,dy=gripEnd.y-base.y;c.save();c.translate(base.x,base.y);c.rotate(Math.atan2(dy,dx)-Math.PI/2);c.drawImage(gripPhoto,gripPhoto.width*.78,gripPhoto.height*.32,gripPhoto.width*.075,gripPhoto.height*.12,-5*size,0,10*size,Math.hypot(dx,dy));c.restore();}
  const guides=[];for(let i=0;i<7;i++){const f=.68+i*.048,p=sample(f);guides.push({x:p.x-4*size,y:p.y+5*size});this.ellipse(p.x-4*size,p.y+5*size,(5-i*.54)*size,(3.2-i*.3)*size,null,'#bcc5ba',.9*size);}
  const reel=sample(.54),photo=this.equipment?.rod;
  if(photo){
   // Photograph of the reel, without the hand, for rods resting in a bank stick.
   const width=65*size,height=width*1.22;
   c.save();c.translate(reel.x-16*size,reel.y+8*size);c.rotate(-.30);c.drawImage(photo,photo.width*.115,photo.height*.32,photo.width*.52,photo.height*.47,-width*.56,-height*.40,width,height);c.restore();this.metrics.drawImages++;
  }
  const linePoints=[{x:reel.x-10*size,y:reel.y+2*size}];
  if(method==='ledger'&&!hand&&['waiting','bite'].includes(g.phase)){
   const lift=biteMotion(g,this.clock).ledgerLift,indicator={x:reel.x-28*size,y:clamp(Math.min(reel.y+28*size,layout.hudTop-36)+lift,layout.headerBottom+20,layout.hudTop-24)};
   this.signals[this.drawIndex]={...indicator,anchor:{x:indicator.x,y:clamp(Math.min(reel.y+28*size,layout.hudTop-36),layout.headerBottom+20,layout.hudTop-24)},kind:'ledger'};linePoints.push(indicator);const glow=c.createLinearGradient(indicator.x-4,0,indicator.x+4,0);glow.addColorStop(0,'#6a7454');glow.addColorStop(.45,'#edefc0');glow.addColorStop(1,'#9cac73');this.ellipse(indicator.x,indicator.y,6*size,12*size,glow,'#303e2e',.8);
   this.line([{x:indicator.x,y:indicator.y+11*size},{x:indicator.x+3*size,y:h+25}],'rgba(170,182,157,.6)',.7);
  }
  linePoints.push(...guides,tip);
  let end=this.target;
  if(flying){const f=clamp(g.elapsed/1.1,0,1);end={x:mix(tip.x,this.target.x,f),y:mix(tip.y,this.target.y,f)-Math.sin(Math.PI*f)*h*.25};if(floating)this.drawFloat(end,true);else this.drawTerminal(end,size);}
  if(!['ready','casting','landed','escaped'].includes(g.phase)){
   this.line(linePoints,'rgba(219,228,203,.40)',.75*size);c.beginPath();c.moveTo(tip.x,tip.y);c.quadraticCurveTo(mix(tip.x,end.x,.5),mix(tip.y,end.y,.5)+(fighting?0:8),end.x,end.y);c.strokeStyle='rgba(220,230,208,.38)';c.lineWidth=.7*size;c.stroke();
  }
 }
 drawTerminal(p,size){const c=this.ctx,r=this.game.loadout.rig;
  if(RIGS[r].feeder){c.save();c.translate(p.x,p.y);c.rotate(this.clock*4);c.fillStyle='#8a7960';c.fillRect(-4*size,-7*size,8*size,14*size);for(let i=-3;i<=3;i+=2)this.line([{x:i*size,y:-7*size},{x:i*size,y:7*size}],'#bdc4a7',.6);for(const y of [-6,0,6])this.line([{x:-4*size,y:y*size},{x:4*size,y:y*size}],'#c6ceb0',.8);c.restore();}else this.ellipse(p.x,p.y,2*size,4*size,'#667363');
 }
 paintSignal(active,canvas=this.signalCanvas,force=false){
  const target=this.signals[active];if(!target||!canvas||(!force&&!this.signalVisible))return;
  // Fixed optical axis: following the moving tip would hide the bite itself.
  const anchor=target.anchor||target,roi=target.kind==='float'?54:target.kind==='ledger'?110:130;
  const roiHeight=roi*canvas.height/canvas.width,sx=anchor.x-roi/2,sy=anchor.y-roiHeight/2-(target.kind==='float'?8:0);
  const ctx=canvas.getContext('2d'),mainCtx=this.ctx,metrics={...this.metrics};
  const saved={signals:this.signals,targets:this.targets,target:this.target,tip:this.tip,drawIndex:this.drawIndex,pose:this.pose};
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.setTransform(canvas.width/roi,0,0,canvas.height/roiHeight,-sx*canvas.width/roi,-sy*canvas.height/roiHeight);
  try{this.ctx=ctx;this.drawFrame(0);}finally{this.ctx=mainCtx;ctx.restore();Object.assign(this,saved);this.metrics={...metrics,opticalDetail:true};}
 }
 render(dt){if(!this.image)return;this.clock+=Math.max(0,dt);this.cachePhotograph();this.drawFrame(dt);if(this.signalViews?.length){for(const v of this.signalViews)this.paintSignal(v.index,v.canvas,true);}else this.paintSignal(this.game.activeIndex||0);}
 drawFrame(dt){this.water();this.ctx.save();this.ctx.beginPath();this.ctx.rect(0,this.waterTop,this.width,Math.max(0,this.shoreTop-this.waterTop));this.ctx.clip();this.drawRipples();this.ctx.restore();
  if(this.equipment.deck){const d=this.equipment.deck,p=this.deckCrop;this.ctx.drawImage(d,p.sx,p.sy,p.sw,p.sh,0,0,this.width,this.height);this.metrics.drawImages++;}

  const session=this.game,rods=session.enabledRods||[session],active=session.activeIndex||0;this.drawCount=rods.length;this.targets=[];this.signals=[];
  for(let i=0;i<rods.length;i++){
   const g=rods[i];this.game=g;this.drawIndex=i;
   const strikePulse=Math.max(0,1-(g.time-g.lastStrikeAt)/.55);const targetPose=Math.max(['held','fight'].includes(g.phase)?g.lifting?.9:.5:0,strikePulse*.85);this.poseByRod[i]=mix(this.poseByRod[i],targetPose,1-Math.exp(-Math.max(0,dt)*8));this.pose=this.poseByRod[i];
   this.target=waterPoint(this.width,this.height,this.waterTop,g.distance||30,(g.castAngle||0)-this.yaw+(rods.length>1?(i===0?-.05:.05):0),this.equipment.deck?this.shoreTop:null);if(g.loadout.method==='float')this.target.x-=this.width*.12;this.targets.push({...this.target});
   this.drawFish();if(g.loadout.method==='float'&&['waiting','bite'].includes(g.phase))this.drawFloat(this.target,false);this.drawRig();
  }
  this.game=session;this.target=this.targets[active];
 }

 dispose(){window.removeEventListener('resize',this.onResize);}
}
