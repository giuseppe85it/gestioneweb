# REPORT DATE UNIFICATE NEXT - 2026-05-14

> Obiettivo: una sola data visibile nel NEXT in formato `GG/MM/AAAA`, storage Firestore normalizzato a ISO `yyyy-mm-dd`.
> Fonte operativa: `docs/_live/AUDIT_DATE_FORMATO_NEXT_2026-05-14.md`.

## 1. Sintesi

- Helper unico: `src/next/helpers/dateUnica.ts`.
- Test helper: `src/next/helpers/__tests__/dateUnica.test.ts`.
- Migration reale eseguita su `@manutenzioni.data`: 56 valori convertiti da `gg mm aaaa` a `yyyy-mm-dd`.
- Report migration reale: `scripts/oneoff/migrate-dates-report-REAL.json`.
- Script lasciato safe con `DRY_RUN = true`.

## 2. File toccati per fase

### F1 - Helper unico

- `src/next/helpers/dateUnica.ts`
- `src/next/helpers/__tests__/dateUnica.test.ts`

### F2 - Migration storage

- `scripts/oneoff/migrate-dates-storage-iso-2026-05-14.cjs`
- `scripts/oneoff/migrate-dates-report-DRY.json`
- `scripts/oneoff/migrate-dates-report-REAL.json`

### F3 - Display

- `src/next/nextDateFormat.ts`
- `src/next/NextHomePage.tsx`
- `src/next/NextCisternaPage.tsx`
- `src/next/autistiInbox/NextAutistiAdminNative.tsx`
- `src/next/autistiInbox/NextAutistiControlliAllNative.tsx`
- `src/next/autistiInbox/NextAutistiGommeAllNative.tsx`
- `src/next/autistiInbox/NextAutistiInboxHomeNative.tsx`
- `src/next/autistiInbox/NextAutistiLogAccessiAllNative.tsx`
- `src/next/autistiInbox/NextAutistiSegnalazioniAllNative.tsx`
- `src/next/autistiInbox/NextCambioMezzoInboxNative.tsx`
- `src/next/autistiInbox/NextRichiestaAttrezzatureAllNative.tsx`
- `src/next/autistiInbox/components/NextRifornimentiCard.tsx`
- `src/next/autistiInbox/components/NextSessioniAttiveCard.tsx`
- `src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx`
- `src/next/centroControllo/archivioStorico/rows/ArchivioRowFormatters.ts`
- `src/next/centroControllo/archivioStorico/rows/ArchivioRowShared.tsx`
- `src/next/chat-ia/sectors/mezzi/chatIaMezziTimeline.ts`
- `src/next/chat-ia/tools/chatIaToolDates.ts`
- `src/next/chat-ia/views/CertifiedView.tsx`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/domain/nextMaterialiMovimentiDomain.ts`
- `src/next/domain/nextOperativitaGlobaleDomain.ts`

### F4 - Input e search

- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextScadenzeCollaudiPage.tsx`
- `src/next/centroControllo/archivioStorico/ArchivioToolbar.tsx`
- `src/next/centroControllo/archivioStorico/hooks/useArchivioUrlState.ts`
- `src/next/components/NextRifornimentoEditModal.tsx`
- `src/next/nextAnagraficheFlottaDomain.ts`
- `src/next/nextScadenzeCollaudiWriter.ts`

### F5 - Export e punti estesi

- `src/next/NextAttrezzatureCantieriWritePanel.tsx`
- `src/next/NextLibrettiExportPage.tsx`
- `src/next/NextMaterialiConsegnatiPage.tsx`
- `src/next/NextProcurementReadOnlyPanel.tsx`
- `src/next/components/NextHomeAutistiEventoModal.tsx`
- `src/next/domain/nextLibrettiExportDomain.ts`
- `src/next/domain/nextProcurementDomain.ts`
- `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx`
- `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`
- `src/next/internal-ai/internalAiReportPdf.ts`

### F6 - Documentazione e deprecazioni

- `src/next/helpers/parseRobusto.ts`
- `docs/_live/REPORT_DATE_UNIFICATE_2026-05-14.md`
- `docs/_live/REGISTRO_MODIFICHE_CLONE.md`
- `docs/DIARIO_DECISIONI.md`
- `CONTEXT_CLAUDE.md`

## 3. Punti fuori audit originale recuperati

| Punto | Tipo | Sorgente | Helper applicato |
|---|---|---|---|
| `src/next/domain/nextProcurementDomain.ts:573` | DISPLAY / reference export | label data ordine normalizzata o fallback legacy | `toDisplay` |
| `src/next/NextMaterialiConsegnatiPage.tsx:805` | INPUT + EXPORT | testo utente / record movimento | `fromUserInput`, `toISO`, `toDisplay`, `compareISO` |
| `src/next/NextProcurementReadOnlyPanel.tsx:1190` | INPUT + DISPLAY | `arrivalDateLabel` da UI e storage ordini | `fromUserInput`, `toISO`, `toDisplay` |
| `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:464` | DISPLAY | override libretto hardcoded legacy | `toDisplay` |
| `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:465` | DISPLAY | override libretto hardcoded legacy | `toDisplay` |
| `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:480` | DISPLAY | fallback ultimo collaudo hardcoded legacy | `toDisplay` |
| `src/next/NextAttrezzatureCantieriWritePanel.tsx:784` | INPUT + EXPORT | testo utente movimento attrezzature | `fromUserInput`, `toISO`, `toDisplay` |

## 4. Conteggi punti sostituiti

- DISPLAY: 44 punti.
- INPUT: 14 punti.
- SEARCH: 6 punti.
- EXPORT/PDF/filename export: 16 punti.

I conteggi includono i redirect degli helper centrali e i 7 punti fuori audit originale recuperati in F5 estesa.

## 5. Firestore migrato

Fonte: `scripts/oneoff/migrate-dates-report-REAL.json`.

- Collection logica: `@manutenzioni`.
- Campo migrato: `data`.
- Documenti logici scansionati: 74.
- Campi convertiti: 56.
- Scritture Firestore tentate: 1 documento storage (`storage/@manutenzioni`) con array aggiornato.
- Campi esclusi: `dataProgrammata` verificato in dry-run mirato, nessun valore legacy a spazi.

## 6. Helper vecchi

- `parseRobusto.ts`: DEPRECATO, mantenuto per compatibilita chiamanti residui. Nuovo riferimento: `dateUnica.parseAnyDate`.
- `nextDateFormat.ts`: RIDIRETTO a `dateUnica` e marcato DEPRECATO.
- `chatIaToolDates.ts`: RIDIRETTO a `dateUnica` per parsing/formattazione base e marcato DEPRECATO.
- `formatLegacyDateLabel`: RIMOSSO/rinominato nei domini toccati; sostituito da label basate su `toDisplay`.
- `fromDateInputValue`: RIMOSSO dai chiamanti NEXT; la normalizzazione passa da `fromUserInput` / `toISO`.

Rimozione completa degli helper vecchi: da valutare dopo PROMPT 40, quando la storia segnalazione sara' stabilizzata.

## 7. Da aggiornare nell'audit originale

Aggiungere a `docs/_live/AUDIT_DATE_FORMATO_NEXT_2026-05-14.md` i 7 punti fuori audit recuperati:

- `src/next/domain/nextProcurementDomain.ts:573`
- `src/next/NextMaterialiConsegnatiPage.tsx:805`
- `src/next/NextProcurementReadOnlyPanel.tsx:1190`
- `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:464`
- `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:465`
- `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:480`
- `src/next/NextAttrezzatureCantieriWritePanel.tsx:784`

## 8. FASE 7 RECUPERO ISO RESIDUI POST-MIGRATION

Fonte operativa: `docs/_live/SCAN_ISO_RESIDUI_2026-05-14.md`.

Lo scan runtime successivo alla migration `@manutenzioni.data` ha trovato punti display non coperti dall'audit originale che mostravano ISO grezzo, soprattutto in `/next/manutenzioni`, dashboard, mappa storico, dossier mezzo, Chat IA e report IA.

### Numeri scan

- Hit nominali grezzi STEP 1: 308.
- Contesti display classificati `DA SISTEMARE`: 42.
- Punti patchati: 42.
- Ulteriori punti fuori audit oltre a quelli classificati: 0.

### File toccati in Fase 7

- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextMappaStoricoPage.tsx`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/NextAnalisiEconomicaPage.tsx`
- `src/next/NextCisternaPage.tsx`
- `src/next/NextEuromeccPage.tsx`
- `src/next/NextGommeEconomiaSection.tsx`
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `src/next/NextProcurementConvergedSection.tsx`
- `src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx`
- `src/next/chat-ia/agents/analytics.ts`
- `src/next/chat-ia/sectors/mezzi/chatIaMezziReport.ts`
- `src/next/chat-ia/sectors/mezzi/chatIaMezziTimeline.ts`
- `src/next/domain/nextCentroControlloDomain.ts`
- `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx`
- `src/next/internal-ai/InternalAiMezzoCard.tsx`
- `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`
- `src/next/nextPreventivoIaHelpers.ts`

### Pattern applicato

- Display testuale semplice: `toDisplay(value) || value`.
- Display con orario: helper gia ridiretto a `toDisplayDateTime`.
- Template string: data estratta o sostituita con helper locale basato su `dateUnica`.
- Timeline Chat IA: `dateLabel` normalizzata a `GG/MM/AAAA`; timestamp interno calcolato tramite `parseAnyDate` invece di `Date.parse`.

### Esclusioni motivate

- `src/next/helpers/storiaRecord.ts` e `StoriaRecordTimeline`: esclusi per vincolo PROMPT 40.
- Input/edit form e writer: esclusi per vincolo Fase 7, la scrittura ISO era gia gestita.
- `toLocaleString`: residui solo per formattazione numerica, importi o km.
- ISO residui: solo test, commenti, helper di parsing e costante tecnica `CANONICAL_LIBRETTO_COLLAUDO_ISO`.

### Verifica Fase 7

- `npm run build`: PASS.
- `npx tsc --noEmit`: PASS.
- `rg '\d{4}-\d{2}-\d{2}' src/next/ --glob '*.ts' --glob '*.tsx'`: nessun render JSX con ISO grezzo.
- `npx eslint` mirato sui file Fase 7 escluso `NextEuromeccPage.tsx`: PASS con 1 warning preesistente in `ArchivistaDocumentoMezzoBridge.tsx`.
- `npx eslint` includendo `NextEuromeccPage.tsx`: FAIL su baseline preesistente non toccata dalla patch (`react-hooks/set-state-in-effect`, `no-control-regex`).

Nota: l'audit originale era incompleto; questa fase ha recuperato via scan runtime esaustivo i residui visibili post-migration.

## 9. Verifiche

- `npm run build`: PASS.
- `npx tsc --noEmit`: PASS.
- `npx vitest run`: FAIL per 24 file `tests/e2e/*.spec.ts` Playwright raccolti da Vitest (`Playwright Test did not expect test.beforeEach()/test() to be called here`). I 14 test unitari `dateUnica` passano.
- `npx vitest run src/next/helpers/__tests__/dateUnica.test.ts`: PASS, 14/14.
- `npx eslint` mirato sui file runtime toccati: PASS con 1 warning preesistente in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx` (`react-hooks/exhaustive-deps` su `preloadDocument`).
- `rg "GG MM AAAA|gg mm aaaa| \d\d \d\d \d\d\d\d " src/next`: 0 hit.
- `rg "toLocaleDateString|toLocaleString|Intl\.DateTimeFormat" src/next`: solo formattazioni numeriche residue, non date.

## 10. Residuo per PROMPT 40

PROMPT 40 resta dedicato alla storia segnalazione e alla frase narrativa. Questo prompt non ha modificato `StoriaRecordTimeline` ne' la formulazione della storia.

## 11. FASE 9 SWEEP TOTALE DATE NEXT

Fonte operativa: `docs/_live/SCAN_DATE_TOTALE_2026-05-14.md`.

La Fase 9 ha rieseguito uno scan esteso su `src/next/` e sui punti backend potenzialmente user-facing. I residui erano in larga parte falsi positivi tecnici: id, nomi file, `Date.now`, costanti ISO, test, chart payload `data`, backup `.bak` e wrapper gia' ridiretti a `dateUnica`. I punti runtime effettivi rimasti sono stati convertiti o normalizzati.

### Numeri scan Fase 9

| Categoria | Hit raw post-patch |
|---|---:|
| Template literal con probabile data | 259 |
| JSX render diretto | 34 |
| ISO letterale | 19 |
| Locale/Intl | 15 |
| Helper locali | 106 |
| File PDF generator | 7 |
| File Chat IA | 52 |

Classificazione finale:

- `DA_SISTEMARE`: 31, tutti risolti.
- `RISOLTO_GIA`: 144, wrapper/adapter gia' su `dateUnica`.
- `FALSO_POSITIVO`: 228, chiavi tecniche, id, path, chart data, file name.
- `NON_PERTINENTE_RUNTIME`: 32, backup, test, commenti, diagnostiche.
- `VIETATO_PROMPT_40`: `src/next/helpers/storiaRecord.ts`, non toccato; usa comunque adapter `nextDateFormat` gia' ridiretto a `dateUnica`.

### File toccati in Fase 9

- `src/next/NextCapoCostiMezzoPage.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/NextCentroControlloParityPage.tsx`
- `src/next/NextCisternaIAPage.tsx`
- `src/next/NextIADocumentiPage.tsx`
- `src/next/NextMagazzinoPage.tsx`
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `src/next/NextRifornimentiEconomiaSection.tsx`
- `src/next/centroControllo/archivioStorico/ArchivioFeed.tsx`
- `src/next/chat-ia/agents/orchestrator.ts`
- `src/next/components/NextCentroControlloSinottica.tsx`
- `src/next/components/NextMezzoCronologiaModal.tsx`
- `src/next/domain/nextCisternaDomain.ts`
- `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx`

### Pattern applicati in Fase 9

- Formatter locali display ridotti a `toDisplay` o `toDisplayDateTime`.
- Parser locali in aree display/read normalizzati a `parseAnyDate`.
- Chiavi data tecniche dove serve ordinabilita' normalizzate a `toISO`.
- Input Cisterna IA: valore mostrato con `toDisplay`, salvataggio data documento normalizzato con `fromUserInput`/`toISO`.
- Chat IA orchestrator: periodi testuali generati con `toDisplay`.

### Smoke statico Fase 9

| Superficie | Stato |
|---|---|
| `/next/manutenzioni` header `ULTIMA MANUTENZIONE` | PASS |
| `/next/manutenzioni` Da fare `Inserimento ...` | PASS |
| `/next/manutenzioni` Dashboard `Ultimo intervento` e `Ultimi interventi` | PASS |
| `/next/manutenzioni` Dettaglio | PASS |
| PDF Quadro manutenzioni | PASS |
| Dossier mezzo | PASS |
| Archivio storico Centro Controllo | PASS |
| `/next/scadenze-collaudi` | PASS |
| `/next/rifornimenti` | PASS |
| `/next/gomme` | PASS |
| `/next/euromecc` | PASS |
| `/next/cisterna` | PASS |
| `/next/magazzino` e materiali | PASS |
| `/next/procurement` / acquisti | PASS |
| `/next/autisti-inbox` | PASS statico; input `datetime-local` resta formato tecnico browser dove richiesto dal controllo HTML. |
| Chat IA output testuali | PASS |

### Verifica Fase 9

- `npm run build`: PASS.
- `npx tsc --noEmit`: PASS.
- Re-scan ISO: residui solo test, commenti, costanti tecniche, file name o backup non runtime.
- Re-scan `toLocaleString`: residui solo formattazioni numeriche/valuta, non date utente.
- Re-scan helper locali: residui motivati come adapter `dateUnica`, tecnici o vietati PROMPT 40.

### Nota di chiusura Fase 9

A valle della Fase 9, ogni data visibile, ricercabile o esportata nel NEXT risulta coperta da `dateUnica` direttamente o tramite adapter deprecati gia' ridiretti (`nextDateFormat`, `parseRobusto` dove ancora presente in transizione). Le uniche esclusioni runtime sono quelle esplicitamente vietate dal prompt: storia segnalazione / `StoriaRecordTimeline`, che resta materia di PROMPT 40.

## 12. FASE 10 SWEEP RUNTIME

La Fase 9 aveva dichiarato PASS su base scan grep statico + smoke statico. Uno screenshot
runtime di Giuseppe ha smentito il PASS: nel pannello "Quadro manutenzioni PDF" convivevano
`DATA 2026-05-12` (header) e `12/05/2026` (sotto-tabella) a pochi pixel di distanza. La
Fase 10 sostituisce il driver: non piu' grep, ma navigazione con browser reale.

### Metodo

Script riutilizzabile: `scripts/oneoff/sweep-date-runtime-2026-05-14.cjs` (Playwright
headless + estrazione testo PDF con `pdfjs-dist`). Per ogni rotta naviga, esegue le
interazioni in-pagina (tab, sotto-tab, righe espandibili, modali), estrae
`document.body.innerText`, cerca ISO `yyyy-mm-dd` con guardia di plausibilita', e su match
salva screenshot full-page + contesto. Scarica anche il PDF Quadro reale e ne scansiona il
testo estratto. Read-only sul gestionale: solo navigazione e lettura DOM.

### Iterazioni: 2

| Iter | Stati scansionati | Stati con ISO | Match ISO |
|---|---|---|---|
| 1 | 46 | 1 (`manutenzioni-quadro-pdf-view`) | 18 |
| 2 | 46 | 0 | 0 |

### Punti sistemati

Tutti e 18 i match erano nello stesso stato — il pannello HTML di anteprima
`renderPdfPanel` di `NextManutenzioniPage.tsx` (tab "Quadro manutenzioni PDF") — da due
sole espressioni di render:

| file:riga | tipo | prima | dopo | hit chiusi |
|---|---|---|---|---|
| `src/next/NextManutenzioniPage.tsx:3447` | componente | `{result.latest.data}` (campo record grezzo, ISO post-migrazione `@manutenzioni.data`) | `{toDisplay(result.latest.data) \|\| "DA VERIFICARE"}` | 15 |
| `src/next/NextManutenzioniPage.tsx:3567` | componente | `{entry.dataLabel \|\| "DA VERIFICARE"}` (sezione "Eventi gomme straordinari", `dataLabel` da `buildNextGommeStraordinarieEvents`) | `{toDisplay(entry.dataLabel) \|\| "DA VERIFICARE"}` | 3 |

Scelta del livello di intervento: i due punti sono stati corretti a livello di
**componente** e non di origine perche' il runtime ha provato che `result.latest.data` e
`entry.dataLabel` leakavano ISO **solo** in `renderPdfPanel`; tutti gli altri consumer
degli stessi campi erano gia' coperti dalle Fasi 3-9 (sweep a 0 hit su ogni altra rotta).
Sono quindi due punti display mancati, non una prop condivisa rotta in N componenti.
`toDisplay` era gia' importato nel file. Nessun helper nuovo introdotto.

### Note rilevanti

- **PDF esportato gia' pulito**: lo stato `manutenzioni-pdf-file` (testo del PDF Quadro
  reale generato e riscaricato) era a 0 ISO gia' in iterazione 1 — le Fasi 3-9 avevano
  corretto i formatter del PDF jsPDF. Il leak era esclusivamente nel **pannello HTML di
  anteprima**, non nel file esportato.
- **Corrispondenza con lo screenshot di Giuseppe**: il pannello `man2-pdf-row__meta`
  mostrava `result.latest.data` grezzo (ISO) mentre la sotto-tabella "Ultime 3
  manutenzioni" usava gia' `formatMaintenancePdfDateLabel` (GG/MM/AAAA) — esattamente il
  doppio formato a pochi pixel descritto.
- **Chat IA `/next/chat`**: backend `:4310` non disponibile in ambiente. Verificata
  best-effort: lo shell della pagina rende ("Scrivi una targa, un autista o una domanda"),
  0 ISO sullo shell; l'output testuale generato dall'LLM non e' stato esercitato. Stato:
  **PARZIALE** — l'output date della chat IA era gia' coperto staticamente in Fase 7/9.
- **Anti falso-PASS**: i dati reali caricano (es. `cc-sinottica-controlli` 34k char,
  `autisti-inbox-controlli` 31k char, `cc-sinottica-rimorchi` 32k char). Spot-check
  screenshot: `manutenzioni-quadro-pdf-view` con righe mezzo reali, `dossier-gomme` con
  dati `TI113417`. Le rotte a basso conteggio caratteri (`dossier-gomme` 820,
  `autisti-inbox-gomme` 524, ...) sono stati sparsi genuini, non caricamenti falliti.

### Rotte / stati verificati (46) — esito iterazione 2

Tutti **0 ISO**. Manutenzioni: `dafare`, `dashboard`, `dashboard-record`, `dettaglio`,
`nuova-modifica`, `quadro-pdf-view`, `pdf-file`. Centro Controllo: `sinottica-report-rifornimenti`,
`sinottica-segnalazioni`, `sinottica-controlli`, `sinottica-rimorchi`, `sinottica-driver-row`,
`sinottica-anomalia`, `archivio-lavori`, `archivio-manutenzioni`, `archivio-segnalazioni`,
`archivio-richieste`. Rotte: `home`, `scadenze-collaudi`, `dossier-lista`, `dossier-mezzo`,
`dossier-gomme`, `dossier-rifornimenti`, `analisi-economica`, `euromecc`, `cisterna`,
`cisterna-ia`, `magazzino`, `materiali-da-ordinare`, `acquisti`, `gestione-operativa`,
`attrezzature-cantieri`, `anagrafiche`, `capo-mezzi`, `capo-costi`, `ia-documenti`,
`ia-copertura-libretti`, `libretti-export`, `autisti-inbox` (+ `gomme`, `controlli`,
`segnalazioni`, `richiesta-attrezzature`, `log-accessi`, `cambio-mezzo`), `chat` (PARZIALE).

### Screenshot prima/dopo

`docs/_live/screenshots-date-2026-05-14/`:
- `before-manutenzioni-quadro-pdf.png` (iterazione 1, stato con 18 ISO)
- `after-manutenzioni-quadro-pdf.png` (iterazione 2, 0 ISO)
- `sweep-summary-iter-1.json` / `sweep-summary-iter-2.json` (riepiloghi strutturati)

### Verifiche Fase 10

- Sweep runtime iterazione 2: **0 ISO su 46 stati**, 0 errori, 0 pagine vuote.
- PDF Quadro reale (`pdfjs-dist`): 0 ISO nel testo estratto.
- `npx tsc --noEmit`: PASS.
- `npm run build`: PASS (warning preesistenti su dynamic import e chunk size, non legati alla patch).
- `npx eslint src/next/NextManutenzioniPage.tsx`: PASS, nessun warning.

### Esito

**Zero ISO a runtime su 45 stati verificati con dati reali** (`/next/chat` PARZIALE per
backend non disponibile, shell a 0 ISO). Perimetro rispettato: `StoriaRecordTimeline` /
`storiaRecord.ts`, writer Firestore e madre non toccati. Unico file runtime modificato:
`src/next/NextManutenzioniPage.tsx` (2 righe).
