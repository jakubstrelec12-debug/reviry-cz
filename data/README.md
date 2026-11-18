# Geografická data Vajgaru

`vajgar.json` obsahuje odvozenou databázi z OpenStreetMap. © OpenStreetMap contributors. Licence ODbL 1.0: https://www.openstreetmap.org/copyright a https://opendatacommons.org/licenses/odbl/1-0/.

Zdroj břehu a ostrova: relace https://www.openstreetmap.org/relation/1744135, získaná přes Nominatim (`polygon_geojson=1`) dne 2026-11-18. Zdrojem půdorysů je OpenStreetMap API, výřez `15.000,49.141,15.007,49.146`. Převzato 358 uzavřených cest označených `building`.

Souřadnice WGS84 byly převedeny do lokálních metrů kolem počátku longitude 15.010, latitude 49.143: x roste k východu, z k jihu. Převod je lokální equirektangulární aproximace s měřítkem 111320 m na stupeň šířky a násobkem cos(latitude) pro délku. Není určen pro geodetické měření.

Výšky budov bez tagu `height` jsou odhadnuté z `building:levels` nebo výchozího počtu podlaží. Příznak `surveyed_height` značí pouze přítomnost zdrojového tagu, ne nezávislé zaměření. Výšky jsou pro renderer omezeny na 2,5–45 m. Herní landmark kostela má pracovní výšku, nikoli ověřenou výšku stavby.

Stanoviště je odvozené od bodu na jižním břehu a posunuté směrem na pevninu. Přístup, legálnost rybolovu, výška terénu ani viditelnost nejsou ověřeny v terénu. Procedurální vegetace a materiály nejsou OSM měřením.

Odvozená data zůstávají pod ODbL. Při dalším použití zachovat zdroj a atribuci. Původní veřejné geografické údaje neobsahují polohu uživatele.
