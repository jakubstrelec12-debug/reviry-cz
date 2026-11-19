import * as T from '../vendor/three.module.js';

// One continuous tapered blank. The guides and line use this same centreline.
export function rodPoint(t,bend=0,out=new T.Vector3()) {
  return out.set(0,t*2.2,bend*t*t*t);
}
export function makeRodGeometry(segments=64,sides=10) {
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.BufferAttribute(new Float32Array((segments+1)*(sides+1)*3),3));
  const indices=[];
  for(let i=0;i<segments;i++)for(let j=0;j<sides;j++){
    const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,b,a+1,b,b+1,a+1);
  }
  geometry.setIndex(indices);geometry.userData={segments,sides};updateRodGeometry(geometry,0);return geometry;
}
export function updateRodGeometry(geometry,bend) {
  const {segments,sides}=geometry.userData,p=geometry.attributes.position;
  for(let i=0;i<=segments;i++){
    const t=i/segments,point=rodPoint(t,bend),radius=.0062*(1-t)+.0014;
    const tangent=new T.Vector3(0,2.2,3*bend*t*t).normalize();
    const across=new T.Vector3(0,-tangent.z,tangent.y);
    for(let j=0;j<=sides;j++){
      const a=j/sides*Math.PI*2;
      p.setXYZ(i*(sides+1)+j,Math.cos(a)*radius,point.y+across.y*Math.sin(a)*radius,point.z+across.z*Math.sin(a)*radius);
    }
  }
  p.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
}

// Body axis: mouth at +X, tail at -X. Vertex colour gives a dark back and pale belly.
export function fishBodyGeometry() {
  const positions=[],colors=[],uv=[],indices=[],rings=48,sides=32;
  for(let i=0;i<=rings;i++){
    const t=i/rings,x=-.46+t*.94;
    const profile=Math.pow(Math.sin(Math.PI*t),.65)*(.74+.28*t);
    for(let j=0;j<=sides;j++){
      const a=j/sides*Math.PI*2,y=Math.cos(a)*.205*profile,z=Math.sin(a)*.135*profile;
      positions.push(x,y,z);uv.push(t*4,j/sides*2);
      const dorsal=Math.cos(a),c=new T.Color();
      if(dorsal>.1)c.setRGB(.47-dorsal*.27,.43-dorsal*.22,.25-dorsal*.15);
      else c.setRGB(.48-dorsal*.19,.44-dorsal*.18,.29-dorsal*.20);
      c.toArray(colors,colors.length);
      if(i<rings&&j<sides){const n=i*(sides+1)+j;indices.push(n,n+1,n+sides+1,n+1,n+sides+2,n+sides+1);}
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function fin(outline,parent,material) {
  const shape=new T.Shape(outline.map(([x,y])=>new T.Vector2(x,y)));
  const m=new T.Mesh(new T.ShapeGeometry(shape),material);parent.add(m);
  const rays=[];for(let i=1;i<outline.length-1;i++)rays.push(new T.Vector3(...outline[0],.001),new T.Vector3(...outline[i],.001));
  const lines=new T.LineSegments(new T.BufferGeometry().setFromPoints(rays),new T.LineBasicMaterial({color:0x625b3b,transparent:true,opacity:.45}));m.add(lines);return m;
}
export function makeFishModel() {
  const fish=new T.Group();
  const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.36,metalness:.12});
  const body=new T.Mesh(fishBodyGeometry(),material);fish.add(body);
  // Scale pattern is a normal/bump detail rather than hundreds of separate meshes.
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#858585';ctx.fillRect(0,0,256,256);
  for(let row=-1;row<9;row++)for(let col=-1;col<9;col++){
    const x=col*32+(row%2)*16,y=row*32;
    ctx.strokeStyle='#505050';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(x,y,19,-.15,Math.PI+.15);ctx.stroke();
    ctx.strokeStyle='#b8b8b8';ctx.beginPath();ctx.arc(x,y+2,17,.2,Math.PI-.2);ctx.stroke();
  }
  const scaleMap=new T.CanvasTexture(c);scaleMap.wrapS=scaleMap.wrapT=T.RepeatWrapping;material.bumpMap=scaleMap;material.bumpScale=.005;
  const albedo=document.createElement('canvas');albedo.width=albedo.height=256;const paint=albedo.getContext('2d');paint.fillStyle='#ffffff';paint.fillRect(0,0,256,256);paint.globalAlpha=.26;paint.drawImage(c,0,0);
  const scaleColor=new T.CanvasTexture(albedo);scaleColor.colorSpace=T.SRGBColorSpace;scaleColor.wrapS=scaleColor.wrapT=T.RepeatWrapping;material.map=scaleColor;
  const finMaterial=new T.MeshStandardMaterial({color:0x8e8054,roughness:.48,side:T.DoubleSide,transparent:true,opacity:.85});
  const tail=new T.Group();tail.position.x=-.43;fish.add(tail);
  fin([[0,0],[-.25,.20],[-.21,.035],[-.25,-.18],[-.03,-.045]],tail,finMaterial);
  fin([[-.28,.12],[-.23,.28],[.05,.27],[.20,.12]],fish,finMaterial);
  fin([[-.25,-.10],[-.30,-.23],[-.08,-.16]],fish,finMaterial);
  for(const side of [-1,1]){
    const pectoral=fin([[.20,-.04],[.01,-.19],[-.10,-.10]],fish,finMaterial);pectoral.position.z=side*.10;pectoral.rotation.x=side*.6;
    const eye=new T.Mesh(new T.SphereGeometry(.025,16,12),new T.MeshStandardMaterial({color:0xcbad65,roughness:.18}));eye.position.set(.335,.058,side*.092);fish.add(eye);
    const pupil=new T.Mesh(new T.SphereGeometry(.013,12,10),new T.MeshStandardMaterial({color:0x080c09,roughness:.08}));pupil.position.set(.340,.060,side*.111);fish.add(pupil);
    const gill=new T.EllipseCurve(.23,0,.045,.12,-1.15,1.15);const points=gill.getPoints(24).map(p=>new T.Vector3(p.x,p.y,side*.113));
    fish.add(new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:0x625b3b})));
  }
  const lip=new T.Mesh(new T.TorusGeometry(.027,.007,8,20),new T.MeshStandardMaterial({color:0x9e8b62,roughness:.4}));lip.rotation.y=Math.PI/2;lip.position.set(.455,-.018,0);fish.add(lip);
  fish.userData={body,tail};return fish;
}
