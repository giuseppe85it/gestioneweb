# STATO AVANZAMENTO IA INTERNA GESTIONALE

Data audit: 2026-03-11  
Ultimo aggiornamento scaffolding: 2026-03-22  
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

## 12. Cosa non va ancora fatto
- Non implementare chat IA runtime collegata ai backend legacy.
- Non agganciare la nuova IA a `aiCore`, `estrazioneDocumenti`, `analisi_economica_mezzo`, `stamp_pdf`, Cloud Run libretto o `server.js`.
- Non scrivere su dataset business reali.
- Non salvare chiavi provider dal client.
- Non far generare patch dirette al repository senza preview e approvazione.
