# BACKLOG - `Fornitori`

- Modulo target: `Fornitori`
- Route target:
  - `/next/fornitori`
- Stato iniziale: `NOT_STARTED`
- Stato finale: `CLOSED`
- Blocchi reali rilevati e chiusi:
  - `src/next/NextFornitoriPage.tsx` esponeva ancora aggiunta, modifica ed eliminazione clone-only tramite `upsertNextFornitoreCloneRecord()` e `markNextFornitoreCloneDeleted()`.
  - Il runtime ufficiale leggeva `readNextFornitoriSnapshot()` con overlay clone-only ancora abilitati.
  - La parity reale era falsata da messaggi di salvataggio locale del clone su una superficie che doveva restare madre-like `read-only`.
- Path precisi:
  - `src/next/NextFornitoriPage.tsx`
  - `src/next/domain/nextFornitoriDomain.ts`
  - `src/pages/Fornitori.tsx`
  - `src/App.tsx`
