# CHANGE REPORT - Euromecc: documenti originali + lista ricambi → ordine

## Data
- 2026-04-09

## Tipo task
- UI / scrittura / integrazione Storage + @ordini

## Obiettivo
- Feature A: upload PDF/immagine relazione su Firebase Storage al momento della conferma; link "Apri documento" nello storico.
- Feature B: selettore tipo documento (Relazione / Lista ricambi); flusso AI lista ricambi; writer ordine su @ordini; badge ordine nello storico.

## File modificati
- `src/next/NextEuromeccPage.tsx`
- `src/utils/cloneWriteBarrier.ts`
- `storage.rules`
- `src/next/next-euromecc.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `CONTEXT_CLAUDE.md`

## Riassunto modifiche

### `NextEuromeccPage.tsx`
- Import aggiunto: `doc, getDoc, setDoc` da `firebase/firestore`; `ref, uploadBytes, getDownloadURL` da `firebase/storage`; `storage` da `../firebase`; `assertCloneWriteAllowed` da `../utils/cloneWriteBarrier`; `type Ordine` da `../types/ordini`.
- `EuromeccRelazioneDoc`: aggiunti campi opzionali `fileUrl`, `fileStoragePath`, `fileSize`, `ordineId`, `ordineMateriali`.
- Nuovi tipi: `RicambiAiItem`, `RicambiAiPayload`.
- `RelazioniTabState`: aggiunti campi `documentoTipo: "relazione" | "ricambi"` e `ricambiPayload: RicambiAiPayload | null`.
- `RelazioniUpload`: aggiunto prop `onDocumentoTipoChange` e radio buttons tipo documento.
- `RelazioneStoricoItem`: aggiunta div `.eur-relazioni-storico-item-actions` con link "Apri documento" e badge ordine.
- Nuovo componente `RicambiReviewUI`: UI review lista ricambi con checkboxes, campi editabili, selezione fornitore/data, bottone "Crea ordine in Materiali da ordinare".
- `RelazioniTab`: aggiunto stato locale `ricambiFornitore`, `ricambiDataOrdine`; `handleAnalyze` branchia su `documentoTipo`; aggiunta funzione `handleCreaOrdineRicambiAndSave`; `handleConferma` aggiunge upload Storage + include `fileUrl/fileStoragePath/fileSize` nel doc Firestore; reset state aggiornato con nuovi campi; JSX aggiorna `RelazioniUpload` con `onDocumentoTipoChange` e aggiunge branch `RicambiReviewUI`.

### `cloneWriteBarrier.ts`
- Blocco Euromecc: aggiunto check `storage.uploadBytes` per path `euromecc/relazioni/`.
- Blocco Euromecc: aggiunto check `storageSync.setItemSync` per key `@ordini`.

### `storage.rules`
- Aggiunta regola: `match /euromecc/relazioni/{relazioneId}/{fileName} { allow read, write: if request.auth != null; }`

### `next-euromecc.css`
- Aggiunto `.eur-mini-badge--ok`.
- Aggiunto `.eur-btn`, `.eur-btn--ghost`, `.eur-btn--sm`.
- Aggiunto `.eur-relazioni-storico-item-actions`.
- Aggiunto `.eur-relazioni-tipo-selector`.
- Aggiunto classi `.eur-ricambi-*` per RicambiReviewUI.
- Aggiunto `.eur-btn-ghost-sm`.

## File extra richiesti
- NESSUNO

## Impatti attesi
- Solo tab Relazioni di `/next/euromecc` cambia funzionalmente.
- Il flusso Relazione di manutenzione esistente rimane invariato (upload Storage aggiunto silenziosamente).
- Ordini creati da lista ricambi sono visibili in `/next/materiali-da-ordinare`.

## Rischio modifica
- NORMALE

## Moduli impattati
- `NEXT Euromecc` (tab Relazioni)
- `NEXT Materiali da ordinare` (lettura passiva @ordini, nuovi ordini appaiono)

## Contratti dati toccati?
- SI — `EuromeccRelazioneDoc` esteso con campi opzionali (retrocompatibile).
- SI — `@ordini` riceve nuovi ordini con campo extra opzionale `euromeccRelazioneId` (retrocompatibile).

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- Euromecc (tab Relazioni) + Materiali da ordinare (passivo)

## Stato migrazione prima
- IMPORTATO CON SCRITTURA (Relazioni: upload + conferma Firestore)

## Stato migrazione dopo
- IMPORTATO CON SCRITTURA (Relazioni: Feature A Storage + Feature B lista ricambi → ordine)

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO (aggiornamento minore)

## Rischi / attenzione
- Upload Storage silenzioso: se fallisce, la relazione viene salvata comunque senza fileUrl.
- `assertCloneWriteAllowed("storageSync.setItemSync", { key: "@ordini" })` viene chiamato esplicitamente prima del `setDoc` diretto su Firestore (il writer non usa storageSync ma la deroga barrier usa questo kind per coerenza con la spec).
- Verifica runtime visiva DA VERIFICARE in ambiente live.

## Build/Test eseguiti
- `npm run build` -> OK, zero errori TypeScript
- Warning Vite chunk size pre-esistenti, non introdotti da questo task

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
