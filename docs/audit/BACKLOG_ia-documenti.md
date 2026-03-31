# BACKLOG - `IA Documenti`

- Modulo target: `IA Documenti`
- Route target:
  - `/next/ia/documenti`
- Stato iniziale: `NOT_STARTED`
- Stato finale: `CLOSED`
- Blocchi reali rilevati:
  - `src/next/NextIADocumentiPage.tsx` era ancora clone-specifica con `NextClonePageScaffold`, preview legacy, handoff dedicato e writer clone-only.
  - Il runtime ufficiale usava `upsertNextInternalAiCloneDocumento()` e `upsertNextInventarioCloneRecord()` per salvare documenti/materiali solo nel clone.
  - L'archivio ufficiale mescolava preview locali e documenti clone-only, falsando la parity con la madre.
  - Il nuovo reader `readNextIADocumentiArchiveSnapshot({ includeCloneDocuments: false })` legge ora solo `@documenti_mezzi`, `@documenti_magazzino` e `@documenti_generici` reali.
- Path precisi:
  - `src/next/NextIADocumentiPage.tsx`
  - `src/next/domain/nextDocumentiCostiDomain.ts`
  - `src/next/domain/nextIaConfigDomain.ts`
  - `src/next/nextAnagraficheFlottaDomain.ts`
  - `src/pages/IA/IADocumenti.tsx`
