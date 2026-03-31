# AUDIT LOOP - `Capo Mezzi`

- Timestamp audit: `2026-03-31 10:23 Europe/Rome`
- Modulo: `Capo Mezzi`
- Route verificata:
  - `/next/capo/mezzi`
- Fonti runtime verificate:
  - `src/next/NextCapoMezziPage.tsx`
  - `src/next/domain/nextCapoDomain.ts`
  - `src/next/domain/nextDocumentiCostiDomain.ts`
  - `src/pages/CapoMezzi.tsx`

## Verifiche

- Route ufficiale NEXT autonoma:
  - `PASS`
  - `/next/capo/mezzi` monta `NextCapoMezziPage`, non `NextMotherPage` o `src/pages/CapoMezzi.tsx`.

- UI pratica madre-like:
  - `PASS`
  - Header, campo ricerca, gruppi per categoria, card mezzo, metriche costo/potenziale e navigazione al dettaglio restano coerenti con la madre.

- Dati reali della madre:
  - `PASS`
  - `NextCapoMezziPage` usa `readNextCapoMezziSnapshot({ includeCloneDocuments: false })`.
  - `nextCapoDomain` usa quindi il layer costi/documenti senza documenti clone-only locali nel runtime ufficiale.

- Scritture reali e clone-only:
  - `PASS`
  - Il modulo resta di sola lettura e non espone writer locali o business.
  - Il click sulle card apre solo il dettaglio costi NEXT.

- Lint e build:
  - `PASS`
  - `npx eslint src/next/NextCapoMezziPage.tsx src/next/domain/nextCapoDomain.ts src/next/domain/nextDocumentiCostiDomain.ts`
  - `npm run build`

## Esito audit

- Verdetto: `PASS`
- Stato modulo nel tracker: `CLOSED`
- Gap aperti nel perimetro `Capo Mezzi`: nessuno
- Prossimo modulo del loop: `Capo Costi`
