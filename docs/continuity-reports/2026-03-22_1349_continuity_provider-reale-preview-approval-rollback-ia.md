# Continuity Report - 2026-03-22 13:49

## Stato raggiunto
- Il backend IA separato supporta ora un primo provider reale solo lato server.
- Il primo workflow reale `preview/approval/reject/rollback` e attivo ma confinato agli artifact IA dedicati.
- La UI `/next/ia/interna*` usa questo workflow solo per la sintesi guidata del report attivo.

## File chiave
- `backend/internal-ai/server/internal-ai-adapter.js`
- `backend/internal-ai/server/internal-ai-persistence.js`
- `backend/internal-ai/src/internalAiServerPersistenceContracts.ts`
- `src/next/internal-ai/internalAiServerReportSummaryClient.ts`
- `src/next/NextInternalAiPage.tsx`

## Come riprendere il lavoro
1. Verificare se il runtime server-side dispone di `OPENAI_API_KEY`.
2. Avviare `npm run internal-ai-backend:start`.
3. Controllare `GET /internal-ai-backend/health`.
4. Aprire `/next/ia/interna`, generare un report e usare `Genera sintesi IA server-side`.
5. Se la chiave non e presente, aspettarsi `provider_not_configured` e fallback/mock-safe.

## Prossimi passi sensati
1. Dimostrare end-to-end la chiamata reale al provider in un ambiente con `OPENAI_API_KEY` server-side.
2. Estendere lo stesso workflow reale ad altri artifact preview-first gia sicuri.
3. Decidere se la chat debba diventare il secondo caso d'uso reale del provider o se convenga prima estendere le sintesi guidate.
4. Definire policy/auth server-side prima di qualunque futuro step che si avvicini a scritture business.

## Vincoli ancora attivi
- Nessuna scrittura Firestore/Storage business.
- Nessun segreto lato client.
- Nessun riuso runtime IA legacy come backend canonico.
- Nessuna applicazione automatica su codice o dati business.
