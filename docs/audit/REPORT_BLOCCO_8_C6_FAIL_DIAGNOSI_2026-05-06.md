# REPORT BLOCCO 8 C6 FAIL - DIAGNOSI

Data: 2026-05-06  
Perimetro: diagnosi Playwright BLOCCO 8 CANCELLO 6, senza patch runtime/test.  
File modificato da questo prompt: solo questo report.

## Esito sintetico

DIAGNOSI COMPLETATA.

BLOCCO 8 C6 fallisce per una catena di cause, non per un unico selector Playwright:

1. Il backend produce `resolvedFilters.v2` per le viste generiche, ma `backend/internal-ai/server/lib/catalog-validator.js` accetta ancora solo il vecchio shape piatto `resolvedFilters` (`driverId`, `vehiclePlate`, `siteId`, `period`). Il validator backend sostituisce quindi messaggi `view_open` risolti con fallback `error_intent_not_in_catalog`.
2. Il processo backend usato dai test era stale: `node backend/internal-ai/server/internal-ai-adapter.js` e' partito alle 15:03:28, mentre `internal-ai-adapter.js`, `chat-zero-preflight.js` e `post-llm-resolver.js` sono stati modificati dopo le 16:09. Le regole C0 piu' recenti non erano quindi caricate dal processo in ascolto.
3. Il frontend monta viste certificate generiche solo con `action: "view_open"`. Quando il backend validator trasforma il messaggio in `action: "error"`, `ChatIaMessageItem.tsx` mostra solo l'accompagnamento fallback e nessuna vista.
4. Il pannello prove non e' universale: `CertifiedView.tsx` lo renderizza solo dentro record/relazioni; `Driver360.tsx` lo renderizza solo quando trova relazioni autista-mezzo. Le viste `no_results`, empty e loading non hanno `[data-proof-panel]`.
5. `view.config.ts` registra `Driver360`, `Vehicle360`, `Site360`, `Euromecc360`, `Ricerca360`, ma `Vehicle360` oggi ha una sola sezione `Anagrafica mezzo`: non ha sezioni documenti, rifornimenti o manutenzioni, pur avendo alcuni boundary in `entryBoundaryIds`.

## Fonti lette

- `docs/product/PIANO_ESECUTIVO_CHAT_IA_NEXT.md`
- `tests/e2e/17-euromecc360.spec.ts`
- `tests/e2e/18-documenti-cisterna.spec.ts`
- `tests/e2e/19-relazioni.spec.ts`
- `tests/e2e/20-proof-panel.spec.ts`
- `tests/e2e/21-chat-ia-smoke.spec.ts`
- `tests/e2e/helpers/chatHelpers.ts`
- `tests/e2e/helpers/firestoreHelpers.ts`
- `src/next/chat-ia/ChatIaToolUsePage.tsx`
- `src/next/chat-ia/components/ChatIaMessageItem.tsx`
- `src/next/chat-ia/views/CertifiedView.tsx`
- `src/next/chat-ia/views/Vehicle360.tsx`
- `src/next/chat-ia/views/Driver360.tsx`
- `src/next/chat-ia/config/view.config.ts`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `backend/internal-ai/server/lib/catalog-validator.js`
- `backend/internal-ai/server/lib/post-llm-resolver.js`
- `backend/internal-ai/server/lib/registry.config.js`
- `backend/internal-ai/server/lib/universal-resolver.js`
- `backend/internal-ai/server/lib/universal-resolver-collection-root.js`
- `backend/internal-ai/server/lib/query-engine.js`
- `backend/internal-ai/server/lib/relation-resolver.js`
- `backend/internal-ai/server/lib/relation.config.cjs`
- `test-results/backend-codex-chat-ia.log`
- `test-results/backend-codex-chat-ia.err.log`
- `test-results/chat-ia-e2e-results.json`
- `test-results/**/error-context.md` rilevanti

## Tabella spec 17-21

| Spec | Esito | Vista attesa | Vista prodotta rilevata | Causa | File minimo da patchare |
|---|---:|---|---|---|---|
| `17-euromecc360.spec.ts` | PASS | `Euromecc360` | `Euromecc360`, spesso in `no_results` pulito | Euromecc passa perche il backend restituisce `view_open` senza `resolvedFilters.v2` quando non ci sono record, quindi il validator non lo blocca. | Nessuno per questo spec. |
| `18-documenti-cisterna.spec.ts` | FAIL | `Vehicle360` per `documenti mezzo <plate>`; `Site360` per `schede cisterna` | Fallback `Richiesta non disponibile nel catalogo attuale`; log con `action:"error", view:null` dopo validazione backend | Validator backend non allineato a `resolvedFilters.v2`; processo backend stale per `schede cisterna`; `Vehicle360` non ha sezione documenti in `view.config.ts`. | `backend/internal-ai/server/lib/catalog-validator.js`; poi `backend/internal-ai/server/internal-ai-adapter.js` e, se si vuole Vehicle360 con documenti, `src/next/chat-ia/config/view.config.ts`. |
| `19-relazioni.spec.ts` | FAIL | `Vehicle360` con `relationProof`; `Vehicle360` con sezione rifornimenti | Fallback `action:"error", view:null`; nessuna vista montata | Stesso blocco validator `resolvedFilters.v2`; `Vehicle360` non espone sezione rifornimenti pur avendo boundary rifornimenti; filtro search con targa funziona in teoria ma viene annullato dal validator. | `backend/internal-ai/server/lib/catalog-validator.js`; poi `src/next/chat-ia/config/view.config.ts`. |
| `20-proof-panel.spec.ts` | FAIL | `Driver360`, `Vehicle360`, `Site360`, `Euromecc360`, `Ricerca360` con proof panel collassato | Driver360 montato ma in loading/proof assente; retry con fallback; Site/Vehicle non montati prima di raggiungere Euromecc/Ricerca | Mix di validator v2, backend stale, test asincrono su Driver360, e proof panel non renderizzato per empty/no_results/loading. | `backend/internal-ai/server/lib/catalog-validator.js`; `tests/e2e/20-proof-panel.spec.ts`; eventualmente `backend/internal-ai/server/internal-ai-adapter.js` per filtro search e `src/next/chat-ia/views/CertifiedView.tsx` se proof su no_results e' obbligatorio. |
| `21-chat-ia-smoke.spec.ts` | FAIL parziale; fallback non catalogo PASS | 5 viste corrette + proof panel; fallback `asdfghjkl` parametrico | Primo caso Driver360: vista montata ma loading/proof assente; retry fallback/no Driver360 | Test non attende stato ready di Driver360 e sceglie il primo autista, non necessariamente con relazione; backend stale rende il routing non deterministico; dopo il primo caso gli altri casi non vengono raggiunti. | `tests/e2e/21-chat-ia-smoke.spec.ts`; `backend/internal-ai/server/lib/catalog-validator.js`; possibile `backend/internal-ai/server/internal-ai-adapter.js`. |

## Dettaglio per spec falliti

### 18 - documenti/cisterna

1. Prompt/frasi:
   - `documenti mezzo <plate runtime>`
   - `schede cisterna`
2. Vista attesa:
   - `Vehicle360` per documenti mezzo, secondo scelta dello spec.
   - `Site360` per schede cisterna.
3. Vista prodotta:
   - Nessuna vista montata nel DOM. Error context mostra solo `Richiesta non disponibile nel catalogo attuale.`
4. Backend:
   - Per `documenti mezzo <plate>` i log mostrano `post_llm_resolution.applied=true`, `reason:"view_binding_resolved"`, poi `backend_catalog_validation.valid=false` con errori `resolvedFilters.version non e' ammesso`, `resolvedFilters.entries non e' ammesso`, ecc. Il messaggio finale diventa fallback.
   - Per `schede cisterna` i log dello stesso run mostrano `catalog_validator_fallback` o `post_llm_resolution.reason:"not_driver360"`/`driver360_resolved`, coerente con processo backend stale rispetto alle patch C0.
5. Classificazione:
   - B. intent routing non effettivamente caricato nel runtime per `schede cisterna`.
   - C. validator/config backend incompleto rispetto a `resolvedFilters.v2`.
   - D. `view.config.ts` non allineata per documenti dentro `Vehicle360`.
   - E. il componente non monta quando il backend produce `action:"error"`.
6. Prima causa concreta:
   - `catalog-validator.js` backend rifiuta lo shape `resolvedFilters.v2` prodotto dal resolver generico.
7. File minimo:
   - `backend/internal-ai/server/lib/catalog-validator.js`.
8. Rischio patch:
   - Elevato, perche cambia il contratto backend accettato per dati certificati.

Nota su "documenti cisterna": per `schede cisterna` la vista corretta e' `Site360`, perche `view.config.ts` contiene sezioni `site_cisterna_documents`, `site_cisterna_sheets`, `site_cisterna_parameters`. Per `documenti mezzo <plate>`, il piano ammette `Site360` o `Vehicle360` con sezione documenti; lo spec ha scelto `Vehicle360`, ma oggi `Vehicle360` non contiene sezioni documentali. Quindi aspettarsi `Vehicle360` e' corretto solo dopo allineamento di `view.config.ts`.

### 19 - relazioni

1. Prompt/frasi:
   - `mezzo <plate runtime>`
   - `rifornimenti <plate runtime>`
2. Vista attesa:
   - `Vehicle360`.
3. Vista prodotta:
   - Nessuna vista montata; fallback `Richiesta non disponibile nel catalogo attuale.`
4. Backend:
   - Log con `post_llm_resolution.reason:"view_binding_resolved"` seguito da fallback backend validator per campi `resolvedFilters.v2` non ammessi.
5. Classificazione:
   - C. validator backend incompleto.
   - D. `Vehicle360` non espone una sezione rifornimenti in `view.config.ts`.
   - F. proof panel non raggiungibile se la vista non monta.
6. Prima causa concreta:
   - backend validator respinge l'output certificato del resolver generico.
7. File minimo:
   - `backend/internal-ai/server/lib/catalog-validator.js`.
   - Per la sezione rifornimenti: `src/next/chat-ia/config/view.config.ts`.
8. Rischio patch:
   - Elevato per validator; normale/elevato per view config, perche cambia superficie certificata.

### 20 - proof panel

1. Prompt/frasi:
   - `profilo <driver runtime>`
   - `mezzo <plate runtime con relazione>`
   - `schede cisterna`
   - `stato euromecc`
   - `ricerca <plate runtime>`
2. Vista attesa:
   - Driver360, Vehicle360, Site360, Euromecc360, Ricerca360.
3. Vista prodotta:
   - Per Driver360: in un tentativo `Driver360` e' montato, ma resta su `Caricamento profilo autista...` al momento dell'assert e non ha proof panel.
   - In retry Driver360 non monta per fallback.
   - Site/Vehicle non montano per le cause sopra; Euromecc/Ricerca non vengono diagnosticati a runtime nello stesso test perche il test fallisce prima.
4. Backend:
   - Driver360 talvolta `view_open` con `universal_fase_a_resolved`, talvolta fallback `not_driver360` nel processo stale.
   - Vehicle/Site bloccate da validator o routing stale.
5. Classificazione:
   - F. pannello prove non presente in loading/no_results/empty.
   - G. timeout/asynchrony sul caricamento async di Driver360.
   - C/B per le viste generiche.
6. Prima causa concreta:
   - Il test chiede proof immediatamente dopo la risposta chat; `sendPrompt` aspetta la card assistente, non la fine del caricamento interno di Driver360.
7. File minimo:
   - `tests/e2e/20-proof-panel.spec.ts` per attendere stato ready e scegliere un driver con relazione certificabile.
   - `backend/internal-ai/server/lib/catalog-validator.js` per sbloccare le viste generiche.
8. Rischio patch:
   - Normale per test wait/data selection.
   - Elevato se si modifica il runtime per forzare proof panel su no_results/empty.

### 21 - smoke viste certificate

1. Prompt/frasi:
   - `profilo <driver runtime>`
   - `mezzo <plate runtime>`
   - `schede cisterna`
   - `stato euromecc`
   - `ricerca <plate runtime>`
   - `asdfghjkl`
2. Vista attesa:
   - 5 viste certificate + fallback parametrico.
3. Vista prodotta:
   - Il fallback `asdfghjkl` passa.
   - Il primo caso Driver360 fallisce su proof panel assente oppure, in retry, su `[data-driver360]` assente.
4. Backend:
   - Driver360 alterna `universal_fase_a_resolved` e fallback `not_driver360`, coerente con processo stale e output LLM non deterministico.
   - Gli altri quattro casi non vengono raggiunti nel run fallito per stop al primo case.
5. Classificazione:
   - G. asynchrony Driver360.
   - B. intent runtime non deterministico nel processo stale.
   - F. proof panel non garantito per ogni stato.
6. Prima causa concreta:
   - Lo smoke usa il primo autista runtime e richiede proof panel senza garantire che l'autista abbia relazione certificata o che la vista abbia finito il caricamento.
7. File minimo:
   - `tests/e2e/21-chat-ia-smoke.spec.ts`.
   - `backend/internal-ai/server/lib/catalog-validator.js` per i casi successivi.
8. Rischio patch:
   - Normale per test; elevato se si cambia contratto runtime dei proof panel.

## Controlli specifici

1. Perche `17-euromecc360.spec.ts` passa:
   - Il prompt `stato euromecc` produce `view_open` `Euromecc360`. Quando la risoluzione non trova record, `resolvedFilters` resta `null`; questo passa il validator backend e `CertifiedView` monta la vista con empty panel pulito. Lo spec 17 non richiede proof se `recordCount === 0`.
2. Perche `18-documenti-cisterna.spec.ts` si aspetta `Vehicle360`:
   - Il piano BLOCCO 8 C0 dice `documenti mezzo <targa>` -> `Site360` o `Vehicle360` con sezione documenti. Lo spec ha scelto l'opzione `Vehicle360`.
3. Se per "documenti cisterna" e' corretto aspettarsi `Vehicle360`:
   - No per le cisterna: `Site360` e' la vista allineata alla config attuale. Per "documenti mezzo" `Vehicle360` e' ammesso dal piano, ma solo se `Vehicle360` espone sezioni documenti; oggi non le espone.
4. Registrazione viste:
   - `Driver360`, `Vehicle360`, `Site360`, `Euromecc360`, `Ricerca360` sono registrate in `view.config.ts`.
5. Tipo vista backend non conosciuto dal frontend:
   - Non rilevato. I tipi prodotti sono tra quelli noti. Il problema e' fallback `action:"error"` o `view:null`, non view sconosciuta.
6. Frontend conosce la vista ma non la monta:
   - Si, quando il backend produce `action:"error"`. `ChatIaMessageItem.tsx` monta `CertifiedView` solo con `action:"view_open"` per viste generiche.
7. Pannello prove collegato solo ad alcune viste/stati:
   - Si. `CertifiedView` lo mostra solo per record e relazioni; `Driver360` solo per relazioni autista-mezzo. Empty/no_results/loading non hanno proof panel.
8. Intent naturali C0 non abilitati completamente:
   - Si. Il codice su disco contiene inferenze C0, ma il processo in ascolto e' precedente alle patch; inoltre il validator backend rende inutilizzabili le viste con `resolvedFilters.v2`.
9. Test contro nomi vecchi o alias `DA VERIFICARE`:
   - `documenti mezzo` -> `Vehicle360` e' ammesso solo se la sezione documenti esiste. Oggi e' un allineamento incompleto.
   - `Refueling360`, `Maintenance360`, `Search360` restano alias progettuali nel piano; i test usano correttamente `Vehicle360`/`Ricerca360`, ma le sezioni attese non sono tutte in config.
10. C6 blocca promozione Registro/SPEC:
   - Si. Il piano BLOCCO 8 C7 consente stato finale chiuso solo se tutti i Playwright passano e non restano DA VERIFICARE bloccanti. C6 FAIL blocca C7 e quindi blocca promozione a v1.0.

## Prima causa concreta del FAIL C6

La prima causa concreta da correggere e' l'allineamento del `backend_catalog_validator`: deve accettare lo shape `resolvedFilters.v2` generato dal resolver generico, oppure il backend deve trasformare `resolvedFilters.v2` in uno shape validato senza perdere i record certificati. Finche' il validator rimpiazza i messaggi risolti con `buildCatalogErrorMessage()`, `Vehicle360`, `Site360` e `Ricerca360` non possono montare in modo affidabile.

## Serve patch runtime o solo test?

Serve patch runtime/backend. Non basta una patch test.

Patch test e' comunque necessaria per gli assert di proof panel su Driver360/smoke, perche i test devono attendere il caricamento della vista e scegliere runtime data con relazione certificabile. Se invece il criterio di prodotto e' "proof panel sempre presente anche su no_results/loading", allora serve anche patch runtime UI.

## Whitelist consigliata per prossimo prompt di fix

Minima consigliata:

- `backend/internal-ai/server/lib/catalog-validator.js`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `tests/e2e/20-proof-panel.spec.ts`
- `tests/e2e/21-chat-ia-smoke.spec.ts`

Da aggiungere solo se il prossimo fix richiede piena copertura delle sezioni:

- `src/next/chat-ia/config/view.config.ts`
- `src/next/chat-ia/views/CertifiedView.tsx`
- `src/next/chat-ia/views/Driver360.tsx`
- `tests/e2e/18-documenti-cisterna.spec.ts`
- `tests/e2e/19-relazioni.spec.ts`

Operazione non-file necessaria:

- riavviare il backend `backend/internal-ai/server/internal-ai-adapter.js` prima di rieseguire Playwright.

## Cosa non toccare nel prossimo fix

- Boundary readonly, salvo decisione esplicita: i failure osservati non richiedono estendere boundary.
- `query-engine.js` e `relation-resolver.js`, salvo evidenza nuova dopo sblocco validator.
- Dati Firestore o Storage.
- Route NEXT e shell app.
- Report finale BLOCCO 8 finche C6 non passa.
- Registry/SPEC promotion a v1.0 finche C6 non passa.

## DA VERIFICARE residui collegati

1. Se `resolvedFilters.v2` deve diventare contratto ufficiale del backend validator oppure essere convertito prima della validazione.
2. Se il proof panel deve essere presente anche in `no_results` e loading, o solo quando esistono record/relazioni certificati.
3. Se `Vehicle360` deve includere sezioni documenti, rifornimenti e manutenzioni in `view.config.ts`, come richiesto dai prompt B8 C0/C6.
4. Se `stato euromecc` e `schede cisterna` devono restituire record anche con prompt generico, o se `no_results` e' accettabile per quei casi.
5. Se gli helper Playwright devono usare solo Firebase Admin lato Node, come indicato dalla policy del piano, invece del Firebase client browser helper corrente.

## Stato BLOCCO 8 C7

BLOCCO 8 C7 resta NON ESEGUITO. C6 e' ancora FAIL e blocca il report finale/promozione.

