import {DEFAULT_TRIP,validTrip,tripConditions,tripSummary,speciesActivity,activityFor} from './trip.js?v=0.24.1';
import {getVenue,venueWeights,SPECIES_NAMES} from './venues.js?v=0.24.1';
const $=id=>document.getElementById(id);
export class TripPlanner{
 constructor({game,onApply,onToggle}){
  this.game=game;this.onApply=onApply;this.onToggle=onToggle;this.opened=false;
  for(const id of ['tripDate','tripTime'])$(id).addEventListener('input',()=>this.render());
  $('tripOverlay').addEventListener('click',e=>{const b=e.target.closest('[data-trip-time]');if(b){$('tripTime').value=b.dataset.tripTime;this.render();}});
  $('tripClose').onclick=()=>this.close();$('tripApply').onclick=()=>{const v=this.value();if(!this.game.setTrip(v)){this.render();return;}this.onApply();this.close();};
  $('tripOverlay').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();this.close();}if(e.key==='Tab'){const nodes=[...$('tripOverlay').querySelectorAll('button:not(:disabled),input:not(:disabled)')],first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 }
 value(){return {date:$('tripDate').value,time:$('tripTime').value};}
 open(){this.returnFocus=document.activeElement;const v=this.game.trip||DEFAULT_TRIP;$('tripDate').value=v.date;$('tripTime').value=v.time;this.opened=true;$('tripOverlay').classList.remove('hidden');this.onToggle();this.render();$('tripClose').focus();}
 close(){this.opened=false;$('tripOverlay').classList.add('hidden');this.onToggle();this.returnFocus?.focus();}
 render(){
  const v=this.value(),valid=validTrip(v),blocked=this.game.enabledRods.some(r=>!['ready','escaped'].includes(r.phase));
  $('tripHelp').textContent=blocked?'Pro změnu data nebo času nejprve stáhni oba pruty a dokonči lov.':'Společné datum a čas pro oba pruty. Změna opustí původní zakrmená místa.';
  $('tripApply').disabled=blocked||!valid;$('tripError').textContent=valid?'':'Vyber platné datum (1900–2100) a čas.';
  if(!valid){$('tripPreview').replaceChildren();return;}
  const venue=getVenue(this.game.venueId),weights=venueWeights(this.game.loadout,this.game.venueId),activity=activityFor(venue.playable,weights,v),c=tripConditions(v);
  $('tripPreview').innerHTML=`<div class="trip-summary"><strong>${tripSummary(v)}</strong><p>${c.night?'Tmavší scéna s viditelnými indikátory.':c.edge>.3?'Teplé světlo nízko nad vodou.':'Denní světlo nad hladinou.'} ${activity>.95?'V průměru kratší čekání na záběr.':activity>.55?'V průměru delší čekání na záběr.':'Nízká aktivita: záběry přicházejí výrazně pomaleji.'}</p></div><div class="trip-species">${venue.playable.map(id=>`<div><span>${SPECIES_NAMES[id]}</span><b>${Math.round(speciesActivity(id,v)*100)} %</b></div>`).join('')}</div><p class="setup-small">Relativní aktivita proti základnímu letnímu ránu (100 %), nikoli pravděpodobnost úlovku. Druh ryby dál závisí na nástraze a krmení.</p>`;
 }
}
