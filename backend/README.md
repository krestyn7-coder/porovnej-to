# Backend pro v2

Tato slozka obsahuje ukazkovy backend route handler pro skutecne AI porovnani.

## Co je potreba

- hosting s `https`
- serverless funkce nebo maly Node backend
- `OPENAI_API_KEY` v prostredi serveru

## Doporuceny endpoint

- `POST /api/compare`

## Poznamka

Frontend v `web/app.js` uz umi tento endpoint zavolat. Kdyz neni dostupny, spadne zpet do demo rezimu.
