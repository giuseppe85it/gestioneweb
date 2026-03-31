# AUDIT LOOP `Dossier Rifornimenti`

- Data audit: `2026-03-31 08:20 Europe/Rome`
- Route ufficiale verificata: `/next/dossier/:targa/rifornimenti`
- Runtime ufficiale verificato: `src/next/NextDossierRifornimentiPage.tsx`
- Esito audit: `PASS`

## Verifica su codice reale
- La route ufficiale `/next/dossier/:targa/rifornimenti` monta `NextDossierRifornimentiPage`, non `NextMotherPage` o `src/pages/DossierRifornimenti.tsx`.
- Il runtime ufficiale replica la superficie madre del modulo su header, CTA di ritorno, riepilogo rifornimenti, ultimi rifornimenti, selettori periodo, grafici e calcoli visibili.
- `NextDossierRifornimentiPage` usa `NextRifornimentiEconomiaSection` con `dataScope="legacy_parity"`, quindi la vista ufficiale esclude i record `solo_campo` e mantiene solo il perimetro dati che la madre rende visibile: base business con ricostruzione controllata dai dati campo.
- Il layer NEXT D04 resta pulito e piu ricco per altri consumer, ma il dossier ufficiale non espone piu append di record solo feed campo che altererebbero la parity esterna.
- La madre resta distinta e intoccata: `src/pages/DossierRifornimenti.tsx` e `src/pages/RifornimentiEconomiaSection.tsx` continuano a leggere direttamente `@rifornimenti` e `@rifornimenti_autisti_tmp`, mentre il clone usa solo layer NEXT read-only.

## Criteri PASS/FAIL
- Route NEXT autonoma senza runtime finale madre: `PASS`
- UI pratica equivalente alla madre: `PASS`
- Flussi visibili utili equivalenti: `PASS`
- Modali principali equivalenti: `PASS` (non presenti nel modulo)
- Report/PDF principali equivalenti: `PASS` (non presenti nel modulo)
- Testi, CTA, placeholder e validazioni visibili equivalenti: `PASS`
- Lettura degli stessi dati visibili della madre nel runtime ufficiale: `PASS`
- Nessuna scrittura reale attiva e blocco esplicito read-only coerente: `PASS`
- Layer NEXT puliti usati davvero sotto: `PASS`
- Lint e build: `PASS`

## Verdetto
- Il modulo `Dossier Rifornimenti` e `CLOSED` nel loop corrente.
- La chiusura vale solo per il modulo `Dossier Rifornimenti`.
- Il prossimo modulo non `CLOSED` del tracker e `Inventario`.
