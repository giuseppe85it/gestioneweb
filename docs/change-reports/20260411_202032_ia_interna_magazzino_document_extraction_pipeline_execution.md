# Change Report - IA interna Magazzino document extraction pipeline

Data: 2026-04-11  
Tipo: execution runtime NEXT + backend IA separato + documentazione  
Rischio: ELEVATO

## Obiettivo
Rendere la review documento full screen della IA interna `Magazzino` basata su estrazione documentale reale e strutturata, non piu solo su classificazione o metadata deboli, migliorando:
- distinzione PDF testo / PDF scansione / immagine documento;
- estrazione header documento;
- ricostruzione righe materiali;
- handoff verso review full screen e router documentale.

## File runtime/backend toccati
- `backend/internal-ai/server/internal-ai-document-extraction.js`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `backend/internal-ai/server/internal-ai-chat-attachments.js`
- `src/next/internal-ai/internalAiTypes.ts`
- `src/next/internal-ai/internalAiDocumentAnalysis.ts`
- `src/next/internal-ai/internalAiChatAttachmentsClient.ts`
- `src/next/internal-ai/internalAiUniversalEntityResolver.ts`
- `src/next/internal-ai/internalAiUniversalDocumentRouter.ts`
- `src/next/internal-ai/internalAiUniversalTypes.ts`
- `src/next/internal-ai/internalAiUniversalOrchestrator.ts`
- `src/next/internal-ai/internalAiUniversalHandoff.ts`
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internal-ai.css`

## File documentali toccati
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `CONTEXT_CLAUDE.md`
- mirror corrispondenti in `docs/fonti-pronte/`

## Modifiche runtime e backend
1. Pipeline server-side dedicata
- introdotto `internal-ai-document-extraction.js` nel backend IA separato;
- distinzione esplicita tra:
  - `pdf_text`
  - `pdf_scan`
  - `image_document`
  - fallback prudenziali aggiuntivi;
- parsing PDF locale con `pdfjs-dist` quando il testo e disponibile;
- uso del provider OpenAI solo lato server per estrazione strutturata su PDF scansione e immagini.

2. Payload documentale strutturato
- ogni allegato puo ora portare `documentAnalysis` con:
  - stato estrazione
  - tipo sorgente
  - tipo documento
  - fornitore
  - numero documento
  - data documento
  - destinatario
  - imponibile / IVA / totale
  - note importanti
  - righe materiali strutturate.
- le righe espongono almeno:
  - `descrizione`
  - `quantita`
  - `unita`
  - `prezzoUnitario`
  - `totaleRiga`
  - `codiceArticolo`
  - `confidence`
  - `warnings`.

3. Router e handoff IA
- `internalAiUniversalDocumentRouter.ts` usa ora i dati estratti reali per distinguere meglio:
  - fattura materiali `Magazzino`
  - fattura `AdBlue`
  - preventivo fornitore
  - documento ambiguo;
- corretto il misrouting emerso a runtime:
  - `AdBlue` non cade piu nel procurement;
  - `preventivo` non cade piu nel flusso fatture materiali;
  - il caso ambiguo torna alla inbox documentale invece di sembrare una fattura materiali.
- `internalAiUniversalHandoff.ts` costruisce prefill e normalized data usando header/righe estratte vere.

4. Review full screen
- `NextInternalAiPage.tsx` consuma ora `righeMaterialiJson` e i campi estratti reali;
- la tabella materiali mostra codice articolo e prezzi/totali;
- rimossi in UI i label generici spurii (`Fornitore`, `Materiale`) quando non rappresentano match reali;
- filtrati anche campi secondari incoerenti come `Targa` non strutturata.

## Comportamento finale
- Fattura materiali `Magazzino`: review piena con header documento e righe reali.
- Fattura `AdBlue`: review piena con fornitore, numero, quantita `lt`, prezzo unitario e proposta coerente `Carica stock AdBlue`.
- Preventivo: review piena con intestazione, due righe materiali e instradamento corretto a procurement.
- Documento ambiguo: solo i dati davvero trovati, nessuna riga inventata, stato `DA VERIFICARE`.

## Vincoli rispettati
- madre legacy non toccata;
- nessun nuovo writer business;
- nessuna modifica a `src/pages/*`;
- nessuna apertura della barrier oltre il perimetro gia esistente;
- nessuna inventiva sui match o sui campi mancanti.

## Verifiche
- `npx eslint src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiDocumentAnalysis.ts src/next/internal-ai/internalAiChatAttachmentsClient.ts src/next/internal-ai/internalAiUniversalEntityResolver.ts src/next/internal-ai/internalAiUniversalDocumentRouter.ts src/next/internal-ai/internalAiUniversalTypes.ts src/next/internal-ai/internalAiUniversalOrchestrator.ts src/next/internal-ai/internalAiUniversalHandoff.ts src/next/NextInternalAiPage.tsx backend/internal-ai/server/internal-ai-document-extraction.js backend/internal-ai/server/internal-ai-chat-attachments.js backend/internal-ai/server/internal-ai-adapter.js` -> OK
- `npm run build` -> OK
- runtime verificato su `/next/ia/interna` con review full screen realmente aperta e matching atteso per:
  - `tmp-runtime-materiali.png`
  - `tmp-runtime-adblue.pdf`
  - `tmp-runtime-preventivo.pdf`
  - `tmp-runtime-ambiguo.pdf`

## Esito
Patch completata: la review documento `Magazzino` usa ora una pipeline documentale vera, con header e righe strutturate ricostruite nel backend IA separato e propagate fino alla UI NEXT.  
Restano `DA VERIFICARE` i casi reali piu sporchi: multi-page irregolari, OCR debole, PDF pesanti e warning PDF font-side su Windows.
