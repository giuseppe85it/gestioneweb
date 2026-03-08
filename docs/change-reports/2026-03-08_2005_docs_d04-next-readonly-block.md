# CHANGE REPORT - Verifica D04 NEXT bloccata

## Data
- 2026-03-08 20:05

## Tipo task
- docs

## Obiettivo
- verificare se `D04 Rifornimenti e consumi` fosse importabile in forma minima `read-only` nella NEXT senza toccare la legacy

## File modificati
- docs/product/STATO_MIGRAZIONE_NEXT.md

## Riassunto modifiche
- registrato nel tracker NEXT che `D04` non entra ancora nel Dossier
- esplicitato che il blocco nasce da disallineamento runtime del canonico `@rifornimenti.items`
- mantenuto invariato lo stato di migrazione del Dossier NEXT, che resta `D01 + D02`

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- evita un'importazione NEXT non canonica dei rifornimenti
- lascia traccia permanente del blocco nel registro di migrazione

## Rischio modifica
- ELEVATO

## Moduli impattati
- tracker NEXT
- dossier next

## Contratti dati toccati?
- PARZIALE

## Punto aperto collegato?
- SI: allineamento runtime del contratto `tmp -> canonico` di `@rifornimenti`

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- dossier

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- il canonico runtime continua a produrre `data` formattata invece di `timestamp`
- `source` e `validation` non sono ancora garantiti nel dataset business attivo
- la NEXT non deve usare `value.items` o `@rifornimenti_autisti_tmp` come fallback

## Build/Test eseguiti
- `rg -n "D04|@rifornimenti.items|timestamp|source|validation"` su documentazione e codice critico

## Commit hash
- NON ESEGUITO

## Stato finale
- BLOCCATO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
