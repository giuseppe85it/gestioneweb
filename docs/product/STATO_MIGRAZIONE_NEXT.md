# STATO MIGRAZIONE NEXT

## 1. Scopo del documento
Questo documento resta il registro ufficiale dello stato della NEXT, ma dal `2026-03-10` segue una strategia diversa rispetto alla versione precedente.

Serve a:
- capire in pochi minuti quale strategia NEXT e attiva davvero;
- distinguere la NEXT sperimentale sospesa dal nuovo clone `read-only` della madre;
- tracciare l'archiviazione della NEXT attuale e l'avvio del clone fedele;
- segnare quando, in fase successiva, verranno innestati layer puliti, IA e tracking sopra il clone;
- lavorare insieme al registro permanente delle patch clone `docs/product/REGISTRO_MODIFICHE_CLONE.md`.

## 2. Nota di continuita
- La strategia NEXT precedente e sospesa.
- Snapshot archiviate della situazione precedente:
  - `docs/_archive/2026-03-10-next-strategia-pre-clone/MATRICE_ESECUTIVA_NEXT.pre-clone-2026-03-10.md`
  - `docs/_archive/2026-03-10-next-strategia-pre-clone/STATO_MIGRAZIONE_NEXT.pre-clone-2026-03-10.md`
- La madre resta il gestionale operativo principale e non viene toccata.

## 3. Strategia ufficiale attiva
- La NEXT attuale viene considerata esperimento sospeso e da archiviare.
- La nuova priorita e costruire in `src/next/*` un clone fedele `read-only` della madre.
- Il clone deve:
  - usare la stessa UX pratica della madre;
  - leggere gli stessi dati reali;
  - bloccare completamente scritture, delete, upload, import e side effect.
- Layer puliti dedicati, IA e tracking NON sono piu il primo passo: verranno innestati solo dopo che il clone `read-only` sara stabile.

## 4. Stati standard usati in questa fase
- `SOSPESO`: parte o strategia non piu da estendere nel ramo attivo.
- `DA ARCHIVIARE`: parte presente nel repo ma da spostare fuori dal percorso attivo.
- `NON INIZIATO`: il nuovo clone non e ancora stato costruito.
- `IN PREPARAZIONE`: documentazione/regole allineate, ma nessuna patch runtime ancora applicata.
- `IMPORTATO READ-ONLY`: clone o blocco clone gia operativo in sola lettura.

## 5. Tabella sintetica aggiornata

| Elemento | Stato | Note operative | Ultimo aggiornamento |
| --- | --- | --- | --- |
| Strategia NEXT precedente | SOSPESO | Non e piu la base del progetto; non va estesa | 2026-03-10 |
| Snapshot NEXT precedente | IMPORTATO READ-ONLY | Archivio creato in `src/_archive_next_pre_clone/next-2026-03-10-active/` per recuperabilita completa del ramo sperimentale precedente | 2026-03-10 |
| Clone fedele `read-only` della madre | IMPORTATO READ-ONLY | Avviato su `Home`, `Gestione Operativa`, `Mezzi`, `Dossier Mezzo`, `Dossier Gomme`, `Dossier Rifornimenti`, `Analisi Economica`, `Area Capo`, `Colleghi`, `Fornitori`, hub `Intelligenza Artificiale`, `Libretti Export`, la route base `Cisterna`, i moduli `Cisterna IA` e ora anche `Schede Test`, le due liste reali `Lavori in attesa` / `Lavori eseguiti` e il relativo `DettaglioLavoro` clone-safe su route dedicata. Dal `2026-03-11` il residuo runtime `/next/strumenti-trasversali` e stato rimosso perche non rappresenta una famiglia reale della madre; nella stessa giornata il residuo concettuale `/next/ia-gestionale` e stato riallineato al vero hub madre `Intelligenza Artificiale` su `/next/ia`, e metadata/access/guard minima del clone sono stati riallineati alle route gia attive. Sempre il `2026-03-11`, `Analisi Economica` ha ottenuto anche la route clone dedicata `/next/analisi-economica/:targa`, mentre il vecchio deep link interno `?view=analisi` del dossier viene solo riallineato via redirect tecnico. Nella stessa giornata, il Dossier clone ha smesso di trattare i lavori del mezzo come listati non navigabili e li collega ora al dettaglio clone-safe `/next/dettagliolavori/:lavoroId`. `Gestione Operativa` resta navigabile con sezioni deep-linkabili read-only per inventario, materiali, attrezzature, manutenzioni e procurement clone-safe (`Acquisti` con `Ordini`, `Arrivi` e `Dettaglio ordine`), mentre `Lavori Da Eseguire`, `Ordine materiali`, `Prezzi & Preventivi`, `Listino Prezzi`, approvazioni `Capo Costi Mezzo` e PDF timbrati restano ancora bloccati in modo esplicito. Sempre dal `2026-03-11`, il clone installa anche una prima barriera runtime no-write per il subtree `/next`, capace di bloccare centralmente `storageSync`, upload/delete materiali, callable `aiCore`, endpoint Cisterna e gli endpoint mutanti applicativi noti intercettati via `fetch`; nella stessa giornata `Cisterna IA` e `Schede Test` sono stati resi navigabili in forma clone-safe, lasciando pero bloccati upload, analisi IA, save/update e salvataggi archivio. Sempre il `2026-03-11`, entra anche la prima tranche `Autisti Inbox` con le route clone `/next/autisti-inbox/cambio-mezzo`, `/next/autisti-inbox/log-accessi` e `/next/autisti-inbox/gomme`; nella stessa giornata entra anche la seconda tranche con `/next/autisti-inbox/controlli`, `/next/autisti-inbox/segnalazioni` e `/next/autisti-inbox/richiesta-attrezzature`. Sempre il `2026-03-11` entra ora anche la home clone-safe `/next/autisti-inbox`, che riusa `AutistiInboxHome` con `NextAutistiEventoModal`, riallinea i link interni alle route clone gia aperte e non lascia piu fuori `Autisti Admin`: entra infatti anche `/next/autisti-admin` come controparte reader-first, con tabs, filtri, foto e anteprime PDF ma nessuna rettifica o azione distruttiva. Nella stessa giornata viene predisposto anche `NextAutistiEventoModal`, variante clone-safe del modal eventi autisti che neutralizza `CREA LAVORO`, `IMPORTA IN DOSSIER` e ogni uscita legacy verso `dettagliolavori`, come prerequisito tecnico per importare in seguito `AutistiInboxHome` e poi valutare `Autista 360`. Sempre il `2026-03-11` entra infine la prima tranche clone-safe della vera app autisti su `/next/autisti`, con `AutistiGate`, `LoginAutista`, `SetupMezzo` e `HomeAutista` sotto layout dedicato fuori dalla `NextShell`, rewrite interno dei path legacy verso `/next/autisti/*`, redirect tecnico del vecchio placeholder `/next/autista` e blocco esplicito delle superfici ancora fuori perimetro (`Sgancia motrice`). Nella stessa giornata entra anche la seconda tranche della stessa app con route clone reali `/next/autisti/controllo` e `/next/autisti/cambio-mezzo`, gate clone dedicato che vede anche i controlli locali del clone e flusso `Gomme` raggiungibile dalla home senza simulare sincronizzazione madre. Sempre il `2026-03-11` entra ora anche il primo modulo della terza tranche con `/next/autisti/rifornimento`, pagina clone dedicata che replica il flusso utile del modulo madre ma salva solo in storage locale clone-safe. Nella stessa giornata entrano anche `/next/autisti/richiesta-attrezzature` e `/next/autisti/segnalazioni`, pagine clone dedicate con gestione foto solo locale e nessun upload/delete verso Storage. Sempre il `2026-03-11`, il clone riallinea anche la propria parita UI alla copertura reale: topbar shell estesa ai moduli gia attivi, quick link del Centro Controllo ricondotti alle controparti `/next` gia presenti e metadata route/modules aggiornati per raccontare `Autisti Inbox`, `Autisti Admin`, `Libretti Export`, `App Autisti` e le sottoroute `Cisterna` gia aperte. Sempre il `2026-03-11`, la parita strutturale del clone si allinea anche alla madre: `/next` diventa una vera `Home` clone autonoma, `/next/centro-controllo` replica la pagina madre dedicata, `Gestione Operativa` e procurement vengono spacchettati in route autonome (`/next/gestione-operativa`, `/next/inventario`, `/next/materiali-consegnati`, `/next/attrezzature-cantieri`, `/next/manutenzioni`, `/next/acquisti`, `/next/materiali-da-ordinare`, `/next/ordini-in-attesa`, `/next/ordini-arrivati`, `/next/dettaglio-ordine/:ordineId`), `Lavori Da Eseguire` ottiene la propria route clone `/next/lavori-da-eseguire`, `Mezzi` e `Dossier Mezzi` vengono separati su `/next/mezzi` e `/next/dossiermezzi`, `Dossier Gomme` e `Dossier Rifornimenti` smettono di essere sole subview e diventano route vere, e l'hub IA apre anche le child route autonome `/next/ia/apikey`, `/next/ia/libretto`, `/next/ia/documenti` e `/next/ia/copertura-libretti`, tutte con scritture ancora neutralizzate | 2026-03-11 |
| Blocco totale scritture nel clone | IMPORTATO READ-ONLY | Hardening rafforzato su `NextCentroControlloPage`, `NextDossierMezzoPage`, `NextMezziDossierPage` e shell `/next`: bloccati writer, persistenze locali che simulavano workflow, uscite legacy pericolose e azioni IA/upload. Dal `2026-03-11` il blocco non dipende piu solo dalla UI: una Fase 1 centrale installata in `main.tsx` ferma nel clone `storageSync.setItemSync/removeItemSync`, helper condivisi di upload/delete materiali, callable `aiCore`, endpoint mutanti Cisterna e, dopo la correzione della regressione letture dello stesso giorno, solo le `fetch` verso endpoint mutanti applicativi noti (`Cloud Functions`, `Cloud Run` e `/api/*` del progetto), lasciando passare il traffico infrastrutturale di Firebase/Auth/SDK. Nella stessa giornata e stato aggiunto un hardening Fase 2 mirato con wrapper `firestoreWriteOps` / `storageWriteOps`, gia cablati sui writer diretti di `Cisterna IA` e `Schede Test` (`addDoc`, `updateDoc`, `uploadBytes`) per preparare la loro futura migrazione clone-safe; restano ancora fuori i mutator SDK diretti del resto del repo. Sempre il `2026-03-11`, la prima tranche `/next/autisti/*` aggiunge anche un livello UX clone-safe specifico: sessione locale autisti namespaced e confinata al clone, banner esplicito sul fatto che login/mezzo attivo restano locali al subtree e blocco sobrio delle azioni che darebbero falsa impressione di sincronizzazione madre. Nella stessa giornata, la seconda tranche autisti estende lo stesso perimetro no-write con controllo e cambio mezzo salvati solo nel clone e con il `Salva` del modal `Gomme` intercettato prima che possa sembrare una sincronizzazione riuscita sulla madre. Sempre il `2026-03-11`, `Rifornimento` entra nel clone solo con pagina dedicata e persistenza locale clone-only, evitando sia `storageSync` sia il `setDoc` diretto verso `storage/@rifornimenti` usato dal modulo madre. Nella stessa giornata, `RichiestaAttrezzature` e `Segnalazioni` entrano nel clone solo con pagine dedicate, persistenza locale clone-only e foto preparate come anteprime locali senza `uploadBytes`, `deleteObject` o `getDownloadURL` reali. Sempre il `2026-03-11`, `Autisti Admin` entra solo come pagina reader-first: nessuna CTA scrivente, nessuna rettifica reale, nessun delete allegati e nessun `crea lavoro` esposto dalla nuova route clone `/next/autisti-admin` | 2026-03-11 |
| Lettura dati reali nel clone | IMPORTATO READ-ONLY | Il clone legge gia gli stessi dataset reali della madre nelle aree prioritarie, compresi `@lavori`, `@materialiconsegnati`, `@manutenzioni`, `@mezzi_aziendali`, `@colleghi`, `@fornitori`, `@rifornimenti`, `@rifornimenti_autisti_tmp`, `@costiMezzo`, `@analisi_economica_mezzi`, `@ordini`, `@alerts_state`, `@autisti_sessione_attive`, `@storico_eventi_operativi`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti` e collezioni documentali IA; dal `2026-03-10` lavori, materiali/movimenti, rifornimenti, documenti/costi, manutenzioni/gomme, Centro di Controllo, `Mezzi / Anagrafica flotta`, procurement clone-safe e ora anche `Colleghi` / `Fornitori` passano pero attraverso layer dedicati read-only che normalizzano merge, dedup, parsing, shape sporche e aggregazioni solo nel dominio | 2026-03-11 |
| Layer puliti dedicati NEXT | IMPORTATO READ-ONLY | Layer clone attivi su `Anagrafiche flotta`, `Colleghi`, `Fornitori`, `Lavori`, `Materiali / Movimenti`, `Inventario`, `Attrezzature cantieri`, `Rifornimenti`, `Documenti + Costi`, `Manutenzioni + Gomme`, `Centro di Controllo / Eventi`, `Procurement / Ordini`, `Area Capo`, `Gestione Operativa`, `Libretti Export` e ora anche `Cisterna`: `src/next/nextAnagraficheFlottaDomain.ts`, `src/next/domain/nextColleghiDomain.ts`, `src/next/domain/nextFornitoriDomain.ts`, `src/next/domain/nextLavoriDomain.ts`, `src/next/domain/nextMaterialiMovimentiDomain.ts`, `src/next/domain/nextInventarioDomain.ts`, `src/next/domain/nextAttrezzatureCantieriDomain.ts`, `src/next/domain/nextRifornimentiDomain.ts`, `src/next/domain/nextDocumentiCostiDomain.ts`, `src/next/domain/nextManutenzioniGommeDomain.ts`, `src/next/domain/nextCentroControlloDomain.ts`, `src/next/domain/nextProcurementDomain.ts`, `src/next/domain/nextCapoDomain.ts`, `src/next/domain/nextOperativitaGlobaleDomain.ts`, `src/next/domain/nextLibrettiExportDomain.ts` e `src/next/domain/nextCisternaDomain.ts`. Sempre dal `2026-03-11`, `src/next/domain/nextLavoriDomain.ts` non alimenta piu solo il Dossier per-mezzo ma anche le liste globali clone-safe `Lavori in attesa` e `Lavori eseguiti`, oltre al nuovo resolver read-only del dettaglio per `lavoroId`, includendo pure i record `MAGAZZINO` o senza targa senza portare letture raw nella UI; `src/next/domain/nextCisternaDomain.ts` ricostruisce invece archivio, report mensile e ripartizioni per targa usando i dataset cisterna reali senza trascinare writer o raw reads nella UI | 2026-03-11 |
| IA sopra layer puliti | IN PREPARAZIONE | Rinviata a fase successiva, sopra il clone | 2026-03-10 |
| Tracking d'uso NEXT | IN PREPARAZIONE | Rinviato a fase successiva, sopra il clone | 2026-03-10 |

## 5.1 Aggiornamento 2026-03-12 - Parita UI reale clone/madre
- La shell `/next` e la shell `/next/autisti/*` sono state alleggerite dal chrome clone-only: il clone presenta ora la stessa percezione base della madre, con notice minimi e senza topbar clone dedicata.
- Le principali pagine clone non usano piu pannelli custom o reader-first: su `/next` vengono montate direttamente le pagine madre reali per `Home`, `Gestione Operativa`, procurement, `Dettaglio Lavoro`, `Autisti Admin`, child route IA prioritarie, `Cisterna`, `Mezzi`, `Dossier Lista`, `Dossier Mezzo` e `Analisi Economica`.
- Il blocco no-write resta confinato al clone tramite `NextMotherPage` e `nextCloneNavigation`: i writer madre restano visibili ma vengono disabilitati o neutralizzati nel subtree `/next`, senza riaprire scritture vere.
- Il modal eventi autisti non e piu impoverito nel clone: CTA e modale madre restano visibili, ma la conferma finale e bloccata nel runtime clone.
- Restano esplicitamente fuori dalla parita 1:1 di questa patch `Autista 360` e `Mezzo 360`, che rimangono bucket di rifondazione e non semplice riallineamento.

## 5.2 Aggiornamento 2026-03-12 - Scaffolding IA interna isolato
- Sotto la famiglia clone IA e stato aperto il nuovo subtree `/next/ia/interna*`, dedicato al futuro sottosistema IA interno ma non operativo.
- Il nuovo perimetro vive solo nel clone/NEXT e non modifica i flussi madre o i moduli business correnti.
- Lo scaffolding include:
  - route UI isolate per overview, sessioni, richieste, artifacts e audit;
  - model/types locali per `ai_sessions`, `ai_requests`, `analysis_artifacts`, `ai_audit_log` e stati `preview` / `approval`;
  - contratti stub per orchestrator, retrieval, artifact repository, audit log e approval workflow;
  - repository mock locale e tracking d'uso solo in-memory, confinato al subtree IA interno.
- L'archivio artifact in questo step e ammesso solo come shell + model + mock repository non persistente; non usa Storage, Firestore o path business.
- Non vengono riusati a runtime i moduli IA/PDF legacy (`aiCore`, `estrazioneDocumenti`, `analisi_economica_mezzo`, `stamp_pdf`, Cloud Run libretto, `server.js`).
- Nessun segreto lato client, nessuna scrittura business e nessun hook globale invasivo sono stati introdotti dalla patch.

## 5.3 Aggiornamento 2026-03-12 - Fix crash subtree IA interno
- Corretto un loop di render nel nuovo subtree `/next/ia/interna*` causato dal tracking in-memory cablato con `useSyncExternalStore`.
- La causa era uno snapshot non cached: `readInternalAiTrackingSummary()` restituiva un nuovo oggetto a ogni render, facendo scattare il warning React su `getSnapshot` e il conseguente `Maximum update depth exceeded`.
- Il fix resta confinato al tracking locale del sottosistema IA interno e non modifica route, backend, business data o moduli legacy.
- Le liste renderizzate del subtree IA sono state ricontrollate: le mappe attive usano gia key stabili e non e stato necessario introdurre altre modifiche strutturali.

## 5.4 Aggiornamento 2026-03-12 - Primo use case IA interna: report targa in anteprima
- Il subtree `/next/ia/interna*` ospita ora il primo use case reale ma sicuro del sottosistema IA interno: ricerca per targa, lettura in sola lettura e composizione di una anteprima report dentro il clone.
- La lettura riusa il composito `readNextDossierMezzoCompositeSnapshot` e i relativi layer NEXT gia normalizzati per:
  - anagrafica flotta;
  - lavori;
  - manutenzioni e gomme;
  - rifornimenti;
  - movimenti materiali;
  - documenti/costi;
  - eventuale analisi economica legacy salvata.
- Il nuovo facade del sottosistema IA vive solo nel perimetro clone/NEXT e non introduce:
  - writer Firestore/Storage business;
  - backend IA reale;
  - riuso runtime di moduli IA legacy;
  - segreti lato client.
- La bozza del report puo essere salvata solo come sessione/richiesta/bozza simulata nel repository locale del sottosistema IA; nessuna persistenza business viene toccata.
- I testi visibili del subtree IA interno sono stati riallineati in italiano.

## 5.5 Aggiornamento 2026-03-12 - Checklist unica IA interna
- Creata `docs/product/CHECKLIST_IA_INTERNA.md` come fonte operativa unica del sottosistema IA interno.
- La checklist ricostruisce retroattivamente i passaggi gia chiusi:
  - audit architetturale;
  - innesto sul clone/NEXT;
  - linee guida;
  - stato avanzamento;
  - scaffolding isolato;
  - model/types;
  - contracts/repository mock;
  - tracking sicuro;
  - fix crash tracking snapshot;
  - primo use case report targa in anteprima.
- La checklist registra anche il filone futuro `Modello camion con IA`, oggi allo stato `NON FATTO`.
- Da ora ogni task relativo al sottosistema IA interno sotto `/next/ia/interna*` deve aggiornare obbligatoriamente la checklist unica.

## 5.6 Aggiornamento 2026-03-12 - Archivio artifact IA persistente solo locale
- Il subtree `/next/ia/interna*` usa ora un archivio artifact persistente solo locale, namespaced e confinato al clone.
- La decisione e stata presa dopo verifica di sicurezza: Firestore/Storage dedicati non sono ancora dimostrabili come contenitori sicuri nel repo perche restano aperti `firestore.rules`, policy Storage effettive e auth anonima.
- Il use case `report targa in anteprima` continua a leggere solo dai layer NEXT in sola lettura e puo ora:
  - salvare il report come `draft`;
  - ritrovare l'artifact nell'archivio IA interno;
  - distinguerlo da `preview` e `archiviato`;
  - riaprirlo nella UI IA interna.
- Nessun dataset business e nessun path Storage business vengono toccati da questa persistenza.

## 5.7 Aggiornamento 2026-03-12 - Chat interna controllata del sottosistema IA
- La panoramica `/next/ia/interna` espone ora una prima chat interna controllata, locale e reversibile, coerente con la UI del gestionale.
- La chat non usa provider reali, backend IA, moduli IA legacy, Cloud Run o endpoint esistenti del repo.
- Gli intenti oggi supportati sono solo:
  - aiuto/capacita reali del sottosistema;
  - report targa in anteprima;
  - risposta esplicita alle richieste non ancora supportate o non sicure.
- L'intento `report targa` riusa il facade read-only gia esistente del sottosistema IA e aggiorna la stessa sezione preview/artifact senza introdurre writer business.
- I messaggi restano solo in memoria nella pagina corrente; non viene introdotta nessuna persistenza business o server-side.

## 5.8 Aggiornamento 2026-03-12 - Ricerca guidata mezzi per il report targa IA interno
- Il use case `/next/ia/interna` per la preview report targa legge ora l'elenco mezzi reali dal layer NEXT `readNextAnagraficheFlottaSnapshot`, gia usato dal clone per la flotta in sola lettura.
- La UI espone un autosuggest leggero e locale che filtra mentre si scrive e mostra, oltre alla targa, anche il minimo contesto gia disponibile nei readers puliti:
  - marca/modello;
  - categoria;
  - eventuale autista.
- La preview parte solo da un mezzo selezionato o da una corrispondenza esatta; le ricerche incomplete o ambigue chiedono esplicitamente una selezione guidata prima di leggere il report.
- Nessun writer business, nessun backend IA reale e nessun modulo IA legacy vengono toccati da questo affinamento.
- La chat interna mock non e stata intrecciata a questo autosuggest nello stesso task, per mantenere il perimetro delle patch separato e reversibile.

## 5.9 Aggiornamento 2026-03-13 - Memoria operativa locale e tracking persistente del modulo IA
- Il subtree `/next/ia/interna*` usa ora una memoria operativa locale namespaced e persistente nel browser del clone, separata dai dataset business.
- La memoria conserva solo elementi del modulo IA:
  - ultime targhe cercate;
  - prompt recenti della chat;
  - artifact recenti aperti, salvati o archiviati;
  - intenti usati;
  - ultimo stato di lavoro del sottosistema.
- Il tracking resta non invasivo e confinato alle sole azioni del modulo IA interno, senza agganciare navigazione o comportamento del gestionale fuori da `/next/ia/interna*`.
- La UI overview espone una sezione minima di memoria recente, utile per riprendere il lavoro nel modulo senza introdurre memoria operativa globale del gestionale.
- Nessun backend reale, nessun provider IA, nessun writer Firestore/Storage business e nessun modulo IA legacy vengono coinvolti da questa patch.

## 5.10 Aggiornamento 2026-03-13 - Audit e trasparenza del blocco materiali nel report mezzo IA interno
- Il report mezzo del sottosistema `/next/ia/interna*` usa ora un blocco materiali piu esplicito sul livello di affidabilita del collegamento mezzo-movimento, senza cambiare il perimetro `read-only` del clone.
- Il dominio `src/next/domain/nextMaterialiMovimentiDomain.ts` classifica il match mezzo/materiale in modo prudente:
  - `forte` se la targa e leggibile in modo esplicito in `destinatario.label` o `destinatario.refId`;
  - `plausibile` se rimane solo il collegamento legacy `destinatario.refId = id mezzo`;
  - i casi conflittuali o non dimostrabili non vengono promossi a match certi.
- La facade IA e l'aggregatore dossier espongono ora conteggi e testi trasparenti su:
  - quanti movimenti materiali sono collegati con match forti;
  - quanti restano solo plausibili;
  - quanto il filtro periodo sia affidabile o parziale sui record davvero databili.
- Audit read-only sui dati correnti:
  - `@materialiconsegnati` contiene 18 record, oggi tutti fortemente riconducibili a una targa e tutti con data parsabile;
  - `@documenti_magazzino` offre solo supporto descrittivo ai costi materiali, con 1 documento e 3 righe `voci` senza chiave targa dedicata.
- Nessun writer e stato aperto o riattivato: il task resta confinato a lettura, matching prudente e trasparenza del report IA interno.

## 5.11 Aggiornamento 2026-03-13 - Audit e trasparenza del blocco documenti-costi nel report mezzo IA interno
- Il report mezzo del sottosistema `/next/ia/interna*` separa ora in modo esplicito tre livelli distinti del perimetro economico:
  - documenti/costi diretti letti dal layer clone-safe;
  - snapshot analitico legacy salvato;
  - workflow procurement/approvazioni fuori perimetro base del report mezzo.
- Il dominio `src/next/domain/nextDocumentiCostiDomain.ts` continua a leggere solo `@costiMezzo` e le collezioni documentali IA, ma dichiara ora meglio:
  - che `@analisi_economica_mezzi` non e un documento/costo base;
  - che `@preventivi` e `@preventivi_approvazioni` non entrano nel layer mezzo-centrico;
  - quanto il filtro periodo sui record diretti sia affidabile o prudenziale.
- La facade IA e l'aggregatore dossier espongono ora testi piu trasparenti su:
  - fonti dirette davvero incluse;
  - snapshot analitico separato;
  - procurement e approvazioni presenti nel repo ma esclusi dal blocco economico del report.
- Audit read-only sui dati correnti:
  - `@costiMezzo` contiene 0 record;
  - `@documenti_mezzi` contiene 3 record, tutti con targa/data/importo/file leggibili;
  - `@documenti_magazzino` contiene 1 record senza targa diretta, quindi non promuovibile a documento economico certo del mezzo;
  - `@documenti_generici` contiene 0 record;
  - `@analisi_economica_mezzi` contiene 1 snapshot con docId=targa e `updatedAt` leggibile;
  - `@preventivi` contiene 7 record ma nessuno con targa diretta del mezzo;
  - `@preventivi_approvazioni` contiene 1 record, utile solo come stato approvativo read-only del dominio capo.
- Nessun writer e stato aperto o riattivato: il task resta confinato a lettura, perimetrazione corretta e trasparenza del report IA interno.

## 5.12 Aggiornamento 2026-03-13 - Decisione strutturale sul perimetro procurement nel report mezzo IA interno
- Il clone espone ora in modo esplicito anche la decisione strutturale sul perimetro `procurement / preventivi / approvazioni` del report mezzo IA interno.
- Il supporto aggiunto in `src/next/domain/nextDocumentiCostiDomain.ts` legge in sola lettura `storage/@preventivi` e `storage/@preventivi_approvazioni` solo per audit di perimetro, non per fonderli nel blocco economico diretto del mezzo.
- Audit read-only sui dati correnti:
  - `storage/@preventivi` contiene 7 record ma 0 match forti sulla targa;
  - `storage/@preventivi_approvazioni` contiene 1 record per la targa auditata;
  - l'approvazione letta punta a `@documenti_mezzi`, quindi oggi rappresenta solo uno stato approvativo su documento diretto gia mezzo-centrico.
- Decisione corrente del clone:
  - `@preventivi` resta fuori perimetro del report mezzo IA;
  - il procurement puo al massimo comparire come supporto parziale separato se in futuro emergeranno match forti espliciti;
  - `@preventivi_approvazioni` non va trattato come copertura procurement del mezzo, ma solo come overlay read-only su record diretti gia presenti.
- La facade del report IA e il composito dossier mostrano ora questa distinzione con testi italiani e conteggi espliciti, evitando falsa completezza economica.
- Nessun writer e stato aperto o riattivato: il task resta confinato a audit, perimetrazione e trasparenza del report IA interno.

## 5.13 Aggiornamento 2026-03-13 - Mappa permanente delle funzioni IA legacy da assorbire nella nuova IA
- Il clone e il sottosistema `/next/ia/interna*` dispongono ora di una mappa documentale permanente delle funzioni IA legacy della madre da assorbire, rifare o lasciare fuori dal perimetro iniziale.
- L'audit conferma che il valore business reale gia presente nel repo si concentra soprattutto in:
  - estrazione libretto mezzo;
  - estrazione documenti e classificazione;
  - analisi economica mezzo;
  - estrazione preventivi;
  - cluster cisterna come dominio separato.
- La decisione strutturale resta invariata sul runtime clone:
  - nessun backend legacy diventa canale canonico della nuova IA interna;
  - `aiCore`, `estrazioneDocumenti`, `analisi_economica_mezzo`, Cloud Run libretto, `stamp_pdf`, `server.js` e gli altri canali legacy restano solo riferimento tecnico o capability da rifare in backend dedicato;
  - i writer business diretti delle pagine IA legacy non entrano nel clone.
- La mappa `docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md` diventa base obbligatoria per i futuri task IA che propongono nuove capability nel clone.

## 5.14 Aggiornamento 2026-03-13 - Ridisegno UI del sottosistema IA interna
- La route `/next/ia/interna*` usa ora una UI piu pulita, semplice e professionale senza cambiare letture dati, facade o domain del sottosistema IA interno.
- La home del modulo mette al centro:
  - chat principale;
  - input ampio e pulito;
  - pochi suggerimenti iniziali;
  - ricerca report mezzo con stato ordinato e suggerimenti guidati;
  - area secondaria compatta per archivio, recenti e modalita non ancora attive.
- La preview report mezzo assume ora una struttura piu vicina al dossier mezzi:
  - hero iniziale con identita mezzo e stati;
  - card di riepilogo in alto;
  - sezioni principali nel corpo centrale;
  - fonti/copertura e azioni in colonna laterale;
  - dati mancanti ed evidenze in blocchi separati e leggibili.
- Guard rail, contratti predisposti e memoria del modulo restano visibili ma sono stati spostati in area avanzata secondaria per ridurre il rumore tecnico nella schermata iniziale.
- Nessuna scrittura business, nessun backend IA reale e nessun riuso runtime dei moduli IA legacy sono stati introdotti da questo redesign: cambia solo la UX del clone.

## 5.15 Aggiornamento 2026-03-14 - Primo assorbimento capability legacy alta priorita: Analisi economica mezzo
- Il subtree `/next/ia/interna*` ospita ora il primo blocco reale di assorbimento di una capability legacy ad alta priorita, scegliendo `Analisi economica mezzo` come prima wave operativa.
- La scelta e stata fatta perche oggi e la capability alta con il miglior rapporto tra valore business e sicurezza nel clone:
  - legge gia dati reali tramite layer clone-safe esistenti;
  - non richiede upload, OCR o backend legacy da riattivare;
  - puo restare preview-first e read-only;
  - non apre scritture business automatiche.
- La patch runtime introduce:
  - `src/next/internal-ai/internalAiEconomicAnalysisFacade.ts` come facade dedicato read-only;
  - una preview economica separata nella home IA, attivabile da ricerca targa;
  - una lettura esplicita e spiegabile del perimetro: documenti/costi diretti + eventuale snapshot legacy salvato, con procurement fuori blocco diretto.
- Restano invariati i guard rail:
  - nessun backend legacy canonico;
  - nessuna scrittura Firestore/Storage business;
  - nessuna modifica alla madre;
  - nessun impatto sui flussi correnti del clone o della legacy.

## 5.16 Aggiornamento 2026-03-14 - Riordino serio UI home/preview del sottosistema IA interna
- La route `/next/ia/interna*` usa ora una home molto piu essenziale e una preview grande separata dalla schermata iniziale.
- La patch clone-side su `src/next/NextInternalAiPage.tsx` e `src/next/internal-ai/internal-ai.css` ha introdotto:
  - chat centrale come ingresso principale;
  - richiesta targa compatta con due sole azioni primarie;
  - preview report/analisi aperta in overlay dedicato, con riepilogo in alto e sezioni sotto;
  - area secondaria ridotta ad archivio/recenti e dettagli avanzati comprimibili.
- Verifiche tecniche del task:
  - l'errore Vite segnalato su `NextInternalAiPage.tsx` non e riproducibile nello stato corrente del repo;
  - la build del clone passa;
  - nel subtree IA sono state corrette `key` deboli per ridurre il warning React sulle liste.
- Restano invariati i guard rail del clone:
  - nessuna modifica a facade/domain/logica dati salvo normalissimo wiring UI locale;
  - nessuna scrittura business;
  - nessun riuso runtime dei moduli IA legacy;
  - nessun impatto sui flussi correnti.

## 5.17 Aggiornamento 2026-03-14 - Pulizia dossier-like della preview IA interna
- La route `/next/ia/interna*` usa ora una preview molto piu vicina alla logica di un dossier leggibile e molto meno simile a una dashboard tecnica.
- La patch clone-side su `src/next/NextInternalAiPage.tsx` e `src/next/internal-ai/internal-ai.css` ha introdotto:
  - riepilogo esecutivo con poche card chiave visibili subito;
  - sezioni principali del report rese centrali nella lettura;
  - fonti, limiti, stati e azioni spostati dietro espansioni secondarie;
  - home alleggerita ulteriormente con archivio/recenti e modalita non attive piu secondari.
- Verifiche tecniche del task:
  - `npx eslint src/next/NextInternalAiPage.tsx` passa;
  - `npm run build` passa;
  - nessun layer dati o writer business e stato toccato.
- Restano invariati i guard rail del clone:
  - nessuna modifica a facade/domain/logica dati;
  - nessuna scrittura business;
  - nessun riuso runtime dei moduli IA legacy;
  - nessun impatto sui flussi correnti.

## 5.18 Aggiornamento 2026-03-14 - Stabilita console/hot reload del perimetro IA interna
- Eseguita una verifica tecnica separata sui problemi segnalati dal browser per la UI del sottosistema `/next/ia/interna*`.
- Esito verifica:
  - `src/next/NextInternalAiPage.tsx` non presenta oggi errori sintattici o import/export rotti persistenti;
  - `npx eslint src/next/NextInternalAiPage.tsx` passa;
  - `npm run build` passa;
  - il `500 / failed to reload` Vite sul file non e riproducibile nello stato corrente del repo.
- Root cause trovata per il warning React:
  - il warning su `Home` non nasceva dal subtree IA, ma dalla `Home` madre montata nel clone come controparte `/next`;
  - alcune liste in `src/pages/Home.tsx` usavano `key` potenzialmente duplicate basate solo su `targa`.
- Correzione applicata:
  - fix minimo e diretto nella `Home` madre per rendere stabili le `key` delle liste, senza toccare la logica dati e senza modificare il runtime del sottosistema IA.
- Stato clone dopo il task:
  - nessuna modifica a facade/domain/backend del clone IA;
  - nessuna scrittura business;
  - nessun cambiamento di perimetro funzionale o stato `read-only`.

## 6. Regole di aggiornamento per il nuovo corso
Per ogni task futuro che tocca la NEXT bisogna aggiornare questo documento segnando almeno:
1. cosa del clone e stato archiviato, creato o modificato;
2. quali schermate madre sono gia state replicate in `read-only`;
3. come sono state bloccate le scritture;
4. quali letture reali sono gia state mantenute;
5. quali parti restano ancora fuori dal clone;
6. aggiungere anche la voce corrispondente in `docs/product/REGISTRO_MODIFICHE_CLONE.md`.
7. se il task tocca il sottosistema IA interno, aggiornare anche `docs/product/CHECKLIST_IA_INTERNA.md`.

## 7. Stato documento
- **STATO: CURRENT**
