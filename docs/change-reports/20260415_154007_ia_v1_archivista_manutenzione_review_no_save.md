# Change Report

- Timestamp: `2026-04-15 15:40:07`
- Titolo: `IA V1 Archivista - review Manutenzione attiva senza salvataggi finali`
- Tipo task: `PATCH RUNTIME MIRATA`
- Rischio: `ELEVATO`

## Obiettivo
Rendere reale dentro `Archivista documenti` il ramo `Fattura / DDT + Manutenzione`, mantenendo separati `IA Report` e `Archivista`, senza introdurre archiviazione definitiva, scritture business, `@costiMezzo`, update mezzo o collegamenti automatici finali.

## File runtime toccati
- `src/next/NextIAArchivistaPage.tsx`
- `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx`
- `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx`
- `src/next/internal-ai/internal-ai.css`

## File documentali toccati
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `CONTEXT_CLAUDE.md`
- mirror aggiornati in `docs/fonti-pronte/`

## Cosa cambia davvero
- `Archivista documenti` mantiene la forma guidata non chat ma attiva davvero due soli rami V1:
  - `Fattura / DDT + Magazzino`
  - `Fattura / DDT + Manutenzione`
- Il nuovo `ArchivistaManutenzioneBridge.tsx` richiama il servizio reale `estrazioneDocumenti` e mostra una review manutenzione pulita con:
  - stato analisi
  - riassunto breve in italiano
  - dati estratti principali
  - righe trovate classificate in modo prudente come materiali/manodopera/ricambi/altro
  - avvisi
  - campi mancanti
  - callout espliciti `Documento analizzato`, `Non ancora archiviato`, `Nessuna manutenzione ancora creata`
- `ArchivistaMagazzinoBridge.tsx` resta il ramo preesistente e non viene rifatto; i testi distinguono meglio Magazzino dal nuovo ramo Manutenzione.
- `internal-ai.css` aggiunge solo lo styling necessario per review, callout, righe e badge manutenzione.

## Cosa non cambia
- Nessuna scrittura su `@manutenzioni`.
- Nessuna scrittura su `@documenti_*`.
- Nessuna scrittura su `@costiMezzo`.
- Nessun collegamento automatico al dossier.
- Nessun writer business nuovo.
- Nessuna modifica a backend, functions, api, rules o Magazzino profondo.
- Nessuna modifica a `cloneWriteBarrier.ts` in questo task.

## Verifiche eseguite
- `npx eslint src/next/NextIAArchivistaPage.tsx src/next/internal-ai/ArchivistaMagazzinoBridge.tsx src/next/internal-ai/ArchivistaManutenzioneBridge.tsx` -> `OK`
- `npx eslint src/next/internal-ai/internal-ai.css` -> warning noto `File ignored because no matching configuration was supplied`
- `npm run build` -> `OK`

## Stato onesto finale
- Separazione prodotto `IA Report` / `Archivista documenti`: `confermata`
- Ramo `Fattura / DDT + Magazzino`: `attivo`
- Ramo `Fattura / DDT + Manutenzione`: `attivo`
- `Documento mezzo` e `Preventivo + Magazzino`: `visibili ma non attivi`
- Archiviazione definitiva e azioni business Archivista: `non introdotte in questo step`
