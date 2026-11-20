# Materiály prostředí 0.3

Použité podklady z Poly Haven jsou veřejně dostupné pod CC0: https://polyhaven.com/license.

- **Tree Small 02**, Rico Cilliers: https://polyhaven.com/a/tree_small_02. Pro vzdálenou a okrajovou vegetaci je z plného modelu předpočítaný průhledný billboard. Nejde o plné 3D modely všech stromů. Originální model má přes dva miliony trojúhelníků; do telefonu se nenačítá.
- **Forest Floor**, eye-candy.xyz: https://polyhaven.com/a/forest_floor. Barevná, normálová a ARM textura, zmenšené pro mobilní přenos.
- **Kloppenheim 06 (Pure Sky)**: https://polyhaven.com/a/kloppenheim_06_puresky. HDR panorama převedené do tónovaného JPG pro úsporné načítání. Panorama obsahuje pouze oblohu, nezobrazuje geografii Vajgaru. Voda, břeh, budovy a vybavení zůstávají prostorovou scénou.

Půdorysy: © OpenStreetMap contributors, viz ../data/README.md.

Snímek v preview/ je přímo z WebGLRendereru stejného zdrojového modulu src/scene.js. Byl vykreslen samostatně přes software Mesa a webgl-node, bez prohlížeče a bez vrstvy HTML ovládání. Nebyl obrazově retušován ani vytvořen generátorem obrázků. Na fyzickém iPhonu nebyl výkon měřen.

## Skutečné fotografie ryb — 0.5

Fotografie na kartě úlovku a v deníku jsou ilustrační fotografie daného druhu, nikoli obraz konkrétního herního úlovku. Velikost a hmotnost vznikají v herním modelu. Do scény při zdolávání se nadále kreslí pracovní 3D model.

| Soubor | Autor a původní zdroj | Licence | Úpravy |
| --- | --- | --- | --- |
| fish/carp.webp | Dezidor, [Cyprinus carpio.jpg](https://commons.wikimedia.org/wiki/File:Cyprinus_carpio.jpg) | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) | Ořez na horního kapra, zmenšení na 1200 px, převod do WebP. Upravený obrázek je šířen pod stejnou licencí. |
| fish/tench.webp | Dezidor, [Tinca tinca.jpeg](https://commons.wikimedia.org/wiki/File:Tinca_tinca.jpeg) | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | Zmenšení na 1200 px, převod do WebP. |
| fish/bream.webp | Микова Наталия, [Carp bream.jpg](https://commons.wikimedia.org/wiki/File:Carp_bream.jpg) | Public domain, uvolněno autorkou na Commons | Zmenšení na 1200 px, převod do WebP. |

Autor, odkaz na původní soubor, licence a informace o ořezu/zmenšení jsou dostupné i přímo na kartě úlovku. Fotografové projekt nezaštiťují.

## Fotografický revír — 0.6

`vajgar-photograph.webp`: **Wwery**, [Pohled na Jindřichův Hradec přes rybník Vajgar.jpg](https://commons.wikimedia.org/wiki/File:Pohled_na_Jind%C5%99ich%C5%AFv_Hradec_p%C5%99es_rybn%C3%ADk_Vajgar.jpg), 31. 5. 2024, vlastní fotografie autora, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

Úpravy: zmenšení z 4032 px na 2400 px, převod JPG → WebP. Za běhu ořez podle obrazovky, omezený posun, jemná animace pouze vodní části a doplnění herních prvků. Upravená fotografie i kompozitní kontrolní snímek `preview/vajgar-0.6.webp` jsou šířené pod CC BY-SA 4.0. Autor ani Wikimedia projekt nezaštiťují. Připsání autora, zdroj, licence a označení úprav jsou v zápatí a nabídce hry.

Nejde o procedurálně vygenerovanou rekonstrukci ani o 360° panorama. Snímek 0.6 vzniká skutečným vykreslením `src/photo-scene.js` přes Canvas 2D. Není vytvořený generátorem obrázků. OSM a materiály původní 3D scény se v hlavní scéně 0.6 nepoužívají.

## Fotografické náčiní — 0.8

- `equipment/rod-hand.webp`: JaredMcKenzie, [A spinning reel on a rod.jpg](https://commons.wikimedia.org/wiki/File:A_spinning_reel_on_a_rod.jpg), [CC0](https://creativecommons.org/publicdomain/zero/1.0/). Skutečná fotografie navijáku Savage Gear 3000H, rukojeti a ruky. Odstranění pozadí nástrojem image_gen, zmenšení na 900 × 1200 a WebP. Ve hře ořez, natočení, skládání dílů a animovaná horní část prutu s texturou z fotografie. Jde o fotografický kompozit, nikoli přesný 3D model. AI při oddělení pozadí může upravit drobné detaily; netvrdíme shodu pixelů s originálem.
- `equipment/waggler.webp`: Geotek, [Pellet waggler fishing float.jpg](https://commons.wikimedia.org/wiki/File:Pellet_waggler_fishing_float.jpg), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Skutečná fotografie splávku J-Range. Odstranění bílého pozadí nástrojem image_gen, zvětšení a převod do WebP, ve hře částečné ponoření, průhlednost pod hladinou a animace záběru. Tento upravený obrázek se šíří pod **CC BY-SA 3.0**.

Jména modelů v přípravě lovu jsou oddělená od těchto ilustračních snímků: fotografie automaticky nezobrazuje vybraný výrobek Mivardi. Zdroj, autor, licence a úpravy jsou uvedeny také v herním deníku v části O prostředí a podkladech. Výrobci ani fotografové hru nezaštiťují. Od verze 0.9 optický detail znovu vykresluje tutéž scénu se stejnou polohou náčiní a stejným časem ve vyšším rozlišení. Nejde o nezávislou animaci ani o další fotografii.

Prompty pro extrakci: zachovat skutečný fotografovaný prut, naviják a ruku, odstranit pouze béžovou stěnu; u splávku zachovat přesný tvar, barevné tělo a červenou špičku, odstranit bílé pozadí. Použit vestavěný image_gen s průhledným pozadím.

## Popředí stanoviště — 0.10

`equipment/fishing-deck.webp`: fotorealistický průhledný kompozit vytvořený vestavěným image_gen. Původní fotografie Wwery výše sloužila jako reference osvětlení a výšky kamery. Zadání: široké dřevěné stanoviště přes spodní čtvrtinu obrazu, šedohnědé zvětralé prkno, chladné rozptýlené světlo, zbytek průhledný; bez lidí, náčiní, textu a dalších částí krajiny. Výstup zmenšen na 1800 × 600, převeden do WebP se zachováním alfa. Tento kompozit sdílíme pod CC BY-SA 4.0, stejně jako úpravy fotografického prostředí.

**Nejde o fotografii skutečného mola na Vajgaru.** Původní fotografie je zachována jako samostatný soubor; za běhu se mění její ořez a přidává se syntetické popředí. Označení AI popředí je v zápatí i v herním deníku.


## Jednotná sestava náčiní — 0.11

`equipment/resting-feeder.webp` a `equipment/held-feeder.webp`: nové syntetické fotorealistické průhledné podklady vytvořené vestavěným image_gen, 1024 × 1536, převod do WebP se zachováním alfa. Sdílíme pod CC BY-SA 4.0. Nenahrazují konkrétní výrobkové fotografie a nevyjadřují přesný model z katalogu. Odložený prut, naviják a trojnožka jsou jeden celek; v ruce má celek shodný vzhled bez podpěry. Za běhu se deformuje horní část prutu, ostatní součásti zůstávají společné.

Finální zadání: fotorealistický štíhlý grafitový feederový prut s jemnou oranžovou špičkou, korková rukojeť, černo-stříbrný naviják mechanicky spojený s prutem, kompaktní nízká trojnožka, pohled sedícího rybáře shora šikmo k vodě. Kompletní předmět na průhledném pozadí, měkké zatažené světlo, chladné tlumené barvy, bez značek, krajiny a podlahy. Dodatečné zadání: odstranit mlžný lem, zachovat přesnou geometrii. Varianta v ruce: zachovat prut a naviják, odstranit trojnožku a přidat anatomicky správnou pravou ruku vstupující z pravého dolního okraje. Výstupy nejsou skutečné fotografie; označeno v zápatí a deníku. Původní CC0 výřez 0.8 zůstává jen pro záložní vykreslení při chybě nového podkladu.

## Nové vody a úlovky — 0.12

Všechny fotografie jsou skutečné, bez generativního překreslení. Zmenšení na max. 2400 px (prostředí) / 1200 px (ryby), WebP. Za běhu se mění ořez a animuje hladina, doplňuje se společné ilustrační AI molo a náčiní. Licence a autor jsou v zápatí, kartě revíru a deníku; u ryb na kartě úlovku.

| Soubor | Autor / zdroj | Použitá licence | Poznámka |
| --- | --- | --- | --- |
| venues/vlkov.webp | Czeva, [Veselské pískovny, Vlkovská pískovna, angler 01.jpg](https://commons.wikimedia.org/wiki/File:Veselsk%C3%A9_p%C3%ADskovny,_Vlkovsk%C3%A1_p%C3%ADskovna,_angler_01.jpg), 27. 10. 2019 | CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/ | Původní fotografie pískovny. Ve hře výřez horních 52 % snímku, původní rybář mimo herní výřez. |
| venues/jarosov-illustration.webp | Pavel Hrdlička, Wikipedia, [Jarošov nad Nežárkou, Matějovec, small pond.jpg](https://commons.wikimedia.org/wiki/File:Jaro%C5%A1ov_nad_Ne%C5%BE%C3%A1rkou,_Mat%C4%9Bjovec,_small_pond.jpg), 30. 7. 2015 | CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/ | **Jiný rybník v Matějovci. Není to cílová Malá vodní nádrž v Jarošově.** Ilustrační náhrada s viditelným označením. |
| fish/amur.webp | Dezidor, [Ctenopharyngodon idella.jpg](https://commons.wikimedia.org/wiki/File:Ctenopharyngodon_idella.jpg) | CC BY 3.0, https://creativecommons.org/licenses/by/3.0/ | Ilustrační fotografie druhu. |
| fish/roach.webp | Piet Spaans, [RutilusRutilus.JPG](https://commons.wikimedia.org/wiki/File:RutilusRutilus.JPG) | CC BY-SA 2.5, https://creativecommons.org/licenses/by-sa/2.5/ | Ilustrační fotografie druhu. |
| fish/crucian.webp | Jiří Zelenka / Pohled 111, [Carassius carassius CZ 01.jpg](https://commons.wikimedia.org/wiki/File:Carassius_carassius_CZ_01.jpg) | CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/ | Ukázka karase obecného. Zdroje osádky říkají pouze „karas“; ve hře neurčujeme místní druh. |

Upravené podklady pod BY-SA i kompozity sdílíme pod odpovídající uvedenou licencí. Autoři fotografií ani správci vod projekt nezaštiťují. Zdroje rybích druhů a jejich omezení jsou v `docs/VENUES.md` a v kartách výběru vody.


## Jarošov a široký záběr — 0.12.1

Externí originál `https://nachytano.cz/files/images/jarosov_IX.JPG`, zdrojová reportáž: https://www.nachytano.cz/clanky/mala-vodni-nadrz-jarosov-nad-nezarkou-a2191/ . Vydavatel Nachytáno.cz, fotograf u konkrétního snímku neuveden. **Autorská práva vyhrazena; nejde o CC podklad.** Soubor není přiložený v repozitáři a projekt mu neuděluje novou licenci. Prohlížeč jej načítá od původního zdroje. Za běhu ořez a kompozice s herní hladinou a původním AI popředím. Matějovec je pouze výslovně označená záloha při nedostupnosti externího zdroje, nikoli výchozí prostředí Jarošova.

Širší pohled na výšku zobrazuje více pixelů původní scenérie při jednotném měřítku. Horní volné místo doplňuje barevný přechod oblohy; spodní část tvoří rozšíření vodní textury ze stejného snímku. Břeh, stromy, budovy a molo v dálce zůstávají z původního snímku. Toto rozšíření hladiny není skutečnou další fotografovanou krajinou. Režim lze vypnout v nabídce. Dřívější odkazy na licencované soubory v tomto přehledu zůstávají pro původní podklady a zálohu.

## Pohyblivé náčiní a popředí 0.15

Nové ilustrační AI vrstvy `equipment/held-animated.webp`, `winding-hand.webp`, `empty-tripod.webp` a `shore-reeds.webp` byly vytvořeny 19. 11. 2026. Ruce a prázdný stojan vycházejí ze stávajících syntetických podkladů náčiní, které zachovávají souřadnice. Nejde o fotografie konkrétního modelu výrobce ani o dokumentaci vegetace na daném revíru. Transparentní části byly odděleny a převedeny do WebP. Zadání a rozdělení: [ANIMATION.md](ANIMATION.md). Zvukové pozadí, ptačí hlasy, brzda a naviják jsou procedurálně syntetizované, bez cizích nahrávek.

## Hejtman and Staňkov (0.22.0)
- `venues/hejtman.webp`: ŠJů, [Chlum u Třeboně, přes rybník Hejtman (01)](https://commons.wikimedia.org/wiki/File:Chlum_u_T%C5%99ebon%C4%9B,_p%C5%99es_rybn%C3%ADk_Hejtman_(01).jpg), 1 May 2009, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Resized and converted to WebP; adapted image remains CC BY-SA 3.0.
- `venues/stankov.webp`: Harold, [Staňkov, Staňkovský rybník (2020-07-06; 01)](https://commons.wikimedia.org/wiki/File:Sta%C5%88kov,_Sta%C5%88kovsk%C3%BD_rybn%C3%ADk_(2020-07-06;_01).jpg), 6 July 2020, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Resized and converted to WebP; adapted image remains CC BY-SA 4.0.
Both photographs depict the named venue. In-game view adds crop, extended/animated water and shared synthetic equipment/foreground. Stock evidence is linked in the venue picker; probabilities and lengths are game balance.
