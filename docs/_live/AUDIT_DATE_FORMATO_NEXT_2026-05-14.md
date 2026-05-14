# AUDIT — FORMATO DATA NEL GESTIONALE NEXT

> Data: 2026-05-14 · Autore: Claude Code · Metodo: lettura statica del codice `src/next/`.
> Scopo: mappare ogni punto del NEXT dove una data viene mostrata, inserita, cercata o
> esportata, per arrivare a un formato `gg/mm/aaaa` unico per l'utente.
> Read-only: zero modifiche a codice. Punti non confermati nel codice marcati `DA VERIFICARE`.

## Sintesi esecutiva

Il NEXT **non ha un formato data unico**. Esiste un helper centrale —
`src/next/nextDateFormat.ts` — ma produce `GG MM AAAA` **separato da spazi** (`formatDateUI`),
che non e ne il formato italiano atteso (`gg/mm/aaaa`) ne ISO. Attorno a questo helper
sono cresciute almeno **9 rappresentazioni testuali diverse** della stessa data e oltre
**15 copie locali di `parseDateFlexible`** (una per file di dominio/pagina), piu il parser
robusto `parseRobusto.ts` (PROMPT 38a) e il parser dedicato chat IA `chatIaToolDates.ts`.

Formati attualmente a video: `GG MM AAAA` (spazi, centrale), `GG/MM/AAAA` (slash, manutenzioni
+ chat IA tool), `GG/MM` (slash senza anno), `GG.MM.AAAA · HH:MI` (punti, Archivio espanso),
`GG.MM · HH:MI` (punti, timeline Archivio), `G/M/AAAA` (slash senza zeri, `toLocaleDateString`
chat IA), `8 mag 2026` (label mese, Archivio), `9 aprile 2027` (esteso, chat IA), e `AAAA-MM-GG`
ISO per input/filtri. Lo stesso PDF Quadro mescola `GG/MM/AAAA` e `GG MM AAAA` in tabelle diverse.

Il punto piu insidioso e il **round-trip di input** in `NextManutenzioniPage`: l'input passa
per ISO (`toDateInputValue`) ma viene **riscritto su storage come `GG MM AAAA` a spazi**
(`fromDateInputValue`), quindi lo storage stesso e in formato legacy a spazi. Cambiare solo
il display senza considerare lo storage e i parser rompe la ricerca e l'ordinamento.

Proposta in fondo: un helper unico `formatDataIt` / `formatDataOraIt` su `nextDateFormat.ts`,
locale `it-IT`, che si appoggia a `parseDataRobusta` per il parsing.

## B.1 — Tabella riepilogativa per tipo

### DISPLAY (mostra a video)

| file:riga | helper / formato prodotto | sorgente dato |
|---|---|---|
| `nextDateFormat.ts:104` `formatDateUI` | **`GG MM AAAA` (spazi)** — helper centrale, molti usi | qualsiasi (`toNextDateValue`) |
| `nextDateFormat.ts:110` `formatDateTimeUI` | `GG MM AAAA HH:MM` (spazi) | qualsiasi |
| `helpers/storiaRecord.ts:41`/`:47` `formatShortDate`/`formatLongDate` | wrap di `formatDateUI`/`formatDateTimeUI` → spazi | ms number |
| `NextManutenzioniPage.tsx:238` `formatDateShort` | `GG/MM` (slash, senza anno) | stringa record |
| `NextManutenzioniPage.tsx:246` `formatDateFull` | `GG/MM/AAAA` (slash) | stringa record |
| `centroControllo/archivioStorico/rows/ArchivioRowShared.tsx:37` `formatDateShort` | `8 mag` + anno + `HH:MM` (label mese it) | ms number |
| `centroControllo/archivioStorico/rows/ArchivioRowShared.tsx:57` `formatTimelineStamp` | `GG.MM · HH:MI` (punti) | ms number |
| `centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx:17` `formatDateTimeLong` | `GG.MM.AAAA · HH:MI` (punti) | ms number |
| `chat-ia/tools/chatIaToolDates.ts:251` `formatItalianDate` | `GG/MM/AAAA` (slash) — formato target | qualsiasi (`parseChatIaToolDate`) |
| `chat-ia/tools/chatIaToolDates.ts:284` `formatItalianDateLong` | `9 aprile 2027` (`toLocaleDateString` esteso) | qualsiasi |
| `chat-ia/tools/chatIaToolDates.ts:265` `formatItalianDateFromItalianSource` | **`MM/GG/AAAA` se ambiguo** (vedi rischio R3) | stringa ISO |
| `chat-ia/sectors/mezzi/chatIaMezziTimeline.ts:12` | `toLocaleDateString("it-IT")` → `G/M/AAAA` (senza zeri) | ms number |
| `chat-ia/views/CertifiedView.tsx:74` | `value.toDate().toLocaleDateString("it-IT")` → `G/M/AAAA` | Firestore Timestamp |
| `NextHomePage.tsx:85-89` `formatCurrentDate` | `Intl.DateTimeFormat` it-IT (weekday/day/month) — header | `Date` |
| `NextCisternaPage.tsx:90` / `:176` | `new Intl.DateTimeFormat("it-CH", …)` / mesi `it-CH` | `Date` |
| `domain/nextCentroControlloDomain.ts:489`/`:493` `formatDateLabel`/`formatDateTimeLabel` | `DA VERIFICARE` formato esatto | ms number |
| `domain/nextManutenzioniDomain.ts:379` `formatLegacyDateLabel` | `DA VERIFICARE` formato esatto | unknown |
| `domain/nextDocumentiCostiDomain.ts:568`, `nextMaterialiMovimentiDomain.ts:491`, `nextOperativitaGlobaleDomain.ts:243`, `nextProcurementDomain.ts:491`, `nextManutenzioniGommeDomain.ts:613`/`:621` `formatLegacyDateLabel`/`formatDateLabel` | famiglia di label legacy per-dominio, `DA VERIFICARE` formati | timestamp/stringa |
| `components/NextCentroControlloSinottica.tsx:228` `formatDateIt` | `DA VERIFICARE` (probabile slash) | ms number |
| `NextCentroControlloParityPage.tsx:197` `formatDateItDisplay` | `DA VERIFICARE` | `Date` |
| `NextCentroControlloPage.tsx:529` `formatDateForDisplay` | `DA VERIFICARE` | `Date` |
| `components/NextMezzoCronologiaModal.tsx:14` `formatDateLong` | `DA VERIFICARE` (esteso) | ms number |
| `NextCapoCostiMezzoPage.tsx:76` `formatDateShort` | `DA VERIFICARE` | stringa+timestamp |
| `autistiInbox/*` `formatDateTime` (in `NextAutistiLogAccessiAllNative.tsx:49`, `NextAutistiGommeAllNative.tsx:38`, `NextAutistiSegnalazioniAllNative.tsx:49`, `NextAutistiControlliAllNative.tsx:37`, `NextRichiestaAttrezzatureAllNative.tsx:35`, `NextCambioMezzoInboxNative.tsx:40`, `autistiInbox/components/NextSessioniAttiveCard.tsx:33`, `NextAutistiAdminNative.tsx:114`/`:149`) | ~9 copie locali `formatDateTime`/`formatDateString`, `DA VERIFICARE` ogni formato | ms number |
| `autisti/NextAutistiSegnalazioniPage.tsx:34` `toItDateTime` | `DA VERIFICARE` | ms number |
| `internal-ai/internalAiReportPdf.ts:74`, `internal-ai/internalAiProfessionalVehicleReport.ts:106` `formatDateLabel` | `DA VERIFICARE` (export PDF, vedi EXPORT) | stringa |
| `NextScadenzeCollaudiPage.tsx:77` `formatDateLabel` | `DA VERIFICARE` | ms number |
| `NextIADocumentiPage.tsx:117` `formatDate` | `DA VERIFICARE` | item archivio |

### INPUT (campo utente)

| file:riga | helper / comportamento | nota |
|---|---|---|
| `nextDateFormat.ts:116` `formatDateInput` | produce `AAAA-MM-GG` (ISO) per campo input | helper centrale input |
| `nextDateFormat.ts:122` `formatEditableDateUI` | produce `GG MM AAAA` (spazi) per campo editabile | incoerente con `formatDateInput` |
| `NextManutenzioniPage.tsx:218` `toDateInputValue` | record → `AAAA-MM-GG` per l'input | usa `parseLegacyDate` (CRITICA in 38a) |
| `NextManutenzioniPage.tsx:231` `fromDateInputValue` | input `AAAA-MM-GG` → **`GG MM AAAA` (spazi) salvato su storage** | lo storage resta legacy a spazi |
| `NextScadenzeCollaudiPage.tsx:82`/`:90` `formatEditableDate`/`formatDateFieldValue` | `DA VERIFICARE` formato campo | input scadenze |
| `nextScadenzeCollaudiWriter.ts:107`/`:111` `formatDateForInput`/`formatDateForDisplay` | `DA VERIFICARE` | writer scadenze |
| `autistiInbox/NextAutistiInboxHomeNative.tsx:318` `formatDateInputValue` | `DA VERIFICARE` (probabile ISO) | filtro/giorno inbox |
| `autistiInbox/NextCambioMezzoInboxNative.tsx:16` `formatDateInputValue` | `DA VERIFICARE` | input giorno |
| `nextAnagraficheFlottaDomain.ts:249` `formatDateInput` | `DA VERIFICARE` (probabile ISO) | input anagrafica |
| `components/NextRifornimentoEditModal.tsx:30` `formatDateItDisplay` | `DA VERIFICARE` | modale rifornimento |
| Nota: **nessun `<input type="date">`** trovato in `src/next/` — gli input data sono testuali / custom, quindi il formato dipende interamente da questi helper. |

### SEARCH (filtro / query)

| file:riga | helper / comportamento | nota |
|---|---|---|
| `centroControllo/archivioStorico/ArchivioToolbar.tsx:71` `toDateInputValue` | `ts → AAAA-MM-GG` per il filtro data Archivio | wire format ISO |
| `centroControllo/archivioStorico/hooks/useArchivioUrlState.ts` | stato filtro periodo in URL, `DA VERIFICARE` formato persistito | back/forward browser |
| `centroControllo/archivioStorico/hooks/useArchivioFilters.ts` | applica il filtro periodo, `DA VERIFICARE` confronto | — |
| `chat-ia/tools/chatIaToolDates.ts:127` `resolveRelativePeriodExpression` | espressioni ("mese scorso", "ultimi 7 giorni") → range **ISO** `{from,to}` | deterministico, wire ISO |
| `chat-ia/tools/chatIaToolDates.ts:207` `parseChatIaToolDate` | parser robusto per le query chat IA (ISO, italiano, ms, Timestamp) | — |
| `NextManutenzioniPage.tsx` filtri lista | `DA VERIFICARE` se la search testuale tocca le date | — |

### EXPORT (PDF / CSV / print)

| file:riga | helper / formato | nota |
|---|---|---|
| `NextManutenzioniPage.tsx:515` `formatMaintenancePdfDateLabel` | `formatDateFull` → `GG/MM/AAAA` | PDF Quadro |
| `NextManutenzioniPage.tsx:581` `formatPdfChiusuraDateLabel` | `formatDateFull` → `GG/MM/AAAA` | PDF Quadro, colonna Data chiusura |
| `NextManutenzioniPage.tsx:531` `normalizePdfDateCandidate` | `formatDateUI` → **`GG MM AAAA` (spazi)** | **stesso PDF, formato diverso da sopra** |
| `NextManutenzioniPage.tsx:607` `formatPdfGenerationDate` | `formatDateTimeUI` → `GG MM AAAA HH:MM` | intestazione PDF |
| `NextAttrezzatureCantieriWritePanel.tsx:109` `formatDataExport` | `DA VERIFICARE` | export attrezzature |
| `internal-ai/internalAiReportPdf.ts:74` `formatDateLabel` | `DA VERIFICARE` | PDF report IA |
| `internal-ai/internalAiProfessionalVehicleReport.ts:106` `formatDateLabel` | `DA VERIFICARE` | PDF report mezzo IA |
| `chat-ia/tools/registry/toolGenerateReportPdf.ts` | `DA VERIFICARE` quale helper data usa | PDF generato da chat IA |
| `domain/nextLibrettiExportDomain.ts:152` `formatFileDate`, `NextLibrettiExportPage.tsx:40` `formatFileDate`, `components/NextHomeAutistiEventoModal.tsx:104` `formatFileDate` | data per **nome file** export, `DA VERIFICARE` formato | non e display utente ma export |

## B.2 — Formati attuali divergenti (conteggio per formato)

| Formato visibile | Esempio | Dove (sintesi) | Punti circa |
|---|---|---|---|
| `GG MM AAAA` (spazi) | `08 05 2026` | `formatDateUI`/`formatDateTimeUI` centrali + storiaRecord + parte del PDF Quadro | il piu diffuso (helper centrale) |
| `GG/MM/AAAA` (slash) | `08/05/2026` | `NextManutenzioniPage.formatDateFull`, `chatIaToolDates.formatItalianDate` | 2 helper, molti chiamanti |
| `GG/MM` (slash, no anno) | `08/05` | `NextManutenzioniPage.formatDateShort` | 1 |
| `GG.MM.AAAA · HH:MI` (punti) | `08.05.2026 · 14:30` | `ArchivioRowExpanded.formatDateTimeLong` | 1 (segnalazioni/richieste Archivio) |
| `GG.MM · HH:MI` (punti) | `08.05 · 14:30` | `ArchivioRowShared.formatTimelineStamp` | 1 (timeline Archivio compatto) |
| `G/M/AAAA` (slash, no zeri) | `8/5/2026` | `toLocaleDateString("it-IT")` in `chatIaMezziTimeline`, `CertifiedView` | 2 |
| `8 mag 2026` (label mese) | `8 mag 2026` | `ArchivioRowShared.formatDateShort` | 1 (blocco data Archivio) |
| `9 aprile 2027` (esteso) | `9 aprile 2027` | `chatIaToolDates.formatItalianDateLong` | 1 |
| `AAAA-MM-GG` (ISO) | `2026-05-08` | `formatDateInput`, `toDateInputValue`, `ArchivioToolbar`, range chat IA | input/search — **wire format, da mantenere** |
| `Intl.DateTimeFormat` it-IT/it-CH | variabile | `NextHomePage`, `NextCisternaPage` | 2-3 (header/contesti) |

Inoltre lo **storage** di alcune date manutenzione e `GG MM AAAA` a spazi (scritto da
`fromDateInputValue`, `NextManutenzioniPage.tsx:231-236`): non e solo un problema di display,
e anche di formato persistito.

## B.3 — Helper attuali

- **Centrale**: `src/next/nextDateFormat.ts` — `toNextDateValue` (parser), `formatDateUI`
  (`GG MM AAAA`), `formatDateTimeUI`, `formatDateInput` (ISO), `formatEditableDateUI`
  (`GG MM AAAA`). Usato in molte superfici NEXT.
- **Parser robusto**: `src/next/helpers/parseRobusto.ts` — `parseDataRobusta` /
  `getDataRiferimentoRecord` (PROMPT 38a). Gestisce ISO, legacy italiano, ms, Date,
  Firestore Timestamp. **E il parser corretto, ma non e collegato a `nextDateFormat.ts`.**
- **Parser/formatter chat IA**: `src/next/chat-ia/tools/chatIaToolDates.ts` —
  `parseChatIaToolDate`, `formatItalianDate` (`GG/MM/AAAA`), `formatItalianDateLong`,
  `resolveRelativePeriodExpression`. Isolato dal resto.
- **~15+ copie locali di `parseDateFlexible`**: `domain/nextAttrezzatureCantieriDomain.ts:154`,
  `nextAnagraficheFlottaDomain.ts:191`, `domain/nextCapoDomain.ts:123`,
  `domain/nextDossierMezzoDomain.ts:237`, `domain/nextDocumentiCostiDomain.ts:508`,
  `domain/nextMaterialiMovimentiDomain.ts:429`, `domain/nextManutenzioniGommeDomain.ts:556`,
  `domain/nextRifornimentiDomain.ts:379`, `domain/nextOperativitaGlobaleDomain.ts:234`,
  `domain/nextProcurementDomain.ts:426`, `domain/nextManutenzioniDomain.ts:375`,
  `nextRifornimentiConsumiDomain.ts:226`, `NextAnalisiEconomicaPage.tsx:60`,
  `NextDossierMezzoPage.tsx:51`, `NextCentroControlloSinottica.tsx:193`,
  `NextCapoCostiMezzoPage.tsx:36`, `NextCentroControlloPage.tsx:506`. (Gia mappate con
  gravita nell'audit gemello `AUDIT_PROPAGAZIONE_2026-05-14.md`, sezione A.)
- **Altri parser**: `domain/nextCisternaDomain.ts:269` `toDateFromUnknown`,
  `domain/nextCentroControlloDomain.ts:412` `parseNextCentroControlloDate`,
  `NextManutenzioniPage.tsx:164` `parseLegacyDate`, `NextMappaStoricoPage.tsx:107`
  `parseLegacyDateParts`, `NextGommeEconomiaSection.tsx:27` `parseLegacyDate`,
  `NextMagazzinoPage.tsx:476` `parseStoredDate`, `helpers/eventiCompatibili.ts:54`
  `parseDateMs`, `nextScadenzeCollaudiWriter.ts:79` `parseDateFlexible`.

In totale: **3 famiglie di helper "ufficiali" non collegate tra loro** + oltre **25 parser
locali**.

## B.4 — Proposta di helper unico

Estendere `src/next/nextDateFormat.ts` (il piu centrale) e farlo appoggiare a
`parseDataRobusta` per il parsing, eliminando `toNextDateValue` come parser separato.

```
// Parsing: un solo ingresso
parseDataRobusta(value): number | null        // gia esistente in helpers/parseRobusto.ts

// Display: un solo formato utente
formatDataIt(value: DateLike): string          // "08/05/2026" — null/invalid -> "—"
formatDataOraIt(value: DateLike): string       // "08/05/2026 14:30"
formatDataLungaIt(value: DateLike): string     // "8 maggio 2026" (solo dove serve esteso)

// Wire format (input/search/URL/storage): resta ISO, esplicito
formatDataIso(value: DateLike): string         // "2026-05-08"  (gia formatDateInput)
```

- Locale: `it-IT`, separatore `/`, zeri iniziali sempre presenti.
- `null` / non valido → `"—"` per display, `""` per input.
- Gestione sorgenti: Firestore Timestamp, ISO string, ms number, legacy `GG MM AAAA` /
  `GG/MM/AAAA`, `Date` — tutto delegato a `parseDataRobusta`.
- `chatIaToolDates.formatItalianDate` gia produce `GG/MM/AAAA`: allinearlo come alias o
  sostituirlo con `formatDataIt`.
- Le ~25 copie locali di `parseDateFlexible` vanno consolidate su `parseDataRobusta`
  (intervento gia previsto in `AUDIT_PROPAGAZIONE_2026-05-14.md` sez. C8/C9).

## B.5 — Punti a rischio (dove cambiare il display puo rompere il parsing)

- **R1 — Storage in `GG MM AAAA` a spazi**: `NextManutenzioniPage.fromDateInputValue`
  (`:231-236`) **scrive su storage** la data a spazi. Cambiare il display a `GG/MM/AAAA`
  senza toccare il writer lascia lo storage in formato legacy: il parser unico deve
  continuare ad accettare `GG MM AAAA`, oppure si normalizza anche lo storage (decisione).
- **R2 — Input/search wirano ISO**: `toDateInputValue`, `ArchivioToolbar.toDateInputValue`,
  `formatDateInput`, i range di `resolveRelativePeriodExpression` usano `AAAA-MM-GG`. Il
  formato utente puo diventare `GG/MM/AAAA` ma **il wire format ISO va mantenuto** per
  filtri, URL state e confronti. Non convertire a slash il valore interno.
- **R3 — `formatItalianDateFromItalianSource`** (`chatIaToolDates.ts:265-278`): se la
  stringa ISO ha mese e giorno entrambi ≤ 12 restituisce **`MM/GG/AAAA`** (americano) di
  proposito. Sostituire il display senza capire questo ramo puo produrre un doppio swap
  giorno/mese. Va deciso se questo workaround serve ancora.
- **R4 — `parseLegacyDate` solo-legacy**: `NextManutenzioniPage.tsx:164`,
  `NextMappaStoricoPage.tsx:107` (`parseLegacyDateParts`), `NextGommeEconomiaSection.tsx:27`
  non riconoscono ISO `AAAA-MM-GG` (record `from-lavoro-*`). Gia CRITICA in
  `AUDIT_PROPAGAZIONE_2026-05-14.md`; finche non sono allineati, qualunque cambio di
  formato display passa da un parser che gia sbaglia su quei record.
- **R5 — `toNextDateValue` ms/secondi ambiguo**: `nextDateFormat.ts:36-40` tratta i numeri
  `< 1e12` come secondi e li moltiplica per 1000. `parseDataRobusta` invece tratta il
  numero come ms puro. Unificare i due parser richiede di decidere quale regola vince, o
  i timestamp in secondi verranno interpretati diversamente.
- **R6 — Ordinamento per stringa**: i punti che ordinano per la stringa data (non per
  timestamp) dipendono dal formato. Passare da `GG MM AAAA` a `GG/MM/AAAA` non cambia
  l'ordinamento lessicale (resta sbagliato in entrambi); ma se qualche punto oggi ordina
  ISO `AAAA-MM-GG` (ordinabile) e lo si converte a slash, l'ordinamento si rompe. `DA
  VERIFICARE` quali liste ordinano per stringa vs per timestamp.

## Domande aperte per Giuseppe

1. **Formato unico utente**: confermi `gg/mm/aaaa` (con zeri iniziali) come unico formato
   display? E per data+ora `gg/mm/aaaa hh:mm`?
2. **Storage**: normalizziamo anche il formato *persistito* (oggi `GG MM AAAA` a spazi per
   le manutenzioni da `fromDateInputValue`), o lasciamo lo storage com'e e ci limitiamo a
   un parser che accetta tutto? (R1)
3. **Formato esteso**: serve ancora "9 aprile 2027" (`formatItalianDateLong`) da qualche
   parte, o si uniforma tutto a `gg/mm/aaaa`?
4. **Workaround `formatItalianDateFromItalianSource`** (R3): lo swap a `MM/GG/AAAA` serve
   ancora? Se i dati sono stati bonificati, va rimosso.
5. **Helper unico**: lo costruiamo dentro `nextDateFormat.ts` appoggiato a
   `parseDataRobusta`, o creiamo un modulo nuovo? (consiglio: estendere quello centrale)
6. **Consolidamento parser**: le ~25 copie locali di `parseDateFlexible` vanno consolidate
   in questa stessa SPEC o resta separato (sono gia in `AUDIT_PROPAGAZIONE` C8/C9)?
7. **Regola ms/secondi** (R5): un numero `< 1e12` e secondi o millisecondi? Va deciso
   prima di unificare i parser.
8. **Ordine di intervento**: prima il parser unico (fondamenta) o prima il display unico
   (cio che l'utente vede)? Il display senza parser corretto resta fragile sui record ISO.

## Stato Firestore
Invariato. Audit di sola lettura. Unico effetto su disco: la creazione di questo file e
del file gemello `AUDIT_STORIA_SEGNALAZIONE_SUPERFICI_2026-05-14.md`.
