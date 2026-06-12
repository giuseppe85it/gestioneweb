# AUDIT UI GOMME NEXT - 2026-06-08

## 1. SCOPO AUDIT

Audit propedeutico alla futura UI gomme dentro NEXT/Manutenzioni. Il perimetro e' sola lettura runtime: mappare dove oggi i dati gomme vivono, come vengono letti, dove sono visualizzati, quali writer esistono, e soprattutto se esiste gia' un ponte completo `evento gomma app autisti -> manutenzione ufficiale in @manutenzioni`.

Verdetto sintetico:

- UI gomme autonoma oggi: **PARZIALE**.
- Ponte evento gomma -> manutenzione ufficiale oggi: **NO**.
- Punto di partenza tecnico migliore: `src/next/NextManutenzioniPage.tsx` per lo storico ufficiale e `src/next/domain/nextManutenzioniGommeDomain.ts` per la lettura aggregata; il ponte mancante richiede un writer nuovo o un'estensione esplicita, non esiste come flusso attuale.

## 2. FONTI LETTE

Nota sui documenti obbligatori: i path storici `docs/STATO_ATTUALE_PROGETTO.md`, `docs/product/*` e `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md` non sono presenti in quella forma. Dopo autorizzazione esplicita, sono stati letti gli equivalenti canonici effettivi presenti nel repo.

### Documenti

- `AGENTS.md`
- `docs/HANDOFF_UI_GOMME_2026-06-08.md`
- `docs/copia questi nel progetto in chat/STATO_ATTUALE_PROGETTO.md`
- `docs/copia questi nel progetto in chat/STATO_MIGRAZIONE_NEXT.md`
- `docs/copia questi nel progetto in chat/REGISTRO_MODIFICHE_CLONE.md`
- `docs/_live/REGISTRO_PUNTI_DA_VERIFICARE.md`
- `docs/copia questi nel progetto in chat/PROTOCOLLO_SICUREZZA_MODIFICHE.md`
- `docs/_live/architecture/PROCEDURA_MADRE_TO_CLONE.md`
- `docs/REPORT_GOMME_MARCATORE_2026-06-07.md`
- `docs/ESITO_GOMME_D1_2026-06-07.md`
- `docs/CONFRONTO_GOMME_TOTALE_2026-06-07.md`
- `docs/ESITO_GOMME_STEP2TER_2026-06-07.md`
- `docs/PROPOSTA_TAPPO_GOMME_2026-06-08.md`

### Pagine UI NEXT

- `src/App.tsx`
- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextMappaStoricoPage.tsx`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/NextDossierGommePage.tsx`
- `src/next/NextGommeEconomiaSection.tsx`
- `src/next/autistiInbox/NextAutistiAdminNative.tsx`
- `src/next/autistiInbox/NextAutistiGommeAllNative.tsx`
- `src/next/autistiInbox/NextAutistiInboxHomeNative.tsx`

### Componenti e legacy letti solo per confronto

- `src/next/components/NextImportGommeChiusuraModal.tsx`
- `src/components/AutistiEventoModal.tsx`
- `src/pages/Manutenzioni.tsx`
- `src/pages/DossierGomme.tsx`
- `src/pages/GommeEconomiaSection.tsx`
- `src/autisti/GommeAutistaModal.tsx`
- `src/autistiInbox/AutistiAdmin.tsx`

### Domain / read model

- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/next/domain/nextDossierMezzoDomain.ts`
- `src/next/domain/nextMappaStoricoDomain.ts`

### Writer

- `src/next/writers/nextManutenzioneDaFareCreateWriter.ts`
- `src/next/writers/nextChiusuraEventoWriter.ts`
- `src/next/domain/nextManutenzioniDomain.ts` (`saveNextManutenzioneBusinessRecord`, `deleteNextManutenzioneBusinessRecord`)
- `src/autisti/GommeAutistaModal.tsx`
- `src/next/autistiInbox/NextAutistiAdminNative.tsx`
- `src/components/AutistiEventoModal.tsx`
- `src/autistiInbox/AutistiAdmin.tsx`

### CSS

- `src/next/next-mappa-storico.css`
- `src/next/next-manutenzioni.css`
- `src/next/centroControllo/archivioStorico/styles/archivioStorico.css`

### Helper / barrier

- `src/utils/cloneWriteBarrier.ts`
- `src/utils/storageSync.ts`
- `src/next/nextStructuralPaths.ts`
- `src/next/helpers/frasestoriaRecord.ts`
- `src/next/helpers/eventiCompatibili.ts`

## 3. MAPPA UI GOMME ESISTENTE

| UI | Route | Cosa mostra | Azioni | Tipo | Stato audit |
| --- | --- | --- | --- | --- | --- |
| `src/next/NextManutenzioniPage.tsx` / `NextManutenzioniPage` | `/next/manutenzioni` (`src/App.tsx`) | Dashboard, da fare, storico, dettaglio/mappa, form manutenzione. Ha subtype `gomme`, `gomme-straordinario`, campi assi, motivo, quantita, km. | Crea/modifica/elimina manutenzioni tramite `saveNextManutenzioneBusinessRecord`; completa record; aggancia/sgancia eventi gomme a record esistenti. | UI principale e writer | **utile**, ma e' molto grande e non e' una UI gomme autonoma. |
| `src/next/NextMappaStoricoPage.tsx` / `NextMappaStoricoPage` | Non route autonoma; montata dentro `NextManutenzioniPage` quando `view === "mappa"` (`NextManutenzioniPage.tsx:5657-5665`) | Dettaglio storico per mezzo, riconosce gomme da marker/tipo/testo (`NextMappaStoricoPage.tsx:354-385`) e mostra box dettagli gomme (`1137-1195`). | Nel contesto Manutenzioni puo' attivare agganci/sganci gestiti dal parent. | Sezione secondaria/detail | **utile per lettura dettaglio**, non sufficiente come UI gestione gomme. |
| `src/next/NextDossierMezzoPage.tsx` / `NextDossierMezzoPage` | `/next/dossier/:targa`, `/next/dossiermezzi/:targa` | Dossier mezzo con riepilogo gomme per asse, eventi straordinari e link a Dossier Gomme (`581-608`). | Navigazione a Dossier Gomme; non crea manutenzioni gomme. | Reader secondario | **utile per overview**, read-only. |
| `src/next/NextDossierGommePage.tsx` / `NextDossierGommePage` | `/next/dossier/:targa/gomme` (`src/App.tsx`) | Shell pagina "MANUTENZIONE GOMME" che monta `NextGommeEconomiaSection` con `dataScope="legacy_parity"` (`NextDossierGommePage.tsx:39`). | Nessuna scrittura. | Reader dedicato | **parziale**: pagina dedicata ma oggi e' analisi/lettura, non gestione. |
| `src/next/NextGommeEconomiaSection.tsx` / `NextGommeEconomiaSection` | Usata da Dossier Gomme | Statistiche gomme, stato ordinario per asse, eventi straordinari, storico sostituzioni, grafici costi/durata (`120-325`). | Nessuna scrittura. | Reader analytics | **utile**, ma attenzione: con `legacy_parity` filtra solo `sourceOrigin === "manutenzione_derivata"` (`52-83`), quindi non mostra tutti gli eventi esterni. |
| `src/next/autistiInbox/NextAutistiAdminNative.tsx` / `NextAutistiAdminNative` | `/next/autisti-admin` (`src/App.tsx`) | Tab gomme admin da `@cambi_gomme_autisti_tmp`; filtri, edit, importa (`3021-3124`). | Teoricamente update tmp, append ufficiale, chiusura candidati; in browser bloccato da `shouldBlockAdminMutations()` (`764-778`, `1882-1910`). | Admin/eventi | **da non usare come base nuova UI**: superficie read-only di fatto e non crea manutenzione. |
| `src/next/components/NextImportGommeChiusuraModal.tsx` | Modale di `NextAutistiAdminNative` (`4055-4062`) | Cerca candidati aperti su `@manutenzioni`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti` per targa e contenuto gomme (`220-293`). | Restituisce candidati selezionati; non scrive direttamente. | Modale supporto import | **utile come logica di selezione**, ma incompleta: non crea record ufficiale nuovo. |
| `src/next/autistiInbox/NextAutistiGommeAllNative.tsx` | `/next/autisti-inbox/gomme` (`src/App.tsx`) | Lista eventi tmp da `@cambi_gomme_autisti_tmp`, filtri targa/nuove/non importate, dettaglio asse/km/autista (`69-220`). | Nessuna scrittura. | Reader eventi tmp | **utile per inbox read-only**, non e' ponte. |
| Legacy `src/components/AutistiEventoModal.tsx` | madre / confronto | Importa evento gomme e crea manutenzione testuale legacy (`339-374`, `381-387`). | Scrive `@gomme_eventi`, `@manutenzioni`; bloccato in clone se `effectiveCloneSafe`. | Legacy writer | **da non riusare runtime**. |
| Legacy `src/pages/Manutenzioni.tsx` | `/manutenzioni` | Modale gomme madre aggiunge blocco testuale in descrizione (`301-318`). | Salvataggio madre legacy testuale. | Legacy | **da non riusare runtime**. |
| Legacy `src/pages/DossierGomme.tsx` + `src/pages/GommeEconomiaSection.tsx` | `/dossier/:targa/gomme` madre | Analisi gomme legacy da testo manutenzioni. | Nessuna scrittura. | Legacy reader | **solo confronto visivo/funzionale**, non runtime NEXT. |

## 4. MAPPA DATI GOMME

| Dataset | Ruolo | Chi legge | Chi scrive | Campi gomme rilevanti | Classificazione |
| --- | --- | --- | --- | --- | --- |
| `@manutenzioni` | Storico ufficiale manutenzioni; unico luogo in cui un intervento gomme e' manutenzione ufficiale. | `nextManutenzioniDomain`, `nextManutenzioniGommeDomain`, `NextManutenzioniPage`, `NextDossierMezzoPage`, `NextDossierGommePage`, `NextMappaStoricoPage`, Archivio/Centro Controllo. | `saveNextManutenzioneBusinessRecord`; `nextManutenzioneDaFareCreateWriter`; `nextChiusuraEventoWriter` per chiusure; legacy madre per vecchi flussi. | `gommeInterventoTipo`, `assiCoinvolti`, `gommePerAsse`, `gommeStraordinario`, piu' `descrizione`, `km`, `data`, `dataEsecuzione`, `segnalatoDa`, `origineRefKey`. | Storico ufficiale. |
| `@cambi_gomme_autisti_tmp` | Eventi gomme creati dall'app autisti, stato tmp/operativo. | `NextAutistiGommeAllNative`, `NextAutistiAdminNative`, `nextManutenzioniGommeDomain`, home/inbox autisti. | `src/autisti/GommeAutistaModal.tsx` tramite `appendGommeAutistaTmpRecordIfMissing` (`151-173`, record `293-375`); legacy/admin update stato. | `id`, `targetTarga`, `targetType`, `categoria`, `km`, `data`, `timestamp`, `tipo`, `marca`, `gommeIds`, `asseId`, `asseLabel`, `rotazioneSchema`, `rotazioneText`, `autista`, `stato`, `letta`. | Evento esterno tmp. |
| `@gomme_eventi` | Eventi gomme ufficializzati per Dossier/eventi; non equivalgono automaticamente a manutenzione. | `nextManutenzioniGommeDomain`, Dossier Gomme, `NextAutistiAdminNative`. | `appendGommeEventoUfficialeIfMissing` in `NextAutistiAdminNative.tsx:81-95`; legacy `AutistiAdmin.tsx:1628-1634`; legacy `AutistiEventoModal.tsx:280-286`. | Copia evento tmp senza `letta`/`stato`: `id`, `targetTarga`, `tipo`, `marca`, `gommeIds`, `asseId`, `asseLabel`, `km`, `autista`. | Evento esterno ufficiale, non storico. |
| `@segnalazioni_autisti_tmp` | Sorgente operativa: segnalazioni gomme o record da chiudere/agganciare. | `NextImportGommeChiusuraModal`, `nextManutenzioneDaFareCreateWriter`, admin inbox, Centro Controllo. | App autisti/segnalazioni; writer NEXT possono patchare stato/legame/chiusura. | `tipoProblema="gomme"`, `posizioneGomma`, `problemaGomma`, `targa*`, `stato`, `chiusuraDi`, `chiusuraRefId`. | Sorgente tmp/supporto. |
| `@controlli_mezzo_autisti` | Controlli mezzo, inclusi KO gomme. | `NextImportGommeChiusuraModal`, `nextManutenzioneDaFareCreateWriter`, admin inbox. | App autisti/controlli; writer NEXT possono patchare chiusura. | `check.gomme === false`, `posizioneGomma`/`asse`, `note`/`descrizione`, `stato`, `chiusuraDi`, `chiusuraRefId`. | Sorgente controllo/supporto. |
| `@lavori` | Lavori legacy/operativi; puo' contenere testo gomme e puo' avere corrispondenze storiche gia importate. | Legacy Dossier/DettaglioLavoro; citato dai censimenti gomme; non e' reader principale della UI gomme NEXT. | Legacy `LavoriDaEseguire`, `DettaglioLavoro`, `AutistiEventoModal` (`546-547`). | Testo/descrizione, targa, eseguito; nessun marker gomme strutturato verificato. | Supporto/legacy, non storico gomme ufficiale. |
| `@storico_eventi_operativi` | Storico operativo generale autisti/cambio mezzo; non marker gomme strutturato. | `NextAutistiAdminNative`, `NextAutistiInboxHomeNative`, domini operativita/autisti. | Flussi autisti operativi. | Nel censimento D1 risultano 416 record e 0 record gomme trovati; non e' fonte primaria gomme. | Supporto operativo. |

Stato dati post-bonifica da documenti verificati: `docs/HANDOFF_UI_GOMME_2026-06-08.md` indica 84 record in `@manutenzioni` e 16 con marker gomme fisico; `@cambi_gomme_autisti_tmp` 8 record; `@gomme_eventi` 11 record. `docs/ESITO_GOMME_STEP2TER_2026-06-07.md` registra `@manutenzioni` 82 -> 83 nello step finale, poi lo stato handoff successivo riporta 84.

## 5. MAPPA READER

| Reader | Path | Dataset letti | Trasformazioni | Dedupliche / limiti | Output UI |
| --- | --- | --- | --- | --- | --- |
| `readNextMezzoManutenzioniGommeSnapshot` | `src/next/domain/nextManutenzioniGommeDomain.ts:1501-1596` | `@manutenzioni` via `readNextMezzoManutenzioniSnapshot`, `@cambi_gomme_autisti_tmp`, `@gomme_eventi` | Converte manutenzioni in item gomme, converte eventi esterni in `NextGommeReadOnlyItem`, calcola conteggi. | Deduplica eventi esterni tra tmp/ufficiale e contro manutenzioni gia importate (`1408-1457`); match forte solo con `targetTarga`/`targa`; match di contesto resta plausibile. | Dossier Gomme, Dossier Mezzo. |
| `toGommeItems` / `resolveExternalTyreEvent` | `src/next/domain/nextManutenzioniGommeDomain.ts:1029-1405` | Record manutenzione + eventi tmp/ufficiali | Deriva tipo, asse, quantita, marca, km, autista, flags, `sourceOrigin`. | Se campo non esiste resta null/flag; `marca` e' strutturata solo sugli eventi, non nel marker `@manutenzioni`. | Lista item gomme aggregata. |
| `readNextMezzoManutenzioniSnapshot` / `toHistoryItem` | `src/next/domain/nextManutenzioniDomain.ts:737-803`, `982-999` | `@manutenzioni`, `@mezzi_aziendali` | Normalizza storico, marker gomme, date, stato, tipo. | Reader separato da quello legacy dataset (`620-704`); il Cantiere C segnala rischio di divergenze reader. | Storico manutenzioni e form. |
| `resolveDetailCategory` / `isTyreMaintenanceRecord` | `src/next/NextMappaStoricoPage.tsx:354-385` | Item storico gia passato dal parent | Classifica dettaglio come gomme se marker, tipo o testo compatibile. | Include fallback testuale; puo' mostrare dettaglio anche se il marker raw non c'e'. | Box dettaglio storico. |
| `readNextDossierMezzoCompositeSnapshot` + `buildNextDossierMezzoLegacyView` | `src/next/domain/nextDossierMezzoDomain.ts:783-817`, `977-1012` | Snapshot Dossier, incluso `readNextMezzoManutenzioniGommeSnapshot` | Costruisce `gommePerAsse`, eventi straordinari, manutenzioni. | Dichiara layer read-only con convergenza prudente di tmp/eventi (`646-651`). | Dossier Mezzo. |
| `NextAutistiGommeAllNative` load effect | `src/next/autistiInbox/NextAutistiGommeAllNative.tsx:69-85` | `@cambi_gomme_autisti_tmp` | Filtra e ordina eventi tmp per targa/stato/data. | Non deduplica contro `@gomme_eventi` o `@manutenzioni`; e' inbox tmp. | Lista "Tutte le gomme". |
| `NextImportGommeChiusuraModal` load candidates | `src/next/components/NextImportGommeChiusuraModal.tsx:220-293` | `@manutenzioni`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti` | Cerca candidati aperti stessa targa con contenuto gomme/KO. | Non legge `@lavori`; non crea nulla; solo selezione candidati. | Modale import admin. |

## 6. MAPPA WRITER

| Writer | Path | Dataset scritto | Scope/barrier | Crea manutenzione ufficiale? | Stato NEXT |
| --- | --- | --- | --- | --- | --- |
| `saveNextManutenzioneBusinessRecord` | `src/next/domain/nextManutenzioniDomain.ts:1285-1346` | `@manutenzioni` | `storageSync.setItemSync` + barrier; usato da Manutenzioni | **SI**, quando l'utente salva una manutenzione nel modulo Manutenzioni. | Attivo nel perimetro Manutenzioni. |
| `deleteNextManutenzioneBusinessRecord` | `src/next/domain/nextManutenzioniDomain.ts:1373-1547` | `@manutenzioni` | Barrier | No, elimina. | Attivo nel perimetro autorizzato. |
| `nextManutenzioneDaFareCreateWriter` | `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:143-254`, `305-493` | `@manutenzioni`, patch sorgenti | `MANUTENZIONE_DAFARE_CREATE_WRITE_SCOPE`; allowed key: `@manutenzioni`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`; path ammessi in barrier `src/utils/cloneWriteBarrier.ts:120-170`. | **SI**, crea da-fare da segnalazione/controllo/evento; commit `57ec90e9` aggiunge marker parziale se sorgente gomme esplicita. | Attivo se path/scope ammesso. Non e' ponte da `@gomme_eventi` a storico eseguito. |
| `chiudiManutenzioneDaEvento`, `chiudiSegnalazioneDaEvento`, `chiudiControlloDaEvento` | `src/next/writers/nextChiusuraEventoWriter.ts:53-290` | `@manutenzioni`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti` | `CHIUSURA_DA_EVENTO_WRITE_SCOPE`; path ammessi `/next/manutenzioni`, `/next/autisti-inbox`, `/next/centro-controllo`; no `@gomme_eventi`/`@cambi_gomme_autisti_tmp`. | **NO**, chiude record gia esistenti con `chiusuraDi="gomme_evento"`. | Attivo solo per chiusure/sganci consentiti. |
| `appendGommeAutistaTmpRecordIfMissing` | `src/autisti/GommeAutistaModal.tsx:151-173`, `293-375` | `@cambi_gomme_autisti_tmp` | App autisti, non barrier NEXT classica | **NO**, crea evento tmp. | Produzione app autisti; guardia anti same-id attiva da commit `ba951c43`. |
| `appendGommeEventoUfficialeIfMissing` | `src/next/autistiInbox/NextAutistiAdminNative.tsx:81-95` | `@gomme_eventi` | Chiamato da admin NEXT; pero' la superficie e' bloccata prima in browser da `shouldBlockAdminMutations` (`764-778`, `1901-1910`). | **NO**, ufficializza evento esterno. | Di fatto bloccato in browser. |
| `confirmImportGommeRecord` | `src/next/autistiInbox/NextAutistiAdminNative.tsx:1912-1954` | `@gomme_eventi`, `@cambi_gomme_autisti_tmp`, chiusure su tre dataset | Nessuna deroga barrier per `@gomme_eventi`/tmp nel path `/next/autisti-admin`; `storageSync.setItemSync` inghiotte `CloneWriteBlockedError` (`storageSync.ts:133-135`). | **NO**, non crea nuova manutenzione. | Bloccato a livello UI e fragile a livello barrier. |
| Legacy `importGommeRecord` + `appendGommeManutenzione` | `src/components/AutistiEventoModal.tsx:280-387` | `@gomme_eventi`, `@manutenzioni` | Madre legacy | **SI**, ma testuale e legacy, senza marker strutturato. | Fuori perimetro, da non riusare. |
| Legacy `AutistiAdmin.importGommeRecord` | `src/autistiInbox/AutistiAdmin.tsx:1628-1634` | `@gomme_eventi`, tmp stato | Madre legacy | **NO**, non crea manutenzione. | Fuori perimetro. |
| Legacy `src/pages/Manutenzioni.tsx` modale gomme | `src/pages/Manutenzioni.tsx:301-318` | Descrizione manutenzione madre | Madre legacy | Solo dentro salvataggio madre; marker non strutturato. | Fuori perimetro. |

Writer evento gomma -> manutenzione ufficiale in `@manutenzioni`: **NON TROVATO** nel perimetro NEXT attuale. L'unico writer NEXT che crea `@manutenzioni` da sorgenti gomme e' `nextManutenzioneDaFareCreateWriter`, ma non importa un record `@cambi_gomme_autisti_tmp`/`@gomme_eventi` come intervento ufficiale eseguito. `confirmImportGommeRecord` copia evento e chiude candidati, non crea la manutenzione.

## 7. FLUSSI REALI OGGI

### Nuovo cambio gomme ordinario da Manutenzioni

```text
/next/manutenzioni
  -> NextManutenzioniPage subtype "gomme"
  -> utente seleziona assi / quantita / data / km / note
  -> saveRecord()
  -> saveNextManutenzioneBusinessRecord()
  -> @manutenzioni con gommeInterventoTipo="ordinario", assiCoinvolti, gommePerAsse
  -> visibile in storico ufficiale, Dossier Mezzo, Dossier Gomme, dettaglio/mappa
```

Limite: `marca` non e' campo marker strutturato in `@manutenzioni`; oggi vive nel testo o negli eventi esterni.

### Nuovo cambio gomme straordinario da Manutenzioni

```text
/next/manutenzioni
  -> subtype "gomme-straordinario"
  -> utente inserisce motivo, asse opzionale, quantita opzionale
  -> saveRecord()
  -> saveNextManutenzioneBusinessRecord()
  -> @manutenzioni con gommeInterventoTipo="straordinario", gommeStraordinario
  -> visibile come storico ufficiale
```

La UI richiede motivo per nuovo straordinario non-completion (`NextManutenzioniPage.tsx:2470-2575`).

### Evento gomme da app autisti

```text
App autisti / GommeAutistaModal
  -> costruisce record evento con targetTarga, tipo, marca, gommeIds, asse, km, autista
  -> appendGommeAutistaTmpRecordIfMissing()
  -> @cambi_gomme_autisti_tmp
  -> visibile in inbox gomme e nel Dossier Gomme come evento esterno read-only
```

Non nasce una manutenzione ufficiale.

### Import admin NEXT

```text
/next/autisti-admin tab gomme
  -> importGommeRecord()
  -> in browser: shouldBlockAdminMutations() blocca
  -> se non bloccato: apre NextImportGommeChiusuraModal
  -> confirmImportGommeRecord()
  -> append @gomme_eventi se id non presente
  -> chiude candidati gia esistenti selezionati in @manutenzioni/@segnalazioni/@controlli
  -> marca tmp come importato
```

Manca il passo:

```text
evento gomme -> crea nuova manutenzione in @manutenzioni
```

### Visualizzazione in Dossier Gomme

```text
/next/dossier/:targa/gomme
  -> NextDossierGommePage
  -> NextGommeEconomiaSection dataScope="legacy_parity"
  -> readNextMezzoManutenzioniGommeSnapshot()
  -> filtra a sourceOrigin="manutenzione_derivata"
```

Con `legacy_parity` la pagina dedicata non e' la vista completa di tutti gli eventi esterni. Il reader sa leggere anche tmp/ufficiali, ma la route attuale usa filtro legacy parity.

### Visualizzazione in Dossier Mezzo

```text
/next/dossier/:targa
  -> NextDossierMezzoPage
  -> readNextDossierMezzoCompositeSnapshot()
  -> readNextMezzoManutenzioniGommeSnapshot()
  -> mostra riepilogo stato gomme per asse + eventi straordinari + link Dossier Gomme
```

Read-only.

### Dettaglio / Mappa Storico

```text
/next/manutenzioni
  -> view "mappa"
  -> NextMappaStoricoPage
  -> riceve storicoMezzoOrdinato dal parent
  -> classifica gomme da marker/tipo/testo
  -> mostra box dettagli gomme e origini
```

Non e' una route standalone; e' sezione della pagina Manutenzioni.

## 8. GAP FUNZIONALI

1. **Ponte evento -> manutenzione mancante**: non esiste writer NEXT che prenda un record `@cambi_gomme_autisti_tmp` o `@gomme_eventi` e crei una manutenzione ufficiale in `@manutenzioni`.
2. **Import admin NEXT bloccato**: `shouldBlockAdminMutations()` rende la superficie admin read-only nel browser; inoltre barrier/scope non includono le key gomme evento per `/next/autisti-admin`.
3. **Revisione dati prima import non esiste come flusso completo**: la modale seleziona candidati da chiudere, ma non fa review/costruzione dei campi marker della nuova manutenzione.
4. **Duplicati storici**: la guardia `ba951c43` evita nuovi duplicati same-id, ma `docs/HANDOFF_UI_GOMME_2026-06-08.md` registra duplicati storici non-test ancora presenti in `@gomme_eventi`.
5. **Marca**: non e' campo del marker `@manutenzioni`; e' strutturata sugli eventi esterni e spesso testuale nello storico. Una nuova UI non deve inventare un campo marca nello storico senza decisione dati.
6. **Km sospetti**: esempio reale TI282780 aveva `km=1234`; lo step finale lo ha escluso dal campo `km` ufficiale. Serve policy UI per confermare/scartare km evento.
7. **Tipo ordinario/straordinario pendente**: il tappo da sorgenti esplicite lascia il tipo non valorizzato alla creazione quando non noto; il reader puo' inferire straordinario se trova `gommeStraordinario`. La UI deve rendere esplicita la scelta al completamento/import.
8. **Dossier Gomme non completo per default**: la route attuale usa `dataScope="legacy_parity"`, quindi non e' la vista piena di tutti gli eventi gomme.
9. **Boundary scritture**: nuovo ponte richiedera' scope/barrier esplicito per il path della nuova UI e per le key interessate.

## 9. RISCHI TECNICI

| Rischio | Classe | Cosa puo' rompersi | Impatto | Dati ufficiali | Barrier/scope | Madre/NEXT |
| --- | --- | --- | --- | --- | --- | --- |
| Creare ponte evento -> manutenzione | EXTRA ELEVATO | Duplicazioni, manutenzioni con marker sbagliato, chiusure errate, km falsi | Manutenzioni, Dossier, Centro Controllo, Archivio | Si, `@manutenzioni` | Si, nuovo scope o estensione scope | Solo NEXT; madre non va toccata |
| Cambiare reader gomme aggregato | ELEVATO | Dossier Gomme/Dossier Mezzo mostrano record doppi o spariti | Dossier, analytics, storico | No scrittura, ma impatta visibilita' | No | NEXT |
| Usare componenti legacy come runtime | ELEVATO | Reintroduce flussi testuali senza marker, madre non dismessa | Manutenzioni, eventi | Si se scrive | Non controllato da NEXT | Madre, vietato |
| Promuovere `marca` a campo storico senza modello | ELEVATO | Dato non canonico e UI incoerente | Storico gomme | Si se scritto | Si | NEXT |
| Abilitare import admin esistente senza redesign | ELEVATO | Scritture silenziosamente bloccate o parziali; chiusure senza manutenzione | Admin, tmp/eventi, chiusure | Parziale | Si | NEXT admin vecchio |
| Modificare solo UI read-only Dossier | NORMALE | Conteggi/filtri non coerenti | Dossier | No | No | NEXT |
| Mock/design senza writer | BASSO | Nessun impatto dati | Nessuno runtime se isolato | No | No | NEXT |

## 10. PROPOSTA ARCHITETTURA NUOVA UI GOMME

Proposta senza implementazione.

### Area target

Modulo NEXT dedicato ma integrato con Manutenzioni: tab/area "Gomme" dentro `/next/manutenzioni` oppure route figlia/collegata NEXT sotto lo stesso dominio operativo. Scelta consigliata: **dentro Manutenzioni come area dedicata**, perche' lo storico ufficiale e il writer canonico delle manutenzioni sono gia' li; Dossier resta lettura/analisi.

### Sezioni target

| Sezione | Dati letti | Dati scritti | Riuso possibile | Da creare | Cosa NON deve fare |
| --- | --- | --- | --- | --- | --- |
| Dashboard gomme | `readNextMezzoManutenzioniGommeSnapshot`, `@manutenzioni` | Nessuno | `NextGommeEconomiaSection` come logica/visual parziale | Layout operativo piu' compatto dentro Manutenzioni | Non deve sostituire Dossier economico senza criterio. |
| Eventi da importare | `@cambi_gomme_autisti_tmp`, `@gomme_eventi` | Nessuno in read-only; poi patch/import in step ponte | Normalizzatori di `nextManutenzioniGommeDomain`, lista di `NextAutistiGommeAllNative` come riferimento | Tabella review eventi con stato/dedup/corrispondenza | Non deve confondere evento con manutenzione ufficiale. |
| Crea manutenzione da evento | Evento tmp/ufficiale + eventuali candidati aperti | `@manutenzioni`; eventuale patch tmp/evento/chiusure solo se deciso | `saveNextManutenzioneBusinessRecord`, selezione candidati di `NextImportGommeChiusuraModal` | Writer ponte con scope esplicito | Non deve usare legacy `AutistiEventoModal`; non deve scrivere km sospetti senza conferma. |
| Ordinari per asse | `@manutenzioni.gommePerAsse` | `@manutenzioni` | Blocchi form esistenti di `NextManutenzioniPage` | Componenti gomma piccoli e testabili | Non deve inventare marca nello storico. |
| Straordinari | `@manutenzioni.gommeStraordinario` + eventi | `@manutenzioni` | Form esistente straordinario | Review motivo/asse/quantita | Non deve valorizzare ordinario/straordinario se non noto. |
| Storico ufficiale | `@manutenzioni` | Solo edit/delete gia governati | `NextMappaStoricoPage` dettaglio, `nextManutenzioniDomain` | Lista filtrata gomme ufficiali | Non deve contare tmp come storico. |
| Dossier / economia | Snapshot gomme aggregato | Nessuno | `NextGommeEconomiaSection` | Eventuale `dataScope="extended"` esplicito | Non deve diventare superficie di scrittura primaria. |

### Componenti candidati a riuso

- `nextManutenzioniGommeDomain.ts`: reader aggregato e dedup.
- `nextManutenzioniDomain.ts`: modello marker e writer ufficiale.
- Parti controllate di `NextManutenzioniPage.tsx`: form assi, straordinario, validazioni.
- `NextImportGommeChiusuraModal.tsx`: solo come base di selezione candidati, non come import completo.
- `NextGommeEconomiaSection.tsx`: per analytics, con attenzione a `dataScope`.

### File da non riusare come runtime

- `src/components/AutistiEventoModal.tsx`
- `src/pages/Manutenzioni.tsx`
- `src/pages/DossierGomme.tsx`
- `src/pages/GommeEconomiaSection.tsx`
- `src/autistiInbox/AutistiAdmin.tsx`
- Qualsiasi percorso madre/legacy `src/pages/**`, `src/components/**` non NEXT, salvo lettura di confronto.

## 11. PROPOSTA FASI OPERATIVE SUCCESSIVE

| Step | Obiettivo | Whitelist futura consigliata | Rischio | Criteri di accettazione |
| --- | --- | --- | --- | --- |
| Step 1 | Disegno/mock UI gomme | Solo documento/spec o file design dichiarati; nessun runtime | BASSO | Flussi e stati approvati; distinzione evento/storico evidente. |
| Step 2 | UI read-only dentro Manutenzioni | Nuovi componenti `src/next/**` + eventuale CSS NEXT dedicato; nessun writer | NORMALE | Mostra storico ufficiale e eventi esterni separati; nessuna scrittura; build verde. |
| Step 3 | Ponte evento -> manutenzione | Nuovo writer ponte, test writer, barrier scope esplicito, componenti import | EXTRA ELEVATO | Evento selezionato crea una sola manutenzione con marker; tmp/evento resta coerente; no duplicati; rollback/test. |
| Step 4 | Import/revisione avanzata | Componenti review, policy km/marca/tipo, test dominio | ELEVATO | Km sospetti richiedono conferma; tipo ordinario/straordinario deciso esplicitamente; marca non scritta se modello non deciso. |
| Step 5 | Test e hardening | Test unit/integration NEXT, eventuale Playwright solo se UI implementata | ELEVATO | `npm run build` verde; test writer/reader verdi; nessuna dipendenza madre runtime. |

## 12. VERDETTO FINALE

- Esiste oggi una UI gomme autonoma? **PARZIALE**. Esistono una pagina Dossier Gomme read-only, sezioni gomme in Manutenzioni e viste evento/inbox. Non esiste una UI autonoma completa di gestione/import/revisione.
- Miglior punto di partenza: **Manutenzioni NEXT**, perche' e' gia' il modulo che crea `@manutenzioni` con marker strutturato e contiene validazioni gomme. Il Dossier Gomme resta lettura/analytics.
- La nuova UI deve stare dentro Manutenzioni o separata? **Dentro Manutenzioni come area/tab gomme**, con eventuale route NEXT dedicata solo se mantiene lo stesso dominio e writer ufficiale. Non partire dal vecchio admin autisti.
- Ponte evento -> manutenzione oggi: **NO**. `confirmImportGommeRecord` non crea manutenzione; `nextChiusuraEventoWriter` chiude solo record esistenti; `@gomme_eventi` resta evento esterno.
- File da non riusare come runtime: tutti i legacy madre elencati in sezione 10.
- File candidati a riuso: `nextManutenzioniGommeDomain.ts`, `nextManutenzioniDomain.ts`, componenti/form gomme estratti da `NextManutenzioniPage.tsx`, `NextImportGommeChiusuraModal.tsx` solo come base per candidati, `NextGommeEconomiaSection.tsx` solo per lettura.
- Modulo non dichiarato "chiuso": questo audit non certifica chiusura; mappa lo stato e i rischi prima di un redesign.

## Verifiche eseguite

Comandi usati in sola lettura:

- `rg "gomme"`
- `rg "gommeInterventoTipo"`
- `rg "gommePerAsse"`
- `rg "gommeStraordinario"`
- `rg "@gomme_eventi"`
- `rg "@cambi_gomme_autisti_tmp"`
- `rg "NextGomme"`
- `rg "DossierGomme"`
- `rg "ImportGomme"`
- `rg "confirmImportGommeRecord"`
- letture mirate con `Get-Content` dei file principali.

Build/test non eseguiti: audit documentale, nessuna modifica runtime.
