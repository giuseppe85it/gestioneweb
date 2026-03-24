# CONTINUITY REPORT - Chiusura gap runtime Prompt 59 observer NEXT

## Contesto generale
- Il progetto resta nella fase di clone NEXT `read-only` con madre intoccabile.
- Il sottosistema `/next/ia/interna*` resta il perimetro ufficiale per observer runtime e guida di integrazione della nuova IA sopra il clone.
- Questo micro-task chiude i gap residui del Prompt 59 senza riaprire il crawl largo.

## Modulo/area su cui si stava lavorando
- observer runtime NEXT
- IA interna NEXT
- snapshot runtime usata dalla guida di integrazione UI/file/flusso

## Stato attuale
- Stabile: catalogo observer `2026-03-23-total-ui-v2`.
- Stabile: `53/53` route runtime osservate davvero.
- Stabile: `25/26` stati interni osservati davvero, con un solo residuo definitivo.
- Stabile: snapshot runtime aggiornata con `78` screenshot.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- observer Playwright read-only governato
- micro-refresh dedicato ai gap residui Prompt 59
- route dinamica `Acquisti` dettaglio osservata davvero
- stati residui osservati davvero su `Dossier`, `Acquisti`, `Capo costi` e `Home` accordion

## Prossimo step di migrazione
- Non forzare il residuo `Home -> Vedi tutto`.
- Se in futuro si vuole il `100% assoluto` degli stati tentati, serve una decisione esplicita sul guard rail del clone, non un tweak dei selector.

## Moduli impattati
- backend IA separato
- observer runtime NEXT
- documentazione IA/NEXT/clone

## Contratti dati coinvolti
- snapshot `next_runtime_observer_snapshot.json`
- `InternalAiServerRuntimeObserverSnapshot`

## Ultime modifiche eseguite
- corretto l'observer per gestire:
  - stati gia aperti nel render iniziale;
  - trigger read-only bloccati dal clone;
  - step preparatori read-only prima del probe vero e proprio;
- aggiunto `scripts/internal-ai-observe-next-gap59.mjs` per aggiornare solo i gap residui verificati;
- aggiornati tracker permanenti e stato progetto.

## File coinvolti
- `backend/internal-ai/server/internal-ai-next-runtime-observer.js`
- `scripts/internal-ai-observe-next-runtime.mjs`
- `scripts/internal-ai-observe-next-gap59.mjs`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/change-reports/2026-03-23_1733_ui_gap59-runtime-observer-next-closure.md`

## Decisioni gia prese
- La madre non si tocca.
- Nessuna scrittura business, submit, upload o forzatura di controlli disabilitati.
- Il risultato va dichiarato in modo onesto: route tutte osservate, ma uno stato resta fuori per guard rail.

## Vincoli da non rompere
- Nessun uso della madre come scorciatoia.
- Nessun backend legacy come canale canonico.
- Nessun segreto lato client.
- Testi visibili in italiano.

## Parti da verificare
- Nessuna nuova parte critica aperta nel perimetro del Prompt 59.
- Resta solo il residuo `Home -> Vedi tutto`, gia classificato come non osservabile in sicurezza.

## Rischi aperti
- Dichiarare `100% assoluto` sarebbe improprio finche il trigger `Vedi tutto` resta disabilitato nel clone.
- Il probe rifornimenti resta data-dependent: usa una targa con dati reali visibili nel clone.

## Punti da verificare collegati
- Nessun nuovo punto aperto oltre al residuo guardrail gia noto.

## Prossimo passo consigliato
- Usare questa snapshot v2 come baseline stabile per i prossimi task IA/UI, senza riaprire audit completi del runtime NEXT.

## Cosa NON fare nel prossimo task
- Non riaprire il crawl totale se il task non tocca davvero il runtime observer.
- Non bypassare il guard rail di `Home -> Vedi tutto`.
- Non raccontare il risultato come copertura totale assoluta degli stati.

## Commit/hash rilevanti
- NON ESEGUITO
