# Porovnej To Web

Webova verze appky pro rychle porovnani dvou veci.

## Co umi

- rychle porovnani dvou polozek
- shrnuti, rozdily, plusy, minusy a verdikt
- lokalni historii porovnani
- pripravu pro pripnuti na plochu iPhonu

## Omezeni

- tato verze jeste nepouziva skutecne AI ani live webovy research
- odpovedi jsou generovane z lokalnich sablon podle typu produktu

## Dalsi faze

Napojeni na backend a AI model, aby vysledek vychazel z realnych zdroju a ne jen z lokalni sablony.

Frontend uz ve verzi 2 zkousi volat `POST /api/compare`. Kdyz endpoint neni nasazeny, automaticky prepne na demo rezim.

## Otevreni na iPhonu

1. Na pocitaci spust `server.ps1`.
2. Na iPhonu ve stejne Wi-Fi otevri `http://192.168.1.18:8090`.
