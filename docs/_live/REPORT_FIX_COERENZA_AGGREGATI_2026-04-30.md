# REPORT FIX COERENZA AGGREGATI CHAT IA NEXT - 2026-04-30

## Esito
PATCH COMPLETATA.

## Causa verificata
Scenario reale: `S3` con componente `S1`.

- `get_refuelings_aggregated` esponeva il conteggio canonico dei rifornimenti filtrati (`count: 70`) ma passava anche il report cisterna completo, con semantica diversa.
- Il modello poteva pescare il "top" da un report diverso dalla lista dettaglio e dichiarare `TI324633 = 16`.
- `get_refuelings` mostrava correttamente solo i primi 10 record per limite di output, ma la notice non riportava il totale reale.

Verifica Firestore diretta su aprile 2026:

- `@rifornimenti` + `@rifornimenti_autisti_tmp`: 140 righe grezze di aprile.
- Deduplica per id: 70 rifornimenti canonici flotta.
- `TI324633`: 30 righe grezze, 15 rifornimenti canonici.
- Top per numero rifornimenti: `TI324633`, 15.

## Fix applicati
- Aggiunto helper `buildTruncationMeta()` / `truncationNotice()` in `src/next/chat-ia/tools/chatIaToolFilters.ts`.
- I tool con liste limitate ora restituiscono:
  - `total_count`
  - `shown`
  - `is_truncated`
  - `truncation_reason`
  - `notices`
- `get_refuelings_aggregated` ora espone `rankingConteggioRifornimenti` e `topPerNumeroRifornimenti`, calcolati dalla stessa fonte canonica usata dal dettaglio.
- Il prompt backend obbliga a riportare totale reale e righe mostrate quando un tool segnala troncamento.
- Analytics multi-agente aggiunge callout automatici quando un tool specialistico segnala `is_truncated`.

## Tool aggiornati
Rifornimenti:
- `toolGetRefuelings.ts`
- `toolGetRefuelingsAggregated.ts`

Manutenzioni/lavori/eventi:
- `toolSearchMaintenances.ts`
- `toolSearchWorkOrders.ts`
- `toolSearchOperationalEvents.ts`
- `toolGetVehicleEvents.ts`
- `toolGetDriverActivity.ts`
- `toolGetDriverOperationalProfile.ts`
- `toolGetVehicleTimeline360.ts`
- `toolListScheduledMaintenanceDue.ts`

Documenti/costi:
- `toolSearchDocumentsAndInvoices.ts`
- `toolGetDocumentCostsByVehicle.ts`
- `toolGetCosts.ts`
- `toolFindInvoiceSupplier.ts`

Materiali/magazzino/anagrafiche tecniche:
- `toolGetMaterialMovements.ts`
- `toolGetVehicleMaterialMovements.ts`
- `toolListInventory.ts`
- `toolListDrivers.ts`
- `toolListWorkshops.ts`
- `toolListSuppliers.ts`
- `toolGetAdBlueTankEvents.ts`
- `toolGetEuromeccSnapshot.ts`
- `toolListArchivedReports.ts`

## Test aggiunti
- `tests/e2e/10-coerenzaAggregati.spec.ts`
  - verifica conteggio canonico rifornimenti aprile 2026;
  - verifica aggregato/dettaglio su `TI324633`;
  - verifica che le liste operative troncate dichiarino totale reale e righe mostrate.

## Verifiche
- `npm run build`: OK.
- `node --check backend/internal-ai/server/internal-ai-adapter.js`: OK.
- Lint mirato sui file toccati: OK.
- `npm run test:e2e -- tests/e2e/10-coerenzaAggregati.spec.ts`: 2/2 PASS.
- `npm run test:e2e`: 87 test, 86 PASS immediati, 1 flaky storico recuperato al retry, exit code 0.
- `npm run lint` globale: KO per baseline storico fuori perimetro, non introdotto da questa patch.

## Runtime atteso
- Prompt `chi ha fatto piu rifornimenti aprile 2026?`: risposta attesa `TI324633`, 15 rifornimenti, totale flotta 70.
- Prompt `mostrami il dettaglio dei rifornimenti di TI324633 aprile 2026`: risposta attesa `15 rifornimenti totali, primi 10 mostrati`.

## Vincoli rispettati
- Madre non toccata.
- Reader non modificati.
- Archivista non analizzato e non toccato.
- Ossatura tool non modificata.
- Nessun commit git.
