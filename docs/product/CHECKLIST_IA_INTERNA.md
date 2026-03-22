# CHECKLIST IA INTERNA

Ultimo aggiornamento: 2026-03-22  
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
- Note: esiste ora un backend IA dedicato in `backend/internal-ai/*` con primo adapter server-side reale `mock-safe`, separato dai canali legacy e senza provider reali o scritture business. I ponti attivi oggi collegano `chat-orchestrator`, `documents-preview`, `economic-analysis-preview`, `libretto-preview`, `preventivi-preview`, `vehicle-report-preview`, `driver-report-preview` e `combined-report-preview`, mentre artifact e memoria IA possono gia usare un contenitore server-side dedicato.
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
  - nessun access layer backend reale verso repo, Firestore o Storage business ancora collegato.

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
- Note: il backend IA separato apre ora il primo collegamento strutturale a un provider reale lato server tramite `OpenAI Responses API`, ma confinato a un solo caso d'uso sicuro: `sintesi guidata di un report gia letto` nel clone IA interno. L'output resta solo proposta testuale, viene salvato nel contenitore IA dedicato e richiede approvazione esplicita; il rollback agisce solo sul workflow IA, mai sui dati business. Se `OPENAI_API_KEY` non e configurata lato server, il clone continua con i fallback mock-safe gia esistenti.
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
  - smoke test `approve_preview` + `rollback_preview` su artifact IA dedicato -> OK
  - `npm run build` -> OK
- Dipendenze o blocchi:
  - nel runner attuale `OPENAI_API_KEY` non e configurata, quindi la chiamata reale al provider resta pronta ma non dimostrata end-to-end;
  - il primo caso d'uso reale riguarda solo sintesi testuali di report gia letti, non generazione nuovi dati o scritture business;
  - chat reale, OCR, upload, parsing documentale, retrieval business completo e qualunque writer Firestore/Storage restano fuori perimetro.

### N. Workflow reale di approvazione, scarto e rollback
- Stato: `IN CORSO`
- Note: esiste ora un primo workflow server-side reale di `preview -> approvazione -> rifiuto -> rollback`, ma limitato ai soli artifact IA dedicati della `sintesi guidata report`. Nessuna applicazione automatica su dati business, nessun writer Firestore/Storage e nessun runtime legacy vengono attivati.
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

### R.5 IA usata per interpretazione, normalizzazione e supporto ricerca
- Stato: `NON FATTO`
- Note: il ruolo della IA futura dovra essere di supporto interpretativo, non di invenzione arbitraria dello schema mezzo.
- File/documenti collegati:
  - `docs/product/CHECKLIST_IA_INTERNA.md`
- Dipendenze o blocchi: richiede backend IA dedicato e retrieval controllato.

### R.6 Vista per sezioni tecniche, non schermata caotica unica
- Stato: `NON FATTO`
- Note: la futura esperienza dovra essere organizzata per sezioni tecniche leggibili e navigabili.
- File/documenti collegati:
  - `docs/product/CHECKLIST_IA_INTERNA.md`
- Dipendenze o blocchi: richiede blueprint UX dedicato e modello tecnico stabile.
