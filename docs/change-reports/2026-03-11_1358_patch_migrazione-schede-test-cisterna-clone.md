# CHANGE REPORT - Migrazione Schede Test Cisterna nel clone

## Data
- 2026-03-11 13:58

## Tipo task
- patch

## Obiettivo
- Aprire nel clone la route reale `/next/cisterna/schede-test` riusando controllatamente il modulo madre e gestendo in modo sobrio i blocchi della barriera no-write.

## File modificati
- `src/App.tsx`
- `src/pages/CisternaCaravate/CisternaSchedeTest.tsx`
- `src/next/NextCisternaPage.tsx`
- `src/next/NextCisternaSchedeTestPage.tsx`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Riassunto modifiche
- Registrata la route clone `/next/cisterna/schede-test`.
- Collegato dalla base clone `/next/cisterna` l'ingresso a `Schede Test`.
- Riutilizzata la pagina madre con adattamenti minimi per ritorni clone-safe e gestione chiara di estrazione, upload crop e save/update bloccati dalla barriera.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- La famiglia Cisterna nel clone copre ora anche `Schede Test` come modulo reale navigabile.
- Nessuna scrittura reale verso la madre: upload, endpoint IA e save/update restano fermati dalla barriera.

## Rischio modifica
- ELEVATO

## Moduli impattati
- Cisterna
- Schede Test
- Routing NEXT

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI: `Governance endpoint IA/PDF multipli`

## Legacy o Next?
- ENTRAMBI

## Modulo/area NEXT coinvolta
- altro

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- SI

## Rischi / attenzione
- Il modulo resta writer-centrico nella UX, anche se la barriera blocca i side effect.
- La pagina madre e stata riusata: future evoluzioni del modulo legacy possono riflettersi anche nel clone.

## Build/Test eseguiti
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
