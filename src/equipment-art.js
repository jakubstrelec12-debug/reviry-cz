// Original illustrations of tackle types. These are not manufacturer product photographs.
export function equipmentArt(type,id='sample'){
 const gradient=`metal-${id}`;
 const defs=`<defs><linearGradient id="${gradient}" x2="0" y2="1"><stop stop-color="#dae1d0"/><stop offset=".35" stop-color="#75867b"/><stop offset=".65" stop-color="#bbc7b0"/><stop offset="1" stop-color="#334e42"/></linearGradient></defs>`;
 let content='';
 if(type==='rod')content=`<path d="M24 81L214 22" stroke="#71867b" stroke-width="5"/><path d="M24 81L76 65" stroke="#a0875a" stroke-width="11"/><path d="M78 65L215 22" stroke="#172d27" stroke-width="3"/><path d="M187 31L215 22" stroke="#dfb46e" stroke-width="2"/>${[92,121,149,174,197].map((x,i)=>`<ellipse cx="${x}" cy="${64-i*8}" rx="${5-i*.6}" ry="3" stroke="#b6c3af" fill="none"/>`).join('')}<path d="M61 72l2 12" stroke="#8f9e8d" stroke-width="3"/><ellipse cx="62" cy="86" rx="13" ry="7" fill="url(#${gradient})"/>`;
 if(type==='line')content=`<ellipse cx="117" cy="72" rx="50" ry="16" fill="#334c40"/><path d="M67 34v38q50 29 100 0V34" fill="url(#${gradient})"/><ellipse cx="117" cy="34" rx="50" ry="17" fill="#a6b39b"/><ellipse cx="117" cy="34" rx="34" ry="10" fill="#324d3d"/>${[43,48,53,58,63].map(y=>`<path d="M68 ${y}q49 20 98 0" stroke="#c3c9a5" fill="none" opacity=".6"/>`).join('')}<path d="M163 49q35-14 48 19" stroke="#cfd4b4" fill="none"/>`;
 if(type==='feed')content=`<path d="M81 12h79l7 76H72z" fill="#344e3b" stroke="#9da98e"/><path d="M82 12h78l-1 9H81z" fill="#c8c3a2"/><rect x="82" y="35" width="74" height="34" rx="3" fill="#b3a572"/><path d="M86 75h66" stroke="#c9d2b6"/><text x="119" y="54" text-anchor="middle" font-size="9" fill="#203d2c">GROUNDBAIT</text>`;
 return `<svg viewBox="0 0 240 100" aria-hidden="true">${defs}${content}</svg>`;
}
