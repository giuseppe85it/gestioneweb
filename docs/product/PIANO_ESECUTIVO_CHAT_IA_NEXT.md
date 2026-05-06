# PIANO ESECUTIVO CHAT IA NEXT

## Identita del documento
- **Versione:** v0.1 BOZZA
- **Data:** 2026-05-06
- **Autore:** Claude Code (stesura), su richiesta di Giuseppe.
- **Scopo:** unica fonte di verita per chiudere la Chat IA NEXT come modale intelligente del gestionale.
- **Modalita di esecuzione:** Codex eseguira BLOCCO 1 -> BLOCCO 8 in un turno operativo unico, dopo validazione GPT + Claude. Questo documento NON viene eseguito in questo prompt.
- **Vincolo informativo:** il piano deriva da lettura reale dei file elencati in §0 e nelle "Fonti" di ogni blocco. Nessun path, campo, collection o componente inventato.

---

## §-1 Validazione piano pre-esecuzione

Prima di eseguire BLOCCO 1, Codex deve verificare la coerenza interna del piano. Questa sezione NON e' un blocco operativo (non ha cancelli 1-7): e' un pre-check di coerenza da eseguire una sola volta prima del primo blocco.

### Check di coerenza

1. Per ogni BLOCCO (1-8): la whitelist MODIFICA non contiene file che sono nella lista NON TOCCARE dello stesso blocco.
2. Per ogni BLOCCO: i prerequisiti dichiarati sono coerenti con l'ordine dei blocchi (BLOCCO N richiede solo BLOCCO N-1, mai blocchi successivi).
3. Per ogni BLOCCO: i test del CANCELLO 5 non referenziano file che non esistono ancora e non sono nella whitelist CREA del blocco corrente o di blocchi precedenti.
4. Nessun blocco modifica `backend/internal-ai/server/internal-ai-adapter.js` prima che `backend/internal-ai/server/lib/query-engine.js` esista (BLOCCO 1 lo crea; l'aggancio adapter avviene in BLOCCO 3).
5. Nessun blocco modifica `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js` tranne BLOCCO 5.

### Esiti

- Se la validazione trova conflitti:
  - Codex riporta: `VALIDAZIONE PIANO FALLITA — conflitto: <descrizione>`.
  - Codex NON procede con BLOCCO 1.
  - L'esecuzione si ferma per intervento umano.
- Se la validazione passa:
  - Codex riporta: `VALIDAZIONE PIANO OK — 5 check superati. Procedo con BLOCCO 1.`

---

## §0 Stato attuale

### 0.1 Stack runtime backend chat IA
- Adapter principale: `backend/internal-ai/server/internal-ai-adapter.js` (schema strict OpenAI, switch resolver, env flags).
- Resolver legacy Driver360-specifico: `backend/internal-ai/server/lib/post-llm-resolver.js`.
- Resolver universale Fase A: `backend/internal-ai/server/lib/universal-resolver.js` (solo `exact_document`, output multi-record `resolvedFilters.v2`).
- Shadow comparator: `backend/internal-ai/server/lib/shadow-comparator.js` (ritorna sempre output legacy, osserva il candidato).
- Boundary readonly: `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js`.
- Catalog validator: `backend/internal-ai/server/lib/catalog-validator.js`.
- Fingerprint validator: `backend/internal-ai/server/lib/fingerprint-validator.js`.
- Pipeline pre-LLM: `backend/internal-ai/server/lib/chat-zero-preflight.js`.
- Registry runtime Fase A: `backend/internal-ai/server/lib/registry.config.js` (`REGISTRY_CONFIG_FASE_A`).

### 0.2 Stack runtime frontend chat IA
- Pagina chat operativa: `src/next/chat-ia/ChatIaToolUsePage.tsx` (chiama `runToolUseConversation`).
- Wrapper route ufficiale: `src/next/chat-ia/ChatIaPage.tsx` (rende `ChatIaToolUsePage`).
- Dispatcher rendering messaggi: `src/next/chat-ia/components/ChatIaMessageItem.tsx`.
- Vista certificata operativa: `src/next/chat-ia/views/Driver360.tsx` + `src/next/chat-ia/views/driver360.css` (CHIUSO 2026-05-06: il file CSS esiste nel repo ed e' importato da `Driver360.tsx`).
- Pannello prove riusabile: `src/next/chat-ia/components/CollapsibleProof.tsx`.
- Resolver relazioni autista-mezzo (frontend): `src/next/chat-ia/relations/driverRelationResolver.ts`.
- Tipi pubblici chat: `src/next/chat-ia/core/chatIaTypes.ts` (`ChatZeroInvenzioniMessage`, `ViewEnum`, `RelationProof`, `DriverVehicleCertifiedRelation`).
- Catalog validator frontend: `src/next/chat-ia/core/catalogValidator.ts`.
- Launcher home: `src/next/components/HomeInternalAiLauncher.tsx` (apre `/next/chat`).

### 0.3 Entry `REGISTRY_CONFIG_FASE_A` attive
File: `backend/internal-ai/server/lib/registry.config.js`.

| Chiave config | boundaryEntryId | accessMode | datasetKey | Numero allowedFields config |
|---|---|---|---|---:|
| `driver360.colleghi` | `firestore-storage-colleghi-doc` | `exact_document` | `@colleghi` | 6 |
| `sessions.autistiSessioneAttive` | `firestore-storage-autisti-sessioni-attive-doc` | `exact_document` | `@autisti_sessione_attive` | 14 |
| `vehicles.mezziAziendali` | `firestore-storage-mezzi-aziendali-doc` | `exact_document` | `@mezzi_aziendali` | 13 |
| `refuelings.rifornimentiAutistiTmp` | `firestore-storage-rifornimenti-autisti-tmp-doc` | `exact_document` | `@rifornimenti_autisti_tmp` | 13 |
| `refuelings.rifornimenti` | `firestore-storage-rifornimenti-doc` | `exact_document` | `@rifornimenti` | 13 |

### 0.4 Inventario boundary readonly per accessMode
File: `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js`.

- `accessMode: "exact_document"`: 32 entry (range `:663-1263`).
- `accessMode: "collection_root"`: 6 entry, tutte sottografo Euromecc (`:1264-1356`):
  - `firestore-euromecc-pending-root`, `firestore-euromecc-done-root`, `firestore-euromecc-issues-root`, `firestore-euromecc-area-meta-root`, `firestore-euromecc-extra-components-root`, `firestore-euromecc-relazioni-root`.
  - Stato registro: dichiarate, NON OPERATIVE finche il resolver non consuma `collection_root`.
- `accessMode: "exact_object_path_from_firestore_field"`: 1 entry storage (`storage-libretto-path-from-mezzo`).
- Constanti chiave:
  - `FIRESTORE_FREE_TEXT_FORBIDDEN_FIELDS` (`:626-639`): `note`, `descrizione`, `messaggio`, `commento`, `testo`, `dettaglio`, `rawText`, `extractedText`, `riepilogoBreve`, `analisiCosti`, `anomalie`, `fornitoriNotevoli`.
  - `FIRESTORE_SENSITIVE_FORBIDDEN_FIELDS` (`:641-660`): `apiKey`, `token`, `password`, `secret`, `telefono`, `telefonoPrivato`, `telefoniAggiuntivi`, `email`, `indirizzo`, `pinSim`, `pukSim`, `schedeCarburante`, `downloadUrl`, `fileUrl`, `pdfUrl`, `url`, `imageUrls`, `fotoUrl`.

### 0.5 Viste 360 attuali
- `Driver360`: operativa (`src/next/chat-ia/views/Driver360.tsx`). Mostra anagrafica certificata (nome, badge), stato mezzo attuale con `relationProof`, candidati di disambiguazione cliccabili.
- `Vehicle360`, `Site360`, `Euromecc360`, `Ricerca360`: enum dichiarati in `src/next/chat-ia/core/chatIaTypes.ts:346`. UI assente: `ChatIaMessageItem.tsx:178-184` mostra placeholder "Vista richiesta non ancora disponibile".

### 0.6 Audit completati (path + verdetto sintetico)
- `docs/audit/AUDIT_READINESS_CHAT_IA_NEXT_2026-05-04.md` — 8 lacune bloccanti, 7 interventi whitelist, 14 moduli scope copertura.
- `docs/audit/AUDIT_URL_FIELDS_BOUNDARY_2026-05-04.md` — `librettoUrl` URL firmato; rimosso da `FIRESTORE_MEZZI_ALLOWED_FIELDS`. Path tecnico `librettoStoragePath` resta disponibile.
- `docs/audit/REPORT_SHADOW_VALIDATION_FASE_A_2026-05-04.md` — PRONTO TECNICAMENTE: zero divergenze critiche, almeno 1 caso reale anonimizzato.
- `docs/audit/REPORT_ZERO_INVENZIONI_TESTS_2026-05-04.md` — T1-T6 PASS (T5 PASS reale).

### 0.7 Env var attive
File: `backend/internal-ai/server/internal-ai-adapter.js:69-70`.
- `CHAT_IA_SHADOW_RESOLVER === "1"` -> `runShadowComparator` (ritorna legacy + osserva candidato).
- `CHAT_IA_LEGACY_RESOLVER === "1"` -> `resolvePostLlmMessage` (legacy Driver360).
- Default (nessuna delle due) -> `resolveWithUniversalResolverFaseA` (universale Fase A con fallback al legacy in caso di errore o risoluzione vuota).

### 0.8 Test programmatici esistenti
- `backend/internal-ai/server/lib/__diagnostics__/zero-invenzioni-tests.mjs` (genera `docs/audit/REPORT_ZERO_INVENZIONI_TESTS_2026-05-04.md`).
- `backend/internal-ai/server/lib/__diagnostics__/shadow-validation-report.mjs` (genera `docs/audit/REPORT_SHADOW_VALIDATION_FASE_A_2026-05-04.md`).
- E2E Playwright esistenti: `tests/e2e/12-fingerprintIntegrity.spec.ts`, `tests/e2e/14-driver360ZeroInvenzioni.spec.ts`, e altre 14 spec sotto `tests/e2e/`.
- Playwright: PRESENTE in devDependencies (`package.json:40,51` — `@playwright/test ^1.59.1`, `playwright ^1.58.2`). NON serve installazione in BLOCCO 8.

### 0.9 Configurazioni dichiarative non ancora esistenti
Verifica con Glob `**/*{view.config,relation.config}*`: ZERO match.
- `view.config.ts`: DA CREARE (vedi BLOCCO 2).
- `relation.config.ts`: DA CREARE (vedi BLOCCO 6).

---

## §1 Direzione e principi

### 1.1 Principio operativo
La Chat IA NEXT e una **modale intelligente del gestionale**, non una chat narrativa. Capisce richieste, legge dati certificati live e mostra record con prove. Non parla; mostra. Non inventa; cita la fonte.

### 1.2 14 punti di comportamento atteso
1. Capire la richiesta utente passando dall'Action Router LLM con schema strict.
2. Leggere il Registro Collection Firestore (`docs/product/REGISTRO_COLLECTION_FIRESTORE.md` v0.6 BOZZA) come fonte architetturale.
3. Usare la config runtime (`registry.config.js`) come fonte machine-readable derivata.
4. Leggere Firestore live solo via boundary readonly (`internal-ai-firebase-readonly-boundary.js`).
5. Usare solo i campi dichiarati in `allowedFields` di ciascuna entry boundary.
6. Usare gli alias dichiarati in "Alias e ricerca flessibile" del registro v0.6.
7. Produrre record certificati nel formato `CertifiedRecord` (cf. `SPEC_MOTORE_GENERICO_NEXT.md` §5.3).
8. Allegare `provenance` per ogni record visualizzato.
9. Allegare `relationProof` per ogni relazione visualizzata.
10. Mostrare risposta principale pulita: dati leggibili, nessun grezzo tecnico in primo piano.
11. Tenere il dettaglio tecnico nel pannello "Perche' vedo questo dato?", collassato di default (`CollapsibleProof.tsx`).
12. Non inventare dati: se manca, dire "dato non trovato nelle fonti autorizzate".
13. Non mostrare URL firmati Firebase Storage. Sono in `FIRESTORE_SENSITIVE_FORBIDDEN_FIELDS`.
14. Non mostrare campi fuori boundary; non mostrare testo libero LLM come dato.

### 1.3 Contratto certificazione obbligatorio
Ogni dato visualizzato come certificato deve esporre:
- `sourceCollection`,
- `sourceRecordId`,
- `sourceField` (o `sourceFields`),
- `allowedField === true` (campo presente in `allowedFields` boundary),
- `relationProof` quando si tratta di relazione,
- `accessModeUsed`,
- `boundaryEntryId`,
- `confidence`.

Se manca uno di questi attributi, il dato non si mostra come certificato.

### 1.4 Gestione errori
- Dato assente: messaggio neutro "dato non trovato nelle fonti autorizzate" tramite kind `accompaniment` esistente (`no_results`, `error_view_unavailable`).
- Resolver in errore: nessun fallback narrativo. Si usa `accompaniment.kind = error_view_unavailable` (gia in `catalog-validator.js:43`).
- Boundary entry non trovata: `accompaniment.kind = error_view_unavailable`.
- Nessun grezzo tecnico in primo piano: `Driver360.tsx:53-78` e `:193-196` sono il pattern da NON ripetere (cf. `AUDIT_READINESS_CHAT_IA_NEXT_2026-05-04.md` §4).

---

## §2 Architettura finale

### 2.1 Query engine universale
Pattern unico: entita + filtri + periodo + collection + alias -> record certificati.
Config-driven: il motore non hardcoda viste; legge `registry.config.js` + `view.config.ts` + `relation.config.ts` (cf. §6 e §10 di questo piano).

### 2.2 Config runtime
- `registry.config.js` (esistente): entry per modulo backend + alias + match strategy + requestLimits.
- `src/next/chat-ia/config/view.config.ts` (NUOVO, BLOCCO 2): definisce sezioni, campi, limiti per `ViewEnum`. NON e codice eseguibile, e dichiarazione tipata.
- `src/next/chat-ia/config/relation.config.ts` (NUOVO, BLOCCO 6): definisce relazioni tra entita; usato dal Relation Resolver deterministico.

**Regola di separazione backend/frontend.** Il backend Node (ESM) non deve importare direttamente file `.ts` frontend. Se una config deve essere consumata dal backend, creare una proiezione backend dedicata in formato JS o JSON (es: `relation.config.cjs`, `view-bindings.json`). Il frontend puo' importare la config TS direttamente. Questa regola e' richiamata operativamente in BLOCCO 2 (proiezione `viewBindings` in `registry.config.js`) e in BLOCCO 6 (proiezione `relation.config.cjs`).

### 2.3 Vista generica certificata
Un componente React config-driven legge `ResolvedFiltersV2` (definita in `SPEC_MOTORE_GENERICO_NEXT.md` §5.3) e renderizza secondo `view.config.ts`.

`Vehicle360`, `Refueling360`, `Maintenance360`, `Search360` (CHIUSO 2026-05-06: `Refueling360`, `Maintenance360`, `Search360` non sono viste separate da implementare in V1; le funzioni rifornimenti/manutenzioni vivono come sezioni config-driven di `Vehicle360`, la ricerca vive in `Ricerca360`, e la `ViewEnum` reale resta `Driver360 | Vehicle360 | Site360 | Euromecc360 | Ricerca360`). Tutte le viste sono la stessa vista config-driven con config diverse. NIENTE 4 componenti separati.

### 2.4 Pannello prove
`CollapsibleProof.tsx` esiste e gia filtra `FORBIDDEN_FIELD_NAME_PATTERN`. Va esteso in BLOCCO 7 con: piu' livelli, raggruppamenti per record, fallback "dato non trovato".

### 2.5 Limiti operativi default
- Max record per vista lista: 50.
- Paginazione default: 20.
- Periodo default per viste con filtro periodo: 90 giorni.
- Ordinamento default: `updatedAt desc` quando il campo esiste in `allowedFields`; fallback a `timestamp desc` o `createdAt desc` quando dichiarato nella stessa entry. Se nessuno dei tre campi e' ammesso, la vista usa il cap deterministico senza ordinamento aggiuntivo. Chiuso in Registro 2026-05-06.

---

## §3 Regole anti-allucinazione informatiche

- Vietato inventare path repo, collection Firestore, campi Firestore, componenti React, API, funzioni.
- Se non e' nel codice, nel registro, nel boundary o negli audit citati: `DA VERIFICARE` (mai assumere).
- Se serve un file fuori dal perimetro consentito del blocco: `SERVE FILE EXTRA: <path>`.
- Se una relazione non ha prova certificabile (`relationProof`), non si mostra come certificata.
- Se un dato non ha (`sourceCollection`, `sourceRecordId`, `sourceField`), non si mostra come certificato; si usa placeholder neutro "dato non trovato nelle fonti autorizzate".

---

## §4 Regola di readiness

Giuseppe testa nel browser SOLO quando, per il blocco corrente, sono PASS in ordine:
1. **build** del progetto (`npm run build`);
2. **test statici** (`node --check` su file toccati JS, e tsc -b incluso in `npm run build` per TS);
3. **test automatici** dei diagnostics Zero-Invenzioni (`node backend/internal-ai/server/lib/__diagnostics__/zero-invenzioni-tests.mjs`);
4. **Playwright** sui test E2E rilevanti (solo se il blocco tocca UI/chat);
5. **output chat leggibile** (manuale, dopo i 4 cancelli automatici);
6. **fonti tecniche collassate** (pannello prove chiuso di default);
7. **nessun grezzo tecnico** nella risposta principale;
8. **report finale del blocco** dice PASS.

Se uno solo di questi e FAIL, Giuseppe NON apre il browser per quel blocco.

### Policy test Playwright (vale per tutti i blocchi che toccano UI/chat)

**Policy targhe nei test.** Nei test Playwright NON usare targhe reali hardcoded. Usare input sintetici per casi `no_results` (es: `ZZZ_DIAG_000000`, conforme al pattern `\b[A-Z]{2}\d{6}\b` di `chat-zero-preflight.js:1`). Per casi che richiedono dati reali, leggere un record runtime e anonimizzare: non stampare il valore nel report ne' nel codice di test.

**Specifica tecnica per record runtime anonimizzato nei test Playwright.** I test Playwright NON leggono Firestore direttamente dal browser. Se serve un dato reale anonimizzato, va recuperato da un helper Node lato test che usa Firebase Admin gia' configurato nel progetto (cf. `backend/internal-ai/server/internal-ai-firebase-admin.js`) oppure da un endpoint diagnostico autorizzato. Se questo helper non esiste al momento dell'esecuzione del blocco, il test usa SOLO il caso `no_results` sintetico e marca il caso reale come DEFERRED.

Tutti i blocchi successivi che hanno `CANCELLO 6 — PLAYWRIGHT` ereditano automaticamente questa policy.

---

## §5 — BLOCCO 1: Core query engine exact_document

### Obiettivo
Preparare il Query Engine `exact_document` (`query-engine.js`) e i `viewBindings` nel registry config, pronti per il successivo instradamento runtime (BLOCCO 3). NON modifica il flusso runtime attuale: l'adapter resta invariato.

### Agente
Codex (backend).

### Prerequisiti
Nessuno. E' il primo blocco.

### Whitelist file
**CREA**
- `backend/internal-ai/server/lib/query-engine.js` — orchestratore esposto: `runQueryEngine({ entryConfigKey, matchInput, query }) -> ResolvedFiltersV2`. Wrapper deterministico sopra `runUniversalResolverFaseA`, pronto a essere chiamato da viste future.

**MODIFICA**
- `backend/internal-ai/server/lib/registry.config.js` — aggiunta del campo `viewBindings` per ciascuna entry, dichiarando per quale `ViewEnum` la entry e leggibile (es. `["Driver360"]` per `driver360.colleghi`, `["Driver360", "Vehicle360"]` per `vehicles.mezziAziendali`). Solo dichiarativo, nessun codice eseguibile aggiunto.

**NON TOCCARE**
- `backend/internal-ai/server/internal-ai-adapter.js`. L'adapter va modificato solo in BLOCCO 3, quando registry esteso e CertifiedView (BLOCCO 2) sono gia' in piedi. BLOCCO 1 NON tocca l'adapter.
- `backend/internal-ai/server/lib/post-llm-resolver.js`.
- `backend/internal-ai/server/lib/shadow-comparator.js`.
- `backend/internal-ai/server/lib/universal-resolver.js`.
- `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js`.
- `backend/internal-ai/server/lib/catalog-validator.js`.
- `backend/internal-ai/server/lib/fingerprint-validator.js`.
- `backend/internal-ai/server/lib/chat-zero-preflight.js`.
- `src/next/chat-ia/relations/driverRelationResolver.ts`.
- Qualsiasi cartella `src/next/chat-ia/agents/`, `src/next/chat-ia/tools/`.
- Qualsiasi writer (`*Writer.ts`), domain reader (`src/next/domain/**`).
- `src/next/cloneWriteBarrier.ts` (qualsiasi barriera scritture).

### Output atteso
- File `query-engine.js` esistente, esporta `runQueryEngine`.
- `query-engine.js` pronto a essere chiamato dall'adapter in BLOCCO 3.
- `registry.config.js` con campo `viewBindings` per ogni entry. Nessuna nuova entry.
- Test T1, T6 di `zero-invenzioni-tests.mjs` continuano a passare; nuovo test T7 introdotto (vedi cancello 5).

### Cancelli

**CANCELLO 1 — AUDIT**
- Comandi:
  - `Select-String -Path "backend/internal-ai/server/lib/registry.config.js" -Pattern "REGISTRY_CONFIG_FASE_A"`
  - `Select-String -Path "backend/internal-ai/server/internal-ai-adapter.js" -Pattern "resolveChatIaPostLlmMessage|resolveWithUniversalResolverFaseA"`
  - lettura completa di `universal-resolver.js`.
- PASS: 5 entry presenti, 1 export `REGISTRY_CONFIG_FASE_A`, 1 funzione `resolveChatIaPostLlmMessage`.
- FAIL: una qualsiasi mancanza. Stop.

**CANCELLO 2 — PATCH**
- `query-engine.js`: modulo ESM, importa `REGISTRY_CONFIG_FASE_A`, importa `runUniversalResolverFaseA`, espone `runQueryEngine`. Pattern unico, niente componenti separati per vista. Niente campi liberi: solo input typed.
- `registry.config.js`: aggiunta di `viewBindings: Object.freeze([...])` per ciascuna delle 5 entry. Nessun cambio ad `allowedFields`, `forbiddenFields`, `aliases`.
- L'adapter NON viene modificato in questo blocco. L'aggancio del `query-engine.js` al flusso runtime e' compito del BLOCCO 3.
- Stop in caso di errore patch (errore tsc/node --check).

**CANCELLO 3 — TEST STATICI**
- `node --check backend/internal-ai/server/lib/query-engine.js`.
- `node --check backend/internal-ai/server/lib/registry.config.js`.
- Verifica import: `query-engine.js` importa solo da `registry.config.js` e `universal-resolver.js`.
- FAIL: stop.

**CANCELLO 4 — BUILD**
- Comando: `npm run build`.
- Se fallisce per file toccati: correggere.
- Se fallisce per errori preesistenti (es. errori TS in moduli mai modificati): riportare e non correggere.

**CANCELLO 5 — TEST AUTOMATICI**
- Estensione `zero-invenzioni-tests.mjs` con nuovi test:
  - **T7**: `viewBindings` presente in tutte le 5 entry e contiene almeno una `ViewEnum` valida.
  - **T8**: `query-engine.js` esiste e non contiene la stringa `collection_root` (pattern `Select-String "collection_root"` -> 0 match).
  - **T9**: `runQueryEngine({ entryConfigKey: "driver360.colleghi", matchInput: { searchText: "ZZZ_NON_ESISTE" } })` ritorna `ResolvedFiltersV2` con `entries[0].records.length === 0` e `errors[0].kind === "collection_empty"` (caso sintetico, no dati reali).
- Comando: `node backend/internal-ai/server/lib/__diagnostics__/zero-invenzioni-tests.mjs`.
- PASS: T1..T9 tutti PASS o T5 DEFERRED.
- FAIL: stop.

**CANCELLO 6 — PLAYWRIGHT**
- BLOCCO 1 NON tocca UI. Skip Playwright in questo blocco. Marcato `PLAYWRIGHT = SKIP (blocco backend-only)`.

**CANCELLO 7 — REPORT**
- Output strutturato in chat:
  1. `BLOCCO 1: PASS` o `FAIL`.
  2. file toccati (lista path repo relativi).
  3. test esiti: T1..T9.
  4. build esito.
  5. cosa resta fuori: viste UI placeholder (BLOCCO 2), root collection (BLOCCO 4-5), pannello prove esteso (BLOCCO 7).
  6. prossimo blocco o stop.

### Condizione avanzamento
Se cancelli 1-5 e 7 = PASS (cancello 6 = SKIP), procedere a BLOCCO 2.

### Condizione di stop
Se anche un cancello = FAIL, fermarsi. Riportare blocco, cancello, motivo, evidenza.

### Cosa resta fuori
- Estensione boundary verso root collection (BLOCCO 4 e 5).
- Tutte le viste 360 oltre Driver360 (BLOCCO 2 e 3).
- Pannello prove esteso (BLOCCO 7).
- Cleanup legacy resolver (BLOCCO 8).

---

## §6 — BLOCCO 2: Vista generica certificata + Vehicle360

### Obiettivo
Questo blocco:
- crea `view.config.ts` dichiarativa per `ViewEnum` esistente (`Driver360 | Vehicle360 | Site360 | Euromecc360 | Ricerca360`);
- crea `CertifiedView.tsx` come vista generica config-driven (un solo componente per tutte le viste 360 non Driver);
- crea `Vehicle360.tsx` come primo wrapper operativo che monta `CertifiedView` con `viewKind = "Vehicle360"`;
- prepara `CertifiedView` e `Vehicle360`, ma NON modifica l'adapter. L'instradamento runtime avverra' in un blocco successivo dopo validazione test;
- NON implementa intent catalog runtime: quello resta scope futuro (o blocco dedicato fuori dal perimetro v1).

Vehicle360 e' preparato come prima vista nuova (non placeholder) basata su `vehicles.mezziAziendali` e `refuelings.rifornimenti`, ma diventa effettivamente raggiungibile runtime SOLO dopo l'instradamento adapter introdotto in BLOCCO 3. Le altre 3 viste restano placeholder gestiti dalla stessa vista generica.

### Agente
Codex (frontend + backend).

### Prerequisiti
BLOCCO 1 = PASS.

### Whitelist file
**CREA**
- `src/next/chat-ia/config/view.config.ts` — definisce `ViewConfig` typed per ciascun valore `ViewEnum`. Sezioni, campi, `entryBoundaryIds`, limiti.
- `src/next/chat-ia/views/CertifiedView.tsx` — vista generica config-driven; legge `ChatZeroInvenzioniMessage` e `view.config.ts`, dispatcha sezioni.
- `src/next/chat-ia/views/Vehicle360.tsx` — wrapper minimo che monta `CertifiedView` con `viewKind = "Vehicle360"`. Nessuna logica dati propria.
- `src/next/chat-ia/views/certifiedView.css` — CSS namespaced `certified360__*`. Vietato globale.

**MODIFICA**
- `src/next/chat-ia/components/ChatIaMessageItem.tsx` — sostituire il placeholder "Vista richiesta non ancora disponibile" (`:178-184`) con dispatch a `CertifiedView` per i 4 valori `ViewEnum` non Driver360. Driver360 continua a montare il componente esistente.

**NON TOCCARE**
- `backend/internal-ai/server/internal-ai-adapter.js`. L'adapter va modificato in un blocco successivo, dopo che `CertifiedView` e i test sono verdi. Il BLOCCO 2 prepara la vista ma NON la instrada runtime. L'aggancio adapter e' compito del BLOCCO 3.
- `src/next/chat-ia/views/Driver360.tsx`.
- `src/next/chat-ia/views/driver360.css` (esistenza verificata e chiusa 2026-05-06).
- `backend/internal-ai/server/lib/post-llm-resolver.js`.
- `backend/internal-ai/server/lib/universal-resolver.js`.
- `backend/internal-ai/server/lib/shadow-comparator.js`.
- `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js`.
- `backend/internal-ai/server/lib/fingerprint-validator.js`.
- `backend/internal-ai/server/lib/catalog-validator.js`.
- Tutti i tool `src/next/chat-ia/tools/registry/*.ts`.
- Tutti gli agenti `src/next/chat-ia/agents/**`.
- `src/next/chat-ia/relations/driverRelationResolver.ts`.
- Qualsiasi domain reader (`src/next/domain/**`), writer (`*Writer.ts`), barriera (`cloneWriteBarrier.ts`).

### Output atteso
- `view.config.ts` con 5 entry `ViewEnum` typed.
- `CertifiedView.tsx` operativa: rende sezioni dichiarate dalla config, mostra `CollapsibleProof` per ogni record, gestisce `accompaniment` e `disambiguation`.
- `Vehicle360.tsx`: targa exact match -> sezione anagrafica mezzo certificata (entry `vehicles.mezziAziendali`). Le relazioni autista-mezzo sono rinviate a BLOCCO 6 (Relation Resolver). La sezione rifornimenti e' rinviata a BLOCCO 6 perche' l'incrocio mezzo->rifornimenti richiede una relazione certificata via `relation.config.ts`.
- `Site360`, `Euromecc360`, `Ricerca360`: rendono via `CertifiedView` un placeholder strutturato "vista non ancora coperta dal motore generico" SENZA testo libero LLM (fallback parametrico, kind `error_view_unavailable`).
- `CertifiedView` e `Vehicle360` preparati e buildabili, ma non ancora instradati dall'adapter runtime. L'instradamento avviene in BLOCCO 3.
- Test T10 introdotto (vedi cancello 5).

### Cancelli

**CANCELLO 1 — AUDIT**
- Comandi:
  - lettura completa `src/next/chat-ia/components/ChatIaMessageItem.tsx`.
  - lettura completa `src/next/chat-ia/views/Driver360.tsx`.
  - `Select-String -Path "src/next/chat-ia/core/chatIaTypes.ts" -Pattern "ViewEnum"`.
- PASS: `ViewEnum` ha 5 valori; `ChatIaMessageItem` ha placeholder a `:178-184`.
- FAIL: stop.

**CANCELLO 2 — PATCH**
- `view.config.ts`: una sola fonte tipata, niente magic strings nel componente.
- `CertifiedView.tsx`: pattern unico per tutte le viste; nessun ramo Vehicle360-specifico nel componente generico — la specificita vive nella config.
- Non si introducono campi liberi nelle sezioni: ogni `ViewSectionConfig` enumera campi e label.
- L'adapter NON viene modificato in questo blocco.
- Stop in caso di errore tsc/build.

**CANCELLO 3 — TEST STATICI**
- `npm run build` (esegue `tsc -b`).
- Verifica import: `CertifiedView.tsx` importa solo da `chatIaTypes.ts`, `view.config.ts`, `CollapsibleProof.tsx`. Nessun import da agents/tools/domain.
- FAIL: stop.

**CANCELLO 4 — BUILD**
- Comando: `npm run build`.
- Stesse regole del BLOCCO 1.

**CANCELLO 5 — TEST AUTOMATICI**
- Estensione `zero-invenzioni-tests.mjs`:
  - **T10**: `view.config.ts` esiste, dichiara esattamente i 5 valori `ViewEnum`, ogni `ViewConfig` ha `entryBoundaryIds` non vuoto e tutti gli id riferiti esistono nel boundary readonly.
  - **T11**: `Vehicle360.tsx` esiste, importa `CertifiedView`, NON importa direttamente domain reader.
- Comando: `node backend/internal-ai/server/lib/__diagnostics__/zero-invenzioni-tests.mjs`.
- PASS: T1..T11 tutti PASS o T5 DEFERRED.

**CANCELLO 6 — PLAYWRIGHT**
- PLAYWRIGHT = SKIP.
- Motivo: Vehicle360 e CertifiedView sono preparati e buildabili, ma non ancora instradati dall'adapter runtime (instradamento avviene in BLOCCO 3). I test Playwright per Vehicle360 vanno eseguiti nel BLOCCO 3 (scenari `tests/e2e/15-vehicle360`), nel rispetto della "Policy test Playwright" definita in §4.

**CANCELLO 7 — REPORT**
- Output strutturato in chat: stesso schema BLOCCO 1.

### Condizione avanzamento
Se cancelli 1-5 e 7 = PASS (cancello 6 = SKIP perche' Vehicle360 non e' ancora instradato runtime; i Playwright Vehicle360 girano in BLOCCO 3), procedere a BLOCCO 3.

### Condizione di stop
Stop su qualsiasi FAIL.

### Cosa resta fuori
- Moduli storage/@ non ancora coperti (BLOCCO 3).
- Root collection (BLOCCO 4 e 5).
- Relazioni multi-entita complete (BLOCCO 6).
- Pannello prove esteso (BLOCCO 7).

---

## §7 — BLOCCO 3: Estensione moduli storage/@ + instradamento runtime viste non-Driver360

### Obiettivo
Estendere `REGISTRY_CONFIG_FASE_A` (rinominato implicitamente come "FASE_A_PIENA" tramite append; il versioning resta in `version: "registry.config.faseA.v0.1"` finche non si decide promozione) per coprire i 9 moduli `storage/@` mancanti tra quelli prioritari secondo `AUDIT_READINESS_CHAT_IA_NEXT_2026-05-04.md` §6: `storage/@manutenzioni`, `storage/@lavori`, `storage/@inventario`, `storage/@materialiconsegnati`, `storage/@ordini`, `storage/@preventivi`, `storage/@preventivi_approvazioni`, `storage/@fornitori`, `storage/@officine` (CHIUSO 2026-05-06: `@officine` e' mantenuta come entry collegata a `Vehicle360` per relazioni manutenzione/officina, gia' presente in boundary e registry).

### Agente
Codex (backend).

### Prerequisiti
BLOCCO 2 = PASS.

### Whitelist file
**CREA**
- `tests/e2e/15-vehicle360.spec.ts` — test Playwright Vehicle360 runtime dopo instradamento adapter.
- `tests/e2e/16-site360-ricerca360.spec.ts` — test Playwright Site360/Ricerca360 runtime dopo instradamento adapter.

**MODIFICA**
- `backend/internal-ai/server/lib/registry.config.js` — aggiunta di 9 entry `exact_document` come l'attuale schema. Per ciascuna: `boundaryEntryId` (gia esistenti nel boundary, vedi `internal-ai-firebase-readonly-boundary.js:1082-1264`), `accessMode: "exact_document"`, `collection: "storage"`, `docId: "@<datasetKey>"`, `allowedFields` proiettato 1:1 dal boundary, `forbiddenFields` 1:1, `aliases` derivati dal registro v0.6, `requestLimits` da boundary, `viewBindings` (es. `["Vehicle360", "Site360", "Ricerca360"]` per manutenzioni/lavori).
- `src/next/chat-ia/config/view.config.ts` — aggiornare `entryBoundaryIds` di `Site360` e `Ricerca360` per consumare le entry estese.
- `backend/internal-ai/server/internal-ai-adapter.js` — Instradamento viste non-Driver360 al `query-engine.js`. Introduce `resolveByViewBinding(message, options)` chiamata PRIMA del fallback legacy quando `message.view !== 'Driver360'`. Backend legge `viewBindings` proiettati in `registry.config.js`. Per Driver360 mantiene la logica `resolveWithUniversalResolverFaseA` esistente. Niente nuovo schema, niente nuovo prompt.

**NON TOCCARE**
- `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js` (le entry esistono gia; nessuna patch boundary).
- Resolver legacy, shadow comparator, universal resolver.
- Tutti i tool e agenti.
- `Driver360.tsx`, `CertifiedView.tsx`, `Vehicle360.tsx`.
- Domain reader e writer.

### Output atteso
- `registry.config.js` con 14 entry totali (5 esistenti + 9 nuove).
- `view.config.ts` aggiornato per Site360 e Ricerca360.
- Adapter instrada viste non-Driver360 al query engine.
- Site360: vista aggregatrice certificata. CHIUSO 2026-05-06 con decisione prodotto Opzione A: `Cantiere` non diventa nuova collection canonica `@cantieri` in V1; e' entita derivata/aggregata da campi strutturati gia' presenti nei dati reali (`cantiere`, `cantiereId`, `cantiereLabel`, `sourceCantiereId`, `sourceCantiereLabel`) su fonti autorizzate esistenti. Non creare `@cantieri`, non introdurre writer cantieri, non aprire nuove collection Firestore.

### Cancelli

**CANCELLO 1 — AUDIT**
- Comandi:
  - `Select-String -Path "backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js" -Pattern "firestore-storage-(manutenzioni|lavori|inventario|materiali-consegnati|ordini|preventivi|preventivi-approvazioni|fornitori|officine)-doc"`.
  - per ciascuna entry boundary, leggere `allowedFields` e `forbiddenFields` reali.
- PASS: 9 entry boundary trovate; allowedFields letti.
- FAIL: stop. Riportare quali entry mancano.

**CANCELLO 2 — PATCH**
- 9 nuove entry in `REGISTRY_CONFIG_FASE_A.entries`. Naming `<domain>.<datasetCamelCase>`: `maintenance.manutenzioni`, `work.lavori`, `inventory.inventario`, `materials.materialiConsegnati`, `orders.ordini`, `quotes.preventivi`, `quotes.preventiviApprovazioni`, `suppliers.fornitori`, `workshops.officine`.
- Pattern unico: niente componenti separati, niente codice runtime nel registry.
- `allowedFields` e `forbiddenFields` proiettati 1:1 dal boundary, mai un superset.
- Stop in caso di errore.

**CANCELLO 3 — TEST STATICI**
- `node --check backend/internal-ai/server/lib/registry.config.js`.
- `node --check backend/internal-ai/server/internal-ai-adapter.js`.
- `npm run build` (per `view.config.ts`).
- FAIL: stop.

**CANCELLO 4 — BUILD**
- `npm run build`. Stesse regole.

**CANCELLO 5 — TEST AUTOMATICI**
- Estensione `zero-invenzioni-tests.mjs`:
  - **T12**: `REGISTRY_CONFIG_FASE_A` ha 14 entry; per ciascuna, T1 (boundary entry esiste) e T2 (nessun pattern vietato in allowedFields) restano PASS.
  - **T13**: nessuna entry contiene URL signed (`librettoUrl`, `downloadUrl`, ecc.) negli allowedFields, anche dopo l'estensione.
- PASS: T1..T13 PASS.

**CANCELLO 6 — PLAYWRIGHT**
- BLOCCO 3 instrada l'adapter, quindi le viste Vehicle360 / Site360 / Ricerca360 diventano raggiungibili runtime.
- Vale la "Policy test Playwright" definita in §4.
- Scenari `tests/e2e/15-vehicle360` (spostati da BLOCCO 2 dopo che l'adapter e' instradato):
  - apertura `/next/chat`, prompt "apri vista mezzo <plate runtime anonimizzata>" (targa letta runtime via helper Node, mai hardcoded).
  - alternativa di copertura "no match": prompt con plate sintetica `ZZ000000`; assert `accompaniment.kind === "no_results"`.
  - assert principale: la vista monta `CertifiedView` con kind `Vehicle360`; placeholder Site360 NON appare; pannello prove presente e collassato.
- Scenari `tests/e2e/16-site360-ricerca360`:
  - apertura `/next/chat`, prompt "apri cantiere <X>" (DA VERIFICARE: usare un placeholder sintetico tipo `ZZZ_DIAG_SITE`); assert vista Site360 mostra struttura sezioni dichiarata in `view.config.ts`.
  - prompt ricerca generica con plate fittizia `ZZZ123456` (no match): assert `accompaniment.kind === "no_results"`, nessun grezzo tecnico.
- PASS: scenari verdi.

**CANCELLO 7 — REPORT**
- Stesso schema dei blocchi precedenti.

### Condizione avanzamento
Tutti i cancelli PASS -> BLOCCO 4.

### Condizione di stop
Stop su qualsiasi FAIL.

### Cosa resta fuori
- 6 root collection Euromecc dormienti (BLOCCO 4).
- 6 root collection nuove documentali e Cisterna (BLOCCO 5).
- Relazioni complesse (BLOCCO 6).

---

## §8 — BLOCCO 4: Fase B collection_root

### Obiettivo
Attivare il supporto runtime al `accessMode === "collection_root"` nel Resolver Universale, sbloccando le 6 entry Euromecc dichiarate nel boundary (`internal-ai-firebase-readonly-boundary.js:1264-1356`). Aggiungere le 6 entry Euromecc al registry config per Euromecc360.

### Agente
Codex (backend).

### Prerequisiti
BLOCCO 3 = PASS.

### Whitelist file
**CREA**
- `backend/internal-ai/server/lib/universal-resolver-collection-root.js` — modulo separato dedicato al ramo `collection_root`. Importato dal resolver universale tramite contratto chiaro: input boundary entry + matchInput, output `ResolvedFiltersV2` multi-record. Tenerlo separato evita di sporcare il file `universal-resolver.js` esistente.

**MODIFICA**
- `backend/internal-ai/server/lib/universal-resolver.js` — aggiunta di branch: se `entryConfig.accessMode === "collection_root"`, delega a `runCollectionRootResolver` esportata dal nuovo file. Il branch `exact_document` resta intatto.
- `backend/internal-ai/server/lib/registry.config.js` — aggiunta di 6 entry Euromecc (`euromecc.pending`, `euromecc.done`, `euromecc.issues`, `euromecc.areaMeta`, `euromecc.extraComponents`, `euromecc.relazioni`) con `accessMode: "collection_root"`, `viewBindings: ["Euromecc360", "Ricerca360"]`.
- `src/next/chat-ia/config/view.config.ts` — aggiornare `Euromecc360.entryBoundaryIds` con i 6 boundary id `firestore-euromecc-*-root`.

**NON TOCCARE**
- `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js`.
- `post-llm-resolver.js`, `shadow-comparator.js`, `catalog-validator.js`, `fingerprint-validator.js`, `chat-zero-preflight.js`.
- Tool, agenti, domain reader, writer.
- `Driver360.tsx`, `Vehicle360.tsx`, `CertifiedView.tsx`.
- `internal-ai-adapter.js` (le viste consumano via `resolveByViewBinding` gia introdotto in BLOCCO 3).

### Output atteso
- Resolver universale supporta `collection_root` con cap `requestLimits.maxDocumentReadsPerRequest` rispettato.
- 6 entry Euromecc operative in `registry.config.js`.
- Euromecc360 mostra dati Euromecc certificati invece del placeholder.
- Cache dichiarata: nessuna in v1 (cf. `AUDIT_READINESS_CHAT_IA_NEXT_2026-05-04.md` §9 punto 3 — decisione rinviata; il piano sceglie "nessuna cache" come default, da rivedere se compaiono problemi di latenza).

### Cancelli

**CANCELLO 1 — AUDIT**
- Comandi:
  - lettura `internal-ai-firebase-readonly-boundary.js:1264-1356` per confermare le 6 entry root.
  - lettura `universal-resolver.js:271-279` per confermare lo `shape_rejected` attuale per `collection_root`.
- PASS: 6 entry trovate; resolver attuale rifiuta `collection_root`.
- FAIL: stop.

**CANCELLO 2 — PATCH**
- `universal-resolver-collection-root.js`: pattern unico, lettura via `firestore.collection(entry.collection).limit(maxDocumentReadsPerRequest).get()`. Proiezione `allowedFields`, esclusione `forbiddenFields`, costruzione `CertifiedRecord` come gia fa `buildCertifiedRecord` per `exact_document`.
- Aggiunta entry registry: nessun campo libero, nessun alias inventato. Allineamento 1:1 con boundary.
- `view.config.ts`: solo `entryBoundaryIds` aggiornati.
- Stop in caso di errore.

**CANCELLO 3 — TEST STATICI**
- `node --check` sui 3 file backend.
- `npm run build` per la config TS.
- FAIL: stop.

**CANCELLO 4 — BUILD**
- `npm run build`.

**CANCELLO 5 — TEST AUTOMATICI**
- Estensione `zero-invenzioni-tests.mjs`:
  - **T14**: `runUniversalResolverFaseA({ entryConfigKey: "euromecc.pending" })` ritorna `entries[0].accessModeUsed === "collection_root"` con 0 o piu' record (caso reale anonimizzato; nessun id in stdout).
  - **T15**: per ciascuna delle 6 entry Euromecc, nessun record proiettato contiene campi fuori boundary.
  - **T16**: cap rispettato: `records.length <= maxDocumentReadsPerRequest`.
- PASS: T1..T16 PASS o T5/T14 DEFERRED se Firebase Admin non disponibile.

**CANCELLO 6 — PLAYWRIGHT**
- PLAYWRIGHT = SKIP.
- Motivo: BLOCCO 4 aggiunge il supporto backend `collection_root` e le 6 entry Euromecc al registry, ma `view.config.ts` non dichiara ancora sezioni operative per `Euromecc360` (resta placeholder). Il test Playwright Euromecc360 va eseguito nel BLOCCO 5 dove avviene l'integrazione completa.

**CANCELLO 7 — REPORT**
- Schema standard, con dichiarazione esplicita: "Euromecc360 UI non testata in questo blocco; test spostato a BLOCCO 5."

### Condizione avanzamento
Se cancelli 1-5 e 7 = PASS (cancello 6 = SKIP perche' Euromecc360 non ha ancora sezioni operative in `view.config.ts`; Playwright girera' in BLOCCO 5), procedere a BLOCCO 5.

### Condizione di stop
Stop su qualsiasi FAIL.

### Cosa resta fuori
- 6 root collection nuove (documentali + Cisterna) che richiedono prima estensione boundary (BLOCCO 5).

---

## §9 — BLOCCO 5: Documenti + Cisterna + Euromecc

### Obiettivo
Estendere il boundary readonly per le 6 root collection nuove dichiarate dal registro v0.6 BOZZA come "BLOCCO RUNTIME — boundary da estendere": `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici` (DA VERIFICARE: il registro v0.6 marca le voci `storage/@documenti_*` come "DEPRECATA — DA SOSTITUIRE CON ROOT COLLECTION"; le entry boundary esistenti `firestore-storage-documenti-*-doc` puntano a `storage/@documenti_*` come `exact_document`. La patch di BLOCCO 5 aggiunge entry root parallele `firestore-<root>-root` con `accessMode: "collection_root"` SENZA rimuovere quelle storage. La rimozione e' BLOCCO 8). E le 3 root Cisterna: `@documenti_cisterna`, `@cisterna_schede_ia`, `@cisterna_parametri_mensili`.

### Agente
Codex (backend).

### Prerequisiti
BLOCCO 4 = PASS.

### Whitelist file
**CREA**
- nessuno (i test Playwright `tests/e2e/17-euromecc360.spec.ts` e `tests/e2e/18-documenti-cisterna.spec.ts` sono spostati alla whitelist CREA del BLOCCO 8 perche' richiedono intent runtime completo).

**MODIFICA**
- `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js` — aggiunta di 6 entry root collection con `accessMode: "collection_root"`. Allowed fields proiettati dai writer documentali esistenti; mapping writer -> `allowedFields` formalizzato nel Registro 2026-05-06. I campi non esposti dai boundary restano esclusi.
- `backend/internal-ai/server/lib/registry.config.js` — aggiunta di 6 entry parallele con `viewBindings` appropriati.
- `src/next/chat-ia/config/view.config.ts` — aggiornare `Site360.entryBoundaryIds` (cisterna, documenti) e `Ricerca360.entryBoundaryIds`.

**NON TOCCARE**
- `universal-resolver.js`, `universal-resolver-collection-root.js` (sono gia generici per `collection_root` dopo BLOCCO 4).
- `post-llm-resolver.js`, `shadow-comparator.js`.
- Resto frontend e domain.

### Output atteso
- 6 nuove entry boundary root operative con `allowedFields` 1:1 dai writer reali.
- 6 entry registry per documenti + Cisterna.
- View config aggiornato.

### Cancelli

**CANCELLO 1 — AUDIT**
- Comandi:
  - `rg -n "@documenti_mezzi|@documenti_magazzino|@documenti_generici|@documenti_cisterna|@cisterna_schede_ia|@cisterna_parametri_mensili" src backend` oppure, su PowerShell senza `rg`, `Get-ChildItem -Recurse -Include *.ts,*.tsx src | Select-String -Pattern "@documenti_mezzi|@documenti_magazzino|@documenti_generici|@documenti_cisterna|@cisterna_schede_ia|@cisterna_parametri_mensili"` per identificare writer reali.
  - per ciascuna root, identificare i campi scritti nei writer.
- PASS: 6 root identificate, mappa campi scritti compilata in chat.
- FAIL: stop. Riportare quali root non risultano scritte da nessun writer (potrebbero essere VUOTE).

**CANCELLO 2 — PATCH**
- 6 entry boundary nuove con `id` prefisso `firestore-<root-name>-root`. `forbiddenFields` includono `FIRESTORE_FREE_TEXT_FORBIDDEN_FIELDS` + `FIRESTORE_SENSITIVE_FORBIDDEN_FIELDS` SEMPRE.
- `allowedFields` mai un superset di quanto i writer scrivono.
- Nessun campo `*Url` ammesso (regola dell'audit URL).
- Stop in caso di errore o se i writer non sono identificabili senza ambiguita.

**CANCELLO 3 — TEST STATICI**
- `node --check` su `internal-ai-firebase-readonly-boundary.js` e `registry.config.js`.
- `npm run build`.
- FAIL: stop.

**CANCELLO 4 — BUILD**
- `npm run build`.

**CANCELLO 5 — TEST AUTOMATICI**
- Estensione `zero-invenzioni-tests.mjs`:
  - **T17**: per ciascuna delle 6 nuove entry root, `runUniversalResolverFaseA` ritorna `entries[0].accessModeUsed === "collection_root"`.
  - **T18**: nessun `*Url` in `allowedFields` delle 6 entry nuove.
  - **T19**: i `forbiddenFields` includono `FIRESTORE_FREE_TEXT_FORBIDDEN_FIELDS` e `FIRESTORE_SENSITIVE_FORBIDDEN_FIELDS`.
- PASS: T1..T19 PASS o DEFERRED.

**CANCELLO 6 — PLAYWRIGHT**
- PLAYWRIGHT = SKIP/DEFERRED.
- Motivo: il blocco prepara dati (root documenti + Cisterna + Euromecc registry), ma il routing intent naturale non e' ancora completo. L'LLM Action Router non sa ancora trasformare frasi naturali (es: "schede cisterna", "documenti mezzo", "stato euromecc") nella view corretta. I test E2E naturali vengono spostati al BLOCCO 8 dopo il completamento dell'intent runtime.

**CANCELLO 7 — REPORT**
- Schema standard, con dichiarazione esplicita: "Documenti/Cisterna/Euromecc UI non testata in questo blocco; test spostati a BLOCCO 8 dopo intent runtime."

### Condizione avanzamento
Se cancelli 1-5 e 7 = PASS (cancello 6 = SKIP/DEFERRED), procedere a BLOCCO 6.

### Condizione di stop
Stop su qualsiasi FAIL.

### Cosa resta fuori
- Relazioni complesse e incroci (BLOCCO 6).
- Pannello prove pieno (BLOCCO 7).

---

## §10 — BLOCCO 6: Relazioni e incroci

### Obiettivo
Introdurre `relation.config.ts` per dichiarare relazioni tra entita e un Relation Resolver deterministico backend che applica le regole del registro v0.6 (autista-mezzo, mezzo-rifornimento, mezzo-manutenzione, materiale-fornitore, ecc.). La regola D10 di `SPEC_CHAT_ZERO_INVENZIONI_NEXT.md` §8.2 resta invariata; questo blocco la estende ad altre relazioni con lo stesso pattern (chiavi forti exact, niente fuzzy).

### Agente
Codex (backend + frontend).

### Prerequisiti
BLOCCO 5 = PASS.

### Whitelist file
**CREA**
- `src/next/chat-ia/config/relation.config.ts` — dichiarativo: per ogni `RelationKindEnum`, sorgente, target, campi chiave, regola di certezza.
- `backend/internal-ai/server/lib/relation-resolver.js` — applica `relation.config.ts` proiezione machine-readable. Lavora SOLO su `CertifiedRecord` provenienti dal Resolver Universale.
- `backend/internal-ai/server/lib/relation.config.cjs` — proiezione CommonJS della config TS, generata manualmente. CHIUSO 2026-05-06: il backend consuma questa proiezione machine-readable tramite `relation-resolver.js` e non parsa il file `.ts`.
- (nota: `tests/e2e/19-relazioni.spec.ts` e' spostato alla whitelist CREA del BLOCCO 8 perche' richiede intent runtime completo).

**MODIFICA**
- `backend/internal-ai/server/lib/query-engine.js` — dopo lettura record, chiama `relation-resolver.js` per arricchire ciascun record con `relations: Array<RelationProof>`.
- `src/next/chat-ia/views/CertifiedView.tsx` — sezione "Relazioni certificate" che mostra le relazioni del record corrente. Riusa `CollapsibleProof` per la prova.
- `src/next/chat-ia/config/view.config.ts` — ogni `ViewConfig` puo' dichiarare `relationsToShow: Array<RelationKindEnum>`.

**NON TOCCARE**
- `src/next/chat-ia/relations/driverRelationResolver.ts` (legacy frontend; resta in coesistenza fino a BLOCCO 8).
- `Driver360.tsx` (resta sul percorso esistente).
- Resolver legacy, shadow comparator.
- Boundary, post-llm-resolver, catalog-validator, fingerprint-validator.
- Tool e agenti.
- Writer e domain reader.

### Output atteso
- `relation.config.ts` con almeno: `driver_vehicle`, `vehicle_refueling`, `vehicle_maintenance`, `material_supplier`, `site_equipment`.
- Backend Relation Resolver in azione: ciascuna entita mostrata nella vista porta eventuali relazioni certificate via `RelationProof`.
- Test T20-T23 introdotti (vedi cancello 5).

### Cancelli

**CANCELLO 1 — AUDIT**
- Comandi:
  - lettura `src/next/chat-ia/relations/driverRelationResolver.ts` per pattern legacy.
  - lettura `docs/product/REGISTRO_COLLECTION_FIRESTORE.md` sezione "Convenzioni evidence graph" e "Campi che creano relazione" di ciascuna collection.
- PASS: relazioni gia documentate identificate.
- FAIL: stop.

**CANCELLO 2 — PATCH**
- `relation.config.ts`: pattern unico per relazione, niente regole inline nel resolver.
- `relation-resolver.js`: deterministico. Mai fuzzy. Mai "match per nome simile". Mai deduzioni da campi liberi.
- Stop in caso di errore.

**CANCELLO 3 — TEST STATICI**
- `node --check` su backend.
- `npm run build`.

**CANCELLO 4 — BUILD**
- `npm run build`.

**CANCELLO 5 — TEST AUTOMATICI**
- Estensione `zero-invenzioni-tests.mjs`:
  - **T20**: `relation.config.ts` esiste, dichiara almeno 5 relazioni; ogni relazione cita campi chiave presenti nelle `allowedFields` del registry.
  - **T21**: `relation-resolver.js` non importa `tools/`, `agents/`, `domain/` (solo `registry.config.js` e `relation.config.cjs`).
  - **T22**: per relazione `driver_vehicle`, output identico al pattern di `driverRelationResolver.ts` (parita comportamentale su input sintetico).
  - **T23**: nessuna relazione marcata `certainty: "explicit_assignment"` o `"exact"` viene generata da fuzzy match.
- PASS: T1..T23 PASS o DEFERRED.

**CANCELLO 6 — PLAYWRIGHT**
- PLAYWRIGHT = SKIP/DEFERRED.
- Motivo: il blocco introduce relazioni certificate via `relation.config.ts` + `relation-resolver.js`, ma il routing intent naturale non e' ancora completo. L'LLM Action Router non sa ancora trasformare frasi naturali (es: "mezzo X con autista corrente", "rifornimenti del mezzo X") nella view corretta. I test E2E naturali vengono spostati al BLOCCO 8 dopo il completamento dell'intent runtime.

**CANCELLO 7 — REPORT**
- Schema standard, con dichiarazione esplicita: "Relazioni certificate UI non testate in questo blocco; test spostato a BLOCCO 8 dopo intent runtime."

### Condizione avanzamento
Se cancelli 1-5 e 7 = PASS (cancello 6 = SKIP/DEFERRED), procedere a BLOCCO 7.

### Condizione di stop
Stop su qualsiasi FAIL.

### Cosa resta fuori
- Pannello prove esteso, raggruppato (BLOCCO 7).
- Cleanup legacy, registry v1.0 (BLOCCO 8).

---

## §11 — BLOCCO 7: Pannello prove completo

### Obiettivo
Estendere `CollapsibleProof.tsx` (esistente) a un pannello prove completo: raggruppamento per record e per relazione, etichette leggibili, accessibility, link tecnico al boundary id, fallback "dato non trovato nelle fonti autorizzate".

### Agente
Codex (frontend).

### Prerequisiti
BLOCCO 6 = PASS.

### Whitelist file
**CREA**
- `src/next/chat-ia/components/ProofPanel.tsx` — nuovo componente piu' ricco; wrappa `CollapsibleProof.tsx`.
- `src/next/chat-ia/components/proofPanel.css` — CSS namespaced `proof-panel__*`.
- (nota: `tests/e2e/20-proof-panel.spec.ts` e' spostato alla whitelist CREA del BLOCCO 8 perche' richiede intent runtime completo).

**MODIFICA**
- `src/next/chat-ia/components/CollapsibleProof.tsx` — accetta props aggiuntive opzionali: `groupByRecord?: boolean`, `recordLabel?: string`, `emptyText?: string`. Default invariati per retrocompat.
- `src/next/chat-ia/views/CertifiedView.tsx` — usa `ProofPanel` invece di `CollapsibleProof` diretto.
- `src/next/chat-ia/views/Driver360.tsx` — sostituisce `CollapsibleProof` con `ProofPanel` mantenendo lo stesso comportamento per il caso singolo record (`AUDIT_READINESS_CHAT_IA_NEXT_2026-05-04.md` §4 lacuna 1: rimuovere il grezzo tecnico in `:53-78` e l'ID tecnico in `:193-196`).

**NON TOCCARE**
- Backend tutto.
- `view.config.ts`, `relation.config.ts`.
- Tool, agenti.
- Domain reader, writer.

### Output atteso
- `ProofPanel.tsx` operativo, collassato di default.
- `Driver360.tsx` non mostra piu' grezzo tecnico in primo piano (lacuna 1 e 2 dell'audit chiuse).
- `CertifiedView.tsx` mostra prove via `ProofPanel`.

### Cancelli

**CANCELLO 1 — AUDIT**
- Comandi:
  - lettura completa `CollapsibleProof.tsx`.
  - lettura completa `Driver360.tsx`.
- PASS: pattern noto.
- FAIL: stop.

**CANCELLO 2 — PATCH**
- `ProofPanel.tsx`: pattern unico riusato da tutte le viste.
- Default `collapsedByDefault = true`.
- `FORBIDDEN_FIELD_NAME_PATTERN` mantenuto e applicato.
- Stop in caso di errore.

**CANCELLO 3 — TEST STATICI**
- `npm run build`.
- FAIL: stop.

**CANCELLO 4 — BUILD**
- `npm run build`.

**CANCELLO 5 — TEST AUTOMATICI**
- Estensione `zero-invenzioni-tests.mjs`:
  - **T24**: `ProofPanel.tsx` esiste, importa `CollapsibleProof.tsx`.
  - **T25**: `Driver360.tsx` non contiene piu' i blocchi `<dl>...<dt>Provenienza</dt>` o equivalenti grezzo tecnico fuori da `ProofPanel`.
- PASS: T1..T25 PASS o DEFERRED.

**CANCELLO 6 — PLAYWRIGHT**
- PLAYWRIGHT = SKIP/DEFERRED.
- Motivo: il blocco introduce `ProofPanel.tsx` esteso e cleanup grezzo tecnico Driver360, ma il routing intent naturale non e' ancora completo. L'LLM Action Router non sa ancora trasformare frasi naturali nella view corretta per testare il pannello prove su flussi end-to-end. I test E2E naturali vengono spostati al BLOCCO 8 dopo il completamento dell'intent runtime.

**CANCELLO 7 — REPORT**
- Schema standard, con dichiarazione esplicita: "Pannello prove UI non testato runtime in questo blocco; test spostato a BLOCCO 8 dopo intent runtime."

### Condizione avanzamento
Se cancelli 1-5 e 7 = PASS (cancello 6 = SKIP/DEFERRED), procedere a BLOCCO 8.

### Condizione di stop
Stop su qualsiasi FAIL.

### Cosa resta fuori
- Cleanup, Playwright suite completa, promozione registro a v1.0 (BLOCCO 8).

---

## §12 — BLOCCO 8: Test finale + cleanup + Playwright + registro v1.0

### Obiettivo
Chiusura: cleanup legacy, suite Playwright completa, smoke chat E2E, promozione del registro v0.6 BOZZA -> v1.0 STABLE.

### Agente
Codex (backend + frontend + docs).

### Prerequisiti
BLOCCO 7 = PASS.

### Whitelist file
**CREA**
- `tests/e2e/17-euromecc360.spec.ts` — test Playwright Euromecc360 runtime (spostato da BLOCCO 4/5 dopo intent runtime).
- `tests/e2e/18-documenti-cisterna.spec.ts` — test Playwright documenti e Cisterna runtime (spostato da BLOCCO 5 dopo intent runtime).
- `tests/e2e/19-relazioni.spec.ts` — test Playwright relazioni certificate runtime (spostato da BLOCCO 6 dopo intent runtime).
- `tests/e2e/20-proof-panel.spec.ts` — test Playwright pannello prove completo (spostato da BLOCCO 7 dopo intent runtime).
- `tests/e2e/21-chat-ia-smoke.spec.ts` — smoke test E2E di tutte le 5 viste piu' fallback "intent non in catalogo".

**MODIFICA**
- `backend/internal-ai/server/internal-ai-adapter.js` — Modificabile SOLO per estensione intent routing (CANCELLO 0). Nessun refactor funzionale autorizzato.
- `backend/internal-ai/server/lib/catalog-validator.js` — Modificabile SOLO per estensione intent routing (CANCELLO 0). Nessun refactor funzionale autorizzato.
- `backend/internal-ai/server/lib/chat-zero-preflight.js` — Modificabile SOLO per estensione intent routing (CANCELLO 0). Nessun refactor funzionale autorizzato.
- `src/next/chat-ia/core/chatIaTypes.ts` — Modificabile SOLO se servono nuovi enum per intent routing (CANCELLO 0). Nessun refactor funzionale autorizzato.
- `backend/internal-ai/server/lib/post-llm-resolver.js` — Aggiungere commento `@deprecated` nel header del file. Loggare warning SOLO se il vecchio resolver viene effettivamente invocato tramite fallback automatico o env `CHAT_IA_LEGACY_RESOLVER=1`, non all'import. NON rimosso (cf. `SPEC_MOTORE_GENERICO_NEXT.md` §10.1 fase E: "rimozione solo dopo zero chiamanti"). Lo switch in `internal-ai-adapter.js` resta: il default Universale per Driver360 esiste gia' dal lavoro precedente (PROMPT 28); le viste non-Driver360 vengono instradate dal `resolveByViewBinding` introdotto in BLOCCO 3.
- `backend/internal-ai/server/lib/shadow-comparator.js` — Aggiungere commento `@deprecated` nel header del file. Loggare warning SOLO se invocato tramite env `CHAT_IA_SHADOW_RESOLVER=1`, non all'import. Resta come strumento diagnostico.
- `src/next/chat-ia/relations/driverRelationResolver.ts` — Aggiungere commento `@deprecated` nel header del file. Loggare warning SOLO se la funzione viene effettivamente chiamata, non all'import. Redirige al nuovo backend `relation-resolver.js` per coerenza (DA VERIFICARE: la deprecation richiede che tutte le chiamate frontend al vecchio file siano gia state spostate su `CertifiedView.tsx` in BLOCCO 6).
- `docs/product/REGISTRO_COLLECTION_FIRESTORE.md` — promozione a v1.0 STABLE: aggiornare header, rimuovere "BOZZA", aggiungere annotazione di promozione 2026-05-XX (sostituire con la data reale di esecuzione).
- `docs/product/SPEC_MOTORE_GENERICO_NEXT.md` — promozione a v1.0 STABLE.
- `package.json` — script `chat-ia:diagnostics` presente e funzionante: `"chat-ia:diagnostics": "node backend/internal-ai/server/lib/__diagnostics__/zero-invenzioni-tests.mjs"` (CHIUSO 2026-05-06).
- `docs/STATO_ATTUALE_PROGETTO.md` — aggiornare con stato post-esecuzione piano (chat IA NEXT chiusa o parziale, viste operative, moduli coperti). Se il file non esiste al momento dell'esecuzione, Codex si ferma e dichiara `SERVE FILE EXTRA: docs/STATO_ATTUALE_PROGETTO.md`. Non creare documenti di stato ufficiali con contenuto minimo a caso.
- `docs/product/STATO_MIGRAZIONE_NEXT.md` — aggiornare sezione chat IA con stato post-piano. Se il file non esiste al momento dell'esecuzione, Codex si ferma e dichiara `SERVE FILE EXTRA: docs/product/STATO_MIGRAZIONE_NEXT.md`. Non creare documenti di stato ufficiali con contenuto minimo a caso.
- `docs/_live/REGISTRO_MODIFICHE_CLONE.md` — aggiungere entry datata con riepilogo modifiche piano esecutivo (append-only, mai riscrittura). Se il file non esiste al momento dell'esecuzione, Codex si ferma e dichiara `SERVE FILE EXTRA: docs/_live/REGISTRO_MODIFICHE_CLONE.md`. Non creare documenti di stato ufficiali con contenuto minimo a caso.

**NON TOCCARE**
- Tutti i file gia non toccabili nei blocchi precedenti restano vietati, TRANNE i file esplicitamente elencati nella whitelist MODIFICA del BLOCCO 8. Le deroghe del BLOCCO 8 sono limitate alle annotazioni/deprecation previste e non autorizzano refactor o modifiche funzionali.
- `CLAUDE.md`, `.claude/**`, `.vscode/**`.
- Configurazioni MCP/skills.

### Output atteso
- Suite Playwright completa che copre i 5 viewKind + fallback.
- Legacy resolvers chiaramente marcati come DEPRECATI.
- Registro e Spec promossi a v1.0 STABLE solo se non restano `DA VERIFICARE` bloccanti.
- Se restano `DA VERIFICARE` bloccanti: Registro e Spec restano BOZZA/v0.x, con lista residua nel report finale.

### Cancelli

**CANCELLO 0 — INTENT RUNTIME OPERATIVO**
Prima del Playwright finale, Codex deve verificare e, se necessario, estendere il routing intent per supportare le frasi naturali minime. E' il primo cancello del BLOCCO 8 e abilita tutti i Playwright successivi.

Audit:
- Leggere `backend/internal-ai/server/lib/catalog-validator.js` per capire come vengono classificati gli intent oggi.
- Leggere `backend/internal-ai/server/lib/chat-zero-preflight.js` per capire il pre-processing.
- Leggere lo schema strict OpenAI in `backend/internal-ai/server/internal-ai-adapter.js` per capire quali view/action sono dichiarate.
- Leggere `src/next/chat-ia/core/chatIaTypes.ts` per `ViewEnum`.

Frasi minime da supportare:
- "profilo <autista>" -> `Driver360`
- "mezzo <targa>" -> `Vehicle360`
- "documenti mezzo <targa>" -> `Site360` o `Vehicle360` con sezione documenti
- "schede cisterna" -> `Site360`
- "stato euromecc" -> `Euromecc360`
- "rifornimenti <targa>" -> `Vehicle360` con sezione rifornimenti
- "manutenzioni <targa>" -> `Vehicle360` con sezione manutenzioni
- "ricerca <testo>" -> `Ricerca360`

Patch (se necessaria):
- Modificare i file strettamente necessari per far arrivare le frasi alla view corretta. I file candidati sono:
  - `backend/internal-ai/server/internal-ai-adapter.js` (schema strict / prompt)
  - `backend/internal-ai/server/lib/catalog-validator.js` (validazione intent)
  - `backend/internal-ai/server/lib/chat-zero-preflight.js` (pre-processing)
  - `src/next/chat-ia/core/chatIaTypes.ts` (se servono nuovi enum)
- NON inventare intent. Basarsi sulle frasi minime sopra.
- NON modificare il resolver, il boundary, il query engine o le viste.
- Se la patch richiede file fuori da questa lista: `SERVE FILE EXTRA: <path>`.

PASS: le 8 frasi minime vengono classificate correttamente (verificabile con test programmatico o smoke Playwright preliminare).
FAIL: stop.

**CANCELLO 1 — AUDIT**
- Comandi:
  - controllo che tutti i blocchi precedenti siano marcati PASS nei rispettivi report.
  - `Select-String -Path "src" -Pattern "driverRelationResolver" -Recurse` per identificare chiamanti residui.
- PASS: zero chiamanti residui di `driverRelationResolver.ts` (eccetto il file stesso).
- FAIL: stop.

**CANCELLO 2 — PATCH**
- Annotazioni di deprecation con messaggio chiaro: "Sostituito dal motore generico v1; questo modulo verra' rimosso nella prossima major" + riferimento a BLOCCO 8 di questo piano.
- Promozione doc: append-only, mai cancellazione di entry storiche.
- **Promozione registro condizionata.** Promuovere `docs/product/REGISTRO_COLLECTION_FIRESTORE.md` a v1.0 STABLE solo se non restano voci `DA VERIFICARE` bloccanti nel piano esecutivo. Se restano `DA VERIFICARE` aperti, mantenere versione v0.x e generare lista residua nel report del BLOCCO 8 (sezione "cosa resta fuori"). La stessa condizione vale per la promozione di `docs/product/SPEC_MOTORE_GENERICO_NEXT.md` a v1.0 STABLE.
- Stop in caso di errore.

**CANCELLO 3 — TEST STATICI**
- `node --check` su tutti i file backend toccati.
- `npm run build`.
- FAIL: stop.

**CANCELLO 4 — BUILD**
- `npm run build`. Stesse regole.

**CANCELLO 5 — TEST AUTOMATICI**
- Estensione `zero-invenzioni-tests.mjs`:
  - **T26**: `package.json` ha lo script `chat-ia:diagnostics`.
  - **T27**: `post-llm-resolver.js` contiene il marker `@deprecated`.
  - **T28**: test condizionale promozione registro.
    Prima del test, Codex calcola `daVerificareBloccanti` contando le voci "DA VERIFICARE" ancora aperte nel piano (grep sul file MD stesso).
    - Se `daVerificareBloccanti === 0`: verificare che `docs/product/REGISTRO_COLLECTION_FIRESTORE.md` ha header `Versione: 1.0`. PASS se presente.
    - Se `daVerificareBloccanti > 0`: verificare che `docs/product/REGISTRO_COLLECTION_FIRESTORE.md` ha ANCORA header con `BOZZA` e che Codex prepara la lista residua da inserire nel report del CANCELLO 7. PASS se il registro e' ancora BOZZA.
    Il test verifica la COERENZA tra stato `DA VERIFICARE` e versione registro.
- PASS: T1..T28 PASS o DEFERRED. Eseguire anche `node backend/internal-ai/server/lib/__diagnostics__/shadow-validation-report.mjs` come baseline regressionale.

**CANCELLO 6 — PLAYWRIGHT**
- Suite completa Playwright esistente + 5 nuovi spec creati nel BLOCCO 8 (vale la "Policy test Playwright" definita in §4):
  - `tests/e2e/17-euromecc360.spec.ts`: prompt "stato euromecc" -> assert vista `Euromecc360` con sezioni dichiarate da `view.config.ts`; pannello prove collassato.
  - `tests/e2e/18-documenti-cisterna.spec.ts`: prompt "schede cisterna" -> assert vista `Site360` con sezione cisterna; prompt "documenti mezzo <plate runtime anonimizzata>" -> assert vista mostra documenti certificati senza URL firmati.
  - `tests/e2e/19-relazioni.spec.ts`: prompt "mezzo <plate runtime anonimizzata>" -> assert relazione mostrata con `relationProof` dentro pannello prove; prompt "rifornimenti <plate runtime anonimizzata>" -> assert sezione rifornimenti + relazione mezzo certificata.
  - `tests/e2e/20-proof-panel.spec.ts`: assert pannello prove presente e collassato di default su Driver360 (record runtime anonimizzato), Vehicle360 (con relazione), Site360, Euromecc360, Ricerca360. Struttura "Provenienza" e "Relazione" presenti, MAI con campi `note|telefono|url`.
  - `tests/e2e/21-chat-ia-smoke.spec.ts`: per ciascuna vista `Driver360 | Vehicle360 | Site360 | Euromecc360 | Ricerca360` prompt naturale (intent runtime CANCELLO 0), assert vista corretta montata, pannello prove collassato, nessun `message.text` libero. Prompt "asdfghjkl" (intent non in catalogo): assert `accompaniment.kind === "error_intent_not_in_catalog"` con frase parametrica.
- Comando: `npm run test:e2e`.
- **Criteri PASS obbligatori (tutti devono essere verificati da Playwright; se anche UNO fallisce, BLOCCO 8 = FAIL):**
  - nessun `message.text` libero visibile nella card principale;
  - nessun URL firmato Firebase Storage visibile nella risposta;
  - nessun `sourceRecordId` o `sourceField` visibile nella card principale (devono restare dentro il pannello prove collassato);
  - pannello prove presente e collassato di default;
  - fallback `no_results` pulito (testo parametrico, niente grezzo tecnico).
- PASS: tutti i test E2E (esistenti + 6 nuovi BLOCCO 2-8) verdi E tutti i 5 criteri sopra verificati.

**CANCELLO 7 — REPORT**
- Output strutturato finale:
  1. `BLOCCO 8: PASS` o `FAIL`.
  2. file toccati totali nel turno.
  3. test esiti aggregati T1..T28.
  4. build esito.
  5. cosa resta fuori: tutto cio' che e' rinviato a v1.1 (`SPEC_MOTORE_GENERICO_NEXT.md` §11 e §12: PDF da template, smantellamento multi-agente, periodPreset esteso, cache `collection_root`).
  6. STATO FINALE (condizionato):
     - Se zero `DA VERIFICARE` bloccanti E tutti i Playwright passano E registro e spec sono promossi a v1.0: "Chat IA NEXT chiusa come modale intelligente del gestionale per le 5 viste 360."
     - Altrimenti: "Chat IA NEXT operativa parziale controllata. Vedi lista `DA VERIFICARE` residui e test DEFERRED."

### Condizione avanzamento
Non c'e' BLOCCO 9. Il turno e' chiuso.

### Condizione di stop
Stop su qualsiasi FAIL.

### Cosa resta fuori
- Tutto cio' che e' rinviato a v1.1 secondo `SPEC_MOTORE_GENERICO_NEXT.md` §11 e §12.

---

## §13 Regola di esecuzione automatica

Codex deve eseguire BLOCCO 1 -> BLOCCO 2 -> BLOCCO 3 -> BLOCCO 4 -> BLOCCO 5 -> BLOCCO 6 -> BLOCCO 7 -> BLOCCO 8 nello stesso turno operativo.

Ma SOLO se ogni cancello del blocco precedente e' PASS.

Se un blocco ha un cancello FAIL, Codex si ferma e riporta:
- blocco fallito (numero e titolo);
- cancello fallito (1..7 per i BLOCCHI 1-7; 0..7 per il BLOCCO 8 che ha CANCELLO 0 INTENT RUNTIME aggiuntivo in testa);
- motivo (output del comando, errore tsc, divergenza test);
- evidenza (path repo + linea quando applicabile);
- cosa serve per sbloccare (decisione richiesta a Giuseppe + GPT + Claude).

**Esecuzione parziale controllata.** Codex deve tentare l'esecuzione sequenziale completa BLOCCO 1 -> BLOCCO 8. Se il contesto, il tempo o i tool non bastano per completare tutti i blocchi, Codex deve fermarsi all'ultimo blocco completato con tutti i cancelli PASS e dichiarare: "ESECUZIONE PARZIALE CONTROLLATA — ultimo blocco PASS: N. Blocchi rimanenti: N+1..8." Non forzare patch per arrivare in fondo. Non inventare per completare. Questa regola e' aggiuntiva: non sostituisce la regola di stop su FAIL.

NOTA: il piano NON viene eseguito in questo prompt. L'esecuzione avverra' dopo validazione GPT + Claude, con un prompt operativo separato del tipo: "Leggi `docs/product/PIANO_ESECUTIVO_CHAT_IA_NEXT.md` ed esegui i blocchi in ordine. Ogni blocco ha cancelli. Se un cancello passa, prosegui. Se un cancello fallisce, fermati e riporta il blocco fallito."

---

## §14 Governance aggiornamenti futuri

Regola fissa per aggiungere nuova collection o nuovo campo al motore:
1. **Registro**: aggiungere voce in `docs/product/REGISTRO_COLLECTION_FIRESTORE.md` con `allowedFields` e `forbiddenFields` proposti, alias, match rules.
2. **Boundary**: aggiungere o estendere entry in `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js`.
3. **Config**: aggiungere entry in `backend/internal-ai/server/lib/registry.config.js` con `viewBindings` e in `src/next/chat-ia/config/view.config.ts` se la vista cambia.
4. **Test**: estendere `backend/internal-ai/server/lib/__diagnostics__/zero-invenzioni-tests.mjs` con T-NEW dedicato; estendere E2E Playwright se la vista cambia.

Niente patch a caso. Mai un campo nuovo in registry senza prima boundary. Mai una vista nuova senza prima registry.

Le regole di match Zero-Invenzioni (`docs/product/REGISTRO_COLLECTION_FIRESTORE.md` "Regole valori") NON possono essere indebolite senza decisione esplicita in `docs/DIARIO_DECISIONI.md`.

---

## §15 Glossario tecnico

- **`sourceCollection`**: path Firestore del documento sorgente (`storage/@<dataset>` per `exact_document`, `<rootName>` per `collection_root`).
- **`sourceRecordId`**: id del record certificato all'interno della collection sorgente.
- **`sourceField`**: nome del campo sorgente del valore mostrato. Mai un campo libero (`note`, `descrizione`).
- **`allowedField`**: flag derivato; `true` se il campo appare in `allowedFields` della entry boundary corrispondente.
- **`forbiddenField`**: campo dichiarato in `forbiddenFields` di entry boundary o nelle costanti globali (`FIRESTORE_FREE_TEXT_FORBIDDEN_FIELDS`, `FIRESTORE_SENSITIVE_FORBIDDEN_FIELDS`).
- **`relationProof`**: shape (`relationKind`, `sourceCollection`, `sourceRecordId`, `sourceField`, `rule`, `certainty`) richiesta per ogni relazione visualizzata; cf. `src/next/chat-ia/core/chatIaTypes.ts:423-435`.
- **`provenance`**: shape `RecordProvenance` (`sourceCollection`, `sourceRecordId`, `sourceFields`, `accessModeUsed`, `boundaryEntryId`, `confidence`); cf. `SPEC_MOTORE_GENERICO_NEXT.md` §5.3.
- **`accessMode`**: enum boundary: `exact_document`, `collection_root`, `exact_object_path_from_firestore_field`.
- **`exact_document`**: lettura di un singolo documento `storage/@<dataset>`. Filtro su `allowedFields`.
- **`collection_root`**: lettura listata di una root collection (no `storage/`). Filtro su `allowedFields`, cap `requestLimits`.
- **`CertifiedRecord`**: shape (`sourceRecordId`, `fields: Record<string, CertifiedField>`, `provenance`); cf. `SPEC_MOTORE_GENERICO_NEXT.md` §5.3.
- **`ViewConfig`**: dichiarativo, vive in `src/next/chat-ia/config/view.config.ts` (BLOCCO 2).
- **`QueryEngine`**: orchestratore deterministico dichiarato in `backend/internal-ai/server/lib/query-engine.js` (BLOCCO 1).
- **`boundary readonly`**: contratto unico di accesso Firestore/Storage del motore generico; `internal-ai-firebase-readonly-boundary.js`.
