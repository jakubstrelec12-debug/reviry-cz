# REVÍRY CZ — Jižní Čechy 0.12

Rybářská hra pro Safari na iPhonu. Výhled nově tvoří **skutečná fotografie Vajgaru** s animovanou hladinou, prutem, čihátkem, náhozem, splávkem a krmením. Zjednodušená 3D zástavba se v hlavní hře nepoužívá. Vykreslování běží přes Canvas 2D a nepotřebuje WebGL.

**Hrát:** https://jakubstrelec12-debug.github.io/reviry-cz/?v=0.17.0

Nejlépe na šířku. Všechny herní fotografie jsou přiložené lokálně. HD / ECO mění rozlišení a jemnost animace vody. Fotografie není 360° panorama: tažením jde pouze mírně posouvat výhled a směr náhozu. Nejde o volně průchozí 3D svět.

## Oprava spuštění — 0.17.0

Pauza lovu už nezmrazí celé okolí na úvodní obrazovce a při sestavování montáže. Voda a trávy se animují, aniž běží čas záběru nebo zdolávání. Ruch prostředí má vlastní zvukovou větev; při zapnutí zazní krátký testovací tón i před spuštěním lovu. Hlasitost prostředí je zřetelnější. Pokud prohlížeč nespustí zvukový kontext, hra na to výslovně upozorní. Návrat na stránku znovu vyhodnotí pozastavení. Skutečný odchod do pozadí nadále zastaví lov i zvuk.

## Ruce, náčiní a okolí — 0.15.0

Po nahození a při zvednutí se prut přesouvá plynule mezi stojanem a rukou; prázdná trojnožka zůstává na původním místě. Nához má zpětný nápřah, švih a uklidnění. Při navíjení se samostatná levá ruka přiblíží ke kličce a sleduje její otáčení; při uvolnění navíjení zase ustoupí. Otáčení, drobný pohyb ruky, dobírání povoleného vlasce a zatížení při výpadu sdílejí stav ovládání.

Rychlost odvíjení cívky vychází z reálného přírůstku vzdálenosti ryby v herním modelu. Odvíjení přes brzdu má vlastní zvuk; navíjení má jemné mechanické cvakání. Výpad a změna směru vytvoří pohyb vlasce a vlnky u ryby. Nezávislé náhledy obou indikátorů nepřičítají čas k pohybům rukou ani cívky.

**Pro plný dojem zapni Zvuk.** Ruch hladiny, poryvy větru, vzácné vzdálené denní ptačí hlasy a jemné noční zvuky jsou syntetizované v prohlížeči. Nához, dopad montáže a práce s náčiním mají samostatné zvuky. Žádné nahrávky se nestahují a žádný mikrofon se nepoužívá. Ruch vody a větru zní i na úvodní obrazovce a při přípravě, zatímco práce s náčiním zůstává pozastavená. V pozadí se zvuk zastaví; běžný prohlížeč může spuštění vyžadovat klepnutím na tlačítko.

Řídké ilustrační trávy u levého dolního okraje se pohybují ve stejném modelovaném poryvu jako šum větru a drobné odlesky hladiny. Vegetace je společné herní popředí, ne nový geografický údaj o vybraném revíru. Fotografie a geometrie vzdáleného břehu se neohýbají. Podrobnosti o nových podkladech a zadání: [assets/ANIMATION.md](assets/ANIMATION.md).

## Průběh lovu — 0.14.1

Výchozí režim omezuje nápovědy: při záběru nevyskakuje výzva k záseku, druhý prut neposílá oznámení a ryba nepřiznává přesné procento únavy. V nabídce **☰ → Průvodce** lze zapnout dosavadní pomoc. Ovládání a optické detaily zůstávají dostupné, oba pruty viditelné. Náhled ukazuje skutečný pohyb čihátka / špičky / splávku; nepřebarvuje se podle skryté přítomnosti ryby.

Náhodná krátká ťuknutí se objevují i bez skutečného braní a sama odeznívají. Položený prut lze kdykoli vzít do ruky; zásek do pouhého ťuknutí nebo bez ryby vyjde naprázdno. Po takovém zvednutí lze prut také stáhnout. Plavaná umožňuje zásek kdykoli. S průvodcem zůstávají starší pomocné ovládací prvky dostupné.

Čekání používá širší náhodné rozdělení; při základní aktivitě začíná kolem 18 sekund a může trvat několik minut. Datum, čas, nástraha a krmení čekání dále ovlivňují. Krátké ťuknutí není příslibem úlovku. Elektronický hlásič pípá podle skutečně vykresleného pohybu indikátoru, nikoli podle přepnutí herního stavu. Mechanické čihátko ani swinger samy nepípají. Pro zvuk zapni **Zvuk**.

Ryba střídá různě dlouhé a silné výpady s uklidněním a mění směr tahu. Únava vychází z odporu sestavy a vyvíjeného úsilí. Pohyb vlasce a ohyb prutu dále sledují napětí; pohyb ryby mění směr vlasce. U břehu se místo kreslené ryby nad vodou ukazuje tlumený podvodní obrys a krátký záblesk boku. Vše zůstává zjednodušenou fotografickou herní scénou.

## Datum, čas a světlo — 0.13.0

Před výpravou, v horní části přípravy montáže nebo v deníku zvol **Výprava: datum · čas · změnit**. Zvol datum a čas nebo použij rychlou volbu ráno / poledne / večer / noc. Nastavení je společné pro oba pruty, uloží se pro příště a do záznamu úlovku. Starší sestavy začínají základním letním ránem 15. 6. 2026 v 07:00. Pro změnu stáhni oba pruty; zakrmená místa se při změně opustí. Zavření bez potvrzení změny zahodí.

Roční období a denní doba ovlivňují druhově odlišnou aktivitu, skutečný výběr ryby a průměrné čekání na záběr. Návnada a nástraha dál rozhodují o cílovém druhu. Přehled ukazuje relativní aktivitu vůči základnímu letnímu ránu, nikoli procentní pravděpodobnost úlovku. Jde o zjednodušený herní model bez předpovědi počasí. Čas je pevně vybraný pro celou výpravu; vzhled vegetace fotografie se s datem nemění.

Celá scéna včetně mola a náčiní sdílí teplý ranní / večerní odstín a noční ztmavení. Vlasec ve zdolávání reaguje na napětí a při dobírání na povolení; swinger se otáčí kolem pevného raménka. Prázdné signalizační náhledy před náhozem zabírají méně místa.

## Širší pohled — 0.12.2

Jarošov má na výšku automaticky širší záběr skutečné fotografie, bez deformace břehů a staveb. Volné místo nahoře vyplňuje obloha a dole rozšířená hladina z vodní části snímku; nejde o další skutečně vyfotografovanou krajinu. V nabídce **☰ → Širší záběr** lze režim přepnout pro všechny vody. Na šířku zůstává standardní pohled. Nastavení se ukládá.

## Výběr vody — 0.12

Horní **Revír** nebo **Vybrat revír** na úvodní obrazovce: Vajgar, Malá vodní nádrž Jarošov nad Nežárkou, Vlkovská pískovna. Jarošov má šest hratelných druhů; Vlkovská pět. Další doložené ryby jsou uvedeny v podkladech, dravci se zatím nelosují na dostupné kaprové nástrahy. Každá karta obsahuje zdroje, roky a omezení průkaznosti. Podrobnosti: [docs/VENUES.md](docs/VENUES.md).

**Jarošov nyní používá skutečnou fotografii této nádrže z reportáže Nachytáno.cz.** Originál se načítá přímo od vydavatele a není součástí repozitáře. Když zdroj neodpoví do 12 sekund, zobrazí se výslovně označená ilustrační náhrada z Matějovce. Vlkovská pískovna používá skutečný geolokovaný snímek této pískovny. Ve hře je zdůrazněno, že výkazy osádky se vztahují k celé soustavě Lužnice 7 B.

## Dva pruty a širší výhled — 0.12.2

Oba nahozené pruty mají současně vlastní očíslovaný optický náhled čihátka / špičky a stav záběru. Klepnutí na náhled záběru vybere odpovídající prut a vezme ho do ruky; následuje samostatný zásek. Během zdolávání se druhý prut sleduje dál, převzetí je zamčené do odložení prutu v ruce. Náhledy používají tutéž scénu a čas, které vidí hráč.

Fotografie se rámuje podle prostoru nad molem, bez dodatečného přiblížení. Odhaluje širší část původního snímku; žádná krajina se nedokresluje a poměr stran fotografie se nedeformuje. Na výšku zůstává omezená šířkou obrazovky, nejširší pohled je na šířku.

## Náčiní a kompozice — 0.11

Odložený prut, naviják a nízká trojnožka tvoří jeden souvislý fotorealistický podklad. Nohy stojí na prknech a mají kontaktní stín; poloha sestavy se při změně ovládání neposouvá. Záběr deformuje pouze horní část prutu. Varianta v ruce používá stejný prut, naviják a rukojeť, bez stojanu. Oba podklady jsou vytvořené pomocí AI, ilustrační a nepředstavují fotografii vybraného výrobku. Stavový text je na výšku nad náčiním.

## Vlastní sestava pro každý prut

Druhý prut lze přidat rovnou v přípravě přes **+ DRUHÝ PRUT** (položená nebo feeder). Přidání i rozpracované změny se provedou až potvrzením; zavření dialogu je zahodí. Při dvou prutech otevři **Montáž** a nahoře přepínej **PRUT 1 / PRUT 2**. Každý může mít vlastní techniku položená / feeder, montáž, nástrahu, krmení, prut i vlasec. Přepínač ukazuje montáž a nástrahu obou prutů; rozpracované změny se při přepnutí neztratí. **POUŽÍT SESTAVY OBOU PRUTŮ** uloží změny najednou. Změněný nahozený prut se stáhne pro nové nastražení, nezměněný zůstává ve vodě. Zavření bez použití změny zahodí.

## Příprava lovu

**PŘIPRAVIT VÝPRAVU** → Technika → Montáž → Nástraha → Krmení. Později horní tlačítko **Montáž**.

- **Položená:** olovo, průběžné pružinové krmítko, vlasový přívěs s olovem, nebo **krmítko s vlasovým přívěsem**. Volitelné mechanické čihátko, swinger nebo elektronický hlásič se swingerem. V přípravě je přímá zkratka **Položená s krmítkem**.
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

### Fotografické náčiní 0.8
Plavaná zobrazuje výřez skutečné fotografie ruky, rukojeti a navijáku. Při záseku a zdolávání se celá sestava zvedá; horní část prutu se prohýbá podle tahu. Stejný fotografický základ se používá při práci s prutem u ostatních technik a naviják také u odložených prutů. Splávek J-Range je založený na skutečné fotografii, při záběru klesá pod skutečnou hladinu. Tlačítko detailu ukazuje výřez této stejné scény. Podklady mají průhledné pozadí připravené pomocí AI, celkem asi 116 kB WebP; jde o ilustrační fotografie, nikoli přesné zobrazení vybraného modelu. Podrobný původ a úpravy: `assets/CREDITS.md`, rovněž přímo v deníku hry.

### Signalizace a načasování záseku 0.9

Detail je volitelná kulatá optická lupa. Vykresluje tutéž scénu přímo ve vyšším rozlišení; čas ani herní stav neposouvá. Její osa zůstává u klidové polohy špičky / čihátka, aby sledováním pohybu nezrušila samotný signál. Zavřená lupa se nepřekresluje. U plavané se liší jemné ťukání, souvislé potápění, přizvednutí a naklonění; při pouštění nástrahy záběr slábne.

Zaseknout lze i při čekání tlačítkem Zaseknout: bez záběru to skončí do prázdna. Při dotecích je zásek předčasný; při souvislém záběru je možné rybu zachytit, při pouštění nástrahy už přijde pozdě. Výsledek uvádí odchylku v sekundách. Délku záběru ovlivňuje technika, montáž, nástraha a druh ryby. Jde o čitelný herní model, nikoli změřené biologické časy nebo návod pro skutečný rybolov.

U položené a feederu je stále nutné vzít prut. To **nezastaví ani neobnoví** čas ryby na nástraze. Při padavém záběru je po zvednutí prutu potřeba podržet Dobrat vlasec a teprve potom zaseknout. Navíjení skutečně ubírá povolení a současně běží čas záběru. Hraniční, ale platný zásek má slabší kontakt: při zdolávání hůře snáší povolený vlasec. Karta úlovku a deník uchovávají kvalitu záseku.

Validace: 49 testů, včetně brzkého / čistého / pozdního záseku pro každou techniku, záseku bez ryby, dobírání vlasce, pauzy, společné časové osy po zvednutí prutu, celého UI cyklu a zachování herního stavu při optickém vykreslení.

### Rybářské stanoviště a katalog 0.10

Fotografie je rámovaná s vyšším horizontem a větším prostorem hladiny. V popředí je samostatná fotorealistická vrstva dřevěného stanoviště vytvořená AI; nejde o fotografii existujícího mola na Vajgaru. Animace vody, splávek a dopady zůstávají před jeho hranou. Fotografie ruky a navijáku je menší, barevně přizpůsobená a vychází ze spodního pravého okraje. Její poloha se neodvozuje od výšky panelu ovládání. Na šířku je ovládání vlevo, aby nezakrývalo vybavení.

Katalog obsahuje **25 nástrah a 11 návnad** (plus volbu bez krmení). Nástrahy jsou rozdělené na přírodní, potápivé boilies, pop-up / wafters a pelety. Nabídka podle techniky zahrnuje kukly, pinkies, patentky, pšenici, hrách, těsto, bramboru, lančmít, sýr, tygří ořech, mini boilies, dvě velikosti Nikl pop-up a tři Sonubaits wafters. Volba upraví kompatibilní montáž a háček. Plavaná nezobrazuje nástrahy vyžadující vlasovou montáž na dno.

Krmení má vlastní zásobu pro každý typ, společnou oběma prutům. Konopí a celá pšenice se nabízejí pro volné zakrmení; do krmítka se volí směsi nebo drobné složky. Doba působení směsí se liší a některé zvýhodňují větší úlovky. Šance, tempo a velikosti jsou herní parametry, nikoli změřené vlastnosti výrobků nebo populace Vajgaru. Značkové položky mají odkaz na zdroj; ilustrační kresby a fotografie nemusí zobrazovat konkrétní zvolený výrobek.

Validace: 54 testů — celý cyklus lovu a záseku, dostupnost všech nástrah s platnou montáží, jemné háčky, filtrování, všechny zásoby / spotřeba krmení, zákaz celého partiklu v krmítku, doba rozpadu a vliv na úlovek, ukotvení pohledu a dopady na vodu před stanovištěm.

Položená: v přípravě zvol **02 Montáž → Signalizace** (nebo Vybrat signalizaci záběru). Každý prut má vlastní čihátko, swinger či elektronický hlásič se swingerem. Hlásič bliká a při zapnutém zvuku pípá i u nevybraného prutu. Starší uložené sestavy dostanou mechanické čihátko.

### Vylepšení zdolávání 0.17.0
Prut pružně reaguje na napětí a krátké výpady; po uvolnění tahu se postupně vrací. Jde o prezentační model, nemění pravděpodobnost úlovku. Brzdu lze upravit posuvníkem i tlačítky po 5 procentních bodech (8–95 %). Připravený podběrák se zvýrazní. Hlasitost v deníku se ukládá pro příští spuštění; zvuk je nadále nutné zapnout klepnutím.

### Zvuky náčiní 0.17.0
Výraznější zvuk převodů při navíjení, cvakání brzdy pouze při odvíjení vlasce a vícevrstvý dopad do vody. Jde o syntetizované zvuky, ne terénní nahrávky. Okolní šum je tišší. V menu lze samostatně přehrát ukázku navíjení, brzdy a šplouchnutí i během pauzy. Běžné herní efekty jsou během pauzy stále potlačené.

### Skutečné nahrávky 0.17.0
Navíjení, odvíjení přes brzdu a dopad zátěže jsou nyní lokální MP3 nahrávky (CC0), viz assets/audio/CREDITS.md. Navíjení a brzda hrají souvisle podle ovládání a skutečného odvíjení, na každém prutu samostatně. Po uvolnění ovládání nebo pauze smyčka krátce dozněje. Pokud se nahrávky nenačtou, hra to oznámí; nenahrazuje je syntetickým cvakáním. Vypnutí a nové zapnutí zvuku načtení opakuje. Okolí a drobné ostatní efekty zatím zůstávají syntetické.
