# CHANGE REPORT - Regola domini canonici obbligatoria in AGENTS Step 3

## Data
- 2026-03-08 18:33

## Tipo task
- docs

## Obiettivo
- rendere obbligatoria per i task futuri la base dominio-centrica `docs/data/DOMINI_DATI_CANONICI.md`, aggiornando `AGENTS.md` e il minimo allineamento operativo collegato

## File modificati
- AGENTS.md
- docs/product/REGOLE_LAVORO_CODEX.md
- docs/change-reports/2026-03-08_1833_docs_regola-domini-canonici-agents-step3.md
- docs/continuity-reports/2026-03-08_1833_continuity_regola-domini-canonici-agents.md

## Riassunto modifiche
- aggiunta in `AGENTS.md` una regola obbligatoria che impone il controllo del dominio in `docs/data/DOMINI_DATI_CANONICI.md` prima di importare o migrare moduli nella NEXT
- formalizzato in `AGENTS.md` il blocco operativo sui domini non mappati, incoerenti, `SENSIBILI`, `DA VERIFICARE` o `BLOCCANTI PER IMPORTAZIONE`
- chiarita in `AGENTS.md` la distinzione obbligatoria tra dominio logico, dataset fisico, writer/reader legacy e target NEXT
- aggiornato `docs/product/REGOLE_LAVORO_CODEX.md` per allineare le regole operative future di Codex allo stesso gating dominio-centrico

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- riduce il rischio di future migrazioni NEXT guidate da chiavi o dataset isolati invece che da domini normalizzati
- rende operativa e riusabile nei task futuri la gerarchia tra `DOMINI_DATI_CANONICI.md`, `MAPPA_COMPLETA_DATI.md` e `REGOLE_STRUTTURA_DATI.md`

## Rischio modifica
- NORMALE

## Moduli impattati
- governance documentale
- regole operative Codex
- pianificazione migrazione NEXT

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI: Stream eventi autisti canonico definitivo; Contratto finale allegati preventivi; Coerenza flusso inventario / materiali

## Legacy o Next?
- ENTRAMBI

## Modulo/area NEXT coinvolta
- sistema

## Stato migrazione prima
- N/A

## Stato migrazione dopo
- N/A

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- NO

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- la nuova regola non chiude da sola i domini sensibili o bloccanti; impone solo di fermarsi e dichiararli prima di migrare
- i task futuri NEXT devono applicare questa regola in chat e nei report, non solo considerarla come riferimento teorico

## Build/Test eseguiti
- `rg -n "Regola dominio-centrica|DOMINI_DATI_CANONICI|BLOCCANTE PER IMPORTAZIONE" AGENTS.md` -> OK
- `rg -n "DOMINI_DATI_CANONICI|BLOCCANTE PER IMPORTAZIONE" docs/product/REGOLE_LAVORO_CODEX.md` -> OK

## Commit hash
- `NON ESEGUITO`

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
