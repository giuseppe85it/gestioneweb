# BACKLOG - `IA Copertura Libretti`

- Modulo target: `IA Copertura Libretti`
- Route target:
  - `/next/ia/copertura-libretti`
- Stato iniziale: `NOT_STARTED`
- Stato finale: `CLOSED`
- Blocchi reali rilevati:
  - `src/next/NextIACoperturaLibrettiPage.tsx` era clone-specifica con `NextClonePageScaffold` e `upsertNextFlottaClonePatch()`.
  - Il runtime ufficiale applicava patch locali sulla flotta e apriva upload/riparazioni solo nel clone.
  - Il layer flotta NEXT non esponeva `librettoStoragePath`, quindi la parity sulla copertura libretti non era madre-like.
  - `src/next/nextAnagraficheFlottaDomain.ts` ora espone anche `librettoStoragePath` reale e la route ufficiale legge `@mezzi_aziendali` senza clone patch.
- Path precisi:
  - `src/next/NextIACoperturaLibrettiPage.tsx`
  - `src/next/nextAnagraficheFlottaDomain.ts`
  - `src/pages/IA/IACoperturaLibretti.tsx`
