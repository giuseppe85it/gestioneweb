# CONTINUITY REPORT - Regola domini canonici in AGENTS

## Contesto generale
- il progetto resta in fase di consolidamento documentale e di preparazione alla migrazione NEXT progressiva
- dopo lo Step 2 esiste la base dominio-centrica `docs/data/DOMINI_DATI_CANONICI.md`; con questo Step 3 la sua consultazione diventa obbligatoria nei task futuri di importazione o migrazione NEXT

## Modulo/area su cui si stava lavorando
- regole operative permanenti Codex
- gating documentale per la migrazione NEXT

## Stato attuale
- `AGENTS.md` impone ora il controllo dominio-centrico prima di importare, ricostruire o migrare moduli nella NEXT
- `docs/product/REGOLE_LAVORO_CODEX.md` e stato allineato in forma minima alla stessa regola
- `docs/data/DOMINI_DATI_CANONICI.md` e ora la base obbligatoria da consultare prima di usare mappa fisica e regole entity-level nei task NEXT

## Legacy o Next
- ENTRAMBI

## Stato area/modulo nella NEXT
- N/A

## Cosa e gia stato importato/migrato
- nessun cambiamento runtime
- rafforzata solo la governance documentale della migrazione

## Prossimo step di migrazione
- ogni futuro task NEXT deve partire da `docs/data/DOMINI_DATI_CANONICI.md` e fermarsi se il dominio e non mappato, incoerente, `SENSIBILE`, `DA VERIFICARE` o `BLOCCANTE PER IMPORTAZIONE`

## Moduli impattati
- AGENTS
- regole operative Codex
- pianificazione import moduli NEXT

## Contratti dati coinvolti
- nessun contratto modificato
- coinvolti solo come riferimento operativo i domini canonici gia documentati in `docs/data/DOMINI_DATI_CANONICI.md`

## Ultime modifiche eseguite
- aggiunta in `AGENTS.md` la regola dominio-centrica obbligatoria per la NEXT
- aggiunta in `AGENTS.md` la distinzione obbligatoria tra dominio logico, dataset fisico, writer/reader legacy e target NEXT
- aggiornato `docs/product/REGOLE_LAVORO_CODEX.md` per allineare le regole operative future allo stesso principio

## File coinvolti
- AGENTS.md
- docs/product/REGOLE_LAVORO_CODEX.md
- docs/data/DOMINI_DATI_CANONICI.md

## Decisioni gia prese
- i moduli NEXT non si importano piu partendo da chiavi o collection isolate
- `docs/data/DOMINI_DATI_CANONICI.md` e la base obbligatoria prima di `MAPPA_COMPLETA_DATI.md` e `REGOLE_STRUTTURA_DATI.md` nei task di migrazione NEXT
- i domini non mappati, incoerenti, sensibili o bloccanti impongono stop operativo e dichiarazione esplicita prima della patch

## Vincoli da non rompere
- non toccare codice applicativo in questo filone documentale
- non importare nella NEXT strutture dati legacy incoerenti senza normalizzazione documentata
- non usare `MAPPA_COMPLETA_DATI.md` o `REGOLE_STRUTTURA_DATI.md` come sostituti del controllo dominio-centrico

## Parti da verificare
- applicazione coerente della nuova regola nei prossimi task NEXT reali
- eventuale necessita futura di estendere il gating anche ad altri documenti operativi se emergeranno nuovi casi

## Rischi aperti
- i domini `SENSIBILI`, `DA VERIFICARE` e `BLOCCANTI PER IMPORTAZIONE` restano tali anche dopo questa formalizzazione
- un task futuro potrebbe ignorare la nuova regola se non viene richiamata esplicitamente in chat e nei report

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`: Stream eventi autisti canonico definitivo
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`: Contratto finale allegati preventivi
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`: Coerenza flusso inventario / materiali

## Prossimo passo consigliato
- applicare la nuova regola su un prossimo task NEXT reale e usare `DOMINI_DATI_CANONICI.md` come filtro iniziale per decidere se un dominio e importabile, solo leggibile o bloccato

## Cosa NON fare nel prossimo task
- non partire da una key o collection per giustificare una migrazione NEXT
- non trattare un dominio `SENSIBILE`, `DA VERIFICARE` o `BLOCCANTE PER IMPORTAZIONE` come pronto solo perche esiste gia nella legacy

## Commit/hash rilevanti
- `NON ESEGUITO`

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/data/DOMINI_DATI_CANONICI.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/data/REGOLE_STRUTTURA_DATI.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `AGENTS.md`
- `docs/product/REGOLE_LAVORO_CODEX.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
