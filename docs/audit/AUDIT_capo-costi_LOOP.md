# AUDIT LOOP - `Capo Costi`

- Timestamp audit: `2026-03-31 10:24 Europe/Rome`
- Modulo: `Capo Costi`
- Route verificata:
  - `/next/capo/costi/:targa`
- Fonti runtime verificate:
  - `src/next/NextCapoCostiMezzoPage.tsx`
  - `src/next/domain/nextCapoDomain.ts`
  - `src/next/domain/nextDocumentiCostiDomain.ts`
  - `src/pages/CapoCostiMezzo.tsx`

## Verifiche

- Route ufficiale NEXT autonoma:
  - `PASS`
  - `/next/capo/costi/:targa` monta `NextCapoCostiMezzoPage`, non `NextMotherPage` o `src/pages/CapoCostiMezzo.tsx`.

- UI pratica madre-like:
  - `PASS`
  - Header, filtri mese/anno, KPI, sezione `Approvazione Preventivi`, tabs, lista documenti, anteprima PDF e bottoni `APPROVA` / `RIFIUTA` / `DA VALUTARE` restano coerenti con la madre.

- Dati reali della madre:
  - `PASS`
  - `NextCapoCostiMezzoPage` usa `readNextCapoCostiMezzoSnapshot(targa, { includeCloneApprovals: false, includeCloneDocuments: false })`.
  - Il runtime ufficiale legge quindi documenti e approvazioni reali senza overlay clone-only locali.

- Scritture reali e clone-only:
  - `PASS`
  - `APPROVA`, `RIFIUTA` e `DA VALUTARE` restano visibili ma bloccano il comportamento con messaggio read-only esplicito.
  - `ANTEPRIMA TIMBRATO` resta visibile ma non genera piu PDF timbrati clone-side.
  - Il runtime ufficiale non usa piu `upsertNextCapoCloneApproval()` e non aggiorna storage clone-only.

- Lint e build:
  - `PASS`
  - `npx eslint src/next/NextCapoCostiMezzoPage.tsx src/next/domain/nextCapoDomain.ts src/next/domain/nextDocumentiCostiDomain.ts`
  - `npm run build`

## Esito audit

- Verdetto: `PASS`
- Stato modulo nel tracker: `CLOSED`
- Gap aperti nel perimetro `Capo Costi`: nessuno
- Prossimo modulo del loop: `IA Home`
