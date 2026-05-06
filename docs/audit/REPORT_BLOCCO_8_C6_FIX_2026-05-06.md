# REPORT BLOCCO 8 C6 FIX - 2026-05-06

## Stato

- BLOCCO 8 C6: PASS.
- BLOCCO 8 C7: eseguito dopo PASS C6.
- Backend IA riavviato prima del Playwright mirato.

## Patch

- `backend/internal-ai/server/lib/catalog-validator.js`
  - Allineata la validazione a `resolvedFilters.v2`.
  - `resolvedFilters.version`, `resolvedFilters.entries` e payload strutturati v2 restano ammessi se coerenti.
  - `descrizione` e' ammessa come campo business certificato dentro record v2.
  - Restano bloccati URL firmati o URL-like, token, segreti, contatti, note e campi raw non ammessi.
- `backend/internal-ai/server/internal-ai-adapter.js`
  - Routing intent naturale corretto per dare priorita al prompt originale quando il modello riduce `filters.searchText`.
  - `ricerca <testo>` resta instradata a `Ricerca360`.
  - Fallback `error_view_unavailable` senza vista e senza intent catalogato normalizzato a `error_intent_not_in_catalog`.
- `tests/e2e/20-proof-panel.spec.ts`
  - Driver360 attende stato runtime pronto.
  - Driver360 e Vehicle360 usano dati runtime con relazione certificabile.
  - Proof panel richiesto solo dove esiste dato/prova certificata; Site360/Euromecc360/Ricerca360 accettano empty/no_results pulito.
- `tests/e2e/21-chat-ia-smoke.spec.ts`
  - Smoke su Driver360 e Vehicle360 usa dati runtime con relazione certificabile.
  - Driver360 attende stato pronto.
  - Fallback fuori catalogo resta parametrico e senza testo libero non certificato.

## Verifiche

- `node --check backend/internal-ai/server/lib/catalog-validator.js`: PASS.
- `node --check backend/internal-ai/server/internal-ai-adapter.js`: PASS.
- `npm run build`: PASS.
- `npm run chat-ia:diagnostics`: PASS, T1..T28 PASS.
- `node backend/internal-ai/server/lib/__diagnostics__/shadow-validation-report.mjs`: PASS, readiness `PRONTO TECNICAMENTE`.
- `npx playwright test tests/e2e/17-euromecc360.spec.ts tests/e2e/18-documenti-cisterna.spec.ts tests/e2e/19-relazioni.spec.ts tests/e2e/20-proof-panel.spec.ts tests/e2e/21-chat-ia-smoke.spec.ts`: PASS, 10/10.

## Note

- `internal-ai-adapter.js` e' stato modificato perche' il fallback residuo non dipendeva piu' dal validator: il modello poteva perdere il token `ricerca` nei filtri e restituire fallback vista non disponibile per input fuori catalogo.
- `src/next/chat-ia/config/view.config.ts` non e' stato modificato.
- Boundary readonly, query-engine, relation-resolver, Firestore e Storage non sono stati modificati.

