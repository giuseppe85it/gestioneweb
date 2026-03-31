# BACKLOG - `Cisterna Schede Test`

- Modulo target: `Cisterna Schede Test`
- Route target:
  - `/next/cisterna/schede-test`
- Stato iniziale: `NOT_STARTED`
- Stato finale: `CLOSED`
- Blocchi reali rilevati e chiusi:
  - `src/next/NextCisternaSchedeTestPage.tsx` usava `NextClonePageScaffold`, `upsertNextCisternaCloneScheda()` e conferme di salvataggio locale del clone.
  - Il runtime ufficiale esponeva ancora estrazione IA simulata e salvataggi clone-only che falsavano la parity con la madre.
  - `src/pages/CisternaCaravate/CisternaSchedeTest.tsx` restava piu ampia su crop, calibrazione, estrazione IA, edit mode, modal e conferma finale; il gap e stato riallineato mantenendo la UI madre ma bloccando sotto ogni side effect.
  - `readNextCisternaSchedaDetail()` passava ancora da `readSchede()` con overlay clone abilitati di default; il reader ufficiale ora puo leggere il dettaglio senza overlay clone-only.
- Path precisi:
  - `src/next/NextCisternaSchedeTestPage.tsx`
  - `src/next/domain/nextCisternaDomain.ts`
  - `src/pages/CisternaCaravate/CisternaSchedeTest.tsx`
  - `src/App.tsx`
