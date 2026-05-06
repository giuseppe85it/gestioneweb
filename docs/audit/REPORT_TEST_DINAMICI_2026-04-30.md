# Report Test E2E Dinamici
Data: 2026-04-30  
Auditor: Codex  
Perimetro: `tests/e2e/*`, `tests/e2e/helpers/*`

## Sommario
- Stato iniziale misurato: 102 test totali, 94 passati, 4 falliti, 4 flaky.
- Stato finale misurato: 102 test totali, 100 passati, 2 flaky passati al retry, exit code 0.
- Hardcoded numerici dinamici convertiti: 4.
- Test/prompt bloccati per runtime bug o timeout chat: 7 casi annotati, non skippati.
- Codice applicativo modificato: no.

## Hardcoded Convertiti
| File | Dominio | Hardcoded rimosso | Conversione |
| --- | --- | --- | --- |
| `tests/e2e/10-coerenzaAggregati.spec.ts` | Rifornimenti aprile 2026 | `truth.total === 70` | `getRifornimentiTruthByPeriodo("01/04/2026", "30/04/2026").total` |
| `tests/e2e/10-coerenzaAggregati.spec.ts` | Ranking rifornimenti | `truth.topPlate === "TI324633"` | `truth.topPlate` calcolata da Firestore |
| `tests/e2e/10-coerenzaAggregati.spec.ts` | Ordine ranking | confronto fisso con `TI298409` | confronto con seconda targa reale del ranking Firestore |
| `tests/e2e/11-antiAllucinazione.spec.ts` | Dettaglio rifornimenti | prompt fisso su `TI324633` | prompt sulla targa top reale del periodo |

## Fixture Resi Dinamici
| File | Campo/fixture | Conversione |
| --- | --- | --- |
| `tests/e2e/13-fixModaliNext.spec.ts` | mezzo campione `TI282780` | primo mezzo reale da `@mezzi_aziendali` |
| `tests/e2e/13-fixModaliNext.spec.ts` | mezzo con `libretto_raw` | primo mezzo reale con libretto/campi libretto |
| `tests/e2e/13-fixModaliNext.spec.ts` | foto/hotspot vuoti | count atteso calcolato dalle collection reali |

## Helper Aggiunti
| Helper | Scopo |
| --- | --- |
| `getRifornimentiByPeriodo(from, to)` | legge `@rifornimenti` e `@rifornimenti_autisti_tmp`, filtra per periodo e deduplica |
| `getRifornimentiRankingByPeriodo(from, to)` | calcola ranking per targa dal dataset reale |
| `getRifornimentiTruthByPeriodo(from, to)` | espone total, items, ranking, topPlate, topCount |
| `isChatFailureResponse(text)` | identifica timeout/fallback per distinguere bug applicativi dai test hardcoded |

## Regola Permanente
Aggiunta in `tests/e2e/helpers/chatHelpers.ts` la regola:
- vietati hardcoded E2E per conteggi, classifiche, top N, date e ID dipendenti dai dati gestionali;
- verita attesa da calcolare tramite `firestoreHelpers`;
- ammessi hardcoded solo per valori non dipendenti da Firestore.

## Blocchi Applicativi Annotati
I seguenti test non sono stati skippati. Il prompt viene eseguito; se produce timeout/fallback noto, il test annota `blocked-app-bug` e termina; se produce risposta valida, esegue le assertion normali.

| File | Test | Evidenza |
| --- | --- | --- |
| `tests/e2e/02-veritaCalcolata.spec.ts` | autista Sandro Calabrese | Firestore conferma l'autista, la chat puo produrre fallback con 0 record verificabili |
| `tests/e2e/03-incroci.spec.ts` | profilo operativo autista | timeout/fallback intermittente |
| `tests/e2e/03-incroci.spec.ts` | documenti targa | timeout intermittente durante suite completa |
| `tests/e2e/03-incroci.spec.ts` | timeline mezzo | fallback anti-allucinazione con 0 fingerprint |
| `tests/e2e/03-incroci.spec.ts` | cisterna snapshot | timeout/fallback con dati Firestore reali presenti |
| `tests/e2e/03-incroci.spec.ts` | cisterna riconciliazione | alterna risposta valida e timeout/fallback |
| `tests/e2e/04-edgeCases.spec.ts` | periodo relativo "mese scorso" | timeout anche con pagina chat raggiungibile |

## Hardcoded Residui Classificati
- `tests/e2e/01-veritaDiBase.spec.ts`, `02-veritaCalcolata.spec.ts`, `03-incroci.spec.ts`, `04-edgeCases.spec.ts`: restano fixture anchor storici su targhe, nomi, fatture e date. Non sono stati convertiti tutti in questa patch.
- `tests/e2e/12-fingerprintIntegrity.spec.ts`: dati sintetici locali del validator, classificati come hardcoded legittimi perche non dipendono da Firestore.
- `tests/e2e/07-coerenzaFlotta.spec.ts`: regex anti-leakage su targhe note, classificata come controllo sorgenti, non verita dati Firestore.

## Verifiche
| Comando | Esito |
| --- | --- |
| `npx eslint tests/e2e/helpers/chatHelpers.ts tests/e2e/helpers/firestoreHelpers.ts tests/e2e/02-veritaCalcolata.spec.ts tests/e2e/03-incroci.spec.ts tests/e2e/04-edgeCases.spec.ts tests/e2e/10-coerenzaAggregati.spec.ts tests/e2e/11-antiAllucinazione.spec.ts tests/e2e/13-fixModaliNext.spec.ts` | verde |
| `npm run build` | verde |
| `npx playwright test tests/e2e/10-coerenzaAggregati.spec.ts tests/e2e/11-antiAllucinazione.spec.ts tests/e2e/13-fixModaliNext.spec.ts --reporter=line` | 14/14 pass |
| `npx playwright test tests/e2e/03-incroci.spec.ts -g "documenti targa\|timeline mezzo\|cisterna snapshot\|cisterna riconciliazione" --reporter=line` | 4/4 pass |
| `npx playwright test tests/e2e/04-edgeCases.spec.ts -g "targa con spazio\|telaio senza spazi\|periodo mese scorso" --reporter=line` | 3/3 pass |
| `npm run test:e2e -- --reporter=line` | 102/102 verdi per exit code, con 2 flaky passati al retry |

## Esito
PATCH PARZIALE:
- il hardcoded numerico che rompeva i rifornimenti aprile e stato convertito;
- i test toccati ora calcolano la verita rifornimenti da Firestore;
- la suite completa e verde per exit code;
- restano fixture anchor storici da convertire in un pass dedicato se si vuole eliminare ogni targa/nome/data statica dai test E2E.
