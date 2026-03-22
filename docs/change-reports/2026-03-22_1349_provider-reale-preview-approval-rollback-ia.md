# Change Report - 2026-03-22 13:49

## Titolo
Primo provider reale server-side e primo workflow preview/approval/rollback del sottosistema IA interna

## Obiettivo
Aprire il primo collegamento a un provider reale lato server per la nuova IA interna e introdurre un workflow reale ma controllato di preview, approvazione, rifiuto e rollback, senza scritture business automatiche.

## Perimetro
- `backend/internal-ai/*`
- `src/next/internal-ai/*`
- `src/next/NextInternalAiPage.tsx`
- documentazione IA/NEXT/stato progetto

## Scelta tecnica
- Provider scelto: `OpenAI`
- API scelta: `Responses API`
- Modello di default: `gpt-5-mini`
- Segreto ammesso: solo `OPENAI_API_KEY` lato server
- Caso d'uso iniziale: sintesi guidata del report attivo gia letto nel clone

## Modifiche principali
- Esteso l'adapter `backend/internal-ai/server/internal-ai-adapter.js` con:
  - health aggiornato sul provider server-side;
  - endpoint `artifacts.preview` per generare o leggere preview IA dedicate;
  - endpoint `approvals.prepare` per approvare, respingere o fare rollback su workflow IA dedicati.
- Estesa la persistenza server-side in `backend/internal-ai/server/internal-ai-persistence.js` con `ai_preview_workflows.json`.
- Estesi i contratti server-side in `backend/internal-ai/src/internalAiServerPersistenceContracts.ts`.
- Aggiunto il client frontend `src/next/internal-ai/internalAiServerReportSummaryClient.ts`.
- Integrata la UI in `src/next/NextInternalAiPage.tsx` con:
  - pulsante `Genera sintesi IA server-side`;
  - card della preview testuale;
  - azioni `Approva preview`, `Respinge preview`, `Esegui rollback`.
- Aggiornati note/contratti in `src/next/internal-ai/internalAiContracts.ts`, `backend/internal-ai/src/internalAiBackendContracts.ts`, `backend/internal-ai/src/internalAiBackendService.ts`, `backend/internal-ai/README.md`.

## Dati e sicurezza
- Nessuna scrittura Firestore/Storage business.
- Nessun segreto lato client.
- Nessun backend legacy reso canonico.
- Il provider lavora solo su contesto report gia letto e strutturato nel clone.
- Approval e rollback agiscono solo sul workflow IA dedicato.

## Verifiche
- `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiServerReportSummaryClient.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendService.ts backend/internal-ai/src/internalAiServerPersistenceContracts.ts` -> OK
- `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK
- smoke test `GET /internal-ai-backend/health` -> OK
- smoke test `POST /internal-ai-backend/artifacts/preview` senza chiave -> `provider_not_configured`
- smoke test `approve_preview` + `rollback_preview` su workflow IA dedicato -> OK
- `npm run build` -> OK

## Limiti residui
- Nel runner attuale `OPENAI_API_KEY` non e configurata: la chiamata reale al provider resta pronta ma non dimostrata end-to-end.
- Il primo workflow reale copre solo sintesi testuali di report gia letti.
- Chat reale, OCR, upload, parsing documentale, retrieval business completo e writer business restano fuori perimetro.
