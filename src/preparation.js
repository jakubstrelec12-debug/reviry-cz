import {METHODS,RODS,RIGS,BAITS,FEEDS,methodPreset,validateLoadout,setupSummary,speciesWeights} from './tackle.js?v=0.5.0';
const $=id=>document.getElementById(id);
const fields={
 rod:['Prut',false],rig:['Montáž',false],line:['Kmenový vlasec',true],hook:['Háček',true],leader:['Návazec',true],weight:['Zátěž',true],bait:['Nástraha na háček',false],feed:['Krmení',false],feedPortion:['Jedna dávka zakrmení',true],
};
function options(values,value){return values.map(([id,label])=>`<option value="${id}"${id===value?' selected':''}>${label}</option>`).join('');}
function select(key,value,values){return `<label class="tackle-field" for="tackle-${key}"><span>${fields[key][0]}</span><select id="tackle-${key}" name="${key}">${options(values,value)}</select></label>`;}
export function rigDiagram(v){
 const floating=v.method==='float',feeding=v.method==='feeder',hair=['hair','method'].includes(v.rig),short=v.rig==='method';
 const weight=floating?`<ellipse cx="87" cy="98" rx="12" ry="23" fill="#cbb783"/><path d="M87 54v22m0 45v20" stroke="#f18658" stroke-width="4"/><circle cx="87" cy="174" r="4" fill="#aaa"/><circle cx="87" cy="191" r="3" fill="#aaa"/>`:feeding?`<rect x="72" y="118" width="30" height="43" rx="${short?14:3}" fill="#6f7e6a" stroke="#d0cfb0"/><path d="M79 120v38m8-38v38m8-38v38m-21-28h26m-26 12h26" stroke="#d0cfb0" opacity=".7"/>`:`<ellipse cx="87" cy="138" rx="13" ry="21" fill="#9a9c87"/>`;
 return `<svg viewBox="0 0 300 350" role="img" aria-label="Schéma montáže: ${RIGS[v.rig].name}"><path d="M87 28v190" stroke="#b9c5b0" fill="none" stroke-width="1.7"/>${weight}<ellipse cx="87" cy="223" rx="3" ry="7" fill="none" stroke="#e9e1c3"/><path d="M87 230v${short?37:58}" stroke="#c0b683"/><path d="M87 ${short?267:288}v13q0 14 10 14q10 0 10-12l-4 3" stroke="#e6dfc2" stroke-width="2" fill="none"/>${hair?'<path d="M90 299q-4 26 7 26" fill="none" stroke="#b9c5b0"/>':''}<circle cx="${hair?101:105}" cy="${hair?325:302}" r="${v.bait==='boilie'?9:5}" fill="${v.bait==='worm'?'#bb8d72':'#d0b56d'}"/>
 <g fill="#bfcabd" font-size="10" font-family="system-ui"><text x="130" y="45">Vlasec ${v.line.toFixed(2)} mm</text><text x="130" y="${floating?100:145}">${floating?'Splávek':feeding?'Krmítko':'Olovo'} ${v.weight} g</text><text x="130" y="226">${floating?'Spoj návazce':'Obratlík'}</text><text x="130" y="270">Návazec ${v.leader} cm</text><text x="130" y="300">Háček č. ${v.hook}</text><text x="130" y="327">${BAITS[v.bait].name}</text></g></svg>`;
}
export class Preparation {
 constructor({game,onApply,onClose}){this.game=game;this.onApply=onApply;this.onClose=onClose;this.tab='method';this.opened=false;
 $('setupTabs').addEventListener('click',e=>{const button=e.target.closest('[data-tab]');if(!button)return;this.tab=button.dataset.tab;this.render();$('setupTabs').querySelector(`[data-tab="${this.tab}"]`).focus();});
 $('setupTabs').addEventListener('keydown',e=>{const buttons=[...$('setupTabs').children],index=buttons.findIndex(b=>b.dataset.tab===this.tab);if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(index+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;buttons[next].click();}});
 $('setupForm').addEventListener('click',e=>{const button=e.target.closest('[data-method]');if(!button||button.dataset.method===this.draft.method)return;this.draft=methodPreset(button.dataset.method,this.draft);this.render();$('setupForm').querySelector(`[data-method="${this.draft.method}"]`).focus();});
 $('setupForm').addEventListener('change',e=>{const key=e.target.name;if(!Object.hasOwn(this.draft,key))return;this.draft[key]=key==='depth'||fields[key]?.[1]?Number(e.target.value):e.target.value;
  if(key==='rig'){if(!RIGS[this.draft.rig].baits.includes(this.draft.bait))this.draft.bait=RIGS[this.draft.rig].baits[0];if(this.draft.rig==='method')this.draft.leader=Math.min(20,this.draft.leader);}
  this.render();const next=$('setupForm').querySelector(`[name="${key}"]`);next?.focus();
 });
 $('setupApply').onclick=()=>{const errors=validateLoadout(this.draft);if(errors.length)return;this.onApply({...this.draft});};
 $('setupClose').onclick=()=>this.onClose();
 $('setupOverlay').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();this.onClose();}if(e.key==='Tab'){
  const focusable=[...$('setupOverlay').querySelectorAll('button:not(:disabled),select,input,a[href]')].filter(el=>el.offsetParent!==null),first=focusable[0],last=focusable.at(-1);
  if(e.shiftKey&&document.activeElement===first){last.focus();e.preventDefault();}else if(!e.shiftKey&&document.activeElement===last){first.focus();e.preventDefault();}
 }});
 }
 open(){this.returnFocus=document.activeElement;this.opened=true;this.draft={...this.game.loadout};this.tab='method';$('setupOverlay').classList.remove('hidden');this.render();$('setupClose').focus();}
 close(){this.opened=false;$('setupOverlay').classList.add('hidden');this.returnFocus?.focus();}
 render(){const v=this.draft,m=METHODS[v.method],rig=RIGS[v.rig];
 for(const button of $('setupTabs').children){button.classList.toggle('active',button.dataset.tab===this.tab);button.setAttribute('aria-selected',String(button.dataset.tab===this.tab));button.tabIndex=button.dataset.tab===this.tab?0:-1;}
 let html='';
 if(this.tab==='method')html=`<div class="method-grid">${Object.entries(METHODS).map(([id,method],i)=>`<button type="button" data-method="${id}" class="method-card ${id===v.method?'selected':''}" aria-pressed="${id===v.method}"><span class="method-number">0${i+1}</span><strong>${method.name}</strong><small>${method.subtitle}</small><span class="method-check">${id===v.method?'VYBRÁNO':'VYBRAT'}</span></button>`).join('')}</div><p class="method-description">${m.description}</p><button type="button" class="setup-next" id="toAssembly">Sestavit montáž →</button>`;
 if(this.tab==='assembly')html=`<div class="tackle-fields">${select('rod',v.rod,m.rods.map(id=>[id,RODS[id].name]))}${select('rig',v.rig,m.rigs.map(id=>[id,RIGS[id].name]))}${select('line',v.line,[.16,.20,.25,.30,.35].map(n=>[n,`${n.toFixed(2)} mm`]))}${select('hook',v.hook,[6,8,10,12,14].map(n=>[n,`č. ${n}`]))}${select('leader',v.leader,[10,20,40,60].map(n=>[n,`${n} cm`]))}${select('weight',v.weight,m.weights.map(n=>[n,`${n} g`]))}</div><p class="method-description">${rig.detail}</p>${v.method==='float'?`<label class="depth-control" for="tackle-depth">Hloubka pod splávkem <b>${v.depth.toFixed(2)} m</b><input id="tackle-depth" name="depth" type="range" min="0.5" max="3" step="0.25" value="${v.depth}"></label><p class="setup-small">Herní hloubka místa je 2 m. Nejde o skutečné měření dna Vajgaru.</p>`:''}`;
 if(this.tab==='bait')html=`<div class="tackle-fields">${select('bait',v.bait,rig.baits.map(id=>[id,BAITS[id].name]))}</div><p class="method-description">${BAITS[v.bait].detail}</p><div class="bait-focus"><span>HERNÍ ZAMĚŘENÍ NÁSTRAHY</span><strong>${['Kapr obecný','Lín obecný','Cejn velký'][speciesWeights(v).indexOf(Math.max(...speciesWeights(v)))]}</strong><p>Jde o vyšší šanci, ne zaručený úlovek.</p></div>`;
 if(this.tab==='feed')html=`<div class="tackle-fields">${select('feed',v.feed,Object.entries(FEEDS).filter(([id])=>!(v.method==='feeder'&&id==='grain')).map(([id,f])=>[id,f.name]))}${select('feedPortion',v.feedPortion,[50,150,300].map(n=>[n,`${n} g`]))}</div><p class="method-description">${FEEDS[v.feed].detail}.</p><div class="bait-focus"><span>ZÁSOBY VE VÝPRAVĚ</span><strong>${v.feed==='none'?'Bez krmení':`${this.game.feedStocks[v.feed]} g`}</strong><p>${v.method==='feeder'?'Při dopadu krmítka se spotřebuje 20 g směsi.':'Po náhozu použij tlačítko ZAKRMIT.'} Krmení působí v daném místě a postupně slábne. Nához jinam jeho vliv sníží.</p></div>`;
 $('setupForm').innerHTML=html;
 if($('toAssembly'))$('toAssembly').onclick=()=>{this.tab='assembly';this.render();};
 $('rigPreview').innerHTML=rigDiagram(v);$('setupSummary').textContent=setupSummary(v);$('setupRod').textContent=RODS[v.rod].name;
 $('setupPreviewName').textContent=RIGS[v.rig].name;
 const errors=validateLoadout(v);$('setupErrors').textContent=errors.join(' ');$('setupApply').disabled=errors.length>0;
 $('setupApply').textContent=['waiting','bite','held'].includes(this.game.phase)?'STÁHNOUT A POUŽÍT SESTAVU':'POUŽÍT SESTAVU A CHYTAT';
 }
}
