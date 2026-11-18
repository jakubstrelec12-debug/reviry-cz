# REVÍRY CZ — Unity / Vajgar

**Stav: zdrojový projekt Unity. V Unity Editoru nebyl otevřený, zkompilovaný ani spuštěný. Nativní aplikace a snímek z Unity zatím nejsou k dispozici.**

Projekt cílí na Unity 6 LTS, verzi 6000.0.62f1, s URP 17.0.4. Připravené cíle jsou iPhone a macOS. Webová verze v hlavní větvi zůstává samostatným starším výsledkem.

## Co bylo skutečně vytvořeno

- Samostatná simulace lovu v C# bez závislosti na Unity: nához, čekání, mechanický záběr, uchopení prutu, zásek, tah ryby, brzda, únava, únik, podebrání a záznam úlovku.
- Unity scéna s automatickým sestavením prostředí z geografických dat Vajgaru. Terén má modelovaný přechod břeh/dno; výšky a hloubky jsou herní odhad.
- Zdroj shaderu vody pro URP s hloubkou, lomem pozadí, Fresnelovým odrazem, vlněním, kruhy po náhozu a odrazovou kamerou. Shader a renderovací cesta ještě nejsou ověřené Unity shader compilerem.
- Prostorový strom ve FBX: zjednodušený kmen a větve, 1 400 listových větviček ve 3D s průhledovou texturou. Není použitý billboard celého stromu. Umístění a velikosti vegetace jsou pracovní.
- Pracovní model prutu, navijáku a čihátka s animacemi; nejde zatím o finální umělecky zpracované vybavení.
- Dotykové ovládání přes Unity UI, rozhlížení, safe area, pauza při odchodu z aplikace, deník v aplikačním úložišti.
- Editorový skript vytvářející URP nastavení, materiály, barevný profil a konfiguraci exportů. Vytvoření těchto assetů nebylo v Unity vyzkoušené.

Převod do Unity sám o sobě nedokládá vyšší grafickou kvalitu. Zjednodušené modely města a vybavení nadále vyžadují výtvarnou práci. Nový fotorealistický výsledek zatím není prokázaný.

## Ověření dokončené v tomto prostředí

- Kompilace a běh skutečné C# simulace v .NET 8: **14 kontrol a 100 úspěšně zdolaných úlovků s různými náhodnými semeny**.
- Syntaxe všech 11 Unity C# souborů ověřená Roslynem v režimu C# 9: bez syntaktických chyb. Toto neověřuje vazby na Unity API.
- Kontrola 138 bodů břehu, 19 bodů ostrova, 358 budov, JSON manifestů a vazby scény na bootstrap skript.
- **Neověřeno:** import projektu, Unity API kompilace, import FBX, URP assety, shader, grafický výstup, dotykové ovládání za běhu, macOS build, iOS build a výkon na fyzickém zařízení.

Testy simulace bez Unity:

```sh
dotnet run --project Tests.Console/Tests.Console.csproj --configuration Release
```

Další testy jsou připravené v Unity Test Runneru. Nebyly v něm spuštěné.

## Cesta k reálnému spuštění

Pro následující kroky je nutné prostředí s aktivovaným Unity Editorem a příslušnými build moduly. V pracovním prostředí, ve kterém tento projekt vznikl, Unity Editor ani dostupná licence nejsou. Dostupné konektory nepřidaly službu, která by tuto kompilaci umožnila.

Po importu projekt automaticky vytvoří URP konfiguraci. Totéž je dostupné přes `Reviry > Prepare Project`. Otevření scény: `Reviry > Open Vajgar Scene`, potom Play.

Exporty připravuje `Reviry > Build macOS` a `Reviry > Export iOS Xcode Project`. Druhý vytváří projekt pro Xcode, **ne instalovatelný soubor pro iPhone**. Následuje sestavení a podepsání na macOS přes Xcode. Apple podpis ani distribuce přes TestFlight nejsou v projektu nastavené.

Uživatelovým cílem je spustitelná hra bez ručního sestavování. Tyto vývojářské kroky nejsou předáním hotového produktu; musí je dokončit vývojové prostředí před dodáním aplikace.

## Podklady a licence

Geografické půdorysy: © OpenStreetMap contributors, ODbL 1.0; zdroj a omezení v `../data/README.md`. Unity JSON je odvozený převod pro JsonUtility. Převodník: `Tools/convert_geography.py`.

Prostorový strom a textury: Poly Haven, CC0, viz `Assets/Reviry/Resources/Environment/CREDITS.md`.

Oficiální technické podklady:

- https://unity.com/releases/editor/whats-new/6000.0.62f1
- https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/iphone/getting-started/ios-environment-setup
- https://docs.unity.com/en-us/engine/6000.0/script-reference/unityengine/rendering/renderpipeline/submitrenderrequest
