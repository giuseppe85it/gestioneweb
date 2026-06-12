# DIARIO DECISIONI STRATEGICHE

Ultimo aggiornamento: 2026-06-08 (maratona risanamento segnalazioni/gomme + ripristino deploy Vercel)
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

### 2026-04-29 — Pulizia IA NEXT: hub vecchio e config Gemini rimossi
Decisione 1: cancellate dal NEXT le pagine `NextIntelligenzaArtificialePage` (hub IA vecchio) e `NextIAApiKeyPage` (config API Key Gemini).
Motivo: sostituite rispettivamente da `HomeInternalAiLauncher` + `NextInternalAiPage`, e il NEXT non usa piu Gemini ma backend OpenAI proprio.
Decisione 2: tenute vive `NextIALibrettoPage` (archivio libretti + deeplink Dossier) e `NextIACoperturaLibrettiPage` (vista aggregata copertura flotta + probe URL rotte).
Motivo: sono funzionalita uniche non coperte da Archivista.
Decisione 3: rimossi i riferimenti orfani in App.tsx, nextStructuralPaths.ts, nextData.ts, nextCloneNavigation.ts, NextCentroControlloPage.tsx, NextIALibrettoPage.tsx (bottone API Key), NextLibrettiExportPage.tsx (retarget bottone hub IA -> /next), 2 file backend diagnostici, 1 script screenshot.
Nota di principio: madre intoccata, file `.bak` non toccati (sono backup di filesystem, non runtime), doc storica/audit datata non toccata (cronologia, mai correzione retroattiva).
Conseguenza: il perimetro IA NEXT runtime si riduce a `HomeInternalAiLauncher` + `NextInternalAiPage` + le due pagine libretto/copertura.

### 2026-04-30 — Sidebar NEXT: cleanup totale e auto-close persistente
Decisione: la sidebar NEXT viene normalizzata su 3 punti. (1) Auto-close al click su una voce di navigazione, sia mobile sia desktop. (2) Stato collassato/aperto persistito in `localStorage` con chiave `next.sidebar.collapsed`, default chiusa al primo accesso. (3) Rimozione di 5 voci: "Motrici e trattori" (duplicato di "Dossier mezzo"), "Rimorchi" (disabled mai attivata), "Impostazioni" (disabled mai attivata), "Unisci documenti" (modulo non più utilizzato), "Mezzi aziendali" (duplicato che redirige a "Dossier mezzo").
Motivo: la sidebar accumulava voci morte, duplicati e modali che si aprivano da soli al refresh. La normalizzazione riduce attrito utente, elimina punti di confusione e rende la sidebar una mappa dei moduli realmente attivi.
Conseguenza: sezioni vuote "Strumenti" e "Sistema" rimosse perché senza voci. Modulo "Unisci documenti" eliminato completamente (route + pagina + tool + helper PDF + store) — non era usato da nessun altro componente. Voce "Mezzi aziendali" rimossa solo dalla sidebar; la route `/next/mezzi` resta attiva come alias interno usato da chat IA, sync clone, Centro Controllo legacy mapping (non è più voce utente, è infrastruttura).

### 2026-04-30 — Modulo "Scadenze Collaudi" NEXT scrivente reale
Decisione: il flusso revisioni / prenotazioni collaudo / pre-collaudo del NEXT diventa un modulo pagina scrivente reale chiamato "Scadenze Collaudi" alla route `/next/scadenze-collaudi`. Sostituisce il modale `NextScadenzeModal` (read-only) e i 3 modali duplicati in `NextCentroControlloPage.tsx` (revisione, prenotazione, pre-collaudo, anch'essi read-only). Il writer dedicato `nextScadenzeCollaudiWriter.ts` espone 3 funzioni — `setPrenotazioneCollaudo`, `setPreCollaudo`, `markRevisioneCompletata` — che persistono su `@mezzi_aziendali` con shape 1:1 rispetto alla madre `src/pages/Home.tsx`. Scope barrier dedicato `scadenze_collaudi_write_scope` con deroga minima in `cloneWriteBarrier.ts` (una sola route, una sola storage key, no fetch endpoint, no delete).
Motivo: il modale validava i form ma non scriveva (mostrava sempre "Clone NEXT in sola lettura"). Avere lo stesso flusso duplicato in 3 modali read-only di Centro Controllo accentuava il problema. Centralizzare le 4 azioni su una sola pagina scrivente elimina drift e doppia manutenzione, rende l'URL condivisibile, abilita scroll naturale e gerarchia visiva coerente con altri moduli NEXT chiusi.
Conseguenza: ~480 righe di codice morto rimosse da `NextCentroControlloPage.tsx`. Card home reindirizzata alla nuova pagina (logica `buildHomeAlertBanner` invariata). Voce sidebar rinominata "Scadenze Collaudi" con path dedicato. UI rifatta su mockup approvato: card mezzo con bordo sinistro colorato per stato, pannelli operazione inline (no modale), autocomplete su anagrafica officine (`@officine` via `readNextOfficineSnapshot`), targa cliccabile verso dossier mezzo (`buildNextDossierPath`). Aggiunto nuovo campo opzionale `lavoriPrevisti` nel pre-collaudo (campo libero, persiste solo se valorizzato).

### 2026-04-30 — Pattern riconfermato: voci/route duplicate sono debito, non scelte
Decisione: in caso di voci sidebar duplicate, modali read-only che simulano scrittura, o route che esistono solo come redirect a un'altra route già esposta, il default è la rimozione, non la conservazione difensiva. Il barrier di scrittura (`cloneWriteBarrier.ts`) e la sidebar sono mappe vive del NEXT: ogni voce e ogni eccezione devono corrispondere a un modulo realmente attivo e necessario. Le route legacy possono restare attive come alias di infrastruttura SOLO se usate da componenti reali (chat IA, sync clone, redirect URL pubblici); se l'unico chiamante è la sidebar, la route va rimossa con la voce.
Motivo: il debito UX cresce silenziosamente quando i duplicati restano "perché magari servono". L'audit di oggi ha confermato che 5 voci sidebar e 3 modali interi a Centro Controllo non erano più funzionali da tempo. Rimuoverli ha ridotto la superficie di codice e semplificato il modello mentale degli utenti.
Conseguenza: il check su "voci doppie" e "modali read-only zombie" entra negli audit periodici dei moduli NEXT. La distinzione tra "voce utente" e "alias infrastruttura" è ora esplicita: la prima va in sidebar, la seconda no, anche se entrambe usano una route attiva.


### 2026-05-04 — Chat IA NEXT: modalita Zero-Invenzioni IA
Decisione: la Chat IA NEXT entra in modalita Zero-Invenzioni IA. L'LLM perde il permesso tecnico di scrivere dati business nell'output verso l'utente (targhe, nomi, date, importi, codici, relazioni, riassunti narrativi sui dati). L'LLM puo solo: capire la richiesta, classificare intent, scegliere vista, produrre `searchText`/`entityKind`/`periodPreset`, chiedere disambiguazione tramite flag, accompagnare con frasi parametriche da whitelist. L'LLM non produce `driverId`, `vehiclePlate`, `siteId`, date finali o `displayLabel`; questi vengono risolti e popolati dal backend in `resolvedFilters` o nei candidati certificati. Lo schema strict OpenAI viene riscritto eliminando il campo text libero; sostituito da accompaniment con kind enum e params. Il catalogo intent diventa file versionato (src/next/chat-ia/intent-catalog.json). I 59 tool del registry restano (vengono declassati a reader interni delle viste). Multi-agente specialisti smantellati. Fingerprint validator declassato a guardrail di regressione. Sequenza: Driver360 -> Vehicle360 -> Site360 -> Euromecc360 -> Ricerca360 -> smantellamento multi-agente -> PDF da template. Riferimento: docs/product/SPEC_CHAT_ZERO_INVENZIONI_NEXT.md.
Motivo: il buco architetturale documentato dall'audit del 2026-04 e dal test tests/e2e/12-fingerprintIntegrity.spec.ts:97-130 mostra che lo schema strict attuale ammette text libero su dati e che il fingerprint validator non ispeziona text. La difesa attuale e' incentivante (system prompt) ma non strutturale. Il rischio di invenzione (es. caso Sandro -> TI313387 inventata) resta latente. La modalita Zero-Invenzioni sposta la difesa dal prompt allo schema strict + Catalog Validator + rendering certificato. La garanzia diventa imposta dall'architettura, non dal comportamento dell'LLM.
Conseguenza: schema strict riscritto (internal-ai-adapter.js:675-819), system prompt riscritto (831-884), validator fingerprint declassato (lib/fingerprint-validator.js), rendering testo libero rimosso (ChatIaMessageItem.tsx:200-204), nuove cartelle src/next/chat-ia/views/ e src/next/chat-ia/relations/, catalogo intent versionato, viste certificate Driver360/Vehicle360/Site360/Euromecc360/Ricerca360 da implementare in fasi successive. PDF da template, mai dal LLM. `relationProof` obbligatorio per relazioni critiche e opzionale per relazioni informative. Multi-agente smantellati in fase 5.

### 2026-05-04 — Regola esplorazione prima di asserzione
Decisione: adottata come regola permanente la "Esplorazione prima di asserzione". Prima di dichiarare che un dato business non esiste, non e' disponibile, che un campo non e' presente, che una relazione non e' certificata o che un `relationProof` non e' producibile, l'agente deve eseguire una verifica esplorativa Firestore in sola lettura entro il boundary readonly autorizzato e riportarne l'esito. Se credenziali o boundary non permettono la verifica, l'agente non puo' confermare l'assenza del dato e deve dichiarare che la verifica non e' eseguita.
Motivo: il caso Driver360 su Sandro Calabrese ha mostrato il rischio operativo. Era stato dichiarato che TI282780 non era disponibile/certificabile, ma il dato emerso dallo screenshot del modulo Dettaglio Sessione indica una sessione attiva per Sandro Calabrese, badge 530, con motrice TI180147 e rimorchio TI282780, ultimo update 23/04/2026 21:42. Questo dimostra che prima di asserire assenza o non certificabilita' bisogna esplorare Firestore entro il boundary readonly e distinguere tra dato assente e dato presente in fonte non ancora usata dal resolver.
Conseguenza: la regola entra nel protocollo operativo del repo (`AGENTS.md`) con riferimento incrociato nel protocollo sicurezza modifiche. L'estensione del boundary readonly o l'aggiunta di nuove regole al Relation Resolver resta decisione del project owner, non dell'agente. Gli audit e le fasi future devono riportare cosa e' stato cercato, dove, con quali limiti, cosa e' stato trovato e cosa resta da verificare.

### 2026-05-04 — Registro Collection Firestore come mappa unica
Decisione: adottare `docs/product/REGISTRO_COLLECTION_FIRESTORE.md` come mappa unica del gestionale, includendo data dictionary, evidence graph e convenzioni di provenance.
Motivo del momento: evitare hardcode caso-per-caso, rendere scalabili le viste future, allineare il sistema al principio Zero-Invenzioni e preparare il pannello laterale "Perche' vedo questo dato?".
Conseguenza: viste, motore generico e pannello laterale leggeranno o si allineeranno al registro. Quando la struttura Firestore cambia, si aggiorna il registro invece di distribuire conoscenza implicita nel codice. Stato attuale: BOZZA v0.1, in attesa di validazione utente.

### 2026-05-04 — Registro Collection Firestore v0.2 validato parzialmente
Decisione: validazione parziale del `REGISTRO_COLLECTION_FIRESTORE.md`: 7 conferme, 3 conferme con riserva e 3 integrazioni di precisione. Le integrazioni fissano vincoli boundary read-only/field-filtered, distinzione campi strutturati vs campi liberi nelle collection TMP e obbligo del pannello "Perche' vedo questo dato?" per ogni relazione mostrata nelle viste certificate.
Motivo del momento: chiusura della BOZZA v0.1 dopo audit Codex e revisione utente, con rifiniture suggerite da review GPT esterna.
Conseguenza: il registro entra in v0.2 BOZZA, utilizzabile come riferimento per il motore generico ma con 3 voci marcate DA VERIFICARE RUNTIME: R2 categoria mezzo, R4 chiave materiale, R5 chiave fornitore. Prossimo passo: estensione boundary readonly per le 33 collection code-only (read-only + field-filtered), poi runtime check delle 3 riserve, poi v1.0 STABLE.

### 2026-05-04 — Boundary readonly esteso a 38 collection
Decisione: estensione boundary readonly a 33 collection code-only, con pattern read-only + field-filtered.
Motivo del momento: portare il Registro Collection Firestore v0.2 in posizione operativa per il motore generico data-driven e preparare la chiusura delle 3 riserve R2/R4/R5 nel runtime check successivo.
Conseguenza: il registro passa a v0.3 BOZZA. Le 33 collection sono leggibili dal backend Zero-Invenzioni con campi filtrati; i campi sensibili sono esclusi by design. Runtime check Firestore in prompt successivo.

### 2026-05-04 — Runtime check Registro Collection Firestore v0.4
Decisione: eseguito runtime check sulle 33 collection BOUNDARY OPEN del Registro Collection Firestore e chiuse le riserve R2/R4/R5 con dati reali.
Motivo del momento: completare la validazione del registro prima di costruire il motore generico data-driven e il pannello "Perche' vedo questo dato?".
Conseguenza: il registro passa a v0.4 BOZZA. Le discrepanze runtime restano da chiudere in prompt successivi mirati. R2, R4 e R5 risultano DA RIVEDERE: `categoria` mezzo ha anche campo `tipo`; la chiave materiale `codice + nome` non e' comune alle collection; la chiave fornitore `nome` non e' canonica unica rispetto agli id presenti in ordini/preventivi.

### 2026-05-04 — Registro Collection Firestore v0.5: alias e boundary separati
Decisione: chiusura discrepanze runtime + introduzione sezione "Alias e ricerca flessibile" nel registro + dichiarazione esplicita della separazione alias/boundary.
Motivo del momento: rendere il registro v0.5 base operativa per il motore generico data-driven, con regole di match flessibili sui nomi di campo e rigide sui valori critici (Zero-Invenzioni). Mantenere la sicurezza separando mappa concettuale (alias) da accesso effettivo (allowedFields).
Conseguenza: motore generico potra' leggere alias e regole match dal registro. Le riserve R2/R4/R5 restano PARZIALMENTE CHIUSE con regole di priorita', non chiuse definitivamente. Indebolire la separazione alias/boundary richiede nuova voce di diario.

## 2026-05-04 — Decisioni post-audit copertura modali (PROMPT 20)

### Decisioni operative

1. **Root collection documentali sostituiscono `storage/@documenti_*`**
   - `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici` sono root collection nel codice reale.
   - Il registro v0.5 le descrive erroneamente come documenti `storage/@documenti_*`.
   - Decisione: aggiornare registro e boundary alla forma root collection, allinearsi al codice reale.
   - Applicazione: prompt successivo dedicato (chat nuova).

2. **Cisterna entra nel motore generico v1**
   - `@documenti_cisterna`, `@cisterna_schede_ia`, `@cisterna_parametri_mensili` vanno aggiunte al registro.
   - Sono modulo attivo del gestionale, non possono restare fuori scope.
   - Solo campi strutturati e path tecnici. URL firmati esclusi by design.
   - Applicazione: prompt successivo (chat nuova).

3. **`chat_ia_reports` escluso formalmente dal motore generico**
   - E' archivio tecnico dei report generati dalla chat IA.
   - Non e' dato di business, non va letto dal motore.
   - Va dichiarato come "escluso by design" nel registro.
   - Applicazione: prompt successivo (chat nuova).

4. **Foto come esistenza nel pannello prove**
   - Il pannello "Perche' vedo questo dato?" deve poter dire "esiste foto X di questo mezzo".
   - Path tecnici (`fotoStoragePath`, `fotoPath`, `photoStoragePath`) ammessi negli allowedFields.
   - URL firmati (`fotoUrl`, `photoUrl`, `downloadUrl`) restano esclusi.
   - Applicazione: prompt successivo (chat nuova).

5. **`@analisi_economica_mezzi` escluso dal motore generico**
   - La collection contiene narrativa IA salvata da `AnalisiEconomica.tsx`.
   - Narrativa IA viola il principio Zero-Invenzioni se letta come fonte certificata.
   - Va dichiarata "esclusa by design" nel registro, motivata.
   - Applicazione: prompt successivo (chat nuova).

6. **`stamped/*` (PDF timbrati Cloud Function) fuori scope motore v1**
   - La Cloud Function `stamp_pdf` produce file timbrati senza referenza Firestore.
   - E' funzione legacy, si valuta in fase successiva quando servira'.
   - Va dichiarata "legacy, fuori scope motore generico v1" nel registro.
   - Applicazione: prompt successivo (chat nuova).

7. **Coordinate hotspot (`x`, `y`, `areaId`, `uploadedAt`) ammesse nel motore**
   - Servono al pannello prove per spiegare dove e' la foto del mezzo.
   - Sono dati strutturati non sensibili.
   - Vanno aggiunti agli allowedFields di `@mezzi_foto_viste` e `@mezzi_hotspot_mapping`.
   - Applicazione: prompt successivo (chat nuova).

### Stato del progetto al 2026-05-04 fine giornata

- Fase 1 Zero-Invenzioni: chiusa.
- Fase 2 Driver360: implementata, fix Sandro pending.
- Registro Firestore: v0.5 BOZZA con alias e separazione alias/boundary.
- Boundary readonly: 38 collection field-filtered.
- Runtime check 33 collection: completato, 22 discrepanze chiuse, 5 vuote, 5 non trovate.
- Riserve R2/R4/R5: parzialmente chiuse con regole di priorita'.
- Audit copertura modali: completato (PROMPT 20). 9 NON COPERTE, 25 PARZIALI, 8 OK.
- Decisioni post-audit: 7 prese (vedi sopra), in attesa di patch nella chat nuova.

### Roadmap residua

1. Prompt patch lacune audit (chiude le 7 decisioni di sopra) — chat nuova
2. Prompt motore generico data-driven (Resolver universale + vista generica + pannello "Perche' vedo questo dato?")
3. Prompt fix caso Sandro end-to-end (motrice + rimorchio visibili)
4. Prompt cleanup multi-agente residuo
5. Prompt PDF report da template

### 2026-05-04 — Patch `collection_root` assorbita nel motore generico v1
Decisione: la patch del resolver runtime per consumare entry boundary con accessMode `collection_root` non viene fatta in isolamento. Viene assorbita nella spec del motore generico v1.
Motivo del momento: l'audit PROMPT 24a ha dimostrato che `backend/internal-ai/server/lib/post-llm-resolver.js` e' un resolver Driver360-specifico, non generico. La shape `resolvedFilters` (`backend/internal-ai/server/lib/post-llm-resolver.js:147-155`) e' progettata per single-record (solo `driverId`). Il branch operativo (`:270-279`) ritorna `not_driver360` per qualsiasi vista diversa. Aggiungere `collection_root` qui significherebbe inventare una shape collettore multi-record che andrebbe poi rifatta quando arriva il motore generico. Si evita il doppio lavoro.
Status: scelta attiva.
Conseguenza: il prossimo passo e' la spec del motore generico v1 (`docs/product/SPEC_MOTORE_GENERICO_NEXT.md`, da scrivere), che dovra' definire: Resolver multi-vista, shape collettore multi-record, vista generica data-driven, pannello "Perche' vedo questo dato?", relazione con Driver360 esistente (assorbimento o coesistenza). L'attivazione delle 6 entry boundary root collection (`@documenti_*` x3, Cisterna x3) e il risveglio delle 6 entry Euromecc oggi dormienti diventano feature naturali del motore generico, non patch separate.

### 2026-05-09 — Centro Controllo NEXT come torre di controllo operativa
Decisione: trasformare il Centro Controllo da report read-only a sistema operativo dove si VEDE e si AGISCE (sblocchi scrittura progressivi).
Motivo: senza azioni il CC obbligava a entrare in pagine sparse per chiudere segnalazioni, marcare evase richieste, ecc. La torre di controllo riduce attrito quotidiano.
Status: attiva.
Conseguenza: 4 nuovi scope barrier introdotti (RICHIESTE_WRITE_SCOPE, SEGNALAZIONI_WRITE_SCOPE, CONTROLLI_WRITE_SCOPE, DELETE_MEZZO_WRITE_SCOPE). Estensione di INTERNAL_AI_MAGAZZINO_INLINE_SCOPE per @mezzi_aziendali da /next/centro-controllo.

### 2026-05-09 — Sinottica Flotta V2 stile Design isolato sotto scope (strada C)
Decisione: la Sinottica V2 usa stile Claude Design al 100% (IBM Plex, palette paper/ink) isolato sotto `.cc-sinottica-scope-v2`. Altri tab del Centro Controllo restano in stile warm/beige.
Motivo: Sinottica è la vista più importante, merita leggibilità enterprise. Altri tab rifaremo in stile Design in futuro.
Status: attiva, "isola estetica" accettata come passaggio intermedio.
Conseguenza: file CSS dedicato `src/next/components/sinottica-flotta-v2-design-tokens.css` (~640 righe). Mockup salvato in `docs/design-mockups/sinottica-flotta/`.

### 2026-05-09 — Soft-delete pattern per segnalazioni/controlli/richieste
Decisione: marcare chiuse (segnalazioni/controlli) o evase (richieste) NON cancella il record. Aggiunge campi chiusa/chiuso/evasa = true + dataChiusura/dataEvasione + chiusa_by/chiuso_by/evasa_by.
Motivo: traccia conservata, pattern additivo, niente deroghe barrier distruttive.
Status: attiva.
Conseguenza: 3 writer NEXT dedicati: `src/next/nextRichiesteAttrezzatureWriter.ts`, `src/next/nextSegnalazioniWriter.ts`, `src/next/nextControlliWriter.ts`. Reader `src/next/domain/nextAutistiDomain.ts` esteso con default false.

### 2026-05-09 — Hard-delete mezzo con doppia conferma
Decisione: i mezzi venduti/eliminati possono essere cancellati TUTTI insieme (anagrafica + rifornimenti + manutenzioni + lavori + segnalazioni + controlli + richieste + gomme + sessioni) tramite gesto nascosto (Shift+click foto) + modale conferma con scrittura targa esatta.
Motivo: serve per pulire mezzi venduti che sporcano la flotta. UX nascosta per ridurre rischio di click accidentale.
Status: attiva, IRREVERSIBILE.
Conseguenza: `DELETE_MEZZO_WRITE_SCOPE` con whitelist 11 storage keys. Writer `src/next/nextMezzoHardDeleteWriter.ts`.

### 2026-05-09 — Toggle contratto manutenzione attivo / non rinnoviamo
Decisione: nuovo campo `manutenzioneContrattoAttivo: boolean` su `@mezzi_aziendali`. Default true. Se false: la pill diventa "NON ATTIVO" grigia, mezzo non conta più in KPI Manut. scadute, nessun bordo critical.
Motivo: se l'azienda decide di non rinnovare il contratto di assistenza, il mezzo non deve generare allarmi.
Status: attiva.
Conseguenza: `NextMezzoEditModal` esteso con checkbox. Modificabile dal click cella Contratto manut. nella Sinottica.

### 2026-05-09 — Cronologia mezzo via @storico_eventi_operativi
Decisione: per ogni mezzo è consultabile una cronologia delle sessioni (chi l'ha agganciato/sganciato, quando). Apertura: click sulla foto del mezzo nella Sinottica.
Motivo: visibilità storica utile per audit operativi.
Status: attiva.
Conseguenza: reader `src/next/domain/nextSessioniStoricoDomain.ts` + modale `NextMezzoCronologiaModal.tsx` (~295 righe). Frasi naturali ("X ha lasciato A e preso B") invece di "INIZIO_ASSETTO / CAMBIO_ASSETTO" tecnico.

### 2026-05-09 — Eliminazione tab Manutenzioni programmate dal Centro Controllo
Decisione: il tab "Manutenzioni programmate" sotto la sinottica è ridondante (info già nella pill Contratto manut.). Rimosso solo rendering JSX, loader/state `scheduledMaintenances` preservati per AnalisiModal.
Motivo: ridurre rumore, la sinottica V2 è ora la fonte unica di stato contratto.
Status: attiva.
Conseguenza: ~150 righe rimosse da parity.

### 2026-05-09 — Eliminazione tab Richieste attrezzature dal Centro Controllo
Decisione: stesso pattern del precedente. Tab UI rimosso, `richiesteRows` preservato per chip Sinottica V2.
Motivo: ridondanza.
Status: attiva.
Conseguenza: ~75 righe rimosse.

### 2026-05-11 — Pattern propagazione campi soft-delete (memo critico)
Decisione: per ogni nuovo campo aggiunto al tipo reader (`NextAutistiXxxSectionItem`), propagare ESPLICITAMENTE sia nel tipo parity Row (`XxxRow`) sia nella funzione mapper (`mapXxxRow`). Dimenticarne uno = bug silente.
Motivo: bug emerso in PROMPT 27.10/27.11 — Marca chiusa scriveva su Firestore correttamente, ma il filtro Sinottica leggeva undefined su campo non propagato, risultato: scrittura ok ma UI non aggiornava.
Status: regola permanente.
Conseguenza: ogni futuro sblocco scritture deve seguire questo pattern. PROMPT 27.12 ha consolidato il fix.

### 2026-05-11 — Audit badge "ASSE X da verificare" cella Gomme Sinottica (memo)
Decisione: il badge è dichiarato nel tipo `SinotticaRow` (`gommeAxleProblema`) ma non è mai popolato — quindi non appare mai a runtime. Mantenuto come placeholder; implementazione rimandata a prompt dedicato.
Motivo: audit PROMPT 27.13 INTERVENTO 5. Causa root identificata: combinazione di CAUSA A (aggregator non implementato, `gommeAxleProblema: null` hardcoded in `src/next/components/NextCentroControlloSinottica.tsx:760`) + CAUSA D (propagazione campi: `SinotticaManutenzioneRecord` linea 30 ha shape ridotta `{id, targa, data, descrizione}`, non include `gommeInterventoTipo`/`gommeStraordinario`/`assiCoinvolti` che il reader `nextManutenzioniDomain.ts:73-76` espone già; il mapping in `NextCentroControlloParityPage.tsx:936-941` scarta i campi gomme).
Status: audit-only. Proposta fix per PROMPT futuro: (1) estendere `SinotticaManutenzioneRecord` con `gommeInterventoTipo`, `gommeStraordinario`, `assiCoinvolti`; (2) propagarli nel mapping parity (linee 936-941); (3) implementare aggregator a linea 760 — scorrere `manutenzioniStorico` filtrato per targa, trovare l'ultimo evento con `gommeInterventoTipo === "straordinario"` recente, estrarre `asseId` e mappare a `{asseId, severity: "warn"}`.
Conseguenza: badge resta invisibile finché non viene affrontato in un prompt dedicato. Stesso pattern del bug PROMPT 27.10 (campi droppati nel mapping).

### 2026-05-11 — Audit categorie tipografiche (whitelist Sinottica vs whitelist dominio Home)
Decisione: esistono DUE whitelist diverse per classificare un mezzo come motrice/rimorchio. Da unificare in futuro tramite singola sorgente domain-level.
Motivo: audit PROMPT 27.13 INTERVENTO 6. (A) Whitelist Sinottica `MOTORIZED_CATEGORIES_NORMALIZED` (`NextCentroControlloSinottica.tsx:207-212`): {trattore stradale, motrice 2 assi, motrice 3 assi, motrice 4 assi} → tutto il resto è "rimorchio". (B) Whitelist Home `CATEGORIE_RIMORCHI_HOME` (`nextCentroControlloDomain.ts:24-30`): {biga, vasca, centina, semirimorchio asse fisso, semirimorchio asse sterzante} → tutto il resto è "motrice". Discordanza per categorie fuori da entrambe le liste: es. categoria "trattore" (senza "stradale") → Sinottica la classifica rimorchio, Home la classifica motrice. Idem "motrice 5 assi", "cisterna" standalone, varianti con typo o spazi.
Status: audit-only. Proposta fix per PROMPT futuro: centralizzare in `nextCentroControlloDomain.ts` una funzione `classifyMezzoCategoria(cat): "motrice" | "rimorchio"` con whitelist combinata + fallback esplicito documentato, e importarla nella Sinottica al posto di `isMotorized`.
Conseguenza: classificazione potenzialmente incoerente tra Home (asset locations) e Sinottica V2 per categorie atipiche. Nessun bug bloccante segnalato, ma rischio sottile di duplicazione mezzo in tab errato.

### 2026-05-11 — Audit orfani hard-delete mezzo (cascade by-targa)
Decisione: hard-delete cascade su 11 dataset funziona solo per record che espongono almeno una chiave tra {targa, mezzoTarga, targaCamion, targaMotrice, targaRimorchio}. Record orfani con solo `mezzoId` (senza targa) rimangono.
Motivo: audit PROMPT 27.13 INTERVENTO 7. `nextMezzoHardDeleteWriter.ts` usa `recordTargaCandidates(record)` (linea 35-49) che ispeziona 5 campi targa-like. La funzione `deleteByTargaInDataset` filtra solo per match targa. La cancellazione del mezzo principale usa `mezzoId` (linea 121 `deleteMezzoById`) ma NON viene riconciliato con i 10 dataset cascade. Se un record futuro persiste con solo `mezzoId` (es. nuovi documenti archivio mezzo, allegati) e niente targa, sopravvive all'eliminazione → orfano. Risultato grep: 26 file referenziano `mezzoId`. Dataset attualmente sicuri (popolati con targa): @rifornimenti*, @manutenzioni, @lavori, @segnalazioni_autisti_tmp, @controlli_mezzo_autisti, @richieste_attrezzature_autisti_tmp, @cambi_gomme*, @gomme_eventi, @autisti_sessione_attive.
Status: audit-only. Proposta fix per PROMPT futuro: aggiungere fallback cascade per `mezzoId` parallelo a quello per targa, oppure invariante esplicita ("ogni record di dataset operativo DEVE includere campo targa snapshot") con guardia nei writer.
Conseguenza: rischio futuro contenuto. Da rivalutare quando vengono aggiunti dataset nuovi che usano `mezzoId` come chiave primaria di join.

## 2026-05-12 — Archivio Storico NEXT chiuso (PROMPT 29.0 → 31.2)

**Cosa è stato fatto**
Costruito ex novo il modulo "Archivio Storico" come nuova tab
del Centro Controllo NEXT, accanto a Sinottica Flotta v2.
Sessione di 13 prompt (29.0 audit collezioni → 31.2 fix grassetto
PDF). Tutti i build verdi.

**Strada architetturale scelta (PROMPT 29.0)**
Strada 3: componente `<StoricoLista>` shared per kind omogenei
+ escape hatch per kind divergenti. 4 sub-tab: Lavori,
Manutenzioni, Segnalazioni, Richieste (scelti da Giuseppe;
esclusi Rifornimenti, Controlli, Ordini, Scadenze).

**Decisioni di scope (SPEC 1.0)**
- Modulo SOLA LETTURA inizialmente (poi rilassato per kebab
  elimina, vedi sotto)
- Filtri globali: Autista + Targa + Periodo (default ultimi
  30gg) + Cerca testuale
- Ricerca modalità C ibrida: scoped sulla sub-tab attiva con
  contatori dinamici sulle altre
- Click riga: espansione inline + bottone "Apri dettaglio →"
- Componenti: 12 nuovi + 4 hook + 1 generatore PDF dedicato
- Path radice: `src/next/centroControllo/archivioStorico/`

**Workaround importanti**
- Timeline "Lavoro generato" su Lavori: rimossa, perché il
  reader Step 1 (`readNextLavoriArchivioSnapshot`) espone
  `NextLavoriListaRow` snello senza `source.*`. Link inverso
  da Segnalazione cliccabile (`linkedLavoroId`).
- CSS scope dedicato `.cc-archivio-scope-v1` con token duplicati
  da V2 perché i token V2 sono scoped sotto
  `.cc-sinottica-scope-v2` (NON globali), file V2 intoccabile.
- Bug Step 8 scoperto in 30.2: il modale
  `NextHomeAutistiEventoModal` era dentro
  `{archivioMode === "sinottica" ? ... : null}` → inaccessibile
  dall'archivio. Spostato fuori dal wrap → sblocca anche scenari
  futuri.

**Decisioni UX successive (PROMPT 30.x)**
- 30.0: audit foto mezzo + collegamenti modali — strategia Y
  zero-touch via `editable={false}` sul modale eventi esistente
- 30.1: fix foto mezzo (era codice morto, ArchivioVeicoloPhoto
  Step 4 mai consumato dalle 4 righe) + cleanup
  ArchivioVeicoloPhotoPlaceholder
- 30.2: collegamenti dettaglio (Lavori→pagina dettaglio,
  Manutenzioni→navigate query param, Segnalazioni/Richieste→
  modale eventi readOnly con badge "Modalità consultazione")
  + link "Lavoro generato" cliccabile su Segnalazione
- 30.3: 4 fix UX:
  (1) bottone "Apri dettaglio" spostato in riga compatta
  (2) URL state persistente `?tab=archivio&asTab=...&asAutista=...`
  per back/forward browser coerente
  (3) rimossa scritta inutile "Ordinati per data ↓"
  (4) container foto da 64×48 a 80×56 con `object-fit: contain`
  (la foto NON era tagliata da CSS, era letter-boxed per aspect
  mismatch; ridimensionamento risolve)
- 30.5: export PDF lista per tab con filtri applicati ("ciò che
  vedi"). Pattern replicato 1:1 dal Tab Rifornimenti CC
  (PROMPT 27.x). Nuovo generatore
  `generateArchivioStoricoPDFBlob` in pdfEngine.ts (~200 righe),
  uso `PdfPreviewModal` esistente, share via Web Share API
  (status quo: unsupported desktop = caduta su Copy/WhatsApp).
- 31.2: periodo PDF in grassetto per leggibilità.

**Caso reale "dato sporco" emerso in produzione (31.0 + 31.1)**
Una segnalazione cisterna ha generato un lavoro con targa
sbagliata (trattore stradale TI239045 invece di cisterna
TI84822) per un bug a monte nel CC. Giuseppe ha cancellato il
lavoro orfano ma la segnalazione è rimasta con
`hasLinkedLavoro=true` + `linkedLavoroId` orfano, bloccando la
ri-creazione.

Decisione: NON intervenire sistemicamente in questa sessione.
Workaround tattico:
- PROMPT 31.0: fix manuale Firestore con dry-run + conferma
  esplicita; ripulito flag sulla segnalazione specifica.
- PROMPT 31.1: aggiunto tasto "Elimina" in archivio storico
  (kebab menu ⋮) che setta `nascostoInArchivio=true` su
  Firestore. SOFT-HIDE, non hard-delete. Record resta
  visibile altrove (Sinottica, modali). Nuova deroga barrier
  `ARCHIVIO_HIDE_WRITE_SCOPE` su 4 collezioni, SOLO campo
  `nascostoInArchivio`. Modulo archivio NON è più strettamente
  sola lettura.

**Cantieri aperti rimandati**
1. Audit bug "creazione lavoro da segnalazione" — perché il CC
  ha popolato la targa del trattore invece di cisterna? Ipotesi:
  prende mezzo correntemente attivo dell'autista invece di
  quello della segnalazione. Da fare in sessione dedicata.
2. Fix sistemico: quando si cancella un lavoro, ripristinare
  `hasLinkedLavoro=false` + `linkedLavoroId=null` sulla
  segnalazione collegata. Eviterebbe il loop sperimentato oggi.
3. Eventuale meta-modulo "ripristina record nascosto in
  archivio" — oggi il soft-hide è unidirezionale. Per ora
  accettato come tradeoff (Giuseppe può sempre rimuovere il
  flag a mano se necessario).

**Verifica E2E finale**
Baseline mantenuta: 75 pass + 1 flaky pre-esistente + 1 skip.
Test nuovi aggiunti: 13 (foto), 14-16 (collegamenti), 17 (URL
state), 18 (PDF), 19 (elimina). Test 18 stabile in isolato.

**Memo regola operativa (per future sessioni)**
- Default playwright SOLO se: tocca CC parent / modali shared /
  refactor largo. Altrimenti basta tsc+vite per non perdere 30
  min ad ogni step.
- Decisione applicata da PROMPT 31.1 in poi.

## 2026-05-12 — Dismissione modulo Lavori NEXT e assorbimento in Manutenzioni NEXT - 12 decisioni operative

**Contesto**
Sessione di audit pre-dismissione del modulo Lavori NEXT, in vista dell'assorbimento dentro Manutenzioni NEXT (stati `daFare` / `programmata` / `eseguita`). Strategia di riferimento: 3a (madre congelata, NEXT autonoma, nessun mirror continuo). Riferimento audit completo: [docs/_live/AUDIT_DISMISSIONE_LAVORI_NEXT_2026-05-12.md](_live/AUDIT_DISMISSIONE_LAVORI_NEXT_2026-05-12.md).

**Decisioni**

**J.1 — Migrazione dati**
Migrazione totale dei record da `@lavori` a `@manutenzioni`. La collection `@lavori` resta viva in Firestore perche' la madre continua a scriverla. La NEXT non legge piu' `@lavori` dopo la dismissione.

**J.2 — Card Home**
La card Home NEXT "Lavori in attesa" si trasforma in "Manutenzioni da fare". Stesso posto, stessa logica, repuntata sulla nuova collection.

**J.3 — PDF Quadro manutenzioni**
Il PDF "Quadro manutenzioni" mantiene impaginazione attuale invariata in questo giro. I filtri determinano cosa renderizzare. Il PDF deve sapere renderizzare anche record con stato `daFare` e `programmata` senza crashare su campi opzionali (km, fornitore, costo).

**J.4 — Route dettaglio**
La route `/next/dettagliolavori/:id` viene mantenuta come redirect verso il dettaglio manutenzione equivalente, per non rompere link e bookmark esistenti.

**J.5 — Foto record migrati**
Foto dei record migrati: referenziate dal record segnalazione o controllo di origine, non duplicate su Storage.

**J.6 — Repunting lettori indiretti**
I 12 lettori indiretti `@lavori` identificati in audit con gravita ALTA o CRITICA vengono tutti repuntati a `@manutenzioni` in un solo passaggio, senza periodo di transizione a doppia lettura.

**J.7 — linkedLavoroId**
Il campo `linkedLavoroId` sui record `@segnalazioni_autisti_tmp` e `@controlli_mezzo_autisti` mantiene il nome invariato. Cambia solo il significato del valore puntato: dopo la migrazione punta all'id della manutenzione equivalente, non piu' all'id lavoro.

**J.8 — Tipo "magazzino"**
Il tipo "magazzino" dei record `@lavori` (lavori senza targa, richieste materiali generiche) viene mantenuto come tipo "magazzino" anche in `@manutenzioni`.

**J.9 — gruppoId**
Il campo `gruppoId` presente in `@lavori` non viene portato in `@manutenzioni`. Ogni manutenzione `daFare` e' un record separato, niente concetto di blocco di manutenzioni.

**J.10 — Chat IA Zero-Invenzioni (debito accettato)**
Tutto il sottosistema chat IA Zero-Invenzioni resta intoccato in questo intervento. Le entries riferite a lavori (`registry.config.js` `work.lavori`, `view.config.ts` `firestore-storage-lavori-doc`, `internal-ai-firebase-readonly-boundary.js`, `internal-ai-repo-understanding.js`, `chatIaRouter.ts`, `sectorFallbacks.ts`, `chatIaMezziData.ts`) restano invariate. Conseguenza accettata in modo cosciente: la chat IA continuera' a leggere `@lavori` come sorgente attiva finche' non verra' fatta una sessione di pulizia dedicata, in futuro. Le manutenzioni `daFare`/`programmata` create dopo la dismissione non saranno visibili dalla chat IA come "lavori" finche' la pulizia non avverra'.

**J.11 — Record clone-only in localStorage**
I record presenti in `localStorage` `@next_clone_lavori:records` (clone-only, mai persistiti su Firestore) vanno prima contati, poi si decide se migrarli in `@manutenzioni` o scartarli. Decisione rinviata a dopo il conteggio.

**KM/ORE migrazione**
I record `@lavori` migrati portano i campi `km` e `ore` solo se gia' presenti nel record originale. Se assenti, vengono lasciati vuoti. Nessuna stima da rifornimenti o da altre fonti. Nessun flag origine "lavori_legacy". Conseguenza accettata: il KPI "ultimo intervento a X km/ore" del modulo Manutenzioni si calcola solo sui record che hanno km/ore reali compilati; i record migrati senza km non contribuiscono agli aggregati km/ore ma sono comunque presenti nello storico cronologico.

**Debito tecnico aperto post-dismissione (riferimento per sessione futura di pulizia)**
- Chat IA Zero-Invenzioni: rimuovere o ripuntare entry `work.lavori` (`registry.config.js`), entry `firestore-storage-lavori-doc` (boundary + `view.config.ts`), entries `next-lavori-*` (repo-understanding), keyword `lavori` (chatIaRouter), testo `sectorFallbacks`, source dichiarata in `chatIaMezziData`.
- Conteggio e gestione record `@next_clone_lavori:records` in `localStorage` (J.11).
- Eventuali aggiornamenti `pdfEngine.ts` per i nuovi stati manutenzione, se serve refresh impaginazione futuro.

**Riferimento audit**: [docs/_live/AUDIT_DISMISSIONE_LAVORI_NEXT_2026-05-12.md](_live/AUDIT_DISMISSIONE_LAVORI_NEXT_2026-05-12.md)

**Prossimo passo**: redazione di `docs/product/SPEC_DISMISSIONE_LAVORI_NEXT.md` basata su queste 12 decisioni piu' i conteggi Firestore reali (capitolo E dell'audit).

## 2026-05-13 - Chiusura totale dismissione Lavori NEXT + override J.10

La dismissione Lavori NEXT e' completata in 16 prompt operativi (PROMPT 9-25). L'esito finale e' documentato in `docs/_live/REPORT_FINALE_DISMISSIONE_LAVORI_NEXT_2026-05-13.md`.

Decisioni finali:
- 13 buchi audit chiusi su 14; resta deferred solo il buco #10 sulle programmate fuse con daFare nel Dossier.
- Override J.10 totale autorizzato: chat IA sanificata anche nei tool runtime, registry, boundary e metadata. Totale file Categoria F toccati: 15.
- Opzione alfa confermata: `src/components/AutistiEventoModal.tsx` shared con madre lasciato invariato.
- Strategia 3a confermata: `@lavori` Firestore resta vivo per la madre; NEXT non lo legge piu' come modulo Lavori e non lo cancella.
- Decisione J.7 confermata: `linkedLavoroId` / `linkedLavoroIds` mantengono il nome.
- 24 backlink orfani preesistenti restano documentati e non toccati.
- File eliminati effettivi: 15. Il conteggio precedente 14 sottostimava i file `.bak`: nel repo i `.bak` eliminati sono 5.

Verifiche finali:
- `npm run build`: PASS.
- `npx eslint` sui file Z5-BIS: PASS.
- Residui funzionali Lavori NEXT: zero fuori dalle eccezioni madre/alfa/J.7.

Prossimo passo: cross-audit Claude Code (PROMPT 26) + gate manuale runtime Giuseppe.

## 2026-05-14 - Chiusura definitiva dismissione Lavori NEXT + raffinamenti UX post-gate

Dismissione Lavori NEXT completata e validata in produzione.

### Cronologia finale
18 prompt operativi (9-29 + 30), 4 cross-audit, 2 gate manuali runtime di Giuseppe.

### Raffinamenti post-gate (PROMPT 28-29-30)
- P1: pulsante Conferma admin autisti (NextHomeAutistiEventoModal) sanificato - modale NEXT autonoma, non piu' wrappa AutistiEventoModal madre, scrive @manutenzioni daFare via createManutenzioneDaFareFromEvento.
- P2: PDF Quadro manutenzioni include record daFare/programmata con toggle "Includi da fare e programmate" default ON.
- P3: PDF Quadro manutenzioni passa da doc.save a Blob+PdfPreviewModal coerente con altri PDF NEXT.
- P4: modale "Vedi origine" formatta correttamente i timestamp via formatDateTimeUI.
- P5: PDF Quadro mostra per ogni record con origine segnalazione/controllo riga naturale "Segnalato da X il Y" / "Controllo KO di X del Y".
- P6: PdfPreviewModal ha pulsante Condividi via Web Share API + fallback WhatsApp Web (PROMPT 30).

### Stato finale del sistema
- @lavori Firestore: 18 record invariati (strategia 3a, madre continua).
- @manutenzioni Firestore: 74 record (56 originali + 18 from-lavoro-* con stato esplicito).
- 17 backlink validi riscritti, 24 orfani preesistenti documentati.
- Sidebar NEXT: voce "Lavori" rimossa.
- Route NEXT /next/lavori-* e /next/dettagliolavori: redirect compat attivi.
- Chat IA: sanificata in 15 file Categoria F (override J.10 totale autorizzato 2026-05-13).
- Build: PASS continuativo durante tutta la dismissione.

### Eccezioni mantenute
- src/components/AutistiEventoModal.tsx (opzione alfa): shared con madre, lasciato invariato. Wrapper NEXT autonomi.
- src/autistiInbox/AutistiAdmin.tsx (madre): non toccato.
- src/pages/ (madre completa): non toccato.
- linkedLavoroId/linkedLavoroIds (J.7): nome campo invariato, semantica aggiornata.

### Debito tecnico residuo riconosciuto
- Buco audit user-journey #10: "programmate fuse con daFare nel Dossier" - deferred (0 record programmata oggi in Firestore).
- Problema chiusura ciclo segnalazione -> manutenzione eseguita: l'app autista crea record paralleli (es. cambio gomme) che non collegano automaticamente le daFare esistenti. Sara' affrontato in audit-first dedicato post-dismissione (PROMPT 31 a venire).

### Cosa chiude questa voce
Da oggi 2026-05-14 il modulo Lavori NEXT e' considerato DISMESSO. Tutte le operazioni utente passano da @manutenzioni con tab "Da fare" e flussi completamento espliciti. La saga della dismissione e' chiusa. Il problema residuo "chiusura ciclo daFare -> eseguita" e' tracciato come task indipendente in roadmap.

## 2026-05-14 - Macchina chiusura ciclo eventi per segnalazioni/manutenzioni

Decisione: introdotta una macchina di chiusura ciclo per evitare che segnalazioni o controlli trasformati in manutenzioni da fare restino aperti quando un evento successivo risolve il problema.

Scelte operative:
- `@manutenzioni` esteso con stato `chiusa_da_evento`.
- `@segnalazioni_autisti_tmp` e `@controlli_mezzo_autisti` estesi con stato `chiusa`.
- Tracciabilita' standard tramite `chiusuraDi`, `chiusuraRefId`, `chiusuraData`.
- Primo evento supportato: `gomme_evento`.
- Finestra suggerimento UI: 30 giorni, con multi-select sempre disponibile.
- Match suggeriti pre-selezionati, altre aperte non pre-selezionate.

Implementazione:
- Nuovo writer `nextChiusuraEventoWriter.ts` con scope barrier `next_chiusura_da_evento_write_scope`.
- Modale import gomme in `/next/autisti-inbox` prima della scrittura su `@gomme_eventi`.
- Badge e tooltip `CHIUSA DA EVENTO` in Manutenzioni, Archivio Storico e Dossier Mezzo.
- Script one-shot creato ma non eseguito: `scripts/oneoff/chiudi-dafare-gomme-orfana-2026-05-14.cjs`.

Stato Firestore nel prompt: invariato. Lo script retroattivo sara' lanciato manualmente da Giuseppe prima in `DRY_RUN=true`, poi eventualmente in reale.

Riferimento: `docs/_live/REPORT_MACCHINA_CHIUSURA_CICLO_EVENTI_2026-05-14.md`.

## 2026-05-14 - Aggancio/Sgancio retroattivo evento gomme

Decisione: aggiungere una chiusura retroattiva manuale per i casi in cui il cambio gomme esiste gia' in `@gomme_eventi` ma la segnalazione, il controllo KO o la manutenzione da fare sono rimasti aperti perche' creati prima della modale multi-select.

Scope:
- evento supportato oggi: solo `gomme_evento`;
- superfici: dettaglio manutenzione, dettaglio segnalazione autista, dettaglio controllo KO;
- azioni: `Aggancia evento` e `Sgancia evento`;
- sgancio consentito solo quando `chiusuraDi === "gomme_evento"`.

Conseguenze:
- `Aggancia evento` e' il caso parallelo di `Completa`: invece di creare un evento, collega un evento gia' esistente.
- `Sgancia evento` ripristina il record aperto e azzera `chiusuraDi`, `chiusuraRefId`, `chiusuraData`.
- Helper nuovo `eventiCompatibili.ts` predisposto per un registry futuro quando esisteranno collection evento per olio, freni o altri cicli.

Firestore nel prompt: zero scritture. Le chiusure avverranno solo da UI dopo gate manuale Giuseppe.

## 2026-05-14 - Storia unificata record + sparizione satellite

Decisione: una manutenzione `chiusa_da_evento` collegata a `gomme_evento` non deve piu' comparire come voce storica autonoma quando esiste il record evento principale. Il record satellite resta in Firestore e resta recuperabile per audit, dettaglio diretto e sgancio.

Conseguenze:
- `/next/manutenzioni` nasconde i satelliti nella sidebar `Storico Manutenzioni` e negli ultimi interventi, ma mostra una timeline unificata nel dettaglio del record evento.
- Dossier Mezzo e Archivio Storico non duplicano i satelliti nelle liste storiche normali; l'Archivio li fa riapparire se Giuseppe usa il filtro stato `Chiusa da evento`.
- Il PDF Quadro separa i record risolti tramite evento esterno nella sezione `Manutenzioni risolte tramite eventi esterni`.

Firestore nel prompt: zero scritture. La reversibilita' resta affidata a `Sgancia evento`, che riporta il satellite a stato aperto/daFare.

2026-05-14 — Date unificate NEXT a GG/MM/AAAA display, ISO yyyy-mm-dd storage. Helper unico dateUnica.ts. Migration @manutenzioni.data: 56 record. 7 punti fuori audit originale recuperati. Helper vecchi deprecati. Rif: docs/_live/REPORT_DATE_UNIFICATE_2026-05-14.md

2026-05-14 — Storia segnalazione/controllo/manutenzione unificata. Frase standard "<Tipo> del <data>, presa in carico il <data>, eseguita il <data>" + suffisso modalita' chiusura ("Risolta dal cambio gomme del <data>" / "Risolta dall'intervento officina <nome>" / "Chiusa manualmente"). Verbo unico "Risolta", date GG/MM/AAAA via dateUnica. Helper frasestoriaRecord.ts (buildFraseStoria + recordChiusoFromRaw), componente FraseStoriaRecord. StoriaRecordTimeline deprecato (non eliminato). 8 superfici allineate (S1-S8); S9 Chat IA esclusa (modulo in dismissione), S10 autisti-inbox senza punto storia. Verifica runtime: 160 frasi conformi, 0 divergenti. Rif: docs/_live/REPORT_STORIA_UNIFICATA_2026-05-14.md

2026-05-14 — Fix modifica manutenzione: ora aggiorna lo stesso record, preserva campo data, tocca solo updatedAt. Bug pre-fix: i record privi di id reale erano identificati per posizione nell'array (buildHistoryId index-based) e la modifica ne creava un duplicato invece di aggiornarli. Fix Opzione 1 (id stabile alla radice): saveNextManutenzioneBusinessRecord ritrova il record per id o fingerprint, gli assegna un id reale persistito se ne e' privo, rimuove il vecchio per indice trovato. I record gia' duplicati pre-fix (es. TI298409) restano DA RIPULIRE MANUALMENTE. Rif: docs/_live/REPORT_FIX_MODIFICA_MANUTENZIONE_2026-05-14.md

2026-05-14 — Bottone Elimina nel Quadro manutenzioni HTML (con modale di conferma) su ogni riga: scialuppa per i record fantasma non cancellabili da Da fare/Dettaglio. Riusa deleteNextManutenzioneBusinessRecord (esteso con fallback fingerprint), nessuna deroga barriera aggiunta. Campo Fornitore/Officina dei form manutenzione: da testo libero a autocomplete NON vincolante che suggerisce read-only da @officine (testo libero sempre ammesso, niente "+ aggiungi", niente scrittura @officine dal form). I 31 nomi fornitore storici di @manutenzioni NON migrati. Rif: docs/_live/REPORT_ELIMINA_QUADRO_OFFICINE_2026-05-14.md

2026-05-14 — PROMPT 44 fix strutturale ciclo segnalazione. D4 fingerprint chiusura evento (riuso helper PROMPT 41), D3 cicloLegame helper unificato retro-compatibile (writer routati, reader display intatti, nessun campo nuovo), D1 closureOrchestrator propagazione chiusura officina/manuale/evento alle sorgenti collegate, D7 dataPresaInCarico (ISO via dateUnica) in patchSegnalazione, D6 etichetta "Storico" per i 55/73 record legacy senza stato (solo display, zero scritture). Backup Firestore + script rollback DRY_RUN=true creati. 30 test unitari nuovi tutti verdi + sweep runtime Playwright 8/8 PASS. DRY-RUN: 7 sorgenti "eterne" residue, da chiudere manualmente (non retroattive). Rif: docs/_live/REPORT_PROMPT44_CICLO_FIX_2026-05-14.md

2026-05-15 — PROMPT 53 pulizia pre-commit. Working tree ridotto da 174 a 135 voci pending. ~177 MB di artefatti eliminati: 10 dir screenshots/* (~45 MB), test-results/ (132 MB), 4 file SCAN/MAPPING/DIAGNOSI intermedi, 14 script verify/sweep/inspect/dryrun completati, 5 dump JSON one-shot. CATEGORIA C default applicati: `.claude/settings*` rimossi dal tracking via `git rm --cached` + gitignored, AUDIT_CICLO_SEGNALAZIONE_SINTESI e backup-firestore-prompt44 e migrate-dates-storage-iso cancellati (sostituiti/chiusi). `.gitignore` aggiornato con `test-results/`, `docs/_live/screenshots-*/`, `scripts/oneoff/*-DRY.json`, `scripts/oneoff/*-REAL.json`, `cleanup-*-report-*.json`, `.claude/settings*`, `*.bak/.tmp/.backup/.old`. Bug preesistente fixato: `tsconfig.app.json` ora esclude `**/__tests__/**` (tsc -b prima falliva su test perche' mancavano i types vitest nel build context). `npm run build` verde in 36s post-pulizia. Rif: docs/_live/REPORT_PROMPT53_PULIZIA_PRECOMMIT_2026-05-15.md, docs/_live/AUDIT_PRECOMMIT_2026-05-15.md

2026-05-15 — PROMPT 52 frase storia mancante su vista segnalazione. Causa triplice: (1) `ArchivioRowSegnalazione.tsx` non renderizzava `<FraseStoriaRecord>` come fa la riga manutenzione compact, la frase appariva solo dietro chevron in `ArchivioRowExpanded`; (2) `recordChiusoFromRaw` non gestiva `stato === "chiusa"` con `chiusuraData` (caso P44 D1 `chiudiSegnalazioneDaEvento` post-aggancio P47), nessun branch matchava → frase troncata; (3) `stato` confrontato case-sensitive, ma projection P45 mette uppercase su section item. Fix: estensione `recordChiusoFromRaw` con nuovo branch `stato === "chiusa"` (mappa `chiusuraDi === "gomme_evento"` → modalita' evento_autisti, altrimenti manuale; `dataEsecuzione = chiusuraData`) + normalizzazione `stato.toLowerCase()`; aggiunta `<FraseStoriaRecord {...recordChiusoFromRaw(data, "segnalazione")} compact />` in `ArchivioRowSegnalazione.tsx` dopo "Aperta da". Verifica visiva via Playwright (Simple-Browser-equivalent) script `inspect-prompt52-segnalazione-frase`: prima `hasFraseStoria: false`, dopo `hasFraseStoria: true` con testo esatto "Segnalazione di RICCARDO FENDERICO del 08/05/2026, eseguita il 12/05/2026. Chiusa manualmente.". CI: tsc clean, eslint clean, vitest 33/33 (2 nuovi P52). Rif: docs/_live/REPORT_PROMPT52_FRASE_VISTA_SEGNALAZIONE_2026-05-15.md

2026-05-15 — PROMPT 51 cleanup timestamp sporchi su Firestore live. Backup live fresco `C:\tmp\backup_firestore_prompt51_20260515_185610` (73/37/351). Script `scripts/oneoff/cleanup-timestamps-live-2026-05-15.cjs` con DRY_RUN default = true, esegue tramite Firebase Admin SDK (riusa `getInternalAiFirebaseAdminReadonlyContext` che permette anche write). CHECK_R1: chiusuraData != target.data nello stesso giorno ISO → correggi a `parseISO(target.data)`. CHECK_R2: dataPresaInCarico nello stesso giorno di chiusuraData (= aggancio retroattivo pre-fix) → null. DRY ha identificato 2 record (R1 + R2 sulla stessa segnalazione TI298409 `7d1d8009-...`), sotto la soglia STOP HARD di 20. Esecuzione reale: 1 write su `storage/@segnalazioni_autisti_tmp` (1 segnalazione patched). Post-correzione (verify script): `chiusuraData = 1778536800000` (12/05/2026 mezzanotte locale CEST) ✓, `dataPresaInCarico = null` ✓, legame bidirezionale con manutenzione 12/05 ✓. Nessuna modifica codice runtime in src/. Rif: docs/_live/REPORT_PROMPT51_CLEANUP_LIVE_2026-05-15.md

2026-05-15 — PROMPT 50 fix strutturale timestamp aggancio: chiusuraData eredita data manutenzione collegata (R1 — writer P47 `readChiusuraDataMs` esteso per leggere `target.data` come fallback prima di Date.now(); closureOrchestrator stesso pattern); dataPresaInCarico solo da azione esplicita (R2 — rimosso da `patchSegnalazione` di nextManutenzioneDaFareCreateWriter e da `agganciaSegnalazioneAManutenzioneEsistenteWriter`; nuovo writer `presaInCaricoSegnalazioneWriter.segnaPresaInCaricoSegnalazione` come unica via); timeline da sorgente (R3 — implicitamente fixato da R2: la riga "presa in carico il 15/05" sparisce perche' dataPresaInCarico non e' piu' scritto; cross-read dataApertura gia' in P49). Nuova regola permanente `TIMESTAMP-MAI-DA-CLICK` in AGENTS.md sez "Regole scrittura": i timestamp persistiti non sono effetti collaterali di operazioni non temporali. Script DRY `scripts/oneoff/cleanup-timestamps-aggancio-2026-05-15.cjs` per ripulitura retroattiva: 0 record nel backup P44 (antecedente alla sessione TI298409 del 15/05 17:45); Giuseppe riapplichera' aggancio con writer fixati per ottenere frase corretta. Verifiche: tsc clean, eslint clean, vitest 86/86 cumulativi (4 nuovi presaInCarico + test R1 chiusuraData = 12/05 mezzanotte). Backup `C:\tmp\backup_codice_prompt50_20260515_180539`. Rif: docs/_live/REPORT_PROMPT50_TIMESTAMP_FIX_2026-05-15.md

2026-05-15 — PROMPT 49 fix frase storia post-aggancio (PROMPT 47): dopo aggancio segnalazione → manutenzione esistente, la frase mostrava data manutenzione invece di data segnalazione e autore mancante (causa A+B); inoltre la vista segnalazione chiusa via manutenzione non mostrava la frase (causa C). Fix: estensione retro-compatibile di `recordChiusoFromRaw(raw, tipoOverride?, options?)` con `options.sourceRecord` opzionale per cross-read di dataApertura/segnalatoDa dalla sorgente quando back-link `origineRefId` presente; nuovo hook `useSorgenteManutenzione` (async load on mount via getItemSync); integrazione in ArchivioRowExpanded (renderManutenzioneExpanded → sub-componente `ManutenzioneExpanded`) e ArchivioRowManutenzione (riga compact). Causa C risolta a monte: projection `chiusa` in `nextAutistiDomain.ts` ora include `stato === "chiusa"` + presenza di `chiusuraData/chiusuraRefId` (PROMPT 44 D1 canonici), e `dataChiusura` ha fallback su `chiusuraData`. 3 nuovi test vitest P49, 31/31 pass. CI tsc + eslint clean. Limitazione: il suffisso frase su vista segnalazione chiusa via manutenzione resta "Chiusa manualmente" (modalitaChiusura "manuale" di default per chiusuraDi==="manutenzione"); estendibile in futuro con nuova ModalitaChiusura dedicata. Rif: docs/_live/REPORT_PROMPT49_FRASE_POST_AGGANCIO_2026-05-15.md

2026-05-15 — PROMPT 48 fix configurazione barriera per scope P47. Path /next/centro-controllo autorizzato per sgancio/aggancio legami in `src/utils/cloneWriteBarrier.ts`: aggiunte costanti `CENTRO_CONTROLLO_LEGAME_ALLOWED_*` + helper `isAllowedCentroControlloLegameWritePath` + scope nella type union di `runWithCloneWriteScopedAllowance` + clausola di autorizzazione in `isAllowedCloneWriteException`. Bug runtime: il PROMPT 47 aveva creato lo scope nel writer ma non l'aveva configurato lato barriera, quindi `assertCloneWriteAllowed` lanciava `CloneWriteBlockedError` ad ogni scrittura. Storage keys autorizzate: `@manutenzioni` + `@segnalazioni_autisti_tmp` + `@controlli_mezzo_autisti` (le tre toccate dai writer P47). Barriera attiva su tutto il resto, nessuna deroga esistente modificata. Rif: docs/_live/REPORT_PROMPT48_BARRIERA_FIX_2026-05-15.md

2026-05-15 — PROMPT 47: aggancio inverso segnalazione/controllo → manutenzione esistente (qualunque stato, propagazione chiusura automatica se target eseguita); sgancio link orfano (helper `isLegameOrfano` in cicloLegame + writer `sganciaLegameOrfano`); regola permanente `AUDIT-CERCA-PER-TARGA` in AGENTS.md (nata dall'errore PROMPT 45 T5 corretto in PROMPT 46) + cross-ref in METODO_AGENTI.md sez 4.1. Nuovo scope barrier `CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE`. UI in ArchivioRowExpanded (Archivio Storico CC) con 3 modes (aggancia/cambia/sostituisci-orfano) + badge "Link rotto". Decisione: UI solo per segnalazioni (i controlli KO non hanno kind nell'ArchivioRecord); i writer restano polimorfi per estensioni future. Caso TI298409: Giuseppe può ora sganciare seg 08/05 orfana + agganciarla al cambio gomme 12/05 con chiusura automatica. Verifiche: tsc clean, eslint clean, vitest 32/32 (richiede `--pool=forks`), sweep Playwright 8/8 (4 smoke per limiti localStorage isolato headless). Rif: docs/_live/REPORT_PROMPT47_2026-05-15.md

2026-05-15 — PROMPT 46: audit mirato READ-ONLY su TI298409 / Riccardo Fenderico. Corretto l'errore PROMPT 45 T5 (cercava per legame, non per targa). Trovati 6 manutenzioni + 11 segnalazioni + 16 controlli per TI298409 (T5 ne aveva viste solo 6/0/0). Conferma esistenza segnalazione 08/05 "4 gomme di trazione usurate" con linkedLavoroId orfano + manutenzione 12/05 stand-alone "CAMBIO GOMME Kumho" + controllo KO 01/04 gia' chiuso ma con daFare rimorchio TI280132 ancora aperta. Rif: docs/_live/AUDIT_TI298409_RICCARDO_FENDERICO_2026-05-15.md

2026-05-15 — PROMPT 45 unificazione finale ciclo segnalazione: T1 modale "crea nuova vs unisci a manutenzione esistente stessa targa" (writer `agganciaSorgenteAManutenzioneEsistente` in nextManutenzioneDaFareCreateWriter, helper `manutenzioniCandidatiMerge` reader 90gg solo daFare+programmata, modale `NextMergeManutenzioneModal`, integrato in NextAutistiAdminNative — bypass se 0 candidati, riusa MANUTENZIONE_DAFARE_CREATE_WRITE_SCOPE, no patch del back-link target); T2 nome autista nella frase storia (campo `segnalatoDa` opzionale in RecordChiuso, adapter legge segnalatoDa/autistaNome/badgeAutista, sentinel "autista" filtrato come anonimo, ArchivioRowExpanded `segnalazioneToRecordChiuso` aggiornato); T3 STOP HARD #2 — link a record originale non implementabile (no route NEXT navigabile a segnalazione/controllo singolo in nextStructuralPaths.ts), frase resta plain text, raccomandazione per PROMPT futuro; T4 verificato campo data gia' editabile in form Modifica (NextManutenzioniPage:3080-3086 condiviso Crea/Modifica) + aggiunta micro-UX errore esplicito (`man2-field-error`) per input >= 10 char non parsabile; T5 audit TI298409 read-only da backup Firestore PROMPT 44 — il cambio gomme del 12/05 e' stand-alone (no legame), la segnalazione del 24/04 era per "perdita liquido raffreddamento" (manutenzione separata), nessun mismatch reale da correggere. CI: tsc clean, eslint clean, vitest 40/40 mirato, sweep Playwright 9/9. Rif: docs/_live/REPORT_PROMPT45_2026-05-15.md

## 2026-05-16

**Bonifica documentale + governance canonica chat.**
PROMPT 55-58 di Claude Code. Aggiornati gli 8 audit numerati al delta
2026-05-08 → 2026-05-16 (PROMPT 55). Audit profondo autisti
(`AUDIT_AUTISTI_PROFONDO_2026-05-16.md`, PROMPT 56). Bonifica
documentale: creata cartella `docs/copia questi nel progetto in chat/`
come fonte canonica dei file da caricare in chat (26 file canonici +
MANIFEST), cancellati 126 file MD obsoleti/duplicati/assorbiti
(PROMPT 57). AGENTS.md sez. 17 nuova + sez. 3 path aggiornati.
CLAUDE_CHAT_BEHAVIOR.md sez. 3 punta a MANIFEST canonico. Fix
indice handoff 2026-05-07 (PROMPT 58).

## 2026-06-02

**Sessione fix NEXT (BUG 1/2/3 chiusi, nuovi bug manutenzioni aperti).**

BUG CHIUSI E COMMITTATI:
- BUG 1 - Hard-delete mezzo (Centro Controllo, Sinottica V2): la modale confermava ma il mezzo restava visibile dopo refresh. Causa: storageSync.setItemSync faceva merge anti-rimozione senza allowRemovals/removedIds. Fix in src/next/nextMezzoHardDeleteWriter.ts (passate opzioni allowRemovals:true + removedIds, default anti-rimozione invariato per altri chiamanti). Testato in browser (cancellati mezzi venduti/dismessi, persistenza confermata dopo refresh).
- BUG 2 - Classificazione mezzi Sinottica V2: biga/pianale/porta silo container/silo container finivano tra i "mezzi con motore". Causa: categorie mancanti nella whitelist rimorchi di classifyMezzoCategoria. Fix in src/next/domain/nextCentroControlloDomain.ts. Testato in browser.
- BUG 3 - Manutenzione stato "da fare": non si salvava come "da fare"; compilando Fornitore/Officina diventava "eseguita"; senza quel campo non salvava. Causa: il form non scriveva stato esplicito e il reader deduceva "eseguita" da data/fornitore. Fix in src/next/NextManutenzioniPage.tsx + src/next/domain/nextManutenzioniDomain.ts: stato esplicito, reader non deduce piu' eseguita da data/officina, UI con due bottoni "Da fare"/"Eseguita" (default Eseguita). Nota: lo stato "da fare" e' funzionalita' NEXT, non esiste in madre. Testato in browser.

NUOVI BUG APERTI:
- BUG 16 - Targa disallineata: premendo "Completa" su una manutenzione di TI113417, l'URL del form di modifica riporta la targa di un altro mezzo (osservato TI285195). Rischio di operare sul record sbagliato. Collegato al bug "filtro targa parte sempre dalla prima invece che vuoto" (BUG 9).
- BUG 17 - Sospette manutenzioni mancanti in NEXT. Da chiarire se problema di lettura (chiave/targa) o di scrittura (record non persistiti). Apertura chat dedicata: audit Manutenzioni reader/writer/chiavi confrontate con i dati fisici su Firestore, divisi per targa.

DECISIONI:
- Audit Manutenzioni vs Firestore (BUG 17) si svolge in chat dedicata separata per contesto pulito e accesso ai dati fisici.
- Eventuale rifacimento completo della logica Manutenzioni e' un cantiere strategico DA FARE SOLO DOPO l'audit Firestore: non ricostruire sopra un possibile problema di perdita dati.
- Conferma regola operativa: consegna di un solo prompt operativo alla volta, attesa del report prima del successivo.

PUNTO APERTO UX:
- Nel box autisti-admin manca un pulsante esplicito "Marca risolta" per le segnalazioni (oggi solo campo Stato testuale che non scrive chiusa/dataChiusura/chiusa_by). La chiusura funzionante e' in Centro Controllo (chip segnalazione -> "Marca chiusa"). Decisione se replicare il pulsante in autisti-admin: rimandata.

## 2026-06-06

**Maratona risanamento flusso segnalazioni↔manutenzioni (Cantiere A) + riconciliazione dati di massa.**

- Risanamento flusso segnalazioni↔manutenzioni completato: Fase 1 (sgancio automatico delle sorgenti all'eliminazione di una manutenzione + avviso "Richiudi" sulle manutenzioni eseguite con sorgenti ancora aperte) e Fase 2 (riparazione dei dati pregressi). Motivo: l'archivio aveva ~1/3 di record incoerenti (fantasmi, contraddittori); fonte di verità = dato fisico Firestore.
- Decisione D1a: l'hard-delete di una manutenzione sgancia automaticamente tutte le sorgenti collegate (ricerca bidirezionale), con ordine sgancio→delete, per non lasciare record fantasma.
- Decisione D2a: gruppo e collegata sono incompatibili — una segnalazione collegata a una manutenzione non può stare in un gruppo. Enforcement completato nel codice (Cantiere A).
- Decisione D3b: `presaInCaricoSegnalazioneWriter` eliminato (codice morto, mai cablato). Lo STATO `presa_in_carico` nei dati resta valido e leggibile.
- Riconciliazione di massa eseguita: 8 chiusure ricucite su prova documentale (legacy @lavori + legami già corretti). Verdetto: 46 segnalazioni tutte coerenti, ~11-14 problemi davvero ancora aperti.
- Audit legacy: la migrazione @lavori→@manutenzioni portava la chiusura sulla manutenzione ma MAI sulla segnalazione → causa storica delle segnalazioni "aperte" con il lavoro già fatto.

## 2026-06-07

**Bonifica storico gomme (D1) + ripristino deploy Vercel + regola push=deploy.**

- D1 gomme: storico gomme bonificato. 9 record solo-testo riparati con marcatore strutturato additivo, 1 intervento importato (TI282780, valvola, 26/05), 7 record di test cancellati (TI313387 km implausibili + test futuri). Motivo: il marcatore era presente solo su 6 record su ~16 reali → gli altri erano invisibili alla logica gomme.
- Regola anti-associazione: mai ricucire per somiglianza; ogni ricucitura va fatta su prova (targa+data+descrizione) o su memoria operativa confermata di Giuseppe. (Caso TI279216: ricucitura respinta da Giuseppe.)
- Vercel: deploy rotto da ~28/04. Causa provata: `.gitignore` ignorava `src/next/chat-ia/tools/` (sorgenti mai pushati) + errori `tsc -b` in strict mode. Fix applicato, produzione riallineata. Audit compatibilità dati: COMPATIBILE (writer autisti invariati da aprile, reader NEXT nuovi più difensivi).
- DECISIONE: push = deploy. Da ora `git push` pubblica in produzione agli autisti → si pusha solo con `npm run build` verde, mai con lavoro a metà. Gate di build canonico aggiornato a `npm run build` (che include `tsc -b`), non più i due comandi separati.

## 2026-06-08

**Strategia ponte gomme NEXT + perimetro madre + roadmap Cantiere C.**

- Tappo ponte gomme NEXT: decisione 1a (marker gomme scritto alla creazione quando la sorgente è esplicitamente gomme; tipo ordinario/straordinario valorizzato al completamento) + 3a (guardia anti-doppio-submit su app autisti e su import admin NEXT). Implementati.
- DECISIONE: i percorsi gomme della MADRE muoiono con la madre, NON si tappano. Concentrazione sul rendere NEXT impeccabile nella ricezione/visualizzazione dei dati.
- Decisione 2b: il ponte "evento gomma → manutenzione in @manutenzioni" oggi NON esiste in nessun percorso (né NEXT né madre, accertato da diagnosi); va costruito come funzione NUOVA nella chat dedicata UI gomme, non come fix tampone.
- Decisione 4b: l'Archivista non classifica il marcatore gomme; la classificazione avviene più avanti nel flusso Manutenzioni.
- Chat IA NEXT: confermata la decisione di maggio (perimetro chiuso, nessuna cancellazione). Rivalutazione rimandata al futuro.
- Cantiere C (strutturale, punto unico di lettura): si farà a tappe. C0 (analisi inbox autisti NEXT + verifica letture Manutenzioni/Centro Controllo) PRIMA di C1 (centralina). Niente centralina costruita su assunzioni.

### Regola di metodo (permanente)
- Backup SOLO in `C:\tmp`, mai file `.bak` nel repo.
- Commit a fine di ogni lotto verde nella stessa sessione.
- Piani Plan-mode salvati in `docs/`.

## 2026-06-11

**PDF Riepilogo Euromecc: restyling + impaginazione professionale.**

Decisione: adottato uno standard grafico per il PDF del Riepilogo Euromecc (modulo NEXT, route /next/euromecc, funzione generatePdfRiepilogo in src/next/NextEuromeccPage.tsx), replicando dentro il file lo stile gia presente in pdfEngine.ts SENZA importarlo ne modificarlo. Elementi: logo Ghielmicementi (public/logo.png) + header "EUROMECC — Riepilogo impianto" + periodo + footer "Pagina X di Y" e data su ogni pagina; margini 18mm con sistema di costanti centrali; titoli area con linea sotto; sottotitoli maiuscoletto grigio; cornice bianca uniforme + centratura per tutti gli schemi (tinte SVG NON toccate, schermo invariato); tabelle con respiro e righe alternate.

Capitolato impaginazione deciso dal PO via domande numerate Q1-Q12: prima pagina = KPI + mappa media (no copertina dedicata); KPI e stile tabelle invariati; schema e tabella affiancati PAREGGIATI in altezza (eliminato il "buco bianco a fianco"); AREA ATOMICA = titolo + schema + tabelle + problemi dello stesso silo restano uniti, e se non entrano l'area intera va a pagina nuova (mai sezioni spezzate; i problemi non si staccano piu dal loro silo); tabella con riga molto alta (testo lungo) → resa a piena larghezza sotto lo schema invece che soffocata nella colonna stretta; firma coesa con l'ultima urgenza (niente pagina finale con sola firma).

Tradeoff esplicitamente accettato dal PO: l'atomicita delle aree e la leggibilita possono aumentare il numero di pagine (es. filtro "Da fare" 2→3, "tutto" ~15) — preferito ordine/leggibilita alla compattazione.

Commit principali: restyling 65022cda; fix overlap header/tabella + tabelle larghe + KPI nei margini 0f6edfe8; firma blocco-unico dd8d49d0; packing aree senza schema dfd4dd7a; pareggio colonne + area atomica f0865d38; fix tabella riga-alta nel ramo 2-colonne 81ee89ce. Tutto in locale, push a discrezione del PO.

**Metodo: auto-verifica visiva di Claude Code via Playwright.**

Decisione/scoperta: Claude Code puo auto-verificare l'output PDF generando il file reale in locale, catturando screenshot e analizzandone le posizioni testo (pdfjs), iterando fino a risoluzione del difetto. Validato sui fix di impaginazione Euromecc (confronto BEFORE/AFTER reale via stash della patch). Riduce i cicli di download manuale del PO. Limite dichiarato: i casi non coperti dal dataset in sessione (es. filtri categoria con 0 dati) restano da validare al PO con dati reali; Claude Code deve DICHIARARLO e non simulare la verifica.

**Euromecc: punti sospesi.**

Restano aperti su Euromecc, come capitoli separati: (1) etichette sovrapposte sulla mappa generale (codici sili vicini 2A/2B, 6A/6B che si accavallano) — tocca il disegno della mappa, non l'impaginazione, da fare come intervento dedicato; (2) push su Vercel del lavoro PDF (tutto committato in locale, non ancora online).

## 2026-06-11 - Azioni segnalazioni nel tab Da fare: crea manutenzione con form editabile + elimina (PROMPT 55)

Decisione: le segnalazioni autisti aperte visibili in `/next/manutenzioni` tab "Da fare" (sezione "Segnalazioni aperte") hanno ora due azioni dirette sulla riga:
- "Crea manutenzione": form modale con targa read-only, descrizione PRE-COMPILATA `Segnalazione: tipoProblema - descrizione` ed EDITABILE prima del salvataggio, urgenza pre-selezionata (alta se flagVerifica). Salva via `createManutenzioneDaFareFromSegnalazione` esteso con parametro opzionale `descrizioneOverride` (retro-compatibile: call-site esistenti invariati, verificato via rg).
- "Elimina": hard-delete della segnalazione con conferma esplicita. Nuovo writer `src/next/writers/nextSegnalazioneDeleteWriter.ts`.

Decisione A (auto-sgancio bidirezionale): il delete di una segnalazione collegata a manutenzioni rimuove SOLO gli origineRef/origineRefs che puntano alla segnalazione eliminata, senza mai cancellare o alterare la manutenzione. Completa la simmetria con D1a (che copriva solo il verso manutenzione -> segnalazione).

Scelte operative:
- hard-delete fisico, non soft-hide;
- foto cancellate da Firebase Storage, irreversibile anche per la madre; delete tollerante a file gia' assenti;
- nuovo scope barrier `next_segnalazione_delete_write_scope`: path solo `/next/manutenzioni`, storage key solo `@segnalazioni_autisti_tmp` + `@manutenzioni`, delete Storage limitato al prefisso `autisti/segnalazioni/`;
- scope `MANUTENZIONE_DAFARE_CREATE` esteso con path `/next/manutenzioni`;
- i bottoni morti di `/next/autisti-admin` (guard sempre-true) restano fuori perimetro, decisione rimandata.

Correzione di metodo (errore audit PROMPT 54): la mappa superfici aveva mancato `NextManutenzioniPage` perche' il grep cercava solo la chiave storage letterale e non i reader di dominio. Regola permanente: quando si mappano le superfici di una collection, rg esaustivo anche sui reader (`readNextAutistiReadOnlySnapshot` e simili), non solo sulle chiavi `@*`. Il runtime osservato da Giuseppe prevale sul report di audit.

Verifiche: tsc clean, eslint clean, `npm run build` OK, vitest 7/7 (delete writer + gomme suite), test runtime unico di fine feature eseguito da Giuseppe (crea con descrizione modificata, refresh, elimina, foto Storage, non-regressione frase storia). Backup `C:\tmp\backup_codice_prompt55_20260611_183518`.

Riferimento: PROMPT 55 + chiarimento PROMPT 55-BIS.

## 2026-06-11 - Quadro manutenzioni PDF: opzione Tutti, rimozione step 3, keep-together, fix foto (PROMPT 58-65)

Ciclo di modifiche al wizard "Quadro manutenzioni PDF" in /next/manutenzioni (file unico src/next/NextManutenzioniPage.tsx).

PROMPT 58 - Step 1 "Soggetto": aggiunta quarta opzione "Tutti" (mezzo + compressore + attrezzature insieme), default invariato "Mezzo". Type separato PdfSubjectSelection = TipoVoce | "tutti" per non contaminare TipoVoce dei record. Nel PDF, con "Tutti", record presentati in SEZIONI SEPARATE per tipo (ordine Mezzi, Compressori, Attrezzature), ciascuna con metrica propria (km/ore), stato gomme solo dentro sezione Mezzi. Step 3 "Ricerca rapida" ELIMINATO: il filtro in alto della pagina copre gia' targa E autista (deciso da Giuseppe contro l'ipotesi audit "necessario in alcuni casi"). Rimosso stato pdfQuickSearch e ogni uso.

PROMPT 59 - Keep-together: ogni blocco mezzo (header + tabella interventi) sta intero su una pagina, mai targa separata dalla descrizione; intestazioni di sezione mai orfane a fondo pagina.

PROMPT 59/62 - Tentativi falliti sul fix foto: agivano su cause IPOTIZZATE non misurate (flag FAST jsPDF, poi downscale single-step). Nessun miglioramento visivo a runtime. Lezione: vedi sotto.

PROMPT 61 (esploratore-firestore) - Dato fisico: la foto mezzo in @mezzi_aziendali campo fotoUrl e' l'ORIGINALE a piena risoluzione (30/32 record, 900x1600..4000x2252, zero preview base64). Smentita l'ipotesi "preview compressa": la sorgente e' nitida.

PROMPT 64 - CAUSA ROOT dimostrata: la miniatura mezzo viene piazzata con addImage in un riquadro 4:3 FISSO (20x15mm header, 42x31.5mm hero) ma il loader la consegna a ratio preservato, quindi le foto verticali venivano SCHIACCIATE. Non era cap, non DPI (reali 857-1524), non downscale.

PROMPT 65 - FIX: rendering CONTAIN deciso da Giuseppe (foto intera, mai deformata, mai tagliata, scalata per stare nel box mantenendo le proporzioni) + fondo riquadro nero (PDF_HEADER_BLACK_RGB 26,26,26) per fondere le bande con l'header. Helper calculatePdfContainPlacement applicato a entrambi i riquadri. Cap 1200 e JPEG 0.85 invariati.

Verifica VISIVA con Claude in Chrome (primo uso operativo del nuovo strumento): foto verticali rese intere e proporzionate, bande fuse col nero, nessuna deformazione, coerente verticali/landscape. Nitidezza residua "morbida" accettata da Giuseppe (softness fisiologico di una miniatura). Bordo oro del riquadro non toccato (preesistente, fuori perimetro).

Lezione di metodo (registrata): per i bug a output visivo, i fix vanno su una causa MISURATA, non ipotizzata. PROMPT 59 e 62 hanno mancato il bersaglio perche' nessuno aveva guardato il PDF reale ne' misurato il punto vero (riquadro 4:3 fisso). La diagnosi e' arrivata solo dopo: dato fisico Firestore (61), inventario addImage con DPI reali (64), e verifica visiva Chrome. Regola: quando un task ha output visivo, usare Claude in Chrome per ispezionare il risultato reale prima di proporre fix, e misurare il punto esatto (addImage, dimensioni di piazzamento, ratio sorgente) invece di tarare parametri a tentativi.

Build verde su tutti i prompt (tsc, eslint, npm run build). Backup pre-patch creati. Riferimento: PROMPT 58, 59, 61, 64, 65.
