# CONTINUITY REPORT - Euromecc: documenti originali + lista ricambi → ordine

## Data
- 2026-04-09

## Contesto
- PROMPT33 su `/next/euromecc` tab `Relazioni`.
- Spec vincolante: `docs/product/SPEC_EUROMECC_DOCUMENTI_ORIGINALI_LISTA_RICAMBI_ORDINE.md.md` (doppia estensione .md.md per typo nel filename).

## Cosa e stato fatto

### Feature A — Documento originale
- Upload in `handleConferma` su path `euromecc/relazioni/{relazioneId}/{timestamp}_{fileName}`.
- Campi `fileUrl`, `fileStoragePath`, `fileSize` inclusi nel `addDoc` su `euromecc_relazioni`.
- `RelazioneStoricoItem` aggiornato con div `eur-relazioni-storico-item-actions` + link "Apri documento" se `fileUrl` presente.
- Deroga barrier `storage.uploadBytes` per `euromecc/relazioni/`.
- Regola `storage.rules` aggiunta.

### Feature B — Lista ricambi → Ordine
- Selettore radio (Relazione / Lista ricambi) in `RelazioniUpload`.
- `handleAnalyze` branchia su `state.documentoTipo`: percorso ricambi usa prompt AI dedicato, produce `RicambiAiPayload`, imposta `state.ricambiPayload`.
- `RicambiReviewUI`: checkboxes, campi editabili descrizione/quantita, selezione fornitore/data ordine, bottone "Crea ordine".
- `handleCreaOrdineRicambiAndSave`: scrive ordine su `@ordini` (diretto setDoc Firestore, con `assertCloneWriteAllowed("storageSync.setItemSync", { key: "@ordini" })`), salva entry in `euromecc_relazioni` con `ordineId`/`ordineMateriali`, aggiorna storico.
- Deroga barrier `storageSync.setItemSync` per key `@ordini`.
- Badge "Ordine creato · N materiali" nello `RelazioneStoricoItem`.

## Cosa NON e stato implementato
- Nessuna feature esclusa dalla spec.

## Prossimo task potenziale
- Verifica runtime visiva Feature A e B in ambiente live.
- Fase futura: gestione cancellazione documento da Storage.

## Contraddizioni spec risolte
- Spec 3.7 dichiara deroga barrier `storageSync.setItemSync` per @ordini, ma spec 3.6 usa `setDoc` diretto (non storageSync). Risolto chiamando esplicitamente `assertCloneWriteAllowed("storageSync.setItemSync", { key: "@ordini" })` prima del `setDoc`, coerente con la deroga dichiarata.
- Spec non esplicita come il badge `ordineId` appaia in storico per il flusso ricambi (nessuna `EuromeccRelazioneDoc` creata). Risolto salvando entry minimale in `euromecc_relazioni` dopo la creazione ordine.

## File chiave
- `src/next/NextEuromeccPage.tsx` — Feature A e B
- `src/utils/cloneWriteBarrier.ts` — due nuove deroghe
- `storage.rules` — regola euromecc/relazioni
- `src/next/next-euromecc.css` — classi ricambi + btn + badge

## Stato build
- `npm run build` -> OK, zero errori TypeScript

## Rischi residui
- Verifica runtime visiva DA VERIFICARE in ambiente live.
- Upload Storage silenzioso: fallimento non blocca la conferma relazione.
