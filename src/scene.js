import * as T from '../vendor/three.module.js';
import {RODS} from './tackle.js?v=0.5.0';
import {makeRodGeometry,updateRodGeometry,rodPoint,makeFishModel} from './models.js?v=0.5.0';
const UP=new T.Vector3(0,1,0);
function seeded(seed=131){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
const rnd=seeded();
const mat=(color,roughness=.8,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
function mesh(geo,material,parent,x=0,y=0,z=0){const m=new T.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function cylinderBetween(a,b,radius,material,parent,top=radius,segments=10){const d=new T.Vector3().subVectors(b,a);const m=mesh(new T.CylinderGeometry(top,radius,d.length(),segments),material,parent);m.position.copy(a).addScaledVector(d,.5);m.quaternion.setFromUnitVectors(UP,d.normalize());return m;}
function texture(kind){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');const r=seeded(42);x.fillStyle=kind==='soil'?'#62634a':kind==='cork'?'#a38b59':'#ded5bc';x.fillRect(0,0,256,256);
 for(let i=0;i<9000;i++){const a=r(),b=r();x.fillStyle=kind==='soil'?`rgba(${80+r()*55},${76+r()*55},${40+r()*40},${.12+r()*.3})`:kind==='cork'?`rgba(48,31,16,${r()*.35})`:`rgba(83,66,41,${r()*.10})`;x.fillRect(a*256,b*256,kind==='cork'?1+r()*12:1+r()*4,1+r()*3);}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(kind==='soil'?100:1,kind==='soil'?100:1);return t;}
export class LakeScene {
 constructor(canvas,game){this.canvas=canvas;this.game=game;this.width=innerWidth;this.height=innerHeight;this.dragging=false;this.yaw=0;this.pitch=-.13;this.ripples=[];this.clock=0;this.frameCount=0;try{this.high=localStorage.getItem('reviry-quality')!=='low';}catch{this.high=true;}
 this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.high?1.75:1));this.renderer.setSize(innerWidth,innerHeight);this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.9;this.renderer.shadowMap.enabled=this.high;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
 this.scene=new T.Scene();this.scene.fog=new T.FogExp2(0xb4bdad,.00055);
 this.camera=new T.PerspectiveCamera(54,innerWidth/innerHeight,.08,4000);this.camera.position.set(0,1.65,0);
 this.sunDirection=new T.Vector3(-.52,.24,-.62).normalize();
 this.makeSky();this.makeLight();this.makeWater();this.makeEquipment();this.makeFish();this.makeAudioBirds=false;
 this.bindLook();window.addEventListener('resize',()=>this.resize());
 }
 async init(){let data;try{const response=await fetch('data/vajgar.json');if(response.ok)data=await response.json();}catch{}
 this.buildLandscape(data);await this.upgradeMaterials();this.resize();this.render(0);return this;}
 makeSky(){const geo=new T.SphereGeometry(2500,32,16);const material=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{sun:{value:this.sunDirection}},vertexShader:`varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 direction;uniform vec3 sun;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}void main(){vec3 d=normalize(direction);float h=max(d.y,0.);vec3 sky=mix(vec3(.83,.80,.68),vec3(.25,.46,.61),pow(h,.47));float s=max(dot(d,sun),0.);sky+=vec3(1.,.62,.27)*pow(s,10.)*.25;sky+=vec3(1.,.87,.62)*pow(s,800.)*2.;sky+=vec3(1.,.95,.8)*smoothstep(.99965,.99985,s)*4.;vec2 uv=d.xz/max(.08,d.y)*.9;float n=noise(uv*1.1)*.55+noise(uv*2.4)*.25+noise(uv*5.)*.2;float clouds=smoothstep(.56,.79,n)*smoothstep(.015,.20,d.y);sky=mix(sky,vec3(.92,.88,.78),clouds*.62);gl_FragColor=vec4(sky,1.);}`});this.sky=mesh(geo,material,this.scene);this.sky.castShadow=false;this.sky.receiveShadow=false;}
 makeLight(){this.scene.add(new T.HemisphereLight(0xc5d9e3,0x5c6346,1.1));const light=new T.DirectionalLight(0xffefd2,2.2);light.position.copy(this.sunDirection).multiplyScalar(120);light.castShadow=true;light.shadow.mapSize.set(2048,2048);light.shadow.camera.left=-35;light.shadow.camera.right=35;light.shadow.camera.top=35;light.shadow.camera.bottom=-35;light.shadow.camera.near=1;light.shadow.camera.far=300;light.shadow.bias=-.0003;light.shadow.normalBias=.03;this.scene.add(light);this.sunLight=light;}
 makeWater(){this.reflectionTarget=new T.WebGLRenderTarget(this.high?1024:512,this.high?1024:512,{type:T.UnsignedByteType});this.reflectionCamera=new T.PerspectiveCamera();this.textureMatrix=new T.Matrix4();
 const uniforms={time:{value:0},reflection:{value:this.reflectionTarget.texture},textureMatrix:{value:this.textureMatrix},eye:{value:this.camera.position},sun:{value:this.sunDirection},ripple:{value:new T.Vector4(0,0,-100,0)}};
 const material=new T.ShaderMaterial({uniforms,transparent:false,side:T.DoubleSide,vertexShader:`varying vec3 world;varying vec4 mirrorUv;uniform mat4 textureMatrix;uniform float time;void main(){vec4 w=modelMatrix*vec4(position,1.);world=w.xyz;mirrorUv=textureMatrix*w;gl_Position=projectionMatrix*viewMatrix*w;}`,fragmentShader:`precision highp float;varying vec3 world;varying vec4 mirrorUv;uniform float time;uniform sampler2D reflection;uniform vec3 eye;uniform vec3 sun;uniform vec4 ripple;
 float height(vec2 p){return sin(dot(p,vec2(.86,.49))*1.7+time*.8)*.021+sin(dot(p,vec2(-.31,.95))*3.9-time*.65)*.011+sin(dot(p,vec2(.66,-.75))*8.3+sin(p.x*.23)*1.3+time*1.3)*.004+sin(dot(p,vec2(.12,.99))*17.1-time*1.9)*.0018;}
 void main(){vec2 p=world.xz;float e=max(.035,length(eye-world)*.0012);float h=height(p);vec2 slope=vec2(height(p+vec2(e,0.))-h,height(p+vec2(0.,e))-h)/e;float age=time-ripple.z;float dist=length(p-ripple.xy);if(age>0.&&age<8.)slope+=normalize(p-ripple.xy+vec2(.001))*sin(dist*8.-age*9.)*exp(-pow(dist-age*1.7,2.)*1.5)*exp(-age*.4)*.4;vec3 n=normalize(vec3(-slope.x*.85,1.,-slope.y*.85));vec3 view=normalize(eye-world);float fresnel=.035+.965*pow(1.-max(dot(view,n),0.),5.);vec2 uv=mirrorUv.xy/mirrorUv.w;uv+=n.xz*.035/max(.8,length(eye-world)*.012);float blur=.0008+min(.002,length(eye-world)*.000004);vec3 refl=texture2D(reflection,clamp(uv,.003,.997)).rgb*.4;refl+=texture2D(reflection,clamp(uv+vec2(blur,blur),.003,.997)).rgb*.3;refl+=texture2D(reflection,clamp(uv-vec2(blur,blur),.003,.997)).rgb*.3;vec3 deep=vec3(.105,.17,.145);float shore=exp(-length(eye.xz-world.xz)*.13);vec3 base=mix(deep,vec3(.24,.25,.16),shore*.33);vec3 col=mix(base,refl,clamp(fresnel*.80,.12,.82));vec3 halfV=normalize(view+sun);float spec=pow(max(dot(n,halfV),0.),260.);col+=vec3(1.,.83,.56)*spec*2.7;float distanceFog=1.-exp(-length(eye-world)*.0006);col=mix(col,vec3(.67,.73,.67),distanceFog);gl_FragColor=vec4(col,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});this.waterMaterial=material;this.water=mesh(new T.PlaneGeometry(4000,4000),material,this.scene,0,0,0);this.water.rotation.x=-Math.PI/2;this.water.receiveShadow=false;this.water.castShadow=false;}
 buildLandscape(data){this.geoAccurate=Boolean(data?.shoreline?.length);this.geoData=data;
 const shoreline=data?.shoreline || [[-320,-390],[-80,-460],[140,-420],[290,-260],[330,-40],[250,200],[80,330],[-120,300],[-320,180],[-410,-20],[-380,-230],[-320,-390]];
 const island=data?.island || [[-170,-160],[-153,-180],[-130,-177],[-115,-157],[-121,-131],[-149,-125],[-167,-140],[-170,-160]];
 this.shoreline=shoreline;this.island=island;
 this.station=data?.station || {position:[140,1.65,266],target:[-140,3,-153]};this.camera.position.fromArray(this.station.position);this.camera.position.x+=1.4;this.camera.position.z+=2.1;this.basePosition=this.camera.position.clone();this.baseTarget=new T.Vector3().fromArray(this.station.target);this.baseDirection=new T.Vector3().subVectors(this.baseTarget,this.basePosition).normalize();this.castDirection=this.baseDirection.clone();this.castDirection.y=0;this.castDirection.normalize();
 const soilMap=texture('soil');const soil=mat(0x81816b);soil.map=soilMap;soil.bumpMap=soilMap;soil.bumpScale=.12;this.groundMaterials=[soil];
 const landShape=new T.Shape([new T.Vector2(-2200,-2200),new T.Vector2(2200,-2200),new T.Vector2(2200,2200),new T.Vector2(-2200,2200)]);
 const lakePath=new T.Path(shoreline.map(p=>new T.Vector2(p[0],-p[1])));landShape.holes.push(lakePath);
 const land=mesh(new T.ShapeGeometry(landShape),soil,this.scene,0,.045,0);land.rotation.x=-Math.PI/2;
 const islandShape=new T.Shape(island.map(p=>new T.Vector2(p[0],-p[1])));const islandMesh=mesh(new T.ExtrudeGeometry(islandShape,{depth:1.1,bevelEnabled:true,bevelSize:.45,bevelThickness:.3,bevelSegments:2,steps:1}),soil,this.scene,0,-.15,0);islandMesh.rotation.x=-Math.PI/2;
 // A repeated 3D shoreline lip hides the perfectly sharp water/land seam.
 const rockMat=mat(0x737567);const rockGeo=new T.DodecahedronGeometry(1,0);const shoreRocks=[];
 for(let i=0;i<shoreline.length-1;i++){const a=new T.Vector3(shoreline[i][0],0,shoreline[i][1]),b=new T.Vector3(shoreline[i+1][0],0,shoreline[i+1][1]);const len=a.distanceTo(b);for(let j=0;j<len;j+=2.8){const p=a.clone().lerp(b,j/len);if(p.distanceTo(this.basePosition)>7)shoreRocks.push([p.x,.01,p.z,.08+rnd()*.20]);}}
 this.instances(rockGeo,rockMat,shoreRocks,(m,p)=>{m.position.set(p[0],p[1],p[2]);m.scale.set(p[3]*2,p[3]*.45,p[3]);m.rotation.set(rnd(),rnd()*6,rnd());});
 const bankVertices=[],bankColors=[];
 const rings=[shoreline,island];
 for(const ring of rings)for(let i=0;i<ring.length-1;i++){
  const a=ring[i],b=ring[i+1];if(Math.hypot(a[0]-this.basePosition.x,a[1]-this.basePosition.z)>55)continue;
  const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),nx=-dz/length,nz=dx/length;
  const A=[a[0],.046,a[1]],B=[b[0],.046,b[1]],C=[b[0]+nx*.18,-.22,b[1]+nz*.18],D=[a[0]+nx*.18,-.22,a[1]+nz*.18];
  for(const v of [A,B,D,B,C,D]){bankVertices.push(...v);const c=new T.Color(v[1]>0?0x615d45:0x303d30);c.toArray(bankColors,bankColors.length);}
 }
 const bankGeometry=new T.BufferGeometry();bankGeometry.setAttribute('position',new T.Float32BufferAttribute(bankVertices,3));bankGeometry.setAttribute('color',new T.Float32BufferAttribute(bankColors,3));bankGeometry.computeVertexNormals();mesh(bankGeometry,new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide}),this.scene);
 this.makeBankRelief(soil);this.makeTrees(shoreline,island);this.makeTown(data);this.makeEmbankment();this.makeForeground();this.makeSedges();
 // Keep the nearby sun shadow box anchored to the fishing station.
 this.sunLight.position.copy(this.basePosition).addScaledVector(this.sunDirection,120);this.sunLight.target.position.copy(this.basePosition);this.scene.add(this.sunLight.target);
 this.camera.lookAt(this.baseTarget);this.camera.updateMatrixWorld(true);
 for(const object of [this.rig,this.stand,this.landingNet])this.scene.attach(object);
 this.restRig={position:this.rig.position.clone(),quaternion:this.rig.quaternion.clone()};
 this.heldRig=new T.Object3D();this.heldRig.position.set(.40,-.38,-.65);this.heldRig.rotation.set(-.08,-.30,.05);this.camera.add(this.heldRig);
 this.updateReflection();
 }
 makeBankRelief(material){
 const p=this.basePosition,size=28,steps=96,positions=[],uvs=[],indices=[],land=[];
 const inside=(x,z)=>{let hit=false;for(let i=0,j=this.shoreline.length-1;i<this.shoreline.length;j=i++){const a=this.shoreline[i],b=this.shoreline[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
 for(let z=0;z<=steps;z++)for(let x=0;x<=steps;x++){
  const wx=p.x+(x/steps-.5)*size,wz=p.z+(z/steps-.5)*size;
  let shoreDistance=100;
  for(let i=0;i<this.shoreline.length-1;i++){
   const a=this.shoreline[i],b=this.shoreline[i+1],dx=b[0]-a[0],dz=b[1]-a[1],length=dx*dx+dz*dz;
   const t=T.MathUtils.clamp(((wx-a[0])*dx+(wz-a[1])*dz)/length,0,1);
   shoreDistance=Math.min(shoreDistance,Math.hypot(wx-a[0]-dx*t,wz-a[1]-dz*t));
  }
  const relief=(.045+Math.sin(wx*1.8+wz)*.018+Math.sin(wx*4.2-wz*3.1)*.008)*Math.min(1,shoreDistance*.7);
  positions.push(wx,.046+relief,wz);uvs.push(wx,-wz);land.push(!inside(wx,wz));
 }
 for(let z=0;z<steps;z++)for(let x=0;x<steps;x++){
  const a=z*(steps+1)+x,b=a+1,c=a+steps+1,d=c+1;
  if(land[a]&&land[b]&&land[c])indices.push(a,c,b);
  if(land[b]&&land[c]&&land[d])indices.push(b,c,d);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();this.bankRelief=mesh(g,material,this.scene);
 }
 alignSunToPanorama(){const u=1255.5/2048,v=1-485.5/1024;const lat=(v-.5)*Math.PI,lon=(u-.5)*Math.PI*2;this.sunDirection.set(Math.cos(lat)*Math.cos(lon),Math.max(.08,Math.sin(lat)),Math.cos(lat)*Math.sin(lon)).normalize();this.sunLight.position.copy(this.basePosition).addScaledVector(this.sunDirection,120);this.waterMaterial.uniforms.sun.value=this.sunDirection;}

 async upgradeMaterials(){
  this.assetWarnings=[];const loader=new T.TextureLoader();
  try{const hdr=await loader.loadAsync('assets/sky.jpg');hdr.colorSpace=T.SRGBColorSpace;hdr.mapping=T.EquirectangularReflectionMapping;this.scene.background=hdr;this.sky.visible=false;this.alignSunToPanorama();const pmrem=new T.PMREMGenerator(this.renderer);const env=pmrem.fromEquirectangular(hdr);this.scene.environment=env.texture;this.environmentTarget=env;pmrem.dispose();this.scene.fog.color.set(0xb7c9cd);}catch(e){this.assetWarnings.push('HDR: '+e.message);}
  try{const [color,normal,arm]=await Promise.all(['assets/soil.jpg','assets/forest_floor_nor_gl_1k.jpg','assets/forest_floor_arm_1k.jpg'].map(p=>loader.loadAsync(p)));color.colorSpace=T.SRGBColorSpace;for(const tex of [color,normal,arm]){tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(.48,.48);tex.anisotropy=Math.min(4,this.renderer.capabilities.getMaxAnisotropy());}
   for(const material of this.groundMaterials){material.color.set(0xc6c6b5);material.envMapIntensity=.48;material.map=color;material.normalMap=normal;material.normalScale.set(.45,.45);material.roughnessMap=arm;material.bumpMap=null;material.needsUpdate=true;}
   const patch=this.foregroundGround;patch.color.set(0xffffff);patch.map=color.clone();patch.map.repeat.set(9,9);patch.map.needsUpdate=true;patch.normalMap=normal.clone();patch.normalMap.repeat.set(9,9);patch.normalMap.needsUpdate=true;patch.normalScale.set(.5,.5);patch.roughness=1;patch.needsUpdate=true;
  }catch(e){this.assetWarnings.push('Ground: '+e.message);}
  try{const billboard=await loader.loadAsync('assets/tree-billboard.webp');billboard.colorSpace=T.SRGBColorSpace;this.treeCrowns.visible=false;this.treeTrunks.visible=false;
   const material=new T.MeshStandardMaterial({map:billboard,alphaTest:.17,side:T.DoubleSide,roughness:1,color:0xc0ccab});this.treeBillboards=this.instances(new T.PlaneGeometry(1,1),material,this.treePositions,(o,p)=>{const h=p[2]*1.12;o.position.set(p[0],h*.5,p[1]);o.scale.set(h,h,1);o.rotation.y=Math.atan2(this.basePosition.x-p[0],this.basePosition.z-p[1]);});this.treeBillboards.castShadow=false;
  }catch(e){this.assetWarnings.push('Trees: '+e.message);}
  if(this.assetWarnings.length)console.warn('Asset fallback',this.assetWarnings);
 }

 instances(geometry,material,items,setup){const m=new T.InstancedMesh(geometry,material,items.length);const dummy=new T.Object3D();for(let i=0;i<items.length;i++){dummy.position.set(0,0,0);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);setup(dummy,items[i],i);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);}m.castShadow=true;m.receiveShadow=true;this.scene.add(m);return m;}
 makeTrees(shore,island){const trees=[];const centroid=shore.reduce((a,p)=>[a[0]+p[0]/shore.length,a[1]+p[1]/shore.length],[0,0]);for(let i=0;i<shore.length-1;i++){const a=shore[i],b=shore[i+1];const length=Math.hypot(a[0]-b[0],a[1]-b[1]);for(let j=0;j<length;j+=9+rnd()*10){const f=j/length;const x=a[0]+(b[0]-a[0])*f,z=a[1]+(b[1]-a[1])*f;const d=new T.Vector2(x-centroid[0],z-centroid[1]).normalize();if(x<centroid[0]-100&&rnd()<.78)continue;trees.push([x+d.x*(5+rnd()*10),z+d.y*(5+rnd()*10),7+rnd()*9]);}}
 const center=island.reduce((a,p)=>[a[0]+p[0]/island.length,a[1]+p[1]/island.length],[0,0]);for(let i=0;i<42;i++){const angle=rnd()*Math.PI*2,radius=rnd()*14;trees.push([center[0]+Math.cos(angle)*radius,center[1]+Math.sin(angle)*radius,9+rnd()*9]);}
 // Nearby bank trees frame the water, with real trunks and branching canopies.
 const pos=this.basePosition;for(const offset of [[-10,6,12],[11,8,15],[-17,-1,13],[19,3,16]])trees.push([pos.x+offset[0],pos.z+offset[1],offset[2]]);
 const trunks=[],crowns=[];for(const p of trees){trunks.push([p[0],p[1],p[2]]);for(let i=0;i<5;i++){const a=i*2.4;crowns.push([p[0]+Math.cos(a)*p[2]*.14,p[1]+Math.sin(a)*p[2]*.14,p[2]*(.61+(i%3)*.1),p[2]*(.21+rnd()*.07),rnd()]);}}
 this.treeTrunks=this.instances(new T.CylinderGeometry(.15,.28,1,7),mat(0x615644),trunks,(m,p)=>{m.position.set(p[0],p[2]*.34,p[1]);m.scale.set(p[2]*.11,p[2]*.68,p[2]*.11);});
 const leafMat=mat(0x68734a);const crownMesh=this.instances(new T.IcosahedronGeometry(1,2),leafMat,crowns,(m,p)=>{m.position.set(p[0],p[2],p[1]);m.scale.set(p[3]*(.8+rnd()*.3),p[3]*1.04,p[3]);m.rotation.set(rnd()*2,rnd()*6,rnd());});this.treeCrowns=crownMesh;this.treePositions=trees;for(let i=0;i<crowns.length;i++)crownMesh.setColorAt(i,new T.Color().setHSL(.21+rnd()*.045,.21+rnd()*.18,.19+rnd()*.10));
 }
 makeTown(data){this.town=new T.Group();this.scene.add(this.town);const plaster=texture('plaster');const wallColors=[0xded5bd,0xe4d8be,0xc4bfae,0xd3c5a3,0xbfc7bf,0xd9c1ad];const wallMats=wallColors.map(c=>{const m=mat(c);m.map=plaster;return m;});const roofMat=mat(0x854e35);const windowMat=mat(0x455655,.35,.15);const trim=mat(0xded7bd);const buildings=data?.buildings||[];
 if(buildings.length){const wallGeo=[],roofGeo=[],windowPositions=[];
  for(const b of buildings){const pts=b.outline.map(p=>new T.Vector2(p[0],-p[1]));if(pts.length<4)continue;const shape=new T.Shape(pts);const h=b.type==='church'?17:b.height||6;const geo=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false});geo.rotateX(-Math.PI/2);geo.translate(0,.18,0);const color=new T.Color(wallColors[Math.floor(rnd()*wallColors.length)]);this.colorGeometry(geo,color);wallGeo.push(geo);
   const contour=b.outline.slice(0,-1),cx=contour.reduce((v,p)=>v+p[0]/contour.length,0),cz=contour.reduce((v,p)=>v+p[1]/contour.length,0);const minX=Math.min(...contour.map(p=>p[0])),maxX=Math.max(...contour.map(p=>p[0])),minZ=Math.min(...contour.map(p=>p[1])),maxZ=Math.max(...contour.map(p=>p[1]));const roofHeight=Math.min(4,Math.min(maxX-minX,maxZ-minZ)*.45);
   const roofPositions=[];for(let i=0;i<contour.length;i++){const p=contour[i],q=contour[(i+1)%contour.length];roofPositions.push(p[0],h+.2,p[1],q[0],h+.2,q[1],cx,h+.2+roofHeight,cz);}
   const roof=new T.BufferGeometry();roof.setAttribute('position',new T.Float32BufferAttribute(roofPositions,3));roof.computeVertexNormals();roofGeo.push(roof);
   for(let i=0;i<contour.length;i++){const p=contour[i],q=contour[(i+1)%contour.length];const dx=q[0]-p[0],dz=q[1]-p[1],length=Math.hypot(dx,dz);if(length<3||length>100)continue;for(let k=1;k<length/3;k++){const f=k/(Math.floor(length/3)+1);for(let floor=0;floor<Math.floor(h/3);floor++)windowPositions.push([p[0]+dx*f,2+floor*2.8,p[1]+dz*f,Math.atan2(dx,dz)+Math.PI/2]);}}
   if(b.name.includes('Nanebevzetí'))this.makeTower(cx+8,cz,8,47,wallMats[0],roofMat,windowMat);
  }
  const wm=mat(0xffffff);wm.vertexColors=true;mesh(this.mergeGeometry(wallGeo,true),wm,this.town);roofMat.side=T.DoubleSide;mesh(this.mergeGeometry(roofGeo,false),roofMat,this.town);
  this.instances(new T.BoxGeometry(.04,1.2,.72),windowMat,windowPositions,(m,p)=>{m.position.set(p[0],p[1]+1.25,p[2]);m.rotation.y=p[3];});
 }else {const west=Math.min(...this.shoreline.map(p=>p[0]));for(let i=0;i<26;i++)this.house(west-8-(i%3)*18,-250+i*17,12+rnd()*9,7+rnd()*6,10+rnd()*5,wallMats[i%wallMats.length],roofMat,windowMat,trim);}
 }
 colorGeometry(geo,color){const count=geo.attributes.position.count;const colors=new Float32Array(count*3);for(let i=0;i<count;i++)color.toArray(colors,i*3);geo.setAttribute('color',new T.BufferAttribute(colors,3));}
 mergeGeometry(geos,colors){const positions=[],normals=[],vertexColors=[];for(let geo of geos){if(geo.index)geo=geo.toNonIndexed();positions.push(...geo.attributes.position.array);normals.push(...geo.attributes.normal.array);if(colors)vertexColors.push(...geo.attributes.color.array);geo.dispose();}const out=new T.BufferGeometry();out.setAttribute('position',new T.Float32BufferAttribute(positions,3));out.setAttribute('normal',new T.Float32BufferAttribute(normals,3));if(colors)out.setAttribute('color',new T.Float32BufferAttribute(vertexColors,3));return out;}

 makeEmbankment(){this.town.position.y=1.25;const vertices=[];for(let i=0;i<this.shoreline.length-1;i++){const a=this.shoreline[i],b=this.shoreline[i+1];if(a[0]>-320||b[0]>-320)continue;vertices.push(a[0],-.1,a[1],a[0],1.25,a[1],b[0],1.25,b[1],a[0],-.1,a[1],b[0],1.25,b[1],b[0],-.1,b[1]);}const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();mesh(geometry,new T.MeshStandardMaterial({color:0x8a8879,roughness:1,side:T.DoubleSide}),this.scene);}

 house(x,z,w,h,d,wall,roof,window,trim){const group=new T.Group();group.position.set(x,.15,z);this.town.add(group);mesh(new T.BoxGeometry(w,h,d),wall,group,0,h/2,0);const shape=new T.Shape([new T.Vector2(-w/2,0),new T.Vector2(0,h*.48),new T.Vector2(w/2,0)]);const r=mesh(new T.ExtrudeGeometry(shape,{depth:d+1,bevelEnabled:false}),roof,group,0,h,-d/2-.5);r.castShadow=true;
 for(let floor=0;floor<Math.max(1,Math.floor(h/3));floor++)for(let j=0;j<Math.floor(d/3);j++){const zz=-d/2+1.6+j*3;mesh(new T.BoxGeometry(.08,1.35,.85),window,group,w/2+.06,2+floor*2.7,zz);mesh(new T.BoxGeometry(.16,.1,1.1),trim,group,w/2+.1,1.3+floor*2.7,zz);}return group;}
 makeTower(x,z,width,height,wall,roof,window){const g=new T.Group();g.position.set(x,0,z);this.town.add(g);mesh(new T.BoxGeometry(width,height,width),wall,g,0,height/2,0);const top=mesh(new T.ConeGeometry(width*.78,height*.47,4),roof,g,0,height+height*.235,0);top.rotation.y=Math.PI/4;for(let i=0;i<4;i++){const angle=i*Math.PI/2;const clock=mesh(new T.CircleGeometry(width*.22,24),mat(0xddd5b9),g,Math.sin(angle)*(width/2+.03),height*.8,Math.cos(angle)*(width/2+.03));clock.rotation.y=angle;const hand=mesh(new T.BoxGeometry(.14,width*.3,.04),window,clock,0,width*.055,.02);hand.rotation.z=.55;}}
 makeForeground(){const p=this.basePosition;const ground=mat(0x737659);ground.map=texture('soil');this.foregroundGround=ground;// The mapped shore stays intact: no circular patch covering the lake.
 const items=[];for(let i=0;i<1500;i++){const x=p.x+(rnd()-.5)*25,z=p.z+rnd()*15-1;if(Math.abs(x-p.x)<1.8&&z<p.z+1.4)continue;items.push([x,z,.13+rnd()*.55,rnd()]);}
 const grassGeo=new T.PlaneGeometry(.023,1,1,5);grassGeo.translate(0,.5,0);const gp=grassGeo.attributes.position;for(let i=0;i<gp.count;i++){const y=gp.getY(i);gp.setX(i,gp.getX(i)*(1-y));gp.setZ(i,-y*y*.24);}grassGeo.computeVertexNormals();const grassMat=new T.MeshStandardMaterial({color:0x7a8249,roughness:1,side:T.DoubleSide});this.grass=this.instances(grassGeo,grassMat,items,(m,p)=>{m.position.set(p[0],.08,p[1]);m.scale.set(1,p[2],1);m.rotation.y=p[3]*Math.PI; m.rotation.z=(rnd()-.5)*.45;});
 const stones=[];for(let i=0;i<75;i++)stones.push([p.x+(rnd()-.5)*15,p.z+rnd()*5,.04+rnd()*.17]);this.instances(new T.DodecahedronGeometry(1,0),mat(0x96968a),stones,(m,p)=>{m.position.set(p[0],.1,p[1]);m.scale.set(p[2]*1.6,p[2]*.5,p[2]);m.rotation.set(rnd()*5,rnd()*5,rnd()*5);});
 }
 makeSedges(){
 const verts=[],colors=[],indices=[];
 for(let k=0;k<=9;k++){
  const t=k/9,w=.014*Math.pow(1-t,.65)+.0002;
  verts.push(-w,Math.sin(t*1.35)*.92,-t*t*.32,w,Math.sin(t*1.35)*.92,-t*t*.32);
  const c=new T.Color().setHSL(.20-t*.04,.30,.15+t*.17);c.toArray(colors,colors.length);c.clone().multiplyScalar(1.15).toArray(colors,colors.length);
  if(k<9){const a=k*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(verts,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 const positions=[],p=this.basePosition,d=this.castDirection,right=new T.Vector3(-d.z,0,d.x);
 const isLake=(x,z)=>{let inside=false;for(let i=0,j=this.shoreline.length-1;i<this.shoreline.length;j=i++){const a=this.shoreline[i],b=this.shoreline[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;};
 // Clumps frame the station; thin individual leaves have independent lengths and lean.
 for(const side of [-1,1])for(let clump=0;clump<24;clump++){
  const center=p.clone().addScaledVector(right,side*(1.15+clump*.18)).addScaledVector(d,1.2+rnd()*3.5);
  if(isLake(center.x,center.z))continue;
  for(let leaf=0;leaf<18;leaf++)positions.push([center.x+(rnd()-.5)*.28,center.z+(rnd()-.5)*.28,.25+rnd()*.63,rnd()*Math.PI*2]);
 }
 const material=new T.MeshStandardMaterial({color:0xb7bb7f,vertexColors:true,roughness:.9,side:T.DoubleSide});
 this.windUniform={value:0};
 material.onBeforeCompile=shader=>{
  shader.uniforms.windTime=this.windUniform;
  shader.vertexShader='uniform float windTime;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vec4 root=instanceMatrix*vec4(0.,0.,0.,1.);
   float sway=sin(windTime*1.25+root.x*.7+root.z*.31)*.045+sin(windTime*2.1+root.z)*.012;
   transformed.x+=sway*position.y*position.y;
  `);
 };
 this.sedges=this.instances(geometry,material,positions,(m,p)=>{m.position.set(p[0],.055,p[1]);m.scale.setScalar(p[2]);m.rotation.y=p[3];});
 }

 makeEquipment(){this.rig=new T.Group();this.camera.add(this.rig);this.scene.add(this.camera);this.rig.position.set(.40,-.44,-.65);this.rig.rotation.set(-.08,-.30,.05);
 this.carbon=mat(0x202c29,.27,.5);this.cork=mat(0xb3a070,.95);this.cork.map=texture('cork');this.metal=mat(0xa7b5ae,.23,.88);this.black=mat(0x18211f,.6,.25);this.lineMat=new T.LineBasicMaterial({color:0xc1cdbb,transparent:true,opacity:.54});
 this.rodGroup=new T.Group();this.rig.add(this.rodGroup);this.rodGeometry=makeRodGeometry();this.rodGeometry.addGroup(0,3120,0);this.rodGeometry.addGroup(3120,720,1);this.tipMaterial=mat(0xef9b48,.55);this.feederMaterials=[this.carbon,this.tipMaterial];this.rodBlank=mesh(this.rodGeometry,this.carbon,this.rodGroup);
 mesh(new T.CylinderGeometry(.025,.024,.43,16),this.cork,this.rodGroup,0,.12,0);mesh(new T.CylinderGeometry(.026,.026,.09,16),this.black,this.rodGroup,0,-.12,0);for(const yy of [-.17,.34,.38])mesh(new T.CylinderGeometry(.026,.026,.012,16),this.metal,this.rodGroup,0,yy,0);
 this.guides=[];for(let i=0;i<7;i++){const ring=mesh(new T.TorusGeometry(.023-i*.0025,.002,6,14),this.metal,this.rodGroup,0,.54+i*.255,.028);this.guides.push(ring);}
 // Reel body, rotating spool, bail wire and handle are separate articulated objects.
 const reel=new T.Group();reel.position.set(0,.06,.11);reel.rotation.x=Math.PI/2;this.rodGroup.add(reel);mesh(new T.BoxGeometry(.025,.12,.06),this.carbon,reel,0,0,-.055);mesh(new T.SphereGeometry(.065,16,12),this.black,reel,0,.015,.015);this.spool=mesh(new T.CylinderGeometry(.047,.044,.065,24),this.metal,reel,0,.04,0);this.spool.rotation.x=Math.PI/2;const thread=mesh(new T.CylinderGeometry(.044,.044,.038,24),mat(0xa7a879,.7,.25),reel,0,.04,.004);thread.rotation.x=Math.PI/2;
 const gold=mat(0xc2b38b,.35,.55);for(let i=0;i<12;i++){const wrap=mesh(new T.TorusGeometry(.044,.0011,4,28),gold,reel,0,.04,-.014+i*.0028);}
 for(const z of [-.034,.034]){const lip=mesh(new T.TorusGeometry(.048,.003,6,32),this.metal,reel,0,.04,z);}
 const bail=mesh(new T.TorusGeometry(.065,.003,6,24,Math.PI*1.55),this.metal,reel,0,.04,.01);bail.rotation.x=.5;this.reelHandle=new T.Group();this.reelHandle.position.set(-.065,.0,.01);reel.add(this.reelHandle);cylinderBetween(new T.Vector3(0,0,0),new T.Vector3(-.07,.035,0),.006,this.metal,this.reelHandle);mesh(new T.CapsuleGeometry(.014,.035,4,8),this.black,this.reelHandle,-.07,.04,.01);
 this.rodGroup.rotation.set(-1.24,0,.40);
 this.hand=new T.Group();this.rodGroup.add(this.hand);const skin=mat(0xb98d70,.8);const sleeve=mat(0x344139,.95);const palm=mesh(new T.SphereGeometry(.055,16,12),skin,this.hand,.045,.10,.045);palm.scale.set(.85,1.5,.65);for(let i=0;i<4;i++){const finger=mesh(new T.CapsuleGeometry(.009,.055,4,8),skin,this.hand,.014,.064+i*.024,.027);finger.rotation.z=-1.25;finger.rotation.x=.3;}
 cylinderBetween(new T.Vector3(.07,.04,.07),new T.Vector3(.22,-.18,.24),.044,sleeve,this.hand,.035,16);mesh(new T.SphereGeometry(.018,12,8),skin,this.hand,.02,.14,.055);

 // Bank stand and hanging bite indicator.
 this.stand=new T.Group();this.camera.add(this.stand);this.stand.position.set(.34,-.80,-1.0);this.stand.rotation.y=-.25;
 for(const zz of [-.15,-.85]){cylinderBetween(new T.Vector3(-.2,-.6,zz),new T.Vector3(0,.25,zz),.013,this.black,this.stand);cylinderBetween(new T.Vector3(.3,-.6,zz),new T.Vector3(0,.25,zz),.013,this.black,this.stand);cylinderBetween(new T.Vector3(-.18,.25,zz),new T.Vector3(.28,.25,zz),.012,this.black,this.stand);}
 cylinderBetween(new T.Vector3(0,.25,-.85),new T.Vector3(0,.25,-.15),.012,this.black,this.stand);
 this.indicator=mesh(new T.SphereGeometry(.048,14,12),new T.MeshBasicMaterial({color:0xe6ed9b}),this.stand,-.14,.20,-.42);this.indicator.scale.set(.65,1,.65);this.indicatorLine=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(-.14,.4,-.42),new T.Vector3(-.14,.20,-.42)]),this.lineMat);this.stand.add(this.indicatorLine);this.indicatorLine.visible=false;
 this.fishingLine=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),this.lineMat);this.fishingLine.frustumCulled=false;this.scene.add(this.fishingLine);
 this.landingNet=new T.Group();this.camera.add(this.landingNet);this.landingNet.position.set(-.66,-.9,-.9);this.landingNet.rotation.set(-.55,.2,-.5);const hoop=mesh(new T.TorusGeometry(.25,.012,6,32),this.black,this.landingNet,0,0,0);hoop.scale.set(1,1.2,1);cylinderBetween(new T.Vector3(0,-.25,0),new T.Vector3(0,-1.1,0),.016,this.carbon,this.landingNet);const netMat=new T.MeshBasicMaterial({color:0x415646,wireframe:true,transparent:true,opacity:.35});mesh(new T.ConeGeometry(.245,.4,18,7,true),netMat,this.landingNet,0,0,-.16).rotation.x=Math.PI/2;
 this.sinker=mesh(new T.SphereGeometry(.025,10,8),mat(0x595c52,.35,.6),this.scene);this.sinker.scale.set(1,1.6,1);this.sinker.visible=false;
 this.feederCage=new T.Group();this.scene.add(this.feederCage);
 const cageMat=mat(0x929c8c,.4,.7);for(let i=0;i<6;i++){const angle=i*Math.PI/3;cylinderBetween(new T.Vector3(Math.cos(angle)*.035,-.045,Math.sin(angle)*.035),new T.Vector3(Math.cos(angle)*.035,.045,Math.sin(angle)*.035),.002,cageMat,this.feederCage);}
 for(const y of [-.045,0,.045]){const hoop=mesh(new T.TorusGeometry(.035,.0025,5,12),cageMat,this.feederCage,0,y,0);hoop.rotation.x=Math.PI/2;}
 this.feederCage.visible=false;
 this.float=new T.Group();this.scene.add(this.float);const body=mesh(new T.SphereGeometry(.028,14,10),mat(0xe1d1a3,.4),this.float);body.scale.set(1,2.8,1);
 cylinderBetween(new T.Vector3(0,.045,0),new T.Vector3(0,.23,0),.0035,new T.MeshBasicMaterial({color:0xf59b52}),this.float);
 for(const y of [.13,.19])mesh(new T.CylinderGeometry(.0038,.0038,.018,8),new T.MeshBasicMaterial({color:0xfff6c9}),this.float,0,y,0);
 this.float.visible=false;
 this.feedParticles=new T.InstancedMesh(new T.SphereGeometry(.018,5,4),mat(0xc6ac70),24);this.feedParticles.frustumCulled=false;this.feedParticles.visible=false;this.scene.add(this.feedParticles);this.feedThrow=null;
 this.castPoint=new T.Vector3();this.tipPoint=new T.Vector3();
 }
 makeFish(){this.fishGroup=makeFishModel();this.scene.add(this.fishGroup);this.fishGroup.visible=false;this.tail=this.fishGroup.userData.tail;}

 bindLook(){let startX=0,startY=0,lastX=0,lastY=0;this.canvas.addEventListener('pointerdown',e=>{this.dragging=true;startX=lastX=e.clientX;startY=lastY=e.clientY;this.canvas.setPointerCapture(e.pointerId);});this.canvas.addEventListener('pointermove',e=>{if(!this.dragging)return;this.yaw=Math.max(-.85,Math.min(.85,this.yaw-(e.clientX-lastX)*.0025));this.pitch=Math.max(-.30,Math.min(.27,this.pitch-(e.clientY-lastY)*.0018));lastX=e.clientX;lastY=e.clientY;});const stop=()=>this.dragging=false;this.canvas.addEventListener('pointerup',stop);this.canvas.addEventListener('pointercancel',stop);}
 resize(){this.camera.aspect=innerWidth/innerHeight;this.camera.fov=innerWidth<innerHeight?64:54;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);}
 setQuality(high){this.high=high;this.renderer.setPixelRatio(Math.min(devicePixelRatio,high?1.75:1));this.renderer.shadowMap.enabled=high;this.reflectionTarget.setSize(high?1024:512,high?1024:512);this.resize();try{localStorage.setItem('reviry-quality',high?'high':'low');}catch{}}
 setCastDirection(){this.camera.getWorldDirection(this.castDirection);this.castDirection.y=0;this.castDirection.normalize();}
 scatterFeed(){this.feedThrow={time:this.clock,start:this.camera.position.clone().add(new T.Vector3(0,-.3,0)),end:this.castPoint.clone()};}
 splash(){this.waterMaterial.uniforms.ripple.value.set(this.castPoint.x,this.castPoint.z,this.clock,1);}
 updateReflection(){this.reflectionCamera.copy(this.camera,false);this.reflectionCamera.position.y=-this.camera.position.y;const direction=new T.Vector3();this.camera.getWorldDirection(direction);direction.y=-direction.y;this.reflectionCamera.up.set(0,-1,0);this.reflectionCamera.lookAt(this.reflectionCamera.position.clone().add(direction));this.reflectionCamera.updateMatrixWorld();this.textureMatrix.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1);this.textureMatrix.multiply(this.reflectionCamera.projectionMatrix);this.textureMatrix.multiply(this.reflectionCamera.matrixWorldInverse);const hidden=[this.water,this.rig,this.stand,this.fishingLine,this.landingNet,this.fishGroup,this.sinker,this.feederCage,this.float,this.feedParticles];
 const visibility=hidden.map(o=>o.visible);hidden.forEach(o=>o.visible=false);
 // Clip the mirrored scene at the water plane so the underside of terrain cannot occlude it.
 this.renderer.clippingPlanes=[new T.Plane(new T.Vector3(0,1,0),-.015)];
 this.renderer.setRenderTarget(this.reflectionTarget);this.renderer.clear();this.renderer.render(this.scene,this.reflectionCamera);this.renderer.setRenderTarget(null);
 this.renderer.clippingPlanes=[];hidden.forEach((o,i)=>o.visible=visibility[i]);}

 render(dt){if(!this.basePosition)return;this.clock+=dt;if(this.windUniform)this.windUniform.value=this.clock;this.frameCount++;const g=this.game,t=this.clock;const target=this.baseDirection.clone().applyAxisAngle(UP,this.yaw);target.y+=this.pitch;this.camera.position.copy(this.basePosition);this.camera.position.y+=Math.sin(t*.7)*.006;this.camera.lookAt(this.camera.position.clone().add(target));
 const method=g.loadout?.method||'ledger',floating=method==='float',feeder=method==='feeder',floatHeld=floating&&['ready','waiting','bite','escaped'].includes(g.phase);
 this.rodBlank.material=feeder?this.feederMaterials:this.carbon;this.rodGroup.scale.y=(RODS[g.loadout?.rod]?.length||3.6)/3.6;
 const fight=g.phase==='fight',held=g.phase==='held',casting=g.phase==='casting',flying=g.phase==='flying';let rotX=floatHeld?-.95:-1.24,rotZ=floatHeld?.18:.40;
 if(casting){rotX=-.25+g.castPower*.85;rotZ=.16;}else if(flying){rotX=-1.35+Math.min(1,g.elapsed)*.2;}else if(held){rotX=-.68;rotZ=.18;}else if(fight){rotX=g.lifting?-.47:-.92;rotZ=.20+Math.sin(t*2)*g.stamina*.025;}
 this.rodGroup.rotation.x=T.MathUtils.damp(this.rodGroup.rotation.x,rotX,8,dt||.016);this.rodGroup.rotation.z=T.MathUtils.damp(this.rodGroup.rotation.z,rotZ,8,dt||.016);
 const biteSignal=g.phase==='bite'?(Math.sin(g.elapsed*10)*.04+.07)*(g.biteStyle==='dropback'?-1:1):0;
 const bend=fight?g.tension*.52:casting?-g.castPower*.28:feeder?.045+biteSignal:0;
 updateRodGeometry(this.rodGeometry,bend);
 for(let i=0;i<this.guides.length;i++){const f=(.54+i*.255)/2.2;rodPoint(f,bend,this.guides[i].position);this.guides[i].position.z+=.028;this.guides[i].rotation.x=-Math.PI/2+Math.atan(3*bend*f*f/2.2);}

 if(g.reeling&&fight){this.reelHandle.rotation.z+=dt*15;this.spool.rotation.z+=dt*8;}
 this.hand.visible=fight||held||casting||flying||floatHeld;
 const standVisible=!floating&&['ready','casting','flying','waiting','bite','escaped'].includes(g.phase);this.stand.visible=standVisible;
 this.indicator.visible=method==='ledger';
 const lift=g.phase==='bite'?(g.biteStyle==='dropback'?-1:1)*(.055+Math.sin(g.elapsed*8)*.035):0;this.indicator.position.y=.20+lift;this.indicatorLine.geometry.attributes.position.setY(1,.20+lift);this.indicatorLine.geometry.attributes.position.needsUpdate=true;
 const inHand=fight||held||casting||flying||floatHeld;
 this.camera.updateMatrixWorld(true);
 const rigPosition=inHand?this.heldRig.getWorldPosition(new T.Vector3()):this.restRig.position;
 const rigRotation=inHand?this.heldRig.getWorldQuaternion(new T.Quaternion()):this.restRig.quaternion;
 this.rig.position.lerp(rigPosition,1-Math.exp(-9*(dt||.016)));this.rig.quaternion.slerp(rigRotation,1-Math.exp(-9*(dt||.016)));
 this.camera.updateMatrixWorld(true);this.rodGroup.localToWorld(rodPoint(1,bend,this.tipPoint));const forward=this.castDirection.clone();forward.y=0;forward.normalize();// Distance is measured from the water's edge, so a tired fish never swims through dry bank geometry.
 let bankDistance=0;const origin=this.basePosition;
 for(let i=0;i<this.shoreline.length-1;i++){
  const a=this.shoreline[i],b=this.shoreline[i+1],ex=b[0]-a[0],ez=b[1]-a[1],den=forward.x*ez-forward.z*ex;
  if(Math.abs(den)<1e-8)continue;
  const ax=a[0]-origin.x,az=a[1]-origin.z,ray=(ax*ez-az*ex)/den,edge=(ax*forward.z-az*forward.x)/den;
  if(ray>0&&edge>=0&&edge<=1&&(bankDistance===0||ray<bankDistance))bankDistance=ray;
 }
 this.castPoint.copy(this.basePosition).addScaledVector(forward,bankDistance+(g.distance||30));this.castPoint.y=.015;
 if(flying){const progress=T.MathUtils.clamp(g.elapsed/1.1,0,1),end=this.castPoint.clone();this.castPoint.copy(this.tipPoint).lerp(end,progress);this.castPoint.y+=Math.sin(progress*Math.PI)*(2+(g.distance||30)*.12);}
 this.sinker.visible=flying&&!floating&&!feeder;this.sinker.position.copy(this.castPoint);this.sinker.scale.setScalar(Math.cbrt((g.loadout?.weight||40)/40));
 this.feederCage.visible=flying&&feeder;this.feederCage.position.copy(this.castPoint);
 this.float.visible=floating&&['waiting','bite','flying'].includes(g.phase);this.float.position.copy(this.castPoint);
 if(!flying){this.float.position.y=.015+Math.sin(t*1.5)*.008-(g.phase==='bite'?.10+Math.sin(g.elapsed*6)*.035:0);this.float.rotation.z=Math.sin(t*1.7)*.03;}
 if(this.feedThrow){const progress=Math.min(1,(t-this.feedThrow.time)/.9),dummy=new T.Object3D();
  for(let i=0;i<24;i++){const end=this.feedThrow.end.clone().add(new T.Vector3(Math.sin(i*2.4)*.9,0,Math.cos(i*2.4)*.9));dummy.position.copy(this.feedThrow.start).lerp(end,progress);dummy.position.y+=Math.sin(progress*Math.PI)*(2+(i%4)*.15);dummy.updateMatrix();this.feedParticles.setMatrixAt(i,dummy.matrix);}
  this.feedParticles.instanceMatrix.needsUpdate=true;this.feedParticles.visible=progress<1;if(progress>=1){this.feedThrow=null;this.splash();}
 }

 const a=this.tipPoint,b=this.castPoint;const middle=a.clone().lerp(b,.45);if(!fight)middle.y-=.25;const curve=new T.QuadraticBezierCurve3(a.clone(),middle,b.clone());const linePoints=[this.rodGroup.localToWorld(new T.Vector3(0,.06,.11))];
 if(method==='ledger'&&['waiting','bite'].includes(g.phase))linePoints.push(this.indicator.getWorldPosition(new T.Vector3()));
 for(const guide of this.guides)linePoints.push(guide.getWorldPosition(new T.Vector3()));
 linePoints.push(...curve.getPoints(20));this.fishingLine.geometry.setFromPoints(linePoints);

 if(this.frameCount%(this.high?2:4)===0||this.frameCount===1)this.updateReflection();
 this.stand.visible=standVisible;this.fishingLine.visible=!['ready','casting','landed','escaped'].includes(g.phase);
 this.fishGroup.visible=fight&&g.distance<12;this.fishGroup.position.copy(this.castPoint);this.fishGroup.position.y=-.025+Math.sin(t*4)*.04;this.fishGroup.rotation.y=Math.sin(t*1.7)*.5+Math.PI/2;this.tail.rotation.y=Math.sin(t*8)*.4;
 if(g.fish){const c=this.fishGroup.userData.body.material;c.color.setHex(g.fish.color).lerp(new T.Color(0xffffff),.68);const size=(g.fish.length||50)/94;this.fishGroup.scale.setScalar(size);}
 this.waterMaterial.uniforms.time.value=t;this.sky.position.copy(this.camera.position);this.renderer.render(this.scene,this.camera);
 }
 renderCatchPortrait(){
 const renderer=this.renderer,portrait=new T.Scene(),fish=this.fishGroup.clone(true);
 fish.position.set(0,0,0);fish.rotation.set(.03,-.30,-.04);fish.scale.setScalar(1);fish.visible=true;portrait.add(fish);portrait.environment=this.scene.environment;
 portrait.add(new T.HemisphereLight(0xe4efff,0x54503a,2));const light=new T.DirectionalLight(0xffedcd,3);light.position.set(1,2,3);portrait.add(light);
 const camera=new T.PerspectiveCamera(32,2,.01,10);camera.position.set(0,.12,1.8);camera.lookAt(-.08,0,0);
 const target=new T.WebGLRenderTarget(640,320),previous=renderer.getRenderTarget(),clear=renderer.getClearColor(new T.Color()),alpha=renderer.getClearAlpha();
 const pixels=new Uint8Array(640*320*4);renderer.setRenderTarget(target);renderer.setClearColor(0x000000,0);renderer.clear();renderer.render(portrait,camera);renderer.readRenderTargetPixels(target,0,0,640,320,pixels);
 renderer.setRenderTarget(previous);renderer.setClearColor(clear,alpha);target.dispose();
 const canvas=document.createElement('canvas');canvas.width=640;canvas.height=320;const ctx=canvas.getContext('2d'),data=ctx.createImageData(640,320);
 for(let y=0;y<320;y++)data.data.set(pixels.subarray((319-y)*640*4,(320-y)*640*4),y*640*4);
 ctx.putImageData(data,0,0);return canvas.toDataURL('image/png');
 }
 dispose(){this.renderer.dispose();}
}
