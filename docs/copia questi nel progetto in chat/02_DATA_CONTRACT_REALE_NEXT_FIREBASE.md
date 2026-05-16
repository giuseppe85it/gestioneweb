# DATA CONTRACT REALE NEXT FIREBASE

Data originale: 2026-05-07 — Aggiornato: 2026-05-16

## Aggiornamento 2026-05-16

Sintesi delta data-contract dal 2026-05-08 al 2026-05-16. Origine: `DIARIO_DECISIONI.md` + audit data-based (`AUDIT_CICLO_SEGNALAZIONE_2026-05-14`, `REPORT_PROMPT44/45/47/49/50/52`) + `AUDIT_NEXT_COMPLETO_2026-05-16.md`. Per il dettaglio scope barrier vedi [src/utils/cloneWriteBarrier.ts:111-184](../../src/utils/cloneWriteBarrier.ts#L111-L184).

### Nuovi campi sui dataset esistenti
- `[NUOVO]` `chiusuraDi`, `chiusuraRefId`, `chiusuraData` su `@manutenzioni`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti` — macchina chiusura ciclo eventi 2026-05-14. `chiusuraDi` enum corrente: `"gomme_evento"` | `"manutenzione"` | `"manuale"`. `chiusuraData` MS-epoch. (rif. [src/next/writers/nextChiusuraEventoWriter.ts](../../src/next/writers/nextChiusuraEventoWriter.ts)).
- `[NUOVO]` Stato `chiusa_da_evento` ammesso su `@manutenzioni`; stato `chiusa` ammesso su `@segnalazioni_autisti_tmp` e `@controlli_mezzo_autisti`.
- `[NUOVO]` Campo `nascostoInArchivio: boolean` su `@manutenzioni`, `@segnalazioni_autisti_tmp`, `@richieste_attrezzature_autisti_tmp` (4 collezioni Archivio Storico) — soft-hide PROMPT 31.1 (2026-05-12); scope `ARCHIVIO_HIDE_WRITE_SCOPE`.
- `[NUOVO]` Campo `manutenzioneContrattoAttivo: boolean` su `@mezzi_aziendali` (default `true`); decisione 2026-05-09.
- `[NUOVO]` Campi soft-delete: `chiusa:true`/`dataChiusura`/`chiusa_by` su `@segnalazioni_autisti_tmp`; `chiuso:true`/`dataChiusura`/`chiuso_by` su `@controlli_mezzo_autisti`; `evasa:true`/`dataEvasione`/`evasa_by` su `@richieste_attrezzature_autisti_tmp` (decisione 2026-05-09).
- `[AGGIORNATO]` `@manutenzioni.data` ora ISO `yyyy-mm-dd` — migration 2026-05-14 ha convertito 56 record. Helper canonico `dateUnica.ts`.
- `[AGGIORNATO]` `linkedLavoroId`/`linkedLavoroIds` su `@segnalazioni_autisti_tmp` / `@controlli_mezzo_autisti` — nome del campo invariato, **semantica del valore** ora puntata a `@manutenzioni` (decisione J.7, 2026-05-12). Strategia 3a: `@lavori` Firestore intoccabile, madre continua a scriverlo, NEXT non legge più come modulo.
- `[AGGIORNATO]` `@segnalazioni_autisti_tmp.dataPresaInCarico` — può essere scritta **SOLO** dal writer `segnaPresaInCaricoSegnalazione` (azione utente esplicita "Prendi in carico"). I writer `patchSegnalazione` e `agganciaSegnalazioneAManutenzioneEsistente` NON la toccano più (PROMPT 50 R2). Regola permanente `TIMESTAMP-MAI-DA-CLICK` in [AGENTS.md:235-276](../../AGENTS.md#L235-L276).
- `[AGGIORNATO]` Campo `origineTipo`/`origineRefId`/`origineRefKey` su `@manutenzioni` — back-link canonico unificato via helper `cicloLegame.ts` (`readLegameOrigine`/`writeLegameOrigine`).

### Nuovi writer NEXT
- `[NUOVO]` [src/next/nextSegnalazioniWriter.ts](../../src/next/nextSegnalazioniWriter.ts) — `markSegnalazioneChiusa(id)` scrive `chiusa:true`, `dataChiusura`, `chiusa_by:"centro_controllo_next"` su `@segnalazioni_autisti_tmp`. Scope `SEGNALAZIONI_WRITE_SCOPE`.
- `[NUOVO]` [src/next/nextControlliWriter.ts](../../src/next/nextControlliWriter.ts) — `markControlloChiuso(id)` simmetrico. Scope `CONTROLLI_WRITE_SCOPE`.
- `[NUOVO]` `nextRichiesteAttrezzatureWriter.ts` — `markRichiestaEvasa`. Scope `RICHIESTE_WRITE_SCOPE`.
- `[NUOVO]` [src/next/writers/nextChiusuraEventoWriter.ts](../../src/next/writers/nextChiusuraEventoWriter.ts) — `chiudiManutenzione/Segnalazione/ControlloDaEvento` + `sganciaManutenzione/Segnalazione/ControlloDaEvento`. Scope `CHIUSURA_DA_EVENTO_WRITE_SCOPE` (alias `next_chiusura_da_evento_write_scope`). Patch con fallback fingerprint per `@manutenzioni` (PROMPT 44 D4).
- `[NUOVO]` [src/next/writers/agganciaSegnalazioneAManutenzioneEsistenteWriter.ts](../../src/next/writers/agganciaSegnalazioneAManutenzioneEsistenteWriter.ts) — `agganciaSegnalazioneAManutenzioneEsistente` (aggancio inverso PROMPT 47, target qualunque stato; propaga chiusura se target `eseguita`/`chiusa_da_evento`). Scope `CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE`.
- `[NUOVO]` `sganciaLegameOrfano` — sgancio link orfano (PROMPT 47).
- `[NUOVO]` [src/next/writers/presaInCaricoSegnalazioneWriter.ts](../../src/next/writers/presaInCaricoSegnalazioneWriter.ts) — `segnaPresaInCaricoSegnalazione` unica via per scrivere `dataPresaInCarico` (PROMPT 50 R2).
- `[NUOVO]` [src/next/writers/nextManutenzioneDaFareCreateWriter.ts](../../src/next/writers/nextManutenzioneDaFareCreateWriter.ts) — `createManutenzioneDaFareFromEvento/Segnalazione/Controllo` + `agganciaSorgenteAManutenzioneEsistente` (merge PROMPT 45 T1, finestra 90gg). Scope `MANUTENZIONE_DAFARE_CREATE_WRITE_SCOPE`.
- `[NUOVO]` `nextMezzoHardDeleteWriter.ts` — hard-delete mezzo cascade su 11 dataset (decisione 2026-05-09, gesto nascosto shift+click + modale conferma con scrittura targa). Scope `DELETE_MEZZO_WRITE_SCOPE`.
- `[NUOVO]` `nextRifornimentiWriter` rifornimenti CC con scope `RIFORNIMENTI_WRITE_SCOPE`.

### Nuovi helper / utility
- `[NUOVO]` [src/next/helpers/cicloLegame.ts](../../src/next/helpers/cicloLegame.ts) — schema canonico legame: `readLegameLavoro`/`writeLegameLavoro` (forward), `readLegameOrigine`/`writeLegameOrigine` (back-link), `isLegameOrfano`.
- `[NUOVO]` [src/next/helpers/closureOrchestrator.ts](../../src/next/helpers/closureOrchestrator.ts) — `propagateChiusuraToLegame` (PROMPT 44 D1): chiusura manutenzione → propagazione su segnalazione/controllo collegato. `chiusuraData` eredita da `target.data` (PROMPT 50 R1), no Date.now() come effetto collaterale.
- `[NUOVO]` [src/next/helpers/dateUnica.ts](../../src/next/helpers/dateUnica.ts) — fonte unica formato date NEXT (`toDisplay`, `toISO`, `parseAnyDate`).
- `[NUOVO]` `frasestoriaRecord.ts` — `buildFraseStoria`/`recordChiusoFromRaw` (cross-read sorgente via `options.sourceRecord` post-PROMPT 49). Componente React `FraseStoriaRecord`.
- `[NUOVO]` `manutenzioniPerAggancio.ts` (PROMPT 47, finestra 365gg, tutti gli stati) + `manutenzioniCandidatiMerge.ts` (PROMPT 45, finestra 90gg, solo daFare/programmata).
- `[NUOVO]` `eventiCompatibili.ts` — registry futuro per eventi compatibili con chiusura retroattiva (oggi solo `gomme_evento`).

### Writer obsoleti / dismessi
- `[OBSOLETO]` Writer Lavori NEXT (`NextLavoriDaEseguirePage.tsx:524`, `NextDettaglioLavoroPage.tsx:841`/`:865`/`:894`) — dismessi 2026-05-12. NEXT non scrive più `@lavori`. Strategia 3a: madre continua, ma writer NEXT non rilevante.
- `[OBSOLETO]` Riga "Lavori | SCRIVENTE" della tabella sezione 1 — il modulo è dismesso.

### Decisioni a livello di Registro Firestore (rif. DIARIO_DECISIONI 2026-05-04 e 2026-05-06)
- `[NUOVO]` Registro Collection Firestore promosso a **v1.0 STABLE** (2026-05-06). Boundary readonly esteso a 38 collection field-filtered.
- `[AGGIORNATO]` 7 punti decisi 2026-05-04 post-audit copertura modali: punti 1 (root collection documentali `@documenti_*` da sostituire a `storage/@documenti_*`), 2 (Cisterna nel motore generico v1), 3 (`chat_ia_reports` esclusione esplicita), 4 (foto storage path in allowedFields), 5 (`@analisi_economica_mezzi` esclusa by design), 6 (`stamped/*` legacy fuori scope motore v1), 7 (coordinate hotspot ammesse). ALCUNI ANCORA APERTI a 2026-05-16 (vedi `AUDIT_NEXT_COMPLETO_2026-05-16.md` cap. 8).

### Stato writer non confermati / read-only (sez. 3 originale)
- Restano validi: driver pages Autisti scrivono read-only/no-op (`NextAutistiRifornimentoPage`, `NextAutistiSegnalazioniPage`, `NextAutistiRichiestaAttrezzaturePage`, `NextAutistiControlloPage`). Vedi anche file 05 aggiornato per la sostituzione NEXT di `AutistiAdmin.tsx`.

Fonte: payload effettivamente letti/scritti da moduli NEXT. Stati ammessi: DIMOSTRATO, DEDOTTO, DA VERIFICARE, NON PRESENTE.

## 1. Collezioni e dataset usati dalla NEXT

| Dataset reale | Tipo | Dove viene letto | Dove viene scritto | Campi chiave letti/salvati | Rischio | Stato |
|---|---|---|---|---|---|---|
| `storage/@mezzi_aziendali` | storage document con array/value | flotta, dossier, scadenze, IA libretto, autisti setup (`nextAnagraficheFlottaDomain.ts:832`, `nextDossierMezzoDomain.ts:414`) | `nextMezziWriter.ts:121`, `nextScadenzeCollaudiWriter.ts:67`, `NextIALibrettoPage.tsx:465`, `ArchivistaDocumentoMezzoBridge.tsx:1881` | targa/id, anagrafica mezzo, dati revisione/collaudo, libretto | critico | DIMOSTRATO |
| `storage/@inventario` | storage document con array/value | magazzino, manutenzioni, operativita (`NextMagazzinoPage.tsx:1362`, `nextInventarioDomain.ts:239`) | `NextMagazzinoPage.tsx:1593`, `nextManutenzioniDomain.ts:978` | id, descrizione, quantita, unita, fornitore, sogliaMinima, fotoUrl, fotoStoragePath | critico | DIMOSTRATO |
| `storage/@materialiconsegnati` | storage document con array/value | magazzino, materiali movimenti, dossier (`nextMaterialiMovimentiDomain.ts:1129`) | `NextMagazzinoPage.tsx:1602`, `nextManutenzioniDomain.ts:979` | materiale, quantita, mezzoTarga/targa, destinatario, cantiere, data, fornitore, stockKey | critico | DIMOSTRATO |
| `storage/@cisterne_adblue` | storage document con array/value | magazzino AdBlue (`nextMaterialiMovimentiDomain.ts:1583`) | `NextMagazzinoPage.tsx:1611` | data, quantitaLitri/litri, inventarioRefId, stockKey, fornitore, numeroCisterna, note | alto | DIMOSTRATO |
| `storage/@manutenzioni` | storage document con array/value | manutenzioni, dossier, operativita (`nextManutenzioniDomain.ts:719`) | `nextManutenzioniDomain.ts:994`, `:1088` | id, targa, data, tipo, fornitore, km, ore, sottotipo, descrizione, eseguito, materiali, importo, sourceDocumentId | critico | DIMOSTRATO |
| `storage/@lavori` | storage document con array/value | lavori/dossier (`nextLavoriDomain.ts:669`) | `NextLavoriDaEseguirePage.tsx:524`, `NextDettaglioLavoroPage.tsx:841` | id, descrizione, targa, urgenza, eseguito, chiHaEseguito, dataInserimento, dataEsecuzione | alto | DIMOSTRATO [OBSOLETO 2026-05-16: NEXT non scrive più `@lavori`; strategia 3a, madre continua; vedi DIARIO_DECISIONI 2026-05-12/13] |
| `storage/@ordini` | storage document con array/value | procurement, ordini, magazzino, Euromecc (`nextProcurementDomain.ts:1009`) | `NextMaterialiDaOrdinarePage.tsx:1164`, `NextProcurementReadOnlyPanel.tsx:598`, `NextEuromeccPage.tsx:3031` | id, fornitore, materiali, stato, fileUrl, importi, provenienza | critico | DIMOSTRATO |
| `storage/@preventivi` | storage document con `preventivi` o `value` | procurement/documenti (`nextDocumentiCostiDomain.ts:2017`) | `nextPreventivoManualeWriter.ts:298`, `ArchivistaArchiveClient.ts:603` | id, fornitore, righe/voci, importi, valuta, pdfUrl, source | alto | DIMOSTRATO |
| `storage/@preventivi_approvazioni` | storage document | capo/procurement (`nextCapoDomain.ts:361`) | clone state/approvazioni DA VERIFICARE | approval source, targa, stato | alto | DIMOSTRATO lettura, writer DA VERIFICARE |
| `storage/@listino_prezzi` | storage document | procurement/documenti (`nextDocumentiCostiDomain.ts:2097`) | `nextPreventivoManualeWriter.ts:408` | `voci[]`: articolo, descrizione, fornitore, prezzo, valuta | alto | DIMOSTRATO |
| `storage/@colleghi` | storage document | anagrafiche, autisti, magazzino (`nextColleghiDomain.ts:270`) | `nextAnagraficheWriter.ts:170` | nome, telefono, badge, codice, descrizione, pinSim, pukSim, schedeCarburante | alto | DIMOSTRATO |
| `storage/@fornitori` | storage document | anagrafiche/procurement/magazzino (`nextFornitoriDomain.ts:208`) | `nextAnagraficheWriter.ts:192` | nome, telefono, badge, codice, descrizione | medio | DIMOSTRATO |
| `storage/@officine` | storage document | scadenze/anagrafiche (`nextOfficineDomain.ts:208`) | `nextAnagraficheWriter.ts:216` | nome, telefono, telefoniAggiuntivi, citta | medio | DIMOSTRATO |
| `storage/@attrezzature_cantieri` | storage document | attrezzature/materiali (`nextAttrezzatureCantieriDomain.ts:510`) | `nextAttrezzatureCantieriWriter.ts:238` | id, tipo, data, materialeCategoria, descrizione, quantita, unita, cantiereId, cantiereLabel, note, fotoUrl/path | alto | DIMOSTRATO |
| `storage/@rifornimenti` | storage document | dossier/centro/cisterna (`nextRifornimentiDomain.ts:1226`) | `NextAutistiAdminNative.tsx:1847`, `:1864` | targa, data, litri, km, costo, distributore, metodoPagamento, autista | alto | DIMOSTRATO |
| `storage/@rifornimenti_autisti_tmp` | storage document | dossier/centro/cisterna/admin | `NextAutistiAdminNative.tsx:2108`, `:2180` | record rifornimento temporaneo autista | alto | DIMOSTRATO |
| `storage/@autisti_sessione_attive` | storage document | centro/autisti/admin (`nextCentroControlloDomain.ts:18`) | `NextAutistiAdminNative.tsx:1052`, `:1135`, `:1157`, `:1209` | sessione autista, mezzo, stato, timestamp | alto | DIMOSTRATO |
| `storage/@storico_eventi_operativi` | storage document | centro/inbox/log accessi | `NextAutistiAdminNative.tsx:1439`, `:1462` | evento, autista, mezzo, data, tipo | alto | DIMOSTRATO |
| `storage/@segnalazioni_autisti_tmp` | storage document | centro/inbox/dettaglio lavoro | `NextAutistiAdminNative.tsx:1500`, `:1601` | segnalazione, targa, autista, descrizione, foto | alto | DIMOSTRATO |
| `storage/@controlli_mezzo_autisti` | storage document | centro/inbox/dettaglio lavoro | `NextAutistiAdminNative.tsx:1691` | check gomme/freni/luci/perdite, note, target | alto | DIMOSTRATO |
| `storage/@richieste_attrezzature_autisti_tmp` | storage document | centro/inbox | `NextAutistiAdminNative.tsx:1525` | richiesta, autista, mezzo, testo, allegati | medio | DIMOSTRATO |
| `storage/@cambi_gomme_autisti_tmp` | storage document | inbox gomme, dossier gomme (`nextManutenzioniGommeDomain.ts:641`) | `NextAutistiAdminNative.tsx:1710` | evento gomme temporaneo | medio | DIMOSTRATO |
| `storage/@gomme_eventi` | storage document | dossier gomme | `NextAutistiAdminNative.tsx:1727` | evento gomme ufficiale | medio | DIMOSTRATO |
| `storage/@costiMezzo` | storage document | documenti/capo (`nextDocumentiCostiDomain.ts:1815`) | delete/update documenti costo (`nextDocumentiCostiDomain.ts:2488`, `:2571`) | costi per targa, importi, source | alto | DIMOSTRATO |
| `@documenti_mezzi` | Firestore root collection | dossier, manutenzioni, archivista (`nextDocumentiMezzoDomain.ts:252`, `ArchivistaDocumentoMezzoBridge.tsx:1090`) | Archivista (`ArchivistaArchiveClient.ts:502`), delete/update documenti costi (`nextDocumentiCostiDomain.ts:2437`, `:2586`) | id, targa, categoria, dati documento, file metadata, campi estratti | critico | DIMOSTRATO |
| `@documenti_magazzino` | Firestore root collection | magazzino/IA documenti (`ArchivistaMagazzinoBridge.tsx:155`) | Archivista (`ArchivistaArchiveClient.ts:502`) | documento magazzino/preventivo, file metadata, estratti IA | alto | DIMOSTRATO |
| `@documenti_generici` | Firestore root collection | IA documenti/chat (`nextDocumentiMezzoDomain.ts:13`) | Archivista | archivio generico | medio | DIMOSTRATO |
| `@analisi_economica_mezzi` | Firestore root collection | dossier/analisi (`nextDossierMezzoDomain.ts:507`, `nextAnalisiEconomicaDomain.ts:146`) | writer NEXT NON PRESENTE in audit | record analisi per targa | medio | DIMOSTRATO lettura |
| `@impostazioni_app/gemini` | Firestore doc | IA config (`nextIaConfigDomain.ts:29`) | salvataggio bloccato read-only (`nextIaConfigDomain.ts:51`) | apiKey | alto | DIMOSTRATO |
| `@documenti_cisterna` | Firestore root collection | cisterna (`nextCisternaDomain.ts:509`) | `nextCisternaWriter.ts:65`, `:37` | payload documento cisterna, duplicate choice, metadata file | alto | DIMOSTRATO |
| `@cisterna_schede_ia` | Firestore root collection | cisterna schede (`nextCisternaDomain.ts:574`) | `nextCisternaWriter.ts:72`, `:83` | scheda IA, crop, parametri estratti | alto | DIMOSTRATO |
| `@cisterna_parametri_mensili` | Firestore root collection | cisterna (`nextCisternaDomain.ts:618`) | `nextCisternaWriter.ts:19` | mese, cambioEurChf, updatedAt | medio | DIMOSTRATO |
| `euromecc_pending/done/issues/area_meta` | Firestore root collections | Euromecc (`nextEuromeccDomain.ts:396-399`) | `nextEuromeccDomain.ts:460-628` | task, done, issue, cemento/meta area | alto | DIMOSTRATO |
| `euromecc_relazioni` | Firestore root collection | Euromecc (`NextEuromeccPage.tsx:2665`, `:3067`, `:3211`) | `NextEuromeccPage.tsx:2980`, `:3033`, `:3181` | relazione intervento, tecnici, data, componenti, allegati | alto | DIMOSTRATO |
| `euromecc_extra_components` | Firestore root collection | Euromecc (`NextEuromeccPage.tsx:1770`) | `NextEuromeccPage.tsx:3116` | componente extra rilevato | medio | DIMOSTRATO |
| Firebase Storage allegati/foto | Storage path | moduli con file | upload/delete in magazzino/procurement/attrezzature/cisterna/archivista/euromecc | path, downloadURL | alto | DIMOSTRATO |
| localStorage/sessionStorage NEXT | browser storage | shell/autisti/clone state/procurement draft | molte pagine | sessione autista, clone overlay, draft ordine, sidebar | medio | DIMOSTRATO |

## 2. Data contract writer NEXT

| Collezione | Writer NEXT | Campo/payload salvato | Tipo | Obbligatorio | Origine | Default/sanitizzazione | Fonte |
|---|---|---|---|---|---|---|---|
| `@manutenzioni` | `saveNextManutenzioneBusinessRecord` | `id`, `targa`, `data`, `tipo`, `fornitore`, `km`, `ore`, `sottotipo`, `descrizione`, `eseguito`, `materiali`, `importo`, `assiCoinvolti`, `gommePerAsse`, `gommeStraordinario`, `sourceDocumentId` | union object | dipende | input UI + inventario + documento sorgente | `sanitizeBusinessRecord`, `normalizeText`, `normalizeNumber` | `nextManutenzioniDomain.ts:811-853`, `:982-994` |
| `@inventario` | `persistInventario` | `id`, `descrizione/label/nome`, `quantita`, `fornitore`, `unita`, `sogliaMinima`, `stockKey`, `stockLoadKeys`, `fotoUrl`, `fotoStoragePath` | object array | dipende | input UI + stock calcolato | `buildInventarioRecord`; shape storage preservata | `NextMagazzinoPage.tsx:616-648`, `:1588-1593` |
| `@materialiconsegnati` | `persistConsegne` | `id`, `materiale`, `materialeLabel`, `quantita`, `mezzoTarga/targa`, `destinatario`, `cantiere`, `motivo`, `data`, `fornitore`, `inventarioRefId`, `materialeId`, `stockKey`, `direzione`, `tipo`, `origine` | object array | dipende | input UI + inventario | normalizzazione testo/numeri in pagina | `NextMagazzinoPage.tsx:657-723`, `:1597-1602` |
| `@cisterne_adblue` | `persistCambi` | `data`, `quantitaLitri/quantita/litri`, `inventarioRefId`, `materialeId`, `stockKey`, `descrizione`, `materialeLabel`, `fornitore`, `numeroCisterna`, `note` | object array | dipende | input UI | normalizzazione pagina | `NextMagazzinoPage.tsx:757-778`, `:1606-1611` |
| `@colleghi` | `saveNextCollega` | `nome`, `telefono`, `telefonoPrivato`, `badge`, `codice`, `descrizione`, `pinSim`, `pukSim`, `schedeCarburante` | object | dipende | input anagrafiche | `sanitizeCollega` | `nextAnagraficheWriter.ts:127-138`, `:170` |
| `@fornitori` | `saveNextFornitore` | `nome`, `telefono`, `badge`, `codice`, `descrizione` | object | dipende | input anagrafiche | `sanitizeFornitore` | `nextAnagraficheWriter.ts:142-156`, `:192` |
| `@officine` | `saveNextOfficina` | `nome`, `telefono`, `telefoniAggiuntivi`, `citta` | object | dipende | input anagrafiche | `sanitizeOfficina` | `nextAnagraficheWriter.ts:160-166`, `:216` |
| `@mezzi_aziendali` | `updateNextMezzoAnagrafica` | record mezzo esistente aggiornato con campi anagrafica input | object | dipende | input anagrafiche | merge su record esistente | `nextMezziWriter.ts:125-154` |
| `@mezzi_aziendali` | `setPrenotazioneCollaudo` | `prenotazioneCollaudo: { data, ora, luogo?, note? }` | object | si per data/ora | input Scadenze | normalizza stringhe | `nextScadenzeCollaudiWriter.ts:115-148` |
| `@mezzi_aziendali` | `setPreCollaudo` | `preCollaudo: { data, officina, lavoriPrevisti? }` | object | si per data/officina | input Scadenze | normalizza stringhe | `nextScadenzeCollaudiWriter.ts:151-180` |
| `@mezzi_aziendali` | `markRevisioneCompletata` | stato revisione/data/esito/note su record mezzo | object merge | dipende | input Scadenze | calcolo date revisione | `nextScadenzeCollaudiWriter.ts:183-242` |
| `@attrezzature_cantieri` | `create/editMovimentoAttrezzatura` | `id`, `tipo`, `data`, `materialeCategoria`, `descrizione`, `quantita`, `unita`, `cantiereId`, `cantiereLabel`, `note`, `fotoUrl`, `fotoStoragePath`, `sourceCantiereId`, `sourceCantiereLabel` | object array | dipende | input UI + upload foto | `todayLegacyFormat`, normalize text, default `TUBI` | `nextAttrezzatureCantieriWriter.ts:164-219`, `:238` |
| `@ordini` | Materiali da ordinare | `nuovoOrdine` con materiali, fornitore, stato, file/foto, date | object array | dipende | input UI + upload | draft sessionStorage e normalizzazioni pagina | `NextMaterialiDaOrdinarePage.tsx:1001`, `:1146`, `:1164` |
| `@ordini` | Procurement panel | ordine aggiornato o filtered | object array | dipende | input UI | overwrite array | `NextProcurementReadOnlyPanel.tsx:258-264`, `:566-598` |
| `@preventivi` | `saveNextPreventivoManuale` | preventivo con PDF/foto, fornitore, valuta, voci/importi | object in `preventivi` | dipende | input manuale + upload | `sanitizeUndefinedToNull` | `nextPreventivoManualeWriter.ts:228-300` |
| `@listino_prezzi` | `upsertListinoFromPreventivoManuale` | `voci: next` | array | dipende | righe preventivo | dedup/upsert articolo | `nextPreventivoManualeWriter.ts:307-408` |
| `@lavori` | Lavori da eseguire | lista temporanea di lavori: `id`, `descrizione`, `targa`, `urgenza`, `eseguito`, sottoElementi | object array | si per descrizione | input UI | append a esistenti | `NextLavoriDaEseguirePage.tsx:522-524` [OBSOLETO 2026-05-16: dismissione Lavori NEXT — writer non più attivi; vedi J.1–J.11] |
| `@lavori` | Dettaglio lavoro | `eseguito`, `chiHaEseguito`, `dataEsecuzione`; oppure `descrizione`, `dataInserimento`; delete per id | object array | dipende | input UI | map/filter array | `NextDettaglioLavoroPage.tsx:839-894` [OBSOLETO 2026-05-16: come sopra] |
| `euromecc_pending` | `add/update/deleteEuromeccPendingTask` | `areaKey`, `subKey`, `title`, `priority`, `dueDate`, `note`, timestamp | object | dipende | input Euromecc | serverTimestamp/update | `nextEuromeccDomain.ts:457-489` |
| `euromecc_done` | `add/update/deleteEuromeccDoneTask` | `title`, `doneDate`, `by`, `note`, `nextDate`, area/sub, timestamp | object | dipende | input Euromecc | serverTimestamp/update | `nextEuromeccDomain.ts:507-546` |
| `euromecc_issues` | `add/update/close/deleteEuromeccIssue` | `areaKey`, `subKey`, `title`, `check`, `type`, `reportedAt`, `reportedBy`, `note`, stato close | object | dipende | input Euromecc | update | `nextEuromeccDomain.ts:556-604` |
| `euromecc_area_meta` | `saveEuromeccAreaCementType` | area metadata, cement type, `updatedBy` | object | dipende | input Euromecc | setDoc merge | `nextEuromeccDomain.ts:616-628` |
| `euromecc_relazioni` | `NextEuromeccPage` | relazione intervento con `dataIntervento`, `tecnici`, componenti, allegati, stato | object | dipende | output IA + input conferma | DA VERIFICARE campo completo | `NextEuromeccPage.tsx:2980-3033`, `:3181-3185` |
| `@documenti_cisterna` | `createNextCisternaIaDocumentRecord` | `args.payload` | object unknown | dipende | output IA cisterna | payload gia costruito dalla pagina | `nextCisternaWriter.ts:62-65`, `NextCisternaIAPage.tsx:341-366` |
| `@cisterna_schede_ia` | `create/updateNextCisternaSchedaRecord` | `args.payload`, `createdAt`, `updatedAt`, crop metadata | object unknown | dipende | output IA schede + crop | serverTimestamp | `nextCisternaWriter.ts:69-83` |
| `@cisterna_parametri_mensili` | `saveNextCisternaMonthlyExchange` | `mese`, `cambioEurChf`, `updatedAt` | string/number/null/timestamp | si per mese | input UI | serverTimestamp | `nextCisternaWriter.ts:15-24` |
| root documenti | `ArchivistaArchiveClient` | payload archivio: targetCollection, file metadata, extracted fields | object unknown | dipende | output IA + upload | target whitelist `@documenti_magazzino/@documenti_mezzi` | `ArchivistaArchiveClient.ts:74`, `:439`, `:502`, `:622` |
| `@mezzi_aziendali` | IA libretto/Archivista documento mezzo | record mezzo aggiornato con dati libretto/documento | object array | dipende | output IA confermato | rollback in alcuni branch | `NextIALibrettoPage.tsx:465`, `ArchivistaDocumentoMezzoBridge.tsx:2836-2953` |
| autisti datasets | `NextAutistiAdminNative` | sessioni, eventi, segnalazioni, controlli, richieste, gomme, rifornimenti | object arrays | dipende | decisione admin su inbox | setItemSync e setDoc dossier rifornimenti | `NextAutistiAdminNative.tsx:1052-2206` |

## 3. Writer non confermati o read-only

| Modulo | Esito | Fonte |
|---|---|---|
| `NextAutistiRifornimentoPage` | NON scrive business; mostra errore read-only | `src/next/autisti/NextAutistiRifornimentoPage.tsx:157` |
| `NextAutistiSegnalazioniPage` | NON scrive business; mostra errore read-only | `src/next/autisti/NextAutistiSegnalazioniPage.tsx:371` |
| `NextAutistiRichiestaAttrezzaturePage` | NON scrive business; mostra errore read-only | `src/next/autisti/NextAutistiRichiestaAttrezzaturePage.tsx:74` |
| `NextAutistiControlloPage` | NON scrive business; mostra errore read-only | `src/next/NextAutistiControlloPage.tsx:105` |
| `nextIaConfigDomain.saveNextIaConfigSnapshot` | NON scrive; lancia errore clone read-only | `src/next/domain/nextIaConfigDomain.ts:51` |

## 4. Campi fuori schema o da verificare

| Area | Stato | Motivo |
|---|---|---|
| Payload completi IA Archivista | DA VERIFICARE | payload dipende da output IA e dal target; campi principali dimostrati, schema completo non fissato in un writer tipizzato unico |
| Payload Euromecc relazioni | DA VERIFICARE | diversi branch salvano bozza/conferma/ordine; campi principali dimostrati, schema completo esteso |
| Payload Cisterna documenti/schede | DA VERIFICARE | `NextCisternaIaDocumentPayload = Record<string, unknown>` e `NextCisternaSchedaPayload = Record<string, unknown>` |
| Firestore/Storage rules | NON LETTO | fuori perimetro operativo del prompt; non sono runtime NEXT |
