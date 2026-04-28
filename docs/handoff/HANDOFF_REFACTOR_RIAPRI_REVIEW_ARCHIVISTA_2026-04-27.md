# HANDOFF — REFACTOR RIAPRI REVIEW ARCHIVISTA

Documento di passaggio di consegne tra chat. Da leggere PRIMA di iniziare il cantiere.

## 0. ELEVATOR PITCH

Il cantiere riguarda il comando "Riapri review" dell'Archivista NEXT: oggi la navigazione verso Archivista funziona, e per il libretto il file può essere precaricato, ma i dati estratti dalla review non vengono recuperati.

Il problema va risolto perché una review riaperta deve mostrare i campi già estratti e archiviati, non ripartire da una schermata vuota o da campi `MISSING`.

Dimensione stimata: refactor medio, multi-file, su persistenza analysis + preset + preload nei bridge Archivista; non è un semplice fix UI.

## 1. PROBLEMA REALE OSSERVATO

### 1.1 Sintomo

L'utente clicca "Riapri review" da `/next/ia/documenti`.

La pagina naviga verso `/next/ia/archivista`.

Nel caso libretto, il documento può essere scaricato e mostrato come file caricato.

La review però non recupera i campi estratti in passato.

I campi libretto risultano vuoti o mostrano `MISSING`.

Il flusso non ricostruisce lo stato della review già archiviata.

### 1.2 Cosa NON è il problema

- Non è bug del routing: Prompt 19 ha verificato che "Riapri review" porta a `/next/ia/archivista` con `location.state.archivistaPreset`.
- Non è bug del precarico file per il libretto: Prompt 21 ha verificato che il preset può portare `fileUrl` e che il bridge libretto può scaricare il file e popolare `selectedFile`.
- Non è bug del writer Mezzi: il modulo Mezzi è stato verificato runtime su targa `TI282780`, con salvataggio e persistenza Firestore confermati.
- Non è un problema di UI libretto: `NextEstrazioneLibretto` mostra ciò che riceve dal bridge; se `analysis` è `null`, non può inventare i campi.
- Non è un problema risolvibile solo da `NextIADocumentiPage`: lo storico espone `fileUrl` e metadati, ma non l'oggetto `analysis` completo.

## 2. STATO ATTUALE DEL CODICE

### 2.1 Cosa funziona già

- Bottone "Riapri review" su `/next/ia/documenti` -> naviga a `/next/ia/archivista` con `location.state.archivistaPreset` (Prompt 19).
- Per documenti tipo libretto, il preset porta `fileUrl`, `sourceDocId`, `tipoDocumento`, `targa` (Prompt 21).
- Bridge libretto scarica il file dall'URL e popola `selectedFile` (Prompt 21).
- Per Mezzi: archiviazione libretto persiste 17 campi del libretto svizzero (Prompt 17 + 26).
- `NextIADocumentiPage` ha già l'item storico corrente nel click handler "Riapri review".
- `NextIADocumentiArchiveItem` contiene già `sourceKey`, `sourceDocId`, `tipoDocumento`, `targa`, `fileUrl`, `testo`, `numeroDocumento`.
- I bridge Archivista usano già pattern locale `File -> base64 -> analisi`.
- Il reader storico globale legge le collection documentali `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`.

### 2.2 Cosa NON funziona

- L'oggetto `analysis` completo, cioè i campi estratti dall'IA durante la review, NON è persistito da nessuna parte.
- Oggi `analysis` vive nello state React del bridge durante la review.
- All'archiviazione viene salvato solo un subset di campi flat nel documento Firestore.
- All'archiviazione possono essere scritti anche campi sul record mezzo, ma quello non ricostruisce la review.
- Alla riapertura, Archivista può mostrare il file ma non può ricostruire i campi estratti.
- I campi risultano `MISSING` o vuoti perché `analysis === null`.
- Il bottone "Analizza" è disabilitato quando manca `selectedFile` o quando `analysisStatus === "loading"`.
- Il precarico file non equivale a precarico review.
- Funziona solo per il bridge libretto.
- Per Magazzino e PreventivoMagazzino il preset non viene letto dai bridge: lo Step 2 del Prompt 21 non è stato eseguito.
- Per Manutenzione e Preventivo Manutenzione, il coinvolgimento nel percorso "Riapri review" non è determinato in questa sessione, da chiarire con utente se il preset futuro li deve coprire.

## 3. CAUSA TECNICA (DA AUDIT)

### 3.1 Persistenza analisi

L'audit `AUDIT_RIAPRI_REVIEW_DIAGNOSI_2026-04-27.md` dimostra che `handleArchive` in `ArchivistaDocumentoMezzoBridge.tsx` richiede `selectedFile` e `analysis`, quindi la review esiste in memoria al momento dell'archiviazione.

Il payload passato a `archiveArchivistaDocumentRecord` salva però solo campi flat come `tipoDocumento`, `fornitore`, `numeroDocumento`, `dataDocumento`, `targa`, `telaio`, `proprietario`, `assicurazione`, `marca`, `modello`, date, `riassuntoBreve`, `testo`, `campiMancanti`, `avvisi`.

Non viene salvato un oggetto `analysis`, `extractedFields`, `extractedData`, `librettoAnalysis` o equivalente.

`archiveArchivistaDocumentRecord` carica il file su Storage, costruisce il payload con `basePayload`, aggiunge metadati Archivista e salva con `addDoc(collection(db, args.targetCollection), payload)`.

Per il libretto il target è `@documenti_mezzi`.

Separatamente, il flow può creare o aggiornare `@mezzi_aziendali`, ma quello persiste campi business del mezzo, non la review documentale.

Il reader storico `/next/ia/documenti` restituisce una shape ridotta e non espone `analysis` né raw record completo.

### 3.2 Bottone Analizza disabilitato

`NextEstrazioneLibretto` riceve `isAnalyzeDisabled` dal bridge.

La condizione esatta passata dal bridge è `!selectedFile || analysisStatus === "loading"`.

Se il preload scarica correttamente il file e imposta `selectedFile`, il bottone non è disabilitato da questa condizione.

Se il bottone resta disabilitato e non c'è loading, manca `selectedFile` oppure il preset non contieneva `fileUrl`.

I `MISSING` non dipendono dal bottone: dipendono da `analysis === null` e dal modello canonico libretto vuoto.

### 3.3 File coinvolti

Lista esatta dei file da toccare per chiudere il refactor, da audit e contesto:

1. `src/next/internal-ai/ArchivistaArchiveClient.ts` (salvataggio analysis).
2. `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx` (precarico analysis + fallback).
3. `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx` (replicare pattern libretto).
4. `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx` (replicare pattern libretto).
5. `src/next/domain/nextDocumentiCostiDomain.ts` (lettura analysis dallo storico, shape `NextIADocumentiArchiveItem`).
6. `src/next/NextIADocumentiPage.tsx` (eventuale propagazione preset esteso, già preparato per libretto).

Nota: `src/next/NextIAArchivistaPage.tsx` è punto di passaggio preset -> bridge e può essere necessario nella SPEC, anche se non compare nella lista stretta sopra.

## 4. AUDIT GIÀ DISPONIBILI

Lista degli audit pronti, da leggere PRIMA di iniziare:

- `docs/audit/AUDIT_RIAPRI_REVIEW_DIAGNOSI_2026-04-27.md` — diagnosi principale, 354 righe.
- `docs/audit/AUDIT_ARCHIVISTA_PRESET_DOCUMENT_LOAD_2026-04-27.md` — opzioni di precarico, 184 righe.
- `docs/audit/AUDIT_ARCHIVISTA_PERSISTENZA_LIBRETTO_2026-04-26.md` — contesto persistenza correlata, 586 righe.
- `docs/audit/AUDIT_PROMPT_17_RUNTIME_GAP_2026-04-27.md` — diagnosi guardia `skipped_same` (riferimento).
- `docs/audit/AUDIT_VERSIONE_MIGLIORE_RUNTIME_GAP_2026-04-27.md` — analisi flusso "versione migliore" duplicati.

Audit 2026-04-27 presenti nel repo al momento di questo handoff:

- `AUDIT_ARCHIVISTA_PRESET_DOCUMENT_LOAD_2026-04-27.md`
- `AUDIT_PROMPT_17_RUNTIME_GAP_2026-04-27.md`
- `AUDIT_RIAPRI_REVIEW_DIAGNOSI_2026-04-27.md`

`AUDIT_VERSIONE_MIGLIORE_RUNTIME_GAP_2026-04-27.md` è citato come audit disponibile dal contesto utente; non è stato trovato nell'elenco `docs/audit/*2026-04-27*` di questa sessione, quindi la sua presenza è non determinata in questa sessione, da chiarire con utente.

## 5. DECISIONI VINCOLANTI GIÀ PRESE

Riportare queste decisioni come vincoli. Se nuove decisioni emergono, vanno discusse; queste no.

- D1: il refactor copre TUTTI i flussi Archivista (libretto, magazzino, fatture, DDT, preventivi), non solo libretto.
- D2: salvataggio analysis va persistito in Firestore, accanto al documento archiviato (shape esatta = parte del lavoro di SPEC).
- D3: per archivi vecchi (record già esistenti senza analysis salvata), fallback = rianalisi automatica al precarico file.
- D4: per archivi nuovi (da qui in avanti), apertura "Riapri review" mostra subito i campi precaricati senza richiedere clic su Analizza.
- D5: SPEC obbligatoria prima dell'implementazione (vedi sezione 7).
- D6: niente refactor della UI di review (NextEstrazioneLibretto e simili). Si tocca solo persistenza + load.

## 6. PIANO OPERATIVO PROPOSTO

Step in ordine. La chat nuova li può confermare o rinegoziare con l'utente prima di partire.

### Step 1 — Audit complementare (se serve)

Verificare se gli audit esistenti coprono tutti i bridge coinvolti.

Se la chat nuova trova lacune, fare un mini-audit mirato.

Non rifare audit già coperti.

### Step 2 — SPEC unificata

Redigere `docs/product/SPEC_ARCHIVISTA_RIAPRI_REVIEW.md` che definisce:

- Shape persistita di `analysis` per ogni tipo documento.
- Punto di salvataggio (`handleArchive` di ognuno dei bridge).
- Punto di lettura (preset esteso -> bridge mount -> popolamento state).
- Fallback per `analysis` assente (rianalisi automatica).
- Backward compatibility per archivi vecchi.
- Tracciamento source: `sourceKey`, `sourceDocId`, `fileUrl`, `tipoDocumento`, `targa`.
- Regole per duplicati e "versione migliore".

Verifica con Codex (divergenze = 0) prima di consegnare.

### Step 3 — Implementazione bridge libretto

Modifiche a `ArchivistaDocumentoMezzoBridge.tsx` + `ArchivistaArchiveClient.ts`.

Obiettivo minimo: nuovo archivio libretto salva `analysis`; riapertura libretto nuovo ricarica file + analysis; vecchio archivio senza analysis rianalizza automaticamente.

Test runtime su `TI282780`.

### Step 4 — Implementazione altri bridge

Replicare pattern su:

- `ArchivistaMagazzinoBridge.tsx`
- `ArchivistaPreventivoMagazzinoBridge.tsx`

Valutare in SPEC se includere subito anche:

- `ArchivistaManutenzioneBridge.tsx`
- `ArchivistaPreventivoManutenzioneBridge.tsx`

Il coinvolgimento dei due bridge manutenzione è non determinato in questa sessione, da chiarire con utente.

### Step 5 — Test runtime per ogni tipo documento

Riarchiviare almeno un documento per ogni tipo:

- libretto
- fattura
- DDT
- preventivo
- magazzino

Poi usare "Riapri review" e verificare:

- file precaricato
- dati precaricati
- nessun `MISSING` causato da analysis assente
- nessun clic su Analizza richiesto per archivi nuovi
- fallback rianalisi automatica per archivi vecchi

### Step 6 — Cleanup eventuale

Rimuovere debug temporanei.

Aggiornare `DIARIO_DECISIONI.md` se emergono decisioni nuove.

Aggiornare stato/documenti live pertinenti solo se richiesto dalle regole operative del repo.

## 7. REGOLE DI LAVORO STABILITE

Riportare le regole concordate nella chat precedente, attenendosi a queste anche nella nuova chat.

- Architetto di prompt per Codex: Claude scrive prompt, non scrive codice.
- Ogni prompt Codex inizia con ">>> DA INCOLLARE IN: Codex" e contenuto in fence `~~~`.
- Brief prima del prompt con: fonte primaria, tipo task, rischio, modello, livello ragionamento.
- Backup obbligatorio prima di modifiche a file critici.
- Check oggettivi build + lint baseline + grep di sicurezza/presenza/regressione obbligatori.
- Test runtime obbligatorio per qualunque patch su flussi di scrittura: build/lint/grep da soli non bastano.
- Audit "sola lettura" preferiti prima di patch quando ci sono incertezze.
- Doppio audit (Codex + Claude Code) solo per chiusura ufficiale modulo o sospetto fondato.
- Una SPEC esistente è autorità: se diverge dal codice, va corretta la SPEC, non il codice in silenzio.
- Niente "probabilmente": se un dato non è dimostrabile, dichiararlo come "non determinato".
- Se Claude trova un'inconsistenza tra il proprio messaggio precedente e il codice/audit reale, deve segnalarla esplicitamente all'utente.
- Quando Claude commette un errore, lo dichiara apertamente senza minimizzare.
- Memory userMemories è satura (max raggiunto). Le decisioni nuove del cantiere vanno annotate dal Diario, non dalla memoria.

## 8. VINCOLI DI PERIMETRO

- Non toccare il modal `NextMezzoEditModal` (modulo Mezzi è chiuso al 100%, intoccabile).
- Non toccare il writer `nextMezziWriter.ts`.
- Non toccare la barriera `cloneWriteBarrier.ts` (deroghe già pulite).
- Non toccare le storage rules.
- Non toccare il type `Mezzo`.
- Non toccare la UI di review (`NextEstrazioneLibretto` resta com'è).
- Non rimuovere la barriera anche se l'utente lo chiede in momenti di frustrazione (rete di sicurezza + mappa documentale).
- Non modificare codice madre.
- Non introdurre writer nuovi fuori dal perimetro Archivista.
- Non cambiare la semantica dei documenti già archiviati senza fallback retrocompatibile.

## 9. DOMANDE APERTE PER L'UTENTE

Punti su cui la chat nuova deve chiedere chiarimento all'utente prima di partire, perché non risolvibili da audit.

- Shape persistita di `analysis`: struttura piatta nel record documento o incapsulata in subobject. Decidere con utente.
- Nome chiave Firestore per la review persistita: `analysis`, `archivistaAnalysis`, `reviewAnalysis` o altro. Non determinato in questa sessione, da chiarire con utente.
- Messaggio mostrato per archivi vecchi: rianalisi automatica silenziosa o messaggio utente "sto rianalizzando il documento archiviato". Decidere con utente.
- Ambito dei bridge manutenzione: includerli subito oppure lasciarli fuori perché oggi `buildArchivistaPreset` non produce contesto manutenzione. Non determinato in questa sessione, da chiarire con utente.
- Audit `AUDIT_VERSIONE_MIGLIORE_RUNTIME_GAP_2026-04-27.md`: indicato dal contesto utente, ma non trovato nell'elenco audit 2026-04-27 di questa sessione. Chiarire se il file esiste altrove o se va prodotto.

## 10. CONTATTI / NOTE

- Targa di test conferma per Mezzi: `TI282780` (libretto già archiviato + record completo dei 17 campi).
- Pattern persistenza NEXT: `runWithCloneWriteScopedAllowance` + `storageSync.setItemSync` (Firestore-only nonostante il nome).
- Memorie utente: sature. Riferimento per stato moduli scriventi: questo handoff.
- Audit principale da cui partire: `docs/audit/AUDIT_RIAPRI_REVIEW_DIAGNOSI_2026-04-27.md`.
- Audit di preload da cui partire: `docs/audit/AUDIT_ARCHIVISTA_PRESET_DOCUMENT_LOAD_2026-04-27.md`.
- Audit di contesto libretto: `docs/audit/AUDIT_ARCHIVISTA_PERSISTENZA_LIBRETTO_2026-04-26.md`.
- Stato operativo del problema: il file può essere precaricato, la review no.
- Regola sintetica: salvare `analysis` quando si archivia, leggerla quando si riapre, rianalizzare solo se manca.
