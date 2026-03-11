# CHANGE REPORT - Apertura clone-safe DettaglioLavoro read-only

## Data
- 2026-03-11 11:31

## Tipo task
- patch

## Obiettivo
- Aprire una route clone-safe dedicata al dettaglio lavori, riusando il layer NEXT `read-only` e senza riattivare la UI madre scrivente.

## File modificati
- src/App.tsx
- src/next/domain/nextLavoriDomain.ts
- src/next/NextDettaglioLavoroPage.tsx
- src/next/NextLavoriInAttesaPage.tsx
- src/next/NextLavoriEseguitiPage.tsx
- src/next/nextData.ts
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/product/STATO_MIGRAZIONE_NEXT.md

## Riassunto modifiche
- Aggiunta la route clone `/next/dettagliolavori/:lavoroId` sotto `operativita-globale`.
- Esteso `nextLavoriDomain.ts` con un resolver read-only del dettaglio per `lavoroId`, che usa `gruppoId` solo quando esiste nel dato legacy e, se manca, mostra solo il record principale.
- Creata `NextDettaglioLavoroPage.tsx` come pagina clone dedicata, priva di azioni scriventi.
- Aggiornate le due liste clone lavori per aprire il nuovo dettaglio clone-safe.
- Riallineato `nextData.ts` e aggiornati i registri NEXT obbligatori.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- Nuovo drill-down read-only coerente con la famiglia madre `Lavori`.
- Nessuna lettura raw nella UI clone e nessuna riattivazione di writer su `@lavori`.

## Rischio modifica
- ELEVATO

## Moduli impattati
- NEXT / Operativita Globale
- Lavori

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- NO

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- operativita

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- Il dettaglio clone non apre `LavoriDaEseguire` e non riusa `DettaglioLavoro.tsx`.
- I record senza `gruppoId` vengono mostrati solo come singolo record per evitare aggregazioni fragili.

## Build/Test eseguiti
- `npx tsc --noEmit` OK
- `npm run build` OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
