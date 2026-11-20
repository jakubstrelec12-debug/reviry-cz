const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// Use the unobstructed strip of water above the actual fight controls.
// Near the bank, fish and net share one projection and the same bearing scale.
export function fightPoint(w,h,waterTop,shoreTop,distance,angle,inset={}){
 const portrait=w<=650&&h>w;
 let top=waterTop,bottom=shoreTop;
 if(portrait&&Number.isFinite(inset.fightPanelTop)){
  bottom=Math.min(bottom,inset.fightPanelTop-30);
  top=Math.max(top,(inset.missionBottom||inset.headerBottom||0)+14);
  top=Math.min(top,bottom-70);
 }
 const near=bottom-14,far=Math.min(near-12,top+18);
 const d=distance<=3.3?clamp(distance,2.5,3.3):distance;
 const side=h<w&&Number.isFinite(inset.fightPanelRight)&&inset.fightPanelRight<w*.7;
 const left=side?inset.fightPanelRight+20:0,right=side?w-20:w;
 return {x:(left+right)/2+Math.sin(angle)*(right-left)*.65,y:near+(far-near)*clamp(Math.log1p(d)/Math.log(65),0,1)};
}

export function netGuidance(g){
 if(!g.netDeployed)return g.distance>5?'Přitáhni rybu blíž. Podběrák je označený na hladině.':g.stamina>.35?'Ještě rybu unav, pak vlož podběrák.':'Vlož podběrák do vody.';
 const offset=g.fishBearing-g.netAngle;
 if(Math.abs(offset)>=.1)return offset<0?'Ryba je vlevo od koše — veď ji vpravo.':'Ryba je vpravo od koše — veď ji vlevo.';
 if(g.distance>3.3)return 'Směr sedí. Přitáhni rybu blíž ke koši.';
 if(g.stamina>.22)return 'Ryba je nad košem, ještě ji unav.';
 if(g.tension<.15)return 'Ryba je nad košem — dober povolený vlasec.';
 if(g.tension>.85)return 'Ryba je nad košem — povol brzdu.';
 return 'Ryba je nad košem — drž směr a napnutý vlasec.';
}
