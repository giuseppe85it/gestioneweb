# Registro delle Collection Firestore â€” Gestionale Manutenzione

## Stato del documento
Versione: 0.6 BOZZA — sessione 2026-05-09→11 (post-1.0 STABLE per nuovi scope barrier write + campi soft-delete + manutenzioneContrattoAttivo; vedi annotazione fondo intestazione)
Data: 2026-05-11
Sessione 09-11/05/2026: aggiunta sezione "Scope barrier write" con 4 nuovi scope (RICHIESTE / SEGNALAZIONI / CONTROLLI / DELETE_MEZZO) + estensione INTERNAL_AI_MAGAZZINO_INLINE_SCOPE per `@mezzi_aziendali` da Centro Controllo. Nuovo campo `manutenzioneContrattoAttivo` su `@mezzi_aziendali`. Nuovi campi soft-delete su 3 dataset (segnalazioni/controlli/richieste). Voci collection esistenti invariate, sub-blocchi "Sessione 2026-05-09" aggiunti append-only.
Versione precedente: 1.0 STABLE — 2026-05-06
- Data: 2026-05-04
- Autore: Codex (audit), Giuseppe (validazione attesa)
- Annotazione 2026-05-06: matrice chiusura Chat IA NEXT completata per V1; C6/C7 BLOCCO 8 PASS, Playwright 17-21 PASS 10/10, diagnostics T1..T28 PASS, #4 chiusa con Opzione A, #13 classificata `DEFERRED_OK`.
- Validazione utente: 7/10 domande confermate, 3/10 PARZIALMENTE CHIUSE con regole di priorita' (R2 categoria mezzo, R4 chiave materiale, R5 chiave fornitore). 3 integrazioni di precisione applicate (R8 vincoli boundary, R10 distinzione campi strutturati/liberi, R-EG obbligo pannello prove).
- Runtime check eseguito su 33 collection BOUNDARY OPEN. R2/R4/R5: PARZIALMENTE CHIUSE con regole di priorita'.
- AllowedFields aggiornati per 22 ex-discrepanze. Sezione 'Alias e ricerca flessibile' introdotta con vincolo di separazione alias/boundary. Riserve R2/R4/R5 PARZIALMENTE CHIUSE con regole di priorita'.
- Decisioni post-audit PROMPT 20 applicate per i punti 1-6: root documentali e Cisterna documentate come blocco architetturale, esclusioni by design registrate, path tecnici foto ammessi dove persistiti dal codice reale.
- v0.6 BOZZA — annotazione 2026-05-04: audit accessMode root collection (PROMPT 22) ESITO 3. Riformulato BLOCCO ARCHITETTURALE in BLOCCO RUNTIME per le 6 root collection. 6 entry Euromecc `collection_root` segnate come dichiarate non operative.
- v0.6 BOZZA — annotazione 2026-05-04 (post PROMPT 24a): roadmap residua aggiornata; patch `collection_root` assorbita nel motore generico v1.
- v0.6 BOZZA — annotazione 2026-05-04 (post AUDIT_URL_FIELDS_BOUNDARY): rimosso librettoUrl da FIRESTORE_MEZZI_ALLOWED_FIELDS. URL firmato Firebase Storage non ammesso al motore generico (Zero-Invenzioni). Path tecnico librettoStoragePath resta disponibile.
- Scopo: mappa unica delle collection Firestore del gestionale.
  Sara' letta dal motore generico Zero-Invenzioni (Resolver, Driver360, viste future)
  e dal pannello laterale "Perche' vedo questo dato?".
- Validazione V1: voci Chat IA NEXT confermate/stabilizzate per il perimetro V1; evoluzioni future restano soggette a validazione Giuseppe.
- Aggiornamento: questo file va aggiornato manualmente quando la struttura Firestore cambia
  (nuove collection, nuovi campi, rinomine). I dati interni cambiano live e non
  richiedono aggiornamento qui.

## Legenda stato verifica
- VERIFICATA RUNTIME: path letto in Firestore reale entro `internal-ai-firebase-readonly-boundary.js`.
- BOUNDARY OPEN — RUNTIME PENDING: boundary readonly autorizzato con `allowedFields`, runtime check Firestore non ancora eseguito.
- BOUNDARY VERIFICATA RUNTIME: boundary autorizzato e shape runtime campionata senza campi extra rispetto agli allowedFields.
- BOUNDARY VERIFICATA RUNTIME (post-update allowedFields): boundary autorizzato, shape runtime campionata e allowedFields riallineati dopo il runtime check.
- BOUNDARY VERIFICATA RUNTIME — DISCREPANZA: boundary autorizzato, lettura riuscita, ma shape reale diversa da allowedFields o campi extra esclusi.
- COLLECTION VUOTA: target leggibile ma senza record campionabili.
- COLLECTION NON TROVATA: target autorizzato dal boundary ma documento/collection non presente in Firestore.
- BLOCCO ARCHITETTURALE: voce documentata nel registro ma non leggibile dal boundary attuale senza estensione dedicata approvata.
- BLOCCO RUNTIME: accessMode gia' dichiarabile nel boundary, ma non operativo finche' il resolver runtime non lo consuma.
- ESCLUSA BY DESIGN: voce esclusa dal motore generico v1 per decisione esplicita del diario.
- VERIFICATA SOLO CODICE: path citato da tool, reader o writer del repo; runtime non letto per boundary.
- AMBIGUA: riferimento parziale, bloccato o non chiaramente Firestore.
- DA VALIDARE: voce da confermare con Giuseppe prima di usarla come contratto stabile.

## Fonti dell'audit
- Fonte codice: 59 file in `src/next/chat-ia/tools/registry/`, `src/next/nextAnagraficheFlottaDomain.ts`, reader NEXT in `src/next/domain/` e chiamanti principali in `src/next/`.
- Fonte runtime: `getInternalAiFirebaseAdminReadonlyContext()` con credential ready; letture limitate ai documenti `storage/@mezzi_aziendali`, `storage/@colleghi`, `storage/@autisti_sessione_attive`, `storage/@storico_eventi_operativi`, `storage/@rifornimenti_autisti_tmp`.
- Boundary: `driver360_phase2_readonly`, accesso `exact_document`, nessun listing libero della collection `storage`.

## Convenzioni provenance
Ogni dato che il motore mostrera' deve poter produrre:
- sourceCollection
- sourceRecordId
- sourceField
- sourceValueType
- relationKind (se relazione)
- relationProof (se incrocio)
- confidence: certified | weak | rejected | unknown
- graphNodeId
- graphEdgeId

Queste convenzioni si applicano a tutti i campi mostrati nelle viste e nel pannello "Perche' vedo questo dato?".

## Convenzioni evidence graph
- Nodo del grafo: rappresenta un'entita' (autista, mezzo, sessione, manutenzione, rifornimento, documento, cantiere, ecc.)
- Arco del grafo: rappresenta una relazione tra due nodi (es. autista -> sessione_attiva -> motrice)
- Tipo arco: forte | debole | vietata | da_validare
- Campi che creano relazione: lista esplicita di chiavi che generano l'arco (es. badgeAutista + targaMotrice)
- Mostrabile nel diagramma prove: si | no

## Alias e ricerca flessibile

Il motore generico data-driven leggera' questa sezione per essere flessibile sui nomi di campo ma rigido sui valori critici.

### Separazione alias vs boundary (vincolo di sicurezza)
Gli alias dichiarati qui sono una mappa CONCETTUALE per il motore generico. NON autorizzano automaticamente la lettura runtime dei campi.

Un campo puo' essere:
- alias concettuale in questa sezione
- ma NON incluso in `allowedFields` del boundary

In quel caso il motore lo considera noto ma NON leggibile runtime.

Solo `allowedFields` (in `internal-ai-firebase-readonly-boundary.js`) decide cosa il backend puo' leggere.
Questa sezione spiega solo il significato e la mappatura concetto -> nomi di campo.
Il boundary decide l'accesso.

Indebolire questa separazione richiede una decisione esplicita registrata in `DIARIO_DECISIONI.md`.

### Regole valori
- **Targhe**: exact match SEMPRE. Nessun trim, nessun lowercase, nessun fuzzy. TI180147 != TI113387 != TI313387.
- **ID Firestore**: exact match SEMPRE.
- **Importi, km, quantita', litri, badge numerici**: exact match SEMPRE.
- **Date e timestamp**: exact match SEMPRE, nessuna inferenza.
- **Nomi propri (autista, fornitore, officina, materiale, cantiere)**: case-insensitive + trim ammessi. NIENTE fuzzy match, NIENTE soundex, NIENTE Levenshtein, NIENTE similarita' percentuale.
- **Codici (codice articolo, stockKey, articoloCanonico)**: case-insensitive + trim ammessi solo se la specifica del concetto lo dichiara. Default: exact match.

### Concetti e alias di campo
Per ogni concetto del gestionale, lista chiusa di nomi di campo equivalenti che il motore generico considera la stessa cosa. Quando il motore cerca un valore per un concetto, prova tutti gli alias dichiarati. Aggiunte future passano per code review e aggiornamento di questa sezione.

### autista
- **Definizione**: persona/collega che guida o invia record operativi.
- **Tipo valore**: stringa nominale | id | numero
- **Regola match**: id e badge exact-match-strict; nomi case-insensitive+trim
- **Alias campi (lista chiusa)**:
  - autistaId
  - autistaNome
  - autista
  - nomeAutista
  - badgeAutista
  - badge
- **Collection in cui appare**:
  - `storage/@colleghi`: `id`, `nome`, `badge`
  - `storage/@autisti_sessione_attive`: `nomeAutista`, `badgeAutista`
  - `storage/@storico_eventi_operativi`: `nomeAutista`, `autistaNome`, `autista`, `badgeAutista`, `badge`
  - `storage/@rifornimenti_autisti_tmp`: `autistaId`, `badgeAutista`, `badge`
  - collection TMP autisti: `autistaId`, `autistaNome`, `autista`, `badgeAutista`, `badge`
- **Note di validazione**:
  - I nomi sono ammessi per ricerca/disambiguazione, non come relazione forte. Per relationProof usare id o badge strutturati.

### mezzo (targa)
- **Definizione**: identificatore targa di motrice, rimorchio, mezzo o target operativo.
- **Tipo valore**: targa
- **Regola match**: exact-match-strict
- **Alias campi (lista chiusa)**:
  - targa
  - mezzoTarga
  - targaCamion
  - targaMotrice
  - targaRimorchio
  - targetTarga
- **Collection in cui appare**:
  - `storage/@mezzi_aziendali`: `targa`
  - `storage/@autisti_sessione_attive`: `targaMotrice`, `targaRimorchio`
  - `storage/@storico_eventi_operativi`: `targa`, `mezzoTarga`, `targaMotrice`, `targaRimorchio`, `dopo`
  - `storage/@rifornimenti`: `targa`, `mezzoTarga`, `targaMotrice`
  - `storage/@gomme_eventi`: `targetTarga`, `targa`, `targaMotrice`, `targaRimorchio`
  - documenti: `targa`, `mezzoTarga`, `targaCamion`, `targaRimorchio`, `targaMotrice`, `targaMezzo`
- **Note di validazione**:
  - Regola Zero-Invenzioni D11: targhe sempre exact match. Nessun alias permette match simile.

### categoria mezzo
- **Definizione**: classificazione funzionale del mezzo.
- **Tipo valore**: enum
- **Regola match**: enum-controlled
- **Alias campi (lista chiusa)**:
  - categoria
  - tipo
- **Collection in cui appare**:
  - `storage/@mezzi_aziendali`: `categoria`, `tipo`
  - `storage/@gomme_eventi`: `categoria`
  - `storage/@segnalazioni_autisti_tmp`: `categoriaMezzo`
- **Note di validazione**:
  - R2 PARZIALMENTE CHIUSA: `categoria` e' usabile come campo principale osservato (12 valori enum reali). Il campo `tipo` resta alias/seconda fonte da indagare nel motore generico. Il motore deve leggere i valori enum live da Firestore, non hardcodarli.
  - Enum reale osservato: biga, centina, motrice 2 assi, motrice 3 assi, motrice 4 assi, pianale, porta silo container, semirimorchio asse fisso, semirimorchio asse sterzante, Trattore a sella, trattore stradale, vasca.

### fornitore
- **Definizione**: soggetto fornitore collegato a ordini, preventivi, listini, manutenzioni o materiali.
- **Tipo valore**: stringa nominale | id
- **Regola match**: id exact-match-strict; nomi case-insensitive+trim per ricerca/disambiguazione
- **Alias campi (lista chiusa)**:
  - fornitore
  - fornitoreNome
  - nomeFornitore
  - id
  - idFornitore
  - fornitoreId
  - supplierId
  - supplierName
  - nome
- **Collection in cui appare**:
  - `storage/@fornitori`: `id`, `nome`
  - `storage/@ordini`: `idFornitore`, `fornitoreId`, `nomeFornitore`, `supplierId`, `supplierName`, `fornitore`
  - `storage/@preventivi`: `fornitoreId`, `fornitoreNome`, `nomeFornitore`, `supplierId`, `supplierName`, `fornitore`
  - `storage/@listino_prezzi`: `fornitoreId`, `fornitoreNome`, `fornitore`
  - `storage/@materialiconsegnati`: `fornitore`, `fornitoreLabel`
- **Note di validazione**:
  - R5 PARZIALMENTE CHIUSA: preferire `id`, `idFornitore`, `fornitoreId`, `supplierId` quando presenti come chiave forte. I nomi (`nome`, `fornitoreNome`, `nomeFornitore`, `supplierName`) si usano solo per ricerca e disambiguazione, NON come relazione forte. Il motore generico deve sempre tentare prima la chiave forte, e usare il nome solo come fallback informativo.

### materiale
- **Definizione**: articolo o materiale di inventario, listino, ordine o consegna.
- **Tipo valore**: stringa nominale | id
- **Regola match**: id e stockKey exact-match-strict; codici case-insensitive+trim solo se dichiarato; nomi case-insensitive+trim
- **Alias campi (lista chiusa)**:
  - id
  - stockKey
  - articoloCanonico
  - codiceArticolo
  - codice
  - materiale
  - materialeLabel
  - nome
  - articolo
- **Collection in cui appare**:
  - `storage/@inventario`: `id`, `stockKey`, `codice`, `nome`, `articolo`, `materiale`
  - `storage/@materialiconsegnati`: `stockKey`, `materiale`, `materialeLabel`, `codice`, `nome`
  - `storage/@listino_prezzi`: `articoloCanonico`, `codiceArticolo`, `materiale`, `nome`
  - `storage/@ordini`: `materiali`, `righe`, `items`, `voci`
  - `storage/@documenti_magazzino`: `materiale`, `codice`, `voci`
- **Note di validazione**:
  - R4 PARZIALMENTE CHIUSA: `stockKey` e' chiave preferita quando presente. Fallback controllati per collection: `articoloCanonico`, `codiceArticolo`, `id`, `materialeLabel`. La risoluzione finale resta DA VALIDARE nel motore generico, che applichera' la priorita' degli alias in ordine.

### officina
- **Definizione**: soggetto officina distinta da fornitore generico.
- **Tipo valore**: stringa nominale | id
- **Regola match**: id exact-match-strict; nomi case-insensitive+trim
- **Alias campi (lista chiusa)**:
  - id
  - nome
  - ragioneSociale
  - officina
  - label
  - citta
- **Collection in cui appare**:
  - `storage/@officine`: `id`, `nome`, `ragioneSociale`, `officina`, `label`, `citta`
  - `storage/@manutenzioni`: `officinaId`, `officina`
- **Note di validazione**:
  - Contatti telefonici esclusi dal boundary Zero-Invenzioni.
  - Chiusura Chat IA NEXT 2026-05-06: `storage/@officine` resta entry collegata per manutenzioni/officine dentro `Vehicle360`; non introduce vista autonoma e non apre campi telefonici.

### cantiere
- **Definizione**: sito/cantiere operativo collegato ad attrezzature, lavori o materiali.
- **Tipo valore**: stringa nominale | id
- **Regola match**: id exact-match-strict; nomi case-insensitive+trim
- **Alias campi (lista chiusa)**:
  - cantiere
  - cantiereId
  - id
- **Collection in cui appare**:
  - `storage/@attrezzature_cantieri`: `cantiere`, `cantiereId`, `cantiereLabel`, `sourceCantiereId`, `sourceCantiereLabel`
  - `storage/@lavori`: `cantiere`, `cantiereId`
  - `storage/@materialiconsegnati`: `cantiere`, `cantiereId`
- **Note di validazione**:
  - `cantiereLabel` e `sourceCantiereLabel` sono label operative, non chiavi forti.
  - Decisione prodotto 2026-05-06, Opzione A: in V1 `cantiere` non diventa collection canonica `@cantieri`; `Site360` usa un'entita derivata/aggregata da campi strutturati gia' presenti in `storage/@attrezzature_cantieri`, `storage/@lavori` e `storage/@materialiconsegnati`.

### sessione attiva
- **Definizione**: assetto corrente di un autista con motrice e rimorchio.
- **Tipo valore**: id | targa | numero | data
- **Regola match**: badge e targhe exact-match-strict; timestamp exact-match
- **Alias campi (lista chiusa)**:
  - badgeAutista
  - targaMotrice
  - targaRimorchio
  - timestamp
- **Collection in cui appare**:
  - `storage/@autisti_sessione_attive`: `badgeAutista`, `targaMotrice`, `targaRimorchio`, `timestamp`
- **Note di validazione**:
  - Fonte autoritativa per motrice/rimorchio correnti. Vince su `@mezzi_aziendali.autistaId`.

### manutenzione / lavoro / evento operativo
- **Definizione**: record operativo tecnico, manutenzione, lavoro o evento storico.
- **Tipo valore**: id | enum | data | targa
- **Regola match**: id, targhe e date exact-match-strict; tipo enum-controlled
- **Alias campi (lista chiusa)**:
  - id
  - tipo
  - timestamp
  - data
  - targa
  - mezzoTarga
- **Collection in cui appare**:
  - `storage/@manutenzioni`: `id`, `tipo`, `data`, `timestamp`, `targa`, `mezzoTarga`
  - `storage/@lavori`: `id`, `tipo`, `data`, `timestamp`, `targa`, `mezzoTarga`
  - `storage/@storico_eventi_operativi`: `id`, `tipo`, `timestamp`, `data`
- **Note di validazione**:
  - Descrizioni e dettagli testuali non certificano relazioni.

### rifornimento
- **Definizione**: evento di rifornimento con quantita', km, data e possibile collegamento autista/mezzo.
- **Tipo valore**: id | targa | numero | data
- **Regola match**: targa, badge, id, importi, km e litri exact-match-strict
- **Alias campi (lista chiusa)**:
  - id
  - targa
  - mezzoTarga
  - targaMotrice
  - autistaId
  - badgeAutista
  - data
  - timestamp
  - litri
  - km
- **Collection in cui appare**:
  - `storage/@rifornimenti_autisti_tmp`: `id`, `autistaId`, `badgeAutista`, `data`, `timestamp`, `litri`, `km`
  - `storage/@rifornimenti`: `id`, `targa`, `mezzoTarga`, `targaMotrice`, `autistaId`, `badgeAutista`, `data`, `timestamp`, `litri`, `km`
- **Note di validazione**:
  - `costo` e `distributore` sono dati operativi mostrabili se presenti nel boundary; non certificano da soli relazioni autista-mezzo.

### documento
- **Definizione**: documento archiviato, fattura, libretto, DDT, preventivo o documento magazzino/mezzo.
- **Tipo valore**: id | targa | enum | numero | data
- **Regola match**: id, targhe, numeri e date exact-match-strict
- **Alias campi (lista chiusa)**:
  - id
  - targa
  - mezzoTarga
  - targaCamion
  - targaRimorchio
  - targaMotrice
  - targaMezzo
  - tipoDocumento
  - tipo
  - documentType
  - numeroDocumento
  - numero
  - dataDocumento
  - data
  - fornitore
  - fornitoreNome
  - supplier
- **Collection in cui appare**:
  - `storage/@documenti_generici`: alias documento generici
  - `storage/@documenti_mezzi`: alias documento mezzo
  - `storage/@documenti_magazzino`: alias documento magazzino/materiali
  - `storage/@preventivi`: `numeroPreventivo`, `dataPreventivo`, `pdfStoragePath`, `imageStoragePaths`
- **Note di validazione**:
  - URL firmati e immagini restano esclusi dal boundary salvo decisione esplicita.

### euromecc area
- **Definizione**: chiave tecnica area/subarea del sottografo Euromecc.
- **Tipo valore**: id
- **Regola match**: exact-match-strict
- **Alias campi (lista chiusa)**:
  - areaKey
  - subKey
- **Collection in cui appare**:
  - `euromecc_pending`: `areaKey`, `subKey`
  - `euromecc_done`: `areaKey`, `subKey`
  - `euromecc_issues`: `areaKey`, `subKey`
  - `euromecc_area_meta`: `areaKey`
  - `euromecc_extra_components`: `areaKey`, `subKey`
  - `euromecc_relazioni`: `areaKey`, `subKey`
- **Note di validazione**:
  - Sottografo separato dal grafo flotta principale.

### foto tecnica / path foto
- **Definizione**: riferimento tecnico a una foto o immagine salvata in Firebase Storage, usabile dal pannello prove per dichiarare l'esistenza del file senza esporre URL firmati.
- **Tipo valore**: path tecnico
- **Regola match**: exact-match-strict
- **Alias campi (lista chiusa)**:
  - fotoStoragePath
  - fotoPath
  - photoStoragePath
  - storagePath
- **Collection in cui appare**:
  - `storage/@inventario`: `fotoStoragePath`
  - `storage/@attrezzature_cantieri`: `fotoStoragePath`
  - `storage/@mezzi_aziendali`: `fotoPath`
  - `storage/@ordini`: `materiali[].photoStoragePath` come alias annidato documentale; non leggibile come allowedField top-level finche' il boundary non supporta filtro annidato.
- **Note di validazione**:
  - Decisione post-audit PROMPT 20 del 2026-05-04: path tecnici foto ammessi come prova di esistenza file nel pannello prove. URL firmati (`fotoUrl`, `photoUrl`, `downloadUrl`, `fileUrl`, `pdfUrl`, `imageUrls`) restano esclusi.
  - `fotoStoragePath` per `storage/@mezzi_aziendali` non e' stato aggiunto al boundary in v0.6 per assenza di persistenza dimostrata nel writer letto; resta alias concettuale se presente nei dati storici.

### Vincolo di evoluzione
Aggiungere un alias o un nuovo concetto a questa sezione e' una decisione di code review. Il motore generico legge solo gli alias dichiarati qui. Se domani Firestore introduce un nuovo nome di campo per un concetto esistente, va prima aggiunto qui, poi il motore lo riconoscera'.

Le regole di match sono regole architetturali Zero-Invenzioni: NON possono essere indebolite (es. introdurre fuzzy match) senza decisione esplicita registrata in `DIARIO_DECISIONI.md`.

L'aggiunta di un alias in questa sezione NON apre automaticamente l'accesso al campo in runtime. Per leggere il campo serve `allowedFields` nel boundary (vedi "Separazione alias vs boundary").

## Chiusure documentali Chat IA NEXT 2026-05-06

### Ordinamento default per viste certificate

L'ordinamento runtime usa solo campi presenti in `allowedFields`. La priorita' documentata per le viste certificate e':

1. `updatedAt desc`, se ammesso dalla entry.
2. `timestamp desc`, se `updatedAt` non e' ammesso e `timestamp` e' presente.
3. `createdAt desc`, per root documentali che non espongono `updatedAt` ma espongono `createdAt`.
4. Nessun ordinamento aggiuntivo se nessuno dei tre campi e' ammesso; resta valido il cap deterministico `requestLimits`.

### Mapping writer root documentali -> allowedFields

Le entry root documentali V1 sono proiezioni sicure dei writer reali. I campi liberi, URL-like e sensibili restano fuori boundary anche se il writer li salva.

| Root collection | Writer/reader reale verificato nel repo | Boundary V1 | Nota |
|---|---|---|---|
| `@documenti_mezzi` | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx`, `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx`, `src/next/internal-ai/ArchivistaArchiveClient.ts`, `src/pages/IA/IADocumenti.tsx` | `FIRESTORE_ROOT_DOCUMENTI_MEZZI_ALLOWED_FIELDS` | metadati mezzo/documento, targa, importi, voci strutturate; esclusi testo libero e URL firmati |
| `@documenti_magazzino` | `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx`, `src/next/internal-ai/ArchivistaArchiveClient.ts`, `src/pages/IA/IADocumenti.tsx` | `FIRESTORE_ROOT_DOCUMENTI_MAGAZZINO_ALLOWED_FIELDS` | metadati documento, fornitore, righe materiali strutturate; esclusi testo libero e URL firmati |
| `@documenti_generici` | `src/pages/IA/IADocumenti.tsx`, lettura `src/next/domain/nextDocumentiCostiDomain.ts` | `FIRESTORE_ROOT_DOCUMENTI_GENERICI_ALLOWED_FIELDS` | metadati generici minimi; nessuna relazione forte se mancano chiavi strutturate |
| `@documenti_cisterna` | `src/pages/CisternaCaravate/CisternaCaravateIA.tsx`, `src/next/NextCisternaIAPage.tsx` | `FIRESTORE_DOCUMENTI_CISTERNA_ROOT_ALLOWED_FIELDS` | documenti cisterna con metadati strutturati, importi e stato; esclusi testo libero e URL firmati |
| `@cisterna_schede_ia` | `src/next/NextCisternaIAPage.tsx` | `FIRESTORE_CISTERNA_SCHEDE_IA_ROOT_ALLOWED_FIELDS` | righe scheda carburante e periodo; esclusi testo libero e URL firmati |
| `@cisterna_parametri_mensili` | `src/next/NextCisternaIAPage.tsx` | `FIRESTORE_CISTERNA_PARAMETRI_MENSILI_ROOT_ALLOWED_FIELDS` | mese e cambio EUR/CHF; nessun dato narrativo |

### Site360 e cantiere

`Site360` V1 e' vista aggregatrice certificata su fonti esistenti, non anagrafica autonoma di cantiere. Non esiste apertura di `@cantieri` in V1 e non esiste writer cantieri. Il pannello prove deve mostrare provenienza e relationProof quando il resolver produce una relazione certificata; in assenza di prova, la UI non deve promuovere il label cantiere a entita certificata autonoma.

### Rimozione entry documentali storage deprecate

Chiusura Chat IA NEXT #6, 2026-05-06: le entry boundary storiche `firestore-storage-documenti-generici-doc`, `firestore-storage-documenti-magazzino-doc`, `firestore-storage-documenti-mezzi-doc` sono rimosse dal boundary readonly V1. Le fonti ufficiali diventano le root collection gia' autorizzate:

| ID deprecato | ID root sostitutivo |
|---|---|
| `firestore-storage-documenti-generici-doc` | `firestore-documenti-generici-root` |
| `firestore-storage-documenti-magazzino-doc` | `firestore-documenti-magazzino-root` |
| `firestore-storage-documenti-mezzi-doc` | `firestore-documenti-mezzi-root` |

`src/next/chat-ia/config/view.config.ts` e' riallineato alle root documentali. Nessun writer e nessun dato Firestore reale sono stati modificati.

## Inventario sintetico

- Totale collection Firestore tracciate: 41
- VERIFICATE RUNTIME: 6
- BOUNDARY OPEN — RUNTIME PENDING: 0
- BOUNDARY VERIFICATA RUNTIME (post-update allowedFields): 22
- BLOCCO ARCHITETTURALE — root collection documentate, boundary da estendere: 3
- ESCLUSE BY DESIGN dal motore generico v1: 3
- VUOTE: 5 (verificate by reference)
- NON TROVATE: 5 (verifica rinviata)
- VERIFICATE SOLO CODICE: 0
- AMBIGUE: 0
- VALIDATE da utente: 7
- VALIDATE PARZIALMENTE da utente: 3 (R2 categoria mezzo, R4 chiave materiale, R5 chiave fornitore)

| Path | Stato verifica | Ruolo funzionale stimato |
|---|---|---|
| `storage/@mezzi_aziendali` | VERIFICATA RUNTIME | Anagrafica mezzi, targhe, libretti, legame statico autista-mezzo. |
| `storage/@colleghi` | VERIFICATA RUNTIME | Anagrafica colleghi/autisti, badge e codici. |
| `storage/@autisti_sessione_attive` | VERIFICATA RUNTIME | Sessioni attive autisti, motrice e rimorchio correnti. |
| `storage/@storico_eventi_operativi` | VERIFICATA RUNTIME | Eventi operativi autisti/mezzi, cambio assetto. |
| `storage/@rifornimenti_autisti_tmp` | VERIFICATA RUNTIME | Feed rifornimenti inseriti da autisti. |
| `storage/@alerts_state` | BOUNDARY VERIFICATA RUNTIME (post-update allowedFields) | Stato alert centro controllo. |
| `storage/@analisi_economica_mezzi` | ESCLUSA BY DESIGN | Analisi economiche salvate con narrativa IA; fuori motore generico v1. |
| `storage/@attrezzature_cantieri` | BOUNDARY VERIFICATA RUNTIME (post-update allowedFields) | Attrezzature associate a cantieri. |
| `storage/@cambi_gomme_autisti_tmp` | BOUNDARY VERIFICATA RUNTIME (post-update allowedFields) | Richieste/eventi gomme lato autisti. |
| `storage/@cisterne_adblue` | BOUNDARY VERIFICATA RUNTIME (post-update allowedFields) | Movimenti e stato cisterne AdBlue. |
| `@cisterna_parametri_mensili` | BLOCCO ARCHITETTURALE — boundary root collection da estendere | Parametri mensili Cisterna Caravate. |
| `@cisterna_schede_ia` | BLOCCO ARCHITETTURALE — boundary root collection da estendere | Schede carburante Cisterna Caravate estratte o manuali. |
| `storage/@controlli_mezzo_autisti` | BOUNDARY VERIFICATA RUNTIME (post-update allowedFields) | Controlli mezzo inviati da autisti. |
| `storage/@costiMezzo` | BOUNDARY OPEN — RUNTIME VUOTO — VERIFICATO BY REFERENCE | Costi mezzo legacy/documentali. |
| `storage/@documenti_generici` | RIMOSSA DAL BOUNDARY V1 — STORICO | Sostituita da root `@documenti_generici` / `firestore-documenti-generici-root`. |
| `storage/@documenti_magazzino` | RIMOSSA DAL BOUNDARY V1 — STORICO | Sostituita da root `@documenti_magazzino` / `firestore-documenti-magazzino-root`. |
| `storage/@documenti_mezzi` | RIMOSSA DAL BOUNDARY V1 — STORICO | Sostituita da root `@documenti_mezzi` / `firestore-documenti-mezzi-root`. |
| `@documenti_cisterna` | BLOCCO ARCHITETTURALE — boundary root collection da estendere | Documenti Cisterna Caravate. |
| `storage/@fornitori` | BOUNDARY VERIFICATA RUNTIME (post-update allowedFields) | Anagrafica fornitori. |
| `storage/@gomme_eventi` | BOUNDARY VERIFICATA RUNTIME (post-update allowedFields) | Eventi gomme ufficializzati. |
| `storage/@impostazioni_app` | BOUNDARY OPEN — RUNTIME PENDING — VERIFICA RINVIATA | Configurazioni IA/app. |
| `storage/@inventario` | BOUNDARY VERIFICATA RUNTIME (post-update allowedFields) | Inventario magazzino. |
| `storage/@lavori` | BOUNDARY VERIFICATA RUNTIME (post-update allowedFields) | Lavori operativi. |
| `storage/@listino_prezzi` | BOUNDARY VERIFICATA RUNTIME (post-update allowedFields) | Listino prezzi procurement. |
| `storage/@manutenzioni` | BOUNDARY VERIFICATA RUNTIME (post-update allowedFields) | Manutenzioni e storico operativo tecnico. |
| `storage/@materialiconsegnati` | BOUNDARY VERIFICATA RUNTIME (post-update allowedFields) | Movimenti materiali consegnati. |
| `storage/@mezzi_foto_viste` | BOUNDARY OPEN — RUNTIME VUOTO — VERIFICATO BY REFERENCE | Foto e viste hotspot mezzi. |
| `storage/@mezzi_hotspot_mapping` | BOUNDARY OPEN — RUNTIME VUOTO — VERIFICATO BY REFERENCE | Mapping hotspot foto mezzi. |
| `storage/@officine` | BOUNDARY VERIFICATA RUNTIME (post-update allowedFields) | Anagrafica officine. |
| `storage/@ordini` | BOUNDARY VERIFICATA RUNTIME (post-update allowedFields) | Ordini procurement/materiali. |
| `storage/@preventivi` | BOUNDARY VERIFICATA RUNTIME (post-update allowedFields) | Preventivi manuali/IA. |
| `storage/@preventivi_approvazioni` | BOUNDARY VERIFICATA RUNTIME | Approvazioni preventivi. |
| `storage/@richieste_attrezzature_autisti_tmp` | BOUNDARY VERIFICATA RUNTIME (post-update allowedFields) | Richieste attrezzature autisti. |
| `storage/@rifornimenti` | BOUNDARY VERIFICATA RUNTIME (post-update allowedFields) | Rifornimenti dossier/business. |
| `storage/@segnalazioni_autisti_tmp` | BOUNDARY VERIFICATA RUNTIME (post-update allowedFields) | Segnalazioni autisti. |
| `euromecc_pending` | BOUNDARY VERIFICATA RUNTIME (post-update allowedFields) | Task Euromecc pendenti. |
| `euromecc_done` | BOUNDARY VERIFICATA RUNTIME (post-update allowedFields) | Task Euromecc chiusi. |
| `euromecc_issues` | BOUNDARY VERIFICATA RUNTIME (post-update allowedFields) | Issue Euromecc. |
| `euromecc_area_meta` | BOUNDARY OPEN — RUNTIME VUOTO — VERIFICATO BY REFERENCE | Metadata area Euromecc. |
| `euromecc_extra_components` | BOUNDARY OPEN — RUNTIME VUOTO — VERIFICATO BY REFERENCE | Componenti extra Euromecc. |
| `euromecc_relazioni` | BOUNDARY VERIFICATA RUNTIME (post-update allowedFields) | Relazioni/report Euromecc. |

## Disallineamenti registro vs codice reale

### Boundary mezzi `librettoUrl`
- **Data annotazione**: 2026-05-04.
- **Riferimento audit**: `docs/audit/AUDIT_URL_FIELDS_BOUNDARY_2026-05-04.md`.
- **Stato**: patch boundary applicata.
- **Annotazione**: rimosso `librettoUrl` da `FIRESTORE_MEZZI_ALLOWED_FIELDS`. Audit di base: `AUDIT_URL_FIELDS_BOUNDARY_2026-05-04.md`.
- **Motivazione**: `librettoUrl` e' URL firmato Firebase Storage, non path tecnico; non e' ammesso come fonte leggibile dal motore generico Zero-Invenzioni.
- **Campo tecnico ammesso**: `librettoStoragePath` resta disponibile nel boundary readonly.

### Root collection documentali `@documenti_*`
- **Data decisione**: 2026-05-04.
- **Riferimento diario**: `docs/DIARIO_DECISIONI.md`, voce "Decisioni post-audit copertura modali (PROMPT 20)", decisione 1.
- **Riferimento audit**: `docs/product/AUDIT_COPERTURA_MODALI_2026-05-04.md`.
- **Stato**: BLOCCO ARCHITETTURALE — boundary da estendere in prompt successivo dedicato.
- **Annotazione audit PROMPT 22 (2026-05-04)**: stato aggiornato a BLOCCO RUNTIME — resolver `post-llm-resolver.js` da estendere per consumare accessMode `collection_root`.
- **Motivazione tecnica PROMPT 22**: il pattern `collection_root` esiste gia' nel boundary ma il resolver runtime legge solo entry `collection === 'storage'`. Senza patch resolver, le entry `collection_root` aggiunte resterebbero dichiarative e non operative.
- **Root collection annotate**:
  - `@documenti_mezzi`: stato precedente "BLOCCO ARCHITETTURALE — boundary da estendere"; stato aggiornato "BLOCCO RUNTIME — resolver `post-llm-resolver.js` da estendere per consumare accessMode `collection_root`".
  - `@documenti_magazzino`: stato precedente "BLOCCO ARCHITETTURALE — boundary da estendere"; stato aggiornato "BLOCCO RUNTIME — resolver `post-llm-resolver.js` da estendere per consumare accessMode `collection_root`".
  - `@documenti_generici`: stato precedente "BLOCCO ARCHITETTURALE — boundary da estendere"; stato aggiornato "BLOCCO RUNTIME — resolver `post-llm-resolver.js` da estendere per consumare accessMode `collection_root`".
- **Motivazione**: il codice reale scrive root collection `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`; il registro v0.5 le descriveva come documenti `storage/@documenti_*`.
- **Conseguenza operativa 2026-05-06**: le voci `storage/@documenti_generici`, `storage/@documenti_magazzino`, `storage/@documenti_mezzi` restano nel registro solo come storico. Le entry boundary `firestore-storage-documenti-*-doc` sono rimosse e `view.config.ts` punta alle root sostitutive.
- **Boundary V1**: le root collection sono operative con `accessMode: "collection_root"` tramite `firestore-documenti-generici-root`, `firestore-documenti-magazzino-root`, `firestore-documenti-mezzi-root`.

### Root collection Cisterna Caravate
- **Data decisione**: 2026-05-04.
- **Riferimento diario**: `docs/DIARIO_DECISIONI.md`, voce "Decisioni post-audit copertura modali (PROMPT 20)", decisione 2.
- **Riferimento audit**: `docs/product/AUDIT_COPERTURA_MODALI_2026-05-04.md`.
- **Stato**: BLOCCO ARCHITETTURALE — boundary da estendere in prompt successivo dedicato.
- **Annotazione audit PROMPT 22 (2026-05-04)**: stato aggiornato a BLOCCO RUNTIME — resolver `post-llm-resolver.js` da estendere per consumare accessMode `collection_root`.
- **Motivazione tecnica PROMPT 22**: il pattern `collection_root` esiste gia' nel boundary ma il resolver runtime legge solo entry `collection === 'storage'`. Senza patch resolver, le entry `collection_root` aggiunte resterebbero dichiarative e non operative.
- **Collection documentate in v0.6**: `@documenti_cisterna`, `@cisterna_schede_ia`, `@cisterna_parametri_mensili`.
- **Conseguenza operativa**: Cisterna entra nel perimetro del motore generico v1 solo dopo estensione boundary root collection e runtime check dedicato.

### Audit accessMode root collection — ESITO 3 (2026-05-04)
- **Esito audit PROMPT 22**: ESITO 3 — PATCH NON POSSIBILE senza estensione runtime del resolver.
- **AccessMode presenti nel boundary**:
  - `exact_document`: usato in produzione dal resolver. OK.
  - `collection_root`: dichiarato ma NON consumato dal resolver runtime.
  - `exact_object_path_from_firestore_field`: usato per Storage (libretto), non applicabile a root collection Firestore.
- **Resolver runtime osservato**: `backend/internal-ai/server/lib/post-llm-resolver.js` legge solo entry con `collection === 'storage'` e `docId === datasetKey`.
- **Euromecc dormienti**: le 6 entry `euromecc_pending`, `euromecc_done`, `euromecc_issues`, `euromecc_area_meta`, `euromecc_extra_components`, `euromecc_relazioni` usano `collection_root` ma sono DICHIARATE — NON OPERATIVE FINO A PATCH RESOLVER.
- **Effetto collaterale documentato**: la patch resolver dedicata sblocchera' contemporaneamente le 6 root collection nuove e le 6 entry Euromecc gia' dichiarate.
- **AGGIORNAMENTO 2026-05-04 dopo audit PROMPT 24a**: Il blocco runtime non e' una semplice estensione del resolver. `post-llm-resolver.js` e' un resolver Driver360-specifico, scritto su misura per la Fase 2 Zero-Invenzioni. L'attivazione delle entry `collection_root` (6 root nuove + 6 Euromecc dormienti) richiede un Resolver di natura diversa, multi-vista e multi-record, che e' parte integrante del motore generico v1. Decisione strategica registrata in DIARIO_DECISIONI.md, entry 2026-05-04 — `Patch collection_root assorbita nel motore generico`.

## Esclusioni by design dal motore generico v1

### `chat_ia_reports`
- **Stato**: ESCLUSA BY DESIGN.
- **Data decisione**: 2026-05-04.
- **Riferimento diario**: `docs/DIARIO_DECISIONI.md`, voce "Decisioni post-audit copertura modali (PROMPT 20)", decisione 3.
- **Motivazione**: archivio tecnico dei report generati dalla Chat IA; non e' dato business gestionale.
- **Storage correlato**: `chat_ia_reports/{sector}/{year}/{id}.pdf` non documentato per scelta nel motore generico v1.

### `@analisi_economica_mezzi`
- **Stato**: ESCLUSA BY DESIGN.
- **Data decisione**: 2026-05-04.
- **Riferimento diario**: `docs/DIARIO_DECISIONI.md`, voce "Decisioni post-audit copertura modali (PROMPT 20)", decisione 5.
- **Motivazione**: contiene narrativa IA salvata da `AnalisiEconomica.tsx`; leggerla come fonte certificata violerebbe Zero-Invenzioni.
- **Conseguenza operativa**: esclusa dal motore generico v1 anche se citata storicamente come `storage/@analisi_economica_mezzi`.

### `stamped/*`
- **Stato**: ESCLUSA BY DESIGN — legacy fuori scope motore generico v1.
- **Data decisione**: 2026-05-04.
- **Riferimento diario**: `docs/DIARIO_DECISIONI.md`, voce "Decisioni post-audit copertura modali (PROMPT 20)", decisione 6.
- **Riferimento codice**: `functions/index.js:771-788`, Cloud Function `stamp_pdf`.
- **Motivazione**: PDF timbrati prodotti senza referenza Firestore; da rivalutare solo in fase successiva se servira'.

## Collection

### `storage/@mezzi_aziendali`
- **Path Firestore**: collection `storage`, documento `@mezzi_aziendali`
- **Stato verifica**: VERIFICATA RUNTIME
- **Cosa contiene**: anagrafica mezzi aziendali, targa, categoria, dati tecnici e legame statico con autista.
- **Come salva i dati**: documento storage con array legacy (`items` / `value` / `value.items` secondo reader).
- **Campi conosciuti runtime**:
  - `id`: string, chiave record.
  - `targa`: string, chiave mezzo; esempi ammessi: `TI180147`, `TI282780`.
  - `categoria`: string, dato classificatorio; enum osservati ammessi: `trattore stradale`, `semirimorchio asse fisso`. R2 PARZIALMENTE CHIUSA: `categoria` e' usabile come campo principale osservato (12 valori enum reali). Il campo `tipo` resta alias/seconda fonte da indagare nel motore generico. Il motore deve leggere i valori enum live da Firestore, non hardcodarli.
  - `marca`, `modello`, `telaio`, `massaComplessiva`: string, dati tecnici.
  - `autistaId`: string, relazione anagrafica verso collega/autista. Fallback secondario, perde priorita' rispetto a `@autisti_sessione_attive` (validato 2026-05-04).
  - `autistaNome`: string, dato denormalizzato; valore ammesso osservato: `SANDRO CALABRESE`.
  - `librettoUrl`, `librettoStoragePath`: string, riferimento documento/libretto.
  - `fotoPath`: string, path tecnico foto mezzo; campo aggiunto 2026-05-04 per pannello prove esistenza foto.
  - `dataImmatricolazione`, `dataScadenzaRevisione`, `dataUltimoCollaudo`: string, date operative.
- **Campi-chiave**: `targa`, `id`, `autistaId`, `librettoStoragePath`, `fotoPath`.
- **Nodi del grafo dati**: mezzo, libretto/documento, autista (via campo statico).
- **Archi / relazioni possibili**:
  - mezzo --[debole]--> autista via `autistaId`; mostrabile: si come fallback se sessione attiva assente o non trovata.
  - mezzo --[forte]--> libretto via `librettoStoragePath`; mostrabile: si.
  - mezzo --[da_validare]--> tipo mezzo via `categoria`; mostrabile: si.
- **Campi che creano relazione**:
  - `autistaId` -> `storage/@colleghi.id`: relazione statica autista-mezzo.
  - `targa` -> eventi/rifornimenti/manutenzioni: chiave mezzo exact match.
- **Operazioni tipiche**: lettura per flotta, dossier, Driver360, scadenze; scrittura da moduli Mezzi/Scadenze.
- **Provenance per dati mostrati**: `targa`, `categoria`, `marca`, `modello`, `autistaId`, `librettoStoragePath`, `fotoPath`, date revisione/collaudo.
- **Note di validazione (per Giuseppe)**: R2 PARZIALMENTE CHIUSA: `categoria` e' usabile come campo principale osservato (12 valori enum reali). Il campo `tipo` resta alias/seconda fonte da indagare nel motore generico. Il motore deve leggere i valori enum live da Firestore, non hardcodarli. `autistaId` resta fallback secondario e perde priorita' rispetto a `@autisti_sessione_attive`.

#### Sessione 2026-05-09 — Campo `manutenzioneContrattoAttivo`
- `manutenzioneContrattoAttivo`: boolean (default true). Toggle dal `NextMezzoEditModal` aperto dal Centro Controllo. Quando `false`: KPI "Manut. scadute" esclude il mezzo, bordo critical NON applicato in Sinottica V2, pill "NON ATTIVO" grigia.
- Persistenza: scrittura su `@mezzi_aziendali` autorizzata da `INTERNAL_AI_MAGAZZINO_INLINE_SCOPE` esteso anche al path `/next/centro-controllo` (vedi sezione "Scope barrier write").

### `storage/@colleghi`
- **Path Firestore**: collection `storage`, documento `@colleghi`
- **Stato verifica**: VERIFICATA RUNTIME
- **Cosa contiene**: anagrafica colleghi/autisti.
- **Come salva i dati**: documento storage con array legacy.
- **Campi conosciuti runtime**:
  - `id`: string, chiave record.
  - `nome`: string, nome visualizzato; esempio ammesso: `SANDRO CALABRESE`.
  - `badge`: string, badge autista; esempio ammesso: `530`.
  - `codice`: string, codice interno.
  - `nomeCompleto`, `label`: non presenti nel campione runtime allowed.
- **Campi-chiave**: `id`, `badge`, `codice`.
- **Nodi del grafo dati**: autista/collega.
- **Archi / relazioni possibili**:
  - autista --[debole]--> mezzo via `@mezzi_aziendali.autistaId` come fallback se sessione attiva assente o non trovata.
  - autista --[forte]--> sessione via `badge` + `@autisti_sessione_attive.badgeAutista`.
- **Campi che creano relazione**: `id`, `badge`.
- **Operazioni tipiche**: lettura per Driver360, anagrafiche, login autista; scrittura da Anagrafiche.
- **Provenance per dati mostrati**: `nome`, `badge`, `codice`, `id`.
- **Note di validazione (per Giuseppe)**: confermare se `badge` e' stabile come chiave operativa o se va preferito sempre `id`.

### `storage/@autisti_sessione_attive`
- **Path Firestore**: collection `storage`, documento `@autisti_sessione_attive`
- **Stato verifica**: VERIFICATA RUNTIME
- **Cosa contiene**: sessioni attive autisti e assetto mezzo corrente.
- **Come salva i dati**: documento storage con array di sessioni attive.
- **Campi conosciuti runtime**:
  - `nomeAutista`: string, autista; esempio ammesso: `SANDRO CALABRESE`.
  - `badgeAutista`: string, badge; esempio ammesso: `530`.
  - `targaMotrice`: string, motrice; esempio ammesso: `TI180147`.
  - `targaRimorchio`: string/null, rimorchio; esempio ammesso: `TI282780`.
  - `timestamp`: number, aggiornamento evento/sessione.
  - `id`, `autistaId`, `autistaNome`, `autista`, `badge`, `mezzoTarga`, `targa`, `statoSessione`, `stato`, `sessione`: non presenti nel campione allowed.
- **Campi-chiave**: `badgeAutista`, `targaMotrice`, `targaRimorchio`, `timestamp`.
- **Nodi del grafo dati**: autista, sessione_attiva, motrice, rimorchio.
- **Archi / relazioni possibili**:
  - autista --[forte]--> sessione_attiva via `badgeAutista`; mostrabile: si.
  - sessione_attiva --[forte]--> motrice via `targaMotrice`; mostrabile: si.
  - sessione_attiva --[forte]--> rimorchio via `targaRimorchio`; mostrabile: si.
- **Campi che creano relazione**:
  - `badgeAutista + targaMotrice`: regola proposta `active_session_motrice`.
  - `badgeAutista + targaRimorchio`: regola proposta `active_session_rimorchio`.
- **Operazioni tipiche**: lettura per Driver360 e app autisti; scrittura da setup/cambio mezzo/autisti admin.
- **Provenance per dati mostrati**: `nomeAutista`, `badgeAutista`, `targaMotrice`, `targaRimorchio`, `timestamp`.
- **Note di validazione (per Giuseppe)**: VALIDATO 2026-05-04: fonte autoritativa per motrice/rimorchio correnti. Vince su `@mezzi_aziendali.autistaId` in caso di divergenza. Driver360 e viste future leggono prima questa, anagrafica statica e' fallback.

### `storage/@storico_eventi_operativi`
- **Path Firestore**: collection `storage`, documento `@storico_eventi_operativi`
- **Stato verifica**: VERIFICATA RUNTIME
- **Cosa contiene**: eventi operativi storici lato autisti/mezzi.
- **Come salva i dati**: append eventi in documento storage.
- **Campi conosciuti runtime**:
  - `id`: string, chiave evento.
  - `tipo`: string, enum evento; enum osservato ammesso: `CAMBIO_ASSETTO`.
  - `timestamp`: number.
  - `nomeAutista`, `autistaNome`, `autista`: string.
  - `badgeAutista`: string.
  - `dopo`: object, payload post-evento. VALIDATO 2026-05-04: contiene `targaMotrice` e `targaRimorchio` post-evento. Dopo un evento tipo `CAMBIO_ASSETTO`, `@autisti_sessione_attive` viene aggiornato con questi valori.
  - campi targa diretti (`targaMotrice`, `targaRimorchio`, `dopoMotrice`, `dopoRimorchio`) non presenti nella proiezione runtime osservata.
- **Campi-chiave**: `id`, `tipo`, `timestamp`, `badgeAutista`, `dopo`.
- **Nodi del grafo dati**: evento_operativo, autista, assetto mezzo.
- **Archi / relazioni possibili**:
  - autista --[forte]--> evento_operativo via `badgeAutista`; mostrabile: si.
  - evento_operativo --[forte]--> assetto mezzo via campi dentro `dopo`; mostrabile: si.
- **Campi che creano relazione**:
  - `badgeAutista`
  - `badgeAutista + dopo.targaMotrice + dopo.targaRimorchio`: regola proposta `event_after_state`.
- **Operazioni tipiche**: storico inbox autisti, centro controllo, timeline operativa.
- **Provenance per dati mostrati**: `tipo`, `timestamp`, `badgeAutista`, `dopo`.
- **Note di validazione (per Giuseppe)**: VALIDATO 2026-05-04: `dopo` contiene `targaMotrice` e `targaRimorchio` post-evento; dopo `CAMBIO_ASSETTO`, la sessione attiva viene aggiornata.

### `storage/@rifornimenti_autisti_tmp`
- **Path Firestore**: collection `storage`, documento `@rifornimenti_autisti_tmp`
- **Stato verifica**: VERIFICATA RUNTIME
- **Cosa contiene**: rifornimenti inseriti dall'app autisti.
- **Come salva i dati**: append record temporanei/operativi in documento storage.
- **Campi conosciuti runtime**:
  - `id`: string.
  - `autistaId`: string.
  - `badgeAutista`: string, esempio ammesso: `530`.
  - `timestamp`, `data`: number.
  - `litri`, `km`: number.
  - `confermatoAutista`: boolean.
  - `originId`, `badge`, `mezzoTarga`, `targa`, `targaMotrice`: non presenti nel campione rilevante.
- **Campi-chiave**: `id`, `autistaId`, `badgeAutista`, `data`.
- **Nodi del grafo dati**: rifornimento, autista, mezzo (solo se targa presente).
- **Archi / relazioni possibili**:
  - autista --[forte]--> rifornimento via `autistaId`/`badgeAutista`.
  - rifornimento --[da_validare]--> mezzo: non certificabile nel campione runtime per assenza targa allowed.
- **Campi che creano relazione**: `autistaId`, `badgeAutista`, eventuale targa se presente in altri record.
- **Operazioni tipiche**: rifornimenti autisti, cisterna, confronti consumi.
- **Provenance per dati mostrati**: `data`, `litri`, `km`, `confermatoAutista`, `autistaId`, `badgeAutista`.
- **Note di validazione (per Giuseppe)**: VALIDATO 2026-05-04: i record sono fonte certificata appena l'autista invia. La conferma admin/operatore e' solo marcatura aggiuntiva, non cambia lo stato di certificazione. Driver360 e viste future possono leggere questi record come dati certificati senza attendere conferma.
  Precisazione certificazione TMP (validata 2026-05-04):
  "Certificato" significa: il record e' certificato come dato inviato dall'autista tramite app.
  Non significa che ogni contenuto libero del record diventi automaticamente prova di relazione.
  - Campi STRUTTURATI usabili come fonte di relazione: badge, autistaId, targa, timestamp, stato, quantita', km, litri, e altri campi tipizzati esplicitamente.
  - Campi LIBERI NON certificano relazioni: note, descrizione, messaggio, commento, testo libero.
  Il Relation Resolver deve attingere solo ai campi strutturati per produrre relationProof. I campi liberi possono essere mostrati come testo informativo, mai come prova.

### `storage/@alerts_state`
- **Path Firestore**: collection `storage`, documento `@alerts_state`
- **Stato verifica**: BOUNDARY VERIFICATA RUNTIME (post-update allowedFields)
- **Cosa contiene**: stato alert/dismissal del centro controllo.
- **Come salva i dati**: documento storage letto da `nextAlertsStateDomain.ts`.
- **Campi conosciuti**: shape non determinabile senza estensione boundary o conferma utente.
- **AllowedFields boundary**: id, value, version, items, ackAt, snoozeUntil, lastShownAt, meta, type, ref.
- **Campi esclusi by design**: note libere, descrizione, messaggio, commento, testo, dettaglio.
- **Runtime check 2026-05-04**: documento esiste; shape runtime osservata come wrapper value object, non come righe alert dirette.
- **Discrepanza runtime 2026-05-04**: campi reali non in allowedFields: value; campi ipotizzati assenti: version, items, id, ackAt, snoozeUntil, lastShownAt, meta, type, ref. Raccomandazione: verificare shape interna di value in prompt mirato prima di usare in motore generico.
- **Campi-chiave**: probabile id alert; DA VALIDARE.
- **Nodi del grafo dati**: alert.
- **Archi / relazioni possibili**: alert --[da_validare]--> mezzo/scadenza.
- **Campi che creano relazione**: DA VALIDARE.
- **Operazioni tipiche**: lettura per centro controllo.
- **Provenance per dati mostrati**: stato alert, data/chiave alert se confermata.
- **Note di validazione (per Giuseppe)**: serve esempio shape o estensione boundary.

### `storage/@analisi_economica_mezzi`
- **Path Firestore**: collection `storage`, documento `@analisi_economica_mezzi`
- **Stato verifica**: BOUNDARY OPEN — RUNTIME PENDING — VERIFICA RINVIATA
- **Cosa contiene**: analisi economiche salvate per mezzo.
- **Come salva i dati**: documento storage letto da `nextAnalisiEconomicaDomain.ts` e tool `get_saved_economic_analysis`.
- **Campi conosciuti**: targa/periodo/metriche economiche citate dal reader; shape runtime non verificata.
- **AllowedFields boundary**: id, __docId, targa, updatedAt, updatedAtLabel, dataAggiornamento.
- **Nota v0.6 (2026-05-04)**: ESCLUSA BY DESIGN — narrativa IA non certificabile. Non usare come fonte del motore generico v1.
- **Runtime check 2026-05-04**: documento storage/@analisi_economica_mezzi non trovato. Possibile collection mai popolata o nome diverso.
- **Campi-chiave**: `targa`, periodo/id analisi.
- **Nodi del grafo dati**: mezzo, analisi_economica.
- **Archi / relazioni possibili**: mezzo --[forte]--> analisi via targa exact.
- **Campi che creano relazione**: `targa`.
- **Operazioni tipiche**: lettura per analisi economica e Chat IA.
- **Provenance per dati mostrati**: metriche aggregate, periodo, targa, source id.
- **Note di validazione (per Giuseppe)**: decisione post-audit 2026-05-04: esclusa dal motore generico v1 perche' contiene narrativa IA salvata, non fonte certificata Zero-Invenzioni.

### `storage/@attrezzature_cantieri`
- **Path Firestore**: collection `storage`, documento `@attrezzature_cantieri`
- **Stato verifica**: BOUNDARY VERIFICATA RUNTIME (post-update allowedFields)
- **Cosa contiene**: attrezzature assegnate ai cantieri.
- **Come salva i dati**: documento storage letto da `nextAttrezzatureCantieriDomain.ts`.
- **Campi conosciuti**: cantiere, attrezzatura, stato, date; shape runtime non verificata.
- **AllowedFields boundary**: id, cantiere, cantiereId, cantiereLabel, attrezzatura, attrezzaturaId, nome, tipo, stato, data, materialeCategoria, quantita, sourceCantiereId, sourceCantiereLabel, unita, fotoStoragePath, createdAt, updatedAt.
- **Campi esclusi by design**: descrizione, fotoUrl, note.
- **Nota v0.6 (2026-05-04)**: `fotoStoragePath` aggiunto per pannello prove esistenza foto; URL firmati esclusi.
- **Runtime check 2026-05-04**: campi allowed confermati: id, cantiereId, data, tipo.
- **Discrepanza runtime 2026-05-04**: campi reali non in allowedFields: cantiereLabel, descrizione, fotoStoragePath, fotoUrl, materialeCategoria, note, quantita, sourceCantiereId, sourceCantiereLabel, unita; campi ipotizzati assenti: attrezzatura, attrezzaturaId, cantiere, createdAt, nome, stato, updatedAt. Raccomandazione: estendere solo campi strutturati se servono a Site360; mantenere descrizione/note fuori da relationProof.
- **Campi-chiave**: id attrezzatura, cantiere.
- **Nodi del grafo dati**: cantiere, attrezzatura.
- **Archi / relazioni possibili**: cantiere --[forte]--> attrezzatura via id/cantiere se confermato.
- **Campi che creano relazione**: DA VALIDARE.
- **Operazioni tipiche**: lettura/scrittura modulo Attrezzature cantieri.
- **Provenance per dati mostrati**: nome attrezzatura, stato, cantiere, record id.
- **Note di validazione (per Giuseppe)**: confermare chiave canonica del cantiere.

### `storage/@cambi_gomme_autisti_tmp`
- **Path Firestore**: collection `storage`, documento `@cambi_gomme_autisti_tmp`
- **Stato verifica**: BOUNDARY VERIFICATA RUNTIME (post-update allowedFields)
- **Cosa contiene**: richieste cambio gomme lato autisti.
- **Come salva i dati**: documento storage letto da `nextManutenzioniGommeDomain.ts` e inbox autisti.
- **Campi conosciuti**: autista/badge, mezzo/targa, gomme, stato; shape runtime non verificata.
- **AllowedFields boundary**: id, autistaId, badgeAutista, badge, targa, targaCamion, targaMotrice, targaRimorchio, timestamp, data, stato, tipo, categoria, ambito, target, esito, severita, tipoProblema, asse, posizione, attrezzatura, attrezzaturaId, quantita, km, litri, controlliKo, confermatoAutista, adminEdit, asseId, asseLabel, assiConCambioGomme, autista, autistaNome, categoriaMezzo, check, contesto, flagVerifica, gommeIds, letta, linkedLavoroId, marca, mezzoId, obbligatorio, posizioneGomma, problemaGomma, targetTarga, targetType.
- **Campi esclusi by design**: rotazioneAssi, rotazioneSchema, rotazioneText, note, descrizione, messaggio, testo, foto, fotoUrl, fotoDataUrl.
- **Runtime check 2026-05-04**: campi allowed confermati: id, categoria, data, km, stato, timestamp, tipo.
- **Discrepanza runtime 2026-05-04**: campi reali non in allowedFields: adminEdit, asseId, asseLabel, assiConCambioGomme, autista, contesto, gommeIds, letta, marca, rotazioneAssi, rotazioneSchema, rotazioneText, targetTarga, targetType; campi ipotizzati assenti principali: autistaId, badgeAutista, targa/targaMotrice/targaRimorchio. Raccomandazione: mappare autista/contesto/targetTarga in prompt successivo senza usare campi liberi.
- **Campi-chiave**: id richiesta, targa, badge.
- **Nodi del grafo dati**: richiesta_gomme, autista, mezzo.
- **Archi / relazioni possibili**: autista --[da_validare]--> richiesta_gomme; richiesta_gomme --[da_validare]--> mezzo.
- **Campi che creano relazione**: badge/targa se presenti.
- **Operazioni tipiche**: inbox gomme, manutenzioni gomme.
- **Provenance per dati mostrati**: stato richiesta, targa, source id.
- **Note di validazione (per Giuseppe)**: VALIDATO 2026-05-04: i record sono fonte certificata appena l'autista invia. La conferma admin/operatore e' solo marcatura aggiuntiva, non cambia lo stato di certificazione. Driver360 e viste future possono leggere questi record come dati certificati senza attendere conferma.
  Precisazione certificazione TMP (validata 2026-05-04):
  "Certificato" significa: il record e' certificato come dato inviato dall'autista tramite app.
  Non significa che ogni contenuto libero del record diventi automaticamente prova di relazione.
  - Campi STRUTTURATI usabili come fonte di relazione: badge, autistaId, targa, timestamp, stato, quantita', km, litri, e altri campi tipizzati esplicitamente.
  - Campi LIBERI NON certificano relazioni: note, descrizione, messaggio, commento, testo libero.
  Il Relation Resolver deve attingere solo ai campi strutturati per produrre relationProof. I campi liberi possono essere mostrati come testo informativo, mai come prova.

### `storage/@cisterne_adblue`
- **Path Firestore**: collection `storage`, documento `@cisterne_adblue`
- **Stato verifica**: BOUNDARY VERIFICATA RUNTIME (post-update allowedFields)
- **Cosa contiene**: movimenti/stato cisterne AdBlue.
- **Come salva i dati**: documento storage letto da `nextAdBlueDomain.ts`/magazzino.
- **Campi conosciuti**: cisterna, litri, movimento, data, note; shape runtime non verificata.
- **AllowedFields boundary**: id, cisternaId, cisterna, tipo, timestamp, data, litri, quantita, unita, stato, targa, mezzoTarga, inventarioRefId, materialeLabel, numeroCisterna, quantitaLitri, sourceRecordId, stockKey.
- **Campi esclusi by design**: descrizione, note.
- **Runtime check 2026-05-04**: campi allowed confermati: id, data, litri, quantita, unita.
- **Discrepanza runtime 2026-05-04**: campi reali non in allowedFields: descrizione, inventarioRefId, materialeLabel, note, numeroCisterna, quantitaLitri, stockKey; campi ipotizzati assenti: cisterna, cisternaId, tipo, timestamp, stato, targa, mezzoTarga, sourceRecordId. Raccomandazione: valutare inventarioRefId/stockKey/numeroCisterna come campi strutturati; mantenere descrizione/note escluse.
- **Campi-chiave**: id movimento/cisterna.
- **Nodi del grafo dati**: cisterna_adblue, movimento_materiale.
- **Archi / relazioni possibili**: cisterna --[forte]--> movimento via id cisterna se confermato.
- **Campi che creano relazione**: DA VALIDARE.
- **Operazioni tipiche**: magazzino AdBlue.
- **Provenance per dati mostrati**: movimento, quantita', data, fonte.
- **Note di validazione (per Giuseppe)**: definire se e' dominio materiale o flotta.

### `@documenti_cisterna`
- **Path Firestore**: root collection `@documenti_cisterna`
- **Stato verifica**: BLOCCO ARCHITETTURALE — boundary root collection da estendere.
- **Annotazione audit PROMPT 22 (2026-05-04)**: stato aggiornato a BLOCCO RUNTIME — resolver `post-llm-resolver.js` da estendere per consumare accessMode `collection_root`.
- **Motivazione tecnica PROMPT 22**: il pattern `collection_root` esiste gia' nel boundary ma il resolver runtime legge solo entry `collection === 'storage'`. Senza patch resolver, le entry `collection_root` aggiunte resterebbero dichiarative e non operative.
- **Data voce**: 2026-05-04.
- **Riferimento diario/audit**: decisione post-audit PROMPT 20 n.2; audit copertura modali 2026-05-04.
- **Cosa contiene**: documenti Cisterna Caravate salvati da IA/import manuale, fatture e bollettini carburante.
- **Come salva i dati**: root collection Firestore con `addDoc` e `updateDoc` da `CisternaCaravateIA.tsx`, `CisternaCaravatePage.tsx`, `nextCisternaWriter.ts`.
- **Campi conosciuti da codice reale**:
  - `tipoDocumento`: enum/document type strutturato.
  - `fornitore`, `destinatario`, `numeroDocumento`, `dataDocumento`: metadati documento.
  - `yearMonth`, `mese`: chiave periodo.
  - `litriTotali`, `litri15C`, `totaleDocumento`, `valuta`, `currency`: dati numerici/economici.
  - `prodotto`, `daVerificare`, `nomeFile`, `fonte`, `createdAt`, `updatedAt`: metadati strutturati.
  - `storagePath`: path tecnico Firebase Storage ammesso.
  - `dupGroupKey`, `dupChosen`, `dupIgnored`: metadati deduplica.
- **AllowedFields proposti per futuro boundary root**: tipoDocumento, fornitore, destinatario, numeroDocumento, dataDocumento, yearMonth, mese, litriTotali, litri15C, totaleDocumento, valuta, currency, prodotto, daVerificare, nomeFile, fonte, createdAt, updatedAt, storagePath, dupGroupKey, dupChosen, dupIgnored.
- **Campi esclusi by design**: `fileUrl`, `testo`, `motivoVerifica`, note/descrizioni/testo libero.
- **Campi-chiave**: id documento, `storagePath`, `yearMonth`, `numeroDocumento`.
- **Nodi del grafo dati**: documento_cisterna, cisterna, fornitore.
- **Archi / relazioni possibili**: cisterna --[da_validare]--> documento via periodo/storage path; documento --[da_validare]--> fornitore via nome fornitore.
- **Campi che creano relazione**: `yearMonth`, `storagePath`, eventuale fornitore come ricerca/disambiguazione, non relazione forte.
- **Operazioni tipiche**: salvataggio documenti Cisterna Caravate.
- **Provenance per dati mostrati**: tipo documento, periodo, litri, importo, storagePath, source id.
- **Note di validazione (per Giuseppe)**: BLOCCO ARCHITETTURALE. Il boundary attuale non autorizza questa root collection. Runtime check richiesto dopo estensione boundary.

### `@cisterna_schede_ia`
- **Path Firestore**: root collection `@cisterna_schede_ia`
- **Stato verifica**: BLOCCO ARCHITETTURALE — boundary root collection da estendere.
- **Annotazione audit PROMPT 22 (2026-05-04)**: stato aggiornato a BLOCCO RUNTIME — resolver `post-llm-resolver.js` da estendere per consumare accessMode `collection_root`.
- **Motivazione tecnica PROMPT 22**: il pattern `collection_root` esiste gia' nel boundary ma il resolver runtime legge solo entry `collection === 'storage'`. Senza patch resolver, le entry `collection_root` aggiunte resterebbero dichiarative e non operative.
- **Data voce**: 2026-05-04.
- **Riferimento diario/audit**: decisione post-audit PROMPT 20 n.2; audit copertura modali 2026-05-04.
- **Cosa contiene**: schede carburante Cisterna Caravate estratte via IA o inserite manualmente.
- **Come salva i dati**: root collection Firestore con righe strutturate in `rows`.
- **Campi conosciuti da codice reale**:
  - `createdAt`, `updatedAt`, `source`, `fonte`: metadati origine.
  - `rowCount`, `rows`, `needsReview`, `yearMonth`: dati strutturati scheda.
  - `nomeFile`: metadato file.
  - `fileUrl`: URL firmato o download URL, escluso.
  - `rawLines`, `summary`: output/testo IA o aggregato narrativo, escluso.
- **AllowedFields proposti per futuro boundary root**: createdAt, updatedAt, source, fonte, rowCount, rows, needsReview, yearMonth, nomeFile.
- **Campi esclusi by design**: `fileUrl`, `rawLines`, `summary`, note/descrizioni/testo libero.
- **Lacuna campi**: verifica statica non trova path tecnico crop persistito; il codice persiste `fileUrl` ma non un `storagePath` tecnico per la scheda. Da risolvere prima del motore generico v1 se la prova file deve essere mostrata.
- **Campi-chiave**: id scheda, `yearMonth`, righe strutturate.
- **Nodi del grafo dati**: scheda_cisterna, riga_rifornimento, mezzo.
- **Archi / relazioni possibili**: scheda --[da_validare]--> mezzo via `rows[].targa` exact; scheda --[da_validare]--> periodo via `yearMonth`.
- **Campi che creano relazione**: `rows[].targa`, `rows[].data`, `yearMonth`.
- **Operazioni tipiche**: salvataggio schede manuali/IA Cisterna Caravate.
- **Provenance per dati mostrati**: row id implicito, targa, data, litri, stato revisione, source id.
- **Note di validazione (per Giuseppe)**: BLOCCO ARCHITETTURALE. Il boundary attuale non autorizza questa root collection. Runtime check richiesto dopo estensione boundary.

### `@cisterna_parametri_mensili`
- **Path Firestore**: root collection `@cisterna_parametri_mensili`
- **Stato verifica**: BLOCCO ARCHITETTURALE — boundary root collection da estendere.
- **Annotazione audit PROMPT 22 (2026-05-04)**: stato aggiornato a BLOCCO RUNTIME — resolver `post-llm-resolver.js` da estendere per consumare accessMode `collection_root`.
- **Motivazione tecnica PROMPT 22**: il pattern `collection_root` esiste gia' nel boundary ma il resolver runtime legge solo entry `collection === 'storage'`. Senza patch resolver, le entry `collection_root` aggiunte resterebbero dichiarative e non operative.
- **Data voce**: 2026-05-04.
- **Riferimento diario/audit**: decisione post-audit PROMPT 20 n.2; audit copertura modali 2026-05-04.
- **Cosa contiene**: parametri mensili Cisterna Caravate.
- **Come salva i dati**: root collection Firestore con documento per mese.
- **Campi conosciuti da codice reale**:
  - `mese`: chiave mese.
  - `cambioEurChf`: parametro numerico.
  - `updatedAt`: timestamp aggiornamento.
- **AllowedFields proposti per futuro boundary root**: mese, cambioEurChf, updatedAt.
- **Campi esclusi by design**: nessun campo libero osservato nel writer letto.
- **Campi-chiave**: `mese`.
- **Nodi del grafo dati**: parametro_mensile, cisterna.
- **Archi / relazioni possibili**: parametro_mensile --[forte]--> periodo via `mese`.
- **Campi che creano relazione**: `mese`.
- **Operazioni tipiche**: salvataggio cambio EUR/CHF mensile.
- **Provenance per dati mostrati**: mese, cambioEurChf, updatedAt, source id.
- **Note di validazione (per Giuseppe)**: BLOCCO ARCHITETTURALE. Il boundary attuale non autorizza questa root collection. Runtime check richiesto dopo estensione boundary.

### `storage/@controlli_mezzo_autisti`
- **Path Firestore**: collection `storage`, documento `@controlli_mezzo_autisti`
- **Stato verifica**: BOUNDARY VERIFICATA RUNTIME (post-update allowedFields)
- **Cosa contiene**: controlli mezzo inviati da autisti.
- **Come salva i dati**: documento storage letto da `nextAutistiDomain.ts`, `nextSegnalazioniControlliDomain.ts`, inbox.
- **Campi conosciuti**: autista/badge, targa, esito controllo, timestamp; shape runtime non verificata.
- **AllowedFields boundary**: id, autistaId, badgeAutista, badge, targa, targaCamion, targaMotrice, targaRimorchio, timestamp, data, stato, tipo, categoria, ambito, target, esito, severita, tipoProblema, asse, posizione, attrezzatura, attrezzaturaId, quantita, km, litri, controlliKo, confermatoAutista, adminEdit, asseId, asseLabel, assiConCambioGomme, autista, autistaNome, categoriaMezzo, check, contesto, flagVerifica, gommeIds, letta, linkedLavoroId, marca, mezzoId, obbligatorio, posizioneGomma, problemaGomma, targetTarga, targetType.
- **Campi esclusi by design**: note, descrizione, messaggio, testo, commento, telefono privato, email privata.
- **Runtime check 2026-05-04**: campi allowed confermati: id, badgeAutista, targaCamion, targaRimorchio, target, timestamp.
- **Discrepanza runtime 2026-05-04**: campi reali non in allowedFields: autistaNome, check, note, obbligatorio; campi ipotizzati assenti principali: autistaId, targa, targaMotrice, stato, tipo. Raccomandazione: valutare check/obbligatorio come dati strutturati; mantenere note escluse.
- **Campi-chiave**: id controllo, badge, targa.
- **Nodi del grafo dati**: controllo_mezzo, autista, mezzo.
- **Archi / relazioni possibili**: autista --[da_validare]--> controllo; controllo --[forte]--> mezzo via targa exact se campo presente.
- **Campi che creano relazione**: badge/targa.
- **Operazioni tipiche**: inbox controlli, centro controllo.
- **Provenance per dati mostrati**: esito controllo, targa, timestamp, source id.
- **Note di validazione (per Giuseppe)**: VALIDATO 2026-05-04: i record sono fonte certificata appena l'autista invia. La conferma admin/operatore e' solo marcatura aggiuntiva, non cambia lo stato di certificazione. Driver360 e viste future possono leggere questi record come dati certificati senza attendere conferma.
  Precisazione certificazione TMP (validata 2026-05-04):
  "Certificato" significa: il record e' certificato come dato inviato dall'autista tramite app.
  Non significa che ogni contenuto libero del record diventi automaticamente prova di relazione.
  - Campi STRUTTURATI usabili come fonte di relazione: badge, autistaId, targa, timestamp, stato, quantita', km, litri, e altri campi tipizzati esplicitamente.
  - Campi LIBERI NON certificano relazioni: note, descrizione, messaggio, commento, testo libero.
  Il Relation Resolver deve attingere solo ai campi strutturati per produrre relationProof. I campi liberi possono essere mostrati come testo informativo, mai come prova.

#### Sessione 2026-05-09 — Campi soft-delete aggiunti
- `chiuso`: boolean (default false). Set a `true` da `markControlloChiuso` chiamato dal Centro Controllo.
- `dataChiusura`: number (ms) | null. Timestamp scrittura quando `chiuso === true`.
- `chiuso_by`: string | null. Valore convenzionale: `"centro_controllo_next"`.
- Filtro applicato in Sinottica V2: chip "Controllo KO" esclude record con `chiuso === true`.

### `storage/@costiMezzo`
- **Path Firestore**: collection `storage`, documento `@costiMezzo`
- **Stato verifica**: BOUNDARY OPEN — RUNTIME VUOTO — VERIFICATO BY REFERENCE
- **Cosa contiene**: costi mezzo legacy aggregati o documentali.
- **Come salva i dati**: documento storage citato da `nextDocumentiCostiDomain.ts`.
- **Campi conosciuti**: shape non determinabile senza estensione boundary o conferma utente.
- **AllowedFields boundary**: id, targa, mezzoTarga, tipo, tipoDocumento, data, timestamp, importo, valuta, fornitore, numeroDocumento, sourceDocId, sourceRecordId.
- **Runtime check 2026-05-04**: documento esiste con contenitore items ma 0 record campionabili. Runtime check non possibile in questo turno.
- **Campi-chiave**: targa/id costo; DA VALIDARE.
- **Nodi del grafo dati**: costo, mezzo.
- **Archi / relazioni possibili**: mezzo --[da_validare]--> costo.
- **Campi che creano relazione**: targa se presente.
- **Operazioni tipiche**: costi mezzo/documenti.
- **Provenance per dati mostrati**: importi/costi, source id.
- **Note di validazione (per Giuseppe)**: VALIDATO 2026-05-04: dati economici mostrabili in chat certificata e in pannelli, nessuna policy di restrizione interna (utente unico admin del gestionale). Da verificare se e' ancora usata o sostituita da documenti costi.

### `storage/@documenti_generici`
- **Path Firestore**: collection `storage`, documento `@documenti_generici`
- **Stato verifica**: BOUNDARY OPEN — RUNTIME PENDING — VERIFICA RINVIATA
- **Nota v0.6 (2026-05-04)**: DEPRECATA — DA SOSTITUIRE CON ROOT COLLECTION `@documenti_generici`. Disallineamento confermato dall'audit PROMPT 20; boundary root collection da estendere in prompt successivo.
- **Cosa contiene**: documenti Archivista non associati a mezzo/magazzino specifico.
- **Come salva i dati**: documento storage letto da `nextDocumentiCostiDomain.ts`, `nextDocumentiMezzoDomain.ts`, Archivista.
- **Campi conosciuti**: id, tipo documento, metadati, storage path; shape runtime non verificata.
- **AllowedFields boundary**: id, __docId, tipoDocumento, tipo, documentType, categoria, archiveCategory, targa, mezzoTarga, targaCamion, targaRimorchio, targaMotrice, targaMezzo, metadatiMezzo, mezzo, destinatario, fornitore, fornitoreNome, supplier, numeroDocumento, numeroPreventivo, numero, dataDocumento, dataPreventivo, data, createdAt, timestamp, importo, valuta, nomeFile, mimeType, storagePath, fileStoragePath, pdfStoragePath, daVerificare.
- **Runtime check 2026-05-04**: documento storage/@documenti_generici non trovato. Possibile collection mai popolata o nome diverso.
- **Campi-chiave**: id documento, storage path.
- **Nodi del grafo dati**: documento.
- **Archi / relazioni possibili**: documento --[da_validare]--> entita' tramite metadati.
- **Campi che creano relazione**: metadati specifici da validare.
- **Operazioni tipiche**: archivio documenti generici.
- **Provenance per dati mostrati**: tipo documento, id, storage path, metadati.
- **Note di validazione (per Giuseppe)**: definire quando un documento generico puo' diventare prova per una relazione.

### `storage/@documenti_magazzino`
- **Path Firestore**: collection `storage`, documento `@documenti_magazzino`
- **Stato verifica**: BOUNDARY OPEN — RUNTIME PENDING — VERIFICA RINVIATA
- **Nota v0.6 (2026-05-04)**: DEPRECATA — DA SOSTITUIRE CON ROOT COLLECTION `@documenti_magazzino`. Disallineamento confermato dall'audit PROMPT 20; boundary root collection da estendere in prompt successivo.
- **Cosa contiene**: documenti magazzino e costi/materiali.
- **Come salva i dati**: documento storage usato da Archivista Magazzino e domini costi/materiali.
- **Campi conosciuti**: id, voci, fornitore, documento, storage path; shape runtime non verificata.
- **AllowedFields boundary**: id, __docId, tipoDocumento, tipo, documentType, categoria, archiveCategory, targa, mezzoTarga, targaCamion, targaRimorchio, targaMotrice, targaMezzo, metadatiMezzo, mezzo, destinatario, fornitore, fornitoreNome, supplier, numeroDocumento, numeroPreventivo, numero, dataDocumento, dataPreventivo, data, createdAt, timestamp, importo, valuta, nomeFile, mimeType, storagePath, fileStoragePath, pdfStoragePath, daVerificare, voci, materiale, codice, quantita, unita, prezzoUnitario.
- **Runtime check 2026-05-04**: documento storage/@documenti_magazzino non trovato. Possibile collection mai popolata o nome diverso.
- **Campi-chiave**: id documento, voci[].id, materiale.
- **Nodi del grafo dati**: documento, materiale, fornitore.
- **Archi / relazioni possibili**: documento --[da_validare]--> materiale; documento --[da_validare]--> fornitore.
- **Campi che creano relazione**: voci/materiale/fornitore se presenti.
- **Operazioni tipiche**: magazzino documenti-costi, Archivista.
- **Provenance per dati mostrati**: voci documento, materiale, quantita', source id.
- **Note di validazione (per Giuseppe)**: R4 PARZIALMENTE CHIUSA: `stockKey` e' chiave preferita quando presente. Fallback controllati per collection: `articoloCanonico`, `codiceArticolo`, `id`, `materialeLabel`. La risoluzione finale resta DA VALIDARE nel motore generico, che applichera' la priorita' degli alias in ordine. R5 PARZIALMENTE CHIUSA: preferire `id`, `idFornitore`, `fornitoreId`, `supplierId` quando presenti come chiave forte. I nomi (`nome`, `fornitoreNome`, `nomeFornitore`, `supplierName`) si usano solo per ricerca e disambiguazione, NON come relazione forte. Il motore generico deve sempre tentare prima la chiave forte, e usare il nome solo come fallback informativo.

### `storage/@documenti_mezzi`
- **Path Firestore**: collection `storage`, documento `@documenti_mezzi`
- **Stato verifica**: BOUNDARY OPEN — RUNTIME PENDING — VERIFICA RINVIATA
- **Nota v0.6 (2026-05-04)**: DEPRECATA — DA SOSTITUIRE CON ROOT COLLECTION `@documenti_mezzi`. Disallineamento confermato dall'audit PROMPT 20; boundary root collection da estendere in prompt successivo.
- **Cosa contiene**: documenti associati ai mezzi.
- **Come salva i dati**: documento storage usato da Archivista Documento Mezzo, manutenzioni e dossier.
- **Campi conosciuti**: id, targa/metadati mezzo, tipo documento, storage path; shape runtime non verificata.
- **AllowedFields boundary**: id, __docId, tipoDocumento, tipo, documentType, categoria, archiveCategory, targa, mezzoTarga, targaCamion, targaRimorchio, targaMotrice, targaMezzo, metadatiMezzo, mezzo, destinatario, fornitore, fornitoreNome, supplier, numeroDocumento, numeroPreventivo, numero, dataDocumento, dataPreventivo, data, createdAt, timestamp, importo, valuta, nomeFile, mimeType, storagePath, fileStoragePath, pdfStoragePath, daVerificare.
- **Runtime check 2026-05-04**: documento storage/@documenti_mezzi non trovato. Possibile collection mai popolata o nome diverso.
- **Campi-chiave**: id documento, targa, storage path.
- **Nodi del grafo dati**: documento, mezzo.
- **Archi / relazioni possibili**: mezzo --[forte]--> documento via targa exact se campo presente.
- **Campi che creano relazione**: targa/metadatiMezzo.targa.
- **Operazioni tipiche**: dossier mezzo, Archivista, manutenzioni.
- **Provenance per dati mostrati**: tipo documento, targa, storage path, data documento.
- **Note di validazione (per Giuseppe)**: confermare campo targa canonico (`targa` vs `metadatiMezzo.targa`).

### `storage/@fornitori`
- **Path Firestore**: collection `storage`, documento `@fornitori`
- **Stato verifica**: BOUNDARY VERIFICATA RUNTIME (post-update allowedFields)
- **Cosa contiene**: anagrafica fornitori.
- **Come salva i dati**: documento storage letto da `nextFornitoriDomain.ts` e Anagrafiche.
- **Campi conosciuti**: nome, telefono/citta/codici secondo anagrafiche; shape runtime non verificata.
- **AllowedFields boundary**: id, nome, ragioneSociale, fornitore, label, badge, codice.
- **Campi esclusi by design**: descrizione, telefono, telefoniAggiuntivi, email privata, indirizzo privato.
- **Runtime check 2026-05-04**: campi allowed confermati: id, nome, badge, codice.
- **Discrepanza runtime 2026-05-04**: campi reali non in allowedFields: descrizione, telefono; campi ipotizzati assenti: ragioneSociale, fornitore, label. Raccomandazione: mantenere telefono e descrizione esclusi; chiave fornitore da rivedere in R5.
- **Campi-chiave**: id, nome.
- **Nodi del grafo dati**: fornitore.
- **Archi / relazioni possibili**: fornitore --[da_validare]--> preventivo/ordine/documento.
- **Campi che creano relazione**: id/nome fornitore se stabilizzati.
- **Operazioni tipiche**: anagrafiche, procurement, magazzino.
- **Provenance per dati mostrati**: nome fornitore, id, eventuali codici non sensibili.
- **Note di validazione (per Giuseppe)**: R5 PARZIALMENTE CHIUSA: preferire `id`, `idFornitore`, `fornitoreId`, `supplierId` quando presenti come chiave forte. I nomi (`nome`, `fornitoreNome`, `nomeFornitore`, `supplierName`) si usano solo per ricerca e disambiguazione, NON come relazione forte. Il motore generico deve sempre tentare prima la chiave forte, e usare il nome solo come fallback informativo.

### `storage/@gomme_eventi`
- **Path Firestore**: collection `storage`, documento `@gomme_eventi`
- **Stato verifica**: BOUNDARY VERIFICATA RUNTIME (post-update allowedFields)
- **Cosa contiene**: eventi gomme ufficializzati.
- **Come salva i dati**: documento storage usato da inbox autisti e `nextManutenzioniGommeDomain.ts`.
- **Campi conosciuti**: targa, evento, gomme, data; shape runtime non verificata.
- **AllowedFields boundary**: id, targa, targaMotrice, targaRimorchio, timestamp, data, tipo, stato, asse, posizione, km, quantita, asseId, asseLabel, assiConCambioGomme, autista, categoria, contesto, gommeIds, marca, sourceRecordId, targetTarga, targetType.
- **Campi esclusi by design**: rotazioneAssi, rotazioneSchema, rotazioneText, note, descrizione, messaggio, testo.
- **Runtime check 2026-05-04**: campi allowed confermati: id, data, km, tipo.
- **Discrepanza runtime 2026-05-04**: campi reali non in allowedFields: asseId, asseLabel, assiConCambioGomme, autista, categoria, contesto, gommeIds, marca, rotazioneAssi, rotazioneSchema, rotazioneText, targetTarga, targetType; campi ipotizzati assenti: targa, targaMotrice, targaRimorchio, timestamp, stato, asse, posizione, quantita, sourceRecordId. Raccomandazione: mappare targetTarga/targetType e assi in prompt successivo.
- **Campi-chiave**: id evento, targa.
- **Nodi del grafo dati**: evento_gomme, mezzo.
- **Archi / relazioni possibili**: mezzo --[forte]--> evento_gomme via targa exact se campo presente.
- **Campi che creano relazione**: targa.
- **Operazioni tipiche**: manutenzioni gomme.
- **Provenance per dati mostrati**: evento, targa, data, source id.
- **Note di validazione (per Giuseppe)**: confermare differenza tra tmp e ufficiale.

### `storage/@impostazioni_app`
- **Path Firestore**: collection `storage`, documento `@impostazioni_app`
- **Stato verifica**: BOUNDARY OPEN — RUNTIME PENDING — VERIFICA RINVIATA
- **Cosa contiene**: configurazioni app/IA.
- **Come salva i dati**: documento storage letto da `nextIaConfigDomain.ts`.
- **Campi conosciuti**: shape non determinabile senza estensione boundary o conferma utente.
- **AllowedFields boundary**: nessuno (entry prudente: nessun campo business sicuro confermato; apiKey/secret esclusi).
- **Runtime check 2026-05-04**: documento storage/@impostazioni_app non trovato. La scelta allowedFields vuoto resta prudente.
- **Campi-chiave**: chiave configurazione.
- **Nodi del grafo dati**: configurazione.
- **Archi / relazioni possibili**: nessun arco business diretto noto.
- **Campi che creano relazione**: nessuno noto.
- **Operazioni tipiche**: configurazione IA/app.
- **Provenance per dati mostrati**: non candidata a viste business salvo pannelli admin.
- **Note di validazione (per Giuseppe)**: verificare se contiene segreti o valori da escludere sempre dalla chat.

### `storage/@inventario`
- **Path Firestore**: collection `storage`, documento `@inventario`
- **Stato verifica**: BOUNDARY VERIFICATA RUNTIME (post-update allowedFields)
- **Cosa contiene**: inventario magazzino.
- **Come salva i dati**: documento storage letto da `nextInventarioDomain.ts`.
- **Campi conosciuti**: materiale, quantita', categoria, ubicazione; shape runtime non verificata.
- **AllowedFields boundary**: id, codice, nome, articolo, materiale, categoria, quantita, unita, ubicazione, stockKey, fornitore, fornitoreLabel, nomeFornitore, prezzoUnitario, quantitaTotale, stockLoadKeys, fotoStoragePath, updatedAt.
- **Campi esclusi by design**: descrizione, fotoUrl, note.
- **Nota v0.6 (2026-05-04)**: `fotoStoragePath` aggiunto per pannello prove esistenza foto; URL firmati esclusi.
- **Runtime check 2026-05-04**: campi allowed confermati: id, quantita, unita, stockKey.
- **Discrepanza runtime 2026-05-04**: campi reali non in allowedFields: descrizione, fornitore, fornitoreLabel, fotoStoragePath, fotoUrl, nomeFornitore, prezzoUnitario, quantitaTotale, stockLoadKeys; campi ipotizzati assenti: codice, nome, articolo, materiale, categoria, ubicazione, updatedAt. Raccomandazione: rivedere chiave materiale R4; mantenere fotoUrl escluso.
- **Campi-chiave**: id materiale, nome/codice materiale.
- **Nodi del grafo dati**: materiale, giacenza.
- **Archi / relazioni possibili**: materiale --[forte]--> movimento materiale via id/codice se confermato.
- **Campi che creano relazione**: id/codice materiale.
- **Operazioni tipiche**: magazzino, manutenzioni, materiali.
- **Provenance per dati mostrati**: giacenze e movimenti con source id.
- **Note di validazione (per Giuseppe)**: R4 PARZIALMENTE CHIUSA: `stockKey` e' chiave preferita quando presente. Fallback controllati per collection: `articoloCanonico`, `codiceArticolo`, `id`, `materialeLabel`. La risoluzione finale resta DA VALIDARE nel motore generico, che applichera' la priorita' degli alias in ordine.

### `storage/@lavori`
- **Path Firestore**: collection `storage`, documento `@lavori`
- **Stato verifica**: BOUNDARY VERIFICATA RUNTIME (post-update allowedFields)
- **Cosa contiene**: lavori da eseguire/in attesa/eseguiti.
- **Come salva i dati**: documento storage letto da `nextLavoriDomain.ts`.
- **Campi conosciuti**: id, stato, targa/mezzo, descrizione lavoro, date; shape runtime non verificata.
- **AllowedFields boundary**: id, targa, mezzoTarga, cantiere, cantiereId, stato, data, timestamp, dataInizio, dataFine, tipo, lavorazione, dataEsecuzione, dataInserimento, eseguito, gruppoId, sourceRecordId, sottoElementi, source, urgenza.
- **Campi esclusi by design**: chiHaEseguito, segnalatoDa, descrizione, dettagli, note, messaggio, testo.
- **Runtime check 2026-05-04**: campi allowed confermati: id, targa, tipo.
- **Discrepanza runtime 2026-05-04**: campi reali non in allowedFields: chiHaEseguito, dataEsecuzione, dataInserimento, descrizione, dettagli, eseguito, gruppoId, segnalatoDa, sottoElementi, source, urgenza; campi ipotizzati assenti: cantiere, cantiereId, data, dataInizio, dataFine, stato, timestamp, mezzoTarga, lavorazione, sourceRecordId. Raccomandazione: valutare dataEsecuzione/eseguito/urgenza come strutturati; mantenere descrizione esclusa.
- **Campi-chiave**: id lavoro, targa.
- **Nodi del grafo dati**: lavoro, mezzo, cantiere (se campo presente).
- **Archi / relazioni possibili**: mezzo --[forte]--> lavoro via targa exact; lavoro --[da_validare]--> cantiere.
- **Campi che creano relazione**: targa, cantiere se presente.
- **Operazioni tipiche**: moduli lavori, timeline mezzo.
- **Provenance per dati mostrati**: stato lavoro, targa, date, source id.
- **Note di validazione (per Giuseppe)**: testo descrizione non deve diventare fonte di relazione.

### `storage/@listino_prezzi`
- **Path Firestore**: collection `storage`, documento `@listino_prezzi`
- **Stato verifica**: BOUNDARY VERIFICATA RUNTIME (post-update allowedFields)
- **Cosa contiene**: listino prezzi procurement.
- **Come salva i dati**: documento storage usato da `nextProcurementDomain.ts` e writer preventivo manuale.
- **Campi conosciuti**: materiale, prezzo, fornitore, data; shape runtime non verificata.
- **AllowedFields boundary**: id, articoloCanonico, codiceArticolo, materiale, nome, fornitore, fornitoreId, prezzoAttuale, prezzo, prezzoUnitario, valuta, unita, updatedAt, fontePreventivoId, fonteNumeroPreventivo, fonteDataPreventivo, fonteAttuale, fornitoreNome, trend.
- **Campi esclusi by design**: note, descrizione, messaggio, testo.
- **Runtime check 2026-05-04**: campi allowed confermati: id, articoloCanonico, codiceArticolo, fornitoreId, prezzoAttuale, valuta, unita, updatedAt.
- **Discrepanza runtime 2026-05-04**: campi reali non in allowedFields: fonteAttuale, fornitoreNome, note, trend; campi ipotizzati assenti: materiale, nome, fornitore, prezzo, prezzoUnitario, fontePreventivoId, fonteNumeroPreventivo, fonteDataPreventivo. Raccomandazione: rivedere R4 su articoloCanonico/codiceArticolo e valutare fornitoreNome come label.
- **Campi-chiave**: id voce/materiale/fornitore.
- **Nodi del grafo dati**: prezzo, materiale, fornitore.
- **Archi / relazioni possibili**: fornitore --[da_validare]--> prezzo; materiale --[da_validare]--> prezzo.
- **Campi che creano relazione**: materiale/fornitore se normalizzati.
- **Operazioni tipiche**: procurement/listino.
- **Provenance per dati mostrati**: prezzo/listino, source id.
- **Note di validazione (per Giuseppe)**: VALIDATO 2026-05-04: dati economici mostrabili in chat certificata e in pannelli, nessuna policy di restrizione interna (utente unico admin del gestionale). R4 PARZIALMENTE CHIUSA: `stockKey` e' chiave preferita quando presente. Fallback controllati per collection: `articoloCanonico`, `codiceArticolo`, `id`, `materialeLabel`. La risoluzione finale resta DA VALIDARE nel motore generico, che applichera' la priorita' degli alias in ordine.

### `storage/@manutenzioni`
- **Path Firestore**: collection `storage`, documento `@manutenzioni`
- **Stato verifica**: BOUNDARY VERIFICATA RUNTIME (post-update allowedFields)
- **Cosa contiene**: manutenzioni e interventi tecnici.
- **Come salva i dati**: documento storage letto da `nextManutenzioniDomain.ts`.
- **Campi conosciuti**: id, targa, data, lavorazioni, materiali, stato; shape runtime non verificata.
- **AllowedFields boundary**: id, targa, mezzoTarga, data, timestamp, tipo, stato, lavorazioni, materiali, km, sourceDocumentId, sourceRecordId, officinaId, officina, eseguito, fornitore, importo, ore, sottotipo.
- **Campi esclusi by design**: descrizione, note, messaggio, testo.
- **Runtime check 2026-05-04**: campi allowed confermati: id, targa, data, tipo, materiali, km.
- **Discrepanza runtime 2026-05-04**: campi reali non in allowedFields: descrizione, eseguito, fornitore, importo, ore, sottotipo; campi ipotizzati assenti: stato, timestamp, lavorazioni, sourceDocumentId, sourceRecordId, officinaId, officina. Raccomandazione: valutare eseguito/importo/fornitore come strutturati se richiesti; mantenere descrizione esclusa.
- **Campi-chiave**: id manutenzione, targa.
- **Nodi del grafo dati**: manutenzione, mezzo, materiale.
- **Archi / relazioni possibili**: mezzo --[forte]--> manutenzione via targa exact; manutenzione --[da_validare]--> materiale.
- **Campi che creano relazione**: targa, voci materiali.
- **Operazioni tipiche**: manutenzioni, dossier, timeline.
- **Provenance per dati mostrati**: interventi, date, targa, source id.
- **Note di validazione (per Giuseppe)**: note libere non devono certificare relazioni.

### `storage/@materialiconsegnati`
- **Path Firestore**: collection `storage`, documento `@materialiconsegnati`
- **Stato verifica**: BOUNDARY VERIFICATA RUNTIME (post-update allowedFields)
- **Cosa contiene**: movimenti materiali consegnati.
- **Come salva i dati**: documento storage letto da `nextMaterialiMovimentiDomain.ts`.
- **Campi conosciuti**: materiale, quantita', targa/mezzo o lavoro; shape runtime non verificata.
- **AllowedFields boundary**: id, materiale, codice, nome, quantita, unita, targa, mezzoTarga, lavoroId, destinatario, timestamp, data, cantiere, cantiereId, sourceRecordId, direzione, fornitore, fornitoreLabel, inventarioRefId, materialeLabel, motivo, origine, stockKey, target, tipo.
- **Campi esclusi by design**: descrizione, note, messaggio, testo.
- **Runtime check 2026-05-04**: campi allowed confermati: id, materiale, quantita, unita, destinatario, data.
- **Discrepanza runtime 2026-05-04**: campi reali non in allowedFields: descrizione, direzione, fornitore, fornitoreLabel, inventarioRefId, materialeLabel, motivo, origine, stockKey, target, tipo; campi ipotizzati assenti: codice, nome, targa, mezzoTarga, lavoroId, cantiere, cantiereId, sourceRecordId, timestamp. Raccomandazione: rivedere R4; valutare stockKey/materialeLabel come chiavi/label strutturate.
- **Campi-chiave**: id movimento, materiale.
- **Nodi del grafo dati**: movimento_materiale, materiale, mezzo/lavoro.
- **Archi / relazioni possibili**: movimento --[da_validare]--> mezzo/lavoro.
- **Campi che creano relazione**: targa/id lavoro se presenti.
- **Operazioni tipiche**: magazzino, manutenzioni.
- **Provenance per dati mostrati**: materiale, quantita', source id.
- **Note di validazione (per Giuseppe)**: R4 PARZIALMENTE CHIUSA: `stockKey` e' chiave preferita quando presente. Fallback controllati per collection: `articoloCanonico`, `codiceArticolo`, `id`, `materialeLabel`. La risoluzione finale resta DA VALIDARE nel motore generico, che applichera' la priorita' degli alias in ordine. Confermare campo che collega consegna a mezzo o lavoro.

### `storage/@mezzi_foto_viste`
- **Path Firestore**: collection `storage`, documento `@mezzi_foto_viste`
- **Stato verifica**: BOUNDARY OPEN — RUNTIME VUOTO — VERIFICATO BY REFERENCE
- **Cosa contiene**: foto viste dei mezzi.
- **Come salva i dati**: documento storage letto da `toolVehicleEnrichment.ts` e mappa storico.
- **Campi conosciuti**: targa, foto/viste, path; shape runtime non verificata.
- **AllowedFields boundary**: id, targa, categoria, vista, storagePath, fotoStoragePath, path, sourceRecordId, updatedAt.
- **Runtime check 2026-05-04**: documento esiste con contenitore value ma 0 record campionabili. Runtime check non possibile in questo turno.
- **Campi-chiave**: targa, path foto.
- **Nodi del grafo dati**: mezzo, foto.
- **Archi / relazioni possibili**: mezzo --[forte]--> foto via targa/path.
- **Campi che creano relazione**: targa, storage path.
- **Operazioni tipiche**: enrichment mezzo, dossier visuale.
- **Provenance per dati mostrati**: path foto e source id.
- **Note di validazione (per Giuseppe)**: verificare se mostrare foto richiede policy separata.

### `storage/@mezzi_hotspot_mapping`
- **Path Firestore**: collection `storage`, documento `@mezzi_hotspot_mapping`
- **Stato verifica**: BOUNDARY OPEN — RUNTIME VUOTO — VERIFICATO BY REFERENCE
- **Cosa contiene**: mapping hotspot su foto mezzo.
- **Come salva i dati**: documento storage letto da `toolVehicleEnrichment.ts`.
- **Campi conosciuti**: targa/categoria, area hotspot, mapping; shape runtime non verificata.
- **AllowedFields boundary**: id, targa, categoria, hotspotId, area, asse, posizione, sourceRecordId, updatedAt.
- **Runtime check 2026-05-04**: documento esiste con contenitore value ma 0 record campionabili. Runtime check non possibile in questo turno.
- **Campi-chiave**: targa o categoria, id hotspot.
- **Nodi del grafo dati**: mezzo, hotspot.
- **Archi / relazioni possibili**: mezzo --[da_validare]--> hotspot.
- **Campi che creano relazione**: targa/categoria.
- **Operazioni tipiche**: arricchimento dossier mezzo.
- **Provenance per dati mostrati**: hotspot, area, source id.
- **Note di validazione (per Giuseppe)**: confermare se mapping e' per targa o per categoria.

### `storage/@officine`
- **Path Firestore**: collection `storage`, documento `@officine`
- **Stato verifica**: BOUNDARY VERIFICATA RUNTIME (post-update allowedFields)
- **Cosa contiene**: anagrafica officine.
- **Come salva i dati**: documento storage letto da `nextOfficineDomain.ts` e tool `list_workshops`.
- **Campi conosciuti**: nome, citta, telefono; shape runtime non verificata.
- **AllowedFields boundary**: id, nome, ragioneSociale, officina, label, citta.
- **Campi esclusi by design**: telefono, telefoniAggiuntivi, email privata, indirizzo privato, descrizione.
- **Runtime check 2026-05-04**: campi allowed confermati: id, nome, citta.
- **Discrepanza runtime 2026-05-04**: campi reali non in allowedFields: telefono, telefoniAggiuntivi; campi ipotizzati assenti: ragioneSociale, officina, label. Raccomandazione: mantenere telefoni esclusi dal boundary Zero-Invenzioni.
- **Campi-chiave**: id, nome.
- **Nodi del grafo dati**: officina.
- **Archi / relazioni possibili**: officina --[da_validare]--> manutenzione/collaudo.
- **Campi che creano relazione**: id/nome officina se presente su interventi.
- **Operazioni tipiche**: scadenze collaudi, manutenzioni.
- **Provenance per dati mostrati**: nome officina; dati contatto solo con policy.
- **Note di validazione (per Giuseppe)**: dati di contatto da trattare come sensibili.

### `storage/@ordini`
- **Path Firestore**: collection `storage`, documento `@ordini`
- **Stato verifica**: BOUNDARY VERIFICATA RUNTIME (post-update allowedFields)
- **Cosa contiene**: ordini procurement/materiali.
- **Come salva i dati**: documento storage letto/scritto da procurement e magazzino.
- **Campi conosciuti**: id ordine, righe, fornitore, stato, date; shape runtime non verificata.
- **AllowedFields boundary**: id, supplierId, idFornitore, fornitoreId, fornitore, nomeFornitore, supplierName, orderDate, data, dataOrdine, timestamp, stato, state, materiali, righe, items, voci, orderReference, numeroOrdine, totalRows, arrivedRows, pendingRows, arrivato, updatedAt.
- **Campi esclusi by design**: note, descrizione, messaggio, testo, telefono privato, email privata.
- **Runtime check 2026-05-04**: campi allowed confermati: id, dataOrdine, materiali, nomeFornitore. Righe materiali annidate osservate con id, descrizione, quantita, unita, arrivato.
- **Discrepanza runtime 2026-05-04**: campi reali non in allowedFields: arrivato, idFornitore; campi ipotizzati assenti: supplierId, fornitoreId, fornitore, supplierName, stato/state, righe/items/voci e campi conteggio. Raccomandazione: rivedere R4/R5; valutare idFornitore e arrivato come strutturati.
- **Campi-chiave**: id ordine, fornitore/materiale.
- **Nodi del grafo dati**: ordine, fornitore, materiale.
- **Archi / relazioni possibili**: fornitore --[da_validare]--> ordine; ordine --[da_validare]--> materiale.
- **Campi che creano relazione**: id fornitore/nome, voci ordine.
- **Operazioni tipiche**: Materiali da ordinare, Acquisti, magazzino.
- **Provenance per dati mostrati**: stato ordine, righe, source id.
- **Note di validazione (per Giuseppe)**: R4 PARZIALMENTE CHIUSA: `stockKey` e' chiave preferita quando presente. Fallback controllati per collection: `articoloCanonico`, `codiceArticolo`, `id`, `materialeLabel`. La risoluzione finale resta DA VALIDARE nel motore generico, che applichera' la priorita' degli alias in ordine. R5 PARZIALMENTE CHIUSA: preferire `id`, `idFornitore`, `fornitoreId`, `supplierId` quando presenti come chiave forte. I nomi (`nome`, `fornitoreNome`, `nomeFornitore`, `supplierName`) si usano solo per ricerca e disambiguazione, NON come relazione forte. Il motore generico deve sempre tentare prima la chiave forte, e usare il nome solo come fallback informativo.

### `storage/@preventivi`
- **Path Firestore**: collection `storage`, documento `@preventivi`
- **Stato verifica**: BOUNDARY VERIFICATA RUNTIME (post-update allowedFields)
- **Cosa contiene**: preventivi manuali e IA.
- **Come salva i dati**: documento storage usato da procurement e Archivista.
- **Campi conosciuti**: id, fornitore, righe, ambitoPreventivo, documento; shape runtime non verificata.
- **AllowedFields boundary**: id, supplierId, fornitoreId, fornitore, nomeFornitore, supplierName, numeroPreventivo, dataPreventivo, data, timestamp, ambitoPreventivo, famigliaArchivista, righe, voci, rows, totalAmount, totale, valuta, currency, approvalStatus, ricevutoDaWhatsapp, ricevutoDaEmail, pdfStoragePath, imageStoragePaths, storagePath, createdAt, fornitoreNome, updatedAt.
- **Campi esclusi by design**: imageUrls, pdfUrl, url firmati, note, descrizione, messaggio, testo.
- **Runtime check 2026-05-04**: campi allowed confermati: id, fornitoreId, numeroPreventivo, dataPreventivo, righe, ricevutoDaWhatsapp, pdfStoragePath, imageStoragePaths. Righe annidate osservate con id, descrizione, prezzoUnitario, unita, note.
- **Discrepanza runtime 2026-05-04**: campi reali non in allowedFields: createdAt, fornitoreNome, imageUrls, pdfUrl, updatedAt; campi ipotizzati assenti: supplierId, nomeFornitore, supplierName, ambitoPreventivo, famigliaArchivista, valuta/totale, ricevutoDaEmail. Raccomandazione: mantenere imageUrls/pdfUrl esclusi; valutare fornitoreNome come label e createdAt/updatedAt come metadata.
- **Campi-chiave**: id preventivo, fornitore, ambito.
- **Nodi del grafo dati**: preventivo, fornitore, materiale/manutenzione.
- **Archi / relazioni possibili**: fornitore --[da_validare]--> preventivo; preventivo --[da_validare]--> materiale/manutenzione.
- **Campi che creano relazione**: fornitore, righe, ambitoPreventivo.
- **Operazioni tipiche**: procurement, Archivista preventivi.
- **Provenance per dati mostrati**: righe preventivo, source id, documento.
- **Note di validazione (per Giuseppe)**: VALIDATO 2026-05-04: dati economici mostrabili in chat certificata e in pannelli, nessuna policy di restrizione interna (utente unico admin del gestionale). R5 PARZIALMENTE CHIUSA: preferire `id`, `idFornitore`, `fornitoreId`, `supplierId` quando presenti come chiave forte. I nomi (`nome`, `fornitoreNome`, `nomeFornitore`, `supplierName`) si usano solo per ricerca e disambiguazione, NON come relazione forte. Il motore generico deve sempre tentare prima la chiave forte, e usare il nome solo come fallback informativo. Distinguere preventivi procurement da manutenzione.

### `storage/@preventivi_approvazioni`
- **Path Firestore**: collection `storage`, documento `@preventivi_approvazioni`
- **Stato verifica**: BOUNDARY VERIFICATA RUNTIME
- **Cosa contiene**: approvazioni preventivi.
- **Come salva i dati**: documento storage letto da capo/documenti/procurement.
- **Campi conosciuti**: preventivoId, stato approvazione, data, approvatore; shape runtime non verificata.
- **AllowedFields boundary**: id, approvalKey, targa, sourceKey, sourceDocId, status, updatedAt, timestamp, preventivoId.
- **Runtime check 2026-05-04**: campi allowed confermati: id, targa, status, updatedAt. Nessun campo extra runtime nel campione; shape compatibile con boundary.
- **Campi-chiave**: id approvazione, preventivoId.
- **Nodi del grafo dati**: approvazione, preventivo.
- **Archi / relazioni possibili**: preventivo --[forte]--> approvazione via id preventivo se confermato.
- **Campi che creano relazione**: preventivoId.
- **Operazioni tipiche**: area capo, procurement.
- **Provenance per dati mostrati**: stato approvazione, source id.
- **Note di validazione (per Giuseppe)**: approvatore puo' essere dato personale; definire policy.

### `storage/@richieste_attrezzature_autisti_tmp`
- **Path Firestore**: collection `storage`, documento `@richieste_attrezzature_autisti_tmp`
- **Stato verifica**: BOUNDARY VERIFICATA RUNTIME (post-update allowedFields)
- **Cosa contiene**: richieste attrezzature inviate da autisti.
- **Come salva i dati**: documento storage letto da inbox e home autisti.
- **Campi conosciuti**: autista/badge, richiesta, stato, timestamp; shape runtime non verificata.
- **AllowedFields boundary**: id, autistaId, badgeAutista, badge, targa, targaCamion, targaMotrice, targaRimorchio, timestamp, data, stato, tipo, categoria, ambito, target, esito, severita, tipoProblema, asse, posizione, attrezzatura, attrezzaturaId, quantita, km, litri, controlliKo, confermatoAutista, adminEdit, asseId, asseLabel, assiConCambioGomme, autista, autistaNome, categoriaMezzo, check, contesto, flagVerifica, gommeIds, letta, linkedLavoroId, marca, mezzoId, obbligatorio, posizioneGomma, problemaGomma, targetTarga, targetType.
- **Campi esclusi by design**: testo, fotoDataUrl, note, descrizione, messaggio, commento.
- **Runtime check 2026-05-04**: campi allowed confermati: id, badgeAutista, targaCamion, targaRimorchio, stato, timestamp.
- **Discrepanza runtime 2026-05-04**: campi reali non in allowedFields: autistaNome, fotoDataUrl, letta, testo; campi ipotizzati assenti: autistaId, targa/targaMotrice, tipo, categoria, quantita, attrezzatura/attrezzaturaId. Raccomandazione: mantenere testo e fotoDataUrl esclusi; valutare letta come stato strutturato.
- **Campi-chiave**: id richiesta, badge.
- **Nodi del grafo dati**: richiesta_attrezzatura, autista.
- **Archi / relazioni possibili**: autista --[da_validare]--> richiesta.
- **Campi che creano relazione**: badge/autistaId se presenti.
- **Operazioni tipiche**: inbox autisti.
- **Provenance per dati mostrati**: stato richiesta, source id.
- **Note di validazione (per Giuseppe)**: VALIDATO 2026-05-04: i record sono fonte certificata appena l'autista invia. La conferma admin/operatore e' solo marcatura aggiuntiva, non cambia lo stato di certificazione. Driver360 e viste future possono leggere questi record come dati certificati senza attendere conferma.
  Precisazione certificazione TMP (validata 2026-05-04):
  "Certificato" significa: il record e' certificato come dato inviato dall'autista tramite app.
  Non significa che ogni contenuto libero del record diventi automaticamente prova di relazione.
  - Campi STRUTTURATI usabili come fonte di relazione: badge, autistaId, targa, timestamp, stato, quantita', km, litri, e altri campi tipizzati esplicitamente.
  - Campi LIBERI NON certificano relazioni: note, descrizione, messaggio, commento, testo libero.
  Il Relation Resolver deve attingere solo ai campi strutturati per produrre relationProof. I campi liberi possono essere mostrati come testo informativo, mai come prova.

#### Sessione 2026-05-09 — Campi soft-delete aggiunti
- `evasa`: boolean (default false). Set a `true` da `markRichiestaEvasa` chiamato dal Centro Controllo.
- `dataEvasione`: number (ms) | null. Timestamp scrittura quando `evasa === true`.
- `evasa_by`: string | null. Valore convenzionale: `"centro_controllo_next"`.
- Filtro applicato in Sinottica V2: chip "Richieste attrez." esclude record con `evasa === true`.

### `storage/@rifornimenti`
- **Path Firestore**: collection `storage`, documento `@rifornimenti`
- **Stato verifica**: BOUNDARY VERIFICATA RUNTIME (post-update allowedFields)
- **Cosa contiene**: rifornimenti business/dossier.
- **Come salva i dati**: documento storage letto da rifornimenti, mappa storico e admin autisti.
- **Campi conosciuti**: targa, data, litri, km, costo/importo; shape runtime non verificata.
- **AllowedFields boundary**: id, targa, mezzoTarga, targaMotrice, autistaId, badgeAutista, data, timestamp, litri, km, costo, distributore, sourceRecordId.
- **Campi esclusi by design**: fornitore, importo, note, descrizione, messaggio, testo.
- **Runtime check 2026-05-04**: campi allowed confermati: id, mezzoTarga, data, litri.
- **Discrepanza runtime 2026-05-04**: campi reali non in allowedFields: costo, distributore; campi ipotizzati assenti: targa, targaMotrice, autistaId, badgeAutista, timestamp, km, sourceRecordId. Esito v0.5: `costo` e `distributore` inclusi come campi strutturati mostrabili; usare `mezzoTarga` come chiave mezzo.
- **Campi-chiave**: id rifornimento, targa, data.
- **Nodi del grafo dati**: rifornimento, mezzo.
- **Archi / relazioni possibili**: mezzo --[forte]--> rifornimento via targa exact se campo presente.
- **Campi che creano relazione**: targa.
- **Operazioni tipiche**: dossier rifornimenti, consumi.
- **Provenance per dati mostrati**: targa, data, litri, km, source id.
- **Note di validazione (per Giuseppe)**: costi/importi richiedono policy di visibilita'.

### `storage/@segnalazioni_autisti_tmp`
- **Path Firestore**: collection `storage`, documento `@segnalazioni_autisti_tmp`
- **Stato verifica**: BOUNDARY VERIFICATA RUNTIME (post-update allowedFields)
- **Cosa contiene**: segnalazioni inviate da autisti.
- **Come salva i dati**: documento storage letto da inbox, centro controllo e dominio segnalazioni.
- **Campi conosciuti**: autista/badge, targa, testo segnalazione, stato, timestamp; shape runtime non verificata.
- **AllowedFields boundary**: id, autistaId, badgeAutista, badge, targa, targaCamion, targaMotrice, targaRimorchio, timestamp, data, stato, tipo, categoria, ambito, target, esito, severita, tipoProblema, asse, posizione, attrezzatura, attrezzaturaId, quantita, km, litri, controlliKo, confermatoAutista, adminEdit, asseId, asseLabel, assiConCambioGomme, autista, autistaNome, categoriaMezzo, check, contesto, flagVerifica, gommeIds, letta, linkedLavoroId, marca, mezzoId, obbligatorio, posizioneGomma, problemaGomma, targetTarga, targetType.
- **Campi esclusi by design**: descrizione, note, foto, fotoStoragePaths, fotoUrls, motivoVerifica, testo libero, messaggio.
- **Runtime check 2026-05-04**: campi allowed confermati: id, autistaId, badgeAutista, targa, targaCamion, targaRimorchio, timestamp, data, stato, ambito, target, tipoProblema.
- **Discrepanza runtime 2026-05-04**: campi reali non in allowedFields: adminEdit, autistaNome, categoriaMezzo, descrizione, flagVerifica, foto, fotoStoragePaths, fotoUrls, letta, linkedLavoroId, mezzoId, motivoVerifica, note, posizioneGomma, problemaGomma; campi ipotizzati assenti: tipo, categoria, esito, severita, quantita, km, litri. Raccomandazione: mantenere descrizione/note/fotoUrls esclusi; valutare categoriaMezzo, mezzoId, flagVerifica come strutturati.
- **Campi-chiave**: id segnalazione, badge, targa.
- **Nodi del grafo dati**: segnalazione, autista, mezzo.
- **Archi / relazioni possibili**: segnalazione --[forte]--> mezzo via targa exact se presente; autista --[da_validare]--> segnalazione.
- **Campi che creano relazione**: targa, badge.
- **Operazioni tipiche**: inbox segnalazioni, centro controllo.
- **Provenance per dati mostrati**: stato, targa, source id; testo libero non certifica relazioni.
- **Note di validazione (per Giuseppe)**: VALIDATO 2026-05-04: i record sono fonte certificata appena l'autista invia. La conferma admin/operatore e' solo marcatura aggiuntiva, non cambia lo stato di certificazione. Driver360 e viste future possono leggere questi record come dati certificati senza attendere conferma.
  Precisazione certificazione TMP (validata 2026-05-04):
  "Certificato" significa: il record e' certificato come dato inviato dall'autista tramite app.
  Non significa che ogni contenuto libero del record diventi automaticamente prova di relazione.
  - Campi STRUTTURATI usabili come fonte di relazione: badge, autistaId, targa, timestamp, stato, quantita', km, litri, e altri campi tipizzati esplicitamente.
  - Campi LIBERI NON certificano relazioni: note, descrizione, messaggio, commento, testo libero.
  Il Relation Resolver deve attingere solo ai campi strutturati per produrre relationProof. I campi liberi possono essere mostrati come testo informativo, mai come prova.

#### Sessione 2026-05-09 — Campi soft-delete aggiunti
- `chiusa`: boolean (default false). Set a `true` da `markSegnalazioneChiusa` chiamato dal Centro Controllo.
- `dataChiusura`: number (ms) | null. Timestamp scrittura quando `chiusa === true`.
- `chiusa_by`: string | null. Valore convenzionale: `"centro_controllo_next"`.
- Filtro applicato in Sinottica V2: chip segnalazione esclude record con `chiusa === true` OR `hasLinkedLavoro === true` (segnalazioni con lavoro associato dalla madre).

### `euromecc_pending`
- **Path Firestore**: collection root `euromecc_pending`
- **Stato verifica**: BOUNDARY VERIFICATA RUNTIME (post-update allowedFields)
- **Annotazione audit PROMPT 22 (2026-05-04)**: DICHIARATA — NON OPERATIVA FINO A PATCH RESOLVER. Usa accessMode `collection_root`, che il resolver runtime non consuma ancora.
- **Cosa contiene**: task pendenti Euromecc.
- **Come salva i dati**: documenti root con `areaKey`, `subKey`, `title`, `priority`, `dueDate`, `note`, timestamp.
- **Campi conosciuti**: areaKey, subKey, title, priority, dueDate, status, date create/update; shape runtime non verificata.
- **AllowedFields boundary**: id, __docId, areaKey, subKey, title, priority, dueDate, createdAt, updatedAt.
- **Campi esclusi by design**: note, descrizione, messaggio, testo, status non osservato nel campione runtime.
- **Runtime check 2026-05-04**: campi allowed confermati: id, __docId, areaKey, subKey, title, priority, dueDate, createdAt, updatedAt.
- **Discrepanza runtime 2026-05-04**: campi reali non in allowedFields: note; campi ipotizzati assenti: status. Raccomandazione: valutare se status e realmente assente oppure presente in record non campionati; mantenere note escluso.
- **Campi-chiave**: doc id, `areaKey`, `subKey`.
- **Nodi del grafo dati**: euromecc_area, task.
- **Archi / relazioni possibili**: area --[forte]--> task via `areaKey/subKey`.
- **Campi che creano relazione**: `areaKey`, `subKey`.
- **Operazioni tipiche**: pagina Euromecc.
- **Provenance per dati mostrati**: titolo task, priorita', scadenza, source id.
- **Note di validazione (per Giuseppe)**: VALIDATO 2026-05-04: appartiene al sottografo Euromecc, separato dall'Evidence Graph principale flotta. Le viste Euromecc360 useranno questo sottografo dedicato.

### `euromecc_done`
- **Path Firestore**: collection root `euromecc_done`
- **Stato verifica**: BOUNDARY VERIFICATA RUNTIME (post-update allowedFields)
- **Annotazione audit PROMPT 22 (2026-05-04)**: DICHIARATA — NON OPERATIVA FINO A PATCH RESOLVER. Usa accessMode `collection_root`, che il resolver runtime non consuma ancora.
- **Cosa contiene**: task Euromecc completati.
- **Come salva i dati**: documenti root con `areaKey`, `subKey`, `title`, `doneDate`, `by`, `note`, `nextDate`, `closedPending`.
- **Campi conosciuti**: areaKey, subKey, title, doneDate, nextDate, closedPending, date create/update; shape runtime non verificata.
- **AllowedFields boundary**: id, __docId, areaKey, subKey, title, doneDate, nextDate, closedPending, createdAt, updatedAt.
- **Campi esclusi by design**: by, note, descrizione, messaggio, testo.
- **Runtime check 2026-05-04**: campi allowed confermati: id, __docId, areaKey, subKey, title, doneDate, nextDate, closedPending, createdAt, updatedAt.
- **Discrepanza runtime 2026-05-04**: campi reali non in allowedFields: by, note; campi ipotizzati assenti: nessuno. Raccomandazione: mantenere by/note esclusi salvo decisione esplicita Euromecc360.
- **Campi-chiave**: doc id, `areaKey`, `subKey`.
- **Nodi del grafo dati**: euromecc_area, task_done.
- **Archi / relazioni possibili**: area --[forte]--> task_done via `areaKey/subKey`.
- **Campi che creano relazione**: `areaKey`, `subKey`.
- **Operazioni tipiche**: pagina Euromecc.
- **Provenance per dati mostrati**: task chiuso, data, source id.
- **Note di validazione (per Giuseppe)**: VALIDATO 2026-05-04: appartiene al sottografo Euromecc, separato dall'Evidence Graph principale flotta. Le viste Euromecc360 useranno questo sottografo dedicato.

### `euromecc_issues`
- **Path Firestore**: collection root `euromecc_issues`
- **Stato verifica**: BOUNDARY VERIFICATA RUNTIME (post-update allowedFields)
- **Annotazione audit PROMPT 22 (2026-05-04)**: DICHIARATA — NON OPERATIVA FINO A PATCH RESOLVER. Usa accessMode `collection_root`, che il resolver runtime non consuma ancora.
- **Cosa contiene**: criticita/anomalie/osservazioni Euromecc.
- **Come salva i dati**: documenti root con `areaKey`, `subKey`, `title`, `check`, `type`, `state`, `reportedAt`, `reportedBy`, `note`, `closedDate`.
- **Campi conosciuti**: areaKey, subKey, title, check, type, state, reportedAt, closedDate, date create/update; shape runtime non verificata.
- **AllowedFields boundary**: id, __docId, areaKey, subKey, title, check, type, state, reportedAt, closedDate, createdAt, updatedAt.
- **Campi esclusi by design**: note, reportedBy, descrizione, messaggio, testo.
- **Runtime check 2026-05-04**: campi allowed confermati: id, __docId, areaKey, subKey, title, check, type, state, reportedAt, closedDate, createdAt, updatedAt.
- **Discrepanza runtime 2026-05-04**: campi reali non in allowedFields: note, reportedBy; campi ipotizzati assenti: nessuno. Raccomandazione: mantenere note/reportedBy esclusi o aprirli solo con policy Euromecc360.
- **Campi-chiave**: doc id, `areaKey`, `subKey`, `state`.
- **Nodi del grafo dati**: euromecc_area, issue.
- **Archi / relazioni possibili**: area --[forte]--> issue via `areaKey/subKey`.
- **Campi che creano relazione**: `areaKey`, `subKey`.
- **Operazioni tipiche**: tool Euromecc e pagina Euromecc.
- **Provenance per dati mostrati**: stato issue, tipo, area, source id.
- **Note di validazione (per Giuseppe)**: VALIDATO 2026-05-04: appartiene al sottografo Euromecc, separato dall'Evidence Graph principale flotta. Le viste Euromecc360 useranno questo sottografo dedicato. `note` non deve certificare relazioni.

### `euromecc_area_meta`
- **Path Firestore**: collection root `euromecc_area_meta`
- **Stato verifica**: BOUNDARY OPEN — RUNTIME VUOTO — VERIFICATO BY REFERENCE
- **Annotazione audit PROMPT 22 (2026-05-04)**: DICHIARATA — NON OPERATIVA FINO A PATCH RESOLVER. Usa accessMode `collection_root`, che il resolver runtime non consuma ancora.
- **Cosa contiene**: metadata area Euromecc, tipo cemento per silo.
- **Come salva i dati**: documento per area con `areaKey`, `cementType`, `cementTypeShort`, `updatedBy`, `updatedAt`.
- **Campi conosciuti**: areaKey, cementType, cementTypeShort, updatedAt; shape runtime non verificata.
- **AllowedFields boundary**: id, __docId, areaKey, cementType, cementTypeShort, updatedAt.
- **Runtime check 2026-05-04**: boundary attivo e collection root leggibile; 0 documenti campionabili. Runtime check non possibile in questo turno.
- **Campi-chiave**: doc id / `areaKey`.
- **Nodi del grafo dati**: euromecc_area, metadata.
- **Archi / relazioni possibili**: area --[forte]--> metadata via `areaKey`.
- **Campi che creano relazione**: `areaKey`.
- **Operazioni tipiche**: pagina Euromecc.
- **Provenance per dati mostrati**: tipo cemento, source id.
- **Note di validazione (per Giuseppe)**: VALIDATO 2026-05-04: appartiene al sottografo Euromecc, separato dall'Evidence Graph principale flotta. Le viste Euromecc360 useranno questo sottografo dedicato.

### `euromecc_extra_components`
- **Path Firestore**: collection root `euromecc_extra_components`
- **Stato verifica**: BOUNDARY OPEN — RUNTIME VUOTO — VERIFICATO BY REFERENCE
- **Annotazione audit PROMPT 22 (2026-05-04)**: DICHIARATA — NON OPERATIVA FINO A PATCH RESOLVER. Usa accessMode `collection_root`, che il resolver runtime non consuma ancora.
- **Cosa contiene**: componenti extra Euromecc.
- **Come salva i dati**: documenti root letti da `toolGetEuromeccData.ts` e `NextEuromeccPage.tsx`.
- **Campi conosciuti**: id, area/sub area o record libero, date create/update; shape runtime non verificata.
- **AllowedFields boundary**: id, __docId, areaKey, subKey, title, priority, dueDate, createdAt, updatedAt, status.
- **Runtime check 2026-05-04**: boundary attivo e collection root leggibile; 0 documenti campionabili. Runtime check non possibile in questo turno.
- **Campi-chiave**: doc id, eventuale area/component key.
- **Nodi del grafo dati**: euromecc_component.
- **Archi / relazioni possibili**: componente --[da_validare]--> area Euromecc.
- **Campi che creano relazione**: area/subKey se presenti.
- **Operazioni tipiche**: pagina Euromecc, tool Euromecc.
- **Provenance per dati mostrati**: componente, source id.
- **Note di validazione (per Giuseppe)**: VALIDATO 2026-05-04: appartiene al sottografo Euromecc, separato dall'Evidence Graph principale flotta. Le viste Euromecc360 useranno questo sottografo dedicato. Shape runtime da chiudere con boundary esteso.

### `euromecc_relazioni`
- **Path Firestore**: collection root `euromecc_relazioni`
- **Stato verifica**: BOUNDARY VERIFICATA RUNTIME (post-update allowedFields)
- **Annotazione audit PROMPT 22 (2026-05-04)**: DICHIARATA — NON OPERATIVA FINO A PATCH RESOLVER. Usa accessMode `collection_root`, che il resolver runtime non consuma ancora.
- **Cosa contiene**: relazioni/report Euromecc.
- **Come salva i dati**: documenti root letti/scritti da `NextEuromeccPage.tsx`.
- **Campi conosciuti**: shape non determinabile senza boundary; codice aggiunge record relazione/storico.
- **AllowedFields boundary**: id, __docId, areaKey, subKey, relationKind, tipo, status, stato, sourceDocId, targetDocId, dataIntervento, doneCount, extraComponentsCount, fileName, fileSize, fileStoragePath, fileType, ordineId, ordineMateriali, pendingCount, statoImportazione, createdAt, updatedAt.
- **Campi esclusi by design**: fileUrl, note, tecnici, descrizione, messaggio, testo.
- **Runtime check 2026-05-04**: collection leggibile con record di report/import, non con shape relazione semplice ipotizzata.
- **Discrepanza runtime 2026-05-04**: campi reali non in allowedFields: dataIntervento, doneCount, extraComponentsCount, fileName, fileSize, fileStoragePath, fileType, fileUrl, note, ordineId, ordineMateriali, pendingCount, statoImportazione, tecnici; campi ipotizzati assenti: areaKey, subKey, relationKind, tipo, status, stato, sourceDocId, targetDocId. Raccomandazione: rivedere la voce come report/import Euromecc, non solo relation edge.
- **Campi-chiave**: doc id.
- **Nodi del grafo dati**: euromecc_report, euromecc_relation.
- **Archi / relazioni possibili**: relation --[da_validare]--> area/component.
- **Campi che creano relazione**: DA VALIDARE.
- **Operazioni tipiche**: pagina Euromecc.
- **Provenance per dati mostrati**: source id, stato relazione.
- **Note di validazione (per Giuseppe)**: VALIDATO 2026-05-04: appartiene al sottografo Euromecc, separato dall'Evidence Graph principale flotta. Le viste Euromecc360 useranno questo sottografo dedicato.

## Collection code-only aggregate

Le 33 voci precedentemente BOUNDARY OPEN sono state lette nel runtime check 2026-05-04. Esito v0.5: 1 BOUNDARY VERIFICATA RUNTIME, 22 BOUNDARY VERIFICATA RUNTIME (post-update allowedFields), 5 BOUNDARY OPEN — RUNTIME VUOTO — VERIFICATO BY REFERENCE, 5 BOUNDARY OPEN — RUNTIME PENDING — VERIFICA RINVIATA.

Le 22 ex-discrepanze sono state allineate nel boundary con allowedFields field-filtered. I campi liberi e sensibili restano esclusi by design. Le 5 collection vuote mantengono allowedFields ipotizzati e verranno riverificate al primo runtime con dati. Le 5 collection non trovate restano boundary-open ma con verifica rinviata.

VALIDATO 2026-05-04: il project owner ha richiesto estensione boundary readonly per tutte le 33 collection code-only, per chiudere shape runtime. Tecnicamente fattibile via entry `exact_document` e/o estensione strutturale del boundary. La patch boundary e' stata eseguita e gli allowedFields sono stati riallineati in v0.5 dopo runtime check. Priorita' alta perche' le 33 voci diventano la base operativa del motore generico.

Vincoli sull'estensione boundary (validati 2026-05-04):
- L'estensione boundary deve essere read-only e field-filtered.
- Non deve esporre automaticamente tutti i campi delle collection.
- Ogni collection deve avere `allowedFields` minimi necessari per l'uso Zero-Invenzioni.
- Attenzione speciale a:
  - `@impostazioni_app`
  - tutti i documenti (`@documenti_generici`, `@documenti_mezzi`, `@documenti_magazzino`)
  - `@fornitori`
  - dati personali residui in qualunque collection
  - eventuali chiavi tecniche o configurazioni
- Se una collection contiene segreti, token, configurazioni tecniche o dati personali non necessari per Zero-Invenzioni, quei campi restano esclusi anche se la collection viene aggiunta al boundary.

## Diagramma prove / Evidence Graph

### Scopo
Quando la chat mostra un dato, deve poter costruire un diagramma laterale (collassabile, non in chat) che spiega da dove arriva il dato:
- collection di origine
- record di origine
- campo di origine
- relazione che lo collega ad altri dati
- regola che lo ha certificato

### Regola UX (per fasi successive, NON implementata in questo turno)
- la risposta principale in chat resta pulita: card, tabella, timeline, stato, pulsante "Fonti"
- la spiegazione vive in un pannello tecnico laterale collassabile, possibili nomi:
  - "Perche' vedo questo dato?"
  - "Fonti"
  - "Mappa prove"
  - "Diagramma dati"
- niente prosa lunga in chat

### Pannello "Perche' vedo questo dato?" â€” obbligo di rendering

Il pannello "Perche' vedo questo dato?" e' OBBLIGATORIO per ogni relazione mostrata nelle viste certificate (Driver360, Vehicle360, Site360, Euromecc360, Ricerca360 e qualsiasi vista futura).

Caratteristiche obbligatorie:
- collassabile/nascosto di default
- la chat principale resta pulita: card, tabella, timeline, stato, pulsante "Fonti" o "Perche' vedo questo dato?"
- niente prosa lunga in chat principale

Per ogni relazione visibile, il pannello DEVE esporre:
- sourceCollection
- sourceRecordId
- sourceField
- relationProof
- rule
- confidence (certified | weak | rejected | unknown)

Se anche uno solo di questi 6 campi non e' producibile, la relazione NON puo' essere mostrata come certificata. Va degradata a "non certificata" o nascosta.

### Sottografo Euromecc

Le 6 collection `euromecc_*` formano un sottografo dedicato. Non si mescolano con autista/mezzo/cantiere del grafo flotta principale, salvo eventuali archi di consolidamento documentati in fase Euromecc360.

### Esempio costruito sul caso Sandro (gia' pubblico nel contesto)
Catena di prove per "Sandro Calabrese guida TI282780 (rimorchio)":

```text
Nodo: Sandro Calabrese (autista)
  -> arco "active_session"
Collection: storage/@autisti_sessione_attive
Record: <id_sessione>
Chiave: badgeAutista = 530
  -> campo: targaRimorchio = TI282780
  -> arco "is_trailer_of"
Nodo: TI282780 (mezzo)
Collection: storage/@mezzi_aziendali
Record: <id_mezzo>
Campo: categoria = semirimorchio asse fisso
relationProof.rule = "active_session"
confidence = certified
```

### Tabella riassuntiva nodi e archi

| Nodo | Collection di residenza | Chiave nodo | Attributi principali | Archi principali | Nota |
|---|---|---|---|---|---|
| autista | `storage/@colleghi` | `id`, `badge` | nome, badge, codice | autista -> sessione, autista -> mezzo, autista -> rifornimento | - |
| mezzo | `storage/@mezzi_aziendali` | `targa`, `id` | categoria, marca, modello, libretto | mezzo -> documento, mezzo -> manutenzione, mezzo -> rifornimento | - |
| sessione_attiva | `storage/@autisti_sessione_attive` | `badgeAutista + timestamp` | motrice, rimorchio, timestamp | sessione -> motrice, sessione -> rimorchio | fonte autoritativa corrente |
| evento_operativo | `storage/@storico_eventi_operativi` | `id` | tipo, timestamp, dopo | evento -> autista, evento -> assetto | post-evento validato |
| rifornimento | `storage/@rifornimenti_autisti_tmp` / `storage/@rifornimenti` | `id` | data, litri, km | rifornimento -> autista, rifornimento -> mezzo | TMP certificato all'invio |
| documento | `storage/@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici` | id documento | tipo, storage path, metadati | documento -> mezzo/materiale/fornitore | boundary field-filtered richiesto |
| manutenzione | `storage/@manutenzioni` | id manutenzione | targa, data, lavorazioni | manutenzione -> mezzo, manutenzione -> materiale | - |
| cantiere | `storage/@attrezzature_cantieri` | DA VALIDARE | nome/id cantiere | cantiere -> attrezzatura | - |
| fornitore | `storage/@fornitori` | id/nome | anagrafica | fornitore -> ordine/preventivo/documento | id forte preferito; nome solo ricerca/disambiguazione |
| Euromecc area | `euromecc_*` | `areaKey/subKey` | stato, task, issue | area -> task/issue/meta | sottografo separato |

| Arco | Tipo | Collection da cui nasce | Regola | Mostrabile nel diagramma prove |
|---|---|---|---|---|
| autista -> motrice | forte | `storage/@autisti_sessione_attive` | `badgeAutista + targaMotrice`, exact | si |
| autista -> rimorchio | forte | `storage/@autisti_sessione_attive` | `badgeAutista + targaRimorchio`, exact | si |
| mezzo -> autista statico | debole | `storage/@mezzi_aziendali` | `autistaId -> @colleghi.id`; fallback se sessione attiva assente o non trovata | si |
| mezzo -> documento | forte | `storage/@documenti_mezzi` | targa exact, DA VALIDARE runtime | si |
| mezzo -> manutenzione | forte | `storage/@manutenzioni` | targa exact, DA VALIDARE runtime | si |
| mezzo -> rifornimento | forte | `storage/@rifornimenti` | targa exact, DA VALIDARE runtime | si |
| autista -> rifornimento tmp | forte | `storage/@rifornimenti_autisti_tmp` | `autistaId` o `badgeAutista`, exact, certificato all'invio, da campi strutturati | si |
| evento -> assetto | forte | `storage/@storico_eventi_operativi` | `dopo.targaMotrice + dopo.targaRimorchio`, exact | si |
| fornitore -> ordine | da_validare | `storage/@ordini` | fornitore/id fornitore, runtime non verificato | si dopo conferma |
| testo libero note -> relazione | vietata | qualunque | note/descrizione/messaggio non certificano relazioni | no |
| targa simile -> match | vietata | qualunque | solo exact match | no |
| nome libero -> relazione | vietata | qualunque | nome in testo libero non certifica relazione | no |

## Collection candidate non verificate

Nessun nome ulteriore confermato da runtime: il boundary attuale non consente listing libero di `storage` e non e' stato eseguito bypass. I nomi candidati emersi solo come `forbiddenDomains` del boundary o da codice sono gia' inseriti nell'inventario se citati dal repo. Per scoprire collection non citate dal codice serve estensione boundary readonly di tipo listing/probe metadata approvata da Giuseppe.

## Collection escluse / deprecate

- Chiavi `@next_clone:*`, `@next_clone_autisti:*`, `@autista_attivo_local`, `@mezzo_attivo_autista_local`, `@autista_revoca_local`: escluse dal registro Firestore perche' sono chiavi locali/clone o namespace localStorage, non collection business Firestore da usare come fonte certificata.
- `storage/@wheelGeom_override_v1`: VALIDATO 2026-05-04: NON e' una collection Firestore. E' una chiave localStorage. Esclusa dal registro Firestore. Mantenuta qui solo come traccia storica per evitare confusione futura.

## Roadmap residua registro

1. Estendere `backend/internal-ai/server/lib/post-llm-resolver.js` per consumare entry boundary con accessMode `collection_root`. Solo dopo questa patch runtime, aggiungere al boundary le 6 entry root collection (`@documenti_*` x3, Cisterna x3) usando `collection_root`. Prerequisito per il motore generico v1.
   - AGGIORNAMENTO 2026-05-04 dopo audit PROMPT 24a — Il punto sopra e' superato. Evidenza: `post-llm-resolver.js:73-80, 126-132, 147-155, 270-279` e' resolver Driver360-specifico, non generico. La shape `resolvedFilters` non e' progettata per risultati multi-record. La patch `collection_root` non e' applicabile in isolamento: viene assorbita nella spec del motore generico v1, dove confluiranno Resolver multi-vista, shape collettore multi-record e attivazione delle 6 entry boundary root collection (`@documenti_*` x3, Cisterna x3) e delle 6 entry Euromecc oggi dormienti.
2. CHIUSO 2026-05-06: registro promosso a v1.0 STABLE dopo chiusura matrice Chat IA NEXT, root documentali allineate, C6/C7 PASS, T1..T28 PASS e Playwright 17-21 PASS.

## Lacune di scrittura aperte

- **Audit PROMPT 22 (2026-05-04)**: `src/pages/IA/IADocumenti.tsx:537` salva root `@documenti_*` con `fileUrl` invece di `fileStoragePath`. Lacuna del codice madre, NON del boundary. Da rivalutare in fase pulizia.
- **Audit PROMPT 22 (2026-05-04)**: `src/next/internal-ai/ArchivistaArchiveClient.ts:502` persiste correttamente `fileStoragePath`. Due flussi scrivono nella stessa root documentale con shape diverse.
- **Audit PROMPT 22 (2026-05-04)**: `@cisterna_schede_ia` non persiste path tecnico crop; `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1864-1884` persiste solo `fileUrl`. Da risolvere in fase pulizia prima di usare il file come prova tecnica.

## Domande aperte per Giuseppe

1. Domanda 1 chiusa: `@autisti_sessione_attive` e' fonte autoritativa corrente per motrice/rimorchio attivi.
2. R2 PARZIALMENTE CHIUSA: `categoria` e' usabile come campo principale osservato (12 valori enum reali). Il campo `tipo` resta alias/seconda fonte da indagare nel motore generico. Il motore deve leggere i valori enum live da Firestore, non hardcodarli.
3. Domanda 3 chiusa: `@storico_eventi_operativi.dopo` contiene `targaMotrice` e `targaRimorchio` post-evento.
4. R4 PARZIALMENTE CHIUSA: `stockKey` e' chiave preferita quando presente. Fallback controllati per collection: `articoloCanonico`, `codiceArticolo`, `id`, `materialeLabel`. La risoluzione finale resta DA VALIDARE nel motore generico, che applichera' la priorita' degli alias in ordine.
5. R5 PARZIALMENTE CHIUSA: preferire `id`, `idFornitore`, `fornitoreId`, `supplierId` quando presenti come chiave forte. I nomi (`nome`, `fornitoreNome`, `nomeFornitore`, `supplierName`) si usano solo per ricerca e disambiguazione, NON come relazione forte. Il motore generico deve sempre tentare prima la chiave forte, e usare il nome solo come fallback informativo.
6. Domanda 6 chiusa: dati economici sempre mostrabili in chat certificata e pannelli per utente unico admin.
7. Domanda 7 chiusa: Euromecc e' sottografo separato.
8. Domanda 8 chiusa: estensione boundary autorizzata per tutte le 33 collection, con vincoli read-only + field-filtered. Boundary esteso e allowedFields riallineati in v0.5.
9. Domanda 9 chiusa: `@wheelGeom_override_v1` e' localStorage, non Firestore.
10. Domanda 10 chiusa: collection autisti tmp certificate all'invio, con distinzione obbligatoria tra campi strutturati e campi liberi.

Domande residue operative:
- R2: verificare nel motore generico come usare `tipo` accanto a `categoria` senza hardcodare enum.
- R4: validare nel motore generico l'ordine di priorita' `stockKey` -> `articoloCanonico` -> `codiceArticolo` -> `id` -> `materialeLabel`.
- R5: validare nel motore generico la priorita' id forti (`id`, `idFornitore`, `fornitoreId`, `supplierId`) e l'uso dei nomi solo per ricerca/disambiguazione.

## Scope barrier write (sessione 2026-05-09→11)

Pattern: ogni scope autorizza scritture su un set ristretto di storage keys da un pathname specifico. Implementazione in `src/utils/cloneWriteBarrier.ts` con counter scoped (`runWithCloneWriteScopedAllowance`) + branch `isAllowedCloneWriteException` per ogni scope.

### RICHIESTE_WRITE_SCOPE
- Path autorizzato: `/next/centro-controllo`
- Storage keys: `@richieste_attrezzature_autisti_tmp`
- Operazioni: `markRichiestaEvasa(id)`
- Writer: `src/next/nextRichiesteAttrezzatureWriter.ts`

### SEGNALAZIONI_WRITE_SCOPE
- Path autorizzato: `/next/centro-controllo`
- Storage keys: `@segnalazioni_autisti_tmp`
- Operazioni: `markSegnalazioneChiusa(id)`
- Writer: `src/next/nextSegnalazioniWriter.ts`

### CONTROLLI_WRITE_SCOPE
- Path autorizzato: `/next/centro-controllo`
- Storage keys: `@controlli_mezzo_autisti`
- Operazioni: `markControlloChiuso(id)`
- Writer: `src/next/nextControlliWriter.ts`

### DELETE_MEZZO_WRITE_SCOPE
- Path autorizzato: `/next/centro-controllo`
- Storage keys: 11 dataset (anagrafica + tutti i collegati per cascata): `@mezzi_aziendali`, `@rifornimenti`, `@rifornimenti_autisti_tmp`, `@manutenzioni`, `@lavori`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@richieste_attrezzature_autisti_tmp`, `@cambi_gomme_autisti_tmp`, `@gomme_eventi`, `@autisti_sessione_attive`.
- Operazioni: `hardDeleteMezzo(targa, mezzoId)`
- Writer: `src/next/nextMezzoHardDeleteWriter.ts`
- ATTENZIONE: IRREVERSIBILE. Doppia conferma UI (Shift+click foto mezzo + scrittura targa esatta).

### INTERNAL_AI_MAGAZZINO_INLINE_SCOPE (esteso 2026-05-09)
- Path autorizzato originale: `/next/dossier-mezzo/*`
- Path esteso 2026-05-09: + `/next/centro-controllo` (con `pathname.includes("/next/centro-controllo")`)
- Motivo estensione: click cella Contratto manut. in Sinottica V2 apre `NextMezzoEditModal` da Centro Controllo, che scrive `@mezzi_aziendali` (incluso nuovo campo `manutenzioneContrattoAttivo`).
- Storage keys: `@mezzi_aziendali`, `@inventario` (separati per scope-branch).

### Pattern difensivo (2026-05-11 — post-PROMPT 27.10)
Tutti i writer dei 3 scope soft-delete (segnalazioni/controlli/richieste) chiamano esplicitamente `assertCloneWriteAllowed("storageSync.setItemSync", { key })` DENTRO `runWithCloneWriteScopedAllowance` PRIMA di `setItemSync`. Pattern:
- Se barrier blocca → throw `CloneWriteBlockedError` immediato (no silent swallow di `storageSync.ts`).
- Catch nel writer ritorna `{ ok: false, error: "Scrittura bloccata dal barrier clone (segnalazioni|controlli|richieste). Verificare che la pagina sia /next/centro-controllo." }`.
- Toast visibile all'utente invece di silent failure.

Inoltre `normalizePathname` strip trailing slash per matching robusto (`/next/centro-controllo` e `/next/centro-controllo/` matchano entrambi).

