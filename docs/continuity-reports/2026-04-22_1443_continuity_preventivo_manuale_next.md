# Continuity Report — Preventivo manuale NEXT

## Scope
- Nuova capability runtime nel tab NEXT `Prezzi & Preventivi` di `/next/materiali-da-ordinare`.

## Continuita preservata
- la madre `src/pages/Acquisti.tsx` resta intoccata;
- shape `Preventivo`, `PreventivoRiga`, `ListinoVoce`, `Valuta` invariata;
- nessun domain NEXT esistente modificato;
- nessun CSS nuovo introdotto.

## Continuita dati
- il preventivo manuale salva su `storage/@preventivi` con la stessa shape base della madre:
  - `pdfUrl: null`
  - `pdfStoragePath: null`
  - `imageStoragePaths` / `imageUrls` opzionali
  - `righe` senza `codiceArticolo`
- il listino viene aggiornato in `storage/@listino_prezzi` con la stessa grammatica madre del ramo default:
  - match via `listinoKey`
  - `trend` / `deltaAbs` / `deltaPct` da `computeTrend`
  - `trend: "new"` per nuove voci
  - `updatedAt` usato anche per il sort finale discendente

## Deviazione valuta autorizzata
- la valuta non viene aggiunta a `Preventivo` o `PreventivoRiga`;
- la valuta del form viene trasportata solo nel flusso di upsert listino;
- `upsertListinoFromPreventivoManuale(preventivo, valuta, codiciArticoloPerRiga)` e il punto esplicito in cui la deviazione viene applicata.

## Continuita barrier
- nessun widening fuori da `/next/materiali-da-ordinare`;
- nessun `kind` nuovo oltre:
  - `firestore.setDoc`
  - `storage.uploadBytes`
- nessun target nuovo oltre:
  - `storage/@preventivi`
  - `storage/@listino_prezzi`
  - `preventivi/manuali/`

## Verifiche eseguite
- `npx eslint src/next/NextPreventivoManualeModal.tsx src/next/nextPreventivoManualeWriter.ts src/next/NextProcurementConvergedSection.tsx src/next/NextMaterialiDaOrdinarePage.tsx src/utils/cloneWriteBarrier.ts` -> `OK`
- `npm run build` -> `OK`

## Da verificare
- apertura live del modale da browser locale;
- validazione runtime dei campi obbligatori;
- scrittura reale di un record `Preventivo` solo immagini/nessun PDF;
- aggiornamento automatico del tab dopo il salvataggio;
- assenza di `[CLONE_NO_WRITE]` nel flusso end-to-end.
