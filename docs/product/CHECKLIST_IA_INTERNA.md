# CHECKLIST IA INTERNA

Ultimo aggiornamento: 2026-03-13  
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

## 6. Macrofase 3 - Blocchi e fondazioni ancora aperte
Stato macrofase: `BLOCCATO`

### M. Backend IA dedicato e separato dai canali legacy
- Stato: `NON FATTO`
- Note: non esiste ancora un backend canonico dedicato al nuovo sottosistema IA.
- File/documenti collegati:
  - `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- Dipendenze o blocchi:
  - ownership backend IA/PDF da chiarire;
  - strategia segreti lato server assente nel repo.

### N. Workflow reale di approvazione, scarto e rollback
- Stato: `NON FATTO`
- Note: oggi esiste solo scaffolding UI/mock; nessun workflow reale e reversibile e stato introdotto.
- File/documenti collegati:
  - `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- Dipendenze o blocchi:
  - audit log persistente;
  - repository artifact persistente;
  - backend IA dedicato.

### O. Archivio persistente report e artifact
- Stato: `IN CORSO`
- Note: esiste ora un primo archivio persistente locale e isolato nel clone; resta bloccata la persistenza server-side separata per assenza di prove su policy Firestore/Storage e identity reali.
- File/documenti collegati:
  - `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- Dipendenze o blocchi:
  - contratto di persistenza server-side separato;
  - policy Firestore effettive;
  - policy Storage effettive.

### P. Tracking operativo persistente
- Stato: `NON FATTO`
- Note: esiste solo tracking locale/in-memory del sottosistema IA e non una memoria operativa persistente.
- File/documenti collegati:
  - `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  - `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
- Dipendenze o blocchi:
  - contratto dati dedicato;
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
