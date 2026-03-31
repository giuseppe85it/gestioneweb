# BACKLOG centro-di-controllo

- modulo target: `Centro di Controllo`
- stato iniziale: `NOT_STARTED`
- stato finale: `CLOSED`
- blocchi reali iniziali:
  - `src/next/NextCentroControlloParityPage.tsx` leggeva il reader autisti D03 con overlay storage e clone locale attivi;
  - `src/next/NextCentroControlloParityPage.tsx` leggeva l'anagrafica flotta con clone patches attive;
  - `src/next/NextCentroControlloParityPage.tsx` mostrava le date in formato NEXT (`gg mm aaaa`) invece del formato madre del modulo (`dd/mm/yyyy`).
- path precisi:
  - `src/App.tsx`
  - `src/pages/CentroControllo.tsx`
  - `src/next/NextCentroControlloParityPage.tsx`
  - `src/next/domain/nextAutistiDomain.ts`
  - `src/next/domain/nextRifornimentiDomain.ts`
  - `src/next/nextAnagraficheFlottaDomain.ts`
