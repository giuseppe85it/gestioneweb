# PIANO ESECUTIVO V1 IA REPORT E ARCHIVISTA

## 1. Scopo del documento

Questo documento traduce la spec guida della nuova IA in un piano pratico, basato sui file veri del repo.

Qui non c'e codice e non c'e patch runtime.

Qui c'e solo una risposta ordinata a questa domanda:

"Da dove partiamo davvero, cosa possiamo riusare, e qual e il primo percorso sicuro per arrivare alla V1?"

Regola usata:
- `FATTO VERIFICATO` = supportato dal codice del repo.
- `DEDUZIONE PRUDENTE` = conclusione stretta, senza inventare.
- `DECISIONE CONSIGLIATA` = scelta pratica piu sicura per arrivare alla V1 descritta nella spec guida.

La direzione target resta quella di `docs/product/SPEC_GUIDA_IA_REPORT_E_ARCHIVISTA.md`.

## 2. Da dove partiamo davvero

- `FATTO VERIFICATO` Oggi esistono almeno queste superfici IA reali nel runtime NEXT:
  - Home launcher `src/next/components/HomeInternalAiLauncher.tsx:84-183`
  - pagina ibrida `/next/ia/interna` su `src/next/NextInternalAiPage.tsx` e `src/App.tsx:route ia/interna`
  - storico documentale `/next/ia/documenti` su `src/next/NextIADocumentiPage.tsx` e `src/App.tsx:route ia/documenti`
  - flusso libretto `/next/ia/libretto` su `src/next/NextIALibrettoPage.tsx` e `src/App.tsx:route ia/libretto`
  - verticale cisterna `/next/cisterna-ia` su `src/next/NextCisternaIAPage.tsx` e `src/App.tsx:route cisterna-ia`

- `FATTO VERIFICATO` La superficie principale di oggi e ancora ibrida:
  - `NextInternalAiPage` monta insieme chat, allegati, orchestrazione universale, storico/review e il motore legacy `useIADocumentiEngine()` (`src/next/NextInternalAiPage.tsx:4242-4247`, `:4468-4519`, `:7580-7799`)
  - il file definisce ancora props da modale storico come `surfaceVariant`, `initialChatInput`, `initialChatAttachments`, `autoSubmitInitialChat` (`src/next/NextInternalAiPage.tsx:194-199`, `:4238-4244`)

- `FATTO VERIFICATO` Il launcher Home manda tutto verso `/next/ia/interna`:
  - prompt libero -> `state.initialPrompt`
  - upload fattura/preventivo/manutenzione -> `state.triggerUpload`
  - libretto e cisterna -> redirect a pagine dedicate (`src/next/components/HomeInternalAiLauncher.tsx:95-104`, `:106-126`)

- `FATTO VERIFICATO` Il motore documentale legacy e ancora il cuore delle scritture documentali:
  - POST a `estrazioneDocumenti` Gemini (`src/pages/IA/IADocumenti.tsx:372-389`)
  - upload originale in `documenti_pdf/...` (`src/pages/IA/IADocumenti.tsx:499-504`)
  - save in `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici` (`src/pages/IA/IADocumenti.tsx:529-537`)
  - update documento (`src/pages/IA/IADocumenti.tsx:771-775`)
  - import inventario (`src/pages/IA/IADocumenti.tsx:604-731`)

- `FATTO VERIFICATO` Esiste gia un backend OpenAI separato su porta `4310`:
  - adapter Express `backend/internal-ai/server/internal-ai-adapter.js:49`, `:930`, `:1346`
  - client usato dalla chat in `src/next/internal-ai/internalAiChatOrchestratorBridge.ts:149-207`
  - extraction documentale OpenAI in `backend/internal-ai/server/internal-ai-document-extraction.js:782-919`

- `FATTO VERIFICATO` Il backend OpenAI non e ancora la V1 Archivista finale:
  - il prompt di extraction attuale parla di "review Magazzino" e schema orientato a documenti materiali (`backend/internal-ai/server/internal-ai-document-extraction.js:782-843`)
  - quindi oggi e un motore utile, ma non ancora un archivista multi-famiglia pulito

- `FATTO VERIFICATO` La barrier del clone apre scritture in modo stretto e modulo per modulo:
  - `/next/ia/interna` solo `POST` a `estrazioneDocumenti` e scope inline su `@inventario` (`src/utils/cloneWriteBarrier.ts:43-46`, `:171-199`)
  - `/next/magazzino` su `@inventario`, `@materialiconsegnati`, `@cisterne_adblue` (`src/utils/cloneWriteBarrier.ts:9-14`, `:241-250`)
  - `/next/manutenzioni` su `@manutenzioni` e pochi dataset collegati (`src/utils/cloneWriteBarrier.ts:16-23`, `:255-273`)
  - `/next/euromecc` su `@ordini` e upload `euromecc/relazioni/` (`src/utils/cloneWriteBarrier.ts:35`, `:213-239`)

- `DEDUZIONE PRUDENTE` Oggi il repo ha gia molti pezzi utili, ma non ha ancora due prodotti distinti.
  - IA 1 esiste in parte dentro la chat di `NextInternalAiPage`
  - IA 2 esiste in parte tra `IADocumenti`, storico `/next/ia/documenti`, libretto, handoff e moduli target
  - il problema non e assenza totale di pezzi
  - il problema e che i pezzi sono ancora mescolati

## 3. Cosa esiste gia e cosa si puo riusare

### `NextInternalAiPage`

- `FATTO VERIFICATO` E la pagina oggi piu completa, ma e ibrida (`src/next/NextInternalAiPage.tsx:4242-4247`, `:7580-7799`).
- `DECISIONE CONSIGLIATA` Si riusa, ma non come prodotto finale unico.
- `DECISIONE CONSIGLIATA` Va separato in due ruoli:
  - IA 1 come esperienza report/chat sola lettura
  - IA 2 come flusso guidato separato

### `useIADocumentiEngine`

- `FATTO VERIFICATO` Oggi e il motore reale che sa fare upload, analisi, save e storico (`src/pages/IA/IADocumenti.tsx:183-340`, `:372-537`).
- `DECISIONE CONSIGLIATA` Si puo riusare solo come motore interno temporaneo.
- `DECISIONE CONSIGLIATA` Non va riusato come prodotto finale visibile, perche porta con se Gemini, writer legacy e logica ibrida.

### Backend OpenAI su `4310`

- `FATTO VERIFICATO` Esiste, e gia parla OpenAI solo lato server (`backend/internal-ai/server/internal-ai-adapter.js:49`, `:236`, `:1346`; `src/next/internal-ai/internalAiChatOrchestratorBridge.ts:149-207`).
- `DECISIONE CONSIGLIATA` Si riusa come backend canonico futuro.
- `DECISIONE CONSIGLIATA` Va ripulito sul fronte documentale, perche l'extraction attuale e ancora troppo magazzino-centrica.

### `IADocumenti` legacy

- `FATTO VERIFICATO` E ancora il vero writer documentale multi-famiglia del repo (`src/pages/IA/IADocumenti.tsx:498-537`).
- `DECISIONE CONSIGLIATA` Non va riusato come prodotto finale.
- `DECISIONE CONSIGLIATA` Va tenuto solo come fonte di verita temporanea sui campi e, se serve, come motore interno transitorio dietro un ingresso nuovo e pulito.

### `NextMagazzinoPage`

- `FATTO VERIFICATO` E gia il punto canonico per la seconda azione business delle fatture magazzino (`src/next/NextMagazzinoPage.tsx:1301-1303`, `:2206-2263`, `:4480-4573`).
- `DECISIONE CONSIGLIATA` Si riusa cosi com'e come modulo destinazione, non come IA 2.

### Ponte fattura -> manutenzione

- `FATTO VERIFICATO` Esiste un ponte concreto da documento a manutenzione con `sourceDocumentId` (`src/next/NextDossierFatturaToManutenzioneModal.tsx:213-230`; `src/next/domain/nextManutenzioniDomain.ts:781`, `:910-924`).
- `DECISIONE CONSIGLIATA` Si riusa come pattern della seconda azione business per "fattura manutenzione".

### `NextIALibrettoPage`

- `FATTO VERIFICATO` Legge archivio e viewer, ma blocca analisi e salvataggio nel clone (`src/next/NextIALibrettoPage.tsx:169-193`).
- `DECISIONE CONSIGLIATA` Si riusa come riferimento UI e come lettura archivio mezzo.
- `DECISIONE CONSIGLIATA` Non puo essere il prodotto finale di IA 2.

### `cloneWriteBarrier`

- `FATTO VERIFICATO` E il confine corretto e gia operativo per aprire scritture strette (`src/utils/cloneWriteBarrier.ts:171-250`).
- `DECISIONE CONSIGLIATA` Si riusa cosi com'e come punto di controllo obbligatorio.
- `DECISIONE CONSIGLIATA` Non va aggirato e non va allargato in modo generico.

### Orchestratore universale attuale

- `FATTO VERIFICATO` Oggi serve soprattutto alla chat universale, agli handoff e al multi-file (`src/next/internal-ai/internalAiUniversalOrchestrator.ts:83-179`; `src/next/internal-ai/internalAiUniversalHandoff.ts:199-289`, `:582-708`).
- `DECISIONE CONSIGLIATA` Si riusa ma va ripulito.
- `DECISIONE CONSIGLIATA` Per IA 2 V1 non deve restare il cervello che decide il contesto al posto dell'utente.

## 4. Cosa non puo restare come prodotto finale

- `FATTO VERIFICATO` `/next/ia/interna` non puo restare il prodotto finale unico, perche oggi somma:
  - chat report
  - ingressi upload
  - handoff
  - orchestrazione universale
  - motore documentale legacy
  (`src/next/NextInternalAiPage.tsx:4242-4247`, `:4468-4519`, `:7580-7799`)

- `FATTO VERIFICATO` `IADocumenti` non puo restare il backend canonico futuro, perche dipende ancora da Gemini e scrive con il contratto legacy (`src/pages/IA/IADocumenti.tsx:372-389`, `:498-537`; `functions/estrazioneDocumenti.js:24-54`)

- `FATTO VERIFICATO` `NextIALibrettoPage` e `NextCisternaIAPage` non possono essere spacciati come V1 Archivista:
  - mostrano il flusso
  - ma dichiarano esplicitamente il blocco read-only del clone (`src/next/NextIALibrettoPage.tsx:169-193`; `src/next/NextCisternaIAPage.tsx:119-149`)

- `FATTO VERIFICATO` L'handoff universale attuale non puo essere la logica finale di IA 2, perche continua a inferire e a instradare per famiglia/modulo (`src/next/internal-ai/internalAiUniversalHandoff.ts:348-708`)

- `DECISIONE CONSIGLIATA` Il prodotto finale non deve piu mostrare:
  - una chat dentro l'archivista
  - un router che indovina il contesto
  - ingressi diversi che portano alla stessa pagina ibrida
  - scritture documentali nascoste dietro motori legacy

## 5. Come deve apparire la V1

- `DECISIONE CONSIGLIATA` La V1 deve avere due esperienze separate.

### IA 1

- pagina o area dedicata di sola lettura
- prompt libero
- risposta report
- eventuale apertura documenti gia archiviati
- nessun upload documentale come flusso principale

### IA 2

- ingresso guidato separato
- scelta obbligatoria di:
  - tipo documento
  - contesto
- area upload
- pulsante unico `Analizza documento`
- dossier/review unica
- conferma archiviazione
- solo dopo, eventuale proposta di seconda azione business

### V1 limitata alle 4 famiglie gia fissate

- fattura/DDT magazzino
- fattura manutenzione
- documento mezzo
- preventivo magazzino

### Cosa non deve piu vedere l'utente nella V1

- il vecchio miscuglio chat + archivio + review nella stessa pagina
- redirect impliciti tra fattura, preventivo, manutenzione e libretto
- moduli specialistici fuori V1 dentro lo stesso flusso
- decisioni automatiche sul contesto

## 6. Fasi di realizzazione in ordine

### Nome fase
Separazione dei due ingressi

- `Obiettivo` Dare subito al sistema la forma giusta: IA 1 da una parte, IA 2 dall'altra.
- `Cosa vedra l'utente` Due entrate chiare, non una sola pagina ibrida.
- `File probabili coinvolti`
  - `src/App.tsx`
  - `src/next/components/HomeInternalAiLauncher.tsx`
  - `src/next/NextHomePage.tsx`
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/nextStructuralPaths.ts`
  - nuovo file pagina IA 2 in `src/next/`
- `Rischio` Normale.
- `Dipendenze` Nessuna apertura writer nuova.
- `Perche viene prima o dopo` Viene prima perche senza questa separazione il resto continua a nascere dentro la pagina sbagliata.

### Nome fase
Shell pulita IA 2 V1

- `Obiettivo` Costruire la nuova superficie Archivista senza chat, con tipo + contesto + upload + analisi.
- `Cosa vedra l'utente` Una pagina semplice e guidata, coerente con la spec.
- `File probabili coinvolti`
  - nuova pagina IA 2 in `src/next/`
  - `src/next/internal-ai/internal-ai.css`
  - `src/next/components/HomeInternalAiLauncher.tsx`
  - eventuale `src/next/NextIADocumentiPage.tsx` come storico secondario
- `Rischio` Normale.
- `Dipendenze` Fase 1 chiusa.
- `Perche viene prima o dopo` Viene subito dopo la separazione, perche e la prima superficie visibile della V1.

### Nome fase
Motore di estrazione OpenAI a template V1

- `Obiettivo` Portare il backend OpenAI dal prompt magazzino-centrico a 4 template chiari di V1.
- `Cosa vedra l'utente` Analisi coerente con la famiglia scelta, non piu una lettura generica o ibrida.
- `File probabili coinvolti`
  - `backend/internal-ai/server/internal-ai-document-extraction.js`
  - eventuali helper sotto `backend/internal-ai/server/`
  - file client bridge usati dalla nuova IA 2
- `Rischio` Elevato.
- `Dipendenze` Fase 2 chiara, per sapere quali input UI arrivano davvero al backend.
- `Perche viene prima o dopo` Viene dopo la shell, ma prima del salvataggio reale, per non costruire review e writer sopra uno schema ancora sbagliato.

### Nome fase
Review unica e conferma archivio

- `Obiettivo` Mostrare una review stabile con campi, righe, match e scelta finale di archiviazione.
- `Cosa vedra l'utente` Un dossier unico, leggibile e correggibile, con conferma finale.
- `File probabili coinvolti`
  - nuova pagina IA 2
  - eventuali componenti review dedicati sotto `src/next/internal-ai/`
  - `src/next/NextIADocumentiPage.tsx` per lo storico archivio
- `Rischio` Normale.
- `Dipendenze` Fase 3.
- `Perche viene prima o dopo` Viene dopo il motore di extraction, perche deve mostrare campi reali gia corretti.

### Nome fase
Archiviazione confermata delle 4 famiglie V1

- `Obiettivo` Salvare originali e record archivio confermati, senza ancora mischiare tutto con le azioni business.
- `Cosa vedra l'utente` Dopo la conferma, il documento risulta davvero archiviato e riapribile.
- `File probabili coinvolti`
  - nuova pagina IA 2
  - adapter/writer dedicati nel perimetro NEXT
  - `src/utils/cloneWriteBarrier.ts`
  - eventuali domain di archivio documentale in `src/next/domain/`
- `Rischio` Elevato.
- `Dipendenze` Fase 4.
- `Perche viene prima o dopo` Viene prima delle azioni business, per rispettare la regola "prima archivio, poi eventuale azione".

### Nome fase
Secondo passo business solo per i casi V1

- `Obiettivo` Aggiungere le azioni facoltative dopo archiviazione:
  - fattura magazzino -> Magazzino
  - fattura manutenzione -> Manutenzione
  - documento mezzo -> link al mezzo + update campi su conferma
  - preventivo magazzino -> Procurement
- `Cosa vedra l'utente` Un pulsante o una proposta chiara dopo l'archiviazione, non prima.
- `File probabili coinvolti`
  - `src/next/NextMagazzinoPage.tsx`
  - `src/next/NextDossierFatturaToManutenzioneModal.tsx`
  - `src/next/domain/nextManutenzioniDomain.ts`
  - `src/next/NextIALibrettoPage.tsx` o equivalente nuovo flusso mezzo
  - `src/utils/cloneWriteBarrier.ts`
- `Rischio` Elevato.
- `Dipendenze` Fase 5.
- `Perche viene prima o dopo` Viene dopo l'archiviazione, perche la spec chiede che il documento sia prima archiviato e solo dopo possa riflettersi nel business.

### Nome fase
Pulizia dei rami ibridi ancora esposti all'utente

- `Obiettivo` Togliere dal percorso utente i rami che restano utili solo come motore temporaneo o storico tecnico.
- `Cosa vedra l'utente` Un sistema piu semplice, con meno superfici duplicate.
- `File probabili coinvolti`
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/components/HomeInternalAiLauncher.tsx`
  - `src/App.tsx`
  - eventuali pagine IA fuori V1
- `Rischio` Normale.
- `Dipendenze` Fase 1-5 gia stabili.
- `Perche viene prima o dopo` Viene dopo, perche prima serve avere la V1 nuova realmente funzionante.

## 7. Primo blocco sicuro da implementare

- `DECISIONE CONSIGLIATA` Il primo task runtime con miglior rapporto utilita/rischio e:
  - **separazione UI e route di IA 1 e IA 2, con creazione di un ingresso IA 2 pulito**

### Perche questa scelta e la piu sicura

- `FATTO VERIFICATO` Oggi il problema principale non e solo il motore. E la forma del prodotto: una sola pagina ibrida fa sia chat sia archivio (`src/next/NextInternalAiPage.tsx:4242-4247`, `:7580-7799`).
- `FATTO VERIFICATO` Il launcher Home oggi manda tutto verso la stessa pagina (`src/next/components/HomeInternalAiLauncher.tsx:95-126`).
- `DEDUZIONE PRUDENTE` Se si parte subito da template backend o writer nuovi, si costruisce ancora sopra un ingresso sbagliato.
- `DECISIONE CONSIGLIATA` Prima si separa l'esperienza utente. Poi si sostituiscono i pezzi interni con ordine.

### Cosa include questo primo blocco

- ingresso IA 1 distinto
- ingresso IA 2 distinto
- launcher Home riallineato ai due strumenti
- nessuna apertura writer nuova
- nessun cambiamento alla madre
- nessun allargamento generico della barrier

### Cosa non include ancora

- nuovi template di estrazione completi
- nuovo writer archivio definitivo
- seconda azione business delle 4 famiglie

## 8. File che probabilmente verranno toccati nella prima patch

- `src/App.tsx`
  - per dare una route chiara e distinta a IA 2 V1
- `src/next/components/HomeInternalAiLauncher.tsx`
  - per smettere di usare un solo ingresso misto
- `src/next/NextHomePage.tsx`
  - se la Home mostra il launcher o il pannello IA
- `src/next/NextInternalAiPage.tsx`
  - per restringerlo al ruolo corretto di IA 1 oppure per togliere il ruolo improprio di archivista
- `src/next/nextStructuralPaths.ts`
  - per aggiungere il path ufficiale della nuova IA 2
- `src/next/internal-ai/internal-ai.css`
  - per la shell pulita della nuova V1
- un nuovo file pagina in `src/next/`
  - come superficie dedicata dell'Archivista V1

## 9. Cosa resta fuori dalla prima patch

- `preventivo manutenzione`
  - fuori V1 per decisione gia fissata nella spec
- `NextCisternaIAPage`
  - verticale specialistico, oggi bloccato in read-only (`src/next/NextCisternaIAPage.tsx:119-149`)
- `NextEuromeccPage`
  - verticale specialistico con scritture proprie (`src/next/NextEuromeccPage.tsx:2992-3033`, `:3163-3181`)
- `carburante`
  - non ha ancora un archivio documentale pulito nel repo
- `@costiMezzo`
  - non e destinazione primaria V1 e nel repo non emerge un writer additivo reale
- apertura nuova di writer business generici
  - fuori perimetro della prima patch
- sostituzione completa del motore legacy `IADocumenti`
  - troppo presto nella prima patch, se prima non si separa il prodotto

## 10. Rischi veri da non sottovalutare

- `FATTO VERIFICATO` Se si lascia `NextInternalAiPage` come contenitore unico, ogni patch futura continuera a sommare ruoli incompatibili.
- `FATTO VERIFICATO` Se si prova a fare IA 2 V1 direttamente sopra `IADocumenti`, si trascinano dentro Gemini, writer legacy e logica storica.
- `FATTO VERIFICATO` Se si allarga presto la barrier per comodita, si rompe la regola di scritture strette modulo per modulo (`src/utils/cloneWriteBarrier.ts:171-278`).
- `FATTO VERIFICATO` Il backend OpenAI c'e gia, ma il suo prompt documentale attuale non copre ancora bene le 4 famiglie V1 (`backend/internal-ai/server/internal-ai-document-extraction.js:782-843`).
- `DEDUZIONE PRUDENTE` Il rischio piu grosso non e "non avere abbastanza codice". E riusare troppo presto i pezzi sbagliati come prodotto finale.

## 11. Verdetto finale

### PRONTO DA FARE SUBITO

- separare gli ingressi IA 1 e IA 2
- creare una superficie IA 2 pulita e guidata
- smettere di presentare `/next/ia/interna` come risposta a tutto
- usare la spec V1 come criterio di forma, prima ancora delle scritture

### NON ANCORA DA TOCCARE

- aperture writer business ampie
- `@costiMezzo` come target primario
- famiglie fuori V1
- fusione dei verticali specialistici dentro l'Archivista
- sostituzione totale dei motori interni prima di aver separato le superfici

### PRIMO PROMPT RUNTIME CONSIGLIATO

Separare davvero IA 1 e IA 2 nel runtime NEXT.

Tradotto in modo pratico:
- creare un ingresso IA 2 V1 pulito e non chat
- spostare il launcher Home su due strumenti distinti
- lasciare `NextInternalAiPage` al ruolo corretto di IA 1 o comunque togliergli il ruolo improprio di archivista
- non aprire ancora nuove scritture business
