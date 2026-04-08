# Change Report - 2026-04-08 13:42:10

## Obiettivo
Rimuovere completamente la gestione foto dalla tab `Nuova / Modifica` di `/next/manutenzioni`, lasciandola solo nel tab `Dettaglio`.

## File toccati
- `src/next/NextManutenzioniPage.tsx`
- `src/next/next-mappa-storico.css`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Modifiche applicate
- rimossa dal form tutta la UI foto: sezione `4 foto collegate al dettaglio`, placeholder, upload e preview;
- sostituita con una nota minima che indica `Le foto si gestiscono nella tab Dettaglio`;
- compattata la parte finale del form per arrivare piu rapidamente al blocco `Salva manutenzione`;
- lasciata invariata la gestione foto reale del tab `Dettaglio`.

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
Fix UI/UX completato nel perimetro consentito. Il modulo resta `PARZIALE` e la gestione foto continua a vivere solo nel tab `Dettaglio`.
