# Report Fix Lookup Vehicle360

## Stato
- Data esecuzione: 2026-05-07
- Prompt: FIX-LOOKUP-VEHICLE360-TARGHE-REALI rev. 2
- HEAD pre-patch: `0b9ee3b4`, discendente di `141ff762`
- Stato finale: LOOKUP TARGA VEHICLE360 CORRETTO

## Causa confermata
`matchesEntryRecord()` in `backend/internal-ai/server/lib/universal-resolver.js` filtrava solo `driver_name_or_badge_exact_token_match`.
Le strategie targa restavano equivalenti a `return true`, quindi il resolver applicava `.slice(0, maxReturned)` su record non filtrati.

## Patch
File modificati:
- `backend/internal-ai/server/lib/universal-resolver.js`
- `backend/internal-ai/server/lib/__diagnostics__/zero-invenzioni-tests.mjs`
- `tests/e2e/22-chat-ia-vehicle-lookup.spec.ts`
- `docs/audit/REPORT_ZERO_INVENZIONI_TESTS_2026-05-04.md` rigenerato da `npm run chat-ia:diagnostics`
- `docs/audit/REPORT_FIX_LOOKUP_VEHICLE360_2026-05-06.md`

`backend/internal-ai/server/lib/registry.config.js` non modificato: `maxReturnedVehicleRecords: 1` per `vehicles.mezziAziendali` resta valido perche' il filtro targa ora avviene prima del cap.

## MatchStrategy implementate
- `single_targa_exact_match`
- `vehicle_plate_exact_match`
- `material_or_vehicle_exact_match`
- `vehicle_or_site_exact_match`
- `driver_id_and_plate_exact_match`
- `driver_badge_or_id_and_plate_exact_match`
- `driver_badge_or_plate_exact_match`
- `confirmed_vehicle_change_exact_match`
- `tank_or_vehicle_exact_match`
- `vehicle_or_category_exact_match`
- `preventivo_or_plate_exact_match`

Il match targa estrae un token `AA000000`-like da `matchInput.searchText`, normalizza uppercase e confronta exact-match sui campi:
`targa`, `mezzoTarga`, `targaMotrice`, `targaRimorchio`, `targaCamion`, `targaMezzo`, `targetTarga`, `dopoMotrice`, `dopoRimorchio`.

Se il prompt non contiene un token targa, il comportamento resta invariato per non rompere i flussi certificati che leggono relazioni senza `searchText`.

## Prova filtro prima dello slice
- Il codice esegue ancora `.filter((raw) => matchesEntryRecord(...)).slice(0, maxReturned)`.
- T29 in `zero-invenzioni-tests.mjs` usa tre record sintetici: il record matching e' secondo, `maxReturned=1`, e il risultato e' comunque il secondo record.
- T29 verifica anche che `vehicle_plate_exact_match` con targa assente non restituisca record.

## Delta universal-resolver.js
- Righe aggiunte: 53
- Righe rimosse: 0
- Delta netto: +53
- Soglia prompt: massimo +120 righe nette

## Backend restart
- PID precedente fermato su `127.0.0.1:4310`: 97360
- PID processo start npm: 6692
- PID listener nuovo: 94848
- Script verificato: `internal-ai-backend:start`
- Conferma raggiungibilita': `/internal-ai-backend/chat/tool-use` risponde con HTTP 400 di validazione su body vuoto.
- Nota: `/internal-ai-backend/health` ha risposto HTTP 500, ma la route reale usata da `/next/chat-tool` e dai test e' raggiungibile.

## Verifiche automatiche
- Baseline pre-patch `npm run build`: PASS
- Baseline pre-patch `npm run chat-ia:diagnostics`: PASS T1..T28
- `node --check backend/internal-ai/server/lib/universal-resolver.js`: PASS
- `npm run build`: PASS
- `npm run chat-ia:diagnostics`: PASS T1..T29
- Playwright 17-21 primo run: exit 0, 9 passed + 1 flaky con retry PASS
- Playwright 17-21 rerun pulito: PASS 10/10
- Playwright 22 lookup Vehicle360: PASS 1/1

## Verifica manuale casi reali
Endpoint usato: `/internal-ai-backend/chat/tool-use`

| Targa | View | resolvedFilters | records mezzi | Match exact targa | Esito |
|---|---|---|---:|---|---|
| `TI298409` | `Vehicle360` | `resolvedFilters.v2` | 1 | si | PASS |
| `TI315407` | `Vehicle360` | `resolvedFilters.v2` | 1 | si | PASS |

## Verdetto
LOOKUP TARGA VEHICLE360 CORRETTO
