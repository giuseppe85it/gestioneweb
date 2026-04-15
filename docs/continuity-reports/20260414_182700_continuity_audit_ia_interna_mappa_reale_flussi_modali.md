# Continuity Report

Data: 2026-04-14  
Task: audit reale IA interna `/next/ia/interna`

## Cosa e stato fatto
- Creato il report `docs/audit/AUDIT_IA_INTERNA_MAPPA_REALE_FLUSSI_MODALI.md`.
- Verificata la catena reale:
  - card alta singolo file -> `useIADocumentiEngine().handleAnalyze()`
  - card alta multi-file -> `handleChatAttachmentSelection()` -> `orchestrateInternalAiUniversalRequest()`
  - router/handoff -> CTA e target come `Apri in Magazzino`
  - merge route -> `pendingMergeStore` -> ramo chat
  - query deep-link review -> riapertura storico

## Punti chiave emersi
- Il caso singolo e ancora il modello buono: un file, un `DocumentoAnalizzato`, campi separati, destinazione suggerita dopo estrazione.
- Il caso multi-file cambia modello prima dell'analisi shared: aggrega allegati e passa al router universale.
- `Tipo atteso` pesa solo nel ramo singolo; nel multi-file non viene passato all'orchestratore.
- `Documento logico unificato` nasce in `internalAiDocumentAnalysis.ts`.
- `Apri in Magazzino` nasce dal ramo `tabella_materiali` -> handoff `vistaTarget=documenti-costi`.

## Rischi residui
- Runtime non verificato in browser locale nel turno corrente: `ERR_CONNECTION_REFUSED` su `127.0.0.1:4174`.
- Produzione reale di `attachment.documentAnalysis` nei file allegati chat non chiusa in questo audit perimetro.
- Backing store concreto di `tracking.sessionState` non chiuso in questo audit perimetro.

## Prossimo task consigliato
- Patch separata, solo dopo approvazione, sui file gia elencati nel report:
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/internal-ai/internalAiUniversalDocumentRouter.ts`
  - `src/next/internal-ai/internalAiUniversalHandoff.ts`
  - `src/next/internal-ai/internalAiDocumentAnalysis.ts`
  - `src/next/internal-ai/internalAiUniversalOrchestrator.ts`
  - eventualmente `src/next/internal-ai/internalAiChatAttachmentsClient.ts`
  - preservando `src/pages/IA/IADocumenti.tsx` come modello corretto del caso singolo
