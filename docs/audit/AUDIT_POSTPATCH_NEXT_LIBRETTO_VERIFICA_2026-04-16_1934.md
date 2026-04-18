# AUDIT POST-PATCH NEXT LIBRETTO VERIFICA - 2026-04-16 19:34

## SCOPO

Audit post-patch in sola lettura del modulo `/next/ia/libretto` per verificare dal codice reale del repo e, dove possibile, dal runtime browser, se la patch ha davvero allineato la NEXT alla madre sul flusso di estrazione e salvataggio del libretto.

Fonte primaria del verdetto: codice reale del repository.
I report esecutivi e continuity report non sono usati come prova finale.

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

## VERIFICA ANALYZE

### Verifica dal codice

- `handleAnalyze` esiste davvero ed e operativo: `SI`
  - Prova: `src/next/NextIALibrettoPage.tsx:200`.

- chiama davvero `https://estrazione-libretto-7bo6jdsreq-uc.a.run.app`: `SI`
  - Prova: `src/next/NextIALibrettoPage.tsx:225`.

- usa davvero payload uguale alla madre (`base64Image`, `mimeType: "image/jpeg"`): `SI`
  - Prova NEXT: `src/next/NextIALibrettoPage.tsx:229-230`.
  - Prova madre: `src/pages/IA/IALibretto.tsx:231-232`.

- gestisce davvero la risposta e produce risultati reali: `SI`
  - Prova: controllo `json.success` e `setResults(json.data ?? {})` in `src/next/NextIALibrettoPage.tsx:245` e `:249`.
  - I risultati vengono poi renderizzati come campi editabili in `src/next/NextIALibrettoPage.tsx:587-597`.

- e rimasto un branch read-only nascosto: `NO`
  - Nel file non risultano piu messaggi o branch di blocco read-only per `handleAnalyze`.

### Verifica runtime browser

Esito browser su `http://127.0.0.1:4174/next/ia/libretto`:

- caricamento file: riuscito
- click `Analizza`: eseguito
- risultato reale: `NO`
- motivo: il runtime mostra `CloneWriteBlockedError: [CLONE_NO_WRITE] Tentativo bloccato nel clone: fetch.runtime`

Prove runtime:

- console browser: errore `CloneWriteBlockedError` su `fetch.runtime`
- network browser: nessuna `POST` reale partita verso `estrazione-libretto`

Conclusione secca su `Analyze`:

- dal codice applicativo della pagina: allineato
- nel runtime reale del clone: non operativo

## VERIFICA SAVE

### Verifica dal codice

- `handleSave` esiste davvero ed e operativo: `SI`
  - Prova: `src/next/NextIALibrettoPage.tsx:262`.

- usa davvero i risultati analizzati: `SI`
  - Prova: guardia su `results` e `results.targa` in `src/next/NextIALibrettoPage.tsx:263-264`, piu mapping campi da `results` in `:384-401`.

- fa match mezzo per targa normalizzata: `SI`
  - Prova: `normalizeTargaKey` definita in `src/next/NextIALibrettoPage.tsx:19`, usata nel `findIndex` in `:302`.

- crea davvero fallback mezzo se non trova il match: `SI`
  - Prova: ramo `else` con creazione nuovo mezzo in `src/next/NextIALibrettoPage.tsx:324-357`.

- carica davvero il file su `mezzi_aziendali/<mezzoId>/libretto.jpg`: `SI`
  - Prova: path in `src/next/NextIALibrettoPage.tsx:423`, `uploadString` in `:426`.

- chiama davvero `getDownloadURL`: `SI`
  - Prova: `src/next/NextIALibrettoPage.tsx:427`.

- aggiorna davvero il record mezzo: `SI`
  - Prova: mapping `mappaCampi` in `src/next/NextIALibrettoPage.tsx:384-401`, derivati `marcaModello` e `anno` in `:408-416`, assegnazione `mezzi[index] = mezzo` in `:450`.

- chiude davvero con `setItemSync("@mezzi_aziendali", mezzi)`: `SI`
  - Prova: `src/next/NextIALibrettoPage.tsx:465`.

### Verifica runtime browser

Il save end-to-end non e stato completato, perche il flusso browser si interrompe prima su `Analizza`.

Conclusione secca su `Save`:

- dal codice applicativo della pagina: allineato
- end-to-end browser completo: `NON DIMOSTRATO`

## VERIFICA CAMPI ALLINEATI

- `assicurazione`: `UGUALE ALLA MADRE`
  - NEXT: `src/next/NextIALibrettoPage.tsx:391`
  - Madre: `src/pages/IA/IALibretto.tsx:399`

- `dataImmatricolazione`: `UGUALE ALLA MADRE`
  - NEXT: `src/next/NextIALibrettoPage.tsx:392`
  - Madre: `src/pages/IA/IALibretto.tsx:401`

- `dataUltimoCollaudo`: `UGUALE ALLA MADRE`
  - NEXT: `src/next/NextIALibrettoPage.tsx:393`
  - Madre: `src/pages/IA/IALibretto.tsx:402`

- `dataScadenzaRevisione`: `UGUALE ALLA MADRE`
  - NEXT: `src/next/NextIALibrettoPage.tsx:394`
  - Madre: `src/pages/IA/IALibretto.tsx:404`

- `librettoUrl`: `UGUALE ALLA MADRE`
  - NEXT: assegnato dopo `getDownloadURL` in `src/next/NextIALibrettoPage.tsx:427-429`
  - Madre: `src/pages/IA/IALibretto.tsx:438-439`

- `librettoStoragePath`: `UGUALE ALLA MADRE`
  - NEXT: `src/next/NextIALibrettoPage.tsx:429-430`
  - Madre: `src/pages/IA/IALibretto.tsx:440`

## VERIFICA BARRIER

### Configurazione dichiarata nel codice

- path modulo NEXT: `src/utils/cloneWriteBarrier.ts:47`
- endpoint autorizzato dichiarato: `src/utils/cloneWriteBarrier.ts:48-49`
- dataset autorizzato: `src/utils/cloneWriteBarrier.ts:50`
- prefisso Storage autorizzato: `src/utils/cloneWriteBarrier.ts:51`
- check analyze dedicato: `src/utils/cloneWriteBarrier.ts:180-186`
- apertura `fetch.runtime`: `src/utils/cloneWriteBarrier.ts:236-238`
- apertura `storage.uploadString`: `src/utils/cloneWriteBarrier.ts:243-248`
- apertura `storageSync.setItemSync`: `src/utils/cloneWriteBarrier.ts:251-252`

### Verifica logica reale

Verdetto barrier: `NON SUFFICIENTE`

Motivo dimostrato:

1. Il barrier vuole autorizzare l'endpoint `estrazione-libretto` solo se
   - pathname corrente e `/next/ia/libretto`
   - metodo e `POST`
   - `${parsed.origin}${parsed.pathname}` e uguale alla costante `IA_LIBRETTO_ANALYZE_ENDPOINT`

2. La costante salvata nel barrier e:
   - `https://estrazione-libretto-7bo6jdsreq-uc.a.run.app`
   - Prova: `src/utils/cloneWriteBarrier.ts:48-49`

3. Il parsing reale di quell'URL produce invece:
   - `https://estrazione-libretto-7bo6jdsreq-uc.a.run.app/`
   - Prova meccanica eseguita davvero con `node -e`: output `https://estrazione-libretto-7bo6jdsreq-uc.a.run.app/`

4. Quindi il confronto del barrier in `src/utils/cloneWriteBarrier.ts:186` fallisce e il fetch viene bloccato.

5. La prova browser conferma il blocco reale:
   - click `Analizza`
   - warning `[CLONE_NO_WRITE] Tentativo bloccato nel clone: fetch.runtime`
   - nessuna `POST` partita verso `estrazione-libretto`

### Aperture inutili o troppo larghe

- Non risultano aperture su dataset extra oltre `@mezzi_aziendali`.
- Non risultano aperture su path modulo extra oltre `/next/ia/libretto`.
- Non risultano aperture fetch extra oltre l'endpoint dedicato.
- Non risultano aperture Firestore/Storage extra fuori dal caso libretto.

Conclusione:

- il perimetro e stretto
- ma oggi non e sufficiente a far passare davvero `Analyze`

## VERIFICA DOWNSTREAM

- `NextDossierMezzoPage` / dominio dossier: `COERENTE`
  - Prova: legge `librettoUrl` dal record mezzo in `src/next/NextDossierMezzoPage.tsx:315`.
  - La patch scrive `librettoUrl` sullo stesso dataset finale della madre.

- `NextLibrettiExportPage` / dominio export: `COERENTE`
  - Prova: `src/next/domain/nextLibrettiExportDomain.ts:168-184` usa `librettoUrl` e fallback `librettoStoragePath`.
  - La patch scrive entrambi i campi con lo stesso path Storage della madre.

- `NextIACoperturaLibrettiPage`: `COERENTE`
  - Prova: legge `librettoUrl` e `librettoStoragePath` in `src/next/NextIACoperturaLibrettiPage.tsx:86-110`.
  - La patch mantiene esattamente questi due campi.

- `NextHomePage` / dominio centro controllo: `COERENTE`
  - Prova: `src/next/domain/nextCentroControlloDomain.ts:610-611` usa `dataUltimoCollaudo` e `dataScadenzaRevisione`.
  - La patch aggiorna entrambi i campi con la stessa mappatura della madre.

## CONFRONTO NEXT VS MADRE

- analyze: `DIVERSO`
  - Codice pagina allineato, ma runtime reale ancora bloccato dal barrier.

- save: `UGUALE`
  - Il codice di `handleSave` replica la pipeline pratica della madre.

- dataset finale: `UGUALE`
  - Madre e NEXT chiudono su `setItemSync("@mezzi_aziendali", mezzi)`.

- path Storage: `UGUALE`
  - Madre e NEXT usano `mezzi_aziendali/<mezzoId>/libretto.jpg`.

- campi scritti: `UGUALE`
  - I campi chiave richiesti risultano mappati come nella madre.

- fallback mezzo: `UGUALE`
  - Esiste il ramo di creazione nuovo mezzo quando il match per targa fallisce.

- ordine operazioni: `UGUALE`
  - match mezzo -> eventuale fallback -> upload -> `getDownloadURL` -> update record -> `setItemSync`

- compatibilita downstream: `UGUALE`
  - I reader NEXT downstream leggono ancora gli stessi campi e lo stesso dataset attesi.

## VERIFICHE TECNICHE

Eseguite davvero in questo audit:

- `npx eslint src/next/NextIALibrettoPage.tsx src/utils/cloneWriteBarrier.ts`
  - esito: `OK`
  - nota: warning stdout non bloccante su `baseline-browser-mapping`

- eslint aggiuntivi sui file runtime realmente toccati dalla patch
  - nessuno ulteriore necessario

- `npm run build`
  - esito: `OK`
  - note non bloccanti: warning Vite preesistenti su chunk size e import dinamici `jspdf`

## EVENTUALE PROVA BROWSER

Prova browser: `ESEGUITA`

Contesto:

- preview locale avviata su `http://127.0.0.1:4174`
- pagina testata: `/next/ia/libretto`
- file caricato: immagine di test locale derivata da `docs/ui-capture/ia_pages_20260412_001915/20_legacy_ia_libretto_viewer.png`

Passi eseguiti:

1. apertura pagina `/next/ia/libretto`
2. upload file riuscito
3. anteprima visibile
4. click `Analizza con IA`

Esito:

- `Analizza` non completa il flusso
- compare errore UI: `[CLONE_NO_WRITE] Tentativo bloccato nel clone: fetch.runtime`
- in console compare `CloneWriteBlockedError`
- in network non parte la richiesta a `estrazione-libretto`
- `Salva nei documenti del mezzo` non e quindi testabile end-to-end sullo stesso flusso browser

Conclusione prova browser:

- barrier runtime ancora bloccante su `Analyze`
- flusso end-to-end non completato

## VERDETTO FINALE

`PATCH NEXT LIBRETTO NON ALLINEATA ALLA MADRE`

Motivo decisivo:

- il codice di `handleSave` e del dataset finale e allineato alla madre;
- ma nel runtime reale del clone `Analyze` viene ancora bloccato dal barrier, quindi il modulo `/next/ia/libretto` non replica ancora il comportamento pratico completo della madre.
