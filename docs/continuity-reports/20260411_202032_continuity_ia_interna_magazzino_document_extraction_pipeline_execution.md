# Continuity Report - IA interna Magazzino document extraction pipeline

Data: 2026-04-11  
Task: pipeline documentale reale per review `Magazzino`

## Cosa e stato fatto
- introdotta una pipeline server-side dedicata per leggere PDF e immagini nel backend IA separato;
- aggiunto il payload `documentAnalysis` sugli allegati IA con header documento, warning e righe materiali strutturate;
- aggiornati router e handoff per usare i dati estratti reali invece di basarsi solo su filename/excerpt;
- riallineata la review full screen per mostrare campi e righe realmente estratti.

## File runtime/backend chiave
- `backend/internal-ai/server/internal-ai-document-extraction.js`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `backend/internal-ai/server/internal-ai-chat-attachments.js`
- `src/next/internal-ai/internalAiDocumentAnalysis.ts`
- `src/next/internal-ai/internalAiUniversalDocumentRouter.ts`
- `src/next/internal-ai/internalAiUniversalHandoff.ts`
- `src/next/NextInternalAiPage.tsx`

## Comportamento runtime attuale
- il backend distingue almeno `pdf_text`, `pdf_scan` e `image_document`;
- quando trova dati solidi produce header documento e righe materiali strutturate;
- la review full screen mostra:
  - tipo documento
  - fornitore
  - numero/data
  - destinatario se presente
  - imponibile/IVA/totale se presenti
  - righe materiali con descrizione, codice, quantita, unita, prezzo, totale;
- `AdBlue`, `preventivo` e `documento ambiguo` usano ora il routing corretto a runtime.

## Verifiche gia eseguite
- `npx eslint ...` sui file toccati -> OK
- `npm run build` -> OK
- runtime verificato su `/next/ia/interna` con 4 fixture:
  - materiali `Mariba`
  - fattura `AdBlue`
  - preventivo
  - ambiguo
- in tutti i casi la review risulta full screen reale (`1440x960` sui fixture di smoke) e mostra il contenuto atteso.

## Rischi residui
- documenti reali piu sporchi, multi-pagina o con OCR debole vanno ancora rivalidati;
- la pipeline PDF locale su Windows segnala ancora warning sui font standard `pdfjs-dist`, senza bloccare l'estrazione ma con bisogno di audit dedicato;
- nessun writer business nuovo e stato aperto in questo task.

## Prossimo punto sensato
- audit separato su DDT/fatture/preventivi reali non sintetici, includendo scansioni difficili, PDF pesanti e coerenza tra estrazione, routing e suggerimento utente finale.
