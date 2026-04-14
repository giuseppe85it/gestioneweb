# CONTEXT_CLAUDE

## 1. STACK TECNICO
- Frontend: React 19.2, React DOM 19.2, TypeScript 5.9, Vite 7.2, React Router DOM 7.9.
- Data layer client: Firebase Web SDK 12.6 (`firestore`, `storage`, `functions`, `auth`).
- Auth attuale: bootstrap con `signInAnonymously()` in `src/App.tsx`; nessun login admin dedicato nel frontend principale.
- Backend e servizi server-side nel repo: Express 5, `body-parser`, `dotenv`, `firebase-admin`, `node-fetch`, OpenAI SDK 6.
- PDF e documenti: `jspdf`, `jspdf-autotable`, `pdf-lib`, `sharp`.
- UI/analisi: `recharts`, `react-easy-crop`.
- Audit/runtime: `playwright`.
- Script root disponibili: `dev`, `build`, `lint`, `preview`, `internal-ai-backend:start`, `internal-ai:observe-next`.
- Script test automatici dedicati: assenti nel `package.json` root.

### Struttura cartelle principali
- `src/pages/*`: app legacy admin/madre.
- `src/next/*`: nuova app NEXT, shell separata, pages, domini, IA interna e bridge clone-safe.
- `src/next/domain/*`: read model NEXT e accesso dati normalizzato per la nuova app.
- `src/autisti/*`: app autisti legacy.
- `src/autistiInbox/*`: inbox/admin autisti legacy.
- `src/components/*`: componenti UI condivisi legacy.
- `src/utils/*`: helper condivisi, storage sync, PDF, barrier clone, formattazioni.
- `backend/internal-ai/*`: backend IA separato del sottosistema `/next/ia/interna`.
- `functions/*`: Cloud Functions Firebase legacy.
- `functions-schede/*`: Functions legacy dedicate alla verticale cisterna/schede.
- `api/*`: endpoint edge/serverless separati dal backend IA interno.
- `docs/*`: stato, architettura, dati, audit, change report, continuity report.

## 2. MODULI ESISTENTI
| Modulo | Cosa fa | Stato |
|---|---|---|
| Legacy admin shell | Monta tutte le route principali a `/` e resta la madre operativa di riferimento. | completo |
| Home + Centro di Controllo legacy | Dashboard, alert, priorita, ingressi rapidi ai moduli. | completo |
| Mezzi + Dossier + Analisi legacy | Lista mezzi, dossier per targa, gomme, rifornimenti, analisi economica. | completo |
| Operativita + Lavori legacy | Liste lavori, dettaglio lavoro, workbench operativo globale. | completo |
| Procurement + Magazzino legacy | `Acquisti`, `MaterialiDaOrdinare`, `Ordini`, `DettaglioOrdine`, `Inventario`, `MaterialiConsegnati`, `AttrezzatureCantieri`. | completo |
| Area Capo legacy | Overview mezzi e costi per targa. | completo |
| Anagrafiche legacy | `Colleghi`, `Fornitori`, `Mezzi`. | completo |
| IA legacy | `IAHome`, `IAApiKey`, `IALibretto`, `IADocumenti`, `IACoperturaLibretti`, `LibrettiExport`. | completo |
| Cisterna legacy | Archivio cisterna, IA cisterna, schede test, report mensili. | completo |
| App Autisti legacy | Login, gate, home, setup mezzo, cambio mezzo, controllo, rifornimento, segnalazioni, richiesta attrezzature. | completo |
| Autisti Inbox/Admin legacy | Inbox admin, listati controlli/segnalazioni/gomme/log/richieste e rettifiche. | completo |
| Shell NEXT | Route sotto `/next/*`, shell separata, role preset frontend, redirect tecnici. | in sviluppo |
| NEXT Home + Centro di Controllo | Controparti clone read-only di Home e Centro di Controllo. | in sviluppo |
| NEXT Mezzi + Dossier | Controparti clone di `Mezzi`, `DossierLista`, `DossierMezzo`, `DossierGomme`, `DossierRifornimenti`, `AnalisiEconomica`. | in sviluppo |
| NEXT Operativita globale | Controparti NEXT di `Gestione Operativa`, `Magazzino` come ingresso pubblico unificato del dominio stock (inventario, materiali consegnati, cisterne AdBlue, documenti e costi, carichi arrivi procurement consolidati in `Magazzino`), compat redirect da `Inventario` e `MaterialiConsegnati`, contratto stock condiviso locale su `@inventario` (`pz/lt/kg/mt`, matching stabile, scarico AdBlue, deduplica prudente documenti/arrivi), `AttrezzatureCantieri`, con `Lavori` gia scrivente via deroga chirurgica e `Manutenzioni` ora scrivente con vista interna `Mappa storico`; dopo i fix 2026-04-13 il tab `/next/magazzino?tab=documenti-costi` non e piu archivio globale IA, mostra solo documenti `@documenti_magazzino` e preventivi procurement materiali e usa ora la UI `Documenti e costi` per fornitore, con limite residuo sui preventivi senza `voci`. | in sviluppo |
| NEXT Procurement | Modulo unico clone su `/next/materiali-da-ordinare` con tab ordini/arrivi/dettaglio/prezzi/listino. | in sviluppo |
| NEXT Euromecc | Modulo nativo NEXT su `/next/euromecc` con mappa impianto, manutenzioni, problemi, riepilogo, fullscreen area e scrittura reale solo su collection dedicate, inclusa meta area per `tipo cemento` dei sili con nome completo e short label. | in sviluppo |
| NEXT Area Capo + Anagrafiche | Controparti clone di `Capo`, `Colleghi`, `Fornitori`. | in sviluppo |
| NEXT IA hub | Controparti clone di `IA`, `apikey`, `libretto`, `documenti`, `copertura-libretti`, `libretti-export`; `/next/ia/documenti` e ora una vista `Documenti e costi` read-only costruita sul domain `readNextIADocumentiArchiveSnapshot()`, con gruppi per fornitore, filtro `DDT` UI/fallback, ricerca locale, modale dettaglio e `Riapri review` mantenuto, ma ancora senza righe documento perche `NextIADocumentiArchiveItem` non espone `voci`. | in sviluppo |
| NEXT IA interna universale | Chat controllata, richieste, sessioni, artifacts, audit, registry universale, handoff IA, retriever Euromecc read-only e capability documentale unificata: `/next/ia/interna` e l'ingresso unico con card Home dedicata, prompt preload, trigger upload, shell dispatcher a due colonne, review documento interna e storico ufficiale separato; il motore reale riusato resta `useIADocumentiEngine()` in `src/pages/IA/IADocumenti.tsx`, quindi upload, analisi, apertura originale, storico, verifica valuta e salvataggi restano quelli esistenti. | in sviluppo |
| NEXT Cisterna | Controparti clone di archivio cisterna, IA cisterna e schede test. | in sviluppo |
| NEXT Autisti + Inbox/Admin | Esperienza autista separata sotto `/next/autisti` e controparti clone di inbox/admin. | in sviluppo |
| Functions/API legacy | Endpoint Firebase/Node/Vercel per IA documentale, PDF e verticale cisterna. | in sviluppo |
| Backend IA separato | Backend server-side dedicato all'IA interna con persistenza locale e provider OpenAI solo server-side. | in sviluppo |

## 3. STATO ATTUALE
- Ultimo task completato: riallineamento visivo del tab `/next/magazzino?tab=documenti-costi` alla spec `Documenti e costi` il `2026-04-13`. `src/next/NextMagazzinoPage.tsx` continua a leggere gli stessi snapshot reali (`readNextDocumentiCostiFleetSnapshot()`, `readNextIADocumentiArchiveSnapshot()`, `readNextProcurementSnapshot()`) e mantiene il filtro Magazzino gia corretto, ma rende ora il tab con header statistiche, filtri, ricerca, gruppi per fornitore, modale dettaglio, `PDF`, `Chiedi alla IA`, totale fornitore e totale generale. I pannelli legacy sotto la lista documentale non vengono piu renderizzati, quindi la superficie visibile resta centrata solo su documenti/preventivi Magazzino. Browser verificato davvero su `http://127.0.0.1:4174/next/magazzino?tab=documenti-costi`: click riga apre il modale, `PDF` apre una nuova tab senza aprire il modale, `Chiedi alla IA` porta davvero a `/next/ia/interna` con `history.state.usr.initialPrompt`; `/next/ia/documenti` verificato di nuovo e ancora archivio globale per fornitore. Verifiche tecniche: `npx eslint src/next/NextMagazzinoPage.tsx` `OK`, `npm run build` `OK`. Stato onesto: task `PARZIALE`, perche i preventivi procurement del tab non espongono `voci` ma solo `rows`, quindi il modale mostra solo l'intestazione per quei record senza inventare righe documento. Restano errori console preesistenti su backend IA locale `127.0.0.1:4310` non avviato e listing Storage Firebase `403`.
- Ultimo task completato: correzione del perimetro dati del tab `/next/magazzino?tab=documenti-costi` il `2026-04-13`. `src/next/NextMagazzinoPage.tsx` continua a leggere gli stessi snapshot reali (`readNextDocumentiCostiFleetSnapshot()`, `readNextIADocumentiArchiveSnapshot()`, `readNextProcurementSnapshot()`), ma la sezione `Costi materiali e prezzi` non usa piu i record `costo_mezzo` del layer globale e mostra solo documenti con discriminante strutturale `sourceKey = "@documenti_magazzino"` e `sourceType = "documento_magazzino"`. Ordini, arrivi, preventivi e listino procurement restano come supporto read-only del dominio materiali. Verifiche eseguite davvero su `http://127.0.0.1:4174/next/magazzino?tab=documenti-costi` e `http://127.0.0.1:4174/next/ia/documenti`: nel tab Magazzino non compaiono piu righe da `costo_mezzo`, mentre `/next/ia/documenti` resta l'archivio globale per fornitore. Verifiche tecniche: `npx eslint src/next/NextMagazzinoPage.tsx` `OK`, `npm run build` `OK`. Nessuna modifica a domain, writer o barrier; restano errori console preesistenti su backend IA locale `127.0.0.1:4310` non avviato e listing Storage Firebase `403`.
- Ultimo task completato: implementazione parziale della UI da `docs/product/SPEC_DOCUMENTI_COSTI_UI.md` il `2026-04-13`. `src/next/NextIADocumentiPage.tsx` continua a leggere solo `readNextIADocumentiArchiveSnapshot()` e non tocca domain, writer o barrier, ma rende ora `/next/ia/documenti` come vista `Documenti e costi` per fornitore con statistiche, filtri `Tutti / Fatture / DDT / Preventivi / Da verificare`, ricerca per `fornitore / targa / importo`, sezioni collassabili, tabella documenti, totale per fornitore e totale generale, modale dettaglio con intestazione reale, `Apri PDF originale`, `Da verificare` locale, `Riapri review` e `Chiedi IA ->`. `src/next/internal-ai/internal-ai.css` aggiunge i prefissi `.doc-costi-*`. Browser verificato davvero su `http://127.0.0.1:4174/next/ia/documenti`: sezioni collassabili funzionanti, filtro `Preventivi` funzionante, ricerca `TI324623` funzionante, click riga apre il modale, `PDF` apre una nuova tab Storage senza aprire il modale, `Chiedi alla IA` porta davvero a `/next/ia/interna` con prompt precaricato. Verifiche tecniche: `npx eslint src/next/NextIADocumentiPage.tsx` `OK`, `npm run build` `OK`. Stato onesto: task `PARZIALE`, perche `NextIADocumentiArchiveItem` non espone `voci` e il modale puo mostrare solo l'intestazione; la UI mantiene inoltre `Riapri review` per non regredire rispetto alla pagina precedente. Restano errori console preesistenti su backend IA locale non avviato `127.0.0.1:4310` e listing Storage Firebase `403`.
- Ultimo task completato: implementazione parziale della UI da `docs/product/SPEC_IA_UNIVERSAL_DISPATCHER.md` il `2026-04-12`. `src/next/components/HomeInternalAiLauncher.tsx` e stato riscritto come card Home unica con campo testo, menu `+`, voci attive/in arrivo e link `Storico`; `src/next/NextInternalAiPage.tsx` espone ora la shell dispatcher reale con header `Assistente IA`, composer, colonna destra funzioni, handoff banner compatto e review visiva a due colonne sopra il motore gia esistente; `src/next/NextIADocumentiPage.tsx` e stato riallineato allo storico ufficiale read-only costruito solo sui campi reali del domain `src/next/domain/nextDocumentiCostiDomain.ts`; `src/next/internal-ai/internal-ai.css` contiene i nuovi prefissi `.home-ia-launcher__*`, `.internal-ai-dispatcher__*`, `.internal-ai-history-page__*`. Per evitare ingresso sporco, la pagina dispatcher `/next/ia/interna` non reidrata piu automaticamente gli allegati IA-only persistiti quando si apre nella superficie reale `overview/page`, quindi non mostra piu banner o chip `fattura mariba.jpeg` di default. Browser verificato davvero su `http://localhost:5173/next`, `/next/ia/interna`, `/next/ia/documenti`: launcher Home con prompt -> `/next/ia/interna` con testo precaricato, menu `+` aperto con voci corrette e voce `Libretto mezzo` che porta a `/next/ia/libretto`, ingresso `/next/ia/interna` pulito senza handoff sporco, `Riapri review` e `Apri originale` funzionanti da storico. Nessun `Maximum update depth exceeded` osservato in queste verifiche; restano i `403` noti dei listing Storage Firebase. Stato onesto: task `PARZIALE`, perche lo storico non puo rispettare al 100% la spec finche il domain read-only non espone davvero sezioni `Libretti`, `Cisterna` e `Manutenzioni`.
- Ultimo audit completato: report completo e semplice sullo stato reale della IA interna/documentale il `2026-04-12`, senza patch runtime. Report principale creato: `docs/audit/AUDIT_IA_INTERNA_STATO_REALE_2026-04-12.md`. Verifiche browser eseguite davvero su `/next`, `/next/ia/interna`, `/next/ia/documenti`: la Home apre direttamente `/next/ia/interna`, l'ingresso documentale parte pulito, upload + `Analizza` funzionano davvero, la review si apre con CTA `Apri originale` e `Vai a`, lo storico mostra filtri e `Riapri review`. Il report chiarisce il quadro reale: `/next/ia/interna` e oggi l'ingresso unico; `/next/ia/documenti` e soprattutto superficie secondaria/storico; il motore documentale reale dietro le quinte resta `useIADocumentiEngine()` in `src/pages/IA/IADocumenti.tsx`; le scritture documentali reali presenti nel codice sono `POST` a `estrazioneDocumenti`, upload originale su Storage `documenti_pdf/...`, salvataggio Firestore in `@documenti_mezzi` / `@documenti_magazzino` / `@documenti_generici`, update `valuta`, import materiali in `@inventario`; le scritture IA non business usano `localStorage` namespaced (`@next_internal_ai:universal_requests_v1`, `@next_internal_ai:tracking_memory_v1`, `@next_internal_ai:artifact_archive_v1`) e mirror opzionale su adapter server-side isolato. Errori runtime reali ancora aperti: `403` sui listing Storage Firebase e ricorrenze `Maximum update depth exceeded`. Stato onesto: IA interna/documentale utilizzabile ma ancora `PARZIALE`, con nodo architetturale principale sul motore documentale ancora shared.
- Ultimo task completato: fix del launcher IA dalla Home NEXT il `2026-04-12`. Il pannello `IA interna` di `/next` non monta piu `NextInternalAiPage` in un modale custom `Conversazione rapida dalla Home`: `src/next/components/HomeInternalAiLauncher.tsx` naviga ora direttamente a `/next/ia/interna` e `src/next/NextHomePage.tsx` e stato riallineato alla microcopy dell'ingresso unico reale. Browser verificato davvero su `http://localhost:5173/next`: click su `Apri IA interna` -> navigazione a `http://localhost:5173/next/ia/interna`, nessun modale Home, nessuna review sporca o `fattura mariba.jpeg` aperta di default, ingresso documentale pulito con `Analizza` disabilitato finche non si carica un file. Verifiche tecniche: `npx eslint src/next/components/HomeInternalAiLauncher.tsx src/next/NextHomePage.tsx` `OK`, `npm run build` `OK`. Stato onesto: launcher Home IA riallineato all'ingresso unico; capability IA interna complessiva resta `PARZIALE`.
- Ultimo task completato: fix minimo di `Analizza` per la IA interna documentale nel clone il `2026-04-12`. `src/utils/cloneWriteBarrier.ts` autorizza ora solo l'eccezione `fetch.runtime` con pathname `/next/ia/interna`, metodo `POST` ed endpoint esatto `https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/estrazioneDocumenti`; nessun widening generico del barrier e nessuna nuova apertura writer business. Browser verificato davvero su `http://localhost:5173/next/ia/interna`: upload `audit-fattura-mariba.pdf`, click `Analizza`, `POST` verso `estrazioneDocumenti` partito davvero in network con `200`, review documento riaperta con CTA `Apri originale`, `Vai a Inventario`, `Torna alla home documentale`. Restano separati e non corretti in questo task errori console preesistenti sui listing Storage Firebase `403` e ricorrenze `Maximum update depth exceeded` durante la review; non impediscono pero il flusso `Analizza`. Stato onesto: `Analizza` su `/next/ia/interna` `SBLOCCATO`; capability documentale resta `PARZIALE`.
- Ultimo audit completato: audit tecnico della IA interna documentale il `2026-04-12` sui due bug report `home sporca` e `Analizza bloccato`, senza patch runtime. Esito verificato nel worktree/runtime corrente: `/next/ia/interna` non riproduce piu alcuna review sporca di default; la sola auto-riapertura dimostrata passa da `reviewDocumentId` / `reviewSourceKey` letti in `src/next/NextInternalAiPage.tsx`, generati da `Riapri review` in `src/next/NextIADocumentiPage.tsx` e poi rimossi dalla URL. Browser verificato davvero su `http://localhost:5173/next/ia/interna` e sulla preview `4174`: home pulita, nessuna query, nessun documento in review; `localStorage` contiene solo `@next_internal_ai:universal_requests_v1`, `@next_internal_ai:tracking_memory_v1`, `@next_internal_ai:artifact_archive_v1`, e nessuna chiave documentale con `reviewDocumentId`; `sessionStorage` assente nel flusso. Il blocco di `Analizza` e invece reale e riproducibile: con file caricato il bottone si abilita, ma il click segue `NextInternalAiPage.handleUnifiedDocumentAnalyze()` -> `useIADocumentiEngine().handleAnalyze()` -> `fetch POST` legacy verso `https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/estrazioneDocumenti`; `src/main.tsx` installa sempre `installCloneFetchBarrier()`, e `src/utils/cloneWriteBarrier.ts` blocca quel `POST` come `fetch.runtime` in clone, lanciando `CloneWriteBlockedError` prima che la richiesta esca in rete. Console e network browser confermano warning `[CLONE_NO_WRITE]`, stack reale sul barrier e assenza del `POST` verso `estrazioneDocumenti`. Stato onesto: home sporca nel worktree corrente `NON RIPRODOTTA`; `Analizza` nel clone `BLOCCATO` dal barrier globale.
- Ultimo task completato: fix chirurgico di ingresso, layout desktop e destinazioni della IA interna documentale il `2026-04-12`. `/next/ia/interna` non autoapre piu review persistite e atterra sempre sulla home documentale pulita; la review desktop vive in una sola schermata con header compatto, scroll pagina bloccato solo quando la review e attiva, scroll interni nelle colonne e CTA sempre visibili (`Apri originale`, destinazione, `Torna alla home documentale`). Le destinazioni reali ora sono: `Magazzino -> /next/magazzino?tab=inventario`, `Manutenzioni -> /next/manutenzioni?targa=<targa>`, `Preventivi targa -> /next/dossier/<targa>#preventivi`; il ramo `Da verificare` riapre la review corretta su `/next/ia/interna` via query `reviewDocumentId` e riusa lo stesso flusso verificato di `Riapri review`. `/next/ia/documenti` resta superficie secondaria/storico con filtri e CTA. Verifiche eseguite nel task: lint mirato `OK` sui file TS/TSX con warning noto solo sul CSS ignorato dalla config ESLint del repo, `npm run build` `OK`, runtime verificato su `/next/ia/interna`, `/next/ia/documenti`, `/next/magazzino?tab=inventario`, `/next/manutenzioni?targa=TI324623`, `/next/dossier/TI313387#preventivi`, `Apri originale` funzionante in tab separata. Stato capability: `PARZIALE`; restano `DA VERIFICARE` nuovi upload live end-to-end e un caso storico live `Da verificare` cliccabile nel dataset corrente.
- Ultimo audit completato: verifica runtime E2E del fix `Magazzino` + IA interna il `2026-04-11`, senza patch runtime aggiuntive. `/next/magazzino?tab=documenti-costi` conferma che il pannello procurement ha casi pronti (`Pronte: 9`, `Bloccate: 1`), ma il ramo documentale richiesto dal fix espone ancora `Righe supporto: 3`, `Pronte: 0`, `Bloccate: 3`, quindi non esiste oggi un candidato documentale live `Pronto` su cui eseguire davvero `Riconcilia documento`, `Aggiungi costo/documento` o `Carica stock` senza inventare dati. In `/next/ia/interna` la review destra mantiene la gerarchia `Documento`, `Righe estratte`, `Match inventario`, `Decisione`, `Azione proposta IA`, `Dettagli tecnici` e i dettagli tecnici restano collassati, ma nello stato live persistito corrente i dossier `fattura_mariba_534909.pdf` e `fattura_adblue_aprile.pdf` mostrano ancora `Scelta attuale: DA VERIFICARE` e non espongono bottoni `Conferma`. Verifiche rieseguite nel task: `npx eslint src/next/NextMagazzinoPage.tsx src/next/internal-ai/internalAiMagazzinoControlledActions.ts src/next/NextInternalAiPage.tsx src/next/internal-ai/internal-ai.css` `OK` sul runtime con warning noto solo sul CSS ignorato dalla config ESLint del repo, `npm run build` `OK`. Nessuna scrittura business reale e stata eseguita; la capability resta `PARZIALE` e la prova end-to-end live resta `DA VERIFICARE`.
- Ultimo task completato: follow-up `Magazzino` + IA interna del `2026-04-11` su fix `Consolida stock` e review destra. `src/next/NextMagazzinoPage.tsx` e `src/next/internal-ai/internalAiMagazzinoControlledActions.ts` non permettono piu che i casi tipo `MARIBA` aumentino la quantita quando la scelta corretta e solo `Riconcilia documento` / `Aggiungi costo/documento`: la sola riconciliazione passa ora solo se l'arrivo procurement compatibile risulta gia consolidato a stock; altrimenti il ramo viene bloccato e il carico quantita resta confinato a `Carica stock` o ai casi davvero non ancora caricati. `src/next/NextInternalAiPage.tsx` e `src/next/internal-ai/internal-ai.css` riordinano inoltre la colonna destra della review full screen in `Documento`, `Righe estratte`, `Match inventario`, `Decisione`, `Azione proposta IA`, `Dettagli tecnici`, con dettagli tecnici collassabili e `DA VERIFICARE` piu visibile. Verifiche eseguite nel task: `npx eslint src/next/NextMagazzinoPage.tsx src/next/internal-ai/internalAiMagazzinoControlledActions.ts src/next/NextInternalAiPage.tsx src/next/internal-ai/internal-ai.css` `OK` sul runtime con warning noto solo sul CSS ignorato dalla config ESLint del repo, `npm run build` `OK`, runtime verificato su `/next/ia/interna` con `fattura_mariba_534909.pdf`, `fattura_adblue_aprile.pdf`, `documento_ambiguo.pdf`; su `/next/magazzino?tab=documenti-costi` il dataset live mostra ancora `Pronte: 0`, quindi la prova browser end-to-end su un candidato reale pronto resta `DA VERIFICARE`. Stato capability: `PARZIALE`.
- Ultimo task completato: pipeline documentale reale `Magazzino` nella IA interna il `2026-04-11`. Il backend IA separato introduce `internal-ai-document-extraction.js` e il payload `documentAnalysis` sugli allegati, distinguendo `pdf_text`, `pdf_scan` e `image_document` ed estraendo header documento, warning e righe materiali strutturate. `internalAiUniversalDocumentRouter.ts`, `internalAiUniversalHandoff.ts` e `NextInternalAiPage.tsx` usano ora questi dati per correggere routing e review: `AdBlue` resta nel flusso Magazzino, il `preventivo` torna a procurement, il caso ambiguo torna alla inbox documentale e la review full screen mostra codice articolo, quantita, unita, prezzo e totale riga. Verifiche eseguite nel task: `npx eslint ...` mirato `OK`, `npm run build` `OK`, runtime verificato su `/next/ia/interna` con `tmp-runtime-materiali.png`, `tmp-runtime-adblue.pdf`, `tmp-runtime-preventivo.pdf`, `tmp-runtime-ambiguo.pdf`, review full screen confermata `full viewport` e contenuti attesi presenti in tutti e quattro i casi. Stato capability: `PARZIALE`.
- Ultimo task completato: review documento full screen `Magazzino` nella IA interna il `2026-04-11`. `NextInternalAiPage.tsx` e `internal-ai.css` spostano la decisione documento su un modale davvero full screen: preview grande a sinistra, review gestionale a destra, decision cards esplicite (`Collega`, `Aggiungi costo/documento`, `Crea nuovo articolo`, `Carica stock`, `DA VERIFICARE`) e fallback distinto verso `Magazzino` o `Procurement`. La card dossier sopra la chat resta come riepilogo/reopen surface; nessuna esecuzione parte piu automaticamente subito dopo l'analisi. Verifiche eseguite nel task: `npx eslint src/next/NextInternalAiPage.tsx` `OK`, `npm run build` `OK`, runtime verificato su `/next/ia/interna` con `fattura mariba.jpeg`, `fattura_adblue_aprile.pdf`, `preventivo_materiale_test.pdf`, `documento_ambiguo_test.pdf`; review full screen presente e leggibile, fallback coerente, nessuna scrittura fuori perimetro. Stato capability: `PARZIALE`.
- Ultimo task completato: conferma, esecuzione ed esito inline del flusso `Magazzino` nella IA interna il `2026-04-11`. `NextInternalAiPage.tsx`, `internalAiMagazzinoControlledActions.ts`, `internal-ai.css` e `cloneWriteBarrier.ts` mantengono la scheda dossier documento ma chiudono nel modale/chat i due soli casi ammessi `riconcilia_senza_carico` e `carica_stock_adblue`: se il match e forte la UI mostra `Conferma riconciliazione` o `Conferma carico AdBlue`, esegue inline e restituisce un esito finale leggibile; `Apri in Magazzino` resta fallback. La barrier non apre writer nuovi: usa solo una scoped allowance temporanea su `@inventario` durante l'azione inline. Verifiche eseguite nel task: `npx eslint src/utils/cloneWriteBarrier.ts src/next/internal-ai/internalAiMagazzinoControlledActions.ts src/next/NextInternalAiPage.tsx` `OK`, `npm run build` `OK`, runtime verificato su `/next/ia/interna` con `fattura_mariba_534909.pdf`, `fattura_adblue_aprile.pdf`, `documento_ambiguo.pdf`; fallback `Apri in Magazzino` funzionante, caso ambiguo prudenzialmente bloccato. Limite reale verificato: nel support snapshot live `@documenti_magazzino` risultano `Righe supporto: 3`, `Pronte: 0`, `Bloccate: 3`, quindi la prova end-to-end su un caso reale pronto resta `DA VERIFICARE`.
- Ultimo task completato: rifacimento UI dossier del risultato documento IA interna il `2026-04-11`. `NextInternalAiPage.tsx` e `internal-ai.css` non cambiano classificazione o writer ma sostituiscono la vecchia proposal card con una scheda gestionale a sezioni: `Testata documento`, `Riassunto rapido`, `Cosa ha capito la IA`, `Dati estratti`, `Righe / materiali trovati`, `Match e riconciliazione`, `Evidenza / testo letto`, `Azione finale`. Il contenitore sopra la chat resta alto e scrollabile, con griglia desktop e stack mobile; `DA VERIFICARE` e i presidi prudenziali restano evidenti. Verifiche eseguite nel task: `npx eslint src/next/NextInternalAiPage.tsx` `OK`, `npm run build` `OK`, runtime verificato su `/next/ia/interna` con allegati dummy `fattura_mariba_534909.pdf`, `fattura_adblue_aprile.pdf`, `documento_ambiguo.pdf`; per tutti i casi la scheda mostra 7 sezioni leggibili e il pannello non collassa (`shellHeight` circa `624px`). Nessuna modifica a motore IA, router documentale, writer business o barrier.
- Ultimo task completato: fix UI del modale IA interna il `2026-04-10`. Nel modale rapido aperto dalla Home la proposal card documento non vive piu nel composer compresso ma in una fascia dedicata sopra i messaggi: `NextInternalAiPage.tsx` la porta fuori dal composer, la rende piu leggibile con campi `Documento letto`, `Tipo rilevato`, `Azione proposta`, `Motivazione`, `Presidio`, e `internal-ai.css` aggiunge min-height reale, max-height con scroll interno e card piu robuste. Verifiche eseguite nel task: lint mirato `OK` sul TSX, CSS ignorato dalla config ESLint del repo come warning noto; build `OK`; runtime verificato nel modale IA della Home con allegato `fattura_mariba_534909.pdf`, proposal shell visibile a circa `320px` di altezza e classificazione leggibile `Fattura materiali di Magazzino` -> `Riconcilia documento`. Nessuna modifica al motore documentale o ai writer business.
- Ultimo task completato: UX document-driven della IA interna `Magazzino` il `2026-04-10`. `/next/ia/interna` non richiede piu prompt rigidi per i documenti di magazzino: `NextInternalAiPage.tsx` accetta submit con solo allegato, genera un prompt base prudente, classifica automaticamente l'allegato usando i segnali documentali disponibili nel clone e mostra una proposal card con tipo rilevato, azione proposta, motivazione, confidenza, eventuale domanda di sblocco e CTA verso `/next/magazzino?tab=documenti-costi` o `DA VERIFICARE`. `internalAiUniversalDocumentRouter.ts` riconosce meglio fatture materiali `Magazzino` e fatture `AdBlue` anche da nomi file realistici con `_` e `-`; `internalAiUniversalHandoff.ts` instrada i casi forti al modulo canonico `Magazzino` e mantiene prudente il payload nei casi ambigui. Verifiche eseguite nel task: lint mirato `OK`, build `OK`, preview locale verificata su `/next/ia/interna` con allegati dummy `fattura_mariba_534909.pdf`, `fattura_adblue_aprile.pdf`, `documento_ambiguo.pdf`; nessun submit o writer business reale eseguito. Stato capability: `PARZIALE`; resta `DA VERIFICARE` l'audit su allegati reali con segnali documentali deboli.
- Ultimo task completato: deroga scrivente controllata della IA interna NEXT per le sole fatture `Magazzino` il `2026-04-10`. `NextMagazzinoPage.tsx` non tratta piu `@documenti_magazzino.voci` come writer generico: il tab `Documenti e costi` classifica ogni riga come `riconcilia_senza_carico`, `carica_stock_adblue`, `DA VERIFICARE` o `fuori_perimetro`; il caso `MARIBA` collega il documento alla voce stock gia consolidata tramite `stockLoadKeys` senza aumentare la giacenza, mentre il caso `AdBlue` richiede match forte, UDM `lt`, niente mismatch unita e niente doppio carico gia consolidato prima di creare o aggiornare l'articolo inventario. `nextDocumentiCostiDomain.ts` espone metadata forti del documento (`tipoDocumento`, `numeroDocumento`, `nomeFile`, `fileUrl`, `daVerificare`); `internalAiUniversalDocumentRouter.ts`, `internalAiUniversalRequestResolver.ts` e `internalAiUniversalHandoff.ts` instradano ora le fatture materiali e le `fatture AdBlue` al tab `/next/magazzino?tab=documenti-costi`; `internalAiUniversalContracts.ts` e `internalAiUnifiedIntelligenceEngine.ts` dichiarano la deroga come eccezione mirata e non come apertura generale di writer D05. Verifiche eseguite nel task: lint mirato `OK`, build `OK`, preview locale `OK` su `/next/magazzino?tab=documenti-costi` con render del pannello `Azione controllata IA su fattura magazzino`; nessun submit o writer business reale eseguito. Stato capability: `PARZIALE`; resta `DA VERIFICARE` l'audit separato sulla deroga scrivente fatture Magazzino.
- Ultimo task completato: integrazione read-only del dominio `Magazzino` nella IA interna NEXT il `2026-04-10`. Il motore unificato ora legge `@inventario`, `@materialiconsegnati`, `@cisterne_adblue`, `@documenti_magazzino`, costi materiali derivati e procurement di supporto (`@ordini`, `@preventivi`, `@preventivi_approvazioni`, `@listino_prezzi`) senza aprire writer business; la risposta Magazzino usa blocchi strutturati `Stock`, `Movimenti`, `Documenti / Fatture`, `Preventivi`, `Costi di supporto`, `Criticita / DA VERIFICARE`; D05 viene agganciato al modulo canonico `/next/magazzino` e `NextMagazzinoPage.tsx` consuma `iaHandoff` per prefill/tab corretti. Verifiche eseguite nel task: lint mirato `OK`, build `OK`, preview locale verificata su `/next/ia/interna` con richiesta `quanta giacenza ho del materiale AdBlue e quali documenti o preventivi risultano collegati`; nessun submit o write-path business eseguito. Stato capability: `PARZIALE`; resta `DA VERIFICARE` l'handoff universale sui prompt misti materiale/documenti/preventivi.
- Task immediatamente precedente: patch di autonomia NEXT del dominio stock `Magazzino` il `2026-04-10`. `/next/magazzino` resta il punto operativo canonico del dominio e assorbe ora anche il carico stock degli arrivi procurement nella vista `Documenti e costi`, sopra `nextMagazzinoStockContract.ts`: UDM canoniche `pz/lt/kg/mt`, matching stabile su `descrizione + fornitore + unita` (`stockKey`), `stockLoadKeys`, deduplica prudente documenti/arrivi, mantenimento delle righe inventario a quantita zero, scarico reale AdBlue e riallineamento del procurement NEXT a ruolo di supporto/read-only. `nextProcurementDomain.ts`, `NextProcurementReadOnlyPanel.tsx` e `nextData.ts` dichiarano ora che ordini/arrivi/preventivi/listino restano supporto o preview, mentre il writer stock canonico lato NEXT resta `/next/magazzino`. Verifiche eseguite nel task: lint mirato `OK`, build `OK`, preview live verificata su `/next/magazzino`, `?tab=documenti-costi`, `?tab=cisterne-adblue`, `/next/inventario`, `/next/materiali-consegnati`, `/next/materiali-da-ordinare?tab=arrivi`; nessun submit browser mutante eseguito per non alterare dataset Firebase reali. Stato modulo: `PARZIALE`.
- Ultimo audit completato: audit finale strutturale `Magazzino NEXT` del `2026-04-10`. Il repo conferma che il dominio reale `Magazzino` della madre e multi-writer e non transazionale: `@inventario` e `@materialiconsegnati` sono dataset storage-style condivisi da piu moduli, mentre `@documenti_magazzino` resta una collection documentale/costi e non il ledger canonico di stock. Anche dopo l'autonomia stock lato NEXT, il verdetto finale del dominio resta `PARZIALE` fino a un nuovo audit separato di rivalidazione.
- Ultimo task completato: PROMPT37B - creata la cartella stabile `docs/fonti-pronte/` con copie aggiornate delle fonti chiave del progetto e un indice/overview sintetici. Da ora i documenti sorgente mirrorati in quella cartella vanno sincronizzati nello stesso task quando cambiano. Nessun file runtime toccato.
- Ultimo task completato: PROMPT35 - correzione `Quadro manutenzioni PDF` per il ramo `Compressore`. In `NextManutenzioniPage.tsx` il quadro e l'export PDF locale separano ora davvero le metriche per filtro: `Mezzo` usa `km`, `Compressore` usa `ore`, `Attrezzature` non forza una misura di default ma mostra solo quella presente nel record. Build OK.
- Ultimo task completato: PROMPT34 - fix cross-modulo `Manutenzioni` NEXT. Il bug reale del writer materiali su `@materialiconsegnati` e stato corretto eliminando la doppia scrittura consecutiva e sostituendola con un record unificato per i materiali scaricati da manutenzione; `nextManutenzioniGommeDomain.ts`, `NextGommeEconomiaSection.tsx`, `nextDossierMezzoDomain.ts`, `NextDossierMezzoPage.tsx` e `nextOperativitaGlobaleDomain.ts` valorizzano ora i campi gomme strutturati (`gommePerAsse`, `gommeInterventoTipo`, `gommeStraordinario`) prima del parsing legacy. Build OK.
- Ultimo task completato: PROMPT33 — Feature A (upload documento originale su Firebase Storage + "Apri documento" nello storico Euromecc) + Feature B (selettore tipo documento, flusso AI lista ricambi, writer ordine su `@ordini`, badge ordine nello storico). Deroghe barrier aggiunte in `cloneWriteBarrier.ts` per `storage.uploadBytes` (euromecc/relazioni/) e `storageSync.setItemSync` (@ordini). Regola aggiunta in `storage.rules` per euromecc/relazioni. Build OK, zero errori TypeScript.
- Stato app legacy: attiva e fonte di verita operativa.
- Stato NEXT: nuovo perimetro applicativo non ancora chiuso come nuova madre; le scritture reali non sono globali ma si aprono modulo per modulo, e oggi esistono moduli gia promossi come `Lavori`, `Manutenzioni`, `Magazzino` ed `Euromecc`.
- Stato build root: `npm run build` = OK.
- Stato lint root: `npm run lint` = KO con 584 problemi totali (568 errori, 16 warning).
- Aree con piu errori lint verificati: `src/autistiInbox/*`, `src/autisti/*`, `src/pages/*`, `src/utils/*`, `api/pdf-ai-enhance.ts`, `pdfEngine.ts`.
- Warning build verificati: bundle client molto grande e doppio uso di `jspdf`.
- In `Manutenzioni` NEXT il km corrente di riferimento per il `Dettaglio` continua a derivare dal reader canonico rifornimenti `readNextRifornimentiReadOnlySnapshot()` gia usato nella pagina parent.
- In `Manutenzioni` NEXT il `Dettaglio` embedded mostra ora solo le viste tecniche `Sinistra / Destra` del mezzo e un box `Manutenzione selezionata`; nessun controllo di calibrazione, marker o overlay tecnico resta visibile nel runtime del modulo.
- In `Manutenzioni` NEXT l'export locale del `Quadro manutenzioni PDF` usa `jsPDF` + `jspdf-autotable` nel modulo stesso e, per export a targa singola, inserisce in testata la foto reale del mezzo presa da `mezzoPreview.fotoUrl`; se la foto manca, usa un fallback neutro senza inventare immagini.
- In `Manutenzioni` NEXT il quadro, il Dossier principale, il Dossier Gomme e `Operativita` leggono ora in modo piu coerente i campi strutturati gomme (`gommePerAsse`, `gommeInterventoTipo`, `gommeStraordinario`), ma il modulo resta `PARZIALE` perche la parity complessiva con madre/PDF e i boundary cross-modulo richiedono ancora verifica separata.

### In sospeso
- Chiusura reale del perimetro NEXT ancora aperto; il repo non dimostra autonomia completa del clone.
- Matrice permessi reale non definita; il NEXT usa ancora preset frontend simulati via `role`.
- Bridge live Firebase/Storage del backend IA separato ancora chiuso.
- Standardizzazione finale di eventi autisti, allegati preventivi, policy Firestore/Storage e canale backend IA/PDF.

### Cosa e rotto o critico
- `npm run lint` globale fallisce.
- `firestore.rules` e ora presente nel repo e copre esplicitamente il perimetro `Euromecc`, ma la matrice sicurezza per-ruolo dell'app non e ancora dimostrata da claims o login admin dedicati.
- `storage.rules` nel repo e deny-all, ma il codice usa upload/download/listing su molti path Storage reali.
- Esistono piu canali backend per IA/PDF: `functions/*`, `functions-schede/*`, `api/pdf-ai-enhance.ts`, `server.js`, `backend/internal-ai/*`.
- Stream eventi autisti doppio: `@storico_eventi_operativi` e `autisti_eventi`.
- Contratto allegati preventivi non unico: `preventivi/ia/*` e `preventivi/<id>.pdf`.

## 4. DECISIONI ARCHITETTURALI
1. La madre resta l'app operativa a `/`; `src/App.tsx` continua a montare tutte le route legacy.
2. La NEXT vive sotto `/next/*` per coesistere con la madre senza sostituirla.
3. La NEXT non e globalmente `read-only`: le scritture reali si aprono modulo per modulo, solo quando il perimetro dati e dichiarato e il controllo e allineato nel barrier.
4. `src/utils/cloneWriteBarrier.ts` e il punto di controllo esplicito per abilitare o negare le scritture della NEXT; non esiste alcun widening globale.
5. La NEXT legge i dati tramite reader e domain dedicati in `src/next/domain/*` e apre writer solo quando il modulo e promosso in modo esplicito.
6. L'esperienza autista resta separata dall'admin shell sia in legacy sia in NEXT.
7. L'IA interna della NEXT e isolata in due perimetri: UI `src/next/internal-ai/*` e backend `backend/internal-ai/*`.
8. Il backend IA separato puo usare provider reali solo lato server e non apre scritture business.
9. Il bridge live del backend IA separato resta chiuso finche credenziali server-side e policy Firestore/Storage non sono verificabili.
10. Il motore PDF condiviso resta `src/utils/pdfEngine.ts`; i moduli generano PDF sopra lo stesso asse comune.
11. Il routing NEXT usa guard frontend (`NextRoleGuard`) e preset `admin/gestionale/autista`; non esiste ancora auth/ACL reale lato prodotto.
12. La route `/next/materiali-da-ordinare` e il modulo procurement canonico della NEXT; ordini/arrivi/dettaglio/preventivi/listino passano da li come supporto o preview, mentre il writer stock canonico degli arrivi resta `/next/magazzino`.
13. `Euromecc` e un modulo nativo NEXT, non clone della madre, e puo scrivere solo su collection Firestore dedicate.
14. Le collection canoniche del modulo `Euromecc` sono `euromecc_pending`, `euromecc_done`, `euromecc_issues`, `euromecc_area_meta`; non usa `storage/@...`.
15. In `euromecc_area_meta` il contratto corrente per i sili supporta `cementType` e `cementTypeShort?`; se la short label manca, il reader NEXT la deriva in fallback senza migrazione distruttiva.
16. In `Euromecc` i dati statici impianto stanno in `src/next/euromeccAreas.ts`; i dati dinamici stanno solo in Firestore.
17. In `Euromecc` le date business usano ISO `yyyy-mm-dd`; `createdAt` / `updatedAt` restano `Timestamp` Firestore.
18. La chat libera `/next/ia/interna` puo leggere `Euromecc` solo tramite il retriever `src/next/internal-ai/internalAiEuromeccReadonly.ts`; nessun writer Euromecc e esposto alla IA.
19. Il boundary Firestore del modulo `Euromecc` e versionato in `firestore.rules`: le collection `euromecc_pending`, `euromecc_done`, `euromecc_issues`, `euromecc_area_meta` hanno `match` espliciti con `request.auth != null` e validazione shape; il fallback del resto Firestore resta sul modello auth attuale e non esiste ancora una chiusura per-ruolo verificabile nel repo.
20. La topologia statica di `Euromecc` in `src/next/euromeccAreas.ts` parte ora neutra (`base: ok`); i warning gialli non devono comparire senza dati reali.
21. `Euromecc` include un pannello discreto `Gestione dati Euromecc` aperto da `Impostazioni` nell'header del modulo; il pannello permette edit/delete reale su `euromecc_issues`, `euromecc_pending`, `euromecc_done`, ma non equivale a sicurezza per-ruolo.
22. Il modulo `Lavori` nel clone NEXT non e piu read-only: usa una dashboard UI unificata sopra il motore reale `@lavori`, ma la deroga al blocco clone-wide e chirurgica e limitata al solo `storageSync.setItemSync("@lavori")` sui pathname Lavori/dettaglio; stato corretto del modulo: `PARZIALE` finche non passa audit separato.
23. Il modulo `Manutenzioni` nel clone NEXT non e piu read-only: `/next/manutenzioni` scrive ora in modo compatibile su `@manutenzioni`, `@inventario` e `@materialiconsegnati`, riusa la convergenza gomme gia verificata, salva `assiCoinvolti?: string[]`, `gommePerAsse?: { asseId; dataCambio; kmCambio }[]`, `gommeInterventoTipo?: "ordinario" | "straordinario"` e `gommeStraordinario?: { asseId; quantita; motivo }` in modo clone-side retrocompatibile, esclude gli eventi straordinari dal calcolo dello stato gomme per asse e, dopo PROMPT34, usa un solo writer coerente per `@materialiconsegnati` senza sovrascrivere il primo payload; apre solo metadati visuali separati su `@mezzi_foto_viste`, `@mezzi_hotspot_mapping` e Storage `mezzi_foto/...`; stato corretto del modulo: `PARZIALE` finche non passa audit separato.
24. La deroga clone-wide per `Manutenzioni` e limitata al pathname `/next/manutenzioni` e alle sole operazioni `storageSync.setItemSync` sulle 5 chiavi verificate (`@manutenzioni`, `@inventario`, `@materialiconsegnati`, `@mezzi_foto_viste`, `@mezzi_hotspot_mapping`) piu `storage.uploadBytes` su `mezzi_foto/...`.
25. Il modulo `/next/magazzino` e una pagina NEXT nativa con 4 viste interne `Inventario` / `Materiali consegnati` / `Cisterne AdBlue` / `Documenti e costi`; preserva shape e wrapper reali dei dataset storage-style `@inventario`, `@materialiconsegnati`, `@cisterne_adblue`, applica un contratto stock condiviso locale con UDM canoniche `pz/lt/kg/mt`, canonicalizzazione `m -> mt`, matching pragmatico su `descrizione + fornitore + unita` (`stockKey`), deduplica prudente tramite `stockLoadKeys`, mantenimento delle righe a quantita zero per tracciabilita, scarico inventario dai cambi cisterna AdBlue e consolidamento stock degli arrivi procurement direttamente nella vista `Documenti e costi`; nello stesso tab la deroga IA scrivente resta confinata alle sole fatture magazzino con due soli esiti ammessi: `riconcilia_senza_carico` per materiale gia consolidato o `carica_stock_adblue` per AdBlue non ancora caricato. Dopo il follow-up del `2026-04-11`, il ramo `riconcilia_senza_carico` non puo piu aumentare quantita: e ammesso solo se l'arrivo procurement compatibile risulta gia consolidato a stock, mentre il carico quantita resta confinato a `Carica stock` o ai casi davvero non ancora caricati. Costi/documenti/procurement restano supporti o preview e la deroga di `cloneWriteBarrier.ts` resta chirurgica sul pathname `/next/magazzino` e sugli upload `inventario/*`.
26. Nel dominio `Magazzino` della NEXT l'ingresso pubblico principale e ora solo `/next/magazzino`; i vecchi path `/next/inventario` e `/next/materiali-consegnati` restano attivi solo come redirect `replace` di compatibilita verso il modulo unificato con `?tab=...`, senza montare piu i moduli separati come entrypoint runtime principali.
27. `NextMappaStoricoPage` supporta ora due rami dedicati a `/next/manutenzioni`: un ramo `embedded` con layout a 2 card, card sinistra per viste tecniche `Sinistra / Destra` da `public/gomme/*` (fallback foto solo se manca la tavola tecnica) + riepilogo manutenzione selezionata e card destra per riepilogo mezzo, ultime manutenzioni e azioni rapide, piu il ramo standalone della mappa che mantiene gestione hotspot/foto fuori da questo task.
28. L'inferenza zona della `Mappa storico` di `Manutenzioni` non usa piu match generici non pesati per gomme/assi: i termini `gomma/gomme/pneumatico/pneumatici/ruota/ruote/asse/assale` passano prima da un ramo prioritario per `fronte/sinistra/destra/retro`, mentre `fronte-fanali` non usa piu `anteriore` come keyword autonoma; se la direzione non e affidabile, la mappa restituisce `Zona non deducibile`.
29. In `/next/manutenzioni` la UI resta allineata al riferimento approvato ma con perimetro piu corretto: shell esterna e tab scuri, fascia dati chiara a 5 blocchi, dashboard con 4 KPI + 4 pulsanti + `Ultimi interventi`, form grande per `Nuova / Modifica`, dettaglio a 2 card e tab finale `Quadro manutenzioni PDF` su superfici operative chiare; la riga `Data / KM-Ore / Fornitore` usa proporzioni desktop stabili, l'autosuggest inventario mette la descrizione materiale davanti al fornitore, il `Dettaglio` embedded mostra solo viste tecniche `Sinistra / Destra` pulite con riepilogo del record selezionato e il quadro espone una ricerca rapida visibile per `targa / autista`.
30. Nel perimetro `Lavori` NEXT la UI mostra ora anche `Segnalato da` e `Autista solito` nelle liste/dettaglio/PDF, l'export PDF resta sul canale condiviso `src/utils/pdfEngine.ts` con layout piu leggibile e la Home `/next` integra un riquadro `Lavori in attesa` nello stesso blocco alert/scadenze, senza aprire nuove scritture fuori dal modulo.
31. `src/next/NextDettaglioLavoroPage.tsx` arricchisce ora il dettaglio con `Problema segnalato` e con il modale read-only della segnalazione autista originale: prima prova `source.type === "segnalazione"` + `source.id/originId`, poi fallback solo su match univoco targa + autore + descrizione; se il match non e sicuro non apre nulla.
32. Il fix successivo sul dettaglio `Lavori` non usa piu solo la vista normalizzata delle segnalazioni: legge anche il payload reale di `@segnalazioni_autisti_tmp` e sfrutta il backlink `linkedLavoroId/linkedLavoroIds`, cosi il blocco `Problema segnalato` mostra davvero il testo reale (`descrizione`, poi `note`, `messaggio`, `dettaglio`, `testo`) quando esiste.
33. Nel dettaglio `Lavori` NEXT il testo della segnalazione origine non deve piu appoggiarsi a `lavoro.dettagli` o `lavoro.note`: il percorso corretto e match forte su `source.id/originId`, poi backlink `linkedLavoroId/linkedLavoroIds`, con messaggio esplicito `Nessuna descrizione presente nella segnalazione originale` se il record trovato non contiene testo.
34. Nel dettaglio `Lavori` NEXT esiste ora anche il ramo `source.type = "controllo"`: il resolver legge `@controlli_mezzo_autisti`, usa come collegamento forte `source.id/originId`, poi solo il backlink reale `linkedLavoroId/linkedLavoroIds`, e mostra il testo origine del controllo con priorita `note`, poi `dettaglio`, poi `messaggio`, piu i KO reali da `check/koItems`; nessun fallback fragile su targa/autore/testo e autorizzato per aprire controlli.
35. Nel modale `Controllo originale` di `Lavori` il close button non deve usare caratteri hardcoded corrotti: il fix corrente usa `&times;` nel JSX con `aria-label` esplicito, cosi il rendering resta stabile e il click continua a chiudere il modale senza toccare la logica.
36. Nel tab `Quadro manutenzioni PDF` di `/next/manutenzioni` la struttura principale non e piu un insieme di card riepilogative: dopo `Step 1` (`Mezzo` / `Compressore` / `Attrezzature`) e `Step 2` (`Ultimo mese`, mesi disponibili, `Tutto`) il runtime mostra un elenco operativo di risultati con foto, targa, modello/compressore, autista solito, `Km ultimo rifornimento`, data manutenzione, tipo/manutenzione e azioni `PDF mezzo` / `PDF compressore` + `Apri dettaglio`; per i risultati `Mezzo` espone anche lo stato gomme finale per asse, con focus su data e km percorsi per i mezzi motorizzati e focus sulla data per rimorchi/semirimorchi.
37. In `/next/manutenzioni` non esistono piu shell legacy o blocchi principali derivati dal canvas sbagliato: header, fascia dati e tab governano tutta la pagina; la `Dashboard` non usa piu card laterali o wrapper extra oltre a 4 KPI, 4 pulsanti e lista finale, mentre il dettaglio embedded mantiene il 2-card specialistico e il quadro PDF resta su step + righe operative.
38. In `/next/manutenzioni` il tab `Dettaglio` embedded non mostra piu `Calibra`, marker, hotspot o overlay nel viewer principale: la superficie visiva del mezzo usa la tavola tecnica da `public/gomme/*` sulle sole viste `Sinistra / Destra`, con fallback alla foto solo se necessario.
39. In `/next/manutenzioni` il binding del viewer tecnico e ora esplicito: `NextManutenzioniPage` mantiene `selectedDetailRecordId`, passa a `NextMappaStoricoPage` il record selezionato e aggiorna il dettaglio da `Dashboard`, `Quadro manutenzioni PDF` e liste storico laterali, senza fallback alla "ultima manutenzione con assi".
40. Nel `Quadro manutenzioni PDF` di `/next/manutenzioni` le metriche sono ora filtro-dipendenti: `Mezzo` usa `km`, `Compressore` usa `ore`, `Attrezzature` non forza `km/ore` se il record non le contiene; anche l'export locale PDF allinea l'intestazione misura al filtro attivo.
41. In `/next/manutenzioni` il form `Nuova / Modifica` espone ora davvero 3 tipi intervento (`Mezzo`, `Compressore`, `Attrezzature`) e `src/next/domain/nextManutenzioniDomain.ts` accetta in modo retrocompatibile il nuovo valore `attrezzature`.
42. In `/next/manutenzioni` il comando `Calibra` e tutta la UI collegata sono stati rimossi dal ramo `embedded` del tab `Dettaglio`.
43. In `/next/domain/nextMappaStoricoDomain.ts` non esistono piu read/write degli override tecnici clone-side usati solo dal vecchio viewer `Calibra`; per `Manutenzioni` restano solo foto vista e hotspot del ramo mappa standalone.
44. In `/next/manutenzioni` il sottotipo gomme non e piu unico: `Gomme ordinarie per asse` aggiorna solo lo stato gomme leggibile per asse, mentre `Gomme straordinarie` salva un evento puntuale con motivo esplicito e compare nel quadro PDF in una sezione separata, senza essere assorbito nel rinnovo ordinario.
45. In `/next/manutenzioni` la microcopy fissa di dashboard, form, quadro e dettaglio e stata ridotta al minimo operativo; le spiegazioni residue passano da `title` / `aria-label` sui controlli principali, con supporto hover/focus senza pannelli guida permanenti.
46. Nel dominio `Magazzino` reale non esiste ancora un modello transazionale condiviso repo-wide: `@inventario` e `@materialiconsegnati` restano dataset storage-style multi-writer, con writer legacy/NEXT multipli e matching non uniformi tra i moduli; la NEXT ha ora un contratto stock locale piu esplicito, ma non elimina i rischi residui dei writer legacy fuori perimetro come `Acquisti`, `DettaglioOrdine` e `IADocumenti`.
47. `@documenti_magazzino` non e il ledger canonico del magazzino: nel repo e usato come archivio documentale e come supporto alla ricostruzione costi materiali in `Dossier` e analisi; `NextMagazzinoPage.tsx` lo espone nella vista `Documenti e costi` come supporto prudente e non lo trasforma in sorgente transazionale canonica. L'unica eccezione scrivente collegata ai documenti resta la deroga IA sulle sole fatture di magazzino, che si appoggia a metadata documento + `stockLoadKeys` e non apre writer generici da documento.
48. La IA interna della NEXT puo leggere il dominio `Magazzino` tramite il motore unificato sopra `@inventario`, `@materialiconsegnati`, `@cisterne_adblue`, `@documenti_magazzino`, costi materiali derivati e procurement di supporto; la UX chat `/next/ia/interna` e ora attachment-first/document-driven per i documenti `Magazzino`, con classificazione automatica prudente, scheda dossier leggibile come riepilogo, review documento full screen, scelta utente esplicita e, solo nei due casi ammessi, conferma/esecuzione/esito inline. Lato scrittura non esistono writer generali D05: l'unica deroga attiva resta confinata ai casi `riconcilia_senza_carico` e `carica_stock_adblue`, usa `stockLoadKeys`, match forte, UDM canoniche e una scoped allowance temporanea su `@inventario`. Dopo il follow-up del `2026-04-11`, la sola riconciliazione non puo piu aumentare quantita e passa solo se l'arrivo procurement compatibile risulta gia consolidato; la review destra e inoltre riordinata in `Documento`, `Righe estratte`, `Match inventario`, `Decisione`, `Azione proposta IA`, `Dettagli tecnici`, con la parte tecnica collassata di default. `Apri in Magazzino` o il modulo target restano fallback/ispezione. Resta `DA VERIFICARE` la prova end-to-end su un candidato reale pronto, oltre all'audit su prompt/allegati misti e sulla robustezza del routing documentale e della review full screen su PDF/immagini reali.

## 5. CONVENZIONI
### Dati e chiavi
- Collection key-value principale: `storage/<key>`.
- Le chiavi business principali su `storage` usano prefisso `@`, per esempio `@mezzi_aziendali`, `@lavori`, `@manutenzioni`, `@rifornimenti`, `@inventario`, `@ordini`, `@preventivi`, `@listino_prezzi`, `@fornitori`, `@colleghi`.
- `@mezzi_aziendali` ha merge speciale in `setItemSync()`; le altre key vengono sovrascritte in blocco.
- Collection dedicate verificate: `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`, `@impostazioni_app/gemini`, `@analisi_economica_mezzi`, `@documenti_cisterna`, `@cisterna_schede_ia`, `@cisterna_parametri_mensili`.
- Collection dedicate modulo nativo NEXT `Euromecc`: `euromecc_pending`, `euromecc_done`, `euromecc_issues`, `euromecc_area_meta`.
- Collection visuali NEXT `Manutenzioni`: `@mezzi_foto_viste`, `@mezzi_hotspot_mapping`.
- Local storage autisti verificato: `@autista_attivo_local`, `@mezzo_attivo_autista_local`.

### Date e formati
- Formato data UI canonico: `dd/mm/yyyy`.
- Formato data+ora UI canonico: `dd/mm/yyyy hh:mm`.
- Formato input HTML date: `yyyy-mm-dd`.
- Parser date accetta stringhe UI, ISO, `number`, oggetti con `toDate()` e oggetti con `seconds`.

### Routing e naming
- Legacy admin: route root `/...`.
- Clone NEXT: route `/next/...`.
- App autisti legacy: `/autisti/...`.
- App autisti clone: `/next/autisti/...`.
- Pagine routed NEXT: `src/next/Next*Page.tsx`.
- Reader/domain NEXT: `src/next/domain/next*Domain.ts`.
- Clone state locale NEXT: file `next*CloneState.ts`.
- Path builder NEXT: `src/next/nextStructuralPaths.ts`.

### UI e lingua
- Lingua UI: italiana.
- La madre resta la sorgente di verita della UI; il clone replica la superficie ma non deve aprire side effect business.
- Il clone rileva il runtime tramite path `/next` e blocca fetch mutanti noti (`/api/*`, cloudfunctions write-heavy, extraction libretto).

### Documentazione pronta
- `docs/fonti-pronte/` raccoglie copie aggiornate delle fonti chiave da usare nelle nuove chat.
- Se un file sorgente gia mirrorato viene aggiornato, la sua copia in `docs/fonti-pronte/` va aggiornata nello stesso task.

### Storage path verificati
- `materiali/<materialId>-<timestamp>.<ext>`
- `inventario/<itemId>/foto.jpg`
- `autisti/segnalazioni/<recordId>/<timestamp>_<n>.<ext>`
- `autisti/richieste-attrezzature/<recordId>/<timestamp>.<ext>`
- `mezzi_foto/<targa>/<vista>_<timestamp>.<ext>`
- `mezzi_aziendali/<mezzoId>/libretto.jpg`
- `documenti_pdf/<...>`
- `documenti_pdf/cisterna/<YYYY>/<MM>/<...>`
- `documenti_pdf/cisterna_schede/<YYYY>/<MM>/<...>_crop.jpg`
- `preventivi/ia/<...>`
- `preventivi/<id>.pdf`

## 6. PROSSIMI TASK
0. Fare audit separato di rivalidazione del dominio `Magazzino NEXT` dopo l'autonomia stock lato NEXT, dopo l'integrazione read-only nella IA interna e dopo la nuova UX document-driven della chat; oggi non va promosso a `CHIUSO` senza prova extra su writer legacy, PDF, rischi multi-writer, robustezza documentale su allegati reali e correttezza dell'handoff IA sui prompt misti.
1. Fare audit separato del modulo `Manutenzioni` dopo la riapertura in scrittura e la nuova vista `Mappa storico`; oggi non va promosso a `CHIUSO` senza prova extra.
2. Fare audit separato del modulo `Lavori` dopo il redesign unificato e la deroga chirurgica su `cloneWriteBarrier.ts`; oggi non va promosso a `CHIUSO` senza prova extra.
3. Ridurre il debito lint globale; oggi e il problema tecnico piu chiaramente verificabile e diffuso.
4. Estendere oltre `Euromecc` la versione verificabile delle policy Firestore effettive e riallinearle al codice.
5. Riallineare `storage.rules` al perimetro reale usato dai moduli e dai backend.
6. Chiudere il modello sicurezza per-ruolo reale oltre l'attuale bootstrap con auth anonima globale.
7. Fare audit V1 del modulo `Euromecc` prima di promuoverlo oltre `PARZIALE`.
8. Canonicalizzare il flusso eventi autisti scegliendo una sola sorgente tra `@storico_eventi_operativi` e `autisti_eventi`.
9. Canonicalizzare il contratto allegati preventivi e i path Storage del procurement.
10. Continuare l'hardening del clone NEXT sui moduli ancora `ACTIVE_PARTIAL`, soprattutto procurement, area capo, cisterna, autisti admin e IA legacy clone.
11. Chiudere la matrice ruoli/permessi reale oltre ai preset frontend `role`.
12. Consolidare i canali server-side IA/PDF; oggi il repo ha backend multipli concorrenti.
13. Aprire il live-read del backend IA separato solo dopo credenziali server-side dedicate e boundary whitelisted verificati.
14. Ridurre il peso del bundle client e la duplicazione `jspdf` se si apre un task performance.

## 7. FILE CHIAVE
### Routing e bootstrap
- `src/App.tsx`
- `src/main.tsx`
- `src/firebase.ts`

### Legacy madre
- `src/pages/Home.tsx`
- `src/pages/CentroControllo.tsx`
- `src/pages/GestioneOperativa.tsx`
- `src/pages/DossierMezzo.tsx`
- `src/pages/Acquisti.tsx`
- `src/pages/MaterialiDaOrdinare.tsx`
- `src/pages/DettaglioOrdine.tsx`

### Legacy autisti
- `src/autisti/AutistiGate.tsx`
- `src/autisti/HomeAutista.tsx`
- `src/autisti/Rifornimento.tsx`
- `src/autistiInbox/AutistiInboxHome.tsx`
- `src/autistiInbox/AutistiAdmin.tsx`

### Shell NEXT
- `src/next/NextShell.tsx`
- `src/next/nextData.ts`
- `src/next/nextAccess.ts`
- `src/next/nextStructuralPaths.ts`

### NEXT mezzi e dossier
- `src/next/NextMezziPage.tsx`
- `src/next/NextDossierListaPage.tsx`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/domain/nextDossierMezzoDomain.ts`
- `src/next/domain/nextRifornimentiDomain.ts`

### NEXT operativita e procurement
- `src/next/NextGestioneOperativaPage.tsx`
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `src/next/NextProcurementReadOnlyPanel.tsx`
- `src/next/NextProcurementConvergedSection.tsx`
- `src/next/domain/nextProcurementDomain.ts`
- `src/next/domain/nextInventarioDomain.ts`
- `src/next/NextLavoriDaEseguirePage.tsx`
- `src/next/NextLavoriInAttesaPage.tsx`
- `src/next/NextLavoriEseguitiPage.tsx`
- `src/next/NextDettaglioLavoroPage.tsx`
- `src/next/next-lavori.css`

### NEXT Euromecc
- `src/next/NextEuromeccPage.tsx`
- `src/next/domain/nextEuromeccDomain.ts`
- `src/next/euromeccAreas.ts`
- `src/next/next-euromecc.css`

### NEXT home e centro controllo
- `src/next/NextHomePage.tsx`
- `src/next/NextCentroControlloParityPage.tsx`
- `src/next/domain/nextCentroControlloDomain.ts`
- `src/next/domain/nextStatoOperativoDomain.ts`

### NEXT IA e IA interna
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiUniversalContracts.ts`
- `src/next/internal-ai/internalAiUniversalRequestResolver.ts`
- `src/next/internal-ai/internalAiUniversalHandoff.ts`
- `src/next/internal-ai/internalAiUniversalRegistry.ts`
- `src/next/internal-ai/internalAiUniversalOrchestrator.ts`
- `src/next/internal-ai/internalAiUniversalRequestsRepository.ts`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js`

### Shared data, barrier e PDF
- `src/utils/storageSync.ts`
- `src/utils/cloneWriteBarrier.ts`
- `src/utils/dateFormat.ts`
- `src/utils/pdfEngine.ts`
- `src/components/PdfPreviewModal.tsx`

### Functions e API
- `functions/index.js`
- `functions/analisiEconomica.js`
- `functions/estrazioneDocumenti.js`
- `functions/iaCisternaExtract.js`
- `functions-schede/index.js`
- `api/pdf-ai-enhance.ts`
- `server.js`

### Documenti sorgente piu utili
- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

### Aggiornamento rapido 2026-04-08
- `Manutenzioni` NEXT resta `PARZIALE`.
- Ultimo micro-fix solo UI/CSS sulla tab `Nuova / Modifica`:
  - riga `Data / KM-Ore / Fornitore` resa piu separata e proporzionata;
  - card `Mezzo attivo` con piu stacco verticale dal blocco `Campi base`.
- Nessuna modifica a logica dati, routing, PDF, foto o dominio.

### Aggiornamento rapido 2026-04-08 bis
- La riga `Data / KM-Ore / Fornitore` in `Manutenzioni` NEXT e ora composta da 3 mini-card separate vere nel JSX, non piu da tre soli input affiancati.
- `Mezzo attivo` ha uno stacco verticale piu evidente sopra `Campi base`.
- Nessuna modifica a logica dati, foto, PDF, `Dettaglio`, routing o dominio.

### Aggiornamento rapido 2026-04-08 ter
- Il tentativo a 3 mini-card alte per `Data / KM-Ore / Fornitore` e stato rimosso.
- La riga usa ora 3 field-group compatti e separati, con `Fornitore` flessibile e altezza ridotta.
- `Mezzo attivo` resta rialzato e separato da `Campi base`.
- Nessuna modifica a logica dati, foto, PDF, `Dettaglio`, routing o dominio.

### Aggiornamento rapido 2026-04-08 quater
- Il blocco `Data / KM-Ore / Fornitore` in `Manutenzioni` NEXT e ora fissato nella struttura finale:
  - `man2-metric-row`
  - tre `man2-metric-group` semplici
  - colonne `180px / 180px / minmax(360px, 1fr)`
- Nessuna mini-card e nessun wrapper alto per singolo campo.
- Nessuna modifica a logica dati, foto, PDF, `Dettaglio`, routing o dominio.

### Aggiornamento rapido 2026-04-08 quinquies
- I campi `Data / KM-Ore / Fornitore` riusano ora la stessa base visiva dei controlli corretti del form (`Tipo`, `Sottotipo`).
- Layout e proporzioni della riga restano invariati.
- Nessuna modifica a logica dati, foto, PDF, `Dettaglio`, routing o dominio.

### Aggiornamento rapido 2026-04-08 sexies
- Micro-fix UI su `Manutenzioni` NEXT:
  - rimossa la label sbiadita sopra `Nuova manutenzione`;
  - testata con piu aria a sinistra per ridurre l'impatto del menu flottante;
  - riga `Data / KM-Ore / Fornitore` leggermente ribilanciata a favore del campo centrale.
- Nessuna modifica a logica dati, foto, PDF, `Dettaglio`, routing o dominio.

### Aggiornamento rapido 2026-04-08 septies
- La riga `Data / KM-Ore / Fornitore` di `Manutenzioni` NEXT usa ora larghezze fisse desktop `190px / 140px / 260px`.
- `Fornitore` non usa piu `1fr` su desktop.
- Nessuna modifica a logica dati, foto, PDF, `Dettaglio`, routing o dominio.

### Aggiornamento rapido 2026-04-08 octies
- Il viewer tecnico di `Manutenzioni` NEXT usa ora `mezziHotspotAreas.ts` come tassonomia reale dei target (`assi`, `fanali_specchi`, `attrezzature`).
- In vista normale non compaiono piu cerchi neutrali permanenti; `Calibra` mostra invece preview asse e grammatica target solo quando richiesto.
- `Fronte/Retro` restano invariati sul fallback foto/hotspot.

### Aggiornamento rapido 2026-04-08 nonies
- Il tab `Dettaglio` di `Manutenzioni` NEXT non pesca piu gli assi da una manutenzione implicita del mezzo.
- Il parent mantiene ora un `selectedDetailRecordId` esplicito e il viewer tecnico legge solo il record aperto.
- Se il record aperto non ha `assiCoinvolti`, il viewer resta pulito.
