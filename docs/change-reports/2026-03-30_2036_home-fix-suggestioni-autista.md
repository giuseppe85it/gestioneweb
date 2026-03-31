# CHANGE REPORT - Home fix suggestioni autista

## Data
- 2026-03-30 20:36

## Tipo task
- docs + clone/NEXT

## Obiettivo
- Riallineare le suggestioni autista della `Home` NEXT al criterio visibile della madre, usando solo `sessioni` e `mezzi`.

## File modificati
- `src/next/NextCentroControlloPage.tsx`
- `docs/audit/BACKLOG_HOME_EXECUTION.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/2026-03-30_2036_home-fix-suggestioni-autista.md`
- `docs/continuity-reports/2026-03-30_2036_continuity_home-fix-suggestioni-autista.md`

## Riassunto modifiche
- Rimossa la fonte aggiuntiva `autistiSnapshot.assignments` dalla costruzione delle suggestioni autista.
- La `Home` NEXT usa ora solo `sessioni` e `mezzi`, come la madre.
- Aggiornati backlog e registri documentali per tracciare il gap risolto senza promuovere il modulo a `CHIUSO`.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Suggerimenti autista allineati alla madre.
- Nessuna regressione sul contratto read-only.

## Rischio modifica
- NORMALE

## Moduli impattati
- `Home`

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- NO

## Legacy o Next?
- NEXT

## Stato migrazione prima
- APERTO

## Stato migrazione dopo
- APERTO

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- SI

## Rischi / attenzione
- Il modulo resta documentato come `APERTO` per vincolo del task; il gap specifico sulle suggestioni e stato comunque chiuso.

## Build/Test eseguiti
- `npx eslint src/next/NextCentroControlloPage.tsx` -> OK
- `npm run build` -> OK

## Commit hash
- `NON ESEGUITO`

## Stato finale
- FATTO
