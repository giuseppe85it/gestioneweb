# Change Report — Preventivo manuale NEXT

## Timestamp
- `2026-04-22_1443`

## Obiettivo
- Implementare nel tab NEXT `Prezzi & Preventivi` il flusso `Preventivo manuale` con salvataggio reale su `storage/@preventivi`, aggiornamento reale di `storage/@listino_prezzi`, foto opzionali su Storage e refresh del tab dopo il salvataggio.

## File toccati
- `src/utils/cloneWriteBarrier.ts`
- `src/next/NextProcurementConvergedSection.tsx`
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `src/next/NextPreventivoManualeModal.tsx`
- `src/next/nextPreventivoManualeWriter.ts`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Modifiche reali
- aggiunto il pulsante `PREVENTIVO MANUALE` nel tab `/next/materiali-da-ordinare?tab=preventivi`;
- creato il modale operativo `NextPreventivoManualeModal` con:
  - select fornitore;
  - numero/data preventivo precompilati;
  - select valuta `CHF / EUR`;
  - righe articolo dinamiche;
  - upload foto multiplo con preview e rimozione;
  - validazione inline;
- creato `nextPreventivoManualeWriter.ts` con:
  - replica byte-per-byte di `normalizeDescrizione`, `normalizeUnita`, `normalizeArticoloCanonico`, `computeTrend`, `listinoKey`, `sanitizeUndefinedToNull`, `asStringArray`, `generaId`;
  - `saveNextPreventivoManuale(...)`;
  - `upsertListinoFromPreventivoManuale(...)`;
  - `saveAndUpsert(...)`;
- `NextMaterialiDaOrdinarePage.tsx` ricarica lo snapshot procurement dopo il salvataggio tramite `onPreventivoSaved`;
- `cloneWriteBarrier.ts` consente ora solo il minimo necessario al nuovo flusso sul pathname `/next/materiali-da-ordinare`.

## Deviazione valuta autorizzata
- il record `Preventivo` persistito in `storage/@preventivi` NON contiene `valuta`;
- la valuta selezionata nel modale resta parametro locale del flusso e viene passata esplicitamente a `upsertListinoFromPreventivoManuale(preventivo, valuta, codiciArticoloPerRiga)`;
- `ListinoVoce.valuta` resta il solo punto persistente dove la valuta viene salvata.

## Barrier aggiunto
- `firestore.setDoc` su `storage/@preventivi`
- `firestore.setDoc` su `storage/@listino_prezzi`
- `storage.uploadBytes` su path con prefisso `preventivi/manuali/`

## Verifiche tecniche
- `npx eslint src/next/NextPreventivoManualeModal.tsx src/next/nextPreventivoManualeWriter.ts src/next/NextProcurementConvergedSection.tsx src/next/NextMaterialiDaOrdinarePage.tsx src/utils/cloneWriteBarrier.ts` -> `OK`
- `npm run build` -> `OK`

## Stato onesto
- Patch runtime `COMPLETATA` lato codice.
- Verifica browser end-to-end del salvataggio reale su dataset live: `DA VERIFICARE`.

## Rischi residui
- il browser MCP non era disponibile in questa sessione, quindi non e stato possibile certificare in chat:
  - apertura modale;
  - validazione live;
  - scrittura reale Firestore/Storage;
  - refresh tab post-salvataggio;
- il worktree contiene modifiche pregresse fuori perimetro non toccate da questa patch.
