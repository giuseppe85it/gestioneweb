# AUDIT VERIFICA FINALE NEXT AUTONOMA

Data audit: 2026-03-30  
Stato: CURRENT  
Tipo: audit puro avversariale sul repo reale

## 1. Scopo audit
- Verificare se `docs/audit/REPORT_FINALE_PROMPT_39_CHIUSURA_ULTIMI_8.md` corrisponde davvero al codice del repository.
- Verificare se il perimetro target NEXT e davvero chiuso e autonomo.
- Verificare se le route ufficiali `/next/*` del perimetro target montano ancora runtime madre.
- Distinguere con durezza tra:
  - `FATTO VERIFICATO`
  - `NON DIMOSTRATO`
  - `GAP REALE`

## 2. Regole del perimetro
- Madre intoccabile.
- Conta piu il codice reale del repo che i report precedenti.
- `Targa 360 / Mezzo360` e `Autista 360` restano `FUORI PERIMETRO`.
- Un modulo e considerato chiuso solo se:
  - la route ufficiale NEXT non monta runtime madre;
  - la parity esterna con la madre e dimostrabile;
  - sotto usa layer NEXT puliti o chiaramente ripuliti;
  - non restano accessi legacy critici sostanziali nascosti.

## 3. File realmente analizzati

### 3.1 Documentazione letta davvero
- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/data/DOMINI_DATI_CANONICI.md`
- `docs/data/REGOLE_STRUTTURA_DATI.md`
- `docs/flow-master/MAPPA_MAESTRA_FLUSSI_GESTIONALE.md`
- `docs/audit/AUDIT_COMPLETO_PARITA_CLONE_NEXT_VS_MADRE.md`
- `docs/audit/REPORT_FINALE_PROMPT_33_PARITA_NEXT.md`
- `docs/audit/REPORT_FINALE_PROMPT_34_PARITA_NEXT.md`
- `docs/audit/REPORT_FINALE_PROMPT_35_PARITA_NEXT.md`
- `docs/audit/REPORT_FINALE_PROMPT_36_RICOSTRUZIONE_RESIDUI.md`
- `docs/audit/REPORT_FINALE_PROMPT_37_RICOSTRUZIONE_NEXT_COMPLETA.md`
- `docs/audit/REPORT_FINALE_PROMPT_38_SVUOTAMENTO_BACKLOG_NEXT.md`
- `docs/audit/REPORT_FINALE_PROMPT_39_CHIUSURA_ULTIMI_8.md`
- `docs/audit/BACKLOG_ULTIMI_8_EXECUTION.md`
- `docs/change-reports/2026-03-29_2127_prompt39_chiusura-ultimi-8-next.md`
- `docs/continuity-reports/2026-03-29_2127_continuity_prompt39_chiusura-ultimi-8-next.md`

### 3.2 Routing e route NEXT ufficiali lette davvero
- `src/App.tsx`
- `src/next/NextHomePage.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/NextCentroControlloParityPage.tsx`
- `src/next/NextMezziPage.tsx`
- `src/next/NextDossierListaPage.tsx`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/NextDossierGommePage.tsx`
- `src/next/NextDossierRifornimentiPage.tsx`
- `src/next/NextAnalisiEconomicaPage.tsx`
- `src/next/NextGestioneOperativaPage.tsx`
- `src/next/NextInventarioPage.tsx`
- `src/next/NextMaterialiConsegnatiPage.tsx`
- `src/next/NextAttrezzatureCantieriPage.tsx`
- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `src/next/NextAcquistiPage.tsx`
- `src/next/NextProcurementStandalonePage.tsx`
- `src/next/NextProcurementReadOnlyPanel.tsx`
- `src/next/NextOrdiniInAttesaPage.tsx`
- `src/next/NextOrdiniArrivatiPage.tsx`
- `src/next/NextDettaglioOrdinePage.tsx`
- `src/next/NextLavoriDaEseguirePage.tsx`
- `src/next/NextLavoriInAttesaPage.tsx`
- `src/next/NextLavoriEseguitiPage.tsx`
- `src/next/NextDettaglioLavoroPage.tsx`
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
- `src/next/NextAutistiHomePage.tsx`
- `src/next/NextAutistiInboxHomePage.tsx`
- `src/next/NextAutistiAdminPage.tsx`
- `src/next/NextAutistiLoginPage.tsx`
- `src/next/NextAutistiSetupMezzoPage.tsx`
- `src/next/NextAutistiGatePage.tsx`

### 3.3 Runtime NEXT di supporto letti davvero
- `src/next/NextMotherPage.tsx`
- `src/next/NextLegacyStorageBoundary.tsx`
- `src/next/autisti/NextHomeAutistaNative.tsx`
- `src/next/autistiInbox/NextAutistiInboxHomeNative.tsx`
- `src/next/autistiInbox/NextAutistiAdminNative.tsx`
- `src/next/autistiInbox/nextAutistiAdminBridges.ts`
- `src/next/domain/nextAutistiDomain.ts`
- `src/next/domain/nextProcurementDomain.ts`
- `src/next/domain/nextCisternaDomain.ts`
- `src/next/domain/nextDossierMezzoDomain.ts`
- `src/next/domain/nextCapoDomain.ts`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/nextAnagraficheFlottaDomain.ts`

### 3.4 File legacy confrontati davvero
- `src/pages/Acquisti.tsx`
- `src/pages/IA/IALibretto.tsx`
- `src/pages/IA/IADocumenti.tsx`
- `src/pages/IA/IACoperturaLibretti.tsx`
- `src/pages/CisternaCaravate/CisternaCaravatePage.tsx`
- `src/pages/CisternaCaravate/CisternaCaravateIA.tsx`
- `src/pages/CisternaCaravate/CisternaSchedeTest.tsx`
- `src/autisti/Segnalazioni.tsx`
- `src/autisti/Rifornimento.tsx`
- `src/autisti/RichiestaAttrezzature.tsx`
- `src/autistiInbox/AutistiAdmin.tsx`

### 3.5 Verifiche repo eseguite davvero
- ricerca testuale in `src/next/**` per `NextMotherPage`, import `src/pages/**`, import `src/autisti/**`, import `src/autistiInbox/**`
- `git status --short -- src/pages src/autisti src/autistiInbox`
- `git diff --name-only -- src/pages src/autisti src/autistiInbox`

## 4. Verifica claim-by-claim del report 39

### Claim 1: "Ho chiuso davvero tutti gli ultimi 8 moduli residui del clone/NEXT"
- Esito: `SMENTITO`
- Fatto verificato:
  - `Acquisti / Preventivi / Listino` usa una pagina NEXT vera, ma `src/next/NextProcurementStandalonePage.tsx` dichiara esplicitamente che "PDF operativi e modifiche restano bloccati nel clone".
  - `src/next/NextProcurementReadOnlyPanel.tsx` espone tab e bottoni disabilitati per `Ordine materiali`, PDF, modifica ordine e aggiunta materiali.
  - `IA Libretto`, `IA Documenti`, `IA Copertura Libretti`, `Cisterna`, `Cisterna IA`, `Cisterna Schede Test` espongono esplicitamente azioni bloccate o solo preview clone-safe.
  - `Autisti / Inbox` non monta piu pagine legacy finali, ma continua a dipendere da helper/componenti legacy e da bridge Firestore/Storage clone-safe.

### Claim 2: "Le route ufficiali degli ultimi 8 non montano piu il runtime madre come soluzione finale"
- Esito: `CONFERMATO SOLO IN PARTE`
- Fatto verificato:
  - per gli 8 moduli del prompt 39 non risultano mount finali via `NextMotherPage` o import diretti di `src/pages/**` nei file route ufficiali principali;
  - questo claim non basta a dimostrare chiusura reale, perche parity esterna e dipendenze legacy restano aperte.

### Claim 3: "Fuori restano madre-like, sotto leggono da domain NEXT o bridge clone-safe dedicati"
- Esito: `NON DIMOSTRATO / SMENTITO A TRATTI`
- Fatto verificato:
  - lato layer dati, molte pagine NEXT usano davvero domain NEXT o facade clone-safe;
  - lato parity esterna, il codice mostra esplicitamente azioni bloccate, placeholder o riduzioni di flusso che non equivalgono al runtime madre.

### Claim 4: "Autisti / Inbox chiuso"
- Esito: `SMENTITO`
- Fatto verificato:
  - `src/next/autisti/NextHomeAutistaNative.tsx` importa `../../autisti/GommeAutistaModal` e `../../autisti/autistiStorage`;
  - `src/next/autistiInbox/NextAutistiInboxHomeNative.tsx` importa `../../autistiInbox/components/RifornimentiCard` e `../../autistiInbox/components/SessioniAttiveCard`;
  - `src/next/autistiInbox/NextAutistiAdminNative.tsx` usa `db`, `storage`, `getDoc`, `setDoc`, `deleteObject` via `nextAutistiAdminBridges.ts`;
  - `nextAutistiAdminBridges.ts` resta un bridge sopra Firestore/Storage reali, non un domain NEXT pulito autosufficiente.

### Claim 5: "Nessun eventuale modulo ancora non chiuso"
- Esito: `SMENTITO`
- Fatto verificato:
  - il perimetro target ufficiale include ancora molte route che montano `NextMotherPage` e `src/pages/**`;
  - i moduli finali del prompt 39 non sono dimostrabili come parity piena e diversi sono esplicitamente piu poveri o bloccati del madre.

## 5. Verifica route ufficiali NEXT

### 5.1 Route ufficiali che montano ancora runtime madre
- `Mezzi` -> `src/next/NextMezziPage.tsx`
- `Gestione Operativa` -> `src/next/NextGestioneOperativaPage.tsx`
- `Inventario` -> `src/next/NextInventarioPage.tsx`
- `Materiali consegnati` -> `src/next/NextMaterialiConsegnatiPage.tsx`
- `Attrezzature cantieri` -> `src/next/NextAttrezzatureCantieriPage.tsx`
- `Manutenzioni` -> `src/next/NextManutenzioniPage.tsx`
- `Ordini in attesa` -> `src/next/NextOrdiniInAttesaPage.tsx`
- `Ordini arrivati` -> `src/next/NextOrdiniArrivatiPage.tsx`
- `Dettaglio ordine` -> `src/next/NextDettaglioOrdinePage.tsx`
- `Lavori da eseguire` -> `src/next/NextLavoriDaEseguirePage.tsx`
- `Lavori in attesa` -> `src/next/NextLavoriInAttesaPage.tsx`
- `Lavori eseguiti` -> `src/next/NextLavoriEseguitiPage.tsx`
- `Dettaglio lavoro` -> `src/next/NextDettaglioLavoroPage.tsx`
- `Libretti Export` -> `src/next/NextLibrettiExportPage.tsx`

### 5.2 Route ufficiali NEXT native, ma non automaticamente chiuse
- `Home`
- `Centro di Controllo`
- `Materiali da ordinare`
- `Acquisti / Preventivi / Listino`
- `Dossier Lista`
- `Dossier Mezzo`
- `Analisi Economica`
- `Capo Mezzi`
- `Capo Costi Mezzo`
- `Colleghi`
- `Fornitori`
- `IA Home`
- `IA API Key`
- `IA Libretto`
- `IA Documenti`
- `IA Copertura Libretti`
- `Cisterna`
- `Cisterna IA`
- `Cisterna Schede Test`
- `Autisti / Inbox`

## 6. Verifica assenza runtime madre nelle route NEXT

### 6.1 Fatto verificato
La ricerca testuale in `src/next/**` trova ancora import diretti di runtime legacy in route ufficiali:
- `../pages/GestioneOperativa`
- `../pages/Inventario`
- `../pages/MaterialiConsegnati`
- `../pages/AttrezzatureCantieri`
- `../pages/Manutenzioni`
- `../pages/OrdiniInAttesa`
- `../pages/OrdiniArrivati`
- `../pages/DettaglioOrdine`
- `../pages/LavoriDaEseguire`
- `../pages/LavoriInAttesa`
- `../pages/LavoriEseguiti`
- `../pages/DettaglioLavoro`
- `../pages/Mezzi`
- `../pages/LibrettiExport`

### 6.2 Fatto verificato
Nel blocco Autisti / Inbox non risultano piu mount finali di pagine legacy madre, ma restano dipendenze runtime legacy:
- helper `src/autisti/autistiStorage`
- componenti `src/autisti/GommeAutistaModal`
- componenti `src/autistiInbox/components/*`
- bridge `nextAutistiAdminBridges.ts` sopra Firestore/Storage.

### 6.3 Conclusione tecnica
- `assenza runtime madre nelle route NEXT` = `NO` sul perimetro target complessivo;
- `assenza runtime madre nei soli ultimi 8 moduli del report 39` = `SI` solo a livello di mount finale, ma `NO` a livello di dipendenze legacy critiche e parity operativa.

## 7. Verifica parita esterna modulo per modulo

### 7.1 Moduli con parity esterna esplicitamente smentita dal codice
- `Materiali da ordinare`
  - fatto verificato: tab `Ordini`, `Arrivi`, `Prezzi & Preventivi` sono placeholder "In arrivo";
  - fatto verificato: il modal righe dichiara "Placeholder UI".
- `Acquisti / Preventivi / Listino`
  - fatto verificato: `NextProcurementStandalonePage` dichiara che "creazione ordini, preventivi, listino, PDF operativi e modifiche restano bloccati nel clone";
  - fatto verificato: `NextProcurementReadOnlyPanel` usa bottoni `disabled` su modifica ordine, PDF e aggiunta materiale.
- `IA Libretto`
  - fatto verificato: la pagina blocca `Analizza documento` e `Salva su mezzo`.
- `IA Documenti`
  - fatto verificato: la pagina blocca `Analizza con IA`, `Salva Documento` e `Importa materiali in Inventario`.
- `IA Copertura Libretti`
  - fatto verificato: la pagina blocca `ESEGUI RIPARAZIONE` e `Carica libretto` come veri flussi operativi.
- `Cisterna`
  - fatto verificato: il salvataggio del cambio mensile resta bloccato nel clone.
- `Cisterna IA`
  - fatto verificato: la descrizione dichiara "senza upload, analisi provider o salvataggi business reali";
  - fatto verificato: `Salva in archivio cisterna` resta bloccato.
- `Cisterna Schede Test`
  - fatto verificato: `Conferma e salva` e `Estrai con IA` non eseguono il workflow madre, ma impostano solo notice clone-safe.
- `Colleghi`
  - fatto verificato: `AGGIUNGI/SALVA MODIFICHE` ed `Elimina` mostrano alert clone-only e non eseguono il flusso madre.
- `Fornitori`
  - fatto verificato: `AGGIUNGI/SALVA MODIFICHE` ed `Elimina` mostrano alert clone-only e non eseguono il flusso madre.
- `IA API Key`
  - fatto verificato nel codice attuale: la route e NEXT nativa, ma la parity completa di save rispetto alla madre non e dimostrata in questo audit.

### 7.2 Moduli con parity esterna non dimostrata
- `Home`
- `Centro di Controllo`
- `Dossier Lista`
- `Dossier Mezzo`
- `Dossier Gomme`
- `Dossier Rifornimenti`
- `Analisi Economica`
- `Capo Mezzi`
- `Capo Costi Mezzo`
- `IA Home`

Motivo comune:
- la route e NEXT nativa o quasi nativa;
- il codice mostra molte superfici operative;
- questo audit non dimostra in modo completo e puntuale equivalenza `UI + filtri + modali + PDF + flussi` rispetto alla madre senza ulteriori confronti linea-per-linea.

### 7.3 Moduli sicuramente non autonomi perche ancora su `NextMotherPage`
- `Mezzi`
- `Gestione Operativa`
- `Inventario`
- `Materiali consegnati`
- `Attrezzature cantieri`
- `Manutenzioni`
- `Ordini in attesa`
- `Ordini arrivati`
- `Dettaglio ordine`
- `Lavori da eseguire`
- `Lavori in attesa`
- `Lavori eseguiti`
- `Dettaglio lavoro`
- `Libretti Export`

## 8. Verifica layer dati modulo per modulo

### 8.1 Layer NEXT realmente usati
- `Home` / `Centro di Controllo` -> `nextCentroControlloDomain`, `nextAutistiDomain`
- `Dossier` / `Analisi` / `Capo` -> `nextDossierMezzoDomain`, `nextCapoDomain`, `nextDocumentiCostiDomain`
- `Procurement` -> `nextProcurementDomain`
- `IA Libretto` -> `internalAiLibrettoPreviewFacade`, `nextAnagraficheFlottaDomain`
- `IA Documenti` -> `nextDocumentiCostiDomain`, `internalAiDocumentsPreviewFacade`
- `IA Copertura Libretti` -> `nextAnagraficheFlottaDomain`
- `Cisterna*` -> `nextCisternaDomain`

### 8.2 Accessi legacy critici ancora presenti
- `Autisti / Inbox`
  - import di `src/autisti/autistiStorage`
  - import di componenti `src/autistiInbox/components/*`
  - `NextAutistiAdminNative.tsx` usa `db/storage/getDoc/setDoc/deleteObject` via bridge
- `Procurement`
  - il layer e NEXT, ma la UI dichiara esplicitamente flussi bloccati; quindi il problema non e il reader ma la mancanza di parity esterna.
- `IA legacy`
  - il layer e NEXT, ma le azioni operative reali madre non sono replicate.
- `Cisterna`
  - il layer e NEXT, ma diverse azioni restano solo preview o bloccate.

### 8.3 Conclusione tecnica
- `layer NEXT pulito sotto` = `SI` solo su una parte del perimetro;
- `layer NEXT pulito e sufficiente a dichiarare chiusura` = `NO`, perche parity esterna e autonomia restano non dimostrate o smentite.

## 9. Verifica madre intoccata

### 9.1 Fatto verificato
- `git status --short -- src/pages src/autisti src/autistiInbox` -> nessun output
- `git diff --name-only -- src/pages src/autisti src/autistiInbox` -> nessun output

### 9.2 Conclusione
- `FATTO VERIFICATO`: nel worktree attuale non risultano modifiche locali ai file runtime madre.
- `NON DIMOSTRATO`: da questo audit non e ricostruibile con certezza assoluta l'intera storia dei prompt precedenti a livello di commit gia consolidati.

## 10. Verifica autonomia reale della NEXT

Verdetto netto:

`NO, NEXT non ancora lavorabile in autonomia sul perimetro target`

Motivazione basata solo su fatti verificati:
- molte route ufficiali del perimetro target montano ancora `NextMotherPage` e pagine `src/pages/**`;
- vari moduli NEXT nativi del report 39 bloccano esplicitamente flussi operativi, modali o PDF che nella madre sono reali;
- il blocco `Autisti / Inbox` continua a dipendere da helper/componenti legacy e da bridge runtime verso Firestore/Storage;
- la documentazione finale precedente dichiara backlog chiuso, ma il codice non lo conferma.

## 11. Elenco punti NON DIMOSTRATI
- parity completa `Home` vs `src/pages/Home.tsx`
- parity completa `Centro di Controllo` vs `src/pages/CentroControllo.tsx`
- parity completa `Dossier Lista`
- parity completa `Dossier Mezzo`
- parity completa `Dossier Gomme`
- parity completa `Dossier Rifornimenti`
- parity completa `Analisi Economica`
- parity completa `Capo Mezzi`
- parity completa `Capo Costi Mezzo`
- parity completa `IA Home`
- storico completo dei commit passati sulla madre

## 12. Elenco gap reali trovati
- Il report 39 dichiara chiusi tutti gli ultimi 8 moduli, ma il codice smentisce parity operativa su procurement, IA legacy, cisterna e autisti/inbox.
- Il perimetro target complessivo non e chiuso: molte route ufficiali NEXT usano ancora `NextMotherPage`.
- `Autisti / Inbox` non e autonomo: la dipendenza da `src/autisti/**`, `src/autistiInbox/components/**` e bridge Firestore/Storage e reale.
- `Libretti Export` non e chiuso: la route ufficiale monta ancora `src/pages/LibrettiExport.tsx`.
- `Materiali da ordinare` non e chiuso: le tab principali e varie azioni sono solo placeholder.
- `Colleghi` e `Fornitori` non sono parity piena: add/edit/delete restano alert clone-only.
- La documentazione centrale (`STATO_MIGRAZIONE_NEXT.md`, `MATRICE_ESECUTIVA_NEXT.md`, `REGISTRO_MODIFICHE_CLONE.md`, report 39) risulta piu ottimistica del codice reale.

## 13. Verdetto finale netto
- Il claim "perimetro target chiuso" e `FALSO`.
- Il claim "ultimi 8 moduli davvero chiusi" e `FALSO`.
- Il claim "NEXT autonoma sul perimetro target" e `FALSO`.
- Il claim "madre non toccata" e `VERIFICATO SOLO SUL WORKTREE ATTUALE`.
- `Targa 360 / Mezzo360` e `Autista 360` restano correttamente `FUORI PERIMETRO`.

## 14. Tabella finale obbligatoria

| Modulo | Route/file NEXT ufficiale | Runtime madre montato? | Layer NEXT pulito? | Parita esterna dimostrata? | Stato finale | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Home | `src/next/NextHomePage.tsx` | no | si | non dimostrato | `NON DIMOSTRATO` | route NEXT nativa, confronto completo col madre non dimostrato |
| Centro di Controllo | `src/next/NextCentroControlloParityPage.tsx` | no | si | non dimostrato | `NON DIMOSTRATO` | route NEXT nativa, parity completa non dimostrata |
| Mezzi | `src/next/NextMezziPage.tsx` | si | non dimostrato | no | `NON CHIUSO` | monta `Mezzi` dentro `NextMotherPage` |
| Dossier Lista | `src/next/NextDossierListaPage.tsx` | no | si | non dimostrato | `NON DIMOSTRATO` | route NEXT nativa |
| Dossier Mezzo | `src/next/NextDossierMezzoPage.tsx` | no | si | non dimostrato | `NON DIMOSTRATO` | route NEXT nativa, semantica documenti non allineata in modo dimostrato |
| Dossier Gomme | `src/next/NextDossierGommePage.tsx` | no | si | non dimostrato | `NON DIMOSTRATO` | route NEXT nativa |
| Dossier Rifornimenti | `src/next/NextDossierRifornimentiPage.tsx` | no | si | non dimostrato | `NON DIMOSTRATO` | route NEXT nativa |
| Gestione Operativa | `src/next/NextGestioneOperativaPage.tsx` | si | non dimostrato | no | `NON CHIUSO` | monta `GestioneOperativa` dentro `NextMotherPage` |
| Inventario | `src/next/NextInventarioPage.tsx` | si | non dimostrato | no | `NON CHIUSO` | monta `Inventario` dentro `NextMotherPage` |
| Materiali consegnati | `src/next/NextMaterialiConsegnatiPage.tsx` | si | non dimostrato | no | `NON CHIUSO` | monta `MaterialiConsegnati` dentro `NextMotherPage` |
| Materiali da ordinare | `src/next/NextMaterialiDaOrdinarePage.tsx` | no | si | no | `NON CHIUSO` | tab placeholder e modali placeholder |
| Acquisti / Preventivi / Listino | `src/next/NextAcquistiPage.tsx` | no | si | no | `NON CHIUSO` | azioni e PDF operativi esplicitamente bloccati |
| Ordini in attesa | `src/next/NextOrdiniInAttesaPage.tsx` | si | non dimostrato | no | `NON CHIUSO` | monta `OrdiniInAttesa` dentro `NextMotherPage` |
| Ordini arrivati | `src/next/NextOrdiniArrivatiPage.tsx` | si | non dimostrato | no | `NON CHIUSO` | monta `OrdiniArrivati` dentro `NextMotherPage` |
| Dettaglio ordine | `src/next/NextDettaglioOrdinePage.tsx` | si | non dimostrato | no | `NON CHIUSO` | monta `DettaglioOrdine` dentro `NextMotherPage` |
| Lavori da eseguire | `src/next/NextLavoriDaEseguirePage.tsx` | si | non dimostrato | no | `NON CHIUSO` | monta `LavoriDaEseguire` dentro `NextMotherPage` |
| Lavori in attesa | `src/next/NextLavoriInAttesaPage.tsx` | si | non dimostrato | no | `NON CHIUSO` | monta `LavoriInAttesa` dentro `NextMotherPage` |
| Lavori eseguiti | `src/next/NextLavoriEseguitiPage.tsx` | si | non dimostrato | no | `NON CHIUSO` | monta `LavoriEseguiti` dentro `NextMotherPage` |
| Dettaglio lavoro | `src/next/NextDettaglioLavoroPage.tsx` | si | non dimostrato | no | `NON CHIUSO` | monta `DettaglioLavoro` dentro `NextMotherPage` |
| Capo Mezzi | `src/next/NextCapoMezziPage.tsx` | no | si | non dimostrato | `NON DIMOSTRATO` | route NEXT nativa |
| Capo Costi Mezzo | `src/next/NextCapoCostiMezzoPage.tsx` | no | si | non dimostrato | `NON DIMOSTRATO` | route NEXT nativa, parity completa non provata |
| Colleghi | `src/next/NextColleghiPage.tsx` | no | si | no | `NON CHIUSO` | add/edit/delete restano clone-only |
| Fornitori | `src/next/NextFornitoriPage.tsx` | no | si | no | `NON CHIUSO` | add/edit/delete restano clone-only |
| IA Home | `src/next/NextIntelligenzaArtificialePage.tsx` | no | si | non dimostrato | `NON DIMOSTRATO` | route NEXT nativa |
| IA API Key | `src/next/NextIAApiKeyPage.tsx` | no | si | non dimostrato | `NON DIMOSTRATO` | save parity non dimostrata in questo audit |
| IA Libretto | `src/next/NextIALibrettoPage.tsx` | no | si | no | `NON CHIUSO` | OCR/save bloccati |
| IA Documenti | `src/next/NextIADocumentiPage.tsx` | no | si | no | `NON CHIUSO` | OCR/save/import inventario bloccati |
| IA Copertura Libretti | `src/next/NextIACoperturaLibrettiPage.tsx` | no | si | no | `NON CHIUSO` | repair/upload bloccati |
| Libretti Export | `src/next/NextLibrettiExportPage.tsx` | si | non dimostrato | no | `NON CHIUSO` | monta `LibrettiExport` dentro `NextMotherPage` |
| Cisterna | `src/next/NextCisternaPage.tsx` | no | si | no | `NON CHIUSO` | salvataggi operativi non equivalenti al madre |
| Cisterna IA | `src/next/NextCisternaIAPage.tsx` | no | si | no | `NON CHIUSO` | upload/provider/save reali assenti |
| Cisterna Schede Test | `src/next/NextCisternaSchedeTestPage.tsx` | no | si | no | `NON CHIUSO` | estrazione e salvataggio reali assenti |
| Autisti app | `src/next/NextAutistiHomePage.tsx` e route `/next/autisti/*` | no | no | no | `NON CHIUSO` | restano helper/componenti `src/autisti/**` |
| Autisti Inbox | `src/next/NextAutistiInboxHomePage.tsx`, `src/next/NextAutistiAdminPage.tsx` e route `/next/autisti-inbox/*` | no | no | no | `NON CHIUSO` | restano componenti `src/autistiInbox/**` e bridge Firestore/Storage |
