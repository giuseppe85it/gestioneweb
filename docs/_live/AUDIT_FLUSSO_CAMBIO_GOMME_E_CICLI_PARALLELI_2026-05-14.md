# AUDIT FLUSSO CAMBIO GOMME + CICLI PARALLELI DAFARE/ESEGUITA

> Generato 2026-05-14 al termine del PROMPT 31.
> Scopo: mappare il problema "chiusura ciclo segnalazione -> manutenzione eseguita" che l'app autista genera per cambio gomme e altri scenari predefiniti.
> Questo audit NON propone soluzioni. Solo mappa.
> Esito: **PARZIALE** — la mappatura del codice e' completa; le DISCOVERY F e I (conteggi su Firestore reale) NON sono state eseguite perche' il boundary `internal-ai-firebase-readonly-boundary.js` e' un modulo di configurazione/accesso, non un endpoint interrogabile da questo ambiente di audit. Vedi sezione 3.2.

---

## 0. Metodo e perimetro

- Zero modifiche al codice. Zero scritture Firestore. Zero script eseguiti.
- Unico file creato: questo documento.
- `src/pages/` NON letto in dettaglio (solo `ls` per DISCOVERY H).
- Ogni claim sotto e' ancorato a `file:riga` reale.

---

## OUTPUT COMANDI DIAGNOSTICI (1-19) — sintesi letterale rilevante

**DISCOVERY A (cambio gomme nel codice)** — 85 file in `src/`, 3 in `backend/` contengono `gomme/pneumatici/tires`. Collection Firestore dedicate trovate (comando 3):
- `@cambi_gomme_autisti_tmp` — costante `KEY_GOMME_TMP` in 12+ file
- `@gomme_eventi` — costante `KEY_GOMME_EVENTI`
Riferimenti chiave:
- `src/autistiInbox/AutistiAdmin.tsx:38-39` (madre) — `@cambi_gomme_autisti_tmp`, `@gomme_eventi`
- `src/components/AutistiEventoModal.tsx:40-41` (madre)
- `src/next/autistiInbox/NextAutistiAdminNative.tsx:41-42`
- `src/next/domain/nextManutenzioniGommeDomain.ts:17-18`
- `src/utils/cloneWriteBarrier.ts:133-134` (entrambe nel barrier)
- `src/next/nextMezzoHardDeleteWriter.ts:13-14`

**DISCOVERY B (reader/writer gomme)** — nessun writer `@manutenzioni` per le gomme. Reader unico: `readNextMezzoManutenzioniGommeSnapshot` (`src/next/domain/nextManutenzioniGommeDomain.ts:1460`). Consumatori: `NextManutenzioniPage.tsx:33`, `nextDossierMezzoDomain.ts:33-34,785`, `nextMappaStoricoDomain.ts:7,523`, `NextGommeEconomiaSection.tsx:14,57`, `internalAiProfessionalVehicleReport.ts:11-13,950`.

**DISCOVERY C/G (sezione gomme dossier)** — `src/next/NextDossierGommePage.tsx` (43 righe) -> rende `NextGommeEconomiaSection`. Nel dossier mezzo: cards dedicate (vedi 1.4).

**DISCOVERY D (import autisti-inbox)** — handler import gomme: `NextAutistiAdminNative.tsx:1606 importGommeRecord(record)`, bottone a `:2778`. Import segnalazione/controllo: `createManutenzioneDaFareAdminFromSegnalazione` (`:1501`), `createManutenzioneDaFareAdminFromControllo` (`:1540`), bottoni a `:2537` e `:2663`.

**DISCOVERY E (cicli paralleli)** — comando 10 NON trova alcun file/flusso dedicato per `controlloOlio|cambioFiltri|controlloFreni|controlloPneumatici|tagliando` come scenario predefinito autista. Unici hit `tagliando`: sottotipo UI in `NextManutenzioniPage.tsx:53-54,132,720,1904-1905,2790-2791,3003-3008` (campo di un record `@manutenzioni`, non un flusso autista). Comando 11 (`ScenarioPredefinito|EventoPredefinito|TipoEventoAutista|driverEventType`): **No matches found**.

**DISCOVERY F (collection Firestore)** — vedi sezione 3.2 e Appendice A. Letto il registro statico del boundary, NON eseguite query live.

**DISCOVERY H** — `ls src/pages/` conferma che la madre legacy vive in `src/pages/` (`DossierGomme.tsx`, `ModalGomme.tsx`, `Manutenzioni.tsx`, `Mezzo360.tsx`, `Autista360.tsx`, `LavoriDaEseguire.tsx`, ecc.). Non letto in dettaglio.

**DISCOVERY I** — NON eseguibile (nessun accesso Firestore live). Vedi 3.2.

---

## ANALISI FILE LETTI INTEGRALMENTE

### `src/next/writers/nextManutenzioneDaFareCreateWriter.ts` (381 righe)
Writer unico che crea record `daFare` in `@manutenzioni`. Espone `createManutenzioneDaFareFromEvento`, `createManutenzioneDaFareFromSegnalazione`, `createManutenzioneDaFareFromControllo`. `buildManutenzioneDaFareRecord` (`:99`) costruisce un record con `stato:"daFare"`, `origineTipo`, `origineRefId`, `origineRefKey`, `urgenza`, `segnalatoDa`. Dopo l'append a `@manutenzioni`, `patchSegnalazione`/`patchControllo` (`:132`,`:153`) scrivono `linkedLavoroId`/`linkedLavoroIds` sul record sorgente (decisione J.7, nome invariato). Guardia `hasLinkedLavoro` (`:94`) blocca la doppia creazione **dalla stessa segnalazione/controllo**. **Non esiste alcun ramo "gomme", ne' alcun parametro "completa una daFare esistente".** Scrittura protetta dal clone write barrier (scope `centro_controllo_manutenzione_dafare_create_write`).

### `src/next/autistiInbox/NextAutistiAdminNative.tsx` (estratti `:1501-1621`, `:2537-2778`)
Pagina admin inbox NEXT. `importGommeRecord` (`:1606-1621`): legge `@gomme_eventi`, vi appende il record gomme ripulito da `letta`/`stato`, poi `updateGommeRecord` (`:1587`) marca il record TMP con `stato:"importato", letta:true`. **`importGommeRecord` NON tocca mai `@manutenzioni`.** Per contro `createManutenzioneDaFareAdminFromSegnalazione/Controllo` (`:1501`,`:1540`) invocano il writer daFare e scrivono in `@manutenzioni`. I due percorsi sono completamente separati e non si incontrano.

### `src/next/components/NextHomeAutistiEventoModal.tsx` (1140 righe; estratti `:499-608`, `:920-1008`)
Modale di dettaglio evento autista. `canCreateManutenzioneDaFare` (`:501-506`) e' `true` **solo** per `event.tipo === "segnalazione" || "controllo"` e solo se `!hasLinkedLavoro(payload)`. `handleSubmitCreateManutenzione` (`:533`) esce subito se il tipo non e' segnalazione/controllo (`:535`). Per `isGomme` (`:598`) c'e' un bottone "IMPORTA IN DOSSIER" (`:934-950`) che nel clone NEXT e' **bloccato** (`handleImportDossierBlocked` -> "Importazione in dossier disponibile solo nella madre. Il clone e read-only."). Conclusione: dal modale evento del clone NEXT, un evento gomme **non puo'** generare ne' chiudere una manutenzione.

### `src/next/components/NextAutistiEventoModal.tsx` (31 righe)
Wrapper sottile: rende `NextHomeAutistiEventoModal` con `editable` e inoltra `onCreateManutenzioneDaFare`. Nessuna logica gomme propria.

### `src/next/autistiInbox/NextAutistiInboxHomeNative.tsx` (966 righe; estratti `:46-202`, `:790-962`)
Home inbox autisti NEXT. Gli eventi sono partizionati per `e.tipo`: `segnalazione` (`:141`), `controllo` (`:145`), `gomme` (`:156-161`). La card "GOMME" (`:807-864`) e' visivamente distinta: sottotitolo "Cambio / Rotazione", badge rosso "NUOVE {n}" (`:812-826`), righe preview `time - targa - tipo - KM`. `EventModalComponent` (`:950`) riceve `onAfterGommeImport` (ricarica eventi) e `onCreateManutenzioneDaFare` (`handleCreateManutenzioneDaFare`). Quindi la inbox **distingue** gomme da segnalazione/controllo gia' a livello di tipizzazione evento.

### `src/next/NextDossierMezzoPage.tsx` (595 righe; estratto `:535-595`)
Dossier mezzo NEXT. Card "Manutenzioni" (`:551-555`) con due liste "Da fare" / "Eseguite" da `legacy.lavoriInAttesa` / `legacy.lavoriEseguiti`. Card "Storico manutenzioni" (`:557`). Card "Stato gomme per asse" (`:559`, `legacy.gommePerAsse`). Card "Eventi gomme straordinari" (`:561`, `legacy.gommeStraordinarie`). Bottone "Gomme" (`:535`) -> `NextDossierGommePage`. Le sezioni gomme sono alimentate dal reader convergente (sotto), distinte dalla card "Manutenzioni" daFare/eseguite.

### `src/next/domain/nextManutenzioniGommeDomain.ts` (1563 righe; estratti `:1-117`, `:935-957`, `:1378-1428`, `:1460-1554`)
Layer di **convergenza in sola lettura**. `readNextMezzoManutenzioniGommeSnapshot(targa)` (`:1460`) legge in parallelo 3 sorgenti: `@manutenzioni` (via `readNextMezzoManutenzioniSnapshot`), `@cambi_gomme_autisti_tmp`, `@gomme_eventi`. Costruisce `maintenanceDerivedGommeItems` (gomme estratte dai record `@manutenzioni`) + `externalItems` (da TMP + eventi). `dedupeExternalTyreItems` (`:1378`) deduplica TMP vs eventi per `sourceRecordId`. `dedupeExternalAgainstMaintenance` (`:1406`) elimina gli eventi gomme esterni la cui **firma** coincide con un item derivato da manutenzione. La firma `buildTyreDedupSignature` (`:935`) = `targa + giorno + asseLabel + marca + km + typeLabel`; se manca anche solo uno tra `dayKey/asseLabel/marca/km` la firma e' `null` e **non deduplica**. Nessuna scrittura, nessuna nozione di `daFare`.

### `src/next/domain/nextManutenzioniDomain.ts` (estratti via grep)
Definisce `NextManutenzioneStato = "daFare" | "programmata" | "eseguita"` (`:51`). Reader: `readNextMezzoManutenzioniSnapshot` (`:783`), `readNextManutenzioniDaFareSnapshot` (`:872`, filtra `stato==="daFare"`), `readNextManutenzioniDaFareAndProgrammataGlobalSnapshot` (`:879`). `getNextManutenzioneOrigineRecord` (`:886`) risolve il record sorgente da `origineRefKey/origineRefId`. Writer business: `saveNextManutenzioneBusinessRecord` (`:1178`), `deleteNextManutenzioneBusinessRecord` (`:1223`). **Nessun campo `linkedManutenzioneId`, `completaDaFare`, `chiusuraDi`** nel dominio.

### `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js` (1572 righe; registro entry)
Registro statico delle entry boundary read-only per la chat IA. Ogni entry: `id`, `collection`, `docId`, `datasetKey`, `allowedFields`, `forbiddenFields`, `matchStrategy`. Contiene `@cambi_gomme_autisti_tmp` (`:1003-1008`, "Documento cambi gomme autisti TMP minimo") e `@gomme_eventi` (`:1087-1092`, "Documento eventi gomme minimo"). Vedi Appendice A per l'elenco completo.

---

## 1. Cambio gomme: flusso completo end-to-end

### 1.1 Lato app autista (input)
- L'autista inserisce l'evento gomme dall'app autista. Nel clone NEXT il modale autista e' `src/next/autisti/NextModalGomme.tsx` / `NextGommeAutistaModal.tsx`; nella madre legacy `src/pages/ModalGomme.tsx` + `src/autisti/GommeAutistaModal.tsx` (non letti in dettaglio per vincolo perimetro).
- Campi raccolti (dedotti dal payload usato a valle in `NextAutistiInboxHomeNative.tsx:841-859` e `nextManutenzioniGommeDomain.ts`): `tipo` (ordinaria/straordinaria/rotazione), `km`, targa (`targetTarga` / `targa` / `targaCamion` / `targaRimorchio`), `data`/`timestamp`, asse coinvolto, marca, quantita', posizione.
- **Collection Firestore che riceve l'input: `@cambi_gomme_autisti_tmp`** (doc in collection `storage`). Costante `KEY_GOMME_TMP` ovunque.
- Documentazione esistente: il dominio dichiara la convergenza in `nextManutenzioniGommeDomain.ts:1552`; il boundary descrive `@cambi_gomme_autisti_tmp` come "TMP minimo" (`:1003`).

### 1.2 Arrivo in /next/autisti-inbox
- Il record appare nella card dedicata "GOMME" di `src/next/autistiInbox/NextAutistiInboxHomeNative.tsx:807-864`.
- Si distingue da segnalazione generica e controllo KO perche' e' una **card separata** con `tipo === "gomme"` (partizione a `:156-161`), mentre segnalazioni (`:141`) e controlli (`:145`) hanno card proprie.
- Distinzione visiva: sottotitolo fisso "Cambio / Rotazione" (`:837`), badge rosso `#d32f2f` "NUOVE {gommeNuoveCount}" (`:812-826`), righe `time - targa - TIPO - KM {km}` (`:859`). Pagina di dettaglio completa: `NextAutistiInboxGommePage.tsx` / `NextAutistiGommeAllNative.tsx` (lista con filtro `onlyNonImportati`, `:65,119,164`).

### 1.3 Import da parte di Giuseppe
- **Percorso A — admin inbox NEXT:** bottone a `NextAutistiAdminNative.tsx:2778` -> handler `importGommeRecord` (`:1606-1621`).
  - Writer: scrittura diretta via `setItemSync(KEY_GOMME_EVENTI, ...)`. **Collection di destinazione: `@gomme_eventi`.** Poi `updateGommeRecord` marca il TMP con `stato:"importato", letta:true` su `@cambi_gomme_autisti_tmp`.
  - Cosa scrive nelle 3 destinazioni richieste:
    a. **dossier mezzo** — niente di diretto: il dossier lo vedra' solo perche' il reader convergente legge `@gomme_eventi` (vedi 1.4).
    b. **`@manutenzioni`** — **NIENTE. `importGommeRecord` non scrive mai su `@manutenzioni`.**
    c. **sezione gomme del dossier** — niente di diretto: stessa convergenza in lettura.
  - La scrittura **NON** passa per `createManutenzioneDaFareFromEvento` ne' per alcun writer `@manutenzioni`. Passa per un append puro su `@gomme_eventi`.
  - Il record creato in `@manutenzioni` ha stato `"eseguita"`/`"daFare"`/altro? **Nessun record viene creato in `@manutenzioni`.** L'evento gomme resta confinato in `@gomme_eventi`.
- **Percorso B — modale evento clone NEXT:** in `NextHomeAutistiEventoModal.tsx:934-950` il bottone "IMPORTA IN DOSSIER" per gli eventi gomme e' **bloccato** nel clone (`handleImportDossierBlocked`). L'import "vero" lato clone passa quindi dall'admin inbox (Percorso A); lato madre passa da `src/components/AutistiEventoModal.tsx` (non letto in dettaglio).

### 1.4 Visibilita' post-import
- **/next/manutenzioni:** un evento gomme importato **NON appare come record proprio** nella lista `@manutenzioni`, perche' non e' un record `@manutenzioni`. Appare solo se/quando esiste un record `@manutenzioni` distinto classificato come gomme (subtype `"gomme"`/`"gomme-straordinario"` in `NextManutenzioniPage.tsx:55-56,242-247,706-719`) — ma quel record nasce da inserimento manuale in Manutenzioni, non dall'import gomme.
- **dossier mezzo:** appare nelle card "Stato gomme per asse" (`NextDossierMezzoPage.tsx:559`) ed "Eventi gomme straordinari" (`:561`), alimentate dal reader convergente. NON appare nelle card "Manutenzioni" (daFare/eseguite, `:551-555`) ne' in "Storico manutenzioni" (`:557`), perche' quelle leggono `@manutenzioni`.
- **sezione gomme dossier (`NextDossierGommePage` -> `NextGommeEconomiaSection`):** mostra lo storico gomme economico; legge via `readNextMezzoManutenzioniGommeSnapshot` (`NextGommeEconomiaSection.tsx:57`), quindi da `@manutenzioni` + `@cambi_gomme_autisti_tmp` + `@gomme_eventi`.
- **Doppione/triplicato:** lato gomme la convergenza fa dedup (`dedupeExternalTyreItems` per `sourceRecordId`, e `dedupeExternalAgainstMaintenance` per firma km/marca/asse). Quindi lo **stesso evento gomme** non si triplica nelle viste gomme. Ma vedi sezione 3: il doppione vero e' un altro — `daFare` in `@manutenzioni` vs `eseguita` in `@gomme_eventi`, che la convergenza **non** sa collegare.

---

## 2. Cicli paralleli simili (scoperti dall'audit)

Ricerca esaustiva (comandi 10-11): **nessun altro flusso autista predefinito dedicato** esiste oltre al cambio gomme.

| Scenario | Sorgente Firestore | Dove appare in inbox | Come si importa | Scrittura su `@manutenzioni` |
|---|---|---|---|---|
| **Cambio gomme** (ordinaria/straordinaria/rotazione) | `@cambi_gomme_autisti_tmp` -> (import) -> `@gomme_eventi` | Card dedicata "GOMME" (`NextAutistiInboxHomeNative.tsx:807`) | `importGommeRecord` (`NextAutistiAdminNative.tsx:1606`) | **NO** — append su `@gomme_eventi` |
| Segnalazione generica (qualsiasi problema, incl. "gomme da cambiare" scritto a mano) | `@segnalazioni_autisti_tmp` | Card "SEGNALAZIONI" | `createManutenzioneDaFareFromSegnalazione` (`nextManutenzioneDaFareCreateWriter.ts:259`) | **SI** — crea record `stato:"daFare"` |
| Controllo mezzo KO (olio/freni/luci/ecc. tra i check) | `@controlli_mezzo_autisti` | Card "CONTROLLI" | `createManutenzioneDaFareFromControllo` (`...Writer.ts:307`) | **SI** — crea 1+ record `stato:"daFare"` |
| Tagliando / tagliando completo / olio / filtri | nessuna sorgente autista dedicata | n/d | inserimento manuale in `/next/manutenzioni` (`NextManutenzioniPage.tsx` subtypes `:53-54,132`) | **SI** — `saveNextManutenzioneBusinessRecord` |

**Conclusione esplicita richiesta dal prompt:** solo il cambio gomme e' un flusso predefinito dedicato con collection proprie (`@cambi_gomme_autisti_tmp` + `@gomme_eventi`). Olio, filtri, freni, tagliando NON hanno un flusso autista dedicato: passano per la segnalazione generica o per i check del controllo mezzo, oppure per inserimento manuale in Manutenzioni. Quindi il problema "doppione" nella sua forma piu' acuta (collection completamente separata) e' **specifico del cambio gomme**; nella sua forma generica (vedi 3) riguarda qualsiasi `eseguita` creata senza linkare una `daFare` preesistente.

---

## 3. Problema "doppione daFare + eseguita non collegate"

### 3.1 Casistica
Catena temporale tipica:
1. 10 maggio — autista manda segnalazione "gomme da cambiare" -> `@segnalazioni_autisti_tmp`.
2. 10-11 maggio — Giuseppe importa la segnalazione: `createManutenzioneDaFareFromSegnalazione` crea in `@manutenzioni` un record `stato:"daFare"`, `origineTipo:"segnalazione"`, `origineRefKey:"@segnalazioni_autisti_tmp"`, `origineRefId:<id segnalazione>`; la segnalazione sorgente viene patchata con `linkedLavoroId` + `stato:"presa_in_carico"` (`...Writer.ts:299`,`132-151`).
3. 13 maggio — autista cambia le gomme e lo manda dall'app -> `@cambi_gomme_autisti_tmp`.
4. 13 maggio — Giuseppe importa l'evento gomme: `importGommeRecord` copia il record in `@gomme_eventi` (`NextAutistiAdminNative.tsx:1614-1619`).

**Cosa succede architetturalmente:** restano **due record in collection diverse, senza alcun backlink**:
- la `daFare` in `@manutenzioni` (passo 2) — nessun campo che punti all'evento gomme;
- l'`eseguita` di fatto in `@gomme_eventi` (passo 4) — nessun `origineRefId` / `linkedManutenzioneId` / `linkedLavoroId` che punti alla `daFare`.

`importGommeRecord` non legge `@manutenzioni`, non cerca `daFare` aperte, non patcha nulla lato manutenzioni. Il reader convergente `dedupeExternalAgainstMaintenance` non puo' aiutare: confronta gomme-vs-gomme su firma `targa+giorno+asse+marca+km` (`nextManutenzioniGommeDomain.ts:935-957`), e una `daFare` non ha asse/marca/km -> firma `null` -> nessun match.

**Quale UI mostra la confusione:**
- `/next/manutenzioni`, tab "Da fare": la `daFare` del 10 maggio resta visibile e aperta in eterno (filtro `stato==="daFare"`, `nextManutenzioniDomain.ts:872-876`).
- `NextDossierMezzoPage.tsx:551-555`, card "Manutenzioni" lista "Da fare": stessa `daFare` ancora presente.
- Contemporaneamente il cambio reale appare nelle card gomme del dossier e in `NextGommeEconomiaSection` — ma come entita' scollegata.
Risultato: per Giuseppe la manutenzione "risulta da fare" anche se e' gia' stata eseguita; due tracce parallele dello stesso intervento.

**Nota sul caso generico (non-gomme):** lo stesso disallineamento si verifica anche **dentro** `@manutenzioni` se si crea un record `eseguita` nuovo (via `saveNextManutenzioneBusinessRecord`) invece di usare l'azione "Completa" su una `daFare` esistente. L'azione "Completa" esiste in `NextManutenzioniPage.tsx` (`completionRecordId`, `setCompletionRecordId(item.id)`, `isCompletionSave`) e transita lo **stesso** record da `daFare` a `eseguita` — ma e' un'azione manuale che opera solo su record gia' in `@manutenzioni`, e non ha alcun aggancio al flusso gomme.

### 3.2 Numeri reali OGGI
**NON DISPONIBILI in questo audit.** Il conteggio richiesto da DISCOVERY I (doppioni reali in produzione, esempi con targa/descrizione/date, distribuzione per mezzo) richiede letture su Firestore reale. Il file `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js` e' un **modulo di configurazione e policy** (registro di entry, `allowedFields`, `matchStrategy`), non un endpoint interrogabile dall'ambiente di audit: non e' stato eseguito alcun processo Node ne' alcuna query (vincolo "vietato eseguire script").

Per chiudere questo punto serve, in un prompt successivo dedicato, una lettura controllata via boundary di:
- `@manutenzioni` — record con `stato:"daFare"` e `origineTipo` in `{segnalazione, controllo}`, raggruppati per `targa`;
- `@gomme_eventi` + `@cambi_gomme_autisti_tmp` — eventi gomme `eseguiti`, raggruppati per `targa` e data;
- intersezione targa+finestra-temporale con parole chiave gomma per stimare i doppioni.

Quello che l'audit del **codice** garantisce: il doppione **non puo' essere prevenuto ne' rilevato** dall'attuale architettura, perche' manca qualsiasi campo di collegamento (vedi sezione 4). Quindi il numero reale e' verosimilmente > 0 e cresce ad ogni cambio gomme che segue una segnalazione/controllo importati.

---

## 4. Architettura attuale del collegamento (cosa esiste gia')

- **`linkedLavoroId` / `linkedLavoroIds`** (decisione J.7, nome invariato post-dismissione): vivono **sul record sorgente** (`@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`), scritti da `patchSegnalazione`/`patchControllo` (`nextManutenzioneDaFareCreateWriter.ts:132-174`). Puntano **dalla segnalazione/controllo alla manutenzione daFare creata**. Direzione: sorgente -> manutenzione. Servono come guardia anti-doppia-creazione (`hasLinkedLavoro`, `:94-97`). **Non collegano una `eseguita` a una `daFare`.**
- **`origineTipo` / `origineRefId` / `origineRefKey`**: vivono **sul record `@manutenzioni`** (`nextManutenzioniDomain.ts:55-58,139-141,210-212`; scritti da `buildManutenzioneDaFareRecord`, `...Writer.ts:120-122`). Puntano **dalla manutenzione daFare al record sorgente** (segnalazione/controllo). Direzione: manutenzione -> sorgente. **Usati solo dal writer daFare; NON usati dall'import gomme** (`importGommeRecord` non li scrive — confermato `NextAutistiAdminNative.tsx:1606-1621`).
- **Campo "completaDaFare" / "chiusuraDi" / "linkedManutenzioneId"**: **non esiste.** Ricerca su `nextManutenzioniDomain.ts` e `nextManutenzioneDaFareCreateWriter.ts`: nessun campo che leghi una `eseguita` alla `daFare` che chiude. L'unico meccanismo di chiusura ciclo e' l'azione "Completa" di `NextManutenzioniPage.tsx`, che NON crea un secondo record ma transita lo stato dello stesso record `@manutenzioni` — quindi funziona solo se la `eseguita` e la `daFare` sono lo stesso documento, condizione mai vera per il flusso gomme.

**Sintesi:** esistono collegamenti **segnalazione/controllo <-> manutenzione daFare** (bidirezionali, J.7 + origineRef). NON esiste alcun collegamento **evento eseguito (gomme o altro) <-> manutenzione daFare**.

---

## 5. Punti di possibile intervento (mappa neutra)

> Questa sezione e' NEUTRA: elenca solo *dove* un eventuale fix potrebbe agire. Non sceglie ne' propone.

### 5.1 Lato app autista
- Punto: il modale di inserimento cambio gomme (`NextModalGomme.tsx` / `NextGommeAutistaModal.tsx`, e madre `src/pages/ModalGomme.tsx`).
- Cosa cambierebbe: il payload scritto in `@cambi_gomme_autisti_tmp` dovrebbe poter portare un riferimento a una `daFare` esistente (es. l'autista vede "esiste una manutenzione gomme da fare per questo mezzo" e la seleziona). Servirebbe un campo nuovo sul record TMP (es. un id di manutenzione daFare).
- Vincolo: richiede che l'app autista legga `@manutenzioni` (oggi non lo fa) per mostrare le `daFare` candidate.

### 5.2 Lato import admin
- Punto: `importGommeRecord` (`NextAutistiAdminNative.tsx:1606`) e il bottone import in `NextAutistiAdminNative.tsx:2778`; in subordine il modale evento (`NextHomeAutistiEventoModal.tsx`, ramo `isGomme`).
- Cosa cambierebbe: al momento dell'import, l'admin potrebbe vedere le `daFare` aperte sulla stessa targa (lette da `readNextManutenzioniDaFareSnapshot`, gia' esistente, `nextManutenzioniDomain.ts:872`) e scegliere "questo import chiude la daFare X". Servirebbe estendere il form di import con la selezione, e l'handler dovrebbe scrivere/patchare lato `@manutenzioni`.
- Vincolo: `importGommeRecord` oggi e' un append puro su `@gomme_eventi`; toccarlo significa fargli attraversare il clone write barrier anche per `@manutenzioni`.

### 5.3 Lato automatico (matching)
- Campi necessari per il matching `daFare <-> eseguita`: `targa` (gia' presente su entrambi i lati), `tipo`/categoria (gomme), parole chiave descrizione (gomma/pneumatico), finestra temporale (data `daFare` vs data evento gomme). La firma gia' esistente `buildTyreDedupSignature` (`nextManutenzioniGommeDomain.ts:935`) e' il punto piu' vicino, ma oggi confronta solo gomme-vs-gomme e richiede `km/marca/asse` (assenti su una `daFare`).
- Dove potrebbe vivere il matching: (a) nel writer/handler di import gomme (`importGommeRecord`) come passo post-append; (b) in un hook post-import lato admin; (c) in un layer batch separato; (d) come passo aggiuntivo nel reader convergente (ma il reader e' read-only e non puo' chiudere una `daFare`).
- Vincolo: qualunque chiusura automatica di una `daFare` e' una **scrittura** su `@manutenzioni` -> passa dal clone write barrier e impatta la chat IA (vedi sezione 6).

---

## 6. Vincoli e dipendenze rilevati

- **Decisione J.7 confermata:** `linkedLavoroId`/`linkedLavoroIds` mantengono il nome; sono usati solo per il legame sorgente -> manutenzione daFare (`nextManutenzioneDaFareCreateWriter.ts:132-174`).
- **Strategia 3a confermata:** `@lavori` non e' toccato; **non compare nel registro del boundary** (`internal-ai-firebase-readonly-boundary.js`) — la chat IA legge `@manutenzioni`, non `@lavori`.
- **Clone write barrier:** ogni scrittura su `@manutenzioni` e sui dataset gomme passa da `src/utils/cloneWriteBarrier.ts` (`@cambi_gomme_autisti_tmp` e `@gomme_eventi` sono in lista a `:133-134`); il writer daFare gira gia' in uno scope autorizzato (`MANUTENZIONE_DAFARE_CREATE_WRITE_SCOPE`). Un eventuale fix che scrive su `@manutenzioni` dal flusso gomme dovrebbe definire/usare uno scope analogo.
- **Dipendenza chat IA:** post-dismissione la chat IA usa `@manutenzioni` (registry `maintenance.manutenzioni`, boundary `firestore-storage-manutenzioni-doc` `:1153-1158`). Qualunque modifica strutturale a `@manutenzioni` (campi nuovi, cambio stato automatico) impatta anche la chat IA e i suoi `allowedFields`.
- **Doppia superficie di import:** esistono madre (`src/components/AutistiEventoModal.tsx`, `src/autistiInbox/AutistiAdmin.tsx`) e clone NEXT (`NextAutistiAdminNative.tsx`, `NextHomeAutistiEventoModal.tsx`). Il clone blocca l'import gomme nel modale evento ma lo consente nell'admin inbox native. Un fix coerente deve considerare entrambe le superfici o decidere quale e' quella "viva".
- **Convergenza in sola lettura:** `nextManutenzioniGommeDomain.ts` e' esplicitamente read-only e prudente (`limitations` `:1551-1554`); non e' il posto dove chiudere cicli, solo dove visualizzarli.

---

## 7. Domande aperte per Giuseppe

1. Il matching `daFare <-> eseguita` deve valere **solo per cambio gomme** (flusso dedicato, problema acuto) o **anche per il caso generico** (qualsiasi `eseguita` creata senza linkare una `daFare` in `@manutenzioni`)?
2. Il matching deve essere **automatico** (chiude la `daFare` senza chiedere) o **semi-automatico** (suggerisce un candidato, tu confermi all'import)?
3. Se l'autista esegue un cambio gomme **senza** alcuna `daFare` preesistente, il comportamento attuale (evento in `@gomme_eventi`, niente record `@manutenzioni`) va bene cosi', oppure vuoi che venga comunque materializzato un record `eseguita` in `@manutenzioni`?
4. Che **finestra temporale** ha senso per considerare un evento gomme come "chiusura" di una `daFare` (es. `daFare` aperta da 7 / 30 / 90 giorni)? Oltre la finestra: nessun match?
5. La chiusura della `daFare` deve **eliminare** il record eseguito parallelo, **fonderlo** nella `daFare`, oppure lasciarli entrambi con un **backlink** (`daFare` marcata eseguita + puntatore all'evento gomme)?
6. I doppioni **gia' esistenti oggi** in produzione vanno chiusi **retroattivamente** (one-shot di bonifica) o lasciati come storico e si interviene solo da qui in avanti?
7. Il fix deve agire **lato app autista** (l'autista collega la `daFare`), **lato import admin** (Giuseppe collega all'import), o **automatico** (matching server/batch)? Le tre opzioni hanno costi e superfici diverse (sezione 5).
8. Vale la pena far convergere il cambio gomme **dentro `@manutenzioni`** (un record gomme = un record manutenzione, come gia' avviene per i record gomme inseriti manualmente in `/next/manutenzioni`), oppure le collection `@cambi_gomme_autisti_tmp` / `@gomme_eventi` restano separate per scelta?
9. Per il caso generico: vuoi che l'app/inbox **scoraggi** la creazione di una `eseguita` nuova quando esiste gia' una `daFare` compatibile (es. avviso "esiste gia' una manutenzione da fare per questo mezzo")?
10. Dato l'impatto su chat IA (sezione 6): sei disposto a introdurre **campi nuovi** su `@manutenzioni` (es. un riferimento all'evento di esecuzione) sapendo che vanno propagati anche al boundary `allowedFields`?

---

## 8. Conclusione e prossimi passi (NEUTRI)

- Il flusso cambio gomme oggi crea record paralleli senza collegamento: **confermato dal codice**. `importGommeRecord` (`NextAutistiAdminNative.tsx:1606`) scrive solo su `@gomme_eventi`; nessun writer `@manutenzioni` e' coinvolto; nessun campo lega l'evento gomme a una `daFare`.
- Cicli paralleli simili identificati: **0 flussi autista predefiniti dedicati oltre al cambio gomme**. Olio/filtri/freni/tagliando passano per segnalazione generica, controllo KO o inserimento manuale. Il problema "doppione" nella forma generica (sezione 3.1, nota finale) resta possibile dentro `@manutenzioni` ogni volta che si crea una `eseguita` senza usare l'azione "Completa".
- Doppioni reali in produzione: **numero NON disponibile** in questo audit (DISCOVERY I non eseguibile senza accesso Firestore live). Richiede un prompt dedicato di lettura controllata via boundary. Architetturalmente il numero e' verosimilmente > 0 e crescente.
- Punti di intervento mappati: **3** (app autista 5.1 / import admin 5.2 / matching automatico 5.3), tutti neutri.
- Decisione strategica: NEL PROSSIMO PROMPT, Giuseppe + Claude leggono questo audit, rispondono alle domande della sezione 7 e decidono COSA fare (matching automatico? semi-automatico? UI manuale assistita? modifica app autista? convergenza in `@manutenzioni`?). Prerequisito consigliato: un prompt-ponte che esegua DISCOVERY F + I via boundary per quantificare i doppioni reali.

---

## STATO FIRESTORE
**Invariato.** Zero scritture, zero script eseguiti, zero query live. Unico effetto su disco: creazione di questo file di audit.

---

## Appendice A — Collection nel registro boundary (lettura statica di `internal-ai-firebase-readonly-boundary.js`)

Entry `exact_document` su collection `storage` (docId = datasetKey):
`@mezzi_aziendali` (`:807`), `@colleghi` (`:833`), `@autisti_sessione_attive` (`:866`), `@storico_eventi_operativi` (`:896`), `@rifornimenti_autisti_tmp` (`:927`), `@alerts_state` (`:959`), `@analisi_economica_mezzi` (`:974`), `@attrezzature_cantieri` (`:992`), **`@cambi_gomme_autisti_tmp` (`:1007`)**, `@cisterne_adblue` (`:1025`), `@controlli_mezzo_autisti` (`:1040`), `@costiMezzo` (`:1058`), `@fornitori` (`:1073`), **`@gomme_eventi` (`:1091`)**, `@impostazioni_app` (`:1106`), `@inventario` (`:1124`), `@listino_prezzi` (`:1139`), **`@manutenzioni` (`:1157`)**, `@materialiconsegnati` (`:1172`), `@mezzi_foto_viste` (`:1187`), `@mezzi_hotspot_mapping` (`:1202`), `@officine` (`:1217`), `@ordini` (`:1232`), `@preventivi` (`:1250`), `@preventivi_approvazioni` (`:1268`), `@richieste_attrezzature_autisti_tmp` (`:1283`), `@rifornimenti` (`:1301`), `@segnalazioni_autisti_tmp` (`:1321`).

Entry `collection_root`: `@documenti_mezzi` (`:1338`), `@documenti_magazzino` (`:1355`), `@documenti_generici` (`:1372`), `@documenti_cisterna` (`:1389`), `@cisterna_schede_ia` (`:1406`), `@cisterna_parametri_mensili` (`:1423`), `@euromecc...` (`:1435+`, non interamente letto).

Note:
- **Non esiste `@cambi_gomme`, `@gomme`, `@pneumatici`, `@tires`, `@gomme_storico` come collection separate.** Le uniche due collection gomme sono `@cambi_gomme_autisti_tmp` (TMP, input autista) e `@gomme_eventi` (post-import).
- **`@lavori` NON compare nel registro boundary** (coerente con strategia 3a: `@lavori` resta vivo in Firestore lato madre ma non e' esposto alla chat IA NEXT).
- `@scadenze` non presente come collection a se': le scadenze sono campi dentro `@mezzi_aziendali` / `@manutenzioni`.
- Questo elenco e' la **lista statica del registro boundary**, non un inventario live di Firestore: collection non registrate nel boundary (perche' non esposte alla chat IA) potrebbero comunque esistere su Firestore.
