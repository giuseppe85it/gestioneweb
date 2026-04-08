# Change Report - 2026-04-08 12:52:40

## Obiettivo
Correggere il tema base della pagina NEXT `/next/manutenzioni` portando a base chiara le superfici operative interne, lasciando invece shell esterna, tab e accenti sul tono scuro.

## File toccati
- `src/next/next-mappa-storico.css`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Modifiche applicate
- pannelli principali del form `Nuova / Modifica`, del `Dettaglio` e del `Quadro manutenzioni PDF` portati a base chiara;
- titoli, label, valori e contenuti interni portati a contrasto scuro;
- input, textarea, card materiali, placeholder foto e step filtri riallineati a una stessa superficie operativa chiara;
- mantenuti scuri shell esterna, tab principali, bottoni secondari e micro-accenti.

## Non toccato
- logica dati;
- reader/writer;
- domain NEXT;
- routing;
- shape Firestore;
- `pdfEngine`;
- upload foto e hotspot business;
- `src/pages/Manutenzioni.css`.

## Verifiche eseguite
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx`
- `npm run build`

## Esito
Fix visivo completato nel perimetro consentito. Modulo ancora `PARZIALE`: questo task corregge solo il bilanciamento tema chiaro/scuro e non chiude il modulo.
