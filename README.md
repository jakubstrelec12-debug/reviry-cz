# REVÍRY CZ — Vajgar 0.6.1

Rybářská hra pro Safari na iPhonu. Výhled nově tvoří **skutečná fotografie Vajgaru** s animovanou hladinou, prutem, čihátkem, náhozem, splávkem a krmením. Zjednodušená 3D zástavba se v hlavní hře nepoužívá. Vykreslování běží přes Canvas 2D a nepotřebuje WebGL.

**Hrát:** https://jakubstrelec12-debug.github.io/reviry-cz/?v=0.6.1

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

37 automatických testů: herní cyklus, DOM ovládání přípravy a karty úlovku, kompatibilita montáží, vliv nástrahy na skutečně vybrané druhy i velikosti, krmítko na položenou, ořez fotografie a vykreslení všech stavů tří technik přes stejný Canvas 2D modul bez GPU. `tools/ui-matrix.html` zobrazuje skutečné komponenty přípravy v rozměrech telefonu s označenými testovacími údaji. Test cílového fyzického telefonu nenahrazují.

Původní procedurální 3D modul a jeho testovací nástroje zůstávají v repozitáři pro historii; nejsou načítané vstupem hry 0.6. Jeho render je `npm run render:legacy3d`. Nejstarší samostatná 2D verze je v `legacy/`.

Oprava 0.6.1: při nižším snímkování se herní čas posouvá v malých simulačních krocích, namísto zahazování každé části snímku přes 50 ms. Jednorázový skok je omezený na 250 ms; odchod do pozadí se nadále pozastavuje.
