export const FISH_PHOTOS={
 carp:{name:'Kapr obecný',src:'assets/fish/carp.webp',author:'Dezidor',source:'https://commons.wikimedia.org/wiki/File:Cyprinus_carpio.jpg',license:'CC BY-SA 3.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/',changes:'Ořez a zmenšení'},
 tench:{name:'Lín obecný',src:'assets/fish/tench.webp',author:'Dezidor',source:'https://commons.wikimedia.org/wiki/File:Tinca_tinca.jpeg',license:'CC BY 3.0',licenseUrl:'https://creativecommons.org/licenses/by/3.0/',changes:'Zmenšení'},
 bream:{name:'Cejn velký',src:'assets/fish/bream.webp',author:'Микова Наталия',source:'https://commons.wikimedia.org/wiki/File:Carp_bream.jpg',license:'Public domain',licenseUrl:'https://commons.wikimedia.org/wiki/File:Carp_bream.jpg',changes:'Zmenšení'},
};
export function photoFor(fish){return FISH_PHOTOS[fish.speciesId]||Object.values(FISH_PHOTOS).find(p=>p.name===fish.name);}
export function showCatchPhoto(fish,image,credit){
 const photo=photoFor(fish);credit.replaceChildren();image.removeAttribute('src');
 if(!photo){credit.textContent='Fotografie tohoto druhu není dostupná.';return;}
 image.alt=photo.name+' – skutečná fotografie druhu';image.src=new URL('../'+photo.src,import.meta.url).href;
 const note=document.createElement('span');note.textContent='Ilustrační fotografie druhu · '+photo.changes;
 const source=document.createElement('a');source.href=photo.source;source.target='_blank';source.rel='noopener';source.textContent='Foto: '+photo.author;
 const license=document.createElement('a');license.href=photo.licenseUrl;license.target='_blank';license.rel='noopener';license.textContent=photo.license;
 credit.append(note,source,document.createTextNode(' · '),license);
 image.onerror=()=>{image.removeAttribute('src');credit.textContent='Fotografii se nepodařilo načíst. Obnov stránku a zkus to znovu.';};
}
