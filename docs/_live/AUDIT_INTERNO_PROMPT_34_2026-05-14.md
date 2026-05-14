# AUDIT INTERNO PROMPT 34

> Audit pre-implementazione per macchina di chiusura ciclo evento -> segnalazioni/manutenzioni.
> Generato il 2026-05-14 prima di modifiche runtime.
> Scope: @manutenzioni, @segnalazioni_autisti_tmp, @controlli_mezzo_autisti, flusso import gomme.

## File da modificare per fase

### F2 Schema stati

- `src/next/domain/nextManutenzioniDomain.ts:91`
  Type `NextManutenzione` espone `stato: NextManutenzioneStato`.
- `src/next/domain/nextManutenzioniDomain.ts:525`
  Fallback stato: i record senza stato vengono letti come eseguiti se hanno segnali di esecuzione, altrimenti da fare.
- `src/next/domain/nextSegnalazioniControlliDomain.ts:33`
  Type `NextOrigineRecord` espone `stato: string | null`.
- `src/next/domain/nextAutistiDomain.ts:488`
  Lettura stato segnalazioni autisti da `raw.stato`.
- `src/next/domain/nextAutistiDomain.ts:743`
  Lettura stato controlli mezzo da `raw.stato`.

### F3 Reader/Writer

- `src/next/domain/nextManutenzioniDomain.ts:525`
  Sanitizer/fallback stato da estendere per mantenere `chiusa_da_evento`.
- `src/next/domain/nextManutenzioniDomain.ts:876`
  `readNextManutenzioniDaFareSnapshot` filtra solo `stato === "daFare"`.
- `src/next/domain/nextManutenzioniDomain.ts:883`
  `readNextManutenzioniDaFareEProgrammateSnapshot` filtra `daFare` o `programmata`.
- `src/next/domain/nextSegnalazioniControlliDomain.ts:184`
  Dettaglio origine espone stato.
- `src/next/domain/nextSegnalazioniControlliDomain.ts:227`
  Ricerca record origine per targa/tipo.
- `src/next/domain/nextAutistiDomain.ts:488`
  Reader segnalazioni autisti.
- `src/next/domain/nextAutistiDomain.ts:743`
  Reader controlli mezzo.
- `src/next/writers/nextChiusuraEventoWriter.ts`
  Nuovo writer dedicato: chiusura manutenzione, segnalazione, controllo da evento.
- `src/utils/cloneWriteBarrier.ts`
  Nuovo scope di update strettamente limitato a `{stato, chiusuraDi, chiusuraRefId, chiusuraData}`.

### F4 Filtri tab/lista

- `src/next/NextManutenzioniPage.tsx:329`
  `resolveMaintenanceStato` oggi degrada ogni stato non `programmata/eseguita` a `daFare`.
- `src/next/NextManutenzioniPage.tsx:332`
  `maintenanceStatusLabel` non conosce `chiusa_da_evento`.
- `src/next/NextManutenzioniPage.tsx:467`
  PDF label data tratta `daFare/programmata` come in programma.
- `src/next/NextManutenzioniPage.tsx:472`
  PDF classifica operative solo `daFare/programmata`.
- `src/next/NextManutenzioniPage.tsx:1300`
  Tab da fare filtra `daFare/programmata`.
- `src/next/domain/nextDossierMezzoDomain.ts:649`
  Summary dossier conta `item.stato !== "eseguita"` come da fare/programmate.
- `src/next/domain/nextDossierMezzoDomain.ts:889`
  Dossier marca `eseguita` con check `item.stato === "eseguita"`.
- `src/next/domain/nextDossierMezzoDomain.ts:912`
  Dossier `manutenzioniDaFare` filtra `daFare/programmata`.
- `src/next/domain/nextDossierMezzoDomain.ts:915`
  Dossier `manutenzioniEseguite` filtra `eseguita`.
- `src/next/nextOperativitaTecnicaDomain.ts:147`
  KPI/operativita aperte usa `item.stato !== "eseguita"`.
- `src/next/nextOperativitaTecnicaDomain.ts:150`
  Storico operativita filtra `eseguita`.
- `src/next/centroControllo/archivioStorico/hooks/useArchivioFilters.ts:291`
  Filtro stato archivio usa `record.data.stato ?? "eseguita"`.
- `src/next/centroControllo/archivioStorico/ArchivioFeed.tsx:193`
  Type visuale stato archivio contiene solo `daFare | programmata | eseguita`.

### F5 UI Tooltip/Badge

#### Manutenzioni

- `src/next/NextManutenzioniPage.tsx:329`
  Normalizzazione stato per badge.
- `src/next/NextManutenzioniPage.tsx:332`
  Label stato.
- `src/next/NextManutenzioniPage.tsx:2207`
  Payload PDF Quadro manutenzioni contiene colonna stato, da non confondere con nuovo badge UI.
- `src/next/NextManutenzioniPage.tsx:3390`
  Area dettaglio/origine gia' contiene pattern modale read-only riusabile come riferimento.

#### Centro Controllo Archivio

- `src/next/centroControllo/archivioStorico/rows/ArchivioRowManutenzione.tsx:48`
  `statusLabelMap` contiene solo tre stati.
- `src/next/centroControllo/archivioStorico/rows/ArchivioRowManutenzione.tsx:55`
  `statusClassMap` contiene solo tre stati.
- `src/next/centroControllo/archivioStorico/rows/ArchivioRowManutenzione.tsx:73`
  Fallback stato archivio manutenzione a `eseguita`.

#### Dossier Mezzo

- `src/next/domain/nextDossierMezzoDomain.ts:889`
  Costruzione stato/label delle manutenzioni dossier.
- `src/next/NextDossierMezzoPage.tsx`
  Superficie UI del dossier in cui mostrare badge e tooltip sulle manutenzioni.

### F6 Modale import gomme

- `src/next/autistiInbox/NextAutistiAdminNative.tsx:1606`
  `importGommeRecord(record)` e' il punto unico di import verso `@gomme_eventi`.
- `src/next/autistiInbox/NextAutistiAdminNative.tsx:1620`
  Dopo import il record tmp gomme viene marcato `stato: "importato"`.
- `src/next/autistiInbox/NextAutistiAdminNative.tsx:2778`
  Bottone UI che invoca `importGommeRecord(r)`.
- `src/next/domain/nextManutenzioniGommeDomain.ts:17`
  `GOMME_TMP_KEY`.
- `src/next/domain/nextManutenzioniGommeDomain.ts:18`
  `GOMME_EVENTI_KEY`.
- `src/next/components/NextImportGommeChiusuraModal.tsx`
  Nuovo componente modale multi-select.

### F7 Chat IA

- `src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts:71`
  Snapshot chat IA considera aperte solo `daFare/programmata`.
- `src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts:75`
  Snapshot chat IA considera chiuse solo `eseguita`.
- `src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts:100`
  Output manutenzioni eseguite.
- `src/next/chat-ia/tools/registry/toolSearchWorkOrders.ts`
  Tool di ricerca manutenzioni, da aggiornare per non trattare `chiusa_da_evento` come aperta o eseguita classica.
- `src/next/chat-ia/tools/registry/toolGetVehicleTimeline360.ts`
  Timeline mezzo, da includere come stato separato.
- `src/next/chat-ia/agents/analytics.ts:429`
  Report legge `row.stato`.
- `src/next/chat-ia/agents/specialists/operazioniAgent.ts`
  Prompt/descrizioni operative devono sapere che i lavori sono alias semantico delle manutenzioni e che `chiusa_da_evento` e' stato separato.

## Punti di rischio

- `src/next/NextManutenzioniPage.tsx:329`: qualunque stato sconosciuto diventa `daFare`. Se non aggiornato, `chiusa_da_evento` riapparirebbe nella tab da fare.
- `src/next/domain/nextDossierMezzoDomain.ts:649`: il conteggio `item.stato !== "eseguita"` trasformerebbe `chiusa_da_evento` in manutenzione aperta.
- `src/next/nextOperativitaTecnicaDomain.ts:147`: stesso rischio per KPI/sinottica, perche' considera aperto tutto cio' che non e' `eseguita`.
- `src/next/centroControllo/archivioStorico/ArchivioFeed.tsx:193`: type UI a tre stati puo' rompere TypeScript o nascondere il badge nuovo.
- `src/next/centroControllo/archivioStorico/rows/ArchivioRowManutenzione.tsx:48`: label/classi hardcoded non coprono il nuovo stato.
- `src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts:75`: `chiusa_da_evento` non va sommata alle eseguite classiche se la risposta deve distinguere "chiusa da evento".
- `src/next/autistiInbox/NextAutistiAdminNative.tsx:1606`: se la modale viene aperta dopo la scrittura evento, non e' possibile abortire senza creare evento; deve aprirsi prima della scrittura.
- `src/utils/cloneWriteBarrier.ts`: lo scope update deve permettere solo campi di chiusura, altrimenti riapre scritture generiche su collection sensibili.

## Record target script una-tantum

- daFare id: `from-lavoro-a5ba1512-2961-40a9-9c00-a27b6559bef2`
- @gomme_eventi id: `554348b3-f6ec-40e8-a861-6873af7cce56`
- targa: `TI298409`
- descrizione: `Segnalazione: gomme - 4 gomme di trazione usurate, quasi finite. Da sostituire`
- dataInserimento daFare: `2026-05-08`
- data cambio gomme: `2026-05-12`
- distanza: `4 giorni`

## Numeri discovery di riferimento

- @manutenzioni totali: `75`
- @gomme_eventi totali: `11`
- daFare gomme aperte: `2`
- match alta probabilita' 0-30 giorni: `1`
- orfani senza match: `1`

## Esito F1

Audit completato. Le fasi F2-F7 possono procedere sui file elencati sopra, aggiornando questa mappa se durante la patch emergono ulteriori punti letti/scritti dai comandi gia' eseguiti.

## PROMPT 36 mappa file

### Dettaglio manutenzione daFare

- `src/next/NextManutenzioniPage.tsx:3804`
  Monta `NextMappaStoricoPage` nel tab dettaglio/mappa e passa `selectedMaintenance`, `onEditLatest`, `onDelete`.
- `src/next/NextMappaStoricoPage.tsx:661`
  Header dettaglio manutenzione selezionata.
- `src/next/NextMappaStoricoPage.tsx:669`
  Barra azioni del dettaglio manutenzione (`Modifica`, `Apri dossier`, `Apri documento`, `Scarica PDF`, `Elimina`). Qui entrano `Aggancia evento` e `Sgancia evento`.

### Dettaglio segnalazione autista

- `src/next/autistiInbox/NextAutistiAdminNative.tsx:2566`
  Riga segnalazione apre `openAdminEdit("segnalazione", r, r.id)`.
- `src/next/autistiInbox/NextAutistiAdminNative.tsx:3022`
  Modale edit admin condiviso.
- `src/next/autistiInbox/NextAutistiAdminNative.tsx:3233`
  Branch campi specifici segnalazione (`tipoProblema`, `descrizione`, `note`).
- `src/next/autistiInbox/NextAutistiAdminNative.tsx:3477`
  Barra azioni modale edit (`ANNULLA`, `ELIMINA`, `SALVA`). Qui entrano `Aggancia evento` e `Sgancia evento` per segnalazioni gomme.

### Dettaglio controllo KO

- `src/next/autistiInbox/NextAutistiAdminNative.tsx:2692`
  Riga controllo apre `openAdminEdit("controllo", r, r.id)`.
- `src/next/autistiInbox/NextAutistiAdminNative.tsx:3022`
  Modale edit admin condiviso.
- `src/next/autistiInbox/NextAutistiAdminNative.tsx:3269`
  Branch campi specifici controllo (`target`, check gomme/freni/luci/perdite).
- `src/next/autistiInbox/NextAutistiAdminNative.tsx:3477`
  Barra azioni modale edit. Qui entrano `Aggancia evento` e `Sgancia evento` per controlli KO gomme.

### Helper e writer Prompt 36

- `src/next/helpers/eventiCompatibili.ts`
  Nuovo helper read-only per cercare eventi compatibili, oggi solo `gomme_evento`.
- `src/next/components/NextAggancioEventoModal.tsx`
  Nuova modale radio singolo-evento con sezioni `Suggeriti` e `Altri`.
- `src/next/writers/nextChiusuraEventoWriter.ts`
  Estensione con writer di sgancio simmetrici.
- `src/utils/cloneWriteBarrier.ts:159`
  Scope `next_chiusura_da_evento_write_scope`, da mantenere stretto anche per sgancio.

## PROMPT 38d mappa

### NextManutenzioniPage / sidebar storico + dettaglio

- `src/next/NextManutenzioniPage.tsx:1318`
  Costruisce `storicoMezzo` filtrando `storico` per targa.
- `src/next/NextManutenzioniPage.tsx:1322`
  Costruisce `storicoMezzoOrdinato`, sorgente della sidebar "Storico Manutenzioni" e degli ultimi interventi.
- `src/next/NextManutenzioniPage.tsx:1345`
  `selectedDetailRecord` cerca ancora nel dataset completo `storico`, quindi il dettaglio diretto puo' restare accessibile anche se una voce viene nascosta dalle liste storiche.
- `src/next/NextManutenzioniPage.tsx:3882`
  Monta `NextMappaStoricoPage` e passa `storicoManutenzioni={storicoMezzoOrdinato}`.
- `src/next/NextMappaStoricoPage.tsx:320`
  Calcola i conteggi dei filtri dalla lista ricevuta.
- `src/next/NextMappaStoricoPage.tsx:339`
  Calcola `filteredStorico` per la lista laterale.
- `src/next/NextMappaStoricoPage.tsx:621`
  Renderizza le righe della sidebar storico manutenzioni.
- `src/next/NextMappaStoricoPage.tsx:834`
  Dettaglio "Descrizione intervento": punto naturale per integrare `StoriaRecordTimeline` sopra i dettagli gomme.

### Dossier Mezzo

- `src/next/domain/nextDossierMezzoDomain.ts:891`
  `mapManutenzioneToLegacyWorkItem()` trasforma i record manutenzione in item per la card `Manutenzioni`.
- `src/next/domain/nextDossierMezzoDomain.ts:923`
  `lavoriEseguiti` include oggi anche `stato === "chiusa_da_evento"`, generando la voce satellite separata.
- `src/next/domain/nextDossierMezzoDomain.ts:995`
  `legacy.manutenzioni` usa `mapNextManutenzioniItemsToLegacyView()` dal layer gomme/manutenzioni: va filtrato per non mostrare satelliti nello storico sintetico.
- `src/next/NextDossierMezzoPage.tsx:581`
  Card `Manutenzioni` con gruppo `Eseguite`: renderizza i satelliti se arrivano dal domain.
- `src/next/NextDossierMezzoPage.tsx:586`
  Card `Storico manutenzioni`: usa `legacy.manutenzioni`.
- `src/next/NextDossierMezzoPage.tsx:590`
  Card `Eventi gomme straordinari`: superficie collegata agli eventi gomme, utile per visibilita' del record padre quando disponibile.
- `src/next/NextDossierMezzoPage.tsx:610`
  Modale `Storico manutenzioni` completa.
- `src/next/NextDossierMezzoPage.tsx:612`
  Modali `Da fare` / `Eseguite` complete.

### Centro Controllo / Archivio Storico

- `src/next/centroControllo/archivioStorico/hooks/useArchivioData.ts:74`
  Converte `readNextManutenzioniLegacyDataset()` in record archivio manutenzione.
- `src/next/centroControllo/archivioStorico/hooks/useArchivioFilters.ts:258`
  `applyFilters()` e' il punto corretto per nascondere i satelliti solo quando il filtro stato non e' esplicitamente `chiusa_da_evento`.
- `src/next/centroControllo/archivioStorico/hooks/useArchivioFilters.ts:287`
  Filtro stato manutenzione gia' supporta `chiusa_da_evento`; va preservata la riemersione esplicita.
- `src/next/centroControllo/archivioStorico/ArchivioFeed.tsx:401`
  Applica i filtri per kind prima di search/sort.
- `src/next/centroControllo/archivioStorico/ArchivioFeed.tsx:431`
  `activeRecords` e `sortedActive` alimentano le righe archivio.
- `src/next/centroControllo/archivioStorico/rows/ArchivioRowManutenzione.tsx:166`
  Riga compatta manutenzione: punto per aggiungere timeline standard sotto descrizione.
- `src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx:51`
  Dettaglio espanso manutenzione: punto per aggiungere timeline standard nel dettaglio.

### PDF Quadro manutenzioni

- `src/next/NextManutenzioniPage.tsx:375`
  `buildChiusuraDaEventoTitle()` gia' produce il testo sintetico di chiusura.
- `src/next/NextManutenzioniPage.tsx:480`
  `buildPdfOriginNote()` produce gia' la riga origine segnalazione/controllo.
- `src/next/NextManutenzioniPage.tsx:502`
  `buildPdfDescrizioneWithOrigin()` aggiunge la riga origine alla descrizione.
- `src/next/NextManutenzioniPage.tsx:521`
  `isPdfOperativeMaintenance()` oggi separa solo `daFare`/`programmata`; `chiusa_da_evento` richiede ramo separato.
- `src/next/NextManutenzioniPage.tsx:1463`
  `pdfFilteredItems` e' il punto di ingresso del dataset PDF.
- `src/next/NextManutenzioniPage.tsx:2182`
  Raggruppamento PDF multi/single targa, oggi usa un unico array `items`.
- `src/next/NextManutenzioniPage.tsx:2362`
  Tabella PDF singola targa.
- `src/next/NextManutenzioniPage.tsx:2504`
  Tabella PDF multi targa.

### Punti di rischio PROMPT 38d

- La sparizione satellite non va applicata ai reader globali in modo distruttivo: il dettaglio diretto e lo sgancio devono poter leggere ancora il record.
- Archivio CC deve nascondere i satelliti nella vista normale, ma mostrarli quando il filtro stato e' esplicitamente `chiusa_da_evento`.
- Il record padre gomme ufficiale vive nel layer `@gomme_eventi` come item `evento_ufficiale`, non sempre come record `@manutenzioni`; la timeline deve quindi essere costruita dal satellite quando il parent record lo espone tramite `chiusuraRefId`.
- Il PDF non deve cambiare margini/font/dimensioni: la sezione `Risolte tramite eventi esterni` deve riusare la struttura tabellare esistente.
