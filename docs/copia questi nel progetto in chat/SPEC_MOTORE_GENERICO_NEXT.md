# SPEC Motore Generico NEXT

## 1. Identita del documento

Versione: v1.0 STABLE — 2026-05-06
- **Data**: 2026-05-04
- **Autore**: Giuseppe (decisioni) + Codex (stesura)
- **Annotazione 2026-05-06**: matrice chiusura Chat IA NEXT completata per V1; Registro promosso a 1.0 STABLE, C6/C7 PASS, Playwright 17-21 PASS 10/10, diagnostics T1..T28 PASS, #4 chiusa con Opzione A, #13 `DEFERRED_OK`.
- **Scopo**: definire il motore generico data-driven della Chat IA NEXT.
- **Relazione con spec esistenti**: questo documento ESTENDE `SPEC_CHAT_ZERO_INVENZIONI_NEXT.md`. NON lo sostituisce. NON lo duplica.
- **Documento di pari livello successivo**: `SPEC_PANNELLO_PROVE_NEXT.md` (da scrivere dopo questo).

Questa spec definisce il contratto architetturale del motore generico v1. I contratti gia' definiti nella spec Zero-Invenzioni restano fonte primaria per schema strict, Action Router, Catalog Validator, viste certificate, Relation Resolver, `relationProof`, frasi di accompagnamento e report PDF.

## 2. Decisione e principio

Il principio Zero-Invenzioni resta invariato: l'LLM non produce dati business, non produce relazioni e non mostra testo libero sui dati. Per il principio completo e i confini dell'LLM, vedere §4 e §5 di `SPEC_CHAT_ZERO_INVENZIONI_NEXT.md`.

Obiettivo: la chat NEXT si comporta come MODALE INTELLIGENTE DEL GESTIONALE, non come chat narrativa.

Mandato del motore generico:

1. capire la richiesta gia' normalizzata dall'Action Router;
2. scegliere collection e campi dal Registro Collection Firestore;
3. leggere Firestore live tramite boundary readonly;
4. mostrare dati certificati;
5. produrre provenance per ogni record e `relationProof` per ogni relazione visualizzata.

Il motore generico v1 e' read-only. Non scrive, non corregge Firestore, non sostituisce moduli gestionali.

## 3. Stato di partenza e scoperta architetturale

Punto di partenza operativo:

- `post-llm-resolver.js` e' Driver360-specifico. L'audit PROMPT 24a ha verificato che filtra boundary su `collection === "storage"` e `docId === datasetKey` (`post-llm-resolver.js:73-80`), legge un solo documento Firestore esatto (`:126-132`), popola `resolvedFilters` in forma single-record (`:147-155`) e ritorna `not_driver360` per viste diverse (`:270-279`).
- La shape attuale di `resolvedFilters` e' pensata per Driver360 e non contiene un collettore multi-record.
- Le 6 entry boundary Euromecc con `accessMode === "collection_root"` sono dichiarate ma dormienti finche' il runtime non le consuma.
- Le 6 root collection `@documenti_*` x3 e Cisterna x3 sono bloccate dietro lo stesso problema runtime.
- `REGISTRO_COLLECTION_FIRESTORE.md` v1.0 STABLE e' disponibile come mappa dati architetturale V1: collection, allowedFields, alias, match rules, esclusioni by design, evidence graph e convenzioni provenance.

Conclusione: la patch `collection_root` non va applicata dentro `post-llm-resolver.js` in isolamento. Viene assorbita nel motore generico v1, che nasce con shape multi-vista e multi-record.

## 4. Architettura target del motore generico

### 4.1 Flusso end-to-end

```text
Utente
  |
  v
LLM Action Router
  |  output strict: action/view/filters/accompaniment
  v
Catalog Validator
  |
  v
Registry Reader
  |  collection, allowedFields, alias, match rules, esclusioni
  v
Resolver Universale
  |  exact_document + collection_root + provenance
  v
Shape collettore multi-record
  |
  +--> Relation Resolver deterministico
  |
  v
Vista generica data-driven / componenti React dedicati
  |
  v
Renderer React certificato
```

Il flusso estende quello di §4.1 di `SPEC_CHAT_ZERO_INVENZIONI_NEXT.md`. Cambiano i blocchi dati dopo il Catalog Validator: entrano Registry Reader, Resolver Universale e shape collettore multi-record.

### 4.2 Ruoli

- **LLM Action Router**: invariato. Classifica intent, azione, vista e filtri ammessi. Vedere §4 e §5 di `SPEC_CHAT_ZERO_INVENZIONI_NEXT.md`.
- **Catalog Validator**: invariato. Valida shape, intent e fallback strutturato. Vedere §11 di `SPEC_CHAT_ZERO_INVENZIONI_NEXT.md`.
- **Registry Reader (NUOVO)**: usa il registro come fonte architetturale, esponendo alias, match rules, allowedFields ed esclusioni al Resolver Universale tramite configurazione machine-readable dedicata. In V1 la proiezione runtime e' `backend/internal-ai/server/lib/registry.config.js`; il motore NON parsa il file Markdown a runtime.
- **Resolver Universale (NUOVO)**: affianca inizialmente `post-llm-resolver.js` Driver360-specifico e lo sostituisce solo dopo parita' verificata con test verdi. Consuma entry boundary `exact_document` e `collection_root`. Produce output multi-record.
- **Vista Generica data-driven (NUOVO)**: la data-drivenness riguarda la logica dati. La UI puo' restare composta da componenti React dedicati per ciascuna vista, purche' leggano la stessa shape certificata del motore generico.
- **Relation Resolver**: invariato come principio deterministico. Vedere §8 e §14 di `SPEC_CHAT_ZERO_INVENZIONI_NEXT.md`.
- **Renderer React certificato**: invariato. Non legge testo libero LLM. Vedere §4 e §7 di `SPEC_CHAT_ZERO_INVENZIONI_NEXT.md`.

## 5. Resolver universale

### 5.1 Affiancamento di post-llm-resolver.js

Il Resolver Universale affianca il branch Driver360-specifico oggi attivo. Non lo sostituisce finche' non esiste parita' verificata secondo §10.

Eredita:

- input LLM gia' validato dal Catalog Validator;
- pipeline pre/post LLM definita nella spec base;
- divieto di fallback narrativo;
- vincolo che l'LLM non riceve id candidati.

Vedere §5.4, §9 e §11 di `SPEC_CHAT_ZERO_INVENZIONI_NEXT.md` per risoluzione backend, disambiguazione e validazione.

Cambia:

- gestione multi-vista;
- gestione multi-entry boundary;
- gestione multi-record;
- produzione sistematica di provenance per ogni record.

### 5.2 Lettura entry boundary

Il Resolver Universale supporta solo accessMode gia' presenti nel boundary e nel registro:

- **`exact_document`**: comportamento equivalente al runtime attuale. Lettura di un documento esatto, filtro su `allowedFields`, esclusione `forbiddenFields`, nessun listing libero.
- **`collection_root`**: lettura della root collection indicata da `entry.collection`, con cap obbligatori da `requestLimits`. Ogni documento ritornato viene filtrato su `allowedFields` e poi su `forbiddenFields` prima di entrare nel collettore.
- **`exact_object_path_from_firestore_field`**: per riferimenti Storage gia' tracciati tramite campo Firestore tecnico. Non e' accessMode per leggere root collection Firestore. Il suo uso resta subordinato a path tecnici, non URL firmati. Per report/archiviazione e reader interni vedere §12 e §13 di `SPEC_CHAT_ZERO_INVENZIONI_NEXT.md`.

Regole permanenti:

- nessun campo fuori `allowedFields`;
- nessun campo in `forbiddenFields`;
- nessun URL firmato;
- nessun campo libero come prova di relazione;
- nessuna inferenza da nome simile, targa simile o note.

### 5.3 Shape collettore multi-record `resolvedFilters`

Snippet TypeScript-like, non codice eseguibile:

```text
ResolvedFiltersV2 = {
  version: "resolvedFilters.v2",
  legacyDriver360?: LegacyDriver360ResolvedFilters | null,
  query: {
    action: ActionEnum,
    view: ViewEnum | null,
    entityKind: EntityKind | null,
    searchText: string | null,
    periodPreset: PeriodPreset | null
  },
  entries: Array<ResolvedEntry>,
  disambiguation: DisambiguationShape | null,
  errors: Array<ResolverError>
}

ResolvedEntry = {
  boundaryEntryId: string,
  sourceCollection: string,
  accessModeUsed: "exact_document" | "collection_root" | "exact_object_path_from_firestore_field",
  records: Array<CertifiedRecord>,
  status: "ok" | "empty" | "not_found" | "error"
}

CertifiedRecord = {
  sourceRecordId: string,
  fields: Record<string, CertifiedField>,
  provenance: RecordProvenance
}

CertifiedField = {
  value: unknown,
  sourceField: string,
  sourceValueType: "string" | "number" | "boolean" | "object" | "array" | "timestamp" | "null"
}

RecordProvenance = {
  sourceCollection: string,
  sourceRecordId: string,
  sourceFields: Array<string>,
  accessModeUsed: string,
  boundaryEntryId: string,
  confidence: "certified" | "weak" | "rejected" | "unknown"
}

ResolverError = {
  kind: "boundary_entry_not_found" | "collection_empty" | "firestore_error" | "shape_rejected",
  boundaryEntryId: string | null,
  messageKey: AccompanimentKindEnum
}
```

`legacyDriver360` consente coesistenza temporanea con la shape single-record attuale. Non autorizza output LLM libero e non cambia lo schema strict della spec base.

Il collettore puo' contenere 0..N record certificati per ciascuna entry richiesta. La disambiguazione resta quella della spec base; vedere §9 di `SPEC_CHAT_ZERO_INVENZIONI_NEXT.md`.

### 5.4 Output certificato con provenance

Ogni record nel collettore porta:

- `sourceCollection`;
- `sourceRecordId`;
- `sourceField` o lista `sourceFields`;
- `accessModeUsed`;
- `boundaryEntryId`;
- `confidence`.

La provenance e' il contratto dati che il pannello prove consumera' nella spec dedicata. Questa spec definisce solo il contratto dati, non la UI del pannello.

Per ogni relazione visualizzata, il motore deve allegare `relationProof` come definito in §14 di `SPEC_CHAT_ZERO_INVENZIONI_NEXT.md`.

### 5.5 Errori e fallback

Gli errori del Resolver Universale sono deterministici:

- entry boundary non trovata: errore strutturato e accompaniment coerente con §10 di `SPEC_CHAT_ZERO_INVENZIONI_NEXT.md`;
- collection vuota: `status = "empty"` e nessun match inventato;
- errore Firestore Admin: `status = "error"` e nessun fallback narrativo;
- shape respinta: record scartato prima del renderer.

Il motore non degrada mai a "match senza prova". Se mancano record, campi o relationProof, il dato non viene mostrato come certificato.

## 6. Uso del Registro v0.6 come fonte architetturale

### 6.1 Cosa il motore consuma dal registro

Il motore consuma dal registro v0.6 come contratto architetturale:

- collection e stato verifica;
- allowedFields dichiarati;
- alias di campo;
- match rules;
- esclusioni by design;
- evidence graph;
- convenzioni provenance.

Non consuma:

- campi narrativi;
- URL firmati;
- campi liberi come fonte di relazione;
- voci escluse by design.

Vincolo: il motore NON parsa il file `.md` a runtime. L'implementazione potra' generare o mantenere una configurazione machine-readable dedicata, con processo e formato da definire in spec implementativa.

### 6.2 Alias e match rules

Il Registry Reader risolve concetto logico -> campo fisico usando la sezione "Alias e ricerca flessibile" del registro v0.6.

Regole:

- targhe: exact-match strict;
- id Firestore: exact-match strict;
- numeri, date, importi, km, litri: exact-match strict;
- nomi propri: case-insensitive + trim, senza fuzzy;
- codici: exact o case-insensitive + trim solo se il registro lo dichiara.

Riserve note, senza duplicazione del registro:

- R2 categoria mezzo: `categoria` principale, `tipo` alias/seconda fonte;
- R4 chiave materiale: `stockKey` preferito, fallback controllati;
- R5 chiave fornitore: id forti prima, nomi solo per ricerca/disambiguazione.

### 6.3 Esclusioni by design rispettate dal motore

Il motore non legge:

- `chat_ia_reports`;
- `@analisi_economica_mezzi` come fonte certificata;
- `stamped/*`.

Queste esclusioni sono definite nella sezione "Esclusioni by design dal motore generico v1" del registro v0.6 e non possono essere aggirate da alias, vista config o richiesta utente.

## 7. Vista generica data-driven

### 7.1 Principio

La data-drivenness della vista generica riguarda la logica dati, non obbliga la UI.

Le 5 viste 360 (`Driver360`, `Vehicle360`, `Site360`, `Euromecc360`, `Ricerca360`) leggeranno tutte la stessa shape certificata prodotta dal motore. La UI puo' restare composta da componenti React dedicati per ciascuna vista, oppure convergere su un componente generico parametrizzato.

Decisione prodotto 2026-05-06 per `Site360`: in V1 `Cantiere` e' entita derivata/aggregata da campi strutturati gia' presenti nelle fonti autorizzate, non una nuova collection canonica `@cantieri`. `Site360` puo' rappresentare aggregazioni certificate solo se la provenienza dei record e la relationProof disponibile restano visibili nel pannello prove. Nessun writer cantieri e nessuna nuova collection Firestore sono parte della V1.

### 7.2 Vista config

Snippet TypeScript-like, non codice eseguibile:

```text
ViewConfig = {
  id: ViewEnum,
  entityKind: EntityKind,
  entryBoundaryIds: Array<string>,
  sections: Array<ViewSectionConfig>,
  relations: Array<RelationConfig>,
  disambiguation: {
    enabled: boolean,
    candidateSource: "resolver" | "none",
    maxCandidates: number
  },
  accompanimentKindsAllowed: Array<AccompanimentKindEnum>
}

ViewSectionConfig = {
  id: string,
  titleKey: string,
  recordSelector: {
    boundaryEntryId: string,
    fields: Array<string>
  },
  renderAs: "header" | "table" | "cards" | "timeline" | "status"
}

RelationConfig = {
  relationKind: RelationKindEnum,
  required: boolean,
  proofRequired: boolean
}
```

La vista config non contiene logica eseguibile. E' dichiarativa: quali entry leggere, quali campi usare, quali relazioni richiedere e quali kind di accompagnamento sono ammessi.

### 7.3 Rendering certificato

Il renderer, generico o dedicato, legge `ResolvedFiltersV2` (§5.3) e produce output certificato.

Per la definizione di vista certificata vedere §7 di `SPEC_CHAT_ZERO_INVENZIONI_NEXT.md`. La novita' di questa spec e' la parametrizzazione della fonte dati, non il principio di rendering certificato.

Il renderer non mostra `filters.searchText` come dato certificato. Lo usa solo come eco di richiesta o non lo mostra.

## 8. Coesistenza con Driver360 esistente

### 8.1 Stato attuale Driver360

Driver360 esistente resta attivo:

- `post-llm-resolver.js` Driver360-specifico;
- vista React `Driver360`;
- schema strict Zero-Invenzioni;
- Catalog Validator e rendering certificato gia' attivi.

Aggiornamento V1 2026-05-06: `Driver360.tsx` non usa piu' resolver relazioni frontend autonomi. Le relazioni autista-mezzo visualizzate dalla vista arrivano dal payload backend `resolvedFilters.v2`, con relationProof prodotte da `query-engine.js` / `relation-resolver.js` e regole gia' presenti in `relation.config.cjs`.

Questo documento NON dichiara Driver360 deprecato.

### 8.2 Modalita' coesistenza

Il motore generico viene introdotto in parallelo.

Regola di migrazione:

1. Driver360 resta sul percorso esistente.
2. Il Resolver Universale viene attivato su percorsi separati o feature flag.
3. La copertura Driver360 del Resolver Universale viene verificata con test verdi.
4. Solo dopo parita' verificata, Driver360 esistente viene declassato.
5. La rimozione avviene solo quando non esistono piu' chiamanti del resolver Driver360-specifico.

### 8.3 Switch e feature flag

Lo switch runtime deve stare a livello chiamante, non dentro `post-llm-resolver.js`.

Strategie ammesse:

- feature flag globale per motore generico;
- instradamento per vista;
- combinazione di feature flag e vista.

Vincolo: lo switch non introduce logica nuova nel `post-llm-resolver.js` esistente. Quel file resta percorso legacy Driver360 finche' viene sostituito dopo parita'.

## 9. Contratto dati per il pannello "Perche' vedo questo dato?"

### 9.1 Dichiarazione

Il pannello prove e' fuori scope di questa spec. Avra' una spec dedicata: `SPEC_PANNELLO_PROVE_NEXT.md`.

Questa spec definisce solo il contratto dati che quel pannello consumera'.

### 9.2 Contratto

Per ogni record certificato visualizzato, il motore produce `RecordProvenance` (§5.3, §5.4).

Per ogni relazione visualizzata, il motore produce `relationProof` come definito in §14 di `SPEC_CHAT_ZERO_INVENZIONI_NEXT.md`.

Il contratto minimo per record:

- `sourceCollection`;
- `sourceRecordId`;
- `sourceFields`;
- `accessModeUsed`;
- `boundaryEntryId`;
- `confidence`.

Il contratto minimo per relazione:

- `relationKind`;
- `sourceCollection`;
- `sourceRecordId`;
- `sourceField`;
- `rule`;
- `certainty`.

Niente piu' di questo viene specificato qui. Layout, interazioni e copy del pannello sono rinviati alla spec dedicata.

### 9.2 Proiezione machine-readable relazioni

La config sorgente frontend resta `src/next/chat-ia/config/relation.config.ts`. Il backend non importa e non parsa file `.ts`: consuma la proiezione CommonJS `backend/internal-ai/server/lib/relation.config.cjs`, mantenuta in modo esplicito insieme alla config TS. `relation-resolver.js` applica solo regole dichiarate in questa proiezione, su `CertifiedRecord` gia' filtrati da registry/boundary.

## 10. Piano di migrazione Driver360

### 10.1 Fasi

Ordine vincolante:

1. **Fase A. Resolver universale operativo per `exact_document`**
   - Criterio di chiusura: test verde su almeno N query Driver360 esistenti, comportamento identico a parita' di shape `resolvedFilters` legacy esposta.

2. **Fase B. Resolver universale operativo per `collection_root`**
   - Criterio di chiusura: test verde sulle 6 entry Euromecc e test su almeno una root collection documentale quando boundary/root reader sara' disponibile.

3. **Fase C. Vista generica (logica dati) attiva per Vehicle360 / Site360 / Euromecc360 / Ricerca360**
   - Criterio di chiusura: parita' visiva con mockup approvati. UI dedicata o generica e' decisione separata.

4. **Fase D. Migrazione Driver360 a vista generica**
   - Criterio di chiusura: test verde su tutte le query Driver360 esistenti, incluso caso Sandro. Solo dopo questo step Driver360 vecchio viene declassato.

5. **Fase E. Rimozione codice legacy**
   - Criterio di chiusura: zero chiamanti del vecchio `post-llm-resolver.js` Driver360-specifico.

### 10.2 Vincoli di sicurezza migrazione

- Driver360 in produzione resta intoccato fino alla fine della Fase D.
- Ogni fase richiede test runtime nel browser eseguiti da Giuseppe.
- Nessuna fase puo' introdurre regressioni su query Driver360 esistenti.
- Nessuna fase riabilita testo libero LLM o fallback narrativo.
- Nessuna fase puo' mostrare relazioni critiche senza `relationProof`, secondo §14 di `SPEC_CHAT_ZERO_INVENZIONI_NEXT.md`.

## 11. Confini del motore generico v1 (cosa NON fa)

Il motore generico v1:

- LEGGE e MOSTRA dati certificati.
- NON scrive dati.
- NON corregge Firestore.
- NON modifica collection.
- NON decide cancellazioni.
- NON sostituisce i moduli gestionali.

Fuori scope di v1:

- Pannello prove: spec separata.
- PDF da template: vedere §13 di `SPEC_CHAT_ZERO_INVENZIONI_NEXT.md`.
- Smantellamento multi-agente: vedere §12.4 di `SPEC_CHAT_ZERO_INVENZIONI_NEXT.md`.
- Estensione boundary a root collection nuove: patch separata in fase implementativa.
- Promozione registro a v1.0 STABLE: CHIUSA 2026-05-06 con matrice Chat IA NEXT completata, T1..T28 PASS e Playwright 17-21 PASS.

## 12. Domande aperte / decisioni rinviate

1. Quale formato machine-readable rappresentera' il registro v0.6 per il Registry Reader?
2. Quale processo garantira' coerenza tra registro Markdown e configurazione machine-readable?
3. `periodPreset` della spec base (§5 e §13 di `SPEC_CHAT_ZERO_INVENZIONI_NEXT.md`) si estende a tutte le viste o resta inizialmente limitato a Driver360?
4. Il caching delle letture `collection_root` in Fase B sara' assente, on-demand o con breve TTL?
5. Le 6 entry Euromecc dormienti hanno allowedFields gia' adeguati per la vista Euromecc360 o richiedono audit dedicato?
6. La vista config deve poter dichiarare relazioni inverse, per esempio "su questo mezzo mostra anche documenti correlati"?
7. Quando conviene consolidare UI dedicata e UI generica per le 5 viste 360?

## 13. Versioning e governance della spec

Questo documento e' v1.0 STABLE al 2026-05-06.

Modifiche future:

- append-only con annotazione datata, come per il registro;
- nessuna modifica futura di stato senza audit Codex successivo;
- nessuna implementazione runtime prima di revisione formale;
- ogni modifica che indebolisce Zero-Invenzioni richiede decisione esplicita in `DIARIO_DECISIONI.md`.

Revisione formale: dopo audit Codex dedicato, prima di passare a implementazione.
