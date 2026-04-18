# AUDIT FLUSSO LIBRETTO MADRE COMPLETO

## SCOPO
- Audit in sola lettura del flusso legacy MADRE relativo a `IA Libretto`.
- Perimetro verificato: route legacy, UI, chiamata di estrazione, associazione mezzo, salvataggio su Firestore/Storage, lettori downstream collegati.
- Rischio operativo del perimetro: `EXTRA ELEVATO` perche coinvolge servizio esterno non versionato nel repo, Storage Firebase e riscrittura del dataset `@mezzi_aziendali`.
- Regola usata: contano solo i file reali letti nel repo. Dove il repo non dimostra un fatto, e marcato `NON DIMOSTRATO`.

## FILE LETTI DAVVERO
- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`
- `src/App.tsx`
- `src/pages/IA/IAHome.tsx`
- `src/pages/IA/IALibretto.tsx`
- `src/pages/IA/IACoperturaLibretti.tsx`
- `src/pages/IA/ControlloDebug.tsx`
- `src/pages/LibrettiExport.tsx`
- `src/pages/Mezzi.tsx`
- `src/pages/DossierMezzo.tsx`
- `src/pages/Home.tsx`
- `src/utils/storageSync.ts`
- `src/utils/pdfEngine.ts`
- `src/firebase.ts`
- `storage.rules`

## FATTI CERTI / IPOTESI
- FATTI CERTI: tutto cio che segue nelle sezioni operative deriva dai file sopra.
- IPOTESI: nessuna.
- NON DIMOSTRATO: implementazione backend del servizio esterno `estrazione-libretto`, schema server-side completo della risposta, logica OCR/prompt, eventuale supporto camera nativo oltre al normale file picker del browser.

## FLUSSO COMPLETO PASSO-PASSO

### 1. Entry reale e route
- La route legacy MADRE esiste davvero in `src/App.tsx` come `path="/ia/libretto"` con mount di `IALibretto`.
- Nello stesso file esiste anche la route NEXT `path="ia/libretto"` con mount `NextIALibrettoPage`, ma non fa parte del flusso legacy auditato.
- L’ingresso legacy piu diretto parte da `src/pages/IA/IAHome.tsx`, card `Estrazione Libretto`, che fa `navigate("/ia/libretto")`.
- Dalla stessa `IAHome` esistono anche gli ingressi:
- `navigate("/ia/libretto?archive=1")` per archivio libretti.
- `navigate("/ia/copertura-libretti")` per copertura/riparazione.
- `navigate("/libretti-export")` per export PDF.
- `src/pages/Home.tsx` contiene anche un quick link verso `/ia/libretto`.
- `src/pages/DossierMezzo.tsx` contiene un bottone `LIBRETTO` che:
- se il mezzo non ha `librettoUrl`, porta a `/ia/libretto?archive=1&targa=<targa>`;
- se il mezzo ha `librettoUrl`, porta a `/ia/libretto?open=1&targa=<targa>`.

### 2. Stati UI reali in `IALibretto`
- Stato `apiKeyExists === null`: schermata `Caricamento...`.
- Stato `apiKeyExists === false`: schermata bloccante `API Key IA mancante` con bottone `Vai a API Key IA` verso `/ia/apikey`.
- Stato operativo standard:
- pannello `Caricamento libretto`;
- pannello `Anteprima e risultati`;
- sezione `Archivio libretti IA`;
- viewer modale immagine se `viewerOpen === true`.
- Le principali variabili UI reali sono:
- `selectedFile`, `preview`, `loading`, `results`, `errorMessage`;
- `archiveMezzi`, `archiveLoading`, `archiveError`, `archiveFilter`;
- `viewerOpen`, `viewerUrl`, `viewerTarga`, `viewerRotate`, `viewerZoom`, `viewerError`.

### 3. Caricamento o acquisizione libretto
- `IALibretto` usa un solo input file reale: `<input type="file" accept="image/*" onChange={handleFile} />`.
- `handleFile` accetta solo file immagine; se il MIME non inizia con `image/` mostra `Carica solo immagini (JPG o PNG).`
- Il file viene letto con `FileReader.readAsDataURL` e salvato in `preview`.
- Supporto PDF nel flusso `IALibretto`: `NON DIMOSTRATO`.
- Acquisizione camera nativa: `NON DIMOSTRATO`. Il codice non usa l’attributo `capture`; resta solo il comportamento generico del file picker del browser.

### 4. Handler reale del bottone `Analizza`
- Il bottone `Analizza con IA` chiama `handleAnalyze`.
- `handleAnalyze`:
- blocca se `selectedFile` e assente;
- converte il file in Data URL base64;
- se il Data URL parte da `data:image/png`, sostituisce solo l’header in `data:image/jpeg` per la request;
- chiama con `fetch` l’endpoint esterno `https://estrazione-libretto-7bo6jdsreq-uc.a.run.app`;
- usa payload JSON:

```json
{
  "base64Image": "<data-url-base64>",
  "mimeType": "image/jpeg"
}
```

- Se `response.ok === false`, legge `response.text()` e alza errore HTTP.
- Se `json.success` e falso, alza errore usando `json.error`.
- Se la risposta e positiva, esegue `setResults(json.data)` senza ulteriori filtri o normalizzazioni.

### 5. Schema reale dell’estrazione lato frontend
- Nel repo MADRE non esiste un type condiviso o uno schema statico ufficiale per `json.data`.
- In `IALibretto` il frontend accetta qualunque oggetto e renderizza tutti i campi con `Object.entries(results)`.
- I campi usati davvero da `IALibretto` al momento del salvataggio sono:
- `targa` obbligatoria;
- `marca`;
- `modello`;
- `telaio`;
- `colore`;
- `categoria`;
- `cilindrica` -> mappa su `cilindrata`;
- `potenza`;
- `pesoTotale` -> mappa su `massaComplessiva`;
- `proprietario`;
- `assicurazione`;
- `immatricolazione` -> mappa su `dataImmatricolazione`;
- `revisione` -> mappa su `dataUltimoCollaudo`;
- `dataScadenzaRevisione`;
- `note`.
- `src/pages/Mezzi.tsx` usa lo stesso endpoint esterno ma con logica piu tollerante. Questo rende dimostrabili anche alias aggiuntivi che il backend puo restituire e che almeno un consumer legacy accetta:
- `pesoTotale` oppure `massaComplessiva`;
- `cilindrica` oppure `cilindrata`;
- `immatricolazione` oppure `dataImmatricolazione`;
- `revisione` oppure `ultimoCollaudo` oppure `dataUltimoCollaudo`;
- `dataScadenzaRevisione` oppure `scadenzaRevisione`.
- Schema backend completo: `NON DIMOSTRATO`.

### 6. Preview e risultati dopo l’estrazione
- La preview mostrata e sempre l’immagine locale caricata (`preview`), non il file salvato su Storage e non un output del backend.
- I risultati vengono mostrati come lista dinamica di input editabili, uno per ogni chiave di `results`.
- Non esiste una UI di validazione strutturale del payload.
- Non esiste un selettore mezzo.
- Non esiste autosuggest mezzo.
- Non esiste match automatico spiegato all’utente in UI.
- L’unico blocco certo prima del salvataggio e la presenza di `results.targa`.

### 7. Associazione al mezzo
- In `IALibretto`, l’associazione al mezzo avviene solo per targa normalizzata.
- Logica reale:
- `normalizeTarga(results.targa)` -> uppercase + trim;
- `normalizeTargaKey(results.targa)` -> uppercase + rimozione di tutto cio che non e `[A-Z0-9]`;
- ricerca nel dataset `@mezzi_aziendali` con `findIndex((m) => normalizeTargaKey(m?.targa) === targaKey)`.
- Se il match esiste, il libretto viene associato a quel mezzo.
- Se il match non esiste, il codice crea un nuovo mezzo fallback con `id = MEZZO-<timestamp>`, `tipo = "motrice"` e molti campi vuoti, poi salva il libretto su quel nuovo record.
- Selezione manuale del mezzo: `NON DIMOSTRATO`.
- Autosuggest mezzo: `NON DIMOSTRATO`.
- Conferma esplicita utente sulla targa target: `NON DIMOSTRATO`.
- Associazione obbligatoria prima del salvataggio:
- si, ma solo nel senso che deve esistere una `targa` nel payload;
- no, se per “associazione obbligatoria” si intende scelta manuale del mezzo gia esistente, perche il codice puo creare un mezzo nuovo in fallback.

### 8. Handler reale del bottone `Salva`
- Il bottone `Salva nei documenti del mezzo` chiama `handleSave`.
- `handleSave` blocca solo se:
- `results` manca;
- oppure `results.targa` manca.
- Ordine reale delle operazioni:
- `getDoc(doc(db, "storage", "@mezzi_aziendali"))`;
- legge `snap.data().value || []`;
- cerca il mezzo per targa normalizzata;
- se non lo trova, crea un nuovo mezzo fallback;
- mappa i campi IA -> mezzo;
- deriva `marcaModello`;
- prova a derivare `anno` da `dataImmatricolazione` solo se nel formato `gg.mm.aaaa`;
- se esiste `preview`, fa upload su Storage;
- ottiene `getDownloadURL`;
- scrive `mezzo.librettoUrl` e `mezzo.librettoStoragePath`;
- sostituisce il record all’indice locale `mezzi[index] = mezzo`;
- chiama `setItemSync("@mezzi_aziendali", mezzi)`.
- Dentro `setItemSync("@mezzi_aziendali", mezzi)` l’ordine reale continua cosi:
- `getDoc(doc(db, "storage", "@mezzi_aziendali"))`;
- merge con il valore corrente remoto usando prima `id`, poi targa normalizzata;
- `setDoc(ref, { value: mergedAfterRemovals })`.
- Quindi il salvataggio finale e una riscrittura del documento `storage/@mezzi_aziendali` con array `value`, non una patch parziale su un singolo mezzo.

## DATASET E CAMPI SCRITTI

### Firestore
- Documento scritto: `storage/@mezzi_aziendali`.
- Shape finale scritta: `{ value: Mezzo[] }`.
- Campi del record mezzo che `IALibretto` puo aggiornare direttamente:
- `targa`;
- `marca`;
- `modello`;
- `telaio`;
- `colore`;
- `categoria`;
- `cilindrata`;
- `potenza`;
- `massaComplessiva`;
- `proprietario`;
- `assicurazione`;
- `dataImmatricolazione`;
- `dataUltimoCollaudo`;
- `dataScadenzaRevisione`;
- `note`;
- `marcaModello` derivato;
- `anno` derivato;
- `librettoUrl`;
- `librettoStoragePath`;
- `id` se viene creato il mezzo fallback.
- Se il mezzo non esiste, il record fallback viene creato anche con:
- `fotoUrl: null`;
- `tipo: "motrice"`;
- campi manutenzione inizializzati;
- `autistaId: null`;
- `autistaNome: null`.

### Storage
- Path reale usato da `IALibretto`: `mezzi_aziendali/<mezzoId>/libretto.jpg`.
- Formato file lato path: sempre `.jpg`.
- Contenuto realmente salvato:
- non il payload inviato al backend;
- non un PDF;
- non una preview derivata server-side;
- viene salvato `preview`, cioe il Data URL locale generato dal browser con `FileReader`.
- Quindi il file salvato coincide con la rappresentazione client-side del file caricato.
- Se il file caricato e PNG, la request al backend viene forzata a `mimeType: image/jpeg`, ma il file salvato su Storage puo restare il Data URL PNG originale sotto path `.jpg`.
- Salvataggio del file originale separato dalla preview: `NON DIMOSTRATO`.
- Salvataggio di una preview aggiuntiva separata dal file originale: `NON DIMOSTRATO`.

## PATH STORAGE E REGOLE
- `storage.rules` contiene:
- `match /mezzi_aziendali/{allPaths=**} { allow read, write: if request.auth != null; }`
- Il path usato dal flusso legacy `mezzi_aziendali/<mezzoId>/libretto.jpg` e quindi compatibile con le regole.
- Esiste anche `match /libretto/{allPaths=**}`, ma non viene usato da `IALibretto`, `IACoperturaLibretti` o `LibrettiExport`.
- Nessuna regola storage speciale aggiuntiva per i libretti oltre al match `mezzi_aziendali/**`.
- Garanzia di utente autenticato al momento dell’upload/download: `NON DIMOSTRATO`.

## MODULI CHE LEGGONO DOPO IL SALVATAGGIO

### `IALibretto` stesso
- Rilegge l’archivio da `storage/@mezzi_aziendali` con `getDoc`.
- Costruisce `archiveGroups` usando solo `librettoUrl`.
- `librettoStoragePath` non viene usato per popolare l’archivio o il viewer.
- `pdfUrl` e sempre `null`, quindi il bottone `Apri PDF` dell’archivio legacy resta disabilitato nel codice letto.
- Query supportate:
- `?archive=1` scrolla alla sezione archivio;
- `?archive=1&targa=<targa>` imposta il filtro archivio;
- `?open=1&url=<url>` apre direttamente il viewer su quell’URL;
- `?open=1&targa=<targa>` cerca in archivio il primo mezzo con `librettoUrl` per quella targa e apre il viewer.
- Il viewer legacy mostra solo `<img>` e non usa fallback da `librettoStoragePath`.

### `DossierMezzo`
- Legge `storage/@mezzi_aziendali` con `getDoc`.
- Costruisce `librettoUrls` con `mezzo.librettoUrl` soltanto.
- Se manca `librettoUrl`, mostra `Nessun libretto associato` e propone:
- `Vai a IA Libretto`;
- `Cerca in Archivio IA`.
- Se `librettoUrl` esiste:
- se l’URL sembra PDF, apre `iframe`/anteprima PDF;
- altrimenti prova a mostrare l’immagine;
- se il load immagine fallisce, offre `Cerca in Archivio IA`.
- `librettoStoragePath` non viene usato come fallback in `DossierMezzo`.

### `IACoperturaLibretti`
- Legge `@mezzi_aziendali` tramite `getItemSync`.
- Considera un libretto presente se esiste `librettoUrl` oppure `librettoStoragePath`.
- Fa probe rete del `librettoUrl` con `HEAD`, fallback `GET`.
- Può intervenire in due modi:
- upload manuale di un nuovo libretto immagine sul mezzo selezionato;
- riparazione da lista ID, costruendo `mezzi_aziendali/<folderId>/libretto.jpg`, salvando `librettoStoragePath` e tentando `getDownloadURL`.
- Nella riparazione/upload reale, aggiorna sia `librettoUrl` sia `librettoStoragePath` e poi riscrive `@mezzi_aziendali`.
- Match mezzo usato in copertura:
- prima `mezzoId`;
- poi `sourceIndex` con verifica targa;
- poi targa normalizzata.

### `ControlloDebug`
- E un sotto-modulo read-only usato dentro `IACoperturaLibretti`.
- Evidenzia in audit i casi:
- `LIBRETTO_SOLO_PATH`;
- `LIBRETTO_URL_SENZA_PATH`;
- `LIBRETTO_MANCANTE`;
- duplicati `id` o `targa`;
- campi mancanti.
- Serve quindi come reader di coerenza del salvataggio libretto, non come viewer operativo.

### `LibrettiExport`
- Legge `@mezzi_aziendali` con `getItemSync`.
- Rende selezionabili solo i mezzi con `Boolean(librettoUrl) === true`.
- Quindi un mezzo con solo `librettoStoragePath` non entra nell’export selezionabile finche non viene riparato o finche non ha un `librettoUrl`.
- Durante la generazione PDF:
- prova prima `row.librettoUrl`;
- se l’URL non e raggiungibile e `librettoStoragePath` esiste, prova `getDownloadURL(ref(storage, row.librettoStoragePath))`;
- se ottiene un URL valido, usa quello per il PDF;
- se non ottiene nulla, quella targa viene saltata.
- Il PDF viene generato da `generateLibrettiPhotosPDFBlob`, che accetta immagini tramite URL o storage path, ma `LibrettiExport` gli passa di fatto l’URL selezionato/riparato.

### `Home` e scadenze
- `Home` non legge `librettoUrl`.
- `Home` non legge `librettoStoragePath`.
- `Home` legge `@mezzi_aziendali` con `getItemSync(MEZZI_KEY)`.
- Le scadenze revisione vengono costruite da:
- `dataScadenzaRevisione` se presente e parseabile;
- altrimenti `calculaProssimaRevisione(dataImmatricolazione, dataUltimoCollaudo)`.
- Quindi l’effetto del salvataggio libretto su `Home` passa solo per i campi data salvati nel record mezzo:
- `dataImmatricolazione`;
- `dataUltimoCollaudo`;
- `dataScadenzaRevisione`.
- Inoltre `Home` ha il proprio writer `handleRevisioneSave` che puo successivamente aggiornare:
- `dataUltimoCollaudo`;
- `dataScadenzaRevisione`;
- `prenotazioneCollaudo`;
- `note`.
- Quindi il dato proveniente dal libretto non e immutabile: puo essere sovrascritto da flussi operativi successivi in Home.

### `Mezzi`
- `Mezzi.tsx` usa lo stesso endpoint `estrazione-libretto` come autofill del form mezzo.
- In questo flusso il backend IA compila campi anagrafici e date, ma `Mezzi.tsx` non scrive `librettoUrl` e non scrive `librettoStoragePath`.
- Quindi `Mezzi` e un consumer parallelo dello stesso servizio esterno, ma non sostituisce il flusso di archiviazione file di `IALibretto`.

## PUNTI NON DIMOSTRATI
- Codice sorgente backend del servizio `https://estrazione-libretto-7bo6jdsreq-uc.a.run.app`.
- Prompt/model/OCR/validatori usati dal backend.
- Contratto completo e stabile di `json.data`.
- Supporto PDF reale nel flusso `IALibretto`.
- Acquisizione camera dedicata oltre al file picker generico.
- Presenza garantita di autenticazione Firebase in tutti i casi reali di upload/download.
- Eventuali retry automatici backend o post-processing lato server.

## RISCHI / FRAGILITA
- `IALibretto` salva il mezzo per sola targa estratta dall’IA, senza selezione manuale del target.
- Se la targa non matcha, crea un nuovo mezzo fallback. Questo puo generare record duplicati o mezzi spurii.
- `IALibretto` non usa un type condiviso del payload. Accetta qualsiasi chiave in `json.data`.
- `IALibretto` richiede solo `results.targa`; gli altri campi possono mancare senza bloccare il salvataggio.
- `archiveGroups` usa solo `librettoUrl`; un record con solo `librettoStoragePath` resta invisibile nell’archivio legacy finche non viene riparato altrove.
- `DossierMezzo` usa solo `librettoUrl`; non ha fallback diretto a `librettoStoragePath`.
- `LibrettiExport` rende selezionabili solo i record con `librettoUrl`; i record `solo path` restano fuori dall’export finche non vengono riparati.
- `setItemSync` intercetta e logga gli errori generici senza rilanciarli. Questo rende fragile il significato del `try/catch` nei caller: un errore `setDoc` puo non propagarsi a `IALibretto` pur lasciando a schermo un esito apparentemente riuscito.
- Il path Storage e sempre `.jpg`, ma il contenuto caricato deriva dal Data URL locale. Con file PNG il contenuto puo non essere realmente JPEG.
- `IALibretto` controlla la presenza della API key Gemini in Firestore, ma la request al backend esterno non passa alcuna API key dal client. La dipendenza reale fra quel check UI e il servizio esterno e `NON DIMOSTRATA`.
- Il viewer legacy accetta anche `?open=1&url=<url>` e apre direttamente quell’URL senza validazione applicativa ulteriore.
- `anno` viene derivato da `dataImmatricolazione.split(".")`; se la data e in formato ISO, l’anno non viene derivato.
- `Home` puo sovrascrivere le date libretto con `handleRevisioneSave`, quindi non esiste tracciamento di provenienza fra dato importato dal libretto e dato aggiornato operativamente.

## VERDETTO FINALE
- Parte ricostruita in modo forte dal repo:
- route legacy e ingressi reali;
- UI legacy di `IALibretto`;
- handler `Analizza` e `Salva`;
- dataset e campi scritti;
- path Storage e compatibilita con `storage.rules`;
- lettori downstream legacy davvero collegati (`IALibretto`, `DossierMezzo`, `IACoperturaLibretti`, `ControlloDebug`, `LibrettiExport`, `Home`, `Mezzi`).
- Parte non chiudibile dal solo repo:
- contratto backend completo del servizio esterno `estrazione-libretto`.
- Verdetto obbligatorio:
- `FLUSSO LIBRETTO MADRE NON ANCORA RICOSTRUITO AL 100%`

SERVE FILE EXTRA: https://estrazione-libretto-7bo6jdsreq-uc.a.run.app (codice sorgente backend non presente nel repo)
