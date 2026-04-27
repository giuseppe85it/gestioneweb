# DIARIO DECISIONI STRATEGICHE

Ultimo aggiornamento: 2026-04-23
Responsabile: Giuseppe

## Come funziona questo file

Qui vivono le decisioni strategiche prese dal proprietario del progetto. Non sono stato tecnico (quello sta nel codice). Sono scelte di prodotto e perimetro.

Regole:
- ogni decisione ha una data
- le decisioni non vengono mai corrette retroattivamente
- se cambio idea, aggiungo una nuova entry sotto con la nuova decisione e il motivo
- cosi si vede l'evoluzione del pensiero nel tempo
- il file non va tenuto allineato al codice: e un registro storico, non una fotografia del presente

## Entries

### 2026-04-23 — Mezzo360 e Autista360: non portati nella NEXT
Decisione: non porto `Mezzo360` e `Autista360` dalla madre alla NEXT.
Motivo del momento: voglio sostituirli con capability IA + chat unificata invece di replicare due pagine custom.
Status: scelta attiva ma non definitiva, Giuseppe ha dichiarato "non so quanto adesso sia conveniente".
Conseguenza per gli audit: questi due moduli NON vanno trattati come gap tecnici di migrazione, ma come moduli a obsolescenza pianificata in valutazione.

### 2026-04-23 — Dettaglio Ordine inglobato in Materiali da ordinare
Decisione: `Dettaglio Ordine` non e piu un modulo separato.
Motivo del momento: pulizia UX, tab unico piu chiaro, meno frammentazione.
Status: gia fatto nel codice. `NextDettaglioOrdinePage` e solo un redirect, la logica vive in `NextMaterialiDaOrdinarePage` + `NextProcurementReadOnlyPanel`.
Conseguenza per gli audit: negli audit futuri, `Dettaglio Ordine` NON va valutato come modulo autonomo.

### 2026-04-23 — Materiali da ordinare non ancora sistemato
Decisione: nessuna decisione di perimetro, solo presa d'atto.
Stato reale: pensavo fosse sistemato, in realta la verifica del 2026-04-23 mostra che e ancora read-only. Il `CONFERMA ORDINE` blocca le scritture con alert e le foto stanno solo in locale.
Conseguenza: resta nella lista dei gap scriventi da chiudere.

### 2026-04-23 — Materiali da ordinare NEXT chiuso al 100%
Decisione: primo modulo NEXT davvero scrivente.
Writer attivi: salvaOrdine, foto fabbisogno (upload+delete), salva dettaglio+arrivato, elimina ordine, foto dettaglio.
File toccati: src/utils/cloneWriteBarrier.ts, src/next/NextMaterialiDaOrdinarePage.tsx, src/next/NextProcurementReadOnlyPanel.tsx, storage.rules.
Storage rules deployate manualmente con firebase deploy --only storage.
Known issue accettato: file orfani su Storage se l'utente carica foto nel dettaglio e chiude senza salvare.
Conseguenza: il conteggio gap scriventi della NEXT passa da 7 a 6 con la sola chiusura di Materiali da ordinare.

### 2026-04-23 — Acquisti NEXT e alias URL di Materiali da ordinare
Decisione: presa d'atto, non nuova scelta. Acquisti NEXT non e un modulo separato.
NextAcquistiPage e un wrapper di 5 righe + NextProcurementStandalonePage fa Navigate replace a /next/materiali-da-ordinare?tab=ordini.
Writer: ereditati al 100% da Materiali da ordinare. Per effetto della chiusura odierna, Acquisti e gia scrivente senza altri interventi.
Cosa resta da testare: il flusso IA preventivi (estrazione da PDF tramite endpoint preventivo-extract) dovrebbe funzionare perche le deroghe barriera sono gia attive, ma non e stato testato nel browser il 2026-04-23. Da verificare.
Conseguenza per gli audit: il conteggio gap scriventi della NEXT passa da 6 a 5. L'audit del 2026-04-22 leggeva Acquisti come modulo autonomo, lettura errata.

### 2026-04-24 — Modulo Anagrafiche NEXT CHIUSO AL 100%
Decisione: il modulo Anagrafiche NEXT e chiuso al 100%.
Motivo del momento: doppio audit Codex + Claude Code concorde su tutti i 10 punti della checklist permanente. Build OK. Test browser di Giuseppe OK su creazione, modifica, cancellazione, refresh, schede carburante, telefoni aggiuntivi, preservazione badge/codice Fornitori. Primo modulo NEXT a unificare tre entita anagrafiche sotto un unico contenitore.
Conseguenza: Anagrafiche diventa il riferimento per i moduli NEXT scriventi anagrafici.

### 2026-04-24 — Unificazione Colleghi + Fornitori + Officine sotto /next/anagrafiche
Decisione: Colleghi, Fornitori e Officine vivono in un solo modulo NEXT a 3 tab.
Motivo del momento: decisione di design approvata da Giuseppe durante sessione di design. Un solo modulo, 3 tab, UI editoriale, modale unico riutilizzabile. Route /next/colleghi e /next/fornitori conservate come alias redirect a /next/anagrafiche?tab=... per retrocompatibilita link esterni.
Conseguenza: negli audit futuri Colleghi e Fornitori NEXT non vanno letti come moduli scriventi separati, ma come tab del modulo Anagrafiche.

### 2026-04-24 — Officine introdotta come nuova entita nativa NEXT
Decisione: Officine e una nuova entita nativa NEXT.
Motivo del momento: nella madre non esiste il concetto di Officina come entita distinta, perche era confuso dentro Fornitori. Ora e separata. Collection Firestore @officine nativa NEXT, assente nella madre. Campi: nome, telefono, telefoniAggiuntivi[], citta. Domain code D13-OFFICINE.
Conseguenza: Officine non ha parity madre da verificare, ma entra nel perimetro anagrafico NEXT.

### 2026-04-24 — Modale NextAnagraficaModal disponibile per riuso esterno
Decisione: `NextAnagraficaModal` diventa componente riutilizzabile.
Motivo del momento: componente React modale unificato per le 3 entita, con stati read/edit. Pronto per integrazione futura da Mezzi (picker autista), Materiali da ordinare (picker fornitore), Manutenzioni (picker officina). Non c'e ancora nessun consumer esterno: i picker verranno aggiunti quando si lavorera a quei moduli.
Conseguenza: i moduli futuri devono preferire questo modale invece di ricreare modali anagrafici dedicati.

### 2026-04-24 — Stato scriventi NEXT: 4 su 7 chiusi
Decisione: il conteggio degli scriventi NEXT chiusi passa a 4 su 7.
Motivo del momento: con la chiusura di oggi salgono a 4 i moduli NEXT scriventi chiusi al 100% (Materiali da ordinare, Acquisti alias, Colleghi, Fornitori) piu 1 nativo NEXT (Officine). Restano 3 da affrontare: Mezzi, Attrezzature Cantieri, Cisterna.
Conseguenza: la roadmap scriventi residua si concentra su Mezzi, Attrezzature Cantieri e Cisterna.

## Convenzioni per future entries

Template:
### YYYY-MM-DD — Titolo corto della decisione
Decisione: cosa decido
Motivo del momento: perche lo decido oggi
Status: scelta attiva / in valutazione / rivalutata
Conseguenza: cosa cambia per il codice / per gli audit / per la roadmap

### 2026-04-26 â€” Mezzi NEXT chiuso come modal nel Dossier Mezzo
Decisione: Mezzi NEXT chiuso come modal di edit dentro Dossier Mezzo, non come pagina autonoma.
Motivo del momento: Mezzi era duplicato di Dossier Lista. Le funzioni residue (modifica anagrafica + manutenzione programmata) hanno senso dentro Dossier del singolo mezzo. Path /next/mezzi diventa redirect a /next/dossiermezzi. Cancellati NextMezziPage.tsx e NextMezziDossierPage.tsx. Writer dedicato nextMezziWriter.ts. Prefisso CSS mezmod-.

### 2026-04-26 â€” storageSync scrive su Firestore
Decisione: Confermato che storageSync (src/utils/storageSync.ts) scrive su Firestore, non su localStorage del browser. Il nome e fuorviante.
Motivo del momento: Audit AUDIT_PERSISTENZA_MEZZO_NEXT_2026-04-26.md ha dimostrato che setItemSync usa doc(db, "storage", key) e setDoc su Firestore. Pattern di scrittura corretto per writer NEXT e runWithCloneWriteScopedAllowance + storageSync.setItemSync. localStorage del browser non e la sorgente.

### 2026-04-27 â€” Archivista NEXT persiste 17 campi libretto
Decisione: Archivista NEXT espanso per persistere 17 campi libretto svizzero che prima venivano persi tra UI review e scrittura record mezzo.
Motivo del momento: Audit AUDIT_ARCHIVISTA_PERSISTENZA_LIBRETTO_2026-04-26.md ha identificato che l'IA estrae 28 campi modificabili nella review, ma solo 12 venivano persistiti. I 17 campi aggiunti: nAvs, indirizzo, localita, statoOrigine, annotazioni, carrozzeria, numeroMatricola, approvazioneTipo, cilindrata, potenza, pesoVuoto, caricoUtileSella, pesoTotale, pesoTotaleRimorchio, caricoSulLetto, pesoRimorchiabile, luogoDataRilascio. Path toccati: handleArchive e applyArchivistaLibrettoVehicleUpdate in ArchivistaDocumentoMezzoBridge.tsx. Modal allineato per il campo annotazioni.

### 2026-04-27 â€” Libretto aggiorna automaticamente anagrafica mezzo
Decisione: Per il flusso libretto su mezzo esistente, l'aggiornamento dei 17 campi anagrafica e automatico, indipendente dal checkbox "Aggiorna anche i campi del mezzo dopo l'archiviazione".
Motivo del momento: Audit runtime ha mostrato che la guardia escludeva il caso libretto. Per il libretto specifico la guardia accetta sia result.status="archived" sia "skipped_same". Per altri tipi documento (fattura, DDT, preventivo, assicurazione) resta opt-in via checkbox come prima. Il libretto e autoritativo sull'anagrafica del mezzo per definizione.

### 2026-04-27 â€” Date modal Modifica Mezzo normalizzate ISO
Decisione: Tutte le date nel modal Modifica Mezzo sono normalizzate in formato ISO yyyy-MM-dd per persistenza, con calendario nativo italiano a video.
Motivo del momento: Funzione normalizeDateToIso converte all'apertura del modal i formati legacy "gg mm yyyy", "gg.mm.yyyy", "gg/mm/yyyy" in ISO. Input HTML5 type="date" gestisce automaticamente la visualizzazione localizzata. Permette ordinamento, confronto scadenze, coerenza tra punti dell'app.

### 2026-04-27 â€” Categoria e Tipo come select con fallback
Decisione: Categoria e Tipo nel modal Modifica Mezzo sono select dropdown con fallback per valori non standard, non input testo libero.
Motivo del momento: Riuso della costante esistente nextAnagraficheFlottaDomain.ts per le 11 categorie canoniche. Tipo locale al modal con valori "motrice" e "cisterna". Se il record contiene un valore non in lista, viene preservato come opzione "(non standard) X" finche l'utente non sceglie un valore canonico. Evita perdita silenziosa di dati esistenti.

### 2026-04-27 â€” Riapri review Archivista rimandato
Decisione: Aperto cantiere refactor "Riapri review" Archivista, rimandato a sessione successiva.
Motivo del momento: Oggi "Riapri review" da /next/ia/documenti porta su Archivista vuoto perche l'oggetto analysis completo non viene persistito. Va persistita l'analisi completa al primo archive + precaricata in apertura review. Audit AUDIT_RIAPRI_REVIEW_DIAGNOSI_2026-04-27.md prodotto. Cantiere copre tutti i flussi Archivista: libretto, magazzino, fatture, DDT, preventivi. Stima ~4 file per il libretto + repliche sugli altri bridge.

### 2026-04-27 â€” Mezzi NEXT CHIUSO al 100%
Decisione: Mezzi NEXT ufficialmente CHIUSO al 100%, verificato runtime su targa di test TI282780.
Motivo del momento: Tutti i 10 punti checklist verificati: barriera con deroga, storage rules, writer dedicato, persistenza Firestore confermata via dump, modal funzionante (modifica + salvataggio + eliminazione), build green, lint baseline migliorato di 1 warning. Resta come ultimo modulo scrivente NEXT da chiudere: Cisterna.
