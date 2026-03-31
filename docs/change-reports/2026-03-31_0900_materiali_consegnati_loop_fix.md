# Change Report - `Materiali consegnati` loop fix

- Timestamp: `2026-03-31 09:00 Europe/Rome`
- Modulo: `Materiali consegnati`
- Route: `/next/materiali-consegnati`
- Obiettivo: chiudere il modulo come clone read-only fedele della madre, eliminando scritture e overlay clone-only dalla route ufficiale.

## File letti
- `src/next/NextMaterialiConsegnatiPage.tsx`
- `src/next/domain/nextMaterialiMovimentiDomain.ts`
- `src/pages/MaterialiConsegnati.tsx`
- `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`
- `docs/audit/AUDIT_GENERALE_TOTALE_NEXT_VS_MADRE.md`

## Patch applicate
- Riscritta `src/next/NextMaterialiConsegnatiPage.tsx` su superficie madre, mantenendo CTA, placeholder, validazioni visibili e PDF.
- Rimosso dal runtime ufficiale ogni uso di writer clone-only su consegne e stock locale.
- Esteso `src/next/domain/nextMaterialiMovimentiDomain.ts` con `includeCloneOverlays: false` per la lettura ufficiale senza overlay.

## Verifiche eseguite
- `npx eslint src/next/NextMaterialiConsegnatiPage.tsx src/next/domain/nextMaterialiMovimentiDomain.ts`
- `npm run build`
- Audit separato in `docs/audit/AUDIT_materiali_consegnati_LOOP.md`

## Esito
- `Materiali consegnati` promosso a `CLOSED` nel tracker del loop.
- Prossimo modulo in ordine: `Materiali da ordinare`.
