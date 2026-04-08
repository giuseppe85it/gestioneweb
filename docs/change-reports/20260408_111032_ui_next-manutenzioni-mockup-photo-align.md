# Change Report

## Data
- Timestamp: `2026-04-08 11:10:32`
- Modulo: `/next/manutenzioni`
- Tipo intervento: riallineamento UI al mockup con gestione reale 4 foto camion

## File toccati
- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextMappaStoricoPage.tsx`
- `src/next/next-mappa-storico.css`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `CONTEXT_CLAUDE.md`

## Cosa cambia
- La sezione `4 foto collegate al dettaglio` di `Nuova / Modifica` non e piu un puro mockup: espone ora 4 card reali per `Fronte`, `Sinistra`, `Destra`, `Retro`.
- Ogni card mostra preview reale della vista se la foto esiste, oppure placeholder coerente col layout scuro del mockup.
- Ogni card consente upload o sostituzione reale della foto tramite il wiring gia esistente della `Mappa storico`.
- Il tab `Dettaglio` continua a usare le stesse foto reali per le tabs viste e per la gestione hotspot.

## Cosa non cambia
- Nessuna modifica a domain, writer, reader, barrier, shape Firestore o `pdfEngine`.
- Nessuna modifica alla logica business legacy.
- Nessuna modifica a `src/pages/Manutenzioni.css`.

## Verifiche eseguite
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx`
- `npm run build`
