# AUDIT DISMISSIONE LAVORI NEXT - 2026-05-12
> Generato da Claude Code. Audit di sola lettura, zero modifiche al codice. Fonte primaria per SPEC_DISMISSIONE_LAVORI_NEXT.md.

## AUDIT COMPLETATO

## PERIMETRO LETTO (file effettivamente aperti integralmente o esaminati per estratti significativi)

- src/next/NextLavoriDaEseguirePage.tsx (integrale, 1209 righe)
- src/next/NextLavoriInAttesaPage.tsx (integrale, 6 righe)
- src/next/NextLavoriEseguitiPage.tsx (integrale, 6 righe)
- src/next/NextDettaglioLavoroPage.tsx (integrale, 1377 righe)
- src/next/domain/nextLavoriDomain.ts (integrale, 1211 righe)
- src/next/nextLavoriCloneState.ts (integrale, 155 righe)
- src/next/nextLavoroCreateWriter.ts (integrale, 203 righe)
- src/next/nextArchivioHideWriter.ts (estratti, righe 1-80)
- src/next/domain/nextManutenzioniDomain.ts (integrale, 1097 righe)
- src/next/NextManutenzioniPage.tsx (estratti significativi: 1-200, 700-1015, 2000-2300, oltre a grep mirati su lavori)
- src/next/NextHomePage.tsx (estratti: 1-100, 240-460, 595-720)
- src/next/NextDossierMezzoPage.tsx (estratti: 270-595)
- src/next/domain/nextDossierMezzoDomain.ts (estratti: 760-940)
- src/next/nextOperativitaTecnicaDomain.ts (estratti: 220-260)
- src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts (estratti: 1-120)
- src/next/components/NextCentroControlloSinottica.tsx (estratti: 540-880, 1500-1555)
- src/next/NextCentroControlloParityPage.tsx (estratti: 760-790, 980-1065, 1500-1555)
- src/next/centroControllo/archivioStorico/hooks/useArchivioData.ts (integrale)
- src/next/centroControllo/archivioStorico/archivioTypes.ts (estratti)
- src/next/centroControllo/archivioStorico/rows/ArchivioRowLavoro.tsx (estratti)
- src/next/autistiInbox/NextAutistiAdminNative.tsx (estratti: 730-760, 1500-1700)
- src/next/components/NextHomeAutistiEventoModal.tsx (estratti: 120-420)
- src/next/internal-ai/InternalAiMezzoCard.tsx (estratti)
- src/next/internal-ai/internalAiProfessionalVehicleReport.ts (grep mirato)
- src/next/chat-ia/sectors/mezzi/chatIaMezziReport.ts (grep mirato)
- src/next/chat-ia/config/view.config.ts (estratti)
- src/next/chat-ia/core/chatIaRouter.ts (estratti)
- src/next/NextLegacyStorageBoundary.tsx (estratti: 200-230)
- src/next/nextStructuralPaths.ts (grep mirato righe 19-22)
- src/next/nextData.ts (estratti righe 155-165, grep)
- src/next/nextAccess.ts (grep mirato)
- src/next/nextScadenzeCollaudiWriter.ts (estratti: 1-180 via grep — `lavoriPrevisti` è stringa libera del preCollaudo, NON è riferimento a `@lavori`)
- src/next/nextMezzoHardDeleteWriter.ts (grep mirato — elimina record da @lavori in cancellazione mezzo)
- src/utils/cloneWriteBarrier.ts (integrale, 935 righe)
- src/App.tsx (estratti: routes Lavori)
- backend/internal-ai/server/lib/registry.config.js (estratti: 360-510)
- backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js (estratti: 484-505, 1148-1170)
- backend/internal-ai/server/internal-ai-repo-understanding.js (estratti via grep righe 200-870)
- backend/internal-ai/server/internal-ai-next-runtime-observer.js (grep mirato)
- backend/internal-ai/server/lib/fingerprint-validator.js (presenza solo via grep, non oggetto registry attivo per la dismissione)

---

# REPORT AUDIT DISMISSIONE LAVORI NEXT (2026-05-12)

Strategia di dismissione di riferimento: 3a (madre congelata, NEXT autonoma, nessun mirror continuo).
Tutti i riferimenti `file:riga` puntano al repo letto.

---

## CAPITOLO A — Inventario file Lavori NEXT

### A.1 [src/next/NextLavoriDaEseguirePage.tsx](src/next/NextLavoriDaEseguirePage.tsx)
- **Responsabilita reale**: pagina unificata "Lavori" con 3 tab (`in-attesa`, `eseguiti`, `aggiungi`), riusata anche da `NextLavoriInAttesaPage` e `NextLavoriEseguitiPage` con `forcedTab`. Renderizza tabella in attesa/eseguiti, modale aggiunta, export PDF, e ospita la modale dettaglio embedded.
- **Writer Firestore presenti** (via `setItemSync` su `@lavori`, riga 51):
  - `salvaGruppo` ([NextLavoriDaEseguirePage.tsx:516-529](src/next/NextLavoriDaEseguirePage.tsx#L516-L529)) — append di `listaTemporanei` a `@lavori`.
- **Reader Firestore presenti**:
  - `loadLavoriData` ([NextLavoriDaEseguirePage.tsx:192-212](src/next/NextLavoriDaEseguirePage.tsx#L192)) — legge `@lavori` e `@mezzi_aziendali` via `getItemSync`.
- **Modali interni esposti**: modale Dettaglio embedded (renderizza `NextLavoriRealDetailView`, righe 1177-1188), `PdfPreviewModal` (1190-1200).
- **Componenti riusati da fuori**: `NextLavoriUnifiedDashboard` esportato e riusato in:
  - [NextLavoriInAttesaPage.tsx:1-5](src/next/NextLavoriInAttesaPage.tsx#L1-L5)
  - [NextLavoriEseguitiPage.tsx:1-5](src/next/NextLavoriEseguitiPage.tsx#L1-L5)

### A.2 [src/next/NextLavoriInAttesaPage.tsx](src/next/NextLavoriInAttesaPage.tsx)
- **Responsabilita reale**: wrapper di `NextLavoriUnifiedDashboard` con `forcedTab="in-attesa"`. Nessuna logica propria.
- Writer/Reader: ereditati da A.1.

### A.3 [src/next/NextLavoriEseguitiPage.tsx](src/next/NextLavoriEseguitiPage.tsx)
- **Responsabilita reale**: wrapper di `NextLavoriUnifiedDashboard` con `forcedTab="eseguiti"`. Nessuna logica propria.
- Writer/Reader: ereditati da A.1.

### A.4 [src/next/NextDettaglioLavoroPage.tsx](src/next/NextDettaglioLavoroPage.tsx)
- **Responsabilita reale**: pagina/modale dettaglio singolo lavoro. Mostra gruppo lavori per `gruppoId`, modali "Segna come eseguito" / "Modifica" / "Elimina", apertura modali Segnalazione e Controllo originali. Esporta `NextLavoriRealDetailView` come componente embedded.
- **Writer Firestore presenti** su `@lavori` ([NextDettaglioLavoroPage.tsx:124](src/next/NextDettaglioLavoroPage.tsx#L124)):
  - `handleDelete` ([NextDettaglioLavoroPage.tsx:831-844](src/next/NextDettaglioLavoroPage.tsx#L831-L844)) — rimuove record da `@lavori`.
  - `handleSaveExecute` ([NextDettaglioLavoroPage.tsx:846-870](src/next/NextDettaglioLavoroPage.tsx#L846-L870)) — flagga `eseguito=true`, `chiHaEseguito`, `dataEsecuzione`.
  - `handleSaveEdit` ([NextDettaglioLavoroPage.tsx:872-898](src/next/NextDettaglioLavoroPage.tsx#L872-L898)) — aggiorna `descrizione` e `dataInserimento`.
- **Reader Firestore presenti**:
  - `loadLavoriGroup` ([NextDettaglioLavoroPage.tsx:393-412](src/next/NextDettaglioLavoroPage.tsx#L393-L412)) — legge `@lavori`.
  - `reload` ([NextDettaglioLavoroPage.tsx:618-675](src/next/NextDettaglioLavoroPage.tsx#L618-L675)) — legge `@mezzi_aziendali`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti` in parallelo per arricchimento.
- **Modali interni esposti**:
  - `executeModalOpen` ([NextDettaglioLavoroPage.tsx:1067-1111](src/next/NextDettaglioLavoroPage.tsx#L1067-L1111)) — "Chi ha eseguito?"
  - `editModalOpen` ([NextDettaglioLavoroPage.tsx:1113-1166](src/next/NextDettaglioLavoroPage.tsx#L1113-L1166)) — modifica descrizione/data.
  - `selectedSegnalazione` ([NextDettaglioLavoroPage.tsx:1168-1260](src/next/NextDettaglioLavoroPage.tsx#L1168-L1260)) — segnalazione originale.
  - `selectedControllo` ([NextDettaglioLavoroPage.tsx:1262-1341](src/next/NextDettaglioLavoroPage.tsx#L1262-L1341)) — controllo originale.
- **Componenti riusati da fuori**: `NextLavoriRealDetailView` importato e renderizzato in [NextLavoriDaEseguirePage.tsx:5,1180](src/next/NextLavoriDaEseguirePage.tsx#L5).

### A.5 [src/next/domain/nextLavoriDomain.ts](src/next/domain/nextLavoriDomain.ts)
- **Responsabilita reale**: layer read-only NEXT per `@lavori`. Normalizza shape legacy, espone snapshot per lista globale (in attesa/eseguiti/archivio), dettaglio per `gruppoId`, mezzo (dossier), legacy dataset per boundary.
- **Writer Firestore presenti**: nessuno (`include solo getDoc(doc(...))` a [riga 681](src/next/domain/nextLavoriDomain.ts#L681)).
- **Reader Firestore presenti**:
  - `readLavoriDataset` ([nextLavoriDomain.ts:674-736](src/next/domain/nextLavoriDomain.ts#L674-L736)) — legge `storage/@lavori`.
  - `readNextLavoriListaSnapshot` ([nextLavoriDomain.ts:862-954](src/next/domain/nextLavoriDomain.ts#L862-L954)).
  - `readNextLavoriInAttesaSnapshot` ([nextLavoriDomain.ts:956-960](src/next/domain/nextLavoriDomain.ts#L956)).
  - `readNextLavoriEseguitiSnapshot` ([nextLavoriDomain.ts:962-966](src/next/domain/nextLavoriDomain.ts#L962)).
  - `readNextLavoriArchivioSnapshot` ([nextLavoriDomain.ts:977-987](src/next/domain/nextLavoriDomain.ts#L977)).
  - `readNextDettaglioLavoroSnapshot` ([nextLavoriDomain.ts:1008-1107](src/next/domain/nextLavoriDomain.ts#L1008)).
  - `readNextMezzoLavoriSnapshot` ([nextLavoriDomain.ts:1109-1156](src/next/domain/nextLavoriDomain.ts#L1109)).
  - `readNextLavoriLegacyDataset` ([nextLavoriDomain.ts:1190-1210](src/next/domain/nextLavoriDomain.ts#L1190)).
- **Modali interni esposti**: nessuno (solo dominio).
- **Componenti riusati da fuori**: gli helper sono importati in 14 file (vedi grep iniziale, CAPITOLO F-bis).

### A.6 [src/next/next-lavori.css](src/next/next-lavori.css)
- Foglio di stile dedicato alla pagina Lavori (prefissi `nl-*`). Importato da [NextLavoriDaEseguirePage.tsx:19](src/next/NextLavoriDaEseguirePage.tsx#L19) e [NextDettaglioLavoroPage.tsx:17](src/next/NextDettaglioLavoroPage.tsx#L17).
- Nessun writer/reader. Nessun riuso esterno verificato via grep su `nl-`.

---

## CAPITOLO B — Shape reale @lavori

Campi estratti dalla normalizzazione `toBaseLavoroReadOnlyItem` ([nextLavoriDomain.ts:461-568](src/next/domain/nextLavoriDomain.ts#L461-L568)) e dai writer ([NextLavoriDaEseguirePage.tsx:491-502](src/next/NextLavoriDaEseguirePage.tsx#L491-L502), [NextAutistiAdminNative.tsx:1565-1582](src/next/autistiInbox/NextAutistiAdminNative.tsx#L1565-L1582), [nextLavoroCreateWriter.ts:84-102](src/next/nextLavoroCreateWriter.ts#L84-L102)).

| Campo | Tipo apparente | Scritto in (file:riga) | Letto in (file:riga) | Valori noti | Opzionale/Sempre |
|---|---|---|---|---|---|
| `id` | string (uuid o sintetico) | NextLavoriDaEseguirePage.tsx:492, NextAutistiAdminNative.tsx:1566/1651, nextLavoroCreateWriter.ts:85 | nextLavoriDomain.ts:403-408 | uuid v4 / `genId()` | sempre |
| `gruppoId` | string \| null | NextLavoriDaEseguirePage.tsx:493, NextAutistiAdminNative.tsx:1567/1652, nextLavoroCreateWriter.ts:86 | nextLavoriDomain.ts:477 | uuid v4 | nullable (cf. flag `missing_gruppo_id` riga 487) |
| `tipo` | "magazzino" \| "targa" | NextLavoriDaEseguirePage.tsx:494, NextAutistiAdminNative.tsx:1568/1653, nextLavoroCreateWriter.ts:87 | nextLavoriDomain.ts:296-300, 468 | "magazzino" / "targa" | sempre |
| `targa` | string ("" se magazzino) | NextLavoriDaEseguirePage.tsx:495, NextAutistiAdminNative.tsx:1569/1654, nextLavoroCreateWriter.ts:88 | nextLavoriDomain.ts:465 | uppercase | opz. |
| `mezzoTarga` | string (alias di targa, alcuni record) | — (alias normalizzato) | nextLavoriDomain.ts:466 | uppercase | opz. (alias) |
| `descrizione` | string | NextLavoriDaEseguirePage.tsx:496, NextAutistiAdminNative.tsx:1570/1655, nextLavoroCreateWriter.ts:89 | nextLavoriDomain.ts:472 | testo libero | sempre (flag se vuota) |
| `dettagli` | string \| null | nextLavoroCreateWriter.ts:95 | nextLavoriDomain.ts:473, NextDettaglioLavoroPage.tsx:48 | testo | opz. |
| `dataInserimento` | string ISO/YMD | NextLavoriDaEseguirePage.tsx:497, NextAutistiAdminNative.tsx:1571/1656, nextLavoroCreateWriter.ts:90 | nextLavoriDomain.ts:474 | "YYYY-MM-DD" o ISO | sempre |
| `dataEsecuzione` | string ISO \| undefined | NextDettaglioLavoroPage.tsx:860 | nextLavoriDomain.ts:475 | ISO | opz. |
| `eseguito` | boolean | NextLavoriDaEseguirePage.tsx:498, NextDettaglioLavoroPage.tsx:858, NextAutistiAdminNative.tsx:1572/1657, nextLavoroCreateWriter.ts:91 | nextLavoriDomain.ts:476 | true/false | sempre |
| `urgenza` | "bassa" \| "media" \| "alta" \| null | NextLavoriDaEseguirePage.tsx:499, NextAutistiAdminNative.tsx:1573/1658, nextLavoroCreateWriter.ts:92 | nextLavoriDomain.ts:498 | bassa/media/alta | opz. |
| `segnalatoDa` | string | NextLavoriDaEseguirePage.tsx:500, NextAutistiAdminNative.tsx:1574/1659, nextLavoroCreateWriter.ts:93 | nextLavoriDomain.ts:535 | nome autista o "utente" | opz. |
| `chiHaEseguito` | string | NextDettaglioLavoroPage.tsx:859 | nextLavoriDomain.ts:536 | nome esecutore | opz. |
| `sottoElementi` | unknown[] | NextLavoriDaEseguirePage.tsx:501, NextAutistiAdminNative.tsx:1575/1660, nextLavoroCreateWriter.ts:94 | nextLavoriDomain.ts:508 | sempre `[]` nei writer NEXT | sempre |
| `source.type` | "segnalazione" \| "controllo" \| altro | NextAutistiAdminNative.tsx:1577/1662, nextLavoroCreateWriter.ts:97 | nextLavoriDomain.ts:501 | "segnalazione" \| "controllo" | opz. (assente per "manuali") |
| `source.id` | string \| null | NextAutistiAdminNative.tsx:1578/1663, nextLavoroCreateWriter.ts:98 | nextLavoriDomain.ts:503 | id del controllo o segnalazione | opz. |
| `source.key` | string | NextAutistiAdminNative.tsx:1579/1664, nextLavoroCreateWriter.ts:99 | nextLavoriDomain.ts:502 | "@segnalazioni_autisti_tmp" \| "@controlli_mezzo_autisti" | opz. |
| `nascostoInArchivio` | boolean | nextArchivioHideWriter.ts (PROMPT 31.1) | useArchivioData.ts:76 (filtro) | true/false | opz. (default assente=false) |

**Stati**: il dato legacy ha SOLO `eseguito` (boolean) e `gruppoId` come discriminanti ([nextLavoriDomain.ts:635-636](src/next/domain/nextLavoriDomain.ts#L635-L636)). La proiezione `statoVista` `"da_eseguire" | "in_attesa" | "eseguito"` è DERIVATA dal layer ([nextLavoriDomain.ts:539](src/next/domain/nextLavoriDomain.ts#L539)) e non vive sul record.

**Storage**: nessun riferimento a path Storage Firebase (foto, allegati) viene scritto o letto direttamente su record `@lavori`; le foto stanno sulle segnalazioni/controlli linkati ([NextDettaglioLavoroPage.tsx:1232-1238](src/next/NextDettaglioLavoroPage.tsx#L1232-L1238) — `selectedSegnalazione.fotoUrls`).

**Allowed fields registry IA** ([registry.config.js:382-403](backend/internal-ai/server/lib/registry.config.js#L382-L403)): include anche `cantiere`, `cantiereId`, `stato`, `data`, `timestamp`, `dataInizio`, `dataFine`, `lavorazione`, `sourceRecordId` — questi campi NON sono prodotti dai writer NEXT odierni e non risultano letti da `toBaseLavoroReadOnlyItem`. Sono lookup permessi dal boundary IA ma non popolati nello stock attuale.

---

## CAPITOLO C — Shape reale @manutenzioni

Campi estratti da `toHistoryItem` ([nextManutenzioniDomain.ts:564-622](src/next/domain/nextManutenzioniDomain.ts#L564-L622)) e `toLegacyDatasetRecord` ([nextManutenzioniDomain.ts:475-536](src/next/domain/nextManutenzioniDomain.ts#L475-L536)).

| Campo | Tipo | Scritto in | Letto in | Valori | Opzionale |
|---|---|---|---|---|---|
| `id` | string | nextManutenzioniDomain.ts:837 (`buildGeneratedId` = `Date.now()`) | nextManutenzioniDomain.ts:371-375 | "1715000000000" o sintetico | sempre |
| `targa` | string | nextManutenzioniDomain.ts:838 | nextManutenzioniDomain.ts:479, 568 | uppercase | sempre |
| `tipo` | "mezzo" \| "compressore" \| "attrezzature" | nextManutenzioniDomain.ts:839 | nextManutenzioniDomain.ts:384-398 | "mezzo"/"compressore"/"attrezzature" | sempre |
| `fornitore` | string \| undefined | nextManutenzioniDomain.ts:840 | nextManutenzioniDomain.ts:521-525 | nome libero | opz. |
| `km` | number \| null | nextManutenzioniDomain.ts:842 | nextManutenzioniDomain.ts:490 | num | opz. (null se non `mezzo`) |
| `ore` | number \| null | nextManutenzioniDomain.ts:843 | nextManutenzioniDomain.ts:515 | num | opz. |
| `sottotipo` | "motrice" \| "trattore" \| null | nextManutenzioniDomain.ts:844 | nextManutenzioniDomain.ts:400-406 | motrice/trattore | opz. (solo per compressore) |
| `descrizione` | string | nextManutenzioniDomain.ts:845 | nextManutenzioniDomain.ts:483-487, 571 | testo libero | sempre |
| `eseguito` | string \| null | nextManutenzioniDomain.ts:846 | nextManutenzioniDomain.ts:518 | nome esecutore (TESTO) | opz. |
| `data` | string | nextManutenzioniDomain.ts:847 | nextManutenzioniDomain.ts:488 | "DD MM YYYY" o ISO | sempre |
| `materiali` | NextManutenzioniLegacyMaterialRecord[] | nextManutenzioniDomain.ts:848 | nextManutenzioniDomain.ts:408-435 | array { id, label, quantita, unita, fromInventario, refId } | opz. |
| `importo` | number \| null | nextManutenzioniDomain.ts:849 | nextManutenzioniDomain.ts:527 | num | opz. |
| `gommeInterventoTipo` | "ordinario" \| "straordinario" | nextManutenzioniDomain.ts:850 | nextManutenzioniDomain.ts:579-585 | ordinario/straordinario | opz. |
| `gommeStraordinario` | { asseId, quantita, motivo } | nextManutenzioniDomain.ts:851 | nextManutenzioniDomain.ts:263-281 | oggetto | opz. |
| `assiCoinvolti` | string[] | nextManutenzioniDomain.ts:852 | nextManutenzioniDomain.ts:217-229 | ["anteriore","posteriore","asse1","asse2","asse3"] | opz. |
| `gommePerAsse` | [{ asseId, dataCambio, kmCambio }] | nextManutenzioniDomain.ts:853 | nextManutenzioniDomain.ts:231-252 | array | opz. |
| `sourceDocumentId` | string \| null | nextManutenzioniDomain.ts:854 | nextManutenzioniDomain.ts:532-534 | id documento legato (fattura) | opz. |
| `nascostoInArchivio` | boolean | nextArchivioHideWriter.ts (PROMPT 31.1) | useArchivioData.ts:90 | true/false | opz. |

**Rispetto alla domanda esplicita del prompt**:
- **Campo `stato` (daFare/programmata/eseguita)?** NO. Non esiste. La "manutenzione programmata" è un attributo del **mezzo** (`manutenzioneProgrammata`, `manutenzioneDataInizio`, `manutenzioneDataFine`, `manutenzioneKmMax`, `manutenzioneContratto`), letto da `@mezzi_aziendali` ([nextManutenzioniDomain.ts:639-660](src/next/domain/nextManutenzioniDomain.ts#L639-L660)). Il record `@manutenzioni` rappresenta solo storico INTERVENTI gia avvenuti.
- **Campo `dataProgrammata`?** NO. Solo `data` (esecuzione) e i campi `manutenzioneDataFine` lato mezzo.
- **Concetto di origine (manuale/controllo/segnalazione)?** NO sul record. Esiste solo una classificazione DERIVATA `sourceOrigin: "manuale" | "autisti_gomme_derivato" | "unknown"` ([nextManutenzioniDomain.ts:617-618](src/next/domain/nextManutenzioniDomain.ts#L617-L618)) calcolata da `descrizione` (riconosce stringhe "CAMBIO GOMME"). Nessun backlink reale.
- **Backlink a controllo/segnalazione?** NO.
- **Campo `segnalatoDa`?** NO.
- **Form Nuova/Modifica richiede km/fornitore/costo obbligatori?** Vedi `sanitizeBusinessRecord` ([nextManutenzioniDomain.ts:810-855](src/next/domain/nextManutenzioniDomain.ts#L810-L855)): `descrizione` obbligatoria (fallback "Manutenzione"), `targa`/`tipo`/`data` obbligatori. `km` opzionale (solo per `tipo==="mezzo"`), `ore` opzionale per compressore/attrezzature, `fornitore` opzionale, `importo` opzionale. Materiali opzionali. Il form UI ([NextManutenzioniPage.tsx:2156-2196](src/next/NextManutenzioniPage.tsx#L2156-L2196)) ha label "KM" senza required HTML, idem "Fornitore" placeholder libero.

---

## CAPITOLO D — Overlap di shape

| Campo `@lavori` | Corrispettivo `@manutenzioni` | Nota |
|---|---|---|
| `id` (uuid o sintetico) | `id` (timestamp string) | format diverso, ma stesso ruolo. Migrazione richiede riemissione UUID o accettazione id legacy. |
| `gruppoId` | (assente) | `@manutenzioni` non raggruppa. Va creato o accettato perdita raggruppamento per migrazione storica. |
| `tipo` ("magazzino"/"targa") | `tipo` ("mezzo"/"compressore"/"attrezzature") | semantiche DIVERSE. Andrebbe risolto: tipo lavoro != tipo manutenzione. |
| `targa` | `targa` | identico (uppercase). Allineato. |
| `descrizione` | `descrizione` | identico (testo libero). Allineato. |
| `dettagli` | (parzialmente in `descrizione` o materiali) | va esteso lato manutenzioni o accettato collasso in `descrizione`. |
| `dataInserimento` | (assente) | manutenzioni hanno solo `data` (esecuzione). Serve campo `dataInserimento` (= momento creazione da-fare). |
| `dataEsecuzione` | `data` | la `data` su manutenzioni è di fatto la data esecuzione. Allineato concettualmente. |
| `eseguito` (bool) | (implicito: sempre eseguito) | manutenzioni NON ha stato. Va aggiunto campo stato. |
| `urgenza` (bassa/media/alta) | (assente) | va aggiunto. |
| `segnalatoDa` | (assente) | va aggiunto. |
| `chiHaEseguito` | `eseguito` (string nome esecutore!) | conflitto di nomi: `eseguito` su manutenzioni è il nome esecutore, su lavori è il flag. Va rinominato `chiHaEseguito` o gestita ambiguita. |
| `sottoElementi` | `materiali` | semantiche diverse: sotto-elementi sono voci interne libere; materiali sono righe inventario. Non equiparabili 1:1. |
| `source.type` / `source.id` / `source.key` | (assente) | backlink controllo/segnalazione va aggiunto (es. `originType`, `originRefId`, `originRefKey`). |
| `nascostoInArchivio` | `nascostoInArchivio` | identico (PROMPT 31.1). Gia allineato in entrambe. |
| (assente) | `gommeInterventoTipo`, `gommeStraordinario`, `assiCoinvolti`, `gommePerAsse` | dominio specifico manutenzioni. Resta solo lato manutenzioni. |
| (assente) | `km`, `ore`, `sottotipo`, `fornitore`, `importo`, `sourceDocumentId` | dominio specifico manutenzioni. Resta solo lato manutenzioni. |

---

## CAPITOLO E — Conteggio record reali

**VERIFICA NON ESEGUITA — accesso Firestore non disponibile dall'agent.**

Snippet che Giuseppe puo eseguire (es. console Firebase o uno script Node con `firebase-admin`):

```javascript
// Su storage/@lavori e storage/@manutenzioni il dato è UN unico documento per collection,
// con array nel campo `value` (cfr. unwrapStorageArray: nextLavoriDomain.ts:374-401).
// Esempio in Firebase Console (Query JS):

const lavoriDoc = await db.collection("storage").doc("@lavori").get();
const items = lavoriDoc.data()?.value || lavoriDoc.data()?.items || [];
console.log("Tot @lavori:", items.length);
console.log("Eseguiti:", items.filter(i => i.eseguito === true).length);
console.log("Aperti:", items.filter(i => i.eseguito !== true).length);
console.log("Source segnalazione:", items.filter(i => i?.source?.type === "segnalazione").length);
console.log("Source controllo:", items.filter(i => i?.source?.type === "controllo").length);
console.log("Source manuale (no source):", items.filter(i => !i?.source?.type).length);
console.log("Con linkedLavoroId (su segnalazioni/controlli):", "vedi @segnalazioni_autisti_tmp e @controlli_mezzo_autisti");

const manuDoc = await db.collection("storage").doc("@manutenzioni").get();
const m = manuDoc.data()?.value || manuDoc.data()?.items || [];
console.log("Tot @manutenzioni:", m.length);
console.log("Per tipo:",
  m.reduce((acc,i) => { acc[i.tipo||"_"]=(acc[i.tipo||"_"]||0)+1; return acc; }, {}));
```

Per i lavori con `linkedLavoroId` su segnalazioni/controlli (relazione inversa):
```javascript
const seg = (await db.collection("storage").doc("@segnalazioni_autisti_tmp").get()).data()?.value || [];
console.log("Segnalazioni con linkedLavoroId:", seg.filter(s => s.linkedLavoroId || (Array.isArray(s.linkedLavoroIds) && s.linkedLavoroIds.length)).length);
const ctr = (await db.collection("storage").doc("@controlli_mezzo_autisti").get()).data()?.value || [];
console.log("Controlli con linkedLavoroId:", ctr.filter(c => c.linkedLavoroId || (Array.isArray(c.linkedLavoroIds) && c.linkedLavoroIds.length)).length);
```

**Foto/allegati su Storage per `@lavori`**: nessun path Storage scritto direttamente sui record `@lavori` (audit del codice — i blob foto stanno sui record segnalazione/controllo linkati, cf. `selectedSegnalazione.fotoUrls` [NextDettaglioLavoroPage.tsx:1232-1238](src/next/NextDettaglioLavoroPage.tsx#L1232-L1238)).

---

## CAPITOLO F — Punti di ingresso UI diretti (visibili all'utente)

### Routes
- [App.tsx:325-405](src/App.tsx#L325-L405) — definizione 4 route NEXT:
  - `path="lavori-da-eseguire"` → `<NextLavoriDaEseguirePage />`
  - `path="lavori-in-attesa"` → `<NextLavoriInAttesaPage />`
  - `path="lavori-eseguiti"` → `<NextLavoriEseguitiPage />`
  - `path="dettagliolavori/:lavoroId"` (+ `path="dettagliolavori"`) → `<NextDettaglioLavoroPage />`
- [nextStructuralPaths.ts:19-22](src/next/nextStructuralPaths.ts#L19-L22) — costanti path:
  - `NEXT_LAVORI_DA_ESEGUIRE_PATH`, `NEXT_LAVORI_IN_ATTESA_PATH`, `NEXT_LAVORI_ESEGUITI_PATH`, `NEXT_DETTAGLIO_LAVORI_PATH`.

### Sidebar / menu
- [nextData.ts:155-162](src/next/nextData.ts#L155-L162) — voce sidebar "Lavori" sotto sezione "OPERATIVITA'", link a `NEXT_LAVORI_DA_ESEGUIRE_PATH`.

### Home NEXT
- [NextHomePage.tsx:629-660](src/next/NextHomePage.tsx#L629-L660) — card alert "Lavori in attesa" (NavLink a `/next/lavori-in-attesa`) con preview top-3 e contatore totale+urgenti.
- [NextHomePage.tsx:411-435](src/next/NextHomePage.tsx#L411-L435) — stat card "Lavori aperti" (numero + dettaglio urgenti).

### Dossier Mezzo NEXT
- [NextDossierMezzoPage.tsx:550-554](src/next/NextDossierMezzoPage.tsx#L550-L554) — sezione "Lavori" con due colonne "In attesa" / "Eseguiti", click su item apre `/next/dettagliolavori/:id`.
- [NextDossierMezzoPage.tsx:570-588](src/next/NextDossierMezzoPage.tsx#L570-L588) — modali "Mostra tutti" lavori in attesa / eseguiti.

### Centro Controllo / Sinottica
- [NextCentroControlloSinottica.tsx:1517-1530](src/next/components/NextCentroControlloSinottica.tsx#L1517-L1530) — KPI "Lavori urgenti" cliccabile (filtra tabella sinottica).
- [NextCentroControlloSinottica.tsx:908,940](src/next/components/NextCentroControlloSinottica.tsx#L908) — filtro/case `lavori-urgenti`.

### Manutenzioni NEXT
- [NextManutenzioniPage.tsx:2047-2051](src/next/NextManutenzioniPage.tsx#L2047-L2051) — KPI "Segnalazioni aperte" (in realta legge `lavoriInAttesaByTarga`, etichetta UI "Segnalazioni aperte" che riflette lavori).

### Internal AI Mezzo Card (chat IA / mezzo report)
- [InternalAiMezzoCard.tsx:182-213](src/next/internal-ai/InternalAiMezzoCard.tsx#L182-L213) — sezione "Lavori e manutenzioni D02" con contatori "Lavori aperti" / "Lavori chiusi" / "Manutenzioni" e lista "Lavori aperti" cliccabile.

### Modali di creazione lavoro
- [NextHomeAutistiEventoModal.tsx:383-388,940-964](src/next/components/NextHomeAutistiEventoModal.tsx#L383) — form modale "Crea lavoro" da evento autista (descrizione/urgenza/targa/note).
- [NextAutistiAdminNative.tsx:1540-1693](src/next/autistiInbox/NextAutistiAdminNative.tsx#L1540-L1693) — funzioni `createLavoroFromSegnalazione` / `createLavoroFromControllo` invocate da `AutistiAdmin`.

### Pulsanti "Apri lavoro" / link a dettaglio da altri moduli
- Helper `buildNextDettaglioLavoroPath` ([nextLavoriDomain.ts:989-1006](src/next/domain/nextLavoriDomain.ts#L989-L1006)) usato da:
  - [NextCentroControlloParityPage.tsx:47](src/next/NextCentroControlloParityPage.tsx#L47)
  - [ArchivioRowLavoro.tsx:13](src/next/centroControllo/archivioStorico/rows/ArchivioRowLavoro.tsx#L13)
- Open via `navigate(\`/next/dettagliolavori?lavoroId=${id}\`)` da:
  - [NextAutistiAdminNative.tsx:1585,1671](src/next/autistiInbox/NextAutistiAdminNative.tsx#L1585)

### NextAutistiAdminNative.tsx (admin autisti)
- Pulsanti "Crea lavoro" su righe segnalazione/controllo ([NextAutistiAdminNative.tsx:1540-1693](src/next/autistiInbox/NextAutistiAdminNative.tsx#L1540-L1693)). Disabilitati se `linkedLavoroId` gia presente.

---

## CAPITOLO F-bis — LETTORI INDIRETTI DI @lavori (capitolo critico)

Lista ESAUSTIVA dei moduli NEXT che leggono `@lavori` senza essere il modulo Lavori stesso.

### F-bis.1 — Home NEXT (card "Lavori in attesa")
- **File:riga**: [NextHomePage.tsx:354-401](src/next/NextHomePage.tsx#L354-L401) (chiamata `readNextLavoriInAttesaSnapshot`), [NextHomePage.tsx:446-454](src/next/NextHomePage.tsx#L446-L454) (build widget), [NextHomePage.tsx:629-660](src/next/NextHomePage.tsx#L629-L660) (render).
- **Modulo**: Home dashboard.
- **Lettura**: snapshot completo lista globale aperti via `readNextLavoriInAttesaSnapshot()` (legge `storage/@lavori`).
- **Cosa fa con i dati**: stat card "Lavori aperti" + card alert con preview top-3 + contatore "Urgenti".
- **Impatto congelamento `@lavori`**: la card mostrerebbe SEMPRE i lavori storici eseguiti=false fino al giorno del congelamento. Diventerebbe stale ma non rotta. Tuttavia, dopo dismissione, i nuovi controlli KO/segnalazioni non arriverebbero piu nella card.
- **Gravita**: **ALTA** — guida la giornata operativa di Giuseppe.

### F-bis.2 — Manutenzioni NEXT (KPI "Segnalazioni aperte" per mezzo)
- **File:riga**: [NextManutenzioniPage.tsx:27,776,805-810,888,921,968,2047-2051](src/next/NextManutenzioniPage.tsx#L27).
- **Modulo**: Manutenzioni NEXT (Dashboard tab).
- **Lettura**: `readNextLavoriInAttesaSnapshot({ includeCloneOverlays: false })`, indicizza per targa.
- **Cosa fa**: KPI "Segnalazioni aperte" con count per mezzo (`lavoriInAttesaByTarga[activeTarga]`).
- **Impatto congelamento**: il KPI conterebbe lavori storici aperti, non aggiornato. Sviante (UI dice "Segnalazioni aperte" ma legge `@lavori`).
- **Gravita**: **CRITICA** — gia oggi è ambiguo (label "Segnalazioni" ma dato "Lavori"). Dopo dismissione diventa permanentemente fuorviante.

### F-bis.3 — Centro Controllo / Sinottica V2
- **File:riga**: [NextCentroControlloParityPage.tsx:47,988-1012,1060,1520](src/next/NextCentroControlloParityPage.tsx#L47) (loader `loadLavoriAperti`); [NextCentroControlloSinottica.tsx:93,489,556-565,840-870,1517-1530,908-948,971](src/next/components/NextCentroControlloSinottica.tsx#L93) (KPI "Lavori urgenti" e raggruppamento per targa).
- **Modulo**: Centro Controllo, vista Sinottica.
- **Lettura**: `readNextLavoriInAttesaSnapshot()` (filtrato `eseguito===false`), poi mappato in `lavoriAperti[]` con `{id, targa, urgenza, eseguito}` e bucketizzato per targa.
- **Cosa fa**: KPI "Lavori urgenti" (count + "Su X mezzi") + chip `lavori` per riga mezzo + filtro KPI cliccabile.
- **Impatto congelamento**: chip e KPI rimangono fissi sui lavori dello stato finale. Diventa sviante.
- **Gravita**: **CRITICA** — guida la giornata Centro Controllo.

### F-bis.4 — Archivio Storico NEXT
- **File:riga**: [useArchivioData.ts:14,67,79-87](src/next/centroControllo/archivioStorico/hooks/useArchivioData.ts#L14) (uso `readNextLavoriArchivioSnapshot`); [ArchivioRowLavoro.tsx:13](src/next/centroControllo/archivioStorico/rows/ArchivioRowLavoro.tsx#L13) (link a dettaglio).
- **Modulo**: Centro Controllo → tab Archivio Storico.
- **Lettura**: `readNextLavoriArchivioSnapshot()` (TUTTI gli stati).
- **Cosa fa**: feed cronologico di lavori (aperti+in attesa+eseguiti) come record archivio, filtrabili, soft-hide via `nascostoInArchivio`.
- **Impatto congelamento**: l'archivio mostra storico, accettabile. Ma nuovi lavori da segnalazione/controllo dopo dismissione non comparirebbero (perche `@lavori` non riceve piu writer).
- **Gravita**: **MEDIA** — è storico, dopo dismissione comunque continua a mostrare snapshot finale di `@lavori`. Va repuntato a `@manutenzioni` per nuovi record.

### F-bis.5 — Dossier Mezzo NEXT (sezione Lavori)
- **File:riga**: [nextDossierMezzoDomain.ts:23,771,877-883,923-925](src/next/domain/nextDossierMezzoDomain.ts#L23) (lettura via `readNextMezzoLavoriSnapshot`); [NextDossierMezzoPage.tsx:290-291,427-428,551-553](src/next/NextDossierMezzoPage.tsx#L290).
- **Modulo**: Dossier Mezzo NEXT.
- **Lettura**: `readNextMezzoLavoriSnapshot(targa)` (legge `@lavori` filtrato per targa, ritorna `daEseguire`/`inAttesa`/`eseguiti`).
- **Cosa fa**: sezione "Lavori" del dossier con due liste preview + modali full + inclusione in PDF dossier (`openDossierPdf`).
- **Impatto congelamento**: il dossier mostrerebbe il "fotogramma" finale dei lavori del mezzo. Nessun nuovo lavoro post-dismissione.
- **Gravita**: **ALTA** — il dossier è la pagina di riferimento per mezzo, e include anche `lavoriDaEseguire`/`lavoriInAttesa`/`lavoriEseguiti` nel PDF ([NextDossierMezzoPage.tsx:289-291](src/next/NextDossierMezzoPage.tsx#L289-L291)).

### F-bis.6 — Operativita Tecnica mezzo (sotto-dominio Dossier)
- **File:riga**: [nextOperativitaTecnicaDomain.ts:6,229,249-254](src/next/nextOperativitaTecnicaDomain.ts#L6).
- **Modulo**: Snapshot tecnico mezzo (usato dal Dossier e dalla Chat IA).
- **Lettura**: `readNextMezzoLavoriSnapshot(mezzoTarga)`.
- **Cosa fa**: aggrega `lavoriAperti` e `lavoriChiusi` per mezzo + count.
- **Impatto congelamento**: i contatori "Lavori aperti / chiusi" del mezzo restano congelati allo stato dismissione.
- **Gravita**: **ALTA** — alimenta dossier e chat IA mezzi.

### F-bis.7 — Chat IA — sector "mezzi"
- **File:riga**: [chatIaMezziData.ts:8,84,113](src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts#L8) (importa `readNextMezzoLavoriSnapshot`, lo passa nello snapshot e dichiara `path: "storage/@lavori + storage/@manutenzioni"` nelle sources).
- **Modulo**: Chat IA → analisi mezzo.
- **Lettura**: `readNextMezzoLavoriSnapshot(resolvedTarga)`.
- **Cosa fa**: alimenta snapshot Chat IA per query "lavori su targa X". Le risposte IA hanno il dominio @lavori come sorgente dichiarata.
- **Impatto congelamento**: la chat continuerebbe a citare `@lavori` come sorgente attiva pur essendo congelata. Risposte fuorvianti.
- **Gravita**: **ALTA** — risposta IA basata su sorgente in dismissione.

### F-bis.8 — Internal AI Mezzo Card (dossier mezzo IA)
- **File:riga**: [InternalAiMezzoCard.tsx:61,66-68,182-213](src/next/internal-ai/InternalAiMezzoCard.tsx#L61); [internalAiProfessionalVehicleReport.ts:21-22,75](src/next/internal-ai/internalAiProfessionalVehicleReport.ts#L21).
- **Modulo**: Card report mezzo Internal AI.
- **Lettura**: indirettamente via `MezzoDossierCardData` (alimentata da `chatIaMezziData.ts`).
- **Cosa fa**: sezione "Lavori e manutenzioni D02" con contatori "Lavori aperti / chiusi" + lista lavori aperti.
- **Gravita**: **ALTA** — rappresentazione mezzo nell'IA.

### F-bis.9 — Chat IA — router intent (sezione `manutenzioni_scadenze`)
- **File:riga**: [chatIaRouter.ts:31](src/next/chat-ia/core/chatIaRouter.ts#L31).
- **Modulo**: routing intent chat IA.
- **Lettura**: nessuna lettura runtime; "lavori" è solo una keyword `primary` nella categoria `manutenzioni_scadenze`.
- **Cosa fa**: dirige le query utente contenenti "lavori" verso il sector mezzi/manutenzioni.
- **Gravita**: **BASSA** — è solo testo. Va comunque coordinato con la dismissione (aggiungere/togliere keyword).

### F-bis.10 — Chat IA — view.config (Site360 / Vehicle360)
- **File:riga**: [view.config.ts:86-110,274-280](src/next/chat-ia/config/view.config.ts#L86-L110) (entry `firestore-storage-lavori-doc` come `entryBoundaryIds` di Site360 + Vehicle360; sezione `site_jobs` con label "Lavori e cantieri").
- **Modulo**: configurazione view IA.
- **Lettura**: nessuna lettura runtime diretta da `@lavori`; dichiara solo il boundary IA come sorgente lecita.
- **Cosa fa**: rende `@lavori` interrogabile dall'agent IA per query Site360 e Vehicle360.
- **Gravita**: **MEDIA** — l'IA continuerebbe a leggere `@lavori` come fonte attiva.

### F-bis.11 — Registry IA Zero-Invenzioni
- **File:riga**: [registry.config.js:372-437](backend/internal-ai/server/lib/registry.config.js#L372-L437) (entry `work.lavori`).
- **Modulo**: backend internal-ai, registry resolver.
- **Lettura**: backend IA risolve query su entita `work.lavori` con doc `storage/@lavori`, `viewBindings: ["Vehicle360","Site360","Ricerca360"]`, aliases per `lavoro`, `mezzo`, `cantiere`.
- **Impatto congelamento**: l'IA risponderebbe a domande "lavori su targa X" leggendo `@lavori` congelato.
- **Gravita**: **ALTA** — entry attiva del registry IA.

### F-bis.12 — Firebase read-only boundary IA
- **File:riga**: [internal-ai-firebase-readonly-boundary.js:484-505,1156-1170](backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js#L484) (entry `firestore-storage-lavori-doc` + `FIRESTORE_LAVORI_ALLOWED_FIELDS`).
- **Modulo**: boundary read-only sull'IA.
- **Lettura**: definisce il perimetro di lettura ammesso (allowed/forbidden fields).
- **Gravita**: **MEDIA** — va dismessa o rimappata a `@manutenzioni`.

### F-bis.13 — Repo understanding (mappa screen IA)
- **File:riga**: [internal-ai-repo-understanding.js:336-358,765-777,866-872](backend/internal-ai/server/internal-ai-repo-understanding.js#L336-L358) (entries `next-lavori-da-eseguire`, `next-lavori-in-attesa`, `next-lavori-eseguiti`, `next-dettaglio-lavoro` + `safeStateProbes` per "modal-lavori-attesa").
- **Modulo**: catalog screens IA per discovery.
- **Gravita**: **MEDIA** — è metadata di documentazione interna IA.

### F-bis.14 — NextLegacyStorageBoundary (override dataset per pagine clone)
- **File:riga**: [NextLegacyStorageBoundary.tsx:20,213](src/next/NextLegacyStorageBoundary.tsx#L20).
- **Modulo**: boundary clone-safe per pagine che ancora si appoggiano al getItemSync legacy.
- **Lettura**: in preset "lavori", forza l'override locale di `@lavori` con `readNextLavoriLegacyDataset()`.
- **Gravita**: **ALTA** — è il bridge che fa funzionare i lettori `getItemSync("@lavori")` nel runtime clone.

### F-bis.15 — nextMezzoHardDeleteWriter (cancellazione mezzo da Centro Controllo)
- **File:riga**: [nextMezzoHardDeleteWriter.ts:10,72,104,164,194,235,257](src/next/nextMezzoHardDeleteWriter.ts#L10).
- **Modulo**: writer hard-delete mezzo (cancella anche record correlati).
- **Lettura/Scrittura**: conteggia e cancella record `@lavori` legati al mezzo (insieme a `@manutenzioni`, `@rifornimenti`, ecc.).
- **Gravita**: **ALTA** — se `@lavori` viene dismesso, il writer deve smettere di toccarlo (rischio errore "dataset non trovato") o piu probabilmente va ridotto a un soft-skip su `@lavori` e va esteso al nuovo schema unificato in `@manutenzioni`.

### F-bis.16 — Routing autisti admin (creazione lavoro)
- **File:riga**: [NextAutistiAdminNative.tsx:1540-1693](src/next/autistiInbox/NextAutistiAdminNative.tsx#L1540-L1693) + helper [appendLavori NextAutistiAdminNative.tsx:738-757](src/next/autistiInbox/NextAutistiAdminNative.tsx#L738-L757) (scrive `@next_clone_lavori:records` via `appendNextLavoriCloneRecords`).
- **Modulo**: admin autisti (vedi CAPITOLO G).
- **Gravita**: **CRITICA** — è il writer indiretto principale.

### F-bis.17 — Centro Controllo (NextCentroControlloParityPage)
- **File:riga**: [NextCentroControlloParityPage.tsx:97,114,478,510,1526,1542](src/next/NextCentroControlloParityPage.tsx#L97) — usa `hasLinkedLavoro` (booleano) per filtrare segnalazioni/controlli SOLO senza lavoro collegato (mostrate come "da gestire").
- **Modulo**: Centro Controllo, vista Sinottica.
- **Lettura**: indirettamente via `linkedLavoroId` sulle righe segnalazioni/controlli (vedi [nextAutistiDomain.ts:552,692](src/next/domain/nextAutistiDomain.ts#L552-L692)).
- **Gravita**: **CRITICA** — la presenza di un lavoro linkato è il gating per non far comparire la segnalazione/controllo nella inbox da gestire. Dismettere `@lavori` rompe questo gating se non si sposta `linkedLavoroId` su un id manutenzione equivalente.

### F-bis.18 — NextHomeAutistiEventoModal (CTA Crea lavoro)
- **File:riga**: [NextHomeAutistiEventoModal.tsx:146-150](src/next/components/NextHomeAutistiEventoModal.tsx#L146-L150) (`hasLinkedLavoro`), [NextHomeAutistiEventoModal.tsx:382-400](src/next/components/NextHomeAutistiEventoModal.tsx#L382-L400) (form Crea lavoro), invoca prop `onCreateLavoro` che lega a `createLavoroFromEvento` ([nextLavoroCreateWriter.ts:142-202](src/next/nextLavoroCreateWriter.ts#L142-L202)).
- **Modulo**: modale evento autista dalla Home.
- **Gravita**: **CRITICA** — writer alternativo dalla Home Centro Controllo che scrive `@lavori` con scope `LAVORO_CREATE_WRITE_SCOPE`.

### F-bis.19 — Archivio Storico — ArchivioRowSegnalazione (riferimento a "Trasformata in lavoro")
- **File:riga**: [centroControllo/archivioStorico/rows/ArchivioRowSegnalazione.tsx](src/next/centroControllo/archivioStorico/rows/ArchivioRowSegnalazione.tsx) (presente in grep), [archivioTypes.ts:14-19](src/next/centroControllo/archivioStorico/archivioTypes.ts#L14-L19) (commento esplicito che il reader Step 1 non espone `source` sui lavori).
- **Modulo**: tab archivio storico.
- **Gravita**: **MEDIA** — testo informativo + presenza di `hasLinkedLavoro` su segnalazioni per badge "trasformata in lavoro".

### F-bis.20 — PDF Engine (Dossier mezzo)
- **File:riga**: [pdfEngine.ts:2205-2232](src/utils/pdfEngine.ts#L2205-L2232) — la funzione PDF Dossier accetta `lavoriInAttesa` e `lavoriEseguiti` come array. Chiamata da [NextDossierMezzoPage.tsx:289-291](src/next/NextDossierMezzoPage.tsx#L289-L291).
- **Modulo**: PDF Dossier mezzo.
- **Gravita**: **ALTA** — il PDF mostra lavori del mezzo. Dopo dismissione, mostrera solo storico.

---

## CAPITOLO G — Flusso admin autisti (writer indiretti su @lavori)

### G.1 Controllo KO → record `@lavori`
- **File:riga**: [NextAutistiAdminNative.tsx:1605-1693](src/next/autistiInbox/NextAutistiAdminNative.tsx#L1605-L1693) (`createLavoroFromControllo`).
- **Shape esatto del record creato** ([NextAutistiAdminNative.tsx:1650-1666](src/next/autistiInbox/NextAutistiAdminNative.tsx#L1650-L1666)):
  ```
  {
    id: genId(),
    gruppoId,
    tipo: "targa",
    targa: t,                                          // motrice e/o rimorchio
    descrizione: `Controllo KO: ${koList.join(", ")}`, // KO presi dal `check` boolean
    dataInserimento: todayYmd(),
    eseguito: false,
    urgenza: koList.length > 1 || obbligatorio ? "alta" : "media",
    segnalatoDa: record.autistaNome || record.badgeAutista || "autista",
    sottoElementi: [],
    source: { type: "controllo", id: record.id, key: "@controlli_mezzo_autisti" }
  }
  ```
- Patch sul controllo origine ([NextAutistiAdminNative.tsx:1674-1691](src/next/autistiInbox/NextAutistiAdminNative.tsx#L1674-L1691)): aggiunge `linkedLavoroId` (1 lavoro) o `linkedLavoroIds[]` + `linkedMultiple` (>1 targa motrice+rimorchio) e setta `letta: true`.

### G.2 Segnalazione autista → record `@lavori`
- **File:riga**: [NextAutistiAdminNative.tsx:1540-1603](src/next/autistiInbox/NextAutistiAdminNative.tsx#L1540-L1603) (`createLavoroFromSegnalazione`).
- **Shape esatto** ([NextAutistiAdminNative.tsx:1565-1582](src/next/autistiInbox/NextAutistiAdminNative.tsx#L1565-L1582)):
  ```
  {
    id, gruppoId,
    tipo: "targa" | "magazzino" (dipende da targa),
    targa: tipo === "targa" ? targa : "",
    descrizione: `Segnalazione: ${tipoProblema} - ${descr}`,
    dataInserimento: todayYmd(),
    eseguito: false,
    urgenza: record.flagVerifica ? "alta" : "media",
    segnalatoDa: record.autistaNome || record.badgeAutista || "autista",
    sottoElementi: [],
    source: { type: "segnalazione", id: record.id, key: "@segnalazioni_autisti_tmp" }
  }
  ```
- Patch sulla segnalazione origine ([NextAutistiAdminNative.tsx:1594-1601](src/next/autistiInbox/NextAutistiAdminNative.tsx#L1594-L1601)): `linkedLavoroId`, e `stato="presa_in_carico"` se il record gia aveva `stato`, altrimenti `letta=true`.

### G.3 Persistenza
- Entrambi i flussi chiamano `appendLavori(lavori)` ([NextAutistiAdminNative.tsx:738-757](src/next/autistiInbox/NextAutistiAdminNative.tsx#L738-L757)), che a sua volta invoca `appendNextLavoriCloneRecords` ([nextLavoriCloneState.ts:76-93](src/next/nextLavoriCloneState.ts#L76-L93)) — questo NON scrive su `storage/@lavori` di Firestore, scrive su `localStorage["@next_clone_lavori:records"]` (clone-only).
- Il record clone viene poi visto in lettura dal layer `readLavoriDataset` ([nextLavoriDomain.ts:687-735](src/next/domain/nextLavoriDomain.ts#L687-L735)) come overlay sopra il dataset Firestore.

**Implicazione importante per la dismissione**: i lavori creati dall'admin autisti NEXT vivono in `localStorage` clone-only, NON in Firestore `storage/@lavori`. Solo `nextLavoroCreateWriter.ts` (G.4) scrive davvero in Firestore.

### G.4 Creazione lavoro da modale Home (Centro Controllo)
- **File:riga**: [nextLavoroCreateWriter.ts:142-202](src/next/nextLavoroCreateWriter.ts#L142-L202).
- **Shape esatto** ([nextLavoroCreateWriter.ts:72-102](src/next/nextLavoroCreateWriter.ts#L72-L102)):
  ```
  {
    id, gruppoId, tipo,
    targa, descrizione,
    dataInserimento: todayYmd(),
    eseguito: false, urgenza,
    segnalatoDa, sottoElementi: [],
    dettagli: note || null,
    source: { type: "segnalazione"|"controllo", id: origineId, key }
  }
  ```
- Scrittura: `setItemSync("@lavori", nextLavori)` con scope `LAVORO_CREATE_WRITE_SCOPE` ([cloneWriteBarrier.ts:520-526](src/utils/cloneWriteBarrier.ts#L520-L526)). QUESTA scrittura va in Firestore `storage/@lavori`.
- Patch sull'origine: `patchSegnalazione` o `patchControllo` ([nextLavoroCreateWriter.ts:104-140](src/next/nextLavoroCreateWriter.ts#L104-L140)) — set `linkedLavoroId` + `letta=true` + `stato="presa_in_carico"` (se applicabile).

### G.5 Cosa cambia rispetto a una manutenzione futura con stato "daFare"
A livello DESCRITTIVO (NO implementazione):
- Va creato un equivalente `createManutenzioneDaFareFromControllo` / `createManutenzioneDaFareFromSegnalazione` che genera un record `@manutenzioni` con `stato="daFare"`, `dataProgrammata?` (opzionale), `dataInserimento`, `urgenza`, `segnalatoDa`, `origineTipo`, `origineRefId`, `origineRefKey` — campi che oggi `@manutenzioni` NON ha (CAPITOLO C).
- La patch sull'origine va aggiornata a `linkedManutenzioneId` (rinominata) o si lascia `linkedLavoroId` come alias.
- La distinzione `tipo: targa|magazzino` collide con `tipo: mezzo|compressore|attrezzature` di manutenzioni. Va deciso: si rinomina, si separa in due campi, o si elimina il concetto "magazzino" lato lavori (era usato per gestire materiali con voce lavoro generica).

### G.6 Altri writer indiretti su `@lavori` da NEXT
- **Modulo Lavori stesso**: `salvaGruppo` ([NextLavoriDaEseguirePage.tsx:516-529](src/next/NextLavoriDaEseguirePage.tsx#L516-L529)) e modifiche/eliminazioni ([NextDettaglioLavoroPage.tsx:831-898](src/next/NextDettaglioLavoroPage.tsx#L831-L898)). Sono i writer "diretti", ma vivono solo se la pagina Lavori esiste.
- **nextMezzoHardDeleteWriter.ts** ([nextMezzoHardDeleteWriter.ts:194-235](src/next/nextMezzoHardDeleteWriter.ts#L194-L235)) — cancellazione mezzo elimina anche record `@lavori` legati al mezzo.
- **nextArchivioHideWriter.ts** ([nextArchivioHideWriter.ts:24,29-32,68-100](src/next/nextArchivioHideWriter.ts#L24-L40)) — soft-hide flag `nascostoInArchivio` su `@lavori`.

---

## CAPITOLO H — Registry IA Zero-Invenzioni

### H.1 Entry registry principale
- **File:riga**: [registry.config.js:372-437](backend/internal-ai/server/lib/registry.config.js#L372-L437).
- **Nome entry**: `work.lavori`.
- **Tipo**: resolver collection (`accessMode: "exact_document"`, `boundaryEntryId: "firestore-storage-lavori-doc"`).
- **Cosa fa**: dichiara la collection `storage/@lavori` come sorgente IA con allowed fields (`id, targa, mezzoTarga, cantiere, cantiereId, stato, data, timestamp, dataInizio, dataFine, tipo, lavorazione, dataEsecuzione, dataInserimento, eseguito, gruppoId, sourceRecordId, sottoElementi, source, urgenza`), forbidden fields (`note, descrizione, messaggio, commento, testo, dettaglio, rawText, extractedText, riepilogoBreve, analisiCosti, anomalie, fornitoriNotevoli`), `viewBindings: ["Vehicle360", "Site360", "Ricerca360"]`, aliases (`lavoro.id`, `lavoro.data`, `lavoro.stato`, `lavoro.tipo`, `mezzo.targa`, `cantiere.id`, `cantiere.label`).
- **Impatto dismissione**: va rimossa o rinominata `work.manutenzioni_dafare` con punta a `@manutenzioni`.

### H.2 Entry boundary
- **File:riga**: [internal-ai-firebase-readonly-boundary.js:1156-1170](backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js#L1156-L1170) (`firestore-storage-lavori-doc`) + [internal-ai-firebase-readonly-boundary.js:484-505](backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js#L484-L505) (`FIRESTORE_LAVORI_ALLOWED_FIELDS`).
- **Tipo**: boundary read-only IA.
- **Impatto**: stesso destino del registry — va rimosso o rimappato.

### H.3 Repo understanding (mappa screens)
- **File:riga**: [internal-ai-repo-understanding.js:200-203,260-282,336-358,567-574,765-777,866-872](backend/internal-ai/server/internal-ai-repo-understanding.js#L200) — entries `next-lavori-da-eseguire`, `next-lavori-in-attesa`, `next-lavori-eseguiti`, `next-dettaglio-lavoro` con `sourcePaths` (madre + NEXT) e `safeStateProbes` (`modal-lavori-attesa`).
- **Impatto**: vanno rimosse o aggiornate.

### H.4 Runtime observer
- **File:riga**: [internal-ai-next-runtime-observer.js](backend/internal-ai/server/internal-ai-next-runtime-observer.js) — presenta riferimenti a "lavori" via grep (CAPITOLO discovery).
- **Impatto**: da verificare a livello di catalog di route.

### H.5 Chat IA view.config (frontend)
- **File:riga**: [view.config.ts:86-110,274-280](src/next/chat-ia/config/view.config.ts#L86-L110).
- **Tipo**: configurazione view IA (Site360, Vehicle360).
- **Impatto**: rimuovere/aggiornare le sezioni `site_jobs` e gli `entryBoundaryIds` con `firestore-storage-lavori-doc`.

### H.6 Chat IA — sectorFallbacks
- **File:riga**: [chat-ia/sectors/sectorFallbacks.ts:9](src/next/chat-ia/sectors/sectorFallbacks.ts#L9) — testo fallback che cita "lavori".
- **Impatto**: testo statico, va aggiornato lessicalmente.

### H.7 Chat IA — chatIaRouter (keyword)
- **File:riga**: [chatIaRouter.ts:31](src/next/chat-ia/core/chatIaRouter.ts#L31).
- **Impatto**: keyword `lavori` mantenuta per dirottare verso `manutenzioni_scadenze`; resta valida anche dopo unificazione.

### H.8 Relations attese su `@controlli_mezzo_autisti` / `@segnalazioni_autisti_tmp` / `@mezzi_aziendali` / `@autisti`
- **Verifica eseguita**: nel registry.config.js NON sono presenti `relations` esplicite tra `work.lavori` e queste collections (la relazione e' modellata applicativamente via `source.id/key` e `linkedLavoroId/linkedLavoroIds` sui record origine). 
- **Impatto**: minimo, perche non ci sono entry relations da migrare; ma esiste la responsabilita applicativa di gestire `linkedLavoroId` sui record origine (vedi F-bis.17).

---

## CAPITOLO I — cloneWriteBarrier

### I.1 Deroga corrente per `@lavori`
- **File:riga**: [cloneWriteBarrier.ts:2-7](src/utils/cloneWriteBarrier.ts#L2-L7) (path consentiti).
- **Snippet**:
  ```ts
  const LAVORI_ALLOWED_WRITE_PATHS = [
    "/next/lavori-da-eseguire",
    "/next/lavori-in-attesa",
    "/next/lavori-eseguiti",
    "/next/dettagliolavori",
  ] as const;
  ```
- **Funzione check**: [cloneWriteBarrier.ts:240-245](src/utils/cloneWriteBarrier.ts#L240-L245):
  ```ts
  function isAllowedLavoriCloneWritePath(pathname: string): boolean {
    return (
      LAVORI_ALLOWED_WRITE_PATHS.some((entry) => pathname === entry) ||
      pathname.startsWith("/next/dettagliolavori/")
    );
  }
  ```
- **Regola di ammissione**: [cloneWriteBarrier.ts:689-691](src/utils/cloneWriteBarrier.ts#L689-L691):
  ```ts
  if (isAllowedLavoriCloneWritePath(pathname)) {
    return kind === "storageSync.setItemSync" && readMetaKey(meta) === "@lavori";
  }
  ```
- **Scope alternativo per writer Home (Centro Controllo)**:
  - [cloneWriteBarrier.ts:145-151](src/utils/cloneWriteBarrier.ts#L145-L151) (`LAVORO_CREATE_ALLOWED_WRITE_PATH = "/next/centro-controllo"`, allowed keys `["@lavori","@segnalazioni_autisti_tmp","@controlli_mezzo_autisti"]`).
  - [cloneWriteBarrier.ts:520-526](src/utils/cloneWriteBarrier.ts#L520-L526) (allowance via `LAVORO_CREATE_WRITE_SCOPE`).

### I.2 Deroga corrente per `@manutenzioni`
- **File:riga**: [cloneWriteBarrier.ts:15-23](src/utils/cloneWriteBarrier.ts#L15-L23):
  ```ts
  const MANUTENZIONI_ALLOWED_WRITE_PATHS = ["/next/manutenzioni"] as const;
  const MANUTENZIONI_ALLOWED_STORAGE_KEYS = new Set([
    "@manutenzioni",
    "@inventario",
    "@materialiconsegnati",
    "@mezzi_foto_viste",
    "@mezzi_hotspot_mapping",
  ]);
  const MANUTENZIONI_ALLOWED_STORAGE_PATH_PREFIXES = ["mezzi_foto/"] as const;
  ```
- **Regola di ammissione**: [cloneWriteBarrier.ts:818-832](src/utils/cloneWriteBarrier.ts#L818-L832).

### I.3 Altre allowance correlate
- `DELETE_MEZZO_ALLOWED_STORAGE_KEYS` ([cloneWriteBarrier.ts:131-143](src/utils/cloneWriteBarrier.ts#L131-L143)) include `@lavori` per la cancellazione mezzo da Centro Controllo.
- `ARCHIVIO_HIDE_ALLOWED_STORAGE_KEYS` ([cloneWriteBarrier.ts:157-163](src/utils/cloneWriteBarrier.ts#L157-L163)) include `@lavori` per il soft-hide archivio.

### I.4 Cosa va modificato (descrizione, non implementazione)
- Rimossa pagina Lavori: rimuovere `LAVORI_ALLOWED_WRITE_PATHS`, `isAllowedLavoriCloneWritePath`, e le check correlate.
- Rimosso writer creazione lavoro centro controllo: rimuovere `LAVORO_CREATE_*` (oppure rinominare a `MANUTENZIONE_DAFARE_CREATE_*` con storage key `@manutenzioni`).
- Estendere `MANUTENZIONI_ALLOWED_STORAGE_KEYS` non e' necessario (gia copre `@manutenzioni`), ma vanno revisionate le scrutinature sui path consentiti se la creazione "daFare" parte da Centro Controllo (non da `/next/manutenzioni`).
- `DELETE_MEZZO_ALLOWED_STORAGE_KEYS`: rimuovere `@lavori` dopo migrazione storica; tenerlo durante il transitorio se rimane consultabile.
- `ARCHIVIO_HIDE_ALLOWED_STORAGE_KEYS`: rimuovere `@lavori` o tenerlo per consentire l'hide dei lavori storici migrati.

---

## CAPITOLO J — Punti aperti e domande

J.1 — **Lavori storici "eseguiti" della madre dopo dismissione NEXT (strategia 3a)**: come gestire `@lavori` lato Firestore — viene mantenuta read-only per consultazione storica? viene migrata e dismessa? viene rimossa la deroga clone barrier o lasciata in sola lettura?

J.2 — **Card "Lavori in attesa" della Home**: sostituzione 1:1 con "Manutenzioni da fare" oppure unificazione con "Scadenze" (gia presente come banner alert)?

J.3 — **PDF "Quadro manutenzioni"**: deve includere anche manutenzioni `daFare`/`programmata` o solo `eseguite`? Oggi mostra solo storico ([NextManutenzioniPage.tsx:1039-1049](src/next/NextManutenzioniPage.tsx#L1039)) — vanno aggiunti i nuovi stati o resta dedicato all'eseguito?

J.4 — **Dettaglio per record `@lavori` migrati**: read-only o convertibili in dettaglio manutenzione? Mantenere la route `/next/dettagliolavori/:id` come compat redirect o eliminare?

J.5 — **Foto/Storage record migrati**: oggi i record `@lavori` non hanno foto proprie (foto stanno su segnalazioni/controlli linkati). Ma `@manutenzioni` accede a `mezzi_foto/` path Storage tramite `MANUTENZIONI_ALLOWED_STORAGE_PATH_PREFIXES`. Va deciso se nuovi `daFare` da segnalazione devono "portarsi dietro" i `fotoUrls` della segnalazione o restano referenziati per link.

J.6 — **Lettori indiretti ALTA/CRITICA dopo dismissione**: i 7 lettori in ALTA/CRITICA (F-bis.1, 2, 3, 5, 6, 7, 8, 14, 16, 17, 18, 20) vanno: (a) repuntati a `@manutenzioni` con stato `daFare`, (b) tenuti su `@lavori` come read-only storico, oppure (c) unificati (mostrano sia storico `@lavori` che `daFare` da `@manutenzioni`)?

J.7 — **Backlink controllo/segnalazione**: si conserva `linkedLavoroId` sui record origine (con valore = id manutenzione) oppure si rinomina `linkedManutenzioneId`? Decisione impatta 3 file critici (NextHomeAutistiEventoModal, NextAutistiAdminNative, NextCentroControlloParityPage filtro `!hasLinkedLavoro`).

J.8 — **Concetto `tipo: "magazzino"` lato lavori**: oggi `@lavori` permette voci "magazzino" senza targa (es. richiesta carrelli/attrezzi). Su `@manutenzioni` esiste `tipo: "attrezzature"` e `tipo: "compressore"` ma non un concetto pulito "magazzino senza mezzo". Va deciso il mapping o lo si elimina (con rischio di perdere casistiche).

J.9 — **`gruppoId` su lavori vs assenza su manutenzioni**: oggi i lavori vengono creati a gruppi (es. un blocco di 5 voci dalla pagina Aggiungi). Manutenzioni e' uno-a-uno. Va deciso se mantenere il concetto di "gruppo manutenzione da-fare" o se ogni voce diventa una manutenzione separata.

J.10 — **Aggiornamento registry IA**: la entry `work.lavori` va rinominata in `work.manutenzioni_dafare`, va eliminata, o va lasciata su `@lavori` come archivio storico interrogabile? L'IA che oggi risponde "lavori del mezzo X" dovra rispondere "manutenzioni da fare del mezzo X"?

J.11 — **`appendNextLavoriCloneRecords` (localStorage)**: i record creati da NextAutistiAdminNative oggi vivono in `localStorage["@next_clone_lavori:records"]` (clone-only) — non sono mai stati persistiti su Firestore. Sono dati da migrare, scartare o riallineati col writer Centro Controllo (che invece scrive su Firestore)? Decisione necessaria per non perdere dati operativi.

---

## CAPITOLO K — Stima sforzo

| Blocco | Stima | Rischi principali |
|---|---|---|
| Estensione shape `@manutenzioni` con stato/origine/backlink/segnalatoDa/dataProgrammata/urgenza | **L** | Rotture lettori esistenti se i nuovi campi cambiano i normalizzatori; coordinamento con sanitizers di `nextManutenzioniDomain.ts` (numerosi); compatibilita con `readNextManutenzioniLegacyDataset` usato da Archivio Storico. |
| Migrazione dati una tantum `@lavori` → `@manutenzioni` (strategia 3a) | **L** | Conflitto `tipo` (magazzino/targa vs mezzo/compressore/attrezzature); collisione di nomi `eseguito` (bool vs string esecutore); preservazione `gruppoId`; preservazione `source.*`; idempotenza migrazione. |
| Modifica flusso NextAutistiAdminNative (controllo KO → `@manutenzioni`) | **M** | `appendNextLavoriCloneRecords` scrive solo in localStorage clone — il nuovo flusso deve scrivere o in Firestore o spostare i clone records preesistenti. |
| Modifica flusso NextAutistiAdminNative (segnalazione → `@manutenzioni`) | **M** | Stessa di sopra + gestione `linkedLavoroId` sui record segnalazione (rinomina o convivenza). |
| Modifica flusso `nextLavoroCreateWriter.ts` (modale Home Centro Controllo) | **M** | Nuovo scope clone barrier; coordinamento con `cloneWriteBarrier.ts` (scope `LAVORO_CREATE_WRITE_SCOPE`, path `/next/centro-controllo`); patch `linkedLavoroId` sui record origine. |
| Rimozione UI Lavori NEXT (route, sidebar, card Home, Dossier) | **M** | Sidebar (nextData.ts), App.tsx routes, NextDossierMezzoPage sezione + PDF, NextHomePage card alert + stat card, NextManutenzioniPage KPI. Possibile redirect compat su `/next/dettagliolavori/:id`. |
| Estensione UI Manutenzioni con tab/sezione "Da fare" e "Programmate" | **L** | Refactor `NextManutenzioniPage` (oggi solo "storico eseguito"); coordinamento con PDF "Quadro manutenzioni" (J.3). |
| Repunting lettori indiretti ALTA/CRITICA a `@manutenzioni` | **L** | 7+ moduli toccati (Home, Manutenzioni, Centro Controllo Sinottica, Dossier, Operativita Tecnica, Chat IA mezzi, Internal AI Card, PDF Dossier); rischio di doppio-conteggio durante transizione. |
| Aggiornamento registry IA Zero-Invenzioni | **M** | Entry `work.lavori` registry + boundary + view.config + repo-understanding; coordinamento con FE chat-ia. |
| Aggiornamento PDF "Quadro manutenzioni" (e PDF Dossier mezzo) | **M** | `pdfEngine.ts` accetta `lavoriInAttesa`/`lavoriEseguiti` come array — refactor del payload + branding "Manutenzioni da fare" vs "Lavori". |
| Aggiornamento `cloneWriteBarrier` | **S** | Rimozione 4 path lavori + scope `LAVORO_CREATE_*`; nessun rischio funzionale se rimozione e' coordinata col rebranding. |
| Migrazione/rimozione `@next_clone_lavori:records` (localStorage clone-only) | **S** | Vedi J.11 — rischio perdita dati per record creati offline dall'admin autisti. |
| Gestione `linkedLavoroId/linkedLavoroIds` sui record `@segnalazioni_autisti_tmp` e `@controlli_mezzo_autisti` | **M** | Filtro Centro Controllo Sinottica si basa su `!hasLinkedLavoro` (F-bis.17). Rinomina o convivenza decide stabilita di tutta l'inbox autisti. |
| Rimozione/dismissione entry `internal-ai-repo-understanding.js` per route lavori | **S** | Solo metadata IA. Nessun rischio runtime. |

---

## SERVE FILE EXTRA
Nessuno. Tutti i file necessari per chiudere i capitoli A–K e F-bis sono stati letti o esaminati via grep mirato.

---

## VERIFICHE NON ESEGUITE

1. **CAPITOLO E — conteggi reali Firestore**: l'agent non ha accesso Firestore in scrittura/lettura. Sono stati forniti gli snippet di query da eseguire lato Giuseppe (sezione E sopra).
2. **CAPITOLO E — record `@lavori` con foto/allegati su Storage**: confermato da audit del codice che nessun campo `@lavori` referenzia path Storage direttamente; le foto vivono sui record origine (`@segnalazioni_autisti_tmp.fotoUrls`, `@controlli_mezzo_autisti`). Non c'e' quindi nulla da contare lato Storage `@lavori`, salvo che si voglia verificare allegati sui record origine LINKATI a un `@lavori` (query lato Giuseppe).
3. **Numerazione precisa di chiamate `linkedLavoroId/linkedLavoroIds` sui record `@segnalazioni_autisti_tmp` e `@controlli_mezzo_autisti`**: non determinabile dal codice — richiede query Firestore (vedi snippet CAPITOLO E).

---

Audit chiuso. Tutti i capitoli A–K + F-bis sono popolati e ancorati a file:riga reali. Nessun file madre `src/pages/` letto. Nessuna patch, diff, o implementazione prodotta.

