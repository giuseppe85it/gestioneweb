# Change Report - 2026-04-08 13:50:55

## Obiettivo
Correggere in modo definitivo la griglia della riga `Data / KM-Ore / Fornitore` nella tab `Nuova / Modifica` di `/next/manutenzioni`.

## File toccati
- `src/next/next-mappa-storico.css`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Modifiche applicate
- sostituita la distribuzione precedente con colonne esplicite `164px / 192px / minmax(340px, 1fr)`;
- mantenuto anche l'adattamento intermedio con `156px / 184px / minmax(280px, 1fr)`;
- aggiunti limiti coerenti alle prime due colonne per evitare che `KM/Ore` appaia strozzato o che `Fornitore` parta troppo presto.

## Non toccato
- JSX del form;
- logica dati;
- reader/writer;
- domain NEXT;
- routing;
- shape Firestore;
- `pdfEngine`;
- `src/pages/Manutenzioni.css`.

## Verifiche eseguite
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx`
- `npm run build`

## Esito
Fix mirato completato nel perimetro consentito. Modulo ancora `PARZIALE`: nessuna chiusura modulo o change funzionale.
