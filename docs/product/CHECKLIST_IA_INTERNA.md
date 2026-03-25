# CHECKLIST IA INTERNA

Ultimo aggiornamento: 2026-03-25  
Stato documento: CURRENT  
Fonte operativa unica: questo file e la fonte di verita operativa del sottosistema IA interna.

## 1. Regola operativa obbligatoria
- Ogni task futuro relativo alla IA interna deve aggiornare obbligatoriamente questa checklist.
- Se una patch IA non aggiorna questa checklist, il task va considerato incompleto.
- Questa checklist traccia solo fatti verificabili nel repository e nei documenti ufficiali gia presenti.

## 2. Stati ammessi
- `FATTO`
- `IN CORSO`
- `NON FATTO`
- `BLOCCATO`

## 3. Macrofase 0 - Governance e base documentale
Stato macrofase: `FATTO`

### A. Audit architetturale IA interna
- Stato: `FATTO`
- Note: audit architetturale documentale completato sul repository, con perimetro sicuro, rischi e vincoli esplicitati.
- File/documenti collegati:
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
  - `docs/change-reports/2026-03-11_2348_docs_audit-architetturale-ia-interna.md`
  - `docs/continuity-reports/2026-03-11_2348_continuity_ia-interna-audit.md`
- Dipendenze o blocchi: nessuno per il completamento dell'audit iniziale.

### B. Decisione di innesto lato clone/NEXT
- Stato: `FATTO`
- Note: la collocazione raccomandata e confermata dentro il clone `/next`, non nella madre, con backend futuro separato.
- File/documenti collegati:
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Dipendenze o blocchi: nessuno per la decisione documentale.

### C. Creazione linee guida IA
- Stato: `FATTO`
- Note: esiste un documento permanente di linee guida architetturali, di isolamento e di sicurezza.
- File/documenti collegati:
  - `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
- Dipendenze o blocchi: da mantenere allineato alla checklist unica.

### D. Creazione stato avanzamento IA
- Stato: `FATTO`
- Note: esiste un documento di stato avanzamento con fatti verificati, blocchi, rischi e fasi.
- File/documenti collegati:
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- Dipendenze o blocchi: da mantenere allineato alla checklist unica.

## 4. Macrofase 1 - Fondazione tecnica isolata dentro il clone
Stato macrofase: `IN CORSO`

### E. Scaffolding isolato `/next/ia/interna*`
- Stato: `FATTO`
- Note: subtree clone dedicato attivato come perimetro isolato, non operativo e reversibile.
- File/documenti collegati:
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/change-reports/2026-03-12_2133_patch_scaffolding-ia-interna-isolata.md`
  - `docs/continuity-reports/2026-03-12_2133_continuity_ia-interna-scaffolding.md`
- Dipendenze o blocchi: nessuno per lo scaffolding gia introdotto.

### F. Model/types locali isolati
- Stato: `FATTO`
- Note: esistono model/types locali per sessioni, richieste, artifact, audit log e stati di preview/approval.
- File/documenti collegati:
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- Dipendenze o blocchi: nessuna persistenza reale attiva.

### G. Contracts e repository mock
- Stato: `FATTO`
- Note: esistono contratti stub per orchestratore, retrieval, archivio artifact, audit log e workflow approvativo, piu repository mock locale.
- File/documenti collegati:
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/change-reports/2026-03-12_2133_patch_scaffolding-ia-interna-isolata.md`
- Dipendenze o blocchi: la persistenza reale resta esclusa in questo step.

### H. Tracking sicuro non invasivo
- Stato: `FATTO`
- Note: tracking confinato al solo sottosistema IA interno, in-memory e non globale.
- File/documenti collegati:
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- Dipendenze o blocchi: tracking persistente non ancora avviato.

### I. Fix crash tracking snapshot
- Stato: `FATTO`
- Note: corretto il loop di render del subtree IA interno causato da snapshot tracking non stabile.
- File/documenti collegati:
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-12_2148_fix_crash-ia-interna-tracking-snapshot.md`
  - `docs/continuity-reports/2026-03-12_2148_continuity_fix-ia-interna-crash.md`
- Dipendenze o blocchi: nessuno sul fix gia chiuso.

## 5. Macrofase 2 - Use case attivi ma sicuri
Stato macrofase: `IN CORSO`

### J. Primo use case "report targa in preview"
- Stato: `FATTO`
- Note: la UI IA interna permette ricerca per targa, lettura in sola lettura dai layer NEXT e composizione di un report in anteprima con fonti e dati mancanti.
- File/documenti collegati:
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-12_2208_patch_ia-interna-report-targa-preview.md`
  - `docs/continuity-reports/2026-03-12_2208_continuity_ia-interna-report-targa-preview.md`
- Dipendenze o blocchi: nessuna applicazione reale in produzione; bozza solo mock locale.

### K. Stato preview / da rivedere / approvabile
- Stato: `FATTO`
- Note: gli stati esistono solo a livello di scaffolding UI/mock, senza effetti sui dataset business.
- File/documenti collegati:
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- Dipendenze o blocchi: manca ancora un workflow approvativo reale e separato.

### L. Archivio artifact locale isolato
- Stato: `FATTO`
- Note: l'archivio artifact del sottosistema IA usa ora persistenza locale isolata e namespaced del clone, con fallback in memoria se `localStorage` non e disponibile.
- File/documenti collegati:
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- Dipendenze o blocchi: persistenza server-side separata non ancora attivata.

### L.1 Chat interna controllata / orchestratore locale mock
- Stato: `FATTO`
- Note: la panoramica `/next/ia/interna` espone ora una chat locale controllata con richieste libere, risposta assistente mock, suggerimenti iniziali e instradamento sicuro dei soli intenti oggi supportati (`report targa` e `report autista`).
- File/documenti collegati:
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-12_2244_patch_chat-interna-controllata.md`
  - `docs/continuity-reports/2026-03-12_2244_continuity_chat-interna-controllata.md`
- Dipendenze o blocchi:
  - nessun provider o backend IA reale attivo;
  - messaggi mantenuti solo in memoria nella pagina corrente.

### L.2 Ricerca guidata mezzi / autosuggest targhe reali
- Stato: `FATTO`
- Note: il use case `report targa in preview` legge ora l'elenco mezzi reali dai layer anagrafici NEXT, mostra suggerimenti mentre si scrive e richiede selezione o match esatto prima di avviare la preview.
- File/documenti collegati:
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-12_2307_patch_autosuggest-targhe-ia-interna.md`
  - `docs/continuity-reports/2026-03-12_2307_continuity_autosuggest-targhe-ia-interna.md`
- Dipendenze o blocchi:
  - la chat interna non e stata riallineata a questo autosuggest nello stesso task per evitare accoppiamento tra patch separate;
  - la preview resta comunque solo in lettura e confinata ai layer NEXT.

### L.3 Memoria operativa locale IA / tracking interno non invasivo
- Stato: `FATTO`
- Note: il sottosistema IA conserva ora in locale ultime targhe e ultimi autisti cercati, prompt chat recenti, artifact recenti, intenti usati e ultimo stato di lavoro, con tracking limitato al solo perimetro `/next/ia/interna*`.
- File/documenti collegati:
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-13_0018_patch_memoria-operativa-locale-ia.md`
  - `docs/continuity-reports/2026-03-13_0018_continuity_memoria-operativa-locale-ia.md`
- Dipendenze o blocchi:
  - non e memoria operativa completa del gestionale, ma solo memoria locale del modulo IA;
  - nessun backend reale, nessuna persistenza business, nessun tracking globale fuori dal sottosistema IA.

### L.4 Ricerca guidata autisti / report autista read-only
- Stato: `FATTO`
- Note: il sottosistema IA espone ora un flusso separato per autista con lookup guidato su `@colleghi`, autosuggest reale, preview report in sola lettura, fonti esplicitate, dati mancanti e differenziazione chiara rispetto al report targa.
- Nota manutentiva 2026-03-13: il blocco rifornimenti del report autista estende ora il perimetro di lettura ai mezzi osservati dai segnali D10 dello stesso autista, oltre ai mezzi associati in anagrafica, per evitare omissioni strutturali sui rifornimenti recenti.
- File/documenti collegati:
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-13_1159_patch_report-autista-ia-interna.md`
  - `docs/continuity-reports/2026-03-13_1159_continuity_report-autista-ia-interna.md`
- Dipendenze o blocchi:
  - il lookup primario resta confinato al dominio `D01` (`@colleghi` + anagrafiche flotta);
  - i segnali operativi autista usano solo layer NEXT gia esistenti (`D10` e `D04`) con limiti espliciti, senza import raw del dominio `D03`;
  - nessuna scrittura business, nessun backend IA reale, nessun riuso runtime IA legacy.

### L.5 Filtri temporali / contesto periodo sui report read-only
- Stato: `FATTO`
- Note: il sottosistema IA supporta ora un contesto periodo condiviso per report targa e report autista, con preset rapidi, intervallo personalizzato, applicazione reale solo sulle sezioni con data leggibile e note esplicite sulle sezioni fuori filtro.
- File/documenti collegati:
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-13_1240_patch_filtri-temporali-report-ia-interna.md`
  - `docs/continuity-reports/2026-03-13_1240_continuity_filtri-temporali-report-ia-interna.md`
- Dipendenze o blocchi:
  - il filtro periodo viene applicato solo dove il layer espone timestamp o data leggibile in modo verificabile;
  - identita anagrafiche, mezzi associati e alcuni blocchi di contesto restano visibili ma dichiarati fuori filtro;
  - nessuna scrittura business, nessun backend IA reale, nessun riuso runtime IA legacy.

### L.6 Report combinato mezzo + autista + periodo read-only
- Stato: `FATTO`
- Note: il sottosistema IA espone ora una terza preview che riusa i report singoli di mezzo e autista, applica lo stesso contesto periodo e rende esplicita l'affidabilita del legame mezzo-autista (`forte`, `plausibile`, `non dimostrabile`) senza inventare match certi.
- File/documenti collegati:
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-13_1304_patch_report-combinato-mezzo-autista-periodo-ia-interna.md`
  - `docs/continuity-reports/2026-03-13_1304_continuity_report-combinato-ia-interna.md`
- Dipendenze o blocchi:
  - il legame `forte` e dichiarato solo quando `autistaId` del mezzo coincide con l'autista selezionato nel dominio anagrafico D01;
  - i segnali D10 e D04 possono solo rafforzare una plausibilita gia leggibile o mostrare una intersezione reale nel periodo, ma non vengono presentati come prova certa se manca il match anagrafico forte;
  - nessuna scrittura business, nessun backend IA reale, nessun riuso runtime IA legacy.

### L.7 Archivio intelligente artifact IA / ricerca e filtri scalabili
- Stato: `FATTO`
- Note: l'archivio locale del sottosistema IA supporta ora ricerca testuale veloce, filtri combinabili per tipo/stato/ambito/targa/autista/periodo, riapertura diretta della preview corretta e memorizzazione locale dell'ultima consultazione archivio.
- File/documenti collegati:
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-13_1414_patch_archivio-intelligente-artifact-ia-interna.md`
  - `docs/continuity-reports/2026-03-13_1414_continuity_archivio-intelligente-artifact-ia-interna.md`
- Dipendenze o blocchi:
  - le famiglie/ambiti sono derivate solo dai dataset gia letti dai report esistenti e usano fallback `misto` o `non classificato` quando i metadati non bastano;
  - non esiste ancora persistenza server-side dedicata per gli artifact IA;
  - nessuna scrittura business, nessun backend IA reale, nessun riuso runtime IA legacy.

### L.8 Audit strutturale lettura/incrocio dati IA
- Stato: `FATTO`
- Note: eseguito audit mirato dei facade IA interni e dei layer NEXT realmente usati per report mezzo, report autista, report combinato, lookup, filtri periodo e chat mock. L'audit conferma come blocchi solidi il riuso dei layer NEXT read-only e la dichiarazione esplicita dei limiti periodo, ma segnala come priorita aperte:
  - matching badge/nome ancora rigido in `report autista` e `report combinato`;
  - lookup/autista e fallback nome potenzialmente fragili in caso di omonimie;
  - contesto mezzi autista ancora piu ricco nei rifornimenti che nell'intestazione/lookup;
  - chat mock con parsing periodo su autista corretto subito nello stesso task.
- File/documenti collegati:
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-13_1448_audit_strutturale-lettura-incrocio-dati-ia.md`
  - `docs/continuity-reports/2026-03-13_1448_continuity_audit-strutturale-dati-ia.md`
- Dipendenze o blocchi:
  - per correggere i match badge/nome senza falsi positivi serve un task dedicato, non un allargamento improvvisato del fix;
  - il dominio D05 materiali resta esplicitamente parziale e fuori filtro periodo nei report mezzo;
  - nessuna scrittura business, nessun backend IA reale, nessun riuso runtime IA legacy.

### L.9 Matching autista badge-first cross-layer
- Stato: `FATTO`
- Note: il sottosistema IA applica ora una regola unica e riusabile per il matching identita autista tra D01, D04 e D10:
  - `autistaId` o badge coerente = match forte;
  - nome esatto = fallback plausibile solo quando il riferimento forte manca davvero;
  - badge o `autistaId` incoerenti = match non dimostrabile, senza promuovere il nome a conferma certa.
- File/documenti collegati:
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-13_1515_patch_matching-autista-badge-first-cross-layer.md`
  - `docs/continuity-reports/2026-03-13_1515_continuity_matching-autista-badge-first-cross-layer.md`
- Dipendenze o blocchi:
  - il fallback per nome resta volutamente prudente e non risolve ancora i casi di omonimia complessa;
  - i report continuano a dipendere dalla presenza reale di badge o nome coerenti nei layer D04 e D10;
  - nessuna scrittura business, nessun backend IA reale, nessun riuso runtime IA legacy.

### L.10 Audit / rafforzamento strutturale report mezzo
- Stato: `FATTO`
- Note: eseguito audit mirato del `report targa` read-only sui blocchi lavori, manutenzioni/gomme, rifornimenti, materiali/movimenti, documenti/costi e analisi economica salvata. Il task conferma come punti solidi il riuso del composito `readNextDossierMezzoCompositeSnapshot`, il filtro periodo applicato ai blocchi con data affidabile e la ricostruzione D04 gia prudente, ma registra come limiti strutturali aperti:
  - eventi gomme fuori `@manutenzioni` non ancora incorporati nel report mezzo;
  - movimenti materiali ancora dipendenti da match `targa` / `destinatario` legacy e quindi dichiarati solo come copertura parziale;
  - procurement `@preventivi` e approvazioni fuori perimetro clone-safe del blocco documenti/costi.
- Fix minimo applicato nello stesso task:
  - il report mezzo considera ora anche movimenti materiali e analisi economica salvata come segnali reali di copertura, evitando di marcare la preview come troppo debole quando questi blocchi sono gli unici disponibili;
  - la sezione `Documenti, costi e analisi` non viene piu presentata come vuota quando l'analisi economica legacy e disponibile anche in assenza di documenti/costi nel periodo.
- File/documenti collegati:
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-13_1533_audit-rafforzamento-report-mezzo-ia.md`
  - `docs/continuity-reports/2026-03-13_1533_continuity_report-mezzo-ia.md`
- Dipendenze o blocchi:
  - per includere altri eventi gomme serve un task separato sul layer dedicato, non un fallback improvvisato nel facade IA;
  - i movimenti materiali restano fuori filtro periodo finche il matching temporale e il link mezzo non sono uniformi a livello di dominio;
  - il blocco documenti/costi resta volutamente senza `@preventivi` e `@preventivi_approvazioni`, coerentemente con il perimetro clone-safe attuale.

### L.11 Audit / rafforzamento strutturale blocco gomme report mezzo
- Stato: `FATTO`
- Note: il blocco gomme del `report targa` non dipende piu solo dalle manutenzioni derivate. Il layer `nextManutenzioniGommeDomain` converge ora in sola lettura anche:
  - `@cambi_gomme_autisti_tmp`;
  - `@gomme_eventi`.
  Regola applicata:
  - match forte sul mezzo con `targetTarga` o `targa`;
  - match plausibile solo da campi di contesto (`targaCamion`, `targaRimorchio`, `contesto.*`) quando manca una targa diretta;
  - nessun match contestuale viene promosso a certezza.
  Il task deduplica inoltre gli eventi extra gia importati nelle manutenzioni solo quando coincidono davvero su giorno, targa, asse, marca e km, e rende piu trasparente nel report mezzo la differenza tra eventi gomme forti e plausibili.
- File/documenti collegati:
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-13_1612_audit-rafforzamento-blocco-gomme-report-mezzo-ia.md`
  - `docs/continuity-reports/2026-03-13_1612_continuity_blocco-gomme-report-mezzo-ia.md`
- Dipendenze o blocchi:
  - gli eventi gomme solo contestuali restano al massimo plausibili e non diventano conferme forti del mezzo;
  - i record gomme senza targa diretta o senza contesto coerente restano fuori dal report;
  - la deduplica con le manutenzioni resta volutamente prudente e non prova a fondere eventi quando i campi chiave non coincidono davvero.

### L.12 Ripristino build / risoluzione conflitto merge pagina IA interna
- Stato: `FATTO`
- Note: rimossi i conflict marker residui che rompevano `src/next/NextInternalAiPage.tsx` e i file IA interni strettamente collegati al merge. Il ripristino riporta il clone a uno stato compilabile senza cambiare logica dati, writer business o perimetro `read-only`.
- File/documenti collegati:
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/internal-ai/internalAiTypes.ts`
  - `src/next/internal-ai/internalAiVehicleReportFacade.ts`
  - `src/next/internal-ai/internalAiChatOrchestrator.ts`
  - `src/next/internal-ai/internal-ai.css`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-22_0916_fix_ripristino-build-merge-ia-interna.md`
  - `docs/continuity-reports/2026-03-22_0916_continuity_ripristino-build-merge-ia-interna.md`
- Dipendenze o blocchi:
  - nessuna scrittura business riaperta;
  - nessun impatto sui layer dati del clone oltre al riallineamento tipizzato necessario per la build;
  - eventuali estensioni future della home IA interna vanno fatte con task separato, non dentro fix di ripristino.

### L.13 Primo assorbimento preview-first capability legacy documenti
- Stato: `FATTO`
- Note: aperto il primo blocco `Documenti IA` nella home `/next/ia/interna` con perimetro prudente, read-only e reversibile. Il task introduce:
  - facade dedicata `internalAiDocumentsPreviewFacade`;
  - contratto stub `documents-preview`;
  - preview UI secondaria che distingue documenti `diretti`, `plausibili` e `fuori perimetro`.
- Perimetro sicuro scelto:
  - `@documenti_mezzi` e record gia mezzo-centrici di `@costiMezzo` come base diretta;
  - `@documenti_magazzino` e `@documenti_generici` solo come supporto plausibile quando la targa e gia leggibile nel layer clone-safe;
  - nessun OCR reale, nessun upload Storage, nessuna scrittura su `@documenti_*`.
- File/documenti collegati:
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/internal-ai/internalAiTypes.ts`
  - `src/next/internal-ai/internalAiContracts.ts`
  - `src/next/internal-ai/internalAiDocumentsPreviewFacade.ts`
  - `docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md`
  - `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-22_0945_preview-documenti-ia-interna.md`
  - `docs/continuity-reports/2026-03-22_0945_continuity_preview-documenti-ia-interna.md`
- Verifiche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiDocumentsPreviewFacade.ts` -> OK
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - procurement, approvazioni e preventivi globali restano fuori dal backend canonico del blocco documenti;
  - OCR/upload/classificazione legacy restano da rifare su backend dedicato in task successivo;
  - provider reali e segreti lato client restano esplicitamente fuori perimetro.

### L.14 Primo assorbimento preview-first capability legacy libretto
- Stato: `FATTO`
- Note: aperto il primo blocco `Libretto IA` nella home `/next/ia/interna` con perimetro prudente, read-only e reversibile. Il task introduce:
  - facade dedicata `internalAiLibrettoPreviewFacade`;
  - contratto stub `libretto-preview`;
  - preview UI secondaria che distingue dati `diretti`, `plausibili` e `fuori perimetro`.
- Perimetro sicuro scelto:
  - campi gia presenti sul mezzo in `@mezzi_aziendali` come base diretta del blocco libretto;
  - supporto clone-safe del layer `nextLibrettiExportDomain` solo per verificare copertura file gia disponibile;
  - nessun OCR reale, nessun upload Storage, nessuna scrittura su `@mezzi_aziendali`.
- File/documenti collegati:
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/internal-ai/internalAiTypes.ts`
  - `src/next/internal-ai/internalAiContracts.ts`
  - `src/next/internal-ai/internalAiLibrettoPreviewFacade.ts`
  - `docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md`
  - `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-22_1003_preview-libretto-ia-interna.md`
  - `docs/continuity-reports/2026-03-22_1003_continuity_preview-libretto-ia-interna.md`
- Verifiche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiLibrettoPreviewFacade.ts` -> OK
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - OCR/Cloud Run/upload legacy restano fuori dal task e da rifare su backend dedicato futuro;
  - il blocco non apre ancora viewer PDF dedicato o artifact specifico del libretto;
  - provider reali e segreti lato client restano esplicitamente fuori perimetro.

### L.15 Primo assorbimento preview-first capability legacy preventivi
- Stato: `FATTO`
- Note: aperto il primo blocco `Preventivi IA` nella home `/next/ia/interna` con perimetro prudente, read-only e reversibile. Il task introduce:
  - facade dedicata `internalAiPreventiviPreviewFacade`;
  - contratto stub `preventivi-preview`;
  - preview UI secondaria che distingue preventivi `diretti`, `plausibili/supporti separati` e `fuori perimetro`.
- Perimetro sicuro scelto:
  - preventivi gia mezzo-centrici letti dal layer clone-safe `nextDocumentiCostiDomain` come base diretta;
  - supporto prudenziale da procurement globale e approvazioni solo come contesto separato read-only;
  - nessun parsing IA reale, nessun upload Storage, nessuna scrittura su `@preventivi`, `@preventivi_approvazioni` o `@documenti_*`.
- File/documenti collegati:
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/internal-ai/internalAiTypes.ts`
  - `src/next/internal-ai/internalAiContracts.ts`
  - `src/next/internal-ai/internalAiPreventiviPreviewFacade.ts`
  - `docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md`
  - `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-22_1020_preview-preventivi-ia-interna.md`
  - `docs/continuity-reports/2026-03-22_1020_continuity_preview-preventivi-ia-interna.md`
- Verifiche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiPreventiviPreviewFacade.ts` -> OK
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - parsing IA reale, upload e ingestione nuovi allegati restano fuori dal task e da rifare su backend dedicato futuro;
  - procurement globale e approvazioni restano solo supporto separato finche non esiste un layer mezzo-centrico dedicato;
  - workflow approvativo, PDF timbrati, provider reali e segreti lato client restano esplicitamente fuori perimetro.

## 6. Macrofase 3 - Blocchi e fondazioni ancora aperte
Stato macrofase: `IN CORSO`

### M. Backend IA dedicato e separato dai canali legacy
- Stato: `IN CORSO`
- Note: esiste ora un backend IA dedicato in `backend/internal-ai/*` con adapter server-side reale, retrieval read-only dedicato, primo workflow preview/approval/rollback e primo uso reale di `OpenAI` solo lato server. I ponti attivi oggi collegano `chat-orchestrator`, `documents-preview`, `economic-analysis-preview`, `libretto-preview`, `preventivi-preview`, `vehicle-report-preview`, `driver-report-preview` e `combined-report-preview`; in piu la chat puo usare un primo livello controllato di comprensione repo/UI via snapshot curata e read-only, ora estesa anche a un indice filesystem controllato di codice/CSS, relazioni madre vs NEXT e audit di readiness Firebase.
- File/documenti collegati:
  - `backend/internal-ai/README.md`
  - `backend/internal-ai/tsconfig.json`
  - `backend/internal-ai/src/internalAiBackendContracts.ts`
  - `backend/internal-ai/src/internalAiBackendHandlers.ts`
  - `backend/internal-ai/src/internalAiBackendService.ts`
  - `backend/internal-ai/src/internalAiServerPersistenceContracts.ts`
  - `backend/internal-ai/server/internal-ai-adapter.js`
  - `backend/internal-ai/server/internal-ai-persistence.js`
  - `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-22_1110_scaffolding-backend-ia-separato.md`
  - `docs/continuity-reports/2026-03-22_1110_continuity_scaffolding-backend-ia-separato.md`
- Dipendenze o blocchi:
  - adapter deploy condiviso oltre il localhost ancora da decidere;
  - strategia segreti lato server assente nel repo;
  - policy Firestore/Storage effettive ancora non versionate nel repo;
  - nessun access layer backend reale verso Firestore o Storage business ancora collegato;
  - il repo understanding non e ancora una scansione completa di AST, component tree e dipendenze runtime.

### M.1 Primo ponte frontend -> backend IA separato mock-safe
- Stato: `FATTO`
- Note: la capability `documents-preview` passa ora prima dal backend IA separato tramite il dispatcher mock-safe `orchestrator.preview`, con fallback locale clone-safe esplicito se il ponte non e pronto.
- File/documenti collegati:
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/internal-ai/internalAiContracts.ts`
  - `src/next/internal-ai/internalAiDocumentsPreviewBridge.ts`
  - `backend/internal-ai/tsconfig.json`
  - `backend/internal-ai/src/internalAiBackendContracts.ts`
  - `backend/internal-ai/src/internalAiBackendHandlers.ts`
  - `backend/internal-ai/src/internalAiBackendService.ts`
  - `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-22_1121_ponte-frontend-backend-mock-safe-documenti-ia.md`
  - `docs/continuity-reports/2026-03-22_1121_continuity_ponte-backend-mock-safe-documenti-ia.md`
- Verifiche eseguite:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiDocumentsPreviewBridge.ts src/next/internal-ai/internalAiContracts.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts` -> OK
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - il ponte e ancora in-process e non sostituisce l'adapter server-side reale;
  - `libretto-preview`, `preventivi-preview`, `report targa`, `analisi economica` e chat restano ancora solo frontend/mock locale;
  - provider reali, segreti e scritture business restano esclusi.

### M.2 Secondo ponte frontend -> backend IA separato mock-safe
- Stato: `FATTO`
- Note: la capability `economic-analysis-preview` passa ora prima dal backend IA separato tramite il dispatcher mock-safe `orchestrator.preview`, con fallback locale clone-safe esplicito se il ponte non e pronto.
- File/documenti collegati:
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/internal-ai/internalAiContracts.ts`
  - `src/next/internal-ai/internalAiEconomicAnalysisPreviewBridge.ts`
  - `backend/internal-ai/src/internalAiBackendContracts.ts`
  - `backend/internal-ai/src/internalAiBackendHandlers.ts`
  - `backend/internal-ai/src/internalAiBackendService.ts`
  - `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-22_1142_ponte-backend-mock-safe-analisi-economica-ia.md`
  - `docs/continuity-reports/2026-03-22_1142_continuity_ponte-backend-analisi-economica-ia.md`
- Verifiche eseguite:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiEconomicAnalysisPreviewBridge.ts src/next/internal-ai/internalAiContracts.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts` -> OK
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - il ponte resta in-process e non sostituisce l'adapter server-side reale;
  - `libretto-preview`, `preventivi-preview`, `report targa`, `report autista`, `report combinato` e chat restano ancora solo frontend/mock locale;
  - provider reali, segreti e scritture business restano esclusi.

### M.3 Terzo e quarto ponte frontend -> backend IA separato mock-safe
- Stato: `FATTO`
- Note: le capability `libretto-preview` e `preventivi-preview` passano ora prima dal backend IA separato tramite il dispatcher mock-safe `orchestrator.preview`, con fallback locale clone-safe esplicito se il ponte non e pronto.
- File/documenti collegati:
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/internal-ai/internalAiContracts.ts`
  - `src/next/internal-ai/internalAiLibrettoPreviewBridge.ts`
  - `src/next/internal-ai/internalAiPreventiviPreviewBridge.ts`
  - `backend/internal-ai/tsconfig.json`
  - `backend/internal-ai/src/internalAiBackendContracts.ts`
  - `backend/internal-ai/src/internalAiBackendHandlers.ts`
  - `backend/internal-ai/src/internalAiBackendService.ts`
  - `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
  - `docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-22_1158_ponte-backend-mock-safe-libretto-preventivi-ia.md`
  - `docs/continuity-reports/2026-03-22_1158_continuity_ponte-backend-libretto-preventivi-ia.md`
- Verifiche eseguite:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiLibrettoPreviewBridge.ts src/next/internal-ai/internalAiPreventiviPreviewBridge.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts` -> OK
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - i ponti restano in-process e non sostituiscono l'adapter server-side reale;
  - `report targa`, `report autista`, `report combinato` e chat restano ancora solo frontend/mock locale;
  - provider reali, segreti e scritture business restano esclusi.

### M.4 Quinto, sesto e settimo ponte frontend -> backend IA separato mock-safe
- Stato: `FATTO`
- Note: le capability `vehicle-report-preview`, `driver-report-preview` e `combined-report-preview` passano ora prima dal backend IA separato tramite il dispatcher mock-safe `orchestrator.preview`, con fallback locale clone-safe esplicito se il ponte non e pronto.
- File/documenti collegati:
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/internal-ai/internalAiContracts.ts`
  - `src/next/internal-ai/internalAiVehicleReportPreviewBridge.ts`
  - `src/next/internal-ai/internalAiDriverReportPreviewBridge.ts`
  - `src/next/internal-ai/internalAiCombinedReportPreviewBridge.ts`
  - `backend/internal-ai/src/internalAiBackendContracts.ts`
  - `backend/internal-ai/src/internalAiBackendHandlers.ts`
  - `backend/internal-ai/src/internalAiBackendService.ts`
  - `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-22_1214_ponte-backend-mock-safe-report-ia.md`
  - `docs/continuity-reports/2026-03-22_1214_continuity_ponte-backend-report-ia.md`
- Verifiche eseguite:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiVehicleReportPreviewBridge.ts src/next/internal-ai/internalAiDriverReportPreviewBridge.ts src/next/internal-ai/internalAiCombinedReportPreviewBridge.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts` -> OK
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - i ponti restano in-process e non sostituiscono l'adapter server-side reale;
  - chat interna controllata resta ancora solo frontend/mock locale in questo step storico;
  - lookup/autosuggest restano supporti frontend clone-safe;
  - provider reali, segreti e scritture business restano esclusi.

### M.5 Ottavo ponte frontend -> backend IA separato mock-safe
- Stato: `FATTO`
- Note: la `chat interna controllata` passa ora prima dal backend IA separato tramite il dispatcher mock-safe `orchestrator.chat`, con fallback locale clone-safe esplicito se il ponte non e pronto. La logica dati letta resta invariata e le capability gia aperte vengono orchestrate dal nuovo canale backend-first.
- File/documenti collegati:
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/internal-ai/internalAiContracts.ts`
  - `src/next/internal-ai/internalAiChatOrchestratorBridge.ts`
  - `backend/internal-ai/src/internalAiBackendContracts.ts`
  - `backend/internal-ai/src/internalAiBackendHandlers.ts`
  - `backend/internal-ai/src/internalAiBackendService.ts`
  - `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-22_1229_ponte-backend-mock-safe-chat-ia.md`
  - `docs/continuity-reports/2026-03-22_1229_continuity_ponte-backend-chat-ia.md`
- Verifiche eseguite:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts` -> OK
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - il ponte resta in-process e non sostituisce l'adapter server-side reale;
  - lookup/autosuggest restano supporti frontend clone-safe;
  - provider reali, segreti e scritture business restano esclusi.

### M.6 Primo adapter server-side reale + persistenza IA dedicata
- Stato: `FATTO`
- Note: il backend IA separato ha ora un primo adapter HTTP reale in `backend/internal-ai/server/internal-ai-adapter.js` e una persistenza server-side dedicata in `backend/internal-ai/runtime-data/*`. Il frontend IA usa il nuovo livello solo per hydration e mirror di `artifact-repository`, `memory-repository` e traceability minima, con fallback locale esplicito se l'adapter non e disponibile.
- File/documenti collegati:
  - `backend/internal-ai/README.md`
  - `backend/internal-ai/server/internal-ai-adapter.js`
  - `backend/internal-ai/server/internal-ai-persistence.js`
  - `backend/internal-ai/runtime-data/.gitignore`
  - `backend/internal-ai/runtime-data/.gitkeep`
  - `backend/internal-ai/src/internalAiServerPersistenceContracts.ts`
  - `backend/internal-ai/src/internalAiBackendContracts.ts`
  - `backend/internal-ai/src/internalAiBackendService.ts`
  - `backend/internal-ai/src/index.ts`
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/internal-ai/internalAiTypes.ts`
  - `src/next/internal-ai/internalAiContracts.ts`
  - `src/next/internal-ai/internalAiMockRepository.ts`
  - `src/next/internal-ai/internalAiTracking.ts`
  - `src/next/internal-ai/internalAiServerPersistenceClient.ts`
  - `src/next/internal-ai/internalAiServerPersistenceBridge.ts`
  - `package.json`
  - `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/STATO_ATTUALE_PROGETTO.md`
  - `docs/change-reports/2026-03-22_1255_adapter-server-side-persistenza-ia-dedicata.md`
  - `docs/continuity-reports/2026-03-22_1255_continuity_adapter-server-side-persistenza-ia-dedicata.md`
- Verifiche eseguite:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiMockRepository.ts src/next/internal-ai/internalAiTracking.ts src/next/internal-ai/internalAiServerPersistenceClient.ts src/next/internal-ai/internalAiServerPersistenceBridge.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendService.ts backend/internal-ai/src/internalAiServerPersistenceContracts.ts` -> OK
  - smoke test adapter `health/read/write` via import Node locale -> OK
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - provider reali e segreti restano esplicitamente fuori perimetro;
  - retrieval server-side di repo/Firestore/Storage business resta non attivo;
  - identita utente reale e policy infrastrutturali restano da chiudere in task separato.

### M.7 Primo retrieval server-side controllato e read-only
- Stato: `FATTO`
- Note: il backend IA separato espone ora un primo retrieval server-side su `retrieval.read`, ma in forma dichiaratamente prudente e reversibile. Il perimetro attivo e solo `D01/@mezzi_aziendali` con snapshot read-only seedato dal clone e persistito nel contenitore IA dedicato; la prima capability che lo usa e `libretto-preview`, con fallback locale esplicito se l'adapter o lo snapshot non sono disponibili.
- File/documenti collegati:
  - `backend/internal-ai/README.md`
  - `backend/internal-ai/server/internal-ai-adapter.js`
  - `backend/internal-ai/server/internal-ai-persistence.js`
  - `backend/internal-ai/src/internalAiBackendContracts.ts`
  - `backend/internal-ai/src/internalAiBackendHandlers.ts`
  - `backend/internal-ai/src/internalAiBackendService.ts`
  - `backend/internal-ai/src/internalAiServerPersistenceContracts.ts`
  - `backend/internal-ai/src/internalAiServerRetrievalContracts.ts`
  - `backend/internal-ai/src/index.ts`
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/internal-ai/internalAiContracts.ts`
  - `src/next/internal-ai/internalAiLibrettoPreviewFacade.ts`
  - `src/next/internal-ai/internalAiLibrettoPreviewBridge.ts`
  - `src/next/internal-ai/internalAiServerRetrievalClient.ts`
  - `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/STATO_ATTUALE_PROGETTO.md`
  - `docs/change-reports/2026-03-22_1331_retrieval-server-side-read-only-ia.md`
  - `docs/continuity-reports/2026-03-22_1331_continuity_retrieval-server-side-read-only-ia.md`
- Verifiche eseguite:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiLibrettoPreviewFacade.ts src/next/internal-ai/internalAiLibrettoPreviewBridge.ts src/next/internal-ai/internalAiServerRetrievalClient.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts backend/internal-ai/src/internalAiServerPersistenceContracts.ts backend/internal-ai/src/internalAiServerRetrievalContracts.ts` -> OK
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK
  - smoke test adapter `retrieval.read` via Node locale su porta dedicata `4311` -> OK
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - il retrieval server-side legge ancora uno snapshot seedato dal clone, non Firestore business diretto;
  - libretto e l'unica capability che usa oggi il retrieval server-side reale;
  - domini documenti/costi/procurement, lookup globali, provider reali e segreti restano fuori perimetro.

### M.8 Primo provider reale server-side + primo workflow preview/approval/rollback
- Stato: `FATTO`
- Note: il backend IA separato apre ora il primo collegamento strutturale a un provider reale lato server tramite `OpenAI Responses API`, ma confinato a un solo caso d'uso sicuro: `sintesi guidata di un report gia letto` nel clone IA interno. L'output resta solo proposta testuale, viene salvato nel contenitore IA dedicato e richiede approvazione esplicita; il rollback agisce solo sul workflow IA, mai sui dati business. Il `2026-03-22` il flusso reale end-to-end e stato verificato con `OPENAI_API_KEY` presente a livello utente Windows e letta lato server solo tramite `process.env.OPENAI_API_KEY`. Se la chiave manca nel processo server-side o il provider fallisce, il clone continua con i fallback mock-safe gia esistenti.
- File/documenti collegati:
  - `backend/internal-ai/README.md`
  - `backend/internal-ai/server/internal-ai-adapter.js`
  - `backend/internal-ai/server/internal-ai-persistence.js`
  - `backend/internal-ai/src/internalAiBackendContracts.ts`
  - `backend/internal-ai/src/internalAiBackendService.ts`
  - `backend/internal-ai/src/internalAiServerPersistenceContracts.ts`
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/internal-ai/internalAiContracts.ts`
  - `src/next/internal-ai/internalAiServerReportSummaryClient.ts`
  - `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/STATO_ATTUALE_PROGETTO.md`
  - `docs/change-reports/2026-03-22_1349_provider-reale-preview-approval-rollback-ia.md`
  - `docs/continuity-reports/2026-03-22_1349_continuity_provider-reale-preview-approval-rollback-ia.md`
- Verifiche eseguite:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiServerReportSummaryClient.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendService.ts backend/internal-ai/src/internalAiServerPersistenceContracts.ts` -> OK
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK
  - smoke test adapter `health` + `artifacts.preview` con esito `provider_not_configured` senza segreto -> OK
  - smoke test reale `health` con `providerEnabled: true` su processo server-side dedicato -> OK
  - smoke test reale `artifacts.preview` con `gpt-5-mini` -> OK
  - smoke test reali `approve_preview`, `reject_preview` e `rollback_preview` su workflow IA dedicato -> OK
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - il primo caso d'uso reale riguarda solo sintesi testuali di report gia letti, non generazione nuovi dati o scritture business;
  - la shell corrente puo non ereditare automaticamente la variabile ambiente utente Windows e richiedere bootstrap esplicito del processo server-side;
  - chat reale, OCR, upload, parsing documentale, retrieval business completo e qualunque writer Firestore/Storage restano fuori perimetro.

### M.9 Chat reale controllata + primo repo/UI understanding
- Stato: `FATTO`
- Note: la chat interna usa ora il provider reale lato server tramite `orchestrator.chat`, con fallback locale clone-safe se adapter o provider non sono disponibili. Nello stesso backend IA separato e stato aperto il primo livello di comprensione controllata del repository e della UI tramite snapshot curata `read_repo_understanding_snapshot`, visibile nella overview di `/next/ia/interna` e riusabile dalla chat per spiegare moduli, route, pattern UI e relazioni tra schermate. Nessuna patch automatica del repository, nessuna scrittura business e nessun riuso dei backend legacy come canale canonico.
- File/documenti collegati:
  - `backend/internal-ai/README.md`
  - `backend/internal-ai/server/internal-ai-adapter.js`
  - `backend/internal-ai/server/internal-ai-repo-understanding.js`
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/internal-ai/internalAiChatOrchestrator.ts`
  - `src/next/internal-ai/internalAiChatOrchestratorBridge.ts`
  - `src/next/internal-ai/internalAiContracts.ts`
  - `src/next/internal-ai/internalAiServerChatClient.ts`
  - `src/next/internal-ai/internalAiServerRepoUnderstandingClient.ts`
  - `src/next/internal-ai/internalAiLibrettoPreviewBridge.ts`
  - `src/next/internal-ai/internalAiTypes.ts`
  - `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/STATO_ATTUALE_PROGETTO.md`
  - `docs/change-reports/2026-03-22_1533_patch_chat-reale-repo-understanding-ia.md`
  - `docs/continuity-reports/2026-03-22_1533_continuity_chat-reale-repo-understanding-ia.md`
- Verifiche eseguite:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiServerChatClient.ts src/next/internal-ai/internalAiServerRepoUnderstandingClient.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiLibrettoPreviewBridge.ts` -> OK
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK
  - smoke test adapter `retrieval.read` + `orchestrator.chat` senza segreto nel processo server-side -> fallback `provider_not_configured` confermato, nessuna scrittura business
  - smoke test reale `health` + `retrieval.read(read_repo_understanding_snapshot)` + `orchestrator.chat` repo/UI-aware + `orchestrator.chat` con `reportContext` su processo server-side dedicato con `OPENAI_API_KEY` -> OK
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - la comprensione repo/UI e curata e parziale, non una scansione completa del repository;
  - lookup/autosuggest e altri supporti restano frontend/in-process;
  - la shell locale puo richiedere bootstrap esplicito del processo server-side per ereditare `OPENAI_API_KEY` a livello utente Windows.

### M.10 Estensione controllata repo understanding + audit readiness Firebase
- Stato: `FATTO`
- Note: il backend IA separato costruisce ora una snapshot repo/UI piu ricca ma ancora controllata, che include:
  - indice filesystem limitato di file `src/next`, `src/pages`, `src/components` e `backend/internal-ai`;
  - relazioni CSS importate tra file UI e fogli stile;
  - relazioni curate tra madre legacy e NEXT;
  - audit di readiness per Firestore/Storage read-only lato server.
- Cosa apre davvero questo step:
  - la chat e la overview IA possono leggere meglio codice, route-like file, componenti e CSS senza una scansione indiscriminata del repo;
  - l'audit espone in modo verificato cosa manca prima di aprire Firestore/Storage read-only lato server nel backend IA separato.
- Cosa NON apre ancora:
  - nessuna lettura diretta Firestore business lato server;
  - nessuna lettura diretta Storage business lato server;
  - nessuna modifica automatica della madre o del repository.
- File/documenti collegati:
  - `backend/internal-ai/server/internal-ai-repo-understanding.js`
  - `backend/internal-ai/server/internal-ai-adapter.js`
  - `backend/internal-ai/server/internal-ai-persistence.js`
  - `backend/internal-ai/src/internalAiServerRetrievalContracts.ts`
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/internal-ai/internalAiContracts.ts`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/STATO_ATTUALE_PROGETTO.md`
  - `docs/change-reports/2026-03-22_1711_audit-repo-readiness-firebase-ia.md`
  - `docs/continuity-reports/2026-03-22_1711_continuity_audit-repo-readiness-firebase-ia.md`
- Verifiche eseguite:
  - `node --check backend/internal-ai/server/internal-ai-repo-understanding.js` -> OK
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiServerRepoUnderstandingClient.ts backend/internal-ai/src/internalAiServerRetrievalContracts.ts backend/internal-ai/server/internal-ai-adapter.js backend/internal-ai/server/internal-ai-repo-understanding.js` -> OK
  - smoke test `buildRepoUnderstandingSnapshot()` -> OK
  - smoke test `POST /internal-ai-backend/retrieval/read` con `read_repo_understanding_snapshot` -> OK
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - per Firestore read-only servono access layer dedicato, credenziale server-side separata e matrice collection/query consentite;
  - per Storage read-only servono path/bucket ammessi, identita server-side dedicata e decisione sulle policy effettive;
  - l'indice repo resta metadata-driven e non sostituisce una comprensione completa di AST, bundle e dipendenze runtime.

### M.11 Esperienza conversazionale controllata + report come artifact documentale
- Stato: `FATTO`
- Note: la pagina `/next/ia/interna` non si presenta piu come pannello tecnico primario ma come chat controllata piu leggibile, con:
  - input libero multilinea;
  - thread messaggi utente/assistente piu chiaro;
  - card laterali leggere per backend server-side, OpenAI lato server, repo understanding e retrieval business read-only parziale;
  - richieste report che producono un artifact dedicato e una vera anteprima PDF client-side in modale, invece di riversare il report completo nel thread.
- Cosa apre davvero questo step:
  - esperienza piu vicina a un assistente interno del gestionale, senza allargare il perimetro tecnico;
  - riapertura rapida dell'anteprima report da chat o archivio artifact;
  - copia del contenuto strutturato, download PDF e condivisione browser del PDF quando supportata.
- Cosa NON apre ancora:
  - nessuna scrittura business;
  - nessuna generazione PDF business o export fuori dal perimetro IA dedicato;
  - nessuna persistenza server-side del binario PDF come artifact separato;
  - nessuna modifica automatica del codice;
  - nessun uso del legacy come backend canonico.
- File/documenti collegati:
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/internal-ai/internalAiReportPdf.ts`
  - `src/next/internal-ai/internal-ai.css`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/STATO_ATTUALE_PROGETTO.md`
  - `docs/change-reports/2026-03-22_1834_chat-conversazionale-artifact-preview-ia.md`
  - `docs/continuity-reports/2026-03-22_1834_continuity_chat-conversazionale-artifact-preview-ia.md`
  - `docs/change-reports/2026-03-22_2013_report-pdf-reale-readiness-backend-ia.md`
  - `docs/continuity-reports/2026-03-22_2013_continuity_report-pdf-reale-readiness-backend-ia.md`
- Verifiche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiReportPdf.ts backend/internal-ai/server/internal-ai-firebase-readiness.js` -> OK
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - il PDF e generato al volo lato client dall'artifact IA gia salvato e non esiste ancora come file binario persistito lato server;
  - i report continuano a basarsi sugli stessi reader/fallback gia esistenti, senza nuovi writer o nuovi canali business.

### M.12 Readiness tipizzata + whitelist candidate per Firebase read-only
- Stato: `FATTO`
- Note: il backend IA separato non apre ancora letture business dirette di Firestore o Storage, ma espone ora una readiness piu precisa e riusabile dentro la snapshot repo/UI:
  - requisiti comuni verificati del bridge server-side (`package` dedicato, `firebase-admin`, credenziali server-side, regole versionate);
  - whitelist candidate esplicite ma non attive per il primo perimetro sicuro:
    - Firestore: solo documento `storage/@mezzi_aziendali`;
    - Storage: solo oggetto puntato dal valore esatto di `librettoStoragePath`, senza `listAll` o scansione per prefisso;
  - limiti dichiarati in UI sul fatto che il bridge Firebase read-only NON e ancora attivo.
- Aggiornamento verificato nello step corrente:
  - `backend/internal-ai/package.json` esiste ora come package dedicato del backend IA separato;
  - la readiness distingue esplicitamente tra `package` dedicato presente e `firebase-admin` ancora disponibile solo nei runtime legacy;
  - la UI resta onesta: nessun bridge Firebase/Storage business read-only viene dichiarato come attivo.
- File/documenti collegati:
  - `backend/internal-ai/package.json`
  - `backend/internal-ai/README.md`
  - `backend/internal-ai/server/internal-ai-firebase-readiness.js`
  - `backend/internal-ai/server/internal-ai-repo-understanding.js`
  - `backend/internal-ai/src/internalAiServerRetrievalContracts.ts`
  - `src/next/NextInternalAiPage.tsx`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/STATO_ATTUALE_PROGETTO.md`
  - `docs/change-reports/2026-03-22_1922_readiness-firebase-readonly-ia.md`
  - `docs/continuity-reports/2026-03-22_1922_continuity_readiness-firebase-readonly-ia.md`
  - `docs/change-reports/2026-03-22_2013_report-pdf-reale-readiness-backend-ia.md`
  - `docs/continuity-reports/2026-03-22_2013_continuity_report-pdf-reale-readiness-backend-ia.md`
- Verifiche eseguite:
  - `node --check backend/internal-ai/server/internal-ai-firebase-readiness.js` -> OK
  - `node --check backend/internal-ai/server/internal-ai-repo-understanding.js` -> OK
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiReportPdf.ts backend/internal-ai/server/internal-ai-firebase-readiness.js` -> OK
  - smoke test `buildFirebaseReadinessSnapshot()` -> OK
  - smoke test `POST /internal-ai-backend/retrieval/read` con `read_repo_understanding_snapshot` -> OK
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - manca ancora un vero adapter Firebase read-only nel backend IA separato;
  - `firebase-admin` non e ancora dichiarato nel package dedicato `backend/internal-ai/package.json`;
  - manca una credenziale server-side dedicata e verificata per il deploy target;
  - `firestore.rules` resta assente nel repo;
  - `storage.rules` versionato e in conflitto con l'uso legacy esteso di Storage.

### M.13 Osservatore runtime NEXT read-only + consigliatore integrazione UI/file
- Stato: `FATTO`
- Note: il backend IA separato e la pagina `/next/ia/interna` espongono ora un primo livello reale di osservazione runtime della NEXT e una matrice strutturale per consigliare dove integrare nuove funzioni nel gestionale.
- Cosa apre davvero questo step:
  - crawl Playwright passivo e limitato a route `/next/*` whitelistate;
  - screenshot locali, heading, card, tab, bottoni e link NEXT visibili sulle schermate osservate;
  - guida esplicita per scegliere modulo, superficie UI e file candidati in base al dominio (`mezzo-centrico`, `cockpit`, `operativita`, `procurement`, `autisti`, `documentale`, `IA interna`, `specialistico`);
  - disponibilita di queste informazioni sia nella UI clone sia nella snapshot repo/UI letta dal backend IA separato.
- Cosa NON apre ancora:
  - nessun click operativo, submit, upload o flusso distruttivo;
  - nessuna osservazione automatica della madre;
  - nessun bridge Firestore/Storage business live;
  - nessuna copertura completa di modali o route dinamiche che richiedono interazione.
- File/documenti collegati:
  - `scripts/internal-ai-observe-next-runtime.mjs`
  - `backend/internal-ai/server/internal-ai-next-runtime-observer.js`
  - `backend/internal-ai/server/internal-ai-repo-understanding.js`
  - `backend/internal-ai/server/internal-ai-adapter.js`
  - `backend/internal-ai/src/internalAiServerRetrievalContracts.ts`
  - `backend/internal-ai/runtime-data/.gitignore`
  - `package.json`
  - `package-lock.json`
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/internal-ai/internal-ai.css`
  - `src/next/internal-ai/internalAiServerRepoUnderstandingClient.ts`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/STATO_ATTUALE_PROGETTO.md`
  - `docs/change-reports/2026-03-22_2137_ui_runtime-observer-next-integration-guidance-ia.md`
  - `docs/continuity-reports/2026-03-22_2137_continuity_ui_runtime-observer-next-integration-guidance-ia.md`
- Verifiche eseguite:
  - `node --check backend/internal-ai/server/internal-ai-next-runtime-observer.js` -> OK
  - `node --check scripts/internal-ai-observe-next-runtime.mjs` -> OK
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiServerRepoUnderstandingClient.ts backend/internal-ai/src/internalAiServerRetrievalContracts.ts backend/internal-ai/server/internal-ai-next-runtime-observer.js backend/internal-ai/server/internal-ai-repo-understanding.js backend/internal-ai/server/internal-ai-adapter.js scripts/internal-ai-observe-next-runtime.mjs` -> OK
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npm run internal-ai:observe-next` -> OK
  - smoke test `read_repo_understanding_snapshot` + asset screenshot su adapter locale -> OK
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - la copertura runtime resta intenzionalmente parziale e non sostituisce una navigazione utente completa;
  - i dettagli dinamici `Dossier` e `Analisi Economica` restano dipendenti da link visibili nel crawl e oggi non sono garantiti;
  - Playwright osserva solo la NEXT locale e non abilita alcun bridge business live o azione distruttiva.

### M.14 Primo hook IA mezzo-centrico governato su Dossier Mezzo
- Stato: `FATTO`
- Note: la chat `/next/ia/interna` usa ora un primo catalogo capability mezzo-centrico governato sopra il Dossier clone-safe, senza aprire retrieval Firebase live largo e senza spargere logica nella pagina.
- Cosa apre davvero questo step:
  - planner dichiarativo `linguaggio libero -> capability governata` sopra targa, periodo, metriche, `groupBy`, output e limiti;
  - primo hook reale `Dossier mezzo` per richieste su singola targa, con fonti primarie nei read model NEXT e non nelle pagine UI;
  - capability gia governate nel perimetro mezzo-centrico:
    - stato sintetico Dossier mezzo;
    - preview documenti collegabili al mezzo;
    - riepilogo costi mezzo;
    - preview libretto mezzo;
    - preview preventivi collegabili al mezzo;
    - report mezzo PDF in anteprima;
  - riuso dei facade e del canale artifact/report gia esistenti, senza nuovi writer business.
- Cosa NON apre ancora:
  - nessun bridge Firestore/Storage business live aggiuntivo;
  - nessun procurement globale come backend canonico del mezzo;
  - nessuna scrittura business, nessuna modifica della madre, nessun OCR/upload.
- File/documenti collegati:
  - `src/next/internal-ai/internalAiTypes.ts`
  - `src/next/internal-ai/internalAiContracts.ts`
  - `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts`
  - `src/next/internal-ai/internalAiVehicleCapabilityPlanner.ts`
  - `src/next/internal-ai/internalAiVehicleDossierHookFacade.ts`
  - `src/next/internal-ai/internalAiChatOrchestrator.ts`
  - `src/next/NextInternalAiPage.tsx`
  - `docs/product/CHECKLIST_IA_INTERNA.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/STATO_ATTUALE_PROGETTO.md`
  - `docs/change-reports/2026-03-22_2204_hook-mezzo-centrico-dossier-capability-catalog-ia.md`
  - `docs/continuity-reports/2026-03-22_2204_continuity_hook-mezzo-centrico-dossier-capability-catalog-ia.md`
- Verifiche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts src/next/internal-ai/internalAiVehicleCapabilityPlanner.ts src/next/internal-ai/internalAiVehicleDossierHookFacade.ts` -> OK
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - il hook mezzo-centrico nasce sopra read model NEXT clone-safe; l'estensione server-side clone-seeded del Dossier e ora descritta in `M.16`, ma non equivale ancora a un bridge Firebase/Storage business live;
  - il riepilogo costi resta documentale/read-only e non va scambiato per contabilita o procurement live;
  - Firestore/Storage business read-only lato server restano bloccati dai prerequisiti gia documentati.

### M.15 Deep runtime observer NEXT + selettore formato output + guida integrazione evoluta
- Stato: `FATTO`
- Note: la nuova IA interna vede ora la NEXT in modo piu profondo tramite observer runtime read-only con stati whitelist-safe, sceglie in modo piu intelligente il formato di output della risposta e motiva meglio dove conviene integrare nuove funzioni nel gestionale.
- Cosa apre davvero questo step:
  - osservazione runtime piu ricca della NEXT con:
    - 19 route osservate davvero nel contenitore IA dedicato;
    - 23 screenshot runtime;
    - 4 stati read-only osservati su `Acquisti`;
    - route dinamiche mezzo-centriche risolte in modo governato:
      - `Dossier mezzo`;
      - `Analisi economica`;
      - `Dossier gomme`;
      - `Dossier rifornimenti`;
    - sottoroute `IA interna` osservate direttamente:
      - `sessioni`;
      - `richieste`;
      - `artifacts`;
      - `audit`;
  - selettore di formato output sopra il contesto della sessione/chat:
    - `chat_brief`;
    - `chat_structured`;
    - `report_pdf`;
    - `ui_integration_proposal`;
    - `next_integration_confirmation_required`;
  - guida di integrazione UI/flow/file piu motivata con:
    - superficie primaria;
    - superfici alternative;
    - confidenza;
    - route di evidenza;
    - anti-pattern da evitare;
    - ruoli file candidati.
- Cosa NON apre ancora:
  - nessuna copertura runtime totale della NEXT;
  - nessun click distruttivo, submit, upload o scrittura business;
  - nessun bridge Firestore/Storage business live;
  - nessuna modifica automatica dei moduli della NEXT o della madre.
- File/documenti collegati:
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/internal-ai/internalAiTypes.ts`
  - `src/next/internal-ai/internalAiOutputSelector.ts`
  - `src/next/internal-ai/internal-ai.css`
  - `backend/internal-ai/src/internalAiServerRetrievalContracts.ts`
  - `backend/internal-ai/server/internal-ai-next-runtime-observer.js`
  - `backend/internal-ai/server/internal-ai-repo-understanding.js`
  - `backend/internal-ai/server/internal-ai-adapter.js`
  - `scripts/internal-ai-observe-next-runtime.mjs`
  - `docs/product/CHECKLIST_IA_INTERNA.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/STATO_ATTUALE_PROGETTO.md`
  - `docs/change-reports/2026-03-22_2303_deep-runtime-observer-output-selector-next-ia.md`
  - `docs/continuity-reports/2026-03-22_2303_continuity_deep-runtime-observer-output-selector-next-ia.md`
- Verifiche eseguite:
  - `node --check backend/internal-ai/server/internal-ai-next-runtime-observer.js` -> OK
  - `node --check scripts/internal-ai-observe-next-runtime.mjs` -> OK
  - `node --check backend/internal-ai/server/internal-ai-repo-understanding.js` -> OK
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK
  - `npm run internal-ai:observe-next` -> OK
  - rebuild snapshot repo/UI server-side -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/internal-ai/internalAiContracts.ts backend/internal-ai/src/internalAiServerRetrievalContracts.ts backend/internal-ai/server/internal-ai-next-runtime-observer.js backend/internal-ai/server/internal-ai-repo-understanding.js backend/internal-ai/server/internal-ai-adapter.js scripts/internal-ai-observe-next-runtime.mjs` -> OK
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - la copertura runtime resta comunque parziale e limitata a stati esplicitamente whitelistati;
  - la scelta formato output e piu intelligente ma non trasforma la nuova IA in un agente che applica integrazioni;
  - Firestore/Storage business read-only lato server restano bloccati dai prerequisiti gia documentati.

### M.16 Estensione hook mezzo-centrico con retrieval Dossier server-side clone-seeded
- Stato: `FATTO`
- Note: il primo hook mezzo-centrico non si appoggia piu solo al composito locale del clone. Esiste ora anche uno snapshot `Dossier Mezzo` server-side clone-seeded per singola targa, persistito nel backend IA separato e usato in modo governato per stato mezzo, riepilogo costi e nuova capability rifornimenti.
- Cosa apre davvero questo step:
  - nuovo retrieval server-side `read_vehicle_dossier_by_targa` su snapshot Dossier mezzo read-only, persistita nel contenitore IA dedicato;
  - estensione del catalogo capability con `Riepilogo rifornimenti mezzo`;
  - riuso del retrieval Dossier clone-seeded per:
    - stato sintetico mezzo;
    - riepilogo costi mezzo;
    - riepilogo rifornimenti mezzo;
  - migliore dichiarazione di fonti, dataset e limiti nel thread della chat.
- Cosa NON apre ancora:
  - nessun bridge Firestore/Storage business live;
  - nessuna scrittura business;
  - nessun retrieval live dedicato del verticale `Cisterna`;
  - nessun procurement globale come backend canonico del mezzo.
- File/documenti collegati:
  - `backend/internal-ai/server/internal-ai-adapter.js`
  - `backend/internal-ai/server/internal-ai-persistence.js`
  - `backend/internal-ai/src/internalAiServerRetrievalContracts.ts`
  - `backend/internal-ai/README.md`
  - `src/next/internal-ai/internalAiServerRetrievalClient.ts`
  - `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts`
  - `src/next/internal-ai/internalAiVehicleCapabilityPlanner.ts`
  - `src/next/internal-ai/internalAiVehicleDossierHookFacade.ts`
  - `src/next/internal-ai/internalAiContracts.ts`
  - `src/next/internal-ai/internalAiLibrettoPreviewBridge.ts`
  - `src/next/internal-ai/internalAiChatOrchestrator.ts`
  - `src/next/internal-ai/internalAiTypes.ts`
  - `src/next/NextInternalAiPage.tsx`
  - `docs/product/CHECKLIST_IA_INTERNA.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/STATO_ATTUALE_PROGETTO.md`
  - `docs/change-reports/2026-03-23_0659_estensione-hook-dossier-retrieval-rifornimenti-ia.md`
  - `docs/continuity-reports/2026-03-23_0659_continuity_estensione-hook-dossier-retrieval-rifornimenti-ia.md`
- Verifiche eseguite:
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK
  - `node --check backend/internal-ai/server/internal-ai-persistence.js` -> OK
  - smoke test adapter locale `seed_vehicle_dossier_snapshot` + `read_vehicle_dossier_by_targa` -> OK
  - `npx eslint src/next/internal-ai/internalAiLibrettoPreviewBridge.ts src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts src/next/internal-ai/internalAiVehicleCapabilityPlanner.ts src/next/internal-ai/internalAiVehicleDossierHookFacade.ts src/next/internal-ai/internalAiServerRetrievalClient.ts backend/internal-ai/src/internalAiServerRetrievalContracts.ts` -> OK
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - il nuovo retrieval Dossier resta clone-seeded: non e ancora un adapter Firebase/Storage business live;
  - `rifornimenti` entra come capability governata e spiegabile, ma non come contabilita o fuel control live;
  - `Cisterna` resta un verticale specialistico solo segnalato, senza retrieval live dedicato in questo step.

### M.17 Ri-verifica bridge live Firebase/Storage e boundary futuro stretto
- Stato: `FATTO`
- Note: il repo e l'ambiente processo sono stati ri-verificati il `2026-03-23` con esito esplicito: il backend IA separato NON puo ancora aprire un bridge Firestore/Storage business live in modo sicuro e verificabile. In questo task viene irrigidita la readiness e viene codificato un boundary futuro, machine-readable e non attivo, per il solo primo perimetro ammissibile:
  - Firestore: documento esatto `storage/@mezzi_aziendali`;
  - Storage: solo oggetto esatto ricavato da `librettoStoragePath` nel bucket `gestionemanutenzione-934ef.firebasestorage.app`;
  - niente query larghe, niente `listAll`, niente prefix scan, niente path arbitrari;
  - restano fuori `@rifornimenti`, `@rifornimenti_autisti_tmp`, `@costiMezzo`, `@documenti_*`, `@preventivi`, `@preventivi_approvazioni`, `documenti_pdf/*`, `preventivi/*`, `autisti/*`.
- File/documenti collegati:
  - `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js`
  - `backend/internal-ai/server/internal-ai-firebase-readiness.js`
  - `backend/internal-ai/README.md`
  - `docs/product/CHECKLIST_IA_INTERNA.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/STATO_ATTUALE_PROGETTO.md`
  - `docs/change-reports/2026-03-23_0909_riverifica-bridge-live-firebase-storage-ia.md`
  - `docs/continuity-reports/2026-03-23_0909_continuity_riverifica-bridge-live-firebase-storage-ia.md`
- Verifiche eseguite:
  - `node --check backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js` -> OK
  - `node --check backend/internal-ai/server/internal-ai-firebase-readiness.js` -> OK
  - `npx eslint backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js backend/internal-ai/server/internal-ai-firebase-readiness.js` -> OK
  - smoke test `buildFirebaseReadinessSnapshot()` -> OK
- Dipendenze o blocchi:
  - `firebase-admin` non e ancora governato dal package dedicato `backend/internal-ai/package.json`;
  - nel processo corrente non risultano `GOOGLE_APPLICATION_CREDENTIALS`, `FIREBASE_CONFIG`, `GOOGLE_CLOUD_PROJECT`, `GCLOUD_PROJECT`;
  - `firestore.rules` resta assente dal repo;
  - `storage.rules` versionato resta in conflitto con l'uso legacy reale.

### M.18 Governance dipendenze backend IA + probe runtime Firebase Admin
- Stato: `FATTO`
- Note: il backend IA separato non apre ancora il live bridge, ma il suo package dedicato governa ora anche le dipendenze runtime effettive dell'adapter server-side (`body-parser`, `dotenv`, `express`, `openai`, `firebase-admin`). Inoltre esistono ora:
  - bootstrap Firebase Admin separato in `backend/internal-ai/server/internal-ai-firebase-admin.js`;
  - CLI locale `firebase-readiness` per rendere ripetibile la verifica del package/backend IA senza leggere Firestore o Storage business;
  - invalidazione della snapshot repo/UI vecchia, cosi la readiness aggiornata viene ricostruita con i nuovi prerequisiti.
- Cosa apre davvero questo step:
  - governance piu credibile del package `backend/internal-ai/package.json`;
  - prova locale e non distruttiva della risoluzione runtime di `firebase-admin` dal solo perimetro backend IA;
  - readiness piu precisa sul confine tra `manifest dichiarato`, `runtime davvero risolvibile`, `credenziali server-side` e `rules/policy` ancora mancanti o ambigue.
- Cosa NON apre ancora:
  - nessun bridge Firestore business live;
  - nessun bridge Storage/file live;
  - nessuna modifica a `firebase.json`, `firestore.rules` o `storage.rules`;
  - nessun uso del legacy come backend canonico.
- File/documenti collegati:
  - `backend/internal-ai/package.json`
  - `backend/internal-ai/server/internal-ai-firebase-admin.js`
  - `backend/internal-ai/server/internal-ai-firebase-readiness.js`
  - `backend/internal-ai/server/internal-ai-firebase-readiness-cli.js`
  - `backend/internal-ai/server/internal-ai-adapter.js`
  - `backend/internal-ai/README.md`
  - `docs/product/CHECKLIST_IA_INTERNA.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/STATO_ATTUALE_PROGETTO.md`
  - `docs/change-reports/2026-03-23_0942_governance-package-backend-ia-readiness-live.md`
  - `docs/continuity-reports/2026-03-23_0942_continuity_governance-package-backend-ia-readiness-live.md`
- Verifiche eseguite:
  - `node --check backend/internal-ai/server/internal-ai-firebase-admin.js` -> OK
  - `node --check backend/internal-ai/server/internal-ai-firebase-readiness.js` -> OK
  - `node --check backend/internal-ai/server/internal-ai-firebase-readiness-cli.js` -> OK
  - `npx eslint backend/internal-ai/server/internal-ai-firebase-admin.js backend/internal-ai/server/internal-ai-firebase-readiness.js backend/internal-ai/server/internal-ai-firebase-readiness-cli.js backend/internal-ai/server/internal-ai-adapter.js` -> OK
  - `npm --prefix backend/internal-ai run firebase-readiness` -> OK
  - smoke test `probeInternalAiFirebaseAdminRuntime()` -> `modulesReady: true`, `canAttemptLiveRead: false`
  - smoke test `startInternalAiAdapterServer({ port: 4317, host: '127.0.0.1' })` + `GET /internal-ai-backend/health` -> `firestore: not_ready`, `storage: not_ready`, `adminRuntimeReady: true`
- Dipendenze o blocchi:
  - `firebase-admin` e ora governato a livello manifest dal package dedicato ed e risolvibile nel checkout locale dopo bootstrap del package backend IA, ma il live resta comunque bloccato;
  - nel processo corrente non risultano ancora `GOOGLE_APPLICATION_CREDENTIALS`, `FIREBASE_CONFIG`, `GOOGLE_CLOUD_PROJECT`, `GCLOUD_PROJECT` utilizzabili come credenziale server-side dimostrata;
  - `firestore.rules` resta assente e `firebase.json` non espone boundary Firestore verificabile;
  - `storage.rules` versionato resta in conflitto con l'uso legacy, quindi non e sicuro toccarlo in questo step.

### M.18.b Supporto `FIREBASE_SERVICE_ACCOUNT_JSON` lato server senza apertura del live
- Stato: `FATTO`
- Note: il backend IA separato riconosce ora anche `FIREBASE_SERVICE_ACCOUNT_JSON`, oltre a `GOOGLE_APPLICATION_CREDENTIALS` e `FIREBASE_CONFIG`. Questo completa il supporto del codice sul lato server, ma non apre il bridge live nel checkout corrente.
- Cosa chiarisce davvero questo step:
  - il runtime backend IA supporta tre canali credenziali server-side espliciti;
  - la probe locale conferma `modulesReady: true`, ma `credentialMode: missing` e `canAttemptLiveRead: false`;
  - il fallback ufficiale nel dominio `mezzo_dossier` resta il retrieval clone-seeded gia governato.
- File/documenti collegati:
  - `backend/internal-ai/server/internal-ai-firebase-admin.js`
  - `backend/internal-ai/server/internal-ai-firebase-readiness.js`
  - `backend/internal-ai/src/internalAiServerPersistenceContracts.ts`
  - `backend/internal-ai/README.md`
  - `docs/product/CHECKLIST_IA_INTERNA.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/STATO_ATTUALE_PROGETTO.md`
- Verifiche eseguite:
  - `node --check backend/internal-ai/server/internal-ai-firebase-admin.js` -> OK
  - `node --check backend/internal-ai/server/internal-ai-firebase-readiness.js` -> OK
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npm --prefix backend/internal-ai run firebase-readiness` -> OK
  - smoke test `probeInternalAiFirebaseAdminRuntime()` -> `modulesReady: true`, `credentialMode: missing`, `canAttemptLiveRead: false`
- Dipendenze o blocchi:
  - `GOOGLE_APPLICATION_CREDENTIALS` assente nel processo corrente;
  - `FIREBASE_SERVICE_ACCOUNT_JSON` assente nel processo corrente;
  - `FIREBASE_CONFIG` assente nel processo corrente;
  - `firestore.rules` assente dal repo;
  - `storage.rules` deny-all versionato in conflitto con l'uso legacy.

### M.19 Copertura runtime UI quasi totale verificabile della NEXT
- Stato: `FATTO`
- Note: il `2026-03-23` l'osservatore runtime della nuova IA interna e stato spinto fino al massimo oggi verificabile in modo read-only, non distruttivo e senza toccare la madre. Il catalogo observer `2026-03-23-total-ui-v1` copre ora 53 route candidate della NEXT, ne osserva davvero 52 con 70 screenshot runtime, tenta 26 stati interni whitelist-safe e ne osserva 18 in modo reale e tracciabile.
- Cosa apre davvero questo step:
  - estensione del catalogo runtime a route base, route figlie, route annidate e route dinamiche read-only di:
    - `IA` e `IA interna`;
  - `Autisti Inbox`;
  - `Autisti Admin`;

    - `Centro di Controllo`;
    - `Cisterna`;
    - `Capo Mezzi` e dettaglio costi;
    - `Lavori in attesa` + dettaglio lavoro;
    - `Ordini in attesa` + dettaglio ordine;
    - schermate operative/lista come `Inventario`, `Manutenzioni`, `Materiali`, `Mezzi`, `Colleghi`, `Fornitori`;
  - osservazione reale di 18 stati interni:
    - 12 `tab`;
    - 2 `menu`;
    - 2 `dialog/modal`;
    - 1 `card`;
    - 1 `detail`;
  - pagina `/next/ia/interna` aggiornata per mostrare tutte le route e tutti gli stati osservati, con conteggi `tentati/osservati/non disponibili`, catalogo observer, requested path vs final path e breakdown per tipo di stato;
  - payload repo/UI per la chat server-side esteso a una vista runtime compatta ma completa di tutte le route osservate, senza piu limitarsi a un campione troppo piccolo di schermate.
- Cosa NON apre ancora:
  - nessun click distruttivo, submit, upload, scrittura business o runtime madre;
  - nessun uso del legacy come backend canonico della nuova IA;
  - non osservata oggi la route dinamica `Acquisti` dettaglio, perche il trigger `Apri` non emerge in modo affidabile nel runtime locale;
  - restano non osservabili in modo sicuro 8 stati interni con motivazione esplicita:
    - `Home`: accordion rapido non visibile e modale `Vedi tutto` bloccata dal guard rail read-only del clone;
    - `Dossier dettaglio`: modale lavori e foto mezzo non visibili nel DOM del campione;
    - `Dossier rifornimenti`: filtri `MESE` e `12 mesi` non visibili in modo affidabile;
    - `Capo costi`: toggle `solo da valutare` non visibile in modo affidabile;
    - `Acquisti`: menu ordine non visibile nel campione runtime corrente.
- File/documenti collegati:
  - `backend/internal-ai/server/internal-ai-next-runtime-observer.js`
  - `backend/internal-ai/server/internal-ai-repo-understanding.js`
  - `backend/internal-ai/server/internal-ai-adapter.js`
  - `backend/internal-ai/src/internalAiServerRetrievalContracts.ts`
  - `scripts/internal-ai-observe-next-runtime.mjs`
  - `src/next/NextInternalAiPage.tsx`
  - `docs/product/CHECKLIST_IA_INTERNA.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/STATO_ATTUALE_PROGETTO.md`
  - `docs/change-reports/2026-03-23_1249_ui_total-runtime-coverage-next-ia.md`
  - `docs/continuity-reports/2026-03-23_1249_continuity_runtime-observer-next-total-ui-coverage.md`
- Verifiche eseguite:
  - `node --check backend/internal-ai/server/internal-ai-next-runtime-observer.js` -> OK
  - `node --check scripts/internal-ai-observe-next-runtime.mjs` -> OK
  - `node --check backend/internal-ai/server/internal-ai-repo-understanding.js` -> OK
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
  - `npx eslint src/next/NextInternalAiPage.tsx backend/internal-ai/src/internalAiServerRetrievalContracts.ts backend/internal-ai/server/internal-ai-next-runtime-observer.js backend/internal-ai/server/internal-ai-repo-understanding.js backend/internal-ai/server/internal-ai-adapter.js scripts/internal-ai-observe-next-runtime.mjs` -> OK
  - `npm run internal-ai:observe-next` -> OK (`52/53` route, `18/26` stati, `70` screenshot)
  - rebuild snapshot repo/UI server-side -> OK
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - alcune viste e alcuni trigger interni restano data-dependent o role-dependent e non emergono sempre nel campione runtime locale;
  - alcuni controlli del clone sono volutamente disabilitati dal guard rail read-only e non vanno forzati;
  - l'osservatore resta intenzionalmente manifest-driven e governato, non un crawler libero della UI.

### M.20 Micro-task Prompt 59 - chiusura gap runtime residui NEXT
- Stato: `FATTO`
- Note: il `2026-03-23` e stato eseguito un micro-refresh mirato solo sui gap residui del Prompt 59, senza riaprire l'audit largo e senza toccare la madre. Il catalogo observer passa a `2026-03-23-total-ui-v2` e la snapshot runtime verificata sale a `53/53` route osservate, `25/26` stati interni osservati e `78` screenshot.
- Cosa chiude davvero questo step:
  - route dinamica `Acquisti` dettaglio osservata davvero passando dal tab `Ordini` e dal trigger `Apri` read-only;
  - osservati davvero gli stati prima mancanti ma oggi raggiungibili in sicurezza:
    - `Home`: accordion rapido gia visibile nel render iniziale;
    - `Dossier dettaglio`: modale lavori e foto mezzo;
    - `Dossier rifornimenti`: filtri `MESE` e `12 mesi` su una targa con rifornimenti visibili nel clone (`TI313387`);
    - `Capo costi`: toggle `solo da valutare`;
    - `Acquisti`: menu ordine read-only dopo apertura del tab `Ordini`;
  - riallineata la logica dell'observer per:
    - riconoscere gli stati gia aperti nel render iniziale;
    - distinguere meglio i trigger bloccati dal guard rail read-only;
    - supportare step preparatori read-only sui probe e un micro-refresh dedicato ai gap residui.
- Cosa NON chiude ancora:
  - non e osservabile in modo sicuro la modale `Home -> Vedi tutto`, perche il trigger e visibile ma disabilitato dal guard rail read-only del clone;
  - il risultato resta quindi `quasi completo` ma non `100% assoluto` sugli stati interni tentati.
- File/documenti collegati:
  - `backend/internal-ai/server/internal-ai-next-runtime-observer.js`
  - `scripts/internal-ai-observe-next-runtime.mjs`
  - `scripts/internal-ai-observe-next-gap59.mjs`
  - `docs/product/CHECKLIST_IA_INTERNA.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/STATO_ATTUALE_PROGETTO.md`
  - `docs/change-reports/2026-03-23_1733_ui_gap59-runtime-observer-next-closure.md`
  - `docs/continuity-reports/2026-03-23_1733_continuity_gap59-runtime-observer-next-closure.md`
- Verifiche eseguite:
  - `node --check backend/internal-ai/server/internal-ai-next-runtime-observer.js` -> OK
  - `node --check scripts/internal-ai-observe-next-runtime.mjs` -> OK
  - `node --check scripts/internal-ai-observe-next-gap59.mjs` -> OK
  - `npx eslint backend/internal-ai/server/internal-ai-next-runtime-observer.js scripts/internal-ai-observe-next-runtime.mjs scripts/internal-ai-observe-next-gap59.mjs` -> OK
  - `node scripts/internal-ai-observe-next-gap59.mjs` -> OK (`53/53` route, `25/26` stati, `78` screenshot)
- Dipendenze o blocchi:
  - la modale `Home -> Vedi tutto` resta fuori osservazione per blocco esplicito del clone e non va forzata;
  - alcuni probe sui rifornimenti restano comunque data-dependent e richiedono una targa con dati reali visibili nel clone.

### N. Workflow reale di approvazione, scarto e rollback
- Stato: `IN CORSO`
- Note: esiste ora un primo workflow server-side reale di `preview -> approvazione -> rifiuto -> rollback`, limitato ai soli artifact IA dedicati della `sintesi guidata report` e verificato end-to-end con provider reale il `2026-03-22`. Nessuna applicazione automatica su dati business, nessun writer Firestore/Storage e nessun runtime legacy vengono attivati.
- File/documenti collegati:
  - `backend/internal-ai/server/internal-ai-adapter.js`
  - `backend/internal-ai/server/internal-ai-persistence.js`
  - `backend/internal-ai/src/internalAiServerPersistenceContracts.ts`
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/internal-ai/internalAiServerReportSummaryClient.ts`
  - `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- Dipendenze o blocchi:
  - il workflow reale non applica ancora preview approvate a dati business o codice;
  - la chat e le altre capability restano su fallback/mock-safe o su workflow non ancora reali;
  - l'abilitazione effettiva del provider dipende da segreto server-side non versionato nel repo.

### M.20.b Reality check finale aggiornato del live minimo Firebase/Storage
- Stato: `FATTO`
- Note: il tentativo finale di apertura del primo bridge live minimo del backend IA separato e stato richiuso in modo onesto anche dopo il reality check del checkout corrente. Nel processo reale il live NON e apribile e il fallback ufficiale resta il retrieval clone-seeded del `mezzo_dossier`.
- Cosa e stato verificato davvero:
  - il bootstrap server-side dedicato supporta oggi `GOOGLE_APPLICATION_CREDENTIALS`, `FIREBASE_SERVICE_ACCOUNT_JSON` e `FIREBASE_CONFIG`;
  - il runtime locale del backend IA separato risolve `firebase-admin/app`, `firebase-admin/firestore` e `firebase-admin/storage`;
  - nel processo corrente non risultano `GOOGLE_APPLICATION_CREDENTIALS`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `FIREBASE_CONFIG`, `GOOGLE_CLOUD_PROJECT`, `GCLOUD_PROJECT`;
  - `firestore.rules` resta assente dal repo;
  - `storage.rules` versionato resta deny-all e in conflitto con l'uso legacy.
- Cosa NON apre questo step:
  - nessun live Firestore su `storage/@mezzi_aziendali`;
  - nessun live Storage su `librettoStoragePath`;
  - nessuna query larga, nessun `listAll`, nessun prefix scan, nessuna scrittura business.
- File/documenti collegati:
  - `backend/internal-ai/server/internal-ai-firebase-readiness.js`
  - `backend/internal-ai/README.md`
  - `docs/product/CHECKLIST_IA_INTERNA.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-23_1833_live-minimo-ia-readonly-reality-check.md`
  - `docs/continuity-reports/2026-03-23_1833_continuity_live-minimo-ia-readonly-reality-check.md`
- Verifiche eseguite:
  - probe presenza env server-side senza stampa segreti -> `GOOGLE_APPLICATION_CREDENTIALS/FIREBASE_SERVICE_ACCOUNT_JSON/FIREBASE_CONFIG/GOOGLE_CLOUD_PROJECT/GCLOUD_PROJECT` tutti assenti
  - `npm --prefix backend/internal-ai run firebase-readiness` -> `firestoreReadOnly: not_ready`, `storageReadOnly: not_ready`
  - smoke test `probeInternalAiFirebaseAdminRuntime()` -> `modulesReady: true`, `credentialMode: missing`, `canAttemptLiveRead: false`
- Dipendenze o blocchi:
  - credenziale server-side Google non dimostrata nel processo corrente;
  - `firestore.rules` assente;
  - `storage.rules` deny-all in conflitto con l'uso legacy;
  - access layer Firestore/Storage live dedicato ancora non aperto in `backend/internal-ai`.

### O. Archivio persistente report e artifact
- Stato: `IN CORSO`
- Note: esiste ora un primo archivio persistente server-side e dedicato del sottosistema IA su file JSON locali in `backend/internal-ai/runtime-data/analysis_artifacts.json`, affiancato dal nuovo `ai_preview_workflows.json` per preview/approval/rollback server-side. Restano fuori Firestore/Storage business e qualsiasi applicazione automatica sui dati business.
- File/documenti collegati:
  - `backend/internal-ai/server/internal-ai-adapter.js`
  - `backend/internal-ai/server/internal-ai-persistence.js`
  - `backend/internal-ai/src/internalAiServerPersistenceContracts.ts`
  - `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- Dipendenze o blocchi:
  - policy Firestore effettive;
  - policy Storage effettive.

### P. Tracking operativo persistente
- Stato: `IN CORSO`
- Note: esiste ora una prima memoria operativa persistente server-side e dedicata del sottosistema IA su file JSON locali in `backend/internal-ai/runtime-data/ai_operational_memory.json`, con fallback locale esplicito e senza dataset business.
- File/documenti collegati:
  - `backend/internal-ai/server/internal-ai-adapter.js`
  - `backend/internal-ai/server/internal-ai-persistence.js`
  - `backend/internal-ai/src/internalAiServerPersistenceContracts.ts`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
- Dipendenze o blocchi:
  - identita utente e permessi reali ancora non chiusi.

### Q. Policy e governance infrastrutturale
- Stato: `BLOCCATO`
- Note: restano aperte policy Firestore/Storage effettive e governance dei backend IA/PDF.
- File/documenti collegati:
  - `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- Dipendenze o blocchi:
  - `firestore.rules` assente nel repo;
  - canali IA/PDF legacy multipli non canonici;
  - auth anonima e gestione segreti lato client impropria.

## 7. Macrofase 4 - Filoni futuri
Stato macrofase: `NON FATTO`

### R. Modello camion con IA
- Stato: `NON FATTO`
- Note: iniziativa futura da trattare come schema tecnico coerente per famiglia di mezzo, non come immagine inventata liberamente dalla IA.
- File/documenti collegati:
  - `docs/product/CHECKLIST_IA_INTERNA.md`
- Dipendenze o blocchi:
  - definizione famiglie di mezzo;
  - normalizzazione componenti tecniche;
  - overlay sui dati reali di manutenzioni, costi e documenti.

### R.1 Schema tecnico coerente per famiglia di mezzo
- Stato: `NON FATTO`
- Note: la futura rappresentazione deve partire da uno schema tecnico stabile per classe/famiglia di mezzo.
- File/documenti collegati:
  - `docs/product/CHECKLIST_IA_INTERNA.md`
- Dipendenze o blocchi: richiede catalogo tecnico coerente per famiglie di mezzo.

### R.2 Niente immagini IA inventate come fonte tecnica
- Stato: `NON FATTO`
- Note: eventuali immagini o viste future non possono diventare fonte tecnica primaria se non derivate da uno schema controllato.
- File/documenti collegati:
  - `docs/product/CHECKLIST_IA_INTERNA.md`
- Dipendenze o blocchi: richiede regole di validazione della fonte tecnica.

### R.3 Componenti standardizzati e mappati
- Stato: `NON FATTO`
- Note: il modello dovra appoggiarsi a componenti standardizzati, denominati e mappati in modo consistente.
- File/documenti collegati:
  - `docs/product/CHECKLIST_IA_INTERNA.md`
- Dipendenze o blocchi: richiede tassonomia componenti e mapping per famiglia di mezzo.

### R.4 Overlay con storico reale manutenzioni, costi e documenti
- Stato: `NON FATTO`
- Note: lo schema tecnico dovra poter sovrapporre i dati reali disponibili nel gestionale, senza scritture automatiche.
- File/documenti collegati:
  - `docs/product/CHECKLIST_IA_INTERNA.md`
- Dipendenze o blocchi: richiede readers validati e fonti dati esplicitate.

### M.21 Reset prodotto chat IA interna / allegati / memoria
- Stato: `FATTO`
- Note: la pagina `/next/ia/interna` e stata trasformata in una chat unica stile ChatGPT, con memoria repo/UI usata nelle richieste libere quando disponibile, allegati IA-only nello stesso composer, output/report/PDF secondari e pannelli tecnici collassabili; nessuna madre toccata e nessuna scrittura business o bridge live riaperto.
- File/documenti collegati:
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/internal-ai/internalAiTypes.ts`
  - `src/next/internal-ai/internalAiChatOrchestrator.ts`
  - `src/next/internal-ai/internalAiChatOrchestratorBridge.ts`
  - `src/next/internal-ai/internalAiOutputSelector.ts`
  - `src/next/internal-ai/internalAiChatAttachmentsClient.ts`
  - `backend/internal-ai/server/internal-ai-adapter.js`
  - `backend/internal-ai/server/internal-ai-chat-attachments.js`
  - `backend/internal-ai/src/internalAiServerPersistenceContracts.ts`
  - `docs/STATO_ATTUALE_PROGETTO.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-23_2211_reset-chat-ia-interna-stile-chatgpt.md`
  - `docs/continuity-reports/2026-03-23_2211_continuity_reset-chat-ia-interna-stile-chatgpt.md`
- Dipendenze o blocchi: nessuno sul reset UX; restano bloccati i live business non aperti.

### M.22 V1 affidabile della chat IA su Home / report targa / file da toccare
- Stato: `FATTO`
- Note: il `2026-03-24` la chat `/next/ia/interna` e stata stretta sui tre use case V1 realmente utili e gia sostenibili dal repo:
  - `analizza la home`;
  - `fammi un report della targa X`;
  - `quali file devo toccare`.
  Il dispatch del report targa resta mezzo-centrico NEXT e non usa `Mezzo360` legacy come reader canonico; la resa in pagina e piu leggibile e il selettore output evita di trattare le richieste sui file come proposta di integrazione.
- File/documenti collegati:
  - `src/next/internal-ai/internalAiChatOrchestrator.ts`
  - `src/next/internal-ai/internalAiOutputSelector.ts`
  - `src/next/NextInternalAiPage.tsx`
  - `docs/product/CHECKLIST_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-24_0631_v1-chat-home-report-file-map.md`
  - `docs/continuity-reports/2026-03-24_0631_continuity_v1-chat-home-report-file-map.md`
- Verifiche eseguite:
  - `npm run build` -> OK
  - `npx eslint src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/NextInternalAiPage.tsx` -> OK
- Dipendenze o blocchi:
  - nessuna nuova capability o backend vengono aperti in questo step;
  - le risposte piu ricche su repo/UI restano comunque migliori quando la memoria osservata e aggiornata lato backend.

### M.23 Consolidamento prima verticale IA D01 + D10 + D02
- Stato: `FATTO`
- Note: il `2026-03-24` la chat `/next/ia/interna` e stata riallineata alla prima verticale mezzo/Home/tecnica definita dal Prompt 67:
  - `stato mezzo / targa`;
  - `report targa`;
  - `analizza la Home operativa`;
  - `spiega alert, revisione e stato operativo`;
  - `quali file/moduli devo toccare nel perimetro mezzo/Home`;
  - `variante tecnica su lavori e manutenzioni del mezzo`.
  Il thread usa ora come reader canonici solo `D01`, `D10` e `D02` NEXT read-only; capability e output fuori verticale vengono de-enfatizzati o fermati con limite esplicito.
- File/documenti collegati:
  - `src/next/internal-ai/internalAiChatOrchestrator.ts`
  - `src/next/internal-ai/internalAiOutputSelector.ts`
  - `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts`
  - `src/next/internal-ai/internalAiVehicleDossierHookFacade.ts`
  - `src/next/internal-ai/internalAiVehicleReportFacade.ts`
  - `src/next/NextInternalAiPage.tsx`
  - `docs/product/CHECKLIST_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-24_0810_consolidamento-prima-verticale-chat-ia.md`
  - `docs/continuity-reports/2026-03-24_0810_continuity_consolidamento-prima-verticale-chat-ia.md`
- Verifiche eseguite:
  - `npm run build` -> OK
  - `npx eslint src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiVehicleDossierHookFacade.ts src/next/internal-ai/internalAiVehicleReportFacade.ts src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts` -> OK
- Dipendenze o blocchi:
  - il report targa resta nel formato artifact/PDF gia esistente, ma ora legge solo la prima verticale consolidata;
  - i domini esterni `D03`, `D04`, `D05`, `D06`, `D07`, `D08` non vengono riaperti in questo step.

### M.24 Classificazione prudente per domini della chat IA
- Stato: `FATTO`
- Note: il `2026-03-24` la chat `/next/ia/interna` classifica ora le richieste per domini canonici del gestionale invece di trattarle come lista sparsa di pagine:
  - `D01`, `D02`, `D10` restano la prima verticale forte;
  - `D03`, `D04`, `D05`, `D06`, `D07`, `D08`, `D09` vengono riconosciuti in modo prudente e restituiscono dominio rilevato, file/moduli principali, capability oggi disponibili, limiti dichiarati e prossimo passo corretto;
  - il thread mostra in modo sobrio dominio riconosciuto, affidabilita e tipo di output senza trasformarsi in pannello debug.
- File/documenti collegati:
  - `src/next/internal-ai/internalAiChatOrchestrator.ts`
  - `src/next/internal-ai/internalAiOutputSelector.ts`
  - `src/next/NextInternalAiPage.tsx`
  - `docs/product/CHECKLIST_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-24_0844_classificazione-domini-chat-ia.md`
  - `docs/continuity-reports/2026-03-24_0844_continuity_classificazione-domini-chat-ia.md`
- Verifiche eseguite:
  - `npx eslint src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/NextInternalAiPage.tsx` -> OK
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - la classificazione dominio-first non rende ancora operativi i domini esterni alla prima verticale;
  - nel repo non emerge un file esplicitamente etichettato come report finale del Prompt 66 o del Prompt 68; il consolidamento si appoggia ai documenti canonici e ai report del `2026-03-24` presenti.

### M.25 Capability canonica `stato_operativo_mezzo`
- Stato: `FATTO`
- Note: il `2026-03-24` la chat `/next/ia/interna` usa ora una capability canonica e prioritaria per richieste tipo `stato mezzo/targa`, separata dal `report targa`:
  - il routing passa prima per `stato_operativo_mezzo`;
  - la capability compone solo `D01` anagrafica/pivot targa, `D10` stato operativo/alert/focus cockpit e `D02` backlog tecnico lavori/manutenzioni;
  - l'output e sempre `chat_structured` sobrio con sezioni `Identita mezzo`, `Stato operativo attuale`, `Alert / priorita`, `Lavori / manutenzioni aperte`, `Limiti / DA VERIFICARE`;
  - il `report targa` resta capability distinta e secondaria nel formato PDF/preview gia esistente.
- File/documenti collegati:
  - `src/next/internal-ai/internalAiChatOrchestrator.ts`
  - `src/next/internal-ai/internalAiOutputSelector.ts`
  - `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts`
  - `src/next/NextInternalAiPage.tsx`
  - `docs/product/CHECKLIST_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-24_0915_capability-canonica-stato-operativo-mezzo.md`
  - `docs/continuity-reports/2026-03-24_0915_continuity_capability-canonica-stato-operativo-mezzo.md`
- Verifiche eseguite:
  - `npx eslint src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts src/next/NextInternalAiPage.tsx` -> OK
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - il collegamento D10 resta prudente quando alert/focus/revisione non risultano collegabili in modo pienamente affidabile alla targa;
  - il task non riapre i domini `D03-D09`, gli allegati o il live bridge.

### M.26 Unified Intelligence Engine e console unica read-only
- Stato: `FATTO`
- Note: il `2026-03-24` e stato completato il motore unificato read-only della console IA NEXT riprendendo un worktree gia avviato, senza rifare da zero la patch interrotta:
  - esiste ora `nextUnifiedReadRegistryDomain.ts` come adapter layer read-only prudente per storage document, collection Firestore, prefix Storage e localStorage isolato;
  - esiste `internalAiUnifiedIntelligenceEngine.ts` che costruisce un Global Read Registry clone-safe, collega le entita con chiavi strutturali (`targa`, `mezzoId`, badge/nome autista, refId, documentId, label normalizzate) e produce output operativi senza mettere al centro la classificazione tecnica;
  - la console `/next/ia/interna` espone ora filtri sobri per targa, ambiti e output, usa il motore unificato come percorso prioritario per query operative e riusa i renderer/report artifact gia esistenti per modale/PDF/report;
  - il perimetro copre in lettura le fonti mappate nel documento canonico `docs/data/MAPPA_COMPLETA_DATI.md`, includendo anche fonti sporche o ambigue tramite adapter prudente invece di escluderle;
  - la fonte `@impostazioni_app/gemini` resta presente nel registry ma marcata `guarded`, senza lettura client di segreti.
- File/documenti collegati:
  - `src/next/domain/nextUnifiedReadRegistryDomain.ts`
  - `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
  - `src/next/internal-ai/internalAiChatOrchestrator.ts`
  - `src/next/internal-ai/internalAiChatOrchestratorBridge.ts`
  - `src/next/internal-ai/internalAiOutputSelector.ts`
  - `src/next/NextInternalAiPage.tsx`
  - `docs/product/CHECKLIST_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-24_1128_unified-intelligence-engine-console.md`
  - `docs/continuity-reports/2026-03-24_1128_continuity_unified-intelligence-engine-console.md`
- Verifiche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/domain/nextUnifiedReadRegistryDomain.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts` -> OK
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - una parte dei link cross-fonte resta forte solo dove il repo espone chiavi strutturali coerenti; altrove il motore dichiara affidabilita `Parziale` o `Da verificare` invece di inventare match certi;
  - il registry include fonti `raw` e `tmp` con adapter prudente, ma questo non equivale a una bonifica completa dei domini sporchi;
  - la persistenza dei report resta quella gia disponibile nel sottosistema IA e non introduce scritture business o backend live nuovi.

### M.27 Report gestionale professionale del motore unificato
- Stato: `FATTO`
- Note: il `2026-03-24` il report targa del motore unificato e stato rifatto solo sul layer output/rendering, senza riaprire il motore di lettura/incrocio:
  - il renderer della console IA mostra ora un report gestionale vero con `header` aziendale, sintesi esecutiva, dati mezzo, foto reale e sezioni operative leggibili;
  - il corpo principale del report non mette piu al centro reader, dataset, storage keys o note tecniche da sviluppatore;
  - il report gomme riusa la stessa grafica stilizzata del modale gomme esistente nel repo tramite `TruckGommeSvg` e `wheelGeom`, evidenziando asse/lato coinvolto quando il dato e dimostrabile e dichiarando `da verificare` quando non lo e;
  - il PDF dei report targa passa ora dal `pdfEngine` ufficiale del progetto, con logo aziendale, impaginazione pulita, foto reale mezzo e appendice tecnica separata;
  - la configurazione collegata motrice/rimorchio/centina viene mostrata solo quando la sessione D10 e l'anagrafica D01 permettono un aggancio prudente e dimostrabile.
- File/documenti collegati:
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`
  - `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`
  - `src/next/internal-ai/internalAiReportPdf.ts`
  - `src/next/internal-ai/internal-ai.css`
  - `src/utils/pdfEngine.ts`
  - `docs/product/CHECKLIST_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-24_1411_unified-report-renderer-pdf.md`
  - `docs/continuity-reports/2026-03-24_1411_continuity_unified-report-renderer-pdf.md`
- Verifiche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiProfessionalVehicleReport.ts src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx src/next/internal-ai/internalAiReportPdf.ts` -> OK
  - `npm run build` -> OK
  - `npx eslint src/utils/pdfEngine.ts` -> DA VERIFICARE come file storico: restano errori lint preesistenti (`no-explicit-any` e debito locale non introdotto da questa patch)
- Dipendenze o blocchi:
  - le foto reali dipendono dalla presenza di `fotoUrl`/`fotoStoragePath` realmente leggibili per il mezzo o la configurazione collegata;
  - il report gomme evidenzia asse/lato solo quando il dato e esposto davvero dai record gomme; in caso contrario il blocco resta professionale ma segna il lato come `da verificare`;
  - il task non riapre il motore unificato, i domini business o la madre.

### M.28 Pulizia UI della console IA NEXT
- Stato: `FATTO`
- Note: il `2026-03-24` la pagina `/next/ia/interna` e stata ripulita senza rifare il motore unificato:
  - la chat e ora la superficie dominante;
  - la colonna destra mostra i report richiesti/salvati raggruppati per targa quando possibile;
  - le richieste rapide passano da un menu a tendina compatto;
  - il campo visibile per la ricerca targa usa solo la label `Targa` e riusa l'autosuggest reale gia esistente;
  - pannelli tecnici, contatori, memoria osservatore e scaffolding rumoroso restano accessibili solo in una sezione avanzata collassata.
- File/documenti collegati:
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/internal-ai/internal-ai.css`
  - `docs/product/CHECKLIST_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-24_1530_pulizia-ui-console-ia-next.md`
  - `docs/continuity-reports/2026-03-24_1530_continuity_pulizia-ui-console-ia-next.md`
- Verifiche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx` -> OK
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - il vecchio scaffolding operativo/tecnico non e stato eliminato dal file, ma solo spostato in un livello secondario collassato per non rompere flussi gia presenti;
  - l'autosuggest targa resta dipendente dal catalogo read-only reale gia esistente, senza nuove fonti o backend.

### M.29 Rifinitura UI console IA e gerarchia report/PDF
- Stato: `FATTO`
- Note: il `2026-03-24` la console IA NEXT e stata ulteriormente semplificata e il report professionale e stato riallineato a una gerarchia visiva piu leggibile:
  - l'header della pagina e stato ridotto a una testata minima `Console IA`;
  - il blocco `Richieste rapide` e stato spostato nel composer, vicino a `Targa` e `Output`;
  - i filtri rapidi sono ora neutri da spenti e chiaramente evidenziati da attivi;
  - i pannelli avanzati/tecnici restano fuori dal primo piano;
  - il report professionale mostra prima l'identita mezzo e la foto a destra, poi la sintesi esecutiva e le sezioni operative;
  - il PDF segue la stessa logica visuale, con blocco mezzo in alto e sezioni piu separate.
- File/documenti collegati:
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/internal-ai/internal-ai.css`
  - `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`
  - `src/utils/pdfEngine.ts`
  - `docs/product/CHECKLIST_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-24_1603_rifinitura-ui-report-pdf-ia-next.md`
  - `docs/continuity-reports/2026-03-24_1603_continuity_rifinitura-ui-report-pdf-ia-next.md`
- Verifiche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx` -> OK
  - `npx eslint src/utils/pdfEngine.ts` -> NON OK per debito lint storico gia presente nel file condiviso
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - `src/utils/pdfEngine.ts` resta un file storico con errori eslint preesistenti e non bonificati in questo task;
  - il task non riapre motore unificato, registry, linker o backend.

### R.5 IA usata per interpretazione, normalizzazione e supporto ricerca
- Stato: `FATTO`
- Note: il `2026-03-24` la console `/next/ia/interna` ha chiuso il gap interpretativo sopra il motore unificato gia esistente, senza rifare backend, UI o renderer PDF.
- Cosa e stato chiuso davvero:
  - request understanding robusto su intento business, targa/entita, metriche richieste, ampiezza della richiesta e focus finale;
  - planner gestionale che sceglie i domini corretti, evita rumore laterale e non apre piu automaticamente il quadro generale mezzo quando la richiesta e specifica;
  - calcoli deterministici riusabili per rifornimenti/consumi, criticita mezzo e priorita flotte, senza numeri inventati;
  - composer finale business-first con sezioni brevi, limiti in linguaggio semplice e riuso del report/PDF esistente solo quando richiesto.
- File/documenti collegati:
  - `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
  - `src/next/internal-ai/internalAiChatOrchestrator.ts`
  - `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts`
  - `src/next/NextInternalAiPage.tsx`
  - `docs/product/CHECKLIST_IA_INTERNA.md`
- Dipendenze o blocchi: restano prudenti i domini esterni alla coppia forte `D10 + D02` e il quadro completo continua a dichiarare i limiti dei domini ancora parziali.

### R.6 Vista per sezioni tecniche, non schermata caotica unica
- Stato: `NON FATTO`
- Note: la futura esperienza dovra essere organizzata per sezioni tecniche leggibili e navigabili.
- File/documenti collegati:
  - `docs/product/CHECKLIST_IA_INTERNA.md`
- Dipendenze o blocchi: richiede blueprint UX dedicato e modello tecnico stabile.

### M.20 Verifica finale prerequisiti reali del live minimo Firebase/Storage
- Stato: `FATTO`
- Note: il `2026-03-23` e stata chiusa la verifica finale del primo live minimo richiesto alla nuova IA interna, distinguendo supporto codice, credenziali realmente presenti nel processo e blocchi infrastrutturali residui.
- Cosa e stato verificato davvero:
  - il backend IA supporta gia lato server `GOOGLE_APPLICATION_CREDENTIALS`, `FIREBASE_SERVICE_ACCOUNT_JSON` e `FIREBASE_CONFIG`;
  - il runtime locale del backend IA risolve `firebase-admin`;
  - nel processo reale corrente non risultano credenziali server-side effettive;
  - `firestore.rules` resta assente e l'access layer Firestore live dedicato non e ancora aperto;
  - `storage.rules` resta in conflitto con l'uso legacy.
- Verdetto operativo:
  - Firestore `storage/@mezzi_aziendali` come `exact_document` resta `not_ready`;
  - Storage `librettoStoragePath` come `exact_file_read` resta `not_ready`;
  - il fallback ufficiale del `mezzo_dossier` resta il retrieval clone-seeded gia governato.
- Verifiche eseguite:
  - `npm --prefix backend/internal-ai run firebase-readiness` -> OK
  - `node -e "import('./backend/internal-ai/server/internal-ai-firebase-admin.js').then(async m=>{const r=await m.probeInternalAiFirebaseAdminRuntime(); console.log(JSON.stringify(r,null,2));})"` -> OK
  - smoke test non produttivo con `FIREBASE_SERVICE_ACCOUNT_JSON` fittizio e parseabile -> ramo supportato confermato, nessuna lettura business eseguita

### M.30 Rifinitura finale UI overview IA e report/PDF utente
- Stato: `FATTO`
- Note: il `2026-03-24` il primo piano della console IA NEXT e stato ridotto a chat centrale + composer con filtri rapidi + colonna destra report, mentre il report professionale standard ha smesso di esporre appendici tecniche nel corpo principale e il blocco gomme e stato corretto sul caso asse intero.
- Cosa e stato chiuso:
  - overview senza hero pesante, testo introduttivo, pulsanti `Archivio report` / `Tecnico` o messaggio iniziale statico dell'assistente nel primo piano;
  - colonna destra limitata a `Report corrente` e `Report per targa`;
  - report professionale UI senza appendice tecnica visibile;
  - PDF utente standard senza `Appendice tecnica`, `Fonti considerate`, reader o dataset nel corpo report;
  - caso gomme con `asse intero` reso come coinvolgimento completo dell'asse, senza etichetta `lato da verificare`.
- File/documenti collegati:
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`
  - `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`
  - `src/utils/pdfEngine.ts`
  - `docs/change-reports/2026-03-24_1702_rifinitura-finale-ui-pdf-gomme-ia-next.md`
  - `docs/continuity-reports/2026-03-24_1702_continuity_rifinitura-finale-ui-pdf-gomme-ia-next.md`
- Verifiche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx src/next/internal-ai/internalAiProfessionalVehicleReport.ts` -> OK
  - `npm run build` -> OK
  - `npx eslint src/utils/pdfEngine.ts` -> NON OK per debito lint storico preesistente nel file condiviso

### M.31 Pulizia finale estrema del primo piano chat IA
- Stato: `FATTO`
- Note: il `2026-03-24` la overview di `/next/ia/interna` e stata stretta ancora sul solo primo piano utile, senza toccare il motore unificato:
  - all'apertura la chat non precarica piu messaggi statici o riassunti automatici;
  - il corpo centrale mostra solo conversazione reale della sessione attiva oppure un placeholder minimo, senza ultima richiesta o ultimo report riportati come card nel flusso;
  - il lookup targa non mostra piu stato/testo di servizio quando la chat e ancora vuota;
  - la colonna destra resta dedicata a `Report corrente` e `Report per targa`.
- File/documenti collegati:
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/internal-ai/internal-ai.css`
  - `docs/product/CHECKLIST_IA_INTERNA.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/change-reports/2026-03-24_1812_pulizia-finale-primo-piano-chat-ia-next.md`
  - `docs/continuity-reports/2026-03-24_1812_continuity_pulizia-finale-primo-piano-chat-ia-next.md`
- Verifiche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx` -> OK
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - il task non elimina il motore unificato o i blocchi secondari gia presenti nel file; li lascia fuori dal primo piano della pagina;
  - nessuna scrittura business, nessun backend live nuovo, nessuna modifica alla madre.

### M.32 Planner gestionale e composer business-first sopra il motore unificato
- Stato: `FATTO`
- Note: il `2026-03-24` la chat IA interna ha smesso di trattare il motore unificato come semplice classificatore prudente e lo usa ora come cervello gestionale read-only per richieste business su rifornimenti, scadenze, criticita/priorita e quadro completo mezzo.
- Cosa e stato chiuso:
  - il parser riconosce output `report/PDF`, periodi (`oggi`, `questa settimana`, `ultimi 30/90 giorni`, intervalli custom) e filtri console vuoti senza scambiare `-` per una targa reale;
  - il planner decide i domini da leggere senza allargare le richieste specifiche a `stato mezzo` generico;
  - i rifornimenti generano ora indicatori `litri`, `km analizzati`, `km/l`, `l/100km` e anomalie record con regole dimostrabili;
  - le query flotte lavorano su `D10 + D02` per priorita, scadenze, collaudi e pre-collaudi;
  - il composer business-first riusa il report/PDF esistente per le richieste `report`, lasciando nel thread solo il riepilogo essenziale.
- File/documenti collegati:
  - `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
  - `src/next/internal-ai/internalAiChatOrchestrator.ts`
  - `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts`
  - `src/next/NextInternalAiPage.tsx`
  - `docs/change-reports/2026-03-24_2235_patch_cervello-gestionale-console-ia-next.md`
  - `docs/continuity-reports/2026-03-24_2235_continuity_cervello-gestionale-console-ia-next.md`
- Verifiche eseguite:
  - `npm run build` -> OK
  - `npx eslint src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts src/next/internal-ai/internalAiVehicleDossierHookFacade.ts src/next/internal-ai/internalAiVehicleReportFacade.ts src/next/NextInternalAiPage.tsx` -> OK
  - smoke UI reale su `/next/ia/interna` via Playwright locale con prompt rifornimenti, criticita, scadenze e quadro completo -> OK

### M.33 Affidabilita periodo/calcolo rifornimenti e leggibilita report/PDF
- Stato: `FATTO`
- Note: il `2026-03-25` la console `/next/ia/interna` non ricade piu sullo storico completo quando il prompt chiede un periodo esplicito sui rifornimenti e usa ora una base dati validata condivisa tra chat e PDF.
- Cosa e stato chiuso:
  - parsing periodo esteso a `questo mese`, `oggi`, `questa settimana`, `prossimi 30 giorni`, `marzo 2026` e intervalli `dal X al Y`, con guard-rail che blocca il fallback allo storico completo se il periodo esplicito non e interpretabile;
  - validazione rigorosa dei rifornimenti del periodo con distinzione fra record trovati, inclusi nel calcolo ed esclusi, piu motivo di esclusione per ogni record;
  - calcolo deterministico di `litri inclusi`, `km analizzati`, `km/l` e `l/100km` solo su sequenze con km progressivi e litri validi;
  - report professionale e PDF riallineati a sezioni business-first (`Sintesi iniziale`, `Record del periodo`, `Anomalie`, `Azione consigliata`, `Limiti e verifiche`);
  - messaggio di consegna report in chat reso piu leggibile e coerente con il contenuto del report rifornimenti.
- File/documenti collegati:
  - `src/next/internal-ai/internalAiChatOrchestrator.ts`
  - `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
  - `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`
  - `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`
  - `src/next/NextInternalAiPage.tsx`
  - `src/utils/pdfEngine.ts`
  - `docs/change-reports/2026-03-25_0000_affidabilita-rifornimenti-periodo-pdf-ia-next.md`
  - `docs/continuity-reports/2026-03-25_0000_continuity_affidabilita-rifornimenti-periodo-pdf-ia-next.md`
- Verifiche eseguite:
  - `npm run build` -> OK
  - `npx eslint src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts src/next/internal-ai/internalAiVehicleReportFacade.ts src/next/internal-ai/internalAiProfessionalVehicleReport.ts src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx src/next/internal-ai/internalAiReportPdf.ts src/next/NextInternalAiPage.tsx src/utils/pdfEngine.ts` -> KO solo per debito lint storico gia presente in `src/utils/pdfEngine.ts`
  - `npx eslint src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/internal-ai/internalAiProfessionalVehicleReport.ts src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx src/next/NextInternalAiPage.tsx` -> OK
  - smoke UI reale su `/next/ia/interna` via Playwright locale con i prompt A/B/C/D richiesti -> OK
