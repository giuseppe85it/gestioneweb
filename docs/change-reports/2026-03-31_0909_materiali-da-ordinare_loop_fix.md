# Change Report - `Materiali da ordinare` loop fix

- Timestamp: `2026-03-31 09:09 Europe/Rome`
- Modulo: `Materiali da ordinare`
- Route: `/next/materiali-da-ordinare`
- Obiettivo: chiudere il modulo come clone read-only fedele della madre, eliminando simulazioni clone-only e leggendo i fornitori reali senza overlay locali.

## File letti
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `src/next/domain/nextFornitoriDomain.ts`
- `src/next/domain/nextProcurementDomain.ts`
- `src/pages/MaterialiDaOrdinare.tsx`
- `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`

## Patch applicate
- Riscritta `src/next/NextMaterialiDaOrdinarePage.tsx` su superficie madre, rimuovendo ordini clone-only, preventivi locali, editor locali e PDF clone-only.
- Esteso `src/next/domain/nextFornitoriDomain.ts` con `includeCloneOverlays: false` per la lettura ufficiale senza overlay.
- Riallineate le CTA scriventi a un blocco read-only esplicito senza cambiare la grammatica esterna della madre.

## Verifiche eseguite
- `npx eslint src/next/NextMaterialiDaOrdinarePage.tsx src/next/domain/nextFornitoriDomain.ts`
- `npm run build`
- Audit separato in `docs/audit/AUDIT_materiali-da-ordinare_LOOP.md`

## Esito
- `Materiali da ordinare` promosso a `CLOSED` nel tracker del loop.
- Prossimo modulo in ordine: `Acquisti / Ordini / Preventivi / Listino`.
