# Porovnej To v2

## Cil

Prepnout appku z lokalnich sablon na skutecne AI porovnani s webovym researchem.

## Doporucena architektura

1. Frontend PWA na iPhonu posle dvojici produktu na backend.
2. Backend zavola OpenAI Responses API.
3. Model pouzije web search a vrati strukturovany JSON.
4. Frontend vysledek vykresli do stejnych karet jako ve v1.

## Doporuceny model

- vychozi varianta: `gpt-5.4-mini`
- duvod: dobra rovnovaha cena, rychlost a kvalita
- vyssi kvalita: `gpt-5.4`

Toto je inference z oficialnich model docs a pricing docs, ne tvrzeni z jedne jedine stranky.

## Proc Responses API

- OpenAI uvadi Responses API jako pokrocile rozhrani pro generovani odpovedi a pouziti nastroju
- podporuje web search
- podporuje strukturovane vystupy

## Co ma vratit backend

```json
{
  "result": {
    "id": "uuid",
    "title": "iPhone 15 Pro vs Google Pixel 10 Pro",
    "badge": "AI z webu",
    "summary": "...",
    "differences": ["...", "..."],
    "pros": ["...", "..."],
    "cons": ["...", "..."],
    "verdict": "...",
    "sources": [
      { "title": "Source 1", "url": "https://example.com" }
    ],
    "createdAt": "2026-04-08T00:00:00.000Z"
  }
}
```

## Prompt strategie

- nechat model nejdriv dohledat aktualni informace
- vyslovne chtit porovnani pro bezneho kupujiciho v cestine
- chtit jasne oddelit fakta od odhadu
- vynutit JSON schema

## Otevrene body

- vlastni API klic musi zustat jen na backendu
- nasazeni musi byt na `https`, pokud to ma bezet jako appka z plochy iPhonu
- pro produkci je potreba pridat limity a ochranu proti zneuziti
