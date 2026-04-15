# Continuity Report - 2026-04-15 16:40:47

## Stato corrente
- `Archivista documenti` mantiene i rami visibili gia introdotti.
- Il ramo `Fattura / DDT + Manutenzione` usa ora solo backend OpenAI server-side dedicato.
- Il ramo `Fattura / DDT + Magazzino` non e stato modificato in questo task.

## File chiave
- `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `backend/internal-ai/server/internal-ai-document-extraction.js`

## Endpoint da ricordare
- `POST /internal-ai-backend/documents/manutenzione-analyze`

## Contratto utile lato frontend
- Input:
  - `fileName`
  - `mimeType`
  - `contentBase64`
  - `textExcerpt` opzionale
- Output utile in `data.analysis`:
  - `stato`
  - `tipoDocumento`
  - `fornitore`
  - `numeroDocumento`
  - `dataDocumento`
  - `totaleDocumento`
  - `targa`
  - `km`
  - `testo`
  - `riassuntoBreve`
  - `avvisi`
  - `campiMancanti`
  - `voci`

## Decisioni preservate
- Nessuna chat
- Nessuna scrittura business
- Nessuna archiviazione definitiva
- Nessuna modifica a `@costiMezzo`
- Nessuna modifica a `Magazzino`

## Prossimo passo naturale
- Collegare in task separato la review manutenzione ai soli passi utente espliciti di archiviazione/decisione business, senza riaprire il motore documentale appena corretto.
