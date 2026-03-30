# AUDIT FINALE POST PROMPT 42 - NEXT AUTONOMA

Data audit: 2026-03-30  
Stato: CURRENT  
Tipo: audit puro avversariale sul repo reale dopo prompt 42

## 1. Scopo audit
- verificare il prompt 42 contro il codice reale e non contro il suo report esecutivo;
- verificare se il perimetro target e davvero chiuso dopo il prompt 42;
- verificare se la NEXT e davvero lavorabile in autonomia sul perimetro target;
- verificare se la madre risulta intoccata nel worktree corrente;
- distinguere con durezza tra `CHIUSO`, `PARZIALE`, `APERTO`, `DA VERIFICARE`.

## 2. Fonti lette davvero

### 2.1 Documenti letti davvero
- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md`
- `docs/audit/AUDIT_VERIFICA_FINALE_NEXT_AUTONOMA.md`
- `docs/audit/BACKLOG_GAP_AUDIT_FINALE_EXECUTION.md`
- `docs/change-reports/2026-03-30_1012_prompt42_procedura-madre-clone-chiusura-gap-audit.md`
- `docs/continuity-reports/2026-03-30_1012_continuity_prompt42_procedura-madre-clone-chiusura-gap-audit.md`

### 2.2 Routing e runtime NEXT letti davvero
- `src/App.tsx`
- `src/next/NextHomePage.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/NextCentroControlloParityPage.tsx`
- `src/next/NextGestioneOperativaPage.tsx`
- `src/next/NextOperativitaGlobalePage.tsx`
- `src/next/NextInventarioPage.tsx`
- `src/next/NextInventarioReadOnlyPanel.tsx`
- `src/next/NextMaterialiConsegnatiPage.tsx`
- `src/next/NextMaterialiConsegnatiReadOnlyPanel.tsx`
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `src/next/NextAcquistiPage.tsx`
- `src/next/NextProcurementStandalonePage.tsx`
- `src/next/NextProcurementReadOnlyPanel.tsx`
- `src/next/NextOrdiniInAttesaPage.tsx`
- `src/next/NextOrdiniArrivatiPage.tsx`
- `src/next/NextDettaglioOrdinePage.tsx`
- `src/next/NextLavoriDaEseguirePage.tsx`
- `src/next/NextLavoriInAttesaPage.tsx`
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
- `src/next/NextIALibrettoPage.tsx`
- `src/next/NextIADocumentiPage.tsx`
- `src/next/NextIACoperturaLibrettiPage.tsx`
- `src/next/NextLibrettiExportPage.tsx`
- `src/next/NextCisternaPage.tsx`
- `src/next/NextCisternaIAPage.tsx`
- `src/next/NextCisternaSchedeTestPage.tsx`
- `src/next/NextAutistiAdminPage.tsx`
- `src/next/NextLegacyStorageBoundary.tsx`
- `src/next/domain/nextAutistiDomain.ts`

### 2.3 File madre letti davvero per confronto
- `src/pages/Acquisti.tsx`
- `src/pages/CapoCostiMezzo.tsx`
- `src/pages/IA/IALibretto.tsx`
- `src/pages/IA/IADocumenti.tsx`
- `src/pages/IA/IACoperturaLibretti.tsx`
- `src/pages/CisternaCaravate/CisternaCaravatePage.tsx`
- `src/pages/CisternaCaravate/CisternaCaravateIA.tsx`
- `src/pages/CisternaCaravate/CisternaSchedeTest.tsx`
- `src/autisti/HomeAutista.tsx`
- `src/autisti/Rifornimento.tsx`
- `src/autisti/Segnalazioni.tsx`
- `src/autisti/RichiestaAttrezzature.tsx`
- `src/autistiInbox/AutistiAdmin.tsx`

### 2.4 Verifiche repo eseguite davvero
- ricerca testuale in `src/next/**` e `src/App.tsx` per `NextMotherPage`
- ricerca testuale in `src/next/**` per import runtime da `src/pages/**`, `src/autisti/**`, `src/autistiInbox/**`
- `git status --short -- src/pages src/autisti src/autistiInbox`
- `git diff --name-only -- src/pages src/autisti src/autistiInbox`
- confronto puntuale tra route ufficiali e file realmente montati in `src/App.tsx`

## 3. Regole del perimetro
- madre intoccabile;
- NEXT unico perimetro di evoluzione;
- `Mezzo360 / Targa360` e `Autista360` restano fuori perimetro;
- una route non e `CHIUSA` se:
  - monta ancora runtime madre;
  - oppure, anche se nativa, tiene bloccati o locali flussi madre critici;
  - oppure la parity esterna non e dimostrabile dal repo;
  - oppure sotto resta un boundary legacy-shaped sostanziale al posto di layer NEXT puliti.

## 4. Verifica claim del prompt 42

### Claim confermati
- esiste il file procedurale `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md`;
- esiste il backlog `docs/audit/BACKLOG_GAP_AUDIT_FINALE_EXECUTION.md`;
- le route ufficiali del perimetro target non montano piu `NextMotherPage` come runtime finale;
- le route ufficiali del perimetro target non montano piu `src/pages/**`, `src/autisti/**` o `src/autistiInbox/**` come runtime finale;
- la madre non risulta modificata nel worktree corrente:
  - `git status --short -- src/pages src/autisti src/autistiInbox` -> nessuna modifica;
  - `git diff --name-only -- src/pages src/autisti src/autistiInbox` -> nessuna differenza nel worktree corrente.

### Claim smentiti o solo parziali
- `perimetro target chiuso` -> `SMENTITO`;
- `nessun gap aperto nel perimetro target` -> `SMENTITO`;
- `NEXT lavorabile in autonomia sul perimetro target` -> `SMENTITO`;
- `Autisti / Inbox chiuso davvero` -> `SMENTITO`: il mount finale e NEXT, ma il modulo resta clone-local e in parte appoggiato a boundary legacy-shaped;
- `backlog audit finale chiuso davvero` -> `SMENTITO`: il backlog esecutivo del prompt 42 risulta segnato come chiuso, ma il codice mostra ancora moduli `clone-only`, `preview`, `locale` o con azioni bloccate dove la madre e operativa davvero.

## 5. Verifica route ufficiali NEXT

| Modulo | Route/file NEXT ufficiale | `NextMotherPage`? | `src/pages/**` runtime finale? | `src/autisti/**` runtime finale? | `src/autistiInbox/**` runtime finale? | Layer NEXT pulito? | Parita esterna dimostrata? | Stato finale | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | `/next` -> `src/next/NextHomePage.tsx` | NO | NO | NO | NO | NO | DA VERIFICARE | PARZIALE | Usa `NextLegacyStorageBoundary` e `NextCentroControlloPage`, che a sua volta usa helper/componenti legacy shared. |
| Centro di Controllo | `/next/centro-controllo` -> `src/next/NextCentroControlloParityPage.tsx` | NO | NO | NO | NO | SI | DA VERIFICARE | DA VERIFICARE | Route nativa con reader NEXT e PDF preview; parity piena non dimostrata dal repo senza test UI esterno. |
| Gestione Operativa | `/next/gestione-operativa` -> `src/next/NextGestioneOperativaPage.tsx` | NO | NO | NO | NO | SI | NO | PARZIALE | La superficie e NEXT, ma integra pannelli con azioni bloccate o clone-only. |
| Inventario | `/next/inventario` -> `src/next/NextInventarioPage.tsx` | NO | NO | NO | NO | SI | NO | PARZIALE | `Aggiungi al magazzino`, `Anteprima PDF`, `Elimina`, `Modifica` e variazioni quantita sono disabilitate. |
| Materiali consegnati | `/next/materiali-consegnati` -> `src/next/NextMaterialiConsegnatiPage.tsx` | NO | NO | NO | NO | SI | NO | PARZIALE | `Registra consegna`, `Scarica PDF` ed `Elimina` restano bloccati. |
| Materiali da ordinare | `/next/materiali-da-ordinare` -> `src/next/NextMaterialiDaOrdinarePage.tsx` | NO | NO | NO | NO | SI | NO | PARZIALE | Ordini, preventivi, allegati e fonti prezzo vengono salvati solo nel clone. |
| Acquisti | `/next/acquisti` -> `src/next/NextAcquistiPage.tsx` | NO | NO | NO | NO | SI | NO | PARZIALE | `NextProcurementStandalonePage` si definisce `clone-only`. |
| Ordini in attesa | `/next/ordini-in-attesa` -> `src/next/NextOrdiniInAttesaPage.tsx` | NO | NO | NO | NO | SI | NO | PARZIALE | Vista nativa sopra lo stesso workbench procurement clone-only. |
| Ordini arrivati | `/next/ordini-arrivati` -> `src/next/NextOrdiniArrivatiPage.tsx` | NO | NO | NO | NO | SI | NO | PARZIALE | Vista nativa sopra lo stesso workbench procurement clone-only. |
| Dettaglio ordine | `/next/acquisti/dettaglio/:ordineId` e `/next/dettaglio-ordine/:ordineId` -> `src/next/NextDettaglioOrdinePage.tsx` | NO | NO | NO | NO | SI | NO | PARZIALE | `Segna Arrivato`, `Modifica`, `PDF` e `+ Aggiungi materiale` aggiornano solo il clone. |
| Lavori da eseguire | `/next/lavori-da-eseguire` -> `src/next/NextLavoriDaEseguirePage.tsx` | NO | NO | NO | NO | SI | NO | PARZIALE | Apertura gruppo e salvataggio restano clone-local. |
| Lavori in attesa | `/next/lavori-in-attesa` -> `src/next/NextLavoriInAttesaPage.tsx` | NO | NO | NO | NO | SI | NO | PARZIALE | La lista dipende da un workflow lavori che nel clone salva e aggiorna solo localmente. |
| Lavori eseguiti | `/next/lavori-eseguiti` -> `src/next/NextLavoriEseguitiPage.tsx` | NO | NO | NO | NO | SI | NO | PARZIALE | Storico letto dal layer NEXT, ma il modulo lavori resta clone-local sulle azioni operative. |
| Dettaglio lavoro | `/next/dettagliolavori/:lavoroId` -> `src/next/NextDettaglioLavoroPage.tsx` | NO | NO | NO | NO | SI | NO | PARZIALE | `Salva modifica`, `Segna eseguito` ed `Elimina` lavorano solo nel clone. |
| Mezzi | `/next/mezzi` -> `src/next/NextMezziPage.tsx` | NO | NO | NO | NO | SI | NO | PARZIALE | `NextMezziDossierPage` mantiene save/delete bloccati e analisi libretto bloccata. |
| Dossier lista | `/next/dossiermezzi` -> `src/next/NextDossierListaPage.tsx` | NO | NO | NO | NO | SI | DA VERIFICARE | DA VERIFICARE | Lista nativa sopra anagrafiche NEXT; parity piena non dimostrata. |
| Dossier mezzo | `/next/dossier/:targa` e `/next/dossiermezzi/:targa` -> `src/next/NextDossierMezzoPage.tsx` | NO | NO | NO | NO | SI | NO | PARZIALE | Nascondere documenti vale solo localmente nel clone. |
| Dossier gomme | `/next/dossier/:targa/gomme` -> `src/next/NextDossierGommePage.tsx` | NO | NO | NO | NO | DA VERIFICARE | DA VERIFICARE | DA VERIFICARE | Route nativa; parity esterna non dimostrata da questo audit. |
| Dossier rifornimenti | `/next/dossier/:targa/rifornimenti` -> `src/next/NextDossierRifornimentiPage.tsx` | NO | NO | NO | NO | DA VERIFICARE | DA VERIFICARE | DA VERIFICARE | Route nativa; parity esterna non dimostrata da questo audit. |
| Analisi Economica | `/next/analisi-economica/:targa` -> `src/next/NextAnalisiEconomicaPage.tsx` | NO | NO | NO | NO | SI | NO | PARZIALE | Analisi e salvataggi sono esplicitamente `clone_only`. |
| Capo mezzi | `/next/capo/mezzi` -> `src/next/NextCapoMezziPage.tsx` | NO | NO | NO | NO | SI | DA VERIFICARE | DA VERIFICARE | Lista nativa letta dal layer NEXT; parity piena non dimostrata da questo audit. |
| Capo costi mezzo | `/next/capo/costi/:targa` -> `src/next/NextCapoCostiMezzoPage.tsx` | NO | NO | NO | NO | SI | NO | PARZIALE | Le approvazioni sono clone-local; il PDF timbrato usa ancora l'endpoint reale `stamp_pdf`. |
| Colleghi | `/next/colleghi` -> `src/next/NextColleghiPage.tsx` | NO | NO | NO | NO | SI | NO | PARZIALE | Aggiunta, modifica ed eliminazione agiscono solo nel clone. |
| Fornitori | `/next/fornitori` -> `src/next/NextFornitoriPage.tsx` | NO | NO | NO | NO | SI | NO | PARZIALE | Aggiunta, modifica ed eliminazione agiscono solo nel clone. |
| IA Libretto | `/next/ia/libretto` -> `src/next/NextIALibrettoPage.tsx` | NO | NO | NO | NO | SI | NO | PARZIALE | Preview e salvataggio del libretto restano clone-only. |
| IA Documenti | `/next/ia/documenti` -> `src/next/NextIADocumentiPage.tsx` | NO | NO | NO | NO | SI | NO | PARZIALE | Niente OCR/upload/salvataggio/import reale; tutto resta locale al clone. |
| IA Copertura Libretti | `/next/ia/copertura-libretti` -> `src/next/NextIACoperturaLibrettiPage.tsx` | NO | NO | NO | NO | SI | NO | PARZIALE | Repair e upload libretti sono clone-only. |
| Libretti Export | `/next/libretti-export` -> `src/next/NextLibrettiExportPage.tsx` | NO | NO | NO | NO | SI | DA VERIFICARE | DA VERIFICARE | Export e anteprima PDF sono presenti, ma la parity piena col modulo madre non e dimostrata. |
| Cisterna | `/next/cisterna` -> `src/next/NextCisternaPage.tsx` | NO | NO | NO | NO | SI | NO | PARZIALE | Alcuni parametri mensili vengono salvati solo nel clone. |
| Cisterna IA | `/next/cisterna/ia` -> `src/next/NextCisternaIAPage.tsx` | NO | NO | NO | NO | SI | NO | PARZIALE | Nessun provider reale, nessun upload reale, salvataggio solo locale. |
| Cisterna Schede Test | `/next/cisterna/schede-test` -> `src/next/NextCisternaSchedeTestPage.tsx` | NO | NO | NO | NO | SI | NO | PARZIALE | Estrazione IA e salvataggio sono simulati o locali al clone. |
| Autisti app | `/next/autisti/*` -> `src/next/autisti/NextAutistiCloneLayout.tsx` + pagine figlie | NO | NO | NO | NO | NO | NO | PARZIALE | Rifornimenti, segnalazioni, richieste, controlli e cambio mezzo restano locali al clone e non sincronizzano la madre. |
| Autisti inbox | `/next/autisti-inbox/*` -> pagine `src/next/autistiInbox/*` | NO | NO | NO | NO | NO | NO | PARZIALE | Runtime finale NEXT, ma flussi e bridge restano clone-local. |
| Autisti admin | `/next/autisti-admin` -> `src/next/NextAutistiAdminPage.tsx` | NO | NO | NO | NO | NO | NO | PARZIALE | Usa `NextLegacyStorageBoundary` e un admin bridge clone-only, non un layer NEXT pulito autosufficiente. |

## 6. Verifica assenza runtime madre
- `NextMotherPage` compare nel repo solo come file `src/next/NextMotherPage.tsx`; non risulta montata dalle route ufficiali del perimetro target.
- La ricerca testuale dei runtime NEXT non ha trovato import finali non-CSS da `src/pages/**`, `src/autisti/**` o `src/autistiInbox/**` nelle route ufficiali del perimetro target.
- Residuo non ufficiale trovato:
  - `src/next/NextCentroControlloClonePage.tsx` importa ancora `../pages/CentroControllo`, ma non e montata da `src/App.tsx`.
- Conclusione:
  - `assenza runtime madre nelle route ufficiali` = `SI`;
  - `autonomia reale del perimetro target` = `NO`.

## 7. Verifica parity esterna modulo per modulo
- `Inventario`, `Materiali consegnati`, `Gestione Operativa`: la madre espone azioni operative vere; nel clone tali azioni sono disabilitate.
- `Materiali da ordinare`, `Acquisti`, `Ordini`, `Dettaglio ordine`: il codice dichiara esplicitamente workflow `clone-only`, modifiche locali e PDF del clone.
- `Lavori`: apertura, modifica, esecuzione ed eliminazione sono locali al clone.
- `Mezzi / Dossier / Analisi Economica`: il perimetro e nativo ma varie azioni restano `read-only`, bloccate o locali al clone.
- `Capo costi`: le approvazioni non replicano il workflow madre, perche sono gestite in overlay clone; resta inoltre un aggancio al servizio reale `stamp_pdf`.
- `Colleghi` e `Fornitori`: CRUD solo locale al clone.
- `IA Libretto`, `IA Documenti`, `IA Copertura Libretti`: la madre ha flussi reali di upload/salvataggio/importazione; il clone resta preview o save locale.
- `Cisterna`, `Cisterna IA`, `Cisterna Schede Test`: la madre ha flussi reali di archivio/upload/estrazione; il clone resta parziale o locale.
- `Autisti / Inbox`: il mount finale non e piu legacy, ma i flussi restano locali al clone e non equivalenti alla madre operativa.

## 8. Verifica layer dati modulo per modulo
- Layer NEXT confermati come presenti:
  - snapshot e read model NEXT per inventario, materiali, procurement, lavori, anagrafiche, autisti, cisterna, costi/documenti.
- Layer NEXT non ancora sufficienti per dichiarare chiusura:
  - `NextLegacyStorageBoundary` continua a iniettare override legacy-shaped per Home e Autisti Admin;
  - diversi moduli usano overlay clone-local come writer sostitutivo al posto del comportamento madre;
  - la presenza di un layer NEXT non basta, da sola, a dimostrare parity operativa.
- Overlay clone-safe locali confermati:
  - procurement;
  - lavori;
  - colleghi;
  - fornitori;
  - IA documentale/libretti;
  - cisterna;
  - autisti app;
  - autisti inbox/admin.

## 9. Verifica madre intoccata
- `madre non modificata nel worktree corrente`: `SI`
  - evidenza: `git status --short -- src/pages src/autisti src/autistiInbox` -> vuoto;
  - evidenza: `git diff --name-only -- src/pages src/autisti src/autistiInbox` -> vuoto.
- `storia completa non modificata`: `NON DIMOSTRABILE` da questo audit puro sul worktree corrente.

## 10. Verdetto autonomia NEXT
- Verdetto obbligatorio: `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`.
- Motivo:
  - le route ufficiali non montano piu la madre, ma gran parte del perimetro target resta `PARZIALE` o `DA VERIFICARE`;
  - fuori perimetro non restano solo `Mezzo360 / Targa360` e `Autista360`: restano aperti anche moduli target che il prompt 42 dichiarava chiusi.

## 11. Punti `DA VERIFICARE`
- Home
- Centro di Controllo
- Dossier lista
- Dossier gomme
- Dossier rifornimenti
- Capo mezzi
- Libretti Export

## 12. Gap reali trovati
- documentazione ufficiale ancora contraddittoria:
  - `docs/product/STATO_MIGRAZIONE_NEXT.md` e `docs/product/MATRICE_ESECUTIVA_NEXT.md` riportano ancora chiusure del prompt 39 e prompt 42 non confermate dal codice reale;
  - `docs/audit/BACKLOG_GAP_AUDIT_FINALE_EXECUTION.md` segna il backlog come chiuso, ma il perimetro target non risulta chiuso nel senso richiesto dall'audit.
- gap runtime/parity residui nel perimetro target:
  - blocco di azioni operative in inventario/materiali;
  - writer clone-only in procurement, lavori, colleghi, fornitori;
  - preview/save locale nelle pagine IA documentali e cisterna;
  - flussi autisti e inbox ancora locali al clone;
  - boundary legacy-shaped ancora presenti in Home e Autisti Admin.

## 13. Verdetto finale netto
- Il prompt 42 ha chiuso un fatto tecnico importante: `nessuna route ufficiale del perimetro target monta piu la madre come runtime finale`.
- Il prompt 42 non ha chiuso il fatto che serviva per il verdetto finale: `parity esterna e autonomia reale del perimetro target`.
- Verdetto netto finale:
  - `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`.
