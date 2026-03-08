# CHANGE REPORT - Audit flusso reale rifornimenti

## Data
- 2026-03-08 20:50

## Tipo task
- docs

## Obiettivo
- Documentare in modo definitivo il flusso reale end-to-end dei rifornimenti per guidare una futura lettura NEXT sicura senza toccare il runtime.

## File modificati
- docs/data/FLUSSO_REALE_RIFORNIMENTI.md
- docs/change-reports/2026-03-08_2050_docs_flusso-reale-rifornimenti.md
- docs/continuity-reports/2026-03-08_2050_continuity_flusso-rifornimenti.md

## Riassunto modifiche
- Creato un report unico con writer, reader, dataset e passaggi reali del dominio rifornimenti.
- Esplicitate le tolleranze legacy che oggi permettono al gestionale madre di visualizzare correttamente i rifornimenti.
- Fissata la strategia sicura da rispettare in NEXT e i punti da non copiare.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Migliora la chiarezza architetturale del dominio `D04`.
- Riduce il rischio di import NEXT sporco basato su merge legacy o su letture dal `tmp`.

## Rischio modifica
- ELEVATO

## Moduli impattati
- Documentazione dati
- Audit dominio rifornimenti

## Contratti dati toccati?
- PARZIALE

## Punto aperto collegato?
- NO

## Legacy o Next?
- ENTRAMBI

## Modulo/area NEXT coinvolta
- dossier

## Stato migrazione prima
- DA VERIFICARE

## Stato migrazione dopo
- DA VERIFICARE

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- NO

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- Il contenuto live attuale di `storage/@rifornimenti` resta `DA VERIFICARE` da ambiente autorizzato.
- Il report descrive il flusso reale nel codice, non certifica la pulizia completa del dataset live.

## Build/Test eseguiti
- `rg` mirati su writer/reader rifornimenti -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
