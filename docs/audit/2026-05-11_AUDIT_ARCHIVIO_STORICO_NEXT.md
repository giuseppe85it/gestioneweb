# AUDIT — Archivio Storico Universale NEXT

**Data**: 2026-05-11
**Modalità**: READ-ONLY (R0 anti-allucinazione applicato)
**Autore audit**: Claude Code
**Scope**: 9 collezioni candidate + `@storico_eventi_operativi` come candidata aggregatrice.

> Regola applicata in tutto il documento: ogni claim ha riferimento `src/percorso/file.ts:NN`. Quando un dato non è presente nel codice scrivo `NON TROVATO NEL CODICE`. Quando il REGISTRO_COLLECTION_FIRESTORE.md e il codice divergono, lo segnalo nella §9.

---

## 0. SINTESI ESECUTIVA — COLLEZIONI EFFETTIVE TROVATE

L'audit ha rivelato che 3 dei 9 nomi forniti dal prompt **non corrispondono a collezioni Firestore reali** ma a **viste/pagine** o **campi inline su altro dataset**:

| Nome dal prompt | Collezione Firestore reale | Note |
|---|---|---|
| 1. lavori | `storage/@lavori` | ✓ esiste |
| 2. manutenzioni | `storage/@manutenzioni` | ✓ esiste |
| 3. segnalazioni_autisti_tmp | `storage/@segnalazioni_autisti_tmp` | ✓ esiste |
| 4. controlli_mezzo_autisti | `storage/@controlli_mezzo_autisti` | ✓ esiste |
| 5. richieste_attrezzature_autisti_tmp | `storage/@richieste_attrezzature_autisti_tmp` | ✓ esiste |
| 6. rifornimenti | `storage/@rifornimenti` **+** `storage/@rifornimenti_autisti_tmp` | **2 collezioni distinte**, business vs field |
| 7. materiali_da_ordinare | `storage/@ordini` (vista) | NON è collezione separata; pagina che legge ordini in stato pending |
| 8. acquisti | `storage/@ordini` (vista) | NON è collezione separata; condivide dataset con il punto 7 |
| 9. scadenze | NON è collezione | I "collaudi" sono **campi inline su `@mezzi_aziendali`** scritti da `nextScadenzeCollaudiWriter.ts` |
| X. storico_eventi_operativi | `storage/@storico_eventi_operativi` | ✓ esiste — verdetto in §6 |

Cardinalità collezioni archivio storico effettive: **8 collezioni Firestore** (`@lavori`, `@manutenzioni`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@richieste_attrezzature_autisti_tmp`, `@rifornimenti`, `@rifornimenti_autisti_tmp`, `@ordini`) + 1 aggregatrice candidata (`@storico_eventi_operativi`) + 1 dataset di mezzi che porta scadenze come campi (`@mezzi_aziendali`).

---

## 1. INVENTARIO COLLEZIONI

### 1.1 `storage/@lavori`
- **Nome verbatim**: `"@lavori"` — [src/next/domain/nextLavoriDomain.ts:16](src/next/domain/nextLavoriDomain.ts#L16) `const LAVORI_DATASET_KEY = "@lavori";`
- **Reader NEXT**: [src/next/domain/nextLavoriDomain.ts](src/next/domain/nextLavoriDomain.ts) — `readNextMezzoLavoriSnapshot` (declared NEXT_LAVORI_DOMAIN linea 42-63)
- **Writer NEXT**: [src/next/nextLavoroCreateWriter.ts:11](src/next/nextLavoroCreateWriter.ts#L11) `const LAVORI_KEY = "@lavori";` — `createLavoroFromEvento` (introdotto PROMPT 28, 2026-05-11)
- **Reader/writer madre**: [src/components/AutistiEventoModal.tsx:546-547](src/components/AutistiEventoModal.tsx#L546-L547) `await loadArray("@lavori")` / `await saveArray("@lavori", ...)`. Pagine: [src/pages/LavoriDaEseguire.tsx], [src/pages/LavoriInAttesa.tsx], [src/pages/LavoriEseguiti.tsx], [src/pages/DettaglioLavoro.tsx]
- **REGISTRO**: sì, [docs/product/REGISTRO_COLLECTION_FIRESTORE.md:1000-1016](docs/product/REGISTRO_COLLECTION_FIRESTORE.md#L1000) — "BOUNDARY VERIFICATA RUNTIME"
- **Cardinalità stimata**: ALTA — alimentata da ogni segnalazione/controllo che genera un lavoro + creazioni manuali

### 1.2 `storage/@manutenzioni`
- **Nome verbatim**: `"@manutenzioni"` — [src/next/domain/nextManutenzioniDomain.ts:15](src/next/domain/nextManutenzioniDomain.ts#L15) `const MANUTENZIONI_KEY = "@manutenzioni";`
- **Reader NEXT**: [src/next/domain/nextManutenzioniDomain.ts](src/next/domain/nextManutenzioniDomain.ts) — `readNextMezzoManutenzioniSnapshot` (linea 663), `readNextManutenzioniLegacyDataset` (linea 716), `readNextManutenzioniWorkspaceSnapshot` (linea 752)
- **Writer NEXT**: [src/next/domain/nextManutenzioniDomain.ts:982](src/next/domain/nextManutenzioniDomain.ts#L982) `saveNextManutenzioneBusinessRecord` + [:1012](src/next/domain/nextManutenzioniDomain.ts#L1012) `deleteNextManutenzioneBusinessRecord`
- **Reader/writer madre**: [src/pages/Manutenzioni.tsx]
- **REGISTRO**: sì, [REGISTRO:1036-1052](docs/product/REGISTRO_COLLECTION_FIRESTORE.md#L1036) — "BOUNDARY VERIFICATA RUNTIME"
- **Cardinalità stimata**: MEDIA-ALTA — interventi storici, cambi gomme derivati

### 1.3 `storage/@segnalazioni_autisti_tmp`
- **Nome verbatim**: `"@segnalazioni_autisti_tmp"` — [src/next/nextSegnalazioniWriter.ts:10](src/next/nextSegnalazioniWriter.ts#L10), [src/next/domain/nextSegnalazioniControlliDomain.ts:5](src/next/domain/nextSegnalazioniControlliDomain.ts#L5)
- **Reader NEXT**: [src/next/domain/nextAutistiDomain.ts:23](src/next/domain/nextAutistiDomain.ts#L23) e [src/next/domain/nextSegnalazioniControlliDomain.ts:5](src/next/domain/nextSegnalazioniControlliDomain.ts#L5); reader Centro Controllo [src/next/domain/nextCentroControlloDomain.ts:20](src/next/domain/nextCentroControlloDomain.ts#L20)
- **Writer NEXT**: [src/next/nextSegnalazioniWriter.ts:28](src/next/nextSegnalazioniWriter.ts#L28) `markSegnalazioneChiusa` (soft-delete); [src/next/nextLavoroCreateWriter.ts:166-176](src/next/nextLavoroCreateWriter.ts#L166-L176) patch linkedLavoroId
- **Reader/writer madre**: [src/components/AutistiEventoModal.tsx:556-565](src/components/AutistiEventoModal.tsx#L556-L565); [src/autistiInbox/AutistiSegnalazioniAll.tsx], [src/autisti/Segnalazioni.tsx]
- **REGISTRO**: sì, [REGISTRO:1222-1244](docs/product/REGISTRO_COLLECTION_FIRESTORE.md#L1222) — "BOUNDARY VERIFICATA RUNTIME"; sub-blocco soft-delete sessione 2026-05-09 [REGISTRO:1246-1250](docs/product/REGISTRO_COLLECTION_FIRESTORE.md#L1246)
- **Cardinalità stimata**: ALTA — ogni autista può inviare segnalazioni durante il giro

### 1.4 `storage/@controlli_mezzo_autisti`
- **Nome verbatim**: `"@controlli_mezzo_autisti"` — [src/next/nextControlliWriter.ts:10](src/next/nextControlliWriter.ts#L10), [src/next/domain/nextSegnalazioniControlliDomain.ts:6](src/next/domain/nextSegnalazioniControlliDomain.ts#L6)
- **Reader NEXT**: [src/next/domain/nextAutistiDomain.ts:24](src/next/domain/nextAutistiDomain.ts#L24); [src/next/domain/nextSegnalazioniControlliDomain.ts:6](src/next/domain/nextSegnalazioniControlliDomain.ts#L6); [src/next/domain/nextCentroControlloDomain.ts:21](src/next/domain/nextCentroControlloDomain.ts#L21)
- **Writer NEXT**: [src/next/nextControlliWriter.ts](src/next/nextControlliWriter.ts) `markControlloChiuso` (soft-delete); [src/next/nextLavoroCreateWriter.ts:177-187](src/next/nextLavoroCreateWriter.ts#L177-L187) patch linkedLavoroId
- **Reader/writer madre**: [src/components/AutistiEventoModal.tsx:567-581](src/components/AutistiEventoModal.tsx#L567-L581); [src/autistiInbox/AutistiControlliAll.tsx], [src/autisti/ControlloMezzo.tsx]
- **REGISTRO**: sì, [REGISTRO:832-855](docs/product/REGISTRO_COLLECTION_FIRESTORE.md#L832); sub-blocco soft-delete sessione 2026-05-09 [REGISTRO:856-860](docs/product/REGISTRO_COLLECTION_FIRESTORE.md#L856)
- **Cardinalità stimata**: ALTA — un controllo all'inizio di ogni giro/cambio mezzo

### 1.5 `storage/@richieste_attrezzature_autisti_tmp`
- **Nome verbatim**: `"@richieste_attrezzature_autisti_tmp"` — [src/next/nextRichiesteAttrezzatureWriter.ts:10](src/next/nextRichiesteAttrezzatureWriter.ts#L10)
- **Reader NEXT**: [src/next/domain/nextAutistiDomain.ts:25](src/next/domain/nextAutistiDomain.ts#L25); [src/next/autistiInbox/NextRichiestaAttrezzatureAllNative.tsx:19](src/next/autistiInbox/NextRichiestaAttrezzatureAllNative.tsx#L19)
- **Writer NEXT**: [src/next/nextRichiesteAttrezzatureWriter.ts](src/next/nextRichiesteAttrezzatureWriter.ts) `markRichiestaEvasa`
- **Reader/writer madre**: [src/autistiInbox/RichiestaAttrezzatureAll.tsx], [src/autisti/RichiestaAttrezzature.tsx]
- **REGISTRO**: sì, [REGISTRO:1174-1196](docs/product/REGISTRO_COLLECTION_FIRESTORE.md#L1174); sub-blocco soft-delete sessione 2026-05-09 [REGISTRO:1198-1202](docs/product/REGISTRO_COLLECTION_FIRESTORE.md#L1198)
- **Cardinalità stimata**: MEDIA — su richiesta autista non sistemico

### 1.6a `storage/@rifornimenti` (BUSINESS)
- **Nome verbatim**: `"@rifornimenti"` — [src/next/domain/nextRifornimentiDomain.ts:7](src/next/domain/nextRifornimentiDomain.ts#L7) `const BUSINESS_DATASET_KEY = "@rifornimenti";`
- **Reader NEXT**: [src/next/domain/nextRifornimentiDomain.ts](src/next/domain/nextRifornimentiDomain.ts); [src/next/nextRifornimentiConsumiDomain.ts:7](src/next/nextRifornimentiConsumiDomain.ts#L7)
- **Writer NEXT**: [src/next/nextRifornimentiWriter.ts:9](src/next/nextRifornimentiWriter.ts#L9)
- **Reader madre**: [src/pages/Mezzo360.tsx], [src/pages/DossierMezzo.tsx]
- **REGISTRO**: sì, [REGISTRO:1204-1220](docs/product/REGISTRO_COLLECTION_FIRESTORE.md#L1204)
- **Cardinalità stimata**: ALTA — un record per ogni rifornimento fatto

### 1.6b `storage/@rifornimenti_autisti_tmp` (FIELD)
- **Nome verbatim**: `"@rifornimenti_autisti_tmp"` — [src/next/nextRifornimentiConsumiDomain.ts:8](src/next/nextRifornimentiConsumiDomain.ts#L8) `const FIELD_DATASET_KEY = "@rifornimenti_autisti_tmp";`
- **Reader NEXT**: [src/next/domain/nextRifornimentiDomain.ts:8](src/next/domain/nextRifornimentiDomain.ts#L8); [src/next/nextRifornimentiConsumiDomain.ts:8](src/next/nextRifornimentiConsumiDomain.ts#L8)
- **Writer NEXT**: [src/next/nextRifornimentiWriter.ts:10](src/next/nextRifornimentiWriter.ts#L10) `const FIELD_RIFORNIMENTI_KEY = "@rifornimenti_autisti_tmp";`
- **Reader madre**: [src/autisti/Rifornimento.tsx]
- **REGISTRO**: sì, [REGISTRO:631-658](docs/product/REGISTRO_COLLECTION_FIRESTORE.md#L631)
- **Cardinalità stimata**: ALTA — uno per ogni rifornimento autista app

### 1.7 `storage/@ordini` (sottende sia "Materiali da ordinare" sia "Acquisti")
- **Nome verbatim**: `"@ordini"` — [src/next/domain/nextProcurementDomain.ts:6](src/next/domain/nextProcurementDomain.ts#L6) `const ORDINI_KEY = "@ordini";`
- **Reader NEXT**: [src/next/domain/nextProcurementDomain.ts](src/next/domain/nextProcurementDomain.ts) `readNextProcurementSnapshot`; consumato da [src/next/NextMaterialiDaOrdinarePage.tsx], [src/next/NextAcquistiPage.tsx], [src/next/NextProcurementReadOnlyPanel.tsx], [src/next/NextProcurementConvergedSection.tsx], [src/next/NextProcurementStandalonePage.tsx]
- **Writer NEXT**: scritto via Firestore [src/next/NextMaterialiDaOrdinarePage.tsx:1140](src/next/NextMaterialiDaOrdinarePage.tsx#L1140) `doc(collection(db, "storage"), "@ordini")`; clone overrides via [src/next/nextProcurementCloneState.ts](src/next/nextProcurementCloneState.ts)
- **Reader/writer madre**: [src/pages/Acquisti.tsx], [src/pages/DettaglioOrdine.tsx], [src/pages/OrdiniArrivati.tsx], [src/pages/OrdiniInAttesa.tsx]
- **REGISTRO**: sì, [REGISTRO:1122-1138](docs/product/REGISTRO_COLLECTION_FIRESTORE.md#L1122)
- **Cardinalità stimata**: MEDIA — un record per ordine, con righe materiali annidate
- **Memo**: "materiali_da_ordinare" e "acquisti" sono VISTE differenti dello stesso dataset, filtri/aggregazioni distinti

### 1.8 "Scadenze collaudi" — NON COLLEZIONE
- **Verdetto**: `@scadenze` / `@scadenze_mezzi` / `@scadenze_collaudi` **NON ESISTONO** nel codice. Grep esaustivo confermato:
  - `nextScadenzeCollaudiWriter.ts` scrive su [src/next/nextScadenzeCollaudiWriter.ts:4](src/next/nextScadenzeCollaudiWriter.ts#L4) `const MEZZI_KEY = "@mezzi_aziendali";`
- **I "collaudi" sono CAMPI INLINE su `@mezzi_aziendali`**: `prenotazioneCollaudo`, `preCollaudo`, `dataUltimoCollaudo`, `dataScadenzaRevisione` ecc. (visibili in [src/next/nextAnagraficheFlottaDomain.ts:101-119](src/next/domain/nextCentroControlloDomain.ts#L101))
- **Reader NEXT delle scadenze**: [src/next/NextScadenzeCollaudiPage.tsx], [src/next/domain/nextCentroControlloDomain.ts] (compute D10MezzoItem.dataScadenzaRevisioneTs)
- **Writer NEXT**: [src/next/nextScadenzeCollaudiWriter.ts](src/next/nextScadenzeCollaudiWriter.ts) usa scope `SCADENZE_COLLAUDI_WRITE_SCOPE` ([src/utils/cloneWriteBarrier.ts:116](src/utils/cloneWriteBarrier.ts#L116))
- **Impatto per archivio storico**: una "Scadenze" tab dovrebbe sintetizzare campi disparati su record mezzo + eventi prenotazione/completamento; richiede shape ricostruita ad hoc. NON è una collezione storica naturale.

### 1.X `storage/@storico_eventi_operativi` (CANDIDATA AGGREGATRICE)
Vedi §6 per il verdetto dettagliato.
- **Nome verbatim**: `"@storico_eventi_operativi"` — [src/utils/homeEvents.ts:58](src/utils/homeEvents.ts#L58), [src/next/autisti/nextAutistiHomeEvents.ts:44](src/next/autisti/nextAutistiHomeEvents.ts#L44)
- **Reader NEXT**: [src/next/autisti/nextAutistiHomeEvents.ts:192](src/next/autisti/nextAutistiHomeEvents.ts#L192), [src/next/autistiInbox/NextAutistiInboxHomeNative.tsx:114](src/next/autistiInbox/NextAutistiInboxHomeNative.tsx#L114), [src/next/autistiInbox/NextAutistiAdminNative.tsx:372](src/next/autistiInbox/NextAutistiAdminNative.tsx#L372), [src/next/autistiInbox/NextAutistiLogAccessiAllNative.tsx:76](src/next/autistiInbox/NextAutistiLogAccessiAllNative.tsx#L76)
- **Writer NEXT**: [src/next/autistiInbox/NextAutistiAdminNative.tsx:1439](src/next/autistiInbox/NextAutistiAdminNative.tsx#L1439), [src/next/autistiInbox/NextAutistiAdminNative.tsx:1462](src/next/autistiInbox/NextAutistiAdminNative.tsx#L1462)
- **Reader/writer madre**: [src/autisti/LoginAutista.tsx:21-29](src/autisti/LoginAutista.tsx#L21-L29), [src/autisti/HomeAutista.tsx:52-60](src/autisti/HomeAutista.tsx#L52-L60), [src/autisti/CambioMezzoAutista.tsx:67-71](src/autisti/CambioMezzoAutista.tsx#L67-L71), [src/autisti/SetupMezzo.tsx:97-101](src/autisti/SetupMezzo.tsx#L97-L101)
- **REGISTRO**: sì, [REGISTRO:606-629](docs/product/REGISTRO_COLLECTION_FIRESTORE.md#L606)
- **Cardinalità stimata**: ALTA — un evento ogni login/logout/cambio assetto autista

---

## 2. SHAPE PER COLLEZIONE

### 2.1 `@lavori` — Type NEXT
Type record persistito: `NextLavoriLegacyDatasetRecord` ([src/next/domain/nextLavoriDomain.ts:130-144](src/next/domain/nextLavoriDomain.ts#L130-L144)):

| Campo | Tipo | Opz | Significato |
|---|---|---|---|
| `id` | `string` | no | id univoco lavoro |
| `gruppoId` | `string` | no | aggrega lavori della stessa creazione |
| `tipo` | `"magazzino" \| "targa"` | no | scope lavoro |
| `descrizione` | `string` | no | testo principale |
| `dettagli` | `string` | sì | note aggiuntive |
| `dataInserimento` | `string` (YYYY-MM-DD) | no | apertura lavoro |
| `eseguito` | `boolean` | no | flag stato |
| `targa` | `string` | sì | targa mezzo (vuota se magazzino) |
| `urgenza` | `"bassa" \| "media" \| "alta"` | sì | priorità |
| `segnalatoDa` | `string` | sì | autore creazione |
| `chiHaEseguito` | `string` | sì | autore chiusura |
| `dataEsecuzione` | `string` | sì | chiusura |
| `sottoElementi` | `unknown[]` | no | placeholder sottoElementi |

Output type read-only (proiezione): `NextLavoroReadOnlyItem` ([src/next/domain/nextLavoriDomain.ts:65-114](src/next/domain/nextLavoriDomain.ts#L65-L114)) aggiunge `mezzoTarga`, `timestampInserimento`, `timestampEsecuzione`, `statoVista` (`"da_eseguire"|"in_attesa"|"eseguito"`), `groupKind`, `groupKey`, `groupLabel`, `source.{dataset,originType,originKey,originId}`, `fieldQuality`, `flags`. **Sub-campo `source.originType/originKey/originId` collega il lavoro a segnalazione/controllo sorgente** ([:91-96](src/next/domain/nextLavoriDomain.ts#L91-L96)).

### 2.2 `@manutenzioni` — Type NEXT
Type record persistito: `NextManutenzioniLegacyDatasetRecord` ([src/next/domain/nextManutenzioniDomain.ts:110-130](src/next/domain/nextManutenzioniDomain.ts#L110-L130)):

| Campo | Tipo | Opz | Significato |
|---|---|---|---|
| `id` | `string` | no | id manutenzione |
| `targa` | `string` | no | targa mezzo |
| `km` | `number \| null` | no | km al momento intervento |
| `ore` | `number \| null` | no | ore (per compressore/attrezzature) |
| `sottotipo` | `"motrice" \| "trattore" \| null` | no | varianti compressore |
| `descrizione` | `string` | no | descrizione intervento |
| `eseguito` | `string \| null` | no | label esecutore |
| `data` | `string` | no | data intervento (stringa legacy) |
| `tipo` | `"mezzo" \| "compressore" \| "attrezzature"` | no | tipo intervento |
| `fornitore` | `string` | sì | officina/fornitore |
| `materiali` | `NextManutenzioniLegacyMaterialRecord[]` | sì | materiali consumati |
| `assiCoinvolti` | `string[]` | sì | per cambio gomme |
| `gommePerAsse` | `NextManutenzioneGommePerAsseRecord[]` | sì | dettaglio assi |
| `gommeInterventoTipo` | `"ordinario" \| "straordinario"` | sì | flag intervento |
| `gommeStraordinario` | `NextManutenzioneGommeStraordinarioRecord` | sì | sub-shape evento straordinario |
| `sourceDocumentId` | `string \| null` | sì | id documento fattura |
| `importo` | `number \| null` | sì | costo |
| `sourceDocumentFileUrl` | `string \| null` | sì | URL pdf |
| `sourceDocumentCurrency` | `"EUR" \| "CHF" \| "UNKNOWN" \| null` | sì | valuta |

Type proiezione storico: `NextMaintenanceHistoryItem` ([:61-82](src/next/domain/nextManutenzioniDomain.ts#L61-L82)) aggiunge `mezzoTarga`, `dataRaw`, `timestamp` (number), `eseguitoLabel`, `fornitoreLabel`, `materialiCount`, `isCambioGommeDerived`, `sourceOrigin: "manuale"|"autisti_gomme_derivato"|"unknown"`, `quality: NextManutenzioneQuality`. **NON ha campi soft-delete o linkedLavoroId** (le manutenzioni sono il prodotto finale, non hanno upstream eventi autisti).

### 2.3 `@segnalazioni_autisti_tmp` — Type NEXT
Type proiezione: `NextAutistiSegnalazioneSectionItem` ([src/next/domain/nextAutistiDomain.ts:128-148](src/next/domain/nextAutistiDomain.ts#L128-L148)):

| Campo | Tipo | Opz | Significato |
|---|---|---|---|
| `id` | `string` | no | id segnalazione |
| `timestamp` | `number \| null` | no | apertura |
| `targa` | `string \| null` | no | targa mezzo |
| `autistaNome` | `string \| null` | no | autore |
| `badgeAutista` | `string \| null` | no | badge autore |
| `tipo` | `string` | no | (es. freni/gomme/elettrico/altro) |
| `descrizione` | `string` | no | testo libero |
| `stato` | `string` | no | (es. nuova/presa_in_carico/chiusa) |
| `letta` | `boolean \| null` | no | flag letta dall'admin |
| `isNuova` | `boolean` | no | derivato |
| `fotoCount` | `number` | no | numero foto |
| `chiusa` | `boolean` | no | soft-delete (PROMPT 27.5) |
| `dataChiusura` | `number \| null` | no | timestamp chiusura |
| `chiusaBy` | `string \| null` | no | autore chiusura |
| `linkedLavoroId` | `string \| null` | no | id lavoro generato (PROMPT 27.6) |
| `hasLinkedLavoro` | `boolean` | no | derivato |
| `sourceDataset` | `string` | no | nome dataset |
| `sourceOrigin` | `NextAutistiDataOrigin` | no | provenienza |
| `flags` | `string[]` | no | flags qualità |

**Mancano** dal type proiezione (presenti raw nel record, vedi REGISTRO):  `targaCamion`, `targaMotrice`, `targaRimorchio`, `categoriaMezzo`, `mezzoId`, `severita`, `tipoProblema`, `posizioneGomma`, `problemaGomma`.

### 2.4 `@controlli_mezzo_autisti` — Type NEXT
Type proiezione: `NextAutistiControlloSectionItem` ([src/next/domain/nextAutistiDomain.ts:150-168](src/next/domain/nextAutistiDomain.ts#L150-L168)):

| Campo | Tipo | Opz | Significato |
|---|---|---|---|
| `id` | `string` | no | id controllo |
| `timestamp` | `number \| null` | no | apertura |
| `targaMotrice` | `string \| null` | no | targa motrice |
| `targaRimorchio` | `string \| null` | no | targa rimorchio |
| `autistaNome` | `string \| null` | no | autore |
| `badgeAutista` | `string \| null` | no | badge |
| `koList` | `string[]` | no | lista voci KO check |
| `isKo` | `boolean` | no | derivato (= koList.length > 0) |
| `note` | `string \| null` | no | testo libero |
| `chiuso` | `boolean` | no | soft-delete (PROMPT 27.5) |
| `dataChiusura` | `number \| null` | no | timestamp chiusura |
| `chiusoBy` | `string \| null` | no | autore chiusura |
| `linkedLavoroIds` | `string[]` | no | id lavori generati (può essere multipli) |
| `hasLinkedLavoro` | `boolean` | no | derivato |
| `sourceDataset` | `string` | no | dataset |
| `sourceOrigin` | `NextAutistiDataOrigin` | no | provenienza |
| `flags` | `string[]` | no | flags qualità |

**Divergenza vs segnalazioni**: nessun `tipo` né `stato` (a livello type — sono opzionali nel raw); `linkedLavoroIds` array invece di singolo; `koList` array invece di descrizione singola.

### 2.5 `@richieste_attrezzature_autisti_tmp` — Type NEXT
Type proiezione: `NextAutistiRichiestaSectionItem` ([src/next/domain/nextAutistiDomain.ts:170-187](src/next/domain/nextAutistiDomain.ts#L170-L187)):

| Campo | Tipo | Opz | Significato |
|---|---|---|---|
| `id` | `string` | no | id richiesta |
| `timestamp` | `number \| null` | no | apertura |
| `targa` | `string \| null` | no | targa mezzo |
| `autistaNome` | `string \| null` | no | autore |
| `badgeAutista` | `string \| null` | no | badge |
| `testo` | `string` | no | testo richiesta |
| `stato` | `string` | no | (nuova/evasa) |
| `letta` | `boolean \| null` | no | flag |
| `isNuova` | `boolean` | no | derivato |
| `hasFoto` | `boolean` | no | derivato |
| `evasa` | `boolean` | no | soft-delete (PROMPT 27.5) — campo distinto da chiusa/chiuso |
| `dataEvasione` | `number \| null` | no | timestamp evasione |
| `evasaBy` | `string \| null` | no | autore evasione |
| `sourceDataset` | `string` | no | |
| `sourceOrigin` | `NextAutistiDataOrigin` | no | |
| `flags` | `string[]` | no | |

**Note**: NON ha `linkedLavoroId` né `tipo` né `koList`. Lo stato finale si chiama `evasa` non `chiusa/chiuso` (asimmetria semantica).

### 2.6a `@rifornimenti` (business) — Type NEXT
Type proiezione: `NextRifornimentoReadOnlyItem` ([src/next/domain/nextRifornimentiDomain.ts:126-195](src/next/domain/nextRifornimentiDomain.ts#L126-L195)) — **shape ricca e diversa** dalle precedenti:

| Campo | Tipo | Significato |
|---|---|---|
| `id` | `string` | id |
| `mezzoTarga`, `targa` | `string` | targa |
| `dataDisplay`, `dataLabel` | `string \| null` | label data |
| `timestamp`, `timestampRicostruito` | `number \| null` | apertura |
| `litri`, `km`, `costo` | `number \| null` | metriche |
| `valuta` | `"EUR" \| "CHF" \| null` | |
| `tipo`, `distributore` | `string \| null` | |
| `note` | `string \| null` | |
| `autistaNome`, `autista`, `badgeAutista` | `string \| null` | |
| `provenienza` | `"business" \| "campo" \| "ricostruito"` | |
| `matchStrategy` | `NextRifornimentoMatchStrategy` | |
| `fieldQuality`, `quality` | object | matrice qualità per campo |
| `flags`, `sourceCollection`, `sourceKeys`, `sourceRecordIds`, `source`, `sourceTrust` | varie | metadati |
| `metodoPagamento` | `"piccadilly" \| "eni" \| "contanti" \| null` | |
| `paese` | `"IT" \| "CH" \| null` | |

**Nessun campo "stato"**, nessun soft-delete, nessun `linkedLavoroId`. Un rifornimento, una volta inserito, **è uno stato finale** (non c'è "presa in carico" o "chiusura").

### 2.6b `@rifornimenti_autisti_tmp` (field) — Type NEXT
Lo stesso reader [src/next/domain/nextRifornimentiDomain.ts](src/next/domain/nextRifornimentiDomain.ts) unisce business + field nel medesimo `NextRifornimentoReadOnlyItem`. **Distinzione runtime**: `provenienza === "campo"` quando origine è il dataset tmp ([:144](src/next/domain/nextRifornimentiDomain.ts#L144)). Campo `confermatoAutista` (REGISTRO:642) NON è esposto nel type proiezione.

### 2.7 `@ordini` — Type NEXT
Type proiezione: `NextProcurementOrderItem` ([src/next/domain/nextProcurementDomain.ts:79-98](src/next/domain/nextProcurementDomain.ts#L79-L98)):

| Campo | Tipo | Significato |
|---|---|---|
| `id` | `string` | id ordine |
| `supplierId`, `supplierName` | `string \| null`, `string` | fornitore |
| `orderDateLabel`, `orderTimestamp` | `string \| null`, `number \| null` | data |
| `orderReference` | `string` | numero ordine |
| `totalRows`, `arrivedRows`, `pendingRows` | `number` | conteggi righe |
| `latestArrivalLabel` | `string \| null` | label ultimo arrivo |
| `state` | `"in_attesa" \| "parziale" \| "arrivato" \| "vuoto"` | stato derivato |
| `materialPreview` | `string[]` | anteprima righe |
| `materials` | `NextProcurementMaterialItem[]` | righe complete |
| `orderNote` | `string \| null` | nota libera |
| `sourceCollection`, `sourceKey`, `quality`, `flags` | metadati | |

Sub-type righe materiali: `NextProcurementMaterialItem` ([:57-77](src/next/domain/nextProcurementDomain.ts#L57-L77)) — `id`, `descrizione`, `quantita`, `unita`, `arrived: boolean`, `arrivalDateLabel`, `arrivalTimestamp`, `note`, `photoUrl`, `unitPrice`, `currency`, `lineTotal`, `destination` (mezzo/cantiere/altro). **NON ha apertura/chiusura nel senso "evento autista"**: l'ordine ha `orderDateLabel` (creazione) + `arrived[]` per riga.

### 2.8 `@mezzi_aziendali` — campi scadenze inline
Shape derivata in NEXT come parte di `D10MezzoItem` ([src/next/domain/nextCentroControlloDomain.ts:101-119](src/next/domain/nextCentroControlloDomain.ts#L101-L119)):
- `dataImmatricolazioneTs`, `dataUltimoCollaudoTs`, `dataScadenzaRevisioneTs` (numbers)
- `prenotazioneCollaudo: D10PrenotazioneCollaudo | null` con sub-campi `data, ora, luogo, note, esito, noteEsito, completata, completataIl` ([:85-94](src/next/domain/nextCentroControlloDomain.ts#L85-L94))
- `preCollaudo: D10PreCollaudo | null` con sub-campi `data, officina` ([:96-99](src/next/domain/nextCentroControlloDomain.ts#L96-L99))
- `manutenzioneProgrammata: boolean`, `manutenzioneDataFineTs: number | null`

**Per archivio storico**: la dimensione "scadenze" sarebbe da modellare come **eventi sintetici** ricostruiti da questi campi (es. evento "Prenotazione collaudo" → eventuale evento "Completamento collaudo" → eventuale evento "Revisione scaduta"). NON c'è un singolo "record scadenza" persistito.

### 2.X `@storico_eventi_operativi` — Shape
Type NEXT: `NON TIPIZZATO IN NEXT` come record. È letto come `any[]` in [src/next/autisti/nextAutistiHomeEvents.ts:192](src/next/autisti/nextAutistiHomeEvents.ts#L192) e proiettato in `HomeEvent` (in [src/utils/homeEvents.ts](src/utils/homeEvents.ts)). Vedi §6 per shape osservata dal REGISTRO.

---

## 3. CAMPI COMUNI (PILASTRI DELL'ARCHIVIO)

Tabella di confronto sui 7 dataset autoctoni (esclude `@ordini` e `@mezzi_aziendali` perché shape strutturalmente diversa). Path:line riferito al type proiezione NEXT principale di ogni collezione.

| Campo logico | `@lavori` | `@manutenzioni` | `@segnalazioni` | `@controlli` | `@richieste` | `@rifornimenti` | `@storico_eventi` |
|---|---|---|---|---|---|---|---|
| **id** | `id` ([:131](src/next/domain/nextLavoriDomain.ts#L131)) | `id` ([:111](src/next/domain/nextManutenzioniDomain.ts#L111)) | `id` ([:129](src/next/domain/nextAutistiDomain.ts#L129)) | `id` ([:151](src/next/domain/nextAutistiDomain.ts#L151)) | `id` ([:171](src/next/domain/nextAutistiDomain.ts#L171)) | `id` ([:127](src/next/domain/nextRifornimentiDomain.ts#L127)) | `id` ([REGISTRO:612](docs/product/REGISTRO_COLLECTION_FIRESTORE.md#L612)) |
| **apertura — data legacy** | `dataInserimento` (string YYYY-MM-DD) | `data` (string legacy) | `timestamp` (number ms) | `timestamp` (number ms) | `timestamp` (number ms) | `dataDisplay` + `timestamp` | `timestamp` (number) |
| **apertura — timestamp** | `timestampInserimento` (proiezione [:73](src/next/domain/nextLavoriDomain.ts#L73)) | `timestamp` (proiezione [:65](src/next/domain/nextManutenzioniDomain.ts#L65)) | `timestamp` ✓ | `timestamp` ✓ | `timestamp` ✓ | `timestamp` ✓ | `timestamp` ✓ |
| **autore creazione** | `segnalatoDa` (string) | `eseguitoLabel` / `fornitoreLabel` (asimmetrico) | `autistaNome` + `badgeAutista` | `autistaNome` + `badgeAutista` | `autistaNome` + `badgeAutista` | `autistaNome` + `badgeAutista` | `nomeAutista`/`autistaNome` + `badgeAutista` |
| **targa mezzo** | `targa` + `mezzoTarga` | `targa` + `mezzoTarga` | `targa` | `targaMotrice` + `targaRimorchio` (2 campi distinti) | `targa` | `targa` + `mezzoTarga` | `dopo.targaMotrice` + `dopo.targaRimorchio` (nested) |
| **stato/lifecycle** | `eseguito` (boolean) + `statoVista` ("da_eseguire"/"in_attesa"/"eseguito") | NESSUNO — sempre "completato" | `chiusa` (boolean) + `stato` (string libera) | `chiuso` (boolean) | `evasa` (boolean) + `stato` | NESSUNO — sempre "completato" | `tipo` (es. CAMBIO_ASSETTO) |
| **timestamp chiusura** | `dataEsecuzione` (string) / `timestampEsecuzione` | NESSUNO (data intervento è già chiusura) | `dataChiusura` (number ms) | `dataChiusura` (number ms) | `dataEvasione` (number ms) | NESSUNO | NESSUNO |
| **autore chiusura** | `chiHaEseguito` (string) | NESSUNO | `chiusaBy` (string) — default `"centro_controllo_next"` | `chiusoBy` (string) | `evasaBy` (string) | NESSUNO | NESSUNO |
| **link a lavoro** | È il lavoro stesso | NESSUNO | `linkedLavoroId` (singolo) | `linkedLavoroIds[]` (array) | NESSUNO | NESSUNO | NESSUNO |
| **descrizione/note** | `descrizione` + `dettagli` | `descrizione` + `materiali[]` | `descrizione` | `note` + `koList[]` | `testo` | `note` | NESSUNO standard |
| **letta/admin flag** | NESSUNO | NESSUNO | `letta` | NESSUNO esplicito (`adminEdit` raw) | `letta` | NESSUNO | NESSUNO |

### 3.1 Mappa di mapping nomi → semantica unificata

Se si volesse normalizzare a una shape `ArchivioRecord` comune, ecco il mapping necessario:

| Campo unificato | lavori | manutenzioni | segnalazioni | controlli | richieste | rifornimenti | storico_eventi |
|---|---|---|---|---|---|---|---|
| `apertureTs` | `timestampInserimento` | `timestamp` (parseDateFlexible) | `timestamp` | `timestamp` | `timestamp` | `timestamp` | `timestamp` |
| `closureTs` | `timestampEsecuzione` | (= `timestamp` apertura) | `dataChiusura` | `dataChiusura` | `dataEvasione` | n/a (puntuale) | n/a |
| `openedBy` | `segnalatoDa` | `fornitoreLabel` | `autistaNome`+`badge` | `autistaNome`+`badge` | `autistaNome`+`badge` | `autistaNome`+`badge` | `nomeAutista`+`badge` |
| `closedBy` | `chiHaEseguito` | n/a | `chiusaBy` | `chiusoBy` | `evasaBy` | n/a | n/a |
| `targa` | `mezzoTarga` | `mezzoTarga` | `targa` | `targaMotrice` (con possibile rimorchio) | `targa` | `mezzoTarga` | `dopo.targaMotrice` |
| `kind/tipo` | `tipo` (magazzino/targa) | `tipo` (mezzo/compressore/attrezzature) | `tipo` raw | NESSUNO native (`koList` indica) | NESSUNO native | `tipo` raw | `tipo` (CAMBIO_ASSETTO ecc.) |
| `lifecycleState` | `statoVista` | "completato" | `chiusa ? "chiusa" : stato || "aperta"` | `chiuso ? "chiuso" : "aperto"` | `evasa ? "evasa" : stato` | "completato" | n/a |
| `linkedLavoro` | self | n/a | `linkedLavoroId` | `linkedLavoroIds[0]` (o tutti) | n/a | n/a | n/a |

**Osservazione critica**: le 7 collezioni espongono "stato di chiusura" con **5 nomi semantici diversi** (`eseguito` / `chiusa` / `chiuso` / `evasa` / nessuno) e **3 nomi diversi di campo autore chiusura** (`chiHaEseguito` / `chiusaBy` / `chiusoBy` / `evasaBy`). La normalizzazione è fattibile ma non triviale.

---

## 4. CAMPI DIVERGENTI

### 4.1 `@lavori`
- `gruppoId`, `sottoElementi`, `urgenza`, `tipo` magazzino/targa
- Sub-struct `source.{originType,originKey,originId}` per back-reference su segnalazione/controllo sorgente
- `dataEsecuzione` come **data fine lavoro** (semantica diversa da "chiusura segnalazione")

### 4.2 `@manutenzioni`
- `km`, `ore`, `sottotipo` (motrice/trattore/compressore)
- `materiali: NextManutenzioniLegacyMaterialRecord[]` (richiede sotto-tabella per dettaglio)
- `assiCoinvolti`, `gommePerAsse`, `gommeInterventoTipo`, `gommeStraordinario` (specifici gomme)
- `importo`, `sourceDocumentFileUrl`, `sourceDocumentCurrency` (legato a fattura)
- `tipo: "mezzo" | "compressore" | "attrezzature"` (3 tipologie distinte all'interno della stessa collezione)

### 4.3 `@segnalazioni_autisti_tmp`
- `tipo` libero (es. "freni", "gomme", "elettrico")
- `fotoCount` (foto allegate)
- `severita`, `tipoProblema`, `posizioneGomma`, `problemaGomma` presenti raw (non nel type proiezione)
- `descrizione` testuale lunga

### 4.4 `@controlli_mezzo_autisti`
- `koList: string[]` (lista voci check fallite) — semantica "checklist KO"
- `targaMotrice` + `targaRimorchio` (mai un solo campo `targa`)
- `linkedLavoroIds: string[]` (multipli — un controllo può generare 2 lavori per "entrambi")
- `linkedMultiple: true` quando `linkedLavoroIds.length > 1` ([src/components/AutistiEventoModal.tsx:574](src/components/AutistiEventoModal.tsx#L574))

### 4.5 `@richieste_attrezzature_autisti_tmp`
- `attrezzatura`, `attrezzaturaId`, `quantita` ([REGISTRO:1180](docs/product/REGISTRO_COLLECTION_FIRESTORE.md#L1180)) — non nel type proiezione
- Nessun campo lifecycle di "presa in carico" — solo `letta` + `evasa`
- `hasFoto` (derivato)

### 4.6 `@rifornimenti` (business)
- `litri`, `km`, `costo`, `valuta` (EUR/CHF), `distributore`, `metodoPagamento`, `paese`
- `provenienza: "business" | "campo" | "ricostruito"` (unisce 2 collezioni)
- `matchStrategy`, `sourceTrust` (matrice qualità)
- `fieldQuality` per ogni campo (qualità individuale)

### 4.7 `@ordini`
- `materials[]` (righe annidate ognuna con propria `arrived`, `arrivalTimestamp`, `unitPrice`)
- `state: "in_attesa" | "parziale" | "arrivato" | "vuoto"` (stato derivato dalle righe)
- `supplierId`, `supplierName` (fornitore esplicito)
- `orderReference`, `arrivedRows`, `pendingRows`
- **Ordini = dataset con sub-records (righe materiali)**: un componente lista-flat farebbe fatica a rendere il dettaglio righe.

### 4.X `@storico_eventi_operativi`
- `tipo` (es. `CAMBIO_ASSETTO`)
- `dopo` (object con `targaMotrice`, `targaRimorchio` post-evento) — shape **annidata**
- Nessun campo lifecycle (è già evento puntuale)

---

## 5. CATENA TEMPORALE PER COLLEZIONE

### 5.1 `@lavori`
- **Apertura**: `dataInserimento` ([nextLavoriDomain.ts:136](src/next/domain/nextLavoriDomain.ts#L136)) + `segnalatoDa` ([:140](src/next/domain/nextLavoriDomain.ts#L140))
- **Presa in carico**: NON TRACCIATA come campo dedicato (statoVista="in_attesa" si deriva da assenza di `dataEsecuzione` ma presenza di altri eventi su gruppoId — vedi [:46-62](src/next/domain/nextLavoriDomain.ts#L46-L62) outputContract)
- **Risoluzione**: `dataEsecuzione` ([:142](src/next/domain/nextLavoriDomain.ts#L142)) + `chiHaEseguito` ([:141](src/next/domain/nextLavoriDomain.ts#L141)) + `eseguito: true`
- **Link a lavoro**: self
- **BUCO**: presa in carico = no campo persistente. È inferenza dalla vista lavori-in-attesa.

### 5.2 `@manutenzioni`
- **Apertura**: `data` ([nextManutenzioniDomain.ts:118](src/next/domain/nextManutenzioniDomain.ts#L118)) — coincide con apertura ed esecuzione
- **Presa in carico**: NON TRACCIATA
- **Risoluzione**: stesso `data` (record creato a intervento avvenuto)
- **Link a lavoro**: NON TRACCIATO — non c'è back-reference a `@lavori` che ha generato l'intervento
- **BUCO**: la manutenzione è registrata come fatto già accaduto; manca traccia "richiesta → preventivo → ordine → manutenzione".

### 5.3 `@segnalazioni_autisti_tmp`
- **Apertura**: `timestamp` ([nextAutistiDomain.ts:130](src/next/domain/nextAutistiDomain.ts#L130)) + `autistaNome`/`badgeAutista` ([:132-133](src/next/domain/nextAutistiDomain.ts#L132-L133))
- **Presa in carico**: `letta: true` ([:137](src/next/domain/nextAutistiDomain.ts#L137)) + `stato === "presa_in_carico"` (raw, set quando lavoro creato dalla madre, vedi [AutistiEventoModal.tsx:561](src/components/AutistiEventoModal.tsx#L561))
- **Risoluzione**: `chiusa: true` ([:140](src/next/domain/nextAutistiDomain.ts#L140)) + `dataChiusura` ([:141](src/next/domain/nextAutistiDomain.ts#L141)) + `chiusaBy` ([:142](src/next/domain/nextAutistiDomain.ts#L142))
- **Link a lavoro**: `linkedLavoroId` ([:143](src/next/domain/nextAutistiDomain.ts#L143)) + `hasLinkedLavoro` ([:144](src/next/domain/nextAutistiDomain.ts#L144))
- **CATENA COMPLETA** — gold standard del modello

### 5.4 `@controlli_mezzo_autisti`
- **Apertura**: `timestamp` ([nextAutistiDomain.ts:152](src/next/domain/nextAutistiDomain.ts#L152)) + autista
- **Presa in carico**: NON TRACCIATA come booleano dedicato — `letta` esiste raw ma non nel type
- **Risoluzione**: `chiuso: true` + `dataChiusura` + `chiusoBy`
- **Link a lavoro**: `linkedLavoroIds[]` (multipli)
- **BUCO leggero**: nessun `stato === "presa_in_carico"` esplicito al type level (la madre setta solo `letta:true`, vedi [AutistiEventoModal.tsx:571](src/components/AutistiEventoModal.tsx#L571))

### 5.5 `@richieste_attrezzature_autisti_tmp`
- **Apertura**: `timestamp` + autista
- **Presa in carico**: `letta` ([nextAutistiDomain.ts:178](src/next/domain/nextAutistiDomain.ts#L178))
- **Risoluzione**: `evasa: true` ([:181](src/next/domain/nextAutistiDomain.ts#L181)) + `dataEvasione` + `evasaBy`
- **Link a lavoro**: NON TRACCIATO (le richieste attrezzature non generano lavori)
- **BUCO maggiore**: nessun collegamento all'ordine effettivo (l'autista chiede attrezzatura, ma il dataset non sa se è stata fornita via `@ordini` o magazzino)

### 5.6 `@rifornimenti`(+ `_autisti_tmp`)
- **Apertura**: `timestamp` (record puntuale)
- **Presa in carico**: NON APPLICABILE
- **Risoluzione**: coincide con apertura
- **Link a lavoro**: NON APPLICABILE
- **BUCO concettuale**: non è un "evento con lifecycle", è un fatto puntuale. Nell'archivio storico va trattato come "evento singolo".

### 5.7 `@ordini`
- **Apertura**: `orderTimestamp` ([nextProcurementDomain.ts:84](src/next/domain/nextProcurementDomain.ts#L84))
- **Presa in carico**: NON TRACCIATA
- **Risoluzione**: per riga, `arrivalTimestamp` per ognuna ([:64](src/next/domain/nextProcurementDomain.ts#L64)); a livello ordine `state === "arrivato"` quando tutte le righe arrivate
- **Link a lavoro**: NON TRACCIATO (potrebbe esistere `lavoroId` su `@materialiconsegnati`, vedi [REGISTRO:1060](docs/product/REGISTRO_COLLECTION_FIRESTORE.md#L1060))
- **BUCO concettuale**: ordine ha N risoluzioni (una per riga), non una catena lineare.

### 5.8 `@mezzi_aziendali` — scadenze inline
- **Apertura**: nessun timestamp di "apertura scadenza" — la scadenza nasce all'immatricolazione (`dataImmatricolazioneTs`)
- **Presa in carico**: `prenotazioneCollaudo.data` (data prenotazione) ([nextCentroControlloDomain.ts:86](src/next/domain/nextCentroControlloDomain.ts#L86))
- **Risoluzione**: `prenotazioneCollaudo.completata: true` + `prenotazioneCollaudo.completataIl` ([:91-92](src/next/domain/nextCentroControlloDomain.ts#L91-L92)) + `dataUltimoCollaudoTs` aggiornato
- **Link a lavoro**: NON TRACCIATO
- **BUCO**: la scadenza è uno **stato** del mezzo, non un evento. Le transizioni sono campi puntuali sul record mezzo; non c'è un append-only.

### 5.X `@storico_eventi_operativi`
- **Apertura**: `timestamp` ([REGISTRO:614](docs/product/REGISTRO_COLLECTION_FIRESTORE.md#L614))
- **Presa in carico**, **Risoluzione**, **Link a lavoro**: NON APPLICABILE — è un log eventi puntuali

---

## 6. `@storico_eventi_operativi` — VERDETTO

### 6.1 Esiste come collezione Firestore?
**Sì**. Path Firestore: `storage/@storico_eventi_operativi` ([REGISTRO:606-607](docs/product/REGISTRO_COLLECTION_FIRESTORE.md#L606-L607)). Confermato runtime in REGISTRO. Persiste via `setItemSync("@storico_eventi_operativi", ...)` in più punti:
- [src/autisti/LoginAutista.tsx:29](src/autisti/LoginAutista.tsx#L29) (login autista)
- [src/autisti/HomeAutista.tsx:60](src/autisti/HomeAutista.tsx#L60) (eventi home)
- [src/autisti/CambioMezzoAutista.tsx:71](src/autisti/CambioMezzoAutista.tsx#L71) (cambio assetto)
- [src/autisti/SetupMezzo.tsx:101](src/autisti/SetupMezzo.tsx#L101) (setup mezzo)
- [src/next/autistiInbox/NextAutistiAdminNative.tsx:1439, 1462](src/next/autistiInbox/NextAutistiAdminNative.tsx#L1439) (admin patch eventi)

### 6.2 Cosa contiene esattamente?
Da [REGISTRO:611-619](docs/product/REGISTRO_COLLECTION_FIRESTORE.md#L611-L619):
- `id`: string
- `tipo`: string — enum osservato: `CAMBIO_ASSETTO` (e probabilmente login/logout/setup, vedi writer)
- `timestamp`: number
- `nomeAutista`, `autistaNome`, `autista`: string
- `badgeAutista`: string
- `dopo`: object con `targaMotrice`/`targaRimorchio` post-evento

Lo si vede come "log eventi" di **azioni autista** (login, cambio mezzo, setup) — NON come log di lifecycle di segnalazioni/controlli/lavori.

### 6.3 Da quali collezioni viene popolata? Write-through o aggregatore async?
**Né write-through delle 8 collezioni, né aggregatore async**. È un **log indipendente** scritto direttamente dai flussi autista (login, cambio mezzo, setup mezzo, eventi home). I writer NEXT delle 8 collezioni operative (lavori/manutenzioni/segnalazioni/controlli/richieste/rifornimenti/ordini) **NON scrivono** mai su `@storico_eventi_operativi` (verificato via grep — nessuno dei file in `src/next/next*Writer.ts` lo tocca).

Reader NEXT lo legge per costruire `HomeEvent[]` insieme alle altre collezioni — ma il merge è lato lettore, non lato persistenza ([src/next/autisti/nextAutistiHomeEvents.ts:192](src/next/autisti/nextAutistiHomeEvents.ts#L192)).

### 6.4 Verdetto
**PARZIALMENTE — NO come fonte unica.** `@storico_eventi_operativi` è un dataset di **eventi autista** specifici (CAMBIO_ASSETTO, login, logout, setup). NON copre apertura/chiusura di segnalazioni/controlli/lavori/manutenzioni/ordini.

Per un archivio storico universale:
- ✗ NON può sostituire la lettura diretta delle 8 collezioni: mancano gli eventi di lifecycle delle altre collezioni operative
- ✓ PUÒ essere una delle tab/sezioni dell'archivio (es. "Storico azioni autisti")
- ⚠ Se si vuole un vero log unificato, andrebbe **esteso** (con nuovi writer che appendono evento "segnalazione chiusa", "controllo evaso", ecc.) ma questo è uno scope grande e va valutato a parte.

---

## 7. ENTRY POINT ESISTENTI

Pagine NEXT che mostrano storico/lista di queste collezioni (verificato via Glob su src/next):

| Pagina NEXT | Collezione mostrata | Path |
|---|---|---|
| Centro Controllo NEXT (V2 Sinottica) | segnalazioni, controlli, richieste, lavori, rifornimenti (chip) | [src/next/NextCentroControlloParityPage.tsx](src/next/NextCentroControlloParityPage.tsx) |
| Lavori da eseguire | lavori (filtro non-eseguiti) | [src/next/NextLavoriDaEseguirePage.tsx](src/next/NextLavoriDaEseguirePage.tsx) |
| Dettaglio Lavoro | lavoro singolo + segnalazione/controllo sorgente | [src/next/NextDettaglioLavoroPage.tsx](src/next/NextDettaglioLavoroPage.tsx) |
| Manutenzioni | manutenzioni storico | [src/next/NextManutenzioniPage.tsx](src/next/NextManutenzioniPage.tsx) |
| Acquisti | ordini stato confermato/arrivato | [src/next/NextAcquistiPage.tsx](src/next/NextAcquistiPage.tsx) |
| Materiali da Ordinare | ordini stato pending | [src/next/NextMaterialiDaOrdinarePage.tsx](src/next/NextMaterialiDaOrdinarePage.tsx) |
| Scadenze Collaudi | campi scadenza di mezzi_aziendali | [src/next/NextScadenzeCollaudiPage.tsx](src/next/NextScadenzeCollaudiPage.tsx) |
| Autisti Admin (inbox) | segnalazioni + controlli + richieste + rifornimenti + log eventi | [src/next/autistiInbox/NextAutistiAdminNative.tsx](src/next/autistiInbox/NextAutistiAdminNative.tsx) |
| Autisti Segnalazioni All | segnalazioni autista | [src/next/autistiInbox/NextAutistiSegnalazioniAllNative.tsx](src/next/autistiInbox/NextAutistiSegnalazioniAllNative.tsx) |
| Autisti Controlli All | controlli autista | [src/next/autistiInbox/NextAutistiControlliAllNative.tsx](src/next/autistiInbox/NextAutistiControlliAllNative.tsx) |
| Autisti Richieste All | richieste autista | [src/next/autistiInbox/NextRichiestaAttrezzatureAllNative.tsx](src/next/autistiInbox/NextRichiestaAttrezzatureAllNative.tsx) |
| Autisti Log Accessi All | storico_eventi_operativi (filtro login) | [src/next/autistiInbox/NextAutistiLogAccessiAllNative.tsx](src/next/autistiInbox/NextAutistiLogAccessiAllNative.tsx) |
| Autisti Inbox Home | aggregata multi-collezione (chip) | [src/next/autistiInbox/NextAutistiInboxHomeNative.tsx](src/next/autistiInbox/NextAutistiInboxHomeNative.tsx) |
| Dossier Mezzo | aggregata per singolo mezzo (rifornimenti, manutenzioni, lavori) | [src/next/NextDossierMezzoPage.tsx](src/next/domain/nextDossierMezzoDomain.ts) |
| Mappa Storico | aggregata su `@storico_eventi_operativi` + altri | [src/next/domain/nextMappaStoricoDomain.ts](src/next/domain/nextMappaStoricoDomain.ts) |
| Operatività Globale / Tecnica | aggregata multi-collezione | [src/next/NextOperativitaGlobalePage.tsx](src/next/NextOperativitaGlobalePage.tsx), [src/next/nextOperativitaTecnicaDomain.ts](src/next/nextOperativitaTecnicaDomain.ts) |

**Memo importante**: già esiste un set di pagine "All" per ogni collezione autisti (5 collezioni: segnalazioni, controlli, richieste, rifornimenti, log accessi) sotto `src/next/autistiInbox/*Native.tsx`. Un "Archivio storico universale" non parte da zero — ha già 5 pagine prototipo da consolidare.

---

## 8. RACCOMANDAZIONE TECNICA

### 8.1 Verdetto

**RACCOMANDAZIONE: STRADA 3** — componente `<StoricoLista>` riusabile + hub con tab + escape hatch per collezioni divergenti.

### 8.2 Motivazione (basata su evidenza)

1. **Shape eterogenee dichiarate al type level**, non solo nel raw: i 7 type proiezione di domain (§2) mostrano **3 nomi semantici diversi per "chiusura"** (`chiusa`/`chiuso`/`evasa`/`eseguito`/n/a) e **4+ nomi per "autore"** (`segnalatoDa`/`autistaNome`/`fornitoreLabel`/`badgeAutista`/`chiusaBy`/`chiusoBy`/`evasaBy`/`chiHaEseguito`). Un componente unico config-driven (Strada 2) richiederebbe un layer di mapping per ogni campo logico — fattibile ma con costo cognitivo alto. Vedi §3.1 mappa di mapping.

2. **Catene temporali non uniformi** (§5): `@manutenzioni` e `@rifornimenti` sono **eventi puntuali senza lifecycle**; `@ordini` ha **lifecycle a livello riga**; `@mezzi_aziendali` ha **scadenze come campi statici inline**; `@storico_eventi_operativi` è già **log eventi**. Un componente che presume sempre {apertura → in_carico → chiusura → linkedLavoro} faticherebbe su 4 collezioni su 9.

3. **Sub-records annidati**: `@ordini.materials[]` (righe), `@manutenzioni.materiali[]` (righe), `@controlli.koList[]`/`@controlli.linkedLavoroIds[]` (array). Componente unico flat-table dovrebbe gestire 3 modi diversi di rendere il dettaglio annidato.

4. **5 pagine prototipo già esistono**: §7 mostra 5 pagine `*All*Native.tsx` (segnalazioni/controlli/richieste/rifornimenti/log accessi) come implementazioni per-collezione. Strada 1 (N pagine sorelle) significherebbe consolidarle e aggiungere altre 3-4. Sforzo di duplicazione codice alto.

5. **Filtri richiesti uniformi**: il prompt chiede "stato, mezzo (targa), autista, data range, tipo" — questi sono effettivamente comuni alle 5 collezioni con lifecycle (segnalazioni/controlli/richieste/lavori + storico eventi) — quindi un componente filtri condiviso ha senso e copre la maggioranza dei casi.

### 8.3 Quali collezioni richiedono escape hatch (componenti dedicati)?

Sulla base di §4-5:

| Collezione | Componente | Motivazione |
|---|---|---|
| `@lavori` | `<StoricoLista>` shared | catena completa, shape adattabile (escape NON serve) |
| `@manutenzioni` | **ESCAPE HATCH** custom | materiali annidati + tipi 3-way (mezzo/compressore/attrezzature) + costo+documento+gomme; carico cognitivo troppo specifico |
| `@segnalazioni_autisti_tmp` | `<StoricoLista>` shared | catena gold standard |
| `@controlli_mezzo_autisti` | `<StoricoLista>` shared con prop `multiTarga` | targaMotrice+Rimorchio + koList[] + linkedLavoroIds[] gestibili con prop di config |
| `@richieste_attrezzature_autisti_tmp` | `<StoricoLista>` shared | catena semplice senza linkedLavoro |
| `@rifornimenti` (+tmp) | **ESCAPE HATCH** custom | shape ricchissima (litri/km/costo/valuta/distributore/metodoPagamento/paese) + qualità per campo + 2 dataset uniti; rendering "evento puntuale" diverso dal lifecycle |
| `@ordini` | **ESCAPE HATCH** custom | righe annidate con propria lifecycle per riga; UI naturalmente diversa (tabella ordini + tabella righe) |
| `@mezzi_aziendali` (scadenze) | **ESCAPE HATCH** custom | non è lista append-only, è cruscotto stato corrente per mezzo |
| `@storico_eventi_operativi` | `<StoricoLista>` shared con prop `eventOnly: true` | log puntuale, niente chiusura/autore_chiusura |

**Bilancio**: 5 collezioni con `<StoricoLista>` shared, 4 con escape hatch dedicato. Strada 3 si adatta esattamente a questa partizione.

### 8.4 Perché NON Strada 1 (N pagine sorelle)
- Costo cognitivo + duplicazione codice + difficoltà manutenzione filtri uniformi
- Le 5 pagine `*All*Native.tsx` esistenti già mostrano segnali di duplicazione (filtri simili, layout simili)
- Cambiare un filtro = toccare 9 pagine

### 8.5 Perché NON Strada 2 (1 pagina universale config-driven)
- Le 4 collezioni con escape hatch (manutenzioni/rifornimenti/ordini/scadenze) richiederebbero "config esplose" con escape points logici — finirebbe in `if (kind === "ordini") renderRows() else if ...` annidati
- Tempo di sviluppo iniziale alto per coprire tutti i casi divergenti
- Quando arriva una nuova collezione divergente, la config si "rompe" o si gonfia

### 8.6 Strada 3 — schema architettoniche suggerito (alto livello, **NESSUN CODICE**)
- Hub `/next/archivio-storico` con tab orizzontali
- Per ogni tab: un componente specifico (per collezione semplice usa `<StoricoLista>` shared, per collezione complessa usa pagina dedicata wrapped in tab)
- Filtri comuni in toolbar (data range, autista, mezzo) — gestiti dall'hub, passati come props
- Filtri specifici (es. stato ordine, tipo manutenzione) — gestiti dal componente di tab
- Riuso dei reader esistenti `readNextAutisti*`, `readNextManutenzioni*`, `readNextProcurement*`, `readNextRifornimenti*` (zero scrittura, solo lettura, R0 garantito)

---

## 9. RISCHI E PUNTI APERTI

### 9.1 Ambiguità nel codice
- **Segnalazione vs Controllo asimmetria stato**: `@segnalazioni` ha `chiusa: boolean` + `stato: string`; `@controlli` ha solo `chiuso: boolean` (senza `stato` proiettato al type). Il `stato === "presa_in_carico"` è settato sulla segnalazione dalla madre ([AutistiEventoModal.tsx:561](src/components/AutistiEventoModal.tsx#L561)) ma NON sul controllo (vedi [:571](src/components/AutistiEventoModal.tsx#L571), solo `letta:true`). L'archivio storico dovrà decidere se sintetizzare "presa in carico" anche per i controlli o ammettere asimmetria UX.
- **Sigle multiple per targa nei controlli**: `targaMotrice` + `targaRimorchio` (entrambi presenti) — quale mostrare nella colonna "Mezzo"? Concatenarli? Mostrare la motrice?
- **`@rifornimenti` vs `@rifornimenti_autisti_tmp`**: lo stesso evento di rifornimento può esistere in **entrambi** i dataset (provenienza="business" vs "campo"); il reader li fonde con `matchStrategy` ([:145](src/next/domain/nextRifornimentiDomain.ts#L145)). L'archivio storico deve decidere se mostrarli uniti o separati.
- **`@manutenzioni.gommeStraordinario.asseId`**: tipo `AsseCoinvoltoId | null` ma il type **non è esportato** ([nextManutenzioniDomain.ts:158](src/next/domain/nextManutenzioniDomain.ts#L158)). Consumer esterni vedono solo `string | null`.

### 9.2 Conflitti REGISTRO vs codice (rilevati)
- **REGISTRO non lista `manutenzioneContrattoAttivo` su `NextFlottaClonePatchRecord`**: fixato in PROMPT 27.15 nel codice ([nextFlottaCloneState.ts:22](src/next/nextFlottaCloneState.ts#L22)) ma il REGISTRO non documenta il campo a livello di `@mezzi_aziendali` collection page. Disallineamento minore — non blocca l'archivio.
- **REGISTRO documenta come "BOUNDARY VERIFICATA RUNTIME"** che le allowedFields di `@segnalazioni_autisti_tmp` NON includono `descrizione`, `note`, `letta`, `linkedLavoroId` ([REGISTRO:1231](docs/product/REGISTRO_COLLECTION_FIRESTORE.md#L1231) "campi reali non in allowedFields"). Tuttavia il codice NEXT li legge tutti via `getItemSync` (canale storage non passa per boundary AI). **Implicazione**: l'archivio storico può mostrarli purché NON usi il canale AI per Driver360 — passare per `getItemSync` resta consentito.
- **REGISTRO scrive "scadenze collaudi"** come operazioni tipiche di `@officine` ([REGISTRO:1118](docs/product/REGISTRO_COLLECTION_FIRESTORE.md#L1118)) ma non c'è una **collezione** scadenze: confermato §1.8 — le scadenze sono campi inline su `@mezzi_aziendali`.

### 9.3 Catene temporali incomplete che limitano UX richiesta
- **"Presa in carico"** richiesta da Giuseppe per ogni record: tracciata SOLO su `@segnalazioni` (via `stato: "presa_in_carico"` + `letta`) e implicitamente su `@richieste` (via `letta`). NON tracciata su `@lavori`, `@manutenzioni`, `@controlli` (solo `letta` su questi ultimi), `@rifornimenti`, `@ordini`, `@scadenze`. Per 6/9 collezioni la "presa in carico" sarà un campo vuoto o derivato.
- **"Autore chiusura"** per `@lavori`: `chiHaEseguito` è **escluso dal boundary AI** by-design ([REGISTRO:1007](docs/product/REGISTRO_COLLECTION_FIRESTORE.md#L1007) "Campi esclusi"). Per archivio storico NEXT (non AI) è leggibile via storage, ma l'utente deve sapere che la chat IA non lo vede.
- **"Link a lavoro" su `@richieste_attrezzature_autisti_tmp`**: NON ESISTE. Le richieste attrezzature non generano lavori. Mostrarlo in una colonna "Lavoro" produrrebbe sempre vuoto.
- **"Risoluzione" su `@rifornimenti` e `@manutenzioni`**: coincide con apertura. Una colonna "Chiuso il" sarebbe ridondante con "Aperto il" per queste 2 collezioni.

### 9.4 Domande aperte per Giuseppe (decisioni richieste prima di procedere)

1. **Estensione `@storico_eventi_operativi`**? Vuoi che ogni `markSegnalazioneChiusa` / `markControlloChiuso` / `markRichiestaEvasa` / `createLavoroFromEvento` appenda un evento sintetico nel log unificato? È un upgrade architetturale separato (PROMPT 28.x?) che renderebbe il log la vera fonte unica per la timeline.
2. **Hub archivio: rotta `/next/archivio-storico` nuova o estensione delle pagine inbox esistenti**? Le 5 `*All*Native.tsx` sotto `autistiInbox/` sono candidate naturali per consolidamento ma il nome "autisti inbox" è limitato al contesto operatore-autisti.
3. **Filtro "tipo" richiesto**: ha senso per `@segnalazioni` (freni/gomme/elettrico/altro), per `@manutenzioni` (mezzo/compressore/attrezzature), per `@ordini` (state). Non ha senso per `@rifornimenti`, `@controlli`, `@richieste` (campo non discriminante o assente). Vuoi che il filtro `tipo` sia dinamico per tab?
4. **Soft-delete vs hard-delete**: il modello attuale `chiusa/chiuso/evasa` è soft-delete (record resta visibile con filtro). L'archivio storico mostrerebbe ANCHE i record soft-deleted o solo quelli aperti? Se ANCHE quelli chiusi, allora il filtro deve avere `stato: aperto | chiuso | tutti` — non esiste oggi tra i filtri proposti.
5. **`@ordini` con sub-rows**: come renderizzare? Tabella ordini cliccabile che apre modale-righe? O righe inline expanded? Le righe `arrived: boolean` per ognuna creano una matrix che il componente shared non gestirebbe naturalmente.

---

## 10. ALLEGATO — RICERCHE ESEGUITE

Comandi `rg`/Grep tool eseguiti durante l'audit (in ordine cronologico, sintetizzati):

```bash
# Inventario collezioni in NEXT
rg -l "@lavori|@manutenzioni|@segnalazioni_autisti_tmp|@controlli_mezzo_autisti|@richieste_attrezzature_autisti_tmp|@rifornimenti|@rifornimenti_autisti_tmp|@materiali_da_ordinare|@acquisti|@scadenze|@storico_eventi_operativi" src/next/

# storico_eventi_operativi cross-repo
rg -n "storico_eventi_operativi|STORICO_EVENTI" src/

# Cerca KEY costanti per identificare collezioni
rg -n "\"@materiali_da_ordinare\"|\"@acquisti\"|\"@scadenze_collaudi\"|\"@scadenze_mezzi\"|\"@scadenze\"|MATERIALI_DA_ORDINARE_KEY|ACQUISTI_KEY|SCADENZE_KEY" src/next/

# Pattern key esistenti
rg -n "\"@lavori\"|\"@manutenzioni\"|\"@segnalazioni_autisti_tmp\"|\"@controlli_mezzo_autisti\"|\"@richieste_attrezzature_autisti_tmp\"|\"@rifornimenti\"|\"@rifornimenti_autisti_tmp\"" src/next/

# Procurement
rg -n "@preventivi|@ordini|@listino_prezzi|@costiMezzo|MATERIALI_DA_ORDINARE_KEY|PROCUREMENT|nextProcurement" src/next/

# Glob file scadenze/procurement/acquisti/materiali
glob "src/next/**/{*Scadenze*,*Procurement*,*Acquisti*,*Materiali*}*"

# Sezioni REGISTRO
rg -n "^### " docs/product/REGISTRO_COLLECTION_FIRESTORE.md
rg -n "@manutenzioni|@lavori|@inventario|@materialiconsegnati" docs/product/REGISTRO_COLLECTION_FIRESTORE.md

# Type definitions in domain readers
rg -n "^export type Next" src/next/domain/nextLavoriDomain.ts
rg -n "^export type Next" src/next/domain/nextAutistiDomain.ts
rg -n "^export type Next" src/next/domain/nextManutenzioniDomain.ts
rg -n "^export type Next" src/next/domain/nextRifornimentiDomain.ts
rg -n "PROCUREMENT|@ordini|@preventivi|MATERIALI_DA_ORDINARE|ACQUISTI" src/next/domain/nextProcurementDomain.ts
```

File letti integralmente (Read tool):
- `src/utils/cloneWriteBarrier.ts` (linee 1-200 e 466-498 zoom)
- `src/next/nextScadenzeCollaudiWriter.ts` (linee 1-50)
- `src/next/domain/nextLavoriDomain.ts` (linee 1-100, 45-244)
- `src/next/domain/nextAutistiDomain.ts` (linee 128-205)
- `src/next/domain/nextRifornimentiDomain.ts` (linee 126-195)
- `src/next/domain/nextProcurementDomain.ts` (linee 1-100)
- `src/next/domain/nextManutenzioniDomain.ts` (precedentemente letto integralmente in PROMPT 27.14 audit)
- `src/components/AutistiEventoModal.tsx` (linee 1-50, 248-272, 480-590, 1065-1207 — solo madre legacy, scope letture)
- `docs/product/REGISTRO_COLLECTION_FIRESTORE.md` (linee 1-60 indice + 606-660 + 832-1310 sezioni collection)

Fine report.
