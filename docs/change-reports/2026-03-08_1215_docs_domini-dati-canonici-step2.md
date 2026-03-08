# CHANGE REPORT - Creazione file canonico domini dati Step 2

## Data
- 2026-03-08 12:15

## Tipo task
- docs

## Obiettivo
- creare il file principale dominio-centrico `docs/data/DOMINI_DATI_CANONICI.md` come nuova base documentale per la futura normalizzazione e importazione dei moduli nella NEXT

## File modificati
- docs/data/DOMINI_DATI_CANONICI.md
- docs/INDICE_DOCUMENTAZIONE_PROGETTO.md
- docs/change-reports/2026-03-08_1215_docs_domini-dati-canonici-step2.md
- docs/continuity-reports/2026-03-08_1215_continuity_domini-dati-canonici.md

## Riassunto modifiche
- creato il nuovo documento dominio-centrico con indice canonico dei domini reali emersi dal repo e dallo Step 1
- definita per ogni dominio la struttura minima di governo: dataset fisici, entita, writer, reader, moduli pivot, relazioni con Dossier, Centro di Controllo e IA futura
- aggiunte regole di normalizzazione globali e priorita di importazione nella NEXT
- aggiornato l'indice documentale per registrare `DOMINI_DATI_CANONICI.md` come riferimento operativo prima della mappa fisica e delle regole entity-level

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- aumenta la coerenza documentale sui dati reali del progetto senza cambiare runtime, storage o contratti applicativi
- riduce il rischio di importazioni NEXT guidate da chiavi sparse invece che da domini logici

## Rischio modifica
- NORMALE

## Moduli impattati
- documentazione dati
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
- il nuovo file e guida di dominio, non sostituisce ancora l'approfondimento entity-level dove dichiarato `DA VERIFICARE`
- i domini con stato `BLOCCANTE PER IMPORTAZIONE` non devono essere importati nella NEXT in scrittura prima della chiusura dei punti aperti documentati

## Build/Test eseguiti
- `Get-Content -Raw docs/data/DOMINI_DATI_CANONICI.md` -> OK
- `Get-Content -Raw docs/INDICE_DOCUMENTAZIONE_PROGETTO.md` -> OK
- `git status --short` -> OK

## Commit hash
- `NON ESEGUITO`

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
