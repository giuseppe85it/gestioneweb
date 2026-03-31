# BACKLOG - `Colleghi`

- Modulo target: `Colleghi`
- Route target:
  - `/next/colleghi`
- Stato iniziale: `NOT_STARTED`
- Stato finale: `CLOSED`
- Blocchi reali rilevati e chiusi:
  - `src/next/NextColleghiPage.tsx` esponeva ancora aggiunta, modifica ed eliminazione clone-only tramite `upsertNextCollegaCloneRecord()` e `markNextCollegaCloneDeleted()`.
  - Il runtime ufficiale mescolava ancora overlay locali del clone al dataset reale leggendo `readNextColleghiSnapshot()` senza disattivare il merge clone-only.
  - La parity esterna era falsata da notice di salvataggio locale del clone su una superficie che doveva restare fedele alla madre ma `read-only`.
- Path precisi:
  - `src/next/NextColleghiPage.tsx`
  - `src/next/domain/nextColleghiDomain.ts`
  - `src/pages/Colleghi.tsx`
  - `src/App.tsx`
