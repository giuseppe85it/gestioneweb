# VERIFICA INFRASTRUTTURA FIREBASE / BACKEND

## 1. Scopo verifica
- Verificare in sola lettura cosa il repository dimostra davvero su Firestore, Storage, Functions, IA e PDF.
- Distinguere tra:
  - fatto provato dal repository;
  - inferenza tecnica ricavata dal codice;
  - stato deployato NON DIMOSTRATO dal solo repository.
- Chiarire il rischio operativo se in futuro si interviene su Storage, Firestore, IA o PDF senza analisi aggiuntiva.

Limite della verifica:
- questa verifica prova con certezza lo stato del codice versionato;
- NON prova le regole effettivamente deployate su Firebase o l'owner di servizi esterni non versionati qui.

## 2. Cosa e stato controllato
- Firestore
- Storage
- Functions / IA / PDF
- regioni
- path
- rules

Metodo usato:
- ricerca testuale nel repository con `rg`;
- lettura dei file di configurazione Firebase e dei file backend/client coinvolti;
- confronto con l'audit precedente in `docs/audit/`.

## 3. Firestore

### 3.1 Cosa esiste nel repo

| Evidenza | File / blocco | Linee | Cosa e stato trovato | Perche e rilevante |
|---|---|---|---|---|
| Config Firebase client | `src/firebase.ts` | `10-30` | Client configurato sul progetto `gestionemanutenzione-934ef`, con `getFirestore(app)` e `getFunctions(app)` default. | Punto di ingresso reale per tutte le chiamate Firestore/Functions del client. |
| Wrapper principale Firestore | `src/utils/storageSync.ts` | `21-143` | `setItemSync/getItemSync/removeItemSync` leggono e scrivono documenti `storage/<key>`. | Dimostra che gran parte dell'app usa Firestore come key-value store sulla collection `storage`. |
| Auth lato client | `src/App.tsx` | `80-82` | All'avvio app viene eseguito `signInAnonymously(auth)` se non esiste un utente. | Qualsiasi futura regola Firestore/Storage basata solo su `request.auth != null` sarebbe molto permissiva. |
| Doc Firestore diretti fuori da `storageSync` | `src/pages/Acquisti.tsx` | `576-586`, `2363-2377`, `5419-5423` | `@preventivi` usa il campo `preventivi`; `@listino_prezzi` usa il campo `voci`; non usano il solo campo `value`. | Conferma che la collection `storage` non ha uno shape unico. Cambiare regole o contratti senza mappare queste eccezioni e rischioso. |
| Doc Firestore diretti per rifornimenti | `src/autisti/Rifornimento.tsx` | `189-205` | Oltre a `@rifornimenti_autisti_tmp`, il client aggiorna `storage/@rifornimenti` nel campo `items`. | Seconda eccezione importante allo shape standard `value`. |
| Collection IA dedicate | `src/pages/IA/IADocumenti.tsx` | `249-252`, `508-521`, `723-725` | Il client legge e scrive `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`. | Dimostra uso reale di collection dedicate fuori dalla collection `storage`. |
| Collection analisi dedicate | `src/pages/AnalisiEconomica.tsx` | `549-555`, `778-782` | Il client legge e salva `@analisi_economica_mezzi/<targa>`. | Conferma un secondo writer diretto Firestore fuori da `storageSync`. |
| Collection cisterna dedicate | `src/cisterna/collections.ts` | `5-12`, `173-180` | Sono definite e usate `@documenti_cisterna`, `@cisterna_schede_ia`, `@cisterna_parametri_mensili`. | Dimostra un sotto-dominio con collection proprie e chiavi proprie. |
| Config IA in Firestore | `src/pages/IA/IAApiKey.tsx` | `26-32`, `65-71`, `159-161` | Il client legge e scrive `@impostazioni_app/gemini.apiKey`. | E un dato sensibile messo in Firestore e disponibile al client. |
| Fallback eventi autisti | `src/utils/homeEvents.ts` | `270-271` | Esiste lettura da `collection(db, "autisti_eventi")`. | Conferma che la collection e ancora nel codice come fallback, ma non dimostra che sia il canale attivo. |

### 3.2 Cosa manca nel repo
- `firestore.rules` e ASSENTE nel repository.
  - Evidenza: ricerca file `*.rules` restituisce solo `storage.rules`.
- `firebase.json` non contiene una sezione Firestore.
  - Evidenza: `firebase.json:1-30` dichiara solo due codebase Functions e `storage.rules`.
- Le policy Firestore deployate sono quindi `DA VERIFICARE`.

### 3.3 Cosa usa davvero il client

Pattern 1: collection `storage/<key>` tramite wrapper condiviso
- Evidenza principale: `src/utils/storageSync.ts:21-143`.
- Pattern reale:
  - `storage/@mezzi_aziendali`: `src/pages/Mezzi.tsx:321-327`, `787-810`
  - `storage/@lavori`: `src/pages/LavoriDaEseguire.tsx:95-98`, `src/pages/DettaglioLavoro.tsx:23-87`
  - `storage/@inventario`: `src/pages/Inventario.tsx:68-101`
  - `storage/@manutenzioni`: `src/pages/Manutenzioni.tsx:130-224`
  - `storage/@materialiconsegnati`: `src/pages/MaterialiConsegnati.tsx:118-200`
  - `storage/@autisti_sessione_attive`: `src/autisti/SetupMezzo.tsx:186-250`, `386`; `src/autisti/HomeAutista.tsx:90-93`, `242-245`
  - `storage/@storico_eventi_operativi`: `src/autisti/LoginAutista.tsx:21-29`, `src/autisti/SetupMezzo.tsx:97-101`, `src/autisti/HomeAutista.tsx:52-60`, `src/autisti/CambioMezzoAutista.tsx:67-71`
  - `storage/@controlli_mezzo_autisti`: `src/autisti/ControlloMezzo.tsx:98-119`
  - `storage/@segnalazioni_autisti_tmp`: `src/autisti/Segnalazioni.tsx:348-350`
  - `storage/@richieste_attrezzature_autisti_tmp`: `src/autisti/RichiestaAttrezzature.tsx:147-149`
  - `storage/@rifornimenti_autisti_tmp`: `src/autisti/Rifornimento.tsx:185-187`
  - `storage/@alerts_state`: `src/pages/Home.tsx:938-957`, `2294`, `2317`

Pattern 2: documenti `storage/<key>` letti/scritti direttamente con shape custom
- `storage/@preventivi` -> campo `preventivi`: `src/pages/Acquisti.tsx:576-579`, `2363-2366`
- `storage/@listino_prezzi` -> campo `voci`: `src/pages/Acquisti.tsx:584-587`, `2374-2377`
- `storage/@rifornimenti` -> campo `items`: `src/autisti/Rifornimento.tsx:189-205`, `src/autistiInbox/AutistiAdmin.tsx:1750-1765`, `2021-2039`, `2088-2101`

Pattern 3: collection dedicate fuori dalla collection `storage`
- `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`
  - writer: `src/pages/IA/IADocumenti.tsx:508-521`
  - reader: `src/pages/DossierMezzo.tsx:430-452`, `src/pages/Mezzo360.tsx:27-29`, `236`, `src/pages/CapoMezzi.tsx:30-33`, `294`, `src/pages/CapoCostiMezzo.tsx:44-47`, `330`
- `@analisi_economica_mezzi`
  - reader/writer: `src/pages/AnalisiEconomica.tsx:549-555`, `778-782`
- `@documenti_cisterna`, `@cisterna_schede_ia`, `@cisterna_parametri_mensili`
  - definizione: `src/cisterna/collections.ts:5-12`
  - uso: `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:335-336`, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1044`, `1153`, `1835`, `1855`, `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:400`, `480`, `522`, `950`, `1101`
- `@impostazioni_app/gemini`
  - writer client: `src/pages/IA/IAApiKey.tsx:65-71`
  - reader client: `src/pages/IA/IAHome.tsx:16-19`, `src/pages/IA/IALibretto.tsx:64-67`, `src/pages/IA/IADocumenti.tsx:209-214`
  - reader backend: `functions/index.js:53-59`, `functions/estrazioneDocumenti.js:16-21`, `functions/analisiEconomica.js:13-17`, `functions/iaCisternaExtract.js:13-17`, `functions-schede/estrazioneSchedaCisterna.js:18-23`, `functions-schede/cisternaDocumentiExtract.js:200-205`

### 3.4 Rischi

Rischio reale immediato sul legacy
- Alto: tutta l'app dipende da `storage/<key>` e da collection dedicate senza `firestore.rules` versionate; qualsiasi intervento "alla cieca" puo rompere letture/scritture cross-modulo.
- Alto: il client entra con auth anonima (`src/App.tsx:80-82`); regole basate solo sulla presenza di auth non darebbero vera segregazione.
- Alto: la chiave Gemini e salvata in `@impostazioni_app/gemini` e letta dal client e dal backend; questo e un rischio attuale di esposizione/segreto.

Rischio futuro / architetturale
- Alto: la collection `storage` non ha un contratto unico (`value`, `items`, `preventivi`, `voci`); la NEXT non puo assumere uno shape uniforme senza un audit per documento.
- Medio/Alto: `autisti_eventi` resta nel codice come fallback (`src/utils/homeEvents.ts:270-271`) ma il canale canonico attivo non e chiuso a livello repository.

Tipo problema
- Firestore rules: infrastrutturale + architetturale.
- Shape `storage/*`: misto dati/infrastruttura.
- `@impostazioni_app/gemini`: sicurezza + documentazione.

### 3.5 Note
- `docs/flusso_autisti_admin.txt` continua a citare scritture dirette su `autisti_eventi`, ma la ricerca nel codice `src/` corrente non ha trovato writer attivi corrispondenti; quindi il punto va tenuto `DA VERIFICARE` e non considerato canale provato.
- La policy Firestore effettiva deployata NON E DIMOSTRATA dal repository.

## 4. Storage

### 4.1 Rules trovate

| Evidenza | File / blocco | Linee | Cosa e stato trovato | Perche e rilevante |
|---|---|---|---|---|
| Config rules Storage | `firebase.json` | `28-29` | Il deploy Storage punta a `storage.rules`. | Conferma che il repository dichiara una sola sorgente rules per Storage. |
| Rules Storage nel repo | `storage.rules` | `1-12` | `allow read, write: if false` su tutto il bucket. | Contraddice l'uso reale del client e del backend. |
| Bucket client | `src/firebase.ts` | `15`, `27` | Bucket configurato: `gestionemanutenzione-934ef.firebasestorage.app`. | Serve per capire bucket e impatto di path/rules. |

### 4.2 Path usati realmente

| Path Storage | Operazioni confermate | Evidenza | Note |
|---|---|---|---|
| `mezzi/<targa>_<timestamp>.jpg` | upload + download URL | `src/pages/Mezzi.tsx:679-689` | Foto mezzo; e distinto dal path dei libretti. |
| `mezzi_aziendali/<mezzoId>/libretto.jpg` | upload + download URL | `src/pages/IA/IALibretto.tsx:435-440`; `src/pages/IA/IACoperturaLibretti.tsx:425-431`, `510-522` | Libretto mezzo. |
| `inventario/<id>/foto.jpg` | upload + download URL | `src/pages/Inventario.tsx:107-113` | Foto articolo inventario. |
| `materiali/<materialId>-<timestamp>.<ext>` | upload + delete | `src/utils/materialImages.ts:12-20`, `27-32` | Foto materiali ordine/magazzino. |
| `autisti/segnalazioni/<recordId>/<timestamp>_<n>.<ext>` | upload + download URL + salvataggio path | `src/autisti/Segnalazioni.tsx:278-282`, `336-337` | Allegati segnalazioni autisti. |
| `autisti/richieste-attrezzature/<recordId>/<timestamp>.<ext>` | upload + download URL + delete | `src/autisti/RichiestaAttrezzature.tsx:72-85`, `97-100` | Allegati richieste attrezzature. |
| `documenti_pdf/<timestamp>_<nomefile>` | upload + download URL | `src/pages/IA/IADocumenti.tsx:479-484` | Intake documenti IA generale. |
| `documenti_pdf/cisterna/<YYYY>/<MM>/<nomefile>` | upload + download URL | `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:241-245` | Intake cisterna documenti. |
| `documenti_pdf/cisterna_schede/<YYYY>/<MM>/<nome>_crop.jpg` | upload + download URL | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2072-2076` | Crop immagine per OCR cisterna. |
| `preventivi/ia/<extractionId>.pdf` | upload + listAll + delete | `src/pages/Acquisti.tsx:2553-2554`, `2648-2649`, `3097-3099`, `2756` | Flusso IA preventivi. |
| `preventivi/ia/<extractionId>_<idx>.<ext>` | upload + listAll + delete | `src/pages/Acquisti.tsx:2553-2554`, `2648-2649`, `3126-3128`, `2756` | Immagini IA preventivi. |
| `preventivi/<id>.pdf` | upload + download URL + delete | `src/pages/Acquisti.tsx:3304-3307`, `3362`, `3672-3676` | Flusso manuale/fallback preventivi. |
| `originalPath + _STAMP_<status>_<ts>` oppure `stamped/<ts>_<status>.pdf` | write backend + download URL | `functions/index.js:88-97`, `711-729` | Output PDF timbrato da `stamp_pdf`. |

### 4.3 Flussi reali client
- Upload:
  - mezzi, libretti, inventario, materiali, documenti IA, segnalazioni, richieste attrezzature, preventivi IA/manuali, cisterna.
- Download:
  - `getDownloadURL` diffuso su mezzi, libretti, inventario, documenti IA, preventivi, PDF e allegati autisti.
- Delete:
  - `deleteObject` usato su richieste attrezzature, cleanup allegati IA preventivi, PDF preventivi manuali, allegati autisti admin.
- List:
  - `listAll(ref(storage, "preventivi/ia"))` usato per browsing e cleanup orfani in `Acquisti`.

### 4.4 Contraddizioni
- Contraddizione principale:
  - `storage.rules:9` nega tutto;
  - il client usa upload/download/delete/listAll in flussi operativi reali.
- Contraddizione path:
  - coesistono almeno tre famiglie critiche di path file documento:
    - `documenti_pdf/*`
    - `preventivi/ia/*`
    - `preventivi/<id>.pdf`
- Contraddizione documentale:
  - il path `mezzi/<targa>_<timestamp>.jpg` e attivo per foto mezzo, ma non e il medesimo path usato per i libretti (`mezzi_aziendali/<mezzoId>/libretto.jpg`).

### 4.5 Rischi

Rischio reale immediato sul legacy
- Critico: toccare Storage rules o bucket senza mappare tutti i path sopra puo rompere upload/download in moduli gia operativi.
- Critico: `Acquisti` non usa solo upload/download; usa anche `listAll` e `deleteObject` su `preventivi/ia`, quindi una rule troppo stretta puo rompere anche cleanup e consultazione.
- Alto: `stamp_pdf` scrive nuovi file su Storage lato backend; cambiare path o bucket impatta anche il flusso timbro PDF, non solo il client.

Rischio futuro / architetturale
- Alto: senza un contratto unico sugli allegati preventivi, la NEXT non puo razionalizzare Storage in sicurezza.
- Alto: repo e runtime possono gia essere disallineati sulle rules; se il repo viene usato come base per un nuovo deploy, il rischio di regressione e molto alto.

Tipo problema
- Storage rules: infrastrutturale critico.
- Path preventivi: misto dati/infrastruttura.
- Bucket/path multipli: architetturale.

### 4.6 Note
- Lo stato delle Storage rules realmente deployate resta `DA VERIFICARE`.
- Il repository dimostra con certezza che il codice si aspetta Storage pienamente operativo.

## 5. Functions / IA / PDF

### 5.1 Endpoint trovati

| Canale | Client caller | Backend repo | Regione / host rilevabile | Stato |
|---|---|---|---|---|
| `aiCore` callable | `src/utils/aiCore.ts:4-21`; `src/utils/pdfEngine.ts:313-321` | export NON trovato in `functions/index.js:526-529` e `functions-schede/index.js:5-12` | `europe-west3` esplicito lato client | Contraddittorio |
| `estraiPreventivoIA` callable | `src/pages/Acquisti.tsx:2329-2330`, `3149` | `functions/index.js:529-629` | Regione NON esplicitata nel repo; il client usa `getFunctions(app)` default (`src/firebase.ts:30`) | Confermato lato codice, regione `DA VERIFICARE` |
| `stamp_pdf` HTTP | `src/pages/CapoCostiMezzo.tsx:705-724` | `functions/index.js:631-734` | `us-central1` hardcoded nel client | Confermato |
| `estrazioneDocumenti` HTTP | `src/pages/IA/IADocumenti.tsx:366-371` | `functions/estrazioneDocumenti.js:72-128`; re-export `functions/index.js:526` | `us-central1` hardcoded nel client | Confermato |
| `analisi_economica_mezzo` HTTP | `src/pages/AnalisiEconomica.tsx:750-755` | `functions/analisiEconomica.js:20-99`; re-export `functions/index.js:528` | `us-central1` hardcoded nel client | Confermato |
| `ia_cisterna_extract` HTTP | `src/cisterna/iaClient.ts:8`, `36-39` | `functions/iaCisternaExtract.js:128-170`; re-export `functions/index.js:527` | `us-central1` hardcoded nel client | Confermato |
| `estrazioneSchedaCisterna` HTTP | `src/cisterna/iaClient.ts:10`, `130-133`, `238-241` | `functions-schede/index.js:5-8`; duplicato anche in `functions-schede/estrazioneSchedaCisterna.js:495-496` | `us-central1` hardcoded nel client; backend senza regione esplicita | Confermato ma ambiguo a livello runtime |
| `cisterna_documenti_extract` HTTP | `src/cisterna/iaClient.ts:12`, `68-71` | `functions-schede/index.js:10-12` | `us-central1` hardcoded nel client; backend senza regione esplicita | Confermato |
| `estrazione_libretto` HTTP Function | nessun caller attivo trovato in `src/` | `functions/index.js:735-831` | commento repo su endpoint pubblico `us-central1` (`functions/index.js:522-524`) | Presente nel repo ma NON DIMOSTRATO come canale client attivo |
| Cloud Run libretto | `src/pages/Mezzi.tsx:14`, `540-543`; `src/pages/IA/IALibretto.tsx:223-230` | nessun sorgente server in repo per questo host | host `https://estrazione-libretto-7bo6jdsreq-uc.a.run.app` | Canale attivo esterno al repo |
| OpenAI edge/local `pdf-ai-enhance` | nessun caller trovato in `src/` | `api/pdf-ai-enhance.ts:1-96`; `server.js:11-61` | Vercel edge / server locale | NON DIMOSTRATO come canale attivo |

### 5.2 Regioni trovate
- `europe-west1`
  - evidenza: `src/firebase.ts:13`
  - riguarda il `databaseURL` Realtime Database configurato nel client.
- `europe-west3`
  - evidenza: `src/utils/aiCore.ts:4`
  - riguarda solo il callable `aiCore` lato client.
- `us-central1`
  - evidenza: `src/pages/IA/IADocumenti.tsx:367`, `src/pages/AnalisiEconomica.tsx:751`, `src/pages/CapoCostiMezzo.tsx:706`, `src/cisterna/iaClient.ts:8-12`
  - riguarda gli endpoint HTTP Cloud Functions hardcoded.
- `DA VERIFICARE`
  - regione effettiva del Cloud Run `estrazione-libretto-7bo6jdsreq-uc.a.run.app` non e dichiarata in nessun file del repo;
  - regione effettiva di `estraiPreventivoIA` non e esplicitata nel repo, perche client e backend non la pinzano in modo testuale.

Nota di metodo:
- Per `estraiPreventivoIA` esiste una inferenza tecnica plausibile verso la regione default Firebase Functions, ma il repository non la dichiara in modo esplicito; viene quindi mantenuta `DA VERIFICARE`.

### 5.3 Funzioni IA/PDF trovate
- Nel codebase `functions`:
  - `estrazioneDocumenti`
  - `ia_cisterna_extract`
  - `analisi_economica_mezzo`
  - `estraiPreventivoIA`
  - `stamp_pdf`
  - `estrazione_libretto`
- Nel codebase `functions-schede`:
  - `estrazioneSchedaCisterna`
  - `cisterna_documenti_extract`
- Assenza rilevante:
  - `aiCore` NON risulta esportata nei codebase backend del repo, pur essendo usata dal client.

### 5.4 Canali canonici o non canonici
- Canale canonico unico: `NON DIMOSTRATO`.
- Canali realmente coesistenti:
  - callable Firebase (`estraiPreventivoIA`, `aiCore`);
  - HTTP Cloud Functions hardcoded su `us-central1`;
  - Cloud Run esterno hardcoded per libretto;
  - endpoint OpenAI Edge/Express presenti nel repo ma senza caller client dimostrato.

### 5.5 Differenze rispetto ai docs
- L'audit precedente segnalava `aiCore` come canale dubbio: la verifica attuale lo aggrava, perche il client lo usa davvero ma il backend versionato qui non lo esporta.
- `estraiPreventivoIA` e `stamp_pdf` risultano invece flussi reali, attivi e mappabili con precisione.
- `estrazione_libretto` esiste nel backend repo, ma il client usa un endpoint Cloud Run esterno diverso.
- `api/pdf-ai-enhance.ts` e `server.js` esistono, ma il repository non dimostra che il frontend li chiami oggi.

### 5.6 Rischi

Rischio reale immediato sul legacy
- Alto: una redeploy del backend basata solo su questo repo rischia di non coprire tutti i canali attivi, perche `aiCore` non e versionata qui e il libretto usa Cloud Run esterno.
- Alto: le funzioni IA/PDF leggono tutte la stessa API key da `@impostazioni_app/gemini`; cambiare quel documento o le relative regole impatta piu pipeline insieme.
- Medio/Alto: tutte le HTTP Functions principali hanno CORS wildcard (`functions/estrazioneDocumenti.js:77-83`, `functions/analisiEconomica.js:22-28`, `functions/iaCisternaExtract.js:130-136`, `functions/index.js:633-639`, `738-744`, `functions-schede/estrazioneSchedaCisterna.js:75-78`, `functions-schede/cisternaDocumentiExtract.js:42-45`).

Rischio futuro / architetturale
- Critico: non esiste un canale backend canonico unico per IA/PDF.
- Alto: regioni, host e runtime sono misti (`europe-west3`, `us-central1`, Cloud Run, callable default, Functions v1/v2).
- Alto: i modelli Gemini non sono unificati:
  - `gemini-2.5-flash` in `functions/index.js:19`, `functions/analisiEconomica.js:10`, `functions/estrazioneDocumenti.js:66`, `functions/iaCisternaExtract.js:10`
  - `gemini-2.5-pro` in `functions-schede/estrazioneSchedaCisterna.js:71`, `functions-schede/cisternaDocumentiExtract.js:10`

Tipo problema
- `aiCore`: misto infrastrutturale + architetturale.
- `estraiPreventivoIA` / `stamp_pdf`: oggi piu documentale che di esistenza endpoint.
- Cloud Run libretto: infrastrutturale + ownership.
- endpoint OpenAI edge/local: documentale / perimetro runtime.

### 5.7 Note
- `functions-schede/estrazioneSchedaCisterna.js:495-496` esporta ancora anche una variante v1 dello stesso handler, mentre `functions-schede/index.js:5-12` esporta la variante v2. Questo rende ambiguo quale runtime sia davvero quello gestito come canonico.
- Il repo non dimostra quale owner mantenga il servizio Cloud Run del libretto.

## 6. Conclusioni operative

### Verifica dei 5 punti gia emersi dall'audit precedente

| Punto | Esito attuale | Rischio reale immediato sul gestionale legacy | Rischio futuro sulla NEXT | Tipo problema | Azione consigliata | Priorita |
|---|---|---|---|---|---|---|
| `AUD-001` - `aiCore` canonico non dimostrato | Aggravato | Alto: il client usa `aiCore`, ma il backend versionato qui non la esporta. Un deploy o refactor backend puo lasciare scoperto il PDF IA. | Critico: senza ownership/canale canonico la NEXT non ha un backend IA affidabile da assumere come base. | Misto | Mappare owner/runtime reale di `aiCore` prima di toccare Functions o PDF IA. | Alta |
| `AUD-002` - `estraiPreventivoIA` / `stamp_pdf` non mappati nei docs | Ridimensionato | Medio: i flussi esistono e sono chiari; il rischio e soprattutto di non considerarli quando si tocca Storage/backend. | Medio: il gap e soprattutto di documentazione e contratto endpoint. | Prevalentemente documentale | Consolidare la mappa endpoint nei docs ufficiali. | Media |
| `AUD-003` - endpoint e regioni miste | Aggravato | Alto: oltre a `us-central1` ed `europe-west3`, il libretto passa su Cloud Run esterno; inoltre esistono endpoint OpenAI presenti ma non dimostrati come attivi. | Critico: senza normalizzazione la progettazione NEXT rischia di replicare host hardcoded e deploy drift. | Misto | Definire un inventario canonico IA/PDF con owner, runtime, regione e fallback. | Alta |
| `AUD-004` - Storage rules deny-all vs uso reale client | Confermato e aggravato | Critico: il client usa upload/download/delete/listAll su molti path e il backend `stamp_pdf` scrive nuovi file. Toccare Storage senza analisi puo rompere flussi reali. | Critico: la NEXT non puo pianificare allegati/file senza chiarire rules e path contrattuali. | Infrastrutturale critico | Non toccare Storage rules, bucket o path senza matrice path->modulo->operazione. | Alta |
| `AUD-005` - `firestore.rules` assente | Confermato | Medio/Alto: il gestionale attuale continua a funzionare solo se le regole deployate esistono fuori repo; dal repo non sono verificabili. | Critico: la NEXT non puo avere una baseline sicurezza dati senza rules versionate. | Infrastrutturale + architetturale | Recuperare e versionare la policy Firestore ufficiale prima di refactor su permessi/dati. | Alta |

## 7. Priorita consigliate

### Da verificare ma non urgente
- Uso reale di `api/pdf-ai-enhance.ts` e `server.js`: presenti nel repo, nessun caller trovato in `src/`.
- Regione effettiva del servizio Cloud Run `estrazione-libretto-7bo6jdsreq-uc.a.run.app`.
- Regione effettiva deployata di `estraiPreventivoIA`, non esplicitata nel repo.

### Da chiarire prima della NEXT
- Canale canonico unico IA/PDF con owner, regione, runtime e fallback.
- Policy Firestore ufficiale versionata e coerente con auth anonima corrente o con futura auth forte.
- Strategia ufficiale per `@impostazioni_app/gemini`: oggi e un segreto accessibile dal client.
- Contratto finale allegati preventivi: `preventivi/ia/*` vs `preventivi/<id>.pdf`.

### Da non toccare senza analisi aggiuntiva
- `storage.rules`, bucket Storage e tutti i path allegati sopra.
- Collection `storage/*`, in particolare documenti con shape non standard (`@preventivi`, `@listino_prezzi`, `@rifornimenti`).
- Qualsiasi deploy backend che assuma che tutti i canali IA/PDF attivi siano versionati in questo repo.

### Critico reale sui flussi operativi
- Storage: rules/path/bucket possono rompere upload, consultazione, cleanup e timbro PDF.
- Backend IA/PDF: `aiCore` e canale libretto non sono pienamente governati dal repo; intervenire su Functions senza mappa reale puo causare regressioni immediate.
- Sicurezza dati: qualunque hardening Firestore/Storage fatto ignorando `signInAnonymously` rischia di essere solo apparente o di rompere l'app.
