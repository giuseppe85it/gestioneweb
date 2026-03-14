# MAPPA FUNZIONI IA LEGACY DELLA MADRE DA ASSORBIRE NELLA NUOVA IA

Ultimo aggiornamento: 2026-03-13  
Stato documento: CURRENT  
Scopo: censire solo le funzioni IA realmente presenti nel repository legacy/madre e fissare cosa la nuova IA interna deve assorbire, rifare o lasciare fuori dal perimetro iniziale.

## 1. Regole decisionali permanenti
- La nuova IA interna non deve fare meno delle funzioni IA legacy gia operative e utili al business.
- Nessuna funzione IA legacy puo diventare il backend canonico del nuovo sottosistema IA interno.
- Se una funzione legacy mescola estrazione, upload e scrittura business, si assorbe la capability ma si rifinisce il flusso con backend dedicato, preview e controllo esplicito.
- Le funzioni che leggono o salvano segreti dal client non sono riusabili come fondazione della nuova IA.
- I workflow altamente verticali o approvativi possono restare fuori dal perimetro iniziale anche se oggi sono operativi nella madre.

## 2. Matrice decisionale sintetica

| Gruppo legacy | Dove si trova nel repo | Cosa fa davvero | Stato reale | Dipendenze / fragilita | Decisione nuova IA | Priorita |
|---|---|---|---|---|---|---|
| Estrazione libretto mezzo | `src/pages/IA/IALibretto.tsx`, `functions/index.js` (`estrazione_libretto`) | Estrae dati del libretto da immagine, permette correzione manuale, salva campi sul mezzo e carica l'immagine su Storage | Operativa nel runtime legacy, ma il frontend usa Cloud Run esterno e non la function in repo | Cloud Run esterno, chiave Gemini lato client, scrittura su `@mezzi_aziendali` e Storage business | `ASSORBIRE RIFACENDO` | ALTA |
| Estrazione documenti IA | `src/pages/IA/IADocumenti.tsx`, `functions/estrazioneDocumenti.js` | Estrae dati da PDF/immagini, classifica documento, prova a collegare la targa, salva nei dataset documentali | Operativa nel runtime legacy | Chiave Gemini lato client, upload Storage business, scrittura su `@documenti_*`, import inventario mescolato nello stesso flusso | `ASSORBIRE RIFACENDO` | ALTA |
| Analisi economica mezzo | `src/pages/AnalisiEconomica.tsx`, `functions/analisiEconomica.js`, `@analisi_economica_mezzi` | Aggrega documenti/costi del mezzo, genera snapshot testuale IA e lo salva per targa | Operativa nel runtime legacy | Snapshot salvato lato business, endpoint legacy dedicato, qualita dipendente dai documenti gia estratti | `ASSORBIRE RIFACENDO` | ALTA |
| Estrazione preventivo procurement | `src/pages/Acquisti.tsx`, `functions/index.js` (`estraiPreventivoIA`) | Estrae fornitore, righe prezzo e warning da PDF o immagini del preventivo | Operativa nel runtime legacy | Callable legacy, path allegati ancora non canonico, backend da consolidare | `ASSORBIRE RIFACENDO` | ALTA |
| Approvazione / PDF timbrati procurement | `src/pages/CapoCostiMezzo.tsx`, `functions/index.js` (`stamp_pdf`), `@preventivi_approvazioni` | Applica timbro approvato/rifiutato ai PDF e supporta workflow capo/approvazioni | Operativa nel runtime legacy | Workflow approvativo separato, side effect su Storage, dominio capo e non IA business generica | `FUORI PERIMETRO INIZIALE` | MEDIA |
| Cisterna documenti e schede | `src/pages/CisternaCaravate/CisternaCaravateIA.tsx`, `src/cisterna/iaClient.ts`, `functions/iaCisternaExtract.js`, `functions-schede/*` | Estrae documenti cisterna e schede con normalizzazione verticale e salvataggio archivio dedicato | Operativa nel runtime legacy | Backend specialistico, preprocess immagini, scrittura su `@documenti_cisterna`, dominio verticale separato | `ASSORBIRE RIFACENDO IN PERIMETRO SEPARATO` | MEDIA |
| Copertura libretti + foto | `src/pages/IA/IACoperturaLibretti.tsx` | Audit copertura libretti/foto e funzioni di riparazione massiva dei record mancanti | Operativa nel runtime legacy | Flusso misto audit + repair, scritture massicce su `@mezzi_aziendali` e Storage | `TENERE COME RIFERIMENTO TECNICO` | MEDIA |
| Export PDF libretti | `src/pages/LibrettiExport.tsx` | Compone PDF unico dai libretti gia presenti e lo mostra in preview | Operativa nel runtime legacy | Non e capability IA core; dipende soprattutto da PDF/preview | `FUORI PERIMETRO INIZIALE` | BASSA |
| Hub IA legacy | `src/pages/IA/IAHome.tsx` | Mostra i moduli IA disponibili e blocca l'accesso se la chiave non e presente | Operativa nel runtime legacy | Dipende da chiave Gemini visibile lato client | `TENERE COME RIFERIMENTO UI` | BASSA |
| Gestione API key IA | `src/pages/IA/IAApiKey.tsx` | Legge e salva la chiave Gemini in Firestore dal client | Operativa nel runtime legacy | Anti-pattern grave: segreto lato client e scrittura business | `FUORI PERIMETRO INIZIALE` | BASSA |
| `aiCore` e PDF IA legacy | `src/utils/aiCore.ts`, `src/utils/pdfEngine.ts` | Prevede task IA centralizzati e miglioramento testuale PDF | Presente nel repo ma backend canonico non dimostrato | `aiCore` non risulta esportata nel backend versionato; contratto runtime incoerente | `TENERE COME RIFERIMENTO TECNICO` | BASSA |
| Server/edge OpenAI non canonici | `server.js`, `api/pdf-ai-enhance.ts` | Espongono utility OpenAI per enhancement PDF/testo | Presenti nel repo ma nessun uso frontend attivo dimostrato | Canali paralleli non canonici, segreti/env separati, ownership non chiusa | `FUORI PERIMETRO INIZIALE` | BASSA |

## 3. Cosa la nuova IA interna deve assorbire davvero

### 3.1 Priorita alta
- Estrazione libretto mezzo come capability reale, ma con backend dedicato, niente segreti lato client e niente scrittura automatica business.
- Estrazione documenti IA con classificazione, targa, campi strutturati e revisione esplicita prima di qualsiasi applicazione.
- Analisi economica mezzo come report/snapshot spiegabile, separato dai documenti base e senza dipendere dal backend legacy attuale.
- Estrazione preventivi procurement come capability specialistica gia usata dal business, ma da ricostruire su backend piu pulito e contratto allegati chiaro.
- Prima wave operativa aperta nel clone il `2026-03-14`: `Analisi economica mezzo` in modalita `preview-first`, read-only, sopra i layer clone-safe esistenti e l'eventuale snapshot legacy gia salvato, senza rigenerazione IA o scritture business.

### 3.2 Priorita media
- Dominio cisterna, ma come filone separato o wave dedicata, non come pezzo indistinto della IA business generale.
- Audit copertura libretti solo come pattern read-only e diagnostico.
- Workflow PDF timbrati/approvazioni solo se si apre un perimetro approvativo dedicato.

### 3.3 Priorita bassa o fuori perimetro iniziale
- Hub IA legacy e pagine di configurazione.
- Export PDF libretti come utility trasversale, non come capability IA critica.
- `aiCore`, `server.js`, `api/pdf-ai-enhance` e canali paralleli non canonici.
- Qualsiasi writer diretto su dataset business usato oggi dalle pagine IA legacy.

## 4. Decisioni strutturali confermate
- La nuova IA interna deve prendere dal legacy il valore di business, non il runtime.
- Le capability `libretto`, `documenti`, `analisi economica` e `preventivi` sono il minimo da non perdere.
- Le capability approvative o verticali (`stamp_pdf`, cisterna) richiedono backend o perimetro dedicato e non vanno fuse nel core iniziale.
- Nessun task futuro puo dichiarare "copertura IA" del nuovo sottosistema senza confrontarsi con questa mappa.

## 5. Documenti da leggere insieme a questa mappa
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
