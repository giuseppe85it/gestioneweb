# Report Zero-Invenzioni Base

## Stato documento
- Versione: v1.0
- Data: 2026-05-04
- Scope: PROMPT C-RETRY, STEP C3.
- Dati reali nel report: no.

## Esiti

| Test | Esito | Dettaglio |
|---|---|---|
| T1 | PASS | 5 entry coerenti con boundary |
| T2 | PASS | nessun allowedField con pattern vietato |
| T3 | PASS | collection_root assente da universal-resolver |
| T4 | PASS | size=6619, prime/ultime 3 righe coerenti |
| T5 | PASS | casi reali anonimizzati coerenti |
| T6 | PASS | librettoUrl assente, librettoStoragePath presente |

## Metriche T5
- module_real_case_executed: si
- entries_tested: 4
- records_read: 7
- divergence_kinds: -

## Verdetto
PASS: T1, T2, T3, T4 e T6 superati. T5 PASS o DEFERRED accettabile.
