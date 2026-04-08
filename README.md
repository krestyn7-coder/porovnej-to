# Porovnej To

Porovnej To je osobni webova appka pro iPhone, ktera porovnava dve veci a vraci prehledny vysledek v cestine.

## Co umi verze 1

- zadat dve veci k porovnani
- zobrazit shrnuti, rozdily, plusy a minusy a verdikt
- ulozit historii porovnani do prohlizece
- fungovat jako mobilni webova appka

## Co zatim neumi

- nema napojeni na skutecne AI nebo live webovy vyzkum
- vysledek je zalozeny na jednoduche lokalni logice a sablonach

## Dalsi krok

Pokud budes chtit skutecne AI porovnani, dalsi faze bude napojeni na backend a model, ktery udela realny webovy research.

Ve verzi 2 uz je pripraven:

- frontend fallback mezi demo a live AI rezimem
- navrh architektury v `Docs/v2-openai-architecture.md`
- ukazkovy backend route handler v `backend/compare-route.mjs`
- deploy-ready Vercel route v `api/compare.js`
- `vercel.json` pro jednodussi nasazeni cele appky
