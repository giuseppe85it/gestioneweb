# Change Report - Archivista Manutenzione multipagina + step 2 manutenzione

**Data:** 2026-04-21  
**Tipo:** patch runtime cross-layer

## Obiettivo

Estendere solo il ramo `Fattura / DDT + Manutenzione` di Archivista con tre cambi coordinati:
- backend OpenAI `manutenzione-analyze` capace di ricevere piu pagine come documento logico unico;
- bridge frontend Archivista con input multi-file e step 2 opzionale che crea il record `@manutenzioni`;
- barrier clone aggiornato per consentire al writer canonico manutenzioni di operare da `/next/ia/archivista`.

## File toccati

| File | Modifica |
|------|---------|
| `backend/internal-ai/server/internal-ai-adapter.js` | route `documents.manutenzione-analyze` con `pages[]` opzionale |
| `backend/internal-ai/server/internal-ai-document-extraction.js` | `runProviderBinaryExtraction()` multi-input e forwarding `pages[]` nell'extractor condiviso |
| `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx` | input multi-file, anteprime multiple, archive file combinato, step 2 creazione manutenzione |
| `src/utils/cloneWriteBarrier.ts` | deroga `storageSync.setItemSync` su `@manutenzioni`, `@inventario`, `@materialiconsegnati` per `/next/ia/archivista` |
| `docs/STATO_ATTUALE_PROGETTO.md` | stato progetto aggiornato |
| `docs/product/STATO_MIGRAZIONE_NEXT.md` | stato migrazione aggiornato |
| `docs/product/REGISTRO_MODIFICHE_CLONE.md` | nuova voce di registro |
| `CONTEXT_CLAUDE.md` | contesto sintetico aggiornato |
| `docs/fonti-pronte/*` | mirror riallineati |

## Modifiche reali

### Backend
- `manutenzione-analyze` legge ora `pages[]` dal body solo se presente e non vuoto.
- La validazione single-file resta invariata quando `pages[]` non esiste.
- `extractInternalAiDocumentAnalysis()` ora riceve e inoltra `pages[]` solo per questo ramo.
- `runProviderBinaryExtraction()` costruisce un array di `input_image` / `input_file` quando `args.pages[]` esiste; in assenza di `pages[]` continua a usare il path storico a file singolo.
- Le route `documento-mezzo-analyze`, `preventivo-magazzino-analyze` e gli altri call site condivisi non sono stati modificati.

### Frontend Archivista
- `ArchivistaManutenzioneBridge.tsx` passa da `selectedFile` a `selectedFiles[]`.
- L'upload accetta ora selezione multipla.
- La preview mostra tutte le pagine selezionate con selezione pagina attiva e rimozione singola.
- In analisi:
  - `1 file` -> payload identico a prima;
  - `>1 file` -> payload `pages[]` verso il backend OpenAI locale.
- In archiviazione:
  - `1 file` -> originale invariato;
  - `>1 file` -> il bridge combina le pagine in un PDF locale unico e archivia quel PDF come originale del documento logico.
- Dopo `Conferma e archivia` compare lo step 2 `Crea manutenzione da questa fattura?`.

### Step 2 manutenzione
- Il form e precompilato con:
  - `targa`
  - `data`
  - `tipo`
  - `sottotipo`
  - `fornitore` con label `Officina`
  - `eseguito`
  - `km`
  - `descrizione`
  - `importo`
  - `materiali` derivati da `analysis.voci[]`
  - `sourceDocumentId` nascosto, valorizzato con `archiveResult.archiveId`
- Le righe classificate `Manodopera` sono deselezionate di default.
- `Salva manutenzione` chiama solo `saveNextManutenzioneBusinessRecord()` avvolto in `runWithCloneWriteScopedAllowance("internal_ai_magazzino_inline_magazzino", ...)`.

### Barrier
- La whitelist Archivista include ora anche:
  - `@manutenzioni`
  - `@inventario`
  - `@materialiconsegnati`
- Nessun'altra eccezione e stata aperta.

## Verifiche tecniche

- `node --check backend/internal-ai/server/internal-ai-adapter.js` -> `OK`
- `node --check backend/internal-ai/server/internal-ai-document-extraction.js` -> `OK`
- `npx eslint src/next/internal-ai/ArchivistaManutenzioneBridge.tsx src/utils/cloneWriteBarrier.ts` -> `OK` con warning noto `baseline-browser-mapping`
- `npm run build` -> vedi esito finale del task

## Stato onesto

- Patch runtime: completata nel perimetro richiesto.
- Verifica browser end-to-end con documento reale multi-pagina e comparsa record in `/next/manutenzioni`: `DA VERIFICARE`.
