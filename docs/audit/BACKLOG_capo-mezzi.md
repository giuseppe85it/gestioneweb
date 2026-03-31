# BACKLOG - `Capo Mezzi`

- Modulo target: `Capo Mezzi`
- Route target:
  - `/next/capo/mezzi`
- Stato iniziale: `NOT_STARTED`
- Stato finale: `CLOSED`
- Blocchi reali rilevati:
  - `src/next/domain/nextCapoDomain.ts` costruiva il riepilogo costi del modulo usando `readNextDocumentiCostiFleetSnapshot()` con documenti clone-only locali inclusi di default.
  - `src/next/NextCapoMezziPage.tsx` non spegneva esplicitamente quel perimetro clone-only nel runtime ufficiale.
- Path precisi:
  - `src/next/NextCapoMezziPage.tsx`
  - `src/next/domain/nextCapoDomain.ts`
  - `src/next/domain/nextDocumentiCostiDomain.ts`
  - `src/pages/CapoMezzi.tsx`
