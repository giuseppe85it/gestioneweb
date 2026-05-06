# Report Shadow Validation Fase A

## Stato documento
- Data: 2026-05-04
- Script: `backend/internal-ai/server/lib/__diagnostics__/shadow-validation-report.mjs`
- Runtime: read-only, nessuna scrittura Firestore/Storage
- Privacy: nessun nome, badge, targa, id o searchText reale salvato in questo report

## Firebase Admin
- credential.mode: google_application_credentials
- credentialReady: si
- modulesReady: si
- canAttemptLiveRead: si

## Input sintetici
1. input miss Driver360 con searchText sintetico improbabile
2. input miss Driver360 alternativo con searchText sintetico improbabile
3. input fuori scope con view Vehicle360
4. input malformato con view assente
5. input borderline Driver360 con searchText vuoto
6. input malformato con filters null
7. input Driver360 con entityKind non driver
8. input nullo

## Caso reale anonimizzato
- `real_driver_case_executed`: si
- legacy_has_driverId: si
- candidate_has_driverId: si
- same_driverId: si
- legacy_match_count: 1
- candidate_match_count: 1
- divergence_kinds_observed: nessuna

## Metriche aggregate
- invocazioni_totali: 9
- input_sintetici: 8
- casi_reali_anonimizzati: 1

### Divergenze per kind
- not_applicable: 6

## Risultati sintetici aggregati
| Caso | Divergenze kind | Legacy has driverId | Candidate has driverId | Same driverId |
|---|---|---:|---:|---:|
| synthetic_driver_miss_a | nessuna | no | no | si |
| synthetic_driver_miss_b | nessuna | no | no | si |
| synthetic_vehicle_out_of_scope | not_applicable | no | no | n/a |
| synthetic_missing_view | not_applicable | no | no | n/a |
| synthetic_empty_search | not_applicable | no | no | n/a |
| synthetic_null_filters | not_applicable | no | no | n/a |
| synthetic_non_driver_entity | not_applicable | no | no | n/a |
| synthetic_null_message | not_applicable | no | no | n/a |

## Verdetto readiness switch
PRONTO TECNICAMENTE: zero divergenze critiche INCLUSO almeno 1 caso reale anonimizzato. Lo switch resta decisione separata.

## Note
- Il vecchio resolver resta unica fonte runtime.
- Il nuovo resolver e' stato esercitato solo in diagnostica.
- Lo switch full resta decisione separata.
