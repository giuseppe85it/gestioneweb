# AUDIT NEXT LIBRETTO SAVE REAL FLOW - 2026-04-16 18:44

## SCOPO

Audit in sola lettura del flusso `IA Libretto` della NEXT con focus esclusivo su cosa succede dopo il click su `Salva nei documenti del mezzo`.

Fonte primaria del verdetto: codice reale del repository.
I documenti di stato sono stati letti solo come contesto storico e non come prova finale.

## FILE LETTI DAVVERO

- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`
- `src/App.tsx`
- `src/next/NextIALibrettoPage.tsx`
- `src/next/domain/nextIaLibrettoDomain.ts`
- `src/next/domain/nextIaConfigDomain.ts`
- `src/next/NextIACoperturaLibrettiPage.tsx`
- `src/next/NextLibrettiExportPage.tsx`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/NextHomePage.tsx`
- `src/next/domain/nextLibrettiExportDomain.ts`
- `src/next/nextAnagraficheFlottaDomain.ts`
- `src/next/domain/nextDossierMezzoDomain.ts`
- `src/next/domain/nextCentroControlloDomain.ts`
- `src/pages/IA/IALibretto.tsx`
- `src/pages/IA/IACoperturaLibretti.tsx`
- `src/pages/LibrettiExport.tsx`
- `src/pages/DossierMezzo.tsx`
- `src/pages/Home.tsx`
- `src/pages/Mezzi.tsx`
- `src/utils/storageSync.ts`
- `src/utils/cloneWriteBarrier.ts`
- `src/utils/storageWriteOps.ts`
- `src/firebase.ts`
- `storage.rules`

## FATTI CERTI

1. La route NEXT reale esiste ed e separata dalla madre.
   In `src/App.tsx` la pagina legacy `IALibretto` resta su `/ia/libretto`, mentre la NEXT monta `NextIALibrettoPage` sotto `/next/ia/libretto`.

2. In `src/next/NextIALibrettoPage.tsx` oggi non esiste un vero flusso operativo di analisi o salvataggio.
   Le funzioni reali sono `handleAnalyze` e `handleSave`, ma entrambe mostrano messaggi di blocco read-only e non eseguono scritture.

3. In `src/next/NextIALibrettoPage.tsx` non esiste una chiamata reale al servizio `estrazione-libretto`.
   Non c'e `fetch`, non c'e payload verso backend, non c'e parsing della risposta, non c'e stato `results` equivalente alla madre.

4. In `src/next/NextIALibrettoPage.tsx` non esiste una scrittura reale verso `storage/@mezzi_aziendali`.
   Non c'e `setItemSync("@mezzi_aziendali", ...)`, non c'e `setDoc`, non c'e upload Storage, non c'e `getDownloadURL`.

5. Il dominio NEXT di archivio libretti e oggi solo un reader read-only dello storico reale.
   `src/next/domain/nextIaLibrettoDomain.ts` legge il documento Firestore `storage/@mezzi_aziendali`, filtra i mezzi con `librettoUrl` valorizzato e riporta anche `librettoStoragePath` se presente.

6. La madre salva davvero sul dataset reale.
   In `src/pages/IA/IALibretto.tsx` la funzione `handleSave` carica o riusa il file preview, esegue match mezzo per targa, crea un mezzo fallback se necessario, carica il file su Storage, ottiene `getDownloadURL`, aggiorna il record mezzo e poi chiama `setItemSync("@mezzi_aziendali", mezzi)`.

7. Il barrier oggi non apre `IA Libretto` NEXT.
   In `src/utils/cloneWriteBarrier.ts` le eccezioni di scrittura su `@mezzi_aziendali` e sulle scritture Archivista sono riservate a `/next/ia/archivista`, non a `/next/ia/libretto`.

8. Le `storage.rules` del repo oggi consentono scritture autenticate sotto `mezzi_aziendali/**`.
   Il file `storage.rules` contiene `match /mezzi_aziendali/{allPaths=**}` con `allow read, write: if request.auth != null;`.

## PERCORSO SAVE NEXT OGGI

### A. NEXT SAVE ATTIVO O NO

Verdetto puntuale: il save nella NEXT oggi non e operativo.

Fatti dimostrati:

- `src/next/NextIALibrettoPage.tsx` definisce `handleSave`, ma la funzione non salva alcun dato.
- Se `analysisBlocked` e falso, `handleSave` imposta solo il messaggio `Nessun dato valido da salvare.`.
- Se `analysisBlocked` e vero, `handleSave` imposta solo il messaggio `Clone read-only: Salva nei documenti del mezzo resta visibile come nella madre, ma non aggiorna l'archivio mezzi.`.
- Non esistono in `NextIALibrettoPage` flag, env, scope o branch alternativi che attivino davvero upload o scritture.
- Non esistono nel file funzioni reali collegate al bottone `Salva` oltre a `handleSave`.

### B. NEXT ANALYZE ATTIVO O NO

Verdetto puntuale: `Analizza` nella NEXT oggi non chiama il servizio `estrazione-libretto`.

Fatti dimostrati:

- In `src/next/NextIALibrettoPage.tsx`, `handleAnalyze` non esegue `fetch`.
- `handleAnalyze` imposta `analysisBlocked = true` e il messaggio `Clone read-only: Analizza con IA resta visibile come nella madre, ma non invia file al servizio IA.`.
- La madre invece, in `src/pages/IA/IALibretto.tsx`, chiama davvero il servizio esterno `https://estrazione-libretto-7bo6jdsreq-uc.a.run.app` con payload:
  - `base64Image`
  - `mimeType: "image/jpeg"`

### C. PERCORSO DATI DOPO SALVA NELLA NEXT

Percorso reale oggi:

1. L'utente clicca `Analizza`.
2. `handleAnalyze` non produce `results`; produce solo uno stato locale di blocco (`analysisBlocked`) e un messaggio read-only.
3. Il bottone `Salva nei documenti del mezzo` diventa cliccabile solo per simulare la presenza dell'azione nella UI.
4. L'utente clicca `Salva nei documenti del mezzo`.
5. `handleSave` non legge risultati IA reali, non individua alcun mezzo, non crea fallback mezzo, non carica file, non chiama `getDownloadURL`, non scrive Firestore, non aggiorna `@mezzi_aziendali`.

Conclusione tecnica:

- `results`: NON ESISTE nel flusso NEXT attuale.
- match mezzo per targa: NON ESISTE nel flusso NEXT attuale.
- fallback mezzo nuovo: NON ESISTE nel flusso NEXT attuale.
- upload Storage: NON ESISTE nel flusso NEXT attuale.
- `getDownloadURL`: NON ESISTE nel flusso NEXT attuale.
- `setItemSync("@mezzi_aziendali", ...)`: NON ESISTE nel flusso NEXT attuale.
- scritture aggiuntive su altri dataset: NON DIMOSTRATO, perche nel file non ci sono scritture di alcun tipo.

## CONFRONTO NEXT VS MADRE

### Flusso di salvataggio

- Save operativo: `DIVERSO`
  - NEXT: stub read-only in `NextIALibrettoPage.handleSave`.
  - Madre: salvataggio reale in `IALibretto.handleSave`.

- Analyze operativo: `DIVERSO`
  - NEXT: nessuna chiamata backend.
  - Madre: `fetch` reale a `estrazione-libretto`.

- Dataset finale `storage/@mezzi_aziendali`: `DIVERSO`
  - NEXT: nessuna scrittura.
  - Madre: scrittura reale tramite `setItemSync("@mezzi_aziendali", mezzi)`.

- Shape finale scritta: `DIVERSO`
  - NEXT: nessuna shape scritta.
  - Madre: aggiorna il record mezzo con dati estratti e metadati del libretto.

- Path Storage finale `mezzi_aziendali/<mezzoId>/libretto.jpg`: `DIVERSO`
  - NEXT: nessun upload.
  - Madre: upload reale a quel path.

- Campi mezzo aggiornati: `DIVERSO`
  - NEXT: nessun campo aggiornato.
  - Madre: aggiorna almeno `assicurazione`, `dataImmatricolazione`, `dataUltimoCollaudo`, `dataScadenzaRevisione`, `librettoUrl`, `librettoStoragePath`, oltre ad altri campi del mezzo presenti nel mapping.

- Fallback mezzo nuovo: `DIVERSO`
  - NEXT: non esiste.
  - Madre: esiste, con creazione di un nuovo mezzo se il match per targa fallisce.

- Ordine operazioni: `DIVERSO`
  - NEXT: nessuna pipeline dati.
  - Madre: match mezzo -> eventuale fallback mezzo -> upload file -> `getDownloadURL` -> update record mezzo -> `setItemSync("@mezzi_aziendali", mezzi)`.

### Moduli downstream che leggono dopo

- `DossierMezzo`: `UGUALE`
  - Madre e NEXT leggono il libretto dal record mezzo tramite `librettoUrl`.
  - Non emerge nel perimetro letto un fallback da `librettoStoragePath` dentro `DossierMezzo`.

- `LibrettiExport`: `UGUALE`
  - Madre e NEXT leggono da `@mezzi_aziendali` i mezzi con `librettoUrl`.
  - Nel layer NEXT esiste anche il supporto al fallback tramite `librettoStoragePath` dentro `nextLibrettiExportDomain.ts`, coerente con il comportamento gia presente nel perimetro legacy letto.

- `IACoperturaLibretti`: `DIVERSO`
  - Sul lato lettura dei campi `librettoUrl` e `librettoStoragePath` il dataset atteso coincide.
  - Sul lato azioni operative la NEXT resta read-only, mentre il modulo legacy espone operazioni reali sul dataset.

- `Home`: `UGUALE`
  - Madre e NEXT basano revisione/collaudo/scadenze sui campi mezzo `dataUltimoCollaudo` e `dataScadenzaRevisione`.
  - La differenza non e nel reader, ma nel fatto che la NEXT `IA Libretto` oggi non alimenta quei campi.

## BARRIER / STORAGE / FIRESTORE

### cloneWriteBarrier.ts

Fatti dimostrati:

- `src/utils/cloneWriteBarrier.ts` contiene eccezioni attive per `@mezzi_aziendali` solo nel perimetro `/next/ia/archivista`.
- `src/utils/cloneWriteBarrier.ts` considera `estrazione-libretto-` come endpoint sensibile e abilita le eccezioni IA interna solo per `/next/ia/interna` e `/next/ia/archivista`.
- `src/utils/cloneWriteBarrier.ts` non apre `/next/ia/libretto` ne per `estrazione-libretto`, ne per `setItemSync("@mezzi_aziendali")`, ne per upload documentali sul path del libretto mezzo.

Conclusione barrier:

- `@mezzi_aziendali` oggi resta bloccato per `IA Libretto` NEXT: `SI`
- upload su `mezzi_aziendali/<mezzoId>/libretto.jpg` oggi resta bloccato a livello di policy clone se si usa il layer protetto: `SI`
- eccezioni gia aperte per `/next/ia/libretto`: `NO`

Nota tecnica dimostrata dal codice:

- `src/utils/storageWriteOps.ts` protegge sia `uploadBytes` sia `uploadString` con `assertCloneWriteAllowed`.
- Le eccezioni presenti in `cloneWriteBarrier.ts` menzionano esplicitamente il caso `storage.uploadBytes`, ma non aprono `/next/ia/libretto`.
- Quindi, anche ipotizzando l'introduzione di un save reale nella NEXT, il percorso protetto del clone oggi non e allineato per questo modulo.

### storage.rules

Fatti dimostrati:

- `storage.rules` consente `read, write` autenticati su `mezzi_aziendali/**`.
- `storage.rules` non e oggi un deny-all su quel path.

Conclusione Storage:

- Se il codice NEXT provasse a salvare su `mezzi_aziendali/<mezzoId>/libretto.jpg`, la regola Storage del repo non sarebbe il blocco principale.
- Il blocco principale, nel perimetro letto, resta il fatto che `NextIALibrettoPage` non salva e che `cloneWriteBarrier.ts` non apre il modulo `/next/ia/libretto`.

## MODIFICHE REALI CHE SMENTISCONO I DOCUMENTI

### Smentite trovate

- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md` riporta ancora una situazione di `storage.rules` deny-all.
- Il codice reale del repo oggi la smentisce:
  - `storage.rules` contiene `match /mezzi_aziendali/{allPaths=**}`
  - `storage.rules` contiene `allow read, write: if request.auth != null;`

### Smentite non trovate

- Non emerge dal codice reale alcuna riattivazione nascosta del save NEXT su `/next/ia/libretto`.
- Non emerge dal codice reale alcuna riattivazione nascosta della chiamata NEXT a `estrazione-libretto`.
- Su questi punti i documenti che descrivono il modulo come read-only non risultano smentiti dal codice attuale.

## VERDETTO FINALE

Risposta netta alla domanda operativa:

`SE OGGI SBLOCCASSIMO IL BOTTONE SALVA NELLA NEXT, IL FLUSSO DATI SEGUIREBBE GIA LO STESSO PERCORSO DELLA MADRE OPPURE NO?`

`NO, NON ALLINEATO ALLA MADRE`

Motivo dimostrato dal codice:

- la NEXT oggi non possiede la pipeline dati della madre;
- il modulo non genera `results` reali;
- il modulo non fa match mezzo;
- il modulo non crea fallback mezzo;
- il modulo non carica il file su `mezzi_aziendali/<mezzoId>/libretto.jpg`;
- il modulo non ottiene `getDownloadURL`;
- il modulo non aggiorna il record mezzo;
- il modulo non chiama `setItemSync("@mezzi_aziendali", mezzi)`;
- il barrier del clone non apre il percorso `/next/ia/libretto` per questo flusso.

## ALLINEAMENTO OBBLIGATORIO CONSIGLIATO

Per far si che la NEXT salvi esattamente come la madre, dal codice attuale manca in modo dimostrabile tutto il seguente allineamento:

1. Analisi reale
   - Introdurre nella NEXT una chiamata reale a `estrazione-libretto` equivalente a quella della madre.
   - Usare un output reale che produca un oggetto `results` consumabile dal salvataggio.

2. Match mezzo
   - Introdurre nella NEXT il match per targa normalizzata sul dataset reale `storage/@mezzi_aziendali`.

3. Fallback mezzo
   - Replicare nella NEXT la creazione del mezzo fallback quando il match per targa fallisce.

4. Upload file
   - Salvare il file sullo stesso path della madre: `mezzi_aziendali/<mezzoId>/libretto.jpg`.

5. URL pubblico
   - Eseguire `getDownloadURL` dopo l'upload e valorizzare sia `librettoUrl` sia `librettoStoragePath`.

6. Record mezzo
   - Aggiornare almeno i campi minimi richiesti:
     - `assicurazione`
     - `dataImmatricolazione`
     - `dataUltimoCollaudo`
     - `dataScadenzaRevisione`
     - `librettoUrl`
     - `librettoStoragePath`

7. Dataset finale
   - Chiudere il flusso con `setItemSync("@mezzi_aziendali", mezzi)` sul dataset finale `storage/@mezzi_aziendali`.

8. Ordine logico
   - Rispettare lo stesso ordine logico della madre:
     - match mezzo
     - eventuale fallback mezzo
     - upload file
     - `getDownloadURL`
     - update record mezzo
     - `setItemSync("@mezzi_aziendali", mezzi)`

9. Barrier clone
   - Allineare `cloneWriteBarrier.ts` per `/next/ia/libretto`, altrimenti il modulo restera non operativo anche dopo l'introduzione del codice di save.

## EVENTUALI FILE EXTRA

NESSUNO
