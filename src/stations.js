// Synthetic foregrounds describe a type of bank, not a surveyed fishing peg.
export const STATIONS={
 grass:{name:'Travnatý břeh',src:'assets/stations/grass.webp',edge:.70,reeds:.32},
 sand:{name:'Písčitý břeh',src:'assets/stations/sand.webp',edge:.72,reeds:0},
 gravel:{name:'Štěrkový břeh',src:'assets/stations/gravel.webp',edge:.70,reeds:.12},
 rock:{name:'Kamenitý břeh',src:'assets/stations/rock.webp',edge:.70,reeds:0},
 earth:{name:'Hlinitý břeh',src:'assets/stations/earth.webp',edge:.73,reeds:0},
};
const BANKS={vajgar:'grass',jarosov:'grass',vlkov:'sand',hejtman:'grass',stankov:'earth',lipno:'gravel',orlik:'rock',hnevkovice:'gravel',jordan:'grass',nezarka3:'earth',luznice10a:'grass',luznice10b:'sand',luznice10c:'earth',zadnikouty:'earth',vlkovmala:'sand'};
export function stationFor(id){return STATIONS[BANKS[id]||'grass'];}
export function stationLayout(w,h,image,station){
 const shoreTop=h*.75,scale=Math.max(w/image.width,(h-shoreTop)/(image.height*(1-station.edge)));
 return {shoreTop,x:(w-image.width*scale)/2,y:shoreTop-image.height*station.edge*scale,width:image.width*scale,height:image.height*scale};
}
