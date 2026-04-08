# Change Report - 2026-04-08 14:11

## Obiettivo
Correggere solo la resa della riga `Data / KM-Ore / Fornitore` nella tab NEXT `Nuova / Modifica` del modulo `Manutenzioni`, aumentando anche lo stacco visivo della card `Mezzo attivo`.

## File toccati
- `src/next/next-mappa-storico.css`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Modifica applicata
- griglia `man2-field-row3--metric` portata a colonne piu sbilanciate a favore di `Fornitore`;
- gap reale aumentato tra i tre campi;
- limiti massimi delle prime due colonne ridotti per evitare effetto di campi attaccati;
- `man2-screen-context` con piu stacco verticale dal blocco sottostante.

## Impatto
- Solo UI/CSS.
- Nessun impatto su logica dati, routing, Firestore, salvataggio, PDF, foto o dettaglio.

## Verifiche eseguite
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx`
- `npm run build`
