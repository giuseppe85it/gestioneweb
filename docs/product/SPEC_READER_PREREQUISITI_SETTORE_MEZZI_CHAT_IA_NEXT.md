# SPEC READER PREREQUISITI SETTORE MEZZI CHAT IA NEXT

Versione: 2026-04-28
Stato: specifica implementativa vincolante
Ambito: due reader clone-safe prerequisiti del settore Mezzi della Chat IA NEXT

---

## 0. INTRODUZIONE

Questa specifica definisce i due reader clone-safe nuovi che devono esistere prima dell'implementazione del settore Mezzi della Chat IA NEXT.

I due reader sono distinti e vivono in due file separati:

- Reader 1: segnalazioni e controlli completi per targa.
- Reader 2: documenti completi per targa.

Il settore Mezzi li usera' come consumer, senza modificarli. I reader leggono dati reali del clone NEXT, non scrivono dati business, non importano moduli madre e non chiamano IA.

Riferimenti:

- Mappa costituzionale Chat IA NEXT: `docs/product/MAPPA_IA_CHAT_NEXT.md`.
- Audit rifacimento Chat IA NEXT: `docs/audit/AUDIT_CHAT_IA_NEXT_RIFACIMENTO_2026-04-27.md`.
- Ossatura Chat IA NEXT: `docs/product/SPEC_OSSATURA_CHAT_IA_NEXT.md`.
- Spec settore Mezzi: `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md`.
- Codice madre usato solo come riferimento di scope: `src/pages/Mezzo360.tsx`.

---

## 1. CONTESTO

La mappa della Chat IA NEXT chiede una chat unica capace di leggere dati precisi, incrociare settori e produrre report salvabili (`docs/product/MAPPA_IA_CHAT_NEXT.md:10-18`). Il settore Mezzi e' il primo settore reale e deve arrivare a parita funzionale con Mezzo 360.

Mezzo 360 madre oggi legge molti dataset con `getItemSync`: le chiavi sono dichiarate in `src/pages/Mezzo360.tsx:13-24` e lette in parallelo in `src/pages/Mezzo360.tsx:293-305`. Per segnalazioni e controlli usa:

- `@segnalazioni_autisti_tmp` (`src/pages/Mezzo360.tsx:19`);
- `@controlli_mezzo_autisti` (`src/pages/Mezzo360.tsx:20`).

Mezzo 360 filtra le segnalazioni per targa in `src/pages/Mezzo360.tsx:491-497` e i controlli in `src/pages/Mezzo360.tsx:500-506`. Quei dati entrano anche nella timeline madre (`src/pages/Mezzo360.tsx:562-583`).

D10 legge gia' le stesse fonti storage (`src/next/domain/nextCentroControlloDomain.ts:19-21`) tramite `readNextUnifiedStorageDocument` (`src/next/domain/nextCentroControlloDomain.ts:1638-1643`), ma il suo output e' uno stato operativo filtrato: counters, alert, focus e item importanti (`src/next/domain/nextCentroControlloDomain.ts:262-287`). Non espone l'elenco completo per targa richiesto dal settore Mezzi.

Mezzo 360 legge i documenti in modo diverso: dichiara le collection `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici` in `src/pages/Mezzo360.tsx:26-30` e le legge con `getDocs(collection(db, colName))` in `src/pages/Mezzo360.tsx:231-236`. La Chat IA NEXT non deve replicare questa lettura sparsa nei componenti o nel runner: serve un reader mezzo-centrico dedicato.

Il dominio documenti/costi NEXT conosce gia' quelle collection (`src/next/domain/nextDocumentiCostiDomain.ts:12-16`) e le legge in sola lettura (`src/next/domain/nextDocumentiCostiDomain.ts:1587-1594`). Tuttavia la spec del settore Mezzi richiede un reader dedicato per documenti completi per targa (`docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:181-193`), separato dal reader generale documenti/costi.

---

## 2. READER 1 - SEGNALAZIONI E CONTROLLI

### 2.1 Path e nome file

File da creare:

```text
src/next/domain/nextSegnalazioniControlliDomain.ts
```

Export principale:

```ts
export async function readNextMezzoSegnalazioniControlliSnapshot(
  targa: string
): Promise<NextMezzoSegnalazioniControlliSnapshot>;
```

Il file e' un reader autonomo. Non deve essere accorpato al reader documenti e non deve modificare D10.

### 2.2 Domain code

Domain code vincolante:

```ts
export const NEXT_SEGNALAZIONI_CONTROLLI_DOMAIN = {
  code: "D11-MEZ-EVENTI",
  name: "Segnalazioni e controlli completi per mezzo",
  logicalDatasets: ["@segnalazioni_autisti_tmp", "@controlli_mezzo_autisti"] as const,
  activeReadOnlyDatasets: ["@segnalazioni_autisti_tmp", "@controlli_mezzo_autisti"] as const,
} as const;
```

Motivo: `D11-MEZ-EVENTI` e' un codice descrittivo che evita confusione con il dominio gia' esistente `D11-IA-CONFIG` (`src/next/domain/nextIaConfigDomain.ts:7-14`). Lo spazio numerico e' condiviso, ma il suffisso descrittivo rende il dominio inconfondibile.

### 2.3 Sorgenti dati

Sorgenti clone-safe:

- `storage/@segnalazioni_autisti_tmp`;
- `storage/@controlli_mezzo_autisti`.

Il reader deve usare `readNextUnifiedStorageDocument` da `src/next/domain/nextUnifiedReadRegistryDomain.ts:116-157`, non `getItemSync` diretto. Il pattern e' coerente con D10, che legge le stesse chiavi in `src/next/domain/nextCentroControlloDomain.ts:1638-1643`.

Chiavi preferite per unwrap:

- segnalazioni: `["items", "value", "segnalazioni"]`;
- controlli: `["items", "value", "controlli"]`.

Se la shape reale non contiene una di queste chiavi ma `readNextUnifiedStorageDocument` ritorna comunque records, il reader deve usare `records` e riportare una nota in `limitations`.

### 2.4 Tipo di ritorno

Shape TypeScript richiesta:

```ts
export type NextMezzoSegnalazioniControlliMatchKind =
  | "exact"
  | "fuzzy"
  | "none";

export type NextMezzoSegnalazioneItem = {
  id: string;
  sourceKey: "@segnalazioni_autisti_tmp";
  sourceRecordId: string | null;
  targaRichiesta: string;
  targaMatch: string | null;
  matchKind: NextMezzoSegnalazioniControlliMatchKind;
  targaFields: {
    targa: string | null;
    targaCamion: string | null;
    targaRimorchio: string | null;
  };
  data: string | null;
  timestamp: number | null;
  titolo: string;
  descrizione: string | null;
  categoria: string | null;
  ambito: string | null;
  stato: string | null;
  severita: "info" | "warning" | "critical" | "unknown";
  raw: Record<string, unknown>;
};

export type NextMezzoControlloItem = {
  id: string;
  sourceKey: "@controlli_mezzo_autisti";
  sourceRecordId: string | null;
  targaRichiesta: string;
  targaMatch: string | null;
  matchKind: NextMezzoSegnalazioniControlliMatchKind;
  targaFields: {
    targa: string | null;
    targaCamion: string | null;
    targaRimorchio: string | null;
  };
  data: string | null;
  timestamp: number | null;
  titolo: string;
  descrizione: string | null;
  target: string | null;
  esito: "ok" | "ko" | "unknown";
  note: string | null;
  raw: Record<string, unknown>;
};

export type NextMezzoSegnalazioniControlliCounts = {
  segnalazioniTotali: number;
  controlliTotali: number;
  controlliOk: number;
  controlliKo: number;
  segnalazioniCritical: number;
  segnalazioniWarning: number;
  fuzzyMatches: number;
  unreadableRecords: number;
};

export type NextMezzoSegnalazioniControlliSnapshot = {
  domainCode: "D11-MEZ-EVENTI";
  domainName: "Segnalazioni e controlli completi per mezzo";
  generatedAt: string;
  targa: string;
  targaNormalized: string;
  logicalDatasets: readonly [
    "@segnalazioni_autisti_tmp",
    "@controlli_mezzo_autisti"
  ];
  activeReadOnlyDatasets: readonly [
    "@segnalazioni_autisti_tmp",
    "@controlli_mezzo_autisti"
  ];
  segnalazioni: NextMezzoSegnalazioneItem[];
  controlli: NextMezzoControlloItem[];
  counts: NextMezzoSegnalazioniControlliCounts;
  timelineItems: NextMezzoSegnalazioniControlliTimelineItem[];
  limitations: string[];
};

export type NextMezzoSegnalazioniControlliTimelineItem = {
  id: string;
  source: "segnalazione" | "controllo";
  sourceKey: "@segnalazioni_autisti_tmp" | "@controlli_mezzo_autisti";
  timestamp: number | null;
  data: string | null;
  title: string;
  subtitle: string | null;
  detail: string | null;
  raw: Record<string, unknown>;
};
```

### 2.5 Funzioni esposte

Funzioni obbligatorie:

```ts
export function normalizeNextSegnalazioniControlliTarga(value: unknown): string;

export function isNextSegnalazioniControlliSameTarga(
  candidate: unknown,
  target: unknown
): boolean;

export async function readNextMezzoSegnalazioniControlliSnapshot(
  targa: string
): Promise<NextMezzoSegnalazioniControlliSnapshot>;
```

Comportamento:

1. Normalizza la targa richiesta.
2. Legge le due fonti storage con `readNextUnifiedStorageDocument`.
3. Converte solo record oggetto; i record non oggetto aumentano `unreadableRecords`.
4. Filtra segnalazioni su `targaCamion`, `targaRimorchio`, `targa`.
5. Filtra controlli su `targaCamion`, `targaRimorchio`, `targa`.
6. Ordina segnalazioni, controlli e timeline per timestamp decrescente.
7. Ritorna lista vuota e `limitations` esplicite se la targa e' vuota o le fonti mancano.

### 2.6 Filtri targa

La logica deve replicare il fuzzy match di Mezzo 360, non importarlo da `src/pages/Mezzo360.tsx`.

Riferimento madre:

- normalizzazione targa: `src/pages/Mezzo360.tsx:70-72`;
- fuzzy match: `src/pages/Mezzo360.tsx:135-148`.

Regole:

1. Normalizzare in uppercase e rimuovere caratteri non alfanumerici.
2. Match esatto prima di tutto.
3. Fuzzy ammesso solo se la differenza di lunghezza e' al massimo 1.
4. Fuzzy ammesso solo se i caratteri diversi, sul minimo della lunghezza, sono al massimo 1.
5. Non usare Levenshtein generica o match per substring.
6. Restituire `matchKind: "exact"` o `"fuzzy"` per ogni record incluso.

### 2.7 Limiti e casi edge

- Targa vuota: snapshot valido, liste vuote, limitation "Targa non valida o assente".
- Storage mancante: liste vuote per la fonte mancante, limitation dedicata.
- Date non parsabili: `timestamp: null`, record mantenuto e ordinato dopo quelli datati.
- Duplicati: il reader non deduplica record con id diversi; se stesso `sourceRecordId` si ripete nella stessa fonte, mantiene il primo e aggiunge limitation.
- Campo targa multiplo: basta un campo coerente per includere il record.
- Fuzzy multiplo: non e' ambiguita a livello record; l'ambiguita mezzo viene gestita dal settore Mezzi prima di chiamare il reader.

### 2.8 Cosa NON fa

- Non modifica D10.
- Non scrive in Firestore o Storage.
- Non chiama backend OpenAI.
- Non produce testo finale per chat.
- Non decide se una segnalazione e' importante: espone tutto il leggibile.
- Non legge gomme, rifornimenti, richieste attrezzature o manutenzioni.

---

## 3. READER 2 - DOCUMENTI

### 3.1 Path e nome file

File da creare:

```text
src/next/domain/nextDocumentiMezzoDomain.ts
```

Export principale:

```ts
export async function readNextMezzoDocumentiSnapshot(
  targa: string
): Promise<NextMezzoDocumentiSnapshot>;
```

Il file resta separato da `nextSegnalazioniControlliDomain.ts`.

### 3.2 Domain code

Domain code vincolante:

```ts
export const NEXT_DOCUMENTI_MEZZO_DOMAIN = {
  code: "D12-MEZ-DOCUMENTI",
  name: "Documenti completi per mezzo",
  logicalDatasets: [
    "@documenti_mezzi",
    "@documenti_magazzino",
    "@documenti_generici",
  ] as const,
  activeReadOnlyDatasets: [
    "@documenti_mezzi",
    "@documenti_magazzino",
    "@documenti_generici",
  ] as const,
} as const;
```

Motivo: D07-D08 resta il dominio documenti/costi generale (`src/next/domain/nextDocumentiCostiDomain.ts:106-123`). `D12-MEZ-DOCUMENTI` e' il reader puntuale mezzo-centrico richiesto dal settore Mezzi e usa un codice descrittivo che evita confusione con il dominio gia' esistente `D12-IA-LIBRETTO` (`src/next/domain/nextIaLibrettoDomain.ts:17-24`). Lo spazio numerico e' condiviso, ma il suffisso descrittivo rende il dominio inconfondibile.

### 3.3 Decisione architetturale

Decisione: opzione B.

Il reader 2 deve essere un adapter clone-safe nuovo che legge le collection Firestore documentali in sola lettura, dentro `src/next/domain/nextDocumentiMezzoDomain.ts`.

Funzione esistente correlata:

`readNextMezzoDocumentiCostiSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2313`).

Questa funzione legge gia' i documenti per targa filtrando `fleetItems`, ma NON sostituisce il Reader 2 perche':

- mischia documenti e costi nello stesso snapshot, mentre il Reader 2 ha contratto documentale puro;
- non garantisce copertura completa delle 3 collection (`@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`);
- non implementa fuzzy match targa equivalente a Mezzo 360 (`src/pages/Mezzo360.tsx:135-148`);
- vive nel dominio D07-D08 generale, non in un dominio mezzo-centrico dedicato.

Il Reader 2 non sostituisce `readNextMezzoDocumentiCostiSnapshot`: sono complementari. La funzione esistente continua a servire chi ha bisogno di documenti+costi insieme. Il Reader 2 serve il settore Mezzi della chat IA NEXT con un contratto puro di documenti completi per targa.
Questo riferimento evita duplicazioni inconsapevoli ma non diventa una dipendenza del Reader 2.

Motivazione verificata nel codice:

- Le tre fonti documentali sono collection Firestore in Mezzo 360 (`src/pages/Mezzo360.tsx:26-30`).
- Mezzo 360 le legge con `getDocs(collection(db, colName))` (`src/pages/Mezzo360.tsx:231-236`).
- Il dominio documenti/costi NEXT dichiara le stesse collection (`src/next/domain/nextDocumentiCostiDomain.ts:12-16`).
- Il dominio documenti/costi NEXT le legge con `getDocs(collection(db, collectionKey))` (`src/next/domain/nextDocumentiCostiDomain.ts:1587-1594`).
- Non c'e' evidenza che `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici` siano gia' disponibili come snapshot `storage/<key>` tramite `storageSync`; `getItemSync` legge `storage/<key>` (`src/utils/storageSync.ts:139-150`), ma i documenti sono trattati dal codice reale come collection.

Quindi il reader 2 non deve usare opzione A. Non deve spostare o sincronizzare dati. Deve confinare la lettura Firestore a un reader domain clone-safe, senza `getDocs` sparsi nel runner, nei componenti o nella shell chat.

### 3.4 Sorgenti dati

Collection lette:

- `@documenti_mezzi`;
- `@documenti_magazzino`;
- `@documenti_generici`.

Metodo di lettura:

- `getDocs(collection(db, collectionName))`, solo dentro il reader `D12-MEZ-DOCUMENTI`;
- in alternativa ammessa: `readNextUnifiedCollection` da `src/next/domain/nextUnifiedReadRegistryDomain.ts:159-194`, se durante l'implementazione risulta piu' coerente con i reader domain esistenti.

Il comportamento pubblico resta identico: snapshot read-only, nessuna scrittura, nessun download file, nessuna modifica ai record.

### 3.5 Tipo di ritorno

Shape TypeScript richiesta:

```ts
export type NextDocumentoMezzoSourceKey =
  | "@documenti_mezzi"
  | "@documenti_magazzino"
  | "@documenti_generici";

export type NextDocumentoMezzoMatchKind =
  | "exact"
  | "fuzzy"
  | "none";

export type NextDocumentoMezzoItem = {
  id: string;
  sourceKey: NextDocumentoMezzoSourceKey;
  sourceDocId: string;
  targaRichiesta: string;
  targa: string | null;
  targaMatch: string | null;
  matchKind: NextDocumentoMezzoMatchKind;
  tipoDocumento: string | null;
  categoria:
    | "libretto"
    | "fattura"
    | "preventivo"
    | "certificato"
    | "allegato"
    | "altro";
  titolo: string;
  descrizione: string | null;
  fornitore: string | null;
  numeroDocumento: string | null;
  dataDocumento: string | null;
  timestamp: number | null;
  importo: number | null;
  valuta: "EUR" | "CHF" | "UNKNOWN";
  fileUrl: string | null;
  nomeFile: string | null;
  mimeType: string | null;
  daVerificare: boolean;
  raw: Record<string, unknown>;
};

export type NextMezzoDocumentiCounts = {
  total: number;
  documentiMezzo: number;
  documentiMagazzino: number;
  documentiGenerici: number;
  libretti: number;
  fatture: number;
  preventivi: number;
  certificati: number;
  allegati: number;
  altri: number;
  withFile: number;
  withoutFile: number;
  fuzzyMatches: number;
  unreadableRecords: number;
};

export type NextMezzoDocumentiSnapshot = {
  domainCode: "D12-MEZ-DOCUMENTI";
  domainName: "Documenti completi per mezzo";
  generatedAt: string;
  targa: string;
  targaNormalized: string;
  logicalDatasets: readonly [
    "@documenti_mezzi",
    "@documenti_magazzino",
    "@documenti_generici"
  ];
  activeReadOnlyDatasets: readonly [
    "@documenti_mezzi",
    "@documenti_magazzino",
    "@documenti_generici"
  ];
  items: NextDocumentoMezzoItem[];
  bySource: Record<NextDocumentoMezzoSourceKey, NextDocumentoMezzoItem[]>;
  counts: NextMezzoDocumentiCounts;
  limitations: string[];
};
```

### 3.6 Funzioni esposte

Funzioni obbligatorie:

```ts
export function normalizeNextDocumentiMezzoTarga(value: unknown): string;

export function isNextDocumentiMezzoSameTarga(
  candidate: unknown,
  target: unknown
): boolean;

export async function readNextMezzoDocumentiSnapshot(
  targa: string
): Promise<NextMezzoDocumentiSnapshot>;
```

Comportamento:

1. Normalizza la targa richiesta.
2. Legge le tre collection documentali in parallelo.
3. Per ogni documento aggiunge `sourceKey` e `sourceDocId`.
4. Scarta solo record non oggetto o senza match targa dimostrabile.
5. Mappa tipo, data, importo, valuta, fileUrl, nomeFile e fornitore quando presenti.
6. Deduplica con chiave `${sourceKey}:${sourceDocId}`.
7. Ordina per `timestamp` decrescente; i record senza data restano in fondo.
8. Ritorna lista vuota e limitation esplicita quando nessun documento e' collegato alla targa.

### 3.7 Filtri targa

La logica fuzzy deve essere coerente con Mezzo 360:

- normalizzazione madre: `src/pages/Mezzo360.tsx:70-72`;
- fuzzy match madre: `src/pages/Mezzo360.tsx:135-148`.

Campi candidati da valutare, in ordine:

1. `raw.targa`;
2. `raw.mezzoTarga`;
3. `raw.metadatiMezzo.targa`, se `metadatiMezzo` e' oggetto;
4. `raw.targaCamion` e `raw.targaRimorchio`, se presenti;
5. eventuali alias espliciti gia' usati dai record documentali, solo se sono campi strutturati di targa.

Divieti:

- non inferire targa da `nomeFile`;
- non inferire targa da testo OCR libero;
- non fare substring match sul documento intero.

Questa regola e' coerente con il dominio documenti/costi, che dichiara prudenza sulle inferenze deboli da filename o testo libero (`src/next/domain/nextDocumentiCostiDomain.ts:1781-1782`).

### 3.8 Limiti e casi edge

- Targa vuota: snapshot valido, lista vuota, limitation "Targa non valida o assente".
- Collection non leggibile: non fallire l'intero snapshot; aggiungere limitation e continuare con le altre collection.
- Documento senza file: mantenere il record con `fileUrl: null`.
- Documento senza tipo: categoria `"altro"`, `tipoDocumento: null`, limitation solo se il numero di record senza tipo e' rilevante.
- Record duplicato tra collection diverse: non deduplicare cross-collection; deduplica solo stesso `sourceKey:sourceDocId`.
- Importo non parsabile: `importo: null`, `valuta: "UNKNOWN"`.
- Data non parsabile: `timestamp: null`.

### 3.9 Cosa NON fa

- Non modifica `nextDocumentiCostiDomain.ts`.
- Non scrive in Firestore o Storage.
- Non carica o scarica PDF.
- Non apre anteprime.
- Non chiama IA.
- Non sostituisce l'Archivista e non ricostruisce analisi Archivista.
- Non legge preventivi globali `storage/@preventivi`: la copertura `D12-MEZ-DOCUMENTI` e' solo sulle tre collection documentali usate da Mezzo 360.

---

## 4. CONTRATTO COMUNE

Entrambi i reader rispettano queste regole:

1. Sono read-only.
2. Non fanno write business.
3. Non modificano reader D01-D10.
4. Non importano file madre da `src/pages/**`.
5. Non importano componenti React.
6. Non chiamano backend OpenAI.
7. Non espongono `any` nei tipi pubblici; usare `Record<string, unknown>` per `raw`.
8. Restituiscono sempre snapshot validi, anche se vuoti o parziali.
9. Espongono `limitations` leggibili in italiano per dati mancanti o fonti parziali.
10. Mantengono i dati grezzi in `raw` per permettere incroci IA spiegabili.

Il settore Mezzi puo' comporre questi snapshot con D01, D02, D04, D05 e D10, come richiesto dalla spec settore Mezzi (`docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:383`).

---

## 5. FILE ESISTENTI DA RIUSARE

File e riferimenti reali:

- `src/next/domain/nextUnifiedReadRegistryDomain.ts:116-157`: `readNextUnifiedStorageDocument`, da usare per Reader 1.
- `src/next/domain/nextUnifiedReadRegistryDomain.ts:159-194`: `readNextUnifiedCollection`, ammesso per Reader 2 se si sceglie helper unificato invece di `getDocs` diretto nel reader.
- `src/next/nextAnagraficheFlottaDomain.ts:291-293`: `normalizeNextMezzoTarga`, riferimento interno NEXT per normalizzazione targa.
- `src/next/domain/nextCentroControlloDomain.ts:19-21`: chiavi segnalazioni e controlli gia' note a D10.
- `src/next/domain/nextCentroControlloDomain.ts:262-287`: shape D10 che dimostra output filtrato, non completo.
- `src/next/domain/nextCentroControlloDomain.ts:1638-1643`: lettura storage D10 delle fonti usate dal Reader 1.
- `src/next/domain/nextDocumentiCostiDomain.ts:12-16`: collection documentali gia' note al dominio documenti/costi.
- `src/next/domain/nextDocumentiCostiDomain.ts:106-123`: dominio D07-D08 generale documenti/costi.
- `src/next/domain/nextDocumentiCostiDomain.ts:125-161`: campi documentali read-only gia' normalizzati dal dominio generale.
- `src/next/domain/nextDocumentiCostiDomain.ts:1587-1594`: lettura Firestore delle tre collection documentali.
- `src/next/domain/nextDocumentiCostiDomain.ts:1739-1750`: limitation sul perimetro documenti/costi mezzo-centrico.
- `src/next/domain/nextDocumentiCostiDomain.ts:2247`: entry point fleet snapshot esistente, riferimento ma non sostituto del Reader 2.
- `src/next/domain/nextDocumentiCostiDomain.ts:2313`: `readNextMezzoDocumentiCostiSnapshot`, esistente, citato come riferimento. NON va importato dal Reader 2.
- `src/pages/Mezzo360.tsx:13-24`: storage keys madre da cui derivano le fonti Reader 1.
- `src/pages/Mezzo360.tsx:26-30`: collection documentali madre da cui deriva Reader 2.
- `src/pages/Mezzo360.tsx:70-72`: normalizzazione targa madre.
- `src/pages/Mezzo360.tsx:135-148`: fuzzy match targa madre da replicare.
- `src/pages/Mezzo360.tsx:231-236`: lettura documenti madre tramite `getDocs`.
- `src/pages/Mezzo360.tsx:293-305`: letture `getItemSync` madre, riferimento di scope ma non da riusare.
- `src/pages/Mezzo360.tsx:407-489`: filtro, dedup e ordinamento documenti madre.
- `src/pages/Mezzo360.tsx:491-506`: filtro targa segnalazioni e controlli madre.
- `src/pages/Mezzo360.tsx:543-615`: timeline madre.
- `docs/audit/AUDIT_CHAT_IA_NEXT_RIFACIMENTO_2026-04-27.md:232-235`: audit che riassume fonti storage, collection e letture di Mezzo 360.
- `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:170-193`: prerequisiti Reader 1 e Reader 2 dichiarati dal settore Mezzi.

---

## 6. FILE ESISTENTI DA NON TOCCARE

- `src/pages/Mezzo360.tsx`: riferimento madre, non importare e non modificare.
- Reader esistenti D01-D10: riuso solo via import dove esplicitamente previsto.
- `src/next/domain/nextCentroControlloDomain.ts`: non estendere per ottenere liste complete.
- `src/next/domain/nextDocumentiCostiDomain.ts`: non modificare per il Reader 2.
- `src/next/chat-ia/core/**`: ossatura chat, non necessaria per implementare i reader.
- `src/next/chat-ia/sectors/mezzi/**`: consumer futuro, non parte di questa implementazione reader.
- Backend IA.
- Archivista.

---

## 7. DEFINITION OF DONE READER

I due reader sono pronti quando tutte queste condizioni sono vere:

1. Esiste `src/next/domain/nextSegnalazioniControlliDomain.ts`.
2. Esiste `src/next/domain/nextDocumentiMezzoDomain.ts`.
3. I due file sono separati.
4. Reader 1 esporta `NEXT_SEGNALAZIONI_CONTROLLI_DOMAIN` con `code: "D11-MEZ-EVENTI"`.
5. Reader 2 esporta `NEXT_DOCUMENTI_MEZZO_DOMAIN` con `code: "D12-MEZ-DOCUMENTI"`.
6. Reader 1 legge `@segnalazioni_autisti_tmp` e `@controlli_mezzo_autisti`.
7. Reader 2 legge `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`.
8. Nessuno dei due reader scrive in Firestore o Storage.
9. Nessuno dei due reader importa `src/pages/Mezzo360.tsx`.
10. Entrambi gestiscono targa vuota con snapshot vuoto e limitation.
11. Entrambi replicano la logica fuzzy a distanza massima 1 carattere.
12. Reader 1 espone liste complete, non solo item importanti D10.
13. Reader 2 espone documenti completi per targa, non placeholder.
14. Reader 2 non inferisce targhe da filename o testo libero.
15. Build verde.
16. Lint verde sui due file nuovi.
17. Il settore Mezzi puo' importarli senza modificare i reader.

---

## 8. TEST DI ACCETTAZIONE

Test tecnici prima del settore Mezzi:

1. Chiamare `readNextMezzoSegnalazioniControlliSnapshot("TARGA_REALE")`: atteso snapshot `D11-MEZ-EVENTI` con segnalazioni e controlli coerenti con `@segnalazioni_autisti_tmp` e `@controlli_mezzo_autisti`.
2. Chiamare `readNextMezzoSegnalazioniControlliSnapshot("targa con spazi")`: atteso stesso risultato della targa normalizzata.
3. Chiamare `readNextMezzoSegnalazioniControlliSnapshot("TARGA_CON_1_ERRORE")`: atteso match fuzzy se esiste una sola differenza.
4. Chiamare `readNextMezzoDocumentiSnapshot("TARGA_REALE")`: atteso snapshot `D12-MEZ-DOCUMENTI` con documenti da tutte le tre collection dove la targa e' dimostrabile.
5. Verificare che i documenti senza `fileUrl` restino in lista con `fileUrl: null`.
6. Verificare che un documento duplicato nella stessa collection non appaia due volte.
7. Chiamare entrambi i reader con targa inesistente: atteso snapshot vuoto, nessun errore non gestito, limitation leggibile.
8. Eseguire `npm run build`.
9. Eseguire lint mirato sui due file nuovi.

Test utente dopo integrazione nel settore Mezzi:

1. In Chat IA NEXT chiedere `timeline mezzo TARGA`.
2. Verificare che segnalazioni e controlli completi entrino nella timeline.
3. Chiedere `documenti mezzo TARGA`.
4. Verificare che la lista documenti sia reale e non placeholder.

---

## 9. DECISIONI VINCOLANTI

1. Reader 1 vive in `src/next/domain/nextSegnalazioniControlliDomain.ts`.
2. Reader 2 vive in `src/next/domain/nextDocumentiMezzoDomain.ts`.
3. Reader 1 domain code: `D11-MEZ-EVENTI`.
4. Reader 2 domain code: `D12-MEZ-DOCUMENTI`.
5. Reader 1 usa storage clone-safe tramite `readNextUnifiedStorageDocument`.
6. Reader 2 usa opzione B: nuovo adapter clone-safe che legge le collection Firestore documentali in sola lettura.
7. Reader 2 non usa opzione A perche' il codice reale tratta `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici` come collection, non come snapshot storage.
8. Fuzzy targa: replicare la logica di Mezzo 360 localmente nei reader, senza importare la madre.
9. I due reader non modificano D01-D10.
10. I due reader non chiamano IA e non producono risposta testuale finale.

---

## 10. APPENDICE: file letti

- `docs/product/MAPPA_IA_CHAT_NEXT.md`
- `docs/audit/AUDIT_CHAT_IA_NEXT_RIFACIMENTO_2026-04-27.md`
- `docs/product/SPEC_OSSATURA_CHAT_IA_NEXT.md`
- `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md`
- `src/pages/Mezzo360.tsx`
- `src/next/domain/nextUnifiedReadRegistryDomain.ts`
- `src/next/domain/nextCentroControlloDomain.ts`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/nextAnagraficheFlottaDomain.ts`
- `src/utils/storageSync.ts`
