# SPEC ARCHIVISTA PERSISTENZA LIBRETTO — 2026-04-26

## 0. CONTESTO E OBIETTIVO

Questa SPEC definisce l'espansione della persistenza dei campi libretto nel flusso Archivista NEXT, in modo che i campi estratti e mostrati nella review del libretto arrivino nel record mezzo `@mezzi_aziendali` con nomi leggibili dal modal `NextMezzoEditModal`.

Lo scope e limitato alla shape del payload scritto nei path Archivista di archiviazione libretto e all'eventuale allineamento del modal sui nomi campo. Non modifica estrazione IA, UI di review, type `Mezzo`, routing o pattern di persistenza.

## 1. DECISIONI VINCOLANTI

- [✓] D1. I 17 campi da iniziare a persistere sono esattamente quelli del gap primario dell'audit: `nAvs`, `indirizzo`, `localita`, `statoOrigine`, `annotazioni`, `carrozzeria`, `numeroMatricola`, `approvazioneTipo`, `cilindrata`, `potenza`, `pesoVuoto`, `caricoUtileSella`, `pesoTotale`, `pesoTotaleRimorchio`, `caricoSulLetto`, `pesoRimorchiabile`, `luogoDataRilascio`.
- [✓] D2. `cilindrata` e `potenza` restano EDITABILI nel modal. Sono campi standard gia presenti nel type `Mezzo`. Gli altri 15 restano READ-ONLY nel modal come raw libretto fields opzionali.
- [✓] D3. Non modificare il type `Mezzo`. I 15 campi extra restano campi opzionali aggiunti al record raw, non tipizzati nel type `Mezzo`.
- [✓] D4. Nomi campo allineati: usare i nomi camelCase dichiarati nella SPEC del modal. Se Archivista oggi usa nomi diversi nelle estrazioni o nelle trasformazioni interne, aggiungere una mappatura nella scrittura. Non modificare i nomi interni IA: solo i nomi finali nel record persistito.
- [✓] D5. Semantica per tipo veicolo: la SPEC non forza valori non applicabili. Se l'IA estrae stringa vuota o `null` per un campo, il campo va comunque scritto nel record con valore vuoto o `null`. Nessuna logica di skip per valore vuoto sui 17 campi.
- [✓] D6. Path non toccati: `applyArchivistaVehicleUpdate` in `src/next/internal-ai/ArchivistaArchiveClient.ts` resta invariato per gli altri tipi documento.
- [✓] D7. Modal: verifica e allineamento. Se `buildRawLibrettoFields` in `NextMezzoEditModal.tsx` cerca chiavi diverse da quelle della D1, il modal va aggiornato per leggere i nomi corretti. Non va aggiunta nuova UI.
- [✓] D8. Test obbligatorio finale: rieseguire l'archiviazione del libretto di `TI282780`, verificare che il record si popoli dei 15+2 campi nuovi, poi riaprire il modal e verificare che siano visibili negli slot corretti.
- [✓] D9. Backward compatibility: mezzi gia archiviati prima della modifica possono non avere i nuovi campi. Il modal deve continuare a funzionare nascondendo gli slot mancanti. Nessuna migrazione dei record vecchi.
- [✓] D10. Pattern di scrittura invariato: continuare a usare il pattern esistente con `storageSync.setItemSync` sotto deroga clone. Nessuna chiamata diretta a Firebase e nessun cambio al meccanismo di persistenza.

## 2. ARCHITETTURA INTERVENTO

### 2.1 File da modificare

- `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx`
  - Path 1: `buildArchivistaNewVehicleRecord` e `handleArchive`, funzione attuale a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1351` e flusso di creazione a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2216`.
  - Path 2: `buildArchivistaLibrettoVehicleUpdateFields` e `applyArchivistaLibrettoVehicleUpdate`, funzioni attuali a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1417` e `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1493`.
- `src/next/components/NextMezzoEditModal.tsx`
  - Solo per allineare `buildRawLibrettoFields`/render esistente al campo finale `annotazioni`, come indicato nella sezione 6.

### 2.2 File NON da modificare

- `src/pages/Mezzi.tsx`: il type `Mezzo` resta invariato.
- `src/next/internal-ai/NextEstrazioneLibretto.tsx`: la UI review resta invariata; i campi sono gia presenti in `TARGET_FIELDS` a `src/next/internal-ai/NextEstrazioneLibretto.tsx:233`.
- `src/next/internal-ai/ArchivistaArchiveClient.ts`: `applyArchivistaVehicleUpdate` e `buildVehicleFieldUpdates` restano invariati; il path documento generico e a `src/next/internal-ai/ArchivistaArchiveClient.ts:614` e `src/next/internal-ai/ArchivistaArchiveClient.ts:683`.

### 2.3 Scope esplicitamente fuori

- Migrazione dei mezzi gia archiviati.
- Modifiche al payload IA o ai prompt.
- Modifiche al type `Mezzo`.
- Modifiche alla UI di review `NextEstrazioneLibretto`.
- Modifiche a route, menu o writer del modal mezzo.

## 3. MAPPATURA CAMPI

### 3.1 Tabella maestra dei 17 campi

| # | Nome campo finale (record) | Estratto da campo IA | Mostrato nello state UI come | Nome cercato dal modal | Path scrittura | Editable / readonly nel modal | Tipo veicolo applicabile |
|---|---|---|---|---|---|---|---|
| 1 | `nAvs` | `detentoreAfsAvs` / `numeroAvs`, type a `ArchivistaDocumentoMezzoBridge.tsx:144` e `ArchivistaDocumentoMezzoBridge.tsx:146`, alias a `ArchivistaDocumentoMezzoBridge.tsx:1070` | `nAvs`, `NextEstrazioneLibretto.tsx:234` | alias esistente `nAvs` sotto chiave modal `numeroAvs`, `NextMezzoEditModal.tsx:54` | Path 1 + Path 2 | read-only | Tutti i veicoli se il libretto lo riporta |
| 2 | `indirizzo` | `detentoreIndirizzo` / `indirizzo`, normalize a `ArchivistaDocumentoMezzoBridge.tsx:906` | `indirizzo`, `NextEstrazioneLibretto.tsx:236` | `indirizzo`, `NextMezzoEditModal.tsx:56` | Path 1 + Path 2 | read-only | Tutti i veicoli se il libretto lo riporta |
| 3 | `localita` | `detentoreComune` / `comune` / `localita`, normalize a `ArchivistaDocumentoMezzoBridge.tsx:912` | `localita`, `NextEstrazioneLibretto.tsx:237` | `localita`, `NextMezzoEditModal.tsx:57` | Path 1 + Path 2 | read-only | Tutti i veicoli se il libretto lo riporta |
| 4 | `statoOrigine` | `detentoreStatoOrigine`, normalize a `ArchivistaDocumentoMezzoBridge.tsx:911` | `statoOrigine`, `NextEstrazioneLibretto.tsx:238` | `statoOrigine`, `NextMezzoEditModal.tsx:55` | Path 1 + Path 2 | read-only | Tutti i veicoli se il libretto lo riporta |
| 5 | `annotazioni` | `annotazioni` / `note` / `testo`, alias a `ArchivistaDocumentoMezzoBridge.tsx:1100` | `annotazioni`, `NextEstrazioneLibretto.tsx:240` | non allineato oggi: va aggiunto a `RAW_LIBRETTO_ALIASES`; `note` editable esiste ma non e raw read-only | Path 1 + Path 2 | read-only | Tutti i veicoli se il libretto lo riporta |
| 6 | `carrozzeria` | `carrozzeria` / `tipoCarrozzeria`, normalize a `ArchivistaDocumentoMezzoBridge.tsx:941` | `carrozzeria`, `NextEstrazioneLibretto.tsx:246` | `carrozzeria`, `NextMezzoEditModal.tsx:59` | Path 1 + Path 2 | read-only | Veicoli con voce carrozzeria nel libretto |
| 7 | `numeroMatricola` | `numeroMatricola` / `numeroMatricolaTipo`, normalize a `ArchivistaDocumentoMezzoBridge.tsx:970` | `numeroMatricola`, `NextEstrazioneLibretto.tsx:247` | `numeroMatricola`, `NextMezzoEditModal.tsx:60` | Path 1 + Path 2 | read-only | Tutti i veicoli se il libretto lo riporta |
| 8 | `approvazioneTipo` | `approvazioneTipo` / `numeroApprovazioneTipo`, normalize a `ArchivistaDocumentoMezzoBridge.tsx:964` | `approvazioneTipo`, `NextEstrazioneLibretto.tsx:248` | `approvazioneTipo`, `NextMezzoEditModal.tsx:61` | Path 1 + Path 2 | read-only | Tutti i veicoli se il libretto lo riporta |
| 9 | `cilindrata` | `cilindrata` / `cilindrica`, normalize a `ArchivistaDocumentoMezzoBridge.tsx:957` | `cilindrata`, `NextEstrazioneLibretto.tsx:251` | campo standard editable `cilindrata`, `NextMezzoEditModal.tsx:35` | Path 1 + Path 2 | editable | Motrice, trattore, furgone, auto; vuoto/null per semirimorchio se non applicabile |
| 10 | `potenza` | `potenza`, normalize a `ArchivistaDocumentoMezzoBridge.tsx:963` | `potenza`, `NextEstrazioneLibretto.tsx:252` | campo standard editable `potenza`, `NextMezzoEditModal.tsx:36` | Path 1 + Path 2 | editable | Motrice, trattore, furgone, auto; vuoto/null per semirimorchio se non applicabile |
| 11 | `pesoVuoto` | `pesoVuoto` / `tara`, normalize a `ArchivistaDocumentoMezzoBridge.tsx:949` | `pesoVuoto`, `NextEstrazioneLibretto.tsx:253` | `pesoVuoto`, `NextMezzoEditModal.tsx:62` | Path 1 + Path 2 | read-only | Veicoli con peso a vuoto nel libretto |
| 12 | `caricoUtileSella` | `caricoUtile` / `caricoUtileSella`, normalize a `ArchivistaDocumentoMezzoBridge.tsx:952`, alias a `ArchivistaDocumentoMezzoBridge.tsx:1082` | `caricoUtileSella`, `NextEstrazioneLibretto.tsx:254` | `caricoUtileSella`, `NextMezzoEditModal.tsx:63` | Path 1 + Path 2 | read-only | Rimorchi/semirimorchi o veicoli con voce sella nel libretto |
| 13 | `pesoTotale` | `pesoTotale`, normalize a `ArchivistaDocumentoMezzoBridge.tsx:948` | `pesoTotale`, `NextEstrazioneLibretto.tsx:257` | `pesoTotale`, `NextMezzoEditModal.tsx:64` | Path 1 + Path 2 | read-only | Tutti i veicoli se il libretto lo riporta |
| 14 | `pesoTotaleRimorchio` | `pesoTotaleRimorchio` / `pesoConvoglio`, normalize a `ArchivistaDocumentoMezzoBridge.tsx:950` | `pesoTotaleRimorchio`, `NextEstrazioneLibretto.tsx:258` | `pesoTotaleRimorchio`, `NextMezzoEditModal.tsx:65` | Path 1 + Path 2 | read-only | Motrici/trattori o combinazioni con traino; vuoto/null se non applicabile |
| 15 | `caricoSulLetto` | `caricoSulLetto` / `caricoTetto`, normalize a `ArchivistaDocumentoMezzoBridge.tsx:951` | `caricoSulLetto`, `NextEstrazioneLibretto.tsx:261` | `caricoSulLetto`, `NextMezzoEditModal.tsx:66` | Path 1 + Path 2 | read-only | Veicoli con voce specifica nel libretto |
| 16 | `pesoRimorchiabile` | `pesoRimorchiabile` / `caricoRimorchiabile`, normalize a `ArchivistaDocumentoMezzoBridge.tsx:954` | `pesoRimorchiabile`, `NextEstrazioneLibretto.tsx:262` | `pesoRimorchiabile`, `NextMezzoEditModal.tsx:67` | Path 1 + Path 2 | read-only | Veicoli autorizzati a traino; vuoto/null se non applicabile |
| 17 | `luogoDataRilascio` | `luogoRilascio` / `luogoImmatricolazione` / `luogoCollaudo`, alias a `ArchivistaDocumentoMezzoBridge.tsx:1049` e `ArchivistaDocumentoMezzoBridge.tsx:1083` | `luogoDataRilascio`, `NextEstrazioneLibretto.tsx:268` | `luogoDataRilascio`, `NextMezzoEditModal.tsx:68` | Path 1 + Path 2 | read-only | Tutti i veicoli se il libretto lo riporta |

### 3.2 Note sulla semantica per tipo veicolo

- `cilindrata` e `potenza` sono applicabili ai veicoli con motore. Per semirimorchi e rimorchi possono essere stringa vuota o `null`; vanno comunque persistiti come campi presenti.
- I campi peso e carico (`pesoVuoto`, `caricoUtileSella`, `pesoTotale`, `pesoTotaleRimorchio`, `caricoSulLetto`, `pesoRimorchiabile`) dipendono dalle voci effettivamente presenti nel libretto svizzero. La scrittura deve conservare il campo anche se il valore estratto e vuoto.
- I campi amministrativi (`nAvs`, `indirizzo`, `localita`, `statoOrigine`, `annotazioni`, `luogoDataRilascio`) sono indipendenti dal tipo veicolo e vanno scritti quando il flusso archivia un libretto.
- `carrozzeria`, `numeroMatricola` e `approvazioneTipo` seguono la presenza nel libretto; non devono essere inferiti da categoria o tipo mezzo.

### 3.3 Allineamento nomi modal vs record

- Divergenza che richiede modifica modal: `annotazioni`. Il record finale deve usare `annotazioni`, mentre il modal oggi non la include in `RAW_LIBRETTO_ALIASES` e usa `note` come campo standard editabile.
- `nAvs` non richiede modifica per il solo nome finale: il modal legge gia `nAvs` come alias della chiave interna `numeroAvs` a `src/next/components/NextMezzoEditModal.tsx:54`.
- Tutti gli altri 15 campi della D1 hanno nome finale gia leggibile dal modal oppure sono campi standard editabili (`cilindrata`, `potenza`).

## 4. PATCH ARCHIVISTA — PATH 1 (handleArchive)

### 4.1 File:riga della funzione attuale

- Builder nuovo record: `buildArchivistaNewVehicleRecord` in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1351`.
- Creazione nuovo mezzo in `handleArchive`: blocco `newVehicleRecord` a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2275`, scrittura `setItemSync("@mezzi_aziendali", nextVehicles)` a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2285`.
- Aggiornamento post-archiviazione documento sul mezzo appena creato: `refreshedVehicle` a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2329`, scrittura a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2343`.

### 4.2 Cosa scrive oggi

Il nuovo record scrive oggi i campi base e i campi documento: `id`, `targa`, `marca`, `modello`, `marcaModello`, `telaio`, `tipo`, `categoria`, `proprietario`, `assicurazione`, `dataImmatricolazione`, `anno`, `primaImmatricolazione`, `dataUltimoCollaudo`, `dataScadenzaRevisione`, `colore`, `cilindrata`, `potenza`, `massaComplessiva`, `genereVeicolo`, `fotoUrl`, `fotoPath`, `librettoUrl`, `librettoStoragePath`, `note`, `manutenzioneProgrammata`, `manutenzioneDataInizio`, `manutenzioneDataFine`, `manutenzioneKmMax`, `manutenzioneContratto`, `autistaId`, `autistaNome`.

### 4.3 Cosa deve scrivere dopo la modifica

Il nuovo record deve continuare a scrivere tutti i campi attuali e deve aggiungere sempre i 17 campi finali:

`nAvs`, `indirizzo`, `localita`, `statoOrigine`, `annotazioni`, `carrozzeria`, `numeroMatricola`, `approvazioneTipo`, `cilindrata`, `potenza`, `pesoVuoto`, `caricoUtileSella`, `pesoTotale`, `pesoTotaleRimorchio`, `caricoSulLetto`, `pesoRimorchiabile`, `luogoDataRilascio`.

`cilindrata` e `potenza` sono gia presenti nel record attuale, ma la modifica deve garantire che vengano popolati usando la stessa mappatura dei 17 campi e che restino presenti anche se vuoti.

### 4.4 Sorgente dati per ogni nuovo campo

| Campo finale | Sorgente dati da leggere in `analysis` |
|---|---|
| `nAvs` | `nAvs` -> `detentoreAfsAvs` -> `numeroAvs` |
| `indirizzo` | `indirizzo` -> `detentoreIndirizzo` |
| `localita` | `localita` -> `detentoreComune` -> `comune` |
| `statoOrigine` | `statoOrigine` -> `detentoreStatoOrigine` |
| `annotazioni` | `annotazioni` -> `note` -> `testo` |
| `carrozzeria` | `carrozzeria` -> `tipoCarrozzeria` |
| `numeroMatricola` | `numeroMatricola` -> `numeroMatricolaTipo` -> `matricolaTipo` |
| `approvazioneTipo` | `approvazioneTipo` -> `numeroApprovazioneTipo` |
| `cilindrata` | `cilindrata` -> `cilindrica` |
| `potenza` | `potenza` |
| `pesoVuoto` | `pesoVuoto` -> `tara` |
| `caricoUtileSella` | `caricoUtileSella` -> `caricoUtile` |
| `pesoTotale` | `pesoTotale` |
| `pesoTotaleRimorchio` | `pesoTotaleRimorchio` -> `pesoConvoglio` |
| `caricoSulLetto` | `caricoSulLetto` -> `caricoTetto` |
| `pesoRimorchiabile` | `pesoRimorchiabile` -> `caricoRimorchiabile` |
| `luogoDataRilascio` | `luogoDataRilascio` -> `luogoRilascio` -> `luogoImmatricolazione` -> `luogoCollaudo` |

### 4.5 Trattamento valori vuoti/null

Per i 17 campi della D1 il builder deve inserire la chiave nel record anche se il valore sorgente e stringa vuota o `null`. La normalizzazione puo ripulire spazi e formati, ma non puo eliminare la proprieta dal record finale.

## 5. PATCH ARCHIVISTA — PATH 2 (applyArchivistaLibrettoVehicleUpdate)

### 5.1 File:riga della funzione attuale

- Builder campi update libretto: `buildArchivistaLibrettoVehicleUpdateFields` a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1417`.
- Applicazione update libretto esistente: `applyArchivistaLibrettoVehicleUpdate` a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1493`.
- Chiamata dal flusso `handleArchive` per mezzo esistente e documento libretto: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2351`.

### 5.2 Cosa scrive oggi

Il builder update scrive oggi solo candidati base quando il valore e non vuoto e diverso dal record corrente: `targa`, `marca`, `modello`, `telaio`, `proprietario`, `assicurazione`, `dataImmatricolazione`, `dataUltimoCollaudo`, `dataScadenzaRevisione`, `colore`, `categoria`, `genereVeicolo`.

### 5.3 Cosa deve scrivere dopo la modifica

Il path update libretto deve continuare a gestire i campi attuali e deve aggiungere al patch finale i 17 campi della D1:

`nAvs`, `indirizzo`, `localita`, `statoOrigine`, `annotazioni`, `carrozzeria`, `numeroMatricola`, `approvazioneTipo`, `cilindrata`, `potenza`, `pesoVuoto`, `caricoUtileSella`, `pesoTotale`, `pesoTotaleRimorchio`, `caricoSulLetto`, `pesoRimorchiabile`, `luogoDataRilascio`.

Per i 17 campi nuovi non va applicato il filtro attuale "solo se non vuoto". Il patch deve includerli sempre, anche quando il valore e vuoto o `null`.

### 5.4 Sorgente dati per ogni nuovo campo

La sorgente e la stessa della sezione 4.4. Il builder deve leggere dal payload `analysis` normalizzato e dai suoi alias, senza rinominare i campi IA interni. Il nome finale nel record deve essere sempre quello della D1.

### 5.5 Trattamento valori vuoti/null

Per i 17 campi della D1, il confronto con il valore corrente puo determinare se la scrittura e effettivamente necessaria, ma il valore vuoto non e motivo per saltare il campo. Se il campo manca nel record corrente e l'IA fornisce stringa vuota o `null`, il campo deve essere aggiunto al record con quel valore.

## 6. ALLINEAMENTO MODAL (eventuale)

### 6.1 Verifica nomi cercati da buildRawLibrettoFields oggi

`NextMezzoEditModal` definisce `RAW_LIBRETTO_ALIASES` a `src/next/components/NextMezzoEditModal.tsx:53` e `buildRawLibrettoFields` a `src/next/components/NextMezzoEditModal.tsx:140`.

Chiavi gia allineate o coperte da alias:

- `nAvs`: coperto da alias della chiave modal `numeroAvs`, `src/next/components/NextMezzoEditModal.tsx:54`.
- `indirizzo`: `src/next/components/NextMezzoEditModal.tsx:56`.
- `localita`: `src/next/components/NextMezzoEditModal.tsx:57`.
- `statoOrigine`: `src/next/components/NextMezzoEditModal.tsx:55`.
- `carrozzeria`: `src/next/components/NextMezzoEditModal.tsx:59`.
- `numeroMatricola`: `src/next/components/NextMezzoEditModal.tsx:60`.
- `approvazioneTipo`: `src/next/components/NextMezzoEditModal.tsx:61`.
- `pesoVuoto`: `src/next/components/NextMezzoEditModal.tsx:62`.
- `caricoUtileSella`: `src/next/components/NextMezzoEditModal.tsx:63`.
- `pesoTotale`: `src/next/components/NextMezzoEditModal.tsx:64`.
- `pesoTotaleRimorchio`: `src/next/components/NextMezzoEditModal.tsx:65`.
- `caricoSulLetto`: `src/next/components/NextMezzoEditModal.tsx:66`.
- `pesoRimorchiabile`: `src/next/components/NextMezzoEditModal.tsx:67`.
- `luogoDataRilascio`: `src/next/components/NextMezzoEditModal.tsx:68`.
- `cilindrata` e `potenza`: sono campi standard editabili in `EDITABLE_FIELDS`, `src/next/components/NextMezzoEditModal.tsx:35` e `src/next/components/NextMezzoEditModal.tsx:36`.

### 6.2 Se serve modifica al modal: punto/i esatto/i da cambiare

Serve una modifica al modal per `annotazioni`:

- aggiungere `annotazioni` a `RAW_LIBRETTO_ALIASES`, con alias `["annotazioni", "note", "testo"]`;
- allineare lo slot esistente "Annotazioni" della pagina sinistra per leggere il raw field `annotazioni` come read-only quando presente, senza aggiungere nuova UI;
- mantenere la backward compatibility: se un record vecchio non contiene `annotazioni`, il modal non deve rompersi.

### 6.3 Se non serve modifica: dichiarazione

Serve modifica al modal solo per `annotazioni`. Non servono nuove sezioni DOM, nuovi campi visivi o modifiche alla pagina tecnica per gli altri 16 campi della D1.

## 7. TEST DI ACCETTAZIONE

### 7.1 Test funzionale

1. Risalvare il libretto di `TI282780` tramite Archivista NEXT.
2. Verificare in DevTools, usando il dump Firestore gia predisposto, che il record contenga i 17 nuovi campi: `nAvs`, `indirizzo`, `localita`, `statoOrigine`, `annotazioni`, `carrozzeria`, `numeroMatricola`, `approvazioneTipo`, `cilindrata`, `potenza`, `pesoVuoto`, `caricoUtileSella`, `pesoTotale`, `pesoTotaleRimorchio`, `caricoSulLetto`, `pesoRimorchiabile`, `luogoDataRilascio`.
3. Aprire `NextMezzoEditModal` su `TI282780`.
4. Verificare che gli slot del libretto svizzero siano popolati nei rispettivi punti, e che `cilindrata` e `potenza` siano ancora editabili.

### 7.2 Test su nuovo mezzo (motrice/trattore)

1. Archiviare un libretto nuovo di motrice o trattore.
2. Verificare che il record contenga `cilindrata` e `potenza` valorizzate quando il libretto le riporta.
3. Aprire il modal e verificare che `cilindrata` e `potenza` siano editabili e popolate.

### 7.3 Test backward compatibility

1. Aprire un mezzo vecchio archiviato prima della modifica.
2. Verificare che il modal continui a funzionare anche se i 15 raw fields extra mancano.
3. Verificare che gli slot raw mancanti restino nascosti o vuoti secondo il comportamento gia presente di `buildRawLibrettoFields`.

## 8. ORDINE DI IMPLEMENTAZIONE FILE-PER-FILE

1. `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx` — modifica `buildArchivistaNewVehicleRecord` e il path `handleArchive` per la creazione nuovo mezzo.
2. `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx` — modifica `buildArchivistaLibrettoVehicleUpdateFields` e `applyArchivistaLibrettoVehicleUpdate` per l'update libretto su mezzo esistente.
3. `src/next/components/NextMezzoEditModal.tsx` — modifica solo l'allineamento di `annotazioni` descritto nella sezione 6.

## 9. CHECKLIST CHIUSURA

1. Build TypeScript verde.
2. Lint baseline = 0 delta.
3. Grep di sicurezza: nessun import diretto nuovo da Firebase e nessun writer alternativo introdotto.
4. Test funzionale 7.1 passa.
5. Test motrice/trattore 7.2 passa.
6. Test backward compatibility 7.3 passa.

## 10. NOTE FINALI (solo fatti di codice)

- L'audit `docs/audit/AUDIT_ARCHIVISTA_PERSISTENZA_LIBRETTO_2026-04-26.md` identifica 17 campi persi tra review e scrittura.
- Nel codice reale, `applyArchivistaLibrettoVehicleUpdate` e `buildArchivistaLibrettoVehicleUpdateFields` sono in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx`, non in `src/next/internal-ai/ArchivistaArchiveClient.ts`.
- `src/next/internal-ai/ArchivistaArchiveClient.ts` contiene il path documento generico `applyArchivistaVehicleUpdate`; questa SPEC non lo modifica.
- Il modal legge gia la maggior parte dei campi raw tramite alias in `RAW_LIBRETTO_ALIASES`; la divergenza residua rilevata e `annotazioni`.
- I record vecchi non vengono migrati: la nuova shape si applica solo ai libretti archiviati o riarchiviati dopo l'implementazione.
