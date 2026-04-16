## 1. Scopo del documento
Verificare sul codice reale del repo se `Archivista V1 lato documenti/archiviazione` sia davvero chiuso oppure no, senza fidarsi dei report esecutivi e senza correggere nulla.

L'audit controlla:
- attivazione reale delle 4 famiglie V1;
- review e UX non chat;
- regola duplicati e versioni;
- archiviazione finale reale;
- ramo Manutenzione OpenAI only;
- ramo Magazzino non rifatto;
- apertura effettiva della barrier;
- assenza di azioni business fuori scope;
- esiti tecnici di lint, build e verifica browser locale.

## 2. Base di controllo
Fonti di controllo lette prima del codice:
- `docs/product/SPEC_ESECUTIVA_IA_V1.md`
- `docs/product/SPEC_GUIDA_IA_REPORT_E_ARCHIVISTA.md`
- `docs/product/PIANO_ESECUTIVO_V1_IA_REPORT_E_ARCHIVISTA.md`
- `docs/product/AUDIT_PRE_SPEC_FINALE_IA2.md`

Documenti di stato letti:
- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`
- `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`

Report esecutivi letti solo come contrasto, non come prova:
- `docs/change-reports/20260415_151953_ia_v1_archivista_magazzino_reuse_no_refactor.md`
- `docs/continuity-reports/20260415_151953_continuity_ia_v1_archivista_magazzino_reuse_no_refactor.md`
- `docs/change-reports/20260415_154007_ia_v1_archivista_manutenzione_review_no_save.md`
- `docs/continuity-reports/20260415_154007_continuity_ia_v1_archivista_manutenzione_review_no_save.md`
- `docs/change-reports/20260415_164047_ia_v1_manutenzione_openai_only_fix.md`
- `docs/continuity-reports/20260415_164047_continuity_ia_v1_manutenzione_openai_only_fix.md`
- `docs/change-reports/20260415_181816_chiusura_archivista_v1_documenti_archiviazione.md`
- `docs/continuity-reports/20260415_181816_continuity_chiusura_archivista_v1_documenti_archiviazione.md`

Codice verificato:
- `src/next/NextIAArchivistaPage.tsx`
- `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx`
- `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx`
- `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx`
- `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx`
- `src/next/internal-ai/ArchivistaArchiveClient.ts`
- `src/next/internal-ai/internal-ai.css`
- `src/utils/cloneWriteBarrier.ts`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `backend/internal-ai/server/internal-ai-document-extraction.js`

Shape reali di confronto lette:
- `src/pages/IA/IADocumenti.tsx`
- `src/pages/Acquisti.tsx`
- `src/pages/Mezzi.tsx`
- `src/pages/IA/IALibretto.tsx`
- `src/pages/IA/IACoperturaLibretti.tsx`
- `src/next/NextDossierFatturaToManutenzioneModal.tsx`
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/firebase.ts`
- `src/utils/firestoreWriteOps.ts`
- `src/utils/storageWriteOps.ts`
- `src/utils/storageSync.ts`

File extra letti strettamente necessari:
- `src/next/internal-ai/internalAiServerRepoUnderstandingClient.ts`
- `package.json`

Regola usata in tutto il documento:
- conta il codice reale del repo;
- i report esecutivi valgono solo come tracciabilita;
- dove non c'e prova diretta, l'esito non viene promosso oltre `DEDUZIONE PRUDENTE` o `NON DIMOSTRATO`.

## 3. Verifica famiglia per famiglia
### 3.1 `Fattura / DDT + Magazzino`
STATO REALE:
- Famiglia realmente montata e raggiungibile dentro `Archivista`.

PROVE NEL CODICE:
- `src/next/NextIAArchivistaPage.tsx:73-131` definisce `fattura_ddt:magazzino` come `active`.
- `src/next/NextIAArchivistaPage.tsx:327` monta `ArchivistaMagazzinoBridge`.
- `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:188`, `:242`, `:270` implementa analisi, duplicati e archiviazione.
- Verifica browser locale: la route `/next/ia/archivista` mostra la review Magazzino come stato iniziale.

BUG O BUCHI RESIDUI:
- Il motore di analisi resta legacy e punta ancora a `estrazioneDocumenti` (`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:13-14`, `:208`). Questo non viola la decisione specifica su Magazzino, ma conferma che il ramo non e stato convertito a backend OpenAI.
- La barrier permette le scritture archivistiche per tutta la route `/next/ia/archivista`, non solo nel punto finale di conferma. Questo e un buco di perimetro, non di flusso UI.

ESITO:
- `OK` sul ramo operativo.

### 3.2 `Fattura / DDT + Manutenzione`
STATO REALE:
- Famiglia realmente montata e raggiungibile dentro `Archivista`.

PROVE NEL CODICE:
- `src/next/NextIAArchivistaPage.tsx:80-86` definisce `fattura_ddt:manutenzione` come `active`.
- `src/next/NextIAArchivistaPage.tsx:331` monta `ArchivistaManutenzioneBridge`.
- `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:366`, `:433`, `:461` implementa analisi, duplicati e archiviazione.
- Verifica browser locale: selezionando `Fattura / DDT` + `Manutenzione` la pagina mostra `Review Manutenzione`.

BUG O BUCHI RESIDUI:
- Nessun buco evidente sul ramo documentale puro.
- Resta aperto il tema barrier: la scrittura e protetta a livello di route, non di singola azione confermata.

ESITO:
- `OK` sul ramo operativo.

### 3.3 `Documento mezzo`
STATO REALE:
- Famiglia realmente montata e raggiungibile dentro `Archivista`.

PROVE NEL CODICE:
- `src/next/NextIAArchivistaPage.tsx:125-130` definisce `documento_mezzo:documento_mezzo` come `active`.
- `src/next/NextIAArchivistaPage.tsx:333-335` monta `ArchivistaDocumentoMezzoBridge`.
- `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:76-83` definisce i sottotipi `Libretto`, `Assicurazione`, `Revisione`, `Collaudo`.
- `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:271`, `:344`, `:376` implementa analisi, duplicati e archiviazione.
- Verifica browser locale: selezionando `Documento mezzo` la pagina mostra `Review Documento mezzo`.

BUG O BUCHI RESIDUI:
- Il matching duplicati non usa il sottotipo come campo forte; il controllo si appoggia a famiglia, fornitore, numero, data e targa. Non rompe il flusso, ma puo ridurre la precisione per documenti mezzo diversi dello stesso veicolo.
- Anche qui la barrier e piu larga del richiesto perche apre `@mezzi_aziendali` a livello di route.

ESITO:
- `OK` sul ramo operativo.

### 3.4 `Preventivo + Magazzino`
STATO REALE:
- Famiglia realmente montata e raggiungibile dentro `Archivista`.

PROVE NEL CODICE:
- `src/next/NextIAArchivistaPage.tsx:94-100` definisce `preventivo:magazzino` come `active`.
- `src/next/NextIAArchivistaPage.tsx:339` monta `ArchivistaPreventivoMagazzinoBridge`.
- `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:157`, `:219`, `:246` implementa analisi, duplicati e archiviazione.
- Verifica browser locale: selezionando `Preventivo` la pagina mostra `Review Preventivo + Magazzino`.

BUG O BUCHI RESIDUI:
- Il target reale non e una collection Firestore autonoma ma il documento `storage/@preventivi` con array interno, coerente con la shape esistente di `Acquisti` (`src/pages/Acquisti.tsx:212`, `:3665`, `:4033`). Non e un bug, ma va tenuto chiaro perche il nome `@preventivi` nel lessico funzionale nasconde una shape document-based.

ESITO:
- `OK` sul ramo operativo.

### 3.5 Famiglie che devono restare fuori
#### `Preventivo + Manutenzione`
STATO REALE:
- Fuori V1 e non operativo.

PROVE NEL CODICE:
- `src/next/NextIAArchivistaPage.tsx:101-106` lo marca `out_of_scope`.
- `src/next/NextIAArchivistaPage.tsx:135-145` e `:155` non consentono questo contesto nella selezione normale.
- Verifica browser locale: con `Preventivo` il pulsante contesto `Manutenzione` risulta disabilitato (`aria-disabled="true"`).

BUG O BUCHI RESIDUI:
- E visibile solo come direzione fuori V1 nelle card meta, non come ramo operativo selezionabile.

ESITO:
- `OK`

#### `Cisterna AdBlue`, `Euromecc`, `Carburante`
STATO REALE:
- Restano fuori da `Archivista` come rami operativi.

PROVE NEL CODICE:
- `src/next/NextIAArchivistaPage.tsx` non ha type/context dedicati per questi verticali.
- `src/next/NextIAArchivistaPage.tsx:232-236` li cita solo nel testo meta `Fuori V1`.
- Verifica browser locale: non compaiono tra i bottoni di scelta `Tipo documento` o `Contesto`.

BUG O BUCHI RESIDUI:
- Nessuno rilevante su questo punto.

ESITO:
- `OK`

## 4. Verifica review e UX
FATTO VERIFICATO:
- Tutte e 4 le famiglie V1 usano una review a card, non una chat.
- `NextIAArchivistaPage` impone il percorso `tipo -> contesto -> flusso` e monta bridge specifici, non una conversazione libera (`src/next/NextIAArchivistaPage.tsx:181-340`).
- Le card di review, callout, sezioni righe/avvisi/campi mancanti e stato archivio sono visibili in tutti i bridge:
  - Magazzino: `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:394-642`
  - Manutenzione: `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:593-885`
  - Documento mezzo: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:555-865`
  - Preventivo magazzino: `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:365-634`
- Il layout usa griglie e pannelli dedicati, non componenti di chat (`src/next/internal-ai/internal-ai.css:3560`, `:3824`, `:3830-3831`, `:4092-4123`).

FATTO VERIFICATO PER FAMIGLIA:
- Magazzino:
  - stato analisi `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:396`
  - riassunto breve `:422-425`
  - campi principali `:408-420`
  - righe `:430-459`
  - avvisi `:471-483`
  - callout pre/post archivio `:492-526`
- Manutenzione:
  - stato analisi `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:595`
  - riassunto breve `:643-646`
  - campi principali `:607-637`
  - righe `:730-764`
  - avvisi `:677-689`
  - campi mancanti `:692-706`
  - callout pre/post archivio `:653-674`
- Documento mezzo:
  - sottotipi reali `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:76-83`
  - stato analisi `:557`
  - campi principali `:573-606`
  - avvisi `:642-654`
  - campi mancanti `:657-667`
  - callout pre/post archivio `:619-640`, `:855-865`
  - scelta update mezzo esplicita `:697-705`
- Preventivo + Magazzino:
  - stato analisi `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:367`
  - campi principali `:383-409`
  - riassunto breve `:412-415`
  - avvisi `:444-456`
  - campi mancanti `:459-469`
  - righe `:477-501`
  - callout pre/post archivio `:421-442`, `:626-634`

BUG O BUCHI RESIDUI:
- In Magazzino e Preventivo, prima dell'analisi la UI mostra gia callout e sezioni in stato vuoto; non e chat, ma il copy pre-analisi puo sembrare piu avanzato di quanto il dato dimostri.
- `Documento mezzo` seleziona automaticamente il mezzo letto per targa se trova un match (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:322-326`), ma non aggiorna alcun dato senza conferma. Questo e accettabile, non un update nascosto.

ESITO:
- `OK`

## 5. Verifica duplicati e versioni
FATTO VERIFICATO:
- Le tre scelte esistono davvero a UI e a logica:
  - `stesso_documento`
  - `versione_migliore`
  - `documento_diverso`
- Sono definite come tipo condiviso in `src/next/internal-ai/ArchivistaArchiveClient.ts:20-23`.
- Tutti i bridge mostrano i tre pulsanti quando esiste un candidato:
  - Magazzino `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:598-618`
  - Manutenzione `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:830-850`
  - Documento mezzo `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:800-820`
  - Preventivo `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:572-592`

FATTO VERIFICATO:
- `Stesso documento` non crea un nuovo record:
  - documenti standard `src/next/internal-ai/ArchivistaArchiveClient.ts:451-459`
  - preventivi `src/next/internal-ai/ArchivistaArchiveClient.ts:517-525`
- `Versione migliore` non cancella il precedente:
  - il nuovo payload salva `duplicateOfId` e `duplicateTarget` senza rimuovere il vecchio record (`src/next/internal-ai/ArchivistaArchiveClient.ts:436-439`, `:480`, `:493-496`, `:566`, `:580-583`)
- `Documento diverso` crea un nuovo record e annota il legame col precedente tramite `archivedAsDifferentFromId` (`src/next/internal-ai/ArchivistaArchiveClient.ts:440-441`).

DEDUZIONE PRUDENTE:
- La regola forte di matching esiste davvero, ma resta prudente e selettiva:
  - usa famiglia, fornitore, numero, data, totale e targa secondo i dati disponibili;
  - richiede almeno 3 campi matchati e almeno 2 campi critici (`src/next/internal-ai/ArchivistaArchiveClient.ts:299-336`).
- Questo riduce i falsi positivi ma puo perdere duplicati veri su documenti poveri di metadati.

BUG O BUCHI RESIDUI:
- Non ci sono TODO finti: la scelta influenza davvero il comportamento di salvataggio.
- Il matching per `Documento mezzo` non considera il sottotipo come criterio forte. Non rompe la regola, ma puo essere poco preciso in casistiche limite.

ESITO:
- `OK`

## 6. Verifica archiviazione finale
### 6.1 `Fattura / DDT + Magazzino`
FATTO VERIFICATO:
- Il target record e `@documenti_magazzino` (`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:250`, `:287`).
- L'upload originale passa da `uploadArchivistaOriginalFile` e usa `documenti_pdf/<timestamp>_<nomefile>` (`src/next/internal-ai/ArchivistaArchiveClient.ts:176-180`, `:416-427`, `:464-480`).
- Il salvataggio record usa `addDoc(collection(db, args.targetCollection), payload)` (`src/next/internal-ai/ArchivistaArchiveClient.ts:445-486`).
- Non esiste nessuna azione stock automatica nel bridge; il callout la esclude esplicitamente (`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:515-516`).

### 6.2 `Fattura / DDT + Manutenzione`
FATTO VERIFICATO:
- Il target record e `@documenti_mezzi` (`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:441`, `:478`).
- L'originale viene caricato dallo stesso client archivistico in `documenti_pdf/...` (`src/next/internal-ai/ArchivistaArchiveClient.ts:176-180`, `:416-427`, `:464-480`).
- Il bridge non crea manutenzioni e lo dichiara esplicitamente (`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:672-673`).

FATTO VERIFICATO:
- Non c'e alcun uso di `@costiMezzo` nei bridge Archivista o nel client archivistico.

### 6.3 `Documento mezzo`
FATTO VERIFICATO:
- L'archivio record usa `@documenti_mezzi` (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:355`, `:401`).
- Il payload collega il documento al mezzo con `mezzoId` e `targa` (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:412-428`).
- L'update mezzo parte solo se `applyVehicleUpdateChoice` e vero e solo dopo un risultato `archived` (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:430-446`).
- L'update reale usa `setItemSync("@mezzi_aziendali", next)` tramite `applyArchivistaVehicleUpdate` (`src/next/internal-ai/ArchivistaArchiveClient.ts:662-697`, `src/utils/storageSync.ts:27-52`, `:114-132`).

### 6.4 `Preventivo + Magazzino`
FATTO VERIFICATO:
- Il target archivistico reale e la shape esistente `doc(db, "storage", "@preventivi")`, non una collection separata (`src/next/internal-ai/ArchivistaArchiveClient.ts:338`, `:540-568`).
- Il file originale viene caricato in `preventivi/<archiveId>_<nomefile>` (`src/next/internal-ai/ArchivistaArchiveClient.ts:176-180`, `:530-539`).
- Questa shape e coerente con `Acquisti`, che usa `@preventivi` come doc e storage `preventivi/<id>.pdf` (`src/pages/Acquisti.tsx:212`, `:3665`, `:4033`).
- Non esiste alcun aggiornamento listino automatico nel bridge (`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:440-441`).

GIUDIZIO SINTETICO SU QUESTO BLOCCO:
- `FATTO VERIFICATO`: esiste codice reale di upload originale e salvataggio archivio per tutte e 4 le famiglie.
- `DEDUZIONE PRUDENTE`: il target `@preventivi` va interpretato come documento `storage/@preventivi` coerente col repo, non come collection autonoma.
- `NON DIMOSTRATO`: un test end-to-end di archiviazione reale contro Firebase non e stato eseguito in audit, per evitare scritture sui dataset reali.

ESITO:
- `OK`

## 7. Verifica ramo Manutenzione OpenAI only
FATTO VERIFICATO:
- Il frontend Manutenzione usa solo il backend IA separato:
  - endpoint locale `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:11`
  - risoluzione base URL server-side tramite `internalAiServerRepoUnderstandingClient`
- Il bridge non richiama `estrazioneDocumenti`.
- Il backend espone l'endpoint dedicato `documents.manutenzione-analyze` (`backend/internal-ai/server/internal-ai-adapter.js:1505-1608`).
- L'estrazione parte con `profile: "manutenzione"` e `providerRequired: true` (`backend/internal-ai/server/internal-ai-adapter.js:1556-1559`).
- Il parser provider usa prompt dedicato manutenzione (`backend/internal-ai/server/internal-ai-document-extraction.js:1147-1154`).
- Se il provider non e configurato, l'endpoint fallisce; non c'e fallback legacy accettato per questo ramo (`backend/internal-ai/server/internal-ai-adapter.js:1533-1543`, `backend/internal-ai/server/internal-ai-document-extraction.js:1513-1515`).

FATTO VERIFICATO:
- Nel perimetro verificato non risultano uso di Gemini o callable legacy per il ramo `Fattura / DDT + Manutenzione`.

ESITO:
- `OK`

## 8. Verifica ramo Magazzino non rifatto
FATTO VERIFICATO:
- Il ramo Magazzino continua a usare il motore legacy forte gia presente:
  - endpoint `estrazioneDocumenti` in `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:13-14`
  - chiamata reale in `:208`
- Lo storico/shape legacy documentale resta coerente con `IADocumenti`:
  - upload `documenti_pdf/...` in `src/pages/IA/IADocumenti.tsx:501`
  - target `@documenti_mezzi` o `@documenti_magazzino` in `:531-537`
- Nel bridge Magazzino non compaiono scritture stock o handoff business.

DEDUZIONE PRUDENTE:
- Il ramo e stato avvolto in una nuova UI Archivista, ma non e stato rifatto nel motore documentale di base.

BUG O BUCHI RESIDUI:
- Nessuna degradazione evidente del comportamento documentale.
- Resta il limite gia noto: dipendenza dal motore legacy `estrazioneDocumenti`.

ESITO:
- `OK`

## 9. Verifica barrier
FATTO VERIFICATO:
- La barrier apre per `/next/ia/archivista`:
  - `firestore.addDoc` su `@documenti_magazzino` e `@documenti_mezzi` (`src/utils/cloneWriteBarrier.ts:47-50`, `:229-230`)
  - `firestore.setDoc` su `storage/@preventivi` (`src/utils/cloneWriteBarrier.ts:51`, `:233-234`)
  - `storageSync.setItemSync` su `@mezzi_aziendali` (`src/utils/cloneWriteBarrier.ts:52`, `:237-238`)
  - `storage.uploadBytes` su prefissi `documenti_pdf/` e `preventivi/` (`src/utils/cloneWriteBarrier.ts:53`, `:222-225`)
- La barrier non apre `@costiMezzo` o `@listino_prezzi` nel ramo Archivista.
- La barrier continua ad avere aperture proprie di altri moduli, tra cui `@manutenzioni`, ma legate al path `/next/manutenzioni`, non ad Archivista (`src/utils/cloneWriteBarrier.ts:11-17`, `:294-303`).

BUG O BUCHI RESIDUI:
- Questo blocco non e stretto quanto richiesto dal prompt originario.
- L'apertura e per route, non per singolo bridge o singola azione confermata. In pratica:
  - qualsiasi codice eseguito su `/next/ia/archivista` puo usare `addDoc` verso `@documenti_magazzino` o `@documenti_mezzi`;
  - qualsiasi codice su quella route puo usare `setDoc` su `storage/@preventivi`;
  - qualsiasi codice su quella route puo usare `setItemSync("@mezzi_aziendali")`.
- Quindi la barrier e coerente col bisogno funzionale V1, ma non e "strettissima" nel senso richiesto.

ESITO:
- `PARZIALE`

## 10. Verifica assenza di azioni business fuori scope
FATTO VERIFICATO:
- Nessuna creazione manutenzione nel ramo Archivista:
  - il bridge Manutenzione esclude esplicitamente il comportamento (`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:672-673`)
  - nel perimetro Archivista non compare alcun richiamo a `saveNextManutenzioneBusinessRecord`; quello esiste solo nel modal dossier legacy `src/next/NextDossierFatturaToManutenzioneModal.tsx:3`, `:206-224`
- Nessun collegamento a manutenzione esistente:
  - in Manutenzione compaiono solo come passi futuri non eseguibili (`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:709-721`)
- Nessun carico stock automatico:
  - Magazzino lo esclude esplicitamente (`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:515-516`)
- Nessun aggiornamento listino:
  - Preventivo lo esclude esplicitamente (`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:440-441`)
- Nessun workflow approvativo:
  - non risultano hook o chiamate di approval nel perimetro Archivista documentale
- Nessuna chat dentro Archivista:
  - la pagina monta solo bridge dedicati e non componenti chat (`src/next/NextIAArchivistaPage.tsx:323-339`)

DEDUZIONE PRUDENTE:
- I nuovi endpoint backend documentali servono solo analisi OpenAI e non applicano scritture business (`backend/internal-ai/server/internal-ai-adapter.js:1505-1834`).

ESITO:
- `OK`

## 11. Verifiche tecniche eseguite
Comandi eseguiti:
- `npx eslint src/next/NextIAArchivistaPage.tsx src/next/internal-ai/ArchivistaMagazzinoBridge.tsx src/next/internal-ai/ArchivistaManutenzioneBridge.tsx src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx src/next/internal-ai/ArchivistaArchiveClient.ts src/utils/cloneWriteBarrier.ts backend/internal-ai/server/internal-ai-adapter.js backend/internal-ai/server/internal-ai-document-extraction.js`
- `npm run build`

Esito:
- `eslint`: `OK`, con warning non bloccante su `baseline-browser-mapping` datato.
- `build`: `OK`, con warning Vite noti su chunk grandi e import dinamici `jspdf` / `jspdf-autotable`.

Verifica browser locale:
- eseguita su `http://127.0.0.1:4173/next/ia/archivista`
- eseguita anche verifica health del backend IA separato su `http://127.0.0.1:4310/internal-ai-backend/health`

FATTO VERIFICATO nel browser:
- la route Archivista si apre;
- Magazzino e il ramo iniziale;
- Manutenzione, Documento mezzo e Preventivo + Magazzino si aprono davvero cambiando selezione;
- `Preventivo + Manutenzione` resta non selezionabile nella UI.

NON DIMOSTRATO in browser:
- analisi end-to-end con documento reale;
- caso duplicato end-to-end;
- archiviazione finale end-to-end.

Motivo:
- eseguire analisi + conferma archivio in audit avrebbe comportato upload e scritture reali sui target Archivista V1 (`@documenti_magazzino`, `@documenti_mezzi`, `storage/@preventivi`, `@mezzi_aziendali`), alterando i dataset reali durante un controllo che deve restare non invasivo.

## 12. Verdetto finale
### CHIUSO DAVVERO
- Le 4 famiglie V1 sono realmente montate in `Archivista` e le relative review non chat esistono davvero.
- La regola duplicati/versioni e implementata davvero e modifica il comportamento di salvataggio.
- L'archiviazione finale reale ha codice esplicito di upload originale e scrittura archivio.
- Il ramo Manutenzione e davvero OpenAI only nel perimetro verificato.
- Il ramo Magazzino non e stato rifatto nel motore documentale e non mostra nuove azioni business fuori scope.

### PARZIALE
- La `cloneWriteBarrier` non e stretta quanto richiesto: apre le scritture Archivista per l'intera route `/next/ia/archivista`, non solo per le sole azioni confermate e non solo per i bridge specifici.
- La prova end-to-end di archiviazione reale e di duplicato reale non e stata eseguita in browser, per non sporcare dati reali durante l'audit.
- Il matching duplicati di `Documento mezzo` non usa il sottotipo come criterio forte.

### NON CHIUSO
- Non ci sono prove di un buco tale da annullare la chiusura documentale del modulo intero.
- Non risultano writer business fuori scope introdotti dentro Archivista.
- Non risultano creazioni manutenzione, carichi stock o aggiornamenti listino automatici.

VERDETTO NETTO: PARZIALE
