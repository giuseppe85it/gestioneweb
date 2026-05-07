# Report Zero-Invenzioni Base

## Stato documento
- Versione: v1.0
- Data: 2026-05-04
- Scope: PROMPT C-RETRY, STEP C3.
- Dati reali nel report: no.

## Esiti

| Test | Esito | Dettaglio |
|---|---|---|
| T1 | PASS | 26 entry coerenti con boundary |
| T2 | PASS | nessun allowedField con pattern vietato |
| T3 | PASS | universal-resolver delega collection_root al modulo dedicato |
| T4 | PASS | shadow-comparator deprecato dopo BLOCCO 8 e warning runtime presente |
| T5 | PASS | casi reali anonimizzati coerenti |
| T6 | PASS | librettoUrl assente, librettoStoragePath presente |
| T7 | PASS | viewBindings presenti e coerenti sulle entry registry |
| T8 | PASS | query-engine limitato al percorso exact document tramite resolver universale |
| T9 | PASS | query-engine restituisce no_results certificato per input sintetico |
| T10 | PASS | view.config.ts copre i 5 ViewEnum con boundary id esistenti |
| T11 | PASS | Vehicle360 e' wrapper sopra CertifiedView senza domain reader |
| T12 | PASS | REGISTRY_CONFIG_FASE_A ha 26 entry e resta coerente con boundary |
| T13 | PASS | nessun URL firmato in allowedFields dopo estensione registry |
| T14 | PASS | euromecc.pending collection_root operativo, records=4 |
| T15 | PASS | record Euromecc proiettati solo su campi boundary |
| T16 | PASS | cap maxDocumentReadsPerRequest rispettato per Euromecc |
| T17 | PASS | 6 nuove entry root risolte con accessModeUsed collection_root |
| T18 | PASS | nessun campo *Url nelle 6 entry root BLOCCO 5 |
| T19 | PASS | forbiddenFields BLOCCO 5 includono testo libero e campi sensibili |
| T20 | PASS | relation.config.ts dichiara 5 relationKind minime con campi in registry |
| T21 | PASS | relation-resolver isolato da tools/agents/domain |
| T22 | PASS | driver_vehicle identico al pattern autistaId_explicit legacy su input sintetico |
| T23 | PASS | nessuna relazione exact/explicit nasce da campi mancanti o fuzzy |
| T24 | PASS | ProofPanel.tsx esiste e wrappa CollapsibleProof |
| T25 | PASS | Driver360 usa ProofPanel e non contiene grezzo tecnico in primo piano |
| T26 | PASS | script chat-ia:diagnostics presente |
| T27 | PASS | post-llm-resolver legacy annotato e warning runtime presente |
| T28 | PASS | registro promosso a v1.0 senza DA VERIFICARE residui nel piano |
| T29 | PASS | matchStrategy targa filtrano prima del cap su dataset sintetico |

## Metriche T5
- module_real_case_executed: si
- entries_tested: 4
- records_read: 7
- divergence_kinds: -

## Verdetto
PASS: diagnostici Zero-Invenzioni superati; test live PASS o DEFERRED dove ammesso.
