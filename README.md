# REVÍRY CZ — Vajgar 0.5

Hratelná 3D pracovní rekonstrukce Vajgaru pro Safari na iPhonu. Grafika prostředí nadále není finální ani fotorealistická. Není to nativní iOS aplikace.

**Hrát:** https://jakubstrelec12-debug.github.io/reviry-cz/?v=0.5.0

Nejlépe na šířku. Engine i fotografie se načítají ze stejného webu. Vykreslování vyžaduje WebGL 2; režim ECO snižuje rozlišení a vypíná stíny.

## Příprava a lov

Po otevření vyber **PŘIPRAVIT VÝPRAVU**. Přípravu lze později otevřít tlačítkem **Montáž** v horní liště.

1. **Technika:** položená s mechanickým čihátkem, feeder s barevnou citlivou špičkou, nebo plavaná se splávkem. Plavaná má také detail signalizace v rohu obrazovky.
2. **Montáž:** šest sestav podle techniky, šest prutů, průměr vlasce, háček, délka návazce a hmotnost olova / krmítka / splávku. U plavané i hloubka pod splávkem. Schéma se průběžně mění podle voleb.
3. **Nástraha:** kukuřice, žížala, bílí červi, pečivo, boilies nebo peleta podle vhodnosti k montáži. Nehodící se kombinace nelze použít.
4. **Krmení:** bez krmení, partikl, jemná směs nebo mikropelety; dávka zakrmení 50 / 150 / 300 g. Každé krmení má pro výpravu zásobu 1 kg.

Podrž **NAHODIT** a pusť. U položené a feederu při záběru nejprve **VZÍT PRUT**, potom **ZASEKNOUT**. U plavané **ZASEKNOUT** přímo při ponoření splávku. Drž **NAVÍJET**, při silném tahu uvolni nebo povol brzdu. Unavenou rybu do 4 metrů od hrany vody podeber.

Po náhozu lze použít **ZAKRMIT**. Feeder při dopadu automaticky vysype 20 g zvoleného krmení, pokud je dostatečná zásoba. Působení krmného místa slábne během herního času a s náhozem do jiné vzdálenosti nebo směru. Při vyčerpání zásoby lze dál chytat bez dalšího zakrmení.

Volby mění hru: nástraha a krmení ovlivňují výběr ryb, průměr vlasce napětí při zdolávání, prut délku náhozu a navíjení, hloubka u plavané četnost záběrů. To jsou zjednodušené herní parametry, nikoli měření revíru nebo skutečné pravděpodobnosti úlovků. Tvar montáže, háček a délka návazce se zobrazují ve schématu a kontroluje se jejich slučitelnost; nejde o úplnou fyzikální simulaci montáže pod vodou.

Sestava se ukládá pro příští spuštění. Změna během čekání nejprve stáhne nástrahu; během zdolávání nelze sestavu měnit. Deník uchovává hmotnost, délku a skutečně použitou sestavu. Otevřená příprava, deník a přechod do jiné aplikace lov pozastaví.

## Fotografie úlovků

Karta úlovku a deník používají skutečné lokálně přiložené fotografie kapra, lína a cejna. U fotografie je autor, zdroj, licence a označení **ilustrační fotografie druhu**: nejde o snímek konkrétního virtuálního úlovku. Ve 3D scéně při zdolávání zůstává pracovní model. Zdroje a podmínky jsou v [assets/CREDITS.md](assets/CREDITS.md).

## Přesnost a omezení

Břeh a ostrov jsou převzaté z OpenStreetMap, relace 1744135. Půdorysy budov odpovídají mapě; jejich výšky, střechy, fasády, vegetace a blízký terén jsou převážně procedurální aproximace. Místo kamery na jižním břehu je odvozené z mapy, bez zaměření přístupu a povoleného rybolovu. Herní hloubky ani výskyt a chování ryb nejsou měřením reality nebo rybářským řádem.

Jeden aktivní prut, tři techniky. Přívlač zatím není implementovaná. Modely ruky, ryby ve scéně i vybavení jsou základní. Další výtvarná práce a ověření na fyzickém iPhonu jsou potřebné, než lze mluvit o finální kvalitě. Nativní distribuce není zatím zajištěna.

## Vývoj a ověření

Bez instalace závislostí: `node dev-server.mjs` a http://localhost:3000. Testy: `node --test tests/*.test.js`.

Automatické testy ověřují celý cyklus lovu, chyby při zdolávání, pauzu a geografické podmínky. Konstrukce scény prošla samostatnou CPU kontrolou všech vrcholů a osmi herních stavů. Testovací prohlížeč nevytvořil WebGL kontext. Ve verzi 0.3 byl skutečný WebGL výstup ověřen samostatně přes webgl-node a Mesa, včetně kontroly chyb shaderů a načtení materiálů. Snímek je v preview/. Výkon na fyzickém iPhonu nebyl měřen. Před finálním hodnocením nutná skutečná hra na cílovém zařízení.

Původní 2D verze je v `legacy/`; její data se do nového deníku nepřevádějí.

## Zdroje a licence

© OpenStreetMap contributors, ODbL 1.0. Viz [data/README.md](data/README.md). Three.js r160: MIT, plné znění v `vendor/LICENSE-three.txt`. Herní modely a procedurální materiály vytvořené pro tento projekt. Fotografie dodané jako reference nejsou do hry vložené.

## Změny 0.3

Fotografické materiály země, fotografická obloha, vegetační billboardy odvozené z detailního stromu, upravená voda a směrování slunce, oprava překážejících kamenů, výhled a mechanické čihátko. Viz assets/CREDITS.md. Zástavba a rybářské vybavení stále mají pracovní modely; tato verze nedosahuje původních fotorealistických referencí.

Volitelný skutečný render bez prohlížeče: nainstalovat vývojové závislosti, na Linuxu zajistit EGL/GLES (libegl1, libgles2 a Mesa), pak `EGL_PLATFORM=surfaceless npm run render`. Nástroj ukládá preview/vajgar-render.png, bez HTML ovládání. Nepotřebuje měnit nastavení prohlížeče.

## Změny 0.4

- Souvislý kuželový blank prutu; očka a vlasec vycházejí ze stejné křivky ohybu. Vybavení je při čekání ukotvené na břehu a při uchopení plynule přechází do ruky.
- Vlasec prochází čihátkem a očky. Let zátěže při náhozu má prostorový oblouk. Vzdálenost ryby se nyní počítá od hrany vody, aby se u břehu nedostávala do suchého terénu.
- Jemnější vegetace v trsech s pohybem ve větru, drobný reliéf blízkého břehu, vlhký pás na hraně vody a méně pravidelné vlnění s filtrovanými odrazy.
- Nový společný model ryby pro scénu a kartu úlovku: tělo s barevným přechodem, šupinový bump, ploutve, skřele, oči a tlama. Druhy zatím sdílejí geometrii a liší se barvou a velikostí; nejsou to tři věrné druhové modely.
- Oprava obnovy viditelnosti objektů po vykreslení odrazu.

Ověření 0.4: 15 automatických testů herní logiky, geografie a geometrie modelů. Skutečný WebGL render přes Mesa v režimu čekání, zdolávání, na výšku a pro kartu úlovku; kontrola konečnosti vrcholů, ukotvení stojanu a obnovy viditelnosti. Jde o snímky stejného renderovacího kódu, bez HTML ovládání. Výkon a ovládání na fyzickém iPhonu nadále nejsou ověřené. Zástavba, ruce a vybavení stále vyžadují výtvarnou práci; verze nesplňuje původní fotorealistický cíl.

Kontrolní snímky: `preview/vajgar-0.4.webp`, `preview/fight-0.4.webp`, `preview/portrait-0.4.webp`, `preview/fish-0.4.png`.

## Ověření 0.5

30 automatických testů včetně sestavení montáže přes skutečné DOM handlery, zablokování neplatných kombinací, náhozu, přímého záseku při plavané, zdolání, správné fotografie, uložení úlovku a zásob krmení. WebGL vykreslení feederu a plavané prošlo přes Mesa se stejným `src/scene.js`. Rozhraní lze kontrolovat bez WebGL na `tools/ui-matrix.html`; jde o skutečné komponenty v rozměrech 390 × 844 a 844 × 390 s výslovně označenými testovacími hodnotami. Test fyzického iPhonu a výkonu na něm to nenahrazuje.
