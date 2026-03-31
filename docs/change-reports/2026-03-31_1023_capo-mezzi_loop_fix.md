# Change Report - `Capo Mezzi` loop fix

- Timestamp: `2026-03-31 10:23 Europe/Rome`
- Modulo: `Capo Mezzi`
- Route: `/next/capo/mezzi`
- Obiettivo: chiudere `Capo Mezzi` come clone read-only fedele della madre, eliminando documenti clone-only dal riepilogo costi del runtime ufficiale.

## File letti
- `src/next/NextCapoMezziPage.tsx`
- `src/next/domain/nextCapoDomain.ts`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/pages/CapoMezzi.tsx`
- `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`

## Patch applicate
- Aggiornato `src/next/domain/nextDocumentiCostiDomain.ts` con un flag opzionale `includeCloneDocuments`.
- Aggiornato `src/next/domain/nextCapoDomain.ts` per usare il reader costi/documenti senza documenti clone-only nel modulo ufficiale `Capo Mezzi`.
- Aggiornato `src/next/NextCapoMezziPage.tsx` per leggere `readNextCapoMezziSnapshot({ includeCloneDocuments: false })`.

## Verifiche eseguite
- `npx eslint src/next/NextCapoMezziPage.tsx src/next/domain/nextCapoDomain.ts src/next/domain/nextDocumentiCostiDomain.ts`
- `npm run build`
- Audit separato in `docs/audit/AUDIT_capo-mezzi_LOOP.md`

## Esito
- `Capo Mezzi` promosso a `CLOSED` nel tracker del loop.
- Prossimo modulo in ordine: `Capo Costi`.
