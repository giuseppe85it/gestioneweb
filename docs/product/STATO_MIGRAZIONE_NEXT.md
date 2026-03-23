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

## 5.10 Aggiornamento 2026-03-13 - Ricerca guidata autisti e report autista read-only nel sottosistema IA
- Il subtree `/next/ia/interna*` supporta ora anche un secondo use case separato dal report targa: ricerca guidata autista reale e preview report autista in sola lettura.
- La lettura primaria degli autisti riusa il layer clone-safe `readNextColleghiSnapshot()` su `storage/@colleghi`, gia presente nel clone e gia normalizzato, senza introdurre nuove letture raw.
- La preview `report autista` legge solo fonti gia disponibili nel clone:
  - `storage/@colleghi` per i dati base autista;
  - `storage/@mezzi_aziendali` tramite `readNextAnagraficheFlottaSnapshot()` per i mezzi associati;
  - `D10 Centro Controllo` per eventuale ultimo mezzo noto e segnali operativi read-only;
  - `D04 Rifornimenti` per eventuali rifornimenti collegabili all'autista sui mezzi associati.
- La UI overview ora distingue in modo esplicito i due flussi:
  - `Anteprima report per targa`;
  - `Anteprima report per autista`.
- La memoria locale del modulo, il tracking interno e l'archivio artifact IA distinguono ora anche report e ricerche recenti di tipo autista.
- La chat mock del sottosistema IA riconosce ora anche richieste minime sul nuovo flusso autista, restando locale, controllata e senza backend reale.
- Nessuna scrittura Firestore/Storage business, nessun riuso runtime IA legacy, nessun segreto lato client e nessun impatto sui flussi correnti vengono introdotti da questa estensione.

## 5.11 Aggiornamento 2026-03-13 - Filtri temporali e contesto periodo nei report IA interni
- Il subtree `/next/ia/interna*` supporta ora un contesto periodo condiviso per report targa e report autista, sempre confinato al clone e al sottosistema IA interno.
- La UI overview espone un blocco unico `Contesto periodo del report` con:
  - preset `Tutto`;
  - `Ultimi 30 giorni`;
  - `Ultimi 90 giorni`;
  - `Ultimo mese`;
  - intervallo personalizzato `Da / A`.
- Il filtro periodo viene applicato davvero solo alle sezioni che, nei layer NEXT gia esistenti, espongono una data utilizzabile:
  - targa: lavori, manutenzioni, rifornimenti, documenti/costi;
  - autista: segnali operativi D10 e rifornimenti collegabili.
- Le sezioni non filtrabili o non abbastanza affidabili sul piano temporale restano visibili come contesto read-only, ma vengono marcate in preview con stato periodo esplicito (`Nessun filtro`, `Fuori filtro`, `Periodo non disponibile`, `Filtro applicato`).
- La chat mock del sottosistema IA puo ora interpretare anche richieste con contesto periodo esplicito e, in assenza di periodo nel prompt, riusa il periodo attivo nella UI guidata del modulo.
- La memoria locale e l'archivio artifact IA registrano ora anche il periodo usato per l'ultimo report, senza toccare dataset business, Storage business o backend IA reali.

## 5.12 Aggiornamento 2026-03-13 - Report combinato mezzo + autista + periodo nel sottosistema IA interno
- Il subtree `/next/ia/interna*` supporta ora anche una preview combinata che unisce:
  - mezzo reale;
  - autista reale;
  - periodo attivo del report.
- L'implementazione resta confinata al clone/NEXT e riusa in modo pulito i facade gia attivi:
  - `report targa` read-only;
  - `report autista` read-only;
  - tracking/memoria/artifact locali del modulo IA.
- Il matching mezzo-autista non viene mai presentato come verita implicita:
  - `forte` solo con conferma anagrafica `autistaId` sul mezzo;
  - `plausibile` con nome dichiarato sul mezzo o segnali compatibili D10/D04;
  - `non dimostrabile` se il repo non espone legami leggibili.
- La preview combinata mostra in modo separato:
  - contesto selezionato;
  - affidabilita del legame;
  - intersezione reale nel periodo;
  - vista mezzo riusata;
  - vista autista riusata;
  - fonti lette e dati mancanti.
- La chat mock del sottosistema IA riconosce ora anche richieste minime combinate mezzo + autista, restando locale, mock e senza backend reale.
- Nessuna scrittura Firestore/Storage business, nessun runtime IA legacy, nessun segreto lato client e nessun impatto sui flussi correnti vengono introdotti da questa patch.

## 5.13 Aggiornamento 2026-03-13 - Archivio intelligente artifact IA con ricerca e filtri
- Il subtree `/next/ia/interna*` espone ora un archivio artifact locale piu consultabile e scalabile, sempre confinato al clone e senza backend reale.
- L'archivio IA interno supporta ora:
  - ricerca testuale veloce sui metadati del report;
  - filtri combinabili per tipo report, stato, ambito, targa, autista e periodo;
  - ordinamento per ultimi aggiornati;
  - riapertura della preview corretta nel modulo overview.
- Il modello locale degli artifact e retrocompatibile con quelli gia presenti e aggiunge metadati scalabili:
  - famiglia/ambito report;
  - testo ricercabile;
  - affidabilita del matching combinato quando disponibile;
  - ultimo aggiornamento archivio memorizzato nella memoria locale del modulo.
- Le famiglie vengono assegnate solo a partire dai dataset gia letti dai facade esistenti; se il report attraversa piu ambiti o i metadati non bastano, il clone usa i fallback espliciti `misto` o `non classificato`.
- Nessuna scrittura Firestore/Storage business, nessun runtime IA legacy, nessun segreto lato client e nessun impatto sui flussi correnti vengono introdotti da questa patch.

## 5.14 Aggiornamento 2026-03-13 - Fix matching rifornimenti nel report autista IA interno
- Il facade read-only del `report autista` non limitava il problema ai dati D04, ma al perimetro mezzi usato per leggerli: i rifornimenti venivano cercati solo sui mezzi associati all'autista nell'anagrafica D01.
- Questo poteva escludere rifornimenti recenti leggibili nel clone quando l'autista risultava su mezzi osservati nei segnali operativi D10, ma non ancora allineati come associazione corrente in anagrafica.
- Il fix resta confinato al sottosistema `/next/ia/interna*` e amplia in modo trasparente solo il perimetro di lettura:
  - mezzi associati in D01;
  - mezzi osservati nelle sessioni, negli alert e nei focus D10 dello stesso autista.
- Il matching autista sui rifornimenti resta read-only e continua a usare solo i campi gia esposti dal layer D04 (`badgeAutista`, `autistaNome`) senza introdurre join business nuovi o scritture.
- Nessuna modifica alla madre, nessuna scrittura business, nessun runtime IA legacy e nessun impatto sugli altri report vengono introdotti da questo fix.

## 5.15 Aggiornamento 2026-03-13 - Audit strutturale lettura/incrocio dati IA interna
- Eseguito audit mirato dei facade `/next/ia/interna*` e dei layer NEXT realmente usati per report mezzo, report autista, report combinato, lookup, filtri periodo e chat mock.
- L'audit conferma come punti solidi:
  - riuso dei layer NEXT read-only gia verificati;
  - filtro periodo centralizzato e coerente tra i report;
  - separazione esplicita tra copertura completa, parziale e non filtrabile;
  - report combinato che non promuove a `forte` un legame mezzo-autista non dimostrato.
- L'audit segnala come priorita strutturali ancora aperte:
  - matching badge/nome ancora rigido nei facade autista e combinato;
  - fallback lookup/autista sensibili a omonimie;
  - contesto mezzi autista piu ricco nel blocco rifornimenti che nell'intestazione anagrafica del report.
- Fix minimo e sicuro applicato nello stesso task:
  - la chat mock del sottosistema IA ripulisce ora il suffisso periodo dalle richieste autista prima del lookup esatto, evitando falsi `not found` su prompt gia supportati come `Mario Rossi ultimo mese`.
- Nessuna scrittura Firestore/Storage business, nessun runtime IA legacy, nessun segreto lato client e nessun impatto sui flussi correnti vengono introdotti da questo audit.

## 5.16 Aggiornamento 2026-03-13 - Matching autista badge-first cross-layer
- Il subtree `/next/ia/interna*` applica ora una regola badge-first unica e centralizzata per il matching identita autista tra:
  - D01 anagrafiche persone/flotta;
  - D10 Centro Controllo;
  - D04 rifornimenti.
- La regola runtime del clone e ora esplicita:
  - `autistaId` sul mezzo o badge coerente nel record = match forte;
  - nome esatto = solo fallback plausibile quando il riferimento forte manca davvero;
  - badge o `autistaId` incoerenti = nessun match certo, anche se il nome coincide.
- Il lookup autista non promuove piu un nome esatto a match automatico se nel catalogo esistono omonimi; il badge resta il primo discriminante.
- Il report autista e il report combinato riusano la stessa logica centrale su:
  - blocco rifornimenti D04;
  - blocco segnali D10;
  - ricostruzione delle associazioni mezzo/autista da D01.
- L'affidabilita del report combinato viene ora riallineata alla stessa gerarchia:
  - `forte` con `autistaId` coerente o badge coerente osservato sui record del mezzo;
  - `plausibile` solo con fallback nome prudente;
  - `non dimostrabile` in presenza di incoerenze forti o mancanza di conferme.
- Nessuna scrittura Firestore/Storage business, nessun runtime IA legacy, nessun segreto lato client e nessun impatto sui flussi correnti vengono introdotti da questo riallineamento.

## 5.17 Aggiornamento 2026-03-13 - Audit e rafforzamento del report mezzo IA interno
- Eseguito audit mirato del `report targa` read-only del sottosistema IA interno, concentrato sui blocchi:
  - lavori;
  - manutenzioni / gomme;
  - rifornimenti;
  - materiali / movimenti;
  - documenti / costi;
  - analisi economica salvata.
- L'audit conferma come punti solidi:
  - riuso del composito clone-safe `readNextDossierMezzoCompositeSnapshot`;
  - filtro periodo applicato ai blocchi con data affidabile;
  - ricostruzione D04 gia prudente e multi-sorgente;
  - dedup documentale gia confinato nel layer dedicato.
- Restano espliciti come limiti strutturali aperti:
  - eventi gomme fuori `@manutenzioni` non ancora inclusi nel report mezzo;
  - movimenti materiali ancora dipendenti in parte da match legacy su `destinatario`;
  - blocco documenti/costi ancora limitato dal perimetro clone-safe che non apre `@preventivi` e approvazioni procurement.
- Fix minimo e sicuro applicato nello stesso task:
  - la preview del report mezzo considera ora anche movimenti materiali e analisi economica salvata come copertura reale, evitando stati troppo pessimisti quando questi sono gli unici blocchi disponibili;
  - la sezione `Documenti, costi e analisi` non viene piu resa come vuota quando esiste una analisi economica legacy salvata fuori filtro.
- Nessuna scrittura Firestore/Storage business, nessun runtime IA legacy, nessun segreto lato client e nessun impatto sui flussi correnti vengono introdotti da questo audit/fix.

## 5.18 Aggiornamento 2026-03-13 - Rafforzamento blocco gomme nel report mezzo IA interno
- Il blocco `Manutenzioni / Gomme` del `report targa` IA non dipende piu solo dalle descrizioni `CAMBIO GOMME` lette in `@manutenzioni`.
- Il layer clone-safe `nextManutenzioniGommeDomain` converge ora in sola lettura anche:
  - `@cambi_gomme_autisti_tmp`;
  - `@gomme_eventi`.
- Regola di matching mezzo introdotta nel layer:
  - `targetTarga` o `targa` coerenti = match forte;
  - `targaCamion`, `targaRimorchio` e `contesto.*` = solo match plausibile quando manca una targa diretta;
  - nessun match di contesto viene promosso a conferma forte del mezzo.
- Per evitare doppio conteggio, gli eventi gomme extra che risultano gia importati nello storico manutenzioni vengono deduplicati solo quando coincidono davvero su giorno, targa, asse, marca e km.
- La preview `/next/ia/interna` rende ora piu trasparente la copertura del blocco gomme:
  - eventi da manutenzioni;
  - eventi da dataset gomme dedicati;
  - match forti;
  - match plausibili.
- Restano volutamente fuori dalla conferma forte i record gomme senza targa diretta o con solo contesto ambiguo; il clone preferisce copertura parziale dichiarata a collegamenti non dimostrati.

## 5.19 Aggiornamento 2026-03-22 - Ripristino build del clone IA interna dopo merge incompleto
- Il clone `read-only` e tornato compilabile dopo la rimozione dei conflict marker residui lasciati da un merge/worktree incompleto nella pagina `src/next/NextInternalAiPage.tsx` e nei file IA interni strettamente collegati.
- Il ripristino ha riallineato:
  - runtime pagina IA interna;
  - tipi condivisi del sottosistema IA;
  - facade clone-safe del report mezzo compatibili con la build attuale;
  - registri documentali obbligatori del clone e dell'IA interna.
- Verifiche del task:
  - `npm run build` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx` -> OK.
- Stato del clone dopo il fix:
  - nessuna scrittura business riaperta;
  - nessun impatto sui flussi dati della madre;
  - perimetro `/next/ia/interna*` ancora isolato e `read-only`;
  - testi visibili del clone mantenuti in italiano.

## 5.20 Aggiornamento 2026-03-22 - Primo assorbimento preview-first documenti IA interni
- Il clone `/next/ia/interna*` espone ora un primo blocco secondario `Preview documenti collegabili al mezzo`.
- Il blocco legge davvero solo:
  - `@documenti_mezzi`;
  - record gia mezzo-centrici di `@costiMezzo`;
  - `@documenti_magazzino` e `@documenti_generici` solo quando la targa e gia leggibile nel layer clone-safe.
- La UI distingue in modo esplicito:
  - documenti diretti;
  - documenti plausibili;
  - flussi fuori perimetro.
- Restano fuori perimetro del primo step:
  - runtime legacy documenti (`IADocumenti`, `estrazioneDocumenti`);
  - OCR reale, upload Storage, classificazione automatica e scritture su `@documenti_*`;
  - `@preventivi`, approvazioni procurement e provider reali come backend canonico del blocco documenti.
- Verifiche del task:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiDocumentsPreviewFacade.ts` -> OK;
  - `npm run build` -> OK.
- Stato del clone dopo il task:
  - nessuna scrittura business riaperta;
  - nessun impatto sui flussi dati della madre;
  - blocco documenti IA interno integrato in modo secondario, reversibile e read-only;
  - testi visibili del clone mantenuti in italiano.

## 5.21 Aggiornamento 2026-03-22 - Primo assorbimento preview-first libretto IA interno
- Il clone `/next/ia/interna*` espone ora un blocco secondario `Preview libretto collegato al mezzo`.
- Il blocco legge davvero solo:
  - campi gia presenti sul mezzo in `@mezzi_aziendali`;
  - supporto clone-safe del layer `nextLibrettiExportDomain` per capire se il file libretto e gia disponibile nel clone.
- La UI distingue in modo esplicito:
  - dati libretto diretti;
  - dati plausibili o incompleti;
  - flussi fuori perimetro.
- Restano fuori perimetro del primo step:
  - runtime legacy `IALibretto`;
  - Cloud Run esterno e OCR reale;
  - upload file, salvataggi su `@mezzi_aziendali` e Storage business;
  - provider reali e segreti lato client.
- Verifiche del task:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiLibrettoPreviewFacade.ts` -> OK;
  - `npm run build` -> OK.
- Stato del clone dopo il task:
  - nessuna scrittura business riaperta;
  - nessun impatto sui flussi dati della madre;
  - blocco libretto IA interno integrato in modo secondario, reversibile e read-only;
  - testi visibili del clone mantenuti in italiano.

## 5.22 Aggiornamento 2026-03-22 - Primo assorbimento preview-first preventivi IA interni
- Il clone `/next/ia/interna*` espone ora un blocco secondario `Preview preventivi collegabili al mezzo`.
- Il blocco legge davvero solo:
  - preventivi gia mezzo-centrici esposti dal layer clone-safe `nextDocumentiCostiDomain`;
  - supporti plausibili dai record documentali gia normalizzati nel layer documenti/costi;
  - snapshot clone-safe di procurement (`@preventivi`, `@preventivi_approvazioni`) solo come contesto separato e diagnostico.
- La UI distingue in modo esplicito:
  - preventivi direttamente collegabili;
  - preventivi plausibili o supporti separati;
  - flussi fuori perimetro.
- Restano fuori perimetro del primo step:
  - runtime legacy preventivi (`Acquisti`, `estraiPreventivoIA`);
  - OCR reale, parsing AI, upload Storage e ingestione nuovi file;
  - scritture su `@preventivi`, `@preventivi_approvazioni`, `@documenti_*` e provider reali come backend canonico;
  - workflow approvativo e PDF timbrati.
- Verifiche del task:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiPreventiviPreviewFacade.ts` -> OK;
  - `npm run build` -> OK.
- Stato del clone dopo il task:
  - nessuna scrittura business riaperta;
  - nessun impatto sui flussi dati della madre;
  - blocco preventivi IA interno integrato in modo secondario, reversibile e read-only;
  - testi visibili del clone mantenuti in italiano.

## 5.23 Aggiornamento 2026-03-22 - Primo scaffolding backend IA separato
- Il repo ospita ora il primo perimetro dedicato al backend server-side del sottosistema IA interno in `backend/internal-ai/*`.
- La scelta architetturale e deliberatamente separata da:
  - `functions/*`;
  - `functions-schede/*`;
  - `api/*`;
  - `server.js`.
- Lo scaffold include:
  - contratti base server-side;
  - manifest di guard rail;
  - dispatcher framework-agnostico;
  - handler stub non operativi per `health`, orchestrazione preview, retrieval controllato, preview artifact e preparazione approvazioni.
- Stato runtime del clone dopo il task:
  - nessuna route `/next` viene collegata al nuovo backend;
  - il clone resta navigabile anche con backend IA separato spento;
  - nessuna scrittura business, nessun provider reale e nessun runtime legacy vengono riattivati.
- Verifiche del task:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint backend/internal-ai/src/*.ts` -> OK;
  - `npm run build` -> OK.

## 5.24 Aggiornamento 2026-03-22 - Primo ponte mock-safe tra clone IA e backend separato
- Il clone `/next/ia/interna*` usa ora un primo ponte mock-safe verso `backend/internal-ai/*`.
- La capability oggi instradata nel backend separato e solo:
  - `Preview documenti collegabili al mezzo`.
- Il flusso runtime del clone ora e:
  - pagina `/next/ia/interna`;
  - bridge frontend `internalAiDocumentsPreviewBridge`;
  - dispatcher `internalAiBackendService` sul path `orchestrator.preview`;
  - handler backend mock-safe per `documents-preview`;
  - fallback locale esplicito sul facade documenti clone-safe se il ponte non e pronto.
- Cosa non cambia:
  - nessun endpoint deployato reale del backend IA separato;
  - nessun provider reale o segreto;
  - nessuna scrittura business;
  - nessun backend legacy reso canonico.
- Cosa resta ancora solo frontend/mock locale:
  - `report targa`, `report autista`, `report combinato`;
  - `analisi economica`, `libretto`, `preventivi`;
  - chat interna controllata.
- Verifiche del task:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiDocumentsPreviewBridge.ts src/next/internal-ai/internalAiContracts.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts` -> OK;
  - `npm run build` -> OK.

## 5.25 Aggiornamento 2026-03-22 - Secondo ponte mock-safe tra clone IA e backend separato
- Il clone `/next/ia/interna*` usa ora un secondo ponte mock-safe verso `backend/internal-ai/*`.
- La capability oggi aggiunta al backend separato e:
  - `Analisi economica preview-first`.
- Il flusso runtime del clone ora e:
  - pagina `/next/ia/interna`;
  - bridge frontend `internalAiEconomicAnalysisPreviewBridge`;
  - dispatcher `internalAiBackendService` sul path `orchestrator.preview`;
  - handler backend mock-safe per `economic-analysis-preview`;
  - fallback locale esplicito sul facade economico clone-safe se il ponte non e pronto.
- Cosa non cambia:
  - nessun endpoint deployato reale del backend IA separato;
  - nessun provider reale o segreto;
  - nessuna scrittura business;
  - nessun backend legacy reso canonico.
- Cosa resta ancora solo frontend/mock locale:
  - `report targa`, `report autista`, `report combinato`;
  - `libretto`, `preventivi`;
  - chat interna controllata.
- Verifiche del task:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiEconomicAnalysisPreviewBridge.ts src/next/internal-ai/internalAiContracts.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts` -> OK;
  - `npm run build` -> OK.

## 5.26 Aggiornamento 2026-03-22 - Terzo e quarto ponte mock-safe tra clone IA e backend separato
- Il clone `/next/ia/interna*` usa ora anche il terzo e il quarto ponte mock-safe verso `backend/internal-ai/*`.
- Le capability oggi aggiunte al backend separato sono:
  - `Preview libretto collegato al mezzo`;
  - `Preview preventivi collegabili al mezzo`.
- Il flusso runtime del clone ora e:
  - pagina `/next/ia/interna`;
  - bridge frontend `internalAiLibrettoPreviewBridge` e `internalAiPreventiviPreviewBridge`;
  - dispatcher `internalAiBackendService` sul path `orchestrator.preview`;
  - handler backend mock-safe per `libretto-preview` e `preventivi-preview`;
  - fallback locale esplicito sui facade clone-safe se i ponti non sono pronti.
- Cosa non cambia:
  - nessun endpoint deployato reale del backend IA separato;
  - nessun provider reale o segreto;
  - nessuna scrittura business;
  - nessun backend legacy reso canonico.
- Cosa resta ancora solo frontend/mock locale:
  - `report targa`, `report autista`, `report combinato`;
  - chat interna controllata.
- Verifiche del task:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiLibrettoPreviewBridge.ts src/next/internal-ai/internalAiPreventiviPreviewBridge.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts` -> OK;
  - `npm run build` -> OK.

## 5.27 Aggiornamento 2026-03-22 - Quinto, sesto e settimo ponte mock-safe tra clone IA e backend separato
- Il clone `/next/ia/interna*` usa ora anche il quinto, il sesto e il settimo ponte mock-safe verso `backend/internal-ai/*`.
- Le capability oggi aggiunte al backend separato sono:
  - `Anteprima report per targa`;
  - `Anteprima report per autista`;
  - `Anteprima report combinato mezzo + autista`.
- Il flusso runtime del clone ora e:
  - pagina `/next/ia/interna`;
  - bridge frontend `internalAiVehicleReportPreviewBridge`, `internalAiDriverReportPreviewBridge` e `internalAiCombinedReportPreviewBridge`;
  - dispatcher `internalAiBackendService` sul path `orchestrator.preview`;
  - handler backend mock-safe per `vehicle-report-preview`, `driver-report-preview` e `combined-report-preview`;
  - fallback locale esplicito sui facade clone-safe se i ponti non sono pronti.
- Cosa non cambia:
  - nessun endpoint deployato reale del backend IA separato;
  - nessun provider reale o segreto;
  - nessuna scrittura business;
  - nessun backend legacy reso canonico.
- Cosa resta ancora solo frontend/mock locale:
  - chat interna controllata;
  - lookup/autosuggest di supporto al clone.
- Verifiche del task:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiVehicleReportPreviewBridge.ts src/next/internal-ai/internalAiDriverReportPreviewBridge.ts src/next/internal-ai/internalAiCombinedReportPreviewBridge.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts` -> OK;
  - `npm run build` -> OK.

## 5.28 Aggiornamento 2026-03-22 - Ottavo ponte mock-safe tra clone IA e backend separato
- Il clone `/next/ia/interna*` usa ora anche l'ottavo ponte mock-safe verso `backend/internal-ai/*`.
- La capability oggi aggiunta al backend separato e:
  - `Chat interna controllata backend-first`.
- Il flusso runtime del clone ora e:
  - pagina `/next/ia/interna`;
  - bridge frontend `internalAiChatOrchestratorBridge`;
  - dispatcher `internalAiBackendService` sul path `orchestrator.chat`;
  - handler backend mock-safe per `chat-orchestrator`;
  - fallback locale esplicito sull'orchestratore chat clone-safe se il ponte non e pronto.
- Cosa non cambia:
  - nessun endpoint deployato reale del backend IA separato;
  - nessun provider reale o segreto;
  - nessuna scrittura business;
  - nessun backend legacy reso canonico.
- Cosa resta ancora solo frontend/mock locale:
  - lookup/autosuggest di supporto al clone;
  - persistenza messaggi chat e tracking locale in memoria.
- Verifiche del task:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts` -> OK;
  - `npm run build` -> OK.

## 5.29 Aggiornamento 2026-03-22 - Primo adapter server-side reale e prima persistenza IA dedicata
- Il clone `/next/ia/interna*` usa ora anche un primo adapter server-side reale del backend IA separato, sempre in modalita mock-safe.
- Canale scelto nel repo:
  - adapter HTTP locale `backend/internal-ai/server/internal-ai-adapter.js`;
  - base path `/internal-ai-backend/*`;
  - persistenza dedicata in `backend/internal-ai/runtime-data/*`;
  - fallback locale esplicito nel clone se l'adapter non e acceso o non risponde.
- Cosa salva davvero lato server:
  - repository artifact/sessioni/richieste/audit IA in `analysis_artifacts.json`;
  - memoria operativa e tracking IA in `ai_operational_memory.json`;
  - traceability minima di letture/scritture IA in `ai_traceability_log.json`.
- Impatto sul runtime clone:
  - `NextInternalAiPage.tsx` tenta una hydration iniziale via `internalAiServerPersistenceBridge`;
  - `internalAiMockRepository` e `internalAiTracking` fanno mirror mock-safe verso l'adapter server-side dedicato;
  - nessuna route `/next` dipende in modo bloccante dall'adapter: se il server non e disponibile, il clone resta navigabile con persistenza locale di fallback.
- Cosa non cambia:
  - nessun provider reale o segreto;
  - nessuna scrittura Firestore/Storage business;
  - nessun backend legacy reso canonico;
  - nessun retrieval server-side reale di repo, Firestore o Storage business ancora attivo.
- Cosa resta ancora solo frontend/mock locale o in-process:
  - lookup/autosuggest di supporto al clone;
  - reader preview/chat ancora eseguiti sugli stessi layer clone-safe gia presenti;
  - persistenza locale di fallback del clone, che resta attiva come rete di sicurezza.
- Verifiche del task:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiMockRepository.ts src/next/internal-ai/internalAiTracking.ts src/next/internal-ai/internalAiServerPersistenceClient.ts src/next/internal-ai/internalAiServerPersistenceBridge.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendService.ts backend/internal-ai/src/internalAiServerPersistenceContracts.ts` -> OK;
  - smoke test adapter `health/read/write` via import Node locale -> OK;
  - `npm run build` -> OK.

## 5.30 Aggiornamento 2026-03-22 - Primo retrieval server-side read-only della nuova IA interna
- Il clone `/next/ia/interna*` usa ora anche un primo retrieval server-side controllato del backend IA separato.
- Perimetro attivo nel runtime clone:
  - solo contesto mezzo `D01/@mezzi_aziendali`;
  - solo snapshot read-only seedato dal clone;
  - sola capability `libretto-preview` sul nuovo retrieval;
  - fallback locale esplicito se l'adapter o lo snapshot non sono disponibili.
- Flusso runtime ora attivo per il libretto:
  - `NextInternalAiPage.tsx`;
  - bridge frontend `internalAiLibrettoPreviewBridge`;
  - client HTTP `internalAiServerRetrievalClient`;
  - adapter `backend/internal-ai/server/internal-ai-adapter.js` sul path `/internal-ai-backend/retrieval/read`;
  - snapshot locale `backend/internal-ai/runtime-data/fleet_readonly_snapshot.json`;
  - builder preview `internalAiLibrettoPreviewFacade`.
- Cosa legge davvero il retrieval server-side:
  - campi mezzo gia normalizzati del clone;
  - disponibilita `librettoUrl` e `librettoStoragePath`;
  - limitazioni dei layer clone-safe gia esistenti.
- Cosa non cambia:
  - nessuna lettura diretta Firestore/Storage business lato server;
  - nessun provider reale o segreto;
  - nessuna scrittura business;
  - nessun backend legacy reso canonico.
- Cosa resta ancora solo frontend/mock locale o in-process:
  - report targa, report autista, report combinato, documenti preview, analisi economica preview, preventivi preview e chat continuano sui ponti mock-safe gia aperti;
  - lookup/autosuggest di supporto restano frontend/in-process.
- Verifiche del task:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiLibrettoPreviewFacade.ts src/next/internal-ai/internalAiLibrettoPreviewBridge.ts src/next/internal-ai/internalAiServerRetrievalClient.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts backend/internal-ai/src/internalAiServerPersistenceContracts.ts backend/internal-ai/src/internalAiServerRetrievalContracts.ts` -> OK;
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK;
  - smoke test adapter `retrieval.read` via Node locale su porta dedicata `4311` -> OK;
  - `npm run build` -> OK.

## 5.31 Aggiornamento 2026-03-22 - Primo provider reale server-side + workflow preview/approval/rollback IA
- Il clone `/next/ia/interna*` apre ora il primo punto di aggancio a un provider reale lato server, ma solo su un workflow controllato e reversibile.
- Provider/canale scelti nel repo:
  - `OpenAI` lato server;
  - `Responses API`;
  - modello di default `gpt-5-mini`, configurabile via `INTERNAL_AI_OPENAI_MODEL`;
  - segreto solo server-side tramite `OPENAI_API_KEY`;
  - adapter canonico `backend/internal-ai/server/internal-ai-adapter.js`, separato da `functions/*`, `api/*` e `server.js`.
- Caso d'uso iniziale nel clone:
  - sintesi guidata del report attivo gia letto nel clone;
  - trigger UI minimo dentro `NextInternalAiPage.tsx`;
  - nessuna nuova scrittura business e nessuna applicazione automatica.
- Flusso runtime ora previsto:
  - report attivo nel clone;
  - client `internalAiServerReportSummaryClient`;
  - `POST /internal-ai-backend/artifacts/preview` per la preview;
  - `POST /internal-ai-backend/approvals/prepare` per approvazione, rifiuto e rollback;
  - persistenza IA dedicata in `backend/internal-ai/runtime-data/ai_preview_workflows.json`.
- Cosa viene salvato davvero lato server:
  - testo della preview generata;
  - contesto report strutturato usato come input;
  - stati `preview_ready`, `approved`, `rejected`, `rolled_back`;
  - traceability minima delle operazioni.
- Cosa non cambia:
  - nessuna scrittura Firestore/Storage business automatica;
  - nessun backend legacy reso canonico;
  - nessun segreto lato client;
  - chat reale, OCR, upload, parsing documentale e applicazioni business restano fuori perimetro.
- Stato reale del runner corrente:
  - `OPENAI_API_KEY` manca nel runner locale, quindi la chiamata reale al provider non e dimostrata end-to-end in questa sessione;
  - il clone mostra comunque il workflow e mantiene fallback/mock-safe quando il provider non e disponibile;
  - approval e rollback server-side sono stati verificati sul contenitore IA dedicato, senza toccare dati business.
- Verifiche del task:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiServerReportSummaryClient.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendService.ts backend/internal-ai/src/internalAiServerPersistenceContracts.ts` -> OK;
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK;
  - smoke test `GET /internal-ai-backend/health` -> OK;
  - smoke test `POST /internal-ai-backend/artifacts/preview` con esito `provider_not_configured` senza segreto -> OK;
  - smoke test `approve_preview` + `rollback_preview` su workflow IA dedicato -> OK;
  - `npm run build` -> OK.

## 5.32 Aggiornamento 2026-03-22 - OpenAI attivato davvero nel backend IA della NEXT
- Il backend IA separato della NEXT e ora verificato anche con chiamata reale a OpenAI, senza allargare i casi d'uso gia aperti.
- Dove e come viene letta davvero la chiave:
  - solo in `backend/internal-ai/server/internal-ai-adapter.js`;
  - solo da `process.env.OPENAI_API_KEY`;
  - mai dal client e mai dal codice sorgente versionato.
- Esito reale del flusso end-to-end:
  - processo server-side dedicato avviato su porta `4311`;
  - `health` -> `providerEnabled: true`, modello `gpt-5-mini`;
  - `artifacts.preview` -> preview reale generata e salvata nel contenitore IA dedicato;
  - `approve_preview` -> stato `approved`;
  - `reject_preview` -> stato `rejected`;
  - `rollback_preview` -> stato `rolled_back` su workflow approvato.
- Cosa non cambia:
  - il caso d'uso resta solo la sintesi guidata del report gia letto;
  - nessuna scrittura Firestore/Storage business automatica;
  - nessun backend legacy reso canonico;
  - fallback mock-safe invariato se il processo non eredita la variabile o il provider fallisce.
- Nota operativa:
  - nel runner corrente `OPENAI_API_KEY` e presente a livello utente Windows, ma la shell puo non ereditarla automaticamente;
  - per questo task la variabile e stata propagata solo al processo server-side dedicato, senza modificare codice o client.
- Verifiche del task:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiServerReportSummaryClient.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendService.ts backend/internal-ai/src/internalAiServerPersistenceContracts.ts` -> OK;
  - smoke test reale `health` + `artifacts.preview` + `approve_preview` + `reject_preview` + `rollback_preview` su porta `4311` -> OK;
  - `npm run build` -> OK.

## 5.33 Aggiornamento 2026-03-22 - Chat reale controllata + primo repo/UI understanding nel clone IA
- Il clone `/next/ia/interna*` usa ora anche la chat reale server-side controllata del backend IA separato e mostra un primo pannello di comprensione controllata di repository e UI.
- Ponte scelto nel runtime clone:
  - `NextInternalAiPage.tsx`;
  - `internalAiChatOrchestratorBridge` + `internalAiServerChatClient`;
  - `POST /internal-ai-backend/orchestrator/chat`;
  - provider `OpenAI Responses API` solo server-side;
  - fallback locale clone-safe se adapter o provider non sono disponibili.
- Primo livello repo/UI understanding nel clone:
  - `internalAiServerRepoUnderstandingClient`;
  - `POST /internal-ai-backend/retrieval/read`;
  - operazione `read_repo_understanding_snapshot`;
  - pannello overview dedicato che espone fonti, route rappresentative, pattern UI, relazioni tra schermate e limiti del perimetro.
- Cosa legge davvero lato server questo nuovo livello:
  - documenti architetturali/stato chiave del repo;
  - macro-aree e route rappresentative della NEXT;
  - pattern UI rappresentativi;
  - relazioni principali tra schermate;
  - file sorgente rappresentativi della UI.
- Cosa non cambia:
  - nessuna scrittura Firestore/Storage business;
  - nessun segreto lato client;
  - nessun backend legacy reso canonico;
  - nessuna patch automatica del repository;
  - fallback locale esplicito sempre disponibile lato clone.
- Stato reale verificato:
  - senza `OPENAI_API_KEY` nel processo server-side, `orchestrator.chat` risponde `provider_not_configured` e il clone resta sul fallback locale;
  - con `OPENAI_API_KEY` propagata al solo processo server-side, `health` risponde `providerEnabled: true`;
  - `retrieval.read(read_repo_understanding_snapshot)` -> snapshot repo/UI curata costruita e letta correttamente;
  - `orchestrator.chat` repo/UI-aware -> risposta reale del provider con `usedRealProvider: true`;
  - `orchestrator.chat` con `reportContext` -> risposta reale del provider con `usedRealProvider: true`.
- Cosa resta ancora solo frontend/mock locale o fuori perimetro:
  - lookup/autosuggest e supporti minori;
  - qualunque modifica codice automatica;
  - retrieval completo di tutti i dati business lato server;
  - writer business o automazioni operative.
- Verifiche del task:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiServerChatClient.ts src/next/internal-ai/internalAiServerRepoUnderstandingClient.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiLibrettoPreviewBridge.ts` -> OK;
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK;
  - smoke test adapter `retrieval.read` + `orchestrator.chat` senza segreto nel processo server-side -> OK;
  - smoke test reale `health` + `retrieval.read(read_repo_understanding_snapshot)` + `orchestrator.chat` repo/UI-aware + `orchestrator.chat` con `reportContext` su processo server-side dedicato con `OPENAI_API_KEY` -> OK;
  - `npm run build` -> OK.

## 5.34 Aggiornamento 2026-03-22 - Repo understanding esteso + audit readiness Firebase nel clone IA
- Il clone `/next/ia/interna*` mostra ora un pannello di comprensione repository piu ricco e verificato, senza aprire accessi business pericolosi.
- Estensione concreta aperta nel backend IA separato:
  - la snapshot `read_repo_understanding_snapshot` include ora anche un indice filesystem controllato di file sotto `src/next`, `src/pages`, `src/components` e `backend/internal-ai`;
  - vengono esposte anche relazioni CSS importate, relazioni curate madre vs NEXT e un audit di readiness per Firestore/Storage read-only lato server.
- Cosa legge davvero lato server questo ampliamento:
  - documenti architetturali/stato chiave;
  - macro-aree, route rappresentative e pattern UI;
  - file di codice e CSS collegati nel perimetro controllato;
  - segnali reali del repo su Firebase client, runtime legacy con `firebase-admin`, assenza di `firestore.rules` e stato di `storage.rules`.
- Cosa NON apre ancora:
  - nessuna lettura diretta Firestore business lato server;
  - nessuna lettura diretta Storage business lato server;
  - nessuna modifica della madre;
  - nessuna patch automatica del repository.
- Cosa chiarisce ora il clone:
  - dove la nuova IA puo gia leggere in modo utile codice, route-like file, componenti e CSS;
  - dove finisce il perimetro NEXT e dove inizia la madre legacy;
  - quali prerequisiti mancano prima di aprire davvero Firestore/Storage read-only lato server nel backend IA separato.
- Verifiche del task:
  - `node --check backend/internal-ai/server/internal-ai-repo-understanding.js` -> OK;
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK;
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiServerRepoUnderstandingClient.ts backend/internal-ai/src/internalAiServerRetrievalContracts.ts backend/internal-ai/server/internal-ai-adapter.js backend/internal-ai/server/internal-ai-repo-understanding.js` -> OK;
  - smoke test `buildRepoUnderstandingSnapshot()` -> OK;
  - smoke test `POST /internal-ai-backend/retrieval/read` con `read_repo_understanding_snapshot` su porta `4316` -> OK;
  - `npm run build` -> OK.

## 5.35 Aggiornamento 2026-03-22 - Chat conversazionale controllata + report in modale documento
- La overview `/next/ia/interna` e ora molto piu vicina a una chat reale e leggibile, senza perdere guard rail, traceability o fallback espliciti.
- Cosa cambia nel clone:
  - input libero multilinea e thread piu naturale;
  - indicatori leggeri su backend server-side, OpenAI lato server, repo understanding e retrieval business read-only parziale;
  - richieste di report che non riversano piu il contenuto lungo in chat;
  - report pronti salvati come artifact IA e aperti in una modale di anteprima documento.
- Flusso utente ora visibile:
  - l'utente chiede un report dalla chat;
  - l'orchestrazione gia esistente produce la preview controllata;
  - la preview viene salvata nel repository artifact IA dedicato;
  - la pagina apre il documento dedicato con lettura, copia, download testo e condivisione browser se disponibile;
  - il thread conserva solo il messaggio breve di conferma e il richiamo all'artifact.
- Cosa non cambia:
  - nessuna scrittura business;
  - nessuna modifica alla madre;
  - nessun backend legacy come canale canonico;
  - nessun segreto lato client;
  - fallback locale esplicito mantenuto.
- Verifiche del task:
  - `npx eslint src/next/NextInternalAiPage.tsx` -> OK;
  - `npm run build` -> OK.

## 5.36 Aggiornamento 2026-03-22 - Readiness Firebase read-only piu precisa nel clone IA
- Il clone `/next/ia/interna` non dichiara piu soltanto uno stato generico di readiness Firebase: mostra ora prerequisiti condivisi e whitelist candidate per un futuro bridge server-side read-only del backend IA separato.
- Cosa e stato aperto davvero:
  - la snapshot repo/UI del backend IA separato include ora:
    - requisiti condivisi verificati (`package` dedicato, `firebase-admin`, credenziali server-side, regole versionate);
    - whitelist candidate ma NON attive per Firestore e Storage;
    - blocchi reali che impediscono oggi l'apertura sicura del bridge business read-only;
  - la UI clone espone queste informazioni in italiano senza simulare un accesso gia attivo.
- Whitelist candidate dichiarate:
  - Firestore: solo documento `storage/@mezzi_aziendali`;
  - Storage: solo oggetto del bucket `gestionemanutenzione-934ef.firebasestorage.app` ricavato dal valore esatto di `librettoStoragePath` su un mezzo gia whitelisted;
  - restano fuori query libere, scansione collection, `listAll`, prefix scan, upload e delete.
- Cosa NON apre ancora:
  - nessuna lettura diretta Firestore business lato server;
  - nessuna lettura diretta Storage business lato server;
  - nessuna modifica della madre;
  - nessun uso del runtime legacy come backend canonico della nuova IA.
- Verifiche del task:
  - `node --check backend/internal-ai/server/internal-ai-firebase-readiness.js` -> OK;
  - `node --check backend/internal-ai/server/internal-ai-repo-understanding.js` -> OK;
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx backend/internal-ai/src/internalAiServerRetrievalContracts.ts` -> OK;
  - smoke test `buildFirebaseReadinessSnapshot()` -> OK;
  - smoke test `POST /internal-ai-backend/retrieval/read` con `read_repo_understanding_snapshot` -> OK;
  - `npm run build` -> OK.

## 5.37 Aggiornamento 2026-03-22 - Report IA in anteprima PDF reale + governance package backend IA
- Il clone `/next/ia/interna` separa ora in modo piu netto chat e documento: quando l'utente chiede un report strutturato, la chat conserva solo la conferma breve e la modale apre una vera anteprima PDF generata dal perimetro IA.
- Flusso report ora visibile nel clone:
  - richiesta report dalla chat controllata;
  - salvataggio dell'artifact IA dedicato;
  - apertura della modale con PDF reale generato al volo dall'artifact;
  - copia del contenuto strutturato, download PDF e condivisione browser se supportata.
- Cosa NON cambia:
  - nessuna scrittura business;
  - nessuna modifica della madre;
  - nessun uso del legacy come backend canonico;
  - nessuna persistenza server-side del binario PDF come artifact separato.
- Sul fronte backend IA separato e readiness:
  - esiste ora `backend/internal-ai/package.json` come package dedicato del perimetro server-side IA;
  - la readiness Firebase/Storage continua a dichiarare il bridge business read-only come NON attivo;
  - restano bloccanti reali `firebase-admin` non ancora governato dal package dedicato, credenziale server-side separata, `firestore.rules` assente e `storage.rules` in conflitto.
- Verifiche del task:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiReportPdf.ts backend/internal-ai/server/internal-ai-firebase-readiness.js` -> OK;
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `node --check backend/internal-ai/server/internal-ai-firebase-readiness.js` -> OK;
  - smoke test `buildFirebaseReadinessSnapshot()` -> OK;
  - `npm run build` -> OK.

## 5.38 Aggiornamento 2026-03-22 - Osservatore runtime NEXT passivo + guida integrazione UI/file
- Il clone `/next/ia/interna` non si limita piu a una snapshot repo/UI statica: puo ora leggere anche una prima osservazione runtime reale e controllata della NEXT, con screenshot e DOM snapshot passivo delle schermate principali.
- Cosa apre davvero nel runtime clone:
  - script `npm run internal-ai:observe-next` che usa Playwright solo in modalita passiva e solo su route `/next/*` whitelistate;
  - persistenza IA dedicata di `next_runtime_observer_snapshot.json` e screenshot locali in `backend/internal-ai/runtime-data/next-runtime-observer/`;
  - pannello `Comprensione controllata repo e UI` esteso con:
    - stato osservatore runtime;
    - schermate realmente coperte;
    - screenshot riapribili dal backend IA separato;
    - consigliatore di integrazione che indica modulo, superficie UI e file candidati.
- Copertura runtime verificata nel clone:
  - osservate con screenshot: `/next`, `/next/centro-controllo`, `/next/gestione-operativa`, `/next/mezzi`, `/next/dossiermezzi`, `/next/ia`, `/next/ia/interna`, `/next/acquisti`, `/next/autisti-inbox`, `/next/autisti-admin`, `/next/cisterna`;
  - restano parziali/non osservate in automatico le route dinamiche `Dossier mezzo` e `Analisi Economica`, perche il crawl non forza click o stati potenzialmente distruttivi.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessun bridge Firestore/Storage business live;
  - nessun riuso del runtime legacy come backend canonico.
- Verifiche del task:
  - `node --check backend/internal-ai/server/internal-ai-next-runtime-observer.js` -> OK;
  - `node --check scripts/internal-ai-observe-next-runtime.mjs` -> OK;
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiServerRepoUnderstandingClient.ts backend/internal-ai/src/internalAiServerRetrievalContracts.ts backend/internal-ai/server/internal-ai-next-runtime-observer.js backend/internal-ai/server/internal-ai-repo-understanding.js backend/internal-ai/server/internal-ai-adapter.js scripts/internal-ai-observe-next-runtime.mjs` -> OK;
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npm run internal-ai:observe-next` -> OK;
  - smoke test adapter `read_repo_understanding_snapshot` + asset screenshot -> OK;
  - `npm run build` -> OK.

## 5.40 Aggiornamento 2026-03-22 - Deep runtime observer NEXT + selettore formato output IA
- Il clone `/next/ia/interna` usa ora una comprensione runtime piu profonda della NEXT, sempre read-only e senza toccare la madre, insieme a una scelta piu intelligente del formato di output della risposta.
- Cosa apre davvero:
  - observer runtime NEXT esteso a:
    - 19 route reali osservate;
    - 23 screenshot runtime;
    - 4 stati whitelist-safe osservati su `Acquisti`;
    - route dinamiche mezzo-centriche risolte:
      - `/next/dossier/:targa`;
      - `/next/analisi-economica/:targa`;
      - `/next/dossier/:targa/gomme`;
      - `/next/dossier/:targa/rifornimenti`;
    - sottoroute `IA interna` osservate direttamente:
      - `/next/ia/interna/sessioni`;
      - `/next/ia/interna/richieste`;
      - `/next/ia/interna/artifacts`;
      - `/next/ia/interna/audit`;
  - selettore formato output per la chat IA:
    - `chat_brief`;
    - `chat_structured`;
    - `report_pdf`;
    - `ui_integration_proposal`;
    - `next_integration_confirmation_required`;
  - guida integrazione UI/flow/file piu motivata nella pagina IA, con superficie primaria, alternative, confidenza, evidenze runtime e anti-pattern.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessun click distruttivo, submit o upload runtime;
  - nessun bridge Firestore/Storage business live;
  - nessun backend legacy reso canonico.
- Verifiche del task:
  - `node --check backend/internal-ai/server/internal-ai-next-runtime-observer.js` -> OK;
  - `node --check scripts/internal-ai-observe-next-runtime.mjs` -> OK;
  - `node --check backend/internal-ai/server/internal-ai-repo-understanding.js` -> OK;
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK;
  - `npm run internal-ai:observe-next` -> OK;
  - rebuild snapshot repo/UI server-side -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/internal-ai/internalAiContracts.ts backend/internal-ai/src/internalAiServerRetrievalContracts.ts backend/internal-ai/server/internal-ai-next-runtime-observer.js backend/internal-ai/server/internal-ai-repo-understanding.js backend/internal-ai/server/internal-ai-adapter.js scripts/internal-ai-observe-next-runtime.mjs` -> OK;
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npm run build` -> OK.

## 5.39 Aggiornamento 2026-03-22 - Primo hook mezzo-centrico governato su Dossier Mezzo
- Il clone `/next/ia/interna` usa ora un primo hook mezzo-centrico governato che prende come nodo principale il `Dossier Mezzo` e traduce il linguaggio libero verso capability dichiarate, senza leggere la UI come fonte primaria e senza aprire retrieval Firebase live largo.
- Cosa apre davvero:
  - catalogo capability mezzo-centrico con:
    - stato sintetico Dossier mezzo;
    - preview documenti collegabili al mezzo;
    - riepilogo costi mezzo;
    - preview libretto mezzo;
    - preview preventivi collegabili al mezzo;
    - report mezzo PDF in anteprima;
  - planner `prompt -> capability -> filtri/metriche/groupBy/output`, riusato dalla chat controllata;
  - hook read-only che usa come fonti:
    - `D01` anagrafiche flotta;
    - composito `readNextDossierMezzoCompositeSnapshot`;
    - layer `D07-D08` documenti/costi;
    - facade clone-safe gia attivi per documenti, costi, libretto, preventivi e report mezzo.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessun bridge Firestore/Storage business live aggiuntivo;
  - nessun uso del runtime legacy come backend canonico.
- Verifiche del task:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts src/next/internal-ai/internalAiVehicleCapabilityPlanner.ts src/next/internal-ai/internalAiVehicleDossierHookFacade.ts` -> OK;
  - `npm run build` -> OK.

## 5.41 Aggiornamento 2026-03-23 - Retrieval Dossier mezzo server-side clone-seeded + rifornimenti governati
- Il clone `/next/ia/interna` estende ora il primo hook mezzo-centrico con un retrieval server-side stretto e read-only sul `Dossier Mezzo`, senza aprire ancora Firebase/Storage business live.
- Cosa apre davvero:
  - nuovo snapshot `Dossier Mezzo` clone-seeded nel backend IA separato, persistita su file locale dedicato;
  - nuove operazioni server-side:
    - `seed_vehicle_dossier_snapshot`;
    - `read_vehicle_dossier_by_targa`;
  - riuso di questo retrieval per:
    - stato sintetico mezzo;
    - riepilogo costi mezzo;
    - nuova capability `riepilogo rifornimenti mezzo`;
  - copy della chat aggiornato per dichiarare meglio fonti, perimetro e fallback.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessun bridge Firestore/Storage business live;
  - nessun retrieval live dedicato del verticale `Cisterna`;
  - nessun backend legacy reso canonico.
- Verifiche del task:
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK;
  - `node --check backend/internal-ai/server/internal-ai-persistence.js` -> OK;
  - smoke test adapter locale `seed_vehicle_dossier_snapshot` + `read_vehicle_dossier_by_targa` -> OK;
  - `npx eslint src/next/internal-ai/internalAiLibrettoPreviewBridge.ts src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts src/next/internal-ai/internalAiVehicleCapabilityPlanner.ts src/next/internal-ai/internalAiVehicleDossierHookFacade.ts src/next/internal-ai/internalAiServerRetrievalClient.ts backend/internal-ai/src/internalAiServerRetrievalContracts.ts` -> OK;
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npm run build` -> OK.

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
