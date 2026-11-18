import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const lake=JSON.parse(fs.readFileSync(new URL('../data/vajgar.json',import.meta.url)));
function inside(p,polygon){let result=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])result=!result;}return result;}
test('Vajgar uses closed source rings and projected metre units',()=>{assert.equal(lake.units,'metres');assert.equal(lake.source.osm_id,1744135);for(const ring of [lake.shoreline,lake.island]){assert.deepEqual(ring[0],ring.at(-1));for(const p of ring){assert.ok(p.every(Number.isFinite));}}});
test('the island sits within the real lake footprint',()=>{for(const p of lake.island)assert.ok(inside(p,lake.shoreline));});
test('fishing camera stands on land, not underwater',()=>{const [x,y,z]=lake.station.position;assert.ok(y>1.3&&y<2);assert.equal(inside([x,z],lake.shoreline),false);});
test('mapped lake area agrees with the expected scale',()=>{let a=0;for(let i=1;i<lake.shoreline.length;i++){const p=lake.shoreline[i-1],q=lake.shoreline[i];a+=p[0]*q[1]-q[0]*p[1];}const ha=Math.abs(a/2)/10000;assert.ok(ha>44&&ha<48);});
test('mapped buildings have valid source footprints and bounded heights',()=>{assert.equal(lake.buildings.length,358);for(const b of lake.buildings){assert.deepEqual(b.outline[0],b.outline.at(-1));assert.ok(b.height>=2.5&&b.height<=45);}});
