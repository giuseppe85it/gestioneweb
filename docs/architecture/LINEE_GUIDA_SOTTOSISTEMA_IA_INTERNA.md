# LINEE GUIDA SOTTOSISTEMA IA INTERNA

Versione: 2026-03-22  
Stato: baseline architetturale iniziale dopo audit repository, con scaffolding V1 isolato avviato il 2026-03-12  
Scopo: riferimento operativo permanente per progettare una IA interna al gestionale in modo isolato, controllato, reversibile e non distruttivo.

## Regola operativa collegata
- La checklist operativa unica del sottosistema IA interno e `docs/product/CHECKLIST_IA_INTERNA.md`.
- Questo documento definisce principi, vincoli e roadmap; la checklist unica traccia lo stato operativo aggiornato.
- Ogni futuro task relativo alla IA interna deve aggiornare obbligatoriamente la checklist unica; in caso contrario il task e incompleto.

## Legenda
- **CONFERMATO**: dimostrato dal repository o dalla documentazione ufficiale gia presente.
- **RACCOMANDAZIONE**: scelta target consigliata per il sottosistema IA.
- **DA VERIFICARE**: punto aperto non chiudibile con il solo repository.
- **NON TROVATO**: elemento suggerito ma non presente oggi nel repository.

## 1. Obiettivo
- Progettare una IA interna che sembri parte del gestionale ma resti tecnicamente separata dai flussi operativi correnti.
- Consentire analisi, report, preview e proposte di modifica senza toccare direttamente la madre.
- Rendere obbligatori preview, approvazione umana, rollback e audit log per ogni operazione oltre la sola lettura.
- Preparare una base coerente con la UI e con la struttura del clone `/next`, che deve diventare la nuova madre.

## 2. Vincoli non negoziabili
- La madre resta intoccabile.
- La nuova IA non deve diventare dipendenza runtime dei moduli legacy gia in produzione.
- Il browser non deve scrivere direttamente su GitHub, Firestore o Storage per conto della IA.
- Nessuna modifica reale a codice, dati o file senza approvazione umana esplicita.
- Ogni operazione di livello medio o alto deve produrre:
  - preview visibile;
  - riepilogo impatto;
  - audit log;
  - possibilita di rollback.
- Le funzioni IA gia presenti nel repo possono essere lette come riferimento architetturale, non riusate come backend canonico della nuova IA.

## 3. Fatti verificati nel repository
- **Stack applicativo** [CONFERMATO]:
  - frontend React + Vite;
  - Firebase client con Firestore, Functions e Storage;
  - shell legacy e shell clone `/next`.
- **Clone read-only gia esistente** [CONFERMATO]:
  - il clone vive sotto `/next/*`;
  - esiste una barriera scritture clone-safe in `src/utils/cloneWriteBarrier.ts`;
  - esistono wrapper espliciti per mutazioni Firestore/Storage in `src/utils/firestoreWriteOps.ts` e `src/utils/storageWriteOps.ts`.
- **Pattern di lettura normalizzata nella NEXT** [CONFERMATO]:
  - esistono layer dedicati in `src/next/domain/*`;
  - le pagine NEXT possono leggere dati reali senza toccare la madre.
- **Pattern UI riusabili** [CONFERMATO]:
  - shell `src/next/NextShell.tsx`;
  - modal anteprima PDF `src/components/PdfPreviewModal.tsx` e wrapper clone-safe `src/next/NextPdfPreviewModal.tsx`;
  - pipeline preview/export in `src/utils/pdfPreview.ts`.
- **Tracking uso NEXT** [CONFERMATO]:
  - esiste `src/next/nextUsageTracking.ts`;
  - oggi salva solo in `localStorage`;
  - non risulta cablato al runtime attivo.
- **Backend IA/PDF attuale non canonico** [CONFERMATO]:
  - coesistono Cloud Functions HTTP, callable Firebase, Cloud Run esterno e server Express locale/edge;
  - `aiCore` e chiamato dal client ma non risulta esportato nel backend versionato qui;
  - `server.js` usa OpenAI direttamente;
  - molte funzioni backend leggono la chiave Gemini da `@impostazioni_app/gemini`.
- **Sicurezza backend incompleta lato repo** [CONFERMATO]:
  - `firestore.rules` non e presente nel repository;
  - `storage.rules` nel repo blocca tutto, ma il codice usa upload/download/delete reali;
  - l'app entra con `signInAnonymously`.
- **Git remoto verificato** [CONFERMATO]:
  - esiste remote `origin` GitHub sul repository corrente.

## 4. Dove mettere il futuro modulo IA

### 4.1 UI applicativa
- **Perimetro piu sicuro** [RACCOMANDAZIONE]:
  - innestare la UI della IA nella shell clone `/next`;
  - usare una famiglia route dedicata sotto `/next/ia/*` oppure equivalente chiaramente isolata.
- **Perche** [RACCOMANDAZIONE]:
  - il clone ha gia barriere di no-write e isolamento runtime;
  - la shell clone e destinata a diventare la nuova madre;
  - l'innesto non altera la navigazione legacy.

### 4.2 Backend e orchestrazione
- **Perimetro piu sicuro** [RACCOMANDAZIONE]:
  - backend IA separato dai moduli legacy e dalle funzioni IA/PDF gia esistenti;
  - orchestratore centrale dedicato;
  - accesso a GitHub, Firestore e Storage solo da backend e solo con scope mirati.
- **Punto repo scelto per il primo scaffold** [CONFERMATO]:
  - `backend/internal-ai/*`;
  - perimetro top-level dedicato, fuori sia da `src/next/*` sia da `functions/*`, `functions-schede/*`, `api/*`, `server.js`.
- **Divieto operativo** [RACCOMANDAZIONE]:
  - non usare `functions/index.js`, `server.js` o gli endpoint IA attuali come dipendenza canonica del nuovo sottosistema;
  - usarli solo come riferimento per naming, error handling, deployment e organizzazione.
- **Motivazione concreta** [CONFERMATO]:
  - `functions/*` e `functions-schede/*` sono gia runtime legacy attivi, eterogenei e accoppiati a Gemini/Firestore business;
  - `api/*` e `server.js` usano canali OpenAI/env locali non dimostrati come backend canonico del gestionale;
  - un path top-level dedicato consente di definire prima il contratto server-side corretto e solo dopo scegliere un adapter deploy reale.

## 5. Architettura raccomandata

### 5.1 Blocchi logici
| Blocco | Ruolo | Stato nel repo |
|---|---|---|
| UI IA interna | chat, preview, approvazione, archivio | PARZIALE: subtree `/next/ia/interna*` con preview, archivio locale e chat controllata |
| Orchestratore IA | coordina richieste, retrieval, preview, approvazione | PARZIALE: orchestratore locale/mock per intenti sicuri |
| Backend IA separato | canale server-side canonico del nuovo sottosistema IA | PARZIALE: scaffold mock-safe in `backend/internal-ai/*` con manifest, guard rail, dispatcher e handler stub |
| Access layer GitHub | sola lettura repo, branch isolati, PR controllate | NON TROVATO |
| Access layer Firebase | lettura controllata Firestore/Storage via backend | NON TROVATO |
| Codebase intelligence | indicizzazione file, route, componenti, pattern | NON TROVATO |
| Retrieval layer | recupero contesto coerente per domanda/task | NON TROVATO |
| Preview validation environment | genera diff/artefatti prima di applicare | NON TROVATO |
| Approval workflow | approva / chiedi modifiche / scarta | NON TROVATO |
| Rollback manager | revert codice, dati e configurazioni | NON TROVATO |
| Usage tracking persistente | memoria operativa e preferenze | PARZIALE: esiste solo traccia locale NEXT |
| Archivio report e analisi | persistenza ricercabile di report/artifact | PARZIALE: archivio locale isolato nel clone |
| Analytics & prediction engine | anomalie, costi, manutenzioni, alert | NON TROVATO |
| Notification gateway | alert in-app, poi email/WhatsApp | NON TROVATO |

### 5.2 Topologia consigliata
- **Frontend clone** [RACCOMANDAZIONE]:
  - route isolate sotto `/next`;
  - nessun accesso diretto del browser a secret, GitHub write o writer Firestore/Storage della IA.
- **Backend IA dedicato** [RACCOMANDAZIONE]:
  - servizio separato da legacy e da funzioni IA correnti;
  - puo chiamare provider LLM, GitHub e Firebase con identita proprie;
  - espone solo endpoint interni strettamente necessari alla UI IA.
- **Scaffold repo attuale** [CONFERMATO]:
  - il primo scaffold vive in `backend/internal-ai/*`;
  - e framework-agnostico e non decide ancora se il deploy finale sara Cloud Run, Functions wrapper o altro adapter server-side;
  - gli eventuali adapter futuri dovranno incapsulare questo perimetro, non sostituirlo con i canali legacy.
- **Primo ponte attivo nel repo** [CONFERMATO]:
  - la capability `documents-preview` passa ora dalla UI `/next/ia/interna` al dispatcher `backend/internal-ai/*` tramite un bridge mock-safe in-process;
  - il ponte riusa solo letture clone-safe gia attive e mantiene fallback locale esplicito se il backend separato non risponde o non e pronto;
  - non e ancora un adapter HTTP/server reale e non rende canonici `functions/*`, `api/*` o `server.js`.
- **Persistenza IA separata** [RACCOMANDAZIONE]:
  - collezioni/path dedicati per sessioni, richieste, artifact, audit log e tracking;
  - nessuna scrittura diretta sui dataset business finche non esiste un workflow di approvazione e rollback verificato.
- **Stato sicuro oggi verificato nel repo** [CONFERMATO]:
  - il primo livello di persistenza ammesso e un archivio locale isolato e namespaced nel clone;
  - Firestore/Storage dedicati restano da rimandare finche policy effettive e identita reali non sono chiuse.

## 6. Principi di isolamento
- La IA legge il sistema, ma non entra nei writer legacy.
- Il backend IA non deve condividere canali canonici con:
  - `estrazioneDocumenti`
  - `analisi_economica_mezzo`
  - `stamp_pdf`
  - `estraiPreventivoIA`
  - `aiCore`
  - Cloud Run libretto
- Gli artifact della IA devono vivere in contenitori propri.
- Le proposte di codice devono nascere fuori dal working tree produttivo:
  - branch dedicato;
  - diff esplicito;
  - preview prima di ogni applicazione.
- Ogni suggerimento deve mantenere spiegabilita minima:
  - sorgente;
  - periodo;
  - dataset/route/modulo;
  - affidabilita o marcatura `DA VERIFICARE`.

## 7. Livelli di rischio

| Livello | Operazioni ammesse | Regola |
|---|---|---|
| BASSO | lettura repo, lettura Firestore, lettura Storage, sintesi, analisi, suggerimenti | puo essere automatizzato senza side effect |
| MEDIO | generazione preview, generazione report, artifact, branch isolato, query suggerite, simulazioni | richiede preview, audit log e approvazione umana |
| ALTO | merge, scrittura Firestore, scrittura Storage, modifica config, applicazione codice reale | richiede preview, approvazione forte, rollback e audit log |

## 8. Workflow preview / approvazione / rollback
1. L'utente apre la UI IA dal clone.
2. La richiesta viene registrata come sessione e request IA.
3. L'orchestratore recupera contesto:
   - repo;
   - dataset letti;
   - file allegati;
   - preferenze utente note.
4. La IA produce solo una proposta:
   - testo;
   - diff;
   - pagina preview;
   - report;
   - artifact.
5. L'utente puo:
   - approvare;
   - chiedere modifiche;
   - scartare.
6. Solo dopo approvazione:
   - per il codice: branch isolato + diff + PR o patch controllata;
   - per i dati: operazione versionata e reversibile;
   - per i file: upload su path IA dedicati, mai sovrascrittura cieca.
7. Ogni applicazione registra audit log e riferimento di rollback.
8. Ogni rollback deve poter dire:
   - cosa era stato creato;
   - dove;
   - quando;
   - con quale request/sessione;
   - come ripristinare.

## 9. Criteri per leggere repository, dati e file

### 9.1 Repository GitHub
- **Consentito** [RACCOMANDAZIONE]:
  - lettura repository;
  - analisi route, componenti, pattern UI, naming e dipendenze;
  - generazione diff in branch isolato.
- **Non consentito senza approvazione** [RACCOMANDAZIONE]:
  - push su branch protetti;
  - merge automatici;
  - modifiche dirette al working tree di produzione.

### 9.2 Firestore
- **Consentito in V1** [RACCOMANDAZIONE]:
  - sola lettura via backend IA dedicato;
  - preferire dataset gia mappati e letture normalizzate;
  - usare le regole dominio-centriche di `docs/data/DOMINI_DATI_CANONICI.md`.
- **Non consentito in V1** [RACCOMANDAZIONE]:
  - scrittura diretta su dataset business;
  - uso dei writer legacy come scorciatoia.

### 9.3 Firebase Storage
- **Consentito in V1** [RACCOMANDAZIONE]:
  - lettura controllata di file esistenti;
  - salvataggio artifact solo in path IA dedicati e separati.
- **Non consentito in V1** [RACCOMANDAZIONE]:
  - delete su path business;
  - upload in path gia usati dai moduli legacy.

### 9.4 Funzioni IA/PDF gia presenti
- **Uso consentito** [RACCOMANDAZIONE]:
  - studio di naming, logging, regioni, error handling e struttura.
- **Uso non consentito** [RACCOMANDAZIONE]:
  - dipendenza runtime del nuovo sottosistema IA.

## 10. Regole per non toccare la madre
- Nessuna route legacy deve dipendere dalla nuova IA.
- Nessuna collection business attuale deve essere resa dipendente da sessioni o artifact IA.
- Nessuna chiave sensibile deve restare leggibile dal client della nuova IA.
- Nessuna funzione della madre va resa orchestratore canonico del nuovo sottosistema.

## 11. Regole per non rompere la NEXT
- La UI IA deve vivere in aree isolate della shell clone.
- Ogni integrazione con moduli NEXT deve avvenire tramite:
  - route dedicate;
  - componenti wrapper;
  - readers normalizzati;
  - preview non distruttive.
- Il clone deve restare navigabile anche se il backend IA e spento o degradato.
- Le metriche d'uso IA non devono diventare prerequisito per la normale navigazione del clone.

## 12. Pattern UI e componenti riusabili verificati
- **Shell / layout** [CONFERMATO]:
  - `src/next/NextShell.tsx`
  - pattern metadata `src/next/nextData.ts`
- **Preview / export** [CONFERMATO]:
  - `src/components/PdfPreviewModal.tsx`
  - `src/next/NextPdfPreviewModal.tsx`
  - `src/utils/pdfPreview.ts`
- **Pagine ad alto valore come riferimento UI** [CONFERMATO]:
  - `src/pages/Home.tsx`
  - `src/pages/CentroControllo.tsx`
  - `src/pages/DossierMezzo.tsx`
  - `src/pages/AnalisiEconomica.tsx`
- **Pattern read layer nella NEXT** [CONFERMATO]:
  - `src/next/domain/*`
- **Tracking locale come riferimento, non come soluzione finale** [CONFERMATO]:
  - `src/next/nextUsageTracking.ts`

## 13. Use case iniziale di riferimento
**Caso guida**: "Crea una pagina/report per una targa, mostrala in preview dentro il gestionale, salvala come artifact, non applicare nulla in produzione."

### 13.1 Primo blocco capability legacy ad alta priorita gia aperto
- Dal `2026-03-14` il primo assorbimento operativo aperto nel sottosistema IA interno e `Analisi economica mezzo`.
- Il perimetro del primo step e volutamente prudente:
  - preview-first nella home `/next/ia/interna`;
  - sola lettura dei layer clone-safe gia attivi;
  - riuso del solo snapshot legacy gia salvato in `@analisi_economica_mezzi`;
  - nessuna rigenerazione IA dal clone;
  - nessuna scrittura business o Storage.
- La scelta precede `libretto`, `documenti` e `preventivi` perche oggi offre il miglior rapporto tra:
  - valore business;
  - fattibilita immediata nel clone;
  - riuso di layer gia verificati;
  - assenza di upload, OCR o backend legacy da riattivare.

### 13.2 Secondo blocco capability legacy ad alta priorita gia aperto
- Dal `2026-03-22` e aperto anche il primo assorbimento prudente di `Documenti IA`.
- Il perimetro sicuro iniziale del blocco documenti e:
  - preview-first nella home `/next/ia/interna`;
  - sola lettura del layer clone-safe `nextDocumentiCostiDomain`;
  - uso dei soli record gia leggibili con `targa` esplicita o gia normalizzata;
  - distinzione esplicita tra `diretto`, `plausibile` e `fuori perimetro`;
  - nessun OCR reale, nessun upload Storage, nessuna scrittura business.
- Nel primo step il blocco documenti puo leggere solo:
  - `@documenti_mezzi`;
  - record gia mezzo-centrici di `@costiMezzo`;
  - `@documenti_magazzino` e `@documenti_generici` solo come supporto prudenziale quando la targa e gia leggibile nel layer clone-safe.
- Restano esplicitamente fuori perimetro del primo step:
  - runtime legacy `src/pages/IA/IADocumenti.tsx` e `functions/estrazioneDocumenti.js`;
  - `@preventivi` e `@preventivi_approvazioni` come backend canonico del blocco documenti;
  - `@impostazioni_app/gemini`, provider reali e segreti lato client;
  - qualsiasi salvataggio automatico su dataset documentali business.

### 13.3 Terzo blocco capability legacy ad alta priorita gia aperto
- Dal `2026-03-22` e aperto anche il primo assorbimento prudente di `Libretto IA`.
- Il perimetro sicuro iniziale del blocco libretto e:
  - preview-first nella home `/next/ia/interna`;
  - sola lettura dei campi gia presenti sul mezzo in `@mezzi_aziendali`;
  - verifica clone-safe della sola disponibilita del file libretto gia esposto dal clone;
  - distinzione esplicita tra `diretto`, `plausibile` e `fuori perimetro`;
  - nessun OCR reale, nessun upload Storage, nessuna scrittura business.
- Nel primo step il blocco libretto puo leggere solo:
  - campi strutturati gia presenti sul mezzo (`telaio`, `dataImmatricolazione`, `dataScadenzaRevisione`, `dataUltimoCollaudo`, `massaComplessiva`, `librettoUrl`);
  - supporto clone-safe del layer `nextLibrettiExportDomain` per capire se esiste gia copertura file/fallback.
- Restano esplicitamente fuori perimetro del primo step:
  - runtime legacy `src/pages/IA/IALibretto.tsx`;
  - Cloud Run esterno di estrazione libretto;
  - OCR reale, upload foto libretto e scritture su `@mezzi_aziendali` o Storage business;
  - provider reali, segreti lato client e qualsiasi backend legacy come canale canonico.

### 13.4 Quarto blocco capability legacy ad alta priorita gia aperto
- Dal `2026-03-22` e aperto anche il primo assorbimento prudente di `Preventivi IA`.
- Il perimetro sicuro iniziale del blocco preventivi e:
  - preview-first nella home `/next/ia/interna`;
  - sola lettura dei record preventivi gia leggibili nei layer clone-safe documenti/costi;
  - uso del procurement globale solo come supporto separato e diagnostico, non come backend canonico;
  - distinzione esplicita tra `diretto`, `plausibile` e `fuori perimetro`;
  - nessun parsing IA reale, nessun upload Storage, nessuna scrittura business.
- Nel primo step il blocco preventivi puo leggere solo:
  - record gia mezzo-centrici esposti dal layer `nextDocumentiCostiDomain` (`@costiMezzo` e `@documenti_mezzi`);
  - supporti plausibili da `@documenti_magazzino` e `@documenti_generici` solo se gia mappati con targa leggibile nel layer clone-safe;
  - snapshot clone-safe di procurement (`@preventivi`, `@preventivi_approvazioni`) solo come contesto separato e mai come sorgente canonica del blocco.
- Restano esplicitamente fuori perimetro del primo step:
  - runtime legacy `src/pages/Acquisti.tsx` e callable `estraiPreventivoIA`;
  - OCR reale, parsing AI, ingestione nuovi allegati e upload Storage;
  - scritture su `@preventivi`, `@preventivi_approvazioni`, `@documenti_*` o altri dataset business;
  - workflow approvativo, PDF timbrati, provider reali e qualsiasi backend legacy come canale canonico.

### 13.5 Primo ponte frontend -> backend separato gia aperto
- Dal `2026-03-22` il primo ponte attivo tra frontend IA interno e backend IA separato usa la capability `documents-preview`.
- Il canale scelto nel repo attuale e volutamente prudente:
  - bridge in-process sul contratto `orchestrator.preview` del backend separato;
  - nessun endpoint deployato reale;
  - nessun provider o segreto reale;
  - fallback locale esplicito sul facade documenti se il backend mock-safe non e disponibile.
- Il flusso attuale e:
  - UI `/next/ia/interna`;
  - client bridge `internalAiDocumentsPreviewBridge`;
  - dispatcher `backend/internal-ai/src/internalAiBackendService.ts`;
  - handler `orchestrator.preview`;
  - facade clone-safe `documents-preview`;
  - ritorno envelope mock-safe verso la UI.
- Restano ancora solo frontend/mock locale:
  - `report targa`;
  - `report autista`;
  - `report combinato`;
  - `analisi economica`;
  - `libretto`;
  - `preventivi`;
  - chat interna controllata.
- Questo ponte non cambia il backend canonico del progetto:
  - nessun runtime legacy viene riusato;
  - nessuna scrittura business viene aperta;
  - l'adapter server-side reale resta task successivo separato.

### 13.6 Secondo ponte frontend -> backend separato gia aperto
- Dal `2026-03-22` anche la capability `economic-analysis-preview` passa prima dal backend IA separato.
- Il contratto scelto resta `orchestrator.preview`, perche:
  - l'analisi economica preview compone letture clone-safe di piu layer;
  - non e un retrieval generico e non apre alcuna scrittura business;
  - mantiene lo stesso envelope mock-safe e lo stesso fallback locale trasparente del primo ponte.
- Il flusso attuale e:
  - UI `/next/ia/interna`;
  - client bridge `internalAiEconomicAnalysisPreviewBridge`;
  - dispatcher `backend/internal-ai/src/internalAiBackendService.ts`;
  - handler `orchestrator.preview`;
  - facade clone-safe `economic-analysis-preview`;
  - ritorno envelope mock-safe verso la UI.
- Le capability che oggi transitano gia nel backend separato sono:
  - `documents-preview`;
  - `economic-analysis-preview`.
- Restano ancora solo frontend/mock locale:
  - `report targa`;
  - `report autista`;
  - `report combinato`;
  - `libretto`;
  - `preventivi`;
  - chat interna controllata.
- Anche questo secondo ponte non cambia il backend canonico del progetto:
  - nessun provider reale o segreto viene collegato;
  - nessun backend legacy viene riusato come scorciatoia;
  - nessuna scrittura Firestore/Storage business viene aperta.

### 13.7 Terzo e quarto ponte frontend -> backend separato gia aperti
- Dal `2026-03-22` anche le capability `libretto-preview` e `preventivi-preview` passano prima dal backend IA separato.
- Il contratto scelto resta `orchestrator.preview` per entrambe, perche:
  - sono preview-first che compongono letture clone-safe gia esistenti;
  - non sono retrieval generici e non aprono alcuna scrittura business;
  - mantengono lo stesso envelope mock-safe e lo stesso fallback locale trasparente dei ponti precedenti.
- Il flusso attuale e:
  - UI `/next/ia/interna`;
  - client bridge `internalAiLibrettoPreviewBridge` e `internalAiPreventiviPreviewBridge`;
  - dispatcher `backend/internal-ai/src/internalAiBackendService.ts`;
  - handler `orchestrator.preview`;
  - facade clone-safe `libretto-preview` e `preventivi-preview`;
  - ritorno envelope mock-safe verso la UI.
- Le capability che oggi transitano gia nel backend separato sono:
  - `documents-preview`;
  - `economic-analysis-preview`;
  - `libretto-preview`;
  - `preventivi-preview`.
- Restano ancora solo frontend/mock locale:
  - `report targa`;
  - `report autista`;
  - `report combinato`;
  - chat interna controllata.
- Anche questi due ponti non cambiano il backend canonico del progetto:
  - nessun provider reale o segreto viene collegato;
  - nessun backend legacy viene riusato come scorciatoia;
  - nessuna scrittura Firestore/Storage business viene aperta.

### 13.8 Quinto, sesto e settimo ponte frontend -> backend separato gia aperti
- Dal `2026-03-22` anche le capability `vehicle-report-preview`, `driver-report-preview` e `combined-report-preview` passano prima dal backend IA separato.
- Il contratto scelto resta `orchestrator.preview` per tutte e tre, perche:
  - sono report preview-first che riusano facade clone-safe gia attivi nel clone;
  - non sono retrieval generici e non aprono alcuna scrittura business;
  - mantengono lo stesso envelope mock-safe e lo stesso fallback locale trasparente dei ponti precedenti.
- Il flusso attuale e:
  - UI `/next/ia/interna`;
  - client bridge `internalAiVehicleReportPreviewBridge`, `internalAiDriverReportPreviewBridge` e `internalAiCombinedReportPreviewBridge`;
  - dispatcher `backend/internal-ai/src/internalAiBackendService.ts`;
  - handler `orchestrator.preview`;
  - facade clone-safe `vehicle-report-preview`, `driver-report-preview` e `combined-report-preview`;
  - ritorno envelope mock-safe verso la UI.
- Le capability che oggi transitano gia nel backend separato sono:
  - `documents-preview`;
  - `economic-analysis-preview`;
  - `libretto-preview`;
  - `preventivi-preview`;
  - `vehicle-report-preview`;
  - `driver-report-preview`;
  - `combined-report-preview`.
- Resta ancora solo frontend/mock locale:
  - chat interna controllata;
  - lookup/autosuggest di supporto, che restano letture frontend clone-safe e non backend canonico.
- Anche questi tre ponti non cambiano il backend canonico del progetto:
  - nessun provider reale o segreto viene collegato;
  - nessun backend legacy viene riusato come scorciatoia;
  - nessuna scrittura Firestore/Storage business viene aperta.

### 13.9 Ottavo ponte frontend -> backend separato gia aperto
- Dal `2026-03-22` anche la `chat interna controllata` passa prima dal backend IA separato.
- Il contratto scelto e `orchestrator.chat`, perche:
  - la chat e un livello di orchestrazione e routing, non una singola capability preview-first;
  - deve restare backend-first ma mock-safe, senza provider reali, segreti o scritture business;
  - deve mantenere fallback locale esplicito e riusare le capability clone-safe gia aperte nel sottosistema IA.
- Il flusso attuale e:
  - UI `/next/ia/interna`;
  - client bridge `internalAiChatOrchestratorBridge`;
  - dispatcher `backend/internal-ai/src/internalAiBackendService.ts`;
  - handler `orchestrator.chat`;
  - orchestratore controllato della chat interna sopra le capability clone-safe gia disponibili;
  - ritorno envelope mock-safe verso la UI con fallback locale esplicito se il backend separato degrada.
- Le capability che oggi transitano gia nel backend separato sono:
  - `chat-orchestrator`;
  - `documents-preview`;
  - `economic-analysis-preview`;
  - `libretto-preview`;
  - `preventivi-preview`;
  - `vehicle-report-preview`;
  - `driver-report-preview`;
  - `combined-report-preview`.
- Resta ancora solo frontend/mock locale:
  - lookup/autosuggest di supporto, che restano letture frontend clone-safe e non backend canonico;
  - persistenza messaggi chat e tracking locale in memoria, che non diventano backend business in questo step.
- Anche questo ponte non cambia il backend canonico del progetto:
  - nessun provider reale o segreto viene collegato;
  - nessun backend legacy viene riusato come scorciatoia;
  - nessuna scrittura Firestore/Storage business viene aperta.

### 13.10 Primo adapter server-side reale e prima persistenza IA dedicata
- Dal `2026-03-22` il backend IA separato non e piu solo scaffold in-process: esiste un primo adapter server-side reale in `backend/internal-ai/server/internal-ai-adapter.js`.
- Il canale scelto nel repo e:
  - adapter HTTP locale separato dai runtime legacy;
  - base path `/internal-ai-backend/*`;
  - avvio esplicito con `npm run internal-ai-backend:start`;
  - persistenza mock-safe confinata a `backend/internal-ai/runtime-data/*`.
- La prima persistenza server-side vera del sottosistema IA usa solo file JSON locali dedicati:
  - `analysis_artifacts.json` per snapshot artifact/sessioni/richieste/audit IA;
  - `ai_operational_memory.json` per tracking e memoria operativa del modulo IA;
  - `ai_traceability_log.json` per traceability minima lato server.
- Il frontend `/next/ia/interna*` usa ora questo livello server-side solo dove serve:
  - hydration iniziale tramite `internalAiServerPersistenceBridge`;
  - mirror mock-safe di artifact e tracking tramite `internalAiServerPersistenceClient`;
  - fallback locale esplicito se l'adapter non e raggiungibile o non e acceso.
- Questo step non apre ancora retrieval server-side reale dei dati business:
  - i reader preview/chat restano gli stessi layer clone-safe gia attivi;
  - lookup/autosuggest restano supporti frontend/in-process;
  - provider reali, segreti reali, Firestore business, Storage business e backend legacy restano fuori perimetro.

### 13.11 Primo retrieval server-side controllato e read-only
- Dal `2026-03-22` l'adapter server-side del backend IA separato espone anche un primo retrieval read-only su `POST /internal-ai-backend/retrieval/read`.
- Perimetro sicuro iniziale scelto:
  - solo dominio `D01` mezzo-centrico;
  - solo campi gia disponibili su `@mezzi_aziendali`;
  - sola copertura file libretto gia leggibile nel clone;
  - nessuna lettura diretta Firestore o Storage business lato server.
- Il retrieval reale attivo in questo step NON e ancora un retrieval business completo:
  - il backend legge un file locale dedicato `backend/internal-ai/runtime-data/fleet_readonly_snapshot.json`;
  - quello snapshot viene seedato dal clone tramite layer NEXT gia validati;
  - il backend serve poi le letture read-only da quel contenitore IA dedicato.
- La prima capability collegata a questo retrieval e `libretto-preview`:
  - il bridge frontend tenta prima l'adapter server-side;
  - se trova il contesto mezzo nello snapshot IA dedicato, costruisce la preview dal retrieval server-side;
  - se il retrieval non e pronto, resta attivo il fallback `backend_mock_safe` / locale clone-safe.
- Restano fuori perimetro in questo step:
  - letture server-side dirette di Firestore business;
  - letture server-side dirette di Storage business;
  - documenti completi, costi, procurement, preventivi, report combinati e lookup globali lato server;
  - provider reali, segreti, runtime legacy e qualsiasi scrittura business.

### 13.12 Primo provider reale server-side e primo workflow preview/approval/rollback
- Dal `2026-03-22` il backend IA separato puo collegare il primo provider reale solo lato server, solo con segreti server-side e solo per preview/proposte controllate.
- Scelta architetturale:
  - provider: `OpenAI`;
  - API: `Responses API`;
  - modello di default: `gpt-5-mini`, configurabile via `INTERNAL_AI_OPENAI_MODEL`;
  - segreto ammesso: solo `OPENAI_API_KEY` lato server, mai lato client e mai su Firestore business.
- Primo caso d'uso sicuro aperto:
  - sintesi guidata di un report gia letto nel clone;
  - nessuna generazione di nuovi dati business;
  - nessuna applicazione automatica del risultato;
  - nessun riuso dei runtime IA legacy come backend canonico.
- Workflow minimo reale ora aperto:
  1. il frontend invia un report gia letto e strutturato a `POST /internal-ai-backend/artifacts/preview`;
  2. il backend genera solo una preview testuale/proposta;
  3. il backend salva preview, stato richiesta e traceability in `backend/internal-ai/runtime-data/ai_preview_workflows.json`;
  4. il frontend richiede approvazione, rifiuto o rollback via `POST /internal-ai-backend/approvals/prepare`;
  5. il rollback aggiorna solo il workflow IA dedicato, non i dati business.
- Guard rail di questo step:
  - nessuna scrittura Firestore/Storage business;
  - nessun segreto lato client;
  - nessuna applicazione automatica su codice o dati business;
  - se il provider non e configurato, il clone deve ripiegare sui fallback mock-safe gia esistenti.
- Stato reale del repo:
  - il codice del provider server-side e presente nel backend IA separato;
  - nel runner locale la chiamata end-to-end dipende dalla presenza di `OPENAI_API_KEY`;
  - approval e rollback sono comunque verificabili sul contenitore IA dedicato anche senza toccare business data.

### Output minimo richiesto
- analisi sorgenti usate;
- proposta pagina/report coerente con la UI esistente;
- preview nel gestionale;
- artifact persistente ricercabile;
- nessuna modifica a moduli produttivi.

### Passi raccomandati
1. Lettura repository e pattern pagina targa-centrica.
2. Lettura controllata dei dataset necessari.
3. Generazione schema pagina/report.
4. Preview UI.
5. Salvataggio artifact in archivio IA.
6. Nessuna applicazione automatica alla produzione.

## 14. Collezioni e strutture dati suggerite da validare

| Struttura suggerita | Stato nel repo | Uso raccomandato |
|---|---|---|
| `ai_sessions` | NON TROVATO | tracciare sessioni IA e contesto |
| `ai_requests` | NON TROVATO | registrare richieste, prompt, esito |
| `analysis_artifacts` | NON TROVATO | salvare report, preview e output persistenti |
| `analysis_indexes` | NON TROVATO | rendere ricercabili artifact e analisi |
| `ai_code_changes` | NON TROVATO | tracciare diff, branch, PR, stato approvazione |
| `ai_data_operations` | NON TROVATO | tracciare eventuali scritture controllate future |
| `ui_usage_events` | NON TROVATO | tracking persistente pagine/azioni utente |
| `user_operational_profiles` | NON TROVATO | memoria operativa e preferenze |
| `vehicle_analytics_snapshots` | NON TROVATO | snapshot analitici per targa/periodo |
| `system_alerts` | NON TROVATO | alert generati o confermati dalla IA |

## 15. Roadmap logica raccomandata
- **Fase 0**: audit tecnico repo, backend, dati e sicurezza.
- **Fase 1**: fondazione modulo IA isolato, ancora senza attivare feature operative.
- **Fase 2**: UI chat/assistente interna nel clone.
- **Fase 3**: comprensione controllata di codice e dati.
- **Fase 4**: primo use case completo in preview.
- **Fase 5**: approvazione, rollback, audit log.
- **Fase 6**: archivio persistente report e analisi.
- **Fase 7**: tracking operativo personale e memoria.
- **Fase 8**: analytics economiche e operative ad alto valore.
- **Fase 9**: alert automatici in-app e predisposizione notifiche.

## 16. Checklist operativa
- La checklist operativa unica e `docs/product/CHECKLIST_IA_INTERNA.md`.
- Usare quella checklist come fonte di verita per:
  - stato `FATTO`, `IN CORSO`, `NON FATTO`, `BLOCCATO`;
  - retrospettiva dei task gia chiusi;
  - dipendenze e blocchi;
  - filoni futuri, incluso `Modello camion con IA`.
- Questo documento non deve piu ospitare una checklist duplicata da mantenere a mano.

## 17. Mappa permanente delle funzioni IA legacy da assorbire
- La fonte documentale permanente per censire le capability IA legacy della madre e `docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md`.
- Ogni task futuro della nuova IA deve verificare prima se la capability richiesta esiste gia nel legacy e come e stata classificata:
  - `ASSORBIRE`;
  - `ASSORBIRE RIFACENDO`;
  - `FUORI PERIMETRO INIZIALE`;
  - `TENERE COME RIFERIMENTO TECNICO`.
- La mappa legacy serve a non perdere valore della madre, ma non autorizza mai il riuso runtime dei backend, writer o segreti legacy nel nuovo sottosistema IA.
