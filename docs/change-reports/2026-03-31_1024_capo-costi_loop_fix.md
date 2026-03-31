# Change Report - `Capo Costi` loop fix

- Timestamp: `2026-03-31 10:24 Europe/Rome`
- Modulo: `Capo Costi`
- Route: `/next/capo/costi/:targa`
- Obiettivo: chiudere `Capo Costi` come clone read-only fedele della madre, eliminando overlay locali su approvazioni e documenti e bloccando i side effect clone-only.

## File letti
- `src/next/NextCapoCostiMezzoPage.tsx`
- `src/next/domain/nextCapoDomain.ts`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/pages/CapoCostiMezzo.tsx`
- `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`

## Patch applicate
- Aggiornato `src/next/domain/nextCapoDomain.ts` con un flag opzionale `includeCloneApprovals` per escludere gli stati clone-only dal runtime ufficiale.
- Riusato il nuovo flag `includeCloneDocuments` del layer costi/documenti anche sul dettaglio `Capo Costi`.
- Aggiornato `src/next/NextCapoCostiMezzoPage.tsx` per leggere solo dati reali e lasciare `APPROVA`, `RIFIUTA`, `DA VALUTARE` e `ANTEPRIMA TIMBRATO` come facciata read-only esplicita.

## Verifiche eseguite
- `npx eslint src/next/NextCapoCostiMezzoPage.tsx src/next/domain/nextCapoDomain.ts src/next/domain/nextDocumentiCostiDomain.ts`
- `npm run build`
- Audit separato in `docs/audit/AUDIT_capo-costi_LOOP.md`

## Esito
- `Capo Costi` promosso a `CLOSED` nel tracker del loop.
- Prossimo modulo in ordine: `IA Home`.
