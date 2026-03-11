# CHANGE REPORT - Apertura clone-safe Lavori in attesa e Lavori eseguiti

## Data
- 2026-03-11 09:58

## Tipo task
- patch

## Obiettivo
- Aprire nel clone read-only le due route reali della famiglia `Lavori` che hanno un perimetro consultivo sensato, mantenendo fuori `Lavori Da Eseguire` e `DettaglioLavoro`.

## File modificati
- src/App.tsx
- src/next/NextCentroControlloPage.tsx
- src/next/NextLavoriInAttesaPage.tsx
- src/next/NextLavoriEseguitiPage.tsx
- src/next/domain/nextLavoriDomain.ts
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/product/STATO_MIGRAZIONE_NEXT.md

## Riassunto modifiche
- Aggiunte le route clone `/next/lavori-in-attesa` e `/next/lavori-eseguiti`, entrambe sotto l'area gia esistente `operativita-globale`.
- Attivati nel `Centro Controllo` i quick link gia presenti verso le due nuove pagine clone-safe, lasciando ancora non risolto `Lavori Da Eseguire`.
- Esteso `nextLavoriDomain.ts` con snapshot globale read-only, includendo anche lavori `MAGAZZINO` o senza targa e mantenendo intatto il reader per-mezzo gia usato dal dossier.
- Create due pagine clone dedicate solo consultive, con raggruppamento per mezzo / `MAGAZZINO` e senza drill-down, PDF, share o download.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- Le due liste reali della madre diventano davvero navigabili nel clone.
- Nessun writer della famiglia `Lavori` viene aperto.

## Rischio modifica
- ELEVATO

## Moduli impattati
- NEXT / famiglia Lavori
- NEXT / Centro Controllo
- NEXT / domain lavori read-only

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI: Matrice ruoli/permessi definitiva

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- Operativita Globale

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- `Lavori Da Eseguire` e `DettaglioLavoro` restano fuori perimetro perche scriventi.
- Le nuove liste clone non aprono ancora PDF o dettaglio: il perimetro resta solo consultivo.

## Build/Test eseguiti
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
