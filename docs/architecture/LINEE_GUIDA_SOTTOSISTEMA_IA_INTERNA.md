# LINEE GUIDA SOTTOSISTEMA IA INTERNA

Versione: 2026-03-11  
Stato: baseline architetturale iniziale dopo audit repository  
Scopo: riferimento operativo permanente per progettare una IA interna al gestionale in modo isolato, controllato, reversibile e non distruttivo.

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
- **Divieto operativo** [RACCOMANDAZIONE]:
  - non usare `functions/index.js`, `server.js` o gli endpoint IA attuali come dipendenza canonica del nuovo sottosistema;
  - usarli solo come riferimento per naming, error handling, deployment e organizzazione.

## 5. Architettura raccomandata

### 5.1 Blocchi logici
| Blocco | Ruolo | Stato nel repo |
|---|---|---|
| UI IA interna | chat, preview, approvazione, archivio | NON TROVATO come sottosistema dedicato |
| Orchestratore IA | coordina richieste, retrieval, preview, approvazione | NON TROVATO |
| Access layer GitHub | sola lettura repo, branch isolati, PR controllate | NON TROVATO |
| Access layer Firebase | lettura controllata Firestore/Storage via backend | NON TROVATO |
| Codebase intelligence | indicizzazione file, route, componenti, pattern | NON TROVATO |
| Retrieval layer | recupero contesto coerente per domanda/task | NON TROVATO |
| Preview validation environment | genera diff/artefatti prima di applicare | NON TROVATO |
| Approval workflow | approva / chiedi modifiche / scarta | NON TROVATO |
| Rollback manager | revert codice, dati e configurazioni | NON TROVATO |
| Usage tracking persistente | memoria operativa e preferenze | PARZIALE: esiste solo traccia locale NEXT |
| Archivio report e analisi | persistenza ricercabile di report/artifact | NON TROVATO |
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
- **Persistenza IA separata** [RACCOMANDAZIONE]:
  - collezioni/path dedicati per sessioni, richieste, artifact, audit log e tracking;
  - nessuna scrittura diretta sui dataset business finche non esiste un workflow di approvazione e rollback verificato.

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
- [x] Audit iniziale del repository completato.
- [x] Perimetro piu sicuro identificato: UI clone + backend IA separato.
- [x] Divieto formalizzato di riuso runtime delle funzioni IA legacy.
- [ ] Definire ownership del backend IA dedicato.
- [ ] Definire modello autorizzativo e identita utente non anonima.
- [ ] Definire contratti dati di sola lettura ammessi alla V1.
- [ ] Definire collezioni/path IA dedicati.
- [ ] Disegnare workflow preview / approvazione / rollback con audit log.
- [ ] Definire strategia GitHub read-only, branch isolato e PR controllate.
- [ ] Progettare archivio persistente di report e artifact.
- [ ] Progettare tracking persistente, non solo locale.
- [ ] Validare policy Firestore effettive.
- [ ] Validare policy Storage effettive.
- [ ] Validare governance endpoint IA/PDF attuali.
- [ ] Aprire il primo task di scaffolding isolato senza runtime business attivo.

