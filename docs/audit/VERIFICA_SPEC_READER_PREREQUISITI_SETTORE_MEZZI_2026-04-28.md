# VERIFICA SPEC READER PREREQUISITI SETTORE MEZZI CHAT IA NEXT

Data verifica: 2026-04-28

File verificato: `docs/product/SPEC_READER_PREREQUISITI_SETTORE_MEZZI_CHAT_IA_NEXT.md`

Fonte unica di verita: codice reale del repository.

Vincoli rispettati:

- Audit puro.
- Nessuna modifica a codice sorgente.
- Nessuna modifica alla spec.
- Nessun comando git eseguito.
- Archivista non analizzato.

Verdetto: **DA CORREGGERE**

Divergenze totali: **3**

- Critiche: **0**
- Medie: **2**
- Minori: **1**

---

## 1. INTRO

La verifica ha controllato riga per riga i claim tecnici della spec contro il codice reale. I due reader dichiarati dalla spec non esistono ancora, coerentemente con il loro stato di prerequisiti futuri:

- `src/next/domain/nextSegnalazioniControlliDomain.ts`: non esiste.
- `src/next/domain/nextDocumentiMezzoDomain.ts`: non esiste.

La maggior parte dei path e dei range citati e' corretta. Restano pero' tre divergenze:

1. La nomenclatura `D11` / `D12` e' incompleta rispetto al codice reale, perche' esistono gia' domain code con prefisso `D11-...` e `D12-...`.
2. La spec non cita un entry point mezzo-centrico gia' esistente in `nextDocumentiCostiDomain.ts`.
3. Il range di `readNextUnifiedCollection` e' troncato.

---

## 2. CLAIM TECNICI VERIFICATI

### A. Path file citati

| Claim | Esito | Prova |
| --- | --- | --- |
| `docs/product/MAPPA_IA_CHAT_NEXT.md` esiste | PASS | File aperto, righe 10-18 confermano gli obiettivi di chat unica, dati strutturati, incroci, report e PDF. |
| `docs/audit/AUDIT_CHAT_IA_NEXT_RIFACIMENTO_2026-04-27.md` esiste | PASS | File aperto, righe 232-235 riassumono fonti storage, collection e letture Mezzo 360. |
| `docs/product/SPEC_OSSATURA_CHAT_IA_NEXT.md` esiste | PASS | File aperto, introduzione e perimetro letti. |
| `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md` esiste | PASS | File aperto; righe 170-193 dichiarano i due reader prerequisiti, riga 383 li compone nello snapshot settore. |
| `src/pages/Mezzo360.tsx` esiste | PASS | File aperto nei range citati. |
| `src/next/domain/nextUnifiedReadRegistryDomain.ts` esiste | PASS | File aperto nei range citati. |
| `src/next/domain/nextCentroControlloDomain.ts` esiste | PASS | File aperto nei range citati. |
| `src/next/domain/nextDocumentiCostiDomain.ts` esiste | PASS | File aperto nei range citati. |
| `src/next/nextAnagraficheFlottaDomain.ts` esiste | PASS | File aperto; `normalizeNextMezzoTarga` esiste a 291-293. |
| `src/utils/storageSync.ts` esiste | PASS | File aperto; `getItemSync` legge `storage/<key>` a 139-150. |
| `src/next/domain/nextSegnalazioniControlliDomain.ts` non esiste oggi | PASS | Verifica `Test-Path`: `False`. Coerente con prerequisito futuro. |
| `src/next/domain/nextDocumentiMezzoDomain.ts` non esiste oggi | PASS | Verifica `Test-Path`: `False`. Coerente con prerequisito futuro. |

### B. Numeri di riga

| Claim | Esito | Prova |
| --- | --- | --- |
| `MAPPA_IA_CHAT_NEXT.md:10-18` | PASS | Le righe descrivono chat unica, dati precisi, incroci, report, archivio, PDF e lettura Firestore/Storage. |
| `Mezzo360.tsx:13-24` | PASS | Contiene storage keys, incluse `@segnalazioni_autisti_tmp` e `@controlli_mezzo_autisti`. |
| `Mezzo360.tsx:26-30` | PASS | Contiene `DOC_COLLECTIONS` con le tre collection documentali. |
| `Mezzo360.tsx:70-72` | PASS | Contiene normalizzazione targa madre. |
| `Mezzo360.tsx:135-148` | PASS | Contiene fuzzy match a distanza massima 1 carattere. |
| `Mezzo360.tsx:231-236` | PASS | Contiene avvio `loadDocumenti` e `getDocs(collection(db, colName))` a riga 236. |
| `Mezzo360.tsx:293-305` | PASS | Contiene letture parallele `getItemSync` e `loadDocumenti()`. |
| `Mezzo360.tsx:407-489` | PASS | Contiene filtro documenti, dedup e ordinamento. |
| `Mezzo360.tsx:491-506` | PASS | Contiene filtro segnalazioni e controlli per targa. |
| `Mezzo360.tsx:543-615` | PASS | Contiene timeline madre per eventi, segnalazioni, controlli, rifornimenti e gomme. |
| `nextUnifiedReadRegistryDomain.ts:116-157` | PASS | Range completo di `readNextUnifiedStorageDocument`. |
| `nextUnifiedReadRegistryDomain.ts:159-180` | FAIL MINORE | La funzione `readNextUnifiedCollection` inizia a 159 ma termina a 194, non a 180. Vedi DVG-READ-MEZ-003. |
| `nextAnagraficheFlottaDomain.ts:291-293` | PASS | Contiene `export function normalizeNextMezzoTarga(value: unknown): string`. |
| `nextCentroControlloDomain.ts:19-21` | PASS | Contiene `EVENTI_KEY`, `SEGNALAZIONI_KEY`, `CONTROLLI_KEY`; le due chiavi richieste sono a 20-21. |
| `nextCentroControlloDomain.ts:262-287` | PASS | Contiene shape `D10Snapshot` con counters, mezzi, sessioni, eventi, revisioni, alerts, focus e important items. |
| `nextCentroControlloDomain.ts:1638-1643` | PASS | Contiene letture `readNextUnifiedStorageDocument` sulle fonti D10, incluse segnalazioni e controlli. |
| `nextDocumentiCostiDomain.ts:12-16` | PASS | Contiene esattamente `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`. |
| `nextDocumentiCostiDomain.ts:106-123` | PASS | Contiene dominio `NEXT_DOCUMENTI_COSTI_DOMAIN` con code `D07-D08`. |
| `nextDocumentiCostiDomain.ts:125-161` | PASS | Contiene campi normalizzati di `NextDocumentiCostiReadOnlyItem`. |
| `nextDocumentiCostiDomain.ts:1587-1594` | PASS | Contiene `readDocumentiCostiSources` e `getDocs(collection(db, collectionKey))`. |
| `nextDocumentiCostiDomain.ts:1739-1750` | PASS | Contiene limitation sul layer documenti/costi mezzo-centrico. |
| `nextDocumentiCostiDomain.ts:2247` | PASS | Contiene `readNextDocumentiCostiFleetSnapshot`. |
| `AUDIT_CHAT_IA_NEXT_RIFACIMENTO_2026-04-27.md:232-235` | PASS | Riassume correttamente fonti storage, collection e letture Mezzo 360. |

### C. Nomi funzioni, costanti e tipi

| Nome | Esito | Prova |
| --- | --- | --- |
| `readNextUnifiedStorageDocument` | PASS | `src/next/domain/nextUnifiedReadRegistryDomain.ts:116`. |
| `readNextUnifiedCollection` | PASS con range da correggere | `src/next/domain/nextUnifiedReadRegistryDomain.ts:159-194`. |
| `normalizeNextMezzoTarga` | PASS | `src/next/nextAnagraficheFlottaDomain.ts:291-293`. |
| `NEXT_DOCUMENTI_COSTI_DOMAIN` | PASS | `src/next/domain/nextDocumentiCostiDomain.ts:106-123`. |
| `readNextDocumentiCostiFleetSnapshot` | PASS | `src/next/domain/nextDocumentiCostiDomain.ts:2247`. |
| `readNextMezzoDocumentiCostiSnapshot` | PRESENTE MA NON CITATO | `src/next/domain/nextDocumentiCostiDomain.ts:2313-2316`. Vedi DVG-READ-MEZ-002. |
| `readNextCentroControlloSnapshot` | PASS | `src/next/domain/nextCentroControlloDomain.ts:1627`. |
| `readNextStatoOperativoSnapshot` | PASS | `src/next/domain/nextCentroControlloDomain.ts:1657`. |
| `NEXT_IA_CONFIG_DOMAIN` | PRESENTE | `src/next/domain/nextIaConfigDomain.ts:7-14`, code `D11-IA-CONFIG`. Rilevante per DVG-READ-MEZ-001. |
| `NEXT_IA_LIBRETTO_DOMAIN` | PRESENTE | `src/next/domain/nextIaLibrettoDomain.ts:17-24`, code `D12-IA-LIBRETTO`. Rilevante per DVG-READ-MEZ-001. |

### D. Shape di tipi

| Claim | Esito | Prova |
| --- | --- | --- |
| `readNextUnifiedStorageDocument` riceve oggetto con `key` e `preferredArrayKeys?` | PASS | `nextUnifiedReadRegistryDomain.ts:116-119`. |
| `readNextUnifiedStorageDocument` ritorna `NextUnifiedStorageDocumentReadResult` con `sourceId`, `status`, `datasetShape`, `records`, `rawDocument`, `notes` | PASS | Tipo a 14-21, ritorni a 123-156. |
| `readNextUnifiedCollection` riceve oggetto con `collectionName` | PASS | `nextUnifiedReadRegistryDomain.ts:159-161`. |
| `readNextUnifiedCollection` ritorna records con `__docId` | PASS | Tipo a 23-28, mapping a 176-179. |
| `D10Snapshot` e' filtrato e non lista completa per targa | PASS | Tipo a 262-290; include counters/focus/important items, non endpoint per tutte le segnalazioni o tutti i controlli di una targa. |
| `NextDocumentiCostiReadOnlyItem` ha shape documentale normalizzata | PASS | `nextDocumentiCostiDomain.ts:125-161`. |
| `NextMezzoDocumentiCostiSnapshot` esiste gia' | PASS, ma omesso dalla spec | `nextDocumentiCostiDomain.ts:222-260` e funzione a 2313-2316. |

### E. Comportamenti dichiarati

| Claim | Esito | Prova |
| --- | --- | --- |
| Mezzo 360 legge segnalazioni e controlli da storage con `getItemSync` | PASS | Chiavi 19-20; letture 299-300. |
| Mezzo 360 filtra segnalazioni per `targaCamion`, `targaRimorchio`, `targa` | PASS | `Mezzo360.tsx:491-497`. |
| Mezzo 360 filtra controlli per `targaCamion`, `targaRimorchio` | PASS | `Mezzo360.tsx:500-505`. |
| Mezzo 360 legge documenti con `getDocs(collection(db, colName))` | PASS | `Mezzo360.tsx:231-236`. |
| Mezzo 360 documenti fa filtro/dedup/ordinamento | PASS | `Mezzo360.tsx:407-489`. |
| D10 legge le stesse fonti segnalazioni/controlli ma non espone lista completa per targa | PASS | Letture 1638-1643, output 262-290. |
| Documenti/costi NEXT legge le tre collection documentali | PASS | `nextDocumentiCostiDomain.ts:1587-1594`. |
| Opzione B per Reader 2 coerente con codice reale | PASS | Le tre fonti sono trattate come collection in Mezzo360 e in D07-D08; nessuna evidenza di snapshot `storage/<key>` nel codice verificato. |
| D12 come reader nuovo e separato e' giustificato solo se si esplicita il rapporto con il reader mezzo-centrico esistente | FAIL MEDIA | La spec non cita `readNextMezzoDocumentiCostiSnapshot`; vedi DVG-READ-MEZ-002. |

### F. Numeri di riferimento

| Numero / codice | Esito | Prova |
| --- | --- | --- |
| Reader 1 = D11 | FAIL MEDIA | Esistono gia' codici con prefisso `D11-...`; vedi DVG-READ-MEZ-001. |
| Reader 2 = D12 | FAIL MEDIA | Esistono gia' codici con prefisso `D12-...`; vedi DVG-READ-MEZ-001. |
| D07-D08 documenti/costi generale | PASS | `nextDocumentiCostiDomain.ts:106-123`. |
| D10 stato operativo | PASS | `nextCentroControlloDomain.ts:52` code `D10`. |
| D05 materiali | PASS | `nextMaterialiMovimentiDomain.ts:78` code `D05-MATERIALI`, con alias/snapshot D05 nel file. |
| D04 rifornimenti | PASS | `nextRifornimentiDomain.ts:65` code `D04`. |
| D01 anagrafica flotta | PASS | `nextAnagraficheFlottaDomain.ts:47` code `D01`. |

---

## 3. DIVERGENZE TROVATE

### DVG-READ-MEZ-001 - MEDIA - Domain code D11/D12 non allineati allo spazio nomi reale

Spec:

- `docs/product/SPEC_READER_PREREQUISITI_SETTORE_MEZZI_CHAT_IA_NEXT.md:75`: Reader 1 `code: "D11"`.
- `docs/product/SPEC_READER_PREREQUISITI_SETTORE_MEZZI_CHAT_IA_NEXT.md:82`: "D01-D10 sono gia' occupati... primo prerequisito nuovo".
- `docs/product/SPEC_READER_PREREQUISITI_SETTORE_MEZZI_CHAT_IA_NEXT.md:291`: Reader 2 `code: "D12"`.
- `docs/product/SPEC_READER_PREREQUISITI_SETTORE_MEZZI_CHAT_IA_NEXT.md:611-612`: decisioni vincolanti D11/D12.

Codice reale:

- `src/next/domain/nextIaConfigDomain.ts:7-14`: esiste `NEXT_IA_CONFIG_DOMAIN` con `code: "D11-IA-CONFIG"`.
- `src/next/domain/nextIaLibrettoDomain.ts:17-24`: esiste `NEXT_IA_LIBRETTO_DOMAIN` con `code: "D12-IA-LIBRETTO"`.

Valutazione:

Non c'e' una collisione esatta con stringa `D11` o `D12`, ma lo spazio nomi numerico `D11` / `D12` risulta gia' usato come prefisso da domini esistenti. La spec afferma implicitamente che dopo D01-D10 il primo spazio libero sia D11/D12, ma il codice reale non lo conferma.

Correzione consigliata:

Aggiornare la spec scegliendo codici non ambigui, oppure dichiarare esplicitamente che `D11` e `D12` sono nuovi codici esatti accettati nonostante l'esistenza dei prefissi `D11-IA-CONFIG` e `D12-IA-LIBRETTO`. La seconda opzione e' meno pulita.

### DVG-READ-MEZ-002 - MEDIA - Reader documenti/costi mezzo-centrico esistente non citato

Spec:

- `docs/product/SPEC_READER_PREREQUISITI_SETTORE_MEZZI_CHAT_IA_NEXT.md:45`: il dominio documenti/costi conosce e legge le collection, poi si dichiara necessario un reader dedicato.
- `docs/product/SPEC_READER_PREREQUISITI_SETTORE_MEZZI_CHAT_IA_NEXT.md:306`: D12 viene motivato perche' D07-D08 resta dominio generale.
- `docs/product/SPEC_READER_PREREQUISITI_SETTORE_MEZZI_CHAT_IA_NEXT.md:532`: cita solo `readNextDocumentiCostiFleetSnapshot` a 2247 come entry point esistente.

Codice reale:

- `src/next/domain/nextDocumentiCostiDomain.ts:222-260`: esiste il tipo `NextMezzoDocumentiCostiSnapshot`.
- `src/next/domain/nextDocumentiCostiDomain.ts:2313-2316`: esiste `readNextMezzoDocumentiCostiSnapshot(targa, options)`.
- `src/next/domain/nextDocumentiCostiDomain.ts:2325-2330`: la funzione filtra `fleetItems` per `mezzoTarga` e produce gruppi per la targa.

Valutazione:

La creazione di D12 puo' restare sensata, perche' D12 ha un contratto diverso: document-only, tre collection documentali, categorie complete, fuzzy match e nessun `@costiMezzo`. Tuttavia la spec deve citare l'entry point mezzo-centrico gia' esistente e spiegare perche' non basta. Altrimenti l'implementazione rischia di duplicare inconsapevolmente logica esistente o di ignorare un riuso utile.

Correzione consigliata:

Aggiungere in sezione 1, 3.3 o 5 un riferimento a:

- `readNextMezzoDocumentiCostiSnapshot`: `src/next/domain/nextDocumentiCostiDomain.ts:2313`.

E chiarire che D12 non sostituisce quel reader, ma lo supera/affianca perche':

- non include `@costiMezzo`;
- espone un contratto documentale puro;
- deve supportare fuzzy match locale;
- deve coprire documenti completi per targa secondo la spec settore Mezzi.

### DVG-READ-MEZ-003 - MINORE - Range troncato per `readNextUnifiedCollection`

Spec:

- `docs/product/SPEC_READER_PREREQUISITI_SETTORE_MEZZI_CHAT_IA_NEXT.md:335`: `readNextUnifiedCollection` citato come `src/next/domain/nextUnifiedReadRegistryDomain.ts:159-180`.
- `docs/product/SPEC_READER_PREREQUISITI_SETTORE_MEZZI_CHAT_IA_NEXT.md:522`: stesso range in "File esistenti da riusare".

Codice reale:

- `src/next/domain/nextUnifiedReadRegistryDomain.ts:159`: firma della funzione.
- `src/next/domain/nextUnifiedReadRegistryDomain.ts:180`: chiude il return del caso success.
- `src/next/domain/nextUnifiedReadRegistryDomain.ts:182-193`: catch e return errore.
- `src/next/domain/nextUnifiedReadRegistryDomain.ts:194`: chiusura funzione.

Valutazione:

Il range 159-180 identifica l'inizio e il ramo principale, ma non include tutta la funzione. Per una spec implementativa, il range corretto deve includere anche gestione errore e chiusura.

Correzione consigliata:

Sostituire `src/next/domain/nextUnifiedReadRegistryDomain.ts:159-180` con `src/next/domain/nextUnifiedReadRegistryDomain.ts:159-194`.

---

## 4. VERIFICHE MIRATE OBBLIGATORIE

### 2.1 `readNextUnifiedStorageDocument`

Esito: PASS.

Prova:

- `src/next/domain/nextUnifiedReadRegistryDomain.ts:116-119`: firma con `{ key: string; preferredArrayKeys?: string[] }`.
- `src/next/domain/nextUnifiedReadRegistryDomain.ts:120-157`: legge `doc(db, "storage", args.key)`, ritorna stato `missing`, `ready` o `error`.

La firma corrisponde al claim della spec.

### 2.2 `readNextUnifiedCollection`

Esito: PASS con divergenza MINORE sul range.

Prova:

- `src/next/domain/nextUnifiedReadRegistryDomain.ts:159-161`: firma con `{ collectionName: string }`.
- `src/next/domain/nextUnifiedReadRegistryDomain.ts:163`: usa `getDocs(collection(db, args.collectionName))`.
- `src/next/domain/nextUnifiedReadRegistryDomain.ts:176-179`: mappa records con `__docId`.
- `src/next/domain/nextUnifiedReadRegistryDomain.ts:182-194`: gestione errore.

La funzione esiste e la firma corrisponde. Il range completo reale e' 159-194, non 159-180.

### 2.3 `normalizeNextMezzoTarga`

Esito: PASS.

Prova:

- `src/next/nextAnagraficheFlottaDomain.ts:287-289`: helper locale `normalizeTarga`.
- `src/next/nextAnagraficheFlottaDomain.ts:291-293`: export `normalizeNextMezzoTarga(value: unknown): string`.

### 2.4 Collection documentali in `nextDocumentiCostiDomain.ts`

Esito: PASS.

Prova:

- `src/next/domain/nextDocumentiCostiDomain.ts:12-16` contiene esattamente:
  - `@documenti_mezzi`
  - `@documenti_magazzino`
  - `@documenti_generici`

### 2.5 Storage key in Mezzo 360

Esito: PASS.

Prova:

- `src/pages/Mezzo360.tsx:19`: `KEY_SEGNALAZIONI = "@segnalazioni_autisti_tmp"`.
- `src/pages/Mezzo360.tsx:20`: `KEY_CONTROLLI = "@controlli_mezzo_autisti"`.
- `src/pages/Mezzo360.tsx:293-305`: entrambe le chiavi vengono lette con `getItemSync`.

### 2.6 Letture `getDocs`

Esito: PASS.

Prova Mezzo 360:

- `src/pages/Mezzo360.tsx:231-236`: `loadDocumenti` cicla `DOC_COLLECTIONS` e chiama `getDocs(collection(db, colName))`.

Prova NEXT documenti/costi:

- `src/next/domain/nextDocumentiCostiDomain.ts:1587-1594`: `readDocumentiCostiSources` chiama `getDocs(collection(db, collectionKey))` per le collection in `DOCUMENTI_COLLECTION_KEYS`.

### 2.7 Fuzzy match Mezzo 360

Esito: PASS.

Prova:

- `src/pages/Mezzo360.tsx:70-72`: normalizzazione uppercase e rimozione caratteri non alfanumerici.
- `src/pages/Mezzo360.tsx:135-148`: match esatto oppure lunghezza con differenza massima 1 e massimo 1 carattere diverso.

Nota:

La funzione `isSameTarga` viene usata su mezzo, sessioni, eventi, manutenzioni, lavori, materiali, segnalazioni, controlli, rifornimenti, gomme e richieste. Nei documenti madre il filtro a `src/pages/Mezzo360.tsx:414-429` usa invece targa normalizzata ed equality esatta. La spec D12 sceglie consapevolmente fuzzy locale per il reader nuovo.

### 2.8 D10 output filtrato non completo

Esito: PASS.

Prova:

- `src/next/domain/nextCentroControlloDomain.ts:262-290`: `D10Snapshot` espone counters, items, focus, important items e liste operative, non un elenco completo per targa di tutte le segnalazioni e tutti i controlli.
- `src/next/domain/nextCentroControlloDomain.ts:1638-1643`: D10 legge le fonti ma non le espone come reader completo mezzo-centrico.

### 2.9 Stato reale del dominio documenti/costi

Esito: FAIL MEDIA sul testo della spec, non sul codice.

Prova:

- Il dominio ha una vista flotta: `readNextDocumentiCostiFleetSnapshot` a `src/next/domain/nextDocumentiCostiDomain.ts:2247`.
- Il dominio ha anche una vista mezzo-centrica: `readNextMezzoDocumentiCostiSnapshot` a `src/next/domain/nextDocumentiCostiDomain.ts:2313-2316`.

Conclusione:

La creazione di D12 resta giustificabile, ma la spec deve citare il reader mezzo-centrico esistente e spiegare perche' D12 non ne e' una duplicazione.

---

## 5. VERIFICHE DECISIONI VINCOLANTI

### 3.1 Domain code D11 e D12

Esito: FAIL MEDIA.

`D11` e `D12` come codici esatti non risultano presenti, ma lo spazio numerico e' gia' usato in codici prefissati:

- `D11-IA-CONFIG`: `src/next/domain/nextIaConfigDomain.ts:8`.
- `D12-IA-LIBRETTO`: `src/next/domain/nextIaLibrettoDomain.ts:18`.

La spec deve risolvere questa ambiguita.

### 3.2 Reader 1 path futuro

Esito: PASS.

`src/next/domain/nextSegnalazioniControlliDomain.ts` non esiste oggi. Il prerequisito e' correttamente futuro.

### 3.3 Reader 2 path futuro

Esito: PASS.

`src/next/domain/nextDocumentiMezzoDomain.ts` non esiste oggi. Il prerequisito e' correttamente futuro.

### 3.4 Opzione B per Reader 2

Esito: PASS.

Le tre fonti documentali sono trattate come collection Firestore in:

- Mezzo 360: `src/pages/Mezzo360.tsx:26-30`, `src/pages/Mezzo360.tsx:231-236`.
- NEXT documenti/costi: `src/next/domain/nextDocumentiCostiDomain.ts:12-16`, `src/next/domain/nextDocumentiCostiDomain.ts:1587-1594`.

Non e' emersa evidenza nel codice verificato di snapshot `storage/@documenti_mezzi`, `storage/@documenti_magazzino`, `storage/@documenti_generici` da usare via `storageSync`.

### 3.5 Fuzzy targa replicato localmente

Esito: PASS.

La spec vieta import dalla madre e chiede replica locale. Il riferimento madre esiste a `src/pages/Mezzo360.tsx:135-148`. La scelta e' coerente con il vincolo madre intoccabile.

---

## 6. VERIFICHE COERENZA INTERNA

### 4.1 Tipi coerenti

Esito: PASS con nota.

I tipi pubblici proposti sono coerenti internamente: snapshot D11 e D12 hanno `domainCode`, `domainName`, `generatedAt`, targa normalizzata, dataset, items, counts e limitations.

Nota: la decisione sui codici `D11` / `D12` deve essere corretta o giustificata per evitare ambiguita con `D11-IA-CONFIG` e `D12-IA-LIBRETTO`.

### 4.2 File dichiarati in "FILE DA RIUSARE"

Esito: PASS con due correzioni richieste.

I file e i range principali esistono. Correzioni:

- Aggiornare `readNextUnifiedCollection` da `159-180` a `159-194`.
- Aggiungere `readNextMezzoDocumentiCostiSnapshot` a `src/next/domain/nextDocumentiCostiDomain.ts:2313`.

### 4.3 File dichiarati in "NON TOCCARE"

Esito: PASS.

Il perimetro vietato copre:

- madre `src/pages/Mezzo360.tsx`;
- D01-D10;
- `nextCentroControlloDomain.ts`;
- `nextDocumentiCostiDomain.ts`;
- ossatura chat;
- settore Mezzi consumer;
- backend IA;
- Archivista.

### 4.4 Definition of Done

Esito: PASS con blocco su codici.

I criteri DoD sono coerenti con le sezioni 2-4. Il punto sui codici `D11` e `D12` deve essere aggiornato insieme alla decisione di sezione 9.

### 4.5 Test utente

Esito: PASS.

I test tecnici e utente sono coerenti con i due reader futuri e con il consumo successivo nel settore Mezzi.

---

## 7. RIEPILOGO RACCOMANDAZIONI

1. Correggere la decisione sui domain code `D11` / `D12` oppure dichiarare esplicitamente perche' i codici esatti non confliggono con i prefissi gia' esistenti `D11-IA-CONFIG` e `D12-IA-LIBRETTO`.
2. Integrare nella spec il fatto che `nextDocumentiCostiDomain.ts` espone gia' `readNextMezzoDocumentiCostiSnapshot` a `src/next/domain/nextDocumentiCostiDomain.ts:2313`, chiarendo il rapporto con D12.
3. Aggiornare il range di `readNextUnifiedCollection` a `src/next/domain/nextUnifiedReadRegistryDomain.ts:159-194`.

Verdetto finale dopo queste correzioni attese: **DA RI-VERIFICARE**.

---

## 8. APPENDICE: file letti

File documentali:

- `docs/product/SPEC_READER_PREREQUISITI_SETTORE_MEZZI_CHAT_IA_NEXT.md`
- `docs/_live/STATO_ATTUALE_PROGETTO.md`
- `docs/product/MAPPA_IA_CHAT_NEXT.md`
- `docs/audit/AUDIT_CHAT_IA_NEXT_RIFACIMENTO_2026-04-27.md`
- `docs/product/SPEC_OSSATURA_CHAT_IA_NEXT.md`
- `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md`

File codice:

- `src/pages/Mezzo360.tsx`
- `src/next/domain/nextUnifiedReadRegistryDomain.ts`
- `src/next/domain/nextCentroControlloDomain.ts`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/nextAnagraficheFlottaDomain.ts`
- `src/next/domain/nextIaConfigDomain.ts`
- `src/next/domain/nextIaLibrettoDomain.ts`
- `src/next/domain/nextRifornimentiDomain.ts`
- `src/next/domain/nextMaterialiMovimentiDomain.ts`
- `src/utils/storageSync.ts`

Path futuri verificati come assenti:

- `src/next/domain/nextSegnalazioniControlliDomain.ts`
- `src/next/domain/nextDocumentiMezzoDomain.ts`

File esclusi:

- Nessun file Archivista analizzato.
