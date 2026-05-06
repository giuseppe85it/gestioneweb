# REPORT BLOCCO 3 - 2026-05-06

## Esito
BLOCCO 3: PASS.

## Cancellli
- Cancello 1 AUDIT: PASS. Trovate le 9 entry boundary storage richieste e letti `allowedFields` / `forbiddenFields`.
- Cancello 2 PATCH: PASS. `REGISTRY_CONFIG_FASE_A` esteso a 14 entry; `view.config.ts` aggiornato; adapter instrada viste non-Driver360 al query engine.
- Cancello 3 TEST STATICI: PASS. `node --check` su registry, adapter e diagnostics; `npm run build` PASS.
- Cancello 4 BUILD: PASS. `npm run build` PASS.
- Cancello 5 TEST AUTOMATICI: PASS. `zero-invenzioni-tests.mjs` T1..T13 PASS.
- Cancello 6 PLAYWRIGHT: PASS. `tests/e2e/15-vehicle360.spec.ts` e `tests/e2e/16-site360-ricerca360.spec.ts`: 3 passed, 1 skipped/DEFERRED.
- Cancello 7 REPORT: PASS.

## File creati
- `tests/e2e/15-vehicle360.spec.ts`
- `tests/e2e/16-site360-ricerca360.spec.ts`

## File modificati nel blocco
- `backend/internal-ai/server/lib/registry.config.js`
- `src/next/chat-ia/config/view.config.ts`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `backend/internal-ai/server/lib/__diagnostics__/zero-invenzioni-tests.mjs`

## Nota ripresa C6
Durante il Cancello 6 e' stata necessaria una correzione stretta in `backend/internal-ai/server/internal-ai-adapter.js`: il modello poteva restituire `view: null` oppure `Driver360` con `entityKind: vehicle` per prompt sintetici Vehicle360. L'adapter ora usa i hint deterministici pre-LLM solo per riparare il routing verso le viste 360 non-Driver quando serve.

Per i casi `no_results`, l'adapter non allega `resolvedFilters.v2` quando `recordCount === 0`, per evitare rigetto del backend catalog validator su una struttura che la UI no-results non usa.

## Playwright
Comando:

```powershell
npx playwright test tests/e2e/15-vehicle360.spec.ts tests/e2e/16-site360-ricerca360.spec.ts
```

Esito:
- 3 passed.
- 1 skipped/DEFERRED: scenario Vehicle360 con targa runtime anonimizzata, per assenza di helper Node lato test basato su Firebase Admin. Nessuna targa reale hardcoded.

## DA VERIFICARE
- Fonte canonica cantiere per Site360 non identificata nel boundary attuale.
- Validazione completa di `resolvedFilters.v2` con record reali attraverso backend/frontend catalog validator: non coperta dal caso no-results del BLOCCO 3.
