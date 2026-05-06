# AUDIT INDIPENDENTE BLOCCO 8 C6 — 2026-05-06

## Stato del documento
- Tipo: audit di sola lettura, post-fix.
- Operatore: Claude Code.
- Fonte unica: working tree corrente, report Codex `REPORT_BLOCCO_8_C6_FIX_2026-05-06.md` e `REPORT_BLOCCO_8_2026-05-06.md`, whitelist del prompt 8-C6-FIX-VALIDATOR-PROOF.
- Nessuna patch applicata. Nessuna esecuzione di build/Playwright/diagnostics.
- Nota tecnica: il working tree contiene cumulativamente l'intera esecuzione BLOCCHI 1-8 (nessun commit intermedio). L'isolamento del solo fix C6 e' fatto incrociando il `REPORT_BLOCCO_8_C6_FIX_2026-05-06.md`, le mtime dei file e i diff effettivi. Le modifiche provenienti da BLOCCHI 1-7 non sono qui giudicate come "violazioni perimetro del fix C6": sono semplicemente fuori scope di questo audit.

---

## Sezione 1 — Perimetro

### Whitelist prompt 8-C6-FIX-VALIDATOR-PROOF
1. `backend/internal-ai/server/lib/catalog-validator.js`
2. `backend/internal-ai/server/internal-ai-adapter.js`
3. `tests/e2e/20-proof-panel.spec.ts`
4. `tests/e2e/21-chat-ia-smoke.spec.ts`
5. `src/next/chat-ia/config/view.config.ts` (solo se necessario)
6. `docs/audit/REPORT_BLOCCO_8_C6_FIX_2026-05-06.md`
7. `docs/audit/REPORT_BLOCCO_8_2026-05-06.md` (solo se C6 PASS)

### File con diff non vuoto rispetto a HEAD
Working tree (`git status --short`):
- `backend/internal-ai/server/lib/catalog-validator.js` — IN WHITELIST.
- `backend/internal-ai/server/internal-ai-adapter.js` — IN WHITELIST.
- `docs/audit/REPORT_ZERO_INVENZIONI_TESTS_2026-05-04.md` — FUORI WHITELIST. Codex dichiara nel REPORT_BLOCCO_8 riga 27: "aggiornato dal comando diagnostics". Diff verificato (vedi Sezione 2): l'output e' coerente con riscrittura automatica da `npm run chat-ia:diagnostics`.
- `tests/e2e/helpers/chatHelpers.ts` — FUORI WHITELIST del prompt 8-C6-FIX-VALIDATOR-PROOF, ma dichiarato in `REPORT_BLOCCO_8_2026-05-06.md` riga 24. Originato dal fix C6 round 1 (heading mismatch) precedente al prompt 8-C6-FIX-VALIDATOR-PROOF.
- Altri file modificati nel working tree (`internal-ai-firebase-readonly-boundary.js`, `chat-zero-preflight.js`, `post-llm-resolver.js`, `registry.config.js`, `shadow-comparator.js`, `universal-resolver.js`, `STATO_ATTUALE_PROGETTO.md`, `REGISTRO_MODIFICHE_CLONE.md`, `REGISTRO_COLLECTION_FIRESTORE.md`, `SPEC_MOTORE_GENERICO_NEXT.md`, `STATO_MIGRAZIONE_NEXT.md`, `package.json`, `ChatIaMessageItem.tsx`, `CollapsibleProof.tsx`, `driverRelationResolver.ts`, `Driver360.tsx`) — fuori scope del fix C6: sono modifiche dei BLOCCHI 1-8 precedenti al fix, non valutate qui.
- `test-results/*` — output automatico di esecuzione test, non confronto.

### File untracked pertinenti al fix C6
Dei 16 file untracked nel working tree, sono pertinenti al perimetro fix C6:
- `tests/e2e/20-proof-panel.spec.ts` — IN WHITELIST. Untracked perche' creato da BLOCCO 7 / BLOCCO 8 e mai committato. Mtime 17:30:13.
- `tests/e2e/21-chat-ia-smoke.spec.ts` — IN WHITELIST. Untracked, mtime 17:29:59.
- `docs/audit/REPORT_BLOCCO_8_C6_FIX_2026-05-06.md` — IN WHITELIST. Mtime 18:05:35 (ultimo).
- `docs/audit/REPORT_BLOCCO_8_2026-05-06.md` — IN WHITELIST.

### Verdetto perimetro
PERIMETRO: **OK CON GIUSTIFICAZIONE**.
- Tutti i file whitelist sono toccati come previsto (eccetto `view.config.ts`, dichiarato non modificato dal C6 fix REPORT — vedi Sezione 6).
- Un file fuori whitelist (`REPORT_ZERO_INVENZIONI_TESTS_2026-05-04.md`) e' giustificato come output automatico di `npm run chat-ia:diagnostics` (Sezione 2).
- Un file fuori whitelist (`tests/e2e/helpers/chatHelpers.ts`) e' giustificato come fix C6 round 1 (heading mismatch) precedente al prompt 8-C6-FIX-VALIDATOR-PROOF.
- Tutto il resto del working tree e' fuori scope del fix C6 (modifiche dei BLOCCHI 1-8 precedenti).

---

## Sezione 2 — REPORT_ZERO_INVENZIONI_TESTS_2026-05-04.md (automatico o manuale)

Diff size: 48 righe. Modifiche:

| Tipo | Esempio dal diff |
|---|---|
| Numerico | `T1 PASS | 5 entry coerenti con boundary` -> `T1 PASS | 26 entry coerenti con boundary` |
| Numerico | `T12 PASS | REGISTRY_CONFIG_FASE_A ha 26 entry e resta coerente con boundary` |
| Numerico | `T28 PASS | registro resta BOZZA con DA VERIFICARE residui nel piano: 22` |
| Stringa derivata da stato codice | `T3 PASS | collection_root assente da universal-resolver` -> `T3 PASS | universal-resolver delega collection_root al modulo dedicato` |
| Stringa derivata da stato codice | `T4 PASS | size=6619, prime/ultime 3 righe coerenti` -> `T4 PASS | shadow-comparator deprecato dopo BLOCCO 8 e warning runtime presente` |
| Aggiunte test | T7-T28 nuove righe di tabella, dettagli generati dal diagnostics (es. `T11 PASS | Vehicle360 e' wrapper sopra CertifiedView senza domain reader`) |
| Verdetto narrativo | `PASS: T1, T2, T3, T4 e T6 superati. T5 PASS o DEFERRED accettabile.` -> `PASS: diagnostici Zero-Invenzioni superati; test live PASS o DEFERRED dove ammesso.` |

Tutte le righe modificate corrispondono ad output strutturato che `backend/internal-ai/server/lib/__diagnostics__/zero-invenzioni-tests.mjs` puo' produrre tramite `renderReport(results)` (cf. file diagnostics, funzione che scrive il report). Le metriche numeriche, i contatori PASS/FAIL e i dettagli T1..T28 sono coerenti con la firma del file.

Verdetto: **AUTOMATICO**. Il diff e' coerente con la rigenerazione di un file di report da diagnostics. Non sono presenti decisioni narrative o conclusioni manuali iniettate. La modifica del verdetto finale (ultima riga) e' anch'essa una stringa derivata, coerente con la logica `failed.length ? ... : ...` del diagnostics.

---

## Sezione 3 — Adapter (locale o strutturale)

Diff size: 308 righe. File: `backend/internal-ai/server/internal-ai-adapter.js`.

### Misurazione
- Righe aggiunte (range visibile nel diff): ~278 righe inserite.
- Funzioni nuove introdotte:
  - `inferCertifiedViewFromPreflight(message, options)` — regex multipli su searchText per inferire `Driver360 | Vehicle360 | Site360 | Euromecc360 | Ricerca360`.
  - `normalizeOutOfCatalogFallbackResolution(resolution, options)` — sostituisce `error_view_unavailable` con `buildCatalogErrorMessage()` quando view non inferibile.
  - `entityKindForCertifiedView(view)`.
  - `normalizeMessageForViewBinding(message, options)` — riscrive `message.view`, `filters.entityKind`, `accompaniment` se inferenza riuscita.
  - `getViewBindingEntryKeys(view)` — legge `REGISTRY_CONFIG_FASE_A.entries` e filtra per `viewBindings`.
  - `normalizeCertifiedSearchValue`, `extractPlateToken`, `readCertifiedRecordValues`, `certifiedRecordMatchesSearch` — utilities di matching.
  - `filterResolvedFiltersBySearchText`, `mergeResolvedFiltersV2` — aggregatore multi-entry.
  - `resolveByViewBinding(message, options)` — funzione principale: chiama `runQueryEngine` su tutte le entry con `viewBindings` matching.
- Funzione modificata: `resolveChatIaPostLlmMessage(message, options)` — aggiunge la chiamata `normalizeMessageForViewBinding` -> `resolveByViewBinding` -> fallback a `resolveWithUniversalResolverFaseA` con `normalizeOutOfCatalogFallbackResolution`.

### Coerenza con report Codex
Il `REPORT_BLOCCO_8_C6_FIX_2026-05-06.md` riga 17-19 dichiara:
> "Routing intent naturale corretto per dare priorita al prompt originale quando il modello riduce `filters.searchText`. `ricerca <testo>` resta instradata a `Ricerca360`. Fallback `error_view_unavailable` senza vista e senza intent catalogato normalizzato a `error_intent_not_in_catalog`."

Verifico nel diff:
- Priorita prompt originale: in `inferCertifiedViewFromPreflight` la riga `const promptSearchText = ... options.preflightContext.searchText || ... options.prompt; const messageSearchText = ... message.filters.searchText; const searchText = promptSearchText || messageSearchText;` — IMPLEMENTATO.
- `ricerca <testo>` -> `Ricerca360`: regex `/\b(ricerca|cerca|trova)\b/i.test(searchText)` -> `return "Ricerca360"` — IMPLEMENTATO.
- Fallback normalizzato a `error_intent_not_in_catalog`: in `normalizeOutOfCatalogFallbackResolution` la riga `finalMessage: buildCatalogErrorMessage(),` — IMPLEMENTATO (`buildCatalogErrorMessage` produce `error_intent_not_in_catalog`).

### Tuttavia
Il diff include funzioni che vanno OLTRE la dichiarazione minimale del C6 FIX REPORT: l'intera infrastruttura `resolveByViewBinding`, `mergeResolvedFiltersV2`, `getViewBindingEntryKeys`, ecc. — che il piano dichiara essere introdotta in BLOCCO 3, non in C6. Il working tree non distingue il fix C6 dalla cumulativa dei blocchi precedenti, quindi questa portata non e' di per se' una violazione del fix C6: e' la cumulativa BLOCCO 3 + BLOCCO 8 CANCELLO 0 + C6 fix.

Dal punto di vista del prompt audit (verifica che il fix non sia "riscrittura dell'orchestrazione"): le 3 modifiche dichiarate dal C6 FIX REPORT sono LOCALIZZATE entro `inferCertifiedViewFromPreflight` (priorita prompt) e `normalizeOutOfCatalogFallbackResolution` (fallback). La pipeline generale di classificazione non e' stata stravolta in C6: la `resolveChatIaPostLlmMessage` mantiene la stessa sequenza con due hook aggiunti.

Verdetto: **DUBBIO**. Le 3 modifiche dichiarate dal C6 FIX REPORT sono compatibili con interventi LOCALI, ma il diff contiene anche infrastruttura attribuita dal piano a BLOCCO 3. Senza un commit intermedio non e' possibile isolare con certezza la sola portata del C6 fix. Sotto il vincolo "il fix C6 non deve aver riscritto l'orchestrazione", l'evidenza testuale (regex per "ricerca", priorita prompt, normalizeOutOfCatalogFallbackResolution) e' compatibile con una correzione mirata al routing intent. Le funzioni a corredo possono essere preesistenti dal BLOCCO 3.

---

## Sezione 4 — Validator (campi ammessi + divieti)

Diff size: 389 righe. File: `backend/internal-ai/server/lib/catalog-validator.js`.

### 4a — Nuovi campi ammessi
Il diff introduce la branch `if (value.version === "resolvedFilters.v2") { validateResolvedFiltersV2(value, errors); return; }` (riga ~411). La validazione `validateResolvedFiltersV2` ammette i seguenti campi top-level:
- `version` (deve valere esattamente `"resolvedFilters.v2"`),
- `legacyDriver360` (null o `{ driverId: string|null }`),
- `query` (action, view, entityKind, searchText, periodPreset, enum-controllati),
- `entries` (array di entry typed: `boundaryEntryId`, `sourceCollection`, `accessModeUsed` enum, `records`, `status` enum),
- `disambiguation` (null o oggetto),
- `errors` (array di error typed),
- `unresolvedReason` (string o null).

Per ogni `record` di entries: `sourceRecordId`, `fields`, `provenance`, `relations` (opzionale). Per ogni `field`: `value`, `sourceField`, `sourceValueType`. Per `provenance`: `sourceCollection`, `sourceRecordId`, `sourceFields`, `accessModeUsed`, `boundaryEntryId`, `confidence`. Per `relations`: `relationKind`, `targetLabel`, `relationProof` (con `relationKind`, `sourceCollection`, `sourceRecordId`, `sourceField`, `rule`, `certainty`).

Confronto col REPORT C6 FIX: il report dichiara "resolvedFilters.version, resolvedFilters.entries e payload strutturati v2 restano ammessi se coerenti" + "descrizione e' ammessa come campo business certificato dentro record v2". TUTTI i campi sopra sono dichiarati nel report o sono parte naturale dello schema v2 (`SPEC_MOTORE_GENERICO_NEXT.md` §5.3). 

`descrizione` non compare come campo esplicito nello schema: e' AMMESSA per OMISSIONE dalla blacklist `UNSAFE_RESOLVED_FILTER_FIELD_NAMES`. La blacklist contiene `note`, `messaggio`, `commento`, `testo`, `dettaglio`, `rawtext`, `extractedtext`, `riepilogobreve`, `analisicosti`, `anomalie`, `fornitorinotevoli` ma NON `descrizione`. Coerente con la dichiarazione Codex.

Nessun campo ammesso non dichiarato nel report.

### 4b — Divieti effettivamente implementati
Verifico contro il diff (`UNSAFE_RESOLVED_FILTER_FIELD_NAMES` e `SIGNED_URL_PATTERN`):

| Divieto dichiarato dal report | Verifica nel codice |
|---|---|
| URL firmati | **IMPLEMENTATO**: `SIGNED_URL_PATTERN = /https?:\/\/|firebasestorage|googleapis\.com\/storage|alt=media|X-Goog-/i` (riga ~91) usato in `validateSafeResolvedFilterPayload` su tutti i valori string ricorsivamente. |
| URL-like (downloadUrl/fileUrl/pdfUrl/url/imageUrls/fotoUrl) | **IMPLEMENTATO**: blacklist `UNSAFE_RESOLVED_FILTER_FIELD_NAMES` contiene `downloadurl, fileurl, pdfurl, url, imageurls, fotourl` (righe ~70-75 del diff). |
| Token | **IMPLEMENTATO**: blacklist contiene `apikey, token` (righe ~58-60). |
| Segreti | **IMPLEMENTATO**: blacklist contiene `password, secret` (righe ~60-61). |
| Contatti | **IMPLEMENTATO**: blacklist contiene `telefono, telefonoprivato, telefoniaggiuntivi, email, indirizzo, pinsim, puksim, schedecarburante` (righe ~62-69). |
| Note | **IMPLEMENTATO**: blacklist contiene `note, messaggio, commento, testo, dettaglio` (righe ~76-80). |
| Campi raw | **IMPLEMENTATO**: blacklist contiene `rawtext, extractedtext, riepilogobreve, analisicosti, anomalie, fornitorinotevoli` (righe ~81-86). |

La funzione `validateSafeResolvedFilterPayload` e' chiamata ricorsivamente su:
- ogni valore di `field.value` (riga ~245),
- ogni `provenance` intero (riga ~280),
- ogni `relationProof` intero (riga ~300),
- ogni `record` intero (riga ~340),
- l'intero `resolvedFilters` (riga ~487).

Quindi ogni nodo del payload e' soggetto a:
1. Verifica del nome di campo contro blacklist (`isUnsafeResolvedFilterFieldName`).
2. Verifica dei valori string contro `SIGNED_URL_PATTERN`.

### 4c — Pattern "passa-tutto"
Cerco early-return / catch ignorati / passive validation:
- Branch `if (value.version === "resolvedFilters.v2")` chiama `validateResolvedFiltersV2(value, errors); return;` — return DOPO la validazione, NON prima.
- `validateResolvedFiltersV2` esegue `hasOnlyFields`, `requireFields`, validazioni typed su tutti i sub-fields. Non vedo `try/catch` che ingoia errori.
- `validateSafeResolvedFilterPayload` non ritorna `true` di default: spinge errori in `errors[]` e ritorna `void`.
- Funzioni di validazione interne (`validateCertifiedField`, `validateCertifiedRecordProvenance`, ecc.) iterano sui campi e chiamano `errors.push(...)` per ogni problema.

Nessun pattern "return true" prematuro o eccezione catturata-ignorata nel diff.

### Verdetto
**VALIDATOR ROBUSTO**. Tutti i 7 divieti dichiarati nel C6 FIX REPORT sono effettivamente implementati con pattern enforcing nel codice (blacklist + regex + validazione ricorsiva). Lo schema v2 e' validato strict. La concessione di `descrizione` (omessa dalla blacklist) e' dichiarata esplicitamente nel report.

---

## Sezione 5 — Test 20 e 21

### Test 20 (`tests/e2e/20-proof-panel.spec.ts`)

| Domanda | Risposta + citazione |
|---|---|
| 5a Vista certificata montata? | SI: `await expect(message.locator(viewSelector)).toHaveCount(1, { timeout: 45000 });` (riga 71). Selettori: `[data-driver360]`, `[data-certified360-view="Vehicle360"]`, `[data-certified360-view="Site360"]`, ecc. |
| 5b Proof "must exist"? | IBRIDO: per Driver360 e Vehicle360 `requireProof: true` -> `expect(panels.count()).toBeGreaterThan(0)` (riga 47). Per Site360/Euromecc360/Ricerca360 `requireProof: false` -> `if (!options.required && (await panels.count()) === 0) return false;` (riga 44). Codex dichiara la scelta nel REPORT C6 FIX riga 23: "Proof panel richiesto solo dove esiste dato/prova certificata; Site360/Euromecc360/Ricerca360 accettano empty/no_results pulito." |
| 5c try/catch che mascherano? | NO. Nessun try/catch nel file. |
| 5d test.skip / .only / waitForTimeout statici? | `test.skip(!driverName, ...)`, `test.skip(!plate, ...)` — DATA-DRIVEN SKIP legittimi (saltano se manca un dato runtime certificabile, righe 92, 101, 108). Nessun `.only`. Nessun `waitForTimeout` statico. Timeout 45000/120000 ms ragionevoli per chat IA. |
| 5e Fallback "intent fuori catalogo" verificato qui? | NO, e' verificato in test 21. Test 20 verifica solo i contenuti del pannello prove sulle viste certificate. |

Asserzioni Zero-Invenzioni mantenute: riga 76 `expect(...).not.toMatch(/sourceRecordId|sourceField|https:\/\/firebasestorage/i)`. Riga 60 `expect(...).not.toMatch(/note|telefono|url/i)`. Riga 80-82 fallback "dato non trovato nelle fonti autorizzate".

Verdetto Test 20: **INTEGRI**. La differenziazione `requireProof` e' una scelta esplicita coerente con Zero-Invenzioni (non si puo' richiedere proof senza dato certificato). Asserzioni anti-leak preservate.

### Test 21 (`tests/e2e/21-chat-ia-smoke.spec.ts`)

| Domanda | Risposta + citazione |
|---|---|
| 5a Vista certificata montata? | SI: `await expect(message.locator(viewSelector)).toHaveCount(1, { timeout: 45000 });` (riga 50). 5 viste testate in loop (righe 78-93). |
| 5b Proof "must exist"? | IBRIDO: `requireProof: true` per Driver360 e Vehicle360, `requireProof: false` per Site360/Euromecc360/Ricerca360 (righe 79-83). Stesso pattern coerente di test 20. |
| 5c try/catch che mascherano? | NO. |
| 5d test.skip / .only / waitForTimeout statici? | `test.skip(!plate || !relationPlate || !driverName, ...)` — DATA-DRIVEN SKIP legittimo (riga 76). Nessun `.only`. Nessun `waitForTimeout`. Timeout 45000/120000 ms. |
| 5e Fallback "intent fuori catalogo" verificato? | SI, esplicitamente nel test "fallback intent non in catalogo resta parametrico" (riga 95-105): prompt "asdfghjkl", `expect(message.locator('[data-chat-zero-action="error"]')).toHaveCount(1)`, `expect(message.locator('[data-chat-zero-view="none"]')).toHaveCount(1)`, `expect(...).toContainText("Richiesta non disponibile nel catalogo attuale.")`, `assertNoFreeAssistantTextLeak(message)`. |

Asserzioni Zero-Invenzioni: riga 63 `expect(...).not.toMatch(/sourceRecordId|sourceField|https:\/\/firebasestorage/i)`. Riga 37 `assertNoFreeAssistantTextLeak` verifica `[data-chat-zero-uncertified-fallback]` count == 0.

Verdetto Test 21: **INTEGRI**. Smoke completo su 5 viste + fallback fuori catalogo verificato con 4 asserzioni distinte.

---

## Sezione 6 — view.config.ts

Stato git: **untracked, NON modificato dal fix C6**.

Evidenza mtime:
- `view.config.ts`: 2026-05-06 15:59:55.
- `tests/e2e/20-proof-panel.spec.ts`: 2026-05-06 17:30:13 (~1h 30m dopo).
- `tests/e2e/21-chat-ia-smoke.spec.ts`: 2026-05-06 17:29:59.
- `catalog-validator.js`: 2026-05-06 17:50:46.
- `internal-ai-adapter.js`: 2026-05-06 17:59:33.
- `REPORT_BLOCCO_8_C6_FIX_2026-05-06.md`: 2026-05-06 18:05:35.

`view.config.ts` precede tutti i file del fix C6 di almeno 1h 30m. Coerente con la dichiarazione del C6 FIX REPORT riga 41: "src/next/chat-ia/config/view.config.ts non e' stato modificato."

Verdetto: **NON MODIFICATO**. Coerente con whitelist ("solo se necessario"). Nessuna nuova collection o campo inventato in questa sezione.

---

## Sezione 7 — REPORT_BLOCCO_8 finale (autocertificazione)

| Punto da verificare | Riga del report | Verdetto |
|---|---|---|
| C6 PASS | riga 12 `CANCELLO 6: PASS.` | COERENTE |
| C7 PASS | riga 13 `CANCELLO 7: PASS.` | COERENTE |
| Playwright 17-21 PASS | riga 36 `Playwright mirato BLOCCO 8 C6: PASS, 10/10.` (e righe 38-42 con il comando) | COERENTE (autocertificato; non rieseguibile in audit di sola lettura) |
| Chat IA NEXT operativa parziale controllata | riga 76 `Chat IA NEXT operativa parziale controllata. Vedi lista DA VERIFICARE residui e test DEFERRED.` | COERENTE |
| Registro/SPEC NON promossi a v1.0 | riga 61 `promozione Registro/SPEC condizionata: non eseguita per residui aperti.` | COERENTE: verificato sui file `docs/product/REGISTRO_COLLECTION_FIRESTORE.md` (riga 4 `Versione: 0.6 BOZZA` + annotazione 2026-05-06 "resta BOZZA. La promozione a v1.0 e' sospesa finche' nel piano restano voci `DA VERIFICARE`") e `docs/product/SPEC_MOTORE_GENERICO_NEXT.md` (riga 5 `Versione: v0.1 BOZZA` + annotazione 2026-05-06 "resta BOZZA. Nessuna promozione a STABLE finche' nel piano restano voci DA VERIFICARE"). |
| 22 DA VERIFICARE residui | riga 46 `Conteggio residuo nel piano: 22 occorrenze DA VERIFICARE.` + lista sintetica righe 50-61 | COERENTE (numero dichiarato; non ricontato in questo audit). |

Nessuna incoerenza rilevata tra il REPORT_BLOCCO_8 e gli artefatti su disco verificati.

---

## Sezione 8 — Verdetto finale

**GIALLO**.

Motivazione (2 righe):
- Validator robusto, test 20-21 integri, view.config.ts non modificato, Registro/SPEC restano BOZZA come dovuto, fallback fuori catalogo correttamente verificato; perimetro fix C6 sostanzialmente rispettato e file fuori whitelist (`REPORT_ZERO_INVENZIONI_TESTS`, `chatHelpers.ts`) hanno giustificazione esplicita.
- Adapter mostra una pipeline view-binding ricca (resolveByViewBinding, mergeResolvedFiltersV2, ecc.) il cui isolamento al solo C6 fix non e' verificabile senza commit intermedi: la portata strutturale e' compatibile col piano (BLOCCO 3 + BLOCCO 8 CANCELLO 0) ma il C6 FIX REPORT minimizza la dichiarazione, sufficiente per richiedere conferma prima di promuovere a VERDE.
