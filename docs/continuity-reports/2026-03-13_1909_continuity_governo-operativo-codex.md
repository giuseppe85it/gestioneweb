# CONTINUITY REPORT - Governo operativo Codex

## Contesto generale
- Il progetto resta nella fase di clone `read-only` della madre con sottosistema IA interna isolato nel perimetro `/next/ia/interna*`.
- Questo task non modifica runtime o logica business: consolida solo il metodo operativo di Codex dentro il repository.

## Modulo/area su cui si stava lavorando
- Governo operativo Codex
- Riduzione della dipendenza da prompt lunghi ripetuti

## Stato attuale
- `AGENTS.md` e ora dichiarato come fonte primaria operativa di Codex sul repo.
- I task futuri possono arrivare in forma corta, pur restando vincolati ai documenti progetto e ai guard-rail gia esistenti.

## Legacy o Next
- ENTRAMBI

## Stato area/modulo nella NEXT
- N/A

## Cosa e gia stato importato/migrato
- N/A

## Prossimo step di migrazione
- N/A

## Moduli impattati
- AGENTS / governance repository
- Stato progetto e decision log

## Contratti dati coinvolti
- nessuno

## Ultime modifiche eseguite
- Rafforzato `AGENTS.md` con workflow rapido, task IA interna e formato corto dei task.
- Allineato `docs/product/REGOLE_LAVORO_CODEX.md` come supporto secondario a `AGENTS.md`.
- Riallineati `docs/LEGGI_PRIMA.md` e `docs/INDICE_DOCUMENTAZIONE_PROGETTO.md` per far emergere `AGENTS.md` anche nei documenti di ingresso.
- Aggiornati stato progetto, storico decisioni e registro clone per registrare la nuova regola operativa.

## File coinvolti
- AGENTS.md
- docs/LEGGI_PRIMA.md
- docs/INDICE_DOCUMENTAZIONE_PROGETTO.md
- docs/STATO_ATTUALE_PROGETTO.md
- docs/product/REGOLE_LAVORO_CODEX.md
- docs/product/STORICO_DECISIONI_PROGETTO.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/change-reports/2026-03-13_1909_docs_governo-operativo-agents-codex.md
- docs/continuity-reports/2026-03-13_1909_continuity_governo-operativo-codex.md

## Decisioni gia prese
- `AGENTS.md` e la fonte primaria operativa di Codex sul repository.
- I prompt futuri possono essere piu brevi, ma restano vincolati a `AGENTS.md` e ai documenti fonte di verita del progetto.

## Vincoli da non rompere
- Madre intoccabile e clone/NEXT in sola lettura salvo task espliciti e coerenti.
- Nessuna scrittura business non approvata.
- Nei task IA interna la checklist unica `docs/product/CHECKLIST_IA_INTERNA.md` resta obbligatoria.

## Parti da verificare
- Verificare nel tempo che nuovi documenti operativi non ricreino una seconda fonte primaria in conflitto con `AGENTS.md`.
- Verificare che i task futuri usino davvero il formato corto senza perdere whitelist, perimetro o output richiesto.

## Rischi aperti
- Deriva documentale se `AGENTS.md` e `docs/product/REGOLE_LAVORO_CODEX.md` vengono aggiornati in modo incoerente.
- Prompt futuri troppo sintetici se omettono vincoli specifici non gia coperti da `AGENTS.md`.

## Punti da verificare collegati
- Nessun nuovo punto aperto registrato; usare `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md` solo se emergono conflitti futuri tra fonti operative.

## Prossimo passo consigliato
- Nei prossimi task usare prompt corti con `obiettivo`, `perimetro` e `output richiesto`, lasciando a `AGENTS.md` il carico delle regole stabili.

## Cosa NON fare nel prossimo task
- Non duplicare in nuovi markdown le stesse regole operative gia fissate in `AGENTS.md`.
- Non usare questo consolidamento documentale per giustificare patch runtime o business non richieste.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/REGOLE_LAVORO_CODEX.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`
- `docs/product/CHECKLIST_IA_INTERNA.md` per i task del sottosistema IA interno

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
