# Change Report

Data: 2026-04-14  
Tipo task: audit documentale repo-only  
Runtime patch: nessuna

## Obiettivo
Produrre una mappa unica e leggibile della IA interna reale `/next/ia/interna`, basata solo sul codice vero del repo, con focus su:
- entrate reali
- flusso singolo vs multi-file
- modali / view / review state
- routing / handoff
- CSS
- duplicazioni e codice morto
- primo punto di divergenza reale

## File creati
- `docs/audit/AUDIT_IA_INTERNA_MAPPA_REALE_FLUSSI_MODALI.md`
- `docs/change-reports/20260414_182700_audit_ia_interna_mappa_reale_flussi_modali.md`
- `docs/continuity-reports/20260414_182700_continuity_audit_ia_interna_mappa_reale_flussi_modali.md`

## File letti
- `src/next/NextInternalAiPage.tsx`
- `src/pages/IA/IADocumenti.tsx`
- `src/next/internal-ai/internalAiChatAttachmentsClient.ts`
- `src/next/internal-ai/internalAiDocumentAnalysis.ts`
- `src/next/internal-ai/internalAiUniversalDocumentRouter.ts`
- `src/next/internal-ai/internalAiUniversalHandoff.ts`
- `src/next/internal-ai/internalAiUniversalOrchestrator.ts`
- `src/next/strumenti/pendingMergeStore.ts`
- `src/next/NextStrumentiUnisciDocumentiPage.tsx`
- `src/next/internal-ai/internal-ai.css`
- `src/App.tsx`
- ricerca mirata su `src/next/NextIADocumentiPage.tsx`
- documentazione obbligatoria indicata dal task

## Esito
- Audit completato senza patch runtime.
- Punto chiave verificato: il caso singolo usa ancora `useIADocumentiEngine()` e la Cloud Function `estrazioneDocumenti`, mentre il multi-file devia prima nel ramo chat/orchestrator e costruisce il modello `Documento logico unificato`.
- Punto chiave verificato: nel ramo multi-file `Tipo atteso` non entra nel contratto dell'orchestratore; i segnali materiali/fattura del router possono quindi vincere e produrre `Apri in Magazzino`.
- Runtime locale non verificato in Playwright per `ERR_CONNECTION_REFUSED` su `http://127.0.0.1:4174/next/ia/interna`.

## Impatto
- Solo documentazione audit/report.
- Nessuna modifica applicativa.
