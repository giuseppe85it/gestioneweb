# Continuity Report - 2026-03-26 09:37

## Task
Prompt 20 - confine live-read backend IA

## Stato finale
`FATTO`

## Riassunto operativo
- Il verdetto binario del task e stato fissato: `live-read chiuso`.
- Il backend IA separato, l'orchestratore locale e la UI `/next/ia/interna` dichiarano ora in modo coerente che le fonti business attive sono solo clone/read model NEXT e snapshot read-only dedicate.
- Firestore e Storage restano solo boundary diagnostici documentati: nessun bridge live business viene aperto.

## File chiave da leggere per riprendere
- `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js`
- `backend/internal-ai/server/internal-ai-firebase-readiness.js`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `backend/internal-ai/server/internal-ai-repo-understanding.js`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiContracts.ts`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/2026-03-26_0937_confine-live-read-backend-ia.md`

## Verifiche da ripetere se si riapre questa area
- `npm --prefix backend/internal-ai run firebase-readiness`
- `npx eslint --no-error-on-unmatched-pattern src/next/internal-ai/*.ts src/next/NextInternalAiPage.tsx backend/internal-ai/server/*.js backend/internal-ai/*.js`
- `npm run build`
- smoke backend su `/internal-ai-backend/health` e `/internal-ai-backend/orchestrator/chat`
- smoke UI su `/next/ia/interna` con backend IA separato attivo

## Punti aperti veri
- Nessuna riapertura live e ammessa senza un task separato che introduca e verifichi un access layer backend dedicato.
- I candidati `allowedReads` restano solo documentazione di massimo perimetro futuro e non possono essere usati per suggerire che il live-read sia gia disponibile.
- Il clone resta utile e read-only, ma eventuali nuove superfici IA dovranno mantenere la stessa regola: niente overpromise su dati business live non dimostrati.
