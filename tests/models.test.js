import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeRodGeometry,updateRodGeometry,rodPoint,fishBodyGeometry} from '../src/models.js';

test('loaded blank remains continuous and ends on the same curve as the line',()=>{
 const g=makeRodGeometry();
 for(const bend of [-.28,0,.52]){
  updateRodGeometry(g,bend);const p=g.attributes.position,{segments,sides}=g.userData;
  for(let i=0;i<=segments;i++){
   let y=0,z=0;for(let j=0;j<sides;j++){const index=i*(sides+1)+j;y+=p.getY(index)/sides;z+=p.getZ(index)/sides;}
   const expected=rodPoint(i/segments,bend);assert.ok(Math.abs(y-expected.y)<1e-6);assert.ok(Math.abs(z-expected.z)<1e-6);
  }
  for(const name of ['position','normal'])assert.ok([...g.attributes[name].array].every(Number.isFinite));
 }
});

test('fish mesh has a full silhouette, finite normals and valid triangles',()=>{
 const g=fishBodyGeometry();g.computeBoundingBox();
 assert.ok(g.boundingBox.max.x-g.boundingBox.min.x>.9);
 assert.ok(g.boundingBox.max.y-g.boundingBox.min.y>.3);
 for(const name of ['position','normal','uv','color'])assert.ok([...g.attributes[name].array].every(Number.isFinite));
 assert.ok([...g.index.array].every(i=>i<g.attributes.position.count));
 // Surface winding must face out: an upper flank needs upward normals.
 const p=g.attributes.position,n=g.attributes.normal;let checked=0;
 for(let i=0;i<p.count;i++)if(p.getY(i)>.15){assert.ok(n.getY(i)>0);checked++;}
 assert.ok(checked>20);
});
