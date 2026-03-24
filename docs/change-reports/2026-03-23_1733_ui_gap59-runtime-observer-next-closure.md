# CHANGE REPORT - Chiusura gap runtime Prompt 59 observer NEXT

## Data
- 2026-03-23 17:33

## Tipo task
- ui

## Obiettivo
- Chiudere i gap residui del Prompt 59 del runtime observer NEXT, aggiornando solo i probe read-only e la documentazione, senza toccare la madre e senza forzare controlli bloccati dal clone.

## File modificati
- backend/internal-ai/server/internal-ai-next-runtime-observer.js
- scripts/internal-ai-observe-next-runtime.mjs
- scripts/internal-ai-observe-next-gap59.mjs
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/STATO_ATTUALE_PROGETTO.md

## Riassunto modifiche
- Aggiornato il catalogo runtime a `2026-03-23-total-ui-v2`.
- Corretto l'observer per riconoscere stati gia aperti nel render iniziale, trigger bloccati dal guard rail read-only e probe che richiedono uno step preparatorio read-only.
- Aggiunto uno script dedicato al micro-refresh dei soli gap del Prompt 59.
- Rigenerata la snapshot runtime con esito verificato: `53/53` route osservate, `25/26` stati osservati, `78` screenshot.
- Chiusi davvero:
  - route dinamica `Acquisti` dettaglio;
  - `Home` accordion rapido;
  - `Dossier` modale lavori;
  - `Dossier` foto mezzo;
  - `Dossier rifornimenti` filtri `MESE` e `12 mesi`;
  - `Capo costi` toggle `solo da valutare`;
  - `Acquisti` menu ordine.
- Residuo unico e definitivo:
  - `Home -> Vedi tutto` resta non osservabile perche il trigger e visibile ma disabilitato dal guard rail read-only del clone.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- La nuova IA vede ora tutte le route runtime della NEXT e tutti gli stati realmente osservabili nel perimetro read-only.
- La guida `schermata -> file/modulo/flusso` migliora perche non ha piu il buco su `Acquisti` dettaglio e sui principali stati residui di `Dossier`, `Acquisti` e `Capo costi`.
- Nessun impatto su madre, scritture business, segreti lato client o backend legacy come canale canonico.

## Rischi / attenzione
- Il risultato non equivale a `100% assoluto` degli stati tentati: resta un solo stato non osservabile nel perimetro sicuro.
- Il probe rifornimenti usa una targa reale del clone con dati visibili (`TI313387`); il limite resta quindi data-dependent, non cosmetico.
- Il guard rail del clone resta vincolo da non forzare.

## Build/Test eseguiti
- node --check backend/internal-ai/server/internal-ai-next-runtime-observer.js -> OK
- node --check scripts/internal-ai-observe-next-runtime.mjs -> OK
- node --check scripts/internal-ai-observe-next-gap59.mjs -> OK
- npx eslint backend/internal-ai/server/internal-ai-next-runtime-observer.js scripts/internal-ai-observe-next-runtime.mjs scripts/internal-ai-observe-next-gap59.mjs -> OK
- node scripts/internal-ai-observe-next-gap59.mjs -> OK (`53/53` route, `25/26` stati, `78` screenshot)

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
