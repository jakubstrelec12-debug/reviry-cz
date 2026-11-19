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
