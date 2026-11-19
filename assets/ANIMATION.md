# Vrstvy pohybu 0.15

Vygenerováno vestavěným obrazovým nástrojem 19. 11. 2026; transparentní alfa je zachována. WebP připravené pro projekt; původní podklady nejsou přepsané.

- `equipment/held-animated.webp`: rod, naviják bez kličky a pravá ruka, z atlasu 1024 × 1536. Hrot (0,049; 0,039), referenční úchop (0,83; 0,88). Atlas oříznut na hlavní sestavu.
- `equipment/winding-hand.webp`: oddělená levá ruka s černou rukojetí, výřez atlasu x600/y144, 346 × 360. Úchop rukojeti kolem (280; 72) ve výřezu.
- `equipment/empty-tripod.webp`: stejná trojnožka bez prutu a navijáku, zachované souřadnice nohou.
- `equipment/shore-reeds.webp`: ilustrační řídká tráva v levém popředí, zmenšená z 1536 × 1024 na 1152 × 768.

## Zadání

1. Upravit stávající fotograficky působící syntetickou sestavu při přesném zachování polohy prutu, navijáku, korkové rukojeti a pravé ruky. Odstranit kličku pro samostatnou animaci. Na prázdnou pravou horní část atlasu přidat oddělenou levou ruku a krátké předloktí v khaki rukávu, které drží černý oválný úchop kličky. Stejné osvětlení a měřítko, průhledné pozadí, žádné popisky.
2. Ze stávajícího syntetického stojanu odstranit jen celý prut, naviják, rukojeť a vlasec. Doplnit zakryté části vidličky. Zachovat polohu a rozměr trojnožky včetně tří nohou. Průhledné pozadí, žádné jiné předměty.
3. Vytvořit řídký fotograficky působící trs evropských pobřežních trav a rákosu při levém spodním okraji. Stébla pokračují pod obraz; dvě třetiny vpravo jsou prázdné. Měkké denní světlo, čistá průhledná alfa, bez půdy, vody, krajiny a textu.

Pohyby a změny světla obstarává Canvas 2D. Ruka nenahrazuje celý obraz v každém snímku; otáčení kličky a přiblížení úchopu používají samostatnou vrstvu. Všechny vrstvy jsou ilustrační herní podklady.
