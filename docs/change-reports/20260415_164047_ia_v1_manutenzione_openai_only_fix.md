# Change Report - 2026-04-15 16:40:47

## Titolo
- Fix OpenAI-only del ramo `Archivista` -> `Fattura / DDT + Manutenzione`

## Obiettivo
- Rimuovere dal ramo Manutenzione l'uso di `estrazioneDocumenti` e delle pipeline legacy/Gemini.
- Mantenere invariata la review utente gia costruita.
- Non aprire writer business, archiviazione definitiva o collegamenti automatici.

## Perimetro runtime
- `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `backend/internal-ai/server/internal-ai-document-extraction.js`

## Cosa cambia davvero
- Il bridge frontend non chiama piu la cloud function legacy e usa il backend IA separato locale.
- Il backend espone un endpoint dedicato `documents.manutenzione-analyze`.
- L'estrazione documentale supporta ora un profilo `manutenzione` distinto da `magazzino`.
- Per il ramo Manutenzione il provider OpenAI e obbligatorio: niente fallback a callable legacy o Gemini.
- Il payload restituito alla review contiene:
  - `riassuntoBreve`
  - `targa`
  - `fornitore`
  - `dataDocumento`
  - `totaleDocumento`
  - `km`
  - `voci`
  - `avvisi`
  - `campiMancanti`

## Boundary preservati
- Nessuna modifica a `ArchivistaMagazzinoBridge.tsx`
- Nessuna modifica a `cloneWriteBarrier.ts`
- Nessuna scrittura business nuova
- Nessuna archiviazione definitiva
- Nessuna creazione o update manutenzione
- Nessun intervento sulla madre

## Verifiche eseguite
- `npx eslint src/next/internal-ai/ArchivistaManutenzioneBridge.tsx backend/internal-ai/server/internal-ai-adapter.js backend/internal-ai/server/internal-ai-document-extraction.js` -> `OK`
- `npm run build` -> `OK`

## Rischi residui
- Il ramo Manutenzione dipende dal backend IA separato con `OPENAI_API_KEY` configurata.
- La capability resta `PARZIALE` finche non verranno implementati i passi successivi di archiviazione/decisione business, esclusi da questa patch.
