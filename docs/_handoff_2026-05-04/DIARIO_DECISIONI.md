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
