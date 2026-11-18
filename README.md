# REVÍRY CZ — Vajgar 0.2

První hratelná **3D pracovní rekonstrukce Vajgaru**, pro rychlé vyzkoušení na iPhonu přes Safari. Není to hotová fotorealistická rekonstrukce ani nativní iOS aplikace.

**Hrát:** https://jakubstrelec12-debug.github.io/reviry-cz/?v=0.2.0

Nejlépe na šířku. Kód i mapová data se načítají ze stejného webu; 3D engine je přiložený, není závislý na CDN. WebGL je nutný. Pro méně výkonná zařízení přepnout HD na ECO.

## Co lze vyzkoušet

- Prostorová scéna, hladina s odrazem skutečně vykresleného okolí, pohyb vody a kruhy po náhozu.
- Mapový tvar břehů a ostrova a 358 půdorysů budov v okolí historického centra.
- Prostorový prut a naviják, stojan, mechanické čihátko, vlasec, změna ohybu při zdolávání.
- Nához podržením a puštěním, čekání, záběr, uchopení prutu, samostatný zásek, navíjení, brzda, únava a podebrání.
- Deník v místním úložišti prohlížeče. Pozastavení při otevření menu a odchodu do jiné aplikace.

Ovládání: podrž **NAHODIT**, pusť, po záběru klepni **VZÍT PRUT** a poté **ZASEKNOUT**. Při zdolávání drž **NAVÍJET**, při výpadu uvolni a uprav brzdu. Unavenou rybu do 4 metrů podeber. Při čekání lze nástrahu stáhnout a nahodit jinam. Tažením po scéně se rozhlížíš a volíš směr dalšího náhozu.

## Přesnost a omezení

Břeh a ostrov jsou převzaté z OpenStreetMap, relace 1744135. Půdorysy budov odpovídají mapě; jejich výšky, střechy, fasády, vegetace a blízký terén jsou převážně procedurální aproximace. Místo kamery na jižním břehu je odvozené z mapy, bez zaměření přístupu a povoleného rybolovu. Herní hloubky ani výskyt a chování ryb nejsou měřením reality nebo rybářským řádem.

Jeden prut, jedna technika. Modely ruky, ryby i vybavení jsou základní. Další výtvarná práce a ověření na fyzickém iPhonu jsou potřebné, než lze mluvit o finální kvalitě. Nativní distribuce není zatím zajištěna.

## Vývoj a ověření

Bez instalace závislostí: `node dev-server.mjs` a http://localhost:3000. Testy: `node --test tests/*.test.js`.

Automatické testy ověřují celý cyklus lovu, chyby při zdolávání, pauzu a geografické podmínky. Konstrukce scény prošla samostatnou CPU kontrolou všech vrcholů a osmi herních stavů. Dostupný testovací prohlížeč nevytvořil WebGL kontext, takže GPU výstup a výkon na iPhonu nebyly ověřeny. Před finálním hodnocením nutná skutečná hra na cílovém zařízení.

Původní 2D verze je v `legacy/`; její data se do nového deníku nepřevádějí.

## Zdroje a licence

© OpenStreetMap contributors, ODbL 1.0. Viz [data/README.md](data/README.md). Three.js r160: MIT, plné znění v `vendor/LICENSE-three.txt`. Herní modely a procedurální materiály vytvořené pro tento projekt. Fotografie dodané jako reference nejsou do hry vložené.
