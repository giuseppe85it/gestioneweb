# Change Report

- Timestamp: `2026-04-15 15:19:53`
- Titolo: `IA V1 Archivista - riuso ramo Magazzino senza refactor largo`
- Tipo task: `PATCH RUNTIME MIRATA`
- Rischio: `ELEVATO`

## Obiettivo
Rendere reale dentro `Archivista documenti` il solo ramo `Fattura / DDT + Magazzino`, mantenendo separati `IA Report` e `IA 2`, senza introdurre writer business nuovi e senza rifare Magazzino.

## File runtime toccati
- `src/next/NextIAArchivistaPage.tsx`
- `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx`
- `src/next/internal-ai/internal-ai.css`
- `src/utils/cloneWriteBarrier.ts`

## File documentali toccati
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `CONTEXT_CLAUDE.md`
- mirror aggiornati in `docs/fonti-pronte/`

## Cosa cambia davvero
- `Archivista documenti` mantiene la forma guidata non chat ma attiva davvero solo `Fattura / DDT + Magazzino`.
- Il nuovo `ArchivistaMagazzinoBridge.tsx` richiama il servizio reale `estrazioneDocumenti` e mostra review pulita con:
  - stato analisi
  - dati estratti principali
  - righe trovate
  - avvisi
- `Fattura / DDT + Manutenzione`, `Documento mezzo` e `Preventivo + Magazzino` restano visibili ma marcati `In arrivo`.
- `Preventivo + Manutenzione` resta fuori V1.
- `cloneWriteBarrier.ts` apre solo l'eccezione minima gia esistente anche per `/next/ia/archivista`, limitata al `POST` verso `estrazioneDocumenti`.

## Cosa non cambia
- Nessun writer business nuovo.
- Nessun salvataggio automatico.
- Nessun handoff nuovo.
- Nessuna modifica a backend, functions, api o rules.
- Nessun refactor di `NextMagazzinoPage.tsx`.

## Verifiche eseguite
- `npx eslint src/next/NextIAArchivistaPage.tsx src/next/internal-ai/ArchivistaMagazzinoBridge.tsx src/utils/cloneWriteBarrier.ts` -> `OK`
- `npx eslint src/next/internal-ai/internal-ai.css` -> warning noto `File ignored because no matching configuration was supplied`
- `npm run build` -> `OK`

## Stato onesto finale
- Separazione prodotto `IA Report` / `Archivista documenti`: `confermata`
- Primo ramo reale Archivista `Fattura / DDT + Magazzino`: `attivo`
- Altri rami V1: `visibili ma non attivi`
- Salvataggi business Archivista: `non introdotti in questo step`
