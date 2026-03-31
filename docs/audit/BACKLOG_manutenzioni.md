# BACKLOG Manutenzioni

- Modulo target: `Manutenzioni`
- Route ufficiale NEXT:
  - `/next/manutenzioni`
- Stato iniziale: `NOT_STARTED`
- Stato finale: `CLOSED`
- Blocchi reali riscontrati:
  - `RISOLTO` `src/next/NextManutenzioniPage.tsx` non usa piu `NextClonePageScaffold` e replica la superficie pratica della madre su form, storico, materiali, modal gomme e CTA principali.
  - `RISOLTO` la route ufficiale legge `@manutenzioni` e `@mezzi_aziendali` tramite `readNextManutenzioniWorkspaceSnapshot()` e `@inventario` tramite `readNextInventarioSnapshot({ includeCloneOverlays: false })`.
  - `RISOLTO` salvataggio manutenzione, delete, PDF e conferma modal gomme restano visibili ma bloccano il comportamento con messaggi read-only espliciti; non esiste piu alcun percorso ufficiale che scriva su `@manutenzioni`, `@inventario` o `@materialiconsegnati`.
- Path precisi:
  - `src/next/NextManutenzioniPage.tsx`
  - `src/next/domain/nextManutenzioniDomain.ts`
  - `src/next/domain/nextInventarioDomain.ts`
  - `src/next/domain/nextMaterialiMovimentiDomain.ts`
  - `src/pages/Manutenzioni.tsx`
  - `src/pages/ModalGomme.tsx`
