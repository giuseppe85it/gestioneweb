# AUDIT COMPLETO PARITA CLONE/NEXT VS MADRE

Data audit: 2026-03-29  
Stato: CURRENT  
Perimetro: clone/NEXT ufficiale sotto `src/next/*` confrontato con le route madre in `src/App.tsx` e con le pagine legacy reali.

## 1. Scopo audit
- Verificare nel codice reale del repository quali moduli del clone/NEXT sono gia a parita con la madre.
- Distinguere dove la parita e solo apparente perche la route ufficiale monta ancora logica/raw madre.
- Distinguere dove esiste gia un layer NEXT pulito ma non alimenta ancora la superficie ufficiale.
- Fissare un ordine di chiusura gap coerente con la strategia clone `read-only` della madre.

## 2. Regole del perimetro
- Madre intoccabile.
- Conta piu il codice runtime reale del repo che la documentazione descrittiva.
- La route ufficiale `/next/*` vale piu di superfici alternative non agganciate a `src/App.tsx`.
- Una pagina clone fedele ma ancora attaccata a letture/logiche legacy/raw viene classificata `PARI MA RAW`, non `PARI`.
- Una pagina custom pulita ma con copertura funzionale minore della madre viene classificata `PARZIALE`.
- Se clone fedele e normalizzazione esistono ma vivono su superfici diverse, il modulo e `SPEZZATO`.

## 3. Esclusioni deliberate
- `Targa 360` / `Mezzo360` -> `FUORI PERIMETRO`
- `Autista 360` -> `FUORI PERIMETRO`

Queste due superfici compaiono davvero nel repo:
- in `src/pages/Mezzo360.tsx` e `src/pages/Autista360.tsx`;
- nei collegamenti della madre `Home.tsx`;
- nei guard-rail clone di `src/next/NextMotherPage.tsx`;
- nel testo `Vista 360 non importata` di `src/next/NextCentroControlloPage.tsx`.

Non vengono conteggiate come gap di parita clone -> madre.

## 4. File realmente analizzati

### 4.1 Documentazione obbligatoria e di supporto
- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/data/DOMINI_DATI_CANONICI.md`
- `docs/data/REGOLE_STRUTTURA_DATI.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`
- `docs/product/REGOLE_LAVORO_CODEX.md`
- `docs/flow-master/MAPPA_MAESTRA_FLUSSI_GESTIONALE.md`
- `docs/ui-audit/AUDIT_GRAFICA_ATTUALE.md`
- `docs/ui-blueprint/BLUEPRINT_GRAFICO_NEXT.md`
- `docs/audit/AUDIT_CENTRO_DI_CONTROLLO_MADRE_ECOSISTEMA_NEXT.md`
- `docs/audit/AUDIT_CENTRO_DI_CONTROLLO_NEXT.md`
- `docs/change-reports/2026-03-26_0902_rifinitura-d06-procurement-readonly-next.md`
- `docs/change-reports/2026-03-26_2204_docs_audit-centro-di-controllo-madre-next.md`
- `docs/change-reports/2026-03-26_2217_docs_audit-centro-di-controllo-next-runtime.md`
- `docs/change-reports/2026-03-26_2240_prompt27_chiusura-finale-handoff-next.md`
- `docs/continuity-reports/2026-03-26_0902_continuity_rifinitura-d06-procurement-readonly-next.md`
- `docs/continuity-reports/2026-03-26_2240_continuity_prompt27_chiusura-finale-handoff-next.md`

### 4.2 Routing, shell e guard-rail clone
- `src/App.tsx`
- `src/next/NextMotherPage.tsx`
- `src/next/nextStructuralPaths.ts`
- `src/next/nextCloneNavigation.ts`
- `src/next/NextLegacyStructuralRedirects.tsx`

### 4.3 Route NEXT ufficiali e superfici correlate
- `src/next/NextHomePage.tsx`
- `src/next/NextCentroControlloClonePage.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/NextGestioneOperativaPage.tsx`
- `src/next/NextOperativitaGlobalePage.tsx`
- `src/next/NextInventarioPage.tsx`
- `src/next/NextMaterialiConsegnatiPage.tsx`
- `src/next/NextAttrezzatureCantieriPage.tsx`
- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextAcquistiPage.tsx`
- `src/next/NextProcurementStandalonePage.tsx`
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `src/next/NextOrdiniInAttesaPage.tsx`
- `src/next/NextOrdiniArrivatiPage.tsx`
- `src/next/NextDettaglioOrdinePage.tsx`
- `src/next/NextLavoriDaEseguirePage.tsx`
- `src/next/NextLavoriInAttesaPage.tsx`
- `src/next/NextLavoriEseguitiPage.tsx`
- `src/next/NextDettaglioLavoroPage.tsx`
- `src/next/NextMezziPage.tsx`
- `src/next/NextMezziDossierPage.tsx`
- `src/next/NextDossierListaPage.tsx`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/NextDossierGommePage.tsx`
- `src/next/NextDossierRifornimentiPage.tsx`
- `src/next/NextAnalisiEconomicaPage.tsx`
- `src/next/NextCapoMezziPage.tsx`
- `src/next/NextCapoCostiMezzoPage.tsx`
- `src/next/NextColleghiPage.tsx`
- `src/next/NextFornitoriPage.tsx`
- `src/next/NextIntelligenzaArtificialePage.tsx`
- `src/next/NextIAApiKeyPage.tsx`
- `src/next/NextIALibrettoPage.tsx`
- `src/next/NextIADocumentiPage.tsx`
- `src/next/NextIACoperturaLibrettiPage.tsx`
- `src/next/NextLibrettiExportPage.tsx`
- `src/next/NextCisternaPage.tsx`
- `src/next/NextCisternaIAPage.tsx`
- `src/next/NextCisternaSchedeTestPage.tsx`
- `src/next/NextAutistiInboxHomePage.tsx`
- `src/next/NextAutistiAdminPage.tsx`
- `src/next/NextAutistiInboxSegnalazioniPage.tsx`
- `src/next/NextAutistiInboxControlliPage.tsx`
- `src/next/NextAutistiInboxRichiestaAttrezzaturePage.tsx`
- `src/next/NextAutistiInboxLogAccessiPage.tsx`
- `src/next/NextAutistiInboxGommePage.tsx`
- `src/next/NextAutistiInboxCambioMezzoPage.tsx`
- `src/next/NextAutistiGatePage.tsx`
- `src/next/NextAutistiLoginPage.tsx`
- `src/next/NextAutistiHomePage.tsx`
- `src/next/NextAutistiSetupMezzoPage.tsx`
- `src/next/NextAutistiCambioMezzoPage.tsx`
- `src/next/NextAutistiControlloPage.tsx`
- `src/next/autisti/NextAutistiCloneLayout.tsx`
- `src/next/autisti/NextAutistiRifornimentoPage.tsx`
- `src/next/autisti/NextAutistiSegnalazioniPage.tsx`
- `src/next/autisti/NextAutistiRichiestaAttrezzaturePage.tsx`

### 4.4 Domain/read model NEXT verificati
- `src/next/domain/nextCentroControlloDomain.ts`
- `src/next/domain/nextAutistiDomain.ts`
- `src/next/useNextOperativitaSnapshot.ts`
- `src/next/domain/nextOperativitaGlobaleDomain.ts`
- `src/next/domain/nextInventarioDomain.ts`
- `src/next/domain/nextMaterialiMovimentiDomain.ts`
- `src/next/domain/nextAttrezzatureCantieriDomain.ts`
- `src/next/domain/nextProcurementDomain.ts`
- `src/next/domain/nextLavoriDomain.ts`
- `src/next/nextAnagraficheFlottaDomain.ts`
- `src/next/domain/nextRifornimentiDomain.ts`
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/next/domain/nextCapoDomain.ts`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/domain/nextLibrettiExportDomain.ts`
- `src/next/domain/nextCisternaDomain.ts`
- `src/next/domain/nextColleghiDomain.ts`
- `src/next/domain/nextFornitoriDomain.ts`

### 4.5 Stato clone locale autisti
- `src/next/autisti/nextAutistiCloneRuntime.ts`
- `src/next/autisti/nextAutistiCloneState.ts`
- `src/next/autisti/nextAutistiCloneSegnalazioni.ts`
- `src/next/autisti/nextAutistiCloneRifornimenti.ts`
- `src/next/autisti/nextAutistiCloneRichiesteAttrezzature.ts`
- `src/next/autisti/nextAutistiCloneAttachments.ts`
- `src/next/autisti/next-autisti-clone.css`

### 4.6 Pagine madre / legacy realmente confrontate
- `src/pages/Home.tsx`
- `src/pages/CentroControllo.tsx`
- `src/pages/GestioneOperativa.tsx`
- `src/pages/Inventario.tsx`
- `src/pages/MaterialiConsegnati.tsx`
- `src/pages/AttrezzatureCantieri.tsx`
- `src/pages/Manutenzioni.tsx`
- `src/pages/Acquisti.tsx`
- `src/pages/MaterialiDaOrdinare.tsx`
- `src/pages/OrdiniInAttesa.tsx`
- `src/pages/OrdiniArrivati.tsx`
- `src/pages/DettaglioOrdine.tsx`
- `src/pages/LavoriDaEseguire.tsx`
- `src/pages/LavoriInAttesa.tsx`
- `src/pages/LavoriEseguiti.tsx`
- `src/pages/DettaglioLavoro.tsx`
- `src/pages/Mezzi.tsx`
- `src/pages/DossierLista.tsx`
- `src/pages/DossierMezzo.tsx`
- `src/pages/DossierGomme.tsx`
- `src/pages/DossierRifornimenti.tsx`
- `src/pages/AnalisiEconomica.tsx`
- `src/pages/CapoMezzi.tsx`
- `src/pages/CapoCostiMezzo.tsx`
- `src/pages/Colleghi.tsx`
- `src/pages/Fornitori.tsx`
- `src/pages/IA/IAHome.tsx`
- `src/pages/IA/IAApiKey.tsx`
- `src/pages/IA/IALibretto.tsx`
- `src/pages/IA/IADocumenti.tsx`
- `src/pages/IA/IACoperturaLibretti.tsx`
- `src/pages/LibrettiExport.tsx`
- `src/pages/CisternaCaravate/CisternaCaravatePage.tsx`
- `src/pages/CisternaCaravate/CisternaCaravateIA.tsx`
- `src/pages/CisternaCaravate/CisternaSchedeTest.tsx`
- `src/autistiInbox/AutistiInboxHome.tsx`
- `src/autistiInbox/AutistiAdmin.tsx`
- `src/autistiInbox/AutistiSegnalazioniAll.tsx`
- `src/autistiInbox/AutistiControlliAll.tsx`
- `src/autistiInbox/RichiestaAttrezzatureAll.tsx`
- `src/autistiInbox/AutistiLogAccessiAll.tsx`
- `src/autistiInbox/AutistiGommeAll.tsx`
- `src/autistiInbox/CambioMezzoInbox.tsx`
- `src/autisti/LoginAutista.tsx`
- `src/autisti/HomeAutista.tsx`
- `src/autisti/SetupMezzo.tsx`
- `src/autisti/CambioMezzoAutista.tsx`
- `src/autisti/ControlloMezzo.tsx`
- `src/autisti/Rifornimento.tsx`
- `src/autisti/Segnalazioni.tsx`
- `src/autisti/RichiestaAttrezzature.tsx`
- `src/pages/Mezzo360.tsx`
- `src/pages/Autista360.tsx`

## 5. Criterio di valutazione usato

### 5.1 Stato parita
- `PARI`: route ufficiale NEXT equivalente alla madre e gia appoggiata a layer puliti adeguati.
- `PARI MA RAW`: route ufficiale clone-fedele, ma ancora su letture/logiche legacy/raw o wrapper madre.
- `PARZIALE`: una parte della copertura c'e, ma mancano blocchi reali della madre o la UI ufficiale diverge.
- `SPEZZATO`: clone fedele e normalizzazione esistono, ma non sulla stessa superficie ufficiale.
- `MANCANTE`: manca davvero una porzione modulo/blocco necessaria alla parita.
- `FUORI PERIMETRO`: escluso volontariamente.
- `DA VERIFICARE`: il repo non dimostra abbastanza copertura o sicurezza per chiudere il giudizio.

### 5.2 Stato dati/layer
- `Raw madre`: la route ufficiale monta la pagina legacy o ne eredita logiche/dataset senza layer pulito ufficiale.
- `Mix raw + normalizzato`: la UI ufficiale usa ancora superfici legacy ma con supporti/contesti NEXT.
- `Dominio NEXT pulito`: la route ufficiale legge reader/read model dedicati NEXT.
- `Locale clone`: la route salva o gestisce stato solo in `localStorage` clone e non sulla madre.

### 5.3 Regola pratica usata nell'audit
- Conta la route ufficiale montata in `src/App.tsx`, non una pagina NEXT alternativa non agganciata al routing.
- Un modulo non diventa `PARI` solo perche esiste un domain pulito: deve essere il domain della superficie ufficiale.

## 6. Mappa completa moduli madre vs clone/NEXT

| Macro-area | Madre reale | Route ufficiali NEXT | Stato sintetico |
| --- | --- | --- | --- |
| Cabina di regia | `Home.tsx`, `CentroControllo.tsx` | `/next`, `/next/centro-controllo` | Home clone-fedele raw, Centro spezzato |
| Operativita globale | `GestioneOperativa.tsx` | `/next/gestione-operativa` | custom clean ma non clone fedele |
| Magazzino e materiali | `Inventario.tsx`, `MaterialiConsegnati.tsx`, `AttrezzatureCantieri.tsx`, `Manutenzioni.tsx` | `/next/inventario`, `/next/materiali-consegnati`, `/next/attrezzature-cantieri`, `/next/manutenzioni` | mix tra clean custom e wrapper raw |
| Procurement | `Acquisti.tsx`, `MaterialiDaOrdinare.tsx`, `OrdiniInAttesa.tsx`, `OrdiniArrivati.tsx`, `DettaglioOrdine.tsx` | `/next/acquisti`, `/next/materiali-da-ordinare`, `/next/ordini-in-attesa`, `/next/ordini-arrivati`, `/next/acquisti/dettaglio/:id` | fortemente spezzato |
| Lavori | `LavoriDaEseguire.tsx`, `LavoriInAttesa.tsx`, `LavoriEseguiti.tsx`, `DettaglioLavoro.tsx` | `/next/lavori-*`, `/next/dettagliolavori/:id` | spezzato tra create/list/detail |
| Flotta e dossier | `Mezzi.tsx`, `Dossier*`, `AnalisiEconomica.tsx`, `Capo*` | `/next/mezzi`, `/next/dossier*`, `/next/analisi-economica/:targa`, `/next/capo/*` | mix di D01/D02 clean e wrapper raw |
| IA documentale | `IAHome.tsx`, `IAApiKey.tsx`, `IALibretto.tsx`, `IADocumenti.tsx`, `IACoperturaLibretti.tsx`, `LibrettiExport.tsx` | `/next/ia*`, `/next/libretti-export` | hub custom, child routes in gran parte raw |
| Cisterna | `CisternaCaravatePage.tsx`, `CisternaCaravateIA.tsx`, `CisternaSchedeTest.tsx` | `/next/cisterna*` | base raw, verticale IA mista |
| Autisti | `autistiInbox/*`, `autisti/*` | `/next/autisti-inbox*`, `/next/autisti-admin`, `/next/autisti/*` | inbox/admin misti, field app locale clone |

## 7. Stato di parita modulo per modulo

### 7.1 Cabina di regia
- `Home` -> `PARI MA RAW`
  - `FATTO VERIFICATO NEL REPO`: `src/next/NextHomePage.tsx` monta `Home` dentro `NextMotherPage`; `Home.tsx` mantiene modali, PDF e collegamenti reali.
  - `VALUTAZIONE TECNICA`: la parita visiva e funzionale e alta, ma la superficie ufficiale dipende ancora dal runtime legacy e dai guard-rail DOM del clone.
  - `GAP REALE`: manca un layer ufficiale pulito che sostituisca la lettura/logica madre senza perdere modali e report.
- `Centro di Controllo` -> `SPEZZATO`
  - `FATTO VERIFICATO NEL REPO`: `src/App.tsx` monta `NextCentroControlloClonePage`, che wrappa `CentroControllo.tsx`; `NextCentroControlloPage.tsx` usa invece `readNextCentroControlloSnapshot` e `readNextAutistiReadOnlySnapshot`, ma non e agganciata alla route ufficiale.
  - `VALUTAZIONE TECNICA`: esiste sia il clone fedele sia il layer pulito `D10/D03`, ma non coincidono sulla stessa superficie ufficiale.
  - `GAP REALE`: portare la route ufficiale a parita madre sopra i reader `D10/D03`, senza ricadere sul wrapper raw.

### 7.2 Operativita globale e materiali
- `Gestione Operativa` -> `PARZIALE`
  - `FATTO VERIFICATO NEL REPO`: `NextGestioneOperativaPage.tsx` e `NextOperativitaGlobalePage.tsx` costruiscono una workbench read-only dedicata, non il clone fedele di `GestioneOperativa.tsx`.
  - `VALUTAZIONE TECNICA`: il layer e piu pulito della madre, ma la copertura operativa e la UI non sono equivalenti al modulo legacy.
  - `GAP REALE`: decidere se la route ufficiale deve essere clone fedele o workbench nuova, poi chiudere il delta residuo.
- `Inventario` -> `PARZIALE`
  - `FATTO VERIFICATO NEL REPO`: `NextInventarioPage.tsx` usa `nextInventarioDomain.ts`; il domain dichiara esplicitamente limiti su quantita, fornitore, foto, PDF e scritture.
  - `VALUTAZIONE TECNICA`: il dataset e piu pulito, ma la copertura non arriva ancora alla parita operativa della madre.
  - `GAP REALE`: filtri, tabelle, blocchi ausiliari e output documentali non sono ancora tutti equivalenti.
- `Materiali consegnati` -> `PARZIALE`
  - `FATTO VERIFICATO NEL REPO`: `NextMaterialiConsegnatiPage.tsx` usa `nextMaterialiMovimentiDomain.ts`, che ricostruisce il read-only da `@materialiconsegnati` e sorgenti collegate.
  - `VALUTAZIONE TECNICA`: buona normalizzazione `D05`, ma la superficie ufficiale resta ridotta rispetto al legacy.
  - `GAP REALE`: mancano parte della parita UI/report e dei dettagli operativi del modulo madre.
- `Attrezzature Cantieri` -> `PARI MA RAW`
  - `FATTO VERIFICATO NEL REPO`: la route NEXT ufficiale wrappa ancora la pagina madre.
  - `VALUTAZIONE TECNICA`: clone fedele utile per continuita operativa, ma ancora raw.
  - `GAP REALE`: reinnesto sopra reader dedicato o conferma esplicita che il raw resti temporaneo.
- `Manutenzioni` -> `PARI MA RAW`
  - `FATTO VERIFICATO NEL REPO`: la route NEXT ufficiale monta ancora la pagina legacy con blocco scritture clone-safe.
  - `VALUTAZIONE TECNICA`: copertura alta, pulizia dati bassa.
  - `GAP REALE`: spostare la superficie ufficiale su layer piu controllati senza perdere i blocchi madre.

### 7.3 Procurement e lavori
- `Procurement core` (`Acquisti`, `Ordini in attesa`, `Ordini arrivati`, `Dettaglio ordine`) -> `SPEZZATO`
  - `FATTO VERIFICATO NEL REPO`: `NextAcquistiPage.tsx`, `NextOrdiniInAttesaPage.tsx`, `NextOrdiniArrivatiPage.tsx` e `NextDettaglioOrdinePage.tsx` usano `NextProcurementStandalonePage` e `nextProcurementDomain.ts`; lo stesso domain dichiara `enabled: false` per `ordineMateriali`, `preventivi` e `listino`.
  - `VALUTAZIONE TECNICA`: il clone ha gia un nucleo `D06` pulito sugli ordini, ma non copre tutto il procurement legacy.
  - `GAP REALE`: parita incompleta su preventivi, listino, allegati, approvazioni e parti di dettaglio ordine.
- `Materiali da ordinare / fabbisogni` -> `PARI MA RAW`
  - `FATTO VERIFICATO NEL REPO`: `NextMaterialiDaOrdinarePage.tsx` continua a wrappare la pagina legacy.
  - `VALUTAZIONE TECNICA`: il punto di ingresso madre e conservato, ma la normalizzazione non e ancora quella ufficiale della superficie.
  - `GAP REALE`: fondere la copertura clone-fedele con il layer procurement pulito.
- `Preventivi / Listino prezzi` -> `MANCANTE`
  - `FATTO VERIFICATO NEL REPO`: `nextProcurementDomain.ts` marca esplicitamente questi blocchi come fuori copertura clone-safe.
  - `VALUTAZIONE TECNICA`: non si tratta di un semplice dettaglio UI, ma di una mancanza reale di copertura funzionale del procurement madre.
  - `GAP REALE`: definire reader/layer read-only dedicati o dichiarare ufficialmente la non parita del modulo.
- `Lavori` -> `SPEZZATO`
  - `FATTO VERIFICATO NEL REPO`: liste `lavori-in-attesa` e `lavori-eseguiti` usano `nextLavoriDomain.ts`; `NextDettaglioLavoroPage.tsx` resta wrapper raw; `NextLavoriDaEseguirePage.tsx` compone gruppi locali ma non salva su `@lavori`.
  - `VALUTAZIONE TECNICA`: la normalizzazione `D02` esiste, ma la copertura end-to-end create/list/detail non sta sulla stessa linea architetturale.
  - `GAP REALE`: allineare creazione, liste e dettaglio a un unico perimetro read-only coerente.

### 7.4 Flotta, dossier e analisi
- `Mezzi` -> `PARZIALE`
  - `FATTO VERIFICATO NEL REPO`: `NextMezziPage.tsx` usa il dominio anagrafica flotta `D01`, ma la madre `Mezzi.tsx` copre CRUD, upload e innesti IA piu ampi.
  - `VALUTAZIONE TECNICA`: il dato e piu pulito, la copertura madre non ancora completa.
  - `GAP REALE`: mancano pezzi reali di comportamento operativo e alcuni collegamenti/documenti del legacy.
- `Dossier lista` -> `PARI MA RAW`
  - `FATTO VERIFICATO NEL REPO`: `NextDossierListaPage.tsx` wrappa ancora la pagina legacy.
  - `VALUTAZIONE TECNICA`: continuita alta, pulizia dati bassa.
  - `GAP REALE`: usare il backbone `D01` senza perdere la lista reale della madre.
- `Dossier mezzo` -> `PARI MA RAW`
  - `FATTO VERIFICATO NEL REPO`: `NextDossierMezzoPage.tsx` monta ancora la pagina legacy; le sottosezioni pulite esistono altrove.
  - `VALUTAZIONE TECNICA`: il clone ufficiale e vicino alla madre, ma il layer ufficiale resta raw proprio nel punto di convergenza.
  - `GAP REALE`: spostare la spina dorsale del dossier su `D01/D02/D04/D07-D08`, mantenendo la stessa UX operativa.
- `Dossier Gomme` -> `PARI`
  - `FATTO VERIFICATO NEL REPO`: sia la madre sia la NEXT sono gia centrate su una sezione economica dedicata; la NEXT usa `nextManutenzioniGommeDomain.ts`.
  - `VALUTAZIONE TECNICA`: e il caso piu vicino alla parita piena con dato piu pulito.
  - `GAP REALE`: nessun gap strutturale maggiore emerso nel repo.
- `Dossier Rifornimenti` -> `PARI`
  - `FATTO VERIFICATO NEL REPO`: la madre usa gia una sezione dedicata, la NEXT replica la stessa impostazione sopra `nextRifornimentiDomain.ts`.
  - `VALUTAZIONE TECNICA`: parita sostanziale con normalizzazione migliore.
  - `GAP REALE`: nessun gap strutturale maggiore emerso nel repo.
- `Analisi Economica` -> `PARI MA RAW`
  - `FATTO VERIFICATO NEL REPO`: la route NEXT ufficiale wrappa ancora la pagina legacy.
  - `VALUTAZIONE TECNICA`: copertura madre mantenuta, ma senza layer ufficiale pulito sul path.
  - `GAP REALE`: riallineare il modulo al backbone dati puliti del dossier.
- `Capo Mezzi` e `Capo Costi Mezzo` -> `PARZIALE`
  - `FATTO VERIFICATO NEL REPO`: le pagine NEXT leggono snapshot dedicati (`nextCapoDomain.ts`), ma la madre espone flussi approvativi, PDF timbrati e cambi stato piu ricchi.
  - `VALUTAZIONE TECNICA`: buona direzione architetturale, parita operativa non ancora chiusa.
  - `GAP REALE`: approvazioni, emissioni documentali e alcune transizioni di stato mancano o sono bloccate.
- `Colleghi` e `Fornitori` -> `PARZIALE`
  - `FATTO VERIFICATO NEL REPO`: esistono pagine NEXT read-only con `readNextColleghiSnapshot` e `readNextFornitoriSnapshot`.
  - `VALUTAZIONE TECNICA`: i reader puliti ci sono, ma la superficie e ancora una consultazione ridotta rispetto alla madre.
  - `GAP REALE`: parte delle azioni, dei PDF e della profondita operativa non entra ancora nella parity line.

### 7.5 IA documentale, cisterna e autisti
- `IA hub` -> `PARZIALE`
  - `FATTO VERIFICATO NEL REPO`: `/next/ia` monta `NextIntelligenzaArtificialePage.tsx`, non il clone diretto di `IAHome.tsx`.
  - `VALUTAZIONE TECNICA`: area evoluta utile al clone, ma non equivalente al comportamento madre.
  - `GAP REALE`: la home IA non e ancora a parita 1:1.
- `IA API key`, `IA Libretto`, `IA Documenti`, `IA Copertura Libretti` -> `PARI MA RAW`
  - `FATTO VERIFICATO NEL REPO`: le child routes ufficiali restano per lo piu wrapper o superfici molto aderenti al legacy, con innesti clone-safe/handoff.
  - `VALUTAZIONE TECNICA`: copertura buona, ma ancora dipendente da logiche madre.
  - `GAP REALE`: il layer pulito esiste solo in parte e non governa ancora tutta la UX ufficiale.
- `Libretti Export` -> `PARZIALE`
  - `FATTO VERIFICATO NEL REPO`: la NEXT mantiene preview ed export preparatorio, ma blocca condivisione, copia link, WhatsApp e download che la madre esegue davvero.
  - `VALUTAZIONE TECNICA`: e una riduzione consapevole del perimetro, non parita piena.
  - `GAP REALE`: mancano i comportamenti di output reale del modulo legacy.
- `Cisterna base` -> `PARI MA RAW`
  - `FATTO VERIFICATO NEL REPO`: `NextCisternaPage.tsx` continua a wrappare la pagina madre.
  - `VALUTAZIONE TECNICA`: copertura funzionale buona ma ancora raw.
  - `GAP REALE`: il dominio `D09` non governa ancora la superficie base ufficiale.
- `Cisterna IA` e `Schede test` -> `PARZIALE`
  - `FATTO VERIFICATO NEL REPO`: `NextCisternaIAPage.tsx` usa `nextCisternaDomain.ts`, mentre `NextCisternaSchedeTestPage.tsx` resta piu vicina al legacy.
  - `VALUTAZIONE TECNICA`: la verticale IA e piu pulita del modulo base, ma la copertura complessiva resta mista.
  - `GAP REALE`: unificare base, IA e schede test sullo stesso perimetro dati e di UX.
- `Autisti Admin` -> `PARI MA RAW`
  - `FATTO VERIFICATO NEL REPO`: la pagina ufficiale mantiene forte aderenza alla madre, con supporto snapshot `D03` ma senza completo reimpianto della logica.
  - `VALUTAZIONE TECNICA`: consultazione quasi equivalente, dipendenza raw ancora alta.
  - `GAP REALE`: portare a layer pulito anche i blocchi ancora ereditati dal legacy.
- `Autisti Inbox Home` -> `PARZIALE`
  - `FATTO VERIFICATO NEL REPO`: `NextAutistiInboxHomePage.tsx` usa `readNextAutistiReadOnlySnapshot`.
  - `VALUTAZIONE TECNICA`: il punto ingresso e pulito, ma non chiude tutta la parity dell'ecosistema inbox.
  - `GAP REALE`: agganciare in modo uniforme le sottopagine e le loro azioni/report.
- `Autisti Inbox` sottopagine legacy -> `DA VERIFICARE`
  - `FATTO VERIFICATO NEL REPO`: diverse route NEXT (`Segnalazioni`, `Controlli`, `Richieste`, `Log accessi`, `Gomme`, `Cambio mezzo`) importano direttamente pagine legacy dell'inbox.
  - `VALUTAZIONE TECNICA`: il repo non dimostra in modo sufficiente la stessa robustezza clone-safe del pattern `NextMotherPage`.
  - `GAP REALE`: audit mirato su guard-rail reali, side effect residui e parita effettiva dei report.
- `Autisti campo /next/autisti/*` -> `PARZIALE`
  - `FATTO VERIFICATO NEL REPO`: il subtree custom usa storage locale clone (`@next_clone_autisti:*`) e messaggi espliciti di non sincronizzazione.
  - `VALUTAZIONE TECNICA`: utile come ambiente sicuro, ma non e parita 1:1 col runtime madre.
  - `GAP REALE`: chiarire se il target sia parity o sandbox operativa separata.

## 8. Stato dati/layer modulo per modulo

| Macro-area | Stato dati/layer | FATTO VERIFICATO NEL REPO | Valutazione tecnica |
| --- | --- | --- | --- |
| Home | Raw madre | `NextHomePage` -> `NextMotherPage` -> `Home` | parita alta, pulizia bassa |
| Centro di Controllo | Mix raw + normalizzato | route ufficiale raw, `NextCentroControlloPage` su `D10/D03` non montata | modulo spezzato |
| Gestione Operativa | Dominio NEXT pulito | snapshot composito `nextOperativitaGlobaleDomain.ts` | pulito ma non clone fedele |
| Inventario | Dominio NEXT pulito | `nextInventarioDomain.ts` | copertura ancora ridotta |
| Materiali consegnati | Dominio NEXT pulito | `nextMaterialiMovimentiDomain.ts` | buona base `D05`, non completa |
| Attrezzature Cantieri | Raw madre | wrapper legacy ufficiale | forte dipendenza dal legacy |
| Manutenzioni | Raw madre | wrapper legacy ufficiale | forte dipendenza dal legacy |
| Materiali da ordinare | Raw madre | wrapper legacy ufficiale | punto di ingresso procurement ancora sporco |
| Ordini / dettaglio ordine | Dominio NEXT pulito | `nextProcurementDomain.ts` legge `@ordini` | pulito ma perimetro incompleto |
| Preventivi / listino | MANCANTE nel layer pulito | flags `enabled: false` nel domain procurement | vero buco di parity |
| Lavori liste | Dominio NEXT pulito | `nextLavoriDomain.ts` | pulito ma non end-to-end |
| Lavori dettaglio | Raw madre | wrapper legacy ufficiale | gap sul punto di convergenza |
| Lavori creazione | Locale clone | `NextLavoriDaEseguirePage.tsx` salva solo stato locale | non equivalente alla madre |
| Mezzi | Dominio NEXT pulito | `nextAnagraficheFlottaDomain.ts` | layer corretto, UI non completa |
| Dossier lista | Raw madre | wrapper legacy ufficiale | ancora dipendente dal legacy |
| Dossier mezzo | Raw madre | wrapper legacy ufficiale | snodo critico ancora sporco |
| Dossier Gomme | Dominio NEXT pulito | `nextManutenzioniGommeDomain.ts` | caso piu maturo |
| Dossier Rifornimenti | Dominio NEXT pulito | `nextRifornimentiDomain.ts` | caso piu maturo |
| Analisi Economica | Raw madre | wrapper legacy ufficiale | non ancora reinnestata ai domain |
| Capo Mezzi / Costi | Dominio NEXT pulito | `nextCapoDomain.ts` | parita funzionale incompleta |
| Colleghi / Fornitori | Dominio NEXT pulito | `nextColleghiDomain.ts`, `nextFornitoriDomain.ts` | consultazione pulita ma ridotta |
| IA hub | Mix custom + handoff | superficie NEXT dedicata | utile ma non parity madre |
| IA child routes | Raw madre / mix | wrapper o superfici aderenti al legacy | clone fedele ma poco pulito |
| Libretti Export | Dominio NEXT pulito parziale | preview locale, no share/download reali | output ridotto |
| Cisterna base | Raw madre | wrapper legacy ufficiale | parita senza pulizia |
| Cisterna IA | Dominio NEXT pulito | `nextCisternaDomain.ts` | migliore del base, non completo |
| Autisti Admin | Mix raw + normalizzato | superficie aderente al legacy con `D03` | ancora ibrido |
| Autisti Inbox Home | Dominio NEXT pulito | `readNextAutistiReadOnlySnapshot` | buono come hub |
| Autisti Inbox sottopagine | DA VERIFICARE | import legacy diretto | rischio clone-safe |
| Autisti campo | Locale clone + fallback | storage `@next_clone_autisti:*` e fallback snapshot | sandbox, non parity |

## 9. Moduli spezzati: copertura vs normalizzazione

- `Centro di Controllo`
  - Copertura clone fedele: `NextCentroControlloClonePage.tsx`
  - Normalizzazione disponibile: `NextCentroControlloPage.tsx` + `nextCentroControlloDomain.ts`
  - Frattura reale: la route ufficiale usa ancora il clone raw e non il reader `D10`.
- `Procurement`
  - Copertura clone fedele: `NextMaterialiDaOrdinarePage.tsx`
  - Normalizzazione disponibile: `NextProcurementStandalonePage.tsx` + `nextProcurementDomain.ts`
  - Frattura reale: fabbisogni e ordini non stanno ancora su una sola superficie coerente; preventivi/listino restano fuori.
- `Lavori`
  - Copertura clone fedele: `NextDettaglioLavoroPage.tsx`
  - Normalizzazione disponibile: `NextLavoriInAttesaPage.tsx`, `NextLavoriEseguitiPage.tsx`, parte di `NextLavoriDaEseguirePage.tsx`
  - Frattura reale: liste, dettaglio e creazione parlano tre dialetti diversi.
- `Dossier Mezzo`
  - Copertura clone fedele: `NextDossierMezzoPage.tsx`
  - Normalizzazione disponibile: `D01`, `D02`, `D04`, `D07/D08`, piu le sottosezioni gomme/rifornimenti gia pulite
  - Frattura reale: il punto principale del dossier non usa ancora il backbone pulito.

## 10. Dipendenze reali e punti di rottura

- `Home`
  - Legge e orchestri componenti/modali/report della madre.
  - Punto di rottura: forte dipendenza da DOM patching e da link legacy verso moduli non tutti migrati.
- `Centro di Controllo`
  - Dipende da eventi autisti, segnalazioni, controlli, richieste attrezzature, rifornimenti e revisioni.
  - Punto di rottura: mismatch fra route ufficiale e layer `D10`.
- `Procurement`
  - Dipende da `@ordini`, `@preventivi`, `@listino_prezzi`, `@fornitori`, Storage allegati, IA estrazione e stati ordine.
  - Punto di rottura: il layer pulito legge solo `@ordini`; il resto resta legacy o assente.
- `Lavori`
  - Dipende da `@lavori` e dai collegamenti con dossier, note, documenti e flussi di stato.
  - Punto di rottura: dettaglio ancora raw e creazione solo locale clone.
- `Mezzi` / `Dossier`
  - Dipendono dal backbone `@mezzi_aziendali` e dai domini correlati di rifornimenti, gomme, costi e documenti.
  - Punto di rottura: la lista e il dossier principale non usano ancora ufficialmente il backbone pulito che gia alimenta sottosezioni mature.
- `IA documentale`
  - Dipende da documenti, libretti, export PDF, handoff e routing IA interno.
  - Punto di rottura: il subtree interno evolve bene, ma non coincide ancora con la parity madre delle superfici storiche.
- `Autisti`
  - Dipendono da `D03`, legacy inbox e storage locale clone.
  - Punto di rottura: coexistono snapshot read-only, import legacy diretti e sandbox locale.

## 11. Gap reali da chiudere

1. Portare la route ufficiale `/next/centro-controllo` sul layer `D10/D03` senza perdere la UI reale della madre.
2. Riallineare `Gestione Operativa` a una decisione unica: clone fedele governato da reader puliti oppure workbench dichiaratamente diversa.
3. Unificare il procurement ufficiale: fabbisogni, ordini, arrivi e dettaglio devono vivere sullo stesso perimetro.
4. Chiudere il buco vero di `Preventivi / Listino`, oggi esplicitamente fuori dal layer pulito.
5. Unificare `Lavori` tra creazione, liste e dettaglio, eliminando il triplo stato raw/clean/locale.
6. Portare `Mezzi` a parity madre sopra `D01`, recuperando i blocchi operativi oggi mancanti.
7. Portare il `Dossier Mezzo` ufficiale sul backbone pulito, sfruttando le sottosezioni gia mature.
8. Recuperare nei moduli `Capo` le approvazioni, i PDF timbrati e i passaggi di stato mancanti.
9. Chiudere il delta di `Inventario` e `Materiali consegnati` su tabelle, filtri, output e dettagli operativi.
10. Fare audit duro e messa in sicurezza delle sottopagine `Autisti Inbox` importate direttamente dal legacy.

## 12. Ordine corretto di chiusura gap

1. `P0` - `Centro di Controllo`: oggi e il caso piu netto di modulo spezzato con layer pulito gia esistente ma non ufficiale.
2. `P0` - `Mezzi` + `Dossier Mezzo`: sono la spina dorsale della flotta e oggi il punto principale resta raw.
3. `P0` - `Procurement`: prima unificare fabbisogni/ordini/dettaglio, poi decidere la strategia su preventivi/listino.
4. `P0` - `Lavori`: consolidare create/list/detail sullo stesso perimetro read-only.
5. `P0` - `Autisti Inbox` sottopagine: verificare guard-rail e rischi di side effect.
6. `P1` - `Inventario` e `Materiali consegnati`: chiudere i delta operativi sopra `D05`.
7. `P1` - `Capo`, `Analisi Economica`, `IA child routes`, `Libretti Export`: aumentare parity dove i domain esistono gia o sono vicini.
8. `P2` - `Cisterna`, `Colleghi`, `Fornitori`, rifiniture di `Gestione Operativa`: dopo aver stabilizzato i nodi centrali.

## 13. Rischi principali

- `Rischio 1 - falsa sensazione di parita`
  - `FATTO VERIFICATO NEL REPO`: piu route ufficiali NEXT sono wrapper madre o superfici raw con blocco scritture.
  - `VALUTAZIONE TECNICA`: il clone puo sembrare "finito" lato UI anche quando il layer dati ufficiale e ancora sporco.
- `Rischio 2 - moduli spezzati`
  - `FATTO VERIFICATO NEL REPO`: `Centro di Controllo`, `Procurement`, `Lavori`, `Dossier Mezzo` hanno copertura e normalizzazione separate.
  - `VALUTAZIONE TECNICA`: ogni sviluppo successivo rischia di duplicare logiche o peggiorare il mismatch.
- `Rischio 3 - dati sporchi e merge fragili`
  - `FATTO VERIFICATO NEL REPO`: piu domain dichiarano limiti espliciti e ricostruzioni prudenti su dataset eterogenei.
  - `VALUTAZIONE TECNICA`: la normalizzazione c'e, ma non basta ancora a dichiarare chiusi i domini sensibili.
- `Rischio 4 - superfici legacy importate direttamente`
  - `FATTO VERIFICATO NEL REPO`: alcune route autisti inbox importano direttamente pagine legacy.
  - `VALUTAZIONE TECNICA`: finche non c'e audit mirato, la sicurezza clone-safe non e pienamente dimostrata.
- `Rischio 5 - mismatch tra documentazione e runtime`
  - `FATTO VERIFICATO NEL REPO`: il caso piu chiaro resta il Centro di Controllo, dove il domain `D10` esiste ma non alimenta la route ufficiale.
  - `VALUTAZIONE TECNICA`: il rischio non e teorico; puo falsare priorita e percezione di avanzamento.

## 14. Cosa e dimostrato

- Non e dimostrato nel repo che il clone/NEXT sia oggi `UGUALE AL 100% ALLA MADRE`.
- E dimostrato che molte superfici ufficiali NEXT sono gia clone-fedeli come UI/comportamento di alto livello, ma ancora `PARI MA RAW`.
- E dimostrato che i reader/read model NEXT puliti esistono gia per aree importanti: `D01`, `D03`, `D04`, `D05`, `D06`, `D07/D08`, `D09`, `D10`.
- E dimostrato che questi layer puliti non governano ancora in modo uniforme tutte le route ufficiali del clone.
- E dimostrato che `Dossier Gomme` e `Dossier Rifornimenti` sono oggi i casi piu vicini alla parita piena con layer migliore della madre.
- E dimostrato che `Centro di Controllo`, `Procurement` e `Lavori` sono oggi i tre macro-casi piu chiaramente `SPEZZATO`.
- E dimostrato che `Targa 360` e `Autista 360` esistono nel repo ma restano `FUORI PERIMETRO` dell'obiettivo di parita.

## 15. Cosa resta `DA VERIFICARE`

- Le sottopagine `Autisti Inbox` importate dal legacy non sono ancora dimostrate come equivalenti al pattern di sicurezza `NextMotherPage`.
- La parity reale di alcuni blocchi secondari di `Mezzi`, `Dossier Mezzo`, `Capo` e `IA child routes` richiede audit piu granulare di modali, report e tabelle specifiche.
- La copertura effettiva di report/PDF in alcuni moduli custom NEXT non e completamente dimostrata solo dal codice statico e richiederebbe walkthrough runtime mirati.
- Una percentuale globale unica di parita non e dimostrabile senza imporre un peso arbitrario ai moduli; per questo audit si usa una classificazione per stato, non una percentuale sintetica artificiale.

## 16. Verdetto finale sullo stato del clone/NEXT

`VERDETTO`: il clone/NEXT non e oggi a parita `100%` con la madre. Lo stato reale emerso dal repository e ibrido:
- copertura clone-fedele ampia su molte route ufficiali;
- piu layer normalizzati gia disponibili e tecnicamente utili;
- pochi casi davvero `PARI`;
- diversi moduli ancora `PARI MA RAW`;
- tre macro-aree centrali chiaramente `SPEZZATO`;
- alcune mancanze funzionali vere, soprattutto nel procurement;
- alcuni punti ancora `DA VERIFICARE`, soprattutto nell'ecosistema autisti inbox.

### Lista finale sintetica

- `A. Gia pari`
  - `Dossier Gomme`
  - `Dossier Rifornimenti`
- `B. Pari ma raw`
  - `Home`
  - `Attrezzature Cantieri`
  - `Manutenzioni`
  - `Materiali da ordinare / fabbisogni`
  - `Dossier lista`
  - `Dossier mezzo`
  - `Analisi Economica`
  - `IA API key`
  - `IA Libretto`
  - `IA Documenti`
  - `IA Copertura Libretti`
  - `Cisterna base`
  - `Autisti Admin`
- `C. Parziali`
  - `Gestione Operativa`
  - `Inventario`
  - `Materiali consegnati`
  - `Mezzi`
  - `Capo Mezzi`
  - `Capo Costi Mezzo`
  - `Colleghi`
  - `Fornitori`
  - `IA hub`
  - `Libretti Export`
  - `Cisterna IA`
  - `Cisterna Schede test`
  - `Autisti Inbox Home`
  - `Autisti campo /next/autisti/*`
- `D. Spezzati`
  - `Centro di Controllo`
  - `Procurement core`
  - `Lavori`
  - `Dossier Mezzo` come backbone dati ufficiale
- `E. Mancanti`
  - `Preventivi`
  - `Listino prezzi`
- `F. Fuori perimetro`
  - `Targa 360 / Mezzo360`
  - `Autista 360`
- `G. Ordine corretto per chiudere i gap`
  - `Centro di Controllo`
  - `Mezzi + Dossier Mezzo`
  - `Procurement`
  - `Lavori`
  - `Autisti Inbox`
  - `Inventario + Materiali consegnati`
  - `Capo / IA child routes / Libretti Export`
  - `Cisterna / Colleghi / Fornitori / rifiniture Gestione Operativa`

## Tabella finale obbligatoria

| Modulo / Blocco | File madre | File NEXT | Stato parita | Stato dati/layer | Gap reale | Rischio | Priorita | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | `src/pages/Home.tsx` | `src/next/NextHomePage.tsx`, `src/next/NextMotherPage.tsx` | `PARI MA RAW` | Raw madre | manca layer ufficiale pulito | `ELEVATO` | `P1` | modali e PDF reali presenti |
| Centro di Controllo | `src/pages/CentroControllo.tsx` | `src/next/NextCentroControlloClonePage.tsx`, `src/next/NextCentroControlloPage.tsx` | `SPEZZATO` | Mix raw + normalizzato | route ufficiale non usa `D10/D03` | `EXTRA ELEVATO` | `P0` | caso piu netto di frattura |
| Gestione Operativa | `src/pages/GestioneOperativa.tsx` | `src/next/NextGestioneOperativaPage.tsx`, `src/next/NextOperativitaGlobalePage.tsx` | `PARZIALE` | Dominio NEXT pulito | UI e flussi non 1:1 | `ELEVATO` | `P1` | workbench diversa dal legacy |
| Inventario | `src/pages/Inventario.tsx` | `src/next/NextInventarioPage.tsx` | `PARZIALE` | Dominio NEXT pulito | copertura ridotta su dettagli/output | `ELEVATO` | `P1` | limiti espliciti nel domain |
| Materiali consegnati | `src/pages/MaterialiConsegnati.tsx` | `src/next/NextMaterialiConsegnatiPage.tsx` | `PARZIALE` | Dominio NEXT pulito | delta su tabelle/report/blocchi | `ELEVATO` | `P1` | base D05 gia utile |
| Attrezzature Cantieri | `src/pages/AttrezzatureCantieri.tsx` | `src/next/NextAttrezzatureCantieriPage.tsx` | `PARI MA RAW` | Raw madre | manca reader ufficiale clean | `NORMALE` | `P2` | clone fedele con blocchi write |
| Manutenzioni | `src/pages/Manutenzioni.tsx` | `src/next/NextManutenzioniPage.tsx` | `PARI MA RAW` | Raw madre | manca layer ufficiale pulito | `NORMALE` | `P2` | clone fedele con blocchi write |
| Materiali da ordinare | `src/pages/MaterialiDaOrdinare.tsx` | `src/next/NextMaterialiDaOrdinarePage.tsx` | `PARI MA RAW` | Raw madre | fabbisogni non unificati con D06 | `ELEVATO` | `P0` | punto ingresso procurement ancora legacy |
| Acquisti / Ordini / Dettaglio ordine | `src/pages/Acquisti.tsx`, `src/pages/OrdiniInAttesa.tsx`, `src/pages/OrdiniArrivati.tsx`, `src/pages/DettaglioOrdine.tsx` | `src/next/NextAcquistiPage.tsx`, `src/next/NextOrdiniInAttesaPage.tsx`, `src/next/NextOrdiniArrivatiPage.tsx`, `src/next/NextDettaglioOrdinePage.tsx`, `src/next/NextProcurementStandalonePage.tsx` | `SPEZZATO` | Dominio NEXT pulito | procurement non coperto end-to-end | `EXTRA ELEVATO` | `P0` | D06 legge solo `@ordini` |
| Preventivi / Listino prezzi | `src/pages/Acquisti.tsx` | `src/next/domain/nextProcurementDomain.ts` | `MANCANTE` | non coperto nel layer pulito | assenza reale di parity | `EXTRA ELEVATO` | `P0` | `enabled: false` nel domain |
| Lavori da eseguire | `src/pages/LavoriDaEseguire.tsx` | `src/next/NextLavoriDaEseguirePage.tsx` | `PARZIALE` | Locale clone | creazione non equivalente alla madre | `ELEVATO` | `P0` | nessuna scrittura `@lavori` |
| Lavori in attesa / eseguiti | `src/pages/LavoriInAttesa.tsx`, `src/pages/LavoriEseguiti.tsx` | `src/next/NextLavoriInAttesaPage.tsx`, `src/next/NextLavoriEseguitiPage.tsx` | `PARZIALE` | Dominio NEXT pulito | manca allineamento col dettaglio | `ELEVATO` | `P0` | D02 gia attivo |
| Dettaglio lavoro | `src/pages/DettaglioLavoro.tsx` | `src/next/NextDettaglioLavoroPage.tsx` | `SPEZZATO` | Raw madre | punto di convergenza ancora legacy | `ELEVATO` | `P0` | frattura create/list/detail |
| Mezzi | `src/pages/Mezzi.tsx` | `src/next/NextMezziPage.tsx` | `PARZIALE` | Dominio NEXT pulito | mancano blocchi CRUD/upload/IA | `EXTRA ELEVATO` | `P0` | D01 c'e ma non chiude la parity |
| Dossier lista | `src/pages/DossierLista.tsx` | `src/next/NextDossierListaPage.tsx` | `PARI MA RAW` | Raw madre | lista ufficiale non sul backbone pulito | `ELEVATO` | `P1` | clone fedele |
| Dossier mezzo | `src/pages/DossierMezzo.tsx` | `src/next/NextDossierMezzoPage.tsx` | `PARI MA RAW` | Raw madre | backbone ufficiale ancora sporco | `EXTRA ELEVATO` | `P0` | sottosezioni mature gia esistono |
| Dossier Gomme | `src/pages/DossierGomme.tsx` | `src/next/NextDossierGommePage.tsx`, `src/next/NextGommeEconomiaSection.tsx` | `PARI` | Dominio NEXT pulito | nessun gap strutturale maggiore emerso | `NORMALE` | `CHIUSO` | caso piu maturo |
| Dossier Rifornimenti | `src/pages/DossierRifornimenti.tsx` | `src/next/NextDossierRifornimentiPage.tsx`, `src/next/NextRifornimentiEconomiaSection.tsx` | `PARI` | Dominio NEXT pulito | nessun gap strutturale maggiore emerso | `NORMALE` | `CHIUSO` | caso piu maturo |
| Analisi Economica | `src/pages/AnalisiEconomica.tsx` | `src/next/NextAnalisiEconomicaPage.tsx` | `PARI MA RAW` | Raw madre | manca reinnesto su domain ufficiale | `ELEVATO` | `P1` | molto connessa al dossier |
| Capo Mezzi / Capo Costi Mezzo | `src/pages/CapoMezzi.tsx`, `src/pages/CapoCostiMezzo.tsx` | `src/next/NextCapoMezziPage.tsx`, `src/next/NextCapoCostiMezzoPage.tsx` | `PARZIALE` | Dominio NEXT pulito | approvazioni e PDF non completi | `ELEVATO` | `P1` | read-only credibile ma ridotto |
| Colleghi / Fornitori | `src/pages/Colleghi.tsx`, `src/pages/Fornitori.tsx` | `src/next/NextColleghiPage.tsx`, `src/next/NextFornitoriPage.tsx` | `PARZIALE` | Dominio NEXT pulito | consultazione ridotta vs madre | `NORMALE` | `P2` | anagrafiche pulite gia presenti |
| IA hub | `src/pages/IA/IAHome.tsx` | `src/next/NextIntelligenzaArtificialePage.tsx` | `PARZIALE` | Mix custom + handoff | home IA non 1:1 | `NORMALE` | `P2` | area evolutiva, non clone fedele |
| IA API key / Libretto / Documenti / Copertura | `src/pages/IA/IAApiKey.tsx`, `src/pages/IA/IALibretto.tsx`, `src/pages/IA/IADocumenti.tsx`, `src/pages/IA/IACoperturaLibretti.tsx` | `src/next/NextIAApiKeyPage.tsx`, `src/next/NextIALibrettoPage.tsx`, `src/next/NextIADocumentiPage.tsx`, `src/next/NextIACoperturaLibrettiPage.tsx` | `PARI MA RAW` | Raw madre / mix | manca controllo uniforme da layer pulito | `ELEVATO` | `P1` | handoff clone-safe gia presente |
| Libretti Export | `src/pages/LibrettiExport.tsx` | `src/next/NextLibrettiExportPage.tsx` | `PARZIALE` | Dominio NEXT pulito parziale | share/copy/WhatsApp/download bloccati | `NORMALE` | `P1` | preview presente |
| Cisterna base | `src/pages/CisternaCaravate/CisternaCaravatePage.tsx` | `src/next/NextCisternaPage.tsx` | `PARI MA RAW` | Raw madre | `D09` non governa la route base | `ELEVATO` | `P2` | clone fedele read-only |
| Cisterna IA / Schede test | `src/pages/CisternaCaravate/CisternaCaravateIA.tsx`, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx` | `src/next/NextCisternaIAPage.tsx`, `src/next/NextCisternaSchedeTestPage.tsx` | `PARZIALE` | Mix clean + legacy | superfici ancora miste | `ELEVATO` | `P2` | IA piu pulita del base |
| Autisti Admin | `src/autistiInbox/AutistiAdmin.tsx` | `src/next/NextAutistiAdminPage.tsx` | `PARI MA RAW` | Mix raw + normalizzato | restano blocchi legacy non reimpiantati | `ELEVATO` | `P1` | `D03` aiuta ma non basta |
| Autisti Inbox Home | `src/autistiInbox/AutistiInboxHome.tsx` | `src/next/NextAutistiInboxHomePage.tsx` | `PARZIALE` | Dominio NEXT pulito | ecosistema inbox non chiuso | `ELEVATO` | `P1` | buon hub read-only |
| Autisti Inbox sottopagine | `src/autistiInbox/AutistiSegnalazioniAll.tsx`, `src/autistiInbox/AutistiControlliAll.tsx`, `src/autistiInbox/RichiestaAttrezzatureAll.tsx`, `src/autistiInbox/AutistiLogAccessiAll.tsx`, `src/autistiInbox/AutistiGommeAll.tsx`, `src/autistiInbox/CambioMezzoInbox.tsx` | `src/next/NextAutistiInboxSegnalazioniPage.tsx`, `src/next/NextAutistiInboxControlliPage.tsx`, `src/next/NextAutistiInboxRichiestaAttrezzaturePage.tsx`, `src/next/NextAutistiInboxLogAccessiPage.tsx`, `src/next/NextAutistiInboxGommePage.tsx`, `src/next/NextAutistiInboxCambioMezzoPage.tsx` | `DA VERIFICARE` | import legacy diretto | sicurezza clone-safe da dimostrare | `EXTRA ELEVATO` | `P0` | audit mirato richiesto |
| Autisti campo /next/autisti/* | `src/autisti/*.tsx` | `src/next/autisti/*.tsx`, `src/next/NextAutisti*.tsx` | `PARZIALE` | Locale clone + fallback | sandbox sicura, non parity madre | `ELEVATO` | `P1` | usa `@next_clone_autisti:*` |
| Targa 360 / Mezzo360 | `src/pages/Mezzo360.tsx` | collegamenti legacy / nessuna parity richiesta | `FUORI PERIMETRO` | N/A | escluso volontariamente | `N/A` | `ESCLUSO` | sostituzione prevista via IA |
| Autista 360 | `src/pages/Autista360.tsx` | collegamenti legacy / nessuna parity richiesta | `FUORI PERIMETRO` | N/A | escluso volontariamente | `N/A` | `ESCLUSO` | sostituzione prevista via IA |
