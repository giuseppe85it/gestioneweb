# CHANGE REPORT - Regola layer normalizzazione NEXT

## Data
- 2026-03-08 21:05

## Tipo task
- docs

## Obiettivo
- Rendere operativa una regola di progetto che privilegi il layer di normalizzazione NEXT rispetto a modifiche premature del runtime legacy quando il madre funziona gia in produzione.

## File modificati
- AGENTS.md
- docs/product/REGOLE_LAVORO_CODEX.md
- docs/product/STORICO_DECISIONI_PROGETTO.md
- docs/change-reports/2026-03-08_2105_docs_regola-layer-normalizzazione-next.md
- docs/continuity-reports/2026-03-08_2105_continuity_regola-normalizzazione-next.md

## Riassunto modifiche
- Aggiunta in `AGENTS.md` la regola operativa che rende obbligatorio valutare prima un layer di normalizzazione NEXT.
- Allineato `REGOLE_LAVORO_CODEX.md` con la stessa linea operativa.
- Registrata la decisione nello storico architetturale del progetto.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Riduce il rischio di proporre modifiche al madre quando basta una normalizzazione NEXT controllata.
- Rende piu chiaro il criterio operativo per i futuri task dati/NEXT.

## Rischio modifica
- NORMALE

## Moduli impattati
- Regole operative Codex
- Decision log di progetto

## Contratti dati toccati?
- NO

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
- La regola non autorizza scorciatoie: la normalizzazione NEXT deve restare documentata, controllata e separata dalla UI.
- Se il layer NEXT non basta davvero, la motivazione per toccare il runtime legacy deve restare esplicita.

## Build/Test eseguiti
- `rg -n "Regola layer di normalizzazione NEXT|flusso del gestionale madre funziona" AGENTS.md docs/product/REGOLE_LAVORO_CODEX.md docs/product/STORICO_DECISIONI_PROGETTO.md` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
