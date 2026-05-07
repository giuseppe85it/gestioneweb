# AUDIT INDIPENDENTE — CHIUSURA CHAT IA NEXT V1 — 2026-05-06

## Stato del documento
- Tipo: audit indipendente di sola lettura.
- Operatore: Claude Code.
- Range git: `86d657de..141ff762` (CHECKPOINT-A → finale documentale).
- Commit nel range: `a9ee7c50` "chiusura #10 — migrazione Driver360 a relation resolver backend"; `141ff762` "chiusura ChatIA NEXT V1 100 documentazione finale".
- Continuita: vedi `docs/audit/AUDIT_INDIPENDENTE_BLOCCO_8_C6_2026-05-06.md` per il dubbio precedente sull'adapter.
- Nessuna patch applicata. Nessuna esecuzione di build/Playwright/diagnostics. Nessuna promozione.

---

## Sezione 1 — Perimetro e range commit

### File modificati nel range
Da `git diff --name-status 86d657de..141ff762` (13 file):

| File | Stato | numstat (+/-) |
|---|---|---|
| `backend/internal-ai/server/internal-ai-adapter.js` | M | 78 / 5 |
| `docs/_live/REGISTRO_MODIFICHE_CLONE.md` | M | 8 / 0 |
| `docs/_live/STATO_ATTUALE_PROGETTO.md` | M | 1 / 0 |
| `docs/_live/STATO_MIGRAZIONE_NEXT.md` | M | 10 / 0 |
| `docs/audit/REPORT_CHIUSURA_CHATIA_NEXT_100_2026-05-06.md` | M | 88 / 62 |
| `docs/audit/REPORT_ZERO_INVENZIONI_TESTS_2026-05-04.md` | M | 1 / 1 |
| `docs/product/PIANO_ESECUTIVO_CHAT_IA_NEXT.md` | M | 13 / 11 |
| `docs/product/REGISTRO_COLLECTION_FIRESTORE.md` | M | 4 / 4 |
| `docs/product/SPEC_MOTORE_GENERICO_NEXT.md` | M | 8 / 6 |
| `src/next/chat-ia/relations/driverRelationResolver.ts` | **D** | 0 / 124 |
| `src/next/chat-ia/views/Driver360.tsx` | M | 155 / 173 |
| `tests/e2e/20-proof-panel.spec.ts` | M | 9 / 7 |
| `tests/e2e/21-chat-ia-smoke.spec.ts` | M | 11 / 7 |

### Confronto con perimetro atteso (chiusure #10 + #13 + #12)
- `internal-ai-adapter.js`, `Driver360.tsx`, `driverRelationResolver.ts` (delete), `20-proof-panel.spec.ts`, `21-chat-ia-smoke.spec.ts`: attesi per **#10**.
- `PIANO_ESECUTIVO_CHAT_IA_NEXT.md`: atteso per **#13** (DEFERRED_OK doc) e **#12** (chiusure documentali).
- `REGISTRO_COLLECTION_FIRESTORE.md`, `SPEC_MOTORE_GENERICO_NEXT.md`: attesi per **#12** (promozione v1.0 STABLE).
- `REPORT_CHIUSURA_CHATIA_NEXT_100_2026-05-06.md`: atteso (report finale Codex).
- `REPORT_ZERO_INVENZIONI_TESTS_2026-05-04.md`: AUTOMATICO (output `chat-ia:diagnostics`, 1 riga modificata, vedi Sezione 2 dell'audit precedente per il pattern).
- `docs/_live/STATO_*.md`, `docs/_live/REGISTRO_MODIFICHE_CLONE.md`: attesi (documenti di stato live).

### Verdetto perimetro
**OK**. Tutti e 13 i file sono giustificati dalla whitelist attesa per il completamento delle voci #10, #13, #12. Nessuna VIOLAZIONE PERIMETRO.

---

## Sezione 2 — Adapter, delta misurato + localizzazione

### Misura delta nel range
Da `git diff --numstat 86d657de..141ff762`:
- Aggiunte: **78**.
- Rimosse: **5**.
- Netto: **73**.

Confronto con dichiarazione Codex ("78 aggiunte, 5 rimosse, netto 73, localizzato Driver360"): **CONFERMATA esattamente**.

### Funzioni modificate / nuove
Dal diff (`backend/internal-ai/server/internal-ai-adapter.js`):

Funzioni nuove (4):
- `readCertifiedText(record, fieldName)` — utility lettura campo string da `CertifiedRecord.fields`.
- `recordMatchesDriver360(record, entry, driverId, driverBadge)` — match SOLO su `boundaryEntryId === "firestore-storage-mezzi-aziendali-doc"` o `"firestore-storage-autisti-sessioni-attive-doc"`.
- `filterDriver360RelationEntries(result, driverContext)` — filtra `entry.records[].relations` con `relationKind === "driver_vehicle"`.
- `resolveDriver360RelationEntries(message, options, candidateResult, driverId)` — chiama `runQueryEngine` SOLO sulle entry `vehicles.mezziAziendali` e `sessions.autistiSessioneAttive`.

Funzione modificata (1):
- `buildUniversalDriver360Message(message, driverId)` → `buildUniversalDriver360Message(message, candidateResult, driverId, relationEntries = [])` — firma estesa con `candidateResult` e `relationEntries`. Costruisce ora `resolvedFilters.v2` invece di `{ driverId }` legacy single-record.

Funzione invariata nella firma, modificata internamente (1):
- `resolveWithUniversalResolverFaseA` — aggiunge una linea `const relationEntries = await resolveDriver360RelationEntries(...)` e aggiorna la chiamata a `buildUniversalDriver360Message`.

### Verifica perimetro Driver360-only
- Le 4 nuove funzioni sono prefissate `Driver360`/`recordMatches`/`readCertifiedText` e operano SOLO con `boundaryEntryId` Driver360-specifici.
- La modifica di `resolveWithUniversalResolverFaseA` e' all'interno del branch gia condizionato `view !== "Driver360" || filters.entityKind !== "driver" -> return` (riga 1163-1166 del file, verificata in audit precedente).
- Le viste Vehicle/Site/Euromecc/Ricerca passano da `resolveByViewBinding` (introdotto in BLOCCO 3, gia in CHECKPOINT-A) e NON sono toccate da questo diff.
- Schema strict OpenAI, `Catalog Validator`, fallback `error_intent_not_in_catalog` (`normalizeOutOfCatalogFallbackResolution`): NON toccati nel range.

### Verdetto adapter
**LOCALIZZATA_DRIVER360**. Delta confermato 78/5/73. Le 4 funzioni nuove + la firma estesa di `buildUniversalDriver360Message` operano esclusivamente nel branch Driver360. Nessuna modifica strutturale alla pipeline di classificazione intent generale o al routing condiviso con altre viste.

---

## Sezione 3 — driverRelationResolver, eliminazione e residui

### Eliminazione del file
- `git diff --name-status 86d657de..141ff762` riga `D	src/next/chat-ia/relations/driverRelationResolver.ts`.
- `git diff --numstat 86d657de..141ff762` riga `0	124	src/next/chat-ia/relations/driverRelationResolver.ts` (124 righe rimosse).
- Verifica filesystem: `test -f src/next/chat-ia/relations/driverRelationResolver.ts` → `NON ESISTE`.

### Residui simboli (`driverRelationResolver`, `resolveDriverVehicleRelations`)
- `grep src/`: **0 match**.
- `grep tests/`: **0 match**.
- `grep backend/`: **1 match** in `backend/internal-ai/server/lib/__diagnostics__/zero-invenzioni-tests.mjs:750`. Riga letta: `if (source.includes("driverRelationResolver")) { return makeResult("T25", "FAIL", "Driver360 chiama ancora il resolver relazioni legacy frontend"); }`. **Questo NON e' un consumer**: e' un test difensivo (T25) che VERIFICA l'assenza della stringa nel sorgente di `Driver360.tsx`. Conferma operativa della chiusura.
- Nessun barrel `index.ts` re-esporta i simboli (verificato per assenza di match in `src/`).

### Verdetto
**ELIMINATO_PULITO**. File rimosso, nessun consumer residuo, l'unica menzione restante e' un test difensivo che verifica l'assenza.

---

## Sezione 4 — Non-toccati (verifica)

Da `git diff 86d657de..141ff762 -- <file>` su ciascuno (0 righe diff = NON_TOCCATO):

| File | Stato nel range |
|---|---|
| `backend/internal-ai/server/lib/relation.config.cjs` | **NON_TOCCATO** |
| `backend/internal-ai/server/lib/relation-resolver.js` | **NON_TOCCATO** |
| `backend/internal-ai/server/lib/query-engine.js` | **NON_TOCCATO** |
| `backend/internal-ai/server/lib/registry.config.js` | **NON_TOCCATO** |
| `tests/e2e/15-vehicle360.spec.ts` | **NON_TOCCATO** |
| `backend/internal-ai/server/lib/catalog-validator.js` | **NON_TOCCATO** |

Confermato dalla lista `name-status` di Sezione 1 (nessuno di questi 6 path appare). Coerente con la dichiarazione Codex: `relation.config.cjs aveva gia' driver_vehicle, NON modificato`.

---

## Sezione 5 — Test 20 e 21 (integrita dopo #10)

### Test 20 (`tests/e2e/20-proof-panel.spec.ts`)
Diff nel range: 9 aggiunte / 7 rimosse, tutte concentrate nella funzione `getRuntimeDriverNameWithRelation`:
- Prima: cercava driver con `autistaId` esplicito su `@mezzi_aziendali`.
- Dopo: cerca driver con `badgeAutista` su `@autisti_sessione_attive` (regola D10 "active_session" della SPEC §8.2).

| Domanda | Risposta + citazione |
|---|---|
| 5a Asserzione vista Driver360 montata? | SI, INVARIATA. `await expect(message.locator("[data-driver360]")).toHaveCount(1, { timeout: 45000 });` (riga 38, fuori del diff). |
| 5b `requireProof` Driver360 ancora `true`? | SI, INVARIATA. `test("pannello prove collassato su Driver360", async ({ page }) => { ... await askAndAssertProof(page, ..., "[data-driver360]", { requireProof: true, waitForDriver: true });` (riga 90-97, fuori del diff). |
| 5c Nuovi `test.skip` su Driver360? | NO. L'unico `test.skip(!driverName, ...)` (riga 92) esisteva gia. |
| 5d `waitForTimeout` statici? | NO. Nessuna occorrenza. |
| 5e try/catch mascheranti? | NO. Nessuna occorrenza. |
| 5f `assertNoFreeAssistantTextLeak` su Driver360? | NO (test 20 non lo usa direttamente, ma usa `expect(message.innerText()).not.toMatch(/sourceRecordId\|sourceField\|https:\/\/firebasestorage/i)` riga 76, fuori del diff). |
| 5g Anti-leak attivo? | SI. Riga 76 (fuori del diff). Riga 60 `expect(...).not.toMatch(/note\|telefono\|url/i)` invariata. |

Verdetto Test 20: **INTEGRI**. La modifica e' chirurgica (solo lettura di runtime per anonymized data, regola D10 "active_session" sostituisce regola D10 "autistaId_explicit"). Nessuna asserzione e' stata indebolita.

### Test 21 (`tests/e2e/21-chat-ia-smoke.spec.ts`)
Diff nel range: 11 aggiunte / 7 rimosse, stessa logica del test 20 sulla funzione `runtimeDriverNameWithRelation`.

| Domanda | Risposta + citazione |
|---|---|
| 5a Asserzione vista Driver360 montata? | SI, INVARIATA. Nel loop `cases` (riga 78): `{ prompt: profilo autista ${driverName}, selector: "[data-driver360]", requireProof: true, waitForDriver: true }`. |
| 5b `requireProof` Driver360 ancora `true`? | SI, INVARIATA. Riga 79 esplicita `requireProof: true`. |
| 5c Nuovi `test.skip` su Driver360? | NO. `test.skip(!plate || !relationPlate || !driverName, ...)` (riga 76) esisteva gia. |
| 5d `waitForTimeout` statici? | NO. |
| 5e try/catch mascheranti? | NO. |
| 5f `assertNoFreeAssistantTextLeak` su Driver360? | SI. Riga 62 dentro `assertSmokeMessage` (fuori del diff): `await assertNoFreeAssistantTextLeak(message);`. |
| 5g Anti-leak attivo? | SI. Riga 63 (fuori del diff): `expect(await message.innerText()).not.toMatch(/sourceRecordId\|sourceField\|https:\/\/firebasestorage/i);`. |

Verdetto Test 21: **INTEGRI**. La modifica e' simmetrica al test 20, chirurgica, nessuna asserzione indebolita.

---

## Sezione 6 — Header versioni Registro/SPEC

| File | Header trovato | Atteso | Verdetto |
|---|---|---|---|
| `docs/product/REGISTRO_COLLECTION_FIRESTORE.md` riga 4 | `Versione: 1.0 STABLE — 2026-05-06` | `Versione: 1.0 STABLE — 2026-05-06` | **MATCH** |
| `docs/product/SPEC_MOTORE_GENERICO_NEXT.md` riga 5 | `Versione: v1.0 STABLE — 2026-05-06` | `Versione: v1.0 STABLE — 2026-05-06` | **MATCH** |
| `docs/product/SPEC_CHAT_ZERO_INVENZIONI_NEXT.md` riga 6 | `**Versione:** 1.0`, riga 9 `**Stato:** BOZZA` | NON promossa, ancora BOZZA | **ANCORA_BOZZA** (la versione e' 1.0 ma stato BOZZA, coerente con dichiarazione Codex) |

Annotazioni 2026-05-06 verificate in entrambi gli header promossi:
- Registro riga 7: "matrice chiusura Chat IA NEXT completata per V1; C6/C7 BLOCCO 8 PASS, Playwright 17-21 PASS 10/10, diagnostics T1..T28 PASS, #4 chiusa con Opzione A, #13 classificata `DEFERRED_OK`."
- SPEC Motore riga 8: "matrice chiusura Chat IA NEXT completata per V1; Registro promosso a 1.0 STABLE, C6/C7 PASS, Playwright 17-21 PASS 10/10, diagnostics T1..T28 PASS, #4 chiusa con Opzione A, #13 `DEFERRED_OK`."

---

## Sezione 7 — Leak frontend Driver360

### Match grezzi
- `grep "sourceRecordId|sourceField|firebasestorage|alt=media|token="` su `src/next/chat-ia/views/Driver360.tsx`: 12 match.
- Stesso pattern su `src/next/chat-ia/components/`: 6 match in `ProofPanel.tsx` + `CollapsibleProof.tsx`.
- Stesso pattern su `src/next/chat-ia/views/`: ulteriori match in `CertifiedView.tsx`.

### Classificazione dei match
Tutti i match sono di **tipo dichiarazione TypeScript** o **passaggio interno al pannello prove**:
- Righe 17, 24, 25, 37, 41, 42 di `Driver360.tsx`: `type CertifiedField`, `type CertifiedRelationProof`, `type CertifiedRecord` → definizioni di tipo.
- Righe 143-144, 264-265, 273-274 di `Driver360.tsx`: passaggio di `proof.sourceRecordId`/`proof.sourceField` come property al componente `ProofPanel` (riga 260-280, dentro `renderRelationProof`).
- `CollapsibleProof.tsx:48` rende dentro `<details data-relation-proof open={!collapsedByDefault}>` con `collapsedByDefault = true` di default → SEMPRE chiuso al primo render.

### Rendering UI principale di Driver360 (righe 303-342)
- Sezione "Anagrafica certificata": `state.driver.nome`, `state.driver.badge` (campi certificati derivati da `readFieldText`, riga 192-193). Nessun `sourceRecordId`/`sourceField` esposto.
- Sezione "Stato mezzo attuale": `relation.vehiclePlate` (campo certificato `targa`/`targaMotrice`/etc) + `renderRelationProof(relation)` che monta `ProofPanel` collassato.
- Nessun pattern `firebasestorage`/`alt=media`/`token=` (verificato grep, 0 match).

### Verdetto
**NESSUN_LEAK** in UI principale. I `sourceRecordId`/`sourceField` sono confinati al pannello prove `<details>` collassato di default (verificato in audit precedente: `CollapsibleProof.tsx:48` `open={!collapsedByDefault}` con default true).

---

## Sezione 8 — view.config.ts nel range 86d657de..141ff762

Da `git diff --name-status 86d657de..141ff762`: `src/next/chat-ia/config/view.config.ts` **NON appare nella lista**.
Da `git diff 86d657de..141ff762 -- src/next/chat-ia/config/view.config.ts`: 0 righe diff.

Conferma: la modifica di `view.config.ts` appartiene alla chiusura #6 ed e' gia inclusa in CHECKPOINT-A (`86d657de`). Non e' stata ulteriormente modificata in questo range.

### Verdetto
**NON_TOCCATO_NEL_RANGE**. Coerente con dichiarazione Codex ("`view.config.ts` modificato nella chiusura #6, quindi deve essere già incluso in CHECKPOINT-A").

---

## Sezione 9 — Chiusura #10 (sostanziale)

Verifica su `src/next/chat-ia/views/Driver360.tsx` attuale:

| Check | Verdetto + citazione |
|---|---|
| 9a Non importa piu' `driverRelationResolver`? | **CONFERMATO**. Riga 1-9 import: `useState`, `chatIaTypes`, `ProofPanel`, `driver360.css`. Nessun import da `relations/driverRelationResolver`. |
| 9b Consuma `resolvedFilters.v2`? | **CONFERMATO**. `function readResolvedFiltersV2(message)` riga 84-89: `if (!isRecord(resolvedFilters) || resolvedFilters.version !== "resolvedFilters.v2") return null;`. |
| 9c Consuma `relationProof` dal payload backend? | **CONFERMATO**. `function asDriverVehicleRelation(relation, record)` riga 126-149: `const proof = relation.relationProof; if (relation.relationKind !== "driver_vehicle" || !proof) return null;` — `proof` letto direttamente dal payload, NON costruito. |
| 9d NON costruisce relazioni autonomamente? | **CONFERMATO**. `function readDriverRelations(resolved)` riga 151-166 itera SOLO su `entry.records[].relations[]` dal payload. Nessuna chiamata a domain reader (`readNextAnagraficheFlottaSnapshot`, `readNextAutistiReadOnlySnapshot`), nessun cross-fetch. |
| 9e Pannello prove mostra `relationProof` certificato? | **CONFERMATO**. `function renderRelationProof(relation)` riga 257-281 passa `proof.sourceCollection`, `proof.sourceRecordId`, `proof.sourceField`, `proof.rule`, `proof.certainty` a `ProofPanel`. |

### Verdetto
**CHIUSURA_SOSTANZIALE**. Driver360 e' completamente migrato a leggere il payload backend `resolvedFilters.v2`. Nessuna logica di relazione vive piu' nel frontend. Il pannello prove riusa `ProofPanel` con dati certificati dal `relation-resolver.js` backend.

---

## Sezione 10 — Verdetto finale

**VERDE**.

Motivazione:
- Adapter delta confermato 78/5/73 e localizzato nel branch Driver360 (4 funzioni nuove prefissate, firma estesa di `buildUniversalDriver360Message`); nessuna modifica strutturale alla pipeline. `driverRelationResolver.ts` eliminato pulito (0 consumer residui in src/tests/backend, eccetto il test difensivo T25 che ne verifica l'assenza). Test 20-21 modifiche chirurgiche (regola D10 "active_session" sostituisce "autistaId_explicit"), nessuna asserzione indebolita, anti-leak attivo. Header versioni Registro 1.0 STABLE e SPEC Motore v1.0 STABLE matchano esattamente la dichiarazione; SPEC Chat Zero-Invenzioni resta in BOZZA come dichiarato.
- Chiusura #10 sostanziale (Driver360 consuma payload backend, nessuna costruzione relazioni frontend); `relation.config.cjs`/`relation-resolver.js`/`query-engine.js`/`registry.config.js`/`catalog-validator.js`/`view.config.ts`/`15-vehicle360.spec.ts` non toccati nel range; nessun leak frontend in UI principale (sourceRecordId/sourceField confinati al pannello prove collassato). Il dubbio dell'audit precedente sull'adapter (portata ampia) e' qui risolto: la modifica nel range post-CHECKPOINT-A e' verificabilmente Driver360-only.
