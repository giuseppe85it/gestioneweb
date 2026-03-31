# BACKLOG - `IA Libretto`

- Modulo target: `IA Libretto`
- Route target:
  - `/next/ia/libretto`
- Stato iniziale: `NOT_STARTED`
- Stato finale: `CLOSED`
- Blocchi reali rilevati:
  - `src/next/NextIALibrettoPage.tsx` non usa piu `NextClonePageScaffold`, handoff IA, preview facade locale o `upsertNextFlottaClonePatch()`.
  - Il runtime ufficiale replica ora la grammatica pratica della madre su header, step, upload, analisi, risultati, archivio e viewer, ma blocca in modo esplicito le azioni scriventi.
  - Il nuovo reader `src/next/domain/nextIaLibrettoDomain.ts` legge il dataset reale `storage/@mezzi_aziendali` senza overlay clone-only.
  - Il modulo mantiene solo la preview locale del file selezionato come affordance UI, senza upload, save o patch lato clone.
- Path precisi:
  - `src/next/NextIALibrettoPage.tsx`
  - `src/next/domain/nextIaConfigDomain.ts`
  - `src/next/domain/nextIaLibrettoDomain.ts`
  - `src/pages/IA/IALibretto.tsx`
