# Change Report - `Acquisti / Ordini / Preventivi / Listino` loop fix

- Timestamp: `2026-03-31 09:30 Europe/Rome`
- Modulo: `Acquisti / Ordini / Preventivi / Listino`
- Route: `/next/acquisti`, `/next/ordini-in-attesa`, `/next/ordini-arrivati`, `/next/dettaglio-ordine/:ordineId`
- Obiettivo: chiudere il gruppo procurement come clone read-only fedele della madre, eliminando writer locali clone-only e leggendo `@ordini` senza overlay locali nel runtime ufficiale.

## File letti
- `src/next/NextProcurementStandalonePage.tsx`
- `src/next/NextProcurementReadOnlyPanel.tsx`
- `src/next/NextAcquistiPage.tsx`
- `src/next/NextOrdiniInAttesaPage.tsx`
- `src/next/NextOrdiniArrivatiPage.tsx`
- `src/next/NextDettaglioOrdinePage.tsx`
- `src/next/domain/nextProcurementDomain.ts`
- `src/pages/Acquisti.tsx`
- `src/pages/OrdiniInAttesa.tsx`
- `src/pages/OrdiniArrivati.tsx`
- `src/pages/DettaglioOrdine.tsx`
- `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`

## Patch applicate
- Riscritta `src/next/NextProcurementReadOnlyPanel.tsx` sulla stessa grammatica read-only della madre: header, tab, liste, dettaglio ordine e pannelli bloccati.
- Riscritto `src/next/NextProcurementStandalonePage.tsx` per leggere il gruppo direttamente dal reader D06 ufficiale con `includeCloneOverlays: false`, senza scaffold clone-only o snapshot globale.
- Riallineato `src/next/domain/nextProcurementDomain.ts` con opt-out ufficiale degli overlay clone-only e con motivazioni/limitazioni coerenti al ramo read-only madre-like.

## Verifiche eseguite
- `npx eslint src/next/NextProcurementStandalonePage.tsx src/next/NextProcurementReadOnlyPanel.tsx src/next/domain/nextProcurementDomain.ts`
- `npm run build`
- Audit separato in `docs/audit/AUDIT_acquisti-ordini-preventivi-listino_LOOP.md`

## Esito
- `Acquisti / Ordini / Preventivi / Listino` promosso a `CLOSED` nel tracker del loop.
- Prossimo modulo in ordine: `Lavori`.
