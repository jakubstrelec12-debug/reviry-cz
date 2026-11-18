import fs from 'node:fs/promises';
import {createWebGL2Context,WebGL2RenderingContext} from 'webgl-node';
import {createCanvas,Image} from '@napi-rs/canvas';
import sharp from 'sharp';
const root=new URL('../',import.meta.url).pathname;const width=1280,height=720;
process.chdir(root);const NativeRequest=globalThis.Request;globalThis.Request=class extends NativeRequest{constructor(input,options){super(typeof input==='string'&&!/^[a-z]+:/.test(input)?new URL(input,'file://'+root):input,options);}};
globalThis.WebGL2RenderingContext=WebGL2RenderingContext;globalThis.innerWidth=width;globalThis.innerHeight=height;globalThis.devicePixelRatio=1;globalThis.window={addEventListener(){}};globalThis.self=globalThis;globalThis.localStorage={getItem:()=>null,setItem(){}};globalThis.document={createElement(name){if(name==='canvas')return createCanvas(256,256);if(name==='img'){const img=new Image();img.addEventListener=(type,fn)=>{img['on'+type]=fn;};img.removeEventListener=()=>{};return img;}},createElementNS(ns,name){return this.createElement(name)}};
const nativeFetch=globalThis.fetch;globalThis.fetch=async(u)=>{if((typeof u==='string'?u:u.url).startsWith('blob:'))return nativeFetch(u);const p=(typeof u==='string'?u:u.url).replace(/^file:\/\//,'');const b=await fs.readFile(p.startsWith('/')?p:root+p);return new Response(b);};globalThis.ProgressEvent=class{constructor(type,data){Object.assign(this,{type},data)}};
const {canvas,gl}=createWebGL2Context(width,height,{antialias:true});
// The native adapter currently omits UNPACK_FLIP_Y for source-form texSubImage2D. Emulate the browser rule in the test harness.
const subImage=gl.texSubImage2D.bind(gl);gl.texSubImage2D=(target,level,x,y,...args)=>{if(args.length===3&&gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL)){const source=args[2],c=createCanvas(source.width,source.height),ctx=c.getContext('2d');ctx.translate(0,source.height);ctx.scale(1,-1);ctx.drawImage(source,0,0);args[2]=c;}return subImage(target,level,x,y,...args);};
const {LakeScene}=await import(root+'src/scene.js');const game={phase:'waiting',distance:30,stamina:1,tension:.3,elapsed:0,castPower:0,reeling:false,lifting:false};
const scene=await new LakeScene(canvas,game).init();for(let i=0;i<4;i++)scene.render(.016);
if(scene.assetWarnings.length)throw new Error(scene.assetWarnings.join('; '));if(gl.getError()!==gl.NO_ERROR)throw new Error('WebGL validation failed');
const pixels=new Uint8Array(width*height*4);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
await sharp(pixels,{raw:{width,height,channels:4}}).flip().png().toFile(process.argv[2]||root+'preview/vajgar-render.png');console.log({calls:scene.renderer.info.render.calls,triangles:scene.renderer.info.render.triangles,error:gl.getError()});
