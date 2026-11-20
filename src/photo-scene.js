import {STATIONS,stationFor,stationLayout} from './stations.js?v=0.24.0';
import {RodPresentation,environmentAt,handResponse} from './immersion.js?v=0.24.0';
import {runForce} from './encounter.js?v=0.24.0';
import {tripConditions} from './trip.js?v=0.24.0';
import {getVenue} from './venues.js?v=0.24.0';
import {biteMotion} from './bite-motion.js?v=0.24.0';
import {RODS,RIGS} from './tackle.js?v=0.24.0';

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
export function aimAtPoint(w,h,waterTop,shoreTop,x,y,yaw=0){
 const near=shoreTop-14,far=Math.min(near-12,waterTop+18);if(y<far||y>near||x<0||x>w)return null;
 const depth=clamp((y-near)/(far-near),0,1),angle=Math.asin(clamp((x/w-.5)/.65,-1,1))+yaw;
 return {distance:Math.expm1(depth*Math.log(65)),angle};
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
// Feet stay on the bank, independent of changes in the controls above them.
export function restingLayout(w,h,{index=0,count=1,shoreTop=h*.75}={}){
 const portrait=h>w,dual=count>1,height=Math.min(h*(portrait?.70:.64),w*(dual?.92:1.2)),width=height*2/3;
 const footY=Math.max(shoreTop+18,h*.94),y=footY-height*.96;
 const right=dual?(index===0?w*.55:w*.99):w*.98;
 return {x:right-width,y,width,height,footY,at:(u,v)=>({x:right-width+u*width,y:y+v*height})};
}
function loadImage(path){return new Promise((resolve,reject)=>{const image=new Image();let timer;image.onload=()=>{clearTimeout(timer);resolve(image);};image.onerror=()=>{clearTimeout(timer);reject(new Error('Fotografii vybraného revíru se nepodařilo načíst.'));};if(/^https:\/\//.test(path))timer=setTimeout(()=>reject(new Error('Externí fotografie neodpovídá.')),12000);image.src=/^https:\/\//.test(path)?path:new URL('../'+path,import.meta.url).href;});}
function mix(a,b,t){return a+(b-a)*t;}
function point(a,b,c,t){const u=1-t;return {x:u*u*a.x+2*u*t*b.x+t*t*c.x,y:u*u*a.y+2*u*t*b.y+t*t*c.y};}

export class LakeScene{
 constructor(canvas,game){
  this.canvas=canvas;this.game=game;this.ctx=canvas.getContext('2d',{alpha:false});if(!this.ctx)throw new Error('Canvas 2D není dostupný.');
  this.clock=0;this.yaw=0;this.pitch=0;this.castYaw=0;this.pose=0;this.assetWarnings=[];this.venueId=getVenue(game.venueId).id;this.photo=getVenue(game.venueId).photo;this.geoAccurate=false;this.ripples=[];this.feedThrow=null;this.poseByRod=[0,0];this.motionByRod=[];this.heldAngleByRod=[0,0];this.motionFrameDt=1/60;this.inset={};this.signalCanvas=null;this.signalVisible=true;this.signals=[];this.metrics={engine:'photographic-2d',drawImages:0};
  try{this.high=localStorage.getItem('reviry-quality')!=='low';const pref=localStorage.getItem('reviry-wide-view');this.widePreference=pref===null?null:pref==='on';this.wideView=this.widePreference??(this.venueId==='jarosov');}catch{this.high=true;this.widePreference=null;this.wideView=this.venueId==='jarosov';}
  this.photoLayer=document.createElement('canvas');this.photoCtx=this.photoLayer.getContext('2d');this.background=document.createElement('canvas');this.bctx=this.background.getContext('2d');this.lastView='';this.bindLook();this.onResize=()=>this.resize();window.addEventListener('resize',this.onResize);
 }
 async init(){const loaded=await this.loadVenuePhoto(this.photo);this.photo=loaded.photo;this.image=loaded.image;this.equipment={};this.stationImages={};await Promise.all(Object.entries(STATIONS).map(async([key,station])=>{this.stationImages[key]=await loadImage(station.src);}));await Promise.all([['rod','assets/equipment/rod-hand.webp'],['float','assets/equipment/waggler.webp'],['resting','assets/equipment/resting-feeder.webp'],['held','assets/equipment/held-feeder.webp'],['animatedHeld','assets/equipment/held-animated.webp'],['windingHand','assets/equipment/winding-hand.webp'],['emptyStand','assets/equipment/empty-tripod.webp'],['reeds','assets/equipment/shore-reeds.webp'],['bobbin','assets/equipment/bobbin-photo.webp']].map(async([key,path])=>{try{this.equipment[key]=await loadImage(path);}catch{this.assetWarnings.push(path);}}));this.resize();this.render(0);return this;}
 async loadVenuePhoto(photo){try{return {photo,image:await loadImage(photo.src)};}catch(error){if(!photo.fallback)throw error;return {photo:{...photo.fallback,externalUnavailable:true},image:await loadImage(photo.fallback.src)};}}
 async setVenue(id){const loaded=await this.loadVenuePhoto(getVenue(id).photo);this.photo=loaded.photo;this.image=loaded.image;this.venueId=getVenue(id).id;if(this.widePreference===null)this.wideView=this.venueId==='jarosov';this.yaw=0;this.pitch=0;this.heldAngleByRod=[0,0];this.ripples=[];this.feedThrow=null;this.lastView='';this.render(0);}
 setWideView(value){this.wideView=Boolean(value);this.widePreference=this.wideView;try{localStorage.setItem('reviry-wide-view',this.wideView?'on':'off');}catch{}this.lastView='';this.render(0);}
 resize(){this.width=innerWidth;this.height=innerHeight;this.ratio=Math.min(devicePixelRatio||1,this.high?1.75:1);for(const c of [this.canvas,this.background,this.photoLayer]){c.width=Math.round(this.width*this.ratio);c.height=Math.round(this.height*this.ratio);}this.ctx.setTransform(this.ratio,0,0,this.ratio,0,0);this.bctx.setTransform(this.ratio,0,0,this.ratio,0,0);this.photoCtx.setTransform(this.ratio,0,0,this.ratio,0,0);this.lastView='';}
 setQuality(high){this.high=high;try{localStorage.setItem('reviry-quality',high?'high':'low');}catch{}this.resize();}
 bindLook(){let pointer=null,lastX=0,lastY=0,startX=0,startY=0,moved=false;
  this.canvas.addEventListener('pointerdown',e=>{pointer=e.pointerId;startX=lastX=e.clientX;startY=lastY=e.clientY;moved=false;this.canvas.setPointerCapture(e.pointerId);});
  this.canvas.addEventListener('pointermove',e=>{if(pointer!==e.pointerId)return;if(Math.hypot(e.clientX-startX,e.clientY-startY)>6)moved=true;if(moved){this.yaw=clamp(this.yaw-(e.clientX-lastX)*.0005,-.12,.12);this.pitch=clamp(this.pitch-(e.clientY-lastY)*.0004,-.055,.055);}lastX=e.clientX;lastY=e.clientY;});
  this.canvas.addEventListener('pointerup',e=>{if(pointer!==e.pointerId)return;if(!moved){const aim=aimAtPoint(this.width,this.height,this.waterTop,this.shoreTop,e.clientX,e.clientY,this.yaw);if(aim)this.onAim?.(aim);}pointer=null;});
  for(const type of ['pointercancel','lostpointercapture'])this.canvas.addEventListener(type,()=>pointer=null);
 }
 setUiBounds(bounds){this.inset=bounds;}
 setSignalCanvas(canvas){this.signalCanvas=canvas;}
 setSignalViews(views){this.signalViews=views;}
 setSignalVisible(visible){this.signalVisible=visible;}
 setCastDirection(){this.castYaw=this.yaw;}
 splash(index){const target=this.targets?.[index]||this.target;if(target)this.ripples.push({...target,time:this.clock,distance:this.game.rods?.[index]?.distance||this.game.distance||20});this.ripples=this.ripples.slice(-6);}
 scatterFeed(index,landing=null){const target=landing?waterPoint(this.width,this.height,this.waterTop,landing.distance,landing.angle-this.yaw,this.shoreTop):this.targets?.[index]||this.target;if(target)this.feedThrow={time:this.clock,start:{x:this.width*.25,y:this.height},end:{...target},distance:landing?.distance||this.game.rods?.[index]?.distance||this.game.distance||20};}
 cachePhotograph(){
  const key=[this.yaw.toFixed(3),this.pitch.toFixed(3),this.width,this.height,this.photo.src,this.wideView].join('/');if(key===this.lastView)return;
  this.station=stationFor(this.venueId);this.stationImage=this.stationImages[Object.keys(STATIONS).find(key=>STATIONS[key]===this.station)];this.bankLayout=stationLayout(this.width,this.height,this.stationImage,this.station);this.shoreTop=this.bankLayout.shoreTop;
  const [rx,ry,rw,rh]=this.photo.crop||[0,0,1,1],iw=this.image.width,ih=this.image.height;
  const wide=this.wideView&&this.height>this.width;
  let viewHeight=this.height*.82,photoY=this.shoreTop+8-viewHeight;
  if(wide){viewHeight=Math.min(this.height*.65,this.width*(ih*rh)/(iw*rw));const scale=viewHeight/(ih*rh);photoY=this.height*.36-(ih*this.photo.waterStart-ih*ry)*scale+this.pitch*this.height*.3;}
  this.crop=photoCrop(iw*rw,ih*rh,this.width,viewHeight,this.yaw,this.pitch);const p=this.crop;p.sx+=iw*rx;p.sy+=ih*ry;
  this.bctx.fillStyle='#1c2927';this.bctx.fillRect(0,0,this.width,this.height);
  if(wide){
   // The shore uses uniform source scaling. Only sky/water are extended.
   const sky=this.photo.sky||['#a8bbc4','#c1d0d5'],gradient=this.bctx.createLinearGradient(0,0,0,Math.max(1,photoY+20));gradient.addColorStop(0,sky[0]);gradient.addColorStop(1,sky[1]);this.bctx.fillStyle=gradient;this.bctx.fillRect(0,0,this.width,this.shoreTop+12);
   const end=photoY+viewHeight,band=this.photo.waterBand||[rx+rw*.06,ry+rh*.72,rw*.78,rh*.25],bandH=ih*band[3],waterScale=this.width/(iw*band[2]),sourceHeight=Math.min(bandH,2/waterScale);
   // Sample water rows at their natural scale, reflecting within a safe water-only band.
   for(let y=Math.max(0,end-24);y<this.shoreTop+12;y+=2){const q=((y-(end-24))/waterScale)%(bandH*2),sy=ih*band[1]+Math.min(bandH-sourceHeight,q<bandH?q:bandH*2-q);this.bctx.drawImage(this.image,iw*band[0],sy,iw*band[2],sourceHeight,0,y,this.width,2.1);}
   // Mask the edges on a separate transparent layer; draw the actual photograph once.
   const layer=this.photoCtx;layer.clearRect(0,0,this.width,this.height);layer.drawImage(this.image,p.sx,p.sy,p.sw,p.sh,0,photoY,this.width,viewHeight);
   const mask=layer.createLinearGradient(0,photoY,0,end);mask.addColorStop(0,'rgba(0,0,0,0)');mask.addColorStop(Math.min(.2,16/viewHeight),'#000');mask.addColorStop(Math.max(.8,1-24/viewHeight),'#000');mask.addColorStop(1,'rgba(0,0,0,0)');layer.globalCompositeOperation='destination-in';layer.fillStyle=mask;layer.fillRect(0,0,this.width,this.height);layer.globalCompositeOperation='source-over';this.bctx.drawImage(this.photoLayer,0,0,this.width,this.height);
  }else {
   // Keep water underneath the irregular transparent bank edge, including its central dip.
   const band=this.photo.waterBand||[.1,.7,.7,.15];
   this.bctx.drawImage(this.image,iw*band[0],ih*band[1],iw*band[2],ih*band[3],0,this.shoreTop-20,this.width,this.height-this.shoreTop+20);
   this.bctx.drawImage(this.image,p.sx,p.sy,p.sw,p.sh,0,photoY,this.width,viewHeight);
  }
  this.waterTop=clamp((ih*this.photo.waterStart-p.sy)*p.scale+photoY,0,this.height);this.lastView=key;
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
 drawSurface(){
  const c=this.ctx,w=this.width,h=Math.max(0,this.shoreTop-this.waterTop),env=environmentAt(this.clock);if(h<4)return;
  c.save();c.beginPath();c.rect(0,this.waterTop,w,h);c.clip();
  for(let i=0;i<(this.high?32:18);i++){const x=((Math.sin(i*91.73)*43758.54)%1+1)%1*w,y=this.waterTop+h*(.15+((i*37%97)/97)*.85),phase=Math.sin(this.clock*(.65+i%3*.11)+i*2.13),alpha=Math.pow(Math.max(0,phase),8)*(.045+env.gust*.055);
   if(alpha<.008)continue;this.line([{x:x-3-i%4,y},{x:x+3+i%4,y:y+.2}],`rgba(237,239,215,${alpha})`,.6);
  }c.restore();
 }
 drawLife(){const c=this.ctx,w=this.width,top=this.waterTop,bottom=this.shoreTop,light=tripConditions(this.game.trip).light;if(bottom<=top)return;c.save();c.beginPath();c.rect(0,top,w,bottom-top);c.clip();
  const age=(this.clock+7)%31,cycle=Math.floor((this.clock+7)/31);if(age<3.8){const x=w*(.18+((cycle*37%67)/100)),y=top+(bottom-top)*(.28+(cycle*13%38)/100);for(let i=0;i<2;i++){const t=age-i*.3;if(t>=0)this.ellipse(x,y,3+t*8,(3+t*8)*.18,null,`rgba(219,234,217,${Math.max(0,.22-t*.055)})`,.7);}}
  if(light>.3&&(this.clock%13)<5)for(let i=0;i<3;i++){const t=this.clock+i*3,x=w*(.22+i*.23)+Math.sin(t*2.7)*8,y=bottom-14-i*4+Math.cos(t*3.4)*4;this.ellipse(x,y,.65,.5,'rgba(226,221,186,.38)');}c.restore();
 }
 drawAimAndFeed(){const g=this.game,active=g.active||g;if(!active)return;const point=p=>waterPoint(this.width,this.height,this.waterTop,p.distance,p.angle-this.yaw,this.shoreTop);
  if(['ready','escaped','casting','waiting'].includes(active.phase)){const p=point({distance:active.aimDistance,angle:active.aimAngle});this.ellipse(p.x,p.y,10,3,null,'rgba(231,217,165,.7)',.9);this.line([{x:p.x-4,y:p.y},{x:p.x+4,y:p.y}],'rgba(231,217,165,.65)',.7);}
  const spots=active.feedSpots||[];for(const spot of spots){const age=active.time-spot.time;if(age>300)continue;const p=point(spot);this.ellipse(p.x,p.y,14,4,null,`rgba(210,189,123,${Math.max(0,.35*(1-age/300))})`,.7);}
 }
 drawNet(){const g=this.game;if(g.phase!=='fight'||!g.netDeployed)return;const p=waterPoint(this.width,this.height,this.waterTop,clamp(g.distance,2.2,3.3),g.netAngle-this.yaw,this.shoreTop),r=clamp(this.width*.065,22,65),c=this.ctx;
  this.line([{x:p.x+r*.65,y:p.y+3},{x:this.width*.94,y:this.height+20}],'#303a35',4);this.ellipse(p.x,p.y,r,r*.22,'rgba(24,41,35,.12)',g.netProgress>0?'rgba(217,206,158,.85)':'rgba(159,174,153,.8)',1.7);
  c.save();c.beginPath();c.ellipse(p.x,p.y,r,r*.22,0,0,Math.PI*2);c.clip();for(let x=-r;x<=r;x+=8)this.line([{x:p.x+x,y:p.y-r*.22},{x:p.x+x+r*.35,y:p.y+r*.22}],'rgba(108,131,114,.32)',.6);c.restore();
 }
 drawReeds(){const image=this.equipment?.reeds;if(!image||!this.station.reeds)return;const c=this.ctx,h=this.height*(this.height>this.width?.30:.40),w=h*image.width/image.height,env=environmentAt(this.clock),x=-w*.1,y=this.height-h+8;
  c.save();c.globalAlpha=this.station.reeds;c.filter='saturate(.72) brightness(.84)';const step=this.high?8:16;
  for(let sy=0;sy<image.height;sy+=step){const sh=Math.min(step,image.height-sy),v=sy/image.height,shift=env.sway*(1.2+env.gust*3)*Math.pow(1-v,2);c.drawImage(image,0,sy,image.width,sh,x+shift,y+v*h,w,sh/image.height*h+.15);}c.restore();
 }
 drawEmptyStand(){const image=this.equipment?.emptyStand;if(!image)return;const {x,y,width,height,at}=restingLayout(this.width,this.height,{index:this.drawIndex,count:this.drawCount,shoreTop:this.shoreTop});
  for(const [u,v] of [[.225,.947],[.501,.909],[.783,.947]]){const p=at(u,v);this.ellipse(p.x,p.y+2,width*.044,height*.006,'rgba(9,17,16,.23)');}
  this.ctx.save();this.ctx.filter='saturate(.76) brightness(.88)';this.ctx.drawImage(image,x,y,width,height);this.ctx.restore();
 }
 drawHangingBobbin(indicator,tether,lift=0,size=1){
  const c=this.ctx,image=this.equipment?.bobbin,height=25*size,width=image?height*image.width/image.height:7*size,tilt=Math.sin(this.clock*.9+this.drawIndex)*.015+clamp(lift,-30,30)*.0007;
  // The fishing line contacts the steel balls, not the middle of the body.
  const eye={x:indicator.x-Math.sin(tilt)*height*.94,y:indicator.y+Math.cos(tilt)*height*.94},sag=clamp(8+lift*.25,2,16)*size;
  c.save();c.beginPath();c.moveTo(eye.x,eye.y);c.quadraticCurveTo((eye.x+tether.x)/2,(eye.y+tether.y)/2+sag,tether.x,tether.y);c.strokeStyle='rgba(17,28,24,.8)';c.lineWidth=1*size;c.stroke();c.strokeStyle='rgba(140,153,133,.55)';c.lineWidth=.35*size;c.stroke();
  c.translate(indicator.x,indicator.y);c.rotate(tilt);
  if(image){c.filter='saturate(.78) brightness(.94)';c.drawImage(image,-width/2,-height*.035,width,height);this.metrics.drawImages++;this.metrics.bobbinPhoto=true;}
  else{c.fillStyle='#d2d1b7';c.strokeStyle='#5b6555';c.lineWidth=.6;c.beginPath();c.roundRect(-width/2,height*.32,width,height*.57,width*.35);c.fill();c.stroke();c.fillStyle='#29322c';c.fillRect(-width*.17,0,width*.34,height*.34);}
  c.restore();
 }
 drawReel(image,x,y,scale,g,m){if(!this.equipment?.animatedHeld||!m)return;const c=this.ctx,ax=x+image.width*.681*scale,ay=y+image.height*.810*scale,ex=ax+Math.cos(m.crank)*48*scale,ey=ay+Math.sin(m.crank)*62*scale;
  this.line([{x:ax,y:ay},{x:ex,y:ey}],'#303a39',5*scale);this.line([{x:ax-.6,y:ay-.5},{x:ex-.6,y:ey-.5}],'#aeb5ae',2.4*scale);this.ellipse(ex,ey,9*scale,5*scale,'#202a29','#7e8780',.5);
  // Separate winding hand follows the handle; it does not orbit like a rigid arm.
  if(this.equipment.windingHand&&m.reach>.015){const hand=this.equipment.windingHand;c.save();c.globalAlpha=m.reach;c.translate(ex,ey+(1-m.reach)*170*scale);c.rotate(Math.sin(m.crank)*.025);c.drawImage(hand,-280*scale,-72*scale,hand.width*scale,hand.height*scale);c.restore();this.metrics.windingHand=true;}
  const sx=x+image.width*.65*scale,sy=y+image.height*.754*scale,turn=m.lineOut>.05?m.spool:m.rotor;
  if(m.lineOut>.05||g.reeling){c.save();c.translate(sx,sy);c.rotate(-.22);c.beginPath();c.ellipse(0,0,30*scale,12*scale,0,turn,turn+Math.PI*.8);c.strokeStyle='rgba(224,232,215,.65)';c.lineWidth=1.5*scale;c.stroke();c.restore();}
 }
 drawWaterResponse(){const g=this.game;if(g.phase!=='fight')return;const c=this.ctx,p=this.target,effort=runForce(g.run),rate=Math.max(0,g.lineOutRate||0),near=clamp(13/Math.max(3,g.distance),.25,2),size=(3+effort*11+rate*3)*near;
  c.save();c.beginPath();c.rect(0,this.waterTop,this.width,Math.max(0,this.shoreTop-this.waterTop));c.clip();
  if(effort>.15||rate>.08){const trail=(g.fishBearing||0)*45;for(let i=0;i<3;i++){const age=((g.elapsed*1.2+i*.33)%1),r=size*(.3+age);this.ellipse(p.x-trail*age,p.y+age*3,r,r*.17,null,`rgba(215,231,217,${(1-age)*.16})`,.75);}}
  if(g.distance<8&&effort>.6){for(let i=0;i<5;i++){const f=(g.run.age*2+i*.2)%1;this.ellipse(p.x+Math.sin(i*3.7)*size*f,p.y-Math.sin(f*Math.PI)*5*near,.65,.45,`rgba(226,238,224,${(1-f)*.25})`);}}
  c.restore();
 }
 drawLighting(){
  const c=this.ctx,{light,warmth,darkness,morning}=tripConditions(this.game.trip),w=this.width,h=this.height;
  // Grade the whole scene, including rods and foreground, in the same light.
  c.save();if(warmth>.005){c.fillStyle=`rgba(217,145,78,${warmth*.6})`;c.fillRect(0,0,w,h);}
  if(darkness>.005){c.fillStyle=`rgba(10,21,46,${darkness})`;c.fillRect(0,0,w,h);}
  if(light>.1&&warmth>.015&&this.shoreTop>this.waterTop){
   c.beginPath();c.rect(0,this.waterTop,w,this.shoreTop-this.waterTop);c.clip();
   const cx=w*(morning>.2?.70:.30),span=w*.28,glow=c.createLinearGradient(cx-span,0,cx+span,0);glow.addColorStop(0,'rgba(255,222,164,0)');glow.addColorStop(.5,`rgba(255,222,164,${warmth*.28})`);glow.addColorStop(1,'rgba(255,222,164,0)');c.fillStyle=glow;c.fillRect(cx-span,this.waterTop,span*2,this.shoreTop-this.waterTop);
  }c.restore();
 }
 drawWaterLine(tip,end,g){
  const c=this.ctx,slack=g.phase==='held'?g.slackToTake||0:0,taut=g.phase==='fight'?clamp(g.tension,0,1):0;
  const sag=(g.phase==='flying'?2:4+slack*34)*(1-taut*.88),breeze=Math.sin(this.clock*.9+this.drawIndex*2)*(1-taut)*1.5;
  c.beginPath();c.moveTo(tip.x,tip.y);c.quadraticCurveTo(mix(tip.x,end.x,.5)+breeze,mix(tip.y,end.y,.5)+sag,end.x,end.y);c.strokeStyle='rgba(213,225,214,.27)';c.lineWidth=.5;c.stroke();
  if(['waiting','bite','fight','held'].includes(g.phase)){this.ellipse(end.x,end.y,2.6, .65,null,'rgba(211,227,214,.18)',.5);}
 }
 drawRipples(){const c=this.ctx,t=this.clock;
  this.ripples=this.ripples.filter(p=>t-p.time<5);
  for(const p of this.ripples){const age=t-p.time;for(let i=0;i<3;i++){const f=age-i*.24;if(f<0)continue;const scale=clamp(18/Math.max(8,p.distance||20),.45,1.4),radius=(3+f*14)*scale;this.ellipse(p.x,p.y,radius,radius*.17,null,`rgba(231,242,228,${Math.max(0,.45-f*.09)})`,1);}}
  if(this.feedThrow){const p=this.feedThrow,f=clamp((t-p.time)/.95,0,1);for(let i=0;i<20;i++){const x=mix(p.start.x,p.end.x+Math.sin(i*2.4)*18,f),y=mix(p.start.y,p.end.y+Math.cos(i*2.4)*4,f)-Math.sin(Math.PI*f)*(this.height*.22+i%3*5);this.ellipse(x,y,1.4,1.2,'#cfb77d');}if(f>=1){this.feedThrow=null;this.ripples.push({...p.end,time:t,distance:p.distance});this.ripples=this.ripples.slice(-6);}}
 }
 drawFloat(target,flying){
  const c=this.ctx,g=this.game,image=this.equipment?.float;if(!image)return;
  const height=clamp(23/Math.sqrt(Math.max(3,g.distance||20)),3.7,9)*10,width=height*image.width/image.height;
  const motion=biteMotion(g,this.clock),sink=motion.floatSink*height;
  const angle=flying?.65:motion.floatTilt;
  this.signals[this.drawIndex]={x:target.x,y:target.y,anchor:{...target},kind:'float'};
  if(!flying&&Math.abs(motion.floatSink)>.03){const r=3+((this.clock%1.4)/1.4)*height*.3;this.ellipse(target.x,target.y,r,r*.17,null,'rgba(215,231,217,.18)',.6);}
  c.save();c.translate(target.x,target.y);
  if(!flying){
   c.save();c.beginPath();c.rect(-width,-height,width*2,height);c.clip();c.translate(0,sink);c.rotate(angle);c.drawImage(image,-width/2,-height*.24,width,height);c.restore();
   // Light transmission below the real waterline, using the very same sprite.
   c.save();c.beginPath();c.rect(-width,0,width*2,height);c.clip();c.globalAlpha=.10;c.translate(0,sink);c.rotate(angle);c.drawImage(image,-width/2,-height*.24,width,height);c.restore();
  }else{c.rotate(angle);c.drawImage(image,-width/2,-height*.24,width,height);}
  c.restore();this.metrics.drawImages++;
 }
 drawPhotoHeld(){
  const image=this.equipment?.animatedHeld||this.equipment?.held;if(!image)return false;
  const c=this.ctx,g=this.game,m=this.presentation,held=heldLayout(this.width,this.height,this.pose,0),rest=restingLayout(this.width,this.height,{index:this.drawIndex,count:this.drawCount,shoreTop:this.shoreTop}),u=g.loadout.method==='float'?1:(m?.pickup??1);
  const scale=mix(rest.height/image.height,held.scale,u),anchor=rest.at(.83,.88),response=handResponse(g,m,this.width,this.height,this.clock+this.drawIndex),base={x:mix(anchor.x,held.base.x,u)+response.x*u,y:mix(anchor.y,held.base.y,u)+response.y};
  // Keep the first pickup/cast continuous: never let an invalid or abrupt frame
  // rotate the entire photographic hand-and-rod asset.
  const desiredAngle=clamp((held.angle+response.angle)*u,-1.05,1.05);
  const previousAngle=this.heldAngleByRod[this.drawIndex]??0;
  const maxStep=Math.max(0.035,Math.min(.15,this.motionFrameDt*4.5));
  const angle=Number.isFinite(desiredAngle)?clamp(desiredAngle,previousAngle-maxStep,previousAngle+maxStep):previousAngle;
  this.heldAngleByRod[this.drawIndex]=angle;

  const transform=(u,v)=>{const x=(u-.83)*image.width*scale,y=(v-.88)*image.height*scale;return {x:base.x+x*Math.cos(angle)-y*Math.sin(angle),y:base.y+x*Math.sin(angle)+y*Math.cos(angle)};};
  const flex=(g.phase==='held'&&g.loadout.method==='feeder'?biteMotion(g,this.clock).feederFlex:0)+((m?.bend??(g.phase==='fight'?g.tension:0))*34/Math.pow(RODS[g.loadout.rod].power,.35)),shift=v=>Math.pow(Math.max(0,1-v/.42),2)*flex;
  const rawTip=transform(.049,.039),tip={x:rawTip.x+shift(.039)*Math.cos(angle),y:rawTip.y+shift(.039)*Math.sin(angle)};this.tip=tip;
  c.save();c.translate(base.x,base.y);c.rotate(angle);c.filter='saturate(0.76) brightness(0.88)';
  const cut=Math.round(image.height*.42),x=-.83*image.width*scale,y=-.88*image.height*scale;
  if(Math.abs(flex)<.01)c.drawImage(image,x,y,image.width*scale,image.height*scale);
  else{c.drawImage(image,0,cut,image.width,image.height-cut,x,y+cut*scale,image.width*scale,(image.height-cut)*scale);for(let sy=0;sy<cut;sy+=6){const sh=Math.min(6,cut-sy);c.drawImage(image,0,sy,image.width,sh,x+shift(sy/image.height),y+sy*scale,image.width*scale,sh*scale+.2);}}
  this.drawReel(image,x,y,scale,g,m);c.restore();
  if(!['ready','casting','landed','escaped'].includes(g.phase)){
   let end=this.target;if(g.phase==='flying'){const f=clamp(g.elapsed/1.1,0,1);end={x:mix(tip.x,end.x,f),y:mix(tip.y,end.y,f)-Math.sin(Math.PI*f)*this.height*.20};if(g.loadout.method==='float')this.drawFloat(end,true);else this.drawTerminal(end,scale*3);}
   this.drawWaterLine(tip,end,g);
  }
  if(g.loadout.method==='feeder'&&g.phase==='held')this.signals[this.drawIndex]={...tip,anchor:rawTip,kind:'feeder'};
  this.metrics.heldPhoto=true;this.metrics.drawImages+=Math.abs(flex)<.01?1:1+Math.ceil(cut/6);return true;
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
  for(let sy=0;sy<cut;sy+=6){const sh=Math.min(6,cut-sy),v=sy/image.height;c.drawImage(image,0,sy,image.width,sh,x+shift(v),y+height*v,width,height*sh/image.height+.2);}}
  c.restore();this.metrics.restingPhoto=true;this.metrics.drawImages+=Math.abs(flex)<.01?1:1+Math.ceil(cut/6);
  const guides=[[.096,.079],[.139,.117],[.178,.157],[.231,.214],[.305,.295],[.407,.413]].map(([u,v])=>{const p=at(u,v);return {x:p.x+shift(v),y:p.y};});
  const reel=at(.65,.762),points=[reel];
  if(!feeder&&['waiting','bite'].includes(g.phase)){
   const origin=at(.43,.80),limit=this.height>this.width?(this.inset.hudTop??this.height*.82)-26:Infinity;
   const anchor={x:origin.x,y:Math.min(origin.y,limit)},motion=biteMotion(g,this.clock).ledgerLift;
   const type=g.loadout.indicator||'bobbin',tether=at(.50,.91),arm=Math.hypot(anchor.x-tether.x,anchor.y-tether.y),angle=Math.atan2(anchor.y-tether.y,anchor.x-tether.x)+(motion/Math.max(30,arm));
   const indicator=type==='bobbin'?{x:anchor.x,y:anchor.y+motion}:{x:tether.x+Math.cos(angle)*arm,y:tether.y+Math.sin(angle)*arm};
   this.signals[this.drawIndex]={...indicator,anchor,kind:'ledger'};
   points.push(indicator);

   if(type!=='bobbin')this.line([tether,indicator],'#8d9a94',2);
   if(type==='bobbin')this.drawHangingBobbin(indicator,tether,motion);else this.ellipse(indicator.x,indicator.y,3.5,7,'#72b8c6','#28332b',.6);
   if(type==='electronic'){
    const alarm=at(.43,.72),lit=Math.abs(biteMotion(g,this.clock).ledgerLift)>1&&Math.sin(this.clock*12)>0;
    c.fillStyle='#263035';c.strokeStyle='#8b9994';c.lineWidth=.7;c.beginPath();c.roundRect(alarm.x-5,alarm.y-8,10,17,3);c.fill();c.stroke();
    this.ellipse(alarm.x,alarm.y-3,1.8,1.8,lit?'#7fe2ff':'#355661');
   }
  }
  if(feeder)this.signals[this.drawIndex]={...tip,anchor:rawTip,kind:'feeder'};
  if(!['ready','landed','escaped'].includes(g.phase)){
   points.push(...guides.reverse(),tip);this.line(points,'rgba(208,221,208,.34)',.55);
   const end=this.target;this.drawWaterLine(tip,end,g);
  }
  return true;
 }
 drawFish(){const g=this.game;if(g.phase!=='fight'||g.distance>8)return;
  const c=this.ctx,p=this.target,s=clamp(8/g.distance,.9,2.2)*(g.fish?.length||50)/60,turn=(g.fishBearing||0)*2+Math.sin(g.elapsed*.8)*.08;
  // Underwater silhouette and a brief flank flash; no exposed cartoon fish on the surface.
  c.save();c.translate(p.x,p.y+2);c.rotate(turn);c.scale(s,s*.37);c.filter='blur(1.1px)';c.globalAlpha=.21;
  const body=c.createLinearGradient(0,-9,0,9);body.addColorStop(0,'#182f29');body.addColorStop(.5,'#45513e');body.addColorStop(1,'#253d32');
  c.fillStyle=body;c.beginPath();c.moveTo(21,0);c.bezierCurveTo(7,-13,-13,-9,-20,0);c.bezierCurveTo(-13,9,7,13,21,0);c.fill();
  c.beginPath();c.moveTo(-18,0);c.lineTo(-28,-7);c.quadraticCurveTo(-25,0,-28,7);c.closePath();c.fill();
  const flash=Math.pow(Math.max(0,Math.sin(g.elapsed*1.7)),10)*.27;c.globalAlpha=flash;this.ellipse(3,0,12,3,'#d0c7a8');c.restore();
  this.ellipse(p.x,p.y,23+Math.sin(g.elapsed*2.2)*3,3.2,null,'rgba(214,230,218,.18)',.7);
 }

 drawRig(){const c=this.ctx,g=this.game,w=this.width,h=this.height,method=g.loadout.method,floating=method==='float',fighting=g.phase==='fight',held=g.phase==='held',casting=g.phase==='casting',flying=g.phase==='flying';
  const hand=floating||fighting||held||casting||flying||g.time-g.lastStrikeAt<.55||(this.presentation?.pickup||0)>0;if(hand){if(!floating)this.drawEmptyStand();if(this.drawPhotoHeld())return;}if(!hand&&this.drawPhotoResting())return;const layout=gearLayout(w,h,{...this.inset,index:this.drawIndex,count:this.drawCount,pose:this.pose,waterTop:this.waterTop});const {base,size}=layout;let tip={...layout.tip};
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
   this.signals[this.drawIndex]={...indicator,anchor:{x:indicator.x,y:clamp(Math.min(reel.y+28*size,layout.hudTop-36),layout.headerBottom+20,layout.hudTop-24)},kind:'ledger'};linePoints.push(indicator);this.drawHangingBobbin(indicator,{x:indicator.x+12*size,y:layout.hudTop+20},lift,size);
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
 paintLedgerSignal(active,canvas){
  const rod=this.game.enabledRods?.[active]||this.game;
  const m=biteMotion(rod,rod.time);
  const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  if(!ctx)return;
  const indicator=rod.loadout.indicator||'bobbin',lift=clamp(m.ledgerLift||0,-30,30);
  const x=w*.50,restY=h*.61,travel=-lift*h*.0038;
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h);
  const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#29433e');bg.addColorStop(1,'#11292b');
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  // A fishing line runs horizontally between the rod and the rest.
  const lineY=h*.31;ctx.strokeStyle='#dfdec6';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(w*.08,lineY);ctx.quadraticCurveTo(x,lineY+1,w*.92,lineY);ctx.stroke();
  const y=restY+travel;
  if(indicator==='bobbin'){
   // The mechanical bobbin hangs UNDER the fishing line and rises on a run.
   ctx.strokeStyle='#a9b7a7';ctx.lineWidth=2;
   ctx.beginPath();ctx.moveTo(x,lineY);ctx.lineTo(x,y-h*.10);ctx.stroke();
   ctx.fillStyle='#aab7a8';ctx.fillRect(x-10,y-h*.11,20,5);
   const body=ctx.createLinearGradient(x-24,y,x+24,y);
   body.addColorStop(0,'#94612f');body.addColorStop(.45,'#edb967');body.addColorStop(1,'#855226');
   ctx.fillStyle=body;ctx.strokeStyle='#e0d2aa';ctx.lineWidth=2;
   ctx.beginPath();ctx.roundRect(x-22,y-h*.08,44,h*.32,17);ctx.fill();ctx.stroke();
   ctx.fillStyle='#d5d8bf';ctx.beginPath();ctx.ellipse(x,y+h*.24,8,5,0,0,Math.PI*2);ctx.fill();
  }else{
   // Swinger has a hinged arm, rather than a hanging bobbin or float.
   const pivot={x:w*.24,y:h*.83},end={x:x+lift*.7,y:y-h*.02};
   ctx.strokeStyle='#9ab2ad';ctx.lineWidth=8;ctx.lineCap='round';
   ctx.beginPath();ctx.moveTo(pivot.x,pivot.y);ctx.lineTo(end.x,end.y);ctx.stroke();
   ctx.fillStyle=indicator==='electronic'?'#8cd5eb':'#d5c883';
   ctx.beginPath();ctx.roundRect(end.x-19,end.y-29,38,55,12);ctx.fill();
   ctx.fillStyle='#687d75';ctx.beginPath();ctx.arc(pivot.x,pivot.y,12,0,Math.PI*2);ctx.fill();
   if(indicator==='electronic'&&m.stage==='run'){
    ctx.fillStyle='#80e8fa';ctx.beginPath();ctx.arc(w*.82,h*.14,8,0,Math.PI*2);ctx.fill();
   }
  }
  ctx.restore();
 }
 paintFeederSignal(active,canvas){
  const rod=this.game.enabledRods?.[active]||this.game;
  const motion=biteMotion(rod,rod.time);
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const w=canvas.width,h=canvas.height;
  const flex=clamp(motion.feederFlex||0,-34,34);
  // The support remains fixed: only the final flexible section moves.
  // Magnify real flex to make subtle touches readable, but cap the deformation.
  const bend=flex*1.75;
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h);
  const bg=ctx.createLinearGradient(0,0,w,h);
  bg.addColorStop(0,'#233f39');bg.addColorStop(1,'#0d2428');
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  // Faint neutral reference line shows the resting tip location.
  const x0=w*.06,y0=h*.76,x1=w*.91,y1=h*.32;
  ctx.lineCap='round';ctx.setLineDash([5,6]);ctx.strokeStyle='rgba(226,236,211,.28)';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(w*.50,h*.53);ctx.lineTo(x1,y1);ctx.stroke();ctx.setLineDash([]);
  // Graphite blank with a brightly painted orange/yellow feeder quiver tip.
  const midx=w*.54,midy=h*.52;
  ctx.lineWidth=13;ctx.strokeStyle='#142120';
  ctx.beginPath();ctx.moveTo(x0,y0);ctx.quadraticCurveTo(w*.28,h*.65,midx,midy);ctx.stroke();
  const tipx=x1,tipy=y1+bend;
  ctx.beginPath();ctx.moveTo(midx,midy);ctx.quadraticCurveTo(w*.75,h*.40+bend*.30,tipx,tipy);
  ctx.lineWidth=9;ctx.strokeStyle='#f6a53e';ctx.stroke();
  ctx.beginPath();ctx.moveTo(w*.76,h*.41+bend*.30);ctx.quadraticCurveTo(w*.86,h*.35+bend*.62,tipx,tipy);
  ctx.lineWidth=6;ctx.strokeStyle='#f1ec92';ctx.stroke();
  // Guide rings move with the flexible part, without moving the reel.
  const guides=[[.60,.49,.10],[.77,.405,.30],[.91,.32,1]];
  for(const [gx,gy,weight] of guides){
    const px=w*gx,py=h*gy+bend*weight;
    ctx.strokeStyle='#dbe4da';ctx.lineWidth=3;ctx.beginPath();
    ctx.ellipse(px,py,8,12,-.6,0,Math.PI*2);ctx.stroke();
  }
  // Hanging line runs from the final ring toward the water below.
  ctx.strokeStyle='rgba(224,235,229,.6)';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(tipx,tipy);ctx.lineTo(tipx-15,Math.min(h*.95,tipy+85));ctx.stroke();
  if(motion.stage==='touch'||motion.stage==='run'){
    ctx.fillStyle=motion.stage==='touch'?'#f1cf75':'#8de0b1';
    ctx.beginPath();ctx.arc(w*.14,h*.17,8,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
 }
 paintSignal(active,canvas=this.signalCanvas,force=false){
  if(!canvas||(!force&&!this.signalVisible))return;
  const activeRod=this.game.enabledRods?.[active]||this.game;
  if(activeRod.loadout.method==='ledger'){this.paintLedgerSignal(active,canvas);return;}
  if(activeRod.loadout.method==='feeder'){this.paintFeederSignal(active,canvas);return;}
  const target=this.signals[active];if(!target)return;
  // Fixed optical axis: following the moving tip would hide the bite itself.
  const anchor=target.anchor||target,roi=target.kind==='float'?54:target.kind==='ledger'?110:130;
  const roiHeight=roi*canvas.height/canvas.width,sx=anchor.x-roi/2,sy=anchor.y-roiHeight/2-(target.kind==='float'?8:0);
  const ctx=canvas.getContext('2d'),mainCtx=this.ctx,metrics={...this.metrics};
  const saved={signals:this.signals,targets:this.targets,target:this.target,tip:this.tip,drawIndex:this.drawIndex,pose:this.pose,presentation:this.presentation};
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.setTransform(canvas.width/roi,0,0,canvas.height/roiHeight,-sx*canvas.width/roi,-sy*canvas.height/roiHeight);
  try{this.ctx=ctx;this.drawFrame(0);}finally{this.ctx=mainCtx;ctx.restore();Object.assign(this,saved);this.metrics={...metrics,opticalDetail:true};}
 }
 render(dt,{paused=false}={}){if(!this.image)return;dt=Math.max(0,dt);this.motionFrameDt=Math.min(dt,1/30);this.clock+=dt;const motionDt=paused?0:dt;const rods=this.game.enabledRods||[this.game];for(let i=0;i<rods.length;i++){const g=rods[i],m=this.motionByRod[i]??=new RodPresentation();m.update(g,motionDt);const strikePulse=Math.max(0,1-(g.time-g.lastStrikeAt)/.55),targetPose=Math.max(['held','fight'].includes(g.phase)?.5+m.pump*.4:0,strikePulse*.85);this.poseByRod[i]=mix(this.poseByRod[i],targetPose,1-Math.exp(-motionDt*8));}this.cachePhotograph();this.drawFrame(dt);if(this.signalViews?.length){for(const v of this.signalViews)this.paintSignal(v.index,v.canvas,true);}else this.paintSignal(this.game.activeIndex||0);}
 drawFrame(dt){this.water();this.drawSurface();this.drawLife();this.drawAimAndFeed();this.ctx.save();this.ctx.beginPath();this.ctx.rect(0,this.waterTop,this.width,Math.max(0,this.shoreTop-this.waterTop));this.ctx.clip();this.drawRipples();this.ctx.restore();
  const bank=this.bankLayout;this.ctx.drawImage(this.stationImage,bank.x,bank.y,bank.width,bank.height);this.metrics.drawImages++;this.metrics.station=this.station.name;

  this.drawReeds();
  const session=this.game,rods=session.enabledRods||[session],active=session.activeIndex||0;this.drawCount=rods.length;this.targets=[];this.signals=[];
  for(let i=0;i<rods.length;i++){
   const g=rods[i];this.game=g;this.drawIndex=i;
   this.presentation=this.motionByRod[i];this.pose=this.poseByRod[i];
   this.target=waterPoint(this.width,this.height,this.waterTop,g.distance||30,(g.phase==='fight'?(g.fishBearing??g.castAngle):g.castAngle||0)-this.yaw,this.shoreTop);this.targets.push({...this.target});
   this.drawFish();this.drawWaterResponse();this.drawNet();if(g.loadout.method==='float'&&['waiting','bite'].includes(g.phase))this.drawFloat(this.target,false);this.drawRig();
  }
  this.game=session;this.target=this.targets[active];this.drawLighting();
 }

 dispose(){window.removeEventListener('resize',this.onResize);}
}
