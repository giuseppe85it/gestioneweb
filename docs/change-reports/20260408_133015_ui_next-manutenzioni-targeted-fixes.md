# Change Report - 2026-04-08 13:30:15

## Obiettivo
Correggere 4 problemi reali della pagina NEXT `/next/manutenzioni`: base nera troppo dominante, griglia errata di `Data / KM-Ore / Fornitore`, confusione visiva tra card materiali e area foto, autosuggest materiali con fornitore troppo prominente.

## File toccati
- `src/next/NextManutenzioniPage.tsx`
- `src/next/next-mappa-storico.css`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Modifiche applicate
- il contenuto operativo dei tab e stato reso piu continuo su base chiara, riducendo l'effetto di card chiare isolate in grandi fasce nere;
- la riga `Data / KM-Ore / Fornitore` e stata portata su una griglia desktop stabile con proporzioni piu corrette;
- la sezione `Componenti inclusi / materiali` e stata mantenuta focalizzata su materiali/componenti, separando meglio l'area foto sottostante;
- l'autosuggest inventario mostra ora la descrizione materiale come voce principale e il fornitore come meta secondaria.

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
Patch mirata completata nel perimetro consentito. Il modulo resta `PARZIALE`: questo task corregge difetti visivi/locali e non costituisce chiusura modulo.
