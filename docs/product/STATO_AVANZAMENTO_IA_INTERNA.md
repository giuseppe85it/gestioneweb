# STATO AVANZAMENTO IA INTERNA GESTIONALE

Data audit: 2026-03-11  
Ultimo aggiornamento scaffolding: 2026-03-13  
Stato generale: SCAFFOLDING V1 ISOLATO AVVIATO  
Scopo: fotografia tecnica dello stato attuale del repository e primo avvio del sottosistema IA interno in forma non operativa, sicura e reversibile.

## 0. Regola operativa
- La fonte operativa unica dello stato IA interno e `docs/product/CHECKLIST_IA_INTERNA.md`.
- Questo documento resta il quadro esteso di contesto, rischi, fasi e fatti verificati.
- Ogni futuro task relativo alla IA interna deve aggiornare obbligatoriamente la checklist unica; se non lo fa, il task e incompleto.

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
  - server Express/OpenAI locale o edge non dimostrato come canale attivo.

### 2.4 Preview, export e artifact
- Il repo ha gia un pattern forte di preview PDF:
  - `PdfPreviewModal`
  - `openPreview`
  - download/share/copia link/WhatsApp
- Esiste ora un primo archivio persistente locale e isolato del clone per gli artifact IA.
- Non esiste ancora un archivio persistente server-side separato e ricercabile.
- Non esiste nel repo un workflow approva/scarta/rollback per modifiche IA su codice o dati.

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
  - ultime targhe cercate;
  - richieste recenti della chat interna;
  - artifact recenti aperti, salvati o archiviati;
  - intenti usati e relativo conteggio;
  - ultimo stato di lavoro del modulo.
- Il tracking resta confinato alle sole azioni del subtree `/next/ia/interna*`:
  - apertura sezione;
  - selezione targa;
  - esecuzione report targa;
  - invio prompt chat;
  - apertura/salvataggio/archiviazione artifact.
- Nessuna pagina fuori dal modulo IA viene tracciata e nessun dataset business viene toccato.
- La UI overview mostra ora una sezione minima di memoria recente per rendere il modulo piu pratico da riaprire, senza trasformarlo in memoria operativa completa del gestionale.

## 12.8 Aggiornamento 2026-03-13
- Eseguito audit mirato del blocco `MATERIALI / MOVIMENTI` del report mezzo IA interno, limitato al perimetro clone/NEXT e al sottosistema `/next/ia/interna*`.
- Verificati i writer legacy che alimentano `@materialiconsegnati`:
  - `MaterialiConsegnati` puo salvare `destinatario.refId = id mezzo`;
  - `Manutenzioni` puo salvare `destinatario.refId = targa` con motivo `UTILIZZO MANUTENZIONE`.
- Verificato in lettura read-only il dataset reale corrente:
  - `@materialiconsegnati` contiene 18 record;
  - tutti i 18 record correnti risultano riconducibili in modo forte a una targa tramite `destinatario.label` o `destinatario.refId`;
  - nessun record corrente risulta non dimostrabile o conflittuale;
  - 18 record su 18 espongono una data o timestamp parsabile;
  - il supporto costi da `@documenti_magazzino` e presente ma oggi e solo descrittivo, con 1 documento e 3 righe `voci` senza targa esplicita.
- Il dominio materiali del clone e la facade del report IA distinguono ora:
  - match `forte` quando la targa e leggibile in modo esplicito dal destinatario;
  - match `plausibile` quando resta solo il collegamento legacy via `refId = id mezzo`;
  - link `non dimostrabili` lasciati fuori dal report invece di essere promossi a certi.
- Il report dichiara anche lo stato reale del filtro periodo materiali:
  - `affidabile` quando tutte le righe incluse hanno data leggibile;
  - `parziale` quando solo una parte dei record e databile;
  - `non dimostrabile` quando le date non consentono un taglio temporale difendibile.
- Nessuna scrittura Firestore/Storage business, nessun backend IA reale e nessun riuso runtime dei moduli IA legacy sono stati introdotti da questo task.

## 12.9 Aggiornamento 2026-03-13
- Eseguito audit mirato del blocco `DOCUMENTI / COSTI / PERIMETRO ECONOMICO` del report mezzo IA interno, limitato al perimetro clone/NEXT e al sottosistema `/next/ia/interna*`.
- Verificate le fonti reali oggi coinvolte dal clone:
  - `storage/@costiMezzo` per costi mezzo diretti;
  - `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici` per documentale IA;
  - `@analisi_economica_mezzi` come snapshot analitico salvato;
  - `storage/@preventivi` e `storage/@preventivi_approvazioni` come workflow economico separato.
- Verificato in lettura read-only il dataset reale corrente:
  - `@costiMezzo` contiene 0 record;
  - `@documenti_mezzi` contiene 3 record, tutti con targa, data, importo e file leggibili;
  - `@documenti_magazzino` contiene 1 record con data/importo/file leggibili ma senza targa diretta;
  - `@documenti_generici` contiene 0 record;
  - `@analisi_economica_mezzi` contiene 1 snapshot con docId=targa e `updatedAt` parsabile;
  - `@preventivi` contiene 7 record ma nessuno espone una targa diretta del mezzo;
  - `@preventivi_approvazioni` contiene 1 record con targa e stato, ma resta dominio capo/approvazioni.
- Il dominio documenti-costi del clone e la facade del report IA distinguono ora:
  - documenti/costi diretti davvero letti dal mezzo;
  - snapshot analitico legacy salvato, separato dai documenti base;
  - procurement e approvazioni reali ma fuori perimetro del blocco economico del report mezzo.
- Il report dichiara anche lo stato reale del filtro periodo documenti/costi:
  - `affidabile` quando i record diretti inclusi espongono una data evento parsabile;
  - `parziale` quando solo una parte dei record diretti e databile;
  - `non dimostrabile` quando il blocco diretto non ha date evento affidabili.
- Nessuna scrittura Firestore/Storage business, nessun backend IA reale e nessun riuso runtime dei moduli IA legacy sono stati introdotti da questo task.

## 12.10 Aggiornamento 2026-03-13
- Eseguito audit mirato del perimetro `procurement / preventivi / approvazioni` rispetto al report mezzo IA interno, sempre limitato al clone/NEXT e al sottosistema `/next/ia/interna*`.
- Verificato sul runtime clone e sui moduli madre collegati che:
  - `src/next/domain/nextProcurementDomain.ts` copre solo `@ordini` e tiene bloccata la parte `preventivi`;
  - `src/pages/Acquisti.tsx` usa `storage/@preventivi` come workflow procurement globale con allegati e righe, non come dataset mezzo-centrico;
  - `src/pages/CapoCostiMezzo.tsx` e `src/next/domain/nextCapoDomain.ts` usano `storage/@preventivi_approvazioni` come overlay approvativo su record diretti gia letti dal blocco costi/documenti.
- Verificato in lettura read-only il dataset reale corrente:
  - `storage/@preventivi` contiene 7 record, shape `preventivi`, ma 0 record con `targa` o `mezzoTarga` diretta;
  - `storage/@preventivi_approvazioni` contiene 1 record con targa `TI324623` e stato `rejected`;
  - l'id dell'approvazione letta e `TI324623__@documenti_mezzi__POYUauyuvueLGkngM8P1`, quindi annota un documento diretto in `@documenti_mezzi` e non un record nativo di `@preventivi`;
  - in `@documenti_mezzi` esiste infatti 1 record `PREVENTIVO` con la stessa targa e lo stesso `docId`.
- Decisione strutturale applicata nel dominio clone e nel report IA:
  - `@preventivi` resta `fuori_perimetro` dal report mezzo IA come blocco economico diretto;
  - `@preventivi_approvazioni` puo essere letto solo come supporto read-only separato, mai come prova di copertura procurement del mezzo;
  - il report espone ora conteggi e limiti di questo perimetro senza promuovere collegamenti deboli a match certi.
- Nessuna scrittura Firestore/Storage business, nessun backend IA reale e nessun riuso runtime dei moduli IA legacy sono stati introdotti da questo task.

## 12.11 Aggiornamento 2026-03-13
- Eseguito audit strutturale delle funzioni IA legacy gia presenti nella madre e nei backend collegati, con esito fissato nella mappa permanente `docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md`.
- Verificato che il valore business IA gia realmente presente nel repo non e uniforme ma si concentra in pochi blocchi forti:
  - `IALibretto` per estrazione libretto mezzo;
  - `IADocumenti` + `estrazioneDocumenti` per OCR/classificazione documenti;
  - `AnalisiEconomica` + `analisi_economica_mezzo` per snapshot economico mezzo;
  - `Acquisti` + `estraiPreventivoIA` per estrazione preventivi;
  - cluster `cisterna` per documenti e schede verticali.
- Verificato anche che diversi canali legacy non sono adatti a diventare runtime canonico della nuova IA:
  - `IAApiKey` salva il segreto Gemini dal client su `@impostazioni_app`;
  - `IALibretto` usa Cloud Run esterno non governato dal repo;
  - `aiCore` e referenziata dal frontend ma non risulta backend canonico coerente nel codice versionato;
  - `server.js` e `api/pdf-ai-enhance.ts` esistono come canali paralleli OpenAI ma non sono dimostrati come flusso operativo unico.
- Matrice decisionale corrente:
  - priorita `ALTA`: `libretto`, `documenti`, `analisi economica`, `estrazione preventivi`;
  - priorita `MEDIA`: `cisterna` in wave separata, audit copertura libretti come supporto, `stamp_pdf` solo in workflow approvativo dedicato;
  - priorita `BASSA` o `FUORI PERIMETRO INIZIALE`: hub IA, gestione API key, `aiCore`, server/edge OpenAI non canonici, export PDF libretti e writer business diretti.
- Decisione strutturale confermata: la nuova IA interna deve assorbire il valore di business delle capability legacy, ma non puo riusarne a runtime writer, segreti client, backend esterni o endpoint legacy come canale canonico.
- Nessuna scrittura Firestore/Storage business, nessun backend IA reale e nessun riuso runtime dei moduli IA legacy sono stati introdotti da questo task.

## 12.12 Aggiornamento 2026-03-13
- Ridisegnata la UI del sottosistema `/next/ia/interna*` con perimetro strettamente visuale, senza toccare facade, domain, backend o contratti dati.
- La home IA e stata semplificata per avvicinarsi a un assistente conversazionale professionale:
  - chat centrale come punto di ingresso principale;
  - compositore piu ampio e pulito;
  - pochi suggerimenti rapidi iniziali;
  - archivio/recenti e stati secondari spostati nella colonna laterale;
  - guard rail, memoria modulo e contratti spostati in area avanzata comprimibile.
- La preview report mezzo e stata riallineata alla logica visiva del dossier mezzi:
  - intestazione forte con identita mezzo;
  - riepilogo alto tramite card sintetiche;
  - sezioni principali e dettagli di copertura separati;
  - azioni locali, fonti, dati mancanti ed evidenze disposti in blocchi ordinati;
  - distinzione visiva chiara tra report mezzo attivo e report autista/combinato non ancora disponibili.
- Tutti i testi visibili aggiornati dal task sono ora in italiano; il redesign non cambia:
  - letture dati del clone;
  - flussi business;
  - persistenza locale gia esistente;
  - perimetro read-only del sottosistema IA interno.

## 12.13 Aggiornamento 2026-03-14
- Aperto il primo assorbimento operativo di una capability legacy ad alta priorita nel sottosistema `/next/ia/interna*`: la scelta corrente e `Analisi economica mezzo`.
- Motivazione della scelta:
  - valore business alto gia dimostrato nella madre;
  - fattibilita immediata nel clone grazie a layer read-only gia esistenti per documenti/costi e snapshot economico salvato;
  - perimetro piu sicuro di `libretto`, `documenti` e `preventivi`, che oggi richiedono upload, OCR o backend legacy piu esposti;
  - nessuna necessita di scrittura business automatica.
- Patch runtime applicata:
  - creato `src/next/internal-ai/internalAiEconomicAnalysisFacade.ts` come facade clone-safe dedicato;
  - la home IA espone ora una preview separata di analisi economica mezzo, attivabile dalla stessa ricerca targa;
  - la preview usa solo:
    - documenti/costi diretti gia normalizzati;
    - l'eventuale snapshot legacy in `@analisi_economica_mezzi`;
    - audit perimetrale read-only del procurement, senza farlo entrare nella base economica diretta.
- Perimetro dichiarato in modo esplicito:
  - nessuna rigenerazione IA dal clone;
  - nessun backend legacy canonico;
  - nessuna scrittura su Firestore/Storage business;
  - procurement e approvazioni restano fuori dal blocco economico diretto;
  - la capability resta preview-first e spiegabile.

## 12.14 Aggiornamento 2026-03-14
- Eseguito un riordino profondo della UI di `/next/ia/interna*`, limitato a `NextInternalAiPage.tsx` e `internal-ai.css`, con obiettivo preciso: home molto piu semplice e risultato aperto in una preview grande separata dalla schermata iniziale.
- Verifica tecnica del problema segnalato:
  - l'errore Vite `NextInternalAiPage.tsx 500 / failed to reload` non e risultato riproducibile nello stato corrente del repository;
  - `npx eslint src/next/NextInternalAiPage.tsx` e `npm run build` confermano che non c'e un errore sintattico o di import/path persistente nel file.
- Correzioni UI/runtime applicate:
  - eliminata la preview report/economica inline dalla home, sostituendola con una preview overlay dedicata;
  - ridotti i blocchi simultanei in primo piano, mantenendo in home solo chat, richiesta targa e accesso rapido secondario;
  - spostati disponibilita modalita, assorbimento legacy, guard rail e contesto operativo nell'area avanzata;
  - aumentato il contrasto visivo di shell, card, badge, call to action e preview.
- Correzione warning React:
  - nel subtree IA sono state sostituite varie `key` basate solo su stringhe ripetibili con chiavi stabili che includono anche l'indice locale della lista;
  - questo riduce il rischio del warning `Each child in a list should have a unique key prop` sulla pagina IA interna.
- Guard rail invariati:
  - nessuna modifica a facade/domain/backend;
  - nessuna scrittura business;
  - nessun riuso runtime dei moduli IA legacy;
  - testi visibili mantenuti in italiano.

## 12.15 Aggiornamento 2026-03-14
- Eseguita una seconda pulizia forte della UI del sottosistema `/next/ia/interna*`, sempre limitata a `NextInternalAiPage.tsx` e `internal-ai.css`, con focus specifico sul ridurre il rumore tecnico e rendere la preview molto piu vicina a un dossier leggibile.
- Modifiche applicate alla home:
  - chat ancora piu protagonista;
  - meno pannelli visibili subito;
  - archivio/recenti spostati in forma piu secondaria;
  - modalita non attive e dettagli tecnici lasciati nell'area avanzata;
  - contrasto visivo ulteriormente rafforzato.
- Modifiche applicate alla preview:
  - hero piu pulito con stati ridotti a badge sintetici;
  - poche card chiave in alto come riepilogo esecutivo;
  - sezioni principali mostrate con taglio business-first;
  - fonti, limiti, stato anteprima, indicatori secondari e azioni locali nascosti in espansioni secondarie.
- Scelta UI strutturale del task:
  - il report non si presenta piu come dashboard/debug piena di note e pannelli laterali;
  - la parte primaria mostra solo cio che serve a capire il mezzo;
  - la parte tecnica resta disponibile ma non invade la lettura iniziale.
- Guard rail invariati:
  - nessuna modifica a facade/domain/logica dati;
  - nessuna scrittura business;
  - nessun impatto sui flussi correnti;
  - testi visibili mantenuti in italiano.

## 12.16 Aggiornamento 2026-03-14
- Eseguito un task separato di stabilizzazione errori console e hot reload collegati alla UI IA interna, senza toccare facade, domain o logica dati del sottosistema.
- Esito dell'audit tecnico:
  - `src/next/NextInternalAiPage.tsx` oggi non mostra un errore sintattico o un import/export rotto persistente;
  - `npx eslint src/next/NextInternalAiPage.tsx` passa;
  - `npm run build` passa;
  - il `500 / failed to reload` segnalato dal dev server su `NextInternalAiPage.tsx` non e risultato riproducibile nello stato corrente del repository.
- Causa concreta individuata per il warning React:
  - il warning `Each child in a list should have a unique "key" prop` con riferimento a `Home` non proveniva dal subtree IA, ma dalla `Home` madre montata nel clone tramite `NextHomePage`;
  - in `src/pages/Home.tsx` alcune liste usavano `key` basate solo su `targa`, quindi duplicate quando la stessa targa ricompare piu volte.
- Fix minimo applicato:
  - le `key` sospette in `Home` sono state rese stabili aggiungendo sempre anche l'indice locale della lista;
  - nessun flusso business, dataset o contratto dati e stato modificato.
- Guard rail invariati:
  - nessuna scrittura business;
  - nessun riuso runtime dei moduli IA legacy;
  - nessun impatto sui flussi correnti;
  - testi visibili mantenuti in italiano.

## 12. Cosa non va ancora fatto
- Non implementare chat IA runtime collegata ai backend legacy.
- Non agganciare la nuova IA a `aiCore`, `estrazioneDocumenti`, `analisi_economica_mezzo`, `stamp_pdf`, Cloud Run libretto o `server.js`.
- Non scrivere su dataset business reali.
- Non salvare chiavi provider dal client.
- Non far generare patch dirette al repository senza preview e approvazione.
