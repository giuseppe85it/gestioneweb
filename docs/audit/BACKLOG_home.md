# BACKLOG home

- modulo target: `Home`
- stato iniziale: `FAIL`
- stato finale: `CLOSED`
- blocchi reali iniziali:
  - `src/next/components/NextHomeAutistiEventoModal.tsx` non replicava la superficie CTA madre del modal eventi;
  - `src/next/NextCentroControlloPage.tsx` non replicava placeholder e validazioni visibili madre nei tre modali data.
- path precisi:
  - `src/next/NextHomePage.tsx`
  - `src/next/NextCentroControlloPage.tsx`
  - `src/next/components/NextHomeAutistiEventoModal.tsx`
  - `src/next/domain/nextCentroControlloDomain.ts`
  - `src/pages/Home.tsx`
  - `src/components/AutistiEventoModal.tsx`
