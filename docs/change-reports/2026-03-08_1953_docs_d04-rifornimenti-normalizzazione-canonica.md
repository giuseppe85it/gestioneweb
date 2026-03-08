# CHANGE REPORT - Normalizzazione documentale D04 rifornimenti

## Data
- 2026-03-08 19:53

## Tipo task
- docs

## Obiettivo
- chiarire il contratto canonico target di `D04 Rifornimenti e consumi` senza toccare runtime, storage o NEXT

## File modificati
- docs/data/DOMINI_DATI_CANONICI.md
- docs/data/REGOLE_STRUTTURA_DATI.md
- docs/product/STORICO_DECISIONI_PROGETTO.md

## Riassunto modifiche
- fissato `@rifornimenti` come dataset business target e `@rifornimenti_autisti_tmp` come staging
- documentata la shape canonica target di `@rifornimenti.items` e la chiave mezzo `mezzoTarga`
- vietato lato documentale il merge reader-side tmp/canonico nella futura NEXT
- riclassificato `D04` da `BLOCCANTE PER IMPORTAZIONE` a `SENSIBILE` sul piano architetturale

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- piu chiarezza per futuri reader NEXT e per la convergenza nel Dossier
- riduzione del rischio di importazioni read-only costruite su dataset doppi o merge euristici

## Rischio modifica
- ELEVATO

## Moduli impattati
- documentazione dati
- governance architetturale D04

## Contratti dati toccati?
- SI

## Punto aperto collegato?
- SI: contratto `tmp -> canonico` dei rifornimenti / merge euristici reader-side

## Legacy o Next?
- ENTRAMBI

## Modulo/area NEXT coinvolta
- dossier

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- NO

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- il runtime legacy continua a usare shape multiple e merge euristici
- la nuova classificazione `SENSIBILE` non equivale a dominio gia importato nella NEXT

## Build/Test eseguiti
- NON ESEGUITO

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
