# HANDOFF UI GOMME NEXT - 2026-06-08

Documento autosufficiente per una nuova chat dedicata al ridisegno della UI di visualizzazione e gestione cambio gomme in NEXT.

Perimetro di costruzione: sola lettura su codice e dati Firestore. Scrittura repo: solo questo documento.

Fonti di riferimento da leggere prima della patch UI:

- `docs/REPORT_GOMME_MARCATORE_2026-06-07.md`
- `docs/ESITO_GOMME_D1_2026-06-07.md`
- `docs/CONFRONTO_GOMME_TOTALE_2026-06-07.md`
- `docs/ESITO_GOMME_STEP2TER_2026-06-07.md`
- `docs/PROPOSTA_TAPPO_GOMME_2026-06-08.md`

Commit operativi gia presenti:

- `57ec90e9 feat(gomme): marker strutturato alla creazione da sorgenti gomme NEXT (1a)`
- `ba951c43 fix(gomme): guardia anti-doppio-submit eventi (3a)`

## 1. SCOPO E STATO

Scopo: rifare la UI NEXT del cambio gomme, cioe' la parte che Giuseppe usa per vedere, distinguere, completare, importare e gestire gli interventi gomme. La nuova UI deve diventare la superficie primaria in NEXT e non deve dipendere dai percorsi madre in dismissione.

Stato dati attuale, verificato il 2026-06-08 con lettura Firestore diretta `storage/<key>`:

| Key | Esiste | Record totali | Note gomme |
| --- | --- | ---: | --- |
| `@manutenzioni` | si | 84 | 16 record con marcatore gomme strutturato fisico |
| `@cambi_gomme_autisti_tmp` | si | 8 | eventi gomme app autisti, tmp/operativi |
| `@gomme_eventi` | si | 11 | eventi gomme ufficializzati |
| `@lavori` | si | 18 | sorgenti operative correlate; non e' storico gomme ufficiale |
| `@segnalazioni_autisti_tmp` | si | 46 | segnalazioni sorgente, comprese gomme |
| `@controlli_mezzo_autisti` | si | 403 | controlli sorgente, compresi KO gomme |
| `@storico_eventi_operativi` | si | 416 | storico operativo; nessun marker gomme strutturato |

Stato storico ufficiale: lo storico gomme in `@manutenzioni` e' sanato rispetto alla bonifica D1. Oggi ci sono 16 record con marker strutturato fisico. La composizione storica e': record nativi gia strutturati, record riparati additivamente nel ramo gomme, piu' l'import finale dell'evento TI282780 del 26/05/2026 (`from-gomme-evento-71f003d9-59b4-4ce5-9301-852723bfa937`).

Key eventi: i record test cancellati nello step finale non sono piu presenti. Nota reale: `@gomme_eventi` contiene ancora duplicati same-id storici non-test (`4cc2fbf7-9395-4b99-b4d1-419199a63d1c` x2, `47d777a1-3de8-4ad7-9260-487bc9425bf4` x3). La guardia `ba951c43` impedisce nuovi duplicati, non bonifica duplicati gia presenti.

## 2. MODELLO DATI REALE DEL RAMO GOMME

### 2.1 Marker strutturato persistito in `@manutenzioni`

Fonti codice:

- `src/next/domain/nextManutenzioniDomain.ts:198-220`
- `src/next/domain/nextManutenzioniDomain.ts:294-372`
- `src/next/domain/nextManutenzioniDomain.ts:1037-1123`
- `src/next/domain/nextManutenzioniGommeDomain.ts:52-57`
- `src/next/domain/nextManutenzioniGommeDomain.ts:120-137`

Campi esatti:

| Campo | Tipo reale | Valori ammessi | Obbligo tecnico | Quando viene scritto | Esempio reale |
| --- | --- | --- | --- | --- | --- |
| `gommeInterventoTipo` | string | `ordinario`, `straordinario` | opzionale nel record raw; quando presente decide il ramo | `NextManutenzioniPage` quando UI subtype gomme; `saveNextManutenzioneBusinessRecord` lo sanitizza | TI84822 `1768493626667`: `ordinario`; TI178456 `1772635641628`: `straordinario` |
| `assiCoinvolti` | array string | `anteriore`, `posteriore`, `asse1`, `asse2`, `asse3` | opzionale; usato per ordinario | scritto solo se `gommeInterventoTipo === "ordinario"` e lista non vuota | TI84822 `1768493626667`: `["asse1","asse2","asse3"]` |
| `gommePerAsse` | array oggetti | ogni oggetto `{ asseId, dataCambio, kmCambio }` | opzionale; per ordinario e stato per asse | scritto se array non vuoto; se ordinario e mancano dettagli ma ci sono assi, il writer puo generare `{asseId,data,km}` | TI298409 `1778587360877`: `[{asseId:"posteriore",dataCambio:"2026-05-12",kmCambio:383482}]` |
| `gommePerAsse[].asseId` | string | stessi assi ammessi | obbligatorio per tenere l'entry; entry senza asse viene scartata dal sanitizer | da UI ordinaria o riparazione dati | TI285195 `1777979571388`: `asse1` |
| `gommePerAsse[].dataCambio` | string/null | testo data normalizzato o fallback `data` | opzionale; fallback a `data` se assente | `sanitizeGommePerAsse` usa fallback data record | TI280132 `from-lavoro-daade4a2-c681-46d0-99d4-1906d151116d`: `2026-05-20` |
| `gommePerAsse[].kmCambio` | number/null | numero finito o null | opzionale nel dato; obbligatorio in certe UI di completamento per mezzi motorizzati | da UI ordinaria o fallback `km` record | TI298409 `1778587360877`: `383482`; TI280132: `null` |
| `gommeStraordinario` | oggetto | `{ asseId, quantita, motivo }` | opzionale; il sanitizer lo scarta solo se tutti e tre i campi sono vuoti | scritto quando UI subtype straordinario o da tappo sorgenti gomme | TI178456 `1772635641628`: `{asseId:"asse1",quantita:1,motivo:"foratura"}` |
| `gommeStraordinario.asseId` | string/null | `anteriore`, `posteriore`, `asse1`, `asse2`, `asse3`, oppure null | opzionale | da UI straordinaria, bonifica o tappo 1a | TI282780 `from-gomme-evento-71f003d9-59b4-4ce5-9301-852723bfa937`: `asse3` |
| `gommeStraordinario.quantita` | number/null | numero o null | opzionale | da UI/bonifica quando il testo dice quante gomme | TI178456: `1`; TI282780 import finale: assente/null |
| `gommeStraordinario.motivo` | string/null | testo libero normalizzato | opzionale nel sanitizer; obbligatorio nella UI per nuovo straordinario non-completion | da UI straordinaria, bonifica o tappo 1a | TI282780: `sostituzione valvola lato sx` |

Regole di sanitizzazione:

- Assi validi: `anteriore`, `posteriore`, `asse1`, `asse2`, `asse3` (`nextManutenzioniDomain.ts:198-220`).
- `gommeInterventoTipo` accetta solo `ordinario` o `straordinario` (`nextManutenzioniDomain.ts:331-337`).
- Se `gommeStraordinario` e' presente, il reader/writer risolve il tipo come `straordinario` (`nextManutenzioniDomain.ts:360-372`).
- Se `gommePerAsse` o `assiCoinvolti` sono presenti, il tipo viene risolto come `ordinario` (`nextManutenzioniDomain.ts:360-372`).
- In `sanitizeBusinessRecord`, `gommeStraordinario` viene persistito solo se il tipo risolto e' `straordinario`; `assiCoinvolti` solo se il tipo e' `ordinario`; `gommePerAsse` se non vuoto (`nextManutenzioniDomain.ts:1118-1121`).

### 2.2 Campi descrittivi liberi della manutenzione

Questi campi non sono il marker gomme, ma alimentano UI, fallback e ricerca:

| Campo | Tipo reale | Uso | Esempio reale |
| --- | --- | --- | --- |
| `targa` | string | mezzo/rimorchio su cui ricondurre il record | TI84822, TI282780 |
| `data` | string | data intervento/storico | TI84822 `2026-01-15`; TI282780 `2026-05-26` |
| `dataEsecuzione` | string/null | data esecuzione quando presente | TI282780 `2026-05-26` |
| `stato` | string | `daFare`, `programmata`, `eseguita`, ecc. | TI282780 `eseguita` |
| `descrizione` | string | testo libero; spesso contiene marca/asse/km nei record legacy | TI298409: `CAMBIO GOMME... marca: Kumho... km mezzo: 383482` |
| `km` | number/null | km generale manutenzione | TI298409 `383482`; TI282780 import: campo km non scritto |
| `fornitore` | string/null | officina/gommista se presente | TI280132 `VALTELLINA PNEUMATICI` |
| `segnalatoDa` | string/null | autore/sorgente quando presente | TI282780 `SANDRO CALABRESE` |

Nota importante: `marca` NON e' un campo del marker strutturato `@manutenzioni`. Nello storico ufficiale oggi vive spesso dentro `descrizione`; negli eventi app autisti vive come campo strutturato esterno `marca`.

### 2.3 Read model Dossier Gomme

Fonte codice: `src/next/domain/nextManutenzioniGommeDomain.ts:120-137`, `src/next/domain/nextManutenzioniGommeDomain.ts:1321-1405`.

Il Dossier costruisce `NextGommeReadOnlyItem` unificando storico manutenzioni ed eventi esterni. Campi utili per UI:

- `data`, `dataLabel`, `timestamp`
- `descrizione`, `evento`, `modalita`
- `posizione`, `asseLabel`
- `quantita`, `pezzi`
- `marca`
- `km`
- `fornitore`
- `sourceDataset`, `sourceRecordId`, `sourceMaintenanceId`, `sourceOrigin`
- `badgeAutista`, `autistaNome`
- `statoEvento`
- `flags`

Esempio reale da `@cambi_gomme_autisti_tmp`: id `71f003d9-59b4-4ce5-9301-852723bfa937`, targa `TI282780`, `targetType="rimorchio"`, `categoria="semirimorchio asse fisso"`, `km=1234`, `tipo="riparazione"`, `gommeIds=["SOSTITUZIONE VALVOLA LATO SX 3 ASSE"]`, `asseId="asse3"`, `asseLabel="3° asse"`, autista `SANDRO CALABRESE`, `stato="importato"`.

Esempio reale da `@gomme_eventi`: id `33a01806-0190-4f7d-8116-f1b983d3d56e`, `targetTarga="TI81027"`, `targetType="rimorchio"`, `marca="Kumho"`, `tipo="sostituzione"`, `gommeIds` con due elementi, `asseId="asse1"`, `asseLabel="1° asse"`.

## 3. DOVE VIVONO I DATI GOMME

### `@manutenzioni`

Ruolo: storico ufficiale manutenzioni. E' la fonte da cui deve nascere lo storico gomme definitivo.

Shape: array in `storage/@manutenzioni`. Ogni record e' una manutenzione generica con eventuale marker gomme (`gommeInterventoTipo`, `assiCoinvolti`, `gommePerAsse`, `gommeStraordinario`).

Chi scrive oggi:

- `NextManutenzioniPage` passa marker strutturato quando la UI e' gomme (`src/next/NextManutenzioniPage.tsx:2540-2570`).
- `saveNextManutenzioneBusinessRecord` sanitizza e persiste (`src/next/domain/nextManutenzioniDomain.ts:1037-1123`).
- `nextManutenzioneDaFareCreateWriter` crea `daFare` da sorgenti e dal commit `57ec90e9` puo aggiungere marker parziale da sorgenti gomme (`src/next/writers/nextManutenzioneDaFareCreateWriter.ts:143-184`, `221-254`, `411-423`, `483-493`).

Chi legge oggi:

- storico/manutenzioni NEXT;
- Dossier Gomme via `readNextMezzoManutenzioniGommeSnapshot`;
- Dossier Mezzo aggregato;
- Mappa storico.

### `@cambi_gomme_autisti_tmp`

Ruolo: eventi gomme inseriti dall'app autisti prima/durante la lavorazione admin. Sono eventi applicativi, non storico manutenzioni ufficiale.

Shape reale da writer app autisti:

- `targetType`
- `targetTarga`
- `categoria`
- `km`
- `data`
- `marca`
- `tipo` (`sostituzione`, `riparazione`, `rotazione`)
- `gommeIds`
- `asseId`
- `asseLabel`
- `rotazioneSchema`
- `rotazioneText`
- `rotazioneAssi`
- `assiConCambioGomme`
- `autista`
- `contesto`
- `stato`
- `letta`

Righe codice:

- costruzione record: `src/autisti/GommeAutistaModal.tsx:323-371`;
- append idempotente post-fix: `src/autisti/GommeAutistaModal.tsx:151-173`, uso in `src/autisti/GommeAutistaModal.tsx:373`;
- lettura Dossier Gomme: `src/next/domain/nextManutenzioniGommeDomain.ts:1505-1524`;
- lettura elenco admin NEXT: `src/next/autistiInbox/NextAutistiAdminNative.tsx:448`;
- update tmp admin NEXT: `src/next/autistiInbox/NextAutistiAdminNative.tsx:1888-1898`.

### `@gomme_eventi`

Ruolo: eventi gomme ufficializzati dall'admin. Sono ancora eventi esterni, non equivalgono automaticamente a `@manutenzioni`.

Shape: copia del record tmp senza `letta` e `stato` nel flusso admin NEXT (`src/next/autistiInbox/NextAutistiAdminNative.tsx:81-95`).

Chi scrive oggi:

- import admin NEXT: `appendGommeEventoUfficialeIfMissing` (`src/next/autistiInbox/NextAutistiAdminNative.tsx:81-95`) e `confirmImportGommeRecord` (`src/next/autistiInbox/NextAutistiAdminNative.tsx:1912-1934`);
- percorsi legacy/madre ancora presenti ma da non usare per la nuova UI: `src/components/AutistiEventoModal.tsx`, `src/autistiInbox/AutistiAdmin.tsx`.

Chi legge oggi:

- Dossier Gomme: `src/next/domain/nextManutenzioniGommeDomain.ts:1505-1546`;
- helper eventi compatibili: `src/next/helpers/eventiCompatibili.ts:164`;
- viste legacy come `Mezzo360`/`Autista360`, non target della nuova UI.

### Altre key correlate

| Key | Ruolo | Nota |
| --- | --- | --- |
| `@segnalazioni_autisti_tmp` | sorgente segnalazioni, anche gomme | campo `tipoProblema="gomme"`, `posizioneGomma`, `problemaGomma` dalla app autisti; il tappo 1a crea marker parziale quando si genera `daFare` |
| `@controlli_mezzo_autisti` | sorgente controlli, anche KO gomme | se `check.gomme === false`, il tappo 1a prova a derivare asse/motivo da campi espliciti |
| `@lavori` | lavori operativi legacy/ciclo vita | puo contenere testo gomme, ma non e' storico gomme strutturato |
| `@storico_eventi_operativi` | storico operativo | non contiene marker gomme strutturato; non e' ponte ufficiale gomme |

## 4. COME SI LEGGE/VISUALIZZA OGGI

### Dossier Gomme NEXT

Fonte principale: `readNextMezzoManutenzioniGommeSnapshot(targa)` in `src/next/domain/nextManutenzioniGommeDomain.ts:1501-1546`.

Legge:

- `@manutenzioni` via `readNextMezzoManutenzioniSnapshot`;
- `@cambi_gomme_autisti_tmp`;
- `@gomme_eventi`.

Comportamento:

- trasforma manutenzioni strutturate/testuali in item gomme (`toGommeItems`);
- trasforma eventi esterni con `resolveExternalTyreEvent` (`src/next/domain/nextManutenzioniGommeDomain.ts:1321-1405`);
- deduplica eventi ufficiali/tmp e deduplica eventi gia importati contro manutenzioni (`src/next/domain/nextManutenzioniGommeDomain.ts:1538-1546`);
- dichiara i limiti nel dominio (`src/next/domain/nextManutenzioniGommeDomain.ts:1588-1596`).

Limiti:

- gli eventi esterni sono visibili ma restano read-only rispetto allo storico;
- match forte solo con `targetTarga` o `targa`; match da `contesto.targaCamion/targaRimorchio` e' al massimo plausibile;
- non esiste qui un gesto che crea una manutenzione in `@manutenzioni`.

### Tab/dettaglio storico manutenzioni

`NextMappaStoricoPage` riconosce un record gomme se ha `assiCoinvolti`, `gommePerAsse`, `gommeInterventoTipo` o `tipo="gomme"` (`src/next/NextMappaStoricoPage.tsx:376-382`) e mostra sezione dettagli gomme (`src/next/NextMappaStoricoPage.tsx:1137-1172`).

`NextManutenzioniPage` deriva il subtype UI da marker o testo (`src/next/NextManutenzioniPage.tsx:832-852`) e salva marker quando il form e' in subtype gomme (`src/next/NextManutenzioniPage.tsx:2540-2570`).

### Dossier Mezzo

`nextDossierMezzoDomain` dichiara il reader gomme come layer read-only su `@manutenzioni + @mezzi_aziendali` con convergenza prudente di `@cambi_gomme_autisti_tmp` e `@gomme_eventi` (`src/next/domain/nextDossierMezzoDomain.ts:646-651`).

Nella legacy view del dossier costruisce `gommePerAsse` e `gommeStraordinarie` da snapshot manutenzioni/gomme (`src/next/domain/nextDossierMezzoDomain.ts:977-1012`).

## 5. REGOLE DI BUSINESS

### Ordinario vs straordinario

Codice:

- `gommeInterventoTipo` accetta solo `ordinario` o `straordinario`.
- Ordinario: assi e stato per asse (`assiCoinvolti`, `gommePerAsse`).
- Straordinario: oggetto unico `gommeStraordinario` con asse, quantita, motivo.
- Nel form, `isUiSubtypeGommeOrdinario` e `isUiSubtypeGommeStraordinario` governano quali campi vengono scritti (`src/next/NextManutenzioniPage.tsx:1013-1022`, `2540-2570`).

### KM obbligatori al completamento

Regola esatta attuale:

- `completionKmRequired` e' true solo se c'e' un record in completamento, il record ha `gommeInterventoTipo` strutturato, e la categoria e' motorizzata (`src/next/NextManutenzioniPage.tsx:1489-1496`).
- La categoria e' motorizzata se `buildTechnicalConfig(categoria)` ha assi e `isRimorchio` e' false (`src/next/domain/nextManutenzioniGommeDomain.ts:472-483`).
- In salvataggio, se completamento gomme + categoria motorizzata + km mancante, blocca con alert: "Per completare un intervento gomme su motrice o trattore devi inserire i KM." (`src/next/NextManutenzioniPage.tsx:2478-2512`).
- Per nuovi record eseguiti non-completion, il km su mezzo motorizzato e' soft warning, non blocco (`src/next/NextManutenzioniPage.tsx:2514-2517`).

### Validazioni gomme del form

- Nuovo ordinario non-completion: almeno un asse obbligatorio (`src/next/NextManutenzioniPage.tsx:2524-2527`).
- Nuovo straordinario non-completion: motivo esplicito obbligatorio (`src/next/NextManutenzioniPage.tsx:2529-2531`).

### Tappo sorgenti gomme 1a

Commit: `57ec90e9`.

Regola implementata:

- da segnalazione con `tipoProblema="gomme"`: deriva asse da `posizioneGomma` e motivo da `problemaGomma` (`src/next/writers/nextManutenzioneDaFareCreateWriter.ts:161-165`);
- da controllo con `check.gomme === false`: deriva asse da campi espliciti o note/descrizione e motivo da campo dedicato o testo con keyword (`src/next/writers/nextManutenzioneDaFareCreateWriter.ts:168-184`);
- da evento testuale gomme: deriva asse/motivo dal testo (`src/next/writers/nextManutenzioneDaFareCreateWriter.ts:187-190`);
- il builder appende il marker parziale al record `daFare` (`src/next/writers/nextManutenzioneDaFareCreateWriter.ts:221-254`).

Ambiguita da sapere: il tappo scrive `gommeStraordinario` come contenitore parziale lasciando `gommeInterventoTipo` non scritto. Pero' il dominio `nextManutenzioniDomain` risolve `gommeStraordinario` come `straordinario` se passa da sanitizzazione/read (`src/next/domain/nextManutenzioniDomain.ts:360-372`). La nuova UI deve decidere se mantenere questa semantica o introdurre uno stato "gomme da classificare" piu esplicito.

### Guardia anti-doppio-submit 3a

Commit: `ba951c43`.

- App autisti: `appendGommeAutistaTmpRecordIfMissing` non appende se l'id e' gia presente in `@cambi_gomme_autisti_tmp`; `handleSave` ha anche guardia in-flight (`src/autisti/GommeAutistaModal.tsx:151-173`, `284-290`, `373`).
- Admin NEXT: `appendGommeEventoUfficialeIfMissing` non appende se l'id e' gia presente in `@gomme_eventi`; `confirmImportGommeRecord` ha guardia in-flight (`src/next/autistiInbox/NextAutistiAdminNative.tsx:81-95`, `1912-1919`).

## 6. REQUISITI APERTI PER LA NUOVA UI

### REQUISITO PONTE

Decisione Giuseppe: opzione 2b della proposta. Il ponte sara' della nuova UI gomme.

Stato attuale:

- `@cambi_gomme_autisti_tmp` e `@gomme_eventi` vengono letti dal Dossier Gomme e possono essere visibili come item read-only.
- L'import admin NEXT copia tmp -> `@gomme_eventi` e prova a chiudere candidati esistenti, ma non crea una nuova manutenzione se non c'e' gia un candidato in `@manutenzioni`, `@segnalazioni_autisti_tmp` o `@controlli_mezzo_autisti`.
- Il modal di chiusura cerca solo candidati aperti esistenti (`src/next/components/NextImportGommeChiusuraModal.tsx:220-280`); se non trova nulla mostra "Nessuna segnalazione, controllo o manutenzione gomme aperta per questo mezzo." (`src/next/components/NextImportGommeChiusuraModal.tsx:348-350`).

Cosa manca:

- un gesto esplicito in NEXT che prenda un evento gomme app autisti e crei/agganci una manutenzione ufficiale in `@manutenzioni`;
- una revisione dei campi prima dell'import: targa, data, asse, quantita, marca, km, autista, motivo, tipo ordinario/straordinario;
- policy su km sospetti: esempio reale TI282780 aveva `km=1234`, importato nel testo ma non nel campo `km`.

### Vincoli esistenti

- Guardia anti-doppio-submit gia attiva: non rimuoverla, riusarla.
- Madre in dismissione: non dipendere da `src/components/AutistiEventoModal.tsx` o `src/pages/Manutenzioni.tsx`.
- Eventi esterni duplicati storici possono ancora esistere: la UI deve deduplicare per `sourceRecordId`/id evento o mostrare warning.
- `marca` oggi non e' marker in `@manutenzioni`: se la nuova UI vuole marca nello storico deve introdurre decisione esplicita di modello dati, non infilare valori in campi inesistenti.

## 7. VINCOLI TECNICI E DI METODO

Stack reale:

- React 19, Vite 7, TypeScript 5.9 (`package.json`).
- Build ufficiale: `npm run build` (`tsc -b && vite build`).
- Test mirati usano Vitest anche se non c'e' script npm dedicato; invocazione usata nei lotti gomme: `npx vitest run ...`.

Scritture NEXT:

- Le scritture storage passano da `setItemSync`, che chiama `assertCloneWriteAllowed("storageSync.setItemSync", { key })` (`src/utils/storageSync.ts:27-35`).
- Le scritture Firestore dirette devono passare dai wrapper `firestoreWriteOps` (`src/utils/firestoreWriteOps.ts:15-42`).
- Il barrier usa scope espliciti con `runWithCloneWriteScopedAllowance` (`src/utils/cloneWriteBarrier.ts:486-505`) e blocca se `assertCloneWriteAllowed` non trova eccezione (`src/utils/cloneWriteBarrier.ts:911-918`).
- Il writer da sorgente gomme usa lo scope `MANUTENZIONE_DAFARE_CREATE_WRITE_SCOPE` (`src/next/writers/nextManutenzioneDaFareCreateWriter.ts:13-14`, `305-327`).

Convenzioni UI/CSS NEXT:

- Usare classi scoperte/scope per pagina o modulo. Esempi reali: `next-centro-controllo-scope`, `cc-*`, `man2-*`, `dossier-*`, `aix-*`.
- File CSS NEXT esistenti: `src/next/next-manutenzioni.css`, `src/next/next-mappa-storico.css`, `src/next/next-centro-controllo.css`, `src/next/next-shell.css`.
- Evitare dipendenze CSS da madre. Per nuova UI gomme creare scope dedicato, per esempio `next-gomme-scope` + prefisso classi `ng-*`, oppure inserirsi in un file NEXT esistente solo se il modulo e' davvero parte della pagina.
- Testi UI in italiano.

Metodo per la chat nuova:

1. Leggere questo documento e i report elencati in testa.
2. Non modificare madre.
3. Definire prima il flusso ponte evento -> manutenzione.
4. Patchare solo file dichiarati.
5. Gate minimo: `npm run build`; test mirati su writer/reader coinvolti.
6. Non dichiarare "testato UI" senza verifica reale browser/screenshot se richiesta.

## Ambiguita tecniche da sciogliere

1. `gommeStraordinario` come contenitore parziale: il tappo 1a lo usa senza `gommeInterventoTipo`, ma il dominio lo interpreta come `straordinario`. La nuova UI deve decidere se accettare questo comportamento o introdurre uno stato esplicito di classificazione pendente.
2. `marca` non e' parte del marker `@manutenzioni`: oggi e' testuale nello storico e strutturata solo negli eventi esterni. Qualsiasi UI che promette gestione marca nello storico deve prima decidere un campo dati.
3. Duplicati storici in `@gomme_eventi`: la guardia evita nuovi duplicati, ma non ripulisce quelli gia presenti.
4. `gommeInterventoTipo` puo essere derivato da testo dal reader anche quando non e' persistito raw. Per UI di gestione usare sempre distinzione tra dato raw e dato derivato.
5. KM obbligatori: oggi il blocco forte vale solo in completamento gomme di record gia tipizzato e solo per categorie motorizzate; la nuova UI ponte deve decidere se applicarlo anche all'import evento.
