# Report Fix Bug Applicativi Residui
Data: 2026-04-30  
Esecuzione: 2026-05-01  
Auditor/Executor: Codex  
Perimetro: Prompt 65, bug B1-B6 chat IA NEXT

## Sommario
- Stato finale: PATCH COMPLETATA.
- Bug B1-B6: 6 fixati, 0 bloccati.
- Regressioni durante verifica: 1 flaky fuori lista (`movimenti materiali`) stabilizzato nel percorso deterministico agenti.
- Firestore: nessuna scrittura eseguita.
- Reader/domain: nessuna modifica.
- Madre/archivista/tool bloccati/ossatura registry: non toccati.
- Commit: nessun commit.

## Fix per bug
| Bug | Causa radice | Fix applicato | Verifica |
|---|---|---|---|
| B1 - Autista profilo operativo | Match attivita troppo letterale sul nome completo e output attivita sotto chiave non riconosciuta dal validatore fingerprint. | `toolGetDriverOperationalProfile.ts`: match per token/badge, `_id` stabili, `items` verificabili. | `verita calcolata 10`, `incrocio profilo operativo autista` PASS. |
| B2 - Documenti per targa | Filtro targa limitato a campi diretti e path documentali letti in modo non uniforme dai tool. | `toolSearchDocumentsAndInvoices.ts` e `toolGetDocumentCostsByVehicle.ts`: filtro targa su JSON completo, merge archive/fleet/snapshot, dedupe. | `incrocio documenti targa` PASS in 2.2s. |
| B3 - Timeline mezzo | Timeline senza `_id`, documenti/eventi non inclusi di default e array sotto chiave non validata. | `toolGetVehicleTimeline360.ts`: `_id` stabili, `items`, documenti/eventi/manutenzioni inclusi. | `incrocio timeline mezzo` PASS. |
| B4 - Cisterna snapshot | Payload snapshot troppo esteso per finalizzazione provider e dettagli non compattati in record verificabili. | `toolGetCisternaSnapshot.ts`: snapshot compatto, `items`, detail rows con `_id`, count e note. | `incrocio cisterna snapshot` PASS in 2.2s. |
| B5 - Cisterna riconciliazione | Output riconciliazione troppo grande e finalizzazione provider oltre timeout client. | `toolReconcileCisternaMonth.ts`: output compattato, `_id`, limiti righe, timeout tool 35s; orchestrator deterministico per prompt cisterna. | `incrocio cisterna riconciliazione` PASS in 2.2s. |
| B6 - Periodo mese scorso | Periodi relativi affidati quasi solo al prompt; mancava resolver deterministico nei filtri tool. | `chatIaToolDates.ts`, `chatIaToolFilters.ts`, `internal-ai-adapter.js`: resolver periodi relativi e prompt con date assolute. | `edge periodo mese scorso` PASS. Al 2026-05-01, "mese scorso" = 2026-04-01 / 2026-04-30. |

## Stabilizzazione aggiuntiva T7
| Caso | Causa | Fix | Verifica |
|---|---|---|---|
| `movimenti materiali aprile 2026` | Finalizzazione provider occasionalmente oltre timeout, pur con tool valido al retry. | `orchestrator.ts`: percorso deterministico che esegue `get_material_movements` e costruisce tabella locale. | PASS in 2.2s, suite completa senza retry. |

## Verifiche
- `npx tsc --noEmit`: PASS.
- `npm run build`: PASS.
- ESLint file toccati: PASS.
- `npm run lint` globale: RED per errori preesistenti fuori perimetro in madre/autisti/utils; nessun errore sui file toccati.
- E2E mirati B1-B6: 7/7 PASS senza retry.
- E2E completa finale: 102/102 PASS senza retry.

## File modificati
- `src/next/chat-ia/tools/chatIaToolDates.ts`
- `src/next/chat-ia/tools/chatIaToolFilters.ts`
- `src/next/chat-ia/tools/registry/toolGetDriverOperationalProfile.ts`
- `src/next/chat-ia/tools/registry/toolSearchDocumentsAndInvoices.ts`
- `src/next/chat-ia/tools/registry/toolGetDocumentCostsByVehicle.ts`
- `src/next/chat-ia/tools/registry/toolGetVehicleTimeline360.ts`
- `src/next/chat-ia/tools/registry/toolGetCisternaSnapshot.ts`
- `src/next/chat-ia/tools/registry/toolGetCisternaRefuelings.ts`
- `src/next/chat-ia/tools/registry/toolReconcileCisternaMonth.ts`
- `src/next/chat-ia/tools/registry/toolGetRefuelingsAggregated.ts`
- `src/next/chat-ia/tools/registry/toolCompareRefuelingSources.ts`
- `src/next/chat-ia/agents/orchestrator.ts`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `tests/e2e/02-veritaCalcolata.spec.ts`
- `tests/e2e/03-incroci.spec.ts`
- `tests/e2e/04-edgeCases.spec.ts`
- `docs/audit/REPORT_FIX_BUG_APPLICATIVI_2026-04-30.md`

## Note operative
- I bypass `blocked-app-bug` relativi a B1-B6 sono stati rimossi dai test.
- I percorsi deterministici agenti usano comunque i tool reali e preservano `_id` nei blocchi strutturati.
- Nessun reader/domain e nessuna struttura Firestore sono stati modificati.
