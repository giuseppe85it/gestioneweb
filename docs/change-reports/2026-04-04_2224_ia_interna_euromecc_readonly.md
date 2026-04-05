# Change Report - IA interna Euromecc read-only

- Data: 2026-04-04
- Ambito: `src/next/internal-ai/*`, documentazione IA/NEXT
- Obiettivo: esporre i dati Euromecc alla chat libera `/next/ia/interna` in sola lettura.

## Patch runtime
- creato `src/next/internal-ai/internalAiEuromeccReadonly.ts` come retriever/read-model dedicato;
- aggiornato `src/next/internal-ai/internalAiChatOrchestratorBridge.ts` per servire i prompt Euromecc con snapshot read-only spiegabile;
- aggiornati `src/next/internal-ai/internalAiUniversalContracts.ts` e `src/next/internal-ai/internalAiUniversalRequestResolver.ts` per censire `Euromecc` nel planner universale.

## Boundary preservato
- nessun writer Euromecc richiamato;
- nessuna modifica a route, shell, sidebar o UI Euromecc;
- nessun riuso runtime di moduli IA legacy;
- nessuna modifica a `firebase.json` o `firestore.rules`.

## Verifiche
- `node_modules\\.bin\\eslint.cmd src/next/internal-ai/internalAiEuromeccReadonly.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiUniversalContracts.ts src/next/internal-ai/internalAiUniversalRequestResolver.ts` -> OK
- `npm run build` -> OK
- runtime locale `/next/ia/interna` -> OK su prompt Euromecc read-only
