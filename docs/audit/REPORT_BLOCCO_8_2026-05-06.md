# REPORT BLOCCO 8 - 2026-05-06

## Stato Blocco

- BLOCCO 8: PASS.
- CANCELLO 0: PASS precedente.
- CANCELLO 1: PASS precedente.
- CANCELLO 2: PASS precedente.
- CANCELLO 3: PASS precedente + conferma syntax/build in questo fix.
- CANCELLO 4: PASS.
- CANCELLO 5: PASS.
- CANCELLO 6: PASS.
- CANCELLO 7: PASS.

## File Toccati

- `backend/internal-ai/server/lib/catalog-validator.js`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `tests/e2e/17-euromecc360.spec.ts`
- `tests/e2e/18-documenti-cisterna.spec.ts`
- `tests/e2e/19-relazioni.spec.ts`
- `tests/e2e/20-proof-panel.spec.ts`
- `tests/e2e/21-chat-ia-smoke.spec.ts`
- `tests/e2e/helpers/chatHelpers.ts`
- `docs/audit/REPORT_BLOCCO_8_C6_FIX_2026-05-06.md`
- `docs/audit/REPORT_BLOCCO_8_2026-05-06.md`
- `docs/audit/REPORT_ZERO_INVENZIONI_TESTS_2026-05-04.md` aggiornato dal comando diagnostics.

## Test e Build

- `node --check backend/internal-ai/server/lib/catalog-validator.js`: PASS.
- `node --check backend/internal-ai/server/internal-ai-adapter.js`: PASS.
- `npm run build`: PASS.
- `npm run chat-ia:diagnostics`: PASS, T1..T28 PASS.
- `node backend/internal-ai/server/lib/__diagnostics__/shadow-validation-report.mjs`: PASS, readiness `PRONTO TECNICAMENTE`.
- Playwright mirato BLOCCO 8 C6: PASS, 10/10.

Comando Playwright eseguito:

```powershell
npx playwright test tests/e2e/17-euromecc360.spec.ts tests/e2e/18-documenti-cisterna.spec.ts tests/e2e/19-relazioni.spec.ts tests/e2e/20-proof-panel.spec.ts tests/e2e/21-chat-ia-smoke.spec.ts
```

## DA VERIFICARE residui

Conteggio residuo nel piano: 22 occorrenze `DA VERIFICARE`.

Lista sintetica:

- esistenza `src/next/chat-ia/views/driver360.css`;
- alias progettuali `Refueling360`, `Maintenance360`, `Search360` rispetto alla `ViewEnum` reale;
- ordinamento default `updatedAt desc` per entry boundary;
- fonte canonica cantiere per `Site360`;
- priorita precisa delle 9 entry storage aggiunte;
- root documentali e root Cisterna parallele alle vecchie entry `storage/@documenti_*`;
- allowedFields root documentali da confermare sui writer reali;
- comando PowerShell/grep per writer reali da normalizzare;
- proiezione CommonJS `relation.config.cjs`;
- chiamanti residui `driverRelationResolver.ts` da confermare prima di rimozione definitiva;
- script `chat-ia:diagnostics` gia presente ma segnato come verifica storica nel piano;
- promozione Registro/SPEC condizionata: non eseguita per residui aperti.

## Cosa resta fuori v1.1

Da `docs/product/SPEC_MOTORE_GENERICO_NEXT.md` paragrafi 11 e 12:

- PDF da template;
- smantellamento multi-agente;
- decisione estensione `periodPreset` su tutte le viste;
- caching letture `collection_root`;
- consolidamento futuro UI dedicata/UI generica;
- promozione Registro/SPEC a v1.0 STABLE dopo audit senza residui bloccanti.

## Stato Finale

Chat IA NEXT operativa parziale controllata. Vedi lista `DA VERIFICARE` residui e test DEFERRED.

