# CHANGE REPORT - Censimento domini dati step 1

## Data
- 2026-03-08 11:53

## Tipo task
- docs

## Obiettivo
- produrre un report intermedio di censimento dati del repository come base per la futura normalizzazione canonica

## File modificati
- docs/data/CENSIMENTO_DOMINI_DATI_STEP1.md
- docs/change-reports/2026-03-08_1153_docs_censimento-domini-dati-step1.md
- docs/continuity-reports/2026-03-08_1153_continuity_censimento-domini-dati.md

## Riassunto modifiche
- creato report intermedio di censimento / pre-normalizzazione dei domini dati reali del repo
- classificati i principali domini dati con moduli pivot, direzione lettura/scrittura e livello di rischio
- proposta la struttura del futuro file canonico finale e valutata la sufficienza dei documenti dati gia esistenti

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- migliora la preparazione dello step 2 senza toccare codice o runtime
- rende piu chiari i domini piu densi e i punti di collisione writer/reader per legacy e NEXT

## Rischio modifica
- NORMALE

## Moduli impattati
- documentazione dati
- pianificazione normalizzazione legacy/NEXT

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI: stream eventi autisti canonico definitivo
- SI: contratto finale allegati preventivi
- SI: coerenza flusso inventario / materiali

## Legacy o Next?
- ENTRAMBI

## Modulo/area NEXT coinvolta
- nessuna

## Stato migrazione prima
- N/A

## Stato migrazione dopo
- N/A

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- NO

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- il report e intermedio e non sostituisce il futuro file canonico finale
- alcuni punti restano `DA VERIFICARE` e non vanno chiusi implicitamente nello step 2

## Build/Test eseguiti
- `git diff --name-only` -> nessuna modifica preesistente rilevata prima della patch

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
