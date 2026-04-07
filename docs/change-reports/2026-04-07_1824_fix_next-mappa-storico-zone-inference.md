# Change Report - 2026-04-07 18:24

## Task
Correzione della logica di inferenza zona nella vista interna `Mappa storico` di `/next/manutenzioni`.

## Perimetro
- solo `src/next/domain/nextMappaStoricoDomain.ts`
- solo `src/next/mezziHotspotAreas.ts`
- aggiornamento tracker/documentazione clone

## Causa reale del bug
- Il matcher precedente risolveva le zone filtrando tutte le aree con una qualunque keyword trovata nel testo.
- `fronte-fanali` conteneva la keyword troppo generica `anteriore`.
- Un intervento reale come `CAMBIO GOMME ... Asse: Anteriore` produceva quindi piu zone, e tra queste compariva anche `Fanali anteriori`.
- Il problema nasceva da due fattori insieme:
  - ordine e matching non pesati;
  - keyword troppo generiche nelle aree frontali e assi/pneumatici.

## Cosa e stato corretto
- introdotto in `nextMappaStoricoDomain.ts` un ramo prioritario per componenti gomme/ruote/assi:
  - prima riconosce il componente;
  - poi deduce `fronte`, `sinistra`, `destra`, `retro`;
  - se la direzione non e affidabile, restituisce nessuna zona automatica;
- il fallback generale non usa piu il solo `includes()` ma uno scoring delle keyword specifiche;
- `mezziHotspotAreas.ts` rimuove keyword troppo generiche e rende piu esplicite le keyword delle zone assi/pneumatici e fanali.

## Verifiche eseguite
- `npx eslint src/next/domain/nextMappaStoricoDomain.ts src/next/mezziHotspotAreas.ts` -> `OK`
- `npm run build` -> bundle costruito con successo (`vite build` chiuso con `✓ built`); restano solo warning noti su chunk size e `jspdf`
- verifica runtime reale su `http://127.0.0.1:4173/next/manutenzioni`:
  - prima della patch:
    - `TI298409` cercando `gomm` -> `Zone: Fanali anteriori, Assale anteriore, Assi e pneumatici sinistri, Assi e pneumatici destri, Assi posteriori`
    - `TI324623` cercando `gomm` -> stesso errore con `Fanali anteriori`
  - dopo la patch:
    - `TI298409` -> `Zone: Assale anteriore`
    - `TI324623` -> `Zone: Assale anteriore`
    - `TI313387` con `asse: 1° asse` -> `Zona non deducibile`

## Esito
- Gli interventi gomme/pneumatici/assali non finiscono piu su `Fanali anteriori`.
- I match specifici vincono sui match generici.
- I casi ambigui sono gestiti in modo prudente.
