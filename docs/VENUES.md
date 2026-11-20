# Revíry a ověření osádky — 0.12

Ověřeno 19. 11. 2026. Veřejné zdroje dokládají výskyt nebo historické zarybnění, nikoli dnešní počty ryb. Herní šance, velikosti, síla ryb a hloubka nejsou údaje z terénního měření. Obecná tabulka lovných měr není dokladem přítomnosti druhu; z ní jsme osádku nepřebírali.

## Malá vodní nádrž Jarošov nad Nežárkou

- [Pořadatel závodu 30. 4. 2022](https://www.rybarskezebricky.cz/termin.php?co=detail&id=10893): jmenovitě kapři, amuři, líni, karasi, cejni a plotice. Název a popis odpovídají požadované nádrži v Jarošově, nikoli řece Nežárce 5 nebo rybníku u Litomyšle.
- [Jarní šupinka 29. 3. 2025](https://www.rybarskezebricky.cz/termin.php?co=detail&id=13289): kapr, amur, štika, candát, karas, cejn, plotice, okoun. Lín se zde neopakuje, proto hra jeho podklad označuje jako starší údaj 2022; absence v novějším neúplném seznamu není důkazem vymizení.
- Hratelné: kapr, amur, lín, karas (druh neurčen), cejn, plotice. Dravci jsou uvedeni v informacích, nejsou losováni na boilies a partikl. Lov dravců zatím hra neobsahuje.
- Druh karase nebyl doložen. Fotografie karase obecného je pouze ilustrační ukázka rodu; v úlovku se nepředstírá určení místního druhu.
- Dostupnost vody k běžnému rybolovu ani nynější pravidla nebyly potvrzeny. Propozice závodu nejsou rybářským řádem pro veškeré termíny.
- **Fotografie doplněna v 0.12.1:** [Nachytáno.cz, Malá vodní nádrž Jarošov nad Nežárkou](https://www.nachytano.cz/clanky/mala-vodni-nadrz-jarosov-nad-nezarkou-a2191/), snímek `jarosov_IX.JPG`. Reportáž výslovně popisuje tuto 2,4ha vodu, molo, chatku a druhy ryb. Datum na stránce není uvedeno, provozní pravidla a ceny nepřebíráme jako současné.
- Originál fotografie se načítá přímo od Nachytáno.cz; neukládáme jej do repozitáře a neoznačujeme licencí CC. Web uvádí autorská práva, konkrétní fotograf u snímku není jmenován. Zdroj a tento stav jsou viditelné ve hře.
- Když externí obrázek selže nebo neodpoví do 12 sekund, načte se starší místní ilustrační náhrada rybníka v Matějovci. Viditelný pruh, zápatí i informace o prostředí pak výslovně říkají, že nejde o fotografii cílové nádrže.
- Širší portrétní pohled používá jednotné měřítko skutečného snímku břehu. Doplňuje pouze plochu oblohy a vody ve volném prostoru; nepředstírá další geografii. Standardní záběr lze obnovit v nabídce.

## Vlkovská pískovna

- [JčÚS ČRS: Lužnice 7 B, 421039](https://www.jcus.cz/luznice-7-b-421-039/): Vlkovská velká je 46ha součást soustavy zatopených pískoven. Nezaměňovat s Horusickou pískovnou (421103), samostatným revírem.
- [ČRS MO Veselí nad Lužnicí, rozbor hospodaření 2019](https://mocrsveseli.cz/wp-content/uploads/Vesel%C3%AD-rozbor-hospodareni-2019.pdf), strana 3: skutečné vykázané úlovky kapra, lína, cejna, amura a karase; také dravci, úhoř, pstruh duhový a další. Prázdné řádky tabulky nejsou důkaz výskytu.
- [JčÚS ČRS, podzimní zarybnění 2024](https://www.jcus.cz/wp-content/uploads/zarybnovani-reviru-2024-podzim.pdf): 5. 10. kapr a lín, 8. 10. pstruh duhový, 20. 10. okoun, štika, candát; další výsadby kapra. Neurčitou „bílou rybu“ nepřevádíme na konkrétní druh.
- Zásadní omezení: oba výkazy platí pro celý revír Lužnice 7 B, nikoli pro jednotlivé pískovny. Hra nepředstírá samostatný inventář Vlkovské velké. Historické údaje nejsou záruka dnešní přítomnosti nebo početnosti.
- Hratelné: kapr, lín, cejn, amur, karas (druh neurčen). Ostatní doložené ryby jsou informativní do doplnění odpovídajících technik lovu.
- Fotografie Czeva, 27. 10. 2019, geolokovaná přímo u Vlkovské pískovny; ve hře výřez horní části přes hladinu, aby původní rybář a jeho náčiní nebyli součástí herního popředí. Žádné AI přepisování krajiny. Dřevěné popředí zůstává společná ilustrační AI vrstva, nikoli důkaz skutečného mola.

## Vajgar

Původní tři herní druhy zachovány. Ve výběru vody jsou poctivě označené jako původní herní osádka bez samostatně doplněného dokladu, nikoli jako nově ověřený inventář.

## Chování aplikace

Revír je společný oběma prutům a ukládá se do nastavení. Změna je povolená jen s oběma pruty ve stavu připraven / unikla; zásoby a deník se zachovají, krmné místo zanikne. Nový obrázek se načte před přepnutím stavu. Úlovek nese původní identifikátor revíru i po další změně vody. U nástrah se počítají a zobrazují jen druhy vybraného revíru; 20mm boilies zachovávají původní herní filtr velkých kaprů. Nové parametry amura, karase a plotice jsou herní model, ne měření těchto vod.


## Oprava prostředí 0.24.0

Aktuální konfigurace fotografií a zdrojů je v `src/venue-photos.js`. U všech 15 vod je podklad samostatný. Lužnice 10 C je **rybník Stupský**, ne další úsek řeky; vymezení potvrzuje [MO Třeboň](https://www.crstrebon.cz/reviry-crs-ve-sprave-mistni-organizace-trebon/). Lužnice 10 B používá fotografii pískovny Cep, která do revíru patří. Fotografie Nežárky pochází z Lásenice. Vlkovská malá je označená syntetická ilustrace; nepotvrzuje skutečný tvar jejího břehu. Jarošov má syntetickou zálohu při nedostupnosti vydavatele. Žádná fotografie jiné vody se jako záloha nepoužívá.

Přírodní stanoviště se volí přes `src/stations.js`. Jde o syntetické kompozity s průhledností, bez tvrzení o přesné poloze nebo povoleném přístupu. Krajina zůstává fotografická; její roční období se s volbou herního data nemění.
