# STORICO AUDIT COMPRESSO
Data generazione: 2026-04-22
File letti: 119 (docs/audit/)
Voci prodotte: 119
Moduli coperti: Acquisti, Manutenzioni, Euromecc, Magazzino, Lavori, IA interna, Home/Shell, Flotta/Mezzi, Dossier, Trasversali/Altro
Nota: file originali preservati in docs/audit/.

## Acquisti — 34 audit dal 2026-03 al 2026-04

### 2026-03-08 — Centro di Controllo madre e ecosistema collegato
- Perimetro: `Questo audit verifica il modulo madre `CentroControllo` e il suo ecosistema reale nel repository, senza reinterpretarlo e senza proporre patch runtime.`; `confrontare in modo duro il runtime madre con la NEXT attuale;`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/STRUTTURA_COMPLETA_GESTIONALE.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Domande principali: 1. Scopo audit / mappare sorgenti dati, filtri, dipendenze, PDF e moduli a monte/valle;
- Conclusioni chiave: 13. Cosa resta `DA VERIFICARE / Questo audit verifica il modulo madre `CentroControllo` e il suo ecosistema reale nel repository, senza reinterpretarlo e senza proporre patch runtime. / distinguere il modulo dedicato `CentroControllo` dalla `Home` madre, che nel repo reale resta una superficie separata ma sovrapposta;
- Stato: VALIDO

### 2026-03-09 — SINTESI VERIFICA ALLINEAMENTO
- Perimetro: `Incoerenze storiche principali gia intercettate nei docs (eventi autisti doppi, alias route, pattern preventivi multipli).`; `Baseline sicurezza documentata su auth anonima, assenza guard ruolo route-level e mancanza `firestore.rules`.`; `Route canoniche definitive per Dossier e dettaglio ordini.`; `docs/audit/VERIFICA_ALLINEAMENTO_REPO_E_DOCUMENTI.md`; `docs/audit/TABELLA_DIFFERENZE_REPO_DOCS.md`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: nessun verdetto sintetico normalizzato
- Stato: VALIDO

### 2026-03-09 — SINTESI VERIFICA FIREBASE / BACKEND
- Perimetro: `docs/audit/SINTESI_VERIFICA_FIREBASE_BACKEND.md`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: nessun verdetto sintetico normalizzato
- Stato: VALIDO

### 2026-03-09 — TABELLA DIFFERENZE REPO vs DOCS
- Perimetro: `docs/audit/TABELLA_DIFFERENZE_REPO_DOCS.md`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: nessun verdetto sintetico normalizzato
- Stato: VALIDO

### 2026-03-09 — TABELLA VERIFICA FIREBASE / BACKEND
- Perimetro: `docs/audit/TABELLA_VERIFICA_FIREBASE_BACKEND.md`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: nessun verdetto sintetico normalizzato
- Stato: VALIDO

### 2026-03-09 — VERIFICA ALLINEAMENTO REPO E DOCUMENTI
- Perimetro: `Inventario route/pagine da `src/App.tsx`.`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/STRUTTURA_COMPLETA_GESTIONALE.md`; `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`; `docs/architecture/DIAGRAMMA_STRUTTURA_NUOVA_APP.mmd`
- Domande principali: Scopo audit / Verificare l'allineamento tra codice reale del repository e documentazione ufficiale di progetto, identificando differenze, omissioni, incoerenze e punti ancora aperti con prove fino a file/funzione/linee.
- Conclusioni chiave: Perdita di contesto nei passaggi tra chat/task e rischio regressioni su stati UI persistenti.
- Stato: VALIDO

### 2026-03-09 — VERIFICA INFRASTRUTTURA FIREBASE / BACKEND
- Perimetro: `confronto con l'audit precedente in `docs/audit/`.`; `Evidenza principale: `src/utils/storageSync.ts:21-143`.`; `storage/@mezzi_aziendali`: `src/pages/Mezzi.tsx:321-327`, `787-810`; `storage/@lavori`: `src/pages/LavoriDaEseguire.tsx:95-98`, `src/pages/DettaglioLavoro.tsx:23-87`; `storage/@inventario`: `src/pages/Inventario.tsx:68-101`
- Domande principali: 1. Scopo verifica / Verificare in sola lettura cosa il repository dimostra davvero su Firestore, Storage, Functions, IA e PDF.
- Conclusioni chiave: Le policy Firestore deployate sono quindi `DA VERIFICARE`. / Alto: tutta l'app dipende da `storage/<key>` e da collection dedicate senza `firestore.rules` versionate; qualsiasi intervento "alla cieca" puo rompere letture/scritture cross-modulo. / Medio/Alto: `autisti_eventi` resta nel codice come fallback (`src/utils/homeEvents.ts:270-271`) ma il canale canonico attivo non e chiuso a livello repository.
- Stato: VALIDO

### 2026-03-29 — Backlog Residuo NEXT - Execution Tracker
- Perimetro: `Residui che montano ancora runtime madre a fine run:`
- Domande principali: FUORI PERIMETRO`:
- Conclusioni chiave: Stato: IN CORSO / Per ogni modulo residuo si registra: / Vincolo assoluto: niente `NextMotherPage` o wrapper madre come chiusura finale dei moduli residui.
- Stato: VALIDO

### 2026-03-29 — Backlog Ultimi 8 NEXT - Execution Tracker
- Perimetro: `Le route ufficiali dei moduli sopra non montano piu `NextMotherPage` o pagine legacy della madre come runtime finale.`
- Domande principali: Targa 360 / Mezzo360` e `Autista 360` restano `FUORI PERIMETRO`.
- Conclusioni chiave: Stato: CHIUSO / Le route ufficiali dei moduli sopra non montano piu `NextMotherPage` o pagine legacy della madre come runtime finale.
- Stato: VALIDO

### 2026-03-29 — REPORT FINALE PROMPT 33 - PARITA NEXT VS MADRE
- Perimetro: `Targa 360 / Mezzo360`; `Autista 360`; `docs/audit/AUDIT_COMPLETO_PARITA_CLONE_NEXT_VS_MADRE.md`; `docs/audit/AUDIT_CENTRO_DI_CONTROLLO_NEXT.md`; `docs/STATO_ATTUALE_PROGETTO.md`
- Domande principali: 1. Scopo
- Conclusioni chiave: Stato: CURRENT / Il prompt 33 non arriva al `100%` del perimetro target. / Arriva pero alla massima chiusura realistica ottenibile oggi senza toccare la madre:
- Stato: VALIDO

### 2026-03-29 — REPORT FINALE PROMPT 35 - PARITA NEXT VS MADRE
- Perimetro: `Targa 360 / Mezzo360`; `Autista 360`; `docs/audit/REPORT_FINALE_PROMPT_33_PARITA_NEXT.md`; `docs/audit/REPORT_FINALE_PROMPT_34_PARITA_NEXT.md`; `docs/STATO_ATTUALE_PROGETTO.md`
- Domande principali: 1. Scopo
- Conclusioni chiave: Stato: CURRENT / Il prompt 35 non chiude il `100%` del perimetro target. / Chiude davvero `Libretti Export` e rende piu pulito il perimetro autisti/IA/dossier sui punti `storageSync`.
- Stato: VALIDO

### 2026-03-29 — Report Finale Prompt 38 - Svuotamento Backlog Residuo NEXT
- Perimetro: `la route NEXT non monta piu il runtime madre;`; `non restano accessi legacy critici nel runtime finale della route ufficiale.`; `Route ufficiale: `src/next/NextDossierMezzoPage.tsx`; `Route ufficiale: `src/next/NextAnalisiEconomicaPage.tsx`; `Route ufficiale: `src/next/NextMaterialiDaOrdinarePage.tsx`
- Domande principali: Scopo
- Conclusioni chiave: Stato: CHIUSURA PARZIALE VERIFICATA / backlog residuo NON svuotato completamente; / chiusure reali e dimostrate nel run: `Dossier Mezzo`, `Analisi Economica`, `Materiali da ordinare`;
- Stato: VALIDO

### 2026-03-30 — AUDIT CENTRO DI CONTROLLO NEXT
- Perimetro: `Verificare cosa mostra davvero la route ufficiale `/next/centro-controllo`.`; `Distinguere il runtime reale della route ufficiale dalla superficie alternativa `NextCentroControlloPage.tsx`.`; `src/App.tsx`; `src/next/NextCentroControlloClonePage.tsx`; `src/next/NextCentroControlloPage.tsx`
- Domande principali: 1. Scopo audit / Verificare cosa mostra davvero la route ufficiale `/next/centro-controllo`.
- Conclusioni chiave: il modulo ufficiale non passa ancora dal layer D10 che il repo presenta come disponibile; / Verificare cosa mostra davvero la route ufficiale `/next/centro-controllo`. / Distinguere il runtime reale della route ufficiale dalla superficie alternativa `NextCentroControlloPage.tsx`.
- Stato: VALIDO

### 2026-03-30 — AUDIT FINALE POST PROMPT 42 - NEXT AUTONOMA
- Perimetro: `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/MATRICE_ESECUTIVA_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md`
- Domande principali: 1. Scopo audit / verificare il prompt 42 contro il codice reale e non contro il suo report esecutivo;
- Conclusioni chiave: Stato: CURRENT / Verdetto obbligatorio: `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`. / Motivo:
- Stato: VALIDO

### 2026-03-30 — BACKLOG GAP PARZIALI EXECUTION
- Perimetro: `Backlog esecutivo persistente dei soli moduli `PARZIALI` emersi da `docs/audit/AUDIT_FINALE_POST_PROMPT_42_NEXT_AUTONOMA.md`.`
- Domande principali: Scopo / I moduli `DA VERIFICARE` del perimetro target restano fuori da questo run.
- Conclusioni chiave: I moduli `DA VERIFICARE` del perimetro target restano fuori da questo run.
- Stato: VALIDO

### 2026-03-30 — Report Finale - Prompt 36 - Ricostruzione residui clone/NEXT
- Perimetro: `Targa 360 / Mezzo360`; `Autista 360`; `File ufficiale nuovo: `src/next/NextCentroControlloParityPage.tsx`; `La pagina NEXT usa ancora runtime madre? `NO`; `rimossa la route ufficiale da `NextCentroControlloClonePage`
- Domande principali: Obiettivo
- Conclusioni chiave: Modulo chiuso davvero in questo run / Chiusura reale ottenuta: `Centro di Controllo / Nessun altro modulo residuo viene dichiarato chiuso in questo report
- Stato: VALIDO

### 2026-03-30 — Report Finale - Prompt 37 - Ricostruzione Home e Capo nel clone/NEXT
- Perimetro: `Targa 360 / Mezzo360`; `Autista 360`; `src/next/NextHomePage.tsx`; `src/next/NextCentroControlloPage.tsx`; `src/next/domain/nextCentroControlloDomain.ts`
- Domande principali: Obiettivo
- Conclusioni chiave: Stato iniziale: `APERTO / Chiusure reali ottenute: `Home`, `Capo / Chiusure gia presenti e confermate: `Centro di Controllo` e tutti i moduli gia segnati `PARI E PULITO` nei report precedenti
- Stato: VALIDO

### 2026-03-31 — AUDIT FINALE GLOBALE NEXT POST LOOP V3
- Perimetro: `AGENTS.md`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/MATRICE_ESECUTIVA_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Domande principali: Ambito: perimetro target NEXT dopo i fix finali `Autisti`, `Autisti Inbox / Admin` e `Dossier Mezzo
- Conclusioni chiave: Verdetto ufficiale attuale: / Anche con tracker tutto `CLOSED`, il codice reale mostra ancora un percorso ufficiale NEXT che puo integrare overlay clone-only nei dati visibili. / Questo basta a far fallire il criterio globale:
- Stato: SUPERATO_DA_AUDIT_FINALE_GLOBALE_NEXT_POST_LOOP_V4

### 2026-03-31 — AUDIT LOOP - `Capo Costi
- Perimetro: `Route verificata:`; `Fonti runtime verificate:`; `src/next/NextCapoCostiMezzoPage.tsx`; `src/next/domain/nextCapoDomain.ts`; `src/next/domain/nextDocumentiCostiDomain.ts`
- Domande principali: Gap aperti nel perimetro `Capo Costi`: nessuno
- Conclusioni chiave: PASS / Modulo: `Capo Costi / Route ufficiale NEXT autonoma:
- Stato: VALIDO

### 2026-03-31 — AUDIT LOOP `Acquisti / Ordini / Preventivi / Listino
- Perimetro: `Route ufficiali verificate: `/next/acquisti`, `/next/ordini-in-attesa`, `/next/ordini-arrivati`, `/next/dettaglio-ordine/:ordineId`; `Runtime ufficiale verificato: `src/next/NextProcurementStandalonePage.tsx`, `src/next/NextProcurementReadOnlyPanel.tsx`; `Le route ufficiali del gruppo montano solo wrapper NEXT (`NextAcquistiPage`, `NextOrdiniInAttesaPage`, `NextOrdiniArrivatiPage`, `NextDettaglioOrdinePage`) che delegano a `NextProcurementStandalonePage`, non `NextMotherPage` o `src/pages/Acquisti.tsx`.`; `NextProcurementStandalonePage` legge il dataset reale del gruppo tramite `readNextProcurementSnapshot({ includeCloneOverlays: false })`, quindi senza overlay clone-only nella route ufficiale.`; `nextProcurementDomain` continua a supportare overlay opzionali solo per consumer legacy espliciti, ma il runtime ufficiale del gruppo li spegne; `@ordini`, `@preventivi`, `@preventivi_approvazioni` e `@listino_prezzi` restano letti tramite il layer D06 pulito.`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Esito audit: `PASS / Route NEXT autonome senza runtime finale madre: `PASS / UI pratica equivalente alla madre: `PASS
- Stato: VALIDO

### 2026-03-31 — AUDIT LOOP `Gestione Operativa` route ufficiale
- Perimetro: `AUDIT LOOP `Gestione Operativa` route ufficiale`; `Route ufficiale verificata: `/next/gestione-operativa`; `Runtime ufficiale verificato: `src/next/NextGestioneOperativaPage.tsx`; `src/App.tsx` monta la route ufficiale `/next/gestione-operativa` su `NextGestioneOperativaPage`, non su `NextMotherPage` o `src/pages/GestioneOperativa.tsx`.`; `useNextOperativitaSnapshot()` continua a orchestrare il caricamento del runtime ufficiale senza introdurre writer o side effect.`
- Domande principali: Modali principali: `PASS` (`nessuno` nel perimetro route)
- Conclusioni chiave: Esito audit: `PASS / Route NEXT autonoma senza runtime finale madre: `PASS / UI pratica equivalente alla madre: `PASS
- Stato: VALIDO

### 2026-03-31 — AUDIT LOOP `Materiali consegnati
- Perimetro: `Route ufficiale verificata: `/next/materiali-consegnati`; `Runtime ufficiale verificato: `src/next/NextMaterialiConsegnatiPage.tsx`; `La route ufficiale `/next/materiali-consegnati` monta `NextMaterialiConsegnatiPage`, non `NextMotherPage` o `src/pages/MaterialiConsegnati.tsx`.`; `Il runtime ufficiale replica ora la superficie madre su header, pulsanti PDF, form nuova consegna, suggerimenti destinatario/materiale, lista destinatari, dettaglio storico e modale `Anteprima PDF`.`; `NextMaterialiConsegnatiPage` legge `@materialiconsegnati` tramite `readNextMaterialiMovimentiSnapshot({ includeCloneOverlays: false })`, quindi senza overlay clone-only nella route ufficiale.`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Esito audit: `PASS / Route NEXT autonoma senza runtime finale madre: `PASS / UI pratica equivalente alla madre: `PASS
- Stato: VALIDO

### 2026-03-31 — AUDIT LOOP `Materiali da ordinare
- Perimetro: `Route ufficiale verificata: `/next/materiali-da-ordinare`; `Runtime ufficiale verificato: `src/next/NextMaterialiDaOrdinarePage.tsx`; `La route ufficiale `/next/materiali-da-ordinare` monta `NextMaterialiDaOrdinarePage`, non `NextMotherPage` o `src/pages/MaterialiDaOrdinare.tsx`.`; `Il runtime ufficiale replica ora la superficie madre su header, tab, form fabbisogni, tabella materiali, placeholder panel, sticky action bar e modale placeholder.`; `NextMaterialiDaOrdinarePage` legge i fornitori reali tramite `readNextFornitoriSnapshot({ includeCloneOverlays: false })`, quindi senza overlay clone-only nella route ufficiale.`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Esito audit: `PASS / Route NEXT autonoma senza runtime finale madre: `PASS / UI pratica equivalente alla madre: `PASS
- Stato: VALIDO

### 2026-03-31 — BACKLOG - `Capo Costi
- Perimetro: `Route target:`; `src/next/NextCapoCostiMezzoPage.tsx` usava `upsertNextCapoCloneApproval()` per salvare approvazioni locali clone-only.`; `src/next/domain/nextCapoDomain.ts` leggeva `@preventivi_approvazioni` sovrapponendo override clone-only locali.`; `src/next/domain/nextDocumentiCostiDomain.ts` includeva documenti clone-only locali nel dataset ufficiale.`; `src/next/NextCapoCostiMezzoPage.tsx`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Modulo target: `Capo Costi / NextCapoCostiMezzoPage` generava `ANTEPRIMA TIMBRATO` locale clone-side invece di restare read-only esplicito.
- Stato: VALIDO

### 2026-03-31 — BACKLOG `Acquisti / Ordini / Preventivi / Listino
- Perimetro: `Route ufficiali NEXT autonome senza runtime finale madre.`; `UI pratica, CTA, placeholder e superfici esterne equivalenti alla madre nel suo ramo procurement read-only.`; `Nessuna scrittura reale attiva e nessuna scrittura locale clone-only nel runtime ufficiale.`; `Lettura dei dati reali sopra layer NEXT pulito D06, con opt-out esplicito degli overlay locali sugli ordini.`; `Route: `/next/acquisti`, `/next/ordini-in-attesa`, `/next/ordini-arrivati`, `/next/dettaglio-ordine/:ordineId`
- Domande principali: src/next/domain/nextProcurementDomain.ts` supporta la lettura ufficiale senza overlay clone-only; la route ufficiale la usa con `includeCloneOverlays: false`, mentre i reason di navigabilita e le limitations tornano coerenti al perimetro read-only della madre.
- Conclusioni chiave: Esito audit separato: `PASS / Modulo: `Acquisti / Ordini / Preventivi / Listino / src/next/NextProcurementStandalonePage.tsx` non usa piu scaffold clone-only o snapshot operativita globale: la route ufficiale legge `readNextProcurementSnapshot({ includeCloneOverlays: false })` e riallinea il routing delle tab alle route ufficiali del gruppo.
- Stato: VALIDO

### 2026-03-31 — BACKLOG `Gestione Operativa` route ufficiale
- Perimetro: `Runtime finale NEXT autonomo, senza mount madre come runtime finale.`; `UI pratica della madre conservata su header hub, badge, preview e navigazione verso i moduli figli.`; `Nessuna scrittura reale attiva e nessuna scrittura clone-only attiva sulla route ufficiale.`; `Nessun cambio ai default condivisi oltre il path ufficiale corretto.`; `BACKLOG `Gestione Operativa` route ufficiale`
- Domande principali: Nessun gap aperto nel perimetro della route ufficiale
- Conclusioni chiave: Stato finale nel run: `PASS` sulla route ufficiale / BACKLOG `Gestione Operativa` route ufficiale / Modulo: `Gestione Operativa` (`route ufficiale`)
- Stato: VALIDO

### 2026-03-31 — BACKLOG `Materiali consegnati
- Perimetro: `Route ufficiale NEXT autonoma senza runtime finale madre.`; `UI pratica, CTA, placeholder e validazioni visibili equivalenti alla madre.`; `Nessuna scrittura reale attiva e nessuna scrittura locale clone-only nel runtime ufficiale.`; `Lettura dei dati reali sopra layer NEXT puliti, con opt-out esplicito degli overlay locali solo sulla route ufficiale.`; `Route: `/next/materiali-consegnati`
- Domande principali: Nessun gap aperto nel perimetro `Materiali consegnati
- Conclusioni chiave: Esito audit separato: `PASS / Modulo: `Materiali consegnati / Il runtime ufficiale non usa piu `appendNextMaterialiMovimentiCloneRecord()`, `markNextMaterialiMovimentiCloneDeleted()` o `upsertNextInventarioCloneRecord()`: `Registra consegna` ed `Elimina` restano visibili ma bloccati con messaggio read-only esplicito.
- Stato: VALIDO

### 2026-03-31 — BACKLOG `Materiali da ordinare
- Perimetro: `Route ufficiale NEXT autonoma senza runtime finale madre.`; `UI pratica, CTA, tab, placeholder e modale equivalenti alla madre.`; `Nessuna scrittura reale attiva e nessuna scrittura locale clone-only nel runtime ufficiale.`; `Lettura dei dati reali sopra layer NEXT puliti, con opt-out esplicito degli overlay locali sui fornitori.`; `Route: `/next/materiali-da-ordinare`
- Domande principali: Nessun gap aperto nel perimetro `Materiali da ordinare
- Conclusioni chiave: Esito audit separato: `PASS / Modulo: `Materiali da ordinare / src/next/NextMaterialiDaOrdinarePage.tsx` non usa piu `appendNextProcurementCloneOrder()` ne writer locali su preventivi, righe materiali o note: la superficie madre resta intatta ma il runtime ufficiale non simula piu workflow clone-only.
- Stato: VALIDO

### 2026-04-01 — Audit Procurement - Moduli rimovibili NEXT
- Perimetro: `Audit solo su codice reale, senza patch runtime.`; `src/App.tsx`; `src/next/NextMaterialiDaOrdinarePage.tsx`; `src/next/NextOrdiniInAttesaPage.tsx`; `src/next/NextOrdiniArrivatiPage.tsx`
- Domande principali: 1. Scopo audit / Verificare in modo definitivo se i moduli NEXT `Ordini in attesa`, `Ordini arrivati` e `Dettaglio ordine`:
- Conclusioni chiave: 8. Punti DA VERIFICARE / esistenza di una route non basta per considerare vivo un modulo; / un modulo e ancora necessario se ha ingressi, navigate, import o mount reali che lo tengono nel flusso;
- Stato: VALIDO

### 2026-04-01 — Audit procurement: padre vs sottomoduli
- Perimetro: `Verifica delle route ufficiali in [src/App.tsx](c:/progetti/gestioneweb/src/App.tsx).`; `Lettura dei runtime madre:`; `[src/pages/Acquisti.tsx](c:/progetti/gestioneweb/src/pages/Acquisti.tsx)`; `[src/pages/MaterialiDaOrdinare.tsx](c:/progetti/gestioneweb/src/pages/MaterialiDaOrdinare.tsx)`; `[src/pages/OrdiniInAttesa.tsx](c:/progetti/gestioneweb/src/pages/OrdiniInAttesa.tsx)`
- Domande principali: Scopo audit / Verificare, su base codice reale, se nella madre e nella NEXT `Materiali da ordinare` abbia ormai sostituito il flusso procurement composto da `Ordini in attesa`, `Ordini arrivati` e `Dettaglio ordine`, oppure se questi ingressi restino vivi e autonomi.
- Conclusioni chiave: In [src/pages/Acquisti.tsx](c:/progetti/gestioneweb/src/pages/Acquisti.tsx) il modulo si presenta esplicitamente come `Modulo unico: ordine materiali, liste ordini e dettaglio ordine.` e gestisce: / le altre tab mostrano `Sezione read-only in arrivo...`; / Ordini | read-only
- Stato: VALIDO

### 2026-04-01 — Backlog decisione procurement NEXT
- Perimetro: `Se `/next/acquisti` debba restare anche come ingresso visibile secondario in `Navigazione rapida` o soltanto come route tecnica di appoggio.`
- Domande principali: Punti `DA VERIFICARE
- Conclusioni chiave: Punti `DA VERIFICARE / Acquisti` (`/next/acquisti`) solo come workbench procurement secondario per deep link, IA o contesto read-only, non come card top-level. / Se il lavoro futuro sul procurement NEXT debba convergere davvero in un unico modulo padre completo o mantenere la separazione attuale tra `Materiali da ordinare` e workbench read-only.
- Stato: VALIDO

### 2026-04-01 — Backlog procurement - da rimuovere o declassare
- Perimetro: `Nessuno, nello stato attuale del runtime NEXT`; `Verificare se esistono consumer esterni al perimetro NEXT che aprono ancora direttamente le route procurement secondarie.`
- Domande principali: Verificare se esistono consumer esterni al perimetro NEXT che aprono ancora direttamente le route procurement secondarie. / Punti DA VERIFICARE
- Conclusioni chiave: Punti DA VERIFICARE
- Stato: VALIDO

### 2026-04-01 — Matrice procurement - rimozione NEXT
- Perimetro: `docs/audit/MATRICE_PROCUREMENT_RIMOZIONE_NEXT.md`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Matrice procurement - rimozione NEXT
- Stato: VALIDO

### 2026-04-01 — Matrice procurement: ingressi e flussi
- Perimetro: `docs/audit/MATRICE_PROCUREMENT_INGRESSI_E_FLUSSI.md`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Matrice procurement: ingressi e flussi
- Stato: VALIDO

## Manutenzioni — 10 audit dal 2026-03 al 2026-04

### 2026-03-30 — AUDIT FINALE MODULI `DA VERIFICARE` - NEXT AUTONOMA
- Perimetro: `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/MATRICE_ESECUTIVA_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md`
- Domande principali: 1. Scopo audit / AUDIT FINALE MODULI `DA VERIFICARE` - NEXT AUTONOMA
- Conclusioni chiave: AUDIT FINALE MODULI `DA VERIFICARE` - NEXT AUTONOMA / Verdetto obbligatorio: / NO, NEXT non ancora lavorabile in autonomia sul perimetro target
- Stato: VALIDO

### 2026-03-30 — Backlog Execution - Prompt 49
- Perimetro: `Verifica live del dataset Firestore `@manutenzioni` da CLI non disponibile nel contesto corrente per `permission-denied`; il controllo finale sul mismatch e quindi chiuso a livello di codice/runtime NEXT e di sweep UI.`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Verifica live del dataset Firestore `@manutenzioni` da CLI non disponibile nel contesto corrente per `permission-denied`; il controllo finale sul mismatch e quindi chiuso a livello di codice/runtime NEXT e di sweep UI.
- Stato: VALIDO

### 2026-03-31 — AUDIT centro-di-controllo LOOP
- Perimetro: `AGENTS.md`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/MATRICE_ESECUTIVA_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Domande principali: nessuno nel perimetro `Centro di Controllo` verificato in questo ciclo. / Come verificare
- Conclusioni chiave: esito audit finale del ciclo: `PASS / NOT_STARTED / Gap reali emersi nella verifica del runtime ufficiale:
- Stato: VALIDO

### 2026-03-31 — AUDIT FINALE GLOBALE NEXT POST LOOP
- Perimetro: `AGENTS.md`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/MATRICE_ESECUTIVA_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Domande principali: Scope: verifica finale del perimetro NEXT dopo il loop modulo-per-modulo
- Conclusioni chiave: Verdetto finale: `NO, NEXT non ancora lavorabile in autonomia sul perimetro target / NO, NEXT non ancora lavorabile in autonomia sul perimetro target / Scope: verifica finale del perimetro NEXT dopo il loop modulo-per-modulo
- Stato: VALIDO

### 2026-03-31 — AUDIT FINALE GLOBALE NEXT POST LOOP V2
- Perimetro: `AGENTS.md`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/MATRICE_ESECUTIVA_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Domande principali: Verdetto finale: `NO, NEXT non ancora lavorabile in autonomia sul perimetro target
- Conclusioni chiave: Scope: riesecuzione del verdetto globale dopo il fix finale separato del modulo `Autisti / NO, NEXT non ancora lavorabile in autonomia sul perimetro target / nel runtime ufficiale non risultano piu navigazioni residue verso `/autisti/*
- Stato: SUPERATO_DA_AUDIT_FINALE_GLOBALE_NEXT_POST_LOOP_V4

### 2026-03-31 — AUDIT LOOP - Manutenzioni
- Perimetro: `La route ufficiale `/next/manutenzioni` monta `src/next/NextManutenzioniPage.tsx`, non `NextMotherPage` o `src/pages/Manutenzioni.tsx`.`; `src/next/NextManutenzioniPage.tsx` non usa piu `NextClonePageScaffold` e replica la superficie pratica della madre su:`; `Il runtime ufficiale legge:`; `@manutenzioni` e `@mezzi_aziendali` tramite `readNextManutenzioniWorkspaceSnapshot()` in `src/next/domain/nextManutenzioniDomain.ts`; `Il runtime ufficiale non usa `setItemSync`, `getItemSync`, `generateSmartPDF`, writer clone-only o export locali.`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Esito: `PASS / Modulo: `Manutenzioni / La route ufficiale `/next/manutenzioni` monta `src/next/NextManutenzioniPage.tsx`, non `NextMotherPage` o `src/pages/Manutenzioni.tsx`.
- Stato: VALIDO

### 2026-03-31 — BACKLOG Manutenzioni
- Perimetro: `Route ufficiale NEXT:`; `RISOLTO` `src/next/NextManutenzioniPage.tsx` non usa piu `NextClonePageScaffold` e replica la superficie pratica della madre su form, storico, materiali, modal gomme e CTA principali.`; `RISOLTO` la route ufficiale legge `@manutenzioni` e `@mezzi_aziendali` tramite `readNextManutenzioniWorkspaceSnapshot()` e `@inventario` tramite `readNextInventarioSnapshot({ includeCloneOverlays: false })`.`; `src/next/NextManutenzioniPage.tsx`; `src/next/domain/nextManutenzioniDomain.ts`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Modulo target: `Manutenzioni / Route ufficiale NEXT: / RISOLTO` la route ufficiale legge `@manutenzioni` e `@mezzi_aziendali` tramite `readNextManutenzioniWorkspaceSnapshot()` e `@inventario` tramite `readNextInventarioSnapshot({ includeCloneOverlays: false })`.
- Stato: VALIDO

### 2026-04-07 — AUDIT TECNICO - Manutenzioni attuale vs spec modulo sostitutivo NEXT
- Perimetro: `Audit e documentazione soltanto.`; `Nessuna patch runtime.`; `Verificati codice legacy reale, runtime NEXT ufficiale, domain NEXT collegati e dipendenze dirette/indirette del dataset `@manutenzioni`.`; `Il prompt indica `docs/specs/NEXT_MANUTENZIONI_MAPPA_STORICO_SPEC.md`.`; `Il contenuto effettivamente presente e usato per il confronto e `docs/SPEC_MAPPA_STORICO_MANUTENZIONI_NEXT.md`.`
- Domande principali: Perimetro verificato / la spec a 5 categorie (`trattore`, `motrice_2assi`, `motrice_3assi`, `rimorchio`, `semirimorchio`) non e dimostrata 1:1 dal contratto corrente e resta `DA VERIFICARE` sui valori reali di `categoria`.
- Conclusioni chiave: La persistenza reale passa da `src/utils/storageSync.ts`. / AUDIT TECNICO - Manutenzioni attuale vs spec modulo sostitutivo NEXT / Modulo: `Manutenzioni
- Stato: VALIDO

### 2026-04-09 — AUDIT PROFONDO MANUTENZIONI NEXT CROSS-MODULO
- Perimetro: `Modalita: audit strutturale, nessuna patch runtime`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- Domande principali: Perimetro patch consentito in questo run: solo documentazione audit/stato / Verificare sul codice reale del repo se il modulo NEXT `Manutenzioni` e i suoi collegamenti con `Dossier`, `App Autisti`, `Quadro manutenzioni PDF`, `Dettaglio` e boundary NEXT vs madre restano coerenti dopo i cambi recenti su gomme ordinarie/straordinarie, dettaglio pulito e PDF.
- Conclusioni chiave: Stato: `PARZIALE / Manutenzioni NEXT` -> `PARZIALE / Dettaglio` -> `PARZIALE
- Stato: VALIDO

### 2026-04-16 — AUDIT FLUSSO LIBRETTO MADRE COMPLETO
- Perimetro: `Perimetro verificato: route legacy, UI, chiamata di estrazione, associazione mezzo, salvataggio su Firestore/Storage, lettori downstream collegati.`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- Domande principali: SCOPO / docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md
- Conclusioni chiave: FLUSSO COMPLETO PASSO-PASSO / Parte ricostruita in modo forte dal repo: / route legacy e ingressi reali;
- Stato: VALIDO

## Magazzino — 6 audit dal 2026-03 al 2026-04

### 2026-03-31 — AUDIT LOOP - `IA Documenti
- Perimetro: `Route verificata:`; `Fonti runtime verificate:`; `src/next/NextIADocumentiPage.tsx`; `src/next/domain/nextDocumentiCostiDomain.ts`; `src/next/domain/nextIaConfigDomain.ts`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Esito audit finale / Modulo: `IA Documenti / Verdetto: `PASS
- Stato: VALIDO

### 2026-03-31 — AUDIT LOOP `Inventario
- Perimetro: `Route ufficiale verificata: `/next/inventario`; `Runtime ufficiale verificato: `src/next/NextInventarioPage.tsx`; `La route ufficiale `/next/inventario` monta `NextInventarioPage`, non `NextMotherPage` o `src/pages/Inventario.tsx`.`; `Il runtime ufficiale replica ora la superficie madre su header, pulsanti PDF, form inserimento, suggerimenti fornitore, lista articoli, controlli quantita, bottoni `Elimina` / `Modifica`, modale modifica e modale `Anteprima PDF`.`; `NextInventarioPage` legge `@inventario` tramite `readNextInventarioSnapshot({ includeCloneOverlays: false })`, quindi senza overlay clone-only nella route ufficiale.`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Esito audit: `PASS / Route NEXT autonoma senza runtime finale madre: `PASS / UI pratica equivalente alla madre: `PASS
- Stato: VALIDO

### 2026-03-31 — BACKLOG - `IA Documenti
- Perimetro: `Route target:`; `src/next/NextIADocumentiPage.tsx` era ancora clone-specifica con `NextClonePageScaffold`, preview legacy, handoff dedicato e writer clone-only.`; `Il runtime ufficiale usava `upsertNextInternalAiCloneDocumento()` e `upsertNextInventarioCloneRecord()` per salvare documenti/materiali solo nel clone.`; `src/next/NextIADocumentiPage.tsx`; `src/next/domain/nextDocumentiCostiDomain.ts`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Modulo target: `IA Documenti / Il runtime ufficiale usava `upsertNextInternalAiCloneDocumento()` e `upsertNextInventarioCloneRecord()` per salvare documenti/materiali solo nel clone.
- Stato: VALIDO

### 2026-03-31 — BACKLOG `Inventario
- Perimetro: `Route ufficiale NEXT autonoma senza runtime finale madre.`; `UI pratica, CTA, modale modifica, placeholder e validazioni visibili equivalenti alla madre.`; `Nessuna scrittura reale attiva e nessuna scrittura locale clone-only nel runtime ufficiale.`; `Lettura dei dati reali sopra layer NEXT puliti, con opt-out esplicito degli overlay locali solo sulla route ufficiale.`; `Route: `/next/inventario`
- Domande principali: Nessun gap aperto nel perimetro `Inventario
- Conclusioni chiave: Stato iniziale nel run: `FAIL / Modulo: `Inventario / Esito audit separato: `PASS
- Stato: VALIDO

### 2026-04-09 — AUDIT MAGAZZINO NEXT VS MADRE - LOGICA DOMINIO
- Perimetro: `src/pages/Inventario.tsx`; `src/pages/MaterialiConsegnati.tsx`; `src/next/NextMagazzinoPage.tsx`; `RUNTIME PATCH: nessuna`; `Ricostruire la logica reale della madre per `Inventario` e `MaterialiConsegnati`, mappare i dataset e i collegamenti cross-modulo, e confrontare questi fatti con il nuovo modulo unificato `src/next/NextMagazzinoPage.tsx`.`
- Domande principali: 1. Obiettivo / Ricostruire la logica reale della madre per `Inventario` e `MaterialiConsegnati`, mappare i dataset e i collegamenti cross-modulo, e confrontare questi fatti con il nuovo modulo unificato `src/next/NextMagazzinoPage.tsx`.
- Conclusioni chiave: non integra i flussi ordine/arrivi, IA documenti o manutenzioni oltre la compatibilita passiva del dataset / Inventario logica madre` -> `COPERTO / la logica reale e stata ricostruita dal codice
- Stato: VALIDO

### 2026-04-10 — AUDIT FINALE MAGAZZINO NEXT - DOMINIO COMPLETO
- Perimetro: `route e wiring reali di `/next/magazzino`; `src/next/NextMagazzinoPage.tsx`; `domain NEXT collegati a inventario, materiali, dossier, costi e procurement`; `RUNTIME PATCH: nessuna`; `src/App.tsx`
- Domande principali: 1. Obiettivo / Verificare se il dominio reale oggi collegato a `/next/magazzino` possa essere considerato chiuso nella NEXT.
- Conclusioni chiave: Verificare se il dominio reale oggi collegato a `/next/magazzino` possa essere considerato chiuso nella NEXT. / /next/magazzino` monta davvero `NextMagazzinoPage.tsx` come ingresso pubblico canonico del dominio. / /next/inventario` e `/next/materiali-consegnati` in `src/App.tsx` sono solo redirect `replace` verso `/next/magazzino?tab=...`.
- Stato: VALIDO

## Lavori — 2 audit dal 2026-03 al 2026-03

### 2026-03-31 — AUDIT LOOP - `Lavori
- Perimetro: `Route verificate:`; `Fonti runtime verificate:`; `src/next/NextLavoriDaEseguirePage.tsx`; `src/next/NextLavoriInAttesaPage.tsx`; `src/next/NextLavoriEseguitiPage.tsx`
- Domande principali: Gap aperti nel perimetro `Lavori`: nessuno
- Conclusioni chiave: PASS / Modulo: `Lavori / Le route ufficiali montano runtime `src/next/*` e non `NextMotherPage` o `src/pages/**` come runtime finale.
- Stato: VALIDO

### 2026-03-31 — BACKLOG - `Lavori
- Perimetro: `Route target:`; `src/next/NextLavoriDaEseguirePage.tsx` esponeva scaffold e append clone-only (`appendNextLavoriCloneRecords`) invece della superficie pratica della madre.`; `src/next/NextLavoriInAttesaPage.tsx` e `src/next/NextLavoriEseguitiPage.tsx` non replicavano la UI madre su accordion, PDF e navigazione dettaglio.`; `src/next/NextDettaglioLavoroPage.tsx` usava overlay clone-only (`upsertNextLavoriCloneOverride`, `markNextLavoriCloneDeleted`) su edit, esegui ed elimina.`; `src/next/domain/nextLavoriDomain.ts` mescolava per default overlay locali del clone al dataset reale `@lavori`.`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Modulo target: `Lavori / src/next/NextDettaglioLavoroPage.tsx` usava overlay clone-only (`upsertNextLavoriCloneOverride`, `markNextLavoriCloneDeleted`) su edit, esegui ed elimina. / src/next/domain/nextLavoriDomain.ts` mescolava per default overlay locali del clone al dataset reale `@lavori`.
- Stato: VALIDO

## IA interna — 24 audit dal 2026-03 al 2026-04

### 2026-03-29 — AUDIT COMPLETO PARITA CLONE/NEXT VS MADRE
- Perimetro: `Madre intoccabile.`; `Conta piu il codice runtime reale del repo che la documentazione descrittiva.`; `La route ufficiale `/next/*` vale piu di superfici alternative non agganciate a `src/App.tsx`.`; `Una pagina clone fedele ma ancora attaccata a letture/logiche legacy/raw viene classificata `PARI MA RAW`, non `PARI`.`; `Una pagina custom pulita ma con copertura funzionale minore della madre viene classificata `PARZIALE`.`
- Domande principali: Perimetro: clone/NEXT ufficiale sotto `src/next/*` confrontato con le route madre in `src/App.tsx` e con le pagine legacy reali. / Verificare nel codice reale del repository quali moduli del clone/NEXT sono gia a parita con la madre.
- Conclusioni chiave: Stato: CURRENT / VERDETTO`: il clone/NEXT non e oggi a parita `100%` con la madre. Lo stato reale emerso dal repository e ibrido: / copertura clone-fedele ampia su molte route ufficiali;
- Stato: VALIDO

### 2026-03-29 — REPORT FINALE PROMPT 34 - PARITA NEXT VS MADRE
- Perimetro: `Targa 360 / Mezzo360`; `Autista 360`; `Chiudere altri gap reali del clone/NEXT senza toccare la madre, portando nel solo `src/next/*` nuove superfici a comportamento madre-like sopra layer NEXT puliti.`; `docs/audit/REPORT_FINALE_PROMPT_33_PARITA_NEXT.md`; `docs/STATO_ATTUALE_PROGETTO.md`
- Domande principali: 1. Scopo
- Conclusioni chiave: Stato: CURRENT / Il prompt 34 chiude davvero altre 5 superfici senza toccare la madre. / Il clone non e ancora al `100%` del perimetro target.
- Stato: VALIDO

### 2026-03-29 — Report Finale Prompt 39 - Chiusura Ultimi 8 Moduli NEXT
- Perimetro: `Targa 360 / Mezzo360`; `Autista 360`; `Svuotare il backlog residuo del clone/NEXT sui moduli ancora aperti, eliminando i wrapper finali della madre e confermando la chiusura solo dove la route ufficiale non monta piu il runtime legacy come soluzione finale.`; `la route NEXT non monta piu `NextMotherPage` o pagine madre come runtime finale;`; `sotto il modulo usa domain NEXT puliti o bridge clone-safe espliciti;`
- Domande principali: Scopo
- Conclusioni chiave: Stato: CHIUSURA VERIFICATA / Svuotare il backlog residuo del clone/NEXT sui moduli ancora aperti, eliminando i wrapper finali della madre e confermando la chiusura solo dove la route ufficiale non monta piu il runtime legacy come soluzione finale. / Un modulo e considerato chiuso solo se:
- Stato: VALIDO

### 2026-03-30 — Audit Finale Conclusivo NEXT Autonoma
- Perimetro: `Documenti:`; `AGENTS.md`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- Domande principali: 1. Scopo audit / Verificare nel codice reale, dopo i prompt 42-46, se la NEXT sia davvero lavorabile in autonomia sul perimetro target.
- Conclusioni chiave: Dare un solo verdetto finale netto: / NO, NEXT non ancora lavorabile in autonomia sul perimetro target / Motivo netto:
- Stato: VALIDO

### 2026-03-30 — AUDIT VERIFICA FINALE NEXT AUTONOMA
- Perimetro: `Madre intoccabile.`; `Conta piu il codice reale del repo che i report precedenti.`; `Targa 360 / Mezzo360` e `Autista 360` restano `FUORI PERIMETRO`.`; `Un modulo e considerato chiuso solo se:`; `la route ufficiale NEXT non monta runtime madre;`
- Domande principali: 1. Scopo audit / Verificare se `docs/audit/REPORT_FINALE_PROMPT_39_CHIUSURA_ULTIMI_8.md` corrisponde davvero al codice del repository.
- Conclusioni chiave: Stato: CURRENT / Il claim "perimetro target chiuso" e `FALSO`. / Il claim "ultimi 8 moduli davvero chiusi" e `FALSO`.
- Stato: VALIDO

### 2026-03-30 — BACKLOG GAP AUDIT FINALE EXECUTION
- Perimetro: `Fonte unica: `docs/audit/AUDIT_VERIFICA_FINALE_NEXT_AUTONOMA.md`; `Tenere solo modulo/route target, stato iniziale, stato finale, blocchi reali, path precisi.`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Tenere solo modulo/route target, stato iniziale, stato finale, blocchi reali, path precisi.
- Stato: VALIDO

### 2026-03-31 — AUDIT FINALE GLOBALE NEXT POST LOOP V4
- Perimetro: `AGENTS.md`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/MATRICE_ESECUTIVA_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Domande principali: Verdetto finale: `NO, NEXT non ancora lavorabile in autonomia sul perimetro target
- Conclusioni chiave: Verdetto finale: `NO, NEXT non ancora lavorabile in autonomia sul perimetro target / NO, NEXT non ancora lavorabile in autonomia sul perimetro target / Nota: il tracker include anche la correzione extra-tracker gia auditata sulla route ufficiale `/next/gestione-operativa
- Stato: VALIDO

### 2026-03-31 — AUDIT GENERALE TOTALE NEXT VS MADRE
- Perimetro: `Documenti:`; `AGENTS.md`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/STRUTTURA_COMPLETA_GESTIONALE.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Domande principali: 1. Scopo audit / Verificare in modo avversariale se la NEXT e davvero uguale alla madre sul perimetro target.
- Conclusioni chiave: CHIUSO / NO, NEXT non ancora lavorabile in autonomia sul perimetro target / Stabilire per ogni modulo uno stato finale ammesso:
- Stato: VALIDO

### 2026-03-31 — AUDIT LOOP - `IA Home
- Perimetro: `Route verificata:`; `Fonti runtime verificate:`; `src/next/NextIntelligenzaArtificialePage.tsx`; `src/next/domain/nextIaConfigDomain.ts`; `src/pages/IA/IAHome.tsx`
- Domande principali: Gap aperti nel perimetro `IA Home`: nessuno
- Conclusioni chiave: PASS / Modulo: `IA Home / Route ufficiale NEXT autonoma:
- Stato: VALIDO

### 2026-03-31 — BACKLOG - `IA Home
- Perimetro: `Route target:`; `nessun gap runtime reale emerso dopo confronto tra `src/next/NextIntelligenzaArtificialePage.tsx` e `src/pages/IA/IAHome.tsx`;`; `la route ufficiale era gia NEXT autonoma, madre-like e solo lettura sullo stesso documento `@impostazioni_app/gemini`.`; `src/next/NextIntelligenzaArtificialePage.tsx`; `src/next/domain/nextIaConfigDomain.ts`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Modulo target: `IA Home / la route ufficiale era gia NEXT autonoma, madre-like e solo lettura sullo stesso documento `@impostazioni_app/gemini`.
- Stato: VALIDO

### 2026-03-31 — TRACKER NEXT CLONE LOOP
- Perimetro: `controller: riaperta fuori tracker la route ufficiale `Gestione Operativa` dopo il blocco emerso dall'audit finale globale V3;`; `builder: corretto `src/next/domain/nextOperativitaGlobaleDomain.ts` per leggere `Inventario`, `Materiali` e `Procurement` con `includeCloneOverlays: false` nel path ufficiale `/next/gestione-operativa`;`; `auditor: audit separato sulla route ufficiale `Gestione Operativa` con esito `PASS`; badge, preview e contatori leggono ora solo dati reali madre-like nel runtime ufficiale;`; `controller: tracker moduli invariato `CLOSED`; correzione applicata su route ufficiale extra-tracker, consigliato nuovo audit finale globale separato;`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: auditor: audit separato sulla route ufficiale `Gestione Operativa` con esito `PASS`; badge, preview e contatori leggono ora solo dati reali madre-like nel runtime ufficiale; / Regola applicata: tracker conservativo. Nessun modulo non auditato in questo loop viene marcato `CLOSED`. / controller: riaperta fuori tracker la route ufficiale `Gestione Operativa` dopo il blocco emerso dall'audit finale globale V3;
- Stato: VALIDO

### 2026-04-01 — Audit Home - Flussi, Moduli, Ingressi
- Perimetro: `route e mount reali in `src/App.tsx`;`; `runtime Home corrente in `src/next/NextHomePage.tsx` e `src/next/NextCentroControlloPage.tsx`;`; `composizione Navigazione rapida in `src/next/components/QuickNavigationCard.tsx`;`; `letture dati e dipendenze principali dei moduli NEXT sotto `src/next/*`;`; `route `/next` in `src/App.tsx`;`
- Domande principali: 1. Scopo audit / Quando un fatto non e dimostrabile dal repo e dalla documentazione letta, viene marcato `DA VERIFICARE`.
- Conclusioni chiave: Quando un fatto non e dimostrabile dal repo e dalla documentazione letta, viene marcato `DA VERIFICARE`. / cosa va spostato in Navigazione rapida, ricerca o modulo padre. / 4. Schede modulo complete
- Stato: VALIDO

### 2026-04-01 — Backlog Home - Riduzione Rumore
- Perimetro: `docs/audit/BACKLOG_HOME_RIDUZIONE_RUMORE.md`
- Domande principali: Punti DA VERIFICARE
- Conclusioni chiave: Punti DA VERIFICARE / Moduli da lasciare solo a ricerca/menu/modulo padre
- Stato: VALIDO

### 2026-04-01 — Backlog moduli da classificare
- Perimetro: `Home / Dashboard` vs `Centro di Controllo`: due ingressi cockpit distinti nel runtime reale.`; `Dettaglio ordine` con doppio pattern route.`; `Dossier mezzo` con doppio pattern route.`; `Dettaglio lavoro` con route legacy query-style e route path-based NEXT.`; `src/next/NextAccessDeniedPage.tsx`: file presente ma non montato in `src/App.tsx`.`
- Domande principali: Moduli da verificare
- Conclusioni chiave: Moduli da verificare / src/next/NextMezziDossierPage.tsx`: referenziata da IA interna, ma non route ufficiale. / src/next/NextOperativitaGlobalePage.tsx`: referenziata da IA interna, ma non route ufficiale.
- Stato: VALIDO

### 2026-04-01 — Backlog riorganizzazione hub e Home
- Perimetro: `Dossier mezzo` con doppio alias route`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: nessun verdetto sintetico normalizzato
- Stato: VALIDO

### 2026-04-01 — Decisione architetturale - Gestione Operativa come hub
- Perimetro: `Le route e i runtime reali derivano da `src/App.tsx`.`; `docs/audit/ELENCO_COMPLETO_MODULI_GESTIONALE.md`; `docs/audit/MATRICE_COMPLETA_MODULI_GESTIONALE.md`; `docs/audit/BACKLOG_MODULI_DA_CLASSIFICARE.md`; `docs/audit/AUDIT_HOME_FLUSSI_MODULI_INGRESSI.md`
- Domande principali: 1. Scopo decisionale
- Conclusioni chiave: bisogno di passare spesso dal parent ai child nello stesso contesto. / Usare il censimento moduli gia verificato per decidere quali famiglie devono entrare davvero dentro `Gestione Operativa` come hub padre principale e quali devono restare fuori, in `Home`, `Navigazione rapida` o nel proprio modulo padre. / modulo padre di anagrafica oppure menu dedicato
- Stato: VALIDO

### 2026-04-01 — Elenco completo moduli gestionale
- Perimetro: `Questo audit censisce i moduli realmente presenti nel gestionale partendo dalle route reali di `src/App.tsx`.`; `Fonte primaria: `src/App.tsx`.`; `Verifica file runtime in `src/pages/*`, `src/next/*`, `src/autisti/*`, `src/autistiInbox/*`.`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`
- Domande principali: 1. Scopo audit / 9. Punti DA VERIFICARE
- Conclusioni chiave: MODULO: Mezzo360` | `Tipo: dettaglio` | `Perimetro: madre` | `Route: /mezzo-360/:targa` | `File runtime: src/pages/Mezzo360.tsx` | `Famiglia padre: Mezzi / Dossier / Analisi` | `Serve a: vista legacy 360 del mezzo` | `Ingressi principali: madre legacy` | `Moduli collegati: Mezzi, Dossier` | `Equivalente o duplicato di: Dossier mezzo come equivalente moderno parziale` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx / Un modulo e `confermato` solo se route e file runtime sono dimostrabili nel repo. / Un file non montato nelle route ufficiali non viene promosso a modulo utente confermato.
- Stato: VALIDO

### 2026-04-01 — Matrice completa moduli gestionale
- Perimetro: `docs/audit/MATRICE_COMPLETA_MODULI_GESTIONALE.md`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Matrice completa moduli gestionale
- Stato: VALIDO

### 2026-04-01 — Matrice destinazione famiglie moduli
- Perimetro: `docs/audit/MATRICE_DESTINAZIONE_FAMIGLIE_MODULI.md`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Matrice destinazione famiglie moduli
- Stato: VALIDO

### 2026-04-01 — Matrice Home - Moduli e Decisioni
- Perimetro: `docs/audit/MATRICE_HOME_MODULI_DECISIONI.md`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Matrice Home - Moduli e Decisioni
- Stato: VALIDO

### 2026-04-12 — AUDIT IA INTERNA / DOCUMENTALE - STATO REALE AL 2026-04-12
- Perimetro: `Perimetro: solo audit, nessuna patch runtime`; `Route verificate nel browser: `/next`, `/next/ia/interna`, `/next/ia/documenti`; `Prove usate: codice reale del repo, runtime locale, console browser, network browser, report gia presenti del 2026-04-12`; `La Home `/next` non apre piu un modale custom: porta direttamente alla route vera `/next/ia/interna`.`; `La UI nuova vive in `src/next/NextInternalAiPage.tsx`.`
- Domande principali: Perimetro: solo audit, nessuna patch runtime / Le destinazioni utente oggi sono gia instradate: Inventario per i documenti magazzino, Manutenzioni per i documenti mezzo con targa, Dossier/Preventivi per i preventivi con targa, review per i casi da verificare.
- Conclusioni chiave: Le destinazioni utente oggi sono gia instradate: Inventario per i documenti magazzino, Manutenzioni per i documenti mezzo con targa, Dossier/Preventivi per i preventivi con targa, review per i casi da verificare. / L'analisi documento passa da una Cloud Function esterna (`estrazioneDocumenti`). / LIMITI / PROBLEMI: questo passaggio dipende ancora da un endpoint esterno legacy-ish e non da un motore documentale nuovo della NEXT.
- Stato: VALIDO

### 2026-04-14 — AUDIT IA INTERNA - MAPPA REALE FLUSSI, MODALI E DIVERGENZE
- Perimetro: `Modalita: audit reale del repo, nessuna patch runtime`; `src/next/NextInternalAiPage.tsx`; `src/pages/IA/IADocumenti.tsx`; `src/next/internal-ai/internalAiChatAttachmentsClient.ts`; `src/next/internal-ai/internalAiDocumentAnalysis.ts`
- Domande principali: Perimetro letto davvero: / Rami sospetti / `DA VERIFICARE
- Conclusioni chiave: 1. `handleUnifiedDocumentFileChange()` non passa i file al motore shared; li mette in `documentEntryPendingFiles` e fa `return` (`src/next/NextInternalAiPage.tsx:8374-8381`). / La decisione passa al router universale. / handleUnifiedDocumentAnalyze()` ramo multi-file non passa `documentExpectedType` all'orchestratore (`src/next/NextInternalAiPage.tsx:8394-8424`).
- Stato: VALIDO

### 2026-04-16 — AUDIT CLONEWRITEBARRIER MAPPA REALE - 2026-04-16 19:47
- Perimetro: `Audit reale del file `src/utils/cloneWriteBarrier.ts` dopo la patch chirurgica su `IA Libretto`, con due obiettivi:`; `2. mappare tutto cio che il barrier oggi autorizza o blocca ancora nel clone/NEXT: route, file, operazioni, dataset, endpoint e path Storage.`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Domande principali: SCOPO / 1. verificare che `/next/ia/libretto` sia davvero sbloccato sul solo `Analyze`;
- Conclusioni chiave: nessun altro endpoint aperto / IA LIBRETTO NEXT: SBLOCCATO / AUDIT CLONEWRITEBARRIER MAPPA REALE - 2026-04-16 19:47
- Stato: VALIDO

### 2026-04-16 — AUDIT NEXT LIBRETTO SAVE REAL FLOW - 2026-04-16 18:44
- Perimetro: `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`; `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`
- Domande principali: SCOPO / docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md
- Conclusioni chiave: Fonte primaria del verdetto: codice reale del repository. / Risposta netta alla domanda operativa: / la NEXT oggi non possiede la pipeline dati della madre;
- Stato: VALIDO

## Home/Shell — 8 audit dal 2026-03 al 2026-04

### 2026-03-30 — AUDIT HOME FINAL
- Perimetro: `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/MATRICE_ESECUTIVA_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md`
- Domande principali: COME VERIFICARE / 1. Aprire `/next` e confermare che la route usa la pagina NEXT e non la madre.
- Conclusioni chiave: VERDETTO INIZIALE / APERTO / Motivo iniziale documentato prima di questo audit finale:
- Stato: VALIDO

### 2026-03-30 — AUDIT HOME POST EXECUTION
- Perimetro: `Verificare in modo avversariale e solo runtime-read se `Home` dopo l'ultimo execution e davvero una copia fedele `read-only` della madre.`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/MATRICE_ESECUTIVA_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Domande principali: 1. Scopo audit / Verificare in modo avversariale e solo runtime-read se `Home` dopo l'ultimo execution e davvero una copia fedele `read-only` della madre.
- Conclusioni chiave: Decidere il verdetto corretto senza fidarsi del report di execution. / APERTO / Motivo atteso dal report precedente: la `Home` era ancora considerata non chiusa per i flussi scriventi bloccati e per il presunto residuo clone-only.
- Stato: VALIDO

### 2026-03-30 — BACKLOG EXECUTION - ULTIMI 2 MODULI APERTI
- Perimetro: `docs/audit/BACKLOG_ULTIMI_2_APERTI_EXECUTION.md`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Questo backlog chiude solo gli ultimi 2 moduli rimasti `APERTO` dopo il prompt 45.
- Stato: VALIDO

### 2026-03-31 — AUDIT home LOOP
- Perimetro: `AGENTS.md`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/MATRICE_ESECUTIVA_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Domande principali: nessuno nel perimetro `Home` verificato in questo ciclo. / Come verificare
- Conclusioni chiave: stato iniziale: `FAIL / FAIL / Motivo:
- Stato: VALIDO

### 2026-03-31 — BACKLOG centro-di-controllo
- Perimetro: `src/next/NextCentroControlloParityPage.tsx` leggeva il reader autisti D03 con overlay storage e clone locale attivi;`; `src/next/NextCentroControlloParityPage.tsx` leggeva l'anagrafica flotta con clone patches attive;`; `src/next/NextCentroControlloParityPage.tsx` mostrava le date in formato NEXT (`gg mm aaaa`) invece del formato madre del modulo (`dd/mm/yyyy`).`; `src/App.tsx`; `src/pages/CentroControllo.tsx`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: modulo target: `Centro di Controllo / src/next/NextCentroControlloParityPage.tsx` leggeva il reader autisti D03 con overlay storage e clone locale attivi; / src/next/NextCentroControlloParityPage.tsx` mostrava le date in formato NEXT (`gg mm aaaa`) invece del formato madre del modulo (`dd/mm/yyyy`).
- Stato: VALIDO

### 2026-03-31 — BACKLOG home
- Perimetro: `src/next/components/NextHomeAutistiEventoModal.tsx` non replicava la superficie CTA madre del modal eventi;`; `src/next/NextCentroControlloPage.tsx` non replicava placeholder e validazioni visibili madre nei tre modali data.`; `src/next/NextHomePage.tsx`; `src/next/NextCentroControlloPage.tsx`; `src/next/components/NextHomeAutistiEventoModal.tsx`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: stato iniziale: `FAIL / modulo target: `Home
- Stato: VALIDO

### 2026-03-31 — BACKLOG HOME EXECUTION
- Perimetro: `Route`; `La route era gia nativa NEXT, ma il modulo usava ancora overlay clone-only locali su alert, prenotazioni collaudo, pre-collaudi, revisione e luogo rimorchio.`; `Il domain D10 riassorbiva questi overlay locali invece di leggere solo i dataset reali della madre.`; `Rimossa la dipendenza runtime da `nextHomeCloneState` per la route `Home`.`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: APERTO / Modulo / La route era gia nativa NEXT, ma il modulo usava ancora overlay clone-only locali su alert, prenotazioni collaudo, pre-collaudi, revisione e luogo rimorchio.
- Stato: VALIDO

### 2026-04-16 — AUDIT POST-PATCH NEXT LIBRETTO VERIFICA - 2026-04-16 19:34
- Perimetro: `Audit post-patch in sola lettura del modulo `/next/ia/libretto` per verificare dal codice reale del repo e, dove possibile, dal runtime browser, se la patch ha davvero allineato la NEXT alla madre sul flusso di estrazione e salvataggio del libretto.`; `docs/STATO_ATTUALE_PROGETTO.md`; `docs/product/STATO_MIGRAZIONE_NEXT.md`; `docs/product/REGISTRO_MODIFICHE_CLONE.md`; `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- Domande principali: SCOPO / Audit post-patch in sola lettura del modulo `/next/ia/libretto` per verificare dal codice reale del repo e, dove possibile, dal runtime browser, se la patch ha davvero allineato la NEXT alla madre sul flusso di estrazione e salvataggio del libretto.
- Conclusioni chiave: Fonte primaria del verdetto: codice reale del repository. / PATCH NEXT LIBRETTO NON ALLINEATA ALLA MADRE / il codice di `handleSave` e del dataset finale e allineato alla madre;
- Stato: VALIDO

## Flotta/Mezzi — 21 audit dal 2026-03 al 2026-03

### 2026-03-30 — BACKLOG 3 GAP FINALI EXECUTION
- Perimetro: `docs/audit/BACKLOG_3_GAP_FINALI_EXECUTION.md`
- Domande principali: Scopo
- Conclusioni chiave: Il verdetto `NEXT autonoma SI/NO sul perimetro target` resta materia di audit separato.
- Stato: VALIDO

### 2026-03-31 — AUDIT LOOP - `Autisti
- Perimetro: `Route verificate:`; `Fonti runtime verificate:`; `src/next/autisti/NextAutistiCloneLayout.tsx`; `src/next/autisti/NextLoginAutistaNative.tsx`; `src/next/autisti/NextSetupMezzoNative.tsx`
- Domande principali: NextLegacyStorageBoundary.tsx` non inietta piu override `autisti` legacy-shaped sul solo perimetro ufficiale `/next/autisti/*`;
- Conclusioni chiave: Nota audit: questo audit sostituisce il `PASS` precedente del `2026-03-31 14:19`, invalidato dall'audit finale globale che aveva trovato navigazioni reali verso `/autisti/*`. / Modulo: `Autisti / Verdetto: `PASS
- Stato: VALIDO

### 2026-03-31 — AUDIT LOOP - `Capo Mezzi
- Perimetro: `Route verificata:`; `Fonti runtime verificate:`; `src/next/NextCapoMezziPage.tsx`; `src/next/domain/nextCapoDomain.ts`; `src/next/domain/nextDocumentiCostiDomain.ts`
- Domande principali: Gap aperti nel perimetro `Capo Mezzi`: nessuno
- Conclusioni chiave: PASS / Modulo: `Capo Mezzi / Route ufficiale NEXT autonoma:
- Stato: VALIDO

### 2026-03-31 — AUDIT LOOP - `Cisterna
- Perimetro: `Route verificata:`; `Fonti runtime verificate:`; `src/App.tsx`; `src/next/NextCisternaPage.tsx`; `src/next/domain/nextCisternaDomain.ts`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Esito audit finale / Modulo: `Cisterna / Verdetto: `PASS
- Stato: VALIDO

### 2026-03-31 — AUDIT LOOP - `Cisterna IA
- Perimetro: `Route verificata:`; `Fonti runtime verificate:`; `src/App.tsx`; `src/next/NextCisternaIAPage.tsx`; `src/pages/CisternaCaravate/CisternaCaravateIA.tsx`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Esito audit finale / Modulo: `Cisterna IA / Verdetto: `PASS
- Stato: VALIDO

### 2026-03-31 — AUDIT LOOP - `Cisterna Schede Test
- Perimetro: `Route verificata:`; `Fonti runtime verificate:`; `src/App.tsx`; `src/next/NextCisternaSchedeTestPage.tsx`; `src/next/domain/nextCisternaDomain.ts`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Esito audit finale / Modulo: `Cisterna Schede Test / Verdetto: `PASS
- Stato: VALIDO

### 2026-03-31 — AUDIT LOOP - `Fornitori
- Perimetro: `Route verificata:`; `Fonti runtime verificate:`; `src/App.tsx`; `src/next/NextFornitoriPage.tsx`; `src/next/domain/nextFornitoriDomain.ts`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Esito audit finale / Modulo: `Fornitori / Verdetto: `PASS
- Stato: VALIDO

### 2026-03-31 — AUDIT LOOP - `IA Copertura Libretti
- Perimetro: `Route verificata:`; `Fonti runtime verificate:`; `src/next/NextIACoperturaLibrettiPage.tsx`; `src/next/nextAnagraficheFlottaDomain.ts`; `src/pages/IA/IACoperturaLibretti.tsx`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Esito audit finale / Modulo: `IA Copertura Libretti / Verdetto: `PASS
- Stato: VALIDO

### 2026-03-31 — AUDIT LOOP - `IA Libretto
- Perimetro: `Route verificata:`; `Fonti runtime verificate:`; `src/next/NextIALibrettoPage.tsx`; `src/next/domain/nextIaConfigDomain.ts`; `src/next/domain/nextIaLibrettoDomain.ts`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Esito audit finale / Modulo: `IA Libretto / Verdetto: `PASS
- Stato: VALIDO

### 2026-03-31 — AUDIT LOOP - `Libretti Export
- Perimetro: `Route verificata:`; `Fonti runtime verificate:`; `src/next/NextLibrettiExportPage.tsx`; `src/next/domain/nextLibrettiExportDomain.ts`; `src/pages/LibrettiExport.tsx`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Esito audit finale / Modulo: `Libretti Export / Verdetto: `PASS
- Stato: VALIDO

### 2026-03-31 — AUDIT LOOP - Autisti Inbox / Admin
- Perimetro: `Le route ufficiali `/next/autisti-inbox*` e `/next/autisti-admin` non montano `src/autistiInbox/**` come runtime finale.`; `src/next/NextAutistiInboxHomePage.tsx` e `src/next/NextAutistiAdminPage.tsx` non montano piu `NextLegacyStorageBoundary` nei wrapper ufficiali home/admin.`; `src/next/NextLegacyStorageBoundary.tsx` tratta ora anche `/next/autisti-inbox*` e `/next/autisti-admin` come perimetro ufficiale in cui il preset `autisti` non deve iniettare `readNextAutistiLegacyStorageOverrides()`.`; `Il path di lettura ufficiale resta `src/next/autisti/nextAutistiStorageSync.ts`, ma sul perimetro inbox/admin non riceve piu overlay `autisti` clone-local dal boundary legacy.`; `src/next/autistiInbox/NextAutistiAdminNative.tsx` mantiene la UI madre-like ma blocca in modo esplicito:`
- Domande principali: src/next/NextLegacyStorageBoundary.tsx` tratta ora anche `/next/autisti-inbox*` e `/next/autisti-admin` come perimetro ufficiale in cui il preset `autisti` non deve iniettare `readNextAutistiLegacyStorageOverrides()`.
- Conclusioni chiave: Esito: `PASS / Modulo: `Autisti Inbox / Admin / Il path di lettura ufficiale resta `src/next/autisti/nextAutistiStorageSync.ts`, ma sul perimetro inbox/admin non riceve piu overlay `autisti` clone-local dal boundary legacy.
- Stato: VALIDO

### 2026-03-31 — AUDIT LOOP `Mezzi
- Perimetro: `Route ufficiale verificata: `/next/mezzi`; `Runtime ufficiale verificato: `src/next/NextMezziPage.tsx`; `La route ufficiale `/next/mezzi` monta `NextMezziPage`, non `NextMotherPage` o `src/pages/Mezzi.tsx`.`; `Il runtime ufficiale replica la superficie madre di `Mezzi`: foto, blocco `LIBRETTO (IA)`, form completo, CTA `Salva mezzo` / `Salva modifiche`, lista per categoria e pulsanti `Modifica`, `Dossier Mezzo`, `Elimina`.`; `Il runtime ufficiale legge gli stessi dataset reali della madre tramite `readNextAnagraficheFlottaSnapshot({ includeClonePatches: false })`, quindi senza overlay clone-only impliciti.`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Esito audit: `PASS / Route NEXT autonoma senza runtime finale madre: `PASS / UI pratica equivalente alla madre: `PASS
- Stato: VALIDO

### 2026-03-31 — BACKLOG - `Autisti
- Perimetro: `Route target:`; `l'audit finale globale ha dimostrato un falso `CLOSED`: il runtime ufficiale `/next/autisti/*` usciva ancora verso `/autisti/*` da `NextLoginAutistaNative.tsx`, `NextSetupMezzoNative.tsx` e `NextHomeAutistaNative.tsx`;`; `src/next/autisti/NextAutistiCloneLayout.tsx`; `src/next/autisti/NextLoginAutistaNative.tsx`; `src/next/autisti/NextSetupMezzoNative.tsx`
- Domande principali: il boundary `NextLegacyStorageBoundary.tsx` poteva ancora iniettare override `autisti` legacy-shaped sul solo perimetro ufficiale, mantenendo un rischio strutturale secondario non coerente con l'autonomia NEXT;
- Conclusioni chiave: Stato iniziale: `APERTO / Modulo target: `Autisti / l'audit finale globale ha dimostrato un falso `CLOSED`: il runtime ufficiale `/next/autisti/*` usciva ancora verso `/autisti/*` da `NextLoginAutistaNative.tsx`, `NextSetupMezzoNative.tsx` e `NextHomeAutistaNative.tsx`;
- Stato: VALIDO

### 2026-03-31 — BACKLOG - `Capo Mezzi
- Perimetro: `Route target:`; `src/next/domain/nextCapoDomain.ts` costruiva il riepilogo costi del modulo usando `readNextDocumentiCostiFleetSnapshot()` con documenti clone-only locali inclusi di default.`; `src/next/NextCapoMezziPage.tsx` non spegneva esplicitamente quel perimetro clone-only nel runtime ufficiale.`; `src/next/NextCapoMezziPage.tsx`; `src/next/domain/nextCapoDomain.ts`
- Domande principali: src/next/NextCapoMezziPage.tsx` non spegneva esplicitamente quel perimetro clone-only nel runtime ufficiale.
- Conclusioni chiave: Modulo target: `Capo Mezzi / src/next/domain/nextCapoDomain.ts` costruiva il riepilogo costi del modulo usando `readNextDocumentiCostiFleetSnapshot()` con documenti clone-only locali inclusi di default. / src/next/NextCapoMezziPage.tsx` non spegneva esplicitamente quel perimetro clone-only nel runtime ufficiale.
- Stato: VALIDO

### 2026-03-31 — BACKLOG - `Cisterna
- Perimetro: `Route target:`; `src/next/NextCisternaPage.tsx` non usa piu `NextClonePageScaffold`, `jsPDF`, `jspdf-autotable`, `pdf.save(...)` o `upsertNextCisternaCloneParametro()`.`; `Il runtime ufficiale replica ora la grammatica pratica della madre su header, month picker, archivio, `DOPPIO BOLLETTINO`, report mensile, targhe e dettaglio.`; `src/next/domain/nextCisternaDomain.ts` espone ora `readNextCisternaSnapshot(..., { includeCloneOverlays: false })`, cosi la route ufficiale legge documenti, schede e parametri reali senza overlay clone-only.`; `src/next/NextCisternaPage.tsx`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Modulo target: `Cisterna / Il runtime ufficiale replica ora la grammatica pratica della madre su header, month picker, archivio, `DOPPIO BOLLETTINO`, report mensile, targhe e dettaglio. / src/next/domain/nextCisternaDomain.ts` espone ora `readNextCisternaSnapshot(..., { includeCloneOverlays: false })`, cosi la route ufficiale legge documenti, schede e parametri reali senza overlay clone-only.
- Stato: VALIDO

### 2026-03-31 — BACKLOG - `Cisterna IA
- Perimetro: `Route target:`; `src/next/NextCisternaIAPage.tsx` era ancora clone-specifica con `NextClonePageScaffold`, banner handoff e salvataggi clone-only.`; `Il runtime ufficiale usava upload Storage, `extractCisternaDocumento()` e `addDoc()` per toccare la madre o simulare la parity.`; `La route ufficiale esponeva ancora affordance e copy del clone che non seguivano fino in fondo la grammatica pratica della madre.`; `Il nuovo runtime ufficiale mantiene la UI madre ma blocca `Analizza documento (IA)` e `Salva in archivio cisterna` in read-only esplicito.`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Modulo target: `Cisterna IA / Il runtime ufficiale usava upload Storage, `extractCisternaDocumento()` e `addDoc()` per toccare la madre o simulare la parity. / La route ufficiale esponeva ancora affordance e copy del clone che non seguivano fino in fondo la grammatica pratica della madre.
- Stato: VALIDO

### 2026-03-31 — BACKLOG - `Cisterna Schede Test
- Perimetro: `Route target:`; `src/next/NextCisternaSchedeTestPage.tsx` usava `NextClonePageScaffold`, `upsertNextCisternaCloneScheda()` e conferme di salvataggio locale del clone.`; `Il runtime ufficiale esponeva ancora estrazione IA simulata e salvataggi clone-only che falsavano la parity con la madre.`; `src/pages/CisternaCaravate/CisternaSchedeTest.tsx` restava piu ampia su crop, calibrazione, estrazione IA, edit mode, modal e conferma finale; il gap e stato riallineato mantenendo la UI madre ma bloccando sotto ogni side effect.`; `src/next/NextCisternaSchedeTestPage.tsx`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: readNextCisternaSchedaDetail()` passava ancora da `readSchede()` con overlay clone abilitati di default; il reader ufficiale ora puo leggere il dettaglio senza overlay clone-only. / Modulo target: `Cisterna Schede Test / Il runtime ufficiale esponeva ancora estrazione IA simulata e salvataggi clone-only che falsavano la parity con la madre.
- Stato: VALIDO

### 2026-03-31 — BACKLOG - `IA Copertura Libretti
- Perimetro: `Route target:`; `src/next/NextIACoperturaLibrettiPage.tsx` era clone-specifica con `NextClonePageScaffold` e `upsertNextFlottaClonePatch()`.`; `Il runtime ufficiale applicava patch locali sulla flotta e apriva upload/riparazioni solo nel clone.`; `src/next/nextAnagraficheFlottaDomain.ts` ora espone anche `librettoStoragePath` reale e la route ufficiale legge `@mezzi_aziendali` senza clone patch.`; `src/next/NextIACoperturaLibrettiPage.tsx`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Modulo target: `IA Copertura Libretti / Il runtime ufficiale applicava patch locali sulla flotta e apriva upload/riparazioni solo nel clone. / src/next/nextAnagraficheFlottaDomain.ts` ora espone anche `librettoStoragePath` reale e la route ufficiale legge `@mezzi_aziendali` senza clone patch.
- Stato: VALIDO

### 2026-03-31 — BACKLOG - `IA Libretto
- Perimetro: `Route target:`; `src/next/NextIALibrettoPage.tsx` non usa piu `NextClonePageScaffold`, handoff IA, preview facade locale o `upsertNextFlottaClonePatch()`.`; `Il runtime ufficiale replica ora la grammatica pratica della madre su header, step, upload, analisi, risultati, archivio e viewer, ma blocca in modo esplicito le azioni scriventi.`; `Il nuovo reader `src/next/domain/nextIaLibrettoDomain.ts` legge il dataset reale `storage/@mezzi_aziendali` senza overlay clone-only.`; `src/next/NextIALibrettoPage.tsx`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Modulo target: `IA Libretto / Il runtime ufficiale replica ora la grammatica pratica della madre su header, step, upload, analisi, risultati, archivio e viewer, ma blocca in modo esplicito le azioni scriventi. / Il nuovo reader `src/next/domain/nextIaLibrettoDomain.ts` legge il dataset reale `storage/@mezzi_aziendali` senza overlay clone-only.
- Stato: VALIDO

### 2026-03-31 — BACKLOG `Mezzi
- Perimetro: `Route ufficiale NEXT autonoma senza runtime finale madre.`; `UI pratica, CTA, testi, placeholder e validazioni visibili riallineati alla madre nel perimetro modulo.`; `Lettura degli stessi dataset reali della madre senza overlay clone-only nel runtime ufficiale.`; `Nessuna scrittura reale attiva e nessuna scrittura locale clone-only attiva nel runtime ufficiale.`; `Route: `/next/mezzi`
- Domande principali: Nessun gap aperto nel perimetro `Mezzi
- Conclusioni chiave: Stato iniziale nel run: `FAIL / Modulo: `Mezzi / Esito audit separato: `PASS
- Stato: VALIDO

### 2026-03-31 — BACKLOG Autisti Inbox / Admin
- Perimetro: `Route ufficiali NEXT:`; `src/next/NextAutistiInboxHomePage.tsx` montava ancora `NextLegacyStorageBoundary` con preset `autisti` sul wrapper ufficiale home inbox.`; `src/next/NextAutistiAdminPage.tsx` montava ancora `NextLegacyStorageBoundary` con preset `autisti` sul wrapper ufficiale admin.`; `src/next/NextLegacyStorageBoundary.tsx` neutralizzava il preset `autisti` solo su `/next/autisti/*`, non anche su `/next/autisti-inbox*` e `/next/autisti-admin`.`; `src/utils/storageSync.ts` continuava a dare precedenza agli override legacy-shaped in clone runtime, quindi il boundary poteva falsare la lettura ufficiale inbox/admin.`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Stato iniziale: `CLOSED` nel tracker ma `APERTO` nel codice reale dopo audit finale globale V2 / Modulo target: `Autisti Inbox / Admin / src/next/autistiInbox/NextAutistiAdminNative.tsx` manteneva gia i blocchi no-write corretti, quindi il problema reale era di lettura e non di scrittura.
- Stato: VALIDO

## Dossier — 8 audit dal 2026-03 al 2026-03

### 2026-03-31 — AUDIT LOOP `Dossier Gomme
- Perimetro: `Route ufficiale verificata: `/next/dossier/:targa/gomme`; `Runtime ufficiale verificato: `src/next/NextDossierGommePage.tsx`; `La route ufficiale `/next/dossier/:targa/gomme` monta `NextDossierGommePage`, non `NextMotherPage` o `src/pages/DossierGomme.tsx`.`; `Il runtime ufficiale replica la superficie madre del modulo su header, CTA di ritorno, titolo mezzo, sezione statistiche, ultima sostituzione, storico e grafici.`; `La madre resta distinta e intoccata: `src/pages/DossierGomme.tsx` e `src/pages/GommeEconomiaSection.tsx` continuano a leggere direttamente `@manutenzioni`, mentre il clone usa solo layer NEXT read-only.`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Esito audit: `PASS / Route NEXT autonoma senza runtime finale madre: `PASS / UI pratica equivalente alla madre: `PASS
- Stato: VALIDO

### 2026-03-31 — AUDIT LOOP `Dossier Lista
- Perimetro: `Route ufficiale verificata: `/next/dossiermezzi`; `Runtime ufficiale verificato: `src/next/NextDossierListaPage.tsx`; `La route ufficiale `/next/dossiermezzi` monta `NextDossierListaPage`, non `NextMotherPage` o `src/pages/DossierLista.tsx`.`; `Il runtime ufficiale replica la stessa superficie pratica della madre: titolo `Dossier Mezzi`, griglia categorie, bottone ritorno categorie, card mezzo con foto/placeholder e ingresso al dettaglio dossier.`; `Il click sulle card porta a `/next/dossiermezzi/:targa`, alias NEXT coerente con il flusso madre `lista -> dettaglio`; nel routing ufficiale questa route monta `NextDossierMezzoPage`.`
- Domande principali: Il modulo non espone scritture, modali operativi, PDF o side effect business: il perimetro resta integralmente read-only senza workaround clone-only.
- Conclusioni chiave: Esito audit: `PASS / Route NEXT autonoma senza runtime finale madre: `PASS / UI pratica equivalente alla madre: `PASS
- Stato: VALIDO

### 2026-03-31 — AUDIT LOOP `Dossier Mezzo
- Perimetro: `Route ufficiale verificata: `/next/dossiermezzi/:targa` (`/next/dossier/:targa` alias tecnico)`; `Runtime ufficiale verificato: `src/next/NextDossierMezzoPage.tsx`; `La route ufficiale `/next/dossiermezzi/:targa` monta `NextDossierMezzoPage`, non `NextMotherPage` o `src/pages/DossierMezzo.tsx`.`; `Il runtime ufficiale replica la superficie madre del dossier su header, blocchi dati tecnici, foto mezzo, lavori, manutenzioni, materiali, rifornimenti, preventivi/fatture, modali principali e anteprima PDF.`; `La madre resta distinta e intoccata: `src/pages/DossierMezzo.tsx` continua a usare `getDoc/getDocs/setDoc/deleteDoc`, mentre il clone non esegue nessuno di questi side effect.`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Esito audit: `PASS / Route NEXT autonoma senza runtime finale madre: `PASS / UI pratica equivalente alla madre: `PASS
- Stato: VALIDO

### 2026-03-31 — AUDIT LOOP `Dossier Rifornimenti
- Perimetro: `Route ufficiale verificata: `/next/dossier/:targa/rifornimenti`; `Runtime ufficiale verificato: `src/next/NextDossierRifornimentiPage.tsx`; `La route ufficiale `/next/dossier/:targa/rifornimenti` monta `NextDossierRifornimentiPage`, non `NextMotherPage` o `src/pages/DossierRifornimenti.tsx`.`; `Il runtime ufficiale replica la superficie madre del modulo su header, CTA di ritorno, riepilogo rifornimenti, ultimi rifornimenti, selettori periodo, grafici e calcoli visibili.`; `La madre resta distinta e intoccata: `src/pages/DossierRifornimenti.tsx` e `src/pages/RifornimentiEconomiaSection.tsx` continuano a leggere direttamente `@rifornimenti` e `@rifornimenti_autisti_tmp`, mentre il clone usa solo layer NEXT read-only.`
- Domande principali: NextDossierRifornimentiPage` usa `NextRifornimentiEconomiaSection` con `dataScope="legacy_parity"`, quindi la vista ufficiale esclude i record `solo_campo` e mantiene solo il perimetro dati che la madre rende visibile: base business con ricostruzione controllata dai dati campo.
- Conclusioni chiave: Esito audit: `PASS / Route NEXT autonoma senza runtime finale madre: `PASS / UI pratica equivalente alla madre: `PASS
- Stato: VALIDO

### 2026-03-31 — BACKLOG `Dossier Gomme
- Perimetro: `Route ufficiale NEXT autonoma senza runtime finale madre.`; `UI pratica equivalente alla madre su header, CTA di ritorno, cards statistiche, storico e grafici.`; `Nessuna scrittura reale attiva e nessun bottone operativo di inserimento/modifica nel modulo.`; `Lettura dati sopra layer NEXT puliti, ma con vista ufficiale riallineata alla stessa base dati visibile della madre.`; `Route: `/next/dossier/:targa/gomme`
- Domande principali: Nessun gap aperto nel perimetro `Dossier Gomme
- Conclusioni chiave: Esito audit separato: `PASS / Modulo: `Dossier Gomme / src/next/NextGommeEconomiaSection.tsx` supporta ora uno scope dati esplicito: sulla route ufficiale `Dossier Gomme` mostra solo le sostituzioni derivate da `@manutenzioni`, che sono la stessa sorgente visibile usata dalla madre.
- Stato: VALIDO

### 2026-03-31 — BACKLOG `Dossier Lista
- Perimetro: `Route ufficiale NEXT autonoma senza runtime finale madre.`; `UI pratica equivalente alla madre nel perimetro del modulo.`; `Nessuna CTA scrivente, nessun modale operativo e nessun PDF da riallineare in questo modulo.`; `Lettura degli stessi dati reali della madre tramite layer D01 pulito e senza patch locali.`; `Route: `/next/dossiermezzi`
- Domande principali: Nessun gap aperto nel perimetro `Dossier Lista
- Conclusioni chiave: Esito audit separato: `PASS / Modulo: `Dossier Lista / src/next/NextDossierListaPage.tsx` dichiara ora in modo esplicito `readNextAnagraficheFlottaSnapshot({ includeClonePatches: false })`, quindi il runtime ufficiale legge `@mezzi_aziendali` senza overlay clone-only impliciti.
- Stato: VALIDO

### 2026-03-31 — BACKLOG `Dossier Mezzo
- Perimetro: `Route ufficiale NEXT autonoma senza runtime finale madre.`; `UI pratica, modali principali e anteprima PDF equivalenti alla madre nel perimetro modulo.`; `Nessuna scrittura reale attiva e nessuna scrittura locale clone-only nel runtime ufficiale.`; `Lettura dei dati sopra layer NEXT puliti e composite dossier dedicato, inclusi ora i movimenti materiali senza overlay clone-only nel percorso ufficiale.`; `Route: `/next/dossiermezzi/:targa` (`/next/dossier/:targa` alias tecnico)`
- Domande principali: Nessun gap aperto nel perimetro `Dossier Mezzo
- Conclusioni chiave: Esito audit separato: `PASS / Modulo: `Dossier Mezzo / src/next/NextDossierMezzoPage.tsx` non legge piu `nextDossierCloneState` e non nasconde piu i documenti in overlay locale del clone.
- Stato: VALIDO

### 2026-03-31 — BACKLOG `Dossier Rifornimenti
- Perimetro: `Route ufficiale NEXT autonoma senza runtime finale madre.`; `UI pratica equivalente alla madre su header, CTA di ritorno, riepilogo, ultimi rifornimenti e grafici interattivi.`; `Nessuna scrittura reale attiva nel modulo.`; `Lettura dati sopra layer NEXT puliti, ma con vista ufficiale riallineata alla stessa base dati visibile della madre.`; `Route: `/next/dossier/:targa/rifornimenti`
- Domande principali: Nessun gap aperto nel perimetro `Dossier Rifornimenti
- Conclusioni chiave: Esito audit separato: `PASS / Modulo: `Dossier Rifornimenti / src/next/NextRifornimentiEconomiaSection.tsx` supporta ora uno scope dati esplicito: sulla route ufficiale `Dossier Rifornimenti` mostra solo i record business o ricostruiti dal business, escludendo i `solo_campo` che la madre non appende in UI.
- Stato: VALIDO

## Trasversali/Altro — 6 audit dal 2026-03 al 2026-03

### 2026-03-31 — AUDIT LOOP - `Colleghi
- Perimetro: `Route verificata:`; `Fonti runtime verificate:`; `src/App.tsx`; `src/next/NextColleghiPage.tsx`; `src/next/domain/nextColleghiDomain.ts`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Esito audit finale / Modulo: `Colleghi / Verdetto: `PASS
- Stato: VALIDO

### 2026-03-31 — AUDIT LOOP - `IA API Key
- Perimetro: `Route verificata:`; `Fonti runtime verificate:`; `src/next/NextIAApiKeyPage.tsx`; `src/next/domain/nextIaConfigDomain.ts`; `src/pages/IA/IAApiKey.tsx`
- Domande principali: Gap aperti nel perimetro `IA API Key`: nessuno
- Conclusioni chiave: PASS / Modulo: `IA API Key / Route ufficiale NEXT autonoma:
- Stato: VALIDO

### 2026-03-31 — BACKLOG - `Colleghi
- Perimetro: `Route target:`; `src/next/NextColleghiPage.tsx` esponeva ancora aggiunta, modifica ed eliminazione clone-only tramite `upsertNextCollegaCloneRecord()` e `markNextCollegaCloneDeleted()`.`; `Il runtime ufficiale mescolava ancora overlay locali del clone al dataset reale leggendo `readNextColleghiSnapshot()` senza disattivare il merge clone-only.`; `src/next/NextColleghiPage.tsx`; `src/next/domain/nextColleghiDomain.ts`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Modulo target: `Colleghi / Il runtime ufficiale mescolava ancora overlay locali del clone al dataset reale leggendo `readNextColleghiSnapshot()` senza disattivare il merge clone-only. / La parity esterna era falsata da notice di salvataggio locale del clone su una superficie che doveva restare fedele alla madre ma `read-only`.
- Stato: VALIDO

### 2026-03-31 — BACKLOG - `Fornitori
- Perimetro: `Route target:`; `src/next/NextFornitoriPage.tsx` esponeva ancora aggiunta, modifica ed eliminazione clone-only tramite `upsertNextFornitoreCloneRecord()` e `markNextFornitoreCloneDeleted()`.`; `Il runtime ufficiale leggeva `readNextFornitoriSnapshot()` con overlay clone-only ancora abilitati.`; `src/next/NextFornitoriPage.tsx`; `src/next/domain/nextFornitoriDomain.ts`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Modulo target: `Fornitori / Il runtime ufficiale leggeva `readNextFornitoriSnapshot()` con overlay clone-only ancora abilitati. / La parity reale era falsata da messaggi di salvataggio locale del clone su una superficie che doveva restare madre-like `read-only`.
- Stato: VALIDO

### 2026-03-31 — BACKLOG - `IA API Key
- Perimetro: `Route target:`; `src/next/NextIAApiKeyPage.tsx` chiamava ancora `saveNextIaConfigSnapshot()` e quindi scriveva davvero su Firestore.`; `src/next/domain/nextIaConfigDomain.ts` dichiarava e implementava ancora il salvataggio reale della chiave nel clone.`; `src/next/NextIAApiKeyPage.tsx`; `src/next/domain/nextIaConfigDomain.ts`
- Domande principali: verifica del perimetro reale e del runtime
- Conclusioni chiave: Modulo target: `IA API Key
- Stato: VALIDO

### 2026-03-31 — BACKLOG - `Libretti Export
- Perimetro: `Route target:`; `nessun writer clone-only o business reale attivo nel runtime ufficiale del modulo;`; `la verifica del loop ha richiesto solo audit sul codice reale per confermare autonomia NEXT, parity esterna madre-like e uso del layer `nextLibrettiExportDomain`.`; `src/next/NextLibrettiExportPage.tsx`; `src/next/domain/nextLibrettiExportDomain.ts`
- Domande principali: la verifica del loop ha richiesto solo audit sul codice reale per confermare autonomia NEXT, parity esterna madre-like e uso del layer `nextLibrettiExportDomain`.
- Conclusioni chiave: Modulo target: `Libretti Export / nessun writer clone-only o business reale attivo nel runtime ufficiale del modulo;
- Stato: VALIDO

## File scartati
- nessuno
