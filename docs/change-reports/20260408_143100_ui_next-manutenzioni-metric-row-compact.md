# Change Report - 2026-04-08 14:31

## Obiettivo
Ricompattare la riga `Data / KM-Ore / Fornitore` nella tab NEXT `Nuova / Modifica` del modulo `Manutenzioni`, eliminando i tre contenitori alti introdotti in precedenza.

## File toccati
- `src/next/NextManutenzioniPage.tsx`
- `src/next/next-mappa-storico.css`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Modifica applicata
- rimossi i wrapper-card dei tre campi;
- introdotta una sola riga compatta `man2-metric-row`;
- mantenuti tre field-group distinti con proporzioni `180px / 180px / 1fr`;
- ridotta l'altezza complessiva del blocco e aumentato leggermente lo stacco di `Mezzo attivo`.

## Impatto
- Solo JSX/CSS locale.
- Nessun impatto su logica dati, salvataggio, PDF, foto, dettaglio o routing.

## Verifiche eseguite
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx`
- `npm run build`
