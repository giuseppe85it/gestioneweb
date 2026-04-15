# Continuity Report

- Timestamp: `2026-04-15 15:40:07`
- Task: `IA V1 Archivista - ramo Manutenzione review attivo senza save`

## Punto di partenza
- Il repo aveva gia separato `IA Report` e `Archivista documenti`.
- Dentro Archivista era attivo davvero solo `Fattura / DDT + Magazzino`.
- Il solo trasporto consentito per l'analisi documentale su `/next/ia/archivista` era gia disponibile nel worktree tramite la deroga minima verso `estrazioneDocumenti`.

## Continuita garantita
- `IA Report` non viene toccata in profondita.
- `Archivista` resta non chat.
- Magazzino non viene rifatto e non degrada.
- Nessun writer business nuovo viene aperto.
- Nessuna modifica a `cloneWriteBarrier.ts`, backend, functions, api o rules.

## Nuovo stato verificato
- `/next/ia/archivista` attiva davvero due soli rami V1:
  - `Fattura / DDT + Magazzino`
  - `Fattura / DDT + Manutenzione`
- La review manutenzione resta interna ad Archivista e non espone la UI chat.
- Il ramo Manutenzione mostra stato analisi, dati principali, righe, avvisi, campi mancanti e callout di non salvataggio.
- `Documento mezzo` e `Preventivo + Magazzino` restano visibili ma fermi.

## File chiave da riaprire nel prossimo step
- `src/next/NextIAArchivistaPage.tsx`
- `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx`
- `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx`
- `src/next/internal-ai/internal-ai.css`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`

## Cosa resta fuori
- archiviazione definitiva del documento
- collegamento a manutenzione esistente
- creazione nuova manutenzione
- qualunque scrittura su `@manutenzioni`, `@documenti_*` o `@costiMezzo`
- qualunque modifica a `Documento mezzo` e `Preventivo + Magazzino`

## Verifiche eseguite
- `npx eslint src/next/NextIAArchivistaPage.tsx src/next/internal-ai/ArchivistaMagazzinoBridge.tsx src/next/internal-ai/ArchivistaManutenzioneBridge.tsx` -> `OK`
- `npm run build` -> `OK`
