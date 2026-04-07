# AUDIT TECNICO - Manutenzioni attuale vs spec modulo sostitutivo NEXT

- Data audit: `2026-04-07 10:54 Europe/Rome`
- Modulo: `Manutenzioni`
- Esito: `SPEC PRONTA DA CORREGGERE E POI IMPLEMENTARE`

## Perimetro verificato
- Audit e documentazione soltanto.
- Nessuna patch runtime.
- Verificati codice legacy reale, runtime NEXT ufficiale, domain NEXT collegati e dipendenze dirette/indirette del dataset `@manutenzioni`.

## Nota preliminare sulla spec
- Il prompt indica `docs/specs/NEXT_MANUTENZIONI_MAPPA_STORICO_SPEC.md`.
- Nel repo il file non esiste.
- Il contenuto effettivamente presente e usato per il confronto e `docs/SPEC_MAPPA_STORICO_MANUTENZIONI_NEXT.md`.

## Runtime reale attuale

### Route ufficiali
- Legacy reale: `/manutenzioni` -> `src/pages/Manutenzioni.tsx`
- NEXT ufficiale: `/next/manutenzioni` -> `src/next/NextManutenzioniPage.tsx`
- Route spec proposta ma assente oggi: `/next/manutenzioni/mappa/:targa`

### Stato reale del modulo
- Il modulo legacy `src/pages/Manutenzioni.tsx` e operativo e scrive davvero su:
  - `storage/@manutenzioni`
  - `storage/@inventario`
  - `storage/@materialiconsegnati`
- Il modulo NEXT `src/next/NextManutenzioniPage.tsx` e esplicitamente `read-only`:
  - legge i dati reali;
  - mantiene la UI madre-like;
  - blocca `Salva manutenzione`, `Elimina`, `Esporta PDF` e conferma del modal gomme.
- Quindi oggi `/next/manutenzioni` non e un modulo sostitutivo reale della madre: e un clone operativo solo in lettura.
- Inoltre il boundary `src/utils/cloneWriteBarrier.ts` oggi consente nel clone solo l'eccezione `storageSync.setItemSync("@lavori")` sulle route `Lavori`.
- Quindi una `Manutenzioni` NEXT davvero scrivente non puo essere implementata come writer ufficiale dentro `/next` senza una decisione esplicita sul boundary di scrittura.

## Contratto dati reale verificato

### Persistenza fisica
- La persistenza reale passa da `src/utils/storageSync.ts`.
- `getItemSync(key)` legge `doc(db, "storage", key).data().value`.
- `setItemSync(key, value)` per chiavi diverse da `@mezzi_aziendali` sovrascrive `doc(db, "storage", key)` con `{ value }`.
- Quindi il contratto fisico reale non e una collection business custom: e la collection Firestore `storage` con documenti-chiave `@...`.

### Dataset reali coinvolti
- Storico manutenzioni: `storage/@manutenzioni`
- Anagrafica mezzi e manutenzione programmata: `storage/@mezzi_aziendali`
- Materiali / consegne usati dalle manutenzioni: `storage/@materialiconsegnati`
- Inventario: `storage/@inventario`
- Gomme da flussi autisti: `storage/@cambi_gomme_autisti_tmp`, `storage/@gomme_eventi`
- Rifornimenti: `storage/@rifornimenti`, `storage/@rifornimenti_autisti_tmp`

### Writer reali verificati
- Writer principale modulo legacy: `src/pages/Manutenzioni.tsx`
- Writer secondario verificato su `@manutenzioni`: `src/components/AutistiEventoModal.tsx`
  - importa eventi gomme autisti nello storico manutenzioni creando una voce derivata `CAMBIO GOMME`.

### Reader reali verificati
- Legacy:
  - `src/pages/Manutenzioni.tsx`
  - `src/pages/DossierMezzo.tsx`
  - `src/pages/GestioneOperativa.tsx`
  - `src/pages/GommeEconomiaSection.tsx`
  - `src/pages/Mezzo360.tsx`
- NEXT:
  - `src/next/NextManutenzioniPage.tsx`
  - `src/next/domain/nextManutenzioniDomain.ts`
  - `src/next/domain/nextManutenzioniGommeDomain.ts`
  - `src/next/nextOperativitaTecnicaDomain.ts`
  - `src/next/domain/nextDossierMezzoDomain.ts`
  - `src/next/domain/nextOperativitaGlobaleDomain.ts`
  - `src/next/NextLegacyStorageBoundary.tsx`

### Shape reale del record manutenzione

#### Shape scritta oggi dal writer legacy
- Campi sempre scritti nel path di creazione:
  - `id`
  - `targa`
  - `tipo`
  - `fornitore`
  - `km`
  - `ore`
  - `sottotipo`
  - `descrizione`
  - `eseguito`
  - `data`
  - `materiali`
- Vincoli reali lato form:
  - obbligatori: `targa`, `descrizione`, `data`
  - sempre presente: `tipo`
  - opzionali / nullabili: `km`, `ore`, `sottotipo`, `eseguito`
  - `materiali` e un array, anche vuoto
- Formato data storico legacy atteso dalla UI: stringa `gg mm aaaa`

#### Shape materiali manutenzione
- Ogni materiale dentro `materiali` usa:
  - `id`
  - `label`
  - `quantita`
  - `unita`
  - `fromInventario?`
  - `refId?`

#### Tolleranza reale dei reader NEXT
- `nextManutenzioniDomain.ts` legge shape legacy sporche in formato:
  - `array`
  - `value`
  - `items`
  - `value.items`
- La normalizzazione NEXT tollera anche fallback su:
  - `timestamp`, `createdAt`, `updatedAt` per la data
  - `fornitoreLabel` / `eseguito` come fallback fornitore
- I record senza `targa` leggibile vengono esclusi dai reader mezzo-centrici.

### Comportamenti business reali da preservare
- `Salva` in legacy scrive tutto lo storico su `@manutenzioni`.
- Se la voce non e in modifica:
  - scarica inventario da `@inventario` per i materiali marcati `fromInventario`;
  - prova ad aggiornare `@materialiconsegnati`;
  - crea consegne con `destinatario.type = "MEZZO"` e `motivo = "UTILIZZO MANUTENZIONE"`.
- `Elimina`:
  - ripristina quantita in `@inventario`;
  - rimuove le consegne manutenzione da `@materialiconsegnati`;
  - riscrive `@manutenzioni`.
- `Modifica` legacy:
  - ricarica il record nel form;
  - lo rimuove dallo stato locale;
  - al salvataggio crea una nuova voce;
  - non riallinea inventario o `@materialiconsegnati`.

### Anomalia reale importante da non ignorare
- In `src/pages/Manutenzioni.tsx`, `KEY_MOVIMENTI = "@materialiconsegnati"`.
- Il codice prova a scrivere prima i movimenti `OUT` e subito dopo le consegne sullo stesso identico documento `storage/@materialiconsegnati`.
- Dato che `setItemSync()` su chiavi normali sovrascrive l'intero `value`, l'ultima scrittura e quella effettiva.
- Quindi la semantica reale oggi non e due dataset separati: il path effettivo persistito e quello finale su `@materialiconsegnati`.
- Questo punto va chiarito prima di una riscrittura NEXT reale, altrimenti si rischia di introdurre una doppia semantica nuova non verificata.

## Logica riusabile davvero

### Da manutenzioni
- Riutilizzabile:
  - struttura UI generale di `NextManutenzioniPage.tsx`
  - normalizzazione storico / mezzi di `nextManutenzioniDomain.ts`
  - serializer legacy `readNextManutenzioniLegacyDataset()`
- Non riusabile cosi com'e per un modulo sostitutivo:
  - il blocco read-only di `NextManutenzioniPage.tsx`
  - l'assenza totale di writer business nel layer NEXT
  - l'assenza nel domain NEXT di inventario, consegne materiali e PDF reale

### Da gomme
- Riutilizzabile davvero:
  - `nextManutenzioniGommeDomain.ts` per convergere storico `@manutenzioni` + `@cambi_gomme_autisti_tmp` + `@gomme_eventi`
  - parser prudente dei blocchi `CAMBIO GOMME`
  - dedup prudente fra gomme derivate da manutenzione e gomme da eventi esterni
- Vincolo:
  - il dominio gomme e oggi di sola lettura e non sostituisce il writer legacy del modal gomme.

### Da rifornimenti
- Riutilizzabile davvero:
  - `readNextMezzoRifornimentiSnapshot(targa)` come unica fonte affidabile per il `km` piu recente
  - merge controllato business + feed campo, con `originId` e fallback euristico governato
- Non riusabile in modo ingenuo:
  - leggere `@rifornimenti` raw e ordinare a mano non e sufficiente per ottenere il `km` migliore disponibile.

### Da mezzi
- Riutilizzabile davvero:
  - `nextAnagraficheFlottaDomain.ts` per `targa`, `categoria`, `tipo`, `marca`, `modello`
  - lettura dei campi manutenzione programmata da `@mezzi_aziendali`
- Limite reale:
  - il `tipo` normalizzato dal layer flotta e oggi `motrice | cisterna | null`
  - la spec a 5 categorie (`trattore`, `motrice_2assi`, `motrice_3assi`, `rimorchio`, `semirimorchio`) non e dimostrata 1:1 dal contratto corrente e resta `DA VERIFICARE` sui valori reali di `categoria`.

## Dipendenze collegate reali

### Dossier
- Legacy `src/pages/DossierMezzo.tsx`
  - legge `@manutenzioni` direttamente;
  - mostra liste e modale manutenzioni;
  - usa i campi manutenzione programmata dal record mezzo.
- NEXT `src/next/domain/nextDossierMezzoDomain.ts`
  - integra manutenzioni e gomme tramite `readNextMezzoManutenzioniGommeSnapshot()`.

### Home / hub operativi
- `src/pages/Home.tsx`
  - linka il modulo `Manutenzioni`, ma non legge lo storico manutenzioni.
- `src/pages/GestioneOperativa.tsx`
  - legge `@manutenzioni` per preview.
- `src/next/domain/nextOperativitaGlobaleDomain.ts`
  - integra `@manutenzioni` nello snapshot operativo clone.
- `src/next/NextOperativitaGlobalePage.tsx`
  - mostra preview delle ultime manutenzioni.

### Alert / scadenze
- Legacy `src/pages/CentroControllo.tsx`
- NEXT `src/next/domain/nextCentroControlloDomain.ts` e `src/next/NextCentroControlloParityPage.tsx`
- Dipendono dalla manutenzione programmata in `@mezzi_aziendali`, non da `@manutenzioni`.
- Quindi il nuovo modulo sostitutivo non deve rompere il legame con i campi `manutenzioneProgrammata`, `manutenzioneDataFine`, `manutenzioneKmMax`, `manutenzioneContratto`.

### PDF / report
- PDF diretto reale del modulo legacy:
  - `src/pages/Manutenzioni.tsx` -> `generateSmartPDF("Storico manutenzioni")`
- PDF manutenzioni programmate:
  - `src/pages/CentroControllo.tsx`
  - `src/next/NextCentroControlloParityPage.tsx`
- Dossier PDF:
  - il payload attuale del dossier non include lo storico manutenzioni; il dato e presente in UI ma non nel PDF base del dossier.
- AI / report professionali:
  - `src/next/internal-ai/internalAiProfessionalVehicleReport.ts` consuma `readNextMezzoManutenzioniGommeSnapshot()`.

### Altri moduli impattati
- `src/pages/GommeEconomiaSection.tsx`
- `src/next/NextGommeEconomiaSection.tsx`
- `src/pages/Mezzo360.tsx`
- `src/components/AutistiEventoModal.tsx`
- `src/next/NextLegacyStorageBoundary.tsx`
- `src/next/nextOperativitaTecnicaDomain.ts`

## Confronto spec vs repo

### COMPATIBILE
- Inserire il nuovo blocco come estensione del perimetro `/next/manutenzioni`.
- Riusare i domain NEXT esistenti per lettura storico manutenzioni, gomme, rifornimenti e anagrafica mezzo.
- Tenere le nuove scritture della sola parte visuale separate dai dati business esistenti.
- Far funzionare la vista anche senza foto o hotspot.

### PARZIALMENTE COMPATIBILE
- `TipoMezzo` a 5 categorie:
  - concetto utile;
  - mapping reale dai dati attuali non dimostrato al 100%;
  - serve fallback prudente e verifica sui valori reali di `categoria`.
- `kmUltimo` da rifornimenti:
  - fattibile;
  - ma solo passando da `readNextMezzoRifornimentiSnapshot()`;
  - non e garantito su tutte le righe e puo essere ricostruito dal feed campo.
- `MappaIntervento.costo`, `valuta`, `allegati`:
  - come campi opzionali sono accettabili;
  - non sono garantiti dal contratto manutenzioni attuale;
  - non vanno promessi come disponibili su tutta la base storica.
- Nuove entita `@mezzi_foto_viste` e `@mezzi_hotspot_mapping`:
  - il concetto e compatibile;
  - ma nel repo vanno trattate come documenti `storage/@...` o come nuova struttura dedicata esplicitamente approvata;
  - non come “collection business esistente”.

### NON COMPATIBILE
- La spec, cosi com'e, non basta a rendere `Manutenzioni` un modulo NEXT sostitutivo reale.
- Motivo:
  - la spec copre bene una sottovista nuova `mappa/storico`;
  - ma non copre i writer business reali oggi esistenti nel modulo legacy.
- In particolare la spec non contempla:
  - scrittura vera su `@manutenzioni`
  - scarico/ripristino `@inventario`
  - aggiornamento reale di `@materialiconsegnati`
  - comportamento attuale di modifica/eliminazione
  - import di gomme autisti che genera manutenzioni derivate
- La spec non contempla neppure il blocco architetturale corrente del clone:
  - `src/utils/cloneWriteBarrier.ts` autorizza oggi solo `@lavori`, non `@manutenzioni`.
- Quindi, da sola, la spec e compatibile con un sotto-modulo visivo, non con la sostituzione completa del modulo.
- Anche la route proposta `/next/manutenzioni/mappa/:targa` non esiste oggi e richiederebbe toccare `src/App.tsx`, fuori dal perimetro “solo `src/next/*`” se non viene autorizzato esplicitamente.

## Correzioni obbligatorie alla spec prima dell'implementazione
- Correggere il path del file spec: il file presente nel repo e `docs/SPEC_MAPPA_STORICO_MANUTENZIONI_NEXT.md`.
- Dichiarare esplicitamente che la spec copre un sotto-modulo `mappa/storico`, non tutta la sostituzione del modulo `Manutenzioni`.
- Aggiungere un capitolo separato “Compatibilita business del modulo sostitutivo” con obbligo di preservare:
  - `@manutenzioni`
  - `@inventario`
  - `@materialiconsegnati`
  - import gomme autisti in `@manutenzioni`
- Chiarire che `@materialiconsegnati` oggi ha una semantica legacy ambigua nel writer manutenzioni e che questa ambiguita va risolta per compatibilita, non reinventata.
- Dichiarare che il `kmUltimo` va letto da `readNextMezzoRifornimentiSnapshot()` e non da sorting raw di `@rifornimenti`.
- Rendere `costo`, `valuta`, `allegati` campi opzionali con `DA VERIFICARE`, non garantiti.
- Rendere `TipoMezzo` prudente:
  - introdurre fallback `DA VERIFICARE` o `unknown`;
  - non forzare la classificazione a 5 tipi senza evidenza sui valori reali di `categoria`.
- Correggere la terminologia storage:
  - distinguere fra Firebase Storage file delle foto e metadati Firestore;
  - distinguere fra documenti `storage/@...` e vere collection top-level.
- Dichiarare esplicitamente il boundary di scrittura necessario per la futura versione sostitutiva:
  - o si autorizza un'eccezione condivisa nel guard rail clone;
  - oppure si definisce un nuovo writer NEXT ufficiale approvato, senza bypass silenziosi della barriera.
- Chiarire che una nuova route dedicata richiede anche decisione architetturale su `src/App.tsx`, oggi fuori dal perimetro sicuro classico.
- Aggiungere un vincolo esplicito: il nuovo domain mappa deve importare i domain esistenti e non reimplementare raw reads o matching duplicati.

## Rischi reali

### Rischio perdita dati
- Alto se si sostituisce il modulo legacy solo con la spec mappa/storico:
  - si perderebbero le scritture reali del form manutenzioni.

### Rischio incompatibilita
- Alto se si “ripulisce” il contratto senza preservare:
  - edit legacy senza riallineamento inventario/materiali;
  - voci `CAMBIO GOMME` derivate;
  - semantica effettiva di `@materialiconsegnati`.

### Rischio doppie scritture
- Alto se il nuovo modulo scrive sia i nuovi metadati visivi sia una nuova semantica materiali differente da quella oggi in uso.
- Medio/alto se si introduce una vista scrivente separata senza spegnere il writer legacy del modulo madre.

### Rischio impatto moduli collegati
- Alto su:
  - Dossier
  - Gomme economia
  - Mezzo360
  - AI/report mezzo
  - hub operativita
- Medio su:
  - Centro Controllo e alert, che dipendono soprattutto da `@mezzi_aziendali` ma condividono il lessico manutenzione programmata.

## Punti `DA VERIFICARE`
- Valori reali live di `categoria` in `@mezzi_aziendali` per inferire in modo non fragile `TipoMezzo`.
- Presenza reale e frequenza di `costo`, `valuta`, `allegati` nello storico `@manutenzioni`.
- Ispezione live raw dei documenti Firestore via CLI nel contesto corrente:
  - tentata via endpoint REST pubblico;
  - risposta `403`;
  - quindi il contratto live e verificato qui tramite codice e runtime repository, non tramite dump remoto diretto.

## Decisione finale
- Il nuovo modulo `Manutenzioni` puo diventare un modulo reale NEXT sostitutivo.
- La compatibilita business al `100%` e raggiungibile solo se la fase implementativa preserva i writer e i side effect reali del legacy, non se implementa soltanto la spec attuale della mappa.
- La spec attuale e abbastanza vicina da essere recuperata, ma va corretta prima della patch runtime.
