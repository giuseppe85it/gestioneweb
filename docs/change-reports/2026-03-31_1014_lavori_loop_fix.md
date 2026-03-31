# Change Report - `Lavori` loop fix

- Timestamp: `2026-03-31 10:14 Europe/Rome`
- Modulo: `Lavori`
- Route: `/next/lavori-da-eseguire`, `/next/lavori-in-attesa`, `/next/lavori-eseguiti`, `/next/dettagliolavori/:lavoroId`
- Obiettivo: chiudere il modulo `Lavori` come clone read-only fedele della madre, eliminando writer e overlay clone-only dal runtime ufficiale.

## File letti
- `src/next/NextLavoriDaEseguirePage.tsx`
- `src/next/NextLavoriInAttesaPage.tsx`
- `src/next/NextLavoriEseguitiPage.tsx`
- `src/next/NextDettaglioLavoroPage.tsx`
- `src/next/domain/nextLavoriDomain.ts`
- `src/pages/LavoriDaEseguire.tsx`
- `src/pages/LavoriInAttesa.tsx`
- `src/pages/LavoriEseguiti.tsx`
- `src/pages/DettaglioLavoro.tsx`
- `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`

## Patch applicate
- Riscritta `src/next/NextLavoriDaEseguirePage.tsx` sulla stessa grammatica della madre: form, urgenze, suggerimenti e CTA visibili, con blocco read-only sotto.
- Riscritte `src/next/NextLavoriInAttesaPage.tsx` e `src/next/NextLavoriEseguitiPage.tsx` per riallineare accordion, ricerca targa, anteprima PDF e navigazione dettaglio alla superficie madre.
- Riscritta `src/next/NextDettaglioLavoroPage.tsx` per ripristinare cards, pulsanti e modali madre-like, bloccando edit/esecuzione/delete in modo read-only esplicito.
- Riallineato `src/next/domain/nextLavoriDomain.ts` con opt-out ufficiale degli overlay clone-only tramite `includeCloneOverlays: false`.

## Verifiche eseguite
- `npx eslint src/next/NextLavoriDaEseguirePage.tsx src/next/NextLavoriInAttesaPage.tsx src/next/NextLavoriEseguitiPage.tsx src/next/NextDettaglioLavoroPage.tsx src/next/domain/nextLavoriDomain.ts`
- `npm run build`
- Audit separato in `docs/audit/AUDIT_lavori_LOOP.md`

## Esito
- `Lavori` promosso a `CLOSED` nel tracker del loop.
- Prossimo modulo in ordine: `Capo Mezzi`.
