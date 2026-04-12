# STATO AVANZAMENTO IA INTERNA GESTIONALE

Data audit: 2026-03-11
Ultimo aggiornamento scaffolding: 2026-04-12
Stato generale: USE CASE DOCUMENTALE UNIFICATO ATTIVO NEL CLONE, CAPABILITY PARZIALE
Scopo: fotografia tecnica dello stato attuale del repository e del sottosistema IA interno oggi attivo nel clone/NEXT, con ingresso unico documentale, riuso del motore reale `Documenti IA` e guard-rail ancora espliciti sui rami live non verificati end-to-end.

## 0. Regola operativa
- La fonte operativa unica dello stato IA interno e `docs/product/CHECKLIST_IA_INTERNA.md`.
- Questo documento resta il quadro esteso di contesto, rischi, fasi e fatti verificati.
- Ogni futuro task relativo alla IA interna deve aggiornare obbligatoriamente la checklist unica; se non lo fa, il task e incompleto.

## 0.0 Aggiornamento operativo 2026-04-12 - UI spec `IA Universal Dispatcher` applicata in modo parziale
- esecuzione completata nel solo perimetro autorizzato `HomeInternalAiLauncher.tsx`, `NextInternalAiPage.tsx`, `NextIADocumentiPage.tsx`, `internal-ai.css`, senza toccare orchestrator, writer, barrier, domain o motori legacy;
- Home `/next`:
  - card `Assistente IA` riscritta come launcher unico con prompt, menu `+`, voci attive/in arrivo e link `Storico`;
  - submit prompt verificato davvero -> `/next/ia/interna` con testo precaricato;
  - menu `+` verificato davvero in apertura e sulla voce `Libretto mezzo` -> `/next/ia/libretto`;
- `/next/ia/interna`:
  - shell dispatcher nuova con header, composer, colonna destra funzioni, handoff banner piu compatto e review interna a due colonne sopra il motore documentale esistente;
  - ingresso pulito confermato: la superficie reale non reidrata piu automaticamente gli allegati IA-only persistiti, quindi non compaiono piu banner/chip `fattura mariba.jpeg` di default;
  - `Riapri review` da storico continua ad aprire la review corretta;
- `/next/ia/documenti`:
  - layout riscritto come storico ufficiale read-only basato solo sul domain `readNextIADocumentiArchiveSnapshot()`;
  - filtri e sezioni oggi realmente possibili: `Tutti`, `Fatture`, `Preventivi`, `Da verificare`;
  - `Apri originale` verificato davvero in nuova tab su file reale Storage;
- verifiche tecniche:
  - `npm run build` -> `OK`
  - browser verificato davvero su `/next`, `/next/ia/interna`, `/next/ia/documenti`
  - nessun `Maximum update depth exceeded` osservato in queste verifiche; restano i `403` noti dei listing Storage Firebase
- stato onesto:
  - Home launcher + dispatcher page -> `FATTO`
  - storico ufficiale spec al 100% -> `NON FATTO`
  - task complessivo -> `PARZIALE`, perche lo storico non puo mostrare `Libretti`, `Cisterna`, `Manutenzioni` finche il domain read-only non le espone davvero

## 0.0 Aggiornamento operativo 2026-04-12 - audit stato reale IA interna / documentale
- creato il report principale `docs/audit/AUDIT_IA_INTERNA_STATO_REALE_2026-04-12.md` per fissare in modo semplice e dimostrabile il comportamento reale del sistema oggi attivo;
- verifiche browser eseguite davvero su `/next`, `/next/ia/interna`, `/next/ia/documenti`:
  - la Home apre direttamente `/next/ia/interna`;
  - l'ingresso documentale parte pulito;
  - upload + `Analizza` funzionano davvero e aprono la review;
  - `Apri originale`, `Riapri review`, filtri storico e almeno un ramo `Vai a` sono stati esercitati davvero;
- quadro reale emerso:
  - `/next/ia/interna` e la porta principale;
  - `/next/ia/documenti` e soprattutto storico secondario del motore;
  - il motore documentale reale resta `useIADocumentiEngine()` in `src/pages/IA/IADocumenti.tsx`;
  - le scritture documentali reali esistono nel codice: analisi cloud function, upload Storage, save Firestore, update valuta, import inventario;
  - le scritture IA non business usano `localStorage` namespaced e mirror opzionale su adapter isolato;
- problemi reali ancora aperti:
  - errori `403` sui listing Storage Firebase;
  - ricorrenze `Maximum update depth exceeded`;
- stato onesto:
  - use case documentale base -> `ATTIVO`
  - capability complessiva -> `PARZIALE`
  - separazione piena da motore documentale shared -> `NON FATTO`

## 0.0 Aggiornamento operativo 2026-04-12 - launcher Home riallineato all'ingresso unico
- la Home `/next` non usa piu il modale clone-only `Conversazione rapida dalla Home`;
- il file reale del launcher (`src/next/components/HomeInternalAiLauncher.tsx`) non monta piu `NextInternalAiPage` con `surfaceVariant="home-modal"` e non passa piu `draftPrompt` / `draftAttachments` come stato iniziale della pagina IA;
- la causa strutturale della review sporca lato Home era proprio quel passaggio implicito di stato: con allegati in memoria il modale Home poteva aprire subito proposal/review documento gia popolate;
- la soluzione applicata e piu pulita e coerente col disegno attuale: dalla Dashboard si naviga direttamente a `/next/ia/interna`, che resta l'unico ingresso documentale reale;
- verifiche eseguite nel task:
  - `npx eslint src/next/components/HomeInternalAiLauncher.tsx src/next/NextHomePage.tsx` -> `OK`
  - `npm run build` -> `OK`
  - runtime verificato davvero su `http://localhost:5173/next` con click sul launcher Home, arrivo su `http://localhost:5173/next/ia/interna`, assenza del modale Home e assenza di review sporca / MARIBA aperta di default;
- stato onesto:
  - launcher Home -> `FATTO`
  - ingresso unico documentale `/next/ia/interna` -> confermato come unica entry coerente

## 0.0 Aggiornamento operativo 2026-04-12 - fix mirato barrier su `Analizza`
- patch minima completata nel solo perimetro autorizzato `src/utils/cloneWriteBarrier.ts`;
- il barrier autorizza ora solo il caso stretto `fetch.runtime` con pathname `/next/ia/interna`, metodo `POST` ed endpoint esatto `https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/estrazioneDocumenti`;
- nessuna modifica a `NextInternalAiPage`, `NextIADocumentiPage`, writer business, backend o rules;
- runtime verificato davvero su `http://localhost:5173/next/ia/interna`:
  - upload `audit-fattura-mariba.pdf`;
  - click `Analizza`;
  - `POST` verso `estrazioneDocumenti` partito davvero in network con `200`;
  - review documento aperta correttamente con CTA `Apri originale`, `Vai a Inventario`, `Torna alla home documentale`;
- verifiche tecniche:
  - `npx eslint src/utils/cloneWriteBarrier.ts` -> `OK`
  - `npm run build` -> `OK`
- errori residui osservati ma non corretti in questo task:
  - richieste di listing Storage Firebase `403` gia presenti nel runtime;
  - ricorrenze `Maximum update depth exceeded` durante la review, non bloccanti sul flusso documentale;
- stato onesto:
  - `Analizza` su `/next/ia/interna` -> `SBLOCCATO`
  - `home sporca` -> `NON RIPRODOTTA` nel worktree/runtime correnti

## 0.0 Aggiornamento operativo 2026-04-12 - audit `home sporca` / `Analizza bloccato`
- audit solo diagnostico completato senza patch runtime;
- il worktree/runtime corrente non riproduce una review sporca di default su `/next/ia/interna`:
  - browser verificato davvero su `http://localhost:5173/next/ia/interna` e sulla preview `4174`, sempre con home pulita e nessuna query;
  - `NextInternalAiPage.tsx` oggi parte con `documentWorkspaceTab = "inbox"` e `openedHistoryDocumentId = null`;
  - la sola riapertura automatica dimostrata passa da `reviewDocumentId` / `reviewSourceKey` letti da `location.search`, generati da `Riapri review` in `NextIADocumentiPage.tsx` e poi rimossi dalla URL;
  - non emergono `localStorage` o `sessionStorage` documentali che riaprano la review; i soli storage locali letti nel browser sono `@next_internal_ai:universal_requests_v1`, `@next_internal_ai:tracking_memory_v1`, `@next_internal_ai:artifact_archive_v1`, nessuno dei quali contiene `reviewDocumentId`;
- `Analizza` nel clone e invece bloccato in modo reale e dimostrabile:
  - con file caricato il bottone si abilita davvero, quindi il problema non e sul `disabled`;
  - `src/pages/IA/IADocumenti.tsx` chiama ancora il `POST` legacy verso `estrazioneDocumenti`;
  - `src/main.tsx` installa sempre `installCloneFetchBarrier()`;
  - `src/utils/cloneWriteBarrier.ts` intercetta il `POST` come `fetch.runtime` e lancia `CloneWriteBlockedError` prima che la rete parta;
  - console e network browser confermano warning `[CLONE_NO_WRITE]`, stack reale sul barrier e assenza del `POST` verso `estrazioneDocumenti`;
- stato onesto:
  - `home sporca` nel worktree corrente -> `NON RIPRODOTTA`
  - `Analizza` nel clone -> `BLOCCATO` dal barrier globale
- follow-up minimo consigliato:
  - nessuna patch urgente sulla home finche non emerge un chiamante che entri con query sporca;
  - per `Analizza` serve una decisione esplicita: UI clone-safe onesta oppure apertura mirata del trasporto consentito con modifica deliberata del barrier / backend.

## 0.0 Aggiornamento operativo 2026-04-12 - fix ingresso, layout desktop e destinazioni documentali
- `/next/ia/interna` non riapre piu review persistite di default: l'ingresso torna sempre alla home documentale pulita con upload, tipo atteso, motore `Documenti IA`, `Analizza`, `Apri storico`.
- la review desktop e ora viewport-fit nel perimetro della shell NEXT:
  - header compatto sempre visibile;
  - page-scroll desktop bloccato solo in review attiva;
  - 3 colonne con scroll interni;
  - CTA `Apri originale`, destinazione e `Torna alla home documentale` sempre visibili;
- le destinazioni reali sono state riallineate al business finale senza inventare scorciatoie:
  - fattura magazzino -> `/next/magazzino?tab=inventario`
  - fattura manutenzione -> `/next/manutenzioni?targa=<targa>`
  - preventivo per targa -> `/next/dossier/<targa>#preventivi`
  - `Da verificare` -> review documento su `/next/ia/interna` via query `reviewDocumentId`
- `NextManutenzioniPage.tsx` e `NextDossierMezzoPage.tsx` hanno ricevuto solo il minimo supporto route/query/hash necessario per il deep-link corretto, senza toccare la logica business dei moduli.
- verifiche eseguite nel task:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/NextIADocumentiPage.tsx src/pages/IA/IADocumenti.tsx src/next/NextManutenzioniPage.tsx src/next/NextDossierMezzoPage.tsx src/next/nextStructuralPaths.ts` -> `OK`
  - `npx eslint src/next/internal-ai/internal-ai.css` -> warning noto: file ignorato dalla config ESLint del repo
  - `npm run build` -> `OK`
  - runtime verificato su `/next/ia/interna`, `/next/ia/documenti`, `/next/magazzino?tab=inventario`, `/next/manutenzioni?targa=TI324623`, `/next/dossier/TI313387#preventivi`
- stato onesto del ramo:
  - entry state pulito + review viewport-fit + target finali -> `FATTO`
  - nuovi upload live end-to-end e record storico live `Da verificare` -> `DA VERIFICARE`

## 0.1 Aggiornamento operativo 2026-04-12 - ingresso unico documentale unificato
- `/next/ia/interna` e ora l'ingresso unico documentale della NEXT: upload, tipo atteso, motore `Documenti IA`, tab `Inbox`, `Da verificare`, `Salvati`, `Chat IA`, review documento a 3 colonne e storico filtrabile.
- la chat resta disponibile ma e secondaria rispetto al workflow documentale.
- il motore reale non e stato riscritto: `src/pages/IA/IADocumenti.tsx` espone ora `useIADocumentiEngine()` e la NEXT lo riusa per upload, preview, analisi, apertura originale, storico, valuta, salvataggi e import inventario gia esistenti.
- `/next/ia/documenti` non e stato rimosso ma declassato a superficie secondaria/storico del motore reale, con CTA verso `/next/ia/interna`.
- verifiche eseguite nel task:
  - `npx eslint src/pages/IA/IADocumenti.tsx src/next/NextInternalAiPage.tsx src/next/NextIADocumentiPage.tsx` -> `OK`
  - `npm run build` -> `OK`
  - runtime verificato su `/next/ia/interna` e `/next/ia/documenti`
  - storico reale aperto, `Riapri review` funzionante, `Vai al dossier` funzionante su `/next/dossier/TI313387`, `Apri originale` funzionante in tab separata.
- stato onesto del ramo:
  - integrazione UI + motore reale: `FATTO`
  - verifica end-to-end live di tutti i rami finali con nuovi file: `DA VERIFICARE`

## 1. Perimetro analizzato
- Documentazione:
  - `docs/STATO_ATTUALE_PROGETTO.md`
  - `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
  - `docs/product/STORICO_DECISIONI_PROGETTO.md`
  - `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
  - `docs/data/DOMINI_DATI_CANONICI.md`
  - `docs/data/REGOLE_STRUTTURA_DATI.md`
  - `docs/security/SICUREZZA_E_PERMESSI.md`
  - `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`
  - `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
  - `docs/audit/VERIFICA_INFRASTRUTTURA_FIREBASE_BACKEND.md`
- Runtime/app:
  - `package.json`
  - `firebase.json`
  - `src/App.tsx`
  - `src/main.tsx`
  - `src/pages/Home.tsx`
  - `src/pages/CentroControllo.tsx`
  - `src/pages/GestioneOperativa.tsx`
  - `src/pages/IA/*`
  - `src/next/*`
  - `src/next/domain/*`
  - `src/utils/storageSync.ts`
  - `src/utils/cloneWriteBarrier.ts`
  - `src/utils/firestoreWriteOps.ts`
  - `src/utils/storageWriteOps.ts`
  - `src/utils/pdfPreview.ts`
  - `src/utils/aiCore.ts`
- Backend:
  - `functions/index.js`
  - `functions/*.js`
  - `functions-schede/*.js`
  - `server.js`
- Controlli aggiuntivi:
  - `git remote -v`
  - ricerche testuali su endpoint IA/PDF, preview, audit log, tracking, upload/delete.

## 2. Fatti verificati nel repo

### 2.1 Frontend e shell
- Il gestionale usa React + Vite.
- Esistono due superfici reali:
  - legacy/madre;
  - clone `/next/*`.
- Il clone ha gia shell, gating e barriere no-write dedicate.

### 2.2 Dati e access layer
- Il gestionale legge e scrive Firestore in modo misto:
  - wrapper `storageSync` su `storage/<key>`;
  - collection dedicate come `@documenti_*`, `@analisi_economica_mezzi`, `@impostazioni_app`.
- Il repo non include `firestore.rules`.
- `storage.rules` nel repo blocca tutto, ma il codice usa upload/download/delete/listAll su molti path reali.
- Il clone dispone di wrapper espliciti per bloccare mutazioni e di readers normalizzati sotto `src/next/domain/*`.

### 2.3 IA e PDF gia presenti
- Esiste una famiglia IA legacy con pagine dedicate:
  - `IAHome`
  - `IAApiKey`
  - `IALibretto`
  - `IADocumenti`
  - `IACoperturaLibretti`
- Esiste una famiglia clone corrispondente read-only sotto `/next/ia/*`.
- Le funzioni/backend IA oggi non hanno un canale unico canonico:
  - callable Firebase (`aiCore`, `estraiPreventivoIA`);
  - HTTP Cloud Functions (`estrazioneDocumenti`, `analisi_economica_mezzo`, `stamp_pdf`, cisterna);
  - Cloud Run esterno per libretto;
  - server Express/OpenAI locale o edge non dimostrato come canale attivo;
  - esiste ora un backend IA separato dedicato in `backend/internal-ai/*` con adapter server-side proprio, che resta il solo canale candidato del nuovo sottosistema IA interno.

### 2.4 Preview, export e artifact
- Il repo ha gia un pattern forte di preview PDF:
  - `PdfPreviewModal`
  - `openPreview`
  - download/share/copia link/WhatsApp
- Esiste ora un primo archivio persistente locale e isolato del clone per gli artifact IA.
- Esiste ora un primo archivio persistente server-side separato e ricercabile nel contenitore IA dedicato `backend/internal-ai/runtime-data/*`.
- Esiste ora un primo workflow reale `preview/approvazione/rifiuto/rollback`, ma limitato agli artifact IA dedicati e non applicato a codice o dati business.

### 2.5 Tracking e memoria operativa
- Esiste `src/next/nextUsageTracking.ts`.
- Oggi salva solo in `localStorage`.
- Non risulta collegato al runtime attivo.
- Esiste ora una prima memoria operativa persistente locale del sottosistema IA interno, confinata al clone e non collegata al gestionale globale.

### 2.6 Sicurezza e segreti
- L'app entra con auth anonima.
- La chiave Gemini e letta e scritta dal client su `@impostazioni_app/gemini`.
- Questo rende improprio usare il sistema IA attuale come fondazione del nuovo sottosistema.

### 2.7 Repository remoto
- Il repository ha remote GitHub verificato su `origin`.
- Nel repo non e dimostrata una strategia GitHub App, token service-to-service o branch automation dedicata alla futura IA.

## 3. Decisione raccomandata su dove innestare la IA
- **UI piu sicura**: dentro il clone `/next`, non nella madre.
- **Route/famiglia piu sicura**: una area isolata sotto `/next/ia/*` oppure naming equivalente, distinta dai moduli legacy.
- **Backend piu sicuro**: servizio IA dedicato e separato dalle funzioni IA/PDF gia deployate.
- **Lettura dati piu sicura**:
  - backend IA -> readers controllati -> UI IA;
  - non browser -> writer legacy.
- **Accesso GitHub piu sicuro**:
  - sola lettura in V1;
  - generazione diff/branch isolati solo in fase successiva e sempre con approvazione.

## 4. Motivazione tecnica
- Il clone e gia il perimetro con piu protezioni applicative verificabili.
- La madre ha molti writer diretti e flussi legacy accoppiati; innestare li la nuova IA aumenterebbe il rischio di regressione.
- Le funzioni IA esistenti non sono omogenee ne canoniche, quindi non sono una base affidabile per il nuovo sottosistema.
- La UI e i pattern di preview gia esistono e possono essere riusati senza accendere nuove scritture.
- I layer `src/next/domain/*` sono il precedente piu pulito per leggere dati reali con normalizzazione controllata.

## 5. Rischi principali

| Rischio | Gravita | Stato |
|---|---|---|
| Riutilizzare funzioni IA/PDF legacy come backend canonico | Alta | DA EVITARE |
| Scritture dirette su dataset business senza approval workflow | Alta | DA EVITARE |
| Gestire segreti IA dal client come oggi | Alta | BLOCCANTE |
| Basarsi su policy Firestore effettive non versionate nel repo | Alta/Critica | DA VERIFICARE |
| Basarsi su Storage rules del repo come verita deployata | Critica | DA VERIFICARE |
| Fondere IA Business e IA Audit Tecnico nella stessa runtime | Alta | DA EVITARE |
| Considerare sufficiente il tracking locale `nextUsageTracking.ts` | Media | INSUFFICIENTE |
| Salvare artifact IA nei path Storage business esistenti | Alta | DA EVITARE |

## 6. Blocchi fattibili subito in sicurezza
- Documentazione di governo e checklist.
- Mappa tecnica delle superfici IA riusabili:
  - shell clone;
  - preview modals;
  - readers NEXT;
  - layout/report pattern.
- Definizione dei contratti documentali per:
  - sessioni IA;
  - richieste IA;
  - artifact;
  - audit log;
  - tracking uso.
- Scaffolding architetturale non operativo, separato dal runtime legacy.
- Scaffolding isolato non operativo sotto `/next/ia/interna*` con types, contracts stub, repository mock, artifact archive mock e tracking in-memory.
- Definizione del primo use case limitato a preview e artifact, senza applicazioni in produzione.

## 7. Blocchi da rimandare
- Qualunque backend IA attivo su produzione.
- Qualunque riuso runtime delle funzioni IA/PDF gia presenti.
- Qualunque scrittura automatica su Firestore/Storage business.
- Qualunque merge automatico su GitHub.
- Qualunque uso di segreti IA dal client.
- Qualunque decisione finale su ruoli/permessi finche non si chiude la matrice sicurezza.

## 8. Dipendenze e mancanze da chiudere
- Policy Firestore effettive.
- Policy Storage effettive.
- Ownership e canale canonico backend IA/PDF.
- Strategia segreti lato server.
- Permission model reale oltre l'auth anonima.
- Contratto di persistenza per artifact, audit log e tracking.
- Strategia GitHub read-only e poi branch/PR.
- Definizione di cosa puo essere letto direttamente e cosa deve passare da snapshot o index.

## 9. Collezioni e moduli suggeriti da validare

### 9.1 Collezioni/strutture
| Nome suggerito | Stato nel repo | Nota |
|---|---|---|
| `ai_sessions` | NON TROVATO | da progettare come contenitore sessioni |
| `ai_requests` | NON TROVATO | da progettare come log richieste |
| `analysis_artifacts` | NON TROVATO | da progettare per report/preview persistenti |
| `analysis_indexes` | NON TROVATO | da progettare per ricerca per targa/autista/periodo/tag |
| `ai_code_changes` | NON TROVATO | da progettare per diff/branch/PR |
| `ai_data_operations` | NON TROVATO | da progettare per future operazioni dati controllate |
| `ui_usage_events` | NON TROVATO | il repo ha solo tracking locale, non persistente |
| `user_operational_profiles` | NON TROVATO | da progettare per memoria operativa |
| `vehicle_analytics_snapshots` | NON TROVATO | da progettare per snapshot spiegabili e versionati |
| `system_alerts` | NON TROVATO | oggi esiste `@alerts_state`, non un modulo IA dedicato |

### 9.2 Moduli logici
| Modulo suggerito | Stato nel repo | Nota |
|---|---|---|
| ai-orchestrator | PARZIALE | esiste un orchestratore locale/mock per intenti sicuri nel clone, non un backend dedicato |
| ai chat handler | PARZIALE | esiste una chat locale controllata nel subtree IA interno, senza LLM reale |
| github integration | NON TROVATO | remote presente, integrazione sicura assente |
| firebase access layer dedicato IA | NON TROVATO | esistono solo readers/writers legacy o clone-safe generici |
| codebase intelligence | NON TROVATO | da progettare |
| retrieval layer | NON TROVATO | da progettare |
| preview validation environment | NON TROVATO | esistono pattern preview PDF, non preview codice/dati IA |
| approval workflow | NON TROVATO | da progettare |
| rollback manager | NON TROVATO | da progettare |
| usage tracking persistente | PARZIALE | esiste ora memoria/track persistente solo locale del subtree IA interno |
| analytics & prediction engine | NON TROVATO | da progettare |
| notification gateway | NON TROVATO | predisposizione futura, non verificata |

## 10. Stato per fase

| Fase | Descrizione | Stato |
|---|---|---|
| 0 | ricognizione tecnica del progetto e delle funzioni esistenti | FATTO |
| 1 | fondazione del modulo IA isolato | AVVIATO |
| 2 | chat IA interna nel gestionale | AVVIATO |
| 3 | comprensione codice e dati via sottosistema dedicato | AVVIATO |
| 4 | primo use case completo in preview | AVVIATO |
| 5 | preview, approvazione e rollback | BLOCCATO |
| 6 | archivio persistente report e analisi | IN CORSO |
| 7 | tracking operativo personale | AVVIATO |
| 8 | analytics economiche e operative | BLOCCATO |
| 9 | alert automatici | BLOCCATO |

## 11. Prossimi passi consigliati
1. Formalizzare il perimetro V1:
   - UI clone;
   - backend IA separato;
   - nessuna scrittura business.
2. Disegnare i contratti dei contenitori IA isolati:
   - sessioni;
   - richieste;
   - artifact;
   - audit log;
   - tracking.
3. Progettare il primo use case completo:
   - report per targa;
   - preview in-app;
   - salvataggio artifact;
   - nessuna applicazione in produzione.
4. Chiudere i blocchi infrastrutturali aperti:
   - policy Firestore;
   - policy Storage;
   - ownership backend IA/PDF;
   - strategia segreti.
5. Solo dopo aprire un task separato di scaffolding tecnico non operativo.

## 12.1 Aggiornamento 2026-03-12
- Creato il subtree clone `/next/ia/interna*` come primo scaffolding del sottosistema IA interno.
- Predisposti model/types locali per `ai_sessions`, `ai_requests`, `analysis_artifacts`, `ai_audit_log` e stati di preview/approval, senza writer reali.
- Predisposti contratti stub per orchestrator, retrieval, artifact repository, audit log e approval workflow.
- Predisposto tracking d'uso isolato e solo in-memory, non globale e non persistente.
- L'archivio artifact e incluso solo come shell/model/mock repository locale; la persistenza reale resta rimandata.
- Confermato il vincolo di non riusare a runtime backend IA/PDF legacy e di non introdurre segreti lato client.

## 12.2 Aggiornamento 2026-03-12
- Attivato il primo use case reale ma sicuro del sottosistema IA interno: report per targa in anteprima dentro `/next/ia/interna`.
- La preview riusa solo il composito read-only del Dossier NEXT e i suoi layer gia normalizzati, senza leggere dati grezzi extra e senza introdurre writer.
- La UI espone:
  - ricerca targa;
  - stato di caricamento;
  - esito non trovato;
  - sezioni del report;
  - fonti lette;
  - dati mancanti;
  - bozza simulata locale.
- Il salvataggio del risultato resta confinato al repository mock del sottosistema IA e non tocca Firestore/Storage business.
- Tutti i testi visibili del subtree IA interno sono in italiano.

## 12.3 Aggiornamento 2026-03-12
- Attivata la prima chat interna controllata del sottosistema IA dentro `/next/ia/interna`, con UI coerente col gestionale e orchestratore solo locale/mock.
- Gli intenti oggi realmente supportati sono:
  - aiuto/capacita del modulo;
  - report targa in anteprima;
  - risposta trasparente alle richieste non supportate o non sicure.
- Il report targa via chat riusa il facade read-only gia introdotto e aggiorna la stessa area preview/artifact del sottosistema IA interno.
- I messaggi della chat restano solo in memoria nella pagina corrente; non esiste persistenza business e non esiste backend IA reale.

## 12.4 Aggiornamento 2026-03-12
- Creata la checklist unica `docs/product/CHECKLIST_IA_INTERNA.md` come fonte di verita operativa del sottosistema IA interno.
- La checklist ricostruisce retroattivamente:
  - audit architetturale;
  - decisione di innesto lato clone/NEXT;
  - linee guida;
  - stato avanzamento;
  - scaffolding isolato;
  - model/types;
  - contracts/repository mock;
  - tracking sicuro;
  - fix crash tracking snapshot;
  - primo use case report targa in anteprima.
- Inserito anche il blocco futuro `Modello camion con IA`, registrato allo stato `NON FATTO`.
- Da ora in poi ogni task IA futura deve aggiornare obbligatoriamente la checklist unica.

## 12.5 Aggiornamento 2026-03-12
- Verificata come non sicura, allo stato del repo, una persistenza reale su Firestore o Storage per l'archivio artifact IA:
  - `firestore.rules` assente nel repository;
  - policy Storage effettive non dimostrate;
  - auth anonima ancora attiva.
- Scelta quindi la soluzione piu isolata e sicura disponibile oggi: archivio artifact persistente solo locale, namespaced e confinato al clone `/next/ia/interna*`.
- Il use case `report targa in anteprima` salva ora il risultato come artifact IA nell'archivio locale dedicato, senza toccare dataset business.
- L'archivio distingue in modo esplicito `preview`, `draft` e `archiviato`, e permette di riaprire gli artifact che includono una preview report.
- La persistenza server-side separata resta rimandata finche non si chiudono policy, identity e contratto dati dedicato.

## 12.6 Aggiornamento 2026-03-12
- Rafforzata la ricerca mezzo del use case `report targa in anteprima` con lettura read-only delle targhe reali dal layer `D01 Anagrafiche flotta e persone`.
- La UI di `/next/ia/interna` mostra ora autosuggest targhe reali mentre si scrive, con contesto minimo gia disponibile nel reader pulito:
  - targa;
  - marca/modello;
  - categoria;
  - eventuale autista risolto dal layer anagrafico.
- Il flusso distingue in modo esplicito:
  - input vuoto;
  - nessuna corrispondenza;
  - corrispondenza precisa;
  - corrispondenza possibile da selezionare;
  - mezzo selezionato con anteprima che puo comunque avere sezioni mancanti.
- La generazione anteprima parte ora solo da mezzo selezionato o da match esatto, riducendo errori di digitazione e ricerche ambigue.
- La chat interna mock non e stata riallineata a questo autosuggest nello stesso task, per mantenere separati i perimetri delle patch.

## 12.7 Aggiornamento 2026-03-13
- Introdotta la prima memoria operativa locale del sottosistema IA interno, con persistenza namespaced su `localStorage` dedicato e fallback implicito alla sola RAM se il browser non consente scrittura locale.
- La memoria conserva solo elementi del perimetro IA:
  - ultime targhe e ultimi autisti cercati;
  - richieste recenti della chat interna;
  - artifact recenti aperti, salvati o archiviati;
  - intenti usati e relativo conteggio;
  - ultimo stato di lavoro del modulo.
- Il tracking resta confinato alle sole azioni del subtree `/next/ia/interna*`:
  - apertura sezione;
  - selezione targa e selezione autista;
  - esecuzione report targa e report autista;
  - invio prompt chat;
  - apertura/salvataggio/archiviazione artifact.
- Nessuna pagina fuori dal modulo IA viene tracciata e nessun dataset business viene toccato.
- La UI overview mostra ora una sezione minima di memoria recente per rendere il modulo piu pratico da riaprire, senza trasformarlo in memoria operativa completa del gestionale.

## 12.8 Aggiornamento 2026-03-13
- Esteso il primo use case IA interno oltre la sola targa introducendo un secondo flusso separato per autista reale.
- Il lookup autisti usa come fonte primaria il layer clone-safe `readNextColleghiSnapshot()` su `storage/@colleghi`, gia normalizzato e read-only nel clone.
- La preview `report autista` combina solo fonti gia presenti nel clone:
  - anagrafica colleghi per i dati base;
  - anagrafiche flotta per i mezzi associati;
  - layer `D10 Centro Controllo` per eventuale ultimo mezzo noto e segnali operativi;
  - layer `D04 Rifornimenti` per eventuali rifornimenti collegabili all'autista sui mezzi associati.
- La UI di `/next/ia/interna` espone ora due flussi distinti e visivamente separati:
  - `Anteprima report per targa`;
  - `Anteprima report per autista`.
- Il report autista mostra in modo esplicito:
  - fonti lette;
  - dati mancanti;
  - stato di copertura;
  - differenza rispetto al report targa.
- La chat mock e stata riallineata in modo minimo e pulito:
  - riconosce richieste come `fammi un report per l'autista Mario Rossi`;
  - non introduce backend reale, provider IA o scritture business.
- Artifact locale e tracking del sottosistema IA distinguono ora anche report e ricerche di tipo autista.

## 12.9 Aggiornamento 2026-03-13
- I report read-only del sottosistema IA supportano ora un contesto periodo condiviso tra flusso targa e flusso autista.
- Il modello periodo espone:
  - preset `Tutto`;
  - `Ultimi 30 giorni`;
  - `Ultimi 90 giorni`;
  - `Ultimo mese`;
  - intervallo personalizzato `Da / A`.
- Il filtro viene applicato davvero solo alle sezioni che espongono date leggibili nei layer gia usati dal clone:
  - report targa: lavori, manutenzioni, rifornimenti, documenti/costi;
  - report autista: segnali operativi D10 e rifornimenti collegabili.
- Le sezioni non temporali o con copertura data non abbastanza uniforme restano visibili ma vengono marcate in preview come:
  - `Nessun filtro`;
  - `Fuori filtro`;
  - `Periodo non disponibile`;
  - `Filtro applicato`.
- La UI `/next/ia/interna` mostra ora il periodo attivo, consente preset rapidi e intervallo personalizzato, e riporta il periodo anche negli artifact locali e nella memoria recente del modulo.
- La chat mock puo interpretare richieste con periodo esplicito (`ultimi 30 giorni`, `ultimi 90 giorni`, `ultimo mese`, `dal ... al ...`) e, se il prompt non specifica nulla, riusa il periodo attivo nella UI guidata del modulo.
- Nessun dataset business, nessun backend IA reale e nessun runtime legacy IA vengono coinvolti da questa estensione.

## 12.10 Aggiornamento 2026-03-13
- Il subtree `/next/ia/interna*` supporta ora anche una preview combinata `mezzo + autista + periodo`, separata dai report singoli ma costruita sopra gli stessi facade read-only.
- La nuova preview:
  - riusa il report mezzo gia filtrato;
  - riusa il report autista gia filtrato;
  - aggiunge solo il matching trasparente fra i due perimetri, basato su `D01` per il legame anagrafico e su `D10` / `D04` per l'intersezione reale nel periodo.
- Il livello di affidabilita del legame mezzo-autista viene dichiarato in modo esplicito:
  - `forte` solo con match `autistaId` sul mezzo;
  - `plausibile` con nome dichiarato sul mezzo o segnali compatibili D10/D04;
  - `non dimostrabile` quando il repo non mostra ancora un legame leggibile.
- La UI overview mostra un blocco dedicato `Anteprima report combinato mezzo + autista`, che riusa le selezioni guidate gia attive per mezzo, autista e periodo.
- La memoria locale del modulo e il tracking isolato distinguono ora anche le ultime coppie mezzo/autista analizzate.
- La chat mock e stata riallineata in modo minimo e pulito per riconoscere richieste come:
  - `fammi report mezzo TI123456 con autista Mario Rossi ultimi 30 giorni`;
  - `analizza Mario Rossi sul mezzo TI123456`.
- Nessuna scrittura Firestore/Storage business, nessun backend IA reale, nessun riuso runtime IA legacy e nessun segreto lato client vengono introdotti da questa estensione.

## 12.11 Aggiornamento 2026-03-13
- L'archivio artifact locale del sottosistema IA e stato esteso in archivio intelligente consultabile, sempre confinato al clone `/next/ia/interna*`.
- Gli artifact locali mantengono retrocompatibilita con quelli gia salvati e vengono ora arricchiti con metadati filtrabili e scalabili:
  - tipo report;
  - stato artifact;
  - targa e autista;
  - periodo;
  - ambiti/famiglie derivate dai dataset letti;
  - testo sintetico ricercabile;
  - affidabilita del matching per i report combinati.
- La UI archivio espone ora:
  - barra di ricerca libera;
  - filtri combinabili per tipo, stato, ambito, targa, autista e periodo;
  - ordinamento per aggiornamento piu recente;
  - badge chiari per tipo report, stato e ambito;
  - azione `Riapri report` che ripristina la preview corretta nel modulo principale.
- La memoria locale del modulo IA conserva anche:
  - ultima ricerca archivio;
  - ultimi filtri archivio usati;
  - ultimo artifact riaperto.
- Le famiglie/ambiti vengono assegnati solo quando sono ricavabili dai dataset gia letti dai report esistenti:
  - `manutenzioni`, `rifornimenti`, `costi`, `documenti`, `operativo`;
  - `misto` quando il report copre piu famiglie;
  - `non classificato` quando i metadati non consentono una classificazione piu precisa.
- Nessuna scrittura Firestore/Storage business, nessun backend IA reale, nessun riuso runtime IA legacy e nessun impatto sui flussi correnti vengono introdotti da questa estensione.

## 12.12 Aggiornamento 2026-03-13
- Eseguito audit strutturale mirato sulle logiche di lettura/incrocio dati del sottosistema IA interno, con focus su:
  - report mezzo;
  - report autista;
  - report combinato;
  - filtri periodo;
  - lookup mezzo/autista;
  - chat mock.
- Punti risultati strutturalmente solidi:
  - riuso dei layer NEXT read-only gia verificati invece di letture raw in pagina;
  - filtro periodo centralizzato e condiviso;
  - separazione esplicita tra copertura completa, parziale e non filtrabile;
  - report combinato che mantiene distinta l'affidabilita del legame mezzo-autista.
- Punti deboli confermati dall'audit:
  - il matching badge/nome nei facade autista e combinato resta prudente ma ancora rigido, quindi puo perdere record quando badge e nome non sono coerenti tra D04 e D10;
  - il lookup/autista e alcuni fallback nome restano sensibili a possibili omonimie;
  - il contesto mezzi dell'autista resta piu completo nel blocco rifornimenti che nell'intestazione anagrafica del report.
- Fix minimo applicato subito nello stesso task:
  - la chat mock ora ripulisce correttamente il suffisso periodo dalle richieste autista (`ultimo mese`, `ultimi 30 giorni`, `dal ... al ...`) prima del lookup esatto, evitando un falso `not found` a monte.
- Nessuna scrittura Firestore/Storage business, nessun backend IA reale, nessun riuso runtime IA legacy e nessun impatto sui flussi correnti vengono introdotti da questo audit.

## 12.13 Aggiornamento 2026-03-13
- Il matching identita autista del sottosistema IA interno segue ora una regola badge-first unica e riusabile tra:
  - D01 anagrafiche persone/flotta;
  - D10 Centro Controllo;
  - D04 rifornimenti.
- La gerarchia effettiva del matching e ora:
  - `autistaId` sul mezzo o badge coerente nel record = match forte;
  - nome esatto solo come fallback plausibile, quando il riferimento forte manca davvero;
  - badge o `autistaId` incoerenti = nessun match certo, anche se il nome coincide.
- Il lookup autista e stato riallineato alla stessa regola:
  - badge esatto prima;
  - nome esatto solo se univoco;
  - nessun auto-match arbitrario sugli omonimi.
- Il report autista applica ora questa regola a:
  - segnali operativi D10;
  - rifornimenti D04;
  - associazioni mezzo/autista ricostruite da D01.
- Il report combinato mezzo + autista + periodo riallinea l'affidabilita del legame:
  - `forte` con `autistaId` coerente o badge coerente nei record D10/D04 del mezzo;
  - `plausibile` solo con fallback nome quando manca il riferimento forte;
  - `non dimostrabile` se esistono contraddizioni forti o mancano conferme.
- Nessuna scrittura Firestore/Storage business, nessun backend IA reale, nessun riuso runtime IA legacy e nessun impatto sui flussi correnti vengono introdotti da questo riallineamento.

## 12.14 Aggiornamento 2026-03-13
- Eseguito audit mirato del `report mezzo / targa` del sottosistema IA interno, con focus su:
  - lavori;
  - manutenzioni / gomme;
  - rifornimenti;
  - materiali / movimenti;
  - documenti / costi;
  - analisi economica salvata.
- Punti risultati strutturalmente solidi:
  - riuso del composito `readNextDossierMezzoCompositeSnapshot` come punto unico di lettura read-only;
  - filtro periodo applicato in modo coerente a lavori, manutenzioni, rifornimenti e documenti/costi;
  - ricostruzione D04 gia prudente e multi-sorgente nel layer rifornimenti;
  - dedup e tracciabilita esplicita del blocco documenti/costi.
- Punti deboli confermati dall'audit:
  - il blocco gomme continua a leggere solo `@manutenzioni` e non incorpora ancora gli eventi autisti dedicati fuori da quel reader;
  - il blocco materiali resta mezzo-centrico ma strutturalmente parziale, perche una parte dei match dipende ancora da `destinatario.label` o `destinatario.refId`;
  - il blocco documenti/costi non include ancora `@preventivi` e `@preventivi_approvazioni`, coerentemente con il perimetro clone-safe attuale.
- Fix minimo applicato subito nello stesso task:
  - la preview del report mezzo considera ora anche movimenti materiali e analisi economica salvata come segnali reali di copertura, evitando stati troppo pessimisti quando questi sono gli unici blocchi disponibili;
  - la sezione `Documenti, costi e analisi` non viene piu presentata come vuota quando e disponibile una analisi economica legacy salvata anche se i documenti/costi nel periodo sono assenti.
- Nessuna scrittura Firestore/Storage business, nessun backend IA reale, nessun riuso runtime IA legacy e nessun impatto sui flussi correnti vengono introdotti da questo audit/fix.

## 12.15 Aggiornamento 2026-03-13
- Eseguito audit + rafforzamento mirato del solo blocco `Gomme` nel `report mezzo / targa` del sottosistema IA interno.
- Il layer `nextManutenzioniGommeDomain` non legge piu solo le voci `CAMBIO GOMME` derivate da `@manutenzioni`, ma converge ora in sola lettura anche:
  - `@cambi_gomme_autisti_tmp`;
  - `@gomme_eventi`.
- Regola di matching mezzo applicata nel blocco gomme:
  - `targetTarga` o `targa` coerenti = match forte;
  - `targaCamion`, `targaRimorchio` e `contesto.*` = solo match plausibile quando manca una targa diretta;
  - nessun match contestuale viene presentato come conferma forte del mezzo.
- Per evitare doppio conteggio, gli eventi gomme extra gia importati nello storico manutenzioni vengono deduplicati solo quando coincidono davvero su:
  - giorno;
  - targa;
  - asse;
  - marca;
  - km.
- La preview `report mezzo` rende ora il blocco piu trasparente:
  - distingue eventi gomme da manutenzioni e da dataset gomme dedicati;
  - espone quanti match sono forti e quanti plausibili;
  - mantiene espliciti i limiti residui sui record senza chiavi targa affidabili.
- Nessuna scrittura Firestore/Storage business, nessun backend IA reale, nessun riuso runtime IA legacy e nessun impatto sui flussi correnti vengono introdotti da questo rafforzamento.

## 12.16 Aggiornamento 2026-03-22
- Ripristinato il sottosistema IA interno dopo un merge incompleto che lasciava conflict marker nel runtime clone e nella documentazione collegata.
- Causa tecnica confermata:
  - marker `<<<<<<< / ======= / >>>>>>>` residui in `src/next/NextInternalAiPage.tsx` e in file IA interni/documentali collegati;
  - parser Babel/Vite bloccato e build del progetto non compilabile.
- Ripristino applicato:
  - risolta la pagina `src/next/NextInternalAiPage.tsx` su uno stato React compilabile e coerente con il clone read-only;
  - riallineati i tipi condivisi IA e i facade strettamente collegati (`internalAiTypes`, `internalAiVehicleReportFacade`, compatibilita `internalAiEconomicAnalysisFacade`);
  - rimossi i marker anche dai registri documentali obbligatori del clone e dell'IA interna.
- Verifiche eseguite:
  - `npm run build` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx` -> OK.
- Guard rail invariati:
  - nessuna scrittura business;
  - nessuna modifica ai contratti dati operativi;
  - nessun riuso runtime dei backend IA legacy;
  - perimetro clone/NEXT sempre `read-only`.

## 12.17 Aggiornamento 2026-03-22
- Aperto il primo assorbimento sicuro della capability legacy `documenti IA` nella home `/next/ia/interna` in modalita `preview-first`.
- Perimetro sicuro scelto per il primo step:
  - lettura read-only di `@documenti_mezzi` e dei record gia mezzo-centrici di `@costiMezzo`;
  - supporto prudenziale da `@documenti_magazzino` e `@documenti_generici` solo se la targa e gia leggibile nel layer clone-safe;
  - distinzione esplicita tra `documenti diretti`, `documenti plausibili` e `fuori perimetro`.
- Scaffolding/facade introdotti:
  - `internalAiDocumentsPreviewFacade` come facciata dedicata al blocco documenti;
  - contratto stub `documents-preview` nel catalogo contratti IA interni;
  - preview UI secondaria nella home IA con cards, bucket, fonti lette, perimetro sicuro e limiti residui.
- Cosa resta fuori perimetro per ora:
  - runtime legacy `IADocumenti` / `estrazioneDocumenti`;
  - OCR reale, upload Storage, classificazione automatica e scritture su `@documenti_*`;
  - `@preventivi`, `@preventivi_approvazioni` e provider reali come backend canonico del blocco documenti;
  - `@impostazioni_app/gemini` e gestione segreti lato client.
- Verifiche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiDocumentsPreviewFacade.ts` -> OK
  - `npm run build` -> OK
- Guard rail invariati:
  - nessuna scrittura Firestore/Storage business;
  - nessun riuso runtime IA legacy come backend canonico;
  - nessun impatto sui flussi correnti;
  - testi visibili mantenuti in italiano.

## 12.18 Aggiornamento 2026-03-22
- Aperto il primo assorbimento sicuro della capability legacy `libretto IA` nella home `/next/ia/interna` in modalita `preview-first`.
- Perimetro sicuro scelto per il primo step:
  - lettura read-only dei campi gia presenti sul mezzo in `@mezzi_aziendali`;
  - supporto clone-safe del layer `nextLibrettiExportDomain` solo per capire se il file libretto e gia disponibile nel clone;
  - distinzione esplicita tra `dati libretto diretti`, `plausibili/incompleti` e `fuori perimetro`.
- Scaffolding/facade introdotti:
  - `internalAiLibrettoPreviewFacade` come facciata dedicata al blocco libretto;
  - contratto stub `libretto-preview` nel catalogo contratti IA interni;
  - preview UI secondaria nella home IA con cards, bucket, fonti lette, perimetro sicuro e limiti residui.
- Cosa resta fuori perimetro per ora:
  - runtime legacy `IALibretto`;
  - Cloud Run esterno per estrazione libretto;
  - OCR reale, upload file, salvataggi su `@mezzi_aziendali` e Storage business;
  - provider reali e segreti lato client.
- Verifiche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiLibrettoPreviewFacade.ts` -> OK
  - `npm run build` -> OK
- Guard rail invariati:
  - nessuna scrittura Firestore/Storage business;
  - nessun riuso runtime IA legacy come backend canonico;
  - nessun impatto sui flussi correnti;
  - testi visibili mantenuti in italiano.

## 12.19 Aggiornamento 2026-03-22
- Aperto il primo assorbimento sicuro della capability legacy `preventivi IA` nella home `/next/ia/interna` in modalita `preview-first`.
- Perimetro sicuro scelto per il primo step:
  - lettura read-only dei preventivi gia mezzo-centrici esposti dal layer clone-safe documenti/costi;
  - supporto clone-safe del procurement globale solo come contesto separato e non come backend canonico;
  - distinzione esplicita tra `preventivi direttamente collegabili`, `plausibili/supporti separati` e `fuori perimetro`.
- Scaffolding/facade introdotti:
  - `internalAiPreventiviPreviewFacade` come facciata dedicata al blocco preventivi;
  - contratto stub `preventivi-preview` nel catalogo contratti IA interni;
  - preview UI secondaria nella home IA con cards, bucket, fonti lette, perimetro sicuro e limiti residui.
- Cosa resta fuori perimetro per ora:
  - runtime legacy `Acquisti` / `estraiPreventivoIA`;
  - OCR reale, parsing AI, upload Storage e ingestione di nuovi allegati;
  - scritture su `@preventivi`, `@preventivi_approvazioni`, `@documenti_*` e altri dataset business;
  - workflow approvativo, PDF timbrati, provider reali e segreti lato client.
- Verifiche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiPreventiviPreviewFacade.ts` -> OK
  - `npm run build` -> OK
- Guard rail invariati:
  - nessuna scrittura Firestore/Storage business;
  - nessun riuso runtime IA legacy come backend canonico;
  - nessun impatto sui flussi correnti;
  - testi visibili mantenuti in italiano.

## 12.20 Aggiornamento 2026-03-22
- Aperto il primo scaffolding del backend IA separato per il nuovo sottosistema IA interno.
- Architettura scelta per il repo:
  - nuovo perimetro top-level `backend/internal-ai/*`;
  - servizio server-side framework-agnostico e non operativo;
  - contratti base, guard rail, manifest, dispatcher e handler stub definiti fuori da UI clone e backend legacy.
- Differenza esplicita rispetto ai canali legacy:
  - `functions/*` e `functions-schede/*` restano backend legacy attivi o di confronto, non backend canonico;
  - `api/pdf-ai-enhance.ts` e `server.js` restano canali non canonici e non collegati al nuovo sottosistema;
  - nessun provider reale, nessun segreto lato server, nessuna scrittura Firestore/Storage business vengono attivati in questo step.
- Scaffolding creato:
  - `internalAiBackendContracts` per route, guard rail e manifest del servizio;
  - `internalAiBackendHandlers` con endpoint stub `health`, `orchestrator.preview`, `retrieval.read`, `artifacts.preview`, `approvals.prepare`;
  - `internalAiBackendService` come dispatcher canonico del nuovo backend IA separato;
  - `README` e `tsconfig` dedicati per mantenere il perimetro verificabile e indipendente.
- Verifiche eseguite:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npx eslint backend/internal-ai/src/*.ts` -> OK
  - `npm run build` -> OK
- Guard rail invariati:
  - nessuna scrittura Firestore/Storage business;
  - nessun provider reale;
  - nessun riuso runtime IA legacy come backend canonico;
  - nessun impatto sui flussi correnti;
  - testi visibili mantenuti in italiano.

## 12.21 Aggiornamento 2026-03-22
- Aperto il primo ponte reale ma mock-safe tra frontend `/next/ia/interna` e backend IA separato.
- Canale scelto nel repo attuale:
  - bridge in-process sul contratto `orchestrator.preview` del backend `backend/internal-ai/*`;
  - nessun endpoint deployato reale;
  - nessun provider o segreto reale;
  - fallback locale esplicito se il backend separato non e pronto.
- Capability usata come primo test di integrazione:
  - `documents-preview`;
  - scelta perche riusa solo il layer clone-safe `nextDocumentiCostiDomain` e non dipende da OCR, upload o runtime legacy.
- Flusso attuale:
  - `NextInternalAiPage.tsx` invia la richiesta al bridge `internalAiDocumentsPreviewBridge`;
  - il bridge invoca il dispatcher `internalAiBackendService` sul path `orchestrator.preview`;
  - l'handler backend serve la preview documenti in modalita mock-safe e ritorna un envelope trasparente;
  - se il ponte non e disponibile o degrada, il bridge ricade in modo esplicito sul facade locale `readInternalAiDocumentsPreview`.
- Cosa resta ancora solo frontend/mock locale:
  - `report targa`;
  - `report autista`;
  - `report combinato`;
  - `analisi economica`;
  - `libretto`;
  - `preventivi`;
  - chat interna controllata.
- Verifiche eseguite:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiDocumentsPreviewBridge.ts src/next/internal-ai/internalAiContracts.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts` -> OK
  - `npm run build` -> OK
- Guard rail invariati:
  - nessuna scrittura Firestore/Storage business;
  - nessun provider reale o segreto lato client/server;
  - nessun riuso runtime dei backend IA legacy;
  - nessun impatto sui flussi correnti del clone o della madre;
  - testi visibili mantenuti in italiano.

## 12.22 Aggiornamento 2026-03-22
- Aperto il secondo ponte reale ma mock-safe tra frontend `/next/ia/interna` e backend IA separato.
- Canale scelto nel repo attuale:
  - bridge in-process sul contratto `orchestrator.preview` del backend `backend/internal-ai/*`;
  - nessun endpoint deployato reale;
  - nessun provider o segreto reale;
  - fallback locale esplicito se il backend separato non e pronto.
- Capability usata come secondo test di integrazione:
  - `economic-analysis-preview`;
  - scelta perche riusa solo layer clone-safe gia letti dal dossier mezzo e l'eventuale snapshot legacy salvato, senza OCR, upload o backend legacy canonico.
- Flusso attuale:
  - `NextInternalAiPage.tsx` invia la richiesta al bridge `internalAiEconomicAnalysisPreviewBridge`;
  - il bridge invoca il dispatcher `internalAiBackendService` sul path `orchestrator.preview`;
  - l'handler backend serve l'analisi economica preview in modalita mock-safe e ritorna un envelope trasparente;
  - se il ponte non e disponibile o degrada, il bridge ricade in modo esplicito sul facade locale `readInternalAiEconomicAnalysisPreview`.
- Cosa resta ancora solo frontend/mock locale:
  - `report targa`;
  - `report autista`;
  - `report combinato`;
  - `libretto`;
  - `preventivi`;
  - chat interna controllata.
- Verifiche eseguite:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiEconomicAnalysisPreviewBridge.ts src/next/internal-ai/internalAiContracts.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts` -> OK
  - `npm run build` -> OK
- Guard rail invariati:
  - nessuna scrittura Firestore/Storage business;
  - nessun provider reale o segreto lato client/server;
  - nessun riuso runtime dei backend IA legacy;
  - nessun impatto sui flussi correnti del clone o della madre;
  - testi visibili mantenuti in italiano.

## 12.23 Aggiornamento 2026-03-22
- Aperti insieme il terzo e il quarto ponte reali ma mock-safe tra frontend `/next/ia/interna` e backend IA separato.
- Canale scelto nel repo attuale:
  - bridge in-process sul contratto `orchestrator.preview` del backend `backend/internal-ai/*`;
  - nessun endpoint deployato reale;
  - nessun provider o segreto reale;
  - fallback locale esplicito se il backend separato non e pronto.
- Capability usate in questo task:
  - `libretto-preview`;
  - `preventivi-preview`;
  - scelte perche riusano solo letture clone-safe gia attive e non aprono OCR, upload, parsing AI reale o backend legacy canonico.
- Flusso attuale:
  - `NextInternalAiPage.tsx` invia le richieste ai bridge `internalAiLibrettoPreviewBridge` e `internalAiPreventiviPreviewBridge`;
  - i bridge invocano il dispatcher `internalAiBackendService` sul path `orchestrator.preview`;
  - l'handler backend serve le due preview in modalita mock-safe e ritorna envelope trasparenti;
  - se il ponte non e disponibile o degrada, ogni bridge ricade in modo esplicito sul proprio facade locale clone-safe.
- Cosa resta ancora solo frontend/mock locale:
  - `report targa`;
  - `report autista`;
  - `report combinato`;
  - chat interna controllata.
- Verifiche eseguite:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiLibrettoPreviewBridge.ts src/next/internal-ai/internalAiPreventiviPreviewBridge.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts` -> OK
  - `npm run build` -> OK
- Guard rail invariati:
  - nessuna scrittura Firestore/Storage business;
  - nessun provider reale o segreto lato client/server;
  - nessun riuso runtime dei backend IA legacy;
  - nessun impatto sui flussi correnti del clone o della madre;
  - testi visibili mantenuti in italiano.

## 12.24 Aggiornamento 2026-03-22
- Aperti insieme il quinto, il sesto e il settimo ponte reali ma mock-safe tra frontend `/next/ia/interna` e backend IA separato.
- Canale scelto nel repo attuale:
  - bridge in-process sul contratto `orchestrator.preview` del backend `backend/internal-ai/*`;
  - nessun endpoint deployato reale;
  - nessun provider o segreto reale;
  - fallback locale esplicito se il backend separato non e pronto.
- Capability usate in questo task:
  - `vehicle-report-preview`;
  - `driver-report-preview`;
  - `combined-report-preview`;
  - scelte perche riusano solo facade clone-safe gia attivi nel clone e mantengono invariata la logica business dei dati letti.
- Flusso attuale:
  - `NextInternalAiPage.tsx` invia le richieste ai bridge `internalAiVehicleReportPreviewBridge`, `internalAiDriverReportPreviewBridge` e `internalAiCombinedReportPreviewBridge`;
  - i bridge invocano il dispatcher `internalAiBackendService` sul path `orchestrator.preview`;
  - l'handler backend serve i tre report in modalita mock-safe e ritorna envelope trasparenti;
  - se il ponte non e disponibile o degrada, ogni bridge ricade in modo esplicito sul proprio facade locale clone-safe.
- Cosa resta ancora solo frontend/mock locale:
  - chat interna controllata;
  - lookup/autosuggest di supporto, che restano frontend clone-safe.
- Verifiche eseguite:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiVehicleReportPreviewBridge.ts src/next/internal-ai/internalAiDriverReportPreviewBridge.ts src/next/internal-ai/internalAiCombinedReportPreviewBridge.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts` -> OK
  - `npm run build` -> OK
- Guard rail invariati:
  - nessuna scrittura Firestore/Storage business;
  - nessun provider reale o segreto lato client/server;
  - nessun riuso runtime dei backend IA legacy;
  - nessun impatto sui flussi correnti del clone o della madre;
  - testi visibili mantenuti in italiano.

## 12.25 Aggiornamento 2026-03-22
- Aperto l'ottavo ponte reale ma mock-safe tra frontend `/next/ia/interna` e backend IA separato.
- Canale scelto nel repo attuale:
  - bridge in-process sul contratto `orchestrator.chat` del backend `backend/internal-ai/*`;
  - nessun endpoint deployato reale;
  - nessun provider o segreto reale;
  - fallback locale esplicito se il backend separato non e pronto.
- Capability usata in questo task:
  - `chat-orchestrator`;
  - scelta perche era l'ultima orchestrazione ancora solo frontend/mock locale e doveva passare prima dal backend separato senza cambiare la logica dati letta.
- Flusso attuale:
  - `NextInternalAiPage.tsx` invia i prompt al bridge `internalAiChatOrchestratorBridge`;
  - il bridge invoca il dispatcher `internalAiBackendService` sul path `orchestrator.chat`;
  - l'handler backend serve la chat in modalita mock-safe e ritorna un envelope trasparente verso la UI;
  - se il ponte non e disponibile o degrada, il bridge ricade in modo esplicito sull'orchestratore locale clone-safe.
- Cosa resta ancora solo frontend/mock locale:
  - lookup/autosuggest di supporto;
  - persistenza messaggi chat e tracking in memoria locale della pagina corrente.
- Verifiche eseguite:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts` -> OK
  - `npm run build` -> OK
- Guard rail invariati:
  - nessuna scrittura Firestore/Storage business;
  - nessun provider reale o segreto lato client/server;
  - nessun riuso runtime dei backend IA legacy;
  - nessun impatto sui flussi correnti del clone o della madre;
  - testi visibili mantenuti in italiano.

## 12.26 Aggiornamento 2026-03-22
- Il backend IA separato non e piu solo scaffold in-process: e stato aperto il primo adapter server-side reale e mock-safe in `backend/internal-ai/server/internal-ai-adapter.js`.
- Canale scelto nel repo attuale:
  - adapter HTTP locale separato dai runtime legacy;
  - base path `/internal-ai-backend/*`;
  - avvio esplicito con `npm run internal-ai-backend:start`;
  - persistenza dedicata confinata a `backend/internal-ai/runtime-data/*`.
- Cosa viene salvato davvero lato server:
  - snapshot `artifact-repository` in `analysis_artifacts.json`;
  - memoria operativa e tracking IA in `ai_operational_memory.json`;
  - traceability minima di letture/scritture IA in `ai_traceability_log.json`.
- Come funziona il flusso ora:
  - il frontend `/next/ia/interna*` prova una hydration iniziale tramite `internalAiServerPersistenceBridge`;
  - `internalAiMockRepository` e `internalAiTracking` fanno mirror mock-safe verso l'adapter server-side dedicato;
  - se l'adapter non e acceso o non risponde, il clone continua con fallback locale esplicito senza impattare i flussi correnti.
- Cosa resta ancora mock/in-process:
  - tutti i reader preview/chat restano gli stessi layer clone-safe gia attivi;
  - lookup/autosuggest restano frontend/in-process;
  - retrieval server-side di repo/Firestore/Storage business non e ancora attivo;
  - provider reali, segreti e scritture business restano fuori perimetro.
- Verifiche eseguite:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiMockRepository.ts src/next/internal-ai/internalAiTracking.ts src/next/internal-ai/internalAiServerPersistenceClient.ts src/next/internal-ai/internalAiServerPersistenceBridge.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendService.ts backend/internal-ai/src/internalAiServerPersistenceContracts.ts` -> OK
  - smoke test adapter `health/read/write` via import Node locale -> OK
  - `npm run build` -> OK
- Guard rail invariati:
  - nessuna scrittura Firestore/Storage business;
  - nessun provider reale o segreto lato client/server;
  - nessun riuso runtime dei backend IA legacy;
  - nessun impatto sui flussi correnti del clone o della madre;
  - testi visibili mantenuti in italiano.

## 12.27 Aggiornamento 2026-03-22
- Il backend IA separato espone ora anche il primo retrieval server-side controllato e read-only.
- Perimetro attivo scelto:
  - solo dominio `D01` mezzo-centrico;
  - solo snapshot `@mezzi_aziendali` seedato dal clone NEXT;
  - sola copertura file libretto gia leggibile nel clone;
  - nessuna lettura diretta Firestore/Storage business lato server.
- Canale scelto nel repo attuale:
  - adapter HTTP locale `backend/internal-ai/server/internal-ai-adapter.js`;
  - endpoint `POST /internal-ai-backend/retrieval/read`;
  - persistenza IA dedicata `backend/internal-ai/runtime-data/fleet_readonly_snapshot.json`;
  - fallback locale esplicito se l'adapter o lo snapshot non sono disponibili.
- Prima capability che usa davvero il retrieval server-side:
  - `libretto-preview`;
  - il bridge tenta prima il retrieval server-side;
  - se il contesto mezzo non e disponibile lato server, ricade sul ponte `backend_mock_safe` o sul facade locale clone-safe.
- Cosa legge davvero lato server:
  - dati mezzo strutturati gia normalizzati del clone;
  - disponibilita `librettoUrl` e `librettoStoragePath` gia leggibili sul mezzo;
  - limitazioni dichiarate del layer D01 e della copertura file.
- Cosa resta ancora clone-side/frontend-side:
  - tutti gli altri report/preview/chat continuano a vivere sui ponti mock-safe gia aperti;
  - lookup/autosuggest restano frontend/in-process;
  - nessun retrieval server-side completo di documenti/costi/procurement o Firestore/Storage business.
- Verifiche eseguite:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiLibrettoPreviewFacade.ts src/next/internal-ai/internalAiLibrettoPreviewBridge.ts src/next/internal-ai/internalAiServerRetrievalClient.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts backend/internal-ai/src/internalAiServerPersistenceContracts.ts backend/internal-ai/src/internalAiServerRetrievalContracts.ts` -> OK
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK
  - smoke test adapter `retrieval.read` via Node locale su porta dedicata `4311` -> OK
  - `npm run build` -> OK
- Guard rail invariati:
  - nessuna scrittura Firestore/Storage business;
  - nessun provider reale o segreto lato client/server;
  - nessun riuso runtime dei backend IA legacy;
  - nessun impatto sui flussi correnti del clone o della madre;
  - testi visibili mantenuti in italiano.

## 12.28 Aggiornamento 2026-03-22
- Il backend IA separato apre ora il primo collegamento strutturale a un provider reale server-side, ma solo in modalita controllata `preview-first`.
- Provider/modello scelti:
  - `OpenAI` lato server;
  - `Responses API`;
  - modello di default `gpt-5-mini`, configurabile via `INTERNAL_AI_OPENAI_MODEL`;
  - segreto ammesso solo lato server tramite `OPENAI_API_KEY`.
- Caso d'uso iniziale scelto:
  - sintesi guidata di un report gia letto e gia visibile nel clone;
  - nessuna nuova lettura business server-side necessaria per questo step;
  - nessuna applicazione automatica sui dati business.
- Flusso ora aperto:
  - richiesta dal report attivo in `/next/ia/interna`;
  - `POST /internal-ai-backend/artifacts/preview` genera una preview testuale del provider sopra un contesto report strutturato;
  - il workflow server-side salva preview, stato richiesta e traceability in `backend/internal-ai/runtime-data/ai_preview_workflows.json`;
  - `POST /internal-ai-backend/approvals/prepare` gestisce `approve_preview`, `reject_preview` e `rollback_preview`;
  - il rollback aggiorna solo lo stato dell'artifact IA dedicato, non i dati business.
- Cosa viene salvato davvero lato server:
  - testo della preview generata dal provider;
  - contesto report usato per la preview;
  - stati `preview_ready`, `approved`, `rejected`, `rolled_back`;
  - riferimenti di traceability minima delle operazioni.
- Cosa resta fuori perimetro:
  - scritture business automatiche;
  - Firestore/Storage business;
  - chat runtime reale, OCR, upload, parsing documentale e applicazioni su codice;
  - backend legacy come canale canonico.
- Stato reale del runner corrente:
  - `OPENAI_API_KEY` non e configurata nel runner locale, quindi la chiamata reale al provider resta pronta ma non dimostrata end-to-end in questa sessione;
  - health e workflow server-side risultano comunque verificati;
  - il clone continua a usare i fallback mock-safe esistenti se il provider non e disponibile.
- Verifiche eseguite:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiServerReportSummaryClient.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendService.ts backend/internal-ai/src/internalAiServerPersistenceContracts.ts` -> OK
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK
  - smoke test `GET /internal-ai-backend/health` -> OK
  - smoke test `POST /internal-ai-backend/artifacts/preview` con esito `provider_not_configured` senza segreto -> OK
  - smoke test `approve_preview` + `rollback_preview` su workflow IA dedicato -> OK
  - `npm run build` -> OK
- Guard rail invariati:
  - nessuna scrittura Firestore/Storage business automatica;
  - nessun segreto lato client;
  - nessun riuso runtime dei backend IA legacy;
  - nessun impatto sui flussi correnti del clone o della madre;
  - testi visibili mantenuti in italiano.

## 12.29 Aggiornamento 2026-03-22
- Il primo provider reale server-side del backend IA separato e ora anche verificato end-to-end nel runner locale, senza cambiare il perimetro del caso d'uso.
- Dove e come viene letta davvero la chiave:
  - l'adapter `backend/internal-ai/server/internal-ai-adapter.js` legge il segreto solo da `process.env.OPENAI_API_KEY`;
  - nel runner corrente la variabile e presente a livello utente Windows ma non sempre ereditata dalla shell corrente;
  - la verifica reale e stata eseguita propagando la variabile solo al processo server-side dedicato, senza esporla al client e senza scriverla nel codice.
- Esito reale del test end-to-end:
  - `GET /internal-ai-backend/health` su porta dedicata `4311` -> `providerEnabled: true`;
  - `POST /internal-ai-backend/artifacts/preview` con `gpt-5-mini` -> preview reale generata e salvata nel contenitore IA dedicato;
  - `POST /internal-ai-backend/approvals/prepare` con `approve_preview` -> workflow `approved`;
  - `POST /internal-ai-backend/approvals/prepare` con `reject_preview` -> workflow `rejected`;
  - `POST /internal-ai-backend/approvals/prepare` con `rollback_preview` su workflow approvato -> workflow `rolled_back`.
- Cosa non cambia:
  - il caso d'uso resta solo `sintesi guidata di un report gia letto`;
  - nessuna scrittura business automatica;
  - nessun segreto lato client;
  - fallback mock-safe invariato se la chiave manca nel processo server-side o il provider fallisce.
- Verifiche eseguite:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiServerReportSummaryClient.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendService.ts backend/internal-ai/src/internalAiServerPersistenceContracts.ts` -> OK
  - smoke test reale `health` + `artifacts.preview` + `approve_preview` + `reject_preview` + `rollback_preview` su porta dedicata `4311` -> OK
  - `npm run build` -> OK

## 12.30 Aggiornamento 2026-03-22
- La chat interna del clone IA ora puo usare davvero `OpenAI` lato server tramite `POST /internal-ai-backend/orchestrator/chat`, mantenendo fallback locale clone-safe e nessuna azione business automatica.
- Nello stesso backend IA separato e stato aperto il primo livello di comprensione controllata di repository e UI tramite `POST /internal-ai-backend/retrieval/read` con operazione `read_repo_understanding_snapshot`.
- Cosa legge davvero lato server questo primo livello di repo understanding:
  - documenti architetturali e di stato chiave del repo;
  - macro-aree modulo della NEXT e route rappresentative;
  - pattern UI rappresentativi;
  - relazioni principali tra schermate;
  - file sorgente rappresentativi della UI.
- Cosa sa fare ora la nuova IA con questo perimetro:
  - spiegare come e organizzata la NEXT;
  - descrivere moduli e relazioni tra schermate;
  - chiarire pattern UI gia presenti;
  - proporre semplificazioni coerenti come suggerimenti testuali, non come patch automatiche.
- Flusso reale ora attivo:
  - chat UI in `/next/ia/interna`;
  - `internalAiChatOrchestratorBridge` con fallback locale sempre disponibile;
  - `internalAiServerChatClient` verso `orchestrator.chat`;
  - adapter `backend/internal-ai/server/internal-ai-adapter.js`;
  - snapshot repo/UI curata da `backend/internal-ai/server/internal-ai-repo-understanding.js`;
  - risposta del provider reale solo server-side, o fallback locale se provider/adapter non sono disponibili.
- Stato reale verificato nel runner:
  - senza `OPENAI_API_KEY` nel processo server-side, `orchestrator.chat` risponde `provider_not_configured` e il frontend mantiene il fallback locale;
  - con `OPENAI_API_KEY` propagata al solo processo server-side, `health` risponde `providerEnabled: true`;
  - `retrieval.read(read_repo_understanding_snapshot)` costruisce e legge correttamente la snapshot curata repo/UI;
  - `orchestrator.chat` repo/UI-aware usa il provider reale con `usedRealProvider: true`;
  - `orchestrator.chat` con `reportContext` usa il provider reale con `usedRealProvider: true`.
- Cosa resta ancora fuori perimetro:
  - patch automatiche del repository;
  - agenti autonomi che modificano codice;
  - retrieval business completo del repo o dei dataset business lato server;
  - qualunque scrittura Firestore/Storage business;
  - backend legacy come canale canonico.
- Verifiche eseguite:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiServerChatClient.ts src/next/internal-ai/internalAiServerRepoUnderstandingClient.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiLibrettoPreviewBridge.ts` -> OK
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK
  - smoke test adapter `retrieval.read` + `orchestrator.chat` senza segreto nel processo server-side -> OK
  - smoke test reale `health` + `retrieval.read(read_repo_understanding_snapshot)` + `orchestrator.chat` repo/UI-aware + `orchestrator.chat` con `reportContext` su processo server-side dedicato con `OPENAI_API_KEY` -> OK
  - `npm run build` -> OK

## 12.31 Aggiornamento 2026-03-22
- Il repo understanding del backend IA separato non e piu limitato a una sola snapshot curata di documenti e route rappresentative: include ora anche un indice filesystem controllato di codice, componenti, route-like file e CSS collegati.
- Cosa legge davvero ora lato server questo ampliamento:
  - documenti architetturali/stato chiave del repo;
  - macro-aree e route rappresentative della NEXT;
  - pattern UI rappresentativi;
  - relazioni principali tra schermate;
  - indice controllato di file sotto `src/next`, `src/pages`, `src/components` e `backend/internal-ai`;
  - relazioni CSS importate tra pagine/componenti e fogli stile;
  - relazioni curate tra madre legacy e NEXT;
  - audit di readiness per Firestore/Storage read-only lato server.
- Cosa manca ancora per una lettura piu completa del repo:
  - parse strutturata di AST, dipendenze runtime, component tree e collegamenti completi tra route, componenti e style tokens;
  - indice repository esteso oltre il perimetro controllato oggi selezionato;
  - una mappa piu fine delle relazioni madre vs NEXT per tutti i moduli, non solo per aree chiave.
- Cosa manca ancora per Firestore read-only lato server:
  - access layer dedicato in `backend/internal-ai/*`, separato dai runtime legacy;
  - credenziale server-side dedicata e dimostrata nel repo o nel deploy target;
  - matrice collection/query consentite e limiti espliciti per la IA.
- Cosa manca ancora per Storage read-only lato server:
  - bridge dedicato nel backend IA separato;
  - path/bucket ammessi e tracciati;
  - decisione infrastrutturale sulle policy effettive, visto che `storage.rules` del repo e i flussi runtime legacy risultano oggi in tensione.
- Cosa e stato aperto davvero in questo task:
  - nuova snapshot repo/UI piu ricca in `backend/internal-ai/server/internal-ai-repo-understanding.js`;
  - rebuild automatico della snapshot se il formato vecchio non contiene i nuovi campi;
  - overview `/next/ia/interna` estesa con indice repository, relazioni madre/NEXT e readiness Firestore/Storage.
- Cosa resta fuori perimetro:
  - qualunque lettura diretta Firestore business lato server;
  - qualunque lettura diretta Storage business lato server;
  - qualunque patch automatica della madre o del repository;
  - backend legacy come canale canonico della nuova IA.
- Verifiche eseguite:
  - `node --check backend/internal-ai/server/internal-ai-repo-understanding.js` -> OK
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiServerRepoUnderstandingClient.ts backend/internal-ai/src/internalAiServerRetrievalContracts.ts backend/internal-ai/server/internal-ai-adapter.js backend/internal-ai/server/internal-ai-repo-understanding.js` -> OK
  - smoke test `buildRepoUnderstandingSnapshot()` -> OK
  - smoke test `POST /internal-ai-backend/retrieval/read` con `read_repo_understanding_snapshot` -> OK
  - `npm run build` -> OK

## 12.32 Aggiornamento 2026-03-22
- La pagina `/next/ia/interna` espone ora una UX piu conversazionale e leggibile, pur restando nel perimetro controllato del sottosistema IA interno.
- Cosa cambia davvero:
  - input chat unico, ampio e naturale;
  - thread messaggi piu vicino a un assistente interno che a una console tecnica;
  - stato del canale usato mostrato in modo leggero tramite card di contesto;
  - richieste di report strutturato convertite in artifact dedicato + modale di anteprima documento.
- Flusso report ora attivo:
  - la chat riconosce il report come richiesta strutturata;
  - il report pronto viene salvato subito come artifact nel repository IA dedicato;
  - la pagina apre una modale documento con contenuto leggibile, copia, download testo e condivisione browser se disponibile;
  - nella chat resta solo un messaggio breve di conferma con link rapido all'anteprima/artifact.
- Cosa e stato riusato:
  - orchestrazione chat backend-first gia esistente;
  - artifact repository IA e tracking;
  - riapertura artifact;
  - workflow preview/approval/rollback della sintesi server-side;
  - repo understanding e badge di trasporto/fallback gia disponibili.
- Cosa resta invariato per sicurezza:
  - nessuna scrittura business;
  - nessun segreto lato client;
  - nessun backend legacy come canale canonico;
  - nessuna modifica automatica del repository;
  - testi visibili mantenuti in italiano.
- Verifiche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx` -> OK
  - `npm run build` -> OK

## 12.33 Aggiornamento 2026-03-22
- Audit tecnico confermato: oggi NON e ancora sicuro aprire un bridge Firestore/Storage business read-only realmente attivo nel backend IA separato.
- Evidenze verificate nel repo e nel processo corrente:
  - il runtime root del backend IA separato non dichiara ancora `firebase-admin`;
  - `firebase-admin` compare solo nei package legacy `functions/*` e `functions-schede/*`;
  - `backend/internal-ai` non ha ancora un proprio `package.json` per governare dipendenze/adapter Firebase;
  - `firestore.rules` non e presente nel repository;
  - `storage.rules` e versionato ma blocca tutto, mentre il legacy usa Storage in modo esteso;
  - nel processo corrente non risultano variabili dedicate per credenziale/identita Firebase server-side.
- Cosa e stato aperto davvero in questo task:
  - modulo dedicato `backend/internal-ai/server/internal-ai-firebase-readiness.js` per centralizzare la readiness Firebase del backend IA separato;
  - contratti tipizzati della snapshot repo/UI estesi con:
    - prerequisiti condivisi;
    - whitelist candidate non attive;
    - limiti e blocchi espliciti per Firestore e Storage;
  - overview `/next/ia/interna` aggiornata per mostrare in italiano requisiti, whitelist candidate e motivi per cui il bridge non e ancora attivo.
- Whitelist candidate dichiarate ma NON attive:
  - Firestore: solo documento `storage/@mezzi_aziendali`;
  - Storage: solo oggetto del bucket `gestionemanutenzione-934ef.firebasestorage.app` ricavato dal valore esatto di `librettoStoragePath` su un mezzo gia whitelisted;
  - restano escluse scansioni collection, query libere, `listAll`, prefix scan, upload, delete e qualsiasi path arbitrario.
- Cosa manca davvero per il passo successivo stabile:
  - adapter Firebase read-only reale e dedicato in `backend/internal-ai/*`;
  - `firebase-admin` governato dal backend IA separato e non dai runtime legacy;
  - credenziale server-side dedicata e verificata per il deploy target;
  - `firestore.rules` versionato oppure evidenza equivalente delle policy effettive;
  - chiarimento infrastrutturale sul conflitto tra `storage.rules` versionato e uso legacy di Storage.
- Verifiche eseguite:
  - `node --check backend/internal-ai/server/internal-ai-firebase-readiness.js` -> OK
  - `node --check backend/internal-ai/server/internal-ai-repo-understanding.js` -> OK
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx backend/internal-ai/src/internalAiServerRetrievalContracts.ts` -> OK
  - smoke test `buildFirebaseReadinessSnapshot()` -> OK
  - smoke test `POST /internal-ai-backend/retrieval/read` con `read_repo_understanding_snapshot` -> OK
  - `npm run build` -> OK

## 12.34 Aggiornamento 2026-03-22
- Il flusso report della nuova IA interna non si ferma piu a una preview documento testuale: la modale genera ora un PDF reale client-side a partire dall'artifact IA gia salvato, senza riversare il report completo nella chat.
- Cosa apre davvero il nuovo flusso report:
  - PDF generato al volo con `jspdf` nel perimetro `/next/ia/interna`;
  - anteprima PDF inline nella modale dedicata;
  - copia del contenuto strutturato;
  - download PDF;
  - condivisione browser del PDF se supportata.
- Cosa resta volutamente fuori:
  - nessuna scrittura business;
  - nessuna persistenza server-side del binario PDF come artifact separato;
  - nessun riuso del runtime legacy PDF come backend canonico.
- Sul fronte readiness Firebase/Storage e stato fatto solo il passo strutturale sostenibile:
  - `backend/internal-ai/package.json` esiste ora come package dedicato del backend IA separato;
  - la readiness distingue il package dedicato presente da `firebase-admin` ancora non governato dal backend IA separato;
  - il bridge Firestore/Storage business read-only resta NON attivo.
- Verifiche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiReportPdf.ts backend/internal-ai/server/internal-ai-firebase-readiness.js` -> OK
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `node --check backend/internal-ai/server/internal-ai-firebase-readiness.js` -> OK
  - smoke test `buildFirebaseReadinessSnapshot()` -> OK
  - `npm run build` -> OK
- Limiti residui:
  - il PDF e generato lato client/on demand, non persiste ancora come file server-side nel contenitore IA;
  - `firebase-admin`, credenziale server-side dedicata, `firestore.rules` e chiarimento delle policy Storage restano bloccanti reali prima di qualsiasi bridge business read-only.

## 12.35 Aggiornamento 2026-03-22
- La nuova IA interna non vede piu solo una snapshot repo/UI curata: dispone ora anche di una prima osservazione runtime reale e passiva della NEXT, integrata nello stesso perimetro read-only del backend IA separato.
- Cosa apre davvero questo step:
  - script `npm run internal-ai:observe-next` che usa Playwright solo come osservatore passivo di route `/next/*` whitelistate;
  - snapshot runtime dedicata con route osservate, heading principali, card, tab, bottoni, link NEXT visibili e screenshot locali;
  - rendering in `/next/ia/interna` di questa copertura runtime insieme a una matrice esplicita `dominio -> modulo -> superficie UI -> file candidati`;
  - esposizione della stessa copertura anche dentro `read_repo_understanding_snapshot`, cosi la chat repo/UI-aware puo motivare meglio dove integrare pagine, tab, card, modali o bottoni.
- Copertura runtime verificata in questo task:
  - osservate con screenshot: `Home NEXT`, `Centro di Controllo`, `Gestione Operativa`, `Mezzi`, `Dossier lista`, `hub IA clone`, `IA interna`, `Acquisti`, `Autisti Inbox`, `Autisti Admin`, `Cisterna`;
  - non ancora garantite: route dinamiche `Dossier mezzo` e `Analisi Economica`, perche il crawl non forza click o stati potenzialmente mutanti.
- Cosa resta fuori perimetro:
  - nessun click operativo, nessun submit, nessun upload, nessuna osservazione della madre;
  - nessun bridge Firestore/Storage business live;
  - nessuna copertura completa di modali o stati che richiedono interazione.
- Verifiche eseguite:
  - `node --check backend/internal-ai/server/internal-ai-next-runtime-observer.js` -> OK
  - `node --check scripts/internal-ai-observe-next-runtime.mjs` -> OK
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiServerRepoUnderstandingClient.ts backend/internal-ai/src/internalAiServerRetrievalContracts.ts backend/internal-ai/server/internal-ai-next-runtime-observer.js backend/internal-ai/server/internal-ai-repo-understanding.js backend/internal-ai/server/internal-ai-adapter.js scripts/internal-ai-observe-next-runtime.mjs` -> OK
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npm run internal-ai:observe-next` -> OK
  - smoke test `read_repo_understanding_snapshot` + asset screenshot su adapter locale -> OK
  - `npm run build` -> OK

## 12.37 Aggiornamento 2026-03-22
- Estesa in modo verificato la comprensione runtime della NEXT della nuova IA interna:
  - observer runtime read-only ora su 19 route reali;
  - 23 screenshot salvati nel contenitore IA dedicato;
  - 4 stati whitelist-safe osservati su `Acquisti`;
  - route dinamiche mezzo-centriche risolte in modo governato:
    - `/next/dossier/:targa`;
    - `/next/analisi-economica/:targa`;
    - `/next/dossier/:targa/gomme`;
    - `/next/dossier/:targa/rifornimenti`;
  - sottoroute `IA interna` osservate direttamente:
    - `/next/ia/interna/sessioni`;
    - `/next/ia/interna/richieste`;
    - `/next/ia/interna/artifacts`;
    - `/next/ia/interna/audit`.
- Introdotto un selettore di formato output sopra il contesto della sessione/chat:
  - `chat_brief` per chiarimenti semplici e limiti;
  - `chat_structured` per repo/UI understanding e spiegazioni piu articolate;
  - `report_pdf` per richieste reportistiche;
  - `ui_integration_proposal` per suggerimenti di integrazione nella NEXT;
  - `next_integration_confirmation_required` quando la richiesta implica una integrazione stabile e va confermata, non applicata.
- Arricchita la guida integrazione UI/flow/file del backend IA con:
  - superficie primaria;
  - superfici alternative;
  - confidenza;
  - route di evidenza runtime;
  - anti-pattern da evitare;
  - ruoli file candidati.
- Aggiornata `/next/ia/interna` per mostrare in italiano:
  - formato scelto dall'assistente e motivo della scelta;
  - route/stati/superfici osservati davvero a runtime;
  - guida integrazione piu motivata per pagina/modale/tab/card/bottone/sezione/file.
- Verifiche eseguite:
  - `node --check backend/internal-ai/server/internal-ai-next-runtime-observer.js` -> OK
  - `node --check scripts/internal-ai-observe-next-runtime.mjs` -> OK
  - `node --check backend/internal-ai/server/internal-ai-repo-understanding.js` -> OK
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK
  - `npm run internal-ai:observe-next` -> OK
  - rebuild snapshot repo/UI server-side -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/internal-ai/internalAiContracts.ts backend/internal-ai/src/internalAiServerRetrievalContracts.ts backend/internal-ai/server/internal-ai-next-runtime-observer.js backend/internal-ai/server/internal-ai-repo-understanding.js backend/internal-ai/server/internal-ai-adapter.js scripts/internal-ai-observe-next-runtime.mjs` -> OK
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npm run build` -> OK
- Guard rail invariati:
  - nessuna scrittura Firestore/Storage business;
  - nessun click distruttivo, submit o upload runtime;
  - nessun segreto lato client;
  - nessun riuso runtime dei backend IA legacy;
  - nessun impatto sui flussi correnti del clone o della madre;
  - testi visibili mantenuti in italiano.

## 12.36 Aggiornamento 2026-03-22
- La chat `/next/ia/interna` non dipende piu solo da intent hardcoded per il mezzo: usa ora un primo catalogo capability mezzo-centrico governato sopra il Dossier clone-safe, cosi puo tradurre richieste libere verso un perimetro stabile e spiegabile.
- Cosa apre davvero questo step:
  - planner dichiarativo `prompt -> capability -> filtri/metriche/groupBy/output`, limitato al dominio `mezzo_dossier`;
  - primo hook reale per singola targa che legge come fonti primarie i read model NEXT e non le pagine UI;
  - capability attive nel primo catalogo:
    - `stato sintetico Dossier mezzo`;
    - `preview documenti collegabili al mezzo`;
    - `riepilogo costi mezzo`;
    - `preview libretto mezzo`;
    - `preview preventivi collegabili al mezzo`;
    - `report mezzo PDF` in anteprima artifact-first.
- Fonti reali riusate:
  - `D01` anagrafiche flotta;
  - composito `readNextDossierMezzoCompositeSnapshot`;
  - layer `D07-D08` documenti/costi;
  - facade read-only gia aperti per documenti, libretto, preventivi, analisi economica e report mezzo.
- Cosa resta fuori perimetro:
  - nessun retrieval Firebase/Storage business live aggiuntivo;
  - nessun writer business;
  - nessun procurement globale come backend canonico del mezzo;
  - nessuna modifica della madre.
- Verifiche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts src/next/internal-ai/internalAiVehicleCapabilityPlanner.ts src/next/internal-ai/internalAiVehicleDossierHookFacade.ts` -> OK
  - `npm run build` -> OK

## 12.37 Aggiornamento 2026-03-23
- Il primo hook mezzo-centrico della chat `/next/ia/interna` non si ferma piu al composito locale del clone: prova ora prima un retrieval server-side dedicato del `Dossier Mezzo`, seedato dai layer NEXT read-only e persistito nel contenitore IA separato.
- Cosa apre davvero questo step:
  - nuovo retrieval server-side `seed_vehicle_dossier_snapshot` + `read_vehicle_dossier_by_targa` nel backend IA separato;
  - estensione del hook `mezzo_dossier` con una nuova capability governata `riepilogo rifornimenti mezzo`;
  - riuso dello snapshot Dossier clone-seeded per:
    - stato sintetico mezzo;
    - riepilogo costi mezzo;
    - riepilogo rifornimenti mezzo;
  - dichiarazione piu esplicita in chat di fonti, dataset, trasporto server-side/fallback e limiti del perimetro.
- Fonti reali coinvolte:
  - `D01/@mezzi_aziendali`;
  - composito `readNextDossierMezzoCompositeSnapshot`;
  - `D04/@rifornimenti` + `@rifornimenti_autisti_tmp`;
  - `D07-D08` documenti/costi;
  - supporto procurement e analisi legacy gia letti dal composito Dossier.
- Cosa resta fuori perimetro:
  - nessun bridge Firestore/Storage business live;
  - nessuna scrittura business;
  - nessun retrieval live dedicato del verticale `Cisterna`;
  - nessun procurement globale reso backend canonico del mezzo.
- Verifiche eseguite:
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK
  - `node --check backend/internal-ai/server/internal-ai-persistence.js` -> OK
  - smoke test adapter locale `seed_vehicle_dossier_snapshot` + `read_vehicle_dossier_by_targa` -> OK
  - `npx eslint src/next/internal-ai/internalAiLibrettoPreviewBridge.ts src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts src/next/internal-ai/internalAiVehicleCapabilityPlanner.ts src/next/internal-ai/internalAiVehicleDossierHookFacade.ts src/next/internal-ai/internalAiServerRetrievalClient.ts backend/internal-ai/src/internalAiServerRetrievalContracts.ts` -> OK
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npm run build` -> OK
- Limiti residui:
  - lo snapshot Dossier resta clone-seeded e non equivale ancora a una lettura diretta Firestore/Storage lato server;
  - `rifornimenti` resta capability spiegabile ma non contabilita o fuel control live;
  - `Cisterna` resta solo verticale specialistico segnalato, senza bridge dati dedicato.

## 12.38 Aggiornamento 2026-03-23
- Eseguita una ri-verifica dedicata, con analisi parallela e controllo locale del repo, per capire se il backend IA separato possa aprire davvero il primo bridge Firebase/Storage business live read-only.
- Esito confermato e reso piu duro nella readiness:
  - Firestore live read-only NON apribile oggi in modo sicuro e verificabile;
  - Storage/file live read-only NON apribile oggi in modo sicuro e verificabile;
  - il fallback ufficiale resta il retrieval clone-seeded gia governato sul `mezzo_dossier`.
- Cosa viene aperto davvero in questo task:
  - boundary futuro machine-readable in `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js`;
  - primo perimetro futuro ammissibile dichiarato in modo esplicito:
    - Firestore: solo documento esatto `storage/@mezzi_aziendali`;
    - Storage: solo oggetto esatto da `librettoStoragePath` nel bucket `gestionemanutenzione-934ef.firebasestorage.app`;
  - constraints futuri espliciti su projection campi, massimo un documento/oggetto per richiesta, traceability obbligatoria e divieti su D04/documenti/procurement/path larghi.
- Cosa resta fuori perimetro:
  - nessun bridge Firebase/Storage business live attivo;
  - nessuna lettura live su `@rifornimenti`, `@rifornimenti_autisti_tmp`, `@costiMezzo`, `@documenti_*`, `@preventivi`, `@preventivi_approvazioni`;
  - nessun `listAll`, nessuna scansione prefix, nessun upload/delete;
  - nessun uso del backend legacy come canale canonico.
- Blocchi confermati:
  - `firebase-admin` non ancora governato dal package dedicato `backend/internal-ai/package.json`;
  - nel processo corrente non risultano credenziali/identita Google server-side dedicate;
  - `firestore.rules` assente dal repo;
  - `storage.rules` deny-all versionato in conflitto con l'uso legacy.
- Verifiche eseguite:
  - `node --check backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js` -> OK
  - `node --check backend/internal-ai/server/internal-ai-firebase-readiness.js` -> OK
  - `npx eslint backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js backend/internal-ai/server/internal-ai-firebase-readiness.js` -> OK
  - smoke test `buildFirebaseReadinessSnapshot()` -> OK

## 12.39 Aggiornamento 2026-03-23
- Il backend IA separato non e ancora pronto ad aprire il live minimo, ma il suo package dedicato e ora piu vicino a un runtime davvero autonomo:
  - `backend/internal-ai/package.json` dichiara ora anche le dipendenze runtime gia usate dall'adapter (`body-parser`, `dotenv`, `express`, `openai`, `firebase-admin`);
  - esiste un bootstrap Firebase Admin separato in `backend/internal-ai/server/internal-ai-firebase-admin.js`;
  - esiste una CLI `backend/internal-ai/server/internal-ai-firebase-readiness-cli.js` per rendere ripetibile la verifica locale del bridge senza toccare dati business.
- Cosa viene aperto davvero in questo task:
  - confine piu chiaro tra package governato e runtime realmente risolvibile;
  - nuova snapshot readiness che distingue meglio:
    - package dedicato;
    - dipendenze runtime del backend IA;
    - `firebase-admin` dichiarato nel manifest;
    - `firebase-admin` davvero risolvibile nel checkout corrente;
    - credenziale server-side reale;
    - rules/policy verificabili.
- Cosa NON cambia:
  - Firestore live read-only NON apribile oggi;
  - Storage/file live read-only NON apribile oggi;
  - `firebase.json`, `firestore.rules` e `storage.rules` non vengono toccati;
  - il fallback ufficiale resta il retrieval clone-seeded del `mezzo_dossier`.
- Blocchi residui:
  - il checkout locale risolve ora `firebase-admin` dal perimetro backend IA, ma questo non basta ancora ad aprire il live minimo;
  - non risultano credenziali/identita Google server-side dedicate e verificabili;
  - `firestore.rules` resta assente dal repo;
  - `storage.rules` resta deploy-sensitive e in conflitto con l'uso legacy.
- Verifiche eseguite:
  - `node --check backend/internal-ai/server/internal-ai-firebase-admin.js` -> OK
  - `node --check backend/internal-ai/server/internal-ai-firebase-readiness.js` -> OK
  - `node --check backend/internal-ai/server/internal-ai-firebase-readiness-cli.js` -> OK
  - `npx eslint backend/internal-ai/server/internal-ai-firebase-admin.js backend/internal-ai/server/internal-ai-firebase-readiness.js backend/internal-ai/server/internal-ai-firebase-readiness-cli.js backend/internal-ai/server/internal-ai-adapter.js` -> OK
  - `npm --prefix backend/internal-ai run firebase-readiness` -> OK
  - smoke test `probeInternalAiFirebaseAdminRuntime()` -> `modulesReady: true`, `canAttemptLiveRead: false`
  - smoke test `health` adapter su porta temporanea `4317` -> `firestore: not_ready`, `storage: not_ready`, `adminRuntimeReady: true`

## 12.43 Aggiornamento 2026-03-23
- Eseguita una verifica finale dei prerequisiti reali del primo live minimo richiesto per Firestore e Storage nel backend IA separato.
- Verita emersa dal controllo locale:
  - il supporto server-side alle credenziali esiste gia nel codice e copre `GOOGLE_APPLICATION_CREDENTIALS`, `FIREBASE_SERVICE_ACCOUNT_JSON` e `FIREBASE_CONFIG`;
  - il runtime locale del backend IA risolve `firebase-admin`;
  - nel processo reale corrente non risultano pero credenziali server-side effettive;
  - `firestore.rules` resta assente e l'access layer Firestore live dedicato non e ancora aperto;
  - `storage.rules` resta in conflitto con l'uso legacy.
- Verdetto operativo:
  - Firestore `storage/@mezzi_aziendali` come `exact_document` resta `not_ready`;
  - Storage `librettoStoragePath` come `exact_file_read` resta `not_ready`;
  - il fallback ufficiale del dominio `mezzo_dossier` resta il retrieval clone-seeded gia governato.
- Nuova chiarezza ottenuta:
  - il blocco non e nel supporto del canale `FIREBASE_SERVICE_ACCOUNT_JSON`, che e gia riconosciuto lato server;
  - il blocco vero e nella mancanza di credenziale reale nel processo, nelle policy Firestore non versionate e nell'assenza dell'access layer Firestore live stretto.
- Verifiche eseguite:
  - `npm --prefix backend/internal-ai run firebase-readiness` -> OK
  - `node -e "import('./backend/internal-ai/server/internal-ai-firebase-admin.js').then(async m=>{const r=await m.probeInternalAiFirebaseAdminRuntime(); console.log(JSON.stringify(r,null,2));})"` -> OK
  - smoke test non produttivo con `FIREBASE_SERVICE_ACCOUNT_JSON` fittizio e parseabile -> ramo supportato confermato, nessuna lettura business eseguita

## 12.40 Aggiornamento 2026-03-23
- La nuova IA interna arriva ora alla copertura UI runtime massima oggi verificabile della NEXT senza uscire dal perimetro clone-safe:
  - catalogo observer `2026-03-23-total-ui-v1` su 53 route candidate;
  - 52 route osservate davvero;
  - 70 screenshot runtime;
  - 26 stati interni whitelist-safe tentati;
  - 18 stati interni osservati davvero:
    - 12 `tab`;
    - 2 `menu`;
    - 2 `dialog/modal`;
    - 1 `card`;
    - 1 `detail`.
- Aree oggi coperte davvero nel clone read-only:
  - subtree `IA` e `IA interna`;
  - subtree `Autisti Inbox`;
  - `Autisti Admin` con tab principali;
  - `Centro di Controllo` con tab principali;
  - subtree `Cisterna` con route figlie;
  - `Lavori in attesa` + dettaglio lavoro;
  - `Ordini in attesa` + dettaglio ordine;
  - diverse schermate lista/read-only come `Inventario`, `Manutenzioni`, `Materiali`, `Mezzi`, `Colleghi`, `Fornitori`, `Capo Mezzi`.
- La copertura migliora davvero anche per la IA, non solo per la UI della pagina:
  - `/next/ia/interna` non tronca piu l'elenco route/stati e mostra conteggi osservati/tentati/non disponibili, catalogo observer, requested path vs final path e breakdown per tipo di stato;
  - il backend chat riceve ora una vista runtime compatta ma completa di tutte le route osservate, insieme a `integrationGuidance`, `representativeRoutes` e `screenRelations` completi, cosi il mapping `schermata -> file/modulo/flusso` non resta piu basato su sole 6 route campione.
- Limiti residui dichiarati apertamente:
  - resta non osservata la route dinamica `Acquisti` dettaglio, perche il trigger `Apri` non emerge in modo affidabile nel runtime locale;
  - restano 8 stati interni non osservabili oggi nel perimetro sicuro:
    - `Home`: accordion rapido non visibile e modale `Vedi tutto` disabilitata dal guard rail read-only;
    - `Dossier dettaglio`: modale lavori e foto mezzo non visibili nel campione;
    - `Dossier rifornimenti`: filtri `MESE` e `12 mesi` non visibili in modo affidabile;
    - `Capo costi`: toggle `solo da valutare` non visibile;
    - `Acquisti`: menu ordine non visibile nel campione.
- Verifiche eseguite:
  - `node --check backend/internal-ai/server/internal-ai-next-runtime-observer.js` -> OK
  - `node --check scripts/internal-ai-observe-next-runtime.mjs` -> OK
  - `node --check backend/internal-ai/server/internal-ai-repo-understanding.js` -> OK
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx backend/internal-ai/src/internalAiServerRetrievalContracts.ts backend/internal-ai/server/internal-ai-next-runtime-observer.js backend/internal-ai/server/internal-ai-repo-understanding.js backend/internal-ai/server/internal-ai-adapter.js scripts/internal-ai-observe-next-runtime.mjs` -> OK
  - `npm run internal-ai:observe-next` -> OK
  - rebuild snapshot repo/UI server-side -> OK
  - `npm run build` -> OK

## 12.41 Aggiornamento 2026-03-23
- Micro-task mirato sui gap residui del Prompt 59 completato senza allargare il perimetro del crawler:
  - catalogo observer aggiornato a `2026-03-23-total-ui-v2`;
  - `53/53` route osservate davvero;
  - `78` screenshot runtime;
  - `25/26` stati interni osservati davvero;
  - un solo stato interno residuo classificato come non osservabile nel perimetro sicuro.
- Gap chiusi davvero:
  - route dinamica `Acquisti` dettaglio osservata passando dal tab `Ordini` read-only e dal trigger `Apri`;
  - `Home`: accordion rapido riconosciuto come stato gia aperto nel render iniziale;
  - `Dossier dettaglio`: modale lavori e foto mezzo osservate davvero;
  - `Dossier rifornimenti`: filtri `MESE` e `12 mesi` osservati davvero su una targa con rifornimenti reali (`TI313387`);
  - `Capo costi`: toggle `solo da valutare` osservato davvero;
  - `Acquisti`: menu ordine osservato davvero dopo apertura del tab `Ordini`.
- Residuo definitivo e onesto:
  - `Home -> Vedi tutto` resta non osservabile in modo sicuro, perche il trigger e visibile ma disabilitato dal guard rail read-only del clone.
- Verifiche eseguite:
  - `node --check backend/internal-ai/server/internal-ai-next-runtime-observer.js` -> OK
  - `node --check scripts/internal-ai-observe-next-runtime.mjs` -> OK
  - `node --check scripts/internal-ai-observe-next-gap59.mjs` -> OK
  - `npx eslint backend/internal-ai/server/internal-ai-next-runtime-observer.js scripts/internal-ai-observe-next-runtime.mjs scripts/internal-ai-observe-next-gap59.mjs` -> OK
  - `node scripts/internal-ai-observe-next-gap59.mjs` -> OK (`53/53` route, `25/26` stati, `78` screenshot)

## 12.42 Aggiornamento 2026-03-23
- Reality check finale sul live minimo del backend IA separato senza aprire il bridge:
  - il codice server-side supporta `GOOGLE_APPLICATION_CREDENTIALS`, `FIREBASE_SERVICE_ACCOUNT_JSON` e `FIREBASE_CONFIG`;
  - il processo corrente non espone nessuno dei tre canali;
  - la probe runtime conferma `modulesReady: true`, `credentialMode: missing`, `canAttemptLiveRead: false`.
- Conseguenza operativa:
  - Firestore live read-only minimo su `storage/@mezzi_aziendali` NON apribile oggi;
  - Storage/file live read-only minimo su `librettoStoragePath` NON apribile oggi;
  - il fallback ufficiale nel dominio `mezzo_dossier` resta il retrieval clone-seeded gia governato.
- Blocchi reali residui:
  - `firebase-admin` e ora risolvibile dal runtime `backend/internal-ai`, ma questo non basta ad aprire il live minimo;
  - credenziale server-side Google assente nel processo corrente;
  - `firestore.rules` assente dal repo;
  - `storage.rules` deny-all versionato in conflitto con l'uso legacy;
  - access layer live dedicato ancora non aperto nel backend IA separato.
- Verifiche eseguite:
  - `node --check backend/internal-ai/server/internal-ai-firebase-admin.js` -> OK
  - `node --check backend/internal-ai/server/internal-ai-firebase-readiness.js` -> OK
  - `npm --prefix backend/internal-ai run firebase-readiness` -> OK
  - smoke test `probeInternalAiFirebaseAdminRuntime()` -> `modulesReady: true`, `credentialMode: missing`, `canAttemptLiveRead: false`
  - il checkout corrente risolve `firebase-admin` da `node_modules` root senza usare canali backend legacy

## 12.43 Aggiornamento 2026-03-23 - Reset prodotto chat IA interna stile ChatGPT
- La pagina `/next/ia/interna` e stata rifatta come una chat unica e chiara:
  - thread centrale pulito;
  - composer unico con allegati IA-only;
  - memoria repo/UI usata davvero nelle richieste libere quando disponibile;
  - output/report/PDF mantenuti ma spostati in secondo piano;
  - pannelli tecnici collassabili e non invasivi.
- Il wiring ora dichiara in modo esplicito se la memoria osservata e fresca, parziale o da aggiornare, e non degrada piu automaticamente le richieste UI/flussi/repo al solo perimetro base quando esiste un contesto osservato utile.
- Gli allegati IA-only restano confinati al sottosistema IA separato, con preview/apertura/rimozione nel thread e fallback locale quando il backend non e disponibile.
- Nessuna madre toccata, nessuna scrittura business, nessun bridge Firebase/Storage live riaperto.
- Verifiche eseguite:
  - `npm run build` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiChatAttachmentsClient.ts src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/internal-ai/internalAiChatOrchestrator.ts backend/internal-ai/server/internal-ai-adapter.js backend/internal-ai/server/internal-ai-chat-attachments.js backend/internal-ai/src/internalAiServerPersistenceContracts.ts` -> OK
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK
  - `node --check backend/internal-ai/server/internal-ai-chat-attachments.js` -> OK
  - `npm --prefix backend/internal-ai run typecheck` -> OK

## 12.44 Aggiornamento 2026-03-26 - Base universale chat/IA del clone NEXT
- Il sottosistema IA interno cambia ruolo: la pagina `/next/ia/interna` non viene piu trattata come console buona solo su alcuni domini, ma come gateway universale del clone/NEXT.
- Cosa e stato introdotto davvero:
  - un registry totale seedato del clone/NEXT con moduli, route, modali, entita, adapter, capability IA, hook UI e gap reali;
  - un contract standard adapter per moduli presenti e futuri;
  - un entity resolver iniziale realmente collegato ai cataloghi clone-safe di mezzi, autisti e fornitori;
  - un request resolver universale che interpreta richieste libere, seleziona adapter, capability e action intent;
  - un reader/orchestrator universale che compone registry, resolver, router documenti, coverage, trust e gap;
  - un composer unico che arricchisce la chat con un `Piano universale clone/NEXT` e rende esplicito l'aggancio UI consigliato;
  - un router documenti che classifica allegati e li instrada verso `IA > Libretto`, `IA > Documenti`, `Acquisti`, `Cisterna`, `Inventario` o, nei casi ancora ambigui all'epoca, alla chat IA interna.
- Le capability IA gia deployate non vengono ignorate:
  - `backend.chat.controlled`, `backend.repo-understanding`, `backend.retrieval.clone-seeded`, preview clone di report/documenti/libretto/preventivi vengono assorbite come capability del sistema universale;
  - le capability legacy di valore (`libretto`, `documenti`, `analisi economica`, `preventivi`, `cisterna`) vengono mappate e collocate nel registry senza trasformarle nel backend canonico del nuovo sistema.
- Gap reali lasciati espliciti:
  - handoff standard chat -> modulo target ancora incompleto;
  - inbox documentale universale ancora assente;
  - procurement preventivi senza prefill end-to-end;
  - verticale cisterna non ancora fuso nel planner semplice;
  - gate moduli futuri non ancora imposto;
  - live-read business ancora chiuso.
- Verifiche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/*.ts src/next/internal-ai/*.tsx` -> OK
  - `npm run build` -> OK, warning Vite invariati su chunk grandi e doppio import `jspdf`

## 12.45 Aggiornamento 2026-03-26 - Chiusura gap operativi handoff/inbox/prefill
- La base universale introdotta nel prompt precedente non resta piu solo descrittiva: il runtime della chat `/next/ia/interna` emette ora handoff standard veri verso i moduli target del clone con query `?iaHandoff=<id>` e payload uniforme persistito nel repository isolato della IA interna.
- Cosa e stato chiuso davvero:
  - payload standard unico `chat -> modulo target` con `moduloTarget`, `routeTarget`, `tipoEntita`, `entityRef`, `documentType`, `datiEstrattiNormalizzati`, `prefillCanonico`, `confidence`, `statoRichiesta`, `motivoInstradamento`, `capabilityRiutilizzata`, `azioneRichiesta`, `campiMancanti`, `campiDaVerificare`;
  - prefill canonico uniforme per `libretto mezzo`, `preventivo fornitore`, `documento cisterna`, `tabella materiali`, `documento ambiguo`, richieste su `mezzo`, `autista`, `cisterna`, `materiale`;
  - inbox documentale universale reale in `/next/ia/interna/richieste`, con elenco documenti da verificare, motivi classificazione, modulo suggerito, entita candidate, stato, azioni possibili e handoff tracciato;
  - bridge chat/orchestrator che persiste handoff e inbox a ogni turno reale, invece di limitarsi ad arricchire il testo assistente;
  - gate runtime per moduli futuri tramite `conformance summary`, che dichiara il modulo non completo se mancano registry entry, contract adapter, hook UI o reader;
  - scenari E2E documentati per i 7 casi minimi richiesti.
- Chiusure reali sui domini piu sensibili:
  - `D06 procurement` entra ora nel sistema universale con handoff standard, vincolo forte `fornitore`, route target `Acquisti` e payload canonico clone-safe;
  - `D09 cisterna` entra ora nel planner universale con route target `Cisterna IA`, payload uniforme e capability legacy censita come riuso;
  - `next.autisti`, `next.ia_hub` e `next.libretti_export` risultano ora agganciabili dal gateway universale con handoff dedicato.
- Limiti residui dichiarati senza overpromise:
  - il limite sul consumo nativo del payload `iaHandoff` nei moduli target principali e stato poi chiuso nell'aggiornamento `12.46`;
  - il live-read business lato backend IA resta correttamente chiuso.
- Verifiche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/*.ts src/next/internal-ai/*.tsx` -> OK
  - `npm run build` -> OK, warning Vite invariati su chunk grandi e doppio import `jspdf`

## 12.46 Aggiornamento 2026-03-26 - Chiusura finale dei consumer `iaHandoff` nel perimetro corrente
- Il sistema universale non si ferma piu al solo instradamento: i moduli target correnti del clone/NEXT leggono davvero `?iaHandoff=<id>`, recuperano il payload dal repository IA isolato, applicano prefill reale e tracciano lo stato consumo.
- Cosa e stato chiuso davvero:
  - hook consumer standard riusabile con validazione modulo target, aggiornamento lifecycle e accesso uniforme a `flusso`, `targa`, `fornitore`, `materiale`, `autista`, `badge`, `documentoNome`, `queryMateriale` e `vistaTarget`;
  - `next.procurement` chiuso su `Acquisti`, `Ordini in attesa`, `Ordini arrivati` e dettaglio ordine, con filtri/prefill reali;
  - `next.operativita` chiuso sulle viste `Inventario` e `Materiali consegnati`, con query e selezione destinatario reali;
  - `next.dossier`, `next.ia_hub` (`Libretto`, `Documenti`), `next.libretti_export`, `next.cisterna` (`Cisterna IA`) e `next.autisti` (`Inbox`, `Admin`) chiusi con banner, prefill e stato consumo coerente;
  - repository IA aggiornato con cronologia consumo e sincronizzazione del payload anche sugli item della inbox documentale universale;
  - registry, matrice e scenari E2E riallineati: nessun gap aperto nel perimetro operativo corrente del clone/NEXT.
- Boundary ancora fuori perimetro:
  - live-read business lato backend IA, che resta volutamente chiuso.
- Verifiche eseguite:
  - `npx eslint src/next/NextAcquistiPage.tsx src/next/NextOrdiniInAttesaPage.tsx src/next/NextOrdiniArrivatiPage.tsx src/next/NextDettaglioOrdinePage.tsx src/next/NextProcurementReadOnlyPanel.tsx src/next/NextProcurementStandalonePage.tsx src/next/NextInventarioReadOnlyPanel.tsx src/next/NextInventarioPage.tsx src/next/NextMaterialiConsegnatiReadOnlyPanel.tsx src/next/NextMaterialiConsegnatiPage.tsx src/next/NextMezziPage.tsx src/next/NextIALibrettoPage.tsx src/next/NextIADocumentiPage.tsx src/next/NextLibrettiExportPage.tsx src/next/NextCisternaIAPage.tsx src/next/NextAutistiAdminPage.tsx src/next/NextAutistiInboxHomePage.tsx src/next/internal-ai/*.ts src/next/internal-ai/*.tsx` -> OK
  - `npm run build` -> OK, warning Vite invariati su chunk grandi e doppio import `jspdf`

## 12.47 Aggiornamento 2026-04-04 - Euromecc read-only dentro la chat libera IA
- La chat `/next/ia/interna` puo ora rispondere davvero su `Euromecc` senza interrogazioni sparse nella pagina e senza riaprire alcuna scrittura business.
- Architettura applicata:
  - retriever/read-model dedicato `src/next/internal-ai/internalAiEuromeccReadonly.ts`;
  - sorgenti lette davvero: topologia statica `euromeccAreas.ts` + snapshot dominio `readEuromeccSnapshot()` che aggrega `euromecc_pending`, `euromecc_done`, `euromecc_issues`, `euromecc_area_meta`;
  - bridge chat `internalAiChatOrchestratorBridge.ts` che intercetta i prompt Euromecc e serve una risposta read-only spiegabile dallo snapshot aggregato;
  - planner universale aggiornato con `next.euromecc`, `adapter.euromecc`, `clone.euromecc-readonly`, route target `/next/euromecc` e vincolo esplicito di sola lettura.
- Copertura reale verificata:
  - stato generale impianto;
  - problemi aperti;
  - manutenzioni da fare;
  - tipo cemento per silo;
  - riepilogo per area;
  - sili senza cemento impostato;
  - area piu critica in base a issue aperte + pending.
- Boundary preservato:
  - nessun writer Euromecc chiamato dalla IA;
  - nessuna modifica a route, shell, sicurezza o moduli legacy IA;
  - nessun backend live-read business aggiuntivo.
- Verifiche eseguite:
  - `node_modules\\.bin\\eslint.cmd src/next/internal-ai/internalAiEuromeccReadonly.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiUniversalContracts.ts src/next/internal-ai/internalAiUniversalRequestResolver.ts` -> OK
  - `npm run build` -> OK
  - runtime locale su `/next/ia/interna`:
    - `che cemento c'e nel silo 1?` -> risposta con `CEM III/A 42.5 N`
    - `quali problemi aperti ci sono nell'impianto euromecc?` -> nessun problema aperto
    - `quali manutenzioni risultano da fare in euromecc?` -> nessuna manutenzione aperta
    - `quali sili sono senza cemento impostato in euromecc?` -> elenco sili senza cemento
    - `fammi un riepilogo stato euromecc` -> contatori e stato generale
- Limiti residui dichiarati:
  - la risposta Euromecc e oggi deterministica e read-only nel bridge chat, non un live-read business lato backend IA separato;
  - nessun writer, update o chiusura problemi viene esposto alla chat IA.

## 12.48 Aggiornamento 2026-04-10 - UX document-driven `Magazzino` nella chat IA
- La chat `/next/ia/interna` non richiede piu prompt rigidi per i documenti `Magazzino`: con un allegato puo partire anche da input vuoto o da testo minimale e usa il documento come trigger principale del flusso.
- Cosa cambia davvero nel runtime:
  - `src/next/NextInternalAiPage.tsx` consente submit attachment-only, genera un prompt base prudente e mostra una proposal card automatica con `tipo rilevato`, `azione proposta`, `motivazione`, `confidenza`, eventuale singola domanda di sblocco e CTA verso il modulo target;
  - `src/next/internal-ai/internalAiUniversalDocumentRouter.ts` riconosce meglio fatture materiali `Magazzino`, fatture `AdBlue` e documenti ambigui anche da nomi file realistici con `_` e `-`;
  - `src/next/internal-ai/internalAiUniversalHandoff.ts` porta i casi documentali forti su `/next/magazzino?tab=documenti-costi`, mantiene prudente il payload ambiguo e filtra meglio riferimenti sporchi `targa/materiale`.
- Comportamento funzionale chiuso:
  - caso materiali gia arrivati / gia consolidati -> proposta `Riconcilia documento`, con niente carico automatico in chat e conferma finale nel modulo `Magazzino`;
  - caso `AdBlue` non ancora caricato -> proposta `Carica stock AdBlue`, sempre con conferma finale nel modulo `Magazzino`;
  - caso ambiguo -> proposta `DA VERIFICARE` con una sola domanda breve di sblocco e nessuna scrittura.
- Boundary preservati:
  - nessuna nuova scrittura business oltre ai due casi gia approvati `riconcilia_senza_carico` e `carica_stock_adblue`;
  - nessun backend OCR/live-read aggiuntivo aperto;
  - nessun riuso runtime IA legacy.
- Verifiche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiUniversalDocumentRouter.ts src/next/internal-ai/internalAiUniversalHandoff.ts` -> OK
  - `npm run build` -> OK
  - runtime locale verificato su `/next/ia/interna` con allegati dummy `fattura_mariba_534909.pdf`, `fattura_adblue_aprile.pdf`, `documento_ambiguo.pdf`
- Limiti residui:
  - la classificazione automatica resta tanto migliore quanto piu forti sono i segnali documentali disponibili nel clone (`nome file`, `excerpt/testo`, metadata allegato);
  - serve audit separato su PDF/immagini reali e su handoff persistiti prima di promuovere questa UX oltre `PARZIALE`.

## 12.49 Aggiornamento 2026-04-11 - Conferma + esecuzione inline `Magazzino` nel modale IA
- La chat `/next/ia/interna` non usa piu `Magazzino` come passaggio obbligatorio per chiudere i due soli casi scriventi ammessi: quando il match documentale e forte, la scheda dossier mostra conferma, esegue e restituisce l'esito finale nello stesso modale/chat.
- Cosa cambia davvero nel runtime:
  - `src/next/NextInternalAiPage.tsx` risolve in background i route `Magazzino` del dossier, abilita `Conferma riconciliazione` o `Conferma carico AdBlue`, esegue inline e mostra un esito finale leggibile senza peggiorare la UI dossier;
  - `src/next/internal-ai/internalAiMagazzinoControlledActions.ts` ricostruisce il contesto `Documenti e costi`, riusa in modo controllato le decisioni `riconcilia_senza_carico` e `carica_stock_adblue` e ricarica lo stato dopo l'azione;
  - `src/utils/cloneWriteBarrier.ts` aggiunge una scoped allowance temporanea solo per `storageSync.setItemSync` su `@inventario` mentre l'azione inline IA e in corso;
  - `Apri in Magazzino` resta disponibile come fallback, ispezione manuale e approfondimento.
- Comportamento funzionale chiuso:
  - caso materiali gia arrivati / gia consolidati -> conferma inline, esecuzione inline e risultato con documento collegato, materiale, costo/prezzo disponibile e conferma che non c'e aumento stock;
  - caso `AdBlue` -> conferma inline, esecuzione inline e risultato con materiale AdBlue aggiornato, quantita, unita e documento collegato;
  - caso ambiguo o match debole -> `DA VERIFICARE`, nessun bottone inline, nessuna scrittura e al massimo una sola domanda breve di sblocco.
- Boundary preservati:
  - nessuna nuova scrittura business oltre ai due casi gia approvati `riconcilia_senza_carico` e `carica_stock_adblue`;
  - nessuna apertura su consegne, manutenzioni, ordini, preventivi o listino;
  - nessun backend OCR/live-read aggiuntivo aperto;
  - nessun riuso runtime IA legacy.
- Verifiche eseguite:
  - `npx eslint src/utils/cloneWriteBarrier.ts src/next/internal-ai/internalAiMagazzinoControlledActions.ts src/next/NextInternalAiPage.tsx` -> OK
  - `npm run build` -> OK
  - runtime locale verificato su `/next/ia/interna` con `fattura_mariba_534909.pdf`, `fattura_adblue_aprile.pdf`, `documento_ambiguo.pdf`
  - fallback `Apri in Magazzino` verificato come funzionante verso `/next/magazzino?tab=documenti-costi`
- Limiti residui:
  - il support snapshot live usato nel task espone `Righe supporto: 3`, `Pronte: 0`, `Bloccate: 3`, quindi la prova end-to-end su un candidato reale pronto resta `DA VERIFICARE`;
  - serve audit separato sul matching reale `MARIBA` / `AdBlue` e sulla scoped allowance del barrier prima di promuovere questa capability oltre `PARZIALE`.

## 12.50 Aggiornamento 2026-04-11 - Review documento full screen `Magazzino`
- La UX documentale della chat `/next/ia/interna` non si ferma piu a una card sopra il thread: fatture e preventivi aprono ora una review documento full screen pensata come schermata gestionale operativa.
- Cosa cambia davvero nel runtime:
  - `src/next/NextInternalAiPage.tsx` apre automaticamente un modale full screen dedicato, con tabs documento quando gli allegati sono piu di uno;
  - la colonna sinistra mostra il documento grande e leggibile (PDF nativo, immagine con zoom, testo/evidenza se necessario);
  - la colonna destra separa chiaramente `Header documento`, `Campi estratti`, `Righe materiali`, `Match inventario e proposta IA`, `Decisione utente`, `Esecuzione`, `Evidenza documento`;
  - la decisione utente vive nel modale e non piu nella sola card compact sopra la chat: `Collega a materiale esistente`, `Aggiungi costo/documento`, `Crea nuovo articolo`, `Carica stock`, `DA VERIFICARE`.
- Comportamento funzionale chiuso:
  - fattura materiali: la review mostra il documento in grande, la proposta IA e la scelta utente prima di qualsiasi tentativo inline o fallback;
  - fattura AdBlue: la review mostra il PDF, la scelta `Carica stock` e, solo se il match e forte, puo portare all'azione inline gia autorizzata;
  - preventivo: la review resta la stessa ma il fallback porta a `Procurement / ordini / fornitori`, senza esecuzioni inline;
  - caso ambiguo: review leggibile, stato `DA VERIFICARE`, nessuna esecuzione automatica.
- Boundary preservati:
  - nessun writer nuovo aperto;
  - nessuna scrittura automatica subito dopo l'analisi;
  - inline ancora limitato ai due soli casi gia autorizzati del dominio `Magazzino`;
  - nessun riuso runtime IA legacy.
- Verifiche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx` -> OK
  - `npm run build` -> OK
  - runtime locale verificato su `/next/ia/interna` con `fattura mariba.jpeg`, `fattura_adblue_aprile.pdf`, `preventivo_materiale_test.pdf`, `documento_ambiguo_test.pdf`
  - verificate preview grande, decision cards, fallback distinto e assenza di auto-esecuzione nei casi non forti
- Limiti residui:
  - serve audit separato su allegati reali complessi, multi-riga o con OCR debole;
  - la decisione utente non viene ancora persistita come workflow separato oltre allo stato UI del modale;
  - la prova end-to-end con candidato live `pronto` resta demandata al punto gia aperto sul dataset reale.

## 12.51 Aggiornamento 2026-04-11 - Pipeline documentale reale `Magazzino`
- La review full screen `Magazzino` usa ora una pipeline documentale vera nel backend IA separato e non piu solo classificazione o metadata deboli.
- Cosa cambia davvero nel runtime:
  - `backend/internal-ai/server/internal-ai-document-extraction.js` distingue `pdf_text`, `pdf_scan` e `image_document`, usa parsing locale PDF quando possibile e provider OpenAI solo lato server per scansioni/immagini;
  - `backend/internal-ai/server/internal-ai-adapter.js` salva il nuovo payload `documentAnalysis` sugli allegati IA;
  - `src/next/internal-ai/internalAiUniversalDocumentRouter.ts` usa i dati estratti per correggere i casi `AdBlue`, `preventivo` e `documento ambiguo`;
  - `src/next/internal-ai/internalAiUniversalHandoff.ts` e `src/next/NextInternalAiPage.tsx` propagano header documento, righe materiali e warning reali fino alla review full screen.
- Comportamento funzionale chiuso:
  - fattura materiali -> header ricco + righe reali per review e match prudente;
  - fattura `AdBlue` -> quantita `lt`, prezzo e proposta `Carica stock AdBlue` corretti nella review;
  - preventivo -> intestazione, righe e instradamento corretto a procurement;
  - documento ambiguo -> solo dati trovati davvero, nessuna riga inventata, `DA VERIFICARE`.
- Boundary preservati:
  - nessun writer business nuovo;
  - nessuna modifica al perimetro della barrier;
  - nessun riuso runtime IA legacy;
  - provider LLM usato solo nel backend IA separato.
- Verifiche eseguite:
  - `npx eslint src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiDocumentAnalysis.ts src/next/internal-ai/internalAiChatAttachmentsClient.ts src/next/internal-ai/internalAiUniversalEntityResolver.ts src/next/internal-ai/internalAiUniversalDocumentRouter.ts src/next/internal-ai/internalAiUniversalTypes.ts src/next/internal-ai/internalAiUniversalOrchestrator.ts src/next/internal-ai/internalAiUniversalHandoff.ts src/next/NextInternalAiPage.tsx backend/internal-ai/server/internal-ai-document-extraction.js backend/internal-ai/server/internal-ai-chat-attachments.js backend/internal-ai/server/internal-ai-adapter.js` -> OK
  - `npm run build` -> OK
  - runtime locale verificato su `/next/ia/interna` con `tmp-runtime-materiali.png`, `tmp-runtime-adblue.pdf`, `tmp-runtime-preventivo.pdf`, `tmp-runtime-ambiguo.pdf`
  - review full screen verificata `full viewport` in tutti e quattro i casi
- Limiti residui:
  - serve audit separato su OCR debole, PDF pesanti e allegati reali multi-page;
  - resta un warning locale `pdfjs-dist` sui font standard in ambiente Windows, non bloccante ma ancora da pulire;
  - la capability resta `PARZIALE` finche la robustezza non viene rivalidata su documenti live non sintetici.

## 12.52 Aggiornamento 2026-04-11 - Fix riconciliazione stock + review destra operativa `Magazzino`
- Follow-up mirato nel solo perimetro autorizzato `Magazzino` + IA interna, senza toccare madre legacy, Manutenzioni o barrier.
- Cosa cambia davvero nel runtime:
  - `src/next/NextMagazzinoPage.tsx` e `src/next/internal-ai/internalAiMagazzinoControlledActions.ts` permettono il ramo `riconcilia_senza_carico` solo quando l'arrivo procurement compatibile risulta gia consolidato a stock;
  - nei casi tipo `MARIBA` la scelta `Riconcilia documento` o `Aggiungi costo/documento a materiale esistente` non aumenta piu la giacenza e fa solo collegamento documento, riconciliazione e tracciatura sorgente;
  - se esiste copertura procurement ma la sorgente non e ancora consolidata, la sola riconciliazione viene bloccata e il carico quantita resta confinato a `Carica stock` o ai casi davvero non ancora caricati;
  - `src/next/NextInternalAiPage.tsx` e `src/next/internal-ai/internal-ai.css` riordinano la colonna destra della review full screen in ordine operativo, rendono `Righe estratte` il blocco visivo principale e spostano i dettagli tecnici in un box collassabile chiuso di default.
- Boundary preservati:
  - nessun nuovo writer business aperto;
  - nessuna modifica a `cloneWriteBarrier.ts`;
  - nessuna riapertura di runtime legacy o di moduli fuori whitelist.
- Verifiche eseguite:
  - `npx eslint src/next/NextMagazzinoPage.tsx src/next/internal-ai/internalAiMagazzinoControlledActions.ts src/next/NextInternalAiPage.tsx src/next/internal-ai/internal-ai.css` -> OK sul runtime, con warning noto sul CSS ignorato dalla config ESLint del repo
  - `npm run build` -> OK
  - runtime verificato su `/next/ia/interna` con `fattura_mariba_534909.pdf`, `fattura_adblue_aprile.pdf`, `documento_ambiguo.pdf`
  - review destra confermata con ordine `Documento`, `Righe estratte`, `Match inventario`, `Decisione`, `Azione proposta IA`, `Dettagli tecnici`
  - dataset live `/next/magazzino?tab=documenti-costi` verificato con `Pronte: 0`, `Bloccate: 3`
- Limiti residui:
  - la patch e chiusa nel clone, ma la prova browser end-to-end su un candidato reale `Pronto` che dimostri `riconciliazione senza carico` senza aumento quantita resta `DA VERIFICARE`;
  - la capability IA `Magazzino` resta `PARZIALE`.

## 12.53 Aggiornamento 2026-04-11 - Audit runtime E2E fix `Magazzino` + IA interna
- Verifica runtime reale completata senza patch runtime aggiuntive e senza forzare scritture business sul dataset live.
- Cosa cambia davvero nello stato verificato:
  - `/next/magazzino?tab=documenti-costi` conferma che il pannello procurement ha casi pronti, ma il ramo documentale richiesto no: `Righe supporto: 3`, `Pronte: 0`, `Bloccate: 3`;
  - i candidati documentali live correnti restano bloccati e quindi non consentono di misurare in browser quantita prima/dopo per `Riconcilia documento`, `Aggiungi costo/documento` o `Carica stock`;
  - `/next/ia/interna` conferma la gerarchia destra richiesta e la leggibilita di `Righe estratte`, ma i dossier live correnti `fattura_mariba_534909.pdf` e `fattura_adblue_aprile.pdf` mantengono `Scelta attuale: DA VERIFICARE` e non espongono bottoni `Conferma`.
- Boundary preservati:
  - nessun writer business reale eseguito;
  - nessun micro-fix runtime applicato in questo audit;
  - nessun allargamento barrier o writer.
- Verifiche eseguite:
  - `npx eslint src/next/NextMagazzinoPage.tsx src/next/internal-ai/internalAiMagazzinoControlledActions.ts src/next/NextInternalAiPage.tsx src/next/internal-ai/internal-ai.css` -> OK sul runtime, con warning noto sul CSS ignorato dalla config ESLint del repo
  - `npm run build` -> OK
  - runtime verificato su `/next/magazzino?tab=documenti-costi`
  - runtime verificato su `/next/ia/interna` con `fattura_mariba_534909.pdf`, `fattura_adblue_aprile.pdf`, `documento_ambiguo.pdf`
- Limiti residui:
  - il fix resta dimostrato nel codice ma non ancora provabile end-to-end sul ramo documentale live, perche manca un candidato `Pronto`;
  - la capability `Magazzino` della IA interna resta `PARZIALE` finche non si presenta un caso live eseguibile con audit separato.

## 12. Cosa non va ancora fatto
- Non implementare chat IA runtime collegata ai backend legacy.
- Non agganciare la nuova IA a `aiCore`, `estrazioneDocumenti`, `analisi_economica_mezzo`, `stamp_pdf`, Cloud Run libretto o `server.js`.
- Non scrivere su dataset business reali.
- Non salvare chiavi provider dal client.
- Non far generare patch dirette al repository senza preview e approvazione.
