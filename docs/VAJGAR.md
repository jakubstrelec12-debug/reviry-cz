# REVÍRY CZ — Vajgar: závazný směr nové verze

## Aktualizace — verze 0.4
Dokončen další průchod blízkou scénou: spojitý ohyb prutu s odpovídajícími očky a vlas­cem, ukotvené vybavení, oblouk náhozu, model ryby a její skutečný 3D portrét, oprava pozice u břehu, vítr v trsech trávy, reliéf blízké půdy a úprava vody. Mapa a stanoviště zůstávají původní. Reliéf je výtvarná aproximace, nikoli zaměření. Snímky z renderu jsou ve `preview/`. 15 automatických testů prošlo. Finální fotorealismus, věrné modely jednotlivých druhů a test na fyzickém iPhonu zůstávají otevřené.

## Aktualizace — verze 0.3
Fotografické materiály břehu a oblohy, vegetační billboardy předpočítané z detailního modelu, opravený výhled, drobnější kameny, mechanické čihátko a úpravy prutu a navijáku. Skutečný WebGL render ze stejného modulu byl ověřen přes Mesa a webgl-node; snímek bez HTML ovládání je v preview/vajgar-0.3.webp. Render nemá chyby WebGL a materiály se načetly. To nenahrazuje měření výkonu na iPhonu. Zástavba a vybavení nadále mají pracovní modely a původní fotorealistický cíl není splněný.

## Aktualizace — hratelná verze 0.2
V kořeni repozitáře je nová skutečná 3D implementace v Three.js, distribuovaná pro první test přes GitHub Pages. Břeh a ostrov jsou z OSM relace 1744135; přidáno 358 mapových půdorysů budov. Modely střech, fasád, vybavení, ruky, ryby a vegetace jsou pracovní aproximace. Lov s jedním prutem na položenou má kompletní cyklus a deník. Geografické podmínky i herní logika prošly 13 automatickými testy; konstrukce scény samostatnou CPU kontrolou. GPU výstup nebyl ověřen, protože testovací prohlížeč nevytvoří WebGL kontext. Toto není splnění finálního grafického cíle. Nativní iOS distribuce dosud není zajištěna.

Další prioritou je ověřit obraz a výkon na skutečném iPhonu a podle záběrů ze hry dokončit podobu prvního stanoviště. Podrobnosti v README.

## Cíl
Realistický 3D rybářský simulátor, primárně pro iPhone. Prvním místem je skutečný rybník Vajgar v Jindřichově Hradci. Uživatel výslovně upřednostňuje vizuální věrnost a skutečnou lokalitu před webovým formátem. Původní index.html je samostatná starší verze; nepovažovat ji za vizuální základ nové hry.

## Výchozí stav před implementací 0.2
Tento dokument definuje rekonstrukci a podmínky přijetí. Není dokončenou 3D scénou, exportem pro iOS ani příslibem dosaženého fotorealismu. Konkrétní stanoviště a směr kamery zatím nejsou zaměřeny. Herní engine nové verze zatím není závazně zvolen.

## První dokončovaný celek
Jedno konkrétní místo na Velkém Vajgaru, věrně vytvořené podle mapových a fotografických podkladů. Kandidátem je pohled přes vodu k ostrovu a městskému nábřeží; před modelováním je nutné ověřit viditelnost jednotlivých dominant. Zámek není přípustné libovolně přesouvat za ostrov jen kvůli efektní kompozici.

Z tohoto místa musí jít provést celý rybolov: příprava sestavy, nához, čekání, indikace záběru, uchopení a zvednutí prutu, zásek, zdolávání, podebrání a záznam úlovku. Nejprve položená s mechanickým čihátkem; další techniky až po dotažení tohoto celku.

## Geografická věrnost
- Získat půdorys břehů a ostrova s doloženým zdrojem a podmínkami užití.
- Zapsat souřadnice stanoviště, výšku kamery a azimut pohledu.
- Vytvořit referenční přehled skutečných pohledů z tohoto stanoviště. Fotografie z jiného břehu nelze vydávat za tentýž výhled.
- Umístění ostrova, protějšího břehu a výrazných staveb ověřit v jednom společném souřadnicovém systému.
- U neznámých hloubek a dna vést zřetelnou hranici mezi ověřenými údaji a herní aproximací. Nevymýšlet batymetrii a nevydávat ji za měření.
- Veřejně dostupná fotografie není automaticky volně použitelný herní asset.

## Grafika
- Prostorová scéna; snímek pozadí nesmí nahrazovat kompletní 3D prostředí.
- Voda s jemnými vlnami, odrazy okolí a světla, odpovídající barvou a přechodem u břehu.
- Materiály břehu, kamení, vegetace a vybavení v odpovídajícím měřítku.
- Detailní model prutu, oček, navijáku, vlasce, stojanu a mechanického čihátka.
- Konzistentní světlo a stíny; žádné umělé rozostření používané k zakrytí chybějících dominant.
- Minimální rozhraní, aby výhledu dominoval revír.

## Animace a fyzika
Prut při náhozu a záseku musí fyzicky změnit polohu a ohyb. Vlasec musí navazovat na očka a mít čitelný průvěs či napětí. Čihátko reaguje na změnu tahu včetně povoleného záběru. Zdolávání propojuje tah ryby, brzdu, práci prutem a navíjení. Ryba u břehu má skutečný model a animaci; podebrání není jen textová zpráva.

## Ověření před označením za hratelnou verzi
1. Srovnávací záběr ze spuštěné hry a referenční fotografie ze stejného místa.
2. Záznam celého cyklu od náhozu po podebrání přímo z hry.
3. Test na skutečném cílovém iPhonu: snímkování, paměť, zahřívání a dotykové ovládání. Výkon v editoru nebo na desktopu není měření iPhonu.
4. Ověřit uložení postupu a přerušení aplikace během rybolovu.
5. K vizuálnímu hodnocení používat skutečné herní snímky. Koncepty či generované obrázky vždy označit a nevydávat za výsledek.
6. Rozšíření na další lovná místa až po odsouhlasení kvality prvního místa.

## Distribuce
Požadavek je spustitelná hra bez ručního sestavování uživatelem. Zvolit a ověřit distribuční cestu včas. Nativní iOS sestavení vyžaduje odpovídající Apple nástroje a podepisování; zdrojový projekt nebo ZIP není instalovatelná iPhone aplikace. Nevyžadovat po uživateli sdílení hesla k Apple účtu.

## Ověřené zdroje a jejich role
- Město Jindřichův Hradec, zveřejněné analýzy: https://www.jh.cz/filemanager/files/3694730.pdf — vztah Velkého a Malého Vajgaru a využití rybníka. Není přesným geometrickým podkladem ani licencí k převzetí obrázků.
- Strategický plán města: https://m.jh.cz/filemanager/files/186426.pdf — místní kontext a využití Vajgaru. Není batymetrickým měřením.
- Dokumentace Godot, export iOS: https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_ios.html — technické požadavky jedné možné implementační cesty, nikoli rozhodnutí o finálním enginu.

## Původní výrobní krok
Obstarat podklady pro jedno přesné stanoviště a ověřit engine/renderovací cestu na cílovém zařízení s reprezentativní vodou, vegetací a rybářským vybavením. Teprve podle skutečného výstupu potvrdit dosažitelnou kvalitu a rozpočet scény. Nepokračovat další generickou kresbou jezera.
