# AUDIT FATTUALE — CENTRO DI CONTROLLO NEXT — 2026-05-07

## Stato del documento
- Tipo: audit di sola lettura, perimetro un livello di profondita.
- Operatore: Claude Code.
- Vincolo: nessuna patch, nessuna proposta, nessuna roadmap. Solo fatti tecnici con fonte.
- Stati: DIMOSTRATO, DEDOTTO, DA VERIFICARE, NON PRESENTE, NON LETTO.

---

## 1. Verdetto fattuale sintetico

Classificazione: **CLONE UI MA RUNTIME NEXT**.

Motivazione fattuale (no opinioni):
- la route monta un componente che vive in `src/next/` e ha JSX proprio (DIMOSTRATO);
- non e' un wrapper della madre, non usa `NextMotherPage`, non importa runtime da `src/pages/` (DIMOSTRATO);
- importa solo CSS proprio `./next-centro-controllo.css` e NON piu' `../pages/CentroControllo.css` (DIMOSTRATO);
- replica le 5 tab della madre (`manutenzioni`, `rifornimenti`, `segnalazioni`, `controlli`, `richieste`) e la nomenclatura delle classi CSS `cc-*` (DIMOSTRATO);
- legge dati esclusivamente via 3 domain reader NEXT (DIMOSTRATO);
- nessuna funzione mutante presente nella pagina o nei file importati al primo livello (DIMOSTRATO).

---

## 2. Route e componente montato

| Aspetto | Valore | Fonte |
|---|---|---|
| Path route | `/next/centro-controllo` | `src/App.tsx:197` |
| Guard | `<NextRoleGuard areaId="centro-controllo">` | `src/App.tsx:199` |
| Componente | `<NextCentroControlloParityPage />` | `src/App.tsx:200` |
| File componente | `src/next/NextCentroControlloParityPage.tsx` | `src/App.tsx:8` (`import NextCentroControlloParityPage from "./next/NextCentroControlloParityPage";`) |
| Default export | `export default function NextCentroControlloParityPage()` | `src/next/NextCentroControlloParityPage.tsx:381` |
| Numero righe file | 1547 | `wc -l` |
| Wrapper madre `NextMotherPage` | NON usato (l'enum `NextMotherPageId` in `src/next/NextMotherPage.tsx:3-29` non contiene la voce `centro-controllo`) | `src/next/NextMotherPage.tsx:3-29` |
| Redirect | nessuno per questa route (la route registra direttamente l'element) | `src/App.tsx:196-203` |

Stato affidabilita: DIMOSTRATO.

---

## 3. Runtime NEXT

| Aspetto | Valore | Fonte |
|---|---|---|
| File runtime | `src/next/NextCentroControlloParityPage.tsx` | DIMOSTRATO |
| Default export | `NextCentroControlloParityPage` | `src/next/NextCentroControlloParityPage.tsx:381` |
| JSX proprio | SI, definito interamente nel file | `src/next/NextCentroControlloParityPage.tsx:983-1500+` |
| Import runtime da `src/pages/` | NESSUNO. L'unico riferimento storico (CSS madre) e' stato sostituito da `./next-centro-controllo.css`. Vedi §4. | DIMOSTRATO via lista import 1-29 |
| Uso `NextMotherPage` | NO | DIMOSTRATO via grep `NextMotherPage` su `NextCentroControlloParityPage.tsx` (0 match) |
| Container root JSX | `<div className="next-centro-controllo-scope cc-page">` | `src/next/NextCentroControlloParityPage.tsx:984` |

Stato affidabilita: DIMOSTRATO.

---

## 4. Verifica CSS autonomo

| Aspetto | Valore | Fonte |
|---|---|---|
| CSS importato dalla pagina NEXT | `./next-centro-controllo.css` | `src/next/NextCentroControlloParityPage.tsx:29` |
| CSS madre importato dalla NEXT | NO | DIMOSTRATO: nelle righe 1-29 di import non compare `pages/CentroControllo.css` |
| File `src/next/next-centro-controllo.css` esiste | SI, 486 righe nello stato pre-scope (il file ora contiene scope wrapper, vedi sotto) | `wc -l` |
| File `src/pages/CentroControllo.css` esiste | SI ma non importato dalla pagina NEXT | DA VERIFICARE non lettura del file madre (perimetro un livello — non aperto) |
| Wrapper `.next-centro-controllo-scope` presente nel JSX | SI: `<div className="next-centro-controllo-scope cc-page">` | `src/next/NextCentroControlloParityPage.tsx:984` |
| Selettori CSS scoped sotto il wrapper | TUTTI i selettori top-level e tutti quelli dentro `@media (max-width: 960px)` | `src/next/next-centro-controllo.css:1-486` (selettori prefissati con `.next-centro-controllo-scope ...`) |
| Selettori non scoped | NESSUNO trovato in lettura statica del file | DIMOSTRATO via lettura file completa |
| Selettori globali (`:root`, `html`, `body`, `#root`, `*`, `@font-face`, `@import`) | NESSUNO | DIMOSTRATO via grep `:root\|^html\b\|^body\b\|^#root\b\|^\*\|@import\|@font-face` (0 match) |
| `url(...)` | NESSUNO | DIMOSTRATO via grep `url\(` (0 match) |
| `@media` presenti | 1: `@media (max-width: 960px)` | `src/next/next-centro-controllo.css:441-486` |
| Selettori dentro `@media` scoped | SI, 10 selettori, tutti prefissati con `.next-centro-controllo-scope` | `src/next/next-centro-controllo.css:441-486` |
| `@keyframes` | NESSUNO | DIMOSTRATO via lettura file |

Stato affidabilita: DIMOSTRATO. Nota: l'esistenza fisica del file CSS madre e' DIMOSTRATA via Glob, ma il suo contenuto non e' stato letto in questa sessione (perimetro un livello — non importato dalla NEXT).

---

## 5. Import esterni e confini del modulo

Lista import di `src/next/NextCentroControlloParityPage.tsx` (righe 1-29):

| # | Path import | Tipo | Usato per | Effetto collaterale fattuale | Fonte |
|---|---|---|---|---|---|
| 1 | `react` | libreria esterna | `useEffect`, `useMemo`, `useState` | nessuno | riga 1 |
| 2 | `react-router-dom` | libreria esterna | `useNavigate` | nessuno | riga 2 |
| 3 | `../components/PdfPreviewModal` | componente shared (madre + NEXT) | rendering modal di anteprima PDF | render JSX standard, nessun portal (DIMOSTRATO via audit precedente) | riga 3 |
| 4 | `../utils/pdfPreview` (`buildPdfShareText`, `buildWhatsAppShareUrl`, `copyTextToClipboard`, `openPreview`, `revokePdfPreviewUrl`, `sharePdfFile`) | utils shared | utilita di share/clipboard/preview PDF | navigator.clipboard / Web Share API quando invocate (effetto su browser, non su Firestore) | righe 4-11 |
| 5 | `../utils/pdfEngine` (`generateManutenzioniProgrammatePDFBlob`, `generateRifornimentiMensiliPDFBlob`, tipi) | utils shared | generazione PDF in memoria | nessuna scrittura Firestore (file non letto in questo audit, DA VERIFICARE su perimetro un livello — il nome suggerisce solo generazione blob) | righe 12-17 |
| 6 | `./domain/nextAutistiDomain` (`readNextAutistiReadOnlySnapshot`, tipi sezioni) | domain NEXT | lettura snapshot autisti read-only | nessun writer (DIMOSTRATO via grep `setDoc/addDoc/updateDoc/deleteDoc/setItemSync` su `nextAutistiDomain.ts`: 0 match) | righe 18-23 |
| 7 | `./domain/nextRifornimentiDomain` (`readNextRifornimentiReadOnlySnapshot`, tipo) | domain NEXT | lettura snapshot rifornimenti merged | nessun writer (DIMOSTRATO via grep su `nextRifornimentiDomain.ts`: 0 match) | righe 24-27 |
| 8 | `./nextAnagraficheFlottaDomain` (`readNextAnagraficheFlottaSnapshot`) | domain NEXT | lettura snapshot anagrafica flotta | nessun writer (DIMOSTRATO via grep su `nextAnagraficheFlottaDomain.ts`: 0 match) | riga 28 |
| 9 | `./next-centro-controllo.css` | CSS NEXT proprio | stili scoped | nessun side effect runtime | riga 29 |

Sintesi:
- Import da `src/pages/`: **NESSUNO** (DIMOSTRATO).
- Import da `src/next/`: 4 (tre domain + un CSS).
- Import da `src/components/`: 1 (PdfPreviewModal, shared madre+NEXT).
- Import da `src/utils/`: 2 (pdfPreview, pdfEngine — shared).
- Import librerie esterne: 2 (react, react-router-dom).

Stato affidabilita: DIMOSTRATO per i path; DIMOSTRATO read-only per i 3 domain NEXT al primo livello; DA VERIFICARE assenza di mutazioni interne in `pdfEngine` e `pdfPreview` oltre il primo livello (NON LETTO il contenuto di questi due file in questo audit, ma grep `setDoc/addDoc/...` dentro entrambi: 0 match — DIMOSTRATO assenza di mutazioni Firestore di primo livello).

---

## 6. Mappa tab attuali

Tab dichiarate dal `type TabKey` a `src/next/NextCentroControlloParityPage.tsx:31-36` (5 valori).

### 6.1 Tab `manutenzioni` — Manutenzioni programmate
| Aspetto | Valore | Fonte |
|---|---|---|
| Key | `"manutenzioni"` | `src/next/NextCentroControlloParityPage.tsx:32` |
| Label UI | "Manutenzioni programmate" | `src/next/NextCentroControlloParityPage.tsx:1048, 1083` |
| Tipo righe | `ScheduledMaintenanceRow` | `src/next/NextCentroControlloParityPage.tsx:40-51` |
| Campi riga | `id, targa, categoria, manutenzioneDataFine, manutenzioneDataFineRaw, manutenzioneContratto, manutenzioneKmMax, dataScadenzaRevisione, status, daysToDeadline` | `:40-51` |
| Status enum | `MaintenanceStatus = "SCADUTA" | "IN_SCADENZA" | "OK" | "SENZA_DATA"` | `:37` |
| Filtri | non esposti come state dedicato per questa tab | `src/next/NextCentroControlloParityPage.tsx:401-418` (gli `*FilterTarga` esistono per segnalazioni/controlli/richieste/rifornimenti, non per manutenzioni) |
| Conteggi/KPI | 4 `cc-summary-card` (un default + danger + warn + ok) | `:1109-1126` |
| Azioni | 1 button "Aggiorna" che chiama `loadScheduledMaintenances()` | `:1084-1086` |
| Modali/export | PDF via `generateManutenzioniProgrammatePDFBlob` (tipo importato `ManutenzioneProgrammataPdfItem` a riga 15) | DIMOSTRATO via import |
| Dataset letti (DEDOTTO) | `@mezzi_aziendali` (anagrafica flotta) | DEDOTTO da `readNextAnagraficheFlottaSnapshot` |
| Anchor id | `cc-anchor-manutenzioni` | `:1081, 728` |

### 6.2 Tab `rifornimenti` — Report rifornimenti
| Aspetto | Valore | Fonte |
|---|---|---|
| Key | `"rifornimenti"` | `src/next/NextCentroControlloParityPage.tsx:32` |
| Label UI | "Report rifornimenti" | `:1055, 1178+` |
| Tipo righe | `RefuelRow` | `:53-66` |
| Campi riga | `id, originId, targa, dateObj, autistaNome, badgeAutista, litri, km, costo, distributore, note, source` | `:53-66` |
| Source enum | `RefuelSource = "dossier" | "tmp" | "merged"` | `:38` |
| Filtri | `targaFilter` (input controllato) | `:418, 1233` |
| Conteggi/KPI | 3 `cc-summary-card` | `:1238-1252` |
| Azioni | (NON LETTE in dettaglio, presenti `cc-actions` a `:1181`) | NON LETTO |
| Modali/export | PDF via `generateRifornimentiMensiliPDFBlob` (tipo `RifornimentiMensiliPdfItem` riga 16) | DIMOSTRATO via import |
| Dataset letti | `@rifornimenti` (business) + `@rifornimenti_autisti_tmp` (field), merged | DIMOSTRATO da `nextRifornimentiDomain.ts:7-8` (`BUSINESS_DATASET_KEY`, `FIELD_DATASET_KEY`) |
| Anchor id | `cc-anchor-rifornimenti` | `:1178` |

### 6.3 Tab `segnalazioni` — Segnalazioni autisti
| Aspetto | Valore | Fonte |
|---|---|---|
| Key | `"segnalazioni"` | `:33` |
| Label UI | "Segnalazioni autisti" | `:1062, 1293+` |
| Tipo righe | `SegnalazioneRow` | `:68-82` |
| Campi riga | `id, ts, dateObj, targa, targaFilterKey, autistaNome, badgeAutista, tipo, descrizione, stato, letta, isNuova, fotoCount` | `:68-82` |
| Filtri | `segnalazioniFilterTarga` (input controllato) | `:401, 1318` |
| Conteggi/KPI | NON LETTI in dettaglio | NON LETTO |
| Modali/export | DA VERIFICARE | DA VERIFICARE |
| Dataset letti | `@segnalazioni_autisti_tmp` | DEDOTTO da `nextAutistiDomain.ts:23` |
| Anchor id | `cc-anchor-segnalazioni` | `:1293` |

### 6.4 Tab `controlli` — Controlli KO/OK
| Aspetto | Valore | Fonte |
|---|---|---|
| Key | `"controlli"` | `:34` |
| Label UI | "Controlli KO/OK" | `:1069, 1371+` |
| Tipo righe | `ControlloRow` (definizione inizia a `:84+`, lettura troncata in audit precedente) | `:84-97` (visti i campi `id, ts, dateObj, targaMotrice, targaRimorchio, targaLabel, targaFilterKey, autistaNome, badgeAutista, koList, isKo, note`) |
| Filtri | `controlliFilterTarga` (input controllato) | `:407, 1396` |
| Conteggi/KPI | NON LETTI in dettaglio | NON LETTO |
| Modali/export | DA VERIFICARE | DA VERIFICARE |
| Dataset letti | `@controlli_mezzo_autisti` | DEDOTTO da `nextAutistiDomain.ts:24` |
| Anchor id | `cc-anchor-controlli` | `:1371, 695` |

### 6.5 Tab `richieste` — Richieste attrezzature
| Aspetto | Valore | Fonte |
|---|---|---|
| Key | `"richieste"` | `:36` |
| Label UI | "Richieste attrezzature" | `:1076, 1458+` |
| Tipo righe | `RichiestaRow` (definizione a `:99+`, NON LETTA integralmente in questo audit) | NON LETTO |
| Filtri | `richiesteFilterTarga` (input controllato) | `:412, 1483` |
| Conteggi/KPI | NON LETTI in dettaglio | NON LETTO |
| Modali/export | DA VERIFICARE | DA VERIFICARE |
| Dataset letti | `@richieste_attrezzature_autisti_tmp` | DEDOTTO da `nextAutistiDomain.ts:25` |
| Anchor id | `cc-anchor-richieste` | `:770` |

### 6.6 Sezione priorita (extra rispetto alle 5 tab)
- Esiste una sezione `cc-priority-section` con `cc-priority-list` di `cc-priority-row` e badge stato (`is-high`).
- Mostrata sopra le tab. Riferimenti: `:997, 1018`. Tipi `cc-priority-score, cc-priority-targa, cc-priority-autista, cc-priority-motivo, cc-priority-date`.
- Funzione interna che popola le righe: NON LETTA in dettaglio in questo audit. Stato: DA VERIFICARE.

Stato affidabilita complessivo §6: DIMOSTRATO per chiavi tab + label + filtri di state + anchor id; DEDOTTO per i dataset letti (via i domain reader); NON LETTO il dettaglio interno di ciascun blocco JSX di tab oltre la testa.

---

## 7. Data layer usato

| Domain | File | Funzione importata | Chiamata nella pagina | Dataset letti (dichiarati nel domain) | Writer presenti nel file | Fonte |
|---|---|---|---|---|---|---|
| Autisti (D03) | `src/next/domain/nextAutistiDomain.ts` | `readNextAutistiReadOnlySnapshot` (+ tipi `NextAutistiControlloSectionItem`, `NextAutistiRichiestaSectionItem`, `NextAutistiSegnalazioneSectionItem`) | DA VERIFICARE punto esatto di chiamata (NON ricercata via grep in questa sessione) | `@autisti_sessione_attive`, `@storico_eventi_operativi`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@richieste_attrezzature_autisti_tmp`, collection `autisti_eventi`, dataset `@autista_attivo_local`, `@mezzo_attivo_autista_local` | NESSUNO (grep `setDoc/addDoc/updateDoc/deleteDoc/setItemSync`: 0 match) | `nextAutistiDomain.ts:21-42` |
| Rifornimenti (D04) | `src/next/domain/nextRifornimentiDomain.ts` | `readNextRifornimentiReadOnlySnapshot` (+ tipo `NextRifornimentoReadOnlyItem`) | DA VERIFICARE punto esatto di chiamata | `@rifornimenti` (business), `@rifornimenti_autisti_tmp` (field) | NESSUNO (grep: 0 match) | `nextRifornimentiDomain.ts:7-9, 64-69` |
| Anagrafica flotta | `src/next/nextAnagraficheFlottaDomain.ts` | `readNextAnagraficheFlottaSnapshot` | DA VERIFICARE punto esatto di chiamata | `@mezzi_aziendali`, `@colleghi` | NESSUNO (grep: 0 match) | `nextAnagraficheFlottaDomain.ts:6-7` |

Nota: la funzione `readNextAnagraficheFlottaSnapshot` accetta opzioni con `includeClonePatches` (DEDOTTO da osservazione `nextFlottaCloneState.ts` import a riga 3 di `nextAnagraficheFlottaDomain.ts`); non e' stato verificato in questa sessione se la pagina NEXT le passa esplicitamente.

`src/next/domain/nextCentroControlloDomain.ts` esiste come dominio dedicato (D10, `NEXT_CENTRO_CONTROLLO_DOMAIN`) ma **NON e' importato** da `NextCentroControlloParityPage.tsx` (DIMOSTRATO via lista import righe 1-29). E' invece usato da `src/next/NextHomePage.tsx:11-25` per il banner allarmi (DIMOSTRATO via audit precedente).

Stato affidabilita §7: DIMOSTRATO per file/funzioni importate, dataset dichiarati nei domain, assenza writer al primo livello; DA VERIFICARE i punti esatti di chiamata interna nella pagina (richiede lettura sezioni 700-1500 non coperte in questa sessione).

---

## 8. Madre vs NEXT

| Aspetto | Madre | NEXT | Esito fattuale | Fonte |
|---|---|---|---|---|
| Route | `/centro-controllo` | `/next/centro-controllo` | distinte | `src/App.tsx:676` (madre), `src/App.tsx:197` (NEXT) |
| File runtime | `src/pages/CentroControllo.tsx` | `src/next/NextCentroControlloParityPage.tsx` | distinti | DIMOSTRATO |
| CSS | `src/pages/CentroControllo.css` (importato da `pages/CentroControllo.tsx:21`) | `src/next/next-centro-controllo.css` (importato da `NextCentroControlloParityPage.tsx:29`) | distinti, nessuna condivisione | DIMOSTRATO |
| Tab | 5 (`manutenzioni \| rifornimenti \| segnalazioni \| controlli \| richieste`, `pages/CentroControllo.tsx:23-28`) | 5 (`manutenzioni \| rifornimenti \| segnalazioni \| controlli \| richieste`, `NextCentroControlloParityPage.tsx:31-36`) | enum identico | DIMOSTRATO |
| Reader dati | `getItemSync` da `src/utils/storageSync` (madre, vedi `pages/CentroControllo.tsx:20`) | 3 domain reader NEXT (`nextAutistiDomain`, `nextRifornimentiDomain`, `nextAnagraficheFlottaDomain`) | distinti | DIMOSTRATO |
| Writer | DA VERIFICARE (madre non letta integralmente in questo audit) | NESSUNO (perimetro un livello) | NEXT read-only certificato; madre DA VERIFICARE | DIMOSTRATO per NEXT, NON LETTO per madre |
| Import NEXT → Madre (file madre importati da NEXT) | n/a | NESSUN file `src/pages/` importato runtime; sono shared `src/components/PdfPreviewModal.tsx`, `src/utils/pdfPreview.ts`, `src/utils/pdfEngine.ts` (componenti/utils condivisi tra madre e NEXT) | runtime madre NON importato | DIMOSTRATO via lista import 1-29 |
| Import Madre → NEXT (file NEXT importati dalla madre) | NESSUNO (`src/pages/CentroControllo.tsx` cerca grep `from "../next/" \| from "./next/"`: 0 match) | n/a | madre NON dipende dalla NEXT | DIMOSTRATO |
| Uso `NextMotherPage` | n/a | NO | DIMOSTRATO | `src/next/NextMotherPage.tsx:3-29` (enum senza `centro-controllo`) |
| Stato finale | pagina madre legacy attiva | pagina NEXT con runtime e CSS autonomi | coesistenza: due pagine indipendenti che condividono solo componenti shared (PdfPreviewModal) e utility shared (pdfPreview, pdfEngine) | DIMOSTRATO |

---

## 9. Read-only / writer (perimetro un livello)

Verifica statica delle funzioni mutanti (`setDoc`, `addDoc`, `updateDoc`, `deleteDoc`, `setItemSync`) eseguita su:

| File | Match `setDoc|addDoc|updateDoc|deleteDoc|setItemSync` |
|---|---|
| `src/next/NextCentroControlloParityPage.tsx` | 0 |
| `src/next/domain/nextAutistiDomain.ts` | 0 |
| `src/next/domain/nextRifornimentiDomain.ts` | 0 |
| `src/next/nextAnagraficheFlottaDomain.ts` | 0 |
| `src/utils/pdfPreview.ts` | 0 |
| `src/utils/pdfEngine.ts` | 0 |
| `src/components/PdfPreviewModal.tsx` | 0 |

Esito: a livello **pagina + un livello di import**, nessuna funzione mutante e' presente. Pagina classificabile **READ-ONLY a livello pagina e a livello dei file importati direttamente** (DIMOSTRATO).

Nota fattuale aggiuntiva: i 3 domain importano a loro volta altri file (es. `nextAutistiDomain.ts` importa `nextAutistiCloneState`, `nextAutistiCloneRichiesteAttrezzature`, `nextAutistiCloneSegnalazioni`, `nextUnifiedReadRegistryDomain`, `nextAutistiStorageSync`). Questi file sono di **secondo livello** e per vincolo di perimetro NON sono stati letti in questo audit. Stato: DA VERIFICARE per la profondita oltre un livello.

---

## 10. Punti DA VERIFICARE

Solo fatti tecnici non dimostrati o fuori dal perimetro di un livello:

1. Punto esatto di chiamata di `readNextAutistiReadOnlySnapshot`, `readNextRifornimentiReadOnlySnapshot`, `readNextAnagraficheFlottaSnapshot` dentro la pagina (richiede lettura della porzione di codice ~150-700 e ~700-1000 non coperta in questa sessione).
2. Eventuali writer presenti nei file di **secondo livello** importati dai 3 domain (es. `nextAutistiCloneState`, `nextAutistiStorageSync`, `nextUnifiedReadRegistryDomain`, `nextFlottaCloneState`).
3. Contenuto di `src/utils/pdfEngine.ts` e `src/utils/pdfPreview.ts` oltre la verifica grep mutazioni Firestore (sono shared con la madre; non letti).
4. Contenuto di `src/components/PdfPreviewModal.tsx` oltre la verifica portal e mutazioni (in audit precedenti verificato per portal — confermato non-portal).
5. Conteggio esatto e logica di calcolo dei `cc-summary-card` per ciascun tab (richiede lettura completa della sezione UI di ciascun tab).
6. Filtri completi della sezione `priorita` (`cc-priority-list`) e algoritmo di score (`cc-priority-score`).
7. Eventuali export PDF/azioni interne specifiche dei tab `segnalazioni`, `controlli`, `richieste` (non letti in dettaglio).
8. Contenuto di `src/pages/CentroControllo.css` (482-486 righe DA VERIFICARE) e di `src/pages/CentroControllo.tsx` oltre la testa per la classificazione integrale della madre.
9. Esatti dataset letti vs dichiarati: `nextAutistiDomain` dichiara 8 logical datasets ma a runtime potrebbe esporre solo i 5 attivi (`activeReadOnlyDatasets`); il punto esatto di selezione richiede lettura del corpo del file oltre le righe 1-80.
10. `src/next/domain/nextCentroControlloDomain.ts` (D10, NEXT_CENTRO_CONTROLLO_DOMAIN) esiste ma NON e' usato dalla pagina; la sua presenza come dominio dichiarato non e' qui controdimostrata. DA VERIFICARE se debba essere usato in futuro o se e' una sovrapposizione architetturale.

---

## 11. File letti in questa sessione (lettura ≥ 30 righe o lettura testa con grep mirato)

1. `src/App.tsx:1-30, 196-203, 482-497, 676` — DIMOSTRATO route madre + NEXT.
2. `src/next/NextCentroControlloParityPage.tsx:1-30, 980-1000, 1042-1090, e grep mirati su tab/filtri/cc-anchor` — DIMOSTRATO import, JSX root, tab, filtri.
3. `src/next/next-centro-controllo.css:1-486` (lettura completa) — DIMOSTRATO scope wrapper applicato a tutti i selettori.
4. `src/next/NextMotherPage.tsx:1-60` — DIMOSTRATO enum `NextMotherPageId` senza `centro-controllo`.
5. `src/next/domain/nextAutistiDomain.ts:1-80` — DIMOSTRATO domain D03 + dataset dichiarati.
6. `src/next/domain/nextRifornimentiDomain.ts:1-80` — DIMOSTRATO domain D04 + dataset dichiarati.
7. `src/next/nextAnagraficheFlottaDomain.ts:1-60` — DIMOSTRATO dataset `@mezzi_aziendali` + `@colleghi`.

File con grep mirato (assenza mutazioni Firestore al primo livello):
- `src/utils/pdfPreview.ts` — grep mutazioni: 0 match.
- `src/utils/pdfEngine.ts` — grep mutazioni: 0 match.
- `src/components/PdfPreviewModal.tsx` — grep mutazioni: 0 match (+ verifica portal in audit precedente: assente).

File NON letti in questa sessione (cercati ma fuori perimetro un livello o non necessari):
- `src/pages/CentroControllo.tsx` (oltre il grep `from "../next/"`: 0 match — DIMOSTRATO assenza import NEXT).
- `src/pages/CentroControllo.css` (esistenza DIMOSTRATA, contenuto NON LETTO).
- `src/next/domain/nextCentroControlloDomain.ts` (esistenza DIMOSTRATA + lettura testa via audit precedente — non ulteriormente letto in questa sessione).
- 9 file di **secondo livello** importati dai 3 domain (out of scope).

Stato affidabilita §11: DIMOSTRATO per i path letti.
