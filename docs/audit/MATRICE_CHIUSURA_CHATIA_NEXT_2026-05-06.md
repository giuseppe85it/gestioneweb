# MATRICE DI CHIUSURA — CHAT IA NEXT — 2026-05-06

## Stato del documento
- Tipo: matrice di classificazione voci residue, sola lettura.
- Operatore: Claude Code.
- Fonti primarie: `docs/audit/REPORT_BLOCCO_8_2026-05-06.md`, `docs/product/PIANO_ESECUTIVO_CHAT_IA_NEXT.md`, `docs/audit/REPORT_BLOCCO_8_C6_FIX_2026-05-06.md`, `docs/audit/AUDIT_INDIPENDENTE_BLOCCO_8_C6_2026-05-06.md`, `docs/audit/REPORT_ZERO_INVENZIONI_TESTS_2026-05-04.md`.
- Nessuna patch applicata. Nessuna esecuzione di build/test/diagnostics.
- Nessuna promozione di documenti.

---

## Sezione 1 — Conteggio occorrenze vs voci reali

### Occorrenze testuali della stringa "DA VERIFICARE"
- `docs/audit/REPORT_BLOCCO_8_2026-05-06.md`: **3 occorrenze** (righe 44, 46, 76 — titolo sezione + dichiarazione "22 occorrenze nel piano" + frase stato finale).
- `docs/product/PIANO_ESECUTIVO_CHAT_IA_NEXT.md`: **22 occorrenze** (conteggio dichiarato dal report Codex coerente con grep effettuato).
- Totale testuale: **25 occorrenze**.

### Voci reali estratte
**Voci reali deduplicate: 13.**

Test DEFERRED collegati (extra alle DA VERIFICARE):
- `tests/e2e/15-vehicle360.spec.ts:27-30` — `test.skip` permanente con motivo "DEFERRED: helper Node lato test con Firebase Admin non presente; policy Playwright vieta targhe reali hardcoded." → voce extra **#13**.
- `tests/e2e/{18,19,20,21}.spec.ts` — `test.skip` data-driven (skip se manca dato runtime certificabile). Pattern legittimo, NON conta come voce residua (saltati solo se dataset non offre record adatto; pattern dichiarato dal piano §4 "Policy test Playwright").

### Motivo dello scarto (25 → 13 voci)
- 8 occorrenze nel piano sono **policy/meta** (non voci): righe 186 (regola anti-allucinazione generale), 879-880 (condizione promozione), 926 (idem), 942-945 (logica interna T28), 972-973 (stato finale condizionato).
- 1 occorrenza e' un **istruzione di test design** (riga 494: "usare placeholder sintetico tipo `ZZZ_DIAG_SITE`").
- 1 occorrenza e' **duplicato** tra righe 53 e 348 (entrambe `driver360.css` esistenza) e righe 244, 357, 698, 714, 735, 863, 919, 920 di `driverRelationResolver.ts` (tutti aspetti della stessa voce "chiamanti residui legacy").
- Le 3 occorrenze in REPORT_BLOCCO_8 si riferiscono al conteggio aggregato, non a voci distinte.
- Restano 13 voci classificabili (12 dalla lista sintetica del REPORT_BLOCCO_8 §"DA VERIFICARE residui" + 1 voce DEFERRED test 15).

---

## Sezione 2 — Tabella matrice

| ID | Descrizione | Categoria | File/area | Impatto | Blocca 100%? | Decisione | Whitelist file (se patch) | Costo |
|---|---|---|---|---|---|---|---|---|
| #1 | "esistenza `src/next/chat-ia/views/driver360.css`" — verifica esistenza del CSS referenziato da `Driver360.tsx:10`. Cit. `REPORT_BLOCCO_8_2026-05-06.md:50`, `PIANO:53,348`. | DOC_NON_PROMOSSO | `src/next/chat-ia/views/driver360.css` (esiste verificato a runtime) | NESSUNO | NO — verifica gia chiusa, manca solo aggiornamento doc | CHIUDERE_SOLO_DOCUMENTAZIONE — rimuovere il marker `DA VERIFICARE` dal piano §0.2 e §6, perche' il file esiste e Driver360 lo importa correttamente. | `docs/product/PIANO_ESECUTIVO_CHAT_IA_NEXT.md` | BASSO |
| #2 | "alias progettuali `Refueling360`, `Maintenance360`, `Search360` rispetto alla `ViewEnum` reale" — il prompt originale di pianificazione menzionava 4 viste 360 (Vehicle/Refueling/Maintenance/Search), ma `chatIaTypes.ts:346` dichiara `Driver360 | Vehicle360 | Site360 | Euromecc360 | Ricerca360`. Cit. `REPORT_BLOCCO_8_2026-05-06.md:51`, `PIANO:170`. | LACUNA_CATALOGO | `src/next/chat-ia/core/chatIaTypes.ts:346`, `docs/product/PIANO_ESECUTIVO_CHAT_IA_NEXT.md:170` | COSMETICO | NO — il piano gia chiarisce che si attiene ai 5 valori `ViewEnum` reali e tratta gli altri come alias progettuali da non implementare separatamente | CHIUDERE_COME_NON_RICHIESTA_V1 — la decisione "stessa vista config-driven con config diverse, NIENTE 4 componenti separati" e' gia presa nel piano §2.3. Le funzioni rifornimenti/manutenzioni vivono come sezioni dentro `Vehicle360`, ricerca dentro `Ricerca360`. Aggiornare il marker. | `docs/product/PIANO_ESECUTIVO_CHAT_IA_NEXT.md` | BASSO |
| #3 | "ordinamento default `updatedAt desc` per entry boundary" — verificare per ogni entry se `updatedAt` o `timestamp` e ammesso in `allowedFields`. Cit. `REPORT_BLOCCO_8_2026-05-06.md:52`, `PIANO:179`. | DOC_NON_PROMOSSO | `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js` (32 occorrenze `updatedAt`/`createdAt` confermate via grep) | FUNZIONALE | NO — sorting UI, non blocca dato certificato | CHIUDERE_SOLO_DOCUMENTAZIONE — produrre tabella dettagliata in registro v0.6 con colonna "campo ordinamento default per vista" derivata dalle `allowedFields` esistenti. Se per qualche entry mancano `updatedAt`/`timestamp`, sezione vista mostra cap senza ordinamento. | `docs/product/REGISTRO_COLLECTION_FIRESTORE.md` | BASSO |
| #4 | "fonte canonica cantiere per `Site360`" — non esiste `@cantieri` come collection canonica nel boundary; `Site360` legge da `work.lavori`, `materials.materialiConsegnati`, `equipment.attrezzatureCantieri`. Cit. `REPORT_BLOCCO_8_2026-05-06.md:53`, `PIANO:454`. Verifica grep boundary: `@cantieri` 0 match. | LACUNA_CATALOGO | `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js`, `docs/product/REGISTRO_COLLECTION_FIRESTORE.md` (sezione cantiere alias), `src/next/chat-ia/config/view.config.ts` (Site360.entryBoundaryIds) | PRODOTTO | SI — Site360 senza fonte canonica e' "vista preparata/parziale" che mostra cantieri come label denormalizzata, non come record certificato di un'entita "cantiere" | SOSPENDERE — richiede decisione di Giuseppe: (a) accettare che `Cantiere` e' entita derivata (alias di campo `cantiereId` su attrezzature/lavori/materiali) e che Site360 sia view aggregatrice; (b) creare una collection canonica `@cantieri` con relativi writer; (c) accettare Site360 come vista parziale V1 e completare in V1.1. La SPEC §10 "Piano di migrazione Driver360" non risolve questo punto. | `docs/product/REGISTRO_COLLECTION_FIRESTORE.md`, `docs/product/SPEC_MOTORE_GENERICO_NEXT.md` | MEDIO |
| #5 | "priorita esatta delle 9 entry storage aggiunte" — la priorita 9 dell'audit `AUDIT_READINESS_CHAT_IA_NEXT_2026-05-04.md` §6 NON include `@officine` separatamente. Cit. `REPORT_BLOCCO_8_2026-05-06.md:54`, `PIANO:425`. | DOC_NON_PROMOSSO | `docs/audit/AUDIT_READINESS_CHAT_IA_NEXT_2026-05-04.md`, `backend/internal-ai/server/lib/registry.config.js` (entry `workshops.officine`) | COSMETICO | NO — l'entry `officine` e' coperta dal boundary esistente e dal registry, e' solo un disallineamento tra audit e piano | CHIUDERE_SOLO_DOCUMENTAZIONE — annotare nella SPEC/Registro la rationale per cui `officine` e' aggiunta come modulo collegato a Vehicle360 (relazioni manutenzione). Nessun rischio funzionale: l'entry e' gia operativa nel registry e' boundary. | `docs/product/REGISTRO_COLLECTION_FIRESTORE.md` | BASSO |
| #6 | "root documentali parallele alle vecchie entry `storage/@documenti_*` deprecate" — il registro v0.6 marca `storage/@documenti_*` come "DEPRECATA — DA SOSTITUIRE CON ROOT COLLECTION". Le nuove entry root `firestore-<root>-root` sono state aggiunte in BLOCCO 5. Le vecchie `*-doc` non sono state rimosse. Cit. `REPORT_BLOCCO_8_2026-05-06.md:55`, `PIANO:598`. | DOC_NON_PROMOSSO | `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js` (entry `firestore-storage-documenti-{generici,magazzino,mezzi}-doc` + nuove root), `docs/product/REGISTRO_COLLECTION_FIRESTORE.md` | FUNZIONALE | NO — le entry doppie non rompono il boundary; il motore generico legge solo le entry collegate via `viewBindings`. Decisione gia presa nel piano: "rimozione e' BLOCCO 8" (non eseguita). | CHIUDERE_CON_PATCH — rimuovere le 3 entry deprecate `firestore-storage-documenti-{generici,magazzino,mezzi}-doc` dal boundary se nessun runtime le richiede; aggiornare registro v0.6. Verifica preliminare: nessun consumer in `internal-ai-adapter.js` o `universal-resolver.js` cita esplicitamente quegli id come uniche fonti documenti. | `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js`, `docs/product/REGISTRO_COLLECTION_FIRESTORE.md` | BASSO |
| #7 | "allowedFields root documentali da confermare sui writer reali" — `BLOCCO 5` ha aggiunto 6 entry root con `allowedFields` proiettati dai writer documentali; il piano esige verifica che gli `allowedFields` siano un sottoinsieme dei campi effettivamente scritti. Cit. `REPORT_BLOCCO_8_2026-05-06.md:56`, `PIANO:611`. | LACUNA_CATALOGO | `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js`, writer reali documenti (`src/**/Writer*.ts`) | FUNZIONALE | NO — se mai un campo nei writer non e' in `allowedFields`, il motore semplicemente non lo proietta. Non e' un buco di sicurezza, e' un'opportunita di completezza. | CHIUDERE_SOLO_DOCUMENTAZIONE — produrre report di mapping writer→`allowedFields` per ciascuna delle 6 root e annotarlo nel registro v0.6. Il test T1/T17/T18/T19 di `zero-invenzioni-tests.mjs` ha gia validato che gli `allowedFields` rispettano boundary e divieti URL. | `docs/product/REGISTRO_COLLECTION_FIRESTORE.md` | MEDIO |
| #8 | "comando PowerShell/grep per writer reali da normalizzare" — il piano §9 BLOCCO 5 CANCELLO 1 suggerisce `Select-String` PowerShell che richiede iterazione manuale, in alternativa il tool Grep dell'agente. Cit. `REPORT_BLOCCO_8_2026-05-06.md:57`, `PIANO:629`. | ALTRO | `docs/product/PIANO_ESECUTIVO_CHAT_IA_NEXT.md:629` | NESSUNO | NO — istruzione di esecuzione, non output prodotto | CHIUDERE_SOLO_DOCUMENTAZIONE — annotare nel piano che entrambi i pattern sono accettati; rimuovere il marker `DA VERIFICARE`. | `docs/product/PIANO_ESECUTIVO_CHAT_IA_NEXT.md` | BASSO |
| #9 | "proiezione CommonJS `relation.config.cjs`" — il piano §10 BLOCCO 6 dichiara `DA VERIFICARE: o tramite import dinamico di JSON/TS — Codex sceglie la modalita meno invasiva. In nessun caso il backend parsa il file `.ts`". Verifica file system: `backend/internal-ai/server/lib/relation.config.cjs` ESISTE. Cit. `REPORT_BLOCCO_8_2026-05-06.md:58`, `PIANO:689`. | DOC_NON_PROMOSSO | `backend/internal-ai/server/lib/relation.config.cjs`, `backend/internal-ai/server/lib/relation-resolver.js` | NESSUNO | NO — la decisione e' stata presa (proiezione CJS manuale) ed e' operativa, manca solo l'aggiornamento doc | CHIUDERE_SOLO_DOCUMENTAZIONE — rimuovere il marker dal piano §10 BLOCCO 6 e annotare nella SPEC §6.1 che la proiezione machine-readable della config relazioni e' `relation.config.cjs` mantenuto manualmente. | `docs/product/PIANO_ESECUTIVO_CHAT_IA_NEXT.md`, `docs/product/SPEC_MOTORE_GENERICO_NEXT.md` | BASSO |
| #10 | "chiamanti residui `driverRelationResolver.ts` da confermare prima di rimozione definitiva" — il piano §10 e §12 BLOCCO 8 dichiarano la deprecation. Verifica grep `src/`: `Driver360.tsx:9` importa `resolveDriverVehicleRelations` da `relations/driverRelationResolver`, e `Driver360.tsx:261` la chiama. Cit. `REPORT_BLOCCO_8_2026-05-06.md:59`, `PIANO:863`. | LACUNA_CATALOGO | `src/next/chat-ia/views/Driver360.tsx:9,109,261`, `src/next/chat-ia/relations/driverRelationResolver.ts` | FUNZIONALE | NO — il file e' marcato `@deprecated` con warning solo a runtime; Driver360 funziona. La rimozione definitiva e' pianificata in V1.1 | CHIUDERE_CON_PATCH — sostituire `resolveDriverVehicleRelations` in `Driver360.tsx` con consumo del backend `relation-resolver.js` via `query-engine.js` (gia attivo per le altre viste). Una volta zero chiamanti, rimuovere `driverRelationResolver.ts`. | `src/next/chat-ia/views/Driver360.tsx`, `src/next/chat-ia/relations/driverRelationResolver.ts` | MEDIO |
| #11 | "script `chat-ia:diagnostics` gia presente ma segnato come verifica storica nel piano" — verifica `package.json:16`: `"chat-ia:diagnostics": "node backend/internal-ai/server/lib/__diagnostics__/zero-invenzioni-tests.mjs"` PRESENTE. Cit. `REPORT_BLOCCO_8_2026-05-06.md:60`, `PIANO:866`. | DOC_NON_PROMOSSO | `package.json:16` | NESSUNO | NO — script gia presente e funzionante (T1..T28 PASS) | CHIUDERE_SOLO_DOCUMENTAZIONE — rimuovere il marker `DA VERIFICARE` dal piano §12 BLOCCO 8. | `docs/product/PIANO_ESECUTIVO_CHAT_IA_NEXT.md` | BASSO |
| #12 | "promozione Registro/SPEC condizionata: non eseguita per residui aperti" — META-condizione del piano. Cit. `REPORT_BLOCCO_8_2026-05-06.md:61`. | DOC_NON_PROMOSSO | `docs/product/REGISTRO_COLLECTION_FIRESTORE.md`, `docs/product/SPEC_MOTORE_GENERICO_NEXT.md` | NESSUNO | SI — la promozione resta bloccata finche' la matrice non chiude le voci #1..#11, #13 | CHIUDERE_SOLO_DOCUMENTAZIONE — dopo chiusura delle altre 12 voci, promuovere Registro a v1.0 STABLE e SPEC Motore Generico a v1.0 STABLE con annotazione di chiusura datata. | `docs/product/REGISTRO_COLLECTION_FIRESTORE.md`, `docs/product/SPEC_MOTORE_GENERICO_NEXT.md` | BASSO |
| #13 | DEFERRED test `tests/e2e/15-vehicle360.spec.ts:27-30` — `test.skip` permanente con motivo "DEFERRED: helper Node lato test con Firebase Admin non presente; policy Playwright vieta targhe reali hardcoded." | TEST_DEFERRED | `tests/e2e/15-vehicle360.spec.ts`, `tests/e2e/helpers/` | FUNZIONALE | NO — Vehicle360 e' coperto dagli spec 17, 19, 20, 21 con prompt naturale e dato runtime anonimizzato. Spec 15 e' duplicato preventivo | DEFERRED_OK — il pattern di anonimizzazione runtime e' implementato in 17-21 (cf. `runtimePlateWithRelation()` in 21-chat-ia-smoke.spec.ts). Lo spec 15 dedicato e' ridondante rispetto a 21. Mantenere DEFERRED finche' non si decide se rimuoverlo o riscriverlo. | (eventuale rimozione: `tests/e2e/15-vehicle360.spec.ts`) | BASSO |

---

## Sezione 3 — Sintesi

- **Totale voci classificate**: 13.
- **CHIUDERE_CON_PATCH**: 2 (voci #6, #10).
- **CHIUDERE_SOLO_DOCUMENTAZIONE**: 8 (voci #1, #3, #5, #7, #8, #9, #11, #12).
- **CHIUDERE_COME_NON_RICHIESTA_V1**: 1 (voce #2).
- **DEFERRED_OK**: 1 (voce #13).
- **SOSPENDERE**: 1 (voce #4 — fonte canonica cantiere per Site360).
- **BLOCCANO 100%**: 2 (voci #4 e #12).
  - #4 blocca perche' Site360 e' "vista preparata/parziale" senza fonte canonica.
  - #12 blocca perche' la promozione Registro/SPEC a v1.0 e' lo stato finale dichiarato dalla SPEC; senza promozione lo stato resta "operativa parziale controllata".

### Voci sospette di duplicazione
- **Nessuna duplicazione** dopo la deduplicazione effettuata in Sezione 1. I marker multipli su `driverRelationResolver.ts` (righe 244, 357, 698, 714, 735, 863, 919, 920) sono tutti aspetti della stessa voce #10. I marker multipli su `driver360.css` (righe 53, 348) sono entrambi nella voce #1. I marker meta (promozione Registro/SPEC, T28, stato finale) sono confluiti nella voce #12.

---

## Sezione 4 — Ordine di esecuzione proposto

Solo voci CHIUDERE_CON_PATCH e CHIUDERE_SOLO_DOCUMENTAZIONE.

| Step | Voce | Tipo | File whitelist | Costo | Indipendenza |
|---|---|---|---|---|---|
| 1 | #1 | DOC | `PIANO_ESECUTIVO_CHAT_IA_NEXT.md` | BASSO | indipendente |
| 2 | #8 | DOC | `PIANO_ESECUTIVO_CHAT_IA_NEXT.md` | BASSO | indipendente — condivide file con #1 e #11 (esecuzione sequenziale unica passata) |
| 3 | #11 | DOC | `PIANO_ESECUTIVO_CHAT_IA_NEXT.md` | BASSO | indipendente — condivide file con #1 e #8 |
| 4 | #5 | DOC | `REGISTRO_COLLECTION_FIRESTORE.md` | BASSO | indipendente |
| 5 | #3 | DOC | `REGISTRO_COLLECTION_FIRESTORE.md` | BASSO | condivide file con #5 (sequenziale) |
| 6 | #7 | DOC | `REGISTRO_COLLECTION_FIRESTORE.md` | MEDIO | condivide file con #3, #5 (sequenziale; richiede mapping writer→allowedFields) |
| 7 | #9 | DOC | `PIANO_ESECUTIVO_CHAT_IA_NEXT.md`, `SPEC_MOTORE_GENERICO_NEXT.md` | BASSO | tocca SPEC oltre piano |
| 8 | #6 | PATCH | `internal-ai-firebase-readonly-boundary.js`, `REGISTRO_COLLECTION_FIRESTORE.md` | BASSO | richiede grep preliminare consumer |
| 9 | #10 | PATCH | `Driver360.tsx`, `driverRelationResolver.ts` | MEDIO | richiede esecuzione T22 + Playwright 14, 20, 21 (test piu' lunghi) |
| 10 | #12 | DOC | `REGISTRO_COLLECTION_FIRESTORE.md`, `SPEC_MOTORE_GENERICO_NEXT.md` | BASSO | DOPO la chiusura di tutte le altre |

Logica:
- Step 1-3 toccano lo stesso file (`PIANO`) → un unico passaggio editoriale.
- Step 4-7 toccano `REGISTRO`/`SPEC` → batch documentale.
- Step 8 e' la patch sul boundary, che richiede grep preliminare ma non Playwright (i test esistenti coprono root nuove e doc nuove).
- Step 9 e' l'unica patch che richiede Playwright completo (Driver360 ridiretto al backend).
- Step 10 e' la promozione finale, prerequisito = chiusura di tutte le altre voci tranne #4 e #13.

---

## Sezione 5 — Voci bloccanti

### Voce #4 — Fonte canonica cantiere per Site360
- **Perche' blocca**: il piano §7 BLOCCO 3 dichiara esplicitamente "Non dichiarare 'Site360 mostra dati certificati per cantieri' finche' la fonte canonica non e' identificata." Site360 attualmente legge da `work.lavori`, `materials.materialiConsegnati`, `equipment.attrezzatureCantieri` come label denormalizzata (`cantiereLabel`, `cantiere`), non come record certificato di un'entita "cantiere".
- **Cosa servirebbe**: decisione prodotto di Giuseppe.
  - Opzione A: dichiarare formalmente che `Cantiere` e' entita derivata (alias di campo `cantiereId`) e Site360 e' aggregatrice. Aggiornare SPEC e Registro. Patch documentale, costo BASSO.
  - Opzione B: creare collection canonica `@cantieri` con writer dedicato (NEXT scrivente). Costo ALTO. Richiede V1.1.
  - Opzione C: accettare Site360 come "vista parziale V1" formalmente; definire scope V1.1.
- **Fattibilita V1**: Opzione A e Opzione C sono fattibili in V1 (documentale). Opzione B non e' V1.

### Voce #12 — Promozione Registro/SPEC a v1.0
- **Perche' blocca**: la SPEC Motore Generico §13 e il piano §12 BLOCCO 8 condizionano la promozione "solo se non restano `DA VERIFICARE` bloccanti". Senza promozione, lo stato finale dichiarato e' "Chat IA NEXT operativa parziale controllata" (riga 76 REPORT_BLOCCO_8).
- **Cosa servirebbe**: chiudere voci #1..#11, #13. Una volta chiuse, aggiornare l'header del Registro a `Versione: 1.0` e la SPEC a `v1.0 STABLE` con annotazione datata.
- **Fattibilita V1**: SI, automatica dopo chiusura delle altre voci. Costo BASSO.

---

## Sezione 6 — Stato Registro/SPEC e prerequisiti promozione

### `docs/product/REGISTRO_COLLECTION_FIRESTORE.md`
- **Versione corrente**: `0.6 BOZZA — 2026-05-04`.
- **Annotazione 2026-05-06** (riga 7 del file): "durante BLOCCO 8 del piano Chat IA NEXT il registro resta BOZZA. La promozione a v1.0 e' sospesa finche' nel piano restano voci `DA VERIFICARE`."
- **Prerequisiti alla promozione v1.0**: chiusura delle voci #1, #3, #4, #5, #6, #7, #9, #10 (che toccano direttamente la mappa Registro/Boundary). Le voci puramente di piano (#2, #8, #11, #13) non sono prerequisito formale ma sono incluse nel conteggio "DA VERIFICARE residui" che T28 controlla.

### `docs/product/SPEC_MOTORE_GENERICO_NEXT.md`
- **Versione corrente**: `v0.1 BOZZA`.
- **Annotazione 2026-05-06** (riga 8 del file): "resta BOZZA durante BLOCCO 8 del piano Chat IA NEXT. Nessuna promozione a STABLE finche' nel piano restano voci `DA VERIFICARE`."
- **Prerequisiti alla promozione v1.0**: chiusura delle voci #4 (fonte canonica cantiere → tocca §6.1 Registry Reader e §7 Vista generica), #9 (proiezione `relation.config.cjs` → tocca §6.1), #10 (chiamanti legacy → tocca §10 piano migrazione Driver360).

### `docs/product/SPEC_CHAT_ZERO_INVENZIONI_NEXT.md`
- **Versione corrente**: `1.0 BOZZA — 2026-05-04`. (Nota: e' gia v1.0 ma con stato "BOZZA"; la promozione formale alla "STABLE" non e' esplicitamente richiesta nel piano.)
- **Prerequisiti alla promozione STABLE**: nessun prerequisito derivato direttamente dalle voci di questa matrice. Lo schema strict, l'Action Router e il Catalog Validator dichiarati nella SPEC sono operativi e validati da T1..T28.

---

## Sezione 7 — Stato finale Chat IA NEXT

**Chiusura 100% raggiungibile: SI**, con il seguente ordine:
1. **2 patch** (voci #6 e #10): rimozione entry boundary deprecate + migrazione Driver360 a backend `relation-resolver.js`.
2. **8 formalizzazioni documentali** (voci #1, #3, #5, #7, #8, #9, #11, #12): aggiornamenti su PIANO, REGISTRO, SPEC.
3. **1 accettazione formale "non richiesta V1"** (voce #2): alias progettuali Refueling/Maintenance/Search confluiti in viste config-driven.
4. **1 DEFERRED OK** (voce #13): test 15 ridondante rispetto a 21, scelta consapevole.
5. **1 voce SOSPESA** (voce #4): richiede decisione Giuseppe (Opzione A documentale fattibile in V1, Opzione B richiede V1.1).

Una volta chiuse #4 (con decisione Giuseppe) e tutte le altre, la voce #12 si autochiude promovendo Registro a v1.0 STABLE e SPEC Motore Generico a v1.0 STABLE.
