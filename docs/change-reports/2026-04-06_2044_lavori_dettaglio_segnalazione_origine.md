# Change Report - 2026-04-06 20:44

## Modulo
- `Lavori` NEXT

## Obiettivo
- Mostrare nel dettaglio lavoro il testo reale del problema segnalato dall'autista quando disponibile.
- Aprire la segnalazione autista originale in un modale read-only senza uscire dal modulo `Lavori`.

## File toccati
- `src/next/NextDettaglioLavoroPage.tsx`
- `src/next/next-lavori.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Modifica applicata
- Inserita la sezione `Problema segnalato` nel dettaglio lavoro.
- Riutilizzato il reader NEXT `readNextAutistiReadOnlySnapshot(...)` in sola lettura per recuperare la segnalazione autista originale.
- Aggiunto `Apri segnalazione` nel blocco `Segnalato da` quando il match e sicuro.
- Aggiunto modale read-only con autore, data/ora, mezzo, stato, tipo problema, foto e descrizione reale.

## Regola di matching
1. Match forte su `source.type === "segnalazione"` e `source.id/originId`.
2. Fallback solo su match univoco per:
   - targa
   - autore segnalazione
   - descrizione reale
   - tipo problema, se disponibile nel lavoro
3. Se il match non e sicuro, nessuna apertura di segnalazione errata.

## Scritture
- Nessuna nuova scrittura introdotta.
- Il modale segnalazione e read-only.

## Verifiche
- `node_modules\\.bin\\eslint.cmd src\\next\\NextDettaglioLavoroPage.tsx`
- `npm run build`
- Verifica runtime su `/next/lavori-in-attesa` e `/next/dettagliolavori/:lavoroId`
