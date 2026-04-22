# STORICO PATCH COMPRESSO
Data generazione: 2026-04-22
File letti: 766 (change-reports + continuity-reports)
Voci prodotte: 541
Moduli coperti: Acquisti, Manutenzioni, Euromecc, Magazzino, Lavori, IA interna, Home/Shell, Flotta/Mezzi, Dossier, Trasversali/Altro
Nota: i file originali sono preservati in docs/change-reports/ e docs/continuity-reports/. Saranno cancellati in un prompt successivo solo dopo verifica utente.

## Acquisti — 73 patch dal 2026-03 al 2026-04

### 2026-03-08 — NEXT Operativita Globale
- File principali: `docs/continuity-reports/2026-03-08_1111_continuity_next-operativita-globale.md`
- Cosa: shell dedicata della macro-area / UI strutturata dell'area globale
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-08 — Censimento domini dati
- File principali: `docs/continuity-reports/2026-03-08_1153_continuity_censimento-domini-dati.md`
- Cosa: niente a livello runtime / prodotto solo un report docs-only di base per la normalizzazione
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-08 — Censimento domini dati step 1
- File principali: `docs/data/CENSIMENTO_DOMINI_DATI_STEP1.md`; `docs/change-reports/2026-03-08_1153_docs_censimento-domini-dati-step1.md`; `docs/continuity-reports/2026-03-08_1153_continuity_censimento-domini-dati.md`
- Cosa: produrre un report intermedio di censimento dati del repository come base per la futura normalizzazione canonica / creato report intermedio di censimento / pre-normalizzazione dei domini dati reali del repo
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-08 — Creazione file canonico domini dati Step 2
- File principali: `docs/data/DOMINI_DATI_CANONICI.md`; `docs/INDICE_DOCUMENTAZIONE_PROGETTO.md`; `docs/change-reports/2026-03-08_1215_docs_domini-dati-canonici-step2.md`; `docs/continuity-reports/2026-03-08_1215_continuity_domini-dati-canonici.md`
- Cosa: creare il file principale dominio-centrico `docs/data/DOMINI_DATI_CANONICI.md` come nuova base documentale per la futura normalizzazione e importazione dei moduli nella NEXT / creato il nuovo documento dominio-centrico con indice canonico dei domini reali emersi dal repo e dallo Step 1
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-08 — Domini dati canonici
- File principali: `docs/continuity-reports/2026-03-08_1215_continuity_domini-dati-canonici.md`
- Cosa: niente lato runtime / documentazione riordinata per governare la migrazione futura
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-08 — Regola domini canonici in AGENTS
- File principali: `docs/continuity-reports/2026-03-08_1833_continuity_regola-domini-canonici-agents.md`
- Cosa: nessun cambiamento runtime / rafforzata solo la governance documentale della migrazione
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-08 — Regola domini canonici obbligatoria in AGENTS Step 3
- File principali: `AGENTS.md`; `docs/product/REGOLE_LAVORO_CODEX.md`; `docs/change-reports/2026-03-08_1833_docs_regola-domini-canonici-agents-step3.md`; `docs/continuity-reports/2026-03-08_1833_continuity_regola-domini-canonici-agents.md`
- Cosa: rendere obbligatoria per i task futuri la base dominio-centrica `docs/data/DOMINI_DATI_CANONICI.md`, aggiornando `AGENTS.md` e il minimo allineamento operativo collegato / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-10 — Apertura clone-safe Area Capo read-only
- File principali: `src/App.tsx`; `src/next/NextCapoMezziPage.tsx`; `src/next/NextCapoCostiMezzoPage.tsx`; `src/next/NextCentroControlloPage.tsx`; `src/next/domain/nextCapoDomain.ts`
- Cosa: Aprire nel clone `/next` la famiglia `Area Capo` con due route dedicate read-only, riusando i layer gia bonificati e bloccando approvazioni e PDF timbrati. / Creato un dominio manageriale dedicato che riusa flotta e costi/documenti gia normalizzati e legge `@preventivi_approvazioni` solo in sola lettura.
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-10 — Area Capo clone
- File principali: `docs/continuity-reports/2026-03-10_2251_continuity_area-capo-clone.md`
- Cosa: Route clone dedicate / Lista mezzi manageriale read-only
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Analisi Economica route clone
- File principali: `docs/continuity-reports/2026-03-11_1044_continuity_analisi-economica-route-clone.md`
- Cosa: Pagina clone read-only `NextAnalisiEconomicaPage / Lettura dati tramite domain clone del dossier
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-12 — NEXT clone UI parity
- File principali: `docs/continuity-reports/2026-03-12_2052_continuity_next-clone-ui-parity.md`
- Cosa: Shell e routing clone-safe / UI madre reale riusata su `/next
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-12 — Parita UI reale clone = madre su `/next
- File principali: `src/next/NextShell.tsx`; `src/next/autisti/NextAutistiCloneLayout.tsx`; `src/next/NextMotherPage.tsx`; `src/next/nextCloneNavigation.ts`; `src/next/NextHomePage.tsx`
- Cosa: Riallineare le principali pagine `/next` alla UI reale della madre, eliminando scaffold clone custom e lasciando nel clone solo il blocco delle azioni scriventi. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-13 — Audit e decisione strutturale perimetro procurement report mezzo IA interno
- File principali: `src/next/domain/nextDocumentiCostiDomain.ts`; `src/next/domain/nextDossierMezzoDomain.ts`; `src/next/internal-ai/internalAiVehicleReportFacade.ts`; `docs/product/CHECKLIST_IA_INTERNA.md`; `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- Cosa: Auditare il perimetro reale `procurement / preventivi / approvazioni` rispetto al report mezzo IA interno e fissare una decisione strutturale chiara, senza promuovere match deboli a collegamenti certi. / Aggiunto un supporto read-only nel dominio documenti-costi per leggere separatamente `storage/@preventivi` e `storage/@preventivi_approvazioni` e misurare il livello reale di collegamento col mezzo.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-13 — Procurement preventivi approvazioni report mezzo IA interno
- File principali: `docs/continuity-reports/2026-03-13_1948_continuity_procurement-perimetro-report-mezzo-ia.md`
- Cosa: Audit read-only di `storage/@preventivi` e `storage/@preventivi_approvazioni` dentro il dominio documenti-costi clone. / Nuovo stato `procurementPerimeter` nell'aggregatore dossier clone.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-22 — Preview preventivi IA interna
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiTypes.ts`; `src/next/internal-ai/internalAiContracts.ts`; `src/next/internal-ai/internalAiPreventiviPreviewFacade.ts`; `docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md`
- Cosa: Aprire il primo assorbimento sicuro della capability legacy `preventivi IA` nel sottosistema IA interna del clone, in modalita preview-first e senza riuso runtime del backend legacy. / Aggiunto il contratto stub `preventivi-preview` nel catalogo del sottosistema IA interno.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-22 — Ponti mock-safe libretto e preventivi IA
- File principali: `docs/continuity-reports/2026-03-22_1158_continuity_ponte-backend-libretto-preventivi-ia.md`
- Cosa: UI clone `/next/ia/interna*` con preview, artifact locale e chat controllata / Blocchi preview-first per analisi economica, documenti, libretto e preventivi
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-22 — Terzo e quarto ponte mock-safe frontend-backend libretto e preventivi IA
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiContracts.ts`; `src/next/internal-ai/internalAiLibrettoPreviewBridge.ts`; `src/next/internal-ai/internalAiPreventiviPreviewBridge.ts`; `backend/internal-ai/tsconfig.json`
- Cosa: Portare insieme le capability `libretto preview` e `preventivi preview` dal solo frontend/mock al nuovo backend IA separato, in modalita mock-safe e senza provider reali o backend legacy come canale canonico. / Aggiornata la pagina `/next/ia/interna` per mostrare il canale attivo di `libretto` e `preventivi` preview e riallineato il catalogo contratti IA interni.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-25 — D06 procurement reale read-only per NEXT e IA interna
- File principali: `src/next/domain/nextDocumentiCostiDomain.ts`; `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`; `src/next/internal-ai/internalAiChatOrchestrator.ts`; `src/next/NextInternalAiPage.tsx`; `src/next/NextCapoCostiMezzoPage.tsx`
- Cosa: chiudere `D06` come dominio procurement read-only vero per NEXT e IA interna, distinguendo in modo onesto tra superfici navigabili, preview, workflow non importati e CTA da bloccare. / aggiunto uno snapshot procurement read-only che unisce ordini, arrivi, preventivi, approvazioni e listino con conteggi business, provenienza e stato superficie;
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-26 — 2026-03-26 09:02
- File principali: `src/next/NextCapoCostiMezzoPage.tsx`; `src/pages/Acquisti.tsx`; `src/next/NextOperativitaGlobalePage.tsx`; `docs/product/CHECKLIST_IA_INTERNA.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: Chiudere i residui emersi dall'audit di rivalutazione del Prompt 14 senza riaprire D06: lint locale sui file shared, header checklist coerente e confine descrittivo D05/D06 piu esplicito nel contenitore operativo globale. / D06 non e stato riaperto: il dominio procurement read-only resta valido come chiuso dal Prompt 14.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-26 — 2026-03-26 11:12
- File principali: `docs/continuity-reports/2026-03-26_1112_continuity_sweep-cta-veritiere-next.md`
- Cosa: Il Prompt 19 e stato chiuso come sweep di veridicita UX del clone NEXT, senza riaprire domini o logiche business. / Il punto extra autorizzato era reale: `/next/centro-controllo` usa ancora `NextCentroControlloClonePage` come wrapper sulla pagina legacy `CentroControllo`, quindi il residuo piu importante andava chiuso li.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-29 — Audit completo parita clone/NEXT vs madre
- File principali: `docs/audit/AUDIT_COMPLETO_PARITA_CLONE_NEXT_VS_MADRE.md`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/change-reports/2026-03-29_1024_docs_audit-completo-parita-clone-next-vs-madre.md`
- Cosa: Produrre un audit completo e verificato nel repo sullo stato reale di parita tra clone/NEXT e madre, senza toccare codice applicativo. / Creato il report audit completo con mappa madre vs NEXT, classificazione modulo per modulo, stato layer, gap reali, priorita e matrice finale obbligatoria.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-29 — 2026-03-29 1108 - Prompt 33 chiusura gap parita NEXT
- File principali: `src/utils/storageSync.ts`; `src/next/nextLegacyStorageOverlay.ts`; `src/next/NextLegacyStorageBoundary.tsx`; `src/next/domain/nextLavoriDomain.ts`; `src/next/domain/nextManutenzioniDomain.ts`
- Cosa: Portare avanti la chiusura reale dei gap clone/NEXT vs madre, convertendo dove possibile le route ufficiali a `UI madre fuori + layer NEXT pulito sotto`, senza toccare la madre. / Aggiunto serializer D02 per `@manutenzioni`.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-29 — 2026-03-29 1149 - Prompt 34 chiusura residui clone NEXT
- File principali: `docs/continuity-reports/2026-03-29_1149_continuity_prompt34_chiusura-residui-clone-next.md`
- Cosa: Stato raggiunto
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-29 — 2026-03-29 1246 - Prompt 35 hardening finale residuo NEXT
- File principali: `docs/continuity-reports/2026-03-29_1246_continuity_prompt35_hardening-finale-residuo-next.md`
- Cosa: Stato raggiunto / Libretti Export` e ora chiuso come superficie madre-like sopra layer NEXT pulito.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-29 — 2026-03-29 1515 - Prompt 36 ricostruzione Centro di Controllo NEXT
- File principali: `docs/continuity-reports/2026-03-29_1515_continuity_prompt36_ricostruzione-centro-controllo-next.md`
- Cosa: Stato raggiunto / Centro di Controllo` e ora chiuso nel clone come pagina NEXT autonoma.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-29 — Prompt 38 - Svuotamento backlog residuo NEXT
- File principali: `src/next/NextDossierMezzoPage.tsx`; `src/next/NextAnalisiEconomicaPage.tsx`; `src/next/nextDossierCloneState.ts`; `src/next/NextMaterialiDaOrdinarePage.tsx`; `src/next/nextProcurementCloneState.ts`
- Cosa: Sostituire i wrapper finali della madre sui residui chiudibili nel solo perimetro `src/next/*`, mantenendo la madre intoccabile. / Aggiunto overlay `nextProcurementCloneState` e merge in `nextProcurementDomain` per far leggere al clone gli ordini confermati localmente senza scrivere sulla madre.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-29 — Prompt 39 - Chiusura ultimi 8 moduli NEXT
- File principali: `src/next/domain/nextProcurementDomain.ts`; `src/next/NextProcurementReadOnlyPanel.tsx`; `src/next/NextProcurementStandalonePage.tsx`; `src/next/NextAcquistiPage.tsx`; `src/next/domain/nextCisternaDomain.ts`
- Cosa: Svuotare il backlog residuo del clone/NEXT chiudendo gli ultimi 8 moduli ancora aperti senza montare il runtime madre come soluzione finale. / Acquisti / Preventivi / Listino` chiuso su surface NEXT nativa, con estensione del domain procurement ai dataset `@preventivi`, `@preventivi_approvazioni` e `@listino_prezzi`.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-30 — Audit verifica finale NEXT autonoma
- File principali: `docs/continuity-reports/2026-03-30_0039_continuity_audit-verifica-finale-next-autonoma.md`
- Cosa: src/App.tsx` e routing NEXT ufficiale / route ufficiali `src/next/*` del perimetro target
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-30 — Prompt 42 - Procedura madre->clone e chiusura gap audit finale
- File principali: `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md`; `docs/audit/BACKLOG_GAP_AUDIT_FINALE_EXECUTION.md`; `src/next/autisti/nextAutistiStorageSync.ts`; `src/next/autisti/nextAutistiHomeEvents.ts`; `src/next/autisti/NextModalGomme.tsx`
- Cosa: Creare il file procedurale ufficiale `madre -> clone/NEXT` e usarlo subito per chiudere nel perimetro whitelistato i gap reali confermati dall'audit finale, senza toccare la madre e senza auto-certificare la NEXT come autonoma. / Creato `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md` come contratto operativo stabile: madre intoccabile, NEXT unico perimetro sicuro, no mount finale della madre, layer NEXT puliti, clone read-only, chiusura modulo meccanica, separazione `execution != audit`.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-30 — Prompt 43 - Audit finale avversariale post prompt 42
- File principali: `docs/continuity-reports/2026-03-30_1600_continuity_prompt43_audit-finale-post-prompt-42-next-autonoma.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-30 — Audit generale totale NEXT vs madre
- File principali: `docs/continuity-reports/2026-03-30_1756_continuity_prompt50_audit-generale-totale-next-vs-madre.md`
- Cosa: route NEXT ufficiali quasi tutte native / assenza di mount finali della madre sulle route ufficiali del perimetro target
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — `Materiali consegnati` loop fix
- File principali: `docs/change-reports/2026-03-31_0900_materiali_consegnati_loop_fix.md`; `docs/continuity-reports/2026-03-31_0900_continuity_materiali_consegnati_loop_fix.md`
- Cosa: Esteso `src/next/domain/nextMaterialiMovimentiDomain.ts` con `includeCloneOverlays: false` per la lettura ufficiale senza overlay.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — `Materiali da ordinare` loop fix
- File principali: `docs/change-reports/2026-03-31_0909_materiali-da-ordinare_loop_fix.md`; `docs/continuity-reports/2026-03-31_0909_continuity_materiali-da-ordinare_loop_fix.md`
- Cosa: Esteso `src/next/domain/nextFornitoriDomain.ts` con `includeCloneOverlays: false` per la lettura ufficiale senza overlay.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — `Acquisti / Ordini / Preventivi / Listino` loop fix
- File principali: `docs/change-reports/2026-03-31_0930_procurement_loop_fix.md`; `docs/continuity-reports/2026-03-31_0930_continuity_procurement_loop_fix.md`
- Cosa: Riallineato `src/next/domain/nextProcurementDomain.ts` con opt-out ufficiale degli overlay clone-only e con motivazioni/limitazioni coerenti al ramo read-only madre-like.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — Change Report
- File principali: `docs/audit/AUDIT_FINALE_GLOBALE_NEXT_POST_LOOP_V3.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/MATRICE_ESECUTIVA_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — Continuity Report
- File principali: `docs/continuity-reports/2026-03-31_1754_continuity_audit-finale-globale-next-post-loop-v3.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — Change Report
- File principali: `src/next/domain/nextOperativitaGlobaleDomain.ts`; `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`; `docs/audit/BACKLOG_gestione-operativa-route.md`; `docs/audit/AUDIT_gestione-operativa-route_LOOP.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — 2026-04-01 23:10
- File principali: `src/next/NextGestioneOperativaPage.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Correggere il bug per cui la CTA `Acquisti e ordini` di `Gestione Operativa` apriva una pagina bianca.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — 2026-04-01 23:40
- File principali: `src/next/NextGestioneOperativaPage.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Chiudere il problema reale della famiglia procurement nella card `Acquisti e ordini` di `Gestione Operativa`, mantenendo solo ingressi NEXT stabili e non bianchi.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — 2026-04-01 23:55
- File principali: `docs/audit/AUDIT_PROCUREMENT_PADRE_VS_SOTTOMODULI.md`; `docs/audit/MATRICE_PROCUREMENT_INGRESSI_E_FLUSSI.md`; `docs/audit/BACKLOG_DECISIONE_PROCUREMENT_NEXT.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — Change Report
- File principali: `src/next/NextMaterialiDaOrdinarePage.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/change-reports/2026-04-01_2356_materiali-da-ordinare-next-layout-madre-like.md`; `docs/continuity-reports/2026-04-01_2356_continuity_materiali-da-ordinare-next-layout-madre-like.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — Continuity Report
- File principali: `docs/continuity-reports/2026-04-01_2356_continuity_materiali-da-ordinare-next-layout-madre-like.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — Change Report
- File principali: `docs/audit/AUDIT_PROCUREMENT_MODULI_RIMOVIBILI_NEXT.md`; `docs/audit/MATRICE_PROCUREMENT_RIMOZIONE_NEXT.md`; `docs/audit/BACKLOG_PROCUREMENT_DA_RIMUOVERE_O_DECLASSARE.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — Continuity Report
- File principali: `docs/continuity-reports/2026-04-01_2358_continuity_audit_procurement_moduli_rimovibili_next.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — 2026-04-01 23:59
- File principali: `src/next/NextGestioneOperativaPage.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/change-reports/2026-04-01_2359_gestione-operativa-next-madre-like-4-famiglie.md`; `docs/continuity-reports/2026-04-01_2359_continuity_gestione-operativa-next-madre-like-4-famiglie.md`
- Cosa: la pagina NEXT abbandona i pannelli inline troppo custom e riprende la grammatica visiva della madre: / header compatto con badge;
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — Change Report
- File principali: `docs/change-reports/2026-04-01_2362_materiali-da-ordinare-next-modal-madre-like.md`
- Cosa: Il markup del modale era gia allineato alla madre, ma nella NEXT il popup ereditava la variante embedded della pagina procurement e quindi non manteneva piu la stessa percezione visiva della madre su bordo, testo e card shell.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — Continuity Report
- File principali: `docs/continuity-reports/2026-04-01_2362_continuity_materiali-da-ordinare-next-modal-madre-like.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-02 — 2026-04-02 07:00
- File principali: `src/next/NextMaterialiDaOrdinarePage.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/change-reports/2026-04-02_0700_procurement-convergenza-madre-like-materiali-da-ordinare.md`; `docs/continuity-reports/2026-04-02_0700_continuity_procurement-convergenza-madre-like-materiali-da-ordinare.md`
- Cosa: Portare `/next/materiali-da-ordinare` sul ramo standalone reale della madre, mantenendo `Materiali da ordinare` come unico ingresso procurement top-level visibile e lasciando intatti i runtime procurement secondari ancora vivi.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-02 — 2026-04-02 08:35
- File principali: `src/next/NextMaterialiDaOrdinarePage.tsx`; `src/next/NextProcurementConvergedSection.tsx`; `src/next/NextProcurementReadOnlyPanel.tsx`; `src/next/NextProcurementStandalonePage.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: NextProcurementConvergedSection` concentra le viste secondarie procurement senza creare nuove route top-level. / Stato raggiunto
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-02 — 2026-04-02 09:15
- File principali: `src/next/internal-ai/internalAiUniversalRequestsRepository.ts`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Stato raggiunto
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-02 — Change Report
- File principali: `src/next/NextMaterialiDaOrdinarePage.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Riallineare il layout desktop del procurement convergente NEXT alla madre reale, eliminando shell stretta, pannello destro spezzato e barra scura overlay.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-02 — Continuity Report
- File principali: `docs/continuity-reports/2026-04-02_0940_continuity_materiali-da-ordinare-next-fix-layout-desktop-madre.md`
- Cosa: Layout desktop riallineato al ramo embedded/single-card della madre.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-02 — Change Report
- File principali: `docs/change-reports/2026-04-02_1010_materiali-da-ordinare-next-layout-desktop-standalone-madre.md`
- Cosa: Riportare il modulo canonico procurement sul layout desktop standalone reale della madre.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-02 — Continuity Report
- File principali: `docs/continuity-reports/2026-04-02_1010_continuity_materiali-da-ordinare-next-layout-desktop-standalone-madre.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-02 — Change Report
- File principali: `docs/change-reports/2026-04-02_1110_materiali-da-ordinare-runtime-browser-fix-definitivo.md`
- Cosa: Correggere il layout sul runtime reale del browser, non sui report. / Ramo `Fabbisogni` riallineato alla resa reale della madre vista in `/acquisti
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-02 — Continuity Report
- File principali: `docs/continuity-reports/2026-04-02_1110_continuity_materiali-da-ordinare-runtime-browser-fix-definitivo.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-02 — 2026-04-02 12:15
- File principali: `src/next/NextMaterialiDaOrdinarePage.tsx`; `src/next/NextProcurementConvergedSection.tsx`; `src/next/NextProcurementReadOnlyPanel.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Ridurre i delta comportamentali reali del procurement convergente NEXT su `/next/materiali-da-ordinare` senza riaprire moduli top-level secondari e senza introdurre scritture business.
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-02 — 2026-04-02 13:35
- File principali: `docs/change-reports/2026-04-02_1335_procurement-next-parity-estesa-materiali-da-ordinare.md`; `docs/continuity-reports/2026-04-02_1335_continuity_procurement-next-parity-estesa-materiali-da-ordinare.md`
- Cosa: Prompt 29 / Perimetro runtime: `src/next/NextMaterialiDaOrdinarePage.tsx`, `src/next/NextProcurementConvergedSection.tsx
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-04-02 — 2026-04-02 15:05
- File principali: `docs/change-reports/2026-04-02_1505_procurement-next-tab-secondarie-documenti-drilldown.md`; `docs/continuity-reports/2026-04-02_1505_continuity_procurement-next-tab-secondarie-documenti-drilldown.md`
- Cosa: Prompt 30 / Perimetro runtime: `src/next/NextProcurementConvergedSection.tsx`, `src/next/NextProcurementReadOnlyPanel.tsx
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-02 — 2026-04-02 21:55
- File principali: `src/next/NextProcurementReadOnlyPanel.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Portare dentro `/next/materiali-da-ordinare` il blocco operativo vivo madre di `Dettaglio ordine`, mantenendo `Materiali da ordinare` come unico procurement top-level NEXT e preservando il layer dati NEXT pulito. / Il delta principale aperto era il ramo `Dettaglio ordine`, ancora fermo su UI bloccata e poco aderente al comportamento operativo madre.
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-02 — 2026-04-02 22:06
- File principali: `src/next/NextMaterialiDaOrdinarePage.tsx`; `src/next/NextProcurementConvergedSection.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Chiudere altro delta top-level del procurement convergente su `/next/materiali-da-ordinare`, riallineando tab, sottoviste, riepiloghi, footer e passaggi utente alla madre senza toccare il domain NEXT pulito. / footer `Ordine materiali` esteso anche a `Listino Prezzi`.
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-02 — 2026-04-02 22:47
- File principali: `src/next/NextMaterialiDaOrdinarePage.tsx`; `src/next/NextProcurementConvergedSection.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Riallineare `/next/materiali-da-ordinare` sulla UI esterna della madre `src/pages/Acquisti.tsx`, rendendo la shell principale, la gerarchia visiva e i rami `Prezzi & Preventivi` / `Listino Prezzi` il piu possibile coerenti con `Gestione Acquisti` senza sporcare il layer dati NEXT. / PATCH PARZIALE`: il modulo procurement top-level resta `PARZIALE`, non `CHIUSO`.
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-02 — 2026-04-02 23:09
- File principali: `src/next/NextMaterialiDaOrdinarePage.tsx`; `src/next/NextProcurementReadOnlyPanel.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Ricostruire `Ordini`, `Arrivi` e `Dettaglio ordine` direttamente nella shell visiva di `src/pages/Acquisti.tsx` su `/next/materiali-da-ordinare`, senza lasciare `NextProcurementConvergedSection` come superficie principale di queste viste e senza sporcare il layer dati NEXT. / il bottone riga e stato riallineato da `Apri dettaglio` a `Apri`;
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-02 — 2026-04-02 23:39
- File principali: `src/next/NextProcurementReadOnlyPanel.tsx`; `src/next/NextProcurementConvergedSection.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Chiudere solo il delta UI residuo di `/next/materiali-da-ordinare` sui punti ancora visibilmente diversi dalla madre `src/pages/Acquisti.tsx`: azioni secondarie di `Ordini` / `Arrivi`, resa visiva finale di `Dettaglio ordine`, parity esterna di `Prezzi & Preventivi` e parity esterna di `Listino Prezzi`. / il pill stato di lista viene riallineato al tab madre invece che allo stato calcolato del singolo ordine;
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-03 — 2026-04-03 13:26
- File principali: `src/next/NextMaterialiDaOrdinarePage.tsx`; `src/next/next-procurement-route.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Chiudere solo il delta visivo reale della tab `Ordine materiali` tra `/acquisti` e `/next/materiali-da-ordinare`, usando il runtime browser del 3 aprile 2026 come fonte di prova e senza toccare dati, writer, route o altre tab. / KPI `Totale parziale` riallineato al caso runtime reale.
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-03 — 2026-04-03 14:12
- File principali: `src/next/domain/nextProcurementDomain.ts`; `src/next/NextProcurementConvergedSection.tsx`
- Cosa: Riallineare nel clone NEXT il calcolo dello stato import dei preventivi alla logica reale della madre `Acquisti`, senza toccare writer, route o runtime madre. / Il clone NEXT usa ora un calcolo riga-per-riga allineato alla madre e i due casi reali verificati coincidono con il runtime madre:
- Impatto: tocca UI/runtime
- Esito: INCOMPLETO

### 2026-04-03 — 2026-04-03 21:42
- File principali: `src/next/components/NextScadenzeModal.tsx`; `src/next/NextShell.tsx`; `src/next/nextData.ts`; `src/next/NextHomePage.tsx`; `src/next/next-shell.css`
- Cosa: Implementare nel subtree `/next` un solo modale read-only `Scadenze` per revisioni / collaudi / pre-collaudi, aperto sia dalla sidebar sia dal banner alert della nuova Home tramite query param, senza nuove route e senza writer reali. / Creato `NextScadenzeModal` come modale unico, read-only, alimentato da `readNextCentroControlloSnapshot()`.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-22 — Change Report
- File principali: `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx`; `src/next/internal-ai/ArchivistaArchiveClient.ts`; `src/next/NextIAArchivistaPage.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Attivare in Archivista il ramo `Preventivo -> Manutenzione` con UI coerente al bridge manutenzione ma con pipeline dati sempre e solo su `storage/@preventivi`. / creato `ArchivistaPreventivoManutenzioneBridge.tsx` con UI step-based coerente al bridge `Fattura / DDT + Manutenzione`;
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-22 — Continuity Report
- File principali: `docs/continuity-reports/20260422_113349_continuity_archivista_preventivo_manutenzione_bridge.md`
- Cosa: Archivista documenti -> Preventivo -> Manutenzione
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-22 — Change Report
- File principali: `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx`; `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx`; `src/next/internal-ai/ArchivistaArchiveClient.ts`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Distinguere in modo esplicito i record Archivista `Preventivo -> Magazzino` e `Preventivo -> Manutenzione` dentro `storage/@preventivi`, senza cambiare destinazione, UI o logica di cattura campi.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-22 — Continuity Report
- File principali: `docs/continuity-reports/20260422_121706_continuity_archivista_preventivo_ambito_distinction.md`
- Cosa: Archivista documenti -> Preventivo -> Magazzino / Preventivo -> Manutenzione
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-22 — 2026-04-22 14:30 - fix storage rules preventivi
- File principali: `docs/change-reports/2026-04-22_1430_fix_storage-rules_preventivi.md`; `docs/continuity-reports/2026-04-22_1430_continuity_fix_storage-rules_preventivi.md`
- Cosa: nessun commit aveva mai aggiunto `preventivi/ / Aggiunto il seguente match block a `storage.rules` dopo il blocco `mezzi/`, prima del catch-all:
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-22 — Preventivo manuale NEXT
- File principali: `src/utils/cloneWriteBarrier.ts`; `src/next/NextProcurementConvergedSection.tsx`; `src/next/NextMaterialiDaOrdinarePage.tsx`; `src/next/NextPreventivoManualeModal.tsx`; `src/next/nextPreventivoManualeWriter.ts`
- Cosa: Implementare nel tab NEXT `Prezzi & Preventivi` il flusso `Preventivo manuale` con salvataggio reale su `storage/@preventivi`, aggiornamento reale di `storage/@listino_prezzi`, foto opzionali su Storage e refresh del tab dopo il salvataggio. / aggiunto il pulsante `PREVENTIVO MANUALE` nel tab `/next/materiali-da-ordinare?tab=preventivi`;
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

## Manutenzioni — 63 patch dal 2026-03 al 2026-04

### 2026-03-08 — NEXT D04 rifornimenti
- File principali: `docs/continuity-reports/2026-03-08_2114_continuity_next-d04-layer-rifornimenti.md`
- Cosa: elenco mezzi `read-only / Dossier Mezzo `read-only
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-30 — Prompt 49
- File principali: `src/next/nextDateFormat.ts`; `src/next/domain/nextManutenzioniDomain.ts`; `src/next/domain/nextOperativitaGlobaleDomain.ts`; `src/next/NextManutenzioniPage.tsx`; `src/next/NextAnalisiEconomicaPage.tsx`
- Cosa: Chiudere due problemi reali emersi fuori dai report precedenti: / Manutenzioni` NEXT non allineato alla madre su storico/ordinamento date/record visibili;
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — 2026-03-31 14:47 - Stop su Manutenzioni
- File principali: `docs/change-reports/2026-03-31_1447_manutenzioni_loop_stop.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — Manutenzioni Loop Fix
- File principali: `docs/change-reports/2026-03-31_1510_manutenzioni_loop_fix.md`; `docs/continuity-reports/2026-03-31_1510_continuity_manutenzioni_loop_fix.md`
- Cosa: aggiunto `readNextManutenzioniWorkspaceSnapshot()` per leggere storico reale `@manutenzioni` e mezzi reali `@mezzi_aziendali`;
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-07 — 2026-04-07 10:54
- File principali: `docs/change-reports/2026-04-07_1054_audit_manutenzioni_spec_sostitutivo_next.md`; `docs/continuity-reports/2026-04-07_1054_continuity_audit_manutenzioni_spec_sostitutivo_next.md`
- Cosa: Creato audit tecnico dedicato con decisione finale: `SPEC PRONTA DA CORREGGERE E POI IMPLEMENTARE`. / 6. Se si vuole una `Manutenzioni` NEXT davvero scrivente, va deciso anche il boundary `src/utils/cloneWriteBarrier.ts`, oggi aperto solo per `@lavori`.
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-07 — 2026-04-07 12:32
- File principali: `docs/change-reports/2026-04-07_1232_patch_next-manutenzioni-sostitutivo-mappa-storico.md`; `docs/continuity-reports/2026-04-07_1232_continuity_next-manutenzioni-sostitutivo-mappa-storico.md`
- Cosa: esteso `src/next/domain/nextManutenzioniDomain.ts` con writer business compatibili su:
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-07 — 2026-04-07 13:13
- File principali: `docs/change-reports/2026-04-07_1313_ui_next-manutenzioni-mappa-storico-layout-alignment.md`; `docs/continuity-reports/2026-04-07_1313_continuity_ui_next-manutenzioni-mappa-storico-layout-alignment.md`
- Cosa: compattato l'header del modulo quando la vista attiva e `Mappa storico`, lasciando tabs e selettore mezzo presenti ma secondari; / ricostruita `NextMappaStoricoPage.tsx` come shell tecnica:
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-07 — 2026-04-07 18:24
- File principali: `docs/change-reports/2026-04-07_1824_fix_next-mappa-storico-zone-inference.md`; `docs/continuity-reports/2026-04-07_1824_continuity_fix_next-mappa-storico-zone-inference.md`
- Cosa: introdotto in `nextMappaStoricoDomain.ts` un ramo prioritario per componenti gomme/ruote/assi: / prima riconosce il componente;
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-07 — 2026-04-07 19:49
- File principali: `docs/change-reports/2026-04-07_1949_ui_next-manutenzioni-rest-tabs-alignment.md`; `docs/continuity-reports/2026-04-07_1949_continuity_ui_next-manutenzioni-rest-tabs-alignment.md`
- Cosa: NextManutenzioniPage.tsx` usa ora una shell tecnica comune ai tab non-mappa: / Dashboard tecnico manutenzioni` con KPI mezzo/compressore, blocchi area e azioni rapide;
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-07 — 2026-04-07 20:05
- File principali: `src/next/NextManutenzioniPage.tsx`; `src/next/next-mappa-storico.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `CONTEXT_CLAUDE.md`
- Cosa: Riallineare solo la UI del tab `Quadro manutenzioni PDF` di `/next/manutenzioni` da struttura a card/quadro a struttura elenco filtrabile ed esportabile. / Stato raggiunto
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-07 — 2026-04-07 20:24
- File principali: `src/next/NextManutenzioniPage.tsx`; `src/next/next-mappa-storico.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `CONTEXT_CLAUDE.md`
- Cosa: Ristrutturare solo la UI di `/next/manutenzioni` trattando i tab come superfici distinte della stessa famiglia, senza toccare business, writer, domain, barrier o route. / Stato raggiunto
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-07 — 2026-04-07 22:28
- File principali: `src/next/NextManutenzioniPage.tsx`; `src/next/NextMappaStoricoPage.tsx`; `src/next/next-mappa-storico.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Riallineare la UI del modulo `/next/manutenzioni` al mockup master finale, trattando i tab come superfici distinte della stessa famiglia senza toccare business, writer o domain. / Dettaglio` riallineato come vista a due card root:
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-08 — 2026-04-08 07:45
- File principali: `src/next/NextManutenzioniPage.tsx`; `src/next/NextMappaStoricoPage.tsx`; `src/next/next-mappa-storico.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Eliminare definitivamente la struttura shared con colonna laterale persistente e contesto duplicato nel modulo `/next/manutenzioni`, mantenendo solo UI/layout/gerarchia visiva e minima navigazione interna dei tab.
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-08 — 2026-04-08 08:08
- File principali: `src/next/NextManutenzioniPage.tsx`; `src/next/next-mappa-storico.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `CONTEXT_CLAUDE.md`
- Cosa: rimossa la resa a macro-pannello del contesto mezzo nella `Dashboard`; / lasciati solo risultati rapidi, navigazione veloce e contesto attivo compatto;
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-08 — Change Report
- File principali: `docs/change-reports/20260408_094351_ui_next-manutenzioni-spec-layout.md`
- Cosa: Task: redesign UI `Manutenzioni NEXT` allineato a `docs/product/SPEC_MANUTENZIONI_UI_NEXT.md / Creato `src/next/next-manutenzioni.css` con classi `man2-*` dalla sezione 10 della spec.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-08 — Continuity Report
- File principali: `src/next/next-manutenzioni.css`; `src/next/NextManutenzioniPage.tsx`; `src/next/NextMappaStoricoPage.tsx`; `docs/STATO_ATTUALE_PROGETTO.md`; `CONTEXT_CLAUDE.md`
- Cosa: Punto raggiunto
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-08 — Change Report
- File principali: `docs/change-reports/20260408_100131_ui_next-manutenzioni-spec-diff-fix.md`
- Cosa: Allineato il testo `man2-eyebrow` a `Operatività`.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-08 — Continuity Report
- File principali: `docs/continuity-reports/20260408_100131_continuity_ui_next-manutenzioni-spec-diff-fix.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-08 — 2026-04-08 10:19:00
- File principali: `src/next/NextManutenzioniPage.tsx`; `src/next/NextMappaStoricoPage.tsx`; `src/next/next-mappa-storico.css`; `docs/STATO_ATTUALE_PROGETTO.md`; `CONTEXT_CLAUDE.md`
- Cosa: riallineato il tab `Nuova / Modifica` con pannello form grande, blocco tagliando condizionale, materiali e foto mantenendo la logica esistente; / Riallineare la UI di `/next/manutenzioni` al mockup React allegato dall'utente, senza toccare business, reader/writer, hotspot logic o `pdfEngine`.
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-08 — Change Report
- File principali: `src/next/NextManutenzioniPage.tsx`; `src/next/NextMappaStoricoPage.tsx`; `src/next/next-mappa-storico.css`; `docs/STATO_ATTUALE_PROGETTO.md`; `CONTEXT_CLAUDE.md`
- Cosa: La sezione `4 foto collegate al dettaglio` di `Nuova / Modifica` non e piu un puro mockup: espone ora 4 card reali per `Fronte`, `Sinistra`, `Destra`, `Retro`. / Ogni card mostra preview reale della vista se la foto esiste, oppure placeholder coerente col layout scuro del mockup.
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-08 — Continuity Report
- File principali: `docs/continuity-reports/20260408_111032_continuity_ui_next-manutenzioni-mockup-photo-align.md`
- Cosa: Mantenere il riallineamento di `/next/manutenzioni` al mockup React e aggiungere nel perimetro consentito una gestione reale delle 4 foto camion.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-08 — Change Report
- File principali: `src/next/NextManutenzioniPage.tsx`; `src/next/next-mappa-storico.css`; `docs/STATO_ATTUALE_PROGETTO.md`; `CONTEXT_CLAUDE.md`
- Cosa: La fascia dati superiore resta sempre a 5 blocchi (`Targa`, `Modello`, `Autista solito`, `KM attuali`, `Ultima manutenzione`) anche in fallback. / La dashboard e stata asciugata per aderire all'immagine finale: niente card laterale interna, niente heading extra sopra KPI e pulsanti, solo titolo, frase breve, 4 KPI, 4 CTA e lista `Ultimi interventi`.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-08 — Continuity Report
- File principali: `docs/continuity-reports/20260408_113742_continuity_ui_next-manutenzioni-image-final-align.md`
- Cosa: Chiudere gli ultimi scarti visivi tra `/next/manutenzioni` e l'immagine finale allegata in chat, ignorando canvas React e spec UI precedenti.
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-08 — 2026-04-08 12:34:24
- File principali: `src/next/NextManutenzioniPage.tsx`; `src/next/next-mappa-storico.css`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Riallineare la UI della pagina NEXT `/next/manutenzioni` al mock approvato partendo dal runtime reale gia presente nel repo, senza rifare il modulo da zero.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-08 — 2026-04-08 12:52:40
- File principali: `src/next/next-mappa-storico.css`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `CONTEXT_CLAUDE.md`
- Cosa: Correggere il tema base della pagina NEXT `/next/manutenzioni` portando a base chiara le superfici operative interne, lasciando invece shell esterna, tab e accenti sul tono scuro. / Il runtime reale di `/next/manutenzioni` era gia stato riallineato nel layout e nella tipografia, ma molte superfici operative principali risultavano ancora troppo scure rispetto al riferimento approvato.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-08 — 2026-04-08 13:30:15
- File principali: `src/next/NextManutenzioniPage.tsx`; `src/next/next-mappa-storico.css`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Correggere 4 problemi reali della pagina NEXT `/next/manutenzioni`: base nera troppo dominante, griglia errata di `Data / KM-Ore / Fornitore`, confusione visiva tra card materiali e area foto, autosuggest materiali con fornitore troppo prominente. / Il runtime reale di `/next/manutenzioni` era gia stato riallineato nel layout generale, ma nel browser restavano 4 problemi concreti: troppo nero dominante, griglia errata nella riga metrica del form, percezione confusa tra card materiali e foto mezzo, autosuggest inventario con gerarchia materiale/fornitore poco chiara.
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-08 — 2026-04-08 13:42:10
- File principali: `src/next/NextManutenzioniPage.tsx`; `src/next/next-mappa-storico.css`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Rimuovere completamente la gestione foto dalla tab `Nuova / Modifica` di `/next/manutenzioni`, lasciandola solo nel tab `Dettaglio`.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-08 — 2026-04-08 13:50:55
- File principali: `src/next/next-mappa-storico.css`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `CONTEXT_CLAUDE.md`
- Cosa: Correggere in modo definitivo la griglia della riga `Data / KM-Ore / Fornitore` nella tab `Nuova / Modifica` di `/next/manutenzioni`.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-08 — 2026-04-08 14:11
- File principali: `src/next/next-mappa-storico.css`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `CONTEXT_CLAUDE.md`
- Cosa: Correggere solo la resa della riga `Data / KM-Ore / Fornitore` nella tab NEXT `Nuova / Modifica` del modulo `Manutenzioni`, aumentando anche lo stacco visivo della card `Mezzo attivo`.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-08 — 2026-04-08 14:22
- File principali: `src/next/NextManutenzioniPage.tsx`; `src/next/next-mappa-storico.css`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Rendere definitiva la riga `Data / KM-Ore / Fornitore` nella tab NEXT `Nuova / Modifica` del modulo `Manutenzioni`, trasformandola in tre mini-card separate vere.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-08 — 2026-04-08 14:31
- File principali: `src/next/NextManutenzioniPage.tsx`; `src/next/next-mappa-storico.css`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Ricompattare la riga `Data / KM-Ore / Fornitore` nella tab NEXT `Nuova / Modifica` del modulo `Manutenzioni`, eliminando i tre contenitori alti introdotti in precedenza.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-08 — 2026-04-08 14:42
- File principali: `src/next/NextManutenzioniPage.tsx`; `src/next/next-mappa-storico.css`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Sostituire in modo definitivo il blocco `Data / KM-Ore / Fornitore` nella tab NEXT `Nuova / Modifica` del modulo `Manutenzioni` con una struttura compatta a tre field-group separati.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-08 — 2026-04-08 14:53
- File principali: `src/next/NextManutenzioniPage.tsx`; `src/next/next-mappa-storico.css`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Riallineare solo la resa visiva dei campi `Data / KM-Ore / Fornitore` nella tab NEXT `Nuova / Modifica` del modulo `Manutenzioni`, riusando la stessa base di `Tipo` e `Sottotipo`. / allineato anche il placeholder nel perimetro metriche.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-08 — 2026-04-08 15:10
- File principali: `src/next/NextManutenzioniPage.tsx`; `src/next/next-mappa-storico.css`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Applicare un micro-fix UI locale su `Manutenzioni` NEXT per pulire la testata e riequilibrare la riga `Data / KM-Ore / Fornitore`.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-08 — 2026-04-08 15:41
- File principali: `src/next/next-mappa-storico.css`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `CONTEXT_CLAUDE.md`
- Cosa: Bloccare la riga `Data / KM-Ore / Fornitore` della tab NEXT `Nuova / Modifica` del modulo `Manutenzioni` a larghezze fisse e compatte. / Il gruppo resta compatto, allineato a sinistra e con gap uniforme di `16px`.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-08 — 2026-04-08 17:47:18
- File principali: `src/next/NextManutenzioniPage.tsx`; `src/next/NextMappaStoricoPage.tsx`; `src/next/domain/nextManutenzioniDomain.ts`; `src/next/domain/nextManutenzioniGommeDomain.ts`; `src/next/next-mappa-storico.css`
- Cosa: Introdurre nel modulo NEXT `Manutenzioni` un flusso gomme/assi inline, senza riaprire il modale legacy: / selezione assi in `Nuova / Modifica`;
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-08 — 2026-04-08 20:02:53
- File principali: `src/next/NextMappaStoricoPage.tsx`; `src/next/mezziHotspotAreas.ts`; `src/next/next-mappa-storico.css`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: Ripulire il viewer tecnico nelle viste `Sinistra/Destra`, eliminare i marker neutri in modalita normale e introdurre una modalita `Calibra` separata.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-08 — 2026-04-08 21:21:25
- File principali: `src/next/NextManutenzioniPage.tsx`; `src/next/NextMappaStoricoPage.tsx`; `src/next/domain/nextManutenzioniDomain.ts`; `src/next/next-mappa-storico.css`; `docs/STATO_ATTUALE_PROGETTO.md`
- Cosa: Correggere il runtime reale del modulo `/next/manutenzioni` per esporre davvero: / la terza opzione `Attrezzature` nel form `Nuova / Modifica`;
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-08 — 2026-04-08 21:48
- File principali: `docs/change-reports/20260408_214800_next_manutenzioni_delta_km_calibra_tooltip.md`; `docs/continuity-reports/20260408_214800_continuity_next_manutenzioni_delta_km_calibra_tooltip.md`
- Cosa: Mostrare nel `Dettaglio` di `Manutenzioni` NEXT il delta km dall'ultimo cambio gomme usando il km attuale da ultimo rifornimento valido. / Rendere `Calibra` autoesplicativo via tooltip/focus senza aggiungere testo fisso nel layout.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-08 — 2026-04-08 22:15
- File principali: `src/next/NextManutenzioniPage.tsx`; `src/next/NextMappaStoricoPage.tsx`; `src/next/domain/nextMappaStoricoDomain.ts`; `src/next/domain/nextManutenzioniGommeDomain.ts`; `src/next/next-mappa-storico.css`
- Cosa: Eliminare il doppione tra `Ultimo intervento mezzo` e `Ultime manutenzioni mezzo`. / Rendere `Calibra` una vera modalita di spostamento marker con persistenza clone-side nel viewer tecnico di `Manutenzioni`.
- Impatto: tocca dati, UI/runtime
- Esito: FATTO

### 2026-04-08 — 2026-04-08 22:36
- File principali: `src/next/NextManutenzioniPage.tsx`; `src/next/NextMappaStoricoPage.tsx`; `src/next/domain/nextMappaStoricoDomain.ts`; `src/next/domain/nextManutenzioniGommeDomain.ts`; `src/next/next-mappa-storico.css`
- Cosa: Correggere tre problemi runtime reali di `Manutenzioni` NEXT: / Calibra` non ancora conforme al flusso create/place/drag/save;
- Impatto: tocca dati, UI/runtime
- Esito: INCOMPLETO

### 2026-04-08 — 2026-04-08 23:39:44
- File principali: `docs/continuity-reports/20260408_233944_continuity_next_manutenzioni_gomme_per_asse.md`
- Cosa: Il flusso gomme per asse e ora strutturato e leggibile nel quadro, ma il modulo non va dichiarato chiuso: resta necessario il controllo runtime finale nel browser sul caso reale multi-asse e sulle combinazioni categoria/km.
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-08 — Change Report
- File principali: `src/next/NextManutenzioniPage.tsx`; `src/next/domain/nextManutenzioniDomain.ts`; `src/next/domain/nextManutenzioniGommeDomain.ts`; `src/next/next-mappa-storico.css`; `docs/STATO_ATTUALE_PROGETTO.md`
- Cosa: Strutturare il cambio gomme per asse nel clone NEXT `Manutenzioni`. / Aggiungere il filtro `Attrezzature` nel `Quadro manutenzioni PDF`.
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-08 — PROMPT24: Calibra normal-mode display
- File principali: `docs/continuity-reports/20260408_PROMPT24_continuity_next_manutenzioni_calibra_normal_mode_display.md`
- Cosa: Audit separato del modulo `Manutenzioni` NEXT per promozione da `PARZIALE` a `CHIUSO / Matrice permessi reale non implementata (preset frontend)
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-08 — PROMPT24: Calibra normal-mode display + audit 4 problemi
- File principali: `src/next/NextMappaStoricoPage.tsx`; `src/next/next-mappa-storico.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `CONTEXT_CLAUDE.md`
- Cosa: Completare i 4 fix richiesti dal PROMPT 24 nel runtime NEXT `Manutenzioni`: / Problema A: marker tecnici salvati visibili anche in modalita normale (non-calibra)
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-09 — 2026-04-09 12:14:44
- File principali: `src/next/NextManutenzioniPage.tsx`; `src/next/domain/nextManutenzioniDomain.ts`; `src/next/domain/nextManutenzioniGommeDomain.ts`; `src/next/next-mappa-storico.css`; `docs/STATO_ATTUALE_PROGETTO.md`
- Cosa: Separare nel modulo NEXT `Manutenzioni` il cambio gomme ordinario per asse dagli eventi gomme straordinari, senza toccare viewer tecnico, Euromecc o madre legacy. / aggiunto nel record clone-side il contratto retrocompatibile:
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-09 — 2026-04-09 13:02:52
- File principali: `docs/change-reports/20260409_130252_next_manutenzioni_remove_calibra_dettaglio.md`; `docs/continuity-reports/20260409_130252_continuity_next_manutenzioni_remove_calibra_dettaglio.md`
- Cosa: src/next/next-mappa-storico.css`: aggiunto styling per il riepilogo manutenzione selezionata.
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-09 — 2026-04-09 13:49:12
- File principali: `docs/change-reports/20260409_134912_next_manutenzioni_viste_tecniche_dx_sx_ricerca_quadro.md`; `docs/continuity-reports/20260409_134912_continuity_next_manutenzioni_viste_tecniche_dx_sx_ricerca_quadro.md`
- Cosa: Aggiunto styling dedicato all'immagine del viewer embedded per rendere leggibile la tavola tecnica. / src/next/NextMappaStoricoPage.tsx`: viewer embedded riallineato alla tavola tecnica e tab ridotte a `Sinistra / Destra`.
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-09 — 2026-04-09 14:19:58
- File principali: `docs/change-reports/20260409_141958_next_manutenzioni_pdf_foto_reale_tooltip_cleanup.md`; `docs/continuity-reports/20260409_141958_continuity_next_manutenzioni_pdf_foto_reale_tooltip_cleanup.md`
- Cosa: src/next/NextManutenzioniPage.tsx`: export PDF locale con foto reale, export generale allineato ai risultati visibili, riduzione microcopy e tooltip.
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-09 — Change Report
- File principali: `docs/change-reports/20260409_144833_audit_prompt32_manutenzioni_next_crossmodulo.md`
- Cosa: Registrare un audit profondo del modulo NEXT `Manutenzioni` e dei suoi collegamenti reali con `Dossier`, `App Autisti`, `Quadro manutenzioni PDF`, `Dettaglio` e boundary NEXT vs madre, senza patch runtime. / L'audit non auto-promuove il modulo a `CHIUSO`.
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-09 — Continuity Report
- File principali: `docs/continuity-reports/20260409_144833_continuity_audit_prompt32_manutenzioni_next_crossmodulo.md`
- Cosa: Route NEXT `/next/manutenzioni` e boundary con la madre / Reader/writer reali del modulo
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-09 — Change Report
- File principali: `docs/change-reports/20260409_154405_manutenzioni_next_fix_crossmodulo_prompt34.md`
- Cosa: Applicare i fix emersi dall'audit cross-modulo di `Manutenzioni` NEXT, con priorita al bug writer su `@materialiconsegnati` e all'allineamento dei campi gomme strutturati verso `Dossier`, `Dossier Gomme` e `Operativita`.
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-09 — Continuity Report
- File principali: `docs/continuity-reports/20260409_154405_continuity_manutenzioni_next_fix_crossmodulo_prompt34.md`
- Cosa: Writer materiali `Manutenzioni` su `@materialiconsegnati / Lettura campi gomme strutturati in `nextManutenzioniGommeDomain.ts
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-09 — 2026-04-09 16:20:49
- File principali: `src/next/NextManutenzioniPage.tsx`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `CONTEXT_CLAUDE.md`
- Cosa: Correggere il quadro PDF di `/next/manutenzioni` in modo che il filtro `Compressore` usi `ore` invece di `km`, mantenendo intatti i rami `Mezzo` e `Attrezzature`.
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-11 — Dossier Mezzo: Flusso Fattura → Manutenzione
- File principali: `docs/change-reports/20260411_dossier_fattura_to_manutenzione.md`; `docs/continuity-reports/20260411_continuity_dossier_fattura_to_manutenzione.md`
- Cosa: Implementare il flusso "Fattura → Manutenzione" nel Dossier Mezzo NEXT: / NextDossierFatturaToManutenzioneModal.tsx` creato e funzionante strutturalmente
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-04-12 — 2026-04-12 14:13:06
- File principali: `docs/continuity-reports/20260412_141306_continuity_ia_interna_fix_analizza_clone_barrier.md`
- Cosa: applicata la patch minima solo in `src/utils/cloneWriteBarrier.ts / autorizzato esclusivamente il caso:
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-15 — Change Report
- File principali: `docs/change-reports/20260415_154007_ia_v1_archivista_manutenzione_review_no_save.md`
- Cosa: Rendere reale dentro `Archivista documenti` il ramo `Fattura / DDT + Manutenzione`, mantenendo separati `IA Report` e `Archivista`, senza introdurre archiviazione definitiva, scritture business, `@costiMezzo`, update mezzo o collegamenti automatici finali.
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-15 — Continuity Report
- File principali: `docs/continuity-reports/20260415_154007_continuity_ia_v1_archivista_manutenzione_review_no_save.md`
- Cosa: archiviazione definitiva del documento / collegamento a manutenzione esistente
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-15 — 2026-04-15 16:40:47
- File principali: `docs/change-reports/20260415_164047_ia_v1_manutenzione_openai_only_fix.md`; `docs/continuity-reports/20260415_164047_continuity_ia_v1_manutenzione_openai_only_fix.md`
- Cosa: Rimuovere dal ramo Manutenzione l'uso di `estrazioneDocumenti` e delle pipeline legacy/Gemini. / Mantenere invariata la review utente gia costruita.
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-21 — Archivista Manutenzione multipagina + step 2 manutenzione
- File principali: `docs/change-reports/20260421_182147_archivista_manutenzione_multipagina.md`; `docs/continuity-reports/20260421_182147_continuity_archivista_manutenzione_multipagina.md`
- Cosa: Estendere solo il ramo `Fattura / DDT + Manutenzione` di Archivista con tre cambi coordinati: / backend OpenAI `manutenzione-analyze` capace di ricevere piu pagine come documento logico unico;
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-04-21 — 2026-04-21 18:52:49
- File principali: `src/next/domain/nextManutenzioniDomain.ts`; `src/next/NextManutenzioniPage.tsx`; `src/next/NextMappaStoricoPage.tsx`; `CONTEXT_CLAUDE.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: salvare `importo` in `@manutenzioni` in modo additivo e opzionale; / mostrare nella Dashboard `Ultimi interventi` un riassunto piu corto con officina e importo quando presenti;
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-04-21 — Change Report
- File principali: `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx`; `src/next/internal-ai/internal-ai.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `CONTEXT_CLAUDE.md`
- Cosa: Riallineare la UI di `ArchivistaManutenzioneBridge` al mockup approvato con struttura a step 1-5, senza modificare handler, writer o logica business. / esteso `internal-ai.css` con classi dedicate a:
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-04-21 — Continuity Report
- File principali: `docs/continuity-reports/20260421_224907_continuity_restyling_archivista_manutenzione_bridge.md`
- Cosa: Archivista documenti -> Fattura / DDT + Manutenzione / toggle `showMateriali` funzionante e aperto di default;
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

## Euromecc — 12 patch dal 2026-04 al 2026-04

### 2026-04-03 — 2026-04-03 23:05 - Euromecc modulo nativo NEXT
- File principali: `src/App.tsx`; `src/next/nextStructuralPaths.ts`; `src/next/nextData.ts`; `src/next/domain/nextEuromeccDomain.ts`; `src/next/euromeccAreas.ts`
- Cosa: Costruire la V1 del nuovo modulo nativo NEXT `Euromecc` dentro `/next`, con route reale, voce sidebar sotto `MAGAZZINO`, UI a 4 tab e persistenza Firestore dedicata. / Il modulo e V1: non va marcato `CHIUSO` senza audit dedicato successivo.
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-04 — 2026-04-04 09:18
- File principali: `src/next/NextEuromeccPage.tsx`; `src/next/next-euromecc.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `CONTEXT_CLAUDE.md`
- Cosa: Rendere la `Mappa impianto` della tab `Home` piu grande e meno schiacciata. / Rendere piu leggibile lo `Schema tecnico` del fullscreen.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-04 — 2026-04-04 10:12
- File principali: `src/next/NextEuromeccPage.tsx`; `src/next/next-euromecc.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `CONTEXT_CLAUDE.md`
- Cosa: Correggere il problema residuo di compressione del disegno interno, senza alterare il layout pagina o il fullscreen.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-04 — 2026-04-04 11:06
- File principali: `src/next/NextEuromeccPage.tsx`; `src/next/next-euromecc.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `CONTEXT_CLAUDE.md`
- Cosa: Rifare la composizione SVG della Home mantenendo pagina, `Focus area`, click nodo e fullscreen invariati.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-04 — 2026-04-04 12:22
- File principali: `src/next/domain/nextEuromeccDomain.ts`; `src/next/NextEuromeccPage.tsx`; `src/next/next-euromecc.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Rendere il `tipo cemento` dinamico, persistente e modificabile via modale, visibile nella Home map solo per i sili. / esteso lo snapshot UI con `areaMeta` e `cementTypesByArea`;
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-04 — 2026-04-04 13:48
- File principali: `src/next/domain/nextEuromeccDomain.ts`; `src/next/NextEuromeccPage.tsx`; `src/next/next-euromecc.css`; `docs/product/SPEC_MODULO_EUROMECC_NEXT.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: Rendere la Home map piu pulita con una sigla breve dentro il silo, mantenendo il nome completo nel dettaglio e un modale piu robusto per l'inserimento. / esteso `euromecc_area_meta` con `cementTypeShort?`;
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-04 — IA interna Euromecc read-only
- File principali: `docs/change-reports/2026-04-04_2224_ia_interna_euromecc_readonly.md`; `docs/continuity-reports/2026-04-04_2224_continuity_ia_interna_euromecc_readonly.md`
- Cosa: creato `src/next/internal-ai/internalAiEuromeccReadonly.ts` come retriever/read-model dedicato;
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-04 — 2026-04-04 23:10
- File principali: `firestore.rules`; `firebase.json`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `CONTEXT_CLAUDE.md`
- Cosa: Versionare nel repository regole Firestore esplicite per le collection dedicate `Euromecc`, senza fingere una matrice per-ruolo che il codice non dimostra oggi. / creato `firestore.rules`;
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-05 — 2026-04-05 08:07
- File principali: `src/next/euromeccAreas.ts`; `docs/product/SPEC_MODULO_EUROMECC_NEXT.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `CONTEXT_CLAUDE.md`
- Cosa: Eliminare i warning gialli di default dalla Home map del modulo `Euromecc` quando le collection del modulo sono vuote.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-05 — 2026-04-05 08:35 - Euromecc hidden data manager
- File principali: `docs/change-reports/2026-04-05_0835_euromecc_hidden_data_manager.md`; `docs/continuity-reports/2026-04-05_0835_continuity_euromecc_hidden_data_manager.md`
- Cosa: Aggiungere nel modulo Euromecc un pannello discreto `Gestione dati Euromecc` per visualizzare, modificare ed eliminare record di: / euromecc_issues
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-09 — Euromecc: documenti originali + lista ricambi → ordine
- File principali: `src/next/NextEuromeccPage.tsx`; `src/utils/cloneWriteBarrier.ts`; `storage.rules`; `src/next/next-euromecc.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: Feature A: upload PDF/immagine relazione su Firebase Storage al momento della conferma; link "Apri documento" nello storico. / Feature B: selettore tipo documento (Relazione / Lista ricambi); flusso AI lista ricambi; writer ordine su @ordini; badge ordine nello storico.
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-04-09 — Nuova UI tab Riepilogo Euromecc + export PDF
- File principali: `src/next/NextEuromeccPage.tsx`; `src/next/next-euromecc.css`; `package.json`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: Sostituire il tab Riepilogo di `/next/euromecc` (textarea + window.print) con UI visiva professionale e export PDF locale con jsPDF. / Aggiunto tipo `RiepilogoCardData` e import `EuromeccAreaType`.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

## Magazzino — 32 patch dal 2026-03 al 2026-04

### 2026-03-09 — <Titolo intervento>
- File principali: `<path 1>`; `<path 2>`
- Cosa: <obiettivo sintetico del task> / Punto aperto collegato?
- Impatto: tocca UI/runtime
- Esito: INCOMPLETO

### 2026-03-26 — 2026-03-26 06:31
- File principali: `src/next/domain/nextMaterialiMovimentiDomain.ts`; `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`; `src/next/internal-ai/internalAiChatOrchestrator.ts`; `src/next/NextInternalAiPage.tsx`; `src/next/NextOperativitaGlobalePage.tsx`
- Cosa: Completare il work-package D05 partito in modo parziale, consolidando il dominio magazzino come layer canonico read-only e chiudendo la rotta operativa reale `/next/gestione-operativa` su una superficie coerente con il clone. / D05 magazzino reale read-only chiuso per NEXT e IA interna
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-29 — 2026-03-29 1246 - Prompt 35 hardening finale residuo NEXT
- File principali: `src/next/nextLegacyAutistiOverlay.ts`; `src/next/NextLegacyStorageBoundary.tsx`; `src/next/NextHomePage.tsx`; `src/next/NextCentroControlloClonePage.tsx`; `src/next/NextLibrettiExportPage.tsx`
- Cosa: Chiudere il residuo clone-side realmente assorbibile senza toccare la madre, estendendo i boundary dati NEXT ai flussi autisti/IA/dossier e portando `Libretti Export` a parita piena. / Aggiornati registri e report con verdetto duro: `Libretti Export` chiuso, resto del backlog residuo ancora aperto.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-30 — Prompt 44 - Chiusura gap parziali
- File principali: `src/next/NextInventarioPage.tsx`; `src/next/NextMaterialiConsegnatiPage.tsx`; `src/next/NextMezziPage.tsx`; `src/next/NextCapoCostiMezzoPage.tsx`; `src/next/nextInventarioCloneState.ts`
- Cosa: aggiunto supporto persistente a delete locali nel clone state e merge nel domain. / esteso il layer D01 con patch clone mezzo, delete locale e creazione di nuovi mezzi clone-only.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-31 — Loop `Inventario` (`2026-03-31 08:24`)
- File principali: `docs/change-reports/2026-03-31_0824_inventario_loop.md`; `docs/continuity-reports/2026-03-31_0824_continuity_inventario_loop.md`
- Cosa: Verificare se il modulo `Inventario` della NEXT sulla route `/next/inventario` sia chiudibile come clone fedele read-only della madre nel loop corrente.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — Loop `Inventario` Fix (`2026-03-31 08:43`)
- File principali: `docs/change-reports/2026-03-31_0843_inventario_loop_fix.md`; `docs/continuity-reports/2026-03-31_0843_continuity_inventario_loop_fix.md`
- Cosa: Chiudere il modulo `Inventario` della NEXT sulla route `/next/inventario` come clone fedele read-only della madre, senza toccare la madre e senza degradare il layer D05 esistente. / runtime ufficiale `Inventario` riallineato alla superficie madre senza writer clone-only
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — 2026-03-31 11:16 - IA Documenti loop fix
- File principali: `docs/change-reports/2026-03-31_1116_ia-documenti_loop_fix.md`
- Cosa: Chiudere il modulo `IA Documenti` della NEXT come clone fedele read-only della madre su `/next/ia/documenti`, eliminando preview e writer clone-only dal runtime ufficiale.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — Audit finale globale NEXT post loop V3
- File principali: `docs/change-reports/2026-03-31_1717_audit-finale-globale-next-post-loop-v3.md`
- Cosa: Rieseguire da zero l'audit finale globale della NEXT dopo il fix finale di `Autisti Inbox / Admin`.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-03 — 2026-04-03 2106 - next-home-magazzino-inventario
- File principali: `docs/change-reports/2026-04-03_2106_next-home-magazzino-inventario.md`; `docs/continuity-reports/2026-04-03_2106_continuity_next-home-magazzino-inventario.md`
- Cosa: Riallineare il widget `Magazzino` della Home NEXT alla sola semantica `Inventario`, eliminando i placeholder misti con procurement. / esteso il caricamento iniziale della Home con la snapshot inventario read-only;
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-09 — 2026-04-09 20:11:56
- File principali: `src/next/NextMagazzinoPage.tsx`; `src/next/next-magazzino.css`; `src/App.tsx`; `src/utils/cloneWriteBarrier.ts`; `docs/STATO_ATTUALE_PROGETTO.md`
- Cosa: Creare un modulo NEXT unico per `Inventario`, `Materiali consegnati` e `Cisterne AdBlue`, mantenendo la madre intoccabile, usando persistenza storage-style reale e trattando `@cisterne_adblue` come dataset `getItemSync/setItemSync`. / aggiunto upload immagini inventario su Storage con path `inventario/*`;
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-09 — 2026-04-09 21:04:31
- File principali: `src/next/NextMagazzinoPage.tsx`; `src/next/nextData.ts`; `src/next/NextHomePage.tsx`; `src/App.tsx`; `src/next/nextStructuralPaths.ts`
- Cosa: Promuovere `/next/magazzino` come unico ingresso pubblico principale del dominio `Magazzino` nella NEXT, mantenendo attivi i vecchi path `/next/inventario` e `/next/materiali-consegnati` solo come redirect di compatibilita verso il modulo unificato. / Aggiunto il path strutturale canonico `/next/magazzino` in `nextStructuralPaths.ts`, con helper per costruire `?tab=inventario|materiali-consegnati|cisterne-adblue`.
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-09 — Change Report
- File principali: `docs/audit/AUDIT_MAGAZZINO_NEXT_VS_MADRE_LOGICA_DOMINIO_2026-04-09.md`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `CONTEXT_CLAUDE.md`
- Cosa: Formalizzare un audit strutturale sul dominio `Magazzino`, distinguendo logica reale della madre, dataset realmente coinvolti, collegamenti cross-modulo e copertura effettiva del nuovo modulo `NextMagazzinoPage`. / Audit dedicato creato con mappa verificata di:
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-09 — Continuity Report
- File principali: `docs/continuity-reports/20260409_221500_continuity_audit_magazzino_next_vs_madre_logica_dominio.md`
- Cosa: Ricostruita la logica reale della madre per: / Inventario
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-09 — 2026-04-09 22:28:42
- File principali: `src/next/NextMagazzinoPage.tsx`; `src/next/next-magazzino.css`; `src/next/nextStructuralPaths.ts`; `src/next/domain/nextMaterialiMovimentiDomain.ts`; `docs/STATO_ATTUALE_PROGETTO.md`
- Cosa: Portare `Magazzino NEXT` da modulo operativo locale a centro operativo coerente del dominio magazzino della NEXT, senza toccare la madre legacy, senza riaprire i vecchi entrypoint NEXT come runtime principali e senza introdurre nuovi writer su documenti/costi/procurement. / Nessuna auto-certificazione del modulo come `CHIUSO
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-04-10 — 2026-04-10 12:30:00
- File principali: `docs/audit/AUDIT_FINALE_MAGAZZINO_NEXT_DOMINIO_2026-04-10.md`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- Cosa: Verificare in modo finale e strutturale il dominio reale collegato a `/next/magazzino`, includendo route, dataset, writer esterni, lettori dossier/costi, documenti materiali, parity con la madre e rischi multi-writer, senza toccare `src/*`. / creato l'audit finale strutturale del dominio `Magazzino NEXT`;
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-10 — 2026-04-10 12:52:34
- File principali: `src/next/NextMagazzinoPage.tsx`; `src/next/NextProcurementReadOnlyPanel.tsx`; `src/next/domain/nextProcurementDomain.ts`; `src/next/nextData.ts`; `docs/STATO_ATTUALE_PROGETTO.md`
- Cosa: Portare il dominio `Magazzino` in modalita `AUTONOMIA NEXT` nel solo perimetro autorizzato, facendo di `/next/magazzino` il writer stock canonico lato NEXT senza riaprire la madre e senza introdurre un nuovo ledger costi. / Nessuna auto-certificazione del dominio come `CHIUSO
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-10 — CHANGE REPORT
- File principali: `src/next/NextMagazzinoPage.tsx`; `src/next/domain/nextDocumentiCostiDomain.ts`; `src/next/internal-ai/internalAiUniversalContracts.ts`; `src/next/internal-ai/internalAiUniversalDocumentRouter.ts`; `src/next/internal-ai/internalAiUniversalHandoff.ts`
- Cosa: Abilitare in modo controllato la IA interna NEXT a gestire scritture business solo su due casi documentali del dominio `Magazzino`: / fattura materiali gia arrivati e gia caricati a stock -> sola riconciliazione senza carico
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-10 — CONTINUITY REPORT
- File principali: `docs/continuity-reports/20260410_160342_continuity_ia_interna_magazzino_fatture_write_exception_execution.md`
- Cosa: Task chiuso: deroga scrivente controllata IA interna NEXT per le sole fatture `Magazzino / Punto raggiunto
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-10 — 2026-04-10 16:45:00
- File principali: `src/next/NextMagazzinoPage.tsx`; `src/next/next-magazzino.css`; `src/next/domain/nextMagazzinoStockContract.ts`; `src/next/domain/nextManutenzioniDomain.ts`; `src/next/domain/nextMaterialiMovimentiDomain.ts`
- Cosa: Rendere coerente e controllato il comportamento di `@inventario` nel perimetro NEXT, senza rifare `Magazzino` da zero, senza toccare la madre e senza introdurre un nuovo ledger costi, allineando i writer principali su carichi, scarichi, unita di misura, deduplica documenti/arrivi e AdBlue come materiale di inventario. / Creato `nextMagazzinoStockContract.ts` come helper comune del dominio stock NEXT:
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-10 — CHANGE REPORT
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiUniversalDocumentRouter.ts`; `src/next/internal-ai/internalAiUniversalHandoff.ts`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: Permettere alla chat `/next/ia/interna` di lavorare in modo naturale sui documenti `Magazzino`: / allegato come trigger principale del flusso
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-04-10 — CONTINUITY REPORT
- File principali: `docs/continuity-reports/20260410_181242_continuity_ia_interna_magazzino_document_driven_execution.md`
- Cosa: Task chiuso: trasformazione UX IA interna `Magazzino` da prompt-driven a document-driven / Punto raggiunto
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-04-10 — 2026-04-10 19:05:00
- File principali: `src/next/NextMagazzinoPage.tsx`; `src/next/domain/nextMaterialiMovimentiDomain.ts`; `src/next/internal-ai/internalAiUniversalContracts.ts`; `src/next/internal-ai/internalAiUniversalRequestResolver.ts`; `src/next/internal-ai/internalAiUniversalHandoff.ts`
- Cosa: Permettere alla console `/next/ia/interna` di leggere, incrociare e spiegare il dominio `Magazzino` usando i reader NEXT reali, senza toccare la madre, senza aprire scritture business e senza inventare match non dimostrabili tra materiali, documenti e procurement. / Nessuna auto-certificazione del dominio `Magazzino` come `CHIUSO
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-04-11 — CHANGE REPORT
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiMagazzinoControlledActions.ts`; `src/next/internal-ai/internal-ai.css`; `src/utils/cloneWriteBarrier.ts`; `docs/STATO_ATTUALE_PROGETTO.md`
- Cosa: Portare nel modale/chat `/next/ia/interna` il completamento del flusso documentale `Magazzino`, senza passaggio obbligatorio nel modulo `/next/magazzino`, ma solo per i due casi gia approvati: / riconcilia_senza_carico
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-11 — CONTINUITY REPORT
- File principali: `docs/continuity-reports/20260411_083921_continuity_ia_interna_magazzino_inline_confirm_execute_execution.md`
- Cosa: Task chiuso: conferma, esecuzione ed esito inline IA interna NEXT per i documenti `Magazzino / Punto raggiunto
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-11 — IA interna Magazzino full screen document review
- File principali: `docs/change-reports/20260411_170658_ia_interna_magazzino_fullscreen_document_review_execution.md`; `docs/continuity-reports/20260411_170658_continuity_ia_interna_magazzino_fullscreen_document_review_execution.md`
- Cosa: Sostituire la review documentale dispersiva della IA interna `Magazzino` con una schermata operativa full screen dove: / il documento e protagonista visivo;
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-04-11 — IA interna Magazzino document extraction pipeline
- File principali: `docs/change-reports/20260411_202032_ia_interna_magazzino_document_extraction_pipeline_execution.md`; `docs/continuity-reports/20260411_202032_continuity_ia_interna_magazzino_document_extraction_pipeline_execution.md`
- Cosa: Rendere la review documento full screen della IA interna `Magazzino` basata su estrazione documentale reale e strutturata, non piu solo su classificazione o metadata deboli, migliorando: / distinzione PDF testo / PDF scansione / immagine documento;
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-04-11 — Magazzino + IA interna fix riconciliazione stock e review destra
- File principali: `docs/change-reports/20260411_214553_magazzino_ia_fix_riconciliazione_stock_review_destra_execution.md`; `docs/continuity-reports/20260411_214553_continuity_magazzino_ia_fix_riconciliazione_stock_review_destra_execution.md`
- Cosa: Correggere due problemi reali e prioritari del dominio `Magazzino` + IA interna, nel solo perimetro autorizzato: / impedire che il flusso documentale `Consolida stock` aumenti la quantita nei casi di sola riconciliazione/costo su materiale gia consolidato;
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-11 — Audit runtime E2E fix Magazzino + IA interna
- File principali: `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`; `docs/product/CHECKLIST_IA_INTERNA.md`
- Cosa: Verificare nel runtime reale se il fix appena applicato al dominio `Magazzino` + IA interna consente davvero: / Riconcilia documento` senza incremento quantita;
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-04-13 — 2026-04-13 16:46:26
- File principali: `src/next/NextMagazzinoPage.tsx`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `CONTEXT_CLAUDE.md`
- Cosa: Impedire che `/next/magazzino?tab=documenti-costi` mostri documenti/costi globali IA e limitarlo al solo dominio Magazzino senza toccare domain, writer o barrier.
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-13 — 2026-04-13 17:25:08
- File principali: `src/next/NextMagazzinoPage.tsx`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `CONTEXT_CLAUDE.md`
- Cosa: Riallineare la UI del tab `/next/magazzino?tab=documenti-costi` al linguaggio `Documenti e costi` della spec `docs/product/SPEC_DOCUMENTI_COSTI_UI.md`, mantenendo solo il perimetro dati Magazzino gia corretto e senza toccare domain, writer o barrier. / Limite aperto
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-15 — Change Report
- File principali: `docs/change-reports/20260415_151953_ia_v1_archivista_magazzino_reuse_no_refactor.md`
- Cosa: Rendere reale dentro `Archivista documenti` il solo ramo `Fattura / DDT + Magazzino`, mantenendo separati `IA Report` e `IA 2`, senza introdurre writer business nuovi e senza rifare Magazzino.
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-15 — Continuity Report
- File principali: `docs/continuity-reports/20260415_151953_continuity_ia_v1_archivista_magazzino_reuse_no_refactor.md`
- Cosa: Fattura / DDT + Manutenzione / Documento mezzo
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

## Lavori — 14 patch dal 2026-03 al 2026-04

### 2026-03-11 — Apertura clone-safe Lavori in attesa e Lavori eseguiti
- File principali: `src/App.tsx`; `src/next/NextCentroControlloPage.tsx`; `src/next/NextLavoriInAttesaPage.tsx`; `src/next/NextLavoriEseguitiPage.tsx`; `src/next/domain/nextLavoriDomain.ts`
- Cosa: Aprire nel clone read-only le due route reali della famiglia `Lavori` che hanno un perimetro consultivo sensato, mantenendo fuori `Lavori Da Eseguire` e `DettaglioLavoro`. / Esteso `nextLavoriDomain.ts` con snapshot globale read-only, includendo anche lavori `MAGAZZINO` o senza targa e mantenendo intatto il reader per-mezzo gia usato dal dossier.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-11 — Lavori in attesa e Lavori eseguiti clone
- File principali: `docs/continuity-reports/2026-03-11_0958_continuity_lavori-in-attesa-eseguiti-clone.md`
- Cosa: Due pagine clone dedicate solo consultive per backlog globale ed eseguiti / Quick link del `Centro Controllo` risolti verso le due nuove route
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Apertura clone-safe DettaglioLavoro read-only
- File principali: `src/App.tsx`; `src/next/domain/nextLavoriDomain.ts`; `src/next/NextDettaglioLavoroPage.tsx`; `src/next/NextLavoriInAttesaPage.tsx`; `src/next/NextLavoriEseguitiPage.tsx`
- Cosa: Aprire una route clone-safe dedicata al dettaglio lavori, riusando il layer NEXT `read-only` e senza riattivare la UI madre scrivente. / Esteso `nextLavoriDomain.ts` con un resolver read-only del dettaglio per `lavoroId`, che usa `gruppoId` solo quando esiste nel dato legacy e, se manca, mostra solo il record principale.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-11 — DettaglioLavoro clone
- File principali: `docs/continuity-reports/2026-03-11_1131_continuity_dettagliolavori-clone.md`
- Cosa: Liste globali lavori read-only / Dettaglio lavoro read-only con resolver dedicato per `lavoroId
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Dossier clone -> DettaglioLavoro clone-safe
- File principali: `src/next/NextDossierMezzoPage.tsx`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: Collegare dal Dossier clone il dettaglio lavoro read-only gia esistente, senza toccare il legacy e senza aprire nuovi moduli. / Il collegamento e stato aggiunto sia nella card `Lavori` sia nei modal `Mostra tutti`.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-11 — Dossier Mezzo / DettaglioLavoro clone-safe
- File principali: `docs/continuity-reports/2026-03-11_1317_continuity_dossier-dettagliolavori-clone-safe.md`
- Cosa: Dossier Mezzo clone read-only / liste `Lavori in attesa` / `Lavori eseguiti
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-31 — `Lavori` loop fix
- File principali: `docs/change-reports/2026-03-31_1014_lavori_loop_fix.md`; `docs/continuity-reports/2026-03-31_1014_continuity_lavori_loop_fix.md`
- Cosa: Riallineato `src/next/domain/nextLavoriDomain.ts` con opt-out ufficiale degli overlay clone-only tramite `includeCloneOverlays: false`.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-06 — 2026-04-06 12:15
- File principali: `src/utils/cloneWriteBarrier.ts`; `src/next/NextLavoriDaEseguirePage.tsx`; `src/next/NextLavoriInAttesaPage.tsx`; `src/next/NextLavoriEseguitiPage.tsx`; `src/next/NextDettaglioLavoroPage.tsx`
- Cosa: Portare il modulo `Lavori` della NEXT a una dashboard UI unificata, mantenendo la logica reale di aggiunta, modifica, esecuzione ed eliminazione e aprendo solo il minimo write-path necessario su `@lavori`. / creato un dettaglio lavoro reale condiviso, usabile sia come modale nella dashboard sia come route diretta.
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-06 — 2026-04-06 15:40
- File principali: `src/next/NextLavoriDaEseguirePage.tsx`; `src/next/NextDettaglioLavoroPage.tsx`; `src/next/next-lavori.css`; `src/next/NextHomePage.tsx`; `src/next/next-home.css`
- Cosa: Chiudere difetti reali di leggibilita del modulo `Lavori` gia aperto in scrittura nella NEXT, mostrando `Segnalato da`, `Autista solito`, migliorando il PDF esistente, colorando la priorita e aggiungendo anche i lavori in attesa nel blocco alert Home. / aggiunto `Segnalato da` sotto la descrizione del lavoro;
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-06 — 2026-04-06 20:44
- File principali: `src/next/NextDettaglioLavoroPage.tsx`; `src/next/next-lavori.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `CONTEXT_CLAUDE.md`
- Cosa: Mostrare nel dettaglio lavoro il testo reale del problema segnalato dall'autista quando disponibile. / Aprire la segnalazione autista originale in un modale read-only senza uscire dal modulo `Lavori`.
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-06 — 2026-04-06 21:02
- File principali: `src/next/NextDettaglioLavoroPage.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `CONTEXT_CLAUDE.md`
- Cosa: Correggere il recupero del testo reale della segnalazione autista nel dettaglio lavoro, eliminando il caso runtime in cui `Problema segnalato` restava `—`. / Nessuna route nuova.
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-07 — 2026-04-07 08:42
- File principali: `src/next/NextDettaglioLavoroPage.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `CONTEXT_CLAUDE.md`
- Cosa: Allineare `NextDettaglioLavoroPage.tsx` al flusso dati reale verificato dall'audit, evitando fallback fragili nel recupero della segnalazione autista origine. / Nessuna route nuova.
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-07 — 2026-04-07 09:27
- File principali: `docs/change-reports/2026-04-07_0927_lavori_fix_origine_controllo.md`; `docs/continuity-reports/2026-04-07_0927_continuity_lavori_fix_origine_controllo.md`
- Cosa: Estendere `src/next/NextDettaglioLavoroPage.tsx` per supportare anche i lavori nati da `controllo mezzo KO`, mantenendo invariato il flusso gia corretto dei lavori nati da `segnalazione`. / aggiunto il ramo controlli:
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-07 — 2026-04-07 09:41
- File principali: `docs/change-reports/2026-04-07_0941_lavori_fix_close_icon_controllo.md`; `docs/continuity-reports/2026-04-07_0941_continuity_lavori_fix_close_icon_controllo.md`
- Cosa: Aggiunto `aria-label="Chiudi modale controllo originale"` allo stesso bottone. / Fix chiuso nel perimetro richiesto.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

## IA interna — 176 patch dal 2026-03 al 2026-04

### 2026-03-08 — Strumenti Trasversali NEXT
- File principali: `docs/continuity-reports/2026-03-08_1131_continuity_next-strumenti-trasversali.md`
- Cosa: shell UI reale / route dedicata
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Hub clone read-only Intelligenza Artificiale
- File principali: `src/App.tsx`; `src/next/NextCentroControlloPage.tsx`; `src/next/NextIntelligenzaArtificialePage.tsx`; `src/next/NextIAGestionalePage.tsx`; `src/next/nextData.ts`
- Cosa: sostituire nel clone il placeholder concettuale `IA Gestionale` con il vero hub madre `Intelligenza Artificiale`, aprendo solo la route clone-safe del hub e lasciando bloccati i moduli figli non ancora separati da side effect / eliminato `NextIAGestionalePage.tsx` e creato un hub statico `NextIntelligenzaArtificialePage.tsx` che riprende ruolo, titolo e card della madre senza API key, upload o chiamate IA
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Apertura clone-safe Libretti Export read-only
- File principali: `src/App.tsx`; `src/next/NextIntelligenzaArtificialePage.tsx`; `src/next/NextLibrettiExportPage.tsx`; `src/next/NextPdfPreviewModal.tsx`; `src/next/domain/nextLibrettiExportDomain.ts`
- Cosa: Aprire nel clone il modulo reale `Libretti (Export PDF)` con il solo perimetro approvato: lista mezzi con libretto, selezione e anteprima PDF locale, senza share, download o azioni esterne. / Creato un domain dedicato che legge `@mezzi_aziendali` senza raw read in UI e aggiunge il supporto `librettoStoragePath` per la preview.
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-11 — Libretti Export clone
- File principali: `docs/continuity-reports/2026-03-11_0846_continuity_libretti-export-clone.md`
- Cosa: Route clone dedicata / Reader/domain dedicato
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Riallineamento metadata access e guard clone
- File principali: `docs/continuity-reports/2026-03-11_0922_continuity_metadata-access-guard-clone.md`
- Cosa: Catalogo aree clone aggiornato ai moduli realmente attivi / Access map riallineata a `Capo`, `Colleghi`, `Fornitori`, `IA`, `Libretti Export
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Parita strutturale clone = madre
- File principali: `src/App.tsx`; `src/next/NextHomePage.tsx`; `src/next/NextCentroControlloClonePage.tsx`; `src/next/NextGestioneOperativaPage.tsx`; `src/next/NextInventarioPage.tsx`
- Cosa: Chiudere i principali gap di parita strutturale del clone rispetto alla madre, trasformando le aree compresse o query-driven in vere route clone autonome senza toccare la madre e senza riaprire scritture. / L'hub IA viene riallineato alla famiglia completa di child route (`apikey`, `libretto`, `documenti`, `copertura-libretti`) con pagine clone dedicate e scritture neutralizzate.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Audit architetturale completo IA interna
- File principali: `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`; `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`; `docs/change-reports/2026-03-11_2348_docs_audit-architetturale-ia-interna.md`; `docs/continuity-reports/2026-03-11_2348_continuity_ia-interna-audit.md`
- Cosa: produrre un audit architetturale completo e due documenti di governo per progettare una IA interna sicura, isolata e non distruttiva, senza modificare codice applicativo o runtime / creato il documento permanente di linee guida per il futuro sottosistema IA interno
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-11 — IA interna gestionale
- File principali: `docs/continuity-reports/2026-03-11_2348_continuity_ia-interna-audit.md`
- Cosa: shell clone e route IA clone-safe gia presenti nel runtime / nessun backend IA nuovo
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-12 — IA interna scaffolding
- File principali: `docs/continuity-reports/2026-03-12_2133_continuity_ia-interna-scaffolding.md`
- Cosa: shell UI locale / routing dedicato
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-12 — Scaffolding IA interna isolata
- File principali: `src/App.tsx`; `src/next/NextIntelligenzaArtificialePage.tsx`; `src/next/NextInternalAiPage.tsx`; `src/next/nextStructuralPaths.ts`; `src/next/nextData.ts`
- Cosa: Avviare il primo scaffolding non operativo del nuovo sottosistema IA interna dentro `/next`, in modo isolato, preview-first e senza impatto sui moduli business o IA legacy. / Creato il subtree `/next/ia/interna*` con entry UI isolate per overview, sessioni, richieste, artifacts e audit.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-12 — Fix crash IA interna clone
- File principali: `src/next/internal-ai/internalAiTracking.ts`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: Correggere il crash della pagina IA interna clone eliminando il loop di render e i warning direttamente collegati al tracking locale. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-12 — IA interna report targa in anteprima
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiTypes.ts`; `src/next/internal-ai/internalAiContracts.ts`; `src/next/internal-ai/internalAiMockRepository.ts`; `src/next/internal-ai/internalAiVehicleReportFacade.ts`
- Cosa: Attivare il primo use case reale ma sicuro del sottosistema IA interno: cercare una targa, leggere dati in sola lettura dai layer NEXT e costruire una anteprima report nel clone. / Creato un facade IA interno per report targa che riusa solo il composito Dossier NEXT e i suoi reader gia normalizzati.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-12 — Checklist unica IA interna
- File principali: `docs/product/CHECKLIST_IA_INTERNA.md`; `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`; `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: creare una checklist unica della IA interna come fonte di verita operativa, ricostruire retroattivamente lo stato gia verificato e allineare i documenti di governo senza toccare runtime o logica applicativa / aggiunto il blocco futuro `Modello camion con IA` con stato `NON FATTO
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: ROLLBACK

### 2026-03-12 — Archivio artifact IA locale
- File principali: `src/next/internal-ai/internalAiTypes.ts`; `src/next/internal-ai/internalAiContracts.ts`; `src/next/internal-ai/internalAiMockRepository.ts`; `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internal-ai.css`
- Cosa: introdurre una persistenza minima, isolata e sicura per gli artifact/report preview del sottosistema IA interno, senza toccare dataset business, path Storage business o moduli IA legacy / esteso il modello artifact con metadati minimi, payload preview, fonti lette, tag e versionamento
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-12 — Chat interna controllata
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiTypes.ts`; `src/next/internal-ai/internalAiChatOrchestrator.ts`; `src/next/internal-ai/internal-ai.css`; `src/next/NextIntelligenzaArtificialePage.tsx`
- Cosa: Introdurre la prima chat interna controllata del sottosistema IA, senza collegare un vero LLM o backend IA, ma con una UI coerente col gestionale e un orchestratore locale/mock capace di instradare richieste sicure verso il use case gia esistente del report targa in anteprima. / Creato un orchestratore locale/mock che gestisce solo:
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-12 — Autosuggest targhe IA interna
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiTypes.ts`; `src/next/internal-ai/internalAiVehicleLookup.ts`; `src/next/internal-ai/internal-ai.css`; `docs/product/CHECKLIST_IA_INTERNA.md`
- Cosa: Rendere piu affidabile il use case `report targa in anteprima` introducendo una ricerca guidata dei mezzi reali del gestionale, in sola lettura, con autosuggest e selezione esplicita del mezzo. / Creato un facade locale di lookup mezzi che riusa `readNextAnagraficheFlottaSnapshot()` e costruisce un catalogo targhe read-only con cache di sessione.
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-13 — Memoria operativa locale IA
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiTypes.ts`; `src/next/internal-ai/internalAiTracking.ts`; `src/next/internal-ai/internalAiMockRepository.ts`; `docs/product/CHECKLIST_IA_INTERNA.md`
- Cosa: Introdurre la prima memoria operativa locale e il primo tracking persistente del sottosistema IA interna, ma solo nel perimetro IA del clone e senza toccare i flussi business del gestionale.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-13 — IA interna report autista
- File principali: `docs/continuity-reports/2026-03-13_1159_continuity_report-autista-ia-interna.md`
- Cosa: UI overview clone-safe del sottosistema IA / Lookup mezzi e autisti reali read-only
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-13 — Report autista IA interna read-only
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiTypes.ts`; `src/next/internal-ai/internalAiTracking.ts`; `src/next/internal-ai/internalAiMockRepository.ts`; `src/next/internal-ai/internalAiChatOrchestrator.ts`
- Cosa: Estendere il sottosistema IA interno del clone con ricerca guidata autisti reali, preview report autista read-only e distinzione chiara dal flusso report targa. / Aggiunto lookup autisti read-only basato su `storage/@colleghi` con autosuggest guidato e contesto minimo sui mezzi associati.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-13 — Filtri temporali report IA interna read-only
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiTypes.ts`; `src/next/internal-ai/internalAiTracking.ts`; `src/next/internal-ai/internalAiMockRepository.ts`; `src/next/internal-ai/internalAiChatOrchestrator.ts`
- Cosa: Estendere i report read-only del sottosistema IA interno con un contesto periodo condiviso, applicato in modo sicuro solo alle sezioni che espongono date leggibili nei layer NEXT gia usati dal clone. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-13 — IA interna filtri temporali report
- File principali: `docs/continuity-reports/2026-03-13_1240_continuity_filtri-temporali-report-ia-interna.md`
- Cosa: UI overview clone-safe del sottosistema IA / Lookup mezzi e autisti reali read-only
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-13 — Report combinato IA interna
- File principali: `docs/continuity-reports/2026-03-13_1304_continuity_report-combinato-ia-interna.md`
- Cosa: UI clone del sottosistema IA interno / facade read-only per report targa e report autista
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-13 — Report combinato mezzo + autista + periodo IA interna
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiTypes.ts`; `src/next/internal-ai/internalAiTracking.ts`; `src/next/internal-ai/internalAiMockRepository.ts`; `src/next/internal-ai/internalAiChatOrchestrator.ts`
- Cosa: Aggiungere nel sottosistema IA interna del clone una preview combinata read-only che unisca mezzo reale, autista reale e periodo, mantenendo separati i report singoli e dichiarando in modo trasparente l'affidabilita del legame mezzo-autista. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-13 — Archivio intelligente artifact IA interna
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiTypes.ts`; `src/next/internal-ai/internalAiTracking.ts`; `src/next/internal-ai/internalAiMockRepository.ts`; `src/next/internal-ai/internal-ai.css`
- Cosa: Rendere consultabile e scalabile l'archivio artifact locale del sottosistema IA interno con ricerca, filtri combinabili e riapertura del report corretto. / Esteso il modello artifact locale con metadati utili a ricerca, filtri, famiglie report e riapertura retrocompatibile degli artifact gia presenti.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-13 — Fix matching rifornimenti report autista IA interna
- File principali: `src/next/internal-ai/internalAiDriverReportFacade.ts`; `docs/product/CHECKLIST_IA_INTERNA.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Correggere il collegamento read-only tra autista e rifornimenti nel report autista IA interno, evitando omissioni strutturali dei rifornimenti recenti. / Esteso il perimetro di lettura anche ai mezzi osservati per lo stesso autista in sessioni, alert e focus del layer D10.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-13 — Fix rifornimenti report autista IA interna
- File principali: `docs/continuity-reports/2026-03-13_1435_continuity_fix-rifornimenti-report-autista-ia-interna.md`
- Cosa: lookup autista reale / report autista read-only
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-13 — Audit strutturale dati IA interna
- File principali: `docs/continuity-reports/2026-03-13_1448_continuity_audit-strutturale-dati-ia.md`
- Cosa: report mezzo read-only / report autista read-only
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-13 — Audit strutturale lettura/incrocio dati IA interna
- File principali: `src/next/internal-ai/internalAiChatOrchestrator.ts`; `docs/product/CHECKLIST_IA_INTERNA.md`; `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Eseguire un audit strutturale dei facade IA interni e correggere solo eventuali bug piccoli, evidenti e sicuri emersi durante l'analisi. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-13 — Matching autista badge-first cross-layer
- File principali: `src/next/internal-ai/internalAiDriverIdentity.ts`; `src/next/internal-ai/internalAiDriverLookup.ts`; `src/next/internal-ai/internalAiDriverReportFacade.ts`; `src/next/internal-ai/internalAiCombinedReportFacade.ts`; `docs/product/CHECKLIST_IA_INTERNA.md`
- Cosa: Correggere in modo strutturale il matching identita autista nel sottosistema IA interno, dando priorita al badge tra D01, D04 e D10 e riducendo i match fragili basati solo sul nome. / Riallineato il lookup autista:
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-13 — Audit e rafforzamento report mezzo IA interno
- File principali: `src/next/internal-ai/internalAiVehicleReportFacade.ts`; `docs/product/CHECKLIST_IA_INTERNA.md`; `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Verificare in modo strutturale il `report targa` read-only del sottosistema IA interno, individuare i punti deboli reali sui blocchi mezzo e correggere solo bug piccoli e sicuri emersi dall'audit. / Punto aperto collegato?
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-13 — Audit e rafforzamento blocco gomme report mezzo IA interno
- File principali: `src/next/domain/nextManutenzioniGommeDomain.ts`; `src/next/domain/nextDossierMezzoDomain.ts`; `src/next/internal-ai/internalAiVehicleReportFacade.ts`; `docs/product/CHECKLIST_IA_INTERNA.md`; `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- Cosa: Verificare le fonti gomme reali gia presenti nel repo e rafforzare il blocco `Gomme` del `report targa` IA interno senza introdurre collegamenti inventati o scritture business. / Punto aperto collegato?
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-13 — Audit e rafforzamento strutturale blocco materiali report mezzo IA interno
- File principali: `src/next/domain/nextMaterialiMovimentiDomain.ts`; `src/next/domain/nextDossierMezzoDomain.ts`; `src/next/internal-ai/internalAiVehicleReportFacade.ts`; `docs/product/CHECKLIST_IA_INTERNA.md`; `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- Cosa: Auditare e rendere piu trasparente il blocco `MATERIALI / MOVIMENTI` del report mezzo IA interno, mantenendo il perimetro clone-safe `read-only` e senza introdurre matching non dimostrati. / Rafforzato il dominio materiali del clone per distinguere match mezzo/materiale `forti` e `plausibili`, lasciando fuori i collegamenti non dimostrabili o conflittuali.
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-13 — Materiali report mezzo IA interno
- File principali: `docs/continuity-reports/2026-03-13_1740_continuity_materiali-report-mezzo-ia.md`
- Cosa: Lettura read-only di `@materialiconsegnati` nel layer clone dedicato. / Aggregazione materiali nel dossier clone e nel report mezzo IA interno.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-13 — Audit e rafforzamento strutturale blocco documenti-costi report mezzo IA interno
- File principali: `src/next/domain/nextDocumentiCostiDomain.ts`; `src/next/domain/nextDossierMezzoDomain.ts`; `src/next/internal-ai/internalAiVehicleReportFacade.ts`; `docs/product/CHECKLIST_IA_INTERNA.md`; `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- Cosa: Auditare e rendere piu trasparente il blocco `DOCUMENTI / COSTI / PERIMETRO ECONOMICO` del report mezzo IA interno, mantenendo il perimetro clone-safe `read-only` e senza mescolare documenti diretti, snapshot analitici e workflow procurement. / Rafforzato il dominio documenti-costi del clone per dichiarare meglio il proprio perimetro: documenti/costi diretti si, snapshot analitico separato, procurement e approvazioni fuori layer mezzo-centrico.
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-13 — Documenti costi report mezzo IA interno
- File principali: `docs/continuity-reports/2026-03-13_1800_continuity_documenti-costi-report-mezzo-ia.md`
- Cosa: Lettura read-only di `@costiMezzo` e `@documenti_*` nel layer clone dedicato. / Supporto separato allo snapshot `@analisi_economica_mezzi` nell'aggregatore dossier clone.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-13 — Governo operativo Codex
- File principali: `docs/continuity-reports/2026-03-13_1909_continuity_governo-operativo-codex.md`
- Cosa: N/A / Rafforzato `AGENTS.md` con workflow rapido, task IA interna e formato corto dei task.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-13 — Governo operativo Codex con `AGENTS.md` fonte primaria
- File principali: `AGENTS.md`; `docs/LEGGI_PRIMA.md`; `docs/INDICE_DOCUMENTAZIONE_PROGETTO.md`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/REGOLE_LAVORO_CODEX.md`
- Cosa: Rendere `AGENTS.md` la fonte primaria delle regole operative Codex sul repo, ridurre la dipendenza da prompt lunghi ripetuti e chiarire il workflow minimo dei task futuri senza toccare runtime o logica business. / Rafforzato `AGENTS.md` con sezioni iniziali piu operative: fonte primaria, workflow rapido, regole progetto, task IA interna e formato corto dei task.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-13 — Audit funzioni IA legacy da assorbire nella nuova IA
- File principali: `docs/continuity-reports/2026-03-13_2006_continuity_audit-funzioni-ia-legacy.md`
- Cosa: Nessuna nuova feature runtime. / Solo documentazione permanente che definisce cosa il nuovo sottosistema IA deve assorbire dal legacy senza riusarne i canali a runtime.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-13 — Audit funzioni IA legacy della madre da assorbire nella nuova IA
- File principali: `docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md`; `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`; `docs/product/CHECKLIST_IA_INTERNA.md`; `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: Mappare le funzioni IA legacy realmente presenti nel repo, distinguere cio che la nuova IA interna deve assorbire da cio che deve solo rifare meglio o lasciare fuori dal perimetro iniziale, senza introdurre nuove feature o riusare runtime legacy. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-13 — Ridisegno UI sottosistema IA interna
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internal-ai.css`; `docs/product/CHECKLIST_IA_INTERNA.md`; `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: Rendere `/next/ia/interna*` piu semplice, professionale e chiaro, con chat centrale in home e preview report mezzo piu ordinata, senza toccare logica dati o backend. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-13 — UI sottosistema IA interna
- File principali: `docs/continuity-reports/2026-03-13_2034_continuity_ui-sottosistema-ia-interna.md`
- Cosa: shell UI del sottosistema IA / chat locale controllata
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-14 — Assorbimento analisi economica IA interna
- File principali: `docs/continuity-reports/2026-03-14_0012_continuity_assorbimento-analisi-economica-ia-interna.md`
- Cosa: chat locale controllata / report mezzo in anteprima
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-14 — Assorbimento iniziale analisi economica IA interna
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiEconomicAnalysisFacade.ts`; `src/next/internal-ai/internalAiTypes.ts`; `src/next/internal-ai/internalAiChatOrchestrator.ts`; `docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md`
- Cosa: Aprire il primo blocco reale di assorbimento di una capability legacy ad alta priorita nel sottosistema IA interno, scegliendo `Analisi economica mezzo` in forma preview-first, read-only e senza backend legacy canonico. / Creato un facade read-only dedicato che compone una preview economica spiegabile usando solo documenti/costi diretti gia normalizzati e lo snapshot legacy gia salvato.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-14 — Riordino UI home/preview IA interna
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internal-ai.css`; `docs/product/CHECKLIST_IA_INTERNA.md`; `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: Rendere `/next/ia/interna*` molto piu semplice, leggibile e professionale, correggendo gli errori percepiti della pagina e spostando il risultato in una preview grande separata dalla home. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-14 — Pulizia dossier-like preview IA interna
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internal-ai.css`; `docs/product/CHECKLIST_IA_INTERNA.md`; `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: Ripulire in modo deciso la UI del sottosistema IA interna, soprattutto il report/preview, riducendo rumore tecnico, note visibili subito e look da dashboard/debug. / Rafforzato il contrasto visivo e la gerarchia tra area primaria, badge e pannelli secondari.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-14 — Stabilita console e hot reload IA interna
- File principali: `src/pages/Home.tsx`; `docs/product/CHECKLIST_IA_INTERNA.md`; `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Eliminare gli errori attuali di console e hot reload collegati alla UI IA interna, senza toccare la logica dati del sottosistema. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-22 — Ripristino build merge IA interna
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiTypes.ts`; `src/next/internal-ai/internalAiVehicleReportFacade.ts`; `src/next/internal-ai/internalAiChatOrchestrator.ts`; `src/next/internal-ai/internal-ai.css`
- Cosa: Rimuovere i conflict marker residui nel subtree IA interno della NEXT e riportare il clone a uno stato compilabile. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-22 — Preview documenti IA interna
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiTypes.ts`; `src/next/internal-ai/internalAiContracts.ts`; `src/next/internal-ai/internalAiDocumentsPreviewFacade.ts`; `docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md`
- Cosa: Aprire il primo assorbimento sicuro della capability legacy `documenti IA` nel sottosistema IA interna del clone, in modalita preview-first e senza riuso runtime del backend legacy. / Aggiunto il contratto stub `documents-preview` nel catalogo del sottosistema IA interno.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-22 — Preview libretto IA interna
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiTypes.ts`; `src/next/internal-ai/internalAiContracts.ts`; `src/next/internal-ai/internalAiLibrettoPreviewFacade.ts`; `docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md`
- Cosa: Aprire il primo assorbimento sicuro della capability legacy `libretto IA` nel sottosistema IA interna del clone, in modalita preview-first e senza riuso runtime del backend legacy. / Aggiunto il contratto stub `libretto-preview` nel catalogo del sottosistema IA interno.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-22 — Scaffolding backend IA separato
- File principali: `backend/internal-ai/README.md`; `backend/internal-ai/tsconfig.json`; `backend/internal-ai/src/internalAiBackendContracts.ts`; `backend/internal-ai/src/internalAiBackendHandlers.ts`; `backend/internal-ai/src/internalAiBackendService.ts`
- Cosa: Aprire il primo scaffold del backend IA separato per la nuova IA interna, definendo il canale server-side corretto senza collegarlo ancora a provider reali o a scritture business. / Creato il nuovo perimetro `backend/internal-ai/*` come sede canonica del futuro backend server-side del sottosistema IA interno.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-22 — Ponte mock-safe documenti IA
- File principali: `docs/continuity-reports/2026-03-22_1121_continuity_ponte-backend-mock-safe-documenti-ia.md`
- Cosa: UI clone `/next/ia/interna*` con preview, artifact locale e chat controllata / Blocchi preview-first per analisi economica, documenti, libretto e preventivi
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-22 — Primo ponte mock-safe frontend-backend documenti IA
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiContracts.ts`; `src/next/internal-ai/internalAiDocumentsPreviewBridge.ts`; `backend/internal-ai/tsconfig.json`; `backend/internal-ai/src/internalAiBackendContracts.ts`
- Cosa: Collegare in modo mock-safe il frontend del sottosistema IA interna al nuovo backend IA separato, senza provider reali, senza segreti e senza scritture business, facendo transitare la capability `documents-preview`. / Creato il bridge frontend `internalAiDocumentsPreviewBridge` che instrada la richiesta verso il backend separato e ricade in modo esplicito sul facade locale se il ponte non e disponibile.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-22 — Ponte mock-safe analisi economica IA
- File principali: `docs/continuity-reports/2026-03-22_1142_continuity_ponte-backend-analisi-economica-ia.md`
- Cosa: UI clone `/next/ia/interna*` con preview, artifact locale e chat controllata / Blocchi preview-first per analisi economica, documenti, libretto e preventivi
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-22 — Secondo ponte mock-safe frontend-backend analisi economica IA
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiContracts.ts`; `src/next/internal-ai/internalAiEconomicAnalysisPreviewBridge.ts`; `backend/internal-ai/src/internalAiBackendContracts.ts`; `backend/internal-ai/src/internalAiBackendHandlers.ts`
- Cosa: Portare la capability `analisi economica preview` dal solo frontend/mock al nuovo backend IA separato, in modalita mock-safe e senza provider reali o backend legacy come canale canonico. / Creato il bridge frontend `internalAiEconomicAnalysisPreviewBridge` che instrada la richiesta verso il backend separato e ricade in modo esplicito sul facade locale se il ponte non e disponibile.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-22 — Ponti mock-safe report IA
- File principali: `docs/continuity-reports/2026-03-22_1214_continuity_ponte-backend-report-ia.md`
- Cosa: UI clone `/next/ia/interna*` con preview, artifact locale e chat controllata / Blocchi preview-first per report, analisi economica, documenti, libretto e preventivi
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-22 — Quinto, sesto e settimo ponte mock-safe frontend-backend report IA
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiContracts.ts`; `src/next/internal-ai/internalAiVehicleReportPreviewBridge.ts`; `src/next/internal-ai/internalAiDriverReportPreviewBridge.ts`; `src/next/internal-ai/internalAiCombinedReportPreviewBridge.ts`
- Cosa: Portare insieme le capability `report targa`, `report autista` e `report combinato` dal solo frontend/mock al nuovo backend IA separato, in modalita mock-safe e senza provider reali o backend legacy come canale canonico. / Aggiornata la pagina `/next/ia/interna` per mostrare il canale attivo dei tre report e riallineato il catalogo contratti IA interni.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-22 — Ottavo ponte mock-safe frontend-backend chat IA interna
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiContracts.ts`; `src/next/internal-ai/internalAiChatOrchestratorBridge.ts`; `backend/internal-ai/src/internalAiBackendContracts.ts`; `backend/internal-ai/src/internalAiBackendHandlers.ts`
- Cosa: Portare la chat interna del sottosistema IA su orchestrazione backend-first mock-safe, senza provider reali, senza segreti e senza scritture business. / Aggiunto nel backend IA separato il nuovo endpoint mock-safe `orchestrator.chat` per la chat interna.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-22 — Ponte mock-safe chat IA
- File principali: `docs/continuity-reports/2026-03-22_1229_continuity_ponte-backend-chat-ia.md`
- Cosa: UI clone `/next/ia/interna*` con chat controllata, preview, report e artifact locale / Backend IA separato scaffoldato in `backend/internal-ai/*
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-22 — Backend IA separato
- File principali: `docs/continuity-reports/2026-03-22_1255_continuity_adapter-server-side-persistenza-ia-dedicata.md`
- Cosa: ponti preview/chat verso backend IA separato mock-safe / adapter server-side reale ma locale
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-22 — Primo adapter server-side e persistenza IA dedicata
- File principali: `backend/internal-ai/README.md`; `backend/internal-ai/server/internal-ai-adapter.js`; `backend/internal-ai/server/internal-ai-persistence.js`; `backend/internal-ai/runtime-data/.gitignore`; `backend/internal-ai/runtime-data/.gitkeep`
- Cosa: portare il sottosistema IA interna dal solo backend mock-safe in-process a un primo adapter server-side reale, mantenendo fallback locale e senza aprire provider reali o scritture business / aperto un adapter HTTP locale reale e separato per il backend IA interno su `backend/internal-ai/server/internal-ai-adapter.js
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-22 — Primo retrieval server-side read-only IA
- File principali: `backend/internal-ai/README.md`; `backend/internal-ai/server/internal-ai-adapter.js`; `backend/internal-ai/server/internal-ai-persistence.js`; `backend/internal-ai/src/internalAiBackendContracts.ts`; `backend/internal-ai/src/internalAiBackendHandlers.ts`
- Cosa: aprire il primo retrieval server-side controllato del backend IA separato, in sola lettura e senza usare backend legacy, provider reali o scritture business / aperto l'endpoint `POST /internal-ai-backend/retrieval/read` sull'adapter server-side locale del backend IA separato
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-22 — 2026-03-22 13:49
- File principali: `docs/change-reports/2026-03-22_1349_provider-reale-preview-approval-rollback-ia.md`; `docs/continuity-reports/2026-03-22_1349_continuity_provider-reale-preview-approval-rollback-ia.md`
- Cosa: Aprire il primo collegamento a un provider reale lato server per la nuova IA interna e introdurre un workflow reale ma controllato di preview, approvazione, rifiuto e rollback, senza scritture business automatiche. / Esteso l'adapter `backend/internal-ai/server/internal-ai-adapter.js` con:
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-22 — Backend IA separato / Provider OpenAI
- File principali: `docs/continuity-reports/2026-03-22_1445_continuity_openai-end-to-end-backend-next-ia.md`
- Cosa: UI clone `/next/ia/interna* / bridge frontend verso adapter server-side
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-22 — Verifica end-to-end reale OpenAI nel backend IA della NEXT
- File principali: `backend/internal-ai/README.md`; `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`; `docs/product/CHECKLIST_IA_INTERNA.md`; `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: Registrare l'attivazione reale di OpenAI nel backend IA separato della NEXT e l'esito del primo test end-to-end sul workflow gia aperto di preview, approvazione, rifiuto e rollback. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-22 — Chat reale controllata e repo/UI understanding IA interna
- File principali: `backend/internal-ai/README.md`; `backend/internal-ai/server/internal-ai-adapter.js`; `backend/internal-ai/server/internal-ai-repo-understanding.js`; `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiChatOrchestrator.ts`
- Cosa: Estendere l'uso reale di OpenAI dalla sola sintesi report alla chat interna controllata della nuova IA e aprire un primo livello read-only di comprensione repository/UI, senza scritture business e senza backend legacy canonici. / Aperto il primo retrieval read-only di comprensione repository/UI tramite snapshot curata `read_repo_understanding_snapshot`.
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-22 — Chat reale e repo understanding IA interna
- File principali: `docs/continuity-reports/2026-03-22_1533_continuity_chat-reale-repo-understanding-ia.md`
- Cosa: Chat interna backend-first con provider reale server-side controllato. / Retrieval repo/UI read-only e curato.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-22 — Audit repo understanding esteso e readiness Firebase IA
- File principali: `backend/internal-ai/server/internal-ai-repo-understanding.js`; `backend/internal-ai/server/internal-ai-adapter.js`; `backend/internal-ai/server/internal-ai-persistence.js`; `backend/internal-ai/src/internalAiServerRetrievalContracts.ts`; `src/next/NextInternalAiPage.tsx`
- Cosa: verificare cosa manca davvero per far leggere alla nuova IA piu codice, CSS e UI del repo e chiarire, senza inventare, se Firestore/Storage read-only lato server siano gia apribili nel backend IA separato. / CHANGE REPORT - Audit repo understanding esteso e readiness Firebase IA
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-22 — IA interna / repo understanding / readiness Firebase
- File principali: `docs/continuity-reports/2026-03-22_1711_continuity_audit-repo-readiness-firebase-ia.md`
- Cosa: chat reale controllata lato server / overview IA con pannello repo/UI
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-22 — Chat conversazionale controllata e report come artifact documento
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internal-ai.css`; `docs/product/CHECKLIST_IA_INTERNA.md`; `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: trasformare `/next/ia/interna` da pannello tecnico a esperienza conversazionale piu chiara e usabile, mantenendo i guard rail esistenti e spostando i report strutturati su artifact/modale documento dedicata. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-22 — IA interna / chat conversazionale / artifact documento
- File principali: `docs/continuity-reports/2026-03-22_1834_continuity_chat-conversazionale-artifact-preview-ia.md`
- Cosa: chat backend-first controllata / artifact IA dedicati
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-22 — Readiness Firebase read-only IA interna
- File principali: `docs/continuity-reports/2026-03-22_1922_continuity_readiness-firebase-readonly-ia.md`
- Cosa: firebase-admin` e governato solo nei runtime legacy `functions/*` e `functions-schede/*`, non dal backend IA separato root. / backend/internal-ai` non ha ancora un proprio `package.json`.
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-22 — Readiness Firebase read-only tipizzata per IA interna
- File principali: `backend/internal-ai/server/internal-ai-firebase-readiness.js`; `backend/internal-ai/server/internal-ai-repo-understanding.js`; `backend/internal-ai/src/internalAiServerRetrievalContracts.ts`; `src/next/NextInternalAiPage.tsx`; `docs/product/CHECKLIST_IA_INTERNA.md`
- Cosa: verificare se il backend IA separato possa gia aprire Firestore/Storage read-only in modo sicuro e, non essendo ancora dimostrabile, rendere espliciti prerequisiti e whitelist candidate senza attivare letture business. / Punto aperto collegato?
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-22 — Report IA in anteprima PDF reale + governance readiness backend IA
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiReportPdf.ts`; `src/next/internal-ai/internal-ai.css`; `backend/internal-ai/package.json`; `backend/internal-ai/README.md`
- Cosa: chiudere il flusso report della nuova IA interna come output separato dalla chat con una anteprima PDF reale nel perimetro IA, e preparare meglio i prerequisiti del futuro bridge Firebase/Storage read-only senza attivarlo. / Punto aperto collegato?
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-22 — Report PDF reale IA + readiness backend IA
- File principali: `docs/continuity-reports/2026-03-22_2013_continuity_report-pdf-reale-readiness-backend-ia.md`
- Cosa: chat conversazionale controllata / artifact IA dedicati
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-22 — IA interna NEXT / observer runtime e guida integrazione
- File principali: `docs/continuity-reports/2026-03-22_2137_continuity_ui_runtime-observer-next-integration-guidance-ia.md`
- Cosa: repo understanding curato / observer runtime read-only
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-22 — Osservatore runtime NEXT passivo e guida integrazione IA
- File principali: `package.json`; `package-lock.json`; `backend/internal-ai/runtime-data/.gitignore`; `backend/internal-ai/server/internal-ai-adapter.js`; `backend/internal-ai/server/internal-ai-next-runtime-observer.js`
- Cosa: Aprire nel sottosistema IA interno una prima osservazione runtime reale ma non distruttiva della NEXT e una guida strutturale per suggerire dove integrare future funzioni nel gestionale. / Aggiunto un observer Playwright read-only per route `/next/*` whitelistate, con screenshot e DOM snapshot passivo salvati nel contenitore IA dedicato.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-22 — Hook mezzo-centrico Dossier e catalogo capability IA
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiTypes.ts`; `src/next/internal-ai/internalAiContracts.ts`; `src/next/internal-ai/internalAiChatOrchestrator.ts`; `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts`
- Cosa: Aprire il primo hook reale e stabile dell'integrazione totale IA in chiave mezzo-centrica, usando il Dossier Mezzo come nodo principale e introducendo un catalogo capability governato sopra i read model NEXT gia esistenti. / Punto aperto collegato?
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-22 — IA interna NEXT / hook mezzo-centrico Dossier
- File principali: `docs/continuity-reports/2026-03-22_2204_continuity_hook-mezzo-centrico-dossier-capability-catalog-ia.md`
- Cosa: capability chat/report governate nel perimetro mezzo-centrico / riuso del composito Dossier e dei facade clone-safe gia esistenti
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-22 — Deep runtime observer NEXT e selettore formato output IA
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiTypes.ts`; `src/next/internal-ai/internalAiOutputSelector.ts`; `src/next/internal-ai/internal-ai.css`; `backend/internal-ai/src/internalAiServerRetrievalContracts.ts`
- Cosa: Portare la nuova IA a una comprensione runtime della NEXT molto piu vicina all'utente reale, aggiungendo stati whitelist-safe e route dinamiche osservate, e introdurre una logica piu intelligente e trasparente di scelta del formato output e della proposta di integrazione. / Esteso l'osservatore runtime NEXT:
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-22 — IA interna NEXT / deep runtime observer e output selector
- File principali: `docs/continuity-reports/2026-03-22_2303_continuity_deep-runtime-observer-output-selector-next-ia.md`
- Cosa: observer runtime Playwright read-only nel backend IA separato / mappatura integrazione UI/flow/file guidata da evidenze runtime
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-23 — Estensione hook Dossier con retrieval server-side e rifornimenti
- File principali: `backend/internal-ai/README.md`; `backend/internal-ai/server/internal-ai-adapter.js`; `backend/internal-ai/server/internal-ai-persistence.js`; `backend/internal-ai/src/internalAiServerRetrievalContracts.ts`; `src/next/NextInternalAiPage.tsx`
- Cosa: Estendere il primo hook IA mezzo-centrico del clone con un retrieval server-side serio ma ancora controllato, senza aprire Firebase/Storage business live e aggiungendo una capability governata sui rifornimenti. / Esteso `retrieval.read` con un nuovo snapshot `Dossier Mezzo` clone-seeded:
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-23 — IA interna NEXT / retrieval Dossier mezzo clone-seeded
- File principali: `docs/continuity-reports/2026-03-23_0659_continuity_estensione-hook-dossier-retrieval-rifornimenti-ia.md`
- Cosa: hook mezzo-centrico governato sul Dossier / retrieval D01 clone-seeded
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-23 — Contesto operativo da riportare in nuova chat
- File principali: `docs/continuity-reports/2026-03-23_0706_continuity_agents-model-reasoning-rules.md`
- Cosa: Nessun punto aperto tecnico.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-23 — IA interna / ri-verifica bridge live Firebase Storage
- File principali: `docs/continuity-reports/2026-03-23_0909_continuity_riverifica-bridge-live-firebase-storage-ia.md`
- Cosa: retrieval server-side clone-seeded / hook mezzo-centrico Dossier
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-23 — Ri-verifica bridge live Firebase/Storage IA
- File principali: `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js`; `backend/internal-ai/server/internal-ai-firebase-readiness.js`; `backend/internal-ai/README.md`; `docs/product/CHECKLIST_IA_INTERNA.md`; `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- Cosa: verificare se il backend IA separato possa aprire davvero un primo bridge Firebase/Storage business live read-only e, se non ancora sicuro, chiudere il task con un boundary futuro esplicito e con una readiness piu onesta. / Punto aperto collegato?
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-23 — Governance package backend IA e readiness live
- File principali: `backend/internal-ai/package.json`; `backend/internal-ai/server/internal-ai-firebase-admin.js`; `backend/internal-ai/server/internal-ai-firebase-readiness.js`; `backend/internal-ai/server/internal-ai-firebase-readiness-cli.js`; `backend/internal-ai/server/internal-ai-adapter.js`
- Cosa: preparare davvero il backend IA separato a ospitare un futuro bridge Firebase/Storage read-only serio, senza aprire il live finche credenziali Google e policy restano non verificabili. / Il live bridge resta correttamente chiuso finche mancano credenziali Google server-side e policy Firestore/Storage verificabili.
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-23 — Copertura runtime UI quasi totale verificabile della NEXT
- File principali: `backend/internal-ai/server/internal-ai-next-runtime-observer.js`; `backend/internal-ai/server/internal-ai-repo-understanding.js`; `backend/internal-ai/server/internal-ai-adapter.js`; `backend/internal-ai/src/internalAiServerRetrievalContracts.ts`; `scripts/internal-ai-observe-next-runtime.mjs`
- Cosa: Portare l'osservatore runtime della nuova IA alla massima copertura UI verificabile della NEXT nel perimetro read-only, rendendo completa anche la vista compatta che arriva alla chat server-side. / Esteso il catalogo runtime NEXT a 53 route candidate con piu route annidate, dinamiche e stati interni whitelist-safe.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-23 — Runtime observer NEXT e copertura UI totale verificabile
- File principali: `docs/continuity-reports/2026-03-23_1249_continuity_runtime-observer-next-total-ui-coverage.md`
- Cosa: observer runtime Playwright governato e passivo / snapshot repo/UI server-side controllata
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-23 — Chiusura gap runtime Prompt 59 observer NEXT
- File principali: `backend/internal-ai/server/internal-ai-next-runtime-observer.js`; `scripts/internal-ai-observe-next-runtime.mjs`; `scripts/internal-ai-observe-next-gap59.mjs`; `docs/product/CHECKLIST_IA_INTERNA.md`; `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- Cosa: Chiudere i gap residui del Prompt 59 del runtime observer NEXT, aggiornando solo i probe read-only e la documentazione, senza toccare la madre e senza forzare controlli bloccati dal clone. / Aggiunto uno script dedicato al micro-refresh dei soli gap del Prompt 59.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-23 — Backend IA / credenziali Firebase server-side
- File principali: `docs/continuity-reports/2026-03-23_1832_continuity_backend-ia-firebase-service-account-readiness.md`
- Cosa: package backend IA dedicato / bootstrap Firebase Admin separato
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-23 — Supporto FIREBASE_SERVICE_ACCOUNT_JSON nel backend IA
- File principali: `backend/internal-ai/server/internal-ai-firebase-admin.js`; `backend/internal-ai/server/internal-ai-firebase-readiness.js`; `backend/internal-ai/src/internalAiServerPersistenceContracts.ts`; `backend/internal-ai/README.md`; `docs/product/CHECKLIST_IA_INTERNA.md`
- Cosa: completare il supporto server-side ai canali credenziali Firebase Admin del backend IA separato e verificare in modo onesto se il primo bridge live read-only sia davvero apribile. / Esteso il backend IA separato a riconoscere anche `FIREBASE_SERVICE_ACCOUNT_JSON`, oltre a `GOOGLE_APPLICATION_CREDENTIALS` e `FIREBASE_CONFIG`.
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-23 — Reality check live minimo IA read-only
- File principali: `package.json`; `package-lock.json`; `docs/product/CHECKLIST_IA_INTERNA.md`; `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: verificare in modo definitivo se il backend IA separato possa aprire davvero il primo bridge live read-only minimo su `storage/@mezzi_aziendali` e sul path esatto `librettoStoragePath`, oppure fermarsi in modo onesto sul fallback clone-seeded. / Confermato che il fallback ufficiale resta il retrieval clone-seeded del `mezzo_dossier`; nessun live Firestore/Storage viene aperto.
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-23 — Verifica finale live minimo Firebase/Storage IA
- File principali: `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/CHECKLIST_IA_INTERNA.md`; `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: chiudere in modo definitivo se il primo live minimo read-only della nuova IA interna sia davvero apribile oggi sul solo perimetro `storage/@mezzi_aziendali` + `librettoStoragePath`, senza simulare credenziali o bridge non reali. / backend IA separato
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-23 — IA interna chat-first
- File principali: `docs/continuity-reports/2026-03-23_2211_continuity_reset-chat-ia-interna-stile-chatgpt.md`
- Cosa: Chat principale unica stile ChatGPT. / Wiring memoria repo/UI/runtime piu esplicito e usabile.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-23 — Reset chat IA interna stile ChatGPT
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiTypes.ts`; `src/next/internal-ai/internalAiChatAttachmentsClient.ts`; `src/next/internal-ai/internalAiChatOrchestrator.ts`; `src/next/internal-ai/internalAiChatOrchestratorBridge.ts`
- Cosa: Trasformare `/next/ia/interna` in una chat unica usabile, con memoria repo/UI attiva nelle richieste libere quando disponibile, allegati IA-only nello stesso composer e pannelli tecnici secondari. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-24 — V1 chat IA focalizzata
- File principali: `docs/continuity-reports/2026-03-24_0631_continuity_v1-chat-home-report-file-map.md`
- Cosa: Chat unica centrale gia presente dal reset precedente. / Focalizzazione V1 su Home / report targa / file map.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-24 — V1 chat IA Home / report targa / file map
- File principali: `src/next/internal-ai/internalAiChatOrchestrator.ts`; `src/next/internal-ai/internalAiOutputSelector.ts`; `src/next/NextInternalAiPage.tsx`; `docs/product/CHECKLIST_IA_INTERNA.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: Rendere affidabile e chiara la chat IA interna per tre use case V1: / analisi Home;
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-24 — Chat IA prima verticale
- File principali: `docs/continuity-reports/2026-03-24_0810_continuity_consolidamento-prima-verticale-chat-ia.md`
- Cosa: UI chat principale / Lettura dati read-only
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-24 — Consolidamento prima verticale chat IA
- File principali: `src/next/internal-ai/internalAiChatOrchestrator.ts`; `src/next/internal-ai/internalAiOutputSelector.ts`; `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts`; `src/next/internal-ai/internalAiVehicleDossierHookFacade.ts`; `src/next/internal-ai/internalAiVehicleReportFacade.ts`
- Cosa: Consolidare la chat IA interna solo sulla prima verticale `D01 + D10 + D02`, rendendo piu coerenti intenti, reader canonici, output e limiti nel thread. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-24 — Classificazione domini chat IA
- File principali: `src/next/internal-ai/internalAiChatOrchestrator.ts`; `src/next/internal-ai/internalAiOutputSelector.ts`; `src/next/NextInternalAiPage.tsx`; `docs/product/CHECKLIST_IA_INTERNA.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: Rendere `/next/ia/interna` capace di riconoscere il dominio corretto della richiesta, mantenere forte la prima verticale `D01 + D10 + D02` e rispondere in modo utile ma prudente sugli altri domini del gestionale. / Riallineato il selettore output per usare `chat_structured` prudente sui domini non consolidati, invece di una semplice risposta breve di rifiuto.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-24 — Capability canonica stato operativo mezzo
- File principali: `src/next/internal-ai/internalAiChatOrchestrator.ts`; `src/next/internal-ai/internalAiOutputSelector.ts`; `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts`; `src/next/NextInternalAiPage.tsx`; `docs/product/CHECKLIST_IA_INTERNA.md`
- Cosa: Introdurre e rendere prioritaria la capability clone-only `stato_operativo_mezzo`, usando solo `D01 + D10 + D02` come fonti canoniche e mantenendo il `report targa` come percorso distinto e secondario. / Punto aperto collegato?
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-24 — Unified Intelligence Engine e console unica
- File principali: `src/next/domain/nextUnifiedReadRegistryDomain.ts`; `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`; `src/next/internal-ai/internalAiChatOrchestrator.ts`; `src/next/internal-ai/internalAiChatOrchestratorBridge.ts`; `src/next/internal-ai/internalAiOutputSelector.ts`
- Cosa: Riprendere una patch interrotta sul worktree locale e chiudere il motore unificato read-only della IA interna NEXT, senza rifare da zero il lavoro gia coerente. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-24 — Report unificato professionale e PDF aziendale
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`; `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`; `src/next/internal-ai/internalAiReportPdf.ts`; `src/next/internal-ai/internal-ai.css`
- Cosa: Rifare solo il layer output/rendering del report unificato della console IA NEXT, senza riaprire il motore di lettura/incrocio e senza toccare la madre. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-24 — 2026-03-24 15:30
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internal-ai.css`; `docs/product/CHECKLIST_IA_INTERNA.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Riprendere il task interrotto di pulizia della pagina `/next/ia/interna`, mantenendo intatto il motore unificato e lavorando solo sul layer visivo/usabilita. / Spostato lo scaffolding tecnico preesistente in una sezione avanzata collassata, senza eliminarlo dal file.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-24 — 2026-03-24 16:03
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internal-ai.css`; `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`; `src/utils/pdfEngine.ts`; `docs/product/CHECKLIST_IA_INTERNA.md`
- Cosa: Ridurre ancora il rumore visivo della pagina `/next/ia/interna` e rendere piu leggibili il report professionale e il PDF, senza toccare il motore unificato. / Spostato `Richieste rapide` dentro il composer, insieme a `Targa` e `Output`.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-24 — 2026-03-24 17:02
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`; `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`; `src/utils/pdfEngine.ts`; `docs/product/CHECKLIST_IA_INTERNA.md`
- Cosa: Chiudere la rifinitura finale della console IA NEXT lasciando nel primo piano quasi solo chat + filtri rapidi + report a destra, togliendo la tecnica dal report utente e correggendo la resa gomme per asse intero, lato e gomma singola. / Task chiuso.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-24 — Console IA NEXT
- File principali: `docs/continuity-reports/2026-03-24_1812_continuity_pulizia-finale-primo-piano-chat-ia-next.md`
- Cosa: UI overview chat / lettura dati read-only gia esistente
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-24 — Pulizia finale primo piano chat IA NEXT
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internal-ai.css`; `docs/product/CHECKLIST_IA_INTERNA.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Ridurre `/next/ia/interna` alla forma minima utile nel primo piano: solo chat/composer al centro e report a destra, senza welcome o riassunti automatici. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-24 — Console IA gestionale NEXT
- File principali: `docs/continuity-reports/2026-03-24_2235_continuity_cervello-gestionale-console-ia-next.md`
- Cosa: console unica `/next/ia/interna / unified intelligence engine read-only con registry globale, entity linking e preview report/PDF
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-24 — Planner gestionale e composer business-first della console IA NEXT
- File principali: `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`; `src/next/internal-ai/internalAiChatOrchestrator.ts`; `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts`; `src/next/NextInternalAiPage.tsx`; `docs/product/CHECKLIST_IA_INTERNA.md`
- Cosa: completare il layer interpretativo/orchestrativo sopra il motore unificato gia esistente, senza rifare UI, backend o renderer PDF. / aggiunto request understanding robusto con parsing di intento business, periodo, metriche, filtri console e output finale.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-25 — Affidabilita rifornimenti periodo + report/PDF IA NEXT
- File principali: `src/next/internal-ai/internalAiChatOrchestrator.ts`; `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`; `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`; `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`; `src/next/NextInternalAiPage.tsx`
- Cosa: chiudere il rischio di report rifornimenti apparentemente corretti ma costruiti sul periodo sbagliato o su calcoli km/l non affidabili, migliorando anche leggibilita chat e PDF. / parsing periodo esteso a `questo mese`, `oggi`, `questa settimana`, `prossimi 30 giorni`, mesi espliciti e intervalli personalizzati.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-25 — IA interna NEXT / affidabilita rifornimenti
- File principali: `docs/continuity-reports/2026-03-25_0000_continuity_affidabilita-rifornimenti-periodo-pdf-ia-next.md`
- Cosa: console IA unica / motore unificato read-only
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-25 — IA interna NEXT / planner multi-dominio
- File principali: `docs/continuity-reports/2026-03-25_0627_continuity_planner-multi-dominio-regressione-prompt-reali-ia-next.md`
- Cosa: console IA unica / motore unificato read-only
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-25 — Planner multi-dominio e regressione prompt reali IA NEXT
- File principali: `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`; `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts`; `src/next/NextInternalAiPage.tsx`; `docs/product/CHECKLIST_IA_INTERNA.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: blindare il planner della console `/next/ia/interna` per richieste umane ampie, trasversali, orientate ad azione e top-N, senza rifare il motore unificato o la UI. / esteso il request understanding con `rankingLimit`, richiesta di ordinamento/priorita, azione consigliata e segnali multi-dominio.
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-25 — Affidabilita D04 e modello unico di fiducia IA NEXT
- File principali: `src/next/domain/nextRifornimentiDomain.ts`; `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`; `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`; `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`; `src/next/NextInternalAiPage.tsx`
- Cosa: chiudere il punto piu delicato della fiducia del dato sul dominio rifornimenti `D04` e rendere coerente il concetto di affidabilita tra chat, report professionale, modale e PDF. / contratto read-only del layer `D04` esteso con metadati di trust per record e snapshot rifornimenti
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-25 — IA interna NEXT / affidabilita D04 e fiducia unificata
- File principali: `docs/continuity-reports/2026-03-25_0655_continuity_affidabilita-d04-modello-unico-fiducia-ia-next.md`
- Cosa: console IA unica / planner multi-dominio
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-25 — IA interna NEXT / priority engine operativo flotta
- File principali: `docs/continuity-reports/2026-03-25_0737_continuity_priority-engine-operativo-flotta-ia-next.md`
- Cosa: planner multi-dominio / fiducia unificata D04 su fuel
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-25 — Priority engine operativo flotta IA NEXT
- File principali: `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`; `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts`; `src/next/NextInternalAiPage.tsx`; `docs/product/CHECKLIST_IA_INTERNA.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: trasformare la console `/next/ia/interna` in un assistente operativo piu stabile sulle richieste flotta, con classifica priorita spiegabile, top-N deterministico e azione consigliata. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-25 — Quadro mezzo e output IA NEXT
- File principali: `docs/continuity-reports/2026-03-25_1028_continuity_quadro-mezzo-utile-output-allineati-ia-next.md`
- Cosa: UI console IA clone-safe / lettura dati read-only dal motore unificato
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-25 — Quadro mezzo utile e output allineati IA NEXT
- File principali: `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`; `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`; `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`; `src/next/NextInternalAiPage.tsx`; `docs/product/CHECKLIST_IA_INTERNA.md`
- Cosa: Rendere il quadro completo mezzo davvero decisionale e riallineare chat, report, modale e PDF sullo stesso payload business verificato. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-25 — Estensione realistica costi-documenti-report decisionali IA NEXT
- File principali: `src/next/domain/nextDocumentiCostiDomain.ts`; `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`; `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`; `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`; `src/next/NextInternalAiPage.tsx`
- Cosa: Aprire in modo realistico `D07/D08` per costi, documenti e storico utile del mezzo, rispettando il periodo richiesto e senza fingere copertura piena dove il dato resta parziale. / esteso il contratto read-only del layer `D07/D08` con una vista period-aware business-first per la targa
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-25 — Assistente repo, flussi e integrazione per sviluppo interno
- File principali: `backend/internal-ai/server/internal-ai-repo-understanding.js`; `backend/internal-ai/server/internal-ai-adapter.js`; `src/next/internal-ai/internalAiChatOrchestrator.ts`; `src/next/internal-ai/internalAiOutputSelector.ts`; `src/next/NextInternalAiPage.tsx`
- Cosa: rafforzare la IA interna NEXT come assistente tecnico interno su repo, flussi reali, moduli collegati, file impattati e punto corretto di integrazione di nuovi moduli o capability IA. / esteso il repo understanding server-side con layer architetturali espliciti e playbook operativi su flussi, impatti e integrazione;
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-25 — IA interna NEXT / repo-flussi-integrazione
- File principali: `docs/continuity-reports/2026-03-25_1545_continuity_assistente-repo-flussi-sviluppo-interno-ia-next.md`
- Cosa: UI chat unica `/next/ia/interna / backend IA separato read-only
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-25 — D03 autisti canonico read-only per NEXT e IA interna
- File principali: `src/next/domain/nextAutistiDomain.ts`; `src/next/domain/nextStatoOperativoDomain.ts`; `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`; `src/next/internal-ai/internalAiChatOrchestrator.ts`; `src/next/NextInternalAiPage.tsx`
- Cosa: chiudere `D03` come dominio autisti canonico read-only per NEXT e IA interna, separando in modo chiaro fonti madre, fallback legacy e flusso locale clone autisti. / creato `nextAutistiDomain` come snapshot read-only D03 che unisce sessioni attive, storico eventi operativi, segnalazioni, controlli, richieste attrezzature, fallback `autisti_eventi` e contesto locale clone;
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-26 — 2026-03-26 09:37
- File principali: `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js`; `backend/internal-ai/server/internal-ai-firebase-readiness.js`; `backend/internal-ai/server/internal-ai-adapter.js`; `backend/internal-ai/server/internal-ai-repo-understanding.js`; `src/next/internal-ai/internalAiChatOrchestrator.ts`
- Cosa: Chiudere in modo definitivo il confine tra IA interna NEXT, backend IA separato, letture clone/read-only gia esistenti ed eventuale live-read business, uscendo dal limbo con un verdetto binario verificato. / Confine live-read backend IA chiuso per NEXT e IA interna
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-26 — 2026-03-26 11:12
- File principali: `src/next/NextCentroControlloPage.tsx`; `src/next/NextCentroControlloClonePage.tsx`; `src/next/NextOperativitaGlobalePage.tsx`; `src/next/NextCapoCostiMezzoPage.tsx`; `src/next/NextInternalAiPage.tsx`
- Cosa: Chiudere il work-package CTA senza rifarlo da zero: rendere veritiere CTA, bottoni, azioni e punti di ingresso gia presenti nel clone NEXT, lasciando attiva solo la consultazione reale e marcando in modo esplicito cio che e `read-only`, `preview`, `locale clone` o `bloccato`. / Processo: il Prompt 19 viene chiuso davvero senza allargarsi oltre lo sweep CTA.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-26 — Dependency map repo per IA interna NEXT
- File principali: `backend/internal-ai/server/internal-ai-repo-understanding.js`; `backend/internal-ai/server/internal-ai-adapter.js`; `src/next/internal-ai/internalAiChatOrchestrator.ts`; `src/next/internal-ai/internalAiContracts.ts`; `src/next/NextInternalAiPage.tsx`
- Cosa: rafforzare l'assistente `repo/flussi` della IA interna NEXT con una dependency map piu strutturale, cosi da rispondere meglio su file impattati, moduli collegati, route, layer, read model e punto corretto di integrazione. / riallineato il fallback locale dell'orchestratore sui prompt repo/flussi principali, cosi la struttura pratica resta coerente anche senza provider o adapter attivo;
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-26 — IA interna NEXT / dependency map repo
- File principali: `docs/continuity-reports/2026-03-26_1311_continuity_dependency-map-repo-ia-next.md`
- Cosa: snapshot repo/UI curata server-side / risposta deterministica `repo_understanding
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-26 — Base universale IA clone/NEXT
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiChatOrchestratorBridge.ts`; `src/next/internal-ai/InternalAiUniversalWorkbench.tsx`; `src/next/internal-ai/internalAiUniversalComposer.ts`; `src/next/internal-ai/internalAiUniversalContracts.ts`
- Cosa: costruire la base reale del sistema universale chat/IA nel clone/NEXT, con registry totale, resolver, orchestrator, router documenti, riuso capability gia deployate e tracciabilita documentale coerente / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-26 — Gateway universale IA interna NEXT
- File principali: `docs/continuity-reports/2026-03-26_2015_continuity_prompt25_handoff-inbox-universale.md`
- Cosa: shell e runtime IA interna / lettura dati clone-safe
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-26 — Prompt 25 handoff e inbox universale
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internalAiChatOrchestratorBridge.ts`; `src/next/internal-ai/InternalAiUniversalWorkbench.tsx`; `src/next/internal-ai/InternalAiUniversalRequestsPanel.tsx`; `src/next/internal-ai/internalAiUniversalConformance.ts`
- Cosa: chiudere i gap operativi residui del gateway universale NEXT introducendo handoff standard, prefill canonico, inbox documentale universale, enforcement runtime per moduli futuri e scenari E2E tracciabili / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-26 — Chiusura finale consumer iaHandoff NEXT
- File principali: `src/next/NextAcquistiPage.tsx`; `src/next/NextOrdiniInAttesaPage.tsx`; `src/next/NextOrdiniArrivatiPage.tsx`; `src/next/NextDettaglioOrdinePage.tsx`; `src/next/NextProcurementReadOnlyPanel.tsx`
- Cosa: chiudere il perimetro operativo corrente della chat/IA universale del clone/NEXT portando i moduli target al consumo reale di `iaHandoff`, con prefill UI e stato consumo tracciato / aggiunto consumer standard riusabile nei moduli target del clone con validazione payload, banner UI e prefill reale
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-26 — IA universale clone/NEXT
- File principali: `docs/continuity-reports/2026-03-26_2240_continuity_prompt27_chiusura-finale-handoff-next.md`
- Cosa: gateway universale, registry, resolver, orchestrator, inbox documentale, conformance gate / consumer handoff reali su procurement, inventario/materiali, mezzi/dossier, IA libretto/documenti, libretti export, cisterna IA, autisti inbox/admin
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-29 — Audit parita clone/NEXT vs madre
- File principali: `docs/continuity-reports/2026-03-29_1024_continuity_audit-parita-clone-next-vs-madre.md`
- Cosa: Shell e routing `/next/* / Cloni read-only wrapperizzati di molte pagine madre
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-29 — 2026-03-29 1149 - Prompt 34 chiusura residui clone NEXT
- File principali: `src/next/domain/nextIaConfigDomain.ts`; `src/next/NextDossierListaPage.tsx`; `src/next/NextColleghiPage.tsx`; `src/next/NextFornitoriPage.tsx`; `src/next/NextIntelligenzaArtificialePage.tsx`
- Cosa: Chiudere altre superfici residue del clone/NEXT usando solo `src/next/*`, portandole a UI madre-like sopra readers/domain NEXT puliti e senza toccare la madre. / Creato `nextIaConfigDomain` come reader clone-safe per `@impostazioni_app/gemini`.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — `IA Home` loop audit
- File principali: `docs/change-reports/2026-03-31_1030_ia-home_loop_audit.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — `IA Libretto` loop stop
- File principali: `docs/change-reports/2026-03-31_1030_ia-libretto_loop_stop.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — Home NEXT top area semplificata
- File principali: `docs/change-reports/2026-04-01_0920_home-next-top-area-alert-revisioni-ia-interna.md`; `docs/continuity-reports/2026-04-01_0920_continuity_home-next-top-area-alert-revisioni-ia-interna.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — Home NEXT con chat IA interna montata
- File principali: `docs/change-reports/2026-04-01_0932_home-next-embedded-internal-ai-surface.md`; `docs/continuity-reports/2026-04-01_0932_continuity_home-next-embedded-internal-ai-surface.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — Home NEXT con launcher IA compatto e modale operativo
- File principali: `docs/change-reports/2026-04-01_1046_home-next-ia-launcher-compatta-modale-operativo.md`; `docs/continuity-reports/2026-04-01_1046_continuity_home-next-ia-launcher-compatta-modale-operativo.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — 2026-04-01 11:45
- File principali: `docs/continuity-reports/2026-04-01_1145_continuity_home-next-ia-modal-layout-viewport-safe.md`
- Cosa: La pagina sottostante resta bloccata mentre il modale è aperto.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — 2026-04-01 12:10
- File principali: `src/next/components/HomeInternalAiLauncher.tsx`; `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internal-ai.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — 2026-04-01 17:15
- File principali: `docs/continuity-reports/2026-04-01_1715_continuity_home-next-navigazione-rapida-hub-unico.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — 2026-04-01 18:15
- File principali: `src/next/NextCentroControlloPage.tsx`; `src/next/components/QuickNavigationCard.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Menu completo spostato in overlay full-screen con blocco scroll pagina e una sola sezione aperta per volta.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — 2026-04-01 18:35
- File principali: `src/next/NextCentroControlloPage.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — Audit Home Flussi Moduli Ingressi
- File principali: `docs/continuity-reports/2026-04-01_2015_continuity_audit_home_flussi_moduli_ingressi.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-04-01 — Audit censimento completo moduli gestionale
- File principali: `docs/continuity-reports/2026-04-01_2100_continuity_audit_censimento_completo_moduli_gestionale.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-04-01 — 2026-04-01 22:30
- File principali: `src/next/NextCentroControlloPage.tsx`; `src/next/components/QuickNavigationCard.tsx`; `src/next/NextGestioneOperativaPage.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Applicare in un solo intervento la nuova architettura UI concordata tra Home, `Navigazione rapida` e `Gestione Operativa` nel perimetro NEXT. / dataset della `Navigazione rapida` riallineato alle sole famiglie fuori da `Gestione Operativa`.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — 2026-04-01 22:45
- File principali: `docs/continuity-reports/2026-04-01_2245_continuity_home-next-ripristino-accesso-gestione-operativa.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-03 — 2026-04-03 14:48 - Next Home UI placeholder layout
- File principali: `docs/change-reports/2026-04-03_1448_next-home-ui-placeholder-layout.md`; `docs/continuity-reports/2026-04-03_1448_continuity_next-home-ui-placeholder-layout.md`
- Cosa: src/next/NextHomePage.tsx / src/next/next-home.css
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-03 — 2026-04-03 1815
- File principali: `src/next/NextHomePage.tsx`; `src/next/next-home.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Sostituire nella nuova Home NEXT solo i due placeholder di testata con elementi reali gia esistenti del layer NEXT, senza toccare stat card, widget, route, shell o domain.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-03 — 2026-04-03 1844
- File principali: `docs/continuity-reports/2026-04-03_1844_continuity_next-home-real-stat-cards.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-10 — CHANGE REPORT
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internal-ai.css`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Rendere chiaramente visibile sopra la chat del modale IA interna: / cosa la IA ha letto
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-10 — CONTINUITY REPORT
- File principali: `docs/continuity-reports/20260410_234600_continuity_ia_interna_modal_ui_fix_execution.md`
- Cosa: Task chiuso: fix UI del pannello classificazione/proposta nel modale IA interna / Punto raggiunto
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-11 — CHANGE REPORT
- File principali: `src/next/NextInternalAiPage.tsx`; `src/next/internal-ai/internal-ai.css`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Rifare l'impaginazione del risultato documento nel modale/chat IA interna in modo che fatture, PDF e allegati risultino leggibili come scheda gestionale, senza toccare motore di classificazione, router, writer business o barrier.
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-04-11 — CONTINUITY REPORT
- File principali: `docs/continuity-reports/20260411_003500_continuity_ia_interna_document_dossier_ui_execution.md`
- Cosa: motore di classificazione documento / router / handoff IA
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-12 — IA INTERNA DOCUMENTALE UNIFICATA
- File principali: `docs/change-reports/20260412_115351_ia_interna_documentale_unificata.md`; `docs/continuity-reports/20260412_115351_continuity_ia_interna_documentale_unificata.md`
- Cosa: src/pages/IA/IADocumenti.tsx` espone ora `useIADocumentiEngine()` e i tipi riusabili del motore reale; la pagina legacy continua a usare lo stesso motore, quindi il comportamento business del flusso legacy non viene sostituito. / /next/ia/interna` mostra ora una prima vista documentale unificata con:
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-04-12 — IA interna documentale fix entry, layout, destinazioni
- File principali: `docs/change-reports/20260412_125333_ia_interna_documentale_fix_entry_layout_destinazioni.md`; `docs/continuity-reports/20260412_125333_continuity_ia_interna_documentale_fix_entry_layout_destinazioni.md`
- Cosa: far aprire `/next/ia/interna` sempre sulla home documentale pulita; / rendere la review desktop viewport-fit senza page-scroll principale;
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-04-12 — AUDIT IA INTERNA DOCUMENTALE `HOME SPORCA` / `ANALIZZA BLOCCATO
- File principali: `docs/change-reports/20260412_133832_audit_ia_interna_stato_sporco_blocco_analizza.md`; `docs/continuity-reports/20260412_133832_continuity_audit_ia_interna_stato_sporco_blocco_analizza.md`
- Cosa: ricostruire il wiring reale di `/next/ia/interna`; / verificare se la home si apra davvero sporca nel worktree/runtime corrente;
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-12 — 2026-04-12 14:13:06
- File principali: `src/utils/cloneWriteBarrier.ts`; `docs/STATO_ATTUALE_PROGETTO.md`; `CONTEXT_CLAUDE.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Sbloccare davvero `Analizza` su `/next/ia/interna` autorizzando solo il `POST` gia esistente verso `estrazioneDocumenti`, senza widening generico del barrier e senza toccare UI, motore documentale o writer business.
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-12 — 2026-04-12 14:40:23
- File principali: `src/next/components/HomeInternalAiLauncher.tsx`; `src/next/NextHomePage.tsx`; `CONTEXT_CLAUDE.md`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: Correggere il comportamento reale del pannello `IA interna` in `/next`, eliminando il modale custom `Conversazione rapida dalla Home` e riallineando il click alla route canonica `/next/ia/interna`, senza toccare motore documentale, madre o backend. / nessuna review sporca o documento `MARIBA` aperto di default;
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-12 — AUDIT IA INTERNA STATO REALE
- File principali: `docs/audit/AUDIT_IA_INTERNA_STATO_REALE_2026-04-12.md`; `docs/change-reports/20260412_152529_audit_ia_interna_stato_reale.md`; `docs/continuity-reports/20260412_152529_continuity_audit_ia_interna_stato_reale.md`
- Cosa: Home `/next`: il launcher IA apre direttamente `/next/ia/interna`. / /next/ia/interna`: ingresso pulito senza review preaperta.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-12 — 2026-04-12 19:40:36
- File principali: `docs/change-reports/20260412_194036_ia_universal_dispatcher_ui_spec.md`; `docs/continuity-reports/20260412_194036_continuity_ia_universal_dispatcher_ui_spec.md`
- Cosa: Riallineare Home launcher, pagina `/next/ia/interna` e storico `/next/ia/documenti` alla spec `docs/product/SPEC_IA_UNIVERSAL_DISPATCHER.md` senza toccare domain, orchestrator, writer, barrier o motori legacy. / menu `+` aperto con voci corrette
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-13 — 2026-04-13 15:19:04
- File principali: `src/next/NextIADocumentiPage.tsx`; `src/next/internal-ai/internal-ai.css`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: sostituito il layout di `src/next/NextIADocumentiPage.tsx` con una vista per fornitore aderente alla spec `docs/product/SPEC_DOCUMENTI_COSTI_UI.md / mantenuta intatta la lettura read-only esistente tramite `readNextIADocumentiArchiveSnapshot()
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-14 — IA interna multi-file documento logico unico
- File principali: `docs/change-reports/20260414_165421_ia_interna_multi_file_documento_logico_unico.md`; `docs/continuity-reports/20260414_165421_continuity_ia_interna_multi_file_documento_logico_unico.md`
- Cosa: Permettere alla IA interna NEXT di ricevere 2 o piu allegati riferiti alla stessa manutenzione e produrre un solo riepilogo finale unificato, senza cambiare upload, extraction o comportamento del caso singolo. / aggiunto nel composer allegati il toggle `Tratta questi file come un unico documento`;
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-04-14 — CHANGE REPORT
- File principali: `src/next/NextInternalAiPage.tsx`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/product/CHECKLIST_IA_INTERNA.md`
- Cosa: Estendere alla card alta reale di `/next/ia/interna` la stessa capability multi-file gia approvata nel flusso chat/allegati, senza cambiare il caso singolo e senza toccare backend o madre.
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-14 — CONTINUITY REPORT
- File principali: `docs/continuity-reports/20260414_174940_continuity_ia_interna_card_alta_multi_file.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-14 — Change Report
- File principali: `docs/audit/AUDIT_IA_INTERNA_MAPPA_REALE_FLUSSI_MODALI.md`; `docs/change-reports/20260414_182700_audit_ia_interna_mappa_reale_flussi_modali.md`; `docs/continuity-reports/20260414_182700_continuity_audit_ia_interna_mappa_reale_flussi_modali.md`
- Cosa: Produrre una mappa unica e leggibile della IA interna reale `/next/ia/interna`, basata solo sul codice vero del repo, con focus su: / entrate reali
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-14 — Continuity Report
- File principali: `docs/continuity-reports/20260414_182700_continuity_audit_ia_interna_mappa_reale_flussi_modali.md`
- Cosa: Creato il report `docs/audit/AUDIT_IA_INTERNA_MAPPA_REALE_FLUSSI_MODALI.md`. / Verificata la catena reale:
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-15 — CHANGE REPORT
- File principali: `docs/change-reports/20260415_144354_ia_v1_separazione_ingressi_report_archivista.md`
- Cosa: separare davvero nel runtime NEXT la parte `IA Report` dalla nuova entrata `Archivista documenti / creare una nuova route pulita `/next/ia/archivista
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-15 — CONTINUITY REPORT
- File principali: `docs/continuity-reports/20260415_144354_continuity_ia_v1_separazione_ingressi_report_archivista.md`
- Cosa: /next/ia/interna` resta disponibile e compatibile / /next/ia/report` e ora un alias leggibile della parte report/chat
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-15 — 2026-04-15 18:18:16
- File principali: `docs/change-reports/20260415_181816_chiusura_archivista_v1_documenti_archiviazione.md`; `docs/continuity-reports/20260415_181816_continuity_chiusura_archivista_v1_documenti_archiviazione.md`
- Cosa: Chiudere il perimetro documentale di `Archivista` attivando tutte e sole le quattro famiglie V1, aggiungendo review coerente, controllo duplicati, conferma esplicita utente e archiviazione finale reale senza introdurre azioni business post-archivio. / aggiunto `ArchivistaArchiveClient.ts` come helper locale per:
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-15 — Importa documenti layout approvato allineato
- File principali: `docs/change-reports/20260415_214159_importa_documenti_layout_approvato_allineamento.md`; `docs/continuity-reports/20260415_214159_continuity_importa_documenti_layout_approvato_allineamento.md`
- Cosa: Unire la logica gia decisa di Archivista con il layout approvato di `docs/product/SPEC_UI_LAYOUT_IMPORTA_DOCUMENTI.md`, senza rifare Magazzino, senza trasformare IA 2 in chat e senza toccare backend o barrier. / CHANGE REPORT - Importa documenti layout approvato allineato
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-15 — 2026-04-15 22:41:52
- File principali: `docs/change-reports/20260415_224152_importa_documenti_ui_approvata_integrata.md`; `docs/continuity-reports/20260415_224152_continuity_importa_documenti_ui_approvata_integrata.md`
- Cosa: Integrare nella schermata reale `Importa documenti` il layout UI approvato, mantenendo invariata la logica attuale dei rami gia attivi e senza toccare backend, estrazione, writer o barrier. / allineato il naming visibile della pagina a `Importa documenti`;
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-04-16 — Separazione componente Libretto nel ramo reale
- File principali: `docs/change-reports/20260416_222127_estrazione_libretto_component_separation.md`; `docs/continuity-reports/20260416_222127_continuity_estrazione_libretto_component_separation.md`
- Cosa: creato `NextEstrazioneLibretto.tsx` come componente dedicato alla UI del libretto; / creato `next-estrazione-libretto.css` con stile isolato del ramo, prefisso `iai-`;
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-21 — Dossier elimina fattura
- File principali: `docs/change-reports/20260421_192448_dossier_elimina_fattura.md`; `docs/continuity-reports/20260421_192448_continuity_dossier_elimina_fattura.md`
- Cosa: Aggiungere nel Dossier Mezzo il bottone `Elimina` sulle righe fattura per rimuovere il documento da `@documenti_mezzi`, con conferma utente e senza toccare la manutenzione collegata. / aggiunto supporto al kind `firestore.deleteDoc`;
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

## Home/Shell — 72 patch dal 2026-03 al 2026-04

### 2026-03-07 — NEXT shell runtime
- File principali: `docs/continuity-reports/2026-03-07_2228_continuity_next-shell-runtime.md`
- Cosa: shell / navigazione
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-07 — Shell runtime NEXT separata
- File principali: `src/App.tsx`; `src/next/NextShell.tsx`; `src/next/NextAreaPage.tsx`; `src/next/nextData.ts`; `src/next/next-shell.css`
- Cosa: Creare la shell reale della NEXT dentro il repo, visibile e navigabile su route dedicate, senza alterare il comportamento runtime della legacy. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-08 — NEXT ruolo e visibilita shell
- File principali: `docs/continuity-reports/2026-03-08_1021_continuity_next-role-visibility.md`
- Cosa: shell / navigazione
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-08 — Visibilita e accesso ruoli nella shell NEXT
- File principali: `src/App.tsx`; `src/next/NextShell.tsx`; `src/next/NextAreaPage.tsx`; `src/next/nextData.ts`; `src/next/next-shell.css`
- Cosa: Predisporre nella shell NEXT una struttura solida di visibilita e accesso per ruolo, senza introdurre auth reale, scritture dati o impatti sulla legacy. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-08 — NEXT Mezzi / Dossier structured shell
- File principali: `src/App.tsx`; `src/next/NextRoleGuard.tsx`; `src/next/NextMezziDossierPage.tsx`; `src/next/next-shell.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: costruire la prima area reale della NEXT su `/next/mezzi-dossier`, oltre il placeholder generico, senza toccare legacy, backend o dati reali / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-08 — NEXT Centro di Controllo
- File principali: `docs/continuity-reports/2026-03-08_1058_continuity_next-centro-controllo.md`
- Cosa: shell dedicata della macro-area / UI strutturata del cockpit
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-08 — NEXT Centro di Controllo structured shell
- File principali: `src/App.tsx`; `src/next/NextCentroControlloPage.tsx`; `src/next/next-shell.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/STATO_ATTUALE_PROGETTO.md`
- Cosa: sostituire il placeholder di `/next/centro-controllo` con una prima shell reale della macro-area `Centro di Controllo`, senza dati runtime, senza scritture e senza copiare la home legacy / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-08 — NEXT Operativita Globale structured shell
- File principali: `src/App.tsx`; `src/next/NextOperativitaGlobalePage.tsx`; `src/next/next-shell.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/STATO_ATTUALE_PROGETTO.md`
- Cosa: sostituire il placeholder di `/next/operativita-globale` con una shell reale della macro-area `Operativita Globale`, senza dati runtime, senza scritture e senza copiare i moduli legacy / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-08 — IA Gestionale NEXT
- File principali: `docs/continuity-reports/2026-03-08_1123_continuity_next-ia-gestionale.md`
- Cosa: shell UI reale / route dedicata
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-08 — Shell strutturata IA Gestionale NEXT
- File principali: `src/App.tsx`; `src/next/NextIAGestionalePage.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STORICO_DECISIONI_PROGETTO.md`
- Cosa: sostituire il placeholder di `/next/ia-gestionale` con una pagina reale di shell che chiarisca missione, perimetro v1, limiti iniziali e differenza tra IA business e IA audit tecnico / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-08 — Shell strutturata Strumenti Trasversali NEXT
- File principali: `src/App.tsx`; `src/next/NextStrumentiTrasversaliPage.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STORICO_DECISIONI_PROGETTO.md`
- Cosa: sostituire il placeholder di `/next/strumenti-trasversali` con una pagina reale di shell che chiarisca servizi condivisi, PDF standard, utility comuni e distinzione rispetto a `IA Gestionale / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-08 — Audit tecnico D04 rifornimenti per futura lettura NEXT read-only
- File principali: `docs/data/AUDIT_RIFORNIMENTI_NEXT_READONLY.md`; `docs/change-reports/2026-03-08_2019_docs_audit-rifornimenti-next-readonly.md`; `docs/continuity-reports/2026-03-08_2019_continuity_d04-rifornimenti-audit.md`
- Cosa: Fotografare il flusso reale dei rifornimenti e capire se esiste oggi un sottoinsieme dati leggibile dalla NEXT senza usare tolleranze legacy. / Creato un audit dedicato al dominio `D04 Rifornimenti e consumi`.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-08 — D04 rifornimenti audit
- File principali: `docs/continuity-reports/2026-03-08_2019_continuity_d04-rifornimenti-audit.md`
- Cosa: Nessuna lettura `D04` nella NEXT. / Prima serve una scelta esplicita tra contratto business realmente riallineato o contratto provvisorio derogato e documentato.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-08 — Flusso rifornimenti
- File principali: `docs/continuity-reports/2026-03-08_2050_continuity_flusso-rifornimenti.md`
- Cosa: Niente di nuovo in questo task. / La NEXT non e stata modificata.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-09 — <Area/Modulo>
- File principali: `docs/continuity-reports/_TEMPLATE_CONTINUITY_REPORT.md`
- Cosa: <shell / UI / lettura dati / scrittura / niente / altro> / <punto aperto 1>
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Rimozione residuo Strumenti Trasversali clone
- File principali: `docs/continuity-reports/2026-03-11_0746_continuity_rimozione-residuo-strumenti-trasversali-clone.md`
- Cosa: shell clone read-only / route reali per `Colleghi`, `Fornitori`, `Area Capo`, `Gestione Operativa`, `Mezzi` e `Dossier
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Rimozione residuo Strumenti Trasversali dal clone
- File principali: `src/App.tsx`; `src/next/nextData.ts`; `src/next/nextAccess.ts`; `src/next/NextStrumentiTrasversaliPage.tsx`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Eliminare dal clone attivo la route e la promozione runtime di `Strumenti Trasversali`, mantenendo navigabili solo i moduli reali della madre gia aperti. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-11 — Riallineamento metadata access e guard del clone
- File principali: `src/App.tsx`; `src/next/nextData.ts`; `src/next/nextAccess.ts`; `src/next/NextRoleGuard.tsx`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Riallineare la mappa interna del clone read-only alle route gia attive, aggiornando metadata centrali, access map e guard minima senza aprire nuovi moduli business. / Nessun nuovo modulo viene aperto o chiuso.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-11 — Autisti Inbox Home clone
- File principali: `docs/continuity-reports/2026-03-11_1532_continuity_autistiinboxhome-clone.md`
- Cosa: Home inbox clone-safe / Sei listati inbox clone-safe
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Migrazione clone-safe di AutistiInboxHome
- File principali: `src/App.tsx`; `src/autistiInbox/AutistiInboxHome.tsx`; `src/next/NextAutistiInboxHomePage.tsx`; `src/next/nextData.ts`; `src/next/nextAccess.ts`
- Cosa: Aprire nel clone la route reale `/next/autisti-inbox` riusando `AutistiInboxHome` con modal clone-safe e routing confinato al subtree `/next`. / Creato un wrapper clone sottile che riusa `AutistiInboxHome` con `NextAutistiEventoModal`.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-11 — Clone UI parity
- File principali: `docs/continuity-reports/2026-03-11_2150_continuity_clone-ui-parita.md`
- Cosa: Shell UI / Routing clone-safe
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Parita UI clone su shell, quick link e metadata
- File principali: `src/next/NextShell.tsx`; `src/next/next-shell.css`; `src/next/NextCentroControlloPage.tsx`; `src/next/nextData.ts`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Riallineare la navigazione del clone alla copertura runtime reale, mantenendo il perimetro `/next` e senza riaprire scritture o moduli non pronti. / Punto aperto collegato?
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-26 — Audit Centro di Controllo
- File principali: `docs/continuity-reports/2026-03-26_2204_continuity_audit-centro-di-controllo-next.md`
- Cosa: clone fedele attivo della pagina madre dedicata `CentroControllo` tramite `NextCentroControlloClonePage / clone separato della `Home` madre su `/next
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-26 — Audit reale Centro di Controllo madre e confronto NEXT
- File principali: `docs/audit/AUDIT_CENTRO_DI_CONTROLLO_MADRE_ECOSISTEMA_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/change-reports/2026-03-26_2204_docs_audit-centro-di-controllo-madre-next.md`; `docs/continuity-reports/2026-03-26_2204_continuity_audit-centro-di-controllo-next.md`
- Cosa: produrre un audit fedele del modulo madre `CentroControllo` e del suo ecosistema collegato, chiarendo sorgenti dati, logiche reali, dipendenze e gap rispetto alla NEXT attuale, senza patchare runtime / creato un report audit completo sul modulo madre `CentroControllo`, con mappa blocchi UI -> sorgenti dati, logiche reali, dipendenze, convergenze e confronto madre vs NEXT
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-26 — Audit Centro di Controllo NEXT runtime
- File principali: `docs/continuity-reports/2026-03-26_2217_continuity_audit-centro-di-controllo-next-runtime.md`
- Cosa: Clone read-only del Centro di Controllo madre sulla route ufficiale. / Surface alternativa NEXT con domain D10/D03 e quick link, ma non agganciata al path ufficiale.
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-26 — Audit reale Centro di Controllo NEXT runtime
- File principali: `docs/audit/AUDIT_CENTRO_DI_CONTROLLO_NEXT.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/change-reports/2026-03-26_2217_docs_audit-centro-di-controllo-next-runtime.md`; `docs/continuity-reports/2026-03-26_2217_continuity_audit-centro-di-controllo-next-runtime.md`
- Cosa: Verificare e documentare cosa mostra davvero `/next/centro-controllo`, quali layer/dataset usa davvero e quanto il modulo NEXT sia realmente piu pulito della madre. / Creato un audit dedicato al Centro di Controllo NEXT, separando il path ufficiale `/next/centro-controllo` dalla superficie alternativa `NextCentroControlloPage.tsx`.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-29 — 2026-03-29 1515 - Prompt 36 ricostruzione Centro di Controllo NEXT
- File principali: `src/next/NextCentroControlloParityPage.tsx`; `src/next/domain/nextAutistiDomain.ts`; `src/next/domain/nextRifornimentiDomain.ts`; `src/App.tsx`; `docs/STATO_ATTUALE_PROGETTO.md`
- Cosa: Sostituire il wrapper madre del `Centro di Controllo` con una pagina NEXT vera, fedele alla madre lato UI e comportamento ma letta solo tramite layer puliti del clone.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-29 — 2026-03-29 1825 - Prompt 37 Home e Capo NEXT
- File principali: `src/next/NextHomePage.tsx`; `src/next/NextCentroControlloPage.tsx`; `src/next/domain/nextCentroControlloDomain.ts`; `src/next/nextHomeCloneState.ts`; `src/next/NextCapoMezziPage.tsx`
- Cosa: Applicare il metodo di ricostruzione reale anche oltre `Centro di Controllo`, eliminando il runtime madre dalla `Home` ufficiale del clone e riallineando `Capo` alla parity operativa sopra layer NEXT puliti. / Stato raggiunto
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-30 — Prompt 42 - Procedura madre->clone e chiusura gap audit finale
- File principali: `docs/continuity-reports/2026-03-30_1012_continuity_prompt42_procedura-madre-clone-chiusura-gap-audit.md`
- Cosa: Il backlog reale aperto dall'audit finale e tracciato e chiuso in `docs/audit/BACKLOG_GAP_AUDIT_FINALE_EXECUTION.md`.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-30 — Prompt 46 - Chiusura `Home` e `Libretti Export
- File principali: `src/next/NextHomePage.tsx`; `src/next/NextCentroControlloPage.tsx`; `src/next/components/NextHomeAutistiEventoModal.tsx`; `src/next/NextLibrettiExportPage.tsx`; `src/next/domain/nextLibrettiExportDomain.ts`
- Cosa: Obiettivo: chiudere solo gli ultimi 2 moduli ancora `APERTO` nel perimetro target NEXT: `Home` e `Libretti Export`. / creato il backlog persistente dei 2 moduli aperti;
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-30 — Prompt 47 - Audit finale conclusivo NEXT autonoma
- File principali: `docs/audit/AUDIT_FINALE_CONCLUSIVO_NEXT_AUTONOMA.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/MATRICE_ESECUTIVA_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Creato l'audit conclusivo dell'intero perimetro target NEXT con verifica reale di: / L'audit conferma che il mount finale della madre e chiuso sulle route ufficiali.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-30 — Prompt 45 - Audit finale moduli DA VERIFICARE
- File principali: `docs/audit/AUDIT_FINALE_DA_VERIFICARE_NEXT_AUTONOMA.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/MATRICE_ESECUTIVA_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Creato l'audit finale del bucket `DA VERIFICARE` con classificazione netta modulo per modulo. / Chiusi come `CHIUSO`:
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-30 — Audit generale totale NEXT vs madre
- File principali: `docs/audit/AUDIT_GENERALE_TOTALE_NEXT_VS_MADRE.md`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/MATRICE_ESECUTIVA_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: verificare in modo avversariale se la NEXT e davvero uguale alla madre sul perimetro target, senza patch runtime e senza fidarsi dei report esecutivi precedenti / creato l'audit generale totale della NEXT con classificazione modulo per modulo
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-30 — Home NEXT read-only
- File principali: `docs/continuity-reports/2026-03-30_1958_continuity_home-next-readonly-parity.md`
- Cosa: UI principale della `Home / modal eventi autisti NEXT
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-30 — Home NEXT read-only parity
- File principali: `src/next/NextCentroControlloPage.tsx`; `src/next/components/NextHomeAutistiEventoModal.tsx`; `src/next/domain/nextCentroControlloDomain.ts`; `src/next/domain/nextAutistiDomain.ts`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: Riallineare il modulo `Home` della NEXT ai dati reali della madre, eliminando le persistenze clone-only locali e mantenendo il comportamento read-only esplicito. / Aggiornata la documentazione ufficiale con stato finale del modulo `APERTO`.
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-30 — Audit Home post execution
- File principali: `docs/audit/AUDIT_HOME_POST_EXECUTION.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/MATRICE_ESECUTIVA_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/change-reports/2026-03-30_2027_audit-home-post-execution.md`
- Cosa: Verificare sul codice reale se la `Home` della NEXT dopo l'ultimo execution fosse da tenere `APERTO` oppure potesse essere promossa a `CHIUSO`. / Creato audit dedicato `Home` post execution con verdetto avversariale sul codice reale.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-30 — Home fix suggestioni autista
- File principali: `src/next/NextCentroControlloPage.tsx`; `docs/audit/BACKLOG_HOME_EXECUTION.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/MATRICE_ESECUTIVA_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Riallineare le suggestioni autista della `Home` NEXT al criterio visibile della madre, usando solo `sessioni` e `mezzi`. / Aggiornati backlog e registri documentali per tracciare il gap risolto senza promuovere il modulo a `CHIUSO`.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-30 — Audit Home final
- File principali: `docs/audit/AUDIT_HOME_FINAL.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/MATRICE_ESECUTIVA_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/change-reports/2026-03-30_2116_audit-home-final.md`
- Cosa: Eseguire l'audit finale separato del modulo `Home` della NEXT e fissare un verdetto netto basato sul codice reale. / Creato l'audit finale separato del modulo `Home`.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-30 — 2026-03-30 21:46 - home loop
- File principali: `docs/change-reports/2026-03-30_2146_home_loop.md`; `docs/continuity-reports/2026-03-30_2146_continuity_home_loop.md`
- Cosa: ripristinate le CTA madre `CREA LAVORO` / `GIÀ CREATO` e `IMPORTA IN DOSSIER`; / modulo chiuso nel run: `Home
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-30 — 2026-03-30 22:39 - centro-di-controllo loop
- File principali: `docs/change-reports/2026-03-30_2239_centro-di-controllo_loop.md`; `docs/continuity-reports/2026-03-30_2239_continuity_centro-di-controllo_loop.md`
- Cosa: modulo chiuso nel run: `Centro di Controllo
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — `Capo Costi` loop fix
- File principali: `docs/change-reports/2026-03-31_1024_capo-costi_loop_fix.md`; `docs/continuity-reports/2026-03-31_1024_continuity_capo-costi_loop_fix.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — Audit finale globale NEXT post-loop
- File principali: `docs/change-reports/2026-03-31_1528_audit-finale-globale-next-post-loop.md`; `docs/continuity-reports/2026-03-31_1528_continuity_audit-finale-globale-next-post-loop.md`
- Cosa: Il modulo `Autisti` non e chiuso davvero:
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — Home NEXT con Alert unico filtrabile per categorie reali
- File principali: `docs/change-reports/2026-04-01_1034_home-next-alert-card-con-filtro-visibile-e-categorie-reali.md`; `docs/continuity-reports/2026-04-01_1034_continuity_home-next-alert-card-con-filtro-visibile-e-categorie-reali.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — Home NEXT Alert madre-like per categoria
- File principali: `docs/change-reports/2026-04-01_1118_home-next-alert-madre-like-categorie-specifiche.md`; `docs/continuity-reports/2026-04-01_1118_continuity_home-next-alert-madre-like-categorie-specifiche.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — 2026-04-01 12:10
- File principali: `docs/continuity-reports/2026-04-01_1210_continuity_home-next-ia-home-modal-dedicato-full-overlay.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — 2026-04-01 14:20
- File principali: `src/next/NextCentroControlloPage.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/change-reports/2026-04-01_1420_home-next-alert-segnalazioni-payload-reale-madre-like.md`; `docs/continuity-reports/2026-04-01_1420_continuity_home-next-alert-segnalazioni-payload-reale-madre-like.md`
- Cosa: aggiunto lookup locale madre-like dei record segnalazione con `sourceRecordId` esplicito o hash fallback coerente con il dominio NEXT;
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — 2026-04-01 15:05
- File principali: `src/next/NextCentroControlloPage.tsx`; `src/next/components/StatoOperativoCard.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/change-reports/2026-04-01_1505_home-next-stato-operativo-card-unificata.md`
- Cosa: Creato `src/next/components/StatoOperativoCard.tsx`. / Creare una sola card `Stato operativo` con tab locali e vista compatta.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — 2026-04-01 16:00
- File principali: `src/next/NextCentroControlloPage.tsx`; `src/next/components/StatoOperativoCard.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/change-reports/2026-04-01_1600_home-next-stato-operativo-modale-contestuale-layout-affiancato.md`
- Cosa: aggiunto modale full-overlay reale con chiusura sempre visibile;
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — 2026-04-01 17:15
- File principali: `src/next/NextCentroControlloPage.tsx`; `src/next/components/QuickNavigationCard.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — 2026-04-01 17:35
- File principali: `docs/continuity-reports/2026-04-01_1735_continuity_quick-navigation-card-export-default-check.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — 2026-04-01 18:48
- File principali: `src/next/NextCentroControlloPage.tsx`; `src/next/next-shell.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — 2026-04-01 19:00
- File principali: `src/next/components/HomeAlertCard.tsx`; `src/next/components/StatoOperativoCard.tsx`; `src/next/next-shell.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — 2026-04-01 19:15
- File principali: `docs/change-reports/2026-04-01_1915_home-next-layout-desktop-deterministico-coppia-alta.md`; `docs/continuity-reports/2026-04-01_1915_continuity_home-next-layout-desktop-deterministico-coppia-alta.md`
- Cosa: Riallineato `Stato operativo` a 5 righe utili nella vista compatta Home.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — 2026-04-01 20:15
- File principali: `docs/audit/AUDIT_HOME_FLUSSI_MODULI_INGRESSI.md`; `docs/audit/MATRICE_HOME_MODULI_DECISIONI.md`; `docs/audit/BACKLOG_HOME_RIDUZIONE_RUMORE.md`
- Cosa: Creato audit strutturato sui flussi Home con:
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — 2026-04-01 21:40
- File principali: `docs/audit/DECISIONE_ARCHITETTURALE_GESTIONE_OPERATIVA_HUB.md`; `docs/audit/MATRICE_DESTINAZIONE_FAMIGLIE_MODULI.md`; `docs/audit/BACKLOG_RIORGANIZZAZIONE_HUB_E_HOME.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca documentazione
- Esito: FATTO

### 2026-04-01 — Decisione architetturale Gestione Operativa hub
- File principali: `docs/continuity-reports/2026-04-01_2140_continuity_decisione_architetturale_gestione_operativa_hub.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — 2026-04-01 22:45
- File principali: `src/next/NextCentroControlloPage.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Ripristinare un accesso diretto e visibile a `Gestione Operativa` nella Home NEXT senza rompere la nuova architettura appena applicata.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-03 — 2026-04-03 16:56 - Next shell global sidebar
- File principali: `docs/change-reports/2026-04-03_1656_next-shell-global-sidebar.md`; `docs/continuity-reports/2026-04-03_1656_continuity_next-shell-global-sidebar.md`
- Cosa: src/next/NextShell.tsx / src/next/NextHomePage.tsx
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-04-03 — 2026-04-03 17:12 - Next shell visual bugs admin centro controllo
- File principali: `docs/change-reports/2026-04-03_1712_next-shell-visual-bugs-admin-centro-controllo.md`; `docs/continuity-reports/2026-04-03_1712_continuity_next-shell-visual-bugs-admin-centro-controllo.md`
- Cosa: src/next/next-shell.css / documentazione clone obbligatoria
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-04-03 — 2026-04-03 1740
- File principali: `src/next/NextShell.tsx`; `src/next/next-shell.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Correggere due bug visivi reali della shell globale: / toggle hamburger non percepibile / non riapribile correttamente;
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-03 — 2026-04-03 1750
- File principali: `src/next/next-shell.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Correggere il root layout di `/next/autisti-inbox` dentro la shell globale NEXT, mantenendo corretta `/next/autisti-admin`, senza toccare CSS legacy o altri file runtime.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-03 — 2026-04-03 1844
- File principali: `src/next/NextHomePage.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Sostituire nella Home NEXT solo le tre stat card con metrica gia verificata (`Lavori aperti`, `Ordini in attesa`, `Segnalazioni`), lasciando invariata `Mezzi attivi` e senza toccare widget, banner, IA, route, shell o domain.
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-04-03 — 2026-04-03 1915
- File principali: `src/next/NextHomePage.tsx`; `src/next/next-home.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Sostituire nella Home NEXT solo i widget `Motrici e trattori`, `Rimorchi` e `Lavori aperti` con dati reali NEXT, lasciando invariato `Magazzino` e senza toccare stat card, banner, IA, route, shell o domain.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-03 — Change Report
- File principali: `src/next/NextHomePage.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: aggiunto rebucket locale dei dati widget Home usando `D10AssetLocationItem.categoria`;
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-03 — Continuity Report
- File principali: `docs/continuity-reports/2026-04-03_2024_continuity_next-home-pianale-rimorchi.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-03 — Change Report
- File principali: `src/next/NextHomePage.tsx`; `src/next/next-home.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-03 — Continuity Report
- File principali: `docs/continuity-reports/2026-04-03_2045_continuity_next-home-fleet-widgets-mother-flow.md`
- Cosa: aggiunto solo stato locale clone-safe per il luogo modificato nella Home
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-03 — Change Report
- File principali: `src/next/NextHomePage.tsx`; `src/next/next-home.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-03 — Continuity Report
- File principali: `docs/continuity-reports/2026-04-03_2059_continuity_next-home-fleet-widgets-expand-category.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-03 — 2026-04-03 21:42
- File principali: `docs/continuity-reports/2026-04-03_2142_continuity_next-scadenze-modal-unico.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-03 — 2026-04-03 22:04
- File principali: `src/next/components/NextScadenzeModal.tsx`; `src/next/domain/nextCentroControlloDomain.ts`; `src/next/next-shell.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Portare il sistema `Scadenze` NEXT da sola lettura a fase operativa madre-like per revisioni / collaudi / pre-collaudi, mantenendo il clone in read-only e correggendo il bug reale di parsing data/delta. / Esteso `NextScadenzeModal` con superfici operative interne allo stesso contenitore:
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-16 — audit flusso libretto madre completo
- File principali: `docs/audit/AUDIT_FLUSSO_LIBRETTO_MADRE_COMPLETO_2026-04-16_1826.md`
- Cosa: Ricostruire in sola lettura il comportamento reale del flusso legacy `IA Libretto`, inclusi salvataggio, Storage, reader downstream e limiti dimostrabili del repo. / Limite rimasto aperto
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO

## Flotta/Mezzi — 63 patch dal 2026-03 al 2026-04

### 2026-03-08 — NEXT Mezzi / Dossier
- File principali: `docs/continuity-reports/2026-03-08_1046_continuity_next-mezzi-dossier.md`
- Cosa: shell dedicata / UI strutturata dell'area Mezzi / Dossier
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-08 — NEXT Flotta read-only
- File principali: `docs/continuity-reports/2026-03-08_1856_continuity_next-flotta-read-only.md`
- Cosa: shell UI della macro-area `Mezzi / Dossier / elenco mezzi reale `read-only
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-08 — Primo reader canonico NEXT per Flotta read-only
- File principali: `src/next/nextAnagraficheFlottaDomain.ts`; `src/next/NextMezziDossierPage.tsx`; `src/next/next-shell.css`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/STATO_ATTUALE_PROGETTO.md`
- Cosa: verificare il dominio `Anagrafiche flotta e persone` e attivare il primo ingresso dati reale della NEXT con elenco mezzi `read-only` su `/next/mezzi-dossier / creato un reader canonico NEXT dedicato al dominio `D01`, limitato a `storage/@mezzi_aziendali
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-08 — D04 rifornimenti canonici
- File principali: `docs/continuity-reports/2026-03-08_1953_continuity_d04-rifornimenti-canonici.md`
- Cosa: Dossier NEXT con `D01` read-only / Dossier NEXT con primo blocco `D02` read-only
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-08 — Normalizzazione documentale D04 rifornimenti
- File principali: `docs/data/DOMINI_DATI_CANONICI.md`; `docs/data/REGOLE_STRUTTURA_DATI.md`; `docs/product/STORICO_DECISIONI_PROGETTO.md`
- Cosa: chiarire il contratto canonico target di `D04 Rifornimenti e consumi` senza toccare runtime, storage o NEXT / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-08 — D04 next block
- File principali: `docs/continuity-reports/2026-03-08_2005_continuity_d04-next-block.md`
- Cosa: elenco mezzi `D01 / Dossier iniziale `D01
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-08 — Verifica D04 NEXT bloccata
- File principali: `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: verificare se `D04 Rifornimenti e consumi` fosse importabile in forma minima `read-only` nella NEXT senza toccare la legacy / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-08 — D04 rifornimenti items check
- File principali: `docs/continuity-reports/2026-03-08_2033_continuity_d04-rifornimenti-items-check.md`
- Cosa: Nessuna lettura `D04` nella NEXT. / Esiste ora un check dedicato che identifica un sottoinsieme minimo importabile dal solo `@rifornimenti.items`.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-08 — Layer NEXT D04 rifornimenti canonico ridotto
- File principali: `src/next/nextRifornimentiConsumiDomain.ts`; `src/next/NextDossierMezzoPage.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STORICO_DECISIONI_PROGETTO.md`
- Cosa: costruire il primo layer di normalizzazione NEXT per `D04 Rifornimenti e consumi` e usarlo nel `Dossier Mezzo NEXT` senza toccare la legacy / creato un reader/layer NEXT dedicato a `D04` che legge solo `storage/@rifornimenti.items
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-11 — Route clone dedicata Analisi Economica
- File principali: `src/App.tsx`; `src/next/NextDossierMezzoPage.tsx`; `src/next/nextData.ts`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: Aprire `Analisi Economica` nel clone come route reale dedicata `/next/analisi-economica/:targa`, riusando la pagina clone gia esistente e mantenendo invariato il perimetro read-only. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-11 — Apertura clone-safe Cisterna base
- File principali: `src/App.tsx`; `src/next/NextCentroControlloPage.tsx`; `src/next/domain/nextCisternaDomain.ts`; `src/next/NextCisternaPage.tsx`; `src/next/nextData.ts`
- Cosa: Aprire nel clone solo la route base `/next/cisterna`, separando la parte consultiva della madre da writer, upload, endpoint IA ed export PDF. / Creato `nextCisternaDomain.ts` per leggere in sola lettura i dataset cisterna reali e ricostruire archivio, report mensile e tabelle per targa.
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-11 — Cisterna base clone
- File principali: `docs/continuity-reports/2026-03-11_1228_continuity_cisterna-base-clone.md`
- Cosa: Archivio documenti cisterna del mese / Report mensile cisterna
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-11 — Barriera no-write clone
- File principali: `docs/continuity-reports/2026-03-11_1310_continuity_barriera-no-write-clone-fase-1.md`
- Cosa: barriera fetch runtime nel bootstrap / guardie condivise su `storageSync`, `materialImages`, `aiCore`, `cisterna/iaClient
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Fase 1 barriera centrale no-write clone
- File principali: `src/main.tsx`; `src/utils/cloneWriteBarrier.ts`; `src/utils/storageSync.ts`; `src/utils/materialImages.ts`; `src/utils/aiCore.ts`
- Cosa: Installare una prima barriera runtime centrale che blocchi nel clone `/next` una parte grossa e concreta delle scritture e dei side effect mutanti, senza ancora rifattorizzare tutti i writer diretti sparsi nel repo. / Punto aperto collegato?
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Fase 2 mirata barriera no-write Cisterna
- File principali: `src/utils/firestoreWriteOps.ts`; `src/utils/storageWriteOps.ts`; `src/pages/CisternaCaravate/CisternaCaravateIA.tsx`; `src/pages/CisternaCaravate/CisternaSchedeTest.tsx`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Estendere la barriera no-write del clone ai writer Firebase/Storage diretti che bloccavano la futura migrazione di `Cisterna IA` e `Schede Test`, senza avviare ancora la migrazione dei moduli e senza rifattorizzare tutto il repo. / Punto aperto collegato?
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-11 — Hardening barriera no-write Cisterna
- File principali: `docs/continuity-reports/2026-03-11_1335_continuity_barriera-no-write-clone-fase-2-cisterna.md`
- Cosa: niente nuove route o UI / solo hardening tecnico della barriera no-write
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Migrazione Cisterna IA clone
- File principali: `src/App.tsx`; `src/pages/CisternaCaravate/CisternaCaravateIA.tsx`; `src/next/NextCisternaPage.tsx`; `src/next/NextCisternaIAPage.tsx`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Portare `Cisterna IA` nel clone su route reale `/next/cisterna/ia`, mantenendo il flusso della madre il piu possibile fedele ma gestendo in modo stabile il blocco no-write. / Punto aperto collegato?
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Cisterna / Schede Test
- File principali: `docs/continuity-reports/2026-03-11_1358_continuity_migrazione-schede-test-cisterna-clone.md`
- Cosa: Route base Cisterna clone-safe / Modulo `Cisterna IA` clone-safe
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Migrazione Schede Test Cisterna nel clone
- File principali: `src/App.tsx`; `src/pages/CisternaCaravate/CisternaSchedeTest.tsx`; `src/next/NextCisternaPage.tsx`; `src/next/NextCisternaSchedeTestPage.tsx`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Aprire nel clone la route reale `/next/cisterna/schede-test` riusando controllatamente il modulo madre e gestendo in modo sobrio i blocchi della barriera no-write. / Punto aperto collegato?
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-11 — Prima tranche Autisti Inbox clone
- File principali: `docs/continuity-reports/2026-03-11_1430_continuity_autisti-inbox-prima-tranche-clone.md`
- Cosa: Route clone reali per `cambio-mezzo`, `log-accessi`, `gomme / Riutilizzo controllato delle pagine madre con navigazione clone-safe
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Prima tranche Autisti Inbox clone-safe
- File principali: `src/App.tsx`; `src/autistiInbox/CambioMezzoInbox.tsx`; `src/autistiInbox/AutistiLogAccessiAll.tsx`; `src/autistiInbox/AutistiGommeAll.tsx`; `src/next/NextAutistiInboxCambioMezzoPage.tsx`
- Cosa: Aprire nel clone le prime tre route reali `Autisti Inbox` piu pulite (`cambio-mezzo`, `log-accessi`, `gomme`) senza aprire la home inbox e senza introdurre writer. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-11 — Seconda tranche Autisti Inbox clone
- File principali: `docs/continuity-reports/2026-03-11_1441_continuity_autisti-inbox-seconda-tranche-clone.md`
- Cosa: Prima tranche `Autisti Inbox`: `cambio-mezzo`, `log-accessi`, `gomme / Seconda tranche `Autisti Inbox`: `controlli`, `segnalazioni`, `richiesta-attrezzature
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Seconda tranche Autisti Inbox clone-safe
- File principali: `src/App.tsx`; `src/autistiInbox/AutistiControlliAll.tsx`; `src/autistiInbox/AutistiSegnalazioniAll.tsx`; `src/autistiInbox/RichiestaAttrezzatureAll.tsx`; `src/next/NextAutistiInboxControlliPage.tsx`
- Cosa: Aprire nel clone le route reali `Autisti Inbox` di `controlli`, `segnalazioni` e `richiesta-attrezzature`, mantenendo il riuso delle pagine madre e una navigazione clone-safe. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-11 — Fix regressione letture clone fetch barrier
- File principali: `docs/continuity-reports/2026-03-11_1456_continuity_fix-regressione-letture-clone-fetch-barrier.md`
- Cosa: Barriera no-write Fase 1 / Hardening Fase 2 mirato su writer diretti Cisterna
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — AutistiEventoModal clone-safe
- File principali: `docs/continuity-reports/2026-03-11_1517_continuity_autistieventomodal-clone-safe.md`
- Cosa: Variante clone-safe del modal. / Nessun nuovo modulo autisti aperto in questo task.
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Variante clone-safe AutistiEventoModal
- File principali: `src/components/AutistiEventoModal.tsx`; `src/next/components/NextAutistiEventoModal.tsx`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: Creare una variante clone-safe di `AutistiEventoModal` per eliminare nel clone le azioni writer ambigue senza alterare il comportamento legacy. / Esteso `AutistiEventoModal` con props opzionali `cloneSafe` e `buildCloneLavoroDetailPath`, lasciando invariato il default legacy.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-11 — Autisti clone prima tranche
- File principali: `docs/continuity-reports/2026-03-11_1724_continuity_autisti-clone-prima-tranche.md`
- Cosa: UI reale della prima tranche autisti / Runtime clone-safe per key locali autisti
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Prima tranche clone-safe app autisti
- File principali: `src/App.tsx`; `src/next/autisti/nextAutistiCloneRuntime.ts`; `src/next/autisti/NextAutistiCloneLayout.tsx`; `src/next/autisti/next-autisti-clone.css`; `src/next/NextAutistiGatePage.tsx`
- Cosa: Aprire la prima tranche reale dell'app autisti nel clone su `/next/autisti/*`, mantenendo la madre intatta, senza toccare `src/autisti/**` e senza falsa UX di scrittura riuscita. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-11 — Autisti clone seconda tranche
- File principali: `docs/continuity-reports/2026-03-11_1819_continuity_autisti-clone-seconda-tranche.md`
- Cosa: Route clone reali per gate, login, setup mezzo, controllo mezzo, home autista e cambio mezzo / Rewrite dei path legacy `/autisti/*` verso `/next/autisti/*` per le tranche aperte
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Seconda tranche clone-safe app autisti
- File principali: `src/App.tsx`; `src/next/autisti/nextAutistiCloneRuntime.ts`; `src/next/autisti/NextAutistiCloneLayout.tsx`; `src/next/autisti/nextAutistiCloneState.ts`; `src/next/NextAutistiGatePage.tsx`
- Cosa: Aprire nel clone autisti la seconda tranche composta da `ControlloMezzo`, `CambioMezzoAutista` e dal flusso `Gomme`, mantenendo il runtime confinato a `/next/autisti/*` e senza toccare `src/autisti/**`. / Esteso il runtime clone per riscrivere i path legacy della seconda tranche, mantenendo bloccati i moduli della terza tranche.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-11 — Autisti clone rifornimento
- File principali: `docs/continuity-reports/2026-03-11_1951_continuity_autisti-clone-rifornimento.md`
- Cosa: Route clone reali per gate, login, setup mezzo, controllo mezzo, home autista, cambio mezzo e ora rifornimento / Rewrite dei path legacy `/autisti/*` verso `/next/autisti/*` per tutte le tranche oggi aperte
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Pagina clone dedicata Rifornimento app autisti
- File principali: `src/App.tsx`; `src/next/autisti/nextAutistiCloneRuntime.ts`; `src/next/autisti/NextAutistiCloneLayout.tsx`; `src/next/autisti/nextAutistiCloneRifornimenti.ts`; `src/next/autisti/NextAutistiRifornimentoPage.tsx`
- Cosa: Aprire nel clone autisti il primo modulo della terza tranche con una pagina dedicata per `Rifornimento`, evitando il wrapper puro del modulo madre e qualsiasi scrittura reale verso i dataset operativi. / Esteso il runtime clone per riscrivere `/autisti/rifornimento` verso il subtree `/next/autisti/*`, cosi la home clone continua a usare il flusso madre ma senza uscire dal perimetro.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-11 — Autisti clone richiesta attrezzature
- File principali: `docs/continuity-reports/2026-03-11_2003_continuity_autisti-clone-richiesta-attrezzature.md`
- Cosa: Route clone reali per gate, login, setup mezzo, controllo mezzo, home autista, cambio mezzo, rifornimento e richiesta attrezzature / Rewrite dei path legacy `/autisti/*` verso `/next/autisti/*` per tutte le tranche oggi aperte
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Pagina clone dedicata Richiesta Attrezzature app autisti
- File principali: `src/App.tsx`; `src/next/autisti/nextAutistiCloneRuntime.ts`; `src/next/autisti/NextAutistiCloneLayout.tsx`; `src/next/autisti/nextAutistiCloneAttachments.ts`; `src/next/autisti/nextAutistiCloneRichiesteAttrezzature.ts`
- Cosa: Aprire nel clone autisti il modulo `RichiestaAttrezzature` con una pagina dedicata e un helper allegati clone-only, evitando il wrapper puro del modulo madre e qualsiasi upload/delete reale verso Storage. / Esteso il runtime clone per riscrivere `/autisti/richiesta-attrezzature` verso il subtree `/next/autisti/*`, cosi la home clone continua a usare il flusso madre senza uscire dal perimetro.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-11 — Autisti clone segnalazioni
- File principali: `docs/continuity-reports/2026-03-11_2021_continuity_autisti-clone-segnalazioni.md`
- Cosa: Route clone reali per gate, login, setup mezzo, controllo mezzo, home autista, cambio mezzo, rifornimento, richiesta attrezzature e segnalazioni / Rewrite dei path legacy `/autisti/*` verso `/next/autisti/*` per tutte le tranche oggi aperte
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Pagina clone dedicata Segnalazioni app autisti
- File principali: `src/App.tsx`; `src/next/autisti/nextAutistiCloneRuntime.ts`; `src/next/autisti/NextAutistiCloneLayout.tsx`; `src/next/autisti/nextAutistiCloneSegnalazioni.ts`; `src/next/autisti/NextAutistiSegnalazioniPage.tsx`
- Cosa: Aprire nel clone autisti il modulo `Segnalazioni` con una pagina dedicata e persistenza locale clone-only, evitando il wrapper puro del modulo madre e qualsiasi upload o scrittura reale verso la madre. / Esteso il runtime clone per riscrivere `/autisti/segnalazioni` verso il subtree `/next/autisti/*`, cosi la home clone continua a usare il flusso madre senza uscire dal perimetro.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-11 — Autisti Admin reader-first
- File principali: `docs/continuity-reports/2026-03-11_2120_continuity_autisti-admin-reader-first.md`
- Cosa: Route `/next/autisti-admin / Pagina dedicata `NextAutistiAdminPage
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Autisti Admin reader-first nel clone
- File principali: `src/App.tsx`; `src/next/NextAutistiAdminPage.tsx`; `src/next/next-autisti-admin-reader.css`; `src/next/NextAutistiInboxHomePage.tsx`; `src/next/NextCentroControlloPage.tsx`
- Cosa: Aprire `/next/autisti-admin` come controparte clone reader-first di `AutistiAdmin`, leggendo gli stessi dataset reali ma senza esporre rettifiche, delete, `crea lavoro` o altre azioni scriventi. / Punto aperto collegato?
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-30 — Prompt 48
- File principali: `src/next/NextIAApiKeyPage.tsx`; `src/next/domain/nextIaConfigDomain.ts`; `src/next/autisti/NextAutistiCloneLayout.tsx`; `src/next/autisti/nextAutistiCloneRuntime.ts`; `src/next/NextGestioneOperativaPage.tsx`
- Cosa: Chiudere solo i 3 gap reali finali del perimetro target NEXT: / IA API Key
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-30 — Prompt 43 - Audit finale avversariale post prompt 42
- File principali: `docs/audit/AUDIT_FINALE_POST_PROMPT_42_NEXT_AUTONOMA.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/MATRICE_ESECUTIVA_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/change-reports/2026-03-30_1600_prompt43_audit-finale-post-prompt-42-next-autonoma.md`
- Cosa: Eseguire un audit puro avversariale sul risultato del prompt 42, senza patch runtime, per verificare contro il codice reale se il perimetro target NEXT sia davvero chiuso e autonomo. / creato un audit finale nuovo, separato dall'execution del prompt 42, basato su route ufficiali, grep runtime, confronto con file madre e stato git del worktree;
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-30 — Loop `Mezzi` (`2026-03-30 22:44`)
- File principali: `docs/change-reports/2026-03-30_2244_mezzi_loop.md`; `docs/continuity-reports/2026-03-30_2244_continuity_mezzi_loop.md`
- Cosa: Continuare il loop ufficiale della NEXT dal tracker esistente dopo la chiusura di `Centro di Controllo`, verificando il modulo `Mezzi` sulla route `/next/mezzi`.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — Loop `Mezzi` (`2026-03-31 06:52`)
- File principali: `docs/change-reports/2026-03-31_0652_mezzi_loop_fix.md`; `docs/continuity-reports/2026-03-31_0652_continuity_mezzi_loop_fix.md`
- Cosa: Chiudere il modulo `Mezzi` della NEXT sulla route `/next/mezzi` come clone fedele read-only della madre. / runtime ufficiale `Mezzi` riallineato alla madre e senza scritture clone-only attive
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — `Capo Mezzi` loop fix
- File principali: `docs/change-reports/2026-03-31_1023_capo-mezzi_loop_fix.md`; `docs/continuity-reports/2026-03-31_1023_continuity_capo-mezzi_loop_fix.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — `IA Libretto` loop stop
- File principali: `docs/continuity-reports/2026-03-31_1030_continuity_ia-libretto_loop_stop.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — 2026-03-31 10:55 - IA Libretto loop fix
- File principali: `docs/change-reports/2026-03-31_1055_ia-libretto_loop_fix.md`
- Cosa: Chiudere il modulo `IA Libretto` della NEXT come clone fedele read-only della madre su `/next/ia/libretto`, senza toccare la madre e senza lasciare upload, save o patch clone-only attivi nel runtime ufficiale.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — 2026-03-31 11:16 - IA Copertura Libretti loop fix
- File principali: `docs/change-reports/2026-03-31_1116_ia-copertura-libretti_loop_fix.md`; `docs/continuity-reports/2026-03-31_1116_continuity_ia-copertura-libretti_loop_fix.md`
- Cosa: Chiudere il modulo `IA Copertura Libretti` della NEXT come clone fedele read-only della madre su `/next/ia/copertura-libretti`, senza upload o patch locali nel runtime ufficiale. / esteso `src/next/nextAnagraficheFlottaDomain.ts` per esporre anche `librettoStoragePath` reale, necessario per una parity madre-like sulla copertura libretti;
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — 2026-03-31 11:16 - Libretti Export loop audit
- File principali: `docs/change-reports/2026-03-31_1116_libretti-export_loop_audit.md`; `docs/continuity-reports/2026-03-31_1116_continuity_libretti-export_loop_audit.md`
- Cosa: Verificare nel loop il modulo `Libretti Export` su `/next/libretti-export` e chiuderlo solo se la route ufficiale NEXT risulta gia autonoma, madre-like e read-only. / Libretti Export` chiuso nel loop con audit `PASS
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — 2026-03-31 12:00 - Cisterna loop fix
- File principali: `docs/change-reports/2026-03-31_1200_cisterna_loop_fix.md`; `docs/continuity-reports/2026-03-31_1200_continuity_cisterna_loop_fix.md`
- Cosa: Chiudere il modulo `Cisterna` della NEXT come clone fedele read-only della madre su `/next/cisterna`, senza toccare la madre e senza lasciare writer locali o export locale attivi nel runtime ufficiale. / esteso `src/next/domain/nextCisternaDomain.ts` con `includeCloneOverlays`, cosi la route ufficiale usa `readNextCisternaSnapshot(..., { includeCloneOverlays: false })`;
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — `Cisterna IA` loop fix
- File principali: `src/next/NextCisternaIAPage.tsx`; `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`; `docs/audit/BACKLOG_cisterna-ia.md`; `docs/audit/AUDIT_cisterna-ia_LOOP.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: rimosso il runtime clone-specifico con scaffold, banner handoff visibile, upload Storage, analisi IA reale e salvataggi clone-only; / riallineata la superficie pratica alla madre su header, note, upload, preview, pulsanti, risultato estrazione e campi del form;
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — `Cisterna Schede Test` loop stop
- File principali: `docs/change-reports/2026-03-31_1218_cisterna-schede-test_loop_stop.md`; `docs/continuity-reports/2026-03-31_1218_continuity_cisterna-schede-test_loop_stop.md`
- Cosa: Il modulo resta aperto per gap strutturali: `NextClonePageScaffold`, salvataggi clone-only, estrazione locale simulata e superficie ancora molto piu ridotta della madre.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — `Cisterna Schede Test
- File principali: `src/next/NextCisternaSchedeTestPage.tsx`; `src/next/domain/nextCisternaDomain.ts`; `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`; `docs/audit/BACKLOG_cisterna-schede-test.md`; `docs/audit/AUDIT_cisterna-schede-test_LOOP.md`
- Cosa: Il runtime ufficiale `src/next/NextCisternaSchedeTestPage.tsx` e stato riallineato alla grammatica madre in sola lettura. / Il modulo e chiuso solo nel loop corrente, con audit separato `PASS`.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — Loop `Autisti
- File principali: `docs/change-reports/2026-03-31_1419_autisti_loop_fix.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — 2026-03-31 14:47 - Autisti Inbox / Admin
- File principali: `docs/change-reports/2026-03-31_1447_autisti-inbox-admin_loop_fix.md`
- Cosa: esteso il boundary D03 read-only alle route ufficiali inbox/admin
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — `Autisti` final fix after global audit
- File principali: `src/next/autisti/NextLoginAutistaNative.tsx`; `src/next/autisti/NextSetupMezzoNative.tsx`; `src/next/autisti/NextHomeAutistaNative.tsx`; `src/next/NextLegacyStorageBoundary.tsx`; `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`
- Cosa: Contesto di ripresa: l'audit finale globale `docs/audit/AUDIT_FINALE_GLOBALE_NEXT_POST_LOOP.md` aveva riaperto `Autisti` perche il runtime ufficiale usciva ancora su `/autisti/*`. / Autisti` risultava `CLOSED` nel tracker ma non chiuso davvero nel codice reale.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — Audit finale globale NEXT post-loop V2
- File principali: `docs/change-reports/2026-03-31_1604_audit-finale-globale-next-post-loop-v2.md`; `docs/continuity-reports/2026-03-31_1604_continuity_audit-finale-globale-next-post-loop-v2.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — Correzione finale `Autisti Inbox / Admin` dopo audit globale V2
- File principali: `docs/change-reports/2026-03-31_1709_autisti-inbox-admin_final_fix_after_global_audit.md`; `docs/continuity-reports/2026-03-31_1709_continuity_autisti-inbox-admin_final_fix_after_global_audit.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — Audit finale globale NEXT post loop V3
- File principali: `docs/continuity-reports/2026-03-31_1717_continuity_audit-finale-globale-next-post-loop-v3.md`
- Cosa: Correzioni finali `Autisti` e `Autisti Inbox / Admin` confermate nel codice reale. / Integrita della madre confermata: nessuna modifica in `src/pages`, `src/autisti`, `src/autistiInbox`.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — Audit Finale Globale NEXT Post Loop V4
- File principali: `docs/change-reports/2026-03-31_1823_audit-finale-globale-next-post-loop-v4.md`; `docs/continuity-reports/2026-03-31_1823_continuity_audit-finale-globale-next-post-loop-v4.md`
- Cosa: Nessun modulo `CLOSED` del tracker risulta oggi falsamente chiuso.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-03 — Change Report
- File principali: `src/next/nextData.ts`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-03 — Continuity Report
- File principali: `docs/continuity-reports/2026-04-03_2229_continuity_next-sidebar-mezzi-route-fix.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-16 — 2026-04-16 18:44 - audit next libretto save real flow
- File principali: `docs/continuity-reports/2026-04-16_1844_continuity_audit-next-libretto-save-real-flow.md`
- Cosa: Creato audit documentale completo: / NO, NON ALLINEATO ALLA MADRE
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-16 — 2026-04-16 19:12 - next ia libretto runtime alignment
- File principali: `docs/change-reports/2026-04-16_1912_next_ia_libretto_runtime_alignment.md`; `docs/continuity-reports/2026-04-16_1912_continuity_next_ia_libretto_runtime_alignment.md`
- Cosa: Riallineare `/next/ia/libretto` alla stessa logica reale della madre per: / analisi del libretto;
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-16 — 2026-04-16 19:47 - fix clonewritebarrier next ia libretto
- File principali: `docs/change-reports/2026-04-16_1947_fix_clonewritebarrier_next_ia_libretto.md`
- Cosa: Sbloccare davvero `Analyze` di `/next/ia/libretto` senza allargare il barrier oltre il minimo necessario. / nessun altro endpoint aperto
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

## Dossier — 13 patch dal 2026-03 al 2026-03

### 2026-03-08 — NEXT Dossier iniziale
- File principali: `docs/continuity-reports/2026-03-08_1910_continuity_next-dossier-iniziale.md`
- Cosa: lettura dati reali da `storage/@mezzi_aziendali / elenco mezzi NEXT con ricerca/filtro locale
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-08 — Primo Dossier Mezzo NEXT iniziale read-only
- File principali: `src/App.tsx`; `src/next/nextAnagraficheFlottaDomain.ts`; `src/next/NextMezziDossierPage.tsx`; `src/next/NextDossierMezzoPage.tsx`; `src/next/next-shell.css`
- Cosa: aprire il primo Dossier Mezzo NEXT iniziale in sola lettura, partendo solo dal dominio stabile `Anagrafiche flotta e persone / esteso il reader canonico `D01` con lookup per targa senza introdurre nuovi dataset o writer
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-08 — NEXT Dossier D02 read-only
- File principali: `docs/continuity-reports/2026-03-08_1935_continuity_next-dossier-d02-read-only.md`
- Cosa: reader canonico `D01` su `storage/@mezzi_aziendali / reader canonico `D02` su `@lavori` e `@manutenzioni
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-08 — Primo blocco tecnico D02 nel Dossier NEXT read-only
- File principali: `src/next/nextOperativitaTecnicaDomain.ts`; `src/next/NextDossierMezzoPage.tsx`; `src/next/NextMezziDossierPage.tsx`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/STATO_ATTUALE_PROGETTO.md`
- Cosa: verificare il dominio `Operativita tecnica mezzo` e, risultando importabile in sola lettura, portare nel `Dossier Mezzo NEXT` il primo blocco tecnico reale su lavori e manutenzioni / creato il reader canonico NEXT `D02` dedicato al dominio `Operativita tecnica mezzo
- Impatto: tocca UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-08 — Check reale `@rifornimenti.items
- File principali: `docs/data/CHECK_REALE_RIFORNIMENTI_ITEMS.md`; `docs/change-reports/2026-03-08_2033_docs_check-reale-rifornimenti-items.md`; `docs/continuity-reports/2026-03-08_2033_continuity_d04-rifornimenti-items-check.md`
- Cosa: Verificare se il canonico reale `@rifornimenti.items` espone gia un sottoinsieme leggibile dalla NEXT in read-only minima, senza merge col `tmp`. / Creato un check dedicato su come `@rifornimenti.items` viene popolato e letto oggi.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-08 — Audit flusso reale rifornimenti
- File principali: `docs/data/FLUSSO_REALE_RIFORNIMENTI.md`; `docs/change-reports/2026-03-08_2050_docs_flusso-reale-rifornimenti.md`; `docs/continuity-reports/2026-03-08_2050_continuity_flusso-rifornimenti.md`
- Cosa: Documentare in modo definitivo il flusso reale end-to-end dei rifornimenti per guidare una futura lettura NEXT sicura senza toccare il runtime. / Creato un report unico con writer, reader, dataset e passaggi reali del dominio rifornimenti.
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-08 — Regola layer normalizzazione NEXT
- File principali: `AGENTS.md`; `docs/product/REGOLE_LAVORO_CODEX.md`; `docs/product/STORICO_DECISIONI_PROGETTO.md`; `docs/change-reports/2026-03-08_2105_docs_regola-layer-normalizzazione-next.md`; `docs/continuity-reports/2026-03-08_2105_continuity_regola-normalizzazione-next.md`
- Cosa: Rendere operativa una regola di progetto che privilegi il layer di normalizzazione NEXT rispetto a modifiche premature del runtime legacy quando il madre funziona gia in produzione. / Allineato `REGOLE_LAVORO_CODEX.md` con la stessa linea operativa.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-08 — Regola normalizzazione NEXT
- File principali: `docs/continuity-reports/2026-03-08_2105_continuity_regola-normalizzazione-next.md`
- Cosa: Nessun avanzamento runtime in questo task. / Solo allineamento di regole operative.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-31 — Loop `Dossier Lista` (`2026-03-31 08:00`)
- File principali: `docs/change-reports/2026-03-31_0800_dossier-lista_loop.md`; `docs/continuity-reports/2026-03-31_0800_continuity_dossier-lista_loop.md`
- Cosa: Chiudere il modulo `Dossier Lista` della NEXT sulla route `/next/dossiermezzi` come clone fedele read-only della madre. / runtime ufficiale `Dossier Lista` riallineato alla madre senza patch clone-only implicite nel reader D01
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — Loop `Dossier Mezzo` (`2026-03-31 08:05`)
- File principali: `docs/change-reports/2026-03-31_0805_dossier-mezzo_loop.md`; `docs/continuity-reports/2026-03-31_0805_continuity_dossier-mezzo_loop.md`
- Cosa: Chiudere il modulo `Dossier Mezzo` della NEXT sulla route `/next/dossier/:targa` come clone fedele read-only della madre. / usare `docs/audit/BACKLOG_dossier-mezzo.md` e `docs/audit/AUDIT_dossier-mezzo_LOOP.md` come prova del modulo chiuso
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — Loop `Dossier Gomme` (`2026-03-31 08:15`)
- File principali: `docs/change-reports/2026-03-31_0815_dossier-gomme_loop.md`; `docs/continuity-reports/2026-03-31_0815_continuity_dossier-gomme_loop.md`
- Cosa: Chiudere il modulo `Dossier Gomme` della NEXT sulla route `/next/dossier/:targa/gomme` come clone fedele read-only della madre. / runtime ufficiale `Dossier Gomme` riallineato alla stessa base dati visibile della madre
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — Loop `Dossier Rifornimenti` (`2026-03-31 08:20`)
- File principali: `docs/change-reports/2026-03-31_0820_dossier-rifornimenti_loop.md`; `docs/continuity-reports/2026-03-31_0820_continuity_dossier-rifornimenti_loop.md`
- Cosa: Chiudere il modulo `Dossier Rifornimenti` della NEXT sulla route `/next/dossier/:targa/rifornimenti` come clone fedele read-only della madre. / runtime ufficiale `Dossier Rifornimenti` riallineato alla stessa base dati visibile della madre
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — Dossier Mezzo final fix after global audit
- File principali: `docs/change-reports/2026-03-31_1738_dossier-mezzo_final_fix_after_global_audit.md`; `docs/continuity-reports/2026-03-31_1738_continuity_dossier-mezzo_final_fix_after_global_audit.md`
- Cosa: Correggere il falso `CLOSED` di `Dossier Mezzo` emerso dall'audit finale globale V3. / Tracker modulo: `CLOSED`, riallineato al codice reale dopo il falso `CLOSED` emerso dall'audit globale V3.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

## Trasversali/Altro — 23 patch dal 2026-03 al 2026-04

### 2026-03-09 — CHANGE REPORTS
- File principali: `docs/change-reports/README.md`; `docs/continuity-reports/README.md`
- Cosa: tracciare in modo rapido cosa e stato fatto / mantenere continuita tra interventi diversi
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-10 — Registro modifiche clone
- File principali: `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `AGENTS.md`
- Cosa: Istituire il registro ufficiale e permanente delle modifiche del clone `read-only` e renderne obbligatorio l'aggiornamento nel workflow Codex. / Creato il registro centrale del clone con struttura obbligatoria per tutte le future patch.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Apertura clone read-only Colleghi e Fornitori
- File principali: `src/App.tsx`; `src/next/NextCentroControlloPage.tsx`; `src/next/NextColleghiPage.tsx`; `src/next/NextFornitoriPage.tsx`; `src/next/domain/nextColleghiDomain.ts`
- Cosa: Aprire nel clone `/next` i moduli reali `Colleghi` e `Fornitori` con route dedicate, lettura read-only e quick link realmente navigabili. / Punto aperto collegato?
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: INCOMPLETO

### 2026-03-11 — Colleghi e Fornitori clone
- File principali: `docs/continuity-reports/2026-03-11_0636_continuity_next-colleghi-fornitori-clone.md`
- Cosa: route clone / lettura dati reale
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO_CON_VERIFICA_MANCANTE

### 2026-03-11 — Fix regressione letture clone dopo fetch barrier
- File principali: `src/utils/cloneWriteBarrier.ts`; `src/utils/storageSync.ts`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Cosa: Ripristinare le letture del clone restringendo la fetch barrier ai soli endpoint mutanti applicativi noti, senza rollback della protezione no-write gia introdotta. / Punto aperto collegato?
- Impatto: tocca barrier, dati, UI/runtime, documentazione
- Esito: ROLLBACK

### 2026-03-12 — Chat interna controllata
- File principali: `docs/continuity-reports/2026-03-12_2244_continuity_chat-interna-controllata.md`
- Cosa: Stato raggiunto
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-13 — Memoria operativa locale IA
- File principali: `docs/continuity-reports/2026-03-13_0018_continuity_memoria-operativa-locale-ia.md`
- Cosa: Stato raggiunto
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-23 — Titolo intervento
- File principali: `AGENTS.md`; `docs/change-reports/2026-03-23_0706_docs_agents-model-reasoning-rules.md`; `docs/continuity-reports/2026-03-23_0706_continuity_agents-model-reasoning-rules.md`
- Cosa: Rendere obbligatoria in `AGENTS.md` la dichiarazione iniziale di modello/agente e livello di ragionamento nei prompt futuri per Codex, con criteri sintetici di scelta coerenti col progetto.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-24 — 2026-03-24 15:30
- File principali: `docs/continuity-reports/2026-03-24_1530_continuity_pulizia-ui-console-ia-next.md`
- Cosa: Task chiuso. / Evitato di riscrivere in modo distruttivo la pagina: la nuova UI pulita e stata messa in primo piano, mentre lo scaffolding tecnico precedente e stato spostato in un livello collassato.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-30 — Audit finale report 39 vs repo reale
- File principali: `docs/audit/AUDIT_VERIFICA_FINALE_NEXT_AUTONOMA.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/MATRICE_ESECUTIVA_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Cosa: Verificare in modo avversariale se il report finale del prompt 39 corrisponde davvero al codice del repository e se la NEXT e autonoma sul perimetro target. / creato un nuovo audit finale che confronta claim del report 39, route ufficiali NEXT, assenza di runtime madre, layer dati e autonomia reale della NEXT;
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-30 — Riscrittura operativa di AGENTS.md
- File principali: `AGENTS.md`; `docs/change-reports/2026-03-30_0754_riscrittura-agents-operativo.md`; `docs/continuity-reports/2026-03-30_0754_continuity_riscrittura-agents-operativo.md`
- Cosa: rendere `AGENTS.md` piu corto, piu duro e piu operativo, eliminando ambiguita metodologiche su auto-certificazione, chiusura moduli, backlog persistente e separazione execution/audit. / La chiusura modulo ora segue una checklist meccanica: se una voce critica e `NO`, il modulo resta aperto.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — `IA API Key` loop fix
- File principali: `docs/change-reports/2026-03-31_1030_ia-apikey_loop_fix.md`; `docs/continuity-reports/2026-03-31_1030_continuity_ia-apikey_loop_fix.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca dati, UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — 2026-03-31 10:55 - IA Libretto loop fix
- File principali: `docs/continuity-reports/2026-03-31_1055_continuity_ia-libretto_loop_fix.md`
- Cosa: IA Libretto` chiuso nel loop con audit `PASS
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — 2026-03-31 11:16 - IA Documenti loop fix
- File principali: `docs/continuity-reports/2026-03-31_1116_continuity_ia-documenti_loop_fix.md`
- Cosa: IA Documenti` chiuso nel loop con audit `PASS
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — Loop `Colleghi` + `Fornitori
- File principali: `docs/change-reports/2026-03-31_1317_colleghi-fornitori_loop_fix.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-03-31 — Continuity Report
- File principali: `docs/continuity-reports/2026-03-31_1810_continuity_gestione-operativa-route_final_fix_after_global_audit.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-01 — 2026-04-01 21:00
- File principali: `docs/audit/ELENCO_COMPLETO_MODULI_GESTIONALE.md`; `docs/audit/MATRICE_COMPLETA_MODULI_GESTIONALE.md`; `docs/audit/BACKLOG_MODULI_DA_CLASSIFICARE.md`
- Cosa: dettaglio sintetico non normalizzato nei report origine
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-03 — 2026-04-03 14:15
- File principali: `CONTEXT_CLAUDE.md`
- Cosa: Creare `CONTEXT_CLAUDE.md` nella root come contesto tecnico autosufficiente e sintetico del repository, verificato dal codice e dai documenti primari. / creato un file unico con stack, moduli, stato attuale, decisioni architetturali, convenzioni, prossimi task e file chiave;
- Impatto: tocca UI/runtime
- Esito: INCOMPLETO

### 2026-04-09 — 2026-04-09 17:06:51
- File principali: `AGENTS.md`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- Cosa: Creare una cartella unica e stabile `docs/fonti-pronte/` che raccolga le fonti piu importanti del progetto e fissare una regola permanente di sincronizzazione tra file sorgente e copie mirror.
- Impatto: tocca UI/runtime, documentazione
- Esito: FATTO

### 2026-04-09 — 2026-04-09 20:17:10
- File principali: `AGENTS.md`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `CONTEXT_CLAUDE.md`
- Cosa: Riallineare i documenti guida del progetto alla regola architetturale corrente: / madre legacy intoccabile;
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-16 — 2026-04-16 18:44 - audit next libretto save real flow
- File principali: `docs/audit/AUDIT_NEXT_LIBRETTO_SAVE_REAL_FLOW_2026-04-16_1844.md`
- Cosa: NO, NON ALLINEATO ALLA MADRE
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-16 — 2026-04-16 19:34 - audit postpatch next libretto verifica
- File principali: `docs/audit/AUDIT_POSTPATCH_NEXT_LIBRETTO_VERIFICA_2026-04-16_1934.md`
- Cosa: La pagina NEXT contiene il codice applicativo di analyze e save allineato alla madre, ma il barrier blocca ancora `Analyze` in runtime. / Creato audit completo:
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

### 2026-04-16 — 2026-04-16 19:47 - continuity fix clonewritebarrier next ia libretto
- File principali: `docs/continuity-reports/2026-04-16_1947_continuity_fix_clonewritebarrier_next_ia_libretto.md`
- Cosa: Il codice di `NextIALibrettoPage.tsx` era gia allineato alla madre su `Analyze`, ma il runtime clone continuava a bloccare `fetch.runtime` verso `estrazione-libretto`. / Creato audit completo della mappa reale del barrier:
- Impatto: tocca barrier, UI/runtime, documentazione
- Esito: FATTO

## File scartati
- docs/change-reports/2026-03-31_1317_autisti_loop_stop.md
- docs/change-reports/2026-04-01_1145_home-next-ia-modal-layout-viewport-safe.md
- docs/change-reports/2026-04-01_1735_quick-navigation-card-export-default-check.md
- docs/continuity-reports/2026-03-31_1030_continuity_ia-home_loop_audit.md
- docs/continuity-reports/2026-03-31_1218_continuity_cisterna-ia_loop_fix.md
- docs/continuity-reports/2026-03-31_1317_continuity_autisti_loop_stop.md
- docs/continuity-reports/2026-03-31_1317_continuity_colleghi-fornitori_loop_fix.md
- docs/continuity-reports/2026-03-31_1419_continuity_autisti_loop_fix.md
- docs/continuity-reports/2026-03-31_1447_continuity_autisti-inbox-admin_loop_fix.md
- docs/continuity-reports/2026-03-31_1447_continuity_manutenzioni_loop_stop.md
