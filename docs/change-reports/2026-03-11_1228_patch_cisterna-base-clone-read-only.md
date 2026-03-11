# CHANGE REPORT - Apertura clone-safe Cisterna base

## Data
- 2026-03-11 12:28

## Tipo task
- patch

## Obiettivo
- Aprire nel clone solo la route base `/next/cisterna`, separando la parte consultiva della madre da writer, upload, endpoint IA ed export PDF.

## File modificati
- src/App.tsx
- src/next/NextCentroControlloPage.tsx
- src/next/domain/nextCisternaDomain.ts
- src/next/NextCisternaPage.tsx
- src/next/nextData.ts
- src/next/nextAccess.ts
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/product/STATO_MIGRAZIONE_NEXT.md

## Riassunto modifiche
- Aggiunta la route clone `/next/cisterna` con `areaId="cisterna"`.
- Creato `nextCisternaDomain.ts` per leggere in sola lettura i dataset cisterna reali e ricostruire archivio, report mensile e tabelle per targa.
- Creata `NextCisternaPage.tsx` come pagina clone dedicata con tre tab consultive: archivio, report mensile, targhe + dettaglio.
- Aggiornato il resolver del Centro Controllo per far aprire il quick link `/cisterna` verso la nuova route clone-safe.
- Riallineati metadata e access map del clone per dichiarare `Cisterna` come modulo attivo in forma parziale.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- Il clone espone ora una controparte seria e read-only della route madre base `Cisterna`.
- Restano fuori `/cisterna/ia`, `/cisterna/schede-test`, conferma duplicati, salvataggio cambio EUR/CHF, edit schede ed export PDF.

## Rischio modifica
- ELEVATO

## Moduli impattati
- NEXT / Cisterna
- NEXT / Centro Controllo

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- cisterna

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- La logica di derivazione del report e stata portata nel domain clone con fallback deterministici; quando i dati del mese non sono completi il clone mostra warning e riduce il report.
- La pagina madre legacy non viene riusata, per evitare raw reads in UI e writer misti alla consultazione.

## Build/Test eseguiti
- `npx tsc --noEmit` OK
- `npm run build` OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
