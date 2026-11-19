# REVÍRY CZ — Vajgar 0.7

Rybářská hra pro Safari na iPhonu. Výhled nově tvoří **skutečná fotografie Vajgaru** s animovanou hladinou, prutem, čihátkem, náhozem, splávkem a krmením. Zjednodušená 3D zástavba se v hlavní hře nepoužívá. Vykreslování běží přes Canvas 2D a nepotřebuje WebGL.

**Hrát:** https://jakubstrelec12-debug.github.io/reviry-cz/?v=0.7.0

Nejlépe na šířku. Všechny herní fotografie jsou přiložené lokálně. HD / ECO mění rozlišení a jemnost animace vody. Fotografie není 360° panorama: tažením jde pouze mírně posouvat výhled a směr náhozu. Nejde o volně průchozí 3D svět.

## Příprava lovu

**PŘIPRAVIT VÝPRAVU** → Technika → Montáž → Nástraha → Krmení. Později horní tlačítko **Montáž**.

- **Položená:** olovo, průběžné pružinové krmítko, vlasový přívěs s olovem, nebo **krmítko s vlasovým přívěsem**. Vždy mechanické čihátko. V přípravě je přímá zkratka **Položená s krmítkem**.
- **Feeder:** průběžné klecové krmítko nebo method feeder; záběr na barevné špičce.
- **Plavaná:** pevný nebo průběžný splávek; nastavitelná hloubka a detail signalizace.

Volíš prut, vlasec, háček, délku návazce a zátěž. Schéma ukazuje aktuální sestavu. Nástrahy jsou samostatné viditelné karty: kukuřice, žížala, bílí červi, pečivo, **boilies 15 mm, boilies 20 mm** a peleta. Výběr boilies automaticky doplní kompatibilní vlasový přívěs i háček; u krmítka zachová krmítko. Neplatnou pozdější kombinaci nelze potvrdit.

## Nástraha a úlovek

Druh ani velikost ryby se nelosují nezávisle na nástraze. Herní pravidla:

- 20mm boilies: větší kapři od 4 kg; ostatní dva druhy v tomto herním režimu vyloučené.
- 15mm boilies: výrazná převaha kapra, vzácně větší lín / cejn; kapr od 2,5 kg.
- Žížala: zvýhodněný lín, bílí červi a pečivo: zvýhodněný cejn.
- Kukuřice a pelety: kapr s možností dalších druhů.

Na kartě nástrahy jsou herní šance bez přikrmování. Krmení, technika a háček je dále upravují. Jde o zjednodušený herní model, ne skutečné pravděpodobnosti úlovků na Vajgaru.

## Ovládání a krmení

Podrž **NAHODIT** a pusť. U položené a feederu při záběru **VZÍT PRUT**, potom **ZASEKNOUT**. U plavané **ZASEKNOUT** přímo. Drž **NAVÍJET**, při výpadu pusť nebo povol brzdu. Unavenou rybu do 4 m od hrany vody podeber.

Krmítko při dopadu spotřebuje 20 g směsi — také u položené, nejen u feederu. Po náhozu lze přikrmovat dávkou 50 / 150 / 300 g. Pro výpravu je 1 kg každého druhu krmení. Krmné místo postupně slábne a ztrácí účinek při náhozu jinam. Při prázdných zásobách lze dál chytat bez dalšího krmení.

Zvolená sestava se ukládá pro příště. Při změně během čekání se nástraha stáhne; během zdolávání změnu nelze provést. Deník ukládá hmotnost, délku a použitou sestavu. Příprava, deník a přechod do jiné aplikace lov pozastavují.

## Fotografie a omezení

Podklad Vajgaru: Wwery, [původní fotografie](https://commons.wikimedia.org/wiki/File:Pohled_na_Jind%C5%99ich%C5%AFv_Hradec_p%C5%99es_rybn%C3%ADk_Vajgar.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Zmenšení, převod do WebP, ořez podle obrazovky a animace vodní části. Upravený obraz i kontrolní snímek 0.6 zachovávají tuto licenci. Autor, zdroj, licence a informace o úpravách jsou i přímo ve hře. Viz [assets/CREDITS.md](assets/CREDITS.md).

Karta úlovku používá skutečné **ilustrační fotografie druhů** (kapr, lín, cejn). Nejde o fotografie konkrétních virtuálních úlovků. Prut, naviják a ryba u hladiny jsou stále kreslené herní prvky. Podvodní fyzika montáže, další druhy ryb a přívlač nejsou implementované. Není to nativní iOS aplikace. Fyzický iPhone nebyl vývojářem změřen.

## Vývoj a ověření

`npm ci`, `npm test`, `npm run dev` → http://localhost:3000. `npm run render` ukládá skutečný snímek fotografické scény bez HTML ovládání. Parametry `RENDER_METHOD`, `RENDER_PHASE`, `RENDER_WIDTH`, `RENDER_HEIGHT` umožňují ověřovat techniky, stavy a orientace.

41 automatických testů: herní cyklus, DOM ovládání přípravy a karty úlovku, kompatibilita montáží, vliv nástrahy na skutečně vybrané druhy i velikosti, krmítko na položenou, ořez fotografie a vykreslení všech stavů tří technik přes stejný Canvas 2D modul bez GPU. `tools/ui-matrix.html` zobrazuje skutečné komponenty přípravy v rozměrech telefonu s označenými testovacími údaji. Test cílového fyzického telefonu nenahrazují.

Původní procedurální 3D modul a jeho testovací nástroje zůstávají v repozitáři pro historii; nejsou načítané vstupem hry 0.6. Jeho render je `npm run render:legacy3d`. Nejstarší samostatná 2D verze je v `legacy/`.

Oprava 0.6.1: při nižším snímkování se herní čas posouvá v malých simulačních krocích, namísto zahazování každé části snímku přes 50 ms. Jednorázový skok je omezený na 250 ms; odchod do pozadí se nadále pozastavuje.

## Změny 0.7

Montáže se vybírají na kartách se schématem, včetně odlišeného pružinového, klecového a method krmítka. Podnabídky Prut a Vlasec obsahují ilustrace vybavení. Katalog obsahuje skutečné modely Mivardi (Spotter, Vector MK2 FC, Symphony, Easy Match II, Phenomena TMX), vlasce Carp & Feeder v ověřených průměrech 0,165–0,305 mm, Nikl Kill Krill 15/20 mm, Mivardi Rapid SweetCorn 8 mm a Sonubaits Supercrush Green. Přírodní a další obecné nástrahy zůstávají neznačkové. Primární zdroje jsou v `docs/PRODUCTS.md` a odkazy v přípravě. Žádné skladové stavy ani ceny se ve hře neslibují. Obrázky vybavení jsou originální herní ilustrace typu, nikoli převzaté produktové fotografie. Herní koeficienty účinnosti a zdolávání nejsou výrobcem deklarované parametry.

Pruty a čihátka se kreslí do oblasti nad aktuálním ovládáním. Zvětšený detail čihátka nebo špičky je výřez skutečného vykresleného prutu; nereprodukuje nezávislou falešnou animaci. Záběr označí i příslušný prut v horním přepínači.

Tlačítko **+ Druhý prut** přidá druhý samostatný prut a přepne na něj. Každý má vlastní sestavu, nástrahu, vzdálenost, čas čekání a záběr. Náhozy i čekání běží současně, krmení a deník jsou společné. Karty **PRUT 1 / PRUT 2** přepínají ovládání. Během náhozu, braní prutu a zdolávání přepnout nelze. Druhý záběr může při dlouhém ignorování zaniknout; otevřená příprava, deník a karta úlovku pozastavují oba. Druhý prut je dostupný pouze pro položenou a feeder; pro plavanou jej nejprve slož. Uložení zachovává obě sestavy, nikoli živý nához při zavření stránky.

41 automatických testů včetně souběžných náhozů a záběrů, společných zásob a deníku, omezení dvou prutů a skutečného Canvas vykreslení viditelných čihátek nad ovládáním v obou orientacích telefonu. Fyzický iPhone stále nebyl vývojářem změřen.

### Úprava pohledu 0.7.1
Prut má nižší polohu a míří k hladině, naviják je menší a tmavší. Celý trojnohý stojan nahrazuje štíhlá podpěra pokračující pod okraj obrazu. Na telefonu jsou informace v horní části stručnější a při čekání se nezobrazuje neaktivní tlačítko. Detail čihátka / feederové špičky se otevírá klepnutím na označení signalizace s plusem. Test zkráceného telefonního viewportu 390 × 650 zahrnuje prostor odebraný lištami prohlížeče.
